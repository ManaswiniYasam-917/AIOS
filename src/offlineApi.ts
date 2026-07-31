import {
  Agent,
  EdgeDevice,
  MarketplaceAgent,
  AuditLog,
  SystemMetrics,
  Notification,
  AgentMessage,
  ApiKey,
  UserRole
} from './types';

// ==========================================
// OFFLINE PASSWORD HASHING & TOKEN UTILS
// ==========================================

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return 'offline_hash_' + hash;
}

function generateToken(payload: { email: string; role: string }): string {
  try {
    const serialized = JSON.stringify(payload);
    const base64 = btoa(unescape(encodeURIComponent(serialized)));
    return base64 + '.offline_simulated_signature';
  } catch (err) {
    return 'invalid_token';
  }
}

function verifyToken(token: string): { email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const serialized = decodeURIComponent(escape(atob(parts[0])));
    return JSON.parse(serialized);
  } catch (err) {}
  return null;
}

// ==========================================
// PERSISTENT LOCAL STORAGE STATE
// ==========================================

const LOCAL_STORAGE_KEY = 'aios_offline_db';

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
}

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
};

function loadDatabase(): DatabaseState {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to parse aios_offline_db, fallback to defaultState');
    }
  }
  saveDatabase(defaultState);
  return defaultState;
}

function saveDatabase(state: DatabaseState) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}

// Global active in-memory db state
let dbState = loadDatabase();

// ==========================================
// SYSTEM METRICS HELPER
// ==========================================

const getSystemMetrics = (): SystemMetrics => {
  const activeCount = dbState.agents.filter(a => a.status === 'Running').length;
  const deviceCount = dbState.devices.filter(d => d.status === 'Online').length;
  const runningTasks = dbState.agents.filter(a => a.status === 'Running').length * 2 + Math.floor(Math.random() * 3);

  return {
    cpuUsage: 45 + Math.floor(Math.random() * 12),
    ramUsage: 62 + Math.floor(Math.random() * 6),
    storageUsage: 49,
    networkIn: +(12.4 + Math.random() * 4).toFixed(1),
    networkOut: +(8.7 + Math.random() * 3).toFixed(1),
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

// ==========================================
// INTERCEPTED FETCH API GATEWAY
// ==========================================

const originalFetch = window.fetch;

window.fetch = async function (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : (input as any).url || input.toString();

  // Only intercept /api/ calls
  if (!urlStr.includes('/api/')) {
    return originalFetch.apply(this, [input, init]);
  }

  // Parse path and method
  const method = (init?.method || 'GET').toUpperCase();
  const body = init?.body ? (typeof init.body === 'string' ? JSON.parse(init.body) : init.body) : null;
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname;

  // Retrieve auth headers
  const authHeader = init?.headers ? (init.headers as Record<string, string>)['Authorization'] : undefined;
  const token = authHeader && authHeader.split(' ')[1];
  let currentUser = { email: 'manaswiniyasam617@gmail.com', role: 'Super Admin' };

  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      currentUser = verified;
    }
  }

  // Helper response builders
  const jsonResponse = (data: any, status = 200) => {
    return Promise.resolve(
      new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  };

  const errorResponse = (error: string, status = 400) => {
    return Promise.resolve(
      new Response(JSON.stringify({ error }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  };

  // Re-read DB from localStorage for every request to simulate real DB consistency
  dbState = loadDatabase();

  try {
    // ----------------------------------------
    // AUTHENTICATION ROUTES
    // ----------------------------------------
    if (path === '/api/auth/signup' && method === 'POST') {
      const { email, password, role } = body || {};
      if (!email || !password) {
        return errorResponse('Missing email or password credentials.', 400);
      }
      const existing = dbState.users.find(u => u.email === email);
      if (existing) {
        return errorResponse('Email profile already exists.', 400);
      }
      const newUser = {
        email,
        passwordHash: hashPassword(password),
        role: role || 'Developer',
        isActive: true,
      };
      dbState.users.push(newUser);
      saveDatabase(dbState);
      return jsonResponse({ success: true, message: 'User registered.' });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password, simulated_role } = body || {};
      if (!email || !password) {
        return errorResponse('Missing email or password.', 400);
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
      } else {
        const hashed = hashPassword(password);
        if (user.passwordHash !== hashed && password !== '********') {
          return errorResponse('Invalid password credential secret.', 400);
        }
      }

      const finalRole = simulated_role || user.role;
      const accessToken = generateToken({ email, role: finalRole });

      dbState.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: email,
        role: finalRole,
        action: 'USER_LOGIN',
        status: 'Success',
        details: 'Authenticated successfully from Console UI. MFA verification approved.',
      });
      saveDatabase(dbState);

      return jsonResponse({
        access_token: accessToken,
        token_type: 'bearer',
        role: finalRole,
      });
    }

    // ----------------------------------------
    // SYSTEM METRICS & STATUS
    // ----------------------------------------
    if (path === '/api/metrics' && method === 'GET') {
      return jsonResponse(getSystemMetrics());
    }

    // ----------------------------------------
    // AGENTS CRUD & CONTROLS
    // ----------------------------------------
    if (path === '/api/agents') {
      if (method === 'GET') {
        return jsonResponse(dbState.agents);
      }
      if (method === 'POST') {
        const newAgentData = body || {};
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
        dbState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser.email,
          role: currentUser.role,
          action: 'AGENT_CREATE',
          status: 'Success',
          details: `Created Agent "${newAgent.name}" successfully.`,
        });
        saveDatabase(dbState);
        return jsonResponse(newAgent, 201);
      }
    }

    // Individual agent control: /api/agents/:id/control
    const controlMatch = path.match(/^\/api\/agents\/([^/]+)\/control$/);
    if (controlMatch && method === 'POST') {
      const agentId = controlMatch[1];
      const { action } = body || {};
      const idx = dbState.agents.findIndex(a => a.id === agentId);

      if (idx === -1) {
        return errorResponse('Agent not found', 404);
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
          user: currentUser.email,
          role: currentUser.role,
          action: 'AGENT_CLONE',
          status: 'Success',
          details: `Cloned Agent "${agent.name}" into "${cloneAgent.name}".`,
        });
        saveDatabase(dbState);
        return jsonResponse({ message: 'Agent cloned successfully', clone: cloneAgent });
      }

      dbState.auditLogs.unshift({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: currentUser.email,
        role: currentUser.role,
        action: `AGENT_${action.toUpperCase()}`,
        status: 'Success',
        details: `Successfully triggered ${action} on Agent "${agent.name}".`,
      });
      saveDatabase(dbState);
      return jsonResponse(agent);
    }

    // Individual agent update & delete: /api/agents/:id
    const agentMatch = path.match(/^\/api\/agents\/([^/]+)$/);
    if (agentMatch) {
      const agentId = agentMatch[1];
      const idx = dbState.agents.findIndex(a => a.id === agentId);

      if (idx === -1) {
        return errorResponse('Agent not found', 404);
      }

      if (method === 'PUT') {
        dbState.agents[idx] = {
          ...dbState.agents[idx],
          ...(body || {}),
          updatedAt: new Date().toISOString(),
        };

        dbState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser.email,
          role: currentUser.role,
          action: 'AGENT_UPDATE',
          status: 'Success',
          details: `Updated configuration/properties of Agent "${dbState.agents[idx].name}".`,
        });
        saveDatabase(dbState);
        return jsonResponse(dbState.agents[idx]);
      }

      if (method === 'DELETE') {
        const deletedName = dbState.agents[idx].name;
        dbState.agents.splice(idx, 1);

        dbState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser.email,
          role: currentUser.role,
          action: 'AGENT_DELETE',
          status: 'Success',
          details: `Permanently deleted Agent "${deletedName}".`,
        });
        saveDatabase(dbState);
        return jsonResponse({ success: true, message: `Agent ${deletedName} deleted.` });
      }
    }

    // ----------------------------------------
    // EDGE DEVICES
    // ----------------------------------------
    if (path === '/api/devices' && method === 'GET') {
      return jsonResponse(dbState.devices);
    }

    const devDiagnosticMatch = path.match(/^\/api\/devices\/([^/]+)\/diagnostic$/);
    if (devDiagnosticMatch && method === 'POST') {
      const devId = devDiagnosticMatch[1];
      const idx = dbState.devices.findIndex(d => d.id === devId);

      if (idx === -1) {
        return errorResponse('Device not found', 404);
      }

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
        user: currentUser.email,
        role: currentUser.role,
        action: 'DEVICE_DIAGNOSTIC',
        status: d.health === 'Healthy' ? 'Success' : d.health === 'Warning' ? 'Warning' : 'Failure',
        details: `Diagnostic finished on "${d.name}". CPU: ${d.cpu}%, Temp: ${d.temperature}°C, Health Status resolved to ${d.health}.`,
      });
      saveDatabase(dbState);
      return jsonResponse(d);
    }

    // ----------------------------------------
    // MARKETPLACE
    // ----------------------------------------
    if (path === '/api/marketplace' && method === 'GET') {
      return jsonResponse(dbState.marketplaceAgents);
    }

    const mpInstallMatch = path.match(/^\/api\/marketplace\/([^/]+)\/install$/);
    if (mpInstallMatch && method === 'POST') {
      const mpId = mpInstallMatch[1];
      const idx = dbState.marketplaceAgents.findIndex(m => m.id === mpId);

      if (idx === -1) {
        return errorResponse('Marketplace package not found', 404);
      }

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
          user: currentUser.email,
          role: currentUser.role,
          action: 'MARKETPLACE_INSTALL',
          status: 'Success',
          details: `Installed package "${ma.name}" from marketplace. Auto-configured sandbox agent "${newAgent.name}".`,
        });
      } else {
        dbState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser.email,
          role: currentUser.role,
          action: 'MARKETPLACE_UNINSTALL',
          status: 'Success',
          details: `Uninstalled package "${ma.name}" from ecosystem.`,
        });
      }
      saveDatabase(dbState);
      return jsonResponse(ma);
    }

    // ----------------------------------------
    // AUDIT LOGS & NOTIFICATIONS
    // ----------------------------------------
    if (path === '/api/logs' && method === 'GET') {
      return jsonResponse(dbState.auditLogs);
    }

    if (path === '/api/notifications' && method === 'GET') {
      return jsonResponse(dbState.notifications);
    }

    if (path === '/api/notifications/clear' && method === 'POST') {
      dbState.notifications = [];
      saveDatabase(dbState);
      return jsonResponse({ success: true });
    }

    const notifReadMatch = path.match(/^\/api\/notifications\/([^/]+)\/read$/);
    if (notifReadMatch && method === 'POST') {
      const notifId = notifReadMatch[1];
      const notif = dbState.notifications.find(n => n.id === notifId);
      if (notif) {
        notif.read = true;
        saveDatabase(dbState);
        return jsonResponse(notif);
      } else {
        return errorResponse('Notification not found', 404);
      }
    }

    // ----------------------------------------
    // SECURITY & API KEYS
    // ----------------------------------------
    if (path === '/api/keys') {
      if (method === 'GET') {
        return jsonResponse(dbState.apiKeys);
      }
      if (method === 'POST') {
        const { name } = body || {};
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
          user: currentUser.email,
          role: currentUser.role,
          action: 'API_KEY_GENERATE',
          status: 'Success',
          details: `Generated active API credentials payload for identity "${newKey.name}".`,
        });
        saveDatabase(dbState);
        return jsonResponse(newKey, 201);
      }
    }

    const keyDeleteMatch = path.match(/^\/api\/keys\/([^/]+)$/);
    if (keyDeleteMatch && method === 'DELETE') {
      const keyId = keyDeleteMatch[1];
      const idx = dbState.apiKeys.findIndex(k => k.id === keyId);

      if (idx !== -1) {
        const deletedKey = dbState.apiKeys[idx];
        dbState.apiKeys.splice(idx, 1);

        dbState.auditLogs.unshift({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser.email,
          role: currentUser.role,
          action: 'API_KEY_REVOKE',
          status: 'Warning',
          details: `Revoked access credentials for identity ID "${deletedKey.name}".`,
        });
        saveDatabase(dbState);
        return jsonResponse({ success: true });
      } else {
        return errorResponse('Key not found', 404);
      }
    }

    // ----------------------------------------
    // AGENT MESSAGES
    // ----------------------------------------
    if (path === '/api/messages') {
      if (method === 'GET') {
        return jsonResponse(dbState.messages);
      }
      if (method === 'POST') {
        const { senderId, senderName, receiverId, receiverName, content, type } = body || {};
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
        saveDatabase(dbState);
        return jsonResponse(newMessage, 201);
      }
    }

    // ----------------------------------------
    // SERVER-SIDE AI SUGGESTIONS
    // ----------------------------------------
    if (path === '/api/agent/suggest' && method === 'POST') {
      const { role, goal } = body || {};

      // If user provided a Gemini API key in local storage, we can make a direct call to the real model!
      const userGeminiApiKey = localStorage.getItem('gemini_api_key');
      if (userGeminiApiKey && userGeminiApiKey !== 'MY_GEMINI_API_KEY') {
        try {
          const prompt = `You are the core AI OS coordinator helping developers bootstrap a perfect autonomous agent in Agent Studio.
Role of Agent: "${role}"
Goal of Agent: "${goal}"

Based on the Role and Goal, generate a JSON object with:
1. "suggestedName": Short uppercase professional codename (e.g. HELIOS-4, CRONOS-1)
2. "suggestedDescription": A beautiful, technical, professional single-sentence description of the agent's function.
3. "suggestedTools": Array of 3-4 professional tools suitable for the goal (e.g. ["PortScanner", "IpQuarantine", "RoutePlanner", "SecScraper"])
4. "suggestedKnowledge": Array of 3-4 professional domain standards, specifications or APIs this agent needs knowledge of.
5. "reasoningModel": A recommended reasoning mechanism. Choose from: "Zero-shot", "CoT", "ReAct", "Reflexion".
6. "planningMethod": A recommended planning method. Choose from: "BFS", "DFS", "A*", "Task Trees".

Return STRICTLY raw JSON data format, matching the structure:
{
  "suggestedName": "NAME-X",
  "suggestedDescription": "...",
  "suggestedTools": ["...", "..."],
  "suggestedKnowledge": ["...", "..."],
  "reasoningModel": "...",
  "planningMethod": "..."
}`;
          const geminiRes = await originalFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userGeminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json'
              }
            })
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const textResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = JSON.parse(textResponse?.trim() || '{}');
            return jsonResponse({ aiGenerated: true, suggestion: parsed });
          }
        } catch (err) {
          console.error('Direct browser Gemini suggest error, falling back to simulated logic:', err);
        }
      }

      // Offline baseline simulated logic
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

      const searchContext = (role + ' ' + goal).toLowerCase();
      let matchedKey = 'Analyst';
      if (searchContext.includes('security') || searchContext.includes('secops') || searchContext.includes('intrusion')) {
        matchedKey = 'SecOps';
      } else if (searchContext.includes('route') || searchContext.includes('logistic') || searchContext.includes('fleet')) {
        matchedKey = 'Logistics';
      } else if (searchContext.includes('robot') || searchContext.includes('drone') || searchContext.includes('uav')) {
        matchedKey = 'Robotics';
      }

      const mockResponse = {
        suggestedName: `${role.toUpperCase().replace(/\s+/g, '-')}-AUTO`,
        suggestedDescription: `Fully autonomous intelligence node specialized in "${role}" aiming to resolve goal: "${goal}". Loaded with robust baseline frameworks.`,
        suggestedTools: mockTools[matchedKey],
        suggestedKnowledge: mockKnowledge[matchedKey],
        reasoningModel: 'ReAct',
        planningMethod: 'A*',
      };

      return jsonResponse({ aiGenerated: false, suggestion: mockResponse });
    }

    // ----------------------------------------
    // CHAT SIMULATION ENDPOINT
    // ----------------------------------------
    if (path === '/api/agent/chat' && method === 'POST') {
      const { agentId, userMessage } = body || {};
      const agent = dbState.agents.find(a => a.id === agentId);

      if (!agent) {
        return errorResponse('Agent not found', 404);
      }

      const userGeminiApiKey = localStorage.getItem('gemini_api_key');
      if (userGeminiApiKey && userGeminiApiKey !== 'MY_GEMINI_API_KEY') {
        try {
          const systemInstruction = `You are simulating the autonomous agent: "${agent.name}" operating inside AIOS (Autonomous Intelligence Operating System).
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

          const geminiRes = await originalFetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userGeminiApiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                { role: 'user', parts: [{ text: userMessage }] }
              ],
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              generationConfig: {
                maxOutputTokens: 200
              }
            })
          });

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json();
            const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Acknowledged loop.';

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
            saveDatabase(dbState);

            return jsonResponse({ aiGenerated: true, reply: sysMessage });
          }
        } catch (err) {
          console.error('Direct browser Gemini chat error, falling back to simulated logic:', err);
        }
      }

      // Offline baseline simulated logic
      let mockResponseText = '';
      if (agent.role.includes('Security') || agent.name === 'ARES-1') {
        mockResponseText = `[ARES-1 SENTINEL SECURE TUNNEL]
Analyzing message: "${userMessage}"
Intrusion detection parameters look clean. Commencing local port audits. Tools executed: [PacketAnalyzer]. Firewall posture: Secure. Would you like me to run a deep scan on the SF Node Gateway?`;
      } else if (agent.role.includes('Supply') || agent.name === 'HELIOS-4') {
        mockResponseText = `[HELIOS-4 ROUTING CONTROLLER]
Received query: "${userMessage}"
Routing coordinates resolved. Real-time path optimization models (A*) are predicting traffic bottlenecks. Suggesting alternate dispatch path via Nevada Bypass Corridor. Estimated savings: 14 mins. Commencing coordinate sync.`;
      } else {
        mockResponseText = `[${agent.name} - ${agent.role}]
Hello! I am initialized under reasoning method '${agent.reasoning}' and planning algorithm '${agent.planning}'.
I received your instruction: "${userMessage}". Since I am operating in offline-simulation mode, I have processed this request using local heuristic logic and verified my goal: "${agent.goal}". Please configure a real Google AI Studio API key in Secrets/Settings to experience real-time LLM intelligence.`;
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
      saveDatabase(dbState);

      return jsonResponse({ aiGenerated: false, reply: sysMessage });
    }

    return errorResponse(`Offline simulated endpoint not implemented: ${path}`, 501);
  } catch (err: any) {
    console.error('Offline interceptor failed handling url:', urlStr, err);
    return errorResponse(`Offline interceptor error: ${err.message}`, 500);
  }
};

console.log('AIOS Enterprise offline API fetch interceptor loaded successfully.');
