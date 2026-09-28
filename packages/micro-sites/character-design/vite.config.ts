import {sveltekit} from '@sveltejs/kit/vite'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  // The dev server only serves files from inside this package; the fonts live
  // in the main site's (the `@fonts` alias in svelte.config.js).
  server: {fs: {allow: ['../../client/src/lib/fonts']}},
})
