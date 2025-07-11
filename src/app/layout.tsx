import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aman | Software Engineer",
  description:
    "Skilled Software Engineer building seemless mobile and web applications",
  keywords:
    "software engineer, mobile developer, web developer, frontend, UI/UX, portfolio, minimalist design, expo ,react native, nextjs, tailwindcss, typescript, javascript, html, css",
  authors: [{ name: "Aman" }],
  creator: "Aman",
  openGraph: {
    title: "Aman | Software Engineer",
    description:
      "Skilled Software Engineer building seemless mobile and web applications",
    url: "https://aman.is-a.dev/",
    siteName: "Aman Portfolio",
    type: "website",
    images: [
      {
        url: "https://pbs.twimg.com/profile_images/1905805359064723456/pJ1-dOHi_400x400.jpg", // You'll need to create this
        width: 1200,
        height: 630,
        alt: "Aman - Software Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aman | Software Engineer",
    description:
      "Crafting digital experiences through code, design, and creative storytelling.",
    creator: "@amang9446",
    images: [
      "https://pbs.twimg.com/profile_images/1905805359064723456/pJ1-dOHi_400x400.jpg",
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
