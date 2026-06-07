import { useCityBinSocket } from "./hooks/useCityBinSocket";
import { CityDashboard } from "./components/CityDashboard";

const CITY_SOCKET_URL = import.meta.env.VITE_SMART_BIN_CITY_URL ?? "ws://localhost:8181";

const App = () => {
  const { status, latest, history } = useCityBinSocket({
    enabled: true,
    url: CITY_SOCKET_URL,
    historySize: 100,
  });

  return (
    <div className="app-shell">
      <CityDashboard status={status} data={latest} history={history} />
    </div>
  );
};

export default App;
