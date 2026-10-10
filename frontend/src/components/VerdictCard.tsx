import React from "react";
import { AlertTriangle, CheckCircle2, ShieldBan, Info, Clock, Database, ChevronRight, School, Users, HeartPulse } from "lucide-react";
import { VerdictData, AudienceType, VerdictType } from "../types";

interface VerdictCardProps {
  data: VerdictData;
  audience: AudienceType;
  setAudience: (aud: AudienceType) => void;
  onOpenSchoolModal: () => void;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  data,
  audience,
  setAudience,
  onOpenSchoolModal,
}) => {
  const getVerdictStyle = (verdict: VerdictType) => {
    switch (verdict) {
      case "SAFE":
        return {
          bg: "bg-emerald-950/40 border-emerald-500/40 text-emerald-400",
          badgeBg: "bg-emerald-500 text-black",
          icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
          label: "SAFE FOR OUTDOOR ACTIVITY",
        };
      case "LIMIT_OUTDOOR":
        return {
          bg: "bg-amber-950/40 border-amber-500/40 text-amber-300",
          badgeBg: "bg-amber-500 text-black",
          icon: <AlertTriangle className="w-7 h-7 text-amber-400" />,
          label: "LIMIT OUTDOOR EXERTION",
        };
      case "AVOID_OUTDOOR":
        return {
          bg: "bg-orange-950/40 border-orange-500/40 text-orange-300",
          badgeBg: "bg-orange-500 text-black",
          icon: <AlertTriangle className="w-7 h-7 text-orange-400" />,
          label: "AVOID PROLONGED OUTDOOR EXPOSURE",
        };
      case "STAY_INDOORS":
        return {
          bg: "bg-rose-950/50 border-rose-500/50 text-rose-300",
          badgeBg: "bg-rose-600 text-white animate-pulse",
          icon: <ShieldBan className="w-7 h-7 text-rose-400" />,
          label: "STAY INDOORS • ZERO OUTDOOR SPORTS",
        };
    }
  };

  const getCpcbColor = (category: string) => {
    switch (category) {
      case "GOOD": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "SATISFACTORY": return "text-lime-400 bg-lime-500/10 border-lime-500/30";
      case "MODERATE": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
      case "POOR": return "text-orange-400 bg-orange-500/10 border-orange-500/30";
      case "VERY_POOR": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "SEVERE": return "text-rose-400 bg-rose-900/40 border-rose-500/50";
      default: return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  const currentStyle = getVerdictStyle(data.verdict);

  return (
    <div className="glass-panel p-6 sm:p-8 relative overflow-hidden border border-white/10">
      {/* Audience Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Audience-Specific Decision Engine</span>
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
            {data.stationName}
          </h2>
        </div>

        {/* Demographic Audience Pill Selector */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setAudience("CHILDREN_SCHOOL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              audience === "CHILDREN_SCHOOL"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <School className="w-3.5 h-3.5" />
            School & Children
          </button>
          <button
            onClick={() => setAudience("GENERAL")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              audience === "GENERAL"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            General Public
          </button>
          <button
            onClick={() => setAudience("SENSITIVE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              audience === "SENSITIVE"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Asthma / Seniors
          </button>
        </div>
      </div>

      {/* Main Verdict Banner */}
      <div className={`mt-6 p-6 rounded-2xl border ${currentStyle.bg} flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-black/30 border border-white/10 shrink-0">
            {currentStyle.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${currentStyle.badgeBg}`}>
                {data.verdict.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-400 font-mono">Rule: {data.ruleFired}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1.5">
              {currentStyle.label}
            </h3>
            <p className="text-sm font-medium mt-1 leading-relaxed text-slate-200 max-w-2xl">
              {data.plainLanguageRecommendation}
            </p>
          </div>
        </div>

        {/* AQI Score Badge */}
        <div className="flex flex-col items-center justify-center bg-black/40 border border-white/10 px-6 py-4 rounded-xl min-w-[140px] shrink-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">CPCB NAQI</span>
          <span className="text-4xl sm:text-5xl font-black text-white tracking-tight my-0.5">{data.aqiValue}</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${getCpcbColor(data.aqiCategory)} uppercase`}>
            {data.aqiCategory.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Action Advisory CTA for Schools */}
      {audience === "CHILDREN_SCHOOL" && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-rose-400 shrink-0" />
            <p className="text-xs text-slate-200">
              <strong className="text-white font-semibold">School Action Plan Ready: </strong>
              Automatic morning assembly, sports recess, and N95 masking directives for today.
            </p>
          </div>
          <button
            onClick={onOpenSchoolModal}
            className="text-xs font-bold px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1 shrink-0 shadow-lg shadow-rose-600/20"
          >
            View School Directive <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Official CPCB Citation & Metadata */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
        <div className="flex items-start gap-2.5 text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300">Official CPCB Impact Statement: </span>
            <span>"{data.officialHealthStatement}"</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end text-slate-400 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            {data.source}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {new Date(data.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className={`px-1.5 py-0.5 rounded font-bold ${data.freshness === "FRESH" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
            {data.freshness}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {data.dataKind}
          </span>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer */}
      <p className="mt-4 text-[10px] text-slate-500 italic text-center">
        {data.disclaimer}
      </p>
    </div>
  );
};
