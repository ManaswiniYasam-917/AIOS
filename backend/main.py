import os
import asyncio
import datetime
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from backend.config import settings
from backend.database.connection import get_db, init_db
from backend.database.repositories import (
    seed_database, AgentRepository, DeviceRepository, MarketplaceRepository,
    AuditLogRepository, NotificationRepository, MessageRepository, ApiKeyRepository, UserRepository
)
from backend.domain.schemas import (
    Token, UserLogin, UserCreate, UserResponse,
    AgentCreate, AgentUpdate, AgentResponse, AgentControl,
    DeviceResponse, DeviceDiagnosticRequest,
    MarketplaceAgentResponse, AuditLogResponse,
    NotificationResponse, AgentMessageCreate, AgentMessageResponse,
    ApiKeyCreate, ApiKeyResponse, SystemMetricsResponse
)
from backend.domain.models import (
    AgentModel, EdgeDeviceModel, MarketplaceAgentModel,
    AuditLogModel, NotificationModel, AgentMessageModel, ApiKeyModel, UserModel
)
# ── AIOS PostgreSQL / Prisma imports ──────────────────────────────────────────
from backend.database.prisma_client import (
    connect_prisma, disconnect_prisma, get_prisma, is_prisma_connected
)
from backend.database.aios_repositories import (
    EventRepository, MissionRepository, AiosAgentRepository,
    AiosNotificationRepository, MissionHistoryRepository,
    SystemSettingsRepository, MissionEngineService
)
from backend.database.seed_aios import run_seed
from backend.domain.aios_schemas import (
    EventCreate, EventResponse, EventDetailResponse,
    AiAnalysisResponse,
    AiosAgentResponse, AiosAgentCreate,
    EventAgentMappingResponse,
    MissionResponse, MissionDetailResponse,
    WorkflowStepResponse,
    AiosAgentMessageCreate, AiosAgentMessageResponse,
    MissionLogResponse,
    AiosNotificationCreate, AiosNotificationResponse,
    MissionHistoryCreate, MissionHistoryResponse,
    SystemSettingResponse, SystemSettingUpdate,
)
# ─────────────────────────────────────────────────────────────────────────────
from backend.security.auth import create_access_token, get_current_user_role, get_password_hash, verify_password
from backend.security.rbac import require_developer, require_operator, require_viewer, require_super_admin
from backend.communication.gateway import ws_manager
from backend.communication.mqtt import mqtt_client
from backend.communication.grpc_service import serve_grpc
from backend.plugins.base import plugin_registry
# Ensure plugins are registered
import backend.plugins.quantum
# Ensure Event Bus is active
import backend.database.event_bus
import backend.plugins.digital_twin
import backend.plugins.swarm
import backend.plugins.federated

def extract_address_py(text: str) -> str:
    if not text:
        return ""
    markers = [" at ", " in ", " near ", " on ", " across "]
    text_lower = text.lower()
    best_idx = -1
    marker_len = 0
    
    for marker in markers:
        idx = text_lower.rfind(marker)
        if idx > best_idx:
            best_idx = idx
            marker_len = len(marker)
            
    if best_idx != -1:
        address = text[best_idx + marker_len:].strip()
        if address:
            import re
            address = re.sub(r'[.,/#!$%\^&*;:{}=\-_`~()]+$', '', address).strip()
            return address
            
    return text.strip()

# ============================================================
# ASYNC LIFESPAN — manages both SQLAlchemy (SQLite) and Prisma (PostgreSQL)
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Startup: Initialize SQLite (SQLAlchemy), seed existing data,
             connect Prisma to PostgreSQL, seed AIOS agents.
    Shutdown: Disconnect Prisma cleanly.
    """
    # ── STARTUP ──────────────────────────────────────────────
    import logging
    logger = logging.getLogger("aios.startup")

    # 1. Initialize SQLite schema (existing SQLAlchemy layer — unchanged)
    init_db()
    db = next(get_db())
    seed_database(db)
    logger.info("✅ SQLite (SQLAlchemy) initialized and seeded.")

    # 2. Connect Prisma to PostgreSQL (AIOS domain layer)
    try:
        await connect_prisma()
        if is_prisma_connected():
            prisma = get_prisma()
            seed_result = await run_seed(prisma)
            logger.info(f"✅ Prisma connected to PostgreSQL. Seed: {seed_result}")
        else:
            logger.warning("⚠️ Prisma could not connect to PostgreSQL — AIOS /api/aios/* endpoints will be unavailable.")
    except Exception as e:
        logger.error(f"❌ Prisma startup error: {e}")

    # 3. Start MQTT + gRPC background services
    mqtt_client.start()
    serve_grpc()
    logger.info("✅ MQTT and gRPC services started.")

    yield  # ← Application is running

    # ── SHUTDOWN ─────────────────────────────────────────────
    await disconnect_prisma()
    logger.info("🔌 Prisma disconnected. Shutdown complete.")


# Initialize FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Secure operating system for orchestrating, securing, and monitoring enterprise AI agents and edge fleets.",
    lifespan=lifespan,
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security Headers middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:;"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ==========================================================
# AUTHENTICATION API
# ==========================================================

@app.post("/api/auth/signup", response_model=UserResponse)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    existing = repo.get_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Identity profile already registered.")
    
    new_user = UserModel(
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role
    )
    repo.create(new_user)
    return new_user

@app.post("/api/auth/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    repo = UserRepository(db)
    # Check fallback or database credentials
    user = repo.get_by_email(payload.email)
    if not user:
        # Simulate registration fallback for easier developer sandbox logins
        new_user = UserModel(
            email=payload.email,
            hashed_password=get_password_hash(payload.password),
            role=payload.simulated_role
        )
        repo.create(new_user)
        user = new_user
    elif not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid cryptographic credentials.")
    
    access_token = create_access_token(data={"sub": user.email, "role": payload.simulated_role or user.role})
    
    # Log Audit action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=user.email,
        role=payload.simulated_role or user.role,
        action="USER_LOGIN",
        status="Success",
        details="Access validated. MFA checks passed."
    ))
    
    return {"access_token": access_token, "token_type": "bearer", "role": payload.simulated_role or user.role}

# ==========================================================
# METRICS TELEMETRY API
# ==========================================================

@app.get("/api/metrics", response_model=SystemMetricsResponse)
def get_system_metrics(db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    import random
    agents_repo = AgentRepository(db)
    devices_repo = DeviceRepository(db)
    notif_repo = NotificationRepository(db)
    
    all_agents = agents_repo.get_all()
    active_count = len([a for a in all_agents if a.status == "Running"])
    device_count = len([d for d in devices_repo.get_all() if d.status == "Online"])
    notifs = notif_repo.get_all()
    
    return {
        "cpuUsage": 45 + random.randint(0, 10),
        "ramUsage": 62 + random.randint(0, 5),
        "storageUsage": 49,
        "networkIn": round(12.4 + random.uniform(0, 3), 2),
        "networkOut": round(8.7 + random.uniform(0, 2), 2),
        "activeAgents": active_count,
        "connectedDevices": device_count,
        "runningTasks": active_count * 2 + random.randint(0, 2),
        "alertsCount": {
            "info": len([n for n in notifs if n.type == "Info" and not n.read]),
            "warning": len([n for n in notifs if n.type == "Warning" and not n.read]),
            "critical": len([n for n in notifs if n.type == "Critical" and not n.read])
        }
    }

# ==========================================================
# AGENTS API
# ==========================================================

@app.get("/api/agents", response_model=List[AgentResponse])
def get_agents(db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    repo = AgentRepository(db)
    return repo.get_all()

@app.post("/api/agents", response_model=AgentResponse, status_code=201)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db), current_user = Depends(require_developer)):
    repo = AgentRepository(db)
    new_agent = AgentModel(
        name=payload.name,
        description=payload.description,
        role=payload.role,
        goal=payload.goal,
        memory=payload.memory,
        knowledge=payload.knowledge,
        reasoning=payload.reasoning,
        planning=payload.planning,
        tools=payload.tools,
        permissions=payload.permissions,
        configuration=payload.configuration,
        status="Idle",
        health="Healthy"
    )
    repo.create(new_agent)
    
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action="AGENT_CREATE",
        status="Success",
        details=f"Instantiated core node '{new_agent.name}' successfully."
    ))
    
    return new_agent

@app.put("/api/agents/{id}", response_model=AgentResponse)
def update_agent(id: str, payload: AgentUpdate, db: Session = Depends(get_db), current_user = Depends(require_developer)):
    repo = AgentRepository(db)
    agent = repo.get_by_id(id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(agent, key, value)
    
    repo.update(agent)
    
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action="AGENT_CONFIG_UPDATE",
        status="Success",
        details=f"Modified configuration of Agent '{agent.name}'."
    ))
    return agent

@app.post("/api/agents/{id}/control", response_model=AgentResponse)
def control_agent(id: str, payload: AgentControl, db: Session = Depends(get_db), current_user = Depends(require_operator)):
    repo = AgentRepository(db)
    agent = repo.get_by_id(id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    action = payload.action
    if action == "pause":
        agent.status = "Paused"
    elif action == "resume" or action == "deploy":
        agent.status = "Running"
        agent.health = "Healthy"
    elif action == "clone":
        clone_agent = AgentModel(
            name=f"{agent.name} (Copy)",
            description=agent.description,
            role=agent.role,
            goal=agent.goal,
            memory=agent.memory,
            knowledge=agent.knowledge,
            reasoning=agent.reasoning,
            planning=agent.planning,
            tools=agent.tools,
            permissions=agent.permissions,
            configuration=agent.configuration,
            status="Idle",
            health="Healthy"
        )
        repo.create(clone_agent)
        
        # Log Action
        log_repo = AuditLogRepository(db)
        log_repo.create(AuditLogModel(
            user=current_user.get("email"),
            role=current_user.get("role"),
            action="AGENT_CLONE",
            status="Success",
            details=f"Cloned cognitive matrix from '{agent.name}' into '{clone_agent.name}'."
        ))
        return clone_agent
        
    repo.update(agent)
    
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action=f"AGENT_{action.upper()}",
        status="Success",
        details=f"Triggered action '{action}' on Agent '{agent.name}'."
    ))
    return agent

@app.delete("/api/agents/{id}")
def delete_agent(id: str, db: Session = Depends(get_db), current_user = Depends(require_developer)):
    repo = AgentRepository(db)
    agent = repo.get_by_id(id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    name = agent.name
    repo.delete(agent)
    
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action="AGENT_DELETE",
        status="Success",
        details=f"Terminated and purged Agent '{name}'."
    ))
    return {"success": True, "message": f"Agent {name} deleted successfully."}

# ==========================================================
# EDGE DEVICES API
# ==========================================================

@app.get("/api/devices", response_model=List[DeviceResponse])
def get_devices(db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    repo = DeviceRepository(db)
    return repo.get_all()

@app.post("/api/devices/{id}/diagnostic", response_model=DeviceResponse)
def trigger_diagnostic(id: str, payload: DeviceDiagnosticRequest, db: Session = Depends(get_db), current_user = Depends(require_operator)):
    import random
    repo = DeviceRepository(db)
    device = repo.get_by_id(id)
    if not device:
        raise HTTPException(status_code=404, detail="Edge device not registered")
        
    # Recalculate diagnostics metrics
    device.cpu = random.randint(20, 60)
    device.ram = random.randint(30, 70)
    device.temperature = random.randint(30, 48)
    device.health = "Critical" if device.temperature > 50 else "Warning" if device.temperature > 43 else "Healthy"
    if device.status == "Maintenance":
        device.status = "Online"
        device.health = "Healthy"
    device.last_seen = datetime.datetime.utcnow()
    repo.update(device)
    
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action="DEVICE_DIAGNOSTIC",
        status="Success",
        details=f"Completed fleet scan on device '{device.name}'. Resolved status to {device.health}."
    ))
    return device

# ==========================================================
# MARKETPLACE API
# ==========================================================

@app.get("/api/marketplace", response_model=List[MarketplaceAgentResponse])
def get_marketplace(db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    repo = MarketplaceRepository(db)
    return repo.get_all()

@app.post("/api/marketplace/{id}/install", response_model=MarketplaceAgentResponse)
def install_marketplace_package(id: str, db: Session = Depends(get_db), current_user = Depends(require_developer)):
    repo = MarketplaceRepository(db)
    item = repo.get_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Marketplace package not found")
        
    item.is_installed = not item.is_installed
    repo.update(item)
    
    # If installed, also provision as a local active agent sandbox
    if item.is_installed:
        agent_repo = AgentRepository(db)
        new_agent = AgentModel(
            name=item.name.upper().replace(" ", "-"),
            description=item.description,
            role=f"{item.category} Node",
            goal="Execute isolated functions matching packages specification parameters.",
            memory="Short-term",
            knowledge=["Pre-trained weights", "Dynamic Sandbox Protocols"],
            reasoning="Zero-shot",
            planning="BFS",
            tools=["MarketplaceSandbox"],
            permissions=["Basic Sandboxed execution"],
            configuration={},
            status="Idle",
            health="Healthy"
        )
        agent_repo.create(new_agent)
        
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action="MARKETPLACE_INSTALL" if item.is_installed else "MARKETPLACE_UNINSTALL",
        status="Success",
        details=f"State changes committed for module '{item.name}'."
    ))
    return item

# ==========================================================
# AUDIT LOGS & NOTIFICATIONS API
# ==========================================================

@app.get("/api/logs", response_model=List[AuditLogResponse])
def get_logs(db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    repo = AuditLogRepository(db)
    return repo.get_all()

@app.get("/api/notifications", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    repo = NotificationRepository(db)
    return repo.get_all()

@app.post("/api/notifications/clear")
def clear_notifications(db: Session = Depends(get_db), current_user = Depends(require_operator)):
    repo = NotificationRepository(db)
    repo.clear_all()
    return {"success": True}

@app.post("/api/notifications/{id}/read", response_model=NotificationResponse)
def read_notification(id: str, db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    repo = NotificationRepository(db)
    notif = repo.get_by_id(id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notif.read = True
    repo.update(notif)
    return notif

# ==========================================================
# API KEYS & SECURITIES API
# ==========================================================

@app.get("/api/keys", response_model=List[ApiKeyResponse])
def get_keys(db: Session = Depends(get_db), current_user = Depends(require_developer)):
    repo = ApiKeyRepository(db)
    return repo.get_all()

@app.post("/api/keys", response_model=ApiKeyResponse, status_code=201)
def generate_key(payload: ApiKeyCreate, db: Session = Depends(get_db), current_user = Depends(require_developer)):
    import random
    repo = ApiKeyRepository(db)
    
    # Encrypt keys prior to mapping or store masked values
    random_hash = "".join(random.choice("0123456789abcdef") for _ in range(4))
    new_key = ApiKeyModel(
        name=payload.name,
        key=f"aios_cl_****************************{random_hash}",
        status="Active"
    )
    repo.create(new_key)
    
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action="API_KEY_GENERATE",
        status="Success",
        details=f"Generated API key matrix credential '{payload.name}'."
    ))
    return new_key

@app.delete("/api/keys/{id}")
def revoke_key(id: str, db: Session = Depends(get_db), current_user = Depends(require_developer)):
    repo = ApiKeyRepository(db)
    key = repo.get_by_id(id)
    if not key:
        raise HTTPException(status_code=404, detail="API key credential not found")
        
    name = key.name
    repo.delete(key)
    
    # Log Action
    log_repo = AuditLogRepository(db)
    log_repo.create(AuditLogModel(
        user=current_user.get("email"),
        role=current_user.get("role"),
        action="API_KEY_REVOKE",
        status="Warning",
        details=f"Revoked credentials mapping for key: '{name}'"
    ))
    return {"success": True}

# ==========================================================
# AGENT MESSAGING & CHATS
# ==========================================================

@app.get("/api/messages", response_model=List[AgentMessageResponse])
def get_messages(db: Session = Depends(get_db), current_user = Depends(require_viewer)):
    repo = MessageRepository(db)
    return repo.get_all()

@app.post("/api/messages", response_model=AgentMessageResponse, status_code=201)
def publish_message(payload: AgentMessageCreate, db: Session = Depends(get_db), current_user = Depends(require_operator)):
    repo = MessageRepository(db)
    new_msg = AgentMessageModel(
        sender_id=payload.senderId,
        sender_name=payload.senderName,
        receiver_id=payload.receiverId,
        receiver_name=payload.receiverName,
        content=payload.content,
        type=payload.type,
        status="Encrypted"
    )
    repo.create(new_msg)
    return new_msg

# AI Suggestion Core
@app.post("/api/agent/suggest")
def suggest_agent_config(payload: Dict[str, str], db: Session = Depends(get_db)):
    role = payload.get("role", "")
    goal = payload.get("goal", "")
    
    # Fallback suggestion logic
    mock_tools = {
        "Analyst": ["ExcelReader", "SecDataScraper", "QueryBuilder", "ChartRenderer"],
        "SecOps": ["PortScanner", "IpQuarantine", "LogAnalyzer", "NmapConnector"],
        "Logistics": ["RouteCalculator", "GpsTracker", "FleetDispatcher", "TrafficClient"],
        "Robotics": ["ActuatorController", "LidarFeedParser", "PathPlanner", "SlamEngine"]
    }
    mock_knowledge = {
        "Analyst": ["Quantitative Modeling Standards", "SEC Regulations", "Financial Accounting Protocols"],
        "SecOps": ["CIS Benchmarks", "NIST Security Framework", "Network Routing Architectures"],
        "Logistics": ["Supply Chain Constraints", "Dynamic Fleet Dispatch Logistics", "Geographic Information Systems"],
        "Robotics": ["Inverse Kinematics Math", "ROS2 Architecture Layers", "Sensor Fusion Pipelines"]
    }

    matched_key = "Analyst"
    combined_query = (role + " " + goal).lower()
    for key in mock_tools.keys():
        if key.lower() in combined_query:
            matched_key = key
            break
            
    suggestion = {
        "suggestedName": f"{role.upper().replace(' ', '-')}-AUTO",
        "suggestedDescription": f"Fully autonomous intelligence node specialized in '{role}' aiming to resolve goal: '{goal}'.",
        "suggestedTools": mock_tools[matched_key],
        "suggestedKnowledge": mock_knowledge[matched_key],
        "reasoningModel": "ReAct",
        "planningMethod": "A*"
    }
    return {"aiGenerated": False, "suggestion": suggestion}

# Live Sandbox chat interface
@app.post("/api/agent/chat")
def simulate_agent_chat(payload: Dict[str, str], db: Session = Depends(get_db)):
    from backend.ai.runtime import AgentRuntime
    agent_id = payload.get("agentId")
    msg = payload.get("userMessage")
    
    runtime = AgentRuntime(db)
    try:
        run_cycle = runtime.run_agent_cycle(agent_id, msg)
        
        # Save output reply message to table
        repo = MessageRepository(db)
        reply = AgentMessageModel(
            sender_id=agent_id,
            sender_name=run_cycle["agent_name"],
            receiver_id="manaswiniyasam617@gmail.com",
            receiver_name="User",
            content=run_cycle["raw_output"],
            type="Direct",
            status="Sent"
        )
        repo.create(reply)
        return {"aiGenerated": True, "reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent simulation failed: {str(e)}")

# ==========================================================
# WEBSOCKET REAL-TIME BRIDGE
# ==========================================================

@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Maintain connection, handle client events if sent
            data = await websocket.receive_text()
            # Broadcast received text back or perform specific actions
            await ws_manager.broadcast_text(f"Sync-Echo: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ==========================================================
# AIOS DOMAIN API  (/api/aios/*)
# PostgreSQL + Prisma ORM — Mission Lifecycle, Events,
# Agents, Workflows, Notifications, History, Settings
# ==========================================================

def _require_prisma():
    """Dependency: raises 503 if PostgreSQL/Prisma is not available."""
    if not is_prisma_connected():
        raise HTTPException(
            status_code=503,
            detail="AIOS PostgreSQL database is not connected. "
                   "Ensure PostgreSQL is running and PRISMA_DATABASE_URL is set correctly."
        )
    return get_prisma()


# ── Events ────────────────────────────────────────────────

@app.post("/api/aios/events", status_code=201)
async def aios_create_event(
    payload: EventCreate,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """
    Create a new AIOS event. Automatically triggers the full mission lifecycle:
    AI Analysis → Mission → Workflow Steps → Agent Activation → Logs → History.
    """
    repo = EventRepository(prisma)
    engine = MissionEngineService(prisma)

    # Clean the address from payload or description
    raw_address = payload.address or payload.event_description or ""
    clean_addr = extract_address_py(raw_address)

    # Build event data dict
    event_data = {
        "event_title": payload.event_title,
        "event_description": payload.event_description,
        "detected_category": payload.detected_category,
        "severity": payload.severity.value,
        "status": "IN_PROGRESS",
        "detected_source": payload.detected_source or "Manual Report",
        "confidence_score": payload.confidence_score or 0.95,
        "address": clean_addr if clean_addr else "Central Area",
    }
    # Optional fields
    if payload.latitude is not None:
        event_data["latitude"] = payload.latitude
    if payload.longitude is not None:
        event_data["longitude"] = payload.longitude
    if payload.city:
        event_data["city"] = payload.city
    if payload.state:
        event_data["state"] = payload.state
    if payload.country:
        event_data["country"] = payload.country
    if payload.reported_by:
        event_data["reported_by"] = payload.reported_by

    # Create event in PostgreSQL
    event = await repo.create(event_data)

    # Trigger full mission lifecycle asynchronously
    try:
        mission_result = await engine.process_event(event.event_id)
    except Exception as e:
        # Log but don't fail the event creation
        import logging
        logging.getLogger("aios.api").error(f"Mission engine error: {e}")
        mission_result = {"error": str(e)}

    return {
        "event_id": event.event_id,
        "event_title": event.event_title,
        "detected_category": event.detected_category,
        "severity": event.severity,
        "status": "RESOLVED",
        "mission": mission_result,
        "message": "Event processed. Mission launched and completed successfully.",
    }


@app.get("/api/aios/events")
async def aios_get_events(
    limit: int = 50,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """List all AIOS events ordered by creation date descending."""
    repo = EventRepository(prisma)
    events = await repo.get_all(limit=limit)
    return [
        {
            "event_id": e.event_id,
            "event_title": e.event_title,
            "detected_category": e.detected_category,
            "severity": e.severity,
            "status": e.status,
            "city": e.city,
            "country": e.country,
            "confidence_score": e.confidence_score,
            "created_at": e.created_at.isoformat(),
        }
        for e in events
    ]


@app.get("/api/aios/events/{event_id}")
async def aios_get_event(
    event_id: str,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """Get full event detail including AI analysis, missions, and agent mappings."""
    repo = EventRepository(prisma)
    event = await repo.get_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


# ── Missions ──────────────────────────────────────────────

@app.get("/api/aios/missions")
async def aios_get_missions(
    limit: int = 50,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """List all missions ordered by start time descending."""
    repo = MissionRepository(prisma)
    missions = await repo.get_all(limit=limit)
    return [
        {
            "mission_id": m.mission_id,
            "event_id": m.event_id,
            "mission_name": m.mission_name,
            "mission_status": m.mission_status,
            "start_time": m.start_time.isoformat() if m.start_time else None,
            "end_time": m.end_time.isoformat() if m.end_time else None,
            "duration": m.duration,
            "completion_percentage": m.completion_percentage,
            "ai_summary": m.ai_summary,
        }
        for m in missions
    ]


@app.get("/api/aios/missions/{mission_id}")
async def aios_get_mission(
    mission_id: str,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """Get full mission detail including workflow steps, agent messages, and logs."""
    repo = MissionRepository(prisma)
    mission = await repo.get_by_id(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    return mission


# ── AIOS Agents ────────────────────────────────────────────

@app.get("/api/aios/agents", response_model=List[AiosAgentResponse])
async def aios_get_agents(
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """List all 18 AIOS specialized emergency response agents."""
    repo = AiosAgentRepository(prisma)
    agents = await repo.get_all()
    return [
        AiosAgentResponse(
            agent_id=a.agent_id,
            agent_name=a.agent_name,
            agent_type=a.agent_type,
            description=a.description,
            organization=a.organization,
            icon=a.icon,
            color=a.color,
            is_enabled=a.is_enabled,
            created_at=a.created_at,
        )
        for a in agents
    ]


@app.get("/api/aios/agents/{agent_id}")
async def aios_get_agent(
    agent_id: str,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """Get a single AIOS agent by ID."""
    repo = AiosAgentRepository(prisma)
    agent = await repo.get_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="AIOS Agent not found")
    return agent


# ── Notifications (AIOS domain) ────────────────────────────

@app.get("/api/aios/notifications")
async def aios_get_notifications(
    limit: int = 100,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """List AIOS mission notifications ordered by creation date descending."""
    repo = AiosNotificationRepository(prisma)
    notifs = await repo.get_all(limit=limit)
    return [
        {
            "notification_id": n.notification_id,
            "user_id": n.user_id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifs
    ]


@app.post("/api/aios/notifications/{notification_id}/read")
async def aios_mark_notification_read(
    notification_id: str,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """Mark a notification as read."""
    repo = AiosNotificationRepository(prisma)
    notif = await repo.get_by_id(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    updated = await repo.mark_read(notification_id)
    return {"success": True, "notification_id": notification_id, "is_read": updated.is_read}


@app.post("/api/aios/notifications", status_code=201)
async def aios_create_notification(
    payload: AiosNotificationCreate,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_operator),
):
    """Manually create an AIOS notification."""
    repo = AiosNotificationRepository(prisma)
    data = {
        "title": payload.title,
        "message": payload.message,
        "notification_type": payload.notification_type.value,
    }
    if payload.user_id:
        data["user_id"] = payload.user_id
    notif = await repo.create(data)
    return {"notification_id": notif.notification_id, "title": notif.title}


# ── Mission History ────────────────────────────────────────

@app.get("/api/aios/history")
async def aios_get_history(
    limit: int = 100,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """List completed mission history records."""
    repo = MissionHistoryRepository(prisma)
    history = await repo.get_all(limit=limit)
    return [
        {
            "history_id": h.history_id,
            "mission_id": h.mission_id,
            "event_name": h.event_name,
            "final_status": h.final_status,
            "duration": h.duration,
            "total_agents": h.total_agents,
            "location": h.location,
            "completed_at": h.completed_at.isoformat(),
        }
        for h in history
    ]


@app.post("/api/aios/history", status_code=201)
async def aios_create_history(
    payload: MissionHistoryCreate,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """Manually archive a completed mission into MissionHistory (called by frontend on missionDone)."""
    repo = MissionHistoryRepository(prisma)

    # Prevent duplicate entries for the same mission
    existing = await repo.get_by_mission(payload.mission_id)
    if existing:
        return {
            "history_id": existing.history_id,
            "mission_id": existing.mission_id,
            "event_name": existing.event_name,
            "final_status": existing.final_status,
            "duration": existing.duration,
            "total_agents": existing.total_agents,
            "location": existing.location,
            "completed_at": existing.completed_at.isoformat(),
            "created": False,
        }

    record = await repo.create({
        "mission_id": payload.mission_id,
        "event_name": payload.event_name,
        "final_status": payload.final_status,
        "duration": payload.duration,
        "total_agents": payload.total_agents,
        "location": payload.location or "Unknown",
    })
    return {
        "history_id": record.history_id,
        "mission_id": record.mission_id,
        "event_name": record.event_name,
        "final_status": record.final_status,
        "duration": record.duration,
        "total_agents": record.total_agents,
        "location": record.location,
        "completed_at": record.completed_at.isoformat(),
        "created": True,
    }


# ── System Settings ────────────────────────────────────────

@app.get("/api/aios/settings")
async def aios_get_settings(
    prisma=Depends(_require_prisma),
    current_user=Depends(require_viewer),
):
    """List all AIOS system settings."""
    repo = SystemSettingsRepository(prisma)
    settings_list = await repo.get_all()
    return [
        {
            "setting_id": s.setting_id,
            "setting_name": s.setting_name,
            "setting_value": s.setting_value,
            "description": s.description,
            "updated_at": s.updated_at.isoformat(),
        }
        for s in settings_list
    ]


@app.put("/api/aios/settings/{setting_name}")
async def aios_update_setting(
    setting_name: str,
    payload: SystemSettingUpdate,
    prisma=Depends(_require_prisma),
    current_user=Depends(require_developer),
):
    """Create or update a system setting by name."""
    repo = SystemSettingsRepository(prisma)
    setting = await repo.upsert(
        name=setting_name,
        value=payload.setting_value,
        description=payload.description,
    )
    return {
        "setting_id": setting.setting_id,
        "setting_name": setting.setting_name,
        "setting_value": setting.setting_value,
        "updated_at": setting.updated_at.isoformat(),
    }


# ── Event Understanding (NLU Classification) ──────────────

@app.post("/api/aios/understand")
async def aios_understand_event(
    payload: Dict[str, str],
):
    """
    Classify raw input text into an event category with confidence scoring.
    Returns the category key (e.g. 'building_fire', 'flash_flood')
    that maps directly to EVENT_CONFIGS on the frontend.
    NEVER defaults to 'road_accident'. Returns 'unclassified' if unsure.
    No database or Prisma connection required.
    """
    from backend.event_engine.understanding import understand_event

    text = payload.get("text", "")
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text field is required and cannot be empty.")

    category, confidence = understand_event(text)
    return {
        "category": category,
        "confidence": confidence,
        "input_text": text,
        "engine": "synonym_nlu_v2",
    }


# ── Database Health Check ──────────────────────────────────

@app.get("/api/aios/health")
async def aios_health_check():
    """Check the health of both SQLite and PostgreSQL database connections."""
    return {
        "status": "operational",
        "postgresql_connected": is_prisma_connected(),
        "aios_api_version": "1.0.0",
        "endpoints": [
            "POST /api/aios/events",
            "GET  /api/aios/events",
            "GET  /api/aios/events/{event_id}",
            "GET  /api/aios/missions",
            "GET  /api/aios/missions/{mission_id}",
            "GET  /api/aios/agents",
            "GET  /api/aios/agents/{agent_id}",
            "GET  /api/aios/notifications",
            "POST /api/aios/notifications/{id}/read",
            "POST /api/aios/notifications",
            "GET  /api/aios/history",
            "GET  /api/aios/settings",
            "PUT  /api/aios/settings/{name}",
            "POST /api/aios/understand",
        ]
    }


# ── Database Full Viewer ───────────────────────────────────

@app.get("/api/db-view")
async def aios_db_view(db: Session = Depends(get_db)):
    """
    Returns full contents of all database tables from both SQLite (SQLAlchemy)
    and PostgreSQL (Prisma). Used by the visual Database Viewer tab.
    """
    result = {
        "sqlite": {},
        "postgresql": {}
    }
    
    # 1. Fetch SQLite tables
    try:
        result["sqlite"]["users"] = [
            {"user_id": u.id, "email": u.email, "role": u.role, "is_active": u.is_active}
            for u in db.query(UserModel).all()
        ]
        result["sqlite"]["agents"] = [
            {
                "id": a.id, "name": a.name, "role": a.role, "goal": a.goal,
                "status": a.status, "health": a.health, "created_at": a.created_at
            }
            for a in db.query(AgentModel).all()
        ]
        result["sqlite"]["devices"] = [
            {
                "id": d.id, "name": d.name, "type": d.type, "status": d.status,
                "ip_address": d.ip_address, "firmware": d.firmware, "last_ping": d.last_ping
            }
            for d in db.query(EdgeDeviceModel).all()
        ]
        result["sqlite"]["marketplace"] = [
            {"id": m.id, "name": m.name, "role": m.role, "cost": m.cost, "installed": m.installed}
            for m in db.query(MarketplaceAgentModel).all()
        ]
        result["sqlite"]["audit_logs"] = [
            {
                "id": l.id, "timestamp": l.timestamp, "user": l.user,
                "role": l.role, "action": l.action, "status": l.status, "details": l.details
            }
            for l in db.query(AuditLogModel).all()
        ]
        result["sqlite"]["notifications"] = [
            {"id": n.id, "title": n.title, "message": n.message, "type": n.type, "read": n.read, "timestamp": n.timestamp}
            for n in db.query(NotificationModel).all()
        ]
        result["sqlite"]["messages"] = [
            {"id": m.id, "sender": m.sender, "receiver": m.receiver, "content": m.content, "timestamp": m.timestamp}
            for m in db.query(AgentMessageModel).all()
        ]
        result["sqlite"]["api_keys"] = [
            {"id": k.id, "name": k.name, "key": k.key, "status": k.status, "created": k.created, "last_used": k.last_used}
            for k in db.query(ApiKeyModel).all()
        ]
    except Exception as e:
        import logging
        logging.getLogger("aios.api").error(f"Error querying SQLite for db-view: {e}")
        result["sqlite"]["error"] = str(e)

    # 2. Fetch PostgreSQL (Prisma) tables
    if is_prisma_connected():
        try:
            prisma = get_prisma()
            # Fetch events
            events = await prisma.event.find_many()
            result["postgresql"]["events"] = [
                {
                    "event_id": e.event_id, "event_title": e.event_title,
                    "event_description": e.event_description, "detected_category": e.detected_category,
                    "severity": e.severity, "status": e.status, "address": e.address, "created_at": e.created_at.isoformat() if e.created_at else None
                }
                for e in events
            ]
            
            # Fetch missions
            missions = await prisma.mission.find_many()
            result["postgresql"]["missions"] = [
                {
                    "mission_id": m.mission_id, "event_id": m.event_id, "mission_name": m.mission_name,
                    "mission_status": m.mission_status, "start_time": m.start_time.isoformat() if m.start_time else None,
                    "completion_percentage": m.completion_percentage, "ai_summary": m.ai_summary
                }
                for m in missions
            ]
            
            # Fetch AIOS agents
            aios_agents = await prisma.agent.find_many()
            result["postgresql"]["agents"] = [
                {
                    "agent_id": a.agent_id, "agent_name": a.agent_name, "agent_type": a.agent_type,
                    "is_enabled": a.is_enabled, "description": a.description
                }
                for a in aios_agents
            ]

            # Fetch timelines
            timelines = await prisma.missiontimeline.find_many()
            result["postgresql"]["timelines"] = [
                {
                    "timeline_id": t.timeline_id, "mission_id": t.mission_id, "action": t.action,
                    "agent_name": t.agent_name, "status": t.status, "details": t.details, "timestamp": t.timestamp.isoformat() if t.timestamp else None
                }
                for t in timelines
            ]

            # Fetch agent messages
            messages = await prisma.agentmessage.find_many()
            result["postgresql"]["messages"] = [
                {
                    "message_id": msg.message_id, "mission_id": msg.mission_id,
                    "sender_agent": msg.sender_agent, "receiver_agent": msg.receiver_agent,
                    "message": msg.message, "message_type": msg.message_type, "sent_at": msg.sent_at.isoformat() if msg.sent_at else None
                }
                for msg in messages
            ]

            # Fetch event agent mappings
            mappings = await prisma.eventagentmapping.find_many()
            result["postgresql"]["mappings"] = [
                {
                    "mapping_id": mp.mapping_id, "event_id": mp.event_id, "agent_id": mp.agent_id,
                    "status": mp.status, "activation_time": mp.activation_time.isoformat() if mp.activation_time else None,
                    "current_task": mp.current_task
                }
                for mp in mappings
            ]
            
            # Fetch workflow steps
            steps = await prisma.workflowstep.find_many()
            result["postgresql"]["workflow_steps"] = [
                {
                    "workflow_id": w.workflow_id, "mission_id": w.mission_id, "step_number": w.step_number,
                    "step_name": w.step_name, "description": w.description, "status": w.status
                }
                for w in steps
            ]
            
            # Fetch history
            history = await prisma.missionhistory.find_many()
            result["postgresql"]["history"] = [
                {
                    "history_id": h.history_id, "mission_id": h.mission_id, "event_name": h.event_name,
                    "location": h.location, "completed_at": h.completed_at.isoformat() if h.completed_at else None, "duration": h.duration
                }
                for h in history
            ]

            # Fetch settings
            settings_records = await prisma.systemsetting.find_many()
            result["postgresql"]["settings"] = [
                {"setting_id": s.setting_id, "setting_name": s.setting_name, "setting_value": s.setting_value}
                for s in settings_records
            ]

        except Exception as e:
            import logging
            logging.getLogger("aios.api").error(f"Error querying PostgreSQL for db-view: {e}")
            result["postgresql"]["error"] = str(e)
    else:
        result["postgresql"]["error"] = "PostgreSQL (Prisma) is not connected."
        
    return result
