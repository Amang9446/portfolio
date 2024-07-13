"use client"
import Link from "next/link";
import { JSX, SVGProps } from "react";
import { Contact } from "./Contact";
import { AboutMe } from "./AboutMe";
import { Footer } from "./Footer";
import { Projects } from "./Projects";
import Image from "next/image";
import { Typewriter, useTypewriter } from 'react-simple-typewriter'
export function Home() {
  const [text] = useTypewriter({
    words: ['Aman Gupta', 'Fullstack Developer', 'Mobile Developer'],
    loop: 0
  })
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link
          href="#"
          className="flex items-center justify-center"
          prefetch={false}
        >
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">John Doe</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            About
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Projects
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
            prefetch={false}
          >
            Contact
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    {text}
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Passionate web developer and designer, creating beautiful
                    and functional websites.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    href="#"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    View Projects
                  </Link>
                  <Link
                    href="#"
                    className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    prefetch={false}
                  >
                    Contact Me
                  </Link>
                </div>
              </div>
              <Image
                src="https://pics.craiyon.com/2023-10-21/aa545e073a264959ad79913b4d761d73.webp"
                width={550}
                height={550}
                quality={100}
                style={{objectFit: 'initial'}}
                alt="Animated Picture of Aman"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square"
              />
            </div>
          </div>
        </section>
        <Projects />
        <AboutMe />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export function CodeIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function MountainIcon(
  props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>
) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

function XIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
