/**
 * Tiny Web Audio cue generator. We avoid bundling audio files for a few short
 * UI cues. The toggle on Settings → Preferințe writes to localStorage; this
 * module reads that flag before each cue.
 */

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function soundsEnabled(): boolean {
  try {
    const raw = localStorage.getItem('faro-preferences');
    if (!raw) return true; // default on
    const parsed = JSON.parse(raw);
    return parsed?.sounds !== false;
  } catch {
    return true;
  }
}

/** Plays a short beep tone using a single oscillator with a small envelope. */
function beep(freq: number, durationMs = 90, volume = 0.06) {
  if (!soundsEnabled()) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ac.destination);
    const now = ac.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  } catch {
    // ignore — audio context might be in a bad state
  }
}

export const sounds = {
  /** Generic affirmative cue — used after a successful save. */
  success() {
    beep(880, 70);
    setTimeout(() => beep(1320, 110), 70);
  },
  /** Slightly darker tone for warnings (e.g. budget exceeded). */
  warn() {
    beep(420, 160, 0.08);
  },
  /** Error / refusal — descending pair. */
  error() {
    beep(360, 90, 0.07);
    setTimeout(() => beep(220, 130, 0.07), 80);
  },
  /** Subtle click for toggles, navigation. */
  click() {
    beep(1100, 30, 0.04);
  },
};
