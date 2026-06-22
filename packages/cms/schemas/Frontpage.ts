import {MdHome} from 'react-icons/md'

export default {
  name: 'frontpage',
  title: 'Frontpage',
  icon: MdHome,
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'posts',
      title: 'Posts',
      description: 'Posts to feature on the front page, in order.',
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
