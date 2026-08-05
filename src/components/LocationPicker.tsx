import L from "leaflet";
import { useEffect, useId, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { searchLocations } from "../api";
import { COLOGNE_CENTER } from "../config/cologneBins";
import type { GeocodingResult, SelectedLocation } from "../types";
import { MapScrollWheelGuard } from "./MapScrollWheelGuard";

type LocationPickerProps = {
  label: string;
  value: SelectedLocation | null;
  onChange: (location: SelectedLocation) => void;
  defaultSearchArea?: string;
};

const selectedLocationIcon = L.divIcon({
  html: '<div class="location-picker-marker">P</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "location-picker-icon",
});

const parseCoordinate = (value: string) => Number(value.replace(",", "."));

const MapClickHandler = ({ active, onPick }: { active: boolean; onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (event) => {
      if (active) onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
};

const MapViewUpdater = ({ value }: { value: SelectedLocation | null }) => {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], 15);
  }, [map, value]);
  return null;
};

export const LocationPicker = ({
  label,
  value,
  onChange,
  defaultSearchArea = "Cologne, Germany",
}: LocationPickerProps) => {
  const id = useId();
  const [showMap, setShowMap] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [manualLat, setManualLat] = useState(value ? String(value.lat) : "");
  const [manualLng, setManualLng] = useState(value ? String(value.lng) : "");

  useEffect(() => {
    if (!value) return;
    setManualLat(String(value.lat));
    setManualLng(String(value.lng));
  }, [value]);

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      setError("Enter at least three characters for the address search.");
      return;
    }
    setSearching(true);
    setError("");
    setResults([]);
    try {
      const response = await searchLocations(query.trim());
      if (response.results.length === 0) setError("No matching location was found.");
      else setResults(response.results);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "The address search failed.");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result: GeocodingResult) => {
    onChange({
      label: result.display_name,
      address: result.display_name,
      lat: result.lat,
      lng: result.lng,
    });
    setQuery(result.display_name);
    setResults([]);
    setError("");
  };

  const pickOnMap = (lat: number, lng: number) => {
    onChange({ label: "Selected map location", lat, lng });
    setIsPicking(false);
    setError("");
  };

  const applyManualCoordinates = () => {
    const lat = parseCoordinate(manualLat);
    const lng = parseCoordinate(manualLng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setError("Enter valid latitude and longitude values.");
      return;
    }
    onChange({ label: "Manual coordinates", lat, lng });
    setError("");
  };

  return (
    <section className="location-picker" aria-labelledby={`${id}-title`}>
      <div className="location-picker-heading">
        <div>
          <h3 id={`${id}-title`}>{label}</h3>
          {value ? (
            <p>
              <strong>{value.label ?? "Selected location"}</strong>
              <span>{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span>
            </p>
          ) : <p>No location selected.</p>}
        </div>
        <button
          type="button"
          className="button-secondary location-map-button"
          onClick={() => {
            setShowMap(true);
            setIsPicking(true);
          }}
        >
          Pick on map
        </button>
      </div>

      {showMap && (
        <div className="location-map-section">
          <div className="location-pick-instruction">
            <span>{isPicking ? "Click on the map to select a location." : "Selected location preview"}</span>
            <div>
              {isPicking && <button type="button" onClick={() => setIsPicking(false)}>Cancel selection</button>}
              <button type="button" onClick={() => { setShowMap(false); setIsPicking(false); }}>Hide map</button>
            </div>
          </div>
          <MapContainer
            center={[value?.lat ?? COLOGNE_CENTER.lat, value?.lng ?? COLOGNE_CENTER.lng]}
            zoom={value ? 15 : 12}
            scrollWheelZoom={false}
            className={`location-picker-map ${isPicking ? "location-picker-map-active" : ""}`}
          >
            <MapScrollWheelGuard />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <MapClickHandler active={isPicking} onPick={pickOnMap} />
            <MapViewUpdater value={value} />
            {value && <Marker position={[value.lat, value.lng]} icon={selectedLocationIcon} />}
          </MapContainer>
        </div>
      )}

      <div className="location-search">
        <label htmlFor={`${id}-search`}>Search by address</label>
        <div>
          <input
            id={`${id}-search`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSearch();
              }
            }}
            placeholder={`Address or place in ${defaultSearchArea}`}
          />
          <button type="button" className="button-secondary" disabled={searching} onClick={() => void handleSearch()}>
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="location-results">
          <p>Select one of {results.length} matching locations:</p>
          {results.map((result) => (
            <button type="button" key={result.place_id} onClick={() => selectSearchResult(result)}>
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      <details className="manual-location">
        <summary>Enter coordinates manually</summary>
        <div>
          <label>
            Latitude
            <input inputMode="decimal" value={manualLat} onChange={(event) => setManualLat(event.target.value)} />
          </label>
          <label>
            Longitude
            <input inputMode="decimal" value={manualLng} onChange={(event) => setManualLng(event.target.value)} />
          </label>
          <button type="button" className="button-secondary" onClick={applyManualCoordinates}>Apply coordinates</button>
        </div>
      </details>

      {error && <p className="form-error location-error">{error}</p>}
      <p className="location-attribution">Address search data from OpenStreetMap contributors</p>
    </section>
  );
};
