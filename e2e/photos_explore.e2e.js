// Batch 2 end-to-end: real photos everywhere + Explore opens ready-made itineraries.
// usage: node e2e/photos_explore.e2e.js <base> <shotsDir> [mobile]
const { chromium } = require('playwright');
const [base, shots, mobile] = process.argv.slice(2);
const results = [];
const check = (name, ok, detail = '') => { results.push([name, !!ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); return ok; };
const tag = mobile ? 'mobile' : 'desktop';
const iso = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

(async () => {
  const browser = await browser_();
  async function browser_() { return chromium.launch(); }
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|in-browser Babel/.test(m.text())) errors.push(m.text()); });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  // Scroll everything into view (lazy images), wait, then count loaded/broken photos.
  const photos = async () => {
    await page.evaluate(async () => {
      const els = [...document.querySelectorAll('[data-testid=place-photo] img')];
      for (const el of els) { el.loading = 'eager'; }
      const main = document.querySelector('main') || document.scrollingElement;
      for (let y = 0; y < main.scrollHeight; y += 500) { main.scrollTop = y; await new Promise(r => setTimeout(r, 60)); }
      main.scrollTop = 0;
    });
    await page.waitForTimeout(2500);
    return page.evaluate(() => {
      const imgs = [...document.querySelectorAll('[data-testid=place-photo] img')];
      return { total: imgs.length, loaded: imgs.filter(i => i.complete && i.naturalWidth > 0).length,
               broken: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.alt) };
    });
  };
  const email = `voya.batch2.${Math.random().toString(36).slice(2, 8)}@example.com`;

  try {
    const s = await (await page.request.post(base + '/api/signup', { data: { name: 'Photo Tester', email, password: 'photo-test-pass-1' } })).json();
    await page.goto(base + '/login');
    await page.evaluate(([t]) => { localStorage.setItem('voya_token', t); localStorage.setItem('voya_user_name', 'Photo Tester'); }, [s.token]);

    // 1. dashboard: popular destinations + inspiration show real photos
    await page.goto(base + '/app', { waitUntil: 'networkidle' });
    const dash = await photos();
    check('dashboard destination cards show real photos', dash.loaded >= 9 && dash.broken.length === 0, JSON.stringify(dash));
    await page.screenshot({ path: `${shots}/${tag}-b2-dashboard.png`, fullPage: !!mobile });

    // 2. clicking a destination opens its ready-made itinerary
    await page.click('text=🇮🇩 Indonesia');                    // the Bali card in Popular destinations
    await page.waitForURL(/\/app\/plan\?sample=bali-culture/);
    await page.waitForSelector('text=DAY-BY-DAY ITINERARY', { timeout: 15000 });
    check('dashboard destination opens a ready itinerary', await page.isVisible('text=Bali Trip'));
    const hero = await photos();
    check('itinerary header has a real photo', hero.loaded >= 1 && hero.broken.length === 0, JSON.stringify(hero));
    check('photo credit shown', await page.isVisible('text=Photo: Wikimedia Commons'));
    check('sample shows flexible dates', await page.isVisible('text=Flexible'));
    await page.locator('[data-testid=trip-total]').scrollIntoViewIfNeeded();
    check('sample total computed in code', (await page.innerText('[data-testid=trip-total]')) === '₹1,12,000');
    await page.screenshot({ path: `${shots}/${tag}-b2-sample.png` });
    await page.click('text=Save to wishlist');
    await page.waitForSelector('text=Saved to My Trips >> nth=0');

    // 3. My Trips card shows the photo
    await page.goto(base + '/app/trips', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=View itinerary');
    const trips = await photos();
    check('My Trips card shows a real photo', trips.loaded >= 1 && trips.broken.length === 0, JSON.stringify(trips));
    await page.screenshot({ path: `${shots}/${tag}-b2-trips.png` });

    // 4. Explore: photos, days + cost, view itinerary, customise
    await page.goto(base + '/app/explore', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=₹1,23,000 est.', { timeout: 10000 });
    const exp = await photos();
    check('all 12 Explore cards show real photos', exp.loaded === 12 && exp.broken.length === 0, JSON.stringify(exp));
    check('Explore cards show days and estimated cost', await page.isVisible('text=5 days · for 2 >> nth=0'));
    check(`explore has no horizontal overflow (${tag})`, (await overflow()) <= 1);
    await page.screenshot({ path: `${shots}/${tag}-b2-explore.png`, fullPage: !!mobile });
    await page.click('button:has-text("View itinerary") >> nth=0');
    await page.waitForURL(/\/app\/plan\?sample=thailand-beach/);
    await page.waitForSelector('text=DAY-BY-DAY ITINERARY', { timeout: 15000 });
    check('"View itinerary" opens the ready-made plan (not the form)', await page.isVisible('text=Grand Palace'));
    await page.goto(base + '/app/explore', { waitUntil: 'networkidle' });
    await page.click('text=Customise → >> nth=1');
    await page.waitForURL(/\/app\/plan\?destination=Bali/);
    check('"Customise" starts the planner prefilled', (await page.inputValue('input[placeholder="Where do you want to go?"]')) === 'Bali');

    // 5. a brand-new destination gets a photo (server lookup) or keeps its gradient — never a broken image
    await page.fill('input[placeholder="Where do you want to go?"]', 'Munnar');
    const d = await page.$$('input[type=date]'); await d[0].fill(iso(20)); await d[1].fill(iso(21));
    await page.click('text=Generate itinerary');
    await page.waitForSelector('text=DAY-BY-DAY ITINERARY', { timeout: 90000 });
    const fresh = await photos();
    check('new trip: real photo found, never a broken image', fresh.broken.length === 0, JSON.stringify(fresh));

    // 6. landing page destination photos load
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const bgs = await page.$$eval('.dest-img', els => els.map(e => (getComputedStyle(e).backgroundImage.match(/url\("([^"]+)"\)/) || [])[1]).filter(Boolean));
    let ok = 0;
    for (const u of bgs) { const r = await page.request.get(u); if (r.ok() && /image\//.test(r.headers()['content-type'] || '')) ok++; }
    check('landing destination cards use real photos that load', bgs.length === 4 && ok === 4, `${ok}/${bgs.length}`);
    await page.locator('.dest-grid').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${shots}/${tag}-b2-landing.png` });
  } catch (e) {
    check('flow completed without exception', false, e.message.split('\n')[0]);
    await page.screenshot({ path: `${shots}/${tag}-b2-FAILED.png`, fullPage: true });
  }
  check('no JS errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('test user:', email);
  await browser.close();
  const failed = results.filter(r => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed (${tag})`);
  process.exit(failed ? 1 : 0);
})();
