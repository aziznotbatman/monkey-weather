"use client";

import { ItemIcon } from "@/components/monkey/Monkey";
import { outfitAt } from "@/lib/outfitState";
import type { Change, OutfitPlan } from "@/lib/schema";
import { ITEM_LABEL, ITEM_SLOT } from "@/lib/wardrobe";
import styles from "./app.module.css";

interface ChangeNotesProps {
  plan: Pick<OutfitPlan, "base" | "changes">;
  activeIndex: number | null;
  onSelect: (index: number | null) => void;
  startLabel: string;
}

function verb(c: Change, plan: ChangeNotesProps["plan"]): string {
  if (c.action === "remove") return `drop the ${ITEM_LABEL[c.item]}`;
  const before = outfitAt(
    plan.base,
    plan.changes.filter((x) => x.time < c.time),
    c.time,
  )[ITEM_SLOT[c.item]];
  return before
    ? `${ITEM_LABEL[c.item]} instead of ${ITEM_LABEL[before]}`
    : `add ${ITEM_LABEL[c.item]}`;
}

export function ChangeNotes({ plan, activeIndex, onSelect, startLabel }: ChangeNotesProps) {
  if (plan.changes.length === 0) {
    return (
      <section className={styles.notesEmpty} aria-label="Changes today">
        <p>No changes needed. Dress once and forget about it.</p>
      </section>
    );
  }
  return (
    <section className={styles.notes} aria-labelledby="changes-heading">
      <div className={styles.notesHead}>
        <h2 id="changes-heading" className={styles.notesTitle}>
          Changes today
        </h2>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => onSelect(null)}
          hidden={activeIndex === null}
        >
          ← {startLabel}
        </button>
      </div>
      <p className={styles.notesHint}>Tap a note to see the monkey at that time.</p>
      <ol className={styles.noteList}>
        {plan.changes.map((c, i) => {
          const active = activeIndex === i;
          return (
            <li key={`${c.time}-${c.item}`}>
              <button
                type="button"
                className={styles.note}
                data-tone={i % 4}
                aria-pressed={active}
                onClick={() => onSelect(active ? null : i)}
              >
                <span className={styles.noteNum} aria-hidden="true">
                  {i + 1}
                </span>
                <span className={styles.noteTime}>{c.time}</span>
                <span className={styles.noteIcon} aria-hidden="true">
                  <ItemIcon item={c.item} uid={`note-${i}`} />
                  {c.action === "remove" && <span className={styles.noteStrike} />}
                </span>
                <span className={styles.noteText}>
                  <strong>{verb(c, plan)}</strong>
                  <span>{c.reason}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
