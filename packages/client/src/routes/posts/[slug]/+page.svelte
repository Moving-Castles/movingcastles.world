<script lang="ts">
  import Metadata from '$lib/components/Metadata.svelte'
  import PostSingle from '$lib/components/Post/PostSingle/PostSingle.svelte'
  import type {PageData} from './$types'

  let {data}: {data: PageData} = $props()
</script>

<Metadata type="post" post={data.post} />
<PostSingle post={data.post} />
