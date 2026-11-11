import { z } from "zod";
import { ITEM_IDS, MOODS, SLOTS, type ItemId, type Slot } from "./wardrobe";

const HH00 = /^([01]\d|2[0-3]):00$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const HourPointSchema = z
  .object({
    time: z.string().regex(HH00),
    feelsLikeC: z.number().min(-60).max(60),
    tempC: z.number().min(-60).max(60),
    rainProb: z.number().min(0).max(100),
    rainMm: z.number().min(0).max(300),
    windKmh: z.number().min(0).max(250),
    uv: z.number().min(0).max(20),
    weatherCode: z.number().int().min(0).max(99),
    isDay: z.boolean(),
  })
  .strict();

export const DaySummarySchema = z
  .object({
    dateISO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    placeLabel: z.string().max(80),
    sunrise: z.string().regex(HHMM),
    sunset: z.string().regex(HHMM),
    minFeelsLikeC: z.number().min(-60).max(60),
    maxFeelsLikeC: z.number().min(-60).max(60),
    maxRainProb: z.number().min(0).max(100),
    totalRainMm: z.number().min(0).max(1000),
    maxWindKmh: z.number().min(0).max(250),
    maxUv: z.number().min(0).max(20),
    hours: z.array(HourPointSchema).min(1).max(12),
  })
  .strict();

export const ProfileSchema = z
  .object({
    sensitivity: z.enum(["cold", "normal", "warm"]),
    getAround: z.enum(["walking", "cycling", "transit"]),
    style: z.enum(["casual", "smart"]),
    units: z.enum(["C", "F"]),
  })
  .strict();

export const OutfitRequestSchema = z
  .object({ summary: DaySummarySchema, profile: ProfileSchema })
  .strict();

const ItemIdSchema = z.enum(ITEM_IDS);

export const ChangeSchema = z
  .object({
    time: z.string(),
    action: z.enum(["add", "remove"]),
    item: ItemIdSchema,
    reason: z.string(),
  })
  .strict();

const BaseSchema = z
  .object(
    Object.fromEntries(SLOTS.map((s) => [s, ItemIdSchema.optional()])) as Record<
      Slot,
      z.ZodOptional<typeof ItemIdSchema>
    >,
  )
  .strict();

/** What a valid outfit looks like after validation (before `source` is attached). */
export const OutfitPlanSchema = z
  .object({
    headline: z.string().min(1).max(60),
    monkeyLine: z.string().min(1).max(120),
    mood: z.enum(MOODS),
    base: BaseSchema,
    changes: z.array(ChangeSchema).max(4),
  })
  .strict();

/**
 * The schema the model must fill (OpenAI Structured Outputs, strict mode).
 * Strict mode needs every key present, so empty slots are `null` here and the base
 * is a list of slot entries. `source` is deliberately absent: the server sets it.
 */
export const AiOutfitSchema = z
  .object({
    headline: z.string().describe("<= 60 chars, the monkey's voice"),
    monkeyLine: z.string().describe("<= 120 chars, one dry, warm line"),
    mood: z.enum(MOODS),
    base: z
      .object({
        head: z.enum(["beanie", "cap", "sunhat"]).nullable(),
        eyes: z.enum(["sunglasses"]).nullable(),
        neck: z.enum(["scarf"]).nullable(),
        top: z.enum(["tshirt", "longsleeve", "sweater", "hoodie"]),
        outer: z.enum(["lightjacket", "raincoat", "puffer"]).nullable(),
        bottom: z.enum(["shorts", "trousers"]),
        footwear: z.enum(["sandals", "sneakers", "boots", "rainboots"]),
        hands: z.enum(["gloves"]).nullable(),
        carry: z.enum(["umbrella"]).nullable(),
      })
      .strict(),
    changes: z
      .array(
        z
          .object({
            time: z.string().describe('"HH:00" local, inside the forecast window'),
            action: z.enum(["add", "remove"]),
            item: ItemIdSchema,
            reason: z.string().describe("<= 60 chars, plain and factual"),
          })
          .strict(),
      )
      .describe("0 to 4 changes, chronological"),
  })
  .strict();

export type HourPoint = z.infer<typeof HourPointSchema>;
export type DaySummary = z.infer<typeof DaySummarySchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type OutfitRequest = z.infer<typeof OutfitRequestSchema>;
export type Change = { time: string; action: "add" | "remove"; item: ItemId; reason: string };
export type OutfitPlan = Omit<z.infer<typeof OutfitPlanSchema>, "changes"> & { changes: Change[] };
export type AiOutfit = z.infer<typeof AiOutfitSchema>;
export type OutfitSource = "ai" | "fallback";
export type Outfit = OutfitPlan & { source: OutfitSource };

export const DEFAULT_PROFILE: Profile = {
  sensitivity: "normal",
  getAround: "walking",
  style: "casual",
  units: "C",
};
