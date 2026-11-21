// Agent UI end-to-end: dashboard chat → live steps → preview → save → modify → reload →
// history → search bar → preferences on profile → open full plan. usage: node agent_ui_e2e.js <base> <shots> [mobile]
const { chromium } = require('playwright');
const [base, shots, mobile] = process.argv.slice(2);
const results = [];
const check = (name, ok, detail = '') => { results.push([name, !!ok]); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); return ok; };
const tag = mobile ? 'mobile' : 'desktop';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|in-browser Babel/.test(m.text())) errors.push(m.text()); });
  const email = `voya.agentui.${Math.random().toString(36).slice(2, 8)}@example.com`;

  const api = async (path, body, token) => (await page.request.post(base + path, {
    data: body, headers: token ? { Authorization: `Bearer ${token}` } : {} })).json();
  const lastReply = () => page.locator('[data-testid=agent-reply]').last().innerText();
  const ask = async (text) => {
    const before = await page.locator('[data-testid=agent-reply]').count();
    await page.fill('input[placeholder^="Plan a trip, ask"]', text);
    await page.keyboard.press('Enter');
    await page.waitForFunction(n => document.querySelectorAll('[data-testid=agent-reply]').length > n, before, { timeout: 90000 });
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

  try {
    const s = await api('/api/signup', { name: 'Agent Tester', email, password: 'agent-ui-pass-1' });
    await page.goto(base + '/login');
    await page.evaluate(([t]) => { localStorage.setItem('voya_token', t); localStorage.setItem('voya_user_name', 'Agent Tester'); }, [s.token]);

    // 1. plan a trip: live steps, then reply + preview
    await page.goto(base + '/app', { waitUntil: 'networkidle' });
    check('agent card shows greeting', await page.isVisible('text=I can plan a full trip'));
    await page.fill('input[placeholder^="Plan a trip, ask"]', 'Plan 3 days in Goa');
    await page.keyboard.press('Enter');
    const sawLive = await page.waitForSelector('[data-testid=agent-steps] >> text=Searching destinations', { timeout: 20000 }).then(() => true, () => false);
    check('live tool steps stream in ("Searching destinations")', sawLive);
    await page.waitForSelector('[data-testid=itinerary-preview]', { timeout: 90000 });
    const reply = await lastReply();
    check('reply summarises the plan with code-computed budget', /3-day Goa plan/.test(reply) && /₹30,000 of your ₹40,000 budget/.test(reply), reply.slice(0, 120));
    const steps = await page.locator('[data-testid=agent-steps]').last().innerText();
    check('completed steps listed with results', /Searching destinations · \d+ places found/.test(steps) && /Building your itinerary · 3 days/.test(steps), steps.replace(/\n/g, ' | '));
    const preview = await page.locator('[data-testid=itinerary-preview]').innerText();
    check('preview card: days, budget, verification', /3-day Goa trip/.test(preview) && /₹30,000 est\. · ₹10,000 left/.test(preview) && /stops verified on the map/.test(preview), preview.replace(/\n/g, ' | ').slice(0, 160));
    check('nothing saved before confirmation', (await (await page.request.get(base + '/api/get-trips', { headers: { Authorization: `Bearer ${s.token}` } })).json()).trips.length === 0);
    check(`no horizontal overflow with a plan (${tag})`, (await overflow()) <= 1);
    await page.locator('[data-testid=itinerary-preview]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/${tag}-agent-plan.png` });

    // 2. human-in-the-loop save
    await page.click('[data-testid=itinerary-preview] >> text=Save to My Trips');
    await page.waitForSelector('text=Saved · View in My Trips', { timeout: 15000 });
    check('save confirmed in chat', /saved in My Trips/.test(await lastReply()));
    const trips = (await (await page.request.get(base + '/api/get-trips', { headers: { Authorization: `Bearer ${s.token}` } })).json()).trips;
    check('trip really saved once', trips.length === 1 && trips[0].destination === 'Goa');

    // 3. modify conversationally
    await ask('Make day 2 less hectic');
    await page.waitForSelector('[data-testid=itinerary-preview] >> text=Slow beach day', { timeout: 30000 });
    check('modify: reply + only day 2 changed in preview', /^Made day 2 a slow beach day\./.test(await lastReply()));

    // 4. reload keeps the conversation
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=itinerary-preview]', { timeout: 15000 });
    check('conversation + preview restored after reload', await page.isVisible('text=Make day 2 less hectic'));

    // 5. open full plan in the existing itinerary view
    await page.click('text=Open full plan');
    await page.waitForURL(/\/app\/plan\?conversation=/);
    await page.waitForSelector('text=DAY-BY-DAY ITINERARY', { timeout: 15000 });
    check('"Open full plan" shows it in the existing itinerary view', await page.isVisible('text=Slow beach day'));
    await page.screenshot({ path: `${shots}/${tag}-agent-fullplan.png` });

    // 6. history + new chat
    await page.goto(base + '/app', { waitUntil: 'networkidle' });
    await page.click('button[aria-label="Past conversations"]');
    await page.waitForSelector('[data-testid=agent-history] >> text=Plan 3 days in Goa');
    check('history lists the conversation', true);
    await page.click('[data-testid=agent-history] >> text=Back to chat');
    await page.click('button[aria-label="New chat"]');
    check('new chat starts fresh', (await page.locator('[data-testid=agent-reply]').count()) === 1);

    // 7. dashboard search bar → agent; remembers preferences
    await page.fill('input[placeholder^="Try:"]', 'I prefer beaches and cafes');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=agent-reply]').length > 1, null, { timeout: 30000 });
    const st = await page.locator('[data-testid=agent-steps]').last().innerText();
    check('search bar sends to agent; preference remembered', /Remembering your preferences · Saved Travel interests/.test(st), st);

    // 8. weather question answered (grounded answer path)
    await ask("What's the weather in Goa?");
    check('weather question answered', /Checking weather/.test(await page.locator('[data-testid=agent-steps]').last().innerText()) && (await lastReply()).length > 20);

    // 9. profile: view, edit, delete preferences
    await page.goto(base + '/app/profile', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=travel-preferences] >> text=beaches');
    check('profile shows remembered preferences', await page.isVisible('[data-testid=travel-preferences] >> text=cafes'));
    await page.click('button[aria-label="Remove cafes"]');
    await page.locator('[data-testid=travel-preferences] input[placeholder="Add…"]').nth(2).fill('scuba diving');
    await page.keyboard.press('Enter');
    await page.click('[data-testid=travel-preferences] >> text=Relaxed');
    await page.click('text=Save preferences');
    await page.waitForSelector('text=Preferences saved');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid=travel-preferences] >> text=scuba diving');
    const prefsText = await page.locator('[data-testid=travel-preferences]').innerText();
    check('preference edits persist', !/\bcafes\b/.test(prefsText) && /beaches/.test(prefsText));
    check(`profile has no horizontal overflow (${tag})`, (await overflow()) <= 1);
    await page.locator('[data-testid=travel-preferences]').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${shots}/${tag}-agent-preferences.png` });
    page.once('dialog', d => d.accept());
    await page.click('text=Forget all');
    await page.waitForSelector('text=Preferences cleared');
    const p = (await (await page.request.get(base + '/api/preferences', { headers: { Authorization: `Bearer ${s.token}` } })).json()).preferences;
    check('forget all clears preferences', Object.keys(p).length === 0);
  } catch (e) {
    check('flow completed without exception', false, e.message.split('\n')[0]);
    await page.screenshot({ path: `${shots}/${tag}-agent-FAILED.png`, fullPage: true });
  }
  check('no JS errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('test user:', email);
  await browser.close();
  const failed = results.filter(r => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed (${tag})`);
  process.exit(failed ? 1 : 0);
})();
