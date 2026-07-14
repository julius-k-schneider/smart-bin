import { useMemo, useState } from "react";
import type { GeneratedRoute, SmartBinLocation } from "../../types";
import { getMaxFillLevel, getOverallStatus } from "../../utils/fillLevel";

type BinTableProps = {
  bins: SmartBinLocation[];
  threshold: number;
  route: GeneratedRoute | null;
  onSelectBin: (binId: string) => void;
  onDeleteBin: (bin: SmartBinLocation) => void;
};

type SortKey = "bin_id" | "label" | "district" | "trash" | "recycling" | "compost" | "max" | "status" | "route";
type SortDirection = "asc" | "desc";

const statusLabel = { normal: "Normal", almost_full: "Almost full", full: "Full" };
const statusOrder = { normal: 0, almost_full: 1, full: 2 };

export const BinTable = ({ bins, threshold, route, onSelectBin, onDeleteBin }: BinTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("max");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const routeBinIds = useMemo(
    () => new Set(route?.stops.flatMap((stop) => (stop.bin_id ? [stop.bin_id] : []))),
    [route],
  );

  const sortedBins = useMemo(() => [...bins].sort((a, b) => {
    const getValue = (bin: SmartBinLocation): string | number => {
      if (sortKey === "trash" || sortKey === "recycling" || sortKey === "compost") {
        return bin.compartments[sortKey].fill_level_percent;
      }
      if (sortKey === "max") return getMaxFillLevel(bin);
      if (sortKey === "status") return statusOrder[getOverallStatus(bin)];
      if (sortKey === "route") return routeBinIds.has(bin.bin_id) ? 1 : 0;
      return bin[sortKey];
    };
    const aValue = getValue(a);
    const bValue = getValue(b);
    const result = typeof aValue === "number" && typeof bValue === "number"
      ? aValue - bValue
      : String(aValue).localeCompare(String(bValue), undefined, { numeric: true, sensitivity: "base" });
    return sortDirection === "asc" ? result : -result;
  }), [bins, routeBinIds, sortDirection, sortKey]);

  const changeSort = (key: SortKey) => {
    if (key === sortKey) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const header = (label: string, key: SortKey) => (
    <button className="sort-button" onClick={() => changeSort(key)}>
      {label}<span aria-hidden="true">{sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : " ↕"}</span>
    </button>
  );

  return (
    <div className="table-scroll">
      <table className="bin-table">
        <thead>
          <tr>
            <th>{header("Bin ID", "bin_id")}</th>
            <th>{header("Location", "label")}</th>
            <th>{header("District", "district")}</th>
            <th>{header("Trash %", "trash")}</th>
            <th>{header("Recycling %", "recycling")}</th>
            <th>{header("Compost %", "compost")}</th>
            <th>{header("Max %", "max")}</th>
            <th>{header("Status", "status")}</th>
            <th>{header("In Route", "route")}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedBins.map((bin) => {
            const status = getOverallStatus(bin);
            const maxFill = getMaxFillLevel(bin);
            const trash = Math.round(bin.compartments.trash.fill_level_percent);
            const recycling = Math.round(bin.compartments.recycling.fill_level_percent);
            const compost = Math.round(bin.compartments.compost.fill_level_percent);

            return (
              <tr
                key={bin.bin_id}
                className={`clickable-row ${maxFill >= threshold ? "row-attention" : ""}`}
                tabIndex={0}
                onClick={() => onSelectBin(bin.bin_id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelectBin(bin.bin_id);
                }}
              >
                <td>{bin.bin_id}</td>
                <td>{bin.label}</td>
                <td>{bin.district}</td>
                <td className={trash >= threshold ? "cell-warning" : undefined}>{trash}%</td>
                <td className={recycling >= threshold ? "cell-warning" : undefined}>{recycling}%</td>
                <td className={compost >= threshold ? "cell-warning" : undefined}>{compost}%</td>
                <td className={`status-text status-${status}`}>{Math.round(maxFill)}%</td>
                <td><span className={`status-pill badge-${status}`}>{statusLabel[status]}</span></td>
                <td>{routeBinIds.has(bin.bin_id) ? "Yes" : "No"}</td>
                <td>
                  <button
                    className="table-delete-button"
                    onClick={(event) => { event.stopPropagation(); onDeleteBin(bin); }}
                    aria-label={`Delete ${bin.label}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
          {sortedBins.length === 0 && <tr><td colSpan={10} className="empty-table">No smart bins have been added.</td></tr>}
        </tbody>
      </table>
    </div>
  );
};
