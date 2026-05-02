import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/lib/locale/context";
import { LANGUAGES } from "@/lib/locale/translations";
import { CURRENCIES } from "@/lib/locale/currencies";
import { Globe, ChevronDown } from "lucide-react";

function Dropdown({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200"
      >
        {trigger}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[200] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden min-w-[170px] max-h-72 overflow-y-auto">
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function LocaleSwitcher() {
  const { lang, currency, setLang, setCurrency } = useLocale();

  const currentLang = LANGUAGES[lang];
  const currentCurrency = CURRENCIES[currency];

  return (
    <div className="flex items-center gap-1">
      {/* Language picker */}
      <Dropdown
        trigger={
          <>
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">{currentLang?.flag} {currentLang?.nativeName ?? lang.toUpperCase()}</span>
            <span className="sm:hidden">{currentLang?.flag}</span>
          </>
        }
      >
        {(close) => (
          <div className="p-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 py-1 tracking-wide">Language</p>
            {Object.entries(LANGUAGES).map(([code, info]) => (
              <button
                key={code}
                onClick={() => { setLang(code); close(); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors ${lang === code ? "bg-primary/8 text-primary font-semibold" : "text-gray-700"}`}
              >
                <span className="text-base leading-none">{info.flag}</span>
                <span className="flex-1 text-left">{info.nativeName}</span>
                {lang === code && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      {/* Currency picker */}
      <Dropdown
        trigger={
          <>
            <span className="font-semibold text-gray-700">{currentCurrency?.symbol ?? "$"}</span>
            <span className="hidden sm:inline text-gray-600">{currency}</span>
          </>
        }
      >
        {(close) => (
          <div className="p-1">
            <p className="text-[10px] font-semibold text-gray-400 uppercase px-2 py-1 tracking-wide">Currency</p>
            {Object.entries(CURRENCIES).map(([code, info]) => (
              <button
                key={code}
                onClick={() => { setCurrency(code); close(); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors ${currency === code ? "bg-primary/8 text-primary font-semibold" : "text-gray-700"}`}
              >
                <span className="text-base leading-none w-6">{info.flag}</span>
                <span className="font-medium w-12 shrink-0">{code}</span>
                <span className="text-gray-400 text-xs truncate">{info.name}</span>
                {currency === code && <span className="w-1.5 h-1.5 rounded-full bg-primary ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </Dropdown>
    </div>
  );
}
