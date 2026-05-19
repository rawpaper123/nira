"use client";

import { useCallback, useState } from "react";
import SimulationCanvas from "./SimulationCanvas";
import SimulationEventFeed from "./SimulationEventFeed";
import SimulationSidebar from "./SimulationSidebar";
import type { SimulationEvent, SimulationMetrics } from "./simulationTypes";

const initialMetrics: SimulationMetrics = {
  activeAgents: 118,
  currentConversations: 0,
  potentialMatches: 0,
  highConfidenceMatches: 0,
  safetyFiltered: 0,
  averageCompatibility: 64,
  eventClusters: 0,
  simulationSpeed: "1.0x",
  runId: "sim-20260519-v0",
};

export default function SimulationWorld() {
  const [metrics, setMetrics] = useState<SimulationMetrics>(initialMetrics);
  const [events, setEvents] = useState<SimulationEvent[]>([]);

  const handleFrameSummary = useCallback((nextMetrics: SimulationMetrics, nextEvents: SimulationEvent[]) => {
    setMetrics(nextMetrics);
    setEvents(nextEvents);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <SimulationCanvas onFrameSummary={handleFrameSummary} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-black/10 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Dot</p>
            <p className="mt-2 text-sm text-neutral-600">AI 生成的合成用户画像</p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Line</p>
            <p className="mt-2 text-sm text-neutral-600">模拟互动或活动匹配信号</p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Cluster</p>
            <p className="mt-2 text-sm text-neutral-600">临时活动场景簇</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <SimulationSidebar metrics={metrics} />
        <SimulationEventFeed events={events} />
      </div>
    </div>
  );
}
