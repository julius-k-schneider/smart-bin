import { useState } from "react";
import { createCollectionRoute } from "../../api";
import { CityMap } from "../../components/CityMap";
import { RoutePlannerPanel } from "./RoutePlannerPanel";
import { RouteStopList } from "./RouteStopList";
import { COLOGNE_CENTER, DEFAULT_ROUTE_START } from "../../config/cologneBins";
import type { CityBinSnapshotFrame, GeneratedRoute, RouteStartPoint } from "../../types";

type RoutePlanningPageProps = {
  data: CityBinSnapshotFrame | null;
  defaultThreshold: number;
};

export const RoutePlanningPage = ({ data, defaultThreshold }: RoutePlanningPageProps) => {
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [routeStartPoint, setRouteStartPoint] = useState<RouteStartPoint>({ ...DEFAULT_ROUTE_START });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateRoute = async () => {
    setIsGenerating(true);
    setError("");
    try {
      setRoute(await createCollectionRoute(threshold, routeStartPoint));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The route could not be generated.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateStartPoint = (startPoint: RouteStartPoint) => {
    setRouteStartPoint(startPoint);
    setRoute(null);
  };

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <h2>Collection route planning</h2>
          <p>Select a start point and fill threshold, then generate and export the ordered collection route.</p>
        </div>
      </section>

      {error && <div className="alert-message alert-critical">{error}</div>}

      <section className="route-page-grid">
        <div className="route-map-column">
          <div className="section-heading">
            <div>
              <h2>Planned route</h2>
              <p>{route ? `${route.stops.filter((stop) => stop.type === "bin").length} collection stops` : "Generate a route to display it on the map."}</p>
            </div>
          </div>
          {data ? (
            <CityMap center={COLOGNE_CENTER} bins={data.bins} threshold={threshold} route={route} />
          ) : (
            <div className="map-placeholder">Connecting to city data stream...</div>
          )}
          <RouteStopList route={route} isLoading={isGenerating} />
        </div>
        <aside className="route-control-column">
          <RoutePlannerPanel
            bins={data?.bins ?? []}
            threshold={threshold}
            onThresholdChange={(value) => { setThreshold(value); setRoute(null); }}
            onGenerateRoute={handleGenerateRoute}
            onClearRoute={() => setRoute(null)}
            route={route}
            isGenerating={isGenerating}
            startPoint={routeStartPoint}
            onStartPointChange={updateStartPoint}
            onResetStartPoint={() => updateStartPoint({ ...DEFAULT_ROUTE_START })}
            isDefaultStartPoint={
              routeStartPoint.lat === DEFAULT_ROUTE_START.lat
              && routeStartPoint.lng === DEFAULT_ROUTE_START.lng
              && routeStartPoint.label === DEFAULT_ROUTE_START.label
            }
          />
        </aside>
      </section>
    </div>
  );
};
