import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BentoSlide } from "@/components/slides/BentoSlide";
import { BuildSlide } from "@/components/slides/BuildSlide";

export const metadata: Metadata = {
  title: "Monkey Weather — portfolio slide",
  robots: { index: false },
};

const SLIDES = { ui: BentoSlide, build: BuildSlide } as const;

export function generateStaticParams() {
  return Object.keys(SLIDES).map((id) => ({ id }));
}

/** Hidden route used by `npm run assets` to render the 2800×1700 portfolio slides. */
export default async function SlidePage({ params }: PageProps<"/slides/[id]">) {
  const { id } = await params;
  const Slide = SLIDES[id as keyof typeof SLIDES];
  if (!Slide) notFound();
  return <Slide />;
}
