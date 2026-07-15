import { ActionIcon, Badge, Button, Card, Divider, Group, Modal, Stack, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconExternalLink, IconMapPin, IconRefresh, IconRoute, IconSparkles, IconTrash } from "@tabler/icons-react";
import { LocationPicker } from "../../components/LocationPicker";
import type { GeneratedRoute, RouteStartPoint, SmartBinLocation } from "../../types";
import { createGoogleMapsRouteParts } from "../../utils/googleMaps";
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
  const [locationPickerOpened, { open: openLocationPicker, close: closeLocationPicker }] = useDisclosure(false);
  const binsAboveThreshold = bins.filter((bin) =>
    Object.values(bin.compartments).some((compartment) => compartment.fill_level_percent >= threshold)
  ).length;
  const googleMapsRouteParts = createGoogleMapsRouteParts(route);

  return (
    <>
      <Card p="lg" shadow="sm" className="route-planner-card">
        <Stack gap="lg">
          <Group justify="space-between" align="flex-start">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={40} radius="md" variant="light"><IconRoute size={21} /></ThemeIcon>
              <div>
                <Text fw={750}>Plan collection</Text>
                <Text size="xs" c="dimmed">Configure and create your route</Text>
              </div>
            </Group>
            <Badge variant="light" size="lg">{binsAboveThreshold} ready</Badge>
          </Group>

          <button type="button" className="route-location-summary" onClick={openLocationPicker}>
            <ThemeIcon variant="light" radius="xl" size={38}><IconMapPin size={19} /></ThemeIcon>
            <span>
              <small>Starting point</small>
              <strong>{startPoint.label}</strong>
              <small>{startPoint.lat.toFixed(4)}, {startPoint.lng.toFixed(4)}</small>
            </span>
            <span className="route-location-change">Change</span>
          </button>

          <Group justify="space-between" mt={-10}>
            <Text size="xs" c="dimmed">The route returns to this location.</Text>
            <Tooltip label="Reset to default depot">
              <ActionIcon
                type="button"
                variant="subtle"
                aria-label="Reset to default depot"
                disabled={isDefaultStartPoint}
                onClick={onResetStartPoint}
              >
                <IconRefresh size={17} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Divider />

          <div>
            <ThresholdSlider value={threshold} onChange={onThresholdChange} min={0} max={100} />
            <div className="threshold-context"><span>More stops</span><span>Fewer stops</span></div>
          </div>

          <div className="route-inclusion-summary">
            <IconSparkles size={18} />
            <Text size="sm"><strong>{binsAboveThreshold}</strong> of {bins.length} bins match the current threshold</Text>
          </div>

          <Button
            size="md"
            leftSection={<IconRoute size={19} />}
            onClick={onGenerateRoute}
            disabled={isGenerating || binsAboveThreshold === 0}
            loading={isGenerating}
            fullWidth
          >
            {isGenerating ? "Optimizing route..." : route ? "Recalculate route" : "Generate route"}
          </Button>

          {route && (
            <Button onClick={onClearRoute} variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} />}>
              Clear current route
            </Button>
          )}

          {googleMapsRouteParts.length > 0 && (
            <div className="route-export">
              <Divider label="Navigation" labelPosition="center" />
              {googleMapsRouteParts.length > 1 && (
                <Text size="xs" c="dimmed">
                  Google Maps limits stops, so the route is split into {googleMapsRouteParts.length} parts.
                </Text>
              )}
              {googleMapsRouteParts.map((part) => (
                <div className="route-export-part" key={part.label}>
                  <Button
                    component="a"
                    leftSection={<IconExternalLink size={17} />}
                    fullWidth
                    variant="light"
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {part.label}
                  </Button>
                  {googleMapsRouteParts.length > 1 && (
                    <span>{part.stopCount} stops · {part.startLabel} to {part.endLabel}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Stack>
      </Card>

      <Modal
        opened={locationPickerOpened}
        onClose={closeLocationPicker}
        title="Choose route start"
        size="lg"
        centered
        classNames={{ content: "route-location-modal", title: "route-location-modal-title" }}
      >
        <LocationPicker
          label="Route start point"
          value={startPoint}
          onChange={(location) => onStartPointChange({
            label: location.label ?? "Custom route start",
            lat: location.lat,
            lng: location.lng,
          })}
        />
        <Group justify="space-between" mt="md">
          <Button variant="subtle" disabled={isDefaultStartPoint} onClick={onResetStartPoint}>Use default depot</Button>
          <Button onClick={closeLocationPicker}>Done</Button>
        </Group>
      </Modal>
    </>
  );
};
