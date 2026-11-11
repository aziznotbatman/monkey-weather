import { describe, expect, test } from "vitest";
import { applyChange, changedSlots, outfitAt } from "@/lib/outfitState";
import { contrastRatio, skyFor } from "@/lib/theme";
import { sky, ui, ink } from "@/lib/tokens";
import { cToF, defaultUnitsForLocale, formatTemp, roundHalf } from "@/lib/units";
import { describeOutfit } from "@/lib/wardrobe";
import { summaryFor } from "./helpers";

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
