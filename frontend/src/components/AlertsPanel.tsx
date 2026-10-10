import React, { useState } from "react";
import { AlertRule, InAppNotification, LocationItem, AudienceType } from "../types";
import { Bell, Plus, Trash2, CheckCheck, Clock, ShieldAlert } from "lucide-react";

interface AlertsPanelProps {
  rules: AlertRule[];
  notifications: InAppNotification[];
  locations: LocationItem[];
  onCreateRule: (locationId: number, audience: AudienceType, verdict: string) => void;
  onDeleteRule: (ruleId: number) => void;
  onMarkRead: (notifId: number) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  rules,
  notifications,
  locations,
  onCreateRule,
  onDeleteRule,
  onMarkRead,
}) => {
  const [selectedLoc, setSelectedLoc] = useState(locations[0]?.id || 1);
  const [selectedAud, setSelectedAud] = useState<AudienceType>("CHILDREN_SCHOOL");
  const [selectedVerdict, setSelectedVerdict] = useState("AVOID_OUTDOOR");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRule(selectedLoc, selectedAud, selectedVerdict);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Alert Rules Section */}
      <div className="glass-panel p-6 border border-white/10 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Automated Alert Rules
            </h3>
            <p className="text-xs text-slate-400">Triggers in-app alerts when air crosses threshold</p>
          </div>
        </div>

        {/* Create Rule Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-900 border border-white/10 mb-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Create New Alert Trigger</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Target Location</label>
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(Number(e.target.value))}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Target Group</label>
              <select
                value={selectedAud}
                onChange={(e) => setSelectedAud(e.target.value as AudienceType)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="CHILDREN_SCHOOL">Children / School</option>
                <option value="GENERAL">General Public</option>
                <option value="SENSITIVE">Sensitive Groups</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Threshold Verdict</label>
              <select
                value={selectedVerdict}
                onChange={(e) => setSelectedVerdict(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="LIMIT_OUTDOOR">Limit Outdoor</option>
                <option value="AVOID_OUTDOOR">Avoid Outdoor</option>
                <option value="STAY_INDOORS">Stay Indoors</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Save Alert Rule
          </button>
        </form>

        {/* Existing Rules List */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[300px]">
          {rules.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No custom alert rules configured yet.</p>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-white">{rule.locationName}</h4>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Trigger: <span className="text-rose-400 font-semibold">{rule.triggerVerdict}</span> ({rule.audience})
                  </div>
                </div>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notifications Log Section */}
      <div className="glass-panel p-6 border border-white/10 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              In-App Notification Feed
            </h3>
            <p className="text-xs text-slate-400">Triggered notifications from your active alert rules</p>
          </div>
        </div>

        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[440px]">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-10">No recent notifications triggered.</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all text-xs flex items-start justify-between gap-3 ${
                  notif.read
                    ? "bg-slate-900/40 border-white/5 text-slate-400"
                    : "bg-slate-900 border-cyan-500/40 text-slate-200 shadow-md shadow-cyan-500/5"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    )}
                    <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="leading-relaxed font-medium">{notif.message}</p>
                </div>

                {!notif.read && (
                  <button
                    onClick={() => onMarkRead(notif.id)}
                    className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 shrink-0"
                    title="Mark as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
