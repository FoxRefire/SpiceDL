"""
Configuration manager for settings
"""
import json
import os
from pathlib import Path
from typing import Dict, Any


class ConfigManager:
    """Manages application configuration"""
    
    def __init__(self, config_file: str = "config.json"):
        self.config_file = Path(config_file)
        self.default_config = {
            "download_folder": str(Path.home() / "Music" / "SpiceDL"),
            "port": 5985,
            "host": "127.0.0.1"
        }
        self.config = self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """Load configuration from file"""
        if self.config_file.exists():
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    config = json.load(f)
                    # Merge with defaults to ensure all keys exist
                    merged = self.default_config.copy()
                    merged.update(config)
                    return merged
            except Exception as e:
                print(f"Error loading config: {e}")
                return self.default_config.copy()
        else:
            # Create default config file
            self.save_config(self.default_config)
            return self.default_config.copy()
    
    def save_config(self, config: Dict[str, Any] = None):
        """Save configuration to file"""
        if config is None:
            config = self.config
        
        try:
            with open(self.config_file, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            self.config = config
            return True
        except Exception as e:
            print(f"Error saving config: {e}")
            return False
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value"""
        return self.config.get(key, default)
    
    def set(self, key: str, value: Any):
        """Set a configuration value"""
        self.config[key] = value
        self.save_config()
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configuration"""
        return self.config.copy()


