import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildSite } from '../src/site.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const [config, listings] = await Promise.all([
  readFile(join(root, 'data', 'site.json'), 'utf8').then(JSON.parse),
  readFile(join(root, 'data', 'listings.json'), 'utf8').then(JSON.parse)
])

await buildSite({ outDir: join(root, 'dist'), config, listings })
console.log(`Built ${listings.length} verified listings in ${join(root, 'dist')}`)
