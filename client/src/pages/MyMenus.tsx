import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuOrganizer {
  id: number;
  name: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  objective?: string | null;
  isActive?: boolean;
  isSeeded?: boolean;
  dailyMealsCount?: number | null;
  createdAt?: string | Date | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

const OBJECTIVE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  perdida_peso:      { label: "Pérdida de peso",    emoji: "🔥", color: "bg-red-100 text-red-700 border-red-200" },
  ganancia_muscular: { label: "Ganancia muscular",  emoji: "💪", color: "bg-blue-100 text-blue-700 border-blue-200" },
  tonificacion:      { label: "Tonificación",       emoji: "⚡", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  perdida_grasa:     { label: "Pérdida de grasa",   emoji: "🎯", color: "bg-orange-100 text-orange-700 border-orange-200" },
  mantenimiento:     { label: "Mantenimiento",      emoji: "⚖️", color: "bg-gray-100 text-gray-700 border-gray-200" },
  definicion:        { label: "Definición",         emoji: "🏆", color: "bg-purple-100 text-purple-700 border-purple-200" },
  salud:             { label: "Salud general",      emoji: "💚", color: "bg-green-100 text-green-700 border-green-200" },
  vegano:            { label: "Vegano",             emoji: "🌱", color: "bg-green-100 text-green-700 border-green-200" },
  bienestar:         { label: "Bienestar",          emoji: "😊", color: "bg-teal-100 text-teal-700 border-teal-200" },
};

// ─── Rename Modal ─────────────────────────────────────────────────────────────
function RenameModal({
  menu,
  onClose,
  onRenamed,
}: {
  menu: MenuOrganizer;
  onClose: () => void;
  onRenamed: () => void;
}) {
  const [name, setName] = useState(menu.name);
  const renameMutation = trpc.menus.rename.useMutation({
    onSuccess: () => {
      toast.success("Nombre actualizado");
      onRenamed();
      onClose();
    },
    onError: () => toast.error("Error al renombrar el menú"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-background rounded-t-2xl w-full max-w-[480px] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Renombrar menú</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          autoFocus
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={() => renameMutation.mutate({ id: menu.id, name })}
            disabled={!name.trim() || renameMutation.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {renameMutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Set Start Date Modal ─────────────────────────────────────────────────────
function SetStartDateModal({
  menu,
  onClose,
  onUpdated,
}: {
  menu: MenuOrganizer;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const updateMutation = trpc.menus.updateStartDate.useMutation({
    onSuccess: () => {
      toast.success("Fecha de inicio actualizada");
      onUpdated();
      onClose();
    },
    onError: () => toast.error("Error al actualizar la fecha"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-background rounded-t-2xl w-full max-w-[480px] p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold">Cambiar fecha de inicio</h3>
        <p className="text-sm text-muted-foreground">
          Todas las comidas del menú se desplazarán a partir de la nueva fecha.
        </p>
        <div>
          <label className="text-sm font-medium mb-2 block">Nueva fecha de inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={() => updateMutation.mutate({ menuId: menu.id, startDate })}
            disabled={!startDate || updateMutation.isPending}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
          >
            {updateMutation.isPending ? "Actualizando..." : "Aplicar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Menu Card ────────────────────────────────────────────────────────────────
function MenuCard({
  menu,
  onRefresh,
}: {
  menu: MenuOrganizer;
  onRefresh: () => void;
}) {
  const [, navigate] = useLocation();
  const [showActions, setShowActions] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showSetDate, setShowSetDate] = useState(false);
  const utils = trpc.useUtils();

  const setActiveMutation = trpc.menus.setActive.useMutation({
    onSuccess: () => {
      toast.success("Menú activado como menú en curso");
      utils.menus.list.invalidate();
      onRefresh();
    },
    onError: () => toast.error("Error al activar el menú"),
  });

  const deleteMutation = trpc.menus.delete.useMutation({
    onSuccess: () => {
      toast.success("Menú eliminado");
      utils.menus.list.invalidate();
      onRefresh();
    },
    onError: () => toast.error("Error al eliminar el menú"),
  });

  const duplicateMutation = trpc.menus.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Menú duplicado", { description: "Puedes encontrarlo en tu lista de menús" });
      utils.menus.list.invalidate();
      onRefresh();
    },
    onError: () => toast.error("Error al duplicar el menú"),
  });

  const objInfo = menu.objective ? OBJECTIVE_LABELS[menu.objective] : null;

  return (
    <>
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm truncate">{menu.name}</h3>
                {menu.isActive && (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs flex-shrink-0">
                    ✓ Activo
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {objInfo && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${objInfo.color}`}>
                    {objInfo.emoji} {objInfo.label}
                  </span>
                )}
                {menu.dailyMealsCount && (
                  <span className="text-xs text-muted-foreground">{menu.dailyMealsCount} comidas/día</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
            >
              ⋯
            </button>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span>📅 {formatDate(menu.startDate)}</span>
            {menu.endDate && <span>→ {formatDate(menu.endDate)}</span>}
          </div>
        </div>

        {/* Actions dropdown */}
        {showActions && (
          <div className="border-t border-border bg-muted/30">
            <div className="grid grid-cols-2 gap-0">
              <button
                onClick={() => { setShowActions(false); navigate(`/app/menus`); }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-muted transition-colors border-r border-border"
              >
                <span>📋</span> Ver planificador
              </button>
              <button
                onClick={() => { setShowActions(false); setShowRename(true); }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-muted transition-colors"
              >
                <span>✏️</span> Renombrar
              </button>
              <button
                onClick={() => { setShowActions(false); setShowSetDate(true); }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-muted transition-colors border-r border-border border-t"
              >
                <span>📅</span> Cambiar fecha
              </button>
              {!menu.isActive && (
                <button
                  onClick={() => { setShowActions(false); setActiveMutation.mutate({ menuId: menu.id }); }}
                  disabled={setActiveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-orange-50 text-orange-600 transition-colors border-t"
                >
                  <span>⚡</span> Activar menú
                </button>
              )}
              {menu.isActive && (
                <button
                  onClick={() => { setShowActions(false); navigate("/app/active-menu"); }}
                  className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-orange-50 text-orange-600 transition-colors border-t"
                >
                  <span>🎯</span> Ver activo
                </button>
              )}
              <button
                onClick={() => {
                  setShowActions(false);
                  duplicateMutation.mutate({ id: menu.id });
                }}
                disabled={duplicateMutation.isPending}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-orange-50 text-orange-600 transition-colors border-t border-border"
              >
                <span>🔄</span> {duplicateMutation.isPending ? "Duplicando..." : "Repetir menú"}
              </button>
              <button
                onClick={() => {
                  setShowActions(false);
                  if (confirm("¿Eliminar este menú? Esta acción no se puede deshacer.")) {
                    deleteMutation.mutate({ id: menu.id });
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-red-50 text-red-600 transition-colors border-t border-border"
              >
                <span>🗑️</span> Eliminar menú
              </button>
            </div>
          </div>
        )}
      </div>

      {showRename && (
        <RenameModal menu={menu} onClose={() => setShowRename(false)} onRenamed={onRefresh} />
      )}
      {showSetDate && (
        <SetStartDateModal menu={menu} onClose={() => setShowSetDate(false)} onUpdated={onRefresh} />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyMenus() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "active" | string>("all");

  const { data: menus = [], isLoading, refetch } = trpc.menus.list.useQuery();

  const userMenus = (menus as MenuOrganizer[]).filter(m => !m.isSeeded);

  const filteredMenus = userMenus.filter(m => {
    if (filter === "active") return m.isActive;
    if (filter === "all") return true;
    return m.objective === filter;
  });

  const activeMenu = userMenus.find(m => m.isActive);

  const objectivesSet = new Set(userMenus.map(m => m.objective).filter(Boolean));
  const objectives = Array.from(objectivesSet) as string[];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Mis Menús</h1>
            <p className="text-xs text-muted-foreground">
              {userMenus.length} {userMenus.length === 1 ? "menú guardado" : "menús guardados"}
            </p>
          </div>
          <button
            onClick={() => navigate("/app/buddy-ia")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
          >
            <span>✨</span> Crear con IA
          </button>
        </div>
      </div>

      {/* Active Menu Banner */}
      {activeMenu && (
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">Menú activo</p>
              <p className="font-bold text-base mt-0.5 truncate">{activeMenu.name}</p>
              <p className="text-xs opacity-80 mt-0.5">
                Desde {formatDate(activeMenu.startDate)}
              </p>
            </div>
            <Link href="/app/active-menu">
              <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                Ver →
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-3 px-4 mt-4 overflow-x-auto pb-1">
        <Link href="/app/buddy-ia">
          <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-orange-200 bg-orange-50 text-orange-700 text-xs font-semibold hover:border-orange-400 transition-colors">
            🤖 BuddyIA
          </button>
        </Link>
        <Link href="/app/menu-library">
          <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold hover:border-orange-300 transition-colors">
            📚 Biblioteca
          </button>
        </Link>
        <Link href="/app/menus">
          <button className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-semibold hover:border-orange-300 transition-colors">
            📅 Planificador
          </button>
        </Link>
      </div>

      {/* Filter Tabs */}
      {userMenus.length > 0 && (
        <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-1">
          {[
            { key: "all", label: "Todos" },
            { key: "active", label: "Activo" },
            ...objectives.map(o => ({ key: o, label: OBJECTIVE_LABELS[o]?.label || o })),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === tab.key
                  ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-orange-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="font-bold text-lg mb-2">
              {filter === "all" ? "Aún no tienes menús" : "No hay menús con este filtro"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {filter === "all"
                ? "Crea tu primer menú personalizado con BuddyIA o explora la biblioteca de menús."
                : "Prueba con otro filtro o crea un nuevo menú."}
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                onClick={() => navigate("/app/buddy-ia")}
                className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-colors"
              >
                ✨ Crear menú con BuddyIA
              </button>
              <Link href="/app/menu-library">
                <button className="w-full py-3 rounded-xl border border-border font-semibold text-sm hover:border-orange-300 transition-colors">
                  📚 Explorar biblioteca
                </button>
              </Link>
            </div>
          </div>
        ) : (
          filteredMenus.map(menu => (
            <MenuCard key={menu.id} menu={menu} onRefresh={refetch} />
          ))
        )}
      </div>

      {/* Stats footer */}
      {userMenus.length > 0 && (
        <div className="mx-4 mt-6 p-4 rounded-2xl bg-muted/50 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resumen</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-orange-500">{userMenus.length}</p>
              <p className="text-xs text-muted-foreground">Menús totales</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{userMenus.filter(m => m.isActive).length}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{objectives.length}</p>
              <p className="text-xs text-muted-foreground">Objetivos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
