import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import {
  Building2, Users, Key, TrendingUp, Activity, Copy, CheckCircle,
  XCircle, Plus, Search, Download, Eye, EyeOff, AlertCircle, Loader2,
  Shield, BarChart3, MessageSquare, Zap, Clock, UserCheck, UserX, Settings,
} from "lucide-react";

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtRelative(d: Date | string | null | undefined) {
  if (!d) return "Nunca";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`;
  return fmtDate(d);
}
function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
}
function statusColor(status: string) {
  const map: Record<string, string> = { available: "#22c55e", used: "#3b82f6", revoked: "#ef4444", expired: "#f59e0b" };
  return map[status] ?? "#9ca3af";
}
function statusLabel(status: string) {
  const map: Record<string, string> = { available: "Disponible", used: "Usado", revoked: "Revocado", expired: "Caducado" };
  return map[status] ?? status;
}
function planLabel(plan: string) {
  const map: Record<string, string> = { starter: "Starter", growth: "Growth", business: "Business", enterprise: "Enterprise", corporate: "Corporate", global: "Global" };
  return map[plan] ?? plan;
}
function planColor(plan: string) {
  const map: Record<string, string> = { starter: "#6366f1", growth: "#0ea5e9", business: "#10b981", enterprise: "#f59e0b", corporate: "#f97316", global: "#8b5cf6" };
  return map[plan] ?? "#9ca3af";
}

function MetricCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: "white", borderRadius: 18, padding: "20px 22px", border: "1.5px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color }}>{icon}</div>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: active ? "#F97316" : "transparent", color: active ? "white" : "#6b7280", transition: "all 0.15s" }}>
      {children}
    </button>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, color, background: bg }}>{label}</span>;
}

export default function CorporateDashboard() {
  const [tab, setTab] = useState<"overview" | "members" | "codes" | "settings">("overview");
  const [memberFilter, setMemberFilter] = useState<"all" | "active" | "inactive">("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [codeFilter, setCodeFilter] = useState<"all" | "available" | "used" | "revoked">("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateQty, setGenerateQty] = useState(5);
  const [showWelcomeEdit, setShowWelcomeEdit] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<{ type: "member" | "code"; id: number; name: string } | null>(null);

  const utils = trpc.useUtils();

  const dashboardQ = trpc.company.getDashboard.useQuery(undefined, { onError: () => {} });
  const membersQ = trpc.company.getMembers.useQuery({ status: memberFilter, limit: 100 }, { enabled: tab === "members" });
  const codesQ = trpc.company.getActivationCodes.useQuery({ status: codeFilter, limit: 200 }, { enabled: tab === "codes" });

  const generateCodes = trpc.company.generateCodes.useMutation({
    onSuccess: (data) => { toast.success(`✅ ${data.generated} código${data.generated > 1 ? "s" : ""} generado${data.generated > 1 ? "s" : ""}`); setShowGenerateModal(false); utils.company.getDashboard.invalidate(); utils.company.getActivationCodes.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const revokeMember = trpc.company.revokeMemberLicense.useMutation({
    onSuccess: () => { toast.success("Licencia revocada"); setConfirmRevoke(null); utils.company.getMembers.invalidate(); utils.company.getDashboard.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const reactivateMember = trpc.company.reactivateMemberLicense.useMutation({
    onSuccess: () => { toast.success("Licencia reactivada"); utils.company.getMembers.invalidate(); utils.company.getDashboard.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const revokeCode = trpc.company.revokeCode.useMutation({
    onSuccess: () => { toast.success("Código revocado"); setConfirmRevoke(null); utils.company.getActivationCodes.invalidate(); utils.company.getDashboard.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateWelcome = trpc.company.updateWelcomeMessage.useMutation({
    onSuccess: () => { toast.success("Mensaje actualizado"); setShowWelcomeEdit(false); utils.company.getDashboard.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const dashboard = dashboardQ.data;
  const company = dashboard?.company;
  const metrics = dashboard?.metrics;

  const filteredMembers = useMemo(() => {
    const list = membersQ.data?.members ?? [];
    if (!memberSearch.trim()) return list;
    const q = memberSearch.toLowerCase();
    return list.filter((m: any) => (m.userName ?? "").toLowerCase().includes(q) || (m.userEmail ?? "").toLowerCase().includes(q));
  }, [membersQ.data?.members, memberSearch]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => { setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); });
  };
  const copyAllCodes = () => {
    const available = codesQ.data?.codes.filter((c: any) => c.status === "available").map((c: any) => c.code).join("\n") ?? "";
    if (!available) { toast.error("No hay códigos disponibles"); return; }
    navigator.clipboard.writeText(available).then(() => toast.success("Códigos copiados al portapapeles"));
  };

  if (dashboardQ.isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 12, color: "#9ca3af" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: 15 }}>Cargando panel de empresa...</span>
      </div>
    );
  }

  if (dashboardQ.error || !company) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <AlertCircle size={48} style={{ color: "#f59e0b", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Sin empresa asociada</h2>
        <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 400, margin: "0 auto" }}>No tienes una empresa asociada a tu cuenta.</p>
      </div>
    );
  }

  const licenseUsagePct = metrics ? Math.round((metrics.licensesUsed / Math.max(metrics.licensesTotal, 1)) * 100) : 0;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 22, padding: "28px 32px", marginBottom: 24, color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Building2 size={22} style={{ color: "#F97316" }} />
              <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Panel de Empresa</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{company.name}</h1>
            <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${planColor(company.plan)}22`, color: planColor(company.plan), border: `1px solid ${planColor(company.plan)}44`, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                <Shield size={12} /> Plan {planLabel(company.plan)}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: company.status === "active" ? "#22c55e22" : "#f59e0b22", color: company.status === "active" ? "#22c55e" : "#f59e0b", border: `1px solid ${company.status === "active" ? "#22c55e44" : "#f59e0b44"}`, borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
                <Activity size={12} /> {company.status === "active" ? "Activo" : company.status === "trial" ? "Prueba" : company.status}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Contrato</div>
            <div style={{ fontSize: 13, color: "#e2e8f0" }}>{company.contractStartAt ? fmtDate(company.contractStartAt) : "—"} → {company.contractEndAt ? fmtDate(company.contractEndAt) : "Indefinido"}</div>
          </div>
        </div>
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>Uso de licencias</span>
            <span style={{ fontSize: 13, color: "white", fontWeight: 700 }}>{metrics?.licensesUsed ?? 0} / {metrics?.licensesTotal ?? 0}</span>
          </div>
          <div style={{ height: 8, background: "#ffffff18", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: licenseUsagePct > 90 ? "#ef4444" : licenseUsagePct > 70 ? "#f59e0b" : "#22c55e", width: `${licenseUsagePct}%`, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>{licenseUsagePct}% utilizado</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>{metrics?.licensesAvailable ?? 0} disponibles</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 14, padding: 4, marginBottom: 24, overflowX: "auto" }}>
        <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>📊 Resumen</TabBtn>
        <TabBtn active={tab === "members"} onClick={() => setTab("members")}>👥 Empleados</TabBtn>
        <TabBtn active={tab === "codes"} onClick={() => setTab("codes")}>🔑 Códigos</TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>⚙️ Configuración</TabBtn>
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <MetricCard icon={<Users size={18} />} label="Empleados activos" value={metrics?.activeMembers ?? 0} sub={`de ${metrics?.licensesTotal ?? 0} licencias`} color="#3b82f6" />
            <MetricCard icon={<Key size={18} />} label="Licencias usadas" value={metrics?.licensesUsed ?? 0} sub={`${metrics?.licensesAvailable ?? 0} disponibles`} color="#F97316" />
            <MetricCard icon={<TrendingUp size={18} />} label="Tasa de activación" value={`${metrics?.activationRate ?? 0}%`} sub="códigos canjeados" color="#22c55e" />
            <MetricCard icon={<BarChart3 size={18} />} label="Licencias totales" value={metrics?.licensesTotal ?? 0} sub={`Plan ${planLabel(company.plan)}`} color="#8b5cf6" />
          </div>
          <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1.5px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Incorporaciones recientes</h3>
              <button onClick={() => setTab("members")} style={{ fontSize: 12, color: "#F97316", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Ver todos →</button>
            </div>
            {(dashboard?.recentMembers ?? []).length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#9ca3af" }}>
                <Users size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: 13 }}>Aún no hay empleados registrados</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(dashboard?.recentMembers ?? []).map((m: any, i: number) => (
                  <div key={m.id ?? i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "#f9fafb" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #FB923C)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "white", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>Empleado #{i + 1}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9ca3af" }}>Incorporado {fmtRelative(m.joinedAt)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Último acceso</p>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmtRelative(m.lastActiveAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <button onClick={() => { setTab("codes"); setShowGenerateModal(true); }} style={{ background: "linear-gradient(135deg, #F97316, #FB923C)", borderRadius: 16, padding: "18px 20px", border: "none", cursor: "pointer", color: "white", textAlign: "left" }}>
              <Plus size={22} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Generar códigos</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>Crea nuevos códigos de activación</p>
            </button>
            <button onClick={() => setTab("members")} style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)", borderRadius: 16, padding: "18px 20px", border: "none", cursor: "pointer", color: "white", textAlign: "left" }}>
              <Users size={22} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Gestionar empleados</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>Ver y administrar licencias</p>
            </button>
            <button onClick={() => setTab("settings")} style={{ background: "linear-gradient(135deg, #8b5cf6, #a78bfa)", borderRadius: 16, padding: "18px 20px", border: "none", cursor: "pointer", color: "white", textAlign: "left" }}>
              <MessageSquare size={22} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Mensaje de bienvenida</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.85 }}>Personaliza el onboarding</p>
            </button>
          </div>
        </>
      )}

      {/* MEMBERS */}
      {tab === "members" && (
        <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1.5px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Empleados con licencia</h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>{membersQ.data?.total ?? 0} total</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["all", "active", "inactive"] as const).map(f => (
                <button key={f} onClick={() => setMemberFilter(f)} style={{ padding: "7px 14px", borderRadius: 10, border: `1.5px solid ${memberFilter === f ? "#F97316" : "#e5e7eb"}`, background: memberFilter === f ? "#FFF7ED" : "white", color: memberFilter === f ? "#F97316" : "#6b7280", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {f === "all" ? "Todos" : f === "active" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar por nombre o email..." style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          {membersQ.isLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}><Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} /><p style={{ margin: 0, fontSize: 13 }}>Cargando...</p></div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <Users size={36} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Sin empleados</p>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>{memberSearch ? "Ningún empleado coincide" : "Comparte los códigos con tu equipo"}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredMembers.map((m: any) => (
                <div key={m.memberId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: `1.5px solid ${m.isActive ? "#f3f4f6" : "#fee2e2"}`, background: m.isActive ? "#fafafa" : "#fff5f5" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: m.isActive ? "linear-gradient(135deg, #3b82f6, #60a5fa)" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "white" }}>
                    {m.userAvatar ? <img src={m.userAvatar} alt="" style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }} /> : initials(m.userName)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.userName ?? "Sin nombre"}</p>
                      <Badge label={m.isActive ? "Activo" : "Inactivo"} color={m.isActive ? "#22c55e" : "#ef4444"} bg={m.isActive ? "#f0fdf4" : "#fef2f2"} />
                    </div>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.userEmail ?? "Sin email"} · Incorporado {fmtRelative(m.joinedAt)}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#9ca3af", fontSize: 11, flexShrink: 0 }}>
                    <Clock size={11} /><span>{fmtRelative(m.lastActiveAt)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {m.isActive ? (
                      <button onClick={() => setConfirmRevoke({ type: "member", id: m.memberId, name: m.userName ?? "este empleado" })} title="Revocar licencia" style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #fee2e2", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}><UserX size={15} /></button>
                    ) : (
                      <button onClick={() => reactivateMember.mutate({ memberId: m.memberId })} title="Reactivar" disabled={reactivateMember.isPending} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #dcfce7", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#22c55e" }}><UserCheck size={15} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CODES */}
      {tab === "codes" && (
        <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1.5px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Códigos de activación</h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>{codesQ.data?.total ?? 0} total</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={copyAllCodes} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Download size={14} /> Copiar disponibles</button>
              <button onClick={() => setShowGenerateModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "none", background: "#F97316", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Plus size={14} /> Generar códigos</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {(["all", "available", "used", "revoked"] as const).map(f => (
              <button key={f} onClick={() => setCodeFilter(f)} style={{ padding: "6px 14px", borderRadius: 10, border: `1.5px solid ${codeFilter === f ? "#F97316" : "#e5e7eb"}`, background: codeFilter === f ? "#FFF7ED" : "white", color: codeFilter === f ? "#F97316" : "#6b7280", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {f === "all" ? "Todos" : statusLabel(f)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCodes(!showCodes)} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: 12, fontWeight: 600 }}>
            {showCodes ? <EyeOff size={14} /> : <Eye size={14} />}{showCodes ? "Ocultar códigos" : "Mostrar códigos"}
          </button>
          {codesQ.isLoading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}><Loader2 size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 8px" }} /><p style={{ margin: 0, fontSize: 13 }}>Cargando...</p></div>
          ) : (codesQ.data?.codes ?? []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <Key size={36} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Sin códigos</p>
              <p style={{ margin: "4px 0 0", fontSize: 12 }}>Genera códigos para que tus empleados activen su licencia</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {(codesQ.data?.codes ?? []).map((c: any) => (
                <div key={c.id} style={{ borderRadius: 14, padding: "14px 16px", border: `1.5px solid ${statusColor(c.status)}33`, background: `${statusColor(c.status)}08`, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Badge label={statusLabel(c.status)} color={statusColor(c.status)} bg={`${statusColor(c.status)}18`} />
                    {c.status === "available" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => copyCode(c.code)} title="Copiar" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: copiedCode === c.code ? "#22c55e" : "#6b7280" }}>
                          {copiedCode === c.code ? <CheckCircle size={13} /> : <Copy size={13} />}
                        </button>
                        <button onClick={() => setConfirmRevoke({ type: "code", id: c.id, name: c.code })} title="Revocar" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fee2e2", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}><XCircle size={13} /></button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: "0.1em" }}>{showCodes ? c.code : c.code.replace(/./g, "•")}</div>
                  {c.status === "used" && c.redeemedByName && <div style={{ fontSize: 11, color: "#6b7280" }}><span style={{ fontWeight: 600 }}>{c.redeemedByName}</span>{c.redeemedByEmail && <span> · {c.redeemedByEmail}</span>}<br /><span>Canjeado {fmtRelative(c.redeemedAt)}</span></div>}
                  {c.status === "available" && <div style={{ fontSize: 11, color: "#9ca3af" }}>Creado {fmtDate(c.createdAt)}{c.expiresAt && <span> · Caduca {fmtDate(c.expiresAt)}</span>}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1.5px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Información de la empresa</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {[
                { label: "Nombre", value: company.name },
                { label: "CIF / NIF", value: (company as any).taxId ?? "—" },
                { label: "Email de contacto", value: company.contactEmail },
                { label: "Teléfono", value: company.contactPhone ?? "—" },
                { label: "Sector", value: company.industry ?? "—" },
                { label: "Nº empleados estimado", value: company.employeeCount?.toLocaleString("es-ES") ?? "—" },
              ].map(f => (
                <div key={f.label} style={{ padding: "12px 14px", borderRadius: 12, background: "#f9fafb" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 700, color: "#111827" }}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1.5px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>Mensaje de bienvenida</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>Los empleados lo ven al activar su licencia</p>
              </div>
              <button onClick={() => { setWelcomeText(company.welcomeMessage ?? ""); setShowWelcomeEdit(!showWelcomeEdit); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <Settings size={14} /> {showWelcomeEdit ? "Cancelar" : "Editar"}
              </button>
            </div>
            {showWelcomeEdit ? (
              <div>
                <textarea value={welcomeText} onChange={e => setWelcomeText(e.target.value)} maxLength={500} rows={4} placeholder="Escribe un mensaje de bienvenida..." style={{ width: "100%", borderRadius: 12, border: "1.5px solid #e5e7eb", padding: "12px 14px", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{welcomeText.length}/500</span>
                  <button onClick={() => updateWelcome.mutate({ welcomeMessage: welcomeText })} disabled={updateWelcome.isPending} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, border: "none", background: "#F97316", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {updateWelcome.isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={14} />} Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f9fafb", fontSize: 14, color: company.welcomeMessage ? "#374151" : "#9ca3af", fontStyle: company.welcomeMessage ? "normal" : "italic", lineHeight: 1.6 }}>
                {company.welcomeMessage ?? "Sin mensaje configurado"}
              </div>
            )}
          </div>
          {company.accessCode && (
            <div style={{ background: "white", borderRadius: 18, padding: "22px 24px", border: "1.5px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 800, color: "#111827" }}>Código de empresa</h3>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "#9ca3af" }}>Comparte este código con tus empleados para que se unan</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, fontFamily: "monospace", fontSize: 22, fontWeight: 800, color: "#F97316", letterSpacing: "0.15em", padding: "14px 18px", borderRadius: 14, background: "#FFF7ED", border: "1.5px solid #FED7AA" }}>{company.accessCode}</div>
                <button onClick={() => copyCode(company.accessCode!)} style={{ width: 48, height: 48, borderRadius: 14, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: copiedCode === company.accessCode ? "#22c55e" : "#6b7280" }}>
                  {copiedCode === company.accessCode ? <CheckCircle size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GENERATE MODAL */}
      {showGenerateModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => setShowGenerateModal(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", background: "white", borderRadius: 22, padding: "28px 32px", width: "100%", maxWidth: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#111827" }}>Generar códigos</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#6b7280" }}>Disponibles: {metrics?.licensesAvailable ?? 0} de {metrics?.licensesTotal ?? 0} licencias</p>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>¿Cuántos códigos quieres generar?</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setGenerateQty(q => Math.max(1, q - 1))} style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#374151" }}>−</button>
              <input type="number" min={1} max={50} value={generateQty} onChange={e => setGenerateQty(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))} style={{ flex: 1, textAlign: "center", fontSize: 24, fontWeight: 800, color: "#111827", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "10px", outline: "none" }} />
              <button onClick={() => setGenerateQty(q => Math.min(50, q + 1))} style={{ width: 40, height: 40, borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#374151" }}>+</button>
            </div>
            {generateQty > (metrics?.licensesAvailable ?? 0) && (
              <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderRadius: 12, background: "#fef3c7", border: "1px solid #fde68a", marginBottom: 16 }}>
                <AlertCircle size={16} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>Superas el límite. Solo puedes generar {metrics?.licensesAvailable ?? 0} más.</p>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowGenerateModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => generateCodes.mutate({ quantity: generateQty })} disabled={generateCodes.isPending || generateQty > (metrics?.licensesAvailable ?? 0)} style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: "#F97316", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: generateCodes.isPending || generateQty > (metrics?.licensesAvailable ?? 0) ? 0.6 : 1 }}>
                {generateCodes.isPending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={16} />}
                Generar {generateQty} código{generateQty > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REVOKE MODAL */}
      {confirmRevoke && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={() => setConfirmRevoke(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", background: "white", borderRadius: 22, padding: "28px 32px", width: "100%", maxWidth: 380, boxShadow: "0 24px 60px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><AlertCircle size={28} style={{ color: "#ef4444" }} /></div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#111827" }}>{confirmRevoke.type === "member" ? "Revocar licencia" : "Revocar código"}</h3>
            <p style={{ margin: "0 0 22px", fontSize: 13, color: "#6b7280" }}>{confirmRevoke.type === "member" ? `¿Revocar la licencia de ${confirmRevoke.name}? Perderá acceso inmediatamente.` : `¿Revocar el código ${confirmRevoke.name}? Ya no podrá ser utilizado.`}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmRevoke(null)} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => { if (confirmRevoke.type === "member") revokeMember.mutate({ memberId: confirmRevoke.id }); else revokeCode.mutate({ codeId: confirmRevoke.id }); }} disabled={revokeMember.isPending || revokeCode.isPending} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#ef4444", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {(revokeMember.isPending || revokeCode.isPending) ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : null}
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
