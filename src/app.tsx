/**
 * Main Spicetify extension for spotDL download functionality
 */
import * as API from "./api";
import DownloadStatusPage from "./components/DownloadStatusPage";
import SettingsPage from "./components/SettingsPage";

const { React, ReactDOM } = Spicetify;

async function main() {
  // Wait for Spicetify to be ready
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Check API availability
  const apiAvailable = await API.checkHealth();
  if (!apiAvailable) {
    Spicetify.showNotification(
      "spotDL APIサーバーに接続できません。サーバーが起動しているか確認してください。",
      true
    );
  }

  // Register context menu items for tracks
  const trackDownloadItem = new Spicetify.ContextMenu.Item(
    "Download with spotDL",
    async (uris) => {
      for (const uri of uris) {
        try {
          // Convert Spotify URI to URL
          const url = convertUriToUrl(uri);
          if (!url) {
            Spicetify.showNotification("無効なURIです", true);
            continue;
          }

          const response = await API.startDownload(url);
          Spicetify.showNotification(
            `ダウンロードを開始しました: ${response.download_id}`
          );
        } catch (error) {
          console.error("Download error:", error);
          Spicetify.showNotification(
            error instanceof Error
              ? error.message
              : "ダウンロードの開始に失敗しました",
            true
          );
        }
      }
    },
    (uris) => {
      // Only show for track URIs
      return uris.some((uri) => uri.startsWith("spotify:track:"));
    },
    "download"
  );
  trackDownloadItem.register();

  // Register context menu items for albums
  const albumDownloadItem = new Spicetify.ContextMenu.Item(
    "Download Album with spotDL",
    async (uris) => {
      for (const uri of uris) {
        try {
          const url = convertUriToUrl(uri);
          if (!url) {
            Spicetify.showNotification("無効なURIです", true);
            continue;
          }

          const response = await API.startDownload(url);
          Spicetify.showNotification(
            `アルバムのダウンロードを開始しました: ${response.download_id}`
          );
        } catch (error) {
          console.error("Download error:", error);
          Spicetify.showNotification(
            error instanceof Error
              ? error.message
              : "ダウンロードの開始に失敗しました",
            true
          );
        }
      }
    },
    (uris) => {
      // Only show for album URIs
      return uris.some((uri) => uri.startsWith("spotify:album:"));
    },
    "download"
  );
  albumDownloadItem.register();

  // Register context menu items for playlists
  const playlistDownloadItem = new Spicetify.ContextMenu.Item(
    "Download Playlist with spotDL",
    async (uris) => {
      for (const uri of uris) {
        try {
          const url = convertUriToUrl(uri);
          if (!url) {
            Spicetify.showNotification("無効なURIです", true);
            continue;
          }

          const response = await API.startDownload(url);
          Spicetify.showNotification(
            `プレイリストのダウンロードを開始しました: ${response.download_id}`
          );
        } catch (error) {
          console.error("Download error:", error);
          Spicetify.showNotification(
            error instanceof Error
              ? error.message
              : "ダウンロードの開始に失敗しました",
            true
          );
        }
      }
    },
    (uris) => {
      // Only show for playlist URIs
      return uris.some((uri) => uri.startsWith("spotify:playlist:"));
    },
    "download"
  );
  playlistDownloadItem.register();

  // Add menu item to show download status in popup modal
  const statusMenuItem = new Spicetify.Menu.Item(
    "Download Status",
    false,
    () => {
      showDownloadStatusModal();
    },
    "download"
  );
  statusMenuItem.register();

  // Add menu item to open extension settings
  const extensionSettingsMenuItem = new Spicetify.Menu.Item(
    "spotDL Settings",
    false,
    () => {
      showExtensionSettingsModal();
    },
    "edit"
  );
  extensionSettingsMenuItem.register();

  /**
   * Show download status in a popup modal
   */
  function showDownloadStatusModal() {
    // Create a container for the React component
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";

    // Render the React component
    ReactDOM.render(React.createElement(DownloadStatusPage), container);

    // Show in popup modal
    Spicetify.PopupModal.display({
      title: "ダウンロード状況",
      content: container,
      isLarge: true,
    });
  }

  /**
   * Show extension settings in a popup modal
   */
  function showExtensionSettingsModal() {
    // Create a container for the React component
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";

    // Render the React component
    ReactDOM.render(React.createElement(SettingsPage), container);

    // Show in popup modal
    Spicetify.PopupModal.display({
      title: "spotDL 拡張機能設定",
      content: container,
      isLarge: false,
    });
  }

  // Alternative: Use React Router if available
  // For Spicetify Creator, we can create a custom app using React components
  // The custom app will be accessible via the sidebar

  console.log("spotDL extension loaded successfully");
}

/**
 * Convert Spotify URI to URL
 */
function convertUriToUrl(uri: string): string | null {
  // URI format: spotify:track:4cOdK2wGLETKBW3PvgPWqT
  // URL format: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT

  const parts = uri.split(":");
  if (parts.length !== 3 || parts[0] !== "spotify") {
    return null;
  }

  const type = parts[1]; // track, album, playlist, artist
  const id = parts[2];

  return `https://open.spotify.com/${type}/${id}`;
}

export default main;
