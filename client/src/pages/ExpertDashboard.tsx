import { useLocation, useSearch, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users, MessageSquare, Calendar, FileText, ChevronRight,
  Search, Video, Bell, ShieldCheck, UserPlus, CalendarPlus, Scan,
  Package, ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string | null) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function isToday(date: Date | string | null) {
  if (!date) return false;
  return new Date(date).toDateString() === new Date().toDateString();
}

function getAdherence(patientId: number) {
  return Math.max(30, Math.min(95, (patientId * 37 + 13) % 100));
}

function AdherenceBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{pct}%</span>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: "🏠", label: "Profesional", path: "/app/expert/dashboard" },
  { icon: "📊", label: "Estadísticas", path: "/app/buddy-expert-stats" },
  { icon: "📋", label: "Mis Planes", path: "/app/expert/plans" },
  { icon: "👥", label: "Mis Pacientes", path: "/app/expert/patients" },
  { icon: "💬", label: "Chat con Pacientes", path: "/app/expert/messages" },
  { icon: "🤖", label: "BuddyIA Profesional", path: "/app/expert/ai" },
  { icon: "👤", label: "Mi Perfil", path: "/app/buddy-expert-dashboard" },
  { icon: "❓", label: "Soporte", path: "/app/support" },
];

function Sidebar({ user }: { user: any }) {
  const [location] = useLocation();
  return (
    <div style={{
      width: 220, minHeight: "100vh", background: "#fff",
      borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid #f5f5f5" }}>
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#F97316,#FB923C)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 17 }}>🥗</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#111827" }}>BuddyMarket</span>
          </div>
        </Link>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF7ED", borderRadius: 10, padding: "7px 11px", border: "1px solid #FED7AA" }}>
          <span style={{ fontSize: 15 }}>🎓</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#F97316", flex: 1 }}>Profesional</span>
          <ChevronDown size={13} color="#F97316" />
        </div>
      </div>
      <nav style={{ flex: 1, padding: "2px 8px" }}>
        {NAV_ITEMS.map(item => {
          const active = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div style={{
                display: "flex", alignItems: "center", gap: 9, padding: "9px 11px",
                borderRadius: 10, marginBottom: 1, cursor: "pointer",
                background: active ? "#FFF7ED" : "transparent",
                color: active ? "#F97316" : "#374151",
                fontWeight: active ? 700 : 500, fontSize: 13,
              }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
      <div style={{ padding: "8px 8px 16px" }}>
        <Link href="/admin">
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 10, cursor: "pointer", color: "#6b7280", fontSize: 13, fontWeight: 500 }}>
            <ShieldCheck size={15} />
            <span>Administración</span>
          </div>
        </Link>
      </div>
      {user && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 9 }}>
          {user.imageUrl ? (
            <img src={user.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>
              {getInitials(user.name)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#9ca3af" }}>BuddyExpert</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ count, label, sublabel, bg, linkLabel, linkHref }: {
  count: number | string; label: string; sublabel?: string;
  bg: string; linkLabel: string; linkHref: string;
}) {
  const [, navigate] = useLocation();
  return (
    <div
      onClick={() => navigate(linkHref)}
      style={{ background: bg, borderRadius: 18, padding: "18px 20px", flex: 1, minWidth: 0, cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{count}</span>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fff" }}>{label}</p>
          {sublabel && <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>{sublabel}</p>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.85)" }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{linkLabel}</span>
        <ArrowRight size={13} />
      </div>
    </div>
  );
}

// ─── Patient Row ──────────────────────────────────────────────────────────────
function PatientRow({ patient, onNavigate }: { patient: any; onNavigate: (p: string) => void }) {
  const adherence = getAdherence(patient.id);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f9fafb" }}>
      {patient.user?.imageUrl ? (
        <img src={patient.user.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#FB923C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {getInitials(patient.user?.name)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{patient.user?.name ?? "Paciente"}</p>
        <AdherenceBar pct={adherence} />
      </div>
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button onClick={() => onNavigate(`/app/expert/patients/${patient.id}`)}
          style={{ padding: "4px 9px", borderRadius: 7, background: "#F97316", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          Plan
        </button>
        <button onClick={() => onNavigate(`/app/expert/messages?patient=${patient.id}`)}
          style={{ padding: "4px 9px", borderRadius: 7, background: "#1e3a5f", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          Chat
        </button>
      </div>
    </div>
  );
}

// ─── Appointment Row ──────────────────────────────────────────────────────────
function AppointmentRow({ appt }: { appt: any }) {
  const isOnline = appt.appt?.modality === "online";
  const meetUrl = appt.appt?.googleMeetUrl || appt.appt?.meetingUrl;
  const startTime = appt.appt?.startTime;
  const title = appt.appt?.title ?? "Consulta";
  const patientName = appt.patientUser?.name ?? "Paciente";
  const minutesUntil = startTime ? Math.floor((new Date(startTime).getTime() - Date.now()) / 60000) : null;
  const imminent = minutesUntil !== null && minutesUntil >= 0 && minutesUntil <= 30;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f9fafb" }}>
      {appt.patientUser?.imageUrl ? (
        <img src={appt.patientUser.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f46e5", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          {getInitials(patientName)}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
          {patientName} <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 12 }}>({title})</span>
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{isOnline ? "🎥 Online" : "📍 Presencial"}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <span style={{ background: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: 12, padding: "2px 7px", borderRadius: 7 }}>
          {formatTime(startTime)}
        </span>
        {isOnline && meetUrl && (
          <button
            onClick={() => window.open(meetUrl, "_blank")}
            style={{
              display: "flex", alignItems: "center", gap: 3, padding: "3px 8px",
              borderRadius: 7, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700,
              background: imminent ? "#22c55e" : "#3b82f6", color: "#fff",
              animation: imminent ? "pulse 1.5s infinite" : "none",
            }}
          >
            <Video size={10} /> Unirse
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Quick Action ─────────────────────────────────────────────────────────────
function QuickAction({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      width: "100%", padding: "11px 14px", borderRadius: 12, border: "none",
      background: color, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13,
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)", marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>{icon}<span>{label}</span></div>
      <ChevronRight size={15} />
    </button>
  );
}

// ─── Progress Chart ───────────────────────────────────────────────────────────
function ProgressChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 12 }}>
        Sin datos de progreso aún
      </div>
    );
  }
  const chartData = data
    .map((d: any) => ({
      date: new Date(d.progress?.recordedAt ?? Date.now()).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      peso: d.progress?.weight ?? null,
      adherencia: getAdherence(d.progress?.patientUserId ?? 1),
    }))
    .filter((d: any) => d.peso != null);

  return (
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={chartData} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9ca3af" }} />
        <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} />
        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
        <Line type="monotone" dataKey="peso" stroke="#F97316" strokeWidth={2} dot={false} name="Peso (kg)" />
        <Line type="monotone" dataKey="adherencia" stroke="#14b8a6" strokeWidth={2} dot={false} name="Adherencia %" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExpertDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const [patientSearch, setPatientSearch] = useState("");
  const [showAllPatients, setShowAllPatients] = useState(false);

  const { data, isLoading } = trpc.expertPatients.getExpertDashboardStats.useQuery(undefined, {
    enabled: !!user, refetchInterval: 60000,
  });
  const { data: gcalStatus, refetch: refetchGcal } = trpc.expertPatients.getGoogleCalendarStatus.useQuery(undefined, {
    enabled: !!user && (user.role === "buddyexpert" || user.role === "admin"), staleTime: 30000,
  });
  const { data: gcalAuthData } = trpc.expertPatients.getGoogleCalendarAuthUrl.useQuery(
    { origin: typeof window !== "undefined" ? window.location.origin : "" },
    { enabled: !!user && (user.role === "buddyexpert" || user.role === "admin") && gcalStatus?.connected === false, staleTime: 60000 }
  );
  const { data: allPatientsData } = trpc.expertPatients.getPatients.useQuery(
    { status: "all", search: patientSearch },
    { enabled: !!user }
  );
  const { data: blogData } = trpc.blog.list.useQuery({ limit: 2 }, { staleTime: 300000 });

  const disconnectGcal = trpc.expertPatients.disconnectGoogleCalendar.useMutation({
    onSuccess: () => { refetchGcal(); toast.success("Google Calendar desconectado"); },
  });

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("gcal_connected") === "1") {
      toast.success("✅ Google Calendar conectado");
      refetchGcal();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("gcal_error")) {
      toast.error(`Error al conectar Google Calendar: ${params.get("gcal_error")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [search]);

  const stats = data?.stats;
  const upcomingAppointments = data?.upcomingAppointments ?? [];
  const recentPatients = data?.recentPatients ?? [];
  const recentProgress = data?.recentProgress ?? [];
  const expertProfile = data?.expertProfile;

  const todayAppts = useMemo(() =>
    upcomingAppointments.filter(a => isToday((a as any).appt?.startTime)),
    [upcomingAppointments]
  );

  const displayedPatients = useMemo(() => {
    const list: any[] = allPatientsData ?? recentPatients;
    const filtered = patientSearch
      ? list.filter(p => (p.user?.name ?? "").toLowerCase().includes(patientSearch.toLowerCase()))
      : list;
    return showAllPatients ? filtered : filtered.slice(0, 4);
  }, [allPatientsData, recentPatients, patientSearch, showAllPatients]);

  const totalPatientCount = (allPatientsData ?? recentPatients).length;

  if (!user) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fb", fontFamily: "'Inter','Plus Jakarta Sans',sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}*{box-sizing:border-box}`}</style>

      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "auto" }}>

        {/* Topbar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #f0f0f0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
              Hola {expertProfile?.displayName ?? user.name?.split(" ")[0] ?? "Dr/a"} 👋
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", marginTop: 2, textTransform: "capitalize" }}>
              {formatDate(new Date())}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {gcalStatus?.connected ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "5px 10px", fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                <span>📅</span><span>Calendar</span><span style={{ color: "#22c55e" }}>●</span>
              </div>
            ) : gcalAuthData?.url ? (
              <button
                onClick={() => window.location.href = gcalAuthData.url}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 9, padding: "5px 10px", fontSize: 11, color: "#374151", fontWeight: 600, cursor: "pointer" }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: 13, height: 13 }} />
                Conectar Calendar
              </button>
            ) : null}
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => navigate("/app/notifications")}>
              <Bell size={19} color="#6b7280" />
              {(stats?.unreadMessages ?? 0) > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 13, height: 13, background: "#ef4444", borderRadius: "50%", fontSize: 8, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  {(stats?.unreadMessages ?? 0) > 9 ? "9+" : stats?.unreadMessages}
                </span>
              )}
            </div>
            {user.imageUrl ? (
              <img src={user.imageUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", cursor: "pointer", border: "2px solid #f0f0f0" }} onClick={() => navigate("/app/buddy-expert-dashboard")} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }} onClick={() => navigate("/app/buddy-expert-dashboard")}>
                {getInitials(user.name)}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>

          {/* ── Left ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* KPIs */}
            <div style={{ display: "flex", gap: 14 }}>
              <KpiCard
                count={stats?.activePatients ?? (isLoading ? "…" : 0)}
                label="Planes en curso"
                sublabel={`${stats?.totalPatients ?? 0} pacientes`}
                bg="linear-gradient(135deg,#F97316,#FB923C)"
                linkLabel="Ver planes"
                linkHref="/app/expert/plans"
              />
              <KpiCard
                count={stats?.unreadMessages ?? (isLoading ? "…" : 0)}
                label="Mensajes"
                sublabel="nuevos"
                bg="linear-gradient(135deg,#1e3a5f,#2d5282)"
                linkLabel="Responder mensajes"
                linkHref="/app/expert/messages"
              />
              <KpiCard
                count={stats?.todayAppointments ?? (isLoading ? "…" : 0)}
                label="Citas hoy"
                sublabel={`${stats?.upcomingAppointmentsWeek ?? 0} esta semana`}
                bg="linear-gradient(135deg,#0d9488,#14b8a6)"
                linkLabel="Paciente(s) de ping…"
                linkHref="/app/expert/patients"
              />
            </div>

            {/* Patients + Appointments */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

              {/* Patients */}
              <div style={{ background: "#fff", borderRadius: 18, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Pacientes</h3>
                  <Link href="/app/expert/patients">
                    <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver todos &gt;</span>
                  </Link>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#f9fafb", borderRadius: 9, padding: "7px 11px", marginBottom: 10, border: "1px solid #f0f0f0" }}>
                  <Search size={13} color="#9ca3af" />
                  <input
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Buscar..."
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", flex: 1 }}
                  />
                </div>
                {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} style={{ height: 44, background: "#f3f4f6", borderRadius: 9, marginBottom: 8, animation: "pulse 1.5s infinite" }} />)
                ) : displayedPatients.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 12 }}>
                    <Users size={28} style={{ margin: "0 auto 6px", display: "block", opacity: 0.4 }} />
                    {patientSearch ? "Sin resultados" : "Aún no tienes pacientes"}
                  </div>
                ) : (
                  displayedPatients.map((p: any) => <PatientRow key={p.id} patient={p} onNavigate={navigate} />)
                )}
                {totalPatientCount > 4 && (
                  <button
                    onClick={() => setShowAllPatients(!showAllPatients)}
                    style={{ display: "flex", alignItems: "center", gap: 5, margin: "8px auto 0", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 9, padding: "7px 14px", fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 600 }}
                  >
                    {showAllPatients ? <><ChevronUp size={13} /> Ver menos</> : <><ChevronDown size={13} /> Ver más</>}
                  </button>
                )}
              </div>

              {/* Appointments */}
              <div style={{ background: "#fff", borderRadius: 18, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Recordatorio de citas</h3>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{formatDate(new Date())}</p>
                </div>
                {isLoading ? (
                  [1, 2, 3].map(i => <div key={i} style={{ height: 48, background: "#f3f4f6", borderRadius: 9, marginBottom: 8, animation: "pulse 1.5s infinite" }} />)
                ) : todayAppts.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#9ca3af", fontSize: 12 }}>
                    <Calendar size={28} style={{ margin: "0 auto 6px", display: "block", opacity: 0.4 }} />
                    No hay citas para hoy
                  </div>
                ) : (
                  todayAppts.map((a: any) => <AppointmentRow key={a.appt?.id} appt={a} />)
                )}
                <button
                  onClick={() => navigate("/app/expert/appointments")}
                  style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 9, padding: "7px 12px", fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 600 }}
                >
                  <Calendar size={13} /> Ver calendario
                </button>
              </div>
            </div>

            {/* Content + Progress */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

              {/* Featured content */}
              <div style={{ background: "#fff", borderRadius: 18, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Contenido destacado</h3>
                  <Link href="/app/blog">
                    <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver más &gt;</span>
                  </Link>
                </div>
                {(blogData?.posts && blogData.posts.length > 0 ? blogData.posts : [
                  { id: 1, title: "Descubre las mejores fuentes de proteínas vegetales", readTimeMinutes: 3, category: "9 consejos", coverImageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&q=80", expertName: "Eliana Gómez", expertAvatar: null },
                  { id: 2, title: "5 alimentos que ayudan a mejorar el metabolismo", readTimeMinutes: 24, category: "8 alimentos", coverImageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=120&q=80", expertName: "Eliana Gómez", expertAvatar: null },
                ]).map((post: any) => (
                  <div key={post.id} style={{ display: "flex", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #f9fafb" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                        {post.expertAvatar ? (
                          <img src={post.expertAvatar} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#F97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>
                            {getInitials(post.expertName)}
                          </div>
                        )}
                        <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>{post.expertName ?? "BuddyExpert"}</span>
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>· {post.readTimeMinutes}h</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>
                        {post.title}
                      </p>
                      <p style={{ margin: "3px 0 0", fontSize: 10, color: "#9ca3af" }}>{post.category} · {post.readTimeMinutes}h</p>
                    </div>
                    {post.coverImageUrl && (
                      <img src={post.coverImageUrl} alt="" style={{ width: 56, height: 56, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Progress chart */}
              <div style={{ background: "#fff", borderRadius: 18, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Accesos rápidos</h3>
                  <Link href="/app/expert/patients">
                    <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver más &gt;</span>
                  </Link>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                  Progreso Pacientes <span style={{ color: "#9ca3af", fontWeight: 400 }}>Último mes</span>
                </p>
                <ProgressChart data={recentProgress} />
                <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316", display: "inline-block" }} />Peso
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6", display: "inline-block" }} />Adherencia
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Quick actions */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#111827" }}>Tareas rápidas</h3>
              <QuickAction icon={<FileText size={15} />} label="Crear Plan" color="linear-gradient(135deg,#F97316,#FB923C)" onClick={() => navigate("/app/expert/plans")} />
              <QuickAction icon={<UserPlus size={15} />} label="Agregar Paciente" color="linear-gradient(135deg,#16a34a,#22c55e)" onClick={() => navigate("/app/expert/patients")} />
              <QuickAction icon={<CalendarPlus size={15} />} label="Agendar Cita" color="linear-gradient(135deg,#0d9488,#14b8a6)" onClick={() => navigate("/app/expert/appointments")} />
            </div>

            {/* Stats */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Estadísticas</h3>
                <Link href="/app/buddy-expert-stats">
                  <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver más &gt;</span>
                </Link>
              </div>
              <div onClick={() => navigate("/app/inventory")} style={{ borderRadius: 11, overflow: "hidden", marginBottom: 9, cursor: "pointer", position: "relative", height: 76 }}>
                <img src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(249,115,22,0.87),rgba(251,146,60,0.72))", display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Package size={14} color="#fff" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Inventario</span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.9)" }}>Accede a la lista de propiedades nutricionales.</p>
                </div>
              </div>
              <div onClick={() => navigate("/app/scan")} style={{ borderRadius: 11, overflow: "hidden", cursor: "pointer", position: "relative", height: 76 }}>
                <img src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(79,70,229,0.87),rgba(109,40,217,0.72))", display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Scan size={14} color="#fff" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>BuddyScan IA</span>
                  </div>
                  <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.9)" }}>Escanea productos para obtener información nutricional.</p>
                </div>
              </div>
            </div>

            {/* BuddyScan IA featured */}
            <div style={{ background: "#fff", borderRadius: 18, padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#111827" }}>BuddyScan IA</h3>
              <div style={{ borderRadius: 11, overflow: "hidden", marginBottom: 10 }}>
                <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80" alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827" }}>5 alimentos que ayudan a mejorar el metabolismo</p>
              <p style={{ margin: "3px 0 10px", fontSize: 11, color: "#9ca3af" }}>8 alimentos · 24h</p>
              <button
                onClick={() => navigate("/app/scan")}
                style={{ width: "100%", padding: "9px", borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
              >
                <Scan size={13} /> Abrir BuddyScan
              </button>
            </div>

            {/* Google Calendar disconnect */}
            {gcalStatus?.connected && (
              <div style={{ background: "#f0fdf4", borderRadius: 13, padding: "12px 14px", border: "1px solid #bbf7d0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <span style={{ fontSize: 15 }}>📅</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>Google Calendar activo</span>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#166534" }}>{gcalStatus.email}</p>
                <button onClick={() => disconnectGcal.mutate()} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: 0 }}>
                  Desconectar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
