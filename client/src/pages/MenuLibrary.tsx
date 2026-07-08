import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

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

// Detect special diet badges from menu name
function getDietBadges(name: string): Array<{ label: string; color: string; emoji: string }> {
  const n = name.toLowerCase();
  const badges: Array<{ label: string; color: string; emoji: string }> = [];
  if (n.includes('keto') || n.includes('cetogénico')) badges.push({ label: 'Keto', color: 'bg-yellow-100 text-yellow-800', emoji: '🥑' });
  if (n.includes('sin gluten') || n.includes('gluten free') || n.includes('celiaco')) badges.push({ label: 'Sin Gluten', color: 'bg-amber-100 text-amber-800', emoji: '🌾' });
  if (n.includes('vegano') || n.includes('vegan')) badges.push({ label: 'Vegano', color: 'bg-green-100 text-green-800', emoji: '🌱' });
  if (n.includes('vegetariano')) badges.push({ label: 'Vegetariano', color: 'bg-lime-100 text-lime-800', emoji: '🥦' });
  if (n.includes('familiar') || n.includes('familia')) badges.push({ label: 'Familiar', color: 'bg-blue-100 text-blue-800', emoji: '👨‍👩‍👧' });
  if (n.includes('deportista') || n.includes('deporte') || n.includes('atleta')) badges.push({ label: 'Deportista', color: 'bg-red-100 text-red-800', emoji: '🏃' });
  if (n.includes('mediterráneo') || n.includes('mediterraneo')) badges.push({ label: 'Mediterráneo', color: 'bg-cyan-100 text-cyan-800', emoji: '🌊' });
  if (n.includes('alto en proteína') || n.includes('alto proteína') || n.includes('proteico')) badges.push({ label: 'Alto en Proteínas', color: 'bg-purple-100 text-purple-800', emoji: '💪' });
  return badges;
}

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
  perdida_peso: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/perdida-peso_fc448d8e.jpg",
  ganancia_muscular: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ganancia-muscular_34529480.jpg",
  tonificacion: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/definicion_9729d51a.jpg",
  perdida_grasa: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/perdida-grasa_6d7bf7fe.jpg",
  mantenimiento: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mantenimiento_1070987f.jpg",
  bienestar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mediterraneo_302bfcb5.jpg",
  vegano: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegano_2aac20d3.jpg",
};

const DIFF_LABELS: Record<string, string> = {
  facil: "Fácil",
  medio: "Medio",
  dificil: "Difícil",
  // English keys from DB
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

const DIET_TYPES = [
  { id: undefined, label: "Todos", emoji: "🍽️" },
  { id: "mediterraneo", label: "Mediterráneo", emoji: "🌊" },
  { id: "keto", label: "Keto / Low Carb", emoji: "🥑" },
  { id: "sin_gluten", label: "Sin Gluten", emoji: "🌾" },
  { id: "vegetariano", label: "Vegetariano", emoji: "🥦" },
  { id: "familiar", label: "Familiar", emoji: "👨‍👩‍👧" },
  { id: "deportista", label: "Deportista", emoji: "🏃" },
  { id: "clinico", label: "Clínico", emoji: "🏥" },
  { id: "economico", label: "Económico", emoji: "💰" },
  { id: "oficina", label: "Oficina / Tupper", emoji: "🍱" },
  { id: "batch", label: "Batch Cooking", emoji: "🥘" },
] as const;

const CALORIE_RANGES = [
  { id: undefined, label: "Todas" },
  { id: "low", label: "< 1500 kcal", min: 0, max: 1499 },
  { id: "medium", label: "1500–2000 kcal", min: 1500, max: 2000 },
  { id: "high", label: "2000–2500 kcal", min: 2001, max: 2500 },
  { id: "very_high", label: "> 2500 kcal", min: 2501, max: 9999 },
] as const;

function matchesDietType(name: string, dietId: string): boolean {
  const n = name.toLowerCase();
  switch (dietId) {
    case "mediterraneo": return n.includes("mediterr");
    case "keto": return n.includes("keto") || n.includes("cetog") || n.includes("bajo en carboh");
    case "sin_gluten": return n.includes("sin gluten") || n.includes("celiaco") || n.includes("gluten free");
    case "vegetariano": return n.includes("vegetariano");
    case "familiar": return n.includes("familiar");
    case "deportista": return n.includes("deportista") || n.includes("deporte") || n.includes("atleta") || n.includes("rendimiento");
    case "clinico": return n.includes("cl\u00ednico") || n.includes("clinico") || n.includes("cardio") || n.includes("gluc\u00e9mico") || n.includes("hormonal");
    case "economico": return n.includes("econ\u00f3mico") || n.includes("economico") || n.includes("5\u20ac") || n.includes("5€");
    case "oficina": return n.includes("oficina") || n.includes("tupper");
    case "batch": return n.includes("batch");
    default: return true;
  }
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants: any = { // @ts-ignore

  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants: any = { // @ts-ignore

  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const sectionVariants: any = {

  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function MenuCardSkeleton() {
  return (
    <div className="bg-background rounded-2xl overflow-hidden shadow-sm border border-border/50">
      {/* Header skeleton */}
      <div className="h-36 skeleton" />
      {/* Body skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-24 rounded-full skeleton" />
          <div className="h-5 w-20 rounded-full skeleton" />
        </div>
        <div className="flex gap-2 mt-2">
          <div className="h-9 flex-1 rounded-lg skeleton" />
          <div className="h-9 flex-1 rounded-lg skeleton" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Section (Recommended) ──────────────────────────────────────────

function RecommendedSkeleton() {
  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-lg skeleton" />
          <div className="h-4 w-36 rounded-lg skeleton" />
        </div>
        <div className="h-4 w-16 rounded-lg skeleton" />
      </div>

      {/* Pulsing label */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
        </span>
        <span className="text-xs text-orange-500 font-medium">Buscando menús para tu perfil...</span>
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <MenuCardSkeleton key={i} />
        ))}
      </div>
    </motion.section>
  );
}

// ─── Quick View Popup Content ─────────────────────────────────────────────────

function MenuQuickView({
  menu,
  user,
  onDetail,
  onSave,
}: {
  menu: any;
  user: any;
  onDetail: (id: number) => void;
  onSave: (menu: { id: number; name: string }) => void;
}) {
  const image = menu.coverImage || GOAL_IMAGES[menu.goal];
  const gradient = GOAL_GRADIENTS[menu.goal] || "from-gray-500 to-gray-400";

  // Nutrition highlights based on goal
  const goalHighlights: Record<string, { icon: string; text: string }[]> = {
    perdida_peso: [
      { icon: "🔥", text: "Déficit calórico controlado" },
      { icon: "🥗", text: "Alto en fibra y proteína" },
      { icon: "💧", text: "Bajo en grasas saturadas" },
    ],
    ganancia_muscular: [
      { icon: "💪", text: "Alto en proteína" },
      { icon: "🍚", text: "Carbohidratos de calidad" },
      { icon: "⚡", text: "Superávit calórico moderado" },
    ],
    tonificacion: [
      { icon: "🏋️", text: "Balance proteína/carbohidratos" },
      { icon: "🔥", text: "Calorías de mantenimiento" },
      { icon: "🥦", text: "Micronutrientes esenciales" },
    ],
    perdida_grasa: [
      { icon: "🔥", text: "Quema de grasa activa" },
      { icon: "💪", text: "Preserva masa muscular" },
      { icon: "🥗", text: "Bajo índice glucémico" },
    ],
    mantenimiento: [
      { icon: "⚖️", text: "Calorías equilibradas" },
      { icon: "🌈", text: "Variedad nutricional" },
      { icon: "✅", text: "Fácil de seguir" },
    ],
    bienestar: [
      { icon: "🌿", text: "Alimentos antiinflamatorios" },
      { icon: "🫀", text: "Salud cardiovascular" },
      { icon: "🧠", text: "Nutrientes para el cerebro" },
    ],
    vegano: [
      { icon: "🌱", text: "100% origen vegetal" },
      { icon: "💊", text: "Proteína completa" },
      { icon: "🌍", text: "Sostenible y ético" },
    ],
  };
  const highlights = goalHighlights[menu.goal] || [
    { icon: "🍽️", text: "Menú equilibrado" },
    { icon: "✅", text: "Nutricionalmente completo" },
  ];

  return (
    <div className="w-80 overflow-hidden rounded-xl shadow-2xl border-0 bg-background">
      {/* Image header */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {image && (
          <img
            src={image}
            alt={menu.name}
            className="absolute inset-0 w-full h-full object-cover opacity-85"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-bold text-sm leading-tight drop-shadow">{menu.name}</h3>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {menu.goal && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GOAL_COLORS[menu.goal] || "bg-muted/50 text-foreground"}`}>
                {GOAL_LABELS[menu.goal] || menu.goal}
              </span>
            )}
            {menu.difficulty && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-black/30 text-white backdrop-blur-sm">
                {DIFF_LABELS[menu.difficulty] || menu.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex divide-x divide-border/50 border-b border-border/50">
        {menu.dailyCalories && (
          <div className="flex-1 text-center py-2.5">
            <p className="text-base font-bold text-[#FF6B35]">{menu.dailyCalories}</p>
            <p className="text-xs text-muted-foreground">kcal/día</p>
          </div>
        )}
        {menu.dailyMealsCount && (
          <div className="flex-1 text-center py-2.5">
            <p className="text-base font-bold text-foreground">{menu.dailyMealsCount}</p>
            <p className="text-xs text-muted-foreground">comidas</p>
          </div>
        )}
        <div className="flex-1 text-center py-2.5">
          <p className="text-base font-bold text-foreground">7</p>
          <p className="text-xs text-muted-foreground">días</p>
        </div>
        {menu.persons && (
          <div className="flex-1 text-center py-2.5">
            <p className="text-base font-bold text-foreground">{menu.persons}</p>
            <p className="text-xs text-muted-foreground">{menu.persons === 1 ? "persona" : "personas"}</p>
          </div>
        )}
      </div>

      {/* Highlights */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Características</p>
        {highlights.map((h, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="text-base">{h.icon}</span>
            <span className="text-foreground/80">{h.text}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-9 border-border"
          onClick={() => onDetail(menu.id)}
        >
          Ver detalles
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
  );
}

// ─── Menu Card ────────────────────────────────────────────────────────────────

function MenuCard({
  menu,
  isRecommended,
  user,
  onDetail,
  onSave,
  onShoppingList,
}: {
  menu: any;
  isRecommended?: boolean;
  user: any;
  onDetail: (id: number) => void;
  onSave: (menu: { id: number; name: string }) => void;
  onShoppingList?: (menu: { id: number; name: string }) => void;
}) {
  const gradient = GOAL_GRADIENTS[menu.goal] || "from-gray-500 to-gray-400";
  // Priorizar imagen de la BD, luego fallback por objetivo
  const image = menu.coverImage || GOAL_IMAGES[menu.goal];

  return (
    <HoverCard openDelay={400} closeDelay={150}>
      <HoverCardTrigger asChild>
        <motion.div
          variants={cardVariants}
          className="bg-background rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-border/50 group cursor-pointer"
        >
          {/* Visual header */}
          <div className={`relative h-44 bg-gradient-to-br ${gradient} overflow-hidden`}>
            {image && (
              <img
                src={image}
                alt={menu.name}
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-300"
              />
            )}
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {/* Quick view hint on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="bg-background/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/30">
                Vista rápida
              </span>
            </div>
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                {isRecommended && (
                  <span className="bg-background/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/30">
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
                <Badge className={`text-xs ${GOAL_COLORS[menu.goal] || "bg-muted/50 text-foreground"}`}>
                  {GOAL_LABELS[menu.goal] || menu.goal}
                </Badge>
              )}
              {getDietBadges(menu.name).map((b) => (
                <Badge key={b.label} className={`text-xs ${b.color}`}>
                  {b.emoji} {b.label}
                </Badge>
              ))}
              {menu.dailyCalories && (
                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                  🔥 {menu.dailyCalories} kcal
                </span>
              )}
              {menu.dailyMealsCount && (
                <span className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                  🍽️ {menu.dailyMealsCount} comidas
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs h-9 flex-1 min-w-0" onClick={() => onDetail(menu.id)}>
                Ver menú
              </Button>
              {user ? (
                <>
                  <Button
                    size="sm"
                    className="text-xs h-9 flex-1 min-w-0 bg-[#FF6B35] hover:bg-[#e55a25] text-white"
                    onClick={() => onSave({ id: menu.id, name: menu.name })}
                  >
                    Usar menú
                  </Button>
                  {onShoppingList && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 shrink-0 p-0 border-border hover:border-[#FF6B35] hover:text-[#FF6B35] flex items-center justify-center"
                      title="Generar lista de la compra"
                      onClick={() => onShoppingList({ id: menu.id, name: menu.name })}
                    >
                      🛒
                    </Button>
                  )}
                </>
              ) : (
                <Link href="/login" className="flex-1 min-w-0">
                  <Button size="sm" className="text-xs h-9 w-full bg-[#FF6B35] hover:bg-[#e55a25] text-white">
                    Usar menú
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={12}
        className="w-80 p-0 border-0 shadow-2xl rounded-xl overflow-hidden"
      >
        <MenuQuickView menu={menu} user={user} onDetail={onDetail} onSave={onSave} />
      </HoverCardContent>
    </HoverCard>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onExplore, onCreateAI }: { onExplore: () => void; onCreateAI: () => void }) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <span className="text-4xl">🍽️</span>
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">
        Actualmente no hay menús adaptados para ti
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
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
          className="w-full h-12 rounded-xl font-semibold border-border"
          onClick={onExplore}
        >
          🔍 Explorar todos los menús disponibles
        </Button>
      </div>
    </motion.div>
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
      toast.success("✅ ¡Menú guardado y activado! Abriendo el planificador...");
      utils.menus.list.invalidate();
      utils.menus.getActive.invalidate();
      onClose();
      setTimeout(() => navigate("/app/menus"), 500);
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
  const [selectedDay, setSelectedDay] = useState(1);
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  const { data: menu, isLoading } = trpc.menus.libraryDetail.useQuery(
    { id: menuId! },
    { enabled: !!menuId && open }
  );

  if (!open || !menuId) return null;

  const MEAL_ICONS: Record<string, string> = {
    breakfast: "☀️",
    morning_snack: "🍎",
    lunch: "🍽️",
    afternoon_snack: "☕",
    dinner: "🌙",
    snack: "🥜",
  };
  const MEAL_LABELS: Record<string, string> = {
    breakfast: "Desayuno",
    morning_snack: "Media mañana",
    lunch: "Comida",
    afternoon_snack: "Merienda",
    dinner: "Cena",
    snack: "Merienda",
  };
  const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  // Group day parts by day number
  const dayGroups: Record<number, any[]> = {};
  if (menu?.dayParts) {
    for (const dp of menu.dayParts) {
      const day = dp.dayNumber ?? 1;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(dp);
    }
  }

  const totalDays = Object.keys(dayGroups).length;
  const currentDayParts = dayGroups[selectedDay] || [];
  const dayKcal = currentDayParts.reduce((sum: number, dp: any) =>
    sum + dp.recipes.reduce((s: number, r: any) => s + (r.caloriesPerServing || 0), 0), 0
  );

  const image = menu?.coverImage || (menu?.goal ? GOAL_IMAGES[menu.goal] : undefined);
  const gradient = menu?.goal ? (GOAL_GRADIENTS[menu.goal] || "from-gray-500 to-gray-400") : "from-gray-500 to-gray-400";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Hero header */}
        <div className={`relative h-32 bg-gradient-to-br ${gradient} shrink-0`}>
          {image && (
            <img src={image} alt={menu?.name} className="absolute inset-0 w-full h-full object-cover opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <DialogTitle className="text-white text-lg font-bold drop-shadow sr-only">{menu?.name || ""}</DialogTitle>
            <p className="text-white text-lg font-bold drop-shadow leading-tight">{menu?.name || "Cargando..."}</p>
            {menu && (
              <div className="flex gap-2 flex-wrap mt-1.5">
                {menu.goal && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GOAL_COLORS[menu.goal] || "bg-muted/50 text-foreground"}`}>
                    {GOAL_LABELS[menu.goal] || menu.goal}
                  </span>
                )}
                {menu.dailyCalories && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-background/20 text-white backdrop-blur-sm">
                    🔥 {menu.dailyCalories} kcal/día
                  </span>
                )}
                {menu.difficulty && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-background/20 text-white backdrop-blur-sm">
                    {DIFF_LABELS[menu.difficulty] || menu.difficulty}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3 flex-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl skeleton" />
            ))}
          </div>
        ) : menu ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Day selector tabs */}
            <div className="px-4 pt-3 pb-0 shrink-0">
              <div className="flex gap-1.5 overflow-x-auto pb-2">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`shrink-0 flex flex-col items-center px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                      selectedDay === day
                        ? "bg-[#FF6B35] text-white border-[#FF6B35] shadow-sm"
                        : "bg-muted/30 text-muted-foreground border-border/50 hover:border-[#FF6B35] hover:text-[#FF6B35]"
                    }`}
                  >
                    <span className="text-[10px] opacity-70">{DAY_NAMES[day - 1]?.slice(0, 3) || `D${day}`}</span>
                    <span className="font-bold">{day}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Day content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Day header */}
              <div className="flex items-center justify-between py-3">
                <h3 className="font-bold text-foreground">
                  {DAY_NAMES[selectedDay - 1] || `Día ${selectedDay}`}
                </h3>
                {dayKcal > 0 && (
                  <span className="text-sm font-semibold text-[#FF6B35]">
                    🔥 {dayKcal} kcal totales
                  </span>
                )}
              </div>

              {/* Meals */}
              <div className="space-y-3">
                {currentDayParts
                  .sort((a: any, b: any) => (a.mealNumber || 0) - (b.mealNumber || 0))
                  .map((dp: any) => {
                    const mealIcon = MEAL_ICONS[dp.name] || "🍽️";
                    const mealLabel = MEAL_LABELS[dp.name] || dp.name;
                    const mealKcal = dp.recipes.reduce((s: number, r: any) => s + (r.caloriesPerServing || 0), 0);
                    return (
                      <div key={dp.id} className="bg-muted/30 rounded-xl overflow-hidden border border-border/50">
                        <div className="flex items-center justify-between px-3 py-2 bg-background border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{mealIcon}</span>
                            <span className="text-sm font-semibold text-foreground">{mealLabel}</span>
                          </div>
                          {mealKcal > 0 && (
                            <span className="text-xs text-[#FF6B35] font-medium">{mealKcal} kcal</span>
                          )}
                        </div>
                        {dp.recipes.length === 0 ? (
                          <div className="px-3 py-3 text-xs text-muted-foreground/70 italic">Sin receta asignada</div>
                        ) : (
                          dp.recipes.map((r: any) => {
                            const isExpanded = expandedRecipeId === r.id;
                            const ingredients: Array<{name: string; amount: number; unit: string}> = r.ingredientsJson
                              ? (typeof r.ingredientsJson === 'string' ? JSON.parse(r.ingredientsJson) : r.ingredientsJson)
                              : [];
                            return (
                              <div key={r.id} className="border-b border-gray-50 last:border-0">
                                {/* Recipe header row — clickable to expand */}
                                <button
                                  className="w-full px-3 py-2.5 text-left hover:bg-orange-50/50 transition-colors"
                                  onClick={() => setExpandedRecipeId(isExpanded ? null : r.id)}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium text-foreground leading-tight">{r.name}</p>
                                        {ingredients.length > 0 && (
                                          <span className="text-[10px] text-[#FF6B35] bg-orange-50 px-1.5 py-0.5 rounded-full font-medium">
                                            {ingredients.length} ing.
                                          </span>
                                        )}
                                      </div>
                                      {r.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{r.description}</p>
                                      )}
                                    </div>
                                    <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
                                      {r.caloriesPerServing && (
                                        <span className="text-xs font-semibold text-foreground/80">{r.caloriesPerServing} kcal</span>
                                      )}
                                      <div className="flex gap-2">
                                        {r.proteinsPerServing && (
                                          <span className="text-[10px] text-blue-600">{Math.round(r.proteinsPerServing)}g P</span>
                                        )}
                                        {r.carbsPerServing && (
                                          <span className="text-[10px] text-amber-600">{Math.round(r.carbsPerServing)}g C</span>
                                        )}
                                        {r.fatsPerServing && (
                                          <span className="text-[10px] text-red-500">{Math.round(r.fatsPerServing)}g G</span>
                                        )}
                                      </div>
                                      {ingredients.length > 0 && (
                                        <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                                          {isExpanded ? '▲ Ocultar' : '▼ Ingredientes'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                {/* Ingredients expandable panel */}
                                {isExpanded && ingredients.length > 0 && (
                                  <div className="mx-3 mb-3 bg-orange-50/60 rounded-xl border border-orange-100 overflow-hidden">
                                    <div className="px-3 py-2 border-b border-orange-100 bg-orange-50">
                                      <span className="text-[11px] font-semibold text-[#FF6B35] uppercase tracking-wide">🧾 Ingredientes</span>
                                    </div>
                                    <div className="divide-y divide-orange-100/60">
                                      {ingredients.map((ing, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-3 py-1.5">
                                          <span className="text-xs text-foreground/80">{ing.name}</span>
                                          <span className="text-xs font-semibold text-foreground bg-background px-2 py-0.5 rounded-lg border border-orange-100">
                                            {ing.amount} {ing.unit}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-4 pb-4 pt-2 border-t border-border/50 shrink-0 bg-background">
              <Button
                className="w-full bg-[#FF6B35] hover:bg-[#e55a25] text-white h-11 rounded-xl font-semibold"
                onClick={() => { onClose(); onSave({ id: menu.id, name: menu.name }); }}
              >
                Usar este menú
              </Button>
            </div>
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
  const [selectedDietType, setSelectedDietType] = useState<string | undefined>(undefined);
  const [selectedCalorieRange, setSelectedCalorieRange] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [detailMenuId, setDetailMenuId] = useState<number | null>(null);
  const [saveMenu, setSaveMenu] = useState<{ id: number; name: string } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [, navigate] = useLocation();
  // Quick shopping list generation
  const [shoppingMenu, setShoppingMenu] = useState<{ id: number; name: string } | null>(null);
  const [shoppingPersons, setShoppingPersons] = useState(2);
  const [shoppingPending, setShoppingPending] = useState(false);
  const generateFromMenu = trpc.shoppingLists.generateFromMenu.useMutation({
    onSuccess: () => {
      setShoppingMenu(null);
      toast.success("Lista de la compra generada", {
        description: "Puedes verla en tu sección de Listas de la Compra",
        action: { label: "Ver lista", onClick: () => navigate("/app/shopping-lists") },
      });
      setShoppingPending(false);
    },
    onError: (err) => {
      toast.error("Error al generar la lista", { description: err.message });
      setShoppingPending(false);
    },
  });

  // Recommended (personalized, only if logged in)
  const {
    data: recommendedData,
    isLoading: isLoadingRecommended,
  } = trpc.menus.recommended.useQuery(undefined, {
    enabled: !!user,
  });

  // All menus (for explore mode)
  const {
    data: allMenus = [],
    isLoading: isLoadingAll,
  } = trpc.menus.library.useQuery({
    goal: selectedGoal as any,
    difficulty: selectedDifficulty as any,
    limit: 50,
  });

  const filtered = allMenus.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedDietType && !matchesDietType(m.name, selectedDietType)) return false;
    if (selectedCalorieRange) {
      const range = CALORIE_RANGES.find((r) => r.id === selectedCalorieRange);
      if (range && (range as any).min !== undefined && m.dailyCalories) {
        if (m.dailyCalories < (range as any).min || m.dailyCalories > (range as any).max) return false;
      }
    }
    return true;
  });
  const hasActiveFilters = !!(selectedGoal || selectedDifficulty || selectedDietType || selectedCalorieRange || search);
  function clearAllFilters() {
    setSelectedGoal(undefined);
    setSelectedDifficulty(undefined);
    setSelectedDietType(undefined);
    setSelectedCalorieRange(undefined);
    setSearch("");
  }

  const recommendedMenus = recommendedData?.recommended ?? [];
  const totalMenus = recommendedData?.totalMenus ?? allMenus.length;

  // Show skeleton while loading recommended (for logged-in users)
  const showRecommendedSkeleton = !!user && isLoadingRecommended && !showAll;
  // Show empty state only after loading is complete
  const hasNoMenusForProfile = user && !isLoadingRecommended && totalMenus === 0;
  const hasMenusButNoneRecommended =
    user && !isLoadingRecommended && totalMenus > 0 && recommendedMenus.length === 0;

  return (
    <div className="min-h-screen bg-[#FFF8F5]">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/app/menus">
            <button className="text-muted-foreground hover:text-foreground">← Volver</button>
          </Link>
          <h1 className="text-xl font-bold">Biblioteca de Menús</h1>
          <span className="ml-auto text-sm text-muted-foreground">
            {isLoadingRecommended && user ? (
              <span className="inline-flex items-center gap-1.5 text-orange-500">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:300ms]" />
              </span>
            ) : (
              `${totalMenus} menús`
            )}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">

        {/* ── SKELETON: loading recommended ── */}
        <AnimatePresence mode="wait">
          {showRecommendedSkeleton && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              <RecommendedSkeleton />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EMPTY STATE: no menus at all ── */}
        <AnimatePresence>
          {hasNoMenusForProfile && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                onExplore={() => setShowAll(true)}
                onCreateAI={() => navigate("/app/ai-menu")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PERSONALIZED SECTION (logged in, data ready) ── */}
        <AnimatePresence>
          {user && !showAll && !isLoadingRecommended && recommendedMenus.length > 0 && (
            <motion.section
              key="recommended"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">✨ Recomendados para ti</h2>
                  <p className="text-sm text-muted-foreground">Basados en tu objetivo y preferencias</p>
                </div>
                <button
                  className="text-sm text-[#FF6B35] font-medium hover:underline"
                  onClick={() => setShowAll(true)}
                >
                  Ver todos →
                </button>
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {recommendedMenus.map((menu: any) => (
                  <MenuCard
                    key={menu.id}
                    menu={menu}
                    isRecommended
                    user={user}
                    onDetail={setDetailMenuId}
                    onSave={setSaveMenu}
                    onShoppingList={setShoppingMenu}
                  />
                ))}
              </motion.div>

              {/* CTA Banner */}
              <motion.div
                className="mt-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.35 } }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">¿Quieres un menú 100% personalizado?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Crea tu menú con IA basado en tus restricciones y objetivos nutricionales</p>
                </div>
                <Button
                  className="bg-[#FF6B35] hover:bg-[#e55a25] text-white rounded-xl shrink-0"
                  onClick={() => navigate("/app/ai-menu")}
                >
                  🤖 Crear con IA
                </Button>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── NO RECOMMENDATIONS BUT MENUS EXIST ── */}
        <AnimatePresence>
          {hasMenusButNoneRecommended && !showAll && (
            <motion.div
              key="no-match"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              className="text-center py-10 px-6"
            >
              <div className="text-4xl mb-3">🍽️</div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Actualmente no hay menús adaptados para ti
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ALL MENUS (explore mode or not logged in) ── */}
        <AnimatePresence>
          {(showAll || !user) && (
            <motion.section
              key="all-menus"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
            >
              {showAll && (
                <div className="flex items-center gap-3 mb-4">
                  <button
                    className="text-sm text-[#FF6B35] font-medium hover:underline"
                    onClick={() => setShowAll(false)}
                  >
                    ← Volver a mis recomendados
                  </button>
                  <h2 className="text-lg font-bold text-foreground">Todos los menús</h2>
                </div>
              )}

              {/* Search */}
              <Input
                placeholder="Buscar un menú..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background mb-4"
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
                          : "bg-background text-foreground/80 border-border hover:border-[#FF6B35]"
                      }`}
                    >
                      {g.emoji} {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty filter */}
              <div className="mb-3">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Dificultad</p>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={String(d.id)}
                      onClick={() => setSelectedDifficulty(d.id as any)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        selectedDifficulty === d.id
                          ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                          : "bg-background text-foreground/80 border-border hover:border-[#FF6B35]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diet type filter */}
              <div className="mb-3">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Tipo de dieta</p>
                <div className="flex gap-2 flex-wrap">
                  {DIET_TYPES.map((dt) => (
                    <button
                      key={String(dt.id)}
                      onClick={() => setSelectedDietType(dt.id as any)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        selectedDietType === dt.id
                          ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                          : "bg-background text-foreground/80 border-border hover:border-[#FF6B35]"
                      }`}
                    >
                      {dt.emoji} {dt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calorie range filter */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Calorías diarias</p>
                <div className="flex gap-2 flex-wrap">
                  {CALORIE_RANGES.map((cr) => (
                    <button
                      key={String(cr.id)}
                      onClick={() => setSelectedCalorieRange(cr.id as any)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        selectedCalorieRange === cr.id
                          ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                          : "bg-background text-foreground/80 border-border hover:border-[#FF6B35]"
                      }`}
                    >
                      {cr.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{filtered.length} menús encontrados</span>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-[#FF6B35] font-medium hover:underline"
                  >
                    ✕ Limpiar filtros
                  </button>
                </div>
              )}

              {/* Menu grid */}
              {isLoadingAll ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <MenuCardSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-center py-12 text-muted-foreground"
                >
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
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filtered.map((menu) => (
                    <MenuCard
                      key={menu.id}
                      menu={menu}
                      user={user}
                      onDetail={setDetailMenuId}
                      onSave={setSaveMenu}
                      onShoppingList={setShoppingMenu}
                    />
                  ))}
                </motion.div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

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

      {/* Quick Shopping List Modal */}
      {shoppingMenu && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShoppingMenu(null); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center text-xl">🛒</div>
              <div>
                <h3 className="text-base font-bold text-foreground">Generar lista de la compra</h3>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{shoppingMenu.name}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                Número de personas
              </label>
              <div className="flex items-center gap-4 rounded-2xl bg-muted/30 p-3">
                <button
                  onClick={() => setShoppingPersons(Math.max(1, shoppingPersons - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] shadow-sm text-lg font-bold text-white"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-foreground">{shoppingPersons}</span>
                  <p className="text-xs text-muted-foreground/70">{shoppingPersons === 1 ? "persona" : "personas"}</p>
                </div>
                <button
                  onClick={() => setShoppingPersons(Math.min(12, shoppingPersons + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] shadow-sm text-lg font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShoppingMenu(null)}
                className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShoppingPending(true);
                  generateFromMenu.mutate({ menuId: shoppingMenu.id, persons: shoppingPersons });
                }}
                disabled={shoppingPending || generateFromMenu.isPending}
                className="flex-1 rounded-2xl bg-[#F97316] py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {generateFromMenu.isPending ? "Generando..." : "Generar lista"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
