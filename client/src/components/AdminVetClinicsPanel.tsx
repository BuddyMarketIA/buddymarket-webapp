import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminVetClinicsPanel() {
  const [search, setSearch] = useState("");
  const { data: clinics, isLoading, refetch } = trpc.admin.getAllVetClinics.useQuery();

  const verifyMutation = trpc.admin.verifyVetClinic.useMutation({
    onSuccess: () => { toast.success("Estado de verificación actualizado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleActiveMutation = trpc.admin.toggleVetClinicActive.useMutation({
    onSuccess: () => { toast.success("Estado de activación actualizado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.admin.deleteVetClinic.useMutation({
    onSuccess: () => { toast.success("Clínica eliminada"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = (clinics ?? []).filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.city ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalClinics = clinics?.length ?? 0;
  const verifiedClinics = clinics?.filter((c) => c.isVerified).length ?? 0;
  const activeClinics = clinics?.filter((c) => c.isActive).length ?? 0;
  const totalPatients = clinics?.reduce((sum, c) => sum + (c.patientCount ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total clínicas", value: totalClinics, color: "text-blue-600" },
          { label: "Verificadas", value: verifiedClinics, color: "text-green-600" },
          { label: "Activas", value: activeClinics, color: "text-orange-600" },
          { label: "Pacientes totales", value: totalPatients, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="vively-card text-center p-3">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Buscar por nombre, ciudad o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-xs text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando clínicas...</p>
      ) : filtered.length === 0 ? (
        <div className="vively-card text-center py-12">
          <div className="text-4xl mb-3">🏥</div>
          <p className="font-medium">No hay clínicas registradas</p>
          <p className="text-sm text-muted-foreground mt-1">Las clínicas se registran desde la app</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((clinic) => {
            const specialties: string[] = (() => {
              try { return clinic.specialtiesJson ? JSON.parse(clinic.specialtiesJson) : []; }
              catch { return []; }
            })();
            return (
              <div key={clinic.id} className="vively-card space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm">{clinic.name}</p>
                      {clinic.isVerified ? (
                        <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">✅ Verificada</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">⏳ Sin verificar</Badge>
                      )}
                      {!clinic.isActive && (
                        <Badge variant="destructive" className="text-xs">Inactiva</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {(clinic.city || clinic.province) && (
                        <span>📍 {[clinic.city, clinic.province].filter(Boolean).join(", ")}</span>
                      )}
                      {clinic.phone && <span>📞 {clinic.phone}</span>}
                      {clinic.email && <span>✉️ {clinic.email}</span>}
                      <span>🐾 {clinic.patientCount} paciente{clinic.patientCount !== 1 ? "s" : ""}</span>
                      <span>📅 {new Date(clinic.createdAt).toLocaleDateString("es-ES")}</span>
                    </div>
                    {/* Access code */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Código de acceso:</span>
                      <code className="text-xs font-mono bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded">
                        {clinic.accessCode}
                      </code>
                    </div>
                    {specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {specialties.slice(0, 4).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                        {specialties.length > 4 && (
                          <Badge variant="secondary" className="text-xs">+{specialties.length - 4} más</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className={clinic.isVerified ? "text-yellow-600" : "text-green-600"}
                      onClick={() => verifyMutation.mutate({ clinicId: clinic.id, isVerified: !clinic.isVerified })}
                      disabled={verifyMutation.isPending}
                    >
                      {clinic.isVerified ? "Quitar verificación" : "✅ Verificar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={clinic.isActive ? "text-red-500" : "text-green-600"}
                      onClick={() => toggleActiveMutation.mutate({ clinicId: clinic.id, isActive: !clinic.isActive })}
                      disabled={toggleActiveMutation.isPending}
                    >
                      {clinic.isActive ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => {
                        if (confirm(`¿Eliminar la clínica "${clinic.name}"? Esta acción no se puede deshacer.`)) {
                          deleteMutation.mutate({ clinicId: clinic.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
