/**
 * Main Spicetify extension for SpiceDL download functionality
 */
import * as API from "./api";
import * as Config from "./config";
import DownloadStatusPage from "./components/DownloadStatusPage";
import SettingsPage from "./components/SettingsPage";
import { t, getI18n } from "./i18n";

const { React, ReactDOM } = Spicetify;

async function main() {
  // Wait for Spicetify to be ready
  while (!Spicetify?.showNotification) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Initialize i18n and set language
  const i18n = getI18n();
  const config = Config.getConfig();
  if (config.language) {
    i18n.setLanguage(config.language);
  } else {
    const detectedLang = i18n.detectLanguage();
    i18n.setLanguage(detectedLang);
    // Save detected language to config
    Config.saveConfig({ language: detectedLang });
  }

  // Check API availability
  const apiAvailable = await API.checkHealth();
  if (!apiAvailable) {
    Spicetify.showNotification(
      t("notifications.apiUnavailable"),
      true
    );
  }

  // Register context menu items for tracks
  const trackDownloadItem = new Spicetify.ContextMenu.Item(
    t("menu.downloadTrack"),
    async (uris) => {
      for (const uri of uris) {
        try {
          // Convert Spotify URI to URL
          const url = convertUriToUrl(uri);
          if (!url) {
            Spicetify.showNotification(t("notifications.invalidUri"), true);
            continue;
          }

          const response = await API.startDownload(url);
          Spicetify.showNotification(
            t("notifications.downloadStarted", { id: response.download_id })
          );
        } catch (error) {
          console.error("Download error:", error);
          Spicetify.showNotification(
            error instanceof Error
              ? error.message
              : t("notifications.downloadFailed"),
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
    t("menu.downloadAlbum"),
    async (uris) => {
      for (const uri of uris) {
        try {
          const url = convertUriToUrl(uri);
          if (!url) {
            Spicetify.showNotification(t("notifications.invalidUri"), true);
            continue;
          }

          const response = await API.startDownload(url);
          Spicetify.showNotification(
            t("notifications.albumDownloadStarted", { id: response.download_id })
          );
        } catch (error) {
          console.error("Download error:", error);
          Spicetify.showNotification(
            error instanceof Error
              ? error.message
              : t("notifications.downloadFailed"),
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
    t("menu.downloadPlaylist"),
    async (uris) => {
      for (const uri of uris) {
        try {
          const url = convertUriToUrl(uri);
          if (!url) {
            Spicetify.showNotification(t("notifications.invalidUri"), true);
            continue;
          }

          const response = await API.startDownload(url);
          Spicetify.showNotification(
            t("notifications.playlistDownloadStarted", { id: response.download_id })
          );
        } catch (error) {
          console.error("Download error:", error);
          Spicetify.showNotification(
            error instanceof Error
              ? error.message
              : t("notifications.downloadFailed"),
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
    t("menu.downloadStatus"),
    false,
    () => {
      showDownloadStatusModal();
    },
    "download"
  );
  statusMenuItem.register();

  // Add menu item to open extension settings
  const extensionSettingsMenuItem = new Spicetify.Menu.Item(
    t("menu.settings"),
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
      title: t("ui.title"),
      content: container,
      isLarge: true,
    });

    // Cleanup when modal is closed using MutationObserver
    const observer = new MutationObserver((mutations) => {
      if (!document.body.contains(container)) {
        // Modal was closed, unmount React component
        ReactDOM.unmountComponentAtNode(container);
        observer.disconnect();
      }
    });

    // Observe the document body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also monitor with interval as fallback
    const checkModalClosed = setInterval(() => {
      if (!document.body.contains(container)) {
        // Modal was closed, unmount React component
        ReactDOM.unmountComponentAtNode(container);
        observer.disconnect();
        clearInterval(checkModalClosed);
      }
    }, 500);

    // Cleanup after 5 minutes (safety timeout)
    setTimeout(() => {
      observer.disconnect();
      clearInterval(checkModalClosed);
    }, 5 * 60 * 1000);
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
      title: t("settings.title"),
      content: container,
      isLarge: false,
    });
  }

  // Alternative: Use React Router if available
  // For Spicetify Creator, we can create a custom app using React components
  // The custom app will be accessible via the sidebar

  console.log("SpiceDL extension loaded successfully");
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
