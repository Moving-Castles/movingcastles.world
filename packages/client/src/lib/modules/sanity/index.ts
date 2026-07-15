// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
//  sanity.ts =>
//  functions to work with the Sanity database
//
// * * * * * * * * * * * * * * * * * * * * * * * * * * *

import {createClient} from '@sanity/client'
import {SANITY_ID, SANITY_DATASET} from '$lib/constants'
import {createImageUrlBuilder, type SanityImageSource} from '@sanity/image-url'
import {toHTML, type PortableTextComponents} from '@portabletext/to-html'
import type {TypedObject, PortableTextBlock} from '@portabletext/types'

export const client = createClient({
  projectId: SANITY_ID,
  dataset: SANITY_DATASET,
  apiVersion: '2026-01-01',
  useCdn: false,
})

const builder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Plain text of a single text block (its children concatenated, marks dropped).
const blockText = (block: PortableTextBlock) =>
  (block.children ?? []).map((child) => ('text' in child ? child.text : '')).join('')

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// Anchor id for a heading block: the slugified heading text, falling back to
// the block key for empty/symbol-only headings. A pure function of the block
// so the h2 renderer and `extractH2Headings` (the ToC) derive identical ids.
// Two identical h2 texts in one post would collide; links then go to the
// first, which is acceptable.
const headingId = (block: PortableTextBlock) => slugify(blockText(block)) || block._key || ''

// Renders regular Portable Text (block styles and marks mirroring the cms
// `contentEditor` schema) to an HTML string. Custom block types (image,
// iframe, video, ...) are rendered as Svelte components by PortableTextRender
// and never reach this renderer.
const components: PortableTextComponents = {
  marks: {
    link: ({children, value}) => {
      const href = value?.href ?? ''
      const external = href.startsWith('http')
      if (external) {
        return `<a href="${href}" target="_blank" rel="noreferrer">${children}</a>`
      }
      return `<a href="${href}">${children}</a>`
    },
    // Internal link: the `internalLink` annotation references a post; GROQ
    // resolves its slug into `value.slug`. Fall back to the plain text if the
    // referenced post is missing (e.g. deleted or no slug yet).
    internalLink: ({children, value}) => {
      const slug = value?.slug
      if (!slug) return children
      return `<a href="/posts/${slug}">${children}</a>`
    },
    // Citation: anchor-link to the matching entry in the post's references
    // list (rendered by PostSingle after the content).
    cite: ({children, value}) => {
      const refId = value?.refId
      if (!refId) return children
      // Editors mark the citation including its parentheses; keep the parens
      // outside the anchor so they don't get the link underline.
      const wrapped = children.match(/^\((.*)\)$/s)
      if (wrapped) {
        return `(<a class="cite" href="#ref-${refId}">${wrapped[1]}</a>)`
      }
      return `<a class="cite" href="#ref-${refId}">${children}</a>`
    },
  },
  block: {
    normal: ({children}) => `<p>${children}</p>`,
    blockquote: ({children}) => `<blockquote>${children}</blockquote>`,
    hr: () => `<hr />`,
    h1: ({children}) => `<h1>${children}</h1>`,
    // h2s carry an anchor id so the table of contents can link to them; h3s
    // too, so in-text section references (§6.1) can link to subsections.
    h2: ({children, value}) => `<h2 id="${headingId(value)}">${children}</h2>`,
    h3: ({children, value}) => `<h3 id="${headingId(value)}">${children}</h3>`,
    h4: ({children}) => `<h4>${children}</h4>`,
  },
}

export type ContentEditorInput = TypedObject[] | {content?: TypedObject[]} | undefined

// Renders a run of text blocks to an HTML string. Used by PortableTextRender
// for the stretches of content between custom (component-rendered) blocks.
export const renderTextBlocks = (blocks: TypedObject[]) => toHTML(blocks, {components})

export const toPlainText = (input: ContentEditorInput) => {
  const blocks = Array.isArray(input) ? input : input?.content
  if (!blocks) return ''
  return blocks
    .map((block) => (block._type === 'block' ? blockText(block as PortableTextBlock) : ''))
    .join('\n\n')
}

export interface TocHeading {
  id: string
  text: string
}

// The h2 headings of a post body, for the table of contents. Only top-level
// blocks are considered (headings nested inside `details` blocks are hidden
// while collapsed). Ids match the anchors the h2 block renderer emits.
export const extractH2Headings = (input: ContentEditorInput): TocHeading[] => {
  const blocks = Array.isArray(input) ? input : input?.content
  if (!blocks) return []
  return (blocks as PortableTextBlock[])
    .filter((block) => block._type === 'block' && block.style === 'h2')
    .map((block) => ({id: headingId(block), text: blockText(block)}))
    .filter((heading) => heading.id !== '' && heading.text.trim() !== '')
}

export const loadData = async <T>(
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> => {
  try {
    const res = await client.fetch(query, params)
    if (res === null) {
      return Promise.reject(new Error('404'))
    }
    return res
  } catch (err) {
    return Promise.reject(new Error('404'))
  }
}
