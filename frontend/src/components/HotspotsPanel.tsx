import React from "react";
import { HotspotItem } from "../types";
import { Flame, ArrowUpRight, ShieldAlert, Clock, Database } from "lucide-react";

interface HotspotsPanelProps {
  hotspots: HotspotItem[];
  selectedStationId?: number;
  onSelectStation: (stationId: number) => void;
}

export const HotspotsPanel: React.FC<HotspotsPanelProps> = ({
  hotspots,
  selectedStationId,
  onSelectStation,
}) => {
  const getBadgeStyle = (category: string) => {
    switch (category) {
      case "GOOD": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "SATISFACTORY": return "bg-lime-500/20 text-lime-400 border-lime-500/30";
      case "MODERATE": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "POOR": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "VERY_POOR": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "SEVERE": return "bg-rose-950 text-rose-300 border-rose-600 animate-pulse";
      default: return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="glass-panel p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Ranked City Hotspots (Most to Least Polluted)
          </h3>
          <p className="text-xs text-slate-400">
            Real-time continuous ranking of Delhi-NCR stations by CPCB NAQI
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-white/10">
          {hotspots.length} Stations Monitored
        </span>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
        {hotspots.map((item, index) => {
          const isSelected = item.stationId === selectedStationId;
          return (
            <div
              key={item.stationId}
              onClick={() => onSelectStation(item.stationId)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? "bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                  : "bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900/90"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                  index === 0 ? "bg-rose-500 text-white font-black" : "bg-slate-800 text-slate-400"
                }`}>
                  #{index + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{item.city}</span>
                    <span>•</span>
                    <span>Primary: {item.dominantPollutant}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">{item.dataKind}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xl font-black text-white">{item.aqiValue}</span>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase mt-0.5 ${getBadgeStyle(item.aqiCategory)}`}>
                    {item.aqiCategory.replace("_", " ")}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 hover:text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
