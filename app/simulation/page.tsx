import Link from "next/link";
import SimulationWorld from "@/components/simulation/SimulationWorld";

export default function SimulationPage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-black">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-5 py-8 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="font-logo text-2xl font-black tracking-tight">
            Nira
          </Link>
          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-black shadow-sm transition hover:border-black/30"
          >
            Back to site
          </Link>
        </nav>

        <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-neutral-500 shadow-sm">
              Simulated agents only · Not real user data
            </div>
            <h1 className="font-logo text-4xl font-black uppercase leading-[0.96] tracking-tight sm:text-6xl lg:text-7xl">
              Nira Simulation World
            </h1>
            <p className="mt-5 max-w-3xl text-xl font-semibold text-black sm:text-2xl">
              Watch Nira Think
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg">
              这是 Nira 的 AI 关系撮合模拟世界。每一个 dot 都代表一个 AI 生成的用户画像，
              用于展示系统如何试探、连接、过滤和推动真实线下见面。
            </p>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
              Trust boundary
            </p>
            <p className="mt-3 text-sm leading-7 text-neutral-600">
              This public demo uses synthetic personas and local mock events. It does not connect to real users,
              real queues, production matching, private profiles, location, WeChat, or chat data.
            </p>
          </div>
        </header>

        <SimulationWorld />
      </section>
    </main>
  );
}
