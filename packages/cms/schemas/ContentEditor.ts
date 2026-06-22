import {MdImage, MdLink, MdInsertLink} from 'react-icons/md'
import {HRDecorator} from './decorators/HRDecorator'

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
                icon: MdInsertLink,
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
          ],
        },
      ],
    },
  ],
}
