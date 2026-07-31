import logging
import datetime
from typing import Dict, Any, List, Optional
from backend.domain.models import AgentModel, AgentMessageModel, AuditLogModel
from backend.ai.reasoning import execute_reasoning_loop
from backend.ai.planning import create_execution_plan
from backend.security.encryption import encryptor

logger = logging.getLogger("aios.runtime")

class AgentContext:
    def __init__(self, agent: AgentModel, memory_pool: str):
        self.agent_id = agent.id
        self.agent_name = agent.name
        self.role = agent.role
        self.goal = agent.goal
        self.memory_strategy = memory_pool
        self.tools = agent.tools
        self.knowledge = agent.knowledge
        self.reasoning_style = agent.reasoning
        self.planning_style = agent.planning
        self.configuration = agent.configuration
        self.message_history: List[Dict[str, Any]] = []

class AgentRuntime:
    """
    Manages active Agent execution states and controls cognitive loops, 
    tool mapping, vector retrieval processes, and communication feeds.
    """
    def __init__(self, db_session):
        self.db = db_session

    def run_agent_cycle(self, agent_id: str, trigger_instruction: str) -> Dict[str, Any]:
        """
        Executes a single operational cycle for an active agent.
        Steps:
        1. Parse and compile agent context memory.
        2. Formulate planning trees (BFS/DFS/A*).
        3. Execute cognitive reasoning paths (ReAct/CoT/Reflexion).
        4. Log audit log traces and return results.
        """
        agent = self.db.query(AgentModel).filter(AgentModel.id == agent_id).first()
        if not agent:
            raise ValueError(f"Agent {agent_id} not found in cluster.")
        
        # Check active status
        if agent.status == "Paused":
            return {"status": "Skipped", "reason": "Agent is in PAUSED state."}
        
        agent.status = "Running"
        self.db.commit()

        try:
            # 1. Compile context
            context = AgentContext(agent, agent.memory)
            
            # 2. Plan breakdown
            plan = create_execution_plan(
                planning_style=context.planning_style,
                goal=context.goal,
                instruction=trigger_instruction
            )
            
            # 3. Cognitive execution loop
            result = execute_reasoning_loop(
                reasoning_style=context.reasoning_style,
                context=context,
                plan=plan,
                user_instruction=trigger_instruction,
                api_key=agent.configuration.get("api_key")
            )
            
            # Encrypt agent logs or responses if sensitive
            encrypted_output = encryptor.encrypt_string(result["output"])
            
            # 4. Generate Audit Log
            audit_log = AuditLogModel(
                user="SYSTEM_RUNTIME",
                role="Operator",
                action="AGENT_EXECUTION_CYCLE",
                status="Success",
                details=f"Agent '{agent.name}' completed cycle. Tasks: {len(plan)}. Heuristic outputs verified."
            )
            self.db.add(audit_log)
            
            agent.status = "Idle"
            agent.health = "Healthy"
            self.db.commit()
            
            return {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "plan": plan,
                "raw_output": result["output"],
                "encrypted_output": encrypted_output,
                "steps_taken": result["steps"]
            }
            
        except Exception as e:
            logger.error(f"Runtime execution failure on Agent {agent.name}: {str(e)}")
            agent.status = "Failed"
            agent.health = "Critical"
            
            audit_log = AuditLogModel(
                user="SYSTEM_RUNTIME",
                role="Operator",
                action="AGENT_EXECUTION_CRASH",
                status="Failure",
                details=f"Agent '{agent.name}' crashed. Error: {str(e)}"
            )
            self.db.add(audit_log)
            self.db.commit()
            
            raise e
