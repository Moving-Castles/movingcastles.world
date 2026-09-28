import adapter from '@sveltejs/adapter-static'
import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // One prerendered page and no server: the build is a folder of static
    // files that Netlify publishes as-is (see netlify.toml).
    adapter: adapter(),
    alias: {
      // Sanity TypeGen output (generated in packages/cms via `pnpm typegen:sanity`)
      '@sanity-types': '../../cms/sanity.types.ts',
      // The brand typefaces, shared with the main site rather than copied into
      // every micro-site. vite.config.ts lets the dev server serve them.
      '@fonts': '../../client/src/lib/fonts',
    },
  },
}

export default config
