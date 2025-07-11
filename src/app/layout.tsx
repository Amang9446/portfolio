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
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black`}
      >
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>
        <div className="fixed left-1/2 top-[-10%] h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)] pointer-events-none"></div>

        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
