import {
    MdHome,
} from "react-icons/md"

export default {
    name: 'about',
    title: 'About',
    icon: MdHome,
    type: 'document',
    fields: [
        {
            name: 'title',
            title: 'Title (english)',
            type: 'string',
            description: 'Title in English',
            validation: (Rule: any) => Rule.required(),
        },
        {
            name: 'tagline',
            title: 'Tagline',
            type: 'text',
        },
        {
            name: 'content',
            title: 'Content',
            type: 'contentEditor',
        },
        {
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (Rule: any) => Rule.required()
        }
    ],
}