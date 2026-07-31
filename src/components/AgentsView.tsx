import React, { useState } from 'react';
import { Agent, AgentMessage } from '../types';
import AgentNetworkView from './AgentNetworkView';
import { Search, ChevronDown, ChevronUp, Cpu, Activity, User, ShieldAlert } from 'lucide-react';

interface AgentsViewProps {
  theme: 'dark' | 'light';
  isDeveloperMode: boolean;
  agents: Agent[];
  messages: AgentMessage[];
  onCreateAgent: (agentData: Partial<Agent>) => Promise<any>;
  onControlAgent: (id: string, action: 'pause' | 'resume' | 'deploy' | 'clone') => Promise<any>;
  onDeleteAgent: (id: string) => Promise<any>;
  onSendMessage: (agentId: string, text: string) => Promise<any>;
  userEmail: string;
  userRole: string;
  onOpenInspector: (name: string) => void;
}

const AGENT_WORKFLOWS: Record<string, { purpose: string; steps: string[] }> = {
  'ambulance': {
    purpose: 'Locate nearest ambulance, dispatch driver, calculate optimal routing, and track transit ETA.',
    steps: ['Find nearest ambulance', 'Assign Driver', 'Calculate Route', 'Dispatch', 'Track Live ETA']
  },
  'police': {
    purpose: 'Secure incident perimeter, reroute lanes, and manage law enforcement presence.',
    steps: ['Dispatch local cruiser', 'Establish perimeter', 'Divert active traffic', 'Liaise with emergency response']
  },
  'traffic': {
    purpose: 'Optimize signal timing at neighboring crossings and communicate detour paths.',
    steps: ['Scan traffic cams', 'Engage smart signals', 'Set intersection green-waves', 'Broadcast detour warning']
  },
  'hospital': {
    purpose: 'Alert trauma center staff, reserve triage beds, and prep critical equipment.',
    steps: ['Assess ICU availability', 'Reserve trauma beds', 'Assign critical surgeons', 'Confirm blood stock']
  },
  'drone': {
    purpose: 'Deploy aerial survey drone to stream high-def visual telemetry back to dispatch.',
    steps: ['Launch hexacopter', 'Initialize thermal scan', 'Transmit live stream', 'Estimate hazard radius']
  },
  'fire': {
    purpose: 'Dispatch fire rescue units and manage containment operations.',
    steps: ['Dispatch 3 engines', 'Connect regional hydrants', 'Ventilate building space', 'Suppress fire core']
  },
  'rescue': {
    purpose: 'Deploy emergency rescue rafts, lifejackets, and rescue operations.',
    steps: ['Deploy inflatables', 'Navigate flood zone', 'Conduct airlift scans', 'Deliver emergency supply packets']
  },
  'power': {
    purpose: 'Shut down localized grids to prevent fires and reroute primary backup loops.',
    steps: ['Isolate electrical fault', 'Shutdown local grid nodes', 'Reroute backup lines', 'Initiate repair dispatch']
  },
  'defense': {
    purpose: 'Establish secure perimeter surveillance and alert defensive tactical response.',
    steps: ['Lockdown localized sector', 'Activate perimeter sweep', 'Establish encrypted comms', 'Coordinate response team']
  }
};

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'hospital', label: 'Hospital / Medical' },
  { id: 'police', label: 'Police / Patrol' },
  { id: 'traffic', label: 'Traffic / Signals' },
  { id: 'drone', label: 'Drone / Aerial' },
  { id: 'power', label: 'Power / Grid' },
  { id: 'defense', label: 'Defense / Military' },
];

export default function AgentsView(props: AgentsViewProps) {
  const { theme, isDeveloperMode, agents, onOpenInspector } = props;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  const isDark = theme === 'dark';

  // Local helper to match agents to category filters
  const matchesCategory = (agent: Agent, category: string) => {
    if (category === 'all') return true;
    const name = agent.name.toLowerCase();
    const desc = agent.description.toLowerCase();
    const role = agent.role.toLowerCase();

    if (category === 'hospital') return name.includes('hospital') || name.includes('medical') || name.includes('ambulance') || role.includes('medical') || role.includes('hospital');
    if (category === 'police') return name.includes('police') || name.includes('patrol') || desc.includes('law') || role.includes('police') || role.includes('security');
    if (category === 'traffic') return name.includes('traffic') || name.includes('signal') || name.includes('road') || role.includes('traffic') || role.includes('routing');
    if (category === 'drone') return name.includes('drone') || name.includes('aero') || name.includes('aerial') || role.includes('surveillance') || role.includes('drone');
    if (category === 'power') return name.includes('power') || name.includes('grid') || name.includes('utility') || role.includes('power') || role.includes('electric');
    if (category === 'defense') return name.includes('defense') || name.includes('military') || name.includes('guard') || role.includes('defense') || role.includes('border');

    return false;
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          agent.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = matchesCategory(agent, selectedCategory);
    return matchesSearch && matchesCat;
  });

  const getAgentWorkflowDetail = (agent: Agent) => {
    const name = agent.name.toLowerCase();
    
    // Find matching workflow
    if (name.includes('ambulance')) return AGENT_WORKFLOWS.ambulance;
    if (name.includes('police')) return AGENT_WORKFLOWS.police;
    if (name.includes('traffic')) return AGENT_WORKFLOWS.traffic;
    if (name.includes('hospital')) return AGENT_WORKFLOWS.hospital;
    if (name.includes('drone')) return AGENT_WORKFLOWS.drone;
    if (name.includes('fire')) return AGENT_WORKFLOWS.fire;
    if (name.includes('rescue')) return AGENT_WORKFLOWS.rescue;
    if (name.includes('power') || name.includes('utility') || name.includes('grid')) return AGENT_WORKFLOWS.power;
    if (name.includes('defense') || name.includes('military') || name.includes('border') || name.includes('security')) return AGENT_WORKFLOWS.defense;

    // default fallback
    return {
      purpose: `Automate tasks related to ${agent.role} operations, securing communications and logging tool usage.`,
      steps: ['Establish active controller connection', 'Check safety bounds', 'Retrieve memory weights', 'Execute task instruction', 'Return final telemetry']
    };
  };

  return (
    <div className={`space-y-8 max-w-4xl mx-auto pb-10 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-sans">AIOS Agents</h1>
        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Deploy, configure, and inspect individual agent capabilities</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        
        {/* Search */}
        <div className="relative">
          <input 
            type="text"
            placeholder="Search active agents by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs outline-none transition-all ${
              isDark 
                ? 'bg-slate-900 border-slate-800 focus:border-blue-500 text-white placeholder-slate-650' 
                : 'bg-white border-slate-200 focus:border-blue-400 text-slate-900 placeholder-slate-400 shadow-sm'
            }`}
          />
          <Search className="h-4.5 w-4.5 absolute left-3.5 top-3.5 opacity-40" />
        </div>

        {/* Categories Carousel / Filters */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 border-blue-500 text-white shadow'
                  : isDark ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-850' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Agents grid in Simple Mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full text-center py-10 opacity-55 text-xs">
            No agents found matching your current query.
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const isExpanded = expandedAgentId === agent.id;
            const flow = getAgentWorkflowDetail(agent);

            return (
              <div 
                key={agent.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isExpanded ? 'border-blue-500 bg-blue-600/[0.01]' : isDark ? 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900/80' : 'bg-white border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                {/* Accordion header */}
                <button
                  onClick={() => onOpenInspector(agent.name)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8.5 w-8.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold">{agent.name}</h3>
                      <span className={`text-[10px] opacity-50 block mt-0.5`}>{agent.role}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      agent.status === 'Running' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {agent.status}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4.5 w-4.5 opacity-55" /> : <ChevronDown className="h-4.5 w-4.5 opacity-55" />}
                  </div>
                </button>

                {/* Progressive disclosure accordion body */}
                {isExpanded && (
                  <div className={`p-4 border-t px-5 space-y-4 text-xs ${isDark ? 'border-slate-850/60' : 'border-slate-150'}`}>
                    
                    {/* Card style answers: What is this? -> What is happening? -> What happens next? */}
                    <div className="space-y-3 border-b border-slate-800/55 pb-3">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">What is this?</span>
                        <p className="opacity-80 mt-0.5">{agent.description || 'Core dispatch agent initialized under the AIOS controller layer.'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">What is happening?</span>
                        <p className="opacity-80 mt-0.5">{flow.purpose}</p>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">What happens next?</span>
                        <p className="opacity-80 mt-0.5">Executes the procedural workflow steps on instruction request.</p>
                      </div>
                    </div>

                    {/* Procedural steps */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Procedural steps</span>
                      <div className="space-y-1.5 pl-1">
                        {flow.steps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2 font-medium">
                            <span className="text-[10px] w-4.5 h-4.5 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span className="opacity-80 text-[11.5px]">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Expert Mode Additions */}
      {isDeveloperMode && (
        <div className="border-t border-slate-800 pt-8 space-y-6">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-blue-400 flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Developer Controller & Workspace
            </h3>
            <p className="text-xs opacity-50 mt-1">Configure advanced tools, memory indexes, reasoning models, and agent deployment parameters.</p>
          </div>

          <AgentNetworkView {...props} />
        </div>
      )}

    </div>
  );
}
