"""
AIOS Repositories — PostgreSQL / Prisma Layer
Implements the full mission lifecycle:
  - EventRepository: create events, trigger auto-mission creation
  - MissionEngineService: orchestrates agents, workflow, messages, logs, history
  - AgentRepository (AIOS): manage 18 specialized emergency agents
  - MissionRepository, NotificationRepository, HistoryRepository, SettingsRepository
"""
import logging
import math
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from prisma import Prisma

logger = logging.getLogger("aios.repositories")

# ============================================================
# AGENT ACTIVATION RULES
# Maps event categories to lists of agent names to activate
# ============================================================

AGENT_ACTIVATION_MAP: Dict[str, List[str]] = {
    "fire":         ["Fire Agent", "Rescue Agent", "Ambulance Agent", "Hospital Agent",
                     "Drone Agent", "Power Agent", "Communication Agent"],
    "flood":        ["Flood Agent", "Rescue Agent", "Ambulance Agent", "Weather Agent",
                     "Drone Agent", "Communication Agent"],
    "accident":     ["Rescue Agent", "Ambulance Agent", "Hospital Agent", "Traffic Agent",
                     "Police Agent", "Drone Agent"],
    "road accident": ["Rescue Agent", "Ambulance Agent", "Hospital Agent", "Traffic Agent",
                      "Police Agent", "Drone Agent"],
    "traffic":      ["Traffic Agent", "Police Agent", "Drone Agent", "Communication Agent"],
    "hospital":     ["Hospital Agent", "Ambulance Agent", "Communication Agent"],
    "cyber":        ["Cyber Agent", "Communication Agent", "Police Agent"],
    "power":        ["Power Agent", "Communication Agent", "Drone Agent"],
    "airport":      ["Airport Agent", "Drone Agent", "Weather Agent",
                     "Communication Agent", "Police Agent"],
    "agriculture":  ["Agriculture Agent", "Weather Agent", "Drone Agent"],
    "factory":      ["Factory Agent", "Fire Agent", "Rescue Agent", "Power Agent", "Drone Agent"],
    "military":     ["Police Agent", "Drone Agent", "Communication Agent", "Cyber Agent"],
    "border":       ["Police Agent", "Drone Agent", "Communication Agent", "Cyber Agent"],
    "space":        ["Space Agent", "Communication Agent", "Drone Agent"],
    "railway":      ["Railway Agent", "Rescue Agent", "Police Agent",
                     "Ambulance Agent", "Communication Agent"],
    "marine":       ["Marine Agent", "Rescue Agent", "Weather Agent",
                     "Communication Agent", "Drone Agent"],
    "weather":      ["Weather Agent", "Communication Agent", "Rescue Agent"],
    "communication": ["Communication Agent", "Cyber Agent", "Power Agent"],
}

# Standard 5-step AIOS workflow
STANDARD_WORKFLOW_STEPS = [
    {"step_number": 1, "step_name": "Problem Received",
     "description": "Event registered in AIOS — initial triage and categorization complete."},
    {"step_number": 2, "step_name": "AIOS Understood Problem",
     "description": "AI analysis complete — severity score, reasoning, and impact assessment generated."},
    {"step_number": 3, "step_name": "Required Agents Activated",
     "description": "Relevant specialized agents identified and activated for mission execution."},
    {"step_number": 4, "step_name": "Agents Collaborating",
     "description": "Active agents are communicating and executing coordinated response protocols."},
    {"step_number": 5, "step_name": "Mission Completed",
     "description": "All objectives achieved. Mission archived in history. Final report generated."},
]

# AI analysis templates per category
AI_ANALYSIS_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "fire": {
        "detected_problem": "Active fire emergency detected in urban infrastructure. Immediate life-safety threat identified.",
        "reasoning": "Sensor fusion from IoT smoke detectors, thermal cameras, and citizen reports indicates high-confidence fire event. Wind speed and building density assessed for spread risk.",
        "estimated_people": 150,
        "estimated_damage": "₹2.5 Crore estimated property damage",
        "ai_summary": "High-confidence fire emergency. Fire Brigade, Rescue, and Hospital agents activated. Power grid isolation recommended to prevent escalation. Drone deployed for aerial assessment.",
    },
    "flood": {
        "detected_problem": "Flash flood conditions detected across low-lying zones. Water levels exceeding safe thresholds.",
        "reasoning": "Rainfall accumulation data, river level sensors, and satellite imagery analyzed. Flood risk model predicts 3-4 hour window before critical zone inundation.",
        "estimated_people": 500,
        "estimated_damage": "₹8 Crore estimated infrastructure damage",
        "ai_summary": "Flood emergency confirmed. Evacuation corridors mapped. Rescue boats dispatched. Emergency shelters activated at 3 locations.",
    },
    "accident": {
        "detected_problem": "Multi-vehicle collision detected on major highway. Multiple casualties reported.",
        "reasoning": "CCTV analysis confirms collision site. Ambulance dispatch triggered based on vehicle count and impact severity assessment from visual AI.",
        "estimated_people": 12,
        "estimated_damage": "₹45 Lakh vehicle damage",
        "ai_summary": "Road accident with injuries. Emergency services activated. Hospital bed reservations made. Traffic rerouted via alternate corridors.",
    },
    "cyber": {
        "detected_problem": "Coordinated cyber attack detected — network anomalies indicative of ransomware propagation.",
        "reasoning": "Network traffic analysis shows lateral movement patterns consistent with APT behaviour. Encrypted payload signatures match known ransomware families.",
        "estimated_people": 0,
        "estimated_damage": "₹15 Crore potential data breach cost",
        "ai_summary": "Active cyber threat. Network isolation protocols triggered. Threat signature analysis in progress. Incident response team alerted.",
    },
    "traffic": {
        "detected_problem": "Severe traffic gridlock affecting major arterial roads. Emergency vehicle access compromised.",
        "reasoning": "GPS fleet data and camera feeds show zero-movement zones extending over 3 km. Accident or breakdown at key intersection confirmed as root cause.",
        "estimated_people": 2000,
        "estimated_damage": "₹12 Lakh economic loss per hour",
        "ai_summary": "Traffic emergency declared. Alternate routes activated. Police coordination for manual signal override. ETA for clearance: 45 minutes.",
    },
    "hospital": {
        "detected_problem": "Hospital capacity crisis — ICU at 95% occupancy with incoming mass casualty event.",
        "reasoning": "Real-time bed availability data shows critical shortage. Patient transfer protocols initiated. Specialist staff shortfall identified.",
        "estimated_people": 85,
        "estimated_damage": "High risk of preventable mortality",
        "ai_summary": "Hospital emergency declared. Patient load-balancing activated across network. 4 hospitals coordinated for transfers. Specialist scheduling optimized.",
    },
    "power": {
        "detected_problem": "Power grid failure detected — cascading outage affecting multiple sectors.",
        "reasoning": "Smart meter data shows simultaneous load drops across transformer grid. Root cause identified as overload fault at primary substation.",
        "estimated_people": 50000,
        "estimated_damage": "₹3 Crore economic loss per hour",
        "ai_summary": "Grid failure response initiated. Backup power rerouting in progress. Critical facilities (hospitals, airports) prioritized. ETR: 2-4 hours.",
    },
    "airport": {
        "detected_problem": "Airport operations disrupted — emergency landing request received for distressed aircraft.",
        "reasoning": "ATC communications confirm aircraft system malfunction. Runway cleared as per emergency protocols. Ground support teams positioned.",
        "estimated_people": 280,
        "estimated_damage": "₹1.5 Crore operational disruption cost",
        "ai_summary": "Airport emergency declared. Emergency runway cleared. Fire tenders and ambulances on standby. Air traffic rerouted.",
    },
    "agriculture": {
        "detected_problem": "Crop disease outbreak detected affecting multiple farm clusters.",
        "reasoning": "Multispectral drone imagery shows disease spread pattern consistent with fungal blight. Weather data confirms optimal conditions for rapid spread.",
        "estimated_people": 500,
        "estimated_damage": "₹4 Crore estimated crop loss",
        "ai_summary": "Agricultural emergency. Drone surveillance deployed. Pesticide deployment logistics coordinated. Farmer advisory system activated.",
    },
    "factory": {
        "detected_problem": "Industrial accident at manufacturing facility — explosion and fire reported.",
        "reasoning": "Seismic sensor triggered combined with smoke detector activation. Worker accountability system shows potential casualties.",
        "estimated_people": 45,
        "estimated_damage": "₹12 Crore equipment and structural damage",
        "ai_summary": "Factory emergency. Fire suppression systems activated. Rescue teams deployed. Power isolated to affected zone. HAZMAT assessment initiated.",
    },
    "military": {
        "detected_problem": "Border intrusion detected — unauthorized movement of unidentified personnel.",
        "reasoning": "Radar and thermal imaging systems confirm movement patterns inconsistent with authorized activity. Pattern analysis suggests organized intrusion.",
        "estimated_people": 0,
        "estimated_damage": "National security risk — classified",
        "ai_summary": "Security alert issued. Drone surveillance deployed. Encrypted communication channels activated. Response protocols initiated per security protocol.",
    },
    "space": {
        "detected_problem": "Space mission anomaly detected — satellite telemetry shows critical system failure.",
        "reasoning": "Telemetry data indicates power subsystem failure. Communication blackout period exceeding expected duration triggers anomaly classification.",
        "estimated_people": 0,
        "estimated_damage": "₹500 Crore satellite asset at risk",
        "ai_summary": "Space mission emergency. Ground control attempting command override. Backup communication frequencies activated. Recovery window analysis in progress.",
    },
    "default": {
        "detected_problem": "Emergency situation detected requiring immediate coordinated response.",
        "reasoning": "Multi-source data aggregation confirms anomalous event. AIOS pattern recognition identifies this as requiring multi-agency coordination.",
        "estimated_people": 100,
        "estimated_damage": "Impact assessment in progress",
        "ai_summary": "AIOS emergency response initiated. Relevant agents activated. Situation monitoring in progress.",
    },
}


def _get_agent_activation_list(category: str) -> List[str]:
    """Returns the list of agent names to activate for a given event category."""
    category_lower = category.lower()
    for key, agents in AGENT_ACTIVATION_MAP.items():
        if key in category_lower or category_lower in key:
            return agents
    return AGENT_ACTIVATION_MAP.get("default", ["Communication Agent", "Drone Agent"])


def _get_ai_template(category: str) -> Dict[str, Any]:
    """Returns the AI analysis template for an event category."""
    category_lower = category.lower()
    for key in AI_ANALYSIS_TEMPLATES:
        if key in category_lower or category_lower in key:
            return AI_ANALYSIS_TEMPLATES[key]
    return AI_ANALYSIS_TEMPLATES["default"]


def _severity_to_score(severity: str) -> float:
    """Converts severity enum string to a numeric score."""
    scores = {"LOW": 0.25, "MEDIUM": 0.55, "HIGH": 0.80, "CRITICAL": 0.95}
    return scores.get(severity.upper(), 0.55)


# ============================================================
# MISSION ENGINE SERVICE
# Central orchestrator for the AIOS mission lifecycle
# ============================================================

class MissionEngineService:
    """
    Orchestrates the complete AIOS mission lifecycle automatically:
    1. Creates AI Analysis
    2. Creates Mission with status=ACTIVE
    3. Creates 5 standard workflow steps
    4. Activates relevant agents, keeps others in STANDBY
    5. Records inter-agent message communications
    6. Creates mission log entries
    7. Creates user notification
    8. Archives completed mission in MissionHistory
    """

    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def process_event(self, event_id: str) -> Dict[str, Any]:
        """
        Full pipeline: given an event_id, registers it in the central AIOS Event Bus
        for asynchronous processing.
        """
        try:
            from backend.database.event_bus import event_bus
            logger.info(f"🚀 Ingesting event {event_id} to Core Event Bus")
            
            # Start event bus pipeline in the background
            asyncio.create_task(event_bus.publish("EVENT_RECEIVED", {"event_id": event_id}))
            
            return {
                "mission_id": "pending-async",
                "status": "INGESTED",
                "message": "Incident pushed to central event bus pipeline asynchronously."
            }

        except Exception as e:
            logger.error(f"❌ Event ingestion failed for event {event_id}: {e}")
            raise

    async def _create_ai_analysis(self, event) -> Any:
        """Creates an AI analysis record for the event."""
        template = _get_ai_template(event.detected_category)
        severity_score = _severity_to_score(event.severity if isinstance(event.severity, str) else event.severity.value)

        return await self.db.aianalysis.create(data={
            "event_id": event.event_id,
            "detected_problem": template["detected_problem"],
            "reasoning": template["reasoning"],
            "severity_score": severity_score,
            "estimated_people": template.get("estimated_people", 0),
            "estimated_damage": template.get("estimated_damage", "Assessment in progress"),
            "ai_summary": template["ai_summary"],
            "confidence": event.confidence_score or 0.92,
        })

    async def _create_mission(self, event, analysis) -> Any:
        """Creates a Mission record linked to the event."""
        mission_name = f"AIOS Mission — {event.event_title}"
        location_str = ", ".join(filter(None, [event.city, event.state, event.country]))

        return await self.db.mission.create(data={
            "event_id": event.event_id,
            "mission_name": mission_name,
            "mission_status": "ACTIVE",
            "start_time": datetime.now(timezone.utc),
            "completion_percentage": 0.0,
            "ai_summary": analysis.ai_summary,
        })

    async def _create_workflow_steps(self, mission_id: str) -> List[Any]:
        """Creates all 5 standard workflow steps for a mission."""
        steps = []
        for step_def in STANDARD_WORKFLOW_STEPS:
            step = await self.db.workflowstep.create(data={
                "mission_id": mission_id,
                "step_number": step_def["step_number"],
                "step_name": step_def["step_name"],
                "description": step_def["description"],
                "status": "PENDING",
            })
            steps.append(step)
        return steps

    async def _complete_workflow_step(self, workflow_id: str) -> None:
        """Marks a workflow step as IN_PROGRESS then COMPLETED."""
        now = datetime.now(timezone.utc)
        await self.db.workflowstep.update(
            where={"workflow_id": workflow_id},
            data={
                "status": "COMPLETED",
                "started_at": now,
                "completed_at": now,
            }
        )

    async def _activate_agents(self, event_id: str, category: str) -> List[Any]:
        """
        Fetches all AIOS agents, creates EventAgentMapping for each:
        - Agents matching category → ACTIVE
        - All others → STANDBY
        Returns the list of ACTIVE agents.
        """
        all_agents = await self.db.agent.find_many(where={"is_enabled": True})
        required_agent_names = _get_agent_activation_list(category)
        now = datetime.now(timezone.utc)
        activated = []

        for agent in all_agents:
            is_active = agent.agent_name in required_agent_names
            status = "ACTIVE" if is_active else "STANDBY"

            try:
                await self.db.eventagentmapping.create(data={
                    "event_id": event_id,
                    "agent_id": agent.agent_id,
                    "status": status,
                    "activation_time": now if is_active else None,
                    "current_task": f"Responding to {category} emergency" if is_active else None,
                })
                if is_active:
                    activated.append(agent)
            except Exception as e:
                # Skip duplicate mappings (in case event was processed twice)
                logger.warning(f"Skipping agent mapping for {agent.agent_name}: {e}")

        return activated

    async def _record_agent_messages(self, mission_id: str, active_agents: List[Any], event) -> List[Any]:
        """Records realistic inter-agent communications during the mission."""
        messages = []
        if not active_agents:
            return messages

        # Generate communication messages between agents
        comms_templates = [
            ("ACTIVATION SIGNAL: {agent} deployed to {category} emergency. All units acknowledge.",
             "BROADCAST"),
            ("STATUS REPORT: {agent} on-site. Situation assessment in progress. Requesting support.",
             "DIRECT"),
            ("COORDINATION: Sharing sensor data and response protocols with all active units.",
             "KNOWLEDGE_SHARING"),
            ("TASK DELEGATION: Primary response unit requesting backup for casualty management.",
             "TASK_SHARING"),
            ("HEARTBEAT: {agent} operational. All systems nominal. Awaiting further instructions.",
             "HEARTBEAT"),
        ]

        for i, agent in enumerate(active_agents[:6]):  # Cap at 6 messages
            template_text, msg_type = comms_templates[i % len(comms_templates)]
            message_text = template_text.format(
                agent=agent.agent_name,
                category=event.detected_category
            )

            # Determine receiver (next agent in list, or None for broadcast)
            receiver_id = None
            if msg_type == "DIRECT" and len(active_agents) > 1:
                next_agent = active_agents[(i + 1) % len(active_agents)]
                receiver_id = next_agent.agent_id

            try:
                msg = await self.db.agentmessage.create(data={
                    "mission_id": mission_id,
                    "sender_agent": agent.agent_id,
                    "receiver_agent": receiver_id,
                    "message": message_text,
                    "message_type": msg_type,
                })
                messages.append(msg)
            except Exception as e:
                logger.warning(f"Failed to create agent message: {e}")

        return messages

    async def _create_mission_logs(self, mission_id: str, event_id: str,
                                    active_agents: List[Any], event) -> None:
        """Creates audit log entries for key mission activities."""
        log_entries = [
            f"Event '{event.event_title}' received and classified as {event.detected_category.upper()} severity {event.severity}.",
            f"AIOS AI engine analyzed event. Severity score calculated. {len(active_agents)} agents selected for activation.",
            f"Agent activation complete: {', '.join(a.agent_name for a in active_agents[:5])}{'...' if len(active_agents) > 5 else ''}",
            f"Mission briefing transmitted to all active agents. Coordination protocols established.",
            f"Mission completed successfully. All objectives achieved. Report archived in MissionHistory.",
        ]

        for activity in log_entries:
            try:
                await self.db.missionlog.create(data={
                    "mission_id": mission_id,
                    "event_id": event_id,
                    "activity": activity,
                    "performed_by": "AIOS_ENGINE",
                })
            except Exception as e:
                logger.warning(f"Failed to create mission log: {e}")

    async def _create_mission_notification(self, event, mission, agent_count: int) -> None:
        """Creates a notification for the mission completion."""
        notif_type = "CRITICAL" if event.severity in ("CRITICAL", "HIGH") else "MISSION"
        try:
            await self.db.notification.create(data={
                "user_id": event.reported_by,
                "title": f"Mission Launched: {event.event_title}",
                "message": (
                    f"AIOS has processed your {event.detected_category} event report. "
                    f"{agent_count} specialized agents were activated. "
                    f"Mission '{mission.mission_name}' completed successfully. "
                    f"Full report available in Mission History."
                ),
                "notification_type": notif_type,
            })
        except Exception as e:
            logger.warning(f"Failed to create mission notification: {e}")


# ============================================================
# EVENT REPOSITORY
# ============================================================

class EventRepository:
    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def create(self, data: Dict[str, Any]) -> Any:
        return await self.db.event.create(data=data)

    async def get_all(self, limit: int = 50) -> List[Any]:
        return await self.db.event.find_many(
            order={"created_at": "desc"},
            take=limit,
        )

    async def get_by_id(self, event_id: str) -> Optional[Any]:
        return await self.db.event.find_unique(
            where={"event_id": event_id},
            include={
                "ai_analysis": True,
                "missions": {
                    "include": {
                        "workflow_steps": True,
                        "agent_messages": {"include": {"sender": True}},
                        "mission_logs": True,
                    }
                },
                "agent_mappings": {"include": {"agent": True}},
            }
        )

    async def update_status(self, event_id: str, status: str) -> Any:
        return await self.db.event.update(
            where={"event_id": event_id},
            data={"status": status}
        )


# ============================================================
# MISSION REPOSITORY
# ============================================================

class MissionRepository:
    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def get_all(self, limit: int = 50) -> List[Any]:
        return await self.db.mission.find_many(
            order={"start_time": "desc"},
            take=limit,
            include={"event": True},
        )

    async def get_by_id(self, mission_id: str) -> Optional[Any]:
        return await self.db.mission.find_unique(
            where={"mission_id": mission_id},
            include={
                "workflow_steps": {"order_by": {"step_number": "asc"}},
                "agent_messages": {
                    "include": {"sender": True},
                    "order_by": {"sent_at": "asc"},
                },
                "mission_logs": {"order_by": {"activity_time": "asc"}},
                "event": True,
            }
        )

    async def get_by_event(self, event_id: str) -> List[Any]:
        return await self.db.mission.find_many(
            where={"event_id": event_id},
            include={"workflow_steps": True},
        )


# ============================================================
# AIOS AGENT REPOSITORY
# ============================================================

class AiosAgentRepository:
    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def get_all(self) -> List[Any]:
        return await self.db.agent.find_many(
            order={"agent_name": "asc"}
        )

    async def get_by_id(self, agent_id: str) -> Optional[Any]:
        return await self.db.agent.find_unique(
            where={"agent_id": agent_id}
        )

    async def get_by_name(self, name: str) -> Optional[Any]:
        return await self.db.agent.find_unique(
            where={"agent_name": name}
        )

    async def count(self) -> int:
        return await self.db.agent.count()


# ============================================================
# NOTIFICATION REPOSITORY (AIOS domain)
# ============================================================

class AiosNotificationRepository:
    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def get_all(self, limit: int = 100) -> List[Any]:
        return await self.db.notification.find_many(
            order={"created_at": "desc"},
            take=limit,
        )

    async def get_by_id(self, notification_id: str) -> Optional[Any]:
        return await self.db.notification.find_unique(
            where={"notification_id": notification_id}
        )

    async def mark_read(self, notification_id: str) -> Any:
        return await self.db.notification.update(
            where={"notification_id": notification_id},
            data={"is_read": True}
        )

    async def create(self, data: Dict[str, Any]) -> Any:
        return await self.db.notification.create(data=data)


# ============================================================
# MISSION HISTORY REPOSITORY
# ============================================================

class MissionHistoryRepository:
    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def get_all(self, limit: int = 100) -> List[Any]:
        return await self.db.missionhistory.find_many(
            order={"completed_at": "desc"},
            take=limit,
        )

    async def get_by_mission(self, mission_id: str) -> Optional[Any]:
        return await self.db.missionhistory.find_first(
            where={"mission_id": mission_id}
        )

    async def create(self, data: Dict[str, Any]) -> Any:
        return await self.db.missionhistory.create(data=data)


# ============================================================
# SYSTEM SETTINGS REPOSITORY
# ============================================================

class SystemSettingsRepository:
    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def get_all(self) -> List[Any]:
        return await self.db.systemsetting.find_many(
            order={"setting_name": "asc"}
        )

    async def get_by_name(self, name: str) -> Optional[Any]:
        return await self.db.systemsetting.find_unique(
            where={"setting_name": name}
        )

    async def upsert(self, name: str, value: str, description: Optional[str] = None) -> Any:
        data = {"setting_value": value}
        if description:
            data["description"] = description
        return await self.db.systemsetting.upsert(
            where={"setting_name": name},
            data={
                "create": {
                    "setting_name": name,
                    "setting_value": value,
                    "description": description or "",
                },
                "update": data,
            }
        )
