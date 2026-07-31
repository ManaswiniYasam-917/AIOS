import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.connection import Base
from backend.domain.models import AgentModel
from backend.ai.planning import create_execution_plan
from backend.ai.reasoning import execute_reasoning_loop
from backend.ai.runtime import AgentRuntime, AgentContext

# Setup mock test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_runtime.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_planning_methods():
    plan_bfs = create_execution_plan("BFS", "Save resources", "Verify ports")
    assert len(plan_bfs) == 3
    assert "Broad check" in plan_bfs[0]

    plan_dfs = create_execution_plan("DFS", "Save resources", "Verify ports")
    assert len(plan_dfs) == 4
    assert "Drill deep" in plan_dfs[0]

    plan_astar = create_execution_plan("A*", "Save resources", "Verify ports")
    assert len(plan_astar) == 3
    assert "Path Audit" in plan_astar[0]

def test_reasoning_loops():
    class MockAgent:
        name = "MOCK-A"
        role = "Sentinel"
        goal = "Detect threats"
        tools = ["Scanner"]
        knowledge = []
        configuration = {}
    
    context = MockAgent()
    res_react = execute_reasoning_loop("ReAct", context, [], "Scan node")
    assert "Thought: I need to check security posture" in res_react["steps"][0]
    assert "[REACT LOOP SUCCESSFUL]" in res_react["output"]

    res_reflexion = execute_reasoning_loop("Reflexion", context, [], "Route payload")
    assert "Thought: Initialize routing tables" in res_reflexion["steps"][0]
    assert "[REFLEXION CYCLE COMPLETED]" in res_reflexion["output"]

def test_runtime_cycle():
    db = TestingSessionLocal()
    try:
        # Seed test agent
        agent = AgentModel(
            id="test-agent-runtime-1",
            name="TEST-ROUTING-CENTRAL",
            description="Agent for testing runtime cycles.",
            role="Supply Chain Coordinator",
            goal="Optimise delivery windows.",
            memory="Short-term",
            knowledge=["Routing Algorithms"],
            reasoning="CoT",
            planning="BFS",
            tools=["RoutePlanner"],
            permissions=[],
            configuration={},
            status="Idle",
            health="Healthy"
        )
        db.add(agent)
        db.commit()

        runtime = AgentRuntime(db)
        cycle_res = runtime.run_agent_cycle("test-agent-runtime-1", "Calculate routes to SF Node 3")
        
        assert cycle_res["agent_id"] == "test-agent-runtime-1"
        assert cycle_res["agent_name"] == "TEST-ROUTING-CENTRAL"
        assert len(cycle_res["plan"]) == 3
        assert "[CHAIN-OF-THOUGHT EXECUTION]" in cycle_res["raw_output"]
        assert len(cycle_res["encrypted_output"]) > 0
    finally:
        db.close()
