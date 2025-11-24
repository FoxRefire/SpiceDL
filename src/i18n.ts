/**
 * Internationalization (i18n) support for the extension
 */

interface LocaleData {
  [key: string]: string | LocaleData;
}

class I18n {
  private currentLanguage: string = "en";
  private translations: Map<string, LocaleData> = new Map();
  private localeDir: string = "locales";

  constructor() {
    this.loadLanguage("en");
  }

  /**
   * Set the current language
   */
  setLanguage(lang: string): void {
    if (lang !== this.currentLanguage) {
      this.currentLanguage = lang;
      this.loadLanguage(lang);
    }
  }

  /**
   * Get the current language code
   */
  getLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Detect system language from Spicetify or browser
   * @returns Language code or null if detection failed
   */
  detectLanguage(): string | null {
    try {
      // Try to get language from Spicetify Locale
      // Check multiple ways to get the locale
      let locale: string | null = null;
      
      if (Spicetify?.Locale) {
        try {
          // Method 1: Try getLocale() method
          if (typeof Spicetify.Locale.getLocale === "function") {
            locale = Spicetify.Locale.getLocale();
          }
          // Method 2: Try accessing _locale directly (internal property)
          if (!locale && (Spicetify.Locale as any)._locale) {
            locale = (Spicetify.Locale as any)._locale;
          }
          // Method 3: Try getUrlLocale() as fallback
          if (!locale && typeof Spicetify.Locale.getUrlLocale === "function") {
            const urlLocale = Spicetify.Locale.getUrlLocale();
            if (urlLocale) {
              locale = urlLocale;
            }
          }
        } catch (e) {
          console.warn("Error getting locale from Spicetify.Locale:", e);
        }
      }
      
      if (locale) {
        const lang = locale.split("-")[0].toLowerCase();
        // Check if we have translations for this language
        if (this.hasLanguage(lang)) {
          return lang;
        }
      }

      // Fallback to browser language
      const browserLang = navigator.language || (navigator as any).userLanguage;
      if (browserLang) {
        const lang = browserLang.split("-")[0].toLowerCase();
        if (this.hasLanguage(lang)) {
          return lang;
        }
      }
    } catch (e) {
      console.warn("Error detecting language:", e);
    }

    return null; // Return null to indicate detection failed, let caller use fallback
  }

  /**
   * Check if we have translations for a language
   */
  hasLanguage(lang: string): boolean {
    // For now, we'll check if the language file exists by trying to load it
    // In a real implementation, you might want to maintain a list of available languages
    return lang === "en" || lang === "ja";
  }

  /**
   * Load translations for a language
   */
  private loadLanguage(lang: string): void {
    try {
      // In Spicetify extensions, we can't use dynamic imports easily
      // So we'll use a different approach - load from a known location
      // For now, we'll use a synchronous approach with require or fetch
      // Since this is a Spicetify extension, we'll need to load translations differently
      
      // Try to get translations from localStorage first (pre-loaded)
      const stored = localStorage.getItem(`spicedl_i18n_${lang}`);
      if (stored) {
        try {
          const translations = JSON.parse(stored);
          this.translations.set(lang, translations);
          return;
        } catch (e) {
          console.warn(`Failed to parse stored translations for ${lang}:`, e);
        }
      }

      // If not in localStorage, we'll need to load it
      // For Spicetify extensions, translations should be bundled
      // We'll use a fallback mechanism
      if (lang === "en") {
        // English is the default, always available
        this.translations.set(lang, this.getDefaultEnglishTranslations());
      } else if (lang === "ja") {
        this.translations.set(lang, this.getDefaultJapaneseTranslations());
      } else {
        // Fallback to English
        this.translations.set(lang, this.getDefaultEnglishTranslations());
        this.currentLanguage = "en";
      }
    } catch (e) {
      console.error(`Error loading language ${lang}:`, e);
      // Fallback to English
      if (lang !== "en") {
        this.loadLanguage("en");
        this.currentLanguage = "en";
      }
    }
  }

  /**
   * Get default English translations
   */
  private getDefaultEnglishTranslations(): LocaleData {
    return {
      ui: {
        title: "Download Status",
        downloads: "{count} downloads",
        openFolder: "📁 Open Download Folder",
        refresh: "⟳ Refresh",
        total: "Total",
        active: "Active",
        completed: "Completed",
        failed: "Failed",
        cancelled: "Cancelled",
        all: "All",
        noDownloads: "No downloads",
        noDownloadsFilter: "No downloads match this filter",
        startDownloading: "Right-click on tracks or albums to start downloading",
        loading: "Loading...",
        error: "Error",
        retry: "Retry",
        cancel: "⊘ Cancel",
        started: "Started:",
        completedTime: "Completed:",
        errorDetails: "Error Details",
        starting: "Starting",
        downloading: "Downloading",
        completedStatus: "Completed",
        failedStatus: "Failed",
        cancelledStatus: "Cancelled",
      },
      menu: {
        downloadTrack: "Download with SpiceDL",
        downloadAlbum: "Download Album with SpiceDL",
        downloadPlaylist: "Download Playlist with SpiceDL",
        downloadStatus: "Download Status",
        settings: "SpiceDL Settings",
      },
      notifications: {
        apiUnavailable: "Cannot connect to SpiceDL API server. Please check if the server is running.",
        invalidUri: "Invalid URI",
        downloadStarted: "Download started: {id}",
        albumDownloadStarted: "Album download started: {id}",
        playlistDownloadStarted: "Playlist download started: {id}",
        downloadCancelled: "Download cancelled",
        downloadFailed: "Failed to start download",
        cancelFailed: "Failed to cancel",
        folderOpened: "Download folder opened",
        openFolderFailed: "Failed to open folder",
        settingsSaved: "Settings saved",
        settingsReset: "Settings reset",
        apiSettingsOpened: "API server settings window opened",
        apiSettingsFailed: "Failed to open API server settings window",
      },
      settings: {
        title: "SpiceDL Extension Settings",
        apiHost: "API Server Host",
        apiPort: "API Server Port",
        save: "Save",
        reset: "Reset",
        portRange: "Port number must be between 1 and 65535",
        hostRequired: "Please enter a host name",
        saveFailed: "Failed to save settings",
        apiServerSettings: "API Server Settings",
        apiServerSettingsDesc: "To change API server settings such as download folder and port, click the button below.",
        openApiServerSettings: "Open API Server Settings",
        currentSettings: "Current Settings:",
        apiUrl: "API URL:",
      },
    };
  }

  /**
   * Get default Japanese translations
   */
  private getDefaultJapaneseTranslations(): LocaleData {
    return {
      ui: {
        title: "ダウンロードステータス",
        downloads: "{count} 件のダウンロード",
        openFolder: "📁 ダウンロードフォルダを開く",
        refresh: "⟳ 更新",
        total: "合計",
        active: "アクティブ",
        completed: "完了",
        failed: "失敗",
        cancelled: "キャンセル",
        all: "すべて",
        noDownloads: "ダウンロードなし",
        noDownloadsFilter: "このフィルターに一致するダウンロードがありません",
        startDownloading: "トラックやアルバムを右クリックしてダウンロードを開始",
        loading: "読み込み中...",
        error: "エラー",
        retry: "再試行",
        cancel: "⊘ キャンセル",
        started: "開始:",
        completedTime: "完了:",
        errorDetails: "エラー詳細",
        starting: "開始中",
        downloading: "ダウンロード中",
        completedStatus: "完了",
        failedStatus: "失敗",
        cancelledStatus: "キャンセル",
      },
      menu: {
        downloadTrack: "SpiceDLでダウンロード",
        downloadAlbum: "SpiceDLでアルバムをダウンロード",
        downloadPlaylist: "SpiceDLでプレイリストをダウンロード",
        downloadStatus: "ダウンロードステータス",
        settings: "SpiceDL設定",
      },
      notifications: {
        apiUnavailable: "SpiceDL APIサーバーに接続できません。サーバーが実行されているか確認してください。",
        invalidUri: "無効なURI",
        downloadStarted: "ダウンロードを開始しました: {id}",
        albumDownloadStarted: "アルバムのダウンロードを開始しました: {id}",
        playlistDownloadStarted: "プレイリストのダウンロードを開始しました: {id}",
        downloadCancelled: "ダウンロードをキャンセルしました",
        downloadFailed: "ダウンロードの開始に失敗しました",
        cancelFailed: "キャンセルに失敗しました",
        folderOpened: "ダウンロードフォルダを開きました",
        openFolderFailed: "フォルダを開けませんでした",
        settingsSaved: "設定を保存しました",
        settingsReset: "設定をリセットしました",
        apiSettingsOpened: "APIサーバー設定ウィンドウを開きました",
        apiSettingsFailed: "APIサーバー設定ウィンドウを開けませんでした",
      },
      settings: {
        title: "SpiceDL拡張機能設定",
        apiHost: "APIサーバーホスト",
        apiPort: "APIサーバーポート",
        save: "保存",
        reset: "リセット",
        portRange: "ポート番号は1から65535の間である必要があります",
        hostRequired: "ホスト名を入力してください",
        saveFailed: "設定の保存に失敗しました",
        apiServerSettings: "APIサーバー設定",
        apiServerSettingsDesc: "ダウンロードフォルダやポートなどのAPIサーバー設定を変更するには、下のボタンをクリックしてください。",
        openApiServerSettings: "APIサーバー設定を開く",
        currentSettings: "現在の設定:",
        apiUrl: "API URL:",
      },
    };
  }

  /**
   * Translate a key
   */
  t(key: string, params?: Record<string, string | number>): string {
    const translations = this.translations.get(this.currentLanguage) || {};
    
    // Support dot notation for nested keys
    let value: any = translations;
    for (const part of key.split(".")) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        // If translation not found, try English as fallback
        if (this.currentLanguage !== "en") {
          const enTranslations = this.translations.get("en") || {};
          value = enTranslations;
          for (const part2 of key.split(".")) {
            if (value && typeof value === "object" && part2 in value) {
              value = value[part2];
            } else {
              value = null;
              break;
            }
          }
        } else {
          value = null;
        }
        break;
      }
    }

    // If still not found, return the key
    if (value === null || typeof value !== "string") {
      return key;
    }

    // Format the string if params are provided
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
    }

    return value;
  }
}

// Global i18n instance
let i18nInstance: I18n | null = null;

/**
 * Get the global i18n instance
 */
export function getI18n(): I18n {
  if (!i18nInstance) {
    i18nInstance = new I18n();
    // Try to detect and set language
    const detectedLang = i18nInstance.detectLanguage();
    if (detectedLang) {
      i18nInstance.setLanguage(detectedLang);
    }
  }
  return i18nInstance;
}

/**
 * Convenience function to translate a key
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return getI18n().t(key, params);
}

/**
 * Set the current language
 */
export function setLanguage(lang: string | null): void {
  if (lang) {
    getI18n().setLanguage(lang);
  }
}

/**
 * Get the current language
 */
export function getLanguage(): string {
  return getI18n().getLanguage();
}

