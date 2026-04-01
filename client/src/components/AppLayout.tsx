import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { key: "home",    label: "Inicio",   to: "/dashboard",     matches: ["/dashboard", "/"], emoji: "🏠" },
  { key: "recipes", label: "Recetas",  to: "/recipes",       matches: ["/recipes"],        emoji: "📖" },
  { key: "diary",   label: "Diario",   to: "/meal-log",      matches: ["/meal-log"],       emoji: "📋" },
  { key: "profile", label: "Perfil",   to: "/profile",       matches: ["/profile"],        emoji: "👤" },
];

const matchesPath = (pathname: string, matches: string[]) =>
  matches.some((m) => pathname === m || pathname.startsWith(`${m}/`));

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  hideNav?: boolean;
}

export default function AppLayout({
  children,
  title,
  showBack = false,
  onBack,
  headerRight,
  hideNav = false,
}: AppLayoutProps) {
  const { loading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "oklch(0.985 0.012 65)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "22px",
            background: "linear-gradient(135deg, #F97316, #FB923C)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 28px rgba(249,115,22,0.40)",
          }}>
            <span style={{ fontSize: "36px" }}>🥗</span>
          </div>
          <p style={{ fontSize: "20px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: 0 }}>
            VIVELY
          </p>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 150, 300].map((delay) => (
              <div key={delay} style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#F97316",
                animation: "bounce 1s infinite",
                animationDelay: `${delay}ms`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const hiddenPrefixes = ["/onboarding"];
  const shouldShowNav = !hideNav && !hiddenPrefixes.some((p) => location.startsWith(p));

  return (
    <div style={{
      maxWidth: "480px",
      margin: "0 auto",
      minHeight: "100dvh",
      background: "oklch(0.985 0.012 65)",
      position: "relative",
    }}>
      {/* Optional sticky header */}
      {(title || showBack || headerRight) && (
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,248,240,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          {showBack && (
            <button
              onClick={onBack || (() => window.history.back())}
              style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "white", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)", flexShrink: 0,
                transition: "transform 0.2s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          {title && (
            <h1 style={{
              flex: 1, fontSize: "18px", fontWeight: 800,
              color: "oklch(0.13 0.01 30)", letterSpacing: "-0.03em", margin: 0,
            }}>
              {title}
            </h1>
          )}
          {headerRight && <div style={{ marginLeft: "auto" }}>{headerRight}</div>}
        </div>
      )}

      {/* Content */}
      <div style={{ paddingBottom: shouldShowNav ? "100px" : "0" }}>
        {children}
      </div>

      {/* Bottom Navigation */}
      {shouldShowNav && (
        <div className="bottom-nav-container">
          <div className="bottom-nav-inner">
            <nav className="bottom-nav-bar" style={{ justifyContent: "space-around" }}>
              {NAV_ITEMS.map((item) => {
                const active = matchesPath(location, item.matches);
                return (
                  <Link key={item.key} href={item.to}>
                    <button style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
                      padding: "6px 10px", borderRadius: "14px", border: "none",
                      background: "transparent", cursor: "pointer", transition: "all 0.2s",
                      minWidth: "52px",
                    }}>
                      <span style={{ fontSize: "20px", lineHeight: 1 }}>{item.emoji}</span>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: active ? 800 : 600,
                        color: active ? "#F97316" : "oklch(0.55 0 0)",
                        transition: "color 0.2s",
                      }}>
                        {item.label}
                      </span>
                      {active && (
                        <div style={{
                          width: "4px", height: "4px", borderRadius: "50%",
                          background: "#F97316",
                        }} />
                      )}
                    </button>
                  </Link>
                );
              })}
            </nav>
            {/* AI / Menus button */}
            <Link href="/menus">
              <button className="bottom-nav-ai-btn" title="Menús con IA">
                <span style={{ fontSize: "28px" }}>🤖</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
