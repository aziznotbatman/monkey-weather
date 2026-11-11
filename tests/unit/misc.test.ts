import { describe, expect, test } from "vitest";
import { createTtlCache, outfitCacheKey } from "@/lib/cache";
import { applyChange, changedSlots, outfitAt } from "@/lib/outfitState";
import { createRateLimiter } from "@/lib/ratelimit";
import { contrastRatio, skyFor } from "@/lib/theme";
import { sky, ui, ink } from "@/lib/tokens";
import { cToF, defaultUnitsForLocale, formatTemp, roundHalf } from "@/lib/units";
import { describeOutfit } from "@/lib/wardrobe";
import { profile, summaryFor } from "./helpers";

describe("units", () => {
  test("converts and formats", () => {
    expect(cToF(0)).toBe(32);
    expect(cToF(100)).toBe(212);
    expect(formatTemp(4, "C")).toBe("4°");
    expect(formatTemp(4, "F")).toBe("39°");
    expect(formatTemp(-0.4, "C")).toBe("0°");
    expect(roundHalf(3.26)).toBe(3.5);
  });
  test("defaults to °F only in Fahrenheit regions", () => {
    expect(defaultUnitsForLocale("en-US")).toBe("F");
    expect(defaultUnitsForLocale("it-IT")).toBe("C");
    expect(defaultUnitsForLocale("en")).toBe("C");
    expect(defaultUnitsForLocale(undefined)).toBe("C");
    expect(defaultUnitsForLocale("en-US", "Europe/Rome")).toBe("C");
    expect(defaultUnitsForLocale("en-US", "America/Chicago")).toBe("F");
  });
});

describe("outfit state", () => {
  test("add swaps within a slot, remove empties it", () => {
    const s = applyChange(
      { outer: "puffer", top: "sweater" },
      { action: "add", item: "lightjacket" },
    );
    expect(s.outer).toBe("lightjacket");
    expect(applyChange(s, { action: "remove", item: "lightjacket" }).outer).toBeUndefined();
    expect(applyChange(s, { action: "remove", item: "puffer" })).toEqual(s);
  });
  test("outfitAt applies changes up to and including the time", () => {
    const base = { top: "sweater", bottom: "trousers", footwear: "boots" } as const;
    const changes = [{ time: "13:00", action: "add", item: "umbrella", reason: "" }] as const;
    expect(outfitAt(base, [...changes], "11:00").carry).toBeUndefined();
    expect(outfitAt(base, [...changes], "13:00").carry).toBe("umbrella");
  });
  test("changedSlots lists differences", () => {
    expect(changedSlots({ top: "sweater" }, { top: "tshirt", carry: "umbrella" }).sort()).toEqual([
      "carry",
      "top",
    ]);
  });
  test("describeOutfit reads naturally", () => {
    expect(describeOutfit({ top: "tshirt", bottom: "shorts", footwear: "sandals" })).toBe(
      "T-shirt, shorts and sandals",
    );
    expect(describeOutfit({})).toBe("nothing at all");
  });
});

describe("rate limiter", () => {
  test("allows up to the limit in the window, then blocks with retry-after", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
    expect(rl("a", 0).ok).toBe(true);
    expect(rl("a", 100).ok).toBe(true);
    expect(rl("a", 200).ok).toBe(true);
    const blocked = rl("a", 300);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(rl("b", 300).ok).toBe(true);
    expect(rl("a", 1001).ok).toBe(true);
  });
  test("bounds memory", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    rl("a", 0);
    rl("b", 0);
    rl("c", 0);
    expect(rl("a", 1).ok).toBe(true);
  });
});

describe("cache", () => {
  test("expires after the TTL and evicts the oldest", () => {
    const c = createTtlCache<number>({ ttlMs: 100, maxEntries: 2 });
    c.set("a", 1, 0);
    expect(c.get("a", 50)).toBe(1);
    expect(c.get("a", 150)).toBeUndefined();
    c.set("x", 1, 0);
    c.set("y", 2, 0);
    c.set("z", 3, 0);
    expect(c.get("x", 1)).toBeUndefined();
    expect(c.size()).toBe(2);
  });
  test("key ignores display units but not the profile", () => {
    const s = summaryFor("cool-rain");
    expect(outfitCacheKey(s, profile({ units: "C" }))).toBe(
      outfitCacheKey(s, profile({ units: "F" })),
    );
    expect(outfitCacheKey(s, profile())).not.toBe(
      outfitCacheKey(s, profile({ sensitivity: "cold" })),
    );
  });
});

describe("theme", () => {
  test("every sky's text colours pass WCAG AA (4.5:1)", () => {
    for (const [kind, t] of Object.entries(sky)) {
      expect(contrastRatio(t.text, t.bg), `${kind} text`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.muted, t.bg), `${kind} muted`).toBeGreaterThanOrEqual(4.5);
    }
  });
  test("ink on UI surfaces passes AA", () => {
    for (const c of [ui.paper, ui.accent, ui.noteYellow, ui.notePink, ui.noteMint, ui.noteSky]) {
      expect(contrastRatio(ink, c)).toBeGreaterThanOrEqual(4.5);
    }
  });
  test("skyFor maps conditions", () => {
    const p = summaryFor("big-swing").hours;
    expect(skyFor(p[0])).toBe("partly");
    expect(skyFor(p[5])).toBe("rain");
    expect(skyFor(summaryFor("hot").hours[1])).toBe("clear");
    expect(skyFor(summaryFor("freezing-snow").hours[0])).toBe("snow");
    expect(skyFor({ ...p[0], isDay: false })).toBe("night");
  });
});
