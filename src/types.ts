export type UserRole =
  | 'Super Admin'
  | 'Organization Admin'
  | 'Developer'
  | 'Operator'
  | 'Viewer'
  | 'Guest';

export interface RolePermissions {
  canCreateAgent: boolean;
  canDeployAgent: boolean;
  canConfigureAgent: boolean;
  canDeleteAgent: boolean;
  canControlDevices: boolean;
  canAccessApiKeys: boolean;
  canModifySecurity: boolean;
  canAccessAuditLogs: boolean;
}

export type AgentStatus = 'Running' | 'Paused' | 'Failed' | 'Idle';
export type AgentHealth = 'Healthy' | 'Warning' | 'Critical';

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  goal: string;
  memory: 'Short-term' | 'Long-term' | 'Hybrid' | 'Vector DB';
  knowledge: string[];
  reasoning: 'Zero-shot' | 'CoT' | 'ReAct' | 'Reflexion';
  planning: 'BFS' | 'DFS' | 'A*' | 'Task Trees';
  tools: string[];
  permissions: string[];
  configuration: Record<string, string>;
  status: AgentStatus;
  health: AgentHealth;
  createdAt: string;
  updatedAt: string;
}

export type DeviceType =
  | 'Jetson'
  | 'Raspberry Pi'
  | 'ESP32'
  | 'Robot'
  | 'Drone'
  | 'Vehicle'
  | 'Industrial Camera'
  | 'IoT Sensor';

export type DeviceStatus = 'Online' | 'Offline' | 'Maintenance';

export interface EdgeDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  cpu: number; // percentage
  ram: number; // percentage
  battery: number; // percentage, null if plugged in
  storage: number; // percentage
  temperature: number; // celsius
  health: 'Healthy' | 'Warning' | 'Critical';
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  lastSeen: string;
}

export interface MarketplaceAgent {
  id: string;
  name: string;
  description: string;
  category: 'Assistant' | 'Data Science' | 'Robotics' | 'DevOps' | 'Vision' | 'NLP';
  rating: number;
  installs: number;
  developer: string;
  version: string;
  isInstalled: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  status: 'Success' | 'Failure' | 'Warning';
  details: string;
}

export interface SystemMetrics {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
  networkIn: number; // MB/s
  networkOut: number; // MB/s
  activeAgents: number;
  connectedDevices: number;
  runningTasks: number;
  alertsCount: {
    info: number;
    warning: number;
    critical: number;
  };
}

export type NotificationType = 'Info' | 'Warning' | 'Critical' | 'System' | 'Security' | 'Deployment';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface AgentMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // 'All' for Broadcast
  receiverName: string;
  content: string;
  timestamp: string;
  type: 'Direct' | 'Broadcast' | 'TaskSharing' | 'KnowledgeSharing' | 'Heartbeat';
  status: 'Sent' | 'Delivered' | 'Read' | 'Encrypted';
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
}
