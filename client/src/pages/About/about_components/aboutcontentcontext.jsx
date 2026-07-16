import {createContext, useContext, useEffect, useState} from "react";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

const AboutContentContext = createContext({});

async function fetchAboutContent() {
  try {
    const res = await fetch(`${BASE}/pages/about`);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

export function AboutContentProvider({children}) {
  const [content, setContent] = useState(null);

  useEffect(() => {
    fetchAboutContent().then(setContent);
  }, []);

  return (
    <AboutContentContext.Provider value={{content, loading: content === null}}>
      {children}
    </AboutContentContext.Provider>
  );
}

export function useAboutContent(key, fallback = "") {
  const {content} = useContext(AboutContentContext);
  if (!content) return fallback;
  const val = content[key];
  if (val === undefined || val === null || val === "") return fallback;
  return val;
}
