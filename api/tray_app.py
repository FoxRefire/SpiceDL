"""
System tray application using pystray
"""
import pystray
from PIL import Image, ImageDraw
import threading
import sys
import os
from pathlib import Path


class TrayApp:
    """System tray application"""
    
    def __init__(self, server_thread, config_manager, download_manager, gui_module):
        self.server_thread = server_thread
        self.config_manager = config_manager
        self.download_manager = download_manager
        self.gui_module = gui_module
        self.icon = None
        self.running = True
    
    def create_icon_image(self):
        """Create a simple icon image"""
        # Create a 64x64 image with a simple icon
        image = Image.new('RGB', (64, 64), color='white')
        draw = ImageDraw.Draw(image)
        
        # Draw a simple music note or download icon
        # Draw a circle
        draw.ellipse([10, 10, 54, 54], fill='#1DB954', outline='#1DB954')
        
        # Draw a simple "S" for Spotify
        draw.text((20, 18), "S", fill='white', anchor='mm')
        
        return image
    
    def show_settings(self, icon=None, item=None):
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
    
    def show_status(self, icon=None, item=None):
        """Show download status"""
        status = self.download_manager.get_status()
        # Could open a status window here, for now just print
        print(f"Active downloads: {status.get('total', 0)}")
    
    def quit_app(self, icon=None, item=None):
        """Quit the application"""
        self.running = False
        if self.icon:
            self.icon.stop()
        # Stop server thread
        # Note: Flask doesn't have a clean shutdown, so we'll just exit
        os._exit(0)
    
    def create_menu(self):
        """Create the system tray menu"""
        menu = pystray.Menu(
            pystray.MenuItem("Settings", self.show_settings),
            pystray.MenuItem("Status", self.show_status),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", self.quit_app)
        )
        return menu
    
    def run(self):
        """Run the system tray icon"""
        image = self.create_icon_image()
        menu = self.create_menu()
        
        self.icon = pystray.Icon(
            "spotDL API",
            image,
            "spotDL API Server",
            menu
        )
        
        # Run in a separate thread
        self.icon.run()


def create_tray_app(server_thread, config_manager, download_manager, gui_module):
    """Create and return a tray app instance"""
    return TrayApp(server_thread, config_manager, download_manager, gui_module)


