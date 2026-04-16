// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMarkdown } from "@/lib/renderChatMarkdown";

type View = "dashboard" | "messages" | "menus" | "appointments" | "progress";

export default function MyExpert() {
  const { user } = useAuth();
  const [activeRelId, setActiveRelId] = useState<number | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: myExperts, isLoading: loadingExperts } = trpc.expertPatients.getMyExperts.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: detail, refetch: refetchDetail } = trpc.expertPatients.getPatientDetail.useQuery(
    { patientRelId: activeRelId! },
    { enabled: !!activeRelId, refetchInterval: view === "messages" ? 5000 : 30000 }
  );
  const markReadMutation = trpc.expertPatients.markMessagesRead.useMutation();
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
    if (view === "messages") {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    }
  }, [view, detail?.messages]);

  useEffect(() => {
    if (activeRelId && view === "messages" && detail?.messages) {
      const hasUnread = detail.messages.some(m => !m.isRead && m.senderRole === "expert");
      if (hasUnread) markReadMutation.mutate({ patientRelId: activeRelId });
    }
  }, [detail?.messages?.length, view, activeRelId]);

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

  // Datos para el dashboard
  const unreadCount = messages.filter(m => !m.isRead && m.senderRole === "expert").length;
  const lastMessage = messages[messages.length - 1];
  const nextAppointment = appointments
    .filter(a => new Date(a.startTime) > new Date() && a.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  const activeMenu = myAssignedMenus?.[0];
  const latestProgress = progressRecords[progressRecords.length - 1];
  const firstProgress = progressRecords[0];
  const weightDiff = latestProgress?.weight && firstProgress?.weight
    ? latestProgress.weight - firstProgress.weight
    : null;

  // ─── VISTA: DASHBOARD ─────────────────────────────────────────────────────
  if (view === "dashboard") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Mi Nutricionista</h1>
            {myExperts.length > 1 && (
              <select
                value={activeRelId ?? ""}
                onChange={e => setActiveRelId(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700"
              >
                {myExperts.map(e => (
                  <option key={e.relation.id} value={e.relation.id}>
                    {e.expertUser?.name ?? "Nutricionista"}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tarjeta del nutricionista */}
          {activeRelation && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white shadow-lg">
              <div className="flex items-center gap-4">
                {activeRelation.expertUser?.imageUrl ? (
                  <img src={activeRelation.expertUser.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/40" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-2xl border-2 border-white/40">
                    {(activeRelation.expertUser?.name ?? "N").charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium">Tu nutricionista</p>
                  <h2 className="text-xl font-bold truncate">{activeRelation.expertUser?.name ?? "Tu nutricionista"}</h2>
                  <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1">
                    ✓ BuddyExpert verificado
                  </span>
                </div>
              </div>
              {/* Acciones rápidas */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setView("messages")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-xl py-2.5 text-sm font-semibold"
                >
                  💬 Chat
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full min-w-[18px] h-4.5 flex items-center justify-center px-1 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setView("appointments")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-xl py-2.5 text-sm font-semibold"
                >
                  📅 Citas
                </button>
                <button
                  onClick={() => setView("menus")}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-xl py-2.5 text-sm font-semibold"
                >
                  🥗 Menús
                </button>
              </div>
            </div>
          )}

          {/* Último mensaje */}
          {lastMessage && (
            <button
              onClick={() => setView("messages")}
              className="w-full text-left p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span className="font-semibold text-gray-900 text-sm">Último mensaje</span>
                  {unreadCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                      {unreadCount} nuevo{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span className="text-xs text-orange-500 font-medium">Ver chat →</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">
                {lastMessage.senderRole === "expert" ? "👩‍⚕️ " : "Tú: "}
                {lastMessage.content.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s/gm, "")}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(lastMessage.createdAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </button>
          )}

          {/* Próxima cita */}
          {nextAppointment ? (
            <button
              onClick={() => setView("appointments")}
              className="w-full text-left p-4 bg-white rounded-2xl border border-blue-100 shadow-sm hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <span className="font-semibold text-gray-900 text-sm">Próxima cita</span>
                </div>
                <span className="text-xs text-blue-500 font-medium">Ver todas →</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{nextAppointment.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date(nextAppointment.startTime).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}
                {new Date(nextAppointment.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  nextAppointment.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {nextAppointment.status === "confirmed" ? "✓ Confirmada" : "Pendiente de confirmar"}
                </span>
                <span className="text-xs text-gray-500">
                  {nextAppointment.modality === "online" ? "🌐 Online" : "📍 Presencial"}
                </span>
              </div>
              {nextAppointment.status === "scheduled" && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white text-xs h-7"
                    onClick={e => {
                      e.stopPropagation();
                      updateAppointmentMutation.mutate({ appointmentId: nextAppointment.id, status: "confirmed" });
                    }}
                  >
                    Confirmar asistencia
                  </Button>
                </div>
              )}
            </button>
          ) : (
            <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-400">📅 No tienes citas próximas programadas</p>
            </div>
          )}

          {/* Menú activo de la semana */}
          {activeMenu ? (
            <button
              onClick={() => setView("menus")}
              className="w-full text-left p-4 bg-white rounded-2xl border border-green-100 shadow-sm hover:border-green-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🥗</span>
                  <span className="font-semibold text-gray-900 text-sm">Menú activo</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Esta semana</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Ver todos →</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{activeMenu.menu.originalMenuTitle ?? "Menú personalizado"}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                De: <strong>{activeMenu.expertUser?.name ?? "Tu nutricionista"}</strong>
                {activeMenu.menu.weekStartDate && (
                  <> · Semana del {new Date(activeMenu.menu.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</>
                )}
              </p>
              {activeMenu.menu.expertNotes && (
                <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1.5 rounded-lg border-l-2 border-orange-300 line-clamp-2">
                  💬 {activeMenu.menu.expertNotes}
                </p>
              )}
              {myAssignedMenus && myAssignedMenus.length > 1 && (
                <p className="text-xs text-gray-400 mt-1.5">+{myAssignedMenus.length - 1} menús anteriores</p>
              )}
            </button>
          ) : (
            <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
              <p className="text-sm text-gray-400">🥗 Tu nutricionista aún no te ha asignado ningún menú</p>
            </div>
          )}

          {/* Mi evolución */}
          {progressRecords.length > 0 && (
            <button
              onClick={() => setView("progress")}
              className="w-full text-left p-4 bg-white rounded-2xl border border-purple-100 shadow-sm hover:border-purple-200 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📈</span>
                  <span className="font-semibold text-gray-900 text-sm">Mi evolución</span>
                </div>
                <span className="text-xs text-purple-500 font-medium">Ver detalle →</span>
              </div>
              {/* Mini gráfica de barras */}
              {progressRecords.filter(r => r.weight).length > 1 && (
                <div className="flex items-end gap-1 h-16 mb-2">
                  {progressRecords.filter(r => r.weight).slice(-8).map((r, i, arr) => {
                    const weights = arr.map(x => x.weight!);
                    const min = Math.min(...weights);
                    const max = Math.max(...weights);
                    const range = max - min || 1;
                    const height = ((r.weight! - min) / range) * 70 + 10;
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={r.id} className="flex-1 flex flex-col items-center gap-0.5">
                        {isLast && <span className="text-[9px] text-gray-500 font-bold">{r.weight}</span>}
                        <div
                          className={`w-full rounded-t transition-all ${isLast ? "bg-orange-500" : "bg-orange-200"}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {latestProgress?.weight && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg">⚖️</span>
                    <div>
                      <p className="text-xs text-gray-500">Peso actual</p>
                      <p className="text-sm font-bold text-gray-900">{latestProgress.weight} kg</p>
                    </div>
                  </div>
                )}
                {weightDiff !== null && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${weightDiff < 0 ? "bg-green-50" : weightDiff > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                    <span className={`text-sm font-bold ${weightDiff < 0 ? "text-green-600" : weightDiff > 0 ? "text-red-500" : "text-gray-500"}`}>
                      {weightDiff < 0 ? `↓ ${Math.abs(weightDiff).toFixed(1)} kg` : weightDiff > 0 ? `↑ ${weightDiff.toFixed(1)} kg` : "Estable"}
                    </span>
                    <span className="text-xs text-gray-400">desde el inicio</span>
                  </div>
                )}
                {latestProgress?.bodyFat && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg">💧</span>
                    <div>
                      <p className="text-xs text-gray-500">% Grasa</p>
                      <p className="text-sm font-bold text-gray-900">{latestProgress.bodyFat}%</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">{progressRecords.length} registros · Último: {new Date(latestProgress?.recordedAt ?? Date.now()).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</p>
            </button>
          )}

        </div>
      </AppLayout>
    );
  }

  // ─── VISTAS DE DETALLE ────────────────────────────────────────────────────
  const BackButton = () => (
    <button
      onClick={() => setView("dashboard")}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors mb-4"
    >
      ← Volver al dashboard
    </button>
  );

  // ─── VISTA: MENSAJES ──────────────────────────────────────────────────────
  if (view === "messages") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
          <BackButton />
          <div className="flex items-center gap-3 mb-4">
            {activeRelation?.expertUser?.imageUrl ? (
              <img src={activeRelation.expertUser.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                {(activeRelation?.expertUser?.name ?? "N").charAt(0)}
              </div>
            )}
            <div>
              <h2 className="font-bold text-gray-900">{activeRelation?.expertUser?.name ?? "Tu nutricionista"}</h2>
              <p className="text-xs text-green-600 font-medium">● En línea</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">💬</div>
                <p>Aún no hay mensajes. Inicia la conversación.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderRole === "patient";
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
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                        isMe
                          ? "bg-orange-500 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        <ChatMarkdown content={msg.content} isExpert={msg.senderRole === "expert"} />
                        <p className={`text-xs mt-1 ${isMe ? "text-orange-100" : "text-gray-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                          {isMe && msg.isRead && <span className="ml-1">✓✓ Leído</span>}
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
      </AppLayout>
    );
  }

  // ─── VISTA: MENÚS ─────────────────────────────────────────────────────────
  if (view === "menus") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <BackButton />
          <h2 className="text-xl font-bold text-gray-900 mb-4">🥗 Mis menús personalizados</h2>
          {!myAssignedMenus || myAssignedMenus.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="text-4xl mb-2">🥗</div>
              <p className="text-gray-500">Tu nutricionista aún no te ha asignado ningún menú</p>
              <p className="text-sm text-gray-400 mt-1">Cuando recibas un menú personalizado, aparecerá aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myAssignedMenus.map((am, idx) => (
                <div key={am.menu.id} className={`p-4 bg-white rounded-xl border ${idx === 0 ? "border-green-200 shadow-sm" : "border-gray-200"}`}>
                  {idx === 0 && (
                    <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium mb-2">
                      ✓ Menú activo
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{am.menu.originalMenuTitle ?? "Menú personalizado"}</span>
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
                            {am.menu.adaptationNotes}
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
      </AppLayout>
    );
  }

  // ─── VISTA: CITAS ─────────────────────────────────────────────────────────
  if (view === "appointments") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <BackButton />
          <h2 className="text-xl font-bold text-gray-900 mb-4">📅 Mis citas</h2>
          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-gray-500">No tienes citas programadas</p>
              <p className="text-sm text-gray-400 mt-1">Tu nutricionista programará las citas cuando sea necesario</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map(appt => {
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
                    <div key={appt.id} className={`p-4 bg-white rounded-xl border ${isUpcoming ? "border-orange-200 shadow-sm" : "border-gray-200"}`}>
                      {isUpcoming && (
                        <span className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium mb-2">
                          Próxima
                        </span>
                      )}
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
                            className="bg-green-500 hover:bg-green-600 text-white text-xs flex-shrink-0"
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
      </AppLayout>
    );
  }

  // ─── VISTA: MI EVOLUCIÓN ──────────────────────────────────────────────────
  if (view === "progress") {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <BackButton />
          <h2 className="text-xl font-bold text-gray-900 mb-4">📈 Mi evolución</h2>
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
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Evolución de peso</h4>
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
                          <span className="text-xs text-gray-500">{isLast ? r.weight : ""}</span>
                          <div
                            className={`w-full rounded-t ${isLast ? "bg-orange-500" : "bg-orange-200"}`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {weightDiff !== null && (
                    <p className={`text-sm font-medium mt-2 ${weightDiff < 0 ? "text-green-600" : weightDiff > 0 ? "text-red-500" : "text-gray-500"}`}>
                      {weightDiff < 0 ? `↓ Has perdido ${Math.abs(weightDiff).toFixed(1)} kg desde el inicio` :
                       weightDiff > 0 ? `↑ Has ganado ${weightDiff.toFixed(1)} kg desde el inicio` :
                       "Peso estable"}
                    </p>
                  )}
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
      </AppLayout>
    );
  }

  return null;
}
