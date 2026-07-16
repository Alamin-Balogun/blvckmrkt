// src/utils/geo.js
// ✅ Single lazy-loading wrapper for country-state-city
// Import from HERE instead of "country-state-city" directly
// This keeps the 8.7MB data out of the main bundle

import { useState, useEffect } from "react";

let _lib = null;

async function getLib() {
  if (!_lib) {
    _lib = await import("country-state-city");
  }
  return _lib;
}

// ── Sync versions (for components that already have data loaded) ──────────────
// These work AFTER the lib has been loaded once
export function getCountrySync() {
  return _lib?.Country ?? null;
}
export function getStateSync() {
  return _lib?.State ?? null;
}
export function getCitySync() {
  return _lib?.City ?? null;
}

// ── Async loaders ─────────────────────────────────────────────────────────────
export async function loadGeo() {
  return getLib();
}

export async function getAllCountries() {
  const { Country } = await getLib();
  return Country.getAllCountries();
}

export async function getCountryByCode(code) {
  const { Country } = await getLib();
  return Country.getCountryByCode(code);
}

export async function getAllCountriesOfWorld() {
  const { Country } = await getLib();
  return Country.getAllCountries();
}

export async function getStatesOfCountry(countryCode) {
  const { State } = await getLib();
  return State.getStatesOfCountry(countryCode);
}

export async function getStateByCode(stateCode, countryCode) {
  const { State } = await getLib();
  return State.getStateByCodeAndCountry(stateCode, countryCode);
}

export async function getCitiesOfState(countryCode, stateCode) {
  const { City } = await getLib();
  return City.getCitiesOfState(countryCode, stateCode);
}

export async function getCitiesOfCountry(countryCode) {
  const { City } = await getLib();
  return City.getCitiesOfCountry(countryCode);
}

// ── React hook — loads everything once, gives you Country/State/City objects ──
// Use this in components that need direct access to the class methods
// 
// Usage:
//   const { Country, State, City, loaded } = useGeo()
//   if (!loaded) return <div>Loading...</div>
//   const countries = Country.getAllCountries()

export function useGeo() {
  const [geo, setGeo] = useState(() => {
    // If already loaded (eager load finished), return immediately
    if (_lib) {
      return {
        Country: _lib.Country,
        State: _lib.State,
        City: _lib.City,
        loaded: true,
      };
    }
    return { Country: null, State: null, City: null, loaded: false };
  });

  useEffect(() => {
    if (geo.loaded) return; // already ready, skip
    let cancelled = false;
    getLib().then((lib) => {
      if (!cancelled) {
        setGeo({
          Country: lib.Country,
          State: lib.State,
          City: lib.City,
          loaded: true,
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  return geo;
}

// Eagerly kick off loading so it's ready by the time any component needs it
getLib();