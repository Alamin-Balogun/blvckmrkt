import {createContext, useContext, useEffect, useState} from "react";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";

const HomeContentContext = createContext({});

// Fetch the home page content_json from the public site pages endpoint
async function fetchHomeContent() {
  try {
    const res = await fetch(`${BASE}/pages/home`);
    if (!res.ok) return {};
    const json = await res.json();
    // Support both { data: { content: {...} } } and { content: {...} }
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

export function HomeContentProvider({children}) {
  const [content, setContent] = useState(null); // null = loading

  useEffect(() => {
    fetchHomeContent().then(setContent);
  }, []);

  return (
    <HomeContentContext.Provider value={{content, loading: content === null}}>
      {children}
    </HomeContentContext.Provider>
  );
}

// Hook — returns content value with a fallback to the hardcoded default
export function useHomeContent(key, fallback = "") {
  const {content} = useContext(HomeContentContext);
  if (!content) return fallback;
  const val = content[key];
  if (val === undefined || val === null || val === "") return fallback;
  return val;
}

// Hook — returns the full content object and loading state
export function useHomeContentRaw() {
  return useContext(HomeContentContext);
}
