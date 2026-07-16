import {createContext, useContext, useState, useEffect} from "react";

const AuthContext = createContext(null);

const KEY = "blvck_token";

// Read token from whichever storage has it (localStorage = remembered, sessionStorage = not)
function readToken() {
  return localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || null;
}

export function AuthProvider({children}) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => readToken());
  const [loading, setLoading] = useState(true);

  // On mount — validate token against the server
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch("https://blvckmrktng.com/api/auth/me", {
      headers: {Authorization: `Bearer ${token}`},
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setUser(res.data.user ?? res.data);
        else logout();
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  // remember=true  → localStorage  (survives browser close)
  // remember=false → sessionStorage (clears when tab/browser closes)
  const login = (newToken, userData, remember = false) => {
    if (remember) {
      localStorage.setItem(KEY, newToken);
      sessionStorage.removeItem(KEY);
    } else {
      sessionStorage.setItem(KEY, newToken);
      localStorage.removeItem(KEY);
    }
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{user, token, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
