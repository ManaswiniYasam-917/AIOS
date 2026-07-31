import React from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  Activity, 
  RefreshCw, 
  Clock, 
  Zap, 
  AlertTriangle,
  Cpu,
  Layers,
  Server
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { SystemMetrics, EdgeDevice } from '../types';

interface AnalyticsViewProps {
  metrics: SystemMetrics | null;
  devices: EdgeDevice[];
  theme: 'dark' | 'light';
}

export default function AnalyticsView({ metrics, devices, theme }: AnalyticsViewProps) {
  const isDark = theme === 'dark';

  // Calculate actual composition of device types for our Pie Chart
  const typeCounts: Record<string, number> = {};
  devices.forEach(d => {
    typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;
  });

  const pieData = Object.keys(typeCounts).map(k => ({
    name: k,
    value: typeCounts[k]
  }));

  // Style colors for Pie Chart
  const COLORS = ['#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981'];

  // Temporal load patterns data for Area charts
  const resourceHistory = [
    { hour: '00:00', agentsLoad: 12, edgeCpu: 35, failureCount: 0 },
    { hour: '04:00', agentsLoad: 15, edgeCpu: 28, failureCount: 1 },
    { hour: '08:00', agentsLoad: 35, edgeCpu: 52, failureCount: 0 },
    { hour: '12:00', agentsLoad: 48, edgeCpu: 68, failureCount: 3 },
    { hour: '16:00', agentsLoad: 42, edgeCpu: 61, failureCount: 1 },
    { hour: '20:00', agentsLoad: 28, edgeCpu: 44, failureCount: 0 },
    { hour: '24:00', agentsLoad: 18, edgeCpu: 39, failureCount: 0 }
  ];

  // Performance of Agent Nodes
  const agentPerformanceData = [
    { name: 'ARES-1', tasksSolved: 1420, avgLatencyMs: 14, accuracy: 99.8 },
    { name: 'HELIOS-4', tasksSolved: 1105, avgLatencyMs: 25, accuracy: 99.2 },
    { name: 'MINERVA-7', tasksSolved: 742, avgLatencyMs: 48, accuracy: 98.9 },
    { name: 'HERMES-9', tasksSolved: 310, avgLatencyMs: 12, accuracy: 94.5 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>📊 Analytics</h2>
          <p className="text-xs text-slate-400">Charts and graphs showing how your agents and devices are performing over time.</p>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Temporal Workloads */}
        <div className={`p-5 rounded-lg border ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        } space-y-4 shadow-sm`}>
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-400" />
              Temporal Load & Synchronization Failures
            </span>
            <span className="text-[10px] text-slate-500 font-mono">24h Interval</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resourceHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#1e293b' : '#cbd5e1',
                    fontSize: '11px',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }} 
                />
                <Area type="monotone" dataKey="agentsLoad" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorAgents)" name="Microservice Active Loops" />
                <Area type="monotone" dataKey="edgeCpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" name="Edge Fleet Mean CPU %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Agent Performance accuracy & task velocity */}
        <div className={`p-5 rounded-lg border ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        } space-y-4 shadow-sm`}>
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              Agent Core Task Completion metrics
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Real-time performance</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#1e293b' : '#cbd5e1',
                    fontSize: '11px',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }} 
                />
                <Bar dataKey="tasksSolved" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tasks Solved (Accumulated)" />
                <Bar dataKey="avgLatencyMs" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Mean Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Composition of Hardware Fleet */}
        <div className={`p-5 rounded-lg border ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        } space-y-4 shadow-sm`}>
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <PieChart className="h-4 w-4 text-cyan-400" />
              Registered Hardware Class Composition
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-6 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                      borderColor: isDark ? '#1e293b' : '#cbd5e1',
                      fontSize: '11px',
                      color: isDark ? '#f8fafc' : '#0f172a'
                    }} 
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="sm:col-span-6 space-y-2 font-mono text-[10px] text-slate-400">
              {pieData.map((pkg, i) => (
                <div key={pkg.name} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{pkg.name.toUpperCase()}</span>
                  </div>
                  <span className="text-slate-300 font-bold">{pkg.value} Nodes</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Diagnostic Accuracy Summary */}
        <div className={`p-5 rounded-lg border ${
          isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
        } space-y-5 shadow-sm flex flex-col justify-between`}>
          
          <div className="border-b border-slate-850 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              High-Assurance SLA Targets
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center font-mono py-2">
            <div className="space-y-1">
              <span className="text-slate-500 text-[9px] uppercase block">Accuracy Target</span>
              <span className="text-emerald-400 font-bold text-lg">99.9%</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-[9px] uppercase block">Failure Margin</span>
              <span className="text-cyan-400 font-bold text-lg">&lt;0.05%</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-[9px] uppercase block">Uptime Standard</span>
              <span className="text-emerald-400 font-bold text-lg">99.999%</span>
            </div>
          </div>

          <div className={`p-3.5 rounded border font-mono text-[9px] text-slate-500 ${isDark ? 'bg-slate-950/80 border-slate-900' : 'bg-slate-50 border-slate-150'}`}>
            <span className="text-slate-400 block font-bold mb-1">AUTOMATED HEALTH DIAGNOSTICS</span>
            <span>AIOS core cluster logs are evaluated every 10s. If average model latency exceeds 150ms on edge nodes, thread quarantine automatically triggers.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
