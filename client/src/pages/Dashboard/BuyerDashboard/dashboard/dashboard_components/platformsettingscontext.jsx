/**
 * PlatformSettingsContext.jsx  —  BUYER DASHBOARD
 *
 * Mirrors the brand dashboard version exactly, but fetches from the public
 * /api/settings endpoint instead of the brand-authed one.
 *
 * All buyer pages that call usePlatformSettings().fmtMoney() get
 * geo-aware currency conversion automatically — no changes needed there.
 *
 * Usage:
 *   // Wrap your buyer dashboard root once:
 *   <PlatformSettingsProvider>
 *     <App />
 *   </PlatformSettingsProvider>
 *
 *   // Then anywhere inside:
 *   const { settings, fmtMoney } = usePlatformSettings();
 */

import {createContext, useContext, useState, useEffect, useCallback} from "react";
import {CurrencyProvider, useCurrency} from "../../../../../components/currencycontext";

// ─── Defaults (mirror admin DEFAULTS) ────────────────────────────────────────
const DEFAULTS = {
  enable_wishlist: true,
  enable_drops: true,
  drop_countdown: true,
  drop_duration_days: 0,
  disable_purchases: false,
  currency: "NGN",
  currency_symbol: "₦",
  low_stock_threshold: 5,
  commission_rate: 10,
  maintenance_mode: false,
  maintenance_message: "We're updating the platform. Back soon.",
};

// ── Module-level settings cache with 3-minute TTL ────────────────────────────
// Shared across all buyer components so we only hit the API once per session.
const SETTINGS_TTL = 3 * 60 * 1000;

let _settingsCache = null;
let _settingsCacheTs = 0;
let _settingsPromise = null;
const _settingsListeners = new Set();

function settingsCacheValid() {
  return _settingsCache !== null && Date.now() - _settingsCacheTs < SETTINGS_TTL;
}

function loadSettings() {
  if (settingsCacheValid()) return Promise.resolve(_settingsCache);
  if (_settingsPromise) return _settingsPromise;

  // Public endpoint — no auth token required for buyer-facing settings
  _settingsPromise = fetch("https://blvckmrktng.com/api/settings")
    .then((r) => r.json())
    .then((json) => {
      _settingsCache = {...DEFAULTS, ...(json?.data || json?.settings || {})};
      _settingsCacheTs = Date.now();
      _settingsPromise = null;
      _settingsListeners.forEach((fn) => fn(_settingsCache));
      _settingsListeners.clear();
      return _settingsCache;
    })
    .catch(() => {
      // On failure keep using whatever we had (or defaults) rather than
      // leaving the UI broken.
      _settingsCache = _settingsCache || {...DEFAULTS};
      _settingsCacheTs = Date.now();
      _settingsPromise = null;
      _settingsListeners.forEach((fn) => fn(_settingsCache));
      _settingsListeners.clear();
      return _settingsCache;
    });

  return _settingsPromise;
}

/** Call this if you need to force a fresh fetch (e.g. after the user logs in). */
export function invalidatePlatformSettingsCache() {
  _settingsCache = null;
  _settingsCacheTs = 0;
  _settingsPromise = null;
}

// ── Context ───────────────────────────────────────────────────────────────────
const PlatformSettingsContext = createContext(null);

// ── usePlatformSettings ───────────────────────────────────────────────────────
// The hook every buyer component calls.  Works standalone (no Provider
// wrapper required) thanks to the module-level cache.
export function usePlatformSettings() {
  const ctx = useContext(PlatformSettingsContext);
  if (ctx) return ctx;

  // ── Standalone mode (no Provider in the tree) ────────────────────────────
  const [settings, setSettings] = useState(settingsCacheValid() ? _settingsCache : DEFAULTS);
  const [loading, setLoading] = useState(!settingsCacheValid());

  useEffect(() => {
    if (settingsCacheValid()) {
      setSettings(_settingsCache);
      setLoading(false);
      return;
    }
    _settingsListeners.add(setSettings);
    loadSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
    return () => _settingsListeners.delete(setSettings);
  }, []);

  // Fallback fmtMoney uses the admin currency symbol; full geo-conversion
  // is available when the component is inside <PlatformSettingsProvider>.
  const fallbackFmt = useCallback(
    (v) => {
      const sym = settings.currency_symbol || "₦";
      return (
        sym +
        Number(v || 0).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      );
    },
    [settings.currency_symbol],
  );

  return {settings, loading, fmtMoney: fallbackFmt};
}

// ── SettingsGate ──────────────────────────────────────────────────────────────
// Wraps a feature that can be disabled by an admin setting.
// Usage: <SettingsGate settingKey="enable_wishlist" title="Wishlist" reason="...">
export function SettingsGate({settingKey, title, reason, children}) {
  const {settings, loading} = usePlatformSettings();
  if (loading)
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 14,
          height: 200,
          animation: "pulse 1.5s infinite",
        }}
      />
    );
  if (settings[settingKey] === false) return <DisabledFeature title={title} reason={reason} />;
  return <>{children}</>;
}

// ── MaintenanceBanner ─────────────────────────────────────────────────────────
export function MaintenanceBanner() {
  const {settings} = usePlatformSettings();
  if (!settings.maintenance_mode) return null;
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 10,
        padding: "11px 16px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
      <span style={{fontSize: 14}}>🔧</span>
      <div>
        <p
          style={{
            color: "#ef4444",
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 2px",
          }}>
          Platform Maintenance
        </p>
        <p style={{color: "rgba(255,255,255,0.45)", fontSize: 11, margin: 0}}>
          {settings.maintenance_message || "We're updating the platform. Back soon."}
        </p>
      </div>
    </div>
  );
}

// ── PurchasePausedBanner ──────────────────────────────────────────────────────
export function PurchasePausedBanner() {
  const {settings} = usePlatformSettings();
  if (!settings.disable_purchases) return null;
  return (
    <div
      style={{
        background: "rgba(249,115,22,0.08)",
        border: "1px solid rgba(249,115,22,0.2)",
        borderRadius: 10,
        padding: "11px 16px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
      <svg width="14" height="14" fill="none" stroke="#f97316" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <p style={{color: "#f97316", fontSize: 12, fontWeight: 700, margin: 0}}>
        Purchases are currently paused by the platform administrator. New orders cannot be placed.
      </p>
    </div>
  );
}

// ── DisabledFeature ───────────────────────────────────────────────────────────
export function DisabledFeature({title, reason}) {
  return (
    <div
      style={{
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "60px 24px",
        textAlign: "center",
      }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}>
        <svg
          width="20"
          height="20"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1.8"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <p
        style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: "1.4rem",
          color: "rgba(255,255,255,0.6)",
          letterSpacing: "0.06em",
          margin: "0 0 8px",
        }}>
        {title || "Feature Unavailable"}
      </p>
      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 13, margin: "0 auto", maxWidth: 340}}>
        {reason || "This feature has been disabled by your platform administrator."}
      </p>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

// ── CurrencyIndicator ─────────────────────────────────────────────────────────
// Drop <CurrencyIndicator /> anywhere to show e.g. "Prices shown in USD"
export function CurrencyIndicator() {
  const currency = useCurrency();
  if (!currency || currency.loading) return null;
  const {userCurrency, baseCurrency, geoError} = currency;
  if (userCurrency === baseCurrency || geoError) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(99,102,241,0.08)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 99,
        padding: "4px 12px",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: "#6366f1",
        textTransform: "uppercase",
      }}>
      <svg width="10" height="10" fill="none" stroke="#6366f1" strokeWidth="2" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Prices in {userCurrency}
    </div>
  );
}

// ── SettingsWithCurrency (internal) ──────────────────────────────────────────
// Sits inside <CurrencyProvider> so it can access useCurrency().
function SettingsWithCurrency({children}) {
  const currency = useCurrency();

  const [settings, setSettings] = useState(settingsCacheValid() ? _settingsCache : DEFAULTS);
  const [loading, setLoading] = useState(!settingsCacheValid());

  useEffect(() => {
    if (settingsCacheValid()) {
      setSettings(_settingsCache);
      setLoading(false);
      return;
    }
    loadSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });

    // Re-fetch every 3 minutes so admin changes propagate automatically
    const interval = setInterval(() => {
      invalidatePlatformSettingsCache();
      loadSettings().then((s) => setSettings(s));
    }, SETTINGS_TTL);

    return () => clearInterval(interval);
  }, []);

  // Use CurrencyContext.fmtMoney for full geo-conversion when rates are ready,
  // fall back to admin symbol otherwise.
  const fmtMoney = useCallback(
    (v, fromCurrency) => {
      const from = fromCurrency || settings.currency || "NGN";

      if (currency?.fmtMoney && !currency.loading) {
        return currency.fmtMoney(v, from);
      }

      const sym = settings.currency_symbol || "₦";
      return (
        sym +
        Number(v || 0).toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      );
    },
    [currency, settings.currency, settings.currency_symbol],
  );

  return (
    <PlatformSettingsContext.Provider value={{settings, loading, fmtMoney}}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

// ── PlatformSettingsProvider ──────────────────────────────────────────────────
// Wrap your buyer dashboard root with this once.
//
//   import { PlatformSettingsProvider } from "./PlatformSettingsContext";
//
//   <PlatformSettingsProvider>
//     <BuyerDashboard />
//   </PlatformSettingsProvider>
//
export function PlatformSettingsProvider({children}) {
  // Pre-load settings synchronously from cache (or use DEFAULTS while loading)
  // so CurrencyProvider gets the right baseCurrency on first render.
  const [settings, setSettings] = useState(settingsCacheValid() ? _settingsCache : DEFAULTS);

  useEffect(() => {
    loadSettings().then((s) => setSettings(s));
  }, []);

  const baseCurrency = settings.currency || "NGN";

  return (
    <CurrencyProvider baseCurrency={baseCurrency}>
      <SettingsWithCurrency>{children}</SettingsWithCurrency>
    </CurrencyProvider>
  );
}

export default PlatformSettingsContext;
