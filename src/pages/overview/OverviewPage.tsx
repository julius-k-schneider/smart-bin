import type { CityBinSnapshotFrame, ConnectionStatus } from "../../types";
import { COLOGNE_CENTER } from "../../config/cologneBins";
import { CityMap } from "../../components/CityMap";
import { CitySummaryCards } from "../../components/CitySummaryCards";
import { OperationalAlerts } from "../../components/OperationalAlerts";

type OverviewPageProps = {
  data: CityBinSnapshotFrame | null;
  status: ConnectionStatus;
  threshold: number;
};

export const OverviewPage = ({ data, status, threshold }: OverviewPageProps) => (
  <div className="page-stack">
    <section className="page-intro">
      <div>
        <h2>City overview</h2>
        <p>Current capacity, collection demand and live operational status across Cologne.</p>
      </div>
    </section>

    <CitySummaryCards data={data} status={status} threshold={threshold} />

    <section className="overview-grid">
      <div>
        <div className="section-heading">
          <div>
            <h2>Live bin map</h2>
            <p>All registered locations and their current status.</p>
          </div>
        </div>
        {data ? (
          <CityMap center={COLOGNE_CENTER} bins={data.bins} threshold={threshold} route={null} />
        ) : (
          <div className="map-placeholder">Connecting to city data stream...</div>
        )}
      </div>
      <OperationalAlerts data={data} threshold={threshold} />
    </section>
  </div>
);
