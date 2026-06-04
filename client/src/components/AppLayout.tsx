// ─── React ───────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from "react";

// ─── Routing ─────────────────────────────────────────────────────────────────
import { Link, useLocation } from "wouter";

// ─── Data / API ───────────────────────────────────────────────────────────────
import { trpc } from "@/lib/trpc";

// ─── Auth & permissions ───────────────────────────────────────────────────────
import { useAuth } from "@/_core/hooks/useAuth";
import { hasRole } from "@/lib/utils";

// ─── Contexts ────────────────────────────────────────────────────────────────
import { ExpertModeContext } from "../contexts/ExpertModeContext";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Hooks ───────────────────────────────────────────────────────────────────
import { usePlan } from "@/hooks/usePlan";

// ─── i18n ────────────────────────────────────────────────────────────────────
import { useTranslation } from "react-i18next";

// ─── Components ──────────────────────────────────────────────────────────────
import LanguageSelector from "@/components/LanguageSelector";
import LogoutConfirmDialog from "@/components/LogoutConfirmDialog";
import { OnboardingModal } from "@/components/OnboardingModal";
import OfflineIndicator from "@/components/OfflineIndicator";
import FeedbackButton from "@/components/FeedbackButton";

// ─── Hook: detecta si estamos en desktop (≥1024px) ───────────────────────────
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 1024 : false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    setIsDesktop(mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

// ─── Hook: detecta si es dispositivo táctil/móvil ────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
  });
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(!e.matches);
    mq.addEventListener("change", handler);
    setIsMobile(!mq.matches);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function NotificationBell() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();
  const { data: unreadCount = 0 } = trpc.notifications.inApp.unreadCount.useQuery(undefined, {
    refetchInterval: isAuthenticated ? 60000 : false,
    staleTime: 30000,
    enabled: isAuthenticated,
    retry: false,
  });
  const count = typeof unreadCount === "number" ? unreadCount : 0;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "40px", height: "40px", borderRadius: "12px", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", position: "relative" }}
        aria-label="Notificaciones"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <div style={{ position: "absolute", top: "6px", right: "6px", minWidth: "16px", height: "16px", borderRadius: "8px", background: "#F97316", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "white", lineHeight: 1 }}>{count > 99 ? "99+" : count}</span>
          </div>
        )}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "48px", right: 0, background: "white", borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid #f3f4f6", minWidth: "200px", zIndex: 9999, overflow: "hidden" }}>
          <button onClick={() => { setOpen(false); navigate("/app/notifications"); }}
            style={{ width: "100%", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#111827", fontWeight: 600, textAlign: "left" }}
          >
            <span style={{ fontSize: "18px" }}>🔔</span>
            <span>Notificaciones{count > 0 ? ` (${count})` : ""}</span>
          </button>
          <div style={{ height: "1px", background: "#f3f4f6", margin: "0 12px" }} />
          <button onClick={() => { setOpen(false); navigate("/app/meal-notifications"); }}
            style={{ width: "100%", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#111827", fontWeight: 600, textAlign: "left" }}
          >
            <span style={{ fontSize: "18px" }}>⏰</span>
            <span>Configurar recordatorios</span>
          </button>
        </div>
      )}
    </div>
  );
}

function DarkModeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{ width: "36px", height: "36px", borderRadius: "10px", background: isDark ? "rgba(249,115,22,0.15)" : "rgba(0,0,0,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 }}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
  hideNav?: boolean;
}

function matchesPath(location: string, paths: string[]) {
  return paths.some((p) => location === p || location.startsWith(p + "/"));
}

// ─── Collapsible sidebar group ────────────────────────────────────────────────
function CollapsibleGroup({ label, icon, items, location, onClose, isApprovedExpert, isApprovedMaker, hasPendingApplication, t, defaultOpen = true }: any) {
  const hasActive = items.some((item: any) => location === item.to || location.startsWith(item.to + "/"));
  const [open, setOpen] = React.useState(defaultOpen || hasActive);
  const filteredItems = items.filter((item: any) => {
    if (item.key === "/app/expert/dashboard" && !isApprovedExpert) return false;
    if (item.key === "/app/buddy-expert-dashboard" && !isApprovedExpert) return false;
    if (item.key === "/app/expert/patients" && !isApprovedExpert) return false;
    if (item.key === "/app/expert/chat" && !isApprovedExpert) return false;
    if (item.key === "/app/buddy-maker-dashboard" && !isApprovedMaker) return false;
    if (item.key === "/app/maker-analytics" && !isApprovedMaker) return false;
    if (item.key === "/app/buddy-application" && (isApprovedExpert || isApprovedMaker || hasPendingApplication)) return false;
    return true;
  });
  if (filteredItems.length === 0) return null;
  return (
    <div style={{ marginBottom: "2px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px 5px 14px", background: "none", border: "none", cursor: "pointer", borderRadius: "8px", transition: "background 0.15s" }}
      >
        {icon && <span style={{ fontSize: "12px", opacity: 0.8 }}>{icon}</span>}
        <span style={{ fontSize: "10.5px", fontWeight: 800, color: hasActive ? "#F97316" : "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase", flex: 1, textAlign: "left" }}>{label}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={hasActive ? "#F97316" : "#9ca3af"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ paddingLeft: "2px", paddingBottom: "4px" }}>
          {filteredItems.map((item: any) => {
            const isPendingItem = item.key === "register" && hasPendingApplication;
            if (item.to.startsWith("http")) {
              return (
                <a key={item.key} href={item.to} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "9px", background: "linear-gradient(135deg, rgba(249,115,22,0.08), rgba(251,146,60,0.06))", cursor: "pointer", marginBottom: "1px", border: "1px solid rgba(249,115,22,0.15)" }}>
                    <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>{item.emoji}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#F97316" }}>{item.label}</span>
                    <svg style={{ marginLeft: "auto" }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </div>
                </a>
              );
            }
            const active = location === item.to || location.startsWith(item.to + "/");
            return (
              <Link key={item.key} href={item.to} onClick={onClose}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "9px", background: active ? "rgba(249,115,22,0.10)" : isPendingItem ? "rgba(234,179,8,0.08)" : "transparent", cursor: "pointer", marginBottom: "1px", transition: "background 0.15s" }}>
                  <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>{item.emoji}</span>
                  <span style={{ fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? "#F97316" : isPendingItem ? "#B45309" : "var(--sidebar-text, #374151)" }}>{item.label}</span>
                  {isPendingItem && <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 700, background: "#FEF3C7", color: "#D97706", borderRadius: "6px", padding: "2px 6px" }}>{t("common.pending", "En revisi\u00f3n")}</span>}
                  {(item as any).badge && !isPendingItem && <span style={{ marginLeft: "auto", fontSize: "9px", fontWeight: 800, background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white", borderRadius: "6px", padding: "2px 6px", letterSpacing: "0.03em" }}>{(item as any).badge}</span>}
                  {active && !isPendingItem && !(item as any).badge && <div style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: "#F97316" }} />}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar Nav with visual hierarchy ────────────────────────────────────────
function SidebarNav({ activeGroups, location, onClose, isApprovedExpert, isApprovedMaker, hasPendingApplication, t, pendingFeedbackCount }: any) {
  const collapsedByDefault = new Set(["BuddyPet", "BuddyKids", "Familia", "Comunidad", "Tienda & Bienestar", "Mi Cuenta"]);
  const groupIcons: Record<string, string> = {
    "Nutrición": "🥗",
    "Menús": "📅",
    "Compra": "🛒",
    "BuddyPet": "🐾",
    "BuddyKids": "👶",
    "Familia": "🏡",
    "Comunidad": "🤝",
    "Tienda & Bienestar": "🛍️",
    "Mi Cuenta": "👤",
    "Mi Panel": "📊",
    "Mis Pacientes": "🧑‍⚕️",
    "Mis Creaciones": "👨‍🍳",
  };
  return (
    <nav style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
      {activeGroups.map((group: any) => {
        const isAlwaysOpen = !collapsedByDefault.has(group.label);
        if (group.label === "Inicio") {
          const filteredItems = group.items.filter((item: any) => {
            if (item.key === "/app/buddy-application" && (isApprovedExpert || isApprovedMaker || hasPendingApplication)) return false;
            return true;
          });
          return (
            <div key={group.label} style={{ marginBottom: "6px" }}>
              {filteredItems.map((item: any) => {
                const active = location === item.to || location.startsWith(item.to + "/");
                return (
                  <Link key={item.key} href={item.to} onClick={onClose}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 13px", borderRadius: "10px", background: active ? "rgba(249,115,22,0.12)" : "transparent", cursor: "pointer", marginBottom: "2px", transition: "background 0.15s" }}>
                      <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{item.emoji}</span>
                      <span style={{ fontSize: "14px", fontWeight: active ? 700 : 600, color: active ? "#F97316" : "var(--sidebar-text, #374151)" }}>{item.label}</span>
                      {active && <div style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: "#F97316" }} />}
                    </div>
                  </Link>
                );
              })}
              <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "6px 4px 4px" }} />
            </div>
          );
        }
        return (
          <CollapsibleGroup
            key={group.label}
            label={group.label}
            icon={groupIcons[group.label]}
            items={group.items}
            location={location}
            onClose={onClose}
            isApprovedExpert={isApprovedExpert}
            isApprovedMaker={isApprovedMaker}
            hasPendingApplication={hasPendingApplication}
            t={t}
            defaultOpen={isAlwaysOpen}
          />
        );
      })}
      <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "8px 4px" }} />
      <Link href="/app/admin" onClick={onClose}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", borderRadius: "9px", background: location === "/app/admin" ? "rgba(249,115,22,0.10)" : "transparent", cursor: "pointer", marginBottom: "1px" }}>
          <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>🛡️</span>
          <span style={{ fontSize: "13px", fontWeight: location === "/app/admin" ? 700 : 500, color: location === "/app/admin" ? "#F97316" : "var(--sidebar-text, #374151)" }}>{t("sidebar.administration")}</span>
        </div>
      </Link>
      <FeedbackButton asSidebarItem onClose={onClose} pendingCount={pendingFeedbackCount ?? 0} />
    </nav>
  );
}

// ─── Sidebar content (shared between mobile drawer and desktop fixed) ─────────
function SidebarContent({
  location,
  user,
  userAvatarUrl,
  userName,
  userEmail,
  planDisplay,
  isApprovedExpert,
  isApprovedMaker,
  hasPendingApplication,
  onClose,
  logout,
  SIDEBAR_GROUPS,
  EXPERT_SIDEBAR_GROUPS,
  t,
  expertMode,
  toggleExpertMode,
  pendingFeedbackCount,
}: any) {
  const activeGroups = (isApprovedExpert && expertMode) ? EXPERT_SIDEBAR_GROUPS : SIDEBAR_GROUPS;
  return (
    <>
      {/* Sidebar Header */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "14px", overflow: "hidden", boxShadow: "0 4px 12px rgba(249,115,22,0.35)", flexShrink: 0 }}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png" alt="Buddy One" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "var(--sidebar-text, #1a1a1a)", letterSpacing: "-0.03em" }}>Buddy One</p>
          <p style={{ margin: 0, fontSize: "12px", color: "#F97316", fontWeight: 600 }}>Tu ecosistema de bienestar</p>
        </div>
        <LanguageSelector variant="icon" />
      </div>

      {/* Expert Mode Toggle — solo visible para expertos aprobados */}
      {isApprovedExpert && toggleExpertMode && (
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "10px", padding: "3px", gap: "2px" }}>
            <button
              onClick={() => toggleExpertMode(false)}
              style={{ flex: 1, padding: "7px 8px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, transition: "all 0.2s", background: !expertMode ? "white" : "transparent", color: !expertMode ? "#F97316" : "#6b7280", boxShadow: !expertMode ? "0 1px 4px rgba(0,0,0,0.12)" : "none" }}
            >👤 Usuario</button>
            <button
              onClick={() => toggleExpertMode(true)}
              style={{ flex: 1, padding: "7px 8px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 700, transition: "all 0.2s", background: expertMode ? "linear-gradient(135deg, #F97316, #FB923C)" : "transparent", color: expertMode ? "white" : "#6b7280", boxShadow: expertMode ? "0 2px 8px rgba(249,115,22,0.35)" : "none" }}
            >🎓 Profesional</button>
          </div>
        </div>
      )}

      {/* Sidebar Nav — hierarchical with collapsible groups */}
      <SidebarNav
        activeGroups={activeGroups}
        location={location}
        onClose={onClose}
        isApprovedExpert={isApprovedExpert}
        isApprovedMaker={isApprovedMaker}
        hasPendingApplication={hasPendingApplication}
        t={t}
        pendingFeedbackCount={pendingFeedbackCount}
      />

      {/* Sidebar Footer */}
      <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "10px" }}>
        {userAvatarUrl ? (
          <img src={userAvatarUrl} alt={userName} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #F97316" }} />
        ) : (
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>{userName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--sidebar-text, #1a1a1a)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</p>
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userEmail}</p>
        </div>
        <Link href="/app/subscription">
          <div style={{ background: planDisplay?.color || "#6B7280", borderRadius: "8px", padding: "3px 8px", fontSize: "12px", fontWeight: 800, color: "white", letterSpacing: "0.05em", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
            {planDisplay?.badge || "Free"}
          </div>
        </Link>
      </div>
      <div style={{ padding: "0 18px 6px", display: "flex", gap: "12px", justifyContent: "center" }}>
        <Link href="/terms"><span style={{ fontSize: "11px", color: "#9ca3af", textDecoration: "underline", cursor: "pointer" }}>{t("sidebar.terms")}</span></Link>
        <span style={{ fontSize: "11px", color: "#d1d5db" }}>·</span>
        <Link href="/privacy"><span style={{ fontSize: "11px", color: "#9ca3af", textDecoration: "underline", cursor: "pointer" }}>{t("sidebar.privacy")}</span></Link>
      </div>
      <div style={{ padding: "0 18px 18px" }}>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "12px", border: "1.5px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)", cursor: logout.isPending ? "not-allowed" : "pointer", transition: "all 0.2s", opacity: logout.isPending ? 0.7 : 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#EF4444" }}>{logout.isPending ? t("sidebar.loggingOut") : t("sidebar.logout")}</span>
        </button>
      </div>
    </>
  );
}

export default function AppLayout({ children, title, showBack = false, onBack, headerRight, hideNav = false }: AppLayoutProps) {
  const { loading, isAuthenticated, user, logout: logoutFn } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  // Logout with confirmation dialog
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const handleLogoutConfirmed = async () => {
    setLogoutPending(true);
    await logoutFn();
  };
  const logout = { mutate: () => setShowLogoutConfirm(true), isPending: logoutPending };

  const expertApplicationQuery = trpc.buddyApplications.getMyApplication.useQuery({ type: "expert" }, { enabled: !!user, staleTime: 5 * 60 * 1000 });
  const makerApplicationQuery = trpc.buddyApplications.getMyApplication.useQuery({ type: "maker" }, { enabled: !!user, staleTime: 5 * 60 * 1000 });
  // El toggle Usuario/Profesional solo aparece si el usuario tiene ROL buddyexpert o buddymaker
  // (no basta con tener una aplicación aprobada — el admin debe haberle asignado el rol)
  const isApprovedExpert = !!(user && (hasRole(user, "buddyexpert") || (user as any)?.accountType === "buddyexpert"));
  const isApprovedMaker = !!(user && (user.role === "buddymaker" || (user as any).accountType === "buddymaker"));
  const hasPendingApplication = expertApplicationQuery.data?.status === "pending" || makerApplicationQuery.data?.status === "pending";
  // Pending feedback badge — only fetched for admins, refreshed every 2 minutes
  const isAdmin = user?.role === "admin";
  const pendingFeedbackQuery = trpc.feedback.pendingCount.useQuery(undefined, {
    enabled: isAdmin,
    staleTime: 2 * 60 * 1000,
    refetchInterval: isAdmin ? 2 * 60 * 1000 : false,
  });
  const pendingFeedbackCount = pendingFeedbackQuery.data?.count ?? 0;
  // ─── Expert mode toggle ──────────────────────────────────────────────────
  const isExpertRoute = location.startsWith("/app/expert") || location.startsWith("/app/buddy-expert");
  // Si el usuario tiene rol buddyexpert, el modo experto está SIEMPRE activo por defecto
  const isExpertByRole = !!(user && (hasRole(user, "buddyexpert") || (user as any)?.accountType === "buddyexpert"));
  const [expertModeOverride, setExpertModeOverride] = useState<boolean | null>(null);
  // expertMode: true si es experto por rol, o si está en ruta de experto, o si el usuario lo activó manualmente
  const expertMode = expertModeOverride !== null
    ? expertModeOverride
    : (isExpertByRole || isExpertRoute || localStorage.getItem("bm_expert_mode") === "1");
  // Auto-activar cuando navega a rutas de experto
  useEffect(() => {
    if (isExpertRoute && expertModeOverride === false) {
      setExpertModeOverride(null); // reset override, deja que isExpertRoute lo active
    }
  }, [isExpertRoute]);
  const toggleExpertMode = useCallback((val: boolean) => {
    if (isExpertByRole && !val) {
      // Los expertos por rol pueden cambiar a modo usuario temporalmente
      setExpertModeOverride(false);
      localStorage.setItem("bm_expert_mode", "0");
    } else {
      setExpertModeOverride(val ? null : false);
      localStorage.setItem("bm_expert_mode", val ? "1" : "0");
    }
  }, [isExpertByRole]);

  // ⚠️ These hooks MUST be here (before any conditional return) to avoid React error #300
  const { planDisplay, isFree } = usePlan();
  const profileData = trpc.profile.get.useQuery(undefined, { enabled: !!user, staleTime: 5 * 60 * 1000 });

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => { setSidebarOpen(false); }, [location]);
  useEffect(() => {
    if (!isDesktop) {
      document.body.style.overflow = sidebarOpen ? "hidden" : "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen, isDesktop]);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); if (!localStorage.getItem('pwa-install-dismissed')) setShowInstallBanner(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Swipe gesture (solo móvil)
  useEffect(() => {
    if (isDesktop) return;
    const onTouchStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (dy > 60) return;
      if (!sidebarOpen && dx > 60 && touchStartX.current < 30) setSidebarOpen(true);
      if (sidebarOpen && dx < -60) setSidebarOpen(false);
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { document.removeEventListener('touchstart', onTouchStart); document.removeEventListener('touchend', onTouchEnd); };
  }, [sidebarOpen, isDesktop]);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const NAV_ITEMS = [
    { key: "inicio", label: t("nav.home"), to: "/app/dashboard", matches: ["/app/dashboard"], icon: (active: boolean) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#F97316" : "none"} stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>) },
    { key: "recetas", label: t("nav.recipes"), to: "/app/recipes", matches: ["/app/recipes"], icon: (active: boolean) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>) },
    { key: "diario", label: t("nav.diary"), to: "/app/meal-log", matches: ["/app/meal-log"], icon: (active: boolean) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>) },
    { key: "/app/menus", label: t("nav.menus"), to: "/app/menus", matches: ["/app/menus"], icon: (active: boolean) => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>) },
    { key: "health-hub", label: "Health Hub", to: "/app/health-hub", matches: ["/app/health-hub"], icon: (active: boolean) => (<svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#F97316" : "none"} stroke={active ? "#F97316" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>) },
  ];
  // ─── SIDEBAR PROFESIONAL (solo para BuddyExperts aprobados) ─────────────────────
  const EXPERT_SIDEBAR_GROUPS = [
    {
      label: "Mi Panel",
      items: [
        { key: "/app/expert/dashboard", label: "Dashboard Profesional", to: "/app/expert/dashboard", emoji: "🏠" },
        { key: "/app/buddy-expert-stats", label: "Estadísticas", to: "/app/buddy-expert-stats", emoji: "📊" },
        { key: "/app/expert-plans", label: "Mis Planes", to: "/app/expert-plans", emoji: "📋" },
      ],
    },
    {
      label: "Pacientes",
      items: [
        { key: "/app/expert/patients", label: "Mis Pacientes", to: "/app/expert/patients", emoji: "👥" },
        { key: "/app/expert/hire-requests", label: "Solicitudes", to: "/app/expert/hire-requests", emoji: "📩" },
        { key: "/app/expert/chat", label: "Chat con Pacientes", to: "/app/expert/chat", emoji: "💬" },
        { key: "/app/expert/alerts", label: "Alertas Pacientes", to: "/app/expert/alerts", emoji: "🔔" },
        { key: "/app/expert/trends", label: "Análisis Tendencias", to: "/app/expert/trends", emoji: "📊" },
        { key: "/app/buddy-ia", label: "BuddyIA Profesional", to: "/app/buddy-ia", emoji: "🤖" },
      ],
    },
    {
      label: "Herramientas Pro",
      items: [
        { key: "/app/expert/ai-plan", label: "Plan con IA", to: "/app/expert/ai-plan", emoji: "🤖" },
        { key: "/app/expert/video", label: "Videoconsultas", to: "/app/expert/video", emoji: "📹" },
        { key: "/app/expert/availability", label: "Disponibilidad", to: "/app/expert/availability", emoji: "📅" },
        { key: "/app/expert/reviews", label: "Reseñas", to: "/app/expert/reviews", emoji: "⭐" },
        { key: "/app/expert/referrals", label: "Referidos", to: "/app/expert/referrals", emoji: "🎁" },
        { key: "/app/expert/b2b", label: "Plan B2B Empresas", to: "/app/expert/b2b", emoji: "🏢" },
      ],
    },
    {
      label: "Mi Cuenta",
      items: [
        { key: "/app/profile", label: t("sidebar.myProfile"), to: "/app/profile", emoji: "👤" },

        { key: "/app/metrics", label: t("nav.metrics"), to: "/app/metrics", emoji: "📏" },
        { key: "/app/health-hub", label: "Health Hub", to: "/app/health-hub", emoji: "💓" },
        { key: "/app/referrals", label: "Invita amigos 🎁", to: "/app/referrals", emoji: "👥" },
        ...(isApprovedMaker ? [{ key: "/app/buddy-maker-dashboard", label: "Panel BuddyMaker", to: "/app/buddy-maker-dashboard", emoji: "🍳" }] : []),
        { key: "/app/soporte", label: "Soporte", to: "/app/soporte", emoji: "🎫" },
      ],
    },
  ];
  const SIDEBAR_GROUPS = [
    {
      label: "Inicio",
      items: [
        { key: "/app/dashboard", label: t("nav.dashboard"), to: "/app/dashboard", emoji: "🏠" },
        { key: "/app/buddy-ia", label: t("nav.buddyIA"), to: "/app/buddy-ia", emoji: "🤖" },
      ],
    },
    {
      label: "Nutrición",
      items: [
        { key: "/app/meal-log", label: t("sidebar.nutritionalDiary"), to: "/app/meal-log", emoji: "📊" },
        { key: "/app/meal-notifications", label: t("sidebar.reminders"), to: "/app/meal-notifications", emoji: "🔔" },
        { key: "/app/recipes", label: t("nav.recipes"), to: "/app/recipes", emoji: "📖" },
        { key: "/app/favorites", label: t("sidebar.myFavorites"), to: "/app/favorites", emoji: "❤️" },
        { key: "/app/inventory", label: t("nav.inventory"), to: "/app/inventory", emoji: "📦" },
      ],
    },
    {
      label: "Menús",
      items: [
        { key: "/app/my-menus", label: "Mis Menús", to: "/app/my-menus", emoji: "📅", matches: ["/app/my-menus", "/app/menus", "/app/menu-library", "/app/active-menu"] },
        { key: "/app/specialized-menus", label: "Menús Especiales", to: "/app/specialized-menus", emoji: "🎉", matches: ["/app/specialized-menus"] },
        { key: "/app/event-menu", label: "Menú para Eventos", to: "/app/event-menu", emoji: "🥂", matches: ["/app/event-menu", "/app/saved-events"] },
      ],
    },
    {
      label: "Compra",
      items: [
        { key: "shopping", label: t("sidebar.shoppingList"), to: "/app/shopping-lists", emoji: "🛒" },
        { key: "/app/supermercados", label: t("sidebar.supermarkets"), to: "/app/supermercados", emoji: "🏪" },
      ],
    },
    {
      label: "BuddyPet",
      items: [
        { key: "/app/buddy-pet", label: "Mis Mascotas", to: isFree ? "/app/buddy-pet-preview" : "/app/buddy-pet", emoji: "🐾", badge: isFree ? "Pro Max" : undefined },
        { key: "/app/vet-clinic", label: "Clínica Veterinaria", to: "/app/vet-clinic", emoji: "🏥" },
        { key: "/app/pet-menus", label: "Mis Menús para Mascotas", to: "/app/pet-menus", emoji: "🍖" },
      ],
    },
    {
      label: "BuddyKids",
      items: [
        { key: "/app/buddy-kids", label: "Nutrición Infantil", to: "/app/buddy-kids", emoji: "👶" },
        { key: "/app/kids-menus", label: "Mis Menús para Niños", to: "/app/kids-menus", emoji: "🍽️" },
      ],
    },

    {
      label: "Familia",
      items: [
        { key: "/familia", label: "Mi Hogar", to: "/familia", emoji: "🏡" },
        { key: "/familia/calendario", label: "Calendario Familiar", to: "/familia/calendario", emoji: "📅" },
        { key: "/familia/mis-recetas", label: "Mis Recetas Asignadas", to: "/familia/mis-recetas", emoji: "🍽️" },
      ],
    },
    {
      label: "Comunidad",
      items: [
        { key: "/app/buddy-experts", label: t("nav.buddyExperts"), to: "/app/buddy-experts", emoji: "🧑‍⚕️" },
        { key: "/app/buddy-makers", label: t("nav.buddyMakers"), to: "/app/buddy-makers", emoji: "👨‍🍳" },
        { key: "/app/my-expert", label: "Mi nutricionista", to: "/app/my-expert", emoji: "👩‍⚕️" },
      ],
    },
    {
      label: "Tienda & Bienestar",
      items: [
        { key: "/app/buddy-shop", label: "BuddyShop", to: "/app/buddy-shop", emoji: "🛍️" },
        { key: "/app/buddy-care", label: "BuddyCare", to: "/app/buddy-care", emoji: "💚" },
      ],
    },
    {
      label: "Mi Cuenta",
      items: [
        { key: "/app/profile", label: t("sidebar.myProfile"), to: "/app/profile", emoji: "👤" },

        { key: "/app/metrics", label: t("nav.metrics"), to: "/app/metrics", emoji: "📏" },
        { key: "/app/health-hub", label: "Health Hub", to: "/app/health-hub", emoji: "💓" },
        { key: "/app/referrals", label: "Invita amigos 🎁", to: "/app/referrals", emoji: "👥" },
        { key: "/app/soporte", label: "Soporte", to: "/app/soporte", emoji: "🎫" },
      ],
    },
  ];

  const SIDEBAR_ITEMS = SIDEBAR_GROUPS.flatMap(g => g.items);
  const ALL_NAV_ITEMS = [...SIDEBAR_ITEMS, ...EXPERT_SIDEBAR_GROUPS.flatMap((g: any) => g.items)];
  const currentNavItem = NAV_ITEMS.find((item) => matchesPath(location, item.matches));
  const currentSidebarItem = ALL_NAV_ITEMS.find((item: any) => location === item.to || location.startsWith(item.to + "/"));

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF8F0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "22px", overflow: "hidden", boxShadow: "0 8px 28px rgba(249,115,22,0.40)" }}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png" alt="Buddy One" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <p style={{ fontSize: "20px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em", margin: 0 }}>Buddy One</p>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 150, 300].map((delay) => (<div key={delay} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F97316", animation: "bounce 1s infinite", animationDelay: `${delay}ms` }} />))}
          </div>
        </div>
      </div>
    );
  }

  // Only redirect to /login if we are definitively NOT authenticated.
  // Do NOT redirect while loading — this would kick users out during a
  // transient server cold-start or network blip.
  // Also check localStorage as a second layer: if the user was previously
  // authenticated (persisted across reloads), don't redirect immediately.
  const wasAuthenticated = (() => { try { return localStorage.getItem("bm_auth_state") === "authenticated"; } catch { return false; } })();
  if (!loading && !isAuthenticated && !wasAuthenticated) { window.location.href = "/login"; return null; }

  const shouldShowNav = !hideNav;
  const pageTitle = title || currentNavItem?.label || currentSidebarItem?.label || "Buddy One";
  const userName = user?.name || "Usuario";
  const userEmail = user?.email || "";
  const userAvatarUrl = profileData.data?.user?.imageUrl || (user as any)?.imageUrl || null;

  const sidebarProps = {
    location, user, userAvatarUrl, userName, userEmail, planDisplay,
    isApprovedExpert, isApprovedMaker, hasPendingApplication,
    onClose: () => setSidebarOpen(false),
    logout, SIDEBAR_GROUPS, EXPERT_SIDEBAR_GROUPS, t,
    expertMode: isApprovedExpert ? expertMode : false,
    toggleExpertMode: isApprovedExpert ? toggleExpertMode : undefined,
    pendingFeedbackCount,
  };

  const expertModeValue = {
    expertMode: isApprovedExpert ? expertMode : false,
    toggleExpertMode: isApprovedExpert ? toggleExpertMode : () => {},
  };

  // ─── DESKTOP LAYOUT ──────────────────────────────────────────────────────────
  if (isDesktop) {
    const DESKTOP_SIDEBAR_WIDTH = 260;
    return (
      <ExpertModeContext.Provider value={expertModeValue}>
      <div className="app-layout-root" style={{ display: "flex", minHeight: "100dvh" }}>
        {/* Onboarding modal — self-contained, decides internally whether to show */}
        {user && <OnboardingModal />}
        {/* Skip to main */}
        <a href="#main-content" style={{ position: "absolute", top: "-100px", left: "16px", zIndex: 9999, padding: "8px 16px", background: "#F97316", color: "white", borderRadius: "8px", fontWeight: 700, fontSize: "14px", textDecoration: "none" }}
          onFocus={(e) => { e.currentTarget.style.top = "16px"; }}
          onBlur={(e) => { e.currentTarget.style.top = "-100px"; }}
        >Saltar al contenido principal</a>

        {/* Desktop Sidebar — fijo a la izquierda */}
        <aside
          id="app-sidebar"
          aria-label="Menú de navegación"
          className="app-sidebar-desktop"
          style={{
            width: `${DESKTOP_SIDEBAR_WIDTH}px`,
            minWidth: `${DESKTOP_SIDEBAR_WIDTH}px`,
            height: "100dvh",
            position: "fixed",
            top: 0,
            left: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "2px 0 16px rgba(0,0,0,0.05)",
            zIndex: 200,
            overflowY: "auto",
          }}
        >
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Main area */}
        <div style={{ flex: 1, marginLeft: `${DESKTOP_SIDEBAR_WIDTH}px`, display: "flex", flexDirection: "column", minHeight: "100dvh", width: `calc(100vw - ${DESKTOP_SIDEBAR_WIDTH}px)`, overflowX: "hidden", minWidth: 0 }}>

          {/* Desktop Header */}
          <header className="app-header-desktop" style={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            padding: "0 32px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}>
            {showBack && (
              <button onClick={onBack || (() => window.history.back())} aria-label="Volver atrás"
                style={{ width: "36px", height: "36px", borderRadius: "10px", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            )}

            {/* Indicador de entorno */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(249,115,22,0.08)", borderRadius: "8px", padding: "4px 10px", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#F97316", letterSpacing: "0.04em" }}>ESCRITORIO</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="app-header__title-main" style={{ margin: 0, fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pageTitle}</h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <DarkModeToggle />
              {headerRight ? headerRight : <NotificationBell />}
              {/* Avatar */}
              {userAvatarUrl ? (
                <Link href="/app/profile">
                  <img src={userAvatarUrl} alt={userName} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid #F97316", cursor: "pointer" }} />
                </Link>
              ) : (
                <Link href="/app/profile">
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "white" }}>{userName.charAt(0).toUpperCase()}</span>
                  </div>
                </Link>
              )}
            </div>
          </header>

          {/* PWA Install Banner */}
          {showInstallBanner && (
            <div style={{ background: "linear-gradient(135deg, #F97316, #FB923C)", padding: "10px 32px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", overflow: "hidden", flexShrink: 0 }}>
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png" alt="Buddy One" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "white" }}>{t("sidebar.installApp")}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.85)" }}>{t("sidebar.installAppDesc")}</p>
              </div>
              <button onClick={handleInstall} style={{ background: "white", color: "#F97316", border: "none", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>{t("sidebar.install")}</button>
              <button onClick={() => { setShowInstallBanner(false); localStorage.setItem('pwa-install-dismissed', '1'); }} aria-label="Cerrar" style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "6px", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          )}

          {/* Content — sin padding-bottom para barra inferior */}
          <main id="main-content" style={{ flex: 1, padding: "0" }}>
            {children}
          </main>
        </div>
      </div>
      {/* Logout confirmation dialog — desktop */}
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setShowLogoutConfirm(false)}
        isPending={logoutPending}
      />
      </ExpertModeContext.Provider>
    );
  }

  // ─── MÓVIL LAYOUT (igual que antes) ──────────────────────────────────────────
  return (
    <ExpertModeContext.Provider value={expertModeValue}><div className="app-layout-root" style={{ width: "100%", maxWidth: "480px", margin: "0 auto", minHeight: "100dvh", position: "relative" }}>
      {/* Onboarding modal — self-contained, decides internally whether to show */}
      {user && <OnboardingModal />}
      <OfflineIndicator />
      <a href="#main-content" style={{ position: "fixed", top: "-200px", left: "16px", zIndex: 9999, padding: "8px 16px", background: "#F97316", color: "white", borderRadius: "8px", fontWeight: 700, fontSize: "14px", textDecoration: "none", clip: "rect(0,0,0,0)", overflow: "hidden" }}
        onFocus={(e) => { e.currentTarget.style.top = "16px"; e.currentTarget.style.clip = "auto"; e.currentTarget.style.overflow = "visible"; }}
        onBlur={(e) => { e.currentTarget.style.top = "-200px"; e.currentTarget.style.clip = "rect(0,0,0,0)"; e.currentTarget.style.overflow = "hidden"; }}
      >Saltar al contenido principal</a>

      {/* Sidebar Overlay */}
      {sidebarOpen && (<div onClick={() => setSidebarOpen(false)} aria-hidden="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, backdropFilter: "blur(2px)" }} />)}

      {/* Sidebar Panel (drawer) */}
      <div id="app-sidebar" role="dialog" aria-label="Menú de navegación" aria-modal={sidebarOpen} className="app-sidebar"
        style={{ position: "fixed", top: 0, left: sidebarOpen ? 0 : "-310px", width: "300px", height: "100dvh", paddingTop: "env(safe-area-inset-top)", zIndex: 300, transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)", display: "flex", flexDirection: "column", boxShadow: sidebarOpen ? "4px 0 40px rgba(0,0,0,0.15)" : "none", overflowY: "auto" }}
      >
        {/* Drag handle indicator — visible only on mobile when sidebar is open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "absolute", top: "50%", right: "-20px", transform: "translateY(-50%)", width: "20px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}
            aria-label="Cerrar menú deslizando"
          >
            <div style={{ width: "4px", height: "40px", borderRadius: "99px", background: "rgba(255,255,255,0.6)", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} />
          </div>
        )}
        <SidebarContent {...sidebarProps} />
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div style={{ background: "linear-gradient(135deg, #F97316, #FB923C)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", zIndex: 150 }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", overflow: "hidden", flexShrink: 0 }}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png" alt="Buddy One" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "white" }}>{t("sidebar.installApp")}</p>
            <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>{t("sidebar.installAppDesc")}</p>
          </div>
          <button onClick={handleInstall} style={{ background: "white", color: "#F97316", border: "none", borderRadius: "10px", padding: "7px 12px", fontSize: "14px", fontWeight: 800, cursor: "pointer", flexShrink: 0 }}>{t("sidebar.install")}</button>
          <button onClick={() => { setShowInstallBanner(false); localStorage.setItem('pwa-install-dismissed', '1'); }} aria-label="Cerrar banner de instalación" style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Fixed Header */}
      <header className="app-header" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", paddingTop: "calc(env(safe-area-inset-top) + 12px)", paddingBottom: "12px", paddingLeft: "max(16px, env(safe-area-inset-left))", paddingRight: "max(16px, env(safe-area-inset-right))", display: "flex", alignItems: "center", gap: "12px" }}>
        {showBack ? (
          <button onClick={onBack || (() => window.history.back())} aria-label="Volver atrás" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        ) : (
          <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menú de navegación" aria-expanded={sidebarOpen} aria-controls="app-sidebar" style={{ width: "40px", height: "40px", borderRadius: "12px", background: "white", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 8px rgba(249,115,22,0.30)", flexShrink: 0 }}>
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_2cf889cb.png" alt="Buddy One" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p className="app-header__title-sub" style={{ margin: 0, fontSize: "14px", fontWeight: 600, letterSpacing: "0.02em" }}>Buddy One</p>
            <p className="app-header__title-main" style={{ margin: 0, fontSize: "17px", fontWeight: 800, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pageTitle}</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <DarkModeToggle />
          {headerRight ? headerRight : <NotificationBell />}
        </div>
      </header>

      {/* Content */}
      <main id="main-content" style={{ paddingTop: "calc(env(safe-area-inset-top) + 64px)", paddingBottom: shouldShowNav ? "calc(64px + env(safe-area-inset-bottom))" : "0" }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {shouldShowNav && (
        <nav aria-label="Navegación principal" className="app-nav-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "6px 0" }}>
            {NAV_ITEMS.map((item) => {
              const active = matchesPath(location, item.matches);
              return (
                <Link key={item.key} href={item.to} aria-current={active ? "page" : undefined}>
                  <button
                    aria-label={item.label}
                    aria-pressed={active}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "8px 16px", border: "none", background: active ? "rgba(249,115,22,0.08)" : "transparent", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s", minWidth: "56px", minHeight: "44px", justifyContent: "center" }}
                  >
                    {item.icon(active)}
                    <span aria-hidden="true" style={{ fontSize: "11px", fontWeight: active ? 700 : 500, color: active ? "#F97316" : "#9ca3af", transition: "color 0.2s" }}>{item.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Logout confirmation dialog */}
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={handleLogoutConfirmed}
        onCancel={() => setShowLogoutConfirm(false)}
        isPending={logoutPending}
      />
    </div></ExpertModeContext.Provider>
  );
}
