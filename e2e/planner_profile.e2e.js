// Batch 1 end-to-end: worldwide place search, travel mode, real budget total,
// recent searches under the AI search bar, Profile vs Settings, no "Free plan".
// usage: node e2e/planner_profile.e2e.js <base> <shotsDir> [mobile]
const { chromium } = require('playwright');
const [base, shots, mobile] = process.argv.slice(2);
const results = [];
const check = (name, ok, detail = '') => { results.push([name, !!ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); return ok; };
const tag = mobile ? 'mobile' : 'desktop';
const iso = d => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|in-browser Babel/.test(m.text())) errors.push(m.text()); });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const email = `voya.batch1.${Math.random().toString(36).slice(2, 8)}@example.com`;

  try {
    const s = await (await page.request.post(base + '/api/signup', { data: { name: 'Priya Batch', email, password: 'batch-one-pass-1' } })).json();
    await page.goto(base + '/login');
    await page.evaluate(([t]) => { localStorage.setItem('voya_token', t); localStorage.setItem('voya_user_name', 'Priya Batch'); }, [s.token]);

    // 1. worldwide destination + departure search
    await page.goto(base + '/app/plan', { waitUntil: 'networkidle' });
    await page.fill('input[placeholder="Where do you want to go?"]', 'santorini');
    const sant = await page.waitForSelector('text=Aegean, Greece', { timeout: 15000 }).then(() => true, () => false);
    check('destination search finds Santorini (Greece)', sant);
    await page.click('text=Aegean, Greece');
    check('picked value includes the country', (await page.inputValue('input[placeholder="Where do you want to go?"]')) === 'Santorini, Greece');
    await page.fill('input[placeholder="Your city or airport"]', 'BLR airport');
    check('departure search finds Kempegowda airport', await page.waitForSelector('text=Kempegowda International Airport', { timeout: 15000 }).then(() => true, () => false));
    await page.click('text=Kempegowda International Airport');
    const d = await page.$$('input[type=date]'); await d[0].fill(iso(20)); await d[1].fill(iso(22));
    await page.click('button:has-text("Train")');
    check('travel mode chip selectable', (await page.getAttribute('button:has-text("Train")', 'aria-pressed')) === 'true');
    check(`plan form has no horizontal overflow (${tag})`, (await overflow()) <= 1);
    await page.screenshot({ path: `${shots}/${tag}-b1-planform.png`, fullPage: !!mobile });

    // 2. generate: total is the real sum, shown against the budget
    await page.click('text=Generate itinerary');
    await page.waitForSelector('text=DAY-BY-DAY ITINERARY', { timeout: 90000 });
    await page.locator('[data-testid=trip-total]').scrollIntoViewIfNeeded();
    const total = await page.innerText('[data-testid=trip-total]');
    const diff = await page.innerText('[data-testid=budget-diff]');
    check('total is the real sum, not the budget', total === '₹30,000', total);
    check('shows how far under/over the budget it is', diff === '₹20,000 under your ₹50,000 budget', diff);
    check('cost line follows the travel mode', await page.isVisible('text=Train tickets') || !(await page.isVisible('text=Flights')));
    await page.screenshot({ path: `${shots}/${tag}-b1-cost.png` });
    await page.click('text=Save to wishlist');
    await page.waitForSelector('text=Saved to My Trips >> nth=0');

    // 3. recent searches sit inside the AI search card
    await page.goto(base + '/app', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=recent-searches] >> text=Santorini, Greece', { timeout: 10000 });
    const inCard = await page.evaluate(() => {
      const row = document.querySelector('[data-testid=recent-searches]');
      return Boolean(row && row.parentElement && row.parentElement.innerText.includes('AI TRAVEL SEARCH'));
    });
    check('recent searches are right under the AI search bar', inCard);
    check('no "Free plan" anywhere on the dashboard', !(await page.content()).match(/free plan/i));
    await page.screenshot({ path: `${shots}/${tag}-b1-dashboard.png` });

    // 4. profile = read-only summary with an Edit profile button
    await page.goto(base + '/app/profile', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=trips-taken] >> text=Santorini, Greece');
    check('profile lists trips', true);
    check('profile has no edit form', !(await page.isVisible('input[placeholder="Your full name"]')));
    check('no "Free plan" on profile', !(await page.content()).match(/free plan/i));
    check(`profile has no horizontal overflow (${tag})`, (await overflow()) <= 1);
    await page.screenshot({ path: `${shots}/${tag}-b1-profile.png`, fullPage: !!mobile });
    await page.click('button:has-text("Edit profile")');
    await page.waitForURL(/\/app\/settings#edit-profile/);
    check('"Edit profile" opens Settings', true);

    // 5. settings has the four sections and edits persist
    await page.waitForSelector('input[placeholder="Your full name"]');
    const nav = await page.innerText('[data-testid=settings-nav]');
    check('settings sections: profile, preferences, activity, account',
      ['Edit profile', 'Travel preferences', 'Recent activity', 'Account'].every(x => nav.includes(x)), nav.replace(/\n/g, ' | '));
    await page.waitForSelector('[data-testid=travel-preferences]', { timeout: 10000 });   // loads after the page
    check('settings shows travel preferences + recent activity + account',
      (await page.locator('text=Recent activity').count()) === 2 && await page.isVisible('#account'));
    await page.fill('input[placeholder="Your full name"]', 'Priya Renamed');
    await page.click('text=Save profile');
    await page.waitForSelector('text=Profile updated', { timeout: 10000 });
    await page.goto(base + '/app/profile', { waitUntil: 'networkidle' });
    check('profile shows the edited name', await page.waitForSelector('text=Priya Renamed >> visible=true', { timeout: 10000 }).then(() => true, () => false));
    await page.goto(base + '/app/settings', { waitUntil: 'networkidle' });
    check(`settings has no horizontal overflow (${tag})`, (await overflow()) <= 1);
    await page.screenshot({ path: `${shots}/${tag}-b1-settings.png`, fullPage: !!mobile });
  } catch (e) {
    check('flow completed without exception', false, e.message.split('\n')[0]);
    await page.screenshot({ path: `${shots}/${tag}-b1-FAILED.png`, fullPage: true });
  }
  check('no JS errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('test user:', email);
  await browser.close();
  const failed = results.filter(r => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed (${tag})`);
  process.exit(failed ? 1 : 0);
})();
