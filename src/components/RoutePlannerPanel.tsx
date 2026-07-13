import type { SmartBinLocation, GeneratedRoute, RouteStartPoint } from "../types";
import { createGoogleMapsRouteParts } from "../utils/googleMaps";
import { LocationPicker } from "./LocationPicker";
import { ThresholdSlider } from "./ThresholdSlider";

interface RoutePlannerPanelProps {
  bins: SmartBinLocation[];
  threshold: number;
  onThresholdChange: (threshold: number) => void;
  onGenerateRoute: () => void;
  onClearRoute: () => void;
  route: GeneratedRoute | null;
  isGenerating?: boolean;
  startPoint: RouteStartPoint;
  onStartPointChange: (startPoint: RouteStartPoint) => void;
  onResetStartPoint: () => void;
  isDefaultStartPoint: boolean;
}

export const RoutePlannerPanel = ({
  bins,
  threshold,
  onThresholdChange,
  onGenerateRoute,
  onClearRoute,
  route,
  isGenerating = false,
  startPoint,
  onStartPointChange,
  onResetStartPoint,
  isDefaultStartPoint,
}: RoutePlannerPanelProps) => {
  const binsAboveThreshold = bins.filter((bin) =>
    Object.values(bin.compartments).some(
      (c) => c.fill_level_percent >= threshold
    )
  ).length;
  const googleMapsRouteParts = createGoogleMapsRouteParts(route);

  return (
    <div className="status-card">
      <h2>Route Planning</h2>

      <div className="route-start-section">
        <LocationPicker
          label="Route start point"
          value={startPoint}
          onChange={(location) => onStartPointChange({
            label: location.label ?? "Custom route start",
            lat: location.lat,
            lng: location.lng,
          })}
        />
        <button
          type="button"
          className="button-secondary reset-depot-button"
          disabled={isDefaultStartPoint}
          onClick={onResetStartPoint}
        >
          Reset to default depot
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <ThresholdSlider
          value={threshold}
          onChange={onThresholdChange}
          min={0}
          max={100}
        />
      </div>

      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "8px",
          fontSize: "0.9rem",
        }}
      >
        <p style={{ margin: "0" }}>
          <strong>{binsAboveThreshold}</strong> bin{binsAboveThreshold !== 1 ? "s" : ""} will be included in route
        </p>
      </div>

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
          justifyContent: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onGenerateRoute}
          disabled={isGenerating || binsAboveThreshold === 0}
          style={{
            flex: "1 1 auto",
            minWidth: "140px",
            padding: "10px 16px",
            backgroundColor: isGenerating ? "rgba(99, 102, 241, 0.5)" : "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isGenerating || binsAboveThreshold === 0 ? "not-allowed" : "pointer",
            fontSize: "0.95rem",
            fontWeight: "600",
            opacity: isGenerating || binsAboveThreshold === 0 ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
        >
          {isGenerating ? "Generating..." : "Generate Route"}
        </button>

        <button
          onClick={onClearRoute}
          disabled={!route}
          style={{
            flex: "1 1 auto",
            minWidth: "140px",
            padding: "10px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: !route ? "not-allowed" : "pointer",
            fontSize: "0.95rem",
            fontWeight: "600",
            opacity: !route ? 0.5 : 1,
            transition: "all 0.2s ease",
          }}
        >
          Clear Route
        </button>
      </div>

      <div className="route-export">
        {googleMapsRouteParts.length === 0 ? (
          <button className="google-maps-button" disabled>
            Open route in Google Maps
          </button>
        ) : (
          <>
            {googleMapsRouteParts.length > 1 && (
              <p className="route-export-note">
                Google Maps limits the number of stops per route. The collection route was split into multiple navigation links.
              </p>
            )}
            {googleMapsRouteParts.map((part) => (
              <div className="route-export-part" key={part.label}>
                <a
                  className="google-maps-button"
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {part.label}
                </a>
                {googleMapsRouteParts.length > 1 && (
                  <span>{part.stopCount} stops | {part.startLabel} to {part.endLabel}</span>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
