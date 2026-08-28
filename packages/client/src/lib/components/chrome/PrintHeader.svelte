<script lang="ts">
  import {flushSync} from 'svelte'

  // Print-only chrome, swapped in for the screen header/footer by the print
  // styles: this bar is display:none on screen, while Header/Footer hide
  // themselves in print. Also owns the print lifecycle: just before printing
  // the timestamp refreshes and every collapsed <details> in the document is
  // forced open so its content makes it into the printed document; afterwards
  // the forced ones fold back.
  const timestamp = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const ymd = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
    return `${ymd} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  // Load time as a fallback for browsers that never fire beforeprint.
  let printedAt = $state(timestamp(new Date()))
  let forcedOpen: HTMLDetailsElement[] = []

  const beforeprint = () => {
    // flushSync so the new timestamp is in the DOM before the print snapshot.
    flushSync(() => {
      printedAt = timestamp(new Date())
    })
    forcedOpen = Array.from(document.querySelectorAll('details:not([open])'))
    for (const details of forcedOpen) details.open = true
  }

  const afterprint = () => {
    for (const details of forcedOpen) details.open = false
    forcedOpen = []
  }
</script>

<svelte:window onbeforeprint={beforeprint} onafterprint={afterprint} />

<div class="print-header">
  <span class="brand">Moving Castles</span>
  <span class="printed-on">printed on: {printedAt}</span>
</div>

<style lang="scss">
  .print-header {
    display: none;
  }

  @media print {
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      padding-bottom: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--foreground);
      font-family: var(--font-stack-mono);
      font-size: var(--font-size-small);
      color: var(--foreground);
    }

    .printed-on {
      font-size: var(--font-size-extra-small);
    }
  }
</style>
