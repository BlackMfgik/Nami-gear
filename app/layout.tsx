import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: { default: "Nami Gear: ігрові килимки Artisan з Японії", template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { siteName: SITE_NAME, locale: "uk_UA", type: "website" },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${mono.variable} ${display.variable}`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
