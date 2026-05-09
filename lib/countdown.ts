export function getNextWednesday19(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 3=Wed
  let daysUntilWed = (3 - day + 7) % 7;

  const target = new Date(now);
  target.setUTCDate(now.getUTCDate() + daysUntilWed);
  target.setUTCHours(11, 0, 0, 0); // 北京19:00 = UTC 11:00

  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 7);
  }

  return target;
}

export function formatMatchDate(date: Date): string {
  return `${date.getFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function padZero(n: number): string {
  return n.toString().padStart(2, "0");
}
