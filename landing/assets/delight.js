// The "small moments" demos on the landing page, using the same synthesized
// sounds as Drawer itself (Web Audio, no sound files). Sound starts only after
// the visitor clicks or types, and the Sound switch silences everything.

(() => {
  // ===== Sound engine (the same voices as Drawer's src/sound.js) =====
  let ctx = null;
  let master = null;
  let noise = null;
  let soundOn = true;
  const VOLUME = 0.6;

  function setup() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: 'interactive' });
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 4;
    master = ctx.createGain();
    master.connect(compressor).connect(ctx.destination);
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return ctx;
  }

  const jitter = (a) => 1 + (Math.random() * 2 - 1) * a;

  function burst(t, { type, freq, q = 1, gain, decay }) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = jitter(0.08);
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq * jitter(0.06);
    filter.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.0015);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter).connect(env).connect(master);
    src.start(t);
    src.stop(t + decay + 0.02);
  }

  function body(t, { wave = 'sine', from, to, gain, decay }) {
    const osc = ctx.createOscillator();
    osc.type = wave;
    const f = jitter(0.05);
    osc.frequency.setValueAtTime(from * f, t);
    osc.frequency.exponentialRampToValueAtTime(to * f, t + decay * 0.7);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(gain, t + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(env).connect(master);
    osc.start(t);
    osc.stop(t + decay + 0.02);
  }

  function bell(t, { freq, gain, decay }) {
    [1, 2.76, 5.4].forEach((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq * ratio;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(gain / (i + 1), t + 0.003);
      env.gain.exponentialRampToValueAtTime(0.0001, t + decay / (i + 1));
      osc.connect(env).connect(master);
      osc.start(t);
      osc.stop(t + decay + 0.02);
    });
  }

  const VOICES = {
    thock(t, kind) {
      const big = kind === 'space' || kind === 'enter';
      const low = big ? 0.72 : kind === 'delete' ? 0.9 : 1;
      body(t, { from: 210 * low, to: 95 * low, gain: big ? 0.75 : 0.55, decay: big ? 0.11 : 0.07 });
      burst(t, { type: 'lowpass', freq: 1900 * low, q: 0.8, gain: 0.45, decay: 0.022 });
      if (big) burst(t + 0.012, { type: 'bandpass', freq: 700, q: 2, gain: 0.18, decay: 0.05 });
    },
    clack(t, kind) {
      const big = kind === 'space' || kind === 'enter';
      const low = big ? 0.78 : 1;
      burst(t, { type: 'bandpass', freq: 2300 * low, q: 1.4, gain: 0.55, decay: 0.03 });
      body(t, { wave: 'triangle', from: 420 * low, to: 260 * low, gain: 0.32, decay: 0.045 });
      burst(t + 0.009, { type: 'bandpass', freq: 3600 * low, q: 2.2, gain: 0.3, decay: 0.02 });
      if (big) body(t + 0.004, { from: 150, to: 90, gain: 0.35, decay: 0.08 });
    },
    click(t, kind) {
      const big = kind === 'space' || kind === 'enter';
      burst(t, { type: 'highpass', freq: 3800, q: 0.7, gain: 0.35, decay: 0.012 });
      burst(t, { type: 'bandpass', freq: 5200, q: 5, gain: 0.5, decay: 0.01 });
      burst(t + 0.014, { type: 'bandpass', freq: 4300, q: 4, gain: 0.22, decay: 0.012 });
      body(t + 0.004, { wave: 'triangle', from: big ? 240 : 330, to: big ? 140 : 210, gain: big ? 0.35 : 0.22, decay: big ? 0.07 : 0.04 });
    },
    topre(t, kind) {
      const big = kind === 'space' || kind === 'enter';
      const low = big ? 0.75 : 1;
      body(t, { from: 300 * low, to: 150 * low, gain: big ? 0.6 : 0.45, decay: big ? 0.09 : 0.06 });
      burst(t, { type: 'lowpass', freq: 1100 * low, q: 0.7, gain: 0.35, decay: 0.03 });
      burst(t + 0.006, { type: 'bandpass', freq: 950 * low, q: 3, gain: 0.28, decay: 0.035 });
    },
    typewriter(t, kind) {
      const big = kind === 'space' || kind === 'enter';
      burst(t, { type: 'bandpass', freq: 1500, q: 5, gain: 0.55, decay: 0.035 });
      burst(t, { type: 'highpass', freq: 2600, q: 0.8, gain: 0.32, decay: 0.018 });
      body(t, { from: 140, to: 80, gain: big ? 0.5 : 0.32, decay: big ? 0.12 : 0.07 });
      burst(t + 0.022, { type: 'bandpass', freq: 2400, q: 6, gain: 0.12, decay: 0.03 });
      if (kind === 'enter') {
        bell(t + 0.04, { freq: 2050, gain: 0.22, decay: 0.9 });
        burst(t + 0.09, { type: 'bandpass', freq: 700, q: 1.2, gain: 0.2, decay: 0.22 });
      }
    },
  };

  const EFFECTS = {
    tick(t) {
      burst(t, { type: 'bandpass', freq: 3200, q: 3, gain: 0.32, decay: 0.014 });
      body(t, { from: 1250, to: 880, gain: 0.16, decay: 0.05 });
    },
    close(t) {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, t);
      filter.frequency.exponentialRampToValueAtTime(1100, t + 0.11);
      filter.Q.value = 0.9;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.11, t + 0.08);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      src.connect(filter).connect(env).connect(master);
      src.start(t);
      src.stop(t + 0.16);
      body(t + 0.12, { from: 150, to: 72, gain: 0.55, decay: 0.12 });
      burst(t + 0.12, { type: 'lowpass', freq: 900, q: 0.7, gain: 0.25, decay: 0.03 });
    },
    lock(t) {
      burst(t, { type: 'bandpass', freq: 4200, q: 4, gain: 0.3, decay: 0.012 });
      body(t, { from: 2100, to: 1500, gain: 0.08, decay: 0.03 });
      burst(t + 0.07, { type: 'bandpass', freq: 1800, q: 2.5, gain: 0.32, decay: 0.02 });
      body(t + 0.07, { from: 420, to: 190, gain: 0.32, decay: 0.07 });
    },
    unlock(t) {
      burst(t, { type: 'bandpass', freq: 1500, q: 2, gain: 0.2, decay: 0.018 });
      body(t, { from: 240, to: 330, gain: 0.16, decay: 0.05 });
      burst(t + 0.08, { type: 'bandpass', freq: 3600, q: 4, gain: 0.24, decay: 0.012 });
      body(t + 0.08, { from: 1300, to: 1900, gain: 0.07, decay: 0.035 });
    },
  };

  function ready() {
    if (!soundOn || !setup()) return false;
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  function playKey(profile, kind) {
    if (!ready()) return;
    master.gain.value = VOLUME * 0.9 * jitter(0.12);
    VOICES[profile](ctx.currentTime + 0.002, kind);
  }
  function playEffect(name) {
    if (!ready()) return;
    master.gain.value = VOLUME * 0.9;
    EFFECTS[name](ctx.currentTime + 0.002);
  }

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ===== Sound switch =====
  const toggle = $('#soundToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      soundOn = !soundOn;
      toggle.setAttribute('aria-pressed', String(soundOn));
      toggle.classList.toggle('is-off', !soundOn);
      $('.st-label', toggle).textContent = soundOn ? 'Sound on' : 'Sound off';
      if (soundOn) playEffect('tick');
    });
  }

  // ===== 1. Keyboard sounds =====
  let profile = 'thock';
  const chips = $$('.kb-chip');
  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      profile = chip.dataset.profile;
      chips.forEach((c) => c.setAttribute('aria-checked', String(c === chip)));
      // A short phrase, so each sound can be heard before typing.
      const kinds = ['key', 'key', 'key', 'space', 'key', 'key', 'enter'];
      const gaps = [0, 95, 85, 110, 120, 85, 130];
      let at = 0;
      kinds.forEach((k, i) => {
        at += gaps[i];
        setTimeout(() => {
          playKey(profile, k);
          pressCap(k);
        }, at);
      });
    }),
  );

  const caps = { key: $('#capKey'), space: $('#capSpace'), enter: $('#capEnter'), delete: $('#capKey') };
  function pressCap(kind, label) {
    const cap = caps[kind];
    if (!cap) return;
    if (kind === 'key' && label) cap.textContent = label.length === 1 ? label.toUpperCase() : label;
    cap.classList.remove('down');
    void cap.offsetWidth;
    cap.classList.add('down');
  }

  const field = $('#kbField');
  let lastKeydown = 0;
  if (field) {
    field.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.isComposing) return;
      const kind = e.key === ' ' ? 'space' : e.key === 'Enter' ? 'enter' : e.key === 'Backspace' || e.key === 'Delete' ? 'delete' : e.key.length === 1 ? 'key' : null;
      if (!kind) return;
      lastKeydown = performance.now();
      playKey(profile, kind);
      pressCap(kind, kind === 'delete' ? '⌫' : e.key);
    });
    // Phone keyboards don't always report keys, so typing itself makes the sound.
    field.addEventListener('input', (e) => {
      if (performance.now() - lastKeydown < 60) return;
      const kind = e.inputType === 'insertLineBreak' ? 'enter' : e.inputType?.startsWith('delete') ? 'delete' : e.data === ' ' ? 'space' : 'key';
      playKey(profile, kind);
      pressCap(kind, e.data?.slice(-1));
    });
  }

  // ===== 2. Lock and unlock =====
  const stage = $('#lockStage');
  const lockBtn = $('#lockBtn');
  let locked = false;
  let lockTimer = null;
  if (stage && lockBtn) {
    lockBtn.addEventListener('click', () => {
      locked = !locked;
      const kind = locked ? 'lock' : 'unlock';
      stage.classList.remove('is-lock', 'is-unlock', 'playing');
      void stage.offsetWidth;
      stage.classList.add(`is-${kind}`, 'playing');
      stage.classList.toggle('is-locked', locked);
      $('.lm-label', stage).textContent = locked ? 'Locked' : 'Unlocked';
      lockBtn.querySelector('span').textContent = locked ? 'Unlock note' : 'Lock note';
      lockBtn.setAttribute('aria-pressed', String(locked));
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => playEffect(kind), reduced() ? 0 : 520);
    });
  }

  // ===== 3. Ticking a to do =====
  $$('.todo-item').forEach((item) => {
    item.addEventListener('click', () => {
      const done = item.getAttribute('aria-checked') !== 'true';
      item.setAttribute('aria-checked', String(done));
      if (!done) return;
      playEffect('tick');
      if (reduced()) return;
      const box = $('.todo-box', item).getBoundingClientRect();
      const ring = document.createElement('span');
      ring.className = 'tick-burst';
      ring.style.left = `${box.left + box.width / 2}px`;
      ring.style.top = `${box.top + box.height / 2}px`;
      document.body.appendChild(ring);
      ring.addEventListener('animationend', () => ring.remove());
    });
  });
  const resetTodos = $('#todoReset');
  if (resetTodos) resetTodos.addEventListener('click', () => $$('.todo-item').forEach((i) => i.setAttribute('aria-checked', 'false')));

  // ===== 4. Closing a note =====
  const scene = $('#closeScene');
  const closeBtn = $('#closeBtn');
  if (scene && closeBtn) {
    closeBtn.addEventListener('click', () => {
      const closing = !scene.classList.contains('is-closed');
      scene.classList.toggle('is-closed', closing);
      closeBtn.querySelector('span').textContent = closing ? 'Open it again' : 'Close the note';
      if (closing) setTimeout(() => playEffect('close'), reduced() ? 0 : 160);
    });
  }
})();
