import type { GeneratedRoute } from "../types";

type RouteStopListProps = {
  route: GeneratedRoute | null;
  isLoading?: boolean;
};

export const RouteStopList = ({ route, isLoading = false }: RouteStopListProps) => {
  if (!route) {
    return (
      <div className="status-card muted-card">
        <h2>Collection Route</h2>
        <p>{isLoading ? "Generating route..." : "No route generated yet."}</p>
      </div>
    );
  }

  const collectionStops = route.stops.filter((stop) => stop.type === "bin").length;

  return (
    <div className="status-card route-card">
      <h2>Collection Route</h2>
      <p className="route-metric">
        <strong>{collectionStops} stops</strong>
        <span>{route.totalDistanceKm} km estimated</span>
      </p>

      {collectionStops === 0 ? (
        <p className="note">No bins require collection for this threshold.</p>
      ) : (
        <ol className="route-list">
          {route.stops.map((stop, index) => (
            <li key={`${stop.type}-${stop.bin_id ?? "depot"}-${index}`}>
              <span className="route-stop-title">
                {stop.type === "depot" ? "Depot" : `Stop ${index}`}: {stop.label}
              </span>
              {stop.reason && <span className="route-reason">Reason: {stop.reason}</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
