import type { Metadata } from "next";
import { ItemIcon, Monkey } from "@/components/monkey/Monkey";
import { art, ink, sky, stroke, ui } from "@/lib/tokens";
import {
  ITEM_IDS,
  ITEM_LABEL,
  ITEM_SLOT,
  MOODS,
  type OutfitState,
  type UiMood,
} from "@/lib/wardrobe";
import type { SkyKind } from "@/lib/tokens";
import styles from "./design.module.css";

export const metadata: Metadata = {
  title: "Monkey sheet — Monkey Weather design system",
  robots: { index: false },
};

const OUTFITS: Array<{
  name: string;
  outfit: OutfitState;
  mood: UiMood;
  sky: SkyKind;
  windy?: boolean;
}> = [
  {
    name: "Freezing snow",
    outfit: {
      head: "beanie",
      neck: "scarf",
      top: "sweater",
      outer: "puffer",
      bottom: "trousers",
      footwear: "boots",
      hands: "gloves",
    },
    mood: "shivering",
    sky: "snow",
  },
  {
    name: "Cold & dry",
    outfit: {
      head: "beanie",
      neck: "scarf",
      top: "sweater",
      outer: "puffer",
      bottom: "trousers",
      footwear: "boots",
    },
    mood: "shivering",
    sky: "clear",
  },
  {
    name: "Cool rain",
    outfit: {
      top: "hoodie",
      outer: "lightjacket",
      bottom: "trousers",
      footwear: "rainboots",
      carry: "umbrella",
    },
    mood: "soggy",
    sky: "rain",
  },
  {
    name: "Windy rain",
    outfit: { top: "longsleeve", outer: "raincoat", bottom: "trousers", footwear: "rainboots" },
    mood: "soggy",
    sky: "storm",
  },
  {
    name: "Mild",
    outfit: { top: "longsleeve", outer: "lightjacket", bottom: "trousers", footwear: "sneakers" },
    mood: "happy",
    sky: "partly",
  },
  {
    name: "Mild, smart",
    outfit: { top: "sweater", outer: "lightjacket", bottom: "trousers", footwear: "boots" },
    mood: "happy",
    sky: "overcast",
  },
  {
    name: "Warm",
    outfit: { top: "tshirt", bottom: "shorts", footwear: "sneakers" },
    mood: "happy",
    sky: "partly",
  },
  {
    name: "Warm, high UV",
    outfit: {
      head: "cap",
      eyes: "sunglasses",
      top: "tshirt",
      bottom: "shorts",
      footwear: "sneakers",
    },
    mood: "happy",
    sky: "clear",
  },
  {
    name: "Hot",
    outfit: {
      head: "sunhat",
      eyes: "sunglasses",
      top: "tshirt",
      bottom: "shorts",
      footwear: "sandals",
    },
    mood: "sweaty",
    sky: "clear",
  },
  {
    name: "Blustery",
    outfit: {
      neck: "scarf",
      top: "hoodie",
      outer: "lightjacket",
      bottom: "trousers",
      footwear: "sneakers",
    },
    mood: "windblown",
    sky: "overcast",
    windy: true,
  },
  {
    name: "Cold commute",
    outfit: {
      head: "beanie",
      top: "longsleeve",
      outer: "puffer",
      bottom: "trousers",
      footwear: "boots",
      hands: "gloves",
    },
    mood: "shivering",
    sky: "night",
  },
  {
    name: "Drizzly evening",
    outfit: {
      top: "sweater",
      outer: "raincoat",
      bottom: "trousers",
      footwear: "sneakers",
      carry: "umbrella",
    },
    mood: "soggy",
    sky: "night",
  },
  {
    name: "Sunny, smart",
    outfit: { eyes: "sunglasses", top: "longsleeve", bottom: "trousers", footwear: "boots" },
    mood: "happy",
    sky: "clear",
  },
  {
    name: "Ear muffs, smart",
    outfit: {
      head: "earmuffs",
      neck: "scarf",
      top: "shirt",
      outer: "puffer",
      bottom: "trousers",
      footwear: "boots",
      hands: "gloves",
    },
    mood: "shivering",
    sky: "clear",
  },
  {
    name: "Gusty and mild",
    outfit: { top: "longsleeve", outer: "windbreaker", bottom: "trousers", footwear: "sneakers" },
    mood: "windblown",
    sky: "overcast",
    windy: true,
  },
  {
    name: "Cycling, cool",
    outfit: { top: "hoodie", outer: "vest", bottom: "trousers", footwear: "sneakers" },
    mood: "happy",
    sky: "partly",
  },
  {
    name: "Downpour, cycling",
    outfit: { top: "sweater", outer: "raincoat", bottom: "rainpants", footwear: "rainboots" },
    mood: "soggy",
    sky: "storm",
  },
  {
    name: "Muggy",
    outfit: { top: "shirt", bottom: "shorts", footwear: "sneakers", carry: "bottle" },
    mood: "sweaty",
    sky: "overcast",
  },
  { name: "Just fur", outfit: {}, mood: "happy", sky: "partly" },
];

const MOOD_SHEET: UiMood[] = [...MOODS, "thinking", "confused"];

const swatch = (name: string, hex: string) => (
  <li key={name} className={styles.swatch}>
    <span style={{ background: hex }} />
    <code>{name}</code>
    <small>{hex}</small>
  </li>
);

export default function DesignPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>The monkey sheet</h1>
        <p>
          Monkey Weather&rsquo;s character and wardrobe system. One original chimp drawn on a fixed
          skeleton (viewBox 600 × 800), 26 garments in 9 slots, 7 faces. Every layer is a
          hand-authored SVG path with a separate line layer (wobble filter) and a flat fill layer.
        </p>
      </header>

      <section className={styles.section} aria-labelledby="faces">
        <h2 id="faces">Faces</h2>
        <ul className={styles.row}>
          {MOOD_SHEET.map((m) => (
            <li key={m} className={styles.tile} style={{ background: sky.partly.bg }}>
              <Monkey uid={`m-${m}`} outfit={{}} mood={m} className={styles.monkey} />
              <span className={styles.label}>{m}</span>
            </li>
          ))}
          <li className={styles.tile} style={{ background: sky.partly.bg }}>
            <Monkey
              uid="m-wave"
              outfit={{ top: "tshirt", bottom: "trousers", footwear: "sneakers" }}
              pose="wave"
              className={styles.monkey}
            />
            <span className={styles.label}>wave pose</span>
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="items">
        <h2 id="items">Wardrobe: 26 items, 9 slots</h2>
        <ul className={styles.items}>
          {ITEM_IDS.map((id) => (
            <li key={id} className={styles.item}>
              <ItemIcon
                item={id}
                uid={`i-${id}`}
                tight={false}
                className={styles.itemArt}
                title={ITEM_LABEL[id]}
              />
              <code>{id}</code>
              <small>{ITEM_SLOT[id]}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="outfits">
        <h2 id="outfits">Outfits on their weather</h2>
        <ul className={styles.grid}>
          {OUTFITS.map((o, i) => (
            <li
              key={o.name}
              className={styles.tile}
              style={{ background: sky[o.sky].bg, color: sky[o.sky].text }}
            >
              <Monkey
                uid={`o-${i}`}
                outfit={o.outfit}
                mood={o.mood}
                sky={o.sky}
                windy={o.windy}
                className={styles.monkey}
              />
              <span className={styles.label}>{o.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="tokens">
        <h2 id="tokens">Palette and line</h2>
        <h3>Skies (background · text passes WCAG AA)</h3>
        <ul className={styles.swatches}>{Object.entries(sky).map(([k, v]) => swatch(k, v.bg))}</ul>
        <h3>Character and garments</h3>
        <ul className={styles.swatches}>{Object.entries(art).map(([k, v]) => swatch(k, v))}</ul>
        <h3>Interface</h3>
        <ul className={styles.swatches}>
          {[
            ["ink", ink],
            ...Object.entries(ui).filter(
              ([k]) => k.startsWith("note") || k === "accent" || k === "paper",
            ),
          ].map(([k, v]) => swatch(k, v))}
        </ul>
        <h3>Marker line</h3>
        <svg viewBox="0 0 600 120" className={styles.strokes} aria-label="Stroke widths">
          {[
            ["outline", stroke.line],
            ["detail", stroke.detail],
            ["fine", stroke.fine],
          ].map(([name, w], i) => (
            <g key={String(name)} transform={`translate(${20 + i * 200} 30)`}>
              <path
                d="M0 30 C40 0 80 60 160 20"
                stroke={ink}
                strokeWidth={Number(w)}
                fill="none"
                strokeLinecap="round"
              />
              <text x="0" y="80" fontSize="18" fill={ink}>
                {name}: {w} units
              </text>
            </g>
          ))}
        </svg>
        <p className={styles.spec}>
          Wobble: feTurbulence (fractalNoise, baseFrequency {stroke.wobbleFrequency}, 2 octaves,
          seed {stroke.wobbleSeed}) → feDisplacementMap scale {stroke.wobbleScale}, applied to line
          layers only. Fills sit on top of a double-width ink stroke, so the visible outline is
          exactly {stroke.line} units and wobbles only on the outside. Edge-darkening band:{" "}
          {stroke.glow} units at {Math.round(stroke.glowOpacity * 100)}% ink, applied to every fill.
        </p>
      </section>
    </main>
  );
}
