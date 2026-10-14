import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AnimationPreview from "./components/AnimationPreview";
import { useState, useEffect, lazy, Suspense } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { EmojiProvider } from "./context/EmojiContext";
import { GraphicsProvider, useGraphics } from "./context/GraphicsContext";
import { ToastProvider } from "./components/Toast";
import MeshBackground    from "./components/MeshBackground";
import BottomNav         from "./components/BottomNav";
import AchievementToast  from "./components/AchievementToast";
import MaintenanceScreen from "./components/MaintenanceScreen";
import OnboardingScreen  from "./components/OnboardingScreen";
import JoinChannelScreen from "./components/JoinChannelScreen";
import { getAppSettings, checkMembership } from "./lib/api";
import { cloudGet, cloudSet, tgReady } from "./lib/telegram";

import DesignList     from "./pages/DesignList";
import DesignSetup    from "./pages/DesignSetup";
import Payment        from "./pages/Payment";
import OrderConfirm   from "./pages/OrderConfirm";
import MyOrders       from "./pages/MyOrders";
import Profile        from "./pages/Profile";
import WalletPage     from "./pages/WalletPage";
import Leaderboard    from "./pages/Leaderboard";
// Lazy-loaded: owner panel and giveaway pages are only needed by a small
// subset of visits, so they're split into their own chunk instead of
// bloating the initial bundle every customer has to download on open.
const OwnerDashboard  = lazy(() => import("./pages/OwnerDashboard"));
const GiveawayPage    = lazy(() => import("./pages/GiveawayPage"));
const GiveawayHistory = lazy(() => import("./pages/GiveawayHistory"));

function LazyFallback() {
  return (
    <div className="loading-screen">
      <div className="loading-dots"><span/><span/><span/></div>
    </div>
  );
}

const LOGO_URL = "https://njnvplfaevaudhcjayyz.supabase.co/storage/v1/object/public/designs/logo.json";

// Renders the animated mesh background only when the current graphics
// tier allows it — this is one of the more expensive decorative effects
// (blurred, continuously-animated gradient blobs).
function ConditionalMeshBackground() {
  const { effects } = useGraphics();
  return effects.meshBackground ? <MeshBackground /> : null;
}

function ProtectedRoute({ children }) {
  const { user, authReady, authError, doAuth } = useApp();
  const [maintenance,    setMaintenance]    = useState(null);
  const [membershipStatus,setMembershipStatus]=useState(null);
  const [onboarding,    setOnboarding]    = useState(null);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [settingsChecked, setSettingsChecked] = useState(false);
  const { achievement, setAchievement } = useApp();

  useEffect(() => {
    getAppSettings().then(async (s) => {
      if (s.maintenance_mode==="true") setMaintenance({ message:s.maintenance_message, tgs:s.maintenance_tgs });
      if (s.onboarding_enabled==="true") {
        try {
          const pages=JSON.parse(s.onboarding_pages||"[]");
          if (pages.length>0) {
            setOnboarding(pages);
            setShowOnboarding(true);
          }
        } catch (e) {}
      }
    }).catch(() => {}).finally(() => setSettingsChecked(true));
  }, []);

  useEffect(() => {
    if (user) {
      checkMembership().then(setMembershipStatus).catch(() => setMembershipStatus({ required:false, is_member:true }));
    } else if (authReady) {
      setMembershipStatus((m) => m ?? { required:false, is_member:true });
    }
  }, [user, authReady]);

  const stillGating = !authReady || (user && !authError && (!settingsChecked || membershipStatus === null));
  if (stillGating) {
    return (
      <div className="loading-screen">
        <div className="loading-logo logo-ring">
          <AnimationPreview url={LOGO_URL} fileType="json" size="120px" autoplay loop />
        </div>
        <div style={{ marginTop:14 }}>
          <div className="loading-dots"><span/><span/><span/></div>
        </div>
      </div>
    );
  }

  if (authError||!user) {
    return (
      <div className="loading-screen">
        <div style={{ fontSize:48, marginBottom:12 }}>✨</div>
        <div style={{ fontWeight:800,fontSize:22 }} className="glow-text">MagicMall</div>
        <div style={{ color:"var(--hint)",fontSize:14,textAlign:"center",maxWidth:260,marginTop:8 }}>
          Please open this app through Telegram to continue.
        </div>
      </div>
    );
  }

  if (maintenance && user?.role!=="owner") return <MaintenanceScreen message={maintenance.message} tgsUrl={maintenance.tgs}/>;

  if (user?.role!=="owner" && membershipStatus?.required && !membershipStatus?.is_member) {
    return (
      <JoinChannelScreen
        channelUrl={membershipStatus.channel_url}
        onVerified={() => setMembershipStatus(m=>({...m,is_member:true}))}
        onRecheck={async () => { const res=await checkMembership(); setMembershipStatus(res); return res.is_member; }}
      />
    );
  }

  if (showOnboarding && onboarding) {
    return <OnboardingScreen pages={onboarding} onFinish={() => setShowOnboarding(false)}/>;
  }

  return (
    <>
      {achievement && <AchievementToast message={achievement.message} emoji={achievement.emoji} onDone={() => setAchievement(null)}/>}
      {children}
    </>
  );
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/"              element={<ProtectedRoute><DesignList /></ProtectedRoute>} />
        <Route path="/setup"         element={<ProtectedRoute><DesignSetup /></ProtectedRoute>} />
        <Route path="/payment"       element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/order-confirm" element={<ProtectedRoute><OrderConfirm /></ProtectedRoute>} />
        <Route path="/orders"        element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/owner"         element={<ProtectedRoute><Suspense fallback={<LazyFallback/>}><OwnerDashboard /></Suspense></ProtectedRoute>} />
        <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wallet"        element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        <Route path="/leaderboard"   element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/giveaway/:id"  element={<ProtectedRoute><Suspense fallback={<LazyFallback/>}><GiveawayPage /></Suspense></ProtectedRoute>} />
        <Route path="/giveaways"     element={<ProtectedRoute><Suspense fallback={<LazyFallback/>}><GiveawayHistory /></Suspense></ProtectedRoute>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  useEffect(() => { tgReady(); }, []);
  return (
    <BrowserRouter basename="/anisticker">
      <AppProvider>
        <EmojiProvider>
          <GraphicsProvider>
            <ToastProvider>
              <ConditionalMeshBackground />
              <BottomNav />
              <AppRoutes />
            </ToastProvider>
          </GraphicsProvider>
        </EmojiProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
