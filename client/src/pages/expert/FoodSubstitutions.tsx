import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  general: { label: "General", color: "bg-muted/50 text-foreground/80", icon: "🍽️" },
  protein: { label: "Proteínas", color: "bg-blue-100 text-blue-700", icon: "🥩" },
  carbs: { label: "Carbohidratos", color: "bg-yellow-100 text-yellow-700", icon: "🍞" },
  fat: { label: "Grasas", color: "bg-orange-100 text-orange-700", icon: "🥑" },
  dairy: { label: "Lácteos", color: "bg-purple-100 text-purple-700", icon: "🥛" },
  vegetable: { label: "Verduras", color: "bg-green-100 text-green-700", icon: "🥦" },
  fruit: { label: "Frutas", color: "bg-pink-100 text-pink-700", icon: "🍎" },
  allergen: { label: "Alérgenos", color: "bg-red-100 text-red-700", icon: "⚠️" },
};

type SubstituteItem = {
  name: string;
  amount: string;
  notes: string;
};

export default function FoodSubstitutions() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [form, setForm] = useState({
    originalFood: "",
    originalAmount: "",
    category: "general",
    notes: "",
  });
  const [substitutes, setSubstitutes] = useState<SubstituteItem[]>([
    { name: "", amount: "", notes: "" },
    { name: "", amount: "", notes: "" },
  ]);

  const { data: substitutionsList, isLoading, refetch } = trpc.expertPatients.getFoodSubstitutions.useQuery(
    { search: searchQuery || undefined },
    { enabled: !!user }
  );

  const addSubstitutionMutation = trpc.expertPatients.addFoodSubstitution.useMutation({
    onSuccess: () => {
      toast.success("✅ Sustitución guardada correctamente");
      setShowModal(false);
      setForm({ originalFood: "", originalAmount: "", category: "general", notes: "" });
      setSubstitutes([{ name: "", amount: "", notes: "" }, { name: "", amount: "", notes: "" }]);
      refetch();
    },
    onError: () => toast.error("Error al guardar la sustitución"),
  });

  const deleteSubstitutionMutation = trpc.expertPatients.deleteFoodSubstitution.useMutation({
    onSuccess: () => { toast.success("Sustitución eliminada"); refetch(); },
    onError: () => toast.error("Error al eliminar"),
  });

  const filteredList = (substitutionsList ?? []).filter(s => {
    const matchesCategory = filterCategory === "all" || s.category === filterCategory;
    return matchesCategory;
  });

  const handleSave = () => {
    if (!form.originalFood.trim()) return;
    const validSubstitutes = substitutes.filter(s => s.name.trim());
    if (validSubstitutes.length === 0) {
      toast.error("Añade al menos una sustitución");
      return;
    }
    addSubstitutionMutation.mutate({
      originalFood: form.originalFood.trim(),
      originalAmount: form.originalAmount.trim() || undefined,
      substitutes: JSON.stringify(validSubstitutes),
      category: form.category,
      notes: form.notes.trim() || undefined,
    });
  };

  const parseSubstitutes = (substitutesJson: string): SubstituteItem[] => {
    try {
      const parsed = JSON.parse(substitutesJson);
      if (Array.isArray(parsed)) return parsed;
      // Fallback: si es un string simple, convertirlo
      return [{ name: substitutesJson, amount: "", notes: "" }];
    } catch {
      return [{ name: substitutesJson, amount: "", notes: "" }];
    }
  };

  if (!user) return null;

  return (
    <AppLayout showBack>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">🔄 Banco de Sustituciones</h1>
            <p className="text-sm text-muted-foreground mt-1">Define alternativas equivalentes para alimentos en los menús de tus pacientes</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            + Nueva sustitución
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <Input
            placeholder="Buscar alimento..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de sustituciones */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-2xl border border-dashed border-border">
            <div className="text-5xl mb-3">🔄</div>
            <p className="text-muted-foreground font-medium text-lg">Sin sustituciones definidas</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
              Crea un banco de alternativas para facilitar la adaptación de menús cuando un paciente no puede consumir ciertos alimentos.
            </p>
            <Button onClick={() => setShowModal(true)} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
              Crear primera sustitución
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map(sub => {
              const catInfo = CATEGORY_LABELS[sub.category ?? "general"] ?? CATEGORY_LABELS.general;
              const parsedSubs = parseSubstitutes(sub.substitutes);

              return (
                <div key={sub.id} className="bg-background rounded-2xl border border-border p-4 hover:shadow-sm transition-shadow group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-semibold text-foreground text-base">{sub.originalFood}</span>
                        {sub.originalAmount && (
                          <span className="text-sm text-muted-foreground">({sub.originalAmount})</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>
                          {catInfo.icon} {catInfo.label}
                        </span>
                      </div>

                      {/* Sustituciones */}
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground/70 text-sm mt-0.5 flex-shrink-0">→</span>
                        <div className="flex flex-wrap gap-2">
                          {parsedSubs.map((s, i) => (
                            <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl">
                              <span className="text-sm font-medium text-green-800">{s.name}</span>
                              {s.amount && <span className="text-xs text-green-600">({s.amount})</span>}
                              {s.notes && <span className="text-xs text-green-500 italic">· {s.notes}</span>}
                            </div>
                          ))}
                        </div>
                      </div>

                      {sub.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">💡 {sub.notes}</p>
                      )}
                    </div>

                    <button
                      onClick={() => { if (confirm("¿Eliminar esta sustitución?")) deleteSubstitutionMutation.mutate({ substitutionId: sub.id }); }}
                      className="text-muted-foreground/70 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 text-sm flex-shrink-0"
                      title="Eliminar"
                    >🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Nueva sustitución */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔄 Nueva sustitución de alimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Alimento original *</Label>
                <Input
                  placeholder="Ej: Leche de vaca"
                  value={form.originalFood}
                  onChange={e => setForm(prev => ({ ...prev, originalFood: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cantidad de referencia</Label>
                <Input
                  placeholder="Ej: 200 ml, 1 vaso"
                  value={form.originalAmount}
                  onChange={e => setForm(prev => ({ ...prev, originalAmount: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sustituciones */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Alternativas equivalentes *</Label>
                <button
                  onClick={() => setSubstitutes(prev => [...prev, { name: "", amount: "", notes: "" }])}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  + Añadir alternativa
                </button>
              </div>
              <div className="space-y-2">
                {substitutes.map((sub, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <Input
                          placeholder={`Alternativa ${i + 1}`}
                          value={sub.name}
                          onChange={e => setSubstitutes(prev => prev.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Cantidad"
                          value={sub.amount}
                          onChange={e => setSubstitutes(prev => prev.map((s, idx) => idx === i ? { ...s, amount: e.target.value } : s))}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Nota (opcional)"
                          value={sub.notes}
                          onChange={e => setSubstitutes(prev => prev.map((s, idx) => idx === i ? { ...s, notes: e.target.value } : s))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    {substitutes.length > 1 && (
                      <button
                        onClick={() => setSubstitutes(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground/70 hover:text-red-500 transition-colors mt-1 text-sm"
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">Nombre · Cantidad equivalente · Nota (ej: "sin lactosa")</p>
            </div>

            <div>
              <Label>Notas adicionales (opcional)</Label>
              <Textarea
                placeholder="Contexto clínico, cuándo usar esta sustitución..."
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1" rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={!form.originalFood.trim() || addSubstitutionMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {addSubstitutionMutation.isPending ? "Guardando..." : "Guardar sustitución"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
