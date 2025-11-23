/**
 * Download status page component
 */
import * as API from "../api";

const { React } = Spicetify;
const { useState, useEffect } = React;

interface DownloadStatusPageProps {
  [key: string]: any;
}

const DownloadStatusPage: React.FC<DownloadStatusPageProps> = () => {
  const [downloads, setDownloads] = useState<API.DownloadStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);

  const fetchStatus = async () => {
    try {
      const isHealthy = await API.checkHealth();
      setApiAvailable(isHealthy);

      if (!isHealthy) {
        setError("APIサーバーに接続できません。サーバーが起動しているか確認してください。");
        setLoading(false);
        return;
      }

      const status = await API.getDownloadStatus();
      if ("downloads" in status) {
        setDownloads(status.downloads);
      } else {
        setDownloads([status]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ステータスの取得に失敗しました");
      console.error("Error fetching status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCancel = async (downloadId: string) => {
    try {
      await API.cancelDownload(downloadId);
      await fetchStatus();
      Spicetify.showNotification("ダウンロードをキャンセルしました");
    } catch (err) {
      Spicetify.showNotification(
        err instanceof Error ? err.message : "キャンセルに失敗しました",
        true
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "var(--spice-text-positive)";
      case "failed":
        return "var(--spice-text-negative)";
      case "downloading":
        return "var(--spice-text-bright-accent)";
      case "cancelled":
        return "var(--spice-text-subdued)";
      default:
        return "var(--spice-text-base)";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "starting":
        return "開始中";
      case "downloading":
        return "ダウンロード中";
      case "completed":
        return "完了";
      case "failed":
        return "失敗";
      case "cancelled":
        return "キャンセル済み";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "var(--spice-text-subdued)",
        }}
      >
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          color: "var(--spice-text-negative)",
        }}
      >
        <h2>エラー</h2>
        <p>{error}</p>
        <button
          onClick={fetchStatus}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "var(--spice-button)",
            color: "var(--spice-text)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>ダウンロード状況</h1>
        <button
          onClick={fetchStatus}
          style={{
            padding: "8px 16px",
            backgroundColor: "var(--spice-button)",
            color: "var(--spice-text)",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          更新
        </button>
      </div>

      {downloads.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--spice-text-subdued)",
          }}
        >
          ダウンロードがありません
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {downloads.map((download) => (
            <div
              key={download.id}
              style={{
                padding: "16px",
                backgroundColor: "var(--spice-card)",
                borderRadius: "8px",
                border: "1px solid var(--spice-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--spice-text-subdued)",
                      marginBottom: "4px",
                    }}
                  >
                    {download.url}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <span
                      style={{
                        color: getStatusColor(download.status),
                        fontWeight: "bold",
                      }}
                    >
                      {getStatusText(download.status)}
                    </span>
                    {download.status === "downloading" && (
                      <span
                        style={{
                          color: "var(--spice-text-subdued)",
                          fontSize: "12px",
                        }}
                      >
                        {download.progress}%
                      </span>
                    )}
                  </div>
                  {download.message && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--spice-text-subdued)",
                        marginTop: "4px",
                      }}
                    >
                      {download.message}
                    </div>
                  )}
                  {download.error && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--spice-text-negative)",
                        marginTop: "8px",
                        padding: "8px",
                        backgroundColor: "var(--spice-notification-error)",
                        borderRadius: "4px",
                      }}
                    >
                      {download.error}
                    </div>
                  )}
                </div>
                {download.status === "downloading" && (
                  <button
                    onClick={() => handleCancel(download.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "var(--spice-button)",
                      color: "var(--spice-text)",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    キャンセル
                  </button>
                )}
              </div>
              {download.status === "downloading" && (
                <div
                  style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "var(--spice-border)",
                    borderRadius: "2px",
                    overflow: "hidden",
                    marginTop: "12px",
                  }}
                >
                  <div
                    style={{
                      width: `${download.progress}%`,
                      height: "100%",
                      backgroundColor: "var(--spice-text-bright-accent)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              )}
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--spice-text-subdued)",
                  marginTop: "8px",
                }}
              >
                開始: {new Date(download.started_at).toLocaleString("ja-JP")}
                {download.completed_at &&
                  ` | 完了: ${new Date(download.completed_at).toLocaleString("ja-JP")}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadStatusPage;

