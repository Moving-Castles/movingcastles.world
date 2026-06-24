<script lang="ts">
  import {SITE_NAME, SITE_DESCRIPTION, SITE_URL, TWITTER_USER} from '$lib/constants'
  import {toPlainText} from '$lib/modules/sanity'
  import {page} from '$app/state'
  import type {Post} from '$lib/types'

  type Props = {
    type?: 'default' | 'post'
    post?: Post
    title?: string
    description?: string
  }

  let {type = 'default', post, title: customTitle, description: customDescription}: Props = $props()

  const truncate = (text: string, max = 155) =>
    text.length <= max ? text : text.slice(0, max).replace(/\s+\S*$/, '') + '…'

  const isPost = $derived(type === 'post' && !!post)

  const title = $derived(customTitle ?? (isPost ? `${post!.title} | ${SITE_NAME}` : SITE_NAME))

  const description = $derived.by(() => {
    if (customDescription) return customDescription
    if (isPost) {
      // Prefer the editor-authored meta description; otherwise truncate the body.
      if (post!.metaDescription) return post!.metaDescription
      const text = toPlainText(post!.content)
      if (text) return truncate(text)
    }
    return SITE_DESCRIPTION
  })

  // Absolute URL of the current page. Built from the pathname so query strings
  // and trailing fragments can't fragment the canonical / og:url / @id.
  const canonicalUrl = $derived(`${SITE_URL}${page.url.pathname}`)

  const ogType = $derived(isPost ? 'article' : 'website')

  // Social share image (1200×630, the size the platforms crop to). Posts use
  // their featured image via Sanity's image pipeline; everything else falls
  // back to the site image (also 1200×630). Forced to JPEG for scrapers that
  // don't accept WebP.
  const ogImage = $derived.by(() => {
    const assetUrl = isPost ? post!.featuredImage?.asset?.url : undefined
    if (assetUrl) {
      return {
        url: `${assetUrl}?w=1200&h=630&fit=crop&fm=jpg`,
        alt: post!.featuredImage?.caption || post!.title || SITE_NAME,
      }
    }
    return {url: `${SITE_URL}/images/og-image.jpg`, alt: SITE_NAME}
  })

  // schema.org structured data — Organization for the site, BlogPosting for a
  // post (author URLs map to `sameAs`). Google reads this in preference to the
  // meta tags above.
  const jsonLd = $derived.by(() => {
    const organization = {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/og-image.jpg`,
    }

    if (isPost) {
      return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post!.title,
        description,
        url: canonicalUrl,
        mainEntityOfPage: {'@type': 'WebPage', '@id': canonicalUrl},
        image: ogImage.url,
        ...(post!.date ? {datePublished: post!.date, dateModified: post!.date} : {}),
        author: (post!.authors ?? []).map((a) => ({
          '@type': 'Person',
          name: a.name,
          ...(a.url ? {sameAs: a.url} : {}),
        })),
        publisher: organization,
      }
    }

    return {'@context': 'https://schema.org', ...organization, description: SITE_DESCRIPTION}
  })

  // Serialise with `<` escaped so post content can never break out of the tag.
  const jsonLdScript = $derived(
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}<\/script>`,
  )
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content={ogType} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage.url} />
  <meta property="og:image:alt" content={ogImage.alt} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter / X -->
  <meta property="twitter:site" content={`@${TWITTER_USER}`} />
  <meta property="twitter:creator" content={`@${TWITTER_USER}`} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
  <meta property="twitter:image" content={ogImage.url} />
  <meta property="twitter:image:alt" content={ogImage.alt} />

  <!-- Article-specific (posts only) -->
  {#if isPost && post?.date}
    <meta property="article:published_time" content={post.date} />
  {/if}
  {#if isPost && post?.authors}
    {#each post.authors as author (author._key)}
      <meta property="article:author" content={author.name} />
    {/each}
  {/if}

  <!-- Structured data -->
  {@html jsonLdScript}
</svelte:head>
