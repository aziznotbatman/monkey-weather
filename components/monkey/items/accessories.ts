import { art, ink, stroke } from "@/lib/tokens";
import { crossLine, pointAt } from "../anchors";
import { armsFor, Z } from "../body";
import { area, dot, ellipse, line, tube } from "../parts";
import type { ItemArt } from "./helpers";

export const beanie: ItemArt = () => [
  {
    id: "item-beanie",
    slot: "head",
    z: Z.hat,
    shapes: [
      area("M174 160 C172 100 228 62 300 60 C372 60 428 98 432 160Z", art.green),
      area(
        "M168 178 C168 162 170 150 176 142 C250 126 352 126 428 142 C432 150 436 162 436 178 C356 160 246 160 168 178Z",
        art.cream,
      ),
      area(ellipse(302, 52, 23, 21), art.pink),
    ],
    details: [
      ...[200, 230, 262, 296, 330, 364, 398].map((x) =>
        line(
          `M${x} ${146 + Math.abs(300 - x) / 18} l0 ${16 - Math.abs(300 - x) / 40}`,
          stroke.fine,
        ),
      ),
      line("M246 92 C256 110 262 122 264 134", stroke.fine, art.greenDark),
      line("M354 92 C344 110 338 122 336 134", stroke.fine, art.greenDark),
    ],
  },
];

export const cap: ItemArt = () => [
  {
    id: "item-cap",
    slot: "head",
    z: Z.hat,
    shapes: [
      area(
        "M184 154 C186 98 236 70 300 70 C364 70 414 98 418 154 C340 142 262 142 184 154Z",
        art.red,
      ),
      area(
        "M196 150 C250 132 352 132 406 150 C414 166 400 180 384 180 C330 168 270 168 216 180 C200 180 188 166 196 150Z",
        art.redDark,
      ),
    ],
    details: [
      line("M300 74 L300 140", stroke.fine),
      dot(ellipse(300, 68, 8, 6)),
      line("M246 86 C256 104 262 124 262 142", stroke.fine),
    ],
  },
];

export const sunhat: ItemArt = () => [
  {
    id: "item-sunhat-brim",
    slot: "head",
    z: Z.hat,
    shapes: [
      area(
        "M106 160 C106 128 196 112 300 112 C404 112 494 128 494 160 C494 186 404 196 300 196 C196 196 106 186 106 160Z",
        art.straw,
      ),
    ],
  },
  {
    id: "item-sunhat",
    slot: "head",
    z: Z.hat + 1,
    shapes: [
      area(
        "M202 152 C198 96 240 62 300 62 C360 62 402 96 398 152 C340 162 260 162 202 152Z",
        art.straw,
      ),
    ],
    details: [
      {
        d: "M203 132 C260 142 340 142 397 132 L398 150 C340 160 260 160 202 150Z",
        fill: art.red,
        stroke: ink,
        width: stroke.fine,
      },
      line("M150 168 C200 180 260 184 300 184", stroke.fine, "#B8913E"),
      line("M450 168 C400 180 340 184 300 184", stroke.fine, "#B8913E"),
    ],
  },
];

export const sunglasses: ItemArt = () => [
  {
    id: "item-sunglasses",
    slot: "eyes",
    z: Z.eyes,
    shapes: [
      area(
        "M250 200 C250 188 300 188 300 200 C300 224 290 236 276 236 C260 236 250 222 250 200Z",
        ink,
        false,
      ),
      area(
        "M302 197 C302 185 352 185 352 197 C352 221 342 233 328 233 C312 233 302 219 302 197Z",
        ink,
        false,
      ),
    ],
    details: [
      line("M252 198 L190 190", stroke.detail),
      line("M350 194 L414 184", stroke.detail),
      line("M262 204 C264 198 270 196 276 196", stroke.fine, art.white),
      line("M314 201 C316 195 322 193 328 193", stroke.fine, art.white),
    ],
  },
];

export const scarf: ItemArt = () => [
  {
    id: "item-scarf",
    slot: "neck",
    z: Z.neck,
    shapes: [
      area(
        "M318 370 L354 364 C358 400 362 436 366 472 L330 478 C326 442 322 406 318 370Z",
        art.red,
      ),
      area(
        "M244 334 C266 358 334 360 358 334 C368 348 368 368 358 382 C332 398 270 398 244 382 C234 368 234 348 244 334Z",
        art.red,
      ),
    ],
    details: [
      line("M262 354 L254 386", 10, art.cream),
      line("M296 360 L294 394", 10, art.cream),
      line("M332 356 L338 388", 10, art.cream),
      line("M322 410 L358 404", 10, art.cream),
      line("M326 444 L362 438", 10, art.cream),
      line("M334 478 L332 494 M344 477 L344 494 M354 476 L356 492 M363 474 L366 490", stroke.fine),
    ],
  },
];

export const gloves: ItemArt = ({ pose }) => {
  const { left, right } = armsFor(pose);
  const hl = pointAt(left, 1);
  const hr = pointAt(right, 1);
  const ry = pose === "wave" ? -14 : 14;
  return [
    {
      id: "item-gloves",
      slot: "hands",
      z: Z.gloves,
      shapes: [
        area(ellipse(hl[0] - 2, hl[1] + 16, 22, 25), art.green),
        area(ellipse(hl[0] + 16, hl[1] + 10, 9, 12), art.green),
        area(ellipse(hr[0] + 2, hr[1] + ry + 2, 22, 25), art.green),
        area(ellipse(hr[0] - 16, hr[1] + ry - 4, 9, 12), art.green),
      ],
      details: [
        line(crossLine(left, 0.97, 20), 9, art.cream),
        line(crossLine(right, 0.97, 20), 9, art.cream),
      ],
    },
  ];
};

export const umbrella: ItemArt = ({ pose }) => {
  const hand = pointAt(armsFor(pose).right, 1);
  const hx = Math.round(hand[0] + 4);
  const hy = Math.round(hand[1]);
  return [
    {
      id: "item-umbrella-canopy",
      slot: "carry",
      z: Z.carryBack,
      shapes: [
        area(
          "M314 178 C314 98 374 48 446 48 C518 48 578 98 578 178 C562 166 544 166 528 178 C512 166 494 166 478 178 C462 166 446 166 446 178 C430 166 414 166 398 178 C382 166 364 166 348 178 C336 168 324 168 314 178Z",
          art.red,
        ),
      ],
      details: [
        {
          d: "M446 50 C420 80 404 130 398 178 C414 166 430 166 446 178 C462 166 478 166 494 178 C488 130 472 80 446 50Z",
          fill: art.cream,
          stroke: ink,
          width: stroke.fine,
        },
        line("M446 48 L446 26", stroke.detail),
      ],
    },
    {
      id: "item-umbrella-handle",
      slot: "carry",
      z: Z.carryFront,
      shapes: [
        tube(
          `M446 176 L${hx} ${hy} L${hx} ${hy + 40} C${hx} ${hy + 62} ${hx - 26} ${hy + 62} ${hx - 26} ${hy + 44}`,
          art.leather,
          8,
          false,
        ),
      ],
    },
  ];
};
