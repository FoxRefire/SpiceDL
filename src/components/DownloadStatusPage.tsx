/**
 * Download status page component
 */
import * as API from "../api";
import { t } from "../i18n";

const { React } = Spicetify;
const { useState, useEffect, useMemo, useRef, useCallback } = React;

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
  const [downloads, setDownloads] = useState([] as API.DownloadStatus[]);
  const [metadataCache, setMetadataCache] = useState({} as Record<string, TrackMetadata>);
  const metadataCacheRef = useRef({} as Record<string, TrackMetadata>); // Ref to always have latest cache
  const metadataFetchingRef = useRef(new Set<string>()); // Track URLs being fetched (use ref to avoid re-renders)
  const [metadataFetching, setMetadataFetching] = useState(new Set<string>()); // Track URLs being fetched (for display purposes only)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [filter, setFilter] = useState("all" as string); // all, active, completed, failed
  const imageUrlCache = useRef({} as Record<string, string>); // Cache image URLs to prevent re-rendering
  const isMountedRef = useRef(true); // Track if component is mounted
  const abortControllerRef = useRef(null as AbortController | null); // AbortController for API requests
  const activePromisesRef = useRef(new Set<Promise<any>>()); // Track active promises
  const intervalRef = useRef(null as number | null); // Track interval
  const fetchStatusRef = useRef(null as (() => Promise<void>) | null); // Ref to latest fetchStatus function

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
    // Check if component is still mounted
    if (!isMountedRef.current) {
      return null;
    }

    const uri = urlToUri(url);
    if (!uri) return null;

    // Return cached if available (and not loading/error state) - use ref for latest value
    const cached = metadataCacheRef.current[url];
    if (cached && cached.name !== "Loading..." && cached.name !== "Failed to fetch metadata") {
      return cached;
    }

    // Prevent duplicate requests
    if (metadataFetchingRef.current.has(url)) {
      return cached || null;
    }

    // Mark as fetching
    if (!isMountedRef.current) return null;
    metadataFetchingRef.current.add(url);
    setMetadataFetching(new Set(metadataFetchingRef.current));

    const type = uri.split(":")[1];
    const id = uri.split(":")[2];
    let metadata: TrackMetadata | null = null;

    try {

      // Use CosmosAsync API to fetch metadata from Spotify Web API
      try {
        // Try CosmosAsync first (recommended)
        if (Spicetify.CosmosAsync) {
          let response: any = null;
          
          if (type === "track") {
            // Get track metadata from Spotify Web API
            response = await Spicetify.CosmosAsync.get(
              `https://api.spotify.com/v1/tracks/${id}`
            );
            
            // Check if response is valid (not an error object)
            if (response && response.name && !response.code && !response.error) {
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
            
            // Check if response is valid (not an error object)
            if (response && response.name && !response.code && !response.error) {
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
            
            // Check if response is valid (not an error object)
            if (response && response.name && !response.code && !response.error) {
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
            // Try using GraphQL Definitions directly
            const query = Spicetify.GraphQL?.Definitions?.browseTrack;
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
            } else {
              // Try exploring GraphQL Definitions to find available queries
              // Try getTrackName first to get track name
              let trackName = null;
              let artistName = null;
              let albumName = null;
              let imageUrl = null;
              
              try {
                const trackNameQuery = Spicetify.GraphQL?.Definitions?.['getTrackName'];
                if (trackNameQuery) {
                  const nameResult = await Spicetify.GraphQL.Request(trackNameQuery, { uri });
                  const track = nameResult?.trackUnion || nameResult?.data?.trackUnion || nameResult?.track || nameResult?.data?.track;
                  if (track) {
                    trackName = track.name || track.title;
                  }
                }
              } catch (e) {
                // Continue
              }
              
              // Try queryTrackArtists to get artist information
              try {
                const artistsQuery = Spicetify.GraphQL?.Definitions?.['queryTrackArtists'];
                if (artistsQuery) {
                  const artistsResult = await Spicetify.GraphQL.Request(artistsQuery, { uri });
                  const track = artistsResult?.trackUnion || artistsResult?.data?.trackUnion || artistsResult?.track || artistsResult?.data?.track;
                  if (track?.artists) {
                    const artists = track.artists.items || track.artists;
                    const artist = Array.isArray(artists) ? artists[0] : artists;
                    artistName = artist?.profile?.name || artist?.name || artist?.displayName;
                  }
                  
                  // Try to get album information from queryTrackArtists result (may contain album info)
                  if (track?.albumOfTrack || track?.album) {
                    const album = track.albumOfTrack || track.album;
                    albumName = album.name;
                    // Get cover art
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
                }
              } catch (e) {
                // Continue
              }
              
              // Try getAlbumNameAndTracks to get album information (may fail, but try anyway)
              if (!albumName) {
                try {
                  const albumQuery = Spicetify.GraphQL?.Definitions?.['getAlbumNameAndTracks'];
                  if (albumQuery) {
                    const albumResult = await Spicetify.GraphQL.Request(albumQuery, { uri });
                    if (albumResult && !albumResult.errors) {
                      const album = albumResult?.data?.album || albumResult?.album;
                      if (album) {
                        albumName = album.name;
                        const images = album.images?.items || album.images;
                        if (images && Array.isArray(images) && images.length > 0) {
                          const image = images[0];
                          imageUrl = image?.sources?.[2]?.url || image?.sources?.[0]?.url || image?.url;
                        }
                      }
                    }
                  }
                } catch (e) {
                  // Continue - album query may fail
                }
              }
              
              // Try queryAlbumTracks as alternative
              if (!albumName) {
                try {
                  const albumTracksQuery = Spicetify.GraphQL?.Definitions?.['queryAlbumTracks'];
                  if (albumTracksQuery) {
                    const albumTracksResult = await Spicetify.GraphQL.Request(albumTracksQuery, { uri });
                    const album = albumTracksResult?.album || albumTracksResult?.data?.album;
                    if (album) {
                      albumName = album.name;
                      const images = album.images?.items || album.images;
                      if (images && Array.isArray(images) && images.length > 0) {
                        const image = images[0];
                        imageUrl = image?.sources?.[2]?.url || image?.sources?.[0]?.url || image?.url;
                      }
                    }
                  }
                } catch (e) {
                  // Continue
                }
              }
              
              // Try decorateContextTracks as last resort
              if (!albumName) {
                try {
                  const decorateQuery = Spicetify.GraphQL?.Definitions?.['decorateContextTracks'];
                  if (decorateQuery) {
                    const decorateResult = await Spicetify.GraphQL.Request(decorateQuery, { uris: [uri] });
                    const tracks = decorateResult?.tracks || decorateResult?.data?.tracks;
                    if (tracks && Array.isArray(tracks) && tracks.length > 0) {
                      const track = tracks[0];
                      if (track?.albumOfTrack || track?.album) {
                        const album = track.albumOfTrack || track.album;
                        albumName = album.name;
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
                      }
                    }
                  }
                } catch (e) {
                  // Continue
                }
              }
              
              // Create metadata if we got at least the track name
              if (trackName) {
                metadata = {
                  name: trackName,
                  artist: artistName || "Unknown Artist",
                  album: albumName || "Unknown Album",
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
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) {
          return null;
        }
        const updatedCache = { ...metadataCacheRef.current, [url]: metadata };
        metadataCacheRef.current = updatedCache;
        setMetadataCache(updatedCache);
        metadataFetchingRef.current.delete(url);
        if (isMountedRef.current) {
          setMetadataFetching(new Set(metadataFetchingRef.current));
        }
        return metadata;
      }
    } catch (err) {
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        return null;
      }
      console.error("Error fetching metadata:", err);
      // Set error state only if we don't have valid metadata already
      if (!metadataCacheRef.current[url] || metadataCacheRef.current[url].name === "Loading..." || metadataCacheRef.current[url].name === "Failed to fetch metadata") {
        const updatedCache = { ...metadataCacheRef.current, [url]: { name: "Failed to fetch metadata", uri: uri, type: type } };
        metadataCacheRef.current = updatedCache;
        setMetadataCache(updatedCache);
      }
    } finally {
      // Remove from fetching set only if component is still mounted
      metadataFetchingRef.current.delete(url);
      if (isMountedRef.current) {
        setMetadataFetching(new Set(metadataFetchingRef.current));
      }
    }

    return null;
  };

  const fetchStatus = useCallback(async () => {
    // Check if component is still mounted
    if (!isMountedRef.current) {
      return;
    }

    const healthPromise = API.checkHealth();
    activePromisesRef.current.add(healthPromise);
    
    try {
      const isHealthy = await healthPromise;
      activePromisesRef.current.delete(healthPromise);
      
      // Check again after async operation
      if (!isMountedRef.current) {
        return;
      }
      
      setApiAvailable(isHealthy);

      if (!isHealthy) {
        if (!isMountedRef.current) return;
        setError(t("notifications.apiUnavailable"));
        setLoading(false);
        return;
      }

      const statusPromise = API.getDownloadStatus();
      activePromisesRef.current.add(statusPromise);
      
      const status = await statusPromise;
      activePromisesRef.current.delete(statusPromise);
      
      // Check again after async operation
      if (!isMountedRef.current) {
        return;
      }
      
      const downloadsList = "downloads" in status ? status.downloads : [status];
      setDownloads(downloadsList);

      // Fetch metadata for all downloads (non-blocking)
      // Only fetch if not already cached and not currently fetching
      downloadsList.forEach((download) => {
        // Check if component is still mounted before processing
        if (!isMountedRef.current) {
          return;
        }
        
        // Always use ref to get latest cache value
        const cached = metadataCacheRef.current[download.url];
        const isFetching = metadataFetchingRef.current.has(download.url);
        
        // Only fetch if:
        // 1. Not cached at all, OR
        // 2. Cached but in error state (not loading state - we don't want to overwrite loading state)
        // 3. Not currently fetching
        const hasValidCache = cached && cached.name !== "Loading..." && cached.name !== "Failed to fetch metadata";
        
        if (!hasValidCache && !isFetching) {
          // Only set loading state if we don't have any cache at all
          // Never overwrite valid metadata with "Loading..."
          if (!cached) {
            // Check if component is still mounted before updating state
            if (!isMountedRef.current) {
              return;
            }
            // Check if we already have valid metadata in ref (shouldn't happen, but safety check)
            const refCached = metadataCacheRef.current[download.url];
            if (!refCached || refCached.name === "Loading..." || refCached.name === "Failed to fetch metadata") {
              const updatedCache = { ...metadataCacheRef.current, [download.url]: { name: "Loading...", uri: urlToUri(download.url) || undefined } };
              metadataCacheRef.current = updatedCache;
              setMetadataCache(updatedCache);
            }
          }
          
          const metadataPromise = fetchMetadata(download.url);
          activePromisesRef.current.add(metadataPromise);
          
          const cleanup = () => {
            activePromisesRef.current.delete(metadataPromise);
          };
          
          metadataPromise
            .then(() => {
              cleanup();
            })
            .catch((err) => {
              cleanup();
              // Only log error if component is still mounted
              if (isMountedRef.current) {
                console.error("Error fetching metadata:", err);
              }
            });
        }
      });

      if (!isMountedRef.current) return;
      setError(null);
    } catch (err) {
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        return;
      }
      setError(err instanceof Error ? err.message : t("ui.error"));
      console.error("Error fetching status:", err);
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Store fetchStatus in ref so it's always the latest version
  fetchStatusRef.current = fetchStatus;

  useEffect(() => {
    // Set mounted flag to true
    isMountedRef.current = true;
    
    // Use ref to get latest fetchStatus
    const currentFetchStatus = fetchStatusRef.current;
    if (currentFetchStatus) {
      currentFetchStatus();
    }
    
    const interval = setInterval(() => {
      // Only fetch if component is still mounted
      if (isMountedRef.current) {
        const latestFetchStatus = fetchStatusRef.current;
        if (latestFetchStatus) {
          latestFetchStatus();
        }
      }
    }, 3000); // Update every 3 seconds
    
    intervalRef.current = interval;
    
    return () => {
      // Cleanup: mark component as unmounted FIRST
      isMountedRef.current = false;
      
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Abort any ongoing API requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Clear all active promises (they will check isMountedRef before updating state)
      activePromisesRef.current.clear();
      
      // Clear fetchStatus ref
      fetchStatusRef.current = null;
    };
  }, []); // Empty dependency array - we use ref to get latest function

  const handleCancel = async (downloadId: string) => {
    try {
      await API.cancelDownload(downloadId);
      await fetchStatus();
      Spicetify.showNotification(t("notifications.downloadCancelled"));
    } catch (err) {
      Spicetify.showNotification(
        err instanceof Error ? err.message : t("notifications.cancelFailed"),
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
        return t("ui.starting");
      case "downloading":
        return t("ui.downloading");
      case "completed":
        return t("ui.completedStatus");
      case "failed":
        return t("ui.failedStatus");
      case "cancelled":
        return t("ui.cancelledStatus");
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

  const filteredDownloads = downloads.filter((dl: API.DownloadStatus) => {
    if (filter === "all") return true;
    if (filter === "active") return dl.status === "downloading" || dl.status === "starting";
    if (filter === "completed") return dl.status === "completed";
    if (filter === "failed") return dl.status === "failed";
    if (filter === "cancelled") return dl.status === "cancelled";
    return true;
  });

  const stats = {
    total: downloads.length,
    active: downloads.filter((d: API.DownloadStatus) => d.status === "downloading" || d.status === "starting").length,
    completed: downloads.filter((d: API.DownloadStatus) => d.status === "completed").length,
    failed: downloads.filter((d: API.DownloadStatus) => d.status === "failed").length,
    cancelled: downloads.filter((d: API.DownloadStatus) => d.status === "cancelled").length,
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
        {t("ui.loading")}
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
        <h2>{t("ui.error")}</h2>
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
          {t("ui.retry")}
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
            {t("ui.title")}
          </h1>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "14px",
              color: "var(--spice-text-subdued)",
            }}
          >
            {t("ui.downloads", { count: stats.total })}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <button
            onClick={async () => {
              try {
                await API.openDownloadFolder();
                Spicetify.showNotification(t("notifications.folderOpened"));
              } catch (error) {
                Spicetify.showNotification(
                  error instanceof Error ? error.message : t("notifications.openFolderFailed"),
                  true
                );
              }
            }}
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
            {t("ui.openFolder")}
          </button>
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
            {t("ui.refresh")}
          </button>
        </div>
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
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>{t("ui.total")}</div>
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
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>{t("ui.active")}</div>
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
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>{t("ui.completed")}</div>
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
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>{t("ui.failed")}</div>
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
                color: "var(--spice-text-subdued)",
              }}
            >
              {stats.cancelled}
            </div>
            <div style={{ fontSize: "12px", color: "var(--spice-text-subdued)" }}>{t("ui.cancelled")}</div>
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
            { key: "all", label: t("ui.all") },
            { key: "active", label: t("ui.active") },
            { key: "completed", label: t("ui.completed") },
            { key: "failed", label: t("ui.failed") },
            { key: "cancelled", label: t("ui.cancelled") },
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
              ? t("ui.noDownloads")
              : t("ui.noDownloadsFilter")}
          </div>
          {downloads.length === 0 && (
            <div style={{ fontSize: "14px" }}>
              {t("ui.startDownloading")}
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
          {filteredDownloads.map((download: API.DownloadStatus) => {
            // Use ref to get latest metadata to prevent flickering
            const metadata = metadataCacheRef.current[download.url] || metadataCache[download.url];
            // Use cached image URL if available, otherwise use metadata or placeholder
            const cachedImageUrl = imageUrlCache.current[download.id];
            const newImageUrl = metadata?.imageUrl || "https://placehold.co/120x120?text=No+Image";
            const imageUrl = cachedImageUrl || newImageUrl;
            
            // Update cache if image URL changed
            if (metadata?.imageUrl && imageUrlCache.current[download.id] !== metadata.imageUrl) {
              imageUrlCache.current[download.id] = metadata.imageUrl;
            } else if (!cachedImageUrl) {
              imageUrlCache.current[download.id] = newImageUrl;
            }
            
            // Use metadata if available and valid, otherwise show loading
            // Don't show "Loading..." if we have valid metadata cached
            // Always check ref first to get latest value
            const validMetadata = metadata && metadata.name !== "Loading..." && metadata.name !== "Failed to fetch metadata";
            const displayName = validMetadata
              ? metadata.name
              : metadata?.name === "Loading..."
              ? "Loading..."
              : "Loading...";
            
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
                    key={`img-${download.id}-${imageUrl}`}
                    src={imageUrl}
                    alt={metadata?.name || "Cover"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      const placeholder = "https://placehold.co/120x120?text=No+Image";
                      if (e.currentTarget.src !== placeholder) {
                        imageUrlCache.current[download.id] = placeholder;
                        e.currentTarget.src = placeholder;
                      }
                    }}
                    onLoad={() => {
                      // Image loaded successfully, ensure cache is set
                      if (metadata?.imageUrl && imageUrlCache.current[download.id] !== metadata.imageUrl) {
                        imageUrlCache.current[download.id] = metadata.imageUrl;
                      }
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
                        title={displayName || download.url}
                      >
                        {displayName}
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
                        {download.total_tracks && download.completed_tracks !== undefined
                          ? `${download.progress}% (${download.completed_tracks}/${download.total_tracks})`
                          : `${download.progress}%`}
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
                        {t("ui.errorDetails")}
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
                        {t("ui.cancel")}
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
                      <strong>{t("ui.started")}</strong> {new Date(download.started_at).toLocaleString()}
                    </span>
                    {download.completed_at && (
                      <span>
                        <strong>{t("ui.completedTime")}</strong> {new Date(download.completed_at).toLocaleString()}
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

