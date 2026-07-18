import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--nami-font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--nami-font-mono",
});
const display = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--nami-font-display",
});

export const metadata: Metadata = {
  title: "Nami Gear",
  description: "Підібрані ігрові килимки, скляні поверхні та глайди для миші.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${mono.variable} ${display.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
