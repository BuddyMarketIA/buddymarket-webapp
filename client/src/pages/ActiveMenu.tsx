import { useTranslation } from "react-i18next";
import { useState } from "react";
import { jsPDF } from "jspdf";
import { trpc } from "@/lib/trpc";
import { getErrorMessage } from "@/lib/errorUtils";
import { toast } from "@/components/sonner-a11y-shim";
import { useLocation } from "wouter";
import {
  ShoppingCartIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  PlayIcon,
  HomeIcon,
  ScaleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import MercadonaCartExport from "@/components/MercadonaCartExport";
import LidlCartExport from "@/components/LidlCartExport";
import CarrefourCartExport from "@/components/CarrefourCartExport";
import AlcampoCartExport from "@/components/AlcampoCartExport";
import BasketComparator from "@/components/BasketComparator";

// ─── Export menu to PDF ─────────────────────────────────────────────────────
function exportMenuToPDF(
  activeMenu: any,
  dayGroups: Record<number, any[]>,
  getDayDate: (n: number) => Date,
  shoppingItems?: Array<{ id: number; name: string; qty?: string; unit?: string; isPurchased: boolean }>
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 20;

  function addPageHeader() {
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageW, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BuddyMarket — Menú Semanal", margin, 9);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }), pageW - margin, 9, { align: "right" });
  }

  function checkPage(needed = 20) {
    if (y > pageH - needed) {
      doc.addPage();
      addPageHeader();
      y = 22;
    }
  }

  const MEAL_ORDER_ES: Record<string, number> = { desayuno: 1, media_manana: 2, almuerzo: 2, comida: 3, merienda: 4, cena: 5, snack: 6 };
  const allIngredients: Record<string, { qty: number; unit: string }> = {};

  addPageHeader();
  y = 24;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(activeMenu.name ?? "Mi Menú", margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  if (activeMenu.dailyCalories) doc.text(`${activeMenu.dailyCalories} kcal/día · ${Object.keys(dayGroups).length} días`, margin, y);
  y += 10;

  const DAY_NAMES_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const allDays = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

  for (const dayNum of allDays) {
    const parts = (dayGroups[dayNum] ?? []).sort((a: any, b: any) => {
      const ao = MEAL_ORDER_ES[a.dayPartInfo?.apiParam ?? ""] ?? 99;
      const bo = MEAL_ORDER_ES[b.dayPartInfo?.apiParam ?? ""] ?? 99;
      return ao - bo;
    });
    if (parts.length === 0) continue;

    checkPage(30);
    const dayDate = getDayDate(dayNum);
    const dayName = DAY_NAMES_FULL[dayDate.getDay() === 0 ? 6 : dayDate.getDay() - 1] ?? `Día ${dayNum}`;
    const dateStr = dayDate.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

    doc.setFillColor(255, 237, 213);
    doc.roundedRect(margin, y, pageW - margin * 2, 9, 2, 2, "F");
    doc.setFontSize(10.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(194, 65, 12);
    doc.text(`${dayName} — ${dateStr}`, margin + 3, y + 6);
    y += 13;

    for (const dp of parts) {
      checkPage(25);
      // Meal type — use nameEs (correct field from DB join)
      const mealLabel = dp.dayPartInfo?.nameEs ?? dp.dayPartInfo?.name ?? dp.dayPartName ?? "Comida";
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(`  ${mealLabel}`, margin + 2, y);
      y += 5;

      if (dp.recipes?.length > 0) {
        for (const r of dp.recipes) {
          checkPage(18);
          // Recipe data is nested under r.recipe (from DB join in getActive)
          const recipe = r.recipe ?? r;
          const recipeName = recipe.name ?? r.recipeName ?? r.name ?? "Receta";
          const kcal = recipe.caloriesPerServing ? ` · ${recipe.caloriesPerServing} kcal` : "";

          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 30, 30);
          doc.text(`    ▸ ${recipeName}${kcal}`, margin + 4, y);
          y += 5;

          // Macros line
          const macros = [
            recipe.proteinsPerServing ? `P: ${Math.round(recipe.proteinsPerServing)}g` : "",
            recipe.carbsPerServing ? `C: ${Math.round(recipe.carbsPerServing)}g` : "",
            recipe.fatsPerServing ? `G: ${Math.round(recipe.fatsPerServing)}g` : "",
          ].filter(Boolean).join("  ");
          if (macros) {
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(150, 150, 150);
            doc.text(`      ${macros}`, margin + 6, y);
            y += 4;
          }

          // Ingredients from ingredientsJson
          let ingredients: any[] = [];
          try { if (recipe.ingredientsJson) ingredients = JSON.parse(recipe.ingredientsJson); } catch { /* ignore */ }
          if (ingredients.length > 0) {
            checkPage(8);
            const ingParts = ingredients.map((ing: any) => {
              const name = ing.name ?? ing.ingredient ?? "";
              const amt = ing.amount ?? ing.quantity ?? "";
              const unit = ing.unit ?? "";
              if (name) {
                const key = name.toLowerCase();
                if (!allIngredients[key]) allIngredients[key] = { qty: 0, unit };
                allIngredients[key].qty += Number(amt) || 0;
              }
              return amt ? `${amt}${unit ? " " + unit : ""} ${name}`.trim() : name;
            }).filter(Boolean);
            const ingText = `      Ing: ${ingParts.join(" · ")}`;
            const lines = doc.splitTextToSize(ingText, pageW - margin * 2 - 8);
            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(110, 110, 110);
            for (const line of lines) { checkPage(6); doc.text(line, margin + 6, y); y += 4; }
          }
          y += 2;
        }
      } else {
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(170, 170, 170);
        doc.text("    Sin receta asignada", margin + 4, y);
        y += 5;
      }
      y += 2;
    }
    y += 5;
  }

  // ── SHOPPING LIST PAGE ────────────────────────────────────────────────────
  doc.addPage();
  addPageHeader();
  y = 22;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22);
  doc.text("Lista de la Compra", margin, y);
  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text("Ingredientes necesarios para todo el menú", margin, y);
  y += 9;

  if (shoppingItems && shoppingItems.length > 0) {
    shoppingItems.forEach((item) => {
      checkPage(8);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const qty = item.qty ? `${item.qty}${item.unit ? " " + item.unit : ""}` : "";
      doc.text(qty ? `  ☐  ${item.name}  —  ${qty}` : `  ☐  ${item.name}`, margin + 2, y);
      y += 5.5;
    });
  } else {
    const ingEntries = Object.entries(allIngredients);
    if (ingEntries.length === 0) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(160, 160, 160);
      doc.text("Genera la lista de la compra desde la app para ver los ingredientes aquí.", margin, y);
    } else {
      ingEntries.sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, { qty, unit }]) => {
        checkPage(8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        const qtyStr = qty > 0 ? `${Math.round(qty * 10) / 10}${unit ? " " + unit : ""}` : "";
        const capName = name.charAt(0).toUpperCase() + name.slice(1);
        doc.text(qtyStr ? `  ☐  ${capName}  —  ${qtyStr}` : `  ☐  ${capName}`, margin + 2, y);
        y += 5.5;
      });
    }
  }

  // ── PAGE NUMBERS ─────────────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`BuddyMarket · buddymarketapp.com · Página ${i} de ${pageCount}`, pageW / 2, 292, { align: "center" });
  }
  doc.save(`menu-${(activeMenu.name ?? "semanal").replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
// ─────────────────────────────────────────────────────────────────────────────

const SUPERMARKETS = [
  { id: "general", name: "General", emoji: "🛒", available: true },
  { id: "mercadona", name: "Mercadona", emoji: "🟠", available: true },
  { id: "consum", name: "Consum", emoji: "🟢", available: true },
  { id: "lidl", name: "Lidl", emoji: "🔵", available: false },
  { id: "carrefour", name: "Carrefour", emoji: "🔴", available: false },
  { id: "alcampo", name: "Alcampo", emoji: "🟡", available: false },
  { id: "hiperdino", name: "Hiperdino", emoji: "🟤", available: false },
  { id: "dia", name: "Día", emoji: "🟢", available: false },
  { id: "el_corte_ingles", name: "El Corte Inglés", emoji: "🟤", available: false },
];

const SUPERMARKET_SEARCH_URLS: Record<string, (q: string) => string> = {
  general: (q) => `https://www.google.com/search?q=${encodeURIComponent(q + " comprar supermercado")}`,
  consum: (q) => `https://www.consum.es/buscar?q=${encodeURIComponent(q)}`,
  lidl: (q) => `https://www.lidl.es/es/buscar.htm?query=${encodeURIComponent(q)}`,
  carrefour: (q) => `https://www.carrefour.es/supermercado/buscar?query=${encodeURIComponent(q)}`,
  alcampo: (q) => `https://www.alcampo.es/compra-online/buscar/?q=${encodeURIComponent(q)}`,
  dia: (q) => `https://www.dia.es/buscar?text=${encodeURIComponent(q)}`,
  el_corte_ingles: (q) => `https://www.elcorteingles.es/supermercado/buscar/?s=${encodeURIComponent(q)}`,
};

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MEAL_ORDER = ["desayuno", "almuerzo", "comida", "merienda", "cena", "snack"];

function getMealIcon(key: string) {
  const icons: Record<string, string> = {
    desayuno: "☀️", almuerzo: "🥐", comida: "🍽️",
    merienda: "🍎", cena: "🌙", snack: "🥜",
  };
  return icons[key] ?? "🍴";
}

function groupByDay(dayParts: any[]) {
  const groups: Record<number, any[]> = {};
  for (const dp of dayParts) {
    const day = dp.dayNumber ?? 1;
    if (!groups[day]) groups[day] = [];
    groups[day].push(dp);
  }
  return groups;
}

// ── Inline Mercadona-style list view ─────────────────────────────────────────
interface GeneratedListItem {
  id: number;
  name: string;
  qty?: string;
  unit?: string;
  isPurchased: boolean;
  inPantry?: boolean;
}

interface MercadonaListModalProps {
  items: GeneratedListItem[];
  supermarket: string;
  onClose: () => void;
}

function MercadonaListModal({ items, supermarket, onClose }: MercadonaListModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <MercadonaCartExport
          items={items}
          onBack={onClose}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

// ── Non-Mercadona generic list modal ─────────────────────────────────────────
interface GenericListModalProps {
  items: GeneratedListItem[];
  supermarket: string;
  supermarketName: string;
  onClose: () => void;
}

function GenericListModal({ items, supermarket, supermarketName, onClose }: GenericListModalProps) {
  const utils = trpc.useUtils();
  const [localItems, setLocalItems] = useState<GeneratedListItem[]>(items);
  const togglePantry = trpc.shoppingLists.togglePantry.useMutation({
    onMutate: async ({ id }) => {
      setLocalItems(prev => prev.map(item =>
        item.id === id ? { ...item, inPantry: !item.inPantry } : item
      ));
    },
  });
  const searchFn = SUPERMARKET_SEARCH_URLS[supermarket];
  const pending = localItems.filter((i) => !i.isPurchased && !i.inPantry);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">
            {SUPERMARKETS.find((s) => s.id === supermarket)?.emoji} {supermarketName}
          </h3>
          <button onClick={onClose} className="text-muted-foreground/70 text-xl font-bold" aria-label="Cerrar">×</button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          {pending.length} productos de tu menú. Pulsa en cada uno para buscarlo en {supermarketName}.
        </p>
        {searchFn && (
          <button
            onClick={() => {
              pending.forEach((item, idx) => {
                setTimeout(() => window.open(searchFn(item.name), "_blank"), idx * 400);
              });
              toast.success(`Abriendo ${pending.length} búsquedas en ${supermarketName}`);
            }}
            className="mb-4 w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white"
            style={{ background: "#FF6B35" }}
          >
            <ShoppingCartIcon className="h-4 w-4" />
            Buscar todos los productos ({pending.length})
          </button>
        )}
        {/* In-pantry info hint */}
        {localItems.filter(i => i.inPantry).length === 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-2xl bg-green-50 p-3">
            <HomeIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <p className="text-xs text-green-700"><span className="font-semibold">¿Ya tienes algo en casa?</span> Pulsa 🏠 para marcarlo como en despensa.</p>
          </div>
        )}
        <div className="space-y-2">
          {localItems.filter(i => !i.isPurchased).map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                item.inPantry
                  ? "border-green-200 bg-green-50"
                  : "border-border/50 hover:border-orange-300 hover:bg-orange-50"
              }`}
            >
              {/* Link to search */}
              <a
                href={!item.inPantry && searchFn ? searchFn(item.name) : undefined}
                onClick={item.inPantry ? (e) => e.preventDefault() : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center gap-3 min-w-0"
              >
                {item.inPantry
                  ? <HomeIcon className="h-4 w-4 shrink-0 text-green-500" />
                  : <ShoppingCartIcon className="h-4 w-4 shrink-0 text-[#FF6B35]" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-sm font-medium truncate ${item.inPantry ? "text-green-700" : "text-foreground"}`}>{item.name}</p>
                    {item.inPantry && <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">despensa</span>}
                  </div>
                  {(item.qty || item.unit) && (
                    <p className="text-xs text-muted-foreground/70">{item.qty} {item.unit}</p>
                  )}
                </div>
                {!item.inPantry && (
                  <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
              {/* Pantry toggle */}
              <button
                onClick={() => {
                  togglePantry.mutate({ id: item.id });
                  if (!item.inPantry) toast.success("Marcado como en despensa");
                }}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all ${
                  item.inPantry ? "bg-green-500 text-white" : "text-gray-300 hover:bg-green-50 hover:text-green-500"
                }`}
                title={item.inPantry ? "Quitar de despensa" : "Marcar como en despensa"}
              >
                <HomeIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        {localItems.filter(i => i.inPantry).length > 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground/70">
            {localItems.filter(i => i.inPantry).length} producto(s) marcados como en despensa (no se compran)
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// ── MEAL TIME LABELS ─────────────────────────────────────────────────────────
const MEAL_TIME_LABELS: Record<string, string> = {
  desayuno: "Desayuno", media_manana: "Media mañana", comida: "Comida",
  merienda: "Merienda", cena: "Cena", otro: "Otro",
};
const MEAL_TIME_EMOJIS: Record<string, string> = {
  desayuno: "☀️", media_manana: "🥐", comida: "🍽️",
  merienda: "🍎", cena: "🌙", otro: "✨",
};

// ── PREDEFINED COMPLEMENTS ────────────────────────────────────────────────────
const PRESET_COMPLEMENTS = [
  { emoji: "☕", name: "Café solo", mealTime: "media_manana", calories: 5, unit: "taza" },
  { emoji: "☕", name: "Café con leche", mealTime: "desayuno", calories: 60, unit: "taza" },
  { emoji: "🍵", name: "Infusión", mealTime: "cena", calories: 2, unit: "taza" },
  { emoji: "🥛", name: "Vaso de leche", mealTime: "desayuno", calories: 120, unit: "vaso" },
  { emoji: "💪", name: "Batido de proteínas", mealTime: "otro", calories: 150, unit: "toma" },
  { emoji: "🍌", name: "Plátano", mealTime: "media_manana", calories: 90, unit: "ud" },
  { emoji: "🥜", name: "Puñado de frutos secos", mealTime: "merienda", calories: 170, unit: "puñado" },
  { emoji: "🍫", name: "Onza de chocolate negro", mealTime: "merienda", calories: 50, unit: "onza" },
  { emoji: "🧃", name: "Zumo natural", mealTime: "desayuno", calories: 80, unit: "vaso" },
  { emoji: "💊", name: "Suplemento vitamínico", mealTime: "desayuno", calories: 0, unit: "toma" },
];

export default function ActiveMenu() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>("mercadona");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showMercadonaModal, setShowMercadonaModal] = useState(false);
  const [showLidlModal, setShowLidlModal] = useState(false);
  const [showCarrefourModal, setShowCarrefourModal] = useState(false);
  const [showAlcampoModal, setShowAlcampoModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GeneratedListItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingListInfo, setExistingListInfo] = useState<{ id: number; name: string } | null>(null);
  // ── Name editing ──────────────────────────────────────────────────────────
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  // ── Recipe detail expansion ───────────────────────────────────────────────
  const [expandedRecipeId, setExpandedRecipeId] = useState<number | null>(null);
  // ── Complements panel ─────────────────────────────────────────────────────
  const [showComplements, setShowComplements] = useState(false);
  const [showAddComplement, setShowAddComplement] = useState(false);
  const [newComplement, setNewComplement] = useState({ name: "", emoji: "☕", mealTime: "media_manana" as string, quantity: 1, unit: "ud", calories: 0, notes: "", isDefault: false });
  const utils = trpc.useUtils();

  const { data: activeMenu, isLoading } = trpc.menus.getActive.useQuery();

  // ── Rename mutation ──────────────────────────────────────────────────────────
  const renameMenu = trpc.menus.rename.useMutation({
    onSuccess: () => { toast.success("Nombre actualizado"); utils.menus.getActive.invalidate(); setIsEditingName(false); },
    onError: (e) => toast.error(getErrorMessage(e, "Error inesperado")),
  });

  // ── Complements queries & mutations ──────────────────────────────────────────
  const menuId = activeMenu?.id ?? 0;
  const { data: menuComplements = [] } = trpc.menus.listComplements.useQuery(
    { menuId },
    { enabled: !!activeMenu?.id },
  );
  const addComplement = trpc.menus.addComplement.useMutation({
    onSuccess: () => { toast.success("Complemento añadido"); utils.menus.listComplements.invalidate({ menuId }); setShowAddComplement(false); setNewComplement({ name: "", emoji: "☕", mealTime: "media_manana", quantity: 1, unit: "ud", calories: 0, notes: "", isDefault: false }); },
    onError: (e) => toast.error(getErrorMessage(e, "Error inesperado")),
  });
  const removeComplement = trpc.menus.removeComplement.useMutation({
    onSuccess: () => { toast.success("Complemento eliminado"); utils.menus.listComplements.invalidate({ menuId }); },
    onError: (e) => toast.error(getErrorMessage(e, "Error inesperado")),
  });

  const generateShoppingList = trpc.shoppingLists.generateFromMenu.useMutation({
    onSuccess: async (data) => {
      setIsGenerating(false);
      // Handle duplicate detection — backend signals requiresConfirmation
      if ((data as any).requiresConfirmation) {
        setExistingListInfo({ id: (data as any).existingListId, name: (data as any).existingListName });
        setShowDuplicateDialog(true);
        return;
      }
      // Fetch the generated list items to show in the modal
      utils.shoppingLists.list.invalidate();
      // Get the list items via getById
      if (data.shoppingListId && data.shoppingListId > 0) {
        try {
          const listData = await utils.shoppingLists.getById.fetch({ id: data.shoppingListId });
          const items: GeneratedListItem[] = (listData as any)?.items?.map((i: any) => ({
            id: i.id,
            name: i.ingredient?.name ?? i.customName ?? i.name ?? "Producto",
            qty: i.amount ? String(Math.round(i.amount * 10) / 10) : "",
            unit: i.measure?.name ?? i.unit ?? "",
            isPurchased: i.isPurchased ?? false,
            inPantry: i.inPantry ?? false,
          })) ?? [];
          if (items.length === 0) {
            // Lista vacía: las recetas del menú no tienen ingredientes definidos
            toast.success("✅ Lista creada. Añade ingredientes a tus recetas para que aparezcan aquí.", { duration: 5000 });
            navigate("/app/shopping-lists");
            return;
          }
          setGeneratedItems(items);
          if (selectedSupermarket === "mercadona") {
            setShowMercadonaModal(true);
          } else if (selectedSupermarket === "consum") {
            setShowGenericModal(true);
          } else if (selectedSupermarket === "lidl") {
            setShowLidlModal(true);
          } else if (selectedSupermarket === "carrefour") {
            setShowCarrefourModal(true);
          } else if (selectedSupermarket === "alcampo") {
            setShowAlcampoModal(true);
          } else {
            setShowGenericModal(true);
          }
        } catch {
          // Fallback: navigate to shopping lists
          toast.success("¡Lista generada! Ve a Mis Listas para verla.");
          navigate("/app/shopping-lists");
        }
      } else {
        toast.success("¡Lista generada! Ve a Mis Listas para verla.");
        navigate("/app/shopping-lists");
      }
    },
    onError: (err) => {
      setIsGenerating(false);
      toast.error("Error al generar la lista: " + getErrorMessage(err, "inténtalo de nuevo"));
    },
  });

  const confirmDayPart = trpc.menus.confirmDayPart.useMutation({
    onSuccess: (data, vars) => {
      if (vars.undo) {
        toast.success("Comida desmarcada del diario");
      } else {
        toast.success(data.logsCreated > 0 ? `✅ ${data.logsCreated} receta(s) añadidas al diario` : "✅ Comida confirmada");
      }
      utils.menus.getActive.invalidate();
      utils.mealLogs.dailySummary.invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Error inesperado")),
  });

  if (isLoading) {
    return (
      <div className="vively-page">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-2xl bg-muted/50" />
          <div className="h-48 rounded-2xl bg-muted/50" />
          <div className="h-48 rounded-2xl bg-muted/50" />
        </div>
      </div>
    );
  }

  if (!activeMenu) {
    return (
      <div className="vively-page flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="text-5xl">📋</div>
        <h2 className="text-xl font-bold text-foreground">No tienes ningún menú activo</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Ve a la biblioteca de menús, elige uno y guárdalo para activarlo como tu menú en curso.
        </p>
        <button
          onClick={() => navigate("/app/menu-library")}
          className="mt-2 px-6 py-3 rounded-2xl bg-[#FF6B35] text-white font-bold text-sm"
        >
          Ir a la biblioteca de menús
        </button>
      </div>
    );
  }

  const dayGroups = groupByDay(activeMenu.dayParts ?? []);
  const totalDays = Object.keys(dayGroups).length;
  const allDayNumbers = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

  const startDate = activeMenu.startDate ? new Date(activeMenu.startDate) : new Date();

  function getDayDate(dayNumber: number) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayNumber - 1);
    return d;
  }

  function isToday(dayNumber: number) {
    const d = getDayDate(dayNumber);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }

  const activeDayNum = selectedDay ?? (allDayNumbers.find(isToday) ?? allDayNumbers[0]);
  const activeDayParts = (dayGroups[activeDayNum] ?? []).sort((a: any, b: any) => {
    const ai = MEAL_ORDER.indexOf(a.dayPartInfo?.apiParam ?? "");
    const bi = MEAL_ORDER.indexOf(b.dayPartInfo?.apiParam ?? "");
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const completedDps = (activeMenu.dayParts ?? []).filter((dp: any) => dp.completed).length;
  const progressPct = activeMenu.dayParts?.length ? Math.round((completedDps / activeMenu.dayParts.length) * 100) : 0;

  const handleGenerateList = (replaceExisting = false) => {
    setShowDuplicateDialog(false);
    setIsGenerating(true);
    generateShoppingList.mutate({
      menuId: activeMenu.id,
      persons: activeMenu.persons ?? 1,
      supermarket: selectedSupermarket as any,
      name: `Lista - ${activeMenu.name}`,
      replaceExisting,
    });
  };

  const selectedSupermarketInfo = SUPERMARKETS.find((s) => s.id === selectedSupermarket);

  return (
    <div className="vively-page pb-24">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate("/app/menus")} className="flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm">
            <ChevronLeftIcon className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-wide">Menú en curso</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  autoFocus
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameMenu.mutate({ id: activeMenu.id, name: editNameValue.trim() || activeMenu.name });
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="flex-1 min-w-0 rounded-xl border border-[#FF6B35] px-3 py-1.5 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                />
                <button onClick={() => renameMenu.mutate({ id: activeMenu.id, name: editNameValue.trim() || activeMenu.name })} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6B35] text-white">
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button onClick={() => setIsEditingName(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground truncate">{activeMenu.name}</h1>
                <button
                  onClick={() => { setEditNameValue(activeMenu.name); setIsEditingName(true); }}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/70 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                  title="Editar nombre"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="vively-card p-3 text-center">
            <CalendarDaysIcon className="h-5 w-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalDays}</p>
            <p className="text-xs text-muted-foreground">días</p>
          </div>
          <div className="vively-card p-3 text-center">
            <FireIcon className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{activeMenu.dailyCalories ?? "—"}</p>
            <p className="text-xs text-muted-foreground">kcal/día</p>
          </div>
          <div className="vively-card p-3 text-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{progressPct}%</p>
            <p className="text-xs text-muted-foreground">completado</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="vively-card p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-foreground/80">Progreso semanal</span>
            <span className="text-sm text-muted-foreground">{completedDps}/{activeMenu.dayParts?.length ?? 0} comidas</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #FF6B35, #f59e0b)" }}
            />
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {allDayNumbers.map((dayNum) => {
          const date = getDayDate(dayNum);
          const today = isToday(dayNum);
          const active = dayNum === activeDayNum;
          const dayDps = dayGroups[dayNum] ?? [];
          const allDone = dayDps.length > 0 && dayDps.every((dp: any) => dp.completed);
          return (
            <button
              key={dayNum}
              onClick={() => setSelectedDay(dayNum)}
              className="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl transition-all"
              style={{
                background: active ? "#FF6B35" : today ? "#fff7f4" : "white",
                border: today && !active ? "2px solid #FF6B35" : "2px solid transparent",
                boxShadow: active ? "0 4px 12px rgba(255,107,53,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
                minWidth: "52px",
              }}
            >
              <span className="text-xs font-bold" style={{ color: active ? "white" : "#6b7280" }}>
                {DAY_NAMES[(date.getDay() + 6) % 7]}
              </span>
              <span className="text-base font-extrabold" style={{ color: active ? "white" : "#1f2937" }}>
                {date.getDate()}
              </span>
              {allDone && <CheckCircleSolid className="h-3.5 w-3.5 mt-0.5" style={{ color: active ? "rgba(255,255,255,0.8)" : "#22c55e" }} />}
              {!allDone && today && <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Day meals */}
      <div className="space-y-3 mb-6">
        {activeDayParts.length === 0 ? (
          <div className="vively-card p-6 text-center">
            <p className="text-muted-foreground/70 text-sm">No hay comidas planificadas para este día</p>
          </div>
        ) : (
          activeDayParts.map((dp: any) => (
            <div
              key={dp.id}
              className="vively-card p-4"
              style={{ borderLeft: dp.completed ? "3px solid #22c55e" : "3px solid #e5e7eb" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getMealIcon(dp.dayPartInfo?.apiParam ?? "")}</span>
                  <span className="text-sm font-bold text-foreground">
                    {dp.dayPartInfo?.nameEs ?? dp.dayPartInfo?.apiParam ?? "Comida"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const logDate = getDayDate(activeDayNum).toISOString().split("T")[0];
                    confirmDayPart.mutate({ dayPartId: dp.id, logDate, undo: dp.completed });
                  }}
                  disabled={confirmDayPart.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: dp.completed ? "#dcfce7" : "#FF6B35",
                    color: dp.completed ? "#16a34a" : "white",
                  }}
                >
                  {dp.completed ? (
                    <><CheckCircleSolid className="h-3.5 w-3.5" />Confirmado</>
                  ) : (
                    <><PlayIcon className="h-3.5 w-3.5" />Confirmar</>
                  )}
                </button>
              </div>
              {dp.recipes?.length > 0 ? (
                <div className="space-y-2">
                  {dp.recipes.map((r: any) => {
                    const isExpanded = expandedRecipeId === r.recipe?.id;
                    const ingredients = r.recipe?.ingredientsJson ? (() => { try { return JSON.parse(r.recipe.ingredientsJson); } catch { return []; } })() : [];
                    const steps = r.recipe?.stepsJson ? (() => { try { return JSON.parse(r.recipe.stepsJson); } catch { return []; } })() : [];
                    return (
                      <div key={r.id} className="rounded-2xl border border-border/50 overflow-hidden bg-background">
                        {/* Recipe header — always visible */}
                        <button
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-orange-50/50 transition-colors"
                          onClick={() => setExpandedRecipeId(isExpanded ? null : (r.recipe?.id ?? null))}
                        >
                          {r.recipe?.imageUrl ? (
                            <img src={r.recipe.imageUrl} alt={r.recipe.name} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-2xl">🍽️</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">{r.recipe?.name ?? "Receta"}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {r.recipe?.preparationTime && (
                                <span className="text-xs text-muted-foreground/70 flex items-center gap-0.5">
                                  <ClockIcon className="h-3 w-3" />{r.recipe.preparationTime}min
                                </span>
                              )}
                              {r.recipe?.caloriesPerServing && (
                                <span className="text-xs text-orange-500 flex items-center gap-0.5 font-semibold">
                                  <FireIcon className="h-3 w-3" />{r.recipe.caloriesPerServing}kcal
                                </span>
                              )}
                              {r.recipe?.difficulty && (
                                <span className="text-xs bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-full">{{ easy: "Fácil", facil: "Fácil", medium: "Media", medio: "Media", hard: "Difícil", dificil: "Difícil" }[r.recipe.difficulty as string] ?? r.recipe.difficulty}</span>
                              )}
                              {r.servings && r.servings !== 1 && (
                                <span className="text-xs text-muted-foreground/70">×{r.servings} raciones</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-muted-foreground/70">
                            {isExpanded ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-border/50 px-3 pb-3 pt-2 space-y-3">
                            {/* Ingredients */}
                            {ingredients.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">🫙 Ingredientes</p>
                                <div className="space-y-1">
                                  {ingredients.map((ing: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#FF6B35] flex-shrink-0" />
                                      <span className="text-foreground/80">
                                        {ing.amount && <span className="font-semibold text-foreground">{ing.amount} {ing.unit} </span>}
                                        {ing.name ?? ing.ingredient?.name ?? JSON.stringify(ing)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Instructions */}
                            {steps.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">👨‍🍳 Preparación</p>
                                <ol className="space-y-2">
                                  {steps.map((step: any, idx: number) => (
                                    <li key={idx} className="flex gap-2 text-sm">
                                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-[#FF6B35] text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                                      <span className="text-foreground/80 leading-relaxed">{step.description ?? step.instruction ?? step.step ?? JSON.stringify(step)}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            )}
                            {/* Nutrition */}
                            {(r.recipe?.caloriesPerServing || r.recipe?.proteinPerServing || r.recipe?.carbsPerServing || r.recipe?.fatPerServing) && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">📊 Valores nutricionales (por ración)</p>
                                <div className="grid grid-cols-4 gap-2">
                                  {[{label:"Kcal",val:r.recipe.caloriesPerServing,color:"#FF6B35"},{label:"Prot.",val:r.recipe.proteinPerServing ? r.recipe.proteinPerServing+"g" : null,color:"#3b82f6"},{label:"Carbs",val:r.recipe.carbsPerServing ? r.recipe.carbsPerServing+"g" : null,color:"#f59e0b"},{label:"Grasa",val:r.recipe.fatPerServing ? r.recipe.fatPerServing+"g" : null,color:"#10b981"}].filter(n=>n.val).map(n=>(
                                    <div key={n.label} className="rounded-xl bg-muted/30 p-2 text-center">
                                      <p className="text-xs font-bold" style={{color:n.color}}>{n.val}</p>
                                      <p className="text-[10px] text-muted-foreground/70">{n.label}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Fallback if no structured data */}
                            {ingredients.length === 0 && steps.length === 0 && (
                              <p className="text-xs text-muted-foreground/70 italic text-center py-2">No hay detalles disponibles para esta receta</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground/70 italic">Sin recetas asignadas</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── COMPLEMENTS SECTION ───────────────────────────────────────────────────────────── */}
      <div className="vively-card p-4 mb-4">
        {/* Header */}
        <button
          className="w-full flex items-center justify-between"
          onClick={() => setShowComplements(!showComplements)}
        >
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <BeakerIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Complementos</p>
              <p className="text-xs text-muted-foreground/70">{menuComplements.length} extras • café, batidos, snacks…</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {menuComplements.length > 0 && (
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{menuComplements.length}</span>
            )}
            {showComplements ? <ChevronUpIcon className="h-4 w-4 text-muted-foreground/70" /> : <ChevronDownIcon className="h-4 w-4 text-muted-foreground/70" />}
          </div>
        </button>

        {showComplements && (
          <div className="mt-3 space-y-3">
            {/* Existing complements grouped by meal time */}
            {menuComplements.length > 0 ? (
              <div className="space-y-2">
                {Object.entries(
                  menuComplements.reduce((acc: Record<string, any[]>, c: any) => {
                    const key = c.mealTime ?? "otro";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(c);
                    return acc;
                  }, {})
                ).map(([mealTime, items]) => (
                  <div key={mealTime}>
                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wide mb-1.5">
                      {MEAL_TIME_EMOJIS[mealTime]} {MEAL_TIME_LABELS[mealTime] ?? mealTime}
                    </p>
                    <div className="space-y-1.5">
                      {(items as any[]).map((c: any) => (
                        <div key={c.id} className="flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2">
                          <span className="text-xl flex-shrink-0">{c.emoji ?? "☕"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {c.customName ?? c.complement?.nameEs ?? c.complement?.name ?? "Complemento"}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {c.quantity} {c.unit}{c.calories ? ` • ${c.calories} kcal` : ""}
                              {c.isDefault && <span className="ml-1 text-purple-500">• siempre</span>}
                            </p>
                          </div>
                          <button
                            onClick={() => removeComplement.mutate({ id: c.id })}
                            className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70 text-center py-2">Aún no tienes complementos en este menú</p>
            )}

            {/* Quick-add presets */}
            {!showAddComplement && (
              <div>
                <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wide mb-2">Añadir rápido</p>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {PRESET_COMPLEMENTS.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => addComplement.mutate({ menuId: activeMenu.id, customName: p.name, emoji: p.emoji, mealTime: p.mealTime as any, quantity: 1, unit: p.unit, calories: p.calories })}
                      disabled={addComplement.isPending}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground/80 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <span>{p.emoji}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom complement form */}
            {showAddComplement ? (
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-3 space-y-2">
                <p className="text-xs font-bold text-purple-700">Complemento personalizado</p>
                <div className="flex gap-2">
                  <input
                    value={newComplement.emoji}
                    onChange={(e) => setNewComplement(p => ({ ...p, emoji: e.target.value }))}
                    className="w-14 rounded-xl border border-purple-200 bg-background px-2 py-2 text-center text-lg outline-none"
                    placeholder="☕"
                    maxLength={2}
                  />
                  <input
                    value={newComplement.name}
                    onChange={(e) => setNewComplement(p => ({ ...p, name: e.target.value }))}
                    className="flex-1 rounded-xl border border-purple-200 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-300"
                    placeholder="Nombre (ej: Café solo)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newComplement.mealTime}
                    onChange={(e) => setNewComplement(p => ({ ...p, mealTime: e.target.value }))}
                    className="rounded-xl border border-purple-200 bg-background px-3 py-2 text-sm outline-none"
                  >
                    {Object.entries(MEAL_TIME_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{MEAL_TIME_EMOJIS[k]} {v}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newComplement.calories}
                    onChange={(e) => setNewComplement(p => ({ ...p, calories: Number(e.target.value) }))}
                    className="rounded-xl border border-purple-200 bg-background px-3 py-2 text-sm outline-none"
                    placeholder="Kcal (opcional)"
                    min={0}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-purple-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newComplement.isDefault}
                      onChange={(e) => setNewComplement(p => ({ ...p, isDefault: e.target.checked }))}
                      className="rounded"
                    />
                    Siempre incluir al copiar este menú
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!newComplement.name.trim()) { toast.error("Escribe un nombre"); return; }
                      addComplement.mutate({ menuId: activeMenu.id, customName: newComplement.name.trim(), emoji: newComplement.emoji, mealTime: newComplement.mealTime as any, quantity: newComplement.quantity, unit: newComplement.unit, calories: newComplement.calories || undefined, isDefault: newComplement.isDefault });
                    }}
                    disabled={addComplement.isPending}
                    className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button onClick={() => setShowAddComplement(false)} className="px-4 py-2 rounded-xl bg-background border border-border text-sm text-muted-foreground">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddComplement(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-2.5 text-sm font-semibold text-muted-foreground/70 hover:border-purple-300 hover:text-purple-600 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Añadir complemento personalizado
              </button>
            )}
          </div>
        )}
      </div>

      {/* Shopping list CTA — new design */}
      <div className="rounded-3xl overflow-hidden mb-4 shadow-lg">
        {/* Header */}
        <div className="p-5" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-2xl bg-background/10 flex items-center justify-center flex-shrink-0">
              <ShoppingCartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Lista de la compra</h3>
              <p className="text-xs text-white/50">Genera los ingredientes de toda la semana</p>
            </div>
          </div>
        </div>

        {/* Supermarket selector */}
        <div className="bg-background px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Elige tu supermercado</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {SUPERMARKETS.map((s) => (
              <div key={s.id} className="relative flex-shrink-0">
                <button
                  onClick={() => s.available ? setSelectedSupermarket(s.id) : undefined}
                  disabled={!s.available}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border-2 ${!s.available ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{
                    background: selectedSupermarket === s.id ? "#FF6B35" : "white",
                    color: selectedSupermarket === s.id ? "white" : "#6b7280",
                    borderColor: selectedSupermarket === s.id ? "#FF6B35" : "#f3f4f6",
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.name}</span>
                </button>
                {!s.available && (
                  <span className="absolute -top-2 -right-1 bg-gray-400 text-white text-[8px] font-bold px-1 py-0.5 rounded-full leading-none">Pronto</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="bg-background px-4 pb-4">
          {/* Mercadona badge */}
          {selectedSupermarket === "mercadona" && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-green-50 border border-green-100 px-3 py-2">
              <span className="text-green-600 text-sm">🟢</span>
              <p className="text-xs text-green-700 font-semibold">
                Integración directa con Mercadona — verás productos reales con foto y precio
              </p>
            </div>
          )}
          {/* Consum badge */}
          {selectedSupermarket === "consum" && (
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-green-50 border border-green-100 px-3 py-2">
              <span className="text-green-600 text-sm">🟢</span>
              <p className="text-xs text-green-700 font-semibold">
                Búsqueda de productos Consum — encuentra productos con foto y precio
              </p>
            </div>
          )}
          {generatedItems.length > 0 && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors mb-2"
            >
              <ScaleIcon className="h-4 w-4" />
              Comparar precios entre supermercados
            </button>
          )}
          <button
            onClick={() => handleGenerateList(false)}
            disabled={isGenerating || generateShoppingList.isPending}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #FF6B35, #f59e0b)", color: "white", boxShadow: "0 4px 16px rgba(255,107,53,0.35)" }}
          >
            {isGenerating || generateShoppingList.isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando lista...
              </>
            ) : (
              <>
                <ShoppingCartIcon className="h-4 w-4" />
                {selectedSupermarket === "mercadona"
                  ? `Generar lista para Mercadona`
                  : `Generar lista${selectedSupermarketInfo ? ` para ${selectedSupermarketInfo.name}` : ""}`}
              </>
            )}
          </button>
        </div>
      </div>

      {/* PDF + Change menu */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            try {
              exportMenuToPDF(activeMenu, dayGroups, getDayDate, generatedItems.length > 0 ? generatedItems : undefined);
              toast.success("PDF descargado correctamente");
            } catch {
              toast.error("Error al generar el PDF");
            }
          }}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
          style={{ background: "#FFF7ED", color: "#EA580C", border: "1.5px solid #FED7AA" }}
          title="Descargar menú en PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Descargar PDF
        </button>
        <button
          onClick={() => navigate("/app/menu-library")}
          className="flex-1 py-3 rounded-2xl font-semibold text-sm text-muted-foreground bg-background border border-border"
        >
          Cambiar menú
        </button>
      </div>

      {/* Mercadona modal */}
      {showMercadonaModal && generatedItems.length > 0 && (
        <MercadonaListModal
          items={generatedItems}
          supermarket={selectedSupermarket}
          onClose={() => setShowMercadonaModal(false)}
        />
      )}

      {/* Lidl modal */}
      {showLidlModal && generatedItems.length > 0 && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLidlModal(false); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <LidlCartExport
              items={generatedItems}
              onBack={() => setShowLidlModal(false)}
              onClose={() => setShowLidlModal(false)}
            />
          </div>
        </div>
      )}

      {/* Carrefour modal */}
      {showCarrefourModal && generatedItems.length > 0 && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCarrefourModal(false); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <CarrefourCartExport
              items={generatedItems}
              onBack={() => setShowCarrefourModal(false)}
              onClose={() => setShowCarrefourModal(false)}
            />
          </div>
        </div>
      )}

      {/* Alcampo modal */}
      {showAlcampoModal && generatedItems.length > 0 && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAlcampoModal(false); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <AlcampoCartExport
              items={generatedItems}
              onBack={() => setShowAlcampoModal(false)}
              onClose={() => setShowAlcampoModal(false)}
            />
          </div>
        </div>
      )}

      {/* Basket Comparator modal */}
      {showCompareModal && generatedItems.length > 0 && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCompareModal(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <BasketComparator
              items={generatedItems.map((i) => ({
                name: i.name,
                qty: i.qty,
                unit: i.unit,
              }))}
              onClose={() => setShowCompareModal(false)}
            />
          </div>
        </div>
      )}

      {/* Generic supermarket modal */}
      {showGenericModal && generatedItems.length > 0 && (
        <GenericListModal
          items={generatedItems}
          supermarket={selectedSupermarket}
          supermarketName={selectedSupermarketInfo?.name ?? selectedSupermarket}
          onClose={() => setShowGenericModal(false)}
        />
      )}

      {/* Duplicate list confirmation dialog */}
      {showDuplicateDialog && existingListInfo && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDuplicateDialog(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-lg font-bold text-foreground mb-2">Ya existe una lista</h3>
              <p className="text-sm text-muted-foreground">
                Ya tienes una lista de la compra para este menú en <strong>{selectedSupermarketInfo?.name ?? selectedSupermarket}</strong>.
                ¿Qué quieres hacer?
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleGenerateList(true)}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #FF6B35, #f59e0b)" }}
              >
                🔄 Reemplazar lista existente
              </button>
              <button
                onClick={() => {
                  setShowDuplicateDialog(false);
                  navigate("/app/shopping-lists");
                }}
                className="w-full py-3 rounded-2xl font-bold text-sm bg-muted/50 text-foreground/80"
              >
                👁 Ver lista existente
              </button>
              <button
                onClick={() => setShowDuplicateDialog(false)}
                className="w-full py-2 text-sm text-muted-foreground/70"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
