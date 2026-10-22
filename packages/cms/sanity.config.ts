import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {muxInput} from 'sanity-plugin-mux-input'
import {schemaTypes} from './schemas'
import deskStructure from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'mc-website-admin',

  projectId: '610gfr7y',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: deskStructure,
    }),
    visionTool(),
    muxInput(),
  ],

  document: {
    // Micro-site documents are created by the scaffold script, which sets
    // their locked title and slug (schemas/MicroSite.ts): not from "create".
    newDocumentOptions: (prev) => prev.filter((template) => template.templateId !== 'microSite'),
  },

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      // A micro-site page created from its site's page list (deskStructure.js)
      // starts with the `site` reference set.
      {
        id: 'microSitePage-for-site',
        title: 'Page',
        schemaType: 'microSitePage',
        parameters: [{name: 'siteId', type: 'string'}],
        value: ({siteId}: {siteId: string}) => ({site: {_type: 'reference', _ref: siteId}}),
      },
    ],
  },
})
