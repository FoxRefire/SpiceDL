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
        self.root.geometry("870x770")
        self.root.resizable(True, True)
        
        # Modern color scheme
        self.bg_color = "#1e1e1e"
        self.card_bg = "#2d2d2d"
        self.text_color = "#e0e0e0"
        self.accent_color = "#1db954"  # Spotify green
        self.accent_hover = "#1ed760"
        self.border_color = "#404040"
        self.input_bg = "#3a3a3a"
        self.input_focus = "#4a4a4a"
        
        # Configure root background
        self.root.configure(bg=self.bg_color)
        
        # Center window
        self._center_window()
        
        self.setup_styles()
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
    
    def setup_styles(self):
        """Setup modern ttk styles"""
        style = ttk.Style()
        
        # Try to use a modern theme
        try:
            style.theme_use("clam")
        except:
            pass
        
        # Configure styles
        style.configure("Card.TFrame", background=self.card_bg, relief=tk.FLAT)
        style.configure("Title.TLabel", 
                       background=self.card_bg,
                       foreground=self.text_color,
                       font=("Segoe UI", 18, "bold"))
        style.configure("Section.TLabel",
                       background=self.card_bg,
                       foreground=self.text_color,
                       font=("Segoe UI", 11, "bold"))
        style.configure("Field.TLabel",
                       background=self.card_bg,
                       foreground=self.text_color,
                       font=("Segoe UI", 9))
        style.configure("Modern.TEntry",
                       fieldbackground=self.input_bg,
                       foreground=self.text_color,
                       borderwidth=1,
                       relief=tk.SOLID,
                       insertcolor=self.text_color,
                       font=("Segoe UI", 9))
        style.map("Modern.TEntry",
                 focusbackground=[("focus", self.input_focus)],
                 bordercolor=[("focus", self.accent_color)])
        style.configure("Primary.TButton",
                       background=self.accent_color,
                       foreground="white",
                       borderwidth=0,
                       focuscolor="none",
                       font=("Segoe UI", 10, "bold"),
                       padding=(20, 10))
        style.map("Primary.TButton",
                 background=[("active", self.accent_hover),
                           ("pressed", self.accent_color)])
        style.configure("Secondary.TButton",
                       background=self.input_bg,
                       foreground=self.text_color,
                       borderwidth=1,
                       focuscolor="none",
                       font=("Segoe UI", 10),
                       padding=(20, 10))
        style.map("Secondary.TButton",
                 background=[("active", self.input_focus)])
        style.configure("Browse.TButton",
                       background=self.input_bg,
                       foreground=self.text_color,
                       borderwidth=1,
                       focuscolor="none",
                       font=("Segoe UI", 9),
                       padding=(12, 6))
        style.map("Browse.TButton",
                 background=[("active", self.input_focus)])
    
    def create_card(self, parent, row, column, columnspan=1, padx=0, pady=0):
        """Create a modern card container with border"""
        # Outer frame for border effect
        card_outer = tk.Frame(parent, bg=self.border_color, padx=1, pady=1)
        card_outer.grid(row=row, column=column, columnspan=columnspan, 
                       sticky=(tk.W, tk.E, tk.N, tk.S), padx=padx, pady=pady)
        
        # Inner frame for content
        card = tk.Frame(card_outer, bg=self.card_bg, padx=20, pady=20)
        card.pack(fill=tk.BOTH, expand=True)
        
        return card
    
    def create_field(self, parent, label_text, row, icon=""):
        """Create a modern form field"""
        # Label
        label = ttk.Label(parent, text=f"{icon} {label_text}", style="Field.TLabel")
        label.grid(row=row, column=0, sticky=tk.W, pady=(0, 8))
        
        # Input frame
        input_frame = ttk.Frame(parent, style="Card.TFrame")
        input_frame.grid(row=row+1, column=0, sticky=(tk.W, tk.E), pady=(0, 16))
        
        return input_frame
    
    def setup_ui(self):
        """Setup the UI components"""
        # Main container with padding
        main_container = tk.Frame(self.root, bg=self.bg_color, padx=30, pady=30)
        main_container.pack(fill=tk.BOTH, expand=True)
        
        # Title section
        title_frame = tk.Frame(main_container, bg=self.bg_color)
        title_frame.pack(fill=tk.X, pady=(0, 20))
        
        title_label = tk.Label(
            title_frame,
            text="⚙️ spotDL API Settings",
            bg=self.bg_color,
            fg=self.text_color,
            font=("Segoe UI", 24, "bold")
        )
        title_label.pack(anchor=tk.W)
        
        subtitle_label = tk.Label(
            title_frame,
            text="Configure your download settings and server preferences",
            bg=self.bg_color,
            fg="#a0a0a0",
            font=("Segoe UI", 10)
        )
        subtitle_label.pack(anchor=tk.W, pady=(5, 0))
        
        # Main content area (scrollable)
        content_frame = tk.Frame(main_container, bg=self.bg_color)
        content_frame.pack(fill=tk.BOTH, expand=True)
        content_frame.columnconfigure(0, weight=1)
        
        # Download Settings Card
        download_card = self.create_card(content_frame, 0, 0, padx=0, pady=(0, 15))
        download_card.columnconfigure(0, weight=1)
        
        section_title = tk.Label(
            download_card,
            text="📁 Download Settings",
            bg=self.card_bg,
            fg=self.text_color,
            font=("Segoe UI", 12, "bold")
        )
        section_title.grid(row=0, column=0, sticky=tk.W, pady=(0, 20))
        
        # Download folder field
        folder_label = tk.Label(
            download_card,
            text="📂 Download Folder",
            bg=self.card_bg,
            fg=self.text_color,
            font=("Segoe UI", 9)
        )
        folder_label.grid(row=1, column=0, sticky=tk.W, pady=(0, 8))
        
        folder_input_frame = tk.Frame(download_card, bg=self.card_bg)
        folder_input_frame.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 20))
        folder_input_frame.columnconfigure(0, weight=1)
        
        self.folder_var = tk.StringVar()
        folder_entry = tk.Entry(
            folder_input_frame,
            textvariable=self.folder_var,
            bg=self.input_bg,
            fg=self.text_color,
            insertbackground=self.text_color,
            selectbackground=self.accent_color,
            selectforeground="white",
            borderwidth=1,
            relief=tk.SOLID,
            highlightthickness=1,
            highlightcolor=self.accent_color,
            highlightbackground=self.border_color,
            font=("Segoe UI", 9),
            bd=0
        )
        folder_entry.grid(row=0, column=0, sticky=(tk.W, tk.E), padx=(0, 10), ipady=8)
        
        browse_btn = tk.Button(
            folder_input_frame,
            text="参照...",
            command=self.browse_folder,
            bg=self.input_bg,
            fg=self.text_color,
            activebackground=self.input_focus,
            activeforeground=self.text_color,
            borderwidth=1,
            relief=tk.SOLID,
            highlightthickness=0,
            font=("Segoe UI", 9),
            cursor="hand2",
            padx=12,
            pady=6
        )
        browse_btn.grid(row=0, column=1)
        
        # Server Settings Card
        server_card = self.create_card(content_frame, 1, 0, padx=0, pady=(0, 15))
        server_card.columnconfigure(0, weight=1)
        
        server_title = tk.Label(
            server_card,
            text="🌐 Server Settings",
            bg=self.card_bg,
            fg=self.text_color,
            font=("Segoe UI", 12, "bold")
        )
        server_title.grid(row=0, column=0, sticky=tk.W, pady=(0, 20))
        
        # Host field
        host_label = tk.Label(
            server_card,
            text="🖥️ Host Address",
            bg=self.card_bg,
            fg=self.text_color,
            font=("Segoe UI", 9)
        )
        host_label.grid(row=1, column=0, sticky=tk.W, pady=(0, 8))
        
        self.host_var = tk.StringVar()
        host_entry = tk.Entry(
            server_card,
            textvariable=self.host_var,
            bg=self.input_bg,
            fg=self.text_color,
            insertbackground=self.text_color,
            selectbackground=self.accent_color,
            selectforeground="white",
            borderwidth=1,
            relief=tk.SOLID,
            highlightthickness=1,
            highlightcolor=self.accent_color,
            highlightbackground=self.border_color,
            font=("Segoe UI", 9),
            bd=0
        )
        host_entry.grid(row=2, column=0, sticky=(tk.W, tk.E), pady=(0, 20), ipady=8)
        
        # Port field
        port_label = tk.Label(
            server_card,
            text="🔌 Port Number",
            bg=self.card_bg,
            fg=self.text_color,
            font=("Segoe UI", 9)
        )
        port_label.grid(row=3, column=0, sticky=tk.W, pady=(0, 8))
        
        self.port_var = tk.StringVar()
        port_entry = tk.Entry(
            server_card,
            textvariable=self.port_var,
            bg=self.input_bg,
            fg=self.text_color,
            insertbackground=self.text_color,
            selectbackground=self.accent_color,
            selectforeground="white",
            borderwidth=1,
            relief=tk.SOLID,
            highlightthickness=1,
            highlightcolor=self.accent_color,
            highlightbackground=self.border_color,
            font=("Segoe UI", 9),
            bd=0
        )
        port_entry.grid(row=4, column=0, sticky=(tk.W, tk.E), pady=(0, 0), ipady=8)
        
        # Button section
        button_frame = tk.Frame(main_container, bg=self.bg_color)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        # Button container for alignment
        button_container = tk.Frame(button_frame, bg=self.bg_color)
        button_container.pack(anchor=tk.E)
        
        cancel_btn = tk.Button(
            button_container,
            text="キャンセル",
            command=self.root.destroy,
            bg=self.input_bg,
            fg=self.text_color,
            activebackground=self.input_focus,
            activeforeground=self.text_color,
            borderwidth=1,
            relief=tk.SOLID,
            highlightthickness=0,
            font=("Segoe UI", 10),
            cursor="hand2",
            padx=20,
            pady=10
        )
        cancel_btn.pack(side=tk.RIGHT, padx=(10, 0))
        
        save_btn = tk.Button(
            button_container,
            text="保存",
            command=self.save_settings,
            bg=self.accent_color,
            fg="white",
            activebackground=self.accent_hover,
            activeforeground="white",
            borderwidth=0,
            relief=tk.FLAT,
            highlightthickness=0,
            font=("Segoe UI", 10, "bold"),
            cursor="hand2",
            padx=20,
            pady=10
        )
        save_btn.pack(side=tk.RIGHT)
        
        # Configure grid weights
        content_frame.columnconfigure(0, weight=1)
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

