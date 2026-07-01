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
