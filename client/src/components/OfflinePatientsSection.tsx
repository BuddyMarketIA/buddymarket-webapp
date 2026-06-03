// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, UserPlus, Search, ChevronRight, Mail } from "lucide-react";
import { toast } from "@/components/sonner-a11y-shim";

const getInitials = (name?: string | null) =>
  name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

export default function OfflinePatientsSection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const { data: offlinePatients, isLoading, refetch } = trpc.offlinePatients.list.useQuery(
    { search: search || undefined },
    { enabled: !!user, staleTime: 30000 }
  );

  const sendInvite = trpc.offlinePatients.sendInvite.useMutation({
    onSuccess: () => { toast.success("Invitación enviada ✅"); refetch(); },
    onError: (e) => toast.error(e.message || "Error al enviar la invitación"),
  });

  if (!offlinePatients?.length && !isLoading && !search) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="text-orange-500">📋</span> Pacientes sin cuenta Buddy
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pacientes importados o añadidos manualmente. Puedes enviarles su plan por email o WhatsApp sin que necesiten registrarse.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/app/expert/patients/import")}
          className="flex items-center gap-1.5 flex-shrink-0"
        >
          <Upload size={13} /> Importar más
        </Button>
      </div>

      {/* Search */}
      {(offlinePatients?.length ?? 0) > 4 && (
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente offline..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 max-w-xs"
          />
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !offlinePatients?.length ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No se encontraron pacientes
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {offlinePatients.map((patient: any) => (
            <div
              key={patient.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer group"
              onClick={() => navigate(`/app/expert/offline-patients/${patient.id}`)}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {getInitials(patient.fullName)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{patient.name}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {patient.email && (
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">{patient.email}</span>
                  )}
                  {patient.lastWeight && (
                    <Badge variant="outline" className="text-xs py-0 h-4">
                      {patient.lastWeight} kg
                    </Badge>
                  )}
                  {patient.objective && (
                    <Badge variant="secondary" className="text-xs py-0 h-4 capitalize">
                      {patient.objective}
                    </Badge>
                  )}
                  {patient.inviteSentAt && (
                    <Badge className="text-xs py-0 h-4 bg-green-100 text-green-700 border-0">
                      Invitación enviada
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                {/* Enviar plan — navega a la ficha del paciente donde se puede generar y enviar */}
                <button
                  title="Ver ficha y enviar plan"
                  onClick={(e) => { e.stopPropagation(); navigate(`/app/expert/offline-patients/${patient.id}`); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold transition-colors"
                >
                  <Mail size={11} /> Plan
                </button>
                {/* Invitar a Buddy */}
                {!patient.inviteSentAt && patient.email && (
                  <button
                    title="Invitar a registrarse en Buddy One"
                    onClick={() => sendInvite.mutate({ patientId: patient.id })}
                    disabled={sendInvite.isPending}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-orange-300 text-orange-600 text-xs font-semibold hover:bg-orange-50 transition-colors disabled:opacity-50"
                  >
                    <UserPlus size={11} /> Invitar
                  </button>
                )}
              </div>

              <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-orange-500 transition-colors flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
