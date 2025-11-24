/**
 * Settings page component for extension configuration
 */
import * as Config from "../config";
import * as API from "../api";
import { t } from "../i18n";

const { React } = Spicetify;
const { useState, useEffect } = React;

interface SettingsPageProps {
  [key: string]: any;
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [apiPort, setApiPort] = useState("5985");
  const [apiHost, setApiHost] = useState("127.0.0.1");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    // Load current config
    const config = Config.getConfig();
    setApiPort(config.apiPort.toString());
    setApiHost(config.apiHost);
  }, []);

  const handleSave = () => {
    try {
      const port = parseInt(apiPort, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        setError(t("settings.portRange"));
        return;
      }

      if (!apiHost || apiHost.trim() === "") {
        setError(t("settings.hostRequired"));
        return;
      }

      Config.saveConfig({
        apiPort: port,
        apiHost: apiHost.trim(),
      });

      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      Spicetify.showNotification(t("notifications.settingsSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.saveFailed"));
    }
  };

  const handleReset = () => {
    Config.resetConfig();
    const defaultConfig = Config.getConfig();
    setApiPort(defaultConfig.apiPort.toString());
    setApiHost(defaultConfig.apiHost);
    setError(null);
    setSaved(false);
    Spicetify.showNotification(t("notifications.settingsReset"));
  };

  const handleOpenApiServerSettings = async () => {
    try {
      await API.openSettings();
      Spicetify.showNotification(t("notifications.apiSettingsOpened"));
    } catch (error) {
      console.error("Error opening API server settings:", error);
      Spicetify.showNotification(
        error instanceof Error
          ? error.message
          : t("notifications.apiSettingsFailed"),
        true
      );
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <h1 style={{ marginTop: 0 }}>{t("settings.title")}</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "500px",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--spice-text)",
              fontWeight: "bold",
            }}
          >
            {t("settings.apiHost")}
          </label>
          <input
            type="text"
            value={apiHost}
            onChange={(e) => setApiHost(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "var(--spice-card)",
              color: "var(--spice-text)",
              border: "1px solid var(--spice-border)",
              borderRadius: "4px",
              fontSize: "14px",
            }}
            placeholder="127.0.0.1"
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "var(--spice-text)",
              fontWeight: "bold",
            }}
          >
            {t("settings.apiPort")}
          </label>
          <input
            type="number"
            value={apiPort}
            onChange={(e) => setApiPort(e.target.value)}
            min="1"
            max="65535"
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "var(--spice-card)",
              color: "var(--spice-text)",
              border: "1px solid var(--spice-border)",
              borderRadius: "4px",
              fontSize: "14px",
            }}
            placeholder="5985"
          />
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--spice-notification-error)",
              color: "var(--spice-text-negative)",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {saved && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--spice-notification-success)",
              color: "var(--spice-text-positive)",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            {t("notifications.settingsSaved")}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={handleSave}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--spice-button)",
              color: "var(--spice-text)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {t("settings.save")}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--spice-card)",
              color: "var(--spice-text)",
              border: "1px solid var(--spice-border)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {t("settings.reset")}
          </button>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            backgroundColor: "var(--spice-card)",
            borderRadius: "4px",
            border: "1px solid var(--spice-border)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "12px",
              fontSize: "16px",
              color: "var(--spice-text)",
            }}
          >
            {t("settings.apiServerSettings")}
          </h3>
          <p
            style={{
              marginBottom: "12px",
              fontSize: "12px",
              color: "var(--spice-text-subdued)",
            }}
          >
            {t("settings.apiServerSettingsDesc")}
          </p>
          <button
            onClick={handleOpenApiServerSettings}
            style={{
              padding: "10px 20px",
              backgroundColor: "var(--spice-button)",
              color: "var(--spice-text)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              width: "100%",
            }}
          >
            {t("settings.openApiServerSettings")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

