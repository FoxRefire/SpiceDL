"""
Main application entry point with GUI and system tray
"""
import threading
import sys
import os
from pathlib import Path

# Import modules
from main import app, run_server, config_manager, download_manager
import gui
import tray_app


class Application:
    """Main application class"""
    
    def __init__(self):
        self.server_thread = None
        self.tray_thread = None
        self.tray = None
    
    def start_server(self):
        """Start the Flask server in a separate thread"""
        def run():
            run_server()
        
        self.server_thread = threading.Thread(target=run, daemon=True)
        self.server_thread.start()
        print("Server thread started")
    
    def start_tray(self):
        """Start the system tray icon"""
        def run_tray():
            self.tray = tray_app.create_tray_app(
                self.server_thread,
                config_manager,
                download_manager,
                gui
            )
            self.tray.run()
        
        self.tray_thread = threading.Thread(target=run_tray, daemon=False)
        self.tray_thread.start()
    
    def run(self):
        """Run the application"""
        # Start server
        self.start_server()
        
        # Start system tray
        self.start_tray()
        
        # Keep main thread alive
        try:
            self.tray_thread.join()
        except KeyboardInterrupt:
            print("\nShutting down...")
            if self.tray:
                self.tray.quit_app()


def main():
    """Main entry point"""
    # Check if running on Windows (hide console if needed)
    if sys.platform == "win32":
        # On Windows, we might want to hide the console
        # But for debugging, we'll keep it visible
        pass
    
    app_instance = Application()
    app_instance.run()


if __name__ == "__main__":
    main()


