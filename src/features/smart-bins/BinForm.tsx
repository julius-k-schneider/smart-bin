import { useState, type FormEvent } from "react";
import type { CreateBinInput, SelectedLocation } from "../../types";
import { LocationPicker } from "../../components/LocationPicker";

type BinFormProps = {
  onSubmit: (bin: CreateBinInput) => Promise<void>;
  onCancel: () => void;
};

const initialValues = {
  bin_id: "",
  label: "",
  district: "",
  trash_fill: "0",
  recycling_fill: "0",
  compost_fill: "0",
};

const parseNumber = (value: string) => Number(value.replace(",", "."));

export const BinForm = ({ onSubmit, onCancel }: BinFormProps) => {
  const [values, setValues] = useState(initialValues);
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const updateValue = (name: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      setError("Select a valid location before adding the bin.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        bin_id: values.bin_id.trim(),
        label: values.label.trim(),
        district: values.district.trim(),
        lat: location.lat,
        lng: location.lng,
        trash_fill: parseNumber(values.trash_fill),
        recycling_fill: parseNumber(values.recycling_fill),
        compost_fill: parseNumber(values.compost_fill),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The bin could not be added.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="bin-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Bin ID
          <input required pattern="[A-Za-z0-9-]{2,30}" value={values.bin_id} onChange={(event) => updateValue("bin_id", event.target.value)} placeholder="CGN-021" />
        </label>
        <label>
          Name
          <input required value={values.label} onChange={(event) => updateValue("label", event.target.value)} placeholder="Location name" />
        </label>
        <label>
          District
          <input required value={values.district} onChange={(event) => updateValue("district", event.target.value)} placeholder="Innenstadt" />
        </label>
        <label>
          Initial trash level (%)
          <input required type="number" min="0" max="100" step="0.1" value={values.trash_fill} onChange={(event) => updateValue("trash_fill", event.target.value)} />
        </label>
        <label>
          Initial recycling level (%)
          <input required type="number" min="0" max="100" step="0.1" value={values.recycling_fill} onChange={(event) => updateValue("recycling_fill", event.target.value)} />
        </label>
        <label>
          Initial compost level (%)
          <input required type="number" min="0" max="100" step="0.1" value={values.compost_fill} onChange={(event) => updateValue("compost_fill", event.target.value)} />
        </label>
      </div>
      <LocationPicker
        label="Bin location"
        value={location}
        onChange={(selectedLocation) => {
          setLocation(selectedLocation);
          if (selectedLocation.address && !values.label.trim()) {
            updateValue("label", selectedLocation.address.split(",")[0]);
          }
        }}
      />
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="button-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button-primary" disabled={saving}>{saving ? "Adding..." : "Add bin"}</button>
      </div>
    </form>
  );
};
