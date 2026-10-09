// Web Audio API Sound Generator & Audio Utilities for FoodyPay POS & Kitchen Display
let audioCtx = null;
let isAudioUnlocked = false;
let lastSoundTime = 0;
const SOUND_COOLDOWN_MS = 1500; // 1.5s lock to prevent rapid overlapping bell sounds

// ----------------------------------------------------------------------------
// Uniform Order Timestamp & Sorting Utility (Newest Order ALWAYS First)
// ----------------------------------------------------------------------------
export function getOrderTimestamp(o) {
  if (!o) return 0;
  if (o.createdAt) {
    const t = new Date(o.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (o.timestamp) {
    const t = new Date(o.timestamp).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (o.date) {
    const t = new Date(o.date).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (o.time) {
    const t = new Date(o.time).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  // Extract timestamp from MongoDB ObjectId (first 4 bytes = Unix timestamp)
  if (o._id && typeof o._id === 'string' && o._id.length === 24) {
    try {
      const hex = o._id.substring(0, 8);
      const ts = parseInt(hex, 16) * 1000;
      if (!isNaN(ts) && ts > 0) return ts;
    } catch (e) {}
  }
  if (typeof o.id === 'number') return o.id;
  return 0;
}

export function sortOrdersNewestFirst(orderList) {
  if (!Array.isArray(orderList)) return [];
  return [...orderList].sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
}

// ----------------------------------------------------------------------------
// Audio Context Manager with Auto-Unlock on User Interaction
// ----------------------------------------------------------------------------
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      isAudioUnlocked = true;
    }).catch(() => {});
  } else if (audioCtx && audioCtx.state === 'running') {
    isAudioUnlocked = true;
  }
  return audioCtx;
}

// Global window event listener to unlock Web Audio API on first user gesture
if (typeof window !== 'undefined') {
  const unlockAudioOnGesture = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        isAudioUnlocked = true;
      }).catch(() => {});
    }
  };

  ['click', 'touchstart', 'pointerdown', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, unlockAudioOnGesture, { passive: true, once: false });
  });
}

// ----------------------------------------------------------------------------
// HTML5 Audio Fail-safe Sound Fallback (Data URI WAV Chime)
// ----------------------------------------------------------------------------
let cachedWavUrl = null;

function getWavChimeUrl() {
  if (cachedWavUrl) return cachedWavUrl;
  try {
    const sampleRate = 8000;
    const duration = 0.4;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new Uint8Array(44 + numSamples);

    // RIFF header
    buffer.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
    const fileSize = 36 + numSamples;
    buffer[4] = fileSize & 0xff;
    buffer[5] = (fileSize >> 8) & 0xff;
    buffer[6] = (fileSize >> 16) & 0xff;
    buffer[7] = (fileSize >> 24) & 0xff;
    buffer.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"
    buffer.set([0x66, 0x6d, 0x74, 0x20, 16, 0, 0, 0, 1, 0, 1, 0], 12); // fmt header, PCM, 1 channel
    buffer[24] = sampleRate & 0xff;
    buffer[25] = (sampleRate >> 8) & 0xff;
    buffer[26] = (sampleRate >> 16) & 0xff;
    buffer[27] = (sampleRate >> 24) & 0xff;
    buffer[28] = sampleRate & 0xff;
    buffer[29] = (sampleRate >> 8) & 0xff;
    buffer[30] = (sampleRate >> 16) & 0xff;
    buffer[31] = (sampleRate >> 24) & 0xff;
    buffer[32] = 1;
    buffer[33] = 0;
    buffer[34] = 8; // 8 bits per sample
    buffer[35] = 0;
    buffer.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
    buffer[40] = numSamples & 0xff;
    buffer[41] = (numSamples >> 8) & 0xff;
    buffer[42] = (numSamples >> 16) & 0xff;
    buffer[43] = (numSamples >> 24) & 0xff;

    // Smooth pleasant chime: 1046.5Hz (C6) -> 1318.5Hz (E6)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = t < 0.15 ? 1046.5 : 1318.5;
      const env = Math.max(0, 1 - (t / duration));
      const val = Math.sin(2 * Math.PI * freq * t) * env;
      buffer[44 + i] = Math.floor(128 + val * 100);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    cachedWavUrl = URL.createObjectURL(blob);
    return cachedWavUrl;
  } catch (e) {
    return null;
  }
}

function playFallbackOrderChime() {
  try {
    const url = getWavChimeUrl();
    if (url) {
      const audio = new Audio(url);
      audio.volume = 0.6;
      const playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(() => {});
      }
    }
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// 1. Order Placed Sound (Single Clean, Crisp Front Desk Bell Chime!)
// ----------------------------------------------------------------------------
export function playOrderPlaced(force = false) {
  const nowMs = Date.now();
  if (!force && nowMs - lastSoundTime < SOUND_COOLDOWN_MS) {
    return; // Block rapid overlapping bell triggers!
  }
  lastSoundTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') {
    playFallbackOrderChime();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return;
  }

  try {
    const now = ctx.currentTime;

    // Single Clean Bell Strike: E6 (1318.5 Hz) -> G6 (1568 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now); // E6
    osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.1); // G6
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.65);
  } catch (err) {
    playFallbackOrderChime();
  }
}

// ----------------------------------------------------------------------------
// 2. Call Waiter Sound (Authentic front desk / restaurant call bell "Ding-Dong")
// ----------------------------------------------------------------------------
export function playCallWaiter(force = false) {
  const nowMs = Date.now();
  if (!force && nowMs - lastSoundTime < SOUND_COOLDOWN_MS) {
    return;
  }
  lastSoundTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'suspended') {
    playFallbackOrderChime();
    return;
  }

  try {
    const now = ctx.currentTime;

    // First Bell Ding
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    gain1.gain.setValueAtTime(0.45, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second Bell Dong
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
    gain2.gain.setValueAtTime(0.4, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// 3. Food Preparing Sound (Gentle kitchen sizzle + progression note)
// ----------------------------------------------------------------------------
export function playFoodPreparing() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392.00, now); // G4
    osc.frequency.linearRampToValueAtTime(440.00, now + 0.2); // A4
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// 4. Food Ready Sound (Bright metallic kitchen order bell "DING!")
// ----------------------------------------------------------------------------
export function playFoodReady() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const fundamental = 1200;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fundamental, now);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// 5. Bill Created & Tear Sound
// ----------------------------------------------------------------------------
export function playBillCreatedAndTear() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    [0, 0.05, 0.1].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, now + t);
      gain.gain.setValueAtTime(0.08, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.02);
    });
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// 6. User Paid Bill Sound ("Ka-ching!" cash register + triumphant chime)
// ----------------------------------------------------------------------------
export function playBillPaid() {
  playOrderPlaced(true);
}

// ----------------------------------------------------------------------------
// 7. Milestone Celebration Fanfare
// ----------------------------------------------------------------------------
export function playMilestoneCelebration() {
  playOrderPlaced(true);
}

// ----------------------------------------------------------------------------
// 8. Continuous Alarm Bell Loop (Rings calmly until order is SEEN on POS Dashboard)
// ----------------------------------------------------------------------------
let alarmTimer = null;

export function startContinuousAlarm() {
  if (alarmTimer) return;
  const triggerAlarm = () => {
    try {
      getAudioContext();
      playCallWaiter();
    } catch (e) {}
  };
  triggerAlarm();
  alarmTimer = setInterval(triggerAlarm, 3500); // 3.5s calm interval (no rapid noise)
}

export function stopContinuousAlarm() {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
}

// ----------------------------------------------------------------------------
// 9. Kitchen Display System (KDS) Continuous Bell Alarm
// ----------------------------------------------------------------------------
let kitchenAlarmTimer = null;

export function startKitchenAlarm() {
  if (kitchenAlarmTimer) return;
  const triggerKitchen = () => {
    try {
      getAudioContext();
      playOrderPlaced(true);
    } catch (e) {}
  };
  triggerKitchen();
  kitchenAlarmTimer = setInterval(triggerKitchen, 3500);
}

export function stopKitchenAlarm() {
  if (kitchenAlarmTimer) {
    clearInterval(kitchenAlarmTimer);
    kitchenAlarmTimer = null;
  }
}

// ----------------------------------------------------------------------------
// 10. Manual Sound Tester
// ----------------------------------------------------------------------------
export function testSoundNotification() {
  getAudioContext();
  playOrderPlaced(true);
  return true;
}
