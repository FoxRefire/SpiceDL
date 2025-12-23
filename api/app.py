"""
Main application entry point with GUI and system tray
(Desktop mode) and API-only server mode (Render / headless)
"""

import threading
import sys
import os
import time

# Detect Render environment early
IS_RENDER = os.environ.get("RENDER") == "true"

# Import server components
from main import app, run_server, config_manager, download_manager

# GUI imports ONLY for desktop mode
if not IS_RENDER:
    try:
        import gui
        import tray_app
        from PySide6.QtWidgets import QApplication as QtApp
        TRAY_AVAILABLE = True
    except (ImportError, ValueError) as e:
        print(f"Warning: System tray not available: {e}")
        TRAY_AVAILABLE = False
else:
    TRAY_AVAILABLE = False


class Application:
    """Main application class"""

    def __init__(self):
        self.server_thread = None
        self.tray = None
        self.qt_app = None

    def start_server_threaded(self):
        """Desktop mode: start Flask in background thread"""

        def run():
            run_server()

        self.server_thread = threading.Thread(target=run, daemon=True)
        self.server_thread.start()
        print("Server thread started")

    def start_tray(self):
        """Desktop-only system tray"""
        if not TRAY_AVAILABLE:
            print("Tray unavailable, skipping tray startup")
            return

        try:
            if QtApp.instance() is None:
                print("Creating QApplication...")
                self.qt_app = QtApp([])
            else:
                self.qt_app = QtApp.instance()

            self.qt_app.setQuitOnLastWindowClosed(False)

            gui._initialize_signal_in_main_thread()

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
            print(f"Tray failed to start: {e}")
            print("Continuing without tray")

    def run(self):
        """Main execution logic"""

        # ==========================
        # RENDER / SERVER MODE
        # ==========================
        if IS_RENDER:
            print("Render environment detected — running API-only mode")

            # IMPORTANT:
            # Flask MUST run in main thread on Render
            run_server()
            return

        # ==========================
        # DESKTOP MODE
        # ==========================
        print("Desktop environment detected")

        self.start_server_threaded()

        if TRAY_AVAILABLE:
            self.start_tray()
        else:
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down...")
                sys.exit(0)


def main():
    app_instance = Application()
    app_instance.run()


if __name__ == "__main__":
    main()
