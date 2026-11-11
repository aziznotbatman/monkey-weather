import { ItemIcon } from "@/components/monkey/Monkey";
import { ITEM_LABEL, type ItemId, type OutfitState, type Slot } from "@/lib/wardrobe";
import styles from "./app.module.css";

/** Reading order: the big layers first, then accessories. */
const LIST_ORDER: readonly Slot[] = [
  "outer",
  "top",
  "bottom",
  "footwear",
  "head",
  "neck",
  "hands",
  "eyes",
  "carry",
];

interface WornListProps {
  /** The outfit currently on the monkey (follows the tapped note). */
  outfit: OutfitState;
  /** Slots that just changed, highlighted as "new". */
  changedSlots: readonly Slot[];
  /** Re-triggers the pop animation on each preview. */
  popKey: number;
  /** "07:00" for the start of the day, or the previewed change time. */
  time: string;
  isPreview: boolean;
}

const capitalize = (s: string) => s.replace(/^./, (m) => m.toUpperCase());

/** Every piece the monkey has on, as small drawings with their names. */
export function WornList({ outfit, changedSlots, popKey, time, isPreview }: WornListProps) {
  const items = LIST_ORDER.flatMap((slot) => {
    const id = outfit[slot];
    return id ? [{ slot, id: id as ItemId }] : [];
  });
  if (items.length === 0) return null;

  return (
    <section className={styles.worn} aria-labelledby="worn-title">
      <h2 id="worn-title" className={styles.notesTitle}>
        {isPreview ? `Wearing at ${time}` : `Wearing from ${time}`}
      </h2>
      <ul className={styles.wornList}>
        {items.map(({ slot, id }) => {
          const isNew = isPreview && changedSlots.includes(slot);
          return (
            <li
              key={isNew ? `${id}-${popKey}` : id}
              className={`${styles.wornItem} ${isNew ? `${styles.wornNew} mw-pop` : ""}`}
            >
              <ItemIcon item={id} uid={`worn-${id}`} className={styles.wornIcon} />
              <span className={styles.wornLabel}>{capitalize(ITEM_LABEL[id])}</span>
              {isNew && <span className="visually-hidden"> (just changed)</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
