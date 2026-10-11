import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionRoot } from "@/components/motion-root";
import { PrototypeBar } from "@/components/prototype-bar";
import { SITE } from "@/lib/config";
import "./globals.css";

// The book's own typefaces. Each family ships as an Arabic and a Latin subset; listing both in
// the font stack lets digits and Latin words fall through to the Latin file. The generated
// metric-fallback face is switched off because it would sit between the two and swallow them.
const plexArabic = localFont({
  variable: "--font-plex-ar",
  display: "swap",
  adjustFontFallback: false,
  src: [
    { path: "./fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
});
const plexLatin = localFont({
  variable: "--font-plex-lat",
  display: "swap",
  adjustFontFallback: false,
  src: [
    { path: "./fonts/ibm-plex-sans-arabic-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "./fonts/ibm-plex-sans-arabic-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
});
const lalezarArabic = localFont({ variable: "--font-lalezar-ar", display: "swap", weight: "400", adjustFontFallback: false, src: "./fonts/lalezar-arabic-400-normal.woff2" });
const lalezarLatin = localFont({ variable: "--font-lalezar-lat", display: "swap", weight: "400", adjustFontFallback: false, src: "./fonts/lalezar-latin-400-normal.woff2" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | ${SITE.slogan}`, template: `%s | ${SITE.short}` },
  description: SITE.description,
  applicationName: SITE.short,
  authors: [{ name: SITE.author }],
  openGraph: { type: "website", locale: "ar_SA", siteName: SITE.name, title: SITE.name, description: SITE.description, images: ["/og/01.jpg"] },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#2f5bd3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${plexArabic.variable} ${plexLatin.variable} ${lalezarArabic.variable} ${lalezarLatin.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <MotionRoot />
        <PrototypeBar />
        {children}
      </body>
    </html>
  );
}
