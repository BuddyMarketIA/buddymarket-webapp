// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Tab = "messages" | "menus" | "appointments" | "progress";

export default function MyExpert() {
  const { user } = useAuth();
  const [activeRelId, setActiveRelId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: myExperts, isLoading: loadingExperts } = trpc.expertPatients.getMyExperts.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: detail, refetch: refetchDetail } = trpc.expertPatients.getPatientDetail.useQuery(
    { patientRelId: activeRelId! },
    { enabled: !!activeRelId, refetchInterval: 15000 }
  );

  const { data: myAssignedMenus } = trpc.expertPatients.getMyAssignedMenus.useQuery(
    undefined,
    { enabled: !!user }
  );

  const sendMessageMutation = trpc.expertPatients.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchDetail();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: () => toast.error("Error al enviar el mensaje"),
  });

  const updateAppointmentMutation = trpc.expertPatients.updateAppointment.useMutation({
    onSuccess: () => { toast.success("Cita confirmada"); refetchDetail(); },
    onError: () => toast.error("Error al actualizar la cita"),
  });

  useEffect(() => {
    if (myExperts && myExperts.length > 0 && !activeRelId) {
      setActiveRelId(myExperts[0].relation.id);
    }
  }, [myExperts]);

  useEffect(() => {
    if (activeTab === "messages") {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [activeTab, detail?.messages]);

  if (!user) return null;

  if (loadingExperts) return (
    <AppLayout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    </AppLayout>
  );

  if (!myExperts || myExperts.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">👩‍⚕️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Sin nutricionista asignado</h2>
          <p className="text-gray-500 mb-6">
            Aún no tienes un BuddyExpert asignado. Cuando un nutricionista te invite, podrás ver aquí tus menús personalizados, mensajes y citas.
          </p>
          <Button
            onClick={() => window.location.href = "/app/buddy-experts"}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Buscar nutricionistas
          </Button>
        </div>
      </AppLayout>
    );
  }

  const activeRelation = myExperts.find(e => e.relation.id === activeRelId);
  const messages = detail?.messages ?? [];
  const appointments = detail?.appointments ?? [];
  const progressRecords = detail?.progressRecords ?? [];

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "messages", label: "Mensajes", icon: "💬" },
    { id: "menus", label: "Mis menús", icon: "🥗" },
    { id: "appointments", label: "Citas", icon: "📅" },
    { id: "progress", label: "Mi evolución", icon: "📈" },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Nutricionista</h1>

        {/* Selector de expert si hay varios */}
        {myExperts.length > 1 && (
          <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
            {myExperts.map(e => (
              <button
                key={e.relation.id}
                onClick={() => setActiveRelId(e.relation.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors whitespace-nowrap ${
                  activeRelId === e.relation.id
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-700 border-gray-200 hover:border-orange-300"
                }`}
              >
                {e.expertUser?.imageUrl ? (
                  <img src={e.expertUser.imageUrl} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                    {(e.expertUser?.name ?? "E").charAt(0)}
                  </div>
                )}
                {e.expertUser?.name ?? "Nutricionista"}
              </button>
            ))}
          </div>
        )}

        {/* Card del expert */}
        {activeRelation && (
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100 mb-6">
            {activeRelation.expertUser?.imageUrl ? (
              <img src={activeRelation.expertUser.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-2xl">
                {(activeRelation.expertUser?.name ?? "E").charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{activeRelation.expertUser?.name ?? "Tu nutricionista"}</h2>
              <p className="text-sm text-gray-500">{activeRelation.expertUser?.email}</p>
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1">
                ✓ Nutricionista verificado
              </span>
            </div>
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
                  <p>Aún no hay mensajes. Tu nutricionista se pondrá en contacto contigo pronto.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderRole === "patient";
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? "bg-orange-500 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Escribe un mensaje a tu nutricionista..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && messageText.trim() && activeRelId) {
                    e.preventDefault();
                    sendMessageMutation.mutate({ patientRelId: activeRelId, content: messageText.trim() });
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => activeRelId && messageText.trim() && sendMessageMutation.mutate({ patientRelId: activeRelId, content: messageText.trim() })}
                disabled={!messageText.trim() || !activeRelId || sendMessageMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Enviar
              </Button>
            </div>
          </div>
        )}

        {/* ─── TAB: MENÚS ASIGNADOS ──────────────────────────────────────── */}
        {activeTab === "menus" && (
          <div>
            {!myAssignedMenus || myAssignedMenus.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">🥗</div>
                <p className="text-gray-500">Tu nutricionista aún no te ha asignado ningún menú</p>
                <p className="text-sm text-gray-400 mt-1">Cuando recibas un menú personalizado, aparecerá aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myAssignedMenus.map(am => (
                  <div key={am.menu.id} className="p-4 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{am.menu.originalMenuTitle ?? "Menú personalizado"}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                            Adaptado para ti
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          De: <strong>{am.expertUser?.name ?? "Tu nutricionista"}</strong>
                        </p>
                        {am.menu.weekStartDate && (
                          <p className="text-sm text-gray-500">
                            Semana del {new Date(am.menu.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
                          </p>
                        )}
                        {am.menu.expertNotes && (
                          <p className="text-sm text-gray-600 mt-2 bg-orange-50 p-2 rounded border-l-2 border-orange-300">
                            💬 {am.menu.expertNotes}
                          </p>
                        )}
                        {am.menu.adaptationNotes && (
                          <details className="mt-2">
                            <summary className="text-xs text-orange-600 cursor-pointer hover:underline">
                              Ver adaptaciones realizadas
                            </summary>
                            <p className="text-xs text-gray-500 mt-1 bg-orange-50 p-2 rounded">
                              • {am.menu.adaptationNotes.split("\n").join("\n• ")}
                            </p>
                          </details>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(am.menu.createdAt).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: CITAS ────────────────────────────────────────────────── */}
        {activeTab === "appointments" && (
          <div>
            {appointments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-500">No tienes citas programadas</p>
                <p className="text-sm text-gray-400 mt-1">Tu nutricionista programará las citas cuando sea necesario</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map(appt => {
                  const start = new Date(appt.startTime);
                  const isUpcoming = start > new Date();
                  const statusColors = {
                    scheduled: "bg-blue-100 text-blue-700",
                    confirmed: "bg-green-100 text-green-700",
                    completed: "bg-gray-100 text-gray-600",
                    cancelled: "bg-red-100 text-red-600",
                    no_show: "bg-orange-100 text-orange-600",
                  };
                  return (
                    <div key={appt.id} className={`p-4 bg-white rounded-xl border ${isUpcoming ? "border-orange-200" : "border-gray-200"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{appt.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>
                              {appt.status === "scheduled" ? "Programada" :
                               appt.status === "confirmed" ? "Confirmada" :
                               appt.status === "completed" ? "Completada" :
                               appt.status === "cancelled" ? "Cancelada" : "No asistí"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {start.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appt.modality === "online" ? "🌐 Online" : "📍 Presencial"}
                          </p>
                          {appt.meetingUrl && isUpcoming && (
                            <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer"
                               className="text-sm text-orange-600 hover:underline mt-1 inline-block font-medium">
                              🔗 Unirse a la reunión
                            </a>
                          )}
                          {appt.googleCalendarLink && isUpcoming && (
                            <a href={appt.googleCalendarLink} target="_blank" rel="noopener noreferrer"
                               className="text-xs text-blue-600 hover:underline mt-1 ml-3 inline-block">
                              📅 Añadir a Google Calendar
                            </a>
                          )}
                        </div>
                        {appt.status === "scheduled" && isUpcoming && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-300 hover:bg-green-50 text-xs flex-shrink-0"
                            onClick={() => updateAppointmentMutation.mutate({ appointmentId: appt.id, status: "confirmed" })}
                          >
                            Confirmar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: MI EVOLUCIÓN ─────────────────────────────────────────── */}
        {activeTab === "progress" && (
          <div>
            {progressRecords.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-gray-500">Aún no hay registros de evolución</p>
                <p className="text-sm text-gray-400 mt-1">Tu nutricionista irá registrando tu progreso en cada consulta</p>
              </div>
            ) : (
              <div className="space-y-3">
                {progressRecords.filter(r => r.weight).length > 1 && (
                  <div className="p-4 bg-white rounded-xl border border-gray-200 mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Tu evolución de peso</h4>
                    <div className="flex items-end gap-1 h-24">
                      {progressRecords.filter(r => r.weight).slice(-12).map((r, i, arr) => {
                        const weights = arr.map(x => x.weight!);
                        const min = Math.min(...weights);
                        const max = Math.max(...weights);
                        const range = max - min || 1;
                        const height = ((r.weight! - min) / range) * 80 + 10;
                        const isLast = i === arr.length - 1;
                        return (
                          <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500">{r.weight}</span>
                            <div
                              className={`w-full rounded-t ${isLast ? "bg-orange-500" : "bg-orange-200"}`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {progressRecords.filter(r => r.weight).length >= 2 && (() => {
                      const withWeight = progressRecords.filter(r => r.weight);
                      const first = withWeight[0].weight!;
                      const last = withWeight[withWeight.length - 1].weight!;
                      const diff = last - first;
                      return (
                        <p className={`text-sm font-medium mt-2 ${diff < 0 ? "text-green-600" : diff > 0 ? "text-red-500" : "text-gray-500"}`}>
                          {diff < 0 ? `↓ Has perdido ${Math.abs(diff).toFixed(1)} kg` :
                           diff > 0 ? `↑ Has ganado ${diff.toFixed(1)} kg` :
                           "Peso estable"}
                        </p>
                      );
                    })()}
                  </div>
                )}
                {progressRecords.map(record => (
                  <div key={record.id} className="p-4 bg-white rounded-xl border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {new Date(record.recordedAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {record.weight && <span className="text-sm text-gray-600">⚖️ <strong>{record.weight}</strong> kg</span>}
                      {record.bodyFat && <span className="text-sm text-gray-600">💧 <strong>{record.bodyFat}</strong>% grasa</span>}
                      {record.muscleMass && <span className="text-sm text-gray-600">💪 <strong>{record.muscleMass}</strong> kg músculo</span>}
                      {record.waist && <span className="text-sm text-gray-600">📏 Cintura: <strong>{record.waist}</strong> cm</span>}
                    </div>
                    {record.expertComment && (
                      <p className="text-sm text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded">
                        💬 Tu nutricionista: {record.expertComment}
                      </p>
                    )}
                    {record.notes && <p className="text-sm text-gray-500 mt-1 italic">"{record.notes}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
