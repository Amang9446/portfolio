// This is the root layout component for your Next.js app.
// Learn more: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#root-layout-required
import { DM_Sans } from "next/font/google";
import { Space_Mono } from "next/font/google";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react"
import { cn } from "@/lib/utils";
import "./globals.css";

const fontHeading = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

const fontBody = Space_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-body",
});
interface LayoutProps {
  children: ReactNode;
}
export default function Layout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body
        className={cn("antialiased", fontHeading.variable, fontBody.variable)}
      >
        <Toaster
          position="top-center"
        />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
