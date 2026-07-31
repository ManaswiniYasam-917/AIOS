import React from 'react';
import { 
  Activity, 
  Cpu, 
  Server, 
  Users,
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  Clock,
  Zap,
  HardDrive,
  Wifi
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { SystemMetrics, AuditLog } from '../types';

interface DashboardViewProps {
  metrics: SystemMetrics | null;
  logs: AuditLog[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  theme: 'dark' | 'light';
}

export default function DashboardView({ metrics, logs, onRefresh, onNavigate, theme }: DashboardViewProps) {
  const m: SystemMetrics = metrics || {
    cpuUsage: 45,
    ramUsage: 62,
    storageUsage: 49,
    networkIn: 12.4,
    networkOut: 8.7,
    activeAgents: 3,
    connectedDevices: 4,
    runningTasks: 8,
    alertsCount: { info: 1, warning: 1, critical: 1 }
  };

  // Historical data for chart
  const history = [
    { time: '10:00', cpu: 38, ram: 59 },
    { time: '11:00', cpu: 45, ram: 60 },
    { time: '12:00', cpu: 52, ram: 62 },
    { time: '13:00', cpu: 40, ram: 61 },
    { time: '14:00', cpu: 48, ram: 63 },
    { time: 'Now', cpu: m.cpuUsage, ram: m.ramUsage },
  ];

  const isDark = theme === 'dark';

  const card = isDark
    ? 'bg-slate-900 border-slate-800'
    : 'bg-white border-slate-200';

  const labelColor = isDark ? 'text-slate-500' : 'text-slate-400';
  const valueColor = isDark ? 'text-white' : 'text-slate-800';

  // KPI Cards
  const kpis = [
    { label: 'Active Agents', value: String(m.activeAgents), icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Connected Devices', value: `${m.connectedDevices}`, icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Running Tasks', value: `${m.runningTasks}`, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Open Alerts', value: `${m.alertsCount.critical + m.alertsCount.warning}`, icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10' },
  ];

  // Resource meters
  const resources = [
    { label: 'CPU Usage', value: m.cpuUsage, icon: Cpu, color: '#818cf8', gradientId: 'gCpu', gradFrom: '#818cf8', gradTo: '#6366f1' },
    { label: 'RAM Usage', value: m.ramUsage, icon: Zap, color: '#60a5fa', gradientId: 'gRam', gradFrom: '#60a5fa', gradTo: '#3b82f6' },
    { label: 'Storage', value: m.storageUsage, icon: HardDrive, color: '#a78bfa', gradientId: 'gStore', gradFrom: '#a78bfa', gradTo: '#8b5cf6' },
  ];

  // Status items
  const statusItems = [
    { label: 'API Server', status: 'OK', ok: true },
    { label: 'Agent Engine', status: 'Running', ok: true },
    { label: 'Database', status: 'Connected', ok: true },
    { label: 'Device Network', status: '1 Warning', ok: false },
  ];

  // Log status style
  const logStatusStyle = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-emerald-950 text-emerald-400';
      case 'Warning': return 'bg-amber-950 text-amber-400';
      default: return 'bg-red-950 text-red-400';
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className={`text-2xl font-bold ${valueColor}`}>Dashboard</h2>
          <p className={`text-sm mt-1 ${labelColor}`}>
            Overview of your AI agents, devices, and system health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border ${isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </span>
          <button 
            onClick={onRefresh}
            className={`p-2 rounded-lg border transition-all ${isDark ? 'border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`p-4 rounded-xl border flex items-center gap-4 shadow-sm ${card}`}>
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className={`text-[11px] font-medium uppercase tracking-wide ${labelColor}`}>{label}</p>
              <p className={`text-xl font-bold font-mono ${valueColor}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Middle: Resources + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Resource Meters */}
        <div className={`p-5 rounded-xl border ${card} space-y-5`}>
          <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: isDark ? '#1e293b' : '#f1f5f9' }}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>System Resources</h3>
          </div>

          {resources.map(({ label, value, icon: Icon, color, gradFrom, gradTo }) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between items-center text-xs font-medium">
                <span className={`flex items-center gap-1.5 ${labelColor}`}>
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
                <span className="font-bold font-mono" style={{ color }}>{value}%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${value}%`,
                    background: `linear-gradient(to right, ${gradFrom}, ${gradTo})`
                  }}
                />
              </div>
            </div>
          ))}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { label: 'Network', value: '99.98%', color: 'text-emerald-400' },
              { label: 'Latency', value: '1.4ms', color: 'text-indigo-400' },
              { label: 'Status', value: 'Good', color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`p-2 rounded-lg text-center ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                <p className={`text-[9px] uppercase font-bold ${labelColor}`}>{label}</p>
                <p className={`text-xs font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CPU & RAM Chart */}
        <div className={`p-5 rounded-xl border lg:col-span-2 ${card} space-y-4`}>
          <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: isDark ? '#1e293b' : '#f1f5f9' }}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>CPU & RAM Over Time</h3>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-400" /> CPU</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> RAM</span>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCpu2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gRam2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="time" stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#475569' : '#94a3b8'} fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="cpu" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#gCpu2)" name="CPU %" />
                <Area type="monotone" dataKey="ram" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#gRam2)" name="RAM %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom: Recent Logs + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Activity */}
        <div className={`p-5 rounded-xl border lg:col-span-8 ${card} space-y-4`}>
          <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: isDark ? '#1e293b' : '#f1f5f9' }}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Recent Activity</h3>
            <button 
              onClick={() => onNavigate('logs')}
              className="text-[11px] text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.length === 0 && (
              <p className={`text-xs text-center py-6 ${labelColor}`}>No recent activity</p>
            )}
            {logs.slice(0, 6).map((log) => (
              <div 
                key={log.id} 
                className={`p-3 rounded-lg text-xs border flex items-start justify-between gap-3 transition-colors ${
                  isDark ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/80'
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${logStatusStyle(log.status)}`}>
                      {log.action}
                    </span>
                    <span className={`${labelColor} text-[10px] font-mono`}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{log.details}</p>
                </div>
                <span className={`text-[10px] shrink-0 hidden sm:inline ${labelColor}`}>by {log.user}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className={`p-5 rounded-xl border lg:col-span-4 ${card} space-y-4`}>
          <div className="pb-3 border-b" style={{ borderColor: isDark ? '#1e293b' : '#f1f5f9' }}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>System Health</h3>
          </div>

          <div className="space-y-3">
            {statusItems.map(({ label, status, ok }) => (
              <div key={label} className="flex justify-between items-center text-xs">
                <span className={labelColor}>{label}</span>
                <span className={`flex items-center gap-1 font-semibold font-mono text-[11px] ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {ok ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                  {status}
                </span>
              </div>
            ))}
          </div>

          {/* Network stats */}
          <div className={`p-3 rounded-lg border text-xs space-y-2 ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Wifi className="h-3.5 w-3.5 text-indigo-400" />
              Network Traffic
            </p>
            <div className="flex justify-between">
              <span className={labelColor}>Incoming</span>
              <span className="font-mono text-indigo-400 font-bold">{m.networkIn} MB/s</span>
            </div>
            <div className="flex justify-between">
              <span className={labelColor}>Outgoing</span>
              <span className="font-mono text-blue-400 font-bold">{m.networkOut} MB/s</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
