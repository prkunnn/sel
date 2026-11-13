/* =========================================================
   audio.js — 以 Web Audio API 即時產生的原創音樂與音效
   （不需要任何音檔，也沒有授權問題）
   ========================================================= */
window.OK = window.OK || {};

OK.Audio = (function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let enabled = true;
  let musicTimer = null, musicMode = null, step = 0, nextTime = 0;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = enabled ? 0.8 : 0; master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
    } catch (e) { ctx = null; }
  }

  function setEnabled(on) {
    enabled = on;
    if (master && ctx) master.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.05);
  }

  function tone(freq, t0, dur, opts = {}) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
    const v = opts.vol == null ? 0.3 : opts.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (opts.attack || 0.015));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(opts.dest || sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(t0, dur, opts = {}) {
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.setValueAtTime(opts.from || 400, t0);
    f.frequency.exponentialRampToValueAtTime(opts.to || 1400, t0 + dur * 0.5);
    f.frequency.exponentialRampToValueAtTime(opts.from || 400, t0 + dur);
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.vol || 0.18, t0 + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0); src.stop(t0 + dur);
  }

  const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

  const sfx = {
    click() { if (!ctx) return; const t = ctx.currentTime; tone(880, t, 0.08, { type: 'triangle', vol: 0.22 }); tone(1320, t + 0.03, 0.07, { type: 'sine', vol: 0.12 }); },
    select() { if (!ctx) return; const t = ctx.currentTime; tone(N(76), t, 0.1, { type: 'triangle', vol: 0.2 }); tone(N(83), t + 0.06, 0.14, { type: 'triangle', vol: 0.18 }); },
    wave() { if (!ctx) return; noise(ctx.currentTime, 1.1, { from: 300, to: 1200, vol: 0.16 }); },
    jump() { if (!ctx) return; tone(420, ctx.currentTime, 0.18, { type: 'sine', slide: 820, vol: 0.18 }); },
    spark() { if (!ctx) return; const t = ctx.currentTime; tone(N(88), t, 0.12, { type: 'sine', vol: 0.14 }); tone(N(95), t + 0.05, 0.16, { type: 'sine', vol: 0.1 }); },
    turn(up) { // 情緒轉折提示音
      if (!ctx) return; const t = ctx.currentTime;
      const seq = up ? [67, 71, 74] : up === false ? [74, 70, 67] : [69, 72, 76];
      seq.forEach((n, i) => tone(N(n), t + i * 0.11, 0.3, { type: 'triangle', vol: 0.18 }));
    },
    beat(good) { if (!ctx) return; const t = ctx.currentTime; tone(good ? N(84) : N(72), t, 0.12, { type: 'square', vol: 0.06 }); tone(good ? N(91) : N(76), t + 0.04, 0.12, { type: 'triangle', vol: 0.12 }); },
    breathIn() { if (!ctx) return; tone(N(60), ctx.currentTime, 3.2, { type: 'sine', slide: N(67), vol: 0.07, attack: 1.2 }); },
    breathOut() { if (!ctx) return; tone(N(67), ctx.currentTime, 3.6, { type: 'sine', slide: N(60), vol: 0.06, attack: 0.4 }); },
    skill() { // 調節技能完成
      if (!ctx) return; const t = ctx.currentTime;
      [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.09, 0.5, { type: 'triangle', vol: 0.16 }));
      tone(N(96), t + 0.4, 0.6, { type: 'sine', vol: 0.08 });
    },
    soft() { if (!ctx) return; tone(N(64), ctx.currentTime, 0.25, { type: 'sine', vol: 0.12 }); },
    ending() { // 結局溫暖音效
      if (!ctx) return; const t = ctx.currentTime;
      [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79]].forEach((ch, i) =>
        ch.forEach(n => tone(N(n), t + i * 0.45, 1.4, { type: 'triangle', vol: 0.09, attack: 0.08 })));
      tone(N(84), t + 1.4, 1.6, { type: 'sine', vol: 0.08 });
    }
  };

  /* ---- 背景音樂：簡單的五聲音階循環 ---- */
  const SONGS = {
    title: { bpm: 112, mel: [72, 76, 79, 76, 74, 76, 72, -1, 69, 72, 74, 72, 76, 74, 72, -1], bass: [48, 48, 53, 53, 55, 55, 48, 48] },
    surf: { bpm: 96, mel: [67, -1, 72, 74, 76, -1, 74, 72, 69, -1, 72, -1, 74, 72, 67, -1], bass: [45, 45, 48, 48, 50, 50, 43, 43] },
    calm: { bpm: 70, mel: [72, -1, -1, 76, -1, -1, 79, -1, 77, -1, -1, 76, -1, -1, 72, -1], bass: [48, 48, 45, 45, 41, 41, 43, 43] }
  };

  function schedule() {
    if (!ctx || !musicMode) return;
    const song = SONGS[musicMode];
    const spb = 60 / song.bpm / 2; // 八分音符
    while (nextTime < ctx.currentTime + 0.25) {
      const m = song.mel[step % song.mel.length];
      if (m > 0) tone(N(m), nextTime, spb * 1.8, { type: 'triangle', vol: 0.22, dest: musicGain });
      if (step % 2 === 0) {
        const b = song.bass[(step / 2) % song.bass.length];
        tone(N(b), nextTime, spb * 1.9, { type: 'sine', vol: 0.3, dest: musicGain });
      }
      if (step % 4 === 2) tone(N(m > 0 ? m + 12 : 84), nextTime, 0.05, { type: 'sine', vol: 0.05, dest: musicGain });
      step++; nextTime += spb;
    }
  }

  function music(mode) {
    if (musicMode === mode) return;
    musicMode = mode;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (!mode || !ctx) return;
    step = 0; nextTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(schedule, 90);
  }

  return {
    init, setEnabled, music,
    get enabled() { return enabled; },
    play(name, arg) { if (!enabled) return; init(); if (sfx[name]) try { sfx[name](arg); } catch (e) { } },
    ensureMusic() { const m = musicMode; musicMode = null; music(m); }
  };
})();
