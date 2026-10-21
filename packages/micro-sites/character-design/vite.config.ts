import {fileURLToPath} from 'node:url'
import adapter from '@sveltejs/adapter-static'
import {sveltekit} from '@sveltejs/kit/vite'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'
import {defineConfig} from 'vite'

// The brand typefaces, shared with the main site rather than copied into every
// micro-site: `@fonts/...` in app.css and +layout.svelte. A Vite alias, since
// SvelteKit 3 deprecates its own `alias` option for package.json subpath
// imports, which cannot point outside the package.
const fonts = fileURLToPath(new URL('../../client/src/lib/fonts', import.meta.url))

export default defineConfig({
  plugins: [
    // SvelteKit 3 is configured here (there is no svelte.config.js any more);
    // options it doesn't know are passed on to vite-plugin-svelte.
    sveltekit({
      preprocess: vitePreprocess(),
      // One prerendered page and no server: the build is a folder of static
      // files that Netlify publishes as-is (see netlify.toml).
      adapter: adapter(),
    }),
  ],
  resolve: {alias: {'@fonts': fonts}},
  // The dev server only serves files from inside this package; the fonts live
  // in the main site's.
  server: {fs: {allow: [fonts]}},
})
