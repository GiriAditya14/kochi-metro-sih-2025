import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import mlTranslations from './locales/ml.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      ml: { translation: mlTranslations }
    },
    fallbackLng: 'en',
    debug: true, // Enable debug to see what's happening
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    react: {
      useSuspense: false
    }
  });

// Log when language changes
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  console.log('Available languages:', i18n.languages);
  console.log('Current translations:', i18n.store.data[lng]);
});

// Log initial state
console.log('i18n initialized with language:', i18n.language);
console.log('Available resources:', Object.keys(i18n.store.data));

export default i18n;
