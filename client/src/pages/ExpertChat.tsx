// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function formatTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return d.toLocaleDateString("es-ES", { weekday: "short" });
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function formatMessageTime(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return `Ayer ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ExpertChat() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPatientRelId, setSelectedPatientRelId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lista de pacientes con mensajes no leídos
  const { data: patients, isLoading: loadingPatients, refetch: refetchPatients } = trpc.expertPatients.getPatients.useQuery(
    { status: "active" },
    { enabled: !!user, refetchInterval: 10000 }
  );

  // Mensajes del paciente seleccionado
  const { data: detail, refetch: refetchDetail } = trpc.expertPatients.getPatientDetail.useQuery(
    { patientRelId: selectedPatientRelId! },
    { enabled: !!selectedPatientRelId, refetchInterval: 5000 }
  );

  // Marcar como leídos al abrir conversación
  const markReadMutation = trpc.expertPatients.markMessagesRead.useMutation();

  const sendMessageMutation = trpc.expertPatients.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchDetail();
      refetchPatients();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: () => toast.error("Error al enviar el mensaje"),
  });

  // Seleccionar paciente
  const handleSelectPatient = (relId: number) => {
    setSelectedPatientRelId(relId);
    markReadMutation.mutate({ patientRelId: relId });
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  // Auto-scroll al abrir conversación
  useEffect(() => {
    if (detail?.messages) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    }
  }, [detail?.messages?.length, selectedPatientRelId]);

  // Marcar como leídos cuando llegan nuevos mensajes
  useEffect(() => {
    if (selectedPatientRelId && detail?.messages) {
      const hasUnread = detail.messages.some(m => !m.isRead && m.senderRole === "patient");
      if (hasUnread) markReadMutation.mutate({ patientRelId: selectedPatientRelId });
    }
  }, [detail?.messages]);

  // Seleccionar primer paciente activo automáticamente
  useEffect(() => {
    if (patients && patients.length > 0 && !selectedPatientRelId) {
      // Priorizar pacientes con mensajes no leídos
      const withUnread = patients.find(p => (p.unreadMessages ?? 0) > 0);
      handleSelectPatient(withUnread?.id ?? patients[0].id);
    }
  }, [patients]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedPatientRelId || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate({ patientRelId: selectedPatientRelId, content: messageText.trim() });
  };

  const filteredPatients = patients?.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.user?.name?.toLowerCase().includes(s) || p.user?.email?.toLowerCase().includes(s);
  }) ?? [];

  const selectedPatient = patients?.find(p => p.id === selectedPatientRelId);
  const messages = detail?.messages ?? [];

  if (!user) return null;

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* ── Panel izquierdo: Lista de pacientes ── */}
        <div className={`${selectedPatientRelId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-shrink-0 border-r border-gray-200 flex-col bg-gray-50`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-lg">Mensajes</h2>
              <button
                onClick={() => navigate("/app/expert/patients")}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Ver todos →
              </button>
            </div>
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {loadingPatients ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-500 text-sm">
                  {search ? "No se encontraron pacientes" : "No tienes pacientes activos aún"}
                </p>
                {!search && (
                  <button
                    onClick={() => navigate("/app/expert/patients")}
                    className="mt-3 text-sm text-orange-600 hover:underline"
                  >
                    Invitar pacientes →
                  </button>
                )}
              </div>
            ) : (
              filteredPatients.map(patient => {
                const isSelected = patient.id === selectedPatientRelId;
                const hasUnread = (patient.unreadMessages ?? 0) > 0;
                return (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 ${
                      isSelected
                        ? "bg-orange-50 border-l-4 border-l-orange-500"
                        : "hover:bg-white"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {patient.user?.imageUrl ? (
                        <img
                          src={patient.user.imageUrl}
                          alt={patient.user.name ?? "Paciente"}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                          {(patient.user?.name ?? "P").charAt(0).toUpperCase()}
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {patient.unreadMessages}
                        </span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm font-semibold truncate ${hasUnread ? "text-gray-900" : "text-gray-700"}`}>
                          {patient.user?.name ?? "Paciente"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{patient.user?.email ?? "—"}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Panel derecho: Conversación ── */}
        <div className={`${selectedPatientRelId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0`}>
          {!selectedPatientRelId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Selecciona una conversación</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Elige un paciente de la lista para ver y enviar mensajes
              </p>
            </div>
          ) : (
            <>
              {/* Header de la conversación */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white">
                {/* Botón volver en móvil */}
                <button
                  onClick={() => setSelectedPatientRelId(null)}
                  className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {selectedPatient?.user?.imageUrl ? (
                  <img
                    src={selectedPatient.user.imageUrl}
                    alt={selectedPatient.user.name ?? "Paciente"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                    {(selectedPatient?.user?.name ?? "P").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {selectedPatient?.user?.name ?? "Paciente"}
                  </h3>
                  <p className="text-xs text-gray-400">{selectedPatient?.user?.email ?? ""}</p>
                </div>
                <button
                  onClick={() => navigate(`/app/expert/patients/${selectedPatientRelId}`)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  Ver perfil completo →
                </button>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-5xl mb-3">💬</div>
                    <p className="text-gray-500 font-medium">Inicia la conversación</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Envía un mensaje a {selectedPatient?.user?.name ?? "tu paciente"}
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, idx) => {
                      const isExpert = msg.senderRole === "expert";
                      const prevMsg = messages[idx - 1];
                      const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex items-center gap-3 my-4">
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
                                {(selectedPatient?.user?.name ?? "P").charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className={`max-w-[70%] min-w-0 ${isExpert ? "items-end" : "items-start"} flex flex-col`}>
                              <div className={`rounded-2xl px-4 py-2.5 min-w-0 ${
                                isExpert
                                  ? "bg-orange-500 text-white rounded-br-sm"
                                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
                              }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed break-words overflow-wrap-anywhere">{msg.content}</p>
                              </div>
                              <p className={`text-xs mt-1 ${isExpert ? "text-right text-gray-400" : "text-gray-400"}`}>
                                {formatMessageTime(msg.createdAt)}
                                {isExpert && msg.isRead && (
                                  <span className="ml-1 text-orange-400">✓✓</span>
                                )}
                                {isExpert && !msg.isRead && (
                                  <span className="ml-1 text-gray-300">✓</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input de mensaje */}
              <div className="px-5 py-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      placeholder={`Mensaje para ${selectedPatient?.user?.name ?? "el paciente"}...`}
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="pr-4 py-3 rounded-xl border-gray-300 focus:border-orange-400 focus:ring-orange-400"
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-5 py-3 h-auto"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Pulsa <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">Enter</kbd> para enviar
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
