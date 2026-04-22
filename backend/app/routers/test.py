from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.agents.orchestrator import orchestrator_graph

router = APIRouter(prefix="/api/v1/test", tags=["test"])


class TestMatchRequest(BaseModel):
    user_a_input: str = Field(
        default="我周末想找人一起去hiking，25-30岁，性格开朗，喜欢户外运动",
        description="用户A的自由文本描述",
    )
    user_b_input: str = Field(
        default="我是个文艺范的女生，喜欢看展、city walk，最近想尝试户外活动",
        description="用户B的自由文本描述",
    )
    city: str = Field(default="上海")


class TestMatchResponse(BaseModel):
    profile_a: dict | None
    profile_b: dict | None
    simulation: dict | None
    compatibility: dict | None
    activity_plan: dict | None
    error: str | None = None


class MultiScenarioResponse(BaseModel):
    scenarios: list[dict]


HIKING_SCENARIO = {
    "user_a_input": "我在上海工作，周末喜欢去户外徒步，但朋友都不太爱运动。想找个体力差不多的一起去爬山或者走长距离路线，我性格比较外向，路上不怕没话说",
    "user_b_input": "我最近刚搬到上海，之前在北京经常去香山爬山。想继续这个爱好但一个人不太安全，我比较慢热但聊到感兴趣的话题就很能说，平时也喜欢摄影",
    "city": "上海",
}

COFFEE_CHAT_SCENARIO = {
    "user_a_input": "程序员一枚，工作压力大，周末想找个安静的地方喝咖啡聊天放松。对咖啡本身没太多研究但喜欢氛围好的店，希望聊天对象有趣能聊到一起去",
    "user_b_input": "自由职业插画师，平时都在家画画，偶尔想出去跟人面对面聊聊天。我对咖啡有点研究，也喜欢探店，性格慢热但熟悉之后话超级多",
    "city": "杭州",
}

BOARD_GAME_SCENARIO = {
    "user_a_input": "桌游爱好者！密室逃脱、剧本杀、狼人杀我都玩，想找固定搭子周末一起开组。性格比较social，喜欢带节奏",
    "user_b_input": "我玩桌游比较菜但是很感兴趣，之前只玩过几次狼人杀都输得很惨哈哈。想找个有经验的带带我，我胜负欲不强主打一个参与感",
    "city": "北京",
}

TEST_SCENARIOS = {
    "hiking": HIKING_SCENARIO,
    "coffee_chat": COFFEE_CHAT_SCENARIO,
    "board_game": BOARD_GAME_SCENARIO,
}


@router.post("/match", response_model=TestMatchResponse)
async def test_full_match(req: TestMatchRequest):
    initial_state = {
        "user_id_a": "test-a",
        "user_id_b": "test-b",
        "raw_input_a": req.user_a_input,
        "raw_input_b": req.user_b_input,
        "profile_a": None,
        "profile_b": None,
        "simulation_result": None,
        "compatibility": None,
        "activity_plan": None,
        "city": req.city,
        "error": None,
    }

    result = await orchestrator_graph.ainvoke(initial_state)

    return TestMatchResponse(
        profile_a=result.get("profile_a"),
        profile_b=result.get("profile_b"),
        simulation=result.get("simulation_result"),
        compatibility=result.get("compatibility"),
        activity_plan=result.get("activity_plan"),
        error=result.get("error"),
    )


@router.post("/match/scenario/{scenario_name}", response_model=TestMatchResponse)
async def test_scenario_match(scenario_name: str):
    if scenario_name not in TEST_SCENARIOS:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found. Available: {list(TEST_SCENARIOS.keys())}")

    scenario = TEST_SCENARIOS[scenario_name]
    initial_state = {
        "user_id_a": f"test-{scenario_name}-a",
        "user_id_b": f"test-{scenario_name}-b",
        "raw_input_a": scenario["user_a_input"],
        "raw_input_b": scenario["user_b_input"],
        "profile_a": None,
        "profile_b": None,
        "simulation_result": None,
        "compatibility": None,
        "activity_plan": None,
        "city": scenario["city"],
        "error": None,
    }

    result = await orchestrator_graph.ainvoke(initial_state)

    return TestMatchResponse(
        profile_a=result.get("profile_a"),
        profile_b=result.get("profile_b"),
        simulation=result.get("simulation_result"),
        compatibility=result.get("compatibility"),
        activity_plan=result.get("activity_plan"),
        error=result.get("error"),
    )


@router.get("/scenarios")
async def list_scenarios():
    return {
        "available_scenarios": {
            name: {
                "city": s["city"],
                "user_a_summary": s["user_a_input"][:50] + "...",
                "user_b_summary": s["user_b_input"][:50] + "...",
            }
            for name, s in TEST_SCENARIOS.items()
        }
    }
