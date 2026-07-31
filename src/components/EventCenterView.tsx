import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, ArrowRight, MapPin, AlertTriangle, Home } from 'lucide-react';
import { useAIOS, CompletedMission } from '../context/AIOSContext';
import { ALL_AGENTS_LIST } from '../eventEngine';

interface EventCenterViewProps {
  theme: 'dark' | 'light';
  onNavigate: (tab: string) => void;
}

export default function EventCenterView({ theme, onNavigate }: EventCenterViewProps) {
  const isDark = theme === 'dark';
  const { activeEventConfig, setActiveEventConfig, addCompletedMission, clearActiveMission, saveMissionToHistory, activeMissionId } = useAIOS();

  const config = activeEventConfig;

  const feedEndRef = useRef<HTMLDivElement>(null);

  // Extract real-time values directly from backend WebSocket state configuration
  const currentStep = config && 'currentStep' in config ? (config as any).currentStep : -1;
  const missionDone = config && 'missionDone' in config ? (config as any).missionDone : false;
  const liveFeed = config && 'liveFeed' in config ? (config as any).liveFeed : [];
  const progress = config && 'progress' in config ? (config as any).progress : 0;

  // Auto-save to database when mission completes (safety net if WS event was missed)
  const savedRef = useRef(false);
  useEffect(() => {
    if (missionDone && activeMissionId && !savedRef.current) {
      savedRef.current = true;
      console.log('[EventCenterView] missionDone=true — ensuring history is saved for:', activeMissionId);
      saveMissionToHistory(activeMissionId);
    }
    // Reset saved flag when mission changes
    if (!missionDone) savedRef.current = false;
  }, [missionDone, activeMissionId]);

  // Auto-scroll live feed
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveFeed]);

  const activeAgents = config ? ALL_AGENTS_LIST.filter(a => 
    config.agents.includes(a.id) || 
    config.agents.includes(a.name) || 
    config.agents.some(x => x.toLowerCase().includes(a.code.toLowerCase()) || a.name.toLowerCase().includes(x.toLowerCase()))
  ) : [];
  const standbyAgents = config ? ALL_AGENTS_LIST.filter(a => 
    !(config.agents.includes(a.id) || 
      config.agents.includes(a.name) || 
      config.agents.some(x => x.toLowerCase().includes(a.code.toLowerCase()) || a.name.toLowerCase().includes(x.toLowerCase())))
  ) : [];

  // ── Empty state ──
  if (!config) {
    return (
      <div className={`min-h-[calc(100vh-56px)] flex flex-col items-center justify-center gap-6 px-6 ${
        isDark ? 'text-white' : 'text-slate-900'
      }`}>
        <div className="text-6xl">📭</div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black">No Active Event</h2>
          <p className={`text-base font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Go to Home, describe a problem, and AIOS will respond here.
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 cursor-pointer"
        >
          <Home className="h-4 w-4" />
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto pb-16 px-1 space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>

      {/* ── Event Header ── */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{config.icon}</span>
              <div>
                <h1 className="text-2xl font-black leading-tight">{config.title}</h1>
                <p className={`text-sm font-medium flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <MapPin className="h-3.5 w-3.5" />
                  {config.location}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 space-y-1.5">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
              config.severity === 'Critical'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : config.severity === 'High'
                ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            }`}>
              <AlertTriangle className="h-3 w-3" />
              {config.severity}
            </span>

            <div>
              {missionDone ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                  <CheckCircle className="h-3.5 w-3.5" /> Mission Completed
                </span>
              ) : currentStep >= 0 ? (
                <span className="flex items-center gap-1 text-xs font-bold text-indigo-400 animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                  AIOS is responding...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                  <Clock className="h-3.5 w-3.5" /> Starting up...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Progress</span>
            <span className={`font-mono ${
              missionDone ? 'text-emerald-400' : 'text-indigo-400'
            }`}>{progress}%</span>
          </div>
          <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                missionDone ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current step */}
        {currentStep >= 0 && (
          <div className={`mt-4 p-3.5 rounded-xl border text-sm font-semibold ${
            isDark ? 'bg-indigo-950/40 border-indigo-900/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            {missionDone
              ? '✅ Mission completed. All agents returning to standby.'
              : `→ ${config.currentStepTexts?.[currentStep] ?? config.workflow[currentStep]?.title}`}
          </div>
        )}
      </div>

      {/* ── Workflow Steps ── */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h2 className={`text-xs font-black uppercase tracking-widest mb-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          What is happening
        </h2>

        <div className="space-y-3">
          {config.workflow.map((step, idx) => {
            const isActive = idx === currentStep && !missionDone;
            const isDone = missionDone || idx < currentStep;
            return (
              <div key={idx} className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? isDark ? 'bg-indigo-950/50 border-indigo-700 shadow-lg shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-300'
                  : isDone
                  ? isDark ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50 border-emerald-200'
                  : isDark ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100'
              }`}>
                {/* Step node */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0 border transition-all ${
                  isActive
                    ? 'bg-indigo-600 border-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/30 animate-pulse'
                    : isDone
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : isDark ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  {isDone ? '✓' : step.icon}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold leading-tight ${
                    isActive ? (isDark ? 'text-indigo-300' : 'text-indigo-700') :
                    isDone ? (isDark ? 'text-emerald-400' : 'text-emerald-700') :
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {step.title}
                  </p>
                  {(isActive || isDone) && (
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {step.desc}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active vs Standby Agents ── */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h2 className={`text-xs font-black uppercase tracking-widest mb-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Who is helping
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Active */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              🟢 Active ({activeAgents.length})
            </p>
            <div className="space-y-2">
              {activeAgents.map(a => (
                <div key={a.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-sm font-semibold">{a.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Standby */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ⚪ Standby ({standbyAgents.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {standbyAgents.map(a => (
                <span key={a.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border opacity-50 ${
                  isDark ? 'border-slate-800 text-slate-500 bg-slate-900' : 'border-slate-200 text-slate-400 bg-slate-50'
                }`}>
                  {a.icon} {a.name.replace(' Agent', '')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Timeline Feed ── */}
      {liveFeed.length > 0 && (
        <div className={`rounded-3xl p-6 border ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h2 className={`text-xs font-black uppercase tracking-widest mb-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Live Timeline
          </h2>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {liveFeed.map((entry, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <span className={`shrink-0 text-xs font-mono font-bold pt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {entry.time}
                </span>
                <ArrowRight className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                <div>
                  <span className="font-bold text-indigo-400">{entry.sender}</span>
                  <span className={`ml-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{entry.message}</span>
                </div>
              </div>
            ))}
            <div ref={feedEndRef} />
          </div>
        </div>
      )}

      {/* ── Why AIOS took these actions ── */}
      <div className={`rounded-3xl p-6 border ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <h2 className={`text-xs font-black uppercase tracking-widest mb-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Why AIOS took these actions
        </h2>

        <div className="space-y-3">
          {config.reasoning.map((point, idx) => (
            <p key={idx} className={`text-sm font-medium flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <span className="text-indigo-400 font-black shrink-0">•</span>
              {point}
            </p>
          ))}
        </div>
      </div>

      {/* ── Mission Complete CTA ── */}
      {missionDone && (
        <div className={`rounded-3xl p-6 border text-center space-y-4 ${
          isDark ? 'bg-emerald-950/30 border-emerald-900/40' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="text-4xl">🎯</div>
          <div>
            <h3 className="text-xl font-black text-emerald-400">Mission Completed</h3>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              All agents have returned to standby. The situation has been resolved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                // Navigate first to avoid flashing the empty-state screen,
                // then clear the mission state after the transition settles.
                onNavigate('home');
                setTimeout(() => clearActiveMission(), 300);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              Report New Event
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              View Mission History
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
