import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Copy, 
  MessageSquare, 
  Settings, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Shield,
  Briefcase,
  Terminal,
  Send,
  Loader2
} from 'lucide-react';
import { Agent, AgentStatus, AgentHealth } from '../types';

interface AgentStudioViewProps {
  agents: Agent[];
  onCreateAgent: (agentData: Partial<Agent>) => Promise<any>;
  onControlAgent: (id: string, action: 'pause' | 'resume' | 'deploy' | 'clone') => Promise<any>;
  onDeleteAgent: (id: string) => Promise<any>;
  onSendMessage: (agentId: string, text: string) => Promise<{ id: string; content: string }>;
  theme: 'dark' | 'light';
  userEmail: string;
  userRole: string;
}

export default function AgentStudioView({ 
  agents, 
  onCreateAgent, 
  onControlAgent, 
  onDeleteAgent, 
  onSendMessage,
  theme,
  userEmail,
  userRole
}: AgentStudioViewProps) {
  const isDark = theme === 'dark';

  // State for creating a new agent
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  // Create agent fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState('');
  const [goal, setGoal] = useState('');
  const [memory, setMemory] = useState<'Short-term' | 'Long-term' | 'Hybrid' | 'Vector DB'>('Short-term');
  const [reasoning, setReasoning] = useState<'Zero-shot' | 'CoT' | 'ReAct' | 'Reflexion'>('Zero-shot');
  const [planning, setPlanning] = useState<'BFS' | 'DFS' | 'A*' | 'Task Trees'>('BFS');
  const [knowledgeStr, setKnowledgeStr] = useState('');
  const [toolsStr, setToolsStr] = useState('');
  const [permissionsStr, setPermissionsStr] = useState('');
  const [minConfidence, setMinConfidence] = useState('0.85');

  // Active chat state
  const [activeChatAgent, setActiveChatAgent] = useState<Agent | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatThread, setChatThread] = useState<Array<{ sender: 'user' | 'agent'; text: string; timestamp: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Trigger AI Suggestion via server Gemini route
  const handleAiSuggest = async () => {
    if (!role || !goal) {
      alert('Please fill in both the Role and Goal fields first so Gemini can customize your configuration.');
      return;
    }

    setIsSuggesting(true);
    try {
      const res = await fetch('/api/agent/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, goal })
      });
      const data = await res.json();
      if (data.suggestion) {
        const sugg = data.suggestion;
        setName(sugg.suggestedName || 'AUTO-NODE');
        setDescription(sugg.suggestedDescription || '');
        setToolsStr((sugg.suggestedTools || []).join(', '));
        setKnowledgeStr((sugg.suggestedKnowledge || []).join(', '));
        if (sugg.reasoningModel) setReasoning(sugg.reasoningModel);
        if (sugg.planningMethod) setPlanning(sugg.planningMethod);
      }
    } catch (err) {
      console.error('Gemini suggest error:', err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleCreateSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const newAgentData: Partial<Agent> = {
      name: name || 'NEW-AGENT',
      description,
      role: role || 'Operator Node',
      goal: goal || 'Perform microservice loops.',
      memory,
      reasoning,
      planning,
      knowledge: knowledgeStr.split(',').map(s => s.trim()).filter(Boolean),
      tools: toolsStr.split(',').map(s => s.trim()).filter(Boolean),
      permissions: permissionsStr.split(',').map(s => s.trim()).filter(Boolean),
      configuration: { minConfidenceScore: minConfidence }
    };

    await onCreateAgent(newAgentData);
    
    // Reset forms
    setName('');
    setDescription('');
    setRole('');
    setGoal('');
    setMemory('Short-term');
    setReasoning('Zero-shot');
    setPlanning('BFS');
    setKnowledgeStr('');
    setToolsStr('');
    setPermissionsStr('');
    setMinConfidence('0.85');
    setShowCreateModal(false);
  };

  const handleSelectChat = (agent: Agent) => {
    setActiveChatAgent(agent);
    // Seed some custom diagnostic logs when opening chat
    setChatThread([
      {
        sender: 'agent',
        text: `Secure channel established with ${agent.name} (${agent.role}). Operational state: ${agent.status}. Direct query buffer initialized.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleSendChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessage.trim() || !activeChatAgent) return;

    const userText = chatMessage;
    setChatMessage('');
    setChatThread(prev => [...prev, { sender: 'user', text: userText, timestamp: new Date().toLocaleTimeString() }]);
    setIsTyping(true);

    try {
      const response = await onSendMessage(activeChatAgent.id, userText);
      setChatThread(prev => [...prev, { sender: 'agent', text: response.content, timestamp: new Date().toLocaleTimeString() }]);
    } catch (err) {
      console.error('Agent chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cognitive Agent Studio</h2>
          <p className="text-xs text-slate-400">Instantiate, test, and clone custom goal-oriented autonomous micro-agents with multi-reasoning models.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 bg-cyan-500 text-slate-950 px-4 py-2 rounded text-xs font-bold hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/10"
        >
          <Plus className="h-4 w-4" />
          <span>Instantiate New Agent</span>
        </button>
      </div>

      {/* Main Split Screen: Agents list vs Chat Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Agents List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Active Nodes ({agents.length})</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div 
                key={agent.id}
                className={`p-4 rounded-lg border transition-all flex flex-col justify-between ${
                  activeChatAgent?.id === agent.id 
                    ? 'border-cyan-500/50 ring-1 ring-cyan-500/30' 
                    : isDark ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>{agent.name}</h4>
                      <span className="text-[10px] text-cyan-400 font-mono">{agent.role}</span>
                    </div>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                      agent.status === 'Running' 
                        ? 'bg-emerald-950 text-emerald-400' 
                        : agent.status === 'Paused' 
                        ? 'bg-amber-950 text-amber-400' 
                        : agent.status === 'Failed'
                        ? 'bg-red-950 text-red-400'
                        : 'bg-slate-950 text-slate-400'
                    }`}>
                      {agent.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {agent.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-500 mb-4 border-t border-slate-850 pt-2">
                    <div>
                      <span className="block text-slate-600 uppercase font-semibold">REASONING:</span>
                      <span className="text-slate-400">{agent.reasoning}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 uppercase font-semibold">PLANNING:</span>
                      <span className="text-slate-400">{agent.planning}</span>
                    </div>
                  </div>
                </div>

                {/* Control plane buttons */}
                <div className="flex items-center justify-between border-t border-slate-850 pt-2.5">
                  <div className="flex space-x-1">
                    {agent.status === 'Running' ? (
                      <button 
                        onClick={() => onControlAgent(agent.id, 'pause')}
                        className={`p-1 rounded ${isDark ? 'hover:bg-slate-950 text-amber-500' : 'hover:bg-slate-50 text-amber-600'}`}
                        title="Pause Agent Execution"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => onControlAgent(agent.id, 'resume')}
                        className={`p-1 rounded ${isDark ? 'hover:bg-slate-950 text-emerald-400' : 'hover:bg-slate-50 text-emerald-600'}`}
                        title="Resume Agent Execution"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={() => onControlAgent(agent.id, 'clone')}
                      className={`p-1 rounded ${isDark ? 'hover:bg-slate-950 text-slate-400 hover:text-white' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'}`}
                      title="Clone/Duplicate Configuration"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteAgent(agent.id)}
                      className="p-1 rounded hover:bg-red-950/20 text-red-500"
                      title="Terminate and Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button 
                    onClick={() => handleSelectChat(agent)}
                    className="flex items-center space-x-1 text-[10px] text-cyan-400 font-bold hover:underline"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span>Interact Terminal</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Interactive Agent Console */}
        <div className="lg:col-span-5 flex flex-col h-[500px]">
          <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Cognitive Sandbox Terminal</h3>

          {activeChatAgent ? (
            <div className={`flex-1 rounded-lg border ${isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-900 border-slate-800'} flex flex-col overflow-hidden shadow-xl`}>
              
              {/* Terminal header */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between font-mono text-[10px]">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span className="text-white font-bold uppercase tracking-wider">{activeChatAgent.name} SECURE GATEWAY</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-500 font-bold">STATE: ONLINE</span>
                </div>
              </div>

              {/* Chat messages stream */}
              <div className="flex-1 p-4 space-y-3.5 overflow-y-auto font-mono text-xs text-slate-300">
                {chatThread.map((msg, i) => (
                  <div key={i} className={`p-2.5 rounded ${msg.sender === 'user' ? 'bg-slate-900 border border-slate-800 text-slate-300' : 'bg-slate-950 border-l-2 border-cyan-500 text-cyan-300/95'}`}>
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold mb-1 uppercase">
                      <span>{msg.sender === 'user' ? 'Local Operator' : activeChatAgent.name}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  </div>
                ))}

                {isTyping && (
                  <div className="bg-slate-950 p-2.5 rounded border-l-2 border-slate-600 text-slate-400 animate-pulse flex items-center space-x-2">
                    <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                    <span>Analyzing constraints, constructing plan...</span>
                  </div>
                )}
              </div>

              {/* Input console */}
              <form onSubmit={handleSendChatSubmit} className="p-3 bg-slate-950 border-t border-slate-850 flex items-center gap-2">
                <input 
                  type="text"
                  required
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={`Send direct state queries or directives to ${activeChatAgent.name}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 text-xs text-white p-2.5 rounded font-mono outline-none"
                />
                <button 
                  type="button"
                  onClick={() => handleSendChatSubmit()} 
                  className="p-2.5 rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>
          ) : (
            <div className={`flex-1 rounded-lg border ${isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-200'} border-dashed flex flex-col items-center justify-center p-8 text-center`}>
              <Brain className="h-10 w-10 text-slate-500 mb-3 animate-pulse" />
              <h4 className="font-bold text-sm text-slate-300 mb-1">Terminal Disconnected</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Select any instantiated agent card from the roster to establish a direct instruction proxy tunnel and prompt it.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW AGENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Plus className="h-4 w-4 text-cyan-400" />
                <span>Instantiate Cognitive Core</span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              
              {/* Grid Role & Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Role/Identity</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Quantitative Analyst, DevOps Engineer, SecOps Patrol..."
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Functional Goal</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Optimize corridor paths, monitor zero-day logs..."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* AI GENERATE BOOTSTRAP BUTTON */}
              <div className="bg-slate-950/80 p-3.5 rounded border border-cyan-950/40 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-cyan-400 font-mono block">GEMINI CORE SUGGESTION</span>
                  <p className="text-[10px] text-slate-500">Provide Role + Goal, click suggest to automatically synthesize name, tools and specs with Gemini API.</p>
                </div>
                <button
                  type="button"
                  disabled={isSuggesting}
                  onClick={handleAiSuggest}
                  className="bg-cyan-950 border border-cyan-800 text-cyan-400 px-3 py-1.5 rounded text-xs hover:bg-cyan-900 transition-colors shrink-0 flex items-center space-x-1.5"
                >
                  {isSuggesting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI Suggest</span>
                    </>
                  )}
                </button>
              </div>

              {/* Form entries */}
              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">System Codename</label>
                  <input 
                    type="text" 
                    required
                    placeholder="HELIOS-4, ARES-1, CRONOS-9..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Functional Description</label>
                  <textarea 
                    rows={2}
                    placeholder="Enter short technical description outlining system constraints and boundaries..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white resize-none"
                  />
                </div>

                {/* Grid model parameters */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1">MEMORY POOL</label>
                    <select 
                      value={memory} 
                      onChange={(e: any) => setMemory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2 text-[10px] text-slate-300 outline-none"
                    >
                      <option value="Short-term">Short-term</option>
                      <option value="Long-term">Long-term</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Vector DB">Vector DB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1">REASONING</label>
                    <select 
                      value={reasoning} 
                      onChange={(e: any) => setReasoning(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2 text-[10px] text-slate-300 outline-none"
                    >
                      <option value="Zero-shot">Zero-shot</option>
                      <option value="CoT">Chain of Thought</option>
                      <option value="ReAct">ReAct loop</option>
                      <option value="Reflexion">Reflexion loop</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-bold mb-1">PLANNING</label>
                    <select 
                      value={planning} 
                      onChange={(e: any) => setPlanning(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2 text-[10px] text-slate-300 outline-none"
                    >
                      <option value="BFS">BFS Tree</option>
                      <option value="DFS">DFS Tree</option>
                      <option value="A*">A* Optim</option>
                      <option value="Task Trees">Task Trees</option>
                    </select>
                  </div>
                </div>

                {/* String comma lists */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Exec Tools (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="IpBlocker, RouteCalculator, SecScraper, PortScan..."
                      value={toolsStr}
                      onChange={(e) => setToolsStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Knowledge References (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="OWASP Top 10, SEC Regulations, ROS2 kinematics..."
                      value={knowledgeStr}
                      onChange={(e) => setKnowledgeStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit trigger */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-4 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-850 hover:bg-slate-950 text-slate-400 rounded text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleCreateSubmit()}
                  className="px-5 py-2 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 shadow-lg shadow-cyan-500/15"
                >
                  Deploy Node to Sandbox
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
