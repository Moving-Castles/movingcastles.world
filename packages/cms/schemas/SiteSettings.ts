import {MdSettings, MdLink, MdInsertLink, MdList} from 'react-icons/md'

// The header and footer each hold their own ordered list of links, built from
// the same three member types: an external URL, a reference to a post on this
// site, or the post index. Defined once and shared between the two fields.
const linkMembers = [
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
  {
    type: 'object',
    name: 'navIndexLink',
    title: 'Index link',
    icon: MdList,
    fields: [
      {
        name: 'label',
        title: 'Label (abbreviation)',
        type: 'string',
        initialValue: 'index',
        validation: (Rule: any) => Rule.required(),
      },
    ],
    preview: {
      select: {label: 'label'},
      prepare({label}: {label?: string}) {
        return {title: label ? `[${label}]` : '(no label)', subtitle: '→ /index'}
      },
    },
  },
]

const linkFieldDescription =
  'in order. The label is the abbreviation rendered in brackets, e.g. a label of "x" shows as [x]. Each link is an external URL, a reference to a post on this site, or the post index at /index.'

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
      name: 'headerLinks',
      title: 'Header links',
      description: `Links shown in the header, ${linkFieldDescription}`,
      type: 'array',
      of: linkMembers,
    },
    {
      name: 'footerLinks',
      title: 'Footer links',
      description: `Links shown in the footer, ${linkFieldDescription}`,
      type: 'array',
      of: linkMembers,
    },
  ],
}
