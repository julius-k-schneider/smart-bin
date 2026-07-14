import type { ReactNode } from "react";
import type { ConnectionStatus } from "../types";
import { ConnectionStatusBadge } from "../components/ConnectionStatusBadge";

export type DashboardPage = "overview" | "smart-bins" | "routes" | "settings";

type DashboardLayoutProps = {
  activePage: DashboardPage;
  status: ConnectionStatus;
  children: ReactNode;
};

const pages: Array<{ key: DashboardPage; label: string; description: string }> = [
  { key: "overview", label: "Overview", description: "City status and KPIs" },
  { key: "smart-bins", label: "Smart Bins", description: "Map and bin management" },
  { key: "routes", label: "Route Planning", description: "Collection route tools" },
  { key: "settings", label: "Settings", description: "Demo and dashboard options" },
];

export const DashboardLayout = ({ activePage, status, children }: DashboardLayoutProps) => {
  const currentPage = pages.find((page) => page.key === activePage) ?? pages[0];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="#/overview">
          <span>SB</span>
          <div>
            <strong>Smart Waste</strong>
            <small>Cologne Dashboard</small>
          </div>
        </a>
        <nav className="dashboard-navigation" aria-label="Dashboard navigation">
          {pages.map((page) => (
            <a
              key={page.key}
              href={`#/${page.key}`}
              className={activePage === page.key ? "navigation-active" : undefined}
            >
              <strong>{page.label}</strong>
              <span>{page.description}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-connection">
          <span>Live data</span>
          <ConnectionStatusBadge status={status} />
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div>
            <span>Smart Waste Management</span>
            <h1>{currentPage.label}</h1>
          </div>
          <ConnectionStatusBadge status={status} />
        </header>
        <main className="dashboard-page">{children}</main>
      </div>
    </div>
  );
};
