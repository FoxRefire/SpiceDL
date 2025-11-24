"""
Internationalization (i18n) support for the API GUI
"""
import json
import locale
import os
from pathlib import Path
from typing import Dict, Any, Optional


class I18n:
    """Internationalization manager"""
    
    def __init__(self, locale_dir: Optional[str] = None):
        """
        Initialize i18n manager
        
        Args:
            locale_dir: Directory containing locale files (default: locales/ in same directory as this file)
        """
        if locale_dir is None:
            # Default to locales/ directory in the same directory as this file
            self.locale_dir = Path(__file__).parent / "locales"
        else:
            self.locale_dir = Path(locale_dir)
        
        self.locale_dir.mkdir(exist_ok=True)
        
        self.current_language = "en"
        self.translations: Dict[str, Dict[str, str]] = {}
        self._load_language("en")  # Load English as default
    
    def set_language(self, lang: str):
        """
        Set the current language
        
        Args:
            lang: Language code (e.g., 'en', 'ja')
        """
        if lang != self.current_language:
            self.current_language = lang
            self._load_language(lang)
    
    def get_language(self) -> str:
        """Get the current language code"""
        return self.current_language
    
    def detect_language(self) -> str:
        """
        Detect system language
        
        Returns:
            Language code (default: 'en')
        """
        try:
            # Try to get system locale
            system_locale, _ = locale.getdefaultlocale()
            if system_locale:
                lang = system_locale.split("_")[0].lower()
                # Check if we have translations for this language
                locale_file = self.locale_dir / f"{lang}.json"
                if locale_file.exists():
                    return lang
        except Exception:
            pass
        
        return "en"  # Default to English
    
    def _load_language(self, lang: str):
        """Load translations for a language"""
        locale_file = self.locale_dir / f"{lang}.json"
        
        if locale_file.exists():
            try:
                with open(locale_file, "r", encoding="utf-8") as f:
                    self.translations[lang] = json.load(f)
            except Exception as e:
                print(f"Error loading locale file {locale_file}: {e}")
                # Fallback to English if loading fails
                if lang != "en":
                    self._load_language("en")
                    self.current_language = "en"
        else:
            # If language file doesn't exist, try to load English as fallback
            if lang != "en":
                print(f"Locale file {locale_file} not found, falling back to English")
                self._load_language("en")
                self.current_language = "en"
    
    def t(self, key: str, **kwargs) -> str:
        """
        Translate a key
        
        Args:
            key: Translation key (can use dot notation, e.g., 'ui.title')
            **kwargs: Format arguments for the translation string
        
        Returns:
            Translated string, or the key if translation not found
        """
        # Get translations for current language
        translations = self.translations.get(self.current_language, {})
        
        # Support dot notation for nested keys
        value = translations
        for part in key.split("."):
            if isinstance(value, dict):
                value = value.get(part)
            else:
                value = None
                break
        
        # If translation not found, try English as fallback
        if value is None and self.current_language != "en":
            translations = self.translations.get("en", {})
            value = translations
            for part in key.split("."):
                if isinstance(value, dict):
                    value = value.get(part)
                else:
                    value = None
                    break
        
        # If still not found, return the key
        if value is None or not isinstance(value, str):
            return key
        
        # Format the string if kwargs are provided
        if kwargs:
            try:
                return value.format(**kwargs)
            except Exception:
                return value
        
        return value


# Global i18n instance
_i18n_instance: Optional[I18n] = None


def get_i18n() -> I18n:
    """Get the global i18n instance"""
    global _i18n_instance
    if _i18n_instance is None:
        _i18n_instance = I18n()
    return _i18n_instance


def t(key: str, **kwargs) -> str:
    """
    Convenience function to translate a key
    
    Args:
        key: Translation key
        **kwargs: Format arguments
    
    Returns:
        Translated string
    """
    return get_i18n().t(key, **kwargs)

