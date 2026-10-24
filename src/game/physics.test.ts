import { describe, expect, it } from "vitest";

import { MEET_X } from "./level";
import { initialPlayer, step, type Input } from "./physics";

const run = (frames: number, inputFor: (i: number) => Input) => {
  let s = initialPlayer();
  let reached = false;
  const hits: string[] = [];
  for (let i = 0; i < frames && !reached; i++) {
    const r = step(s, inputFor(i), 1 / 60);
    s = r.state;
    hits.push(...r.hits);
    reached = r.reachedMario;
  }
  return { s, reached, hits };
};

describe("Peach's walk to Guillermo", () => {
  it("reaches Mario by walking right and jumping over every obstacle", () => {
    // hold right, tap jump in bursts so pipes and stairs can be cleared
    const { reached, s } = run(60 * 40, (i) => ({ left: false, right: true, jump: i % 50 < 25 }));
    expect(reached).toBe(true);
    expect(s.x).toBeLessThanOrEqual(MEET_X);
  });

  it("never walks past the meeting spot", () => {
    const { s } = run(60 * 40, (i) => ({ left: false, right: true, jump: i % 50 < 25 }));
    expect(s.x).toBeLessThanOrEqual(MEET_X);
  });

  it("hitting a ? block from below registers a hit", () => {
    // first ? block sits at x=400; stand under it and jump
    let s = { ...initialPlayer(), x: 390 };
    const hits: string[] = [];
    for (let i = 0; i < 40; i++) {
      const r = step(s, { left: false, right: false, jump: true }, 1 / 60);
      s = r.state;
      hits.push(...r.hits);
    }
    expect(hits).toContain("q1");
  });
});
