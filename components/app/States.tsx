"use client";

import { Monkey } from "@/components/monkey/Monkey";
import { LocateIcon, SearchIcon } from "@/components/ui/Icons";
import type { UiMood } from "@/lib/wardrobe";
import styles from "./app.module.css";

interface LandingProps {
  onLocate: () => void;
  onSearch: () => void;
  locating: boolean;
}

export function Landing({ onLocate, onSearch, locating }: LandingProps) {
  return (
    <section className={styles.landing} aria-labelledby="landing-title">
      <div className={styles.landingStage}>
        <Monkey
          uid="hello"
          outfit={{ top: "tshirt", bottom: "trousers", footwear: "sneakers" }}
          pose="wave"
          mood="happy"
          sky="partly"
          className={`${styles.monkey} mw-animated`}
          label="A hand-drawn monkey in a T-shirt, waving hello."
        />
      </div>
      <h1 id="landing-title" className={styles.heroTitle}>
        What should I wear today? <span>Ask the monkey.</span>
      </h1>
      <p className={styles.heroSub}>
        Weather apps give you numbers. The monkey gives you an outfit, and tells you when to change
        it.
      </p>
      <div className={styles.ctaRow}>
        <button type="button" className={styles.primaryBtn} onClick={onLocate} disabled={locating}>
          <LocateIcon /> {locating ? "Finding you…" : "Use my location"}
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={onSearch}>
          <SearchIcon /> Type a city
        </button>
      </div>
      <p className={styles.fineprint}>
        Your location goes from your browser to the weather and town-name services, rounded to about
        1 km. It is never sent to our server.
      </p>
      <p className={styles.demoLink}>
        Just looking? {/* A full page load on purpose: demo mode is read once on start. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/?demo=big-swing">See the monkey on a tricky day →</a>
      </p>
    </section>
  );
}

export function Loading({ placeName }: { placeName: string }) {
  return (
    <section className={styles.loadingCard} aria-live="polite" aria-busy="true">
      <div className={styles.topRow} aria-hidden="true">
        <span className={`${styles.chip} ${styles.ghost}`}>
          <span className={styles.chipText}>{placeName}</span>
        </span>
        <span className={`${styles.iconBtn} ${styles.ghost}`} />
      </div>
      <div className={styles.secondRow} aria-hidden="true">
        <span
          className={`${styles.segmented} ${styles.ghost}`}
          style={{ width: 168, height: 50 }}
        />
        <span
          className={`${styles.unitBtn} ${styles.ghost}`}
          style={{ marginLeft: "auto", height: 50 }}
        />
      </div>
      <p className={styles.dayTitle} aria-hidden="true">
        &nbsp;
      </p>
      <div className={styles.stage}>
        <Monkey
          uid="think"
          outfit={{}}
          mood="thinking"
          className={`${styles.monkey} mw-animated`}
          label="The monkey is thinking."
        />
      </div>
      <p className={styles.headline}>Checking the sky over {placeName}…</p>
      <p className={styles.monkeyLine}>
        Picking clothes. Rejecting the hat. Reconsidering the hat.
      </p>
    </section>
  );
}

export type ErrorKind = "denied" | "geo_unavailable" | "offline" | "forecast";

const ERRORS: Record<ErrorKind, { mood: UiMood; title: string; body: string }> = {
  denied: {
    mood: "confused",
    title: "No location, no problem.",
    body: "Your browser said no to sharing location. That's fine: just tell me the city.",
  },
  geo_unavailable: {
    mood: "confused",
    title: "I couldn't find you.",
    body: "Your device didn't give a location in time. Typing a city works just as well.",
  },
  offline: {
    mood: "soggy",
    title: "You seem to be offline.",
    body: "I need the internet to look at the sky. I'll be right here when you're back.",
  },
  forecast: {
    mood: "thinking",
    title: "The weather service didn't answer.",
    body: "It happens. Give it a moment and try again.",
  },
};

interface ErrorViewProps {
  kind: ErrorKind;
  onRetry?: () => void;
  onSearch: () => void;
}

export function ErrorView({ kind, onRetry, onSearch }: ErrorViewProps) {
  const e = ERRORS[kind];
  return (
    <section className={styles.errorState} role="alert" aria-labelledby="err-title">
      <div className={styles.errorStage}>
        <Monkey uid="err" outfit={{}} mood={e.mood} className={styles.monkey} decorative />
      </div>
      <h1 id="err-title" className={styles.headline}>
        {e.title}
      </h1>
      <p className={styles.monkeyLine}>{e.body}</p>
      <div className={styles.ctaRow}>
        {onRetry && (
          <button type="button" className={styles.primaryBtn} onClick={onRetry}>
            Try again
          </button>
        )}
        <button type="button" className={styles.secondaryBtn} onClick={onSearch}>
          <SearchIcon /> Type a city
        </button>
      </div>
    </section>
  );
}

export function Footer({ portfolioUrl }: { portfolioUrl?: string }) {
  return (
    <footer className={styles.footer}>
      <p>
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Weather data by Open-Meteo.com
        </a>{" "}
        (
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        )
      </p>
      <p>Your location never reaches our server. No accounts, no cookies, no tracking.</p>
      <p>
        Made by Aziz
        {portfolioUrl ? (
          <>
            {" · "}
            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer">
              About this project
            </a>
          </>
        ) : null}
      </p>
    </footer>
  );
}
