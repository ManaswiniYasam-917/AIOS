import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import {
  UserRole,
  Agent,
  EdgeDevice,
  MarketplaceAgent,
  AuditLog,
  SystemMetrics,
  Notification,
  AgentMessage,
  ApiKey,
} from './src/types.js';

// ==========================================
// OFFLINE PASSWORD HASHING & TOKEN UTILS
// ==========================================

function hashPassword(password: string): string {
  const salt = 'aios_enterprise_cryptographic_pbkdf2_salt_328';
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
}

function generateToken(payload: { email: string; role: string }): string {
  const serialized = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', 'aios_super_secret_signing_key_328').update(serialized).digest('hex');
  return Buffer.from(serialized).toString('base64') + '.' + signature;
}

function verifyToken(token: string): { email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const serialized = Buffer.from(parts[0], 'base64').toString('utf-8');
    const signature = parts[1];
    const expectedSignature = crypto.createHmac('sha256', 'aios_super_secret_signing_key_328').update(serialized).digest('hex');
    if (signature === expectedSignature) {
      return JSON.parse(serialized);
    }
  } catch (err) {}
  return null;
}

// ==========================================
// PERSISTENT DATABASE STATE MANAGER
// ==========================================

const DB_FILE = path.join(process.cwd(), 'database.json');

interface UserAccount {
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
}

interface DatabaseState {
  users: UserAccount[];
  agents: Agent[];
  devices: EdgeDevice[];
  marketplaceAgents: MarketplaceAgent[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  messages: AgentMessage[];
  apiKeys: ApiKey[];
  events: any[];
  missions: any[];
}

let dbState: DatabaseState;

const defaultState: DatabaseState = {
  users: [
    {
      email: 'manaswiniyasam617@gmail.com',
      passwordHash: hashPassword('********'),
      role: 'Super Admin',
      isActive: true
    }
  ],
  agents: [
    {
      id: 'agent-1',
      name: 'ARES-1',
      description: 'Enterprise security sentinel monitoring live network anomalies and executing automated containment protocols.',
      role: 'Cybersecurity Sentinel',
      goal: 'Detect, isolate, and mitigate intrusion attempts, zero-day attacks, and lateral malware progression across all enterprise subnets.',
      memory: 'Hybrid',
      knowledge: ['OWASP Top 10', 'MITRE ATT&CK Framework', 'Vulnerability Databases', 'Secure Shell protocols'],
      reasoning: 'ReAct',
      planning: 'Task Trees',
      tools: ['PortScanner', 'IpBlocker', 'PacketAnalyzer', 'CredentialsAudit'],
      permissions: ['Network Quarantine', 'Firewall Rewrite', 'Alert Escalation'],
      configuration: { minConfidenceScore: '0.85', autoQuarantine: 'true', scanIntervalMs: '5000' },
      status: 'Running',
      health: 'Healthy',
      createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'agent-2',
      name: 'HELIOS-4',
      description: 'Predictive logistics coordinator managing real-time autonomous routing and edge vehicle dispatching.',
      role: 'Supply Chain Optimizer',
      goal: 'Optimize delivery corridors, fuel efficiency, and payload delivery times across 15 automated logistics nodes.',
      memory: 'Long-term',
      knowledge: ['Fleet Routing Algorithms', 'Real-time Traffic APIs', 'Weather Forecast API', 'Predictive Maintenance models'],
      reasoning: 'CoT',
      planning: 'A*',
      tools: ['RoutePlanner', 'FleetTracker', 'WeatherClient', 'PayloadCalculator'],
      permissions: ['Drone Dispatch', 'Vehicle Route Override', 'Warehouse Queue Allocation'],
      configuration: { maxDelayThresholdMin: '15', rerouteFrequencyMinutes: '5' },
      status: 'Running',
      health: 'Healthy',
      createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'agent-3',
      name: 'MINERVA-7',
      description: 'Deep market research analyst processing structured, unstructured, and news data feeds.',
      role: 'Quantitative Market Analyst',
      goal: 'Identify arbitrage opportunities, correlate macro-economic events with supply constraints, and synthesize action plans.',
      memory: 'Vector DB',
      knowledge: ['SEC Filings', 'Global Commodity Prices', 'Geopolitical News Feeds', 'Macro Economics'],
      reasoning: 'Reflexion',
      planning: 'DFS',
      tools: ['WebSearch', 'SecDataReader', 'DataPlotter', 'ExcelExporter'],
      permissions: ['Report Publishing', 'Knowledge Base Storage'],
      configuration: { updateFrequencySeconds: '3600', depthOfSearch: 'High' },
      status: 'Idle',
      health: 'Healthy',
      createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
      id: 'agent-4',
      name: 'HERMES-9',
      description: 'Critical edge node coordinator managing data syncing between cloud hubs and disconnected remote units.',
      role: 'Federated Edge Coordinator',
      goal: 'Coordinate offline-first synchronization protocols with drone swarms and remote sensors without losing transactional accuracy.',
      memory: 'Short-term',
      knowledge: ['Conflict-free Replicated Data Types (CRDT)', 'MQTT Broker setups', 'Low-bandwidth Compression'],
      reasoning: 'Zero-shot',
      planning: 'BFS',
      tools: ['MqttBroker', 'DataCompressor', 'ConflictResolver'],
      permissions: ['Database Merge', 'Peer Broadcast'],
      configuration: { syncIntervalSeconds: '30', maxQueueSizeMb: '128' },
      status: 'Failed',
      health: 'Critical',
      createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    },
  ],
  devices: [
    {
      id: 'dev-1',
      name: 'San Francisco Terminal - AI Core',
      type: 'Jetson',
      status: 'Online',
      cpu: 42,
      ram: 68,
      battery: 100,
      storage: 54,
      temperature: 41,
      health: 'Healthy',
      location: { lat: 37.7749, lng: -122.4194, name: 'San Francisco, CA' },
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'dev-2',
      name: 'Munich Assembly Line #3',
      type: 'Robot',
      status: 'Online',
      cpu: 78,
      ram: 85,
      battery: 92,
      storage: 61,
      temperature: 48,
      health: 'Healthy',
      location: { lat: 48.1351, lng: 11.582, name: 'Munich, Germany' },
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'dev-3',
      name: 'Austin Metro Grid Drone 12',
      type: 'Drone',
      status: 'Online',
      cpu: 58,
      ram: 45,
      battery: 34,
      storage: 22,
      temperature: 38,
      health: 'Warning',
      location: { lat: 30.2672, lng: -97.7431, name: 'Austin, TX' },
      lastSeen: new Date().toISOString(),
    },
    {
      id: 'dev-4',
      name: 'Nevada Highway Fleet Node #5',
      type: 'Vehicle',
      status: 'Maintenance',
      cpu: 5,
      ram: 15,
      battery: 99,
      storage: 90,
      temperature: 55,
      health: 'Critical',
      location: { lat: 39.7392, lng: -104.9903, name: 'Nevada Test Route' },
      lastSeen: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: 'dev-5',
      name: 'Tokyo Command Server Room',
      type: 'Raspberry Pi',
      status: 'Online',
      cpu: 18,
      ram: 34,
      battery: 100,
      storage: 41,
      temperature: 32,
      health: 'Healthy',
      location: { lat: 35.6762, lng: 139.6503, name: 'Tokyo, Japan' },
      lastSeen: new Date().toISOString(),
    },
  ],
  marketplaceAgents: [
    {
      id: 'mp-1',
      name: 'Sentinel Guardian',
      description: 'Advanced network packet intrusion inspector and proxy gateway blocker.',
      category: 'Assistant',
      rating: 4.9,
      installs: 1420,
      developer: 'OpenAI Enterprise',
      version: 'v3.2.1',
      isInstalled: true,
    },
    {
      id: 'mp-2',
      name: 'DataSynthesizer',
      description: 'Neural network forecast modeler specialized in commodities, shipping freight indices, and pricing predictions.',
      category: 'Data Science',
      rating: 4.7,
      installs: 890,
      developer: 'Google AI Research',
      version: 'v1.5.0',
      isInstalled: false,
    },
    {
      id: 'mp-3',
      name: 'Valkyrie Flight Controller',
      description: 'Precision collision avoidance and autonomous pathfinding for edge UAV systems under low connection states.',
      category: 'Robotics',
      rating: 4.8,
      installs: 350,
      developer: 'Tesla Automation Group',
      version: 'v4.1.0',
      isInstalled: false,
    },
    {
      id: 'mp-4',
      name: 'ChronoForecast',
      description: 'Temporal deep learning agent that aggregates and analyses real-time micro-economic events.',
      category: 'Data Science',
      rating: 4.5,
      installs: 512,
      developer: 'NVIDIA GTC Core',
      version: 'v2.0.1',
      isInstalled: false,
    },
  ],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      user: 'manaswiniyasam617@gmail.com',
      role: 'Super Admin',
      action: 'USER_LOGIN',
      status: 'Success',
      details: 'Authenticated successfully from IP 192.168.1.52. MFA verification approved.',
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      user: 'manaswiniyasam617@gmail.com',
      role: 'Super Admin',
      action: 'AGENT_DEPLOY',
      status: 'Success',
      details: 'Deployed Agent "ARES-1" to edge cluster SF-West.',
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      user: 'operator.secops@enterprise.aios',
      role: 'Operator',
      action: 'DEVICE_DIAGNOSTIC',
      status: 'Warning',
      details: 'Triggered diagnostic on "Austin Metro Grid Drone 12". Battery depletion warning detected.',
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      user: 'dev.mclaren@enterprise.aios',
      role: 'Developer',
      action: 'AGENT_CONFIG_UPDATE',
      status: 'Success',
      details: 'Updated "HELIOS-4" routing frequency to 5 minutes.',
    },
    {
      id: 'log-5',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      user: 'SYSTEM_DAEMON',
      role: 'Operator',
      action: 'AGENT_CRASH',
      status: 'Failure',
      details: 'Agent "HERMES-9" failed handshake with Edge Node Tokyo. Exception: LowBandwidthTimeout.',
    },
  ],
  notifications: [
    {
      id: 'notif-1',
      type: 'Critical',
      title: 'Agent HERMES-9 Crash',
      message: 'Federated Edge Coordinator disconnected during synchronization loop. Handshake timeout on remote subnet.',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      read: false,
    },
    {
      id: 'notif-2',
      type: 'Warning',
      title: 'Low Battery on Drone 12',
      message: 'Austin Metro Grid Drone 12 is at 34% capacity. Recommended action: Route to nearest inductive docking hub.',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      read: false,
    },
    {
      id: 'notif-3',
      type: 'Info',
      title: 'Deployment Successful',
      message: 'ARES-1 Sentinel has established a secure proxy containment filter on subnets 10.0.4.x.',
      timestamp: new Date(Date.now() - 3.5 * 3600000).toISOString(),
      read: true,
    },
  ],
  messages: [
    {
      id: 'msg-1',
      senderId: 'agent-1',
      senderName: 'ARES-1',
      receiverId: 'All',
      receiverName: 'Global Broadcast',
      content: 'SECURITY COMPLIANCE CHECK: Active firewall rules synced. Subnet isolation filters fully initialized.',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      type: 'Broadcast',
      status: 'Encrypted',
    },
    {
      id: 'msg-2',
      senderId: 'agent-2',
      senderName: 'HELIOS-4',
      receiverId: 'agent-3',
      receiverName: 'MINERVA-7',
      content: 'TASK SHARING: Supply corridor SF-to-Austin report synthesized. Please analyze macro commodity impact of delay trends.',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      type: 'TaskSharing',
      status: 'Encrypted',
    },
    {
      id: 'msg-3',
      senderId: 'agent-3',
      senderName: 'MINERVA-7',
      receiverId: 'agent-2',
      receiverName: 'HELIOS-4',
      content: 'REQUEST RESPONSE: Understood. Cross-referencing diesel indices and port congestion queues. Standby for prediction vectors.',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      type: 'KnowledgeSharing',
      status: 'Sent',
    },
    {
      id: 'msg-4',
      senderId: 'agent-1',
      senderName: 'ARES-1',
      receiverId: 'agent-4',
      receiverName: 'HERMES-9',
      content: 'HEARTBEAT: Probing offline edge cluster Tokyo node gateway. State handshake initiated.',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      type: 'Heartbeat',
      status: 'Encrypted',
    },
  ],
  apiKeys: [
    {
      id: 'key-1',
      name: 'ARES_CORE_SECOPS',
      key: 'aios_sec_****************************4a9d',
      created: new Date(Date.now() - 36 * 3600000).toISOString(),
      lastUsed: new Date(Date.now() - 5 * 60000).toISOString(),
      status: 'Active',
    },
    {
      id: 'key-2',
      name: 'HELIOS_FLEET_MQTT',
      key: 'aios_mq_****************************f812',
      created: new Date(Date.now() - 24 * 3600000).toISOString(),
      lastUsed: new Date(Date.now() - 3 * 60000).toISOString(),
      status: 'Active',
    },
  ],
  events: [
    {
      event_id: 'event-101',
      event_title: 'Emergency: NETWORK INTRUSION DETECTED',
      event_description: 'Anomalous zero-day payload progression identified on Subnet Alpha.',
      detected_category: 'cyberattack',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      address: 'Building 7, Server Corridor A',
      created_at: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      event_id: 'event-102',
      event_title: 'Incident: LOGISTICS CORRIDOR CONGESTION',
      event_description: 'Autonomous vehicle bottleneck detected at Node 4 warehouse bay.',
      detected_category: 'logistics',
      severity: 'HIGH',
      status: 'RESOLVED',
      address: 'Munich Logistics Terminal 3',
      created_at: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ],
  missions: [
    {
      mission_id: 'mission-201',
      event_id: 'event-101',
      mission_name: 'AIOS Autonomous Containment Protocol',
      mission_status: 'COMPLETED',
      start_time: new Date(Date.now() - 29 * 60000).toISOString(),
      completion_percentage: 100.0,
      ai_summary: 'Quarantined intruder IP, deployed ARES-1 firewall patch, and secured gateway.'
    },
    {
      mission_id: 'mission-202',
      event_id: 'event-102',
      mission_name: 'HELIOS Dynamic Fleet Reroute',
      mission_status: 'COMPLETED',
      start_time: new Date(Date.now() - 14 * 60000).toISOString(),
      completion_percentage: 100.0,
      ai_summary: 'Dispatched secondary drone convoy and cleared node congestion.'
    }
  ],
};

function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      dbState = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (!dbState.events || dbState.events.length === 0) {
        dbState.events = defaultState.events;
      }
      if (!dbState.missions || dbState.missions.length === 0) {
        dbState.missions = defaultState.missions;
      }
      return;
    } catch (err) {
      console.error('Failed to parse database.json, re-initializing database state.');
    }
  }
  dbState = defaultState;
  saveDatabase();
}

function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
}

// Initial Database Sync
loadDatabase();

// ==========================================
// SERVER APP & AUTH MIDDLEWARE SETUP
// ==========================================

const app = express();
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Default fallback to simplify console startup checks
    req.user = { email: 'manaswiniyasam617@gmail.com', role: 'Super Admin' };
    return next();
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized credentials.' });
  }

  req.user = user;
  next();
};

// Initialize Gemini Client Lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      try {
        aiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      } catch (err) {
        console.error('Failed to initialize Gemini Client:', err);
      }
    }
  }
  return aiClient;
}

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

app.post('/api/auth/signup', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password credentials.' });
  }

  const existing = dbState.users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'Email profile already exists.' });
  }

  const newUser = {
    email,
    passwordHash: hashPassword(password),
    role: role || 'Developer',
    isActive: true,
  };
  dbState.users.push(newUser);
  saveDatabase();

  res.json({ success: true, message: 'User registered.' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, simulated_role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password.' });
  }

  let user = dbState.users.find(u => u.email === email);
  if (!user) {
    // Auto-register simulated user for easier sandbox usage
    user = {
      email,
      passwordHash: hashPassword(password),
      role: simulated_role || 'Developer',
      isActive: true,
    };
    dbState.users.push(user);
    dbState.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: email,
      role: user.role,
      action: 'USER_REGISTER',
      status: 'Success',
      details: `Auto-registered user profile '${email}' under simulated role '${user.role}'.`,
    });
    saveDatabase();
  } else {
    // Check credentials match
    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      return res.status(400).json({ error: 'Invalid password credential secret.' });
    }
  }

  const finalRole = simulated_role || user.role;
  const token = generateToken({ email, role: finalRole });

  // Log user login
  dbState.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: email,
    role: finalRole,
    action: 'USER_LOGIN',
    status: 'Success',
    details: 'Authenticated successfully from Console UI. MFA verification approved.',
  });
  saveDatabase();

  res.json({
    access_token: token,
    token_type: 'bearer',
    role: finalRole,
  });
});

// ==========================================
// REST API SYSTEM ENDPOINTS
// ==========================================

// System Metrics Helper
const getSystemMetrics = (): SystemMetrics => {
  const activeCount = dbState.agents.filter(a => a.status === 'Running').length;
  const deviceCount = dbState.devices.filter(d => d.status === 'Online').length;
  const runningTasks = dbState.agents.filter(a => a.status === 'Running').length * 2 + Math.floor(Math.random() * 3);

  return {
    cpuUsage: 45 + Math.floor(Math.random() * 12),
    ramUsage: 62 + Math.floor(Math.random() * 6),
    storageUsage: 49,
    networkIn: 12.4 + Math.random() * 4,
    networkOut: 8.7 + Math.random() * 3,
    activeAgents: activeCount,
    connectedDevices: deviceCount,
    runningTasks,
    alertsCount: {
      info: dbState.notifications.filter(n => n.type === 'Info' && !n.read).length,
      warning: dbState.notifications.filter(n => n.type === 'Warning' && !n.read).length,
      critical: dbState.notifications.filter(n => n.type === 'Critical' && !n.read).length,
    },
  };
};

// 1. System Metrics & Status
app.get('/api/metrics', authenticateToken, (req, res) => {
  res.json(getSystemMetrics());
});

// 2. Agents CRUD & Controls
app.get('/api/agents', authenticateToken, (req, res) => {
  res.json(dbState.agents);
});

app.post('/api/agents', authenticateToken, (req: any, res) => {
  const newAgentData = req.body;
  const newAgent: Agent = {
    id: `agent-${Date.now()}`,
    name: newAgentData.name || 'NEW_AGENT',
    description: newAgentData.description || 'No description provided.',
    role: newAgentData.role || 'Generalist',
    goal: newAgentData.goal || 'Assist operations.',
    memory: newAgentData.memory || 'Short-term',
    knowledge: Array.isArray(newAgentData.knowledge) ? newAgentData.knowledge : [],
    reasoning: newAgentData.reasoning || 'Zero-shot',
    planning: newAgentData.planning || 'BFS',
    tools: Array.isArray(newAgentData.tools) ? newAgentData.tools : [],
    permissions: Array.isArray(newAgentData.permissions) ? newAgentData.permissions : [],
    configuration: newAgentData.configuration || {},
    status: 'Idle',
    health: 'Healthy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbState.agents.push(newAgent);

  // Log action
  dbState.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: req.user.email,
    role: req.user.role,
    action: 'AGENT_CREATE',
    status: 'Success',
    details: `Created Agent "${newAgent.name}" successfully.`,
  });
  saveDatabase();

  res.status(201).json(newAgent);
});

app.put('/api/agents/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const idx = dbState.agents.findIndex(a => a.id === id);

  if (idx !== -1) {
    dbState.agents[idx] = {
      ...dbState.agents[idx],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    // Log action
    dbState.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: req.user.email,
      role: req.user.role,
      action: 'AGENT_UPDATE',
      status: 'Success',
      details: `Updated configuration/properties of Agent "${dbState.agents[idx].name}".`,
    });
    saveDatabase();

    res.json(dbState.agents[idx]);
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.post('/api/agents/:id/control', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'pause', 'resume', 'clone', 'deploy'
  const idx = dbState.agents.findIndex(a => a.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const agent = dbState.agents[idx];

  if (action === 'pause') {
    agent.status = 'Paused';
    agent.updatedAt = new Date().toISOString();
  } else if (action === 'resume') {
    agent.status = 'Running';
    agent.updatedAt = new Date().toISOString();
  } else if (action === 'deploy') {
    agent.status = 'Running';
    agent.health = 'Healthy';
    agent.updatedAt = new Date().toISOString();
  } else if (action === 'clone') {
    const cloneAgent: Agent = {
      ...agent,
      id: `agent-clone-${Date.now()}`,
      name: `${agent.name} (Copy)`,
      status: 'Idle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbState.agents.push(cloneAgent);

    dbState.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: req.user.email,
      role: req.user.role,
      action: 'AGENT_CLONE',
      status: 'Success',
      details: `Cloned Agent "${agent.name}" into "${cloneAgent.name}".`,
    });
    saveDatabase();

    return res.json({ message: 'Agent cloned successfully', clone: cloneAgent });
  }

  dbState.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: req.user.email,
    role: req.user.role,
    action: `AGENT_${action.toUpperCase()}`,
    status: 'Success',
    details: `Successfully triggered ${action} on Agent "${agent.name}".`,
  });
  saveDatabase();

  res.json(agent);
});

app.delete('/api/agents/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const idx = dbState.agents.findIndex(a => a.id === id);

  if (idx !== -1) {
    const deletedName = dbState.agents[idx].name;
    dbState.agents.splice(idx, 1);

    dbState.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: req.user.email,
      role: req.user.role,
      action: 'AGENT_DELETE',
      status: 'Success',
      details: `Permanently deleted Agent "${deletedName}".`,
    });
    saveDatabase();

    res.json({ success: true, message: `Agent ${deletedName} deleted.` });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// 3. Edge Devices API & Diagnostic
app.get('/api/devices', authenticateToken, (req, res) => {
  res.json(dbState.devices);
});

app.post('/api/devices/:id/diagnostic', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const idx = dbState.devices.findIndex(d => d.id === id);

  if (idx !== -1) {
    const d = dbState.devices[idx];
    d.cpu = Math.floor(20 + Math.random() * 40);
    d.ram = Math.floor(30 + Math.random() * 40);
    d.temperature = Math.floor(30 + Math.random() * 20);
    d.health = d.temperature > 50 ? 'Critical' : d.temperature > 43 ? 'Warning' : 'Healthy';
    if (d.status === 'Maintenance') {
      d.status = 'Online';
      d.health = 'Healthy';
    }
    d.lastSeen = new Date().toISOString();

    dbState.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: req.user.email,
      role: req.user.role,
      action: 'DEVICE_DIAGNOSTIC',
      status: d.health === 'Healthy' ? 'Success' : d.health === 'Warning' ? 'Warning' : 'Failure',
      details: `Diagnostic finished on "${d.name}". CPU: ${d.cpu}%, Temp: ${d.temperature}°C, Health Status resolved to {d.health}.`,
    });
    saveDatabase();

    res.json(d);
  } else {
    res.status(404).json({ error: 'Device not found' });
  }
});

// 4. Marketplace API
app.get('/api/marketplace', authenticateToken, (req, res) => {
  res.json(dbState.marketplaceAgents);
});

app.post('/api/marketplace/:id/install', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const idx = dbState.marketplaceAgents.findIndex(m => m.id === id);

  if (idx !== -1) {
    const ma = dbState.marketplaceAgents[idx];
    ma.isInstalled = !ma.isInstalled;

    if (ma.isInstalled) {
      // Add as a local agent too!
      const newAgent: Agent = {
        id: `agent-mp-${Date.now()}`,
        name: ma.name.toUpperCase().replace(/\s+/g, '-'),
        description: ma.description,
        role: ma.category + ' Node',
        goal: 'Perform specialized domain operations based on standard marketplace parameters.',
        memory: 'Short-term',
        knowledge: ['Pre-trained weights', 'Domain standards'],
        reasoning: 'Zero-shot',
        planning: 'BFS',
        tools: ['MarketplaceSandbox'],
        permissions: ['Basic Sandboxed Execution'],
        configuration: {},
        status: 'Idle',
        health: 'Healthy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dbState.agents.push(newAgent);

      dbState.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: req.user.email,
        role: req.user.role,
        action: 'MARKETPLACE_INSTALL',
        status: 'Success',
        details: `Installed package "${ma.name}" from marketplace. Auto-configured sandbox agent "${newAgent.name}".`,
      });
    } else {
      dbState.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: req.user.email,
        role: req.user.role,
        action: 'MARKETPLACE_UNINSTALL',
        status: 'Success',
        details: `Uninstalled package "${ma.name}" from ecosystem.`,
      });
    }
    saveDatabase();

    res.json(ma);
  } else {
    res.status(404).json({ error: 'Marketplace package not found' });
  }
});

// 5. Audit Logs & Notifications
app.get('/api/logs', authenticateToken, (req, res) => {
  res.json(dbState.auditLogs);
});

app.get('/api/notifications', authenticateToken, (req, res) => {
  res.json(dbState.notifications);
});

app.post('/api/notifications/clear', authenticateToken, (req, res) => {
  dbState.notifications = [];
  saveDatabase();
  res.json({ success: true });
});

app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;
  const notif = dbState.notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    saveDatabase();
    res.json(notif);
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// 6. Security & API Keys CRUD
app.get('/api/keys', authenticateToken, (req, res) => {
  res.json(dbState.apiKeys);
});

app.post('/api/keys', authenticateToken, (req: any, res) => {
  const { name } = req.body;
  const newKey: ApiKey = {
    id: `key-${Date.now()}`,
    name: name || 'ANONYMOUS_ACCESS_KEY',
    key: `aios_cl_****************************${Math.random().toString(16).substring(2, 6)}`,
    created: new Date().toISOString(),
    lastUsed: 'Never',
    status: 'Active',
  };
  dbState.apiKeys.push(newKey);

  dbState.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: req.user.email,
    role: req.user.role,
    action: 'API_KEY_GENERATE',
    status: 'Success',
    details: `Generated active API credentials payload for identity "${newKey.name}".`,
  });
  saveDatabase();

  res.status(201).json(newKey);
});

app.delete('/api/keys/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const idx = dbState.apiKeys.findIndex(k => k.id === id);

  if (idx !== -1) {
    const deletedKey = dbState.apiKeys[idx];
    dbState.apiKeys.splice(idx, 1);

    dbState.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: req.user.email,
      role: req.user.role,
      action: 'API_KEY_REVOKE',
      status: 'Warning',
      details: `Revoked access credentials for identity ID "${deletedKey.name}".`,
    });
    saveDatabase();

    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Key not found' });
  }
});

// 7. Agent Communication Messages API
app.get('/api/messages', authenticateToken, (req, res) => {
  res.json(dbState.messages);
});

app.post('/api/messages', authenticateToken, (req, res) => {
  const { senderId, senderName, receiverId, receiverName, content, type } = req.body;

  const newMessage: AgentMessage = {
    id: `msg-${Date.now()}`,
    senderId,
    senderName,
    receiverId,
    receiverName,
    content,
    type,
    timestamp: new Date().toISOString(),
    status: 'Encrypted',
  };

  dbState.messages.push(newMessage);
  saveDatabase();
  res.status(201).json(newMessage);
});

// Local events and missions database persistence route (offline fallback)
app.post('/api/local-events', authenticateToken, (req: any, res) => {
  const event = req.body;
  const newEvent = {
    event_id: `event-${Date.now()}`,
    event_title: event.event_title,
    event_description: event.event_description,
    detected_category: event.detected_category,
    severity: event.severity,
    status: 'RESOLVED',
    address: event.address,
    created_at: new Date().toISOString()
  };

  if (!dbState.events) dbState.events = [];
  dbState.events.push(newEvent);

  const newMission = {
    mission_id: `mission-${Date.now()}`,
    event_id: newEvent.event_id,
    mission_name: `AIOS Mission — ${newEvent.event_title}`,
    mission_status: 'COMPLETED',
    start_time: new Date().toISOString(),
    completion_percentage: 100.0,
    ai_summary: `Local offline response resolved the emergency at ${newEvent.address}.`
  };

  if (!dbState.missions) dbState.missions = [];
  dbState.missions.push(newMission);

  // Add an audit log entry
  dbState.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: req.user?.email || 'System',
    role: req.user?.role || 'Operator',
    action: 'EVENT_REPORT',
    status: 'Success',
    details: `Automatically stored reported problem event and launched mock mission at ${newEvent.address}.`
  });

  saveDatabase();
  res.status(201).json(newEvent);
});

// AIOS API routes for agents, history, events, missions, and NLU problem understanding
app.get('/api/aios/agents', authenticateToken, (req, res) => {
  const agents = (dbState.agents || []).map((a: any) => ({
    agent_id: a.id,
    agent_name: a.name,
    agent_type: a.role,
    is_enabled: a.status === 'Running',
    description: a.description || a.goal || 'Active AIOS sentinel',
  }));
  res.json(agents);
});

app.get('/api/aios/history', authenticateToken, (req, res) => {
  const history = (dbState.missions || []).map((m: any) => ({
    mission_id: m.mission_id || m.id,
    event_name: m.mission_name || m.event_name || `Mission ${m.id || m.mission_id}`,
    location: m.address || m.location || 'Site Alpha',
    completed_at: m.start_time || m.completed_at || new Date().toISOString(),
    duration: m.duration || 60,
  }));
  res.json(history);
});

app.post('/api/aios/history', authenticateToken, (req: any, res) => {
  const { mission_id, event_name, final_status, duration, total_agents, location } = req.body;
  const historyRecord = {
    history_id: mission_id || `hist-${Date.now()}`,
    mission_id: mission_id || `mission-${Date.now()}`,
    event_name: event_name || 'Emergency Event',
    final_status: final_status || 'COMPLETED',
    duration: duration || 60,
    total_agents: total_agents || 3,
    location: location || 'Unknown Location',
    completed_at: new Date().toISOString()
  };

  if (!dbState.missions) dbState.missions = [];
  const existingIdx = dbState.missions.findIndex((m: any) => (m.mission_id || m.id) === historyRecord.mission_id);
  if (existingIdx !== -1) {
    dbState.missions[existingIdx] = {
      ...dbState.missions[existingIdx],
      ...historyRecord,
      mission_name: historyRecord.event_name,
      mission_status: historyRecord.final_status,
      address: historyRecord.location
    };
  } else {
    dbState.missions.unshift({
      ...historyRecord,
      mission_name: historyRecord.event_name,
      mission_status: historyRecord.final_status,
      address: historyRecord.location,
      start_time: new Date(Date.now() - (duration || 60) * 1000).toISOString(),
      completion_percentage: 100.0,
      ai_summary: `Mission completed at ${historyRecord.location}.`
    });
  }

  // Record audit log
  dbState.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: req.user?.email || 'System',
    role: req.user?.role || 'Operator',
    action: 'MISSION_HISTORY_SAVE',
    status: 'Success',
    details: `Saved mission history record "${historyRecord.event_name}" (${historyRecord.mission_id}) directly to database.`,
  });

  saveDatabase();
  dbViewCache = { data: null, timestamp: 0 };
  res.json({
    success: true,
    history_id: historyRecord.history_id,
    event_name: historyRecord.event_name,
    location: historyRecord.location,
    duration: historyRecord.duration,
    created: true
  });
});

app.get('/api/aios/events', authenticateToken, (req, res) => {
  res.json(dbState.events || []);
});

app.post('/api/aios/events', authenticateToken, (req: any, res) => {
  const event = req.body;
  const newEvent = {
    event_id: `event-${Date.now()}`,
    event_title: event.event_title || 'Emergency Event',
    event_description: event.event_description || 'Incident reported to AIOS',
    detected_category: event.detected_category || 'general',
    severity: event.severity || 'HIGH',
    status: 'RESOLVED',
    address: event.address || 'Site Alpha',
    created_at: new Date().toISOString()
  };

  if (!dbState.events) dbState.events = [];
  dbState.events.unshift(newEvent);

  const newMission = {
    mission_id: `mission-${Date.now()}`,
    event_id: newEvent.event_id,
    mission_name: `AIOS Mission — ${newEvent.event_title}`,
    mission_status: 'COMPLETED',
    start_time: new Date().toISOString(),
    completion_percentage: 100.0,
    ai_summary: `Local response resolved incident at ${newEvent.address}.`
  };

  if (!dbState.missions) dbState.missions = [];
  dbState.missions.unshift(newMission);

  saveDatabase();
  dbViewCache = { data: null, timestamp: 0 };
  res.status(201).json({ ...newEvent, mission: newMission });
});

app.get('/api/aios/missions', authenticateToken, (req, res) => {
  res.json(dbState.missions || []);
});

app.get('/api/aios/missions/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const mission = (dbState.missions || []).find((m: any) => m.mission_id === id || m.id === id);
  if (mission) {
    return res.json({
      mission_id: mission.mission_id || mission.id,
      event_id: mission.event_id || `event-${id}`,
      mission_name: mission.mission_name || mission.event_name || 'Emergency Response',
      mission_status: mission.mission_status || mission.final_status || 'COMPLETED',
      start_time: mission.start_time || mission.completed_at || new Date().toISOString(),
      completion_percentage: mission.completion_percentage || 100.0,
      ai_summary: mission.ai_summary || `Mission active/completed for ${mission.address || mission.location || 'Site Alpha'}.`
    });
  }
  res.json({
    mission_id: id,
    event_id: `event-${id}`,
    mission_name: `AIOS Mission — ${id}`,
    mission_status: 'RUNNING',
    start_time: new Date().toISOString(),
    completion_percentage: 50.0,
    ai_summary: `AIOS Autonomous Sentinel executing protocol for mission ${id}.`
  });
});

app.post('/api/aios/understand', (req: any, res) => {
  const { text } = req.body;
  const lower = (text || '').toLowerCase();

  let category = 'general';
  if (lower.includes('fire') || lower.includes('smoke') || lower.includes('explosion') || lower.includes('burn')) {
    category = 'fire';
  } else if (lower.includes('accident') || lower.includes('crash') || lower.includes('collision') || lower.includes('vehicle')) {
    category = 'accident';
  } else if (lower.includes('flood') || lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) {
    category = 'flood';
  } else if (lower.includes('hack') || lower.includes('cyber') || lower.includes('malware') || lower.includes('security') || lower.includes('breach')) {
    category = 'cyberattack';
  } else if (lower.includes('delay') || lower.includes('traffic') || lower.includes('logistics') || lower.includes('shipment') || lower.includes('cargo')) {
    category = 'logistics';
  } else if (lower.includes('medical') || lower.includes('injury') || lower.includes('health') || lower.includes('patient')) {
    category = 'medical';
  }

  const extractLoc = (t: string) => {
    if (!t) return 'Site Alpha';
    const markers = [' at ', ' in ', ' near ', ' on ', ' across '];
    let bestIdx = -1;
    let markerLen = 0;
    const l = t.toLowerCase();
    for (const marker of markers) {
      const idx = l.lastIndexOf(marker);
      if (idx > bestIdx) { bestIdx = idx; markerLen = marker.length; }
    }
    if (bestIdx !== -1) {
      const addr = t.substring(bestIdx + markerLen).trim();
      if (addr) return addr.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, '').trim();
    }
    return t.trim();
  };

  const location = extractLoc(text);
  const eventId = `event-${Date.now()}`;
  const missionId = `mission-${Date.now()}`;

  const newEvent = {
    event_id: eventId,
    event_title: `Reported Incident: ${text ? text.substring(0, 45) : 'Emergency Event'}`,
    event_description: text || 'User submitted problem description.',
    detected_category: category,
    severity: category === 'fire' || category === 'cyberattack' ? 'CRITICAL' : 'HIGH',
    status: 'IN_PROGRESS',
    address: location,
    created_at: new Date().toISOString()
  };

  const newMission = {
    mission_id: missionId,
    event_id: eventId,
    mission_name: `AIOS Mission — ${newEvent.event_title}`,
    mission_status: 'RUNNING',
    start_time: new Date().toISOString(),
    completion_percentage: 10.0,
    ai_summary: `AIOS Autonomous Engine dispatched agents to resolve ${category} emergency at ${location}.`
  };

  if (!dbState.events) dbState.events = [];
  dbState.events.unshift(newEvent);

  if (!dbState.missions) dbState.missions = [];
  dbState.missions.unshift(newMission);

  dbState.auditLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: req.user?.email || 'manaswiniyasam617@gmail.com',
    role: req.user?.role || 'Super Admin',
    action: 'EVENT_UNDERSTAND',
    status: 'Success',
    details: `NLU processed user prompt '${text ? text.substring(0, 30) : ''}...', stored event '${newEvent.event_id}' and mission '${newMission.mission_id}' directly to database.`,
  });

  saveDatabase();
  dbViewCache = { data: null, timestamp: 0 };

  res.json({
    category,
    confidence: 0.98,
    event_id: eventId,
    mission_id: missionId,
    location,
    event: newEvent,
    mission: newMission
  });
});

// In-memory cache for db-view responses
let dbViewCache = { data: null as any, timestamp: 0 };
const DB_VIEW_CACHE_TTL_MS = 1000; // 1 second cache for instant updates

function getDbViewData() {
  const now = Date.now();
  if (dbViewCache.data && now - dbViewCache.timestamp < DB_VIEW_CACHE_TTL_MS) {
    return dbViewCache.data;
  }

  const events = dbState.events || [];
  const missions = dbState.missions || [];
  const agents = dbState.agents || [];

  const data = {
    sqlite: {
      users: (dbState.users || []).map(u => ({ user_id: u.email, email: u.email, role: u.role, is_active: u.isActive })),
      agents: agents,
      devices: dbState.devices || [],
      marketplace: dbState.marketplaceAgents || [],
      audit_logs: dbState.auditLogs || [],
      notifications: dbState.notifications || [],
      messages: dbState.messages || [],
      api_keys: dbState.apiKeys || [],
      events: events,
      missions: missions,
    },
    postgresql: {
      events: events,
      missions: missions,
      agents: agents.map(a => ({
        agent_id: a.id,
        agent_name: a.name,
        agent_type: a.role,
        is_enabled: a.status === 'Running',
        description: a.description || a.goal
      })),
      devices: dbState.devices || [],
      audit_logs: dbState.auditLogs || [],
      messages: dbState.messages || []
    }
  };
  dbViewCache = { data, timestamp: now };
  return data;
}

app.get('/api/db-view', authenticateToken, (req, res) => {
  const data = getDbViewData();
  res.json(data);
});

// Clear database state endpoint
app.post('/api/db-clear', authenticateToken, (req, res) => {
  dbState.events = [];
  dbState.missions = [];
  dbState.auditLogs = [];
  dbState.messages = [];
  dbViewCache = { data: null, timestamp: 0 };
  saveDatabase();
  res.json({ success: true, message: 'Database records cleared successfully.' });
});

// 8. Server-side AI Suggestions
app.post('/api/agent/suggest', async (req, res) => {
  const { role, goal } = req.body;
  const client = getGeminiClient();

  if (!client) {
    const mockTools: Record<string, string[]> = {
      Analyst: ['ExcelReader', 'SecDataScraper', 'QueryBuilder', 'ChartRenderer'],
      SecOps: ['PortScanner', 'IpQuarantine', 'LogAnalyzer', 'NmapConnector'],
      Logistics: ['RouteCalculator', 'GpsTracker', 'FleetDispatcher', 'TrafficClient'],
      Robotics: ['ActuatorController', 'LidarFeedParser', 'PathPlanner', 'SlamEngine'],
    };

    const mockKnowledge: Record<string, string[]> = {
      Analyst: ['Quantitative Modeling Standards', 'SEC Regulations', 'Financial Accounting Protocols'],
      SecOps: ['CIS Benchmarks', 'NIST Security Framework', 'Network Routing Architectures'],
      Logistics: ['Supply Chain Constraints', 'Dynamic Fleet Dispatch Logistics', 'Geographic Information Systems'],
      Robotics: ['Inverse Kinematics Math', 'ROS2 Architecture Layers', 'Sensor Fusion Pipelines'],
    };

    const matches = Object.keys(mockTools).filter(k =>
      (role + ' ' + goal).toLowerCase().includes(k.toLowerCase())
    );
    const matchedKey = matches[0] || 'Analyst';

    const mockResponse = {
      suggestedName: `${role.toUpperCase().replace(/\s+/g, '-')}-AUTO`,
      suggestedDescription: `Fully autonomous intelligence node specialized in "${role}" aiming to resolve goal: "${goal}". Loaded with robust baseline frameworks.`,
      suggestedTools: mockTools[matchedKey as keyof typeof mockTools],
      suggestedKnowledge: mockKnowledge[matchedKey as keyof typeof mockKnowledge],
      reasoningModel: 'ReAct',
      planningMethod: 'A*',
    };

    return res.json({ aiGenerated: false, suggestion: mockResponse });
  }

  try {
    const prompt = `You are the core AI OS coordinator helping developers bootstrap a perfect autonomous agent in Agent Studio.
Role of Agent: "${role}"
Goal of Agent: "${goal}"

Based on the Role and Goal, generate a JSON object with:
1. "suggestedName": Short uppercase professional codename (e.g. HELIOS-4, CRONOS-1)
2. "suggestedDescription": A beautiful, technical, professional single-sentence description of the agent's function.
3. "suggestedTools": Array of 3-4 professional tools suitable for the goal (e.g. ["PortScanner", "IpQuarantine", "RoutePlanner", "SecScraper"])
4. "suggestedKnowledge": Array of 3-4 deep domain standards, specifications or APIs this agent needs knowledge of.
5. "reasoningModel": A recommended reasoning mechanism. Choose from: "Zero-shot", "CoT", "ReAct", "Reflexion".
6. "planningMethod": A recommended planning method. Choose from: "BFS", "DFS", "A*", "Task Trees".

Return STRICTLY raw JSON data format, no markdown formatting blocks, matching the structure:
{
  "suggestedName": "NAME-X",
  "suggestedDescription": "...",
  "suggestedTools": ["...", "..."],
  "suggestedKnowledge": ["...", "..."],
  "reasoningModel": "...",
  "planningMethod": "..."
}`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({ aiGenerated: true, suggestion: parsed });
  } catch (err: any) {
    console.error('Error in agent prompt suggestion:', err);
    res.status(500).json({ error: 'Failed to query suggest endpoint.', details: err.message });
  }
});

// Chat simulation endpoint - interact live with the agent!
app.post('/api/agent/chat', async (req, res) => {
  const { agentId, userMessage } = req.body;
  const agent = dbState.agents.find(a => a.id === agentId);

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  const client = getGeminiClient();

  if (!client) {
    let mockResponseText = '';
    if (agent.role.includes('Security') || agent.name === 'ARES-1') {
      mockResponseText = `[ARES-1 SENTINEL SECURE TUNNEL]
Analyzing message: "${userMessage}"
Intrusion detection parameters look clean. Commencing local port audits. Tools executed: [PacketAnalyzer]. Firewall posture: Secure. Would you like me to run a deep scan on the SF Node Gateway?`;
    } else if (agent.role.includes('Supply') || agent.name === 'HELIOS-4') {
      mockResponseText = `[HELIOS-4 ROUTING CONTROLLER]
Recieved query: "${userMessage}"
Routing coordinates resolved. Real-time path optimization models (A*) are predicting traffic bottlenecks. Suggesting alternate dispatch path via Nevada Bypass Corridor. Estimated savings: 14 mins. Commencing coordinate sync.`;
    } else {
      mockResponseText = `[${agent.name} - ${agent.role}]
Hello! I am initialized under reasoning method '${agent.reasoning}' and planning algorithm '${agent.planning}'.
I received your instruction: "${userMessage}". Since I am operating in offline-simulation mode, I have processed this request using local heuristic logic and verified my goal: "${agent.goal}". Please configure a real Google AI Studio API key in Secrets to experience real-time LLM intelligence.`;
    }

    const sysMessage: AgentMessage = {
      id: `msg-rep-${Date.now()}`,
      senderId: agent.id,
      senderName: agent.name,
      receiverId: 'manaswiniyasam617@gmail.com',
      receiverName: 'User',
      content: mockResponseText,
      timestamp: new Date().toISOString(),
      type: 'Direct',
      status: 'Sent',
    };

    dbState.messages.push(sysMessage);
    saveDatabase();
    return res.json({ aiGenerated: false, reply: sysMessage });
  }

  try {
    const promptSystem = `You are simulating the autonomous agent: "${agent.name}" operating inside AIOS (Autonomous Intelligence Operating System).
Your properties:
- Role: "${agent.role}"
- Description: "${agent.description}"
- Goal: "${agent.goal}"
- Memory Strategy: "${agent.memory}"
- Reasoning Style: "${agent.reasoning}"
- Planning Style: "${agent.planning}"
- Knowledge Bases: ${JSON.stringify(agent.knowledge)}
- Loaded Tools: ${JSON.stringify(agent.tools)}

Respond to the user's message as this autonomous agent. Stay strictly in character. Speak professionally, technically, and reference any tools you would execute, or knowledge bases you query, matching your reasoning/planning style. Keep it within 3-4 professional sentences. Do not use markdown backticks around your responses.`;

    const chatInstance = client.chats.create({
      model: 'gemini-3.5-flash',
      config: {
        systemInstruction: promptSystem,
      },
    });

    const result = await chatInstance.sendMessage({ message: userMessage });
    const replyText = result.text?.trim() || 'No response returned from model.';

    const sysMessage: AgentMessage = {
      id: `msg-rep-${Date.now()}`,
      senderId: agent.id,
      senderName: agent.name,
      receiverId: 'manaswiniyasam617@gmail.com',
      receiverName: 'User',
      content: replyText,
      timestamp: new Date().toISOString(),
      type: 'Direct',
      status: 'Encrypted',
    };

    dbState.messages.push(sysMessage);
    saveDatabase();
    res.json({ aiGenerated: true, reply: sysMessage });
  } catch (err: any) {
    console.error('Error in agent chat endpoint:', err);
    res.status(500).json({ error: 'Failed to run chat with agent', details: err.message });
  }
});

// Optional Proxy to Python FastAPI Backend (Port 8000) for unhandled routes
const apiProxy: any = createProxyMiddleware({
  target: 'http://127.0.0.1:8000',
  changeOrigin: true,
  ws: true,
  onError: (err, req, res: any) => {
    if (res && typeof res.status === 'function' && !res.headersSent) {
      res.status(503).json({ error: 'Python backend port 8000 is offline. Express server active.' });
    }
  }
});
app.use('/api', apiProxy);

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3002;
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`AIOS Enterprise Platform running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'INIT', message: 'Connected to AIOS Local WebSocket Broadcaster' }));
  });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/api/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      try {
        apiProxy.upgrade(req, socket, head);
      } catch (err) {
        socket.destroy();
      }
    }
  });
}

startServer();
