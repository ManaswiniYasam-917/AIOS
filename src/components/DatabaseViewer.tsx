import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, ShieldAlert, Cpu, HardDrive, Terminal, MessageSquare, Bell, AlertCircle, FileSpreadsheet, ListFilter, Eye, EyeOff, Trash2 } from 'lucide-react';
import { fetchWithAuth } from '../context/AIOSContext';

interface DatabaseViewerProps {
  theme: 'dark' | 'light';
}

export default function DatabaseViewer({ theme }: DatabaseViewerProps) {
  const isDark = theme === 'dark';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDb, setActiveDb] = useState<'postgresql' | 'sqlite'>('postgresql');
  const [expandedTable, setExpandedTable] = useState<string | null>('events');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchDatabaseData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth('/api/db-view');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
        // Fallback to SQLite if PostgreSQL is disconnected or errored
        if (payload.postgresql?.error && payload.sqlite && !payload.sqlite.error) {
          setActiveDb('sqlite');
          setExpandedTable('agents');
        }
      } else {
        const errText = await res.text();
        setError(`Failed to fetch database content: ${errText || res.statusText}`);
      }
    } catch (err: any) {
      console.error('Error fetching db view:', err);
      setError(err.message || 'An error occurred while connecting to the database API.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear all stored database incidents and logs?')) {
      return;
    }
    setClearing(true);
    try {
      const res = await fetchWithAuth('/api/db-clear', { method: 'POST' });
      if (res.ok) {
        await fetchDatabaseData();
      }
    } catch (err) {
      console.error('Error clearing database:', err);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader />
        <p className="text-xs text-slate-400">Connecting to secure AIOS database engine...</p>
      </div>
    );
  }

  const dbSource = data ? data[activeDb] : null;
  const isPostgres = activeDb === 'postgresql';

  const getTables = () => {
    if (!dbSource) return [];
    return Object.keys(dbSource).filter(k => k !== 'error');
  };

  const tables = getTables();

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'events': return <AlertCircle className="h-4.5 w-4.5 text-rose-500" />;
      case 'missions': return <Database className="h-4.5 w-4.5 text-indigo-500" />;
      case 'agents': return <Cpu className="h-4.5 w-4.5 text-emerald-500" />;
      case 'messages': return <MessageSquare className="h-4.5 w-4.5 text-sky-500" />;
      case 'devices': return <HardDrive className="h-4.5 w-4.5 text-amber-500" />;
      case 'audit_logs': return <Terminal className="h-4.5 w-4.5 text-pink-500" />;
      case 'notifications': return <Bell className="h-4.5 w-4.5 text-purple-500" />;
      default: return <Database className="h-4.5 w-4.5 text-slate-500" />;
    }
  };

  const getTableLabel = (tableName: string) => {
    if (tableName === 'events') return 'Stored Incidents / Problems';
    if (tableName === 'missions') return 'Safety Missions';
    if (tableName === 'agents') return 'Emergency Response Agents';
    if (tableName === 'audit_logs') return 'Operations Log';
    return tableName
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Convert technical database keys into user-friendly names
  const cleanHeaderLabel = (key: string) => {
    const maps: Record<string, string> = {
      event_id: 'ID',
      event_title: 'Incident Title',
      event_description: 'Problem Description',
      detected_category: 'Category',
      severity: 'Severity',
      status: 'Status',
      address: 'Reported Location',
      created_at: 'Logged Time',
      mission_id: 'Mission ID',
      mission_name: 'Mission Name',
      mission_status: 'State',
      completion_percentage: 'Progress %',
      ai_summary: 'AI Resolution Summary',
      agent_id: 'Agent ID',
      agent_name: 'Agent Nickname',
      agent_type: 'Agent Core Role',
      is_enabled: 'Status Active',
      description: 'Role Focus',
      sender_agent: 'Sender UUID',
      receiver_agent: 'Receiver UUID',
      message: 'Agent Message Content',
      sent_at: 'Time Sent',
      timestamp: 'Logged Time',
      user: 'Triggered By',
      action: 'Action Done',
      details: 'Audit Details',
    };
    return maps[key] || key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getFilteredRecords = (tableName: string) => {
    const list = dbSource ? dbSource[tableName] : [];
    if (!Array.isArray(list)) return [];
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter((item: any) => {
      return Object.values(item).some(val => 
        String(val).toLowerCase().includes(query)
      );
    });
  };

  // Stats for the visual overview panel
  const totalEvents = data?.postgresql?.events?.length || data?.sqlite?.events?.length || 0;
  const totalMissions = data?.postgresql?.missions?.length || data?.sqlite?.missions?.length || 0;
  const totalAgents = data?.postgresql?.agents?.length || data?.sqlite?.agents?.length || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-slate-100 font-sans">
      
      {/* Visual DB Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-rose-500 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Reported Problems</span>
            <h2 className="text-2xl font-black mt-0.5">{totalEvents} Stored</h2>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dispatch Safety Missions</span>
            <h2 className="text-2xl font-black mt-0.5">{totalMissions} Stored</h2>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Cpu className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Security Agents</span>
            <h2 className="text-2xl font-black mt-0.5">{totalAgents} Stored</h2>
          </div>
        </div>
      </div>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-white">
            <Database className="h-6 w-6 text-indigo-500" />
            AIOS Database Inspector
          </h1>
          <p className="text-xs mt-1 text-slate-400">
            Secure, separate URL repository reading directly from AIOS transactional tables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-0.5 rounded-xl flex gap-1 bg-slate-950">
            <button
              onClick={() => { setActiveDb('postgresql'); setExpandedTable('events'); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                isPostgres
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'opacity-55 hover:opacity-100'
              }`}
            >
              <span>🐘 PostgreSQL</span>
            </button>
            <button
              onClick={() => { setActiveDb('sqlite'); setExpandedTable('agents'); }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                !isPostgres
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'opacity-55 hover:opacity-100'
              }`}
            >
              <span>🗄 SQLite</span>
            </button>
          </div>

          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="px-3 py-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-[11.5px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-slate-300"
            title="Toggle displaying technical database UUIDs and raw settings"
          >
            {showTechnicalDetails ? <EyeOff className="h-4 w-4 text-purple-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
            <span>{showTechnicalDetails ? 'Simple View' : 'Show Technical UUIDs'}</span>
          </button>

          <button
            onClick={fetchDatabaseData}
            title="Refresh database records"
            className="p-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            onClick={handleClearDatabase}
            disabled={clearing}
            title="Clear database records"
            className="px-3 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-[11.5px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 text-rose-500" />
            <span>{clearing ? 'Clearing...' : 'Clear DB'}</span>
          </button>
        </div>
      </div>

      {/* Error Panel */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0 text-rose-400" />
          <div>
            <h4 className="font-extrabold text-white">Database Server Connection Error</h4>
            <p className="mt-1 leading-normal opacity-90">{error}</p>
            <p className="mt-2 text-[10px] text-rose-450 font-mono">
              Note: Make sure your FastAPI python database server is running on port 8000.
            </p>
          </div>
        </div>
      )}

      {dbSource && dbSource.error && (
        <div className="p-5 rounded-2xl border border-slate-850 bg-slate-900/40 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2 opacity-75" />
          <h3 className="font-extrabold text-sm text-white">Prisma DB Server is offline</h3>
          <p className="text-xs max-w-md mx-auto mt-1 leading-relaxed text-slate-400">
            {dbSource.error}
          </p>
          <button
            onClick={() => { setActiveDb('sqlite'); setExpandedTable('agents'); }}
            className="mt-3 px-3 py-1.5 bg-slate-850 border border-slate-750 hover:bg-slate-800 text-slate-300 text-[11.5px] font-bold rounded-lg transition-colors cursor-pointer"
          >
            Switch to local SQLite data
          </button>
        </div>
      )}

      {dbSource && !dbSource.error && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar Tabs */}
          <div className="space-y-1 lg:col-span-1">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block mb-3">
              Database Tables
            </span>
            <div className="space-y-1">
              {tables.map(tableName => {
                const isSelected = expandedTable === tableName;
                const count = Array.isArray(dbSource[tableName]) ? dbSource[tableName].length : 0;
                return (
                  <button
                    key={tableName}
                    onClick={() => setExpandedTable(tableName)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30 font-bold'
                        : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {getTableIcon(tableName)}
                      <span>{getTableLabel(tableName)}</span>
                    </div>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-950 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Records Table Inspector */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Table Header / Search */}
            <div className="p-4 rounded-2xl border bg-slate-900/40 border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2 text-white">
                  {expandedTable && getTableIcon(expandedTable)}
                  {expandedTable ? getTableLabel(expandedTable) : 'Select a Table'}
                </h3>
                <span className="text-[10px] text-slate-500">
                  Showing matching logs stored in the active system database schema
                </span>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-slate-955 border-slate-850 text-white placeholder-slate-650 text-[11.5px] outline-none transition-all focus:border-indigo-500"
                />
                <Search className="h-4 w-4 absolute left-3 top-2.5 opacity-35 text-slate-400" />
              </div>
            </div>

            {/* Table Container */}
            {expandedTable && (
              <div className="border border-slate-800/85 rounded-2xl overflow-hidden bg-slate-900/60">
                <div className="overflow-x-auto">
                  {getFilteredRecords(expandedTable).length === 0 ? (
                    <div className="text-center py-16 text-slate-600">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-35" />
                      <p className="text-xs font-bold">No Records Found</p>
                      <p className="text-[10px] mt-1">Submit a problem first to populate the tables.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-955/40 text-slate-400 font-bold">
                          {Object.keys(getFilteredRecords(expandedTable)[0])
                            .filter(key => {
                              // If simple mode, hide internal UUIDs / settings ids to keep layout simple
                              if (!showTechnicalDetails) {
                                const lower = key.toLowerCase();
                                if (lower.endsWith('_id') && key !== 'event_id' && key !== 'mission_id') return false;
                                if (lower === 'setting_id' || lower === 'mapping_id' || lower === 'timeline_id' || lower === 'workflow_id') return false;
                                if (lower === 'latitude' || lower === 'longitude' || lower.includes('uuid')) return false;
                              }
                              return true;
                            })
                            .map(key => (
                              <th key={key} className="p-3.5 font-semibold text-[10px] uppercase tracking-wider text-slate-400">
                                {cleanHeaderLabel(key)}
                              </th>
                            ))
                          }
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredRecords(expandedTable).map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-850 hover:bg-slate-900/30 transition-colors"
                          >
                            {Object.entries(row)
                              .filter(([key]) => {
                                if (!showTechnicalDetails) {
                                  const lower = key.toLowerCase();
                                  if (lower.endsWith('_id') && key !== 'event_id' && key !== 'mission_id') return false;
                                  if (lower === 'setting_id' || lower === 'mapping_id' || lower === 'timeline_id' || lower === 'workflow_id') return false;
                                  if (lower === 'latitude' || lower === 'longitude' || lower.includes('uuid')) return false;
                                }
                                return true;
                              })
                              .map(([key, val]: any) => {
                                const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
                                const isId = key.toLowerCase().includes('id') || key.toLowerCase().includes('key');
                                const isTime = key.toLowerCase().includes('time') || key.toLowerCase().includes('at') || key.toLowerCase().includes('timestamp') || key.toLowerCase().includes('date') || key.toLowerCase().includes('created') || key.toLowerCase().includes('lastused');
                                
                                // Format timestamps into readable form
                                const formatTime = (raw: string) => {
                                  try {
                                    const d = new Date(raw);
                                    if (isNaN(d.getTime())) return raw;
                                    const day = d.getDate();
                                    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
                                    let h = d.getHours();
                                    const m = d.getMinutes().toString().padStart(2, '0');
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    h = h % 12 || 12;
                                    return `${day} ${mon}, ${h}:${m} ${ampm}`;
                                  } catch { return raw; }
                                };

                                return (
                                  <td key={key} className="p-3.5 align-middle leading-normal max-w-sm truncate text-slate-200">
                                    {isId ? (
                                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/20 px-1 py-0.5 rounded font-bold">
                                        {valStr}
                                      </span>
                                    ) : isTime ? (
                                      <span className="text-[11px] text-sky-400 font-semibold">
                                        {formatTime(valStr)}
                                      </span>
                                    ) : val === true ? (
                                      <span className="text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-bold">ACTIVE</span>
                                    ) : val === false ? (
                                      <span className="text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold">INACTIVE</span>
                                    ) : key === 'severity' ? (
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        valStr.toUpperCase() === 'CRITICAL' || valStr === '75' || parseInt(valStr, 10) > 75
                                          ? 'bg-rose-500/15 text-rose-450 border border-rose-500/20'
                                          : 'bg-amber-500/15 text-amber-450 border border-amber-500/20'
                                      }`}>
                                        {valStr}
                                      </span>
                                    ) : key === 'status' || key === 'mission_status' ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <span className={`h-1.5 w-1.5 rounded-full ${
                                          valStr === 'IN_PROGRESS' || valStr === 'active' || valStr === 'pending'
                                            ? 'bg-amber-400 animate-pulse'
                                            : 'bg-emerald-400'
                                        }`} />
                                        <span className="text-[11.5px]">{valStr}</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-200">
                                        {valStr}
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="relative flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
      <Database className="h-4.5 w-4.5 text-indigo-500 absolute" />
    </div>
  );
}
