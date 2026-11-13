/* =========================================================
   surf.js — 情緒波浪衝浪引擎（Canvas）
   - 波浪高度 = 模擬激發程度，會隨事件持續變化（不是固定正弦波）
   - 角色站在衝浪板上，跟著波浪上下移動、依坡度傾斜
   - 走過的波浪就是玩家的 OK 曲線
   - 衝浪挑戰：rhythm 節奏 / balance 平衡 / collect 收集
   ========================================================= */
window.OK = window.OK || {};

OK.Surf = (function () {
  const A = OK.Art;
  let cv, c, W = 800, H = 600, dpr = 1;
  let mode = 'title';
  let t = 0, last = 0, paused = false, reduced = false;
  let worldX = 0, speed = 150, baseSpeed = 150;
  let aShown = 50, aTarget = 50;
  const SAMPLE = 3; let hist = []; let sampleAcc = 0;
  let avatar = 'girl', boardColor = '#ffb938', theme = 'sports', skyIdx = 0;
  let expr = 'happy';
  // 跳躍
  let hopY = 0, hopV = 0, grounded = true;
  // 物件
  let sparks = [], parts = [], floaters = [], spawnAcc = 0, sparkCount = 0;
  let marker = null; let travelResolve = null;
  let challenge = null;
  let balanceInput = 0;
  let onSparkCb = null;
  let titleSurfers = [];

  const SKIES = [
    ['#8fdcff', '#e8f9ff'], // 早上
    ['#6fcaf7', '#d8f3ff'], // 中午
    ['#ffc79e', '#fff0de'], // 下午
    ['#ff9e7a', '#ffe0b8']  // 傍晚
  ];

  function init(canvas) {
    cv = canvas; c = cv.getContext('2d');
    resize(); window.addEventListener('resize', resize);
    for (let i = 0; i < 200; i++) hist.push(50);
    requestAnimationFrame(loop);
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const scale = () => Math.max(0.62, Math.min(1.15, Math.min(W / 900, H / 680)));
  const zoneTop = () => mode === 'title' ? H * 0.6 : H * (W < 600 ? 0.25 : 0.24);
  const zoneBot = () => mode === 'title' ? H * 0.9 : H * 0.86;
  const yOf = (a) => zoneBot() - (a / 100) * (zoneBot() - zoneTop());
  const px = () => mode === 'title' ? Math.max(70, W * 0.14) : Math.max(110, W * (W < 600 ? 0.28 : 0.3));

  function histAt(back) { // back = 從玩家位置往回幾個樣本
    const n = hist.length; const i = n - 1 - back;
    if (i <= 0) return hist[0];
    const i0 = Math.floor(i), f = i - i0;
    return hist[i0] * (1 - f) + hist[Math.min(n - 1, i0 + 1)] * f;
  }
  function levelAt(x) {
    const p = px();
    if (x >= p) return aShown;
    const back = (p - x) / SAMPLE;
    let a = histAt(back);
    const blend = Math.max(0, 1 - (p - x) / 50);
    return a * (1 - blend) + aShown * blend;
  }
  function ripple(x, a) {
    const k = reduced ? 0.4 : 1;
    const amp = (6 + 11 * Math.abs(a - 50) / 50) * k * scale();
    const wx = x + worldX;
    return Math.sin(wx * 0.017 + t * 1.5) * amp * 0.6 + Math.sin(wx * 0.043 - t * 2.2) * amp * 0.4;
  }
  function waveY(x) { const a = levelAt(x); return yOf(a) + ripple(x, a); }

  /* ---------------- 主迴圈 ---------------- */
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    if (!paused) { t += dt; update(dt); }
    draw();
  }

  function update(dt) {
    // 激發程度平滑過渡
    const rate = reduced ? 1.4 : 1.9;
    aShown += (aTarget - aShown) * (1 - Math.exp(-rate * dt));
    if (mode === 'title') {
      aTarget = 50 + Math.sin(t * 0.35) * 32 + Math.sin(t * 0.9) * 6;
      speed = reduced ? 90 : 140;
    } else if (mode === 'surf') {
      if (marker) {
        const remain = (marker.wx - worldX) - px() - 80;
        speed = remain < 300 ? Math.max(45, baseSpeed * Math.max(0, remain) / 300) : baseSpeed;
        if (remain <= 2 && travelResolve) { const r = travelResolve; travelResolve = null; marker.reached = true; setTimeout(r, 200); }
      } else if (challenge) speed = baseSpeed;
      else speed = 36; // 事件進行中：慢慢漂流
    }
    worldX += speed * dt;
    sampleAcc += speed * dt;
    while (sampleAcc >= SAMPLE) { sampleAcc -= SAMPLE; hist.push(aShown); if (hist.length > 1400) hist.shift(); }

    // 跳躍物理
    const s = scale();
    if (!grounded) {
      hopV -= 1700 * s * dt; hopY += hopV * dt;
      if (hopY <= 0) { hopY = 0; hopV = 0; grounded = true; splash(px(), waveY(px()), 6); }
    }

    // 光點生成（旅行時）
    if (mode === 'surf' && marker && !marker.reached && !challenge) {
      spawnAcc += dt;
      if (spawnAcc > (reduced ? 1.6 : 1.15)) { spawnAcc = 0; spawnSpark('spark'); }
    }
    if (challenge) updateChallenge(dt);

    // 收集判定
    const p = px(), py = waveY(p) - hopY - 46 * s;
    sparks.forEach(o => {
      if (o.got) return;
      const sx = o.wx - worldX, sy = waveY(sx) - o.off * s;
      if (Math.hypot(sx - p, sy - py) < 46 * s) {
        o.got = true;
        if (o.kind === 'spark') { sparkCount++; onSparkCb && onSparkCb(sparkCount); OK.Audio.play('spark'); }
        else if (challenge && challenge.type === 'collect') { challenge.found++; OK.Audio.play('beat', true); floatText(sx, sy - 20, challenge.words[o.kind % challenge.words.length] + '！', '#1f7a4d'); }
        burst(sx, sy, o.kind === 'spark' ? '#ffd35c' : '#7fe0ad');
      }
    });
    sparks = sparks.filter(o => !o.got && o.wx - worldX > -80);
    parts.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 300 * dt; q.life -= dt; });
    parts = parts.filter(q => q.life > 0);
    floaters.forEach(f => { f.y -= 40 * dt; f.life -= dt; });
    floaters = floaters.filter(f => f.life > 0);
  }

  function spawnSpark(kind) {
    const air = Math.random() < 0.55;
    sparks.push({ wx: worldX + W + 60, off: air ? 110 + Math.random() * 50 : 52, kind });
  }
  function splash(x, y, n) { if (reduced) n = Math.ceil(n / 2); for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 160, vy: -Math.random() * 160, life: .6, col: '#fff', r: 3 + Math.random() * 3 }); }
  function burst(x, y, col) { const n = reduced ? 5 : 12; for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2; parts.push({ x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 - 60, life: .7, col, r: 3 + Math.random() * 3 }); } }
  function floatText(x, y, text, col) { floaters.push({ x, y, text, col: col || A.INK, life: 1.2 }); }

  /* ---------------- 挑戰 ---------------- */
  function startChallenge(cfg) {
    return new Promise(resolve => {
      const ch = Object.assign({ resolve, time: 0, done: false }, cfg);
      if (cfg.type === 'rhythm') {
        ch.interval = reduced ? 1.15 : 0.95;
        ch.notes = []; for (let i = 0; i < cfg.count; i++) ch.notes.push({ tHit: 2.2 + i * ch.interval, hit: false, judged: false });
        ch.hits = 0; ch.perfect = 0; ch.end = 2.2 + cfg.count * ch.interval + 1.0;
        aTarget = 72;
      } else if (cfg.type === 'balance') {
        ch.b = 0; ch.force = 0; ch.forceT = 0; ch.distT = 1.6; ch.center = 0; ch.wobbles = 0; ch.end = cfg.duration; ch.wob = 0;
        aTarget = 66;
      } else if (cfg.type === 'collect') {
        ch.found = 0; ch.total = 0; ch.spawnT = 0.6; ch.end = cfg.duration; ch.k = 0;
        aTarget = 68;
      }
      sparks = []; challenge = ch;
    });
  }
  function updateChallenge(dt) {
    const ch = challenge; ch.time += dt;
    if (ch.type === 'rhythm') {
      ch.notes.forEach(n => {
        if (!n.judged && ch.time - n.tHit > 0.32) { n.judged = true; floatText(px() + 70 * scale(), waveY(px()) - 120 * scale(), '沒關係～', '#5b8def'); }
      });
      // 加油聲讓情緒起伏
      aTarget = 70 + Math.sin(ch.time * 1.3) * 8 + Math.min(10, ch.hits);
      if (Math.random() < dt * 1.2) floatText(W * (0.45 + Math.random() * 0.45), zoneTop() + 10 + Math.random() * 40, ch.words[Math.floor(Math.random() * ch.words.length)], '#ff7a59');
    } else if (ch.type === 'balance') {
      ch.forceT -= dt;
      if (ch.forceT <= 0) { ch.forceT = 1 + Math.random(); ch.force = (Math.random() - 0.5) * (reduced ? 0.8 : 1.1); }
      ch.distT -= dt;
      if (ch.distT <= 0) {
        ch.distT = 2.4 + Math.random() * 1.2;
        const dir = Math.random() < 0.5 ? -1 : 1; ch.force = dir * (reduced ? 0.9 : 1.3);
        floatText(W * (0.4 + Math.random() * 0.4), zoneTop() + 30 + Math.random() * 60, ch.words[Math.floor(Math.random() * ch.words.length)], '#7a5bd6');
        aTarget = Math.min(85, aShown + 8);
      }
      ch.b += (ch.force * 0.9 - balanceInput * 1.9) * dt;
      ch.b *= (1 - 0.15 * dt);
      if (Math.abs(ch.b) < 0.33) { ch.center += dt; aTarget += (55 - aTarget) * 0.25 * dt; }
      if (Math.abs(ch.b) > 1) { ch.wobbles++; ch.b = 0; ch.wob = 0.8; ch.force = 0; splash(px(), waveY(px()), 10); floatText(px(), waveY(px()) - 140 * scale(), '穩住～慢慢來', '#2a8ec2'); OK.Audio.play('soft'); }
      ch.wob = Math.max(0, ch.wob - dt);
    } else if (ch.type === 'collect') {
      ch.spawnT -= dt;
      if (ch.spawnT <= 0 && ch.time < ch.end - 1.5) {
        ch.spawnT = reduced ? 1.2 : 0.9; ch.total++;
        const air = Math.random() < 0.6;
        sparks.push({ wx: worldX + W + 60, off: air ? 115 + Math.random() * 45 : 52, kind: ch.k++ % 4 });
      }
    }
    if (ch.time >= ch.end && !ch.done) {
      ch.done = true;
      let res;
      if (ch.type === 'rhythm') res = { type: 'rhythm', hits: ch.hits, perfect: ch.perfect, total: ch.count };
      else if (ch.type === 'balance') res = { type: 'balance', centerPct: Math.round(100 * ch.center / ch.end), wobbles: ch.wobbles };
      else res = { type: 'collect', found: ch.found, total: Math.max(ch.total, ch.found) };
      challenge = null; balanceInput = 0;
      sparks = sparks.filter(o => o.kind === 'spark');
      ch.resolve(res);
    }
  }
  function tapBeat() {
    const ch = challenge; if (!ch || ch.type !== 'rhythm') return false;
    let best = null, bd = 9;
    ch.notes.forEach(n => { if (!n.judged) { const d = Math.abs(ch.time - n.tHit); if (d < bd) { bd = d; best = n; } } });
    const x = px() + 70 * scale(), y = waveY(px()) - 120 * scale();
    if (best && bd < 0.3) {
      best.judged = true; best.hit = true; ch.hits++;
      if (bd < 0.13) { ch.perfect++; floatText(x, y, '完美！', '#ff7a59'); } else floatText(x, y, '不錯！', '#3fbf7f');
      burst(x, y + 50 * scale(), '#ffd35c'); OK.Audio.play('beat', true);
    } else { OK.Audio.play('beat', false); }
    return true;
  }

  /* ---------------- 繪圖 ---------------- */
  function draw() {
    c.clearRect(0, 0, W, H);
    const s = scale();
    const sk = mode === 'title' ? SKIES[0] : SKIES[skyIdx];
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sk[0]); g.addColorStop(1, sk[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    A.drawSun(c, W - 90 * s, 80 * s, 34 * s, reduced ? 0 : t);
    // 雲
    const cs = reduced ? 0.15 : 0.35;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 330 - worldX * cs * (0.6 + i * 0.1)) % (W + 300) + W + 300) % (W + 300) - 150;
      A.drawCloud(c, x, 50 + (i % 3) * 38 * s, (0.7 + (i % 2) * 0.35) * s);
    }
    if (mode !== 'title') drawFarScenery(s);
    else { drawTitleIslands(s); }
    drawWater(s);
    drawZones(s);
    // 物件
    sparks.forEach(o => {
      const sx = o.wx - worldX; if (sx < -60 || sx > W + 80) return;
      const sy = waveY(sx) - o.off * s;
      if (o.kind === 'spark') A.drawSpark(c, sx, sy, 15 * s, t);
      else { c.save(); c.translate(sx, sy); c.scale(s, s); A.drawDiscovery(c, o.kind, 0, 0, t); c.restore(); }
    });
    if (marker && marker.label) {
      const mx = marker.wx - worldX;
      if (mx < W + 120 && mx > -100) { c.save(); c.translate(mx, waveY(mx)); c.scale(s, s); A.drawBuoySign(c, 0, 0, marker.label, t); c.restore(); }
    }
    if (challenge && challenge.type === 'rhythm') drawRhythm(s);
    drawPlayer(s);
    if (mode === 'title') drawTitleExtras(s);
    // 粒子
    parts.forEach(q => { c.globalAlpha = Math.max(0, q.life / 0.7); c.fillStyle = q.col; A.circ(c, q.x, q.y, q.r * s); c.fill(); });
    c.globalAlpha = 1;
    floaters.forEach(f => {
      c.globalAlpha = Math.min(1, f.life * 1.5);
      c.font = `900 ${Math.round(20 * s)}px "Noto Sans TC", sans-serif`; c.textAlign = 'center';
      c.lineWidth = 5; c.strokeStyle = '#fff'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.col; c.fillText(f.text, f.x, f.y);
    });
    c.globalAlpha = 1;
    if (challenge && challenge.type === 'balance') drawBalance(s);
    if (challenge) drawChallengeHud(s);
  }

  function drawZones(s) {
    if (mode === 'title') return;
    const zt = zoneTop(), zb = zoneBot(), y70 = yOf(70), y30 = yOf(30);
    c.setLineDash([10, 12]); c.lineWidth = 2.5;
    c.strokeStyle = 'rgba(255,255,255,.75)';
    c.beginPath(); c.moveTo(30, y70); c.lineTo(W, y70); c.stroke();
    c.beginPath(); c.moveTo(30, y30); c.lineTo(W, y30); c.stroke();
    c.setLineDash([]);
    // 左側刻度尺
    const bx = 10, bw = 16;
    A.rr(c, bx, zt, bw, y70 - zt, 8); c.fillStyle = '#ff7a59'; c.fill();
    c.fillStyle = '#3fbf7f'; c.fillRect(bx, y70, bw, y30 - y70);
    A.rr(c, bx, y30, bw, zb - y30, 8); c.fillStyle = '#5b8def'; c.fill();
    A.rr(c, bx, zt, bw, zb - zt, 8); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
    const my = yOf(aShown);
    c.beginPath(); c.moveTo(bx + bw + 3, my); c.lineTo(bx + bw + 15, my - 8); c.lineTo(bx + bw + 15, my + 8); c.closePath();
    c.fillStyle = '#fff'; c.fill(); c.strokeStyle = A.INK; c.lineWidth = 2.5; c.stroke();
    const fs = Math.round(Math.max(11, 13 * s));
    c.font = `900 ${fs}px "Noto Sans TC", sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
    const lab = (txt, y, col) => {
      const w = c.measureText(txt).width + 14;
      A.rr(c, bx + bw + 20, y - fs * 0.8, w, fs * 1.6, fs * 0.8); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
      c.fillStyle = col; c.fillText(txt, bx + bw + 27, y);
    };
    lab('高激發區', (zt + y70) / 2, '#d9532f');
    lab('復原力區 OK', (y70 + y30) / 2, '#1f7a4d');
    lab('低激發區', (y30 + zb) / 2, '#2f5fc4');
    c.textBaseline = 'alphabetic';
  }

  function drawWater(s) {
    const step = 8;
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + step; x += step) c.lineTo(x, waveY(x));
    c.lineTo(W, H); c.closePath();
    const g = c.createLinearGradient(0, yOf(100), 0, yOf(0));
    if (mode === 'title') { g.addColorStop(0, '#5fd0f0'); g.addColorStop(1, '#2a8ec2'); }
    else { // 海水依三個區域上色：高激發 珊瑚橘、復原力 綠松、低激發 藍
      g.addColorStop(0, '#ff9472'); g.addColorStop(0.26, '#ffad8c');
      g.addColorStop(0.34, '#5fd6b0'); g.addColorStop(0.66, '#3fbfc0');
      g.addColorStop(0.74, '#6ea4f3'); g.addColorStop(1, '#3a6ad2');
    }
    c.fillStyle = g; c.fill();
    // 走過的曲線（玩家的 OK 曲線）用彩色描邊
    c.lineWidth = 6 * s; c.lineJoin = 'round'; c.lineCap = 'round';
    for (let x = 0; x < W; x += step) {
      const a = levelAt(x);
      c.strokeStyle = a > 70 ? '#ff9a7a' : a < 30 ? '#8fb2ff' : '#9ff0c4';
      if (mode === 'title') c.strokeStyle = 'rgba(255,255,255,.9)';
      c.beginPath(); c.moveTo(x, waveY(x)); c.lineTo(x + step + 0.5, waveY(x + step)); c.stroke();
    }
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,.95)';
    c.beginPath(); for (let x = 0; x <= W; x += step) c.lineTo(x, waveY(x) + 1); c.stroke();
    // 水面亮點
    c.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 18; i++) {
      const x = ((i * 137 - worldX * 0.9) % W + W) % W; const y = waveY(x) + 30 + (i * 53) % Math.max(40, (H - waveY(x) - 40));
      if (y < H - 6) { c.beginPath(); c.ellipse(x, y, 14 * s, 2.5 * s, 0, 0, Math.PI * 2); c.fill(); }
    }
  }

  function drawPlayer(s) {
    const p = px();
    const y = waveY(p) - hopY;
    const slope = (waveY(p + 10) - waveY(p - 10)) / 20;
    let ang = Math.max(-0.45, Math.min(0.45, Math.atan(slope) * 0.85));
    if (challenge && challenge.type === 'balance') ang += challenge.b * 0.45 + Math.sin(t * 30) * challenge.wob * 0.08;
    c.save(); c.translate(p, y); c.rotate(ang); c.scale(s, s);
    // 浪花尾巴
    if (!reduced && speed > 40) { c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) { A.circ(c, -54 - i * 12, 2 + Math.sin(t * 10 + i) * 3, 6 - i); c.fill(); } }
    A.drawBoard(c, 0, 0, 0, boardColor);
    A.drawChibi(c, { x: 0, y: -8, s: 0.82, who: avatar, expr, pose: 'surf', t });
    c.restore();
  }

  function drawRhythm(s) {
    const ch = challenge, p = px();
    const tx = p + 70 * s, ty = waveY(p) - 120 * s;
    const pulse = 1 + Math.max(0, 0.15 - Math.min(...ch.notes.filter(n => !n.judged).map(n => Math.abs(ch.time - n.tHit)), 1)) * 2;
    c.lineWidth = 5; c.strokeStyle = '#fff'; A.circ(c, tx, ty, 30 * s * pulse); c.stroke();
    c.lineWidth = 3; c.strokeStyle = '#ffb938'; A.circ(c, tx, ty, 30 * s * pulse); c.stroke();
    const v = 340 * s;
    ch.notes.forEach(n => {
      if (n.judged) return;
      const x = tx + (n.tHit - ch.time) * v;
      if (x > W + 40) return;
      c.save(); c.translate(x, ty); c.scale(s * 1.2, s * 1.2); A.drawBaton(c, 0, 0, t); c.restore();
    });
  }

  function drawBalance(s) {
    const ch = challenge;
    const w = Math.min(420, W * 0.7), x = (W - w) / 2, y = H - 190;
    A.rr(c, x, y, w, 22, 11); c.fillStyle = 'rgba(255,255,255,.92)'; c.fill(); c.lineWidth = 3; c.strokeStyle = A.INK; c.stroke();
    A.rr(c, x + w / 2 - w * 0.165, y + 3, w * 0.33, 16, 8); c.fillStyle = '#9ff0c4'; c.fill();
    const nx = x + w / 2 + Math.max(-1, Math.min(1, ch.b)) * w / 2;
    c.beginPath(); c.moveTo(nx, y - 6); c.lineTo(nx - 9, y - 18); c.lineTo(nx + 9, y - 18); c.closePath(); c.fillStyle = '#ff7a59'; c.fill(); c.stroke();
    c.font = `900 ${Math.round(14 * s)}px "Noto Sans TC", sans-serif`; c.textAlign = 'center'; c.fillStyle = A.INK;
    c.fillText('平衡計：讓指針留在綠色區', W / 2, y + 42);
  }

  function drawChallengeHud(s) {
    const ch = challenge;
    const remain = Math.max(0, Math.ceil(ch.end - ch.time));
    let txt = '';
    if (ch.type === 'rhythm') txt = `🎵 ${ch.title}｜跟上 ${ch.hits} / ${ch.count}`;
    else if (ch.type === 'balance') txt = `⚖️ ${ch.title}｜還有 ${remain} 秒`;
    else txt = `🔍 ${ch.title}｜發現 ${ch.found} 件｜${remain} 秒`;
    c.font = `900 ${Math.round(16 * s)}px "Noto Sans TC", sans-serif`;
    const w = c.measureText(txt).width + 30, x = W / 2 - w / 2, y = H - 104;
    A.rr(c, x, y, w, 36, 18); c.fillStyle = 'rgba(35,57,91,.85)'; c.fill();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W / 2, y + 18); c.textBaseline = 'alphabetic';
  }

  function drawFarScenery(s) {
    const off = worldX * 0.15, base = zoneTop() + 10;
    c.save(); c.globalAlpha = 0.55;
    const tile = 520;
    for (let k = -1; k < Math.ceil(W / tile) + 1; k++) {
      const x0 = k * tile - (off % tile);
      if (theme === 'sports') {
        c.fillStyle = '#fff1d6'; A.rr(c, x0 + 40, base - 70, 220, 70, 6); c.fill();
        c.fillStyle = '#ffd9a8'; A.rr(c, x0 + 120, base - 96, 60, 30, 6); c.fill();
        c.strokeStyle = '#23395b'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, base - 110); c.quadraticCurveTo(x0 + tile / 2, base - 80, x0 + tile, base - 110); c.stroke();
        const cols = ['#ff7a59', '#ffd35c', '#3fbf7f', '#5b8def'];
        for (let i = 0; i < 10; i++) { const fx = x0 + i * tile / 10 + 20, k2 = (i * tile / 10 + 20) / tile, fy = base - 110 + 60 * k2 * (1 - k2); c.fillStyle = cols[i % 4]; c.beginPath(); c.moveTo(fx - 7, fy); c.lineTo(fx + 7, fy); c.lineTo(fx, fy + 15); c.fill(); }
        c.fillStyle = '#9edb8a'; c.fillRect(x0, base, tile + 1, 8);
      } else if (theme === 'exam') {
        c.fillStyle = '#fff5e0'; A.rr(c, x0 + 30, base - 80, 260, 80, 6); c.fill();
        c.fillStyle = '#ffe1b0'; A.rr(c, x0 + 135, base - 130, 50, 60, 6); c.fill();
        c.fillStyle = '#fff'; A.circ(c, x0 + 160, base - 108, 14); c.fill();
        c.strokeStyle = '#23395b'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 160, base - 108); c.lineTo(x0 + 160, base - 118); c.moveTo(x0 + 160, base - 108); c.lineTo(x0 + 168, base - 104); c.stroke();
        c.fillStyle = '#9fd8f0'; for (let i = 0; i < 5; i++) c.fillRect(x0 + 46 + i * 50, base - 60, 26, 20);
        c.fillStyle = '#7cc79a'; A.circ(c, x0 + 380, base - 30, 34); c.fill(); A.circ(c, x0 + 440, base - 22, 26); c.fill();
      } else {
        c.fillStyle = '#a6dcb4'; c.beginPath(); c.moveTo(x0, base); c.lineTo(x0 + 90, base - 90); c.lineTo(x0 + 170, base - 30); c.lineTo(x0 + 260, base - 120); c.lineTo(x0 + 380, base - 20); c.lineTo(x0 + tile, base); c.fill();
        c.fillStyle = '#fff1d6'; c.beginPath(); c.moveTo(x0 + 380, base - 60); c.lineTo(x0 + 430, base - 90); c.lineTo(x0 + 480, base - 60); c.fill();
        c.fillRect(x0 + 385, base - 60, 90, 60);
      }
    }
    c.restore();
  }
  function drawTitleIslands(s) {
    const base = zoneTop() + 14, off = worldX * 0.12;
    c.save(); c.globalAlpha = 0.7;
    for (let k = -1; k < Math.ceil(W / 600) + 1; k++) {
      const x0 = k * 600 - (off % 600);
      c.fillStyle = '#ffe9a8'; c.beginPath(); c.ellipse(x0 + 160, base, 110, 26, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#8a5a2b'; c.lineWidth = 6; c.beginPath(); c.moveTo(x0 + 170, base - 10); c.quadraticCurveTo(x0 + 160, base - 60, x0 + 185, base - 100); c.stroke();
      c.strokeStyle = '#3fbf7f'; c.lineWidth = 9; c.lineCap = 'round';
      [[-40, 4], [36, -8], [-10, -36], [30, 20]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(x0 + 185, base - 100); c.quadraticCurveTo(x0 + 185 + dx / 2, base - 110 + dy / 2 - 10, x0 + 185 + dx, base - 100 + dy); c.stroke(); });
    }
    c.restore();
  }
  function drawTitleExtras(s) {
    A.drawGull(c, (W * 0.6 + Math.sin(t * 0.3) * 80), H * 0.18, s, t);
    A.drawGull(c, (W * 0.7 + Math.sin(t * 0.3 + 1) * 70), H * 0.24, s * 0.7, t + 0.5);
    // 浪花泡泡
    if (!reduced) for (let i = 0; i < 6; i++) { const x = ((i * 190 + t * 30) % (W + 40)) - 20; const y = waveY(x) - 10 - Math.abs(Math.sin(t * 2 + i)) * 14; c.fillStyle = 'rgba(255,255,255,.8)'; A.circ(c, x, y, 5); c.fill(); }
  }

  /* ---------------- 公開 API ---------------- */
  return {
    init,
    setMode(m) { mode = m; if (m === 'title') { marker = null; challenge = null; sparks = []; expr = 'happy'; } },
    startStory(story, av) {
      mode = 'surf'; avatar = av; boardColor = story.boardColor; theme = story.bgTheme;
      aTarget = aShown = 50; hist = []; for (let i = 0; i < 400; i++) hist.push(50);
      sparks = []; parts = []; floaters = []; sparkCount = 0; marker = null; challenge = null; hopY = 0; grounded = true;
      expr = 'calm'; onSparkCb && onSparkCb(0);
    },
    setSky(timeStr) { const h = parseInt(timeStr, 10); skyIdx = h < 9 ? 0 : h < 13 ? 1 : h < 15 ? 2 : 3; },
    travel(label, dist) {
      baseSpeed = reduced ? 110 : 160;
      return new Promise(res => { marker = { wx: worldX + px() + 80 + dist, label }; travelResolve = res; });
    },
    clearMarker() { marker = null; },
    setArousal(a) { aTarget = Math.max(3, Math.min(97, a)); },
    get arousal() { return aTarget; },
    get shown() { return aShown; },
    setExpr(e) { expr = e || 'calm'; },
    challenge: startChallenge,
    get inChallenge() { return challenge ? challenge.type : null; },
    jump() {
      if (mode === 'title') { if (grounded) { grounded = false; hopV = 560 * scale(); OK.Audio.play('jump'); } return; }
      if (challenge && challenge.type === 'rhythm') { tapBeat(); return; }
      if (challenge && challenge.type === 'balance') return;
      if (grounded) { grounded = false; hopV = 620 * scale(); OK.Audio.play('jump'); }
    },
    setBalanceInput(v) { balanceInput = v; },
    setPaused(p) { paused = p; },
    setReduced(r) { reduced = r; },
    onSpark(cb) { onSparkCb = cb; },
    get sparks() { return sparkCount; },
    zoneOf(a) { return a > 70 ? 'high' : a < 30 ? 'low' : 'ok'; }
  };
})();
