import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { useExpertMode } from "@/contexts/ExpertModeContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const BuddyExpertDashboard = lazy(() => import("./BuddyExpertDashboard"));

// ─── Responsive hook ──────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === "undefined") return "desktop";
    return window.innerWidth >= 1024 ? "desktop" : window.innerWidth >= 640 ? "tablet" : "mobile";
  });
  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setBp(w >= 1024 ? "desktop" : w >= 640 ? "tablet" : "mobile");
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return bp;
}

function getGreeting(name?: string | null) {
  const h = new Date().getHours();
  const s = h < 12 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
  return `${s}${name ? `, ${name.split(" ")[0]}` : ""}`;
}

function fmtDate(lang = "es-ES") {
  const s = new Date().toLocaleDateString(lang, { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── CSS Animations injected once ────────────────────────────────────────────
const ANIM_CSS = `
@keyframes bm-fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
@keyframes bm-pulse  { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
@keyframes bm-glow   { 0%,100% { box-shadow:0 0 20px rgba(249,115,22,0.3); } 50% { box-shadow:0 0 40px rgba(249,115,22,0.6); } }
@keyframes bm-float  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
.bm-fade-up   { animation: bm-fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
.bm-fade-up-1 { animation: bm-fadeUp 0.6s 0.07s cubic-bezier(0.16,1,0.3,1) both; }
.bm-fade-up-2 { animation: bm-fadeUp 0.6s 0.14s cubic-bezier(0.16,1,0.3,1) both; }
.bm-fade-up-3 { animation: bm-fadeUp 0.6s 0.21s cubic-bezier(0.16,1,0.3,1) both; }
.bm-fade-up-4 { animation: bm-fadeUp 0.6s 0.28s cubic-bezier(0.16,1,0.3,1) both; }
.bm-fade-up-5 { animation: bm-fadeUp 0.6s 0.35s cubic-bezier(0.16,1,0.3,1) both; }
.bm-card-hover { transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease; cursor:pointer; }
.bm-card-hover:hover { transform: translateY(-5px) scale(1.005); box-shadow: 0 24px 60px rgba(0,0,0,0.16) !important; }
.bm-quick-hover { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease; cursor:pointer; }
.bm-quick-hover:hover { transform: scale(1.06); box-shadow: 0 16px 40px rgba(0,0,0,0.2) !important; }
.bm-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:99px; font-size:11px; font-weight:700; }
`;

// ─── Quick Access data ────────────────────────────────────────────────────────
const QUICK_ACCESS = [
  { label: "Recetas",      emoji: "🍽️", to: "/app/recipes",       img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",      color: "#F97316", sub: "Explorar" },
  { label: "Menús",        emoji: "📅", to: "/app/menus",          img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",    color: "#6366F1", sub: "Planificar" },
  { label: "Supermercados",emoji: "🛒", to: "/app/supermercados",  img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",   color: "#10B981", sub: "Comprar" },
  { label: "Inventario",   emoji: "📦", to: "/app/inventory",      img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",     color: "#F59E0B", sub: "Despensa" },
  { label: "BuddyScan",    emoji: "📷", to: "/app/buddy-scan",     img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyscan_dd3e1e08.jpg",  color: "#8B5CF6", sub: "Escanear" },
  { label: "BuddyIA",      emoji: "🧠", to: "/app/buddy-ia",       img: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddyia_card-VHfq39XvN8Z86UvgxyYrxs.webp", color: "#7C3AED", sub: "IA Nutricional" },
];

const COMMUNITY = [
  { label: "Mi Nutricionista", emoji: "👩‍⚕️", to: "/app/my-expert",     color: "#6366F1" },
  { label: "BuddyExperts",     emoji: "🧑‍⚕️", to: "/app/buddy-experts", color: "#0EA5E9" },
  { label: "BuddyShop",        emoji: "🛍️",  to: "/app/buddy-shop",    color: "#F97316" },
  { label: "BuddyCare",        emoji: "💚",  to: "/app/buddy-care",    color: "#10B981" },
];

// ─── CalorieRingCard ──────────────────────────────────────────────────────────
function CalorieRingCard({ consumed, goal, protein, carbs, fat, proteinGoal, carbsGoal, fatGoal, isDark, showGoalEdit, setShowGoalEdit, setGoalOverride }: any) {
  const over = consumed > goal;
  const pct = Math.min(consumed / Math.max(goal, 1), 1);
  const r = 56; const circ = 2 * Math.PI * r;
  const remaining = Math.max(goal - consumed, 0);
  const macros = [
    { label: "Proteínas", val: protein, goal: proteinGoal, color: "#F97316" },
    { label: "Carbos",    val: carbs,   goal: carbsGoal,   color: "#6366F1" },
    { label: "Grasas",    val: fat,     goal: fatGoal,     color: "#10B981" },
  ];
  return (
    <Link href="/app/meal-log">
      <div className="bm-card-hover" style={{ background: isDark ? "linear-gradient(145deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" : "linear-gradient(145deg,#fff9f5 0%,#fff3e8 50%,#ffecd6 100%)", borderRadius: 28, padding: "24px 26px", boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.45)" : "0 12px 40px rgba(249,115,22,0.18), 0 1px 0 rgba(255,255,255,0.8) inset", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(249,115,22,0.18)", position: "relative", overflow: "hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle,rgba(249,115,22,0.2) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-50, left:-30, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.15) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, position:"relative" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:9, background: isDark ? "rgba(249,115,22,0.25)" : "rgba(249,115,22,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:15 }}>🔥</span></div>
            <span style={{ fontSize:12, fontWeight:800, color: isDark ? "rgba(255,255,255,0.7)" : "#92400e", letterSpacing:"0.06em", textTransform:"uppercase" }}>Calorías hoy</span>
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowGoalEdit(!showGoalEdit); }} style={{ background: isDark ? "rgba(249,115,22,0.2)" : "rgba(249,115,22,0.12)", border: isDark ? "1px solid rgba(249,115,22,0.4)" : "1px solid rgba(249,115,22,0.3)", borderRadius:10, padding:"4px 12px", fontSize:12, color:"#F97316", cursor:"pointer", fontWeight:700 }}>Meta: {goal} kcal</button>
        </div>
        {showGoalEdit && (
          <div style={{ marginBottom:14, position:"relative" }} onClick={(e) => e.stopPropagation()}>
            <input type="number" defaultValue={goal} autoFocus onBlur={(e) => { setGoalOverride(Number(e.target.value)); setShowGoalEdit(false); }} style={{ width:"100%", padding:"10px 14px", borderRadius:12, border:"1px solid rgba(249,115,22,0.5)", fontSize:14, background: isDark ? "rgba(255,255,255,0.1)" : "white", color: isDark ? "white" : "#1a1a1a", outline:"none", boxSizing:"border-box" }} />
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:22, position:"relative" }}>
          <div style={{ position:"relative", width:148, height:148, flexShrink:0 }}>
            <svg width="148" height="148" viewBox="0 0 130 130">
              <defs>
                <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FB923C"/>
                  <stop offset="100%" stopColor="#DC2626"/>
                </linearGradient>
              </defs>
              <circle cx="65" cy="65" r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.12)"} strokeWidth="12" />
              <circle cx="65" cy="65" r={r} fill="none" stroke={over ? "#EF4444" : "url(#calGrad)"} strokeWidth="12" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" transform="rotate(-90 65 65)" style={{ transition:"stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)", filter: over ? "drop-shadow(0 0 8px rgba(239,68,68,0.7))" : "drop-shadow(0 0 10px rgba(249,115,22,0.65))" }} />
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:30, fontWeight:900, color: over ? "#EF4444" : (isDark ? "white" : "#111827"), lineHeight:1, letterSpacing:"-0.05em" }}>{remaining}</span>
              <span style={{ fontSize:10, color: isDark ? "rgba(255,255,255,0.5)" : "#9ca3af", fontWeight:700, marginTop:3, textTransform:"uppercase", letterSpacing:"0.05em" }}>kcal rest.</span>
              <span style={{ fontSize:10, color: isDark ? "rgba(255,255,255,0.35)" : "#c4b5a5", marginTop:2 }}>{consumed} cons.</span>
            </div>
          </div>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
            {macros.map(m => {
              const p = m.goal > 0 ? Math.min((m.val / m.goal) * 100, 100) : 0;
              return (
                <div key={m.label}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600, color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280" }}>{m.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color: isDark ? "white" : "#1a1a1a" }}>{m.val}g <span style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#d1d5db", fontWeight:400 }}>/ {m.goal}g</span></span>
                  </div>
                  <div style={{ height:5, borderRadius:99, background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${p}%`, background:`linear-gradient(90deg,${m.color},${m.color}cc)`, borderRadius:99, transition:"width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop:4, padding:"8px 14px", borderRadius:12, background: isDark ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.1)", border: isDark ? "1px solid rgba(249,115,22,0.3)" : "1px solid rgba(249,115,22,0.2)", textAlign:"center" }}>
              <span style={{ fontSize:12, fontWeight:700, color:"#F97316" }}>+ Registrar comida</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── ActiveMenuCard ───────────────────────────────────────────────────────────
function ActiveMenuCard({ menu, isDark }: any) {
  if (!menu) return (
    <Link href="/app/menus">
      <div className="bm-card-hover" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "white", borderRadius:20, padding:"16px 20px", border: isDark ? "1.5px dashed rgba(255,255,255,0.12)" : "1.5px dashed #FED7AA", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:44, height:44, borderRadius:14, background: isDark ? "rgba(249,115,22,0.12)" : "#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📅</div>
        <div>
          <p style={{ margin:0, fontSize:14, fontWeight:700, color:"#F97316" }}>Sin menú activo</p>
          <p style={{ margin:"3px 0 0", fontSize:12, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>Genera tu plan semanal con IA →</p>
        </div>
        <div style={{ marginLeft:"auto", fontSize:18, color:"#F97316" }}>›</div>
      </div>
    </Link>
  );
  return (
    <Link href="/app/active-menu">
      <div className="bm-card-hover" style={{ background:"linear-gradient(135deg,#F97316 0%,#EA580C 100%)", borderRadius:20, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, boxShadow:"0 8px 24px rgba(249,115,22,0.35)" }}>
        <div style={{ width:44, height:44, borderRadius:14, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>📅</div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.06em" }}>Menú en curso</p>
          <p style={{ margin:"3px 0 0", fontSize:15, fontWeight:800, color:"white", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{menu.name}</p>
        </div>
        <div style={{ fontSize:18, color:"rgba(255,255,255,0.8)" }}>›</div>
      </div>
    </Link>
  );
}

// ─── BuddyCoachBanner ─────────────────────────────────────────────────────────
function BuddyCoachBanner({ isDark }: any) {
  return (
    <Link href="/app/health-hub">
      <div className="bm-card-hover" style={{ background: isDark ? "linear-gradient(135deg,rgba(249,115,22,0.2) 0%,rgba(234,88,12,0.15) 100%)" : "linear-gradient(135deg,#FFF7ED 0%,#FFEDD5 100%)", borderRadius:20, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, border: isDark ? "1px solid rgba(249,115,22,0.25)" : "1px solid rgba(249,115,22,0.2)" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:"linear-gradient(135deg,#F97316,#EA580C)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, boxShadow:"0 4px 12px rgba(249,115,22,0.4)" }}>🤖</div>
        <div style={{ flex:1 }}>
          <p style={{ margin:0, fontSize:15, fontWeight:800, color: isDark ? "white" : "#1a1a1a" }}>Buddy Coach</p>
          <p style={{ margin:"3px 0 0", fontSize:12, color: isDark ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>Tu asesor de bienestar personalizado</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E", boxShadow:"0 0 6px rgba(34,197,94,0.6)" }} />
          <span style={{ fontSize:12, color:"#22C55E", fontWeight:600 }}>En línea</span>
        </div>
        <div style={{ fontSize:18, color:"#F97316", marginLeft:4 }}>›</div>
      </div>
    </Link>
  );
}

// ─── WellnessStrip ────────────────────────────────────────────────────────────
function WellnessStrip({ isDark }: any) {
  const items = [
    { label:"Recovery", val:"–", color:"#10B981", icon:"⚡" },
    { label:"Sueño",    val:"–", color:"#6366F1", icon:"🌙" },
    { label:"HRV",      val:"–", color:"#F97316", icon:"💓" },
    { label:"Pasos",    val:"–", color:"#0EA5E9", icon:"👟" },
  ];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
      {items.map(m => (
        <Link key={m.label} href="/app/health-hub">
          <div className="bm-card-hover" style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.8)", borderRadius:14, padding:"12px 8px", textAlign:"center", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.6)", backdropFilter:"blur(8px)" }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{m.icon}</div>
            <div style={{ fontSize:18, fontWeight:900, color:m.color, lineHeight:1, letterSpacing:"-0.02em" }}>{m.val}</div>
            <div style={{ fontSize:10, color: isDark ? "rgba(255,255,255,0.45)" : "#9ca3af", marginTop:3, fontWeight:600 }}>{m.label}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── QuickAccessGrid ──────────────────────────────────────────────────────────
function QuickAccessGrid({ isDark }: any) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
      {QUICK_ACCESS.map(q => (
        <Link key={q.to} href={q.to}>
          <div className="bm-quick-hover" style={{ position:"relative", borderRadius:20, overflow:"hidden", aspectRatio:"1/0.9", boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.35)" : "0 6px 20px rgba(0,0,0,0.1)" }}>
            <img src={q.img} alt={q.label} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.2) 50%,transparent 100%)" }} />
            <div style={{ position:"absolute", top:9, left:9, width:9, height:9, borderRadius:"50%", background:q.color, boxShadow:`0 0 10px ${q.color}80` }} />
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"9px 11px" }}>
              <p style={{ margin:0, fontSize:11, fontWeight:800, color:"white", lineHeight:1.2, textShadow:"0 1px 4px rgba(0,0,0,0.5)" }}>{q.emoji} {q.label}</p>
              <p style={{ margin:"2px 0 0", fontSize:9, color:"rgba(255,255,255,0.7)", fontWeight:500 }}>{q.sub}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── StreakLevelCard ──────────────────────────────────────────────────────────
function StreakLevelCard({ streak, shieldActive, levelData, isDark }: any) {
  return (
    <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "white", borderRadius:20, padding:"18px 20px", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f3f4f6" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <p style={{ margin:0, fontSize:11, fontWeight:800, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em" }}>Mi Progreso</p>
        <Link href="/app/health-hub"><span style={{ fontSize:11, color:"#F97316", fontWeight:700 }}>Ver todo →</span></Link>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ textAlign:"center", position:"relative" }}>
          <div style={{ width:60, height:60, borderRadius:18, background: isDark ? "rgba(249,115,22,0.15)" : "#FFF7ED", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, border: isDark ? "1px solid rgba(249,115,22,0.25)" : "1px solid #FED7AA" }}>🔥</div>
          {shieldActive && <div style={{ position:"absolute", top:-4, right:-4, width:18, height:18, borderRadius:"50%", background:"#6366F1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9 }}>🛡️</div>}
          <div style={{ fontSize:22, fontWeight:900, color:"#F97316", lineHeight:1, marginTop:6, letterSpacing:"-0.03em" }}>{streak}</div>
          <div style={{ fontSize:10, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af", fontWeight:600 }}>días</div>
        </div>
        <div style={{ width:1, height:56, background: isDark ? "rgba(255,255,255,0.07)" : "#f3f4f6" }} />
        <div style={{ flex:1 }}>
          {levelData ? (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:800, color: isDark ? "white" : "#1a1a1a" }}>{levelData.currentLevel?.emoji} {levelData.currentLevel?.title}</span>
                <span style={{ fontSize:11, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>{levelData.totalPoints} pts</span>
              </div>
              <div style={{ height:6, borderRadius:99, background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${levelData.progressPct ?? 0}%`, background:"linear-gradient(90deg,#F97316,#FB923C)", borderRadius:99, transition:"width 0.7s ease" }} />
              </div>
              {levelData.nextLevel && <p style={{ margin:"6px 0 0", fontSize:10, color: isDark ? "rgba(255,255,255,0.35)" : "#9ca3af" }}>{levelData.progressPct}% hacia {levelData.nextLevel.title}</p>}
            </>
          ) : (
            <p style={{ margin:0, fontSize:13, color: isDark ? "rgba(255,255,255,0.3)" : "#d1d5db" }}>Cargando...</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RecipeOfDayCard ──────────────────────────────────────────────────────────
function RecipeOfDayCard({ recipe, isDark }: any) {
  if (!recipe) return null;
  return (
    <Link href={recipe.id ? `/app/recipes/${recipe.id}` : "/app/recipes"}>
      <div className="bm-card-hover" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "white", borderRadius:20, overflow:"hidden", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f3f4f6" }}>
        {recipe.imageUrl && (
          <div style={{ height:140, overflow:"hidden", position:"relative" }}>
            <img src={recipe.imageUrl} alt={recipe.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 60%)" }} />
            <div style={{ position:"absolute", top:10, left:10 }}>
              <span style={{ fontSize:10, fontWeight:800, background:"#F97316", color:"white", padding:"3px 10px", borderRadius:20, letterSpacing:"0.04em" }}>RECETA DEL DÍA</span>
            </div>
          </div>
        )}
        <div style={{ padding:"14px 16px" }}>
          <p style={{ margin:0, fontSize:14, fontWeight:800, color: isDark ? "white" : "#1a1a1a", lineHeight:1.3 }}>{recipe.name}</p>
          <div style={{ display:"flex", gap:12, marginTop:6 }}>
            <span style={{ fontSize:12, color: isDark ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>🔥 {recipe.calories ?? "–"} kcal</span>
            {recipe.prepTime && <span style={{ fontSize:12, color: isDark ? "rgba(255,255,255,0.5)" : "#9ca3af" }}>⏱ {recipe.prepTime} min</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── RecommendedRecipes ───────────────────────────────────────────────────────
function RecommendedRecipes({ recipes, isDark }: any) {
  if (!recipes?.length) return null;
  return (
    <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "white", borderRadius:20, padding:"18px 20px", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f3f4f6" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <p style={{ margin:0, fontSize:13, fontWeight:800, color: isDark ? "white" : "#1a1a1a" }}>✨ Para ti hoy</p>
        <Link href="/app/recipes"><span style={{ fontSize:11, color:"#F97316", fontWeight:700 }}>Ver todas →</span></Link>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {recipes.slice(0,3).map((r: any) => (
          <Link key={r.id} href={`/app/recipes/${r.id}`}>
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:14, background: isDark ? "rgba(249,115,22,0.07)" : "#FFF7ED", border: isDark ? "1px solid rgba(249,115,22,0.12)" : "1px solid rgba(249,115,22,0.1)", cursor:"pointer" }}>
              <img src={r.imageUrl || RECIPE_PLACEHOLDER_IMAGE} alt={r.name} style={{ width:46, height:46, borderRadius:12, objectFit:"cover", flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color: isDark ? "white" : "#1a1a1a", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.name}</p>
                <p style={{ margin:"3px 0 0", fontSize:11, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af" }}>🔥 {r.calories ?? "–"} kcal</p>
              </div>
              <span style={{ fontSize:16, color:"#F97316", flexShrink:0 }}>›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── CommunityCard ────────────────────────────────────────────────────────────
function CommunityCard({ isDark }: any) {
  return (
    <div style={{ background: isDark ? "rgba(255,255,255,0.04)" : "white", borderRadius:20, padding:"18px 20px", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f3f4f6" }}>
      <p style={{ margin:"0 0 14px", fontSize:11, fontWeight:800, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em" }}>Comunidad & Tienda</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {COMMUNITY.map(c => (
          <Link key={c.label} href={c.to}>
            <div style={{ textAlign:"center", cursor:"pointer" }}>
              <div style={{ width:44, height:44, borderRadius:14, background: isDark ? `${c.color}18` : `${c.color}12`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, margin:"0 auto 6px", border: isDark ? `1px solid ${c.color}30` : `1px solid ${c.color}20` }}>{c.emoji}</div>
              <p style={{ margin:0, fontSize:10, fontWeight:700, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight:1.2, textAlign:"center" }}>{c.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── PremiumBanner ────────────────────────────────────────────────────────────
function PremiumBanner() {
  return (
    <Link href="/app/subscription">
      <div className="bm-card-hover" style={{ background:"linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%)", borderRadius:20, padding:"18px 20px", boxShadow:"0 8px 24px rgba(99,102,241,0.35)" }}>
        <p style={{ margin:"0 0 4px", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.06em" }}>✨ Desbloquea Premium</p>
        <p style={{ margin:"0 0 12px", fontSize:15, fontWeight:800, color:"white" }}>Planes ilimitados, IA avanzada y más</p>
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.2)", borderRadius:12, padding:"6px 14px" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"white" }}>Ver planes →</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { expertMode } = useExpertMode();
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const bp = useBreakpoint();
  const isDesktop = bp === "desktop";
  const { isFree } = usePlan();

  // Inject animations once
  useEffect(() => {
    if (document.getElementById("bm-anim")) return;
    const s = document.createElement("style");
    s.id = "bm-anim"; s.textContent = ANIM_CSS;
    document.head.appendChild(s);
  }, []);

  const [today] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  });
  const [showGoalEdit, setShowGoalEdit] = useState(false);
  const [goalOverride, setGoalOverride] = useState<number|null>(null);

  // ── Queries ──
  const profileData      = trpc.profile.get.useQuery();
  const dailySummary     = trpc.mealLogs.dailySummary.useQuery({ date: today });
  const streakData       = trpc.mealLogs.getStreak.useQuery();
  const activeMenuData   = trpc.menus.getActive.useQuery();
  const levelInfo        = trpc.retention.getLevelInfo.useQuery();
  const streakShield     = trpc.retention.getStreakShield.useQuery();
  const contextualRecipe = trpc.retention.getDailyContextualRecipe.useQuery();
  const recommendedRecipes = trpc.recipes.list.useQuery(
    useMemo(() => ({ limit: 3, isPublic: true, isSeeded: true, excludeUserAllergens: true }), [])
  );

  // ── Derived values ──
  const profile     = profileData.data?.profile;
  const goalCal     = goalOverride ?? profile?.dailyCalorieGoal ?? 2000;
  const consumed    = dailySummary.data?.totalCalories ?? 0;
  const protein     = dailySummary.data?.proteins ?? 0;
  const carbs       = dailySummary.data?.carbohydrates ?? 0;
  const fat         = dailySummary.data?.fats ?? 0;
  const proteinGoal = Math.round((goalCal * 0.30) / 4);
  const carbsGoal   = Math.round((goalCal * 0.45) / 4);
  const fatGoal     = Math.round((goalCal * 0.25) / 9);
  const streak      = streakData.data?.currentStreak ?? 0;
  const userAvatar  = (profileData.data as any)?.user?.imageUrl || (user as any)?.imageUrl || null;
  const firstName   = user?.name?.split(" ")[0] || "Usuario";
  const allMacrosDone = protein >= proteinGoal && carbs >= carbsGoal && fat >= fatGoal && consumed > 0;

  // ── Confetti on macro completion ──
  const prevMacroRef = useRef(false);
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (allMacrosDone && !prevMacroRef.current && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      confetti({ origin: { y: 0.6 }, particleCount: 150, spread: 80, colors: ["#F97316","#6366F1","#10B981"] });
      toast.success("🎉 ¡Objetivos de macros completados!", { duration: 5000 });
    }
    prevMacroRef.current = allMacrosDone;
  }, [allMacrosDone]);

  // ── Subscription success toast ──
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("subscription") === "success") {
      toast.success("¡Suscripción activada! Bienvenido a Buddy One Premium.", { duration: 6000 });
      const u = new URL(window.location.href); u.searchParams.delete("subscription");
      window.history.replaceState({}, "", u.toString());
    }
  }, []);

  // ── Expert mode ──
  if (expertMode) {
    return (
      <Suspense fallback={<div style={{ padding:32, textAlign:"center", color:"#9ca3af" }}>Cargando panel profesional...</div>}>
        <BuddyExpertDashboard />
      </Suspense>
    );
  }

  // ── HERO ──
  const Hero = (
    <div className="bm-fade-up" style={{
      background: isDark
        ? "linear-gradient(135deg,rgba(249,115,22,0.14) 0%,rgba(99,102,241,0.1) 60%,rgba(16,185,129,0.06) 100%)"
        : "linear-gradient(135deg,#FFF9F5 0%,#FFF3E8 40%,#FFECD6 70%,#FEF9EE 100%)",
      borderRadius: isDesktop ? 32 : 24,
      padding: isDesktop ? "36px 40px" : "22px 18px",
      marginBottom: isDesktop ? 28 : 18,
      border: isDark ? "1px solid rgba(249,115,22,0.18)" : "1px solid rgba(249,115,22,0.15)",
      position: "relative", overflow: "hidden",
      boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.3)" : "0 8px 40px rgba(249,115,22,0.1), 0 1px 0 rgba(255,255,255,0.9) inset",
    }}>
      {/* Decorative blobs */}
      <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,rgba(249,115,22,0.18) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-60, left:-60, width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"40%", right:"30%", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 70%)", pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14, position:"relative" }}>
        <div style={{ display:"flex", alignItems:"center", gap: isDesktop ? 20 : 14 }}>
          <div style={{ width: isDesktop ? 68 : 52, height: isDesktop ? 68 : 52, borderRadius:"50%", background: userAvatar ? "transparent" : "linear-gradient(135deg,#F97316,#FB923C)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: isDesktop ? 26 : 22, fontWeight:900, color:"white", flexShrink:0, boxShadow:"0 6px 20px rgba(249,115,22,0.45)", overflow:"hidden", border:"3px solid rgba(255,255,255,0.6)" }}>
            {userAvatar ? <img src={userAvatar} alt={firstName} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ margin:0, fontSize: isDesktop ? 32 : 22, fontWeight:900, color: isDark ? "white" : "#111827", letterSpacing:"-0.04em", lineHeight:1.05 }}>
              {getGreeting(user?.name)} 👋
            </h1>
            <p style={{ margin:"6px 0 0", fontSize: isDesktop ? 14 : 12, color: isDark ? "rgba(255,255,255,0.5)" : "#9ca3af", fontWeight:500, display:"flex", alignItems:"center", gap:8 }}>
              {fmtDate(i18n.language)}
              {streak > 0 && <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"rgba(249,115,22,0.12)", borderRadius:99, padding:"2px 10px", color:"#EA580C", fontWeight:700, fontSize:12 }}>🔥 {streak} días en racha</span>}
            </p>
          </div>
        </div>
        <Link href="/app/health-hub">
          <div style={{ display:"flex", alignItems:"center", gap:8, background: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.85)", borderRadius:16, padding:"10px 18px", border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(249,115,22,0.18)", cursor:"pointer", boxShadow: isDark ? "none" : "0 4px 16px rgba(0,0,0,0.08)", backdropFilter:"blur(8px)" }}>
            <span style={{ fontSize:18 }}>💓</span>
            <span style={{ fontSize:14, fontWeight:800, color: isDark ? "white" : "#111827" }}>Health Hub</span>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E", boxShadow:"0 0 8px rgba(34,197,94,0.7)" }} />
          </div>
        </Link>
      </div>
      <div style={{ marginTop: isDesktop ? 22 : 16, position:"relative" }}>
        <WellnessStrip isDark={isDark} />
      </div>
    </div>
  );

  // ── DESKTOP layout ──
  if (isDesktop) {
    return (
      <div style={{ padding:"32px 40px 60px", background: isDark ? "#0a0f1e" : "#F7F5F2", minHeight:"100vh" }}>
        {Hero}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 400px", gap:24, alignItems:"start", maxWidth:1440, margin:"0 auto" }}>
          {/* LEFT */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div className="bm-fade-up-1"><CalorieRingCard consumed={consumed} goal={goalCal} protein={protein} carbs={carbs} fat={fat} proteinGoal={proteinGoal} carbsGoal={carbsGoal} fatGoal={fatGoal} isDark={isDark} showGoalEdit={showGoalEdit} setShowGoalEdit={setShowGoalEdit} setGoalOverride={setGoalOverride} /></div>
            <div className="bm-fade-up-2"><ActiveMenuCard menu={activeMenuData.data} isDark={isDark} /></div>
            <div className="bm-fade-up-3"><BuddyCoachBanner isDark={isDark} /></div>
            <div className="bm-fade-up-4"><RecommendedRecipes recipes={recommendedRecipes.data} isDark={isDark} /></div>
          </div>
          {/* RIGHT */}
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <div className="bm-fade-up-1" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "white", borderRadius:24, padding:"22px 24px", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f0ede8", boxShadow: isDark ? "none" : "0 4px 24px rgba(0,0,0,0.06)" }}>
              <p style={{ margin:"0 0 16px", fontSize:11, fontWeight:800, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em" }}>Accesos Rápidos</p>
              <QuickAccessGrid isDark={isDark} />
            </div>
            <div className="bm-fade-up-2"><StreakLevelCard streak={streak} shieldActive={streakShield.data?.hasShield} levelData={levelInfo.data} isDark={isDark} /></div>
            <div className="bm-fade-up-3"><RecipeOfDayCard recipe={contextualRecipe.data} isDark={isDark} /></div>
            <div className="bm-fade-up-4"><CommunityCard isDark={isDark} /></div>
            {isFree && <div className="bm-fade-up-5"><PremiumBanner /></div>}
          </div>
        </div>
      </div>
    );
  }

  // ── MOBILE layout ──
  return (
    <div style={{ padding:"14px 12px 100px", background: isDark ? "#0a0f1e" : "#F7F5F2", minHeight:"100vh" }}>
      {Hero}
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <div className="bm-fade-up-1"><CalorieRingCard consumed={consumed} goal={goalCal} protein={protein} carbs={carbs} fat={fat} proteinGoal={proteinGoal} carbsGoal={carbsGoal} fatGoal={fatGoal} isDark={isDark} showGoalEdit={showGoalEdit} setShowGoalEdit={setShowGoalEdit} setGoalOverride={setGoalOverride} /></div>
        <div className="bm-fade-up-2"><ActiveMenuCard menu={activeMenuData.data} isDark={isDark} /></div>
        <div className="bm-fade-up-2"><BuddyCoachBanner isDark={isDark} /></div>
        <div className="bm-fade-up-3" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "white", borderRadius:22, padding:"16px 16px 20px", border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f0ede8", boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.05)" }}>
          <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:800, color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em" }}>Accesos Rápidos</p>
          <QuickAccessGrid isDark={isDark} />
        </div>
        <div className="bm-fade-up-3"><StreakLevelCard streak={streak} shieldActive={streakShield.data?.hasShield} levelData={levelInfo.data} isDark={isDark} /></div>
        <div className="bm-fade-up-4"><RecipeOfDayCard recipe={contextualRecipe.data} isDark={isDark} /></div>
        <div className="bm-fade-up-4"><RecommendedRecipes recipes={recommendedRecipes.data} isDark={isDark} /></div>
        <div className="bm-fade-up-5"><CommunityCard isDark={isDark} /></div>
        {isFree && <div className="bm-fade-up-5"><PremiumBanner /></div>}
      </div>
    </div>
  );
}
