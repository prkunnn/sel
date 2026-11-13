// 自動遊玩測試：node tests/playthrough.mjs <story> <desktop|mobile> <outDir>
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'fs';

const [story = 'sports', device = 'desktop', out = 'shots'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const URL = 'http://127.0.0.1:8765/index.html';
const errors = [];
const shots = new Set();

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext(device === 'mobile'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }
  : { viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const shot = async (name) => { if (shots.has(name)) return; shots.add(name); await page.screenshot({ path: `${out}/${device}-${story}-${name}.png` }); };
const vis = (sel) => page.locator(sel).first().isVisible().catch(() => false);
const sleep = (ms) => page.waitForTimeout(ms);
const tap = async (loc) => { if (device === 'mobile') await loc.tap(); else await loc.click(); };

await page.goto(URL);
await sleep(1500);
await shot('01-title');
await tap(page.locator('#btn-help')); await sleep(500); await shot('02-help');
await tap(page.locator('#screen-help [data-close]'));
await tap(page.locator('#btn-start')); await sleep(600);
await shot('03-select');
await tap(page.locator('.avatar-btn[data-avatar="boy"]'));
await tap(page.locator(`.story-card[data-story="${story}"]`));
await sleep(2500); await shot('04-surf');

const t0 = Date.now();
let evCount = 0, mgSeen = {}, overflow = [];
const checkOverflow = async (tag) => {
  const o = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('.opt, .chip, .btn, .piece, .island, .bubble').forEach(e => {
      if (!e.offsetParent) return;
      if (e.scrollWidth > e.clientWidth + 2) bad.push((e.className + ':' + e.textContent).slice(0, 60));
      const r = e.getBoundingClientRect(); if (r.right > innerWidth + 1 || r.left < -1) bad.push('offscreen:' + e.textContent.slice(0, 40));
    });
    return bad;
  });
  if (o.length) overflow.push(tag + ' => ' + o.join(' | '));
};

while (Date.now() - t0 < 9 * 60 * 1000) {
  if (await page.locator('#screen-result.active').count()) break;
  if (await vis('#minigame')) {
    const title = await page.locator('#mg-title').textContent({ timeout: 1000 });
    mgSeen[title] = (mgSeen[title] || 0) + 1;
    await sleep(400); await shot('mg-' + title);
    await checkOverflow('mg-' + title);
    if (title === '呼吸光圈') {
      await page.keyboard.down('Space');
      await page.locator('#mg-body .btn-ok').waitFor({ timeout: 60000 });
      await page.keyboard.up('Space');
      await shot('mg-breath-done');
      await tap(page.locator('#mg-body .btn-ok'));
    } else if (title === '安全港停靠') {
      await page.keyboard.down('Space');
      await page.locator('#mg-body .chip').first().waitFor({ timeout: 40000 });
      await page.keyboard.up('Space');
      await tap(page.locator('#mg-body .chip').nth(2));
      await sleep(300); await shot('mg-harbor-body');
      await tap(page.locator('#mg-body .opt').nth(1));
      await page.locator('#mg-body .btn-ok:not([disabled])').waitFor({ timeout: 10000 });
      await shot('mg-harbor-rest');
      await tap(page.locator('#mg-body .btn-ok'));
    } else if (title === '支持浮島') {
      await tap(page.locator('#mg-body .island').first());
      for (let k = 0; k < 8; k++) {
        if (await vis('#mg-body .btn-ok')) break;
        const opts = page.locator('#mg-body .opts .opt');
        const n = await opts.count();
        // 先故意點第一個（可能是不清楚的說法），再點正確的
        await tap(opts.nth(0)); await sleep(250);
        if (await page.locator('#mg-body .opts .opt').count() === n && n) { await shot('mg-island-hint'); await tap(page.locator('#mg-body .opts .opt').nth(1)); await sleep(250); }
      }
      await shot('mg-island-done');
      await tap(page.locator('#mg-body .btn-ok'));
    } else if (title === '想法拼圖') {
      for (let k = 0; k < 10; k++) {
        if (await vis('#mg-body .btn-ok')) break;
        const p = page.locator('#mg-body .piece:not(.used)');
        if (!(await p.count())) break;
        await tap(p.nth(k % (await p.count()))); await sleep(300);
      }
      await shot('mg-puzzle-done');
      await tap(page.locator('#mg-body .btn-ok'));
    }
    await sleep(500);
    continue;
  }
  if (await vis('#panel')) {
    await sleep(250);
    const tag = (await page.locator('#scene-tag').textContent({ timeout: 1000 }).catch(() => '')) || '';
    const m = tag.match(/事件 (\d)/); const ev = m ? +m[1] : 0;
    if (ev > evCount) { evCount = ev; await sleep(500); await shot(`ev${ev}-scene`); }
    const q = (await page.locator('#panel-body .step-q').count()) ? ((await page.locator('#panel-body .step-q').first().textContent({ timeout: 1000 }).catch(() => '')) || '') : '';
    await checkOverflow(`ev${ev}:${q.slice(0, 10)}`);
    if (await vis('#panel-body .chip')) {
      await shot(`ev${ev}-body`);
      await tap(page.locator('#panel-body .chip').nth(0));
      await tap(page.locator('#panel-body .chip').nth(1));
      await tap(page.locator('#panel-body .primary'));
      await sleep(400);
      await shot(`ev${ev}-wave`);
      continue;
    }
    if (q.includes('技能')) {
      await shot(`ev${ev}-skill`);
      const recd = page.locator('#panel-body .opt.rec');
      if (await recd.count()) await tap(recd.first()); else await tap(page.locator('#panel-body .opt').last());
      await sleep(600); continue;
    }
    if (q.includes('情緒')) {
      await shot(`ev${ev}-emotion`);
      // 第 2 個事件測試「其他感受」
      if (ev === 2) { await tap(page.locator('#panel-body .opt').last()); await sleep(200); }
      await tap(page.locator('#panel-body .opt').nth(ev % 4)); await sleep(400); continue;
    }
    if (await vis('#panel-body .opt:not([disabled])')) {
      if (q.includes('行動')) await shot(`ev${ev}-action`);
      // 故事三事件 4：先測試不安全選項
      const n = await page.locator('#panel-body .opt:not([disabled])').count();
      const idx = (story === 'trip' && ev === 4 && n === 3 && q.includes('行動')) ? 2 : 0;
      await tap(page.locator('#panel-body .opt:not([disabled])').nth(idx)); await sleep(400); continue;
    }
    if (await vis('#panel-body .primary')) { await tap(page.locator('#panel-body .primary')); await sleep(150); continue; }
    await sleep(200); continue;
  }
  // 衝浪中 / 挑戰中
  const ch = await page.evaluate(() => OK.Surf.inChallenge);
  if (ch === 'rhythm') { await shot('challenge-rhythm'); await page.keyboard.press('Space'); await sleep(240); continue; }
  if (ch === 'balance') {
    await shot('challenge-balance');
    const b = await page.evaluate(() => 0);
    await page.keyboard.down(Math.random() < .5 ? 'ArrowLeft' : 'ArrowRight'); await sleep(200); await page.keyboard.up('ArrowLeft'); await page.keyboard.up('ArrowRight'); await sleep(150); continue;
  }
  if (ch === 'collect') { await shot('challenge-collect'); await page.keyboard.press('Space'); await sleep(500); continue; }
  if (device === 'mobile') await page.locator('#scene').tap({ position: { x: 200, y: 600 } }).catch(() => { }); else await page.keyboard.press('Space');
  await sleep(700);
  if (Date.now() - t0 > 8000) await shot('05-travel');
}

const done = await page.locator('#screen-result.active').count();
await sleep(1200);
await shot('90-result');
if (done) {
  await page.evaluate(() => document.querySelector('#screen-result').scrollTo(0, 99999));
  await sleep(300); await shot('91-result-bottom');
  await checkOverflow('result');
  await tap(page.locator('#btn-png'));
  await page.locator('#png-modal:not([hidden])').waitFor({ timeout: 10000 });
  await sleep(500); await shot('92-png');
  const data = await page.locator('#png-img').getAttribute('src');
  fs.writeFileSync(`${out}/${device}-${story}-card.png`, Buffer.from(data.split(',')[1], 'base64'));
}
const recs = await page.evaluate(() => OK.Game.records.map(r => ({ t: r.title, e: r.emotion, a: Math.round(r.aEmo) + '→' + Math.round(r.aAfter), s: r.skill, h: r.helpful, act: r.action.slice(0, 14), ch: r.challenge })));
console.log(JSON.stringify({ story, device, finished: !!done, seconds: Math.round((Date.now() - t0) / 1000), events: recs.length, minigames: mgSeen, errors, overflow: overflow.slice(0, 15), recs }, null, 1));
await browser.close();
