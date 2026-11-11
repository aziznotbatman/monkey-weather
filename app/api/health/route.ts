import { connection } from "next/server";
import { isAiConfigured } from "@/lib/env";

/** Safe configuration check: says whether a key is present, never what it is. */
export async function GET() {
  await connection();
  return Response.json(
    { aiConfigured: isAiConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
