import { useState } from "react"
import { useTranslation } from 'react-i18next';;
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { Link, useLocation } from "wouter";
import { usePlan } from "@/hooks/usePlan";
import {
  PlusIcon,
  SparklesIcon,
  FireIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PlayIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuOrganizer {
  id: number;
  name: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  objective?: string | null;
  goal?: string | null;
  isActive?: boolean;
  isSeeded?: boolean;
  dailyMealsCount?: number | null;
  dailyCalories?: number | null;
  persons?: number | null;
  coverImage?: string | null;
  generatedByAI?: boolean;
  difficulty?: string | null;
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

function formatDateShort(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

function getDurationDays(start: string | Date | null | undefined, end: string | Date | null | undefined): number | null {
  if (!start || !end) return null;
  try {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
  } catch {
    return null;
  }
}

// Category images (CDN URLs)
const GOAL_IMAGES: Record<string, string> = {
  perdida_peso:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-perdida-peso-b4FLQyzdJS2gz3W3v6VMXR.webp",
  perdida_grasa:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-perdida-peso-b4FLQyzdJS2gz3W3v6VMXR.webp",
  ganancia_muscular: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-musculacion-BdzBQeP6Aiw8Jx6vGeeZiu.webp",
  tonificacion:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-musculacion-BdzBQeP6Aiw8Jx6vGeeZiu.webp",
  definicion:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-musculacion-BdzBQeP6Aiw8Jx6vGeeZiu.webp",
  mediterraneo:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-mediterraneo-3pmLBfXFhNySpeEg8H5ucM.webp",
  vegano:            "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-vegano-UkNwnYjCkiuZRzVp7KwAFy.webp",
  bienestar:         "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-bienestar-GhYFno35PbpStPQLjan2SK.webp",
  salud:             "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-bienestar-GhYFno35PbpStPQLjan2SK.webp",
  rendimiento:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-rendimiento-hGFdZJUbgwkc2Sm2TYgCRn.webp",
  mantenimiento:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-equilibrado-cMkzbr9TNmDrfYz3kZDYqJ.webp",
  dieta_equilibrada: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu-cover-equilibrado-cMkzbr9TNmDrfYz3kZDYqJ.webp",
};

// Overlay color per category (semi-transparent tint over the image)
const GOAL_OVERLAY: Record<string, string> = {
  perdida_peso:      "rgba(59,130,246,0.45)",   // blue
  perdida_grasa:     "rgba(59,130,246,0.45)",   // blue
  ganancia_muscular: "rgba(34,197,94,0.40)",    // green
  tonificacion:      "rgba(34,197,94,0.40)",    // green
  definicion:        "rgba(34,197,94,0.40)",    // green
  mediterraneo:      "rgba(245,158,11,0.40)",   // amber
  vegano:            "rgba(16,185,129,0.40)",   // emerald
  bienestar:         "rgba(236,72,153,0.35)",   // pink
  salud:             "rgba(20,184,166,0.40)",   // teal
  rendimiento:       "rgba(99,102,241,0.40)",   // indigo
  mantenimiento:     "rgba(107,114,128,0.35)",  // gray
  dieta_equilibrada: "rgba(107,114,128,0.35)",  // gray
};

const GOAL_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  perdida_peso:      { label: "Pérdida de peso",    emoji: "🔥", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  ganancia_muscular: { label: "Ganancia muscular",  emoji: "💪", color: "text-green-700",   bg: "bg-green-50 border-green-200" },
  tonificacion:      { label: "Tonificación",       emoji: "⚡", color: "text-green-700",   bg: "bg-green-50 border-green-200" },
  perdida_grasa:     { label: "Pérdida de grasa",   emoji: "🎯", color: "text-blue-700",    bg: "bg-blue-50 border-blue-200" },
  mantenimiento:     { label: "Mantenimiento",      emoji: "⚖️", color: "text-gray-700",    bg: "bg-gray-50 border-gray-200" },
  definicion:        { label: "Definición",         emoji: "🏆", color: "text-green-700",   bg: "bg-green-50 border-green-200" },
  salud:             { label: "Salud general",      emoji: "💚", color: "text-teal-700",    bg: "bg-teal-50 border-teal-200" },
  vegano:            { label: "Vegano",             emoji: "🌱", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  bienestar:         { label: "Bienestar",          emoji: "😊", color: "text-pink-700",    bg: "bg-pink-50 border-pink-200" },
  dieta_equilibrada: { label: "Equilibrado",        emoji: "🥗", color: "text-gray-700",    bg: "bg-gray-50 border-gray-200" },
  rendimiento:       { label: "Rendimiento",        emoji: "🚀", color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200" },
  mediterraneo:      { label: "Mediterráneo",       emoji: "🫒", color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
};

// Gradient covers for menus without image
const COVER_GRADIENTS = [
  "from-orange-400 to-amber-500",
  "from-blue-400 to-indigo-500",
  "from-green-400 to-emerald-500",
  "from-purple-400 to-pink-500",
  "from-teal-400 to-cyan-500",
  "from-rose-400 to-red-500",
];

function getCoverGradient(id: number) {
  return COVER_GRADIENTS[id % COVER_GRADIENTS.length];
}

// ─── Rename Modal ─────────────────────────────────────────────────────────────
function RenameModal({ menu, onClose, onDone }: { menu: MenuOrganizer; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(menu.name);
  const mutation = trpc.menus.rename.useMutation({
    onSuccess: () => { toast.success("Nombre actualizado"); onDone(); onClose(); },
    onError: () => toast.error("Error al renombrar el menú"),
  });
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground mb-1">Renombrar menú</h3>
        <p className="text-xs text-muted-foreground mb-4">Cambia el nombre de este menú</p>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && name.trim()) mutation.mutate({ id: menu.id, name: name.trim() }); }}
          className="vively-input mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate({ id: menu.id, name: name.trim() })}
            disabled={!name.trim() || mutation.isPending}
            className="flex-1 btn-vively"
          >
            {mutation.isPending ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Date Modal ────────────────────────────────────────────────────────
function ChangeDateModal({ menu, onClose, onDone }: { menu: MenuOrganizer; onClose: () => void; onDone: () => void }) {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const mutation = trpc.menus.updateStartDate.useMutation({
    onSuccess: () => { toast.success("Fecha de inicio actualizada"); onDone(); onClose(); },
    onError: () => toast.error("Error al actualizar la fecha"),
  });
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground mb-1">Cambiar fecha de inicio</h3>
        <p className="text-xs text-muted-foreground mb-4">Las comidas del menú se desplazarán a partir de la nueva fecha.</p>
        <label className="block text-xs font-semibold text-foreground/80 mb-1">Nueva fecha de inicio</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="vively-input mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
          <button
            onClick={() => mutation.mutate({ menuId: menu.id, startDate })}
            disabled={!startDate || mutation.isPending}
            className="flex-1 btn-vively"
          >
            {mutation.isPending ? t("common.updating") : t("common.apply")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Menu Modal ────────────────────────────────────────────────────────
function CreateMenuModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const mutation = trpc.menus.create.useMutation({
    onSuccess: () => { toast.success("Menú creado"); onDone(); onClose(); },
    onError: () => toast.error("Error al crear el menú"),
  });

  function handleCreate() {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    mutation.mutate({ name: name.trim() || "Mi menú", startDate: today, endDate: nextWeek });
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground mb-1">Nuevo menú</h3>
        <p className="text-xs text-muted-foreground mb-4">Dale un nombre a tu planificador semanal</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
          placeholder="Ej: Semana saludable, Dieta mediterránea..."
          className="vively-input mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
          <button onClick={handleCreate} disabled={mutation.isPending} className="flex-1 btn-vively">
            {mutation.isPending ? "Creando..." : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI Generate Modal ────────────────────────────────────────────────────────
function AIGenerateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [objective, setObjective] = useState("");
  const [generating, setGenerating] = useState(false);
  const mutation = trpc.menus.generateWithAI.useMutation({
    onSuccess: () => { setGenerating(false); toast.success("¡Menú generado con IA!"); onDone(); onClose(); },
    onError: () => { setGenerating(false); toast.error("Error al generar el menú"); },
  });

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
            <SparklesIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Generar menú con IA</h3>
            <p className="text-xs text-muted-foreground">La IA creará un menú personalizado para ti</p>
          </div>
        </div>
        <textarea
          value={objective}
          onChange={e => setObjective(e.target.value)}
          placeholder="Describe tu objetivo: perder peso, ganar músculo, dieta mediterránea, sin gluten..."
          className="vively-input mb-4 h-24 resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">Cancelar</button>
          <button
            onClick={() => { setGenerating(true); mutation.mutate({ days: 7, mealsPerDay: 3, objective: objective || "menú equilibrado semanal" }); }}
            disabled={generating}
            className="flex-1 btn-vively flex items-center justify-center gap-2"
          >
            {generating ? <><span className="animate-spin">⏳</span> Generando...</> : <><SparklesIcon className="h-4 w-4" /> Generar</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Menu Card ────────────────────────────────────────────────────────────────
function MenuCard({ menu, onRefresh }: { menu: MenuOrganizer; onRefresh: () => void }) {
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showChangeDate, setShowChangeDate] = useState(false);
  const utils = trpc.useUtils();

  const goalKey = menu.goal || menu.objective || "";
  const goalMeta = GOAL_META[goalKey] ?? null;
  const duration = getDurationDays(menu.startDate, menu.endDate);
  const gradient = getCoverGradient(menu.id);
  const categoryImage = menu.coverImage || GOAL_IMAGES[goalKey] || null;
  const categoryOverlay = GOAL_OVERLAY[goalKey] || "rgba(0,0,0,0.25)";

  const setActiveMutation = trpc.menus.setActive.useMutation({
    onSuccess: () => {
      toast.success("✅ Menú activado — ahora está en curso");
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
      toast.success("Menú duplicado");
      utils.menus.list.invalidate();
      onRefresh();
    },
    onError: () => toast.error("Error al duplicar el menú"),
  });

  return (
    <>
      <div className={`rounded-3xl overflow-hidden border transition-all ${
        menu.isActive ? "border-[#F97316]/50 shadow-md shadow-orange-100" : "border-border/60 shadow-sm"
      }`}>
        {/* Cover */}
        <div className={`relative h-40 overflow-hidden ${!categoryImage ? `bg-gradient-to-br ${gradient}` : "bg-gray-100"}`}>
          {categoryImage ? (
            <img src={categoryImage} alt={menu.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">🥗</span>
            </div>
          )}
          {/* Category color overlay */}
          <div className="absolute inset-0" style={{ background: categoryImage ? categoryOverlay : undefined }} />
          {/* Dark gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            {menu.isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F97316] px-2.5 py-1 text-[10px] font-bold text-white shadow">
                <CheckCircleSolid className="h-3 w-3" /> En curso
              </span>
            )}
            {menu.generatedByAI && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                ✨ IA
              </span>
            )}
          </div>

          {/* Top-right: menu button */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>

          {/* Bottom info */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow mb-1">{menu.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {goalMeta && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                  {goalMeta.emoji} {goalMeta.label}
                </span>
              )}
              {menu.dailyCalories && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <FireIcon className="h-3 w-3 text-orange-300" /> {menu.dailyCalories} kcal
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-background p-4">
          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              {menu.startDate ? formatDateShort(menu.startDate) : "Sin fecha"}
              {menu.endDate ? ` → ${formatDateShort(menu.endDate)}` : ""}
            </span>
            {duration && (
              <span className="flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5" />
                {duration} días
              </span>
            )}
            {menu.persons && menu.persons > 1 && (
              <span className="flex items-center gap-1">
                <UserGroupIcon className="h-3.5 w-3.5" />
                {menu.persons} pers.
              </span>
            )}
            {menu.dailyMealsCount && (
              <span>{menu.dailyMealsCount} comidas/día</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {menu.isActive ? (
              <button
                onClick={() => navigate("/app/menus")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#F97316] py-2.5 text-xs font-bold text-white"
              >
                <PlayIcon className="h-3.5 w-3.5" /> Ver planificador
              </button>
            ) : (
              <button
                onClick={() => setActiveMutation.mutate({ menuId: menu.id })}
                disabled={setActiveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-[#F97316]/40 bg-orange-50 py-2.5 text-xs font-bold text-[#F97316] hover:bg-orange-100 transition-colors"
              >
                <PlayIcon className="h-3.5 w-3.5" />
                {setActiveMutation.isPending ? "Activando..." : "Activar"}
              </button>
            )}
            <button
              onClick={() => navigate("/app/menus")}
              className="flex items-center justify-center gap-1 rounded-2xl border border-border px-3 py-2.5 text-xs font-semibold text-foreground/70 hover:border-[#F97316]/30 hover:bg-orange-50 transition-colors"
            >
              <CalendarDaysIcon className="h-3.5 w-3.5" /> Planificar
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {menuOpen && (
          <div className="border-t border-border bg-muted/20">
            <div className="grid grid-cols-2">
              <button
                onClick={() => { setMenuOpen(false); setShowRename(true); }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-muted transition-colors border-r border-border"
              >
                <PencilIcon className="h-3.5 w-3.5 text-muted-foreground" /> Renombrar
              </button>
              <button
                onClick={() => { setMenuOpen(false); setShowChangeDate(true); }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-muted transition-colors"
              >
                <CalendarDaysIcon className="h-3.5 w-3.5 text-muted-foreground" /> Cambiar fecha
              </button>
              <button
                onClick={() => { setMenuOpen(false); duplicateMutation.mutate({ id: menu.id }); }}
                disabled={duplicateMutation.isPending}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium hover:bg-muted transition-colors border-r border-border border-t"
              >
                <DocumentDuplicateIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {duplicateMutation.isPending ? "Duplicando..." : "Duplicar"}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (confirm(`¿Eliminar "${menu.name}"? Esta acción no se puede deshacer.`)) {
                    deleteMutation.mutate({ id: menu.id });
                  }
                }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border-t"
              >
                <TrashIcon className="h-3.5 w-3.5" /> Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {showRename && <RenameModal menu={menu} onClose={() => setShowRename(false)} onDone={onRefresh} />}
      {showChangeDate && <ChangeDateModal menu={menu} onClose={() => setShowChangeDate(false)} onDone={onRefresh} />}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyMenus() {
  const [, navigate] = useLocation();
  const { can } = usePlan();
  const [filter, setFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const { data: menus = [], isLoading, refetch } = trpc.menus.list.useQuery();

  const userMenus = (menus as MenuOrganizer[]).filter(m => !m.isSeeded);
  const activeMenu = userMenus.find(m => m.isActive);

  // Build filter options from available goals
  const goalsSet = new Set(userMenus.map(m => m.goal || m.objective).filter(Boolean) as string[]);
  const goalFilters = Array.from(goalsSet);

  const filteredMenus = userMenus.filter(m => {
    if (filter === "active") return m.isActive;
    if (filter === "ai") return m.generatedByAI;
    if (filter === "all") return true;
    return (m.goal || m.objective) === filter;
  });

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Menús</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoading ? t("common.loading_ellipsis") : `${userMenus.length} ${userMenus.length === 1 ? "menú guardado" : "menús guardados"}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!can("canGenerateAIMenus")) { toast.error("Genera menús con IA con el plan Pro"); navigate("/app/subscription"); return; }
              setShowAI(true);
            }}
            className="flex items-center gap-1.5 rounded-2xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <SparklesIcon className="h-3.5 w-3.5" /> IA
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-[#F97316] px-3 py-2 text-xs font-bold text-white shadow-sm"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Nuevo
          </button>
        </div>
      </div>

      {/* Active menu banner */}
      {activeMenu && (
        <div className="mb-5 rounded-3xl bg-gradient-to-r from-[#F97316] to-orange-500 p-4 text-white shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">Menú en curso</p>
              <p className="font-bold text-base leading-tight truncate">{activeMenu.name}</p>
              <p className="text-xs opacity-75 mt-0.5">
                Desde {formatDate(activeMenu.startDate)}
                {activeMenu.endDate ? ` · hasta ${formatDate(activeMenu.endDate)}` : ""}
              </p>
            </div>
            <button
              onClick={() => navigate("/app/menus")}
              className="shrink-0 flex items-center gap-1 rounded-2xl bg-white/20 hover:bg-white/30 px-3 py-2 text-xs font-bold text-white transition-colors"
            >
              Ver <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Link href="/app/buddy-ia">
          <button className="shrink-0 flex items-center gap-1.5 rounded-2xl border-2 border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:border-orange-400 transition-colors">
            🤖 BuddyIA
          </button>
        </Link>
        <Link href="/app/menu-library">
          <button className="shrink-0 flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-orange-300 transition-colors">
            📚 Biblioteca
          </button>
        </Link>
        <Link href="/app/menus">
          <button className="shrink-0 flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-orange-300 transition-colors">
            📅 Planificador
          </button>
        </Link>
      </div>

      {/* Filter chips */}
      {userMenus.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: "Todos" },
            { key: "active", label: "✓ Activo" },
            ...(userMenus.some(m => m.generatedByAI) ? [{ key: "ai", label: "✨ IA" }] : []),
            ...goalFilters.map(g => ({ key: g, label: `${GOAL_META[g]?.emoji ?? ""} ${GOAL_META[g]?.label ?? g}` })),
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-[#F97316] text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-3xl overflow-hidden border border-border/40">
              <div className="h-40 bg-muted animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center px-4">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/40">
            <span className="text-4xl">{filter === "all" ? "📋" : "🔍"}</span>
          </div>
          <h3 className="text-base font-bold text-foreground mb-2">
            {filter === "all" ? "Aún no tienes menús" : "Sin menús con este filtro"}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {filter === "all"
              ? "Crea tu primer menú personalizado o genera uno con IA en segundos."
              : "Prueba con otro filtro o crea un nuevo menú."}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => {
                if (!can("canGenerateAIMenus")) { toast.error("Genera menús con IA con el plan Pro"); navigate("/app/subscription"); return; }
                setShowAI(true);
              }}
              className="w-full btn-vively flex items-center justify-center gap-2"
            >
              <SparklesIcon className="h-4 w-4" /> Generar con IA
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="w-full rounded-2xl border border-border py-3 text-sm font-semibold hover:border-[#F97316]/40 transition-colors"
            >
              <PlusIcon className="h-4 w-4 inline mr-1" /> Crear manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMenus.map(menu => (
            <MenuCard key={menu.id} menu={menu} onRefresh={refetch} />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {userMenus.length > 0 && (
        <div className="mt-6 rounded-3xl bg-muted/40 border border-border/50 p-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Resumen</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-[#F97316]">{userMenus.length}</p>
              <p className="text-[11px] text-muted-foreground">Menús totales</p>
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{userMenus.filter(m => m.isActive).length}</p>
              <p className="text-[11px] text-muted-foreground">Activos</p>
            </div>
            <div>
              <p className="text-xl font-bold text-blue-600">{userMenus.filter(m => m.generatedByAI).length}</p>
              <p className="text-[11px] text-muted-foreground">Con IA</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateMenuModal onClose={() => setShowCreate(false)} onDone={refetch} />}
      {showAI && <AIGenerateModal onClose={() => setShowAI(false)} onDone={refetch} />}
    </div>
  );
}
