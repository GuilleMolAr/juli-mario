// Tiny chiptune synth built on WebAudio. All tunes are original.
type Wave = OscillatorType;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Note names → midi helper
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
/** "C5" → frequency in Hz */
const hz = (note: string) => {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) return 440;
  return midi(12 * (Number(m[2]) + 1) + NAMES.indexOf(m[1] ?? "A"));
};

const MELODY = (
  "C5 E5 G5 E5 A5 G5 E5 C5 D5 F5 A5 F5 G5 - G5 - " +
  "E5 G5 C6 G5 A5 F5 D5 F5 G5 E5 C5 D5 C5 - - -"
).split(" ");
const BASS = "C3 G2 F2 C3 D3 A2 G2 G2 C3 E3 F2 D3 G2 G2 C3 C3".split(" ");

class Chiptune {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: number | null = null;
  private nextNoteTime = 0;
  private stepIndex = 0;
  muted = false;

  init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) this.master.gain.setValueAtTime(m ? 0 : 0.18, this.ctx.currentTime);
  }

  private tone(freq: number, start: number, dur: number, wave: Wave = "square", vol = 0.5, slideTo?: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(g).connect(this.master);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private now() {
    return this.ctx?.currentTime ?? 0;
  }

  jump() {
    const t = this.now();
    this.tone(330, t, 0.18, "square", 0.35, 900);
  }
  coin() {
    const t = this.now();
    this.tone(hz("B5"), t, 0.08, "square", 0.4);
    this.tone(hz("E6"), t + 0.08, 0.4, "square", 0.4);
  }
  bump() {
    this.tone(140, this.now(), 0.1, "triangle", 0.8, 80);
  }
  blip() {
    this.tone(hz("A5"), this.now(), 0.03, "square", 0.15);
  }
  sparkle() {
    const t = this.now();
    ["E6", "G6", "B6", "E7"].forEach((n, i) => this.tone(hz(n), t + i * 0.07, 0.2, "triangle", 0.4));
  }

  fanfare() {
    if (!this.ctx) return;
    this.stopMusic();
    const t = this.now() + 0.05;
    const trip = 0.1;
    const runs = [
      ["G4", "C5", "E5", "G5", "C6", "E6"],
      ["G#4", "C5", "D#5", "G#5", "C6", "D#6"],
      ["A#4", "D5", "F5", "A#5", "D6", "F6"],
    ];
    const holds = ["G6", "G#6", "A#6"];
    let cur = t;
    runs.forEach((run, r) => {
      run.forEach((n) => {
        this.tone(hz(n), cur, trip * 0.9, "square", 0.4);
        this.tone(hz(n) / 2, cur, trip * 0.9, "triangle", 0.5);
        cur += trip;
      });
      this.tone(hz(holds[r] ?? "C6"), cur, 0.55, "square", 0.4);
      this.tone(hz(holds[r] ?? "C6") / 4, cur, 0.55, "triangle", 0.6);
      cur += 0.6;
    });
    ["C7", "C7", "C7"].forEach((n, i) => {
      this.tone(hz(n), cur + i * 0.14, 0.12, "square", 0.4);
    });
    this.tone(hz("C7"), cur + 0.45, 1.2, "square", 0.4);
    this.tone(hz("C3"), cur + 0.45, 1.2, "triangle", 0.7);
    window.setTimeout(() => this.startMusic(), (cur - t + 4) * 1000);
  }

  startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextNoteTime = this.now() + 0.1;
    this.stepIndex = 0;
    const eighth = 60 / 150 / 2;
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx) return;
      while (this.nextNoteTime < this.now() + 0.2) {
        const i = this.stepIndex % MELODY.length;
        const note = MELODY[i] ?? "-";
        if (note !== "-") this.tone(hz(note), this.nextNoteTime, eighth * 0.85, "square", 0.22);
        if (i % 2 === 0) {
          const bass = BASS[(i / 2) % BASS.length];
          this.tone(hz(bass ?? "C3"), this.nextNoteTime, eighth * 1.6, "triangle", 0.5);
        }
        this.nextNoteTime += eighth;
        this.stepIndex++;
      }
    }, 50);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const chiptune = new Chiptune();
