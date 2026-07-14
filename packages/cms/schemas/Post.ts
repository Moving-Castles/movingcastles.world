import {MdArticle} from 'react-icons/md'

export default {
  name: 'post',
  title: 'Post',
  icon: MdArticle,
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'authors',
      title: 'Authors',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'author',
          fields: [
            {
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
            },
          ],
          preview: {
            select: {title: 'name', subtitle: 'url'},
          },
        },
      ],
    },
    {
      title: 'Publication date',
      name: 'date',
      type: 'date',
    },
    {
      title: 'Meta description',
      name: 'metaDescription',
      type: 'text',
      rows: 3,
      description:
        'Short summary used for search-engine results and social-media share previews. If left empty, the start of the post body is used.',
      validation: (Rule: any) =>
        Rule.max(160).warning(
          'Keep under ~160 characters so it is not truncated in search results.',
        ),
    },
    {
      name: 'content',
      title: 'Content',
      type: 'contentEditor',
    },
    {
      title: 'Table of contents',
      name: 'showToc',
      type: 'boolean',
      description:
        'Show a fixed table of contents (the H2 headings of the text) beside the text column on wide screens.',
      initialValue: false,
    },
    {
      title: 'References',
      name: 'references',
      type: 'array',
      description:
        'End notes rendered after the content. Cited from the text via the Citation annotation (or [@id] markers in a markdown source).',
      of: [
        {
          type: 'object',
          name: 'refItem',
          title: 'Reference',
          fields: [
            {
              title: 'Citation key',
              name: 'id',
              type: 'string',
              description: 'Stable key the text cites, e.g. "askell2021".',
              validation: (Rule: any) => Rule.required(),
            },
            {
              title: 'In-text label',
              name: 'label',
              type: 'string',
              description: 'How the citation reads in the text, e.g. "Askell et al."',
              validation: (Rule: any) => Rule.required(),
            },
            {
              title: 'Year',
              name: 'year',
              type: 'string',
              validation: (Rule: any) => Rule.required(),
            },
            {
              title: 'Reference text',
              name: 'text',
              type: 'text',
              rows: 2,
              description: 'The full end-note line, without the URL.',
              validation: (Rule: any) => Rule.required(),
            },
            {
              title: 'URL',
              name: 'url',
              type: 'url',
            },
          ],
          preview: {
            select: {title: 'text', subtitle: 'id'},
          },
        },
      ],
    },
    {
      title: 'Featured Image',
      name: 'featuredImage',
      type: 'image',
      options: {
        hotspot: true, // <-- Defaults to false
      },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
        },
        {
          name: 'attribution',
          type: 'string',
          title: 'Attribution',
        },
      ],
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
  ],
}
