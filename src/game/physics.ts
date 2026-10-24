import { GROUND_Y, MEET_X, PEACH_H, PEACH_W, SOLIDS, type Solid } from "./level";

export const GRAVITY = 2300;
export const JUMP_VELOCITY = 860;
export const WALK_SPEED = 270;
const ACCEL = 1800;
const JUMP_CUT = 320;

export interface PlayerState {
  x: number;
  y: number; // top edge
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
}

export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export interface StepResult {
  state: PlayerState;
  hits: string[];
  jumped: boolean;
  reachedMario: boolean;
}

export const initialPlayer = (): PlayerState => ({
  x: 90,
  y: GROUND_Y - PEACH_H,
  vx: 0,
  vy: 0,
  onGround: true,
  facing: 1,
});

const overlaps = (s: PlayerState, b: Solid) =>
  s.x < b.x + b.w && s.x + PEACH_W > b.x && s.y < b.y + b.h && s.y + PEACH_H > b.y;

export function step(
  prev: PlayerState,
  input: Input,
  dt: number,
  solids: Solid[] = SOLIDS,
): StepResult {
  const s: PlayerState = { ...prev };
  const hits: string[] = [];
  let jumped = false;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const target = dir * WALK_SPEED;
  if (s.vx < target) s.vx = Math.min(target, s.vx + ACCEL * dt);
  else if (s.vx > target) s.vx = Math.max(target, s.vx - ACCEL * dt);
  if (dir !== 0) s.facing = dir as 1 | -1;

  if (input.jump && s.onGround) {
    s.vy = -JUMP_VELOCITY;
    s.onGround = false;
    jumped = true;
  }
  // Short hop when the jump button is released early.
  if (!input.jump && s.vy < -JUMP_CUT) s.vy = -JUMP_CUT;

  s.vy += GRAVITY * dt;

  // Horizontal move + resolve
  s.x += s.vx * dt;
  for (const b of solids) {
    if (!overlaps(s, b)) continue;
    if (s.vx > 0) s.x = b.x - PEACH_W;
    else if (s.vx < 0) s.x = b.x + b.w;
    s.vx = 0;
  }
  s.x = Math.max(0, Math.min(MEET_X, s.x));

  // Vertical move + resolve
  s.y += s.vy * dt;
  s.onGround = false;
  for (const b of solids) {
    if (!overlaps(s, b)) continue;
    if (s.vy > 0) {
      s.y = b.y - PEACH_H;
      s.vy = 0;
      s.onGround = true;
    } else if (s.vy < 0) {
      s.y = b.y + b.h;
      s.vy = 0;
      hits.push(b.id);
    }
  }

  const reachedMario = s.x >= MEET_X - 0.5 && s.onGround;
  return { state: s, hits, jumped, reachedMario };
}
