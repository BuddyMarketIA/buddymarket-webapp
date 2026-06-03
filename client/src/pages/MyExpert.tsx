// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMarkdown } from "@/lib/renderChatMarkdown";

type View = "dashboard" | "messages" | "menus" | "menu_detail" | "appointments" | "progress" | "request_appointment" | "documents";

const DAY_LABELS: Record<string, string> = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
};
const MEAL_LABELS: Record<string, string> = {
  breakfast: "🌅 Desayuno", midmorning: "☕ Media mañana", lunch: "🍽️ Comida",
  snack: "🍎 Merienda", dinner: "🌙 Cena", supper: "🌛 Resopón",
};
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function parseMenuData(data: string | null | undefined): Record<string, Record<string, string>> | null {
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function checkMenuCompatibility(menuData: Record<string, Record<string, string>>, allergies: string[], restrictions: string[], dislikedFoods: string) {
  const issues: { day: string; meal: string; text: string; reason: string }[] = [];
  const allContent = Object.entries(menuData);
  const allergyList = allergies.map(a => a.toLowerCase());
  const restrictionList = restrictions.map(r => r.toLowerCase());
  const dislikedList = dislikedFoods ? dislikedFoods.toLowerCase().split(",").map(s => s.trim()).filter(Boolean) : [];

  for (const [day, meals] of allContent) {
    for (const [meal, text] of Object.entries(meals)) {
      const textLower = text.toLowerCase();
      for (const allergen of allergyList) {
        if (textLower.includes(allergen)) {
          issues.push({ day, meal, text, reason: `Contiene "${allergen}" (alergia)` });
        }
      }
      for (const restriction of restrictionList) {
        if (textLower.includes(restriction)) {
          issues.push({ day, meal, text, reason: `Contiene "${restriction}" (restricción)` });
        }
      }
      for (const disliked of dislikedList) {
        if (disliked.length > 2 && textLower.includes(disliked)) {
          issues.push({ day, meal, text, reason: `Contiene "${disliked}" (no te gusta)` });
        }
      }
    }
  }
  return issues;
}

export default function MyExpert() {
  const { user } = useAuth();
  const [activeRelId, setActiveRelId] = useState<number | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [messageText, setMessageText] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqDate, setReqDate] = useState("");
  const [reqTime, setReqTime] = useState("");
  const [reqModality, setReqModality] = useState<"online" | "in_person">("online");
  const [reqNotes, setReqNotes] = useState("");
  const [menuRating, setMenuRating] = useState(0);
  const [menuFeedbackText, setMenuFeedbackText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: myExperts, isLoading: loadingExperts } = trpc.expertPatients.getMyExperts.useQuery(
    undefined, { enabled: !!user }
  );
  const { data: detail, refetch: refetchDetail } = trpc.expertPatients.getPatientDetail.useQuery(
    { patientRelId: activeRelId! },
    { enabled: !!activeRelId, refetchInterval: view === "messages" ? 5000 : 30000 }
  );
  const { data: myAssignedMenus, refetch: refetchMenus } = trpc.expertPatients.getMyAssignedMenus.useQuery(
    undefined, { enabled: !!user }
  );
  const { data: menuPrefs } = trpc.menus.getMenuPreferences.useQuery(
    undefined, { enabled: !!user }
  );
  const markReadMutation = trpc.expertPatients.markMessagesRead.useMutation();
  const sendMessageMutation = trpc.expertPatients.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("");
      refetchDetail();
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    },
    onError: () => toast.error("Error al enviar el mensaje"),
  });
  const requestAppointmentMutation = trpc.expertPatients.requestAppointment.useMutation({
    onSuccess: () => {
      toast.success("✅ Solicitud enviada. Tu nutricionista te confirmará la cita.");
      setShowRequestModal(false);
      setReqDate(""); setReqTime(""); setReqNotes("");
      refetchDetail();
    },
    onError: () => toast.error("Error al enviar la solicitud"),
  });
  const submitFeedbackMutation = trpc.expertPatients.submitMenuFeedback.useMutation({
    onSuccess: () => {
      toast.success("¡Gracias por tu valoración!");
      setMenuRating(0); setMenuFeedbackText("");
      refetchMenus();
    },
    onError: () => toast.error("Error al enviar la valoración"),
  });
  const updateAppointmentMutation = trpc.expertPatients.updateAppointment.useMutation({
    onSuccess: () => { toast.success("Cita confirmada"); refetchDetail(); },
    onError: () => toast.error("Error al actualizar la cita"),
  });

  // Documentos del paciente
  const [showPatientDocModal, setShowPatientDocModal] = useState(false);
  const [patientDocFile, setPatientDocFile] = useState<File | null>(null);
  const [patientDocForm, setPatientDocForm] = useState({ title: "", description: "", documentType: "blood_test" as "nutrition_plan" | "blood_test" | "medical_report" | "scale_export" | "progress_photo" | "consent_form" | "other" });
  const [patientDocUploading, setPatientDocUploading] = useState(false);
  const { data: patientDocuments, refetch: refetchPatientDocs } = trpc.expertDocuments.getDocuments.useQuery(
    { expertPatientId: activeRelId ?? 0, documentType: "all" },
    { enabled: !!activeRelId && view === "documents" }
  );
  const handlePatientDocUpload = async () => {
    if (!patientDocFile || !patientDocForm.title || !activeRelId) return;
    setPatientDocUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        await trpc.expertDocuments.uploadDocument.mutate({
          expertPatientId: activeRelId,
          title: patientDocForm.title,
          description: patientDocForm.description || undefined,
          documentType: patientDocForm.documentType,
          visibility: "shared",
          fileBase64: base64,
          fileName: patientDocFile.name,
          mimeType: patientDocFile.type,
          fileSize: patientDocFile.size,
          uploaderRole: "patient",
        });
        toast.success("Documento enviado a tu nutricionista");
        setShowPatientDocModal(false);
        setPatientDocFile(null);
        setPatientDocForm({ title: "", description: "", documentType: "blood_test" });
        refetchPatientDocs();
        setPatientDocUploading(false);
      };
      reader.readAsDataURL(patientDocFile);
    } catch {
      toast.error("Error al subir el documento");
      setPatientDocUploading(false);
    }
  };

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

  // Fix: compute menuItem here (after all hooks) to avoid render-phase setState (React error #310)
  const menuItemForDetail = (view === "menu_detail" && selectedMenuId && myAssignedMenus)
    ? myAssignedMenus.find(m => m.menu.id === selectedMenuId)
    : undefined;

  useEffect(() => {
    // Redirect to menus list if the selected menu is no longer found (after data loads)
    if (view === "menu_detail" && selectedMenuId && myAssignedMenus && !menuItemForDetail) {
      setView("menus");
    }
  }, [view, selectedMenuId, myAssignedMenus, menuItemForDetail]);

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
          <h2 className="text-2xl font-bold text-foreground mb-3">Sin nutricionista asignado</h2>
          <p className="text-muted-foreground mb-6">
            Aún no tienes un BuddyExpert asignado. Cuando un nutricionista te invite, podrás ver aquí tus menús personalizados, mensajes y citas.
          </p>
          <Button onClick={() => window.location.href = "/app/buddy-experts"} className="bg-orange-500 hover:bg-orange-600 text-white">
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
  const unreadCount = messages.filter(m => !m.isRead && m.senderRole === "expert").length;
  const lastMessage = messages[messages.length - 1];
  const nextAppointment = appointments
    .filter(a => new Date(a.startTime) > new Date() && a.status !== "cancelled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  const activeMenu = myAssignedMenus?.[0];
  const latestProgress = progressRecords[progressRecords.length - 1];
  const firstProgress = progressRecords[0];
  const weightDiff = latestProgress?.weight && firstProgress?.weight
    ? latestProgress.weight - firstProgress.weight : null;

  // ─── MODAL PEDIR CITA ──────────────────────────────────────────────────────
  const RequestAppointmentModal = () => (
    <div className="fixed inset-0 bg-black/50 z-[500] flex items-end sm:items-center justify-center p-4">
      <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">📅 Pedir cita</h3>
          <button onClick={() => setShowRequestModal(false)} className="text-muted-foreground/70 hover:text-muted-foreground text-xl">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Indica tu preferencia y tu nutricionista <strong>{activeRelation?.expertUser?.name ?? "te"}</strong> confirmará la cita.
          </p>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Fecha preferida</label>
            <input
              type="date"
              value={reqDate}
              onChange={e => setReqDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Hora preferida</label>
            <input
              type="time"
              value={reqTime}
              onChange={e => setReqTime(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Modalidad</label>
            <div className="flex gap-2">
              {[{ value: "online", label: "🌐 Online", desc: "Videollamada" }, { value: "in_person", label: "📍 Presencial", desc: "En consulta" }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReqModality(opt.value as "online" | "in_person")}
                  className={`flex-1 py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                    reqModality === opt.value ? "bg-orange-500 text-white border-orange-500" : "bg-background text-foreground/80 border-border hover:border-orange-300"
                  }`}
                >
                  {opt.label}<br /><span className="text-xs opacity-75">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">Notas adicionales <span className="text-muted-foreground/70">(opcional)</span></label>
            <textarea
              value={reqNotes}
              onChange={e => setReqNotes(e.target.value)}
              placeholder="Ej: Quiero revisar mi progreso de este mes..."
              rows={2}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        </div>
        <div className="p-5 pt-0 flex gap-2">
          <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1">Cancelar</Button>
          <Button
            onClick={() => activeRelId && requestAppointmentMutation.mutate({
              patientRelId: activeRelId,
              preferredDate: reqDate || undefined,
              preferredTime: reqTime || undefined,
              modality: reqModality,
              notes: reqNotes || undefined,
            })}
            disabled={requestAppointmentMutation.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {requestAppointmentMutation.isPending ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>
      </div>
    </div>
  );

  // ─── VISTA: DETALLE DE MENÚ ────────────────────────────────────────────────
  if (view === "menu_detail" && selectedMenuId) {
    const menuItem = menuItemForDetail;
    if (!menuItem) { return null; } // redirect handled by useEffect above

    const rawMenuData = menuItem.menu.adaptedMenuData || menuItem.originalMenu?.menuData;
    const menuData = parseMenuData(rawMenuData);
    const allergies = menuPrefs?.allergies ?? [];
    const restrictions = menuPrefs?.restrictions ?? [];
    const dislikedFoods = menuPrefs?.dislikedFoods ?? "";
    const issues = menuData ? checkMenuCompatibility(menuData, allergies, restrictions, dislikedFoods) : [];
    const isCompatible = issues.length === 0;
    const hasPrefs = allergies.length > 0 || restrictions.length > 0 || dislikedFoods.length > 0;
    const days = menuData ? DAY_ORDER.filter(d => menuData[d]) : [];
    const existingRating = menuItem.menu.patientRating;

    return (
      <AppLayout>
        {showRequestModal && <RequestAppointmentModal />}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button onClick={() => setView("menus")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-orange-600 transition-colors mb-4">
            ← Volver a mis menús
          </button>

          {/* Header del menú */}
          <div className="bg-background rounded-2xl border border-border shadow-sm p-5 mb-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{menuItem.menu.originalMenuTitle ?? "Menú personalizado"}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  De <strong>{menuItem.expertUser?.name ?? "tu nutricionista"}</strong>
                  {menuItem.menu.weekStartDate && (
                    <> · Semana del {new Date(menuItem.menu.weekStartDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</>
                  )}
                </p>
              </div>
              <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-medium ${
                menuItem.menu.status === "active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
              }`}>
                {menuItem.menu.status === "active" ? "✓ Activo" : "Asignado"}
              </span>
            </div>

            {menuItem.originalMenu?.description && (
              <p className="text-sm text-muted-foreground mb-3">{menuItem.originalMenu.description}</p>
            )}

            {menuItem.originalMenu?.targetCalories && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                <span className="text-base">🔥</span>
                <span>~{menuItem.originalMenu.targetCalories} kcal/día</span>
              </div>
            )}

            {menuItem.menu.expertNotes && (
              <div className="bg-orange-50 border-l-2 border-orange-400 rounded-r-xl p-3">
                <p className="text-xs font-semibold text-orange-700 mb-1">💬 Nota de tu nutricionista</p>
                <p className="text-sm text-foreground/80">{menuItem.menu.expertNotes}</p>
              </div>
            )}
          </div>

          {/* Verificación de compatibilidad */}
          {hasPrefs && (
            <div className={`rounded-2xl p-4 mb-4 border ${isCompatible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{isCompatible ? "✅" : "⚠️"}</span>
                <span className={`font-semibold text-sm ${isCompatible ? "text-green-800" : "text-red-800"}`}>
                  {isCompatible ? "Compatible con tus restricciones" : `${issues.length} posible${issues.length > 1 ? "s" : ""} incompatibilidad${issues.length > 1 ? "es" : ""}`}
                </span>
              </div>
              {!isCompatible && (
                <div className="space-y-1.5">
                  {issues.slice(0, 5).map((issue, i) => (
                    <div key={i} className="text-xs text-red-700 bg-red-100 rounded-lg px-2 py-1.5">
                      <span className="font-medium">{DAY_LABELS[issue.day] ?? issue.day} · {MEAL_LABELS[issue.meal] ?? issue.meal}:</span>{" "}
                      {issue.reason}
                    </div>
                  ))}
                  {issues.length > 5 && (
                    <p className="text-xs text-red-600">+{issues.length - 5} más. Habla con tu nutricionista para adaptar el menú.</p>
                  )}
                </div>
              )}
              {isCompatible && (
                <p className="text-xs text-green-700">
                  Este menú respeta tus alergias{allergies.length > 0 ? ` (${allergies.join(", ")})` : ""} y restricciones.
                </p>
              )}
            </div>
          )}

          {!hasPrefs && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4 text-sm text-amber-700">
              💡 <strong>Tip:</strong> Añade tus alergias y restricciones en tu perfil para que verifiquemos automáticamente la compatibilidad de cada menú.
            </div>
          )}

          {/* Contenido del menú por días */}
          {menuData && days.length > 0 ? (
            <div className="space-y-3 mb-4">
              <h3 className="font-semibold text-foreground text-base">📋 Contenido del menú</h3>
              {days.map(day => {
                const dayMeals = menuData[day];
                const dayIssues = issues.filter(i => i.day === day);
                return (
                  <div key={day} className={`bg-background rounded-xl border p-4 ${dayIssues.length > 0 ? "border-red-200" : "border-border"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{DAY_LABELS[day] ?? day}</h4>
                      {dayIssues.length > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ {dayIssues.length} aviso</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {Object.entries(dayMeals).map(([meal, text]) => {
                        const hasIssue = issues.some(i => i.day === day && i.meal === meal);
                        return (
                          <div key={meal} className={`flex gap-2 text-sm ${hasIssue ? "bg-red-50 rounded-lg px-2 py-1" : ""}`}>
                            <span className="flex-shrink-0 text-muted-foreground w-28 text-xs pt-0.5">
                              {MEAL_LABELS[meal] ?? meal}
                            </span>
                            <span className={`flex-1 ${hasIssue ? "text-red-700" : "text-foreground/80"}`}>{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-muted/30 rounded-xl border border-dashed border-border p-6 text-center mb-4">
              <p className="text-muted-foreground text-sm">El contenido detallado de este menú no está disponible aún.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Consulta con tu nutricionista para más detalles.</p>
            </div>
          )}

          {/* Valorar el menú */}
          {!existingRating && (
            <div className="bg-background rounded-2xl border border-border p-4 mb-4">
              <h4 className="font-semibold text-foreground mb-3">⭐ ¿Qué te parece este menú?</h4>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button key={star} onClick={() => setMenuRating(star)} className={`text-2xl transition-transform hover:scale-110 ${star <= menuRating ? "opacity-100" : "opacity-30"}`}>
                    ⭐
                  </button>
                ))}
              </div>
              {menuRating > 0 && (
                <>
                  <textarea
                    value={menuFeedbackText}
                    onChange={e => setMenuFeedbackText(e.target.value)}
                    placeholder="Cuéntale a tu nutricionista qué te ha parecido (opcional)..."
                    rows={2}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none mb-2"
                  />
                  <Button
                    onClick={() => submitFeedbackMutation.mutate({ assignedMenuId: selectedMenuId, rating: menuRating, feedback: menuFeedbackText || undefined })}
                    disabled={submitFeedbackMutation.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {submitFeedbackMutation.isPending ? "Enviando..." : "Enviar valoración"}
                  </Button>
                </>
              )}
            </div>
          )}
          {existingRating && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
              ⭐ Ya valoraste este menú con {existingRating}/5 estrellas.
              {menuItem.menu.patientFeedback && <p className="mt-1 text-muted-foreground italic">"{menuItem.menu.patientFeedback}"</p>}
            </div>
          )}

          {/* Botón pedir cita */}
          <Button
            onClick={() => setShowRequestModal(true)}
            variant="outline"
            className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            📅 Pedir cita para hablar sobre este menú
          </Button>
        </div>
      </AppLayout>
    );
  }

  // ─── VISTA: DASHBOARD ─────────────────────────────────────────────────────
  if (view === "dashboard") {
    return (
      <AppLayout>
        {showRequestModal && <RequestAppointmentModal />}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Mi Nutricionista</h1>
            {myExperts.length > 1 && (
              <select value={activeRelId ?? ""} onChange={e => setActiveRelId(Number(e.target.value))}
                className="text-sm border border-border rounded-lg px-2 py-1 text-foreground/80">
                {myExperts.map(e => (
                  <option key={e.relation.id} value={e.relation.id}>{e.expertUser?.name ?? "Nutricionista"}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tarjeta del nutricionista */}
          {activeRelation && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 p-5 text-white shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                {activeRelation.expertUser?.imageUrl ? (
                  <img src={activeRelation.expertUser.imageUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/40" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-background/20 flex items-center justify-center text-white font-bold text-2xl border-2 border-white/40">
                    {(activeRelation.expertUser?.name ?? "N").charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium">Tu nutricionista</p>
                  <h2 className="text-xl font-bold truncate">{activeRelation.expertUser?.name ?? "Tu nutricionista"}</h2>
                  <span className="inline-flex items-center gap-1 text-xs bg-background/20 px-2 py-0.5 rounded-full mt-1">✓ BuddyExpert verificado</span>
                </div>
              </div>
              {/* Acciones rápidas */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setView("messages")}
                  className="flex items-center justify-center gap-1.5 bg-background/20 hover:bg-background/30 transition-colors rounded-xl py-2.5 text-sm font-semibold">
                  💬 Chat
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full min-w-[18px] px-1 font-bold">{unreadCount}</span>
                  )}
                </button>
                <button onClick={() => setShowRequestModal(true)}
                  className="flex items-center justify-center gap-1.5 bg-background text-orange-600 hover:bg-background/90 transition-colors rounded-xl py-2.5 text-sm font-bold shadow-sm">
                  📅 Pedir cita
                </button>
                <button onClick={() => setView("appointments")}
                  className="flex items-center justify-center gap-1.5 bg-background/20 hover:bg-background/30 transition-colors rounded-xl py-2.5 text-sm font-semibold">
                  🗓️ Mis citas
                </button>
                <button onClick={() => setView("menus")}
                  className="flex items-center justify-center gap-1.5 bg-background/20 hover:bg-background/30 transition-colors rounded-xl py-2.5 text-sm font-semibold">
                  🥗 Mis menús
                </button>
                <button onClick={() => setView("documents")}
                  className="flex items-center justify-center gap-1.5 bg-background/20 hover:bg-background/30 transition-colors rounded-xl py-2.5 text-sm font-semibold col-span-2">
                  📂 Mis documentos
                </button>
              </div>
            </div>
          )}

          {/* Último mensaje */}
          {lastMessage && (
            <button onClick={() => setView("messages")}
              className="w-full text-left p-4 bg-background rounded-2xl border border-border/50 shadow-sm hover:border-orange-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <span className="font-semibold text-foreground text-sm">Último mensaje</span>
                  {unreadCount > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                      {unreadCount} nuevo{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <span className="text-xs text-orange-500 font-medium">Ver chat →</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {lastMessage.senderRole === "expert" ? "👩‍⚕️ " : "Tú: "}
                {lastMessage.content.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^#+\s/gm, "")}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {new Date(lastMessage.createdAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </button>
          )}

          {/* Próxima cita */}
          {nextAppointment ? (
            <button onClick={() => setView("appointments")}
              className="w-full text-left p-4 bg-background rounded-2xl border border-blue-100 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <span className="font-semibold text-foreground text-sm">Próxima cita</span>
                </div>
                <span className="text-xs text-blue-500 font-medium">Ver todas →</span>
              </div>
              <p className="text-sm font-medium text-foreground">{nextAppointment.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {new Date(nextAppointment.startTime).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}{new Date(nextAppointment.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${nextAppointment.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {nextAppointment.status === "confirmed" ? "✓ Confirmada" : "Pendiente de confirmar"}
                </span>
                <span className="text-xs text-muted-foreground">{nextAppointment.modality === "online" ? "🌐 Online" : "📍 Presencial"}</span>
              </div>
              {nextAppointment.status === "scheduled" && (
                <div className="mt-2">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs h-7"
                    onClick={e => { e.stopPropagation(); updateAppointmentMutation.mutate({ appointmentId: nextAppointment.id, status: "confirmed" }); }}>
                    Confirmar asistencia
                  </Button>
                </div>
              )}
            </button>
          ) : (
            <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground/70">📅 No tienes citas próximas</p>
                <button onClick={() => setShowRequestModal(true)}
                  className="text-xs text-orange-600 font-semibold hover:underline">
                  + Pedir cita
                </button>
              </div>
            </div>
          )}

          {/* Menú activo */}
          {activeMenu ? (
            <button onClick={() => { setSelectedMenuId(activeMenu.menu.id); setView("menu_detail"); }}
              className="w-full text-left p-4 bg-background rounded-2xl border border-green-100 shadow-sm hover:border-green-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🥗</span>
                  <span className="font-semibold text-foreground text-sm">Menú activo</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Esta semana</span>
                </div>
                <span className="text-xs text-green-600 font-medium">Ver contenido →</span>
              </div>
              <p className="text-sm font-medium text-foreground">{activeMenu.menu.originalMenuTitle ?? "Menú personalizado"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">De: <strong>{activeMenu.expertUser?.name ?? "Tu nutricionista"}</strong></p>
              {activeMenu.menu.expertNotes && (
                <p className="text-xs text-orange-600 mt-2 bg-orange-50 px-2 py-1.5 rounded-lg border-l-2 border-orange-300 line-clamp-2">
                  💬 {activeMenu.menu.expertNotes}
                </p>
              )}
              <p className="text-xs text-muted-foreground/70 mt-2">Toca para ver el contenido completo y verificar compatibilidad</p>
            </button>
          ) : (
            <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border text-center">
              <p className="text-sm text-muted-foreground/70">🥗 Tu nutricionista aún no te ha asignado ningún menú</p>
            </div>
          )}

          {/* Mi evolución */}
          {progressRecords.length > 0 && (
            <button onClick={() => setView("progress")}
              className="w-full text-left p-4 bg-background rounded-2xl border border-purple-100 shadow-sm hover:border-purple-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">📈</span>
                  <span className="font-semibold text-foreground text-sm">Mi evolución</span>
                </div>
                <span className="text-xs text-purple-500 font-medium">Ver detalle →</span>
              </div>
              {progressRecords.filter(r => r.weight).length > 1 && (
                <div className="flex items-end gap-1 h-12 mb-2">
                  {progressRecords.filter(r => r.weight).slice(-8).map((r, i, arr) => {
                    const weights = arr.map(x => x.weight!);
                    const min = Math.min(...weights); const max = Math.max(...weights);
                    const height = ((r.weight! - min) / (max - min || 1)) * 70 + 10;
                    const isLast = i === arr.length - 1;
                    return (
                      <div key={r.id} className="flex-1 flex flex-col items-center gap-0.5">
                        {isLast && <span className="text-[9px] text-muted-foreground font-bold">{r.weight}</span>}
                        <div className={`w-full rounded-t ${isLast ? "bg-orange-500" : "bg-orange-200"}`} style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {latestProgress?.weight && (
                  <div className="flex items-center gap-1">
                    <span>⚖️</span>
                    <div><p className="text-xs text-muted-foreground">Peso actual</p><p className="text-sm font-bold text-foreground">{latestProgress.weight} kg</p></div>
                  </div>
                )}
                {weightDiff !== null && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${weightDiff < 0 ? "bg-green-50" : weightDiff > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                    <span className={`text-sm font-bold ${weightDiff < 0 ? "text-green-600" : weightDiff > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      {weightDiff < 0 ? `↓ ${Math.abs(weightDiff).toFixed(1)} kg` : weightDiff > 0 ? `↑ ${weightDiff.toFixed(1)} kg` : "Estable"}
                    </span>
                    <span className="text-xs text-muted-foreground/70">desde el inicio</span>
                  </div>
                )}
              </div>
            </button>
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── VISTAS DE DETALLE ────────────────────────────────────────────────────
  const BackButton = ({ to = "dashboard" as View, label = "Volver al dashboard" }) => (
    <button onClick={() => setView(to)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-orange-600 transition-colors mb-4">
      ← {label}
    </button>
  );

  // ─── VISTA: MENSAJES ──────────────────────────────────────────────────────
  if (view === "messages") {
    return (
      <AppLayout>
        {showRequestModal && <RequestAppointmentModal />}
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
            <div className="flex-1">
              <h2 className="font-bold text-foreground">{activeRelation?.expertUser?.name ?? "Tu nutricionista"}</h2>
              <p className="text-xs text-green-600 font-medium">● En línea</p>
            </div>
            <button onClick={() => setShowRequestModal(true)} className="text-xs text-orange-600 font-semibold border border-orange-300 rounded-lg px-2 py-1 hover:bg-orange-50">
              📅 Pedir cita
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground/70">
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
                        <div className="flex-1 h-px bg-muted" />
                        <span className="text-xs text-muted-foreground/70 font-medium">
                          {new Date(msg.createdAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
                        </span>
                        <div className="flex-1 h-px bg-muted" />
                      </div>
                    )}
                    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-orange-500 text-white rounded-br-sm" : "bg-muted/50 text-foreground rounded-bl-sm"}`}>
                        <ChatMarkdown content={msg.content} isExpert={msg.senderRole === "expert"} />
                        <p className={`text-xs mt-1 ${isMe ? "text-orange-100" : "text-muted-foreground/70"}`}>
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
            <Input placeholder="Escribe un mensaje..." value={messageText} onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && messageText.trim() && activeRelId) { e.preventDefault(); sendMessageMutation.mutate({ patientRelId: activeRelId, content: messageText.trim() }); } }}
              className="flex-1" />
            <Button onClick={() => activeRelId && messageText.trim() && sendMessageMutation.mutate({ patientRelId: activeRelId, content: messageText.trim() })}
              disabled={!messageText.trim() || !activeRelId || sendMessageMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white">Enviar</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ─── VISTA: MENÚS ─────────────────────────────────────────────────────────
  if (view === "menus") {
    return (
      <AppLayout>
        {showRequestModal && <RequestAppointmentModal />}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <BackButton />
          <h2 className="text-xl font-bold text-foreground mb-4">🥗 Mis menús personalizados</h2>
          {!myAssignedMenus || myAssignedMenus.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
              <div className="text-4xl mb-2">🥗</div>
              <p className="text-muted-foreground">Tu nutricionista aún no te ha asignado ningún menú</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myAssignedMenus.map((am, idx) => {
                const rawData = am.menu.adaptedMenuData || am.originalMenu?.menuData;
                const menuData = parseMenuData(rawData);
                const allergies = menuPrefs?.allergies ?? [];
                const restrictions = menuPrefs?.restrictions ?? [];
                const dislikedFoods = menuPrefs?.dislikedFoods ?? "";
                const issues = menuData ? checkMenuCompatibility(menuData, allergies, restrictions, dislikedFoods) : [];
                const hasPrefs = allergies.length > 0 || restrictions.length > 0 || dislikedFoods.length > 0;
                return (
                  <button key={am.menu.id} onClick={() => { setSelectedMenuId(am.menu.id); setView("menu_detail"); }}
                    className={`w-full text-left p-4 bg-background rounded-xl border hover:border-orange-200 transition-colors ${idx === 0 ? "border-green-200 shadow-sm" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        {idx === 0 && <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium mb-1.5">✓ Menú activo</span>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{am.menu.originalMenuTitle ?? "Menú personalizado"}</span>
                          {hasPrefs && issues.length === 0 && menuData && <span className="text-xs text-green-600">✅ Compatible</span>}
                          {hasPrefs && issues.length > 0 && <span className="text-xs text-red-600">⚠️ {issues.length} aviso{issues.length > 1 ? "s" : ""}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">De: <strong>{am.expertUser?.name ?? "Tu nutricionista"}</strong></p>
                        {am.originalMenu?.targetCalories && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">🔥 ~{am.originalMenu.targetCalories} kcal/día</p>
                        )}
                        {am.menu.expertNotes && (
                          <p className="text-xs text-orange-600 mt-1.5 line-clamp-1">💬 {am.menu.expertNotes}</p>
                        )}
                      </div>
                      <span className="text-orange-400 text-lg flex-shrink-0">›</span>
                    </div>
                  </button>
                );
              })}
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
        {showRequestModal && <RequestAppointmentModal />}
        <div className="max-w-2xl mx-auto px-4 py-6">
          <BackButton />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">📅 Mis citas</h2>
            <Button onClick={() => setShowRequestModal(true)} size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              + Pedir cita
            </Button>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-muted-foreground">No tienes citas programadas</p>
              <Button onClick={() => setShowRequestModal(true)} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                Pedir mi primera cita
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(appt => {
                const start = new Date(appt.startTime);
                const isUpcoming = start > new Date();
                const statusColors = { scheduled: "bg-blue-100 text-blue-700", confirmed: "bg-green-100 text-green-700", completed: "bg-muted/50 text-muted-foreground", cancelled: "bg-red-100 text-red-600", no_show: "bg-orange-100 text-orange-600" };
                return (
                  <div key={appt.id} className={`p-4 bg-background rounded-xl border ${isUpcoming ? "border-orange-200 shadow-sm" : "border-border"}`}>
                    {isUpcoming && <span className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium mb-2">Próxima</span>}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{appt.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[appt.status]}`}>
                            {appt.status === "scheduled" ? "Programada" : appt.status === "confirmed" ? "Confirmada" : appt.status === "completed" ? "Completada" : appt.status === "cancelled" ? "Cancelada" : "No asistí"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {start.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · {start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-sm text-muted-foreground">{appt.modality === "online" ? "🌐 Online" : "📍 Presencial"}</p>
                        {appt.meetingUrl && isUpcoming && (
                          <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:underline mt-1 inline-block font-medium">🔗 Unirse a la reunión</a>
                        )}
                        {appt.googleCalendarLink && isUpcoming && (
                          <a href={appt.googleCalendarLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 ml-3 inline-block">📅 Añadir a Google Calendar</a>
                        )}
                      </div>
                      {appt.status === "scheduled" && isUpcoming && (
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white text-xs flex-shrink-0"
                          onClick={() => updateAppointmentMutation.mutate({ appointmentId: appt.id, status: "confirmed" })}>
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
          <h2 className="text-xl font-bold text-foreground mb-4">📈 Mi evolución</h2>
          {progressRecords.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
              <div className="text-4xl mb-2">📈</div>
              <p className="text-muted-foreground">Aún no hay registros de evolución</p>
            </div>
          ) : (
            <div className="space-y-3">
              {progressRecords.filter(r => r.weight).length > 1 && (
                <div className="p-4 bg-background rounded-xl border border-border mb-4">
                  <h4 className="text-sm font-semibold text-foreground/80 mb-3">Evolución de peso</h4>
                  <div className="flex items-end gap-1 h-24">
                    {progressRecords.filter(r => r.weight).slice(-12).map((r, i, arr) => {
                      const weights = arr.map(x => x.weight!);
                      const min = Math.min(...weights); const max = Math.max(...weights);
                      const height = ((r.weight! - min) / (max - min || 1)) * 80 + 10;
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={r.id} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-muted-foreground">{isLast ? r.weight : ""}</span>
                          <div className={`w-full rounded-t ${isLast ? "bg-orange-500" : "bg-orange-200"}`} style={{ height: `${height}%` }} />
                        </div>
                      );
                    })}
                  </div>
                  {weightDiff !== null && (
                    <p className={`text-sm font-medium mt-2 ${weightDiff < 0 ? "text-green-600" : weightDiff > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                      {weightDiff < 0 ? `↓ Has perdido ${Math.abs(weightDiff).toFixed(1)} kg desde el inicio` : weightDiff > 0 ? `↑ Has ganado ${weightDiff.toFixed(1)} kg desde el inicio` : "Peso estable"}
                    </p>
                  )}
                </div>
              )}
              {progressRecords.map(record => (
                <div key={record.id} className="p-4 bg-background rounded-xl border border-border">
                  <p className="text-sm font-medium text-foreground/80 mb-2">
                    {new Date(record.recordedAt).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {record.weight && <span className="text-sm text-muted-foreground">⚖️ <strong>{record.weight}</strong> kg</span>}
                    {record.bodyFat && <span className="text-sm text-muted-foreground">💧 <strong>{record.bodyFat}</strong>% grasa</span>}
                    {record.muscleMass && <span className="text-sm text-muted-foreground">💪 <strong>{record.muscleMass}</strong> kg músculo</span>}
                    {record.waist && <span className="text-sm text-muted-foreground">📏 Cintura: <strong>{record.waist}</strong> cm</span>}
                  </div>
                  {record.expertComment && (
                    <p className="text-sm text-orange-600 mt-2 bg-orange-50 px-2 py-1 rounded">💬 Tu nutricionista: {record.expertComment}</p>
                  )}
                  {record.notes && <p className="text-sm text-muted-foreground mt-1 italic">"{record.notes}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ─── VISTA: MIS DOCUMENTOS ────────────────────────────────────────────────────
  if (view === "documents") {
    const docTypeLabels: Record<string, string> = {
      nutrition_plan: "📋 Plan nutricional",
      blood_test: "🩸 Analítica de sangre",
      medical_report: "🏥 Informe médico",
      scale_export: "⚖️ Exportación báscula",
      progress_photo: "📸 Foto de progreso",
      consent_form: "✍️ Consentimiento",
      other: "📎 Otro",
    };
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto px-4 py-6">
          <BackButton />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">📂 Mis documentos</h2>
            <button
              onClick={() => setShowPatientDocModal(true)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              + Subir documento
            </button>
          </div>

          {/* Descripción */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4">
            <p className="text-sm text-orange-700">
              💡 Aquí puedes ver los documentos que tu nutricionista ha compartido contigo (planes, informes, etc.) y subir tus propios documentos como analíticas o exportaciones de báscula.
            </p>
          </div>

          {/* Lista de documentos */}
          {!patientDocuments || patientDocuments.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
              <div className="text-4xl mb-2">📂</div>
              <p className="text-muted-foreground">Aún no hay documentos compartidos</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Tu nutricionista podrá compartir planes, informes y más</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patientDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-start gap-3 p-4 bg-background rounded-xl border border-border hover:border-orange-200 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">
                    {doc.documentType === "progress_photo" ? "📸" : doc.documentType === "blood_test" ? "🩸" : doc.documentType === "nutrition_plan" ? "📋" : doc.documentType === "scale_export" ? "⚖️" : "📎"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {docTypeLabels[doc.documentType] ?? doc.documentType}
                      {" · "}
                      {doc.uploaderRole === "expert" ? "👩‍⚕️ Tu nutricionista" : "Tú"}
                      {" · "}
                      {new Date(doc.uploadedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {doc.description && <p className="text-xs text-muted-foreground/70 mt-1 italic">{doc.description}</p>}
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs text-orange-600 font-medium hover:text-orange-700 bg-orange-50 px-2 py-1 rounded-lg"
                  >
                    Ver ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Subir documento del paciente */}
        {showPatientDocModal && (
          <div className="fixed inset-0 bg-black/50 z-[500] flex items-end sm:items-center justify-center p-4">
            <div className="bg-background rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">📂 Subir documento</h3>
                <button onClick={() => setShowPatientDocModal(false)} className="text-muted-foreground/70 hover:text-muted-foreground text-xl">✕</button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Título *</label>
                  <input
                    type="text"
                    value={patientDocForm.title}
                    onChange={e => setPatientDocForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Analítica de sangre enero 2025"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Tipo de documento</label>
                  <select
                    value={patientDocForm.documentType}
                    onChange={e => setPatientDocForm(prev => ({ ...prev, documentType: e.target.value as typeof patientDocForm.documentType }))}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="blood_test">🩸 Analítica de sangre</option>
                    <option value="scale_export">⚖️ Exportación báscula</option>
                    <option value="progress_photo">📸 Foto de progreso</option>
                    <option value="medical_report">🏥 Informe médico</option>
                    <option value="other">📎 Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Descripción (opcional)</label>
                  <textarea
                    value={patientDocForm.description}
                    onChange={e => setPatientDocForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Notas sobre este documento..."
                    rows={2}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Archivo *</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx"
                    onChange={e => setPatientDocFile(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700"
                  />
                  {patientDocFile && (
                    <p className="text-xs text-muted-foreground mt-1">✅ {patientDocFile.name} ({Math.round(patientDocFile.size / 1024)} KB)</p>
                  )}
                </div>
              </div>
              <div className="p-5 border-t border-border/50 flex gap-3">
                <button
                  onClick={() => setShowPatientDocModal(false)}
                  className="flex-1 py-2.5 text-sm font-medium border border-border rounded-xl text-foreground/80 hover:bg-muted/50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePatientDocUpload}
                  disabled={!patientDocFile || !patientDocForm.title || patientDocUploading}
                  className="flex-1 py-2.5 text-sm font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl transition-colors"
                >
                  {patientDocUploading ? "Subiendo..." : "Enviar al nutricionista"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  return null;
}
