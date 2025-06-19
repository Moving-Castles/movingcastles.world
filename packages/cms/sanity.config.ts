import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { muxInput } from 'sanity-plugin-mux-input'
import { schemaTypes } from './schemas'
import deskStructure from './deskStructure'

export default defineConfig({
  name: 'default',
  title: 'mc-website-admin',

  projectId: '610gfr7y',
  dataset: 'production',

  plugins: [deskTool({
    structure: deskStructure
  }), visionTool(), muxInput()],

  schema: {
    types: schemaTypes,
  },
})
