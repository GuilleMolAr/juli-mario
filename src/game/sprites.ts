// Hand-drawn pixel sprites. Each character maps to a palette colour (CSS variable from styles.css).
export type Palette = Record<string, string>;

export interface SpriteDef {
  rows: string[];
  palette: Palette;
}

const MARIO_PALETTE: Palette = {
  R: "var(--sp-red)",
  H: "var(--sp-brown)",
  S: "var(--sp-skin)",
  B: "var(--sp-blue)",
  Y: "var(--sp-yellow)",
  W: "var(--sp-white)",
  K: "var(--sp-black)",
};

const MARIO_TOP = [
  "...RRRRR....",
  "..RRRRRRRRR.",
  "..HHHSSKS...",
  ".HSHSSSKSSS.",
  ".HSHHSSSKSSS",
  ".HHSSSSHHHH.",
  "...SSSSSSS..",
  "..RRBRRR....",
  ".RRRBRRBRRR.",
  "RRRRBBBBRRRR",
  "WWRBYBBYBRWW",
  "WWWBBBBBBWWW",
  "WWBBBBBBBBWW",
];

export const MARIO_STAND: SpriteDef = {
  palette: MARIO_PALETTE,
  rows: [...MARIO_TOP, "..BBB..BBB..", ".HHH....HHH.", "HHHH....HHHH"],
};

export const MARIO_HAPPY: SpriteDef = {
  palette: MARIO_PALETTE,
  rows: [
    "...RRRRR..WW",
    "..RRRRRRRRWW",
    "..HHHSSKS.RR",
    ".HSHSSSKSSRR",
    ".HSHHSSSKSRR",
    ".HHSSSSHHHR.",
    "...SSSSSSSR.",
    "..RRBRRRRR..",
    ".RRRBRRBR...",
    "RRRRBBBB....",
    "WWRBYBBYB...",
    "WWWBBBBBB...",
    "WWBBBBBBBB..",
    "..BBB..BBB..",
    ".HHH....HHH.",
    "HHHH....HHHH",
  ],
};

const PEACH_PALETTE: Palette = {
  G: "var(--sp-gold)",
  C: "var(--sp-gem)",
  Y: "var(--sp-hair)",
  S: "var(--sp-skin)",
  E: "var(--sp-eye)",
  L: "var(--sp-pink-dark)",
  P: "var(--sp-pink)",
  D: "var(--sp-pink-dark)",
  W: "var(--sp-white)",
  K: "var(--sp-black)",
};

const PEACH_TOP = [
  "....G.G.G...",
  "....GGCGG...",
  "...YYYYYYY..",
  "..YYYYYYYYY.",
  "..YYYSSSSYY.",
  ".YYYSSSESY..",
  ".YYYSSSSSS..",
  ".YYYYSSLS...",
  ".YYYYYSS....",
  ".YYYPPCPP...",
  ".YYPPPPPPP..",
  ".YYPWPPPWW..",
  ".YYPWWPPWW..",
  "..YPPPPPP...",
  "..PPDPPDPP..",
  "..PPPPPPPPP.",
];

export const PEACH_A: SpriteDef = {
  palette: PEACH_PALETTE,
  rows: [...PEACH_TOP, ".PPDPPPPDPP.", ".PPPPPPPPPPP", "PPDPPPDPPPDP", "PPPPPPPPPPPP"],
};

export const PEACH_B: SpriteDef = {
  palette: PEACH_PALETTE,
  rows: [...PEACH_TOP, "..PPDPPPDPPP", "..PPPPPPPPPP", ".PDPPPDPPPDP", ".PPPPPPPPPPP"],
};

export const HEART: SpriteDef = {
  palette: { R: "var(--heart)", W: "var(--sp-white)", D: "var(--heart-dark)" },
  rows: [".RR.RR.", "RWRRRRR", "RRRRRRR", "RRRRRRD", ".RRRRD.", "..RRD..", "...D..."],
};

const ICON = { W: "var(--hud)", K: "var(--ink)" };
export const SOUND_ON: SpriteDef = {
  palette: ICON,
  rows: ["...W.....", "..WW..W..", "WWWW...W.", "WWWW.W.W.", "WWWW.W.W.", "WWWW...W.", "..WW..W..", "...W....."],
};
export const SOUND_OFF: SpriteDef = {
  palette: ICON,
  rows: ["...W.....", "..WW.....", "WWWW.W.W.", "WWWW..W..", "WWWW..W..", "WWWW.W.W.", "..WW.....", "...W....."],
};
