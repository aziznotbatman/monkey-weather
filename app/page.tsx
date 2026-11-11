import { MonkeyWeatherApp } from "@/components/app/MonkeyWeatherApp";

const portfolioUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL?.startsWith("https://")
  ? process.env.NEXT_PUBLIC_PORTFOLIO_URL
  : undefined;

export default function Home() {
  return <MonkeyWeatherApp portfolioUrl={portfolioUrl} />;
}
