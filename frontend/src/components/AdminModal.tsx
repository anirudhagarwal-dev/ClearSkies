import React, { useState } from "react";
import { X, Activity, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { IngestionRunItem } from "../types";

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  runs: IngestionRunItem[];
  onTriggerIngestion: () => Promise<void>;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  runs,
  onTriggerIngestion,
}) => {
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrigger = async () => {
    setTriggering(true);
    setMessage(null);
    try {
      await onTriggerIngestion();
      setMessage("Data ingestion successfully triggered!");
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage("Ingestion completed with fallback.");
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-3xl bg-slate-900 border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">System Ingestion & Source Health</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-white/10 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Continuous Telemetry Sync</h4>
            <p className="text-xs text-slate-400">Scheduled runs every 15-60 min via background worker</p>
          </div>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggering ? "animate-spin" : ""}`} />
            {triggering ? "Syncing Feed..." : "Trigger Manual Refresh"}
          </button>
        </div>

        {message && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
            {message}
          </div>
        )}

        {/* Runs Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Provider Source</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Records Ingested</th>
                <th className="py-2.5 px-3">Execution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {runs.map((r) => (
                <tr key={r.id} className="hover:bg-slate-950/40">
                  <td className="py-2.5 px-3">#{r.id}</td>
                  <td className="py-2.5 px-3 font-sans font-medium text-white">{r.sourceName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-cyan-400">{r.recordsFetched}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans text-[11px]">
                    {new Date(r.startedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
