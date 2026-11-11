import { afterEach, describe, expect, test, vi } from "vitest";
import { pickPlaceName, placeNameFor, reverseGeocodeUrl } from "@/lib/placeName";

afterEach(() => vi.unstubAllGlobals());

describe("town name for 'Use my location'", () => {
  test("rounds coordinates to ~1 km before they leave the browser", () => {
    const u = new URL(reverseGeocodeUrl(47.376887, 8.541694));
    expect(u.hostname).toBe("api.bigdatacloud.net");
    expect(u.searchParams.get("latitude")).toBe("47.38");
    expect(u.searchParams.get("longitude")).toBe("8.54");
  });

  test("prefers city, then locality, then region; cleans the name", () => {
    expect(pickPlaceName({ city: "Zürich", locality: "Kreis 1" })).toBe("Zürich");
    expect(pickPlaceName({ city: "", locality: "Ascona" })).toBe("Ascona");
    expect(pickPlaceName({ principalSubdivision: "Ticino" })).toBe("Ticino");
    expect(pickPlaceName({ city: "<b>Rome</b>" })).toBe("bRomeb");
    expect(pickPlaceName({})).toBeNull();
    expect(pickPlaceName("nonsense")).toBeNull();
  });

  test("returns the name from a good answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ city: "Lugano" })),
    );
    await expect(placeNameFor(46.0, 8.95)).resolves.toBe("Lugano");
  });

  test("falls back to 'Your location' on errors, bad answers or no network", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(placeNameFor(1, 1)).resolves.toBe("Your location");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ weird: true })),
    );
    await expect(placeNameFor(1, 1)).resolves.toBe("Your location");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    await expect(placeNameFor(1, 1)).resolves.toBe("Your location");
  });
});
