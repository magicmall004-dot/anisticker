import { createContext, useContext, useState, useEffect } from "react";

export const GRAPHICS_LEVELS = ["low", "balanced", "high", "ultra"];
const STORAGE_KEY = "graphicsQuality";
const DEFAULT_LEVEL = "high";

// Each tier controls which decorative effects are allowed to run.
// Lower tiers strip out anything with a real CPU/GPU/re-render cost
// (parallax scroll math, glow box-shadows, extra Lottie instances,
// high-frequency touchmove state updates for pull-to-refresh, etc.)
const EFFECTS_BY_LEVEL = {
  low: {
    meshBackground: false,
    parallaxIntensity: 0,
    cardPressGlow: false,
    cardSelectedGlow: false,
    cardEntranceAnimation: false,
    badgePulse: false,
    badgeAnimatedEmoji: false,
    cartBarBounce: false,
    pullToRefresh: false,
  },
  balanced: {
    meshBackground: false,
    parallaxIntensity: 0,
    cardPressGlow: false,
    cardSelectedGlow: true,
    cardEntranceAnimation: true,
    badgePulse: false,
    badgeAnimatedEmoji: true,
    cartBarBounce: true,
    pullToRefresh: true,
  },
  high: {
    meshBackground: true,
    parallaxIntensity: 0.6,
    cardPressGlow: true,
    cardSelectedGlow: true,
    cardEntranceAnimation: true,
    badgePulse: true,
    badgeAnimatedEmoji: true,
    cartBarBounce: true,
    pullToRefresh: true,
  },
  ultra: {
    meshBackground: true,
    parallaxIntensity: 1,
    cardPressGlow: true,
    cardSelectedGlow: true,
    cardEntranceAnimation: true,
    badgePulse: true,
    badgeAnimatedEmoji: true,
    cartBarBounce: true,
    pullToRefresh: true,
  },
};

const GraphicsCtx = createContext({
  level: DEFAULT_LEVEL,
  effects: EFFECTS_BY_LEVEL[DEFAULT_LEVEL],
  setLevel: () => {},
});

export function GraphicsProvider({ children }) {
  const [level, setLevelState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return GRAPHICS_LEVELS.includes(stored) ? stored : DEFAULT_LEVEL;
    } catch (e) {
      return DEFAULT_LEVEL;
    }
  });

  useEffect(() => { document.documentElement.dataset.gfx = level; }, [level]);

  function setLevel(next) {
    if (!GRAPHICS_LEVELS.includes(next)) return;
    setLevelState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* ignore */ }
  }

  return (
    <GraphicsCtx.Provider value={{ level, setLevel, effects: EFFECTS_BY_LEVEL[level] }}>
      {children}
    </GraphicsCtx.Provider>
  );
}

export function useGraphics() {
  return useContext(GraphicsCtx);
}
