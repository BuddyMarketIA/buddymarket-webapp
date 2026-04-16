import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

type Tab = "messages" | "menus" | "appointments" | "progress" | "notes" | "profile" | "diary" | "sessions" | "analysis";

const NOTE_TYPE_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  general: { label: "General", color: "bg-gray-100 text-gray-700", icon: "📝" },
  clinical: { label: "Clínica", color: "bg-blue-100 text-blue-700", icon: "🏥" },
  diet: { label: "Dieta", color: "bg-green-100 text-green-700", icon: "🥗" },
  goal: { label: "Objetivo", color: "bg-purple-100 text-purple-700", icon: "🎯" },
  alert: { label: "Alerta", color: "bg-red-100 text-red-700", icon: "⚠️" },
};

export default function ExpertPatientDetail() {
  const params = useParams<{ id: string }>();
  const patientRelId = parseInt(params.id ?? "0");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Modal estados
  const [showAssignMenuModal, setShowAssignMenuModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [assignMenuTitle, setAssignMenuTitle] = useState("");
  const [assignMenuNotes, setAssignMenuNotes] = useState("");
  const [assignWeekStart, setAssignWeekStart] = useState("");

  // Notas internas
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"general" | "clinical" | "diet" | "goal" | "alert">("general");
  const [notePinned, setNotePinned] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // Historial de sesiones
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState({
    sessionDate: new Date().toISOString().split("T")[0],
    summary: "",
    agreements: "",
    nextObjectives: "",
    nextAppointmentDate: "",
    patientWeight: "",
    patientMood: "",
    adherenceScore: "",
    privateNotes: "",
  });

  // Diario del paciente
  const [diaryDateRange, setDiaryDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 13); // 14 days
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  });
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", date: new Date().toISOString().split("T")[0], icon: "🏆" });
  const [expandedDiaryDay, setExpandedDiaryDay] = useState<string | null>(null);

  // Formulario de progreso
  const [progressForm, setProgressForm] = useState({
    weight: "", bodyFat: "", muscleMass: "", waist: "", hip: "", notes: "",
  });

  // Formulario de cita
  const [apptForm, setApptForm] = useState({
    title: "Consulta nutricional",
    description: "",
    startTime: "",
    endTime: "",
    modality: "online" as "online" | "presencial",
    meetingUrl: "",
    location: "",
  });

  // Datos del paciente (endpoint completo)
  const { data: detail, isLoading, refetch } = trpc.expertPatients.getPatientFullDetail.useQuery(
    { patientRelId },
    { enabled: !!user && patientRelId > 0, refetchInterval: activeTab === "messages" ? 5000 : 30000 }
  );

  const markReadMutation = trpc.expertPatients.markMessagesRead.useMutation();
  const { data: myMenus } = trpc.buddyExperts.getMyMenus.useQuery(undefined, { enabled: showAssignMenuModal });

  // Diario queries
  // Historial de sesiones queries
  const { data: sessionNotes, refetch: refetchSessions } = trpc.expertPatients.getSessionNotes.useQuery(
    { expertPatientId: patientRelId },
    { enabled: !!user && patientRelId > 0 && activeTab === "sessions" }
  );
  const createSessionMutation = trpc.expertPatients.addSessionNote.useMutation({
    onSuccess: () => {
      toast.success("📋 Sesión registrada correctamente");
      setShowSessionModal(false);
      setEditingSessionId(null);
      setSessionForm({ sessionDate: new Date().toISOString().split("T")[0], summary: "", agreements: "", nextObjectives: "", nextAppointmentDate: "", patientWeight: "", patientMood: "", adherenceScore: "", privateNotes: "" });
      refetchSessions();
    },
    onError: () => toast.error("Error al guardar la sesión"),
  });
  const updateSessionMutation = trpc.expertPatients.updateSessionNote.useMutation({
    onSuccess: () => {
      toast.success("Sesión actualizada");
      setShowSessionModal(false);
      setEditingSessionId(null);
      refetchSessions();
    },
    onError: () => toast.error("Error al actualizar la sesión"),
  });
  const deleteSessionMutation = trpc.expertPatients.deleteSessionNote.useMutation({
    onSuccess: () => { toast.success("Sesión eliminada"); refetchSessions(); },
  });

  // Análisis IA
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiAnalysisDate, setAiAnalysisDate] = useState<string | null>(null);
  const analyzePatientMutation = trpc.expertPatients.analyzePatientTrends.useMutation({
    onSuccess: (data) => {
      setAiAnalysisResult(data.analysis);
      setAiAnalysisDate(data.generatedAt);
      toast.success("🧠 Análisis generado correctamente");
    },
    onError: () => toast.error("Error al generar el análisis"),
  });

  const { data: diaryData, isLoading: isDiaryLoading } = trpc.expertPatients.getPatientDiary.useQuery(
    { expertPatientId: patientRelId, startDate: diaryDateRange.start, endDate: diaryDateRange.end },
    { enabled: !!user && patientRelId > 0 && activeTab === "diary" }
  );
  const { data: milestones, refetch: refetchMilestones } = trpc.expertPatients.getPatientMilestones.useQuery(
    { expertPatientId: patientRelId },
    { enabled: !!user && patientRelId > 0 && activeTab === "diary" }
  );
  const addMilestoneMutation = trpc.expertPatients.addPatientMilestone.useMutation({
    onSuccess: () => {
      toast.success("🏆 Hito guardado");
      setShowMilestoneModal(false);
      setMilestoneForm({ title: "", description: "", date: new Date().toISOString().split("T")[0], icon: "🏆" });
      refetchMilestones();
    },
    onError: () => toast.error("Error al guardar el hito"),
  });
  const deleteMilestoneMutation = trpc.expertPatients.deletePatientMilestone.useMutation({
    onSuccess: () => { toast.success("Hito eliminado"); refetchMilestones(); },
  });

  const sendMessageMutation = trpc.expertPatients.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetch();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: () => toast.error("Error al enviar el mensaje"),
  });

  const assignMenuMutation = trpc.expertPatients.assignMenu.useMutation({
    onSuccess: () => {
      toast.success("Menú asignado y adaptado con IA para las necesidades del paciente");
      setShowAssignMenuModal(false);
      refetch();
    },
    onError: () => toast.error("Error al asignar el menú"),
  });

  const addProgressMutation = trpc.expertPatients.addProgressRecord.useMutation({
    onSuccess: () => {
      toast.success("Registro de evolución guardado");
      setShowProgressModal(false);
      setProgressForm({ weight: "", bodyFat: "", muscleMass: "", waist: "", hip: "", notes: "" });
      refetch();
    },
    onError: () => toast.error("Error al guardar el registro"),
  });

  const createAppointmentMutation = trpc.expertPatients.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Cita programada y notificada al paciente");
      setShowAppointmentModal(false);
      refetch();
    },
    onError: () => toast.error("Error al crear la cita"),
  });

  const updateAppointmentMutation = trpc.expertPatients.updateAppointment.useMutation({
    onSuccess: () => { toast.success("Cita actualizada"); refetch(); },
    onError: () => toast.error("Error al actualizar la cita"),
  });

  // Mutaciones de notas
  const addNoteMutation = trpc.expertPatients.addPatientNote.useMutation({
    onSuccess: () => {
      toast.success("Nota guardada");
      setShowNoteModal(false);
      setNoteContent("");
      setNoteType("general");
      setNotePinned(false);
      setEditingNoteId(null);
      refetch();
    },
    onError: () => toast.error("Error al guardar la nota"),
  });

  const updateNoteMutation = trpc.expertPatients.updatePatientNote.useMutation({
    onSuccess: () => {
      toast.success("Nota actualizada");
      setShowNoteModal(false);
      setNoteContent("");
      setNoteType("general");
      setNotePinned(false);
      setEditingNoteId(null);
      refetch();
    },
    onError: () => toast.error("Error al actualizar la nota"),
  });

  const deleteNoteMutation = trpc.expertPatients.deletePatientNote.useMutation({
    onSuccess: () => { toast.success("Nota eliminada"); refetch(); },
    onError: () => toast.error("Error al eliminar la nota"),
  });

  useEffect(() => {
    if (activeTab === "messages") {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [activeTab, detail?.recentMessages]);

  useEffect(() => {
    if (patientRelId && activeTab === "messages" && detail?.recentMessages) {
      const hasUnread = detail.recentMessages.some(m => !m.isRead && m.senderRole === "patient");
      if (hasUnread) markReadMutation.mutate({ patientRelId });
    }
  }, [detail?.recentMessages?.length, activeTab, patientRelId]);

  if (!user) return null;
  if (isLoading) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    </AppLayout>
  );
  if (!detail) return (
    <AppLayout>
      <div className="text-center py-16">
        <p className="text-gray-500">Paciente no encontrado</p>
        <Button onClick={() => navigate("/app/expert/patients")} className="mt-4">Volver</Button>
      </div>
    </AppLayout>
  );

  const {
    relation, user: patientUser, profile, medicalProfile,
    recentMessages: messages, appointments, assignedMenus, progressHistory: progressRecords,
    notes, userMetricsHistory,
  } = detail;

  const unreadCount = messages.filter(m => !m.isRead && m.senderRole === "patient").length;
  const pinnedNotes = notes.filter(n => n.isPinned);
  const alertNotes = notes.filter(n => n.noteType === "alert");

  const TABS: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: "messages", label: "Mensajes", icon: "💬", count: unreadCount || undefined },
    { id: "diary", label: "Diario", icon: "📓" },
    { id: "menus", label: "Menús", icon: "🥗", count: assignedMenus.length || undefined },
    { id: "appointments", label: "Citas", icon: "📅", count: appointments.filter(a => a.status === "scheduled").length || undefined },
    { id: "progress", label: "Evolución", icon: "📈", count: progressRecords.length || undefined },
    { id: "notes", label: "Notas", icon: "🔒", count: notes.length || undefined },
    { id: "sessions", label: "Historial", icon: "📋", count: undefined },
    { id: "analysis", label: "Análisis IA", icon: "🧠" },
    { id: "profile", label: "Perfil", icon: "👤" },
  ];

  // Preparar datos para gráficos
  const weightChartData = progressRecords
    .filter(r => r.weight)
    .map(r => ({
      date: new Date(r.recordedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      Peso: r.weight,
      Grasa: r.bodyFat,
      Músculo: r.muscleMass,
    }));

  // Combinar con métricas del usuario si hay datos
  const userWeightData = userMetricsHistory
    .filter(m => m.weight)
    .map(m => ({
      date: new Date(m.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      Peso: m.weight,
    }));

  const combinedWeightData = weightChartData.length > 0 ? weightChartData : userWeightData;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Alertas de notas importantes */}
        {alertNotes.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Alertas del paciente</p>
              {alertNotes.map(n => (
                <p key={n.id} className="text-sm text-red-600 mt-0.5">• {n.content}</p>
              ))}
            </div>
          </div>
        )}

        {/* Header del paciente */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate("/app/expert/patients")} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {patientUser?.imageUrl ? (
            <img src={patientUser.imageUrl} alt={patientUser.name ?? ""} className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl">
              {(patientUser?.name ?? "P").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{patientUser?.name ?? "Paciente"}</h1>
            <p className="text-sm text-gray-500">{patientUser?.email}</p>
            {profile && (
              <p className="text-xs text-gray-400 mt-0.5">
                {profile.weight ? `${profile.weight} kg` : ""}
                {profile.height ? ` · ${profile.height} cm` : ""}
                {profile.age ? ` · ${profile.age} años` : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAppointmentModal(true)}
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              + Cita
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAssignMenuModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Menú
            </Button>
          </div>
        </div>

        {/* Notas fijadas (si las hay) */}
        {pinnedNotes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {pinnedNotes.map(n => (
              <div key={n.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <span>📌</span>
                <span className="text-yellow-800 font-medium">{n.content.substring(0, 80)}{n.content.length > 80 ? "..." : ""}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── TAB: MENSAJES ─────────────────────────────────────────────── */}
        {activeTab === "messages" && (
          <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Aún no hay mensajes. Inicia la conversación.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isExpert = msg.senderRole === "expert";
                  const prevMsg = messages[idx - 1];
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(msg.createdAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                          </span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                      )}
                      <div className={`flex ${isExpert ? "justify-end" : "justify-start"}`}>
                        {!isExpert && (
                          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs mr-2 flex-shrink-0 self-end mb-1">
                            {(patientUser?.name ?? "P").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          isExpert
                            ? "bg-orange-500 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isExpert ? "text-orange-100" : "text-gray-400"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            {isExpert && msg.isRead && <span className="ml-1">✓✓ Leído</span>}
                            {isExpert && !msg.isRead && <span className="ml-1 opacity-60">✓</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && messageText.trim()) {
                    e.preventDefault();
                    sendMessageMutation.mutate({ patientRelId, content: messageText.trim() });
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => messageText.trim() && sendMessageMutation.mutate({ patientRelId, content: messageText.trim() })}
                disabled={!messageText.trim() || sendMessageMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Enviar
              </Button>
            </div>
          </div>
        )}

              {/* ─── TAB: DIARIO ────────────────────────────────────────── */}
        {activeTab === "diary" && (
          <div>
            {/* Selector de rango de fechas */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Desde</label>
                <input type="date" value={diaryDateRange.start}
                  onChange={e => setDiaryDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Hasta</label>
                <input type="date" value={diaryDateRange.end}
                  onChange={e => setDiaryDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="flex gap-1.5 ml-auto">
                {[7, 14, 30].map(days => (
                  <button key={days} onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - (days - 1));
                    setDiaryDateRange({ start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] });
                  }} className="px-2.5 py-1 text-xs rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 font-medium">
                    {days}d
                  </button>
                ))}
              </div>
            </div>

            {isDiaryLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-4 border-orange-500 border-t-transparent rounded-full" /></div>
            ) : !diaryData || diaryData.days.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">📓</div>
                <p className="text-gray-500 font-medium">Sin registros en este periodo</p>
                <p className="text-sm text-gray-400 mt-1">El paciente aún no ha registrado comidas en estas fechas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Resumen de adherencia del periodo */}
                {(() => {
                  const days = diaryData.days;
                  const daysWithMeals = days.filter(d => d.mealCount > 0).length;
                  const avgAdherence = Math.round(days.reduce((s, d) => s + d.adherenceScore, 0) / days.length);
                  const avgCalories = Math.round(days.filter(d => d.totalCalories > 0).reduce((s, d) => s + d.totalCalories, 0) / Math.max(1, days.filter(d => d.totalCalories > 0).length));
                  return (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="p-3 bg-orange-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Días registrados</p>
                        <p className="text-xl font-bold text-orange-600">{daysWithMeals}/{days.length}</p>
                      </div>
                      <div className="p-3 rounded-xl text-center" style={{ background: avgAdherence >= 70 ? '#f0fdf4' : avgAdherence >= 40 ? '#fefce8' : '#fef2f2' }}>
                        <p className="text-xs text-gray-500">Adherencia media</p>
                        <p className="text-xl font-bold" style={{ color: avgAdherence >= 70 ? '#16a34a' : avgAdherence >= 40 ? '#ca8a04' : '#dc2626' }}>{avgAdherence}%</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Kcal media/día</p>
                        <p className="text-xl font-bold text-blue-600">{avgCalories > 0 ? avgCalories : '—'}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Lista de días */}
                {[...diaryData.days].reverse().map(day => {
                  const adherenceColor = day.adherenceScore >= 70 ? 'bg-green-500' : day.adherenceScore >= 40 ? 'bg-yellow-400' : day.mealCount === 0 ? 'bg-gray-300' : 'bg-red-400';
                  const isExpanded = expandedDiaryDay === day.date;
                  const dateLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
                  return (
                    <div key={day.date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        onClick={() => setExpandedDiaryDay(isExpanded ? null : day.date)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                      >
                        {/* Semáforo de adherencia */}
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${adherenceColor}`} />
                        <span className="text-sm font-medium text-gray-700 w-28 text-left capitalize">{dateLabel}</span>
                        <div className="flex-1 flex items-center gap-2">
                          {day.mealCount > 0 ? (
                            <>
                              <span className="text-xs text-gray-500">{day.mealCount} comidas</span>
                              {day.totalCalories > 0 && <span className="text-xs text-gray-400">· {day.totalCalories} kcal</span>}
                              {day.totalProtein > 0 && <span className="text-xs text-gray-400">· {day.totalProtein.toFixed(0)}g prot</span>}
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin registros</span>
                          )}
                        </div>
                        {day.wellbeing && (
                          <div className="flex gap-1 text-xs">
                            {day.wellbeing.energyLevel && <span title="Energía">⚡{day.wellbeing.energyLevel}/5</span>}
                            {day.wellbeing.moodLevel && <span title="Ánimo">😊{day.wellbeing.moodLevel}/5</span>}
                          </div>
                        )}
                        <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-3 bg-gray-50">
                          {day.meals.length > 0 ? (
                            <div className="space-y-2">
                              {day.meals.map((meal: any) => (
                                <div key={meal.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-400 text-xs w-16 flex-shrink-0">
                                    {meal.mealType === 'breakfast' ? '🌅 Desayuno' :
                                     meal.mealType === 'lunch' ? '🍽️ Comida' :
                                     meal.mealType === 'dinner' ? '🌙 Cena' :
                                     meal.mealType === 'snack' ? '🍎 Snack' : '🍴 Otro'}
                                  </span>
                                  <span className="flex-1 text-gray-700">{meal.foodName || meal.recipeName || 'Alimento'}</span>
                                  {meal.calories && <span className="text-xs text-gray-400">{meal.calories} kcal</span>}
                                </div>
                              ))}
                              <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-4 gap-2 text-xs text-center">
                                <div><p className="text-gray-400">Kcal</p><p className="font-semibold text-gray-700">{day.totalCalories}</p></div>
                                <div><p className="text-gray-400">Prot</p><p className="font-semibold text-gray-700">{day.totalProtein.toFixed(1)}g</p></div>
                                <div><p className="text-gray-400">Carbos</p><p className="font-semibold text-gray-700">{day.totalCarbs.toFixed(1)}g</p></div>
                                <div><p className="text-gray-400">Grasa</p><p className="font-semibold text-gray-700">{day.totalFat.toFixed(1)}g</p></div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic text-center py-2">El paciente no registró comidas este día</p>
                          )}
                          {day.wellbeing && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-600 mb-2">📊 Bienestar del paciente</p>
                              <div className="grid grid-cols-5 gap-2 text-xs text-center">
                                {day.wellbeing.energyLevel && <div><p className="text-gray-400">⚡ Energía</p><p className="font-semibold">{day.wellbeing.energyLevel}/5</p></div>}
                                {day.wellbeing.moodLevel && <div><p className="text-gray-400">😊 Ánimo</p><p className="font-semibold">{day.wellbeing.moodLevel}/5</p></div>}
                                {day.wellbeing.sleepQuality && <div><p className="text-gray-400">💤 Sueño</p><p className="font-semibold">{day.wellbeing.sleepQuality}/5</p></div>}
                                {day.wellbeing.hungerLevel && <div><p className="text-gray-400">🥤 Hambre</p><p className="font-semibold">{day.wellbeing.hungerLevel}/5</p></div>}
                                {day.wellbeing.digestiveComfort && <div><p className="text-gray-400">💚 Digest.</p><p className="font-semibold">{day.wellbeing.digestiveComfort}/5</p></div>}
                              </div>
                              {day.wellbeing.notes && <p className="text-xs text-gray-500 mt-2 italic">"{day.wellbeing.notes}"</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Hitos del paciente */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold text-gray-700">🏆 Hitos y logros</h4>
                <Button size="sm" onClick={() => setShowMilestoneModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                  + Hito
                </Button>
              </div>
              {!milestones || milestones.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">Añade hitos para celebrar los logros del paciente</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {milestones.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl group">
                      <span className="text-lg">{m.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">{m.title}</p>
                        {m.description && <p className="text-xs text-yellow-600">{m.description}</p>}
                        <p className="text-xs text-yellow-500">{new Date(m.milestoneDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <button
                        onClick={() => deleteMilestoneMutation.mutate({ milestoneId: m.id })}
                        className="ml-1 text-yellow-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: MENÚS ────────────────────────────────────────── */}
        {activeTab === "menus" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Menús asignados ({assignedMenus.length})</h3>
              <Button size="sm" onClick={() => setShowAssignMenuModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                + Asignar menú
              </Button>
            </div>
            {assignedMenus.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">🥗</div>
                <p className="text-gray-500">No hay menús asignados aún</p>
                <Button onClick={() => setShowAssignMenuModal(true)} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                  Asignar primer menú
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedMenus.map(am => {
                  const statusColors = {
                    pending_adaptation: "bg-yellow-100 text-yellow-700",
                    adapted: "bg-green-100 text-green-700",
                    active: "bg-blue-100 text-blue-700",
                    archived: "bg-gray-100 text-gray-500",
                  };
                  const statusLabels = {
                    pending_adaptation: "Adaptando...",
                    adapted: "Adaptado con IA",
                    active: "Activo",
                    archived: "Archivado",
                  };
                  return (
                    <div key={am.id} className="p-4 bg-white rounded-xl border border-gray-200">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{am.originalMenuTitle ?? "Menú personalizado"}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[am.status]}`}>
                              {statusLabels[am.status]}
                            </span>
                          </div>
                          {am.weekStartDate && (
                            <p className="text-sm text-gray-500 mt-1">
                              Semana del {new Date(am.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                            </p>
                          )}
                          {am.expertNotes && (
                            <p className="text-sm text-gray-600 mt-1 italic">"{am.expertNotes}"</p>
                          )}
                          {am.adaptationNotes && (
                            <details className="mt-2">
                              <summary className="text-xs text-orange-600 cursor-pointer hover:underline">Ver cambios de la IA</summary>
                              <p className="text-xs text-gray-500 mt-1 bg-orange-50 p-2 rounded">
                                • {am.adaptationNotes.split("\n").join("\n• ")}
                              </p>
                            </details>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(am.createdAt).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                      {am.patientRating && (
                        <div className="mt-2 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <span key={s} className={s <= am.patientRating! ? "text-yellow-400" : "text-gray-200"}>★</span>
                          ))}
                          {am.patientFeedback && (
                            <span className="text-xs text-gray-500 ml-1">"{am.patientFeedback}"</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: CITAS ────────────────────────────────────────────────── */}
        {activeTab === "appointments" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Citas ({appointments.length})</h3>
              <Button size="sm" onClick={() => setShowAppointmentModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                + Nueva cita
              </Button>
            </div>
            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-500">No hay citas programadas</p>
                <Button onClick={() => setShowAppointmentModal(true)} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                  Programar primera cita
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(appt => {
                  const start = new Date(appt.startTime);
                  const isPast = start < new Date();
                  const statusColors = {
                    scheduled: "bg-blue-100 text-blue-700",
                    confirmed: "bg-green-100 text-green-700",
                    completed: "bg-gray-100 text-gray-600",
                    cancelled: "bg-red-100 text-red-600",
                    no_show: "bg-orange-100 text-orange-600",
                  };
                  return (
                    <div key={appt.id} className={`p-4 bg-white rounded-xl border ${isPast && appt.status === "scheduled" ? "border-orange-200 bg-orange-50" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{appt.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>
                              {appt.status === "scheduled" ? "Programada" :
                               appt.status === "confirmed" ? "Confirmada" :
                               appt.status === "completed" ? "Completada" :
                               appt.status === "cancelled" ? "Cancelada" : "No asistió"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {appt.modality === "online" ? "🌐 Online" : "📍 Presencial"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {start.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {appt.meetingUrl && (
                            <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-600 hover:underline mt-1 inline-block">
                              🔗 Enlace de la reunión
                            </a>
                          )}
                          {appt.googleCalendarLink && (
                            <a href={appt.googleCalendarLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 ml-3 inline-block">
                              📅 Añadir a Google Calendar
                            </a>
                          )}
                        </div>
                        {appt.status === "scheduled" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50 text-xs"
                              onClick={() => updateAppointmentMutation.mutate({ appointmentId: appt.id, status: "completed" })}>
                              Completada
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-500 border-red-300 hover:bg-red-50 text-xs"
                              onClick={() => updateAppointmentMutation.mutate({ appointmentId: appt.id, status: "cancelled" })}>
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: EVOLUCIÓN ────────────────────────────────────────────── */}
        {activeTab === "progress" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Evolución ({progressRecords.length} registros)</h3>
              <Button size="sm" onClick={() => setShowProgressModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                + Nuevo registro
              </Button>
            </div>

            {/* Gráfico de peso con Recharts */}
            {combinedWeightData.length > 1 && (
              <div className="p-4 bg-white rounded-xl border border-gray-200 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">📈 Evolución del peso y composición corporal</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={combinedWeightData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                      formatter={(value: number, name: string) => [`${value} ${name === "Peso" || name === "Músculo" ? "kg" : "%"}`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                    <Line type="monotone" dataKey="Peso" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    {progressRecords.some(r => r.bodyFat) && (
                      <Line type="monotone" dataKey="Grasa" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    )}
                    {progressRecords.some(r => r.muscleMass) && (
                      <Line type="monotone" dataKey="Músculo" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Resumen estadístico */}
            {progressRecords.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {(() => {
                  const weights = progressRecords.filter(r => r.weight).map(r => r.weight!);
                  const first = weights[0];
                  const last = weights[weights.length - 1];
                  const diff = last && first ? (last - first).toFixed(1) : null;
                  return (
                    <>
                      <div className="p-3 bg-orange-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Peso inicial</p>
                        <p className="text-lg font-bold text-orange-600">{first ? `${first} kg` : "—"}</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Peso actual</p>
                        <p className="text-lg font-bold text-orange-600">{last ? `${last} kg` : "—"}</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Cambio total</p>
                        <p className={`text-lg font-bold ${diff && parseFloat(diff) < 0 ? "text-green-600" : diff && parseFloat(diff) > 0 ? "text-red-500" : "text-gray-600"}`}>
                          {diff ? `${parseFloat(diff) > 0 ? "+" : ""}${diff} kg` : "—"}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-xl text-center">
                        <p className="text-xs text-gray-500">Registros</p>
                        <p className="text-lg font-bold text-orange-600">{progressRecords.length}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {progressRecords.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-gray-500">No hay registros de evolución aún</p>
                <Button onClick={() => setShowProgressModal(true)} className="mt-3 bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                  Añadir primer registro
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {progressRecords.map(record => (
                  <div key={record.id} className="p-4 bg-white rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(record.recordedAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {record.weight && <span className="text-sm text-gray-600">⚖️ <strong>{record.weight}</strong> kg</span>}
                      {record.bodyFat && <span className="text-sm text-gray-600">💧 <strong>{record.bodyFat}</strong>% grasa</span>}
                      {record.muscleMass && <span className="text-sm text-gray-600">💪 <strong>{record.muscleMass}</strong> kg músculo</span>}
                      {record.waist && <span className="text-sm text-gray-600">📏 Cintura: <strong>{record.waist}</strong> cm</span>}
                      {record.hip && <span className="text-sm text-gray-600">Cadera: <strong>{record.hip}</strong> cm</span>}
                    </div>
                    {record.notes && <p className="text-sm text-gray-500 mt-2 italic">"{record.notes}"</p>}
                    {record.expertComment && (
                      <p className="text-sm text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">💬 {record.expertComment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: NOTAS INTERNAS ───────────────────────────────────────── */}
        {activeTab === "notes" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-gray-700">Notas internas ({notes.length})</h3>
                <p className="text-xs text-gray-400 mt-0.5">🔒 Solo visibles para ti. El paciente no puede verlas.</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingNoteId(null);
                  setNoteContent("");
                  setNoteType("general");
                  setNotePinned(false);
                  setShowNoteModal(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                + Nueva nota
              </Button>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">🔒</div>
                <p className="text-gray-500 font-medium">Sin notas internas</p>
                <p className="text-sm text-gray-400 mt-1">Añade notas clínicas, objetivos o alertas sobre este paciente</p>
                <Button
                  onClick={() => { setEditingNoteId(null); setNoteContent(""); setNoteType("general"); setNotePinned(false); setShowNoteModal(true); }}
                  className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                  size="sm"
                >
                  Crear primera nota
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => {
                  const typeInfo = NOTE_TYPE_LABELS[note.noteType] ?? NOTE_TYPE_LABELS.general;
                  return (
                    <div key={note.id} className={`p-4 bg-white rounded-xl border ${note.noteType === "alert" ? "border-red-200" : note.isPinned ? "border-yellow-200" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                            {note.isPinned && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">
                                📌 Fijada
                              </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(note.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setNoteContent(note.content);
                            setNoteType(note.noteType as any);
                            setNotePinned(note.isPinned);
                            setShowNoteModal(true);
                          }}
                          className="text-xs text-gray-500 hover:text-orange-600 transition-colors"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => updateNoteMutation.mutate({ noteId: note.id, isPinned: !note.isPinned })}
                          className="text-xs text-gray-500 hover:text-yellow-600 transition-colors"
                        >
                          {note.isPinned ? "📌 Desfijar" : "📌 Fijar"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("¿Eliminar esta nota?")) {
                              deleteNoteMutation.mutate({ noteId: note.id });
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: HISTORIAL DE SESIONES ─────────────────────────────── */}
        {activeTab === "sessions" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-gray-700">Historial de sesiones ({sessionNotes?.length ?? 0})</h3>
                <p className="text-xs text-gray-400 mt-0.5">📋 Actas de consulta y seguimiento del paciente</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingSessionId(null);
                  setSessionForm({ sessionDate: new Date().toISOString().split("T")[0], summary: "", agreements: "", nextObjectives: "", nextAppointmentDate: "", patientWeight: "", patientMood: "", adherenceScore: "", privateNotes: "" });
                  setShowSessionModal(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                + Nueva sesión
              </Button>
            </div>

            {!sessionNotes || sessionNotes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-500 font-medium">Sin sesiones registradas</p>
                <p className="text-sm text-gray-400 mt-1">Registra el acta de cada consulta para llevar un seguimiento completo</p>
                <Button
                  onClick={() => { setEditingSessionId(null); setSessionForm({ sessionDate: new Date().toISOString().split("T")[0], summary: "", agreements: "", nextObjectives: "", nextAppointmentDate: "", patientWeight: "", patientMood: "", adherenceScore: "", privateNotes: "" }); setShowSessionModal(true); }}
                  className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                  size="sm"
                >
                  Registrar primera sesión
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {sessionNotes.map((session: any) => (
                    <div key={session.id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center z-10">
                        <span className="text-orange-600 text-sm font-bold">{new Date(session.sessionDate + 'T12:00:00').getDate()}</span>
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {new Date(session.sessionDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {session.adherenceScore && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    session.adherenceScore >= 8 ? 'bg-green-100 text-green-700' :
                                    session.adherenceScore >= 5 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    Adherencia: {session.adherenceScore}/10
                                  </span>
                                )}
                                {session.patientWeight && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                    ⚖️ {session.patientWeight} kg
                                  </span>
                                )}
                                {session.patientMood && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                    {['', '😞', '😕', '😐', '😊', '😄'][session.patientMood]} Ánimo: {session.patientMood}/5
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingSessionId(session.id);
                                  setSessionForm({
                                    sessionDate: session.sessionDate,
                                    summary: session.summary,
                                    agreements: session.agreements || '',
                                    nextObjectives: session.nextObjectives || '',
                                    nextAppointmentDate: session.nextAppointmentDate || '',
                                    patientWeight: session.patientWeight?.toString() || '',
                                    patientMood: session.patientMood?.toString() || '',
                                    adherenceScore: session.adherenceScore?.toString() || '',
                                    privateNotes: session.privateNotes || '',
                                  });
                                  setShowSessionModal(true);
                                }}
                                className="text-xs text-gray-400 hover:text-orange-600 transition-colors p-1"
                              >✏️</button>
                              <button
                                onClick={() => { if (confirm('¿Eliminar esta sesión?')) deleteSessionMutation.mutate({ noteId: session.id }); }}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors p-1"
                              >🗑️</button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resumen de la sesión</p>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.summary}</p>
                            </div>
                            {session.agreements && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">✅ Acuerdos y cambios</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.agreements}</p>
                              </div>
                            )}
                            {session.nextObjectives && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🎯 Objetivos próxima visita</p>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.nextObjectives}</p>
                              </div>
                            )}
                            {session.nextAppointmentDate && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📅 Próxima cita</p>
                                <p className="text-sm text-orange-600 font-medium">
                                  {new Date(session.nextAppointmentDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                              </div>
                            )}
                            {session.privateNotes && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">🔒 Notas privadas</p>
                                <p className="text-sm text-gray-500 italic whitespace-pre-wrap">{session.privateNotes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: PERFIL ───────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Datos físicos</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Peso</span><span className="font-medium">{profile?.weight ? `${profile.weight} kg` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Altura</span><span className="font-medium">{profile?.height ? `${profile.height} cm` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Edad</span><span className="font-medium">{profile?.age ? `${profile.age} años` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Objetivo</span><span className="font-medium">{profile?.mainGoal ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Actividad</span><span className="font-medium">{profile?.activityLevel ?? "—"}</span></div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Restricciones</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Alergias: </span>
                    <span className="font-medium">
                      {profile?.menuAllergies
                        ? (() => { try { return JSON.parse(profile.menuAllergies).join(", ") || "Ninguna"; } catch { return profile.menuAllergies || "Ninguna"; } })()
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Restricciones: </span>
                    <span className="font-medium">
                      {profile?.menuRestrictions
                        ? (() => { try { return JSON.parse(profile.menuRestrictions).join(", ") || "Ninguna"; } catch { return profile.menuRestrictions || "Ninguna"; } })()
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo dieta: </span>
                    <span className="font-medium">{profile?.menuDietType ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
            {medicalProfile && (
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Perfil médico</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {medicalProfile.medicalConditions && <p><span className="text-gray-500">Condiciones: </span>{medicalProfile.medicalConditions}</p>}
                  {medicalProfile.medications && <p><span className="text-gray-500">Medicación: </span>{medicalProfile.medications}</p>}
                </div>
              </div>
            )}
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Notas de la relación</h4>
              <p className="text-sm text-gray-600">{relation.notes || "Sin notas"}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Objetivos calóricos</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Calorías: </span><span className="font-medium">{profile?.dailyCalorieGoal ? `${profile.dailyCalorieGoal} kcal` : "—"}</span></div>
                <div><span className="text-gray-500">Proteína: </span><span className="font-medium">{profile?.dailyProteinGoal ? `${profile.dailyProteinGoal}g` : "—"}</span></div>
                <div><span className="text-gray-500">Carbos: </span><span className="font-medium">{profile?.dailyCarbsGoal ? `${profile.dailyCarbsGoal}g` : "—"}</span></div>
                <div><span className="text-gray-500">Grasa: </span><span className="font-medium">{profile?.dailyFatGoal ? `${profile.dailyFatGoal}g` : "—"}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: ANÁLISIS IA ───────────────────────────────────────── */}
        {activeTab === "analysis" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-700">🧠 Análisis de Tendencias con IA</h3>
                <p className="text-xs text-gray-400 mt-0.5">Análisis clínico basado en los últimos 90 días de datos del paciente</p>
              </div>
              <Button
                onClick={() => analyzePatientMutation.mutate({ expertPatientId: patientRelId, patientUserId: patientUser?.id ?? 0 })}
                disabled={analyzePatientMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                size="sm"
              >
                {analyzePatientMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analizando...
                  </span>
                ) : aiAnalysisResult ? "🔄 Regenerar análisis" : "🧠 Generar análisis IA"}
              </Button>
            </div>

            {/* Estado inicial - sin análisis */}
            {!aiAnalysisResult && !analyzePatientMutation.isPending && (
              <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
                <div className="text-5xl mb-3">🧠</div>
                <p className="text-gray-700 font-semibold text-lg">Análisis inteligente del paciente</p>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                  La IA analizará los registros de peso, bienestar, adherencia y sesiones de los últimos 90 días
                  para generar insights clínicos personalizados.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
                  <span className="px-3 py-1 bg-white rounded-full border border-purple-200 text-purple-700">⚖️ Evolución del peso</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-purple-200 text-purple-700">😊 Bienestar y ánimo</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-purple-200 text-purple-700">🎯 Adherencia al plan</span>
                  <span className="px-3 py-1 bg-white rounded-full border border-purple-200 text-purple-700">📋 Historial de sesiones</span>
                </div>
                <Button
                  onClick={() => analyzePatientMutation.mutate({ expertPatientId: patientRelId, patientUserId: patientUser?.id ?? 0 })}
                  className="mt-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  🧠 Generar análisis ahora
                </Button>
              </div>
            )}

            {/* Cargando */}
            {analyzePatientMutation.isPending && (
              <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Analizando datos del paciente...</p>
                <p className="text-sm text-gray-500 mt-1">Esto puede tardar unos segundos</p>
              </div>
            )}

            {/* Resultado del análisis */}
            {aiAnalysisResult && !analyzePatientMutation.isPending && (
              <div className="space-y-3">
                {aiAnalysisDate && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>⏰ Generado el {new Date(aiAnalysisDate).toLocaleString('es-ES')}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">IA</span>
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {aiAnalysisResult.split('\n').map((line, i) => {
                      if (line.match(/^\d+\. [A-ZÁ-Ú ]+$/)) {
                        return <p key={i} className="font-bold text-gray-900 mt-4 mb-1 text-base">{line}</p>;
                      }
                      if (line.startsWith('- ') || line.startsWith('• ')) {
                        return <p key={i} className="ml-3 text-gray-700">{line}</p>;
                      }
                      if (line.trim() === '') return <br key={i} />;
                      return <p key={i} className="text-gray-700">{line}</p>;
                    })}
                  </div>
                </div>
                <p className="text-xs text-gray-400 italic">
                  ⚠️ Este análisis es orientativo y no sustituye el criterio clínico profesional.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Sesión / Acta de consulta */}
      <Dialog open={showSessionModal} onOpenChange={setShowSessionModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSessionId ? "✏️ Editar acta de sesión" : "📋 Nueva acta de sesión"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha de la sesión *</Label>
                <Input type="date" value={sessionForm.sessionDate}
                  onChange={e => setSessionForm(prev => ({ ...prev, sessionDate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Próxima cita (opcional)</Label>
                <Input type="date" value={sessionForm.nextAppointmentDate}
                  onChange={e => setSessionForm(prev => ({ ...prev, nextAppointmentDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" step="0.1" placeholder="70.5" value={sessionForm.patientWeight}
                  onChange={e => setSessionForm(prev => ({ ...prev, patientWeight: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Ánimo (1-5)</Label>
                <Select value={sessionForm.patientMood} onValueChange={v => setSessionForm(prev => ({ ...prev, patientMood: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">😞 1 - Muy bajo</SelectItem>
                    <SelectItem value="2">😕 2 - Bajo</SelectItem>
                    <SelectItem value="3">😐 3 - Neutro</SelectItem>
                    <SelectItem value="4">😊 4 - Bueno</SelectItem>
                    <SelectItem value="5">😄 5 - Excelente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Adherencia (1-10)</Label>
                <Input type="number" min="1" max="10" placeholder="7" value={sessionForm.adherenceScore}
                  onChange={e => setSessionForm(prev => ({ ...prev, adherenceScore: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Resumen de la sesión *</Label>
              <Textarea
                placeholder="Qué se trató en la consulta, estado general del paciente, observaciones..."
                value={sessionForm.summary}
                onChange={e => setSessionForm(prev => ({ ...prev, summary: e.target.value }))}
                className="mt-1" rows={3}
              />
            </div>
            <div>
              <Label>✅ Acuerdos y cambios acordados</Label>
              <Textarea
                placeholder="Cambios en la dieta, nuevos objetivos, ajustes en el plan..."
                value={sessionForm.agreements}
                onChange={e => setSessionForm(prev => ({ ...prev, agreements: e.target.value }))}
                className="mt-1" rows={2}
              />
            </div>
            <div>
              <Label>🎯 Objetivos para la próxima visita</Label>
              <Textarea
                placeholder="Qué debe lograr el paciente antes de la próxima consulta..."
                value={sessionForm.nextObjectives}
                onChange={e => setSessionForm(prev => ({ ...prev, nextObjectives: e.target.value }))}
                className="mt-1" rows={2}
              />
            </div>
            <div>
              <Label>🔒 Notas privadas (solo tú las ves)</Label>
              <Textarea
                placeholder="Observaciones clínicas, impresiones personales..."
                value={sessionForm.privateNotes}
                onChange={e => setSessionForm(prev => ({ ...prev, privateNotes: e.target.value }))}
                className="mt-1" rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSessionModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!sessionForm.summary.trim()) return;
                const data = {
                  expertPatientId: patientRelId,
                  patientUserId: patientUser?.id ?? 0,
                  sessionDate: sessionForm.sessionDate,
                  summary: sessionForm.summary.trim(),
                  agreements: sessionForm.agreements.trim() || undefined,
                  nextObjectives: sessionForm.nextObjectives.trim() || undefined,
                  nextAppointmentDate: sessionForm.nextAppointmentDate || undefined,
                  patientWeight: sessionForm.patientWeight ? parseFloat(sessionForm.patientWeight) : undefined,
                  patientMood: sessionForm.patientMood ? parseInt(sessionForm.patientMood) : undefined,
                  adherenceScore: sessionForm.adherenceScore ? parseInt(sessionForm.adherenceScore) : undefined,
                  privateNotes: sessionForm.privateNotes.trim() || undefined,
                };
                if (editingSessionId) {
                  updateSessionMutation.mutate({ noteId: editingSessionId, ...data });
                } else {
                  createSessionMutation.mutate(data);
                }
              }}
              disabled={!sessionForm.summary.trim() || createSessionMutation.isPending || updateSessionMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createSessionMutation.isPending || updateSessionMutation.isPending ? "Guardando..." : editingSessionId ? "Actualizar" : "Guardar acta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Hito del paciente */}
      <Dialog open={showMilestoneModal} onOpenChange={setShowMilestoneModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🏆 Nuevo hito del paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {['🏆', '🌟', '💪', '❤️', '🎯', '📉', '🔥', '👏', '🎉', '✅'].map(icon => (
                <button key={icon} onClick={() => setMilestoneForm(prev => ({ ...prev, icon }))}
                  className={`text-xl p-1.5 rounded-lg transition-colors ${
                    milestoneForm.icon === icon ? 'bg-orange-100 ring-2 ring-orange-400' : 'hover:bg-gray-100'
                  }`}>{icon}</button>
              ))}
            </div>
            <div>
              <Label>Título del hito *</Label>
              <Input placeholder="Ej: Perdió 5 kg, Primera semana completada..." value={milestoneForm.title}
                onChange={e => setMilestoneForm(prev => ({ ...prev, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea placeholder="Detalles del logro..." value={milestoneForm.description}
                onChange={e => setMilestoneForm(prev => ({ ...prev, description: e.target.value }))} className="mt-1" rows={2} />
            </div>
            <div>
              <Label>Fecha del hito</Label>
              <Input type="date" value={milestoneForm.date}
                onChange={e => setMilestoneForm(prev => ({ ...prev, date: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMilestoneModal(false)}>Cancelar</Button>
            <Button
              onClick={() => addMilestoneMutation.mutate({
                expertPatientId: patientRelId,
                title: milestoneForm.title,
                description: milestoneForm.description || undefined,
                milestoneDate: milestoneForm.date,
                icon: milestoneForm.icon,
              })}
              disabled={!milestoneForm.title.trim() || addMilestoneMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {addMilestoneMutation.isPending ? "Guardando..." : "Guardar hito"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nota interna */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingNoteId ? "Editar nota" : "Nueva nota interna"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
              🔒 Esta nota es <strong>privada</strong>. El paciente no puede verla.
            </div>
            <div>
              <Label>Tipo de nota</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(Object.entries(NOTE_TYPE_LABELS) as [string, { label: string; color: string; icon: string }][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setNoteType(key as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      noteType === key ? val.color + " ring-2 ring-offset-1 ring-orange-400" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {val.icon} {val.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Contenido *</Label>
              <Textarea
                placeholder="Escribe la nota aquí..."
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="note-pinned"
                checked={notePinned}
                onChange={e => setNotePinned(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="note-pinned" className="cursor-pointer">📌 Fijar nota (aparecerá destacada en el perfil)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!noteContent.trim()) return;
                if (editingNoteId) {
                  updateNoteMutation.mutate({ noteId: editingNoteId, content: noteContent.trim(), noteType, isPinned: notePinned });
                } else {
                  addNoteMutation.mutate({ patientRelId, content: noteContent.trim(), noteType, isPinned: notePinned });
                }
              }}
              disabled={!noteContent.trim() || addNoteMutation.isPending || updateNoteMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {addNoteMutation.isPending || updateNoteMutation.isPending ? "Guardando..." : editingNoteId ? "Actualizar" : "Guardar nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Asignar menú */}
      <Dialog open={showAssignMenuModal} onOpenChange={setShowAssignMenuModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar menú al paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Título del menú *</Label>
              <Input
                placeholder="Ej: Menú hipocalórico semana 1"
                value={assignMenuTitle}
                onChange={e => setAssignMenuTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            {myMenus && myMenus.length > 0 && (
              <div>
                <Label>O selecciona uno de tus menús</Label>
                <Select onValueChange={v => setAssignMenuTitle(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar menú existente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myMenus.map((m: any) => (
                      <SelectItem key={m.id} value={m.name ?? `Menú ${m.id}`}>
                        {m.name ?? `Menú ${m.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Semana de inicio (opcional)</Label>
              <Input
                type="date"
                value={assignWeekStart}
                onChange={e => setAssignWeekStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Notas para el paciente (opcional)</Label>
              <Textarea
                placeholder="Instrucciones especiales, recomendaciones..."
                value={assignMenuNotes}
                onChange={e => setAssignMenuNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              🤖 La IA adaptará automáticamente el menú a las restricciones y objetivos del paciente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignMenuModal(false)}>Cancelar</Button>
            <Button
              onClick={() => assignMenuMutation.mutate({
                patientRelId,
                menuTitle: assignMenuTitle || undefined,
                weekStartDate: assignWeekStart || undefined,
                expertNotes: assignMenuNotes || undefined,
              })}
              disabled={!assignMenuTitle || assignMenuMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {assignMenuMutation.isPending ? "Asignando..." : "Asignar menú"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Registro de progreso */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo registro de evolución</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" step="0.1" placeholder="70.5" value={progressForm.weight}
                  onChange={e => setProgressForm(prev => ({ ...prev, weight: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>% Grasa corporal</Label>
                <Input type="number" step="0.1" placeholder="20.0" value={progressForm.bodyFat}
                  onChange={e => setProgressForm(prev => ({ ...prev, bodyFat: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Masa muscular (kg)</Label>
                <Input type="number" step="0.1" placeholder="35.0" value={progressForm.muscleMass}
                  onChange={e => setProgressForm(prev => ({ ...prev, muscleMass: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Cintura (cm)</Label>
                <Input type="number" step="0.5" placeholder="80" value={progressForm.waist}
                  onChange={e => setProgressForm(prev => ({ ...prev, waist: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Cadera (cm)</Label>
                <Input type="number" step="0.5" placeholder="95" value={progressForm.hip}
                  onChange={e => setProgressForm(prev => ({ ...prev, hip: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Notas del registro</Label>
              <Textarea placeholder="Observaciones del experto..." value={progressForm.notes}
                onChange={e => setProgressForm(prev => ({ ...prev, notes: e.target.value }))} className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProgressModal(false)}>Cancelar</Button>
            <Button
              onClick={() => addProgressMutation.mutate({
                patientRelId,
                weight: progressForm.weight ? parseFloat(progressForm.weight) : undefined,
                bodyFat: progressForm.bodyFat ? parseFloat(progressForm.bodyFat) : undefined,
                muscleMass: progressForm.muscleMass ? parseFloat(progressForm.muscleMass) : undefined,
                waist: progressForm.waist ? parseFloat(progressForm.waist) : undefined,
                hip: progressForm.hip ? parseFloat(progressForm.hip) : undefined,
                notes: progressForm.notes || undefined,
              })}
              disabled={addProgressMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {addProgressMutation.isPending ? "Guardando..." : "Guardar registro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nueva cita */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Programar cita</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título</Label>
              <Input value={apptForm.title} onChange={e => setApptForm(prev => ({ ...prev, title: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Inicio</Label>
                <Input type="datetime-local" value={apptForm.startTime}
                  onChange={e => {
                    const start = e.target.value;
                    const end = start ? new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString().slice(0, 16) : "";
                    setApptForm(prev => ({ ...prev, startTime: start, endTime: end }));
                  }} className="mt-1" />
              </div>
              <div>
                <Label>Fin</Label>
                <Input type="datetime-local" value={apptForm.endTime}
                  onChange={e => setApptForm(prev => ({ ...prev, endTime: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Modalidad</Label>
              <Select value={apptForm.modality} onValueChange={(v: "online" | "presencial") => setApptForm(prev => ({ ...prev, modality: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">🌐 Online</SelectItem>
                  <SelectItem value="presencial">📍 Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {apptForm.modality === "online" ? (
              <div>
                <Label>Enlace de la reunión (opcional)</Label>
                <Input placeholder="https://meet.google.com/..." value={apptForm.meetingUrl}
                  onChange={e => setApptForm(prev => ({ ...prev, meetingUrl: e.target.value }))} className="mt-1" />
              </div>
            ) : (
              <div>
                <Label>Dirección (opcional)</Label>
                <Input placeholder="Calle, ciudad..." value={apptForm.location}
                  onChange={e => setApptForm(prev => ({ ...prev, location: e.target.value }))} className="mt-1" />
              </div>
            )}
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea placeholder="Objetivos de la consulta..." value={apptForm.description}
                onChange={e => setApptForm(prev => ({ ...prev, description: e.target.value }))} className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAppointmentModal(false)}>Cancelar</Button>
            <Button
              onClick={() => createAppointmentMutation.mutate({
                patientRelId,
                title: apptForm.title,
                description: apptForm.description || undefined,
                startTime: apptForm.startTime,
                endTime: apptForm.endTime,
                modality: apptForm.modality,
                meetingUrl: apptForm.meetingUrl || undefined,
                location: apptForm.location || undefined,
              })}
              disabled={!apptForm.startTime || !apptForm.endTime || createAppointmentMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createAppointmentMutation.isPending ? "Programando..." : "Programar cita"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
