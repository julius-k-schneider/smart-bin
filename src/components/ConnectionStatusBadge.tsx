import type { ConnectionStatus } from "../types";
import { Badge } from "@mantine/core";

const statusStyles: Record<ConnectionStatus, { label: string; color: string }> = {
  idle: { label: "Idle", color: "gray" }, connecting: { label: "Connecting", color: "yellow" },
  open: { label: "Live connected", color: "forest" }, closed: { label: "Closed", color: "gray" }, error: { label: "Error", color: "red" },
};

type Props = {
  status: ConnectionStatus;
};

export const ConnectionStatusBadge = ({ status }: Props) => {
  const { label, color } = statusStyles[status];
  return <Badge color={color} variant="light" size="lg" leftSection={<span className="status-dot" />}>{label}</Badge>;
};
