import type { SimulationEvent } from "./simulationTypes";

type SimulationEventFeedProps = {
  events: SimulationEvent[];
};

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    minute: "2-digit",
    second: "2-digit",
  }).format(timestamp);
}

export default function SimulationEventFeed({ events }: SimulationEventFeedProps) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
            Simulation Feed
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-black">
            模拟事件流
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          本地模拟
        </span>
      </div>

      <div className="space-y-3">
        {events.length ? (
          events.slice(0, 10).map((event) => (
            <div key={event.id} className="flex gap-3 rounded-2xl bg-neutral-50 p-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-black" />
              <div>
                <p className="text-sm font-medium text-black">{event.message}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {formatTime(event.timestamp)} · {event.type}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-neutral-50 p-3 text-sm text-neutral-500">
            模拟世界正在预热中...
          </p>
        )}
      </div>
    </section>
  );
}
