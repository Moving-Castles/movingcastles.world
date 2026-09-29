import {createElement} from 'react'
import {MdHorizontalRule, MdPublic, MdSmartButton} from 'react-icons/md'
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

// A one-page site served from its own subdomain, e.g. an event page at
// character-design.movingcastles.world. Each package in packages/micro-sites/
// renders the document whose `slug` matches its name, so a new micro-site
// needs a new document rather than a new type. The scaffold script
// (packages/scripts/create-micro-site.mjs) creates that document as a draft.
export default {
  name: 'microSite',
  title: 'Micro-site',
  icon: MdPublic,
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
        'Not shown on the page: only in the browser tab and share previews, after the title, as "Title | Subtitle".',
    },
    {
      name: 'slug',
      title: 'Site',
      type: 'slug',
      description:
        'The micro-site that renders this page: the name of its package in packages/micro-sites/, e.g. "character-design". Changing it disconnects the page from its site.',
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
  ],
  preview: {
    select: {title: 'title', subtitle: 'slug.current'},
  },
}
