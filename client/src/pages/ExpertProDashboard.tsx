// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  TrendingUp, Users, DollarSign, Activity, AlertTriangle,
  Plus, FileText, CheckCircle, Clock, XCircle, Send,
  BarChart2, Target, Calendar, ArrowLeft, Trash2,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  draft:     { label: "Borrador",  color: "bg-gray-100 text-gray-600",    icon: FileText },
  sent:      { label: "Enviada",   color: "bg-blue-100 text-blue-700",    icon: Send },
  paid:      { label: "Cobrada",   color: "bg-green-100 text-green-700",  icon: CheckCircle },
  overdue:   { label: "Vencida",   color: "bg-red-100 text-red-700",      icon: AlertTriangle },
  cancelled: { label: "Anulada",   color: "bg-gray-100 text-gray-400",    icon: XCircle },
};

const OBJECTIVE_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

export default function ExpertProDashboard() {
  const [, nav] = useLocation();
  const [activeTab, setActiveTab] = useState<"kpis" | "invoices" | "stats">("kpis");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: "",
    concept: "",
    amount: "",
    dueAt: "",
    notes: "",
  });

  const { data: kpis, isLoading: kpisLoading } = trpc.expertPro.getExpertKPIs.useQuery();
  const { data: invoices = [], refetch: refetchInvoices } = trpc.expertPro.listInvoices.useQuery({ limit: 50 });
  const { data: stats } = trpc.expertPro.getPortfolioStats.useQuery();
  const { data: offlinePatients = [] } = trpc.offlinePatients.list.useQuery();

  const createInvoice = trpc.expertPro.createInvoice.useMutation({
    onSuccess: () => {
      toast.success("Factura creada");
      setShowNewInvoice(false);
      setInvoiceForm({ patientId: "", concept: "", amount: "", dueAt: "", notes: "" });
      refetchInvoices();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.expertPro.updateInvoiceStatus.useMutation({
    onSuccess: () => { toast.success("Estado actualizado"); refetchInvoices(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteInvoice = trpc.expertPro.deleteInvoice.useMutation({
    onSuccess: () => { toast.success("Factura eliminada"); refetchInvoices(); },
    onError: (e) => toast.error(e.message),
  });

  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const pendingRevenue = invoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  // Agrupar facturas por mes para el gráfico
  const revenueByMonth = invoices
    .filter(i => i.status === "paid")
    .reduce((acc: Record<string, number>, inv) => {
      const month = new Date(inv.issuedAt).toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
      acc[month] = (acc[month] ?? 0) + inv.amount;
      return acc;
    }, {});
  const revenueChart = Object.entries(revenueByMonth).map(([month, total]) => ({ month, total }));

  const objectiveData = stats?.byObjective ?? [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("/app/expert/dashboard")} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart2 size={22} className="text-orange-500" />
              Panel de Negocio
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">KPIs, facturación y estadísticas de tu cartera</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/40 rounded-xl p-1 mb-6 w-fit">
          {[
            { id: "kpis", label: "📊 KPIs", },
            { id: "invoices", label: "💶 Facturación" },
            { id: "stats", label: "📈 Cartera" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white shadow text-orange-600"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── KPIs ── */}
        {activeTab === "kpis" && (
          <div className="space-y-6">
            {kpisLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard icon={Users} label="Pacientes activos" value={kpis?.activePatients ?? 0} color="orange" />
                  <KpiCard icon={TrendingUp} label="Nuevos este mes" value={kpis?.newPatientsThisMonth ?? 0} color="blue" />
                  <KpiCard icon={Activity} label="Adherencia media" value={`${kpis?.avgAdherence ?? 0}%`} color="green" />
                  <KpiCard icon={AlertTriangle} label="Sin registrar +7d" value={kpis?.patientsWithoutLog ?? 0} color="red" alert={(kpis?.patientsWithoutLog ?? 0) > 0} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard icon={Target} label="Objetivo alcanzado" value={`${kpis?.patientsOnTrack ?? 0}%`} color="green" sub="de pacientes en meta" />
                  <KpiCard icon={DollarSign} label="Ingresos cobrados" value={`${totalRevenue.toFixed(0)}€`} color="orange" />
                  <KpiCard icon={Clock} label="Pendiente de cobro" value={`${pendingRevenue.toFixed(0)}€`} color="amber" />
                  <KpiCard icon={Calendar} label="Citas este mes" value={kpis?.appointmentsThisMonth ?? 0} color="blue" />
                </div>

                {/* Alertas de pacientes sin registrar */}
                {(kpis?.patientsWithoutLogList?.length ?? 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                    <h3 className="text-sm font-bold text-red-800 mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} /> Pacientes sin registrar datos ({kpis.patientsWithoutLogList.length})
                    </h3>
                    <div className="space-y-2">
                      {kpis.patientsWithoutLogList.slice(0, 5).map((p: any) => (
                        <div
                          key={p.id}
                          onClick={() => nav(`/app/expert/offline-patients/${p.id}`)}
                          className="flex items-center justify-between bg-white rounded-xl px-3 py-2 cursor-pointer hover:bg-red-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                          <span className="text-xs text-red-600 font-semibold">
                            {p.daysWithoutLog >= 999 ? "Nunca registró" : `${p.daysWithoutLog} días sin registrar`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── FACTURAS ── */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-green-700 font-medium">Cobrado</p>
                  <p className="text-lg font-black text-green-700">{totalRevenue.toFixed(0)}€</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-amber-700 font-medium">Pendiente</p>
                  <p className="text-lg font-black text-amber-700">{pendingRevenue.toFixed(0)}€</p>
                </div>
              </div>
              <Button
                onClick={() => setShowNewInvoice(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
              >
                <Plus size={14} /> Nueva factura
              </Button>
            </div>

            {/* Gráfico de ingresos */}
            {revenueChart.length > 1 && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <h3 className="text-sm font-bold text-foreground mb-3">Ingresos cobrados por mes</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                    <Tooltip formatter={(v: number) => [`${v}€`, "Ingresos"]} />
                    <Area type="monotone" dataKey="total" stroke="#F97316" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Lista de facturas */}
            <div className="space-y-2">
              {invoices.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-2xl border border-dashed border-border">
                  <FileText size={36} className="mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">Aún no has creado ninguna factura</p>
                  <Button onClick={() => setShowNewInvoice(true)} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white">
                    Crear primera factura
                  </Button>
                </div>
              ) : (
                invoices.map(inv => {
                  const s = STATUS_LABELS[inv.status] ?? STATUS_LABELS.draft;
                  const Icon = s.icon;
                  return (
                    <div key={inv.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{inv.invoiceNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${s.color}`}>
                            <Icon size={10} /> {s.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{inv.concept}</p>
                        <p className="text-xs text-muted-foreground/70">
                          {new Date(inv.issuedAt).toLocaleDateString("es-ES")}
                          {inv.dueAt && ` · Vence: ${new Date(inv.dueAt).toLocaleDateString("es-ES")}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black text-foreground">{inv.amount.toFixed(0)}€</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {inv.status === "sent" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: inv.id, status: "paid" })}
                            className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-semibold hover:bg-green-200 transition-colors"
                          >
                            Cobrada
                          </button>
                        )}
                        {inv.status === "draft" && (
                          <button
                            onClick={() => updateStatus.mutate({ id: inv.id, status: "sent" })}
                            className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition-colors"
                          >
                            Enviar
                          </button>
                        )}
                        <button
                          onClick={() => { if (confirm("¿Eliminar factura?")) deleteInvoice.mutate({ id: inv.id }); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── ESTADÍSTICAS DE CARTERA ── */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Por objetivo */}
              {objectiveData.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-foreground mb-4">Distribución por objetivo</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={objectiveData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="count"
                        nameKey="objective"
                      >
                        {objectiveData.map((_: any, i: number) => (
                          <Cell key={i} fill={OBJECTIVE_COLORS[i % OBJECTIVE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, name: string) => [v, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Por género */}
              {stats?.byGender && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-foreground mb-4">Distribución por género</h3>
                  <div className="space-y-3">
                    {stats.byGender.map((g: any) => (
                      <div key={g.gender} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-20 capitalize">{g.gender ?? "No especificado"}</span>
                        <div className="flex-1 bg-muted/40 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-orange-400"
                            style={{ width: `${Math.round((g.count / (stats.totalPatients || 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-foreground w-8 text-right">{g.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resumen numérico */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBox label="Total pacientes" value={stats.totalPatients ?? 0} />
                <StatBox label="Con cuenta Buddy" value={stats.withBuddyAccount ?? 0} />
                <StatBox label="Invitaciones enviadas" value={stats.invitesSent ?? 0} />
                <StatBox label="Edad media" value={stats.avgAge ? `${stats.avgAge} años` : "—"} />
              </div>
            )}

            {/* Evolución media de peso */}
            {stats?.avgWeightLoss !== undefined && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center">
                    <TrendingUp size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Pérdida media de peso en tu cartera</p>
                    <p className="text-3xl font-black text-green-700">
                      {stats.avgWeightLoss > 0 ? "-" : "+"}{Math.abs(stats.avgWeightLoss).toFixed(1)} kg
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">Promedio de todos los pacientes con seguimiento</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nueva factura */}
      <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Paciente</Label>
              <select
                value={invoiceForm.patientId}
                onChange={e => setInvoiceForm(f => ({ ...f, patientId: e.target.value }))}
                className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm bg-background"
              >
                <option value="">Seleccionar paciente...</option>
                {offlinePatients.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name ?? p.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Concepto *</Label>
              <Input
                value={invoiceForm.concept}
                onChange={e => setInvoiceForm(f => ({ ...f, concept: e.target.value }))}
                placeholder="Ej: Consulta nutricional + plan mensual"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Importe (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={invoiceForm.amount}
                  onChange={e => setInvoiceForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="60.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Fecha vencimiento</Label>
                <Input
                  type="date"
                  value={invoiceForm.dueAt}
                  onChange={e => setInvoiceForm(f => ({ ...f, dueAt: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                value={invoiceForm.notes}
                onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observaciones..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewInvoice(false)}>Cancelar</Button>
            <Button
              onClick={() => createInvoice.mutate({
                patientId: parseInt(invoiceForm.patientId),
                concept: invoiceForm.concept,
                amount: parseFloat(invoiceForm.amount),
                dueAt: invoiceForm.dueAt || undefined,
                notes: invoiceForm.notes || undefined,
              })}
              disabled={!invoiceForm.patientId || !invoiceForm.concept || !invoiceForm.amount || createInvoice.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createInvoice.isPending ? "Creando..." : "Crear factura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function KpiCard({ icon: Icon, label, value, color = "orange", sub, alert = false }: any) {
  const colors: Record<string, string> = {
    orange: "bg-orange-100 text-orange-600",
    blue:   "bg-blue-100 text-blue-600",
    green:  "bg-green-100 text-green-600",
    red:    "bg-red-100 text-red-600",
    amber:  "bg-amber-100 text-amber-600",
  };
  return (
    <div className={`bg-card border rounded-2xl p-4 relative overflow-hidden ${alert ? "border-red-300" : "border-border"}`}>
      {alert && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colors[color] ?? colors.orange}`}>
        <Icon size={16} />
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
