import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Cpu, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Info,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { EVENT_CONFIGS, ALL_AGENTS_LIST, classifyEvent, EventConfig, WorkflowStep } from '../eventEngine';
import { useAIOS } from '../context/AIOSContext';

interface AIOSFlowViewProps {
  theme: 'dark' | 'light';
}

interface SelectedNodeInfo {
  type: 'agent';
  id: string;
  name: string;
  emoji: string;
  purpose: string;
  action: string;
  input: string;
  output: string;
  workflow: string;
  status: string;
}

interface SelectedArrowInfo {
  type: 'arrow';
  from: string;
  to: string;
  dataTransferred: string;
  whyTransferred: string;
  whatHappensNext: string;
}

const AGENT_SPECS: Record<string, { purpose: string; action: string; input: string; output: string; workflow: string }> = {
  accident: {
    purpose: 'Verifies incident reports using nearby cameras and routes coordinators.',
    action: 'Auditing road telemetry feed for vehicle obstructions.',
    input: 'User distress calls, vehicle coordinates, municipal camera bytes.',
    output: 'Verified collision locations and list of mobilized agents.',
    workflow: 'Receive Report ➔ Run Visual Verification ➔ Trigger Dispatches.'
  },
  ambulance: {
    purpose: 'Manages emergency ambulances, coordinates drivers, and monitors transit lanes.',
    action: 'Routing emergency medical responders under emergency sirens.',
    input: 'Accident GPS coordinates and hospital room availability.',
    output: 'Emergency transit ETA and live patient vital streams.',
    workflow: 'Locate Unit ➔ Calculate Route ➔ Dispatch Paramedics ➔ Patient Transit.'
  },
  hospital: {
    purpose: 'Prepares emergency wards, reserves ICU beds, and alerts surgical triages.',
    action: 'Locking emergency room space and prepping triage team.',
    input: 'Incoming patient trauma levels, active ICU bed count.',
    output: 'ICU room lock codes and staff ready signals.',
    workflow: 'Check Beds ➔ Lock Room ➔ Alert Surgeon ➔ Admit Patient.'
  },
  police: {
    purpose: 'Secures perimeter areas, diverts civilian traffic, and clears lanes.',
    action: 'Establishing cordons and managing detour lane routing.',
    input: 'Cordon radius coordinates, traffic lane congestion densities.',
    output: 'Cordon status telemetry and public detour alerts.',
    workflow: 'Cordon Road ➔ Setup Perimeter ➔ Divert Cars ➔ Clear Debris.'
  },
  traffic: {
    purpose: 'Connects city intersections and green-locks signal waves for speed transit.',
    action: 'Overriding local crossings to green-light the emergency route.',
    input: 'Ambulance travel coordinates, intersection congestion logs.',
    output: 'Override codes and signal lock confirmations.',
    workflow: 'Audit Crossing ➔ Engages Signal Overrides ➔ Hold Green Wave.'
  },
  drone: {
    purpose: 'Deploys aerial surveillance drone cameras to stream high-def thermal video.',
    action: 'Overhead hovering, scanning structural boundaries.',
    input: 'Flight waypoint routes, thermal sensor range settings.',
    output: 'HD thermal camera feed and estimated hazard boundaries.',
    workflow: 'Launch Drone ➔ Calibrate Cam ➔ Stream Video Feed.'
  },
  fire: {
    purpose: 'Suppresses flame hotspots and connects regional hydrants.',
    action: 'Suppressing core building blaze and cooling adjacent walls.',
    input: 'Flame thermal profiles, municipal water supply codes.',
    output: 'Water flow rate status, fire suppression clearance.',
    workflow: 'Mobilize Engines ➔ Hook Hydrant ➔ Suppress Flame.'
  },
  rescue: {
    purpose: 'Deploys search rafts, inflatable boats, and coordinates emergency evacuations.',
    action: 'Navigating flood pools to recover stranded residents.',
    input: 'Stranded civilian coordinates, aerial scan feeds.',
    output: 'Safe corridor navigation paths, citizen recovery logs.',
    workflow: 'Launch Rafts ➔ Sweep Sectors ➔ Recover Citizens.'
  },
  weather: {
    purpose: 'Models storm paths, wind speed vectors, and forecasts rainfall volume.',
    action: 'Computing rain volume and storm front trajectories.',
    input: 'Barometric logs, radar feeds.',
    output: 'Rainfall forecast timelines and water level alerts.',
    workflow: 'Load radar files ➔ Compute storm direction ➔ Broadcast warn codes.'
  },
  comm: {
    purpose: 'Broadcasts urgent civic safety warnings to local cell towers.',
    action: 'Sending emergency alert messages to all cell towers in sector.',
    input: 'Sector alert warning text, cell broadcast frequencies.',
    output: 'Warning logs broadcast status checks.',
    workflow: 'Formulate warning ➔ Cordon towers ➔ Broadcast SMS.'
  },
  cyber: {
    purpose: 'Inspects server traffic, logs CPU spikes, and detects malicious packets.',
    action: 'Auditing active login queries on transactional server loops.',
    input: 'CPU usage metrics, query throughput counts.',
    output: 'Breach alerts, suspicious IP list.',
    workflow: 'Audit logs ➔ Detect spikes ➔ Signal security agent.'
  },
  security: {
    purpose: 'Suspends admin network access and revokes compromise session tokens.',
    action: 'Revoking active login tokens on compromise WAN subnets.',
    input: 'Breach reports, active session directories.',
    output: 'Suspended ports registry, access block codes.',
    workflow: 'Analyze breach ➔ Revoke token ➔ Disable WAN ports.'
  },
  recovery: {
    purpose: 'Rebuilds database schemas and restores clean transactional records.',
    action: 'Restoring tables from encrypted offsite immutable backups.',
    input: 'Transaction logs backup, schema hash files.',
    output: 'Restored clean tables validation log.',
    workflow: 'Verify snapshot ➔ Format sector ➔ Restore schema databases.'
  },
  network: {
    purpose: 'Engages router firewalls and cordons malicious query routes.',
    action: 'Configuring firewall filter rules to drop suspicious traffic.',
    input: 'Malicious IP tables, router port lists.',
    output: 'Active filter rules, subnet block status.',
    workflow: 'IP list matching ➔ Engages router firewall ➔ Block WAN subnets.'
  },
  power: {
    purpose: 'Isolates damaged transformers and shifts load to redundant circuits.',
    action: 'Decoupling faulty substation loops and switching generators.',
    input: 'Smart grid volt meters, transformer thermal logs.',
    output: 'Circuit isolation status, grid bypass loops.',
    workflow: 'Trace arc fault ➔ Decouple transformer ➔ Grid loop switch.'
  },
  factory: {
    purpose: 'Audits boiler diagnostics and overrides emergency pressure valves.',
    action: 'Regulating steam valves to vent reactor boiler cores.',
    input: 'Pressure gauge metrics, safety override triggers.',
    output: 'Valve status checks, gas venting volume.',
    workflow: 'Read gauges ➔ Engage valve override ➔ cool boilers.'
  },
  defense: {
    purpose: 'Monitors border security fences and locks sector gates.',
    action: 'Locking down security barriers in response to sensor alerts.',
    input: 'Laser grid breach logs, camera telemetry maps.',
    output: 'Cordon gate block rules, patrol dispatcher routes.',
    workflow: 'Sensor sweep ➔ Lock gates ➔ Mobilize border tactical team.'
  },
  agriculture: {
    purpose: 'Monitors soil moisture indices and regulates subsoil irrigation.',
    action: 'Opening fertilizer water loops in Sector C.',
    input: 'Soil humidity meters, crop hydration benchmarks.',
    output: 'Flow rate status, soil moist checks.',
    workflow: 'Audit field meters ➔ Engage water pump loop.'
  }
};

export default function AIOSFlowView({ theme }: AIOSFlowViewProps) {
  const { addEvent, saveMissionToHistory, addCompletedMission } = useAIOS();
  const [inputText, setInputText] = useState('');
  const [problemDescription, setProblemDescription] = useState('No active event described.');
  const [currentMissionId, setCurrentMissionId] = useState<string | null>(null);
  
  // Event Details
  const [activeConfig, setActiveConfig] = useState<EventConfig | null>(null);
  const [hasInjuries, setHasInjuries] = useState(false);
  const [injuryAlertTriggered, setInjuryAlertTriggered] = useState(false);
  
  // Simulation Control States
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(2500); // ms per step
  
  // Collaborative Logs
  const [logs, setLogs] = useState<{ sender: string; message: string; timestamp: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Clicked Graph Elements Details Modal State
  const [selectedGraphElement, setSelectedGraphElement] = useState<SelectedNodeInfo | SelectedArrowInfo | null>(null);

  const isDark = theme === 'dark';

  // Dynamic workflow compiled list
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);

  // Sync state whenever configuration or injuries change
  useEffect(() => {
    if (activeConfig) {
      let configId = activeConfig.id;
      if (configId.startsWith('road_accident')) {
        configId = hasInjuries ? 'road_accident_injured' : 'road_accident';
      }
      
      const config = EVENT_CONFIGS[configId] || activeConfig;
      setWorkflow(config.workflow);
      setActiveAgentIds(config.agents);

      if (currentStepIndex >= config.workflow.length) {
        setCurrentStepIndex(config.workflow.length - 1);
      }
    }
  }, [activeConfig, hasInjuries]);

  // Handle simulation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && activeConfig && workflow.length > 0) {
      timer = setTimeout(() => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < workflow.length) {
          setCurrentStepIndex(nextIndex);
          
          if (nextIndex === 0) {
            setActivePhase(2); // AIOS Understood
          } else if (nextIndex === 1) {
            setActivePhase(3); // Agents Activated
          } else if (nextIndex > 1 && nextIndex < workflow.length - 1) {
            setActivePhase(4); // Mission Executing
          } else if (nextIndex === workflow.length - 1) {
            setActivePhase(5); // Completed
            setIsPlaying(false);

            // Directly save mission completion to database!
            const mId = currentMissionId || `mission-${Date.now()}`;
            saveMissionToHistory(mId, {
              eventTitle: activeConfig.title,
              location: activeConfig.location || 'Central Database — WAN',
              duration: 60,
              totalAgents: activeConfig.agents?.length || 3
            });
            addCompletedMission({
              id: mId,
              eventTitle: activeConfig.title,
              eventIcon: activeConfig.icon || '🚨',
              location: activeConfig.location || 'Central Database — WAN',
              startedAt: Date.now() - 60000,
              completedAt: Date.now(),
              durationMin: 1,
              resolvedBy: activeConfig.agents || [],
              configId: activeConfig.id
            });
          }

          const step = workflow[nextIndex];
          const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          
          // Generate simulation log message dynamically based on step
          let logMessage = '';
          if (activeConfig.liveFeed && activeConfig.liveFeed[nextIndex]) {
            logMessage = activeConfig.liveFeed[nextIndex].message;
          } else {
            logMessage = `${step.agentName}: Task "${step.title}" executed. Details: ${step.desc}`;
          }

          setLogs(prev => [...prev, { sender: step.agentName, message: logMessage, timestamp }]);
        } else {
          setIsPlaying(false);
        }
      }, simulationSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, workflow, activeConfig, simulationSpeed]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle problem ingestion
  const handleIngest = (text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    setProblemDescription(cleanText);
    
    // Reset simulation
    setLogs([]);
    setCurrentStepIndex(-1);
    setActivePhase(1);
    setInjuryAlertTriggered(false);
    setSelectedGraphElement(null);

    const configId = classifyEvent(cleanText);
    const config = EVENT_CONFIGS[configId] || EVENT_CONFIGS.road_accident;
    
    // Check if injuries are reported in text for accident
    const lower = cleanText.toLowerCase();
    const injuries = lower.includes('injury') || lower.includes('injured') || lower.includes('five people') || lower.includes('5 people') || lower.includes('hurt');
    
    setHasInjuries(injuries);
    setActiveConfig(config);
    setIsPlaying(true);
    setInputText('');

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs([
      { sender: 'AIOS Kernel', message: `Problem described: "${cleanText}"`, timestamp },
      { sender: 'AIOS Kernel', message: `Event classified as: ${config.title}`, timestamp },
      { sender: 'AIOS Kernel', message: `Initializing automatic response dispatch loop & saving to database...`, timestamp }
    ]);

    // Save event & mission directly to database!
    addEvent({
      id: `temp-${Date.now()}`,
      type: configId,
      location: config.location || 'Central Database — WAN',
      severity: 85,
      timestamp: Date.now()
    }).then(res => {
      if (res && res.missionId) {
        setCurrentMissionId(res.missionId);
      }
    }).catch(err => {
      console.error('[AIOS Flow] Failed to persist event to DB:', err);
    });
  };

  const handleManualInjuryToggle = () => {
    if (!activeConfig || !activeConfig.id.startsWith('road_accident')) return;
    
    const newInjuries = !hasInjuries;
    setHasInjuries(newInjuries);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (newInjuries) {
      setInjuryAlertTriggered(true);
      setLogs(prev => [
        ...prev, 
        { 
          sender: 'AIOS Sensor', 
          message: '🚨 ALERT: Sensor node reported injuries at the accident site. Re-routing dispatch.', 
          timestamp 
        },
        { 
          sender: 'AIOS Kernel', 
          message: '🟢 Activating Ambulance Agent and Hospital Agent immediately from Standby.', 
          timestamp 
        }
      ]);
      
      setTimeout(() => {
        setInjuryAlertTriggered(false);
      }, 5000);
    } else {
      setLogs(prev => [
        ...prev, 
        { 
          sender: 'AIOS Kernel', 
          message: '⚪ Injuries cleared or unchecked. Reverting Ambulance and Hospital Agents to Standby.', 
          timestamp 
        }
      ]);
    }
  };

  const runExample = (index: number) => {
    if (index === 1) {
      handleIngest("A bus and a car collided on MG Road. Five people are injured.");
    } else if (index === 2) {
      handleIngest("Heavy flooding has occurred in Vijayawada.");
    } else if (index === 3) {
      handleIngest("Cybersecurity breach detected on main server database.");
    } else if (index === 4) {
      handleIngest("Minor fender bender reported on MG Road. Traffic piling up.");
    } else if (index === 5) {
      handleIngest("Building is burning");
    } else if (index === 6) {
      handleIngest("Six buses are short circuited");
    } else if (index === 7) {
      handleIngest("Transformer exploded");
    } else if (index === 8) {
      handleIngest("Factory boiler exploded");
    }
  };

  const selectNode = (agentId: string) => {
    const agent = ALL_AGENTS_LIST.find(a => a.id === agentId);
    if (!agent) return;

    const spec = AGENT_SPECS[agentId] || {
      purpose: 'Autonomous operational responder.',
      action: 'Idle, ready to coordinate.',
      input: 'Alert telemetry triggers.',
      output: 'Resolution telemetry check.',
      workflow: 'Orchestrating event resolution.'
    };

    setSelectedGraphElement({
      type: 'agent',
      id: agentId,
      name: agent.name,
      emoji: agent.icon,
      purpose: spec.purpose,
      action: spec.action,
      input: spec.input,
      output: spec.output,
      workflow: spec.workflow,
      status: activeAgentIds.includes(agentId) ? 'Active Responding' : 'Standby Mode'
    });
  };

  const selectArrow = (fromName: string, toName: string, dataTransferred: string, whyTransferred: string, whatHappensNext: string) => {
    setSelectedGraphElement({
      type: 'arrow',
      from: fromName,
      to: toName,
      dataTransferred,
      whyTransferred,
      whatHappensNext
    });
  };

  // Generate dynamic connection lines (arrows) based on active agents
  const getDynamicConnections = () => {
    if (!activeConfig) return [];
    
    const currentId = activeConfig.id;
    if (currentId.startsWith('road_accident')) {
      return [
        { from: 'accident', to: 'drone', label: 'Command signal', data: 'Mission dispatch instructions', why: 'To initiate aerial survey over MG Road coordinates.', next: 'Drone Agent launches and streams live thermal cameras.' },
        { from: 'drone', to: 'accident', label: 'Visual feed', data: 'Live video stream and thermal scan coordinates', why: 'To confirm vehicle collision coordinates and detect injuries.', next: 'Accident Agent logs injuries and routes Ambulance.' },
        { from: 'accident', to: 'ambulance', label: 'Dispatch request', data: 'Patient counts, crash site GPS coordinates', why: 'To mobilize paramedics en route to MG Road.', next: 'Ambulance Agent assigns driver and schedules route.' },
        { from: 'ambulance', to: 'traffic', label: 'ETA feed', data: 'Live GPS location, estimated transit timelines', why: 'To alert municipal signal override systems.', next: 'Traffic Agent green-locks intersection lights.' },
        { from: 'ambulance', to: 'hospital', label: 'Vitals feed', data: 'Patient heart rate, trauma levels', why: 'To notify ER beds allocation team.', next: 'Hospital Agent locks down triage room and preps ICU.' },
        { from: 'police', to: 'traffic', label: 'Perimeter sync', data: 'Perimeter coordinate cordons, road block maps', why: 'To synchronize detour routes and divert lanes.', next: 'Traffic Agent updates smart signs with detours.' }
      ];
    } else if (currentId === 'building_fire' || currentId === 'vehicle_fire') {
      return [
        { from: 'fire', to: 'drone', label: 'Scan request', data: 'Structural thermal request', why: 'To map temperature profiles inside rooms.', next: 'Drone Agent sweeps building facade and streams hotspots.' },
        { from: 'fire', to: 'police', label: 'Evacuation cordon', data: 'Evacuation radius coordinates', why: 'To secure block blocks and clear civilian lanes.', next: 'Police Agent establishes perimeters.' },
        { from: 'fire', to: 'ambulance', label: 'Triage request', data: 'Smoke inhalation counts', why: 'To mobilize paramedic units.', next: 'Ambulance Agent preps oxygen packs.' }
      ];
    } else if (currentId === 'flash_flood') {
      return [
        { from: 'flood', to: 'weather', label: 'Rainfall stats', data: 'River rise volume metrics', why: 'To compute rainfall drainage timeline prediction.', next: 'Weather Agent triggers thunderstorm alerts.' },
        { from: 'flood', to: 'drone', label: 'Cordon grid', data: 'Low-elevation flood plain waypoints', why: 'To direct flight waypoints for civilian sweep.', next: 'Drone Agent scans grid sector for survivors.' },
        { from: 'drone', to: 'rescue', label: 'Civilian coordinates', data: 'Stranded civilian thermal locations', why: 'To direct search rafts and inflate boats.', next: 'Rescue Agent retrieves citizens.' },
        { from: 'flood', to: 'comm', label: 'Broadcast warning', data: 'Urgent cell broadcast warning text', why: 'To alert residents via local cell towers.', next: 'Communication Agent sends warning alerts.' }
      ];
    } else if (currentId === 'cyber_attack') {
      return [
        { from: 'cyber', to: 'security', label: 'Breach log', data: 'Suspicious credential log registers', why: 'To notify access control locks team.', next: 'Security Agent suspends compromised admin ports.' },
        { from: 'security', to: 'network', label: 'Filter request', data: 'Malicious IP tables, blocked ports list', why: 'To write firewall block drop rules.', next: 'Network Agent updates WAN filters.' },
        { from: 'security', to: 'recovery', label: 'Recovery trigger', data: 'Restore signal token', why: 'To begin schema restoration.', next: 'Recovery Agent reads offsite database snapshot.' }
      ];
    }
    
    // Default fallback simple list
    return [
      { from: 'accident', to: 'police', label: 'Cordon coordinate', data: 'Incident coordinate', why: 'To establish area safety blocks.', next: 'Police Agent secures boundary.' }
    ];
  };

  const dynamicConnections = getDynamicConnections();

  return (
    <div className={`space-y-6 max-w-5xl mx-auto pb-10 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
              <Cpu className="h-5 w-5 animate-pulse" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight">AIOS Flow</h1>
              <p className="text-xs text-slate-400">Autonomous Agent Orchestration and Dynamic Collaboration</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setSimulationSpeed(4000)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${simulationSpeed === 4000 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Slow
            </button>
            <button 
              onClick={() => setSimulationSpeed(2500)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${simulationSpeed === 2500 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Normal
            </button>
            <button 
              onClick={() => setSimulationSpeed(1000)}
              className={`px-2 py-1 rounded text-[10px] font-bold ${simulationSpeed === 1000 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Fast
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC ALERT POPUP */}
      {injuryAlertTriggered && (
        <div className="fixed bottom-5 right-5 max-w-sm z-50 animate-bounce bg-red-950 border border-red-500/50 text-red-200 rounded-xl p-4 shadow-2xl flex gap-3 items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-sm text-white">Dynamic Agent Trigger</h4>
            <p className="text-xs mt-1 leading-relaxed">
              Injuries detected! AIOS dynamically activated <strong>Ambulance Agent</strong> and <strong>Hospital Agent</strong> from Standby.
            </p>
          </div>
        </div>
      )}

      {/* PHASE PROGRESS TIMELINE */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-900' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          {[
            { id: 1, label: '1. Event Detected' },
            { id: 2, label: '2. AIOS Understood' },
            { id: 3, label: '3. Agents Activated' },
            { id: 4, label: '4. Mission Executing' },
            { id: 5, label: '5. Mission Completed' }
          ].map((phase) => {
            const isActive = activePhase === phase.id;
            const isCompleted = activePhase > phase.id;
            return (
              <React.Fragment key={phase.id}>
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/50 scale-110 ring-4 ring-indigo-950'
                      : isCompleted
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : phase.id}
                  </div>
                  <span className={`transition-colors duration-300 ${
                    isActive ? 'text-indigo-400 font-extrabold' : isCompleted ? 'text-emerald-500' : 'text-slate-500'
                  }`}>{phase.label}</span>
                </div>
                {phase.id < 5 && <ChevronRight className="hidden sm:block h-4 w-4 text-slate-700 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMN 1: CONTROL CENTER */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* PROBLEM INGESTION */}
          <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="h-4 w-4" /> Describe Problem
              </h3>
              <p className="text-[11px] text-slate-400">Describe a disaster, event, or threat in plain English.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleIngest(inputText); }} className="relative group">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., Six buses are short circuited..."
                className={`w-full px-4 py-3 rounded-xl border text-xs outline-none transition-all shadow-sm ${
                  isDark 
                    ? 'bg-slate-950 border-slate-850 text-white focus:border-indigo-500 placeholder-slate-655' 
                    : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-400 placeholder-slate-400'
                }`}
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className={`absolute right-2 top-2 p-1.5 rounded-lg text-white transition-all ${
                  inputText.trim() ? 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>

            {/* PRE-CONFIGURED PRESETS */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Try Presets</span>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { index: 1, label: '🚗 Car Crash' },
                  { index: 4, label: '🚗 Minor Fender' },
                  { index: 5, label: '🔥 Building Fire' },
                  { index: 6, label: '🚒 Electrical Fire' },
                  { index: 2, label: '🌊 Flash Flood' },
                  { index: 3, label: '💻 Cyber Attack' },
                  { index: 7, label: '⚡ Power Outage' },
                  { index: 8, label: '🏭 Boiler Explosion' }
                ].map(ex => (
                  <button 
                    key={ex.index}
                    onClick={() => runExample(ex.index)}
                    className={`text-center p-2 rounded-xl border text-[10.5px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                      isDark ? 'border-slate-850 bg-slate-950/40 text-slate-300 hover:bg-slate-900' : 'border-slate-200 bg-slate-55 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SIMULATOR CONTROLS */}
          {activeConfig && (
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Simulation Controller</span>
              
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer ${
                    isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Resume
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentStepIndex(-1);
                    setActivePhase(1);
                    setIsPlaying(true);
                    setLogs([{ sender: 'AIOS Kernel', message: `Resetting workflow simulation for ${activeConfig.title}.`, timestamp: new Date().toLocaleTimeString() }]);
                  }}
                  className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                  }`}
                  title="Reset Simulation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* DYNAMIC ACTIVATION DEMO PANEL */}
              {activeConfig.id.startsWith('road_accident') && (
                <div className={`p-3.5 rounded-xl border space-y-3 ${
                  isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-150'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-extrabold text-slate-300 uppercase tracking-wide">Dynamic Activation Demo</span>
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                  </div>
                  
                  <div className="flex items-center gap-3 justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Report Injuries?</span>
                      <span className="text-[9.5px] text-slate-400 block">Trigger Ambulance/Hospital instantly</span>
                    </div>
                    
                    <button
                      onClick={handleManualInjuryToggle}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        hasInjuries ? 'bg-indigo-600' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          hasInjuries ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* COLUMN 2 & 3: FLOW MONITOR */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* DETECTED EVENT SUMMARY */}
          {activeConfig ? (
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} shadow-sm space-y-4`}>
              
              {/* Event Title, Location, and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 border-slate-800/60 gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <span>{activeConfig.icon}</span> <span>{activeConfig.title}</span>
                  </h2>
                  <span className="text-xs text-slate-400 mt-1 block">📍 {activeConfig.location}</span>
                </div>
                <div className="space-y-1 text-left sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block">Status</span>
                  <span className="text-xs font-black text-emerald-400 block animate-pulse">
                    {currentStepIndex === workflow.length - 1 ? '✅ Completed' : '🟢 AIOS is responding...'}
                  </span>
                </div>
              </div>

              {/* Progress and What is Happening Now */}
              <div className="space-y-2.5 p-4 bg-slate-950/40 border border-slate-850 rounded-xl">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">AIOS Progress</span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
                  <div className="font-mono text-blue-400 font-bold tracking-wider shrink-0 bg-blue-950/30 border border-blue-900/40 px-2 py-0.5 rounded">
                    {Math.round(((currentStepIndex + 1) / workflow.length) * 100)}% Complete
                  </div>
                  <div className="text-slate-200 leading-normal flex-1 sm:text-right">
                    Current Step: <strong className="text-blue-400 font-bold ml-1">{
                      currentStepIndex >= 0 ? workflow[currentStepIndex].title : 'Evaluating situation'
                    }</strong>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 mt-2 border border-slate-800 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500 shadow-lg shadow-indigo-500/50" 
                    style={{ width: `${Math.max(0, Math.min(100, Math.round(((currentStepIndex + 1) / workflow.length) * 100)))}%` }}
                  />
                </div>
              </div>

              {/* ACTIVE VS STANDBY AGENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ACTIVE AGENTS */}
                <div className="p-3.5 rounded-xl bg-slate-950/30 border border-slate-850 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                    🟢 Active Agents
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_AGENTS_LIST.filter(a => activeAgentIds.includes(a.id) || activeAgentIds.includes(a.name) || activeAgentIds.some(x => x.toLowerCase().includes(a.code.toLowerCase()) || a.name.toLowerCase().includes(x.toLowerCase()))).map(agent => (
                      <button 
                        key={agent.id} 
                        onClick={() => selectNode(agent.id)}
                        className="flex items-center gap-1.5 text-[11px] p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 transition-all font-semibold cursor-pointer text-left w-full text-white"
                      >
                        <span>{agent.icon}</span>
                        <span className="truncate">{agent.name.replace(' Agent', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* STANDBY AGENTS */}
                <div className="p-3.5 rounded-xl bg-slate-950/30 border border-slate-850 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    ⚪ Standby Agents
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {ALL_AGENTS_LIST.filter(a => !(activeAgentIds.includes(a.id) || activeAgentIds.includes(a.name) || activeAgentIds.some(x => x.toLowerCase().includes(a.code.toLowerCase()) || a.name.toLowerCase().includes(x.toLowerCase())))).map(agent => (
                      <button 
                        key={agent.id} 
                        onClick={() => selectNode(agent.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900/40 border border-slate-850 text-[10px] hover:border-slate-700 transition-all font-medium text-slate-400 cursor-pointer"
                      >
                        <span className="text-[10.5px]">{agent.icon}</span>
                        <span>{agent.name.replace(' Agent', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DYNAMIC INTERACTIVE BLUEPRINT NODE GRAPH */}
              <div className="space-y-3 pt-3 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Interactive Blueprint Graph</span>
                  <span className="text-[9.5px] text-slate-400 font-bold bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">Click nodes & arrows to inspect data flow</span>
                </div>
                
                <div className="relative border border-slate-850 rounded-2xl bg-slate-950 p-6 flex flex-col items-center justify-center min-h-[220px] overflow-hidden">
                  
                  {/* Nodes wrapper */}
                  <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 z-10 w-full">
                    {activeAgentIds.map((aid, idx) => {
                      const agent = ALL_AGENTS_LIST.find(a => a.id === aid);
                      if (!agent) return null;
                      
                      const isAgentExecuting = currentStepIndex >= 0 && workflow[currentStepIndex].agentName === agent.name;

                      return (
                        <div key={aid} className="flex items-center gap-3">
                          <button
                            onClick={() => selectNode(aid)}
                            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer shrink-0 text-left ${
                              isAgentExecuting 
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105 animate-pulse'
                                : 'bg-slate-900 border-slate-800 text-slate-200'
                            }`}
                          >
                            <span className="mr-1.5">{agent.icon}</span>
                            <span>{agent.name}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Flow connection arrows */}
                  {dynamicConnections.length > 0 && (
                    <div className="w-full mt-6 border-t border-slate-850 pt-4 space-y-2 text-left">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block">Active Data Flow Streams</span>
                      <div className="flex flex-wrap gap-2">
                        {dynamicConnections.map((conn, idx) => (
                          <button
                            key={idx}
                            onClick={() => selectArrow(conn.from, conn.to, conn.data, conn.why, conn.next)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10.5px] font-bold transition-all cursor-pointer ${
                              isDark ? 'bg-slate-900 border-slate-800 text-indigo-400 hover:border-indigo-500' : 'bg-slate-100 border-slate-200 text-indigo-600 hover:border-indigo-400'
                            }`}
                          >
                            <span>{ALL_AGENTS_LIST.find(a => a.id === conn.from)?.icon}</span>
                            <span>➔</span>
                            <span>{ALL_AGENTS_LIST.find(a => a.id === conn.to)?.icon}</span>
                            <span className="opacity-70 text-[9.5px]">({conn.label})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* CLICKED GRAPH ELEMENT DETAILED INSPECTOR PANEL */}
              {selectedGraphElement && (
                <div className={`p-4 rounded-xl border animate-slide-down space-y-3 ${
                  isDark ? 'bg-slate-900 border-indigo-950' : 'bg-white border-indigo-100 shadow-md'
                }`}>
                  <div className="flex items-center justify-between border-b pb-2 border-slate-800/40">
                    <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-2">
                      <Info className="h-4 w-4 text-indigo-400" />
                      {selectedGraphElement.type === 'agent' 
                        ? `Agent Details: ${selectedGraphElement.emoji} ${selectedGraphElement.name}`
                        : `Data Flow: ${ALL_AGENTS_LIST.find(a => a.id === selectedGraphElement.from)?.name} ➔ ${ALL_AGENTS_LIST.find(a => a.id === selectedGraphElement.to)?.name}`
                      }
                    </h4>
                    <button 
                      onClick={() => setSelectedGraphElement(null)}
                      className="text-[10px] text-slate-500 hover:text-white font-bold"
                    >
                      Close ×
                    </button>
                  </div>

                  {selectedGraphElement.type === 'agent' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Purpose</span>
                        <p className="text-slate-350">{selectedGraphElement.purpose}</p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Current Action</span>
                        <p className="text-indigo-400 font-semibold">{selectedGraphElement.action}</p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Input Parameters</span>
                        <p className="text-slate-400 font-mono text-[10px]">{selectedGraphElement.input}</p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Output Produced</span>
                        <p className="text-slate-400 font-mono text-[10px]">{selectedGraphElement.output}</p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850 md:col-span-2">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Procedural Workflow</span>
                        <p className="text-slate-300 font-semibold">{selectedGraphElement.workflow}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5 text-[11px] leading-relaxed">
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Data Transferred</span>
                        <p className="text-indigo-300 font-bold">{selectedArrowInfo(selectedGraphElement).dataTransferred}</p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Why it is being transferred</span>
                        <p className="text-slate-300">{selectedArrowInfo(selectedGraphElement).whyTransferred}</p>
                      </div>
                      <div className="p-2.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">What happens next</span>
                        <p className="text-emerald-400 font-semibold">{selectedArrowInfo(selectedGraphElement).whatHappensNext}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GENERATED WORKFLOW GRID */}
              <div className="space-y-3 pt-3 border-t border-slate-800/60 animate-fade-in">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Workflow Steps</span>
                
                <div className="relative border border-slate-850 rounded-xl bg-slate-950/60 p-4">
                  <div className="flex flex-col space-y-4">
                    {workflow.map((step, idx) => {
                      const isStepActive = idx === currentStepIndex;
                      const isStepCompleted = idx < currentStepIndex;
                      return (
                        <div key={idx} className="flex items-start gap-3 relative">
                          {idx < workflow.length - 1 && (
                            <div className={`absolute left-3.5 top-7 bottom-[-20px] w-0.5 transition-colors duration-300 ${
                              isStepCompleted ? 'bg-emerald-500' : isStepActive ? 'bg-indigo-500' : 'bg-slate-800'
                            }`} />
                          )}

                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold border transition-all duration-300 ${
                            isStepActive 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105 animate-pulse'
                              : isStepCompleted
                              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}>
                            <span className="text-sm">{step.icon || '✓'}</span>
                          </div>

                          <div className={`flex-1 p-2.5 rounded-lg border transition-all duration-300 ${
                            isStepActive 
                              ? 'bg-indigo-950/40 border-indigo-500/40 text-white'
                              : isStepCompleted
                              ? 'bg-slate-900/40 border-slate-800/40 text-slate-300 opacity-80'
                              : 'bg-slate-900/20 border-slate-850/20 text-slate-650 opacity-45'
                          }`}>
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-extrabold">{step.title}</span>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-950 px-1 rounded border border-slate-850">{step.agentName}</span>
                            </div>
                            <p className="text-[10px] mt-1 leading-normal">{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* HUMAN READABLE AIOS REASONING (WHY AIOS DID THIS) */}
              <div className="space-y-3 pt-3 border-t border-slate-800/60">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Why AIOS took these actions</span>
                
                <div className={`p-4 rounded-xl border space-y-2 bg-slate-950/50 border-slate-850`}>
                  {activeConfig.reasoning.map((pt, idx) => (
                    <p key={idx} className="text-xs leading-relaxed text-slate-300 font-medium">
                      • {pt}
                    </p>
                  ))}
                </div>
              </div>

              {/* COLLABORATIVE LOGS AND DIALOGUE */}
              <div className="space-y-3 pt-3 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Agent Live Communication Feed</span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                    <MessageSquare className="h-3 w-3" /> Live Feed
                  </span>
                </div>

                <div className="h-44 border border-slate-850 rounded-xl bg-slate-950 font-mono text-[10px] p-3 overflow-y-auto space-y-2 text-slate-350">
                  {logs.map((log, index) => (
                    <div key={index} className="flex gap-2 leading-relaxed">
                      <span className="text-slate-600 shrink-0 select-none">[{log.timestamp}]</span>
                      <div>
                        <span className="font-bold text-indigo-400">{log.sender}:</span>{' '}
                        <span>{log.message}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </div>

            </div>
          ) : (
            /* EMPTY STATE CARD */
            <div className={`p-12 rounded-2xl border text-center flex flex-col items-center justify-center space-y-4 ${
              isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            } shadow-sm min-h-[400px]`}>
              <div className="text-4xl animate-bounce">🤖</div>
              <div className="max-w-xs space-y-1.5">
                <h3 className="font-extrabold text-sm text-slate-200">OS Kernel Standby</h3>
                <p className="text-xs text-slate-500">
                  Describe a situation or click a preset on the left to see the AI operating system automatically classify the event, activate required agents, and generate a dynamic collaboration workflow.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

function selectedArrowInfo(elem: any): SelectedArrowInfo {
  return elem as SelectedArrowInfo;
}
