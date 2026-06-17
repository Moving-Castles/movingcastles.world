<script lang="ts">
  import {SITE_NAME, SITE_DESCRIPTION} from '$lib/constants'
  import {toPlainText} from '$lib/modules/sanity'
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

  const title = $derived(
    customTitle ?? (type === 'post' && post ? `${post.title} — ${SITE_NAME}` : SITE_NAME),
  )

  const description = $derived.by(() => {
    if (customDescription) return customDescription
    if (type === 'post' && post) {
      const text = toPlainText(post.content)
      if (text) return truncate(text)
    }
    return SITE_DESCRIPTION
  })
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="twitter:title" content={title} />
  <meta property="twitter:description" content={description} />
</svelte:head>
