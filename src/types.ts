export type ConnectionStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type BinCompartmentStatus = "empty" | "normal" | "almost_full" | "full";
export type CompartmentStatus = "empty" | "normal" | "almost_full" | "full";

export type BinFillFrame = {
  device_id: string;
  timestamp_ms: number;
  compartments: {
    trash: {
      fill_level_percent: number;
      distance_cm?: number;
      status: BinCompartmentStatus;
    };
    recycling: {
      fill_level_percent: number;
      distance_cm?: number;
      status: BinCompartmentStatus;
    };
    compost: {
      fill_level_percent: number;
      distance_cm?: number;
      status: BinCompartmentStatus;
    };
  };
};

export type WasteCompartmentKey = "trash" | "recycling" | "compost";

export type CompartmentData = {
  fill_level_percent: number;
  distance_cm?: number;
  status: CompartmentStatus;
};

export type SmartBinLocation = {
  bin_id: string;
  label: string;
  district: string;
  lat: number;
  lng: number;
  created_at?: number;
  updated_at?: number;
  compartments: Record<WasteCompartmentKey, CompartmentData>;
};

export type CreateBinInput = {
  bin_id: string;
  label: string;
  district: string;
  lat: number;
  lng: number;
  trash_fill: number;
  recycling_fill: number;
  compost_fill: number;
};

export type BinMeasurement = {
  timestamp_ms: number;
  trash_fill: number;
  recycling_fill: number;
  compost_fill: number;
};

export type SmartBinDetails = SmartBinLocation & {
  history: BinMeasurement[];
};

export type CityBinSnapshotFrame = {
  city: string;
  device_group_id: string;
  timestamp_ms: number;
  bins: SmartBinLocation[];
};

export type BinStatus = "normal" | "almost_full" | "full";

export type DerivedBinData = {
  bin_id: string;
  maxFillLevel: number;
  overallStatus: BinStatus;
  needsCollection: boolean;
  criticalCompartments: Array<{ key: WasteCompartmentKey; level: number }>;
};

export type Coordinate = {
  lat: number;
  lng: number;
};

export type SelectedLocation = Coordinate & {
  label?: string;
  address?: string;
};

export type RouteStartPoint = Coordinate & {
  label: string;
};

export type GeocodingResult = {
  place_id: number;
  display_name: string;
  lat: number;
  lng: number;
};

export type RouteStop = {
  type: "depot" | "bin";
  label: string;
  lat: number;
  lng: number;
  bin_id?: string;
  reason?: string;
};

export type GeneratedRoute = {
  stops: RouteStop[];
  totalDistanceKm: number;
};

export type GoogleMapsRoutePart = {
  label: string;
  url: string;
  stopCount: number;
  startLabel: string;
  endLabel: string;
};

export type ServerSettings = {
  simulation_enabled: boolean;
  update_interval_seconds: number;
  device_group_id: string;
};

export type DashboardPreferences = {
  defaultThreshold: number;
  binsMapDefaultOpen: boolean;
};
