/* =========================================================
   results.js — 「我的 OK 曲線」結果畫面與 PNG 學習成果卡
   注意：不以情緒高低、是否開心、是否待在綠色區作為分數。
   ========================================================= */
window.OK = window.OK || {};

OK.Results = (function () {
  const A = OK.Art;
  const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif';
  const zone = (a) => a > 70 ? 'high' : a < 30 ? 'low' : 'ok';
  const ZCOL = { high: '#ff7a59', ok: '#3fbf7f', low: '#5b8def' };
  const ZNAME = { high: '高激發區', ok: '復原力區', low: '低激發區' };

  function curvePoints(records) {
    const pts = [{ x: 0, a: 50 }];
    records.forEach((r, i) => {
      pts.push({ x: i + 0.55, a: r.aEmo, node: i, rec: r });
      pts.push({ x: i + 0.95, a: r.aAfter });
    });
    pts.push({ x: records.length + 0.3, a: records.length ? records[records.length - 1].aAfter : 50 });
    return pts;
  }

  /** 畫出 OK 曲線圖 */
  function drawChart(c, records, w, h, opt = {}) {
    const padL = opt.padL || 92, padR = 24, padT = 34, padB = 44;
    const cw = w - padL - padR, ch = h - padT - padB;
    const n = Math.max(records.length, 6);
    const X = (x) => padL + x / (n + 0.3) * cw;
    const Y = (a) => padT + (1 - a / 100) * ch;
    c.save();
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    // 三色區
    [['high', 100, 70], ['ok', 70, 30], ['low', 30, 0]].forEach(([z, a1, a2]) => {
      c.fillStyle = { high: '#ffe9e1', ok: '#e3f8ec', low: '#e6edff' }[z];
      c.fillRect(padL, Y(a1), cw, Y(a2) - Y(a1));
      c.fillStyle = ZCOL[z]; c.font = `900 ${opt.fs || 15}px ${FONT}`; c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(ZNAME[z], padL - 10, (Y(a1) + Y(a2)) / 2);
    });
    c.textBaseline = 'alphabetic';
    // 事件格線
    c.strokeStyle = 'rgba(35,57,91,.12)'; c.lineWidth = 1;
    for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(X(i + 0.55), padT); c.lineTo(X(i + 0.55), padT + ch); c.stroke(); }
    // 曲線（Catmull-Rom 平滑）
    const pts = curvePoints(records).map(p => Object.assign({}, p, { px: X(p.x), py: Y(p.a) }));
    const seg = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k <= 16; k++) {
        const t = k / 16, t2 = t * t, t3 = t2 * t;
        const f = (a, b, cc, d) => 0.5 * ((2 * b) + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
        seg.push([f(p0.px, p1.px, p2.px, p3.px), f(p0.py, p1.py, p2.py, p3.py)]);
      }
    }
    // 底下的水
    c.beginPath(); c.moveTo(seg[0][0], padT + ch); seg.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(seg[seg.length - 1][0], padT + ch); c.closePath();
    const g = c.createLinearGradient(0, padT, 0, padT + ch); g.addColorStop(0, 'rgba(95,208,240,.35)'); g.addColorStop(1, 'rgba(42,142,194,.12)'); c.fillStyle = g; c.fill();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = opt.lw || 7; c.strokeStyle = '#fff';
    c.beginPath(); seg.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
    for (let i = 1; i < seg.length; i++) {
      const a = 100 - (seg[i][1] - padT) / ch * 100;
      c.strokeStyle = ZCOL[zone(a)]; c.lineWidth = (opt.lw || 7) - 2;
      c.beginPath(); c.moveTo(seg[i - 1][0], seg[i - 1][1]); c.lineTo(seg[i][0], seg[i][1]); c.stroke();
    }
    // 節點
    pts.filter(p => p.node != null).forEach(p => {
      const r = opt.nodeR || 15;
      A.circ(c, p.px, p.py, r); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 4; c.strokeStyle = ZCOL[zone(p.a)]; c.stroke();
      c.fillStyle = '#23395b'; c.font = `900 ${Math.round(r * 1.05)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(p.node + 1), p.px, p.py + 1);
      const emo = p.rec.emotion; const label = `${OK.EMOTIONS[emo] ? OK.EMOTIONS[emo].ico : ''}${emo}`;
      c.font = `700 ${opt.fs || 14}px ${FONT}`;
      const above = p.py - r - 14 > padT + 6;
      const ty = above ? p.py - r - 12 : p.py + r + 16;
      const tw = c.measureText(label).width + 12;
      A.rr(c, p.px - tw / 2, ty - 11, tw, 22, 11); c.fillStyle = 'rgba(255,255,255,.92)'; c.fill();
      c.fillStyle = '#23395b'; c.fillText(label, p.px, ty);
    });
    c.textBaseline = 'alphabetic';
    // X 軸
    c.font = `700 ${opt.fsSmall || 12}px ${FONT}`; c.fillStyle = '#4d6585'; c.textAlign = 'center';
    records.forEach((r, i) => { const lab = `${i + 1}. ${r.title}`; const n = opt.axisChars || 9; c.fillText(lab.length > n ? lab.slice(0, n) + '…' : lab, X(i + 0.55), padT + ch + 22); });
    c.restore();
  }

  function feedback(records, story) {
    const noticed = records.filter(r => r.signals.length && !(r.signals.length === 1 && r.signals[0] === '沒有特別感覺')).length;
    const skills = new Set(records.filter(r => r.skill).map(r => r.skill));
    let back = 0;
    records.forEach(r => { if (r.skill && zone(r.aEmo) !== 'ok' && Math.abs(r.aAfter - 50) < Math.abs(r.aEmo - 50)) back++; });
    let msg = `今天你在 ${records.length} 個事件裡，都停下來認識了自己的心情，注意到 ${noticed} 次身體訊號`;
    msg += skills.size ? `，也試了 ${skills.size} 種調節技能。` : '。';
    if (back > 0) msg += `有 ${back} 次，你從比較大的浪，慢慢回到可以思考和行動的狀態——這就是復原力！`;
    else msg += '不論波浪高或低，你都陪著自己走完了這一天，這就是復原力。';
    msg += '情緒的波浪本來就會起起伏伏，你正在學習乘著它前進 🌊';
    return msg;
  }

  function tools(records) {
    const list = [];
    const helpfulRank = { '很有幫助': 3, '有一點幫助': 2, '沒什麼幫助': 1 };
    const used = {};
    records.forEach(r => { if (r.skill) { const k = r.skill; if (!used[k] || (helpfulRank[r.helpful] || 0) > (helpfulRank[used[k].helpful] || 0)) used[k] = r; } });
    Object.keys(used).forEach(k => {
      const r = used[k];
      list.push(`${OK.SKILLS[k].name}${r.helpful ? `（我覺得${r.helpful}）` : ''}`);
    });
    records.forEach(r => {
      if (r.skill === 'island' && r.skillExtra && r.skillExtra.helper) list.push(`我的支持者：${OK.HELPERS[r.skillExtra.helper].name}`);
      if (r.skill === 'puzzle' && r.skillDetail) list.push(`平衡想法：「${r.skillDetail.length > 26 ? r.skillDetail.slice(0, 26) + '…' : r.skillDetail}」`);
      if (r.actionTag && r.actionTag.startsWith('next-')) list.push(`下次想嘗試：${r.action}`);
    });
    if (!Object.keys(used).length) list.push('下次可以試試：呼吸光圈、安全港停靠、支持浮島、想法拼圖');
    list.push('記得：每種感受都可以被接納，需要時可以找人幫忙。');
    return list;
  }

  function show(story, records) {
    const $ = (s) => document.querySelector(s);
    $('#res-story').textContent = story.title;
    const cv = $('#res-chart');
    const small = window.innerWidth < 600;
    const w = small ? 560 : 900, h = small ? 400 : 380;
    const r = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * r; cv.height = h * r;
    const c = cv.getContext('2d'); c.setTransform(r, 0, 0, r, 0, 0);
    drawChart(c, records, w, h, small ? { fs: 15, fsSmall: 13, axisChars: 4, padL: 80, nodeR: 13 } : { fs: 15, fsSmall: 12, axisChars: 10 });
    $('#res-feedback').textContent = feedback(records, story);
    const evBox = $('#res-events'); evBox.innerHTML = '';
    records.forEach((rec, i) => {
      const d = document.createElement('div');
      d.className = 'res-ev ' + zone(rec.aEmo);
      const em = OK.EMOTIONS[rec.emotion];
      d.innerHTML = `<h4>${i + 1}. ${rec.title}<span style="float:right;color:#4d6585;font-size:13px">${rec.time}</span></h4>
        <div><span class="lbl">心情：</span>${em ? em.ico : ''} ${rec.emotion}</div>
        <div><span class="lbl">身體訊號：</span>${rec.signals.join('、') || '—'}</div>
        <div><span class="lbl">模擬激發程度：</span>${Math.round(rec.aEmo)} → ${Math.round(rec.aAfter)}（${ZNAME[zone(rec.aEmo)]}）</div>
        <div><span class="lbl">調節技能：</span>${rec.skill ? OK.SKILLS[rec.skill].name + (rec.helpful ? `｜${rec.helpful}` : '') : '這次沒有使用'}</div>
        ${rec.challenge ? `<div><span class="lbl">衝浪挑戰：</span>${rec.challenge}</div>` : ''}
        <div><span class="lbl">我的行動：</span>${rec.action}</div>`;
      evBox.appendChild(d);
    });
    const sk = $('#res-skills'); sk.innerHTML = '';
    Object.keys(OK.SKILLS).forEach(k => {
      const n = records.filter(r => r.skill === k).length;
      const d = document.createElement('div'); d.className = 'res-skill' + (n ? '' : ' off');
      d.innerHTML = `<img src="${OK.SKILLS[k].icon}" alt="">${OK.SKILLS[k].name}${n ? ` ×${n}` : ''}`;
      sk.appendChild(d);
    });
    const tl = $('#res-tools'); tl.innerHTML = '';
    tools(records).forEach(t => { const li = document.createElement('li'); li.textContent = t; tl.appendChild(li); });
  }

  function wrapLines(c, text, maxW) {
    const lines = []; let line = '';
    const noStart = '，。、！？；：」）…—';
    for (const ch of text) {
      if (line && c.measureText(line + ch).width > maxW && !noStart.includes(ch)) { lines.push(line); line = ch; }
      else line += ch;
    }
    if (line) lines.push(line);
    return lines;
  }
  function wrap(c, text, x, y, maxW, lh, maxLines) {
    let lines = wrapLines(c, text, maxW);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let lastL = lines[maxLines - 1];
      while (lastL.length && c.measureText(lastL + '…').width > maxW) lastL = lastL.slice(0, -1);
      lines[maxLines - 1] = lastL + '…';
    }
    lines.forEach(l => { c.fillText(l, x, y); y += lh; });
    return y;
  }
  function drawBadge(c, x, y, k) {
    c.save(); c.translate(x - 60 * k, y - 60 * k); c.scale(k, k);
    // 紅、藍兩條緞帶
    // 黃色圓形外框＋虛線內圈
    // 綠色波浪線
    // 「OK」文字
    // 白色星星
    c.restore(); c.textAlign = 'left';
  }
  function loadImg(src) { return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }); }

  /** 產生 PNG 學習成果卡 */
  async function makeCard(story, records, avatar) {
    const W = 1200, H = 1800;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfe9f7'); g.addColorStop(0.3, '#f4fbff'); g.addColorStop(1, '#fffdf4');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // 頁首
    A.rr(c, 30, 30, W - 60, 190, 32); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#23395b'; c.stroke();
    drawBadge(c, 135, 125, 1.25); // 直接用 canvas 畫徽章，不載入外部圖片
    c.fillStyle = '#23395b'; c.textAlign = 'left';
    c.font = `900 30px ${FONT}`; c.fillText('OK 曲線衝浪：我的校園一天', 230, 92);
    c.font = `900 58px ${FONT}`; c.fillText('我的 OK 曲線', 230, 160);
    c.font = `700 24px ${FONT}`; c.fillStyle = '#4d6585';
    const d = new Date();
    c.fillText(`今日故事：${story.title}｜${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`, 230, 200);
    A.drawChibi(c, { x: W - 130, y: 200, s: 1.3, who: avatar, expr: 'happy', pose: 'cheer', t: 0 });
    // 曲線
    c.save(); c.translate(30, 250);
    A.rr(c, 0, 0, W - 60, 470, 28); c.fillStyle = '#fff'; c.fill(); c.clip();
    c.translate(10, 10); drawChart(c, records, W - 80, 450, { fs: 18, fsSmall: 15, lw: 9, nodeR: 18, padL: 110 });
    c.restore();
    // 回饋
    A.rr(c, 30, 740, W - 60, 150, 24); c.fillStyle = '#fff4d6'; c.fill();
    c.fillStyle = '#5a3300'; c.font = `700 25px ${FONT}`; wrap(c, feedback(records, story), 60, 785, W - 120, 38, 3);
    // 事件
    c.fillStyle = '#23395b'; c.font = `900 30px ${FONT}`; c.fillText('📍 六個事件的情緒紀錄', 40, 945);
    records.forEach((r, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 30 + col * ((W - 60) / 2 + 0) + (col ? 10 : 0), y = 970 + row * 160, w = (W - 60) / 2 - 10, h = 145;
      A.rr(c, x, y, w, h, 20); c.fillStyle = '#fff'; c.fill();
      c.fillStyle = ZCOL[zone(r.aEmo)]; A.rr(c, x, y, 12, h, 6); c.fill();
      c.fillStyle = '#23395b'; c.font = `900 24px ${FONT}`; c.fillText(`${i + 1}. ${r.title}`, x + 28, y + 38);
      c.font = `700 21px ${FONT}`; c.fillStyle = '#4d6585';
      c.fillText(`心情：${OK.EMOTIONS[r.emotion] ? OK.EMOTIONS[r.emotion].ico : ''}${r.emotion}｜${ZNAME[zone(r.aEmo)]}`, x + 28, y + 72);
      c.fillText(`技能：${r.skill ? OK.SKILLS[r.skill].name : '—'}`, x + 28, y + 102);
      let act = '行動：' + r.action; while (c.measureText(act).width > w - 50) act = act.slice(0, -2) + '…';
      c.fillText(act, x + 28, y + 132);
    });
    // 工具卡
    const ty = 970 + 3 * 160 + 10;
    A.rr(c, 30, ty, W - 60, H - ty - 30, 26); c.fillStyle = '#ecfbf3'; c.fill(); c.setLineDash([12, 8]); c.lineWidth = 4; c.strokeStyle = '#3fbf7f'; c.stroke(); c.setLineDash([]);
    c.fillStyle = '#1f7a4d'; c.font = `900 28px ${FONT}`; c.fillText('🌊 我的復原力工具卡', 60, ty + 45);
    c.fillStyle = '#23395b'; c.font = `700 22px ${FONT}`;
    let yy = ty + 85;
    tools(records).slice(0, 7).forEach(t => { yy = wrap(c, '• ' + t, 60, yy, W - 120, 32, 1); });
    c.font = `500 17px ${FONT}`; c.fillStyle = '#4d6585'; c.textAlign = 'center';
    c.fillText('這條曲線是依照遊戲中的選擇模擬出來的學習紀錄，不是心理測驗，也沒有好壞名次。', W / 2, H - 44);
    return cv.toDataURL('image/png');
  }

  return { show, makeCard, drawChart, feedback, tools };
})();
