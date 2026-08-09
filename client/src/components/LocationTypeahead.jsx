// components/LocationTypeahead.jsx
//
// Shared country/state/city input — a real typeable text field, not a
// click-to-open picker. Typing filters a live dropdown of every option
// (shown in full on focus, narrowed as you type), but the field never
// forces a match: whatever text is in the box is the value, so someone who
// can't find their country/state/city on the list can just type it in by
// hand. Selecting a suggestion snaps the text to its canonical label and
// reports the option back via onSelect so the parent can resolve an ISO
// code (used only to drive the next field's suggestions).
//
// Originally lived only in the checkout page — now shared so every address
// form (brand Addresses page, buyer/brand dashboard quick-buy modals) has
// the exact same input behavior as checkout.
import {useState, useRef, useEffect, useMemo, useCallback} from "react";
import {createPortal} from "react-dom";
import {useGeo} from "../utils/geo";
import {useDellymanLocations, findDellymanCities, mergeCityNames} from "../utils/dellymanLocations";

export function TypeaheadField({options, text, onTextChange, onSelect, placeholder, disabled, hasError}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({top: 0, left: 0, width: 0});

  const filtered = useMemo(() => {
    const q = (text || "").trim().toLowerCase();
    if (!q) return options.slice(0, 250);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 250);
  }, [options, text]);

  const syncCoords = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) {
      setOpen(false);
      return;
    }
    setCoords({top: r.bottom + 6, left: r.left, width: r.width});
  }, []);

  const openDropdown = useCallback(() => {
    if (disabled || options.length === 0) return;
    syncCoords();
    setOpen(true);
  }, [disabled, options.length, syncCoords]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", syncCoords, {passive: true, capture: true});
    window.addEventListener("resize", syncCoords, {passive: true});
    return () => {
      window.removeEventListener("scroll", syncCoords, {capture: true});
      window.removeEventListener("resize", syncCoords);
    };
  }, [open, syncCoords]);

  const pick = (opt) => {
    onSelect(opt);
    setOpen(false);
  };

  return (
    <>
      <div style={{position: "relative"}}>
        <input
          ref={inputRef}
          type="text"
          value={text || ""}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => {
            onTextChange(e.target.value);
            if (options.length > 0) openDropdown();
          }}
          onFocus={() => openDropdown()}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          style={{
            background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${hasError ? "#ef4444" : open ? "rgba(239,68,68,0.55)" : "rgba(255,255,255,0.1)"}`,
            color: "#fff",
            fontSize: 13,
            padding: options.length > 0 ? "12px 34px 12px 14px" : "12px 14px",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 8,
            transition: "border-color 0.2s",
            fontFamily: "inherit",
            boxShadow: open ? "0 0 0 3px rgba(239,68,68,0.1)" : "none",
            cursor: disabled ? "not-allowed" : "text",
          }}
        />
        {options.length > 0 && (
          <svg
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)",
              transition: "transform 0.18s",
              pointerEvents: "none",
            }}
            width="11"
            height="11"
            fill="none"
            viewBox="0 0 24 24"
            stroke={disabled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"}
            strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {open &&
        options.length > 0 &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              background: "#181818",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 12,
              zIndex: 99999,
              boxShadow: "0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(239,68,68,0.08)",
              overflow: "hidden",
            }}>
            <div style={{maxHeight: 260, overflowY: "auto"}}>
              {filtered.length === 0 ? (
                <div style={{padding: "18px", color: "rgba(255,255,255,0.25)", fontSize: 12, textAlign: "center"}}>
                  No matches — the text you typed will be used as-is
                </div>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.label.toLowerCase() === (text || "").trim().toLowerCase();
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      // onMouseDown (not onClick) fires before the input's onBlur,
                      // so the pick registers before the dropdown closes.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pick(opt);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        padding: "9px 14px",
                        cursor: "pointer",
                        fontSize: 13,
                        background: isSelected ? "rgba(239,68,68,0.1)" : "transparent",
                        color: isSelected ? "#ef4444" : "rgba(255,255,255,0.72)",
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "transparent";
                      }}>
                      {opt.flag && (
                        <span style={{fontSize: 15, lineHeight: 1, flexShrink: 0}}>{opt.flag}</span>
                      )}
                      <span style={{flex: 1}}>{opt.label}</span>
                      {isSelected && (
                        <svg width="11" height="11" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// useLocationOptions — for forms that only persist country/state/city as
// plain name strings (no ISO code fields of their own, e.g. the brand
// Addresses form). Resolves ISO codes on the fly from the current name text
// so TypeaheadField's cascading suggestions work without the parent having
// to track separate _code fields.
export function useLocationOptions(countryName, stateName) {
  const {Country, State, City, loaded} = useGeo();
  const {states: dellymanStates} = useDellymanLocations();

  const countryOptions = useMemo(() => {
    if (!loaded) return [];
    return Country.getAllCountries().map((c) => ({value: c.isoCode, label: c.name, flag: c.flag}));
  }, [loaded, Country]);

  const countryCode = useMemo(() => {
    if (!loaded || !countryName) return "";
    const m = Country.getAllCountries().find(
      (c) => c.name.toLowerCase() === countryName.trim().toLowerCase()
    );
    return m?.isoCode || "";
  }, [loaded, Country, countryName]);

  const stateOptions = useMemo(() => {
    if (!loaded || !countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((s) => ({value: s.isoCode, label: s.name}));
  }, [loaded, State, countryCode]);

  const stateCode = useMemo(() => {
    if (!loaded || !countryCode || !stateName) return "";
    const m = State.getStatesOfCountry(countryCode).find(
      (s) => s.name.toLowerCase() === stateName.trim().toLowerCase()
    );
    return m?.isoCode || "";
  }, [loaded, State, countryCode, stateName]);

  const cityOptions = useMemo(() => {
    const libraryCities =
      loaded && countryCode && stateCode
        ? City.getCitiesOfState(countryCode, stateCode).map((c) => c.name)
        : [];
    const dellymanCities = countryCode === "NG" ? findDellymanCities(dellymanStates, stateName) : [];
    return mergeCityNames(libraryCities, dellymanCities);
  }, [loaded, City, countryCode, stateCode, dellymanStates, stateName]);

  return {loaded, countryOptions, stateOptions, cityOptions, countryCode, stateCode};
}
