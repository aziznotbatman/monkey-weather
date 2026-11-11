import { art, stroke } from "@/lib/tokens";
import { ARM_L, ARM_R, ARM_R_WAVE, LEG_L, LEG_R, LIMB, limbPath, pointAt, type Limb } from "./anchors";
import { area, ellipse, line, tube, type Part } from "./parts";

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
  head: 90,
  face: 92,
  expression: 94,
  neck: 96,
  eyes: 100,
  hat: 110,
  fx: 120,
} as const;

export function armsFor(pose: Pose): { left: Limb; right: Limb } {
  return { left: ARM_L, right: pose === "wave" ? ARM_R_WAVE : ARM_R };
}

const HEAD =
  "M296 90 C350 85 406 98 425 141 C441 180 436 238 414 285 C392 329 344 350 300 348 C254 346 209 327 189 284 C167 238 163 176 181 136 C199 100 246 92 296 90Z";

const FACE_MASK =
  "M300 168 C322 149 369 150 381 184 C390 210 385 232 373 246 C397 263 399 303 373 325 C346 345 255 347 228 325 C202 303 204 262 228 246 C214 232 208 207 220 183 C234 151 280 150 300 168Z";

const TORSO =
  "M270 336 C268 352 261 362 246 372 C222 386 213 412 211 452 C207 500 206 542 214 574 C242 592 360 593 388 573 C395 540 393 500 389 452 C387 410 378 386 354 372 C339 362 332 352 330 336Z";

const TAIL =
  "M228 560 C170 600 104 574 96 512 C90 462 136 436 164 458 C186 476 168 506 144 494";

function earPath(cx: number, cy: number, r: number, flip = 1): string {
  // Slightly lopsided circle, flatter on the head side.
  const k = r * 0.56;
  return [
    `M${cx} ${cy - r}`,
    `C${cx + k * flip} ${cy - r} ${cx + r * flip} ${cy - k} ${cx + (r - 3) * flip} ${cy + 2}`,
    `C${cx + (r - 6) * flip} ${cy + k} ${cx + k * flip} ${cy + r - 2} ${cx} ${cy + r - 2}`,
    `C${cx - k * flip} ${cy + r - 1} ${cx - (r + 2) * flip} ${cy + k} ${cx - (r + 1) * flip} ${cy}`,
    `C${cx - r * flip} ${cy - k} ${cx - k * flip} ${cy - r} ${cx} ${cy - r}Z`,
  ].join(" ");
}

export function bodyParts(pose: Pose): Part[] {
  const { left, right } = armsFor(pose);
  const handL = pointAt(left, 1);
  const handR = pointAt(right, 1);
  const parts: Part[] = [
    {
      id: "body-tail",
      z: Z.tail,
      shapes: [tube(TAIL, art.fur, LIMB.tail)],
    },
    {
      id: "body-legs",
      z: Z.legs,
      shapes: [tube(limbPath(LEG_L), art.fur, LIMB.leg), tube(limbPath(LEG_R), art.fur, LIMB.leg)],
    },
    {
      id: "body-feet",
      z: Z.feet,
      shapes: [
        area("M214 736 C214 716 236 708 256 710 C280 712 292 724 290 738 C288 752 262 756 244 754 C226 752 214 748 214 736Z", art.tan),
        area("M312 738 C310 724 322 712 346 710 C366 708 388 716 388 736 C388 748 376 752 358 754 C340 756 314 752 312 738Z", art.tan),
      ],
      details: [
        line("M236 742 L238 752", stroke.fine),
        line("M252 744 L253 754", stroke.fine),
        line("M348 744 L347 754", stroke.fine),
        line("M364 742 L362 752", stroke.fine),
      ],
    },
    {
      id: "body-torso",
      z: Z.torso,
      shapes: [area(TORSO, art.fur)],
      details: [
        // Tan belly patch, drawn as a soft shape without outline.
        { d: "M262 430 C262 404 338 404 338 430 C342 478 334 534 300 540 C266 534 258 478 262 430Z", fill: art.tanDark, stroke: "none", opacity: 0.55 },
        line("M296 470 C300 474 304 474 306 470", stroke.fine),
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
      shapes: [
        area(ellipse(handL[0] - 2, handL[1] + 14, 17, 21), art.tan),
        area(ellipse(handR[0] + 2, handR[1] + (pose === "wave" ? -14 : 14), 17, 21), art.tan),
      ],
      details:
        pose === "wave"
          ? [line(`M${handR[0] - 8} ${handR[1] - 28} l-4 -12`, stroke.fine), line(`M${handR[0] + 4} ${handR[1] - 32} l0 -12`, stroke.fine), line(`M${handR[0] + 15} ${handR[1] - 28} l5 -11`, stroke.fine)]
          : [],
    },
    {
      id: "body-ears",
      z: Z.ears,
      shapes: [area(earPath(146, 236, 50, -1), art.fur), area(earPath(454, 228, 47, 1), art.fur)],
      details: [
        { d: earPath(140, 238, 27, -1), fill: art.tan, stroke: "none" },
        { d: earPath(460, 230, 25, 1), fill: art.tan, stroke: "none" },
      ],
    },
    {
      id: "body-head",
      z: Z.head,
      shapes: [area(HEAD, art.fur)],
      details: [
        // The tuft: three quick marker flicks, like a doodle signature.
        line("M292 92 C288 76 282 66 272 60", stroke.fine),
        line("M300 91 C302 74 306 62 316 54", stroke.fine),
        line("M308 92 C316 80 326 74 338 72", stroke.fine),
      ],
    },
    {
      id: "body-face",
      z: Z.face,
      shapes: [area(FACE_MASK, art.tan)],
      details: [
        // Muzzle curve separating the eye lobes from the snout.
        line("M236 252 C262 240 338 238 366 250", stroke.fine, art.tanDark),
      ],
    },
  ];
  return parts;
}

export const HEAD_PATH = HEAD;
