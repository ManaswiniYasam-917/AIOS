import React, { useState } from 'react';
import { useAIOS } from '../context/AIOSContext';
import { 
  Users, 
  Activity, 
  ShieldAlert, 
  CheckCircle, 
  Cpu, 
  Server, 
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { SystemMetrics, AuditLog, EdgeDevice, MarketplaceAgent } from '../types';
import AnalyticsView from './AnalyticsView';
import EdgeManagerView from './EdgeManagerView';
import MarketplaceView from './MarketplaceView';

interface InsightsViewProps {
  theme: 'dark' | 'light';
  isDeveloperMode: boolean;
  metrics: SystemMetrics | null;
  logs: AuditLog[];
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  devices: EdgeDevice[];
  onTriggerDiagnostic: (id: string) => Promise<any>;
  marketplaceAgents: MarketplaceAgent[];
  onInstallAgent: (id: string) => Promise<any>;
}

export default function InsightsView({
  theme,
  isDeveloperMode,
  metrics,
  logs,
  onRefresh,
  onNavigate,
  devices,
  onTriggerDiagnostic,
  marketplaceAgents,
  onInstallAgent
}: InsightsViewProps) {
  const { missions, agents } = useAIOS();
  const [expertTab, setExpertTab] = useState<'analytics' | 'edge' | 'marketplace'>('analytics');

  const isDark = theme === 'dark';

  // Dynamic calculations for the 4 KPI Cards
  const activeMissionsCount = missions.filter(m => m.status === 'active' || m.status === 'pending').length;
  
  // count agents deployed/active
  const runningAgentsCount = agents.filter(a => a.status === 'working').length || metrics?.activeAgents || 3;

  // success rate calculation
  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const failedMissions = missions.filter(m => m.status === 'failed').length;
  const totalEnded = completedMissions + failedMissions;
  const successRate = totalEnded > 0 ? Math.round((completedMissions / totalEnded) * 100) : 98; // fallback to 98%

  // Critical alerts count
  const criticalAlerts = metrics?.alertsCount?.critical || 0;

  // Mock historical data for success rate chart
  const historyData = [
    { name: '08:00', rate: 94 },
    { name: '09:00', rate: 96 },
    { name: '10:00', rate: 95 },
    { name: '11:00', rate: 97 },
    { name: '12:00', rate: 96 },
    { name: 'Now', rate: successRate },
  ];

  return (
    <div className={`space-y-8 max-w-4xl mx-auto pb-10 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Insights</h1>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>System KPIs, core analytics, and operational metrics</p>
      </div>

      {/* Exactly 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Missions */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-50 block">Active Dispatches</span>
            <span className="text-2xl font-extrabold tracking-tight block mt-1.5">{activeMissionsCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-2">
            <Activity className="h-3.5 w-3.5" /> Active responses
          </div>
        </div>

        {/* KPI 2: Running Agents */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-50 block">Active Responders</span>
            <span className="text-2xl font-extrabold tracking-tight block mt-1.5">{runningAgentsCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-orange-400 font-bold uppercase tracking-wider mt-2">
            <Users className="h-3.5 w-3.5" /> Emergency units
          </div>
        </div>

        {/* KPI 3: Success Rate */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-50 block">Resolution Rate</span>
            <span className="text-2xl font-extrabold tracking-tight block mt-1.5">{successRate}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-2">
            <CheckCircle className="h-3.5 w-3.5" /> Help completed
          </div>
        </div>

        {/* KPI 4: Critical Alerts */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-50 block">Safety Alerts</span>
            <span className="text-2xl font-extrabold tracking-tight block mt-1.5">{criticalAlerts}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold uppercase tracking-wider mt-2">
            <ShieldAlert className="h-3.5 w-3.5" /> Active threats
          </div>
        </div>

      </div>

      {/* Simple Mode Success Chart */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-50 block">Overview</span>
            <h3 className="font-bold text-sm mt-0.5">Success Rate History</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Dynamic rate tracking
          </span>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke={isDark ? '#475569' : '#94a3b8'} 
                fontSize={10}
                tickLine={false} 
              />
              <YAxis 
                stroke={isDark ? '#475569' : '#94a3b8'} 
                fontSize={10} 
                domain={[80, 100]}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  borderColor: isDark ? '#1e293b' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#000000',
                  fontSize: 11,
                  borderRadius: 8
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="rate" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRate)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Expert Mode Panels */}
      {isDeveloperMode && (
        <div className="border-t border-slate-800 pt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-blue-400 flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Advanced Insights & Devices
              </h3>
              <p className="text-xs opacity-50 mt-1">Audit detailed system logs, configure and inspect edge devices, or install marketplace modules.</p>
            </div>
            
            {/* Custom Tab Toggles */}
            <div className={`p-0.5 rounded-lg flex gap-1 ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <button
                onClick={() => setExpertTab('analytics')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  expertTab === 'analytics' ? 'bg-blue-600 text-white shadow' : 'opacity-55 hover:opacity-100'
                }`}
              >
                <Activity className="h-3.5 w-3.5" /> Analytics
              </button>
              <button
                onClick={() => setExpertTab('edge')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  expertTab === 'edge' ? 'bg-blue-600 text-white shadow' : 'opacity-55 hover:opacity-100'
                }`}
              >
                <Server className="h-3.5 w-3.5" /> Edge Devices
              </button>
              <button
                onClick={() => setExpertTab('marketplace')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                  expertTab === 'marketplace' ? 'bg-blue-600 text-white shadow' : 'opacity-55 hover:opacity-100'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" /> Marketplace
              </button>
            </div>
          </div>

          {/* Expert Tab Contents */}
          <div className="space-y-4">
            {expertTab === 'analytics' && (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <AnalyticsView 
                  metrics={metrics} 
                  devices={devices} 
                  theme={theme}
                />
              </div>
            )}

            {expertTab === 'edge' && (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <EdgeManagerView 
                  devices={devices} 
                  onTriggerDiagnostic={onTriggerDiagnostic}
                  theme={theme}
                />
              </div>
            )}

            {expertTab === 'marketplace' && (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                <MarketplaceView 
                  marketplaceAgents={marketplaceAgents} 
                  onInstallAgent={onInstallAgent}
                  theme={theme}
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
