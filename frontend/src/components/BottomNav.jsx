import { useNavigate, useLocation } from "react-router-dom";
import { Home, Package, Wallet, User } from "lucide-react";

const TABS = [
  { path: "/",        icon: Home,    label: "Home"    },
  { path: "/orders",  icon: Package, label: "Orders"  },
  { path: "/wallet",  icon: Wallet,  label: "Wallet"  },
  { path: "/profile", icon: User,    label: "Profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  function isActive(path) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  return (
    <div className="bottom-nav">
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = isActive(path);
        return (
          <div key={path} className={`bottom-nav-item ${active ? "active" : ""}`}
            onClick={() => navigate(path)}>
            {active && <div className="bottom-nav-indicator" />}
            <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
