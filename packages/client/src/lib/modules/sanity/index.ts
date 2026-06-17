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
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Renders the contentEditor Portable Text to an HTML string.
// Block styles, marks and inline media mirror the cms `contentEditor` schema.
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
  },
  block: {
    normal: ({children}) => `<p>${children}</p>`,
    blockquote: ({children}) => `<blockquote>${children}</blockquote>`,
    hr: () => `<hr />`,
    h1: ({children}) => `<h1>${children}</h1>`,
    h2: ({children}) => `<h2>${children}</h2>`,
    h3: ({children}) => `<h3>${children}</h3>`,
  },
  types: {
    image: ({value}) => {
      const url = value.asset?.url
      if (!url) return ''
      const caption = value.caption ? `<figcaption>${value.caption}</figcaption>` : ''
      const alt = value.caption || ''
      return `<figure class="content-image"><img src="${url}" alt="${alt}" />${caption}</figure>`
    },
  },
}

export type ContentEditorInput = TypedObject[] | {content?: TypedObject[]} | undefined

export const renderBlockText = (input: ContentEditorInput) => {
  const blocks = Array.isArray(input) ? input : input?.content
  return blocks ? toHTML(blocks, {components}) : ''
}

export const toPlainText = (input: ContentEditorInput) => {
  const blocks = Array.isArray(input) ? input : input?.content
  if (!blocks) return ''
  return blocks
    .map((block) => {
      if (block._type !== 'block') return ''
      const children = (block as PortableTextBlock).children
      if (!children) return ''
      return children.map((child) => ('text' in child ? child.text : '')).join('')
    })
    .join('\n\n')
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
