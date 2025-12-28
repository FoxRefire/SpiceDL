"""
Main application entry point with GUI and system tray
"""
import threading
import sys
import os
import argparse
from pathlib import Path

# Check for --headless flag in command line arguments before importing main
# This allows us to set environment variable before main.py imports gui
if "--headless" in sys.argv:
    os.environ["SPICEDL_HEADLESS"] = "1"

# Import modules
from main import app, run_server, config_manager, download_manager

# Only import gui if not in headless mode
gui = None
if os.environ.get("SPICEDL_HEADLESS") != "1":
    try:
        import gui
    except ImportError as e:
        print(f"Warning: GUI module not available: {e}")
        gui = None

# Try to import tray_app, but make it optional
try:
    import tray_app
    from PySide6.QtWidgets import QApplication as QtApp
    from PySide6.QtCore import QObject
    TRAY_AVAILABLE = True
except (ImportError, ValueError) as e:
    print(f"Warning: System tray not available: {e}")
    print("Server will run without system tray icon.")
    TRAY_AVAILABLE = False
    tray_app = None
    QtApp = None
    QObject = None


class Application:
    """Main application class"""
    
    def __init__(self, headless=False):
        self.server_thread = None
        self.tray = None
        self.qt_app = None
        self._missing_dependencies = None
        self.headless = headless
    
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
        
        try:
            # Create QApplication in main thread (required for PySide6)
            if QtApp.instance() is None:
                print("Creating QApplication...")
                self.qt_app = QtApp([])
            else:
                print("Using existing QApplication instance")
                self.qt_app = QtApp.instance()
            
            # Configure QApplication to not quit when last window is closed
            # This allows the application to continue running with just the tray icon
            self.qt_app.setQuitOnLastWindowClosed(False)
            print("QApplication configured to continue running when windows are closed")
            
            # Initialize GUI signal in main thread (required for cross-thread communication)
            # This must be done after QApplication is created
            if gui is not None:
                gui._initialize_signal_in_main_thread()
            
            # Show dependencies dialog if needed (after Qt app is initialized)
            if self._missing_dependencies and gui is not None:
                from PySide6.QtCore import QTimer
                def show_dialog():
                    gui.show_dependencies_dialog(self._missing_dependencies)
                # Schedule dialog to show after Qt event loop starts
                QTimer.singleShot(500, show_dialog)
            
            # Create tray app
            print("Creating tray app...")
            self.tray = tray_app.create_tray_app(
                self.server_thread,
                config_manager,
                download_manager,
                gui
            )
            print("Starting tray app...")
            self.tray.run()
        except Exception as e:
            print(f"Error starting tray app: {e}")
            import traceback
            traceback.print_exc()
            # Continue without tray
            print("Continuing without system tray...")
    
    def run(self):
        """Run the application"""
        # Check dependencies and store for later display
        missing = download_manager.get_missing_dependencies()
        if missing:
            print(f"Warning: Missing dependencies: {', '.join(missing)}")
            if not self.headless:
                # Store missing dependencies to show dialog after Qt app is initialized
                self._missing_dependencies = missing
            else:
                print("Running in headless mode - dependency warnings will not be shown in GUI")
        else:
            self._missing_dependencies = None
        
        # Start server
        self.start_server()
        
        # In headless mode, skip GUI and tray
        if self.headless:
            print("Running in headless mode - no GUI will be displayed")
            try:
                while True:
                    import time
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down...")
                sys.exit(0)
        else:
            # Start system tray (if available) - this will run the Qt event loop
            if TRAY_AVAILABLE:
                self.start_tray()
            else:
                # If no tray, just wait for keyboard interrupt
                try:
                    while True:
                        import time
                        time.sleep(1)
                except KeyboardInterrupt:
                    print("\nShutting down...")
                    sys.exit(0)


def main():
    """Main entry point"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="SpiceDL API Server")
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run in headless mode without GUI or system tray"
    )
    args = parser.parse_args()
    
    # Set environment variable for headless mode so other modules can check it
    if args.headless:
        os.environ["SPICEDL_HEADLESS"] = "1"
    
    # Check if running on Windows (hide console if needed)
    if sys.platform == "win32":
        # On Windows, we might want to hide the console
        # But for debugging, we'll keep it visible
        pass
    
    app_instance = Application(headless=args.headless)
    app_instance.run()


if __name__ == "__main__":
    main()


