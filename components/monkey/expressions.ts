import { art, ink, stroke } from "@/lib/tokens";
import type { UiMood } from "@/lib/wardrobe";
import { Z } from "./body";
import { area, dot, ellipse, line, type Detail, type Part } from "./parts";

/** Small solid oval eyes, close together (like the references). */
const EYES_OPEN: Detail[] = [
  dot("M272 214 C272 202 284 202 284 214 C284 228 272 228 272 214Z"),
  dot("M318 211 C318 199 330 199 330 211 C330 225 318 225 318 211Z"),
];
const NOSTRILS: Detail[] = [
  dot("M285 268 C285 262 296 261 297 267 C297 273 286 274 285 268Z"),
  dot("M305 266 C305 260 316 259 317 265 C317 271 306 272 305 266Z"),
];

function drop(x: number, y: number, s = 1): string {
  return `M${x} ${y} C${x + 9 * s} ${y + 12 * s} ${x + 11 * s} ${y + 20 * s} ${x} ${y + 24 * s} C${x - 11 * s} ${y + 20 * s} ${x - 9 * s} ${y + 12 * s} ${x} ${y}Z`;
}

function face(id: string, details: Detail[]): Part {
  return { id, z: Z.expression, shapes: [], details: [...details, ...NOSTRILS] };
}

function happy(): Part[] {
  return [
    face("expr-happy", [
      ...EYES_OPEN,
      line("M262 296 C280 316 324 316 342 294"),
      // Cheeks: tiny pink accents.
      { d: ellipse(246, 286, 12, 7), fill: art.pink, stroke: "none", opacity: 0.85 },
      { d: ellipse(358, 284, 12, 7), fill: art.pink, stroke: "none", opacity: 0.85 },
    ]),
  ];
}

function shivering(): Part[] {
  return [
    face("expr-shivering", [
      ...EYES_OPEN,
      // Worried brows.
      line("M266 192 L284 186", stroke.fine),
      line("M318 184 L336 190", stroke.fine),
      // Chattering teeth.
      { d: "M266 290 C290 284 316 284 340 290 L338 310 C314 316 290 316 268 310Z", fill: art.white, stroke: ink, width: stroke.fine },
      line("M280 288 L280 312", stroke.fine),
      line("M294 286 L294 314", stroke.fine),
      line("M308 286 L308 314", stroke.fine),
      line("M322 288 L322 312", stroke.fine),
    ]),
    {
      id: "fx-shiver",
      z: Z.fx,
      shapes: [area("M186 300 C176 290 160 292 158 304 C146 302 138 314 146 322 C142 334 158 340 168 332 C176 340 190 334 188 322 C198 318 196 302 186 300Z", art.white)],
      details: [
        line("M158 170 C150 184 150 200 158 214", stroke.detail),
        line("M138 160 C126 182 126 206 138 226", stroke.detail),
        line("M442 160 C450 176 450 194 442 208", stroke.detail),
        line("M462 150 C474 172 474 198 462 218", stroke.detail),
      ],
    },
  ];
}

function soggy(): Part[] {
  return [
    face("expr-soggy", [
      // Droopy half-closed eyes.
      dot("M270 214 C270 206 286 206 286 214 C286 222 270 222 270 214Z"),
      dot("M316 211 C316 203 332 203 332 211 C332 219 316 219 316 211Z"),
      line("M266 204 C272 199 282 199 290 203", stroke.fine),
      line("M312 200 C320 196 330 196 336 201", stroke.fine),
      // Flat, wobbly mouth.
      line("M270 304 C284 298 296 306 308 300 C318 296 328 300 336 304"),
    ]),
    {
      id: "fx-soggy",
      z: Z.fx,
      shapes: [area(drop(218, 140), art.rain), area(drop(392, 150, 0.8), art.rain), area(drop(240, 330, 0.7), art.rain)],
    },
  ];
}

function sweaty(): Part[] {
  return [
    face("expr-sweaty", [
      // Squinting ^ ^ eyes.
      line("M268 218 C272 206 282 206 286 218"),
      line("M314 215 C318 203 328 203 332 215"),
      // Open mouth with tongue.
      { d: "M276 296 C286 292 318 292 328 296 C328 316 312 326 302 326 C290 326 276 316 276 296Z", fill: ink, stroke: "none" },
      { d: "M288 316 C292 306 310 306 314 316 C308 324 294 324 288 316Z", fill: art.pink, stroke: "none" },
    ]),
    {
      id: "fx-sweaty",
      z: Z.fx,
      shapes: [area(drop(206, 168), art.sky), area(drop(404, 186, 0.85), art.sky), area(drop(186, 216, 0.6), art.sky)],
    },
  ];
}

function windblown(): Part[] {
  return [
    face("expr-windblown", [
      line("M268 214 L286 212"),
      line("M316 210 L334 208"),
      { d: ellipse(304, 304, 11, 13), fill: ink, stroke: "none" },
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
      // Eyes looking up and to the right.
      dot("M276 208 C276 197 287 197 287 208 C287 220 276 220 276 208Z"),
      dot("M322 205 C322 194 333 194 333 205 C333 217 322 217 322 205Z"),
      line("M282 302 C296 296 312 300 324 296"),
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
      ...EYES_OPEN,
      line("M264 190 L286 194", stroke.fine),
      line("M316 182 C324 176 334 176 340 180", stroke.fine),
      line("M276 302 C286 296 292 308 302 302 C312 296 318 308 328 302"),
    ]),
    {
      id: "fx-confused",
      z: Z.fx,
      shapes: [],
      details: [
        line("M448 96 C448 72 486 70 486 94 C486 110 466 112 466 128", stroke.detail),
        dot(ellipse(466, 146, 5, 5)),
      ],
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
