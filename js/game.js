/* =========================================================
   game.js — 遊戲主流程
   首頁 → 故事選擇 → 衝浪 ⇄ 事件（六個）→ 我的 OK 曲線
   每個事件：對話 →（衝浪挑戰）→ 情緒辨識 → 身體訊號 →
             波浪變化 → 調節技能 → 自評 → 行動選擇 → 回應
   ========================================================= */
window.OK = window.OK || {};

OK.Game = (function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const A = OK.Art, Surf = OK.Surf, Audio = OK.Audio;
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);

  const settings = { sound: true, reduced: false };
  let avatar = 'girl';
  let story = null, records = [], session = 0, evIdx = 0;
  let panelAnim = 0, panelCast = [], panelScene = 'gate', panelProps = [];
  let hintShown = false;

  /* ---------------- 設定 ---------------- */
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem('okSurfSettings') || '{}');
      if (typeof s.sound === 'boolean') settings.sound = s.sound;
      if (typeof s.reduced === 'boolean') settings.reduced = s.reduced;
      if (s.avatar) avatar = s.avatar;
    } catch (e) { }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !localStorage_has('okSurfSettings')) settings.reduced = true;
  }
  function localStorage_has(k) { try { return localStorage.getItem(k) != null; } catch (e) { return false; } }
  function saveSettings() { try { localStorage.setItem('okSurfSettings', JSON.stringify({ sound: settings.sound, reduced: settings.reduced, avatar })); } catch (e) { } }
  function applySettings() {
    Audio.setEnabled(settings.sound);
    Surf.setReduced(settings.reduced);
    document.body.classList.toggle('reduced', settings.reduced);
    ['#tg-sound', '#tg-sound-2'].forEach(id => { const b = $(id); b.setAttribute('aria-pressed', String(settings.sound)); b.querySelector('.tg-label').textContent = '音效：' + (settings.sound ? '開' : '關'); });
    ['#tg-motion', '#tg-motion-2'].forEach(id => { const b = $(id); b.setAttribute('aria-pressed', String(settings.reduced)); b.querySelector('.tg-label').textContent = '降低動畫：' + (settings.reduced ? '開' : '關'); });
    saveSettings();
  }

  /* ---------------- 畫面切換 ---------------- */
  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }
  function banner(html, ms = 2200) {
    const b = $('#hud-banner'); b.innerHTML = html; b.classList.add('show');
    clearTimeout(banner._t); banner._t = setTimeout(() => b.classList.remove('show'), ms);
  }
  function hint(text, ms) {
    const h = $('#hud-hint'); h.textContent = text; h.classList.toggle('show', !!text);
    clearTimeout(hint._t); if (ms) hint._t = setTimeout(() => h.classList.remove('show'), ms);
  }

  /* ---------------- 首頁與選單 ---------------- */
  function renderAvatars() {
    $$('.avatar-btn').forEach(b => {
      const sel = b.dataset.avatar === avatar;
      b.classList.toggle('selected', sel); b.setAttribute('aria-checked', String(sel));
      A.portrait(b.querySelector('canvas'), b.dataset.avatar, sel ? 'happy' : 'calm');
    });
  }

  function bindUI() {
    const firstGesture = () => { Audio.init(); Audio.ensureMusic(); window.removeEventListener('pointerdown', firstGesture); window.removeEventListener('keydown', firstGesture); };
    window.addEventListener('pointerdown', firstGesture); window.addEventListener('keydown', firstGesture);

    $('#btn-start').onclick = () => { Audio.init(); Audio.play('select'); showScreen('screen-select'); renderAvatars(); };
    $('#btn-help').onclick = () => { Audio.play('click'); $('#screen-help').hidden = false; $('#screen-help [data-close]').focus(); };
    $$('[data-close]').forEach(b => b.onclick = () => { Audio.play('click'); b.closest('.modal').hidden = true; });
    $('#btn-select-back').onclick = () => { Audio.play('click'); showScreen('screen-title'); };
    const tgSound = () => { settings.sound = !settings.sound; applySettings(); Audio.init(); Audio.ensureMusic(); Audio.play('click'); };
    const tgMotion = () => { settings.reduced = !settings.reduced; applySettings(); Audio.play('click'); };
    $('#tg-sound').onclick = tgSound; $('#tg-sound-2').onclick = tgSound;
    $('#tg-motion').onclick = tgMotion; $('#tg-motion-2').onclick = tgMotion;
    $$('.avatar-btn').forEach(b => b.onclick = () => { avatar = b.dataset.avatar; Audio.play('select'); renderAvatars(); saveSettings(); });
    $$('.story-card').forEach(b => b.onclick = () => { Audio.play('select'); startStory(b.dataset.story); });

    // 暫停
    $('#btn-pause').onclick = () => openPause();
    $('#btn-resume').onclick = () => closePause();
    $('#btn-quit').onclick = () => { closePause(); quitToMenu(); };

    // 結果
    $('#btn-replay').onclick = () => { Audio.play('select'); startStory(story.id); };
    $('#btn-menu').onclick = () => { Audio.play('click'); Surf.setMode('title'); Audio.music('title'); showScreen('screen-select'); renderAvatars(); };
    $('#btn-png').onclick = async () => {
      Audio.play('click');
      const btn = $('#btn-png'); btn.disabled = true; btn.textContent = '產生中…';
      try {
        const url = await OK.Results.makeCard(story, records, avatar);
        $('#png-img').src = url; $('#png-modal').hidden = false;
        $('#btn-png-dl').onclick = () => {
          try { const a = document.createElement('a'); a.href = url; a.download = `我的OK曲線-${story.short}.png`; document.body.appendChild(a); a.click(); a.remove(); toast('如果沒有開始下載，請右鍵或長按圖片儲存'); }
          catch (e) { toast('請右鍵或長按圖片儲存'); }
        };
      } catch (e) { console.error('makeCard failed', e); toast('成果卡產生失敗，請再試一次'); }
      btn.disabled = false; btn.textContent = '產生學習成果卡';
    };

    // 觸控控制
    const bal = (id, v) => {
      const b = $(id);
      const on = (e) => { e.preventDefault(); b.classList.add('pressed'); Surf.setBalanceInput(v); };
      const off = () => { b.classList.remove('pressed'); Surf.setBalanceInput(0); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    };
    bal('#tc-left', -1); bal('#tc-right', 1);
    $('#tc-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); Surf.jump(); });

    // 點畫面 = 跳 / 節奏
    $('#scene').addEventListener('pointerdown', (e) => {
      if (!$('#panel').hidden || !$('#minigame').hidden) return;
      if ($('#screen-title').classList.contains('active') || !$('#hud').hidden) Surf.jump();
    });

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') Surf.setBalanceInput(0);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && !$('#hud').hidden && $('#pause').hidden) openPause(); });
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  }

  function onKey(e) {
    if (!$('#minigame').hidden) return; // 小遊戲自己處理按鍵
    const modalOpen = !$('#screen-help').hidden || !$('#png-modal').hidden;
    if (e.code === 'Escape') {
      if (!$('#screen-help').hidden) { $('#screen-help').hidden = true; return; }
      if (!$('#png-modal').hidden) { $('#png-modal').hidden = true; return; }
      if (!$('#hud').hidden) { $('#pause').hidden ? openPause() : closePause(); }
      return;
    }
    if (modalOpen || !$('#pause').hidden) return;
    if (!$('#panel').hidden) {
      const body = $('#panel-body');
      if (/^Digit[1-9]$/.test(e.code) || /^Numpad[1-9]$/.test(e.code)) {
        const n = parseInt(e.code.slice(-1), 10) - 1;
        const items = Array.from(body.querySelectorAll('.opt:not([disabled]), .chip:not([disabled])')).filter(x => x.offsetParent);
        if (items[n]) { e.preventDefault(); items[n].click(); items[n].focus(); }
        return;
      }
      if (e.code === 'Enter' || e.code === 'Space') {
        if (document.activeElement && document.activeElement.closest && document.activeElement.closest('#panel-body') && document.activeElement.tagName === 'BUTTON' && !document.activeElement.classList.contains('primary')) {
          if (e.code === 'Space') return; // 讓 Space 觸發聚焦中的按鈕
        }
        const p = body.querySelector('.primary:not([disabled])');
        if (p && p.offsetParent) { e.preventDefault(); p.click(); }
      }
      return;
    }
    if (!$('#hud').hidden || $('#screen-title').classList.contains('active')) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if ($('#screen-title').classList.contains('active') && document.activeElement && document.activeElement.tagName === 'BUTTON') return;
        e.preventDefault(); if (!e.repeat) Surf.jump();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); Surf.setBalanceInput(-1); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); Surf.setBalanceInput(1); }
    }
  }

  function openPause() { if ($('#hud').hidden) return; Surf.setPaused(true); $('#pause').hidden = false; $('#btn-resume').focus(); }
  function closePause() { Surf.setPaused(false); $('#pause').hidden = true; }
  function quitToMenu() {
    session++;
    hidePanel(); $('#minigame').hidden = true; $('#hud').hidden = true;
    $('#touch-balance').hidden = true; $('#tc-jump').classList.remove('on');
    Surf.setMode('title'); Surf.setPaused(false); Audio.music('title');
    showScreen('screen-select'); renderAvatars();
  }

  /* ---------------- 故事流程 ---------------- */
  async function startStory(id) {
    const my = ++session;
    story = OK.STORIES[id]; records = []; evIdx = 0;
    showScreen(''); $('#hud').hidden = false; hidePanel();
    $('#minigame').hidden = true; $('#png-modal').hidden = true;
    $('#hud-title').textContent = story.title;
    renderProgress(0);
    Surf.startStory(story, avatar);
    Surf.setSky(story.events[0].time); $('#hud-clock').textContent = story.events[0].time;
    Surf.onSpark(n => { $('#hud-sparks').textContent = n; });
    Audio.music('surf');
    banner(`🏄 ${story.title}<small>${story.intro}</small>`, 3200);
    const isTouch = document.body.classList.contains('touch');
    hint(isTouch ? '點一下畫面或「跳！」按鈕，跳起來收集光點 ✨' : '按空白鍵或 ↑ 鍵跳起來，收集光點 ✨（也可以點畫面）', 6000);
    $('#tc-jump').classList.add('on');
    for (let i = 0; i < story.events.length; i++) {
      const ev = story.events[i];
      await Surf.travel(`事件 ${i + 1}：${ev.title}`, i === 0 ? 800 : 1100);
      if (my !== session) return;
      evIdx = i;
      await runEvent(ev, i, my);
      if (my !== session) return;
      renderProgress(i + 1);
    }
    if (my !== session) return;
    finishStory();
  }

  function renderProgress(done) {
    const box = $('#hud-progress'); box.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('span');
      d.className = 'dot' + (i < done ? ' done' : i === done ? ' now' : '');
      d.textContent = i < done ? '✓' : String(i + 1);
      box.appendChild(d);
    }
  }

  /* ---------------- 事件面板 ---------------- */
  function showPanel(ev, i) {
    panelScene = ev.scene; panelProps = ev.props || [];
    panelCast = ev.cast.map(c => Object.assign({}, c));
    $('#scene-tag').textContent = `事件 ${i + 1}｜${ev.title}｜${ev.time}`;
    $('#panel').hidden = false;
    $('#tc-jump').classList.remove('on');
    cancelAnimationFrame(panelAnim);
    const cv = $('#scene-art'); const c = cv.getContext('2d');
    const r = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 760 * r; cv.height = 300 * r;
    let t0 = performance.now();
    const frame = (now) => {
      panelAnim = requestAnimationFrame(frame);
      const t = settings.reduced ? 0 : (now - t0) / 1000;
      c.setTransform(r, 0, 0, r, 0, 0);
      A.drawScene(c, panelScene, 760, 300, t);
      if (panelProps.includes('baton')) A.drawBaton(c, 330, 280, 0);
      panelCast.forEach((m, k) => {
        const who = m.who === 'me' ? avatar : m.who;
        const sc = (A.CHARS[who] && A.CHARS[who].adult) ? 1.12 : 1.22;
        A.drawChibi(c, { x: 760 * m.x, y: 292, s: sc, who, expr: m.expr, pose: m.pose || 'stand', t: t + k * 0.7, flip: m.flip });
        if (m.who === 'me') { c.fillStyle = '#ffd35c'; A.star(c, 760 * m.x, 292 - 150 * sc + Math.sin(t * 3) * 3, 9, 4); c.fill(); c.lineWidth = 2; c.strokeStyle = A.INK; c.stroke(); }
      });
      A.drawSprite(c, 712, 62, 0.55, 'happy', t);
    };
    panelAnim = requestAnimationFrame(frame);
  }
  function hidePanel() { $('#panel').hidden = true; cancelAnimationFrame(panelAnim); }
  function setMeExpr(expr) { panelCast.forEach(m => { if (m.who === 'me') m.expr = expr; }); Surf.setExpr(expr); }

  const body = () => $('#panel-body');
  function clearBody() { body().innerHTML = ''; $('#panel .panel-card').scrollTop = 0; }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function nameOf(who) {
    if (who === 'narr') return '旁白';
    if (who === 'sprite') return '情緒精靈・浪浪';
    if (who === 'me') return '我';
    return (A.CHARS[who] && A.CHARS[who].name) || who;
  }
  function dlgEl(who, text, expr) {
    const d = el('div', 'dlg' + (who === 'narr' ? ' narr' : who === 'sprite' ? ' sprite' : ''));
    const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96;
    const castExpr = (panelCast.find(m => m.who === who) || {}).expr;
    A.portrait(cv, who === 'me' ? avatar : who, expr || castExpr || (who === 'sprite' ? 'happy' : 'calm'));
    d.appendChild(cv);
    const b = el('div', 'bubble', `<div class="who">${nameOf(who)}</div><div class="txt"></div>`);
    d.appendChild(b);
    return { d, txt: b.querySelector('.txt') };
  }
  function typeInto(node, text) {
    return new Promise(res => {
      if (settings.reduced) { node.textContent = text; res(); return; }
      let i = 0; node.textContent = '';
      const iv = setInterval(() => { i += 2; node.textContent = text.slice(0, i); if (i >= text.length) { clearInterval(iv); res(); } }, 28);
      node._finish = () => { clearInterval(iv); node.textContent = text; res(); };
    });
  }
  function primaryBtn(label, cls = 'btn-sun') { const b = el('button', 'btn primary ' + cls, label); return b; }

  /** 逐句對話 */
  async function dialogue(lines, my) {
    for (const ln of lines) {
      if (my !== session) return;
      clearBody();
      const { d, txt } = dlgEl(ln.who, ln.text);
      body().appendChild(d);
      const row = el('div', 'row-end'); const nb = primaryBtn('下一句 ▶', 'btn-sky'); row.appendChild(nb); body().appendChild(row);
      const typing = typeInto(txt, ln.text);
      await new Promise(res => {
        let done = false;
        typing.then(() => { done = true; });
        d.onclick = () => { if (!done && txt._finish) txt._finish(); };
        nb.onclick = () => { Audio.play('click'); if (!done && txt._finish) { txt._finish(); } else res(); };
      });
    }
  }

  function choose(question, options, opt = {}) {
    // options: [{html, value, rec, disabled, cls}]
    return new Promise(res => {
      clearBody();
      if (opt.pre) opt.pre.forEach(n => body().appendChild(n));
      const q = el('p', 'step-q', question); body().appendChild(q);
      const box = el('div', 'opts' + (opt.wide ? ' wide' : '')); body().appendChild(box);
      const render = (list) => list.forEach((o, i) => {
        const b = el('button', 'opt' + (o.rec ? ' rec' : '') + (o.cls ? ' ' + o.cls : ''), `<span class="k">${box.children.length + 1}</span>${o.html}`);
        if (o.disabled) { b.disabled = true; b.style.opacity = .45; }
        b.onclick = () => {
          if (o.more) { Audio.play('click'); b.remove(); render(o.more); renumber(); return; }
          Audio.play('select'); b.classList.add('sel'); setTimeout(() => res(o.value), settings.reduced ? 60 : 220);
        };
        box.appendChild(b);
      });
      const renumber = () => Array.from(box.children).forEach((b, i) => { const k = b.querySelector('.k'); if (k) k.textContent = i + 1; });
      render(options);
      if (opt.post) opt.post.forEach(n => body().appendChild(n));
    });
  }

  async function runEvent(ev, i, my) {
    Surf.clearMarker();
    Surf.setSky(ev.time); $('#hud-clock').textContent = ev.time;
    renderProgress(i);
    hint('');
    Audio.play('wave');
    const rec = { title: ev.title, time: ev.time, story: story.title, index: i + 1, aBefore: Surf.arousal };
    showPanel(ev, i);
    await dialogue(ev.lines, my); if (my !== session) return;

    /* ---- 衝浪挑戰 ---- */
    if (ev.challenge) {
      hidePanel();
      const ch = ev.challenge;
      const touch = document.body.classList.contains('touch');
      if (ch.type === 'balance') { $('#touch-balance').hidden = !touch; hint(touch ? '按住左右按鈕保持平衡' : '按住 ← → 方向鍵保持平衡', 5000); }
      else { $('#tc-jump').classList.add('on'); $('#tc-jump').textContent = ch.type === 'rhythm' ? '拍！' : '跳！'; hint(ch.type === 'rhythm' ? (touch ? '接力棒進圈圈時，點一下畫面！' : '接力棒進圈圈時，按空白鍵！') : (touch ? '點畫面跳起來收集展品！' : '按空白鍵跳起來收集展品！'), 5000); }
      banner(`🌊 ${ch.title}<small>${ch.type === 'balance' ? '讓指針留在綠色區' : ch.type === 'rhythm' ? '跟著節奏，不用每個都跟上' : '跳起來收集發現'}</small>`, 2400);
      await wait(1200); if (my !== session) return;
      const res = await Surf.challenge(ch); if (my !== session) return;
      $('#touch-balance').hidden = true; $('#tc-jump').classList.remove('on'); $('#tc-jump').textContent = '跳！'; Surf.setBalanceInput(0);
      Audio.play('skill');
      let summary, line;
      if (res.type === 'rhythm') { summary = `跟上 ${res.hits} / ${res.total} 個節奏`; line = `你跟上了 ${res.hits} 個節奏！不管跟上幾個，你都完成了這一棒。`; }
      else if (res.type === 'balance') { summary = `穩定專注時間約 ${res.centerPct}%`; line = `你讓衝浪板穩穩的時間大約有 ${res.centerPct}%。分心是很正常的，重要的是你一次次把注意力帶回來。`; }
      else { summary = `發現 ${res.found} 件展品`; line = `你發現了 ${res.found} 件展品！好奇心帶你看見好多新東西。`; }
      rec.challenge = summary;
      banner(`✨ 挑戰完成<small>${summary}</small>`, 2000);
      await wait(1400); if (my !== session) return;
      showPanel(ev, i);
      await dialogue([{ who: 'sprite', text: line }], my); if (my !== session) return;
    }

    /* ---- 情緒辨識 ---- */
    const mk = (name) => { const e = OK.EMOTIONS[name]; return { html: `<span class="emo">${e.ico}</span><span>${name}</span>`, value: name }; };
    const compass = el('div', 'note blue', '<img src="assets/svg/compass.svg" alt="" style="width:26px;vertical-align:middle;margin-right:6px">情緒指南針：每個人對同一件事的感受都可能不一樣，沒有標準答案。');
    const emoOpts = ev.emotions.map(mk);
    emoOpts.push({ html: '<span class="emo">💭</span><span>其他感受…</span>', more: ev.extra.map(mk) });
    const emotion = await choose(`<span class="num">情緒</span>${ev.emotionPrompt}`, emoOpts, { pre: [compass] });
    if (my !== session) return;
    const E = OK.EMOTIONS[emotion];
    rec.emotion = emotion; rec.tone = E.tone;
    setMeExpr(E.expr);

    /* ---- 身體訊號 ---- */
    const signals = await new Promise(res => {
      clearBody();
      body().appendChild(el('p', 'step-q', `<span class="num">身體</span>感覺到「${emotion}」的時候，身體有什麼訊號？（可以選很多個）`));
      const chips = el('div', 'chips'); body().appendChild(chips);
      const sel = new Set();
      const row = el('div', 'row-end'); const ok = primaryBtn('確認身體訊號 ✓', 'btn-ok'); ok.disabled = true; row.appendChild(ok);
      ev.signals.forEach(id => {
        const s = OK.SIGNALS[id];
        const b = el('button', 'chip', `<span class="chip-ico">${s.ico}</span>${s.label}`);
        b.onclick = () => {
          Audio.play('click');
          if (sel.has(id)) sel.delete(id); else {
            if (id === 'none') sel.clear(); else sel.delete('none');
            sel.add(id);
          }
          Array.from(chips.children).forEach((x, k) => x.classList.toggle('sel', sel.has(ev.signals[k])));
          ok.disabled = sel.size === 0;
        };
        chips.appendChild(b);
      });
      body().appendChild(el('div', 'note', '💡 身體常常比腦袋更早發現情緒。心跳、呼吸、肩膀、肚子都是線索喔！'));
      body().appendChild(row);
      ok.onclick = () => { Audio.play('select'); res(Array.from(sel)); };
    });
    if (my !== session) return;
    rec.signals = signals.map(id => OK.SIGNALS[id].label);

    /* ---- 波浪變化 ---- */
    const d = Math.max(-14, Math.min(14, signals.reduce((s, id) => s + OK.SIGNALS[id].d, 0)));
    let target = E.lv + d + rand(-4, 4);
    target = 0.85 * target + 0.15 * rec.aBefore;
    target = Math.max(5, Math.min(95, target));
    rec.aEmo = target;
    const before = Surf.arousal;
    Surf.setArousal(target);
    hidePanel();
    const z = Surf.zoneOf(target);
    const zn = { high: '高激發區', ok: '復原力區', low: '低激發區' }[z];
    const up = target > before + 3 ? true : target < before - 3 ? false : null;
    Audio.play('turn', up); Audio.play('wave');
    banner(`${up === true ? '⬆️ 波浪升高了' : up === false ? '⬇️ 波浪降低了' : '〰️ 波浪起伏著'}<small>${E.ico} ${emotion}｜現在在 <span class="zone-pill ${z}">${zn}</span></small>`, settings.reduced ? 1800 : 2600);
    await wait(settings.reduced ? 1600 : 2500); if (my !== session) return;
    showPanel(ev, i);
    setMeExpr(E.expr);

    /* ---- 浪浪的回應 ---- */
    let validation;
    if (z === 'high' && E.tone === 'pos') validation = `「${emotion}」的能量好飽滿！高激發不一定是壞事，它也能帶給你衝勁，只要記得照顧好自己。`;
    else if (z === 'high') validation = `感覺到「${emotion}」，身體好像拉起了警報。這很正常，你的感受是重要的，我們可以一起照顧它。`;
    else if (z === 'low') validation = `「${emotion}」的時候，能量好像變少了。低激發不是失敗，只是需要一點點溫柔的照顧。`;
    else validation = `你感覺到「${emotion}」，現在在復原力區，還可以思考、學習，也能和別人好好互動。`;
    await dialogue([{ who: 'sprite', text: validation }], my); if (my !== session) return;

    /* ---- 調節技能 ---- */
    let intro = ev.skillIntro;
    if (!intro) intro = z === 'high' ? '波浪有點高，可以選一個技能，讓自己穩一點。' : z === 'low' ? '能量有點低，可以選一個技能照顧自己。' : '你在復原力區，可以直接繼續；想練習的話，也可以試一個技能。';
    const skillOpts = Object.keys(OK.SKILLS).map(k => ({
      html: `<img class="skill-ico" src="${OK.SKILLS[k].icon}" alt=""><span>${OK.SKILLS[k].name}<span class="meta">${OK.SKILLS[k].desc}</span></span>`,
      value: k, rec: ev.skillHint === k
    }));
    skillOpts.push({ html: `<span class="emo">➡️</span><span>${z === 'ok' ? '我現在可以，繼續前進' : '先不用，我想繼續（也沒關係）'}</span>`, value: null });
    const skill = await choose('<span class="num">技能</span>要不要使用調節技能？', skillOpts, { wide: true, pre: [el('div', 'note', '🧰 ' + intro)] });
    if (my !== session) return;
    let aNow = target;
    rec.skill = null;
    if (skill) {
      hidePanel();
      const r = await OK.Mini.run(skill, ev);
      if (my !== session) return;
      if (r.done) {
        rec.skill = skill; rec.skillDetail = r.detail || ''; rec.skillExtra = r;
        aNow = target + (50 - target) * 0.55 + rand(-3, 3);
        Surf.setArousal(aNow);
        banner(`🧰 ${OK.SKILLS[skill].name}<small>波浪慢慢變得比較穩了</small>`, 2200);
        Audio.play('turn', aNow > target ? true : false);
        await wait(settings.reduced ? 1200 : 2000); if (my !== session) return;
      }
      showPanel(ev, i);
      setMeExpr(r.done ? (Surf.zoneOf(aNow) === 'ok' ? 'calm' : E.expr) : E.expr);
      if (r.done) {
        const helpful = await choose('<span class="num">自評</span>這個方法對現在的你有幫助嗎？', [
          { html: '<span class="emo">🌟</span><span>很有幫助</span>', value: '很有幫助' },
          { html: '<span class="emo">🙂</span><span>有一點幫助</span>', value: '有一點幫助' },
          { html: '<span class="emo">🤔</span><span>沒什麼幫助</span>', value: '沒什麼幫助' }
        ]);
        if (my !== session) return;
        rec.helpful = helpful;
        const reply = helpful === '沒什麼幫助' ? '謝謝你誠實告訴我！每個人適合的方法不一樣，下次可以換一個技能試試看。' : helpful === '很有幫助' ? '太好了！把這個方法放進你的復原力工具箱吧！' : '有一點點幫助也很棒，慢慢練習會越來越熟練。';
        await dialogue([{ who: 'sprite', text: reply }], my); if (my !== session) return;
      }
    }

    /* ---- 行動選擇 ---- */
    let actionDone = false; const tried = new Set();
    while (!actionDone) {
      const pre = [];
      if (ev.safetyNote) pre.push(el('div', 'note warm', ev.safetyNote));
      const act = await choose(`<span class="num">行動</span>${ev.actionPrompt}`, ev.actions.map((a, k) => ({ html: `<span>${a.text}</span>`, value: k, disabled: tried.has(k) })), { wide: true, pre });
      if (my !== session) return;
      const a = ev.actions[act];
      await dialogue(a.reply, my); if (my !== session) return;
      if (a.retry) { tried.add(act); continue; }
      actionDone = true;
      rec.action = a.text; rec.actionTag = a.tag || null;
      aNow = Math.max(5, Math.min(95, aNow + (a.da || 0)));
      Surf.setArousal(aNow);
    }
    rec.aAfter = aNow;
    records.push(rec);

    /* ---- 結局 ---- */
    const last = i === story.events.length - 1;
    if (last && ev.ending) {
      setMeExpr('happy');
      await dialogue(ev.ending(records), my); if (my !== session) return;
    }
    await new Promise(res => {
      clearBody();
      const { d, txt } = dlgEl('sprite', last ? '今天的旅程結束了！一起來看看你的 OK 曲線吧！' : '準備好了嗎？我們繼續乘著波浪前進！');
      txt.textContent = txt.textContent || (last ? '今天的旅程結束了！一起來看看你的 OK 曲線吧！' : '準備好了嗎？我們繼續乘著波浪前進！');
      body().appendChild(d);
      const row = el('div', 'row-end'); const b = primaryBtn(last ? '看我的 OK 曲線 🌊' : '繼續衝浪 🏄', 'btn-ok'); row.appendChild(b); body().appendChild(row);
      b.onclick = () => { Audio.play('select'); res(); };
      b.focus();
    });
    hidePanel();
    if (!last) $('#tc-jump').classList.add('on');
  }

  function finishStory() {
    $('#hud').hidden = true; $('#tc-jump').classList.remove('on');
    Surf.setMode('title');
    Audio.music('title'); Audio.play('ending');
    OK.Results.show(story, records);
    showScreen('screen-result');
    $('#screen-result').scrollTop = 0;
  }

  /* ---------------- 啟動 ---------------- */
  function boot() {
    loadSettings();
    Surf.init($('#scene'));
    Surf.setMode('title');
    bindUI();
    applySettings();
    renderAvatars();
    Audio.music('title');
  }
  document.addEventListener('DOMContentLoaded', boot);

  return {
    settings,
    get avatar() { return avatar; },
    get boardColor() { return story ? story.boardColor : '#ffb938'; },
    get records() { return records; },
    get story() { return story; },
    startStory, quitToMenu
  };
})();
