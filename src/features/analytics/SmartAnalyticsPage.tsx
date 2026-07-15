import {
  Badge,
  Box,
  Card,
  Center,
  Grid,
  Group,
  Progress,
  RingProgress,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCoinEuro,
  IconLeaf,
  IconRecycle,
  IconRoute,
  IconTruck,
} from "@tabler/icons-react";

const kpis = [
  { label: "CO₂ emissions avoided", value: "1.84 t", note: "vs. fixed collection schedule", change: "18.7%", icon: IconLeaf, color: "forest" },
  { label: "Operating costs saved", value: "€ 4,280", note: "estimated this month", change: "12.4%", icon: IconCoinEuro, color: "teal" },
  { label: "Distance avoided", value: "2,360 km", note: "through optimized routes", change: "21.3%", icon: IconRoute, color: "cyan" },
  { label: "Collections avoided", value: "146", note: "unnecessary emptying stops", change: "16.8%", icon: IconTruck, color: "lime" },
];

const monthlyImpact = [
  { month: "Jan", value: 46 }, { month: "Feb", value: 55 }, { month: "Mar", value: 51 },
  { month: "Apr", value: 68 }, { month: "May", value: 77 }, { month: "Jun", value: 86 },
];

const districts = [
  { name: "Innenstadt", efficiency: 94, savings: "€ 1,140", co2: "486 kg" },
  { name: "Ehrenfeld", efficiency: 89, savings: "€ 920", co2: "391 kg" },
  { name: "Nippes", efficiency: 86, savings: "€ 780", co2: "338 kg" },
  { name: "Deutz", efficiency: 81, savings: "€ 640", co2: "274 kg" },
];

export const SmartAnalyticsPage = () => (
  <Stack gap="xl">
    <Group justify="space-between" align="flex-end">
      <Box>
        <Title order={2}>Sustainability at a glance</Title>
        <Text c="dimmed" mt={4}>Estimated environmental and operational impact of demand-based waste collection.</Text>
      </Box>
      <Badge color="gray" variant="light" size="lg">Mock data · June 2026</Badge>
    </Group>

    <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md">
      {kpis.map((kpi) => (
        <Card key={kpi.label} p="lg" shadow="sm">
          <Group justify="space-between" align="flex-start">
            <ThemeIcon color={kpi.color} variant="light" size={44} radius="md"><kpi.icon size={23} /></ThemeIcon>
            <Badge color="forest" variant="light" leftSection={<IconArrowUpRight size={12} />}>{kpi.change}</Badge>
          </Group>
          <Text size="sm" c="dimmed" mt="lg">{kpi.label}</Text>
          <Text size="1.85rem" fw={750} c="forest.9" lh={1.2}>{kpi.value}</Text>
          <Text size="xs" c="dimmed" mt={6}>{kpi.note}</Text>
        </Card>
      ))}
    </SimpleGrid>

    <Grid gutter="md">
      <Grid.Col span={{ base: 12, lg: 8 }}>
        <Card p="xl" shadow="sm" h="100%">
          <Group justify="space-between" mb="xl">
            <Box><Title order={3}>Optimization impact</Title><Text size="sm" c="dimmed">Monthly composite score from route, cost and emission savings</Text></Box>
            <Badge color="forest" variant="dot">Positive trend</Badge>
          </Group>
          <Group align="flex-end" gap="lg" h={230} wrap="nowrap">
            {monthlyImpact.map((item) => (
              <Stack key={item.month} gap={7} align="center" justify="flex-end" h="100%" flex={1}>
                <Text size="xs" fw={700} c="forest.7">{item.value}</Text>
                <Box w="100%" maw={62} h={`${item.value * 1.85}px`} bg="forest.6" style={{ borderRadius: "10px 10px 4px 4px", opacity: .35 + item.value / 140 }} />
                <Text size="xs" c="dimmed">{item.month}</Text>
              </Stack>
            ))}
          </Group>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, lg: 4 }}>
        <Card p="xl" shadow="sm" h="100%">
          <Title order={3}>Fleet efficiency</Title>
          <Text size="sm" c="dimmed">Share of collections made when bins were actually ready</Text>
          <Center my="lg">
            <RingProgress size={190} thickness={18} roundCaps sections={[{ value: 87, color: "forest.6" }]} label={<Center><Box ta="center"><Text size="2rem" fw={750}>87%</Text><Text size="xs" c="dimmed">efficient stops</Text></Box></Center>} />
          </Center>
          <Group justify="space-between"><Text size="sm" c="dimmed">Previous month</Text><Group gap={4}><IconArrowUpRight size={16} color="var(--mantine-color-forest-7)"/><Text size="sm" fw={700} c="forest.7">+6.2%</Text></Group></Group>
        </Card>
      </Grid.Col>
    </Grid>

    <Grid gutter="md">
      <Grid.Col span={{ base: 12, lg: 7 }}>
        <Card p="xl" shadow="sm">
          <Group justify="space-between" mb="lg"><Box><Title order={3}>District performance</Title><Text size="sm" c="dimmed">Best-performing collection areas this month</Text></Box><IconRecycle size={26} color="var(--mantine-color-forest-6)" /></Group>
          <Table verticalSpacing="md" highlightOnHover>
            <Table.Thead><Table.Tr><Table.Th>District</Table.Th><Table.Th>Route efficiency</Table.Th><Table.Th>Cost savings</Table.Th><Table.Th>CO₂ avoided</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{districts.map((district) => <Table.Tr key={district.name}><Table.Td><Text fw={650}>{district.name}</Text></Table.Td><Table.Td><Group gap="sm" wrap="nowrap"><Progress value={district.efficiency} w={80} color="forest" /><Text size="sm">{district.efficiency}%</Text></Group></Table.Td><Table.Td>{district.savings}</Table.Td><Table.Td>{district.co2}</Table.Td></Table.Tr>)}</Table.Tbody>
          </Table>
        </Card>
      </Grid.Col>
      <Grid.Col span={{ base: 12, lg: 5 }}>
        <Card p="xl" shadow="sm" h="100%">
          <Title order={3}>Monthly targets</Title><Text size="sm" c="dimmed" mb="xl">Progress toward the operational sustainability goals</Text>
          <Stack gap="xl">
            {[{ label: "CO₂ reduction", value: 92, detail: "1.84 / 2.00 t" }, { label: "Cost savings", value: 86, detail: "€4,280 / €5,000" }, { label: "Route reduction", value: 79, detail: "2,360 / 3,000 km" }].map((target) => <Box key={target.label}><Group justify="space-between" mb={7}><Text size="sm" fw={650}>{target.label}</Text><Text size="sm" c="dimmed">{target.detail}</Text></Group><Progress value={target.value} color={target.value >= 90 ? "forest" : "teal"} size="md" radius="xl" /></Box>)}
          </Stack>
          <Group mt="xl" p="md" bg="forest.0" style={{ borderRadius: 12 }} wrap="nowrap"><ThemeIcon color="forest" variant="light"><IconArrowDownRight size={18} /></ThemeIcon><Text size="sm"><b>11.6%</b> fewer vehicle hours compared with the conventional schedule.</Text></Group>
        </Card>
      </Grid.Col>
    </Grid>
  </Stack>
);
