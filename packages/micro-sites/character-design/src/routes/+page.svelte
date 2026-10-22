<script lang="ts">
  import Page from '#lib/components/Page.svelte'
  import type {PageProps} from './$types'

  let {data}: PageProps = $props()
</script>

<Page page={data.page} isFront={data.isFront} />
