"use client";

import { useState, useEffect } from "react";
import MobileMenu from "./MobileMenu";

export default function Navbar({ onJoinClick }: { onJoinClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a
            href="#"
            className="font-logo text-2xl font-black tracking-tight text-black"
          >
            Nira
          </a>

          <div className="hidden items-center gap-6 md:flex">
            <a
              href="/simulation"
              className="text-sm font-medium text-black transition-opacity hover:opacity-70"
            >
              模拟世界
            </a>
            <a
              href="#"
              className="text-sm font-medium text-black transition-opacity hover:opacity-70"
            >
              登录
            </a>
            <button
              onClick={onJoinClick}
              className="rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-neutral-800"
            >
              立即加入
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-1.5 md:hidden"
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-6 bg-black" />
            <span className="block h-0.5 w-6 bg-black" />
            <span className="block h-0.5 w-6 bg-black" />
          </button>
        </div>
      </nav>

      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onJoinClick={() => {
          setMenuOpen(false);
          onJoinClick();
        }}
      />
    </>
  );
}
