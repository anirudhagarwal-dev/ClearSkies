import React, { useState } from "react";
import { HistoryPoint } from "../types";
import { TrendingUp, Calendar, Zap } from "lucide-react";

interface HistoryChartProps {
  history: HistoryPoint[];
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
  const [activeRange, setActiveRange] = useState<"24h" | "7d">("24h");
  const [hoveredPoint, setHoveredPoint] = useState<HistoryPoint | null>(null);

  if (!history || history.length === 0) {
    return (
      <div className="glass-panel p-6 text-center text-slate-400">
        No historical observation data available for this station.
      </div>
    );
  }

  const maxAqi = Math.max(...history.map((h) => h.aqi), 450);
  const chartHeight = 170;
  const chartWidth = 700;

  // Compute SVG polyline points
  const points = history.map((pt, idx) => {
    const x = (idx / (history.length - 1 || 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (pt.aqi / maxAqi) * (chartHeight - 30) - 15;
    return { x, y, pt };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

  return (
    <div className="glass-panel p-6 border border-white/10 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            24-Hour Diurnal AQI Trend
          </h3>
          <p className="text-xs text-slate-400">
            Hourly continuous ground tracking showing traffic & inversion peaks
          </p>
        </div>

        {/* Range Toggle */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveRange("24h")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeRange === "24h" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25" : "text-slate-400 hover:text-white"
            }`}
          >
            24 Hours
          </button>
          <button
            onClick={() => setActiveRange("7d")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeRange === "7d" ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25" : "text-slate-400 hover:text-white"
            }`}
          >
            7 Days
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-52 overflow-visible"
        >
          <defs>
            <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines for CPCB categories */}
          <line x1="20" y1={chartHeight - (300 / maxAqi) * chartHeight} x2={chartWidth - 20} y2={chartHeight - (300 / maxAqi) * chartHeight} stroke="rgba(244, 63, 94, 0.25)" strokeDasharray="4 4" />
          <line x1="20" y1={chartHeight - (200 / maxAqi) * chartHeight} x2={chartWidth - 20} y2={chartHeight - (200 / maxAqi) * chartHeight} stroke="rgba(245, 158, 11, 0.25)" strokeDasharray="4 4" />
          <line x1="20" y1={chartHeight - (100 / maxAqi) * chartHeight} x2={chartWidth - 20} y2={chartHeight - (100 / maxAqi) * chartHeight} stroke="rgba(16, 185, 129, 0.25)" strokeDasharray="4 4" />

          {/* Fill Area */}
          <path
            d={`${pathD} L ${points[points.length - 1]?.x || 0} ${chartHeight} L 20 ${chartHeight} Z`}
            fill="url(#aqiGradient)"
          />

          {/* Line Stroke */}
          <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="3" filter="url(#glow)" />

          {/* Data Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.observedAt === p.pt.observedAt ? 6 : 3.5}
              fill={p.pt.aqi > 300 ? "#f43f5e" : p.pt.aqi > 200 ? "#f97316" : "#10b981"}
              stroke="#0b0f19"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200 hover:scale-125"
              onMouseEnter={() => setHoveredPoint(p.pt)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-slate-900/95 border border-cyan-500/50 rounded-xl p-3 text-xs shadow-2xl backdrop-blur-md pointer-events-none z-10 animate-fade-in">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              AQI: <span className="text-cyan-300 font-extrabold text-sm">{hoveredPoint.aqi}</span> ({hoveredPoint.category})
            </div>
            <div className="text-slate-300 font-mono text-[11px] mt-1">
              PM2.5: <strong className="text-white">{hoveredPoint.pm25} µg/m³</strong> • {new Date(hoveredPoint.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}
      </div>

      {/* Axis Footer */}
      <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-3 px-2 border-t border-white/10 pt-3">
        <span>-24 Hours</span>
        <span>-12 Hours</span>
        <span className="text-cyan-400 font-bold">Latest Realtime Observation</span>
      </div>
    </div>
  );
};
