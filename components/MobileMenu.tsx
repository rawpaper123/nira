"use client";

import { useEffect } from "react";

export default function MobileMenu({
  isOpen,
  onClose,
  onJoinClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  onJoinClick: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <span className="font-logo text-xl font-black text-black">Nira</span>
          <button onClick={onClose} aria-label="Close menu">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <a
            href="/simulation"
            className="text-base font-medium text-black transition-opacity hover:opacity-70"
            onClick={onClose}
          >
            Simulation
          </a>
          <a
            href="#"
            className="text-base font-medium text-black transition-opacity hover:opacity-70"
          >
            登录
          </a>
          <button
            onClick={onJoinClick}
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-neutral-800"
          >
            立即加入
          </button>
        </div>
      </div>
    </>
  );
}
