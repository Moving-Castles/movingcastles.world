#!/usr/bin/env node
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
//  dev.mjs =>
//  runs mprocs with a pane for every micro-site
//
// * * * * * * * * * * * * * * * * * * * * * * * * * * *
//
// `pnpm dev` at the repo root. Starts mprocs with the processes in mprocs.yaml
// (the main site and the cms) plus one per package in packages/micro-sites/,
// so a new micro-site shows up without editing the config.
//
// Each micro-site gets its own port, from 5180 up in alphabetical order.
// Otherwise every Vite server would try 5173 at once, and whichever won the
// race would push the main site off its usual port.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import YAML from 'yaml'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const MICRO_SITES = 'packages/micro-sites'
const FIRST_PORT = 5180

const config = YAML.parse(fs.readFileSync(path.join(ROOT, 'mprocs.yaml'), 'utf8'))

const sites = fs
  .readdirSync(path.join(ROOT, MICRO_SITES), {withFileTypes: true})
  .filter((entry) => entry.isDirectory())
  .filter((entry) => fs.existsSync(path.join(ROOT, MICRO_SITES, entry.name, 'package.json')))
  .map((entry) => entry.name)
  .sort()

sites.forEach((name, i) => {
  config.procs[name] = {
    cwd: `${MICRO_SITES}/${name}`,
    // pnpm passes the flag through to `vite dev`.
    shell: `pnpm dev --port ${FIRST_PORT + i}`,
  }
})

// Relative cwds resolve against the directory mprocs runs in (the repo root),
// not the config's, so the merged config can live outside the repo.
const configPath = path.join(os.tmpdir(), 'movingcastles-mprocs.yaml')
fs.writeFileSync(configPath, YAML.stringify(config))

const {status, error} = spawnSync('mprocs', ['--config', configPath], {
  cwd: ROOT,
  stdio: 'inherit',
})
if (error) throw error
process.exit(status ?? 1)
