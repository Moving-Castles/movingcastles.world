// Portable Text to html, for the `metadata` and `content` fields of the
// microSite schema: paragraphs, mono paragraphs, h2/h3, quotes, lists,
// strong/em, links, lines and buttons. Everything but the mono style, the
// line, the button and the link mark uses the renderer's defaults.

import {escapeHTML, toHTML, type PortableTextComponents} from '@portabletext/to-html'
import type {PortableTextBlock, TypedObject} from '@portabletext/types'

const components: PortableTextComponents = {
  block: {
    // Set in the mono stack by the `.mono` rule in app.css.
    mono: ({children}) => `<p class="mono">${children}</p>`,
  },
  types: {
    // Solid unless the editor chose dashed.
    rule: ({value}) => (value?.style === 'dashed' ? '<hr class="dashed" />' : '<hr />'),
    // Styled by the `.button` rule in app.css.
    button: ({value}) =>
      `<a class="button" href="${escapeHTML(value?.url ?? '')}">${escapeHTML(value?.label ?? '')}</a>`,
  },
  marks: {
    // External links open in a new tab; mailto: and same-site links don't.
    link: ({children, value}) => {
      const href = escapeHTML(value?.href ?? '')
      if (href.startsWith('http')) {
        return `<a href="${href}" target="_blank" rel="noreferrer">${children}</a>`
      }
      return `<a href="${href}">${children}</a>`
    },
  },
}

export const renderContent = (blocks: TypedObject[]) => toHTML(blocks, {components})

// Plain text of the content's text blocks, whitespace collapsed, for the
// fallback meta description.
export const toPlainText = (blocks: TypedObject[]) =>
  (blocks as PortableTextBlock[])
    .filter((block) => block._type === 'block')
    .map((block) =>
      (block.children ?? []).map((child) => ('text' in child ? child.text : '')).join(''),
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
