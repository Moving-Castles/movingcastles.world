import {at, defineMigration, unset} from 'sanity/migrate'

// The second half of `micro-site-pages`: removes the page fields it left on
// the `microSite` documents. Run it once every micro-site is served by the
// code that renders pages — until then, a production build of `main` still
// reads these fields, and removing them would publish an empty page.
//
//   pnpm --filter cms exec sanity migrations run micro-site-cleanup              # dry run
//   pnpm --filter cms exec sanity migrations run micro-site-cleanup --no-dry-run

const PAGE_FIELDS = ['subtitle', 'metaDescription', 'metadata', 'image', 'content']

export default defineMigration({
  title: 'Remove the page fields left on microSite documents by micro-site-pages',
  documentTypes: ['microSite'],
  migrate: {
    document(doc) {
      return PAGE_FIELDS.filter((field) => field in doc).map((field) => at(field, unset()))
    },
  },
})
