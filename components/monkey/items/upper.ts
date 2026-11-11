import { art, stroke } from "@/lib/tokens";
import { crossLine, limbPath } from "../anchors";
import { armsFor, Z } from "../body";
import { area, dot, ellipse, line, tube, type Detail, type Shape } from "../parts";
import type { ItemArt } from "./helpers";

const TOP_BODY =
  "M268 338 C284 352 316 352 332 338 C344 356 360 366 374 372 C394 384 400 412 400 452 C402 488 400 518 398 542 C352 556 248 556 202 542 C200 518 198 488 200 452 C200 412 206 384 226 372 C240 366 256 356 268 338Z";

function sleeves(
  pose: Parameters<ItemArt>[0]["pose"],
  t1: number,
  width: number,
  fill: string,
): Shape[] {
  const { left, right } = armsFor(pose);
  return [tube(limbPath(left, 0, t1), fill, width), tube(limbPath(right, 0, t1), fill, width)];
}

function cuffs(
  pose: Parameters<ItemArt>[0]["pose"],
  t: number,
  half: number,
  width: number = stroke.fine,
): Detail[] {
  const { left, right } = armsFor(pose);
  return [line(crossLine(left, t, half), width), line(crossLine(right, t, half), width)];
}

export const tshirt: ItemArt = ({ pose }) => [
  {
    id: "item-tshirt",
    slot: "top",
    z: Z.top,
    shapes: [area(TOP_BODY, art.cream), ...sleeves(pose, 0.34, 46, art.cream)],
    details: [
      line("M276 346 C290 358 310 358 324 346", stroke.fine, art.red),
      // A tiny banana on the chest.
      {
        d: "M322 432 C330 452 356 456 370 438 C366 456 340 466 322 448 C318 442 318 436 322 432Z",
        fill: art.yellow,
        stroke: "#0B0B0B",
        width: stroke.fine,
      },
    ],
  },
];

export const longsleeve: ItemArt = ({ pose }) => {
  const { left, right } = armsFor(pose);
  const stripes = [404, 434, 464, 494, 524].map((y) =>
    line(
      `M${y < 420 ? 214 : 207} ${y} C260 ${y + 6} 340 ${y + 6} ${y < 420 ? 386 : 393} ${y}`,
      9,
      art.navy,
    ),
  );
  const sleeveStripes = [0.3, 0.48, 0.66].flatMap((t) => [
    line(crossLine(left, t, 15), 8, art.navy),
    line(crossLine(right, t, 15), 8, art.navy),
  ]);
  return [
    {
      id: "item-longsleeve",
      slot: "top",
      z: Z.top,
      shapes: [area(TOP_BODY, art.cream), ...sleeves(pose, 0.93, 37, art.cream)],
      details: [...stripes, ...sleeveStripes],
    },
  ];
};

export const sweater: ItemArt = ({ pose }) => {
  const zig = Array.from(
    { length: 13 },
    (_, i) => `${i === 0 ? "M" : "L"}${216 + i * 14} ${i % 2 === 0 ? 452 : 440}`,
  ).join(" ");
  return [
    {
      id: "item-sweater",
      slot: "top",
      z: Z.top,
      shapes: [area(TOP_BODY, art.mustard), ...sleeves(pose, 0.93, 41, art.mustard)],
      details: [
        line(zig, stroke.detail, art.cream),
        line("M206 524 C250 536 350 536 394 524", stroke.fine),
        ...[226, 250, 274, 298, 322, 346, 370].map((x) =>
          line(`M${x} ${x < 300 ? 532 : 532} l0 12`, stroke.fine),
        ),
        line("M272 348 C288 364 312 364 328 348", stroke.fine),
        ...cuffs(pose, 0.84, 19),
      ],
    },
  ];
};

export const hoodie: ItemArt = ({ pose }) => [
  {
    id: "item-hoodie",
    slot: "top",
    z: Z.top,
    shapes: [area(TOP_BODY, art.green), ...sleeves(pose, 0.93, 43, art.green)],
    details: [
      {
        d: "M238 470 C260 460 340 460 362 470 L370 526 C330 534 270 534 230 526Z",
        fill: art.greenDark,
        stroke: "#0B0B0B",
        width: stroke.fine,
      },
      ...cuffs(pose, 0.84, 20),
    ],
  },
  {
    id: "item-hoodie-hood",
    slot: "top",
    z: Z.hood,
    shapes: [
      area(
        "M240 330 C244 300 356 300 360 330 C370 356 342 378 300 378 C258 378 230 356 240 330Z",
        art.green,
      ),
    ],
    details: [
      line("M286 372 C284 390 284 404 282 418", stroke.fine),
      line("M314 372 C316 390 316 404 318 418", stroke.fine),
      dot(ellipse(282, 422, 5, 5), art.cream),
      dot(ellipse(318, 422, 5, 5), art.cream),
    ],
  },
];

export const lightjacket: ItemArt = ({ pose }) => [
  {
    id: "item-lightjacket",
    slot: "outer",
    z: Z.outer,
    shapes: [
      area(
        "M266 334 C252 354 236 366 222 372 C198 384 192 414 192 454 C190 500 192 540 196 566 C226 574 254 576 280 576 L278 420 C276 392 272 362 266 334Z",
        art.terracotta,
      ),
      area(
        "M334 334 C348 354 364 366 378 372 C402 384 408 414 408 454 C410 500 408 540 404 566 C374 574 346 576 320 576 L322 420 C324 392 328 362 334 334Z",
        art.terracotta,
      ),
      ...sleeves(pose, 0.95, 46, art.terracotta),
    ],
    details: [
      // Lapels and hem band.
      line("M266 340 L248 392 L278 404", stroke.fine),
      line("M334 340 L352 392 L322 404", stroke.fine),
      line("M198 552 C226 560 254 562 278 562", stroke.fine),
      line("M402 552 C374 560 346 562 322 562", stroke.fine),
      // Chest pocket.
      line("M340 448 L374 446", stroke.fine),
      ...cuffs(pose, 0.88, 22),
    ],
  },
];

export const raincoat: ItemArt = ({ pose }) => [
  {
    id: "item-raincoat",
    slot: "outer",
    z: Z.outer,
    shapes: [
      area(
        "M266 334 C252 354 236 366 222 372 C198 384 192 416 190 456 C186 510 184 566 180 610 C240 626 360 626 420 610 C416 566 414 510 410 456 C408 416 402 384 378 372 C364 366 348 354 334 334Z",
        art.yellow,
      ),
      ...sleeves(pose, 0.95, 50, art.yellow),
    ],
    details: [
      line("M300 360 L300 618", stroke.fine),
      ...[404, 456, 508, 560].map((y) => dot(ellipse(314, y, 6, 6))),
      line("M266 340 L284 384 L300 362 L316 384 L334 340", stroke.fine),
      line("M222 520 L256 518", stroke.fine),
      line("M344 518 L378 520", stroke.fine),
      ...cuffs(pose, 0.86, 24),
    ],
  },
];

export const puffer: ItemArt = ({ pose }) => {
  const { left, right } = armsFor(pose);
  return [
    {
      id: "item-puffer",
      slot: "outer",
      z: Z.outer,
      shapes: [
        area(
          "M264 328 C248 350 230 360 214 368 C188 382 182 416 182 456 C180 500 182 542 186 576 C240 594 360 594 414 576 C418 542 420 500 418 456 C418 416 412 382 386 368 C370 360 352 350 336 328Z",
          art.red,
        ),
        tube(limbPath(left, 0, 0.94), art.red, 58),
        tube(limbPath(right, 0, 0.94), art.red, 58),
        area("M256 318 C276 340 324 340 344 318 L350 356 C324 372 276 372 250 356Z", art.red),
      ],
      details: [
        line("M190 422 C260 436 340 436 410 422", stroke.fine),
        line("M188 472 C260 486 340 486 412 472", stroke.fine),
        line("M188 524 C260 538 340 538 412 524", stroke.fine),
        line("M300 362 L300 586", stroke.fine),
        ...[0.38, 0.62].flatMap((t) => [
          line(crossLine(left, t, 27, 8), stroke.fine),
          line(crossLine(right, t, 27, 8), stroke.fine),
        ]),
      ],
    },
  ];
};
