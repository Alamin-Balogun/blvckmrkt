import {createContext, useContext, useEffect, useState} from "react";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";
const BrandsContentContext = createContext({});

async function fetchBrandsContent() {
  try {
    const res = await fetch(`${BASE}/pages/brands`);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

export function BrandsContentProvider({children}) {
  const [content, setContent] = useState(null);
  useEffect(() => {
    fetchBrandsContent().then(setContent);
  }, []);
  return (
    <BrandsContentContext.Provider value={{content, loading: content === null}}>
      {children}
    </BrandsContentContext.Provider>
  );
}

export function useBrandsContent(key, fallback = "") {
  const {content} = useContext(BrandsContentContext);
  if (!content) return fallback;
  const val = content[key];
  if (val === undefined || val === null || val === "") return fallback;
  return val;
}
