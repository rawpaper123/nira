import type {
  AgentState,
  PersonaType,
  SimulationAgent,
  SimulationCluster,
  SimulationEvent,
  SimulationEventType,
  SimulationLink,
  SimulationMetrics,
  SimulationModel,
} from "./simulationTypes";

const PERSONAS: Array<{ type: PersonaType; color: string }> = [
  { type: "Slow Warmer", color: "#8fb7ff" },
  { type: "Activity Seeker", color: "#ffb86b" },
  { type: "City Explorer", color: "#7ed7c1" },
  { type: "Deep Talker", color: "#b69cff" },
  { type: "Career Networker", color: "#f7a5ba" },
  { type: "Niche Hobbyist", color: "#f6d365" },
  { type: "ACG Circle", color: "#9ad0f5" },
  { type: "Outdoor Companion", color: "#9ddc8a" },
  { type: "New-in-Town", color: "#ff9f8f" },
  { type: "Cautious User", color: "#b5bdc9" },
];

const CLUSTER_LABELS = [
  "Gallery walk",
  "Campus coffee",
  "Weekend hike",
  "City bookstore",
  "Study session",
  "Evening run",
  "Indie film",
  "Board game table",
];

const EVENT_COPY: Record<SimulationEventType, string[]> = {
  agent_joined: [
    "A synthetic persona joined the simulation",
    "New AI-generated profile entered the simulation world",
  ],
  link_created: [
    "{a} is testing a low-pressure introduction with {b}",
    "{a} found a possible shared activity window with {b}",
  ],
  conversation_started: [
    "{a} and {b} moved into a simulated context check",
    "{a} is exploring meeting context with {b}",
  ],
  compatibility_updated: [
    "Nira recalculated a synthetic compatibility signal",
    "A simulated pair score changed after context shifted",
  ],
  link_dropped: [
    "{a} and {b} drifted apart after a weak fit signal",
    "A low-confidence synthetic link faded out",
  ],
  match_candidate_created: [
    "Nira found a possible activity-based match",
    "{a} and {b} became a simulated match candidate",
  ],
  safety_filtered: [
    "Safety filter blocked an over-direct match",
    "Boundary mismatch prevented a synthetic connection",
  ],
  event_cluster_created: [
    "Synthetic activity scene formed around {cluster}",
    "AI personas entered a {cluster} scenario",
  ],
};

function createRng(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function pick<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function eventMessage(
  type: SimulationEventType,
  rng: () => number,
  a?: SimulationAgent,
  b?: SimulationAgent,
  cluster?: SimulationCluster,
) {
  return pick(EVENT_COPY[type], rng)
    .replace("{a}", a?.personaType ?? "Synthetic persona")
    .replace("{b}", b?.personaType ?? "another persona")
    .replace("{cluster}", cluster?.label ?? "an activity scene");
}

function addEvent(
  model: SimulationModel,
  type: SimulationEventType,
  a?: SimulationAgent,
  b?: SimulationAgent,
  cluster?: SimulationCluster,
) {
  model.events.unshift({
    id: `event-${model.tick}-${Math.floor(model.rng() * 100000)}`,
    type,
    message: eventMessage(type, model.rng, a, b, cluster),
    timestamp: Date.now(),
  });
  model.events = model.events.slice(0, 16);
}

export function createSimulation(agentCount = 118, seed = 20260519): SimulationModel {
  const rng = createRng(seed);
  const agents: SimulationAgent[] = Array.from({ length: agentCount }, (_, index) => {
    const persona = pick(PERSONAS, rng);
    const speed = 0.12 + rng() * 0.42;
    const angle = rng() * Math.PI * 2;

    return {
      id: `agent-${index + 1}`,
      personaType: persona.type,
      state: "roaming",
      x: 80 + rng() * 920,
      y: 70 + rng() * 560,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      activityLevel: 0.35 + rng() * 0.65,
      compatibilityBias: 0.25 + rng() * 0.7,
      color: persona.color,
      radius: 3.5 + rng() * 3.4,
      stateUntil: 0,
      trail: [],
    };
  });

  const model: SimulationModel = {
    runId: "sim-20260519-v0",
    agents,
    links: [],
    clusters: [],
    events: [],
    safetyFiltered: 0,
    highConfidenceMatches: 0,
    tick: 0,
    width: 1120,
    height: 680,
    rng,
  };

  for (let i = 0; i < 6; i += 1) {
    addEvent(model, "agent_joined", model.agents[i]);
  }

  return model;
}

function getAgent(model: SimulationModel, id: string) {
  return model.agents.find((agent) => agent.id === id);
}

function setState(agent: SimulationAgent, state: AgentState, now: number, duration: number) {
  agent.state = state;
  agent.stateUntil = now + duration;
}

function maybeCreateCluster(model: SimulationModel, now: number) {
  if (model.clusters.length > 4 || model.rng() > 0.018) return;

  const cluster: SimulationCluster = {
    id: `cluster-${model.tick}`,
    label: pick(CLUSTER_LABELS, model.rng),
    x: 130 + model.rng() * (model.width - 260),
    y: 100 + model.rng() * (model.height - 200),
    radius: 70 + model.rng() * 42,
    color: pick(["#ecfeff", "#fef3c7", "#eef2ff", "#f0fdf4", "#fff1f2"], model.rng),
    ttl: now + 18000 + model.rng() * 12000,
  };

  model.clusters.push(cluster);
  addEvent(model, "event_cluster_created", undefined, undefined, cluster);
}

function maybeCreateLink(model: SimulationModel, now: number) {
  if (model.links.length > 24 || model.rng() > 0.052) return;

  const source = pick(model.agents, model.rng);
  const target = pick(model.agents, model.rng);
  if (source.id === target.id) return;
  if (model.links.some((link) =>
    (link.sourceId === source.id && link.targetId === target.id) ||
    (link.sourceId === target.id && link.targetId === source.id)
  )) {
    return;
  }

  const score = Math.min(
    0.98,
    Math.max(0.18, (source.compatibilityBias + target.compatibilityBias) / 2 + (model.rng() - 0.5) * 0.32),
  );

  if (score < 0.32 && model.rng() < 0.55) {
    model.safetyFiltered += 1;
    setState(source, "rejected", now, 1100);
    setState(target, "cooldown", now, 1800);
    addEvent(model, "safety_filtered", source, target);
    return;
  }

  model.links.push({
    id: `link-${model.tick}-${source.id}-${target.id}`,
    sourceId: source.id,
    targetId: target.id,
    score,
    age: 0,
    ttl: 7000 + model.rng() * 14000,
    mode: score > 0.78 ? "conversation" : "probing",
  });

  setState(source, score > 0.78 ? "conversation" : "probing", now, 2800 + model.rng() * 3600);
  setState(target, score > 0.78 ? "conversation" : "linked", now, 2800 + model.rng() * 3600);
  addEvent(model, "link_created", source, target);
}

function updateLinks(model: SimulationModel, dt: number) {
  const expired: SimulationLink[] = [];

  model.links.forEach((link) => {
    link.age += dt;

    if (link.mode === "probing" && link.age > 2600 && link.score > 0.62) {
      link.mode = "conversation";
      const a = getAgent(model, link.sourceId);
      const b = getAgent(model, link.targetId);
      if (a && b) {
        setState(a, "conversation", Date.now(), 3500);
        setState(b, "conversation", Date.now(), 3500);
        addEvent(model, "conversation_started", a, b);
      }
    }

    if (link.mode === "conversation" && link.age > 5600 && link.score > 0.82) {
      link.mode = "matched";
      const a = getAgent(model, link.sourceId);
      const b = getAgent(model, link.targetId);
      if (a && b && a.state !== "matched" && b.state !== "matched") {
        model.highConfidenceMatches += 1;
        setState(a, "matched", Date.now(), 2600);
        setState(b, "matched", Date.now(), 2600);
        addEvent(model, "match_candidate_created", a, b);
      }
    }

    if (link.age > link.ttl || (link.score < 0.5 && link.age > 4200)) {
      expired.push(link);
    }
  });

  expired.forEach((link) => {
    const a = getAgent(model, link.sourceId);
    const b = getAgent(model, link.targetId);
    if (a && b && link.score < 0.72) {
      setState(a, "cooldown", Date.now(), 1600);
      setState(b, "roaming", Date.now(), 900);
      addEvent(model, "link_dropped", a, b);
    }
  });

  model.links = model.links.filter((link) => !expired.includes(link));
}

function updateAgents(model: SimulationModel, dt: number, now: number) {
  model.agents.forEach((agent) => {
    if (agent.stateUntil && now > agent.stateUntil) {
      agent.state = "roaming";
      agent.clusterId = undefined;
    }

    if (model.clusters.length && agent.state === "roaming" && model.rng() < 0.0035) {
      const cluster = pick(model.clusters, model.rng);
      agent.clusterId = cluster.id;
      setState(agent, "event-cluster", now, 3200 + model.rng() * 5200);
    }

    const cluster = agent.clusterId ? model.clusters.find((item) => item.id === agent.clusterId) : undefined;
    if (cluster) {
      agent.vx += (cluster.x - agent.x) * 0.000008 * dt;
      agent.vy += (cluster.y - agent.y) * 0.000008 * dt;
    } else if (model.rng() < 0.018) {
      agent.vx += (model.rng() - 0.5) * 0.04;
      agent.vy += (model.rng() - 0.5) * 0.04;
    }

    const maxSpeed = 0.28 + agent.activityLevel * 0.42;
    const speed = Math.hypot(agent.vx, agent.vy) || 1;
    if (speed > maxSpeed) {
      agent.vx = (agent.vx / speed) * maxSpeed;
      agent.vy = (agent.vy / speed) * maxSpeed;
    }

    agent.x += agent.vx * dt;
    agent.y += agent.vy * dt;

    if (agent.x < 18 || agent.x > model.width - 18) {
      agent.vx *= -0.86;
      agent.x = Math.min(model.width - 18, Math.max(18, agent.x));
    }
    if (agent.y < 18 || agent.y > model.height - 18) {
      agent.vy *= -0.86;
      agent.y = Math.min(model.height - 18, Math.max(18, agent.y));
    }

    agent.trail.unshift({ x: agent.x, y: agent.y, age: 0 });
    agent.trail = agent.trail
      .map((point) => ({ ...point, age: point.age + dt }))
      .filter((point) => point.age < 1400)
      .slice(0, 10);
  });
}

export function resizeSimulation(model: SimulationModel, width: number, height: number) {
  const prevWidth = model.width || width;
  const prevHeight = model.height || height;
  model.width = width;
  model.height = height;

  model.agents.forEach((agent) => {
    agent.x = (agent.x / prevWidth) * width;
    agent.y = (agent.y / prevHeight) * height;
  });
}

export function tickSimulation(model: SimulationModel, dt: number, now: number) {
  model.tick += 1;
  updateAgents(model, Math.min(dt, 48), now);
  updateLinks(model, dt);
  maybeCreateCluster(model, now);
  maybeCreateLink(model, now);
  if (model.rng() < 0.018) addEvent(model, "compatibility_updated");
  model.clusters = model.clusters.filter((cluster) => cluster.ttl > now);
}

export function buildMetrics(model: SimulationModel): SimulationMetrics {
  const compatibilitySum = model.links.reduce((sum, link) => sum + link.score, 0);
  const avg = model.links.length ? compatibilitySum / model.links.length : 0.64;

  return {
    activeAgents: model.agents.length,
    currentConversations: model.links.filter((link) => link.mode === "conversation").length,
    potentialMatches: model.links.length,
    highConfidenceMatches: model.highConfidenceMatches,
    safetyFiltered: model.safetyFiltered,
    averageCompatibility: Math.round(avg * 100),
    eventClusters: model.clusters.length,
    simulationSpeed: "1.0x",
    runId: model.runId,
  };
}
