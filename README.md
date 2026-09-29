# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Deploying and content updates

The client is prerendered: `vite build` queries Sanity once, at build time, and
writes every page as a static file (`prerender = true` in the root
`+layout.server.ts`; the post route lists every published slug through its
`entries` export). Netlify serves the files from its CDN, so nothing runs per
request and TTFB is edge speed.

The trade-off is that a publish in the cms does not show on the site until the
next build. That is wired through two hooks, both configured in the dashboards
rather than in this repo:

1. **Netlify → Site configuration → Build & deploy → Build hooks**: add a hook
   (e.g. "Sanity publish") and copy its URL.
2. **Sanity → manage.sanity.io → project → API → Webhooks**: add a webhook that
   POSTs to that URL. Trigger on create, update and delete; filter to the
   document types the site renders — `_type in ["post", "frontpage",
"postIndex", "siteSettings"]` — so edits elsewhere do not rebuild the site.
   Use the `production` dataset. Set the projection to `{_id, _type}`: Netlify
   copies the webhook body into the `INCOMING_HOOK_BODY` env var, and a body
   over 128 KB (a long post, sent whole when the projection is empty) makes
   every build fail with `fork/exec .../node: argument list too long` before it
   starts. `sanity hook list` does not show the projection; check it at
   manage.sanity.io or via `GET https://api.sanity.io/v2021-10-04/hooks/projects/<id>`.

A post published between builds still renders on demand (its route is
`prerender = 'auto'`), so a webhook outage degrades to the old behaviour rather
than to 404s.

One page is not prerendered: `/index`. The front page is written to `index.html`,
which is also where `/index` would go, and Netlify's static routing resolves
`/index` to that file. So the index is rendered on demand behind a forced
rewrite (`packages/client/_redirects`, which adapter-netlify copies into the
publish directory) and held in Netlify's durable cache, which every deploy
purges — as fresh as the prerendered pages, with the same latency after the
first hit. Verified on a draft deploy; the second request for `/index` reports
`cache-status: "Netlify Durable"; hit`.

To try a build the way Netlify runs it, or push a draft deploy for a preview url
(production is untouched):

```bash
NETLIFY=true pnpm --filter client build   # NETLIFY=true selects adapter-netlify
NETLIFY_SITE_ID=cbc48978-7309-4c28-b604-4815287bdd04 \
  netlify deploy --no-build --filter client --dir packages/client/build
```

## Micro-sites

`packages/micro-sites/<name>` holds one-page sites served from their own
subdomains, e.g. `character-design` at character-design.movingcastles.world.
Each is a SvelteKit package (`@micro-sites/<name>`) with its own Netlify
project, and renders the `microSite` document in Sanity whose slug is `<name>`
(Studio → Micro-sites): a title, metadata lines, an image and rich content
(text, lines and link buttons). The page is prerendered with no JavaScript, in
the main site's type and night palette. The fonts come from `packages/client`
through an alias rather than being copied.

```bash
pnpm create:micro-site <name> [--title "…"] [--domain host] [--dry-run]
```

`pnpm dev` runs every micro-site alongside the main site and the cms, each in
its own mprocs pane on a port from 5180 up (alphabetical order), so a new one
appears without config changes. To run one on its own:
`pnpm --filter @micro-sites/<name> dev`.

`create:micro-site` copies an existing micro-site (`--from`, default
`character-design`) and rewrites its name and domain. It then creates the
Sanity document as a draft, a Netlify project linked to this repo with the new
package as its package directory, a build hook, and a Sanity webhook that calls
it when the document is published. Each step skips what already exists, so
re-running finishes a partial setup; `--local` creates only the package. It
uses your Netlify CLI and Sanity CLI logins. Left to do by hand: push, publish
the document, and add the custom domain in Netlify.

Build settings are in each package's `netlify.toml`. Its `ignore` command skips
builds for pushes that don't touch the package, the shared fonts or the
lockfile; content changes arrive through the build hook, which it never
cancels. An unpublished or missing document fails the build (the message says
so) and the last deploy stays live.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
