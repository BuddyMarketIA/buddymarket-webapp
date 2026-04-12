import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";
import {
  Users, Building2, TrendingUp, CreditCard, AlertCircle, CheckCircle2,
  RefreshCw, Search, XCircle, RotateCcw, Edit3, X,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  starter:    "bg-blue-100 text-blue-700",
  business:   "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
  corporate:  "bg-gray-100 text-gray-700",
};

const STATUS_COLORS: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  trial:     "bg-blue-100 text-blue-700",
  pending:   "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

function KpiCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 ${color}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs font-semibold mt-0.5 opacity-80">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Sub-panel: Resumen global ────────────────────────────────────────────────
function LicenciasResumen() {
  const { data, isLoading, refetch } = trpc.company.adminGetLicensesOverview.useQuery();

  if (isLoading) return <div className="py-12 text-center text-sm text-gray-400">Cargando resumen...</div>;
  if (!data) return <div className="py-12 text-center text-sm text-red-400">Error al cargar datos</div>;

  const { summary, byPlan, monthlyEvolution, topCompanies } = data;

  return (
    <div className="space-y-5">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="MRR" value={`${summary.mrr.toFixed(0)} €`} sub="Ingresos mensuales recurrentes" color="bg-green-50 text-green-800" />
        <KpiCard label="ARR" value={`${summary.arr.toFixed(0)} €`} sub="Ingresos anuales proyectados" color="bg-emerald-50 text-emerald-800" />
        <KpiCard label="Licencias activas" value={summary.totalLicensesActive} sub={`de ${summary.totalLicensesContracted} contratadas`} color="bg-blue-50 text-blue-800" />
        <KpiCard label="Tasa de uso" value={`${summary.usageRate}%`} sub={`${summary.activeCompanies} empresas activas`} color="bg-purple-50 text-purple-800" />
      </div>

      {/* Distribución por plan */}
      <div className="vively-card">
        <h4 className="text-sm font-bold text-gray-700 mb-4">Distribución por plan</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-semibold">Plan</th>
                <th className="text-center py-2 font-semibold">Empresas</th>
                <th className="text-center py-2 font-semibold">Licencias contratadas</th>
                <th className="text-center py-2 font-semibold">Licencias activas</th>
                <th className="text-center py-2 font-semibold">€/licencia</th>
                <th className="text-right py-2 font-semibold">MRR</th>
              </tr>
            </thead>
            <tbody>
              {byPlan.map(p => (
                <tr key={p.plan} className="border-b border-gray-50">
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[p.plan] || "bg-gray-100 text-gray-600"}`}>{p.plan}</span>
                  </td>
                  <td className="py-2 text-center text-gray-700">{p.activeCompanies} / {p.totalCompanies}</td>
                  <td className="py-2 text-center text-gray-700">{p.licensesContracted}</td>
                  <td className="py-2 text-center">
                    <span className={p.licensesActive > 0 ? "text-green-700 font-semibold" : "text-gray-400"}>{p.licensesActive}</span>
                  </td>
                  <td className="py-2 text-center text-gray-600">{p.pricePerLicense > 0 ? `${p.pricePerLicense} €` : "A medida"}</td>
                  <td className="py-2 text-right font-bold text-green-700">{p.mrr.toFixed(0)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfico de evolución mensual */}
      {monthlyEvolution.length > 0 ? (
        <div className="vively-card">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Evolución mensual de licencias y facturación</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyEvolution} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "totalLicenses" ? `${value} licencias` : `${value.toFixed(0)} €`,
                  name === "totalLicenses" ? "Licencias activas" : "Facturación",
                ]}
              />
              <Legend formatter={v => v === "totalLicenses" ? "Licencias activas" : "Facturación (€)"} />
              <Line yAxisId="left" type="monotone" dataKey="totalLicenses" stroke="#F97316" strokeWidth={2} dot={{ r: 4 }} />
              <Line yAxisId="right" type="monotone" dataKey="totalRevenue" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="vively-card text-center py-8">
          <p className="text-sm text-gray-400">Sin datos históricos de facturación aún</p>
          <p className="text-xs text-gray-300 mt-1">Los snapshots mensuales aparecerán aquí tras el primer ciclo de facturación</p>
        </div>
      )}

      {/* Gráfico de barras por empresa */}
      {topCompanies.length > 0 && (
        <div className="vively-card">
          <h4 className="text-sm font-bold text-gray-700 mb-4">Licencias activas por empresa</h4>
          <ResponsiveContainer width="100%" height={Math.max(180, topCompanies.length * 36)}>
            <BarChart
              data={topCompanies}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "licensesActive" ? `${value} activas` : `${value} contratadas`,
                  name === "licensesActive" ? "Activas" : "Contratadas",
                ]}
              />
              <Legend formatter={v => v === "licensesActive" ? "Activas" : "Contratadas"} />
              <Bar dataKey="licensesContracted" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="licensesContracted" />
              <Bar dataKey="licensesActive" fill="#F97316" radius={[0, 4, 4, 0]} name="licensesActive" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Sub-panel: Listado de licencias ─────────────────────────────────────────
function LicenciasListado({ onSelectCompany }: { onSelectCompany: (id: number, name: string) => void }) {
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const { data, isLoading, refetch } = trpc.company.adminGetAllLicenses.useQuery({
    isActive: isActiveFilter,
    search: search || undefined,
    limit: LIMIT,
    offset,
  });

  const revoke = trpc.company.adminRevokeLicense.useMutation({
    onSuccess: () => { toast.success("Licencia revocada"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const reactivate = trpc.company.adminReactivateLicense.useMutation({
    onSuccess: () => { toast.success("Licencia reactivada"); refetch(); },
    onError: e => toast.error(e.message),
  });

  const licenses = data?.licenses ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="vively-card flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Buscar por nombre, email o empresa..."
            className="vively-input pl-9 w-full text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[
            { label: "Todas", value: undefined },
            { label: "Activas", value: true },
            { label: "Inactivas", value: false },
          ].map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => { setIsActiveFilter(opt.value); setOffset(0); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isActiveFilter === opt.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400 ml-auto">{total} licencias</span>
      </div>

      {/* Tabla */}
      <div className="vively-card overflow-x-auto">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Cargando licencias...</div>
        ) : licenses.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">Sin resultados</div>
        ) : (
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 pr-3 font-semibold min-w-[140px]">Empleado</th>
                <th className="text-left py-2 pr-3 font-semibold min-w-[130px]">Empresa</th>
                <th className="text-center py-2 font-semibold w-24">Plan</th>
                <th className="text-center py-2 font-semibold w-20">Estado</th>
                <th className="text-center py-2 font-semibold w-20">Alta</th>
                <th className="text-center py-2 font-semibold w-24">Última actividad</th>
                <th className="text-center py-2 font-semibold w-16">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map(lic => (
                <tr key={lic.memberId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 pr-3">
                    <p className="font-semibold text-gray-800 truncate max-w-[140px]">{lic.userName || "—"}</p>
                    <p className="text-gray-400 truncate max-w-[140px]">{lic.userEmail}</p>
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => lic.companyId && lic.companyName && onSelectCompany(lic.companyId, lic.companyName)}
                      className="text-[#F97316] hover:underline font-medium text-left"
                    >
                      {lic.companyName || "—"}
                    </button>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[lic.companyPlan || ""] || "bg-gray-100 text-gray-600"}`}>
                      {lic.companyPlan || "—"}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${lic.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {lic.isActive ? "activa" : "inactiva"}
                    </span>
                  </td>
                  <td className="py-2 text-center text-gray-500">
                    {lic.joinedAt ? new Date(lic.joinedAt).toLocaleDateString("es-ES") : "—"}
                  </td>
                  <td className="py-2 text-center text-gray-500">
                    {lic.lastActiveAt ? new Date(lic.lastActiveAt).toLocaleDateString("es-ES") : "Nunca"}
                  </td>
                  <td className="py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {lic.isActive ? (
                        <button
                          onClick={() => {
                            if (confirm(`¿Revocar licencia de ${lic.userName || lic.userEmail}?`)) {
                              revoke.mutate({ memberId: lic.memberId });
                            }
                          }}
                          disabled={revoke.isPending}
                          title="Revocar licencia"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivate.mutate({ memberId: lic.memberId })}
                          disabled={reactivate.isPending}
                          title="Reactivar licencia"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-green-500 hover:bg-green-50 disabled:opacity-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-semibold text-gray-600 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-gray-500">
            {offset + 1}–{Math.min(offset + LIMIT, total)} de {total}
          </span>
          <button
            onClick={() => setOffset(offset + LIMIT)}
            disabled={offset + LIMIT >= total}
            className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-semibold text-gray-600 disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-panel: Detalle de empresa con gestión de licencias ──────────────────
function LicenciasEmpresaDetalle({ companyId, companyName, onBack }: { companyId: number; companyName: string; onBack: () => void }) {
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newLicensesTotal, setNewLicensesTotal] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const utils = trpc.useUtils();

  const { data: detail, isLoading, refetch } = trpc.company.adminGetCompanyDetail.useQuery({ companyId });
  const { data: licData, refetch: refetchLic } = trpc.company.adminGetAllLicenses.useQuery({ companyId, limit: 200 });

  const adjust = trpc.company.adminAdjustLicense.useMutation({
    onSuccess: (res) => {
      toast.success(`Licencias ajustadas: ${res.previousTotal} → ${res.newTotal}`);
      setShowAdjustModal(false);
      setNewLicensesTotal("");
      setAdjustReason("");
      refetch();
      utils.company.adminGetLicensesOverview.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const triggerSync = trpc.company.adminTriggerCompanyBillingSync.useMutation({
    onSuccess: (res) => {
      toast.success(`Sincronizado: ${res.activeLicenses} licencias activas — ${res.totalAmount.toFixed(2)} €`);
      refetch();
      refetchLic();
    },
    onError: e => toast.error(e.message),
  });

  const revoke = trpc.company.adminRevokeLicense.useMutation({
    onSuccess: () => { toast.success("Licencia revocada"); refetch(); refetchLic(); },
    onError: e => toast.error(e.message),
  });

  const reactivate = trpc.company.adminReactivateLicense.useMutation({
    onSuccess: () => { toast.success("Licencia reactivada"); refetch(); refetchLic(); },
    onError: e => toast.error(e.message),
  });

  const licenses = licData?.licenses ?? [];
  const activeCount = licenses.filter(l => l.isActive).length;
  const inactiveCount = licenses.filter(l => !l.isActive).length;

  if (isLoading) return <div className="py-12 text-center text-sm text-gray-400">Cargando empresa...</div>;
  if (!detail) return <div className="py-12 text-center text-sm text-red-400">Empresa no encontrada</div>;

  const company = detail.company;
  const usageRate = company.licensesTotal ? Math.round(((company.licensesActive || 0) / company.licensesTotal) * 100) : 0;
  const prices: Record<string, number> = { starter: 8, business: 6, enterprise: 4.5, corporate: 0 };
  const mrr = (company.licensesActive || 0) * (prices[company.plan] || 0);

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
          ← Volver
        </button>
        <h3 className="text-sm font-bold text-gray-800 flex-1">{companyName}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[company.plan] || "bg-gray-100 text-gray-600"}`}>{company.plan}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[company.status] || "bg-gray-100 text-gray-600"}`}>{company.status}</span>
      </div>

      {/* KPIs de la empresa */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Licencias contratadas" value={company.licensesTotal || 0} color="bg-gray-50 text-gray-800" />
        <KpiCard label="Licencias activas" value={company.licensesActive || 0} sub={`${usageRate}% de uso`} color="bg-green-50 text-green-800" />
        <KpiCard label="MRR empresa" value={`${mrr.toFixed(0)} €`} color="bg-amber-50 text-amber-800" />
        <KpiCard label="Total facturado" value={`${detail.stats.totalBilled.toFixed(0)} €`} color="bg-blue-50 text-blue-800" />
      </div>

      {/* Barra de uso */}
      <div className="vively-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Uso de licencias</span>
          <span className="text-xs text-gray-500">{company.licensesActive || 0} / {company.licensesTotal || 0}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${usageRate >= 90 ? "bg-red-500" : usageRate >= 70 ? "bg-amber-500" : "bg-[#F97316]"}`}
            style={{ width: `${Math.min(100, usageRate)}%` }}
          />
        </div>
        {usageRate >= 90 && (
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Capacidad casi al límite — considera ampliar licencias
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="vively-card flex flex-wrap gap-2">
        <button
          onClick={() => { setNewLicensesTotal(String(company.licensesTotal || 0)); setShowAdjustModal(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F97316] text-white text-xs font-semibold hover:bg-orange-600"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Ajustar licencias
        </button>
        <button
          onClick={() => triggerSync.mutate({ companyId })}
          disabled={triggerSync.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${triggerSync.isPending ? "animate-spin" : ""}`} />
          Sincronizar facturación
        </button>
        <div className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          Código: <span className="font-mono font-bold text-gray-700">{company.accessCode || "—"}</span>
        </div>
      </div>

      {/* Listado de empleados con licencias */}
      <div className="vively-card">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-700">
            Empleados con licencia
            <span className="ml-2 text-xs font-normal text-gray-400">
              {activeCount} activas · {inactiveCount} inactivas
            </span>
          </h4>
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1.5">
          {licenses.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Sin empleados registrados aún</p>
          ) : licenses.map(lic => (
            <div key={lic.memberId} className={`flex items-center justify-between rounded-xl px-3 py-2 ${lic.isActive ? "bg-gray-50" : "bg-red-50/40"}`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${lic.isActive ? "bg-[#F97316]/10 text-[#F97316]" : "bg-gray-200 text-gray-400"}`}>
                  {lic.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{lic.userName || "Sin nombre"}</p>
                  <p className="text-xs text-gray-400 truncate">{lic.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <div className="text-right">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${lic.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {lic.isActive ? "activa" : "inactiva"}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {lic.lastActiveAt ? new Date(lic.lastActiveAt).toLocaleDateString("es-ES") : "Nunca"}
                  </p>
                </div>
                {lic.isActive ? (
                  <button
                    onClick={() => {
                      if (confirm(`¿Revocar licencia de ${lic.userName || lic.userEmail}?`)) {
                        revoke.mutate({ memberId: lic.memberId });
                      }
                    }}
                    disabled={revoke.isPending}
                    title="Revocar licencia"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => reactivate.mutate({ memberId: lic.memberId })}
                    disabled={reactivate.isPending}
                    title="Reactivar licencia"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-green-500 hover:bg-green-100 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de facturación */}
      {detail.snapshots.length > 0 && (
        <div className="vively-card overflow-x-auto">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Historial de facturación</h4>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left py-2 font-semibold">Período</th>
                <th className="text-center py-2 font-semibold">Licencias</th>
                <th className="text-center py-2 font-semibold">€/licencia</th>
                <th className="text-right py-2 font-semibold">Total</th>
                <th className="text-center py-2 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {detail.snapshots.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">
                    {new Date(s.billingPeriodStart).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                  </td>
                  <td className="py-2 text-center text-gray-700">{s.activeLicenses}</td>
                  <td className="py-2 text-center text-gray-600">{s.pricePerLicense.toFixed(2)} €</td>
                  <td className="py-2 text-right font-bold text-gray-900">{s.totalAmount.toFixed(2)} €</td>
                  <td className="py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                      s.status === "paid" ? "bg-green-100 text-green-700" :
                      s.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                      s.status === "disputed" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ajuste de licencias */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Ajustar licencias contratadas</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Empresa: <strong>{companyName}</strong><br />
              Licencias actuales: <strong>{company.licensesTotal}</strong>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Nuevo número de licencias</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={newLicensesTotal}
                  onChange={e => setNewLicensesTotal(e.target.value)}
                  className="vively-input w-full text-sm"
                  placeholder="Ej: 75"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Motivo del ajuste (opcional)</label>
                <textarea
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="vively-input w-full text-sm resize-none"
                  rows={2}
                  placeholder="Ej: Ampliación por crecimiento de plantilla"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const n = parseInt(newLicensesTotal);
                  if (!n || n < 1) { toast.error("Introduce un número válido"); return; }
                  adjust.mutate({ companyId, licensesTotal: n, reason: adjustReason || undefined });
                }}
                disabled={adjust.isPending}
                className="flex-1 py-2 rounded-xl bg-[#F97316] text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50"
              >
                {adjust.isPending ? "Guardando..." : "Confirmar ajuste"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel principal exportado ────────────────────────────────────────────────
type SubTab = "resumen" | "listado" | "empresa";

export default function AdminLicenciasPanel() {
  const [subTab, setSubTab] = useState<SubTab>("resumen");
  const [selectedCompany, setSelectedCompany] = useState<{ id: number; name: string } | null>(null);

  const handleSelectCompany = (id: number, name: string) => {
    setSelectedCompany({ id, name });
    setSubTab("empresa");
  };

  const handleBack = () => {
    setSelectedCompany(null);
    setSubTab("listado");
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      {subTab !== "empresa" && (
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "resumen" as SubTab, label: "📊 Resumen global" },
            { key: "listado" as SubTab, label: "📋 Todas las licencias" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                subTab === t.key ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {subTab === "resumen" && <LicenciasResumen />}
      {subTab === "listado" && <LicenciasListado onSelectCompany={handleSelectCompany} />}
      {subTab === "empresa" && selectedCompany && (
        <LicenciasEmpresaDetalle
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
