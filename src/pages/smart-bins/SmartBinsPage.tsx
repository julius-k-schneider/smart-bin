import { useEffect, useState } from "react";
import { addBin, deleteBin } from "../../api";
import { BinDetail } from "../../components/BinDetail";
import { BinForm } from "../../components/BinForm";
import { BinTable } from "../../components/BinTable";
import { CityMap } from "../../components/CityMap";
import { COLOGNE_CENTER } from "../../config/cologneBins";
import type { CityBinSnapshotFrame, CreateBinInput, SmartBinLocation } from "../../types";

type SmartBinsPageProps = {
  data: CityBinSnapshotFrame | null;
  threshold: number;
  mapDefaultOpen: boolean;
};

export const SmartBinsPage = ({ data, threshold, mapDefaultOpen }: SmartBinsPageProps) => {
  const [showBinForm, setShowBinForm] = useState(false);
  const [showMap, setShowMap] = useState(mapDefaultOpen);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const selectedBin = data?.bins.find((bin) => bin.bin_id === selectedBinId) ?? null;

  useEffect(() => {
    if (selectedBinId && data && !selectedBin) setSelectedBinId(null);
  }, [data, selectedBin, selectedBinId]);

  const handleAddBin = async (input: CreateBinInput) => {
    await addBin(input);
    setShowBinForm(false);
  };

  const handleDeleteBin = async (bin: SmartBinLocation) => {
    if (!window.confirm(`Delete ${bin.label} (${bin.bin_id})?`)) return;
    setActionError("");
    try {
      await deleteBin(bin.bin_id);
      setSelectedBinId(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The bin could not be deleted.");
    }
  };

  if (selectedBin) {
    return <BinDetail bin={selectedBin} onBack={() => setSelectedBinId(null)} onDelete={handleDeleteBin} actionError={actionError} />;
  }

  return (
    <div className="page-stack">
      <section className="page-intro page-intro-actions">
        <div>
          <h2>Smart bin management</h2>
          <p>Review locations, inspect individual bins and maintain the registered fleet.</p>
        </div>
        <button className="button-primary" onClick={() => setShowBinForm((current) => !current)}>
          {showBinForm ? "Close form" : "Add smart bin"}
        </button>
      </section>

      {showBinForm && (
        <section className="status-card management-card">
          <div>
            <h2>Add a smart bin</h2>
            <p>Enter its details and select the location by map, address or coordinates.</p>
          </div>
          <BinForm onSubmit={handleAddBin} onCancel={() => setShowBinForm(false)} />
        </section>
      )}

      {actionError && <div className="alert-message alert-critical">{actionError}</div>}

      <section className="page-section">
        <div className="section-heading">
          <div>
            <h2>Bin map</h2>
            <p>{data?.bins.length ?? 0} registered locations</p>
          </div>
          <button className="button-secondary" onClick={() => setShowMap((current) => !current)} aria-expanded={showMap}>
            {showMap ? "Hide map" : "Show map"}
          </button>
        </div>
        {showMap && (
          data ? <CityMap center={COLOGNE_CENTER} bins={data.bins} threshold={threshold} route={null} />
            : <div className="map-placeholder">Connecting to city data stream...</div>
        )}
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div>
            <h2>All smart bins</h2>
            <p>Click a row for detailed sensor data or a column heading to sort.</p>
          </div>
        </div>
        <div className="status-card table-card">
          <BinTable
            bins={data?.bins ?? []}
            threshold={threshold}
            route={null}
            onSelectBin={(binId) => { setActionError(""); setSelectedBinId(binId); }}
            onDeleteBin={handleDeleteBin}
          />
        </div>
      </section>
    </div>
  );
};
