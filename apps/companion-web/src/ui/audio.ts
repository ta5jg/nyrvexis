let ctx: AudioContext | null = null;

const STORAGE_KEY = "kindrail_sfx_muted";

export function getSfxMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (muted) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* quota / private mode */
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

type SfxKey = "hit" | "crit" | "ability" | "death" | "win" | "loss";

const SFX_FILES: Record<SfxKey, string> = {
  hit: "kr_hit.wav",
  crit: "kr_crit.wav",
  ability: "kr_ability.wav",
  death: "kr_death.wav",
  win: "kr_win.wav",
  loss: "kr_loss.wav"
};

/** Output gain per decoded buffer (keeps peaks comfortable vs oscillator fallback). */
const SFX_GAIN: Record<SfxKey, number> = {
  hit: 0.38,
  crit: 0.42,
  ability: 0.36,
  death: 0.44,
  win: 0.4,
  loss: 0.42
};

const buffers: Partial<Record<SfxKey, AudioBuffer>> = {};
let decodePromise: Promise<void> | null = null;

function sfxUrl(file: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}audio/${file}`;
}

/** Decode bundled WAVs once (falls back to oscillators until ready or on failure). */
export function preloadSfxSamples(): Promise<void> {
  const c = getCtx();
  if (!c) return Promise.resolve();
  if (!decodePromise) {
    decodePromise = (async () => {
      const keys = Object.keys(SFX_FILES) as SfxKey[];
      await Promise.all(
        keys.map(async (key) => {
          try {
            const res = await fetch(sfxUrl(SFX_FILES[key]));
            if (!res.ok) return;
            const raw = await res.arrayBuffer();
            buffers[key] = await c.decodeAudioData(raw.slice(0));
          } catch {
            /* missing file / decode error → oscillator path */
          }
        })
      );
    })();
  }
  return decodePromise;
}

/** Resume audio after a user gesture (Safari); kicks off WAV decode in parallel. */
export function primeAudio(): void {
  const c = getCtx();
  if (!c) return;
  void preloadSfxSamples();
  void c.resume().catch(() => {});
}

function tryPlayBuffer(key: SfxKey): boolean {
  const c = getCtx();
  if (!c || c.state !== "running") return false;
  const buf = buffers[key];
  if (!buf) return false;

  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buf;
  g.gain.value = SFX_GAIN[key];
  src.connect(g);
  g.connect(c.destination);
  src.start(c.currentTime);
  return true;
}

function beep(freq: number, durMs: number, gain = 0.06) {
  if (getSfxMuted()) return;
  const c = getCtx();
  if (!c || c.state !== "running") return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  const t0 = c.currentTime;
  o.start(t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  o.stop(t0 + durMs / 1000 + 0.02);
}

export function sfxHit() {
  if (getSfxMuted()) return;
  if (tryPlayBuffer("hit")) return;
  beep(392, 38, 0.048);
}

export function sfxCrit() {
  if (getSfxMuted()) return;
  if (tryPlayBuffer("crit")) return;
  beep(880, 32, 0.062);
  window.setTimeout(() => beep(1216, 26, 0.042), 20);
}

/** Short magic chord on ability events (presentation-only). */
export function sfxAbility() {
  if (getSfxMuted()) return;
  if (tryPlayBuffer("ability")) return;

  const c = getCtx();
  if (!c || c.state !== "running") return;
  const freqs = [392, 523.25, 659.25];
  freqs.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(c.destination);
    const t0 = c.currentTime + i * 0.038;
    o.start(t0);
    g.gain.exponentialRampToValueAtTime(0.038, t0 + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
    o.stop(t0 + 0.14);
  });
}

export function sfxDeath() {
  if (getSfxMuted()) return;
  if (tryPlayBuffer("death")) return;
  beep(165, 140, 0.068);
}

/** Match end — player side A lost. */
export function sfxLoss() {
  if (getSfxMuted()) return;
  if (tryPlayBuffer("loss")) return;

  const c = getCtx();
  if (!c || c.state !== "running") return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  const t0 = c.currentTime;
  o.frequency.setValueAtTime(220, t0);
  o.frequency.exponentialRampToValueAtTime(92, t0 + 0.3);
  g.gain.value = 0.055;
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.34);
  o.stop(t0 + 0.38);
}

export function sfxWin() {
  if (getSfxMuted()) return;
  if (tryPlayBuffer("win")) return;
  beep(523, 65, 0.048);
  window.setTimeout(() => beep(784, 85, 0.048), 72);
}

if (typeof window !== "undefined") {
  queueMicrotask(() => {
    void preloadSfxSamples();
  });
}
