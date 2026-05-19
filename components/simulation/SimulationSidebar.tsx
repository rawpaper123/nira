import type { SimulationMetrics } from "./simulationTypes";

type SimulationSidebarProps = {
  metrics: SimulationMetrics;
};

const labels: Array<[keyof SimulationMetrics, string, string]> = [
  ["activeAgents", "活跃模拟智能体", "AI-generated personas"],
  ["currentConversations", "活动匹配中", "Mock interaction state"],
  ["potentialMatches", "候选连接", "Synthetic links"],
  ["highConfidenceMatches", "高信心活动匹配", "Simulation candidates"],
  ["safetyFiltered", "例行安全审核", "Routine boundary checks"],
  ["averageCompatibility", "平均匹配信号", "Model score"],
  ["eventClusters", "活动场景簇", "Activity scenes"],
  ["simulationSpeed", "模拟速度", "Local playback"],
];

export default function SimulationSidebar({ metrics }: SimulationSidebarProps) {
  return (
    <aside className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-neutral-400">
          模拟世界状态 · Simulation metrics
        </p>
        <h2 className="mt-2 text-xl font-black tracking-tight text-black">
          合成智能体运行概览
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          所有指标均由本地模拟引擎生成，不使用任何真实用户数据。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {labels.map(([key, label, note]) => (
          <div key={key} className="rounded-2xl border border-black/5 bg-neutral-50 px-4 py-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {label}
              </span>
              <span className="text-lg font-black text-black">
                {key === "averageCompatibility" ? `${metrics[key]}%` : metrics[key]}
              </span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">{note}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-black px-4 py-3 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-white/50">Run id</p>
        <p className="mt-1 font-mono text-sm">{metrics.runId}</p>
      </div>
    </aside>
  );
}
