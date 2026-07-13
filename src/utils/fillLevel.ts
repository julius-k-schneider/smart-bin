import type { SmartBinLocation, BinStatus, DerivedBinData, WasteCompartmentKey } from "../types";

export function getMaxFillLevel(bin: SmartBinLocation): number {
  const levels = [
    bin.compartments.trash.fill_level_percent,
    bin.compartments.recycling.fill_level_percent,
    bin.compartments.compost.fill_level_percent,
  ];
  return Math.max(...levels);
}

export function getOverallStatus(bin: SmartBinLocation): BinStatus {
  const maxFill = getMaxFillLevel(bin);
  if (maxFill >= 90) return "full";
  if (maxFill >= 75) return "almost_full";
  return "normal";
}

export function getCriticalCompartments(
  bin: SmartBinLocation,
  threshold: number
): Array<{ key: WasteCompartmentKey; level: number }> {
  const critical: Array<{ key: WasteCompartmentKey; level: number }> = [];

  for (const key of ["trash", "recycling", "compost"] as WasteCompartmentKey[]) {
    const level = bin.compartments[key].fill_level_percent;
    if (level >= threshold) {
      critical.push({ key, level });
    }
  }

  return critical;
}

export function needsCollection(
  bin: SmartBinLocation,
  threshold: number
): boolean {
  return getCriticalCompartments(bin, threshold).length > 0;
}

export function getDerivedBinData(
  bin: SmartBinLocation,
  threshold: number
): DerivedBinData {
  return {
    bin_id: bin.bin_id,
    maxFillLevel: getMaxFillLevel(bin),
    overallStatus: getOverallStatus(bin),
    needsCollection: needsCollection(bin, threshold),
    criticalCompartments: getCriticalCompartments(bin, threshold),
  };
}
