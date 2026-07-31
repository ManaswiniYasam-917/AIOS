import React from 'react';
import { X, Cpu, Server, Activity, ArrowRight, Shield } from 'lucide-react';

interface TelemetryInspectorProps {
  componentName: string | null;
  onClose: () => void;
  theme: 'dark' | 'light';
}

interface InspectorData {
  name: string;
  status: string;
  purpose: string;
  action: string;
  input: string[];
  output: string[];
  tech: string[];
}

const DATA_REGISTRY: Record<string, InspectorData> = {
  // Agents
  'Hospital': {
    name: 'Hospital Agent',
    status: 'ACTIVE_TRIAGE',
    purpose: 'Scan regional emergency room bed availability, pre-register trauma beds, and alert surgical teams.',
    action: 'Reserving nearest ICU beds and notifying surgeon roster.',
    input: ['Incident Latitude/Longitude', 'Victim Count: 3', 'Trauma Severity: High'],
    output: ['Hospital ID: Apollo Main', '2 ICU Beds Reserved', 'Surgical Standby: Active'],
    tech: ['FastAPI', 'LangGraph', 'Hospital Triage API']
  },
  'Hospital Agent': {
    name: 'Hospital Agent',
    status: 'ACTIVE_TRIAGE',
    purpose: 'Scan regional emergency room bed availability, pre-register trauma beds, and alert surgical teams.',
    action: 'Reserving nearest ICU beds and notifying surgeon roster.',
    input: ['Incident Latitude/Longitude', 'Victim Count: 3', 'Trauma Severity: High'],
    output: ['Hospital ID: Apollo Main', '2 ICU Beds Reserved', 'Surgical Standby: Active'],
    tech: ['FastAPI', 'LangGraph', 'Hospital Triage API']
  },
  'Ambulance': {
    name: 'Ambulance Agent',
    status: 'TRANSIT_ACTIVE',
    purpose: 'Locate nearest responder unit, dispatch driver with priority route optimization, and transmit live transit telemetry.',
    action: 'En route to MG Road collision scene. Current speed: 64km/h.',
    input: ['Origin Depot GPS', 'Scene GPS coordinates', 'Optimal path coordinates'],
    output: ['Unit ID: AMB_04 & AMB_09', 'Driver Dispatched', 'ETA: 4 min'],
    tech: ['Python', 'Google Maps Directions API', 'Node-RED IoT']
  },
  'Ambulance Agent': {
    name: 'Ambulance Agent',
    status: 'TRANSIT_ACTIVE',
    purpose: 'Locate nearest responder unit, dispatch driver with priority route optimization, and transmit live transit telemetry.',
    action: 'En route to MG Road collision scene. Current speed: 64km/h.',
    input: ['Origin Depot GPS', 'Scene GPS coordinates', 'Optimal path coordinates'],
    output: ['Unit ID: AMB_04 & AMB_09', 'Driver Dispatched', 'ETA: 4 min'],
    tech: ['Python', 'Google Maps Directions API', 'Node-RED IoT']
  },
  'Police': {
    name: 'Police Agent',
    status: 'SCENE_SECURED',
    purpose: 'Establish secure perimeter bounds, lock down lanes, divert general flow, and maintain scene safety.',
    action: 'Perimeter cones set. Redirecting southbound traffic to Bypass Lane 2.',
    input: ['Scene location', 'Active bypass points', 'Perimeter radius: 100m'],
    output: ['Scene status: Secured', 'Bypass diverted', 'Local unit active: Cruiser 12'],
    tech: ['LangChain', 'ROS (Robot OS)', 'Traffic Cam Analytics API']
  },
  'Police Agent': {
    name: 'Police Agent',
    status: 'SCENE_SECURED',
    purpose: 'Establish secure perimeter bounds, lock down lanes, divert general flow, and maintain scene safety.',
    action: 'Perimeter cones set. Redirecting southbound traffic to Bypass Lane 2.',
    input: ['Scene location', 'Active bypass points', 'Perimeter radius: 100m'],
    output: ['Scene status: Secured', 'Bypass diverted', 'Local unit active: Cruiser 12'],
    tech: ['LangChain', 'ROS (Robot OS)', 'Traffic Cam Analytics API']
  },
  'Traffic': {
    name: 'Traffic Agent',
    status: 'GREEN_CORRIDOR_ACTIVE',
    purpose: 'Optimize signal timers at regional junctions to create conflict-free lanes for response dispatches.',
    action: 'Junctions 4, 5 and 6 green lights locked. General cross-traffic held.',
    input: ['Ambulance real-time GPS', 'Local queue lengths', 'Signal timing schedules'],
    output: ['Green corridor: Active', 'Cross-traffic hold sequence: ON'],
    tech: ['FastAPI', 'SUMO (Simulation of Urban MObility)', 'Raspberry Pi Controller']
  },
  'Traffic Agent': {
    name: 'Traffic Agent',
    status: 'GREEN_CORRIDOR_ACTIVE',
    purpose: 'Optimize signal timers at regional junctions to create conflict-free lanes for response dispatches.',
    action: 'Junctions 4, 5 and 6 green lights locked. General cross-traffic held.',
    input: ['Ambulance real-time GPS', 'Local queue lengths', 'Signal timing schedules'],
    output: ['Green corridor: Active', 'Cross-traffic hold sequence: ON'],
    tech: ['FastAPI', 'SUMO (Simulation of Urban MObility)', 'Raspberry Pi Controller']
  },
  'Drone': {
    name: 'Drone Agent',
    status: 'SURVEILLANCE_ACTIVE',
    purpose: 'Deploy autonomous drone flight to hover above incident scene, streaming live optical and thermal telemetry.',
    action: 'Hovering at 45m. Streaming optical HD feed to AIOS core.',
    input: ['Incident coordinates', 'Altitude restrictions', 'Drone battery status: 84%'],
    output: ['Live video stream active', 'Thermal anomaly mapping complete'],
    tech: ['Python PX4 API', 'RTSP Streamer Server', 'OpenCV Thermal Processing']
  },
  'Drone Agent': {
    name: 'Drone Agent',
    status: 'SURVEILLANCE_ACTIVE',
    purpose: 'Deploy autonomous drone flight to hover above incident scene, streaming live optical and thermal telemetry.',
    action: 'Hovering at 45m. Streaming optical HD feed to AIOS core.',
    input: ['Incident coordinates', 'Altitude restrictions', 'Drone battery status: 84%'],
    output: ['Live video stream active', 'Thermal anomaly mapping complete'],
    tech: ['Python PX4 API', 'RTSP Streamer Server', 'OpenCV Thermal Processing']
  },
  'Fire Brigade': {
    name: 'Fire Brigade Agent',
    status: 'ACTIVE_CONTAINMENT',
    purpose: 'Dispatch heavy fire engine responders, connect local hydrants, and execute fire suppression procedures.',
    action: 'Suppressing core fire zone. Checking structures for heat signatures.',
    input: ['Fire Coordinates', 'Hazard Severity: High', 'Hydrant GPS points'],
    output: ['3 Engines Dispatched', 'Water containment active'],
    tech: ['Python', 'IoT Water Flow APIs', 'Thermal Camera Mapper']
  },
  'Rescue Team': {
    name: 'Rescue Team Agent',
    status: 'ACTIVE_EVAC',
    purpose: 'Deploy rescue watercraft, issue flotation jackets, and run localized evacuation loops.',
    action: 'Navigating flood sectors to evacuate trapped citizens.',
    input: ['Water Levels', 'Citizen Distress GPS points', 'Boat telemetry'],
    output: ['Evacuation loop: Active', '12 Citizens Relocated'],
    tech: ['FastAPI', 'GIS Map Services', 'ROS Nav2']
  },
  'Power Utility': {
    name: 'Power Utility Agent',
    status: 'GRID_ISOLATED',
    purpose: 'Detect grid circuit anomalies, isolate fault nodes, and reroute active backup grids.',
    action: 'Isolating Substation B circuit node to prevent arc flashes.',
    input: ['Grid Telemetry Indexes', 'Fault Line coordinates'],
    output: ['Grid Node Isolated', 'Backup loop active'],
    tech: ['Python SciPy', 'Grid Telemetry Protocol API']
  },
  'Defense': {
    name: 'Defense Agent',
    status: 'PERIMETER_MONITORED',
    purpose: 'Coordinate boundary defense surveillance sensors, issue warnings, and alert tactical forces.',
    action: 'Running localized scan. Scanning sector boundary grid.',
    input: ['Radar telemetry', 'Border coordinate logs'],
    output: ['Sensor sweeps: Active', 'Encrypted line secured'],
    tech: ['FastAPI', 'Defense Comms API', 'Whisper']
  },
  // Flow Modules
  'Event': {
    name: 'Event Ingestion Node',
    status: 'ROUTING_ACTIVE',
    purpose: 'Ingest emergency requests through various pipelines (voice transcriptions, image streams, manual prompts) and map to a unified schema.',
    action: 'Parsing raw input data queue and generating incident record.',
    input: ['Voice audio buffers', 'Uploaded image bytes', 'Emergency message strings'],
    output: ['Event Object ID: event_049', 'Incident Class: Road Accident', 'Structured payload generated'],
    tech: ['Whisper Audio API', 'JSON Schema validation', 'RabbitMQ Ingestion']
  },
  'Event Collection': {
    name: 'Event Ingestion Node',
    status: 'ROUTING_ACTIVE',
    purpose: 'Ingest emergency requests through various pipelines (voice transcriptions, image streams, manual prompts) and map to a unified schema.',
    action: 'Parsing raw input data queue and generating incident record.',
    input: ['Voice audio buffers', 'Uploaded image bytes', 'Emergency message strings'],
    output: ['Event Object ID: event_049', 'Incident Class: Road Accident', 'Structured payload generated'],
    tech: ['Whisper Audio API', 'JSON Schema validation', 'RabbitMQ Ingestion']
  },
  'AIOS Brain': {
    name: 'AIOS Brain Core',
    status: 'ORCHESTRATING',
    purpose: 'The central orchestration system of the AI operating system. Generates reasoning frames, invokes sub-planners, and allocates agent access tokens.',
    action: 'Running incident evaluation model. Reasoning: "Accident reported at MG Road. Severe bottleneck detected. High likelihood of casualties. Requiring ambulance dispatch and traffic override."',
    input: ['Structured Event Object', 'Global System States', 'Role permissions mapping'],
    output: ['Evaluated Severity Index: 88', 'Unified Agent Dispatches Triggered'],
    tech: ['Google Gemini API', 'Pydantic Logfire', 'LangChain Core']
  },
  'Mission Planning': {
    name: 'Mission Planner Engine',
    status: 'STRATEGY_GENERATED',
    purpose: 'Generate step-by-step dispatch workflows and procedural action sequences. Monitors milestones and runs recovery steps if checkpoints fail.',
    action: 'Validating active checklist timelines and tracking responder ETAs.',
    input: ['Incident class', 'Assigned agent capacities', 'Resource metrics'],
    output: ['Milestone Graph: 6 Checkpoints', 'Active Thread initialized'],
    tech: ['Temporal.io', 'Node.js runtime', 'Pydantic Planners']
  },
  'Completed': {
    name: 'Telemetry Resolution Node',
    status: 'RESOLUTION_ACTIVE',
    purpose: 'Log full audit logs, measure responder performance indices, release occupied agent channels, and archive datasets.',
    action: 'Writing incident logs to persistent database and updating success indexes.',
    input: ['Active mission audit logs', 'Agent message registers'],
    output: ['Mission status updated: Success', 'All tokens recycled'],
    tech: ['PostgreSQL DB Client', 'Python Post-Analytics']
  }
};

export default function TelemetryInspector({ componentName, onClose, theme }: TelemetryInspectorProps) {
  if (!componentName) return null;

  // Retrieve data, fallback to generic template
  const data = DATA_REGISTRY[componentName] || {
    name: componentName,
    status: 'ONLINE',
    purpose: 'Core AIOS subsystem node handling telemetry routing or tool execution.',
    action: 'Idle. Ready to receive instruction sequences.',
    input: ['System context handle', 'Active thread parameters'],
    output: ['Execution status: OK'],
    tech: ['TypeScript', 'Vite', 'React']
  };

  const isDark = theme === 'dark';

  return (
    <div className={`fixed top-0 right-0 h-full w-80 md:w-96 shadow-2xl z-50 flex flex-col transition-transform duration-300 animate-slide-left border-l ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-950'
    }`}>
      
      {/* Drawer Header */}
      <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <Cpu className="h-4.5 w-4.5 text-blue-400" />
          <div>
            <h3 className="text-xs font-bold font-mono tracking-tight">{data.name}</h3>
            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
              data.status.includes('ACTIVE') || data.status.includes('TRANSIT') || data.status.includes('RUNNING') || data.status.includes('SCENE') || data.status.includes('CORRIDOR')
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {data.status}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isDark ? 'border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Purpose */}
        <div className="space-y-1.5">
          <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider font-mono">Purpose</span>
          <p className="text-xs leading-relaxed opacity-85">
            {data.purpose}
          </p>
        </div>

        {/* Current Action */}
        <div className="space-y-1.5">
          <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider font-mono">Current Action</span>
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-200'}`}>
            {data.action}
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-2">
          <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider font-mono">Input Telemetry</span>
          <div className="space-y-1.5">
            {data.input.map((inp, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[10.5px] font-mono opacity-80">
                <span className="text-blue-500 font-bold shrink-0">&gt;</span>
                <span>{inp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-2">
          <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider font-mono">Output Telemetry</span>
          <div className="space-y-1.5">
            {data.output.map((out, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[10.5px] font-mono opacity-80">
                <span className="text-emerald-500 font-bold shrink-0">#</span>
                <span>{out}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="space-y-2.5">
          <span className="text-[9px] uppercase font-bold text-slate-500 block tracking-wider font-mono">Subsystem Tech Stack</span>
          <div className="flex flex-wrap gap-1.5">
            {data.tech.map((t, idx) => (
              <span 
                key={idx} 
                className={`text-[9.5px] font-bold font-mono px-2 py-1 rounded border ${
                  isDark ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Drawer Footer */}
      <div className={`p-4 text-center font-mono text-[9px] opacity-40 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        SECURE CONNECTED CHANNEL
      </div>

    </div>
  );
}
