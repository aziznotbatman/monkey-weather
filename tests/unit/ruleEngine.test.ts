import { describe, expect, test } from "vitest";
import { SCENARIOS } from "@/lib/fixtures";
import { outfitAt } from "@/lib/outfitState";
import { effectiveTemp, moodFor, ruleEngine, targetAt } from "@/lib/ruleEngine";
import { CONDITION_HEADLINES, CONDITION_LINES, MONKEY_LINES, STEADY_HEADLINES } from "@/lib/lines";
import { dayCondition, precipAt } from "@/lib/conditions";
import { OutfitPlanSchema } from "@/lib/schema";
import { findClash, ITEM_SLOT, REQUIRED_SLOTS } from "@/lib/wardrobe";
import { point, profile, summaryFor } from "./helpers";

const day = { heavyRain: false };

describe("effectiveTemp", () => {
  test("shifts by sensitivity and cycling chill", () => {
    expect(effectiveTemp({ feelsLikeC: 10 }, profile())).toBe(10);
    expect(effectiveTemp({ feelsLikeC: 10 }, profile({ sensitivity: "cold" }))).toBe(7);
    expect(effectiveTemp({ feelsLikeC: 10 }, profile({ sensitivity: "warm" }))).toBe(13);
    expect(effectiveTemp({ feelsLikeC: 10 }, profile({ getAround: "cycling" }))).toBe(8);
  });
});

describe("targetAt thresholds", () => {
  test.each([
    [30, { top: "tshirt", bottom: "shorts", footwear: "sandals", carry: "bottle" }],
    [24, { top: "tshirt", bottom: "shorts", footwear: "sneakers" }],
    [22, { top: "tshirt", bottom: "trousers", footwear: "sneakers" }],
    [17, { top: "longsleeve", outer: "lightjacket", bottom: "trousers", footwear: "sneakers" }],
    [11, { top: "hoodie", outer: "lightjacket", bottom: "trousers", footwear: "sneakers" }],
    [
      5,
      {
        top: "sweater",
        outer: "puffer",
        bottom: "trousers",
        footwear: "boots",
        head: "beanie",
        neck: "scarf",
      },
    ],
    [
      0,
      {
        top: "sweater",
        outer: "puffer",
        bottom: "trousers",
        footwear: "boots",
        head: "beanie",
        neck: "scarf",
        hands: "gloves",
      },
    ],
  ])("feels %i°C", (feels, expected) => {
    expect(targetAt(point({ feelsLikeC: feels }), profile(), day)).toEqual(expected);
  });

  test("scarf in the cool band only when windy", () => {
    expect(targetAt(point({ feelsLikeC: 11, windKmh: 22 }), profile(), day).neck).toBe("scarf");
  });

  test("smart style prefers sweater and boots", () => {
    const s = targetAt(point({ feelsLikeC: 11 }), profile({ style: "smart" }), day);
    expect(s.top).toBe("sweater");
    expect(s.footwear).toBe("boots");
  });

  test("transit prefers a lighter top under the jacket", () => {
    expect(targetAt(point({ feelsLikeC: 11 }), profile({ getAround: "transit" }), day).top).toBe(
      "longsleeve",
    );
  });

  test("rain: umbrella when calm, raincoat when windy or cycling", () => {
    expect(targetAt(point({ rainProb: 80 }), profile(), day).carry).toBe("umbrella");
    expect(targetAt(point({ rainProb: 80, windKmh: 40 }), profile(), day).outer).toBe("raincoat");
    const bike = targetAt(point({ rainProb: 80 }), profile({ getAround: "cycling" }), day);
    expect(bike.outer).toBe("raincoat");
    expect(bike.carry).toBeUndefined();
  });

  test("heavy rain day adds rain boots", () => {
    expect(targetAt(point({ rainProb: 80 }), profile(), { heavyRain: true }).footwear).toBe(
      "rainboots",
    );
  });

  test("freezing + windy rain keeps the puffer (no raincoat over a puffer)", () => {
    const s = targetAt(point({ feelsLikeC: 0, rainProb: 80, windKmh: 40 }), profile(), day);
    expect(s.outer).toBe("puffer");
  });

  test("high UV adds sunglasses and a hat", () => {
    const s = targetAt(point({ feelsLikeC: 24, uv: 7 }), profile(), day);
    expect(s.eyes).toBe("sunglasses");
    expect(s.head).toBe("cap");
    expect(
      targetAt(point({ feelsLikeC: 24, uv: 7, isDay: false }), profile(), day).eyes,
    ).toBeUndefined();
  });

  test("snow wants boots, not an umbrella", () => {
    const s = targetAt(
      point({ feelsLikeC: -3, tempC: -1, rainProb: 80, weatherCode: 73 }),
      profile(),
      day,
    );
    expect(s.footwear).toBe("boots");
    expect(s.carry).toBeUndefined();
  });

  test("cold-sensitive person gets a warmer outfit for the same weather", () => {
    expect(targetAt(point({ feelsLikeC: 16 }), profile({ sensitivity: "cold" }), day).top).toBe(
      "hoodie",
    );
  });
});

describe("ruleEngine across fixtures", () => {
  const plans = SCENARIOS.map((s) => [s.id, ruleEngine(summaryFor(s.id), profile())] as const);

  test.each(plans)("%s produces a valid, wearable plan", (_id, plan) => {
    expect(OutfitPlanSchema.safeParse(plan).success).toBe(true);
    for (const slot of REQUIRED_SLOTS) expect(plan.base[slot]).toBeDefined();
    expect(findClash(plan.base)).toBeNull();
    expect(plan.changes.length).toBeLessThanOrEqual(4);
    const times = plan.changes.map((c) => c.time);
    expect([...times].sort()).toEqual(times);
    for (const c of plan.changes) {
      expect(c.reason.length).toBeLessThanOrEqual(60);
      expect(findClash(outfitAt(plan.base, plan.changes, c.time))).toBeNull();
    }
  });

  test("every scenario produces a different day plan", () => {
    const keys = new Set(
      plans.map(([, p]) => JSON.stringify([p.base, p.changes.map((c) => c.action + c.item)])),
    );
    expect(keys.size).toBe(SCENARIOS.length);
  });

  test("big swing day: lighter outer late morning, umbrella at 17:00", () => {
    const plan = ruleEngine(summaryFor("big-swing"), profile());
    expect(plan.base.outer).toBe("puffer");
    expect(plan.changes).toContainEqual(
      expect.objectContaining({ action: "add", item: "lightjacket", time: "11:00" }),
    );
    expect(plan.changes).toContainEqual(
      expect.objectContaining({ action: "add", item: "umbrella", time: "17:00" }),
    );
    expect(outfitAt(plan.base, plan.changes, "13:00").outer).toBe("lightjacket");
    expect(plan.headline).toContain("umbrella at 17:00");
  });

  test("steady days have zero changes", () => {
    expect(ruleEngine(summaryFor("mild-clear"), profile()).changes).toEqual([]);
    expect(ruleEngine(summaryFor("freezing-snow"), profile()).changes).toEqual([]);
  });

  test("hot day: shorts, sandals, sun protection at midday", () => {
    const plan = ruleEngine(summaryFor("hot"), profile());
    expect(plan.base).toMatchObject({ top: "tshirt", bottom: "shorts", footwear: "sandals" });
    expect(plan.mood).toBe("sweaty");
    expect(plan.changes.some((c) => c.item === "sunglasses" && c.action === "add")).toBe(true);
  });

  test("every change item belongs to a known slot", () => {
    for (const [, p] of plans) for (const c of p.changes) expect(ITEM_SLOT[c.item]).toBeDefined();
  });
});

describe("mood and lines", () => {
  test("moodFor picks by conditions", () => {
    expect(moodFor(point({ rainProb: 80 }), profile())).toBe("soggy");
    expect(moodFor(point({ feelsLikeC: 2 }), profile())).toBe("shivering");
    expect(moodFor(point({ feelsLikeC: 30 }), profile())).toBe("sweaty");
    expect(moodFor(point({ windKmh: 40 }), profile())).toBe("windblown");
    expect(moodFor(point({}), profile())).toBe("happy");
  });

  test("plenty of one-liners, all <= 120 chars, no duplicates", () => {
    const all = [...Object.values(MONKEY_LINES), ...Object.values(CONDITION_LINES)].flat();
    expect(all.length).toBeGreaterThanOrEqual(70);
    expect(new Set(all).size).toBe(all.length);
    for (const l of all) expect(l.length).toBeLessThanOrEqual(120);
  });

  test("every headline fits in 60 chars", () => {
    const all = [...Object.values(STEADY_HEADLINES), ...Object.values(CONDITION_HEADLINES)].flat();
    for (const h of all) expect(h.length).toBeLessThanOrEqual(60);
  });

  test("same day, same line (deterministic)", () => {
    expect(ruleEngine(summaryFor("cold-dry"), profile())).toEqual(
      ruleEngine(summaryFor("cold-dry"), profile()),
    );
  });
});

describe("weather conditions", () => {
  const walk = profile();
  const bike = profile({ getAround: "cycling" });

  test("weather codes map to the right kind of precipitation", () => {
    expect(precipAt(point({ weatherCode: 53 }))).toBe("drizzle");
    expect(precipAt(point({ weatherCode: 63 }))).toBe("rain");
    expect(precipAt(point({ weatherCode: 63, rainMm: 5 }))).toBe("downpour");
    expect(precipAt(point({ weatherCode: 65 }))).toBe("downpour");
    expect(precipAt(point({ weatherCode: 63, tempC: 0 }))).toBe("sleet");
    expect(precipAt(point({ weatherCode: 73, tempC: -2 }))).toBe("snow");
    expect(precipAt(point({ weatherCode: 73, tempC: 4 }))).toBe("sleet");
    expect(precipAt(point({ weatherCode: 67 }))).toBe("freezing");
    expect(precipAt(point({ weatherCode: 95 }))).toBe("storm");
    expect(precipAt(point({ weatherCode: 3, rainProb: 70 }))).toBe("rain");
    expect(precipAt(point({ weatherCode: 45 }))).toBe("none");
  });

  test("storm: no umbrella under lightning, raincoat instead", () => {
    const s = targetAt(point({ weatherCode: 95, rainProb: 90 }), walk, day);
    expect(s.carry).toBeUndefined();
    expect(s.outer).toBe("raincoat");
  });

  test("gusts: no umbrella, no brimmed hats, windbreaker when mild", () => {
    const rainyGust = targetAt(point({ weatherCode: 63, rainProb: 80, gustKmh: 60 }), walk, day);
    expect(rainyGust.carry).toBeUndefined();
    expect(rainyGust.outer).toBe("raincoat");
    const sunnyGust = targetAt(point({ feelsLikeC: 24, uv: 8, gustKmh: 60 }), walk, day);
    expect(sunnyGust.eyes).toBe("sunglasses");
    expect(sunnyGust.head).toBeUndefined();
    expect(targetAt(point({ feelsLikeC: 17, windKmh: 30 }), walk, day).outer).toBe("windbreaker");
  });

  test("drizzle: a windbreaker, not an umbrella", () => {
    const s = targetAt(point({ feelsLikeC: 13, weatherCode: 53, rainProb: 70 }), walk, day);
    expect(s.outer).toBe("windbreaker");
    expect(s.carry).toBeUndefined();
  });

  test("downpour on foot: the full fisherman kit", () => {
    const s = targetAt(point({ weatherCode: 65, rainProb: 95, rainMm: 8 }), walk, day);
    expect(s).toMatchObject({
      outer: "raincoat",
      carry: "umbrella",
      bottom: "rainpants",
      footwear: "rainboots",
    });
  });

  test("cycling in rain: rain trousers and raincoat, never an umbrella", () => {
    const s = targetAt(point({ weatherCode: 63, rainProb: 80 }), bike, day);
    expect(s).toMatchObject({ outer: "raincoat", bottom: "rainpants" });
    expect(s.carry).toBeUndefined();
  });

  test("sleet and freezing rain: boots with grip, gloves and a hat when cold", () => {
    const sleet = targetAt(
      point({ feelsLikeC: 1, tempC: 0, weatherCode: 63, rainProb: 80 }),
      walk,
      day,
    );
    expect(sleet).toMatchObject({ footwear: "boots", hands: "gloves", head: "beanie" });
    const ice = targetAt(
      point({ feelsLikeC: 2, tempC: 1.5, weatherCode: 67, rainProb: 80 }),
      walk,
      day,
    );
    expect(ice.footwear).toBe("boots");
    expect(ice.outer).toBe("puffer");
  });

  test("hot or muggy: a water bottle, unless it's raining", () => {
    expect(targetAt(point({ feelsLikeC: 29 }), walk, day).carry).toBe("bottle");
    expect(targetAt(point({ feelsLikeC: 24, humidity: 85 }), walk, day).carry).toBe("bottle");
    expect(targetAt(point({ feelsLikeC: 24, humidity: 40 }), walk, day).carry).toBeUndefined();
    expect(
      targetAt(point({ feelsLikeC: 29, weatherCode: 63, rainProb: 80 }), walk, day).carry,
    ).toBe("umbrella");
  });

  test("style and profile pick the new pieces", () => {
    const smart = profile({ style: "smart" });
    expect(targetAt(point({ feelsLikeC: 5 }), smart, day).head).toBe("earmuffs");
    expect(targetAt(point({ feelsLikeC: 23 }), smart, day).top).toBe("shirt");
    expect(targetAt(point({ feelsLikeC: 19 }), bike, day).outer).toBe("vest");
    expect(targetAt(point({ feelsLikeC: 16 }), profile({ sensitivity: "warm" }), day).outer).toBe(
      "vest",
    );
    expect(targetAt(point({ feelsLikeC: 11 }), bike, day).outer).toBe("windbreaker");
  });

  test("muggy heat makes him sweaty; gusts make him windblown", () => {
    expect(moodFor(point({ feelsLikeC: 25, humidity: 85 }), walk)).toBe("sweaty");
    expect(moodFor(point({ gustKmh: 60 }), walk)).toBe("windblown");
  });

  test("each fixture day gets the notable condition it was built for", () => {
    expect(dayCondition(summaryFor("freezing-snow"))).toBe("snow");
    expect(dayCondition(summaryFor("big-swing"))).toBe("swing");
    expect(dayCondition(summaryFor("mild-clear"))).toBeNull();
  });
});
