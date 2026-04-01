import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOALS = [
  { id: undefined, label: "Todos", emoji: "🍽️" },
  { id: "perdida_peso", label: "Pérdida de peso", emoji: "⚖️" },
  { id: "ganancia_muscular", label: "Ganancia muscular", emoji: "💪" },
  { id: "tonificacion", label: "Tonificación", emoji: "🏋️" },
  { id: "perdida_grasa", label: "Pérdida de grasa", emoji: "🔥" },
  { id: "mantenimiento", label: "Mantenimiento", emoji: "⚡" },
  { id: "bienestar", label: "Bienestar", emoji: "🌿" },
  { id: "vegano", label: "Vegano", emoji: "🥗" },
] as const;

const DIFFICULTIES = [
  { id: undefined, label: "Todos" },
  { id: "facil", label: "Fácil" },
  { id: "medio", label: "Medio" },
  { id: "dificil", label: "Difícil" },
] as const;

const GOAL_COLORS: Record<string, string> = {
  perdida_peso: "bg-blue-100 text-blue-800",
  ganancia_muscular: "bg-red-100 text-red-800",
  tonificacion: "bg-purple-100 text-purple-800",
  perdida_grasa: "bg-orange-100 text-orange-800",
  mantenimiento: "bg-green-100 text-green-800",
  bienestar: "bg-teal-100 text-teal-800",
  vegano: "bg-lime-100 text-lime-800",
};

const GOAL_LABELS: Record<string, string> = {
  perdida_peso: "Pérdida de peso",
  ganancia_muscular: "Ganancia muscular",
  tonificacion: "Tonificación",
  perdida_grasa: "Pérdida de grasa",
  mantenimiento: "Mantenimiento",
  bienestar: "Bienestar",
  vegano: "Vegano",
};

const DIFF_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
};

const SUPERMARKETS = [
  { id: "general", label: "General", emoji: "🛒" },
  { id: "mercadona", label: "Mercadona", emoji: "🟠" },
  { id: "lidl", label: "Lidl", emoji: "🔵" },
  { id: "carrefour", label: "Carrefour", emoji: "🔴" },
  { id: "alcampo", label: "Alcampo", emoji: "🟡" },
  { id: "dia", label: "Día", emoji: "🟢" },
  { id: "el_corte_ingles", label: "El Corte Inglés", emoji: "🟤" },
];

// ─── Save Dialog ──────────────────────────────────────────────────────────────

function SaveMenuDialog({
  menu,
  open,
  onClose,
}: {
  menu: { id: number; name: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  const [persons, setPersons] = useState(1);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const utils = trpc.useUtils();

  const saveMutation = trpc.menus.saveFromLibrary.useMutation({
    onSuccess: (data) => {
      toast.success("¡Menú guardado! Ya puedes verlo en tu planificador.");
      utils.menus.list.invalidate();
      onClose();
    },
    onError: (err) => {
      toast.error("Error al guardar el menú: " + err.message);
    },
  });

  if (!menu) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Guardar menú</DialogTitle>
          <DialogDescription>
            Guarda <strong>{menu.name}</strong> en tu planificador personal.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="persons">¿Para cuántas personas?</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPersons(Math.max(1, persons - 1))}
                disabled={persons <= 1}
              >
                −
              </Button>
              <span className="text-2xl font-bold w-8 text-center">{persons}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPersons(Math.min(20, persons + 1))}
                disabled={persons >= 20}
              >
                +
              </Button>
              <span className="text-sm text-muted-foreground ml-1">
                {persons === 1 ? "persona" : "personas"}
              </span>
            </div>
          </div>
          <div>
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-[#FF6B35] hover:bg-[#e55a25] text-white"
              onClick={() =>
                saveMutation.mutate({ menuId: menu.id, persons, startDate })
              }
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Guardando..." : "Guardar menú"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Menu Detail Dialog ───────────────────────────────────────────────────────

function MenuDetailDialog({
  menuId,
  open,
  onClose,
  onSave,
}: {
  menuId: number | null;
  open: boolean;
  onClose: () => void;
  onSave: (menu: { id: number; name: string }) => void;
}) {
  const { data: menu, isLoading } = trpc.menus.libraryDetail.useQuery(
    { id: menuId! },
    { enabled: !!menuId && open }
  );

  if (!open || !menuId) return null;

  // Group day parts by day number
  const dayGroups: Record<number, any[]> = {};
  if (menu?.dayParts) {
    for (const dp of menu.dayParts) {
      const day = dp.dayNumber ?? 1;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(dp);
    }
  }

  const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{menu?.name || "Cargando..."}</DialogTitle>
          {menu && (
            <div className="flex gap-2 flex-wrap mt-1">
              {menu.goal && (
                <Badge className={GOAL_COLORS[menu.goal] || "bg-gray-100 text-gray-800"}>
                  {GOAL_LABELS[menu.goal] || menu.goal}
                </Badge>
              )}
              {menu.dailyCalories && (
                <Badge variant="outline">🔥 {menu.dailyCalories} kcal/día</Badge>
              )}
              {menu.difficulty && (
                <Badge variant="outline">📊 {DIFF_LABELS[menu.difficulty] || menu.difficulty}</Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando menú...</div>
        ) : menu ? (
          <div className="space-y-4 pt-2">
            {Object.entries(dayGroups).slice(0, 7).map(([dayNum, dayParts]) => (
              <div key={dayNum} className="border rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 text-[#FF6B35]">
                  {DAY_NAMES[parseInt(dayNum) - 1] || `Día ${dayNum}`}
                </h4>
                <div className="space-y-1">
                  {dayParts.map((dp) => (
                    <div key={dp.id}>
                      {dp.recipes.map((r: any) => (
                        <div key={r.id} className="flex items-center gap-2 text-sm py-1">
                          <span className="text-muted-foreground w-24 text-xs">
                            {dp.name || "Comida"}
                          </span>
                          <span className="font-medium flex-1">{r.name}</span>
                          {r.caloriesPerServing && (
                            <span className="text-xs text-muted-foreground">
                              {r.caloriesPerServing} kcal
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button
              className="w-full bg-[#FF6B35] hover:bg-[#e55a25] text-white"
              onClick={() => {
                onClose();
                onSave({ id: menu.id, name: menu.name });
              }}
            >
              Guardar este menú
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MenuLibrary() {
  const { user } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<string | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [detailMenuId, setDetailMenuId] = useState<number | null>(null);
  const [saveMenu, setSaveMenu] = useState<{ id: number; name: string } | null>(null);

  const { data: menus = [], isLoading } = trpc.menus.library.useQuery({
    goal: selectedGoal as any,
    difficulty: selectedDifficulty as any,
    limit: 50,
  });

  const filtered = menus.filter((m) =>
    search ? m.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-[#FFF8F5]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/menus">
            <button className="text-muted-foreground hover:text-foreground">
              ← Volver
            </button>
          </Link>
          <h1 className="text-xl font-bold">Biblioteca de Menús</h1>
          <span className="ml-auto text-sm text-muted-foreground">{filtered.length} menús</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <Input
          placeholder="Buscar un menú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white"
        />

        {/* Goal filter */}
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Objetivo</p>
          <div className="flex gap-2 flex-wrap">
            {GOALS.map((g) => (
              <button
                key={String(g.id)}
                onClick={() => setSelectedGoal(g.id as any)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  selectedGoal === g.id
                    ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#FF6B35]"
                }`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty filter */}
        <div>
          <p className="text-sm font-medium mb-2 text-muted-foreground">Dificultad</p>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={String(d.id)}
                onClick={() => setSelectedDifficulty(d.id as any)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  selectedDifficulty === d.id
                    ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#FF6B35]"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-3">🍽️</p>
            <p>No se encontraron menús con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((menu) => (
              <div
                key={menu.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color band by goal */}
                <div
                  className={`h-2 ${
                    menu.goal === "perdida_peso"
                      ? "bg-blue-400"
                      : menu.goal === "ganancia_muscular"
                      ? "bg-red-400"
                      : menu.goal === "tonificacion"
                      ? "bg-purple-400"
                      : menu.goal === "perdida_grasa"
                      ? "bg-orange-400"
                      : menu.goal === "mantenimiento"
                      ? "bg-green-400"
                      : menu.goal === "bienestar"
                      ? "bg-teal-400"
                      : menu.goal === "vegano"
                      ? "bg-lime-400"
                      : "bg-[#FF6B35]"
                  }`}
                />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-tight">{menu.name}</h3>
                    {menu.difficulty && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                        {DIFF_LABELS[menu.difficulty] || menu.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {menu.goal && (
                      <Badge className={`text-xs ${GOAL_COLORS[menu.goal] || "bg-gray-100 text-gray-800"}`}>
                        {GOAL_LABELS[menu.goal] || menu.goal}
                      </Badge>
                    )}
                    {menu.dailyCalories && (
                      <span className="text-xs text-muted-foreground">🔥 {menu.dailyCalories} kcal/día</span>
                    )}
                    {menu.dailyMealsCount && (
                      <span className="text-xs text-muted-foreground">🍽️ {menu.dailyMealsCount} comidas/día</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setDetailMenuId(menu.id)}
                    >
                      Ver menú
                    </Button>
                    {user ? (
                      <Button
                        size="sm"
                        className="flex-1 text-xs bg-[#FF6B35] hover:bg-[#e55a25] text-white"
                        onClick={() => setSaveMenu({ id: menu.id, name: menu.name })}
                      >
                        Guardar
                      </Button>
                    ) : (
                      <Link href="/login">
                        <Button size="sm" className="flex-1 text-xs bg-[#FF6B35] hover:bg-[#e55a25] text-white">
                          Guardar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Los menús son orientativos y no constituyen recomendaciones profesionales. Consulta con un nutricionista antes de seguir cualquier plan alimentario.
        </p>
      </div>

      {/* Dialogs */}
      <MenuDetailDialog
        menuId={detailMenuId}
        open={!!detailMenuId}
        onClose={() => setDetailMenuId(null)}
        onSave={(menu) => setSaveMenu(menu)}
      />
      <SaveMenuDialog
        menu={saveMenu}
        open={!!saveMenu}
        onClose={() => setSaveMenu(null)}
      />
    </div>
  );
}
