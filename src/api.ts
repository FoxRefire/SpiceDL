/**
 * API client for spotDL download service
 */
import { getApiBaseUrl } from "./config";

export interface DownloadResponse {
  success: boolean;
  download_id: string;
  message: string;
}

export interface DownloadStatus {
  id: string;
  url: string;
  status: "starting" | "downloading" | "completed" | "failed" | "cancelled";
  progress: number;
  message: string;
  started_at: string;
  completed_at: string | null;
  error: string | null;
}

export interface AllStatusResponse {
  downloads: DownloadStatus[];
  total: number;
}

/**
 * Start a download from Spotify URL
 */
export async function startDownload(url: string): Promise<DownloadResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error starting download:", error);
    throw error;
  }
}

/**
 * Get download status
 */
export async function getDownloadStatus(
  downloadId?: string
): Promise<DownloadStatus | AllStatusResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = downloadId
      ? `${baseUrl}/status?id=${encodeURIComponent(downloadId)}`
      : `${baseUrl}/status`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting download status:", error);
    throw error;
  }
}

/**
 * Cancel a download
 */
export async function cancelDownload(downloadId: string): Promise<void> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: downloadId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error cancelling download:", error);
    throw error;
  }
}

/**
 * Check if API server is available
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Open GUI settings window
 */
export async function openSettings(): Promise<void> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/open-settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error opening settings:", error);
    throw error;
  }
}

