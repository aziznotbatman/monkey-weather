import { art, stroke } from "@/lib/tokens";
import { crossLine, LEG_L, LEG_R, limbPath } from "../anchors";
import { Z } from "../body";
import { area, line, tube } from "../parts";
import { FEET_AXIS, mirrorX, type ItemArt } from "./helpers";

const WAIST =
  "M210 538 C250 546 350 546 390 538 C394 560 396 584 394 606 L304 608 L296 608 L206 606 C204 584 206 560 210 538Z";

export const shorts: ItemArt = () => [
  {
    id: "item-shorts",
    slot: "bottom",
    z: Z.bottom,
    shapes: [
      area(WAIST, art.khaki),
      tube(limbPath(LEG_L, 0, 0.36), art.khaki, 66),
      tube(limbPath(LEG_R, 0, 0.36), art.khaki, 66),
    ],
    details: [
      line("M300 556 L300 610", stroke.fine),
      line("M226 560 C236 572 246 576 258 576", stroke.fine),
      line("M374 560 C364 572 354 576 342 576", stroke.fine),
      line(crossLine(LEG_L, 0.3, 31, 2), stroke.fine),
      line(crossLine(LEG_R, 0.3, 31, 2), stroke.fine),
    ],
  },
];

export const trousers: ItemArt = () => [
  {
    id: "item-trousers",
    slot: "bottom",
    z: Z.bottom,
    shapes: [
      area(WAIST, art.navy),
      tube(limbPath(LEG_L, 0, 0.97), art.navy, 60),
      tube(limbPath(LEG_R, 0, 0.97), art.navy, 60),
    ],
    details: [
      line("M300 556 L300 612", stroke.fine, "#6C7AB0"),
      line("M226 560 C236 572 246 576 258 576", stroke.fine, "#6C7AB0"),
      line("M374 560 C364 572 354 576 342 576", stroke.fine, "#6C7AB0"),
    ],
  },
];

const SNEAKER =
  "M206 738 C204 712 230 698 256 700 C284 702 298 718 296 740 C296 756 262 762 240 760 C220 758 206 752 206 738Z";

export const sneakers: ItemArt = () => [
  {
    id: "item-sneakers",
    slot: "footwear",
    z: Z.footwear,
    shapes: [area(SNEAKER, art.white), area(mirrorX(SNEAKER, FEET_AXIS), art.white)],
    details: [
      line("M208 744 C236 752 270 752 296 742", stroke.fine),
      line(mirrorX("M208 744 C236 752 270 752 296 742", FEET_AXIS), stroke.fine),
      line("M236 716 L262 712 M238 726 L266 722", stroke.fine),
      line(mirrorX("M236 716 L262 712 M238 726 L266 722", FEET_AXIS), stroke.fine),
      line("M270 734 C278 728 284 728 290 732", 6, art.red),
      line(mirrorX("M270 734 C278 728 284 728 290 732", FEET_AXIS), 6, art.red),
    ],
  },
];

const BOOT =
  "M212 742 C210 722 220 708 228 700 L230 662 L286 662 L286 700 C300 712 300 730 298 744 C296 758 262 762 238 760 C220 758 212 754 212 742Z";

export const boots: ItemArt = () => [
  {
    id: "item-boots",
    slot: "footwear",
    z: Z.footwear,
    shapes: [area(BOOT, art.leather), area(mirrorX(BOOT, FEET_AXIS), art.leather)],
    details: [
      line("M230 676 L286 676", stroke.fine),
      line(mirrorX("M230 676 L286 676", FEET_AXIS), stroke.fine),
      line("M214 746 C240 754 274 754 298 746", stroke.fine),
      line(mirrorX("M214 746 C240 754 274 754 298 746", FEET_AXIS), stroke.fine),
    ],
  },
];

const RAINBOOT =
  "M212 744 C210 724 222 710 226 700 L222 636 L290 636 L290 702 C302 714 302 732 300 746 C298 760 262 764 238 762 C220 760 212 756 212 744Z";

export const rainboots: ItemArt = () => [
  {
    id: "item-rainboots",
    slot: "footwear",
    z: Z.footwear,
    shapes: [area(RAINBOOT, art.green), area(mirrorX(RAINBOOT, FEET_AXIS), art.green)],
    details: [
      line("M224 656 L290 656", stroke.fine),
      line(mirrorX("M224 656 L290 656", FEET_AXIS), stroke.fine),
      line("M214 748 C240 756 274 756 300 748", stroke.fine),
      line(mirrorX("M214 748 C240 756 274 756 300 748", FEET_AXIS), stroke.fine),
      line("M240 676 L244 690", stroke.fine, "#BFF0D4"),
      line(mirrorX("M240 676 L244 690", FEET_AXIS), stroke.fine, "#BFF0D4"),
    ],
  },
];

const SANDAL_SOLE = "M208 750 C228 760 278 760 294 748 L296 756 C280 770 226 770 208 760Z";

export const sandals: ItemArt = () => [
  {
    id: "item-sandals",
    slot: "footwear",
    z: Z.footwear,
    shapes: [
      area(SANDAL_SOLE, art.leather),
      area(mirrorX(SANDAL_SOLE, FEET_AXIS), art.leather),
      tube("M220 724 C240 716 270 716 288 726", art.terracotta, 9),
      tube(mirrorX("M220 724 C240 716 270 716 288 726", FEET_AXIS), art.terracotta, 9),
      tube("M222 744 C228 734 238 730 248 730", art.terracotta, 8),
      tube(mirrorX("M222 744 C228 734 238 730 248 730", FEET_AXIS), art.terracotta, 8),
    ],
  },
];
