import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, Bell, CheckCircle, Clock, User, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { Link } from "wouter";

const ALERT_ICONS: Record<string, any> = {
  no_diary: Clock,
  weight_change: TrendingDown,
  no_checkin: Calendar,
  appointment_unconfirmed: Bell,
};
const ALERT_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  low: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
};
const SEVERITY_LABELS: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" };

export default function PatientAlerts() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const { data: alerts, isLoading } = trpc.expertEnhanced.getPatientAlerts.useQuery(undefined, { enabled: !!user });
  const dismissMutation = trpc.expertEnhanced.dismissAlert.useMutation({
    onSuccess: () => alerts && window.location.reload(),
  });

  const filtered = (alerts || []).filter((a: any) => filter === "all" || a.severity === filter);
  const counts = { high: 0, medium: 0, low: 0 };
  (alerts || []).forEach((a: any) => { if (a.severity in counts) counts[a.severity as keyof typeof counts]++; });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 dark:from-slate-950 dark:to-red-950/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-500" /> Alertas de Pacientes</h1>
            <p className="text-sm text-muted-foreground">Pacientes que requieren tu atención</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "high", label: "Urgentes", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/50" },
            { key: "medium", label: "Moderadas", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/50" },
            { key: "low", label: "Informativas", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/50" },
          ].map(s => (
            <Card key={s.key} className={`cursor-pointer transition-all ${filter === s.key ? "ring-2 ring-primary" : ""} ${s.bg}`}
              onClick={() => setFilter(filter === s.key ? "all" : s.key as any)}>
              <CardContent className="py-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alert List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Todo en orden</p>
              <p className="text-sm text-muted-foreground/70 mt-1">No hay alertas {filter !== "all" ? `de prioridad ${SEVERITY_LABELS[filter]?.toLowerCase()}` : ""} pendientes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((alert: any) => {
              const Icon = ALERT_ICONS[alert.type] || AlertTriangle;
              return (
                <Card key={alert.id} className={`border ${ALERT_COLORS[alert.severity] || ""}`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-background/50">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Link href={`/app/expert/patients/${alert.patientRelId || ""}`}>
                            <span className="font-semibold text-sm hover:underline cursor-pointer flex items-center gap-1">
                              <User className="w-3 h-3" /> {alert.patientName || "Paciente"}
                            </span>
                          </Link>
                          <Badge variant="outline" className="text-[10px]">{SEVERITY_LABELS[alert.severity]}</Badge>
                        </div>
                        <p className="text-sm">{alert.message}</p>
                        {alert.details && <p className="text-xs text-muted-foreground/80 mt-0.5">{alert.details}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {alert.createdAt ? new Date(alert.createdAt).toLocaleString("es-ES") : ""}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0 text-xs"
                        onClick={() => dismissMutation.mutate({ alertId: alert.id })}
                        disabled={dismissMutation.isPending}>
                        Descartar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
