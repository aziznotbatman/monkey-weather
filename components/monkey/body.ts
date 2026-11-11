import { art, stroke } from "@/lib/tokens";
import {
  ARM_L,
  ARM_R,
  ARM_R_WAVE,
  LEG_L,
  LEG_R,
  LIMB,
  limbPath,
  pointAt,
  type Limb,
  type Pt,
} from "./anchors";
import { area, ellipse, line, tube, type Detail, type Part } from "./parts";

export type Pose = "stand" | "wave";

/** Z-order of the whole figure (garments slot in between). */
export const Z = {
  carryBack: 5,
  tail: 10,
  legs: 20,
  feet: 22,
  torso: 30,
  bottom: 40,
  footwear: 45,
  arms: 50,
  top: 60,
  hood: 64,
  outer: 70,
  carryFront: 76,
  hands: 80,
  gloves: 82,
  ears: 85,
  /** The scarf wraps the neck *under* the chimp's big chin. */
  neck: 87,
  head: 90,
  face: 92,
  expression: 94,
  eyes: 100,
  hat: 110,
  fx: 120,
} as const;

export function armsFor(pose: Pose): { left: Limb; right: Limb } {
  return { left: ARM_L, right: pose === "wave" ? ARM_R_WAVE : ARM_R };
}

/**
 * The character: an original, slightly ugly, deadpan chimp. Big jug ears, a heavy brow,
 * a long pouty muzzle that sticks out below the skull, tiny tired eyes, long arms, big hands.
 */

/** Dark fur skull, a little lumpy on top. */
const HEAD =
  "M298 98 C328 92 352 96 374 108 C402 122 420 150 424 186 C428 224 420 262 404 290 C388 318 352 336 300 338 C248 336 212 318 196 290 C180 262 172 224 176 186 C180 150 198 122 226 108 C246 98 270 100 298 98Z";

/** Upper face: a darker heart-shaped mask around the deep-set eyes, under a low hairline. */
const FACE =
  "M300 176 C326 164 362 166 378 188 C392 208 390 236 378 256 C364 276 336 282 300 280 C264 282 236 276 222 256 C210 236 208 208 222 188 C238 166 274 164 300 176Z";

/** The big pale muzzle that bulges out below the skull: the funniest part of the face. */
const MUZZLE =
  "M300 240 C346 236 392 254 400 296 C408 344 360 386 300 386 C240 386 192 344 200 296 C208 254 254 236 300 240Z";

/** The heavy brow ridge, sitting on top of the mask. */
const BROW =
  "M220 200 C228 178 264 172 294 188 L300 192 L306 188 C336 172 372 178 380 200 C366 210 346 206 330 206 C316 206 306 210 300 214 C294 210 284 206 270 206 C254 206 234 210 220 200Z";

const TORSO =
  "M270 330 C268 348 260 360 244 370 C220 384 211 412 209 452 C205 500 205 542 213 574 C242 592 360 593 389 573 C396 540 395 500 391 452 C389 410 380 384 356 370 C340 360 332 348 330 330Z";

const TAIL = "M228 560 C170 600 104 574 96 512 C90 462 136 436 164 458 C186 476 168 506 144 494";
/** Chimps have no tail. Flip this if the brief ever wants a "monkey" tail back. */
export const SHOW_TAIL = false;

/** A big round jug ear with the inner fold drawn as one C-shaped line. */
function ear(cx: number, cy: number, r: number, side: -1 | 1): { shape: string; fold: string } {
  const k = r * 0.58;
  const shape = [
    `M${cx} ${cy - r}`,
    `C${cx + k * side} ${cy - r - 2} ${cx + (r + 4) * side} ${cy - k} ${cx + (r + 2) * side} ${cy + 4}`,
    `C${cx + r * side} ${cy + k + 4} ${cx + k * side} ${cy + r} ${cx - 4 * side} ${cy + r - 4}`,
    `C${cx - k * side} ${cy + r - 8} ${cx - r * side} ${cy + k} ${cx - (r - 4) * side} ${cy}`,
    `C${cx - r * side} ${cy - k} ${cx - k * side} ${cy - r} ${cx} ${cy - r}Z`,
  ].join(" ");
  const fold = `M${cx + 6 * side} ${cy - r * 0.55} C${cx + r * 0.62 * side} ${cy - r * 0.45} ${cx + r * 0.66 * side} ${cy + r * 0.3} ${cx + 10 * side} ${cy + r * 0.5}`;
  return { shape, fold };
}

/** Big skin-coloured hand with three finger creases. */
function hand(at: Pt, up: boolean): { shape: string; creases: Detail[] } {
  const [x, y] = at;
  const dy = up ? -1 : 1;
  const cy = y + 22 * dy;
  const shape = `M${x - 20} ${y + 2 * dy} C${x - 26} ${cy} ${x - 20} ${y + 46 * dy} ${x - 4} ${y + 48 * dy} C${x + 10} ${y + 50 * dy} ${x + 24} ${y + 40 * dy} ${x + 22} ${cy} C${x + 22} ${y + 6 * dy} ${x + 10} ${y - 4 * dy} ${x - 20} ${y + 2 * dy}Z`;
  const creases = [-8, 1, 10].map((ox) =>
    line(`M${x + ox} ${y + 30 * dy} L${x + ox} ${y + 42 * dy}`, stroke.fine, art.skinDeep),
  );
  return { shape, creases };
}

const FOOT_L =
  "M204 738 C204 716 228 706 254 708 C280 710 296 722 294 740 C292 756 262 760 240 758 C220 756 204 752 204 738Z";
const FOOT_R =
  "M308 740 C306 722 322 710 348 708 C374 706 398 716 398 738 C398 752 382 756 360 758 C338 760 310 756 308 740Z";

export function bodyParts(pose: Pose): Part[] {
  const { left, right } = armsFor(pose);
  const hl = hand(pointAt(left, 1), false);
  const hr = hand(pointAt(right, 1), pose === "wave");
  const earL = ear(150, 228, 56, -1);
  const earR = ear(452, 224, 53, 1);

  const parts: Part[] = [
    {
      id: "body-legs",
      z: Z.legs,
      shapes: [tube(limbPath(LEG_L), art.fur, LIMB.leg), tube(limbPath(LEG_R), art.fur, LIMB.leg)],
    },
    {
      id: "body-feet",
      z: Z.feet,
      shapes: [area(FOOT_L, art.skin), area(FOOT_R, art.skin)],
      details: [
        line("M226 744 L228 756 M242 746 L243 758 M258 746 L258 757", stroke.fine, art.skinDeep),
        line("M344 746 L344 757 M360 746 L359 758 M376 744 L374 756", stroke.fine, art.skinDeep),
      ],
    },
    {
      id: "body-torso",
      z: Z.torso,
      shapes: [area(TORSO, art.fur)],
      details: [
        // A few scruffy fur flicks so the bare chimp reads as hairy.
        line(
          "M262 420 l8 14 M330 420 l-8 14 M290 480 l6 12 M316 500 l-6 12",
          stroke.fine,
          art.furLight,
        ),
      ],
    },
    {
      id: "body-arms",
      z: Z.arms,
      shapes: [tube(limbPath(left), art.fur, LIMB.arm), tube(limbPath(right), art.fur, LIMB.arm)],
    },
    {
      id: "body-hands",
      z: Z.hands,
      shapes: [area(hl.shape, art.skin), area(hr.shape, art.skin)],
      details: [
        ...hl.creases,
        ...hr.creases,
        ...(pose === "wave"
          ? [
              line(
                `M${pointAt(right, 1)[0] - 30} ${pointAt(right, 1)[1] - 40} l-10 -8 M${pointAt(right, 1)[0] + 30} ${pointAt(right, 1)[1] - 44} l10 -8`,
                stroke.fine,
              ),
            ]
          : []),
      ],
    },
    {
      id: "body-ears",
      z: Z.ears,
      shapes: [area(earL.shape, art.skin), area(earR.shape, art.skin)],
      details: [
        line(earL.fold, stroke.fine, art.skinDeep),
        line(earR.fold, stroke.fine, art.skinDeep),
      ],
    },
    {
      id: "body-head",
      z: Z.head,
      shapes: [area(HEAD, art.fur)],
      details: [
        // Messy hair: a few flicks that stick up, plus scruffy sideburns.
        line("M276 102 C270 86 262 78 250 74", stroke.fine),
        line("M296 99 C296 82 300 70 310 62", stroke.fine),
        line("M314 101 C322 88 334 82 346 82", stroke.fine),
        line("M188 250 l-10 10 M186 270 l-12 6 M412 248 l10 10 M414 268 l12 6", stroke.fine),
      ],
    },
    {
      id: "body-face",
      z: Z.face,
      shapes: [area(FACE, art.skinDark)],
      details: [
        // Deep eye sockets, then the brow ridge over them.
        { d: ellipse(277, 222, 17, 13), fill: art.skinDeep, stroke: "none" },
        { d: ellipse(323, 220, 17, 13), fill: art.skinDeep, stroke: "none" },
        { d: BROW, fill: art.skinDeep, stroke: "none" },
        line("M222 202 C240 210 268 208 292 210", stroke.fine),
        line("M308 208 C332 208 360 210 378 200", stroke.fine),
      ],
    },
    {
      id: "body-muzzle",
      z: Z.face + 1,
      shapes: [area(MUZZLE, art.skin)],
      details: [
        // Nose bump and the wrinkles across the long upper lip.
        line("M284 254 C292 262 308 262 316 254", stroke.fine, art.skinDeep),
        line("M238 288 C266 300 334 300 362 286", 3.5, art.skinDeep),
        line("M246 304 C272 314 328 314 354 302", 3.5, art.skinDeep),
      ],
    },
  ];
  if (SHOW_TAIL)
    parts.unshift({ id: "body-tail", z: Z.tail, shapes: [tube(TAIL, art.fur, LIMB.tail)] });
  return parts;
}

/** Shared face anchors for expressions (after the redesign). */
export const FACE_ANCHORS = {
  eyeL: [277, 220] as Pt,
  eyeR: [323, 218] as Pt,
  mouthY: 330,
  nostrilY: 268,
} as const;

/** Exported for the design sheet and tests. */
export const HEAD_PATH = HEAD;
export const FACE_PATH = FACE;
export const MUZZLE_PATH = MUZZLE;
export { ellipse };
