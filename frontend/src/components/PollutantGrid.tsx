import React from "react";
import { PollutantDetail } from "../types";

interface PollutantGridProps {
  pollutants: Record<string, PollutantDetail>;
  dominantPollutant: string;
}

export const PollutantGrid: React.FC<PollutantGridProps> = ({
  pollutants,
  dominantPollutant,
}) => {
  // CPCB standard 24h safe thresholds
  const standards: Record<string, { safe: number; unit: string; desc: string }> = {
    "PM2.5": { safe: 60, unit: "µg/m³", desc: "Fine inhalable particles (<2.5 µm)" },
    "PM10": { safe: 100, unit: "µg/m³", desc: "Respirable dust & coarse particles" },
    "NO2": { safe: 80, unit: "µg/m³", desc: "Nitrogen dioxide (combustion emissions)" },
    "SO2": { safe: 80, unit: "µg/m³", desc: "Sulfur dioxide (industrial sources)" },
    "CO": { safe: 2.0, unit: "mg/m³", desc: "Carbon monoxide (vehicular exhaust)" },
    "O3": { safe: 100, unit: "µg/m³", desc: "Ground-level ozone (photochemical smog)" },
  };

  const getBarColor = (val: number, safe: number) => {
    const ratio = val / safe;
    if (ratio <= 1.0) return "bg-emerald-400 shadow-emerald-500/50";
    if (ratio <= 2.0) return "bg-amber-400 shadow-amber-500/50";
    if (ratio <= 3.0) return "bg-orange-500 shadow-orange-500/50";
    return "bg-rose-500 shadow-rose-500/50";
  };

  const getRatioBadge = (val: number, safe: number) => {
    const ratio = val / safe;
    if (ratio <= 1.0) return { label: "NORMAL", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (ratio <= 2.0) return { label: "MODERATE", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    if (ratio <= 3.0) return { label: "HIGH", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" };
    return { label: "HAZARDOUS", color: "text-rose-400 bg-rose-500/20 border-rose-500/40 animate-pulse" };
  };

  return (
    <div className="glass-panel p-6 border border-white/10 relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            Dynamic Pollutant Breakdown
          </h3>
          <p className="text-xs text-slate-400">Realtime sensor concentrations vs CPCB safe limits</p>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md">
          Dominant Driver: {dominantPollutant}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(pollutants).map(([code, p]) => {
          const std = standards[code] || { safe: 100, unit: p.unit, desc: "Ambient trace pollutant" };
          const badge = getRatioBadge(p.value, std.safe);
          const isDominant = code === dominantPollutant;

          return (
            <div
              key={code}
              className={`p-4 rounded-xl border transition-all duration-300 relative group ${
                isDominant
                  ? "bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-500/40"
                  : "bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900/80"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-extrabold text-white">{code}</span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1 my-1.5">
                <span className="text-2xl font-black text-white tracking-tight">{p.value}</span>
                <span className="text-[11px] text-slate-400 font-mono font-medium">{p.unit}</span>
              </div>
              <p className="text-[10px] text-slate-400 truncate" title={std.desc}>
                Limit: <strong className="text-slate-300">{std.safe} {std.unit}</strong>
              </p>

              {/* Enhanced Glow Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full mt-3 overflow-hidden p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-700 shadow-sm ${getBarColor(p.value, std.safe)}`}
                  style={{ width: `${Math.min(100, (p.value / (std.safe * 2.5)) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
