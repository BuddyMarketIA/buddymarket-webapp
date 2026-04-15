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

type Tab = "messages" | "menus" | "appointments" | "progress" | "notes" | "profile";

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
    { id: "menus", label: "Menús", icon: "🥗", count: assignedMenus.length || undefined },
    { id: "appointments", label: "Citas", icon: "📅", count: appointments.filter(a => a.status === "scheduled").length || undefined },
    { id: "progress", label: "Evolución", icon: "📈", count: progressRecords.length || undefined },
    { id: "notes", label: "Notas", icon: "🔒", count: notes.length || undefined },
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

        {/* ─── TAB: MENÚS ────────────────────────────────────────────────── */}
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
      </div>

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
