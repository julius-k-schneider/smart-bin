import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Coordinate, GeneratedRoute, SmartBinLocation } from "../types";
import { getMaxFillLevel, getOverallStatus } from "../utils/fillLevel";

const statusColors = {
  normal: "#10b981",
  almost_full: "#f59e0b",
  full: "#ef4444",
};

const createBinIcon = (status: keyof typeof statusColors, stopNumber?: number) =>
  L.divIcon({
    html: `<div class="map-marker ${stopNumber ? "map-marker-route" : ""}" style="background:${statusColors[status]}">${stopNumber ?? "B"}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
    className: "bin-marker",
  });

const depotIcon = L.divIcon({
  html: `<div class="map-marker map-marker-depot">D</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  popupAnchor: [0, -18],
  className: "depot-marker",
});

type CityMapProps = {
  center: Coordinate;
  bins: SmartBinLocation[];
  threshold: number;
  route: GeneratedRoute | null;
};

const RouteViewport = ({ center, route }: { center: Coordinate; route: GeneratedRoute | null }) => {
  const map = useMap();
  useEffect(() => {
    if (route && route.stops.length > 1) {
      map.fitBounds(route.stops.map((stop) => [stop.lat, stop.lng] as [number, number]), {
        padding: [35, 35],
        maxZoom: 14,
      });
    } else {
      map.setView([center.lat, center.lng], 12);
    }
  }, [center.lat, center.lng, map, route]);
  return null;
};

export const CityMap = ({ center, bins, threshold, route }: CityMapProps) => {
  const routeStopNumbers = new Map(
    route?.stops
      .filter((stop) => stop.type === "bin" && stop.bin_id)
      .map((stop, index) => [stop.bin_id as string, index + 1]) ?? []
  );

  return (
    <div className="map-shell">
      <MapContainer center={[center.lat, center.lng]} zoom={12} className="city-map">
        <RouteViewport center={center} route={route} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {bins.map((bin) => {
          const status = getOverallStatus(bin);
          const stopNumber = routeStopNumbers.get(bin.bin_id);
          const inRoute = stopNumber !== undefined;

          return (
            <Marker
              key={bin.bin_id}
              position={[bin.lat, bin.lng]}
              icon={createBinIcon(status, stopNumber)}
              opacity={inRoute || !route ? 1 : 0.55}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{bin.label}</strong>
                  {bin.district && <span>{bin.district}</span>}
                  <dl>
                    <div>
                      <dt>Trash</dt>
                      <dd>{Math.round(bin.compartments.trash.fill_level_percent)}%</dd>
                    </div>
                    <div>
                      <dt>Recycling</dt>
                      <dd>{Math.round(bin.compartments.recycling.fill_level_percent)}%</dd>
                    </div>
                    <div>
                      <dt>Compost</dt>
                      <dd>{Math.round(bin.compartments.compost.fill_level_percent)}%</dd>
                    </div>
                  </dl>
                  <p>
                    Max {Math.round(getMaxFillLevel(bin))}% | Status {status.replace("_", " ")}
                  </p>
                  {getMaxFillLevel(bin) >= threshold && <p className="route-note">Included by threshold</p>}
                  {inRoute && <p className="route-note">In collection route</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {route && route.stops.length > 0 && (
          <Marker position={[route.stops[0].lat, route.stops[0].lng]} icon={depotIcon}>
            <Popup>
              <strong>{route.stops[0].label}</strong>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
