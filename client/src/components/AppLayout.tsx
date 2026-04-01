import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  hideNav?: boolean;
}

const NAV_ITEMS = [
  {
    key: "inicio", label: "Inicio", to: "/dashboard", matches: ["/dashboard"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#F97316" : "none"} stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    key: "recetas", label: "Recetas", to: "/recipes", matches: ["/recipes"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/>
      </svg>
    ),
  },
  {
    key: "diario", label: "Diario", to: "/meal-log", matches: ["/meal-log"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
  {
    key: "menus", label: "Menús", to: "/menus", matches: ["/menus"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    key: "perfil", label: "Perfil", to: "/profile", matches: ["/profile"],
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

const SIDEBAR_ITEMS = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard", emoji: "🏠" },
  { key: "recipes", label: "Recetas", to: "/recipes", emoji: "📖" },
  { key: "menus", label: "Planificador de Menús", to: "/menus", emoji: "📅" },
  { key: "shopping", label: "Lista de Compra", to: "/shopping-lists", emoji: "🛒" },
  { key: "inventory", label: "Inventario", to: "/inventory", emoji: "📦" },
  { key: "meal-log", label: "Diario Nutricional", to: "/meal-log", emoji: "📊" },
  { key: "profile", label: "Mi Perfil", to: "/profile", emoji: "👤" },
  { key: "subscription", label: "Suscripción", to: "/subscription", emoji: "⭐" },
  { key: "buddy-shop", label: "BuddyShop ↗", to: "/buddy-shop", emoji: "🛖" },
  { key: "supermercados", label: "Supermercados", to: "/supermercados", emoji: "🏪" },
  { key: "buddy-experts", label: "BuddyExperts", to: "/buddy-experts", emoji: "🧑‍🍳" },
];

function matchesPath(location: string, paths: string[]) {
  return paths.some((p) => location === p || location.startsWith(p + "/"));
}

export default function AppLayout({ children, title, showBack = false, onBack, headerRight, hideNav = false }: AppLayoutProps) {
  const { loading, isAuthenticated, user } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8F0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "22px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 28px rgba(249,115,22,0.40)" }}>
            <span style={{ fontSize: "36px" }}>🛒</span>
          </div>
          <p style={{ fontSize: "20px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: 0 }}>BuddyMarket</p>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 150, 300].map((delay) => (
              <div key={delay} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F97316", animation: "bounce 1s infinite", animationDelay: `${delay}ms` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }

  const shouldShowNav = !hideNav && !location.startsWith("/onboarding");
  const currentNavItem = NAV_ITEMS.find((item) => matchesPath(location, item.matches));
  const currentSidebarItem = SIDEBAR_ITEMS.find((item) => location === item.to || location.startsWith(item.to + "/"));
  const pageTitle = title || currentNavItem?.label || currentSidebarItem?.label || "BuddyMarket";
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const userName = user?.name || "Usuario";
  const userEmail = user?.email || "";

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto", minHeight: "100dvh", background: "#FFF8F0", position: "relative", overflow: "hidden" }}>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, backdropFilter: "blur(2px)" }} />
      )}

      {/* Sidebar Panel */}
      <div style={{
        position: "fixed",
        top: 0,
        left: sidebarOpen ? "max(0px, calc(50vw - 240px))" : "max(-320px, calc(50vw - 560px))",
        width: "300px",
        height: "100dvh",
        background: "#FFFFFF",
        zIndex: 300,
        transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex",
        flexDirection: "column",
        boxShadow: sidebarOpen ? "4px 0 40px rgba(0,0,0,0.15)" : "none",
        overflowY: "auto",
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(249,115,22,0.35)", flexShrink: 0 }}>
            <span style={{ fontSize: "22px" }}>🛒</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>BuddyMarket</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#F97316", fontWeight: 600 }}>Gestor Nutricional</p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav style={{ flex: 1, padding: "12px" }}>
          {SIDEBAR_ITEMS.map((item) => {
            const active = location === item.to || location.startsWith(item.to + "/");
            return (
              <Link key={item.key} href={item.to}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", borderRadius: "14px", background: active ? "rgba(249,115,22,0.10)" : "transparent", cursor: "pointer", marginBottom: "2px", transition: "background 0.15s" }}>
                  <span style={{ fontSize: "18px", width: "22px", textAlign: "center" }}>{item.emoji}</span>
                  <span style={{ fontSize: "15px", fontWeight: active ? 700 : 500, color: active ? "#F97316" : "#374151" }}>{item.label}</span>
                  {active && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#F97316" }} />}
                </div>
              </Link>
            );
          })}
          <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "12px 4px" }} />
          <Link href="/admin">
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", borderRadius: "14px", background: location === "/admin" ? "rgba(249,115,22,0.10)" : "transparent", cursor: "pointer", marginBottom: "2px" }}>
              <span style={{ fontSize: "18px", width: "22px", textAlign: "center" }}>🛡️</span>
              <span style={{ fontSize: "15px", fontWeight: location === "/admin" ? 700 : 500, color: location === "/admin" ? "#F97316" : "#374151" }}>Administración</span>
            </div>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", borderRadius: "14px", marginTop: "4px" }}>
            <span style={{ fontSize: "18px", width: "22px", textAlign: "center" }}>🌐</span>
            <span style={{ fontSize: "15px", fontWeight: 500, color: "#374151" }}>🇪🇸 Español</span>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: "white", flexShrink: 0 }}>
            {userInitial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#1a1a1a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
          </div>
          <div style={{ background: "#F97316", borderRadius: "8px", padding: "3px 8px", fontSize: "10px", fontWeight: 800, color: "white", letterSpacing: "0.05em" }}>PRO</div>
        </div>
      </div>

      {/* Sticky Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(255,248,240,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
        {showBack ? (
          <button onClick={onBack || (() => window.history.back())} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        ) : (
          <button onClick={() => setSidebarOpen(true)} style={{ width: "40px", height: "40px", borderRadius: "12px", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(249,115,22,0.30)", flexShrink: 0 }}>
            <span style={{ fontSize: "16px" }}>🛒</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: "#9ca3af", letterSpacing: "0.02em" }}>BuddyMarket</p>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pageTitle}</p>
          </div>
        </div>

        {headerRight ? (
          <div style={{ flexShrink: 0 }}>{headerRight}</div>
        ) : (
          <button style={{ width: "40px", height: "40px", borderRadius: "12px", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0, position: "relative" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div style={{ position: "absolute", top: "8px", right: "8px", width: "8px", height: "8px", borderRadius: "50%", background: "#F97316", border: "2px solid white" }} />
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ paddingBottom: shouldShowNav ? "90px" : "0" }}>
        {children}
      </div>

      {/* Bottom Navigation */}
      {shouldShowNav && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px", zIndex: 100, padding: "0 12px", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          <div style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "24px", padding: "8px 4px", boxShadow: "0 -2px 20px rgba(0,0,0,0.08), 0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
            {NAV_ITEMS.map((item) => {
              const active = matchesPath(location, item.matches);
              return (
                <Link key={item.key} href={item.to}>
                  <button style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "6px 10px", borderRadius: "16px", border: "none", background: active ? "rgba(249,115,22,0.08)" : "transparent", cursor: "pointer", transition: "all 0.2s", minWidth: "52px" }}>
                    {item.icon(active)}
                    <span style={{ fontSize: "10px", fontWeight: active ? 800 : 500, color: active ? "#F97316" : "#9ca3af", transition: "color 0.2s" }}>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
