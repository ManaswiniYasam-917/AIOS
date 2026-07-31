import React, { useState } from 'react';
import { 
  Radio, 
  Cpu, 
  Battery, 
  HardDrive, 
  Thermometer, 
  MapPin, 
  Heart, 
  Search, 
  Filter, 
  Activity, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight,
  Info,
  Smartphone
} from 'lucide-react';
import { EdgeDevice, DeviceType, DeviceStatus } from '../types';

interface EdgeManagerViewProps {
  devices: EdgeDevice[];
  onTriggerDiagnostic: (id: string) => Promise<any>;
  theme: 'dark' | 'light';
}

export default function EdgeManagerView({ devices, onTriggerDiagnostic, theme }: EdgeManagerViewProps) {
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [diagnosticLoadingId, setDiagnosticLoadingId] = useState<string | null>(null);

  // Device types list
  const deviceTypes = ['All', 'Jetson', 'Raspberry Pi', 'ESP32', 'Robot', 'Drone', 'Vehicle', 'Industrial Camera', 'IoT Sensor'];
  const deviceStatuses = ['All', 'Online', 'Maintenance', 'Offline'];

  // Filtering
  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.location.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || d.type === selectedType;
    const matchesStatus = selectedStatus === 'All' || d.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleRunDiagnostic = async (id: string) => {
    setDiagnosticLoadingId(id);
    try {
      await onTriggerDiagnostic(id);
    } catch (err) {
      console.error('Diagnostic error:', err);
    } finally {
      setDiagnosticLoadingId(null);
    }
  };

  // Helper for status badges
  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case 'Online':
        return 'bg-emerald-950 text-emerald-400 border border-emerald-800/35';
      case 'Offline':
        return 'bg-slate-900 text-slate-500 border border-slate-800';
      case 'Maintenance':
        return 'bg-amber-950 text-amber-400 border border-amber-800/35';
    }
  };

  // Helper for health meters
  const getHealthBadge = (health: 'Healthy' | 'Warning' | 'Critical') => {
    switch (health) {
      case 'Healthy':
        return 'text-emerald-400';
      case 'Warning':
        return 'text-amber-400 animate-pulse';
      case 'Critical':
        return 'text-red-500 font-bold animate-pulse';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>📡 Devices</h2>
          <p className="text-xs text-slate-400">Monitor your connected hardware — robots, drones, sensors and more. See CPU, battery, temperature and run diagnostics.</p>
        </div>
      </div>

      {/* Filter and search actions card */}
      <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm`}>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by device name or location…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded p-2 pl-9 text-xs text-slate-300 placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Type */}
          <div className="flex items-center space-x-1">
            <Filter className="h-3 w-3 text-slate-500" />
            <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Type:</span>
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-950 border border-slate-850 p-1.5 rounded text-[10px] text-slate-300 outline-none"
            >
              {deviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Status:</span>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-850 p-1.5 rounded text-[10px] text-slate-300 outline-none"
            >
              {deviceStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of registered hardware units */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => (
          <div 
            key={device.id}
            className={`p-5 rounded-lg border transition-all ${
              isDark ? 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
            } space-y-4`}
          >
            {/* Row 1 Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold bg-cyan-950/40 px-1.5 py-0.5 rounded tracking-wider">
                  {device.type}
                </span>
                <h4 className={`font-bold text-sm mt-1.5 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {device.name}
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${getStatusBadge(device.status)}`}>
                {device.status}
              </span>
            </div>

            {/* Row 2 Location info */}
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>{device.location.name}</span>
              <span className="text-slate-600 font-mono">({device.location.lat.toFixed(2)}, {device.location.lng.toFixed(2)})</span>
            </div>

            {/* Row 3 Real-time telemetry sliders */}
            <div className="grid grid-cols-2 gap-3.5 border-t border-b border-slate-850 py-3.5 font-mono text-[10px]">
              {/* CPU */}
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Cpu className="h-3 w-3 text-slate-600" />
                  <span>CPU:</span>
                </span>
                <span className={`font-bold ${device.cpu > 75 ? 'text-amber-500' : 'text-slate-300'}`}>
                  {device.cpu}%
                </span>
                <div className="w-full h-1 bg-slate-950/80 rounded overflow-hidden">
                  <div className={`h-full rounded ${device.cpu > 75 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${device.cpu}%` }} />
                </div>
              </div>

              {/* Memory */}
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Activity className="h-3 w-3 text-slate-600" />
                  <span>RAM:</span>
                </span>
                <span className={`font-bold ${device.ram > 80 ? 'text-red-400' : 'text-slate-300'}`}>
                  {device.ram}%
                </span>
                <div className="w-full h-1 bg-slate-950/80 rounded overflow-hidden">
                  <div className={`h-full rounded ${device.ram > 80 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${device.ram}%` }} />
                </div>
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-slate-600" />
                  <span>TEMP:</span>
                </span>
                <span className={`font-bold ${device.temperature > 50 ? 'text-red-400' : 'text-slate-300'}`}>
                  {device.temperature}°C
                </span>
                <div className="w-full h-1 bg-slate-950/80 rounded overflow-hidden">
                  <div className={`h-full rounded ${device.temperature > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${device.temperature * 1.5}%` }} />
                </div>
              </div>

              {/* Battery */}
              <div className="space-y-1">
                <span className="text-slate-500 flex items-center gap-1">
                  <Battery className="h-3 w-3 text-slate-600" />
                  <span>BATTERY:</span>
                </span>
                <span className={`font-bold ${device.battery < 40 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {device.battery === 100 ? 'PLUGGED IN' : `${device.battery}%`}
                </span>
                <div className="w-full h-1 bg-slate-950/80 rounded overflow-hidden">
                  <div className={`h-full rounded ${device.battery < 40 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${device.battery}%` }} />
                </div>
              </div>
            </div>

            {/* Row 4 Diagnosis triggers */}
            <div className="flex items-center justify-between pt-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold flex items-center">
                HEALTH:&nbsp;
                <span className={getHealthBadge(device.health)}>
                  {device.health}
                </span>
              </span>

              <button 
                onClick={() => handleRunDiagnostic(device.id)}
                disabled={diagnosticLoadingId === device.id}
                className="bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all active:scale-95"
              >
                {diagnosticLoadingId === device.id ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin text-cyan-400" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    <span>Run Diagnostic</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {filteredDevices.length === 0 && (
          <div className="col-span-full py-16 text-center border border-slate-800 border-dashed rounded-lg bg-slate-900/10">
            <Radio className="h-8 w-8 text-slate-500 mx-auto mb-3 animate-pulse" />
            <h5 className="font-bold text-slate-300 text-sm mb-1">No devices found</h5>
            <p className="text-xs text-slate-500">No devices match your search or filter. Try clearing the filters.</p>
          </div>
        )}
      </div>

    </div>
  );
}
