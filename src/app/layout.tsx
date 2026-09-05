import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Albert_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import ThemeScript from "@/components/ui/theme-script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSiteContent, twitterCreator } from "@/lib/settings";
import { absoluteUrl, siteUrl } from "@/lib/site-url";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const albert = Albert_Sans({
  variable: "--font-albert",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  const { metadata, hero } = site;

  return {
    metadataBase: siteUrl,
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords.join(", "),
    authors: [{ name: metadata.author }],
    creator: metadata.author,
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": "/feed.xml",
      },
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: absoluteUrl("/"),
      siteName: `${metadata.author} Portfolio`,
      type: "website",
      images: hero.image
        ? [
            {
              url: hero.image,
              width: 1200,
              height: 630,
              alt: metadata.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      creator: twitterCreator(site),
      images: hero.image ? [hero.image] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${schibsted.variable} ${albert.variable} ${geistMono.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        {/* Server-rendered boot script; the client provider owns state
            only (no client-rendered <script> — React 19.2 warns). */}
        <ThemeScript />
        <ThemeProvider>
          <SpeedInsights />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
