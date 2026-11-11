import { ink, stroke } from "@/lib/tokens";

/**
 * A drawable part of the monkey (a body part, garment piece, expression or effect).
 *
 * Rendering order inside a part:
 *   1. line layer  — every shape in ink, twice the line width, wobble filter on
 *   2. fill layer  — flat colour (+ the faint edge-darkening band), no filter
 *   3. detail layer — inner lines and dots on top, wobble filter on
 * Because the fills sit on the ink, half of the line tucks under the fill and the
 * visible outline is exactly `stroke.line` wide, wobbling only on the outside.
 */
export type Shape =
  | { kind: "area"; d: string; fill: string; glow?: boolean }
  | { kind: "tube"; d: string; fill: string; width: number; glow?: boolean };

export interface Detail {
  d: string;
  /** Stroke colour (defaults to ink). Use "none" for fill-only marks. */
  stroke?: string;
  width?: number;
  fill?: string;
  opacity?: number;
}

export interface Part {
  id: string;
  z: number;
  slot?: string;
  shapes: Shape[];
  details?: Detail[];
  /** Skip the wobble (e.g. tiny marks that should stay crisp). */
  crisp?: boolean;
}

const LINE = stroke.line * 2;

function ShapeLine({ s }: { s: Shape }) {
  if (s.kind === "area") {
    return <path d={s.d} fill={ink} stroke={ink} strokeWidth={LINE} />;
  }
  return <path d={s.d} fill="none" stroke={ink} strokeWidth={s.width + LINE} />;
}

function ShapeFill({ s }: { s: Shape }) {
  const glow = s.glow !== false;
  if (s.kind === "area") {
    return (
      <path
        d={s.d}
        fill={s.fill}
        stroke={glow ? `rgba(0,0,0,${stroke.glowOpacity})` : "none"}
        strokeWidth={stroke.glow}
      />
    );
  }
  return (
    <>
      <path d={s.d} fill="none" stroke={s.fill} strokeWidth={s.width} />
      {glow && (
        <>
          <path
            d={s.d}
            fill="none"
            stroke={`rgba(0,0,0,${stroke.glowOpacity})`}
            strokeWidth={s.width}
          />
          <path
            d={s.d}
            fill="none"
            stroke={s.fill}
            strokeWidth={Math.max(2, s.width - stroke.glow)}
          />
        </>
      )}
    </>
  );
}

export function PartView({ part, filter }: { part: Part; filter: string }) {
  const f = part.crisp ? undefined : `url(#${filter})`;
  return (
    <g id={part.id} data-slot={part.slot} data-z={part.z}>
      <g className="mw-line" filter={f}>
        {part.shapes.map((s, i) => (
          <ShapeLine key={i} s={s} />
        ))}
      </g>
      <g className="mw-fill">
        {part.shapes.map((s, i) => (
          <ShapeFill key={i} s={s} />
        ))}
      </g>
      {part.details && part.details.length > 0 && (
        <g className="mw-detail" filter={f}>
          {part.details.map((d, i) => (
            <path
              key={i}
              d={d.d}
              fill={d.fill ?? "none"}
              stroke={d.stroke ?? (d.fill ? "none" : ink)}
              strokeWidth={d.width ?? stroke.detail}
              opacity={d.opacity}
            />
          ))}
        </g>
      )}
    </g>
  );
}

/** Shared SVG defs: the marker wobble. userSpaceOnUse keeps the noise identical across layers. */
export function WobbleDefs({ id, scale = stroke.wobbleScale }: { id: string; scale?: number }) {
  return (
    <filter
      id={id}
      filterUnits="userSpaceOnUse"
      x={-100}
      y={-100}
      width={800}
      height={1000}
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency={stroke.wobbleFrequency}
        numOctaves={2}
        seed={stroke.wobbleSeed}
        result="noise"
      />
      <feDisplacementMap
        in="SourceGraphic"
        in2="noise"
        scale={scale}
        xChannelSelector="R"
        yChannelSelector="G"
      />
    </filter>
  );
}

/** Small helpers for authoring. */
export const area = (d: string, fill: string, glow = true): Shape => ({
  kind: "area",
  d,
  fill,
  glow,
});
export const tube = (d: string, fill: string, width: number, glow = true): Shape => ({
  kind: "tube",
  d,
  fill,
  width,
  glow,
});
export const line = (d: string, width: number = stroke.detail, color: string = ink): Detail => ({
  d,
  width,
  stroke: color,
});
export const dot = (d: string, fill: string = ink): Detail => ({ d, fill, stroke: "none" });

/** An ellipse as a path (so it can be wobbled like everything else). */
export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
}
