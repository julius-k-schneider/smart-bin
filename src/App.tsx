import { useEffect, useState } from "react";
import { DashboardLayout, type DashboardPage } from "./components/DashboardLayout";
import { useCityBinSocket } from "./hooks/useCityBinSocket";
import { OverviewPage } from "./pages/overview/OverviewPage";
import { RoutePlanningPage } from "./pages/routes/RoutePlanningPage";
import { SettingsPage } from "./pages/settings/SettingsPage";
import { SmartBinsPage } from "./pages/smart-bins/SmartBinsPage";
import type { DashboardPreferences } from "./types";

const CITY_SOCKET_URL = import.meta.env.VITE_SMART_BIN_CITY_URL ?? "ws://localhost:8181/ws";
const PREFERENCES_KEY = "smart-bin-dashboard-preferences";
const DEFAULT_PREFERENCES: DashboardPreferences = { defaultThreshold: 80, binsMapDefaultOpen: true };
const validPages = new Set<DashboardPage>(["overview", "smart-bins", "routes", "settings"]);

const getPageFromHash = (): DashboardPage => {
  const page = window.location.hash.replace(/^#\/?/, "") as DashboardPage;
  return validPages.has(page) ? page : "overview";
};

const loadPreferences = (): DashboardPreferences => {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? "null") as Partial<DashboardPreferences> | null;
    return {
      defaultThreshold: typeof stored?.defaultThreshold === "number" ? stored.defaultThreshold : 80,
      binsMapDefaultOpen: typeof stored?.binsMapDefaultOpen === "boolean" ? stored.binsMapDefaultOpen : true,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

const App = () => {
  const [activePage, setActivePage] = useState<DashboardPage>(getPageFromHash);
  const [preferences, setPreferences] = useState<DashboardPreferences>(loadPreferences);
  const { status, latest } = useCityBinSocket({ enabled: true, url: CITY_SOCKET_URL, historySize: 100 });

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#/overview");
    const handleHashChange = () => setActivePage(getPageFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const updatePreferences = (updated: DashboardPreferences) => {
    setPreferences(updated);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  };

  const page = activePage === "smart-bins"
    ? <SmartBinsPage data={latest} threshold={preferences.defaultThreshold} mapDefaultOpen={preferences.binsMapDefaultOpen} />
    : activePage === "routes"
      ? <RoutePlanningPage data={latest} defaultThreshold={preferences.defaultThreshold} />
      : activePage === "settings"
        ? <SettingsPage preferences={preferences} onPreferencesChange={updatePreferences} />
        : <OverviewPage data={latest} status={status} threshold={preferences.defaultThreshold} />;

  return (
    <DashboardLayout activePage={activePage} status={status}>
      {page}
    </DashboardLayout>
  );
};

export default App;
