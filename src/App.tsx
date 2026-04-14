import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Activity, 
  Shield, 
  Search, 
  Terminal, 
  Cpu, 
  Globe, 
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Server,
  Wifi,
  ExternalLink,
  X,
  Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib/utils";
import { DeviceDetailModal } from "@/src/components/DeviceDetailModal";

interface Finding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  desc: string;
  port: number | null;
  cve?: string;
  link?: string;
}

interface Alert {
  id: string;
  ip: string;
  title: string;
  severity: string;
}

interface Device {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  ports: number[];
  findings: Finding[];
  risk_score: number;
  last_seen: string;
  status: "online" | "offline";
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [devices, setDevices] = useState<Record<string, Device>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [network, setNetwork] = useState("192.168.1.0/24");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "MEDIUM": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      default: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-red-500";
    if (score >= 30) return "text-orange-500";
    if (score > 0) return "text-yellow-500";
    return "text-green-500";
  };

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("device", (device: Device) => {
      setDevices(prev => ({ ...prev, [device.ip]: device }));
      
      // Check for critical findings to trigger alerts
      const criticalFindings = device.findings.filter(f => f.severity === "CRITICAL");
      if (criticalFindings.length > 0) {
        criticalFindings.forEach(f => {
          const newAlert: Alert = {
            id: `${device.ip}-${f.title}-${Date.now()}`,
            ip: device.ip,
            title: f.title,
            severity: f.severity
          };
          setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5 alerts
        });
      }
    });

    newSocket.on("progress", (data: { current: number, total: number }) => {
      setProgress(data);
    });

    newSocket.on("status", (data: { msg: string }) => {
      setLogs(prev => [...prev, `[SYSTEM] ${data.msg}`]);
      if (data.msg.includes("concluído") || data.msg.includes("finalizado")) {
        setIsScanning(false);
      }
    });

    newSocket.on("log", (msg: string) => {
      setLogs(prev => [...prev, msg]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const startScan = () => {
    if (!socket) return;
    setIsScanning(true);
    setDevices({});
    setLogs([]);
    socket.emit("start-scan", network);
  };

  const stopScan = () => {
    if (!socket) return;
    socket.emit("stop-scan");
    setIsScanning(false);
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Device Detail Modal */}
      <DeviceDetailModal 
        device={selectedDevice} 
        onClose={() => setSelectedDevice(null)} 
      />

      {/* Real-time Alerts Overlay */}
      <div className="fixed top-20 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="pointer-events-auto bg-red-950/40 backdrop-blur-md border border-red-500/30 p-4 rounded-2xl shadow-2xl shadow-red-900/20 flex gap-4 items-start relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
              <div className="p-2 rounded-xl bg-red-500/20 text-red-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Critical Alert</span>
                  <button 
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{alert.title}</h4>
                <p className="text-[10px] text-slate-400">Detected on {alert.ip}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">NetScanner <span className="text-blue-500">v6.0</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Real-time Monitoring</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isScanning ? "bg-green-500" : "bg-slate-600")} />
              <span className="text-xs font-medium text-slate-400">{isScanning ? "Scanning..." : "Idle"}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls & Stats */}
        <div className="lg:col-span-4 space-y-6">
          {/* Scan Control */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Search className="w-32 h-32" />
            </div>
            
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Network Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1.5 block">Target Subnet</label>
                <input 
                  type="text" 
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g. 192.168.1.0/24"
                />
              </div>

              <div className="flex gap-3">
                {!isScanning ? (
                  <button 
                    onClick={startScan}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Scan
                  </button>
                ) : (
                  <button 
                    onClick={stopScan}
                    className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/20 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Stop Scan
                  </button>
                )}
              </div>
            </div>

            {isScanning && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>Progress</span>
                  <span>{Math.round((progress.current / progress.total) * 100 || 0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(progress.current / progress.total) * 100 || 0}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Activity Log */}
          <section className="bg-white/5 border border-white/10 rounded-2xl flex flex-col h-[400px]">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Live Console
              </h2>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
              {logs.map((log, i) => (
                <div key={i} className={cn(
                  "border-l-2 pl-3",
                  log.includes("[SYSTEM]") ? "border-blue-500 text-blue-400" : "border-slate-800 text-slate-500"
                )}>
                  <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
              {logs.length === 0 && (
                <div className="text-slate-700 italic">Waiting for activity...</div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Devices List */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Wifi className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="font-bold">Detected Devices</h2>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                {Object.keys(devices).length} Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-white/[0.02]">
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">IP Address</th>
                    <th className="px-6 py-4">Hostname</th>
                    <th className="px-6 py-4">Risk Score</th>
                    <th className="px-6 py-4 text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence>
                    {(Object.values(devices) as Device[]).map((device) => (
                      <motion.tr 
                        key={device.ip}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedDevice(device)}
                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className="text-[10px] font-bold uppercase text-green-500">Online</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm font-medium text-slate-300">{device.ip}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{device.hostname}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{device.mac}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-bold text-sm", getScoreColor(device.risk_score))}>
                              {device.risk_score}
                            </span>
                            <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all", 
                                  device.risk_score >= 60 ? "bg-red-500" : 
                                  device.risk_score >= 30 ? "bg-orange-500" : "bg-green-500"
                                )}
                                style={{ width: `${device.risk_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-500">{new Date(device.last_seen).toLocaleTimeString()}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {Object.keys(devices).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <Server className="w-12 h-12" />
                          <p className="text-sm font-medium">No devices detected yet. Start a scan to begin.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/5 py-2 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <div className="flex gap-6">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3 h-3" />
              System: Stable
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Latency: 12ms
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>© 2026 NetScanner Security Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
