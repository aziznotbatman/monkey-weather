/** The fixed wardrobe vocabulary. The AI may only choose from these ids. */

export const SLOTS = [
  "head",
  "eyes",
  "neck",
  "top",
  "outer",
  "bottom",
  "footwear",
  "hands",
  "carry",
] as const;
export type Slot = (typeof SLOTS)[number];

export const ITEM_SLOT = {
  beanie: "head",
  cap: "head",
  sunhat: "head",
  sunglasses: "eyes",
  scarf: "neck",
  tshirt: "top",
  longsleeve: "top",
  sweater: "top",
  hoodie: "top",
  lightjacket: "outer",
  raincoat: "outer",
  puffer: "outer",
  shorts: "bottom",
  trousers: "bottom",
  sandals: "footwear",
  sneakers: "footwear",
  boots: "footwear",
  rainboots: "footwear",
  gloves: "hands",
  umbrella: "carry",
} as const satisfies Record<string, Slot>;

export type ItemId = keyof typeof ITEM_SLOT;
export const ITEM_IDS = Object.keys(ITEM_SLOT) as [ItemId, ...ItemId[]];

export const REQUIRED_SLOTS: readonly Slot[] = ["top", "bottom", "footwear"];

export const ITEMS_BY_SLOT: Record<Slot, ItemId[]> = SLOTS.reduce(
  (acc, slot) => ({ ...acc, [slot]: ITEM_IDS.filter((id) => ITEM_SLOT[id] === slot) }),
  {} as Record<Slot, ItemId[]>,
);

export const ITEM_LABEL: Record<ItemId, string> = {
  beanie: "beanie",
  cap: "cap",
  sunhat: "sun hat",
  sunglasses: "sunglasses",
  scarf: "scarf",
  tshirt: "T-shirt",
  longsleeve: "long-sleeve top",
  sweater: "sweater",
  hoodie: "hoodie",
  lightjacket: "light jacket",
  raincoat: "raincoat",
  puffer: "puffer jacket",
  shorts: "shorts",
  trousers: "trousers",
  sandals: "sandals",
  sneakers: "sneakers",
  boots: "boots",
  rainboots: "rain boots",
  gloves: "gloves",
  umbrella: "umbrella",
};

/** Pairs that must never be worn together (same-slot clashes are impossible by construction). */
export const IMPOSSIBLE_PAIRS: ReadonlyArray<readonly [ItemId, ItemId]> = [
  ["puffer", "shorts"],
  ["puffer", "sandals"],
  ["sandals", "beanie"],
  ["sandals", "gloves"],
  ["shorts", "gloves"],
  ["sunhat", "scarf"],
];

export const MOODS = ["happy", "shivering", "soggy", "sweaty", "windblown"] as const;
export type Mood = (typeof MOODS)[number];

/** Moods used only by the UI (landing, loading, errors). Never produced by the outfit logic. */
export type UiMood = Mood | "thinking" | "confused";

export type OutfitState = Partial<Record<Slot, ItemId>>;

export function wornItems(state: OutfitState): ItemId[] {
  return SLOTS.map((s) => state[s]).filter((v): v is ItemId => Boolean(v));
}

export function findClash(state: OutfitState): readonly [ItemId, ItemId] | null {
  const worn = new Set(wornItems(state));
  return IMPOSSIBLE_PAIRS.find(([a, b]) => worn.has(a) && worn.has(b)) ?? null;
}

/** Human description of an outfit, e.g. for the monkey's aria-label. */
export function describeOutfit(state: OutfitState): string {
  const items = wornItems(state).map((id) => ITEM_LABEL[id]);
  if (items.length === 0) return "nothing at all";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
