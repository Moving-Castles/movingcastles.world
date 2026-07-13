<script lang="ts">
  import type {TypedObject} from '@portabletext/types'
  import type {Component} from 'svelte'
  import {renderTextBlocks, type ContentEditorInput} from '$lib/modules/sanity'
  import ImageBlock from './blocks/ImageBlock.svelte'
  import IframeBlock from './blocks/IframeBlock.svelte'
  import VideoBlock from './blocks/VideoBlock.svelte'
  import TranscriptBlock from './blocks/TranscriptBlock.svelte'
  import TableBlock from './blocks/TableBlock.svelte'
  import ChartBlock from './blocks/ChartBlock.svelte'

  // Custom Portable Text block types rendered as dedicated Svelte components.
  // Everything else (text blocks with their styles/marks, lists) falls through
  // to the string renderer in the sanity module. To support a new embedded
  // type: create a component in ./blocks taking a `value` prop and add it here.
  const blockComponents: Record<string, Component<{value: any}> | undefined> = {
    image: ImageBlock,
    iframe: IframeBlock,
    video: VideoBlock,
    transcript: TranscriptBlock,
    table: TableBlock,
    chart: ChartBlock,
  }

  let {content}: {content: ContentEditorInput} = $props()

  type Chunk =
    | {kind: 'html'; key: string; html: string}
    | {kind: 'component'; key: string; component: Component<{value: any}>; value: TypedObject}

  // Split the content array into chunks: each custom block becomes a component
  // chunk, and every run of text blocks between them is rendered to a single
  // HTML string. Runs are kept whole (rather than block-by-block) so that
  // consecutive list items still merge into one <ul>/<ol>.
  const chunks = $derived.by(() => {
    const blocks = (Array.isArray(content) ? content : content?.content) ?? []
    const out: Chunk[] = []
    let run: TypedObject[] = []
    const flush = () => {
      if (run.length === 0) return
      out.push({kind: 'html', key: run[0]._key ?? `run-${out.length}`, html: renderTextBlocks(run)})
      run = []
    }
    for (const block of blocks) {
      const component = blockComponents[block._type]
      if (component) {
        flush()
        out.push({
          kind: 'component',
          key: block._key ?? `block-${out.length}`,
          component,
          value: block,
        })
      } else {
        run.push(block)
      }
    }
    flush()
    return out
  })
</script>

{#each chunks as chunk (chunk.key)}
  {#if chunk.kind === 'html'}
    {@html chunk.html}
  {:else}
    <chunk.component value={chunk.value} />
  {/if}
{/each}
