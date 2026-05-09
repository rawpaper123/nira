"use client";

import { useState, useEffect } from "react";
import { getNextWednesday19, calculateTimeLeft, padZero } from "@/lib/countdown";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => setTimeLeft(calculateTimeLeft(getNextWednesday19()));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-2">
        {[
          { value: padZero(timeLeft.days), label: "天" },
          { value: padZero(timeLeft.hours), label: "时" },
          { value: padZero(timeLeft.minutes), label: "分" },
          { value: padZero(timeLeft.seconds), label: "秒" },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <span className="font-logo text-3xl font-black tabular-nums sm:text-4xl md:text-5xl">
                {unit.value}
              </span>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-500">
                {unit.label}
              </span>
            </div>
            {i < 3 && (
              <span className="font-logo text-3xl font-black sm:text-4xl md:text-5xl">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
