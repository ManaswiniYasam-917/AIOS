import datetime
from sqlalchemy.orm import Session
from backend.domain.models import (
    UserModel, AgentModel, EdgeDeviceModel, 
    MarketplaceAgentModel, AuditLogModel, 
    NotificationModel, AgentMessageModel, ApiKeyModel
)

class BaseRepository:
    def __init__(self, db: Session):
        self.db = db

class UserRepository(BaseRepository):
    def get_by_email(self, email: str) -> UserModel:
        return self.db.query(UserModel).filter(UserModel.email == email).first()

    def create(self, user: UserModel) -> UserModel:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

class AgentRepository(BaseRepository):
    def get_all(self):
        return self.db.query(AgentModel).all()

    def get_by_id(self, agent_id: str) -> AgentModel:
        return self.db.query(AgentModel).filter(AgentModel.id == agent_id).first()

    def create(self, agent: AgentModel) -> AgentModel:
        self.db.add(agent)
        self.db.commit()
        self.db.refresh(agent)
        return agent

    def update(self, agent: AgentModel) -> AgentModel:
        self.db.commit()
        self.db.refresh(agent)
        return agent

    def delete(self, agent: AgentModel):
        self.db.delete(agent)
        self.db.commit()

class DeviceRepository(BaseRepository):
    def get_all(self):
        return self.db.query(EdgeDeviceModel).all()

    def get_by_id(self, device_id: str) -> EdgeDeviceModel:
        return self.db.query(EdgeDeviceModel).filter(EdgeDeviceModel.id == device_id).first()

    def create(self, device: EdgeDeviceModel) -> EdgeDeviceModel:
        self.db.add(device)
        self.db.commit()
        self.db.refresh(device)
        return device

    def update(self, device: EdgeDeviceModel) -> EdgeDeviceModel:
        self.db.commit()
        self.db.refresh(device)
        return device

class MarketplaceRepository(BaseRepository):
    def get_all(self):
        return self.db.query(MarketplaceAgentModel).all()

    def get_by_id(self, item_id: str) -> MarketplaceAgentModel:
        return self.db.query(MarketplaceAgentModel).filter(MarketplaceAgentModel.id == item_id).first()

    def update(self, item: MarketplaceAgentModel) -> MarketplaceAgentModel:
        self.db.commit()
        self.db.refresh(item)
        return item

class AuditLogRepository(BaseRepository):
    def get_all(self, limit: int = 100):
        return self.db.query(AuditLogModel).order_by(AuditLogModel.timestamp.desc()).limit(limit).all()

    def create(self, log: AuditLogModel) -> AuditLogModel:
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

class NotificationRepository(BaseRepository):
    def get_all(self):
        return self.db.query(NotificationModel).order_by(NotificationModel.timestamp.desc()).all()

    def get_by_id(self, notif_id: str) -> NotificationModel:
        return self.db.query(NotificationModel).filter(NotificationModel.id == notif_id).first()

    def create(self, notif: NotificationModel) -> NotificationModel:
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def clear_all(self):
        self.db.query(NotificationModel).delete()
        self.db.commit()

    def update(self, notif: NotificationModel) -> NotificationModel:
        self.db.commit()
        self.db.refresh(notif)
        return notif

class MessageRepository(BaseRepository):
    def get_all(self):
        return self.db.query(AgentMessageModel).order_by(AgentMessageModel.timestamp.desc()).all()

    def create(self, msg: AgentMessageModel) -> AgentMessageModel:
        self.db.add(msg)
        self.db.commit()
        self.db.refresh(msg)
        return msg

class ApiKeyRepository(BaseRepository):
    def get_all(self):
        return self.db.query(ApiKeyModel).all()

    def get_by_id(self, key_id: str) -> ApiKeyModel:
        return self.db.query(ApiKeyModel).filter(ApiKeyModel.id == key_id).first()

    def create(self, key: ApiKeyModel) -> ApiKeyModel:
        self.db.add(key)
        self.db.commit()
        self.db.refresh(key)
        return key

    def delete(self, key: ApiKeyModel):
        self.db.delete(key)
        self.db.commit()


def seed_database(db: Session):
    """Seed the database with initial telemetry dataset if empty."""
    # Seed Agents
    if db.query(AgentModel).count() == 0:
        agents = [
            AgentModel(
                id='agent-1',
                name='ARES-1',
                description='Enterprise security sentinel monitoring live network anomalies and executing automated containment protocols.',
                role='Cybersecurity Sentinel',
                goal='Detect, isolate, and mitigate intrusion attempts, zero-day attacks, and lateral malware progression across all enterprise subnets.',
                memory='Hybrid',
                knowledge=['OWASP Top 10', 'MITRE ATT&CK Framework', 'Vulnerability Databases', 'Secure Shell protocols'],
                reasoning='ReAct',
                planning='Task Trees',
                tools=['PortScanner', 'IpBlocker', 'PacketAnalyzer', 'CredentialsAudit'],
                permissions=['Network Quarantine', 'Firewall Rewrite', 'Alert Escalation'],
                configuration={'minConfidenceScore': '0.85', 'autoQuarantine': 'true', 'scanIntervalMs': '5000'},
                status='Running',
                health='Healthy'
            ),
            AgentModel(
                id='agent-2',
                name='HELIOS-4',
                description='Predictive logistics coordinator managing real-time autonomous routing and edge vehicle dispatching.',
                role='Supply Chain Optimizer',
                goal='Optimize delivery corridors, fuel efficiency, and payload delivery times across 15 automated logistics nodes.',
                memory='Long-term',
                knowledge=['Fleet Routing Algorithms', 'Real-time Traffic APIs', 'Weather Forecast API', 'Predictive Maintenance models'],
                reasoning='CoT',
                planning='A*',
                tools=['RoutePlanner', 'FleetTracker', 'WeatherClient', 'PayloadCalculator'],
                permissions=['Drone Dispatch', 'Vehicle Route Override', 'Warehouse Queue Allocation'],
                configuration={'maxDelayThresholdMin': '15', 'rerouteFrequencyMinutes': '5'},
                status='Running',
                health='Healthy'
            ),
            AgentModel(
                id='agent-3',
                name='MINERVA-7',
                description='Deep market research analyst processing structured, unstructured, and news data feeds.',
                role='Quantitative Market Analyst',
                goal='Identify arbitrage opportunities, correlate macro-economic events with supply constraints, and synthesize action plans.',
                memory='Vector DB',
                knowledge=['SEC Filings', 'Global Commodity Prices', 'Geopolitical News Feeds', 'Macro Economics'],
                reasoning='Reflexion',
                planning='DFS',
                tools=['WebSearch', 'SecDataReader', 'DataPlotter', 'ExcelExporter'],
                permissions=['Report Publishing', 'Knowledge Base Storage'],
                configuration={'updateFrequencySeconds': '3600', 'depthOfSearch': 'High'},
                status='Idle',
                health='Healthy'
            ),
            AgentModel(
                id='agent-4',
                name='HERMES-9',
                description='Critical edge node coordinator managing data syncing between cloud hubs and disconnected remote units.',
                role='Federated Edge Coordinator',
                goal='Coordinate offline-first synchronization protocols with drone swarms and remote sensors without losing transactional accuracy.',
                memory='Short-term',
                knowledge=['Conflict-free Replicated Data Types (CRDT)', 'MQTT Broker setups', 'Low-bandwidth Compression'],
                reasoning='Zero-shot',
                planning='BFS',
                tools=['MqttBroker', 'DataCompressor', 'ConflictResolver'],
                permissions=['Database Merge', 'Peer Broadcast'],
                configuration={'syncIntervalSeconds': '30', 'maxQueueSizeMb': '128'},
                status='Failed',
                health='Critical'
            )
        ]
        db.add_all(agents)

    # Seed Devices
    if db.query(EdgeDeviceModel).count() == 0:
        devices = [
            EdgeDeviceModel(
                id='dev-1',
                name='San Francisco Terminal - AI Core',
                type='Jetson',
                status='Online',
                cpu=42,
                ram=68,
                battery=100,
                storage=54,
                temperature=41,
                health='Healthy',
                location_lat=37.7749,
                location_lng=-122.4194,
                location_name='San Francisco, CA'
            ),
            EdgeDeviceModel(
                id='dev-2',
                name='Munich Assembly Line #3',
                type='Robot',
                status='Online',
                cpu=78,
                ram=85,
                battery=92,
                storage=61,
                temperature=48,
                health='Healthy',
                location_lat=48.1351,
                location_lng=11.582,
                location_name='Munich, Germany'
            ),
            EdgeDeviceModel(
                id='dev-3',
                name='Austin Metro Grid Drone 12',
                type='Drone',
                status='Online',
                cpu=58,
                ram=45,
                battery=34,
                storage=22,
                temperature=38,
                health='Warning',
                location_lat=30.2672,
                location_lng=-97.7431,
                location_name='Austin, TX'
            ),
            EdgeDeviceModel(
                id='dev-4',
                name='Nevada Highway Fleet Node #5',
                type='Vehicle',
                status='Maintenance',
                cpu=5,
                ram=15,
                battery=99,
                storage=90,
                temperature=55,
                health='Critical',
                location_lat=39.7392,
                location_lng=-104.9903,
                location_name='Nevada Test Route'
            ),
            EdgeDeviceModel(
                id='dev-5',
                name='Tokyo Command Server Room',
                type='Raspberry Pi',
                status='Online',
                cpu=18,
                ram=34,
                battery=100,
                storage=41,
                temperature=32,
                health='Healthy',
                location_lat=35.6762,
                location_lng=139.6503,
                location_name='Tokyo, Japan'
            )
        ]
        db.add_all(devices)

    # Seed Marketplace
    if db.query(MarketplaceAgentModel).count() == 0:
        mp_items = [
            MarketplaceAgentModel(
                id='mp-1',
                name='Sentinel Guardian',
                description='Advanced network packet intrusion inspector and proxy gateway blocker.',
                category='Assistant',
                rating=4.9,
                installs=1420,
                developer='OpenAI Enterprise',
                version='v3.2.1',
                is_installed=True
            ),
            MarketplaceAgentModel(
                id='mp-2',
                name='DataSynthesizer',
                description='Neural network forecast modeler specialized in commodities, shipping freight indices, and pricing predictions.',
                category='Data Science',
                rating=4.7,
                installs=890,
                developer='Google AI Research',
                version='v1.5.0',
                is_installed=False
            ),
            MarketplaceAgentModel(
                id='mp-3',
                name='Valkyrie Flight Controller',
                description='Precision collision avoidance and autonomous pathfinding for edge UAV systems under low connection states.',
                category='Robotics',
                rating=4.8,
                installs=350,
                developer='Tesla Automation Group',
                version='v4.1.0',
                is_installed=False
            ),
            MarketplaceAgentModel(
                id='mp-4',
                name='ChronoForecast',
                description='Temporal deep learning agent that aggregates and analyses real-time micro-economic events.',
                category='Data Science',
                rating=4.5,
                installs=512,
                developer='NVIDIA GTC Core',
                version='v2.0.1',
                is_installed=False
            )
        ]
        db.add_all(mp_items)

    # Seed Notifications
    if db.query(NotificationModel).count() == 0:
        notifications = [
            NotificationModel(
                id='notif-1',
                type='Critical',
                title='Agent HERMES-9 Crash',
                message='Federated Edge Coordinator disconnected during synchronization loop. Handshake timeout on remote subnet.',
                read=False
            ),
            NotificationModel(
                id='notif-2',
                type='Warning',
                title='Low Battery on Drone 12',
                message='Austin Metro Grid Drone 12 is at 34% capacity. Recommended action: Route to nearest inductive docking hub.',
                read=False
            ),
            NotificationModel(
                id='notif-3',
                type='Info',
                title='Deployment Successful',
                message='ARES-1 Sentinel has established a secure proxy containment filter on subnets 10.0.4.x.',
                read=True
            )
        ]
        db.add_all(notifications)

    # Seed Messages
    if db.query(AgentMessageModel).count() == 0:
        messages = [
            AgentMessageModel(
                id='msg-1',
                sender_id='agent-1',
                sender_name='ARES-1',
                receiver_id='All',
                receiver_name='Global Broadcast',
                content='SECURITY COMPLIANCE CHECK: Active firewall rules synced. Subnet isolation filters fully initialized.',
                type='Broadcast',
                status='Encrypted'
            ),
            AgentMessageModel(
                id='msg-2',
                sender_id='agent-2',
                sender_name='HELIOS-4',
                receiver_id='agent-3',
                receiver_name='MINERVA-7',
                content='TASK SHARING: Supply corridor SF-to-Austin report synthesized. Please analyze macro commodity impact of delay trends.',
                type='TaskSharing',
                status='Encrypted'
            ),
            AgentMessageModel(
                id='msg-3',
                sender_id='agent-3',
                sender_name='MINERVA-7',
                receiver_id='agent-2',
                receiver_name='HELIOS-4',
                content='REQUEST RESPONSE: Understood. Cross-referencing diesel indices and port congestion queues. Standby for prediction vectors.',
                type='KnowledgeSharing',
                status='Sent'
            ),
            AgentMessageModel(
                id='msg-4',
                sender_id='agent-1',
                sender_name='ARES-1',
                receiver_id='agent-4',
                receiver_name='HERMES-9',
                content='HEARTBEAT: Probing offline edge cluster Tokyo node gateway. State handshake initiated.',
                type='Heartbeat',
                status='Encrypted'
            )
        ]
        db.add_all(messages)

    # Seed API keys for all services
    if db.query(ApiKeyModel).count() == 0:
        keys = [
            ApiKeyModel(
                id='key-1',
                name='ARES_CORE_SECOPS',
                key='aios_sec_****************************4a9d',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-2',
                name='HELIOS_FLEET_MQTT',
                key='aios_mq_****************************f812',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-3',
                name='GEMINI_CORE_API_KEY',
                key='aios_gemini_**************************a9f8',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-4',
                name='OPENAI_INTEGRATION_KEY',
                key='aios_openai_**************************f83d',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-5',
                name='POSTGRES_DB_SECRET',
                key='aios_pg_******************************d28a',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-6',
                name='REDIS_CACHE_AUTHENTICATOR',
                key='aios_redis_***************************b14c',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-7',
                name='QDRANT_VECTOR_DB_TOKEN',
                key='aios_qdrant_**************************e75b',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-8',
                name='NEO4J_GRAPH_DB_SECRET',
                key='aios_neo4j_***************************a18e',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-9',
                name='GRPC_SECURE_TUNNEL_KEY',
                key='aios_grpc_****************************c890',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-10',
                name='NVIDIA_OMNIVERSE_CONNECTOR',
                key='aios_nv_******************************543a',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-11',
                name='LANGGRAPH_COGNITIVE_KEY',
                key='aios_lg_******************************d17b',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-12',
                name='CREWAI_ORCHESTRATOR_TOKEN',
                key='aios_crew_****************************c321',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            ),
            ApiKeyModel(
                id='key-13',
                name='AUTOGEN_AGENT_COMMUNICATION',
                key='aios_ag_*****************************e987',
                last_used=datetime.datetime.utcnow().isoformat(),
                status='Active'
            )
        ]
        db.add_all(keys)

    db.commit()
