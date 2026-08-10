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

// Applied one level deep again for `abstract` and expandable `details`
// blocks, which nest a content array of their own (a single nesting level,
// by schema design).
const contentEditorProjection = `{
	...,
	content[] {
		${contentBlockProjection},
		_type == "abstract" => {
			...,
			content[] {
				${contentBlockProjection}
			}
		},
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

// The postIndex singleton holds the ordered list of posts rendered as the
// table at /index. The inner filter drops references whose post is missing or
// unpublished, and both coalesces mean a missing singleton (or an empty list)
// resolves to an empty index rather than faulting the page.
export const postIndexQuery = `
	coalesce(
		*[_type == "postIndex"][0] {
			title,
			"posts": coalesce(
				posts[defined(@->slug.current)]-> {
					_id,
					title,
					"slug": slug.current,
					date,
					authors
				},
				[]
			)
		},
		{"posts": []}
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

// One nav row (the header's or the footer's). A link is an external `navLink`
// (url), a `navPostLink` (reference to a post, projected down to its slug), or
// a `navIndexLink` (the post index — label only, no target to resolve). The
// filter drops post links whose referenced post is missing/unpublished, so the
// client never builds a dead /posts/ href, and passes every other type through.
const navLinksProjection = `[
			_type != "navPostLink" || defined(reference->slug.current)
		] {
			_key,
			_type,
			label,
			_type == "navLink" => {url},
			_type == "navPostLink" => {"slug": reference->slug.current}
		}`

// Header and footer links live on the `siteSettings` singleton, as two
// independently ordered lists. The coalesces mean a missing singleton — or a
// row the editor has left empty — resolves to an empty array rather than null.
export const siteSettingsQuery = `
	coalesce(
		*[_type == "siteSettings"][0] {
			"headerLinks": coalesce(headerLinks${navLinksProjection}, []),
			"footerLinks": coalesce(footerLinks${navLinksProjection}, [])
		},
		{"headerLinks": [], "footerLinks": []}
	)
`

export const postBySlugQuery = `
	*[_type == "post" && slug.current == $slug][0] {
		_id,
		title,
		"slug": slug.current,
		date,
		projectCode,
		metaDescription,
		authors,
		externalLinks,
		content ${contentEditorProjection},
		showToc,
		toc,
		references,
		featuredImage ${imageProjection}
	}
`
