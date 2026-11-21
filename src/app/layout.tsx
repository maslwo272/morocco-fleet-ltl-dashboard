import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Noto_Naskh_Arabic,
} from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AtlasLogix Maroc — Enterprise Fleet & LTL Optimization",
  description:
    "Executive Fleet Telemetry, Idling Monitor, LTL Capacity Optimizer & Driver Eco-Scoring for Moroccan Logistics Operators (EN / FR / AR)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${jetbrains.variable} ${notoNaskhArabic.variable}`}
    >
      <body className="font-sans antialiased selection:bg-blue-600/20">
        {children}
      </body>
    </html>
  );
}
