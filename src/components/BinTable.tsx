import type { GeneratedRoute, SmartBinLocation } from "../types";
import { getMaxFillLevel, getOverallStatus } from "../utils/fillLevel";

type BinTableProps = {
  bins: SmartBinLocation[];
  threshold: number;
  route: GeneratedRoute | null;
};

const statusLabel = {
  normal: "Normal",
  almost_full: "Almost full",
  full: "Full",
};

export const BinTable = ({ bins, threshold, route }: BinTableProps) => {
  const routeBinIds = new Set(route?.stops.flatMap((stop) => (stop.bin_id ? [stop.bin_id] : [])));

  const sortedBins = [...bins].sort((a, b) => {
    const aNeedsCollection = Object.values(a.compartments).some((c) => c.fill_level_percent >= threshold);
    const bNeedsCollection = Object.values(b.compartments).some((c) => c.fill_level_percent >= threshold);

    if (aNeedsCollection !== bNeedsCollection) return aNeedsCollection ? -1 : 1;
    return getMaxFillLevel(b) - getMaxFillLevel(a);
  });

  return (
    <div className="table-scroll">
      <table className="bin-table">
        <thead>
          <tr>
            <th>Bin ID</th>
            <th>Location</th>
            <th>District</th>
            <th>Trash %</th>
            <th>Recycling %</th>
            <th>Compost %</th>
            <th>Max %</th>
            <th>Status</th>
            <th>In Route</th>
          </tr>
        </thead>
        <tbody>
          {sortedBins.map((bin) => {
            const status = getOverallStatus(bin);
            const maxFill = getMaxFillLevel(bin);
            const inRoute = routeBinIds.has(bin.bin_id);
            const trash = Math.round(bin.compartments.trash.fill_level_percent);
            const recycling = Math.round(bin.compartments.recycling.fill_level_percent);
            const compost = Math.round(bin.compartments.compost.fill_level_percent);

            return (
              <tr key={bin.bin_id} className={maxFill >= threshold ? "row-attention" : undefined}>
                <td>{bin.bin_id}</td>
                <td>{bin.label}</td>
                <td>{bin.district ?? "-"}</td>
                <td className={trash >= threshold ? "cell-warning" : undefined}>{trash}%</td>
                <td className={recycling >= threshold ? "cell-warning" : undefined}>{recycling}%</td>
                <td className={compost >= threshold ? "cell-warning" : undefined}>{compost}%</td>
                <td className={`status-text status-${status}`}>{Math.round(maxFill)}%</td>
                <td>
                  <span className={`status-pill badge-${status}`}>{statusLabel[status]}</span>
                </td>
                <td>{inRoute ? "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
