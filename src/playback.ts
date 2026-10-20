export type SpellId = 'fire' | 'lightning' | 'fusion';
export type Phase = 'idle' | 'charge' | 'release' | 'impact' | 'decay';
export type CastEffect = { update: (time: number, dt: number) => void; dispose: () => void };
export type SpellTiming = { release: number; impact: number; decay: number; end: number };
export const timings: Record<SpellId, SpellTiming> = {
  fire: { release: 1.05, impact: 2.05, decay: 2.65, end: 4.6 },
  lightning: { release: 0.85, impact: 1.03, decay: 1.75, end: 3.5 },
  fusion: { release: 1.3, impact: 2.65, decay: 3.35, end: 5.6 },
};

export class Playback {
  time = 0;
  id: SpellId | null = null;
  phase: Phase = 'idle';
  progress = 0;
  private effect: CastEffect | null = null;
  private factory: (id: SpellId) => CastEffect;
  constructor(factory: (id: SpellId) => CastEffect) { this.factory = factory; }
  cast(id: SpellId) {
    this.clear();
    this.effect = this.factory(id);
    this.id = id;
    this.phase = 'charge';
    this.time = 0;
    this.progress = 0;
    this.effect.update(0, 0);
  }
  update(dt: number) {
    if (!this.effect || !this.id || !Number.isFinite(dt) || dt <= 0) return;
    const step = Math.min(dt, 0.05);
    this.time += step;
    const t = timings[this.id];
    if (this.time >= t.end) { this.clear(); return; }
    this.phase = this.time < t.release ? 'charge' : this.time < t.impact ? 'release' : this.time < t.decay ? 'impact' : 'decay';
    this.progress = this.time / t.end;
    this.effect.update(this.time, step);
  }
  clear() {
    const previous = this.effect;
    this.effect = null;
    this.id = null;
    this.phase = 'idle';
    this.progress = 0;
    previous?.dispose();
  }
}
