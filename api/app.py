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

# Try to import tray_app, but make it optional
try:
    import tray_app
    TRAY_AVAILABLE = True
except (ImportError, ValueError) as e:
    print(f"Warning: System tray not available: {e}")
    print("Server will run without system tray icon.")
    TRAY_AVAILABLE = False
    tray_app = None


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
        if not TRAY_AVAILABLE:
            print("System tray is not available. Skipping tray icon.")
            return
        
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
        
        # Start system tray (if available)
        self.start_tray()
        
        # Keep main thread alive
        try:
            if self.tray_thread:
                self.tray_thread.join()
            else:
                # If no tray, just wait for keyboard interrupt
                while True:
                    import time
                    time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")
            if self.tray:
                self.tray.quit_app()
            sys.exit(0)


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


