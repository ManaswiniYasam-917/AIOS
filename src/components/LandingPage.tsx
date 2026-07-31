import React, { useState } from 'react';
import { 
  Shield, 
  Cpu, 
  Server, 
  Layers, 
  ArrowRight, 
  Zap, 
  Terminal, 
  Users, 
  Globe, 
  Radio, 
  GitBranch, 
  Key, 
  Workflow, 
  Database,
  Briefcase,
  CheckCircle2,
  Mail,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onEnterConsole: () => void;
  onOpenLogin: () => void;
}

export default function LandingPage({ onEnterConsole, onOpenLogin }: LandingPageProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [agentsCount, setAgentsCount] = useState<number>(10);
  const [devicesCount, setDevicesCount] = useState<number>(50);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Estimate pricing formula
  const basePrice = 499;
  const agentSurcharge = Math.max(0, (agentsCount - 5) * 45);
  const deviceSurcharge = Math.max(0, (devicesCount - 10) * 15);
  const totalPrice = basePrice + agentSurcharge + deviceSurcharge;

  const steps = [
    {
      title: '1. Frontend Gateway',
      desc: 'Next.js and React enterprise console rendering real-time telemetry, mapping coordinates, and custom security views.',
      badge: 'Secure SPA'
    },
    {
      title: '2. API Gateway & Auth',
      desc: 'TLS 1.3 endpoints verifying JWT payloads, RBAC scopes, and routing state commands securely via Rate-Limited paths.',
      badge: 'Zero-Trust Proxy'
    },
    {
      title: '3. Business Logic Hub',
      desc: 'Domain-Driven Services managing orchestration workflows, persistent task state, audit logging, and billing nodes.',
      badge: 'Microservice-Ready'
    },
    {
      title: '4. Agent Runtime (Gemini)',
      desc: 'Advanced LLM execution loops configured with tool definitions, context window memory buffers, and active safety filters.',
      badge: 'Self-Correcting'
    },
    {
      title: '5. Secure Edge Protocol',
      desc: 'Low-bandwidth MQTT/gRPC conduits syncing state matrices with Jetson, Raspberry Pi, and hardware robotic fleets.',
      badge: 'Encrypted Sync'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-900 font-sans">
      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Cpu className="h-5 w-5 text-slate-950 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-cyan-400">
                AIOS
              </span>
              <span className="text-[9px] block text-cyan-400 font-mono tracking-widest uppercase">
                Enterprise OS v1.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">Architecture</a>
            <a href="#technology" className="hover:text-cyan-400 transition-colors">Stack</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-cyan-400 transition-colors">Enterprise Portal</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button 
              onClick={onOpenLogin}
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Log In
            </button>
            <button 
              onClick={onEnterConsole}
              className="relative group overflow-hidden rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 hover:brightness-110 transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            >
              <span className="relative z-10 flex items-center space-x-1">
                <span>Enter OS Console</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.07),transparent_70%)]" />
        <div className="absolute right-0 top-1/4 h-[350px] w-[350px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute left-10 bottom-10 h-[250px] w-[250px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-slate-900/80 border border-cyan-500/20 px-3 py-1 rounded-full text-xs text-cyan-400 mb-6 font-mono">
            <Shield className="h-3 w-3 animate-pulse" />
            <span>SECURE INDUSTRIAL-GRADE COGNITIVE SYSTEM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            Autonomous Intelligence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">
              Operating System
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 mb-10 leading-relaxed">
            AIOS is the secure control plane for deploying, monitoring, orchestrating, and scaling autonomous AI agents and edge fleets across global digital twins and real-time operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={onEnterConsole}
              className="w-full sm:w-auto rounded-md bg-cyan-500 px-8 py-3.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
            >
              <span>Initialize AIOS Cluster</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a 
              href="#architecture"
              className="w-full sm:w-auto rounded-md bg-slate-900 border border-slate-800 px-8 py-3.5 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-850 transition-all flex items-center justify-center space-x-2"
            >
              <span>Explore Architecture Blueprint</span>
            </a>
          </div>

          {/* Interactive Floating CLI Widget */}
          <div className="mt-16 max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-left font-mono text-xs text-slate-300">
            <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500/40" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
                <div className="h-3 w-3 rounded-full bg-cyan-500/40" />
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AIOS SECURE CLI</span>
              <div className="text-[10px] text-cyan-400/80 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                ACTIVE STATE: SYNCED
              </div>
            </div>
            <div className="p-5 space-y-3.5 h-64 overflow-y-auto">
              <div>
                <span className="text-cyan-500">$</span> <span className="text-white">aios cluster bootstrap --region us-west-1</span>
                <p className="text-slate-500 mt-1">✔ Target verified: Cloud Run Server Sandbox (ID: 17a1ed91-fd39-4bfb-9873-8a78306843a7)</p>
                <p className="text-slate-500">✔ Enterprise role validation successfully fetched: SUPER_ADMIN</p>
                <p className="text-slate-500">✔ Loading secure system modules: [AgentStudio, EdgeRegistry, LiveCoordinates, CryptSync]</p>
              </div>
              <div>
                <span className="text-cyan-500">$</span> <span className="text-white">aios agent deploy --id ARES-1 --fleet sf-edge-nodes</span>
                <p className="text-emerald-400 mt-1">SUCCESS: Agent ARES-1 (Cybersecurity Sentinel) initiated on SF Jetson Cluster</p>
                <p className="text-slate-400">Telemetry Status: HEALTHY | CPU: 42% | Core Temperature: 41°C | Latency: 1.4ms</p>
              </div>
              <div className="animate-pulse">
                <span className="text-cyan-500">$</span> <span className="text-slate-500">Listening to global communications mesh...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Engineered for Mission-Critical Autonomy
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm">
            AIOS provides high-assurance coordination software where standard web applications and simple chat playgrounds fall short.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-xl hover:border-cyan-500/30 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-105 transition-transform">
              <Workflow className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-3 text-white">Agent Studio Control</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Design and clone cognitive agents equipped with detailed tool definitions, custom permissions, memory architectures, and reasoning models.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-xl hover:border-cyan-500/30 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-105 transition-transform">
              <Radio className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-3 text-white">Edge Fleet Manager</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Consolidate telemetry and monitor battery, heat, storage, and CPU parameters on Jetson clusters, robotic nodes, drones, and IoT sensors.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-xl hover:border-cyan-500/30 transition-all group">
            <div className="h-12 w-12 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-105 transition-transform">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg mb-3 text-white">Cryptographic Guardrails</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enforce Strict Role-Based Access Control (RBAC), auto-generate proxy API keys, maintain an untamperable diagnostic log, and isolate failed nodes.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-24 bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">REUSABLE BLUEPRINT</span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Enterprise Clean Architecture
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our secure platform separates concerns in five independent layers. Click through the architectural nodes to visualize real-time request paths from client browsers down to remote edge hardware conduits.
              </p>

              <div className="space-y-3">
                {steps.map((step, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                      activeStep === i 
                        ? 'bg-slate-900 border-cyan-500/30 shadow-md shadow-cyan-950/10' 
                        : 'border-slate-800 hover:bg-slate-900/30 border-transparent'
                    }`}
                  >
                    <span className="font-semibold text-xs sm:text-sm">{step.title}</span>
                    <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-950">
                      {step.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800 p-8 rounded-xl h-[400px] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-slate-600">
                AIOS_BLUEPRINT_RENDERER_ACTIVE
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                  <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-cyan-400">FLOW SIMULATION: STATE ACTIVE</span>
                </div>

                <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-lg min-h-48 flex flex-col justify-center">
                  <span className="text-[10px] font-mono text-cyan-400 mb-2 uppercase block tracking-wider">
                    {steps[activeStep].badge} LAYER
                  </span>
                  <h4 className="text-lg font-bold text-white mb-2">{steps[activeStep].title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{steps[activeStep].desc}</p>
                </div>
              </div>

              {/* Graphical Wireframe mapping */}
              <div className="grid grid-cols-5 gap-2 pt-6 border-t border-slate-800 text-center font-mono text-[9px] text-slate-500">
                {steps.map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className={`h-1 rounded-full transition-all duration-300 ${i <= activeStep ? 'bg-cyan-500' : 'bg-slate-800'}`} />
                    <span className={i === activeStep ? 'text-cyan-400 font-bold' : ''}>L-{i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="technology" className="py-20 bg-slate-900/30 border-b border-slate-900 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold mb-3">Enterprise Stack</h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-10">Microservice-Ready Ecosystem</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-lg">
              <Server className="h-5 w-5 text-indigo-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-200 block mb-1">FastAPI Backend</span>
              <span className="text-[10px] text-slate-500 font-mono">Python Async REST</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-lg">
              <Database className="h-5 w-5 text-sky-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-200 block mb-1">PostgreSQL</span>
              <span className="text-[10px] text-slate-500 font-mono">Relational Storage</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-lg">
              <Cpu className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-200 block mb-1">Gemini Pro API</span>
              <span className="text-[10px] text-slate-500 font-mono">Cognitive Brain</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-lg">
              <Zap className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-200 block mb-1">Redis Queue</span>
              <span className="text-[10px] text-slate-500 font-mono">Low Latency Caching</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-lg">
              <Layers className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-200 block mb-1">Qdrant DB</span>
              <span className="text-[10px] text-slate-500 font-mono">Vector Embeddings</span>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-lg">
              <Globe className="h-5 w-5 text-cyan-500 mx-auto mb-2" />
              <span className="text-xs font-bold text-slate-200 block mb-1">Vite + React</span>
              <span className="text-[10px] text-slate-500 font-mono">TypeScript SPA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Slider Placeholder */}
      <section id="pricing" className="py-24 bg-slate-950 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">TRANSPARENT VALUE</span>
          <h2 className="text-3xl font-bold text-white mt-2 mb-4">Scalable Enterprise Estimates</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-12">
            Adjust the slider below to model the license and infrastructure footprint for autonomous agents and connected edge nodes.
          </p>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-xl max-w-2xl mx-auto text-left space-y-8">
            {/* Slider 1 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-300">
                <span>Active Autonomous Agents</span>
                <span className="text-cyan-400 font-mono">{agentsCount} Agents</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={agentsCount} 
                onChange={(e) => setAgentsCount(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 Agent</span>
                <span>100 Agents</span>
              </div>
            </div>

            {/* Slider 2 */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-300">
                <span>Registered Edge Devices</span>
                <span className="text-cyan-400 font-mono">{devicesCount} Nodes</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1000" 
                value={devicesCount} 
                onChange={(e) => setDevicesCount(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 Devices</span>
                <span>1,000 Devices</span>
              </div>
            </div>

            {/* Price Output */}
            <div className="bg-slate-950 border border-slate-850 p-6 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ESTIMATED EXPENDITURE</span>
                <p className="text-xs text-slate-400 mt-0.5">Includes JWT auth, zero-day logging, API conduits.</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-white font-mono">${totalPrice.toLocaleString()}</span>
                <span className="text-xs text-slate-500 block">/ Month</span>
              </div>
            </div>
            
            <div className="text-center">
              <button 
                onClick={onEnterConsole}
                className="w-full sm:w-auto px-6 py-2.5 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition-colors"
              >
                Deploy Estimate Infrastructure
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Sandbox Section */}
      <section className="py-20 bg-slate-900/30 border-b border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="border-b border-slate-800 px-6 py-4 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider">REST API Gateway Definition</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">OPENAPI v3.0.0</span>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect external CI/CD pipelines, dispatch rules, or custom dashboard monitors directly to the AIOS core gateway with our secure, REST endpoints.
              </p>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded">GET</span>
                  <span className="text-slate-300">/api/metrics</span>
                  <span className="text-slate-500 ml-auto text-[10px] hidden sm:inline">Returns active node cpu, heat, metrics matrix</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded">POST</span>
                  <span className="text-slate-300">/api/agents</span>
                  <span className="text-slate-500 ml-auto text-[10px] hidden sm:inline">Create a structured cognitive micro-agent</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded">POST</span>
                  <span className="text-slate-300">/api/agents/:id/control</span>
                  <span className="text-slate-500 ml-auto text-[10px] hidden sm:inline">Dispatch commands: pause, resume, deploy, clone</span>
                </div>
                <div className="flex items-center space-x-2 bg-slate-950 p-2.5 rounded border border-slate-850">
                  <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-950/50 px-1.5 py-0.5 rounded">POST</span>
                  <span className="text-slate-300">/api/devices/:id/diagnostic</span>
                  <span className="text-slate-500 ml-auto text-[10px] hidden sm:inline">Force remote node ping & state sync diagnostic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section & Future Roadmap Plugins */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-900 text-center">
        <h2 className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold mb-3">PLUG-AND-PLAY ENHANCEMENTS</h2>
        <h3 className="text-3xl font-bold text-white mb-4">Future Technologies Architecture</h3>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mb-16">
          AIOS is future-proof. These plug-and-play interfaces can be loaded dynamically without modifying the underlying core operating core.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
          <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-lg">
            <span className="text-[9px] font-mono text-cyan-400 uppercase block mb-1 tracking-widest">PLUG-IN v2.0</span>
            <span className="text-xs font-bold text-slate-100 block mb-1">Quantum Intelligence</span>
            <span className="text-[10px] text-slate-500">Heuristic quantum circuit annealing configurations</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-lg">
            <span className="text-[9px] font-mono text-cyan-400 uppercase block mb-1 tracking-widest">PLUG-IN v2.0</span>
            <span className="text-xs font-bold text-slate-100 block mb-1">Digital Twins</span>
            <span className="text-[10px] text-slate-500">3D spatial asset sync for physical grid layouts</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-lg">
            <span className="text-[9px] font-mono text-cyan-400 uppercase block mb-1 tracking-widest">PLUG-IN v2.0</span>
            <span className="text-xs font-bold text-slate-100 block mb-1">Swarm Networks</span>
            <span className="text-[10px] text-slate-500">Decentralized consensus matrices for robot swarms</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-lg">
            <span className="text-[9px] font-mono text-cyan-400 uppercase block mb-1 tracking-widest">PLUG-IN v2.0</span>
            <span className="text-xs font-bold text-slate-100 block mb-1">Federated Learning</span>
            <span className="text-[10px] text-slate-500">Distributed neural parameter updates across edge nodes</span>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 max-w-xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-cyan-400/20">
            AIOS_SECURE_TUNNEL
          </div>

          <h3 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
            <Mail className="h-5 w-5 text-cyan-400" />
            <span>Request Enterprise Access</span>
          </h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Submit your parameters to receive custom SLA pricing, secure credentials provisioning, or schedule a technical briefing with our cloud architects.
          </p>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Identity Name</label>
              <input 
                type="text" 
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Dr. Eleanor Vance" 
                className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Secure Contact Email</label>
              <input 
                type="email" 
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.vance@defense-grid.ai" 
                className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Message Payload</label>
              <textarea 
                rows={4}
                required
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Brief description of your autonomous agent swarm or edge coordination requirements..." 
                className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500 rounded p-2.5 text-xs text-white resize-none"
              />
            </div>

            <button 
              type="button" 
              onClick={handleContactSubmit}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-bold text-xs p-3 rounded transition-all flex items-center justify-center space-x-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <span>Transmit Access Request</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {contactSuccess && (
              <div className="bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 p-3 rounded text-xs flex items-center space-x-2 mt-4">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Message securely transmitted to AIOS core dispatch. An architect will contact you.</span>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Elegant Professional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-slate-500 text-xs gap-6">
          <div className="flex items-center space-x-3">
            <Cpu className="h-5 w-5 text-cyan-400/40" />
            <div>
              <span className="font-semibold text-slate-300">AIOS Autonomous Control Inc.</span>
              <p className="text-[10px] text-slate-600">Enterprise AI Security Systems Corporation</p>
            </div>
          </div>
          <div className="flex space-x-6">
            <span>TLS 1.3 Certified</span>
            <span>•</span>
            <span>Zero Trust Ready</span>
            <span>•</span>
            <span>FIPS 140-3 Compliant</span>
          </div>
          <div>
            <span>© 2026 AIOS Operations. All privileges reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
