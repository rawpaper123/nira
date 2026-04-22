"""
Nira Agent Orchestrator 测试脚本

直接调用 orchestrator graph，模拟完整的匹配流程：
  用户输入 → 画像构建 → 交互模拟 → 兼容性评估 → 活动方案生成

使用方法：
    cd backend
    python -m app.test_orchestrator

前置条件：
    - .env 中已配置 DASHSCOPE_API_KEY
    - pip install -r requirements.txt
"""

import asyncio
import io
import json
import sys
import time

# Windows 控制台 UTF-8 输出
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from app.agents.orchestrator import orchestrator_graph


USER_A_INPUT = "我周末想找人一起去hiking，25-30岁，性格开朗，喜欢户外运动，偶尔也看看画展，平时下班后喜欢去咖啡馆看书"

USER_B_INPUT = "我是个文艺范的女生，喜欢看展、city walk，最近想尝试户外活动但一个人不太敢去，性格偏安静但熟了话很多"

CITY = "上海"


def _print_step(step_name: str, data: dict | None = None):
    print(f"\n{'='*60}")
    print(f"  {step_name}")
    print(f"{'='*60}")
    if data:
        print(json.dumps(data, ensure_ascii=False, indent=2))


async def run_full_test():
    print("\n🚀 Nira Agent Orchestrator 测试")
    print(f"   用户A: {USER_A_INPUT[:40]}...")
    print(f"   用户B: {USER_B_INPUT[:40]}...")
    print(f"   城市: {CITY}")

    initial_state = {
        "user_id_a": "test-user-a",
        "user_id_b": "test-user-b",
        "raw_input_a": USER_A_INPUT,
        "raw_input_b": USER_B_INPUT,
        "profile_a": None,
        "profile_b": None,
        "simulation_result": None,
        "compatibility": None,
        "activity_plan": None,
        "city": CITY,
        "error": None,
    }

    start = time.time()
    print("\n⏳ 开始执行 Orchestrator 全流程...\n")

    final_state = await orchestrator_graph.ainvoke(initial_state)
    elapsed = time.time() - start

    if final_state.get("error"):
        print(f"\n❌ 流程出错: {final_state['error']}")
        return

    # Step 1: 用户画像
    _print_step("Step 1 - 用户画像", {
        "用户A": final_state.get("profile_a"),
        "用户B": final_state.get("profile_b"),
    })

    # Step 2: 交互模拟
    sim = final_state.get("simulation_result", {})
    _print_step("Step 2 - 深度交互模拟", {
        "chemistry_analysis": sim.get("chemistry_analysis"),
        "overall_chemistry": sim.get("overall_chemistry"),
        "scenes_count": len(sim.get("scenes", [])),
        "scenes": sim.get("scenes", []),
    })

    # Step 3: 兼容性评估
    compat = final_state.get("compatibility", {})
    _print_step("Step 3 - 兼容性评估", compat)

    # Step 4: 活动方案
    plan_data = final_state.get("activity_plan", {})
    _print_step("Step 4 - 活动方案 & 海报", {
        "plan": plan_data.get("plan"),
        "poster_copy": plan_data.get("poster_copy"),
        "group_welcome": plan_data.get("group_welcome"),
    })

    # Summary
    score = compat.get("overall_score", 0)
    chemistry = sim.get("overall_chemistry", 0)
    print(f"\n{'='*60}")
    print(f"  ✅ 测试完成 (耗时 {elapsed:.1f}s)")
    print(f"{'='*60}")
    print(f"   匹配分数: {score:.0%}")
    print(f"   化学反应: {chemistry:.0%}")
    print(f"   推荐活动: {plan_data.get('plan', {}).get('title', 'N/A')}")
    print(f"   海报文案: {plan_data.get('poster_copy', 'N/A')}")
    print()


if __name__ == "__main__":
    asyncio.run(run_full_test())
