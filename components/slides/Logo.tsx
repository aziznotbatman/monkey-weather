import { HEAD_CROP, Monkey } from "@/components/monkey/Monkey";
import styles from "./slides.module.css";

/** The mark: the chimp's head, deadpan, plus the hand-lettered name. */
export function Logo({
  uid,
  tone = "light",
  stacked = false,
}: {
  uid: string;
  tone?: "light" | "dark";
  stacked?: boolean;
}) {
  return (
    <div
      className={`${styles.logo} ${tone === "dark" ? styles.logoDark : ""} ${stacked ? styles.logoStack : ""}`}
    >
      <Monkey
        uid={uid}
        outfit={{}}
        mood="happy"
        crop={HEAD_CROP}
        decorative
        className={styles.logoHead}
      />
      <span className={styles.logoWord}>
        Monkey
        <br />
        Weather
      </span>
    </div>
  );
}
