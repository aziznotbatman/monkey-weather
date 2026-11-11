import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Gochi_Hand } from "next/font/google";
import type { CSSProperties } from "react";
import { cssVariables, ui } from "@/lib/tokens";
import "./globals.css";

const display = Gochi_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Monkey Weather — what to wear today, and when to change",
  description:
    "A hand-drawn monkey wears today's outfit and tells you when to change it. Weather apps give you numbers; this one tells you what to put on.",
  openGraph: {
    title: "Monkey Weather",
    description: "What should I wear today? Ask the monkey.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: ui.home,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable}`}
      style={cssVariables() as CSSProperties}
    >
      <body>{children}</body>
    </html>
  );
}
