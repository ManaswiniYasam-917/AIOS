import React, { useState } from 'react';
import { Clock, MapPin, CheckCircle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useAIOS, CompletedMission } from '../context/AIOSContext';
import { EVENT_CONFIGS } from '../eventEngine';

interface MissionHistoryViewProps {
  theme: 'dark' | 'light';
  onNavigate: (tab: string) => void;
}

function formatDateTime(epoch?: number) {
  if (!epoch || isNaN(epoch)) return 'Recently';
  const d = new Date(epoch);
  return d.toLocaleString([], {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function MissionCard({ mission, theme }: { key?: string; mission: CompletedMission; theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_CONFIGS[mission.configId];
  const resolvedAgents = (Array.isArray(mission?.resolvedBy) && mission.resolvedBy.length > 0)
    ? mission.resolvedBy
    : (config?.agents || []);

  return (
    <div className={`rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
    }`}>
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{mission.eventIcon || '🚨'}</span>
            <div>
              <h3 className="font-black text-base leading-tight">{mission.eventTitle || 'Emergency Event'}</h3>
              <p className={`text-xs font-medium mt-0.5 flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <MapPin className="h-3 w-3" />
                {mission.location || 'Unknown Location'}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle className="h-3 w-3" />
              Completed
            </span>
            <p className={`text-[10px] mt-1.5 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Duration: {mission.durationMin || 1} min
            </p>
          </div>
        </div>

        {/* Time & agents row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-xs">
          <span className={`flex items-center gap-1 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <Clock className="h-3 w-3" />
            {formatDateTime(mission.startedAt)}
          </span>
          <span className={`font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Resolved by: <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {resolvedAgents.length > 0 ? (
                <>
                  {resolvedAgents.slice(0, 3).map(n => n.replace(' Agent', '')).join(', ')}
                  {resolvedAgents.length > 3 ? ` +${resolvedAgents.length - 3} more` : ''}
                </>
              ) : 'AIOS Fleet'}
            </span>
          </span>
        </div>
      </div>

      {/* View details toggle */}
      <div className={`border-t px-5 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
            isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'
          }`}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? 'Hide Details' : 'View Details'}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && config && (
        <div className={`px-5 pb-5 space-y-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          {/* Workflow summary */}
          <div className="pt-4 space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Mission Steps
            </p>
            <div className="space-y-1.5">
              {config.workflow.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Why AIOS Responded
            </p>
            <div className="space-y-1">
              {config.reasoning.map((r, idx) => (
                <p key={idx} className={`text-xs font-medium flex gap-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="text-indigo-400 shrink-0">•</span>{r}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MissionHistoryView({ theme, onNavigate }: MissionHistoryViewProps) {
  const isDark = theme === 'dark';
  const { completedMissions, addCompletedMission } = useAIOS();

  // Clear history
  const clearHistory = () => {
    try { localStorage.removeItem('aios_mission_history'); } catch {}
    // Hack: trigger reload of state by setting to empty via localStorage
    window.location.reload();
  };

  if (completedMissions.length === 0) {
    return (
      <div className={`min-h-[calc(100vh-56px)] flex flex-col items-center justify-center gap-6 px-6 ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}>
        <div className="text-6xl">📋</div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black">No missions yet</h2>
          <p className={`text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Completed missions will appear here.
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 cursor-pointer"
        >
          Report a Problem
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto pb-16 px-1 space-y-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>

      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-2xl font-black">Mission History</h1>
          <p className={`text-sm mt-0.5 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {completedMissions.length} completed mission{completedMissions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={clearHistory}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            isDark ? 'border-slate-800 text-slate-500 hover:text-red-400 hover:border-red-900' : 'border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200'
          }`}
          title="Clear history"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* Mission cards */}
      {completedMissions.map(mission => (
        <MissionCard key={mission.id} mission={mission} theme={theme} />
      ))}

    </div>
  );
}
