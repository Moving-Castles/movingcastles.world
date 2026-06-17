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
