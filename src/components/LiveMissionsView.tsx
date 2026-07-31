import React, { useState, useEffect } from 'react';
import { useAIOS, Mission } from '../context/AIOSContext';
import { 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  Activity
} from 'lucide-react';
import { AuditLog, AgentMessage } from '../types';
import { EVENT_CONFIGS, ALL_AGENTS_LIST, classifyEvent } from '../eventEngine';

interface LiveMissionsViewProps {
  theme: 'dark' | 'light';
  isDeveloperMode: boolean;
  onOpenInspector: (name: string) => void;
  logs: AuditLog[];
  messages: AgentMessage[];
  onNavigate: (tab: string) => void;
}

const ALL_AGENTS = ALL_AGENTS_LIST;

export default function LiveMissionsView({
  theme,
  isDeveloperMode,
  onOpenInspector,
  logs,
  messages,
  onNavigate
}: LiveMissionsViewProps) {
  const { missions, events } = useAIOS();
  const [showTechnicalInline, setShowTechnicalInline] = useState(false);
  const [baseTime, setBaseTime] = useState<string>('10:42');

  const isDark = theme === 'dark';
  const activeMission = missions.length > 0 ? missions[missions.length - 1] : null;
  const activeEvent = activeMission ? events.find(e => e.id === activeMission.eventId) : null;

  useEffect(() => {
    if (activeMission) {
      const d = new Date(Number(activeMission.id.split('-')[1]) || Date.now());
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      setBaseTime(`${hh}:${mm}`);
    }
  }, [activeMission]);

  if (!activeMission) {
    return (
      <div className={`max-w-xl mx-auto py-20 text-center space-y-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        <div className="text-4xl animate-bounce">🌍</div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-base">No Operational Response Running</h3>
          <p className="text-xs opacity-60">Everything is secure. Go to the Event Center to request assistance.</p>
        </div>
        <button 
          onClick={() => onNavigate('events')} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Go to Event Center
        </button>
      </div>
    );
  }

  const prog = activeMission.progress;
  const isCompleted = activeMission.status === 'completed' || prog === 100;
  
  // Custom 15-character text progress bar
  const totalBlocks = 15;
  const filledBlocks = Math.round((prog / 100) * totalBlocks);
  const progressBarText = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);

  // Determine active incident type configuration
  const eventText = activeEvent?.type || activeMission?.eventId || '';
  const configId = classifyEvent(eventText);
  const config = EVENT_CONFIGS[configId] || EVENT_CONFIGS.road_accident;

  const title = config.icon + ' ' + config.title;
  const location = activeEvent?.location || config.location;
  const reasoningPoints = config.reasoning;
  const outcomeActions = config.outcomeActions;

  // Setup checklist based on config.workflow and progress percentage
  const totalSteps = config.workflow.length;
  const checklist = config.workflow.map((wStep, idx) => {
    const stepThreshold = (idx / totalSteps) * 100;
    const nextStepThreshold = ((idx + 1) / totalSteps) * 100;
    
    let status: 'check' | 'running' | 'waiting' = 'waiting';
    if (isCompleted || prog >= nextStepThreshold) {
      status = 'check';
    } else if (prog >= stepThreshold && prog < nextStepThreshold) {
      status = 'running';
    }

    return {
      label: wStep.title,
      status
    };
  });

  // Active agents ids
  const activeIds = isCompleted ? [] : config.agents;
  const activeStepIdx = isCompleted ? -1 : Math.min(Math.floor((prog / 100) * totalSteps), totalSteps - 1);
  const currentStepAgentName = activeStepIdx >= 0 ? config.workflow[activeStepIdx].agentName : '';
  
  // Map ALL_AGENTS_LIST to state
  const agentsWithStates = ALL_AGENTS.map(agent => {
    if (agent.id === 'agriculture') {
      return { ...agent, state: 'offline' as const, statusLabel: 'Offline - Calibration Error' };
    }

    let state: 'active' | 'preparing' | 'standby' = 'standby';
    let statusLabel = 'Standby Mode';

    const isNodeActive = activeIds.includes(agent.id) || 
                         activeIds.includes(agent.name) || 
                         activeIds.some(x => x.toLowerCase().includes(agent.code.toLowerCase()) || agent.name.toLowerCase().includes(x.toLowerCase()));

    if (isNodeActive) {
      if (agent.name === currentStepAgentName || (currentStepAgentName && currentStepAgentName.toLowerCase().includes(agent.code.toLowerCase()))) {
        state = 'active';
        statusLabel = 'Active - Executing Task';
      } else {
        state = 'preparing';
        statusLabel = 'Active - Syncing';
      }
    }

    return { ...agent, state, statusLabel };
  });

  const activeOrPrepAgents = agentsWithStates.filter(a => a.state === 'active' || a.state === 'preparing');
  const standbyOrOfflineAgents = agentsWithStates.filter(a => a.state === 'standby' || a.state === 'offline');

  // Determine currentStepText narrative dynamically
  let currentStepText = 'AIOS Brain is generating dispatch instructions...';
  if (isCompleted) {
    currentStepText = 'All units secure. Incident resolved successfully!';
  } else if (config.currentStepTexts && config.currentStepTexts[activeStepIdx]) {
    currentStepText = config.currentStepTexts[activeStepIdx];
  } else {
    currentStepText = `Executing ${config.workflow[activeStepIdx]?.title || 'tasks'}...`;
  }

  return (
    <div className={`space-y-8 max-w-4xl mx-auto pb-10 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Back & Status Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => onNavigate('events')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
            isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
          }`}
        >
          ← Go to Command Center
        </button>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Active Response Console</span>
        </div>
      </div>

      {/* Main dashboard view */}
      <div className={`p-6 rounded-2xl border space-y-6 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        
        {/* Incident Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
          <div>
            <h3 className="font-extrabold text-2xl tracking-tight mt-0.5">{title}</h3>
            <span className="text-xs opacity-60 mt-1 block">📍 {location}</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold block text-blue-500">Status</span>
            <span className="text-sm font-extrabold block text-emerald-400">
              {isCompleted ? '✅ Mission Completed' : '🟢 AIOS is responding...'}
            </span>
          </div>
        </div>

        {/* Text progress bar */}
        <div className="space-y-2 p-4 bg-slate-950/40 border border-slate-800/85 rounded-xl">
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">AIOS is helping...</span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="font-mono text-xs text-blue-400 font-bold tracking-widest">
              {progressBarText} {prog}%
            </span>
            <span className="text-xs font-semibold opacity-90">
              Current Step: <span className="text-blue-400">{currentStepText}</span>
            </span>
          </div>
        </div>

        {/* Simplified Timeline Checklist */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">What is happening?</span>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold">
            {checklist.map((item, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  item.status === 'check' 
                    ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' 
                    : item.status === 'running' 
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                    : 'bg-slate-950 border-slate-850 opacity-40'
                }`}
              >
                <span>{item.label}</span>
                {item.status === 'check' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                {item.status === 'running' && <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin shrink-0" />}
                {item.status === 'waiting' && <span className="opacity-55">⏳</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Double Column: Who is Working & Why AIOS did this */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Who is Working (Active vs Standby Agents) */}
          <div className="space-y-6">
            
            {/* Active / Preparing Section */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">
                Active Agents ({activeOrPrepAgents.length})
              </span>
              
              <div className="space-y-2">
                {activeOrPrepAgents.length === 0 ? (
                  <div className="text-xs italic opacity-45 py-2">No agents active. All returned to Standby.</div>
                ) : (
                  activeOrPrepAgents.map((worker) => (
                    <button
                      key={worker.id}
                      onClick={() => onOpenInspector(worker.code)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer ${
                        isDark ? 'bg-slate-950/40 border-slate-850/80 hover:bg-slate-900/60' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{worker.icon}</span>
                        <span>{worker.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${worker.state === 'active' ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
                        <span className="opacity-55 text-[10px] font-mono capitalize">{worker.state}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Standby Section */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">
                Standby Agents
              </span>
              
              <div className="flex flex-wrap gap-2">
                {standbyOrOfflineAgents.map((worker) => {
                  const isOffline = worker.state === 'offline';
                  return (
                    <button
                      key={worker.id}
                      onClick={() => onOpenInspector(worker.code)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[10.5px] font-semibold transition-all cursor-pointer ${
                        isOffline 
                          ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:border-red-500' 
                          : isDark ? 'border-slate-850 bg-slate-950/60 text-slate-400 hover:border-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <span className="text-[11px]">{worker.icon}</span>
                      <span>{worker.name.replace(' Agent', '')}</span>
                      <span className={`h-1 w-1 rounded-full ${isOffline ? 'bg-red-500' : 'bg-slate-400'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Why AIOS did this */}
          <div className="space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">Why AIOS did this</span>
            
            <div className={`p-5 rounded-xl border space-y-4 h-full ${
              isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-250 shadow-inner'
            }`}>
              {/* Reasoning points */}
              <div className="space-y-1.5">
                {reasoningPoints.map((pt, idx) => (
                  <p key={idx} className="text-xs leading-relaxed opacity-85">
                    • {pt}
                  </p>
                ))}
              </div>

              {/* Action checklist */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">AIOS sent:</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  {outcomeActions.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-300">
                      <span className="text-emerald-500 font-extrabold">✔</span>
                      <span>{act.split(' ')[1] || act}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* AIOS Decision Logic flowchart diagram */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">AIOS Decision Logic</span>
          
          <div className={`p-4 rounded-xl border overflow-x-auto flex items-center gap-2 min-w-full justify-start md:justify-center ${
            isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-200'
          }`}>
            {[
              { label: 'Problem Detected' },
              { label: 'AIOS Understands' },
              { label: 'Select Required' },
              { label: 'Others in Standby' },
              { label: 'Execute Mission' },
              { label: 'Monitor Progress' },
              { label: 'Activate More' },
              { label: 'Completed' },
              { label: 'Return to Standby' }
            ].map((node, idx) => {
              // Highlight based on current progress step
              const activeNodeIdx = isCompleted ? 8 : Math.min(Math.floor(prog / 12), 7);
              const isActive = idx === activeNodeIdx;

              return (
                <React.Fragment key={idx}>
                  <div className={`px-2.5 py-1.5 text-[9px] font-bold font-mono rounded border text-center shrink-0 ${
                    isActive 
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-extrabold shadow-sm shadow-blue-500/10' 
                      : 'bg-slate-900/60 border-slate-850 opacity-40'
                  }`}>
                    {node.label}
                  </div>
                  {idx !== 8 && <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Incident Story (Storyboard) */}
        <div className="space-y-3 border-t border-slate-800/80 pt-5">
          <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">Incident Story</span>
          
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-semibold py-2">
            {config.story.map((storyStep, idx, arr) => {
              const totalStorySteps = arr.length;
              const activeIdx = isCompleted ? totalStorySteps - 1 : Math.min(Math.floor((prog / 100) * totalStorySteps), totalStorySteps - 2);
              const isPassed = idx <= activeIdx;
              
              return (
                <React.Fragment key={idx}>
                  <div className={`px-2.5 py-1.5 rounded-lg border font-mono text-[10px] ${
                    idx === activeIdx 
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-400 font-extrabold animate-pulse'
                      : isPassed 
                      ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400'
                      : 'bg-slate-950 border-slate-850 opacity-30'
                  }`}>
                    {storyStep}
                  </div>
                  {idx !== arr.length - 1 && <span className="opacity-30 font-mono text-[9px] shrink-0">➔</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Technical Details Toggle */}
        <div className="border-t border-slate-800/80 pt-5 flex flex-col items-center">
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none opacity-85 hover:opacity-100 transition-opacity">
            <input 
              type="checkbox" 
              checked={showTechnicalInline}
              onChange={() => setShowTechnicalInline(!showTechnicalInline)}
              className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>▼ See Technical Details</span>
          </label>
        </div>

        {/* Inline Technical Specifications */}
        {showTechnicalInline && (
          <div className="border-t border-slate-800 pt-6 mt-6 space-y-6 animate-fade-in">
            <h4 className="text-sm font-bold tracking-wider uppercase text-blue-400 font-mono">Core Subsystem Telemetry Spec</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Message Bus */}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 block font-mono">Live Message Bus</span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 font-mono text-[9.5px] space-y-2 h-44 overflow-y-auto">
                  <p className="text-blue-400">[0.0s] [AIOS Core] Anomaly ingestion complete. Spawning thread.</p>
                  <p className="text-slate-400">[0.5s] [Planner] Ingesting agent matrices and building strategy...</p>
                  <p className="text-yellow-400">[1.2s] [MessageBus] Dispatch dispatches locked.</p>
                  <p className="text-slate-400">[1.8s] [Ambulance] {"->"} [Triage] Bed reservation complete.</p>
                  <p className="text-slate-400">[2.5s] [Drone] {"->"} [AIOS] Camera online.</p>
                  <p className="text-emerald-400">[3.2s] [AIOS Core] Mission executing.</p>
                </div>
              </div>

              {/* Ingestion logs */}
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-200'} space-y-3`}>
                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 block font-mono">Audit Timeline Logs</span>
                <div className="space-y-2 h-44 overflow-y-auto pr-1">
                  {[...messages].reverse().slice(0, 10).map((msg, idx) => (
                    <div key={idx} className="p-2 bg-slate-950/80 rounded border border-slate-850 font-mono text-[9px] leading-relaxed">
                      <span className="text-blue-400">[{msg.type}]</span> {msg.senderName} ➔ {msg.receiverName}: {msg.content}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
