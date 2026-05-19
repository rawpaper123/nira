# Nira Simulation Lab Design

## 1. Executive Summary

Nira Simulation Lab is Nira's multi-agent relationship matching laboratory. It is not the production matching engine. It is a research, demonstration, evaluation, and visualization layer for understanding how Nira reasons about relationship fit, activity context, safety boundaries, and offline meeting readiness.

The first version uses synthetic agents only. The future public `/simulation` page should show a simulated world, not a real user queue. Every dot represents an AI-generated persona agent. No dot represents a real user, a real online person, or a real queue position.

LingTai owns the long-running multi-agent thinking layer: scenario generation, persona strategy, simulation critiques, risk review, and roadmap pressure-testing. Codex owns execution: implementation, validation, commits, and writing results back to LingTai.

The public story should be: "Watch Nira think." The user is watching a relationship simulation world where synthetic personas roam, probe, connect, separate, and enter activity scenes so Nira can demonstrate its matching philosophy without exposing or implying real user behavior.

## 2. Why Not Real User Data in v0

v0 should explicitly avoid real user data. It should not connect to production users, real waitlists, real matching queues, real locations, real chats, or real engagement metrics.

Reasons:

- Trust risk: Nira is a relationship product. Any ambiguity around whether dots represent real people will reduce user trust.
- Privacy risk: Even aggregated interaction traces can imply individual behavior if rendered as live social activity.
- GTM backlash risk: "Live users are matching now" is exciting but fragile if it is not literally true.
- Higher trust threshold: Relationship matching products need stronger consent, safety, and explainability norms than ordinary SaaS demos.
- Compliance risk: Publicly displaying real matching behavior could expose sensitive social, location, or preference signals.
- Product clarity: A clearly labeled "AI relationship simulation world" is more defensible and more ownable than a pseudo-live user map.

The better frame is: Nira is transparent about how it thinks. The public page should make the simulation itself the product experience, not pretend the simulation is a live production feed.

## 3. Product Positioning

Recommended page names and positioning lines:

- Nira Simulation World
- Watch Nira Think
- 看见一次关系撮合如何发生
- 这不是 swipe，而是关系情境推演
- 每个 dot 都是一个 AI 生成的用户画像
- dots 会游离、试探、连接、分离、进入活动场景

Allowed expressions:

- simulated agents
- AI-generated personas
- relationship simulation
- simulation world
- watch Nira think
- 关系撮合模拟世界
- AI 用户画像
- 线下见面推演
- 活动搭子场景

Forbidden expressions:

- 真实用户正在匹配
- 当前在线用户
- 真实队列
- 已有 21,812 人加入
- 实时真实用户数据
- live real users

Public copy rule: every real-time claim must describe the simulation system, not real users. Acceptable: "120 synthetic agents are exploring possible matches." Not acceptable: "120 users are matching now."

## 4. Visual Direction

Use a white or very light gray background. The simulation should feel calm, precise, and alive rather than dark, tactical, or surveillance-oriented.

Recommended visual language:

- White / light gray background.
- Soft colored dots.
- Thin connection lines.
- Semi-transparent motion trails.
- Clear metrics sidebar.
- Apple / Linear / Figma sensibility.
- Gentle, trustworthy, lightweight technology feel.
- Fit for city youth, offline life, and real social connection.

Avoid:

- Dark hacker aesthetic.
- Cyber surveillance styling.
- Crypto dashboard styling.
- Overly technical visuals that make the product feel untrustworthy.
- Aggressive neon colors.
- Claims or visuals that imply private user tracking.

The page should feel like a living product demo and a research instrument: quiet interface, visible motion, legible system state, clear disclaimers.

## 5. Simulation World Concept

Core mapping:

- Dot = synthetic persona agent.
- Color = persona type, social intent, or matching preference.
- Size = activity level, confidence, or readiness.
- Line = current interaction.
- Line strength = compatibility or conversation strength.
- Cluster = temporary event or activity context.
- Trail = relationship probing history.
- Sidebar = simulation metrics.
- Event feed = recent simulation events.

The world should visually communicate that matching is not one binary score. Agents should wander, test context, form weak ties, strengthen or drop links, and sometimes enter an activity cluster such as coffee chat, hiking, exhibition, study session, or city walk.

The best v0 experience is not a static graph. It should show low-intensity movement, state changes, and recent event messages so the page feels alive without needing a backend.

## 6. Agent / Persona Types

### Slow Warmer 慢热型

- Motivation: Build trust gradually before agreeing to meet.
- Matching need: Low-pressure introductions, clear context, patient counterpart.
- Likely interaction behavior: Long roaming time, multiple weak probes, slow link strengthening.
- Failure mode: Drops links quickly if pushed into fast commitment.

### Activity Seeker 活动搭子型

- Motivation: Find someone to do a specific activity with.
- Matching need: Shared schedule, activity preference, low-friction plan.
- Likely interaction behavior: Fast probing around activities, quick entry into clusters.
- Failure mode: Weak emotional fit if activity is the only shared anchor.

### City Explorer 城市探索型

- Motivation: Discover places and experiences in the city.
- Matching need: Similar curiosity, compatible budget, geographic convenience.
- Likely interaction behavior: Moves between city-walk, cafe, exhibition, and weekend clusters.
- Failure mode: Drops links when distance or logistics are poor.

### Deep Talker 深聊型

- Motivation: Find meaningful conversation and psychological resonance.
- Matching need: Topic depth, emotional safety, slower but stronger signals.
- Likely interaction behavior: Fewer links, longer conversations, high line strength when compatible.
- Failure mode: Rejects shallow activity-only matches.

### Career Networker 职场社交型

- Motivation: Meet peers around career, industry, and ambition.
- Matching need: Similar stage, compatible professional interests, clear boundaries.
- Likely interaction behavior: Probes around events, workshops, coffee chat, and founder/student circles.
- Failure mode: Can make social matching feel transactional if context is wrong.

### Niche Hobbyist 小众兴趣型

- Motivation: Find people who share specific interests.
- Matching need: High signal on niche tags and communities.
- Likely interaction behavior: Low broad compatibility, strong cluster affinity when niche matches.
- Failure mode: Sparse matching pool; may need cross-interest bridging.

### Anime / ACG Circle 二次元圈层型

- Motivation: Find low-pressure companionship around ACG culture.
- Matching need: Shared fandom language, event context, respectful boundaries.
- Likely interaction behavior: Forms clusters around conventions, screenings, merch walks, and group contexts.
- Failure mode: Over-indexing on fandom without checking social comfort.

### Wellness / Outdoor Companion 健康户外型

- Motivation: Find someone for movement, outdoors, sports, or wellness routines.
- Matching need: Similar fitness level, location, time window, safety preference.
- Likely interaction behavior: Strong event-cluster behavior around hikes, runs, gyms, and parks.
- Failure mode: Mismatch in intensity or safety expectations.

### New-in-Town 新城市适应型

- Motivation: Build a social foothold in a new city or school.
- Matching need: Friendly guides, low-pressure activities, city orientation.
- Likely interaction behavior: Higher openness, frequent probes, benefits from group clusters.
- Failure mode: Vulnerability to one-sided effort or poor boundary handling.

### High-Boundary Cautious User 高边界谨慎型

- Motivation: Explore social connection while preserving privacy and control.
- Matching need: Strong safety filters, limited exposure, clear opt-out.
- Likely interaction behavior: Small dot size, slow movement, high rejection or cooldown frequency.
- Failure mode: Leaves simulation if too many unexpected links are created.

## 7. Dot State Machine

### roaming

- Meaning: The persona is active but not interacting with a specific candidate.
- Entry condition: Agent joins simulation, exits cooldown, or drops a link.
- Exit condition: Candidate appears, cluster invitation opens, or profile changes.
- Visual: Small soft dot moving slowly with faint trail.

### probing

- Meaning: The persona is evaluating a possible interaction.
- Entry condition: Similarity threshold, shared activity, schedule overlap, or proximity in simulation space.
- Exit condition: Link created, rejected, or probe times out.
- Visual: Dot pulses lightly; a faint dotted line may appear.

### linked

- Meaning: A tentative link exists.
- Entry condition: Probe passes minimum compatibility and safety filters.
- Exit condition: Conversation starts, link drops, or match candidate is created.
- Visual: Thin solid line between dots.

### conversation

- Meaning: Simulated agents are exchanging context or confirming fit.
- Entry condition: Linked state strengthens or event context requires coordination.
- Exit condition: Compatibility updates, match candidate created, link dropped, or safety filter triggers.
- Visual: Line brightens; small message ripple on the link.

### matched

- Meaning: The system has created a high-confidence match candidate.
- Entry condition: Compatibility, boundaries, activity context, and timing pass thresholds.
- Exit condition: Feedback phase, event-cluster state, or cooldown.
- Visual: Stronger line, soft halo, brief success animation.

### rejected

- Meaning: The persona or safety model rejects the candidate.
- Entry condition: Low compatibility, boundary conflict, safety rule, or negative feedback.
- Exit condition: Cooldown or roaming.
- Visual: Link fades out; dot briefly dims.

### cooldown

- Meaning: The persona pauses before making or receiving new probes.
- Entry condition: Rejection, dropped link, fatigue, or too many interactions.
- Exit condition: Timer expires or high-quality event cluster appears.
- Visual: Dot slows and becomes translucent.

### event-cluster

- Meaning: Persona enters a temporary activity or scene context.
- Entry condition: Activity availability, cluster invite, or strong shared intent.
- Exit condition: Event completes, link resolves, or agent returns to roaming.
- Visual: Dot moves into a lightly tinted cluster region.

## 8. Event Types

### agent_joined

- Trigger: A synthetic persona enters the simulation.
- Payload fields: `agentId`, `personaType`, `intent`, `createdAt`, `runId`.
- Visual effect: New dot fades in.

### profile_updated

- Trigger: Persona preference or state changes.
- Payload fields: `agentId`, `changedFields`, `previousSummary`, `nextSummary`.
- Visual effect: Dot changes size or ring.

### link_created

- Trigger: Probe passes initial compatibility threshold.
- Payload fields: `sourceId`, `targetId`, `compatibility`, `reasonCodes`.
- Visual effect: Thin line appears.

### conversation_started

- Trigger: A tentative link moves into simulated conversation.
- Payload fields: `sourceId`, `targetId`, `topic`, `clusterId`, `startedAt`.
- Visual effect: Line pulses with small message ripple.

### compatibility_updated

- Trigger: New preference, interaction, or context changes compatibility score.
- Payload fields: `sourceId`, `targetId`, `previousScore`, `nextScore`, `drivers`.
- Visual effect: Line opacity or thickness changes.

### link_strengthened

- Trigger: Repeated positive signals or context alignment.
- Payload fields: `sourceId`, `targetId`, `strength`, `sharedSignals`.
- Visual effect: Line becomes stronger and warmer.

### link_dropped

- Trigger: Timeout, low compatibility, fatigue, or agent choice.
- Payload fields: `sourceId`, `targetId`, `reason`, `finalScore`.
- Visual effect: Line fades and disappears.

### match_candidate_created

- Trigger: Pair exceeds match threshold and passes safety checks.
- Payload fields: `matchId`, `agentIds`, `activityType`, `confidence`, `runId`.
- Visual effect: Halo around pair; sidebar metric increments.

### safety_filtered

- Trigger: Boundary, age, location, privacy, or risk rule blocks a link.
- Payload fields: `sourceId`, `targetId`, `filterType`, `severity`, `publicReason`.
- Visual effect: Link is prevented; event feed shows anonymized safety event.

### event_cluster_created

- Trigger: Simulation creates a temporary activity context.
- Payload fields: `clusterId`, `activityType`, `capacity`, `locationType`, `startTick`.
- Visual effect: Light tinted cluster region appears.

### feedback_recorded

- Trigger: Simulated post-event feedback updates future matching.
- Payload fields: `agentId`, `matchId`, `ratingBand`, `feedbackTags`, `learningSignal`.
- Visual effect: Dots adjust color or future trajectory.

## 9. Metrics

Sidebar metrics should be clearly labeled as simulation metrics:

- Active simulated agents.
- Current conversations.
- Potential matches.
- High-confidence matches.
- Safety filtered.
- Average compatibility.
- Event clusters.
- Simulation speed.
- Run id.

The sidebar should include a persistent disclaimer: "Simulation metrics only. No real user data." Avoid vanity metrics that could be mistaken for production traction.

## 10. Privacy and Safety Boundary

v0 boundaries:

- v0 does not connect real users.
- v0 does not connect real matching queues.
- v0 does not display real user status.
- v0 does not read real phone numbers, WeChat IDs, locations, chats, photos, or profile records.
- v0 is generated from mock fixtures and local simulation rules.

Future data boundaries:

- Real data can only be used for internal shadow simulation.
- Real data must be anonymized, delayed, aggregated, sampled, and de-identified.
- Public pages should never display real data that allows inference of individual behavior.
- Internal shadow simulation must require explicit privacy review and access control.
- Safety-filter events must be aggregated and explained without exposing individual reasons.

The public simulation page should remain a transparent AI simulation world even if internal tooling later becomes more advanced.

## 11. Technical Architecture

### v0 Public Demo

- Next.js `/simulation`.
- Frontend-only mock simulation.
- Canvas 2D or SVG.
- No new heavy dependencies.
- Mock agents generated locally.
- Mock events generated locally.
- No backend.
- No real user data.

v0 should prioritize responsive motion, clear copy, and trustworthy labeling over algorithmic sophistication.

### v1 Deterministic Simulation Engine

- Backend simulation module.
- Fixed seed.
- Simulation run id.
- Fixtures.
- Event log.
- Replay.
- Metrics export.
- Tests.

v1 makes simulation runs comparable and debuggable.

### v2 Live Event Stream

- SSE or WebSocket.
- Simulation events.
- Replay mode.
- Speed control.

v2 can make the public or internal experience feel live while still using simulation events.

### v3 Internal Shadow Simulation

- Anonymized.
- Delayed.
- Aggregated.
- Internal-only.
- Not public.

v3 can compare synthetic assumptions against real-world aggregate patterns without exposing individuals.

## 12. Proposed File Structure for v0

```text
app/simulation/page.tsx
components/simulation/SimulationWorld.tsx
components/simulation/SimulationCanvas.tsx
components/simulation/SimulationSidebar.tsx
components/simulation/SimulationEventFeed.tsx
components/simulation/simulationTypes.ts
components/simulation/mockSimulation.ts
```

Keep v0 self-contained. Do not add backend routes, package dependencies, database tables, or miniprogram changes.

## 13. First Codex Implementation Milestone

The next implementation milestone should include:

- Add `/simulation` page.
- Implement a light-background simulation world.
- Generate 80-150 synthetic agents.
- Move dots smoothly.
- Let dots randomly enter `probing`, `linked`, `cooldown`, and `event-cluster` states.
- Draw lines between linked agents.
- Show simulation metrics in a sidebar.
- Show recent events in an event feed.
- Add a homepage or navigation entry to the simulation page.
- Clearly label the page: simulated agents, not real users.
- Do not connect backend.
- Do not add heavy dependencies.
- Do not modify miniprogram, backend, package-lock, or production matching code.

Recommended first implementation sequence:

1. Create static `/simulation` shell and copy disclaimers.
2. Define simulation types and mock fixtures.
3. Build deterministic local tick function.
4. Render dots and lines.
5. Add sidebar metrics and event feed.
6. Add responsive layout and mobile fallback.
7. Add entry link from website navigation only after the page is stable.

## 14. LingTai x Codex Operating Model

- Codex starts every round by checking whether the repo-local LingTai Agent is active.
- Codex writes task mail to `.lingtai/human`.
- Codex checks for replies at most twice and never waits indefinitely.
- Codex executes code based on LingTai strategy and current repo constraints.
- Codex validates implementation and commits small scoped changes.
- Codex writes results back to LingTai mailbox after completion.
- LingTai owns next-round strategy, review, risk reminders, persona updates, and scenario critique.
- Codex owns implementation, tests, commits, and verification evidence.

If LingTai is not running, Codex can proceed with low-risk design work but must report that real-time Agent collaboration was unavailable.

## 15. Open Questions

1. Should the public page permanently use only synthetic data, even after internal shadow simulation exists?
2. Does Nira need a separate internal dashboard for real evaluation and operator review?
3. Should v0 include replay, or should replay wait for v1 deterministic runs?
4. Does every public run need a visible simulation run id?
5. Should persona types be periodically updated by LingTai based on strategy work?
6. Should safety-filter events be visualized publicly, and if so at what level of abstraction?
7. What should the homepage entry be named: "Simulation", "Watch Nira Think", or "关系模拟实验室"?
8. Should public copy be Chinese-only or bilingual Chinese / English?
9. Does v0 need full mobile adaptation, or should mobile show a simplified event feed first?
10. Are screenshots and short clips from the simulation allowed for GTM?
11. Should users be able to pause or speed up the public simulation?
12. Should mock agents have visible persona labels, or should labels appear only on hover?
13. How much explanation is needed before the visual starts?
14. Should event clusters use real city activity categories or abstract categories?
15. What is the minimum disclaimer language required to avoid misleading users?

## 16. LingTai Agent Notes

A design request was sent to the repo-local LingTai mailbox. No new Agent response was available during this Codex run because the repo-local `nira-website-strategist` process was not running. The next Codex run should check the mailbox again before implementation.
