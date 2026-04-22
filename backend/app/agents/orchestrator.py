"""Orchestrator - LangGraph StateGraph 编排

使用纯逻辑 Supervisor 编排 4 个 Agent 的完整匹配流程：
  build_profile → simulate → evaluate → schedule

优化：profile_a 和 profile_b 并行构建，降低总耗时。
"""

from __future__ import annotations

import asyncio

from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph
from typing_extensions import TypedDict

from app.agents.compatibility_agent import evaluate_compatibility
from app.agents.profile_agent import build_profile
from app.agents.scheduler_agent import generate_activity_plan
from app.agents.simulation_agent import simulate_interaction


class OrchestratorState(TypedDict, total=False):
    user_id_a: str
    user_id_b: str
    raw_input_a: str | None
    raw_input_b: str | None
    profile_a: dict | None
    profile_b: dict | None
    simulation_result: dict | None
    compatibility: dict | None
    activity_plan: dict | None
    city: str | None
    error: str | None


def supervisor_route(state: OrchestratorState) -> str:
    if state.get("error"):
        return END
    if state.get("profile_a") is None or state.get("profile_b") is None:
        return "build_profile"
    if state.get("simulation_result") is None:
        return "simulate"
    if state.get("compatibility") is None:
        return "evaluate"
    if state.get("activity_plan") is None:
        return "schedule"
    return END


async def profile_node(state: OrchestratorState) -> dict:
    try:
        tasks = []
        keys = []
        if state.get("profile_a") is None and state.get("raw_input_a"):
            tasks.append(build_profile(state["raw_input_a"]))
            keys.append("profile_a")
        if state.get("profile_b") is None and state.get("raw_input_b"):
            tasks.append(build_profile(state["raw_input_b"]))
            keys.append("profile_b")

        if not tasks:
            return {}

        results = await asyncio.gather(*tasks)
        return dict(zip(keys, results))
    except Exception as e:
        return {"error": f"Profile build failed: {e}"}


async def simulation_node(state: OrchestratorState) -> dict:
    try:
        result = await simulate_interaction(
            state["profile_a"],
            state["profile_b"],
        )
        return {"simulation_result": result}
    except Exception as e:
        return {"error": f"Simulation failed: {e}"}


async def compatibility_node(state: OrchestratorState) -> dict:
    try:
        result = await evaluate_compatibility(
            state["profile_a"],
            state["profile_b"],
            state["simulation_result"],
        )
        return {"compatibility": result}
    except Exception as e:
        return {"error": f"Compatibility evaluation failed: {e}"}


async def scheduler_node(state: OrchestratorState) -> dict:
    try:
        result = await generate_activity_plan(
            state["profile_a"],
            state["profile_b"],
            state["compatibility"],
            state.get("city"),
        )
        return {"activity_plan": result}
    except Exception as e:
        return {"error": f"Schedule generation failed: {e}"}


def build_orchestration_graph() -> CompiledStateGraph:
    graph = StateGraph(OrchestratorState)

    graph.add_node("build_profile", profile_node)
    graph.add_node("simulate", simulation_node)
    graph.add_node("evaluate", compatibility_node)
    graph.add_node("schedule", scheduler_node)

    graph.set_entry_point("build_profile")

    graph.add_conditional_edges("build_profile", supervisor_route)
    graph.add_conditional_edges("simulate", supervisor_route)
    graph.add_conditional_edges("evaluate", supervisor_route)
    graph.add_conditional_edges("schedule", supervisor_route)

    return graph.compile()


orchestrator_graph = build_orchestration_graph()
