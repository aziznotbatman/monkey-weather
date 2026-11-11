import type { Mood } from "./wardrobe";

/** Headlines for days with no changes (<= 60 chars). */
export const STEADY_HEADLINES: Record<Mood, string[]> = {
  happy: [
    "One outfit, all day. Lovely.",
    "Easy day. Dress once, forget it.",
    "No costume changes today.",
  ],
  shivering: [
    "Wrap up. It stays cold all day.",
    "Full winter kit. All day long.",
    "Layers on, and keep them on.",
  ],
  soggy: [
    "Wet all day. Dress for puddles.",
    "Rain gear on. It's not leaving.",
    "It's a soggy one. Gear up.",
  ],
  sweaty: [
    "Hot all day. Wear as little as allowed.",
    "Sun's in charge today. Go light.",
    "Light clothes, shade, water.",
  ],
  windblown: [
    "Windy all day. Hold on to your hat.",
    "Blustery. Zip everything up.",
    "The wind has opinions today.",
  ],
};

/** The monkey's one-liners (<= 120 chars). At least 25, chosen by mood and the date. */
export const MONKEY_LINES: Record<Mood, string[]> = {
  happy: [
    "I checked every hour so you don't have to. You're welcome.",
    "Honestly, it's a good day to be a monkey.",
    "Mild, calm, pleasant. I'm almost suspicious.",
    "Nothing dramatic out there. I'll find something else to worry about.",
    "Perfect weather for pretending to be productive outside.",
    "If you see a banana, it's mine.",
  ],
  shivering: [
    "My tail is filing a complaint about the cold.",
    "Cold enough that I'm considering hibernation. Monkeys don't do that. I checked.",
    "Your breath will be visible. Mine already is.",
    "I wore everything I own. You should too.",
    "Hands in pockets. Mine don't have pockets, so I'm just sad.",
    "Hot drink recommended. Speaking from experience.",
  ],
  soggy: [
    "Rain is just the sky being clingy.",
    "I don't mind rain. My fur does.",
    "Wet socks ruin days. Choose your shoes wisely.",
    "Puddles today. Jumping in them is optional but endorsed.",
    "Take the umbrella. Future you will be smug about it.",
    "My ears are full of drizzle. Plan accordingly.",
  ],
  sweaty: [
    "It's hot. I'm wearing a fur coat I can't take off. Be grateful.",
    "Shade is your friend. Water is your best friend.",
    "The sun is doing a lot today. Let it do it without you.",
    "I'd lend you my sunglasses, but I'm using them.",
    "Too hot for opinions. Wear something light.",
    "Sunscreen. I don't make the rules. Actually, I do.",
  ],
  windblown: [
    "The wind keeps trying to steal my tuft.",
    "Hats will travel today. Secure yours.",
    "Windy enough to style your hair for you. Badly.",
    "Lean into it. Literally.",
    "Zip up. The wind finds every gap.",
  ],
};

/** Small, stable string hash so the same day gets the same line. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick<T>(list: readonly T[], seed: string): T {
  return list[hashString(seed) % list.length];
}
