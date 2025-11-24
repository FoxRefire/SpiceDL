"""
System tray application using PySide6
"""
from PySide6.QtWidgets import QSystemTrayIcon, QMenu, QApplication, QMessageBox
from PySide6.QtGui import QIcon, QPixmap, QPainter, QColor
from PySide6.QtCore import QObject, Signal, Qt
import threading
import sys
import os
from pathlib import Path


class TrayApp(QObject):
    """System tray application"""
    
    def __init__(self, server_thread, config_manager, download_manager, gui_module):
        super().__init__()
        self.server_thread = server_thread
        self.config_manager = config_manager
        self.download_manager = download_manager
        self.gui_module = gui_module
        self.tray_icon = None
        self.running = True
    
    def create_icon_image(self):
        """Create a simple icon image"""
        try:
            # Create a 64x64 pixmap with transparent background
            pixmap = QPixmap(64, 64)
            pixmap.fill(QColor(0, 0, 0, 0))  # Transparent background
            
            painter = QPainter(pixmap)
            painter.setRenderHint(QPainter.Antialiasing)
            
            # Draw a circle with Spotify green
            painter.setBrush(QColor(29, 185, 84))  # #1DB954
            painter.setPen(QColor(29, 185, 84))
            painter.drawEllipse(10, 10, 44, 44)
            
            # Draw a simple "S" for Spotify
            painter.setPen(QColor(255, 255, 255))
            font = painter.font()
            font.setPointSize(24)
            font.setBold(True)
            painter.setFont(font)
            # Center the text better
            painter.drawText(pixmap.rect(), Qt.AlignCenter, "S")
            painter.end()
            
            return QIcon(pixmap)
        except Exception as e:
            print(f"Error creating icon: {e}")
            # Return a simple colored icon as fallback
            pixmap = QPixmap(64, 64)
            pixmap.fill(QColor(29, 185, 84))
            return QIcon(pixmap)
    
    def show_settings(self):
        """Show settings window"""
        self.gui_module.show_settings(
            self.config_manager,
            on_config_changed=self.on_config_changed
        )
    
    def on_config_changed(self):
        """Called when config is changed"""
        # Update download manager folder if needed
        new_folder = self.config_manager.get("download_folder")
        if new_folder:
            self.download_manager.download_folder = Path(new_folder)
            self.download_manager.download_folder.mkdir(parents=True, exist_ok=True)
    
    def show_status(self):
        """Show download status"""
        status = self.download_manager.get_status()
        # Could open a status window here, for now just print
        print(f"Active downloads: {status.get('total', 0)}")
    
    def quit_app(self):
        """Quit the application"""
        self.running = False
        if self.tray_icon:
            self.tray_icon.hide()
        # Stop server thread
        # Note: Flask doesn't have a clean shutdown, so we'll just exit
        QApplication.quit()
        os._exit(0)
    
    def create_menu(self):
        """Create the system tray menu"""
        menu = QMenu()
        
        settings_action = menu.addAction("Settings")
        settings_action.triggered.connect(self.show_settings)
        
        status_action = menu.addAction("Status")
        status_action.triggered.connect(self.show_status)
        
        menu.addSeparator()
        
        quit_action = menu.addAction("Quit")
        quit_action.triggered.connect(self.quit_app)
        
        return menu
    
    def run(self):
        """Run the system tray icon"""
        # Ensure QApplication exists
        app = QApplication.instance()
        if app is None:
            app = QApplication([])
        
        # Check if system tray is available
        if not QSystemTrayIcon.isSystemTrayAvailable():
            print("Warning: System tray is not available on this system.")
            print("The application will continue without tray icon.")
            # Still run the event loop so GUI can work
            app.exec()
            return
        
        # Create tray icon
        try:
            icon = self.create_icon_image()
            self.tray_icon = QSystemTrayIcon(icon, app)
            self.tray_icon.setToolTip("SpiceDL API Server")
            
            # Set menu
            menu = self.create_menu()
            self.tray_icon.setContextMenu(menu)
            
            # Show tray icon
            if not self.tray_icon.isVisible():
                self.tray_icon.show()
                print("System tray icon shown")
            else:
                print("System tray icon already visible")
        except Exception as e:
            print(f"Error creating tray icon: {e}")
            import traceback
            traceback.print_exc()
        
        # Run event loop (this will block until app.quit() is called)
        print("Starting Qt event loop...")
        app.exec()


def create_tray_app(server_thread, config_manager, download_manager, gui_module):
    """Create and return a tray app instance"""
    return TrayApp(server_thread, config_manager, download_manager, gui_module)
