<script lang="ts">
  import type {Snippet} from 'svelte'
  import '../app.css'
  // The faces every page sets above the fold: sans for the body and, bold,
  // for titles; mono for the site chrome. Preloaded so they are requested as
  // soon as the document arrives rather than after the stylesheet has been
  // fetched and parsed. Imported so the hrefs are the hashed urls the css
  // resolves to — a preload of anything else would be fetched and discarded.
  import sansRegular from '$lib/fonts/die-grotesk/die-grotesk-a-regular.woff2'
  import sansBold from '$lib/fonts/die-grotesk/die-grotesk-a-bold.woff2'
  import monoRegular from '$lib/fonts/berkeley-mono/BerkeleyMono-Regular.woff2'

  let {children}: {children: Snippet} = $props()
</script>

<svelte:head>
  <!-- crossorigin is required even same-origin: fonts are fetched in cors
       mode, and a preload with a different mode does not match the request. -->
  <link rel="preload" href={sansRegular} as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href={sansBold} as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href={monoRegular} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{@render children()}
