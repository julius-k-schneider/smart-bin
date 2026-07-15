import { useEffect, useState } from "react";
import { Badge, Card, Collapse, Group, Skeleton, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { IconChevronDown, IconFlag, IconMapPin, IconRoute } from "@tabler/icons-react";
import type { GeneratedRoute } from "../../types";

type RouteStopListProps = {
  route: GeneratedRoute | null;
  isLoading?: boolean;
};

export const RouteStopList = ({ route, isLoading = false }: RouteStopListProps) => {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (route) setOpened(true);
  }, [route]);

  if (isLoading) {
    return (
      <Card className="route-stops-card" p="lg">
        <Group justify="space-between"><Skeleton height={20} width={180} /><Skeleton height={28} width={110} radius="xl" /></Group>
        <Skeleton height={10} mt="lg" radius="xl" />
      </Card>
    );
  }

  if (!route) {
    return (
      <Card className="route-empty-card" p="lg">
        <ThemeIcon variant="light" color="gray" radius="xl"><IconRoute size={17} /></ThemeIcon>
        <div><Text fw={700}>Your route will appear here</Text><Text size="sm" c="dimmed">Choose a threshold and generate a collection route.</Text></div>
      </Card>
    );
  }

  const collectionStops = route.stops.filter((stop) => stop.type === "bin").length;

  return (
    <Card className="route-stops-card" p={0}>
      <UnstyledButton className="route-stops-toggle" onClick={() => setOpened((value) => !value)} aria-expanded={opened}>
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" radius="xl"><IconRoute size={18} /></ThemeIcon>
          <div><Text fw={700}>Collection route</Text><Text size="xs" c="dimmed">Optimized stop order</Text></div>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Badge variant="light">{collectionStops} stops</Badge>
          <Badge variant="outline" color="gray">{route.totalDistanceKm} km</Badge>
          <IconChevronDown className={`route-chevron ${opened ? "route-chevron-open" : ""}`} size={19} />
        </Group>
      </UnstyledButton>

      <Collapse in={opened}>
        {collectionStops === 0 ? (
          <Text className="route-list-empty" size="sm" c="dimmed">No bins require collection for this threshold.</Text>
        ) : (
          <ol className="route-list-modern">
            {route.stops.map((stop, index) => (
              <li key={`${stop.type}-${stop.bin_id ?? "depot"}-${index}`}>
                <div className="route-stop-marker">
                  {stop.type === "depot" ? <IconFlag size={15} /> : <IconMapPin size={15} />}
                </div>
                <div className="route-stop-content">
                  <Group justify="space-between" gap="xs" wrap="nowrap">
                    <Text size="sm" fw={650} lineClamp={1}>{stop.label}</Text>
                    <Text size="xs" c="dimmed" className="route-stop-number">
                      {stop.type === "depot" ? (index === 0 ? "Start" : "Return") : `Stop ${index}`}
                    </Text>
                  </Group>
                  {stop.reason && <Text size="xs" c="dimmed">{stop.reason}</Text>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Collapse>
    </Card>
  );
};
