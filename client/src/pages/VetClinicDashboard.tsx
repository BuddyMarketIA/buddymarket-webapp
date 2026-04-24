import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// ─── Species helpers ──────────────────────────────────────────────────────────
const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐕", cat: "🐈", rabbit: "🐇", bird: "🦜",
  hamster: "🐹", guinea_pig: "🐾", fish: "🐠", turtle: "🐢",
  ferret: "🦡", other: "🐾",
};
const SPECIES_LABEL: Record<string, string> = {
  dog: "Perro", cat: "Gato", rabbit: "Conejo", bird: "Pájaro",
  hamster: "Hámster", guinea_pig: "Cobaya", fish: "Pez",
  turtle: "Tortuga", ferret: "Hurón", other: "Otro",
};

const ALERT_TYPES = [
  { value: "vaccine",     label: "💉 Vacuna" },
  { value: "checkup",     label: "🩺 Revisión" },
  { value: "medication",  label: "💊 Medicación" },
  { value: "weight",      label: "⚖️ Control de peso" },
  { value: "diet",        label: "🥗 Dieta" },
  { value: "deworming",   label: "🔬 Desparasitación" },
  { value: "dental",      label: "🦷 Dental" },
  { value: "surgery",     label: "🏥 Cirugía" },
  { value: "other",       label: "📋 Otro" },
] as const;

type AlertType = typeof ALERT_TYPES[number]["value"];

// ─── Clinic Setup Form ────────────────────────────────────────────────────────
function ClinicSetupForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", website: "", description: "",
  });
  const createMutation = trpc.vetClinic.create.useMutation({
    onSuccess: () => { toast.success("Clínica registrada"); onCreated(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          🏥 Registrar clínica veterinaria
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Crea el perfil de tu clínica para gestionar mascotas y enviar alertas a sus propietarios.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Nombre de la clínica *</Label>
          <Input placeholder="Clínica Veterinaria..." value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input placeholder="+34 600 000 000" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" placeholder="clinica@ejemplo.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Dirección</Label>
          <Input placeholder="Calle, ciudad..." value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Web</Label>
          <Input placeholder="https://..." value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Descripción</Label>
          <Textarea placeholder="Especialidades, horarios..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
        </div>
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => createMutation.mutate(form)}
          disabled={!form.name || createMutation.isPending}
        >
          {createMutation.isPending ? "Registrando..." : "Registrar clínica"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Send Alert Dialog ────────────────────────────────────────────────────────
function SendAlertDialog({
  clinicId,
  pet,
  onSent,
}: {
  clinicId: number;
  pet: { id: number; name: string; ownerId: number };
  onSent: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "checkup" as AlertType,
    title: "",
    description: "",
    dueDate: "",
  });

  const sendMutation = trpc.vetClinic.sendAlert.useMutation({
    onSuccess: () => {
      toast.success("Alerta enviada al propietario");
      setOpen(false);
      setForm({ type: "checkup", title: "", description: "", dueDate: "" });
      onSent();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setOpen(true)}>
        🔔 Enviar alerta
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar alerta para {pet.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Tipo de alerta</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as AlertType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Título *</Label>
              <Input
                placeholder="Ej: Vacuna anual pendiente"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Detalles adicionales para el propietario..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Fecha límite</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() =>
                sendMutation.mutate({
                  clinicId,
                  petId: pet.id,
                  ownerId: pet.ownerId,
                  type: form.type,
                  title: form.title,
                  description: form.description || undefined,
                  dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
                })
              }
              disabled={!form.title || sendMutation.isPending}
            >
              {sendMutation.isPending ? "Enviando..." : "Enviar alerta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Add Visit Dialog ─────────────────────────────────────────────────────────
function AddVisitDialog({
  clinicId,
  pet,
  onAdded,
}: {
  clinicId: number;
  pet: { id: number; name: string; ownerId: number };
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split("T")[0],
    reason: "",
    diagnosis: "",
    treatment: "",
    weight: "",
    nextVisitDate: "",
    vetName: "",
  });

  const addMutation = trpc.vetClinic.addVisit.useMutation({
    onSuccess: () => {
      toast.success("Visita registrada");
      setOpen(false);
      onAdded();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        📋 Registrar visita
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar visita de {pet.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha visita *</Label>
                <Input type="date" value={form.visitDate} onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Veterinario</Label>
                <Input placeholder="Nombre del vet." value={form.vetName} onChange={(e) => setForm((f) => ({ ...f, vetName: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Input placeholder="Revisión anual, vacuna..." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Diagnóstico</Label>
              <Textarea placeholder="Diagnóstico..." value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Tratamiento</Label>
              <Textarea placeholder="Medicación, recomendaciones..." value={form.treatment} onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Peso (kg)</Label>
                <Input type="number" step={0.1} placeholder="5.2" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Próxima visita</Label>
                <Input type="date" value={form.nextVisitDate} onChange={(e) => setForm((f) => ({ ...f, nextVisitDate: e.target.value }))} />
              </div>
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() =>
                addMutation.mutate({
                  clinicId,
                  petId: pet.id,
                  ownerId: pet.ownerId,
                  visitDate: new Date(form.visitDate),
                  reason: form.reason || undefined,
                  diagnosis: form.diagnosis || undefined,
                  treatment: form.treatment || undefined,
                  weight: form.weight ? parseFloat(form.weight) : undefined,
                  nextVisitDate: form.nextVisitDate ? new Date(form.nextVisitDate) : undefined,
                  vetName: form.vetName || undefined,
                })
              }
              disabled={!form.visitDate || addMutation.isPending}
            >
              {addMutation.isPending ? "Guardando..." : "Guardar visita"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function VetClinicDashboard() {
  const utils = trpc.useUtils();
  const { data: clinic, isLoading: loadingClinic, refetch: refetchClinic } = trpc.vetClinic.myClinic.useQuery();
  const { data: linkedPets, isLoading: loadingPets, refetch: refetchPets } = trpc.vetClinic.linkedPets.useQuery(
    { clinicId: clinic?.id ?? 0 },
    { enabled: !!clinic?.id }
  );
  const { data: clinicAlerts, refetch: refetchAlerts } = trpc.vetClinic.clinicAlerts.useQuery(
    { clinicId: clinic?.id ?? 0 },
    { enabled: !!clinic?.id }
  );

  const resolveAlert = trpc.vetClinic.resolveAlert.useMutation({
    onSuccess: () => { toast.success("Alerta resuelta"); refetchAlerts(); },
    onError: (e) => toast.error(e.message),
  });

  const [editClinicOpen, setEditClinicOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", address: "", phone: "", email: "", website: "", description: "" });
  const updateMutation = trpc.vetClinic.update.useMutation({
    onSuccess: () => { toast.success("Clínica actualizada"); setEditClinicOpen(false); refetchClinic(); },
    onError: (e) => toast.error(e.message),
  });

  if (loadingClinic) {
    return <div className="container py-12 text-center text-muted-foreground">Cargando...</div>;
  }

  if (!clinic) {
    return (
      <div className="container max-w-2xl py-6">
        <ClinicSetupForm onCreated={() => refetchClinic()} />
      </div>
    );
  }

  const pendingAlerts = clinicAlerts?.filter((a) => !a.resolvedAt) ?? [];
  const resolvedAlerts = clinicAlerts?.filter((a) => a.resolvedAt) ?? [];

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🏥 {clinic.name}
          </h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
            {clinic.phone && <span>📞 {clinic.phone}</span>}
            {clinic.email && <span>✉️ {clinic.email}</span>}
            {clinic.address && <span>📍 {clinic.address}</span>}
          </div>
        </div>
        <div className="flex gap-2 items-start flex-shrink-0">
          <div className="text-center bg-orange-50 dark:bg-orange-950 rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">Código clínica</p>
            <p className="font-mono font-bold text-orange-600 tracking-widest">{clinic.clinicCode}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditForm({
                name: clinic.name,
                address: clinic.address ?? "",
                phone: clinic.phone ?? "",
                email: clinic.email ?? "",
                website: clinic.website ?? "",
                description: clinic.description ?? "",
              });
              setEditClinicOpen(true);
            }}
          >
            ✏️ Editar
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{linkedPets?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Mascotas vinculadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-red-500">{pendingAlerts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Alertas pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-500">{resolvedAlerts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Alertas resueltas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">
              {new Set(linkedPets?.map((p) => p.ownerId)).size ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Propietarios</p>
          </CardContent>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="pets">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="pets">
            🐾 Mascotas ({linkedPets?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            🔔 Alertas
            {pendingAlerts.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs">{pendingAlerts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pets tab */}
        <TabsContent value="pets" className="mt-4">
          {loadingPets && <p className="text-sm text-muted-foreground">Cargando mascotas...</p>}
          {!loadingPets && !linkedPets?.length && (
            <Card className="text-center py-12 border-dashed border-2">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-muted-foreground text-sm">
                Ninguna mascota vinculada todavía.<br />
                Comparte el código <strong className="text-orange-600">{clinic.clinicCode}</strong> con tus clientes.
              </p>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {linkedPets?.map((link) => {
              const pet = link.pet;
              const owner = link.owner;
              const ageStr = [
                pet.ageYears ? `${pet.ageYears}a` : null,
                pet.ageMonths ? `${pet.ageMonths}m` : null,
              ].filter(Boolean).join(" ") || null;

              return (
                <Card key={link.id} className="border border-orange-100 dark:border-orange-900">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{SPECIES_EMOJI[pet.species] ?? "🐾"}</span>
                        <div>
                          <h3 className="font-bold">{pet.name}</h3>
                          <div className="flex gap-1 flex-wrap mt-0.5">
                            <Badge variant="secondary" className="text-xs">{SPECIES_LABEL[pet.species] ?? pet.species}</Badge>
                            {pet.breed && <Badge variant="outline" className="text-xs">{pet.breed}</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      {pet.weightValue && <span>⚖️ {pet.weightValue}{pet.weightUnit}</span>}
                      {ageStr && <span>🎂 {ageStr}</span>}
                      {pet.neutered && <span>✂️ Castrado</span>}
                    </div>
                    {pet.healthNotes && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 rounded p-2 text-xs mt-2">
                        📋 {pet.healthNotes}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 border-t pt-2">
                      <span>👤 Propietario:</span>
                      <span className="font-medium">{owner?.name ?? "Desconocido"}</span>
                      {owner?.email && <span className="text-orange-600">{owner.email}</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <SendAlertDialog
                        clinicId={clinic.id}
                        pet={{ id: pet.id, name: pet.name, ownerId: owner?.id ?? 0 }}
                        onSent={refetchAlerts}
                      />
                      <AddVisitDialog
                        clinicId={clinic.id}
                        pet={{ id: pet.id, name: pet.name, ownerId: owner?.id ?? 0 }}
                        onAdded={refetchPets}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Alerts tab */}
        <TabsContent value="alerts" className="mt-4 space-y-4">
          {pendingAlerts.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 text-red-600">🔴 Pendientes ({pendingAlerts.length})</h3>
              <div className="space-y-2">
                {pendingAlerts.map((alert) => (
                  <Card key={alert.id} className="border-red-200 dark:border-red-900">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {ALERT_TYPES.find((t) => t.value === alert.type)?.label ?? alert.type}
                            </Badge>
                            <span className="font-semibold text-sm">{alert.title}</span>
                          </div>
                          {alert.description && (
                            <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                          )}
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <span>🐾 {alert.pet?.name}</span>
                            {alert.dueDate && (
                              <span className="text-orange-600">
                                📅 {new Date(alert.dueDate).toLocaleDateString("es-ES")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 flex-shrink-0"
                          onClick={() => resolveAlert.mutate({ alertId: alert.id })}
                          disabled={resolveAlert.isPending}
                        >
                          ✅ Resolver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {resolvedAlerts.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2 text-green-600">✅ Resueltas ({resolvedAlerts.length})</h3>
              <div className="space-y-2">
                {resolvedAlerts.slice(0, 10).map((alert) => (
                  <Card key={alert.id} className="opacity-60">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {ALERT_TYPES.find((t) => t.value === alert.type)?.label ?? alert.type}
                        </Badge>
                        <span className="text-sm line-through text-muted-foreground">{alert.title}</span>
                        <span className="text-xs text-muted-foreground">— {alert.pet?.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!pendingAlerts.length && !resolvedAlerts.length && (
            <Card className="text-center py-12 border-dashed border-2">
              <div className="text-4xl mb-3">🔔</div>
              <p className="text-muted-foreground text-sm">No hay alertas todavía.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit clinic dialog */}
      <Dialog open={editClinicOpen} onOpenChange={setEditClinicOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar clínica</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Dirección</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Web</Label>
              <Input value={editForm.website} onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => updateMutation.mutate({ clinicId: clinic.id, ...editForm })}
              disabled={!editForm.name || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
