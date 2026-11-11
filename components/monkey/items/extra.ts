import { art, ink, stroke } from "@/lib/tokens";
import { crossLine, LEG_L, LEG_R, limbPath, pointAt } from "../anchors";
import { armsFor, Z } from "../body";
import { area, dot, ellipse, line, tube, type Detail, type Shape } from "../parts";
import type { ItemArt } from "./helpers";

/** Garments added in the second wardrobe pass. Same skeleton, same line rules as the rest. */

type PoseArg = Parameters<ItemArt>[0]["pose"];

const TOP_BODY =
  "M268 338 C284 352 316 352 332 338 C344 356 360 366 374 372 C394 384 400 412 400 452 C402 488 400 518 398 542 C352 556 248 556 202 542 C200 518 198 488 200 452 C200 412 206 384 226 372 C240 366 256 356 268 338Z";

const WAIST =
  "M210 538 C250 546 350 546 390 538 C394 560 396 584 394 606 L304 608 L296 608 L206 606 C204 584 206 560 210 538Z";

function sleeves(pose: PoseArg, t1: number, width: number, fill: string): Shape[] {
  const { left, right } = armsFor(pose);
  return [tube(limbPath(left, 0, t1), fill, width), tube(limbPath(right, 0, t1), fill, width)];
}

function cuffs(pose: PoseArg, t: number, half: number, width: number = stroke.fine): Detail[] {
  const { left, right } = armsFor(pose);
  return [line(crossLine(left, t, half), width), line(crossLine(right, t, half), width)];
}

/** Big fluffy muffs clamped over the jug ears. The ears still stick out. Of course they do. */
export const earmuffs: ItemArt = () => [
  {
    id: "item-earmuffs-band",
    slot: "head",
    z: Z.hat,
    shapes: [tube("M156 186 C150 52 450 46 448 182", art.navy, 16)],
  },
  {
    id: "item-earmuffs",
    slot: "head",
    z: Z.hat + 1,
    shapes: [area(ellipse(150, 230, 44, 50), art.pink), area(ellipse(452, 226, 42, 48), art.pink)],
    details: [
      line("M128 206 C120 222 120 240 128 254", stroke.fine, "#E07FAE"),
      line("M146 196 C136 220 136 246 146 266", stroke.fine, "#E07FAE"),
      line("M474 202 C482 218 482 236 474 250", stroke.fine, "#E07FAE"),
      line("M456 192 C466 216 466 242 456 262", stroke.fine, "#E07FAE"),
    ],
  },
];

/** Smart light-blue shirt, sleeves rolled to the elbow. */
export const shirt: ItemArt = ({ pose }) => [
  {
    id: "item-shirt",
    slot: "top",
    z: Z.top,
    shapes: [
      area(TOP_BODY, art.shirt),
      ...sleeves(pose, 0.56, 44, art.shirt),
      area("M268 338 L252 376 L296 360Z", art.white),
      area("M332 338 L348 376 L304 360Z", art.white),
    ],
    details: [
      line("M300 360 L300 548", stroke.fine),
      ...[396, 436, 476, 516].map((y) => dot(ellipse(310, y, 5, 5), art.white)),
      ...[396, 436, 476, 516].map((y) => line(ellipse(310, y, 5, 5), 3)),
      line("M330 420 L364 420 L364 452 L330 452Z", stroke.fine),
      ...cuffs(pose, 0.5, 22, stroke.detail),
    ],
  },
];

/** Thin violet shell with a cream chest band: wind and drizzle, not real rain. */
export const windbreaker: ItemArt = ({ pose }) => [
  {
    id: "item-windbreaker",
    slot: "outer",
    z: Z.outer,
    shapes: [
      area(
        "M266 334 C252 354 236 366 222 372 C198 384 192 416 190 456 C188 500 188 548 190 580 C240 594 360 594 410 580 C412 548 412 500 410 456 C408 416 402 384 378 372 C364 366 348 354 334 334Z",
        art.violet,
      ),
      ...sleeves(pose, 0.95, 48, art.violet),
    ],
    details: [
      {
        d: "M194 438 C260 452 340 452 406 438 L408 468 C340 482 260 482 192 468Z",
        fill: art.cream,
        stroke: ink,
        width: stroke.fine,
      },
      line("M300 348 L300 586", stroke.fine),
      line("M300 372 L312 380 L312 398", stroke.fine),
      line("M194 566 C260 580 340 580 406 566", stroke.fine),
      line("M266 340 C276 352 324 352 334 340", stroke.fine),
      ...cuffs(pose, 0.88, 23),
    ],
  },
];

/** Olive puffer vest: warm core, free arms. */
export const vest: ItemArt = () => [
  {
    id: "item-vest",
    slot: "outer",
    z: Z.outer,
    shapes: [
      area(
        "M262 330 C252 350 242 360 234 366 C214 378 208 410 206 450 C204 500 206 544 208 578 C250 592 350 592 392 578 C394 544 396 500 394 450 C392 410 386 378 366 366 C358 360 348 350 338 330Z",
        art.olive,
      ),
      area("M258 320 C278 340 322 340 342 320 L348 354 C322 368 278 368 252 354Z", art.olive),
    ],
    details: [
      line("M212 424 C262 438 338 438 388 424", stroke.fine),
      line("M210 476 C262 490 338 490 390 476", stroke.fine),
      line("M210 528 C262 542 338 542 390 528", stroke.fine),
      line("M300 358 L300 586", stroke.fine),
      line("M236 370 C228 392 222 410 214 420", stroke.fine),
      line("M364 370 C372 392 378 410 386 420", stroke.fine),
    ],
  },
];

/** Yellow waterproof trousers (pairs with the raincoat for the full fisherman look). */
export const rainpants: ItemArt = () => [
  {
    id: "item-rainpants",
    slot: "bottom",
    z: Z.bottom,
    shapes: [
      area(WAIST, art.yellow),
      tube(limbPath(LEG_L, 0, 0.97), art.yellow, 68),
      tube(limbPath(LEG_R, 0, 0.97), art.yellow, 68),
    ],
    details: [
      line("M300 556 L300 612", stroke.fine),
      line(crossLine(LEG_L, 0.78, 33, 2), 10, art.grey),
      line(crossLine(LEG_R, 0.78, 33, 2), 10, art.grey),
      line("M214 552 C250 560 350 560 386 552", stroke.fine),
    ],
  },
];

/** Water bottle in the right hand (the hand is drawn over it, so he's holding it). */
export const bottle: ItemArt = ({ pose }) => {
  const hand = pointAt(armsFor(pose).right, 1);
  const x = Math.round(hand[0] + 4);
  const top = Math.round(hand[1] - 76);
  const bottom = Math.round(hand[1] + 54);
  return [
    {
      id: "item-bottle",
      slot: "carry",
      z: Z.carryFront,
      shapes: [
        area(
          `M${x - 22} ${top + 20} C${x - 22} ${top} ${x + 22} ${top} ${x + 22} ${top + 20} L${x + 22} ${bottom - 10} C${x + 22} ${bottom + 2} ${x - 22} ${bottom + 2} ${x - 22} ${bottom - 10}Z`,
          art.bottle,
        ),
        area(
          `M${x - 13} ${top - 18} L${x + 13} ${top - 18} L${x + 13} ${top + 4} L${x - 13} ${top + 4}Z`,
          art.navy,
        ),
      ],
      details: [
        line(
          `M${x - 19} ${top + 34} C${x - 8} ${top + 26} ${x + 8} ${top + 42} ${x + 19} ${top + 34}`,
          stroke.fine,
          art.white,
        ),
        line(`M${x - 11} ${top + 52} L${x - 11} ${bottom - 18}`, stroke.fine, art.white),
      ],
    },
  ];
};
