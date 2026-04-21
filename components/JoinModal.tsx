"use client";

import { useState } from "react";
import WeChatLoginButton from "./WeChatLoginButton";

export default function JoinModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md animate-fade-in rounded-3xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 transition-colors hover:text-black"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black">
              <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="font-logo text-xl font-black uppercase">You&apos;re In!</h3>
            <p className="mt-2 text-sm text-neutral-600">
              Check your inbox for next steps.
            </p>
          </div>
        ) : (
          <>
            <h3 className="mb-2 font-logo text-2xl font-black uppercase">Sign Up</h3>
            <p className="mb-6 text-sm text-neutral-600">
              Enter your school email to sign up.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setStatus("idle");
                  setErrorMessage("");
                }}
                placeholder="your@email.edu"
                className="w-full rounded-xl border-2 border-black/10 px-4 py-3 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
              />

              {errorMessage && (
                <p className="text-xs font-medium text-red-600">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:bg-neutral-800 disabled:opacity-50"
              >
                {status === "loading" ? "Signing up..." : "Next"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10" />
              <span className="text-xs text-neutral-400">or</span>
              <div className="h-px flex-1 bg-black/10" />
            </div>

            <div className="mt-4">
              <WeChatLoginButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
