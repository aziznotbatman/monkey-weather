"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Monkey } from "@/components/monkey/Monkey";
import { CloseIcon, LocateIcon, SearchIcon } from "@/components/ui/Icons";
import { searchPlaces, WeatherError, type Place } from "@/lib/weather";
import styles from "./app.module.css";

interface CityPickerProps {
  open: boolean;
  onPick: (p: Place) => void;
  onUseLocation: () => void;
  onClose: () => void;
}

const DEBOUNCE_MS = 280;

type Status = "idle" | "searching" | "done" | "not_found" | "error" | "offline";

export function placeLabel(p: Place): string {
  return p.name;
}

function placeDetail(p: Place): string {
  return [p.admin1, p.country].filter(Boolean).join(", ");
}

export function CityPicker({ open, onPick, onUseLocation, onClose }: CityPickerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [active, setActive] = useState(0);
  const listId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      inputRef.current?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setStatus("searching");
      try {
        const found = await searchPlaces(q, ctrl.signal);
        setResults(found);
        setActive(0);
        setStatus(found.length ? "done" : "not_found");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setStatus(err instanceof WeatherError && err.kind === "offline" ? "offline" : "error");
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const showList = query.trim().length >= 2 && results.length > 0;

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby="city-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className={styles.sheetInner}>
        <header className={styles.sheetHead}>
          <h2 id="city-title" className={styles.sheetTitle}>
            Where are you?
          </h2>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close city search"
          >
            <CloseIcon />
          </button>
        </header>
        <form
          role="search"
          className={styles.searchRow}
          onSubmit={(e) => {
            e.preventDefault();
            if (results[active]) onPick(results[active]);
          }}
        >
          <label htmlFor="city-input" className="visually-hidden">
            City name
          </label>
          <span className={styles.searchIcon} aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id="city-input"
            className={styles.searchInput}
            type="text"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            maxLength={60}
            placeholder="Type a city, e.g. Lugano"
            value={query}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-${active}` : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length < 2) {
                setResults([]);
                setStatus("idle");
              }
            }}
            onKeyDown={(e) => {
              if (!showList) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              }
            }}
          />
        </form>

        <ul
          id={listId}
          role="listbox"
          aria-label="Matching places"
          className={styles.results}
          hidden={!showList}
        >
          {results.map((p, i) => (
            <li
              key={`${p.latitude},${p.longitude}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={styles.result}
              onMouseEnter={() => setActive(i)}
              onClick={() => onPick(p)}
            >
              <strong>{placeLabel(p)}</strong>
              <span>{placeDetail(p)}</span>
            </li>
          ))}
        </ul>

        <div aria-live="polite" className={styles.searchStatus}>
          {status === "searching" && <p>Looking…</p>}
          {status === "not_found" && (
            <div className={styles.notFound}>
              <Monkey
                uid="nf"
                outfit={{}}
                mood="confused"
                decorative
                className={styles.notFoundMonkey}
              />
              <p>
                I can&rsquo;t find &ldquo;{query.trim()}&rdquo;. Check the spelling, or try a bigger
                town nearby.
              </p>
            </div>
          )}
          {status === "offline" && <p>You seem to be offline. Search needs the internet.</p>}
          {status === "error" && (
            <p>The place search didn&rsquo;t answer. Try again in a moment.</p>
          )}
        </div>

        <button type="button" className={styles.secondaryBtn} onClick={onUseLocation}>
          <LocateIcon /> Use my location instead
        </button>
      </div>
    </dialog>
  );
}
