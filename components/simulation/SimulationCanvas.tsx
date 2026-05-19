"use client";

import { useEffect, useRef } from "react";
import {
  buildMetrics,
  createSimulation,
  resizeSimulation,
  tickSimulation,
} from "./mockSimulation";
import type { SimulationEvent, SimulationMetrics, SimulationModel } from "./simulationTypes";

type SimulationCanvasProps = {
  onFrameSummary: (metrics: SimulationMetrics, events: SimulationEvent[]) => void;
};

function drawWorld(ctx: CanvasRenderingContext2D, model: SimulationModel) {
  const { width, height } = model;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);

  const grid = 48;
  ctx.strokeStyle = "rgba(15, 23, 42, 0.045)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  model.clusters.forEach((cluster) => {
    const gradient = ctx.createRadialGradient(cluster.x, cluster.y, 0, cluster.x, cluster.y, cluster.radius);
    gradient.addColorStop(0, cluster.color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cluster.x, cluster.y, cluster.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(15, 23, 42, 0.42)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(cluster.label, cluster.x - cluster.radius * 0.45, cluster.y - cluster.radius - 8);
  });

  model.links.forEach((link) => {
    const source = model.agents.find((agent) => agent.id === link.sourceId);
    const target = model.agents.find((agent) => agent.id === link.targetId);
    if (!source || !target) return;

    const alpha = link.mode === "matched" ? 0.52 : link.mode === "conversation" ? 0.34 : 0.18;
    ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
    ctx.lineWidth = link.mode === "matched" ? 2.4 : 0.8 + link.score * 1.4;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  });

  model.agents.forEach((agent) => {
    agent.trail.forEach((point, index) => {
      const opacity = Math.max(0, 0.12 - index * 0.012);
      ctx.fillStyle = `${agent.color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(1.2, agent.radius - index * 0.28), 0, Math.PI * 2);
      ctx.fill();
    });

    if (agent.state === "matched" || agent.state === "conversation" || agent.state === "probing") {
      ctx.strokeStyle =
        agent.state === "matched"
          ? "rgba(34, 197, 94, 0.35)"
          : agent.state === "conversation"
            ? "rgba(59, 130, 246, 0.25)"
            : "rgba(251, 146, 60, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(agent.x, agent.y, agent.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
    }

    const size =
      agent.radius +
      (agent.state === "matched" ? 3.2 : agent.state === "conversation" ? 2 : agent.state === "cooldown" ? -0.8 : 0);

    ctx.fillStyle = agent.color;
    ctx.globalAlpha = agent.state === "cooldown" ? 0.48 : 0.9;
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, Math.max(2.4, size), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

export default function SimulationCanvas({ onFrameSummary }: SimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<SimulationModel>(createSimulation());
  const animationRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const lastSummaryRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(320, Math.floor(rect.width * dpr));
      canvas.height = Math.max(320, Math.floor(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      resizeSimulation(modelRef.current, rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = (now: number) => {
      const last = lastTickRef.current || now;
      const dt = now - last;
      lastTickRef.current = now;

      tickSimulation(modelRef.current, dt, now);
      drawWorld(context, modelRef.current);

      if (now - lastSummaryRef.current > 650) {
        lastSummaryRef.current = now;
        onFrameSummary(buildMetrics(modelRef.current), modelRef.current.events.slice(0, 12));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [onFrameSummary]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[480px] w-full rounded-[2rem] border border-black/10 bg-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:h-[680px]"
      aria-label="Nira synthetic relationship simulation canvas"
    />
  );
}
