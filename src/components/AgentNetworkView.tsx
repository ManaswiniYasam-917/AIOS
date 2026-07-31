import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Trash2,
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Sparkles,
  Zap,
  Brain,
  ArrowRight,
  Activity,
  Radio,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  X
} from 'lucide-react';
import { Agent, AgentMessage } from '../types';

interface AgentNetworkViewProps {
  agents: Agent[];
  messages: AgentMessage[];
  onCreateAgent: (agentData: Partial<Agent>) => Promise<any>;
  onControlAgent: (id: string, action: 'pause' | 'resume' | 'deploy' | 'clone') => Promise<any>;
  onDeleteAgent: (id: string) => Promise<any>;
  onSendMessage: (agentId: string, text: string) => Promise<{ id: string; content: string }>;
  theme: 'dark' | 'light';
  userEmail: string;
  userRole: string;
}

// Human-readable type labels with emojis
const MESSAGE_EMOJI: Record<string, string> = {
  Direct: '💬',
  Broadcast: '📢',
  TaskSharing: '📋',
  KnowledgeSharing: '📚',
  Heartbeat: '💓',
};

const MESSAGE_LABEL: Record<string, string> = {
  Direct: 'Direct message',
  Broadcast: 'Broadcast',
  TaskSharing: 'Task shared',
  KnowledgeSharing: 'Knowledge shared',
  Heartbeat: 'Heartbeat check',
};

// Agent status color helpers
const statusColor = (status: string) => {
  switch (status) {
    case 'Running': return '#10b981'; // green
    case 'Paused': return '#f59e0b'; // amber
    case 'Failed': return '#ef4444'; // red
    default: return '#64748b'; // gray
  }
};

const statusBg = (status: string) => {
  switch (status) {
    case 'Running': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'Paused': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'Failed': return 'bg-red-500/10 text-red-400 border-red-500/30';
    default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};

const statusDot = (status: string) => {
  switch (status) {
    case 'Running': return 'bg-emerald-400 animate-pulse';
    case 'Paused': return 'bg-amber-400';
    case 'Failed': return 'bg-red-400 animate-pulse';
    default: return 'bg-slate-500';
  }
};

export default function AgentNetworkView({
  agents,
  messages,
  onCreateAgent,
  onControlAgent,
  onDeleteAgent,
  onSendMessage,
  theme,
  userEmail,
  userRole,
}: AgentNetworkViewProps) {
  const isDark = theme === 'dark';

  // Chat state
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ from: 'me' | 'agent'; text: string; time: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Create agent modal state
  const [showCreate, setShowCreate] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMemory, setNewMemory] = useState<Agent['memory']>('Short-term');
  const [newReasoning, setNewReasoning] = useState<Agent['reasoning']>('Zero-shot');
  const [newPlanning, setNewPlanning] = useState<Agent['planning']>('BFS');
  const [newTools, setNewTools] = useState('');
  const [newKnowledge, setNewKnowledge] = useState('');

  // Animated "active connection" tracking
  const [activeConnId, setActiveConnId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cycle through message connections to animate SVG lines
  useEffect(() => {
    if (messages.length === 0) return;
    let idx = 0;
    const interval = setInterval(() => {
      const msg = messages[idx % messages.length];
      setActiveConnId(`${msg.senderId}-${msg.receiverId}`);
      setTimeout(() => setActiveConnId(null), 1200);
      idx++;
    }, 2500);
    return () => clearInterval(interval);
  }, [messages]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Open chat for an agent
  const openChat = (agent: Agent) => {
    setChatAgent(agent);
    setChatLog([{
      from: 'agent',
      text: `Hi! I'm ${agent.name}. My job is to ${agent.goal?.toLowerCase() || 'assist you'}. How can I help?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const sendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !chatAgent) return;
    const text = chatInput;
    setChatInput('');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog(p => [...p, { from: 'me', text, time }]);
    setChatLoading(true);
    try {
      const res = await onSendMessage(chatAgent.id, text);
      setChatLog(p => [...p, {
        from: 'agent',
        text: res.content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      setChatLog(p => [...p, { from: 'agent', text: 'Sorry, I could not respond right now.', time }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Gemini AI suggestion
  const handleAiSuggest = async () => {
    if (!newRole || !newGoal) {
      alert('Please fill in Role and Goal first.');
      return;
    }
    setIsSuggesting(true);
    try {
      const res = await fetch('/api/agent/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, goal: newGoal })
      });
      const data = await res.json();
      if (data.suggestion) {
        const s = data.suggestion;
        setNewName(s.suggestedName || '');
        setNewDesc(s.suggestedDescription || '');
        setNewTools((s.suggestedTools || []).join(', '));
        setNewKnowledge((s.suggestedKnowledge || []).join(', '));
        if (s.reasoningModel) setNewReasoning(s.reasoningModel);
        if (s.planningMethod) setNewPlanning(s.planningMethod);
      }
    } catch { /* ignore */ }
    setIsSuggesting(false);
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await onCreateAgent({
      name: newName || 'New Agent',
      description: newDesc,
      role: newRole || 'Assistant',
      goal: newGoal || 'Help with tasks',
      memory: newMemory,
      reasoning: newReasoning,
      planning: newPlanning,
      knowledge: newKnowledge.split(',').map(s => s.trim()).filter(Boolean),
      tools: newTools.split(',').map(s => s.trim()).filter(Boolean),
      permissions: [],
      configuration: {}
    });
    setShowCreate(false);
    setNewName(''); setNewRole(''); setNewGoal(''); setNewDesc('');
    setNewTools(''); setNewKnowledge('');
    setNewMemory('Short-term'); setNewReasoning('Zero-shot'); setNewPlanning('BFS');
  };

  // ---- SVG Network Map Layout ----
  // Position agents in a circle on the SVG canvas
  const W = 600, H = 320;
  const cx = W / 2, cy = H / 2, radius = Math.min(W, H) / 2 - 55;

  const agentPositions = agents.map((a, i) => {
    const angle = (2 * Math.PI * i) / Math.max(agents.length, 1) - Math.PI / 2;
    return {
      agent: a,
      x: agents.length === 1 ? cx : cx + radius * Math.cos(angle),
      y: agents.length === 1 ? cy : cy + radius * Math.sin(angle),
    };
  });

  // Find positions by agent ID
  const posById = Object.fromEntries(agentPositions.map(p => [p.agent.id, p]));

  // Unique edges from messages
  const edges: Array<{ fromId: string; toId: string; key: string }> = [];
  const seenEdges = new Set<string>();
  messages.forEach(msg => {
    if (msg.receiverId === 'All') {
      // broadcast: connect sender to all others
      agents.forEach(a => {
        if (a.id !== msg.senderId) {
          const key = [msg.senderId, a.id].sort().join('-');
          if (!seenEdges.has(key)) {
            seenEdges.add(key);
            edges.push({ fromId: msg.senderId, toId: a.id, key });
          }
        }
      });
    } else {
      const key = [msg.senderId, msg.receiverId].sort().join('-');
      if (!seenEdges.has(key)) {
        seenEdges.add(key);
        edges.push({ fromId: msg.senderId, toId: msg.receiverId, key });
      }
    }
  });

  const card = isDark
    ? 'bg-slate-900 border-slate-800'
    : 'bg-white border-slate-200';

  const label = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            🤖 Agents
          </h2>
          <p className={`text-sm mt-1 ${label}`}>
            See all your agents, what they're doing, and how they talk to each other.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Agent
        </button>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* LEFT — Agent Cards */}
        <div className="xl:col-span-4 space-y-3">
          <h3 className={`text-xs font-bold uppercase tracking-widest ${label} mb-2`}>
            Your Agents ({agents.length})
          </h3>

          {agents.length === 0 && (
            <div className={`rounded-xl border border-dashed p-8 text-center ${isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No agents yet</p>
              <p className="text-xs mt-1">Click "Add Agent" to create your first one</p>
            </div>
          )}

          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`rounded-xl border p-4 transition-all hover:shadow-md ${card} ${
                chatAgent?.id === agent.id ? 'ring-2 ring-indigo-500/50' : ''
              }`}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot(agent.status)}`} />
                  <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {agent.name}
                  </h4>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBg(agent.status)}`}>
                  {agent.status}
                </span>
              </div>

              {/* Role badge */}
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded mb-2 ${isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                {agent.role}
              </span>

              {/* What this agent does — plain English */}
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className="font-semibold">Goal:</span> {agent.goal || agent.description || 'No goal set.'}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {[
                  { icon: Brain, label: agent.memory },
                  { icon: Zap, label: agent.reasoning },
                  { icon: Activity, label: agent.planning },
                ].map(({ icon: Icon, label: lbl }) => (
                  <span
                    key={lbl}
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {lbl}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t pt-2.5 mt-1" style={{ borderColor: isDark ? '#1e293b' : '#e2e8f0' }}>
                <div className="flex gap-1">
                  {agent.status === 'Running' ? (
                    <button
                      onClick={() => onControlAgent(agent.id, 'pause')}
                      title="Pause agent"
                      className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onControlAgent(agent.id, 'resume')}
                      title="Start agent"
                      className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onControlAgent(agent.id, 'clone')}
                    title="Duplicate agent"
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteAgent(agent.id)}
                    title="Delete agent"
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => openChat(agent)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CENTER — Connection Map */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <h3 className={`text-xs font-bold uppercase tracking-widest ${label} mb-2`}>
            Agent Connections
          </h3>
          <div className={`rounded-xl border p-3 ${card}`}>
            {agents.length < 2 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Radio className="h-8 w-8 opacity-20 mb-2" />
                <p className={`text-sm ${label}`}>Add 2 or more agents to see their connections</p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 300 }}>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Background grid */}
                <pattern id="netgrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill={isDark ? '#1e293b' : '#e2e8f0'} />
                </pattern>
                <rect width="100%" height="100%" fill="url(#netgrid)" rx="8" />

                {/* Connection lines */}
                {edges.map(edge => {
                  const from = posById[edge.fromId];
                  const to = posById[edge.toId];
                  if (!from || !to) return null;
                  const isActive = activeConnId === edge.key || activeConnId === [edge.toId, edge.fromId].join('-');
                  return (
                    <g key={edge.key}>
                      {/* Base line */}
                      <line
                        x1={from.x} y1={from.y}
                        x2={to.x} y2={to.y}
                        stroke={isDark ? '#334155' : '#cbd5e1'}
                        strokeWidth="1.5"
                        strokeDasharray="5 4"
                      />
                      {/* Active flash overlay */}
                      {isActive && (
                        <line
                          x1={from.x} y1={from.y}
                          x2={to.x} y2={to.y}
                          stroke="#818cf8"
                          strokeWidth="2.5"
                          strokeDasharray="5 4"
                          filter="url(#glow)"
                          opacity="0.85"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Agent nodes */}
                {agentPositions.map(({ agent, x, y }) => {
                  const color = statusColor(agent.status);
                  const isChat = chatAgent?.id === agent.id;
                  return (
                    <g key={agent.id} onClick={() => openChat(agent)} className="cursor-pointer">
                      {/* Outer glow ring for running agents */}
                      {agent.status === 'Running' && (
                        <circle cx={x} cy={y} r="22" fill={color} opacity="0.08" />
                      )}
                      {/* Selected ring */}
                      {isChat && (
                        <circle cx={x} cy={y} r="20" fill="none" stroke="#818cf8" strokeWidth="2" />
                      )}
                      {/* Main circle */}
                      <circle
                        cx={x} cy={y} r="16"
                        fill={isDark ? '#1e293b' : '#f8fafc'}
                        stroke={color}
                        strokeWidth={isChat ? "2.5" : "1.5"}
                      />
                      {/* Status dot */}
                      <circle
                        cx={x + 11} cy={y - 11} r="4"
                        fill={color}
                        stroke={isDark ? '#0f172a' : '#ffffff'}
                        strokeWidth="1.5"
                      />
                      {/* Agent initials */}
                      <text
                        x={x} y={y + 1}
                        textAnchor="middle" dominantBaseline="middle"
                        fill={isDark ? '#e2e8f0' : '#334155'}
                        fontSize="9"
                        fontWeight="700"
                        fontFamily="system-ui, sans-serif"
                      >
                        {agent.name.slice(0, 2).toUpperCase()}
                      </text>
                      {/* Name label below */}
                      <text
                        x={x} y={y + 26}
                        textAnchor="middle"
                        fill={isDark ? '#94a3b8' : '#64748b'}
                        fontSize="8"
                        fontFamily="system-ui, sans-serif"
                      >
                        {agent.name.length > 12 ? agent.name.slice(0, 11) + '…' : agent.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Legend */}
            <div className={`flex items-center gap-4 text-[10px] pt-2 border-t mt-2 ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
              {[
                { color: 'bg-emerald-400', label: 'Running' },
                { color: 'bg-amber-400', label: 'Paused' },
                { color: 'bg-red-400', label: 'Failed' },
                { color: 'bg-indigo-400', label: 'Active Link' },
              ].map(({ color, label: l }) => (
                <span key={l} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          {chatAgent ? (
            <div className={`rounded-xl border flex flex-col ${card}`} style={{ height: 340 }}>
              {/* Chat header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${statusDot(chatAgent.status)}`} />
                  <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {chatAgent.name}
                  </span>
                  <span className={`text-[10px] ${label}`}>{chatAgent.role}</span>
                </div>
                <button onClick={() => setChatAgent(null)} className={`${label} hover:text-red-400`}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatLog.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.from === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.from === 'me'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : isDark ? 'bg-slate-800 text-slate-200 rounded-bl-sm' : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[9px] mt-0.5 ${label}`}>{msg.time}</span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start">
                    <div className={`px-3 py-2 rounded-xl rounded-bl-sm text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                      <Loader2 className="h-3 w-3 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <form onSubmit={sendChat} className={`flex gap-2 p-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={`Message ${chatAgent.name}…`}
                  className={`flex-1 text-xs rounded-lg px-3 py-2 outline-none ${isDark ? 'bg-slate-800 text-white placeholder-slate-500 border border-slate-700 focus:border-indigo-500' : 'bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-indigo-400'}`}
                />
                <button type="submit" className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ) : (
            <div className={`rounded-xl border border-dashed flex flex-col items-center justify-center p-6 text-center ${isDark ? 'border-slate-700 text-slate-600' : 'border-slate-200 text-slate-400'}`} style={{ height: 340 }}>
              <MessageSquare className="h-7 w-7 mb-2 opacity-30" />
              <p className="text-sm font-medium">Click an agent to chat</p>
              <p className="text-xs mt-1">You can send messages and get responses directly</p>
            </div>
          )}
        </div>

        {/* RIGHT — Live Activity Feed */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <h3 className={`text-xs font-bold uppercase tracking-widest ${label} mb-2`}>
            Live Activity Feed
          </h3>
          <div className={`rounded-xl border flex flex-col ${card}`} style={{ minHeight: 660 }}>
            <div className={`px-4 py-3 border-b flex items-center gap-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <Radio className="h-4 w-4 text-indigo-400 animate-pulse" />
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                What agents are doing
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Activity className="h-7 w-7 opacity-20 mb-2" />
                  <p className={`text-sm ${label}`}>No activity yet</p>
                  <p className={`text-xs mt-1 ${label}`}>Messages between agents will appear here</p>
                </div>
              )}

              {[...messages].reverse().map((msg) => {
                const emoji = MESSAGE_EMOJI[msg.type] || '📨';
                const typeLabel = MESSAGE_LABEL[msg.type] || msg.type;
                const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isNew = Date.now() - new Date(msg.timestamp).getTime() < 30000;

                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-3 text-xs border transition-all ${
                      isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-slate-50 border-slate-200'
                    } ${isNew ? 'ring-1 ring-indigo-500/30' : ''}`}
                  >
                    {/* Top row: emoji, type, time */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base leading-none">{emoji}</span>
                        <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{typeLabel}</span>
                        {isNew && <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1 py-0.5 rounded font-bold">NEW</span>}
                      </span>
                      <span className={`${label}`}>{timeStr}</span>
                    </div>

                    {/* From → To */}
                    <div className={`flex items-center gap-1 mb-1.5 font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      <span className="text-indigo-400 font-bold">{msg.senderName}</span>
                      <ArrowRight className="h-3 w-3 opacity-50 shrink-0" />
                      <span className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{msg.receiverName}</span>
                    </div>

                    {/* Message content */}
                    <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`} style={{ fontSize: 11 }}>
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick action hint */}
            <div className={`px-4 py-3 border-t text-xs ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-100 text-slate-400'}`}>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Messages refresh automatically
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ---- CREATE AGENT MODAL ---- */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" />
                <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>Create New Agent</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className={`${label} hover:text-red-400`}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">

              {/* Role and Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${label}`}>What is this agent's role?</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Data Analyst, Security Guard…"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${label}`}>What should it do? (Goal)</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Monitor logs, optimize routes…"
                    value={newGoal}
                    onChange={e => setNewGoal(e.target.value)}
                    className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`}
                  />
                </div>
              </div>

              {/* AI Suggest */}
              <div className={`flex items-center justify-between gap-3 p-3 rounded-xl ${isDark ? 'bg-indigo-950/40 border border-indigo-900/50' : 'bg-indigo-50 border border-indigo-100'}`}>
                <div>
                  <p className="text-xs font-bold text-indigo-400">✨ Auto-fill with AI</p>
                  <p className={`text-[11px] mt-0.5 ${label}`}>Fill in Role + Goal, then click to auto-fill everything else.</p>
                </div>
                <button
                  type="button"
                  disabled={isSuggesting}
                  onClick={handleAiSuggest}
                  className="shrink-0 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {isSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isSuggesting ? 'Thinking…' : 'AI Suggest'}
                </button>
              </div>

              {/* Name */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${label}`}>Agent Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. DataBot, GuardAgent, PlannerAI…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`}
                />
              </div>

              {/* Description */}
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${label}`}>Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Describe what this agent does…"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none resize-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`}
                />
              </div>

              {/* Technical config */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Memory Type', value: newMemory, onChange: setNewMemory, options: ['Short-term', 'Long-term', 'Hybrid', 'Vector DB'] },
                  { label: 'Reasoning', value: newReasoning, onChange: setNewReasoning, options: ['Zero-shot', 'CoT', 'ReAct', 'Reflexion'] },
                  { label: 'Planning', value: newPlanning, onChange: setNewPlanning, options: ['BFS', 'DFS', 'A*', 'Task Trees'] },
                ].map(({ label: lbl, value, onChange, options }) => (
                  <div key={lbl}>
                    <label className={`block text-[10px] font-semibold mb-1.5 ${label}`}>{lbl}</label>
                    <select
                      value={value}
                      onChange={(e: any) => onChange(e.target.value)}
                      className={`w-full text-xs rounded-lg px-2.5 py-2 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-800 border-slate-300'}`}
                    >
                      {options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {/* Tools & Knowledge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${label}`}>Tools (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. WebSearch, Calculator…"
                    value={newTools}
                    onChange={e => setNewTools(e.target.value)}
                    className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${label}`}>Knowledge Base</label>
                  <input
                    type="text"
                    placeholder="e.g. OWASP, finance docs…"
                    value={newKnowledge}
                    onChange={e => setNewKnowledge(e.target.value)}
                    className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 focus:border-indigo-500' : 'bg-white text-slate-800 border-slate-300 focus:border-indigo-400'}`}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t" style={{ borderColor: isDark ? '#1e293b' : '#f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow transition-colors"
                >
                  Create Agent
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
