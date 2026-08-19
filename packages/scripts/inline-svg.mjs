// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
//  inline-svg.mjs =>
//  prepares an svg figure for inlining into the page
//
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
// An svg served through <img> is an isolated document: it cannot see the
// page's CSS custom properties or its webfonts. A figure that wants the
// site's foreground colour (and so follows the day/night toggle) or the site's
// mono stack therefore has to live in the DOM, like the chart components do.
//
// Inlining raw markup into a shared document has two hazards, and this module
// exists to remove both:
//
//   ids       — `url(#arw)` resolves document-wide, so two figures that both
//               define a marker called `arw` would collide, and the second
//               would silently draw with the first's marker.
//   <style>   — an svg <style> element inlined into an HTML document joins
//               that document's stylesheets. An unscoped `text {…}` rule would
//               restyle every other svg on the page, charts included.
//
// Both are fixed by namespacing: every id is prefixed, every internal
// reference is repointed, and every selector is scoped under the root's id.
//
// The transform is deliberately strict — anything it cannot scope with
// confidence throws rather than being passed through and silently breaking
// the page.

// Constructs that either can't be scoped or shouldn't be in a figure.
const FORBIDDEN = [
  [/<script[\s>]/i, '<script> is not allowed in an inlined figure'],
  [/<foreignObject[\s>]/i, '<foreignObject> is not allowed in an inlined figure'],
  [/\son\w+\s*=/i, 'inline event handlers are not allowed in an inlined figure'],
  [/@import\b/i, '@import is not allowed in an inlined figure'],
  // A remote reference in an inlined figure would be a request from the page
  // itself; keep figures self-contained.
  [/(?:xlink:)?href\s*=\s*["']\s*(?:https?:)?\/\//i, 'external references are not allowed'],
]

// Splits a CSS selector list on commas that sit at the top level, so
// `:is(a, b), c` yields ':is(a, b)' and 'c'.
const splitSelectorList = (selectors) => {
  const out = []
  let depth = 0
  let current = ''
  for (const char of selectors) {
    if (char === '(' || char === '[') depth += 1
    else if (char === ')' || char === ']') depth -= 1
    if (char === ',' && depth === 0) {
      out.push(current)
      current = ''
      continue
    }
    current += char
  }
  out.push(current)
  return out
}

// Rewrites a stylesheet so every rule only applies inside `#scopeId`.
// Conditional at-rules are recursed into; anything else at-rule shaped is
// refused, because prefixing its body would change what it means.
const scopeStylesheet = (css, scopeId) => {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let out = ''
  let rest = source

  while (rest.trim()) {
    const open = rest.indexOf('{')
    if (open === -1) {
      if (rest.trim()) throw new Error(`unparsable trailing css: "${rest.trim().slice(0, 40)}"`)
      break
    }

    const prelude = rest.slice(0, open).trim()

    // Find the matching close brace for this block.
    let depth = 0
    let close = -1
    for (let i = open; i < rest.length; i += 1) {
      if (rest[i] === '{') depth += 1
      else if (rest[i] === '}') {
        depth -= 1
        if (depth === 0) {
          close = i
          break
        }
      }
    }
    if (close === -1) throw new Error(`unbalanced braces in css near "${prelude.slice(0, 40)}"`)

    const body = rest.slice(open + 1, close)
    rest = rest.slice(close + 1)

    if (prelude.startsWith('@')) {
      // Conditional group rules wrap ordinary rules, so scope their contents.
      if (/^@(media|supports|layer|container)\b/i.test(prelude)) {
        out += `${prelude}{${scopeStylesheet(body, scopeId)}}`
        continue
      }
      throw new Error(`unsupported at-rule in an inlined figure: "${prelude.split(/\s/)[0]}"`)
    }

    const scoped = splitSelectorList(prelude)
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) =>
        // A rule targeting the root itself attaches to the id directly;
        // everything else becomes a descendant of it.
        selector === ':root' || selector === 'svg' ? `#${scopeId}` : `#${scopeId} ${selector}`,
      )
      .join(',')

    out += `${scoped}{${body.trim()}}`
  }

  return out
}

// Prepares `source` for inlining under the unique id `scopeId`.
// Returns the markup plus the intrinsic size, which the renderer needs to
// reserve the right aspect ratio before paint.
export const inlineSvg = (source, scopeId) => {
  if (!/^[A-Za-z][\w-]*$/.test(scopeId)) throw new Error(`invalid scope id: "${scopeId}"`)

  let svg = source
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim()

  for (const [pattern, message] of FORBIDDEN) {
    if (pattern.test(svg)) throw new Error(message)
  }

  const rootMatch = svg.match(/<svg\b[^>]*>/i)
  if (!rootMatch) throw new Error('no <svg> root element found')
  const root = rootMatch[0]
  if (/\sid\s*=/i.test(root)) throw new Error('the <svg> root must not carry an id of its own')

  // Namespace every declared id, then repoint the references to them. Doing
  // the declarations first means the reference pass can assert that every
  // `url(#x)` actually points at something this file defines.
  const declared = [...svg.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1])
  const unique = new Set(declared)
  if (unique.size !== declared.length) throw new Error('duplicate id in figure')

  const scopedId = (id) => `${scopeId}-${id}`

  svg = svg.replace(
    /(\sid\s*=\s*["'])([^"']+)(["'])/g,
    (_, pre, id, post) => pre + scopedId(id) + post,
  )

  svg = svg.replace(/url\(\s*#([^)\s"']+)\s*\)/g, (match, id) => {
    if (!unique.has(id)) throw new Error(`url(#${id}) has no matching id in the figure`)
    return `url(#${scopedId(id)})`
  })

  svg = svg.replace(/((?:xlink:)?href\s*=\s*["'])#([^"']+)(["'])/g, (match, pre, id, post) => {
    if (!unique.has(id)) throw new Error(`href="#${id}" has no matching id in the figure`)
    return pre + '#' + scopedId(id) + post
  })

  // Scope the stylesheet(s) to the root id so the rules stay inside the figure.
  svg = svg.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_, open, css, close) => open + scopeStylesheet(css, scopeId) + close,
  )

  // Tag the root last, so the id pass above can't see (and re-prefix) it.
  svg = svg.replace(/<svg\b/i, `<svg id="${scopeId}"`)

  const num = (attr) => {
    const found = root.match(new RegExp(`\\s${attr}\\s*=\\s*["']([\\d.]+)`, 'i'))
    return found ? Number(found[1]) : undefined
  }
  let width = num('width')
  let height = num('height')
  if (width === undefined || height === undefined) {
    const viewBox = root.match(/\sviewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/i)
    if (!viewBox) throw new Error('figure needs width/height attributes or a viewBox')
    width = Number(viewBox[1])
    height = Number(viewBox[2])
  }

  return {markup: svg, width, height}
}

// True for an svg that references CSS custom properties, and so has to be
// inlined to resolve them — served through <img> its var()s would all fall
// back. Figures without them are ordinary images and keep the upload path.
export const needsInlining = (source) => /var\(\s*--/.test(source)
