import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// ─── Species config ──────────────────────────────────────────────────────────
const SPECIES = [
  { value: "dog",        label: "Perro",    emoji: "🐕" },
  { value: "cat",        label: "Gato",     emoji: "🐈" },
  { value: "rabbit",     label: "Conejo",   emoji: "🐇" },
  { value: "bird",       label: "Pájaro",   emoji: "🦜" },
  { value: "hamster",    label: "Hámster",  emoji: "🐹" },
  { value: "guinea_pig", label: "Cobaya",   emoji: "🐾" },
  { value: "fish",       label: "Pez",      emoji: "🐠" },
  { value: "turtle",     label: "Tortuga",  emoji: "🐢" },
  { value: "ferret",     label: "Hurón",    emoji: "🦡" },
  { value: "other",      label: "Otro",     emoji: "🐾" },
] as const;

type Species = typeof SPECIES[number]["value"];

const ALERT_TYPE_LABELS: Record<string, string> = {
  vaccine: "💉 Vacuna",
  checkup: "🩺 Revisión",
  medication: "💊 Medicación",
  weight: "⚖️ Peso",
  diet: "🥗 Dieta",
  deworming: "🔬 Desparasitación",
  dental: "🦷 Dental",
  surgery: "🏥 Cirugía",
  other: "📋 Otro",
};

function getSpeciesEmoji(species: string) {
  return SPECIES.find((s) => s.value === species)?.emoji ?? "🐾";
}
function getSpeciesLabel(species: string) {
  return SPECIES.find((s) => s.value === species)?.label ?? species;
}

// ─── Pet Form ─────────────────────────────────────────────────────────────────
interface PetFormData {
  name: string;
  species: Species;
  breed: string;
  weightValue: string;
  weightUnit: "kg" | "lb";
  ageYears: string;
  ageMonths: string;
  gender: string;
  neutered: boolean;
  healthNotes: string;
  avatarEmoji: string;
}

const defaultForm: PetFormData = {
  name: "",
  species: "dog",
  breed: "",
  weightValue: "",
  weightUnit: "kg",
  ageYears: "",
  ageMonths: "",
  gender: "",
  neutered: false,
  healthNotes: "",
  avatarEmoji: "",
};

function PetFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<PetFormData>;
  onSave: (data: PetFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<PetFormData>({ ...defaultForm, ...initial });

  function set(key: keyof PetFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedSpecies = SPECIES.find((s) => s.value === form.species);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.name ? "Editar mascota" : "Añadir mascota"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Species selector */}
          <div className="grid grid-cols-5 gap-2">
            {SPECIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => set("species", s.value)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 text-xs transition-colors ${
                  form.species === s.value
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                    : "border-border hover:border-orange-300"
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="truncate w-full text-center">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Nombre *</Label>
              <Input
                placeholder={`Nombre del ${selectedSpecies?.label.toLowerCase() ?? "animal"}`}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Raza</Label>
              <Input
                placeholder="Ej: Labrador, Siamés..."
                value={form.breed}
                onChange={(e) => set("breed", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <Label>Peso *</Label>
              <Input
                type="number"
                min={0.1}
                step={0.1}
                placeholder="Ej: 5.2"
                value={form.weightValue}
                onChange={(e) => set("weightValue", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Unidad</Label>
              <Select value={form.weightUnit} onValueChange={(v) => set("weightUnit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lb">lb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Años</Label>
              <Input
                type="number"
                min={0}
                max={50}
                placeholder="0"
                value={form.ageYears}
                onChange={(e) => set("ageYears", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Meses</Label>
              <Input
                type="number"
                min={0}
                max={11}
                placeholder="0"
                value={form.ageMonths}
                onChange={(e) => set("ageMonths", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Sexo</Label>
              <Select value={form.gender || "_none"} onValueChange={(v) => set("gender", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">—</SelectItem>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="neutered"
              checked={form.neutered}
              onCheckedChange={(v) => set("neutered", v)}
            />
            <Label htmlFor="neutered">Castrado / Esterilizado</Label>
          </div>

          <div className="space-y-1">
            <Label>Notas de salud</Label>
            <Textarea
              placeholder="Alergias, enfermedades crónicas, medicación habitual..."
              value={form.healthNotes}
              onChange={(e) => set("healthNotes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => onSave(form)}
              disabled={loading || !form.name || !form.weightValue}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pet Menu View ─────────────────────────────────────────────────────────────
function PetMenuView({ petId, petName }: { petId: number; petName: string }) {
  const { data: menus, isLoading } = trpc.pets.menus.useQuery({ petId });
  const generateMenu = trpc.pets.generateMenu.useMutation({
    onSuccess: () => {
      toast.success("Menú generado correctamente");
      utils.pets.menus.invalidate({ petId });
    },
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();

  const [expandedMenu, setExpandedMenu] = useState<number | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Cargando menús...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground">Menús de {petName}</h3>
        <Button
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => generateMenu.mutate({ petId })}
          disabled={generateMenu.isPending}
        >
          {generateMenu.isPending ? "Generando con IA..." : "✨ Generar menú semanal"}
        </Button>
      </div>

      {!menus?.length && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <div className="text-3xl mb-2">🍽️</div>
          <p>No hay menús todavía. Genera el primero con IA.</p>
        </div>
      )}

      {menus?.map((m) => {
        const menuData = (() => {
          try { return JSON.parse(m.menuJson); } catch { return null; }
        })();
        const shoppingList = (() => {
          try { return JSON.parse(m.shoppingListJson ?? "[]"); } catch { return []; }
        })();
        const isExpanded = expandedMenu === m.id;

        return (
          <Card key={m.id} className="border border-orange-100 dark:border-orange-900">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedMenu(isExpanded ? null : m.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{m.weekLabel}</CardTitle>
                  {menuData && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {menuData.dailyCalories} kcal/día · {menuData.dailyGrams}g/día
                    </p>
                  )}
                </div>
                <span className="text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </CardHeader>
            {isExpanded && menuData && (
              <CardContent className="pt-0 space-y-4">
                {menuData.notes && (
                  <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">📋 Recomendaciones</p>
                    <p className="text-muted-foreground">{menuData.notes}</p>
                  </div>
                )}
                <Tabs defaultValue="menu">
                  <TabsList className="w-full">
                    <TabsTrigger value="menu" className="flex-1">Menú semanal</TabsTrigger>
                    <TabsTrigger value="shopping" className="flex-1">Lista de compra</TabsTrigger>
                  </TabsList>
                  <TabsContent value="menu" className="space-y-3 mt-3">
                    {menuData.days?.map((day: { day: string; meals: Array<{ time: string; food: string; grams: number }> }) => (
                      <div key={day.day} className="border rounded-lg p-3">
                        <p className="font-semibold text-sm mb-2">{day.day}</p>
                        <div className="space-y-1">
                          {day.meals?.map((meal, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-muted-foreground min-w-[70px]">{meal.time}</span>
                              <span className="flex-1">{meal.food}</span>
                              <span className="text-orange-600 font-medium">{meal.grams}g</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  <TabsContent value="shopping" className="mt-3">
                    <div className="space-y-2">
                      {shoppingList.map((item: { item: string; quantity: string; category: string }, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                          <div>
                            <span className="font-medium">{item.item}</span>
                            <span className="text-xs text-muted-foreground ml-2">{item.category}</span>
                          </div>
                          <span className="text-orange-600">{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Link to Clinic ────────────────────────────────────────────────────────────
function LinkClinicDialog({ petId, petName }: { petId: number; petName: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const utils = trpc.useUtils();
  const linkMutation = trpc.pets.linkToClinic.useMutation({
    onSuccess: (data) => {
      toast.success(`Mascota vinculada a ${data.clinicName}`);
      setOpen(false);
      setCode("");
      utils.pets.linkedClinics.invalidate({ petId });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        🏥 Vincular clínica
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Vincular {petName} a una clínica</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Introduce el código de 6-12 caracteres que te ha proporcionado tu clínica veterinaria.
            </p>
            <Input
              placeholder="Código de clínica (ej: VET123456)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={12}
            />
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => linkMutation.mutate({ petId, clinicCode: code })}
              disabled={code.length < 6 || linkMutation.isPending}
            >
              {linkMutation.isPending ? "Vinculando..." : "Vincular"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Pet Card ─────────────────────────────────────────────────────────────────
function PetCard({ pet, onEdit, onDelete }: {
  pet: {
    id: number; name: string; species: string; breed?: string | null;
    weightValue: number; weightUnit: string; ageYears?: number | null;
    ageMonths?: number | null; gender?: string | null; neutered: boolean;
    healthNotes?: string | null; avatarEmoji?: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<"info" | "menu" | "alerts">("info");
  const { data: alerts } = trpc.pets.alerts.useQuery();
  const petAlerts = alerts?.filter((a) => a.petId === pet.id && !a.resolvedAt) ?? [];

  const emoji = pet.avatarEmoji || getSpeciesEmoji(pet.species);
  const ageStr = [
    pet.ageYears ? `${pet.ageYears}a` : null,
    pet.ageMonths ? `${pet.ageMonths}m` : null,
  ].filter(Boolean).join(" ") || null;

  return (
    <Card className="overflow-hidden border-2 border-orange-100 dark:border-orange-900 hover:border-orange-300 transition-colors">
      <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{emoji}</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">{pet.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">{getSpeciesLabel(pet.species)}</Badge>
                {pet.breed && <Badge variant="outline" className="text-xs">{pet.breed}</Badge>}
                {pet.neutered && <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Castrado</Badge>}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            {petAlerts.length > 0 && (
              <Badge className="bg-red-500 text-white text-xs animate-pulse">
                {petAlerts.length} alerta{petAlerts.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground mt-2">
          <span>⚖️ {pet.weightValue}{pet.weightUnit}</span>
          {ageStr && <span>🎂 {ageStr}</span>}
          {pet.gender && <span>{pet.gender === "macho" ? "♂️" : "♀️"} {pet.gender}</span>}
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="flex gap-1 mb-3 border-b pb-2">
          {(["info", "menu", "alerts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
                tab === t
                  ? "bg-orange-500 text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "info" ? "ℹ️ Info" : t === "menu" ? "🍽️ Menú" : `🔔 Alertas${petAlerts.length > 0 ? ` (${petAlerts.length})` : ""}`}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-3">
            {pet.healthNotes && (
              <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-2 text-xs">
                <span className="font-medium">📋 Notas: </span>{pet.healthNotes}
              </div>
            )}
            <div className="flex gap-2">
              <LinkClinicDialog petId={pet.id} petName={pet.name} />
              <Button size="sm" variant="outline" onClick={onEdit}>✏️ Editar</Button>
              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={onDelete}>🗑️</Button>
            </div>
          </div>
        )}

        {tab === "menu" && <PetMenuView petId={pet.id} petName={pet.name} />}

        {tab === "alerts" && (
          <div className="space-y-2">
            {petAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin alertas pendientes ✅</p>
            ) : (
              petAlerts.map((alert) => (
                <div key={alert.id} className="border rounded-lg p-3 bg-red-50 dark:bg-red-950">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{ALERT_TYPE_LABELS[alert.type] ?? alert.type}</p>
                      <p className="font-semibold text-sm mt-0.5">{alert.title}</p>
                      {alert.description && <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>}
                      {alert.dueDate && (
                        <p className="text-xs text-orange-600 mt-1">
                          📅 {new Date(alert.dueDate).toLocaleDateString("es-ES")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BuddyPet() {
  const { data: pets, isLoading, refetch } = trpc.pets.list.useQuery();
  const utils = trpc.useUtils();

  const [addOpen, setAddOpen] = useState(false);
  const [editPet, setEditPet] = useState<typeof pets extends Array<infer T> ? T : never | null>(null);

  const createMutation = trpc.pets.create.useMutation({
    onSuccess: () => {
      toast.success("Mascota añadida");
      setAddOpen(false);
      utils.pets.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.pets.update.useMutation({
    onSuccess: () => {
      toast.success("Mascota actualizada");
      setEditPet(null);
      utils.pets.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.pets.delete.useMutation({
    onSuccess: () => {
      toast.success("Mascota eliminada");
      utils.pets.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSave(form: PetFormData) {
    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed || undefined,
      weightValue: parseFloat(form.weightValue),
      weightUnit: form.weightUnit,
      ageYears: form.ageYears ? parseInt(form.ageYears) : undefined,
      ageMonths: form.ageMonths ? parseInt(form.ageMonths) : undefined,
      gender: form.gender || undefined,
      neutered: form.neutered,
      healthNotes: form.healthNotes || undefined,
      avatarEmoji: form.avatarEmoji || undefined,
    };
    if (editPet) {
      updateMutation.mutate({ id: editPet.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🐾 BuddyPet
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Nutrición y cuidado personalizado para tus mascotas
          </p>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => setAddOpen(true)}
        >
          + Añadir mascota
        </Button>
      </div>

      {/* Empty state */}
      {!isLoading && !pets?.length && (
        <Card className="text-center py-16 border-dashed border-2 border-orange-200">
          <div className="text-6xl mb-4">🐕🐈🐇</div>
          <h2 className="text-xl font-semibold mb-2">Añade tu primera mascota</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Registra a tus mascotas para generar menús nutricionales personalizados con IA y recibir alertas de tu veterinario.
          </p>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setAddOpen(true)}
          >
            + Añadir mascota
          </Button>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      )}

      {/* Pet grid */}
      {!!pets?.length && (
        <div className="grid gap-4 md:grid-cols-2">
          {pets.map((pet) => (
            <PetCard
              key={pet.id}
              pet={pet}
              onEdit={() => setEditPet(pet as any)}
              onDelete={() => {
                if (confirm(`¿Eliminar a ${pet.name}?`)) {
                  deleteMutation.mutate({ id: pet.id });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <PetFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={handleSave}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editPet && (
        <PetFormDialog
          open={!!editPet}
          onOpenChange={(v) => { if (!v) setEditPet(null); }}
          initial={{
            name: editPet.name,
            species: editPet.species as Species,
            breed: editPet.breed ?? "",
            weightValue: String(editPet.weightValue),
            weightUnit: editPet.weightUnit as "kg" | "lb",
            ageYears: editPet.ageYears != null ? String(editPet.ageYears) : "",
            ageMonths: editPet.ageMonths != null ? String(editPet.ageMonths) : "",
            gender: editPet.gender ?? "",
            neutered: editPet.neutered,
            healthNotes: editPet.healthNotes ?? "",
            avatarEmoji: editPet.avatarEmoji ?? "",
          }}
          onSave={handleSave}
          loading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
