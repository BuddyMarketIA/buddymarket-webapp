// @ts-nocheck
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageCircle, Plus, Search, Sparkles, Users, BookOpen, ChevronRight, Trash2, Copy, Edit3, Zap } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type PlanCategory = "perdida_peso" | "ganancia_muscular" | "mantenimiento" | "clinico" | "deportivo" | "vegetariano" | "otro";

const CATEGORY_META: Record<PlanCategory, { label: string; color: string; icon: string }> = {
  perdida_peso:       { label: "Pérdida de peso",    color: "bg-orange-100 text-orange-700",  icon: "🔥" },
  ganancia_muscular:  { label: "Ganancia muscular",  color: "bg-blue-100 text-blue-700",      icon: "💪" },
  mantenimiento:      { label: "Mantenimiento",      color: "bg-yellow-100 text-yellow-700",  icon: "⚖️" },
  clinico:            { label: "Clínico/Terapéutico",color: "bg-red-100 text-red-700",        icon: "🩺" },
  deportivo:          { label: "Deportivo",          color: "bg-green-100 text-green-700",    icon: "🏃" },
  vegetariano:        { label: "Vegetariano/Vegano", color: "bg-emerald-100 text-emerald-700",icon: "🌱" },
  otro:               { label: "Otro",               color: "bg-muted/50 text-foreground/70", icon: "📋" },
};

// ─── Componente de tarjeta de plan ────────────────────────────────────────────
function PlanCard({ plan, onAssign, onEdit, onDelete, onDuplicate }: {
  plan: any;
  onAssign: (plan: any) => void;
  onEdit: (plan: any) => void;
  onDelete: (id: number) => void;
  onDuplicate: (plan: any) => void;
}) {
  const meta = CATEGORY_META[plan.category as PlanCategory] ?? CATEGORY_META.otro;
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="relative bg-background border border-border rounded-2xl p-4 hover:border-orange-300 hover:shadow-md transition-all group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{meta.icon}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-sm leading-tight truncate">{plan.name}</h3>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}>
              {meta.label}
            </span>
          </div>
        </div>
        {plan.isPublic && (
          <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
            Público
          </span>
        )}
      </div>

      {/* Descripción */}
      {plan.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{plan.description}</p>
      )}

      {/* Macros / calorías */}
      {plan.targetCalories && (
        <div className="flex items-center gap-3 mb-3 p-2 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-bold text-orange-600">{plan.targetCalories}</p>
            <p className="text-xs text-muted-foreground">kcal/día</p>
          </div>
          {plan.targetProtein && (
            <div className="text-center">
              <p className="text-sm font-bold text-blue-600">{plan.targetProtein}g</p>
              <p className="text-xs text-muted-foreground">Prot.</p>
            </div>
          )}
          {plan.targetCarbs && (
            <div className="text-center">
              <p className="text-sm font-bold text-yellow-600">{plan.targetCarbs}g</p>
              <p className="text-xs text-muted-foreground">Carbs</p>
            </div>
          )}
          {plan.targetFat && (
            <div className="text-center">
              <p className="text-sm font-bold text-green-600">{plan.targetFat}g</p>
              <p className="text-xs text-muted-foreground">Grasas</p>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {plan.tags && (() => {
        try {
          const tags = JSON.parse(plan.tags);
          return tags.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 4).map((tag: string) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-full">{tag}</span>
              ))}
            </div>
          ) : null;
        } catch { return null; }
      })()}

      {/* Usos */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Users size={11} />
          {plan.timesUsed ?? 0} asignaciones
        </span>
        <span>{new Date(plan.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAssign(plan)}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs flex items-center gap-1.5"
        >
          <Zap size={12} /> Asignar a paciente
        </Button>
        <button
          onClick={() => onEdit(plan)}
          className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          title="Editar"
        >
          <Edit3 size={13} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => onDuplicate(plan)}
          className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          title="Duplicar"
        >
          <Copy size={13} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => onDelete(plan.id)}
          className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={13} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ExpertPlanLibrary() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlanCategory | "all">("all");

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Formulario de creación/edición
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "perdida_peso" as PlanCategory,
    targetCalories: "",
    targetProtein: "",
    targetCarbs: "",
    targetFat: "",
    weekData: "",
    tags: "",
    isPublic: false,
    durationWeeks: "4",
    notes: "",
  });

  // Formulario de asignación
  const [assignForm, setAssignForm] = useState({
    patientId: "",
    weekCondition: "",
    weekNotes: "",
    weekStartDate: "",
    sendWhatsApp: false,
  });

  // Formulario de IA
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Datos
  const { data: templates, isLoading, refetch } = trpc.expertPatients.getMenuTemplates.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: patients } = trpc.expertPatients.getPatients.useQuery(
    { status: "active" },
    { enabled: !!user }
  );

  // Mutations
  const createMutation = trpc.expertPatients.createMenuTemplate.useMutation({
    onSuccess: () => {
      toast.success("✅ Plan creado en tu biblioteca");
      setShowCreateModal(false);
      setEditingPlan(null);
      resetForm();
      refetch();
    },
    onError: (e) => toast.error(e.message || "Error al crear el plan"),
  });

  const deleteMutation = trpc.expertPatients.deleteMenuTemplate.useMutation({
    onSuccess: () => { toast.success("Plan eliminado"); refetch(); },
    onError: () => toast.error("Error al eliminar"),
  });

  const assignMutation = trpc.expertPatients.assignMenu.useMutation({
    onSuccess: () => {
      toast.success("🥗 Plan asignado y adaptado con IA para el paciente");
      if (assignForm.sendWhatsApp && selectedPlan) {
        const patient = patients?.find(p => p.id === parseInt(assignForm.patientId));
        const phone = patient?.user?.phone;
        const appUrl = window.location.origin;
        const planName = selectedPlan.name;
        const notes = assignForm.weekNotes ? `\n\n📝 Notas de tu nutricionista:\n${assignForm.weekNotes}` : "";
        const msg = encodeURIComponent(
          `Hola ${patient?.user?.name ?? ""} 👋\n\nTe he asignado el plan *${planName}* en Buddy One. La IA lo ha adaptado a tu perfil y condiciones actuales. Ya puedes verlo en tu app.${notes}\n\n👉 Accede aquí: ${appUrl}\n\n¡Cualquier duda estoy aquí! 🥗`
        );
        if (phone) {
          const cleanPhone = phone.replace(/[^0-9+]/g, "");
          window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
        } else {
          const manualPhone = prompt("Teléfono del paciente (con prefijo, ej: +34600000000):");
          if (manualPhone) {
            window.open(`https://wa.me/${manualPhone.replace(/[^0-9+]/g, "")}?text=${msg}`, "_blank");
          }
        }
      }
      setShowAssignModal(false);
      setSelectedPlan(null);
      setAssignForm({ patientId: "", weekCondition: "", weekNotes: "", weekStartDate: "", sendWhatsApp: false });
    },
    onError: (e) => toast.error(e.message || "Error al asignar el plan"),
  });

  const resetForm = () => setForm({
    name: "", description: "", category: "perdida_peso",
    targetCalories: "", targetProtein: "", targetCarbs: "", targetFat: "",
    weekData: "", tags: "", isPublic: false, durationWeeks: "4", notes: "",
  });

  const handleSavePlan = () => {
    if (!form.name.trim()) { toast.error("El nombre del plan es obligatorio"); return; }
    const weekDataJson = form.weekData || JSON.stringify({
      description: form.description,
      durationWeeks: parseInt(form.durationWeeks) || 4,
      notes: form.notes,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      targetCalories: form.targetCalories ? parseInt(form.targetCalories) : null,
      targetProtein: form.targetProtein ? parseInt(form.targetProtein) : null,
      targetCarbs: form.targetCarbs ? parseInt(form.targetCarbs) : null,
      targetFat: form.targetFat ? parseInt(form.targetFat) : null,
    });
    createMutation.mutate({
      name: form.name,
      description: form.description || undefined,
      category: form.category,
      targetCalories: form.targetCalories ? parseInt(form.targetCalories) : undefined,
      weekData: weekDataJson,
      isPublic: form.isPublic,
    });
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) { toast.error("Describe el objetivo del plan"); return; }
    setAiGenerating(true);
    try {
      const res = await fetch("/api/trpc/healthHub.chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            message: `Eres un nutricionista experto. Genera un plan nutricional semanal completo en formato JSON con esta estructura exacta:
{
  "name": "Nombre del plan",
  "description": "Descripción breve",
  "category": "perdida_peso|ganancia_muscular|mantenimiento|clinico|deportivo|vegetariano|otro",
  "targetCalories": número,
  "targetProtein": número en gramos,
  "targetCarbs": número en gramos,
  "targetFat": número en gramos,
  "tags": ["tag1", "tag2"],
  "weekPlan": {
    "lunes": { "desayuno": "...", "almuerzo": "...", "merienda": "...", "cena": "..." },
    "martes": { ... },
    "miercoles": { ... },
    "jueves": { ... },
    "viernes": { ... },
    "sabado": { ... },
    "domingo": { ... }
  },
  "notes": "Notas generales del plan"
}

Objetivo del nutricionista: ${aiPrompt}

Responde SOLO con el JSON, sin texto adicional.`,
          }
        }),
      });
      const data = await res.json();
      const content = data?.result?.data?.json?.response ?? data?.result?.data?.json?.content ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiResult(parsed);
        setForm(prev => ({
          ...prev,
          name: parsed.name ?? prev.name,
          description: parsed.description ?? prev.description,
          category: parsed.category ?? prev.category,
          targetCalories: parsed.targetCalories?.toString() ?? prev.targetCalories,
          targetProtein: parsed.targetProtein?.toString() ?? prev.targetProtein,
          targetCarbs: parsed.targetCarbs?.toString() ?? prev.targetCarbs,
          targetFat: parsed.targetFat?.toString() ?? prev.targetFat,
          tags: (parsed.tags ?? []).join(", "),
          notes: parsed.notes ?? prev.notes,
          weekData: JSON.stringify(parsed),
        }));
        toast.success("✨ Plan generado con IA. Revisa y guarda.");
        setShowAIModal(false);
        setShowCreateModal(true);
      } else {
        toast.error("No se pudo parsear la respuesta de la IA");
      }
    } catch (e) {
      toast.error("Error al generar con IA");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDuplicate = (plan: any) => {
    setForm({
      name: `${plan.name} (copia)`,
      description: plan.description ?? "",
      category: plan.category ?? "otro",
      targetCalories: plan.targetCalories?.toString() ?? "",
      targetProtein: "",
      targetCarbs: "",
      targetFat: "",
      weekData: plan.weekData ?? "",
      tags: "",
      isPublic: false,
      durationWeeks: "4",
      notes: "",
    });
    setShowCreateModal(true);
  };

  const handleAssign = (plan: any) => {
    setSelectedPlan(plan);
    setShowAssignModal(true);
  };

  // Filtrado
  const filtered = useMemo(() => {
    if (!templates) return [];
    return templates.filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "all" || t.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [templates, search, categoryFilter]);

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => navigate("/app/buddy-expert-dashboard")} className="text-muted-foreground/70 hover:text-muted-foreground">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-foreground">Biblioteca de Planes</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Crea plantillas reutilizables · La IA las adapta a cada paciente al asignarlas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => { setShowAIModal(true); setAiResult(null); setAiPrompt(""); }}
              className="flex items-center gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Sparkles size={14} /> Crear con IA
            </Button>
            <Button
              onClick={() => { resetForm(); setEditingPlan(null); setShowCreateModal(true); }}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5"
            >
              <Plus size={14} /> Nuevo plan
            </Button>
          </div>
        </div>

        {/* Banner explicativo */}
        <div className="mb-5 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🧠</span>
            <div>
              <p className="font-bold text-orange-800 text-sm mb-1">Cómo funciona la biblioteca de planes</p>
              <p className="text-xs text-orange-700 leading-relaxed">
                Crea aquí tus planes base (plantillas reutilizables). Cuando asignes un plan a un paciente,
                la IA lo <strong>adapta automáticamente</strong> a su perfil, alergias, objetivos y condiciones
                de esa semana. Cada paciente recibe una versión personalizada del mismo plan base.
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar planes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                categoryFilter === "all" ? "bg-orange-500 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Todos ({templates?.length ?? 0})
            </button>
            {(Object.entries(CATEGORY_META) as [PlanCategory, any][]).map(([key, meta]) => {
              const count = templates?.filter(t => t.category === key).length ?? 0;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === key ? "bg-orange-500 text-white" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {meta.icon} {meta.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de planes */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
            <BookOpen size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
              {search || categoryFilter !== "all" ? "No hay planes con ese filtro" : "Tu biblioteca está vacía"}
            </h3>
            <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
              {search || categoryFilter !== "all"
                ? "Prueba con otro término o categoría"
                : "Crea tu primer plan base. Podrás reutilizarlo con todos tus pacientes y la IA lo adaptará a cada uno."
              }
            </p>
            {!search && categoryFilter === "all" && (
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => { setShowAIModal(true); setAiResult(null); setAiPrompt(""); }}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> Generar con IA
                </Button>
                <Button
                  onClick={() => { resetForm(); setShowCreateModal(true); }}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  + Crear manualmente
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onAssign={handleAssign}
                onEdit={(p) => {
                  setEditingPlan(p);
                  setForm({
                    name: p.name,
                    description: p.description ?? "",
                    category: p.category ?? "otro",
                    targetCalories: p.targetCalories?.toString() ?? "",
                    targetProtein: "",
                    targetCarbs: "",
                    targetFat: "",
                    weekData: p.weekData ?? "",
                    tags: "",
                    isPublic: p.isPublic ?? false,
                    durationWeeks: "4",
                    notes: "",
                  });
                  setShowCreateModal(true);
                }}
                onDelete={(id) => {
                  if (confirm("¿Eliminar este plan de tu biblioteca?")) {
                    deleteMutation.mutate({ templateId: id });
                  }
                }}
                onDuplicate={handleDuplicate}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL: Generar con IA ─────────────────────────────────────────── */}
      <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" /> Generar plan con IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <p className="text-xs text-purple-800 font-medium">
                Describe el objetivo y contexto del plan. La IA generará una plantilla completa con macros,
                estructura semanal y notas clínicas que podrás editar antes de guardar.
              </p>
            </div>
            <div>
              <Label>Describe el plan que necesitas</Label>
              <Textarea
                placeholder="Ej: Plan de pérdida de peso para paciente con hipotiroidismo, 1800 kcal, sin gluten, con alto contenido en proteínas para preservar masa muscular durante el déficit calórico..."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="mt-1"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                "Plan hipocalórico 1500 kcal para pérdida de peso moderada",
                "Plan alto en proteínas para ganancia muscular, 2500 kcal",
                "Plan mediterráneo de mantenimiento, 2000 kcal, sin lactosa",
              ].map(example => (
                <button
                  key={example}
                  onClick={() => setAiPrompt(example)}
                  className="text-xs p-2 bg-muted/50 hover:bg-muted rounded-lg text-left text-muted-foreground hover:text-foreground transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIModal(false)}>Cancelar</Button>
            <Button
              onClick={handleGenerateWithAI}
              disabled={!aiPrompt.trim() || aiGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              {aiGenerating ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
              ) : (
                <><Sparkles size={14} /> Generar plan</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Crear / Editar plan ───────────────────────────────────── */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) { setEditingPlan(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Editar plan" : "Nuevo plan en biblioteca"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Nombre */}
            <div>
              <Label>Nombre del plan *</Label>
              <Input
                placeholder="Ej: Plan hipocalórico 1500 kcal"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Categoría */}
            <div>
              <Label>Categoría</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(Object.entries(CATEGORY_META) as [PlanCategory, any][]).map(([key, meta]) => (
                  <button
                    key={key}
                    onClick={() => setForm(p => ({ ...p, category: key }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.category === key
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-border text-muted-foreground hover:border-orange-300"
                    }`}
                  >
                    {meta.icon} {meta.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <Label>Descripción / Indicaciones clínicas</Label>
              <Textarea
                placeholder="Para quién está indicado, contraindicaciones, notas clínicas importantes..."
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Macros objetivo */}
            <div>
              <Label>Objetivos nutricionales diarios</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">🔥 Calorías</p>
                  <Input
                    type="number"
                    placeholder="1800"
                    value={form.targetCalories}
                    onChange={e => setForm(p => ({ ...p, targetCalories: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">💪 Proteínas (g)</p>
                  <Input
                    type="number"
                    placeholder="120"
                    value={form.targetProtein}
                    onChange={e => setForm(p => ({ ...p, targetProtein: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">⚡ Carbos (g)</p>
                  <Input
                    type="number"
                    placeholder="200"
                    value={form.targetCarbs}
                    onChange={e => setForm(p => ({ ...p, targetCarbs: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">🥑 Grasas (g)</p>
                  <Input
                    type="number"
                    placeholder="60"
                    value={form.targetFat}
                    onChange={e => setForm(p => ({ ...p, targetFat: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Duración */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Duración (semanas)</Label>
                <Input
                  type="number"
                  placeholder="4"
                  value={form.durationWeeks}
                  onChange={e => setForm(p => ({ ...p, durationWeeks: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Etiquetas (separadas por coma)</Label>
                <Input
                  placeholder="sin gluten, bajo sodio, deportivo"
                  value={form.tags}
                  onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <Label>Notas adicionales del plan</Label>
              <Textarea
                placeholder="Instrucciones de seguimiento, suplementación recomendada, actividad física complementaria..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Visibilidad */}
            <div
              onClick={() => setForm(p => ({ ...p, isPublic: !p.isPublic }))}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                form.isPublic ? "bg-purple-50 border-purple-300" : "bg-muted/30 border-border hover:border-purple-200"
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                form.isPublic ? "bg-purple-500 border-purple-500" : "border-border"
              }`}>
                {form.isPublic && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Compartir en la comunidad BuddyExpert</p>
                <p className="text-xs text-muted-foreground">Otros nutricionistas podrán ver e inspirarse en este plan</p>
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); setEditingPlan(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={!form.name.trim() || createMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createMutation.isPending ? "Guardando..." : (editingPlan ? "Actualizar plan" : "Guardar en biblioteca")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: Asignar plan a paciente ───────────────────────────────── */}
      <Dialog open={showAssignModal} onOpenChange={(open) => { setShowAssignModal(open); if (!open) { setSelectedPlan(null); setAssignForm({ patientId: "", weekCondition: "", weekNotes: "", weekStartDate: "", sendWhatsApp: false }); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={18} className="text-orange-500" /> Asignar plan a paciente
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4 py-2">

              {/* Plan seleccionado */}
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-2xl">{CATEGORY_META[selectedPlan.category as PlanCategory]?.icon ?? "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{selectedPlan.name}</p>
                  {selectedPlan.targetCalories && (
                    <p className="text-xs text-muted-foreground">🔥 {selectedPlan.targetCalories} kcal/día objetivo base</p>
                  )}
                </div>
              </div>

              {/* Seleccionar paciente */}
              <div>
                <Label>Paciente *</Label>
                <select
                  value={assignForm.patientId}
                  onChange={e => setAssignForm(p => ({ ...p, patientId: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="">Selecciona un paciente activo...</option>
                  {patients?.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.user?.name ?? "Paciente"} {p.user?.email ? `(${p.user.email})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Condiciones de esta semana */}
              <div>
                <Label className="flex items-center gap-1.5">
                  <span>🩺</span> Condiciones de esta semana (para la IA)
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[
                    "Semana normal", "Mucho estrés laboral", "Viaje / fuera de casa",
                    "Lesión / reposo", "Entrenamiento intenso", "Período menstrual",
                    "Digestión delicada", "Evento social (cenas fuera)",
                  ].map(cond => (
                    <button
                      key={cond}
                      onClick={() => setAssignForm(p => ({ ...p, weekCondition: p.weekCondition === cond ? "" : cond }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        assignForm.weekCondition === cond
                          ? "bg-orange-500 text-white border-orange-500"
                          : "border-border text-muted-foreground hover:border-orange-300"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas adicionales para la IA */}
              <div>
                <Label>Notas adicionales para la adaptación de la IA</Label>
                <Textarea
                  placeholder="Ej: Esta semana el paciente tiene una cena de empresa el jueves, ajustar ese día. Está con antibióticos, evitar fermentados..."
                  value={assignForm.weekNotes}
                  onChange={e => setAssignForm(p => ({ ...p, weekNotes: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Fecha de inicio */}
              <div>
                <Label>Semana de inicio</Label>
                <Input
                  type="date"
                  value={assignForm.weekStartDate}
                  onChange={e => setAssignForm(p => ({ ...p, weekStartDate: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Banner IA */}
              <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
                <p className="text-xs text-purple-800 font-medium flex items-center gap-1.5">
                  <Sparkles size={12} /> La IA adaptará el plan base a:
                </p>
                <ul className="text-xs text-purple-700 mt-1 space-y-0.5 ml-4 list-disc">
                  <li>Perfil del paciente (alergias, restricciones, objetivos)</li>
                  <li>Condiciones de esta semana que hayas indicado</li>
                  <li>Historial y progreso reciente del paciente</li>
                </ul>
              </div>

              {/* Opción WhatsApp */}
              <div
                onClick={() => setAssignForm(p => ({ ...p, sendWhatsApp: !p.sendWhatsApp }))}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  assignForm.sendWhatsApp ? "bg-green-50 border-green-400" : "bg-muted/30 border-border hover:border-green-300"
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                  assignForm.sendWhatsApp ? "bg-green-500 border-green-500" : "border-border"
                }`}>
                  {assignForm.sendWhatsApp && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-green-600" />
                    Notificar al paciente por WhatsApp
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Se abrirá WhatsApp con el mensaje listo para enviar</p>
                </div>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!assignForm.patientId) { toast.error("Selecciona un paciente"); return; }
                const weekContext = [
                  assignForm.weekCondition ? `Condición de la semana: ${assignForm.weekCondition}` : "",
                  assignForm.weekNotes ? `Notas adicionales: ${assignForm.weekNotes}` : "",
                ].filter(Boolean).join(". ");
                assignMutation.mutate({
                  patientRelId: parseInt(assignForm.patientId),
                  menuTitle: selectedPlan?.name,
                  weekStartDate: assignForm.weekStartDate || undefined,
                  expertNotes: weekContext || undefined,
                });
              }}
              disabled={!assignForm.patientId || assignMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
            >
              {assignMutation.isPending ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Asignando...</>
              ) : (
                <><Zap size={14} /> Asignar y adaptar con IA</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
}
