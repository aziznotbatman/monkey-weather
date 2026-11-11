import type { SkyKind } from "@/lib/tokens";
import {
  describeOutfit,
  SLOTS,
  wornItems,
  type ItemId,
  type OutfitState,
  type Slot,
  type UiMood,
} from "@/lib/wardrobe";
import { VIEWBOX } from "./anchors";
import { bodyParts, Z, type Pose } from "./body";
import { Effects } from "./effects";
import { expressionParts } from "./expressions";
import { ICON_BOX, ITEM_ART, ITEM_BOX } from "./items";
import { PartView, WobbleDefs, type Part } from "./parts";

export interface MonkeyProps {
  outfit: OutfitState;
  mood?: UiMood;
  pose?: Pose;
  /** Draw weather effects around the monkey. */
  sky?: SkyKind;
  windy?: boolean;
  /** Unique id prefix (needed when several monkeys share a page). */
  uid?: string;
  /** Slots that just changed: their layers get a small pop animation. */
  popSlots?: Slot[];
  /** Key that restarts the pop animation. */
  popKey?: string | number;
  className?: string;
  /** Override the generated accessible label. */
  label?: string;
  /** Hide from assistive tech (decorative use). */
  decorative?: boolean;
}

const MOOD_WORDS: Record<UiMood, string> = {
  happy: "looking happy",
  shivering: "shivering",
  soggy: "a bit soggy",
  sweaty: "hot and sweaty",
  windblown: "blown about by the wind",
  thinking: "thinking",
  confused: "looking confused",
};

const HEAD_Z = Z.ears;
const HEAD_TILT = -4;

export function monkeyLabel(outfit: OutfitState, mood: UiMood): string {
  const worn = wornItems(outfit);
  const clothes = worn.length ? `wearing ${describeOutfit(outfit)}` : "wearing just fur";
  return `A hand-drawn monkey ${MOOD_WORDS[mood]}, ${clothes}.`;
}

export function collectParts(outfit: OutfitState, mood: UiMood, pose: Pose): Part[] {
  const ctx = { pose };
  const items = SLOTS.flatMap((slot) => {
    const id = outfit[slot];
    return id ? ITEM_ART[id](ctx) : [];
  });
  return [...bodyParts(pose), ...expressionParts(mood), ...items].sort((a, b) => a.z - b.z);
}

export function Monkey({
  outfit,
  mood = "happy",
  pose = "stand",
  sky,
  windy,
  uid = "mw",
  popSlots = [],
  popKey,
  className,
  label,
  decorative,
}: MonkeyProps) {
  const filter = `${uid}-wobble`;
  const parts = collectParts(outfit, mood, pose);
  const pop = new Set<string>(popSlots);
  const renderPart = (p: Part) =>
    p.slot && pop.has(p.slot) ? (
      <g key={`${p.id}-${popKey ?? ""}`} className="mw-pop">
        <PartView part={p} filter={filter} />
      </g>
    ) : (
      <PartView key={p.id} part={p} filter={filter} />
    );
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : (label ?? monkeyLabel(outfit, mood))}
      aria-hidden={decorative ? true : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <WobbleDefs id={filter} />
      </defs>
      {sky && <Effects sky={sky} windy={windy} filter={filter} layer="back" />}
      <g className="mw-figure">
        {parts.filter((p) => p.z < HEAD_Z).map(renderPart)}
        {/* The head sits slightly off-axis, like a confident doodle. */}
        <g transform={`rotate(${HEAD_TILT} 300 350)`}>
          {parts.filter((p) => p.z >= HEAD_Z).map(renderPart)}
        </g>
      </g>
      {sky && <Effects sky={sky} windy={windy} filter={filter} layer="front" />}
    </svg>
  );
}

/** A single garment on its own, cropped to its box (design sheet, change-note icons). */
export function ItemIcon({
  item,
  uid,
  className,
  title,
  tight = true,
}: {
  item: ItemId;
  uid: string;
  className?: string;
  title?: string;
  tight?: boolean;
}) {
  const filter = `${uid}-wobble`;
  const parts = ITEM_ART[item]({ pose: "stand" }).sort((a, b) => a.z - b.z);
  const [x, y, w, h] = (tight && ICON_BOX[item]) || ITEM_BOX[item];
  return (
    <svg
      viewBox={`${x} ${y} ${w} ${h}`}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <WobbleDefs id={filter} />
      </defs>
      {parts.map((p) => (
        <PartView key={p.id} part={p} filter={filter} />
      ))}
    </svg>
  );
}
