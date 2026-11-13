/* =========================================================
   minigames.js — 四種調節技能小遊戲（都可以實際操作）
   1. 呼吸光圈  2. 安全港停靠  3. 支持浮島  4. 想法拼圖
   每個小遊戲回傳 Promise：{ done, skipped, detail }
   ========================================================= */
window.OK = window.OK || {};

OK.Mini = (function () {
  const A = OK.Art;
  const $ = (s) => document.querySelector(s);
  let rafId = 0, cleanups = [];
  const S = () => OK.Game ? OK.Game.settings : { reduced: false };

  function open(skillId) {
    const sk = OK.SKILLS[skillId];
    $('#mg-icon').src = sk.icon; $('#mg-title').textContent = sk.name; $('#mg-desc').textContent = sk.desc;
    const body = $('#mg-body'); body.innerHTML = '';
    $('#minigame').hidden = false;
    $('#minigame .modal-card').scrollTop = 0;
    OK.Audio.music('calm');
    return body;
  }
  function close() {
    cancelAnimationFrame(rafId); rafId = 0;
    cleanups.forEach(f => f()); cleanups = [];
    $('#minigame').hidden = true;
    OK.Audio.music('surf');
  }
  function listen(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); cleanups.push(() => target.removeEventListener(ev, fn, opt)); }
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function btn(text, cls, fn) { const b = el('button', 'btn ' + (cls || ''), text); b.addEventListener('click', () => { OK.Audio.play('click'); fn && fn(b); }); return b; }
  function hiDPI(cv, w, h) { const r = Math.min(2, window.devicePixelRatio || 1); cv.width = w * r; cv.height = h * r; const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0); return c; }
  /** 按住型按鈕（滑鼠、觸控、空白鍵都可以） */
  function holdable(button, onChange, keys) {
    let held = false;
    const set = (v) => { if (held === v) return; held = v; button.classList.toggle('pressed', v); onChange(v); };
    listen(button, 'pointerdown', (e) => { e.preventDefault(); try { button.setPointerCapture(e.pointerId); } catch (er) { } set(true); });
    listen(button, 'pointerup', () => set(false));
    listen(button, 'pointercancel', () => set(false));
    listen(button, 'lostpointercapture', () => set(false));
    listen(window, 'keydown', (e) => { if (keys.includes(e.code)) { e.preventDefault(); if (!e.repeat) set(true); } });
    listen(window, 'keyup', (e) => { if (keys.includes(e.code)) { e.preventDefault(); set(false); } });
    return () => held;
  }
  function finishRow(body, resolve, label, extra) {
    const row = el('div', 'row-center');
    row.appendChild(btn(label || '完成！回到衝浪', 'btn-ok', () => { close(); resolve(Object.assign({ done: true, skipped: false }, extra)); }));
    body.appendChild(row);
    row.querySelector('button').focus();
  }
  function skipRow(body, resolve, text) {
    const row = el('div', 'row-end');
    row.appendChild(btn(text || '先跳過這個技能', 'btn-ghost btn-small', () => { close(); resolve({ done: false, skipped: true }); }));
    body.appendChild(row);
    return row;
  }

  /* ======================== 1. 呼吸光圈 ======================== */
  function breath() {
    return new Promise(resolve => {
      const body = open('breath');
      const stage = el('div', 'mg-stage'); const cv = el('canvas'); stage.appendChild(cv); body.appendChild(stage);
      const c = hiDPI(cv, 560, 300);
      const info = el('p', 'mg-info', '準備好了嗎？'); body.appendChild(info);
      const sub = el('p', 'mg-sub', '光圈變大時按住按鈕（或空白鍵）慢慢吸氣，光圈變小時放開、慢慢吐氣。'); body.appendChild(sub);
      const dots = el('div', 'breath-dots', '<span></span><span></span><span></span>'); body.appendChild(dots);
      const row = el('div', 'row-center');
      const hold = btn('按住吸氣', 'btn-sky btn-big hold-btn'); row.appendChild(hold);
      let slow = false;
      const slowBtn = el('button', 'toggle', '<span class="tg-dot"></span><span class="tg-label">較慢、較舒適的節奏</span>');
      slowBtn.setAttribute('aria-pressed', 'false');
      slowBtn.addEventListener('click', () => { slow = !slow; slowBtn.setAttribute('aria-pressed', String(slow)); OK.Audio.play('click'); });
      row.appendChild(slowBtn); body.appendChild(row);
      skipRow(body, resolve);
      const isHeld = holdable(hold, (v) => { }, ['Space', 'ArrowUp']);

      let phase = 'ready', pt = 0, done = 0, cycles = 0, holdIn = 0, inLen = 4, outLen = 4, finished = false, last = performance.now();
      const T = () => slow ? [5.5, 6.5] : [4, 4.5];
      function setPhase(p) {
        phase = p; pt = 0;
        if (p === 'in') { [inLen, outLen] = T(); holdIn = 0; info.textContent = '吸氣～ 按住按鈕'; OK.Audio.play('breathIn'); }
        if (p === 'out') { info.textContent = '吐氣～ 放開按鈕'; OK.Audio.play('breathOut'); }
      }
      function frame(now) {
        rafId = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000); last = now; pt += dt;
        if (phase === 'ready' && pt > 1.4) setPhase('in');
        else if (phase === 'in') { if (isHeld()) holdIn += dt; if (pt >= inLen) setPhase('out'); }
        else if (phase === 'out' && pt >= outLen) {
          cycles++;
          if (holdIn / inLen >= 0.45) { done++; dots.children[done - 1].classList.add('on'); OK.Audio.play('select'); }
          else info.textContent = '沒關係，下一次跟著光圈按住就好。';
          if (done >= 3 || cycles >= 6) {
            phase = 'end'; finished = true; hold.disabled = true;
            info.textContent = done >= 3 ? '完成三次呼吸！身體的速度慢下來了。' : '你已經跟著光圈呼吸好幾次了，很棒！';
            OK.Audio.play('skill');
            finishRow(body, resolve, '完成！回到衝浪', { detail: `完成 ${done} 次呼吸` });
          } else { phase = 'gap'; setTimeout(() => { if (!finished) setPhase('in'); }, 300); }
        }
        // 繪圖
        const w = 560, h = 300; c.clearRect(0, 0, w, h);
        const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 260); g.addColorStop(0, '#f2fbff'); g.addColorStop(1, '#bfe6f7');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        let k = 0.35;
        if (phase === 'in') k = 0.35 + 0.65 * ease(pt / inLen);
        else if (phase === 'out') k = 1 - 0.65 * ease(pt / outLen);
        else if (phase === 'gap' || phase === 'end') k = 0.35;
        const R = 120 * k + 20;
        for (let i = 3; i >= 1; i--) { c.fillStyle = `rgba(127,211,245,${0.12 * i})`; A.circ(c, w / 2, h / 2, R + i * 14); c.fill(); }
        const held = isHeld() && phase === 'in';
        c.fillStyle = held ? '#9ff0c4' : '#7fd3f5'; A.circ(c, w / 2, h / 2, R); c.fill();
        c.lineWidth = 5; c.strokeStyle = '#fff'; c.stroke();
        A.drawSprite(c, w / 2, h / 2 + 4, 0.9 + k * 0.4, phase === 'out' ? 'relieved' : 'calm', 0);
        c.font = '900 22px "Noto Sans TC", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#23395b';
        const label = phase === 'in' ? `吸～ ${Math.ceil(inLen - pt)}` : phase === 'out' ? `吐～ ${Math.ceil(outLen - pt)}` : phase === 'ready' ? '預備…' : '';
        c.fillText(label, w / 2, 34);
      }
      rafId = requestAnimationFrame(frame);
    });
  }
  const ease = (x) => 0.5 - Math.cos(Math.min(1, Math.max(0, x)) * Math.PI) / 2;

  /* ======================== 2. 安全港停靠 ======================== */
  function harbor(ctx) {
    return new Promise(resolve => {
      const body = open('harbor');
      const stage = el('div', 'mg-stage'); const cv = el('canvas'); stage.appendChild(cv); body.appendChild(stage);
      const W = 600, H = 260; const c = hiDPI(cv, W, H);
      const info = el('p', 'mg-info', '按住「輕輕煞車」，讓衝浪板慢慢停進安全港。'); body.appendChild(info);
      const sub = el('p', 'mg-sub', '也可以按住空白鍵或 ↓ 鍵。靠近港口時，速度要在綠色範圍才能停好喔！'); body.appendChild(sub);
      const row = el('div', 'row-center'); const brake = btn('按住輕輕煞車', 'btn-sun btn-big hold-btn'); row.appendChild(brake); body.appendChild(row);
      const skip = skipRow(body, resolve);
      const isHeld = holdable(brake, () => { }, ['Space', 'ArrowDown']);
      let x = 0, v = 1, t = 0, last = performance.now(), state = 'sail', bounceT = 0;
      const avatar = OK.Game ? OK.Game.avatar : 'girl';
      function frame(now) {
        rafId = requestAnimationFrame(frame);
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        if (state === 'sail') {
          if (isHeld()) v = Math.max(0.3, v - 0.8 * dt); else v = Math.min(1.1, v + 0.12 * dt);
          x += v * dt * 0.3;
          if (x >= 1) {
            if (v <= 0.42) { x = 1; state = 'docked'; OK.Audio.play('skill'); info.textContent = '停好了！歡迎來到安全港 ⚓'; brake.disabled = true; setTimeout(step2, 700); }
            else { state = 'bounce'; bounceT = 0.8; OK.Audio.play('soft'); info.textContent = '咚！速度有一點快。沒關係，再慢慢靠近一次。'; }
          }
        } else if (state === 'bounce') { bounceT -= dt; x -= 0.25 * dt; v = 0.55; if (bounceT <= 0) { state = 'sail'; info.textContent = '按住「輕輕煞車」，慢慢靠近。'; } }
        // 繪圖
        c.clearRect(0, 0, W, H);
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d5f2ff'); g.addColorStop(1, '#f5fcff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        A.drawSun(c, 70, 50, 20, t);
        // 港口
        const dockX = 470;
        c.fillStyle = '#9edb8a'; c.fillRect(dockX + 40, 120, 200, 140); c.fillStyle = '#fff'; A.rr(c, dockX + 52, 124, 72, 26, 8); c.fill();
        c.fillStyle = '#c98a4b'; c.fillRect(dockX - 20, 150, 120, 14); c.strokeStyle = '#23395b'; c.lineWidth = 3; c.strokeRect(dockX - 20, 150, 120, 14);
        [dockX - 10, dockX + 30, dockX + 70].forEach(px => A.line(c, [px, 164, px, 210], 6, '#8a5a2b'));
        A.line(c, [dockX + 20, 150, dockX + 20, 70], 4, '#23395b');
        c.fillStyle = '#ff7a59'; c.beginPath(); c.moveTo(dockX + 20, 70); c.lineTo(dockX + 50, 82); c.lineTo(dockX + 20, 94); c.fill();
        c.font = '900 16px "Noto Sans TC", sans-serif'; c.fillStyle = '#23395b'; c.textAlign = 'center'; c.fillText('安全港', dockX + 88, 143);
        // 海
        c.fillStyle = '#5cc8e8'; c.beginPath(); c.moveTo(0, 180);
        for (let i = 0; i <= W; i += 10) c.lineTo(i, 180 + Math.sin(i * 0.04 + t * 2) * (S().reduced ? 2 : 5) * (1 - i / W * 0.6));
        c.lineTo(W, H); c.lineTo(0, H); c.fill();
        const bx = 60 + x * (dockX - 100), by = 180 + Math.sin(bx * 0.04 + t * 2) * 4;
        c.save(); c.translate(bx, by); c.scale(0.8, 0.8);
        A.drawBoard(c, 0, 0, 0, OK.Game ? OK.Game.boardColor : '#ffb938');
        A.drawChibi(c, { x: 0, y: -8, s: 0.82, who: avatar, expr: state === 'docked' ? 'relieved' : 'calm', pose: 'surf', t });
        c.restore();
        // 速度計
        A.rr(c, 20, 222, 200, 20, 10); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#23395b'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#9ff0c4'; c.fillRect(22, 224, 200 * 0.42 - 4, 16);
        c.fillStyle = v > 0.42 ? '#ff7a59' : '#3fbf7f'; c.fillRect(22, 230, Math.min(196, 200 * v / 1.1), 4);
        c.font = '700 13px "Noto Sans TC", sans-serif'; c.textAlign = 'left'; c.fillStyle = '#23395b';
        c.fillText('速度：' + (v > 0.7 ? '快' : v > 0.42 ? '有點快' : '剛剛好'), 230, 237);
      }
      rafId = requestAnimationFrame(frame);

      function step2() {
        cancelAnimationFrame(rafId);
        stage.remove(); sub.remove(); row.remove(); skip.remove();
        info.textContent = '停好了！現在觀察一下身體。';
        const q1 = el('p', 'step-q', '<span class="num">1</span> 你的身體哪裡最想被照顧？');
        const chips = el('div', 'chips');
        const parts = ['心跳', '呼吸', '肩膀', '肚子', '眼睛', '全身'];
        let part = null;
        parts.forEach(p => { const b = el('button', 'chip', p); b.addEventListener('click', () => { chips.querySelectorAll('.chip').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); part = p; OK.Audio.play('select'); showRest(); }); chips.appendChild(b); });
        body.appendChild(q1); body.appendChild(chips);
        let restShown = false;
        function showRest() {
          if (restShown) return; restShown = true;
          const q2 = el('p', 'step-q', '<span class="num">2</span> 選一個你需要的短暫休息方式：');
          const opts = el('div', 'opts wide');
          const rests = [
            [' ', '喝幾口水', '慢慢喝，感覺水流過喉嚨。'],
            [' ', '伸展肩膀和手臂', '雙手往上伸直，再慢慢放下來，做三次。'],
            [' ', '看看四周 5-4-3-2-1', '找 5 樣看得到的東西、4 種聽得到的聲音、3 個摸得到的東西。'],
            [' ', '安靜坐一下', '找個安全的地方坐著，讓身體休息一會兒。'],
            [' ', '握緊拳頭再放鬆', '用力握拳數到 3，再慢慢張開手，做五次。']
          ];
          rests.forEach(([ico, name, how], i) => {
            const b = el('button', 'opt', `<span class="k">${i + 1}</span><span class="emo">${ico}</span><span>${name}<span class="meta">${how}</span></span>`);
            b.addEventListener('click', () => { OK.Audio.play('select'); doRest(name, how); });
            opts.appendChild(b);
          });
          body.appendChild(q2); body.appendChild(opts);
          q2.scrollIntoView({ behavior: S().reduced ? 'auto' : 'smooth', block: 'start' });
        }
        function doRest(name, how) {
          body.innerHTML = '';
          const box = el('div', 'mg-stage'); const cv2 = el('canvas'); box.appendChild(cv2); body.appendChild(box);
          const c2 = hiDPI(cv2, 560, 220);
          const msg = el('p', 'mg-info', `「${name}」中……`); body.appendChild(msg);
          body.appendChild(el('p', 'mg-sub', how));
          let tt = 0, l2 = performance.now(), ready = false;
          const row2 = el('div', 'row-center'); const ok = btn('我休息好了', 'btn-ok', () => { close(); resolve({ done: true, skipped: false, detail: `${part ? part.slice(2) : ''}・${name}` }); });
          ok.disabled = true; row2.appendChild(ok); body.appendChild(row2);
          function f2(now) {
            rafId = requestAnimationFrame(f2); const dt = Math.min(.05, (now - l2) / 1000); l2 = now; tt += dt;
            c2.clearRect(0, 0, 560, 220); A.drawScene(c2, 'sea', 560, 220, tt);
            c2.fillStyle = '#c98a4b'; c2.fillRect(330, 150, 200, 14);
            A.drawChibi(c2, { x: 420, y: 150, s: 0.9, who: avatar, expr: 'relieved', pose: 'stand', t: tt });
            A.drawSprite(c2, 490, 100, 0.6, 'happy', tt);
            const p = Math.min(1, tt / 4);
            A.rr(c2, 40, 190, 240, 14, 7); c2.fillStyle = '#fff'; c2.fill(); A.rr(c2, 40, 190, 240 * p, 14, 7); c2.fillStyle = '#3fbf7f'; c2.fill();
            if (p >= 1 && !ready) { ready = true; ok.disabled = false; msg.textContent = '身體休息了一下，感覺怎麼樣？'; OK.Audio.play('skill'); ok.focus(); }
          }
          rafId = requestAnimationFrame(f2);
        }
      }
    });
  }

  /* ======================== 3. 支持浮島 ======================== */
  function island(ctx) {
    return new Promise(resolve => {
      const data = ctx && ctx.support ? ctx.support : OK.Mini.DEFAULT_SUPPORT;
      const body = open('island');
      body.appendChild(el('div', 'note warm', `現在的狀況：${data.situation}`));
      body.appendChild(el('p', 'step-q', '<span class="num">1</span> 你想划向哪一座支持浮島？'));
      const grid = el('div', 'island-grid'); body.appendChild(grid);
      const skip = skipRow(body, resolve);
      data.helpers.forEach((hid, i) => {
        const h = OK.HELPERS[hid];
        const b = el('button', 'island');
        const cv = el('canvas'); cv.width = 120; cv.height = 110;
        const c = cv.getContext('2d');
        // 小島
        c.fillStyle = '#7fd3f5'; c.beginPath(); c.ellipse(60, 94, 58, 14, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffe08a'; c.beginPath(); c.ellipse(60, 92, 50, 12, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#23395b'; c.lineWidth = 2; c.stroke();
        A.drawChibi(c, { x: 60, y: 92, s: 0.62, who: h.who, expr: 'happy', pose: 'wave', t: i });
        b.appendChild(cv); b.appendChild(el('span', '', h.name)); b.appendChild(el('small', '', h.tip));
        b.addEventListener('click', () => { OK.Audio.play('select'); grid.querySelectorAll('.island').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); build(hid); });
        grid.appendChild(b);
      });
      let built = null;
      function build(hid) {
        const h = OK.HELPERS[hid];
        if (built) built.remove();
        skip.remove();
        built = el('div');
        built.appendChild(el('div', 'note', `${h.name}是很好的選擇！找信任的人幫忙，是很勇敢的事。`));
        built.appendChild(el('p', 'step-q', '<span class="num">2</span> 組合一句清楚、尊重的求助說法：'));
        const sentence = el('div', 'sentence', '<span class="empty">（選好的句子會出現在這裡）</span>'); built.appendChild(sentence);
        const area = el('div'); built.appendChild(area);
        body.appendChild(built);
        built.scrollIntoView({ behavior: S().reduced ? 'auto' : 'smooth', block: 'start' });
        const chosen = [];
        let idx = 0;
        function ask() {
          area.innerHTML = '';
          if (idx >= data.parts.length) return finish();
          const part = data.parts[idx];
          area.appendChild(el('p', 'step-q', `<span class="num">${part.label}</span>`));
          const opts = el('div', 'opts wide');
          const fb = el('div');
          const list = part.opts.map(o => Object.assign({}, o, { t: o.t.replace('{call}', h.call) }));
          if (Math.random() < 0.5) list.reverse();
          list.forEach((o, i) => {
            const b = el('button', 'opt', `<span class="k">${i + 1}</span><span>「${o.t}」</span>`);
            b.addEventListener('click', () => {
              if (o.ok) { OK.Audio.play('select'); chosen.push(o.t); idx++; render(); ask(); }
              else { OK.Audio.play('soft'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 450); fb.innerHTML = ''; fb.appendChild(el('div', 'note warm', '💡 ' + o.why)); }
            });
            opts.appendChild(b);
          });
          area.appendChild(opts); area.appendChild(fb);
        }
        function render() { sentence.innerHTML = chosen.map(s => `<span class="part">${s}</span>`).join(''); }
        function finish() {
          OK.Audio.play('skill');
          const d1 = el('div', 'dlg'); const p1 = el('canvas'); p1.width = 96; p1.height = 96; A.portrait(p1, OK.Game ? OK.Game.avatar : 'girl', 'calm');
          d1.appendChild(p1); d1.appendChild(el('div', 'bubble', `<div class="who">我</div><div class="txt">${chosen.join('')}</div>`));
          const d2 = el('div', 'dlg'); const p2 = el('canvas'); p2.width = 96; p2.height = 96; A.portrait(p2, h.who, 'happy');
          d2.appendChild(p2); d2.appendChild(el('div', 'bubble', `<div class="who">${h.name}</div><div class="txt">謝謝你願意告訴我，你說得很清楚。我們一起來想辦法！</div>`));
          area.appendChild(d1); area.appendChild(d2);
          finishRow(area, resolve, '完成！回到衝浪', { detail: `向${h.name}求助`, helper: hid, sentence: chosen.join('') });
          d1.scrollIntoView({ behavior: S().reduced ? 'auto' : 'smooth', block: 'center' });
        }
        ask();
      }
    });
  }

  /* ======================== 4. 想法拼圖 ======================== */
  function puzzle(ctx) {
    return new Promise(resolve => {
      const data = ctx && ctx.thought ? ctx.thought : OK.Mini.DEFAULT_THOUGHT;
      const body = open('puzzle');
      body.appendChild(el('div', 'note', ' ' + data.feelingNote));
      body.appendChild(el('div', 'puzzle-thought', data.original));
      body.appendChild(el('p', 'step-q', '把下面的拼圖片放到正確的位置，拼成比較平衡的想法：'));
      const slots = el('div', 'slots'); body.appendChild(slots);
      const slotEls = data.slots.map(s => { const d = el('div', 'slot', `<span class="slot-label">${s.label}</span><span class="slot-txt">？</span>`); slots.appendChild(d); return d; });
      const pieces = el('div', 'pieces'); body.appendChild(pieces);
      const fb = el('div'); body.appendChild(fb);
      const skip = skipRow(body, resolve);
      const all = data.slots.map((s, i) => ({ text: s.piece, slot: i })).concat(data.distractors.map(d => ({ text: d.text, why: d.why, slot: -1 })));
      all.sort(() => Math.random() - 0.5);
      let filled = 0;
      all.forEach(p => {
        const b = el('button', 'piece', p.text);
        b.addEventListener('click', () => {
          if (p.slot >= 0) {
            OK.Audio.play('select'); b.classList.add('used'); b.disabled = true;
            const s = slotEls[p.slot]; s.classList.add('filled'); s.querySelector('.slot-txt').textContent = p.text;
            fb.innerHTML = ''; filled++;
            if (filled === data.slots.length) done();
          } else {
            OK.Audio.play('soft'); b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 450);
            fb.innerHTML = ''; fb.appendChild(el('div', 'note warm', '' + p.why));
          }
        });
        pieces.appendChild(b);
      });
      function done() {
        OK.Audio.play('skill');
        pieces.remove(); skip.remove();
        const full = data.slots.map(s => s.piece).join('');
        fb.innerHTML = '';
        fb.appendChild(el('div', 'note', `拼好了！比較平衡的想法是：<br><b>「${full}」</b><br>感受還是可以存在，只是想法變得比較有彈性了。`));
        finishRow(body, resolve, '完成！回到衝浪', { detail: full });
      }
    });
  }

  return {
    breath, harbor, island, puzzle,
    run(id, ctx) { return ({ breath, harbor, island, puzzle })[id](ctx); },
    DEFAULT_SUPPORT: {
      situation: '心裡有點亂，想找人說說',
      helpers: ['teacher', 'an', 'counselor', 'mom'],
      parts: [
        { label: '打招呼', opts: [{ t: '{call}，可以跟你說一下話嗎？', ok: true }, { t: '喂！你過來！', ok: false, why: '先禮貌地打招呼，對方會更願意好好聽你說。' }] },
        { label: '說出狀況和感受', opts: [{ t: '我剛剛遇到一件事，心裡有點不舒服。', ok: true }, { t: '沒事啦……', ok: false, why: '說「沒事」的話，對方很難知道你需要幫忙。' }] },
        { label: '說出需要的幫忙', opts: [{ t: '可以陪我想想接下來怎麼做嗎？', ok: true }, { t: '你幫我全部處理好！', ok: false, why: '清楚說出你希望得到的幫忙，會比要別人全部處理更好。' }] }
      ]
    },
    DEFAULT_THOUGHT: {
      original: '今天有一件事不順利，所以我整天都完蛋了。',
      feelingNote: '不舒服的感受是真的，我們只是讓想法變得比較平衡。',
      slots: [{ label: '說出事實', piece: '今天有一件事不太順利，' }, { label: '不過度概括', piece: '但不代表整天都完蛋了。' }, { label: '我可以做的', piece: '我可以先照顧自己，再看看下一步。' }],
      distractors: [{ text: '我永遠都會這麼倒楣。', why: '「永遠」太絕對了，一件事不能決定以後。' }, { text: '我一點感覺都沒有。', why: '感受是真實的，不需要假裝沒事喔。' }]
    }
  };
})();
