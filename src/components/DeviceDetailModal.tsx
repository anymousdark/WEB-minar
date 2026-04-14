import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Shield, 
  Wifi, 
  AlertTriangle, 
  ExternalLink, 
  Globe, 
  Cpu, 
  Server,
  Activity,
  Clock,
  Info
} from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Finding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  desc: string;
  port: number | null;
  cve?: string;
  link?: string;
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

interface DeviceDetailModalProps {
  device: Device | null;
  onClose: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({ device, onClose }) => {
  if (!device) return null;

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f0f12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                device.risk_score >= 60 ? "bg-red-600/20 text-red-500" : "bg-blue-600/20 text-blue-500"
              )}>
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{device.hostname}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>{device.ip}</span>
                  <span>•</span>
                  <span>{device.mac}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3 h-3" />
                  Risk Assessment
                </span>
                <div className="flex items-end gap-2 mt-1">
                  <span className={cn("text-3xl font-black", getScoreColor(device.risk_score))}>
                    {device.risk_score}
                  </span>
                  <span className="text-xs text-slate-500 mb-1.5">/ 100</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${device.risk_score}%` }}
                    className={cn("h-full", 
                      device.risk_score >= 60 ? "bg-red-500" : 
                      device.risk_score >= 30 ? "bg-orange-500" : "bg-green-500"
                    )}
                  />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" />
                  Network Status
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-lg font-bold text-green-500 uppercase tracking-tight">Online</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">Last seen: {new Date(device.last_seen).toLocaleString()}</span>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3 h-3" />
                  Manufacturer
                </span>
                <div className="mt-2">
                  <span className="text-lg font-bold text-slate-200">{device.vendor}</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1">OUI Fingerprint detected</span>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Services & Risk Intelligence Column */}
              <div className="space-y-8">
                {/* Services */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Exposed Services
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {device.ports.map(port => (
                      <div key={port} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-blue-400">PORT {port}</span>
                          <span className="text-[10px] text-slate-500 font-mono">TCP/IP</span>
                        </div>
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                    {device.ports.length === 0 && (
                      <div className="col-span-2 py-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-xs text-slate-500 italic">No open ports detected during last scan</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Intelligence */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Risk Intelligence
                  </h3>
                  <div className="space-y-3">
                    {device.findings.map((f, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", 
                              f.severity === "CRITICAL" ? "bg-red-500" : 
                              f.severity === "HIGH" ? "bg-orange-500" : "bg-yellow-500"
                            )} />
                            <span className="text-xs font-bold text-white">{f.title}</span>
                          </div>
                          {f.cve && f.cve !== "N/A" && (
                            <span className="text-[9px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                              {f.cve}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          {f.desc}
                        </p>
                        {f.link && (
                          <a 
                            href={f.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300 transition-colors group/link"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Security Advisory</span>
                            <div className="h-px flex-1 bg-blue-500/20 group-hover/link:bg-blue-500/40 transition-colors" />
                          </a>
                        )}
                      </div>
                    ))}
                    {device.findings.length === 0 && (
                      <div className="py-8 text-center bg-green-500/5 border border-dashed border-green-500/20 rounded-2xl">
                        <p className="text-xs text-green-500/60 italic">No intelligence data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vulnerabilities Summary */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Security Findings ({device.findings.length})
                </h3>
                <div className="space-y-4">
                  {device.findings.map((f, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{f.title}</h4>
                            {f.cve && f.cve !== "N/A" && (
                              <span className="text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-400 border border-white/5">
                                {f.cve}
                              </span>
                            )}
                          </div>
                          <div className={cn("inline-flex text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-tighter", getSeverityColor(f.severity))}>
                            {f.severity}
                          </div>
                        </div>
                        {f.link && (
                          <a 
                            href={f.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-xl transition-all"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {f.desc}
                      </p>
                      {f.port && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono bg-black/20 w-fit px-2 py-1 rounded-lg">
                          <Shield className="w-3 h-3" />
                          AFFECTS PORT {f.port}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {device.findings.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center bg-green-500/5 border border-dashed border-green-500/20 rounded-3xl text-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-3">
                        <Shield className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-green-500/80">No Vulnerabilities Detected</p>
                      <p className="text-[10px] text-green-500/50 uppercase tracking-widest mt-1">System Secure</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
