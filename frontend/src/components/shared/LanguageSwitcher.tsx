import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { LANGUAGES, saveLang } from '../../i18n';
import type { LangCode } from '../../i18n';

interface Props {
  compact?: boolean;
  dark?: boolean; // white text for dark backgrounds (header, login)
}

export default function LanguageSwitcher({ compact = false, dark = false }: Props) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  function handleSelect(code: LangCode) {
    i18n.changeLanguage(code);
    saveLang(code);
    setOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const btnClass = dark
    ? 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm'
    : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm';

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className={btnClass} title="Change language">
        <span className="text-base leading-none">{current.flag}</span>
        {!compact && (
          <span className="text-xs font-medium hidden sm:block">{current.label}</span>
        )}
        <span className="text-xs font-medium uppercase sm:hidden">{current.code}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === i18n.language;
            const isDisabled = lang.code === 'uz' || lang.code === 'ru';
            return (
              <button
                key={lang.code}
                onClick={() => !isDisabled && handleSelect(lang.code)}
                disabled={isDisabled}
                title={isDisabled ? 'Coming soon' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed text-gray-400'
                    : isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span>{lang.label}</span>
                {isActive && !isDisabled && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
                )}
                {isDisabled && (
                  <span className="ml-auto text-[10px] text-gray-400 font-normal">Soon</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
