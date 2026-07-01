import {MdSettings, MdLink, MdInsertLink} from 'react-icons/md'

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
        'Links shown in the header and footer, in order. The label is the abbreviation rendered in brackets, e.g. a label of "x" shows as [x]. Each link is either an external URL or a reference to a post on this site.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navLink',
          title: 'External link',
          icon: MdLink,
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
        {
          type: 'object',
          name: 'navPostLink',
          title: 'Internal post link',
          icon: MdInsertLink,
          fields: [
            {
              name: 'label',
              title: 'Label (abbreviation)',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'reference',
              title: 'Post',
              type: 'reference',
              to: [{type: 'post'}],
              validation: (Rule: any) => Rule.required(),
            },
          ],
          preview: {
            // Sanity resolves the reference for the preview, so `reference.title`
            // surfaces the linked post's title as the subtitle.
            select: {label: 'label', postTitle: 'reference.title'},
            prepare({label, postTitle}: {label?: string; postTitle?: string}) {
              return {
                title: label ? `[${label}]` : '(no label)',
                subtitle: postTitle ? `→ ${postTitle}` : '→ post',
              }
            },
          },
        },
      ],
    },
  ],
}
