import type { SmartBinLocation, GeneratedRoute, RouteStartPoint } from "../../types";
import { createGoogleMapsRouteParts } from "../../utils/googleMaps";
import { LocationPicker } from "../../components/LocationPicker";
import { ThresholdSlider } from "./ThresholdSlider";
import { Alert, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconExternalLink, IconRoute } from "@tabler/icons-react";

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
    <Card p="lg" shadow="sm">
      <Stack gap="lg"><Title order={3}>Route Planning</Title>
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
        <Button
          type="button"
          variant="light" fullWidth
          disabled={isDefaultStartPoint}
          onClick={onResetStartPoint}
        >
          Reset to default depot
        </Button>
      </div>
      <div>
        <ThresholdSlider
          value={threshold}
          onChange={onThresholdChange}
          min={0}
          max={100}
        />
      </div>

      <Alert color="forest" variant="light" icon={<IconRoute size={18} />}>
        <Text size="sm">
          <strong>{binsAboveThreshold}</strong> bin{binsAboveThreshold !== 1 ? "s" : ""} will be included in route
        </Text>
      </Alert>
      <Group grow>
        <Button
          onClick={onGenerateRoute}
          disabled={isGenerating || binsAboveThreshold === 0}
          loading={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Route"}
        </Button>
        <Button
          onClick={onClearRoute}
          disabled={!route}
          variant="default"
        >
          Clear Route
        </Button>
      </Group>

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
                <Button component="a" leftSection={<IconExternalLink size={17} />} fullWidth
                  href={part.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {part.label}
                </Button>
                {googleMapsRouteParts.length > 1 && (
                  <span>{part.stopCount} stops | {part.startLabel} to {part.endLabel}</span>
                )}
              </div>
            ))}
          </>
        )}
      </div></Stack>
    </Card>
  );
};
