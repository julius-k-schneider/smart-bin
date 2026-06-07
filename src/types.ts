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
  district?: string;
  lat: number;
  lng: number;
  compartments: Record<WasteCompartmentKey, CompartmentData>;
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
