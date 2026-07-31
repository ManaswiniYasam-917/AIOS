import React, { useState, useEffect, useRef } from 'react';
import { useAIOS } from '../context/AIOSContext';
import {
  Play,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Clock,
  Activity,
  Shield,
  Radio
} from 'lucide-react';

// ─── Event Catalog ──────────────────────────────────────────────────────────
const EVENTS = [
  { id: 'accident',   label: 'Road Accident',       icon: '🚗', color: '#ef4444', desc: 'Vehicle collision or road emergency' },
  { id: 'fire',       label: 'Building Fire',        icon: '🔥', color: '#f97316', desc: 'Fire emergency in building or structure' },
  { id: 'flood',      label: 'Flood',                icon: '🌊', color: '#3b82f6', desc: 'Flooding due to heavy rainfall' },
  { id: 'military',   label: 'Border Intrusion',     icon: '🛡️', color: '#6366f1', desc: 'Security breach or intrusion detected' },
  { id: 'hospital',   label: 'Hospital Emergency',   icon: '🏥', color: '#ec4899', desc: 'Critical medical capacity exceeded' },
  { id: 'traffic',    label: 'Traffic Congestion',   icon: '🚦', color: '#eab308', desc: 'Severe traffic gridlock detected' },
  { id: 'factory',    label: 'Factory Failure',      icon: '🏭', color: '#8b5cf6', desc: 'Machine breakdown or industrial accident' },
  { id: 'power',      label: 'Power Grid Failure',   icon: '⚡', color: '#f59e0b', desc: 'Electrical grid or transformer failure' },
  { id: 'cyber',      label: 'Cyber Attack',         icon: '💻', color: '#10b981', desc: 'Ransomware, DDoS or network breach' },
  { id: 'airport',    label: 'Airport Operations',   icon: '✈️', color: '#06b6d4', desc: 'Flight delay, emergency or disruption' },
  { id: 'agriculture',label: 'Crop Emergency',       icon: '🌾', color: '#84cc16', desc: 'Crop disease or irrigation failure' },
  { id: 'space',      label: 'Space Mission Anomaly',icon: '🚀', color: '#a855f7', desc: 'Satellite malfunction or mission fault' },
];

// ─── Mission simulation steps per event ─────────────────────────────────────
const MISSIONS: Record<string, { action: string; progress: number; duration: number }[]> = {
  accident: [
    { action: 'Analyzing incident reports and CCTV feeds', progress: 10, duration: 1800 },
    { action: 'Activating emergency response agents', progress: 25, duration: 1400 },
    { action: 'Dispatching ambulances — ETA 4 min', progress: 42, duration: 1600 },
    { action: 'Coordinating hospital capacity — 4 beds reserved', progress: 58, duration: 1800 },
    { action: 'Rerouting highway traffic via alternate corridors', progress: 72, duration: 1600 },
    { action: 'Drone surveillance active — aerial feed streaming', progress: 86, duration: 1500 },
    { action: '✅ Mission complete — scene secured, all units on site', progress: 100, duration: 1200 },
  ],
  fire: [
    { action: 'Confirming fire source via sensor network', progress: 12, duration: 1600 },
    { action: 'Triggering building evacuation protocols', progress: 28, duration: 1500 },
    { action: 'Dispatching fire brigade — 3 units en route', progress: 44, duration: 1700 },
    { action: 'Coordinating power shutdown — utility agent active', progress: 60, duration: 1600 },
    { action: 'Ambulances on standby — hospital alerted', progress: 74, duration: 1500 },
    { action: 'Drone tracking fire spread — wind analysis active', progress: 88, duration: 1600 },
    { action: '✅ Mission complete — building cleared, fire contained', progress: 100, duration: 1200 },
  ],
  flood: [
    { action: 'Analyzing rainfall and water level data', progress: 10, duration: 1700 },
    { action: 'Predicting flood zones — weather model running', progress: 24, duration: 1800 },
    { action: 'Deploying rescue boats to affected areas', progress: 40, duration: 1600 },
    { action: 'Allocating emergency shelters — 3 centers opened', progress: 56, duration: 1700 },
    { action: 'Coordinating food & medical supply chains', progress: 72, duration: 1600 },
    { action: 'Drone fleet monitoring water levels in real-time', progress: 86, duration: 1500 },
    { action: '✅ Mission complete — citizens evacuated safely', progress: 100, duration: 1200 },
  ],
  military: [
    { action: 'Satellite imagery analysis in progress', progress: 10, duration: 1600 },
    { action: 'Radar systems confirming intrusion coordinates', progress: 24, duration: 1500 },
    { action: 'Drone swarm deployed for surveillance', progress: 40, duration: 1700 },
    { action: 'Intelligence agent gathering movement data', progress: 56, duration: 1800 },
    { action: 'Alerting command — recommending response plan', progress: 72, duration: 1600 },
    { action: 'Communication agent securing encrypted channels', progress: 86, duration: 1400 },
    { action: '✅ Mission complete — threat contained, report filed', progress: 100, duration: 1200 },
  ],
  hospital: [
    { action: 'Scanning ICU capacity across network of hospitals', progress: 12, duration: 1600 },
    { action: 'Identifying available beds at 4 nearby hospitals', progress: 26, duration: 1500 },
    { action: 'Scheduling patient transfers — ambulances dispatched', progress: 42, duration: 1700 },
    { action: 'Verifying blood bank availability — 3 types confirmed', progress: 58, duration: 1600 },
    { action: 'Coordinating doctor scheduling — 6 specialists alerted', progress: 74, duration: 1500 },
    { action: 'Pharmacy agent restocking critical medications', progress: 88, duration: 1400 },
    { action: '✅ Mission complete — all patients stabilized', progress: 100, duration: 1200 },
  ],
  traffic: [
    { action: 'Analyzing congestion data from traffic cameras', progress: 10, duration: 1500 },
    { action: 'Optimizing signal timing across 12 intersections', progress: 26, duration: 1600 },
    { action: 'Activating alternate route guidance', progress: 44, duration: 1500 },
    { action: 'Rerouting public transport — 8 buses redirected', progress: 60, duration: 1600 },
    { action: 'Navigation systems broadcasting live updates', progress: 76, duration: 1500 },
    { action: 'Congestion reducing — flow improved by 64%', progress: 90, duration: 1400 },
    { action: '✅ Mission complete — traffic normalized', progress: 100, duration: 1200 },
  ],
  factory: [
    { action: 'Diagnosing machine fault via sensor telemetry', progress: 12, duration: 1600 },
    { action: 'Safely stopping affected production line', progress: 26, duration: 1500 },
    { action: 'Dispatching maintenance team — ETA 8 min', progress: 42, duration: 1700 },
    { action: 'Robot agent taking over critical operations', progress: 58, duration: 1600 },
    { action: 'Inventory agent ordering replacement parts', progress: 74, duration: 1500 },
    { action: 'Safety agent clearing hazard zone perimeter', progress: 88, duration: 1400 },
    { action: '✅ Mission complete — factory operational at 80%', progress: 100, duration: 1200 },
  ],
  power: [
    { action: 'Isolating fault in power distribution network', progress: 12, duration: 1600 },
    { action: 'Activating backup grid for critical infrastructure', progress: 26, duration: 1700 },
    { action: 'Weather agent analyzing overload risk factors', progress: 44, duration: 1600 },
    { action: 'Maintenance team dispatched to transformer site', progress: 60, duration: 1700 },
    { action: 'Consumer notification agent alerting 12,000 users', progress: 76, duration: 1500 },
    { action: 'Power restoration in progress — 60% coverage restored', progress: 90, duration: 1500 },
    { action: '✅ Mission complete — full power restored', progress: 100, duration: 1200 },
  ],
  cyber: [
    { action: 'Isolating infected systems from network', progress: 12, duration: 1500 },
    { action: 'Threat intelligence agent mapping attack vector', progress: 26, duration: 1700 },
    { action: 'Blocking malicious traffic at 14 entry points', progress: 42, duration: 1600 },
    { action: 'Backup agent restoring clean system snapshots', progress: 58, duration: 1800 },
    { action: 'Network agent hardening firewall rules', progress: 74, duration: 1600 },
    { action: 'Incident response agent generating forensic report', progress: 88, duration: 1500 },
    { action: '✅ Mission complete — systems secured, report filed', progress: 100, duration: 1200 },
  ],
  airport: [
    { action: 'Analyzing delay causes — weather and ATC data', progress: 10, duration: 1600 },
    { action: 'Passenger agent sending notifications to 340 travelers', progress: 24, duration: 1500 },
    { action: 'Reassigning gates — 4 flights rescheduled', progress: 40, duration: 1700 },
    { action: 'Baggage handling agent updating routing', progress: 56, duration: 1600 },
    { action: 'Ground staff agent coordinating crew reallocation', progress: 72, duration: 1500 },
    { action: 'Airline agent submitting updated flight schedules', progress: 88, duration: 1400 },
    { action: '✅ Mission complete — operations resumed on schedule', progress: 100, duration: 1200 },
  ],
  agriculture: [
    { action: 'Crop monitoring agent identifying disease pattern', progress: 12, duration: 1700 },
    { action: 'Drone fleet scanning affected field areas', progress: 26, duration: 1600 },
    { action: 'Weather agent forecasting irrigation requirements', progress: 42, duration: 1500 },
    { action: 'Spraying drones treating 40 hectares of crops', progress: 58, duration: 1800 },
    { action: 'Fertilizer agent adjusting soil treatment plan', progress: 74, duration: 1600 },
    { action: 'Predicting crop impact — 12% yield loss projected', progress: 88, duration: 1500 },
    { action: '✅ Mission complete — disease contained, report ready', progress: 100, duration: 1200 },
  ],
  space: [
    { action: 'Diagnosing satellite subsystem fault', progress: 12, duration: 1700 },
    { action: 'Ground station agent establishing contact', progress: 26, duration: 1600 },
    { action: 'Navigation agent computing orbital correction', progress: 42, duration: 1800 },
    { action: 'Uploading reconfiguration commands to satellite', progress: 58, duration: 1700 },
    { action: 'Communication agent restoring data downlink', progress: 74, duration: 1600 },
    { action: 'Satellite telemetry normalizing — all systems green', progress: 88, duration: 1500 },
    { action: '✅ Mission complete — satellite operational', progress: 100, duration: 1200 },
  ],
};

// ─── Hidden agent details (for "View Details" panel) ─────────────────────────
const AGENT_DETAILS: Record<string, { agents: { name: string; status: string; doing: string }[]; log: string[] }> = {
  accident: {
    agents: [
      { name: 'Detection Agent',  status: '✅', doing: 'Monitoring CCTV feeds — incident confirmed' },
      { name: 'Ambulance Agent',  status: '🔄', doing: 'En route — ETA 3 minutes to scene' },
      { name: 'Hospital Agent',   status: '✅', doing: '4 trauma beds reserved at City General' },
      { name: 'Traffic Agent',    status: '🔄', doing: 'Highway 5 North closed — diversion active' },
      { name: 'Police Agent',     status: '✅', doing: '2 patrol units on scene, perimeter secured' },
      { name: 'Fire Agent',       status: '✅', doing: 'Standby — no fire detected, fuel monitored' },
      { name: 'Drone Agent',      status: '🔄', doing: 'Aerial feed at 200ft — crowd managed' },
    ],
    log: [
      'Hospital Agent → Trauma center alerted, 4 beds reserved',
      'Traffic Agent → Highway 5 North entry blocked',
      'Ambulance Agent → 2 units dispatched from station 4',
      'Drone Agent → Aerial surveillance active at 200ft',
      'Police Agent → Scene secured, witnesses interviewed',
    ],
  },
  fire: {
    agents: [
      { name: 'Detection Agent',    status: '✅', doing: 'Fire confirmed via smoke sensors — Floor 3' },
      { name: 'Fire Agent',         status: '🔄', doing: '3 fire trucks en route — ETA 6 min' },
      { name: 'Evacuation Agent',   status: '✅', doing: '400 people evacuated via exits B and D' },
      { name: 'Utility Agent',      status: '✅', doing: 'Power to floors 2-5 safely cut off' },
      { name: 'Hospital Agent',     status: '✅', doing: '2 ambulances on standby at perimeter' },
      { name: 'Police Agent',       status: '🔄', doing: 'Crowd control active, 50m exclusion zone' },
      { name: 'Drone Agent',        status: '🔄', doing: 'Thermal imaging tracking fire spread' },
    ],
    log: [
      'Evacuation Agent → Emergency PA system activated',
      'Utility Agent → Gas supply to building isolated',
      'Fire Agent → Water supply pressure confirmed',
      'Drone Agent → Hot spots identified on Floor 3 west wing',
      'Police Agent → Perimeter established, press area designated',
    ],
  },
  flood: {
    agents: [
      { name: 'Weather Agent',      status: '✅', doing: 'Flood model updated — 3 zones at risk' },
      { name: 'Rescue Boat Agent',  status: '🔄', doing: '6 boats deployed in zones A, B, C' },
      { name: 'Drone Agent',        status: '🔄', doing: 'Water level monitoring every 5 minutes' },
      { name: 'Shelter Agent',      status: '✅', doing: '3 shelters opened — 800 people capacity' },
      { name: 'Food Supply Agent',  status: '✅', doing: '2-day rations prepared for 500 people' },
      { name: 'Medical Agent',      status: '🔄', doing: 'Mobile medical units deployed to shelters' },
      { name: 'Traffic Agent',      status: '✅', doing: 'Low-lying roads closed, diversion active' },
    ],
    log: [
      'Weather Agent → Peak rainfall expected in 2 hours',
      'Rescue Boat Agent → 43 citizens rescued so far',
      'Shelter Agent → School gymnasium activated as shelter',
      'Food Supply Agent → Water purification units deployed',
      'Medical Agent → Waterborne disease kits distributed',
    ],
  },
  military: {
    agents: [
      { name: 'Surveillance Agent',   status: '✅', doing: 'Perimeter breach confirmed at sector 7' },
      { name: 'Drone Swarm Agent',    status: '🔄', doing: '12 drones tracking movement patterns' },
      { name: 'Satellite Agent',      status: '✅', doing: 'High-resolution imagery captured' },
      { name: 'Radar Agent',          status: '🔄', doing: 'Tracking 3 unknown signatures at border' },
      { name: 'Intelligence Agent',   status: '✅', doing: 'Threat profile analysis — medium threat' },
      { name: 'Communication Agent',  status: '✅', doing: 'Encrypted channel to command established' },
      { name: 'Command Agent',        status: '🔄', doing: 'Response plan submitted to commanders' },
    ],
    log: [
      'Satellite Agent → Thermal signatures detected, 3 individuals',
      'Radar Agent → Movement trajectory calculated',
      'Intelligence Agent → Cross-referencing threat database',
      'Drone Swarm Agent → Formation deployed for visual ID',
      'Command Agent → Alert level raised to BRAVO',
    ],
  },
  hospital: {
    agents: [
      { name: 'Hospital Agent',         status: '✅', doing: 'ICU at 98% — 3 transfers initiated' },
      { name: 'Ambulance Agent',        status: '🔄', doing: 'Transfer units en route to 2 patients' },
      { name: 'Blood Bank Agent',       status: '✅', doing: 'O+ and AB- available at Central Bank' },
      { name: 'Doctor Scheduling Agent',status: '✅', doing: '6 specialists on-call confirmed' },
      { name: 'Pharmacy Agent',         status: '🔄', doing: 'Critical medications restocked' },
    ],
    log: [
      'Hospital Agent → St. Mary Hospital — 2 ICU beds available',
      'Blood Bank Agent → Emergency supply dispatched',
      'Ambulance Agent → Patient 1 transfer ETA 7 minutes',
      'Doctor Scheduling Agent → Dr. Sharma on call, notified',
      'Pharmacy Agent → Ventilator supplies confirmed available',
    ],
  },
  traffic: {
    agents: [
      { name: 'Traffic Agent',         status: '🔄', doing: 'Signal timing optimized at 12 junctions' },
      { name: 'Signal Agent',          status: '✅', doing: 'Green wave corridor on Route 7 active' },
      { name: 'Camera Agent',          status: '✅', doing: 'Live monitoring 24 camera feeds' },
      { name: 'Public Transport Agent',status: '🔄', doing: '8 buses rerouted via north bypass' },
      { name: 'Navigation Agent',      status: '✅', doing: 'Alternate routes broadcast to 14K users' },
    ],
    log: [
      'Signal Agent → Junction 4 timing adjusted to 90s green',
      'Camera Agent → Incident at roundabout 3 detected',
      'Navigation Agent → 14,200 drivers rerouted successfully',
      'Public Transport Agent → Bus 47 via bypass, 3 min delay',
      'Traffic Agent → Flow improved by 64% on main corridor',
    ],
  },
  factory: {
    agents: [
      { name: 'Machine Agent',     status: '✅', doing: 'Bearing failure on Line 3 confirmed' },
      { name: 'Maintenance Agent', status: '🔄', doing: 'Team dispatched — ETA 8 minutes' },
      { name: 'Robot Agent',       status: '✅', doing: 'Taking over Line 3 critical operations' },
      { name: 'Inventory Agent',   status: '✅', doing: 'Part #A447 ordered — delivery 2 hours' },
      { name: 'Safety Agent',      status: '✅', doing: 'Hazard zone cleared, workers evacuated' },
    ],
    log: [
      'Machine Agent → Bearing temp exceeded 180°C — emergency stop',
      'Safety Agent → Line 3 access locked, personnel cleared',
      'Robot Agent → Assembly operations transferred to Robot-B',
      'Inventory Agent → Spare bearing in stock — picking in progress',
      'Maintenance Agent → Team lead confirmed, tools prepared',
    ],
  },
  power: {
    agents: [
      { name: 'Power Grid Agent',           status: '✅', doing: 'Fault isolated at Sector 12 transformer' },
      { name: 'Maintenance Agent',          status: '🔄', doing: 'Emergency team en route — ETA 15 min' },
      { name: 'Weather Agent',              status: '✅', doing: 'Overload risk low for next 6 hours' },
      { name: 'Consumer Notification Agent',status: '✅', doing: '12,400 customers notified via SMS/app' },
    ],
    log: [
      'Power Grid Agent → Backup grid activated for hospital zone',
      'Consumer Notification Agent → SMS sent to 12,400 customers',
      'Weather Agent → No lightning risk in 6-hour window',
      'Maintenance Agent → Transformer replacement truck en route',
      'Power Grid Agent → 60% coverage restored via alternate lines',
    ],
  },
  cyber: {
    agents: [
      { name: 'Security Agent',          status: '✅', doing: 'Ransomware isolated on 14 workstations' },
      { name: 'Threat Intelligence Agent',status: '✅', doing: 'Attack fingerprint matched — known group' },
      { name: 'Network Agent',           status: '🔄', doing: 'Blocking traffic at 14 malicious IPs' },
      { name: 'Backup Agent',            status: '🔄', doing: 'Restoring from clean snapshot — 68%' },
      { name: 'Incident Response Agent', status: '🔄', doing: 'Forensic analysis — evidence collected' },
    ],
    log: [
      'Security Agent → 14 endpoints quarantined from network',
      'Threat Intelligence Agent → LockBit variant identified',
      'Network Agent → Outbound C2 traffic blocked at firewall',
      'Backup Agent → Last clean backup — 6 hours ago, restoring',
      'Incident Response Agent → Forensic image created for analysis',
    ],
  },
  airport: {
    agents: [
      { name: 'Airport Agent',     status: '✅', doing: 'Delay cause: ATC congestion at destination' },
      { name: 'Airline Agent',     status: '🔄', doing: 'Updated schedule filed with ATC' },
      { name: 'Passenger Agent',   status: '✅', doing: '340 passengers notified — app & SMS' },
      { name: 'Baggage Agent',     status: '✅', doing: 'Baggage hold extended — no offloading' },
      { name: 'Ground Staff Agent',status: '🔄', doing: 'Crew reassignment for 3 delayed flights' },
    ],
    log: [
      'Passenger Agent → Gate B7 changed to B12 for Flight AX-204',
      'Airline Agent → AX-204 delay: 55 minutes, new ETD filed',
      'Ground Staff Agent → 2 crew members recalled from standby',
      'Baggage Agent → Carousel 4 extended for delayed connection',
      'Airport Agent → Lounge access granted to 45 premium passengers',
    ],
  },
  agriculture: {
    agents: [
      { name: 'Crop Monitoring Agent', status: '✅', doing: 'Fungal blight detected — 12% of east field' },
      { name: 'Drone Agent',           status: '🔄', doing: 'Spraying 40 hectares — 60% complete' },
      { name: 'Irrigation Agent',      status: '✅', doing: 'Irrigation reduced — fungus control mode' },
      { name: 'Weather Agent',         status: '✅', doing: 'Dry period forecast — favorable for treatment' },
      { name: 'Fertilizer Agent',      status: '🔄', doing: 'Adjusting NPK ratios for recovery growth' },
    ],
    log: [
      'Crop Monitoring Agent → Blight confirmed — Fusarium species',
      'Drone Agent → Fungicide spray started — east quadrant',
      'Irrigation Agent → Drip mode active — reducing leaf moisture',
      'Weather Agent → 4 dry days ahead — optimal spray window',
      'Fertilizer Agent → Potassium boost recommended post-treatment',
    ],
  },
  space: {
    agents: [
      { name: 'Satellite Agent',       status: '✅', doing: 'Attitude control system fault confirmed' },
      { name: 'Ground Station Agent',  status: '🔄', doing: 'Uplink established — command ready' },
      { name: 'Navigation Agent',      status: '✅', doing: 'Orbital correction trajectory computed' },
      { name: 'Communication Agent',   status: '🔄', doing: 'Restoring X-band downlink at 4 GHz' },
    ],
    log: [
      'Satellite Agent → Reaction wheel #3 failure detected',
      'Ground Station Agent → Emergency command mode activated',
      'Navigation Agent → Safe hold mode initiated, drift halted',
      'Communication Agent → Backup transponder online',
      'Satellite Agent → All subsystems nominal — orbit stable',
    ],
  },
};

// ─── Priority config ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  Low:      { color: 'bg-slate-100 text-slate-600 border-slate-200', active: 'bg-slate-600 text-white border-slate-600' },
  Medium:   { color: 'bg-blue-50 text-blue-600 border-blue-200', active: 'bg-blue-600 text-white border-blue-600' },
  High:     { color: 'bg-amber-50 text-amber-600 border-amber-200', active: 'bg-amber-500 text-white border-amber-500' },
  Critical: { color: 'bg-red-50 text-red-600 border-red-200', active: 'bg-red-600 text-white border-red-600' },
};

type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
type MissionPhase = 'idle' | 'active' | 'complete';

interface Mission {
  eventId: string;
  location: string;
  priority: Priority;
  phase: MissionPhase;
  stepIndex: number;
  progress: number;
  currentAction: string;
  startedAt: Date;
  completedAt?: Date;
}

interface EventControlCenterViewProps {
  theme: 'dark' | 'light';
}

export default function EventControlCenterView({ theme }: EventControlCenterViewProps) {
  const { addEvent, saveMissionToHistory, addCompletedMission } = useAIOS();
  const isDark = theme === 'dark';
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<Priority>('High');

  // ── Mission state ──────────────────────────────────────────────────────────
  const [mission, setMission] = useState<Mission | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // ── Timing refs ────────────────────────────────────────────────────────────
  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear timer on unmount
  useEffect(() => () => { if (stepTimer.current) clearTimeout(stepTimer.current); }, []);

  // ── Drive mission step transitions ────────────────────────────────────────
  useEffect(() => {
    if (!mission || mission.phase !== 'active') return;
    const steps = MISSIONS[mission.eventId];
    const step = steps[mission.stepIndex];
    if (!step) return;

    stepTimer.current = setTimeout(() => {
      setMission(prev => {
        if (!prev) return prev;
        const nextIndex = prev.stepIndex + 1;
        const nextStep = steps[nextIndex];
        if (!nextStep) {
          // Mission complete
          const mId = activeMissionId || `mission-${Date.now()}`;
          const currentEv = EVENTS.find(e => e.id === prev.eventId);
          const title = currentEv ? currentEv.label : 'Safety Mission';

          saveMissionToHistory(mId, {
            eventTitle: title,
            location: prev.location,
            duration: Math.floor((Date.now() - prev.startedAt.getTime()) / 1000),
            totalAgents: 4
          });
          addCompletedMission({
            id: mId,
            eventTitle: title,
            eventIcon: currentEv?.icon || '🚨',
            location: prev.location,
            startedAt: prev.startedAt.getTime(),
            completedAt: Date.now(),
            durationMin: Math.max(1, Math.round((Date.now() - prev.startedAt.getTime()) / 60000)),
            resolvedBy: ['ARES-1', 'HELIOS-4', 'MINERVA-7', 'HERMES-9'],
            configId: prev.eventId
          });

          return { ...prev, phase: 'complete', progress: 100, currentAction: step.action };
        }
        return { ...prev, stepIndex: nextIndex, progress: nextStep.progress, currentAction: nextStep.action };
      });
    }, step.duration);

    return () => { if (stepTimer.current) clearTimeout(stepTimer.current); };
  }, [mission?.stepIndex, mission?.phase]);

  // ── Start mission ─────────────────────────────────────────────────────────
  const startMission = () => {
    if (!selectedEventId) return;
    const steps = MISSIONS[selectedEventId];
    setShowDetails(false);
    const loc = location || 'Location not specified';
    setMission({
      eventId: selectedEventId,
      location: loc,
      priority,
      phase: 'active',
      stepIndex: 0,
      progress: steps[0].progress,
      currentAction: steps[0].action,
      startedAt: new Date(),
    });

    addEvent({
      id: `temp-${Date.now()}`,
      type: selectedEventId,
      location: loc,
      severity: priority === 'Critical' ? 90 : priority === 'High' ? 75 : 50,
      timestamp: Date.now()
    }).then(res => {
      if (res && res.missionId) {
        setActiveMissionId(res.missionId);
      }
    }).catch(err => {
      console.error('[EventControlCenter] Error saving event to DB:', err);
    });
  };

  const resetMission = () => {
    if (stepTimer.current) clearTimeout(stepTimer.current);
    setMission(null);
    setShowDetails(false);
  };

  const event = EVENTS.find(e => e.id === selectedEventId);
  const details = mission ? AGENT_DETAILS[mission.eventId] : null;
  const missionEvent = mission ? EVENTS.find(e => e.id === mission.eventId) : null;

  // ── Elapsed time formatter ────────────────────────────────────────────────
  const elapsed = mission
    ? Math.floor((Date.now() - mission.startedAt.getTime()) / 1000)
    : 0;
  const etaText = mission?.phase === 'complete'
    ? '—'
    : `~${Math.max(0, Math.ceil((100 - (mission?.progress || 0)) / 10))} min`;

  // ── Styles ────────────────────────────────────────────────────────────────
  const bg    = isDark ? 'bg-slate-950' : 'bg-slate-50';
  const card  = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const label = isDark ? 'text-slate-400' : 'text-slate-500';
  const title = isDark ? 'text-white' : 'text-slate-900';
  const sub   = isDark ? 'text-slate-500' : 'text-slate-400';

  // ─────────────────────────────────────────────────────────────────────────
  // IDLE — Mission Selection Form
  // ─────────────────────────────────────────────────────────────────────────
  if (!mission) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-4">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border"
            style={{ background: isDark ? '#1e1b4b' : '#eef2ff', color: '#818cf8', borderColor: isDark ? '#312e81' : '#c7d2fe' }}>
            <Radio className="h-3 w-3 animate-pulse" />
            AIOS — Autonomous Intelligence Operating System
          </div>
          <h1 className={`text-3xl font-bold tracking-tight ${title}`}>What's happening?</h1>
          <p className={`text-base ${label}`}>Select an event. AIOS handles the rest.</p>
        </div>

        {/* Event Grid */}
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${sub}`}>Select Event Type</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {EVENTS.map(ev => {
              const isSelected = selectedEventId === ev.id;
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'ring-2 shadow-md'
                      : isDark
                        ? 'border-slate-800 bg-slate-900 hover:border-slate-600'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                  style={isSelected ? { borderColor: ev.color, ringColor: ev.color, boxShadow: `0 0 0 2px ${ev.color}40` } : {}}
                >
                  <span className="text-2xl mb-2 block leading-none">{ev.icon}</span>
                  <span className={`text-xs font-semibold block leading-snug ${isSelected ? '' : title}`}
                    style={isSelected ? { color: ev.color } : {}}>
                    {ev.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location + Priority + Submit */}
        {selectedEventId && (
          <div className={`rounded-2xl border p-6 space-y-5 ${card}`} style={{ animation: 'fadeIn 0.3s ease' }}>
            
            {/* Selected event info */}
            <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: isDark ? '#1e293b' : '#f1f5f9' }}>
              <span className="text-3xl">{event?.icon}</span>
              <div>
                <h3 className={`font-bold text-base ${title}`}>{event?.label}</h3>
                <p className={`text-xs ${label}`}>{event?.desc}</p>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className={`text-xs font-semibold block mb-1.5 ${label}`}>
                <MapPin className="h-3.5 w-3.5 inline mr-1" />
                Location (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai, Highway 5 — or leave blank"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className={`w-full text-sm rounded-xl px-4 py-3 border outline-none transition-colors ${
                  isDark
                    ? 'bg-slate-800 text-white border-slate-700 placeholder-slate-600 focus:border-indigo-500'
                    : 'bg-slate-50 text-slate-800 border-slate-200 placeholder-slate-400 focus:border-indigo-400 focus:bg-white'
                }`}
              />
            </div>

            {/* Priority */}
            <div>
              <label className={`text-xs font-semibold block mb-2 ${label}`}>Priority</label>
              <div className="flex gap-2">
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      priority === p
                        ? PRIORITY_CONFIG[p].active
                        : PRIORITY_CONFIG[p].color
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Start */}
            <button
              onClick={startMission}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${event?.color}dd, ${event?.color})`, boxShadow: `0 4px 24px ${event?.color}40` }}
            >
              <Play className="h-4 w-4 fill-white" />
              Start Mission
            </button>
          </div>
        )}

        {/* Bottom hint */}
        <p className={`text-center text-xs ${sub}`}>
          AIOS automatically selects and activates the required AI agents for each event.
        </p>

      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ACTIVE / COMPLETE — Mission Progress View
  // ─────────────────────────────────────────────────────────────────────────
  const isComplete = mission.phase === 'complete';
  const statusColor = isComplete ? '#10b981' : missionEvent?.color || '#818cf8';
  const agentCount = details?.agents.length || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4">

      {/* Mission Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{missionEvent?.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold ${title}`}>{missionEvent?.label}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                mission.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                mission.priority === 'High' ? 'bg-amber-500/20 text-amber-400' :
                mission.priority === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {mission.priority}
              </span>
            </div>
            <p className={`text-sm flex items-center gap-1 mt-0.5 ${label}`}>
              <MapPin className="h-3.5 w-3.5" />
              {mission.location}
            </p>
          </div>
        </div>
        <button
          onClick={resetMission}
          className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
            isDark ? 'border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800' : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
        >
          <X className="h-3.5 w-3.5" />
          End
        </button>
      </div>

      {/* Main Mission Card */}
      <div className={`rounded-2xl border p-6 space-y-5 ${card}`}>

        {/* Status Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${sub}`}>Status</p>
            <p className="text-sm font-bold flex items-center gap-2" style={{ color: statusColor }}>
              {isComplete
                ? <><CheckCircle className="h-4 w-4" /> Mission Complete</>
                : <><span className="h-2 w-2 rounded-full animate-pulse inline-block" style={{ background: statusColor }} /> Responding</>
              }
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${sub}`}>AIOS Agents Active</p>
            <p className={`text-sm font-bold ${title}`}>
              {agentCount} agents working
            </p>
          </div>
        </div>

        {/* Current Action */}
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${sub}`}>Current Action</p>
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            {isComplete
              ? <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              : <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin" style={{ color: statusColor }} />
            }
            <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              {mission.currentAction}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${sub}`}>Progress</p>
            <p className="text-sm font-bold font-mono" style={{ color: statusColor }}>{mission.progress}%</p>
          </div>
          <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${mission.progress}%`, background: `linear-gradient(to right, ${statusColor}aa, ${statusColor})` }}
            />
          </div>
        </div>

        {/* ETA + Elapsed */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${sub}`}>
              <Clock className="h-3 w-3 inline mr-1" />ETA
            </p>
            <p className={`text-sm font-semibold ${title}`}>{isComplete ? 'Completed' : etaText}</p>
          </div>
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${sub}`}>
              <Activity className="h-3 w-3 inline mr-1" />Elapsed
            </p>
            <p className={`text-sm font-semibold ${title}`}>{elapsed}s</p>
          </div>
        </div>

        {/* Mission Outcome (when complete) */}
        {isComplete && (
          <div className="p-4 rounded-xl border" style={{ background: '#10b98110', borderColor: '#10b98130' }}>
            <p className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Mission Outcome
            </p>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              AIOS successfully coordinated {agentCount} agents to handle the {missionEvent?.label.toLowerCase()} event. All objectives completed. A full mission report is available.
            </p>
          </div>
        )}
      </div>

      {/* View Details toggle */}
      <button
        onClick={() => setShowDetails(v => !v)}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all ${
          isDark
            ? 'border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white'
            : 'border-slate-200 text-slate-500 hover:bg-white hover:text-slate-800'
        }`}
      >
        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showDetails ? 'Hide Details' : 'View Details — see what AIOS is doing'}
      </button>

      {/* Details Panel (progressive disclosure) */}
      {showDetails && details && (
        <div className={`rounded-2xl border p-5 space-y-5 ${card}`} style={{ animation: 'fadeIn 0.25s ease' }}>
          
          {/* Agent list */}
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${sub}`}>
              Agents AIOS Activated ({agentCount})
            </p>
            <div className="space-y-2">
              {details.agents.map((agent, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}
                >
                  <span className="text-base leading-none mt-0.5 shrink-0">{agent.status}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${title}`}>{agent.name}</p>
                    <p className={`text-[11px] mt-0.5 ${label}`}>{agent.doing}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live log */}
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${sub}`}>Recent Activity</p>
            <div className="space-y-1.5">
              {details.log.map((entry, i) => (
                <div key={i} className={`flex items-start gap-2.5 text-xs py-1.5 border-b last:border-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <span className={`shrink-0 font-mono ${sub}`} style={{ fontSize: 10 }}>
                    {new Date(Date.now() - (details.log.length - 1 - i) * 45000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry}</span>
                </div>
              ))}
            </div>
          </div>

          <p className={`text-[10px] text-center ${sub}`}>
            This is AIOS working autonomously. You don't need to manage any of this manually.
          </p>
        </div>
      )}

      {/* New Mission button (when complete) */}
      {isComplete && (
        <button
          onClick={resetMission}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 24px #6366f140' }}
        >
          Start a New Mission
        </button>
      )}

    </div>
  );
}
