// Reusable GROQ projection for contentEditor fields.
// Expands the asset reference on inline images so the renderer has a url.
// The leading `...` keeps every other key on the block intact.
const contentEditorProjection = `{
	...,
	content[] {
		...,
		_type == "image" => {
			...,
			asset->
		}
	}
}`

// Reusable projection for the standalone featured image field.
const imageProjection = `{
	...,
	asset->
}`

// The frontpage singleton holds an ordered list of references to posts.
// Coalesce to an empty array so a missing singleton resolves cleanly.
export const frontpageQuery = `
	coalesce(
		*[_type == "frontpage"][0].posts[]-> {
			_id,
			title,
			"slug": slug.current,
			date,
			authors
		},
		[]
	)
`

export const postsQuery = `
	*[_type == "post" && defined(slug.current)] | order(date desc, _createdAt desc) {
		_id,
		title,
		"slug": slug.current,
		date,
		authors,
		featuredImage ${imageProjection}
	}
`

export const postBySlugQuery = `
	*[_type == "post" && slug.current == $slug][0] {
		_id,
		title,
		"slug": slug.current,
		date,
		authors,
		content ${contentEditorProjection},
		featuredImage ${imageProjection}
	}
`
