import { describe, expect, test } from "vitest";
import { SCENARIOS } from "@/lib/fixtures";
import { outfitAt } from "@/lib/outfitState";
import { effectiveTemp, moodFor, ruleEngine, targetAt } from "@/lib/ruleEngine";
import { MONKEY_LINES } from "@/lib/lines";
import { OutfitPlanSchema, type HourPoint } from "@/lib/schema";
import { findClash, ITEM_SLOT, REQUIRED_SLOTS } from "@/lib/wardrobe";
import { profile, summaryFor } from "./helpers";

const point = (p: Partial<HourPoint>): HourPoint => ({
  time: "09:00",
  feelsLikeC: 15,
  tempC: 15,
  rainProb: 0,
  rainMm: 0,
  windKmh: 5,
  uv: 1,
  weatherCode: 0,
  isDay: true,
  ...p,
});
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
    [30, { top: "tshirt", bottom: "shorts", footwear: "sandals" }],
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
    const s = targetAt(point({ feelsLikeC: -3, rainProb: 80, weatherCode: 73 }), profile(), day);
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

  test("the seven scenarios produce seven different day plans", () => {
    const keys = new Set(
      plans.map(([, p]) => JSON.stringify([p.base, p.changes.map((c) => c.action + c.item)])),
    );
    expect(keys.size).toBe(7);
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

  test("there are at least 25 one-liners, all <= 120 chars", () => {
    const all = Object.values(MONKEY_LINES).flat();
    expect(all.length).toBeGreaterThanOrEqual(25);
    for (const l of all) expect(l.length).toBeLessThanOrEqual(120);
  });

  test("same day, same line (deterministic)", () => {
    expect(ruleEngine(summaryFor("cold-dry"), profile())).toEqual(
      ruleEngine(summaryFor("cold-dry"), profile()),
    );
  });
});
