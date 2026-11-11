import type { ItemId } from "@/lib/wardrobe";
import { beanie, cap, gloves, scarf, sunglasses, sunhat, umbrella } from "./accessories";
import { bottle, earmuffs, rainpants, shirt, vest, windbreaker } from "./extra";
import type { ItemArt } from "./helpers";
import { boots, rainboots, sandals, shorts, sneakers, trousers } from "./lower";
import { hoodie, lightjacket, longsleeve, puffer, raincoat, sweater, tshirt } from "./upper";

export const ITEM_ART: Record<ItemId, ItemArt> = {
  beanie,
  cap,
  sunhat,
  earmuffs,
  sunglasses,
  scarf,
  tshirt,
  longsleeve,
  sweater,
  hoodie,
  shirt,
  lightjacket,
  raincoat,
  puffer,
  windbreaker,
  vest,
  shorts,
  trousers,
  rainpants,
  sandals,
  sneakers,
  boots,
  rainboots,
  gloves,
  umbrella,
  bottle,
};

/** Crop box [x, y, w, h] for drawing an item on its own (icons, design sheet). */
export const ITEM_BOX: Record<ItemId, readonly [number, number, number, number]> = {
  beanie: [150, 16, 300, 180],
  cap: [170, 50, 260, 150],
  sunhat: [92, 44, 416, 168],
  earmuffs: [96, 36, 410, 250],
  sunglasses: [176, 170, 250, 82],
  scarf: [224, 316, 160, 196],
  tshirt: [170, 324, 260, 248],
  longsleeve: [150, 324, 300, 300],
  sweater: [150, 324, 300, 300],
  hoodie: [150, 290, 300, 330],
  shirt: [150, 324, 300, 300],
  lightjacket: [150, 318, 300, 300],
  raincoat: [150, 318, 300, 330],
  puffer: [140, 300, 320, 320],
  windbreaker: [150, 318, 300, 300],
  vest: [190, 306, 220, 300],
  shorts: [190, 520, 220, 120],
  trousers: [190, 520, 220, 220],
  rainpants: [186, 520, 228, 224],
  sandals: [190, 700, 220, 84],
  sneakers: [190, 684, 220, 92],
  boots: [190, 644, 220, 132],
  rainboots: [190, 618, 220, 160],
  gloves: [150, 610, 300, 90],
  umbrella: [300, 16, 290, 690],
  bottle: [370, 520, 96, 176],
};

/** Tighter crops for small icons (where the full item box would be too tall). */
export const ICON_BOX: Partial<Record<ItemId, readonly [number, number, number, number]>> = {
  umbrella: [304, 16, 282, 220],
};
