// UI smoke test: console errors, failed requests, broken links, horizontal overflow, screenshots.
// usage: node ui_check.js <baseUrl> <outDir> [token]
const { chromium } = require('playwright');
const fs = require('fs');
const [base, out, token] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

const PAGES = [
  ['landing', '/'], ['login', '/login'], ['signup', '/login?mode=signup'], ['404', '/does-not-exist'],
  ...(token ? [['app', '/app'], ['plan', '/app/plan'], ['trips', '/app/trips'], ['explore', '/app/explore'], ['profile', '/app/profile']] : []),
];
const VIEWPORTS = [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 375, height: 812 }]];

(async () => {
  const browser = await chromium.launch();
  let problems = 0;
  for (const [vpName, vp] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: vp });
    if (token) await ctx.addInitScript(t => { try { localStorage.setItem('voya_token', t); localStorage.setItem('voya_user_name', 'Test User'); } catch (e) {} }, token);
    for (const [name, path] of PAGES) {
      const page = await ctx.newPage();
      const errors = [], failed = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      page.on('response', r => { if (r.status() >= 400 && !r.url().includes('/api/') && !r.url().endsWith('/does-not-exist')) failed.push(`${r.status()} ${r.url()}`); });
      page.on('requestfailed', r => failed.push(`FAILED ${r.url()} ${r.failure()?.errorText}`));
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const finalUrl = page.url().replace(base, '');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      await page.screenshot({ path: `${out}/${vpName}-${name}.png`, fullPage: vpName === 'mobile' || name === 'landing' });
      const apiErrors = errors.filter(e => /Failed to load resource.*(401|500|502|503)/.test(e));
      const realErrors = errors.filter(e => !apiErrors.includes(e) && !/in-browser Babel transformer/.test(e));
      const bad = realErrors.length || failed.length || overflow > 1;
      if (bad) problems++;
      console.log(`${bad ? 'FAIL' : 'ok  '} ${vpName.padEnd(7)} ${name.padEnd(8)} → ${finalUrl.padEnd(22)} overflowX=${overflow}px`);
      realErrors.forEach(e => console.log('      console:', e.slice(0, 200)));
      failed.forEach(f => console.log('      request:', f));
      await page.close();
    }
    await ctx.close();
  }

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const links = await page.$$eval('a[href]', as => [...new Set(as.map(a => a.getAttribute('href')))]);
  const ids = await page.$$eval('[id]', els => els.map(e => e.id));
  for (const href of links) {
    if (href.startsWith('#')) {
      const ok = href === '#' || ids.includes(href.slice(1));
      if (!ok) problems++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} anchor ${href}`);
    } else if (href.startsWith('/')) {
      const r = await page.request.get(base + href, { maxRedirects: 0 });
      const ok = r.status() < 400;
      if (!ok) problems++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} link   ${href} → ${r.status()}`);
    } else {
      console.log(`??   external ${href}`);
    }
  }
  await browser.close();
  console.log(problems ? `\n${problems} problem(s)` : '\nall clean');
  process.exit(problems ? 1 : 0);
})();
