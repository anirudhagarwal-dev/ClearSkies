import React, { useEffect, useState } from "react";
import { api } from "./api/client";
import {
  LocationItem,
  CurrentAirQuality,
  VerdictData,
  HistoryPoint,
  HotspotItem,
  UserProfile,
  AlertRule,
  InAppNotification,
  IngestionRunItem,
  AudienceType
} from "./types";
import { Navbar } from "./components/Navbar";
import { VerdictCard } from "./components/VerdictCard";
import { PollutantGrid } from "./components/PollutantGrid";
import { HistoryChart } from "./components/HistoryChart";
import { StationMap } from "./components/StationMap";
import { HotspotsPanel } from "./components/HotspotsPanel";
import { AlertsPanel } from "./components/AlertsPanel";
import { SchoolProtocolModal } from "./components/SchoolProtocolModal";
import { AuthModal } from "./components/AuthModal";
import { AdminModal } from "./components/AdminModal";
import { AirGlobe3D } from "./components/AirGlobe3D";
import { Search, MapPin, RefreshCw, Sparkles, Flame, ShieldAlert, Activity } from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [audience, setAudience] = useState<AudienceType>("CHILDREN_SCHOOL");

  // Telemetry states
  const [currentAir, setCurrentAir] = useState<CurrentAirQuality | null>(null);
  const [verdictData, setVerdictData] = useState<VerdictData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);

  // User & alerts
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [ingestionRuns, setIngestionRuns] = useState<IngestionRunItem[]>([]);

  // Modals
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial Load
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const locs = await api.searchLocations("Delhi");
        setLocations(locs);
        if (locs.length > 0) {
          setSelectedLocation(locs[0]);
        }

        const hots = await api.getHotspots("Delhi", 10);
        setHotspots(hots.hotspots || []);
        // Only load notifications if user is logged in
        if (api.getToken()) {
          const notifs = await api.getNotifications();
          setNotifications(notifs || []);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch telemetry whenever selected location or audience changes
  useEffect(() => {
    if (!selectedLocation) return;

    async function loadLocationData() {
      try {
        const [air, verdict, hist] = await Promise.all([
          api.getCurrentAirQuality(selectedLocation?.id),
          api.getVerdict(selectedLocation?.id || 1, audience),
          api.getHistory(selectedLocation?.id || 1, 24),
        ]);
        setCurrentAir(air);
        setVerdictData(verdict);
        setHistory(hist.history || []);
      } catch (err) {
        console.error("Error loading location details:", err);
      }
    }

    loadLocationData();
  }, [selectedLocation, audience]);

  // Handle Search Input
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const results = await api.searchLocations(searchQuery);
      if (results.length > 0) {
        setLocations(results);
        setSelectedLocation(results[0]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  // Station Click on Map / Hotspots
  const handleSelectStation = (stationId: number) => {
    const matchedLoc = locations.find((l) => l.id === stationId);
    if (matchedLoc) {
      setSelectedLocation(matchedLoc);
      setActiveTab("dashboard");
    }
  };

  // Auth actions
  const handleLogin = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    const notifs = await api.getNotifications();
    setNotifications(notifs || []);
    const r = await api.getAlertRules();
    setRules(r || []);
  };

  const handleRegister = async (email: string, pass: string, name: string) => {
    const res = await api.register(email, pass, name);
    setUser({ id: res.userId, email: res.email, displayName: res.displayName, role: res.role });
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setRules([]);
  };

  // Alert Rule actions
  const handleCreateRule = async (locationId: number, aud: AudienceType, verdict: string) => {
    await api.createAlertRule(locationId, aud, verdict);
    const updated = await api.getAlertRules();
    setRules(updated || []);
  };

  const handleDeleteRule = async (ruleId: number) => {
    await api.deleteAlertRule(ruleId);
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const handleMarkRead = async (notifId: number) => {
    await api.markNotificationRead(notifId);
    setNotifications(
      notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const handleTriggerIngestion = async () => {
    await api.triggerIngestion();
    const runs = await api.getIngestionRuns();
    setIngestionRuns(runs || []);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSchoolModal={() => setIsSchoolModalOpen(true)}
        onOpenAdminModal={() => {
          setIsAdminModalOpen(true);
          api.getIngestionRuns().then((runs) => setIngestionRuns(runs || []));
        }}
        unreadCount={unreadCount}
        demoMode={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search & Location Bar */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 glass-panel p-4 border border-white/10">
          <form onSubmit={handleSearch} className="flex-1 flex items-center relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian city or station (e.g. Anand Vihar, Delhi, Noida, Gurugram)..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Quick Location Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
            <span className="text-slate-500 text-[11px] shrink-0 font-semibold uppercase tracking-wider">Quick:</span>
            {locations.slice(0, 5).map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-all border ${
                  selectedLocation?.id === loc.id
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm"
                    : "bg-slate-900/60 text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                {loc.name.split(",")[0]}
              </button>
            ))}
          </div>
        </section>

        {/* Tab 1: Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Hero Grid: Main Verdict & 3D Interactive Model */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              <div className="lg:col-span-2 flex flex-col">
                {verdictData ? (
                  <VerdictCard
                    data={verdictData}
                    audience={audience}
                    setAudience={setAudience}
                    onOpenSchoolModal={() => setIsSchoolModalOpen(true)}
                  />
                ) : (
                  <div className="glass-panel p-12 text-center text-slate-400">Loading verdict telemetry...</div>
                )}
              </div>

              {/* 3D Atmospheric Particles Globe Model */}
              <div className="lg:col-span-1 flex flex-col">
                {verdictData ? (
                  <AirGlobe3D
                    aqiValue={verdictData.aqiValue}
                    aqiCategory={verdictData.aqiCategory}
                    stationName={verdictData.stationName}
                    dominantPollutant={verdictData.dominantPollutant}
                  />
                ) : (
                  <div className="glass-panel h-[340px] p-6 text-center text-slate-400 flex items-center justify-center">
                    Initializing 3D globe...
                  </div>
                )}
              </div>
            </div>

            {/* Pollutant Breakdown Grid */}
            {currentAir && (
              <PollutantGrid
                pollutants={currentAir.pollutants}
                dominantPollutant={currentAir.dominantPollutant}
              />
            )}

            {/* History Trends & Regional Hotspots Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HistoryChart history={history} />
              <HotspotsPanel
                hotspots={hotspots}
                selectedStationId={selectedLocation?.id}
                onSelectStation={handleSelectStation}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Map & Hotspots View */}
        {activeTab === "hotspots" && (
          <div className="space-y-6">
            <StationMap
              hotspots={hotspots}
              selectedStationId={selectedLocation?.id}
              onSelectStation={handleSelectStation}
            />
            <HotspotsPanel
              hotspots={hotspots}
              selectedStationId={selectedLocation?.id}
              onSelectStation={handleSelectStation}
            />
          </div>
        )}

        {/* Tab 3: Alerts View */}
        {activeTab === "alerts" && (
          <AlertsPanel
            rules={rules}
            notifications={notifications}
            locations={locations}
            onCreateRule={handleCreateRule}
            onDeleteRule={handleDeleteRule}
            onMarkRead={handleMarkRead}
          />
        )}
      </main>

      {/* Modals */}
      {verdictData && (
        <SchoolProtocolModal
          isOpen={isSchoolModalOpen}
          onClose={() => setIsSchoolModalOpen(false)}
          verdictData={verdictData}
        />
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        runs={ingestionRuns}
        onTriggerIngestion={handleTriggerIngestion}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            AirTrack • Built for Bharat Builds Tour Environmental Hacks (WeMakeDevs x AWS) • Official CPCB NAQI Standards
          </p>
          <p className="font-mono text-[11px] text-slate-600">
            Deployed on AWS • Ground Truth Telemetry Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
export default App;
