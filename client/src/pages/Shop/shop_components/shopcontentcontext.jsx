import {createContext, useContext, useEffect, useState} from "react";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://blvckmrktng.com";
const BASE = API_BASE + "/api";

const ShopContentContext = createContext({});

async function fetchShopContent() {
  try {
    const res = await fetch(`${BASE}/pages/shop`);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

export function ShopContentProvider({children}) {
  const [content, setContent] = useState(null);
  useEffect(() => {
    fetchShopContent().then(setContent);
  }, []);
  return (
    <ShopContentContext.Provider value={{content, loading: content === null}}>
      {children}
    </ShopContentContext.Provider>
  );
}

export function useShopContent(key, fallback = "") {
  const {content} = useContext(ShopContentContext);
  if (!content) return fallback;
  const val = content[key];
  if (val === undefined || val === null || val === "") return fallback;
  return val;
}

export function useShopContentRaw() {
  return useContext(ShopContentContext);
}
