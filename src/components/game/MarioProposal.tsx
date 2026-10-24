import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Volume2, VolumeX } from "lucide-react";

import castleImg from "@/assets/castle.png";
import { chiptune } from "@/game/audio";
import {
  CASTLE_H,
  CASTLE_W,
  CASTLE_X,
  DECOR,
  GROUND_Y,
  MARIO_H,
  MARIO_W,
  MARIO_X,
  PEACH_H,
  PEACH_W,
  SOLIDS,
  TILE,
  VIEW_H,
  WORLD_W,
} from "@/game/level";
import { initialPlayer, step, type Input, type PlayerState } from "@/game/physics";
import { HEART, MARIO_HAPPY, MARIO_STAND, PEACH_A, PEACH_B } from "@/game/sprites";
import { PixelSprite } from "./PixelSprite";

type Phase = "title" | "play" | "meet" | "ask" | "yes";

const QUESTION =
  "Me gusta mucho lo que nació entre los dos.\n\n" +
  "Estaría bueno que llevemos esta relación a otro nivel juntos.\n\n" +
  "¿Querés ser mi novia, Juli?";

const NO_LABELS = ["No", "¿Segura?", "Mmm... no", "¡Ni lo intentes!", "Dale, tocá Sí"];

interface Pop {
  id: number;
  x: number;
  y: number;
  born: number;
}
interface FallingHeart {
  id: number;
  left: number;
  size: number;
  dur: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
let uid = 0;

export function MarioProposal() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 960, h: 540 });
  const [phase, setPhaseState] = useState<Phase>("title");
  const phaseRef = useRef<Phase>("title");
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };

  const playerRef = useRef<PlayerState>(initialPlayer());
  const inputRef = useRef<Input>({ left: false, right: false, jump: false });
  const camRef = useRef(0);
  const walkRef = useRef(0);
  const viewWRef = useRef(960);
  const usedRef = useRef(new Set<string>());
  const bumpsRef = useRef<Record<string, number>>({});
  const popsRef = useRef<Pop[]>([]);
  const idleRef = useRef(0);
  const [, setTick] = useState(0);

  const [hearts, setHearts] = useState(0);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [pressed, setPressed] = useState({ left: false, right: false, jump: false });
  const [loveHeart, setLoveHeart] = useState(false);
  const [typed, setTyped] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const [noPos, setNoPos] = useState<{ x: number; y: number } | null>(null);
  const [noCount, setNoCount] = useState(0);
  const [rain, setRain] = useState<FallingHeart[]>([]);
  const noBtnRef = useRef<HTMLButtonElement>(null);

  // ---------- Measure the frame ----------
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = size.h / VIEW_H;
  const viewW = size.w / scale;
  viewWRef.current = viewW;

  // ---------- Meeting cutscene ----------
  const startMeet = useCallback(() => {
    setPhase("meet");
    inputRef.current = { left: false, right: false, jump: false };
    setPressed({ left: false, right: false, jump: false });
    window.setTimeout(() => {
      setLoveHeart(true);
      chiptune.sparkle();
    }, 450);
    window.setTimeout(() => setPhase("ask"), 1600);
  }, []);

  // ---------- Game loop ----------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const p = phaseRef.current;

      if (p === "play") {
        const r = step(playerRef.current, inputRef.current, dt, SOLIDS);
        playerRef.current = r.state;
        if (r.jumped) chiptune.jump();
        const moving = Math.abs(r.state.vx) > 20;
        walkRef.current += moving ? dt : 0;
        idleRef.current = moving || !r.state.onGround ? 0 : idleRef.current + dt;

        for (const id of r.hits) {
          const solid = SOLIDS.find((s) => s.id === id);
          if (!solid) continue;
          if (solid.kind === "question" && !usedRef.current.has(id)) {
            usedRef.current.add(id);
            bumpsRef.current[id] = now;
            popsRef.current.push({ id: ++uid, x: solid.x + 6, y: solid.y - 34, born: now });
            setHearts((h) => h + 1);
            setScore((s) => s + 200);
            chiptune.coin();
          } else if (solid.kind === "brick" || solid.kind === "question") {
            bumpsRef.current[id] = now;
            chiptune.bump();
          }
        }
        if (r.reachedMario) startMeet();
      }

      // Camera
      const pl = playerRef.current;
      const vw = viewWRef.current;
      let target =
        p === "play" || p === "title"
          ? pl.x + PEACH_W / 2 - vw * 0.42
          : (pl.x + MARIO_X + MARIO_W) / 2 - vw / 2;
      target = clamp(target, 0, Math.max(0, WORLD_W - vw));
      camRef.current += (target - camRef.current) * Math.min(1, dt * (p === "play" ? 10 : 3));

      popsRef.current = popsRef.current.filter((pp) => now - pp.born < 900);
      setTick((t) => (t + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [startMeet]);

  // ---------- Start ----------
  const start = useCallback(() => {
    if (phaseRef.current !== "title") return;
    chiptune.init();
    chiptune.startMusic();
    setPhase("play");
  }, []);

  // ---------- Keyboard ----------
  useEffect(() => {
    const map = (key: string): keyof Input | null => {
      if (key === "ArrowLeft" || key === "a" || key === "A") return "left";
      if (key === "ArrowRight" || key === "d" || key === "D") return "right";
      if (key === " " || key === "ArrowUp" || key === "w" || key === "W" || key === "z" || key === "Z")
        return "jump";
      return null;
    };
    const down = (e: KeyboardEvent) => {
      if (phaseRef.current === "title" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        start();
        return;
      }
      if (e.key === "m" || e.key === "M") {
        setMuted((m) => {
          chiptune.setMuted(!m);
          return !m;
        });
        return;
      }
      const k = map(e.key);
      if (!k || phaseRef.current !== "play") return;
      e.preventDefault();
      inputRef.current = { ...inputRef.current, [k]: true };
    };
    const up = (e: KeyboardEvent) => {
      const k = map(e.key);
      if (!k) return;
      inputRef.current = { ...inputRef.current, [k]: false };
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [start]);

  // ---------- Typewriter ----------
  useEffect(() => {
    if (phase !== "ask") return;
    let i = 0;
    const timer = window.setInterval(() => {
      i++;
      setTyped(QUESTION.slice(0, i));
      if (i % 3 === 0 && QUESTION[i - 1]?.trim()) chiptune.blip();
      if (i >= QUESTION.length) {
        window.clearInterval(timer);
        window.setTimeout(() => setShowButtons(true), 450);
      }
    }, 48);
    return () => window.clearInterval(timer);
  }, [phase]);

  // ---------- Heart rain on YES ----------
  useEffect(() => {
    if (phase !== "yes") return;
    const spawn = () =>
      setRain((r) => [
        ...r.slice(-60),
        { id: ++uid, left: Math.random() * 100, size: 16 + Math.random() * 26, dur: 3 + Math.random() * 3 },
      ]);
    for (let i = 0; i < 24; i++) window.setTimeout(spawn, i * 70);
    const t = window.setInterval(spawn, 240);
    return () => window.clearInterval(t);
  }, [phase]);

  const sayYes = () => {
    setShowButtons(false);
    setNoPos(null);
    setPhase("yes");
    setScore((s) => s + 10000);
    chiptune.fanfare();
  };

  const dodge = () => {
    const frame = frameRef.current;
    const btn = noBtnRef.current;
    if (!frame || !btn) return;
    const bw = btn.offsetWidth || 120;
    const bh = btn.offsetHeight || 50;
    setNoPos({
      x: 8 + Math.random() * Math.max(0, frame.clientWidth - bw - 16),
      y: 8 + Math.random() * Math.max(0, frame.clientHeight - bh - 16),
    });
    setNoCount((c) => c + 1);
    chiptune.bump();
  };

  const pad = (key: keyof Input, value: boolean) => {
    if (phaseRef.current !== "play") return;
    inputRef.current = { ...inputRef.current, [key]: value };
    setPressed((p) => ({ ...p, [key]: value }));
  };

  // ---------- Derived render values ----------
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  const pl = playerRef.current;
  const cam = camRef.current;
  const walking = Math.abs(pl.vx) > 20 && pl.onGround;
  const peachSprite = !pl.onGround || (walking && Math.floor(walkRef.current / 0.13) % 2 === 1) ? PEACH_B : PEACH_A;

  const marioScreenX = (MARIO_X + MARIO_W / 2 - cam) * scale;
  const marioHeadY = (GROUND_Y - MARIO_H) * scale;
  const bubbleW = Math.min(size.w - 16, 540);
  const bubbleLeft = clamp(marioScreenX - bubbleW * 0.62, 8, Math.max(8, size.w - bubbleW - 8));
  const tailLeft = clamp(marioScreenX - bubbleLeft - 14, 18, bubbleW - 46);

  const bumpOffset = (id: string) => {
    const t = bumpsRef.current[id];
    if (t === undefined) return 0;
    const e = (now - t) / 160;
    return e < 1 ? -10 * Math.sin(Math.PI * e) : 0;
  };

  const showHint = phase === "play" && pl.x < 360;
  const showIdleHint = phase === "play" && idleRef.current > 6;
  const noLabel = NO_LABELS[Math.min(noCount, NO_LABELS.length - 1)];
  const yesScale: CSSProperties = { transform: `scale(${1 + Math.min(noCount, 5) * 0.08})` };

  const noButton = (
    <button
      ref={noBtnRef}
      type="button"
      className="pixel-btn bg-stop px-4 py-3 text-[clamp(10px,2.6vw,14px)] whitespace-nowrap text-stop-foreground"
      onPointerEnter={(e) => e.pointerType === "mouse" && dodge()}
      onPointerDown={(e) => {
        e.preventDefault();
        dodge();
      }}
      onClick={dodge}
      onFocus={dodge}
    >
      {noLabel}
    </button>
  );

  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-2 overflow-hidden bg-background p-2 sm:p-4">
      <div
        ref={frameRef}
        className="relative w-full max-w-[1100px] flex-1 min-h-0 max-h-[min(700px,160vw)] overflow-hidden rounded-xl border-4 border-frame sky-gradient select-none"
      >
        {/* ---------- WORLD ---------- */}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            width: WORLD_W,
            height: VIEW_H,
            transform: `scale(${scale}) translateX(${-cam}px)`,
          }}
        >
          {DECOR.clouds.map((c, i) => (
            <div key={i} className="absolute" style={{ left: c.x, top: c.y, transform: `scale(${c.s})` }}>
              <div className="cloud-puff absolute" style={{ left: 0, top: 18, width: 120, height: 36 }} />
              <div className="cloud-puff absolute" style={{ left: 22, top: 0, width: 46, height: 46 }} />
              <div className="cloud-puff absolute" style={{ left: 56, top: 6, width: 40, height: 40 }} />
            </div>
          ))}

          {DECOR.hills.map((h, i) => (
            <div
              key={i}
              className="hill-shape absolute"
              style={{ left: h.x, top: GROUND_Y - h.h, width: h.w, height: h.h }}
            />
          ))}
          {DECOR.bushes.map((b, i) => (
            <div key={i} className="bush-shape absolute" style={{ left: b.x, top: GROUND_Y - 34, width: b.w, height: 34 }} />
          ))}

          {/* Castle + flag */}
          <div className="absolute" style={{ left: CASTLE_X, top: GROUND_Y - CASTLE_H, width: CASTLE_W, height: CASTLE_H }}>
            {phase === "yes" && (
              <div className="absolute overflow-hidden" style={{ left: CASTLE_W / 2 - 3, top: -96, width: 70, height: 100 }}>
                <div className="animate-flag-rise absolute inset-0">
                  <div className="absolute bg-ink" style={{ left: 0, top: 0, width: 6, height: 100 }} />
                  <div className="absolute flex items-center justify-center bg-paper" style={{ left: 6, top: 6, width: 52, height: 38 }}>
                    <PixelSprite sprite={HEART} width={26} />
                  </div>
                </div>
              </div>
            )}
            <img
              src={castleImg}
              alt=""
              width={CASTLE_W}
              height={CASTLE_H}
              className="absolute inset-0 h-full w-full [image-rendering:pixelated]"
              draggable={false}
            />
          </div>

          {/* Fireworks */}
          {phase === "yes" &&
            [
              { x: CASTLE_X - 40, y: 70, d: 0, c: "var(--heart)" },
              { x: CASTLE_X + 160, y: 30, d: 0.4, c: "var(--coin)" },
              { x: MARIO_X - 220, y: 60, d: 0.8, c: "var(--sp-pink)" },
              { x: CASTLE_X + 60, y: 120, d: 1.1, c: "var(--paper)" },
            ].map((f, i) => (
              <div
                key={i}
                className="animate-firework absolute rounded-full"
                style={{
                  left: f.x,
                  top: f.y,
                  width: 140,
                  height: 140,
                  animationDelay: `${f.d}s`,
                  background: `radial-gradient(circle, transparent 38%, ${f.c} 40% 46%, transparent 48% 58%, ${f.c} 60% 63%, transparent 65%)`,
                }}
              />
            ))}

          {/* Solids */}
          {SOLIDS.map((s) => {
            if (s.kind === "ground")
              return (
                <div
                  key={s.id}
                  className="tile-bricks absolute"
                  style={{ left: s.x, top: s.y, width: s.w, height: s.h }}
                />
              );
            if (s.kind === "pipe")
              return (
                <div key={s.id} className="absolute" style={{ left: s.x, top: s.y, width: s.w, height: s.h }}>
                  <div className="pipe-lip absolute" style={{ left: -7, top: 0, width: s.w + 14, height: 34 }} />
                  <div className="pipe-body absolute" style={{ left: 0, top: 34, width: s.w, height: s.h - 34 }} />
                </div>
              );
            const used = usedRef.current.has(s.id);
            const cls =
              s.kind === "stair"
                ? "tile-stair"
                : s.kind === "brick"
                  ? "tile-brick-block"
                  : used
                    ? "tile-used"
                    : "tile-question";
            return (
              <div
                key={s.id}
                className={`${cls} absolute flex items-center justify-center font-pixel text-[20px]`}
                style={{ left: s.x, top: s.y + bumpOffset(s.id), width: TILE, height: TILE }}
              >
                {s.kind === "question" && !used ? <span className="animate-blink">?</span> : null}
              </div>
            );
          })}

          {/* Heart pops from ? blocks */}
          {popsRef.current.map((p) => (
            <div key={p.id} className="animate-float-heart absolute" style={{ left: p.x, top: p.y }}>
              <PixelSprite sprite={HEART} width={28} />
            </div>
          ))}

          {/* Mario (Guillermo) */}
          <div className="absolute" style={{ left: MARIO_X, top: GROUND_Y - MARIO_H, width: MARIO_W, height: MARIO_H }}>
            {(phase === "title" || phase === "play" || phase === "meet") && <NameTag label="GUILLERMO" />}
            <div className={phase === "yes" ? "animate-hop" : phase === "meet" ? "animate-hop-once" : "animate-idle-bob"}>
              <PixelSprite
                sprite={phase === "yes" ? MARIO_HAPPY : MARIO_STAND}
                width={MARIO_W}
                flip
                title="Guillermo como Mario"
              />
            </div>
          </div>

          {/* Love heart between them */}
          {loveHeart && (
            <div
              className="animate-love-pop absolute"
              style={{ left: (pl.x + PEACH_W + MARIO_X) / 2 - 18, top: GROUND_Y - MARIO_H - 50 }}
            >
              <PixelSprite sprite={HEART} width={36} />
            </div>
          )}

          {/* Peach (Juli) */}
          <div className="absolute" style={{ left: pl.x, top: pl.y, width: PEACH_W, height: PEACH_H }}>
            {(phase === "title" || phase === "play" || phase === "meet") && <NameTag label="JULI" />}
            <div className={phase === "yes" ? "animate-hop [animation-delay:0.25s]" : ""}>
              <PixelSprite sprite={peachSprite} width={PEACH_W} flip={pl.facing === -1} title="Juli como Peach" />
            </div>
          </div>
        </div>

        {/* ---------- HUD ---------- */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 px-3 pt-3 font-pixel text-[clamp(8px,1.9vw,13px)] leading-[1.7] text-hud text-hud-shadow sm:px-6">
          <div>
            JULI
            <br />
            {String(score).padStart(6, "0")}
          </div>
          <div className="flex items-center gap-1 pt-[1.7em]">
            <PixelSprite sprite={HEART} width={14} />×{String(hearts).padStart(2, "0")}
          </div>
          <div className="text-center">
            MUNDO
            <br />
            1-1
          </div>
          <button
            type="button"
            className="pointer-events-auto rounded-md p-1 text-hud"
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            onClick={() => {
              chiptune.setMuted(!muted);
              setMuted(!muted);
            }}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </div>

        {/* ---------- Hints ---------- */}
        {(showHint || showIdleHint) && (
          <div className="pointer-events-none absolute inset-x-0 top-[22%] z-10 text-center font-pixel text-[clamp(9px,2.2vw,14px)] leading-loose text-hud text-hud-shadow">
            <span className="animate-blink">
              {showIdleHint ? "Mantené >> para caminar" : "¡Llevá a Juli hasta Guillermo! >>"}
            </span>
          </div>
        )}

        {/* ---------- Speech bubble ---------- */}
        {phase === "ask" && (
          <div
            className="speech-bubble animate-bubble-in absolute z-30 p-4 font-pixel sm:p-5"
            style={{
              left: bubbleLeft,
              width: bubbleW,
              bottom: size.h - marioHeadY + 60 * scale + 26,
            }}
          >
            <p className="min-h-[7em] whitespace-pre-wrap text-[clamp(9px,2.4vw,13px)] leading-[2] tracking-wide">
              {typed}
              {!showButtons && <span className="animate-blink text-heart">▌</span>}
            </p>
            {showButtons && (
              <div className="animate-bubble-in mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="pixel-btn bg-go px-6 py-3 text-[clamp(12px,3vw,16px)] text-go-foreground transition-transform"
                  style={yesScale}
                  onClick={sayYes}
                >
                  Sí
                </button>
                {noPos === null && noButton}
              </div>
            )}
            {/* tail */}
            <span
              aria-hidden
              className="absolute top-full h-0 w-0 border-x-[14px] border-t-[22px] border-x-transparent border-t-ink"
              style={{ left: tailLeft }}
            />
            <span
              aria-hidden
              className="absolute top-full h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-paper"
              style={{ left: tailLeft + 4, marginTop: -5 }}
            />
          </div>
        )}
        {phase === "ask" && showButtons && noPos && (
          <div className="absolute z-40 transition-all duration-150" style={{ left: noPos.x, top: noPos.y }}>
            {noButton}
          </div>
        )}

        {/* ---------- Level clear ---------- */}
        {phase === "yes" && (
          <div className="pointer-events-none absolute inset-x-0 top-[16%] z-30 flex flex-col items-center gap-4 px-4 text-center font-pixel">
            <h2 className="animate-banner-in text-[clamp(16px,4.6vw,38px)] leading-tight text-title text-pixel-shadow">
              ¡NIVEL COMPLETADO!
            </h2>
            <p className="animate-banner-in flex items-center gap-3 text-[clamp(10px,2.6vw,18px)] text-hud text-pixel-shadow [animation-delay:0.4s] opacity-0">
              JULI <PixelSprite sprite={HEART} width={22} /> GUILLERMO
            </p>
            <p className="animate-banner-in text-[clamp(9px,2.2vw,14px)] leading-loose text-hud text-hud-shadow [animation-delay:0.9s] opacity-0">
              ¡Has ganado un corazón!
            </p>
          </div>
        )}

        {/* ---------- Title screen ---------- */}
        {phase === "title" && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 px-4 text-center font-pixel">
            <div className="plaque px-6 py-5 sm:px-10 sm:py-7">
              <p className="text-[clamp(10px,2.4vw,16px)] text-title text-pixel-shadow">SUPER</p>
              <h1 className="mt-2 text-[clamp(22px,6.5vw,52px)] leading-none text-title text-pixel-shadow">
                JULI BROS.
              </h1>
            </div>
            <p className="text-[clamp(9px,2vw,13px)] leading-loose text-hud text-hud-shadow">
              Una misión de amor para Juli
            </p>
            <button
              type="button"
              onClick={start}
              className="pixel-btn bg-primary px-7 py-4 text-[clamp(12px,3vw,18px)] text-primary-foreground"
            >
              START
            </button>
            <p className="mouse-only text-[clamp(8px,1.6vw,11px)] leading-loose text-hud text-hud-shadow">
              Flechas: caminar · Espacio: saltar
            </p>
          </div>
        )}

        {/* ---------- Touch pad ---------- */}
        {phase === "play" && (
          <div className="touch-only pointer-events-none absolute inset-x-0 bottom-3 z-30 items-end justify-between px-3">
            <div className="pointer-events-auto flex gap-3">
              <PadButton label="◀" aria="Izquierda" pressed={pressed.left} onChange={(v) => pad("left", v)} />
              <PadButton label="▶" aria="Derecha" pressed={pressed.right} onChange={(v) => pad("right", v)} />
            </div>
            <div className="pointer-events-auto">
              <PadButton label="A" aria="Saltar" pressed={pressed.jump} onChange={(v) => pad("jump", v)} big />
            </div>
          </div>
        )}

        {/* ---------- Falling hearts ---------- */}
        {rain.map((h) => (
          <div
            key={h.id}
            className="animate-heart-fall pointer-events-none fixed -top-12 z-50"
            style={{ left: `${h.left}vw`, animationDuration: `${h.dur}s` }}
            onAnimationEnd={() => setRain((r) => r.filter((x) => x.id !== h.id))}
          >
            <PixelSprite sprite={HEART} width={h.size} />
          </div>
        ))}
      </div>

      {phase === "play" && (
        <p className="mouse-only font-pixel text-[10px] text-muted-foreground">Flechas: caminar · Espacio: saltar · M: música</p>
      )}
    </main>
  );
}

function NameTag({ label }: { label: string }) {
  return (
    <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border-[3px] border-ink bg-paper px-2 py-1 font-pixel text-[11px] text-ink">
      {label}
    </div>
  );
}

function PadButton({
  label,
  aria,
  pressed,
  onChange,
  big,
}: {
  label: string;
  aria: string;
  pressed: boolean;
  onChange: (v: boolean) => void;
  big?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={aria}
      data-pressed={pressed}
      className={`pad-btn flex items-center justify-center ${big ? "size-[72px] text-xl" : "size-[60px] text-lg"}`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onChange(true);
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onLostPointerCapture={() => onChange(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}
