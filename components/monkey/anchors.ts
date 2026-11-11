/**
 * The monkey's skeleton for viewBox "0 0 600 800".
 * Every garment is authored against these points so layers line up.
 *
 *            headTop (300,90)
 *     earL ●  ( head )  ● earR          ear line  y≈232
 *              chin (300,348)
 *     shoulderL ── neck ── shoulderR    y≈372–384
 *       |        torso        |
 *     handL     waist y≈540   handR
 *              hip y≈575
 *          kneeL     kneeR              y≈640
 *         ankleL     ankleR             y≈712
 *          footL     footR              y≈732
 */

export type Pt = readonly [number, number];

/** A limb is a quadratic curve: start → control → end. */
export interface Limb {
  s: Pt;
  c: Pt;
  e: Pt;
}

export const VIEWBOX = { w: 600, h: 800 } as const;

export const A = {
  headTop: [300, 90] as Pt,
  headCenter: [300, 215] as Pt,
  chin: [300, 348] as Pt,
  earL: [146, 236] as Pt,
  earR: [454, 228] as Pt,
  eyeL: [278, 214] as Pt,
  eyeR: [324, 211] as Pt,
  nostrilL: [291, 268] as Pt,
  nostrilR: [311, 266] as Pt,
  mouth: [302, 302] as Pt,
  neck: [300, 345] as Pt,
  shoulderL: [236, 384] as Pt,
  shoulderR: [364, 384] as Pt,
  waistY: 540,
  hipY: 575,
  kneeY: 640,
  ankleY: 712,
  footL: [252, 734] as Pt,
  footR: [350, 734] as Pt,
  tailBase: [226, 556] as Pt,
} as const;

/** Limb thickness (fur), in viewBox units. */
export const LIMB = { arm: 30, leg: 48, tail: 17 } as const;

/** Long chimp arms: the hands hang down by the knees. */
export const ARM_L: Limb = { s: [238, 388], c: [196, 500], e: [190, 626] };
export const ARM_R: Limb = { s: [362, 388], c: [404, 500], e: [410, 626] };
/** Waving pose (landing screen). */
export const ARM_R_WAVE: Limb = { s: [366, 388], c: [444, 380], e: [486, 272] };

export const LEG_L: Limb = { s: [264, 560], c: [259, 640], e: [256, 712] };
export const LEG_R: Limb = { s: [336, 560], c: [341, 640], e: [346, 712] };

function lerp(a: Pt, b: Pt, t: number): Pt {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function pointAt(l: Limb, t: number): Pt {
  return lerp(lerp(l.s, l.c, t), lerp(l.c, l.e, t), t);
}

/** Unit tangent of the limb at t. */
export function tangentAt(l: Limb, t: number): Pt {
  const dx = 2 * (1 - t) * (l.c[0] - l.s[0]) + 2 * t * (l.e[0] - l.c[0]);
  const dy = 2 * (1 - t) * (l.c[1] - l.s[1]) + 2 * t * (l.e[1] - l.c[1]);
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

const f = (n: number) => Math.round(n * 10) / 10;

/** SVG path for the portion of a limb between t0 and t1 (de Casteljau split). */
export function limbPath(l: Limb, t0 = 0, t1 = 1): string {
  const p0 = pointAt(l, t0);
  const p2 = pointAt(l, t1);
  // Control point of the sub-curve is the quadratic blossom B(t0, t1).
  const w0 = (1 - t0) * (1 - t1);
  const w1 = (1 - t0) * t1 + t0 * (1 - t1);
  const w2 = t0 * t1;
  const ctrl: Pt = [
    w0 * l.s[0] + w1 * l.c[0] + w2 * l.e[0],
    w0 * l.s[1] + w1 * l.c[1] + w2 * l.e[1],
  ];
  return `M${f(p0[0])} ${f(p0[1])} Q${f(ctrl[0])} ${f(ctrl[1])} ${f(p2[0])} ${f(p2[1])}`;
}

/** A short line across the limb at t (cuffs, hems, seams). */
export function crossLine(l: Limb, t: number, halfWidth: number, bend = 3): string {
  const p = pointAt(l, t);
  const [tx, ty] = tangentAt(l, t);
  const nx = -ty;
  const ny = tx;
  const a: Pt = [p[0] + nx * halfWidth, p[1] + ny * halfWidth];
  const b: Pt = [p[0] - nx * halfWidth, p[1] - ny * halfWidth];
  const m: Pt = [p[0] + tx * bend, p[1] + ty * bend];
  return `M${f(a[0])} ${f(a[1])} Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}`;
}
