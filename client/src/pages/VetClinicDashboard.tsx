import { useState, useMemo } from "react";
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
          Únete a la red de clínicas colaboradoras de Buddy One y conecta con los dueños de mascotas de tu zona.
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

function VetClinicDirectory({ onRegister }: { onRegister: () => void }) {
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const { data: clinics, isLoading } = trpc.vetClinic.list.useQuery(undefined);

  const filtered = useMemo(() => {
    if (!clinics) return [];
    const q = search.toLowerCase().trim();
    return clinics.filter((c) => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) ||
        (c.city ?? "").toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q);
      const specs: string[] = (() => { try { return c.specialtiesJson ? JSON.parse(c.specialtiesJson) : []; } catch { return []; } })();
      const matchSpec = !selectedSpecialty || specs.includes(selectedSpecialty);
      return matchSearch && matchSpec;
    });
  }, [clinics, search, selectedSpecialty]);

  const allSpecialties = useMemo(() => {
    if (!clinics) return [];
    const set = new Set<string>();
    clinics.forEach((c) => {
      try { const s = c.specialtiesJson ? JSON.parse(c.specialtiesJson) : []; s.forEach((x: string) => set.add(x)); } catch {}
    });
    return Array.from(set).sort();
  }, [clinics]);

  if (showRegister) return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setShowRegister(false)} className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1">
          ← Volver al directorio
        </button>
        <ClinicRegisterForm onCreated={() => { setShowRegister(false); onRegister(); }} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F3EF]">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-black text-foreground tracking-tight">Clínicas Veterinarias</h1>
            <p className="text-sm text-muted-foreground/70 font-medium">Encuentra y contacta con clínicas de tu zona</p>
          </div>
          <span className="bg-orange-50 text-orange-600 text-[13px] font-black px-3 py-1.5 rounded-full border border-orange-100">
            {filtered.length} clínicas
          </span>
        </div>
        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-muted/50 rounded-2xl text-[13px] text-foreground placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-300 transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground">✕</button>
          )}
        </div>
        {/* Specialty filters */}
        {allSpecialties.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedSpecialty(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-black transition-all ${
                !selectedSpecialty ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >Todas</button>
            {allSpecialties.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSpecialty(selectedSpecialty === s ? null : s)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-black transition-all ${
                  selectedSpecialty === s ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >{s}</button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-3" />
                <div className="h-3 bg-muted rounded w-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">{search || selectedSpecialty ? "🔍" : "🏥"}</div>
            <h3 className="text-lg font-black text-foreground">
              {search || selectedSpecialty ? "Sin resultados" : "Aún no hay clínicas registradas"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {search ? `No se encontraron clínicas para "${search}"` : "Sé la primera clínica en unirse a Buddy One"}
            </p>
          </div>
        ) : (
          filtered.map((clinic) => {
            const specs: string[] = (() => { try { return clinic.specialtiesJson ? JSON.parse(clinic.specialtiesJson) : []; } catch { return []; } })();
            return (
              <div key={clinic.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 text-2xl">
                    {clinic.logoUrl ? <img src={clinic.logoUrl} alt={clinic.name} className="w-full h-full object-cover rounded-xl" /> : "🏥"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-[15px] text-foreground">{clinic.name}</h3>
                      {clinic.featured && <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0">Destacada</Badge>}
                    </div>
                    {(clinic.city || clinic.province) && (
                      <p className="text-[13px] text-muted-foreground/70 font-medium mt-0.5">
                        📍 {[clinic.city, clinic.province].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {clinic.description && (
                  <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{clinic.description}</p>
                )}
                {specs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {specs.slice(0, 4).map((s) => (
                      <span key={s} className="bg-orange-50 text-orange-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-orange-100">{s}</span>
                    ))}
                    {specs.length > 4 && <span className="text-[11px] text-muted-foreground">+{specs.length - 4} más</span>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1 border-t border-border/50">
                  {clinic.phone && (
                    <a href={`tel:${clinic.phone}`} className="flex items-center gap-1.5 bg-green-50 text-green-700 text-[13px] font-semibold px-3 py-1.5 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                      📞 {clinic.phone}
                    </a>
                  )}
                  {clinic.email && (
                    <a href={`mailto:${clinic.email}`} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[13px] font-semibold px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                      ✉️ Email
                    </a>
                  )}
                  {clinic.website && (
                    <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-purple-50 text-purple-700 text-[13px] font-semibold px-3 py-1.5 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors">
                      🌐 Web
                    </a>
                  )}
                  {clinic.address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(clinic.address + " " + (clinic.city ?? ""))}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[13px] font-semibold px-3 py-1.5 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors">
                      🗺️ Cómo llegar
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* CTA para veterinarios */}
        <div className="mt-6 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 text-center space-y-3">
          <div className="text-3xl">🩺</div>
          <h3 className="font-black text-[15px] text-foreground">¿Eres veterinario o tienes una clínica?</h3>
          <p className="text-[13px] text-muted-foreground">Únete a la red de clínicas colaboradoras de Buddy One y conecta con los dueños de mascotas de tu zona.</p>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white font-black"
            onClick={() => setShowRegister(true)}
          >Registrar mi clínica</Button>
        </div>
      </div>
    </div>
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

  if (!clinic) return <VetClinicDirectory onRegister={() => refetch()} />;

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
