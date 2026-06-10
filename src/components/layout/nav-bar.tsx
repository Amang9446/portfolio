"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { portfolioConfig, type SocialLink } from "@/config/portfolio";
import { getIcon } from "../ui/icons";
import ThemeToggle from "../ui/theme-toggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

interface NavBarProps {
  socialLinks?: SocialLink[];
}

export default function NavBar({
  socialLinks = portfolioConfig.contact.socialLinks,
}: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          onClick={closeMenu}
          className="font-display text-lg font-semibold tracking-tight"
        >
          Aman
          <span className="text-primary">.</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 lg:flex">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {getIcon(social.icon, { className: "h-4 w-4" })}
              </a>
            ))}
          </div>

          <ThemeToggle />

          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex flex-col gap-1.5 p-2"
                  aria-label="Toggle menu"
                  aria-expanded={isMenuOpen}
                >
                  <span
                    className={`h-px w-5 bg-foreground transition-all duration-300 ${
                      isMenuOpen ? "translate-y-[3.5px] rotate-45" : ""
                    }`}
                  />
                  <span
                    className={`h-px w-5 bg-foreground transition-all duration-300 ${
                      isMenuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
                    }`}
                  />
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="flex h-auto flex-col rounded-t-2xl border-t border-border bg-background px-0 pt-3 pb-8"
              >
                <div className="mb-2 flex items-center justify-center">
                  <div className="h-1 w-10 rounded-full bg-border" />
                </div>
                <SheetHeader className="px-6 pb-0 text-left">
                  <SheetTitle className="font-display text-base font-semibold">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col px-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={closeMenu}
                      className="border-b border-border py-4 text-lg text-foreground transition-colors last:border-b-0 hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="mt-6 flex justify-center gap-4 px-6">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {getIcon(social.icon, { className: "h-5 w-5" })}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
