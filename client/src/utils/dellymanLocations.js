// utils/dellymanLocations.js
//
// Lazy-loading singleton fetch of Dellyman's own state/city reference list
// (GET /api/dellyman/locations, backed by their undocumented /States and
// /Cities endpoints — see server/handlers/dellyman.go). The generic
// country-state-city npm package used for address suggestions everywhere
// doesn't have Dellyman's own area names (e.g. Lagos "Ketu", "Agric"), so
// this gets merged into the typeahead's city suggestions alongside it —
// letting users pick names that actually match what Dellyman expects.
import {useState, useEffect} from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";

let _cache = null;
let _promise = null;

function fetchLocations() {
  if (_promise) return _promise;
  _promise = fetch(`${API_BASE}/api/dellyman/locations`)
    .then((r) => r.json())
    .then((json) => {
      _cache = (json?.data ?? json)?.states || {};
      return _cache;
    })
    .catch(() => {
      _cache = {};
      return _cache;
    });
  return _promise;
}

export function useDellymanLocations() {
  const [states, setStates] = useState(_cache || {});
  const [loaded, setLoaded] = useState(!!_cache);

  useEffect(() => {
    if (_cache) return;
    let cancelled = false;
    fetchLocations().then((data) => {
      if (!cancelled) {
        setStates(data);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {states, loaded};
}

// Dellyman's own state names have quirks the country-state-city library
// doesn't share — missing spaces ("AkwaIbom", "CrossRiver"), a typo
// ("Plataeu" for Plateau), and "Federal Capital Territory" vs the library's
// "Abuja Federal Capital Territory". Normalizing both sides to
// letters-only + a small alias table matches them up regardless.
const STATE_ALIASES = {plataeu: "plateau"};
function normalizeStateKey(name) {
  const key = (name || "").toLowerCase().replace(/[^a-z]/g, "");
  return STATE_ALIASES[key] || key;
}

// Finds Dellyman's city list for a given (library) state name.
export function findDellymanCities(states, stateName) {
  if (!stateName || !states) return [];
  const target = normalizeStateKey(stateName);
  if (!target) return [];
  for (const [dmState, cities] of Object.entries(states)) {
    const dmKey = normalizeStateKey(dmState);
    if (dmKey === target || target.includes(dmKey) || dmKey.includes(target)) {
      return cities;
    }
  }
  return [];
}

// Merges any number of city-name lists into deduped {value,label} options,
// case-insensitively, sorted alphabetically.
export function mergeCityNames(...lists) {
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const name of list || []) {
      const key = name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push({value: name, label: name});
    }
  }
  return merged.sort((a, b) => a.label.localeCompare(b.label));
}
