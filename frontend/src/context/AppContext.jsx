import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authLogin, getMe } from "../lib/api";
import { getInitData, ready as tgReady, getUser as tgUser } from "../lib/telegram";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart,      setCart]      = useState([]);  // [{design, primaryColor, secondaryColor, extraColors, customText}]

  // ── Boot: validate Telegram initData → JWT ────────────────
  useEffect(() => {
    tgReady();
    (async () => {
      try {
        const stored = localStorage.getItem("ani_token");
        if (stored) {
          // Verify token is still valid
          const me = await getMe();
          setUser(me);
        } else {
          const initData = getInitData();
          if (!initData) {
            // Dev fallback – no token, no initData
            setAuthReady(true);
            return;
          }
          const res = await authLogin(initData);
          localStorage.setItem("ani_token", res.access_token);
          setUser(res.user);
        }
      } catch (e) {
        console.warn("Auth failed:", e);
        localStorage.removeItem("ani_token");
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  // ── Cart helpers ──────────────────────────────────────────
  const addToCart = useCallback((design) => {
    setCart((prev) => {
      if (prev.find((i) => i.design.id === design.id)) return prev;
      return [...prev, {
        design,
        primaryColor:   design.primary_color   || "#000000",
        secondaryColor: design.secondary_color || "#ffffff",
        extraColors: [],
        customText: "",
      }];
    });
  }, []);

  const removeFromCart = useCallback((designId) => {
    setCart((prev) => prev.filter((i) => i.design.id !== designId));
  }, []);

  const updateCartItem = useCallback((designId, patch) => {
    setCart((prev) =>
      prev.map((i) => i.design.id === designId ? { ...i, ...patch } : i)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = (role) =>
    cart.reduce((sum, i) => sum + (role === "reseller" ? i.design.reseller_price : i.design.user_price), 0);

  const isInCart = (designId) => cart.some((i) => i.design.id === designId);

  return (
    <AppContext.Provider value={{
      user, setUser, authReady,
      cart, addToCart, removeFromCart, updateCartItem, clearCart,
      cartTotal, isInCart,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
