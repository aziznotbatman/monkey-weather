import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Poster } from "@/components/poster/Poster";
import { SCENARIOS, scenarioById } from "@/lib/fixtures";

export const metadata: Metadata = {
  title: "Monkey Weather — scenario poster",
  robots: { index: false },
};

export function generateStaticParams() {
  return SCENARIOS.map((s) => ({ id: s.id }));
}

/** Hidden route used by `npm run assets` to render 2800×1700 portfolio composites. */
export default async function PosterPage({ params }: PageProps<"/poster/[id]">) {
  const { id } = await params;
  if (!scenarioById(id)) notFound();
  return <Poster id={id} />;
}
