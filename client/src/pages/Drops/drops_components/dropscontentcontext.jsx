import {createContext, useContext, useEffect, useState} from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
const BASE = API_BASE + "/api";

const DropsContentContext = createContext({});

async function fetchDropsContent() {
  try {
    const res = await fetch(`${BASE}/pages/drops`);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

async function fetchDrops(brandSlug) {
  try {
    const params = new URLSearchParams();
    if (brandSlug) params.set("brand", brandSlug);
    const url = `${BASE}/drops${params.toString() ? "?" + params : ""}`;
    const res = await fetch(url);
    if (!res.ok) return {drops: [], brands: []};
    const json = await res.json();
    const data = json?.data ?? json;
    return {
      drops: data?.drops ?? [],
      brands: data?.brands ?? [],
    };
  } catch {
    return {drops: [], brands: []};
  }
}

export function DropsContentProvider({children}) {
  const [content, setContent] = useState(null);
  const [drops, setDrops] = useState(null);
  const [brands, setBrands] = useState([]);
  const [dropsLoading, setDropsLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState("");

  useEffect(() => {
    fetchDropsContent().then(setContent);
  }, []);

  useEffect(() => {
    setDropsLoading(true);
    fetchDrops(brandFilter).then(({drops, brands: b}) => {
      setDrops(drops);
      if (!brandFilter) setBrands(b);
      setDropsLoading(false);
    });
  }, [brandFilter]);

  return (
    <DropsContentContext.Provider
      value={{
        content,
        loading: content === null,
        drops,
        brands,
        dropsLoading,
        brandFilter,
        setBrandFilter,
      }}>
      {children}
    </DropsContentContext.Provider>
  );
}

export function useDropsContent(key, fallback = "") {
  const {content} = useContext(DropsContentContext);
  if (!content) return fallback;
  const val = content[key];
  if (val === undefined || val === null || val === "") return fallback;
  return val;
}

export function useDrops() {
  const {drops, brands, dropsLoading, brandFilter, setBrandFilter} =
    useContext(DropsContentContext);
  return {
    drops: drops || [],
    brands: brands || [],
    loading: dropsLoading,
    brandFilter,
    setBrandFilter,
  };
}
