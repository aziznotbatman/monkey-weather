import { art, ink, stroke } from "@/lib/tokens";
import type { UiMood } from "@/lib/wardrobe";
import { Z } from "./body";
import { area, dot, ellipse, line, type Detail, type Part } from "./parts";

/**
 * Chimp faces. The humour is in the deadpan: tiny eyes under heavy lids, a long upper lip,
 * a pouty lower lip. Small changes in lids and mouth carry the whole mood.
 */

const eyeBall = (x: number, y: number, rx = 7, ry = 9): Detail => dot(ellipse(x, y, rx, ry));
const glint = (x: number, y: number): Detail => dot(ellipse(x + 2.5, y - 3, 2.2, 2.2), art.white);
const eye = (x: number, y: number, rx = 7, ry = 9): Detail[] => [eyeBall(x, y, rx, ry), glint(x, y)];
const EYES: Detail[] = [...eye(277, 222), ...eye(323, 220)];
/** Half-closed lids: a skin-coloured cap with an ink edge over the top of each eye. */
const LIDS: Detail[] = [
  { d: "M266 222 C266 208 288 208 288 222 Z", fill: art.skinDark, stroke: "none" },
  { d: "M312 220 C312 206 334 206 334 220 Z", fill: art.skinDark, stroke: "none" },
  line("M265 221 C272 217 282 217 289 221", stroke.fine),
  line("M311 219 C318 215 328 215 335 219", stroke.fine),
];
const NOSTRILS: Detail[] = [
  dot("M287 268 C287 262 296 262 297 268 C297 273 288 274 287 268Z"),
  dot("M303 267 C303 261 312 261 313 266 C313 272 304 273 303 267Z"),
];
/** The pouty lower lip that makes the face. */
const lowerLip = (y = 344): Detail => ({
  d: `M262 ${y - 10} C276 ${y + 8} 324 ${y + 8} 338 ${y - 10} C324 ${y - 2} 276 ${y - 2} 262 ${y - 10}Z`,
  fill: art.skinDark,
  stroke: ink,
  width: stroke.fine,
});

function drop(x: number, y: number, s = 1): string {
  return `M${x} ${y} C${x + 9 * s} ${y + 12 * s} ${x + 11 * s} ${y + 20 * s} ${x} ${y + 24 * s} C${x - 11 * s} ${y + 20 * s} ${x - 9 * s} ${y + 12 * s} ${x} ${y}Z`;
}

function face(id: string, details: Detail[]): Part {
  return { id, z: Z.expression, shapes: [], details: [...NOSTRILS, ...details] };
}

/** Happy, chimp-style: a smug closed-mouth grin, lids at half mast. */
function happy(): Part[] {
  return [
    face("expr-happy", [
      ...EYES,
      ...LIDS,
      line("M240 318 C268 344 332 344 362 314"),
      line("M236 312 C238 318 240 320 244 322", stroke.fine),
      line("M366 308 C364 314 362 318 358 320", stroke.fine),
    ]),
  ];
}

function shivering(): Part[] {
  return [
    face("expr-shivering", [
      ...eye(277, 222, 8, 11),
      ...eye(323, 220, 8, 11),
      // Teeth bared and chattering.
      { d: "M244 318 C276 308 324 308 356 318 L352 344 C320 354 280 354 248 344Z", fill: art.white, stroke: ink, width: stroke.fine },
      line("M262 316 L264 348 M282 312 L282 352 M300 311 L300 353 M318 312 L318 352 M338 316 L336 348", 3.5),
      line("M246 331 C280 336 320 336 354 331", 3.5),
    ]),
    {
      id: "fx-shiver",
      z: Z.fx,
      shapes: [
        area("M196 336 C186 326 168 328 166 340 C152 338 144 352 154 360 C150 374 168 380 178 370 C188 380 204 372 200 360 C212 354 208 336 196 336Z", art.white),
      ],
      details: [
        line("M112 176 C102 196 102 218 112 238", stroke.detail),
        line("M92 164 C78 192 78 222 92 248", stroke.detail),
        line("M488 172 C498 192 498 214 488 234", stroke.detail),
        line("M508 160 C522 188 522 220 508 246", stroke.detail),
      ],
    },
  ];
}

function soggy(): Part[] {
  return [
    face("expr-soggy", [
      ...EYES,
      // Lids almost shut: deeply unimpressed.
      { d: "M265 224 C265 206 289 206 289 224 Z", fill: art.skinDark, stroke: "none" },
      { d: "M311 222 C311 204 335 204 335 222 Z", fill: art.skinDark, stroke: "none" },
      line("M264 224 L290 223", stroke.fine),
      line("M310 222 L336 221", stroke.fine),
      line("M248 330 C270 316 330 316 352 330"),
      lowerLip(352),
    ]),
    {
      id: "fx-soggy",
      z: Z.fx,
      shapes: [area(drop(218, 128), art.rain), area(drop(384, 136, 0.8), art.rain), area(drop(206, 352, 0.7), art.rain)],
    },
  ];
}

function sweaty(): Part[] {
  return [
    face("expr-sweaty", [
      line("M266 224 C270 212 284 212 288 224"),
      line("M312 222 C316 210 330 210 334 222"),
      // Panting: mouth open, tongue out.
      { d: "M256 316 C276 310 324 310 344 316 C344 342 324 356 300 356 C276 356 256 342 256 316Z", fill: ink, stroke: "none" },
      { d: "M282 340 C284 326 316 326 318 340 C318 362 306 370 300 370 C294 370 282 362 282 340Z", fill: art.pink, stroke: ink, width: stroke.fine },
      line("M300 334 L300 356", 3, "#D27A9C"),
    ]),
    {
      id: "fx-sweaty",
      z: Z.fx,
      shapes: [area(drop(206, 150), art.sky), area(drop(400, 170, 0.85), art.sky), area(drop(186, 206, 0.6), art.sky)],
    },
  ];
}

/** The chimp "ooh": lips pushed out into a ring. Wind makes everyone do it. */
function windblown(): Part[] {
  return [
    face("expr-windblown", [
      line("M266 222 L289 219"),
      line("M311 218 L334 216"),
      { d: ellipse(300, 332, 24, 20), fill: art.skinDark, stroke: ink, width: stroke.detail },
      { d: ellipse(300, 332, 9, 8), fill: ink, stroke: "none" },
    ]),
    {
      id: "fx-windblown",
      z: Z.fx,
      shapes: [],
      details: [
        line("M24 132 C64 120 96 140 136 128 C156 122 158 100 142 98", stroke.detail, art.cream),
        line("M470 112 C500 102 528 118 580 108", stroke.detail, art.cream),
        line("M40 380 C70 372 96 386 126 378", stroke.detail, art.cream),
      ],
    },
  ];
}

function thinking(): Part[] {
  return [
    face("expr-thinking", [
      ...eye(281, 216),
      ...eye(327, 214),
      line("M266 210 C272 206 282 206 288 208", stroke.fine),
      // Lips pushed to one side.
      line("M268 334 C286 326 310 330 334 322"),
      lowerLip(348),
    ]),
    {
      id: "fx-thought",
      z: Z.fx,
      shapes: [
        area(ellipse(432, 116, 9, 9), art.white),
        area(ellipse(456, 86, 14, 13), art.white),
        area("M470 66 C460 40 488 18 512 30 C524 8 562 12 566 38 C592 40 598 74 578 86 C584 110 552 122 536 108 C522 124 488 118 488 98 C462 98 456 76 470 66Z", art.white),
      ],
      details: [line("M494 72 C504 54 512 88 522 64 C530 46 540 90 552 62", stroke.fine)],
    },
  ];
}

function confused(): Part[] {
  return [
    face("expr-confused", [
      ...eye(277, 222, 5.5, 7),
      ...eye(323, 219, 8.5, 11),
      line("M262 206 L290 210", stroke.fine),
      line("M310 200 C320 192 334 192 342 198", stroke.fine),
      line("M252 332 C266 322 280 342 296 330 C312 320 324 340 346 328"),
    ]),
    {
      id: "fx-confused",
      z: Z.fx,
      shapes: [],
      details: [line("M452 96 C452 72 490 70 490 94 C490 110 470 112 470 128", stroke.detail), dot(ellipse(470, 146, 5, 5))],
    },
  ];
}

export function expressionParts(mood: UiMood): Part[] {
  switch (mood) {
    case "shivering":
      return shivering();
    case "soggy":
      return soggy();
    case "sweaty":
      return sweaty();
    case "windblown":
      return windblown();
    case "thinking":
      return thinking();
    case "confused":
      return confused();
    default:
      return happy();
  }
}
