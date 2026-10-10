import React from "react";
import { Wind, ShieldAlert, MapPin, Bell, User as UserIcon, Activity, Flame } from "lucide-react";
import { UserProfile } from "../types";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenSchoolModal: () => void;
  onOpenAdminModal: () => void;
  unreadCount: number;
  demoMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenAuth,
  onOpenSchoolModal,
  onOpenAdminModal,
  unreadCount,
  demoMode,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      {demoMode && (
        <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-1 text-center text-xs font-semibold text-amber-300 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          DEMO MODE ACTIVE: Displaying calibrated ground-truth simulation for Delhi-NCR stations. All responses tagged dataKind=SAMPLE.
        </div>
      )}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Wind className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Air<span className="text-cyan-400">Track</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">CPCB NAQI</span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">Decisions Over Raw Data</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "dashboard"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("hotspots")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "hotspots"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Map & Hotspots
          </button>
          <button
            onClick={onOpenSchoolModal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            School Safety Protocol
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === "alerts"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            Alerts
            {unreadCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2.5">
          {user?.role === "ADMIN" && (
            <button
              onClick={onOpenAdminModal}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-purple-500/40 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 flex items-center gap-1"
            >
              <Activity className="w-3.5 h-3.5" />
              Ingestion
            </button>
          )}

          <button
            onClick={onOpenAuth}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-white/10 bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 shadow-sm"
          >
            <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
            {user ? user.displayName.split(" ")[0] : "Sign In"}
          </button>
        </div>
      </div>
    </header>
  );
};
