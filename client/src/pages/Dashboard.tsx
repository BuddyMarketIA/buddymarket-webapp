import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { OnboardingTourGuide } from "@/components/OnboardingTourGuide";

// ─── Widget Config ───────────────────────────────────────────────────────────
const ALL_WIDGETS = [
  { id: "calorie",      label: "Calorías del día",       emoji: "🔥",  required: true,  desc: "Anillo de calorías con macros del día",          col: "left" },
  { id: "hydration",   label: "Hidratación",             emoji: "💧",  required: false, desc: "Seguimiento de vasos de agua diarios",           col: "right" },
  { id: "onboarding",  label: "Primeros pasos",          emoji: "🚀",  required: false, desc: "Completa tu perfil para mejores resultados",     col: "left" },
  { id: "menu",        label: "Menú activo",             emoji: "📅",  required: false, desc: "Tu menú semanal en curso",                       col: "left" },
  { id: "coach",       label: "Buddy Coach",             emoji: "🤖",  required: false, desc: "Acceso rápido a tu asesor de bienestar",         col: "left" },
  { id: "recs",        label: "Recomendaciones del día", emoji: "💡",  required: false, desc: "Consejos personalizados según tu progreso",      col: "left" },
  { id: "macros",      label: "Resumen de macros",       emoji: "📊",  required: false, desc: "Barras de progreso de proteínas, carbos y grasas",col: "right" },
  { id: "recipes",     label: "Recetas para ti",         emoji: "✨",  required: false, desc: "Recetas recomendadas según tu perfil",           col: "left" },
  { id: "quickaccess", label: "Accesos rápidos",         emoji: "⚡",  required: false, desc: "Atajos a las secciones más usadas",              col: "right" },
  { id: "streak",      label: "Mi progreso",             emoji: "🏆",  required: false, desc: "Racha de días y nivel de gamificación",          col: "right" },
  { id: "recipeday",   label: "Receta del día",          emoji: "🍽️", required: false, desc: "Una receta especial seleccionada para ti",       col: "right" },
  { id: "community",   label: "Comunidad & Tienda",      emoji: "🤝",  required: false, desc: "Accesos a nutricionistas, BuddyShop y más",      col: "right" },
  { id: "goals",       label: "Objetivos semanales",     emoji: "🎯",  required: false, desc: "Seguimiento de tus metas de la semana",          col: "right" },
];

const DEFAULT_ACTIVE = ["calorie", "onboarding", "menu", "coach", "recs", "recipes", "quickaccess", "streak", "recipeday", "community"];

function useWidgetConfig() {
  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("bm_dashboard_widgets");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVE;
  });

  const toggle = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const next = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id];
      localStorage.setItem("bm_dashboard_widgets", JSON.stringify(next));
      return next;
    });
  }, []);

  const moveUp = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      localStorage.setItem("bm_dashboard_widgets", JSON.stringify(next));
      return next;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setActiveWidgets(prev => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      localStorage.setItem("bm_dashboard_widgets", JSON.stringify(next));
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    localStorage.setItem("bm_dashboard_widgets", JSON.stringify(DEFAULT_ACTIVE));
    setActiveWidgets(DEFAULT_ACTIVE);
  }, []);

  return { activeWidgets, toggle, moveUp, moveDown, reset };
}

// ─── Widget Config Panel ──────────────────────────────────────────────────────
function WidgetConfigPanel({ onClose, activeWidgets, toggle, moveUp, moveDown, reset }: {
  onClose: () => void;
  activeWidgets: string[];
  toggle: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  reset: () => void;
}) {
  const [tab, setTab] = useState<"gallery"|"order">("gallery");
  const activeList = ALL_WIDGETS.filter(w => activeWidgets.includes(w.id) && !w.required);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "relative", background: "white", borderRadius: "28px 28px 0 0", padding: "0 0 32px", width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 -12px 50px rgba(0,0,0,0.2)" }}>
        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, background: "white", zIndex: 10, padding: "20px 20px 0", borderRadius: "28px 28px 0 0" }}>
          <div style={{ width: 40, height: 4, background: "#e5e7eb", borderRadius: 99, margin: "0 auto 16px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>✨ Mi Dashboard</h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>{activeWidgets.length} widgets activos · personaliza a tu gusto</p>
            </div>
            <button onClick={reset} style={{ fontSize: 11, color: "#9ca3af", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "7px 12px", cursor: "pointer", fontWeight: 600 }}>↺ Restablecer</button>
          </div>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 14, padding: 4, marginBottom: 16 }}>
            {(["gallery", "order"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: "9px", borderRadius: 11, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#F97316" : "#9ca3af",
                  boxShadow: tab === t ? "0 1px 6px rgba(0,0,0,0.1)" : "none" }}>
                {t === "gallery" ? "🎨 Galería de widgets" : "↕️ Ordenar activos"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 20px" }}>
          {tab === "gallery" ? (
            <>
              {/* Siempre visible */}
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Siempre visible</p>
              {ALL_WIDGETS.filter(w => w.required).map(w => (
                <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF7ED", borderRadius: 16, padding: "14px 16px", border: "1.5px solid #FED7AA", marginBottom: 8 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{w.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{w.label}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>{w.desc}</p>
                  </div>
                  <span style={{ fontSize: 11, color: "#F97316", fontWeight: 700, background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "4px 10px" }}>Fijo</span>
                </div>
              ))}

              {/* Opcionales */}
              <p style={{ margin: "16px 0 8px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>Widgets opcionales</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {ALL_WIDGETS.filter(w => !w.required).map(w => {
                  const isActive = activeWidgets.includes(w.id);
                  return (
                    <div key={w.id}
                      onClick={() => toggle(w.id)}
                      style={{ borderRadius: 18, padding: "16px 14px", border: `2px solid ${isActive ? "#F97316" : "#f3f4f6"}`,
                        background: isActive ? "#FFF7ED" : "white", cursor: "pointer", position: "relative",
                        boxShadow: isActive ? "0 4px 16px rgba(249,115,22,0.15)" : "0 1px 4px rgba(0,0,0,0.05)" }}>
                      {isActive && (
                        <div style={{ position: "absolute", top: 10, right: 10, width: 20, height: 20, borderRadius: "50%",
                          background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "white", fontWeight: 800 }}>✓</div>
                      )}
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{w.emoji}</div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isActive ? "#F97316" : "#1a1a1a", lineHeight: 1.2 }}>{w.label}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#9ca3af", lineHeight: 1.4 }}>{w.desc}</p>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9ca3af" }}>Arrastra o usa las flechas para reordenar los widgets activos en tu dashboard.</p>
              {activeList.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                  <p style={{ margin: 0, fontSize: 14 }}>No tienes widgets opcionales activos</p>
                  <button onClick={() => setTab("gallery")} style={{ marginTop: 12, background: "#F97316", color: "white", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Añadir widgets</button>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeList.map((w) => {
                  const posInActive = activeWidgets.indexOf(w.id);
                  return (
                    <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, background: "#FFF7ED", borderRadius: 14, padding: "12px 14px", border: "1.5px solid #FED7AA" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{w.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{w.label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>Posición {posInActive + 1}</p>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => moveUp(w.id)} disabled={posInActive <= 0}
                          style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: posInActive <= 0 ? "not-allowed" : "pointer", opacity: posInActive <= 0 ? 0.4 : 1, fontSize: 14 }}>↑</button>
                        <button onClick={() => moveDown(w.id)} disabled={posInActive >= activeWidgets.length - 1}
                          style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #e5e7eb", background: "white", cursor: posInActive >= activeWidgets.length - 1 ? "not-allowed" : "pointer", opacity: posInActive >= activeWidgets.length - 1 ? 0.4 : 1, fontSize: 14 }}>↓</button>
                      </div>
                      <button onClick={() => toggle(w.id)}
                        style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #FED7AA", background: "white", cursor: "pointer", fontSize: 14, color: "#9ca3af" }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(name?: string | null) {
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
  return `${saludo}${name ? `, ${name.split(" ")[0]}` : ""}! 👋`;
}
function fmtDate() {
  return new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ─── Calorie Ring ─────────────────────────────────────────────────────────────
function CalorieRing({ consumed, goal, protein, carbs, fat }: { consumed: number; goal: number; protein: number; carbs: number; fat: number }) {
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const r = 58; const circ = 2 * Math.PI * r;
  const remaining = goal - consumed; // puede ser negativo (exceso)
  const over = consumed > goal;
  const macros = [
    { label: "Proteínas", val: Math.round(protein), unit: "g", icon: "💪" },
    { label: "Carbos",    val: Math.round(carbs),   unit: "g", icon: "⚡" },
    { label: "Grasas",    val: Math.round(fat),     unit: "g", icon: "💧" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Top row: ring + numbers */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* SVG Ring */}
        <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: over ? "radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)" : "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)", filter: "blur(8px)" }} />
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="11" />
            <circle cx="70" cy="70" r={r} fill="none"
              stroke={over ? "#EF4444" : "url(#calGrad)"} strokeWidth="11"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
              strokeLinecap="round" transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)", filter: over ? "drop-shadow(0 0 6px #EF4444)" : "drop-shadow(0 0 8px rgba(249,115,22,0.8))" }} />
            <defs>
              <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#FBBF24" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: over ? "#FCA5A5" : "white", lineHeight: 1, letterSpacing: "-0.04em" }}>{Math.abs(remaining)}</span>
            <span style={{ fontSize: 10, color: over ? "#FCA5A5" : "rgba(255,255,255,0.6)", fontWeight: 600, marginTop: 2 }}>{over ? "kcal de más" : "kcal restantes"}</span>
          </div>
        </div>
        {/* Stats */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Consumidas</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: over ? "#FCA5A5" : "white", lineHeight: 1, letterSpacing: "-0.04em" }}>{consumed}<span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>kcal</span></div>
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.1)" }} />
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Objetivo</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.8)", lineHeight: 1 }}>{goal}<span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>kcal</span></div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 5, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct * 100}%`, background: over ? "#EF4444" : "linear-gradient(90deg, #F97316, #FBBF24)", borderRadius: 99, transition: "width 0.8s ease", boxShadow: over ? "0 0 8px #EF4444" : "0 0 8px rgba(249,115,22,0.8)" }} />
          </div>
        </div>
      </div>
      {/* Macros row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {macros.map(m => (
          <div key={m.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "10px 8px", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "white", lineHeight: 1 }}>{m.val}<span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{m.unit}</span></div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3, fontWeight: 600 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ─── Wellness Strip ───────────────────────────────────────────────────────────
function WellnessStrip() {
  const metrics = [
    { label: "Recovery", value: "–", unit: "%", color: "#10B981", icon: "⚡" },
    { label: "Sueño", value: "–", unit: "h", color: "#6366F1", icon: "🌙" },
    { label: "HRV", value: "–", unit: "ms", color: "#F97316", icon: "💓" },
    { label: "Pasos", value: "–", unit: "", color: "#0EA5E9", icon: "👟" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
      {metrics.map(m => (
        <Link key={m.label} href="/app/health-hub">
          <div style={{ background: "white", borderRadius: 14, padding: "12px 10px", textAlign: "center", border: "1px solid #f3f4f6", cursor: "pointer" }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{m.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Quick Access Grid ────────────────────────────────────────────────────────
const QUICK = [
  { label: "Recetas", emoji: "🍽️", to: "/app/recipes", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg", color: "#F97316" },
  { label: "Menús", emoji: "📅", to: "/app/menus", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg", color: "#6366F1" },
  { label: "Supermercados", emoji: "🛒", to: "/app/supermercados", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg", color: "#10B981" },
  { label: "Inventario", emoji: "📦", to: "/app/inventory", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg", color: "#F59E0B" },
  { label: "BuddyScan", emoji: "📷", to: "/app/buddy-scan", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyscan_dd3e1e08.jpg", color: "#8B5CF6" },
  { label: "BuddyIA", emoji: "🧠", to: "/app/buddy-ia", img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyia_card-VHfq39XvN8Z86UvgxyYrxs.webp", color: "#7C3AED" },
];
function QuickAccessGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
      {/* Mobile: scroll snap horizontal via CSS class */}
      {QUICK.map(q => (
        <Link key={q.label} href={q.to}>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", aspectRatio: "1/0.75", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
            <img src={q.img} alt={q.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{q.emoji} {q.label}</div>
            </div>
            <div style={{ position: "absolute", top: 8, left: 8, width: 8, height: 8, borderRadius: "50%", background: q.color }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Buddy Coach CTA ──────────────────────────────────────────────────────────
function BuddyCoachCTA() {
  return (
    <Link href="/app/health-hub">
      <div style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)", borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "white" }}>Buddy Coach</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Tu asesor de bienestar personalizado</p>
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.8)" }}>→</div>
      </div>
    </Link>
  );
}

// ─── Active Menu Card ─────────────────────────────────────────────────────────
function ActiveMenuCard({ menu }: { menu: any }) {
  if (!menu) return (
    <Link href="/app/menus">
      <div style={{ background: "#FFF7ED", borderRadius: 18, padding: "16px 20px", border: "1.5px dashed #FED7AA", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ fontSize: 28 }}>📅</div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#F97316" }}>Sin menú activo</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>Genera un menú personalizado →</p>
        </div>
      </div>
    </Link>
  );
  return (
    <Link href="/app/active-menu">
      <div style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)", borderRadius: 18, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
        <div style={{ fontSize: 28 }}>📅</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Menú en curso</p>
          <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 800, color: "white" }}>{menu.name}</p>
        </div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.8)" }}>→</div>
      </div>
    </Link>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe }: { recipe: any }) {
  if (!recipe) return null;
  return (
    <Link href={`/app/recipes/${recipe.id}`}>
      <div style={{ background: "white", borderRadius: 18, overflow: "hidden", border: "1px solid #f3f4f6", cursor: "pointer" }}>
        {recipe.imageUrl && (
          <div style={{ height: 140, overflow: "hidden" }}>
            <img src={recipe.imageUrl} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: "#FFF7ED", color: "#F97316", padding: "2px 8px", borderRadius: 20 }}>Receta del día</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{recipe.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>🔥 {recipe.calories ?? "–"} kcal · ⏱ {recipe.prepTime ?? "–"} min</p>
        </div>
      </div>
    </Link>
  );
}

// ─── Community Strip ──────────────────────────────────────────────────────────
function CommunityStrip() {
  const items = [
    { label: "Mi Nutricionista", emoji: "👩‍⚕️", to: "/app/my-expert", color: "#6366F1" },
    { label: "BuddyExperts", emoji: "🧑‍⚕️", to: "/app/buddy-experts", color: "#0EA5E9" },
    { label: "BuddyShop", emoji: "🛍️", to: "/app/buddy-shop", color: "#F97316" },
    { label: "BuddyCare", emoji: "💚", to: "/app/buddy-care", color: "#10B981" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
      {items.map(i => (
        <Link key={i.label} href={i.to}>
          <div style={{ background: "white", borderRadius: 14, padding: "12px 8px", textAlign: "center", border: "1px solid #f3f4f6", cursor: "pointer" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: i.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, margin: "0 auto 6px" }}>{i.emoji}</div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#374151", lineHeight: 1.2 }}>{i.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Streak / Level Widget ────────────────────────────────────────────────────
function StreakWidget({ streak, level, levelName }: { streak: number; level: number; levelName: string }) {
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6" }}>
      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mi progreso</p>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>🔥</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F97316", lineHeight: 1 }}>{streak}</div>
          <div style={{ fontSize: 10, color: "#9ca3af" }}>días racha</div>
        </div>
        <div style={{ width: 1, height: 48, background: "#f3f4f6" }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{levelName}</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>Nv. {level}</span>
          </div>
          <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99 }}>
            <div style={{ height: "100%", width: `${Math.min((level % 10) * 10, 100)}%`, background: "linear-gradient(90deg, #F97316, #FB923C)", borderRadius: 99 }} />
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <Link href="/app/health-hub">
              <span style={{ fontSize: 11, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver metas →</span>
            </Link>
            <Link href="/app/health-hub">
              <span style={{ fontSize: 11, color: "#6366F1", fontWeight: 600, cursor: "pointer" }}>Logros →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendations ──────────────────────────────────────────────────────────
function RecommendationsList({ recipes }: { recipes: any[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const trackInteraction = trpc.recommendations.trackInteraction.useMutation();

  // Auto-rotate every 4 seconds
  useEffect(() => {
    if (recipes.length <= 1) return;
    const timer = setInterval(() => setCurrentIdx(i => (i + 1) % Math.min(recipes.length, 6)), 4000);
    return () => clearInterval(timer);
  }, [recipes.length]);

  if (!recipes.length) return null;
  const visible = recipes.slice(0, 6);
  const current = visible[currentIdx];

  const handleClick = (recipeId: number) => {
    trackInteraction.mutate({ entityType: "recipe", entityId: recipeId, action: "long_view" });
  };

  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>✨ Para ti hoy</p>
        <Link href="/app/recipes"><span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver todas →</span></Link>
      </div>
      {/* Featured carousel item */}
      {current && (
        <Link key={current.id} href={`/app/recipes/${current.id}`} onClick={() => handleClick(current.id)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: "#FFF7ED", cursor: "pointer", marginBottom: 10, border: "1.5px solid #FED7AA" }}>
            {current.imageUrl && <img src={current.imageUrl} alt={current.name} style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.name}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>🔥 {current.calories ?? "–"} kcal</p>
            </div>
            <span style={{ fontSize: 18, color: "#F97316" }}>›</span>
          </div>
        </Link>
      )}
      {/* Dot indicators */}
      {visible.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 10 }}>
          {visible.map((_, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              style={{ width: i === currentIdx ? 16 : 6, height: 6, borderRadius: 3, background: i === currentIdx ? "#F97316" : "#E5E7EB", border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s" }}
            />
          ))}
        </div>
      )}
      {/* Mini list of remaining */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.filter((_, i) => i !== currentIdx).slice(0, 2).map((r: any) => (
          <Link key={r.id} href={`/app/recipes/${r.id}`} onClick={() => handleClick(r.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, background: "#F9FAFB", cursor: "pointer" }}>
              {r.imageUrl && <img src={r.imageUrl} alt={r.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{r.calories ?? "–"} kcal</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Daily Recommendations ──────────────────────────────────────────────────
type DailyRecsProps = { consumed: number; goal: number; protein: number; carbs: number; fat: number; proteinGoal: number; carbsGoal: number; fatGoal: number; streak: number; };
function DailyRecs({ consumed, goal, protein, carbs, fat, proteinGoal, carbsGoal, fatGoal, streak }: DailyRecsProps) {
  const hour = new Date().getHours();
  const pct = goal > 0 ? consumed / goal : 0;
  const recs: { icon: string; text: string; color: string }[] = [];

  if (consumed === 0) {
    if (hour < 10) recs.push({ icon: "🌅", text: "Empieza el día con un desayuno equilibrado: proteínas + carbohidratos complejos.", color: "#FFF7ED" });
    else if (hour < 14) recs.push({ icon: "🍽️", text: "Aún no has registrado comidas hoy. ¡Registra tu almuerzo para seguir tu progreso!", color: "#FFF7ED" });
    else recs.push({ icon: "📋", text: "Registra tus comidas para que Buddy Coach pueda darte recomendaciones personalizadas.", color: "#FFF7ED" });
  } else if (pct < 0.4) {
    recs.push({ icon: "⚡", text: `Solo llevas ${consumed} kcal de ${goal} kcal. Asegúrate de comer suficiente para mantener tu energía.`, color: "#FFF7ED" });
  } else if (pct > 0.9 && pct < 1.05) {
    recs.push({ icon: "🎯", text: "¡Casi en tu meta calórica! Elige una cena ligera rica en verduras y proteína magra.", color: "#F0FDF4" });
  } else if (pct >= 1.05) {
    recs.push({ icon: "⚠️", text: `Has superado tu meta en ${consumed - goal} kcal. Opta por una cena muy ligera y bebe agua.`, color: "#FEF3C7" });
  }

  const proteinPct = proteinGoal > 0 ? protein / proteinGoal : 0;
  if (proteinPct < 0.5 && consumed > 0) recs.push({ icon: "💪", text: `Tu proteína está baja (${Math.round(protein)}g de ${proteinGoal}g). Añade pollo, huevos o legumbres en tu próxima comida.`, color: "#EFF6FF" });

  if (streak >= 7) recs.push({ icon: "🔥", text: `¡${streak} días de racha! Mantén el ritmo — la consistencia es la clave del éxito.`, color: "#FFF7ED" });
  else if (streak === 0) recs.push({ icon: "🚀", text: "Registra tus comidas hoy para empezar tu racha. ¡Los primeros 7 días son los más importantes!", color: "#F5F3FF" });

  if (hour >= 14 && hour < 17 && consumed > 0) recs.push({ icon: "🥜", text: "Hora del snack de tarde: un puñado de frutos secos o una fruta te dará energía hasta la cena.", color: "#F0FDF4" });

  if (!recs.length) return null;
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>💡 Recomendaciones de hoy</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recs.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 12, background: r.color }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
            <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{r.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Hydration Widget ─────────────────────────────────────────────────────────
const HYDRATION_GOAL = 8;
function HydrationWidget() {
  const storageKey = "buddymarket_hydration_" + new Date().toISOString().slice(0, 10);
  const [glasses, setGlasses] = useState<number>(() => {
    try { return Number(localStorage.getItem(storageKey) ?? 0); } catch { return 0; }
  });
  const add = () => {
    const next = Math.min(glasses + 1, HYDRATION_GOAL + 4);
    setGlasses(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  };
  const remove = () => {
    const next = Math.max(glasses - 1, 0);
    setGlasses(next);
    try { localStorage.setItem(storageKey, String(next)); } catch {}
  };
  const pct = Math.min(glasses / HYDRATION_GOAL, 1);
  const done = glasses >= HYDRATION_GOAL;
  return (
    <div style={{ background: done ? "linear-gradient(135deg, #EFF6FF, #DBEAFE)" : "white", borderRadius: 18, padding: "16px 18px", border: `1px solid ${done ? "#93C5FD" : "#f3f4f6"}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: done ? "#1D4ED8" : "#1a1a1a" }}>💧 Hidratación</p>
        <span style={{ fontSize: 12, color: done ? "#2563EB" : "#9ca3af", fontWeight: 700 }}>{glasses}/{HYDRATION_GOAL} vasos{done ? " ✅" : ""}</span>
      </div>
      <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, marginBottom: 12, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct * 100}%`, background: done ? "linear-gradient(90deg, #3B82F6, #60A5FA)" : "linear-gradient(90deg, #93C5FD, #BFDBFE)", borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
        {Array.from({ length: HYDRATION_GOAL }).map((_, i) => (
          <div key={i} style={{ width: 28, height: 34, borderRadius: 6, border: `2px solid ${i < glasses ? "#3B82F6" : "#e5e7eb"}`, background: i < glasses ? "#DBEAFE" : "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, transition: "all 0.2s" }}>
            {i < glasses ? "💧" : ""}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={add} style={{ flex: 1, background: "linear-gradient(135deg, #3B82F6, #60A5FA)", color: "white", border: "none", borderRadius: 12, padding: "9px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Vaso</button>
        <button onClick={remove} disabled={glasses === 0} style={{ width: 40, background: "#f3f4f6", color: "#6b7280", border: "none", borderRadius: 12, padding: "9px", fontSize: 16, fontWeight: 700, cursor: glasses === 0 ? "not-allowed" : "pointer", opacity: glasses === 0 ? 0.5 : 1 }}>−</button>
      </div>
    </div>
  );
}

// ─── Macros Summary Widget ────────────────────────────────────────────────────
type MacrosSummaryProps = { consumed: number; goal: number; protein: number; carbs: number; fat: number; proteinGoal: number; carbsGoal: number; fatGoal: number; };
function MacrosSummaryWidget({ consumed: _c, goal: _g, protein, carbs, fat, proteinGoal, carbsGoal, fatGoal }: MacrosSummaryProps) {
  const macros = [
    { label: "Proteínas", value: Math.round(protein), goal: proteinGoal, color: "#6366F1", unit: "g" },
    { label: "Carbohidratos", value: Math.round(carbs), goal: carbsGoal, color: "#F97316", unit: "g" },
    { label: "Grasas", value: Math.round(fat), goal: fatGoal, color: "#10B981", unit: "g" },
  ];
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>📊 Resumen de macros</p>
        <Link href="/app/meal-log"><span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver diario →</span></Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {macros.map(m => {
          const pct = m.goal > 0 ? Math.min(m.value / m.goal, 1) : 0;
          return (
            <div key={m.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{m.label}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{m.value}{m.unit} / {m.goal}{m.unit}</span>
              </div>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct * 100}%`, background: m.color, borderRadius: 99, transition: "width 0.5s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Weekly Goals Widget ──────────────────────────────────────────────────────
function WeeklyGoalsWidget({ streak, consumed, goal }: { streak: number; consumed: number; goal: number }) {
  const calPct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const getHydration = () => { try { return Number(localStorage.getItem("buddymarket_hydration_" + new Date().toISOString().slice(0, 10)) ?? 0); } catch { return 0; } };
  const goals = [
    { label: "Calorías del día", pct: calPct, color: "#F97316", detail: `${consumed} / ${goal} kcal` },
    { label: "Racha activa", pct: Math.min(streak / 7, 1), color: "#EF4444", detail: `${streak} / 7 días` },
    { label: "Hidratación", pct: Math.min(getHydration() / 8, 1), color: "#3B82F6", detail: `${getHydration()} / 8 vasos` },
  ];
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>🎯 Objetivos de hoy</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {goals.map(g => (
          <div key={g.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{g.label}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{g.detail}</span>
            </div>
            <div style={{ height: 8, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${g.pct * 100}%`, background: g.color, borderRadius: 99, transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly Check-in Card (Mejora 2) ─────────────────────────────────────────
function WeeklyCheckinCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", borderRadius: 18, padding: "16px 18px", border: "2px solid #FED7AA", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "rgba(249,115,22,0.06)", borderRadius: "50%" }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ background: "#F97316", borderRadius: 12, padding: "10px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 20 }}>📋</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>Check-in semanal pendiente</p>
          <p style={{ margin: "4px 0 12px", fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>Registra tu progreso de esta semana: peso, fotos y cómo te has sentido. ¡Solo tarda 2 minutos!</p>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/app/progress">
              <span style={{ background: "#F97316", color: "white", borderRadius: 10, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-block" }}>Hacer check-in →</span>
            </Link>
            <button onClick={onDismiss} style={{ background: "transparent", border: "1px solid #FED7AA", borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#9ca3af", cursor: "pointer" }}>Más tarde</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Progress Card (Mejora 4) ─────────────────────────────────────
function OnboardingCard({ profile }: { profile: any }) {
  const steps = [
    { label: "Peso y altura", done: !!(profile?.weight && profile?.height) },
    { label: "Objetivo principal", done: !!profile?.mainGoal },
    { label: "Meta calórica", done: !!profile?.dailyCalorieGoal },
    { label: "Restricciones dietéticas", done: !!(profile?.menuRestrictions || profile?.menuAllergies) },
    { label: "Nivel de actividad", done: !!profile?.activityLevel },
  ];
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  if (pct >= 100) return null;
  const pending = steps.filter(s => !s.done);
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>⚙️ Completa tu perfil</p>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#F97316" }}>{pct}%</span>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 99, height: 6, marginBottom: 12 }}>
        <div style={{ background: "linear-gradient(90deg, #F97316, #FB923C)", borderRadius: 99, height: 6, width: `${pct}%`, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {pending.slice(0, 2).map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #FED7AA", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>{s.label}</span>
          </div>
        ))}
      </div>
      <Link href="/app/profile">
        <span style={{ fontSize: 12, fontWeight: 700, color: "#F97316", cursor: "pointer" }}>Completar perfil → mejores recomendaciones</span>
      </Link>
    </div>
  );
}

// ─── Quick Meal Log Modal (Mejora 5) ──────────────────────────────────────────
function QuickMealModal({ onClose, today }: { onClose: () => void; today: string }) {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [mealType, setMealType] = useState("almuerzo");
  const utils = trpc.useUtils();
  const addMeal = trpc.mealLogs.add.useMutation({
    onSuccess: () => {
      utils.mealLogs.dailySummary.invalidate();
      onClose();
    },
  });
  const mealTypes = [
    { id: "desayuno", label: "🌅 Desayuno" },
    { id: "almuerzo", label: "☀️ Almuerzo" },
    { id: "cena", label: "🌙 Cena" },
    { id: "snack", label: "🍎 Snack" },
  ];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "white", borderRadius: 24, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>⚡ Registro rápido</h3>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: 99, width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>✕</button>
        </div>
        {/* Tipo de comida */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {mealTypes.map(m => (
            <button key={m.id} onClick={() => setMealType(m.id)} style={{ background: mealType === m.id ? "#FFF7ED" : "#f9fafb", border: `2px solid ${mealType === m.id ? "#F97316" : "transparent"}`, borderRadius: 12, padding: "9px 10px", fontSize: 12, fontWeight: 600, color: mealType === m.id ? "#F97316" : "#6b7280", cursor: "pointer" }}>{m.label}</button>
          ))}
        </div>
        {/* Nombre */}
        <input value={mealName} onChange={e => setMealName(e.target.value)} placeholder="Nombre del alimento o plato" style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
        {/* Calorías y proteínas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>CALORÍAS *</label>
            <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="0" style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 4 }}>PROTEÍNA (g)</label>
            <input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="0" style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px 14px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>
        <button
          onClick={() => addMeal.mutate({ customMealName: mealName.trim(), calories: Number(calories), proteins: Number(protein) || 0, logDate: today })}
          disabled={!mealName.trim() || !calories || addMeal.isPending}
          style={{ width: "100%", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", border: "none", borderRadius: 14, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (!mealName.trim() || !calories) ? 0.5 : 1 }}>
          {addMeal.isPending ? "Registrando..." : "✓ Registrar comida"}
        </button>
        <Link href="/app/meal-log">
          <p style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#9ca3af", cursor: "pointer" }}>Ir al diario completo →</p>
        </Link>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCheckinCard, setShowCheckinCard] = useState(true);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  // Onboarding tour
  const onboardingStatus = trpc.profileSetup.getOnboardingStatus.useQuery();
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (onboardingStatus.data && !onboardingStatus.data.tourCompleted) {
      const t = setTimeout(() => setShowTour(true), 900);
      return () => clearTimeout(t);
    }
  }, [onboardingStatus.data]);
  const { activeWidgets, toggle, moveUp, moveDown, reset } = useWidgetConfig();
  const has = (id: string) => activeWidgets.includes(id);

  const [today] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  // Data
  const profileData = trpc.profile.get.useQuery();
  const dailySummary = trpc.mealLogs.dailySummary.useQuery({ date: today });
  const streakData = trpc.mealLogs.getStreak.useQuery();
  const activeMenuData = trpc.menus.getActive.useQuery();
  const levelInfo = trpc.retention.getLevelInfo.useQuery();
  const contextualRecipe = trpc.retention.getDailyContextualRecipe.useQuery();
  const pendingCheckins = trpc.weeklyCheckins.getMyPendingCheckins.useQuery();
  const recommendedRecipes = trpc.recipes.list.useQuery(
    useMemo(() => ({ limit: 3, isPublic: true, excludeUserAllergens: true }), [])
  );

  const profile = profileData.data;
  const summary = dailySummary.data;

  // Confetti when macros goal is reached
  const confettiFiredRef = useRef(false);
  const proteinGoal = profile?.proteinGoal ?? 150;
  const carbsGoal   = profile?.carbsGoal   ?? 250;
  const fatGoal     = profile?.fatGoal     ?? 65;
  const goalCal0    = profile?.dailyCalorieGoal ?? 2000;
  const protein0    = (summary as any)?.protein ?? 0;
  const carbs0      = (summary as any)?.carbs   ?? 0;
  const fat0        = (summary as any)?.fat     ?? 0;
  const consumed0   = (summary as any)?.calories ?? (summary as any)?.totalCalories ?? 0;
  const macrosComplete = protein0 >= proteinGoal && carbs0 >= carbsGoal && fat0 >= fatGoal && consumed0 >= goalCal0 * 0.9;
  useEffect(() => {
    if (macrosComplete && !confettiFiredRef.current && dailySummary.isFetched) {
      confettiFiredRef.current = true;
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#F97316", "#FBBF24", "#10B981", "#3B82F6", "#8B5CF6"] });
    }
    if (!macrosComplete) confettiFiredRef.current = false;
  }, [macrosComplete, dailySummary.isFetched]);
  const goalCal = profile?.dailyCalorieGoal ?? 2000;
  const consumed = (summary as any)?.calories ?? (summary as any)?.totalCalories ?? 0;
  const streak = streakData.data?.currentStreak ?? 0;
  const lvl = levelInfo.data;
  const recipe = contextualRecipe.data;
  const recs = (recommendedRecipes.data as any)?.recipes ?? recommendedRecipes.data ?? [];
  const hasPendingCheckin = (pendingCheckins.data?.length ?? 0) > 0;

  return (
    <>
      {showMealModal && <QuickMealModal onClose={() => setShowMealModal(false)} today={today} />}
      {/* Onboarding tour */}
      {showTour && (
        <OnboardingTourGuide
          profileType={user?.accountType ?? "user"}
          onComplete={() => setShowTour(false)}
          onSkip={() => setShowTour(false)}
        />
      )}
      {showWidgetConfig && (
        <WidgetConfigPanel
          onClose={() => setShowWidgetConfig(false)}
          activeWidgets={activeWidgets}
          toggle={toggle}
          moveUp={moveUp}
          moveDown={moveDown}
          reset={reset}
        />
      )}
      <div className="max-w-[1100px] mx-auto pb-10 px-0">

        {/* ── CHECK-IN SEMANAL (Mejora 2) ── */}
        {hasPendingCheckin && showCheckinCard && (
          <div className="mb-4">
            <WeeklyCheckinCard onDismiss={() => setShowCheckinCard(false)} />
          </div>
        )}

        {/* ── HERO ── */}
        <div className="rounded-[22px] mb-5 border border-[#FED7AA] p-5 md:p-6" style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a1a" }}>{getGreeting(user?.name)}</h1>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9ca3af" }}>{capitalize(fmtDate())} · {streak > 0 ? `🔥 ¡Sigues en racha! ${streak} días` : "Empieza tu racha hoy"}</p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setShowWidgetConfig(true)} style={{ background: "white", borderRadius: 14, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, border: "1px solid #FED7AA", cursor: "pointer" }}>
                <span style={{ fontSize: 14 }}>⚙️</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Widgets</span>
              </button>
              <Link href="/app/health-hub">
                <div style={{ background: "white", borderRadius: 14, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, border: "1px solid #FED7AA", cursor: "pointer" }}>
                  <span style={{ fontSize: 14 }}>💓</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#F97316" }}>Health Hub</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>→</span>
                </div>
              </Link>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <WellnessStrip />
          </div>
        </div>

        {/* ── 2-COLUMN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 items-start">

          {/* ── COLUMN LEFT ── */}
          <div className="flex flex-col gap-4">

            {/* Calorías — WOW card oscura */}
            <div
              onClick={() => navigate("/app/meal-log")}
              style={{
                position: "relative", overflow: "hidden",
                background: "linear-gradient(135deg, #1C1C2E 0%, #2D1B4E 45%, #1A1A2E 100%)",
                borderRadius: 24, padding: "22px 22px 20px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
                cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s"
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(249,115,22,0.4), inset 0 1px 0 rgba(255,255,255,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.06)"; }}
            >
              {/* Decorative blobs */}
              <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🔥</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Calorías hoy</span>
                  <span style={{ fontSize: 10, background: "rgba(249,115,22,0.2)", color: "#FB923C", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>📖 Diario</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setShowMealModal(true); }}
                  style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 800, cursor: "pointer", background: "linear-gradient(135deg, #F97316, #FBBF24)", border: "none", borderRadius: 10, padding: "6px 12px", boxShadow: "0 2px 8px rgba(249,115,22,0.5)" }}
                >⚡ Registrar</button>
              </div>
              {/* Ring + data */}
              <CalorieRing
                consumed={consumed}
                goal={goalCal}
                protein={(summary as any)?.proteins ?? (summary as any)?.totalProtein ?? 0}
                carbs={(summary as any)?.carbohydrates ?? (summary as any)?.totalCarbs ?? 0}
                fat={(summary as any)?.fats ?? (summary as any)?.totalFat ?? 0}
              />
              {/* CTA cuando no hay registros */}
              {consumed === 0 && (
                <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 14, background: "rgba(249,115,22,0.1)", border: "1px dashed rgba(249,115,22,0.4)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Aún no has registrado ningún alimento hoy</p>
                  <button
                    onClick={e => { e.stopPropagation(); setShowMealModal(true); }}
                    style={{ marginTop: 8, fontSize: 12, color: "#1a1a1a", fontWeight: 800, cursor: "pointer", background: "linear-gradient(135deg, #F97316, #FBBF24)", border: "none", borderRadius: 10, padding: "8px 18px", boxShadow: "0 2px 8px rgba(249,115,22,0.5)" }}
                  >⚡ Registrar primera comida</button>
                </div>
              )}
            </div>
            {/* Onboarding progresivo (Mejora 4) */}
            {has("onboarding") && <OnboardingCard profile={profile} />}

            {/* Menú activo */}
            {has("menu") && <ActiveMenuCard menu={activeMenuData.data} />}

            {/* Buddy Coach CTA */}
            {has("coach") && <BuddyCoachCTA />}

            {/* Recomendaciones diarias personalizadas */}
            {has("recs") && (
              <DailyRecs
                consumed={consumed}
                goal={goalCal}
                protein={(summary as any)?.proteins ?? (summary as any)?.totalProtein ?? 0}
                carbs={(summary as any)?.carbohydrates ?? (summary as any)?.totalCarbs ?? 0}
                fat={(summary as any)?.fats ?? (summary as any)?.totalFat ?? 0}
                proteinGoal={Math.round((goalCal * 0.30) / 4)}
                carbsGoal={Math.round((goalCal * 0.45) / 4)}
                fatGoal={Math.round((goalCal * 0.25) / 9)}
                streak={streak}
              />
            )}

            {/* Resumen de macros */}
            {has("macros") && (
              <MacrosSummaryWidget
                consumed={consumed}
                goal={goalCal}
                protein={(summary as any)?.proteins ?? (summary as any)?.totalProtein ?? 0}
                carbs={(summary as any)?.carbohydrates ?? (summary as any)?.totalCarbs ?? 0}
                fat={(summary as any)?.fats ?? (summary as any)?.totalFat ?? 0}
                proteinGoal={Math.round((goalCal * 0.30) / 4)}
                carbsGoal={Math.round((goalCal * 0.45) / 4)}
                fatGoal={Math.round((goalCal * 0.25) / 9)}
              />
            )}

            {/* Recetas recomendadas */}
            {has("recipes") && <RecommendationsList recipes={recs} />}

          </div>

          {/* ── COLUMN RIGHT ── */}
          <div className="flex flex-col gap-4">

            {/* Hidratación */}
            {has("hydration") && <HydrationWidget />}

            {/* Objetivos semanales */}
            {has("goals") && <WeeklyGoalsWidget streak={streak} consumed={consumed} goal={goalCal} />}

            {/* Accesos rápidos */}
            {has("quickaccess") && (
              <div style={{ background: "white", borderRadius: 20, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Accesos rápidos</p>
                <QuickAccessGrid />
              </div>
            )}

            {/* Racha + Nivel */}
            {has("streak") && (
              <StreakWidget
                streak={streak}
                level={lvl?.level ?? 1}
                levelName={lvl?.levelName ?? "Principiante"}
              />
            )}

            {/* Receta del día */}
            {has("recipeday") && recipe && <RecipeCard recipe={recipe} />}

            {/* Comunidad */}
            {has("community") && (
              <div style={{ background: "white", borderRadius: 20, padding: "16px 18px", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Comunidad & Tienda</p>
                <CommunityStrip />
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
