"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { portfolioConfig } from "@/config/portfolio";
import { getIcon } from "../ui/icons";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  const config = portfolioConfig;

  return (
    <nav className="sticky top-0 z-30 w-full flex justify-between items-center px-6 py-5 bg-[#0f0f0f]/80 backdrop-blur-sm border-b border-[#333]">
      <div className="flex items-center gap-2">
        <a href="#" onClick={closeMenu}>
          <Image
            src="https://ext.same-assets.com/145519567/2330266646.svg"
            alt="Aman Logo"
            width={44}
            height={44}
            className="hover:scale-105 transition-transform duration-200"
          />
        </a>
        <span className="ml-1 font-bold tracking-tight text-xl text-white">
          Aman
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8 font-medium text-[#9ca3af]">
        <a
          href="#"
          className="relative hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[2px] after:bg-[#89675c] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 font-borel"
        >
          Home
        </a>
        <a
          href="#projects"
          className="relative hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[2px] after:bg-[#89675c] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
        >
          Projects
        </a>
        <a
          href="#skills"
          className="relative hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[2px] after:bg-[#89675c] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
        >
          Skills
        </a>
        <a
          href="#contact"
          className="relative hover:text-white transition-colors duration-200 after:content-[''] after:absolute after:left-0 after:bottom-[-4px] after:w-full after:h-[2px] after:bg-[#89675c] after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
        >
          Contact
        </a>
      </div>

      {/* Desktop Social Links */}

      <div className="hidden lg:flex items-center gap-4">
        {config.contact.socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors duration-200"
            aria-label={social.name}
          >
            {getIcon(social.icon, { className: "h-6 w-6" })}
          </a>
        ))}
      </div>

      {/* Mobile Menu - Bottom Sheet */}
      <div className="md:hidden">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col gap-1 p-2"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span
                className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? "opacity-0" : ""
                }`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              ></span>
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="bg-[#101010]/90 backdrop-blur-xl border-t border-[#333] rounded-t-3xl h-[65vh] max-h-[520px] shadow-2xl animate-fadeIn flex flex-col px-0 pt-2 pb-6"
          >
            {/* Drag handle */}
            <div className="flex justify-center items-center mb-2">
              <div className="w-12 h-1.5 rounded-full bg-[#333]/60" />
            </div>
            <SheetHeader className="text-left px-6 pb-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-white text-xl font-bold">
                  Menu
                </SheetTitle>
              </div>
            </SheetHeader>
            {/* Mobile Navigation Links */}
            <div className="flex flex-col gap-2 font-medium text-[#b0b0b0] mt-6 px-6 flex-grow">
              <a
                href="#"
                className="hover:text-white transition-colors duration-200 py-3 rounded-lg px-2 text-lg font-semibold focus:bg-[#222]/40 focus:outline-none"
                onClick={closeMenu}
              >
                Home
              </a>
              <a
                href="#projects"
                className="hover:text-white transition-colors duration-200 py-3 rounded-lg px-2 text-lg font-semibold focus:bg-[#222]/40 focus:outline-none"
                onClick={closeMenu}
              >
                Projects
              </a>
              <a
                href="#skills"
                className="hover:text-white transition-colors duration-200 py-3 rounded-lg px-2 text-lg font-semibold focus:bg-[#222]/40 focus:outline-none"
                onClick={closeMenu}
              >
                Skills
              </a>
              <a
                href="#contact"
                className="hover:text-white transition-colors duration-200 py-3 rounded-lg px-2 text-lg font-semibold focus:bg-[#222]/40 focus:outline-none"
                onClick={closeMenu}
              >
                Contact
              </a>
            </div>
            {/* Social Links pinned to bottom */}
            <div className="flex flex-col items-center w-full mt-0">
              <div className="w-full border-t border-[#333]/60 my-3" />
              <p className="text-sm text-[#9ca3af] mb-2 mt-1 text-center">
                Follow me
              </p>
              <div className="flex justify-center gap-6 pt-4">
                {config.contact.socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    aria-label={social.name}
                  >
                    {getIcon(social.icon, { className: "h-6 w-6" })}
                  </a>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
