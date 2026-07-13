import { useEffect, useState } from "react";
import { getServerSettings, resetDemoFillLevels, updateServerSettings } from "../../api";
import type { DashboardPreferences, ServerSettings } from "../../types";

type SettingsPageProps = {
  preferences: DashboardPreferences;
  onPreferencesChange: (preferences: DashboardPreferences) => void;
};

export const SettingsPage = ({ preferences, onPreferencesChange }: SettingsPageProps) => {
  const [serverSettings, setServerSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getServerSettings()
      .then(setServerSettings)
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : "Settings could not be loaded."))
      .finally(() => setLoading(false));
  }, []);

  const toggleSimulation = async () => {
    if (!serverSettings) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateServerSettings(!serverSettings.simulation_enabled);
      setServerSettings(updated);
      setMessage(updated.simulation_enabled ? "Mock simulation resumed." : "Mock simulation paused.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The simulator setting could not be changed.");
    } finally {
      setSaving(false);
    }
  };

  const resetFillLevels = async () => {
    if (!window.confirm("Reset all current fill levels to low demo values?")) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await resetDemoFillLevels();
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Fill levels could not be reset.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack settings-page">
      <section className="page-intro">
        <div>
          <h2>Dashboard settings</h2>
          <p>Configure demo behavior and defaults used across the dashboard.</p>
        </div>
      </section>

      {error && <div className="alert-message alert-critical">{error}</div>}
      {message && <div className="alert-message alert-success">{message}</div>}

      <div className="settings-grid">
        <section className="status-card settings-card">
          <div>
            <h2>Mock server</h2>
            <p>Control live demo updates without restarting the backend.</p>
          </div>
          {loading ? <p>Loading server settings...</p> : serverSettings && (
            <div className="settings-list">
              <div className="setting-row">
                <div>
                  <strong>Automatic fill updates</strong>
                  <span>Updates every {serverSettings.update_interval_seconds} seconds</span>
                </div>
                <button className="button-secondary" disabled={saving} onClick={toggleSimulation}>
                  {serverSettings.simulation_enabled ? "Pause simulator" : "Resume simulator"}
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Reset demo fill levels</strong>
                  <span>Sets all compartments to realistic low values.</span>
                </div>
                <button className="button-danger" disabled={saving} onClick={resetFillLevels}>Reset fill levels</button>
              </div>
              <div className="setting-row setting-readonly">
                <div>
                  <strong>Device group</strong>
                  <span>{serverSettings.device_group_id}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="status-card settings-card">
          <div>
            <h2>Dashboard defaults</h2>
            <p>These preferences are stored in this browser.</p>
          </div>
          <div className="settings-list">
            <label className="setting-row">
              <div>
                <strong>Default collection threshold</strong>
                <span>Used by Overview and new route planning sessions.</span>
              </div>
              <div className="threshold-setting">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={preferences.defaultThreshold}
                  onChange={(event) => onPreferencesChange({
                    ...preferences,
                    defaultThreshold: Number(event.target.value),
                  })}
                />
                <strong>{preferences.defaultThreshold}%</strong>
              </div>
            </label>
            <label className="setting-row setting-checkbox">
              <div>
                <strong>Open Smart Bins map by default</strong>
                <span>The map can still be opened or closed directly on the page.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.binsMapDefaultOpen}
                onChange={(event) => onPreferencesChange({
                  ...preferences,
                  binsMapDefaultOpen: event.target.checked,
                })}
              />
            </label>
            <div className="setting-row">
              <div>
                <strong>Reset dashboard preferences</strong>
                <span>Restores the default threshold and map behavior.</span>
              </div>
              <button
                className="button-secondary"
                onClick={() => onPreferencesChange({ defaultThreshold: 80, binsMapDefaultOpen: true })}
              >
                Restore defaults
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
