import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk, Albert_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import ThemeScript from "@/components/ui/theme-script";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getSiteContent } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";

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
  const { metadata, hero } = await getSiteContent();

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
      url: "https://aman.is-a.dev/",
      siteName: `${metadata.author} Portfolio`,
      type: "website",
      images: [
        {
          url: hero.image,
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      creator: "@amang9446",
      images: [hero.image],
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
          <Toaster position="top-right" richColors closeButton />
          <SpeedInsights />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
