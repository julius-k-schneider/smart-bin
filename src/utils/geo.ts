import type { Coordinate } from "../types";

/**
 * Calculate distance in kilometers between two coordinates using Haversine formula.
 */
export function haversineDistanceKm(a: Coordinate, b: Coordinate): number {
  const R = 6371; // Earth's radius in kilometers
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const deltaLat = ((b.lat - a.lat) * Math.PI) / 180;
  const deltaLng = ((b.lng - a.lng) * Math.PI) / 180;

  const sinLatDelta = Math.sin(deltaLat / 2);
  const sinLngDelta = Math.sin(deltaLng / 2);

  const a_calc =
    sinLatDelta * sinLatDelta +
    Math.cos(lat1) * Math.cos(lat2) * sinLngDelta * sinLngDelta;

  const c = 2 * Math.asin(Math.sqrt(a_calc));
  return R * c;
}

/**
 * Find the nearest unvisited coordinate from a current position.
 */
export function findNearest(
  current: Coordinate,
  candidates: Coordinate[],
  visited: Set<number>
): { index: number; distance: number } | null {
  let nearest: { index: number; distance: number } | null = null;

  for (let i = 0; i < candidates.length; i++) {
    if (visited.has(i)) continue;
    const dist = haversineDistanceKm(current, candidates[i]);
    if (!nearest || dist < nearest.distance) {
      nearest = { index: i, distance: dist };
    }
  }

  return nearest;
}

/**
 * Generate a polyline for display on the map.
 * Returns coordinates in the format expected by Leaflet/react-leaflet.
 */
export function generateRoutePolyline(
  stops: Array<{ lat: number; lng: number }>
): [number, number][] {
  return stops.map((stop) => [stop.lat, stop.lng]);
}
