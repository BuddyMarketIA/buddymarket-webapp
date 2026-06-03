import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Mail, MessageCircle, Sparkles, Plus, Trash2,
  Scale, TrendingDown, TrendingUp, Send, ChevronDown, ChevronUp,
  UserCheck, Copy, ExternalLink,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getMonday(d = new Date()) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function WeightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, color: "#6b7280" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#F97316" }}>{payload[0]?.value} kg</p>
    </div>
  );
}

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const patientId = parseInt(params.id ?? "0");
  const [, nav] = useLocation();

  const [showAddWeight, setShowAddWeight] = useState(false);
  const [weightForm, setWeightForm] = useState({ weightKg: "", bodyFatPct: "", waistCm: "", notes: "", recordedAt: new Date().toISOString().split("T")[0] });
  const [showMenuGen, setShowMenuGen] = useState(false);
  const [menuGenForm, setMenuGenForm] = useState({ durationWeeks: 1, extraInstructions: "" });
  const [generatedMenu, setGeneratedMenu] = useState<any>(null);
  const [showSendModal, setShowSendModal] = useState<"email" | "whatsapp" | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [waMessage, setWaMessage] = useState<{ text: string; waUrl: string | null } | null>(null);
  const [showInviteConfirm, setShowInviteConfirm] = useState(false);

  const monday = addDays(getMonday(), weekOffset * 7);
  const sunday = addDays(monday, 6);

  const { data: patient, isLoading } = trpc.offlinePatients.getById.useQuery({ id: patientId }, { enabled: !!patientId });
  const { data: weightHistory = [], refetch: refetchWeight } = trpc.offlinePatients.getWeightHistory.useQuery({ patientId }, { enabled: !!patientId });
  const { data: plansSent = [] } = trpc.offlinePatients.getPlansSent.useQuery({ patientId }, { enabled: !!patientId });

  const addWeight = trpc.offlinePatients.addWeightRecord.useMutation({
    onSuccess: () => { toast.success("Peso registrado"); setShowAddWeight(false); setWeightForm({ weightKg: "", bodyFatPct: "", waistCm: "", notes: "", recordedAt: new Date().toISOString().split("T")[0] }); refetchWeight(); },
    onError: (e) => toast.error(e.message),
  });

  const generateMenu = trpc.offlinePatients.generatePatientMenu.useMutation({
    onSuccess: (data) => { setGeneratedMenu(data.menuData); toast.success("Menú generado"); },
    onError: (e) => toast.error("Error al generar: " + e.message),
  });

  const sendEmail = trpc.offlinePatients.sendPlanByEmail.useMutation({
    onSuccess: () => { toast.success("Plan enviado por email"); setShowSendModal(null); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const getWhatsApp = trpc.offlinePatients.getWhatsAppMessage.useMutation({
    onSuccess: (data) => { setWaMessage(data); setShowSendModal(null); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const sendInvite = trpc.offlinePatients.sendInvite.useMutation({
    onSuccess: () => { toast.success("Invitación enviada"); setShowInviteConfirm(false); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  if (isLoading) return (
    <AppLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </AppLayout>
  );

  if (!patient) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-8">
        <div className="text-5xl">👤</div>
        <h2 className="text-xl font-bold text-foreground">Paciente no encontrado</h2>
        <button onClick={() => nav("/app/expert/patients")} className="px-6 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm">Volver</button>
      </div>
    </AppLayout>
  );

  // Weight chart data
  const chartData = weightHistory.map((w) => ({
    date: new Date(w.recordedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    peso: w.weightKg,
  }));

  const firstWeight = weightHistory[0]?.weightKg;
  const lastWeight = weightHistory[weightHistory.length - 1]?.weightKg;
  const weightChange = firstWeight && lastWeight ? (lastWeight - firstWeight).toFixed(1) : null;
  const isLoss = weightChange !== null && parseFloat(weightChange) < 0;

  const days = generatedMenu?.days ?? [];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("/app/expert/patients")} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black text-lg flex-shrink-0">
            {patient.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-foreground truncate">{patient.name}</h1>
            <p className="text-xs text-muted-foreground">{[patient.email, patient.phone].filter(Boolean).join(" · ")}</p>
          </div>
          {!patient.inviteAcceptedAt && patient.email && (
            <button
              onClick={() => setShowInviteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors"
            >
              <UserCheck size={13} /> Invitar
            </button>
          )}
          {patient.inviteAcceptedAt && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-xl bg-green-50 text-green-600 text-xs font-bold">
              <UserCheck size={12} /> En Buddy
            </span>
          )}
        </div>

        {/* Patient info cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Peso inicial", value: patient.initialWeightKg ? `${patient.initialWeightKg} kg` : "—" },
            { label: "Peso objetivo", value: patient.targetWeightKg ? `${patient.targetWeightKg} kg` : "—" },
            { label: "Altura", value: patient.heightCm ? `${patient.heightCm} cm` : "—" },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-2xl p-3 border border-border text-center">
              <p className="text-lg font-black text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Objective & notes */}
        {(patient.objective || patient.allergies || patient.pathologies) && (
          <div className="bg-card rounded-2xl p-4 border border-border mb-6 space-y-2">
            {patient.objective && <p className="text-sm"><span className="font-bold text-foreground">Objetivo:</span> <span className="text-muted-foreground">{patient.objective}</span></p>}
            {patient.allergies && <p className="text-sm"><span className="font-bold text-foreground">Alergias:</span> <span className="text-muted-foreground">{patient.allergies}</span></p>}
            {patient.pathologies && <p className="text-sm"><span className="font-bold text-foreground">Patologías:</span> <span className="text-muted-foreground">{patient.pathologies}</span></p>}
            {patient.medications && <p className="text-sm"><span className="font-bold text-foreground">Medicación:</span> <span className="text-muted-foreground">{patient.medications}</span></p>}
          </div>
        )}

        {/* ─── Weight History ─────────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-orange-500" />
              <h2 className="text-base font-black text-foreground">Evolución de peso</h2>
              {weightChange !== null && (
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isLoss ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {isLoss ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                  {isLoss ? "" : "+"}{weightChange} kg
                </span>
              )}
            </div>
            <button
              onClick={() => setShowAddWeight(!showAddWeight)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              <Plus size={12} /> Registrar
            </button>
          </div>

          {showAddWeight && (
            <div className="bg-muted/30 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Peso (kg) *</label>
                  <input type="number" step="0.1" value={weightForm.weightKg} onChange={(e) => setWeightForm((p) => ({ ...p, weightKg: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="72.5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">% Grasa</label>
                  <input type="number" step="0.1" value={weightForm.bodyFatPct} onChange={(e) => setWeightForm((p) => ({ ...p, bodyFatPct: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="22.0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Cintura (cm)</label>
                  <input type="number" step="0.5" value={weightForm.waistCm} onChange={(e) => setWeightForm((p) => ({ ...p, waistCm: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="80" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Fecha</label>
                  <input type="date" value={weightForm.recordedAt} onChange={(e) => setWeightForm((p) => ({ ...p, recordedAt: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
              </div>
              <input type="text" value={weightForm.notes} onChange={(e) => setWeightForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Notas (opcional)" className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <div className="flex gap-2">
                <button onClick={() => setShowAddWeight(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancelar</button>
                <button
                  onClick={() => addWeight.mutate({ patientId, weightKg: parseFloat(weightForm.weightKg), bodyFatPct: weightForm.bodyFatPct ? parseFloat(weightForm.bodyFatPct) : undefined, waistCm: weightForm.waistCm ? parseFloat(weightForm.waistCm) : undefined, notes: weightForm.notes || undefined, recordedAt: weightForm.recordedAt })}
                  disabled={!weightForm.weightKg || addWeight.isPending}
                  className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {addWeight.isPending ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          )}

          {chartData.length > 0 ? (
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip content={<WeightTooltip />} />
                  {patient.targetWeightKg && (
                    <ReferenceLine y={patient.targetWeightKg} stroke="#22C55E" strokeDasharray="4 4" label={{ value: "Objetivo", position: "right", fontSize: 10, fill: "#22C55E" }} />
                  )}
                  <Line type="monotone" dataKey="peso" stroke="#F97316" strokeWidth={2.5} dot={{ fill: "#F97316", r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
              {/* Weight table */}
              <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                {[...weightHistory].reverse().map((w) => (
                  <div key={w.id} className="flex items-center gap-3 text-sm py-1 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground text-xs w-20 flex-shrink-0">{fmtDate(w.recordedAt)}</span>
                    <span className="font-bold text-foreground">{w.weightKg} kg</span>
                    {w.bodyFatPct && <span className="text-muted-foreground text-xs">{w.bodyFatPct}% grasa</span>}
                    {w.waistCm && <span className="text-muted-foreground text-xs">{w.waistCm} cm</span>}
                    {w.notes && <span className="text-muted-foreground text-xs flex-1 truncate">{w.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Scale size={32} className="mx-auto mb-2 opacity-30" />
              Sin registros de peso aún. Añade el primer registro.
            </div>
          )}
        </div>

        {/* ─── AI Menu Generator ──────────────────────────────────────────── */}
        <div className="bg-card rounded-2xl border border-border p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-orange-500" />
              <h2 className="text-base font-black text-foreground">Plan nutricional</h2>
            </div>
            <button
              onClick={() => setShowMenuGen(!showMenuGen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              <Sparkles size={12} /> Generar con IA
            </button>
          </div>

          {showMenuGen && (
            <div className="bg-muted/30 rounded-xl p-4 mb-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Duración</label>
                <div className="flex gap-2">
                  {[1, 2].map((w) => (
                    <button key={w} onClick={() => setMenuGenForm((p) => ({ ...p, durationWeeks: w }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${menuGenForm.durationWeeks === w ? "bg-orange-500 text-white" : "border border-border hover:bg-muted"}`}>
                      {w} semana{w > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Instrucciones adicionales</label>
                <textarea value={menuGenForm.extraInstructions} onChange={(e) => setMenuGenForm((p) => ({ ...p, extraInstructions: e.target.value }))}
                  placeholder="Ej: Evitar lácteos esta semana, incluir más proteína vegetal..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" rows={3} />
              </div>
              <button
                onClick={() => { generateMenu.mutate({ patientId, durationWeeks: menuGenForm.durationWeeks, extraInstructions: menuGenForm.extraInstructions || undefined }); setShowMenuGen(false); }}
                disabled={generateMenu.isPending}
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {generateMenu.isPending ? "Generando menú..." : "Generar menú personalizado"}
              </button>
            </div>
          )}

          {generateMenu.isPending && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200">
              <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-orange-800 font-medium">Generando plan personalizado para {patient.name}...</p>
            </div>
          )}

          {generatedMenu && days.length > 0 && (
            <div>
              {/* Week navigation */}
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setWeekOffset((p) => p - 1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ArrowLeft size={14} className="text-muted-foreground" />
                </button>
                <span className="text-xs font-bold text-muted-foreground">
                  {monday.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} – {sunday.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <button onClick={() => setWeekOffset((p) => p + 1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <ArrowLeft size={14} className="text-muted-foreground rotate-180" />
                </button>
              </div>

              {/* Days */}
              <div className="space-y-2 mb-4">
                {days.map((day: any, i: number) => (
                  <div key={i} className="rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    >
                      <span className="text-sm font-bold text-foreground">{day.day}</span>
                      {expandedDay === i ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </button>
                    {expandedDay === i && (
                      <div className="border-t border-border divide-y divide-border/50">
                        {(day.meals ?? []).map((meal: any, j: number) => {
                          const food = typeof meal.food === "string" ? meal.food : (meal.food ?? []).join(", ");
                          if (!food) return null;
                          return (
                            <div key={j} className="flex gap-3 px-3 py-2">
                              <span className="text-xs text-muted-foreground w-24 flex-shrink-0 pt-0.5">{meal.name}</span>
                              <span className="text-xs text-foreground">{food}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Send buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSendModal("email")}
                  disabled={!patient.email}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <Mail size={14} /> Email
                </button>
                <button
                  onClick={() => getWhatsApp.mutate({ patientId, menuData: generatedMenu, weekStartDate: monday.toISOString(), weekEndDate: sunday.toISOString() })}
                  disabled={getWhatsApp.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              </div>
              {!patient.email && <p className="text-xs text-muted-foreground mt-2 text-center">El paciente no tiene email registrado</p>}
            </div>
          )}

          {!generatedMenu && !generateMenu.isPending && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <Sparkles size={28} className="mx-auto mb-2 opacity-30" />
              Genera un plan nutricional personalizado con IA basado en los datos del paciente.
            </div>
          )}
        </div>

        {/* ─── Plans sent history ─────────────────────────────────────────── */}
        {plansSent.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-4 mb-6">
            <h2 className="text-base font-black text-foreground mb-3">Planes enviados</h2>
            <div className="space-y-2">
              {plansSent.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-3 text-sm py-2 border-b border-border/50 last:border-0">
                  <span className={`text-lg ${p.channel === "whatsapp" ? "text-green-500" : "text-blue-500"}`}>
                    {p.channel === "whatsapp" ? "💬" : "📧"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{p.subject}</p>
                    <p className="text-xs text-muted-foreground">{fmtDate(p.sentAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Email send modal ─────────────────────────────────────────────── */}
      {showSendModal === "email" && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-black text-foreground">Enviar plan por email</h3>
            <p className="text-sm text-muted-foreground">Se enviará el plan semanal a <strong>{patient.email}</strong> con el historial de evolución de peso.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSendModal(null)} className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={() => sendEmail.mutate({ patientId, menuData: generatedMenu, weekStartDate: monday.toISOString(), weekEndDate: sunday.toISOString() })}
                disabled={sendEmail.isPending}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {sendEmail.isPending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WhatsApp message modal ────────────────────────────────────────── */}
      {waMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-black text-foreground">Mensaje de WhatsApp listo</h3>
            <div className="bg-muted/40 rounded-xl p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans">{waMessage.text}</pre>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { navigator.clipboard.writeText(waMessage.text); toast.success("Copiado al portapapeles"); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors"
              >
                <Copy size={14} /> Copiar
              </button>
              {waMessage.waUrl && (
                <a href={waMessage.waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors">
                  <ExternalLink size={14} /> Abrir WhatsApp
                </a>
              )}
            </div>
            <button onClick={() => setWaMessage(null)} className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cerrar</button>
          </div>
        </div>
      )}

      {/* ─── Invite confirm modal ─────────────────────────────────────────── */}
      {showInviteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-black text-foreground">Invitar a BuddyOne</h3>
            <p className="text-sm text-muted-foreground">Se enviará un email de invitación a <strong>{patient.email}</strong> para que {patient.name} se registre en BuddyOne y pueda ver sus planes.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowInviteConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">Cancelar</button>
              <button
                onClick={() => sendInvite.mutate({ patientId, origin: window.location.origin })}
                disabled={sendInvite.isPending}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {sendInvite.isPending ? "Enviando..." : "Enviar invitación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
