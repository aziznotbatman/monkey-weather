import { ItemIcon, Monkey, HEAD_CROP } from "@/components/monkey/Monkey";
import { sky, type SkyKind } from "@/lib/tokens";
import { ITEM_IDS, type Mood } from "@/lib/wardrobe";
import { Logo } from "./Logo";
import { PhoneCard } from "./PhoneCard";
import styles from "./slides.module.css";

const FACES: Array<{ mood: Mood; sky: SkyKind; label: string }> = [
  { mood: "shivering", sky: "snow", label: "cold" },
  { mood: "soggy", sky: "rain", label: "wet" },
  { mood: "sweaty", sky: "clear", label: "hot" },
  { mood: "windblown", sky: "overcast", label: "windy" },
];

const SKY_NAMES: Record<SkyKind, string> = {
  clear: "Clear",
  partly: "Partly cloudy",
  overcast: "Overcast",
  rain: "Rain",
  snow: "Snow",
  storm: "Storm",
  night: "Night",
};

/** Slide 1 (2800 × 1700 at 2×): the product at a glance. */
export function BentoSlide() {
  return (
    <main className={`${styles.slide} ${styles.bento}`}>
      <section className={`${styles.tile} ${styles.tLogo}`}>
        <Logo uid="logo" stacked />
        <p className={styles.tagline}>What should I wear today? Ask the monkey.</p>
        <p className={styles.url}>monkey-weather.vercel.app</p>
      </section>

      <section className={`${styles.tile} ${styles.tFaces}`}>
        {FACES.map((f) => (
          <div key={f.mood} className={styles.face} style={{ background: sky[f.sky].bg }}>
            <Monkey uid={`face-${f.mood}`} outfit={{}} mood={f.mood} crop={HEAD_CROP} decorative />
            <span>{f.label}</span>
          </div>
        ))}
      </section>

      <section className={`${styles.tile} ${styles.tPhoneA}`}>
        <p className={styles.tileTag}>
          <b>07:00</b> what to wear now, and when to change
        </p>
        <PhoneCard id="big-swing" />
      </section>

      <section className={`${styles.tile} ${styles.tPhoneB}`}>
        <p className={styles.tileTag}>
          <b>Tap 17:00</b> umbrella on, sky turns to rain
        </p>
        <PhoneCard id="big-swing" tapped={3} />
      </section>

      <section className={`${styles.tile} ${styles.tSkies}`}>
        <h2 className={styles.tileTitle}>7 skies</h2>
        <ul className={styles.skies}>
          {(Object.keys(sky) as SkyKind[]).map((k) => (
            <li key={k} style={{ background: sky[k].bg, color: sky[k].text }}>
              <span>{SKY_NAMES[k]}</span>
              <code>{sky[k].bg}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${styles.tile} ${styles.tWardrobe}`}>
        <h2 className={styles.tileTitle}>26 garments, one chimp</h2>
        <ul className={styles.wardrobe}>
          {ITEM_IDS.map((id) => (
            <li key={id}>
              <ItemIcon item={id} uid={`w-${id}`} className={styles.wardrobeIcon} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
