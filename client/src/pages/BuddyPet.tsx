import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePlan } from "@/hooks/usePlan";
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

const DIET_TYPES = [
  { value: "standard",      label: "Estándar (pienso)", emoji: "🥘" },
  { value: "barf",          label: "BARF (carne cruda)", emoji: "🥩" },
  { value: "homecooked",    label: "Comida casera", emoji: "🍲" },
  { value: "mixed",         label: "Mixta (pienso + natural)", emoji: "🍱" },
  { value: "prescription",  label: "Dieta veterinaria", emoji: "💊" },
  { value: "vegetarian",    label: "Vegetariana", emoji: "🥗" },
  { value: "senior",        label: "Senior", emoji: "👴" },
  { value: "puppy_kitten",  label: "Cachorro/Gatito", emoji: "🐣" },
  { value: "weight_loss",   label: "Pérdida de peso", emoji: "⚖️" },
  { value: "weight_gain",   label: "Ganancia de peso", emoji: "💪" },
  { value: "hypoallergenic",label: "Hipoalergénica", emoji: "🌿" },
  { value: "renal",         label: "Renal", emoji: "🫀" },
  { value: "diabetic",      label: "Diabética", emoji: "🩺" },
];

const BODY_CONDITIONS = [
  { value: "very_thin",  label: "Muy delgado", color: "#ef4444", score: "1-2/9" },
  { value: "thin",       label: "Delgado",     color: "#f97316", score: "3/9" },
  { value: "ideal",      label: "Peso ideal",  color: "#22c55e", score: "4-5/9" },
  { value: "overweight", label: "Sobrepeso",   color: "#eab308", score: "6-7/9" },
  { value: "obese",      label: "Obeso",       color: "#dc2626", score: "8-9/9" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentario" },
  { value: "low",       label: "Baja actividad" },
  { value: "moderate",  label: "Actividad moderada" },
  { value: "high",      label: "Alta actividad" },
  { value: "very_high", label: "Muy activo (deporte/trabajo)" },
];

const ALERT_TYPE_LABELS: Record<string, string> = {
  vaccine: "💉 Vacuna", checkup: "🩺 Revisión", medication: "💊 Medicación",
  weight: "⚖️ Peso", diet: "🍽️ Dieta", deworming: "🪱 Desparasitación",
  dental: "🦷 Dental", surgery: "🔪 Cirugía", other: "📋 Otro",
};

function getSpeciesEmoji(species: string) {
  return SPECIES.find((s) => s.value === species)?.emoji ?? "🐾";
}
function getSpeciesLabel(species: string) {
  return SPECIES.find((s) => s.value === species)?.label ?? species;
}
function getBodyConditionColor(bc: string) {
  return BODY_CONDITIONS.find((b) => b.value === bc)?.color ?? "#6b7280";
}
function getBodyConditionLabel(bc: string) {
  return BODY_CONDITIONS.find((b) => b.value === bc)?.label ?? bc;
}

// ─── Pet Form Dialog ──────────────────────────────────────────────────────────
type PetFormData = {
  name: string; species: Species; breed: string; weightValue: string;
  weightUnit: "kg" | "lb"; ageYears: string; ageMonths: string;
  gender: string; neutered: boolean; healthNotes: string; avatarEmoji: string;
};
const defaultForm: PetFormData = {
  name: "", species: "dog", breed: "", weightValue: "", weightUnit: "kg",
  ageYears: "", ageMonths: "", gender: "", neutered: false, healthNotes: "", avatarEmoji: "",
};

function PetFormDialog({
  trigger, initial, onSave, title,
}: {
  trigger: React.ReactNode;
  initial?: Partial<PetFormData>;
  onSave: (data: PetFormData) => void;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PetFormData>({ ...defaultForm, ...initial });
  function set(key: keyof PetFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  const selectedSpecies = SPECIES.find((s) => s.value === form.species);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nombre de tu mascota" />
            </div>
            <div>
              <Label>Especie *</Label>
              <Select value={form.species} onValueChange={(v) => set("species", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.emoji} {s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Raza</Label>
              <Input value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="Raza (opcional)" />
            </div>
            <div>
              <Label>Peso *</Label>
              <div className="flex gap-2">
                <Input type="number" value={form.weightValue} onChange={(e) => set("weightValue", e.target.value)} placeholder="0.0" className="flex-1" />
                <Select value={form.weightUnit} onValueChange={(v) => set("weightUnit", v as "kg" | "lb")}>
                  <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Sexo</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="macho">♂️ Macho</SelectItem>
                  <SelectItem value="hembra">♀️ Hembra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Edad (años)</Label>
              <Input type="number" value={form.ageYears} onChange={(e) => set("ageYears", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Edad (meses)</Label>
              <Input type="number" value={form.ageMonths} onChange={(e) => set("ageMonths", e.target.value)} placeholder="0" min="0" max="11" />
            </div>
            <div className="col-span-2 flex items-center gap-3">
              <Switch checked={form.neutered} onCheckedChange={(v) => set("neutered", v)} />
              <Label>Castrado/Esterilizado</Label>
            </div>
            <div className="col-span-2">
              <Label>Emoji avatar</Label>
              <Input value={form.avatarEmoji} onChange={(e) => set("avatarEmoji", e.target.value)} placeholder={selectedSpecies?.emoji ?? "🐾"} maxLength={4} />
            </div>
            <div className="col-span-2">
              <Label>Notas de salud</Label>
              <Textarea value={form.healthNotes} onChange={(e) => set("healthNotes", e.target.value)} placeholder="Alergias, condiciones especiales, notas del veterinario..." rows={3} />
            </div>
          </div>
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { onSave(form); setOpen(false); }}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Custom Menu Generator ────────────────────────────────────────────────────
function CustomMenuGenerator({ petId, petName, onSuccess }: { petId: number; petName: string; onSuccess: () => void }) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [dietType, setDietType] = useState("standard");
  const [bodyCondition, setBodyCondition] = useState("ideal");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [mealsPerDay, setMealsPerDay] = useState("2");
  const [targetWeight, setTargetWeight] = useState("");
  const [foodsToAvoid, setFoodsToAvoid] = useState("");
  const [favoriteFoods, setFavoriteFoods] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [extraInstructions, setExtraInstructions] = useState("");

  const generateMenu = trpc.pets.generateCustomMenu.useMutation({
    onSuccess: () => {
      toast.success("Menú personalizado generado");
      utils.pets.menus.invalidate({ petId });
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleGenerate() {
    generateMenu.mutate({
      petId,
      dietType,
      bodyCondition,
      activityLevel,
      mealsPerDay: parseInt(mealsPerDay),
      targetWeightKg: targetWeight ? parseFloat(targetWeight) : undefined,
      foodsToAvoid: foodsToAvoid ? foodsToAvoid.split(",").map((s) => s.trim()).filter(Boolean) : [],
      favoriteFoods: favoriteFoods ? favoriteFoods.split(",").map((s) => s.trim()).filter(Boolean) : [],
      medicalConditions: medicalConditions ? medicalConditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
      extraInstructions: extraInstructions || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
          ✨ Generar menú personalizado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🍽️ Menú personalizado para {petName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">Cuantos más datos proporciones, más preciso será el menú. Todos los campos son opcionales.</p>

          <div>
            <Label>Tipo de dieta</Label>
            <Select value={dietType} onValueChange={setDietType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIET_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.emoji} {d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Condición corporal actual</Label>
            <Select value={bodyCondition} onValueChange={setBodyCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BODY_CONDITIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    <span style={{ color: b.color }}>●</span> {b.label} ({b.score})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nivel de actividad</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Comidas por día</Label>
              <Select value={mealsPerDay} onValueChange={setMealsPerDay}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4].map((n) => <SelectItem key={n} value={String(n)}>{n} comida{n > 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Peso objetivo (kg)</Label>
              <Input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div>
            <Label>Alimentos a evitar (separados por comas)</Label>
            <Input value={foodsToAvoid} onChange={(e) => setFoodsToAvoid(e.target.value)} placeholder="pollo, trigo, lactosa..." />
          </div>

          <div>
            <Label>Alimentos favoritos (separados por comas)</Label>
            <Input value={favoriteFoods} onChange={(e) => setFavoriteFoods(e.target.value)} placeholder="ternera, arroz, zanahoria..." />
          </div>

          <div>
            <Label>Condiciones médicas (separadas por comas)</Label>
            <Input value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} placeholder="diabetes, insuficiencia renal..." />
          </div>

          <div>
            <Label>Instrucciones adicionales</Label>
            <Textarea value={extraInstructions} onChange={(e) => setExtraInstructions(e.target.value)} placeholder="Cualquier indicación especial del veterinario..." rows={2} />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
            ⚠️ Este menú es orientativo y no sustituye la consulta con un veterinario nutricionista.
          </div>

          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleGenerate}
            disabled={generateMenu.isPending}
          >
            {generateMenu.isPending ? "Generando menú con IA..." : "✨ Generar menú"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Menu Meal Editor ─────────────────────────────────────────────────────────
function MealEditor({ menuId, dayIndex, mealIndex, currentFood, currentGrams, onSave }: {
  menuId: number; dayIndex: number; mealIndex: number;
  currentFood: string; currentGrams: number; onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [food, setFood] = useState(currentFood);
  const [grams, setGrams] = useState(String(currentGrams));
  const utils = trpc.useUtils();

  const editMeal = trpc.pets.editMenuMeal.useMutation({
    onSuccess: () => {
      toast.success("Comida actualizada");
      utils.pets.menus.invalidate();
      setOpen(false);
      onSave();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-orange-500 hover:text-orange-700 underline ml-1">✏️</button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar comida</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label>Descripción de la comida</Label>
            <Textarea value={food} onChange={(e) => setFood(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Gramos</Label>
            <Input type="number" value={grams} onChange={(e) => setGrams(e.target.value)} />
          </div>
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => editMeal.mutate({ menuId, dayIndex, mealIndex, newFood: food, newGrams: parseFloat(grams) })}
            disabled={editMeal.isPending}
          >
            Guardar cambio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pet Menu View ────────────────────────────────────────────────────────────
function PetMenuView({ petId, petName }: { petId: number; petName: string }) {
  const utils = trpc.useUtils();
  const { data: menus, isLoading } = trpc.pets.menus.useQuery({ petId });
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground py-4 text-center">Cargando menús...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-sm text-muted-foreground">Menús de {petName}</h3>
        <CustomMenuGenerator petId={petId} petName={petName} onSuccess={() => utils.pets.menus.invalidate({ petId })} />
      </div>

      {!menus?.length && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <div className="text-3xl mb-2">🍽️</div>
          <p>No hay menús todavía. Genera el primero con IA personalizada.</p>
        </div>
      )}

      {menus?.map((m) => {
        const menuData = (() => { try { return JSON.parse(m.menuJson); } catch { return null; } })();
        const shoppingList = (() => { try { return JSON.parse(m.shoppingListJson ?? "[]"); } catch { return []; } })();
        const supplements = menuData?.supplements ?? [];
        const isExpanded = expandedMenu === m.id;
        const dietInfo = DIET_TYPES.find((d) => d.value === menuData?.dietType);

        return (
          <Card key={m.id} className="border border-orange-100 dark:border-orange-900">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedMenu(isExpanded ? null : m.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{m.weekLabel}</CardTitle>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {menuData?.dailyCalories && (
                      <span className="text-xs text-muted-foreground">{menuData.dailyCalories} kcal/día · {menuData.dailyGrams}g/día</span>
                    )}
                    {dietInfo && (
                      <Badge variant="outline" className="text-xs">{dietInfo.emoji} {dietInfo.label}</Badge>
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
              </div>
            </CardHeader>
            {isExpanded && menuData && (
              <CardContent className="pt-0 space-y-4">
                {menuData.bodyConditionNote && (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm">
                    <p className="font-medium mb-1">🎯 Objetivo</p>
                    <p className="text-muted-foreground">{menuData.bodyConditionNote}</p>
                  </div>
                )}
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
                    {supplements.length > 0 && (
                      <TabsTrigger value="supplements" className="flex-1">Suplementos</TabsTrigger>
                    )}
                  </TabsList>
                  <TabsContent value="menu" className="space-y-3 mt-3">
                    {menuData.days?.map((day: { day: string; meals: Array<{ time: string; food: string; grams: number; calories?: number }> }, dayIdx: number) => (
                      <div key={day.day} className="border rounded-lg p-3">
                        <p className="font-semibold text-sm mb-2">{day.day}</p>
                        <div className="space-y-2">
                          {day.meals?.map((meal, mealIdx: number) => (
                            <div key={mealIdx} className="flex items-start gap-2 text-sm">
                              <span className="text-muted-foreground min-w-[70px] text-xs">{meal.time}</span>
                              <span className="flex-1 text-xs">{meal.food}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-orange-600 font-medium text-xs">{meal.grams}g</span>
                                {meal.calories && <span className="text-muted-foreground text-xs">({meal.calories}kcal)</span>}
                                <MealEditor
                                  menuId={m.id}
                                  dayIndex={dayIdx}
                                  mealIndex={mealIdx}
                                  currentFood={meal.food}
                                  currentGrams={meal.grams}
                                  onSave={() => utils.pets.menus.invalidate({ petId })}
                                />
                              </div>
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
                  {supplements.length > 0 && (
                    <TabsContent value="supplements" className="mt-3">
                      <div className="space-y-2">
                        {supplements.map((s: { name: string; reason: string; dose: string }, i: number) => (
                          <div key={i} className="border rounded-lg p-3 text-sm">
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.reason}</p>
                            <p className="text-xs text-orange-600 mt-1">Dosis: {s.dose}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ─── Photo Analyzer ───────────────────────────────────────────────────────────
function PhotoAnalyzer({ petId, petName, currentPhotoUrl }: { petId: number; petName: string; currentPhotoUrl?: string | null }) {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = trpc.pets.uploadPhoto.useMutation({
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });
  const analyzePhoto = trpc.pets.analyzePhoto.useMutation({
    onSuccess: (data) => {
      setAnalysis(data.analysis as Record<string, unknown>);
      toast.success("Análisis completado");
      utils.pets.getNutritionProfile.invalidate({ petId });
      setUploading(false);
    },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      // Upload first, then analyze
      const uploadResult = await uploadPhoto.mutateAsync({ petId, imageBase64: base64, mimeType: file.type });
      await analyzePhoto.mutateAsync({ petId, photoUrl: uploadResult.url });
    };
    reader.readAsDataURL(file);
  }

  const bc = analysis?.bodyCondition as string | undefined;
  const bcColor = bc ? getBodyConditionColor(bc) : "#6b7280";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Foto y análisis IA</h3>
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Analizando..." : "📷 Subir foto"}
        </Button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {preview && (
        <div className="relative rounded-xl overflow-hidden border-2 border-orange-200">
          <img src={preview} alt={petName} className="w-full h-48 object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
              🔍 Analizando con IA...
            </div>
          )}
        </div>
      )}

      {!preview && (
        <div
          className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-4xl mb-2">📷</div>
          <p className="text-sm text-muted-foreground">Haz una foto a tu mascota y la IA analizará su condición corporal, estado del pelaje y más</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: bcColor + "40", background: bcColor + "10" }}>
            <div className="text-2xl">⚖️</div>
            <div>
              <p className="font-semibold text-sm" style={{ color: bcColor }}>
                {getBodyConditionLabel(bc ?? "")} — {analysis.bodyConditionScore as number}/9
              </p>
              <p className="text-xs text-muted-foreground">{analysis.bodyConditionNote as string}</p>
            </div>
          </div>

          {analysis.coatCondition && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">🐾 Estado del pelaje</p>
              <p className="text-muted-foreground">{analysis.coatCondition as string}</p>
            </div>
          )}

          {analysis.estimatedBreed && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">🔍 Raza estimada</p>
              <p className="text-muted-foreground">{analysis.estimatedBreed as string}</p>
            </div>
          )}

          {(analysis.healthObservations as string[])?.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">🩺 Observaciones de salud</p>
              <ul className="space-y-1">
                {(analysis.healthObservations as string[]).map((obs, i) => (
                  <li key={i} className="text-muted-foreground text-xs">• {obs}</li>
                ))}
              </ul>
            </div>
          )}

          {(analysis.urgentConcerns as string[])?.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 text-sm border border-red-200">
              <p className="font-medium mb-2 text-red-600">⚠️ Preocupaciones urgentes</p>
              <ul className="space-y-1">
                {(analysis.urgentConcerns as string[]).map((c, i) => (
                  <li key={i} className="text-red-600 text-xs">• {c}</li>
                ))}
              </ul>
            </div>
          )}

          {(analysis.nutritionalRecommendations as string[])?.length > 0 && (
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-sm">
              <p className="font-medium mb-2">🥗 Recomendaciones nutricionales</p>
              <ul className="space-y-1">
                {(analysis.nutritionalRecommendations as string[]).map((r, i) => (
                  <li key={i} className="text-muted-foreground text-xs">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Puntuación general: {analysis.overallScore as number}/10 — {analysis.summary as string}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Weight History ───────────────────────────────────────────────────────────
function WeightHistoryView({ petId, petName, currentWeight, weightUnit }: {
  petId: number; petName: string; currentWeight: number; weightUnit: string;
}) {
  const utils = trpc.useUtils();
  const { data: history } = trpc.pets.weightHistory.useQuery({ petId });
  const [newWeight, setNewWeight] = useState("");
  const [newBodyCond, setNewBodyCond] = useState("ideal");
  const [notes, setNotes] = useState("");

  const addRecord = trpc.pets.addWeightRecord.useMutation({
    onSuccess: () => {
      toast.success("Peso registrado");
      utils.pets.weightHistory.invalidate({ petId });
      utils.pets.list.invalidate();
      setNewWeight("");
      setNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const chartData = history?.map((r) => ({
    date: new Date(r.recordedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    peso: r.weightValue,
    condicion: r.bodyCondition,
  })) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Historial de peso</h3>
        <span className="text-sm font-bold text-orange-600">{currentWeight} {weightUnit}</span>
      </div>

      {chartData.length > 1 && (
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => [`${v} ${weightUnit}`, "Peso"]} />
              <Line type="monotone" dataKey="peso" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="border rounded-lg p-3 space-y-3">
        <p className="text-sm font-medium">Registrar nuevo peso</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Peso ({weightUnit})</Label>
            <Input type="number" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder={String(currentWeight)} />
          </div>
          <div>
            <Label className="text-xs">Condición corporal</Label>
            <Select value={newBodyCond} onValueChange={setNewBodyCond}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BODY_CONDITIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas (opcional)" />
        <Button
          size="sm"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={() => addRecord.mutate({
            petId,
            weightValue: parseFloat(newWeight) || currentWeight,
            weightUnit: weightUnit as "kg" | "lb",
            bodyCondition: newBodyCond as "very_thin" | "thin" | "ideal" | "overweight" | "obese",
            notes: notes || undefined,
          })}
          disabled={addRecord.isPending}
        >
          Registrar peso
        </Button>
      </div>

      {history && history.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {[...history].reverse().map((r) => {
            const bc = BODY_CONDITIONS.find((b) => b.value === r.bodyCondition);
            return (
              <div key={r.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <span className="font-medium">{r.weightValue} {r.weightUnit}</span>
                  {bc && <span className="text-xs ml-2" style={{ color: bc.color }}>● {bc.label}</span>}
                  {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.recordedAt).toLocaleDateString("es-ES")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Vaccines View ────────────────────────────────────────────────────────────
function VaccinesView({ petId }: { petId: number }) {
  const utils = trpc.useUtils();
  const { data: vaccines } = trpc.pets.vaccines.useQuery({ petId });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [administeredAt, setAdministeredAt] = useState("");
  const [nextDueAt, setNextDueAt] = useState("");
  const [vetName, setVetName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");

  const addVaccine = trpc.pets.addVaccine.useMutation({
    onSuccess: () => {
      toast.success("Vacuna registrada");
      utils.pets.vaccines.invalidate({ petId });
      setOpen(false);
      setName(""); setAdministeredAt(""); setNextDueAt(""); setVetName(""); setBatchNumber(""); setNotes("");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteVaccine = trpc.pets.deleteVaccine.useMutation({
    onSuccess: () => { toast.success("Vacuna eliminada"); utils.pets.vaccines.invalidate({ petId }); },
    onError: (e) => toast.error(e.message),
  });

  const now = new Date();
  const upcoming = vaccines?.filter((v) => v.nextDueAt && new Date(v.nextDueAt) > now) ?? [];
  const overdue = vaccines?.filter((v) => v.nextDueAt && new Date(v.nextDueAt) <= now) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Vacunas</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">+ Añadir vacuna</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nueva vacuna</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label>Nombre de la vacuna *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rabia, Moquillo, Parvovirus..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Fecha administración</Label>
                  <Input type="date" value={administeredAt} onChange={(e) => setAdministeredAt(e.target.value)} />
                </div>
                <div>
                  <Label>Próxima dosis</Label>
                  <Input type="date" value={nextDueAt} onChange={(e) => setNextDueAt(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Veterinario</Label>
                <Input value={vetName} onChange={(e) => setVetName(e.target.value)} placeholder="Nombre del veterinario" />
              </div>
              <div>
                <Label>Nº de lote</Label>
                <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="Número de lote" />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => addVaccine.mutate({
                  petId, name,
                  administeredAt: administeredAt || undefined,
                  nextDueAt: nextDueAt || undefined,
                  vetName: vetName || undefined,
                  batchNumber: batchNumber || undefined,
                  notes: notes || undefined,
                })}
                disabled={addVaccine.isPending || !name}
              >
                Guardar vacuna
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
          <p className="text-xs font-medium text-red-600 mb-2">⚠️ Vacunas vencidas o pendientes</p>
          {overdue.map((v) => (
            <div key={v.id} className="flex items-center justify-between text-sm py-1">
              <span className="font-medium text-red-700">{v.name}</span>
              <span className="text-xs text-red-500">{v.nextDueAt ? new Date(v.nextDueAt).toLocaleDateString("es-ES") : "—"}</span>
            </div>
          ))}
        </div>
      )}

      {!vaccines?.length && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <div className="text-3xl mb-2">💉</div>
          <p>Sin vacunas registradas</p>
        </div>
      )}

      <div className="space-y-2">
        {vaccines?.map((v) => {
          const isDue = v.nextDueAt && new Date(v.nextDueAt) <= now;
          const isSoon = v.nextDueAt && !isDue && (new Date(v.nextDueAt).getTime() - now.getTime()) < 30 * 24 * 60 * 60 * 1000;
          return (
            <div key={v.id} className={`border rounded-lg p-3 text-sm ${isDue ? "border-red-200 bg-red-50 dark:bg-red-950" : isSoon ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold">{v.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                    {v.administeredAt && <span>💉 {new Date(v.administeredAt).toLocaleDateString("es-ES")}</span>}
                    {v.nextDueAt && <span className={isDue ? "text-red-600 font-medium" : isSoon ? "text-yellow-600 font-medium" : ""}>
                      📅 Próxima: {new Date(v.nextDueAt).toLocaleDateString("es-ES")}
                    </span>}
                    {v.vetName && <span>👨‍⚕️ {v.vetName}</span>}
                  </div>
                  {v.notes && <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>}
                </div>
                <button
                  onClick={() => deleteVaccine.mutate({ vaccineId: v.id })}
                  className="text-red-400 hover:text-red-600 text-xs"
                >🗑️</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Medications View ─────────────────────────────────────────────────────────
function MedicationsView({ petId }: { petId: number }) {
  const utils = trpc.useUtils();
  const { data: meds } = trpc.pets.medications.useQuery({ petId });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [prescribedBy, setPrescribedBy] = useState("");
  const [notes, setNotes] = useState("");

  const addMed = trpc.pets.addMedication.useMutation({
    onSuccess: () => {
      toast.success("Medicamento registrado");
      utils.pets.medications.invalidate({ petId });
      setOpen(false);
      setName(""); setDosage(""); setFrequency(""); setStartDate(""); setEndDate(""); setPrescribedBy(""); setNotes("");
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMed = trpc.pets.updateMedication.useMutation({
    onSuccess: () => { utils.pets.medications.invalidate({ petId }); },
  });

  const activeMeds = meds?.filter((m) => m.active) ?? [];
  const inactiveMeds = meds?.filter((m) => !m.active) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Medicamentos</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">+ Añadir medicamento</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nuevo medicamento</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label>Nombre *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del medicamento" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Dosis</Label>
                  <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="5mg, 1 comprimido..." />
                </div>
                <div>
                  <Label>Frecuencia</Label>
                  <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="Cada 12h, 1 vez/día..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Inicio</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>Fin</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Prescrito por</Label>
                <Input value={prescribedBy} onChange={(e) => setPrescribedBy(e.target.value)} placeholder="Veterinario" />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => addMed.mutate({
                  petId, name,
                  dosage: dosage || undefined,
                  frequency: frequency || undefined,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  prescribedBy: prescribedBy || undefined,
                  notes: notes || undefined,
                })}
                disabled={addMed.isPending || !name}
              >
                Guardar medicamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!meds?.length && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <div className="text-3xl mb-2">💊</div>
          <p>Sin medicamentos registrados</p>
        </div>
      )}

      {activeMeds.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-600 mb-2">✅ Medicamentos activos</p>
          <div className="space-y-2">
            {activeMeds.map((m) => (
              <div key={m.id} className="border rounded-lg p-3 text-sm border-green-200 bg-green-50 dark:bg-green-950">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold">{m.name}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      {m.dosage && <span>💊 {m.dosage}</span>}
                      {m.frequency && <span>🕐 {m.frequency}</span>}
                      {m.prescribedBy && <span>👨‍⚕️ {m.prescribedBy}</span>}
                      {m.endDate && <span>📅 Hasta: {new Date(m.endDate).toLocaleDateString("es-ES")}</span>}
                    </div>
                    {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                  </div>
                  <button
                    onClick={() => updateMed.mutate({ medicationId: m.id, active: false })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    title="Marcar como inactivo"
                  >⏹️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveMeds.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Historial</p>
          <div className="space-y-2">
            {inactiveMeds.map((m) => (
              <div key={m.id} className="border rounded-lg p-3 text-sm opacity-60">
                <p className="font-semibold">{m.name}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                  {m.dosage && <span>{m.dosage}</span>}
                  {m.frequency && <span>{m.frequency}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Nutrition Profile Editor ─────────────────────────────────────────────────
function NutritionProfileEditor({ petId }: { petId: number }) {
  const utils = trpc.useUtils();
  const { data: profile } = trpc.pets.getNutritionProfile.useQuery({ petId });
  const [dietType, setDietType] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [bodyCondition, setBodyCondition] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [allergies, setAllergies] = useState("");
  const [foodsToAvoid, setFoodsToAvoid] = useState("");
  const [favoriteFoods, setFavoriteFoods] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Initialize from profile data
  React.useEffect(() => {
    if (profile && !initialized) {
      setDietType(profile.dietType ?? "standard");
      setActivityLevel(profile.activityLevel ?? "moderate");
      setBodyCondition(profile.bodyCondition ?? "ideal");
      setTargetWeight(profile.targetWeightKg ? String(profile.targetWeightKg) : "");
      setAllergies(profile.allergiesJson ? JSON.parse(profile.allergiesJson).join(", ") : "");
      setFoodsToAvoid(profile.foodsToAvoidJson ? JSON.parse(profile.foodsToAvoidJson).join(", ") : "");
      setFavoriteFoods(profile.favoriteFoodsJson ? JSON.parse(profile.favoriteFoodsJson).join(", ") : "");
      setMedicalConditions(profile.medicalConditionsJson ? JSON.parse(profile.medicalConditionsJson).join(", ") : "");
      setMealsPerDay(profile.mealsPerDay ? String(profile.mealsPerDay) : "2");
      setInitialized(true);
    }
  }, [profile, initialized]);

  const updateProfile = trpc.pets.updateNutritionProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil nutricional guardado");
      utils.pets.getNutritionProfile.invalidate({ petId });
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSave() {
    updateProfile.mutate({
      petId,
      dietType: (dietType || "standard") as Parameters<typeof updateProfile.mutate>[0]["dietType"],
      activityLevel: (activityLevel || "moderate") as Parameters<typeof updateProfile.mutate>[0]["activityLevel"],
      bodyCondition: (bodyCondition || "ideal") as Parameters<typeof updateProfile.mutate>[0]["bodyCondition"],
      targetWeightKg: targetWeight ? parseFloat(targetWeight) : undefined,
      allergies: allergies ? allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
      foodsToAvoid: foodsToAvoid ? foodsToAvoid.split(",").map((s) => s.trim()).filter(Boolean) : [],
      favoriteFoods: favoriteFoods ? favoriteFoods.split(",").map((s) => s.trim()).filter(Boolean) : [],
      medicalConditions: medicalConditions ? medicalConditions.split(",").map((s) => s.trim()).filter(Boolean) : [],
      mealsPerDay: mealsPerDay ? parseInt(mealsPerDay) : 2,
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Perfil nutricional</h3>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label>Tipo de dieta</Label>
          <Select value={dietType || "standard"} onValueChange={setDietType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DIET_TYPES.map((d) => (
                <SelectItem key={d.value} value={d.value}>{d.emoji} {d.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Condición corporal</Label>
            <Select value={bodyCondition || "ideal"} onValueChange={setBodyCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BODY_CONDITIONS.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    <span style={{ color: b.color }}>●</span> {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nivel de actividad</Label>
            <Select value={activityLevel || "moderate"} onValueChange={setActivityLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Peso objetivo (kg)</Label>
            <Input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="Opcional" />
          </div>
          <div>
            <Label>Comidas por día</Label>
            <Select value={mealsPerDay || "2"} onValueChange={setMealsPerDay}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Alergias / intolerancias (separadas por comas)</Label>
          <Input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="pollo, trigo, lactosa..." />
        </div>

        <div>
          <Label>Alimentos a evitar (separados por comas)</Label>
          <Input value={foodsToAvoid} onChange={(e) => setFoodsToAvoid(e.target.value)} placeholder="cebolla, uvas, chocolate..." />
        </div>

        <div>
          <Label>Alimentos favoritos (separados por comas)</Label>
          <Input value={favoriteFoods} onChange={(e) => setFavoriteFoods(e.target.value)} placeholder="ternera, arroz, zanahoria..." />
        </div>

        <div>
          <Label>Condiciones médicas (separadas por comas)</Label>
          <Input value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} placeholder="diabetes, artritis, insuficiencia renal..." />
        </div>

        {profile?.dailyCaloriesTarget && (
          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 text-sm">
            <p className="font-medium">Objetivos calculados por IA</p>
            <p className="text-muted-foreground">{profile.dailyCaloriesTarget} kcal/día · {profile.dailyGramsTarget}g/día</p>
          </div>
        )}

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? "Guardando..." : "Guardar perfil nutricional"}
        </Button>
      </div>
    </div>
  );
}

// ─── Clinic Tab ────────────────────────────────────────────────────────────────

// ─── Feeding Tab ─────────────────────────────────────────────────────────────
function FeedingTab({ petId, petName }: { petId: number; petName: string }) {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.pets.nutritionProfile.useQuery({ petId });
  const updateProfile = trpc.pets.updateNutritionProfile.useMutation({
    onSuccess: () => { toast.success("Alimentación guardada"); utils.pets.nutritionProfile.invalidate({ petId }); },
    onError: (e) => toast.error(e.message),
  });
  const analyzeCurrentDiet = trpc.pets.analyzeCurrentDiet.useMutation({
    onSuccess: () => { toast.success("Análisis completado"); utils.pets.nutritionProfile.invalidate({ petId }); },
    onError: (e) => toast.error(e.message),
  });

  const [brand, setBrand] = React.useState("");
  const [foodType, setFoodType] = React.useState("");
  const [frequency, setFrequency] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [supplements, setSupplements] = React.useState("");
  const [treats, setTreats] = React.useState("");
  const [water, setWater] = React.useState("");
  const [schedule, setSchedule] = React.useState("");
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (profile && !initialized) {
      setBrand(profile.currentFoodBrand ?? "");
      setFoodType(profile.currentFoodType ?? "");
      setFrequency(profile.currentFoodFrequency?.toString() ?? "");
      setAmount(profile.currentFoodAmountGrams?.toString() ?? "");
      setNotes(profile.currentFoodNotes ?? "");
      setSupplements(profile.supplementsJson ? JSON.parse(profile.supplementsJson).join(", ") : "");
      setTreats(profile.treatsFrequency ?? "");
      setWater(profile.waterIntakeType ?? "");
      setSchedule(profile.feedingScheduleJson ? JSON.parse(profile.feedingScheduleJson).join(", ") : "");
      setInitialized(true);
    }
  }, [profile, initialized]);

  const handleSave = () => {
    updateProfile.mutate({
      petId,
      currentFoodBrand: brand || undefined,
      currentFoodType: (foodType as any) || undefined,
      currentFoodFrequency: frequency ? parseInt(frequency) : undefined,
      currentFoodAmountGrams: amount ? parseInt(amount) : undefined,
      currentFoodNotes: notes || undefined,
      supplements: supplements ? supplements.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      treatsFrequency: (treats as any) || undefined,
      waterIntakeType: (water as any) || undefined,
      feedingSchedule: schedule ? schedule.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    });
  };

  const analysis = profile?.currentDietAnalysisJson ? (() => {
    try { return JSON.parse(profile.currentDietAnalysisJson); } catch { return null; }
  })() : null;

  const ratingColor = (r: number) => r >= 8 ? "text-green-600" : r >= 6 ? "text-yellow-600" : "text-red-600";
  const ratingBg = (r: number) => r >= 8 ? "bg-green-50 border-green-200" : r >= 6 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";

  if (isLoading) return <div className="py-4 text-center text-sm text-muted-foreground">Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
        💡 Registra qué come {petName} actualmente. La IA evaluará si la nutrición es adecuada aunque el animal parezca sano.
      </div>

      {/* Formulario de alimentación */}
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Alimentación actual</h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de alimento</label>
            <select
              value={foodType}
              onChange={e => setFoodType(e.target.value)}
              className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
            >
              <option value="">Seleccionar...</option>
              <option value="pienso_seco">Pienso seco</option>
              <option value="pienso_humedo">Pienso húmedo</option>
              <option value="barf">BARF (crudo)</option>
              <option value="casero">Comida casera</option>
              <option value="mixto">Mixto</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Marca / producto</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="Ej: Royal Canin, Acana..."
              className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Tomas al día</label>
            <select
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
            >
              <option value="">Seleccionar...</option>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} vez{n > 1 ? "es" : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Gramos por toma</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Ej: 150"
              min={1}
              className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Premios/snacks</label>
            <select
              value={treats}
              onChange={e => setTreats(e.target.value)}
              className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
            >
              <option value="">Seleccionar...</option>
              <option value="nunca">Nunca</option>
              <option value="ocasional">Ocasional</option>
              <option value="diario">Diario</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de agua</label>
            <select
              value={water}
              onChange={e => setWater(e.target.value)}
              className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
            >
              <option value="">Seleccionar...</option>
              <option value="grifo">Del grifo</option>
              <option value="filtrada">Filtrada</option>
              <option value="fuente">Fuente/dispensador</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Suplementos (separados por coma)</label>
          <input
            type="text"
            value={supplements}
            onChange={e => setSupplements(e.target.value)}
            placeholder="Ej: omega-3, probióticos, vitamina D..."
            className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Horarios de comida (separados por coma)</label>
          <input
            type="text"
            value={schedule}
            onChange={e => setSchedule(e.target.value)}
            placeholder="Ej: 8:00, 14:00, 20:00"
            className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Notas adicionales</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej: come muy rápido, le gusta mezclar con agua caliente..."
            rows={2}
            className="w-full text-sm border rounded-md px-2 py-1.5 bg-background resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
          >
            {updateProfile.isPending ? "Guardando..." : "💾 Guardar alimentación"}
          </button>
          <button
            onClick={() => analyzeCurrentDiet.mutate({ petId })}
            disabled={analyzeCurrentDiet.isPending || !profile}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
          >
            {analyzeCurrentDiet.isPending ? "Analizando..." : "🔬 Analizar con IA"}
          </button>
        </div>
      </div>

      {/* Resultado del análisis IA */}
      {analysis && (
        <div className={`rounded-lg border p-4 space-y-3 ${ratingBg(analysis.overallRating)}`}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Análisis nutricional IA</h4>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${ratingColor(analysis.overallRating)}`}>{analysis.overallRating}/10</span>
              <span className="text-xs font-medium text-muted-foreground">{analysis.ratingLabel}</span>
            </div>
          </div>
          <p className="text-sm">{analysis.summary}</p>

          {analysis.positives?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">✅ Puntos positivos</p>
              <ul className="space-y-0.5">
                {analysis.positives.map((p: string, i: number) => (
                  <li key={i} className="text-xs text-green-800">• {p}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.concerns?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 mb-1">⚠️ Preocupaciones</p>
              <ul className="space-y-0.5">
                {analysis.concerns.map((c: string, i: number) => (
                  <li key={i} className="text-xs text-yellow-800">• {c}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.deficiencies?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 mb-1">❌ Deficiencias detectadas</p>
              <ul className="space-y-0.5">
                {analysis.deficiencies.map((d: string, i: number) => (
                  <li key={i} className="text-xs text-red-800">• {d}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-1">💡 Recomendaciones</p>
              <ul className="space-y-0.5">
                {analysis.recommendations.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-blue-800">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.urgentActions?.length > 0 && (
            <div className="bg-red-100 border border-red-300 rounded p-2">
              <p className="text-xs font-bold text-red-800 mb-1">🚨 Acciones urgentes</p>
              <ul className="space-y-0.5">
                {analysis.urgentActions.map((a: string, i: number) => (
                  <li key={i} className="text-xs text-red-800 font-medium">• {a}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.shouldConsultVet && (
            <div className="bg-orange-100 border border-orange-300 rounded p-2 text-xs text-orange-800">
              🏥 <strong>Consulta veterinaria recomendada:</strong> {analysis.vetConsultReason}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Calorías ideales/día</p>
              <p className="font-bold text-sm">{analysis.idealCaloriesPerDay ?? "—"} kcal</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Gramos ideales/día</p>
              <p className="font-bold text-sm">{analysis.idealGramsPerDay ?? "—"} g</p>
            </div>
          </div>

          {profile?.currentDietAnalyzedAt && (
            <p className="text-xs text-muted-foreground text-right">
              Analizado: {new Date(profile.currentDietAnalyzedAt).toLocaleDateString("es-ES")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ClinicTab({ petId, petName }: { petId: number; petName: string }) {
  const utils = trpc.useUtils();
  const [code, setCode] = useState("");
  const { data: linkedClinics, isLoading } = trpc.pets.linkedClinics.useQuery({ petId });
  const linkToClinic = trpc.pets.linkToClinic.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ Vinculado a ${data.clinicName}`);
      setCode("");
      utils.pets.linkedClinics.invalidate({ petId });
    },
    onError: (e) => toast.error(e.message),
  });
  const unlinkFromClinic = trpc.pets.unlinkFromClinic.useMutation({
    onSuccess: () => {
      toast.success("Clínica desvinculada");
      utils.pets.linkedClinics.invalidate({ petId });
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">Clínicas colaboradoras vinculadas</h4>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !linkedClinics || linkedClinics.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground">
            <p className="text-2xl mb-1">🏥</p>
            <p className="text-sm">{petName} no está vinculado a ninguna clínica</p>
            <p className="text-xs mt-1">Introduce el código que te ha dado tu veterinario</p>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedClinics.map(({ clinic, link }) => (
              <div key={link.id} className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{clinic.name}</p>
                  {clinic.address && <p className="text-xs text-muted-foreground truncate">📍 {clinic.address}</p>}
                  {clinic.phone && <p className="text-xs text-muted-foreground">📞 {clinic.phone}</p>}
                  {clinic.email && <p className="text-xs text-muted-foreground">✉️ {clinic.email}</p>}
                  {(clinic as any).city && (
                    <p className="text-xs text-muted-foreground">
                      🏙️ {(clinic as any).city}{(clinic as any).province ? `, ${(clinic as any).province}` : ""}
                    </p>
                  )}
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Vinculado desde {new Date(link.createdAt).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600 shrink-0"
                  onClick={() => unlinkFromClinic.mutate({ petId, clinicId: clinic.id })}
                  disabled={unlinkFromClinic.isPending}
                >
                  Desvincular
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-1">Vincular a una clínica colaboradora</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Pide a tu clínica veterinaria su código de acceso BuddyMarket para vincular a {petName}.
          Una vez vinculado, la clínica podrá ver el historial de salud y enviarte alertas y recordatorios.
        </p>
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Código de clínica (ej: ABC12345)"
            maxLength={12}
            className="flex-1"
          />
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
            onClick={() => linkToClinic.mutate({ petId, clinicCode: code })}
            disabled={linkToClinic.isPending || code.length < 6}
          >
            {linkToClinic.isPending ? "..." : "Vincular"}
          </Button>
        </div>
      </div>
    </div>
  );
}
// ─── Link to Clinic ────────────────────────────────────────────────────────────
function LinkClinicDialog({ petId, petName }: { petId: number; petName: string }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const linkToClinic = trpc.pets.linkToClinic.useMutation({
    onSuccess: (data) => {
      toast.success(`Vinculado a ${data.clinicName}`);
      setOpen(false);
      setCode("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">🏥 Vincular clínica</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Vincular {petName} a una clínica</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">Introduce el código de acceso que te ha proporcionado tu clínica veterinaria.</p>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Código de clínica (ej: ABC12345)" maxLength={12} />
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => linkToClinic.mutate({ petId, clinicCode: code })}
            disabled={linkToClinic.isPending || code.length < 6}
          >
            {linkToClinic.isPending ? "Vinculando..." : "Vincular"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const [tab, setTab] = useState<"info" | "menu" | "salud" | "foto" | "alerts">("info");
  const { data: alerts } = trpc.pets.alerts.useQuery();
  const { data: nutritionProfile } = trpc.pets.getNutritionProfile.useQuery({ petId: pet.id });
  const petAlerts = alerts?.filter((a) => a.petId === pet.id && !a.resolvedAt) ?? [];

  const emoji = pet.avatarEmoji || getSpeciesEmoji(pet.species);
  const ageStr = [
    pet.ageYears ? `${pet.ageYears}a` : null,
    pet.ageMonths ? `${pet.ageMonths}m` : null,
  ].filter(Boolean).join(" ") || null;

  const bc = nutritionProfile?.bodyCondition;
  const bcColor = bc ? getBodyConditionColor(bc) : null;
  const dietInfo = nutritionProfile?.dietType ? DIET_TYPES.find((d) => d.value === nutritionProfile.dietType) : null;

  const TABS = [
    { id: "info",    label: "ℹ️ Info" },
    { id: "foto",    label: "📷 Foto IA" },
    { id: "menu",    label: "🍽️ Nutrición" },
    { id: "feeding", label: "🥣 Alimentación" },
    { id: "salud",   label: "🏥 Salud" },
    { id: "clinics", label: "🏥 Clínicas" },
    { id: "alerts",  label: `🔔${petAlerts.length > 0 ? ` (${petAlerts.length})` : ""}` },
  ] as const;

  return (
    <Card className="overflow-hidden border-2 border-orange-100 dark:border-orange-900 hover:border-orange-300 transition-colors">
      <CardHeader className="pb-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {nutritionProfile?.photoUrl ? (
              <img
                src={nutritionProfile.photoUrl}
                alt={pet.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-orange-300"
              />
            ) : (
              <span className="text-4xl">{emoji}</span>
            )}
            <div>
              <h3 className="font-bold text-lg leading-tight">{pet.name}</h3>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="secondary" className="text-xs">{getSpeciesLabel(pet.species)}</Badge>
                {pet.breed && <Badge variant="outline" className="text-xs">{pet.breed}</Badge>}
                {pet.neutered && <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">Castrado</Badge>}
                {bc && <Badge className="text-xs" style={{ background: bcColor + "20", color: bcColor, border: `1px solid ${bcColor}40` }}>{getBodyConditionLabel(bc)}</Badge>}
                {dietInfo && <Badge className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{dietInfo.emoji} {dietInfo.label}</Badge>}
              </div>
            </div>
          </div>
          {petAlerts.length > 0 && (
            <Badge className="bg-red-500 text-white text-xs animate-pulse shrink-0">
              {petAlerts.length} alerta{petAlerts.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground mt-2 flex-wrap">
          <span>⚖️ {pet.weightValue}{pet.weightUnit}</span>
          {ageStr && <span>🎂 {ageStr}</span>}
          {pet.gender && <span>{pet.gender === "macho" ? "♂️" : "♀️"} {pet.gender}</span>}
          {nutritionProfile?.dailyCaloriesTarget && (
            <span>🔥 {nutritionProfile.dailyCaloriesTarget} kcal/día</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {/* Tab bar */}
        <div className="flex gap-0.5 mb-3 border-b pb-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 text-xs py-1.5 px-2 rounded-md transition-colors ${
                tab === t.id
                  ? "bg-orange-500 text-white"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab === "info" && (
          <div className="space-y-3">
            {pet.healthNotes && (
              <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-2 text-xs">
                <span className="font-medium">📋 Notas: </span>{pet.healthNotes}
              </div>
            )}
            <NutritionProfileEditor petId={pet.id} />
            <div className="flex gap-2 flex-wrap pt-2 border-t">
<Button size="sm" variant="outline" onClick={onEdit}>✏️ Editar</Button>
              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={onDelete}>🗑️ Eliminar</Button>
            </div>
          </div>
        )}

        {/* Foto IA tab */}
        {tab === "foto" && (
          <PhotoAnalyzer
            petId={pet.id}
            petName={pet.name}
            currentPhotoUrl={nutritionProfile?.photoUrl}
          />
        )}

        {/* Nutrición tab */}
        {tab === "menu" && (
          <div className="space-y-4">
            <PetMenuView petId={pet.id} petName={pet.name} />
          </div>
        )}

        {/* Salud tab */}
        {tab === "salud" && (
          <div className="space-y-6">
            <WeightHistoryView
              petId={pet.id}
              petName={pet.name}
              currentWeight={pet.weightValue}
              weightUnit={pet.weightUnit}
            />
            <div className="border-t pt-4">
              <VaccinesView petId={pet.id} />
            </div>
            <div className="border-t pt-4">
              <MedicationsView petId={pet.id} />
            </div>
          </div>
        )}

        {/* Feeding tab */}
        {tab === "feeding" && (
          <FeedingTab petId={pet.id} petName={pet.name} />
        )}
        {/* Clinics tab */}
        {tab === "clinics" && (
          <ClinicTab petId={pet.id} petName={pet.name} />
        )}
        {/* Alerts tab */}
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
  const { isProMax, isFree } = usePlan();
  const [, navigate] = useLocation();

  // Redirect free users to the preview page
  useEffect(() => {
    if (isFree) {
      navigate("/app/buddy-pet-preview");
    }
  }, [isFree, navigate]);

  const utils = trpc.useUtils();
  const { data: pets, isLoading } = trpc.pets.list.useQuery();
  const createPet = trpc.pets.create.useMutation({
    onSuccess: () => { toast.success("Mascota añadida"); utils.pets.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updatePet = trpc.pets.update.useMutation({
    onSuccess: () => { toast.success("Mascota actualizada"); utils.pets.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deletePet = trpc.pets.delete.useMutation({
    onSuccess: () => { toast.success("Mascota eliminada"); utils.pets.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [editingPet, setEditingPet] = useState<typeof pets extends Array<infer T> ? T : never | null>(null);

  function handleSave(form: PetFormData) {
    const payload = {
      name: form.name,
      species: form.species,
      breed: form.breed || undefined,
      weightValue: parseFloat(form.weightValue) || 0,
      weightUnit: form.weightUnit,
      ageYears: form.ageYears ? parseInt(form.ageYears) : undefined,
      ageMonths: form.ageMonths ? parseInt(form.ageMonths) : undefined,
      gender: form.gender || undefined,
      neutered: form.neutered,
      healthNotes: form.healthNotes || undefined,
      avatarEmoji: form.avatarEmoji || undefined,
    };
    if (editingPet) {
      updatePet.mutate({ id: (editingPet as { id: number }).id, ...payload });
    } else {
      createPet.mutate(payload);
    }
    setEditingPet(null);
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🐾 BuddyPet</h1>
          <p className="text-muted-foreground text-sm">Gestión nutricional y de salud para tus mascotas</p>
        </div>
        <PetFormDialog
          title="Añadir mascota"
          trigger={
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              + Añadir mascota
            </Button>
          }
          onSave={handleSave}
        />
      </div>

      {/* Edit dialog (hidden trigger) */}
      {editingPet && (
        <PetFormDialog
          title="Editar mascota"
          trigger={<span />}
          initial={{
            name: (editingPet as { name: string }).name,
            species: (editingPet as { species: Species }).species,
            breed: (editingPet as { breed?: string | null }).breed ?? "",
            weightValue: String((editingPet as { weightValue: number }).weightValue),
            weightUnit: (editingPet as { weightUnit: "kg" | "lb" }).weightUnit,
            ageYears: String((editingPet as { ageYears?: number | null }).ageYears ?? ""),
            ageMonths: String((editingPet as { ageMonths?: number | null }).ageMonths ?? ""),
            gender: (editingPet as { gender?: string | null }).gender ?? "",
            neutered: (editingPet as { neutered: boolean }).neutered,
            healthNotes: (editingPet as { healthNotes?: string | null }).healthNotes ?? "",
            avatarEmoji: (editingPet as { avatarEmoji?: string | null }).avatarEmoji ?? "",
          }}
          onSave={handleSave}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Cargando mascotas...</div>
      )}

      {/* Empty state */}
      {!isLoading && !pets?.length && (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">🐾</div>
          <h2 className="text-xl font-semibold">Añade tu primera mascota</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            BuddyPet te ayuda a gestionar la nutrición, salud y bienestar de tus mascotas con inteligencia artificial.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-lg mx-auto mt-6 text-sm">
            {[
              { emoji: "🍽️", text: "Menús personalizados por dieta" },
              { emoji: "📷", text: "Análisis de foto con IA" },
              { emoji: "⚖️", text: "Control de peso y condición corporal" },
              { emoji: "💉", text: "Vacunas y medicamentos" },
            ].map((f, i) => (
              <div key={i} className="bg-orange-50 dark:bg-orange-950 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{f.emoji}</div>
                <p className="text-xs text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pet cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pets?.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            onEdit={() => setEditingPet(pet as typeof editingPet)}
            onDelete={() => {
              if (confirm(`¿Eliminar a ${pet.name}?`)) {
                deletePet.mutate({ id: pet.id });
              }
            }}
          />
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground text-center border-t pt-4">
        ⚠️ La información nutricional y de salud proporcionada es orientativa y no sustituye la consulta con un veterinario profesional.
      </div>
    </div>
  );
}
