import { toMinutes } from "@/lib/outfitState";
import type { Change, DaySummary } from "@/lib/schema";
import { art, ink } from "@/lib/tokens";
import { formatTemp, type Units } from "@/lib/units";
import { ITEM_LABEL } from "@/lib/wardrobe";
import styles from "./app.module.css";

interface DayStripProps {
  summary: DaySummary;
  changes: Change[];
  units: Units;
  activeTime?: string | null;
}

const W = 600;
const H = 190;
const PAD_X = 34;
const TOP = 34;
const CURVE_H = 70;
const BASE_Y = 150;
const BAR_MAX = 46;
const UV_HIGH = 6;

/** Catmull-Rom → cubic Bézier for a smooth, drawn-looking curve. */
function smoothPath(pts: Array<[number, number]>): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function DayStrip({ summary, changes, units, activeTime }: DayStripProps) {
  const hours = summary.hours;
  const t0 = toMinutes(hours[0].time);
  const t1 = Math.max(t0 + 60, toMinutes(hours[hours.length - 1].time));
  const x = (time: string) => PAD_X + ((toMinutes(time) - t0) / (t1 - t0)) * (W - PAD_X * 2);
  const lo = summary.minFeelsLikeC;
  const hi = Math.max(summary.maxFeelsLikeC, lo + 4);
  const y = (c: number) => TOP + CURVE_H - ((c - lo) / (hi - lo)) * CURVE_H;
  const pts = hours.map((h) => [x(h.time), y(h.feelsLikeC)] as [number, number]);
  const minIdx = hours.findIndex((h) => h.feelsLikeC === summary.minFeelsLikeC);
  const maxIdx = hours.findIndex((h) => h.feelsLikeC === summary.maxFeelsLikeC);
  const markers = changes
    .reduce<Array<{ time: string; nums: number[] }>>((acc, c, i) => {
      const last = acc[acc.length - 1];
      return last && last.time === c.time
        ? [...acc.slice(0, -1), { ...last, nums: [...last.nums, i + 1] }]
        : [...acc, { time: c.time, nums: [i + 1] }];
    }, [])
    .map((m) => ({
      time: m.time,
      label: m.nums.length > 1 ? `${m.nums[0]}–${m.nums[m.nums.length - 1]}` : String(m.nums[0]),
    }));
  const barW = Math.min(30, ((W - PAD_X * 2) / hours.length) * 0.55);

  return (
    <figure className={styles.strip}>
      <figcaption className={styles.stripCaption}>
        <span>The day, hour by hour</span>
        <span className={styles.stripLegend} aria-hidden="true">
          <i className={styles.legendLine} /> feels like <i className={styles.legendBar} /> rain
          chance
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={styles.stripSvg}
        aria-hidden="true"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <filter
            id="strip-wobble"
            filterUnits="userSpaceOnUse"
            x={-20}
            y={-20}
            width={W + 40}
            height={H + 40}
          >
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={4} />
            <feDisplacementMap
              in="SourceGraphic"
              scale={3}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <g filter="url(#strip-wobble)">
          <path
            d={`M${PAD_X - 10} ${BASE_Y} L${W - PAD_X + 10} ${BASE_Y}`}
            stroke={ink}
            strokeWidth={3}
          />
          {hours.map((h) =>
            h.rainProb > 0 ? (
              <rect
                key={`r${h.time}`}
                x={x(h.time) - barW / 2}
                y={BASE_Y - (h.rainProb / 100) * BAR_MAX}
                width={barW}
                height={(h.rainProb / 100) * BAR_MAX}
                rx={4}
                fill={h.rainProb >= 60 ? "#3E7BE0" : "#A9CBF5"}
                stroke={ink}
                strokeWidth={2.5}
              />
            ) : null,
          )}
          {markers.map((m) => (
            <g
              key={`c${m.time}`}
              className={activeTime === m.time ? styles.stripMarkerActive : undefined}
            >
              <path
                d={`M${x(m.time)} ${TOP - 18} L${x(m.time)} ${BASE_Y}`}
                stroke={ink}
                strokeWidth={2.5}
                strokeDasharray="2 7"
              />
              <rect
                x={x(m.time) - (m.label.length > 1 ? 21 : 12)}
                y={TOP - 32}
                width={m.label.length > 1 ? 42 : 24}
                height={24}
                rx={12}
                fill={art.pink}
                stroke={ink}
                strokeWidth={2.5}
              />
              <text x={x(m.time)} y={TOP - 15} textAnchor="middle" className={styles.stripNum}>
                {m.label}
              </text>
            </g>
          ))}
          <path d={smoothPath(pts)} fill="none" stroke={ink} strokeWidth={5} />
          <path d={smoothPath(pts)} fill="none" stroke={art.mustard} strokeWidth={2} />
          {hours.map((h) =>
            h.uv >= UV_HIGH ? (
              <g key={`u${h.time}`} transform={`translate(${x(h.time)} ${y(h.feelsLikeC) - 20})`}>
                <circle r={7} fill={art.sun} stroke={ink} strokeWidth={2.5} />
                <text y={-12} textAnchor="middle" className={styles.stripUv}>
                  UV {Math.round(h.uv)}
                </text>
              </g>
            ) : null,
          )}
          {[minIdx, maxIdx].map((i, k) => (
            <g key={`t${k}`}>
              <circle
                cx={pts[i][0]}
                cy={pts[i][1]}
                r={5.5}
                fill={art.white}
                stroke={ink}
                strokeWidth={2.5}
              />
              <text
                x={pts[i][0]}
                y={pts[i][1] + (k === 0 ? 22 : -12)}
                textAnchor="middle"
                className={styles.stripTemp}
              >
                {formatTemp(hours[i].feelsLikeC, units)}
              </text>
            </g>
          ))}
        </g>
        {hours.map((h, i) =>
          i % (hours.length > 7 ? 2 : 1) === 0 || i === hours.length - 1 ? (
            <text
              key={`l${h.time}`}
              x={x(h.time)}
              y={BASE_Y + 24}
              textAnchor="middle"
              className={styles.stripHour}
            >
              {h.time.slice(0, 2)}
            </text>
          ) : null,
        )}
      </svg>
      <ul className="visually-hidden" aria-label="Hour by hour">
        {hours.map((h) => (
          <li key={h.time}>
            {h.time}: feels like {formatTemp(h.feelsLikeC, units)}, {h.rainProb}% chance of rain
            {h.uv >= UV_HIGH ? `, UV ${Math.round(h.uv)}` : ""}
            {changes
              .filter((c) => c.time === h.time)
              .map(
                (c) => `; ${c.action === "add" ? "put on" : "take off"} the ${ITEM_LABEL[c.item]}`,
              )
              .join("")}
          </li>
        ))}
      </ul>
    </figure>
  );
}
