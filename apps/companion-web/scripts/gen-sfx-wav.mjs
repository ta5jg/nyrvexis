/**
 * Generates tiny PCM WAV assets for companion-web SFX (run: pnpm gen:sfx).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SR = 22050;
const outDir = path.join(__dirname, "../public/audio");

function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function envLinear(n, i, attack, release) {
  const ra = Math.min(attack, n - 1);
  const rr = Math.min(release, n - 1);
  if (i < ra && ra > 0) return i / ra;
  if (i > n - rr && rr > 0) return (n - i) / rr;
  return 1;
}

function writeWav(filename, samples) {
  const dataLen = samples.length * 2;
  const buf = Buffer.alloc(44 + dataLen);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataLen, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataLen, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(samples[i], 44 + i * 2);
  }
  fs.writeFileSync(path.join(outDir, filename), buf);
}

function sine(freq, durationSec, amp = 0.38) {
  const n = Math.max(1, Math.floor(SR * durationSec));
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = envLinear(n, i, Math.floor(n * 0.08), Math.floor(n * 0.35));
    samples[i] = Math.round(Math.sin(2 * Math.PI * freq * t) * 0x7fff * amp * e);
  }
  return samples;
}

function silence(sec) {
  return new Int16Array(Math.max(0, Math.floor(SR * sec)));
}

function concat(...parts) {
  const len = parts.reduce((a, b) => a + b.length, 0);
  const out = new Int16Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function freqSweep(f0, f1, durationSec, amp = 0.42) {
  const n = Math.max(2, Math.floor(SR * durationSec));
  const samples = new Int16Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const f = f0 * Math.pow(f1 / f0, i / (n - 1));
    phase += (2 * Math.PI * f) / SR;
    const e = envLinear(n, i, Math.floor(n * 0.05), Math.floor(n * 0.28));
    samples[i] = Math.round(Math.sin(phase) * 0x7fff * amp * e);
  }
  return samples;
}

function chordArpeggio(freqs, durationSec) {
  const n = Math.floor(SR * durationSec);
  const mix = new Float64Array(n);
  const step = Math.floor(SR * 0.036);
  freqs.forEach((f, k) => {
    const delay = k * step;
    for (let i = delay; i < n; i++) {
      const t = i / SR;
      const e = envLinear(n, i, 180, 900);
      mix[i] += Math.sin(2 * Math.PI * f * t) * 0.22 * e;
    }
  });
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    samples[i] = Math.round(clamp(mix[i], -1, 1) * 0x7fff * 0.62);
  }
  return samples;
}

fs.mkdirSync(outDir, { recursive: true });

writeWav("kr_hit.wav", sine(480, 0.042, 0.44));
writeWav(
  "kr_crit.wav",
  concat(sine(900, 0.026, 0.48), silence(0.01), sine(1210, 0.03, 0.46))
);
writeWav("kr_ability.wav", chordArpeggio([392, 523.25, 659.25], 0.38));
writeWav("kr_death.wav", freqSweep(200, 72, 0.32, 0.48));
writeWav("kr_win.wav", concat(sine(523.25, 0.075, 0.42), silence(0.045), sine(783.99, 0.095, 0.4)));
writeWav("kr_loss.wav", freqSweep(228, 88, 0.34, 0.46));

console.log("Wrote WAV SFX to", outDir);
