"use client";

import { useEffect, useRef } from "react";
import type { Profile } from "@/lib/schema";
import { CloseIcon } from "@/components/ui/Icons";
import styles from "./app.module.css";

interface PrefsSheetProps {
  open: boolean;
  profile: Profile;
  onChange: (p: Profile) => void;
  onClose: () => void;
}

type Field<K extends keyof Profile> = {
  key: K;
  legend: string;
  options: Array<[Profile[K], string]>;
};

const FIELDS: [Field<"sensitivity">, Field<"getAround">, Field<"style">, Field<"units">] = [
  {
    key: "sensitivity",
    legend: "I usually…",
    options: [
      ["cold", "Run cold"],
      ["normal", "Normal"],
      ["warm", "Run warm"],
    ],
  },
  {
    key: "getAround",
    legend: "I get around by…",
    options: [
      ["walking", "Walking"],
      ["cycling", "Cycling"],
      ["transit", "Public transport"],
    ],
  },
  {
    key: "style",
    legend: "My style is…",
    options: [
      ["casual", "Casual"],
      ["smart", "Smart"],
    ],
  },
  {
    key: "units",
    legend: "Temperatures in…",
    options: [
      ["C", "°C"],
      ["F", "°F"],
    ],
  },
];

export function PrefsSheet({ open, profile, onChange, onClose }: PrefsSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby="prefs-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={styles.sheetInner}>
        <header className={styles.sheetHead}>
          <h2 id="prefs-title" className={styles.sheetTitle}>
            Monkey&rsquo;s preferences
          </h2>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close preferences"
          >
            <CloseIcon />
          </button>
        </header>
        <p className={styles.sheetNote}>Saved in this browser only. Changes apply right away.</p>
        {FIELDS.map((f) => (
          <fieldset key={f.key} className={styles.field}>
            <legend>{f.legend}</legend>
            <div className={styles.options}>
              {f.options.map(([value, label]) => (
                <label key={String(value)} className={styles.option}>
                  <input
                    type="radio"
                    name={f.key}
                    value={String(value)}
                    checked={profile[f.key] === value}
                    onChange={() => onChange({ ...profile, [f.key]: value })}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="button" className={styles.primaryBtn} onClick={onClose}>
          Done
        </button>
      </div>
    </dialog>
  );
}
