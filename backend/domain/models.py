import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey, Table
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# Association tables or relationships can be placed here if needed in the future

class UserModel(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Viewer")  # Super Admin, Organization Admin, Developer, Operator, Viewer, Guest
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AgentModel(Base):
    __tablename__ = "agents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String)
    role = Column(String)
    goal = Column(String)
    memory = Column(String, default="Short-term")  # Short-term, Long-term, Hybrid, Vector DB
    knowledge = Column(JSON, default=list)  # List of string knowledge bases
    reasoning = Column(String, default="Zero-shot")  # Zero-shot, CoT, ReAct, Reflexion
    planning = Column(String, default="BFS")  # BFS, DFS, A*, Task Trees
    tools = Column(JSON, default=list)  # List of string tool names
    permissions = Column(JSON, default=list)  # List of string permissions
    configuration = Column(JSON, default=dict)  # Arbitrary dict parameters
    status = Column(String, default="Idle")  # Running, Paused, Failed, Idle
    health = Column(String, default="Healthy")  # Healthy, Warning, Critical
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class EdgeDeviceModel(Base):
    __tablename__ = "edge_devices"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String)  # Jetson, Raspberry Pi, ESP32, Robot, Drone, Vehicle, etc.
    status = Column(String, default="Offline")  # Online, Offline, Maintenance
    cpu = Column(Integer, default=0)
    ram = Column(Integer, default=0)
    battery = Column(Integer, nullable=True)  # Null if plugged in
    storage = Column(Integer, default=0)
    temperature = Column(Integer, default=0)
    health = Column(String, default="Healthy")  # Healthy, Warning, Critical
    location_lat = Column(Float)
    location_lng = Column(Float)
    location_name = Column(String)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

class MarketplaceAgentModel(Base):
    __tablename__ = "marketplace_agents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String)
    category = Column(String)  # Assistant, Data Science, Robotics, DevOps, Vision, NLP
    rating = Column(Float, default=5.0)
    installs = Column(Integer, default=0)
    developer = Column(String)
    version = Column(String)
    is_installed = Column(Boolean, default=False)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user = Column(String, nullable=False)
    role = Column(String, nullable=False)
    action = Column(String, nullable=False)  # USER_LOGIN, AGENT_DEPLOY, etc.
    status = Column(String, default="Success")  # Success, Failure, Warning
    details = Column(String)

class NotificationModel(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    type = Column(String, nullable=False)  # Info, Warning, Critical, System, Security, Deployment
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    read = Column(Boolean, default=False)

class AgentMessageModel(Base):
    __tablename__ = "agent_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, nullable=False)
    sender_name = Column(String, nullable=False)
    receiver_id = Column(String, nullable=False)  # "All" for broadcast
    receiver_name = Column(String, nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    type = Column(String, nullable=False)  # Direct, Broadcast, TaskSharing, KnowledgeSharing, Heartbeat
    status = Column(String, default="Sent")  # Sent, Delivered, Read, Encrypted

class ApiKeyModel(Base):
    __tablename__ = "api_keys"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    key = Column(String, unique=True, index=True, nullable=False)
    created = Column(DateTime, default=datetime.datetime.utcnow)
    last_used = Column(String, default="Never")
    status = Column(String, default="Active")  # Active, Revoked
