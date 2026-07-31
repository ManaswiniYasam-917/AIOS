import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { EventConfig, classifyEvent, EVENT_CONFIGS } from '../eventEngine';
import { fetchWithAuth } from './fetchWithAuth';
export { fetchWithAuth } from './fetchWithAuth';

function extractAddress(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const markers = [' at ', ' in ', ' near ', ' on ', ' across '];
  let bestIdx = -1;
  let markerLen = 0;
  
  for (const marker of markers) {
    const idx = lower.lastIndexOf(marker);
    if (idx > bestIdx) {
      bestIdx = idx;
      markerLen = marker.length;
    }
  }
  
  if (bestIdx !== -1) {
    const address = text.substring(bestIdx + markerLen).trim();
    if (address) {
      return address.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, '').trim();
    }
  }
  return text.trim();
}

/**
 * Types representing core entities of AIOS.
 */
export interface EventData {
  id: string;
  type: string; // e.g., 'accident', 'fire', 'flood', etc.
  location: string;
  severity: number; // 0‑100 scale
  timestamp: number; // epoch ms
}

export interface Mission {
  id: string;
  eventId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number; // 0‑100
  etaSeconds?: number;
  outcome?: string;
}

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'error';
  currentAction?: string;
  progress?: number;
  etaSeconds?: number;
}

export interface CompletedMission {
  id: string;
  eventTitle: string;
  eventIcon: string;
  location: string;
  startedAt: number; // epoch ms
  completedAt: number; // epoch ms
  durationMin: number;
  resolvedBy?: string[]; // agent names
  configId: string;
}

/**
 * Context shape exposed to the rest of the application.
 */
interface AIOSContextProps {
  events: EventData[];
  missions: Mission[];
  agents: AgentStatus[];
  activeEventConfig: EventConfig | null;
  setActiveEventConfig: (config: EventConfig | null) => void;
  activeMissionId: string | null;
  activeEventId: string | null;
  completedMissions: CompletedMission[];
  addCompletedMission: (mission: CompletedMission) => void;
  saveMissionToHistory: (missionId: string, overrides?: Partial<{
    eventTitle: string;
    location: string;
    duration: number;
    totalAgents: number;
  }>) => Promise<void>;
  addEvent: (event: EventData) => Promise<{ success: boolean; eventId?: string; missionId?: string }>;
  startMissionForEvent: (eventId: string) => void;
  updateAgentStatus: (agent: AgentStatus) => void;
  refreshData: () => Promise<void>;
  restoreMissionState: (missionId: string) => Promise<void>;
  clearActiveMission: () => void;
}

const AIOSContext = createContext<AIOSContextProps | undefined>(undefined);

const LOCAL_CONFIG_KEY = 'aios_active_event_config';
const LOCAL_MISSION_ID_KEY = 'aios_active_mission_id';
const LOCAL_EVENT_ID_KEY = 'aios_active_event_id';

export const AIOSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [agents, setAgents] = useState<AgentStatus[]>([]);

  // Restore initial active event config from localStorage if present
  const [activeEventConfig, setActiveEventConfigState] = useState<EventConfig | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CONFIG_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeMissionId, setActiveMissionId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_MISSION_ID_KEY) || null;
  });

  const [activeEventId, setActiveEventId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_EVENT_ID_KEY) || null;
  });

  const [completedMissions, setCompletedMissions] = useState<CompletedMission[]>([]);

  // Ref to always have the latest activeEventConfig inside WebSocket closures
  const activeEventConfigRef = useRef<EventConfig | null>(activeEventConfig);
  useEffect(() => {
    activeEventConfigRef.current = activeEventConfig;
  }, [activeEventConfig]);


  // Wrapper for setting activeEventConfig that persists to localStorage
  const setActiveEventConfig = (config: EventConfig | null) => {
    setActiveEventConfigState(config);
    if (config) {
      try {
        localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
      } catch (err) {
        console.error('[AIOS Context] Failed to persist activeEventConfig:', err);
      }
    } else {
      localStorage.removeItem(LOCAL_CONFIG_KEY);
    }
  };

  const clearActiveMission = () => {
    setActiveEventConfigState(null);
    setActiveMissionId(null);
    setActiveEventId(null);
    localStorage.removeItem(LOCAL_CONFIG_KEY);
    localStorage.removeItem(LOCAL_MISSION_ID_KEY);
    localStorage.removeItem(LOCAL_EVENT_ID_KEY);
  };

  // Refresh agents and history lists from backend
  const refreshData = async () => {
    try {
      const agentRes = await fetchWithAuth('/api/aios/agents');
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        const mapped = agentData.map((a: any) => ({
          id: a.agent_id,
          name: a.agent_name,
          role: a.agent_type,
          status: a.is_enabled ? 'idle' : 'error',
          currentAction: a.description || 'Awaiting dispatch'
        }));
        setAgents(mapped);
      }

      const historyRes = await fetchWithAuth('/api/aios/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        const mapped = historyData.map((m: any) => {
          const configId = classifyEvent(m.event_name || '');
          const config = EVENT_CONFIGS[configId];
          return {
            id: m.mission_id,
            eventTitle: m.event_name || 'Emergency Event',
            eventIcon: config?.icon || '🚨',
            location: m.location || 'Unknown Location',
            startedAt: m.completed_at ? new Date(m.completed_at).getTime() - (m.duration || 60) * 1000 : Date.now() - 60000,
            completedAt: m.completed_at ? new Date(m.completed_at).getTime() : Date.now(),
            durationMin: Math.max(1, Math.round((m.duration || 60) / 60)),
            resolvedBy: config?.agents || [],
            configId: configId
          };
        });
        setCompletedMissions(mapped);
      }
    } catch (err) {
      console.error('[AIOS Context] Error refreshing backend data:', err);
    }
  };

  const restoreMissionState = async (missionId: string) => {
    if (!missionId) return;
    try {
      const res = await fetchWithAuth(`/api/aios/missions/${missionId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('[AIOS Context] Restored mission state from PostgreSQL:', data);
        if (data && data.event_id) {
          setActiveMissionId(data.mission_id);
          localStorage.setItem(LOCAL_MISSION_ID_KEY, data.mission_id);
        }
      }
    } catch (err) {
      console.error('[AIOS Context] Restore mission state failed:', err);
    }
  };

  const addCompletedMission = (mission: CompletedMission) => {
    // Optimistically add to local UI state first
    setCompletedMissions(prev => {
      // avoid duplicate if already present (e.g. from refreshData)
      if (prev.some(m => m.id === mission.id)) return prev;
      return [mission, ...prev];
    });
    // Do NOT call saveMissionToHistory here — callers already do it
    // to avoid double DB writes. Just clear the stale activeMissionId
    // so restoreMissionState does not loop on next mount.
    if (activeMissionId === mission.id) {
      localStorage.removeItem(LOCAL_MISSION_ID_KEY);
    }
  };

  /**
   * Saves a completed mission to the PostgreSQL database via POST /api/aios/history.
   * Uses deduplication on the backend — safe to call multiple times for same mission.
   */
  const saveMissionToHistory = async (
    missionId: string,
    overrides?: Partial<{ eventTitle: string; location: string; duration: number; totalAgents: number }>
  ): Promise<void> => {
    if (!missionId) return;
    // Build the record from current context state
    const config = activeEventConfigRef.current;
    const eventTitle = overrides?.eventTitle ?? config?.title ?? 'Emergency Event';
    const location = overrides?.location ?? config?.location ?? 'Unknown Location';
    const totalAgents = overrides?.totalAgents ?? config?.agents?.length ?? 0;
    const duration = overrides?.duration ?? 60; // seconds — backend calculates precisely

    const payload = {
      mission_id: missionId,
      event_name: eventTitle,
      final_status: 'COMPLETED',
      duration,
      total_agents: totalAgents,
      location,
    };

    try {
      const res = await fetchWithAuth('/api/aios/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[AIOS] Mission history saved:', data.history_id, 'created:', data.created);
        // Update in-memory completed missions list
        const newEntry: CompletedMission = {
          id: data.history_id,
          eventTitle: data.event_name,
          eventIcon: config?.icon ?? '🚨',
          location: data.location ?? location,
          startedAt: Date.now() - (data.duration ?? duration) * 1000,
          completedAt: Date.now(),
          durationMin: Math.max(1, Math.round((data.duration ?? duration) / 60)),
          resolvedBy: config?.agents ?? [],
          configId: missionId,
        };
        setCompletedMissions(prev => {
          // Avoid duplicate in-memory entry
          if (prev.some(m => m.id === newEntry.id)) return prev;
          return [newEntry, ...prev];
        });
      } else {
        console.warn('[AIOS] Failed to save mission history — status:', res.status);
      }
    } catch (err) {
      console.error('[AIOS] saveMissionToHistory error:', err);
    }
  };

  // Push new event report directly to PostgreSQL
  const addEvent = async (event: EventData): Promise<{ success: boolean; eventId?: string; missionId?: string }> => {
    const cleanAddress = extractAddress(event.location);
    const eventPayload = {
      event_title: `Emergency: ${event.type.toUpperCase()}`,
      event_description: `Incident reported at ${cleanAddress}`,
      detected_category: event.type,
      severity: event.severity > 75 ? 'CRITICAL' : event.severity > 50 ? 'HIGH' : 'MEDIUM',
      address: cleanAddress,
      city: 'Site Alpha',
      country: 'India',
      confidence_score: 0.95
    };

    // Default matching config from engine
    const configId = classifyEvent(event.type);
    const baseConfig = EVENT_CONFIGS[configId] || EVENT_CONFIGS.road_accident;
    const initialConfig: EventConfig = {
      ...baseConfig,
      id: `config-${Date.now()}`,
      title: eventPayload.event_title,
      location: cleanAddress || baseConfig.location,
      severity: eventPayload.severity === 'CRITICAL' ? 'Critical' : eventPayload.severity === 'HIGH' ? 'High' : 'Medium',
      progress: 10,
      missionDone: false,
      currentStep: 0,
      currentStepTexts: baseConfig.workflow.map(w => w.title),
      liveFeed: [{ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sender: 'AIOS Kernel', message: `Event created: ${eventPayload.event_title}` }]
    };

    setActiveEventConfig(initialConfig);

    try {
      const res = await fetchWithAuth('/api/aios/events', {
        method: 'POST',
        body: JSON.stringify(eventPayload)
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[AIOS Context] POST /api/aios/events succeeded:', data);
        const eventId = data.event_id;
        const missionId = data.mission?.mission_id || `mission-${Date.now()}`;

        setActiveEventId(eventId);
        setActiveMissionId(missionId);
        localStorage.setItem(LOCAL_EVENT_ID_KEY, eventId);
        localStorage.setItem(LOCAL_MISSION_ID_KEY, missionId);

        setEvents(prev => [...prev, { ...event, id: eventId }]);
        return { success: true, eventId, missionId };
      }
    } catch (err) {
      console.warn('[AIOS Context] PostgreSQL backend events api returned error, trying fallback:', err);
    }
    
    // Fallback: save to local Express DB state
    try {
      const fallbackRes = await fetchWithAuth('/api/local-events', {
        method: 'POST',
        body: JSON.stringify(eventPayload)
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const eventId = data.event_id;
        const missionId = `mission-${Date.now()}`;

        setActiveEventId(eventId);
        setActiveMissionId(missionId);
        localStorage.setItem(LOCAL_EVENT_ID_KEY, eventId);
        localStorage.setItem(LOCAL_MISSION_ID_KEY, missionId);

        setEvents(prev => [...prev, { ...event, id: eventId }]);
        return { success: true, eventId, missionId };
      }
    } catch (fallbackErr) {
      console.error('[AIOS Context] Failed to store event in local database fallback:', fallbackErr);
    }

    return { success: true, eventId: `temp-${Date.now()}`, missionId: `temp-mission-${Date.now()}` };
  };

  const startMissionForEvent = (eventId: string) => {
    const newMission: Mission = {
      id: `mission-${Date.now()}`,
      eventId,
      status: 'pending',
      progress: 0,
    };
    setMissions(prev => [...prev, newMission]);
  };

  const updateAgentStatus = (agent: AgentStatus) => {
    setAgents(prev => {
      const idx = prev.findIndex(a => a.id === agent.id);
      if (idx === -1) return [...prev, agent];
      const updated = [...prev];
      updated[idx] = agent;
      return updated;
    });
  };

  // Run initial fetch on mount — only restore if mission is still in-progress
  useEffect(() => {
    refreshData();
    // Only restore if we have a stored missionId and the mission might still
    // be active (localStorage retains it until clearActiveMission is called).
    // After completion the missionId is removed from localStorage by
    // addCompletedMission, so this block won't fire for completed missions.
    const storedId = localStorage.getItem(LOCAL_MISSION_ID_KEY);
    if (storedId) {
      restoreMissionState(storedId);
    }
  }, []);

  // Connect to the real-time WebSocket broadcaster
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isDisposed = false;

    const connectWS = () => {
      if (isDisposed) return;
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${proto}://${window.location.host}/api/ws`;
      
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (isDisposed && ws) {
            ws.close();
            return;
          }
          console.log('[AIOS WebSocket] Connected cleanly');
        };

        ws.onmessage = (event) => {
          if (isDisposed) return;
          try {
            if (!event.data) return;
            const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (!msg || !msg.event_type) return;
            console.log('[AIOS WebSocket] Received:', msg.event_type);
            
            if (msg.event_type === 'MISSION_CREATED') {
              const payload = msg.payload;
              const newM: Mission = {
                id: msg.mission_id,
                eventId: payload?.event_title || msg.mission_id,
                status: (payload?.status || 'active').toLowerCase(),
                progress: 0
              };
              setMissions(prev => [...prev.filter(x => x.id !== msg.mission_id), newM]);
            } 
            else if (msg.event_type === 'MISSION_UPDATED') {
              const payload = msg.payload;
              
              setActiveEventConfigState(prev => {
                const merged = {
                  ...prev,
                  ...payload,
                  workflow: payload.workflow || prev?.workflow || [],
                  agents: payload.agents || prev?.agents || [],
                  liveFeed: payload.liveFeed || prev?.liveFeed || []
                };
                try { localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(merged)); } catch {}
                return merged;
              });

              setMissions(prev => prev.map(m => {
                if (m.id === msg.mission_id) {
                  return {
                    ...m,
                    progress: payload.progress ?? m.progress,
                    status: payload.missionDone ? 'completed' : 'active'
                  };
                }
                return m;
              }));
            } 
            else if (msg.event_type === 'AGENT_STATUS_CHANGED') {
              const payload = msg.payload;
              setAgents(prev => prev.map(a => {
                if (a.id === payload.agent_id) {
                  return {
                    ...a,
                    status: payload.status.toLowerCase() === 'active' ? 'working' : 'idle',
                    currentAction: payload.task
                  };
                }
                return a;
              }));
            } 
            else if (msg.event_type === 'MISSION_COMPLETED') {
              const completedMissionId = msg.mission_id;
              console.log('[AIOS WebSocket] Mission completed — archiving to database:', completedMissionId);

              // Update UI state to show completed
              setActiveEventConfigState(prev => {
                if (!prev) return prev;
                const updated = { ...prev, missionDone: true, progress: 100 };
                try { localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(updated)); } catch {}
                return updated;
              });

              // Auto-save to PostgreSQL database
              if (completedMissionId) {
                // Use setTimeout to ensure activeEventConfigRef has latest value
                setTimeout(() => {
                  saveMissionToHistory(completedMissionId).then(() => {
                    // Refresh completed missions list after saving
                    refreshData();
                  });
                }, 500);
              } else {
                refreshData();
              }
            }
          } catch (err) {
            console.error('[AIOS WebSocket] Error handling message:', err);
          }
        };

        ws.onclose = () => {
          if (isDisposed) return;
          reconnectTimer = setTimeout(connectWS, 5000);
        };

        ws.onerror = () => {
          if (!isDisposed) {
            console.warn('[AIOS WebSocket] Reconnecting in background...');
          }
        };
      } catch (err) {
        console.warn('[AIOS WebSocket] Connect failed:', err);
      }
    };

    connectWS();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onopen = null;
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
    };
  }, []);

  return (
    <AIOSContext.Provider value={{
      events, missions, agents,
      activeEventConfig, setActiveEventConfig,
      activeMissionId, activeEventId,
      completedMissions, addCompletedMission, saveMissionToHistory,
      addEvent, startMissionForEvent, updateAgentStatus,
      refreshData, restoreMissionState, clearActiveMission
    }}>
      {children}
    </AIOSContext.Provider>
  );
};

export const useAIOS = (): AIOSContextProps => {
  const ctx = useContext(AIOSContext);
  if (!ctx) throw new Error('useAIOS must be used inside AIOSProvider');
  return ctx;
};
