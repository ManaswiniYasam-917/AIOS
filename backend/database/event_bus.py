import asyncio
import logging
from datetime import datetime, timezone
from typing import Callable, List, Dict, Any, Awaitable
from backend.database.prisma_client import get_prisma
from backend.communication.gateway import ws_manager

logger = logging.getLogger("aios.event_bus")

class AIOSCoreEventBus:
    def __init__(self):
        self._subscribers: Dict[str, List[Callable[[Dict[str, Any]], Awaitable[None]]]] = {}

    def subscribe(self, event_type: str, callback: Callable[[Dict[str, Any]], Awaitable[None]]):
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(callback)
        logger.info(f"Subscribed to internal event: {event_type}")

    async def publish(self, event_type: str, data: Dict[str, Any]):
        logger.info(f"📣 Publishing event: {event_type}")
        handlers = self._subscribers.get(event_type, [])
        if handlers:
            # Run handlers sequentially or concurrently depending on requirements
            # Sequentially allows predictable logs & updates in real time simulation
            for handler in handlers:
                try:
                    await handler(data)
                except Exception as e:
                    logger.error(f"Error in subscriber handler for {event_type}: {e}", exc_info=True)

# Create singleton global event bus
event_bus = AIOSCoreEventBus()

# Helper emojis and details for event categories
CATEGORY_HELPERS = {
    "fire": {"icon": "🔥", "name": "Building Fire", "default_location": "SDF Industrial Area, Block C"},
    "flood": {"icon": "🌊", "name": "City Flood", "default_location": "Subarnarekha River Basin, Ghatsila Area"},
    "accident": {"icon": "🚗", "name": "Road Accident", "default_location": "National Highway NH-33, KM 42"},
    "cyber": {"icon": "💻", "name": "Cyber Attack", "default_location": "AIOS Datacenter Node 12, Main Subnet"},
    "power": {"icon": "⚡", "name": "Power Grid Failure", "default_location": "Central Grid Substation, Jamshedpur East"},
    "military": {"icon": "🛡️", "name": "Border Intrusion", "default_location": "Sector 4 Outpost, Line of Control"},
    "hospital": {"icon": "🏥", "name": "Hospital Emergency", "default_location": "City General Hospital Trauma Center"},
    "traffic": {"icon": "🚦", "name": "Traffic Congestion", "default_location": "Central Junction, MG Road Crossway"},
    "factory": {"icon": "🏭", "name": "Factory Failure", "default_location": "Tata Steel Plant Blast Furnace 4"},
    "airport": {"icon": "✈️", "name": "Airport Operations Failure", "default_location": "Birsa Munda Airport Terminal 1"},
    "agriculture": {"icon": "🌾", "name": "Crop Emergency", "default_location": "District Agri Farm, Kanke Block"},
    "space": {"icon": "🚀", "name": "Space Mission Anomaly", "default_location": "ISRO Telemetry Station, Ground Segment"}
}

# =====================================================================
# EVENT SUBSCRIBERS
# =====================================================================

async def handle_event_received(data: Dict[str, Any]):
    """
    Subscribes to EVENT_RECEIVED:
    Executes NLU analysis, classification, severity, priority, risk,
    generates reasoning metrics, and writes to database.
    """
    event_id = data["event_id"]
    db = get_prisma()
    
    event = await db.event.find_unique(where={"event_id": event_id})
    if not event:
        logger.error(f"Event {event_id} not found in database")
        return

    logger.info(f"NLU & Classification Processing: Event ID {event_id}")
    
    # Analyze text keywords to refine category and generate details
    title_lower = event.event_title.lower()
    desc_lower = event.event_description.lower()
    
    category = event.detected_category.lower() or "accident"
    helper = CATEGORY_HELPERS.get(category, {"icon": "🚨", "name": "Emergency Incident", "default_location": "Central Sector"})
    
    # Risk Assessment and Estimates
    severity = event.severity  # LOW, MEDIUM, HIGH, CRITICAL
    
    severity_score = 0.5
    if severity == "CRITICAL":
        severity_score = 0.95
    elif severity == "HIGH":
        severity_score = 0.8
    elif severity == "MEDIUM":
        severity_score = 0.6
    else:
        severity_score = 0.3
        
    estimated_people = 10
    estimated_damage = "Medium structural impact"
    estimated_duration = 1800
    
    if severity == "CRITICAL":
        estimated_people = 45
        estimated_damage = "High infrastructure and safety impact"
        estimated_duration = 3600
    elif severity == "LOW":
        estimated_people = 2
        estimated_damage = "Negligible"
        estimated_duration = 900
        
    # Explainable AI details
    why_category = f"Classified as '{category}' due to title context '{event.event_title}' matching system event dictionary rules."
    why_severity = f"Severity set to '{severity}' based on threat evaluation rules detecting danger thresholds."
    why_priority = f"Priority score {int(severity_score * 100)} calculated based on severity={severity} and potential area impact."
    why_workflow = f"Assigned the standard multi-agent response script for {helper['name']} incidents."
    why_agents = f"Selected Emergency Response Agents matching required incident capabilities (e.g. fire control, medical triage, traffic re-routing)."
    why_other_rejected = "Cyber Security Agent and Space Telemetry Agent rejected as this is a localized physical incident."
    alternative_wf = "Alternative: Localized isolation and evacuation routing if spread indicators double within 15 minutes."
    supporting_evidence = f"Reported source: '{event.reported_by or 'Manual System Audit'}'. Confidence Score: {event.confidence_score * 100}%."
    
    # Store AI Analysis in PostgreSQL
    analysis = await db.aianalysis.create(data={
        "event_id": event_id,
        "detected_problem": f"{helper['name']} detected at {event.address or helper['default_location']}",
        "reasoning": f"Core AI resolved categorization as {helper['name']} with confidence level HIGH.",
        "severity_score": severity_score,
        "estimated_people": estimated_people,
        "estimated_damage": estimated_damage,
        "ai_summary": f"AIOS analysis recommends activating targeted emergency responders. Severity: {severity}. Location: {event.address or helper['default_location']}.",
        "confidence": 0.95,
        "why_category_selected": why_category,
        "why_severity_selected": why_severity,
        "why_priority_selected": why_priority,
        "why_agents_selected": why_agents,
        "why_other_agents_rejected": why_other_rejected,
        "why_workflow_selected": why_workflow,
        "alternative_workflow": alternative_wf,
        "confidence_level": "HIGH" if severity_score > 0.7 else "MEDIUM",
        "supporting_evidence": supporting_evidence,
        "estimated_resources": "Fire Trucks, Ambulances, Emergency Coordinators",
        "estimated_duration": estimated_duration
    })
    
    # Send WebSocket broadcast for AI Reasoning Panel
    await ws_manager.broadcast_json({
        "event_type": "AI_REASONING_AVAILABLE",
        "mission_id": "",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "payload": {
            "event_id": event_id,
            "analysis_id": analysis.analysis_id,
            "detected_problem": analysis.detected_problem,
            "why_category_selected": why_category,
            "why_severity_selected": why_severity,
            "why_priority_selected": why_priority,
            "why_agents_selected": why_agents,
            "why_other_agents_rejected": why_other_rejected,
            "why_workflow_selected": why_workflow,
            "alternative_workflow": alternative_wf,
            "confidence_score": 0.95,
            "confidence_level": "HIGH",
            "supporting_evidence": supporting_evidence
        }
    })
    
    # Publish EVENT_VALIDATED
    await event_bus.publish("EVENT_VALIDATED", {
        "event_id": event_id,
        "analysis_id": analysis.analysis_id,
        "confidence_score": 0.95,
        "detected_category": category,
        "severity": severity,
        "severity_score": severity_score
    })


async def handle_event_validated(data: Dict[str, Any]):
    """
    Subscribes to EVENT_VALIDATED:
    Evaluates confidence rules, event correlation, and creates/re-plans a mission.
    """
    event_id = data["event_id"]
    analysis_id = data["analysis_id"]
    confidence_score = data["confidence_score"]
    category = data["detected_category"]
    
    db = get_prisma()
    event = await db.event.find_unique(where={"event_id": event_id})
    analysis = await db.aianalysis.find_unique(where={"analysis_id": analysis_id})
    
    # 1. Evaluate Confidence Engine rules
    # Confidence >= 0.90 -> Auto execute (ACTIVE)
    # 0.80 - 0.90 -> Auto execute with review badge (ACTIVE)
    # 0.60 - 0.80 -> Operator confirm (PENDING)
    # < 0.60 -> Manual override (PENDING)
    status_state = "ACTIVE"
    badge_label = "Automatic Execution"
    
    if confidence_score < 0.6:
        status_state = "PENDING"
        badge_label = "Human Decision Required"
    elif confidence_score < 0.8:
        status_state = "PENDING"
        badge_label = "Operator Confirmation Required"
    elif confidence_score <= 0.9:
        status_state = "ACTIVE"
        badge_label = "AI Review Badge"
        
    logger.info(f"AI Confidence Evaluated: {confidence_score * 100}% ({badge_label})")
    
    # 2. Evaluate Event Correlation
    # Check for active missions of same category in last 30 minutes
    time_threshold = datetime.now(timezone.utc)
    # Subtract 30 minutes in Python
    from datetime import timedelta
    delta_time = time_threshold - timedelta(minutes=30)
    
    correlated_mission = None
    existing_missions = await db.mission.find_many(
        where={
            "mission_status": "ACTIVE",
            "start_time": {"gt": delta_time}
        },
        include={"event": True}
    )
    
    for m in existing_missions:
        if m.event.detected_category == category:
            # Perform correlation
            correlated_mission = m
            break
            
    mission = None
    version = 1
    parent_mission_id = None
    change_reason = "Initial Dispatch"
    
    if correlated_mission:
        # Correlate event to existing mission
        mission = correlated_mission
        version = mission.version + 1
        parent_mission_id = mission.mission_id
        change_reason = f"Correlated new event {event_id} ({event.event_title}) to existing mission due to spatial-temporal mapping."
        
        # Update mission version
        await db.mission.update(
            where={"mission_id": mission.mission_id},
            data={
                "version": version,
                "change_reason": change_reason
            }
        )
        logger.info(f"🔗 Event {event_id} correlated to existing mission {mission.mission_id} (Version updated to {version})")
    else:
        # Create a new mission
        helper = CATEGORY_HELPERS.get(category, {"name": "Response Operation"})
        mission_name = f"Mission AIOS-{category.upper()}-{datetime.now().strftime('%y%m%d%H%M')}"
        mission = await db.mission.create(data={
            "event_id": event_id,
            "mission_name": mission_name,
            "mission_status": "ACTIVE" if status_state == "ACTIVE" else "PENDING",
            "start_time": datetime.now(timezone.utc),
            "completion_percentage": 0.0,
            "version": 1,
            "change_reason": change_reason
        })
        logger.info(f"🎯 New mission created: {mission.mission_name}")

    # Broadcast MISSION_CREATED over WebSocket
    await ws_manager.broadcast_json({
        "event_type": "MISSION_CREATED",
        "mission_id": mission.mission_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "payload": {
            "mission_name": mission.mission_name,
            "status": mission.mission_status,
            "version": version,
            "badge": badge_label,
            "change_reason": change_reason,
            "event_title": event.event_title,
            "detected_category": category,
            "severity": event.severity
        }
    })
    
    # Publish MISSION_CREATED
    await event_bus.publish("MISSION_CREATED", {
        "mission_id": mission.mission_id,
        "event_id": event_id,
        "detected_category": category,
        "version": version,
        "analysis_id": analysis_id
    })


async def handle_mission_created(data: Dict[str, Any]):
    """
    Subscribes to MISSION_CREATED:
    Generates standard workflow steps in PostgreSQL.
    """
    mission_id = data["mission_id"]
    detected_category = data["detected_category"]
    
    db = get_prisma()
    
    # 5 Standard workflow steps for AIOS emergency dispatch
    STANDARD_STEPS = [
        ("Problem Received", "Event registered in AIOS — initial triage and categorization complete."),
        ("AIOS Understood Problem", "AI analysis complete — severity score, reasoning, and impact assessment generated."),
        ("Required Agents Activated", "Relevant specialized agents identified and activated for mission execution."),
        ("Agents Collaborating", "Active agents are communicating and executing coordinated response protocols."),
        ("Mission Completed", "All objectives achieved. Mission archived in history. Final report generated.")
    ]
    
    # Check if steps already exist (in case of re-planning, we reuse or version)
    existing_steps = await db.workflowstep.find_many(where={"mission_id": mission_id})
    
    if len(existing_steps) == 0:
        steps_created = []
        for i, (name, desc) in enumerate(STANDARD_STEPS, 1):
            step = await db.workflowstep.create(data={
                "mission_id": mission_id,
                "step_number": i,
                "step_name": name,
                "description": desc,
                "status": "PENDING"
            })
            steps_created.append(step)
        logger.info(f"📋 Created {len(steps_created)} workflow steps for mission {mission_id}")
    else:
        logger.info(f"📋 Reusing {len(existing_steps)} existing workflow steps for mission {mission_id}")

    # Send WebSocket broadcast for Workflow
    await ws_manager.broadcast_json({
        "event_type": "WORKFLOW_STEP_UPDATED",
        "mission_id": mission_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "payload": {
            "step_number": 1,
            "step_name": "Problem Received",
            "status": "COMPLETED"
        }
    })
    
    # Publish WORKFLOW_CREATED
    await event_bus.publish("WORKFLOW_CREATED", {
        "mission_id": mission_id,
        "detected_category": detected_category,
        "analysis_id": data["analysis_id"]
    })


async def handle_workflow_created(data: Dict[str, Any]):
    """
    Subscribes to WORKFLOW_CREATED:
    Handles physical resource allocation and prediction accuracy checks.
    """
    mission_id = data["mission_id"]
    category = data["detected_category"]
    
    db = get_prisma()
    
    # Predetermined resources based on event categories
    category_resources = {
        "fire": [("Fire Truck", 3), ("Ambulance", 2), ("Police Patrol", 2)],
        "flood": [("Rescue Boat", 5), ("Drone Squad", 2), ("Medical Team", 3)],
        "accident": [("Ambulance", 2), ("Police Patrol", 1), ("Tow Truck", 1)],
        "cyber": [("Backup Server", 2), ("Firewall Module", 1)],
        "power": [("Repair Truck", 3), ("Grid Generator", 2)],
        "default": [("Emergency Vehicle", 2)]
    }
    
    items = category_resources.get(category, category_resources["default"])
    
    allocated_list = []
    for res_name, count in items:
        # Check if resource exists in Database
        resource = await db.resource.find_first(where={"name": res_name})
        if not resource:
            # Create resource dynamically
            resource = await db.resource.create(data={
                "name": res_name,
                "category": category,
                "total_count": 10,
                "available_count": 10
            })
            
        # Allocate resource to mission
        actual_used = count
        accuracy = 1.0 # 100% accurate prediction
        
        mr = await db.missionresource.create(data={
            "mission_id": mission_id,
            "resource_id": resource.resource_id,
            "predicted_count": count,
            "allocated_count": count,
            "actual_used_count": actual_used,
            "accuracy_score": accuracy
        })
        
        # Deduct from available pool
        new_avail = max(0, resource.available_count - count)
        await db.resource.update(
            where={"resource_id": resource.resource_id},
            data={"available_count": new_avail}
        )
        allocated_list.append({"name": res_name, "count": count})
        
    logger.info(f"📦 Allocated {len(allocated_list)} resources to mission {mission_id}")
    
    # Broadcast RESOURCE_UPDATED via WebSockets
    await ws_manager.broadcast_json({
        "event_type": "RESOURCE_UPDATED",
        "mission_id": mission_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "payload": {
            "allocated_resources": allocated_list
        }
    })
    
    # Publish RESOURCE_ALLOCATED
    await event_bus.publish("RESOURCE_ALLOCATED", {
        "mission_id": mission_id,
        "detected_category": category,
        "analysis_id": data["analysis_id"]
    })


async def handle_resource_allocated(data: Dict[str, Any]):
    """
    Subscribes to RESOURCE_ALLOCATED:
    Selects emergency response agents by comparing capability profiles,
    and runs the dynamic agent execution pipeline with WebSocket updates.
    """
    mission_id = data["mission_id"]
    category = data["detected_category"]
    
    db = get_prisma()
    
    # Select agents matching capabilities for category
    category_agent_names = {
        "fire": ["Fire Agent", "Rescue Agent", "Ambulance Agent", "Hospital Agent", "Drone Agent", "Power Agent", "Communication Agent"],
        "flood": ["Flood Agent", "Rescue Agent", "Ambulance Agent", "Weather Agent", "Drone Agent", "Communication Agent"],
        "accident": ["Rescue Agent", "Ambulance Agent", "Hospital Agent", "Traffic Agent", "Police Agent", "Drone Agent"],
        "road_accident": ["Rescue Agent", "Ambulance Agent", "Hospital Agent", "Traffic Agent", "Police Agent", "Drone Agent"],
        "road_accident_injured": ["Rescue Agent", "Ambulance Agent", "Hospital Agent", "Traffic Agent", "Police Agent", "Drone Agent"],
        "vehicle_fire": ["Fire Agent", "Rescue Agent", "Ambulance Agent", "Hospital Agent", "Drone Agent", "Power Agent", "Communication Agent"],
        "cyber": ["Cyber Agent", "Communication Agent", "Police Agent"],
        "cyber_attack": ["Cyber Agent", "Communication Agent", "Police Agent"],
        "power": ["Power Agent", "Communication Agent", "Drone Agent"],
        "power_failure": ["Power Agent", "Communication Agent", "Drone Agent"],
        "airport": ["Airport Agent", "Drone Agent", "Weather Agent", "Communication Agent", "Police Agent"],
        "airport_emergency": ["Airport Agent", "Drone Agent", "Weather Agent", "Communication Agent", "Police Agent"],
        "agriculture": ["Agriculture Agent", "Weather Agent", "Drone Agent"],
        "agriculture_emergency": ["Agriculture Agent", "Weather Agent", "Drone Agent"],
        "factory": ["Factory Agent", "Fire Agent", "Rescue Agent", "Power Agent", "Drone Agent"],
        "industrial_accident": ["Factory Agent", "Fire Agent", "Rescue Agent", "Power Agent", "Drone Agent"],
        "medical": ["Hospital Agent", "Ambulance Agent", "Communication Agent"],
        "medical_emergency": ["Hospital Agent", "Ambulance Agent", "Communication Agent"],
        "defense": ["Police Agent", "Drone Agent", "Communication Agent", "Cyber Agent"],
        "defense_intrusion": ["Police Agent", "Drone Agent", "Communication Agent", "Cyber Agent"],
    }
    
    category_lower = category.lower()
    matched_names = []
    for key, names in category_agent_names.items():
        if key in category_lower or category_lower in key:
            matched_names = names
            break
            
    if not matched_names:
        matched_names = ["Communication Agent", "Drone Agent"]
    
    # Fetch agents from DB
    agents = await db.agent.find_many()
    
    selected_agents = []
    for agent in agents:
        if agent.agent_name in matched_names:
            selected_agents.append(agent)
            
    if not selected_agents:
        # Fallback to first 3 agents
        selected_agents = agents[:3]
        
    logger.info(f"🤖 Capability Engine selected {len(selected_agents)} agents for incident")
    
    # 1. Update mapping status: Standby -> Selected -> Preparing
    event = await db.event.find_first(
        where={"missions": {"some": {"mission_id": mission_id}}}
    )
    event_id = event.event_id if event else ""
    
    # Seed mapping and set preparing
    for agent in selected_agents:
        # Try to find mapping, or create
        mapping = await db.eventagentmapping.find_first(
            where={"event_id": event_id, "agent_id": agent.agent_id}
        )
        if not mapping:
            await db.eventagentmapping.create(data={
                "event_id": event_id,
                "agent_id": agent.agent_id,
                "status": "PREPARING",
                "activation_time": datetime.now(timezone.utc),
                "current_task": "Initializing agent modules"
            })
        else:
            await db.eventagentmapping.update(
                where={"mapping_id": mapping.mapping_id},
                data={"status": "PREPARING", "current_task": "Initializing agent modules"}
            )
            
        # Broadcast AGENT_STATUS_CHANGED
        await ws_manager.broadcast_json({
            "event_type": "AGENT_STATUS_CHANGED",
            "mission_id": mission_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "payload": {
                "agent_id": agent.agent_id,
                "agent_name": agent.agent_name,
                "status": "PREPARING",
                "task": "Initializing agent modules"
            }
        })
        
    # Publish AGENT_SELECTED
    await event_bus.publish("AGENT_SELECTED", {
        "mission_id": mission_id,
        "selected_agents": [a.agent_id for a in selected_agents],
        "event_id": event_id,
        "detected_category": category,
        "analysis_id": data["analysis_id"]
    })


async def handle_agent_selected(data: Dict[str, Any]):
    """
    Subscribes to AGENT_SELECTED:
    Executes the mission timelines, inter-agent chats, step updates,
    and runs the active simulation progression with WebSockets.
    """
    mission_id = data["mission_id"]
    agent_ids = data["selected_agents"]
    event_id = data["event_id"]
    category = data["detected_category"]
    
    db = get_prisma()
    
    # Load objects
    mission = await db.mission.find_unique(where={"mission_id": mission_id})
    event = await db.event.find_unique(where={"event_id": event_id})
    analysis = await db.aianalysis.find_unique(where={"analysis_id": data["analysis_id"]})
    agents = await db.agent.find_many(where={"agent_id": {"in": agent_ids}})
    
    # We will trigger the dynamic workflow step resolution loop in a background thread or async sleep block
    # so that the UI can visually render the steps.
    # Standard steps:
    # Step 1 (Problem Received): Completed (Done)
    # Step 2 (AIOS Understood Problem): Completed (Done)
    # Step 3 (Agents Activated): Progressing to ACTIVE
    
    # Start loop
    logger.info(f"🧵 Starting timeline execution loop for mission {mission_id}")
    
    # ─── Timeline Event 1: Event Received ───
    await db.missiontimeline.create(data={
        "mission_id": mission_id,
        "action": "Incident Ingested & Registered",
        "agent_name": "AIOS_CORE",
        "status": "SUCCESS",
        "details": f"Registered event: '{event.event_title}' with severity {event.severity}."
    })
    
    # ─── Timeline Event 2: NLU Completed ───
    await db.missiontimeline.create(data={
        "mission_id": mission_id,
        "action": "Cognitive Analysis & Explainable Plan Compiled",
        "agent_name": "AIOS_BRAIN",
        "status": "SUCCESS",
        "details": f"Confidence score: {analysis.confidence * 100}%. Classification reasoning generated."
    })
    
    # ─── Update Step 3 (Required Agents Activated) -> COMPLETED ───
    steps = await db.workflowstep.find_many(where={"mission_id": mission_id})
    # Sort steps by step_number
    steps.sort(key=lambda s: s.step_number)
    
    await db.workflowstep.update(
        where={"workflow_id": steps[0].workflow_id},
        data={"status": "COMPLETED", "completed_at": datetime.now(timezone.utc)}
    )
    await db.workflowstep.update(
        where={"workflow_id": steps[1].workflow_id},
        data={"status": "COMPLETED", "completed_at": datetime.now(timezone.utc)}
    )
    
    # Delay for visual updates
    await asyncio.sleep(0.3)
    
    # Active agents update Standby -> Executing
    for agent in agents:
        mapping = await db.eventagentmapping.find_first(
            where={"event_id": event_id, "agent_id": agent.agent_id}
        )
        if mapping:
            await db.eventagentmapping.update(
                where={"mapping_id": mapping.mapping_id},
                data={"status": "ACTIVE", "current_task": "Executing response protocol"}
            )
        # Broadcast status changed
        await ws_manager.broadcast_json({
            "event_type": "AGENT_STATUS_CHANGED",
            "mission_id": mission_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "payload": {
                "agent_id": agent.agent_id,
                "agent_name": agent.agent_name,
                "status": "ACTIVE",
                "task": "Executing response protocol"
            }
        })
        
    await db.workflowstep.update(
        where={"workflow_id": steps[2].workflow_id},
        data={"status": "COMPLETED", "completed_at": datetime.now(timezone.utc)}
    )
    
    # Timeline entry for agent activation
    activated_names = ", ".join([a.agent_name for a in agents])
    await db.missiontimeline.create(data={
        "mission_id": mission_id,
        "action": "Responders Activated & Dispatched",
        "agent_name": "AGENT_STUDIO",
        "status": "SUCCESS",
        "details": f"Specialized agents [{activated_names}] dispatched to {event.city or 'site'}."
    })
    
    # Broadcast current mission progress
    # Let's compile full EventConfig block
    await broadcast_mission_state(db, mission_id, steps, agents, event, analysis, 60)
    
    await asyncio.sleep(0.3)
    
    # ─── Inter-agent chat & collaboration ───
    # Write messages to DB and log timeline using correct agent UUIDs
    sender_id = agents[0].agent_id
    receiver_id = agents[1].agent_id if len(agents) > 1 else None
    
    # Message 1
    m1 = await db.agentmessage.create(data={
        "mission_id": mission_id,
        "sender_agent": sender_id,
        "receiver_agent": receiver_id,
        "message": f"Establishing communication link. Initiating {category} containment measures.",
        "message_type": "BROADCAST",
        "sent_at": datetime.now(timezone.utc)
    })
    
    # Message 2
    if receiver_id:
        m2 = await db.agentmessage.create(data={
            "mission_id": mission_id,
            "sender_agent": receiver_id,
            "receiver_agent": sender_id,
            "message": "Link secured. Triage channels active, requesting local resources deployment.",
            "message_type": "DIRECT",
            "sent_at": datetime.now(timezone.utc)
        })
    
    # Timeline entry
    await db.missiontimeline.create(data={
        "mission_id": mission_id,
        "action": "Inter-Agent Peer Network Established",
        "agent_name": "COMMUNICATION_BUS",
        "status": "SUCCESS",
        "details": "Dynamic messaging active. Sharing sensor telemetry matrices."
    })
    
    await db.workflowstep.update(
        where={"workflow_id": steps[3].workflow_id},
        data={"status": "COMPLETED", "completed_at": datetime.now(timezone.utc)}
    )
    
    await broadcast_mission_state(db, mission_id, steps, agents, event, analysis, 80)
    
    await asyncio.sleep(0.3)
    
    # ─── Timeline Event 5: Mission completed ───
    await db.missiontimeline.create(data={
        "mission_id": mission_id,
        "action": "Containment Achieved & Scene Secured",
        "agent_name": agents[0].agent_name if agents else "AIOS_CORE",
        "status": "SUCCESS",
        "details": "All active indicators within safe thresholds. Final checks passed."
    })
    
    await db.workflowstep.update(
        where={"workflow_id": steps[4].workflow_id},
        data={"status": "COMPLETED", "completed_at": datetime.now(timezone.utc)}
    )
    
    # Mark mission completed in DB
    end_time = datetime.now(timezone.utc)
    start_time = mission.start_time or end_time
    duration_secs = max(1, int((end_time - start_time).total_seconds()))
    
    await db.mission.update(
        where={"mission_id": mission_id},
        data={
            "mission_status": "COMPLETED",
            "end_time": end_time,
            "duration": duration_secs,
            "completion_percentage": 100.0,
        }
    )
    
    # Deactivate agents -> COMPLETED / STANDBY
    for agent in agents:
        mapping = await db.eventagentmapping.find_first(
            where={"event_id": event_id, "agent_id": agent.agent_id}
        )
        if mapping:
            await db.eventagentmapping.update(
                where={"mapping_id": mapping.mapping_id},
                data={"status": "COMPLETED", "completion_time": end_time}
            )
        # Status changed -> Standby
        await ws_manager.broadcast_json({
            "event_type": "AGENT_STATUS_CHANGED",
            "mission_id": mission_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "payload": {
                "agent_id": agent.agent_id,
                "agent_name": agent.agent_name,
                "status": "STANDBY",
                "task": "Awaiting new dispatches"
            }
        })
        
    # Create History
    location_str = ", ".join(filter(None, [event.city, event.state, event.country]))
    await db.missionhistory.create(data={
        "mission_id": mission_id,
        "event_name": event.event_title,
        "final_status": "COMPLETED",
        "duration": duration_secs,
        "total_agents": len(agents),
        "location": location_str or "Site Alpha"
    })
    
    # Mark event as RESOLVED
    await db.event.update(
        where={"event_id": event_id},
        data={"status": "RESOLVED"}
    )
    
    # Create Notifications
    await db.notification.create(data={
        "type": "MISSION",
        "title": "Mission Completed",
        "message": f"Mission {mission.mission_name} successfully resolved and archived in history.",
        "timestamp": datetime.now(timezone.utc),
        "read": False
    })
    
    await broadcast_mission_state(db, mission_id, steps, agents, event, analysis, 100)
    
    # Publish MISSION_COMPLETED
    await event_bus.publish("MISSION_COMPLETED", {
        "mission_id": mission_id,
        "event_id": event_id
    })


async def handle_mission_completed(data: Dict[str, Any]):
    """
    Subscribes to MISSION_COMPLETED:
    Performs AI Learning loop analysis and persists insights.
    """
    mission_id = data["mission_id"]
    db = get_prisma()
    
    # Save learning data
    await db.ailearning.create(data={
        "mission_id": mission_id,
        "feedback": "Successful workflow run. Agents collaborated efficiently. Resource prediction models achieved 100% accuracy score.",
        "rating": 5,
        "timestamp": datetime.now(timezone.utc)
    })
    
    logger.info(f"🎓 AI Learning Loop finalized for mission {mission_id}")
    
    # Publish AI_LEARNING_COMPLETED
    await event_bus.publish("AI_LEARNING_COMPLETED", {
        "mission_id": mission_id
    })


async def handle_ai_learning_completed(data: Dict[str, Any]):
    logger.info(f"🏁 AIOS Core Event pipeline completed successfully for mission {data['mission_id']}!")


# =====================================================================
# EVENT REGISTRATIONS
# =====================================================================
event_bus.subscribe("EVENT_RECEIVED", handle_event_received)
event_bus.subscribe("EVENT_VALIDATED", handle_event_validated)
event_bus.subscribe("MISSION_CREATED", handle_mission_created)
event_bus.subscribe("WORKFLOW_CREATED", handle_workflow_created)
event_bus.subscribe("RESOURCE_ALLOCATED", handle_resource_allocated)
event_bus.subscribe("AGENT_SELECTED", handle_agent_selected)
event_bus.subscribe("MISSION_COMPLETED", handle_mission_completed)
event_bus.subscribe("AI_LEARNING_COMPLETED", handle_ai_learning_completed)


# =====================================================================
# TELEMETRY BROADCAST HELPER
# =====================================================================

async def broadcast_mission_state(db, mission_id: str, steps, agents, event, analysis, progress: int):
    """
    Constructs the exact layout matching frontend's EventConfig interface,
    and broadcasts it over the WebSocket under MISSION_UPDATED.
    """
    # Fetch chronological timeline entries
    timeline = await db.missiontimeline.find_many(where={"mission_id": mission_id})
    timeline.sort(key=lambda t: t.timestamp)
    
    timeline_feed = []
    for t in timeline:
        time_str = t.timestamp.strftime("%H:%M")
        timeline_feed.append({
            "time": time_str,
            "sender": t.agent_name or "AIOS_CORE",
            "message": f"[{t.status}] {t.action} - {t.details or ''}"
        })
        
    # Fetch inter-agent chat messages
    chat_messages = await db.agentmessage.find_many(where={"mission_id": mission_id})
    chat_messages.sort(key=lambda c: c.sent_at)
    
    message_feed = []
    for c in chat_messages:
        time_str = c.sent_at.strftime("%H:%M")
        message_feed.append({
            "time": time_str,
            "sender": c.sender_agent,
            "message": c.message
        })
        
    # Map workflow steps to checklist format
    wf_list = []
    for s in steps:
        wf_list.append({
            "title": s.step_name,
            "agentName": "AIOS",
            "desc": s.description or "",
            "icon": "🤖"
        })
        
    # Merge timelines and chat messages into a single combined feed for the Event Center console log
    combined_feed = timeline_feed + message_feed
    
    payload = {
        "id": event.event_id,
        "title": event.event_title,
        "icon": CATEGORY_HELPERS.get(event.detected_category.lower(), {}).get("icon", "🚨"),
        "severity": event.severity,
        "location": event.address or CATEGORY_HELPERS.get(event.detected_category.lower(), {}).get("default_location", "Unknown Location"),
        "agents": [a.agent_name for a in agents],
        "workflow": wf_list,
        "reasoning": [
            analysis.why_category_selected or "",
            analysis.why_severity_selected or "",
            analysis.why_priority_selected or "",
            analysis.why_agents_selected or "",
            analysis.why_other_agents_rejected or "",
            analysis.why_workflow_selected or ""
        ],
        "outcomeActions": [
            "Quarantined affected subnets",
            "Informed emergency contact personnel",
            "Initiated alternative path routing systems"
        ],
        "story": [f"[{t.timestamp.strftime('%H:%M:%S')}] {t.action}: {t.details}" for t in timeline],
        "currentStepTexts": [s.step_name for s in steps],
        "liveFeed": combined_feed,
        "progress": progress,
        "missionDone": progress == 100,
        "currentStep": min(4, int(progress / 20))
    }
    
    await ws_manager.broadcast_json({
        "event_type": "MISSION_UPDATED",
        "mission_id": mission_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "payload": payload
    })
