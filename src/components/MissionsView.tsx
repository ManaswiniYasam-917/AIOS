import React, { useState } from 'react';
import { useAIOS, Mission } from '../context/AIOSContext';
import { 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  MessageCircle, 
  Terminal, 
  Database,
  Radio,
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { AuditLog, AgentMessage } from '../types';

interface MissionsViewProps {
  theme: 'dark' | 'light';
  isDeveloperMode: boolean;
  logs: AuditLog[];
  messages: AgentMessage[];
  onNavigate: (tab: string) => void;
}

export default function MissionsView({ theme, isDeveloperMode, logs, messages, onNavigate }: MissionsViewProps) {
  const { missions } = useAIOS();
  const [expertPanelTab, setExpertPanelTab] = useState<'messages' | 'logs'>('messages');

  const isDark = theme === 'dark';

  // Helper to construct simplified descriptions based on event types
  const getMissionInfo = (mission: Mission) => {
    const isAccident = mission.eventId.includes('accident') || true; // fallback to accident
    
    // Map dynamically based on event ID/type
    let type = 'Emergency Dispatch';
    let desc = 'Coordinating response nodes to stabilize localized anomaly.';
    let nextStep = 'Stabilizing responder loops. Awaiting final field verification.';

    if (mission.eventId.toLowerCase().includes('fire')) {
      type = 'Building Fire Response';
      desc = 'Suppressing active structure fire, securing residents, and cutting utility grids.';
      nextStep = 'Commencing core suppression loop. Primary team inside building.';
    } else if (mission.eventId.toLowerCase().includes('flood')) {
      type = 'Flood Rescue Operation';
      desc = 'Deploying active rescue boats, establishing shelter zones, and distributing supplies.';
      nextStep = 'Establishing safe transport routes. Drone fleet scanning water depth.';
    } else if (mission.eventId.toLowerCase().includes('power')) {
      type = 'Grid Restore Loop';
      desc = 'Isolating power network fault, shutting local loops, and engaging backup feeds.';
      nextStep = 'Engaging secondary utility routing. Technicians heading to substation.';
    } else if (mission.eventId.toLowerCase().includes('medical')) {
      type = 'Medical Capacity Triage';
      desc = 'Routing critical ambulances, pre-registering trauma beds, and scheduling staff.';
      nextStep = 'Verifying blood bank supply lines. Prepping operating theater.';
    } else if (mission.eventId.toLowerCase().includes('military') || mission.eventId.toLowerCase().includes('defense')) {
      type = 'Sector Security Lock';
      desc = 'Establishing thermal scanners, locks, and coordinating perimeter defence.';
      nextStep = 'Broadcasting perimeter alarm. Coordinating active units.';
    } else if (mission.eventId.toLowerCase().includes('accident')) {
      type = 'Road Accident Triage';
      desc = 'Clearing lanes, securing emergency ambulances, and rerouting vehicle flows.';
      nextStep = 'Ambulance transport en route to trauma center. Rerouting outer flow.';
    }

    return { type, desc, nextStep };
  };

  const renderChecklist = (mission: Mission) => {
    const prog = mission.progress;
    const isCompleted = mission.status === 'completed' || prog === 100;
    
    // Define the 5 steps
    const steps = [
      { id: 1, label: 'Telemetry Verified', status: isCompleted || prog > 10 ? 'complete' : prog > 0 ? 'running' : 'waiting' },
      { id: 2, label: 'Mission Created', status: isCompleted || prog > 30 ? 'complete' : prog > 10 ? 'running' : 'waiting' },
      { id: 3, label: 'Support Nodes Activated', status: isCompleted || prog > 60 ? 'complete' : prog > 30 ? 'running' : 'waiting' },
      { id: 4, label: 'Primary Responder', status: isCompleted || prog > 85 ? 'complete' : prog > 60 ? 'running' : 'waiting' },
      { id: 5, label: 'Perimeter Secured', status: isCompleted ? 'complete' : prog > 85 ? 'running' : 'waiting' },
    ];

    return (
      <div className="space-y-3.5 pt-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${
                isDark ? 'bg-slate-950' : 'bg-slate-100'
              }`}>
                {step.id}
              </span>
              <span className={step.status === 'complete' ? 'opacity-90' : step.status === 'running' ? 'text-blue-400 font-extrabold animate-pulse' : 'opacity-35'}>
                {step.label}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {step.status === 'complete' && (
                <span className="text-emerald-500 font-bold flex items-center gap-1">Verified <CheckCircle2 className="h-4 w-4" /></span>
              )}
              {step.status === 'running' && (
                <span className="text-blue-400 font-bold flex items-center gap-1.5">Running <Loader2 className="h-3.5 w-3.5 animate-spin" /></span>
              )}
              {step.status === 'waiting' && (
                <span className="opacity-30 font-medium">Waiting</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-8 max-w-4xl mx-auto pb-10 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Active Missions</h1>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Real-time task dispatches and responder statuses</p>
      </div>

      {missions.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
          <Radio className="h-10 w-10 mx-auto opacity-30 animate-pulse text-blue-500" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">No Active Missions</h3>
            <p className="text-xs opacity-60">There are no operational threads running right now.</p>
          </div>
          <button 
            onClick={() => onNavigate('home')} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Trigger an Event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grid of Missions */}
          <div className="grid grid-cols-1 gap-6">
            {missions.map((mission) => {
              const info = getMissionInfo(mission);
              return (
                <div 
                  key={mission.id}
                  className={`p-6 rounded-2xl border ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  } space-y-6`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div>
                      <span className="text-[10px] opacity-50 font-mono">THREAD: {mission.id}</span>
                      <h3 className="font-bold text-base mt-0.5">{info.type}</h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] opacity-50 block">PROG</span>
                        <span className="text-xs font-bold font-mono block">{mission.progress}%</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        mission.status === 'completed' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse'
                      }`}>
                        {mission.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* 3-Section Card Design */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Section 1: What is this? */}
                    <div className="space-y-2">
                      <span className={`text-[10px] uppercase font-bold tracking-widest block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>What is this?</span>
                      <p className="text-xs leading-relaxed opacity-85">
                        {info.desc}
                      </p>
                    </div>

                    {/* Section 2: What is happening? */}
                    <div className="space-y-2 md:border-x md:px-6 border-slate-800/80">
                      <span className={`text-[10px] uppercase font-bold tracking-widest block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>What is happening?</span>
                      {renderChecklist(mission)}
                    </div>

                    {/* Section 3: What happens next? */}
                    <div className="space-y-2">
                      <span className={`text-[10px] uppercase font-bold tracking-widest block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>What happens next?</span>
                      <p className="text-xs leading-relaxed opacity-85">
                        {info.nextStep}
                      </p>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

          {/* Expert mode additions */}
          {isDeveloperMode && (
            <div className="border-t border-slate-800 pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold tracking-tight text-blue-400 flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Developer Console
                </h3>
                
                {/* Custom toggle buttons */}
                <div className={`p-0.5 rounded-lg flex gap-1 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
                  <button
                    onClick={() => setExpertPanelTab('messages')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      expertPanelTab === 'messages'
                        ? 'bg-blue-600 text-white shadow'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    Message Bus
                  </button>
                  <button
                    onClick={() => setExpertPanelTab('logs')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      expertPanelTab === 'logs'
                        ? 'bg-blue-600 text-white shadow'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    Audit Logs
                  </button>
                </div>
              </div>

              {/* Tab 1: Messages */}
              {expertPanelTab === 'messages' && (
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider uppercase opacity-55">Broadcast & Direct Channels</span>
                    <span className="text-[10px] opacity-40 font-mono">{messages.length} packages parsed</span>
                  </div>
                  
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[...messages].reverse().map((msg, idx) => (
                      <div 
                        key={msg.id || idx}
                        className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-[10px] flex justify-between items-start gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-bold">[{msg.type.toUpperCase()}]</span>
                            <span className="font-semibold">{msg.senderName}</span>
                            <ArrowRight className="h-3 w-3 opacity-40" />
                            <span className="opacity-70">{msg.receiverName}</span>
                          </div>
                          <p className="opacity-80 text-slate-300">{msg.content}</p>
                        </div>
                        <span className="text-[9px] opacity-45 shrink-0">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Audit Logs */}
              {expertPanelTab === 'logs' && (
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider uppercase opacity-55">Security & Event Registry</span>
                    <span className="text-[10px] opacity-40 font-mono">{logs.length} audits logged</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[...logs].reverse().map((log, idx) => (
                      <div 
                        key={log.id || idx}
                        className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 font-mono text-[10px] flex justify-between items-start gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold uppercase ${
                              log.status === 'Success' ? 'text-emerald-400' : log.status === 'Warning' ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              [{log.status}]
                            </span>
                            <span className="font-semibold text-slate-300">{log.action}</span>
                          </div>
                          <p className="opacity-60 text-[9.5px]">{log.details}</p>
                          <div className="text-[9px] opacity-50">
                            By {log.user} ({log.role})
                          </div>
                        </div>
                        <span className="text-[9px] opacity-45 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
