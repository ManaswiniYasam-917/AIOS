"""
AIOS Pydantic Schemas — PostgreSQL / Prisma Domain Layer
These schemas are separate from the existing SQLAlchemy-based schemas.
They serve the /api/aios/* endpoint group.
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


# ============================================================
# ENUMS (matching Prisma schema)
# ============================================================

class UserRoleEnum(str, Enum):
    SUPER_ADMIN = "Super Admin"
    ORG_ADMIN = "Organization Admin"
    DEVELOPER = "Developer"
    OPERATOR = "Operator"
    VIEWER = "Viewer"
    GUEST = "Guest"


class EventSeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EventStatusEnum(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class AgentTypeEnum(str, Enum):
    EMERGENCY = "EMERGENCY"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    SURVEILLANCE = "SURVEILLANCE"
    COMMUNICATION = "COMMUNICATION"
    INTELLIGENCE = "INTELLIGENCE"
    LOGISTICS = "LOGISTICS"


class MappingStatusEnum(str, Enum):
    STANDBY = "STANDBY"
    PREPARING = "PREPARING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class MissionStatusEnum(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ABORTED = "ABORTED"


class WorkflowStatusEnum(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class MessageTypeEnum(str, Enum):
    BROADCAST = "BROADCAST"
    DIRECT = "DIRECT"
    TASK_SHARING = "TASK_SHARING"
    KNOWLEDGE_SHARING = "KNOWLEDGE_SHARING"
    HEARTBEAT = "HEARTBEAT"
    ALERT = "ALERT"


class NotificationTypeEnum(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    SYSTEM = "SYSTEM"
    SECURITY = "SECURITY"
    MISSION = "MISSION"


# ============================================================
# TABLE 1: Users
# ============================================================

class AiosUserCreate(BaseModel):
    full_name: Optional[str] = None
    email: str
    phone_number: Optional[str] = None
    password: str
    role: UserRoleEnum = UserRoleEnum.VIEWER
    organization: Optional[str] = None
    language: Optional[str] = "en"


class AiosUserResponse(BaseModel):
    user_id: str
    full_name: Optional[str]
    email: str
    phone_number: Optional[str]
    role: str
    organization: Optional[str]
    profile_image: Optional[str]
    language: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TABLE 2: Events
# ============================================================

class EventCreate(BaseModel):
    event_title: str = Field(..., min_length=3, max_length=500)
    event_description: str = Field(..., min_length=10)
    detected_category: str = Field(..., description="e.g. fire, flood, cyber, traffic")
    severity: EventSeverityEnum = EventSeverityEnum.MEDIUM
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    reported_by: Optional[str] = None
    detected_source: Optional[str] = "Manual Report"
    confidence_score: Optional[float] = 0.95


class EventResponse(BaseModel):
    event_id: str
    event_title: str
    event_description: str
    detected_category: str
    severity: str
    status: str
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    detected_source: Optional[str]
    confidence_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    # Nested
    ai_analysis: Optional[List[Any]] = []
    missions: Optional[List[Any]] = []

    class Config:
        from_attributes = True


# ============================================================
# TABLE 3: AI Analysis
# ============================================================

class AiAnalysisResponse(BaseModel):
    analysis_id: str
    event_id: str
    detected_problem: str
    reasoning: str
    severity_score: float
    estimated_people: Optional[int]
    estimated_damage: Optional[str]
    ai_summary: str
    confidence: float
    analyzed_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TABLE 4: Agents (AIOS domain)
# ============================================================

class AiosAgentCreate(BaseModel):
    agent_name: str
    agent_type: AgentTypeEnum = AgentTypeEnum.EMERGENCY
    description: Optional[str] = None
    organization: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = "#6366f1"
    is_enabled: bool = True


class AiosAgentResponse(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    description: Optional[str]
    organization: Optional[str]
    icon: Optional[str]
    color: Optional[str]
    is_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TABLE 5: Event Agent Mapping
# ============================================================

class EventAgentMappingResponse(BaseModel):
    mapping_id: str
    event_id: str
    agent_id: str
    status: str
    activation_time: Optional[datetime]
    completion_time: Optional[datetime]
    current_task: Optional[str]
    agent: Optional[AiosAgentResponse] = None

    class Config:
        from_attributes = True


# ============================================================
# TABLE 6: Missions
# ============================================================

class MissionResponse(BaseModel):
    mission_id: str
    event_id: str
    mission_name: str
    mission_status: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration: Optional[int]
    completion_percentage: float
    ai_summary: Optional[str]
    # Nested
    workflow_steps: Optional[List[Any]] = []
    agent_messages: Optional[List[Any]] = []
    mission_logs: Optional[List[Any]] = []

    class Config:
        from_attributes = True


# ============================================================
# TABLE 7: Workflow Steps
# ============================================================

class WorkflowStepResponse(BaseModel):
    workflow_id: str
    mission_id: str
    step_number: int
    step_name: str
    description: Optional[str]
    status: str
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================
# TABLE 8: Agent Messages (AIOS mission domain)
# ============================================================

class AiosAgentMessageCreate(BaseModel):
    mission_id: str
    sender_agent: str
    receiver_agent: Optional[str] = None
    message: str
    message_type: MessageTypeEnum = MessageTypeEnum.BROADCAST


class AiosAgentMessageResponse(BaseModel):
    message_id: str
    mission_id: str
    sender_agent: str
    receiver_agent: Optional[str]
    message: str
    message_type: str
    sent_at: datetime
    sender: Optional[AiosAgentResponse] = None

    class Config:
        from_attributes = True


# ============================================================
# TABLE 9: Mission Logs
# ============================================================

class MissionLogResponse(BaseModel):
    log_id: str
    mission_id: str
    event_id: str
    activity: str
    activity_time: datetime
    performed_by: Optional[str]

    class Config:
        from_attributes = True


# ============================================================
# TABLE 10: Notifications (AIOS domain)
# ============================================================

class AiosNotificationCreate(BaseModel):
    user_id: Optional[str] = None
    title: str
    message: str
    notification_type: NotificationTypeEnum = NotificationTypeEnum.INFO


class AiosNotificationResponse(BaseModel):
    notification_id: str
    user_id: Optional[str]
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TABLE 11: Mission History
# ============================================================

class MissionHistoryCreate(BaseModel):
    mission_id: str
    event_name: str
    final_status: str = "COMPLETED"
    duration: Optional[int] = None
    total_agents: int = 0
    location: Optional[str] = None


class MissionHistoryResponse(BaseModel):
    history_id: str
    mission_id: str
    event_name: str
    final_status: str
    duration: Optional[int]
    total_agents: int
    location: Optional[str]
    completed_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TABLE 12: System Settings
# ============================================================

class SystemSettingResponse(BaseModel):
    setting_id: str
    setting_name: str
    setting_value: str
    description: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


class SystemSettingUpdate(BaseModel):
    setting_value: str
    description: Optional[str] = None


# ============================================================
# Composite Response: Full Event Detail
# ============================================================

class EventDetailResponse(BaseModel):
    event_id: str
    event_title: str
    event_description: str
    detected_category: str
    severity: str
    status: str
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    country: Optional[str]
    detected_source: Optional[str]
    confidence_score: Optional[float]
    created_at: datetime
    updated_at: datetime
    ai_analysis: List[AiAnalysisResponse] = []
    missions: List[MissionResponse] = []
    agent_mappings: List[EventAgentMappingResponse] = []

    class Config:
        from_attributes = True


# ============================================================
# Composite Response: Full Mission Detail
# ============================================================

class MissionDetailResponse(BaseModel):
    mission_id: str
    event_id: str
    mission_name: str
    mission_status: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    duration: Optional[int]
    completion_percentage: float
    ai_summary: Optional[str]
    workflow_steps: List[WorkflowStepResponse] = []
    agent_messages: List[AiosAgentMessageResponse] = []
    mission_logs: List[MissionLogResponse] = []

    class Config:
        from_attributes = True
