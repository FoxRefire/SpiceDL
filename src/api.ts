/**
 * API client for spotDL download service
 */

const API_BASE_URL = "http://127.0.0.1:5985";

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
    const response = await fetch(`${API_BASE_URL}/download`, {
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
    const url = downloadId
      ? `${API_BASE_URL}/status?id=${encodeURIComponent(downloadId)}`
      : `${API_BASE_URL}/status`;

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
    const response = await fetch(`${API_BASE_URL}/cancel`, {
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
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

