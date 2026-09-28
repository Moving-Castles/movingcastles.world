<script lang="ts">
  import type {Snippet} from 'svelte'
  import '../app.css'
  // The faces the page sets above the fold, preloaded so they are requested
  // with the document rather than after the stylesheet. Imported so the hrefs
  // are the hashed urls the css resolves to.
  import sansRegular from '@fonts/die-grotesk/die-grotesk-a-regular.woff2'
  import sansBold from '@fonts/die-grotesk/die-grotesk-a-bold.woff2'

  let {children}: {children: Snippet} = $props()
</script>

<svelte:head>
  <!-- crossorigin is required even same-origin: fonts are fetched in cors
       mode, and a preload with a different mode does not match the request. -->
  <link rel="preload" href={sansRegular} as="font" type="font/woff2" crossorigin="anonymous" />
  <link rel="preload" href={sansBold} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{@render children()}
