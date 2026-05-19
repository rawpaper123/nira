export type PersonaType =
  | "Slow Warmer / 慢热型"
  | "Activity Seeker / 活动搭子型"
  | "City Explorer / 城市探索型"
  | "Deep Talker / 深聊型"
  | "Career Networker / 职业交流型"
  | "Niche Hobbyist / 小众兴趣型"
  | "ACG Circle / 二次元圈层"
  | "Outdoor Companion / 户外搭子型"
  | "New-in-Town / 新城市适应型"
  | "Cautious User / 高边界谨慎型";

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
  roaming: "游走中",
  probing: "试探中",
  linked: "已连接",
  conversation: "场景确认",
  matched: "活动候选",
  rejected: "复核后降温",
  cooldown: "冷却中",
  "event-cluster": "活动场景中",
};
