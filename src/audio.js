/** Tiny muteable WebAudio beeps. */

let ctx = null;
let muted = false;

function ensureCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, dur, type = "square", gain = 0.05, when = 0) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

export function sfxJump() {
  tone(320, 0.08, "square", 0.04);
  tone(480, 0.06, "square", 0.03, 0.04);
}

export function sfxDoubleJump() {
  tone(520, 0.07, "triangle", 0.04);
  tone(700, 0.08, "triangle", 0.03, 0.05);
}

export function sfxLand() {
  tone(120, 0.05, "triangle", 0.03);
}

export function sfxCollect() {
  tone(660, 0.06, "sine", 0.05);
  tone(880, 0.08, "sine", 0.04, 0.05);
}

export function sfxStomp() {
  tone(180, 0.06, "square", 0.05);
  tone(90, 0.1, "square", 0.04, 0.04);
}

export function sfxHurt() {
  tone(200, 0.1, "sawtooth", 0.04);
  tone(100, 0.15, "sawtooth", 0.03, 0.08);
}

export function sfxGoal() {
  tone(440, 0.1, "sine", 0.05);
  tone(550, 0.1, "sine", 0.05, 0.1);
  tone(660, 0.14, "sine", 0.05, 0.2);
}

export function sfxWin() {
  tone(523, 0.12, "sine", 0.05);
  tone(659, 0.12, "sine", 0.05, 0.12);
  tone(784, 0.18, "sine", 0.05, 0.24);
}

export function sfxUi() {
  tone(400, 0.05, "square", 0.03);
}
