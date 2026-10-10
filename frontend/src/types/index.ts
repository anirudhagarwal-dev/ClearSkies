export type AudienceType = "GENERAL" | "CHILDREN_SCHOOL" | "SENSITIVE";
export type VerdictType = "SAFE" | "LIMIT_OUTDOOR" | "AVOID_OUTDOOR" | "STAY_INDOORS";
export type CpcbCategoryType = "GOOD" | "SATISFACTORY" | "MODERATE" | "POOR" | "VERY_POOR" | "SEVERE";
export type DataKindType = "MEASURED" | "MODELED" | "SAMPLE";
export type FreshnessType = "FRESH" | "STALE";

export interface LocationItem {
  id: number;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface PollutantDetail {
  value: number;
  unit: string;
}

export interface CurrentAirQuality {
  stationId: number;
  stationName: string;
  city: string;
  latitude: number;
  longitude: number;
  aqiValue: number;
  aqiScale: string;
  aqiCategory: CpcbCategoryType;
  dominantPollutant: string;
  dataKind: DataKindType;
  freshness: FreshnessType;
  observedAt: string;
  ingestedAt: string;
  source: {
    id: string;
    name: string;
    license: string;
  };
  pollutants: Record<string, PollutantDetail>;
}

export interface VerdictData {
  locationId: number;
  stationId: number;
  stationName: string;
  aqiValue: number;
  aqiScale: string;
  aqiCategory: CpcbCategoryType;
  dominantPollutant: string;
  dataKind: DataKindType;
  freshness: FreshnessType;
  observedAt: string;
  source: string;
  verdict: VerdictType;
  audience: AudienceType;
  ruleFired: string;
  officialHealthStatement: string;
  plainLanguageRecommendation: string;
  disclaimer: string;
  pollutantsUsed: Record<string, number>;
}

export interface HistoryPoint {
  observedAt: string;
  aqi: number;
  category: CpcbCategoryType;
  dominantPollutant: string;
  pm25?: number;
  pm10?: number;
  dataKind: DataKindType;
}

export interface HotspotItem {
  stationId: number;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  aqiValue: number;
  aqiCategory: CpcbCategoryType;
  dominantPollutant: string;
  dataKind: DataKindType;
  observedAt: string;
  freshness: FreshnessType;
}

export interface UserProfile {
  id: number;
  email: string;
  displayName: string;
  role: string;
}

export interface SavedLocation {
  id: number;
  locationId: number;
  label: string;
  audience: AudienceType;
  locationName: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface AlertRule {
  id: number;
  locationId: number;
  locationName: string;
  audience: AudienceType;
  triggerVerdict: VerdictType;
  enabled: boolean;
  cooldownMinutes: number;
  createdAt: string;
}

export interface InAppNotification {
  id: number;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface IngestionRunItem {
  id: number;
  sourceCode: string;
  sourceName: string;
  status: string;
  recordsFetched: number;
  startedAt: string;
  finishedAt: string | null;
  errorSummary: string | null;
}
