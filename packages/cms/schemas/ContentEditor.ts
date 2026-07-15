import {
  MdImage,
  MdLink,
  MdOutlineFlare,
  MdWeb,
  MdOndemandVideo,
  MdForum,
  MdTableChart,
  MdShowChart,
  MdFormatQuote,
  MdUnfoldMore,
  MdNotes,
} from 'react-icons/md'

// The text block and object members are defined once and shared between the
// top-level content array and the nested content of expandable `details`
// sections (which nest one level deep — no details inside details).

const blockMember = {
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Quote', value: 'blockquote'},
    {title: 'Horizontal Rule', value: 'hr'},
    {title: 'H1', value: 'h1'},
    {title: 'H2', value: 'h2'},
    {title: 'H3', value: 'h3'},
    {title: 'H4', value: 'h4'},
  ],
  marks: {
    decorators: [
      {
        title: 'Strong',
        value: 'strong',
      },
      {
        title: 'Emphasis',
        value: 'em',
      },
      {
        title: 'Code',
        value: 'code',
      },
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'Link',
        icon: MdLink,
        fields: [
          {
            name: 'href',
            type: 'string',
          },
        ],
      },
      {
        name: 'internalLink',
        type: 'object',
        title: 'Internal link',
        icon: MdOutlineFlare,
        fields: [
          {
            name: 'reference',
            type: 'reference',
            title: 'Reference',
            to: [{type: 'post'}],
          },
        ],
      },
      {
        name: 'cite',
        type: 'object',
        title: 'Citation',
        icon: MdFormatQuote,
        fields: [
          {
            name: 'refId',
            type: 'string',
            title: 'Reference id',
            description: 'Citation key of an entry in the post’s references list.',
          },
        ],
      },
    ],
  },
}

const objectMembers = [
  {
    type: 'image',
    icon: MdImage,
    fields: [
      {
        title: 'Caption',
        name: 'caption',
        type: 'text',
      },
      {
        title: 'Day version',
        name: 'dayImage',
        type: 'image',
        description:
          'Optional. Shown when the site is in light/day mode. If omitted, the image above is used in both themes.',
      },
      {
        title: 'Small vertical margin',
        name: 'smallMargin',
        type: 'boolean',
        description: 'Tighten the space above and below the image.',
        initialValue: false,
      },
      {
        title: 'Duotone',
        name: 'duotone',
        type: 'boolean',
        description: 'Render the image as a duotone on a tinted background.',
        initialValue: false,
      },
      {
        title: 'Allow large view',
        name: 'largeView',
        type: 'boolean',
        description: 'Show a + button that opens the image in a viewport-sized lightbox.',
        initialValue: false,
      },
    ],
  },
  {
    type: 'object',
    name: 'iframe',
    title: 'Embed',
    icon: MdWeb,
    fields: [
      {
        title: 'URL',
        name: 'url',
        type: 'url',
        description: 'Address of the page to embed.',
        validation: (Rule: any) => Rule.required().uri({scheme: ['https', 'http']}),
      },
      {
        title: 'Aspect ratio',
        name: 'aspectRatio',
        type: 'string',
        options: {
          list: [
            {title: 'Landscape (16:9)', value: '16/9'},
            {title: 'Standard (4:3)', value: '4/3'},
            {title: 'Square (1:1)', value: '1/1'},
            {title: 'Portrait (9:16)', value: '9/16'},
          ],
        },
        initialValue: '16/9',
      },
      {
        title: 'Caption',
        name: 'caption',
        type: 'text',
      },
      {
        title: 'Small vertical margin',
        name: 'smallMargin',
        type: 'boolean',
        description: 'Tighten the space above and below the embed.',
        initialValue: false,
      },
      {
        title: 'Allow large view',
        name: 'largeView',
        type: 'boolean',
        description: 'Show a + button that opens the embed in a viewport-sized lightbox.',
        initialValue: false,
      },
    ],
    preview: {
      select: {title: 'caption', subtitle: 'url'},
      prepare({title, subtitle}: {title?: string; subtitle?: string}) {
        return {title: title || subtitle || 'Embed', subtitle: title ? subtitle : undefined}
      },
    },
  },
  {
    type: 'file',
    name: 'video',
    title: 'Video',
    icon: MdOndemandVideo,
    options: {accept: 'video/mp4'},
    fields: [
      {
        title: 'Caption',
        name: 'caption',
        type: 'text',
      },
      {
        title: 'Autoplay',
        name: 'autoplay',
        type: 'boolean',
        description: 'Play automatically, muted and looping, without controls.',
        initialValue: false,
      },
      {
        title: 'Light sensitivity warning',
        name: 'flashWarning',
        type: 'boolean',
        description:
          'Cover the video with a "may include flashing lights" notice until the reader chooses to play it.',
        initialValue: false,
      },
      {
        title: 'Small vertical margin',
        name: 'smallMargin',
        type: 'boolean',
        description: 'Tighten the space above and below the video.',
        initialValue: false,
      },
      {
        title: 'Allow large view',
        name: 'largeView',
        type: 'boolean',
        description: 'Show a + button that opens the video in a viewport-sized lightbox.',
        initialValue: false,
      },
    ],
  },
  {
    type: 'object',
    name: 'transcript',
    title: 'Transcript',
    icon: MdForum,
    fields: [
      {
        title: 'Heading',
        name: 'heading',
        type: 'string',
        description: 'Optional title shown above the transcript.',
      },
      {
        title: 'Subheading',
        name: 'subheading',
        type: 'string',
        description: 'Optional smaller line under the heading.',
      },
      {
        title: 'Collapsed',
        name: 'collapsed',
        type: 'boolean',
        description:
          'Start folded to a fixed height with a "more" toggle that reveals the full transcript.',
        initialValue: false,
      },
      {
        title: 'Lines',
        name: 'lines',
        type: 'array',
        of: [
          {
            type: 'object',
            name: 'line',
            title: 'Line',
            fields: [
              {
                title: 'Label',
                name: 'label',
                type: 'string',
                description: 'Speaker or source, shown in bold.',
              },
              {
                title: 'Value',
                name: 'value',
                type: 'text',
                rows: 2,
              },
            ],
            preview: {
              select: {title: 'label', subtitle: 'value'},
            },
          },
        ],
      },
    ],
    preview: {
      select: {heading: 'heading', lines: 'lines'},
      prepare({heading, lines}: {heading?: string; lines?: {label?: string; value?: string}[]}) {
        const count = lines?.length ?? 0
        const first = lines?.[0]
        return {
          title:
            heading ||
            (first ? [first.label, first.value].filter(Boolean).join(': ') : 'Transcript'),
          subtitle: `Transcript — ${count} line${count === 1 ? '' : 's'}`,
        }
      },
    },
  },
  {
    type: 'object',
    name: 'table',
    title: 'Table',
    icon: MdTableChart,
    fields: [
      {
        title: 'Heading',
        name: 'heading',
        type: 'string',
        description: 'Optional title shown above the table.',
      },
      {
        title: 'Subheading',
        name: 'subheading',
        type: 'string',
        description: 'Optional smaller line under the heading.',
      },
      {
        title: 'Header row',
        name: 'header',
        type: 'array',
        of: [{type: 'string'}],
      },
      {
        title: 'Rows',
        name: 'rows',
        type: 'array',
        of: [
          {
            type: 'object',
            name: 'row',
            title: 'Row',
            fields: [
              {
                title: 'Cells',
                name: 'cells',
                type: 'array',
                of: [{type: 'string'}],
              },
            ],
            preview: {
              select: {cells: 'cells'},
              prepare({cells}: {cells?: string[]}) {
                return {title: (cells ?? []).join(' | ') || 'Row'}
              },
            },
          },
        ],
      },
      {
        title: 'Caption',
        name: 'caption',
        type: 'text',
      },
    ],
    preview: {
      select: {heading: 'heading', header: 'header', rows: 'rows', caption: 'caption'},
      prepare({
        heading,
        header,
        rows,
        caption,
      }: {
        heading?: string
        header?: string[]
        rows?: unknown[]
        caption?: string
      }) {
        const count = rows?.length ?? 0
        return {
          title: heading || caption || (header ?? []).join(' | ') || 'Table',
          subtitle: `Table — ${count} row${count === 1 ? '' : 's'}`,
        }
      },
    },
  },
  {
    type: 'object',
    name: 'chart',
    title: 'Chart',
    icon: MdShowChart,
    fields: [
      {
        title: 'Chart type',
        name: 'chartType',
        type: 'string',
        options: {
          list: [
            {title: 'Line', value: 'line'},
            {title: 'Histogram', value: 'histogram'},
          ],
        },
        validation: (Rule: any) => Rule.required(),
      },
      {
        title: 'Data (JSON)',
        name: 'data',
        type: 'text',
        rows: 8,
        description:
          'Plot-ready JSON, normally written by the report publishing script rather than by hand.',
        validation: (Rule: any) =>
          Rule.required().custom((value: string | undefined) => {
            if (!value) return true
            try {
              JSON.parse(value)
              return true
            } catch {
              return 'Must be valid JSON'
            }
          }),
      },
      {
        title: 'X axis label',
        name: 'xLabel',
        type: 'string',
      },
      {
        title: 'Y axis label',
        name: 'yLabel',
        type: 'string',
      },
      {
        title: 'Caption',
        name: 'caption',
        type: 'text',
      },
    ],
    preview: {
      select: {title: 'caption', subtitle: 'chartType'},
      prepare({title, subtitle}: {title?: string; subtitle?: string}) {
        return {title: title || 'Chart', subtitle: `Chart — ${subtitle ?? 'unknown type'}`}
      },
    },
  },
]

// Abstract: a visually distinct lead section (the paper-style abstract at the
// top of a report). Plain paragraphs only — no headings or embedded objects.
const abstractMember = {
  type: 'object',
  name: 'abstract',
  title: 'Abstract',
  icon: MdNotes,
  fields: [
    {
      title: 'Content',
      name: 'content',
      type: 'array',
      of: [{...blockMember, styles: [{title: 'Normal', value: 'normal'}]}],
    },
  ],
  preview: {
    select: {content: 'content'},
    prepare({content}: {content?: {children?: {text?: string}[]}[]}) {
      const text = content?.[0]?.children?.map((child) => child.text ?? '').join('') ?? ''
      return {title: text || 'Abstract', subtitle: 'Abstract'}
    },
  },
}

// Expandable section: a native <details>/<summary> on the site. Nests the
// same members as the top-level content array, minus itself.
const detailsMember = {
  type: 'object',
  name: 'details',
  title: 'Expandable section',
  icon: MdUnfoldMore,
  fields: [
    {
      title: 'Summary',
      name: 'summary',
      type: 'string',
      description: 'The always-visible toggle line.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      title: 'Content',
      name: 'content',
      type: 'array',
      of: [blockMember, ...objectMembers],
    },
  ],
  preview: {
    select: {title: 'summary', content: 'content'},
    prepare({title, content}: {title?: string; content?: unknown[]}) {
      const count = content?.length ?? 0
      return {
        title: title || 'Expandable section',
        subtitle: `Expandable — ${count} block${count === 1 ? '' : 's'}`,
      }
    },
  },
}

export default {
  title: 'Content editor',
  type: 'object',
  name: 'contentEditor',
  options: {collapsible: false, collapsed: false},
  fields: [
    {
      title: 'Content editor',
      name: 'content',
      type: 'array',
      of: [blockMember, ...objectMembers, abstractMember, detailsMember],
    },
  ],
}
