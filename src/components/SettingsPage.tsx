/**
 * Settings page component for extension configuration
 */
import * as Config from "../config";
import * as API from "../api";

const { React } = Spicetify;
const { useState, useEffect } = React;

interface SettingsPageProps {
  [key: string]: any;
}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  const [apiPort, setApiPort] = useState<string>("5985");
  const [apiHost, setApiHost] = useState<string>("127.0.0.1");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError("ポート番号は1から65535の間で指定してください");
        return;
      }

      if (!apiHost || apiHost.trim() === "") {
        setError("ホスト名を入力してください");
        return;
      }

      Config.saveConfig({
        apiPort: port,
        apiHost: apiHost.trim(),
      });

      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      Spicetify.showNotification("設定を保存しました");
    } catch (err) {
      setError(err instanceof Error ? err.message : "設定の保存に失敗しました");
    }
  };

  const handleReset = () => {
    Config.resetConfig();
    const defaultConfig = Config.getConfig();
    setApiPort(defaultConfig.apiPort.toString());
    setApiHost(defaultConfig.apiHost);
    setError(null);
    setSaved(false);
    Spicetify.showNotification("設定をリセットしました");
  };

  const handleOpenApiServerSettings = async () => {
    try {
      await API.openSettings();
      Spicetify.showNotification("APIサーバーの設定画面を開きました");
    } catch (error) {
      console.error("Error opening API server settings:", error);
      Spicetify.showNotification(
        error instanceof Error
          ? error.message
          : "APIサーバーの設定画面を開けませんでした",
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
      <h1 style={{ marginTop: 0 }}>spotDL 拡張機能設定</h1>

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
            APIサーバーのホスト
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
            APIサーバーのポート番号
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
            設定を保存しました
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
            保存
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
            リセット
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
            APIサーバー設定
          </h3>
          <p
            style={{
              marginBottom: "12px",
              fontSize: "12px",
              color: "var(--spice-text-subdued)",
            }}
          >
            APIサーバーのダウンロード先フォルダやポートなどの設定を変更するには、以下のボタンをクリックしてください。
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
            APIサーバーの設定を開く
          </button>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "var(--spice-card)",
            borderRadius: "4px",
            fontSize: "12px",
            color: "var(--spice-text-subdued)",
          }}
        >
          <strong>現在の設定:</strong>
          <br />
          ホスト: {apiHost}
          <br />
          ポート: {apiPort}
          <br />
          <br />
          API URL: http://{apiHost}:{apiPort}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

