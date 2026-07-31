import React, { useState } from 'react';
import { Moon, Sun, Bell, Info, Code2, ChevronRight, Globe } from 'lucide-react';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isDeveloperMode: boolean;
  onToggleDeveloperMode: () => void;
  onNavigate?: (tab: string) => void;
}

export default function SettingsView({
  theme,
  onToggleTheme,
  isDeveloperMode,
  onToggleDeveloperMode,
  onNavigate,
}: SettingsViewProps) {
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState(true);
  const [showAbout, setShowAbout] = useState(false);

  const row = (
    icon: React.ReactNode,
    label: string,
    desc: string,
    action: React.ReactNode,
    onClick?: () => void
  ) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all text-left group ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      } ${
        isDark
          ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
        isDark ? 'bg-slate-800' : 'bg-slate-100'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </button>
  );

  const toggle = (enabled: boolean, onToggle: () => void) => (
    <button
      onClick={e => { e.stopPropagation(); onToggle(); }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors duration-200 cursor-pointer focus:outline-none ${
        enabled ? 'bg-indigo-600' : isDark ? 'bg-slate-700' : 'bg-slate-300'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );

  return (
    <div className={`max-w-lg mx-auto pb-16 px-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>

      {/* Header */}
      <div className="py-6">
        <h1 className="text-2xl font-black">Settings</h1>
        <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Personalise your AIOS experience
        </p>
      </div>

      {/* Settings rows */}
      <div className="space-y-3">

        {/* Theme */}
        {row(
          isDark ? <Moon className="h-5 w-5 text-indigo-400" /> : <Sun className="h-5 w-5 text-amber-400" />,
          'Appearance',
          isDark ? 'Dark mode is on' : 'Light mode is on',
          toggle(isDark, onToggleTheme)
        )}

        {/* Language (placeholder) */}
        {row(
          <Globe className="h-5 w-5 text-blue-400" />,
          'Language',
          'English',
          <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            English
          </span>
        )}

        {/* Notifications */}
        {row(
          <Bell className="h-5 w-5 text-amber-400" />,
          'Notifications',
          notifications ? 'You will receive alerts for new events' : 'Notifications are muted',
          toggle(notifications, () => setNotifications(n => !n))
        )}

        {/* About */}
        {row(
          <Info className="h-5 w-5 text-emerald-400" />,
          'About AIOS',
          'Version, build info, and licence',
          <ChevronRight className={`h-4 w-4 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />,
          () => setShowAbout(true)
        )}

        {/* Developer Mode */}
        {row(
          <Code2 className={`h-5 w-5 ${isDeveloperMode ? 'text-purple-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />,
          'Developer Mode',
          isDeveloperMode ? 'Advanced features and architecture view are visible' : 'Only essential features are shown',
          toggle(isDeveloperMode, onToggleDeveloperMode)
        )}

        {/* Architecture — only visible in developer mode */}
        {isDeveloperMode && onNavigate && (
          <div className={`rounded-2xl border p-4 space-y-3 ${
            isDark ? 'bg-purple-950/20 border-purple-900/40' : 'bg-purple-50 border-purple-200'
          }`}>
            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Developer Tools</p>
            <button
              onClick={() => onNavigate('architecture')}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-bold cursor-pointer transition-all ${
                isDark ? 'border-purple-900/40 text-purple-300 hover:bg-purple-950/30' : 'border-purple-200 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <span>View System Architecture</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>

      {/* About panel */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl p-6 space-y-4 ${
            isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200 shadow-2xl'
          }`}>
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                <span className="text-white font-black text-lg">AI</span>
              </div>
              <h2 className="text-lg font-black">AIOS</h2>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Autonomous Intelligence Operating System
              </p>
            </div>

            <div className={`space-y-2 text-xs rounded-xl p-4 border ${
              isDark ? 'bg-slate-800/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex justify-between"><span>Version</span><span className="font-bold">2.0.0</span></div>
              <div className="flex justify-between"><span>Build</span><span className="font-bold">aios-2026-07</span></div>
              <div className="flex justify-between"><span>Stack</span><span className="font-bold">React · TypeScript · FastAPI</span></div>
              <div className="flex justify-between"><span>AI Engine</span><span className="font-bold">AIOS Core v2</span></div>
            </div>

            <p className={`text-xs text-center ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              All AI coordination, orchestration, and reasoning happens automatically in the background.
            </p>

            <button
              onClick={() => setShowAbout(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
