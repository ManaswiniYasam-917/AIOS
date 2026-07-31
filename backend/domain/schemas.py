from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    simulated_role: Optional[str] = "Developer"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "Developer"

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Agent Schemas
class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    role: Optional[str] = "Generalist"
    goal: Optional[str] = "Assist operations."
    memory: Optional[str] = "Short-term"
    knowledge: Optional[List[str]] = []
    reasoning: Optional[str] = "Zero-shot"
    planning: Optional[str] = "BFS"
    tools: Optional[List[str]] = []
    permissions: Optional[List[str]] = []
    configuration: Optional[Dict[str, Any]] = {}

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    memory: Optional[str] = None
    knowledge: Optional[List[str]] = None
    reasoning: Optional[str] = None
    planning: Optional[str] = None
    tools: Optional[List[str]] = None
    permissions: Optional[List[str]] = None
    configuration: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    health: Optional[str] = None

class AgentControl(BaseModel):
    action: str  # 'pause', 'resume', 'deploy', 'clone'
    userEmail: Optional[str] = "manaswiniyasam617@gmail.com"
    userRole: Optional[str] = "Super Admin"

class AgentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    role: Optional[str]
    goal: Optional[str]
    memory: str
    knowledge: List[str]
    reasoning: str
    planning: str
    tools: List[str]
    permissions: List[str]
    configuration: Dict[str, Any]
    status: str
    health: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Device Schemas
class DeviceLocation(BaseModel):
    lat: float
    lng: float
    name: str

class DeviceResponse(BaseModel):
    id: str
    name: str
    type: str
    status: str
    cpu: int
    ram: int
    battery: Optional[int]
    storage: int
    temperature: int
    health: str
    location_lat: float
    location_lng: float
    location_name: str
    last_seen: datetime

    class Config:
        from_attributes = True

class DeviceDiagnosticRequest(BaseModel):
    userEmail: Optional[str] = "manaswiniyasam617@gmail.com"
    userRole: Optional[str] = "Super Admin"

# Marketplace Schemas
class MarketplaceAgentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: str
    rating: float
    installs: int
    developer: str
    version: str
    is_installed: bool

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: str
    timestamp: datetime
    user: str
    role: str
    action: str
    status: str
    details: Optional[str]

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    timestamp: datetime
    read: bool

    class Config:
        from_attributes = True

# Agent Message Schemas
class AgentMessageCreate(BaseModel):
    senderId: str
    senderName: str
    receiverId: str
    receiverName: str
    content: str
    type: str  # Direct, Broadcast, TaskSharing, KnowledgeSharing, Heartbeat

class AgentMessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    receiver_name: str
    content: str
    timestamp: datetime
    type: str
    status: str

    class Config:
        from_attributes = True

# API Key Schemas
class ApiKeyCreate(BaseModel):
    name: str
    userEmail: Optional[str] = "manaswiniyasam617@gmail.com"
    userRole: Optional[str] = "Super Admin"

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key: str
    created: datetime
    last_used: str
    status: str

    class Config:
        from_attributes = True

# Metrics
class AlertsCount(BaseModel):
    info: int
    warning: int
    critical: int

class SystemMetricsResponse(BaseModel):
    cpuUsage: int
    ramUsage: int
    storageUsage: int
    networkIn: float
    networkOut: float
    activeAgents: int
    connectedDevices: int
    runningTasks: int
    alertsCount: AlertsCount
