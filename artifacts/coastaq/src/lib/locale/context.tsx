import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { fetchExchangeRates, formatPrice as fmtPrice, FALLBACK_RATES } from "./currencies";
import { t as translate, LANGUAGES, COUNTRY_DEFAULTS, TranslationKeys } from "./translations";

const STORAGE_LANG = "cq_lang";
const STORAGE_CURR = "cq_currency";

type LocaleCtx = {
  lang: string;
  currency: string;
  rates: Record<string, number>;
  ratesLoading: boolean;
  setLang: (l: string) => void;
  setCurrency: (c: string) => void;
  t: (key: keyof TranslationKeys, params?: Record<string, string | number>) => string;
  formatPrice: (usd: number) => string;
};

const LocaleContext = createContext<LocaleCtx>({
  lang: "en",
  currency: "USD",
  rates: FALLBACK_RATES,
  ratesLoading: false,
  setLang: () => {},
  setCurrency: () => {},
  t: (key) => key,
  formatPrice: (usd) => `$${usd.toFixed(2)}`,
});

function detectLocale(): { lang: string; currency: string } {
  const savedLang = localStorage.getItem(STORAGE_LANG);
  const savedCurr = localStorage.getItem(STORAGE_CURR);
  if (savedLang && savedCurr) return { lang: savedLang, currency: savedCurr };

  const browserLang = navigator.language || "en";
  const langCode = browserLang.split("-")[0].toLowerCase();
  const countryCode = browserLang.includes("-")
    ? browserLang.split("-")[1].toUpperCase()
    : "";

  const countryMatch = countryCode ? COUNTRY_DEFAULTS[countryCode] : null;
  if (countryMatch) {
    return { lang: savedLang ?? countryMatch.lang, currency: savedCurr ?? countryMatch.currency };
  }
  const langMatch = Object.values(COUNTRY_DEFAULTS).find(d => d.lang === langCode);
  return {
    lang: savedLang ?? (LANGUAGES[langCode] ? langCode : "en"),
    currency: savedCurr ?? langMatch?.currency ?? "USD",
  };
}

function applyRTL(lang: string) {
  const isRTL = LANGUAGES[lang]?.rtl ?? false;
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
  document.documentElement.lang = lang;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const detected = detectLocale();
  const [lang, setLangState] = useState(detected.lang);
  const [currency, setCurrencyState] = useState(detected.currency);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);

  useEffect(() => {
    applyRTL(lang);
    let cancelled = false;
    setRatesLoading(true);
    fetchExchangeRates().then(r => {
      if (!cancelled) { setRates(r); setRatesLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const setLang = useCallback((l: string) => {
    setLangState(l);
    localStorage.setItem(STORAGE_LANG, l);
    applyRTL(l);
  }, []);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_CURR, c);
  }, []);

  const tFn = useCallback(
    (key: keyof TranslationKeys, params?: Record<string, string | number>) =>
      translate(lang, key, params),
    [lang]
  );

  const formatPriceFn = useCallback(
    (usd: number) => fmtPrice(usd, currency, rates),
    [currency, rates]
  );

  return (
    <LocaleContext.Provider
      value={{ lang, currency, rates, ratesLoading, setLang, setCurrency, t: tFn, formatPrice: formatPriceFn }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
