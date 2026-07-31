import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  MessageCircle, 
  Loader2,
  AlertTriangle,
  Info,
  X,
  Lock,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Home,
  Zap,
  AlertCircle,
  ClipboardList,
  Radio,
  LayoutGrid,
  Briefcase,
  BarChart2,
  Database
} from 'lucide-react';
import LandingPage from './components/LandingPage.js';
import SettingsView from './components/SettingsView.js';
import ArchitectureView from './components/ArchitectureView.js';
import TelemetryInspector from './components/TelemetryInspector.js';
import AIOSFlowView from './components/AIOSFlowView.js';
import HomeView from './components/HomeView.js';
import EventCenterView from './components/EventCenterView.js';
import MissionHistoryView from './components/MissionHistoryView.js';
import DashboardView from './components/DashboardView.js';
import MissionsView from './components/MissionsView.js';
import InsightsView from './components/InsightsView.js';
import DatabaseViewer from './components/DatabaseViewer.js';
import AutonomousEngine from './components/AutonomousEngine';
import ErrorBoundary from './components/ErrorBoundary';
import { AIOSProvider, useAIOS, EventData, fetchWithAuth } from './context/AIOSContext';
import { 
  Notification
} from './types.js';

// Notification icon helpers
const notifIcon = (type: string) => {
  switch (type) {
    case 'Critical': return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' };
    case 'Warning':  return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
    case 'Security': return { icon: Lock, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' };
    default:         return { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
  }
};

// ── 5-tab navigation ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'home',        label: 'Home',            icon: Home,          emoji: '🏠' },
  { id: 'dashboard',   label: 'Dashboard',       icon: LayoutGrid,    emoji: '📊' },
  { id: 'aios_flow',   label: 'AIOS Flow',       icon: Zap,           emoji: '⚡' },
  { id: 'events',      label: 'Event Center',    icon: AlertCircle,   emoji: '🚨' },
  { id: 'missions',    label: 'Mission Center',  icon: Briefcase,     emoji: '💼' },
  { id: 'reports',     label: 'Reports',         icon: BarChart2,     emoji: '📈' },
  { id: 'history',     label: 'Mission History', icon: ClipboardList, emoji: '📋' },
  { id: 'settings',    label: 'Settings',        icon: Settings,      emoji: '⚙️' },
];

// ── Inner app (inside AIOSProvider) ──────────────────────────────────────────
function AppInner() {
  const { addEvent, activeEventConfig } = useAIOS();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isConsole, setIsConsole] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('aios_active_tab') || 'home';
  });

  const [isDeveloperMode, setIsDeveloperMode] = useState(() =>
    localStorage.getItem('aios_dev_mode') === 'true'
  );

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'signup' | 'forgot' | 'mfa'>('login');
  const [email, setEmail] = useState('admin@aios.ai');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Notifications (fetched from API)
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  // System Telemetry & Metrics state
  const [metrics, setMetrics] = useState<any>({
    cpuUsage: 12,
    ramUsage: 45,
    storageUsage: 64,
    networkIn: 1.2,
    networkOut: 0.8,
    activeAgents: 0,
    connectedDevices: 0,
    runningTasks: 0,
    alertsCount: { info: 0, warning: 0, critical: 0 }
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [marketplaceAgents, setMarketplaceAgents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // Function to load all backend diagnostics
  const fetchTelemetry = async () => {
    try {
      const metricsRes = await fetchWithAuth('/api/metrics');
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }
      
      const logsRes = await fetchWithAuth('/api/logs');
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data);
      }

      const devicesRes = await fetchWithAuth('/api/devices');
      if (devicesRes.ok) {
        const data = await devicesRes.json();
        setDevices(data);
      }

      const marketRes = await fetchWithAuth('/api/marketplace');
      if (marketRes.ok) {
        const data = await marketRes.json();
        setMarketplaceAgents(data);
      }

      const msgsRes = await fetchWithAuth('/api/messages');
      if (msgsRes.ok) {
        const data = await msgsRes.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Telemetry fetch failed:', err);
    }
  };

  // Run initial diagnostic fetch & set up automatic polling loop every 8 seconds
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 8000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Operations triggers
  const handleTriggerDiagnostic = async (deviceId: string) => {
    try {
      const res = await fetchWithAuth(`/api/devices/${deviceId}/diagnostic`, { method: 'POST' });
      if (res.ok) {
        fetchTelemetry();
      }
    } catch (err) {
      console.error('Trigger diagnostic failed:', err);
    }
  };

  const handleInstallAgent = async (agentId: string) => {
    try {
      const res = await fetchWithAuth(`/api/marketplace/${agentId}/install`, { method: 'POST' });
      if (res.ok) {
        fetchTelemetry();
      }
    } catch (err) {
      console.error('Install agent failed:', err);
    }
  };

  // Developer — inspector
  const [activeInspectorComponent, setActiveInspectorComponent] = useState<string | null>(null);

  const isDark = theme === 'dark';
  const unreadCount = notifications.filter(n => !n.read).length;

  // Restore session
  useEffect(() => {
    const savedToken = localStorage.getItem('aios_token');
    if (savedToken) {
      setIsLoggedIn(true);
      setIsConsole(true);
    }
  }, []);

  const handleToggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleToggleDeveloperMode = () => {
    setIsDeveloperMode(prev => {
      const next = !prev;
      localStorage.setItem('aios_dev_mode', String(next));
      return next;
    });
  };

  // Login
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, simulated_role: 'Super Admin' })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('aios_token', data.access_token);
        setLoginTab('mfa');
      } else {
        setLoginTab('mfa');
      }
    } catch {
      setLoginTab('mfa');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleMfaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoggedIn(true);
    setIsConsole(true);
    setShowLoginModal(false);
    setLoginTab('login');
    setMfaCode('');
  };

  const handleSignupSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    alert('Account created! Please sign in.');
    setLoginTab('login');
  };

  const navigateTo = (tab: string) => {
    console.log('[App] Navigating to tab:', tab);
    setActiveTab(tab);
    localStorage.setItem('aios_active_tab', tab);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} transition-colors duration-300`}>
      <AutonomousEngine />

      {!isConsole ? (
        <LandingPage
          onEnterConsole={() => {
            setIsConsole(true);
            setIsLoggedIn(true);
            const saved = localStorage.getItem('aios_active_tab') || (activeEventConfig ? 'events' : 'home');
            navigateTo(saved);
          }}
          onOpenLogin={() => { setLoginTab('login'); setShowLoginModal(true); }}
        />
      ) : (
        <div className="flex h-screen overflow-hidden">

          {/* ── SIDEBAR ── */}
          <aside className={`w-56 border-r hidden md:flex flex-col shrink-0 ${
            isDark ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'
          }`}>

            {/* Logo */}
            <div
              className="flex items-center gap-3 px-5 py-5 cursor-pointer border-b"
              style={{ borderColor: isDark ? '#0f172a' : '#f1f5f9' }}
              onClick={() => navigateTo('home')}
            >
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cpu className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>AIOS</span>
                <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>AI Operating System</span>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                        : isDark
                        ? 'text-slate-400 hover:bg-slate-900 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-base">{item.emoji}</span>
                    <span>{item.label}</span>
                    {item.id === 'events' && !isActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </button>
                );
              })}

              {/* Architecture — dev mode only */}
              {isDeveloperMode && (
                <button
                  type="button"
                  onClick={() => navigateTo('architecture')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer mt-2 ${
                    activeTab === 'architecture'
                      ? 'bg-purple-700 text-white'
                      : isDark
                      ? 'text-purple-400 hover:bg-purple-950/30 border border-purple-900/30'
                      : 'text-purple-600 hover:bg-purple-50 border border-purple-200'
                  }`}
                >
                  <span className="text-base">🔧</span>
                  <span>Architecture</span>
                </button>
              )}
            </nav>

            {/* User footer */}
            <div className={`p-3 border-t ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="h-7 w-7 rounded-full bg-indigo-700 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                  {email.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{email}</p>
                  <p className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Administrator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsLoggedIn(false); setIsConsole(false); localStorage.removeItem('aios_token'); }}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                  isDark ? 'border-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                Sign Out
              </button>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Header */}
            <header className={`h-14 border-b flex items-center justify-between px-5 shrink-0 ${
              isDark ? 'bg-slate-950/90 border-slate-900' : 'bg-white border-slate-200 shadow-sm'
            } backdrop-blur-md z-10`}>

              {/* Left: current page */}
              <div className="flex items-center gap-3">
                {/* Mobile logo */}
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="md:hidden h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white"
                >
                  <Cpu className="h-4 w-4" />
                </button>

                <span className={`text-sm font-bold hidden sm:block ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? 'AIOS'}
                </span>

                <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/40' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              {/* Right: controls */}
              <div className="flex items-center gap-2">

                {/* Developer Mode toggle */}
                <button
                  type="button"
                  onClick={handleToggleDeveloperMode}
                  className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    isDeveloperMode
                      ? 'bg-purple-950/60 text-purple-400 border-purple-900/50 hover:bg-purple-950'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title="Toggle Developer Mode"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isDeveloperMode ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'}`} />
                  {isDeveloperMode ? 'Dev Mode' : 'Simple'}
                </button>

                {/* Theme */}
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-500" />}
                </button>

                {/* Notifications */}
                <button
                  type="button"
                  onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                  className={`relative p-2 rounded-lg border transition-colors cursor-pointer ${
                    isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto p-5 md:p-7">
              <ErrorBoundary key={activeTab}>

              {activeTab === 'home' && (
                <HomeView theme={theme} onNavigate={navigateTo} />
              )}

              {activeTab === 'aios_flow' && (
                <AIOSFlowView theme={theme} />
              )}

              {activeTab === 'events' && (
                <EventCenterView theme={theme} onNavigate={navigateTo} />
              )}

              {activeTab === 'history' && (
                <MissionHistoryView theme={theme} onNavigate={navigateTo} />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  theme={theme}
                  onToggleTheme={handleToggleTheme}
                  isDeveloperMode={isDeveloperMode}
                  onToggleDeveloperMode={handleToggleDeveloperMode}
                  onNavigate={navigateTo}
                />
              )}

              {activeTab === 'dashboard' && (
                <DashboardView
                  theme={theme}
                  onNavigate={navigateTo}
                  metrics={metrics}
                  logs={logs}
                  onRefresh={fetchTelemetry}
                />
              )}

              {activeTab === 'db_viewer' && (
                <DatabaseViewer theme={theme} />
              )}

              {activeTab === 'missions' && (
                <MissionsView
                  theme={theme}
                  isDeveloperMode={isDeveloperMode}
                  logs={logs}
                  messages={messages}
                  onNavigate={navigateTo}
                />
              )}

              {activeTab === 'reports' && (
                <InsightsView
                  theme={theme}
                  isDeveloperMode={isDeveloperMode}
                  metrics={metrics}
                  logs={logs}
                  onRefresh={fetchTelemetry}
                  onNavigate={navigateTo}
                  devices={devices}
                  onTriggerDiagnostic={handleTriggerDiagnostic}
                  marketplaceAgents={marketplaceAgents}
                  onInstallAgent={handleInstallAgent}
                />
              )}

              {/* Architecture — dev mode only */}
              {activeTab === 'architecture' && isDeveloperMode && (
                <ArchitectureView
                  theme={theme}
                  onOpenInspector={setActiveInspectorComponent}
                  isDeveloperMode={isDeveloperMode}
                />
              )}

              </ErrorBoundary>
            </main>
          </div>

          {/* Notifications slide-out */}
          {showNotificationsPanel && (
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end"
              onClick={e => { if (e.target === e.currentTarget) setShowNotificationsPanel(false); }}
            >
              <div className={`${isDark ? 'bg-slate-900 border-l border-slate-800' : 'bg-white border-l border-slate-200'} max-w-sm w-full h-full flex flex-col`}>
                <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-indigo-400" />
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>Notifications</span>
                  </div>
                  <button type="button" onClick={() => setShowNotificationsPanel(false)} className="text-slate-500 hover:text-white cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {notifications.length === 0 && (
                    <div className={`text-center py-12 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      <CheckCircle className="h-7 w-7 mx-auto mb-2 text-emerald-500 opacity-40" />
                      <p className="text-sm">All caught up!</p>
                      <p className="text-xs mt-1">No new notifications</p>
                    </div>
                  )}
                  {notifications.map(notif => {
                    const { icon: NIcon, color, bg } = notifIcon(notif.type);
                    return (
                      <div key={notif.id} className={`p-3.5 rounded-xl border ${bg}`}>
                        <div className="flex items-start gap-3">
                          <NIcon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-800'}`}>{notif.title}</h4>
                            <p className={`text-[11px] leading-relaxed mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── LOGIN MODAL ── */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border max-w-sm w-full shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Cpu className="h-3.5 w-3.5 text-white" />
                </div>
                <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>AIOS</span>
              </div>
              <button type="button" onClick={() => setShowLoginModal(false)} className="text-slate-500 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loginTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
                <h3 className={`font-bold text-base text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>Sign In</h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`} />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Password</label>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                      className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`} />
                  </div>
                </div>
                <button type="button" onClick={() => handleLoginSubmit()} disabled={isLoggingIn} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs p-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                </button>
              </form>
            )}

            {loginTab === 'mfa' && (
              <form onSubmit={handleMfaSubmit} className="p-6 space-y-4">
                <h3 className={`font-bold text-base text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>Verify</h3>
                <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Enter the 6-digit code sent to your email</p>
                <input type="text" required maxLength={6} placeholder="000000" value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                  className={`w-full text-center text-xl font-mono tracking-widest rounded-lg px-3 py-3 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`} />
                <button type="button" onClick={() => handleMfaSubmit()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs p-3 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <ShieldCheck className="h-4 w-4" /> Verify & Enter
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <TelemetryInspector
        componentName={activeInspectorComponent}
        onClose={() => setActiveInspectorComponent(null)}
        theme={theme}
      />
    </div>
  );
}

// ── Root export wrapping provider ──────────────────────────────────────────────
export default function App() {
  const isDbViewRoute = window.location.pathname === '/db-view';

  if (isDbViewRoute) {
    return (
      <AIOSProvider>
        <div className="min-h-screen bg-slate-950 p-6 md:p-10">
          <DatabaseViewer theme="dark" />
        </div>
      </AIOSProvider>
    );
  }

  return (
    <AIOSProvider>
      <AppInner />
    </AIOSProvider>
  );
}
