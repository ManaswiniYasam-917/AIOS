import React, { useState } from 'react';
import { 
  Globe, 
  MapPin, 
  Search, 
  Cpu, 
  Battery, 
  Thermometer, 
  Compass, 
  Info,
  Shield,
  Activity
} from 'lucide-react';
import { EdgeDevice } from '../types';

interface LiveMapViewProps {
  devices: EdgeDevice[];
  theme: 'dark' | 'light';
}

export default function LiveMapView({ devices, theme }: LiveMapViewProps) {
  const isDark = theme === 'dark';

  const [selectedDevice, setSelectedDevice] = useState<EdgeDevice | null>(devices[0] || null);
  const [deviceClassFilter, setDeviceClassFilter] = useState<string>('All');

  // Interactive node coordinate scaler to fit inside our 800x400 SVG box
  // Maps standard latitude & longitude coordinates to visual canvas points
  const getCanvasCoordinates = (lat: number, lng: number) => {
    // Mercator approximation for mapping
    const x = ((lng + 180) * (800 / 360));
    // Standard Latitude mapping offset
    const y = (((90 - lat) * (400 / 180)));
    return { x, y };
  };

  const filteredDevices = devices.filter(d => {
    if (deviceClassFilter === 'All') return true;
    return d.type === deviceClassFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>🗺️ Live Map</h2>
          <p className="text-xs text-slate-400">See where all your devices are in the world. Click a dot on the map to view device details.</p>
        </div>
      </div>

      {/* Map visual and side panel split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Dynamic SVG Map Grid */}
        <div className={`lg:col-span-8 p-4 rounded-lg border ${
          isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-900 border-slate-800'
        } flex flex-col justify-between space-y-4 shadow-xl relative min-h-[460px]`}>
          
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <span className="text-[10px] text-indigo-400 font-mono uppercase font-bold flex items-center">
              <Compass className="h-4 w-4 mr-1.5 animate-spin-slow" />
              Device Locations
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-[9px] text-slate-500 font-mono font-bold mr-1 uppercase">Filter:</span>
              <select
                value={deviceClassFilter}
                onChange={(e) => setDeviceClassFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-[10px] text-slate-300 outline-none"
              >
                <option value="All">All Nodes</option>
                <option value="Jetson">Jetson</option>
                <option value="Drone">Drones</option>
                <option value="Robot">Robots</option>
                <option value="Vehicle">Vehicles</option>
              </select>
            </div>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative flex-1 bg-slate-950 rounded border border-slate-900 overflow-hidden min-h-[300px]">
            <svg viewBox="0 0 800 400" className="w-full h-full opacity-70">
              {/* World outline dots (Abstract stylized background grid) */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#1e293b" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Decorative continents outlines / shapes to represent coordinates visually */}
              <g fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 4">
                {/* Abstract horizontal coordinate rings */}
                <line x1="0" y1="100" x2="800" y2="100" />
                <line x1="0" y1="200" x2="800" y2="200" />
                <line x1="0" y1="300" x2="800" y2="300" />
                {/* Meridian */}
                <line x1="400" y1="0" x2="400" y2="400" />
              </g>

              {/* Render edge fleet markers */}
              {filteredDevices.map((dev) => {
                const { x, y } = getCanvasCoordinates(dev.location.lat, dev.location.lng);
                const isSelected = selectedDevice?.id === dev.id;

                // Set node color based on status
                let markerColor = '#06b6d4'; // online - cyan
                if (dev.status === 'Maintenance') markerColor = '#f59e0b'; // amber
                if (dev.status === 'Offline') markerColor = '#64748b'; // gray
                if (dev.health === 'Critical') markerColor = '#ef4444'; // critical - red

                return (
                  <g 
                    key={dev.id}
                    onClick={() => setSelectedDevice(dev)}
                    className="cursor-pointer group"
                  >
                    {/* Pulsing glow under selected / critical nodes */}
                    {(isSelected || dev.health === 'Critical') && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="14" 
                        fill={markerColor} 
                        opacity="0.15" 
                        className="animate-ping" 
                      />
                    )}

                    {/* Outer hover boundary circle */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isSelected ? '8' : '6'} 
                      fill="transparent" 
                      stroke={markerColor} 
                      strokeWidth={isSelected ? '2' : '1.5'} 
                      className="transition-all duration-300"
                    />

                    {/* Center solid core dot */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="3" 
                      fill={markerColor} 
                    />

                    {/* Short text overlay for hovering */}
                    <text 
                      x={x + 10} 
                      y={y + 4} 
                      fill={isSelected ? '#ffffff' : '#64748b'} 
                      fontSize="8" 
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      className="transition-colors pointer-events-none opacity-0 group-hover:opacity-100 select-none"
                    >
                      {dev.name.split(' - ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Quick Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-900 p-2 rounded text-[8px] font-mono space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                <span>ONLINE / ACTIVE</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>MAINTENANCE STATUS</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                <span>CRITICAL FAIL STATE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Selected Node Real-Time Diagnostic Feed */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Device Details</h3>

          {selectedDevice ? (
            <div className={`p-5 rounded-lg border ${
              isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
            } space-y-5 shadow-sm`}>
              
              <div>
                <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold bg-cyan-950/40 px-1.5 py-0.5 rounded tracking-wider">
                  {selectedDevice.type} CLUSTER
                </span>
                <h4 className={`font-bold text-base mt-2 leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {selectedDevice.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Last reported check-in: {new Date(selectedDevice.lastSeen).toLocaleTimeString()}</p>
              </div>

              {/* Telemetry specs list */}
              <div className="space-y-3 font-mono text-xs border-t border-b border-slate-850 py-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">COORDINATES:</span>
                  <span className="text-slate-300 font-bold">{selectedDevice.location.lat.toFixed(4)}N, {selectedDevice.location.lng.toFixed(4)}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CITY/REGION:</span>
                  <span className="text-slate-300 font-bold">{selectedDevice.location.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OPERATIONAL STATE:</span>
                  <span className={`font-bold ${selectedDevice.status === 'Online' ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {selectedDevice.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">THERMAL LOAD:</span>
                  <span className={`font-bold ${selectedDevice.temperature > 50 ? 'text-red-400' : 'text-slate-300'}`}>
                    {selectedDevice.temperature}°C (Core)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">BATTERY RESERVE:</span>
                  <span className="text-slate-300 font-bold">{selectedDevice.battery}%</span>
                </div>
              </div>

              {/* Visual meter stats bars */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>CPU LOAD</span>
                    <span className="font-mono text-cyan-400">{selectedDevice.cpu}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded bg-slate-950 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded" style={{ width: `${selectedDevice.cpu}%` }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>MEMORY COMMIT</span>
                    <span className="font-mono text-blue-400">{selectedDevice.ram}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded bg-slate-950 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded" style={{ width: `${selectedDevice.ram}%` }} />
                  </div>
                </div>
              </div>

              <div className={`p-3 rounded border font-mono text-[9px] text-slate-500 ${isDark ? 'bg-slate-950/80 border-slate-900' : 'bg-slate-50 border-slate-150'}`}>
                <span className="text-slate-400 block font-bold mb-1 flex items-center">
                  <Shield className="h-3.5 w-3.5 mr-1 text-cyan-400" />
                  CRYPTOGRAPHIC HANDSHAKE SECURED
                </span>
                <span>Payload transit verified under TLS 1.3 cryptographic conduits. Key hash: md5_7e192a.</span>
              </div>
            </div>
          ) : (
            <div className={`p-8 rounded-lg border border-dashed text-center ${
              isDark ? 'bg-slate-900/10 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <Globe className="h-8 w-8 text-slate-500 mx-auto mb-2 animate-pulse" />
              <h5 className="font-bold text-slate-300 text-xs mb-1">Inspector Disconnected</h5>
              <p className="text-[11px] text-slate-500 max-w-xs">Select any floating GIS map node coordinate to inspect active Edge cluster diagnostics.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
