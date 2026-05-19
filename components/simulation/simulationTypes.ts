export type PersonaType =
  | "Slow Warmer"
  | "Activity Seeker"
  | "City Explorer"
  | "Deep Talker"
  | "Career Networker"
  | "Niche Hobbyist"
  | "ACG Circle"
  | "Outdoor Companion"
  | "New-in-Town"
  | "Cautious User";

export type AgentState =
  | "roaming"
  | "probing"
  | "linked"
  | "conversation"
  | "matched"
  | "rejected"
  | "cooldown"
  | "event-cluster";

export type SimulationEventType =
  | "agent_joined"
  | "link_created"
  | "conversation_started"
  | "compatibility_updated"
  | "link_dropped"
  | "match_candidate_created"
  | "safety_filtered"
  | "event_cluster_created";

export type SimulationPoint = {
  x: number;
  y: number;
  age: number;
};

export type SimulationAgent = {
  id: string;
  personaType: PersonaType;
  state: AgentState;
  x: number;
  y: number;
  vx: number;
  vy: number;
  activityLevel: number;
  compatibilityBias: number;
  color: string;
  radius: number;
  stateUntil: number;
  clusterId?: string;
  trail: SimulationPoint[];
};

export type SimulationLink = {
  id: string;
  sourceId: string;
  targetId: string;
  score: number;
  age: number;
  ttl: number;
  mode: "probing" | "conversation" | "matched";
};

export type SimulationCluster = {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  ttl: number;
};

export type SimulationEvent = {
  id: string;
  type: SimulationEventType;
  message: string;
  timestamp: number;
};

export type SimulationMetrics = {
  activeAgents: number;
  currentConversations: number;
  potentialMatches: number;
  highConfidenceMatches: number;
  safetyFiltered: number;
  averageCompatibility: number;
  eventClusters: number;
  simulationSpeed: string;
  runId: string;
};

export type SimulationModel = {
  runId: string;
  agents: SimulationAgent[];
  links: SimulationLink[];
  clusters: SimulationCluster[];
  events: SimulationEvent[];
  safetyFiltered: number;
  highConfidenceMatches: number;
  tick: number;
  width: number;
  height: number;
  rng: () => number;
};

export const STATE_LABELS: Record<AgentState, string> = {
  roaming: "Roaming",
  probing: "Probing",
  linked: "Linked",
  conversation: "Conversation",
  matched: "Matched",
  rejected: "Rejected",
  cooldown: "Cooldown",
  "event-cluster": "In activity cluster",
};
