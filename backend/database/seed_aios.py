"""
AIOS Database Seed Script — PostgreSQL / Prisma
Seeds the Agents table with 18 specialized emergency response agents.
Also seeds default SystemSettings.
Run via: python -m backend.database.seed_aios
Or called automatically during FastAPI startup.
"""
import asyncio
import logging
from typing import List, Dict, Any
from prisma import Prisma
from backend.config import settings

logger = logging.getLogger("aios.seed")

# ============================================================
# 18 AIOS EMERGENCY RESPONSE AGENTS
# ============================================================

AIOS_AGENTS: List[Dict[str, Any]] = [
    {
        "agent_name": "Fire Agent",
        "agent_type": "EMERGENCY",
        "description": "Specialized in fire emergency response, building evacuation coordination, and fire brigade dispatch. Interfaces with IoT fire sensors and thermal imaging systems.",
        "organization": "AIOS Emergency Response",
        "icon": "🔥",
        "color": "#ef4444",
    },
    {
        "agent_name": "Flood Agent",
        "agent_type": "EMERGENCY",
        "description": "Manages flood emergency operations including water level monitoring, evacuation routing, rescue boat coordination, and emergency shelter allocation.",
        "organization": "AIOS Emergency Response",
        "icon": "🌊",
        "color": "#3b82f6",
    },
    {
        "agent_name": "Rescue Agent",
        "agent_type": "EMERGENCY",
        "description": "Coordinates ground rescue operations, search and rescue missions, survivor extraction, and inter-agency rescue team deployment.",
        "organization": "AIOS Emergency Response",
        "icon": "🚑",
        "color": "#f97316",
    },
    {
        "agent_name": "Ambulance Agent",
        "agent_type": "EMERGENCY",
        "description": "Manages ambulance fleet dispatch, optimal routing to incident sites, and patient transfer coordination between medical facilities.",
        "organization": "AIOS Medical Response",
        "icon": "🚐",
        "color": "#ec4899",
    },
    {
        "agent_name": "Hospital Agent",
        "agent_type": "LOGISTICS",
        "description": "Monitors hospital network capacity in real-time. Coordinates patient load balancing, bed availability, specialist scheduling, and medication inventory.",
        "organization": "AIOS Medical Response",
        "icon": "🏥",
        "color": "#10b981",
    },
    {
        "agent_name": "Police Agent",
        "agent_type": "EMERGENCY",
        "description": "Coordinates law enforcement response, crowd control, evidence collection, perimeter establishment, and inter-department command communication.",
        "organization": "AIOS Public Safety",
        "icon": "👮",
        "color": "#6366f1",
    },
    {
        "agent_name": "Traffic Agent",
        "agent_type": "INFRASTRUCTURE",
        "description": "Manages real-time traffic signal override, congestion rerouting, emergency vehicle corridor creation, and highway incident management.",
        "organization": "AIOS Infrastructure",
        "icon": "🚦",
        "color": "#eab308",
    },
    {
        "agent_name": "Cyber Agent",
        "agent_type": "INTELLIGENCE",
        "description": "Detects and responds to cyber threats including ransomware, DDoS attacks, network breaches, and critical infrastructure cyber incidents.",
        "organization": "AIOS Cyber Security",
        "icon": "💻",
        "color": "#a855f7",
    },
    {
        "agent_name": "Weather Agent",
        "agent_type": "INTELLIGENCE",
        "description": "Provides real-time weather intelligence, storm prediction, wind analysis for firefighting and aviation, and climate impact assessment for ongoing emergencies.",
        "organization": "AIOS Intelligence",
        "icon": "🌤️",
        "color": "#06b6d4",
    },
    {
        "agent_name": "Power Agent",
        "agent_type": "INFRASTRUCTURE",
        "description": "Manages electrical grid emergency response, power isolation protocols for fire/flood scenarios, backup power routing, and restoration prioritization.",
        "organization": "AIOS Infrastructure",
        "icon": "⚡",
        "color": "#f59e0b",
    },
    {
        "agent_name": "Communication Agent",
        "agent_type": "COMMUNICATION",
        "description": "Maintains encrypted inter-agency communication channels, public alert system management, satellite communication fallback, and media briefing coordination.",
        "organization": "AIOS Communications",
        "icon": "📡",
        "color": "#8b5cf6",
    },
    {
        "agent_name": "Agriculture Agent",
        "agent_type": "LOGISTICS",
        "description": "Responds to agricultural emergencies including crop disease outbreaks, irrigation failures, pest invasions, and food supply chain disruptions.",
        "organization": "AIOS Agriculture",
        "icon": "🌾",
        "color": "#84cc16",
    },
    {
        "agent_name": "Factory Agent",
        "agent_type": "INFRASTRUCTURE",
        "description": "Handles industrial accidents, manufacturing facility emergencies, HAZMAT incidents, machinery failure response, and worker evacuation coordination.",
        "organization": "AIOS Industrial Safety",
        "icon": "🏭",
        "color": "#78716c",
    },
    {
        "agent_name": "Drone Agent",
        "agent_type": "SURVEILLANCE",
        "description": "Manages autonomous drone fleet deployment for aerial surveillance, damage assessment, search and rescue support, and real-time situation awareness.",
        "organization": "AIOS Surveillance",
        "icon": "🚁",
        "color": "#14b8a6",
    },
    {
        "agent_name": "Airport Agent",
        "agent_type": "LOGISTICS",
        "description": "Coordinates airport emergency operations including emergency landings, aircraft evacuation, runway incidents, and air traffic management during crises.",
        "organization": "AIOS Aviation",
        "icon": "✈️",
        "color": "#0ea5e9",
    },
    {
        "agent_name": "Railway Agent",
        "agent_type": "LOGISTICS",
        "description": "Manages railway emergency response including derailment incidents, track failure, passenger evacuation, and inter-station coordination protocols.",
        "organization": "AIOS Transportation",
        "icon": "🚂",
        "color": "#64748b",
    },
    {
        "agent_name": "Marine Agent",
        "agent_type": "EMERGENCY",
        "description": "Coordinates maritime emergency response including ship distress, port incidents, coastal flood management, and sea rescue operations.",
        "organization": "AIOS Maritime",
        "icon": "⚓",
        "color": "#1d4ed8",
    },
    {
        "agent_name": "Space Agent",
        "agent_type": "INTELLIGENCE",
        "description": "Manages space mission anomalies, satellite communication failures, debris tracking, and provides orbital intelligence for ground emergency operations.",
        "organization": "AIOS Space Operations",
        "icon": "🚀",
        "color": "#7c3aed",
    },
]

# ============================================================
# DEFAULT SYSTEM SETTINGS
# ============================================================

DEFAULT_SYSTEM_SETTINGS: List[Dict[str, str]] = [
    {
        "setting_name": "AIOS_VERSION",
        "setting_value": "1.0.0",
        "description": "Current AIOS platform version",
    },
    {
        "setting_name": "MISSION_AUTO_COMPLETE",
        "setting_value": "true",
        "description": "Automatically complete missions after all workflow steps finish",
    },
    {
        "setting_name": "AGENT_ACTIVATION_MODE",
        "setting_value": "AUTO",
        "description": "Agent activation mode: AUTO (rule-based) or MANUAL",
    },
    {
        "setting_name": "MAX_ACTIVE_MISSIONS",
        "setting_value": "50",
        "description": "Maximum number of concurrent active missions",
    },
    {
        "setting_name": "NOTIFICATION_RETENTION_DAYS",
        "setting_value": "30",
        "description": "Number of days to retain notifications before cleanup",
    },
    {
        "setting_name": "AI_CONFIDENCE_THRESHOLD",
        "setting_value": "0.85",
        "description": "Minimum confidence score for AI analysis to trigger agent activation",
    },
    {
        "setting_name": "DEFAULT_COUNTRY",
        "setting_value": "India",
        "description": "Default country for event geolocation",
    },
    {
        "setting_name": "WEBSOCKET_HEARTBEAT_INTERVAL",
        "setting_value": "30",
        "description": "WebSocket heartbeat interval in seconds",
    },
    {
        "setting_name": "MISSION_HISTORY_RETENTION_DAYS",
        "setting_value": "365",
        "description": "Number of days to retain mission history records",
    },
    {
        "setting_name": "REDIS_CACHE_TTL",
        "setting_value": "300",
        "description": "Default Redis cache TTL in seconds",
    },
]


async def seed_aios_agents(prisma: Prisma) -> int:
    """
    Seeds the AIOS agents table with 18 specialized agents.
    Skips existing agents to support idempotent re-seeding.
    Returns the count of agents seeded.
    """
    seeded = 0
    for agent_data in AIOS_AGENTS:
        existing = await prisma.agent.find_unique(
            where={"agent_name": agent_data["agent_name"]}
        )
        if not existing:
            await prisma.agent.create(data=agent_data)
            seeded += 1
            logger.info(f"  ✓ Seeded agent: {agent_data['agent_name']}")
        else:
            logger.debug(f"  → Agent already exists: {agent_data['agent_name']}")

    return seeded


async def seed_system_settings(prisma: Prisma) -> int:
    """Seeds default system settings. Skips existing entries."""
    seeded = 0
    for setting in DEFAULT_SYSTEM_SETTINGS:
        existing = await prisma.systemsetting.find_unique(
            where={"setting_name": setting["setting_name"]}
        )
        if not existing:
            await prisma.systemsetting.create(data=setting)
            seeded += 1
            logger.info(f"  ✓ Seeded setting: {setting['setting_name']}")

    return seeded


async def run_seed(prisma: Prisma) -> Dict[str, int]:
    """
    Master seed function. Runs all seed operations.
    Returns a summary of what was seeded.
    """
    logger.info("🌱 Starting AIOS database seed...")

    agents_seeded = await seed_aios_agents(prisma)
    settings_seeded = await seed_system_settings(prisma)

    summary = {
        "agents_seeded": agents_seeded,
        "settings_seeded": settings_seeded,
    }

    logger.info(
        f"✅ Seed complete — "
        f"{agents_seeded} agents, "
        f"{settings_seeded} settings seeded."
    )

    return summary


# ============================================================
# Standalone execution
# ============================================================

async def main():
    """Run seed as standalone script."""
    logging.basicConfig(level=logging.INFO)
    prisma = Prisma(datasource={"url": settings.PRISMA_DATABASE_URL})
    await prisma.connect()
    try:
        result = await run_seed(prisma)
        print(f"\n✅ Seeding complete: {result}")
    finally:
        await prisma.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
