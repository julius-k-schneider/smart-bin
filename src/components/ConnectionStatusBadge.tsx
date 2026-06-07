import type { ConnectionStatus } from "../types";

const statusStyles: Record<ConnectionStatus, { label: string; className: string }> = {
  idle: { label: "Idle", className: "badge-empty" },
  connecting: { label: "Connecting", className: "badge-almost_full" },
  open: { label: "Connected", className: "badge-normal" },
  closed: { label: "Closed", className: "badge-empty" },
  error: { label: "Error", className: "badge-full" },
};

type Props = {
  status: ConnectionStatus;
};

export const ConnectionStatusBadge = ({ status }: Props) => {
  const { label, className } = statusStyles[status];

  return <span className={`status-pill ${className}`}>{label}</span>;
};
