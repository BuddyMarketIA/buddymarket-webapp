// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  invited: { label: "Invitado", color: "bg-yellow-100 text-yellow-700" },
  active: { label: "Activo", color: "bg-green-100 text-green-700" },
  paused: { label: "Pausado", color: "bg-gray-100 text-gray-600" },
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

  const { data: patients, isLoading, refetch } = trpc.expertPatients.getPatients.useQuery(
    { status: statusFilter, search: search || undefined },
    { enabled: !!user, refetchInterval: 30000 }
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Mis Pacientes</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalActive} paciente{totalActive !== 1 ? "s" : ""} activo{totalActive !== 1 ? "s" : ""}
              {totalUnread > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-orange-600 font-medium">
                  · {totalUnread} mensaje{totalUnread !== 1 ? "s" : ""} sin leer
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            + Invitar paciente
          </Button>
        </div>

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
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {search ? "No se encontraron pacientes" : "Aún no tienes pacientes"}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
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
              const statusInfo = STATUS_LABELS[patient.status] ?? { label: patient.status, color: "bg-gray-100 text-gray-600" };
              const hasUnread = (patient.unreadMessages ?? 0) > 0;
              const nextAppt = patient.nextAppointment ? new Date(patient.nextAppointment) : null;

              return (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/app/expert/patients/${patient.id}`)}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
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
                      <span className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {patient.user?.name ?? "Paciente sin nombre"}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{patient.user?.email ?? "—"}</p>
                    {patient.profile && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {patient.profile.weight ? `${patient.profile.weight} kg` : ""}
                        {patient.profile.height ? ` · ${patient.profile.height} cm` : ""}
                        {patient.profile.age ? ` · ${patient.profile.age} años` : ""}
                      </p>
                    )}
                  </div>

                  {/* Próxima cita */}
                  {nextAppt && (
                    <div className="hidden sm:flex flex-col items-end text-right flex-shrink-0">
                      <span className="text-xs text-gray-400">Próxima cita</span>
                      <span className="text-sm font-medium text-gray-700">
                        {nextAppt.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {nextAppt.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}

                  {/* Flecha */}
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal invitar paciente */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
              <p className="text-xs text-gray-500 mt-1">
                Si el paciente ya tiene cuenta en BuddyMarket, se le añadirá directamente. Si no, recibirá un email de invitación.
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => inviteMutation.mutate({ email: inviteEmail, notes: inviteNotes || undefined })}
              disabled={!inviteEmail || inviteMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {inviteMutation.isPending ? "Enviando..." : "Enviar invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
