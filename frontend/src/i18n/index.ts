import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import uz from './locales/uz.json';
import ru from './locales/ru.json';

const LANG_KEY = 'wm_lang';

export type LangCode = 'en' | 'uz' | 'ru';

export const LANGUAGES: { code: LangCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

function getSavedLang(): LangCode {
  const saved = localStorage.getItem(LANG_KEY) as LangCode | null;
  if (saved && ['en', 'uz', 'ru'].includes(saved)) return saved;
  return 'en';
}

export function saveLang(lang: LangCode) {
  localStorage.setItem(LANG_KEY, lang);
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uz: { translation: uz },
    ru: { translation: ru },
  },
  lng: getSavedLang(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
