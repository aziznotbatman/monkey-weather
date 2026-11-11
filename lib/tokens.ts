/**
 * Monkey Weather design tokens — the single source of truth.
 *
 * - `ink`, `stroke` and `art` are used by the SVG monkey, garments and effects.
 * - `ui`, `radius`, `space` and `type` are exposed to CSS as custom properties
 *   (see `cssVariables()`, applied on <html> in app/layout.tsx).
 *
 * To restyle the monkey, change the hex values in `art` below.
 */

export const ink = "#0B0B0B";

/** Marker line. The visible outline is `stroke.line` wide (half of it tucks under the fill). */
export const stroke = {
  line: 10, // visible outline width in viewBox units (~4% of the 260-unit head)
  detail: 7.5, // inner detail lines (mouth, seams, stripes)
  fine: 5, // tiny accents (tufts, fringe, rain on the face)
  glow: 12, // inner edge-darkening band (half is visible)
  glowOpacity: 0.13,
  wobbleFrequency: 0.022,
  wobbleScale: 6,
  wobbleSeed: 11,
} as const;

/** Flat art palette: monkey + garments. Sampled by eye from the references and extended. */
export const art = {
  fur: "#3E2A1E",
  furLight: "#5A3E2C",
  skin: "#E2AE93",
  skinDark: "#C68C72",
  skinDeep: "#A86C58",
  tan: "#D9A86C",
  tanDark: "#BF8B4E",
  pink: "#FFB3D6",
  cream: "#FFF3D6",
  white: "#FFFFFF",
  red: "#E5412D",
  redDark: "#B92E1E",
  mustard: "#F4B400",
  yellow: "#FFD23F",
  green: "#3E9E5A",
  greenDark: "#2C7A43",
  navy: "#26315C",
  terracotta: "#D9673B",
  khaki: "#C9A86A",
  straw: "#EBC56E",
  leather: "#8A5A2B",
  violet: "#8B6CF0",
  olive: "#8C9A3E",
  shirt: "#BFDDF5",
  bottle: "#7FD1E8",
  sky: "#8FD3FF",
  grey: "#9AA4AE",
  snow: "#FFFFFF",
  rain: "#BFE3FF",
  sun: "#FFE15A",
} as const;

/** Weather backgrounds and the text colour that passes WCAG AA on each (tested in tests/unit/theme.test.ts). */
export const sky = {
  clear: { bg: "#FFB227", text: ink, muted: "#2A2116" },
  partly: { bg: "#0563C5", text: "#FFFFFF", muted: "#E6F0FF" },
  overcast: { bg: "#93A5B8", text: ink, muted: "#1D2630" },
  rain: { bg: "#1A3D96", text: "#FFFFFF", muted: "#DCE6FF" },
  snow: { bg: "#CDE7F7", text: ink, muted: "#1C3346" },
  storm: { bg: "#2A1D5E", text: "#FFFFFF", muted: "#E4DDFF" },
  night: { bg: "#111D45", text: "#FFFFFF", muted: "#D9E0FF" },
} as const;

export type SkyKind = keyof typeof sky;

export const ui = {
  ink,
  paper: "#FFF8EC",
  accent: art.pink, // buttons, chips, highlights
  accentInk: ink,
  noteYellow: "#FFE98A",
  notePink: "#FFC9E2",
  noteMint: "#BFF0D4",
  noteSky: "#CDE9FF",
  focus: "#FFFFFF",
  focusRing: ink,
  home: sky.partly.bg,
} as const;

export const radius = { sm: "10px", md: "18px", lg: "28px", blob: "34px 28px 36px 26px" } as const;

export const space = {
  "1": "4px",
  "2": "8px",
  "3": "12px",
  "4": "16px",
  "5": "24px",
  "6": "32px",
  "7": "48px",
  "8": "72px",
} as const;

export const type = {
  xs: "0.8125rem",
  sm: "0.9375rem",
  base: "1.0625rem",
  lg: "1.375rem",
  xl: "clamp(1.9rem, 1.5rem + 2vw, 2.6rem)",
  hero: "clamp(2.4rem, 1.8rem + 3.2vw, 3.6rem)",
} as const;

export const motion = {
  fast: "140ms",
  normal: "260ms",
  pop: "cubic-bezier(.34,1.56,.64,1)",
} as const;

/** Flatten the UI tokens into CSS custom properties. */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {
    "--ink": ink,
    "--line": `${3}px`,
    "--line-thick": `${4}px`,
    "--ease-pop": motion.pop,
    "--dur-fast": motion.fast,
    "--dur-normal": motion.normal,
  };
  for (const [k, v] of Object.entries(ui)) vars[`--ui-${k}`] = v;
  for (const [k, v] of Object.entries(radius)) vars[`--radius-${k}`] = v;
  for (const [k, v] of Object.entries(space)) vars[`--space-${k}`] = v;
  for (const [k, v] of Object.entries(type)) vars[`--text-${k}`] = v;
  return vars;
}
