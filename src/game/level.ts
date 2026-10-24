// Logical world units. The whole level is drawn in these units and scaled to fit the screen.
export const VIEW_H = 540;
export const GROUND_Y = 460;
export const WORLD_W = 2560;
export const TILE = 40;

export const PEACH_W = 60;
export const PEACH_H = 100;
export const MARIO_W = 72;
export const MARIO_H = 96;

export const MARIO_X = 2030;
/** Peach stops here: close enough to Mario for the conversation. */
export const MEET_X = MARIO_X - PEACH_W - 34;

export const CASTLE_X = 2190;
export const CASTLE_W = 290;
export const CASTLE_H = 273;

export type SolidKind = "ground" | "brick" | "question" | "pipe" | "stair";

export interface Solid {
  id: string;
  kind: SolidKind;
  x: number;
  y: number;
  w: number;
  h: number;
}

const block = (id: string, kind: SolidKind, col: number, y: number): Solid => ({
  id,
  kind,
  x: col,
  y,
  w: TILE,
  h: TILE,
});

const pipe = (id: string, x: number, h: number): Solid => ({
  id,
  kind: "pipe",
  x,
  y: GROUND_Y - h,
  w: 84,
  h,
});

const stairs: Solid[] = [];
[1, 2, 3, 4].forEach((height, i) => {
  for (let j = 0; j < height; j++) {
    stairs.push(block(`stair-${i}-${j}`, "stair", 1720 + i * TILE, GROUND_Y - (j + 1) * TILE));
  }
});

export const SOLIDS: Solid[] = [
  { id: "ground", kind: "ground", x: 0, y: GROUND_Y, w: WORLD_W, h: VIEW_H - GROUND_Y },
  block("q1", "question", 400, 300),
  block("b1", "brick", 600, 300),
  block("q2", "question", 640, 300),
  block("b2", "brick", 680, 300),
  block("q3", "question", 720, 300),
  block("b3", "brick", 760, 300),
  block("q4", "question", 680, 140),
  pipe("p1", 940, 80),
  pipe("p2", 1180, 120),
  block("q5", "question", 1360, 300),
  block("b4", "brick", 1400, 300),
  block("q6", "question", 1440, 300),
  pipe("p3", 1560, 100),
  ...stairs,
];

export const DECOR = {
  clouds: [
    { x: 180, y: 70, s: 1 },
    { x: 620, y: 40, s: 1.3 },
    { x: 1050, y: 90, s: 0.9 },
    { x: 1450, y: 50, s: 1.2 },
    { x: 1900, y: 80, s: 1 },
    { x: 2350, y: 40, s: 1.1 },
  ],
  hills: [
    { x: -40, w: 320, h: 130 },
    { x: 760, w: 220, h: 90 },
    { x: 1260, w: 340, h: 140 },
    { x: 2100, w: 260, h: 110 },
  ],
  bushes: [
    { x: 300, w: 140 },
    { x: 1020, w: 100 },
    { x: 1620, w: 90 },
    { x: 1880, w: 120 },
  ],
};
