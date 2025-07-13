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

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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
        <a
          href="https://github.com/Aman"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d1d5db] hover:text-[#89675c] transition-colors duration-200"
        >
          <Image
            src="https://ext.same-assets.com/145519567/739054943.svg"
            alt="GitHub"
            width={24}
            height={24}
          />
        </a>
        <a
          href="https://linkedin.com/in/Aman"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d1d5db] hover:text-[#89675c] transition-colors duration-200"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </a>
        <a
          href="https://twitter.com/Aman"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#d1d5db] hover:text-[#89675c] transition-colors duration-200"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        </a>
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
              <div className="flex gap-5 justify-center mb-1">
                <a
                  href="https://github.com/Aman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d1d5db] hover:text-[#89675c] transition-colors duration-200 p-2 rounded-full hover:bg-[#222]/40"
                >
                  <Image
                    src="https://ext.same-assets.com/145519567/739054943.svg"
                    alt="GitHub"
                    width={28}
                    height={28}
                  />
                </a>
                <a
                  href="https://linkedin.com/in/Aman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d1d5db] hover:text-[#89675c] transition-colors duration-200 p-2 rounded-full hover:bg-[#222]/40"
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com/Aman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d1d5db] hover:text-[#89675c] transition-colors duration-200 p-2 rounded-full hover:bg-[#222]/40"
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
