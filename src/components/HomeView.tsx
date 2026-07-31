import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, ArrowRight, Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import { useAIOS } from '../context/AIOSContext';

// Remote classification via backend NLU service (v2 with confidence)
const classifyEventRemote = async (text: string): Promise<{ category: string; confidence: number }> => {
  const response = await fetch('/api/aios/understand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!response.ok) {
    const err = await response.text();
    console.error('NLU classification failed:', err);
    throw new Error('NLU classification error');
  }
  const data = await response.json();
  return { category: data.category, confidence: data.confidence ?? 0 };
};

export function extractAddress(text: string): string {
  if (!text) return '';
  const lower = text.toLowerCase();
  const markers = [' at ', ' in ', ' near ', ' on ', ' across '];
  let bestIdx = -1;
  let markerLen = 0;
  
  for (const marker of markers) {
    const idx = lower.lastIndexOf(marker);
    if (idx > bestIdx) {
      bestIdx = idx;
      markerLen = marker.length;
    }
  }
  
  if (bestIdx !== -1) {
    const address = text.substring(bestIdx + markerLen).trim();
    if (address) {
      return address.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, '').trim();
    }
  }
  return text.trim();
}

interface HomeViewProps {
  theme: 'dark' | 'light';
  onNavigate: (tab: string) => void;
}

const CATEGORIES = [
  { label: 'Accident',    icon: '🚗', hint: 'Car collided with truck',              configId: 'road_accident_injured' },
  { label: 'Fire',        icon: '🔥', hint: 'Building is burning',                  configId: 'building_fire'         },
  { label: 'Flood',       icon: '🌊', hint: 'River overflowed near the village',    configId: 'flash_flood'           },
  { label: 'Power',       icon: '⚡', hint: 'Transformer exploded at substation',   configId: 'power_failure'         },
  { label: 'Factory',     icon: '🏭', hint: 'Factory boiler exploded',              configId: 'industrial_accident'   },
  { label: 'Medical',     icon: '🏥', hint: 'Medical emergency at city centre',     configId: 'medical_emergency'     },
  { label: 'Cyber',       icon: '💻', hint: 'Bank server was hacked',               configId: 'cyber_attack'          },
  { label: 'Security',    icon: '🛡', hint: 'Intrusion detected at border sector',  configId: 'defense_intrusion'     },
  { label: 'Agriculture', icon: '🌾', hint: 'Crop emergency — irrigation failed',   configId: 'agriculture_emergency' },
  { label: 'Airport',     icon: '✈', hint: 'Aircraft declared emergency',           configId: 'airport_emergency'     },
];

const EXAMPLE_PROMPTS = [
  'Six buses are short circuited',
  'Building is on fire',
  'Flood in my village',
  'Cyber attack detected on server',
  'Power gone in the area',
  'Factory boiler exploded',
];

export default function HomeView({ theme, onNavigate }: HomeViewProps) {
  const isDark = theme === 'dark';
  const { addEvent } = useAIOS();

  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Cycle placeholder examples
  useEffect(() => {
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % EXAMPLE_PROMPTS.length), 3000);
    return () => clearInterval(t);
  }, []);

  const startAIOS = async (text: string, configIdOverride?: string) => {
    const clean = text.trim();
    if (!clean && !configIdOverride) return;

    if (isThinking) return; // Prevent duplicate submissions

    setIsThinking(true);
    setClarificationMessage('');
    setErrorMessage('');

    let category = configIdOverride ?? '';
    let confidence = 1.0;

    if (!category) {
      try {
        const result = await classifyEventRemote(clean);
        category = result.category;
        confidence = result.confidence;
      } catch (err) {
        try {
          const { classifyEventWithConfidence } = await import('../eventEngine');
          const result = classifyEventWithConfidence(clean);
          category = result.category;
          confidence = result.confidence;
        } catch (importErr) {
          category = 'road_accident';
          confidence = 0.8;
        }
      }
    }

    if (category === 'unclassified' || confidence < 0.3) {
      setIsThinking(false);
      setClarificationMessage(
        `Unable to determine the event type for "${clean}". Please describe the problem in more detail — for example: "Power gone in the area" or "Building is on fire".`
      );
      return;
    }

    const cleanAddress = extractAddress(clean);

    try {
      console.log('[HomeView] Submitting event to AIOS:', { category, cleanAddress });
      const result = await addEvent({
        id: `temp-${Date.now()}`,
        type: category,
        location: cleanAddress || 'Central Area',
        severity: 75,
        timestamp: Date.now(),
      });

      if (result && result.success) {
        setIsThinking(false);
        // Single navigation to Event Center
        onNavigate('events');
      } else {
        throw new Error('Mission launch failed to return valid response.');
      }
    } catch (err: any) {
      console.error('[HomeView] Event submission error:', err);
      setIsThinking(false);
      setErrorMessage(`Failed to start mission: ${err.message || 'Server unavailable'}. Please retry.`);
    }
  };

  const handleControlledSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    startAIOS(inputText);
  };

  const handleCategory = (cat: typeof CATEGORIES[0]) => {
    setInputText(cat.hint);
    startAIOS(cat.hint, cat.configId);
  };

  return (
    <div className={`min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-6 py-16 ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>

      {/* ── Brand Badge ── */}
      <div className="flex items-center gap-2 mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          AIOS Online
        </span>
      </div>

      {/* ── Hero ── */}
      <div className="text-center space-y-4 mb-12 max-w-xl">
        <h1 className={`text-5xl md:text-6xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          What is<br />
          <span className="text-indigo-500">happening?</span>
        </h1>
        <p className={`text-lg font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Tell AIOS and it will understand, coordinate, and resolve the situation — automatically.
        </p>
      </div>

      {/* ── Main Input ── */}
      <div className="w-full max-w-xl space-y-4 mb-10">
        <form onSubmit={handleControlledSubmit} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && inputText.trim() && !isThinking) {
                e.preventDefault();
                startAIOS(inputText);
              }
            }}
            placeholder={EXAMPLE_PROMPTS[placeholderIdx]}
            className={`w-full px-6 py-5 pr-44 rounded-2xl text-base outline-none transition-all shadow-xl font-medium ${
              isDark
                ? 'bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:border-indigo-500 focus:shadow-indigo-500/10'
                : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400 shadow-slate-100'
            }`}
          />
          <div className="absolute right-3 top-3 flex items-center gap-2">
            <button
              type="button"
              title="Voice input"
              className={`p-2 rounded-xl transition-all ${
                isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleControlledSubmit()}
              disabled={!inputText.trim() || isThinking}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all ${
                inputText.trim() && !isThinking
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/30 cursor-pointer'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isThinking ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Analyzing...</span>
                </>
              ) : (
                <>
                  <span>Start AIOS</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {isThinking && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-semibold animate-pulse ${
            isDark ? 'bg-indigo-950/40 border-indigo-800/50 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-indigo-400" />
            <span>AIOS is analyzing the incident...</span>
          </div>
        )}

        <p className={`text-center text-xs font-medium ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Describe in plain English — AIOS will understand automatically
        </p>

        {/* ── Clarification Message ── */}
        {clarificationMessage && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium animate-pulse ${
            isDark
              ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}>
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{clarificationMessage}</span>
          </div>
        )}

        {/* ── Error Message ── */}
        {errorMessage && (
          <div className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-sm font-medium ${
            isDark
              ? 'bg-red-950/40 border-red-500/30 text-red-300'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => handleControlledSubmit()}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-all"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Category Buttons ── */}
      <div className="w-full max-w-2xl">
        <p className={`text-center text-xs font-bold uppercase tracking-widest mb-5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Or select a category
        </p>

        <div className="grid grid-cols-5 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              type="button"
              onClick={() => handleCategory(cat)}
              disabled={isThinking}
              className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border transition-all cursor-pointer group ${
                isDark
                  ? 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-indigo-950/30 text-slate-400 hover:text-white'
                  : 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-slate-900 shadow-sm'
              }`}
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-[10.5px] font-bold">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer hint ── */}
      <p className={`mt-12 text-xs font-medium flex items-center gap-1.5 ${isDark ? 'text-slate-700' : 'text-slate-400'}`}>
        <Sparkles className="h-3 w-3" />
        Powered by AIOS Autonomous Intelligence — all coordination happens automatically
      </p>

    </div>
  );
}
