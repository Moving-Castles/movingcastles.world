import {MdImage, MdLink, MdOutlineFlare, MdWeb, MdOndemandVideo, MdForum} from 'react-icons/md'

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
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'Quote', value: 'blockquote'},
            {title: 'Horizontal Rule', value: 'hr'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
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
            ],
          },
        },
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
            select: {lines: 'lines'},
            prepare({lines}: {lines?: {label?: string; value?: string}[]}) {
              const count = lines?.length ?? 0
              const first = lines?.[0]
              return {
                title: first ? [first.label, first.value].filter(Boolean).join(': ') : 'Transcript',
                subtitle: `Transcript — ${count} line${count === 1 ? '' : 's'}`,
              }
            },
          },
        },
      ],
    },
  ],
}
