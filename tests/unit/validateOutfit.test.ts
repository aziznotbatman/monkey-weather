import { describe, expect, test } from "vitest";
import { capText, cleanText, validateOutfit } from "@/lib/validateOutfit";
import { profile, summaryFor } from "./helpers";

const summary = summaryFor("big-swing");
const good = {
  headline: "Puffer now, umbrella at 17:00.",
  monkeyLine: "Layers in the morning, lighter by lunch.",
  mood: "shivering",
  base: { head: "beanie", eyes: null, neck: "scarf", top: "sweater", outer: "puffer", bottom: "trousers", footwear: "boots", hands: null, carry: null },
  changes: [
    { time: "11:00", action: "add", item: "lightjacket", reason: "warming up to 14°" },
    { time: "17:00", action: "add", item: "umbrella", reason: "rain from 17:00" },
  ],
};

describe("validateOutfit", () => {
  test("accepts a correct AI answer unchanged", () => {
    const r = validateOutfit(good, summary, profile());
    expect(r?.repairs).toEqual([]);
    expect(r?.plan.base).toEqual({ head: "beanie", neck: "scarf", top: "sweater", outer: "puffer", bottom: "trousers", footwear: "boots" });
    expect(r?.plan.changes).toHaveLength(2);
  });

  test("rejects garbage", () => {
    expect(validateOutfit(null, summary, profile())).toBeNull();
    expect(validateOutfit({ hello: "world" }, summary, profile())).toBeNull();
  });

  test("rejects when two always-filled slots are missing", () => {
    expect(validateOutfit({ ...good, base: { top: "sweater" } }, summary, profile())).toBeNull();
  });

  test("fills one missing always-filled slot from the rule engine", () => {
    const { footwear: _f, ...base } = good.base;
    const r = validateOutfit({ ...good, base }, summary, profile());
    expect(r?.plan.base.footwear).toBeDefined();
    expect(r?.repairs).toContain("filled footwear");
  });

  test("drops unknown ids and moves misplaced items", () => {
    const r = validateOutfit({ ...good, base: { ...good.base, head: "tiara", neck: null, carry: "scarf" } }, summary, profile());
    expect(r?.plan.base.head).toBeUndefined();
    expect(r?.plan.base.neck).toBe("scarf");
  });

  test("resolves impossible combos in the base", () => {
    const r = validateOutfit({ ...good, base: { ...good.base, bottom: "shorts" } }, summary, profile());
    expect(r?.plan.base.bottom).toBe("trousers");
  });

  test("drops changes outside the window, out of order, or inconsistent", () => {
    const r = validateOutfit(
      {
        ...good,
        changes: [
          { time: "17:00", action: "add", item: "umbrella", reason: "rain" },
          { time: "05:00", action: "remove", item: "scarf", reason: "too early" },
          { time: "13:00", action: "remove", item: "gloves", reason: "not worn" },
          { time: "13:00", action: "add", item: "puffer", reason: "already worn" },
          { time: "15:00", action: "remove", item: "trousers", reason: "never" },
          { time: "25:00", action: "add", item: "cap", reason: "bad time" },
        ],
      },
      summary,
      profile(),
    );
    expect(r?.plan.changes).toEqual([{ time: "17:00", action: "add", item: "umbrella", reason: "rain" }]);
  });

  test("caps changes at four", () => {
    const changes = ["09:00", "11:00", "13:00", "15:00", "17:00"].map((time, i) => ({
      time,
      action: i % 2 ? "remove" : "add",
      item: "sunglasses",
      reason: "sun",
    }));
    const r = validateOutfit({ ...good, changes }, summary, profile());
    expect(r?.plan.changes).toHaveLength(4);
  });

  test("normalises minutes to the hour and sorts", () => {
    const r = validateOutfit({ ...good, changes: [good.changes[1], { ...good.changes[0], time: "11:30" }] }, summary, profile());
    expect(r?.plan.changes.map((c) => c.time)).toEqual(["11:00", "17:00"]);
  });

  test("caps and cleans text, sets a mood if invalid", () => {
    const r = validateOutfit(
      { ...good, mood: "ecstatic", headline: "🐒 " + "word ".repeat(30), monkeyLine: "<b>hi</b>" },
      summary,
      profile(),
    );
    expect(r?.plan.headline.length).toBeLessThanOrEqual(60);
    expect(r?.plan.headline).not.toMatch(/🐒/);
    expect(r?.plan.monkeyLine).toBe("bhi/b");
    expect(r?.plan.mood).toBe("shivering");
  });

  test("rejects when too many repairs are needed", () => {
    const changes = Array.from({ length: 8 }, () => ({ time: "03:00", action: "add", item: "cap", reason: "x" }));
    expect(validateOutfit({ ...good, changes }, summary, profile())).toBeNull();
  });
});

describe("text helpers", () => {
  test("capText cuts on a word boundary", () => {
    expect(capText("short", 10)).toBe("short");
    const cut = capText("the quick brown fox jumps over", 16);
    expect(cut.length).toBeLessThanOrEqual(16);
    expect(cut.endsWith("…")).toBe(true);
  });
  test("cleanText strips control chars and emoji", () => {
    expect(cleanText("a\u0007b  c ☔")).toBe("a b c");
    expect(cleanText(42)).toBe("");
  });
});
