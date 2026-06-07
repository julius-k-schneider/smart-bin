export type ConnectionStatus = "idle" | "connecting" | "open" | "closed" | "error";

export type BinCompartmentStatus = "empty" | "normal" | "almost_full" | "full";

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
