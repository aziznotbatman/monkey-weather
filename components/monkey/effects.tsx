import { art, ink, stroke } from "@/lib/tokens";
import type { SkyKind } from "@/lib/tokens";

export interface EffectsProps {
  sky: SkyKind;
  windy?: boolean;
  filter: string;
  layer: "back" | "front";
}

const CLOUD =
  "M0 30 C-4 8 22 -6 40 6 C52 -14 90 -12 96 12 C120 10 130 36 112 48 C112 62 90 68 78 60 C66 72 30 72 22 58 C2 62 -10 44 0 30Z";

function Cloud({
  x,
  y,
  s = 1,
  fill = art.white,
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d={CLOUD}
        fill={fill}
        stroke={ink}
        strokeWidth={stroke.line / s}
        strokeLinejoin="round"
      />
    </g>
  );
}

function Sun({ x, y, r = 54 }: { x: number; y: number; r?: number }) {
  const rays = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r1 = r + 16;
    const r2 = r + 38;
    return `M${x + Math.cos(a) * r1} ${y + Math.sin(a) * r1} L${x + Math.cos(a) * r2} ${y + Math.sin(a) * r2}`;
  }).join(" ");
  return (
    <g className="mw-fx-sun">
      <path d={rays} stroke={ink} strokeWidth={stroke.detail} strokeLinecap="round" fill="none" />
      <circle cx={x} cy={y} r={r} fill={art.sun} stroke={ink} strokeWidth={stroke.line} />
    </g>
  );
}

/** Deterministic pseudo-random positions so renders are stable (SSR + screenshots). */
function scatter(n: number, seed: number, w = 600, h = 800): Array<[number, number]> {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: n }, () => [Math.round(rnd() * w), Math.round(rnd() * h)]);
}

const RAIN = scatter(26, 7);
const SNOW = scatter(34, 3);
const STARS = scatter(14, 5, 600, 360);
const EDGE: Array<[number, number]> = [
  [40, 560],
  [70, 690],
  [548, 610],
  [520, 730],
  [30, 380],
  [570, 420],
];

export function Effects({ sky, windy, filter, layer }: EffectsProps) {
  const f = `url(#${filter})`;
  if (layer === "back") {
    return (
      <g className="mw-fx mw-fx-back" filter={f} aria-hidden="true">
        {sky === "clear" && <Sun x={110} y={120} />}
        {sky === "partly" && (
          <>
            <Sun x={120} y={110} r={44} />
            <Cloud x={70} y={130} s={1.1} />
            <Cloud x={430} y={60} s={0.8} />
          </>
        )}
        {sky === "overcast" && (
          <>
            <Cloud x={40} y={70} s={1.2} fill="#E8EDF2" />
            <Cloud x={400} y={40} s={1} fill="#E8EDF2" />
          </>
        )}
        {(sky === "rain" || sky === "storm") && (
          <>
            <Cloud x={30} y={50} s={1.2} fill={sky === "storm" ? "#8B87A8" : "#D6E2F0"} />
            <Cloud x={420} y={30} s={1} fill={sky === "storm" ? "#8B87A8" : "#D6E2F0"} />
          </>
        )}
        {sky === "storm" && (
          <path
            d="M120 150 L96 210 L122 206 L104 262 L156 190 L128 194 L146 150Z"
            fill={art.yellow}
            stroke={ink}
            strokeWidth={stroke.fine}
            strokeLinejoin="round"
          />
        )}
        {sky === "night" && (
          <>
            <path
              d="M120 70 C80 80 70 140 108 162 C140 180 176 160 182 140 C150 150 116 130 120 70Z"
              fill={art.cream}
              stroke={ink}
              strokeWidth={stroke.line}
              strokeLinejoin="round"
            />
            {STARS.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 5 : 3.5} fill={art.cream} />
            ))}
          </>
        )}
        {(sky === "rain" || sky === "storm") && (
          <g className="mw-fx-rain">
            {RAIN.map(([x, y], i) => (
              <path
                key={i}
                d={`M${x} ${y} l-10 26`}
                stroke={art.rain}
                strokeWidth={6}
                strokeLinecap="round"
              />
            ))}
          </g>
        )}
        {windy && (
          <g
            fill="none"
            stroke={art.cream}
            strokeWidth={stroke.detail}
            strokeLinecap="round"
            opacity={0.9}
          >
            <path d="M24 470 C70 456 104 480 148 466 C172 458 174 432 154 430" />
            <path d="M462 520 C496 508 530 528 580 516" />
            <path d="M478 330 C506 320 534 334 584 326" />
          </g>
        )}
        {sky === "snow" &&
          SNOW.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 4 === 0 ? 7 : 4.5} fill={art.snow} opacity={0.9} />
          ))}
      </g>
    );
  }
  // Front layer: only a few marks at the edges, never over the face.
  return (
    <g className="mw-fx mw-fx-front" filter={f} aria-hidden="true">
      {(sky === "rain" || sky === "storm") &&
        EDGE.map(([x, y], i) => (
          <path
            key={i}
            d={`M${x} ${y} l-10 26`}
            stroke={art.rain}
            strokeWidth={6}
            strokeLinecap="round"
          />
        ))}
      {sky === "snow" &&
        EDGE.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={6} fill={art.snow} stroke={ink} strokeWidth={2.5} />
        ))}
    </g>
  );
}
