<script lang="ts">
  import {SITE_URL} from '$lib/site'
  import {renderContent, toPlainText} from '$lib/portable-text'
  import {urlFor} from '$lib/sanity-image'

  let {data} = $props()
  const site = $derived(data.site)

  const truncate = (text: string, max = 155) =>
    text.length <= max ? text : text.slice(0, max).replace(/\s+\S*$/, '') + '…'

  // The title of the tab and share previews: the page's, with the subtitle
  // after it if there is one.
  const pageTitle = $derived(site.subtitle ? `${site.title} | ${site.subtitle}` : site.title)

  // The editor-authored meta description, else the start of the content.
  const description = $derived(site.metaDescription || truncate(toPlainText(site.content ?? [])))

  const canonicalUrl = `${SITE_URL}/`

  const image = $derived(site.image?.asset ? site.image : undefined)

  // Display size after the editor's crop, for the <img> width/height (the
  // aspect ratio the browser reserves before the file arrives).
  const imageSize = $derived.by(() => {
    const dimensions = image?.asset?.metadata?.dimensions
    if (!dimensions?.width || !dimensions?.height) return undefined
    const crop = image?.crop
    return {
      width: Math.round(dimensions.width * (1 - (crop?.left ?? 0) - (crop?.right ?? 0))),
      height: Math.round(dimensions.height * (1 - (crop?.top ?? 0) - (crop?.bottom ?? 0))),
    }
  })

  // The column is 720px less its 1em (18px) gutters; 2× covers retina.
  const IMAGE_WIDTHS = [684, 1026, 1368, 2052]
  const IMAGE_SIZES = '(min-width: 720px) 684px, calc(100vw - 36px)'
  const imageUrl = (width: number) => urlFor(image!).width(width).fit('max').auto('format').url()

  // Share image (1200×630, the size the platforms crop to), cut around the
  // hotspot and forced to JPEG for scrapers that don't take WebP. Without an
  // image, the main site's.
  const shareImage = $derived(
    image
      ? {
          url: urlFor(image).width(1200).height(630).fit('crop').format('jpg').url(),
          alt: image.alt || site.title,
        }
      : {url: 'https://movingcastles.world/images/og-image.jpg', alt: 'MOVING CASTLES'},
  )
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />

  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={shareImage.url} />
  <meta property="og:image:alt" content={shareImage.alt} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:locale" content="en_US" />

  <meta property="twitter:title" content={pageTitle} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={shareImage.url} />
  <meta property="twitter:image:alt" content={shareImage.alt} />
</svelte:head>

<main>
  <header>
    <h1>{site.title}</h1>
    {#if site.metadata?.length}
      <div class="metadata">
        {@html renderContent(site.metadata)}
      </div>
    {/if}
  </header>

  {#if image}
    <img
      src={imageUrl(1368)}
      srcset={IMAGE_WIDTHS.map((width) => `${imageUrl(width)} ${width}w`).join(', ')}
      sizes={IMAGE_SIZES}
      width={imageSize?.width}
      height={imageSize?.height}
      alt={image.alt ?? ''}
      fetchpriority="high"
    />
  {/if}

  {#if site.content?.length}
    <div class="content">
      {@html renderContent(site.content)}
    </div>
  {/if}
</main>

<style>
  main {
    width: 100%;
    max-width: var(--content-width);
    margin: 0 auto;
    padding: 2em 1em 4em;
    box-sizing: border-box;
  }

  h1 {
    margin: 0;
    margin-bottom: 0.5em;
  }

  img {
    display: block;
    width: 100%;
    height: auto;
    margin: 1.5em 0;
  }

  /* No image: the content keeps the header's paragraph distance instead. */
  header + .content {
    margin-top: 1em;
  }
</style>
