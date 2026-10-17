import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authLogin, getMe } from "../lib/api";
import { getInitData, ready as tgReady, getUser as tgUser } from "../lib/telegram";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [cart,      setCart]      = useState([]);  // [{design, primaryColor, secondaryColor, extraColors, customText}]

  // ── Apply saved theme palette, if any ──────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("ani_theme");
    if (saved) {
      try {
        const t = JSON.parse(saved);
        if (t.accent) document.documentElement.style.setProperty("--accent", t.accent);
        if (t.price)  document.documentElement.style.setProperty("--price", t.price);
        if (t.pink)   document.documentElement.style.setProperty("--pink", t.pink);
      } catch (e) {}
    }
  }, []);

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
    const cartItemId = `${design.id}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    setCart((prev) => [...prev, {
      cartItemId,
      design,
      primaryColor:   design.primary_color   || "#000000",
      secondaryColor: design.secondary_color || "#ffffff",
      extraColors: [...(design.extra_colors||[])],
      customText: "",
      textValues: [],
    }]);
  }, []);

  const removeFromCart = useCallback((cartItemId) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  }, []);

  const updateCartItem = useCallback((cartItemId, patch) => {
    setCart((prev) =>
      prev.map((i) => i.cartItemId === cartItemId ? { ...i, ...patch } : i)
    );
  }, []);

  // Duplicate a design in the cart: same colors, but empty text so the customer can type new text
  const duplicateCartItem = useCallback((cartItemId) => {
    const newId = `dup_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.cartItemId === cartItemId);
      if (idx < 0) return prev;
      const src = prev[idx];
      if (prev.filter((i) => i.design.id === src.design.id).length >= 10) return prev;
      const copy = {
        ...src,
        cartItemId: newId,
        extraColors: [...(src.extraColors || [])],
        instantColors: { ...(src.instantColors || {}) },
        customText: "",
        textValues: [],
        instantText: "",
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    return newId;
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = (role) =>
    cart.reduce((sum, i) => sum + (role === "reseller" ? i.design.reseller_price : i.design.user_price), 0);

  const isInCart = (designId) => cart.some((i) => i.design.id === designId);
  const countInCart = (designId) => cart.filter((i) => i.design.id === designId).length;

  return (
    <AppContext.Provider value={{
      user, setUser, authReady,
      cart, addToCart, removeFromCart, updateCartItem, clearCart, duplicateCartItem,
      cartTotal, isInCart, countInCart,
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
