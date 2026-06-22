<script lang="ts">
  import type {Snippet} from 'svelte'
  import Header from '$lib/components/chrome/Header.svelte'
  import Footer from '$lib/components/chrome/Footer.svelte'
  import type {LayoutData} from './$types'

  let {data, children}: {data: LayoutData; children: Snippet} = $props()
</script>

<Header links={data.links} />
{@render children()}
<Footer links={data.links} />
