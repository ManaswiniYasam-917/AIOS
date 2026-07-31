import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Check, 
  Star, 
  AlertCircle, 
  Grid, 
  Filter, 
  Tag, 
  Terminal, 
  Heart,
  Loader2
} from 'lucide-react';
import { MarketplaceAgent } from '../types';

interface MarketplaceViewProps {
  marketplaceAgents: MarketplaceAgent[];
  onInstallAgent: (id: string) => Promise<any>;
  theme: 'dark' | 'light';
}

export default function MarketplaceView({ marketplaceAgents, onInstallAgent, theme }: MarketplaceViewProps) {
  const isDark = theme === 'dark';

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const categories = ['All', 'Assistant', 'Data Science', 'Robotics', 'DevOps', 'Vision', 'NLP'];

  // Filtering
  const filteredPackages = marketplaceAgents.filter(m => {
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleInstallToggle = async (id: string) => {
    setInstallingId(id);
    try {
      await onInstallAgent(id);
    } catch (err) {
      console.error('Install toggle error:', err);
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and overview info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>🧩 Marketplace</h2>
          <p className="text-xs text-slate-400">Browse and install pre-built AI agents for common tasks — just click Install to add one to your system.</p>
        </div>
      </div>

      {/* Categories slider & search bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Categories toggles */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition-all ${
                activeCategory === cat 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                  : isDark 
                  ? 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-400' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search sandbox modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded p-2 pl-9 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Marketplace packages grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div 
            key={pkg.id}
            className={`p-5 rounded-lg border transition-all ${
              isDark ? 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
            } flex flex-col justify-between space-y-4`}
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-850">
                    {pkg.category}
                  </span>
                  <h4 className={`font-bold text-sm mt-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>{pkg.name}</h4>
                </div>
                <span className="text-[10px] text-slate-500 font-mono font-semibold">{pkg.version}</span>
              </div>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {pkg.description}
              </p>

              {/* Developer stats & ratings */}
              <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500 mt-4 border-t border-slate-850 pt-3">
                <span className="flex items-center gap-0.5 text-amber-500">
                  <Star className="h-3 w-3 fill-amber-500" />
                  <span>{pkg.rating}</span>
                </span>
                <span>{pkg.installs.toLocaleString()} Installs</span>
                <span className="ml-auto text-slate-400 font-mono text-[9px]">Dev: {pkg.developer}</span>
              </div>
            </div>

            {/* Install Toggle Actions */}
            <div className="pt-3 border-t border-slate-850">
              {pkg.isInstalled ? (
                <button
                  disabled={installingId === pkg.id}
                  onClick={() => handleInstallToggle(pkg.id)}
                  className="w-full bg-slate-950 border border-emerald-800/40 hover:bg-slate-900 text-emerald-400 p-2 rounded text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
                >
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Mounted & Installed</span>
                </button>
              ) : (
                <button
                  disabled={installingId === pkg.id}
                  onClick={() => handleInstallToggle(pkg.id)}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-2 rounded text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-md shadow-cyan-950/10"
                >
                  {installingId === pkg.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Instantiating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Install Sandbox block</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredPackages.length === 0 && (
          <div className="col-span-full py-16 text-center border border-slate-800 border-dashed rounded-lg bg-slate-900/10">
            <ShoppingBag className="h-8 w-8 text-slate-500 mx-auto mb-3 animate-pulse" />
            <h5 className="font-bold text-slate-300 text-sm mb-1">No marketplace packages found</h5>
            <p className="text-xs text-slate-500">No package matches your search terms. Clear query or category tags.</p>
          </div>
        )}
      </div>

    </div>
  );
}
