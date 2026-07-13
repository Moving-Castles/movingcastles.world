#!/usr/bin/env node
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
//  publish-report.mjs =>
//  compiles a markdown report to a Sanity post document
//
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
// The markdown file is the source of truth; this script re-renders it into
// Portable Text (including the site's custom blocks) and writes it to Sanity.
// Re-running updates the same document, so the loop is:
// edit markdown -> run script -> review draft in the Studio.
//
// Usage:
//   node publish-report.mjs <report.md> [options]
//
//   --dry-run [out.json]  Compile only. Writes the document JSON to out.json
//                         (or stdout) and replaces image uploads with local
//                         /report-assets/ URLs so the result can be rendered
//                         without touching Sanity.
//   --publish             Write the published document instead of the draft.
//   --slug <slug>         Override the slug (defaults to frontmatter, then a
//                         slugified title).
//
// Writing requires SANITY_TOKEN (a token with write access) in the env.
//
// Frontmatter (optional):
//   title, slug, date (YYYY-MM-DD), metaDescription,
//   authors: [{name, url?}, ...]
// Without frontmatter the title comes from the first `# H1` and the date
// defaults to today.
//
// Content mapping:
//   ## .. ####          -> block styles h2..h4
//   paragraph marks     -> strong / em / code / link markDefs
//   > quote             -> blockquote blocks
//   > [!NOTE] etc.      -> stripped (GitHub callouts are working notes)
//   --- (thematic break)-> hr block
//   lists               -> bullet / number list blocks (nested levels kept)
//   GFM table           -> table block (cells flattened to plain text)
//   ![alt](figures/..)  -> image block (uploaded to Sanity, alt -> caption)
//   ```chart fence      -> chart block; YAML config, data loaded from CSV:
//                            type: line | histogram
//                            data: data/loss.csv     (path relative to the md)
//                            x: global_step          (line: x column)
//                            y: loss | [loss, ...]   (line: y column(s))
//                            labels: {loss: Loss}    (line: column -> display label)
//                            bands: [{y0, y1, label}] (line: horizontal reference bands)
//                            yMin: 0                 (line: pin the y-axis floor)
//                            value: length           (histogram: value column)
//                            bins: 20                (histogram: bin count)
//                            clip: p99 | 150         (histogram: drop values above a
//                                                     percentile or number before binning)
//                            xLabel / yLabel / caption
//   ```transcript fence -> transcript block ("Label: value" per line;
//                          lines without a colon continue the previous value)
//   ```csv fence        -> table block (first row is the header); inline data,
//                          or a file via the fence meta: ```csv data/foo.csv
//   <details>           -> expandable section: everything up to </details>
//     <summary>…</summary> compiles into the block's nested content (one
//                          level deep; the summary is the toggle line)
//   ```references fence -> the post `references` field (end notes). YAML list:
//                            - id: askell2021      (citation key)
//                              label: Askell et al. (in-text label)
//                              year: 2021
//                              text: Askell et al (2021), A General Language …
//                              url: https://…       (optional)
//   [@id] / @id         -> citations linking to the end note: [@id] renders
//                          the parenthetical "(Label, Year)", bare @id the
//                          narrative "Label (Year)". Unknown [@id] keys fail
//                          the run; uncited references are warned about.
//   anything else       -> warned about and skipped

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'
import {fileURLToPath} from 'node:url'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkFrontmatter from 'remark-frontmatter'
import {toString as mdToString} from 'mdast-util-to-string'
import YAML from 'yaml'
import {createClient} from '@sanity/client'

// Pick up SANITY_TOKEN (and optional overrides) from the repo-root .env.
// Variables already present in the environment take precedence.
try {
  process.loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)))
} catch {
  // No .env file — the environment may provide the token directly.
}

const SANITY_PROJECT = process.env.SANITY_PROJECT ?? '610gfr7y'
const SANITY_DATASET = process.env.SANITY_DATASET ?? 'production'

// * * * cli * * *

const args = process.argv.slice(2)
const mdPath = args.find((a) => !a.startsWith('--'))
const dryRun = args.includes('--dry-run')
const publish = args.includes('--publish')
const outPath = dryRun ? args[args.indexOf('--dry-run') + 1] : undefined
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : undefined

if (!mdPath) {
  console.error('Usage: node publish-report.mjs <report.md> [--dry-run [out.json]] [--publish]')
  process.exit(1)
}

const mdDir = path.dirname(path.resolve(mdPath))
const source = fs.readFileSync(mdPath, 'utf8')

const warnings = []
const warn = (message) => warnings.push(message)

// * * * stable keys * * *

// Portable Text keys are derived from content, so unchanged blocks keep their
// keys across runs and the Sanity history diffs stay readable.
const keyCounts = new Map()
const makeKey = (seed) => {
  const base = crypto.createHash('sha1').update(seed).digest('hex').slice(0, 8)
  const count = keyCounts.get(base) ?? 0
  keyCounts.set(base, count + 1)
  return count === 0 ? base : `${base}-${count}`
}

// * * * csv * * *

// Minimal quote-aware CSV parser; returns an array of row objects keyed by
// the header row.
const parseCsv = (text) => {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  row.push(field)
  if (row.length > 1 || row[0] !== '') rows.push(row)

  const [header, ...rest] = rows
  return rest.map((cells) => Object.fromEntries(header.map((name, i) => [name, cells[i] ?? ''])))
}

const loadCsv = (relPath) => {
  const file = path.resolve(mdDir, relPath)
  if (!fs.existsSync(file)) throw new Error(`data file not found: ${relPath}`)
  return parseCsv(fs.readFileSync(file, 'utf8'))
}

// Trim floats so chart payloads stay small; five significant digits is more
// resolution than a 640px-wide plot can show.
const round = (value) => Number(Number(value).toPrecision(5))

// * * * inline content -> spans * * *

const span = (text, marks) => ({
  _type: 'span',
  _key: makeKey(`s:${text}:${marks.join(',')}`),
  text,
  marks: [...marks],
})

// Reference-style links ([text][label] + [label]: url) resolve through the
// document's definition nodes.
const definitions = new Map()
const collectDefinitions = (node) => {
  if (node.type === 'definition') definitions.set(node.identifier, node)
  node.children?.forEach(collectDefinitions)
}

// In-text citations: [@id] renders the parenthetical "(Label, Year)", bare
// @id the narrative "Label (Year)". Both carry a `cite` mark anchor-linking
// to the end note rendered from the post's references field.
const citeSpans = (id, narrative, marks, spans, markDefs) => {
  const ref = refsById.get(id)
  const markKey = makeKey(`cite:${id}`)
  markDefs.push({_type: 'cite', _key: markKey, refId: id})
  citedIds.add(id)
  const text = narrative ? `${ref.label} (${ref.year})` : `(${ref.label}, ${ref.year})`
  spans.push(span(text, [...marks, markKey]))
}

// Citations inside table cells flatten to their plain-text form (cells are
// plain strings, so no link).
const expandCitationsPlain = (text) =>
  text
    .replace(/\[@([A-Za-z0-9][A-Za-z0-9_-]*)\]/g, (match, id) => {
      const ref = refsById.get(id)
      if (!ref) return match
      citedIds.add(id)
      return `(${ref.label}, ${ref.year})`
    })
    .replace(/@([A-Za-z0-9][A-Za-z0-9_-]*)/g, (match, id) => {
      const ref = refsById.get(id)
      if (!ref) return match
      citedIds.add(id)
      return `${ref.label} (${ref.year})`
    })

const phrasingToSpans = (nodes, marks, spans, markDefs) => {
  for (const node of nodes) {
    switch (node.type) {
      case 'text': {
        // Citation markers: [@id] renders the parenthetical form, bare @id
        // the narrative one. Bare ids only count when they name a known
        // reference — any other "@…" text passes through untouched — while
        // an unknown bracketed [@id] is treated as a typo and fails the run.
        const pattern = /\[@([A-Za-z0-9][A-Za-z0-9_-]*)\]|@([A-Za-z0-9][A-Za-z0-9_-]*)/g
        let last = 0
        for (const match of node.value.matchAll(pattern)) {
          const bracketed = match[1] !== undefined
          const id = match[1] ?? match[2]
          if (!refsById.has(id)) {
            if (bracketed) citationErrors.push(`unknown citation key "[@${id}]"`)
            continue
          }
          if (match.index > last) spans.push(span(node.value.slice(last, match.index), marks))
          citeSpans(id, !bracketed, marks, spans, markDefs)
          last = match.index + match[0].length
        }
        if (last < node.value.length) spans.push(span(node.value.slice(last), marks))
        break
      }
      case 'strong':
        phrasingToSpans(node.children, [...marks, 'strong'], spans, markDefs)
        break
      case 'emphasis':
        phrasingToSpans(node.children, [...marks, 'em'], spans, markDefs)
        break
      case 'inlineCode':
        spans.push(span(node.value, [...marks, 'code']))
        break
      case 'delete':
        warn(`strikethrough not supported, kept as plain text: "${mdToString(node)}"`)
        phrasingToSpans(node.children, marks, spans, markDefs)
        break
      case 'break':
        spans.push(span('\n', marks))
        break
      case 'link':
      case 'linkReference': {
        // [@id] parses as a shortcut link reference whose label starts with
        // "@" — that's a parenthetical citation, not a link.
        if (node.type === 'linkReference' && (node.label ?? node.identifier).startsWith('@')) {
          const id = (node.label ?? node.identifier).slice(1)
          if (refsById.has(id)) {
            citeSpans(id, false, marks, spans, markDefs)
          } else {
            citationErrors.push(`unknown citation key "[@${id}]"`)
            spans.push(span(`[@${id}]`, marks))
          }
          break
        }
        const url = node.type === 'link' ? node.url : definitions.get(node.identifier)?.url
        if (!url) {
          warn(`unresolved link reference "${node.identifier}"`)
          phrasingToSpans(node.children, marks, spans, markDefs)
          break
        }
        const key = makeKey(`link:${url}`)
        markDefs.push({_type: 'link', _key: key, href: url})
        phrasingToSpans(node.children, [...marks, key], spans, markDefs)
        break
      }
      case 'image':
        warn(`inline image inside a paragraph skipped: ${node.url}`)
        break
      case 'html':
        warn(`inline html skipped: ${node.value.slice(0, 40)}`)
        break
      case 'footnoteReference':
        warn(`footnote reference [^${node.identifier}] skipped`)
        break
      default:
        warn(`unhandled inline node "${node.type}", flattened to text`)
        spans.push(span(mdToString(node), marks))
    }
  }
}

const textBlock = (node, style, extra = {}) => {
  const markDefs = []
  const spans = []
  phrasingToSpans(node.children ?? [], [], spans, markDefs)
  if (!spans.length) spans.push(span('', []))
  return {
    _type: 'block',
    _key: makeKey(`b:${style}:${mdToString(node)}`),
    style,
    markDefs,
    children: spans,
    ...extra,
  }
}

// * * * images * * *

const uploadCachePath = path.join(mdDir, '.sanity-upload-cache.json')
const uploadCache = fs.existsSync(uploadCachePath)
  ? JSON.parse(fs.readFileSync(uploadCachePath, 'utf8'))
  : {}

let client = null
const getClient = () => {
  if (client) return client
  const token = process.env.SANITY_TOKEN
  if (!token) {
    console.error('SANITY_TOKEN is required to upload (use --dry-run to compile without it).')
    process.exit(1)
  }
  client = createClient({
    projectId: SANITY_PROJECT,
    dataset: SANITY_DATASET,
    apiVersion: '2026-01-01',
    token,
    useCdn: false,
  })
  return client
}

const imageBlock = async (node) => {
  const rel = node.url.replace(/^\//, '')
  const file = path.resolve(mdDir, rel)
  if (!fs.existsSync(file)) {
    warn(`image not found, skipped: ${node.url}`)
    return null
  }
  const caption = node.alt?.trim() || undefined

  let asset
  if (dryRun) {
    // Local placeholder so a dry-run document renders without Sanity.
    asset = {url: `/report-assets/${path.basename(file)}`}
  } else {
    const sha = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
    if (!uploadCache[sha]) {
      console.log(`uploading ${rel}…`)
      const uploaded = await getClient().assets.upload('image', fs.createReadStream(file), {
        filename: path.basename(file),
      })
      uploadCache[sha] = uploaded._id
      fs.writeFileSync(uploadCachePath, JSON.stringify(uploadCache, null, 2))
    }
    asset = {_type: 'reference', _ref: uploadCache[sha]}
  }

  return {
    _type: 'image',
    _key: makeKey(`img:${rel}`),
    asset,
    ...(caption && {caption}),
  }
}

// * * * fences * * *

const chartBlock = (node) => {
  const config = YAML.parse(node.value)
  if (!config?.type) throw new Error('chart fence needs a `type`')
  const rows = config.data ? loadCsv(config.data) : []
  // Empty cells (wandb leaves gaps in its exports) must drop out as NaN —
  // Number('') would silently turn them into 0.
  const numeric = (row, column) => {
    const value = row[column]
    return value === undefined || value.trim() === '' ? NaN : Number(value)
  }

  let payload
  let xLabel = config.xLabel
  let yLabel = config.yLabel

  if (config.type === 'line') {
    const xCol = config.x ?? Object.keys(rows[0] ?? {})[0]
    if (!xCol) throw new Error('line chart needs data with columns')
    const yCols = Array.isArray(config.y) ? config.y : config.y ? [config.y] : undefined
    if (!yCols) throw new Error('line chart needs `y` (a column name or list)')
    const series = yCols.map((column) => ({
      // `labels` maps column names to display labels for the legend/tooltip.
      label: config.labels?.[column] ?? column,
      points: rows
        .map((row) => [numeric(row, xCol), numeric(row, column)])
        .filter((p) => p.every(Number.isFinite))
        .sort((a, b) => a[0] - b[0])
        .map((p) => [round(p[0]), round(p[1])]),
    }))
    if (series.some((s) => !s.points.length)) throw new Error('line chart series came out empty')
    payload = {series}
    // Horizontal reference bands (e.g. a noise floor): [{y0, y1, label?}].
    if (config.bands) {
      payload.bands = config.bands.map((band) => {
        const y0 = Number(band?.y0)
        const y1 = Number(band?.y1)
        if (!Number.isFinite(y0) || !Number.isFinite(y1) || y1 <= y0) {
          throw new Error(`line chart band needs numeric y0 < y1, got ${JSON.stringify(band)}`)
        }
        return {y0: round(y0), y1: round(y1), ...(band.label && {label: band.label})}
      })
    }
    // yMin pins the bottom of the y axis (typically 0).
    if (config.yMin !== undefined) {
      if (!Number.isFinite(Number(config.yMin))) throw new Error('`yMin` must be a number')
      payload.options = {yMin: Number(config.yMin)}
    }
    xLabel ??= xCol
    yLabel ??= yCols.length === 1 ? yCols[0] : undefined
  } else if (config.type === 'histogram') {
    const column = config.value ?? config.x
    if (!column) throw new Error('histogram needs `value` (the column to bin)')
    let values = rows.map((row) => numeric(row, column)).filter(Number.isFinite)
    if (!values.length) throw new Error(`histogram column "${column}" has no numeric values`)
    if (config.clip !== undefined) {
      const limit =
        typeof config.clip === 'string' && /^p\d+(\.\d+)?$/.test(config.clip)
          ? quantile(values, Number(config.clip.slice(1)) / 100)
          : Number(config.clip)
      if (!Number.isFinite(limit)) {
        throw new Error(
          `histogram \`clip\` must be a number or pNN percentile, got "${config.clip}"`,
        )
      }
      const kept = values.filter((v) => v <= limit)
      if (!kept.length) throw new Error(`histogram clip ${config.clip} drops every value`)
      if (kept.length < values.length) {
        warn(
          `histogram clip ${config.clip} (${round(limit)}): ` +
            `${values.length - kept.length} of ${values.length} values above the limit dropped`,
        )
      }
      values = kept
    }
    payload = {bins: binValues(values, config.bins ?? 20)}
    xLabel ??= column
    yLabel ??= 'count'
  } else {
    throw new Error(`unknown chart type "${config.type}"`)
  }

  return {
    _type: 'chart',
    _key: makeKey(`chart:${node.value}`),
    chartType: config.type,
    data: JSON.stringify(payload),
    ...(xLabel && {xLabel}),
    ...(yLabel && {yLabel}),
    ...(config.caption && {caption: config.caption}),
  }
}

// Linear-interpolated quantile (numpy's default method).
const quantile = (values, q) => {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.min(lo + 1, sorted.length - 1)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

// Uniform bins on nice (1/2/5 x 10^k) boundaries.
const binValues = (values, targetBins) => {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [{x0: min, x1: min + 1, count: values.length}]
  const rawStep = (max - min) / targetBins
  const pow = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rawStep) ?? rawStep
  const start = Math.floor(min / step) * step
  const count = Math.ceil((max - start) / step) || 1
  const bins = Array.from({length: count}, (_, i) => ({
    x0: round(start + i * step),
    x1: round(start + (i + 1) * step),
    count: 0,
  }))
  for (const value of values) {
    const index = Math.min(Math.floor((value - start) / step), count - 1)
    bins[index].count++
  }
  return bins
}

const transcriptBlock = (node) => {
  const lines = []
  for (const raw of node.value.split('\n')) {
    if (!raw.trim()) continue
    const match = raw.match(/^([^:]+):\s?(.*)$/)
    if (match) {
      lines.push({
        _type: 'line',
        _key: makeKey(`tl:${raw}`),
        label: match[1].trim(),
        value: match[2],
      })
    } else if (lines.length) {
      lines[lines.length - 1].value += `\n${raw}`
    } else {
      warn(`transcript line without a label skipped: "${raw}"`)
    }
  }
  return {_type: 'transcript', _key: makeKey(`t:${node.value}`), lines}
}

// * * * document walk * * *

const tree = unified().use(remarkParse).use(remarkGfm).use(remarkFrontmatter).parse(source)
collectDefinitions(tree)

const frontmatter =
  tree.children[0]?.type === 'yaml' ? (YAML.parse(tree.children[0].value) ?? {}) : {}

// * * * references * * *

// The bibliography is read from ```references fences before the main walk,
// since citations appear in the text ahead of the fence.
const references = []
const refsById = new Map()
const citedIds = new Set()
const citationErrors = []

for (const node of tree.children) {
  if (node.type !== 'code' || node.lang !== 'references') continue
  for (const entry of YAML.parse(node.value) ?? []) {
    for (const field of ['id', 'label', 'year', 'text']) {
      if (!entry?.[field]) {
        console.error(`references entry missing \`${field}\`: ${JSON.stringify(entry)}`)
        process.exit(1)
      }
    }
    if (refsById.has(entry.id)) {
      console.error(`duplicate reference id "${entry.id}"`)
      process.exit(1)
    }
    const ref = {...entry, year: String(entry.year)}
    references.push(ref)
    refsById.set(ref.id, ref)
  }
}

let title = frontmatter.title

const isCallout = (node) =>
  /^\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION)\]/.test(mdToString(node.children?.[0] ?? {}).trim())

// ```csv fences render as table blocks (handy for data appendices inside
// expandable sections). The fence body holds the data inline, or the fence
// meta names a file (```csv data/foo.csv) so a chart can share the same csv.
const csvTableBlock = (node) => {
  const rows = node.meta?.trim() ? loadCsv(node.meta.trim()) : parseCsv(node.value)
  const header = Object.keys(rows[0] ?? {})
  if (!header.length) throw new Error('csv fence is empty')
  return {
    _type: 'table',
    _key: makeKey(`csvtable:${node.value}`),
    header,
    rows: rows.map((row) => ({
      _type: 'row',
      _key: makeKey(`row:${header.map((h) => row[h]).join('|')}`),
      cells: header.map((h) => row[h]),
    })),
  }
}

// Compiles a run of mdast nodes to Portable Text blocks. `top` marks the
// document level, where the leading H1 becomes the post title and <details>
// sections may open (they nest exactly one level).
const walkNodes = async (nodes, top) => {
  const out = []

  const walkList = (list, level) => {
    for (const item of list.children) {
      for (const child of item.children) {
        if (child.type === 'paragraph') {
          out.push(
            textBlock(child, 'normal', {listItem: list.ordered ? 'number' : 'bullet', level}),
          )
        } else if (child.type === 'list') {
          walkList(child, level + 1)
        } else {
          warn(`unhandled node "${child.type}" inside a list item, skipped`)
        }
      }
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    switch (node.type) {
      case 'yaml':
      case 'definition':
        break
      case 'heading': {
        // The leading H1 is the post title (frontmatter `title` wins), not body content.
        if (top && node.depth === 1 && (!title || (mdToString(node) === title && !out.length))) {
          title ??= mdToString(node)
          break
        }
        if (node.depth > 4) warn(`h${node.depth} flattened to h4: "${mdToString(node)}"`)
        out.push(textBlock(node, `h${Math.min(Math.max(node.depth, 1), 4)}`))
        break
      }
      case 'paragraph': {
        const images = node.children.filter((c) => c.type === 'image')
        const rest = node.children.filter(
          (c) => c.type !== 'image' && !(c.type === 'text' && !c.value.trim()),
        )
        if (images.length && !rest.length) {
          for (const image of images) {
            const block = await imageBlock(image)
            if (block) out.push(block)
          }
        } else {
          out.push(textBlock(node, 'normal'))
        }
        break
      }
      case 'blockquote': {
        if (isCallout(node)) {
          warn(`callout stripped: "${mdToString(node).slice(0, 60).replace(/\n/g, ' ')}…"`)
          break
        }
        for (const child of node.children) {
          if (child.type === 'paragraph') out.push(textBlock(child, 'blockquote'))
          else warn(`unhandled node "${child.type}" inside a blockquote, skipped`)
        }
        break
      }
      case 'thematicBreak':
        out.push({
          _type: 'block',
          _key: makeKey('hr'),
          style: 'hr',
          markDefs: [],
          children: [span('', [])],
        })
        break
      case 'list':
        walkList(node, 1)
        break
      case 'table': {
        const rows = node.children.map((row) =>
          row.children.map((cell) => expandCitationsPlain(mdToString(cell))),
        )
        const [header, ...rest] = rows
        out.push({
          _type: 'table',
          _key: makeKey(`table:${JSON.stringify(rows)}`),
          header,
          rows: rest.map((cells) => ({
            _type: 'row',
            _key: makeKey(`row:${cells.join('|')}`),
            cells,
          })),
        })
        break
      }
      case 'code': {
        try {
          if (node.lang === 'chart') out.push(chartBlock(node))
          else if (node.lang === 'transcript') out.push(transcriptBlock(node))
          else if (node.lang === 'csv') out.push(csvTableBlock(node))
          else if (node.lang === 'references')
            break // extracted in the pre-pass
          else warn(`code fence (lang "${node.lang ?? 'none'}") skipped`)
        } catch (error) {
          console.error(`Error in ${node.lang} fence: ${error.message}`)
          process.exit(1)
        }
        break
      }
      case 'html': {
        // <details><summary>…</summary> … </details> becomes an expandable
        // section: the markdown nodes up to the closing tag compile into the
        // block's nested content.
        if (/^<details>/i.test(node.value.trim())) {
          if (!top) {
            warn('nested <details> not supported, skipped')
            break
          }
          let end = i + 1
          while (
            end < nodes.length &&
            !(nodes[end].type === 'html' && /^<\/details>/i.test(nodes[end].value.trim()))
          ) {
            end++
          }
          if (end === nodes.length) {
            warn('<details> without closing tag, skipped')
            break
          }
          const summary =
            node.value.match(/<summary>([\s\S]*?)<\/summary>/i)?.[1]?.trim() || 'Details'
          const content = await walkNodes(nodes.slice(i + 1, end), false)
          out.push({
            _type: 'details',
            _key: makeKey(`details:${summary}`),
            summary,
            content,
          })
          i = end
          break
        }
        warn(`html skipped: ${node.value.trim().slice(0, 50).replace(/\n/g, ' ')}`)
        break
      }
      default:
        warn(`unhandled ${top ? 'top-level ' : ''}node "${node.type}", skipped`)
    }
  }

  return out
}

const blocks = await walkNodes(tree.children, true)

// * * * document * * *

if (citationErrors.length) {
  for (const message of citationErrors) console.error(`✗ ${message}`)
  process.exit(1)
}
for (const ref of references) {
  if (!citedIds.has(ref.id)) warn(`reference "${ref.id}" is never cited`)
}

if (!title) {
  console.error('No title: add frontmatter or a leading # heading.')
  process.exit(1)
}

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const slug = slugArg ?? frontmatter.slug ?? slugify(title)

const doc = {
  _id: publish ? `post-${slug}` : `drafts.post-${slug}`,
  _type: 'post',
  title,
  slug: {_type: 'slug', current: slug},
  date: frontmatter.date
    ? String(frontmatter.date).slice(0, 10)
    : new Date().toISOString().slice(0, 10),
  ...(frontmatter.authors && {
    authors: frontmatter.authors.map((author) => ({
      _type: 'author',
      _key: makeKey(`a:${author.name}`),
      name: author.name,
      ...(author.url && {url: author.url}),
    })),
  }),
  ...(references.length && {
    references: references.map((ref) => ({
      _type: 'refItem',
      _key: makeKey(`ref:${ref.id}`),
      id: ref.id,
      label: ref.label,
      year: ref.year,
      text: ref.text,
      ...(ref.url && {url: ref.url}),
    })),
  }),
  ...(frontmatter.metaDescription && {metaDescription: frontmatter.metaDescription}),
  content: {_type: 'contentEditor', content: blocks},
}

// * * * report + write * * *

const counts = blocks.reduce((acc, b) => {
  const kind = b._type === 'block' ? (b.listItem ? 'list item' : b.style) : b._type
  acc[kind] = (acc[kind] ?? 0) + 1
  return acc
}, {})
console.error(
  `"${title}" -> ${publish ? '' : 'drafts.'}post-${slug} (${SANITY_PROJECT}/${SANITY_DATASET})`,
)
console.error(
  Object.entries(counts)
    .map(([kind, n]) => `${n} ${kind}`)
    .join(', '),
)
if (references.length) {
  console.error(`${references.length} references, ${citedIds.size} cited`)
}
for (const message of warnings) console.error(`⚠ ${message}`)

if (dryRun) {
  const json = JSON.stringify(doc, null, 2)
  if (outPath) {
    fs.writeFileSync(outPath, json)
    console.error(`wrote ${outPath}`)
  } else {
    console.log(json)
  }
} else {
  await getClient().createOrReplace(doc)
  console.error(`${publish ? 'published' : 'draft written'} ✓`)
}
