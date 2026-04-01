import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Link } from "wouter";
import { useState, useMemo } from "react";

const QUICK_ACCESS = [
  { emoji: "🛒", label: "Lista de\nCompra",  href: "/shopping-lists" },
  { emoji: "📅", label: "Menús",             href: "/menus" },
  { emoji: "🤖", label: "Buddy IA",          href: "/menus" },
  { emoji: "💪", label: "Objetivos",         href: "/profile" },
  { emoji: "📦", label: "Inventario",        href: "/inventory" },
  { emoji: "📊", label: "Evolución",         href: "/profile" },
];

const RECIPE_PHOTOS = [
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",
];

export default function Dashboard() {
  const { user } = useAuth();
  const [dayOffset, setDayOffset] = useState(0);

  const dateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split("T")[0];
  }, [dayOffset]);

  const { data: summary } = trpc.mealLogs.dailySummary.useQuery({ date: dateStr });
  const { data: recipes } = trpc.recipes.list.useQuery({ limit: 5, isPublic: true });
  const { data: inventoryData } = trpc.inventory.list.useQuery();

  const consumed = summary?.calories ?? 0;
  const goal = 2000;
  const remaining = Math.max(goal - consumed, 0);
  const protein = summary?.proteins ?? 0;
  const carbs = summary?.carbohydrates ?? 0;
  const fat = summary?.fats ?? 0;
  const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;

  const expiringCount = (inventoryData ?? []).filter((i) => {
    if (!(i as any).item?.expirationDate) return false;
    const diff = (new Date((i as any).item.expirationDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 3;
  }).length;

  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const firstName = user?.name?.split(" ")[0] ?? "Usuario";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const today = new Date();
  const dayNames = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const monthNames = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const dateLabel = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;

  return (
    <AppLayout>
      <div style={{ padding: "16px 16px 0" }}>
        {/* ── Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{
            width: "46px", height: "46px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #F97316, #FB923C)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 3px 12px rgba(249,115,22,0.35)",
          }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: "20px" }}>
              {user?.name?.charAt(0).toUpperCase() ?? "V"}
            </span>
          </div>
          <div style={{
            flex: 1, background: "white", borderRadius: "9999px",
            padding: "11px 18px", display: "flex", alignItems: "center", gap: "10px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)", border: "1.5px solid rgba(0,0,0,0.06)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{ fontSize: "14px", color: "#aaa" }}>Buscar en VIVELY</span>
          </div>
          <div style={{ position: "relative" }}>
            <button style={{
              width: "42px", height: "42px", borderRadius: "50%", background: "white",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {expiringCount > 0 && (
              <div style={{
                position: "absolute", top: "2px", right: "2px",
                width: "16px", height: "16px", borderRadius: "50%",
                background: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "9px", color: "white", fontWeight: 900 }}>{expiringCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Greeting */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "#F97316", fontWeight: 700, margin: "0 0 2px" }}>{dateLabel}</p>
          <h1 style={{ fontSize: "24px", fontWeight: 900, color: "#1a1a1a", margin: 0, letterSpacing: "-0.03em" }}>
            {greeting}, {firstName} 👋
          </h1>
        </div>

        {/* ── Calorie ring card */}
        <div style={{
          background: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)",
          borderRadius: "24px", padding: "20px", marginBottom: "16px",
          boxShadow: "0 8px 28px rgba(249,115,22,0.35)",
          display: "flex", alignItems: "center", gap: "16px",
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="10" />
              <circle cx="50" cy="50" r={r} fill="none" stroke="white" strokeWidth="10"
                strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dasharray 0.6s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "20px", fontWeight: 900, color: "white", lineHeight: 1 }}>{consumed.toFixed(0)}</span>
              <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>kcal</span>
            </div>
          </div>
          <div style={{ flex: 1, color: "white" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, margin: "0 0 4px", opacity: 0.85 }}>Calorías hoy</p>
            <p style={{ fontSize: "28px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.03em" }}>{remaining.toFixed(0)}</p>
            <p style={{ fontSize: "12px", opacity: 0.8, margin: 0 }}>restantes de {goal} kcal</p>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              {[{ label: "P", value: protein }, { label: "C", value: carbs }, { label: "G", value: fat }].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "14px", fontWeight: 900, color: "white", margin: 0 }}>{value.toFixed(0)}g</p>
                  <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.75)", margin: 0, fontWeight: 700 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
            <button onClick={() => setDayOffset((d) => d + 1)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
            </button>
            <button onClick={() => setDayOffset((d) => d - 1)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
            </button>
          </div>
        </div>

        {/* ── Quick access */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px", letterSpacing: "-0.02em" }}>Acceso rápido</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {QUICK_ACCESS.map(({ emoji, label, href }) => (
              <Link key={label} href={href}>
                <button style={{
                  width: "100%", background: "white", borderRadius: "18px", padding: "14px 8px",
                  border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "6px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}>
                  <span style={{ fontSize: "28px", lineHeight: 1 }}>{emoji}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#333", textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line" }}>{label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Add meal CTA */}
        <Link href="/meal-log">
          <button style={{
            width: "100%", background: "white", borderRadius: "18px", padding: "16px",
            border: "2px dashed #F97316", cursor: "pointer", display: "flex",
            alignItems: "center", gap: "12px", marginBottom: "20px",
          }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "14px",
              background: "linear-gradient(135deg, #F97316, #FB923C)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Registrar comida</p>
              <p style={{ fontSize: "12px", color: "#888", margin: "2px 0 0" }}>Añade lo que has comido hoy</p>
            </div>
          </button>
        </Link>

        {/* ── Recipes section */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#1a1a1a", margin: 0, letterSpacing: "-0.02em" }}>Recetas destacadas</h2>
            <Link href="/recipes"><span style={{ fontSize: "13px", fontWeight: 700, color: "#F97316", cursor: "pointer" }}>Ver todas →</span></Link>
          </div>
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none" }}>
            {(recipes ?? []).slice(0, 5).map((recipe, i) => (
              <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                <div style={{ flexShrink: 0, width: "140px", borderRadius: "18px", overflow: "hidden", background: "white", boxShadow: "0 3px 12px rgba(0,0,0,0.10)", cursor: "pointer" }}>
                  <div style={{ width: "100%", height: "100px", background: `url(${(recipe as any).imageUrl || RECIPE_PHOTOS[i % RECIPE_PHOTOS.length]}) center/cover`, position: "relative" }}>
                    {(recipe as any).caloriesPerServing && (
                      <div style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.6)", borderRadius: "8px", padding: "2px 6px" }}>
                        <span style={{ fontSize: "10px", color: "white", fontWeight: 700 }}>{(recipe as any).caloriesPerServing} kcal</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <p style={{ fontSize: "12px", fontWeight: 800, color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recipe.name}</p>
                    {(recipe as any).prepTime && <p style={{ fontSize: "10px", color: "#F97316", margin: "2px 0 0", fontWeight: 700 }}>⏱ {(recipe as any).prepTime} min</p>}
                  </div>
                </div>
              </Link>
            ))}
            {(!recipes || recipes.length === 0) && (
              <Link href="/recipes/new">
                <div style={{ flexShrink: 0, width: "140px", height: "160px", borderRadius: "18px", background: "white", border: "2px dashed #F97316", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                  <span style={{ fontSize: "32px" }}>➕</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#F97316" }}>Crear receta</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* ── Expiry alert */}
        {expiringCount > 0 && (
          <Link href="/inventory">
            <div style={{ background: "#FEF3C7", borderRadius: "18px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", border: "1px solid #FDE68A", cursor: "pointer" }}>
              <span style={{ fontSize: "24px" }}>⚠️</span>
              <div>
                <p style={{ fontSize: "13px", fontWeight: 800, color: "#92400E", margin: 0 }}>{expiringCount} producto{expiringCount > 1 ? "s" : ""} por caducar</p>
                <p style={{ fontSize: "11px", color: "#B45309", margin: "2px 0 0" }}>Revisa tu inventario</p>
              </div>
            </div>
          </Link>
        )}

        {/* ── Disclaimer */}
        <div className="vively-disclaimer" style={{ marginBottom: "16px" }}>
          <p style={{ margin: 0 }}>VIVELY no constituye asesoramiento nutricional profesional. Consulta a un nutricionista para recomendaciones personalizadas.</p>
        </div>
      </div>
    </AppLayout>
  );
}
