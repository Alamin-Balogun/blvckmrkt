import {createContext, useContext, useEffect, useState} from "react";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";
const BlogContentContext = createContext({});

async function fetchBlogContent() {
  try {
    const res = await fetch(`${BASE}/pages/blog`);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

export function BlogContentProvider({children}) {
  const [content, setContent] = useState(null);
  useEffect(() => {
    fetchBlogContent().then(setContent);
  }, []);
  return (
    <BlogContentContext.Provider value={{content, loading: content === null}}>
      {children}
    </BlogContentContext.Provider>
  );
}

export function useBlogContent(key, fallback = "") {
  const {content} = useContext(BlogContentContext);
  if (!content) return fallback;
  const val = content[key];
  if (val === undefined || val === null || val === "") return fallback;
  return val;
}
