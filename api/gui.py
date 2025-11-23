"""
GUI settings window using tkinter
"""
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from config_manager import ConfigManager
import threading
import os
from pathlib import Path


class SettingsGUI:
    """Settings window for configuring the application"""
    
    def __init__(self, config_manager: ConfigManager, on_config_changed=None):
        self.config_manager = config_manager
        self.on_config_changed = on_config_changed
        self.root = tk.Tk()
        self.root.title("spotDL API Settings")
        self.root.geometry("500x300")
        self.root.resizable(False, False)
        
        # Center window
        self._center_window()
        
        self.setup_ui()
        self.load_settings()
    
    def _center_window(self):
        """Center the window on screen"""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f"{width}x{height}+{x}+{y}")
    
    def setup_ui(self):
        """Setup the UI components"""
        # Main frame
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Download folder
        ttk.Label(main_frame, text="Download Folder:").grid(
            row=0, column=0, sticky=tk.W, pady=5
        )
        folder_frame = ttk.Frame(main_frame)
        folder_frame.grid(row=0, column=1, sticky=(tk.W, tk.E), pady=5, padx=5)
        
        self.folder_var = tk.StringVar()
        folder_entry = ttk.Entry(folder_frame, textvariable=self.folder_var, width=40)
        folder_entry.pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        browse_btn = ttk.Button(
            folder_frame, text="Browse...", command=self.browse_folder
        )
        browse_btn.pack(side=tk.LEFT, padx=5)
        
        # Host
        ttk.Label(main_frame, text="Host:").grid(
            row=1, column=0, sticky=tk.W, pady=5
        )
        self.host_var = tk.StringVar()
        host_entry = ttk.Entry(main_frame, textvariable=self.host_var, width=43)
        host_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), pady=5, padx=5)
        
        # Port
        ttk.Label(main_frame, text="Port:").grid(
            row=2, column=0, sticky=tk.W, pady=5
        )
        self.port_var = tk.StringVar()
        port_entry = ttk.Entry(main_frame, textvariable=self.port_var, width=43)
        port_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), pady=5, padx=5)
        
        # Buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=3, column=0, columnspan=2, pady=20)
        
        save_btn = ttk.Button(
            button_frame, text="Save", command=self.save_settings, width=15
        )
        save_btn.pack(side=tk.LEFT, padx=5)
        
        cancel_btn = ttk.Button(
            button_frame, text="Cancel", command=self.root.destroy, width=15
        )
        cancel_btn.pack(side=tk.LEFT, padx=5)
        
        # Configure grid weights
        main_frame.columnconfigure(1, weight=1)
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
    
    def browse_folder(self):
        """Open folder browser dialog"""
        folder = filedialog.askdirectory(
            title="Select Download Folder",
            initialdir=self.folder_var.get() or str(Path.home())
        )
        if folder:
            self.folder_var.set(folder)
    
    def load_settings(self):
        """Load settings from config"""
        config = self.config_manager.get_all()
        self.folder_var.set(config.get("download_folder", ""))
        self.host_var.set(config.get("host", "127.0.0.1"))
        self.port_var.set(str(config.get("port", 5985)))
    
    def save_settings(self):
        """Save settings to config"""
        try:
            # Validate port
            port = int(self.port_var.get())
            if port < 1 or port > 65535:
                raise ValueError("Port must be between 1 and 65535")
            
            # Validate folder
            folder = self.folder_var.get()
            if not folder:
                raise ValueError("Download folder is required")
            
            # Save settings
            self.config_manager.set("download_folder", folder)
            self.config_manager.set("host", self.host_var.get())
            self.config_manager.set("port", port)
            
            messagebox.showinfo("Success", "Settings saved successfully!")
            
            # Notify callback if provided
            if self.on_config_changed:
                self.on_config_changed()
            
            self.root.destroy()
        
        except ValueError as e:
            messagebox.showerror("Error", f"Invalid input: {str(e)}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save settings: {str(e)}")
    
    def show(self):
        """Show the settings window"""
        self.root.mainloop()


def show_settings(config_manager: ConfigManager, on_config_changed=None):
    """Show settings window (thread-safe)"""
    def run_gui():
        app = SettingsGUI(config_manager, on_config_changed)
        app.show()
    
    # Run GUI in a separate thread
    # Note: On some systems, tkinter may need to run in main thread
    # This implementation should work on most platforms
    thread = threading.Thread(target=run_gui, daemon=True)
    thread.start()

