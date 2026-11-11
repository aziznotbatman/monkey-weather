import type { DayCondition } from "./conditions";
import type { Mood } from "./wardrobe";

/**
 * Everything the chimp says. Deadpan, a little vain, takes the weather personally.
 * Headlines <= 60 chars, lines <= 120 chars (checked in tests). The day and place pick one,
 * so the same day always gets the same words.
 */

/** Headlines for days with no changes. */
export const STEADY_HEADLINES: Record<Mood, string[]> = {
  happy: [
    "One outfit, all day. Lovely.",
    "Easy day. Dress once, forget it.",
    "No costume changes today.",
    "Get dressed once. That's the whole plan.",
  ],
  shivering: [
    "Wrap up. It stays cold all day.",
    "Full winter kit. All day long.",
    "Layers on, and keep them on.",
    "Cold from start to finish. Dress for it.",
  ],
  soggy: [
    "Wet all day. Dress for puddles.",
    "Rain gear on. It's not leaving.",
    "It's a soggy one. Gear up.",
    "Rain all day. No heroics.",
  ],
  sweaty: [
    "Hot all day. Wear as little as allowed.",
    "Sun's in charge today. Go light.",
    "Light clothes, shade, water.",
    "Hot from breakfast to bedtime.",
  ],
  windblown: [
    "Windy all day. Hold on to your hat.",
    "Blustery. Zip everything up.",
    "The wind has opinions today.",
    "Windy all day. Nothing floppy.",
  ],
};

/** Steady-day headlines when the day has one notable kind of weather. */
export const CONDITION_HEADLINES: Record<Exclude<DayCondition, "swing">, string[]> = {
  storm: ["Storms about. Raincoat, not umbrella.", "Thunder today. Stay dry, stay low."],
  freezing: ["Icy out. Boots with grip, all day.", "Freezing rain. Walk like a penguin."],
  snow: ["Snow all day. Boots on, hat on.", "It's snowing. Dress like you mean it."],
  sleet: ["Sleet: rain's worse cousin. Gear up.", "Wet and freezing. Full kit today."],
  downpour: ["Proper downpour. Full rain gear.", "Heavy rain all day. No half measures."],
  gusty: ["Gusty all day. Nothing with a brim.", "Strong gusts. Zip up, hats off."],
  muggy: ["Sticky all day. Light layers, water.", "Muggy. Breathable everything."],
  fog: ["Foggy start, same outfit all day.", "Fog first, then just a day. Dress once."],
  drizzle: ["Drizzly all day. A shell will do.", "Fine drizzle. Not umbrella-worthy."],
};

/** The chimp's one-liners by mood. */
export const MONKEY_LINES: Record<Mood, string[]> = {
  happy: [
    "I checked every hour so you don't have to. You're welcome.",
    "Honestly, it's a good day to be a monkey.",
    "Mild, calm, pleasant. I'm almost suspicious.",
    "Nothing dramatic out there. I'll find something else to worry about.",
    "Perfect weather for pretending to be productive outside.",
    "If you see a banana, it's mine.",
    "The weather is behaving. I've written it down in case it doesn't happen again.",
    "A day with no plot twists. My favourite genre.",
    "Good day for a walk. I'll supervise from here.",
    "I put on my nice jacket for this and it was the right call.",
  ],
  shivering: [
    "My ears are filing a formal complaint about the cold.",
    "Cold enough that I'm considering hibernation. Monkeys don't do that. I checked.",
    "Your breath will be visible. Mine already is.",
    "I wore everything I own. You should too.",
    "Hands in pockets. Mine don't have pockets, so I'm just sad.",
    "Hot drink recommended. Speaking from experience.",
    "I evolved for the tropics. Nobody told the weather.",
    "My fur is doing its best. Its best is not enough.",
    "Cold like a fridge you can't close.",
    "If you see me running, it's not exercise. It's survival.",
  ],
  soggy: [
    "Rain is just the sky being clingy.",
    "I don't mind rain. My fur does.",
    "Wet socks ruin days. Choose your shoes wisely.",
    "Puddles today. Jumping in them is optional but endorsed.",
    "Take the umbrella. Future you will be smug about it.",
    "My ears are full of drizzle. Plan accordingly.",
    "Wet fur smells. I'm not going to elaborate.",
    "The sky has a leak and no plumber.",
    "Waterproof is a personality today.",
    "I tried shaking it off. It came back.",
  ],
  sweaty: [
    "It's hot. I'm wearing a fur coat I can't take off. Be grateful.",
    "Shade is your friend. Water is your best friend.",
    "The sun is doing a lot today. Let it do it without you.",
    "I'd lend you my sunglasses, but I'm using them.",
    "Too hot for opinions. Wear something light.",
    "Sunscreen. I don't make the rules. Actually, I do.",
    "I've been melting since breakfast. Slowly. With dignity.",
    "My fur was a mistake today. Learn from me.",
    "Carry water. Drink it. That's the whole tip.",
    "I'm sitting very still in the shade. Join me.",
  ],
  windblown: [
    "The wind keeps trying to restyle my hair. It is not going well.",
    "Hats will travel today. Secure yours.",
    "Windy enough to style your hair for you. Badly.",
    "Lean into it. Literally.",
    "Zip up. The wind finds every gap.",
    "My ears are working as sails today.",
    "Today the wind is the main character.",
    "I'm holding on to a lamppost and my dignity. Only one is going well.",
  ],
};

/** Lines about the day's notable weather (used before the mood lines when it applies). */
export const CONDITION_LINES: Record<DayCondition, string[]> = {
  storm: [
    "Thunder today. Umbrellas and lightning don't mix. Ask any monkey in a tree.",
    "Storms later. I'll be indoors, pretending I'm not scared.",
    "If it flashes, count to ten. If it booms, go inside. Science.",
  ],
  freezing: [
    "Freezing rain: the pavement is a skating rink and nobody asked for it.",
    "Icy out. Small steps. I've already fallen once, for science.",
    "The sidewalk is glass today. Wear shoes with grip and opinions.",
  ],
  snow: [
    "Snow! Lovely to look at. Terrible to get into your boots.",
    "Snow on my head, snow in my ears. Beanie strongly advised.",
    "Everything is white and quiet. I'm suspicious of it.",
  ],
  sleet: [
    "Sleet: rain that couldn't commit to being snow.",
    "Wet and freezing at the same time. A bold choice by the sky.",
    "Sleet in the ears is a new low. Hood up.",
  ],
  downpour: [
    "Proper downpour. The umbrella is decoration at this point.",
    "Not rain, more like the sky emptying a bucket. On me. Specifically.",
    "Full rain kit. Looking like a fisherman is the price of dry socks.",
  ],
  gusty: [
    "Gusts strong enough to take a hat to the next town. Leave the hat.",
    "My ears are acting as sails. I'm moving sideways.",
    "The wind has started picking up small dogs. Zip up.",
  ],
  muggy: [
    "Muggy. The air is soup and I'm wearing fur.",
    "Humid enough to swim through. Breathable clothes, big water.",
    "Sticky out. My fur has turned into a sponge.",
  ],
  fog: [
    "Foggy morning. If you can't see me, I'm still dressed well.",
    "Fog first. Visibility: low. Style: unaffected.",
    "The world is out of focus this morning. It'll sharpen up.",
  ],
  drizzle: [
    "Drizzle. Not enough for an umbrella. Enough for my fur to complain.",
    "Fine mist of rain. My ears are slightly moist and very offended.",
    "Drizzle all day. A light shell and a straight face.",
  ],
  swing: [
    "Cold now, warm later. Dress in layers you don't mind carrying.",
    "Two seasons in one day. Bring the jacket, expect to hold it.",
    "Morning me and afternoon me disagree about jackets.",
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
