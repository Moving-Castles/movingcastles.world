// Reusable GROQ projection for contentEditor blocks.
// Expands the asset reference on inline images and videos so the renderer has
// a url, and resolves the slug of any `internalLink` annotation so the
// renderer can build an href without a second round-trip.
// The leading `...` keeps every other key on the block intact.
const contentBlockProjection = `
	...,
	_type == "image" => {
		...,
		asset->,
		dayImage {
			...,
			asset->
		}
	},
	_type == "video" => {
		...,
		asset->
	},
	markDefs[] {
		...,
		_type == "internalLink" => {
			...,
			"slug": reference->slug.current
		}
	}`

// Applied one level deep again for expandable `details` blocks, which nest a
// content array of their own (a single nesting level, by schema design).
const contentEditorProjection = `{
	...,
	content[] {
		${contentBlockProjection},
		_type == "details" => {
			...,
			content[] {
				${contentBlockProjection}
			}
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

// Header/footer links live on the `siteSettings` singleton. Each link is either
// an external `navLink` (url) or an internal `navPostLink` (reference to a post,
// projected down to its slug). The filter drops internal links whose referenced
// post is missing/unpublished, so the client never builds a dead /posts/ href.
// Coalesce to an empty array so a missing singleton resolves cleanly.
export const siteSettingsQuery = `
	coalesce(
		*[_type == "siteSettings"][0].links[
			_type == "navLink" || defined(reference->slug.current)
		] {
			_key,
			_type,
			label,
			_type == "navLink" => {url},
			_type == "navPostLink" => {"slug": reference->slug.current}
		},
		[]
	)
`

export const postBySlugQuery = `
	*[_type == "post" && slug.current == $slug][0] {
		_id,
		title,
		"slug": slug.current,
		date,
		metaDescription,
		authors,
		content ${contentEditorProjection},
		references,
		featuredImage ${imageProjection}
	}
`
