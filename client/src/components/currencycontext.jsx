/**
 * CurrencyContext.jsx
 *
 * Detects the user's currency via three-tier fallback:
 *   Tier 1 — IP geolocation (ipinfo.io)
 *   Tier 2 — Cloudflare trace (no-CORS, very reliable)
 *   Tier 3 — User's saved country_code in the DB
 *   Tier 4 — Admin's default baseCurrency prop
 *
 * Exchange rates via three sources with hardcoded emergency fallback:
 *   Source 1 — open.er-api.com
 *   Source 2 — exchangerate-api.com
 *   Source 3 — jsDelivr CDN (fawazahmed0 currency API, near 100% uptime)
 *   Emergency — hardcoded approximate rates (always works offline too)
 *
 * convert(amount, fromCurrency) → number in userCurrency
 * fmtMoney(amount, fromCurrency?) → formatted string
 *   - fmtMoney(item.price, baseCurrency)   → converts SAR/NGN/USD → user currency + formats
 *   - fmtMoney(alreadyConvertedSubtotal)   → just formats, no conversion
 */

import {
  createContext, useContext, useState,
  useEffect, useCallback, useMemo,
} from "react";

// ─── Currency symbol map ──────────────────────────────────────────────────────
export const CURRENCY_SYMBOLS = {
  AED:"د.إ",AFN:"؋",ALL:"L",AMD:"֏",AOA:"Kz",ARS:"$",AUD:"A$",AZN:"₼",
  BAM:"KM",BBD:"Bds$",BDT:"৳",BGN:"лв",BHD:".د.ب",BIF:"Fr",BMD:"$",
  BND:"B$",BOB:"Bs.",BRL:"R$",BSD:"B$",BTN:"Nu",BWP:"P",BYN:"Br",BZD:"BZ$",
  CAD:"C$",CDF:"Fr",CHF:"Fr",CLP:"$",CNY:"¥",COP:"$",CRC:"₡",CUP:"$",
  CVE:"$",CZK:"Kč",DJF:"Fr",DKK:"kr",DOP:"RD$",DZD:"دج",EGP:"E£",ERN:"Nfk",
  ETB:"Br",EUR:"€",FJD:"FJ$",FKP:"£",GBP:"£",GEL:"₾",GHS:"₵",GIP:"£",
  GMD:"D",GNF:"Fr",GTQ:"Q",GYD:"G$",HKD:"HK$",HNL:"L",HRK:"kn",HTG:"G",
  HUF:"Ft",IDR:"Rp",ILS:"₪",INR:"₹",IQD:"ع.د",IRR:"﷼",ISK:"kr",JMD:"J$",
  JOD:"JD",JPY:"¥",KES:"KSh",KGS:"с",KHR:"៛",KMF:"Fr",KPW:"₩",KRW:"₩",
  KWD:"د.ك",KYD:"CI$",KZT:"₸",LAK:"₭",LBP:"ل.ل",LKR:"Rs",LRD:"L$",LSL:"M",
  LYD:"LD",MAD:"MAD",MDL:"L",MGA:"Ar",MKD:"ден",MMK:"K",MNT:"₮",MOP:"P",
  MRU:"UM",MUR:"Rs",MVR:"Rf",MWK:"MK",MXN:"$",MYR:"RM",MZN:"MT",NAD:"N$",
  NGN:"₦",NIO:"C$",NOK:"kr",NPR:"Rs",NZD:"NZ$",OMR:"ر.ع.",PAB:"B/.",PEN:"S/.",
  PGK:"K",PHP:"₱",PKR:"Rs",PLN:"zł",PYG:"₲",QAR:"ر.ق",RON:"lei",RSD:"din",
  RUB:"₽",RWF:"Fr",SAR:"﷼",SBD:"SI$",SCR:"Rs",SDG:"ج.س.",SEK:"kr",SGD:"S$",
  SHP:"£",SLL:"Le",SOS:"Sh",SRD:"$",STN:"Db",SVC:"₡",SYP:"£",SZL:"L",
  THB:"฿",TJS:"SM",TMT:"T",TND:"د.ت",TOP:"T$",TRY:"₺",TTD:"TT$",TWD:"NT$",
  TZS:"Sh",UAH:"₴",UGX:"Sh",USD:"$",UYU:"$U",UZS:"лв",VES:"Bs.S",VND:"₫",
  VUV:"Vt",WST:"T",XAF:"Fr",XCD:"$",XOF:"Fr",XPF:"Fr",YER:"﷼",ZAR:"R",
  ZMW:"ZK",ZWL:"$",
};

// ─── Country ISO-2 → currency ─────────────────────────────────────────────────
export const COUNTRY_CURRENCY = {
  AF:"AFN",AL:"ALL",DZ:"DZD",AD:"EUR",AO:"AOA",AG:"XCD",AR:"ARS",AM:"AMD",
  AU:"AUD",AT:"EUR",AZ:"AZN",BS:"BSD",BH:"BHD",BD:"BDT",BB:"BBD",BY:"BYN",
  BE:"EUR",BZ:"BZD",BJ:"XOF",BT:"BTN",BO:"BOB",BA:"BAM",BW:"BWP",BR:"BRL",
  BN:"BND",BG:"BGN",BF:"XOF",BI:"BIF",CV:"CVE",KH:"KHR",CM:"XAF",CA:"CAD",
  CF:"XAF",TD:"XAF",CL:"CLP",CN:"CNY",CO:"COP",KM:"KMF",CG:"XAF",CD:"CDF",
  CR:"CRC",CI:"XOF",HR:"HRK",CU:"CUP",CY:"EUR",CZ:"CZK",DK:"DKK",DJ:"DJF",
  DM:"XCD",DO:"DOP",EC:"USD",EG:"EGP",SV:"USD",GQ:"XAF",ER:"ERN",EE:"EUR",
  SZ:"SZL",ET:"ETB",FJ:"FJD",FI:"EUR",FR:"EUR",GA:"XAF",GM:"GMD",GE:"GEL",
  DE:"EUR",GH:"GHS",GR:"EUR",GD:"XCD",GT:"GTQ",GN:"GNF",GW:"XOF",GY:"GYD",
  HT:"HTG",HN:"HNL",HU:"HUF",IS:"ISK",IN:"INR",ID:"IDR",IR:"IRR",IQ:"IQD",
  IE:"EUR",IL:"ILS",IT:"EUR",JM:"JMD",JP:"JPY",JO:"JOD",KZ:"KZT",KE:"KES",
  KI:"AUD",KW:"KWD",KG:"KGS",LA:"LAK",LV:"EUR",LB:"LBP",LS:"LSL",LR:"LRD",
  LY:"LYD",LI:"CHF",LT:"EUR",LU:"EUR",MG:"MGA",MW:"MWK",MY:"MYR",MV:"MVR",
  ML:"XOF",MT:"EUR",MH:"USD",MR:"MRU",MU:"MUR",MX:"MXN",FM:"USD",MD:"MDL",
  MC:"EUR",MN:"MNT",ME:"EUR",MA:"MAD",MZ:"MZN",MM:"MMK",NA:"NAD",NR:"AUD",
  NP:"NPR",NL:"EUR",NZ:"NZD",NI:"NIO",NE:"XOF",NG:"NGN",MK:"MKD",NO:"NOK",
  OM:"OMR",PK:"PKR",PW:"USD",PA:"PAB",PG:"PGK",PY:"PYG",PE:"PEN",PH:"PHP",
  PL:"PLN",PT:"EUR",QA:"QAR",RO:"RON",RU:"RUB",RW:"RWF",KN:"XCD",LC:"XCD",
  VC:"XCD",WS:"WST",SM:"EUR",ST:"STN",SA:"SAR",SN:"XOF",RS:"RSD",SC:"SCR",
  SL:"SLL",SG:"SGD",SK:"EUR",SI:"EUR",SB:"SBD",SO:"SOS",ZA:"ZAR",SS:"SDG",
  ES:"EUR",LK:"LKR",SD:"SDG",SR:"SRD",SE:"SEK",CH:"CHF",SY:"SYP",TW:"TWD",
  TJ:"TJS",TZ:"TZS",TH:"THB",TL:"USD",TG:"XOF",TO:"TOP",TT:"TTD",TN:"TND",
  TR:"TRY",TM:"TMT",TV:"AUD",UG:"UGX",UA:"UAH",AE:"AED",GB:"GBP",US:"USD",
  UY:"UYU",UZ:"UZS",VU:"VUV",VE:"VES",VN:"VND",YE:"YER",ZM:"ZMW",ZW:"ZWL",
  KP:"KPW",KR:"KRW",HK:"HKD",MO:"MOP",FO:"DKK",GL:"DKK",
};

export const symbolFor        = (code) => CURRENCY_SYMBOLS[code?.toUpperCase()] || code || "$";
export const countryToCurrency = (cc)  => COUNTRY_CURRENCY[cc?.toUpperCase()] || null;

// ─── Emergency fallback rates (USD-base, approximate) ────────────────────────
// Used ONLY when all three live APIs fail.
const EMERGENCY_USD_RATES = {
  USD:1,EUR:0.92,GBP:0.79,JPY:149.5,CNY:7.24,INR:83.1,NGN:1580,SAR:3.75,
  AED:3.67,CAD:1.36,AUD:1.53,CHF:0.90,KRW:1325,BRL:4.97,MXN:17.2,SGD:1.34,
  HKD:7.82,NOK:10.6,SEK:10.4,DKK:6.89,PLN:3.96,CZK:22.8,HUF:358,RON:4.62,
  BGN:1.80,RUB:90.5,TRY:32.1,ZAR:18.7,EGP:30.9,GHS:12.3,KES:128,TZS:2530,
  UGX:3780,ETB:56.5,MAD:10.0,TND:3.12,DZD:134,XOF:552,XAF:552,QAR:3.64,
  KWD:0.308,BHD:0.377,OMR:0.385,JOD:0.71,IQD:1310,PKR:278,BDT:110,LKR:315,
  NPR:133,MYR:4.72,IDR:15600,PHP:56.2,THB:35.1,VND:24300,TWD:31.6,ILS:3.71,
  UAH:37.5,KZT:450,GEL:2.66,AMD:403,AZN:1.70,MDL:17.8,RSD:108,ALL:93,
  CLP:897,COP:3900,ARS:870,PEN:3.71,UYU:38.9,BOB:6.91,GTQ:7.81,HNL:24.7,
  NIO:36.7,CRC:517,JMD:156,TTD:6.79,DOP:58.5,NZD:1.63,HRK:6.96,HUF:358,
  ISK:138,BWP:13.6,GEL:2.66,MUR:45.5,MWK:1730,ZMW:26.5,
};

// ─── Cache helpers (localStorage with sessionStorage fallback) ────────────────
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
  }
}

// ─── Load USD-based exchange rates ───────────────────────────────────────────
async function loadRatesUSD() {
  const cached = cacheGet("blvck_rates_usd");
  if (cached) return cached;

  const sources = [
    async () => {
      const r = await fetch("https://open.er-api.com/v6/latest/USD",
        { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      if (d?.result === "success" && d.rates?.NGN) return d.rates;
      return null;
    },
    async () => {
      const r = await fetch("https://api.exchangerate-api.com/v4/latest/USD",
        { signal: AbortSignal.timeout(5000) });
      const d = await r.json();
      if (d?.rates?.NGN) return d.rates;
      return null;
    },
    async () => {
      // Hosted on jsDelivr CDN — extremely high uptime, no CORS issues
      const r = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
        { signal: AbortSignal.timeout(6000) }
      );
      const d = await r.json();
      if (!d?.usd) return null;
      const rates = { USD: 1 };
      for (const [k, v] of Object.entries(d.usd)) rates[k.toUpperCase()] = Number(v);
      return rates;
    },
  ];

  for (let i = 0; i < sources.length; i++) {
    try {
      const rates = await sources[i]();
      if (rates && rates.NGN) {
        console.log(`[CurrencyContext] ✅ Rates loaded (source ${i + 1}). NGN=${rates.NGN}, SAR=${rates.SAR}`);
        cacheSet("blvck_rates_usd", rates);
        return rates;
      }
    } catch (e) {
      console.warn(`[CurrencyContext] Rate source ${i + 1} failed:`, e.message);
    }
  }

  console.warn("[CurrencyContext] ⚠️ All live sources failed — using hardcoded fallback rates.");
  return EMERGENCY_USD_RATES;
}

// ─── Detect user's currency ───────────────────────────────────────────────────
// Tier 1: ipinfo.io  (no CORS issues, free, reliable)
// Tier 2: Cloudflare trace  (no CORS, ultra-reliable, parses plain text)
// Tier 3: User's saved profile country in DB
// Tier 4: baseCurrency prop (admin default)
async function detectCurrency(baseCurrency) {
  // Tier 1: ipinfo.io
  try {
    const r = await fetch("https://ipinfo.io/json", { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    const cc = d?.country?.toUpperCase();
    const c  = cc ? countryToCurrency(cc) : null;
    if (c) { console.log("[CurrencyContext] 📍 Geo via ipinfo.io:", c); return c; }
  } catch {}

  // Tier 2: Cloudflare trace (returns plain text like "loc=NG")
  try {
    const r    = await fetch("https://cloudflare.com/cdn-cgi/trace", { signal: AbortSignal.timeout(3000) });
    const text = await r.text();
    const cc   = text.match(/loc=([A-Z]{2})/)?.[1];
    const c    = cc ? countryToCurrency(cc) : null;
    if (c) { console.log("[CurrencyContext] 📍 Geo via Cloudflare:", c); return c; }
  } catch {}

  // Tier 3: saved profile
  const token = localStorage.getItem("blvck_token") || sessionStorage.getItem("blvck_token");
  if (token) {
    for (const url of [
      "https://blvckmrktng.com/api/brand/profile",
      "https://blvckmrktng.com/api/auth/me",
    ]) {
      try {
        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(3000),
        });
        if (!r.ok) continue;
        const json    = await r.json();
        const profile = json?.data || json?.user || json;
        const cc      = profile?.country_code || profile?.country;
        if (cc) {
          const c = countryToCurrency(cc.toUpperCase());
          if (c) { console.log("[CurrencyContext] 📍 Currency from profile:", c); return c; }
        }
      } catch {}
    }
  }

  // Tier 4: site default
  console.log("[CurrencyContext] 📍 Using default base currency:", baseCurrency);
  return baseCurrency;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CurrencyContext = createContext(null);

export function CurrencyProvider({ baseCurrency = "NGN", children }) {
  const [userCurrency, setUserCurrency] = useState(() => {
    // Restore from cache immediately to prevent flash of wrong currency
    return cacheGet("blvck_geo")?.currency || baseCurrency;
  });
  const [ratesUSD,    setRatesUSD]    = useState(null);
  const [ratesReady,  setRatesReady]  = useState(false);
  const [loading,     setLoading]     = useState(true);

  // Detect currency on mount
  useEffect(() => {
    if (cacheGet("blvck_geo")?.currency) return; // already restored from cache
    detectCurrency(baseCurrency).then((c) => {
      setUserCurrency(c);
      cacheSet("blvck_geo", { currency: c });
    });
  }, [baseCurrency]);

  // Load exchange rates on mount
  useEffect(() => {
    loadRatesUSD().then((rates) => {
      setRatesUSD(rates);
      setRatesReady(true);
      setLoading(false);
    });
  }, []);

  // ── convert(amount, fromCurrency) → number in userCurrency ────────────────
  //
  // All rates are USD-based, so we pivot through USD:
  //   SAR 2500 → USD:  2500 / ratesUSD["SAR"]  = 2500 / 3.75  = 666.67
  //   USD → NGN:       666.67 * ratesUSD["NGN"] = 666.67 * 1580 = 1,053,333
  //
  const convert = useCallback(
    (amount, fromCurrency) => {
      const num  = Number(amount) || 0;
      const FROM = (fromCurrency || baseCurrency).toUpperCase();
      const TO   = userCurrency.toUpperCase();

      if (FROM === TO) return num;
      if (!ratesUSD)   return num; // not loaded yet — will re-render when ready

      const rateFrom = ratesUSD[FROM];
      const rateTo   = ratesUSD[TO];

      if (!rateFrom) { console.warn(`[CurrencyContext] No rate for ${FROM}`); return num; }
      if (!rateTo)   { console.warn(`[CurrencyContext] No rate for ${TO}`);   return num; }

      return (num / rateFrom) * rateTo;
    },
    [ratesUSD, baseCurrency, userCurrency]
  );

  // ── fmtMoney(amount, fromCurrency?) → formatted string ───────────────────
  //
  //   fmtMoney(item.price, baseCurrency)   → converts DB price → user currency + formats
  //   fmtMoney(alreadyConvertedSubtotal)   → no conversion, just formats
  //
  // Default fromCurrency = userCurrency means "already converted, just format".
  //
  const fmtMoney = useCallback(
    (amount, fromCurrency) => {
      const FROM      = (fromCurrency || userCurrency).toUpperCase();
      const converted = FROM === userCurrency.toUpperCase()
        ? (Number(amount) || 0)
        : convert(amount, FROM);

      const sym = symbolFor(userCurrency);

      // Currencies that never use decimal places
      const zeroDecimal = [
        "JPY","KRW","VND","IDR","CLP","PYG","RWF","UGX","BIF","GNF",
        "KMF","MGA","XAF","XOF","XPF","KPW","MMK","LAK","IRR","YER",
      ].includes(userCurrency.toUpperCase());

      const showCents = !zeroDecimal && converted < 1000 && converted !== Math.floor(converted);

      return sym + converted.toLocaleString("en-US", {
        minimumFractionDigits: showCents ? 2 : 0,
        maximumFractionDigits: showCents ? 2 : 0,
      });
    },
    [convert, userCurrency]
  );

  const value = useMemo(() => ({
    userCurrency,
    userSymbol: symbolFor(userCurrency),
    baseCurrency,
    rates: ratesUSD,
    ratesReady,
    loading,
    convert,
    fmtMoney,
  }), [userCurrency, baseCurrency, ratesUSD, ratesReady, loading, convert, fmtMoney]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be inside <CurrencyProvider>");
  return ctx;
}

export default CurrencyContext;
