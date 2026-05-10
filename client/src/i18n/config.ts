import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar traducciones
import es from './locales/es.json';
import it from './locales/it.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';

// Configuración de idiomas disponibles
export const LANGUAGES = {
  es: { name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  it: { name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  fr: { name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  de: { name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  pt: { name: 'Português', flag: '🇵🇹', nativeName: 'Português' }
};

// Configuración de países
export const COUNTRIES = {
  ES: { name: 'España', language: 'es', currency: 'EUR', timezone: 'Europe/Madrid' },
  IT: { name: 'Italia', language: 'it', currency: 'EUR', timezone: 'Europe/Rome' },
  FR: { name: 'Francia', language: 'fr', currency: 'EUR', timezone: 'Europe/Paris' },
  DE: { name: 'Alemania', language: 'de', currency: 'EUR', timezone: 'Europe/Berlin' },
  PT: { name: 'Portugal', language: 'pt', currency: 'EUR', timezone: 'Europe/Lisbon' }
};

// Inicializar i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      it: { translation: it },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt }
    },
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
