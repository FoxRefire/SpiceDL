/**
 * Download status page component
 */
import * as API from "../api";

const { React } = Spicetify;
const { useState, useEffect } = React;

interface DownloadStatusPageProps {
  [key: string]: any;
}

interface TrackMetadata {
  name: string;
  artist?: string;
  album?: string;
  imageUrl?: string;
  uri?: string;
  type?: string; // track, album, playlist
}

const DownloadStatusPage: React.FC<DownloadStatusPageProps> = () => {
  const [downloads, setDownloads] = useState<API.DownloadStatus[]>([]);
  const [metadataCache, setMetadataCache] = useState<Record<string, TrackMetadata>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [filter, setFilter] = useState<string>("all"); // all, active, completed, failed

  // Convert URL to URI
  const urlToUri = (url: string): string | null => {
    try {
      const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
      if (match) {
        return `spotify:${match[1]}:${match[2]}`;
      }
    } catch (e) {
      console.error("Error converting URL to URI:", e);
    }
    return null;
  };

  // Fetch metadata for a Spotify URI using CosmosAPI
  const fetchMetadata = async (url: string): Promise<TrackMetadata | null> => {
    const uri = urlToUri(url);
    if (!uri) return null;

    // Return cached if available
    if (metadataCache[url]) {
      return metadataCache[url];
    }

    try {
      const type = uri.split(":")[1];
      let metadata: TrackMetadata | null = null;

      // Use CosmosAsync API to fetch metadata from Spotify Web API
      try {
        // Try CosmosAsync first (recommended)
        if (Spicetify.CosmosAsync) {
          const id = uri.split(":")[2];
          let response: any = null;
          
          if (type === "track") {
            // Get track metadata from Spotify Web API
            response = await Spicetify.CosmosAsync.get(
              `https://api.spotify.com/v1/tracks/${id}`
            );
            
            if (response) {
              const album = response.album;
              const artists = response.artists || [];
              const artist = artists[0];
              
              metadata = {
                name: response.name || "Unknown Track",
                artist: artist?.name || "Unknown Artist",
                album: album?.name || "Unknown Album",
                imageUrl: album?.images?.[0]?.url || album?.images?.[1]?.url || album?.images?.[2]?.url,
                uri: uri,
                type: "track",
              };
            }
          } else if (type === "album") {
            // Get album metadata from Spotify Web API
            response = await Spicetify.CosmosAsync.get(
              `https://api.spotify.com/v1/albums/${id}`
            );
            
            if (response) {
              const artists = response.artists || [];
              const artist = artists[0];
              
              metadata = {
                name: response.name || "Unknown Album",
                artist: artist?.name || "Unknown Artist",
                album: response.name,
                imageUrl: response.images?.[0]?.url || response.images?.[1]?.url || response.images?.[2]?.url,
                uri: uri,
                type: "album",
              };
            }
          } else if (type === "playlist") {
            // Get playlist metadata from Spotify Web API
            response = await Spicetify.CosmosAsync.get(
              `https://api.spotify.com/v1/playlists/${id}`
            );
            
            if (response) {
              const owner = response.owner;
              
              metadata = {
                name: response.name || "Unknown Playlist",
                artist: owner?.display_name || owner?.name || "Unknown Owner",
                album: response.name,
                imageUrl: response.images?.[0]?.url || response.images?.[1]?.url || response.images?.[2]?.url,
                uri: uri,
                type: "playlist",
              };
            }
          }
        }
      } catch (cosmosError) {
        console.warn("CosmosAsync failed, trying GraphQL:", cosmosError);
      }

      // Fallback to GraphQL API if CosmosAPI didn't work
      if (!metadata) {
        if (type === "track") {
          try {
            const query = Spicetify.GraphQL.Definitions.browseTrack;
            if (query) {
              const result = await Spicetify.GraphQL.Request(query, { uri });
              
              const track = result?.trackUnion || result?.track || result?.data?.trackUnion || result?.data?.track;
              if (track) {
                const album = track.albumOfTrack || track.album;
                const artists = track.artists?.items || track.artists;
                const artist = Array.isArray(artists) ? artists[0] : artists;
                const artistName = artist?.profile?.name || artist?.name || artist?.displayName;
                
                // Get cover art
                let imageUrl: string | undefined;
                if (album) {
                  const coverArt = album.coverArt || album.cover;
                  if (coverArt) {
                    const sources = coverArt.sources || coverArt.sourcesV2;
                    if (sources && Array.isArray(sources)) {
                      imageUrl = sources[2]?.url || sources[0]?.url || sources[1]?.url;
                    }
                    if (!imageUrl) {
                      imageUrl = coverArt.image?.url || coverArt.url;
                    }
                  }
                  if (!imageUrl) {
                    const images = album.images?.items || album.images;
                    if (images && Array.isArray(images) && images.length > 0) {
                      const image = images[0];
                      const imageSources = image?.sources || image?.sourcesV2;
                      if (imageSources && Array.isArray(imageSources)) {
                        imageUrl = imageSources[2]?.url || imageSources[0]?.url || imageSources[1]?.url;
                      }
                      if (!imageUrl) {
                        imageUrl = image?.url;
                      }
                    }
                  }
                }
                
                metadata = {
                  name: track.name || "Unknown Track",
                  artist: artistName || "Unknown Artist",
                  album: album?.name || "Unknown Album",
                  imageUrl: imageUrl,
                  uri: uri,
                  type: "track",
                };
              }
            }
          } catch (e) {
            console.warn("GraphQL track fetch failed:", e);
          }
        } else if (type === "album") {
          try {
            const query = Spicetify.GraphQL.Definitions.browseAlbum;
            if (query) {
              const result = await Spicetify.GraphQL.Request(query, { uri });
              
              const album = result?.albumUnion || result?.album || result?.data?.albumUnion || result?.data?.album;
              if (album) {
                const artists = album.artists?.items || album.artists;
                const artist = Array.isArray(artists) ? artists[0] : artists;
                const artistName = artist?.profile?.name || artist?.name || artist?.displayName;
                
                // Get cover art
                let imageUrl: string | undefined;
                const coverArt = album.coverArt || album.cover;
                if (coverArt) {
                  const sources = coverArt.sources || coverArt.sourcesV2;
                  if (sources && Array.isArray(sources)) {
                    imageUrl = sources[2]?.url || sources[0]?.url || sources[1]?.url;
                  }
                  if (!imageUrl) {
                    imageUrl = coverArt.image?.url || coverArt.url;
                  }
                }
                if (!imageUrl) {
                  const images = album.images?.items || album.images;
                  if (images && Array.isArray(images) && images.length > 0) {
                    const image = images[0];
                    const imageSources = image?.sources || image?.sourcesV2;
                    if (imageSources && Array.isArray(imageSources)) {
                      imageUrl = imageSources[2]?.url || imageSources[0]?.url || imageSources[1]?.url;
                    }
                    if (!imageUrl) {
                      imageUrl = image?.url;
                    }
                  }
                }
                
                metadata = {
                  name: album.name || "Unknown Album",
                  artist: artistName || "Unknown Artist",
                  album: album.name,
                  imageUrl: imageUrl,
                  uri: uri,
                  type: "album",
                };
              }
            }
          } catch (e) {
            console.warn("GraphQL album fetch failed:", e);
          }
        } else if (type === "playlist") {
          try {
            const query = Spicetify.GraphQL.Definitions.browsePlaylist;
            if (query) {
              const result = await Spicetify.GraphQL.Request(query, { uri });
              
              const playlist = result?.playlistV2 || result?.playlist || result?.data?.playlistV2 || result?.data?.playlist;
              if (playlist) {
                const owner = playlist.owner;
                const ownerName = owner?.name || owner?.displayName || owner?.username;
                
                const images = playlist.images?.items || playlist.images;
                const image = Array.isArray(images) ? images[0] : images;
                let imageUrl: string | undefined;
                if (image) {
                  const imageSources = image?.sources || image?.sourcesV2;
                  if (imageSources && Array.isArray(imageSources)) {
                    imageUrl = imageSources[2]?.url || imageSources[0]?.url || imageSources[1]?.url;
                  }
                  if (!imageUrl) {
                    imageUrl = image?.url;
                  }
                }
                
                metadata = {
                  name: playlist.name || "Unknown Playlist",
                  artist: ownerName || "Unknown Owner",
                  album: playlist.name,
                  imageUrl: imageUrl,
                  uri: uri,
                  type: "playlist",
                };
              }
            }
          } catch (e) {
            console.warn("GraphQL playlist fetch failed:", e);
          }
        }
      }

      // Fallback: Extract basic info from URL
      if (!metadata) {
        const urlParts = url.split("/");
        const name = urlParts[urlParts.length - 1] || "Unknown";
        metadata = {
          name: name,
          artist: "Unknown",
          album: name,
          imageUrl: undefined,
          uri: uri,
          type: type,
        };
      }

      if (metadata) {
        setMetadataCache((prev) => ({ ...prev, [url]: metadata }));
        return metadata;
      }
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }

    return null;
  };

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
      const downloadsList = "downloads" in status ? status.downloads : [status];
      setDownloads(downloadsList);

      // Fetch metadata for all downloads (non-blocking)
      downloadsList.forEach((download) => {
        if (!metadataCache[download.url]) {
          // Set loading state
          setMetadataCache((prev) => ({
            ...prev,
            [download.url]: { name: "読み込み中...", uri: urlToUri(download.url) || undefined },
          }));
          
          fetchMetadata(download.url).then((meta) => {
            if (meta) {
              setMetadataCache((prev) => ({
                ...prev,
                [download.url]: meta,
              }));
            }
          }).catch((err) => {
            console.error("Error fetching metadata:", err);
            setMetadataCache((prev) => ({
              ...prev,
              [download.url]: { name: "メタデータ取得失敗", uri: urlToUri(download.url) || undefined },
            }));
          });
        }
      });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✓";
      case "failed":
        return "✗";
      case "downloading":
        return "↓";
      case "starting":
        return "⟳";
      case "cancelled":
        return "⊘";
      default:
        return "•";
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const baseStyle = {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 10px",
      borderRadius: "12px",
      fontSize: "12px",
      fontWeight: "bold" as const,
    };

    switch (status) {
      case "completed":
        return {
          ...baseStyle,
          backgroundColor: "rgba(30, 215, 96, 0.2)",
          color: "var(--spice-text-positive)",
        };
      case "failed":
        return {
          ...baseStyle,
          backgroundColor: "rgba(244, 33, 46, 0.2)",
          color: "var(--spice-text-negative)",
        };
      case "downloading":
        return {
          ...baseStyle,
          backgroundColor: "rgba(29, 185, 84, 0.2)",
          color: "var(--spice-text-bright-accent)",
        };
      case "starting":
        return {
          ...baseStyle,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          color: "var(--spice-text-base)",
        };
      case "cancelled":
        return {
          ...baseStyle,
          backgroundColor: "rgba(167, 167, 167, 0.2)",
          color: "var(--spice-text-subdued)",
        };
      default:
        return baseStyle;
    }
  };

  const filteredDownloads = downloads.filter((dl) => {
    if (filter === "all") return true;
    if (filter === "active") return dl.status === "downloading" || dl.status === "starting";
    if (filter === "completed") return dl.status === "completed";
    if (filter === "failed") return dl.status === "failed" || dl.status === "cancelled";
    return true;
  });

  const stats = {
    total: downloads.length,
    active: downloads.filter((d) => d.status === "downloading" || d.status === "starting").length,
    completed: downloads.filter((d) => d.status === "completed").length,
    failed: downloads.filter((d) => d.status === "failed" || d.status === "cancelled").length,
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
        padding: "24px",
        height: "100%",
        overflowY: "auto",
        backgroundColor: "var(--spice-main)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap" as const,
          gap: "12px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "bold" }}>
            ダウンロード状況
          </h1>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "14px",
              color: "var(--spice-text-subdued)",
            }}
          >
            {stats.total}件のダウンロード
          </p>
        </div>
        <button
          onClick={fetchStatus}
          style={{
            padding: "10px 20px",
            backgroundColor: "var(--spice-button)",
            color: "var(--spice-text)",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          ⟳ 更新
        </button>
      </div>

      {/* Stats Cards */}
      {downloads.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--spice-card)",
              borderRadius: "8px",
              border: "1px solid var(--spice-border)",
            }}
          >
            <div style={{ fontSize: "24px", fontWeight: "bold" }}>{stats.total}</div>
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>合計</div>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--spice-card)",
              borderRadius: "8px",
              border: "1px solid var(--spice-border)",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "var(--spice-text-bright-accent)",
              }}
            >
              {stats.active}
            </div>
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>実行中</div>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--spice-card)",
              borderRadius: "8px",
              border: "1px solid var(--spice-border)",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "var(--spice-text-positive)",
              }}
            >
              {stats.completed}
            </div>
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>完了</div>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: "var(--spice-card)",
              borderRadius: "8px",
              border: "1px solid var(--spice-border)",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "var(--spice-text-negative)",
              }}
            >
              {stats.failed}
            </div>
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>失敗</div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      {downloads.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "20px",
            flexWrap: "wrap" as const,
          }}
        >
          {[
            { key: "all", label: "すべて" },
            { key: "active", label: "実行中" },
            { key: "completed", label: "完了" },
            { key: "failed", label: "失敗" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "6px 14px",
                backgroundColor: filter === f.key ? "var(--spice-button)" : "var(--spice-card)",
                color: "var(--spice-text)",
                border: `1px solid ${filter === f.key ? "var(--spice-button)" : "var(--spice-border)"}`,
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: filter === f.key ? "bold" : "normal",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (filter !== f.key) {
                  e.currentTarget.style.backgroundColor = "var(--spice-card)";
                  e.currentTarget.style.opacity = "0.8";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== f.key) {
                  e.currentTarget.style.backgroundColor = "var(--spice-card)";
                  e.currentTarget.style.opacity = "1";
                }
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filteredDownloads.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "var(--spice-text-subdued)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📥</div>
          <div style={{ fontSize: "16px", marginBottom: "8px" }}>
            {downloads.length === 0
              ? "ダウンロードがありません"
              : "このフィルターに一致するダウンロードがありません"}
          </div>
          {downloads.length === 0 && (
            <div style={{ fontSize: "14px" }}>
              曲やアルバムを右クリックしてダウンロードを開始してください
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {filteredDownloads.map((download) => {
            const metadata = metadataCache[download.url];
            const imageUrl = metadata?.imageUrl || "https://placehold.co/120x120?text=No+Image";
            
            return (
              <div
                key={download.id}
                style={{
                  display: "flex",
                  gap: "16px",
                  padding: "18px",
                  backgroundColor: "var(--spice-card)",
                  borderRadius: "10px",
                  border: "1px solid var(--spice-border)",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
                }}
              >
                {/* Cover Art */}
                <div
                  style={{
                    flexShrink: 0,
                    width: "120px",
                    height: "120px",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: "var(--spice-border)",
                    position: "relative",
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={metadata?.name || "Cover"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/120x120?text=No+Image";
                    }}
                  />
                  {download.status === "downloading" && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        backgroundColor: "rgba(0, 0, 0, 0.3)",
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
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "var(--spice-text)",
                          marginBottom: "6px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap" as const,
                        }}
                        title={metadata?.name || download.url}
                      >
                        {metadata?.name || "読み込み中..."}
                      </div>
                      {metadata?.artist && (
                        <div
                          style={{
                            fontSize: "14px",
                            color: "var(--spice-text-subdued)",
                            marginBottom: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {metadata.artist}
                        </div>
                      )}
                      {metadata?.album && metadata.album !== metadata.name && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "var(--spice-text-subdued)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap" as const,
                          }}
                        >
                          {metadata.album}
                        </div>
                      )}
                      {!metadata && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--spice-text-subdued)",
                            marginTop: "4px",
                            wordBreak: "break-all" as const,
                            fontFamily: "monospace",
                          }}
                          title={download.url}
                        >
                          {download.url.length > 50
                            ? download.url.substring(0, 50) + "..."
                            : download.url}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          marginTop: "8px",
                          marginBottom: "8px",
                          flexWrap: "wrap" as const,
                        }}
                      >
                    <span style={getStatusBadgeStyle(download.status)}>
                      <span>{getStatusIcon(download.status)}</span>
                      <span>{getStatusText(download.status)}</span>
                    </span>
                    {download.status === "downloading" && (
                      <span
                        style={{
                          color: "var(--spice-text-bright-accent)",
                          fontSize: "14px",
                          fontWeight: "bold",
                        }}
                      >
                        {download.progress}%
                      </span>
                    )}
                  </div>
                  {download.message && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--spice-text-subdued)",
                        marginTop: "6px",
                        fontStyle: "italic",
                      }}
                    >
                      {download.message}
                    </div>
                  )}
                  {download.error && (
                    <details
                      style={{
                        marginTop: "10px",
                        fontSize: "12px",
                      }}
                    >
                      <summary
                        style={{
                          color: "var(--spice-text-negative)",
                          cursor: "pointer",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        エラー詳細
                      </summary>
                      <div
                        style={{
                          padding: "10px",
                          backgroundColor: "rgba(244, 33, 46, 0.1)",
                          borderRadius: "6px",
                          color: "var(--spice-text-negative)",
                          marginTop: "4px",
                          whiteSpace: "pre-wrap" as const,
                          wordBreak: "break-word" as const,
                          fontFamily: "monospace",
                          fontSize: "11px",
                        }}
                      >
                        {download.error}
                      </div>
                    </details>
                  )}
                    </div>
                    {download.status === "downloading" && (
                      <button
                        onClick={() => handleCancel(download.id)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "var(--spice-button)",
                          color: "var(--spice-text)",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "bold",
                          whiteSpace: "nowrap" as const,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.8";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        ⊘ キャンセル
                      </button>
                    )}
                  </div>
                  {download.status === "downloading" && (
                    <div
                      style={{
                        width: "100%",
                        height: "6px",
                        backgroundColor: "var(--spice-border)",
                        borderRadius: "3px",
                        overflow: "hidden",
                        marginTop: "14px",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${download.progress}%`,
                          height: "100%",
                          backgroundColor: "var(--spice-text-bright-accent)",
                          transition: "width 0.3s ease",
                          borderRadius: "3px",
                        }}
                      />
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "11px",
                      color: "var(--spice-text-subdued)",
                      marginTop: "10px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--spice-border)",
                    }}
                  >
                    <span>
                      <strong>開始:</strong> {new Date(download.started_at).toLocaleString("ja-JP")}
                    </span>
                    {download.completed_at && (
                      <span>
                        <strong>完了:</strong> {new Date(download.completed_at).toLocaleString("ja-JP")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DownloadStatusPage;

