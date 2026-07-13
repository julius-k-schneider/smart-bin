export const generateRoutePolyline = (
  stops: Array<{ lat: number; lng: number }>,
): [number, number][] => stops.map((stop) => [stop.lat, stop.lng]);
