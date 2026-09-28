#!/usr/bin/env node
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
//  create-micro-site.mjs =>
//  scaffolds a micro-site: package, Sanity document, Netlify project
//
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
// A micro-site is a one-page SvelteKit site in packages/micro-sites/<name>,
// deployed as its own Netlify project and rendering the `microSite` document
// whose slug is <name>. This script sets one up end to end:
//
//   1. package     copies an existing micro-site (--from) to
//                  packages/micro-sites/<name>, rewrites its name and domain,
//                  and runs pnpm install. Copying a working site rather than
//                  a template means the copy starts type-checked and on
//                  current dependencies.
//   2. document    creates the Sanity document as a draft, with the title and
//                  slug filled in.
//   3. netlify     creates the Netlify project, linked to this repo the way
//                  the main site's is (same GitHub app installation and
//                  branch), with the package as its package directory. The
//                  build settings themselves are in the package's
//                  netlify.toml.
//   4. build hook  adds a build hook to the project.
//   5. webhook     adds a Sanity webhook that calls the build hook when the
//                  document is published or updated.
//
// Every step looks before it acts and skips what already exists, so a re-run
// finishes a partial setup (e.g. --local first, the rest later).
//
// Usage:
//   pnpm create:micro-site <name> [options]
//
//   <name>           kebab-case, e.g. character-design: the package is
//                    @micro-sites/<name>, the document slug <name>, the
//                    Netlify project movingcastles-<name>.
//   --title <title>  document title (default: the name, title-cased)
//   --domain <host>  public hostname (default: <name>.movingcastles.world)
//   --from <site>    micro-site to copy (default: character-design)
//   --local          create the package only; skip Sanity and Netlify
//   --dry-run        report what would be done and change nothing (remote
//                    state is still read, to report it accurately)
//
// Needs the Netlify CLI, logged in (`netlify login`), and a Sanity CLI login
// (`pnpm --filter cms exec sanity login`): the script borrows both sessions.
// The Sanity login must be allowed to manage webhooks (a project admin).
//
// Left to do by hand: the custom domain (Netlify → Domain management) and
// publishing the document, which triggers the first successful build.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {createClient} from '@sanity/client'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const MICRO_SITES = path.join(ROOT, 'packages/micro-sites')

const SANITY_PROJECT = '610gfr7y'
const SANITY_DATASET = 'production'
// The main site's Netlify project. New projects copy its repo link, so the
// GitHub app installation id isn't hardcoded here.
const MAIN_NETLIFY_SITE = 'cbc48978-7309-4c28-b604-4815287bdd04'
const BUILD_HOOK_TITLE = 'Sanity publish'

// Not copied from the source site: dependencies and build output.
const COPY_IGNORE = new Set(['node_modules', '.svelte-kit', 'build', '.netlify', '.DS_Store'])
// Files the name and domain are rewritten in; everything else (the favicon)
// is copied verbatim.
const TEXT_EXTENSIONS = new Set(['.ts', '.js', '.json', '.svelte', '.css', '.html', '.md', '.toml'])

// * * * cli * * *

const {values: options, positionals} = parseArgs({
  allowPositionals: true,
  options: {
    title: {type: 'string'},
    domain: {type: 'string'},
    from: {type: 'string', default: 'character-design'},
    local: {type: 'boolean', default: false},
    'dry-run': {type: 'boolean', default: false},
    help: {type: 'boolean', short: 'h', default: false},
  },
})

const USAGE =
  'Usage: pnpm create:micro-site <name> [--title <title>] [--domain <host>] [--from <site>] [--local] [--dry-run]'

const name = positionals[0]
if (options.help || !name) {
  console.log(USAGE)
  process.exit(options.help ? 0 : 1)
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  fail(`"${name}" is not a kebab-case name (lowercase letters, digits and single hyphens).`)
}

const dryRun = options['dry-run']
const title =
  options.title ??
  name.replace(/(^|-)([a-z0-9])/g, (_, dash, c) => (dash ? ' ' : '') + c.toUpperCase())
const domain = options.domain ?? `${name}.movingcastles.world`
const packagePath = `packages/micro-sites/${name}`
const siteDir = path.join(ROOT, packagePath)
const netlifyName = `movingcastles-${name}`

// * * * output * * *

function fail(message) {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

const step = (label) => console.log(`\n${label}`)
const done = (message) => console.log(`  ✓ ${message}`)
const skip = (message) => console.log(`  – ${message}`)
const would = (message) => console.log(`  ○ would ${message}`)

// * * * 1. package * * *

// `name` as a whole word: not inside a longer name, so copying from "design"
// would leave "designer" alone.
const wordPattern = (word) =>
  new RegExp(`(?<![a-z0-9-])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9-])`, 'g')

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(file)
    else yield file
  }
}

function createPackage() {
  step(`1. package   ${packagePath}`)
  if (fs.existsSync(siteDir)) {
    skip('exists, left as is')
    return
  }

  const fromDir = path.join(MICRO_SITES, options.from)
  const fromSiteFile = path.join(fromDir, 'src/lib/site.ts')
  if (!fs.existsSync(fromSiteFile)) {
    fail(`--from ${options.from}: no micro-site at packages/micro-sites/${options.from}.`)
  }
  const fromDomain = fs
    .readFileSync(fromSiteFile, 'utf8')
    .match(/SITE_URL = 'https:\/\/([^'/]+)'/)?.[1]
  if (!fromDomain) fail(`Could not read SITE_URL from ${path.relative(ROOT, fromSiteFile)}.`)

  if (dryRun) {
    would(`copy packages/micro-sites/${options.from}, renaming "${options.from}" to "${name}"`)
    would(`replace ${fromDomain} with ${domain}`)
    would('run pnpm install')
    return
  }

  fs.cpSync(fromDir, siteDir, {
    recursive: true,
    filter: (source) => !COPY_IGNORE.has(path.basename(source)),
  })

  // The domain first: it usually contains the name.
  const fromDomainPattern = wordPattern(fromDomain)
  const fromNamePattern = wordPattern(options.from)
  for (const file of walk(siteDir)) {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) continue
    const source = fs.readFileSync(file, 'utf8')
    const rewritten = source.replace(fromDomainPattern, domain).replace(fromNamePattern, name)
    if (rewritten !== source) fs.writeFileSync(file, rewritten)
  }

  const siteFile = fs.readFileSync(path.join(siteDir, 'src/lib/site.ts'), 'utf8')
  if (!siteFile.includes(`SITE_SLUG = '${name}'`) || !siteFile.includes(`https://${domain}'`)) {
    fail(`Rewriting src/lib/site.ts went wrong; check ${packagePath} by hand.`)
  }
  done(`copied from packages/micro-sites/${options.from}`)

  // A plain install takes pnpm's frozen-lockfile fast path, which records the
  // new package but doesn't link its bins (svelte-kit, vite): `prepare` fails.
  execFileSync('pnpm', ['install', '--no-prefer-frozen-lockfile'], {cwd: ROOT, stdio: 'inherit'})
  done('installed')
}

// * * * sanity * * *

let sanityToken
function getSanityToken() {
  if (sanityToken) return sanityToken
  // The CLI login's own token rather than the SANITY_TOKEN in .env: managing
  // webhooks takes project-level rights, which a dataset token may not have.
  // `debug --secrets` is the CLI's documented way to show it.
  let output
  try {
    output = execFileSync('pnpm', ['--filter', 'cms', 'exec', 'sanity', 'debug', '--secrets'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch {
    fail('`sanity debug --secrets` failed. Log in with `pnpm --filter cms exec sanity login`.')
  }
  sanityToken = output.match(/Auth token:\s+(\S+)/)?.[1]
  if (!sanityToken) {
    fail('Not logged in to Sanity. Log in with `pnpm --filter cms exec sanity login`.')
  }
  return sanityToken
}

// Resolves to whether the document is published.
async function createDocument() {
  step(`2. document  microSite "${name}"`)
  const client = createClient({
    projectId: SANITY_PROJECT,
    dataset: SANITY_DATASET,
    apiVersion: '2026-01-01',
    token: getSanityToken(),
    useCdn: false,
    // Drafts as well as published documents.
    perspective: 'raw',
  })
  const existing = await client.fetch(`*[_type == "microSite" && slug.current == $slug]._id`, {
    slug: name,
  })
  if (existing.length) {
    skip(`exists (${existing.join(', ')})`)
    return existing.some((id) => !id.startsWith('drafts.'))
  }
  // Publishing turns drafts.microSite-<name> into microSite-<name>.
  const document = {
    _id: `drafts.microSite-${name}`,
    _type: 'microSite',
    title,
    slug: {_type: 'slug', current: name},
  }
  if (dryRun) {
    would(`create draft ${document._id} titled "${title}"`)
    return false
  }
  await client.createIfNotExists(document)
  done(`created draft ${document._id} titled "${title}"`)
  return false
}

const SANITY_HOOKS_API = `https://api.sanity.io/v2021-10-04/hooks/projects/${SANITY_PROJECT}`

async function sanityHooksApi(method, body) {
  const response = await fetch(SANITY_HOOKS_API, {
    method,
    headers: {
      Authorization: `Bearer ${getSanityToken()}`,
      ...(body ? {'Content-Type': 'application/json'} : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    fail(`Sanity webhooks API: ${method} ${response.status} ${await response.text()}`)
  }
  return response.json()
}

async function createWebhook(buildHook) {
  step('5. webhook   Sanity → build hook')
  if (!buildHook) {
    would('create a Sanity webhook for the build hook, once it exists')
    return
  }
  const hooks = await sanityHooksApi('GET')
  const existing = hooks.find((hook) => hook.url === buildHook.url)
  if (existing) {
    skip(`exists ("${existing.name}", ${existing.id})`)
    return
  }
  // Mirrors the main site's webhook (see the README), with two differences.
  // It fires on create and update only: a deleted document fails the build,
  // which keeps the last deploy live, so a build would only add a failure.
  // And the filter is this one document's slug.
  const webhook = {
    type: 'document',
    name: `Rebuild ${netlifyName}`,
    description: `Rebuilds ${domain} (${packagePath}) when its microSite document is published or updated.`,
    url: buildHook.url,
    httpMethod: 'POST',
    apiVersion: 'v2021-03-25',
    includeDrafts: false,
    dataset: SANITY_DATASET,
    rule: {
      on: ['create', 'update'],
      filter: `_type == "microSite" && slug.current == "${name}"`,
      // Netlify copies the body into an env var that must stay under 128 KB.
      projection: '{_id, _type}',
    },
  }
  if (dryRun) {
    would(`create webhook "${webhook.name}" filtered on ${webhook.rule.filter}`)
    return
  }
  const created = await sanityHooksApi('POST', webhook)
  done(`created "${created.name}" (${created.id})`)
}

// * * * netlify * * *

// `netlify api` runs outside the repo, away from the CLI's monorepo detection:
// in here, `netlify deploy` prompts for a project and crashes without a
// terminal.
function netlifyApi(method, data) {
  try {
    const output = execFileSync('netlify', ['api', method, '--data', JSON.stringify(data)], {
      cwd: os.tmpdir(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return JSON.parse(output)
  } catch (error) {
    if (error.code === 'ENOENT') {
      fail('The Netlify CLI is not installed: `npm i -g netlify-cli`, then `netlify login`.')
    }
    fail(`netlify api ${method}: ${error.stderr || error.message}`)
  }
}

function createNetlifyProject() {
  step(`3. netlify   ${netlifyName}`)
  const existing = netlifyApi('listSites', {name: netlifyName, filter: 'all'}).find(
    (site) => site.name === netlifyName,
  )
  if (existing) {
    skip(`exists (${existing.id})`)
    return existing
  }

  const main = netlifyApi('getSite', {site_id: MAIN_NETLIFY_SITE})
  const repo = {
    provider: main.build_settings.provider,
    repo_path: main.build_settings.repo_path,
    repo_branch: main.build_settings.repo_branch,
    installation_id: main.build_settings.installation_id,
    base: '',
    package_path: packagePath,
    // netlify.toml takes precedence; set here too so the dashboard agrees.
    cmd: `pnpm --filter @micro-sites/${name} run build`,
    dir: `${packagePath}/build`,
  }
  if (dryRun) {
    would(
      `create ${netlifyName}.netlify.app from ${repo.repo_path}@${repo.repo_branch}, package ${packagePath}`,
    )
    return undefined
  }
  const site = netlifyApi('createSiteInTeam', {
    account_slug: main.account_slug,
    body: {name: netlifyName, repo},
  })
  done(`created ${site.ssl_url} (${site.id})`)
  if (site.build_settings?.package_path !== packagePath) {
    console.warn(
      `  ! package directory is "${site.build_settings?.package_path ?? ''}", not ${packagePath}: set it under Project configuration → Build & deploy.`,
    )
  }
  return site
}

function createBuildHook(site) {
  step(`4. hook      "${BUILD_HOOK_TITLE}" build hook`)
  if (!site) {
    would('create a build hook, once the project exists')
    return undefined
  }
  const existing = netlifyApi('listSiteBuildHooks', {site_id: site.id}).find(
    (hook) => hook.title === BUILD_HOOK_TITLE,
  )
  if (existing) {
    skip(`exists (${existing.id})`)
    return existing
  }
  if (dryRun) {
    would(`create build hook "${BUILD_HOOK_TITLE}" on ${site.build_settings.repo_branch}`)
    return undefined
  }
  const hook = netlifyApi('createSiteBuildHook', {
    site_id: site.id,
    body: {title: BUILD_HOOK_TITLE, branch: site.build_settings.repo_branch},
  })
  done(`created (${hook.id})`)
  return hook
}

// * * * run * * *

console.log(`Micro-site "${name}": "${title}" at ${domain}${dryRun ? ' (dry run)' : ''}`)

createPackage()

if (options.local) {
  console.log('\n--local: skipped the Sanity document and the Netlify project.')
  process.exit(0)
}

const published = await createDocument()
const site = createNetlifyProject()
const buildHook = createBuildHook(site)
await createWebhook(buildHook)

// Netlify builds from GitHub, so until the package is pushed its builds fail.
let pushed = true
try {
  execFileSync('git', ['cat-file', '-e', `origin/main:${packagePath}/package.json`], {
    cwd: ROOT,
    stdio: 'ignore',
  })
} catch {
  pushed = false
}

console.log('\nLeft to do:')
if (!pushed)
  console.log(`  - commit ${packagePath} and push it to main (Netlify builds from GitHub)`)
if (!published) {
  console.log(
    `  - fill in "${title}" under Micro-sites in the Studio and publish it: the webhook starts the build`,
  )
}
console.log(
  `  - add ${domain} as the custom domain (Domain management${site ? ` in ${site.admin_url}` : ''})`,
)
