import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid, ExclamationCircleIcon as ExclamationSolid } from "@heroicons/react/24/solid";

// ─── Status helpers ───────────────────────────────────────────────────────────
function StatusBadge({ status, failCount }: { status: string | null; failCount: number }) {
  if (!status) return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">Sin datos</span>;
  if (status === "ok") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold text-green-700">
      <CheckCircleSolid className="h-3 w-3" /> OK
    </span>
  );
  if (failCount >= 3) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-700">
      <ExclamationSolid className="h-3 w-3" /> CRÍTICO ({failCount} fallos)
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-bold text-yellow-700">
      <ExclamationCircleIcon className="h-3 w-3" /> ERROR
    </span>
  );
}

function LatencyBar({ latency }: { latency: number | null }) {
  if (!latency) return <span className="text-xs text-muted-foreground">—</span>;
  const color = latency < 500 ? "bg-green-500" : latency < 1500 ? "bg-yellow-500" : "bg-red-500";
  const width = Math.min((latency / 3000) * 100, 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{latency}ms</span>
    </div>
  );
}

// ─── Monitor Row ──────────────────────────────────────────────────────────────
function MonitorRow({ monitor }: { monitor: any }) {
  const [expanded, setExpanded] = useState(false);
  const utils = trpc.useUtils();

  const recheck = trpc.admin.recheckApi.useMutation({
    onSuccess: (data) => {
      toast.success(`Recheck completado: ${data.status} (${data.latencyMs}ms)`);
      utils.admin.getApiMonitors.invalidate();
    },
    onError: () => toast.error("Error al hacer recheck"),
  });

  const toggleActive = trpc.admin.toggleApiMonitor.useMutation({
    onSuccess: () => utils.admin.getApiMonitors.invalidate(),
    onError: () => toast.error("Error al cambiar estado"),
  });

  const { data: logs } = trpc.admin.getApiHealthLogs.useQuery(
    { monitorId: monitor.id },
    { enabled: expanded }
  );

  const failCount = monitor.failCount ?? 0;
  const lastChecked = monitor.lastCheckedAt ? new Date(monitor.lastCheckedAt).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Nunca";

  return (
    <div className={`rounded-2xl border transition-all ${!monitor.isActive ? "opacity-50" : failCount >= 3 ? "border-red-200 bg-red-50/30" : "border-border bg-background"}`}>
      <div className="flex items-center gap-3 p-4">
        {/* Status indicator */}
        <div className={`h-3 w-3 rounded-full flex-shrink-0 ${
          !monitor.isActive ? "bg-muted" :
          monitor.lastStatus === "ok" ? "bg-green-500" :
          monitor.lastStatus ? "bg-red-500" : "bg-muted"
        }`} />

        {/* Name & endpoint */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{monitor.name}</p>
            <StatusBadge status={monitor.lastStatus} failCount={failCount} />
            {!monitor.isActive && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">Pausado</span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{monitor.endpoint}</p>
          <div className="mt-1 flex items-center gap-3">
            <LatencyBar latency={monitor.lastLatencyMs} />
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <ClockIcon className="h-3 w-3" /> {lastChecked}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => recheck.mutate({ monitorId: monitor.id })}
            disabled={recheck.isPending}
            className="flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/80 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${recheck.isPending ? "animate-spin" : ""}`} />
            Recheck
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted/80"
          >
            {expanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
            Historial
          </button>
          <button
            onClick={() => toggleActive.mutate({ monitorId: monitor.id, isActive: !monitor.isActive })}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
              monitor.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"
            }`}
          >
            {monitor.isActive ? "Pausar" : "Activar"}
          </button>
        </div>
      </div>

      {/* Historial expandible */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <p className="mb-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Últimas 24h</p>
          {!logs ? (
            <p className="text-xs text-muted-foreground">Cargando...</p>
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin registros</p>
          ) : (
            <div className="space-y-1.5">
              {logs.slice(0, 20).map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                  {log.status === "ok" ? (
                    <CheckCircleSolid className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                  ) : (
                    <ExclamationSolid className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                  )}
                  <span className="text-[11px] font-semibold text-foreground">{log.status?.toUpperCase()}</span>
                  <span className="text-[11px] text-muted-foreground">{log.latencyMs}ms</span>
                  {log.errorMessage && (
                    <span className="flex-1 truncate text-[11px] text-red-600">{log.errorMessage}</span>
                  )}
                  <span className="ml-auto text-[10px] text-muted-foreground/70">
                    {new Date(log.checkedAt).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminApiMonitor() {
  const { data: monitors, isLoading, refetch } = trpc.admin.getApiMonitors.useQuery();

  const total = monitors?.length ?? 0;
  const ok = monitors?.filter((m: any) => m.lastStatus === "ok").length ?? 0;
  const failing = monitors?.filter((m: any) => m.lastStatus && m.lastStatus !== "ok").length ?? 0;
  const critical = monitors?.filter((m: any) => (m.failCount ?? 0) >= 3).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-foreground">Monitor de APIs</h1>
          <p className="text-sm text-muted-foreground">Estado de todos los endpoints críticos de BuddyMarket</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/80">
          <ArrowPathIcon className="h-4 w-4" /> Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: total, color: "text-foreground", bg: "bg-muted/40" },
          { label: "Operativos", value: ok, color: "text-green-600", bg: "bg-green-50" },
          { label: "Con errores", value: failing, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Críticos", value: critical, color: "text-red-600", bg: "bg-red-50" },
        ].map(card => (
          <div key={card.label} className={`rounded-2xl p-3 text-center ${card.bg}`}>
            <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
            <p className="text-[10px] font-semibold text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Availability bar */}
      {total > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><SignalIcon className="h-3.5 w-3.5" /> Disponibilidad global</span>
            <span className="font-bold text-foreground">{Math.round((ok / total) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${ok / total > 0.9 ? "bg-green-500" : ok / total > 0.7 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${(ok / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Monitors list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : !monitors || monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/40">
            <SignalIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Sin monitores configurados</p>
          <p className="mt-1 text-xs text-muted-foreground">Los monitores se crean automáticamente al iniciar el servidor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Critical first */}
          {monitors.filter((m: any) => (m.failCount ?? 0) >= 3).map((m: any) => (
            <MonitorRow key={m.id} monitor={m} />
          ))}
          {/* Then errors */}
          {monitors.filter((m: any) => m.lastStatus && m.lastStatus !== "ok" && (m.failCount ?? 0) < 3).map((m: any) => (
            <MonitorRow key={m.id} monitor={m} />
          ))}
          {/* Then ok */}
          {monitors.filter((m: any) => m.lastStatus === "ok").map((m: any) => (
            <MonitorRow key={m.id} monitor={m} />
          ))}
          {/* Then no data */}
          {monitors.filter((m: any) => !m.lastStatus).map((m: any) => (
            <MonitorRow key={m.id} monitor={m} />
          ))}
        </div>
      )}
    </div>
  );
}
