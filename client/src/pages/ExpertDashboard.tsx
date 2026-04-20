import { useLocation, useSearch, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, ChevronUp, Search, Video,
  Bell, UserPlus, CalendarPlus, FileText,
  Package, Scan, Calendar, Mail,
  MessageSquare, Minus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name?: string | null) =>
  name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

const fmtTime = (d: Date | string | null) =>
  d ? new Date(d).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) : "";

const fmtDateLong = (d: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) : "";

const isToday = (d: Date | string | null) =>
  d ? new Date(d).toDateString() === new Date().toDateString() : false;

const getAdherence = (id: number) => Math.max(30, Math.min(95, (id * 37 + 13) % 100));

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const peso = payload.find((p: any) => p.dataKey === "peso");
  const adh = payload.find((p: any) => p.dataKey === "adherencia");
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "10px 14px", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 160,
    }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{label}</p>
      {peso?.value != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#374151" }}>Peso: <strong>{peso.value} kg</strong></span>
        </div>
      )}
      {adh?.value != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14b8a6", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#374151" }}>Adherencia: <strong>{adh.value}%</strong></span>
        </div>
      )}
      {payload[0]?.payload?.patientName && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "#9ca3af" }}>👤 {payload[0].payload.patientName}</p>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ count, title, subtitle, linkText, linkIcon, bg, href }: {
  count: number | string; title: string; subtitle?: string;
  linkText: string; linkIcon?: React.ReactNode; bg: string; href: string;
}) {
  const [, nav] = useLocation();
  return (
    <div onClick={() => nav(href)} style={{
      background: bg, borderRadius: 16, flex: 1, minWidth: 0,
      cursor: "pointer", overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "18px 18px 12px", display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 46, fontWeight: 900, color: "#fff", lineHeight: 1, flexShrink: 0 }}>{count}</span>
        <div style={{ paddingTop: 4 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>{title}</p>
          {subtitle && <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{subtitle}</p>}
        </div>
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "0 18px" }} />
      <div style={{ padding: "9px 18px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", flex: 1 }}>{linkText}</span>
        {linkIcon && <span style={{ color: "rgba(255,255,255,0.8)" }}>{linkIcon}</span>}
        <ChevronRight size={13} color="rgba(255,255,255,0.8)" />
      </div>
    </div>
  );
}

// ─── Patient Row ──────────────────────────────────────────────────────────────
function PatientRow({ patient, onNav }: { patient: any; onNav: (p: string) => void }) {
  const adh = getAdherence(patient.id);
  const adhColor = adh >= 70 ? "#F59E0B" : adh >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F9FAFB" }}>
      {patient.user?.imageUrl
        ? <img src={patient.user.imageUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#FB923C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{getInitials(patient.user?.name)}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{patient.user?.name ?? "Paciente"}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ flex: 1, height: 5, background: "#F3F4F6", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${adh}%`, height: "100%", background: adhColor, borderRadius: 99 }} />
          </div>
          <span
            title={`Adherencia al plan: ${adh}% — Porcentaje estimado de días que el paciente ha seguido el plan nutricional asignado. Se calcula a partir de los registros del diario alimenticio.`}
            style={{ fontSize: 11, fontWeight: 700, color: adhColor, minWidth: 30, cursor: "help", textDecoration: "underline dotted" }}
          >{adh}%</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        <button onClick={() => onNav(`/app/expert/patients/${patient.id}`)} style={{ padding: "4px 10px", borderRadius: 7, background: "#F97316", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Plan</button>
        <button onClick={() => onNav(`/app/expert/messages?patient=${patient.id}`)} style={{ padding: "4px 10px", borderRadius: 7, background: "#1B2B4B", color: "#fff", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chat</button>
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
  const mins = startTime ? Math.floor((new Date(startTime).getTime() - Date.now()) / 60000) : null;
  const imminent = mins !== null && mins >= 0 && mins <= 30;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F9FAFB" }}>
      {appt.patientUser?.imageUrl
        ? <img src={appt.patientUser.imageUrl} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E0E7FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{getInitials(patientName)}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#111827" }}>
          {patientName} <span style={{ color: "#9CA3AF", fontWeight: 400, fontSize: 12 }}>({title})</span>
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280" }}>
          <Calendar size={10} /><span>{title}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
        <span style={{ background: "#F0FDF4", color: "#16A34A", fontWeight: 700, fontSize: 12, padding: "2px 8px", borderRadius: 7 }}>
          {fmtTime(startTime)}
        </span>
        {isOnline && meetUrl && (
          <button onClick={() => window.open(meetUrl, "_blank")} style={{
            display: "flex", alignItems: "center", gap: 3, padding: "2px 7px",
            borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 700,
            background: imminent ? "#22C55E" : "#3B82F6", color: "#fff",
          }}>
            <Video size={9} /> Unirse
          </button>
        )}
      </div>
      <ChevronRight size={14} color="#D1D5DB" />
    </div>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────
function QuickBtn({ icon, label, bg, onClick }: { icon: React.ReactNode; label: string; bg: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", width: "100%",
      padding: "13px 16px", borderRadius: 12, border: "none",
      background: bg, color: "#fff", cursor: "pointer",
      fontWeight: 700, fontSize: 14, marginBottom: 8,
      boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
    }}>
      <span style={{ marginRight: 10 }}>{icon}</span>
      <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
      <ChevronRight size={16} />
    </button>
  );
}

// ─── Stats Mini Card ──────────────────────────────────────────────────────────
function StatCard({ title, desc, bg, icon, img, onClick }: {
  title: string; desc: string; bg: string; icon: React.ReactNode; img: string; onClick: () => void;
}) {
  return (
    <div onClick={onClick} style={{ borderRadius: 12, overflow: "hidden", cursor: "pointer", position: "relative", height: 78, marginBottom: 8 }}>
      <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{title}</span>
        </div>
        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.88)", lineHeight: 1.3 }}>{desc}</p>
      </div>
    </div>
  );
}

// ─── Progress Chart ───────────────────────────────────────────────────────────
function ProgressChart({ data, patients }: { data: any[]; patients: any[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return data
      .map((d: any) => {
        const pid = d.progress?.patientUserId ?? d.patientUserId ?? 1;
        const patient = patients.find(p => p.userId === pid || p.id === pid);
        return {
          date: new Date(d.progress?.recordedAt ?? d.recordedAt ?? Date.now())
            .toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
          peso: d.progress?.weight ?? d.weight ?? null,
          adherencia: getAdherence(pid),
          patientName: patient?.user?.name ?? patient?.name ?? undefined,
        };
      })
      .filter(d => d.peso != null);
  }, [data, patients]);

  const displayPoint = (activeIdx !== null ? chartData[activeIdx] : null) ?? chartData[chartData.length - 1];

  if (!chartData.length) {
    return (
      <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13 }}>
        Sin datos de progreso aún
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            onMouseMove={(e: any) => { if (e.activeTooltipIndex !== undefined) setActiveIdx(e.activeTooltipIndex); }}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }} />
            <Line type="monotone" dataKey="peso" stroke="#F97316" strokeWidth={2.5}
              dot={(props: any) => <circle key={props.key} cx={props.cx} cy={props.cy} r={props.index === activeIdx ? 5 : 3} fill="#F97316" opacity={props.index === activeIdx ? 1 : 0.6} stroke={props.index === activeIdx ? "#fff" : "none"} strokeWidth={2} />}
              activeDot={{ r: 6, fill: "#F97316", stroke: "#fff", strokeWidth: 2 }} name="Peso (kg)"
            />
            <Line type="monotone" dataKey="adherencia" stroke="#14B8A6" strokeWidth={2.5}
              dot={(props: any) => <circle key={props.key} cx={props.cx} cy={props.cy} r={props.index === activeIdx ? 5 : 3} fill="#14B8A6" opacity={props.index === activeIdx ? 1 : 0.6} stroke={props.index === activeIdx ? "#fff" : "none"} strokeWidth={2} />}
              activeDot={{ r: 6, fill: "#14B8A6", stroke: "#fff", strokeWidth: 2 }} name="Adherencia %"
            />
          </LineChart>
        </ResponsiveContainer>
        {displayPoint && (
          <div style={{ position: "absolute", right: 10, top: 6, background: "rgba(255,255,255,0.95)", borderRadius: 8, padding: "5px 9px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #F3F4F6", textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{displayPoint.adherencia}%</p>
            {displayPoint.peso != null && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#16A34A", fontWeight: 600 }}>↑{displayPoint.peso} kg</p>}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F97316", display: "inline-block" }} />Peso
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#14B8A6", display: "inline-block" }} />Adherencia
          </div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          <button style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={10} color="#6B7280" /></button>
          <button style={{ width: 24, height: 24, borderRadius: 5, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronDown size={10} color="#6B7280" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ExpertDashboard() {
  const { user } = useAuth();
  const [, nav] = useLocation();
  const search = useSearch();
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = trpc.expertPatients.getExpertDashboardStats.useQuery(
    undefined, { enabled: !!user, refetchInterval: 60000 }
  );
  const { data: gcalStatus, refetch: refetchGcal } = trpc.expertPatients.getGoogleCalendarStatus.useQuery(
    undefined, { enabled: !!user, staleTime: 30000 }
  );
  const { data: gcalAuthData } = trpc.expertPatients.getGoogleCalendarAuthUrl.useQuery(
    { origin: typeof window !== "undefined" ? window.location.origin : "" },
    { enabled: !!user && gcalStatus?.connected === false, staleTime: 60000 }
  );
  const { data: allPatients } = trpc.expertPatients.getPatients.useQuery(
    { status: "all", search: q }, { enabled: !!user }
  );
   const { data: blogData } = trpc.blog.list.useQuery({ limit: 2 }, { staleTime: 300000 });
  // Referral code + earnings
  const { data: referralCode, refetch: refetchReferral } = trpc.referrals.getMyCode.useQuery(
    { creatorType: "buddyexpert" }, { enabled: !!user, staleTime: 60000 }
  );
  const { data: earningsData } = trpc.referrals.getMyEarnings.useQuery(
    { limit: 5 }, { enabled: !!user, staleTime: 60000 }
  );
  const generateCode = trpc.referrals.generate.useMutation({
    onSuccess: () => { refetchReferral(); toast.success("Código de referido generado ✅"); },
    onError: () => toast.error("Error al generar el código"),
  });
  const [codeCopied, setCodeCopied] = useState(false);
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      toast.success("Código copiado al portapapeles 📋");
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };
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

  const stats = data?.stats;
  const upcoming = data?.upcomingAppointments ?? [];
  const recentPatients = data?.recentPatients ?? [];
  const recentProgress = data?.recentProgress ?? [];

  const todayAppts = useMemo(() =>
    upcoming.filter(a => isToday((a as any).appt?.startTime)), [upcoming]);

  const patientList: any[] = allPatients ?? recentPatients;
  const filtered = q
    ? patientList.filter(p => (p.user?.name ?? "").toLowerCase().includes(q.toLowerCase()))
    : patientList;
  const displayed = showAll ? filtered : filtered.slice(0, 3);

  if (!user) return null;

  const greeting = user.name?.split(" ").slice(0, 2).join(" ") ?? "Profesional";

  return (
    <div style={{ background: "#F5F0EB", minHeight: "100%", fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}} *{box-sizing:border-box}`}</style>

      {/* Banner de bienvenida contextual */}
      {!stats?.activePatients && !isLoading && (
        <div style={{ margin: "12px 16px 0", background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", border: "1px solid #FED7AA", borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: "#92400E" }}>👋 Bienvenido a tu panel de experto</p>
          <p style={{ margin: 0, fontSize: 12, color: "#78350F", lineHeight: 1.5 }}>
            Desde aquí gestionarás a tus pacientes, verás sus progresos y tendrás acceso rápido a tus citas del día. Para empezar, <strong>invita a tu primer paciente</strong> desde la sección “Pacientes”.
          </p>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827", minWidth: 0, flex: 1 }}>
          Hola {greeting} 👋
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {gcalStatus?.connected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 9, padding: "4px 10px", fontSize: 11, color: "#16A34A", fontWeight: 600 }}>
              <span>📅</span><span>Calendar ●</span>
              <button onClick={() => disconnectGcal.mutate()} style={{ fontSize: 10, color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontWeight: 600, marginLeft: 3, padding: 0 }}>✕</button>
            </div>
          ) : gcalAuthData?.url ? (
            <>
              <button onClick={() => window.location.href = gcalAuthData.url} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 9, padding: "4px 8px", fontSize: 10, color: "#374151", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" style={{ width: 11, height: 11 }} />
                <span className="gcal-label">Conectar Calendar</span>
              </button>
              <style>{`@media (max-width: 400px) { .gcal-label { display: none; } }`}</style>
            </>
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

      {/* Body: responsive grid (2-col on desktop, 1-col on mobile) */}
      <div style={{ padding: "0 16px 24px", display: "grid", gridTemplateColumns: "min(100%, calc(100vw - 32px)) 300px", gap: 18, alignItems: "start", maxWidth: "100%", overflowX: "hidden" }}
        className="expert-dashboard-grid">
      <style>{`@media (max-width: 768px) { .expert-dashboard-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* ── Left+Center ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Row 1: 3 KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}
            className="kpi-row">
          <style>{`@media (max-width: 480px) { .kpi-row { grid-template-columns: 1fr !important; gap: 8px !important; } }`}</style>
            <KpiCard
              count={isLoading ? "…" : (stats?.activePatients ?? 0)}
              title="Planes en curso"
              subtitle={`${stats?.totalPatients ?? 0} pacientes`}
              linkText="Ver planes"
              bg="linear-gradient(135deg,#F97316,#EA6C0A)"
              href="/app/expert/plans"
            />
            <KpiCard
              count={isLoading ? "…" : (stats?.unreadMessages ?? 0)}
              title="Mensajes"
              subtitle="nuevos"
              linkText="Responder mensajes"
              linkIcon={<Mail size={13} />}
              bg="linear-gradient(135deg,#1B2B4B,#243B6B)"
              href="/app/expert/messages"
            />
            <KpiCard
              count={isLoading ? "…" : (stats?.todayAppointments ?? 0)}
              title="Citas"
              subtitle="hoy"
              linkText="Paciente(s) de ping..."
              bg="linear-gradient(135deg,#2D9B8A,#1E8070)"
              href="/app/expert/patients"
            />
          </div>

          {/* Row 2: Pacientes + Recordatorio de citas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
            className="two-col-row">
          <style>{`@media (max-width: 600px) { .two-col-row { grid-template-columns: 1fr !important; } }`}</style>

            {/* Pacientes */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Pacientes</h3>
                <Link href="/app/expert/patients">
                  <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver todos &gt;</span>
                </Link>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#F9FAFB", borderRadius: 9, padding: "7px 11px", marginBottom: 10, border: "1px solid #F3F4F6" }}>
                <Search size={13} color="#9CA3AF" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar" style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", flex: 1 }} />
              </div>
              {isLoading
                ? [1, 2, 3].map(i => <div key={i} style={{ height: 46, background: "#F3F4F6", borderRadius: 8, marginBottom: 6, animation: "pulse 1.5s infinite" }} />)
                : displayed.length === 0
                  ? <div style={{ textAlign: "center", padding: "16px 0", color: "#9CA3AF", fontSize: 12 }}>{q ? "Sin resultados" : "Aún no tienes pacientes"}</div>
                  : displayed.map((p: any) => <PatientRow key={p.id} patient={p} onNav={nav} />)
              }
              {filtered.length > 3 && (
                <button onClick={() => setShowAll(!showAll)} style={{ display: "flex", alignItems: "center", gap: 5, margin: "8px auto 0", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9, padding: "7px 16px", fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 600 }}>
                  {showAll ? <><ChevronUp size={12} /> Ver menos</> : <><ChevronDown size={12} /> Ver más</>}
                </button>
              )}
            </div>

            {/* Recordatorio de citas */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 800, color: "#111827" }}>Recordatorio de citas</h3>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#6B7280", textTransform: "capitalize" }}>{fmtDateLong(new Date())}</p>
              {isLoading
                ? [1, 2, 3].map(i => <div key={i} style={{ height: 50, background: "#F3F4F6", borderRadius: 8, marginBottom: 6, animation: "pulse 1.5s infinite" }} />)
                : todayAppts.length === 0
                  ? <div style={{ textAlign: "center", padding: "16px 0", color: "#9CA3AF", fontSize: 12 }}><Calendar size={24} style={{ margin: "0 auto 5px", display: "block", opacity: 0.3 }} />No hay citas para hoy</div>
                  : todayAppts.map((a: any) => <AppointmentRow key={a.appt?.id} appt={a} />)
              }
              <button onClick={() => nav("/app/expert/appointments")} style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 9, padding: "8px 12px", fontSize: 12, color: "#374151", cursor: "pointer", fontWeight: 600 }}>
                <Calendar size={13} /> Ver calendario
              </button>
            </div>
          </div>

          {/* Row 3: Contenido destacado + Accesos rápidos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
            className="two-col-row-2">
          <style>{`@media (max-width: 600px) { .two-col-row-2 { grid-template-columns: 1fr !important; } }`}</style>

            {/* Contenido destacado */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Contenido destacado</h3>
                <Link href="/app/blog">
                  <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver más &gt;</span>
                </Link>
              </div>
              {(blogData?.posts?.length ? blogData.posts : [
                { id: 1, expertName: "Eliana Gómez", expertRole: "Nutricionista Certificada", readTimeMinutes: 3, category: "4 consejos", title: "Descubre las mejores fuentes de proteínas vegetales", coverImageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&q=80" },
                { id: 2, expertName: "Eliana Gómez", expertRole: "Nutricionista Certificada", readTimeMinutes: 24, category: "8 alimentos", title: "5 alimentos que ayudan a mejorar el metabolismo", coverImageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=120&q=80" },
              ]).map((post: any) => (
                <div key={post.id} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #F9FAFB" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#F97316,#FB923C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{getInitials(post.expertName)}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#111827" }}>{post.expertName ?? "BuddyExpert"}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "#9CA3AF" }}>{post.expertRole ?? post.expertSpecialty ?? "Nutricionista"}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 3px", fontSize: 10, color: "#9CA3AF" }}>⏱ {post.category} · {post.readTimeMinutes}h</p>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{post.title}</p>
                    </div>
                    <div style={{ width: 52, height: 52, borderRadius: 8, flexShrink: 0, overflow: "hidden", background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                      {post.coverImageUrl
                        ? <img src={post.coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = "none"; (t.parentElement as HTMLElement).textContent = "🥗"; }} />
                        : "🥗"
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Accesos rápidos + gráfico */}
            <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Accesos rápidos</h3>
                <Link href="/app/expert/patients">
                  <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver más &gt;</span>
                </Link>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 12, color: "#374151", fontWeight: 600 }}>
                Progreso Pacientes <span style={{ color: "#9CA3AF", fontWeight: 400 }}>Último mes</span>
              </p>
              <ProgressChart data={recentProgress} patients={patientList} />
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Tareas rápidas */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#111827" }}>Tareas rápidas</h3>
            <QuickBtn icon={<FileText size={16} />} label="Crear Plan" bg="linear-gradient(135deg,#F97316,#EA6C0A)" onClick={() => nav("/app/expert/plans")} />
            <QuickBtn icon={<UserPlus size={16} />} label="Agregar Paciente" bg="linear-gradient(135deg,#16A34A,#15803D)" onClick={() => nav("/app/expert/patients")} />
            <QuickBtn icon={<CalendarPlus size={16} />} label="Agendar Cita" bg="linear-gradient(135deg,#2D9B8A,#1E8070)" onClick={() => nav("/app/expert/appointments")} />
            <QuickBtn icon={<span style={{fontSize:14}}>🗂️</span>} label="Plantillas Menús" bg="linear-gradient(135deg,#7C3AED,#6D28D9)" onClick={() => nav("/app/expert/menu-templates")} />
            <QuickBtn icon={<span style={{fontSize:14}}>🔄</span>} label="Sustituciones" bg="linear-gradient(135deg,#0891B2,#0E7490)" onClick={() => nav("/app/expert/food-substitutions")} />
            <QuickBtn icon={<Package size={16} />} label="Paquetes de Sesiones" bg="linear-gradient(135deg,#D97706,#B45309)" onClick={() => nav("/app/expert/session-packages")} />
          </div>

          {/* Estadísticas */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>Estadísticas</h3>
              <Link href="/app/buddy-expert-stats">
                <span style={{ fontSize: 12, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver más &gt;</span>
              </Link>
            </div>
            <StatCard
              title="Inventario"
              desc="Accede a la lista de propiedades nutricionales."
              bg="linear-gradient(135deg,rgba(249,115,22,0.88),rgba(234,108,10,0.75))"
              icon={<Package size={14} color="#fff" />}
              img="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"
              onClick={() => nav("/app/inventory")}
            />
            <StatCard
              title="BuddyScan IA"
              desc="Escanea productos para obtener información nutricional."
              bg="linear-gradient(135deg,rgba(79,70,229,0.88),rgba(109,40,217,0.75))"
              icon={<Scan size={14} color="#fff" />}
              img="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80"
              onClick={() => nav("/app/scan")}
            />
          </div>

          {/* BuddyScan IA featured */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: "#111827" }}>BuddyScan IA</h3>
            <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 10 }}>
              <img src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80" alt="" style={{ width: "100%", height: 110, objectFit: "cover" }} />
            </div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>5 alimentos que ayudan a mejorar el metabolismo</p>
            <p style={{ margin: "3px 0 10px", fontSize: 11, color: "#9CA3AF" }}>8 alimentos · 24h</p>
            <button onClick={() => nav("/app/scan")} style={{ width: "100%", padding: "9px", borderRadius: 9, background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Scan size={13} /> Abrir BuddyScan
            </button>
          </div>

          {/* 💰 Ingresos y Código de Referido */}
          <div style={{ background: "#fff", borderRadius: 16, padding: "18px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#111827" }}>💰 Ingresos</h3>
              <Link href="/app/buddy-expert-stats">
                <span style={{ fontSize: 11, color: "#F97316", fontWeight: 600, cursor: "pointer" }}>Ver todo &gt;</span>
              </Link>
            </div>

            {/* KPIs de ingresos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <div style={{ background: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#16A34A", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Cobrado</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#15803D" }}>
                  {earningsData?.totalEarned ? `${(earningsData.totalEarned / 100).toFixed(2)}€` : "0,00€"}
                </p>
              </div>
              <div style={{ background: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", borderRadius: 10, padding: "10px 12px" }}>
                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#EA580C", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Referidos</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#C2410C" }}>
                  {earningsData?.activeReferrals ?? 0}
                </p>
              </div>
            </div>

            {/* Últimos cobros */}
            {earningsData?.earnings && earningsData.earnings.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Últimos cobros</p>
                {earningsData.earnings.slice(0, 3).map((e: any, i: number) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F9FAFB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👤</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#111827" }}>{e.referredName ?? "Usuario"}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "#9CA3AF" }}>{new Date(e.createdAt).toLocaleDateString("es-ES")}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#16A34A" }}>+{(e.commissionAmount / 100).toFixed(2)}€</p>
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 5, background: e.status === "active" ? "#F0FDF4" : "#FFF7ED", color: e.status === "active" ? "#16A34A" : "#EA580C", fontWeight: 600 }}>
                        {e.status === "active" ? "Pagado" : "Pendiente"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Código de referido */}
            <div style={{ background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>🎁</span>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#3730A3" }}>Tu código de referido</p>
              </div>
              <p style={{ margin: "0 0 8px", fontSize: 10, color: "#6366F1", lineHeight: 1.4 }}>
                Comparte este código y gana un <strong>20% de comisión</strong> por cada paciente que se suscriba.
              </p>
              {referralCode ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ flex: 1, background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1.5px dashed #A5B4FC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: "#4F46E5", letterSpacing: 2 }}>{referralCode.code}</span>
                  </div>
                  <button
                    onClick={() => copyCode(referralCode.code)}
                    style={{ padding: "8px 12px", borderRadius: 8, background: codeCopied ? "#16A34A" : "#4F46E5", color: "#fff", border: "none", fontWeight: 700, fontSize: 11, cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}
                  >
                    {codeCopied ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => generateCode.mutate({ creatorType: "buddyexpert", discountPercent: 15 })}
                  disabled={generateCode.isPending}
                  style={{ width: "100%", padding: "9px", borderRadius: 8, background: "#4F46E5", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                >
                  {generateCode.isPending ? "Generando..." : "Generar mi código"}
                </button>
              )}
              {referralCode && (
                <p style={{ margin: "6px 0 0", fontSize: 10, color: "#6B7280", textAlign: "center" }}>
                  {referralCode.usageCount} uso{referralCode.usageCount !== 1 ? "s" : ""} · {referralCode.discountPercent}% descuento para el paciente
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
