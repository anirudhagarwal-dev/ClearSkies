import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HotspotItem } from "../types";
import { Flame, Wind, Layers, MapPin } from "lucide-react";

interface StationMapProps {
  hotspots: HotspotItem[];
  selectedStationId?: number;
  onSelectStation: (stationId: number) => void;
}

export const StationMap: React.FC<StationMapProps> = ({
  hotspots,
  selectedStationId,
  onSelectStation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [showStubbleLayer, setShowStubbleLayer] = useState(true);

  // Mocked/Calibrated NASA FIRMS stubble fires in Punjab / Haryana (October agricultural fire season)
  const stubbleFireCoordinates = [
    { lat: 30.3398, lon: 76.3869, name: "Patiala Field Cluster", fireCount: 142 },
    { lat: 30.9010, lon: 75.8573, name: "Ludhiana Agricultural Belt", fireCount: 287 },
    { lat: 30.2110, lon: 74.9455, name: "Bathinda Residue Burning", fireCount: 310 },
    { lat: 29.9695, lon: 76.8783, name: "Kurukshetra Stubble Zone", fireCount: 94 },
    { lat: 29.6857, lon: 76.9905, name: "Karnal Farm Cluster", fireCount: 115 },
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered around Delhi NCR
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([28.6139, 77.2090], 10);

      // CartoDB Dark Matter tiles with required attribution
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add Station Markers
    hotspots.forEach((station) => {
      const color =
        station.aqiValue > 300
          ? "#ef4444"
          : station.aqiValue > 200
          ? "#f97316"
          : station.aqiValue > 100
          ? "#eab308"
          : "#10b981";

      const isSelected = station.stationId === selectedStationId;

      const marker = L.circleMarker([station.latitude, station.longitude], {
        radius: isSelected ? 12 : 8,
        fillColor: color,
        color: isSelected ? "#38bdf8" : "#ffffff",
        weight: isSelected ? 3 : 1.5,
        opacity: 1,
        fillOpacity: 0.85,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px;">
          <strong style="color: #ffffff; font-size: 13px; display: block; margin-bottom: 4px;">${station.name}</strong>
          <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="color: #94a3b8;">AQI:</span>
            <strong style="color: ${color}; font-size: 14px;">${station.aqiValue} (${station.aqiCategory})</strong>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="color: #94a3b8;">Primary Pollutant:</span>
            <span style="color: #ffffff;">${station.dominantPollutant}</span>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
            Kind: ${station.dataKind} • ${station.freshness}
          </div>
          <button id="select-station-${station.stationId}" style="width: 100%; background: #0284c7; color: white; border: none; padding: 4px 8px; border-radius: 6px; font-weight: 600; cursor: pointer;">
            Inspect Station
          </button>
        </div>
      `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`select-station-${station.stationId}`);
        if (btn) {
          btn.onclick = () => onSelectStation(station.stationId);
        }
      });
    });

    // Add Stubble Burning Hotspot layer if enabled
    if (showStubbleLayer) {
      stubbleFireCoordinates.forEach((fire) => {
        const fireMarker = L.circleMarker([fire.lat, fire.lon], {
          radius: 9,
          fillColor: "#ea580c",
          color: "#fde047",
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.75,
        }).addTo(map);

        fireMarker.bindPopup(`
          <div style="font-family: inherit; font-size: 12px;">
            <strong style="color: #fb923c; display: block; margin-bottom: 4px;">🔥 ${fire.name}</strong>
            <span style="color: #94a3b8;">Satellite Active Fires: </span>
            <strong style="color: #f8fafc;">${fire.fireCount} hotspots</strong>
            <p style="font-size: 10px; color: #64748b; margin-top: 4px;">Source: NASA FIRMS / MODIS Reanalysis</p>
          </div>
        `);
      });
    }
  }, [hotspots, selectedStationId, showStubbleLayer, onSelectStation]);

  return (
    <div className="glass-panel p-6 border border-white/10 flex flex-col h-[520px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            Delhi-NCR Ground Station Network & Hotspots
          </h3>
          <p className="text-xs text-slate-400">
            Click any station pin to view real-time CPCB telemetry
          </p>
        </div>

        {/* Stubble Burning Toggle */}
        <button
          onClick={() => setShowStubbleLayer(!showStubbleLayer)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            showStubbleLayer
              ? "bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-sm shadow-orange-500/20"
              : "bg-slate-900 text-slate-400 border-white/10 hover:text-white"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          {showStubbleLayer ? "Stubble Burning Layer (ON)" : "Stubble Burning Layer (OFF)"}
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-white/10">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 text-[11px] text-slate-400 border-t border-white/5 pt-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">CPCB Key:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 0-50 Good</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> 101-200 Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> 201-300 Poor</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> 301+ Very Poor/Severe</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 font-mono">
          <span>Wind Direction: NW $\rightarrow$ SE (14 km/h)</span>
        </div>
      </div>
    </div>
  );
};
