import {createContext, useContext, useEffect, useState} from "react";

const BASE = (import.meta.env.VITE_API_URL ?? "") + "/api";
const ContactContentContext = createContext({});

async function fetchContactContent() {
  try {
    const res = await fetch(`${BASE}/pages/contact`);
    if (!res.ok) return {};
    const json = await res.json();
    return json?.data?.content ?? json?.content ?? {};
  } catch {
    return {};
  }
}

export function ContactContentProvider({children}) {
  const [content, setContent] = useState(null);
  useEffect(() => {
    fetchContactContent().then(setContent);
  }, []);
  return (
    <ContactContentContext.Provider value={{content, loading: content === null}}>
      {children}
    </ContactContentContext.Provider>
  );
}

export function useContactContent(key, fallback = "") {
  const {content} = useContext(ContactContentContext);
  if (!content) return fallback;
  const val = content[key];
  if (val === undefined || val === null || val === "") return fallback;
  return val;
}
