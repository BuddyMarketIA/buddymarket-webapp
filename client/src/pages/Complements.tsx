import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/sonner-a11y-shim";
import { Search, Plus, Trash2, ChevronLeft, PlusCircle, Pencil } from "lucide-react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = { id: string; label: string; emoji: string };

const CATEGORIES: Category[] = [
  { id: "all", label: "Todos", emoji: "🍽️" },
  { id: "mis_complementos", label: "Mis complementos", emoji: "⭐" },
  { id: "bebida_caliente", label: "Bebidas calientes", emoji: "☕" },
  { id: "bebida_fria", label: "Bebidas frías", emoji: "🥤" },
  { id: "lacteo", label: "Lácteos", emoji: "🥛" },
  { id: "proteina", label: "Proteínas", emoji: "🥩" },
  { id: "fruta", label: "Frutas", emoji: "🍎" },
  { id: "snack_saludable", label: "Snacks", emoji: "🌰" },
  { id: "suplemento", label: "Suplementos", emoji: "💊" },
  { id: "otro", label: "Otros", emoji: "🍴" },
];

const MEAL_TYPES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "media_manana", label: "Media mañana" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "otro", label: "Otro" },
];

const CATEGORY_OPTIONS = [
  { value: "bebida_caliente", label: "☕ Bebida caliente" },
  { value: "bebida_fria", label: "🥤 Bebida fría" },
  { value: "lacteo", label: "🥛 Lácteo" },
  { value: "proteina", label: "🥩 Proteína" },
  { value: "fruta", label: "🍎 Fruta" },
  { value: "snack_saludable", label: "🌰 Snack saludable" },
  { value: "suplemento", label: "💊 Suplemento" },
  { value: "otro", label: "🍴 Otro" },
];

type Complement = {
  id: number;
  name: string;
  nameEs?: string | null;
  category: string;
  emoji?: string | null;
  servingSize: number;
  servingUnit: string;
  servingLabel?: string | null;
  calories?: number | null;
  proteins?: number | null;
  carbs?: number | null;
  fats?: number | null;
  fiber?: number | null;
  caffeine?: number | null;
  userId?: number | null;
  isPublic?: boolean | null;
};

// ─── Log Dialog ───────────────────────────────────────────────────────────────
function LogDialog({ complement, onClose }: { complement: Complement; onClose: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState<string>("otro");
  const utils = trpc.useUtils();

  const logMutation = trpc.complements.log.useMutation({
    onSuccess: () => {
      toast.success(`${complement.nameEs ?? complement.name} añadido al diario`);
      utils.complements.getLogs.invalidate();
      onClose();
    },
    onError: () => toast.error("No se pudo registrar"),
  });

  const scaledCalories = complement.calories ? Math.round(complement.calories * quantity) : null;
  const scaledProteins = complement.proteins ? (complement.proteins * quantity).toFixed(1) : null;
  const scaledCarbs = complement.carbs ? (complement.carbs * quantity).toFixed(1) : null;
  const scaledFats = complement.fats ? (complement.fats * quantity).toFixed(1) : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <span className="text-2xl">{complement.emoji ?? "🍽️"}</span>
              {complement.nameEs ?? complement.name}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Porción base: {complement.servingLabel ?? `${complement.servingSize}${complement.servingUnit}`}
          </p>
          <div>
            <Label className="mb-1 block">Cantidad (porciones)</Label>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => Math.max(0.5, q - 0.5))}>−</Button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(q => q + 0.5)}>+</Button>
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Momento del día</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {scaledCalories !== null && (
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
              <p className="text-xs font-semibold text-orange-600 mb-2">Valores ({quantity} porción{quantity !== 1 ? "es" : ""})</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-base font-bold text-orange-500">{scaledCalories}</p><p className="text-[10px] text-muted-foreground">kcal</p></div>
                {scaledProteins && <div><p className="text-base font-bold">{scaledProteins}g</p><p className="text-[10px] text-muted-foreground">Prot.</p></div>}
                {scaledCarbs && <div><p className="text-base font-bold">{scaledCarbs}g</p><p className="text-[10px] text-muted-foreground">Carbs</p></div>}
                {scaledFats && <div><p className="text-base font-bold">{scaledFats}g</p><p className="text-[10px] text-muted-foreground">Grasas</p></div>}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => logMutation.mutate({ complementId: complement.id, quantity, mealType: mealType as any })}
            disabled={logMutation.isPending}
          >
            {logMutation.isPending ? "Guardando..." : "Añadir al diario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Complement Dialog ─────────────────────────────────────────────────
function CreateComplementDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: "",
    category: "otro",
    emoji: "",
    servingSize: "100",
    servingUnit: "g",
    servingLabel: "",
    calories: "",
    proteins: "",
    carbs: "",
    fats: "",
    fiber: "",
  });

  const createMutation = trpc.complements.create.useMutation({
    onSuccess: () => {
      toast.success("Complemento creado correctamente");
      utils.complements.list.invalidate();
      onClose();
    },
    onError: (err) => toast.error("Error al crear: " + err.message),
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    createMutation.mutate({
      name: form.name.trim(),
      nameEs: form.name.trim(),
      category: form.category as any,
      emoji: form.emoji || undefined,
      servingSize: Number(form.servingSize) || 100,
      servingUnit: form.servingUnit || "g",
      servingLabel: form.servingLabel || undefined,
      calories: form.calories ? Number(form.calories) : undefined,
      proteins: form.proteins ? Number(form.proteins) : undefined,
      carbs: form.carbs ? Number(form.carbs) : undefined,
      fats: form.fats ? Number(form.fats) : undefined,
      fiber: form.fiber ? Number(form.fiber) : undefined,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-orange-500" />
            Crear mi complemento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name + Emoji */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="mb-1 block">Nombre *</Label>
              <Input placeholder="Ej: Batido de vainilla" value={form.name} onChange={e => set("name", e.target.value)} />
            </div>
            <div className="w-20">
              <Label className="mb-1 block">Emoji</Label>
              <Input placeholder="🥤" value={form.emoji} onChange={e => set("emoji", e.target.value)} className="text-center text-xl" maxLength={4} />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="mb-1 block">Categoría</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Serving */}
          <div>
            <Label className="mb-1 block">Porción</Label>
            <div className="flex gap-2">
              <Input type="number" placeholder="100" value={form.servingSize} onChange={e => set("servingSize", e.target.value)} className="w-24" />
              <Select value={form.servingUnit} onValueChange={v => set("servingUnit", v)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="unidad">unidad</SelectItem>
                  <SelectItem value="taza">taza</SelectItem>
                  <SelectItem value="cucharada">cucharada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Ej: 1 vaso (250ml)" value={form.servingLabel} onChange={e => set("servingLabel", e.target.value)} className="mt-2" />
            <p className="text-[11px] text-muted-foreground mt-1">Descripción de la porción (opcional)</p>
          </div>

          {/* Nutritional values */}
          <div>
            <Label className="mb-2 block">Valores nutricionales (por porción)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Calorías (kcal)</Label>
                <Input type="number" placeholder="0" value={form.calories} onChange={e => set("calories", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Proteínas (g)</Label>
                <Input type="number" placeholder="0" value={form.proteins} onChange={e => set("proteins", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Carbohidratos (g)</Label>
                <Input type="number" placeholder="0" value={form.carbs} onChange={e => set("carbs", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Grasas (g)</Label>
                <Input type="number" placeholder="0" value={form.fats} onChange={e => set("fats", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Fibra (g)</Label>
                <Input type="number" placeholder="0" value={form.fiber} onChange={e => set("fiber", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creando..." : "Crear complemento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Complement Card ──────────────────────────────────────────────────────────
function ComplementCard({
  complement,
  onLog,
  onDelete,
  isOwn,
}: {
  complement: Complement;
  onLog: () => void;
  onDelete?: () => void;
  isOwn?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
        {complement.emoji ?? "🍽️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm text-gray-900 truncate">{complement.nameEs ?? complement.name}</p>
          {isOwn && (
            <span className="flex-shrink-0 text-[10px] bg-orange-100 text-orange-600 font-medium px-1.5 py-0.5 rounded-full">Mío</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{complement.servingLabel ?? `${complement.servingSize}${complement.servingUnit}`}</p>
        {complement.calories != null && (
          <p className="text-xs font-medium text-orange-500 mt-0.5">{complement.calories} kcal</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isOwn && onDelete && (
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full bg-orange-50 hover:bg-orange-100 text-orange-500 flex-shrink-0"
          onClick={onLog}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Today's Log ──────────────────────────────────────────────────────────────
function TodaysLog() {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { data: logs, isLoading } = trpc.complements.getLogs.useQuery({ date: today });
  const utils = trpc.useUtils();

  const deleteMutation = trpc.complements.deleteLog.useMutation({
    onSuccess: () => utils.complements.getLogs.invalidate(),
    onError: () => toast.error("No se pudo eliminar"),
  });

  if (isLoading || !logs || logs.length === 0) return null;

  const totalCalories = logs.reduce((sum, l) => sum + ((l.complement.calories ?? 0) * l.log.quantity), 0);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-900">Registrado hoy</h2>
        <span className="text-sm font-medium text-orange-500">{Math.round(totalCalories)} kcal</span>
      </div>
      <div className="space-y-2">
        {logs.map(({ log, complement }) => (
          <div key={log.id} className="bg-orange-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">{complement.emoji ?? "🍽️"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{complement.nameEs ?? complement.name}</p>
              <p className="text-xs text-muted-foreground">
                {log.quantity} porción{log.quantity !== 1 ? "es" : ""} · {MEAL_TYPES.find(m => m.value === log.mealType)?.label ?? log.mealType}
              </p>
            </div>
            {complement.calories != null && (
              <span className="text-xs font-semibold text-orange-500">{Math.round(complement.calories * log.quantity)} kcal</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500 h-7 w-7"
              onClick={() => deleteMutation.mutate({ id: log.id })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Complements() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedComplement, setSelectedComplement] = useState<Complement | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: allComplements, isLoading } = trpc.complements.list.useQuery({ limit: 200 });

  const deleteMutation = trpc.complements.delete.useMutation({
    onSuccess: () => {
      toast.success("Complemento eliminado");
      utils.complements.list.invalidate();
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  const filtered = useMemo(() => {
    if (!allComplements) return [];
    return allComplements.filter(c => {
      const matchesSearch = !search
        || c.name.toLowerCase().includes(search.toLowerCase())
        || (c.nameEs ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "all"
        || (activeCategory === "mis_complementos" ? c.userId === user?.id && !c.isPublic : c.category === activeCategory);
      return matchesSearch && matchesCategory;
    });
  }, [allComplements, search, activeCategory, user?.id]);

  const handleDelete = (c: Complement) => {
    if (!window.confirm(`¿Eliminar "${c.nameEs ?? c.name}"?`)) return;
    deleteMutation.mutate({ id: c.id });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/app/meal-log">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold text-lg text-gray-900">Complementos</h1>
              <p className="text-xs text-muted-foreground">Café, té, snacks y más</p>
            </div>
            {user && (
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl gap-1.5 text-sm"
                size="sm"
              >
                <PlusCircle className="w-4 h-4" />
                Crear
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar complemento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-gray-200"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Today's log */}
        {user && <TodaysLog />}

        {/* Create CTA for empty "Mis complementos" */}
        {activeCategory === "mis_complementos" && filtered.length === 0 && !isLoading && user && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Pencil className="w-8 h-8 text-orange-400" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">Aún no tienes complementos propios</p>
            <p className="text-sm text-muted-foreground mb-4">Crea complementos personalizados con tus datos nutricionales exactos</p>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Crear mi primer complemento
            </Button>
          </div>
        )}

        {/* Results header */}
        {!(activeCategory === "mis_complementos" && filtered.length === 0 && !isLoading) && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">
              {activeCategory === "all" ? "Todos los complementos" : CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
            <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map(c => (
              <ComplementCard
                key={c.id}
                complement={c}
                onLog={() => setSelectedComplement(c)}
                isOwn={c.userId === user?.id && !c.isPublic}
                onDelete={() => handleDelete(c)}
              />
            ))}
          </div>
        ) : activeCategory !== "mis_complementos" ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 font-medium">No se encontraron complementos</p>
            <p className="text-sm text-muted-foreground mt-1">Prueba con otro término de búsqueda</p>
          </div>
        ) : null}
      </div>

      {/* Log dialog */}
      {selectedComplement && (
        <LogDialog complement={selectedComplement} onClose={() => setSelectedComplement(null)} />
      )}

      {/* Create dialog */}
      {showCreate && (
        <CreateComplementDialog onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
