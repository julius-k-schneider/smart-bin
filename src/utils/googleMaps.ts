import type { GeneratedRoute, GoogleMapsRoutePart, RouteStop } from "../types";

export const MAX_GOOGLE_MAPS_WAYPOINTS = 8;

const formatCoordinates = (stop: RouteStop) => `${stop.lat},${stop.lng}`;

const createDirectionsUrl = (origin: RouteStop, destination: RouteStop, waypoints: RouteStop[]) => {
  const waypointCoordinates = waypoints.map(formatCoordinates).join("|");
  const waypointParameter = waypointCoordinates
    ? `&waypoints=${encodeURIComponent(waypointCoordinates)}`
    : "";

  return "https://www.google.com/maps/dir/?api=1"
    + `&origin=${encodeURIComponent(formatCoordinates(origin))}`
    + `&destination=${encodeURIComponent(formatCoordinates(destination))}`
    + waypointParameter
    + "&travelmode=driving";
};

export const createGoogleMapsRouteParts = (route: GeneratedRoute | null): GoogleMapsRoutePart[] => {
  if (!route || route.stops.length < 2) return [];

  const startPoint = route.stops[0];
  const binStops = route.stops.filter((stop) => stop.type === "bin");
  if (binStops.length === 0) return [];

  const chunks: RouteStop[][] = [];
  for (let index = 0; index < binStops.length; index += MAX_GOOGLE_MAPS_WAYPOINTS) {
    chunks.push(binStops.slice(index, index + MAX_GOOGLE_MAPS_WAYPOINTS));
  }

  return chunks.map((chunk, index) => {
    const origin = index === 0 ? startPoint : binStops[index * MAX_GOOGLE_MAPS_WAYPOINTS - 1];
    const isFinalPart = index === chunks.length - 1;
    const destination = isFinalPart ? startPoint : chunk[chunk.length - 1];
    const waypoints = isFinalPart ? chunk : chunk.slice(0, -1);

    return {
      label: chunks.length === 1
        ? "Open route in Google Maps"
        : `Open route part ${index + 1} in Google Maps`,
      url: createDirectionsUrl(origin, destination, waypoints),
      stopCount: chunk.length,
      startLabel: origin.label,
      endLabel: destination.label,
    };
  });
};
