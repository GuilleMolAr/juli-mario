import { memo } from "react";
import type { SpriteDef } from "@/game/sprites";

interface Props {
  sprite: SpriteDef;
  width: number;
  className?: string;
  flip?: boolean;
  title?: string;
}

function PixelSpriteBase({ sprite, width, className, flip, title }: Props) {
  const cols = sprite.rows[0]?.length ?? 1;
  const rowsN = sprite.rows.length;
  const height = (width / cols) * rowsN;
  const rects: React.ReactNode[] = [];
  sprite.rows.forEach((row, y) => {
    // merge runs of the same colour to keep the SVG light
    let x = 0;
    while (x < row.length) {
      const ch = row[x] ?? ".";
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) run++;
      const fill = sprite.palette[ch];
      if (ch !== "." && fill) {
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={fill} />);
      }
      x += run;
    }
  });
  return (
    <svg
      viewBox={`0 0 ${cols} ${rowsN}`}
      width={width}
      height={height}
      shapeRendering="crispEdges"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
}

export const PixelSprite = memo(PixelSpriteBase);
