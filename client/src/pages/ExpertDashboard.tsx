// @ts-nocheck
import { useLocation, useSearch, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ChevronRight, Search, Video, Bell, UserPlus, CalendarPlus,
  FileText, Package, Scan, Calendar, Mail, MessageSquare,
  AlertTriangle, CheckCircle, Clock, TrendingUp, Users,
  Zap, BookOpen, BarChart2, Star, Settings, ArrowRight,
  Activity, DollarSign, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name?: string | null) =>
  name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

const fmtTime = (d: Date | string | null) =>
  d ? new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "";

const fmtDateShort = (d: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }) : "";

const isToday = (d: Date | string | null) =>
  d ? new Date(d).toDateString() === new Date().toDateString() : false;

const isTomorrow = (d: Date | string | null) => {
  if (!d) return false;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  return new Date(d).toDateString() === tomorrow.toDateString();
};

const minsUntil = (d: Date | string | null) =>
  d ? Math.floor((new Date(d).getTime() - Date.now()) / 60000) : null;

// ─── Componentes pequeños ─────────────────────────────────────────────────────

function Avatar({ name, img, size = 36 }: { name?: string | null; img?: string | null; size?: number }) {
  if (img) return <img src={img} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#FB923C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: size * 0.35, flexShrink: 0 }}>
      {getInitials(name)}
    </div>
  );
}

function Badge({ children, color = "orange" }: { children: React.ReactNode; color?: "orange" | "red" | "green" | "blue" | "gray" | "amber" }) {
  const colors = {
    orange: { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
    red: { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
    green: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
    blue: { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE" },
    gray: { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
    amber: { bg: "#FFFBEB", text: "#D97706", border: "#FDE68A" },
  };
  const c = colors[color];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

// ─── Sección: Agenda del día ──────────────────────────────────────────────────
function AgendaSection({ todayAppts, upcomingAppts, nav }: { todayAppts: any[]; upcomingAppts: any[]; nav: (p: string) => void }) {
  const now = new Date();
  const todayDate = now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>📅 Agenda de hoy</h3>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9CA3AF", textTransform: "capitalize" }}>{todayDate}</p>
        </div>
        <button onClick={() => nav("/app/expert/appointments")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#F97316", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
          Ver todo <ChevronRight size={13} />
        </button>
      </div>

      {todayAppts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF" }}>
          <Calendar size={28} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Sin citas hoy</p>
          <button onClick={() => nav("/app/expert/appointments")} style={{ marginTop: 10, fontSize: 12, color: "#F97316", background: "none", border: "1px solid #FED7AA", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 600 }}>
            + Agendar cita
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {todayAppts.map((appt: any) => {
            const mins = minsUntil(appt.startTime);
            const isNow = mins !== null && mins >= -30 && mins <= 30;
            const isPast = mins !== null && mins < -30;
            return (
              <div key={appt.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 12, background: isNow ? "#FFF7ED" : isPast ? "#F9FAFB" : "#F8FAFF",
                border: `1px solid ${isNow ? "#FED7AA" : isPast ? "#F3F4F6" : "#E0E7FF"}`,
              }}>
                <Avatar name={appt.patientName} img={appt.patientImage} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {appt.patientName ?? "Paciente"}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "#6B7280" }}>{appt.title ?? "Consulta"}</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isNow ? "#EA580C" : isPast ? "#9CA3AF" : "#374151" }}>
                    {fmtTime(appt.startTime)}
                  </span>
                  {isNow && appt.modality === "online" && appt.meetingUrl && (
                    <button onClick={() => window.open(appt.meetingUrl, "_blank")} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700, background: "#22C55E", color: "#fff" }}>
                      <Video size={9} /> Unirse
                    </button>
                  )}
                  {isNow && <Badge color="orange">Ahora</Badge>}
                  {isPast && <Badge color="gray">Pasada</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Próximas citas (no hoy) */}
      {upcomingAppts.filter(a => !isToday(a.startTime)).slice(0, 2).length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F3F4F6" }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>Próximas</p>
          {upcomingAppts.filter(a => !isToday(a.startTime)).slice(0, 2).map((appt: any) => (
            <div key={appt.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F9FAFB" }}>
              <Avatar name={appt.patientName} img={appt.patientImage} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appt.patientName ?? "Paciente"}</p>
              </div>
              <span style={{ fontSize: 11, color: "#6B7280", flexShrink: 0 }}>
                {isTomorrow(appt.startTime) ? "Mañana" : fmtDateShort(appt.startTime)} · {fmtTime(appt.startTime)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sección: Pacientes que necesitan atención ────────────────────────────────
function AttentionSection({ alerts, nav }: { alerts: any; nav: (p: string) => void }) {
  const items = alerts?.patientsWithoutCheckin ?? [];
  if (!alerts?.hasAlerts && items.length === 0) return null;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #FEE2E2" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AlertTriangle size={16} color="#DC2626" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Requieren atención</h3>
          <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>Pacientes sin actividad en +7 días</p>
        </div>
        <Badge color="red">{items.length}</Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((p: any, i: number) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <Avatar name={p.patientName} img={p.patientImage} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{p.patientName ?? "Paciente"}</p>
              <p style={{ margin: "1px 0 0", fontSize: 11, color: "#DC2626" }}>Sin check-in · {p.lastActivity ? `Última actividad: ${fmtDateShort(p.lastActivity)}` : "Sin actividad reciente"}</p>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              <button
                onClick={() => {
                  const phone = p.patientPhone;
                  const msg = `Hola ${p.patientName?.split(" ")[0] ?? ""}! 👋 Te escribo para saber cómo llevas el plan nutricional esta semana. ¿Todo bien?`;
                  window.open(`https://wa.me/${phone ? phone.replace(/\D/g, "") : ""}?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                style={{ padding: "4px 8px", borderRadius: 7, background: "#25D366", color: "#fff", border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                title="Contactar por WhatsApp"
              >
                WhatsApp
              </button>
              <button onClick={() => nav(`/app/expert/patients/${p.patientUserId}`)} style={{ padding: "4px 8px", borderRadius: 7, background: "#F97316", color: "#fff", border: "none", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                Ver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sección: Pacientes activos ────────────────────────────────────────────────
function PatientsSection({ patients, nav }: { patients: any[]; nav: (p: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = q ? patients.filter(p => (p.patientName ?? "").toLowerCase().includes(q.toLowerCase())) : patients;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>👥 Pacientes activos</h3>
        <button onClick={() => nav("/app/expert/patients")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#F97316", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
          Ver todos <ChevronRight size={13} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F9FAFB", borderRadius: 9, padding: "7px 11px", marginBottom: 12, border: "1px solid #F3F4F6" }}>
        <Search size={13} color="#9CA3AF" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar paciente..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", flex: 1 }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#9CA3AF" }}>
          <Users size={28} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
          <p style={{ margin: 0, fontSize: 13 }}>{q ? "Sin resultados" : "Aún no tienes pacientes activos"}</p>
          {!q && (
            <button onClick={() => nav("/app/expert/patients")} style={{ marginTop: 10, fontSize: 12, color: "#F97316", background: "none", border: "1px solid #FED7AA", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 600 }}>
              + Invitar paciente
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.slice(0, 5).map((p: any) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: "#F9FAFB", cursor: "pointer" }} onClick={() => nav(`/app/expert/patients/${p.id}`)}>
              <Avatar name={p.patientName} img={p.patientImage} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.patientName ?? "Paciente"}</p>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#9CA3AF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.mainGoal ? `🎯 ${p.mainGoal}` : p.weight ? `⚖️ ${p.weight} kg` : "Sin objetivo definido"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                <button onClick={e => { e.stopPropagation(); nav(`/app/expert/patients/${p.id}`); }} style={{ padding: "4px 10px", borderRadius: 7, background: "#F97316", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Plan</button>
                <button onClick={e => { e.stopPropagation(); nav(`/app/expert/messages?patient=${p.id}`); }} style={{ padding: "4px 10px", borderRadius: 7, background: "#1B2B4B", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chat</button>
              </div>
            </div>
          ))}
          {filtered.length > 5 && (
            <button onClick={() => nav("/app/expert/patients")} style={{ width: "100%", padding: "8px", borderRadius: 9, background: "#F9FAFB", border: "1px solid #E5E7EB", fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 600 }}>
              Ver {filtered.length - 5} más →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sección: Acciones de trabajo ─────────────────────────────────────────────
function WorkActionsSection({ nav }: { nav: (p: string) => void }) {
  // Solo acciones de FLUJO DE TRABAJO que no están en el sidebar
  // El sidebar ya tiene: Pacientes, Chat, Alertas, Tendencias, Plan IA, Video, Disponibilidad, Reseñas, etc.
  const actions = [
    {
      icon: "🤖",
      label: "Generar menú semanal con IA",
      desc: "Describe el objetivo → la IA crea el menú completo",
      href: "/app/expert/menu-templates",
      bg: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
      hot: true,
    },
    {
      icon: "📋",
      label: "Asignar plan a paciente",
      desc: "Elige plan base → IA lo adapta al paciente",
      href: "/app/expert/plan-library",
      bg: "linear-gradient(135deg,#F97316,#EA580C)",
      hot: true,
    },
    {
      icon: "📲",
      label: "Enviar recordatorio WhatsApp",
      desc: "Mensaje rápido a paciente sin check-in",
      href: "/app/expert/patients",
      bg: "linear-gradient(135deg,#25D366,#128C7E)",
    },
    {
      icon: "🩺",
      label: "Análisis de analítica",
      desc: "Sube analítica y obtén informe nutricional",
      href: "/app/blood-test",
      bg: "linear-gradient(135deg,#EF4444,#DC2626)",
    },
    {
      icon: "🔄",
      label: "Sustituciones de alimentos",
      desc: "Encuentra equivalentes para un alimento",
      href: "/app/expert/food-substitutions",
      bg: "linear-gradient(135deg,#0891B2,#0E7490)",
    },
    {
      icon: "💰",
      label: "Crear pack de venta",
      desc: "Operación bikini, detox, etc. con precio",
      href: "/app/expert/session-packages",
      bg: "linear-gradient(135deg,#D97706,#B45309)",
    },
    {
      icon: "🏢",
      label: "Propuesta B2B Empresas",
      desc: "Servicios de nutrición para empresas",
      href: "/app/expert/b2b",
      bg: "linear-gradient(135deg,#1B2B4B,#243B6B)",
    },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800, color: "#111827" }}>⚡ Acciones rápidas</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {actions.map((a, i) => (
          <button key={i} onClick={() => nav(a.href)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "10px 12px", borderRadius: 10, border: "none",
            background: "#F9FAFB", cursor: "pointer", textAlign: "left",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
              {a.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>{a.label}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>{a.desc}</p>
            </div>
            {a.hot && <Badge color="orange">IA</Badge>}
            <ChevronRight size={13} color="#D1D5DB" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sección: KPIs de negocio ─────────────────────────────────────────────────
function KpiSection({ stats, earningsData, nav }: { stats: any; earningsData: any; nav: (p: string) => void }) {
  const kpis = [
    {
      icon: <Users size={18} color="#F97316" />,
      label: "Pacientes activos",
      value: stats?.activePatients ?? 0,
      sub: `+${stats?.newPatientsMonth ?? 0} este mes`,
      color: "#FFF7ED",
      border: "#FED7AA",
      href: "/app/expert/patients",
    },
    {
      icon: <MessageSquare size={18} color="#2563EB" />,
      label: "Mensajes sin leer",
      value: stats?.unreadMessages ?? 0,
      sub: stats?.unreadMessages > 0 ? "Responder ahora" : "Todo al día ✓",
      color: stats?.unreadMessages > 0 ? "#FEF2F2" : "#F0FDF4",
      border: stats?.unreadMessages > 0 ? "#FECACA" : "#BBF7D0",
      href: "/app/expert/messages",
      alert: (stats?.unreadMessages ?? 0) > 0,
    },
    {
      icon: <Calendar size={18} color="#2D9B8A" />,
      label: "Citas hoy",
      value: stats?.todayAppointmentsCount ?? 0,
      sub: "Ver agenda",
      color: "#F0FDFA",
      border: "#99F6E4",
      href: "/app/expert/appointments",
    },
    {
      icon: <Clock size={18} color="#D97706" />,
      label: "Invitaciones pendientes",
      value: stats?.pendingInvites ?? 0,
      sub: stats?.pendingInvites > 0 ? "Esperando respuesta" : "Sin pendientes",
      color: "#FFFBEB",
      border: "#FDE68A",
      href: "/app/expert/patients",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }} className="kpi-grid-2">
      <style>{`@media (max-width: 480px) { .kpi-grid-2 { grid-template-columns: 1fr 1fr !important; } }`}</style>
      {kpis.map((k, i) => (
        <div key={i} onClick={() => nav(k.href)} style={{
          background: k.color, borderRadius: 14, padding: "14px 16px",
          border: `1px solid ${k.border}`, cursor: "pointer",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {k.icon}
            </div>
            {k.alert && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />}
          </div>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{k.value}</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#374151" }}>{k.label}</p>
          <p style={{ margin: 0, fontSize: 10, color: "#6B7280" }}>{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Sección: Ingresos ────────────────────────────────────────────────────────
function RevenueSection({ earningsData, referralCode, nav }: { earningsData: any; referralCode: any; nav: (p: string) => void }) {
  const [codeCopied, setCodeCopied] = useState(false);
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      toast.success("Código copiado 📋");
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>💰 Ingresos</h3>
        <button onClick={() => nav("/app/buddy-expert-stats")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#F97316", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
          Ver todo <ChevronRight size={13} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <div style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ margin: "0 0 2px", fontSize: 10, color: "#16A34A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total cobrado</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#15803D" }}>
            {earningsData?.totalEarned ? `${(earningsData.totalEarned / 100).toFixed(2)}€` : "0,00€"}
          </p>
        </div>
        <div style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", borderRadius: 10, padding: "12px 14px" }}>
          <p style={{ margin: "0 0 2px", fontSize: 10, color: "#EA580C", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Referidos activos</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#C2410C" }}>
            {earningsData?.activeReferrals ?? 0}
          </p>
        </div>
      </div>

      {/* Código de referido */}
      {referralCode?.code && (
        <div style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", borderRadius: 12, padding: "12px 14px" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#4F46E5" }}>🎁 Tu código de referido</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{ flex: 1, fontSize: 15, fontWeight: 900, color: "#312E81", letterSpacing: 2, background: "rgba(255,255,255,0.6)", padding: "5px 10px", borderRadius: 8 }}>{referralCode.code}</code>
            <button onClick={() => copyCode(referralCode.code)} style={{ padding: "6px 12px", borderRadius: 8, background: codeCopied ? "#22C55E" : "#4F46E5", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {codeCopied ? "✓" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      <button onClick={() => nav("/app/expert/session-packages")} style={{ marginTop: 12, width: "100%", padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#F97316,#EA580C)", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Package size={14} /> Gestionar paquetes y servicios
      </button>
    </div>
  );
}

// ─── Checklist de activación ──────────────────────────────────────────────────
function ActivationChecklist({ data, gcalStatus, gcalAuthData, nav }: any) {
  const expertProf = data?.expertProfile;
  const stats = data?.stats;
  const steps = [
    { done: !!(expertProf?.specialty && expertProf?.bio), label: "Completa tu perfil profesional", action: () => nav("/app/buddy-expert-dashboard"), cta: "Completar" },
    { done: !!(expertProf?.availabilitySlots?.length || gcalStatus?.connected), label: "Configura tu disponibilidad", action: () => nav("/app/expert/availability"), cta: "Configurar" },
    { done: (stats?.activePatients ?? 0) > 0, label: "Consigue tu primer paciente", action: () => nav("/app/expert/patients"), cta: "Invitar" },
    { done: gcalStatus?.connected === true, label: "Conecta Google Calendar (opcional)", action: () => gcalAuthData?.url && (window.location.href = gcalAuthData.url), cta: "Conectar" },
  ];
  const allDone = steps.every(s => s.done);
  if (allDone) return null;
  const completedCount = steps.filter(s => s.done).length;

  return (
    <div style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", border: "1px solid #FED7AA", borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#92400E" }}>🚀 Activa tu perfil profesional</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#F97316", background: "#FFF", borderRadius: 20, padding: "2px 8px", border: "1px solid #FED7AA" }}>{completedCount}/{steps.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: step.done ? "#22C55E" : "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: step.done ? "#fff" : "#9CA3AF", flexShrink: 0, fontWeight: 700 }}>{step.done ? "✓" : i + 1}</span>
            <span style={{ flex: 1, fontSize: 12, color: step.done ? "#6B7280" : "#78350F", textDecoration: step.done ? "line-through" : "none" }}>{step.label}</span>
            {!step.done && (
              <button onClick={step.action} style={{ fontSize: 11, fontWeight: 700, color: "#F97316", background: "none", border: "1px solid #FED7AA", borderRadius: 8, padding: "2px 8px", cursor: "pointer" }}>{step.cta}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExpertDashboard() {
  const { user } = useAuth();
  const [, nav] = useLocation();
  const search = useSearch();

  // Usar el nuevo endpoint optimizado para el dashboard
  const { data: metrics, isLoading } = trpc.expertDashboard.getMetrics.useQuery(
    undefined, { enabled: !!user, refetchInterval: 60000 }
  );
  const { data: gcalStatus, refetch: refetchGcal } = trpc.expertPatients.getGoogleCalendarStatus.useQuery(
    undefined, { enabled: !!user, staleTime: 30000 }
  );
  const { data: gcalAuthData } = trpc.expertPatients.getGoogleCalendarAuthUrl.useQuery(
    { origin: typeof window !== "undefined" ? window.location.origin : "" },
    { enabled: !!user && gcalStatus?.connected === false, staleTime: 60000 }
  );
  const { data: referralCode, refetch: refetchReferral } = trpc.referrals.getMyCode.useQuery(
    { creatorType: "buddyexpert" }, { enabled: !!user, staleTime: 60000 }
  );
  const { data: earningsData } = trpc.referrals.getMyEarnings.useQuery(
    { limit: 5 }, { enabled: !!user, staleTime: 60000 }
  );
  const disconnectGcal = trpc.expertPatients.disconnectGoogleCalendar.useMutation({
    onSuccess: () => { refetchGcal(); toast.success("Google Calendar desconectado"); },
  });

  useEffect(() => {
    const p = new URLSearchParams(search);
    if (p.get("gcal_connected") === "1") {
      toast.success("✅ Google Calendar conectado");
      refetchGcal();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (p.get("gcal_error")) {
      toast.error(`Error al conectar Google Calendar: ${p.get("gcal_error")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [search]);

  const stats = metrics?.stats;
  const todayAppts = metrics?.todayAppointments ?? [];
  const upcomingAppts = metrics?.upcomingAppointments ?? [];
  const recentPatients = metrics?.recentPatients ?? [];
  const alerts = metrics?.alerts;

  if (!user) return null;

  const greeting = user.name?.split(" ").slice(0, 2).join(" ") ?? "Profesional";
  const hour = new Date().getHours();
  const greetingWord = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{ background: "#F5F0EB", minHeight: "100%", fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}} *{box-sizing:border-box}`}</style>

      {/* Header */}
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
            {greetingWord}, {greeting} 👋
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9CA3AF" }}>
            {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {gcalStatus?.connected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 9, padding: "4px 10px", fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
              <span>📅</span><span>Calendar ●</span>
              <button onClick={() => disconnectGcal.mutate()} style={{ fontSize: 10, color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600, marginLeft: 3, padding: 0 }}>✕</button>
            </div>
          ) : gcalAuthData?.url ? (
            <button onClick={() => window.location.href = gcalAuthData.url} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 9, padding: "4px 8px", fontSize: 10, color: "#374151", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: 11, height: 11 }} />
              Conectar Calendar
            </button>
          ) : null}
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => nav("/app/notifications")}>
            <Bell size={20} color="#6B7280" />
            {(stats?.unreadMessages ?? 0) > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, width: 13, height: 13, background: "#EF4444", borderRadius: "50%", fontSize: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {(stats?.unreadMessages ?? 0) > 9 ? "9+" : stats?.unreadMessages}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0 16px 24px" }}>

        {/* Checklist de activación */}
        {!isLoading && <ActivationChecklist data={metrics} gcalStatus={gcalStatus} gcalAuthData={gcalAuthData} nav={nav} />}

        {/* Layout: 2 columnas en desktop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }} className="expert-work-grid">
          <style>{`@media (max-width: 900px) { .expert-work-grid { grid-template-columns: 1fr !important; } }`}</style>

          {/* Columna izquierda: trabajo del día */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* KPIs */}
            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ height: 100, borderRadius: 14, background: "#E5E7EB", animation: "pulse 1.5s infinite" }} />)}
              </div>
            ) : (
              <KpiSection stats={stats} earningsData={earningsData} nav={nav} />
            )}

            {/* Alertas: pacientes que necesitan atención */}
            {!isLoading && alerts?.hasAlerts && (
              <AttentionSection alerts={alerts} nav={nav} />
            )}

            {/* Agenda del día */}
            {isLoading ? (
              <div style={{ height: 200, borderRadius: 16, background: "#E5E7EB", animation: "pulse 1.5s infinite" }} />
            ) : (
              <AgendaSection todayAppts={todayAppts} upcomingAppts={upcomingAppts} nav={nav} />
            )}

            {/* Pacientes activos */}
            {isLoading ? (
              <div style={{ height: 250, borderRadius: 16, background: "#E5E7EB", animation: "pulse 1.5s infinite" }} />
            ) : (
              <PatientsSection patients={recentPatients} nav={nav} />
            )}
          </div>

          {/* Columna derecha: acciones y negocio */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <WorkActionsSection nav={nav} />
            <RevenueSection earningsData={earningsData} referralCode={referralCode} nav={nav} />
          </div>
        </div>
      </div>
    </div>
  );
}
