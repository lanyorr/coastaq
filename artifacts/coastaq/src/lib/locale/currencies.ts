export type CurrencyInfo = {
  symbol: string;
  name: string;
  flag: string;
  decimals: number;
  symbolAfter?: boolean;
};

export const CURRENCIES: Record<string, CurrencyInfo> = {
  USD: { symbol: "$",    name: "US Dollar",           flag: "🇺🇸", decimals: 2 },
  EUR: { symbol: "€",    name: "Euro",                 flag: "🇪🇺", decimals: 2 },
  GBP: { symbol: "£",    name: "British Pound",        flag: "🇬🇧", decimals: 2 },
  JPY: { symbol: "¥",    name: "Japanese Yen",         flag: "🇯🇵", decimals: 0 },
  CNY: { symbol: "¥",    name: "Chinese Yuan",         flag: "🇨🇳", decimals: 2 },
  INR: { symbol: "₹",    name: "Indian Rupee",         flag: "🇮🇳", decimals: 2 },
  NGN: { symbol: "₦",    name: "Nigerian Naira",       flag: "🇳🇬", decimals: 0 },
  KES: { symbol: "KSh",  name: "Kenyan Shilling",      flag: "🇰🇪", decimals: 0 },
  GHS: { symbol: "GH₵",  name: "Ghanaian Cedi",        flag: "🇬🇭", decimals: 2 },
  ZAR: { symbol: "R",    name: "South African Rand",   flag: "🇿🇦", decimals: 2 },
  EGP: { symbol: "E£",   name: "Egyptian Pound",       flag: "🇪🇬", decimals: 2 },
  AED: { symbol: "د.إ",  name: "UAE Dirham",           flag: "🇦🇪", decimals: 2 },
  SAR: { symbol: "SR",   name: "Saudi Riyal",          flag: "🇸🇦", decimals: 2 },
  CAD: { symbol: "C$",   name: "Canadian Dollar",      flag: "🇨🇦", decimals: 2 },
  AUD: { symbol: "A$",   name: "Australian Dollar",    flag: "🇦🇺", decimals: 2 },
  BRL: { symbol: "R$",   name: "Brazilian Real",       flag: "🇧🇷", decimals: 2 },
  MXN: { symbol: "MX$",  name: "Mexican Peso",         flag: "🇲🇽", decimals: 2 },
  PKR: { symbol: "Rs",   name: "Pakistani Rupee",      flag: "🇵🇰", decimals: 0 },
  UGX: { symbol: "USh",  name: "Ugandan Shilling",     flag: "🇺🇬", decimals: 0 },
  TZS: { symbol: "TSh",  name: "Tanzanian Shilling",   flag: "🇹🇿", decimals: 0 },
  MAD: { symbol: "MAD",  name: "Moroccan Dirham",      flag: "🇲🇦", decimals: 2 },
  THB: { symbol: "฿",    name: "Thai Baht",            flag: "🇹🇭", decimals: 2 },
  KRW: { symbol: "₩",    name: "South Korean Won",     flag: "🇰🇷", decimals: 0 },
  IDR: { symbol: "Rp",   name: "Indonesian Rupiah",    flag: "🇮🇩", decimals: 0 },
  MYR: { symbol: "RM",   name: "Malaysian Ringgit",    flag: "🇲🇾", decimals: 2 },
  PHP: { symbol: "₱",    name: "Philippine Peso",      flag: "🇵🇭", decimals: 2 },
  TRY: { symbol: "₺",    name: "Turkish Lira",         flag: "🇹🇷", decimals: 2 },
  PLN: { symbol: "zł",   name: "Polish Zloty",         flag: "🇵🇱", decimals: 2, symbolAfter: true },
  SEK: { symbol: "kr",   name: "Swedish Krona",        flag: "🇸🇪", decimals: 2, symbolAfter: true },
  NOK: { symbol: "kr",   name: "Norwegian Krone",      flag: "🇳🇴", decimals: 2, symbolAfter: true },
  DKK: { symbol: "kr",   name: "Danish Krone",         flag: "🇩🇰", decimals: 2, symbolAfter: true },
  CHF: { symbol: "CHF",  name: "Swiss Franc",          flag: "🇨🇭", decimals: 2 },
  SGD: { symbol: "S$",   name: "Singapore Dollar",     flag: "🇸🇬", decimals: 2 },
  HKD: { symbol: "HK$",  name: "Hong Kong Dollar",     flag: "🇭🇰", decimals: 2 },
  NZD: { symbol: "NZ$",  name: "New Zealand Dollar",   flag: "🇳🇿", decimals: 2 },
  ILS: { symbol: "₪",    name: "Israeli Shekel",       flag: "🇮🇱", decimals: 2 },
  CLP: { symbol: "$",    name: "Chilean Peso",         flag: "🇨🇱", decimals: 0 },
  COP: { symbol: "$",    name: "Colombian Peso",       flag: "🇨🇴", decimals: 0 },
  ARS: { symbol: "$",    name: "Argentine Peso",       flag: "🇦🇷", decimals: 2 },
  RWF: { symbol: "RF",   name: "Rwandan Franc",        flag: "🇷🇼", decimals: 0 },
  ETB: { symbol: "Br",   name: "Ethiopian Birr",       flag: "🇪🇹", decimals: 2 },
  XOF: { symbol: "CFA",  name: "West African CFA",     flag: "🌍", decimals: 0 },
  VND: { symbol: "₫",    name: "Vietnamese Dong",      flag: "🇻🇳", decimals: 0 },
  BDT: { symbol: "৳",    name: "Bangladeshi Taka",     flag: "🇧🇩", decimals: 2 },
};

export const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.78, JPY: 149, CNY: 7.24, INR: 83.5,
  NGN: 1580, KES: 128, GHS: 12.5, ZAR: 18.5, EGP: 47, AED: 3.67,
  SAR: 3.75, CAD: 1.35, AUD: 1.52, BRL: 5.0, MXN: 17.1, PKR: 278,
  UGX: 3750, TZS: 2530, MAD: 10.0, THB: 35, KRW: 1325, IDR: 15600,
  MYR: 4.7, PHP: 56, TRY: 32, PLN: 4.0, SEK: 10.4, NOK: 10.6,
  DKK: 6.9, CHF: 0.89, SGD: 1.34, HKD: 7.82, NZD: 1.62, ILS: 3.7,
  CLP: 920, COP: 3900, ARS: 870, RWF: 1290, ETB: 56, XOF: 605,
  VND: 24500, BDT: 110,
};

const CACHE_KEY = "cq_fx_rates";
const CACHE_TTL = 24 * 60 * 60 * 1000;

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const { rates, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) return rates;
    }
  } catch {}
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("rate-api-error");
    const data = await res.json();
    const rates: Record<string, number> = data.rates ?? {};
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rates, ts: Date.now() }));
    return rates;
  } catch {
    return FALLBACK_RATES;
  }
}

export function formatPrice(
  usdAmount: number,
  currency: string,
  rates: Record<string, number>
): string {
  const info = CURRENCIES[currency] ?? CURRENCIES.USD;
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  const raw = usdAmount * rate;
  const dec = info.decimals;

  let rounded: number;
  if (dec === 0) {
    rounded = Math.round(raw);
  } else if (raw >= 10) {
    rounded = Math.floor(raw) + 0.99;
  } else {
    rounded = Math.round(raw * 100) / 100;
  }

  const formatted = rounded.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

  return info.symbolAfter
    ? `${formatted} ${info.symbol}`
    : `${info.symbol}${formatted}`;
}
