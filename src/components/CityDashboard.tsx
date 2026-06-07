import { useState } from "react";
import type { CityBinSnapshotFrame, ConnectionStatus, GeneratedRoute } from "../types";
import { BinTable } from "./BinTable";
import { CityMap } from "./CityMap";
import { CitySummaryCards } from "./CitySummaryCards";
import { ConnectionStatusBadge } from "./ConnectionStatusBadge";
import { OperationalAlerts } from "./OperationalAlerts";
import { RoutePlannerPanel } from "./RoutePlannerPanel";
import { RouteStopList } from "./RouteStopList";
import { COLOGNE_CENTER, DEPOT } from "../config/cologneBins";
import { generateNearestNeighborRoute } from "../utils/route";

type CityDashboardProps = {
  status: ConnectionStatus;
  data: CityBinSnapshotFrame | null;
  history: CityBinSnapshotFrame[];
};

export const CityDashboard = ({ status, data }: CityDashboardProps) => {
  const [threshold, setThreshold] = useState(80);
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRoute = () => {
    if (!data) return;
    setIsGenerating(true);
    window.setTimeout(() => {
      setRoute(generateNearestNeighborRoute(DEPOT, data.bins, threshold));
      setIsGenerating(false);
    }, 200);
  };

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    setRoute(null);
  };

  return (
    <div className="city-dashboard">
      <header className="city-header">
        <div>
          <h1>Smart Waste Management Dashboard - Cologne</h1>
          <p>Live monitoring and route planning for AI-powered waste sorting bins</p>
        </div>
        <ConnectionStatusBadge status={status} />
      </header>

      <CitySummaryCards data={data} status={status} threshold={threshold} />

      <main className="dashboard-grid">
        <section>
          <h2 className="section-title">Cologne Map</h2>
          {data ? (
            <CityMap center={COLOGNE_CENTER} bins={data.bins} threshold={threshold} route={route} />
          ) : (
            <div className="map-placeholder">Connecting to city data stream...</div>
          )}
        </section>

        <aside className="planner-column">
          <RoutePlannerPanel
            bins={data?.bins ?? []}
            threshold={threshold}
            onThresholdChange={handleThresholdChange}
            onGenerateRoute={handleGenerateRoute}
            onClearRoute={() => setRoute(null)}
            route={route}
            isGenerating={isGenerating}
          />
          <RouteStopList route={route} isLoading={isGenerating} />
        </aside>
      </main>

      <OperationalAlerts data={data} threshold={threshold} />

      {data && (
        <section>
          <h2 className="section-title">Bins Requiring Attention</h2>
          <div className="status-card table-card">
            <BinTable bins={data.bins} threshold={threshold} route={route} />
          </div>
        </section>
      )}
    </div>
  );
};
