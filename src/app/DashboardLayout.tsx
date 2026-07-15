import type { ReactNode } from "react";
import { AppShell, Box, Burger, Group, NavLink, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChartBar, IconChartDots, IconLeaf, IconMapRoute, IconSettings, IconTrash } from "@tabler/icons-react";
import type { ConnectionStatus } from "../types";
import { ConnectionStatusBadge } from "../components/ConnectionStatusBadge";

export type DashboardPage = "overview" | "smart-bins" | "routes" | "analytics" | "settings";

type DashboardLayoutProps = {
  activePage: DashboardPage;
  status: ConnectionStatus;
  children: ReactNode;
};

const pages = [
  { key: "overview" as const, label: "Overview", description: "City status and KPIs", icon: IconChartBar },
  { key: "smart-bins" as const, label: "Smart Bins", description: "Map and bin management", icon: IconTrash },
  { key: "routes" as const, label: "Route Planning", description: "Collection route tools", icon: IconMapRoute },
  { key: "analytics" as const, label: "Smart Analytics", description: "Impact and efficiency insights", icon: IconChartDots },
  { key: "settings" as const, label: "Settings", description: "Demo and dashboard options", icon: IconSettings },
];

export const DashboardLayout = ({ activePage, status, children }: DashboardLayoutProps) => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const currentPage = pages.find((page) => page.key === activePage) ?? pages[0];

  return (
    <AppShell header={{ height: 72 }} navbar={{ width: 280, breakpoint: "sm", collapsed: { mobile: !opened } }} padding="xl">
      <AppShell.Header className="app-header">
        <Group h="100%" px="xl" justify="space-between">
          <Group><Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" /><ThemeIcon size={42} radius="md"><IconLeaf size={24} /></ThemeIcon><Box><Title order={3}>Smart Waste</Title><Text size="xs" c="dimmed">Cologne Operations</Text></Box></Group>
          <ConnectionStatusBadge status={status} />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" className="app-navbar">
        <Stack h="100%" gap="xs">
          <Box px="sm" py="md"><Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={1.4}>Navigation</Text></Box>
          {pages.map((page) => (
            <NavLink
              key={page.key}
              href={`#/${page.key}`}
              active={activePage === page.key}
              label={page.label}
              description={page.description}
              leftSection={<page.icon size={20} />}
              onClick={close}
            />
          ))}
          <Paper mt="auto" p="md" radius="lg" className="eco-note"><Group wrap="nowrap" align="flex-start"><ThemeIcon variant="light"><IconLeaf size={18} /></ThemeIcon><Box><Text fw={700} size="sm">Live operations</Text><Text size="xs" c="dimmed">Real-time capacity and collection planning.</Text></Box></Group></Paper>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Box className="page-heading"><Text c="forest.7" fw={700} size="sm">SMART WASTE MANAGEMENT</Text><Title order={1}>{currentPage.label}</Title></Box>
        <Box className="dashboard-page">{children}</Box>
      </AppShell.Main>
    </AppShell>
  );
};
