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
   * @returns Language code (defaults to "en" if unsupported language detected)
   */
  detectLanguage(): string {
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
        // Handle Chinese variants: zh-CN, zh-TW
        if (locale.toLowerCase().startsWith("zh")) {
          if (locale.includes("TW") || locale.includes("HK") || locale.includes("MO") || locale.includes("Hant")) {
            return "zh-TW";
          } else {
            return "zh-CN";
          }
        }
        const lang = locale.split("-")[0].toLowerCase();
        // Check if we have translations for this language
        if (this.hasLanguage(lang)) {
          return lang;
        }
      }

      // Fallback to browser language
      const browserLang = navigator.language || (navigator as any).userLanguage;
      if (browserLang) {
        // Handle Chinese variants: zh-CN, zh-TW
        if (browserLang.toLowerCase().startsWith("zh")) {
          if (browserLang.includes("TW") || browserLang.includes("HK") || browserLang.includes("MO") || browserLang.includes("Hant")) {
            return "zh-TW";
          } else {
            return "zh-CN";
          }
        }
        const lang = browserLang.split("-")[0].toLowerCase();
        if (this.hasLanguage(lang)) {
          return lang;
        }
      }
    } catch (e) {
      console.warn("Error detecting language:", e);
    }

    // If no supported language detected, default to English
    return "en";
  }

  /**
   * Check if we have translations for a language
   */
  hasLanguage(lang: string): boolean {
    // List of supported languages
    const supported = [
      "en", "ja", "es", "it", "fr", "ru",
      "zh", "zh-CN", "zh_CN", "zh-TW", "zh_TW"
    ];
    return supported.includes(lang);
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
      } else if (lang === "es") {
        this.translations.set(lang, this.getDefaultSpanishTranslations());
      } else if (lang === "it") {
        this.translations.set(lang, this.getDefaultItalianTranslations());
      } else if (lang === "fr") {
        this.translations.set(lang, this.getDefaultFrenchTranslations());
      } else if (lang === "ru") {
        this.translations.set(lang, this.getDefaultRussianTranslations());
      } else if (lang === "zh-CN" || lang === "zh_CN" || lang === "zh") {
        this.translations.set("zh-CN", this.getDefaultSimplifiedChineseTranslations());
        this.currentLanguage = "zh-CN";
      } else if (lang === "zh-TW" || lang === "zh_TW") {
        this.translations.set("zh-TW", this.getDefaultTraditionalChineseTranslations());
        this.currentLanguage = "zh-TW";
      } else {
        // Fallback to English for unsupported languages
        console.warn(`Language "${lang}" is not supported, falling back to English`);
        this.translations.set("en", this.getDefaultEnglishTranslations());
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
      },
    };
  }

  /**
   * Get default Spanish translations
   */
  private getDefaultSpanishTranslations(): LocaleData {
    return {
      ui: {
        title: "Estado de Descarga",
        downloads: "{count} descargas",
        openFolder: "📁 Abrir Carpeta de Descarga",
        refresh: "⟳ Actualizar",
        total: "Total",
        active: "Activo",
        completed: "Completado",
        failed: "Fallido",
        cancelled: "Cancelado",
        all: "Todos",
        noDownloads: "Sin descargas",
        noDownloadsFilter: "No hay descargas que coincidan con este filtro",
        startDownloading: "Haga clic derecho en pistas o álbumes para comenzar a descargar",
        loading: "Cargando...",
        error: "Error",
        retry: "Reintentar",
        cancel: "⊘ Cancelar",
        started: "Iniciado:",
        completedTime: "Completado:",
        errorDetails: "Detalles del Error",
        starting: "Iniciando",
        downloading: "Descargando",
        completedStatus: "Completado",
        failedStatus: "Fallido",
        cancelledStatus: "Cancelado",
      },
      menu: {
        downloadTrack: "Descargar con SpiceDL",
        downloadAlbum: "Descargar Álbum con SpiceDL",
        downloadPlaylist: "Descargar Lista de Reproducción con SpiceDL",
        downloadStatus: "Estado de Descarga",
        settings: "Configuración de SpiceDL",
      },
      notifications: {
        apiUnavailable: "No se puede conectar al servidor API de SpiceDL. Por favor, verifique si el servidor está en ejecución.",
        invalidUri: "URI inválido",
        downloadStarted: "Descarga iniciada: {id}",
        albumDownloadStarted: "Descarga de álbum iniciada: {id}",
        playlistDownloadStarted: "Descarga de lista de reproducción iniciada: {id}",
        downloadCancelled: "Descarga cancelada",
        downloadFailed: "Error al iniciar la descarga",
        cancelFailed: "Error al cancelar",
        folderOpened: "Carpeta de descarga abierta",
        openFolderFailed: "Error al abrir la carpeta",
        settingsSaved: "Configuración guardada",
        settingsReset: "Configuración restablecida",
        apiSettingsOpened: "Ventana de configuración del servidor API abierta",
        apiSettingsFailed: "Error al abrir la ventana de configuración del servidor API",
      },
      settings: {
        title: "Configuración de Extensión SpiceDL",
        apiHost: "Host del Servidor API",
        apiPort: "Puerto del Servidor API",
        save: "Guardar",
        reset: "Restablecer",
        portRange: "El número de puerto debe estar entre 1 y 65535",
        hostRequired: "Por favor, ingrese un nombre de host",
        saveFailed: "Error al guardar la configuración",
        apiServerSettings: "Configuración del Servidor API",
        apiServerSettingsDesc: "Para cambiar la configuración del servidor API como la carpeta de descarga y el puerto, haga clic en el botón de abajo.",
        openApiServerSettings: "Abrir Configuración del Servidor API",
      },
    };
  }

  /**
   * Get default Italian translations
   */
  private getDefaultItalianTranslations(): LocaleData {
    return {
      ui: {
        title: "Stato Download",
        downloads: "{count} download",
        openFolder: "📁 Apri Cartella Download",
        refresh: "⟳ Aggiorna",
        total: "Totale",
        active: "Attivo",
        completed: "Completato",
        failed: "Fallito",
        cancelled: "Annullato",
        all: "Tutti",
        noDownloads: "Nessun download",
        noDownloadsFilter: "Nessun download corrisponde a questo filtro",
        startDownloading: "Fare clic destro su tracce o album per iniziare il download",
        loading: "Caricamento...",
        error: "Errore",
        retry: "Riprova",
        cancel: "⊘ Annulla",
        started: "Iniziato:",
        completedTime: "Completato:",
        errorDetails: "Dettagli Errore",
        starting: "Iniziando",
        downloading: "Scaricando",
        completedStatus: "Completato",
        failedStatus: "Fallito",
        cancelledStatus: "Annullato",
      },
      menu: {
        downloadTrack: "Scarica con SpiceDL",
        downloadAlbum: "Scarica Album con SpiceDL",
        downloadPlaylist: "Scarica Playlist con SpiceDL",
        downloadStatus: "Stato Download",
        settings: "Impostazioni SpiceDL",
      },
      notifications: {
        apiUnavailable: "Impossibile connettersi al server API SpiceDL. Verificare se il server è in esecuzione.",
        invalidUri: "URI non valido",
        downloadStarted: "Download avviato: {id}",
        albumDownloadStarted: "Download album avviato: {id}",
        playlistDownloadStarted: "Download playlist avviato: {id}",
        downloadCancelled: "Download annullato",
        downloadFailed: "Impossibile avviare il download",
        cancelFailed: "Impossibile annullare",
        folderOpened: "Cartella download aperta",
        openFolderFailed: "Impossibile aprire la cartella",
        settingsSaved: "Impostazioni salvate",
        settingsReset: "Impostazioni reimpostate",
        apiSettingsOpened: "Finestra impostazioni server API aperta",
        apiSettingsFailed: "Impossibile aprire la finestra impostazioni server API",
      },
      settings: {
        title: "Impostazioni Estensione SpiceDL",
        apiHost: "Host Server API",
        apiPort: "Porta Server API",
        save: "Salva",
        reset: "Reimposta",
        portRange: "Il numero di porta deve essere compreso tra 1 e 65535",
        hostRequired: "Inserire un nome host",
        saveFailed: "Impossibile salvare le impostazioni",
        apiServerSettings: "Impostazioni Server API",
        apiServerSettingsDesc: "Per modificare le impostazioni del server API come la cartella di download e la porta, fare clic sul pulsante sottostante.",
        openApiServerSettings: "Apri Impostazioni Server API",
      },
    };
  }

  /**
   * Get default French translations
   */
  private getDefaultFrenchTranslations(): LocaleData {
    return {
      ui: {
        title: "État du Téléchargement",
        downloads: "{count} téléchargements",
        openFolder: "📁 Ouvrir le Dossier de Téléchargement",
        refresh: "⟳ Actualiser",
        total: "Total",
        active: "Actif",
        completed: "Terminé",
        failed: "Échoué",
        cancelled: "Annulé",
        all: "Tous",
        noDownloads: "Aucun téléchargement",
        noDownloadsFilter: "Aucun téléchargement ne correspond à ce filtre",
        startDownloading: "Clic droit sur les pistes ou albums pour commencer le téléchargement",
        loading: "Chargement...",
        error: "Erreur",
        retry: "Réessayer",
        cancel: "⊘ Annuler",
        started: "Démarré :",
        completedTime: "Terminé :",
        errorDetails: "Détails de l'Erreur",
        starting: "Démarrage",
        downloading: "Téléchargement",
        completedStatus: "Terminé",
        failedStatus: "Échoué",
        cancelledStatus: "Annulé",
      },
      menu: {
        downloadTrack: "Télécharger avec SpiceDL",
        downloadAlbum: "Télécharger l'Album avec SpiceDL",
        downloadPlaylist: "Télécharger la Playlist avec SpiceDL",
        downloadStatus: "État du Téléchargement",
        settings: "Paramètres SpiceDL",
      },
      notifications: {
        apiUnavailable: "Impossible de se connecter au serveur API SpiceDL. Veuillez vérifier si le serveur est en cours d'exécution.",
        invalidUri: "URI invalide",
        downloadStarted: "Téléchargement démarré : {id}",
        albumDownloadStarted: "Téléchargement d'album démarré : {id}",
        playlistDownloadStarted: "Téléchargement de playlist démarré : {id}",
        downloadCancelled: "Téléchargement annulé",
        downloadFailed: "Échec du démarrage du téléchargement",
        cancelFailed: "Échec de l'annulation",
        folderOpened: "Dossier de téléchargement ouvert",
        openFolderFailed: "Échec de l'ouverture du dossier",
        settingsSaved: "Paramètres enregistrés",
        settingsReset: "Paramètres réinitialisés",
        apiSettingsOpened: "Fenêtre des paramètres du serveur API ouverte",
        apiSettingsFailed: "Échec de l'ouverture de la fenêtre des paramètres du serveur API",
      },
      settings: {
        title: "Paramètres de l'Extension SpiceDL",
        apiHost: "Hôte du Serveur API",
        apiPort: "Port du Serveur API",
        save: "Enregistrer",
        reset: "Réinitialiser",
        portRange: "Le numéro de port doit être entre 1 et 65535",
        hostRequired: "Veuillez entrer un nom d'hôte",
        saveFailed: "Échec de l'enregistrement des paramètres",
        apiServerSettings: "Paramètres du Serveur API",
        apiServerSettingsDesc: "Pour modifier les paramètres du serveur API tels que le dossier de téléchargement et le port, cliquez sur le bouton ci-dessous.",
        openApiServerSettings: "Ouvrir les Paramètres du Serveur API",
      },
    };
  }

  /**
   * Get default Russian translations
   */
  private getDefaultRussianTranslations(): LocaleData {
    return {
      ui: {
        title: "Статус Загрузки",
        downloads: "{count} загрузок",
        openFolder: "📁 Открыть Папку Загрузки",
        refresh: "⟳ Обновить",
        total: "Всего",
        active: "Активные",
        completed: "Завершено",
        failed: "Ошибка",
        cancelled: "Отменено",
        all: "Все",
        noDownloads: "Нет загрузок",
        noDownloadsFilter: "Нет загрузок, соответствующих этому фильтру",
        startDownloading: "Щелкните правой кнопкой мыши на треках или альбомах, чтобы начать загрузку",
        loading: "Загрузка...",
        error: "Ошибка",
        retry: "Повторить",
        cancel: "⊘ Отмена",
        started: "Начато:",
        completedTime: "Завершено:",
        errorDetails: "Детали Ошибки",
        starting: "Запуск",
        downloading: "Загрузка",
        completedStatus: "Завершено",
        failedStatus: "Ошибка",
        cancelledStatus: "Отменено",
      },
      menu: {
        downloadTrack: "Скачать с SpiceDL",
        downloadAlbum: "Скачать Альбом с SpiceDL",
        downloadPlaylist: "Скачать Плейлист с SpiceDL",
        downloadStatus: "Статус Загрузки",
        settings: "Настройки SpiceDL",
      },
      notifications: {
        apiUnavailable: "Не удается подключиться к серверу API SpiceDL. Пожалуйста, проверьте, запущен ли сервер.",
        invalidUri: "Неверный URI",
        downloadStarted: "Загрузка начата: {id}",
        albumDownloadStarted: "Загрузка альбома начата: {id}",
        playlistDownloadStarted: "Загрузка плейлиста начата: {id}",
        downloadCancelled: "Загрузка отменена",
        downloadFailed: "Не удалось начать загрузку",
        cancelFailed: "Не удалось отменить",
        folderOpened: "Папка загрузки открыта",
        openFolderFailed: "Не удалось открыть папку",
        settingsSaved: "Настройки сохранены",
        settingsReset: "Настройки сброшены",
        apiSettingsOpened: "Окно настроек сервера API открыто",
        apiSettingsFailed: "Не удалось открыть окно настроек сервера API",
      },
      settings: {
        title: "Настройки Расширения SpiceDL",
        apiHost: "Хост Сервера API",
        apiPort: "Порт Сервера API",
        save: "Сохранить",
        reset: "Сбросить",
        portRange: "Номер порта должен быть от 1 до 65535",
        hostRequired: "Пожалуйста, введите имя хоста",
        saveFailed: "Не удалось сохранить настройки",
        apiServerSettings: "Настройки Сервера API",
        apiServerSettingsDesc: "Чтобы изменить настройки сервера API, такие как папка загрузки и порт, нажмите кнопку ниже.",
        openApiServerSettings: "Открыть Настройки Сервера API",
      },
    };
  }

  /**
   * Get default Simplified Chinese translations
   */
  private getDefaultSimplifiedChineseTranslations(): LocaleData {
    return {
      ui: {
        title: "下载状态",
        downloads: "{count} 个下载",
        openFolder: "📁 打开下载文件夹",
        refresh: "⟳ 刷新",
        total: "总计",
        active: "活动",
        completed: "已完成",
        failed: "失败",
        cancelled: "已取消",
        all: "全部",
        noDownloads: "没有下载",
        noDownloadsFilter: "没有匹配此筛选器的下载",
        startDownloading: "右键单击曲目或专辑以开始下载",
        loading: "加载中...",
        error: "错误",
        retry: "重试",
        cancel: "⊘ 取消",
        started: "已开始：",
        completedTime: "已完成：",
        errorDetails: "错误详情",
        starting: "启动中",
        downloading: "下载中",
        completedStatus: "已完成",
        failedStatus: "失败",
        cancelledStatus: "已取消",
      },
      menu: {
        downloadTrack: "使用 SpiceDL 下载",
        downloadAlbum: "使用 SpiceDL 下载专辑",
        downloadPlaylist: "使用 SpiceDL 下载播放列表",
        downloadStatus: "下载状态",
        settings: "SpiceDL 设置",
      },
      notifications: {
        apiUnavailable: "无法连接到 SpiceDL API 服务器。请检查服务器是否正在运行。",
        invalidUri: "无效的 URI",
        downloadStarted: "下载已开始：{id}",
        albumDownloadStarted: "专辑下载已开始：{id}",
        playlistDownloadStarted: "播放列表下载已开始：{id}",
        downloadCancelled: "下载已取消",
        downloadFailed: "启动下载失败",
        cancelFailed: "取消失败",
        folderOpened: "下载文件夹已打开",
        openFolderFailed: "打开文件夹失败",
        settingsSaved: "设置已保存",
        settingsReset: "设置已重置",
        apiSettingsOpened: "API 服务器设置窗口已打开",
        apiSettingsFailed: "打开 API 服务器设置窗口失败",
      },
      settings: {
        title: "SpiceDL 扩展设置",
        apiHost: "API 服务器主机",
        apiPort: "API 服务器端口",
        save: "保存",
        reset: "重置",
        portRange: "端口号必须在 1 到 65535 之间",
        hostRequired: "请输入主机名",
        saveFailed: "保存设置失败",
        apiServerSettings: "API 服务器设置",
        apiServerSettingsDesc: "要更改 API 服务器设置（如下载文件夹和端口），请单击下面的按钮。",
        openApiServerSettings: "打开 API 服务器设置",
      },
    };
  }

  /**
   * Get default Traditional Chinese translations
   */
  private getDefaultTraditionalChineseTranslations(): LocaleData {
    return {
      ui: {
        title: "下載狀態",
        downloads: "{count} 個下載",
        openFolder: "📁 開啟下載資料夾",
        refresh: "⟳ 重新整理",
        total: "總計",
        active: "活動",
        completed: "已完成",
        failed: "失敗",
        cancelled: "已取消",
        all: "全部",
        noDownloads: "沒有下載",
        noDownloadsFilter: "沒有符合此篩選器的下載",
        startDownloading: "右鍵單擊曲目或專輯以開始下載",
        loading: "載入中...",
        error: "錯誤",
        retry: "重試",
        cancel: "⊘ 取消",
        started: "已開始：",
        completedTime: "已完成：",
        errorDetails: "錯誤詳情",
        starting: "啟動中",
        downloading: "下載中",
        completedStatus: "已完成",
        failedStatus: "失敗",
        cancelledStatus: "已取消",
      },
      menu: {
        downloadTrack: "使用 SpiceDL 下載",
        downloadAlbum: "使用 SpiceDL 下載專輯",
        downloadPlaylist: "使用 SpiceDL 下載播放清單",
        downloadStatus: "下載狀態",
        settings: "SpiceDL 設定",
      },
      notifications: {
        apiUnavailable: "無法連接到 SpiceDL API 伺服器。請檢查伺服器是否正在執行。",
        invalidUri: "無效的 URI",
        downloadStarted: "下載已開始：{id}",
        albumDownloadStarted: "專輯下載已開始：{id}",
        playlistDownloadStarted: "播放清單下載已開始：{id}",
        downloadCancelled: "下載已取消",
        downloadFailed: "啟動下載失敗",
        cancelFailed: "取消失敗",
        folderOpened: "下載資料夾已開啟",
        openFolderFailed: "開啟資料夾失敗",
        settingsSaved: "設定已儲存",
        settingsReset: "設定已重設",
        apiSettingsOpened: "API 伺服器設定視窗已開啟",
        apiSettingsFailed: "開啟 API 伺服器設定視窗失敗",
      },
      settings: {
        title: "SpiceDL 擴充功能設定",
        apiHost: "API 伺服器主機",
        apiPort: "API 伺服器連接埠",
        save: "儲存",
        reset: "重設",
        portRange: "連接埠號必須在 1 到 65535 之間",
        hostRequired: "請輸入主機名稱",
        saveFailed: "儲存設定失敗",
        apiServerSettings: "API 伺服器設定",
        apiServerSettingsDesc: "要變更 API 伺服器設定（如下載資料夾和連接埠），請按一下下面的按鈕。",
        openApiServerSettings: "開啟 API 伺服器設定",
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
    // Try to detect and set language (always returns a language, defaults to "en")
    const detectedLang = i18nInstance.detectLanguage();
    i18nInstance.setLanguage(detectedLang);
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
export function setLanguage(lang: string): void {
  getI18n().setLanguage(lang);
}

/**
 * Get the current language
 */
export function getLanguage(): string {
  return getI18n().getLanguage();
}

