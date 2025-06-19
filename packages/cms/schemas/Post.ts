import {
    MdArticle
} from "react-icons/md"

export default {
    name: 'post',
    title: 'Post',
    icon: MdArticle,
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
            name: 'type',
            title: 'Type',
            type: 'string',
            options: {
                list: [
                    { title: 'Writing', value: 'writing' },
                    { title: 'Resource', value: 'resource' },
                ],
                layout: 'radio'
            }
        },
        {
            name: 'authors',
            title: 'Authors',
            type: 'array',
            of: [{ type: 'string' }],
        },
        {
            title: 'Publication date',
            name: 'date',
            type: 'date',
        },
        {
            name: 'byline',
            title: 'Byline',
            type: 'contentEditor',
        },
        {
            name: 'content',
            title: 'Content',
            type: 'contentEditor',
        },
        {
            title: "Featured Image",
            name: "featuredImage",
            type: "image",
            options: {
                hotspot: true // <-- Defaults to false
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
                }
            ]
        },
        {
            title: 'Featured Video',
            name: 'featuredVideo',
            type: 'mux.video',
        },
        {
            title: 'Media',
            name: 'media',
            type: 'array',
            of: [{
                title: "Image",
                name: "image",
                type: "image",
                options: {
                    hotspot: true // <-- Defaults to false
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
                    }
                ]
            },
            {
                title: 'Video (embed)',
                name: 'videoEmbed',
                type: 'object',
                fields: [
                    {
                        type: 'url',
                        title: 'Url',
                        name: 'url',
                        description: 'Youtube or Vimeo url, eg. https://vimeo.com/235224162',
                    },
                    {
                        name: 'caption',
                        type: 'string',
                        title: 'Caption (english)',
                    },
                    {
                        name: 'caption_ar',
                        type: 'string',
                        title: 'Caption (arabic)',
                    },
                ]
            },
            {
                title: 'Video (local)',
                name: 'video',
                type: 'mux.video',
            },
            ],
        },
        {
            title: 'Githup repo',
            name: 'githubRepo',
            type: 'url',
        },
        {
            title: 'links',
            name: 'links',
            type: 'array',
            of: [{
                title: "Link",
                name: "link",
                type: "object",
                fields: [
                    {
                        title: 'Titel',
                        name: 'title',
                        type: 'string',
                        validation: (Rule: any) => Rule.required(),
                    },
                    {
                        title: 'URL',
                        name: 'url',
                        type: 'url',
                        validation: (Rule: any) => Rule.required(),
                    }
                ]
            }]
        },
        {
            name: 'arenaChannel',
            title: 'Are.na channel',
            description: 'eg. https://www.are.na/pwr-studio/moving-castles-llct6eocfxc',
            type: 'url',
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