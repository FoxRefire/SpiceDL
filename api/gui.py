"""
GUI settings window using PySide6
"""
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QFileDialog, QMessageBox,
    QFrame, QScrollArea
)
from PySide6.QtCore import Qt, QThread, Signal, QObject, QTimer, QMetaObject, QEvent
from PySide6.QtGui import QFont, QIcon, QCloseEvent
from config_manager import ConfigManager
from i18n import get_i18n, t
import threading
import os
from pathlib import Path


class ConfigChangedSignal(QObject):
    """Signal object for config changes"""
    changed = Signal()


class SettingsWindowSignal(QObject):
    """Signal object for opening settings window from other threads"""
    open_settings = Signal(object, object)  # config_manager, on_config_changed


class SettingsWindowEvent(QEvent):
    """Custom event for opening settings window"""
    EventType = QEvent.Type(QEvent.registerEventType())
    
    def __init__(self, config_manager, on_config_changed):
        super().__init__(SettingsWindowEvent.EventType)
        self.config_manager = config_manager
        self.on_config_changed = on_config_changed


class SettingsEventReceiver(QObject):
    """Event receiver for settings window events"""
    
    def __init__(self):
        super().__init__()
    
    def customEvent(self, event):
        """Handle custom events"""
        if isinstance(event, SettingsWindowEvent):
            _create_settings_window_impl(event.config_manager, event.on_config_changed)
            return True
        return super().customEvent(event)


# Global event receiver
_event_receiver = None


class SettingsGUI(QMainWindow):
    """Settings window for configuring the application"""
    
    def __init__(self, config_manager: ConfigManager, on_config_changed=None):
        super().__init__()
        self.config_manager = config_manager
        self.on_config_changed = on_config_changed
        self.signal_obj = ConfigChangedSignal()
        self.i18n = get_i18n()
        
        # Always detect language from environment/system first, then fallback to config
        # This ensures LANG environment variable takes precedence
        detected_lang = self.i18n.detect_language()
        config_language = config_manager.get("language")
        
        # Use detected language if available, otherwise use config
        language_to_use = detected_lang or config_language or "en"
        self.i18n.set_language(language_to_use)
        
        # Update config if detected language differs from stored config
        if detected_lang and detected_lang != config_language:
            config_manager.set("language", detected_lang)
        
        # Modern color scheme
        self.bg_color = "#1a1a1a"
        self.card_bg = "#252525"
        self.text_color = "#e8e8e8"
        self.text_secondary = "#b0b0b0"
        self.accent_color = "#1db954"  # Spotify green
        self.accent_hover = "#1ed760"
        self.accent_pressed = "#1aa34a"
        self.border_color = "#3a3a3a"
        self.input_bg = "#2a2a2a"
        self.input_focus = "#333333"
        self.error_color = "#e74c3c"
        
        self.setWindowTitle(t("ui.title"))
        self.setMinimumSize(900, 700)
        self.resize(900, 700)
        
        # Setup UI
        self.setup_ui()
        self.load_settings()
        
        # Center window
        self._center_window()
        
        # Set window flags to prevent closing the application when window is closed
        # The window should just hide, not quit the application
        self.setAttribute(Qt.WA_DeleteOnClose, False)
    
    def _center_window(self):
        """Center the window on screen"""
        frame_geometry = self.frameGeometry()
        screen = QApplication.primaryScreen().availableGeometry().center()
        frame_geometry.moveCenter(screen)
        self.move(frame_geometry.topLeft())
    
    def setup_ui(self):
        """Setup the UI components"""
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(40, 40, 40, 40)
        main_layout.setSpacing(0)
        
        # Title section
        title_frame = QWidget()
        title_layout = QVBoxLayout(title_frame)
        title_layout.setContentsMargins(0, 0, 0, 0)
        title_layout.setSpacing(8)
        
        title_label = QLabel(t("ui.title"))
        title_label.setStyleSheet(f"""
            color: {self.text_color};
            font-size: 28px;
            font-weight: 600;
            background-color: {self.bg_color};
            padding: 0px;
        """)
        title_layout.addWidget(title_label)
        
        subtitle_label = QLabel(t("ui.subtitle"))
        subtitle_label.setStyleSheet(f"""
            color: {self.text_secondary};
            font-size: 13px;
            background-color: {self.bg_color};
            padding: 0px;
        """)
        title_layout.addWidget(subtitle_label)
        
        main_layout.addWidget(title_frame)
        main_layout.addSpacing(32)
        
        # Scrollable content area
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)
        scroll_area.setFrameShape(QFrame.NoFrame)
        scroll_area.setStyleSheet(f"""
            QScrollArea {{
                background-color: {self.bg_color};
                border: none;
            }}
            QScrollBar:vertical {{
                background-color: {self.card_bg};
                width: 10px;
                border: none;
                border-radius: 5px;
            }}
            QScrollBar::handle:vertical {{
                background-color: {self.border_color};
                border-radius: 5px;
                min-height: 20px;
            }}
            QScrollBar::handle:vertical:hover {{
                background-color: {self.input_bg};
            }}
        """)
        
        content_widget = QWidget()
        content_layout = QVBoxLayout(content_widget)
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(20)
        
        # Download Settings Card
        download_card = self.create_card()
        download_layout = QVBoxLayout(download_card)
        download_layout.setContentsMargins(24, 24, 24, 24)
        download_layout.setSpacing(16)
        
        section_title = QLabel(t("ui.download_settings"))
        section_title.setStyleSheet(f"""
            color: {self.text_color};
            font-size: 16px;
            font-weight: 600;
            background-color: {self.card_bg};
            padding: 0px;
        """)
        download_layout.addWidget(section_title)
        download_layout.addSpacing(4)
        
        # Download folder field
        folder_label = QLabel(t("ui.download_folder"))
        folder_label.setStyleSheet(f"""
            color: {self.text_color};
            font-size: 13px;
            font-weight: 500;
            background-color: {self.card_bg};
            padding: 0px;
        """)
        download_layout.addWidget(folder_label)
        download_layout.addSpacing(8)
        
        folder_input_layout = QHBoxLayout()
        folder_input_layout.setSpacing(12)
        
        self.folder_var = QLineEdit()
        self.folder_var.setPlaceholderText(t("ui.download_folder_placeholder"))
        self.folder_var.setStyleSheet(f"""
            QLineEdit {{
                background-color: {self.input_bg};
                color: {self.text_color};
                border: 2px solid {self.border_color};
                border-radius: 6px;
                padding: 12px 16px;
                font-size: 13px;
                selection-background-color: {self.accent_color};
                selection-color: white;
            }}
            QLineEdit:focus {{
                background-color: {self.input_focus};
                border: 2px solid {self.accent_color};
            }}
            QLineEdit:hover {{
                border: 2px solid {self.input_focus};
            }}
        """)
        folder_input_layout.addWidget(self.folder_var, 1)
        
        browse_btn = QPushButton(t("ui.browse"))
        browse_btn.setMinimumWidth(100)
        browse_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.input_bg};
                color: {self.text_color};
                border: 2px solid {self.border_color};
                border-radius: 6px;
                padding: 12px 20px;
                font-size: 13px;
                font-weight: 500;
            }}
            QPushButton:hover {{
                background-color: {self.input_focus};
                border: 2px solid {self.border_color};
            }}
            QPushButton:pressed {{
                background-color: {self.input_bg};
            }}
        """)
        browse_btn.clicked.connect(self.browse_folder)
        folder_input_layout.addWidget(browse_btn)
        
        download_layout.addLayout(folder_input_layout)
        content_layout.addWidget(download_card)
        
        # Server Settings Card
        server_card = self.create_card()
        server_layout = QVBoxLayout(server_card)
        server_layout.setContentsMargins(24, 24, 24, 24)
        server_layout.setSpacing(16)
        
        server_title = QLabel(t("ui.server_settings"))
        server_title.setStyleSheet(f"""
            color: {self.text_color};
            font-size: 16px;
            font-weight: 600;
            background-color: {self.card_bg};
            padding: 0px;
        """)
        server_layout.addWidget(server_title)
        server_layout.addSpacing(4)
        
        # Host field
        host_label = QLabel(t("ui.host_address"))
        host_label.setStyleSheet(f"""
            color: {self.text_color};
            font-size: 13px;
            font-weight: 500;
            background-color: {self.card_bg};
            padding: 0px;
        """)
        server_layout.addWidget(host_label)
        server_layout.addSpacing(8)
        
        self.host_var = QLineEdit()
        self.host_var.setPlaceholderText("127.0.0.1")
        self.host_var.setStyleSheet(f"""
            QLineEdit {{
                background-color: {self.input_bg};
                color: {self.text_color};
                border: 2px solid {self.border_color};
                border-radius: 6px;
                padding: 12px 16px;
                font-size: 13px;
                selection-background-color: {self.accent_color};
                selection-color: white;
            }}
            QLineEdit:focus {{
                background-color: {self.input_focus};
                border: 2px solid {self.accent_color};
            }}
            QLineEdit:hover {{
                border: 2px solid {self.input_focus};
            }}
        """)
        server_layout.addWidget(self.host_var)
        server_layout.addSpacing(16)
        
        # Port field
        port_label = QLabel(t("ui.port_number"))
        port_label.setStyleSheet(f"""
            color: {self.text_color};
            font-size: 13px;
            font-weight: 500;
            background-color: {self.card_bg};
            padding: 0px;
        """)
        server_layout.addWidget(port_label)
        server_layout.addSpacing(8)
        
        self.port_var = QLineEdit()
        self.port_var.setPlaceholderText("5985")
        self.port_var.setStyleSheet(f"""
            QLineEdit {{
                background-color: {self.input_bg};
                color: {self.text_color};
                border: 2px solid {self.border_color};
                border-radius: 6px;
                padding: 12px 16px;
                font-size: 13px;
                selection-background-color: {self.accent_color};
                selection-color: white;
            }}
            QLineEdit:focus {{
                background-color: {self.input_focus};
                border: 2px solid {self.accent_color};
            }}
            QLineEdit:hover {{
                border: 2px solid {self.input_focus};
            }}
        """)
        server_layout.addWidget(self.port_var)
        
        content_layout.addWidget(server_card)
        
        scroll_area.setWidget(content_widget)
        main_layout.addWidget(scroll_area, 1)
        
        # Button section
        button_frame = QWidget()
        button_layout = QHBoxLayout(button_frame)
        button_layout.setContentsMargins(0, 24, 0, 0)
        button_layout.setSpacing(12)
        button_layout.addStretch()
        
        cancel_btn = QPushButton(t("ui.cancel"))
        cancel_btn.setMinimumWidth(120)
        cancel_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.input_bg};
                color: {self.text_color};
                border: 2px solid {self.border_color};
                border-radius: 6px;
                padding: 12px 24px;
                font-size: 13px;
                font-weight: 500;
            }}
            QPushButton:hover {{
                background-color: {self.input_focus};
                border: 2px solid {self.border_color};
            }}
            QPushButton:pressed {{
                background-color: {self.input_bg};
            }}
        """)
        cancel_btn.clicked.connect(self.close)
        button_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton(t("ui.save"))
        save_btn.setMinimumWidth(120)
        save_btn.setDefault(True)
        save_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {self.accent_color};
                color: white;
                border: none;
                border-radius: 6px;
                padding: 12px 24px;
                font-size: 13px;
                font-weight: 600;
            }}
            QPushButton:hover {{
                background-color: {self.accent_hover};
            }}
            QPushButton:pressed {{
                background-color: {self.accent_pressed};
            }}
            QPushButton:focus {{
                outline: 2px solid {self.accent_color};
                outline-offset: 2px;
            }}
        """)
        save_btn.clicked.connect(self.save_settings)
        button_layout.addWidget(save_btn)
        
        main_layout.addWidget(button_frame)
        
        # Set main window background and style
        self.setStyleSheet(f"""
            QMainWindow {{
                background-color: {self.bg_color};
            }}
        """)
    
    def create_card(self):
        """Create a modern card container with border"""
        card = QFrame()
        card.setFrameShape(QFrame.NoFrame)
        card.setStyleSheet(f"""
            QFrame {{
                background-color: {self.card_bg};
                border: 1px solid {self.border_color};
                border-radius: 8px;
            }}
        """)
        return card
    
    def browse_folder(self):
        """Open folder browser dialog"""
        folder = QFileDialog.getExistingDirectory(
            self,
            t("ui.select_download_folder"),
            self.folder_var.text() or str(Path.home())
        )
        if folder:
            self.folder_var.setText(folder)
    
    def load_settings(self):
        """Load settings from config"""
        config = self.config_manager.get_all()
        self.folder_var.setText(config.get("download_folder", ""))
        self.host_var.setText(config.get("host", "127.0.0.1"))
        self.port_var.setText(str(config.get("port", 5985)))
    
    def save_settings(self):
        """Save settings to config"""
        try:
            # Validate port
            port_text = self.port_var.text().strip()
            if not port_text:
                raise ValueError(t("ui.port_required"))
            
            port = int(port_text)
            if port < 1 or port > 65535:
                raise ValueError(t("ui.port_range"))
            
            # Validate folder
            folder = self.folder_var.text().strip()
            if not folder:
                raise ValueError(t("ui.folder_required"))
            
            # Validate host
            host = self.host_var.text().strip()
            if not host:
                raise ValueError(t("ui.host_required"))
            
            # Save settings
            self.config_manager.set("download_folder", folder)
            self.config_manager.set("host", host)
            self.config_manager.set("port", port)
            
            msg = QMessageBox(self)
            msg.setIcon(QMessageBox.Information)
            msg.setWindowTitle(t("ui.success"))
            msg.setText(t("ui.settings_saved"))
            msg.setStyleSheet(f"""
                QMessageBox {{
                    background-color: {self.bg_color};
                }}
                QMessageBox QLabel {{
                    color: {self.text_color};
                    font-size: 13px;
                }}
                QPushButton {{
                    background-color: {self.accent_color};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 500;
                    min-width: 80px;
                }}
                QPushButton:hover {{
                    background-color: {self.accent_hover};
                }}
            """)
            msg.exec()
            
            # Notify callback if provided
            if self.on_config_changed:
                self.on_config_changed()
            
            self.close()
        
        except ValueError as e:
            msg = QMessageBox(self)
            msg.setIcon(QMessageBox.Critical)
            msg.setWindowTitle(t("ui.error"))
            msg.setText(t("ui.invalid_input", message=str(e)))
            msg.setStyleSheet(f"""
                QMessageBox {{
                    background-color: {self.bg_color};
                }}
                QMessageBox QLabel {{
                    color: {self.text_color};
                    font-size: 13px;
                }}
                QPushButton {{
                    background-color: {self.error_color};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 500;
                    min-width: 80px;
                }}
                QPushButton:hover {{
                    background-color: #c0392b;
                }}
            """)
            msg.exec()
        except Exception as e:
            msg = QMessageBox(self)
            msg.setIcon(QMessageBox.Critical)
            msg.setWindowTitle(t("ui.error"))
            msg.setText(t("ui.failed_to_save", message=str(e)))
            msg.setStyleSheet(f"""
                QMessageBox {{
                    background-color: {self.bg_color};
                }}
                QMessageBox QLabel {{
                    color: {self.text_color};
                    font-size: 13px;
                }}
                QPushButton {{
                    background-color: {self.error_color};
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 500;
                    min-width: 80px;
                }}
                QPushButton:hover {{
                    background-color: #c0392b;
                }}
            """)
            msg.exec()
    
    def closeEvent(self, event: QCloseEvent):
        """Handle window close event - hide window instead of closing application"""
        # Just hide the window, don't close it
        # This prevents the application from quitting when the settings window is closed
        event.ignore()
        self.hide()
        print("Settings window hidden (application continues running)")


# Global window instance to prevent multiple windows
_window_instance = None
_settings_signal = None


def _initialize_signal_in_main_thread():
    """Initialize signal object in main thread (must be called from main thread)"""
    global _settings_signal
    if _settings_signal is None:
        app = QApplication.instance()
        if app is not None:
            _settings_signal = SettingsWindowSignal()
            # Connect signal to window creation function
            _settings_signal.open_settings.connect(_create_settings_window_slot)
            print("Settings window signal initialized in main thread")
    return _settings_signal


def _create_settings_window_slot(config_manager, on_config_changed):
    """Slot function to create settings window (called from signal)"""
    global _window_instance
    try:
        # If window already exists, bring it to front
        if _window_instance is not None and _window_instance.isVisible():
            _window_instance.raise_()
            _window_instance.activateWindow()
            print("Settings window already open, bringing to front")
            return
        
        # Create new window
        print("Creating settings window from signal...")
        _window_instance = SettingsGUI(config_manager, on_config_changed)
        _window_instance.show()
        _window_instance.destroyed.connect(lambda: set_global_window(None))
        print("Settings window created and shown")
    except Exception as e:
        print(f"Error creating settings window: {e}")
        import traceback
        traceback.print_exc()


def set_global_window(value):
    """Set global window instance"""
    global _window_instance
    _window_instance = value


def _create_settings_window_impl(config_manager, on_config_changed):
    """Internal implementation to create settings window"""
    global _window_instance
    try:
        # If window already exists (even if hidden), show and bring it to front
        if _window_instance is not None:
            _window_instance.show()
            _window_instance.raise_()
            _window_instance.activateWindow()
            print("Settings window already exists, showing and bringing to front")
            return
        
        # Create new window
        print("Creating settings window...")
        _window_instance = SettingsGUI(config_manager, on_config_changed)
        _window_instance.show()
        # Don't connect destroyed signal - we want to keep the window instance
        # even when it's hidden, so we can show it again later
        print("Settings window created and shown")
    except Exception as e:
        print(f"Error creating settings window: {e}")
        import traceback
        traceback.print_exc()


# Global flag to prevent multiple dialogs
_dependencies_dialog_shown = False
_dependencies_dialog_lock = threading.Lock()

def show_dependencies_dialog(missing_deps: list):
    """
    Show dialog for missing dependencies
    Args:
        missing_deps: List of missing dependency names (e.g., ['spotdl', 'ffmpeg'])
    """
    global _dependencies_dialog_shown
    
    # Prevent multiple dialogs
    with _dependencies_dialog_lock:
        if _dependencies_dialog_shown:
            return
        _dependencies_dialog_shown = True
    
    from i18n import get_i18n, t
    
    # Get or create QApplication
    app = QApplication.instance()
    if app is None:
        print("Warning: QApplication not found. Creating new instance.")
        app = QApplication([])
    
    # Configure QApplication to not quit when last window is closed
    app.setQuitOnLastWindowClosed(False)
    
    i18n = get_i18n()
    
    # Build missing dependencies list
    missing_list = []
    install_instructions = []
    
    if "spotdl" in missing_deps:
        missing_list.append(t("dependencies.spotdl_not_found"))
        install_instructions.append(t("dependencies.spotdl_install"))
    
    if "ffmpeg" in missing_deps:
        missing_list.append(t("dependencies.ffmpeg_not_found"))
        install_instructions.append(t("dependencies.ffmpeg_install"))
    
    missing_text = "\n".join(f"  • {dep}" for dep in missing_list)
    instructions_text = "\n\n".join(install_instructions)
    
    # Create message box
    msg = QMessageBox()
    msg.setIcon(QMessageBox.Warning)
    msg.setWindowTitle(t("dependencies.title"))
    msg.setText(t("dependencies.message", missing=missing_text))
    msg.setDetailedText(f"{t('dependencies.install_instructions')}\n\n{instructions_text}")
    
    # Style the message box
    msg.setStyleSheet(f"""
        QMessageBox {{
            background-color: #1a1a1a;
        }}
        QMessageBox QLabel {{
            color: #e8e8e8;
            font-size: 13px;
        }}
        QPushButton {{
            background-color: #1db954;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 13px;
            font-weight: 500;
            min-width: 80px;
        }}
        QPushButton:hover {{
            background-color: #1ed760;
        }}
    """)
    
    # Show dialog - must be called from main thread
    if threading.current_thread() is threading.main_thread():
        msg.exec()
    else:
        # Use QTimer to schedule execution in main thread
        def show_in_main_thread():
            msg.exec()
        
        QTimer.singleShot(0, show_in_main_thread)


def show_settings(config_manager: ConfigManager, on_config_changed=None):
    """Show settings window (thread-safe)"""
    global _window_instance, _settings_signal
    
    # Get or create QApplication
    app = QApplication.instance()
    if app is None:
        print("Warning: QApplication not found. Creating new instance.")
        app = QApplication([])
    
    # Configure QApplication to not quit when last window is closed
    # This allows the application to continue running with just the tray icon
    app.setQuitOnLastWindowClosed(False)
    
    # Check if we're in the main thread
    if threading.current_thread() is threading.main_thread():
        # If in main thread, create window directly
        _create_settings_window_impl(config_manager, on_config_changed)
    else:
        # If in another thread, use multiple methods to ensure it works
        print(f"Calling from non-main thread: {threading.current_thread().name}")
        
        # Method 1: Try using signal/slot mechanism
        try:
            signal_obj = _initialize_signal_in_main_thread()
            if signal_obj is not None:
                print("Using signal/slot mechanism...")
                signal_obj.open_settings.emit(config_manager, on_config_changed)
                return
        except Exception as e:
            print(f"Signal/slot failed: {e}")
        
        # Method 2: Use custom event
        try:
            print("Using custom event mechanism...")
            global _event_receiver
            if _event_receiver is None:
                _event_receiver = SettingsEventReceiver()
            event = SettingsWindowEvent(config_manager, on_config_changed)
            QApplication.postEvent(_event_receiver, event)
            print("Custom event posted")
            return
        except Exception as e:
            print(f"Custom event failed: {e}")
            import traceback
            traceback.print_exc()
        
        # Method 3: Use QTimer (fallback)
        print("Using QTimer as fallback...")
        # Store parameters in a way that can be accessed from the callback
        def create_window_callback():
            _create_settings_window_impl(config_manager, on_config_changed)
        
        QTimer.singleShot(0, create_window_callback)
        print("Scheduled window creation via QTimer")
