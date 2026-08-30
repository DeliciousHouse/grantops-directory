import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const requiredString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${field} is required`)
  }
}

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export function validateListing(listing) {
  for (const field of ['slug', 'name', 'summary', 'official_url', 'checked_at']) {
    requiredString(listing[field], field)
  }
  if (!Array.isArray(listing.facts) || listing.facts.length === 0) {
    throw new Error('facts must contain at least one sourced fact')
  }
  listing.facts.forEach((fact, index) => {
    for (const field of ['label', 'value', 'source_url', 'checked_at']) {
      requiredString(fact[field], `facts[${index}].${field}`)
    }
  })
  return listing
}

const normalizedBasePath = config => (config.basePath || '').replace(/\/$/, '')

const layout = ({ title, description, siteName, basePath = '', body }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${basePath}/styles.css">
  <title>${escapeHtml(title)} · ${escapeHtml(siteName)}</title>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${basePath}/">${escapeHtml(siteName)}</a>
    <nav aria-label="Primary"><a href="${basePath}/#directory">Directory</a><a href="${basePath}/#methodology">Methodology</a></nav>
  </header>
  <main>${body}</main>
  <footer><p>Independent, source-dated research. No paid rankings.</p></footer>
</body>
</html>`

export function renderListingPage(listing, config) {
  validateListing(listing)
  const basePath = normalizedBasePath(config)
  const destination = listing.affiliate_url || listing.official_url
  const sponsored = Boolean(listing.affiliate_url)
  const facts = listing.facts.map(fact => `
    <li class="fact-row">
      <div><span class="eyebrow">${escapeHtml(fact.label)}</span><p>${escapeHtml(fact.value)}</p></div>
      <div class="source-meta"><a href="${escapeHtml(fact.source_url)}">Primary source ↗</a><small>Checked ${escapeHtml(fact.checked_at)}</small></div>
    </li>`).join('')
  return layout({
    title: listing.name,
    description: listing.summary,
    siteName: config.siteName,
    basePath,
    body: `
      <article class="detail-shell">
        <a class="back-link" href="${basePath}/">← All tools</a>
        <div class="detail-hero">
          <span class="badge">Verified profile</span>
          <h1>${escapeHtml(listing.name)}</h1>
          <p class="lede">${escapeHtml(listing.summary)}</p>
          <a class="button" href="${escapeHtml(destination)}"${sponsored ? ' rel="sponsored nofollow"' : ''}>Visit official site ↗${sponsored ? ' · Sponsored link' : ''}</a>
        </div>
        <section><h2>Source-checked facts</h2><ul class="fact-list">${facts}</ul></section>
        <aside class="disclosure"><strong>Commercial disclosure</strong><p>${escapeHtml(config.disclosure)}</p></aside>
      </article>`
  })
}

export function renderHomePage(listings, config) {
  listings.forEach(validateListing)
  const basePath = normalizedBasePath(config)
  const cards = listings.map(listing => `
    <article class="tool-card">
      <span class="eyebrow">Checked ${escapeHtml(listing.checked_at)}</span>
      <h2><a href="${basePath}/directory/${escapeHtml(listing.slug)}/">${escapeHtml(listing.name)}</a></h2>
      <p>${escapeHtml(listing.summary)}</p>
      <a class="text-link" href="${basePath}/directory/${escapeHtml(listing.slug)}/">View source profile →</a>
    </article>`).join('')
  return layout({
    title: config.siteName,
    description: config.description,
    siteName: config.siteName,
    basePath,
    body: `
      <section class="hero">
        <span class="badge">Evidence before rankings</span>
        <h1>${escapeHtml(config.description)}</h1>
        <p>Compare grant discovery, application, management, and reporting tools using dated primary sources—not copied reviews or paid placement.</p>
        <a class="button" href="${basePath}/#directory">Browse verified tools</a>
      </section>
      <section class="directory-section" id="directory">
        <div class="section-heading"><span class="eyebrow">The directory</span><h2>Start with the work you need to do.</h2></div>
        <div class="card-grid">${cards}</div>
      </section>
      <section class="methodology" id="methodology">
        <span class="eyebrow">Methodology</span>
        <h2>Every material fact points back to its source.</h2>
        <p>${escapeHtml(config.disclosure)}</p>
        <ol><li>Read the current official product source.</li><li>Record the fact and checked date.</li><li>Separate vendor claims from our editorial judgment.</li></ol>
      </section>`
  })
}

const styles = `:root{--color-bg:#fff;--color-heading:#061b31;--color-body:#64748d;--color-label:#273951;--color-accent:#533afd;--color-accent-hover:#4434d4;--color-border:#e5edf5;--color-dark:#1c1e54;--shadow:rgba(50,50,93,.25) 0 30px 45px -30px,rgba(0,0,0,.1) 0 18px 36px -18px}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--color-bg);color:var(--color-body);font-family:'Source Sans 3',system-ui,sans-serif;font-size:16px;font-weight:300;line-height:1.5}a{color:var(--color-accent);text-decoration:none}a:hover{color:var(--color-accent-hover)}a:focus-visible{outline:2px solid var(--color-accent);outline-offset:4px}.site-header{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:auto;padding:18px 24px;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border-bottom:1px solid rgba(229,237,245,.8)}.brand{color:var(--color-heading);font-size:18px;font-weight:600}.site-header nav{display:flex;gap:24px}.site-header nav a{color:var(--color-label);font-size:14px;font-weight:400}.hero,.directory-section,.detail-shell{max-width:1080px;margin:auto;padding:96px 24px}.hero{position:relative;min-height:600px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center}.hero:after{content:'';position:absolute;right:4%;top:20%;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#ffd7ef,#b9b9f9 55%,transparent 70%);filter:blur(2px);opacity:.65;z-index:-1}.hero h1{max-width:760px;margin:22px 0 20px;color:var(--color-heading);font-size:clamp(42px,7vw,72px);font-weight:300;line-height:1.02;letter-spacing:-1.4px}.hero p{max-width:650px;margin:0 0 32px;font-size:20px}.badge,.eyebrow{font-family:'Source Code Pro',monospace;text-transform:uppercase;letter-spacing:.08em}.badge{display:inline-block;padding:6px 10px;border:1px solid #d6d9fc;border-radius:4px;background:#f7f6ff;color:var(--color-accent);font-size:11px;font-weight:500}.eyebrow{display:block;color:var(--color-accent);font-size:11px;font-weight:500}.button{display:inline-block;padding:12px 18px;border-radius:4px;background:var(--color-accent);color:#fff;font-weight:400;box-shadow:var(--shadow)}.button:hover{background:var(--color-accent-hover);color:#fff}.directory-section{padding-top:48px}.section-heading{display:grid;grid-template-columns:160px 1fr;gap:32px;align-items:start;margin-bottom:36px}.section-heading h2,.methodology h2,.detail-shell h2{margin:0;color:var(--color-heading);font-size:34px;font-weight:300;line-height:1.12;letter-spacing:-.64px}.card-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.tool-card{padding:28px;border:1px solid var(--color-border);border-radius:6px;background:#fff;box-shadow:rgba(23,23,23,.06) 0 3px 6px;transition:transform .2s ease,box-shadow .2s ease}.tool-card:hover{transform:translateY(-3px);box-shadow:var(--shadow)}.tool-card h2{margin:16px 0 10px;font-size:27px;font-weight:300;letter-spacing:-.26px}.tool-card h2 a{color:var(--color-heading)}.tool-card p{min-height:72px}.text-link{font-weight:400}.methodology{margin-top:96px;padding:80px max(24px,calc((100vw - 1032px)/2));background:var(--color-dark);color:rgba(255,255,255,.72)}.methodology h2{max-width:680px;margin:16px 0;color:#fff}.methodology p,.methodology ol{max-width:700px}.methodology .eyebrow{color:#f96bee}.detail-shell{max-width:900px}.back-link{display:inline-block;margin-bottom:52px;font-weight:400}.detail-hero{padding:52px;border:1px solid var(--color-border);border-radius:8px;box-shadow:var(--shadow)}.detail-hero h1{margin:18px 0 12px;color:var(--color-heading);font-size:52px;font-weight:300;letter-spacing:-1px}.lede{max-width:680px;margin-bottom:28px;font-size:20px}.detail-shell section{margin-top:64px}.fact-list{padding:0;list-style:none;border-top:1px solid var(--color-border)}.fact-row{display:grid;grid-template-columns:1fr 180px;gap:32px;padding:24px 0;border-bottom:1px solid var(--color-border)}.fact-row p{margin:8px 0 0;color:var(--color-label);font-size:18px}.source-meta{display:flex;flex-direction:column;gap:8px;align-items:flex-start}.source-meta small{font-family:'Source Code Pro',monospace;font-size:10px}.disclosure{margin-top:48px;padding:22px;border-left:3px solid var(--color-accent);background:#f7f6ff;color:var(--color-label)}.disclosure p{margin-bottom:0}footer{padding:40px 24px;text-align:center;border-top:1px solid var(--color-border);font-size:13px}@media(max-width:720px){.site-header nav{display:none}.hero{min-height:auto;padding-top:72px;padding-bottom:72px}.hero:after{width:150px;height:150px;right:0;top:12%}.section-heading,.fact-row{grid-template-columns:1fr}.card-grid{grid-template-columns:1fr}.tool-card p{min-height:auto}.detail-hero{padding:30px}.detail-hero h1{font-size:40px}}
`

export async function buildSite({ outDir, listings, config }) {
  listings.forEach(validateListing)
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'index.html'), renderHomePage(listings, config))
  await writeFile(join(outDir, 'styles.css'), styles)
  for (const listing of listings) {
    const directory = join(outDir, 'directory', listing.slug)
    await mkdir(directory, { recursive: true })
    await writeFile(join(directory, 'index.html'), renderListingPage(listing, config))
  }
  const urls = ['', ...listings.map(listing => `directory/${listing.slug}/`)]
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(path => `  <url><loc>${config.siteUrl}/${path}</loc></url>`).join('\n')}\n</urlset>\n`
  await writeFile(join(outDir, 'sitemap.xml'), sitemap)
  await writeFile(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.siteUrl}/sitemap.xml\n`)
}
