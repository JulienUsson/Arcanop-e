const KEY = 'arcanopee.sound';

export type Sound =
  | 'tap'
  | 'card'
  | 'hit'
  | 'heal'
  | 'miss'
  | 'kill'
  | 'power'
  | 'nemesis'
  | 'victory'
  | 'defeat'
  | 'send'
  | 'ready'
  | 'whoosh'
  | 'banner'
  | 'combo'
  | 'stamp'
  | 'hurt';

let ctx: AudioContext | null = null;

export function soundEnabled(): boolean {
  return localStorage.getItem(KEY) !== '0';
}

export function setSoundEnabled(on: boolean) {
  localStorage.setItem(KEY, on ? '1' : '0');
}

function audio(): AudioContext | null {
  if (!soundEnabled()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, gain: number, slideTo?: number) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + start + duration);
  amp.gain.setValueAtTime(0.0001, ac.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

function noise(ac: AudioContext, start: number, duration: number, gain: number, from: number, to: number) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(from, ac.currentTime + start);
  filter.frequency.exponentialRampToValueAtTime(to, ac.currentTime + start + duration);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, ac.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(ac.currentTime + start);
}

export function play(sound: Sound, step = 0) {
  const ac = audio();
  if (!ac) return;
  switch (sound) {
    case 'tap':
      tone(ac, 660, 0, 0.06, 'triangle', 0.08);
      break;
    case 'send':
      tone(ac, 520, 0, 0.1, 'triangle', 0.1);
      tone(ac, 780, 0.08, 0.16, 'triangle', 0.1);
      break;
    case 'card':
      noise(ac, 0, 0.25, 0.12, 600, 3000);
      break;
    case 'hit':
      noise(ac, 0, 0.12, 0.2, 2500, 400);
      tone(ac, 140, 0.03, 0.18, 'sine', 0.25, 60);
      break;
    case 'heal':
      tone(ac, 660, 0, 0.18, 'sine', 0.1);
      tone(ac, 990, 0.08, 0.25, 'sine', 0.08);
      break;
    case 'miss':
      noise(ac, 0, 0.2, 0.06, 1500, 300);
      break;
    case 'kill':
      tone(ac, 220, 0, 0.3, 'sawtooth', 0.08, 70);
      noise(ac, 0, 0.3, 0.15, 800, 120);
      break;
    case 'power':
      [523, 659, 784, 1046].forEach((f, i) => tone(ac, f, i * 0.07, 0.3, 'triangle', 0.09));
      break;
    case 'nemesis':
      tone(ac, 110, 0, 0.7, 'sawtooth', 0.09, 70);
      tone(ac, 116, 0, 0.7, 'sawtooth', 0.07, 72);
      break;
    case 'victory':
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(ac, f, i * 0.12, 0.5, 'triangle', 0.1));
      break;
    case 'defeat':
      [392, 330, 262, 196].forEach((f, i) => tone(ac, f, i * 0.2, 0.6, 'sine', 0.1));
      break;
    case 'ready':
      tone(ac, 880, 0, 0.12, 'sine', 0.08);
      tone(ac, 1320, 0.07, 0.25, 'sine', 0.07);
      tone(ac, 1760, 0.14, 0.35, 'sine', 0.05);
      break;
    case 'whoosh':
      noise(ac, 0, 0.22, 0.09, 600, 4000);
      break;
    case 'banner':
      noise(ac, 0, 0.35, 0.08, 300, 2500);
      tone(ac, 196, 0.12, 0.6, 'triangle', 0.1);
      tone(ac, 294, 0.12, 0.6, 'triangle', 0.06);
      break;
    case 'combo':
      tone(ac, 440 * Math.pow(2, Math.min(step, 12) / 12), 0, 0.14, 'square', 0.04);
      break;
    case 'stamp':
      noise(ac, 0, 0.12, 0.25, 1200, 200);
      tone(ac, 90, 0, 0.25, 'sine', 0.3, 50);
      break;
    case 'hurt':
      tone(ac, 260, 0, 0.18, 'sawtooth', 0.05, 160);
      break;
  }
}
