import { useEffect, useState } from "react";
import { getBinDetails } from "../api";
import type { BinFillFrame, SmartBinDetails, SmartBinLocation } from "../types";
import { AlertPanel } from "./AlertPanel";
import { CompartmentCard } from "./CompartmentCard";

type BinDetailProps = {
  bin: SmartBinLocation;
  onBack: () => void;
  onDelete: (bin: SmartBinLocation) => Promise<void>;
  actionError: string;
};

const formatDate = (timestamp?: number) => timestamp ? new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "medium",
}).format(new Date(timestamp)) : "-";

export const BinDetail = ({ bin, onBack, onDelete, actionError }: BinDetailProps) => {
  const [details, setDetails] = useState<SmartBinDetails | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    getBinDetails(bin.bin_id)
      .then((result) => active && setDetails(result))
      .catch((requestError) => active && setError(requestError instanceof Error ? requestError.message : "Details could not be loaded."));
    return () => { active = false; };
  }, [bin.bin_id, bin.updated_at]);

  const fillFrame: BinFillFrame = {
    device_id: bin.bin_id,
    timestamp_ms: bin.updated_at ?? Date.now(),
    compartments: bin.compartments,
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(bin);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bin-detail">
      <div className="detail-navigation">
        <button className="button-secondary" onClick={onBack}>Back to dashboard</button>
        <button className="button-danger" disabled={deleting} onClick={handleDelete}>{deleting ? "Deleting..." : "Delete bin"}</button>
      </div>

      <header className="detail-header">
        <div>
          <span className="detail-id">{bin.bin_id}</span>
          <h1>{bin.label}</h1>
          <p>{bin.district}</p>
        </div>
      </header>

      {actionError && <div className="alert-message alert-critical">{actionError}</div>}

      <section className="status-card detail-metadata">
        <div><span>Latitude</span><strong>{bin.lat.toFixed(5)}</strong></div>
        <div><span>Longitude</span><strong>{bin.lng.toFixed(5)}</strong></div>
        <div><span>Created</span><strong>{formatDate(bin.created_at)}</strong></div>
        <div><span>Last measurement</span><strong>{formatDate(bin.updated_at)}</strong></div>
      </section>

      <section className="cards-grid detail-cards">
        <CompartmentCard name="Trash" data={bin.compartments.trash} accent="trash" />
        <CompartmentCard name="Recycling" data={bin.compartments.recycling} accent="recycling" />
        <CompartmentCard name="Compost" data={bin.compartments.compost} accent="compost" />
      </section>

      <AlertPanel latest={fillFrame} />

      <section className="status-card">
        <h2>Recent measurements</h2>
        {error && <p className="form-error">{error}</p>}
        {details && details.history.length > 0 ? (
          <div className="table-scroll">
            <table className="bin-table measurement-table">
              <thead><tr><th>Time</th><th>Trash</th><th>Recycling</th><th>Compost</th></tr></thead>
              <tbody>{details.history.map((measurement) => (
                <tr key={measurement.timestamp_ms}>
                  <td>{formatDate(measurement.timestamp_ms)}</td>
                  <td>{measurement.trash_fill.toFixed(1)}%</td>
                  <td>{measurement.recycling_fill.toFixed(1)}%</td>
                  <td>{measurement.compost_fill.toFixed(1)}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : !error && <p>No stored simulation updates yet.</p>}
      </section>
    </div>
  );
};
