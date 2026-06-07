import type {
  SmartBinLocation,
  Coordinate,
  RouteStop,
  GeneratedRoute,
  WasteCompartmentKey,
} from "../types";
import { haversineDistanceKm, findNearest } from "./geo";

/**
 * Get a human-readable reason for including a bin in the route.
 * Lists all compartments above the threshold.
 */
function getInclusionReason(
  bin: SmartBinLocation,
  threshold: number
): string {
  const reasons: string[] = [];
  const compartmentLabels: Record<WasteCompartmentKey, string> = {
    trash: "Trash",
    recycling: "Recycling",
    compost: "Compost",
  };

  for (const key of ["trash", "recycling", "compost"] as WasteCompartmentKey[]) {
    const compartment = bin.compartments[key];
    if (compartment.fill_level_percent >= threshold) {
      reasons.push(
        `${compartmentLabels[key]} ${Math.round(compartment.fill_level_percent)}%`
      );
    }
  }

  return reasons.join(", ");
}

/**
 * Generate an optimized collection route using nearest-neighbor heuristic.
 * Includes all bins where at least one compartment fill level >= threshold.
 */
export function generateNearestNeighborRoute(
  depot: Coordinate & { label: string },
  allBins: SmartBinLocation[],
  threshold: number
): GeneratedRoute {
  // Filter bins that need collection
  const binsForCollection = allBins.filter((bin) =>
    Object.values(bin.compartments).some(
      (compartment) => compartment.fill_level_percent >= threshold
    )
  );

  if (binsForCollection.length === 0) {
    // Return just the depot
    return {
      stops: [
        {
          type: "depot",
          label: depot.label,
          lat: depot.lat,
          lng: depot.lng,
        },
      ],
      totalDistanceKm: 0,
    };
  }

  const stops: RouteStop[] = [];
  let totalDistance = 0;
  let current: Coordinate = depot;

  // Add depot as first stop
  stops.push({
    type: "depot",
    label: depot.label,
    lat: depot.lat,
    lng: depot.lng,
  });

  const visited = new Set<number>();

  // Nearest-neighbor loop
  while (visited.size < binsForCollection.length) {
    const nearest = findNearest(current, binsForCollection, visited);
    if (!nearest) break;

    visited.add(nearest.index);
    const bin = binsForCollection[nearest.index];
    const reason = getInclusionReason(bin, threshold);

    stops.push({
      type: "bin",
      label: bin.label,
      lat: bin.lat,
      lng: bin.lng,
      bin_id: bin.bin_id,
      reason,
    });

    totalDistance += nearest.distance;
    current = { lat: bin.lat, lng: bin.lng };
  }

  // Return to depot
  const returnDistance = haversineDistanceKm(current, depot);
  totalDistance += returnDistance;

  stops.push({
    type: "depot",
    label: `${depot.label} (Return)`,
    lat: depot.lat,
    lng: depot.lng,
  });

  return {
    stops,
    totalDistanceKm: Math.round(totalDistance * 100) / 100,
  };
}
