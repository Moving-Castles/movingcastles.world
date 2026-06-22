import {MdSettings} from 'react-icons/md'

export default {
  name: 'siteSettings',
  title: 'Site Settings',
  icon: MdSettings,
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'links',
      title: 'Links',
      description:
        'Links shown in the header and footer, in order. The label is the abbreviation rendered in brackets, e.g. a label of "x" shows as [x].',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navLink',
          fields: [
            {
              name: 'label',
              title: 'Label (abbreviation)',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              // The `url` type only allows http(s) by default; widen the
              // scheme list so e.g. mailto:hello@movingcastles.world is valid.
              validation: (Rule: any) => Rule.required().uri({scheme: ['http', 'https', 'mailto']}),
            },
          ],
          preview: {
            select: {label: 'label', url: 'url'},
            prepare({label, url}: {label?: string; url?: string}) {
              return {title: label ? `[${label}]` : '(no label)', subtitle: url}
            },
          },
        },
      ],
    },
  ],
}
