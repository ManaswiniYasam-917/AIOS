import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Cpu, Server, Activity, Layers } from 'lucide-react';

interface ArchitectureViewProps {
  theme: 'dark' | 'light';
  onOpenInspector: (name: string) => void;
  isDeveloperMode: boolean;
}

export default function ArchitectureView({ theme, onOpenInspector, isDeveloperMode }: ArchitectureViewProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const isDark = theme === 'dark';

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={`space-y-8 max-w-4xl mx-auto pb-10 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AIOS Architecture</h1>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Visual blueprint of our autonomous response orchestration pipeline</p>
      </div>

      {/* ─── SIMPLE VIEW ARCHITECTURE (Default) ─── */}
      <div className={`p-6 rounded-2xl border space-y-6 ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">Orchestration Flow</span>
        
        <div className={`p-4 rounded-xl border overflow-x-auto flex items-center gap-2.5 min-w-full justify-start md:justify-center ${
          isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-250 shadow-inner'
        }`}>
          {[
            { label: 'Problem', code: 'Event' },
            { label: 'AIOS Understands', code: 'AIOS Brain' },
            { label: 'AIOS Plans', code: 'Mission Planning' },
            { label: 'AIOS Sends Help', code: 'Ambulance' },
            { label: 'People Get Help', code: 'Hospital' },
            { label: 'Mission Finished', code: 'Completed' }
          ].map((node, idx) => (
            <React.Fragment key={idx}>
              <button
                onClick={() => onOpenInspector(node.code)}
                className="px-3.5 py-2.5 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-400 shrink-0"
              >
                {node.label}
              </button>
              {idx !== 5 && <ChevronRight className="h-4 w-4 opacity-40 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Technical Toggle */}
      <div className="flex flex-col items-center pt-2">
        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none opacity-85 hover:opacity-100 transition-opacity">
          <input 
            type="checkbox" 
            checked={showTechnical}
            onChange={() => setShowTechnical(!showTechnical)}
            className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>▼ See Technical Details</span>
        </label>
      </div>

      {/* ─── DETAILED COMPONENT TREE (Revealed on toggle) ─── */}
      {showTechnical && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold font-mono">
            {[
              { id: 'event', label: 'Event', color: 'border-red-500/30 hover:border-red-500 bg-red-500/5 text-red-400' },
              { id: 'brain', label: 'AIOS Brain', color: 'border-blue-500/30 hover:border-blue-500 bg-blue-500/5 text-blue-400' },
              { id: 'agents', label: 'Agents', color: 'border-orange-500/30 hover:border-orange-500 bg-orange-500/5 text-orange-400' },
              { id: 'mission', label: 'Mission', color: 'border-yellow-500/30 hover:border-yellow-500 bg-yellow-500/5 text-yellow-400' },
              { id: 'completed', label: 'Completed', color: 'border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 text-emerald-400' },
            ].map((node) => {
              const isSelected = expandedSection === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => toggleSection(node.id)}
                  className={`p-3.5 rounded-xl border text-[11px] transition-all cursor-pointer ${node.color} ${
                    isSelected ? 'ring-2 ring-blue-500/60 border-blue-500 font-extrabold' : ''
                  }`}
                >
                  {node.label}
                </button>
              );
            })}
          </div>

          {/* iOS style accordion body */}
          {expandedSection && (
            <div className={`p-6 rounded-2xl border animate-slide-down ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            } space-y-4`}>
              
              <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 block font-mono">System Core Spec</span>
                  <h4 className="font-extrabold text-sm capitalize">{expandedSection} Component Registry</h4>
                </div>
                <button
                  onClick={() => {
                    if (expandedSection === 'event') onOpenInspector('Event');
                    else if (expandedSection === 'brain') onOpenInspector('AIOS Brain');
                    else if (expandedSection === 'agents') onOpenInspector('Agents');
                    else if (expandedSection === 'mission') onOpenInspector('Mission Planning');
                    else if (expandedSection === 'completed') onOpenInspector('Completed');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold font-mono"
                >
                  Inspect Domain Node →
                </button>
              </div>

              {expandedSection === 'event' && (
                <div className="space-y-3">
                  <p className="text-xs opacity-75">Ingestion handlers converting audio transcripts, camera bytes, and alerts into JSON structures.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { name: 'Voice Transcriber', code: 'Event' },
                      { name: 'Image Analyzer', code: 'Event' }
                    ].map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => onOpenInspector(sub.code)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          isDark ? 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'brain' && (
                <div className="space-y-3">
                  <p className="text-xs opacity-75">Reasoning logic models generating strategies and matching agent access permissions.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { name: 'Mission Planner', code: 'Mission Planning' },
                      { name: 'Decision Engine', code: 'AIOS Brain' },
                      { name: 'Workflow Manager', code: 'Mission Planning' },
                      { name: 'Security Enforcer', code: 'Police' }
                    ].map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => onOpenInspector(sub.code)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          isDark ? 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'agents' && (
                <div className="space-y-3">
                  <p className="text-xs opacity-75">Active responders deployed to resolve anomalies. Click to inspect tech specs.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {[
                      { name: 'Hospital Agent', code: 'Hospital' },
                      { name: 'Ambulance Agent', code: 'Ambulance' },
                      { name: 'Police Agent', code: 'Police' },
                      { name: 'Traffic Agent', code: 'Traffic' },
                      { name: 'Drone Agent', code: 'Drone' }
                    ].map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => onOpenInspector(sub.code)}
                        className={`p-3 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                          isDark ? 'bg-slate-950 border-slate-850 hover:border-slate-700' : 'bg-slate-50 border-slate-250 hover:border-slate-400'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'mission' && (
                <div className="space-y-3">
                  <p className="text-xs opacity-75">Execution timelines checking checkpoints and task status grids.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { name: 'Thread Manager', code: 'Mission Planning' },
                      { name: 'Callback Recorder', code: 'Event' }
                    ].map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => onOpenInspector(sub.code)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          isDark ? 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {expandedSection === 'completed' && (
                <div className="space-y-3">
                  <p className="text-xs opacity-75">Logs compilation and data cleanup handlers.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { name: 'Telemetry Archiver', code: 'Completed' },
                      { name: 'accuracy Rating Analyzer', code: 'Completed' }
                    ].map((sub, idx) => (
                      <button
                        key={idx}
                        onClick={() => onOpenInspector(sub.code)}
                        className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-all ${
                          isDark ? 'bg-slate-950/60 border-slate-850 hover:bg-slate-900/40' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sub.name}
                      </button>
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
