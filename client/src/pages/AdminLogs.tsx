import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { toast } from "sonner";

type LogLevel = "all" | "debug" | "info" | "warn" | "error" | "fatal";

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  debug:  { label: "DEBUG",  color: "#6b7280", bg: "#f3f4f6", dot: "#6b7280" },
  info:   { label: "INFO",   color: "#2563eb", bg: "#eff6ff", dot: "#3b82f6" },
  warn:   { label: "WARN",   color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  error:  { label: "ERROR",  color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
  fatal:  { label: "FATAL",  color: "#7c3aed", bg: "#faf5ff", dot: "#8b5cf6" },
};

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.info;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.dot}30` }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full inline-block" />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f0ebe3]">
      <p className="text-xs text-[#9c8c7a] font-medium uppercase tracking-wide mb-1">{label}</p>
      <p style={{ color: color ?? "#1a1a1a" }} className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-[#9c8c7a] mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminLogs() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [level, setLevel] = useState<LogLevel>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [resolved, setResolved] = useState<boolean | undefined>(undefined);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const LIMIT = 50;

  // Redirect non-admins
  if (user && user.role !== "admin") {
    navigate("/");
    return null;
  }

  const { data: stats } = trpc.logs.stats.useQuery(undefined, { refetchInterval: 30000 });
  const { data, isLoading, refetch } = trpc.logs.list.useQuery({
    level,
    search: debouncedSearch || undefined,
    resolved,
    from: from || undefined,
    to: to || undefined,
    limit: LIMIT,
    offset: page * LIMIT,
  }, { refetchInterval: 30000 });

  const resolveMutation = trpc.logs.resolve.useMutation({
    onSuccess: () => { toast.success("Marcado como resuelto"); refetch(); },
    onError: () => toast.error("Error al resolver"),
  });

  const clearMutation = trpc.logs.clearOld.useMutation({
    onSuccess: () => { toast.success("Logs antiguos eliminados"); refetch(); },
    onError: () => toast.error("Error al limpiar"),
  });
  const resolveAllMutation = trpc.logs.resolveAll.useMutation({
    onSuccess: () => { toast.success("Todos los errores marcados como resueltos"); refetch(); },
    onError: () => toast.error("Error al resolver todos"),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer);
    (window as { _searchTimer?: ReturnType<typeof setTimeout> })._searchTimer = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(0);
    }, 400);
  };

  return (
    <AppLayout title="Logs del Servidor">
      <div className="min-h-screen" style={{ background: "#faf8f5" }}>
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1a1a]">Registros del Servidor</h1>
              <p className="text-sm text-[#9c8c7a] mt-0.5">Monitorización de errores y eventos en tiempo real</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#e8e0d5] bg-white text-sm font-medium text-[#5a4a3a] hover:bg-[#faf0e8] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
              <button
                onClick={() => { if (confirm("¿Marcar todos los errores sin resolver como resueltos?")) resolveAllMutation.mutate({ level: level !== "all" ? level : undefined }); }}
                disabled={resolveAllMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-green-200 bg-green-50 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolver todos
              </button>
              <button
                onClick={() => { if (confirm("¿Eliminar logs de más de 30 días?")) clearMutation.mutate({ olderThanDays: 30 }); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar &gt;30d
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total logs" value={stats.total} />
              <StatCard label="Últimas 24h" value={stats.last24h} sub="nuevos" />
              <StatCard label="Últimos 7 días" value={stats.last7d} sub="acumulados" />
              <StatCard label="Errores sin resolver" value={stats.unresolvedErrors} color="#dc2626" />
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f0ebe3]">
                <p className="text-xs text-[#9c8c7a] font-medium uppercase tracking-wide mb-2">Por nivel</p>
                <div className="space-y-1">
                  {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => (
                    <div key={lvl} className="flex items-center justify-between text-xs">
                      <span style={{ color: cfg.color }} className="font-semibold">{cfg.label}</span>
                      <span className="text-[#5a4a3a] font-medium">{stats.byLevel[lvl] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f0ebe3] flex flex-wrap gap-3 items-center">
            {/* Level tabs */}
            <div className="flex gap-1 bg-[#faf8f5] rounded-xl p-1">
              {(["all", "error", "warn", "info", "debug", "fatal"] as LogLevel[]).map((l) => (
                <button
                  key={l}
                  onClick={() => { setLevel(l); setPage(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${level === l ? "bg-[#F97316] text-white shadow-sm" : "text-[#9c8c7a] hover:text-[#5a4a3a]"}`}
                >
                  {l === "all" ? "Todos" : l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9c8c7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar en mensajes..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e8e0d5] text-sm bg-[#faf8f5] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
              />
            </div>

            {/* Date range */}
            <input type="datetime-local" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-xl border border-[#e8e0d5] text-xs bg-[#faf8f5] text-[#5a4a3a] focus:outline-none focus:border-[#F97316]" />
            <span className="text-[#9c8c7a] text-xs">→</span>
            <input type="datetime-local" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }}
              className="px-3 py-2 rounded-xl border border-[#e8e0d5] text-xs bg-[#faf8f5] text-[#5a4a3a] focus:outline-none focus:border-[#F97316]" />

            {/* Resolved filter */}
            <select
              value={resolved === undefined ? "all" : resolved ? "resolved" : "unresolved"}
              onChange={(e) => {
                setResolved(e.target.value === "all" ? undefined : e.target.value === "resolved");
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl border border-[#e8e0d5] text-xs bg-[#faf8f5] text-[#5a4a3a] focus:outline-none focus:border-[#F97316]"
            >
              <option value="all">Todos los estados</option>
              <option value="unresolved">Sin resolver</option>
              <option value="resolved">Resueltos</option>
            </select>

            {/* Total */}
            <span className="ml-auto text-xs text-[#9c8c7a] font-medium">
              {data?.total ?? 0} registros
            </span>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#f0ebe3] overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !data?.logs.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-[#9c8c7a]">
                <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm font-medium">No hay registros</p>
                <p className="text-xs mt-1">Ajusta los filtros para ver más resultados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0ebe3] bg-[#faf8f5]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8c7a] uppercase tracking-wide w-28">Nivel</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8c7a] uppercase tracking-wide">Mensaje</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8c7a] uppercase tracking-wide w-32 hidden md:table-cell">Ruta</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8c7a] uppercase tracking-wide w-20 hidden md:table-cell">Código</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8c7a] uppercase tracking-wide w-36">Fecha</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[#9c8c7a] uppercase tracking-wide w-24">Estado</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map((log) => (
                      <>
                        <tr
                          key={log.id}
                          onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          className={`border-b border-[#f0ebe3] cursor-pointer transition-colors ${log.resolved ? "opacity-50" : ""} ${expandedId === log.id ? "bg-[#fff8f2]" : "hover:bg-[#faf8f5]"}`}
                        >
                          <td className="px-4 py-3"><LevelBadge level={log.level} /></td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="truncate text-[#1a1a1a] font-medium">{log.message}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-xs text-[#9c8c7a] font-mono truncate block max-w-[120px]">
                              {log.method && <span className="text-[#F97316] font-semibold mr-1">{log.method}</span>}
                              {log.path ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {log.statusCode ? (
                              <span className={`text-xs font-bold ${log.statusCode >= 500 ? "text-red-600" : log.statusCode >= 400 ? "text-amber-600" : "text-green-600"}`}>
                                {log.statusCode}
                              </span>
                            ) : <span className="text-[#9c8c7a]">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#9c8c7a]">
                            {new Date(log.createdAt).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            {log.resolved ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Resuelto
                              </span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); resolveMutation.mutate({ id: log.id }); }}
                                className="text-xs text-[#F97316] font-medium hover:underline"
                              >
                                Resolver
                              </button>
                            )}
                          </td>
                          <td className="px-2 py-3 text-[#9c8c7a]">
                            <svg className={`w-4 h-4 transition-transform ${expandedId === log.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </td>
                        </tr>
                        {expandedId === log.id && (
                          <tr key={`${log.id}-detail`} className="bg-[#fff8f2]">
                            <td colSpan={7} className="px-4 py-4">
                              <div className="space-y-3">
                                {/* Metadata row */}
                                <div className="flex flex-wrap gap-4 text-xs text-[#9c8c7a]">
                                  {log.userId && <span><strong className="text-[#5a4a3a]">Usuario ID:</strong> {log.userId}</span>}
                                  {log.ip && <span><strong className="text-[#5a4a3a]">IP:</strong> {log.ip}</span>}
                                  {log.userAgent && <span className="truncate max-w-xs"><strong className="text-[#5a4a3a]">User-Agent:</strong> {log.userAgent}</span>}
                                  <span><strong className="text-[#5a4a3a]">ID:</strong> #{log.id}</span>
                                  <span><strong className="text-[#5a4a3a]">Fecha completa:</strong> {new Date(log.createdAt).toLocaleString("es-ES")}</span>
                                </div>
                                {/* Stack trace */}
                                {log.stack && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#5a4a3a] mb-1">Stack trace:</p>
                                    <pre className="text-xs bg-[#1a1a1a] text-[#e5e7eb] rounded-xl p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                                      {log.stack}
                                    </pre>
                                  </div>
                                )}
                                {/* Metadata JSON */}
                                {log.metadata && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#5a4a3a] mb-1">Metadata:</p>
                                    <pre className="text-xs bg-[#f3f4f6] text-[#374151] rounded-xl p-3 overflow-x-auto whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                                      {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0ebe3]">
                <p className="text-xs text-[#9c8c7a]">
                  Mostrando {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, data?.total ?? 0)} de {data?.total ?? 0}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#e8e0d5] text-xs font-medium text-[#5a4a3a] disabled:opacity-40 hover:bg-[#faf0e8] transition-colors"
                  >
                    ← Anterior
                  </button>
                  <span className="px-3 py-1.5 text-xs text-[#9c8c7a]">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-[#e8e0d5] text-xs font-medium text-[#5a4a3a] disabled:opacity-40 hover:bg-[#faf0e8] transition-colors"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
