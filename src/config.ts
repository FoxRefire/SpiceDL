/**
 * Configuration management for the extension
 */

const CONFIG_KEY = "spicedl_config";
const DEFAULT_CONFIG = {
  apiPort: 5985,
  apiHost: "127.0.0.1",
  language: undefined as string | undefined, // undefined means auto-detect
};

export interface ExtensionConfig {
  apiPort: number;
  apiHost: string;
  language?: string;
}

/**
 * Get the API base URL from configuration
 */
export function getApiBaseUrl(): string {
  const config = getConfig();
  return `http://${config.apiHost}:${config.apiPort}`;
}

/**
 * Get current configuration
 */
export function getConfig(): ExtensionConfig {
  try {
    const stored = Spicetify.LocalStorage.get(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    }
  } catch (error) {
    console.error("Error loading config:", error);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save configuration
 */
export function saveConfig(config: Partial<ExtensionConfig>): void {
  try {
    const current = getConfig();
    const newConfig = {
      ...current,
      ...config,
    };
    Spicetify.LocalStorage.set(CONFIG_KEY, JSON.stringify(newConfig));
  } catch (error) {
    console.error("Error saving config:", error);
    throw error;
  }
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  try {
    Spicetify.LocalStorage.remove(CONFIG_KEY);
  } catch (error) {
    console.error("Error resetting config:", error);
  }
}

