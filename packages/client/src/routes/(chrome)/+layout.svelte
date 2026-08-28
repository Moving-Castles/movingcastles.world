<script lang="ts">
  import type {Snippet} from 'svelte'
  import Header from '$lib/components/chrome/Header.svelte'
  import Footer from '$lib/components/chrome/Footer.svelte'
  import PrintHeader from '$lib/components/chrome/PrintHeader.svelte'
  import type {LayoutData} from './$types'

  let {data, children}: {data: LayoutData; children: Snippet} = $props()
</script>

<PrintHeader />
<Header links={data.headerLinks} />
{@render children()}
<Footer links={data.footerLinks} />
