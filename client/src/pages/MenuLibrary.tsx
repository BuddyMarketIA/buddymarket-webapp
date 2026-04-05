import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
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

const GOAL_GRADIENTS: Record<string, string> = {
  perdida_peso: "from-blue-500 to-cyan-400",
  ganancia_muscular: "from-red-500 to-orange-400",
  tonificacion: "from-purple-500 to-pink-400",
  perdida_grasa: "from-orange-500 to-yellow-400",
  mantenimiento: "from-green-500 to-emerald-400",
  bienestar: "from-teal-500 to-green-400",
  vegano: "from-lime-500 to-green-400",
};

const GOAL_IMAGES: Record<string, string> = {
  perdida_peso: "https://d2xsxph8kpxj0f.cloudfront.net/webdev/buddymarket-webapp/assets/meal-prep-1743693022.jpg",
  ganancia_muscular: "https://d2xsxph8kpxj0f.cloudfront.net/webdev/buddymarket-webapp/assets/meal-prep-1743693022.jpg",
  tonificacion: "https://d2xsxph8kpxj0f.cloudfront.net/webdev/buddymarket-webapp/assets/meal-prep-1743693022.jpg",
  perdida_grasa: "https://d2xsxph8kpxj0f.cloudfront.net/webdev/buddymarket-webapp/assets/meal-prep-1743693022.jpg",
  mantenimiento: "https://d2xsxph8kpxj0f.cloudfront.net/webdev/buddymarket-webapp/assets/vegetables-1743693022.jpg",
  bienestar: "https://d2xsxph8kpxj0f.cloudfront.net/webdev/buddymarket-webapp/assets/vegetables-1743693022.jpg",
  vegano: "https://d2xsxph8kpxj0f.cloudfront.net/webdev/buddymarket-webapp/assets/vegetables-1743693022.jpg",
};

const DIFF_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
};

// ─── Menu Card ────────────────────────────────────────────────────────────────

function MenuCard({
  menu,
  isRecommended,
  user,
  onDetail,
  onSave,
}: {
  menu: any;
  isRecommended?: boolean;
  user: any;
  onDetail: (id: number) => void;
  onSave: (menu: { id: number; name: string }) => void;
}) {
  const gradient = GOAL_GRADIENTS[menu.goal] || "from-gray-500 to-gray-400";
  const image = GOAL_IMAGES[menu.goal];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
      {/* Visual header */}
      <div className={`relative h-36 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {image && (
          <img
            src={image}
            alt={menu.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-300"
          />
        )}
        {/* Overlay content */}
        <div className="absolute inset-0 p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            {isRecommended && (
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/30">
                ✨ Para ti
              </span>
            )}
            {menu.difficulty && (
              <span className="ml-auto bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                {DIFF_LABELS[menu.difficulty] || menu.difficulty}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-tight drop-shadow-sm line-clamp-2">
              {menu.name}
            </h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {menu.goal && (
            <Badge className={`text-xs ${GOAL_COLORS[menu.goal] || "bg-gray-100 text-gray-800"}`}>
              {GOAL_LABELS[menu.goal] || menu.goal}
            </Badge>
          )}
          {menu.dailyCalories && (
            <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-0.5 rounded-full">
              🔥 {menu.dailyCalories} kcal
            </span>
          )}
          {menu.dailyMealsCount && (
            <span className="text-xs text-muted-foreground bg-gray-50 px-2 py-0.5 rounded-full">
              🍽️ {menu.dailyMealsCount} comidas
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-9"
            onClick={() => onDetail(menu.id)}
          >
            Ver menú
          </Button>
          {user ? (
            <Button
              size="sm"
              className="flex-1 text-xs h-9 bg-[#FF6B35] hover:bg-[#e55a25] text-white"
              onClick={() => onSave({ id: menu.id, name: menu.name })}
            >
              Usar menú
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" className="flex-1 text-xs h-9 bg-[#FF6B35] hover:bg-[#e55a25] text-white">
                Usar menú
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onExplore, onCreateAI }: { onExplore: () => void; onCreateAI: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <span className="text-4xl">🍽️</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Actualmente no hay menús adaptados para ti
      </h3>
      <p className="text-gray-500 text-sm max-w-xs mb-8 leading-relaxed">
        No encontramos menús que coincidan exactamente con tu perfil nutricional y preferencias.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          className="w-full bg-[#FF6B35] hover:bg-[#e55a25] text-white h-12 rounded-xl font-semibold"
          onClick={onCreateAI}
        >
          🤖 Crear menú con IA según mis preferencias
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl font-semibold border-gray-200"
          onClick={onExplore}
        >
          🔍 Explorar todos los menús disponibles
        </Button>
      </div>
    </div>
  );
}

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
  const [, navigate] = useLocation();

  const saveMutation = trpc.menus.saveFromLibrary.useMutation({
    onSuccess: () => {
      toast.success("¡Menú activado! Redirigiendo a tu menú en curso...");
      utils.menus.list.invalidate();
      utils.menus.getActive.invalidate();
      onClose();
      setTimeout(() => navigate("/app/active-menu"), 500);
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
          <DialogTitle>Usar este menú</DialogTitle>
          <DialogDescription>
            Activa <strong>{menu.name}</strong> como tu menú en curso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label htmlFor="persons">¿Para cuántas personas?</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" size="sm" onClick={() => setPersons(Math.max(1, persons - 1))} disabled={persons <= 1}>−</Button>
              <span className="text-2xl font-bold w-8 text-center">{persons}</span>
              <Button variant="outline" size="sm" onClick={() => setPersons(Math.min(20, persons + 1))} disabled={persons >= 20}>+</Button>
              <span className="text-sm text-muted-foreground ml-1">{persons === 1 ? "persona" : "personas"}</span>
            </div>
          </div>
          <div>
            <Label htmlFor="startDate">Fecha de inicio</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1 bg-[#FF6B35] hover:bg-[#e55a25] text-white"
              onClick={() => saveMutation.mutate({ menuId: menu.id, persons, startDate })}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Activando..." : "Activar menú"}
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
              {menu.goal && <Badge className={GOAL_COLORS[menu.goal] || "bg-gray-100 text-gray-800"}>{GOAL_LABELS[menu.goal] || menu.goal}</Badge>}
              {menu.dailyCalories && <Badge variant="outline">🔥 {menu.dailyCalories} kcal/día</Badge>}
              {menu.difficulty && <Badge variant="outline">📊 {DIFF_LABELS[menu.difficulty] || menu.difficulty}</Badge>}
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
                          <span className="text-muted-foreground w-24 text-xs">{dp.name || "Comida"}</span>
                          <span className="font-medium flex-1">{r.name}</span>
                          {r.caloriesPerServing && <span className="text-xs text-muted-foreground">{r.caloriesPerServing} kcal</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button
              className="w-full bg-[#FF6B35] hover:bg-[#e55a25] text-white"
              onClick={() => { onClose(); onSave({ id: menu.id, name: menu.name }); }}
            >
              Usar este menú
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
  const [showAll, setShowAll] = useState(false);
  const [, navigate] = useLocation();

  // Recommended (personalized, only if logged in)
  const { data: recommendedData } = trpc.menus.recommended.useQuery(undefined, {
    enabled: !!user,
  });

  // All menus (for explore mode)
  const { data: allMenus = [], isLoading } = trpc.menus.library.useQuery({
    goal: selectedGoal as any,
    difficulty: selectedDifficulty as any,
    limit: 50,
  });

  const filtered = allMenus.filter((m) =>
    search ? m.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const recommendedMenus = recommendedData?.recommended ?? [];
  const totalMenus = recommendedData?.totalMenus ?? allMenus.length;
  const hasNoMenusForProfile = user && !isLoading && totalMenus === 0;
  const hasMenusButNoneRecommended = user && !isLoading && totalMenus > 0 && recommendedMenus.length === 0;

  return (
    <div className="min-h-screen bg-[#FFF8F5]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/app/menus">
            <button className="text-muted-foreground hover:text-foreground">← Volver</button>
          </Link>
          <h1 className="text-xl font-bold">Biblioteca de Menús</h1>
          <span className="ml-auto text-sm text-muted-foreground">{totalMenus} menús</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ── EMPTY STATE: no menus at all ── */}
        {hasNoMenusForProfile && (
          <EmptyState
            onExplore={() => setShowAll(true)}
            onCreateAI={() => navigate("/app/ai-menu")}
          />
        )}

        {/* ── PERSONALIZED SECTION (logged in) ── */}
        {user && !showAll && recommendedMenus.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">✨ Recomendados para ti</h2>
                <p className="text-sm text-gray-500">Basados en tu objetivo y preferencias</p>
              </div>
              <button
                className="text-sm text-[#FF6B35] font-medium hover:underline"
                onClick={() => setShowAll(true)}
              >
                Ver todos →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendedMenus.map((menu: any) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  isRecommended
                  user={user}
                  onDetail={setDetailMenuId}
                  onSave={setSaveMenu}
                />
              ))}
            </div>

            {/* Prompt to explore more */}
            <div className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">¿Quieres un menú 100% personalizado?</p>
                <p className="text-xs text-gray-500 mt-0.5">Crea tu menú con IA basado en tus restricciones y objetivos nutricionales</p>
              </div>
              <Button
                className="bg-[#FF6B35] hover:bg-[#e55a25] text-white rounded-xl shrink-0"
                onClick={() => navigate("/app/ai-menu")}
              >
                🤖 Crear con IA
              </Button>
            </div>
          </section>
        )}

        {/* ── NO RECOMMENDATIONS BUT MENUS EXIST ── */}
        {hasMenusButNoneRecommended && !showAll && (
          <div className="text-center py-10 px-6">
            <div className="text-4xl mb-3">🍽️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Actualmente no hay menús adaptados para ti
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
              No encontramos menús que coincidan con tu perfil. ¿Quieres explorar todos o crear uno con IA?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="bg-[#FF6B35] hover:bg-[#e55a25] text-white rounded-xl"
                onClick={() => navigate("/app/ai-menu")}
              >
                🤖 Crear con IA según mis preferencias
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setShowAll(true)}>
                🔍 Explorar todos los menús
              </Button>
            </div>
          </div>
        )}

        {/* ── ALL MENUS (explore mode or not logged in) ── */}
        {(showAll || !user) && (
          <section>
            {showAll && (
              <div className="flex items-center gap-3 mb-4">
                <button
                  className="text-sm text-[#FF6B35] font-medium hover:underline"
                  onClick={() => setShowAll(false)}
                >
                  ← Volver a mis recomendados
                </button>
                <h2 className="text-lg font-bold text-gray-900">Todos los menús</h2>
              </div>
            )}

            {/* Search */}
            <Input
              placeholder="Buscar un menú..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white mb-4"
            />

            {/* Goal filter */}
            <div className="mb-3">
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
            <div className="mb-6">
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
                  <div key={i} className="bg-white rounded-2xl h-52 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-3">🍽️</p>
                <p>No se encontraron menús con estos filtros.</p>
                {user && (
                  <Button
                    className="mt-4 bg-[#FF6B35] hover:bg-[#e55a25] text-white rounded-xl"
                    onClick={() => navigate("/app/ai-menu")}
                  >
                    🤖 Crear menú con IA
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((menu) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    user={user}
                    onDetail={setDetailMenuId}
                    onSave={setSaveMenu}
                  />
                ))}
              </div>
            )}
          </section>
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
        onSave={(menu) => { setDetailMenuId(null); setSaveMenu(menu); }}
      />
      <SaveMenuDialog
        menu={saveMenu}
        open={!!saveMenu}
        onClose={() => setSaveMenu(null)}
      />
    </div>
  );
}
