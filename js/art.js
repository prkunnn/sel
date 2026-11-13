/* =========================================================
   art.js — 原創 Q 版美術：全部以 Canvas 向量繪製
   角色、表情、情緒精靈「浪浪」、事件場景、衝浪道具
   想替換美術時，只要改寫對應的 draw 函式即可。
   ========================================================= */
window.OK = window.OK || {};

OK.Art = (function () {
  const INK = '#23395b';

  /* ---------- 小工具 ---------- */
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  function fillStroke(c, fill, lw = 3, stroke = INK) { c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); } }
  function line(c, pts, lw, col, cap = 'round') {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.lineWidth = lw; c.strokeStyle = col; c.lineCap = cap; c.lineJoin = 'round'; c.stroke();
  }

  /* ---------- 角色設定 ---------- */
  const CHARS = {
    girl:    { name: '我', skin: '#ffe2c6', hair: '#3b2b28', style: 'ponytail', shirt: '#ffffff', bottom: '#ff7a8a', accent: '#ff9ec4' },
    boy:     { name: '我', skin: '#ffd9b8', hair: '#2d2a3a', style: 'short', shirt: '#ffffff', bottom: '#3a5c9e', accent: '#4fb8e6' },
    teacher: { name: '林老師', skin: '#ffe2c6', hair: '#6b3f2a', style: 'bun', glasses: true, shirt: '#7fc8a9', bottom: '#4d6585', adult: true },
    an:      { name: '小安', skin: '#ffe6cf', hair: '#1f1f2e', style: 'bob', shirt: '#ffffff', bottom: '#ffb938', accent: '#ffd35c' },
    zhe:     { name: '阿哲', skin: '#f6d0ae', hair: '#5a3a22', style: 'spiky', shirt: '#ffffff', bottom: '#3fbf7f' },
    mei:     { name: '美美', skin: '#ffe2c6', hair: '#8a4b2a', style: 'braids', shirt: '#ffffff', bottom: '#b99cff', accent: '#b99cff' },
    kai:     { name: '阿凱', skin: '#e8b88f', hair: '#222222', style: 'buzz', shirt: '#ffffff', bottom: '#ff7a59' },
    yu:      { name: '小宇', skin: '#ffe2c6', hair: '#333333', style: 'short', glasses: true, shirt: '#ffffff', bottom: '#5b8def' },
    staff:   { name: '館員姊姊', skin: '#ffdcbf', hair: '#2b2b2b', style: 'bob', shirt: '#2a8ec2', bottom: '#23395b', adult: true, badge: true },
    mom:     { name: '家人', skin: '#ffe2c6', hair: '#4a2c20', style: 'long', shirt: '#ff9ec4', bottom: '#6b7fa8', adult: true },
    counselor: { name: '輔導老師', skin: '#ffe0c4', hair: '#7a5230', style: 'short', glasses: false, shirt: '#ffd35c', bottom: '#4d6585', adult: true }
  };

  /* ---------- 表情 ---------- */
  function drawFace(c, expr, cfg, t) {
    const ey = -2;
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 3;
    const eyeDot = (x, r = 4.2) => { circ(c, x, ey, r); c.fill(); circ(c, x + 1.4, ey - 1.6, 1.4); c.fillStyle = '#fff'; c.fill(); c.fillStyle = INK; };
    const arcEye = (x, up = true) => { c.beginPath(); if (up) c.arc(x, ey + 2, 5, Math.PI * 1.15, Math.PI * 1.85); else c.arc(x, ey - 2, 5, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); };
    const brow = (x, ang) => { c.save(); c.translate(x, ey - 11); c.rotate(ang); c.beginPath(); c.moveTo(-5, 0); c.lineTo(5, 0); c.lineWidth = 2.6; c.stroke(); c.restore(); };
    const blush = (a = 0.55) => { c.fillStyle = `rgba(255,140,150,${a})`; circ(c, -18, 9, 5.5); c.fill(); circ(c, 18, 9, 5.5); c.fill(); c.fillStyle = INK; };
    switch (expr) {
      case 'happy': case 'excited':
        arcEye(-11); arcEye(11); blush();
        c.beginPath(); c.moveTo(-7, 9); c.quadraticCurveTo(0, 20, 7, 9); c.closePath(); c.fillStyle = '#ff8a8a'; c.fill(); c.stroke();
        if (expr === 'excited') { c.fillStyle = '#ffd35c'; star(c, 24, -16, 5, 2.5); c.fill(); star(c, -26, -18, 4, 2); c.fill(); }
        break;
      case 'relieved':
        arcEye(-11, false); arcEye(11, false); blush(0.65);
        c.beginPath(); c.arc(0, 9, 5, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
        break;
      case 'calm':
        eyeDot(-11, 3.6); eyeDot(11, 3.6); blush(0.35);
        c.beginPath(); c.arc(0, 8, 5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
        break;
      case 'nervous':
        eyeDot(-11, 3.4); eyeDot(11, 3.4); brow(-11, -0.25); brow(11, 0.25);
        c.beginPath(); c.moveTo(-7, 12); c.quadraticCurveTo(-3.5, 8, 0, 12); c.quadraticCurveTo(3.5, 16, 7, 12); c.stroke();
        c.fillStyle = '#7fd3f5'; c.beginPath(); c.moveTo(24, -16); c.quadraticCurveTo(30, -6, 24, -4); c.quadraticCurveTo(18, -6, 24, -16); c.fill(); c.fillStyle = INK;
        break;
      case 'worried':
        eyeDot(-11, 3.8); eyeDot(11, 3.8); brow(-11, -0.35); brow(11, 0.35);
        c.beginPath(); c.arc(0, 15, 5, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke();
        break;
      case 'angry':
        eyeDot(-11, 3.6); eyeDot(11, 3.6); brow(-11, 0.45); brow(11, -0.45);
        c.beginPath(); c.arc(0, 16, 6, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
        c.strokeStyle = '#ff5a5a'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(20, -26); c.lineTo(26, -20); c.moveTo(26, -26); c.lineTo(20, -20); c.stroke(); c.strokeStyle = INK;
        break;
      case 'sad':
        eyeDot(-11, 3.6); eyeDot(11, 3.6); brow(-11, -0.4); brow(11, 0.4);
        c.beginPath(); c.arc(0, 16, 5.5, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke();
        c.fillStyle = '#7fd3f5'; c.beginPath(); c.moveTo(-13, 3); c.quadraticCurveTo(-9, 12, -13, 14); c.quadraticCurveTo(-17, 12, -13, 3); c.fill(); c.fillStyle = INK;
        break;
      case 'surprised':
        circ(c, -11, ey, 5); c.fill(); circ(c, 11, ey, 5); c.fill();
        c.fillStyle = '#fff'; circ(c, -9.5, ey - 2, 1.6); c.fill(); circ(c, 12.5, ey - 2, 1.6); c.fill(); c.fillStyle = INK;
        brow(-11, -0.15); brow(11, 0.15);
        circ(c, 0, 13, 4.5); c.fillStyle = '#ff8a8a'; c.fill(); c.stroke();
        break;
      case 'tired':
        c.beginPath(); c.moveTo(-15, ey); c.lineTo(-7, ey); c.moveTo(7, ey); c.lineTo(15, ey); c.stroke();
        c.beginPath(); c.moveTo(-4, 12); c.lineTo(4, 12); c.stroke();
        break;
      case 'determined':
        eyeDot(-11, 4); eyeDot(11, 4); brow(-11, 0.25); brow(11, -0.25);
        c.beginPath(); c.moveTo(-6, 11); c.quadraticCurveTo(0, 15, 6, 11); c.stroke();
        break;
      default:
        eyeDot(-11); eyeDot(11);
        c.beginPath(); c.arc(0, 8, 5, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    }
    if (cfg.glasses) {
      c.lineWidth = 2.2; c.strokeStyle = INK;
      circ(c, -11, ey, 8); c.stroke(); circ(c, 11, ey, 8); c.stroke();
      c.beginPath(); c.moveTo(-3, ey); c.lineTo(3, ey); c.stroke();
    }
  }

  function star(c, x, y, R, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
      c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    c.closePath();
  }

  /* ---------- 頭髮 ---------- */
  function drawHairBack(c, cfg, t) {
    c.fillStyle = cfg.hair; c.strokeStyle = INK; c.lineWidth = 3;
    if (cfg.style === 'ponytail') {
      const sw = Math.sin(t * 4) * 4;
      c.beginPath(); c.moveTo(22, -22); c.quadraticCurveTo(52 + sw, -20, 44 + sw, 18); c.quadraticCurveTo(36, -2, 18, -12); c.closePath(); c.fill(); c.stroke();
    } else if (cfg.style === 'long') {
      rr(c, -32, -10, 64, 42, 14); c.fill(); c.stroke();
    } else if (cfg.style === 'braids') {
      [[-28, 1], [28, -1]].forEach(([x, d]) => {
        c.beginPath(); c.ellipse(x + d * 4, 18, 7, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = cfg.accent || '#ff9ec4'; circ(c, x + d * 4, 33, 4); c.fill(); c.stroke(); c.fillStyle = cfg.hair;
      });
    } else if (cfg.style === 'bun') {
      circ(c, 0, -34, 13); c.fill(); c.stroke();
    }
  }
  function drawHairFront(c, cfg) {
    c.fillStyle = cfg.hair; c.strokeStyle = INK; c.lineWidth = 3;
    c.beginPath();
    switch (cfg.style) {
      case 'spiky':
        c.moveTo(-31, -4);
        [[-30, -26], [-22, -40], [-12, -30], [-4, -46], [6, -32], [16, -44], [22, -28], [32, -30], [31, -4]].forEach(p => c.lineTo(p[0], p[1]));
        c.quadraticCurveTo(10, -18, -31, -4); break;
      case 'buzz':
        c.moveTo(-30, -8); c.quadraticCurveTo(-32, -34, 0, -33); c.quadraticCurveTo(32, -34, 30, -8); c.quadraticCurveTo(0, -24, -30, -8); break;
      case 'bob':
        c.moveTo(-34, 14); c.quadraticCurveTo(-40, -36, 0, -34); c.quadraticCurveTo(40, -36, 34, 14); c.lineTo(26, 14);
        c.quadraticCurveTo(26, -12, 8, -14); c.quadraticCurveTo(-6, -22, -14, -12); c.quadraticCurveTo(-26, -6, -26, 14); c.closePath(); break;
      case 'long':
        c.moveTo(-34, 8); c.quadraticCurveTo(-38, -36, 0, -34); c.quadraticCurveTo(38, -36, 34, 8);
        c.quadraticCurveTo(24, -16, 0, -18); c.quadraticCurveTo(-24, -16, -34, 8); break;
      default: // short / ponytail / bun / braids
        c.moveTo(-31, -2); c.quadraticCurveTo(-36, -38, 0, -35); c.quadraticCurveTo(36, -38, 31, -2);
        c.quadraticCurveTo(22, -22, 4, -20); c.quadraticCurveTo(-8, -14, -18, -20); c.quadraticCurveTo(-26, -14, -31, -2);
    }
    c.fill(); c.stroke();
    if (cfg.style === 'ponytail' || cfg.style === 'braids') { // 髮夾
      c.fillStyle = cfg.accent || '#ff9ec4'; rr(c, 14, -26, 14, 7, 3); c.fill(); c.lineWidth = 2; c.stroke();
    }
  }

  /**
   * 畫 Q 版角色
   * @param {CanvasRenderingContext2D} c
   * @param {object} o { x, y(腳底), s(縮放), who, expr, pose:'stand'|'surf'|'wave'|'run', t, flip }
   */
  function drawChibi(c, o) {
    const cfg = CHARS[o.who] || CHARS.girl;
    const t = o.t || 0, s = o.s || 1;
    const big = cfg.adult ? 1.12 : 1;
    c.save();
    c.translate(o.x, o.y); c.scale(s * (o.flip ? -1 : 1), s);
    if (o.rot) c.rotate(o.rot);
    const pose = o.pose || 'stand';
    const bob = pose === 'stand' ? Math.sin(t * 2.2) * 1.2 : 0;
    const legLen = cfg.adult ? 26 : 18;

    // 影子
    if (pose !== 'surf') { c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0, 2, 24, 5, 0, 0, Math.PI * 2); c.fill(); }

    // 腿
    if (pose === 'surf') {
      line(c, [-8, -legLen, -18, -4, -16, 0], 8, INK); line(c, [8, -legLen, 18, -4, 16, 0], 8, INK);
      line(c, [-8, -legLen, -18, -4, -16, 0], 4.5, cfg.skin); line(c, [8, -legLen, 18, -4, 16, 0], 4.5, cfg.skin);
    } else if (pose === 'run') {
      const k = Math.sin(t * 10) * 10;
      line(c, [-6, -legLen, -6 - k, 0], 8, INK); line(c, [6, -legLen, 6 + k, 0], 8, INK);
      line(c, [-6, -legLen, -6 - k, 0], 4.5, cfg.skin); line(c, [6, -legLen, 6 + k, 0], 4.5, cfg.skin);
    } else {
      line(c, [-7, -legLen, -7, 0], 8, INK); line(c, [7, -legLen, 7, 0], 8, INK);
      line(c, [-7, -legLen, -7, 0], 4.5, cfg.skin); line(c, [7, -legLen, 7, 0], 4.5, cfg.skin);
    }
    // 鞋
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2.5;
    const feet = pose === 'surf' ? [-17, 17] : pose === 'run' ? [-6 - Math.sin(t * 10) * 10, 6 + Math.sin(t * 10) * 10] : [-7, 7];
    feet.forEach(fx => { c.beginPath(); c.ellipse(fx, -1, 7, 4, 0, 0, Math.PI * 2); c.fill(); c.stroke(); });

    c.translate(0, bob);
    const torsoTop = -legLen - 32 * big;
    // 手臂
    const armY = torsoTop + 8;
    let arms;
    if (pose === 'surf') arms = [[-14, armY, -36, armY - 8 + Math.sin(t * 3) * 3], [14, armY, 36, armY - 12 - Math.sin(t * 3) * 3]];
    else if (pose === 'wave') arms = [[-14, armY, -22, armY + 22], [14, armY, 30, armY - 22 + Math.sin(t * 8) * 4]];
    else if (pose === 'run') arms = [[-14, armY, -26, armY + 10 + Math.sin(t * 10) * 8], [14, armY, 26, armY + 10 - Math.sin(t * 10) * 8]];
    else if (pose === 'cheer') arms = [[-14, armY, -28, armY - 24], [14, armY, 28, armY - 24]];
    else arms = [[-14, armY, -20, armY + 24], [14, armY, 20, armY + 24]];
    arms.forEach(a => { line(c, a, 9, INK); line(c, a, 5.5, cfg.skin); });

    // 身體
    rr(c, -16 * big, torsoTop, 32 * big, 34 * big, 10);
    fillStroke(c, cfg.shirt);
    c.save(); rr(c, -16 * big, torsoTop, 32 * big, 34 * big, 10); c.clip();
    c.fillStyle = cfg.bottom; c.fillRect(-20 * big, torsoTop + 22 * big, 40 * big, 20);
    if (!cfg.adult) { c.fillStyle = cfg.accent || cfg.bottom; c.fillRect(-20, torsoTop, 40, 5); }
    c.restore();
    rr(c, -16 * big, torsoTop, 32 * big, 34 * big, 10); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    if (cfg.badge) { c.fillStyle = '#ffd35c'; rr(c, 4, torsoTop + 8, 9, 11, 2); c.fill(); c.lineWidth = 1.5; c.stroke(); }
    if (!cfg.adult) { // 領口
      c.beginPath(); c.moveTo(-6, torsoTop); c.lineTo(0, torsoTop + 7); c.lineTo(6, torsoTop); c.lineWidth = 2.5; c.stroke();
    }

    // 頭
    c.save();
    c.translate(0, torsoTop - 26);
    if (pose === 'surf') c.rotate(Math.sin(t * 2) * 0.05);
    drawHairBack(c, cfg, t);
    circ(c, 0, 0, 30); fillStroke(c, cfg.skin);
    // 耳朵
    c.fillStyle = cfg.skin; circ(c, -30, 4, 6); c.fill(); c.stroke(); circ(c, 30, 4, 6); c.fill(); c.stroke();
    circ(c, 0, 0, 29); c.fillStyle = cfg.skin; c.fill();
    drawHairFront(c, cfg);
    drawFace(c, o.expr || 'calm', cfg, t);
    c.restore();
    c.restore();
  }

  /* ---------- 情緒精靈「浪浪」 ---------- */
  function drawSprite(c, x, y, s, expr, t) {
    c.save(); c.translate(x, y + Math.sin((t || 0) * 2.5) * 4); c.scale(s, s);
    const g = c.createRadialGradient(-6, -8, 4, 0, 0, 34);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#9ff0e0'); g.addColorStop(1, '#3fbfa8');
    c.beginPath();
    c.moveTo(0, -34); c.bezierCurveTo(14, -18, 28, -4, 28, 10); c.bezierCurveTo(28, 26, 14, 34, 0, 34);
    c.bezierCurveTo(-14, 34, -28, 26, -28, 10); c.bezierCurveTo(-28, -4, -14, -18, 0, -34); c.closePath();
    c.fillStyle = g; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    // 小浪花頭飾
    c.beginPath(); c.moveTo(-8, -22); c.quadraticCurveTo(0, -32, 10, -22); c.lineWidth = 2.5; c.strokeStyle = '#fff'; c.stroke();
    c.save(); c.translate(0, 12); c.scale(0.8, 0.8); drawFace(c, expr || 'happy', {}, t); c.restore();
    c.restore();
  }

  /* ---------- 衝浪板 ---------- */
  function drawBoard(c, x, y, ang, col) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(-50, 0); c.quadraticCurveTo(-46, -9, -20, -9); c.lineTo(36, -9); c.quadraticCurveTo(60, -8, 62, 0);
    c.quadraticCurveTo(58, 7, 36, 7); c.lineTo(-20, 7); c.quadraticCurveTo(-46, 7, -50, 0); c.closePath();
    c.fillStyle = col || '#ffb938'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(-40, -1); c.lineTo(52, -1); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
    c.fillStyle = '#ff7a59'; c.beginPath(); c.moveTo(-36, 7); c.lineTo(-30, 16); c.lineTo(-24, 7); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    c.restore();
  }

  /* ---------- 道具 ---------- */
  function drawSpark(c, x, y, r, t, col) {
    c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2) * 0.3);
    c.fillStyle = 'rgba(255,240,170,.45)'; circ(c, 0, 0, r * 1.7); c.fill();
    star(c, 0, 0, r, r * 0.48); c.fillStyle = col || '#ffd35c'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.restore();
  }
  function drawBaton(c, x, y, t) {
    c.save(); c.translate(x, y); c.rotate(-0.4 + Math.sin(t * 4) * 0.15);
    rr(c, -18, -6, 36, 12, 6); fillStroke(c, '#ff7a59', 2.5);
    c.fillStyle = '#fff'; c.fillRect(-4, -6, 8, 12); c.restore();
  }
  function drawDiscovery(c, kind, x, y, t) {
    c.save(); c.translate(x, y + Math.sin(t * 3 + x) * 3);
    c.fillStyle = 'rgba(255,255,255,.55)'; circ(c, 0, 0, 22); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2.5;
    if (kind === 0) { // 化石
      c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.fillStyle = '#e9c99a'; c.fill(); c.stroke();
      c.beginPath(); for (let a = 0; a < 9; a += 0.4) { const r = a * 1.4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke();
    } else if (kind === 1) { // 葉子
      c.beginPath(); c.moveTo(-12, 10); c.quadraticCurveTo(-12, -12, 12, -12); c.quadraticCurveTo(12, 10, -12, 10); c.fillStyle = '#7cc79a'; c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-12, 10); c.lineTo(8, -8); c.stroke();
    } else if (kind === 2) { // 貝殼
      c.beginPath(); c.moveTo(-14, 6); c.quadraticCurveTo(0, -22, 14, 6); c.closePath(); c.fillStyle = '#ffc0d0'; c.fill(); c.stroke();
      [-6, 0, 6].forEach(dx => { c.beginPath(); c.moveTo(0, 6); c.lineTo(dx * 1.6, -8); c.stroke(); });
    } else { // 骨頭
      c.fillStyle = '#fffaf0';
      c.beginPath(); c.moveTo(-10, -3); c.lineTo(10, -3); c.lineTo(10, 3); c.lineTo(-10, 3); c.closePath(); c.fill(); c.stroke();
      [[-12, -4], [-12, 4], [12, -4], [12, 4]].forEach(p => { circ(c, p[0], p[1], 5); c.fill(); c.stroke(); });
    }
    c.restore();
  }
  function drawBuoySign(c, x, y, label, t) {
    c.save(); c.translate(x, y + Math.sin(t * 2) * 3);
    line(c, [0, 0, 0, -70], 5, INK);
    c.font = '900 18px "Noto Sans TC", sans-serif';
    const w = Math.max(90, c.measureText(label).width + 28);
    rr(c, -w / 2, -110, w, 40, 14); fillStroke(c, '#fff');
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, 0, -90);
    c.beginPath(); c.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2); fillStroke(c, '#ff7a59');
    c.fillStyle = '#fff'; c.fillRect(-18, -3, 36, 6);
    c.restore();
  }
  function drawCloud(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = 'rgba(255,255,255,.92)';
    c.beginPath(); c.arc(0, 0, 20, 0, 7); c.arc(22, -8, 24, 0, 7); c.arc(46, 0, 18, 0, 7); c.arc(24, 8, 20, 0, 7); c.fill();
    c.restore();
  }
  function drawSun(c, x, y, r, t) {
    c.save(); c.translate(x, y);
    c.fillStyle = 'rgba(255,214,90,.25)'; circ(c, 0, 0, r * 1.6 + Math.sin(t) * 3); c.fill();
    c.rotate(t * 0.15); c.strokeStyle = '#ffd35c'; c.lineWidth = 5; c.lineCap = 'round';
    for (let i = 0; i < 10; i++) { c.rotate(Math.PI / 5); c.beginPath(); c.moveTo(r * 1.2, 0); c.lineTo(r * 1.45, 0); c.stroke(); }
    circ(c, 0, 0, r); c.fillStyle = '#ffd35c'; c.fill();
    c.restore();
  }
  function drawGull(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const f = Math.sin(t * 6) * 6;
    c.beginPath(); c.moveTo(-16, f); c.quadraticCurveTo(-8, -8, 0, 0); c.quadraticCurveTo(8, -8, 16, f);
    c.lineWidth = 3; c.strokeStyle = INK; c.lineCap = 'round'; c.stroke(); c.restore();
  }

  /* ---------- 事件場景 ---------- */
  function sky(c, w, h, top, bot) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function flags(c, w, y, t) {
    const cols = ['#ff7a59', '#ffd35c', '#3fbf7f', '#5b8def', '#ff9ec4'];
    c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(w / 2, y + 40, w, y); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    for (let i = 0; i < 16; i++) {
      const x = (i + 0.5) * w / 16, k = x / w, yy = y + 80 * k * (1 - k);
      const sw = Math.sin(t * 3 + i) * 2;
      c.beginPath(); c.moveTo(x - 8, yy); c.lineTo(x + 8, yy); c.lineTo(x + sw, yy + 20); c.closePath();
      c.fillStyle = cols[i % 5]; c.fill(); c.lineWidth = 1.5; c.stroke();
    }
  }
  function building(c, x, y, w, h, col) {
    rr(c, x, y, w, h, 6); fillStroke(c, col || '#fff1d6');
    const cols = Math.floor(w / 46);
    for (let r = 0; r < Math.floor(h / 46); r++) for (let i = 0; i < cols; i++) {
      rr(c, x + 14 + i * 46, y + 14 + r * 46, 26, 22, 4); fillStroke(c, '#9fd8f0', 2);
    }
  }
  function desk(c, x, y, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-50, 0); c.lineTo(50, 0); c.lineTo(56, 16); c.lineTo(-56, 16); c.closePath(); fillStroke(c, '#d79b5c', 2.5);
    line(c, [-46, 16, -46, 50], 5, INK); line(c, [46, 16, 46, 50], 5, INK);
    c.restore();
  }
  function track(c, w, y, h) {
    c.fillStyle = '#e8795a'; c.fillRect(0, y, w, h);
    c.strokeStyle = '#fff'; c.lineWidth = 3;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, y + i * h / 4); c.lineTo(w, y + i * h / 4); c.stroke(); }
  }
  function crowd(c, w, y, t) {
    const cols = ['#ff7a59', '#ffd35c', '#3fbf7f', '#5b8def', '#ff9ec4', '#b99cff'];
    for (let i = 0; i < 26; i++) {
      const x = i * (w / 25), jump = Math.max(0, Math.sin(t * 5 + i * 1.7)) * 5;
      c.fillStyle = cols[i % 6]; rr(c, x - 10, y - 14 - jump, 20, 24, 8); c.fill();
      c.fillStyle = '#ffe2c6'; circ(c, x, y - 24 - jump, 10); c.fill();
      c.fillStyle = '#3b2b28'; c.beginPath(); c.arc(x, y - 26 - jump, 10, Math.PI, 0); c.fill();
    }
  }

  const SCENES = {
    gate(c, w, h, t) {
      sky(c, w, h, '#8fdcff', '#e6f8ff'); drawSun(c, w - 80, 60, 26, t);
      drawCloud(c, 80 + Math.sin(t * .2) * 10, 60, 1); drawCloud(c, 360, 40, .7);
      building(c, 60, 110, w - 120, 110);
      rr(c, w / 2 - 40, 80, 80, 44, 8); fillStroke(c, '#ffd9a8');
      c.font = '900 20px "Noto Sans TC", sans-serif'; c.fillStyle = INK; c.textAlign = 'center'; c.fillText('運動會', w / 2, 110);
      flags(c, w, 70, t);
      c.fillStyle = '#9edb8a'; c.fillRect(0, 220, w, h - 220);
      // 校門
      rr(c, 20, 150, 26, 120, 4); fillStroke(c, '#c9d3df'); rr(c, w - 46, 150, 26, 120, 4); fillStroke(c, '#c9d3df');
    },
    track(c, w, h, t) {
      sky(c, w, h, '#8fdcff', '#e6f8ff'); drawSun(c, 70, 50, 22, t);
      flags(c, w, 30, t);
      c.fillStyle = '#9edb8a'; c.fillRect(0, 110, w, 60);
      crowd(c, w, 150, t);
      track(c, w, 170, h - 170);
      c.strokeStyle = '#fff'; c.lineWidth = 6; c.setLineDash([12, 10]); c.beginPath(); c.moveTo(w * 0.62, 170); c.lineTo(w * 0.62, h); c.stroke(); c.setLineDash([]);
    },
    photo(c, w, h, t) {
      sky(c, w, h, '#ffb88a', '#ffe9c9'); drawSun(c, w - 90, 90, 30, t);
      flags(c, w, 30, t);
      rr(c, 80, 60, w - 160, 50, 12); fillStroke(c, '#fff');
      c.font = '900 22px "Noto Sans TC", sans-serif'; c.fillStyle = '#ff7a59'; c.textAlign = 'center'; c.fillText('★ 我們是最棒的一班 ★', w / 2, 93);
      c.fillStyle = '#9edb8a'; c.fillRect(0, 200, w, h - 200);
      rr(c, 60, 230, w - 120, 30, 8); fillStroke(c, '#e8c58c');
    },
    classroom(c, w, h, t) {
      sky(c, w, h, '#fff5e0', '#fff0d0');
      rr(c, 60, 30, 380, 140, 8); fillStroke(c, '#2f6b55', 6, '#8a5a2b');
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(90, 70); c.lineTo(180, 70); c.moveTo(90, 100); c.lineTo(230, 100); c.moveTo(90, 130); c.lineTo(160, 130); c.stroke();
      c.font = '900 22px "Noto Sans TC", sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText('今日：數學小考', 250, 76);
      rr(c, w - 200, 50, 130, 120, 6); fillStroke(c, '#bfe9f7'); line(c, [w - 135, 50, w - 135, 170], 3, INK); line(c, [w - 200, 110, w - 70, 110], 3, INK);
      c.fillStyle = '#e9c99a'; c.fillRect(0, 230, w, h - 230);
      desk(c, 150, 240, 1); desk(c, w - 160, 240, 1);
    },
    hall(c, w, h, t) {
      sky(c, w, h, '#f6f1ff', '#ece4ff');
      for (let i = 0; i < 6; i++) { rr(c, 20 + i * (w / 6), 50, w / 6 - 20, 150, 6); fillStroke(c, i % 2 ? '#bfe0ff' : '#cfe8d8', 2.5); circ(c, 20 + i * (w / 6) + w / 6 - 40, 130, 4); c.fillStyle = INK; c.fill(); }
      c.fillStyle = '#d8c7a8'; c.fillRect(0, 210, w, h - 210);
      rr(c, w / 2 - 70, 20, 140, 28, 8); fillStroke(c, '#fff');
      c.font = '900 16px "Noto Sans TC", sans-serif'; c.fillStyle = INK; c.textAlign = 'center'; c.fillText('五年三班', w / 2, 40);
    },
    exam(c, w, h, t) {
      sky(c, w, h, '#fff8ea', '#fff0d6');
      rr(c, 60, 30, 330, 120, 8); fillStroke(c, '#2f6b55', 6, '#8a5a2b');
      c.font = '900 24px "Noto Sans TC", sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('考試中・請保持安靜', 225, 98);
      // 時鐘
      const cx = w - 110, cy = 80; circ(c, cx, cy, 40); fillStroke(c, '#fff', 4);
      const a = t * 0.6; line(c, [cx, cy, cx + Math.cos(a) * 28, cy + Math.sin(a) * 28], 3, '#ff7a59'); line(c, [cx, cy, cx, cy - 22], 4, INK);
      c.fillStyle = '#e9c99a'; c.fillRect(0, 220, w, h - 220);
      desk(c, w / 2, 230, 1.6);
      c.save(); c.translate(w / 2, 218); c.rotate(-0.05); rr(c, -70, -20, 140, 36, 3); fillStroke(c, '#fff', 2.5);
      c.strokeStyle = '#9fb1c4'; c.lineWidth = 2.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-58, -10 + i * 9); c.lineTo(40 - i * 18, -10 + i * 9); c.stroke(); } c.restore();
    },
    dusk(c, w, h, t) {
      sky(c, w, h, '#ff9e7a', '#ffe0b8'); drawSun(c, w / 2, 190, 40, t);
      building(c, 60, 100, w - 120, 120, '#ffe1c4');
      c.fillStyle = '#8fcf8a'; c.fillRect(0, 220, w, h - 220);
      drawGull(c, 120, 60, 1, t); drawGull(c, 170, 80, .7, t + 1);
    },
    bus(c, w, h, t) {
      sky(c, w, h, '#fff1c9', '#ffe6a8');
      for (let i = 0; i < 3; i++) {
        const x = 40 + i * (w - 80) / 3;
        rr(c, x, 40, (w - 80) / 3 - 20, 110, 16); fillStroke(c, '#bfe9f7', 4);
        c.save(); rr(c, x, 40, (w - 80) / 3 - 20, 110, 16); c.clip();
        const off = (t * 80) % 200;
        c.fillStyle = '#7cc79a'; for (let k = -1; k < 4; k++) { c.beginPath(); c.arc(x + k * 100 - off + 60, 160, 50, Math.PI, 0); c.fill(); }
        drawCloud(c, x + 40 - (off * .3) % 80, 70, .6);
        c.restore();
      }
      c.fillStyle = '#5b8def'; c.fillRect(0, 200, w, h - 200);
      for (let i = 0; i < 4; i++) { rr(c, 30 + i * (w - 40) / 4, 190, (w - 40) / 4 - 20, 60, 14); fillStroke(c, '#ff7a59', 3); }
    },
    museum(c, w, h, t) {
      sky(c, w, h, '#f4ecdf', '#ead9c0');
      for (let i = 0; i < 5; i++) { rr(c, 30 + i * (w - 40) / 5, 20, 24, 220, 4); fillStroke(c, '#fff8ee', 2.5); }
      // 恐龍骨架
      c.save(); c.translate(w / 2 + 40, 160); c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-160, 10); c.quadraticCurveTo(-80, -60, 0, -40); c.quadraticCurveTo(60, -30, 100, -90); c.stroke();
      for (let i = 0; i < 9; i++) { const x = -120 + i * 22; c.beginPath(); c.moveTo(x, -38 + Math.abs(i - 4) * 4); c.lineTo(x, -10 + Math.abs(i - 4) * 3); c.stroke(); }
      c.beginPath(); c.ellipse(112, -100, 26, 16, -0.4, 0, Math.PI * 2); c.fillStyle = '#fffaf0'; c.fill(); c.stroke();
      line(c, [-40, -20, -50, 50], 6, INK); line(c, [20, -30, 30, 50], 6, INK); c.restore();
      c.fillStyle = '#c9b18c'; c.fillRect(0, 230, w, h - 230);
      rr(c, 40, 200, 120, 40, 6); fillStroke(c, '#fff'); c.font = '900 15px "Noto Sans TC", sans-serif'; c.fillStyle = INK; c.textAlign = 'center'; c.fillText('恐龍展示廳', 100, 226);
    },
    garden(c, w, h, t) {
      sky(c, w, h, '#a6e4ff', '#e9f9ff'); drawSun(c, w - 70, 50, 22, t);
      drawCloud(c, 120, 50, .9);
      c.fillStyle = '#a6dcb4'; c.beginPath(); c.moveTo(0, 170); c.quadraticCurveTo(w / 3, 110, w / 2, 160); c.quadraticCurveTo(w * .8, 120, w, 160); c.lineTo(w, h); c.lineTo(0, h); c.fill();
      c.fillStyle = '#e9d7b0'; c.beginPath(); c.moveTo(w / 2 - 40, h); c.quadraticCurveTo(w / 2 - 10, 200, w / 2 + 120, 170); c.lineTo(w / 2 + 150, 176); c.quadraticCurveTo(w / 2 + 30, 210, w / 2 + 50, h); c.fill();
      // 路標
      line(c, [90, 260, 90, 150], 6, INK);
      c.save(); c.translate(90, 160); rr(c, 0, -14, 90, 26, 6); fillStroke(c, '#ffd35c'); c.fillStyle = INK; c.font = '900 14px "Noto Sans TC", sans-serif'; c.textAlign = 'left'; c.fillText('化石區 →', 8, 4);
      c.translate(0, 34); rr(c, -90, -14, 90, 26, 6); fillStroke(c, '#7fd3f5'); c.fillStyle = INK; c.fillText('← 海洋區', -84, 4); c.restore();
      [[w - 120, 190], [w - 60, 200], [40, 210]].forEach(([x, y]) => { line(c, [x, y + 40, x, y], 8, '#8a5a2b'); circ(c, x, y - 16, 28); fillStroke(c, '#5fbf7f'); });
    },
    lost(c, w, h, t) {
      sky(c, w, h, '#eef0ff', '#dfe3ff');
      // 走廊交叉口
      c.fillStyle = '#d8ccf0'; c.beginPath(); c.moveTo(0, 60); c.lineTo(w * .35, 120); c.lineTo(w * .35, 220); c.lineTo(0, 280); c.fill();
      c.beginPath(); c.moveTo(w, 60); c.lineTo(w * .65, 120); c.lineTo(w * .65, 220); c.lineTo(w, 280); c.fill();
      c.fillStyle = '#c9bbe6'; c.fillRect(w * .35, 120, w * .3, 100);
      c.fillStyle = '#bba98c'; c.fillRect(0, 230, w, h - 230);
      // 服務台
      rr(c, w * .4, 150, w * .2, 70, 8); fillStroke(c, '#fff');
      rr(c, w * .42, 128, w * .16, 26, 8); fillStroke(c, '#3fbf7f');
      c.font = '900 15px "Noto Sans TC", sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText('服務台 ⓘ', w / 2, 147);
      // 標示
      rr(c, 40, 80, 110, 30, 6); fillStroke(c, '#ffd35c'); c.fillStyle = INK; c.fillText('集合點 ★', 95, 101);
    },
    busHome(c, w, h, t) {
      sky(c, w, h, '#ffcf9e', '#ffe9cc');
      for (let i = 0; i < 2; i++) {
        const x = 40 + i * (w - 80) / 2;
        rr(c, x, 36, (w - 80) / 2 - 24, 130, 18); fillStroke(c, '#ffb07a', 4);
        c.save(); rr(c, x, 36, (w - 80) / 2 - 24, 130, 18); c.clip();
        drawSun(c, x + 140, 150, 34, t);
        const off = (t * 50) % 240; c.fillStyle = '#9c7fb8'; for (let k = -1; k < 4; k++) { c.beginPath(); c.arc(x + k * 120 - off + 80, 180, 60, Math.PI, 0); c.fill(); }
        c.restore();
      }
      c.fillStyle = '#5b8def'; c.fillRect(0, 200, w, h - 200);
      for (let i = 0; i < 4; i++) { rr(c, 30 + i * (w - 40) / 4, 190, (w - 40) / 4 - 20, 60, 14); fillStroke(c, '#ff7a59', 3); }
    },
    sea(c, w, h, t) { // 情緒海洋（技能用）
      sky(c, w, h, '#bdeaff', '#eaf9ff'); drawSun(c, w - 80, 60, 26, t);
      c.fillStyle = '#5cc8e8'; c.beginPath(); c.moveTo(0, 180);
      for (let x = 0; x <= w; x += 10) c.lineTo(x, 180 + Math.sin(x * 0.03 + t * 2) * 8);
      c.lineTo(w, h); c.lineTo(0, h); c.fill();
    }
  };

  function drawScene(c, id, w, h, t) {
    c.save();
    (SCENES[id] || SCENES.sea)(c, w, h, t || 0);
    c.restore();
  }

  /** 把角色頭像畫進小 canvas */
  function portrait(canvas, who, expr) {
    const c = canvas.getContext('2d'); const w = canvas.width, h = canvas.height;
    c.clearRect(0, 0, w, h);
    const s = w / 96;
    if (who === 'sprite') { drawSprite(c, w / 2, h / 2 + 4 * s, s * 1.15, expr || 'happy', 0); return; }
    if (who === 'narr') { // 旁白：指南針
      c.save(); c.translate(w / 2, h / 2); c.scale(s, s);
      circ(c, 0, 0, 30); fillStroke(c, '#fff', 4);
      c.beginPath(); c.moveTo(0, -22); c.lineTo(7, 0); c.lineTo(0, 22); c.lineTo(-7, 0); c.closePath(); fillStroke(c, '#ff7a59', 3);
      circ(c, 0, 0, 5); fillStroke(c, '#ffd35c', 2.5); c.restore(); return;
    }
    const cfg = CHARS[who] || CHARS.girl;
    const yFeet = cfg.adult ? 156 : 140;
    drawChibi(c, { x: w / 2, y: yFeet * s, s: s * 0.95, who, expr: expr || 'calm', pose: 'stand', t: 0 });
  }

  return { CHARS, drawChibi, drawSprite, drawBoard, drawSpark, drawBaton, drawDiscovery, drawBuoySign, drawCloud, drawSun, drawGull, drawScene, portrait, rr, circ, star, fillStroke, line, INK };
})();
