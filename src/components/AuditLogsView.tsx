import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  Filter, 
  Trash2, 
  Info, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  FileSpreadsheet,
  Terminal,
  Clock
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  logs: AuditLog[];
  theme: 'dark' | 'light';
}

export default function AuditLogsView({ logs, theme }: AuditLogsViewProps) {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter logs based on search query or severity status
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Export mock file
  const handleExportCsv = () => {
    const header = 'Timestamp,Identity,Role,Action,Status,DiagnosticDetails\n';
    const csvContent = filteredLogs.map(l => 
      `"${l.timestamp}","${l.user}","${l.role}","${l.action}","${l.status}","${l.details.replace(/"/g, '""')}"`
    ).join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `aios_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for severity icons
  const getSeverityIcon = (status: 'Success' | 'Failure' | 'Warning') => {
    switch (status) {
      case 'Success':
        return <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />;
      case 'Warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
      case 'Failure':
        return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>🗒️ Activity Logs</h2>
          <p className="text-xs text-slate-400">A full history of everything that has happened — who did what, when, and whether it succeeded.</p>
        </div>
        
        {/* Export action */}
        <button
          onClick={handleExportCsv}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'}`}
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className={`p-4 rounded-lg border ${
        isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
      } flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm`}>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search logs by action, message payload, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded p-2 pl-9 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold font-mono">Severity:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-850 p-1.5 rounded text-[10px] text-slate-300 outline-none font-mono"
          >
            <option value="All">All Transactions</option>
            <option value="Success">Success (Online)</option>
            <option value="Warning">Warning (Caution)</option>
            <option value="Failure">Failure (Critical)</option>
          </select>
        </div>
      </div>

      {/* Table log database */}
      <div className={`rounded-lg border ${
        isDark ? 'border-slate-850 bg-slate-950' : 'border-slate-200 bg-white'
      } overflow-hidden shadow-xl`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-850 bg-slate-900/60' : 'border-slate-200 bg-slate-50'} text-slate-500 text-[10px] font-bold uppercase`}>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Identity</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Action Code</th>
                <th className="p-3.5 max-w-xs sm:max-w-md">Ledger Entry Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id}
                  className={`hover:bg-slate-900/10 transition-colors ${
                    log.status === 'Failure' 
                      ? isDark ? 'bg-red-950/5' : 'bg-red-50/20' 
                      : ''
                  }`}
                >
                  <td className="p-3.5">
                    <div className="flex items-center space-x-1">
                      {getSeverityIcon(log.status)}
                      <span className={`text-[10px] font-bold ${
                        log.status === 'Success' 
                          ? 'text-emerald-400' 
                          : log.status === 'Warning' 
                          ? 'text-amber-500' 
                          : 'text-red-500'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleDateString()} &nbsp;
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className={`p-3.5 font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                    {log.user}
                  </td>
                  <td className="p-3.5 text-slate-400">
                    {log.role}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 border border-slate-800 ${
                      isDark ? 'text-cyan-400' : 'text-cyan-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className={`p-3.5 text-slate-400 leading-relaxed text-[11px] max-w-xs sm:max-w-md break-words`}>
                    {log.details}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <Database className="h-6 w-6 text-slate-600 mx-auto mb-2 animate-pulse" />
                    <span>No cryptographic ledger entries matched search params.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
