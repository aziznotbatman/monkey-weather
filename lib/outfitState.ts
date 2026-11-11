import type { Change } from "./schema";
import { ITEM_SLOT, type OutfitState, type Slot } from "./wardrobe";

/** Apply one change to an outfit. `add` puts the item in its slot (swapping out what was there). */
export function applyChange(
  state: OutfitState,
  change: Pick<Change, "action" | "item">,
): OutfitState {
  const slot: Slot = ITEM_SLOT[change.item];
  if (change.action === "add") return { ...state, [slot]: change.item };
  if (state[slot] !== change.item) return state;
  const next = { ...state };
  delete next[slot];
  return next;
}

export const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** The outfit worn at `time` (inclusive): base plus every change up to then. */
export function outfitAt(base: OutfitState, changes: readonly Change[], time: string): OutfitState {
  const t = toMinutes(time);
  return changes
    .filter((c) => toMinutes(c.time) <= t)
    .reduce<OutfitState>((s, c) => applyChange(s, c), { ...base });
}

/** Which slots differ between two outfits (for the pop animation). */
export function changedSlots(a: OutfitState, b: OutfitState): Slot[] {
  const slots = new Set([...Object.keys(a), ...Object.keys(b)] as Slot[]);
  return [...slots].filter((s) => a[s] !== b[s]);
}
