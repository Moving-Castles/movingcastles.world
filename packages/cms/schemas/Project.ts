import {
    MdGames,
} from "react-icons/md"

export default {
    name: 'project',
    title: 'Project',
    icon: MdGames,
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
            name: 'active',
            title: 'Active',
            type: 'boolean',
        },
        {
            name: 'shortDescription',
            title: 'Short Description',
            type: 'string',
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
