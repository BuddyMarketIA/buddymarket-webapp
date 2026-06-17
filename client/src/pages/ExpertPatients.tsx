// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Users, MessageCircle, Download, UserPlus2 } from "lucide-react";
import OfflinePatientsSection from "@/components/OfflinePatientsSection";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  invited: { label: "Invitado", color: "bg-yellow-100 text-yellow-700" },
  active: { label: "Activo", color: "bg-green-100 text-green-700" },
  paused: { label: "Pausado", color: "bg-muted/50 text-muted-foreground" },
  discharged: { label: "Alta", color: "bg-blue-100 text-blue-700" },
};

export default function ExpertPatients() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "invited" | "paused" | "discharged">("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNotes, setInviteNotes] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteMode, setInviteMode] = useState<"email" | "whatsapp">("email");
  const [expertName, setExpertName] = useState("");
  const [showNewOfflineModal, setShowNewOfflineModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // New offline patient form state
  const [newPatient, setNewPatient] = useState({ name: "", email: "", phone: "", birthDate: "", gender: "", heightCm: "", initialWeightKg: "", targetWeightKg: "", objective: "", allergies: "", notes: "" });

  // WhatsApp helpers
  const getWhatsAppInviteUrl = (phone: string, name?: string | null) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const appUrl = window.location.origin;
    const msg = encodeURIComponent(
      `Hola${name ? ` ${name}` : ""} 👋\n\nTe invito a unirte a *Buddy One*, la plataforma de nutrición inteligente donde podremos trabajar juntos en tu plan personalizado.\n\n👉 Regístrate aquí: ${appUrl}\n\nUna vez registrado, podrás ver tus menús, seguir tu progreso y comunicarte conmigo directamente desde la app. ¡Te espero! 🥗`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  const getWhatsAppReminderUrl = (phone: string, patientName?: string | null) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, "");
    const appUrl = window.location.origin;
    const msg = encodeURIComponent(
      `Hola${patientName ? ` ${patientName}` : ""} 👋\n\nTe recuerdo que tienes una invitación pendiente en *Buddy One* para acceder a tu plan nutricional personalizado.\n\n👉 Accede aquí: ${appUrl}\n\n¡Cualquier duda estoy aquí! 💪`
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  const { data: patients, isLoading, refetch } = trpc.expertPatients.getPatients.useQuery(
    { status: statusFilter, search: search || undefined },
    { enabled: !!user, refetchInterval: 30000 }
  );
  const { data: adherenceData } = trpc.expertPatients.checkPatientsAdherence.useQuery(
    undefined,
    { enabled: !!user && statusFilter !== "invited" }
  );

  const sendWhatsAppReminder = (phone: string, patientName?: string | null) => {
    if (!phone) { toast.error("Este paciente no tiene teléfono registrado"); return; }
    window.open(getWhatsAppReminderUrl(phone, patientName), "_blank");
  };

  const sendReminderMutation = trpc.expertPatients.sendReminderInvite.useMutation({
    onSuccess: () => toast.success("Recordatorio enviado al paciente"),
    onError: (err) => toast.error(err.message || "Error al enviar el recordatorio"),
  });

  const exportQuery = trpc.offlinePatients.exportPatients.useQuery(undefined, { enabled: false });
  const createOfflinePatient = trpc.offlinePatients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente creado correctamente");
      setShowNewOfflineModal(false);
      setNewPatient({ name: "", email: "", phone: "", birthDate: "", gender: "", heightCm: "", initialWeightKg: "", targetWeightKg: "", objective: "", allergies: "", notes: "" });
    },
    onError: (err) => toast.error(err.message || "Error al crear el paciente"),
  });

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const result = await exportQuery.refetch();
      if (result.data?.csv) {
        const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.data.filename ?? "pacientes.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Exportados ${result.data.stats.total} pacientes`);
      }
    } catch (e) {
      toast.error("Error al exportar pacientes");
    } finally {
      setIsExporting(false);
    }
  };

  const inviteMutation = trpc.expertPatients.invitePatient.useMutation({
    onSuccess: (data) => {
      toast.success(data.patientFound
        ? "Invitación enviada al paciente"
        : "Invitación enviada por email. El paciente recibirá un enlace para unirse."
      );
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteNotes("");
      refetch();
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        toast.error("Este paciente ya está en tu lista");
      } else {
        toast.error("Error al enviar la invitación");
      }
    },
  });

  if (!user) return null;

  const filteredPatients = patients?.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.user?.name?.toLowerCase().includes(s) ||
      p.user?.email?.toLowerCase().includes(s)
    );
  }) ?? [];

  const totalActive = patients?.filter(p => p.status === "active").length ?? 0;
  const totalUnread = patients?.reduce((acc, p) => acc + (p.unreadMessages ?? 0), 0) ?? 0;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Pacientes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalActive} paciente{totalActive !== 1 ? "s" : ""} activo{totalActive !== 1 ? "s" : ""}
              {totalUnread > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-orange-600 font-medium">
                  · {totalUnread} mensaje{totalUnread !== 1 ? "s" : ""} sin leer
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-1.5"
            >
              <Download size={14} /> {isExporting ? "Exportando..." : "Exportar BD"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewOfflineModal(true)}
              className="flex items-center gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <UserPlus2 size={14} /> Nuevo paciente
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/app/expert/patients/import")}
              className="flex items-center gap-1.5"
            >
              <Upload size={14} /> Importar CSV
            </Button>
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              + Invitar paciente
            </Button>
            <Button
              variant="outline"
              onClick={() => { setInviteMode("whatsapp"); setShowInviteModal(true); }}
              className="flex items-center gap-1.5 border-green-400 text-green-700 hover:bg-green-50"
            >
              <MessageCircle size={14} className="text-green-600" /> WhatsApp
            </Button>
          </div>
        </div>

        {/* Explicación contextual */}
        {(!patients || patients.length === 0) && !isLoading && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-blue-800 mb-1">👥 Gestiona a tus pacientes desde aquí</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Invita a tus pacientes por email. Si ya tienen cuenta en Buddy One, se añadirán directamente. Si no, recibirán un email con un enlace para registrarse y conectar contigo automáticamente. Desde el perfil de cada paciente podrás chatear, asignar menús, ver su progreso y gestionar sus citas.
            </p>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2 flex-wrap">
            {(["all", "active", "invited", "paused", "discharged"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-orange-500 text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {s === "all" ? "Todos" : STATUS_LABELS[s]?.label ?? s}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de pacientes */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
              {search ? "No se encontraron pacientes" : "Aún no tienes pacientes"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {search
                ? "Prueba con otro término de búsqueda"
                : "Invita a tus primeros pacientes para empezar a gestionar sus planes nutricionales"
              }
            </p>
            {!search && (
              <Button
                onClick={() => setShowInviteModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Invitar primer paciente
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPatients.map(patient => {
              const statusInfo = STATUS_LABELS[patient.status] ?? { label: patient.status, color: "bg-muted/50 text-muted-foreground" };
              const hasUnread = (patient.unreadMessages ?? 0) > 0;
              const nextAppt = patient.nextAppointment ? new Date(patient.nextAppointment) : null;
              const deviation = adherenceData?.[patient.id];
              const hasDeviation = !!deviation && patient.status === "active";

              return (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/app/expert/patients/${patient.id}`)}
                  className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {patient.user?.imageUrl ? (
                      <img
                        src={patient.user.imageUrl}
                        alt={patient.user.name ?? "Paciente"}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground group-hover:text-orange-600 transition-colors">
                        {patient.user?.name ?? "Paciente sin nombre"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{patient.user?.email ?? "—"}</p>
                    {patient.profile && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {patient.profile.weight ? `${patient.profile.weight} kg` : ""}
                        {patient.profile.height ? ` · ${patient.profile.height} cm` : ""}
                        {patient.profile.age ? ` · ${patient.profile.age} años` : ""}
                      </p>
                    )}
                  </div>

                  {/* Badge de desvío */}
                  {hasDeviation && (
                    <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                        ⚠️ {deviation.daysWithoutLog >= 999 ? "Sin registros" : `${deviation.daysWithoutLog}d sin registrar`}
                      </span>
                    </div>
                  )}

                  {/* Próxima cita */}
                  {nextAppt && !hasDeviation && (
                    <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
                      <span className="text-xs text-muted-foreground/70">Próxima cita</span>
                      <span className="text-sm font-medium text-foreground/80">
                        {nextAppt.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {nextAppt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}

                  {/* Botones recordatorio para invitados */}
                  {patient.status === "invited" && (
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); sendReminderMutation.mutate({ patientRelId: patient.id }); }}
                        disabled={sendReminderMutation.isPending}
                        title="Enviar recordatorio por email"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-300 text-orange-600 text-xs font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
                      >
                        {sendReminderMutation.isPending ? <span className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" /> : "⏰"}
                        Email
                      </button>
                      {patient.user?.phone && (
                        <button
                          onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(patient.user.phone, patient.user?.name); }}
                          title="Enviar recordatorio por WhatsApp"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-400 text-green-700 text-xs font-semibold hover:bg-green-50 transition-colors"
                        >
                          <MessageCircle size={12} /> WA
                        </button>
                      )}
                    </div>
                  )}
                  {/* Flecha */}
                  <svg className="w-5 h-5 text-muted-foreground/70 group-hover:text-orange-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
            </div>

      {/* ── Pacientes offline (importados) ── */}
      <OfflinePatientsSection />

      {/* Modal nuevo paciente offline */}
      <Dialog open={showNewOfflineModal} onOpenChange={setShowNewOfflineModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo paciente (sin cuenta)</DialogTitle>
          </DialogHeader>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-2">
            <p className="text-xs text-orange-800">
              <strong>Modo profesional:</strong> Crea la ficha del paciente sin que necesite registrarse. Podrás gestionar sus datos, generar menús y enviarle planes por email o WhatsApp. Cuando quieras, puedes invitarle a crear su cuenta en BuddyOne.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nombre completo *</Label>
              <Input value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} placeholder="María García" className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} placeholder="paciente@email.com" className="mt-1" />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input type="tel" value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} placeholder="+34 600 000 000" className="mt-1" />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={newPatient.birthDate} onChange={e => setNewPatient(p => ({ ...p, birthDate: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Género</Label>
              <select value={newPatient.gender} onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Seleccionar...</option>
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <Label>Altura (cm)</Label>
              <Input type="number" value={newPatient.heightCm} onChange={e => setNewPatient(p => ({ ...p, heightCm: e.target.value }))} placeholder="170" className="mt-1" />
            </div>
            <div>
              <Label>Peso inicial (kg)</Label>
              <Input type="number" value={newPatient.initialWeightKg} onChange={e => setNewPatient(p => ({ ...p, initialWeightKg: e.target.value }))} placeholder="70" className="mt-1" />
            </div>
            <div>
              <Label>Peso objetivo (kg)</Label>
              <Input type="number" value={newPatient.targetWeightKg} onChange={e => setNewPatient(p => ({ ...p, targetWeightKg: e.target.value }))} placeholder="65" className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Objetivo principal</Label>
              <select value={newPatient.objective} onChange={e => setNewPatient(p => ({ ...p, objective: e.target.value }))} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Seleccionar...</option>
                <option value="lose_weight">Perder peso</option>
                <option value="gain_muscle">Ganar músculo</option>
                <option value="maintain">Mantener peso</option>
                <option value="improve_health">Mejorar salud</option>
                <option value="eat_healthier">Comer más sano</option>
              </select>
            </div>
            <div className="col-span-2">
              <Label>Alergias e intolerancias</Label>
              <Input value={newPatient.allergies} onChange={e => setNewPatient(p => ({ ...p, allergies: e.target.value }))} placeholder="Gluten, lactosa..." className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Notas internas (solo visibles para ti)</Label>
              <Textarea value={newPatient.notes} onChange={e => setNewPatient(p => ({ ...p, notes: e.target.value }))} placeholder="Observaciones, historial previo..." className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowNewOfflineModal(false)}>Cancelar</Button>
            <Button
              onClick={() => createOfflinePatient.mutate({
                name: newPatient.name,
                email: newPatient.email || undefined,
                phone: newPatient.phone || undefined,
                birthDate: newPatient.birthDate || undefined,
                gender: newPatient.gender || undefined,
                heightCm: newPatient.heightCm ? parseFloat(newPatient.heightCm) : undefined,
                initialWeightKg: newPatient.initialWeightKg ? parseFloat(newPatient.initialWeightKg) : undefined,
                targetWeightKg: newPatient.targetWeightKg ? parseFloat(newPatient.targetWeightKg) : undefined,
                objective: newPatient.objective || undefined,
                allergies: newPatient.allergies || undefined,
                notes: newPatient.notes || undefined,
              })}
              disabled={!newPatient.name || createOfflinePatient.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createOfflinePatient.isPending ? "Creando..." : "Crear paciente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal invitar paciente */}
      <Dialog open={showInviteModal} onOpenChange={(open) => { setShowInviteModal(open); if (!open) setInviteMode("email"); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar paciente</DialogTitle>
          </DialogHeader>

          {/* Selector de modo */}
          <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
            <button
              onClick={() => setInviteMode("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                inviteMode === "email" ? "bg-white shadow text-orange-600" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📧 Por Email
            </button>
            <button
              onClick={() => setInviteMode("whatsapp")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                inviteMode === "whatsapp" ? "bg-white shadow text-green-600" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageCircle size={15} /> Por WhatsApp
            </button>
          </div>

          <div className="space-y-4 py-2">
            {inviteMode === "email" ? (
              <>
                <div>
                  <Label htmlFor="invite-email">Email del paciente *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="paciente@email.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si el paciente ya tiene cuenta en Buddy One, se le añadirá directamente. Si no, recibirá un email de invitación.
                  </p>
                </div>
                <div>
                  <Label htmlFor="invite-notes">Notas iniciales (opcional)</Label>
                  <Textarea
                    id="invite-notes"
                    placeholder="Objetivo del paciente, observaciones iniciales..."
                    value={inviteNotes}
                    onChange={e => setInviteNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-800 font-medium">
                    💬 Se abrirá WhatsApp con un mensaje personalizado de invitación listo para enviar. Solo necesitas el número de teléfono del paciente.
                  </p>
                </div>
                <div>
                  <Label htmlFor="invite-phone">Nombre del paciente (opcional)</Label>
                  <Input
                    id="invite-name"
                    type="text"
                    placeholder="Ej: María García"
                    value={expertName}
                    onChange={e => setExpertName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="invite-phone">Teléfono del paciente *</Label>
                  <Input
                    id="invite-phone"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={invitePhone}
                    onChange={e => setInvitePhone(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluye el prefijo internacional (ej: +34 para España)
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancelar
            </Button>
            {inviteMode === "email" ? (
              <Button
                onClick={() => inviteMutation.mutate({ email: inviteEmail, notes: inviteNotes || undefined })}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {inviteMutation.isPending ? "Enviando..." : "Enviar invitación"}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (!invitePhone) { toast.error("Introduce el teléfono del paciente"); return; }
                  window.open(getWhatsAppInviteUrl(invitePhone, expertName || null), "_blank");
                  setShowInviteModal(false);
                  setInvitePhone("");
                  setExpertName("");
                }}
                disabled={!invitePhone}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <MessageCircle size={15} /> Abrir WhatsApp
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
