import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

const SPECIALTIES = [
  "Medicina general", "Cirugía", "Dermatología", "Cardiología",
  "Neurología", "Oncología", "Oftalmología", "Traumatología",
  "Nutrición clínica", "Medicina interna", "Urgencias 24h",
  "Exóticos", "Etología", "Rehabilitación", "Odontología veterinaria",
];

const ALERT_TYPES = [
  { value: "vaccine", label: "Vacuna" },
  { value: "checkup", label: "Revisión" },
  { value: "medication", label: "Medicación" },
  { value: "weight", label: "Control de peso" },
  { value: "diet", label: "Dieta" },
  { value: "deworming", label: "Desparasitación" },
  { value: "dental", label: "Dental" },
  { value: "surgery", label: "Cirugía" },
  { value: "other", label: "Otro" },
] as const;

function ClinicRegisterForm({ onCreated }: { onCreated: () => void }) {
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", website: "",
    description: "", city: "", province: "", licenseNumber: "",
  });
  const createMutation = trpc.vetClinic.createFull.useMutation({
    onSuccess: () => { toast.success("✅ Clínica registrada correctamente"); onCreated(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleSpecialty = (s: string) =>
    setSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🏥</div>
        <h1 className="text-2xl font-bold">Registra tu clínica veterinaria</h1>
        <p className="text-muted-foreground text-sm">
          Únete a la red de clínicas colaboradoras de BuddyMarket y conecta con los dueños de mascotas de tu zona.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Información de la clínica</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Nombre de la clínica *</label>
              <Input placeholder="Clínica Veterinaria..." value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ciudad</label>
              <Input placeholder="Madrid" value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Provincia</label>
              <Input placeholder="Madrid" value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Dirección</label>
              <Input placeholder="Calle, número, código postal..." value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Teléfono</label>
              <Input placeholder="+34 600 000 000" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input type="email" placeholder="clinica@ejemplo.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Web</label>
              <Input placeholder="https://..." value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Nº de colegiado / licencia</label>
              <Input placeholder="COL-XXXX" value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1 block">Descripción</label>
              <Textarea placeholder="Describe tu clínica, servicios, equipo..." rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Especialidades</label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    specialties.includes(s)
                      ? "bg-orange-500 text-white border-orange-500"
                      : "bg-transparent border-border text-muted-foreground hover:border-orange-400"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!form.name || createMutation.isPending}
            onClick={() => createMutation.mutate({
              ...form,
              email: form.email || undefined,
              website: form.website || undefined,
              specialtiesJson: specialties.length > 0 ? JSON.stringify(specialties) : undefined,
            })}>
            {createMutation.isPending ? "Registrando..." : "Registrar clínica"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function SendAlertDialog({ clinicId, pet }: { clinicId: number; pet: { id: number; name: string; ownerId: number } }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "checkup" as typeof ALERT_TYPES[number]["value"], title: "", description: "" });
  const utils = trpc.useUtils();
  const sendMutation = trpc.vetClinic.sendAlert.useMutation({
    onSuccess: () => { toast.success("✅ Alerta enviada"); utils.vetClinic.clinicAlerts.invalidate(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">🔔 Alerta</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Enviar alerta a {pet.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ALERT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Título de la alerta" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea placeholder="Descripción (opcional)" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={!form.title || sendMutation.isPending}
            onClick={() => sendMutation.mutate({ clinicId, petId: pet.id, ownerId: pet.ownerId, type: form.type, title: form.title, description: form.description || undefined })}>
            {sendMutation.isPending ? "Enviando..." : "Enviar alerta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddVisitDialog({ clinicId, pet }: { clinicId: number; pet: { id: number; name: string; ownerId: number } }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ visitDate: new Date().toISOString().split("T")[0], reason: "", diagnosis: "", treatment: "", vetName: "", weight: "" });
  const utils = trpc.useUtils();
  const addMutation = trpc.vetClinic.addVisit.useMutation({
    onSuccess: () => { toast.success("✅ Visita registrada"); utils.vetClinic.linkedPets.invalidate(); setOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-xs">📋 Visita</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Registrar visita — {pet.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium mb-1 block">Fecha</label>
              <Input type="date" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} /></div>
            <div><label className="text-xs font-medium mb-1 block">Peso (kg)</label>
              <Input type="number" step="0.1" placeholder="5.2" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
          </div>
          <Input placeholder="Veterinario responsable" value={form.vetName} onChange={(e) => setForm({ ...form, vetName: e.target.value })} />
          <Input placeholder="Motivo de la visita" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Textarea placeholder="Diagnóstico" rows={2} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
          <Textarea placeholder="Tratamiento prescrito" rows={2} value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} />
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={addMutation.isPending}
            onClick={() => addMutation.mutate({ clinicId, petId: pet.id, ownerId: pet.ownerId, visitDate: new Date(form.visitDate), reason: form.reason || undefined, diagnosis: form.diagnosis || undefined, treatment: form.treatment || undefined, vetName: form.vetName || undefined, weight: form.weight ? parseFloat(form.weight) : undefined })}>
            {addMutation.isPending ? "Guardando..." : "Guardar visita"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VetClinicDashboard() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"overview" | "patients" | "alerts" | "profile">("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSpecialties, setEditSpecialties] = useState<string[]>([]);

  const { data: clinic, isLoading, refetch } = trpc.vetClinic.myClinic.useQuery();
  const { data: linkedPets } = trpc.vetClinic.linkedPets.useQuery({ clinicId: clinic?.id ?? 0 }, { enabled: !!clinic?.id });
  const { data: alerts, refetch: refetchAlerts } = trpc.vetClinic.clinicAlerts.useQuery({ clinicId: clinic?.id ?? 0 }, { enabled: !!clinic?.id });

  const resolveAlert = trpc.vetClinic.resolveAlert.useMutation({
    onSuccess: () => { toast.success("✅ Alerta resuelta"); refetchAlerts(); },
  });
  const updateMutation = trpc.vetClinic.updateFull.useMutation({
    onSuccess: () => { toast.success("✅ Perfil actualizado"); refetch(); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2"><div className="text-4xl animate-pulse">🏥</div><p className="text-muted-foreground">Cargando...</p></div>
    </div>
  );

  if (!clinic) return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6"><Link href="/app/buddypet" className="text-sm text-muted-foreground hover:text-foreground">← Volver a BuddyPet</Link></div>
        <ClinicRegisterForm onCreated={() => refetch()} />
      </div>
    </div>
  );

  const pendingAlerts = alerts?.filter((a) => a.status === "pending") ?? [];
  const specialties: string[] = (() => { try { return clinic.specialtiesJson ? JSON.parse(clinic.specialtiesJson) : []; } catch { return []; } })();

  const openEdit = () => {
    setEditForm({ name: clinic.name ?? "", address: clinic.address ?? "", phone: clinic.phone ?? "", email: clinic.email ?? "", website: clinic.website ?? "", description: clinic.description ?? "", city: (clinic as any).city ?? "", province: (clinic as any).province ?? "", licenseNumber: (clinic as any).licenseNumber ?? "" });
    setEditSpecialties(specialties);
    setEditOpen(true);
  };

  const TABS = [
    { id: "overview" as const, label: "Resumen", icon: "📊" },
    { id: "patients" as const, label: `Pacientes (${linkedPets?.length ?? 0})`, icon: "🐾" },
    { id: "alerts" as const, label: `Alertas${pendingAlerts.length > 0 ? ` (${pendingAlerts.length})` : ""}`, icon: "🔔" },
    { id: "profile" as const, label: "Perfil", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">🏥</div>
              <div>
                <h1 className="text-lg font-bold">{clinic.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {(clinic as any).city && `${(clinic as any).city} · `}Código: <span className="font-mono font-semibold text-orange-500">{clinic.accessCode}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingAlerts.length > 0 && <Badge variant="destructive" className="text-xs">{pendingAlerts.length} alertas</Badge>}
              <Button size="sm" variant="outline" onClick={openEdit}>✏️ Editar</Button>
            </div>
          </div>
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${activeTab === tab.id ? "bg-orange-500 text-white font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                <span>{tab.icon}</span><span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Pacientes", value: linkedPets?.length ?? 0, icon: "🐾" },
                { label: "Alertas pendientes", value: pendingAlerts.length, icon: "🔔" },
                { label: "Alertas totales", value: alerts?.length ?? 0, icon: "📋" },
                { label: "Estado", value: clinic.active ? "Activa" : "Inactiva", icon: "✅" },
              ].map((stat) => (
                <Card key={stat.label}><CardContent className="pt-4 pb-3">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm font-medium">Código de acceso para clientes</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Comparte este código con los dueños para que se vinculen</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-bold text-orange-500">{clinic.accessCode}</span>
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(clinic.accessCode); toast("Código copiado"); }}>📋</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {specialties.length > 0 && (
              <Card><CardHeader><CardTitle className="text-sm">Especialidades</CardTitle></CardHeader>
                <CardContent><div className="flex flex-wrap gap-2">{specialties.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div></CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "patients" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pacientes vinculados</h2>
              <p className="text-sm text-muted-foreground">{linkedPets?.length ?? 0} mascotas</p>
            </div>
            {!linkedPets?.length ? (
              <Card><CardContent className="py-12 text-center">
                <div className="text-4xl mb-3">🐾</div>
                <p className="font-medium">Sin pacientes aún</p>
                <p className="text-sm text-muted-foreground mt-1">Comparte el código <span className="font-mono font-bold text-orange-500">{clinic.accessCode}</span></p>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {linkedPets.map((row: any) => (
                  <Card key={row.pet.id}><CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold">{row.pet.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{row.pet.species} · {row.pet.breed ?? "raza desconocida"}</p>
                        {row.pet.weightKg && <p className="text-xs text-muted-foreground">{row.pet.weightKg} kg</p>}
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{row.link.status}</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <SendAlertDialog clinicId={clinic.id} pet={{ id: row.pet.id, name: row.pet.name, ownerId: row.pet.userId }} />
                      <AddVisitDialog clinicId={clinic.id} pet={{ id: row.pet.id, name: row.pet.name, ownerId: row.pet.userId }} />
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Historial de alertas</h2>
            {!alerts?.length ? (
              <Card><CardContent className="py-12 text-center"><div className="text-4xl mb-3">🔔</div><p className="font-medium">Sin alertas enviadas</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert: any) => (
                  <Card key={alert.id}><CardContent className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <Badge variant={alert.status === "pending" ? "destructive" : "secondary"} className="text-xs capitalize">{alert.status}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{alert.type}</Badge>
                        </div>
                        {alert.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.description}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{new Date(alert.createdAt).toLocaleDateString("es-ES")}</p>
                      </div>
                      {alert.status === "pending" && (
                        <Button size="sm" variant="ghost" className="text-xs shrink-0" onClick={() => resolveAlert.mutate({ alertId: alert.id })}>✓ Resolver</Button>
                      )}
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-4 max-w-lg">
            <h2 className="text-lg font-semibold">Perfil de la clínica</h2>
            <Card><CardContent className="pt-4 space-y-3">
              {[
                { label: "Nombre", value: clinic.name },
                { label: "Ciudad", value: (clinic as any).city },
                { label: "Provincia", value: (clinic as any).province },
                { label: "Dirección", value: clinic.address },
                { label: "Teléfono", value: clinic.phone },
                { label: "Email", value: clinic.email },
                { label: "Web", value: clinic.website },
                { label: "Nº licencia", value: (clinic as any).licenseNumber },
                { label: "Descripción", value: clinic.description },
              ].filter((f) => f.value).map((field) => (
                <div key={field.label} className="flex gap-2">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">{field.label}</span>
                  <span className="text-sm break-all">{field.value}</span>
                </div>
              ))}
              {specialties.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground w-24 shrink-0">Especialidades</span>
                  <div className="flex flex-wrap gap-1">{specialties.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                </div>
              )}
            </CardContent></Card>
            <Button variant="outline" className="w-full" onClick={openEdit}>✏️ Editar perfil</Button>
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar perfil de la clínica</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[
              { key: "name", label: "Nombre *", placeholder: "Clínica Veterinaria..." },
              { key: "city", label: "Ciudad", placeholder: "Madrid" },
              { key: "province", label: "Provincia", placeholder: "Madrid" },
              { key: "address", label: "Dirección", placeholder: "Calle, número..." },
              { key: "phone", label: "Teléfono", placeholder: "+34 600 000 000" },
              { key: "email", label: "Email", placeholder: "clinica@ejemplo.com" },
              { key: "website", label: "Web", placeholder: "https://..." },
              { key: "licenseNumber", label: "Nº licencia", placeholder: "COL-XXXX" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium mb-1 block">{f.label}</label>
                <Input placeholder={f.placeholder} value={editForm[f.key] ?? ""} onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium mb-1 block">Descripción</label>
              <Textarea rows={3} value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block">Especialidades</label>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTIES.map((s) => (
                  <button key={s} type="button"
                    onClick={() => setEditSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${editSpecialties.includes(s) ? "bg-orange-500 text-white border-orange-500" : "bg-transparent border-border text-muted-foreground hover:border-orange-400"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!editForm.name || updateMutation.isPending}
              onClick={() => updateMutation.mutate({ clinicId: clinic.id, ...editForm, email: editForm.email || undefined, website: editForm.website || undefined, specialtiesJson: editSpecialties.length > 0 ? JSON.stringify(editSpecialties) : undefined } as any)}>
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
