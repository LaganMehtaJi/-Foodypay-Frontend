// Web Audio API Sound Generator for Restaurant POS & Live Demo
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Order Placed Sound (Friendly chime + gentle receipt swoosh)
export function playOrderPlaced() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Tone 1
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(523.25, now); // C5
  osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
  gain1.gain.setValueAtTime(0.18, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Tone 2
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(783.99, now + 0.08); // G5
  gain2.gain.setValueAtTime(0.15, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.4);
}

// 2. Call Waiter Sound (Authentic front desk / restaurant call bell "Ding-Dong")
export function playCallWaiter() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // First Bell Ding (high brass bell)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, now); // B5
  gain1.gain.setValueAtTime(0.25, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.6);

  // Second Bell Dong (lower resonant ring)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(783.99, now + 0.22); // G5
  gain2.gain.setValueAtTime(0.22, now + 0.22);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.22);
  osc2.stop(now + 0.95);
}

// 3. Food Preparing Sound (Gentle kitchen sizzle + progression note)
export function playFoodPreparing() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Kitchen warm note
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(392.00, now); // G4
  osc.frequency.linearRampToValueAtTime(440.00, now + 0.25); // A4
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.45);

  // Sizzle noise burst
  try {
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.08;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2500, now);
    filter.Q.setValueAtTime(1.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
  } catch (e) {
    // Fallback if buffer generation fails
  }
}

// 4. Food Ready Sound (Bright metallic kitchen order bell "DING!")
export function playFoodReady() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // High metallic bell strike
  const fundamental = 1200;
  const harmonics = [1, 2.76, 5.4];
  const gains = [0.25, 0.12, 0.05];

  harmonics.forEach((h, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(fundamental * h, now);
    gain.gain.setValueAtTime(gains[idx], now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (idx === 0 ? 1.1 : 0.4));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.1);
  });
}

// 5. Bill Created & Tear Sound (Printer paper clicks + tearing rip)
export function playBillCreatedAndTear() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Mechanical feed clicks
  [0, 0.05, 0.1, 0.15].forEach((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800, now + t);
    gain.gain.setValueAtTime(0.05, now + t);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + 0.03);
  });

  // Paper tear sound
  try {
    const duration = 0.35;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.55);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now + 0.2);
  } catch (e) {}
}

// 6. User Paid Bill Sound ("Ka-ching!" cash register + triumphant chime)
export function playBillPaid() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Ka-ching register bell 1
  const bell1 = ctx.createOscillator();
  const bGain1 = ctx.createGain();
  bell1.type = 'sine';
  bell1.frequency.setValueAtTime(1760, now); // A6
  bGain1.gain.setValueAtTime(0.2, now);
  bGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  bell1.connect(bGain1);
  bGain1.connect(ctx.destination);
  bell1.start(now);
  bell1.stop(now + 0.45);

  // Ka-ching register bell 2 (higher double-tap)
  const bell2 = ctx.createOscillator();
  const bGain2 = ctx.createGain();
  bell2.type = 'sine';
  bell2.frequency.setValueAtTime(2637, now + 0.08); // E7
  bGain2.gain.setValueAtTime(0.22, now + 0.08);
  bGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  bell2.connect(bGain2);
  bGain2.connect(ctx.destination);
  bell2.start(now + 0.08);
  bell2.stop(now + 0.65);

  // Upward celebration chime: C5 -> E5 -> G5 -> C6
  const arpeggio = [523.25, 659.25, 783.99, 1046.50];
  arpeggio.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + 0.15 + idx * 0.07);
    gain.gain.setValueAtTime(0.12, now + 0.15 + idx * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + 0.15 + idx * 0.07);
    osc.stop(now + 0.45 + idx * 0.07);
  });
}

// 7. Milestone 1,000 Orders Celebration Fanfare & Chime
export function playMilestoneCelebration() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Brass/chime fanfare: C5 -> G5 -> C6 -> E6
  const fanfareNotes = [
    { freq: 523.25, time: 0.0, dur: 0.25 }, // C5
    { freq: 659.25, time: 0.12, dur: 0.25 }, // E5
    { freq: 783.99, time: 0.24, dur: 0.3 },  // G5
    { freq: 1046.50, time: 0.38, dur: 0.65 }, // C6 (long triumphant note)
    { freq: 1318.51, time: 0.42, dur: 0.65 }  // E6 harmony
  ];

  fanfareNotes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, now + n.time);

    gain.gain.setValueAtTime(0.18, now + n.time);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + n.time);
    osc.stop(now + n.time + n.dur);
  });
}

