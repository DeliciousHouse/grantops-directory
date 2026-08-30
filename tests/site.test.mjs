import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateListing, renderListingPage, renderHomePage, buildSite } from '../src/site.mjs'

const listing = {
  slug: 'example-service',
  name: 'Example Service',
  summary: 'A concise, buyer-useful summary.',
  official_url: 'https://example.com/',
  checked_at: '2026-08-29',
  facts: [
    {
      label: 'Primary use',
      value: 'Example workflow',
      source_url: 'https://example.com/product',
      checked_at: '2026-08-29'
    }
  ],
  affiliate_url: null
}

test('validateListing rejects a material fact without provenance', () => {
  const invalid = structuredClone(listing)
  delete invalid.facts[0].source_url
  assert.throws(() => validateListing(invalid), /source_url/)
})

test('renderListingPage exposes primary sources and checked dates', () => {
  const html = renderListingPage(listing, {
    siteName: 'Buyer Directory',
    siteUrl: 'https://directory.example',
    disclosure: 'Some links may earn us a commission.'
  })
  assert.match(html, /https:\/\/example\.com\/product/)
  assert.match(html, /Checked 2026-08-29/)
  assert.match(html, /Example Service/)
})

test('renderListingPage labels compensated links', () => {
  const monetized = { ...listing, affiliate_url: 'https://partner.example/ref' }
  const html = renderListingPage(monetized, {
    siteName: 'Buyer Directory',
    siteUrl: 'https://directory.example',
    disclosure: 'Some links may earn us a commission.'
  })
  assert.match(html, /Sponsored link/)
  assert.match(html, /rel="sponsored nofollow"/)
})

test('renderHomePage includes editorial independence disclosure', () => {
  const html = renderHomePage([listing], {
    siteName: 'Buyer Directory',
    siteUrl: 'https://directory.example',
    description: 'Evidence-first comparisons.',
    disclosure: 'Compensation never determines inclusion or ranking.'
  })
  assert.match(html, /Compensation never determines inclusion or ranking\./)
  assert.match(html, /Example Service/)
})

test('renderHomePage prefixes project-site assets and links with basePath', () => {
  const html = renderHomePage([listing], {
    siteName: 'Buyer Directory',
    siteUrl: 'https://directory.example/grantops-directory',
    basePath: '/grantops-directory',
    description: 'Evidence-first comparisons.',
    disclosure: 'Compensation never determines inclusion or ranking.'
  })
  assert.match(html, /href="\/grantops-directory\/styles\.css"/)
  assert.match(html, /href="\/grantops-directory\/directory\/example-service\/"/)
  assert.match(html, /href="\/grantops-directory\/#directory"/)
})

test('buildSite writes index, listing, stylesheet, robots, and sitemap files', async () => {
  const outDir = join(tmpdir(), `mogul-site-${Date.now()}`)
  await mkdir(outDir, { recursive: true })
  await buildSite({
    outDir,
    listings: [listing],
    config: {
      siteName: 'Buyer Directory',
      siteUrl: 'https://directory.example',
      description: 'Evidence-first comparisons.',
      disclosure: 'Compensation never determines inclusion or ranking.'
    }
  })
  const index = await readFile(join(outDir, 'index.html'), 'utf8')
  const detail = await readFile(join(outDir, 'directory', listing.slug, 'index.html'), 'utf8')
  const css = await readFile(join(outDir, 'styles.css'), 'utf8')
  const robots = await readFile(join(outDir, 'robots.txt'), 'utf8')
  const sitemap = await readFile(join(outDir, 'sitemap.xml'), 'utf8')
  assert.match(index, /Example Service/)
  assert.match(detail, /Primary source/)
  assert.match(css, /--color-accent/)
  assert.match(robots, /Sitemap: https:\/\/directory\.example\/sitemap\.xml/)
  assert.match(sitemap, /https:\/\/directory\.example\/directory\/example-service\//)
})
