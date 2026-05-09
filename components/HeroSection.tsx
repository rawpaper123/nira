"use client";

import CountdownTimer from "./CountdownTimer";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getNextWednesday19, formatMatchDate } from "@/lib/countdown";

export default function HeroSection({ onJoinClick }: { onJoinClick: () => void }) {
  const [matchDateStr, setMatchDateStr] = useState("计算中...");

  useEffect(() => {
    const tick = () => setMatchDateStr(formatMatchDate(getNextWednesday19()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 pt-20">
      <div className="flex flex-col items-center gap-8 text-center">
        <Image
          src="/images/wednesday/wednesday-vector-sun.png"
          alt="太阳"
          width={80}
          height={80}
          className="h-16 w-16 sm:h-20 sm:w-20"
          priority
        />

        <h1 className="font-logo text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl md:text-7xl lg:text-8xl">
          每周三
          <br />
          来一场约会
        </h1>

        <div className="flex items-center gap-4">
          <span className="font-logo text-4xl font-black sm:text-5xl md:text-6xl">@</span>
          <Image
            src="/images/wednesday/wednesday-date.jpg"
            alt="约会"
            width={200}
            height={200}
            className="h-28 w-28 rounded-full object-cover sm:h-36 sm:w-36"
            priority
          />
        </div>

        <CountdownTimer />

        <Image
          src="/images/wednesday/wednesday-vector-heart.png"
          alt="爱心"
          width={40}
          height={40}
          className="h-8 w-8 sm:h-10 sm:w-10"
          priority
        />

        <p className="text-sm font-medium tracking-wide text-neutral-600 sm:text-base">
          下次匹配日：{matchDateStr}
        </p>

        <p className="text-sm font-semibold tracking-wide text-black">
          已加入：<span className="font-logo text-base">21,812</span>
        </p>

        <button
          onClick={onJoinClick}
          className="mt-4 flex items-center gap-3 rounded-full bg-black px-8 py-4 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-neutral-800"
        >
          <Image
            src="/images/logos/imessage-logo.png"
            alt="微信"
            width={20}
            height={20}
            className="h-5 w-5"
          />
          发微信给 Nira 加入
        </button>
      </div>
    </section>
  );
}
