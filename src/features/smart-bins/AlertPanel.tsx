import type { BinFillFrame } from "../../types";

type Props = {
  latest: BinFillFrame | null;
};

export const AlertPanel = ({ latest }: Props) => {
  if (!latest) {
    return (
      <div className="alert-card">
        <h2>Live status</h2>
        <p>No live data received yet. Start the mock server and wait for the first update.</p>
      </div>
    );
  }

  const entries = Object.entries(latest.compartments) as Array<[
    keyof typeof latest.compartments,
    typeof latest.compartments[keyof typeof latest.compartments],
  ]>;

  const full = entries.filter(([, compartment]) => compartment.status === "full");
  const almostFull = entries.filter(([, compartment]) => compartment.status === "almost_full");

  const messages: string[] = [];
  if (full.length > 0) {
    full.forEach(([name]) => messages.push(`${name.charAt(0).toUpperCase() + name.slice(1)} compartment is full.`));
  }
  if (almostFull.length > 0) {
    almostFull.forEach(([name]) => messages.push(`${name.charAt(0).toUpperCase() + name.slice(1)} is almost full.`));
  }
  if (messages.length === 0) {
    messages.push("All compartments are currently below warning threshold.");
  }

  return (
    <div className="alert-card">
      <h2>Alerts & summary</h2>
      <div className="alert-row">
        {full.map(([name]) => (
          <span key={name} className="alert-pill danger">
            {name.charAt(0).toUpperCase() + name.slice(1)} full
          </span>
        ))}
        {almostFull.map(([name]) => (
          <span key={name} className="alert-pill warning">
            {name.charAt(0).toUpperCase() + name.slice(1)} almost full
          </span>
        ))}
        {messages.length === 1 && full.length === 0 && almostFull.length === 0 ? (
          <span className="alert-pill">All clear</span>
        ) : null}
      </div>
      <div className="note">
        {messages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </div>
    </div>
  );
};
