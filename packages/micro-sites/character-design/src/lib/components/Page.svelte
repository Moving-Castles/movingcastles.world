<script lang="ts">
  import {SITE_URL} from '#lib/site.js'
  import {renderContent, toPlainText} from '#lib/portable-text.js'
  import {urlFor} from '#lib/sanity-image.js'
  import type {Page} from '#lib/types.js'

  // A page of the site: at / when it is the site's front page, and at /<slug>
  // always. Rendered by both routes.
  let {page, isFront = false}: {page: Page; isFront?: boolean} = $props()

  const truncate = (text: string, max = 155) =>
    text.length <= max ? text : text.slice(0, max).replace(/\s+\S*$/, '') + '…'

  // The title of the tab and share previews: the page's, with the subtitle
  // after it if there is one.
  const pageTitle = $derived(page.subtitle ? `${page.title} | ${page.subtitle}` : page.title)

  // The editor-authored meta description, else the start of the content.
  const description = $derived(page.metaDescription || truncate(toPlainText(page.content ?? [])))

  // The front page is served at / as well as at /<slug>; the root is the
  // address it is shared and indexed under, so both copies point there.
  const canonicalUrl = $derived(isFront ? `${SITE_URL}/` : `${SITE_URL}/${page.slug}`)

  const image = $derived(page.image?.asset ? page.image : undefined)

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
          alt: image.alt || page.title,
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
    <h1>{page.title}</h1>
    {#if page.metadata?.length}
      <div class="metadata">
        {@html renderContent(page.metadata)}
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

  {#if page.content?.length}
    <div class="content">
      {@html renderContent(page.content)}
    </div>
  {/if}

  {#if page.previousEvents.length}
    <section class="previous" aria-labelledby="previous-events">
      <h2 class="mono" id="previous-events">Previous events</h2>
      <ul>
        {#each page.previousEvents as event (event.slug)}
          <li>
            <a href="/{event.slug}">
              {#if event.subtitle}<span class="mono">— {event.subtitle}</span>{/if}
            </a>
          </li>
        {/each}
      </ul>
    </section>
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

  /* Earlier events of the series, after the content and set off from it by a
     rule like the content's own. */
  .previous {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--foreground);
  }

  .previous h2 {
    margin: 0 0 0.75rem;
    color: var(--foreground);
  }

  .previous ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* The title and, after it, the subtitle in the small mono of the metadata;
     the subtitle wraps to its own line when the two don't fit together. */
  .previous li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 1rem;
    margin-bottom: 0.5em;
  }

  .previous a {
    font-weight: 500;
    text-decoration: none;
  }

  .previous a:hover {
    text-decoration: underline;
  }
</style>
