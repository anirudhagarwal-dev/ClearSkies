import React, { useState } from "react";
import { X, ShieldAlert, School, Check, Copy, Share2, Printer, AlertTriangle } from "lucide-react";
import { VerdictData } from "../types";

interface SchoolProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  verdictData: VerdictData;
}

export const SchoolProtocolModal: React.FC<SchoolProtocolModalProps> = ({
  isOpen,
  onClose,
  verdictData,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isSevere = verdictData.aqiValue > 300;
  const isPoor = verdictData.aqiValue > 200 && verdictData.aqiValue <= 300;

  // Generates copyable parent message
  const parentNoticeText = isSevere
    ? `[EMERGENCY SCHOOL ADVISORY] Notice to Parents: AQI at ${verdictData.stationName} has reached ${verdictData.aqiValue} (${verdictData.aqiCategory}). As per CPCB School Safety Protocols, ALL outdoor sports, morning assemblies, and open playground activities are SUSPENDED today. All students will remain inside sealed air-filtered classrooms. Please ensure your child wears an N95 mask during school transit.`
    : isPoor
    ? `[AIR QUALITY ADVISORY] Notice to Parents: AQI at ${verdictData.stationName} is ${verdictData.aqiValue} (${verdictData.aqiCategory}). Morning physical education is modified to indoor low-exertion activities. Sensitive and asthmatic students are excused from outdoor exposure.`
    : `[SCHOOL UPDATE] Air quality at ${verdictData.stationName} is currently ${verdictData.aqiCategory} (AQI ${verdictData.aqiValue}). Normal outdoor sports and recess are taking place as scheduled.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(parentNoticeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-2xl bg-slate-900 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-950/60 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
              <School className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">CPCB Graded Action Plan</span>
              <h2 className="text-xl font-black text-white">School Air Safety Protocol</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Situation Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Monitored Campus Zone</p>
              <h3 className="text-base font-bold text-white">{verdictData.stationName}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Current NAQI</p>
              <span className="text-2xl font-black text-rose-400">{verdictData.aqiValue}</span>
              <span className="text-[10px] ml-1 uppercase text-slate-300 font-semibold">({verdictData.aqiCategory})</span>
            </div>
          </div>

          {/* Action Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Binding Directives for School Principals</h4>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <strong className="text-white block font-semibold">Morning Assembly Protocol</strong>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isSevere
                      ? "Zero outdoor assembly. Disperse students immediately to indoor homerooms."
                      : isPoor
                      ? "Limit morning assembly to under 10 minutes or conduct inside auditorium."
                      : "Morning open ground assembly permitted."}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <strong className="text-white block font-semibold">Physical Education & Sports</strong>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isSevere
                      ? "SUSPEND all outdoor physical education, running, football and field drills. Restrict children to library or indoor study."
                      : isPoor
                      ? "Cancel intensive stamina workouts. Replace with indoor yoga or chess."
                      : "Standard sports curriculum authorized."}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <strong className="text-white block font-semibold">Classroom Air Management & Filtration</strong>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Seal room perimeters between 7:30 AM and 11:30 AM when vehicular smoke peaks. Keep infirmary nebulizers and inhalers checked.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 1-Click Draft Parent Notification */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">1-Click WhatsApp / SMS Draft for Parents</h4>
              <button
                onClick={copyToClipboard}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 flex items-center gap-1 border border-cyan-500/30"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy Draft"}
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-slate-300 leading-relaxed select-all">
              {parentNoticeText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-slate-950">
          <span className="text-[11px] text-slate-500 font-mono">Official Authority: Central Pollution Control Board (MoEFCC)</span>
          <button
            onClick={onClose}
            className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
