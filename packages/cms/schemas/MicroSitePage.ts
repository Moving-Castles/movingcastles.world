import {createElement} from 'react'
import {MdDescription, MdHorizontalRule, MdSmartButton} from 'react-icons/md'
import type {BlockStyleProps} from 'sanity'

// Berkeley Mono at the small size, as the main site sets its transcripts.
// Shown in mono in the editor too, so mono paragraphs are recognisable
// without opening the style menu.
const monoStyle = {
  title: 'Mono',
  value: 'mono',
  component: ({children}: BlockStyleProps) =>
    createElement('span', {style: {fontFamily: 'monospace'}}, children),
}

// Rich text of the `metadata` and `content` fields: paragraphs, strong/em and
// links. Each field adds its own styles and lists.
const textBlock = {
  type: 'block',
  marks: {
    decorators: [
      {title: 'Strong', value: 'strong'},
      {title: 'Emphasis', value: 'em'},
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'Link',
        fields: [
          {
            name: 'href',
            title: 'URL',
            type: 'url',
            validation: (Rule: any) => Rule.required().uri({scheme: ['http', 'https', 'mailto']}),
          },
        ],
      },
    ],
  },
}

// A horizontal line between blocks of the content: 1px in the foreground
// colour, solid or dashed, like the main site's rules.
const ruleMember = {
  type: 'object',
  name: 'rule',
  title: 'Line',
  icon: MdHorizontalRule,
  fields: [
    {
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: [
          {title: 'Solid', value: 'solid'},
          {title: 'Dashed', value: 'dashed'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'solid',
    },
  ],
  preview: {
    select: {style: 'style'},
    prepare: ({style}: {style?: string}) => ({
      title: style === 'dashed' ? 'Dashed line' : 'Solid line',
    }),
  },
}

// A link rendered as a button between blocks of the content, e.g. to an
// application form.
const buttonMember = {
  type: 'object',
  name: 'button',
  title: 'Button',
  icon: MdSmartButton,
  fields: [
    {
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule: any) => Rule.required().uri({scheme: ['http', 'https', 'mailto']}),
    },
  ],
  preview: {
    select: {title: 'label', subtitle: 'url'},
  },
}

// Members of the `content` field.
const contentMembers = [
  {
    ...textBlock,
    styles: [
      {title: 'Normal', value: 'normal'},
      {title: 'H2', value: 'h2'},
      {title: 'H3', value: 'h3'},
      {title: 'Quote', value: 'blockquote'},
      monoStyle,
    ],
    lists: [
      {title: 'Bullet', value: 'bullet'},
      {title: 'Numbered', value: 'number'},
    ],
  },
  ruleMember,
  buttonMember,
]

// The other pages of the same site, for the previous-events references. A
// page references the published id of its site, so candidates are matched on
// that; the page itself is excluded in both its draft and published forms.
const siblingPages = ({document}: {document: {_id: string; site?: {_ref?: string}}}) => {
  const id = document._id.replace(/^drafts\./, '')
  return {
    filter: 'site._ref == $site && !(_id in [$id, $draftId])',
    params: {site: document.site?._ref ?? '', id, draftId: `drafts.${id}`},
  }
}

// A page of a micro-site (see MicroSite.ts): an event in a series, say. The
// site's front page is served at its root, and every page at /<slug>.
export default {
  name: 'microSitePage',
  title: 'Micro-site page',
  icon: MdDescription,
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description:
        'Not shown on the page itself: in the browser tab and share previews, after the title, as "Title | Subtitle", and after the title where the page is listed as a previous event.',
    },
    {
      name: 'site',
      title: 'Site',
      type: 'reference',
      to: [{type: 'microSite'}],
      description: 'The micro-site this page belongs to.',
      options: {disableNew: true},
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'The page’s address on the site: /<slug>. The site’s front page is also served at /. Changing it changes the address.',
      options: {source: 'title'},
      validation: (Rule: any) => Rule.required(),
    },
    {
      title: 'Meta description',
      name: 'metaDescription',
      type: 'text',
      rows: 3,
      description:
        'Short summary used for search-engine results and social-media share previews. If left empty, the start of the content is used.',
      validation: (Rule: any) =>
        Rule.max(160).warning(
          'Keep under ~160 characters so it is not truncated in search results.',
        ),
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'array',
      of: [{...textBlock, styles: [{title: 'Normal', value: 'normal'}, monoStyle], lists: []}],
      description:
        'Lines shown under the title, one paragraph each, e.g. the date and place, or the hosts.',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
      description:
        'Shown under the metadata. Also the image of social-media share previews, cropped to 1200×630 around the hotspot.',
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describes the image for screen readers and when it fails to load.',
        },
      ],
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: contentMembers,
    },
    {
      name: 'previousEvents',
      title: 'Previous events',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'microSitePage'}],
          options: {disableNew: true, filter: siblingPages},
        },
      ],
      description:
        'Earlier pages of this site, linked under the content in this order. Only published pages are linked.',
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'subtitle', media: 'image'},
  },
}
