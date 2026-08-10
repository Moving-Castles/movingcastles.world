import {MdList} from 'react-icons/md'

export default {
  name: 'postIndex',
  title: 'Post index',
  icon: MdList,
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      description: 'Title of the /index page (used for the browser tab and share previews).',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'posts',
      title: 'Posts',
      description: 'Posts listed on the /index page, in order.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'post'}],
        },
      ],
    },
  ],
}
