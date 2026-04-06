import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { jsPDF } from "jspdf";
import MercadonaCartExport from "@/components/MercadonaCartExport";
import LidlCartExport from "@/components/LidlCartExport";
import CarrefourCartExport from "@/components/CarrefourCartExport";
import AlcampoCartExport from "@/components/AlcampoCartExport";
import BasketComparator from "@/components/BasketComparator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PlusIcon,
  ChevronLeftIcon,
  TrashIcon,
  CheckIcon,
  ShoppingCartIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  CameraIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
  DocumentDuplicateIcon,
  HomeIcon,
  FunnelIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";

// Supermarket online search URL builders
const SUPERMARKET_SEARCH_URLS: Record<string, (q: string) => string> = {
  mercadona: (q) => `https://tienda.mercadona.es/search-results?query=${encodeURIComponent(q)}`,
  carrefour: (q) => `https://www.carrefour.es/supermercado/buscar?query=${encodeURIComponent(q)}`,
  lidl: (q) => `https://www.lidl.es/es/buscar.htm?query=${encodeURIComponent(q)}`,
  alcampo: (q) => `https://www.alcampo.es/compra-online/buscar/?q=${encodeURIComponent(q)}`,
  dia: (q) => `https://www.dia.es/buscar?text=${encodeURIComponent(q)}`,
  el_corte_ingles: (q) => `https://www.elcorteingles.es/supermercado/buscar/?s=${encodeURIComponent(q)}`,
  consum: (q) => `https://www.consum.es/es/buscar?q=${encodeURIComponent(q)}`,
  eroski: (q) => `https://www.eroski.es/buscar?q=${encodeURIComponent(q)}`,
};

const SUPERMARKET_OPTIONS = [
  { id: "mercadona", name: "Mercadona", emoji: "🟠", available: true },
  { id: "consum", name: "Consum", emoji: "🟢", available: true },
  { id: "lidl", name: "Lidl", emoji: "🔵", available: false },
  { id: "carrefour", name: "Carrefour", emoji: "🔴", available: false },
  { id: "alcampo", name: "Alcampo", emoji: "🟡", available: false },
  { id: "hiperdino", name: "Hiperdino", emoji: "🟤", available: false },
  { id: "dia", name: "Día", emoji: "🟢", available: false },
  { id: "el_corte_ingles", name: "El Corte Inglés", emoji: "🟤", available: false },
];

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

// View filter types
type ViewFilter = "all" | "to_buy" | "in_pantry" | "purchased";

function ShoppingListDetail({ listId, onBack }: { listId: number; onBack: () => void }) {
  const { t } = useTranslation();
  const { data: listData, isLoading } = trpc.shoppingLists.getById.useQuery({ id: listId });
  const utils = trpc.useUtils();
  const [newItem, setNewItem] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(null);
  const [showMercadonaCart, setShowMercadonaCart] = useState(false);
  const [showLidlCart, setShowLidlCart] = useState(false);
  const [showCarrefourCart, setShowCarrefourCart] = useState(false);
  const [showAlcampoCart, setShowAlcampoCart] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [showShare, setShowShare] = useState(false);

  // Generate PDF of the shopping list
  function generatePDF() {
    const listName = (listData as any)?.list?.name ?? (listData as any)?.name ?? t("shoppingList.title", "Shopping list");
    const items = (listData?.items ?? []) as any[];
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("BuddyMarket", 14, 12);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Lista de la compra", 14, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }), pageW - 14, 20, { align: "right" });

    y = 40;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(listName, 14, y);
    y += 8;

    // Stats bar
    const total = items.length;
    const purchased = items.filter((i) => i.isPurchased || i.inPantry).length;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`${purchased}/${total} productos listos`, 14, y);
    y += 8;

    // Separator
    doc.setDrawColor(230, 230, 230);
    doc.line(14, y, pageW - 14, y);
    y += 6;

    // Group by category
    const grouped: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const cat = item.ingredient?.foodCategory?.name ?? item.category ?? "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    Object.entries(grouped).forEach(([cat, catItems]) => {
      if (y > 270) { doc.addPage(); y = 20; }
      // Category header
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(14, y - 4, pageW - 28, 8, 2, 2, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text(cat.toUpperCase(), 18, y + 1);
      y += 8;

      catItems.forEach((item: any) => {
        if (y > 275) { doc.addPage(); y = 20; }
        const name = item.displayName ?? item.ingredient?.name ?? item.customName ?? item.name ?? "Producto";
        const done = item.isPurchased || item.inPantry;
        // Checkbox
        doc.setDrawColor(done ? 34 : 180, done ? 197 : 180, done ? 94 : 180);
        doc.setFillColor(done ? 34 : 255, done ? 197 : 255, done ? 94 : 255);
        doc.roundedRect(14, y - 3.5, 5, 5, 1, 1, done ? "FD" : "D");
        if (done) {
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);
          doc.text("✓", 15.2, y + 0.5);
        }
        // Item name
        doc.setTextColor(done ? 150 : 30, done ? 150 : 30, done ? 150 : 30);
        doc.setFontSize(10);
        doc.setFont("helvetica", done ? "normal" : "normal");
        const displayName = name.length > 55 ? name.substring(0, 52) + "..." : name;
        doc.text(displayName, 22, y + 0.5);
        // In pantry badge
        if (item.inPantry) {
          doc.setFontSize(7);
          doc.setTextColor(34, 197, 94);
          doc.text("Ya lo tienes", pageW - 14, y + 0.5, { align: "right" });
        }
        y += 7;
      });
      y += 2;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Generado con BuddyMarket • Tu gestor nutricional inteligente", pageW / 2, 290, { align: "center" });

    doc.save(`${listName.replace(/[^a-z0-9]/gi, "_")}_lista_compra.pdf`);
    toast.success("PDF descargado ✓");
    setShowShare(false);
  }

  // Share via WhatsApp
  function shareWhatsApp() {
    const listName = (listData as any)?.list?.name ?? (listData as any)?.name ?? "Lista de la compra";
    const items = (listData?.items ?? []) as any[];
    const grouped: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const cat = item.ingredient?.foodCategory?.name ?? item.category ?? "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    let text = `🛒 *${listName}*\n`;
    text += `_Generada con BuddyMarket_\n\n`;
    Object.entries(grouped).forEach(([cat, catItems]) => {
      text += `*${cat}*\n`;
      catItems.forEach((item: any) => {
        const name = item.displayName ?? item.ingredient?.name ?? item.customName ?? item.name ?? "Producto";
        const done = item.isPurchased || item.inPantry;
        text += `${done ? "✅" : "□"} ${name}\n`;
      });
      text += "\n";
    });
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setShowShare(false);
  }

  // Share via Telegram
  function shareTelegram() {
    const listName = (listData as any)?.list?.name ?? (listData as any)?.name ?? "Lista de la compra";
    const items = (listData?.items ?? []) as any[];
    const grouped: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const cat = item.ingredient?.foodCategory?.name ?? item.category ?? "General";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    let text = `🛒 *${listName}*\nGenerada con BuddyMarket\n\n`;
    Object.entries(grouped).forEach(([cat, catItems]) => {
      text += `*${cat}*\n`;
      catItems.forEach((item: any) => {
        const name = item.displayName ?? item.ingredient?.name ?? item.customName ?? item.name ?? "Producto";
        const done = item.isPurchased || item.inPantry;
        text += `${done ? "✅" : "□"} ${name}\n`;
      });
      text += "\n";
    });
    const url = `https://t.me/share/url?url=${encodeURIComponent("https://buddymarket.app")}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    setShowShare(false);
  }

  // Copy to clipboard
  function copyToClipboard() {
    const listName = (listData as any)?.list?.name ?? (listData as any)?.name ?? "Lista de la compra";
    const items = (listData?.items ?? []) as any[];
    let text = `🛒 ${listName}\n\n`;
    items.forEach((item: any) => {
      const name = item.displayName ?? item.ingredient?.name ?? item.customName ?? item.name ?? "Producto";
      const done = item.isPurchased || item.inPantry;
      text += `${done ? "✅" : "□"} ${name}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      toast.success(t("shoppingList.listCopied", "List copied to clipboard ✓"));
      setShowShare(false);
    });
  }

  const saveAsTemplate = trpc.shoppingLists.saveAsTemplate.useMutation({
    onSuccess: () => {
      toast.success("Plantilla guardada");
      setShowSaveTemplate(false);
      setTemplateName("");
    },
    onError: (err: any) => toast.error(err.message || t("shoppingList.errorSaveTemplate", "Error saving template")),
  });

  // Load pantry stock to auto-detect items already at home
  const { data: pantryData } = trpc.shoppingLists.getPantryStock.useQuery();
  const pantryKeys = new Set(
    (pantryData ?? []).map((p: any) =>
      p.ingredientKey as string
    )
  );

  function normalizeKey(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function isInPantry(item: any): boolean {
    const name = item.ingredient?.name ?? item.customName ?? item.name ?? "";
    return pantryKeys.has(normalizeKey(name));
  }

  function getPantryEntry(item: any) {
    const name = item.ingredient?.name ?? item.customName ?? item.name ?? "";
    const key = normalizeKey(name);
    return (pantryData ?? []).find((p: any) => p.ingredientKey === key);
  }

  const toggleItem = trpc.shoppingLists.toggleItem.useMutation({
    onMutate: async ({ id }) => {
      await utils.shoppingLists.getById.cancel({ id: listId });
      const prev = utils.shoppingLists.getById.getData({ id: listId });
      utils.shoppingLists.getById.setData({ id: listId }, (old: any) => {
        if (!old) return old;
        return { ...old, items: old.items.map((item: any) => item.id === id ? { ...item, checked: !item.checked, isPurchased: !item.isPurchased } : item) };
      });
      return { prev };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.prev) utils.shoppingLists.getById.setData({ id: listId }, ctx.prev);
    },
    onSettled: () => utils.shoppingLists.getById.invalidate({ id: listId }),
  });

  const togglePantry = trpc.shoppingLists.togglePantry.useMutation({
    onMutate: async ({ id }) => {
      await utils.shoppingLists.getById.cancel({ id: listId });
      const prev = utils.shoppingLists.getById.getData({ id: listId });
      utils.shoppingLists.getById.setData({ id: listId }, (old: any) => {
        if (!old) return old;
        return { ...old, items: old.items.map((item: any) => item.id === id ? { ...item, inPantry: !item.inPantry } : item) };
      });
      return { prev };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.prev) utils.shoppingLists.getById.setData({ id: listId }, ctx.prev);
    },
    onSettled: () => utils.shoppingLists.getById.invalidate({ id: listId }),
  });

  const removeItem = trpc.shoppingLists.removeItem.useMutation({
    onSuccess: () => utils.shoppingLists.getById.invalidate({ id: listId }),
  });
  const addItem = trpc.shoppingLists.addItem.useMutation({
    onSuccess: () => {
      utils.shoppingLists.getById.invalidate({ id: listId });
      setNewItem("");
      setShowAdd(false);
      toast.success(t("shoppingList.productAdded", "Product added"));
    },
  });

  const allItems = (listData?.items ?? []) as any[];

  // Stats
  const inPantryCount = allItems.filter((i) => i.inPantry).length;
  const purchasedCount = allItems.filter((i) => i.isPurchased && !i.inPantry).length;
  const toBuyCount = allItems.filter((i) => !i.isPurchased && !i.inPantry).length;
  const totalCount = allItems.length;
  const pct = totalCount > 0 ? Math.round(((purchasedCount + inPantryCount) / totalCount) * 100) : 0;

  // Filter items based on view
  const filteredItems = allItems.filter((item) => {
    if (viewFilter === "to_buy") return !item.isPurchased && !item.inPantry;
    if (viewFilter === "in_pantry") return item.inPantry;
    if (viewFilter === "purchased") return item.isPurchased && !item.inPantry;
    return true; // "all"
  });

  // Group by category
  const grouped: Record<string, any[]> = {};
  filteredItems.forEach((item: any) => {
    const cat = item.ingredient?.foodCategory?.name ?? item.category ?? "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  if (isLoading) {
    return (
      <div className="vively-page">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="vively-card h-16" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 truncate">
            {(listData as any)?.list?.name ?? (listData as any)?.name ?? "Lista"}
          </h1>
          <p className="text-xs text-gray-500">{purchasedCount + inPantryCount}/{totalCount} listos</p>
        </div>
        <button
          onClick={() => setShowShare(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm mr-1"
          title="Exportar / Compartir lista"
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5 text-emerald-500" />
        </button>
        <button
          onClick={() => setShowSaveTemplate(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm mr-1"
          title="Guardar como plantilla"
        >
          <BookmarkIcon className="h-5 w-5 text-violet-500" />
        </button>
        <button
          onClick={() => setShowCompare(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm mr-1"
          title="Comparar precios entre supermercados"
        >
          <ScaleIcon className="h-5 w-5 text-purple-500" />
        </button>
        <button
          onClick={() => { setShowExport(true); setSelectedSupermarket(null); }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm mr-1"
          title="Comprar en supermercado online"
        >
          <BuildingStorefrontIcon className="h-5 w-5 text-[#F97316]" />
        </button>
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] shadow-sm"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="vively-card mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1">
              <div className="macro-bar">
                <div className="macro-bar-fill" style={{ width: `${pct}%`, background: "#F97316" }} />
              </div>
            </div>
            <span className="text-sm font-bold text-[#F97316]">{pct}%</span>
          </div>
          {/* Stats row */}
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-200"></span>
              <span>{toBuyCount} por comprar</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400"></span>
              <span>{inPantryCount} en despensa</span>
            </div>
            <div className="flex items-center gap-1 text-[#F97316]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#F97316]"></span>
              <span>{purchasedCount} comprados</span>
            </div>
          </div>
        </div>
      )}

      {/* View filter tabs */}
      {totalCount > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {([
            { id: "all", label: "Todos", count: totalCount },
            { id: "to_buy", label: "Por comprar", count: toBuyCount },
            { id: "in_pantry", label: "En despensa", count: inPantryCount },
            { id: "purchased", label: "Comprados", count: purchasedCount },
          ] as { id: ViewFilter; label: string; count: number }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewFilter(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                viewFilter === tab.id
                  ? tab.id === "in_pantry"
                    ? "bg-green-100 text-green-700"
                    : tab.id === "purchased"
                    ? "bg-orange-100 text-[#F97316]"
                    : "bg-gray-900 text-white"
                  : "bg-white text-gray-500 shadow-sm"
              }`}
            >
              {tab.id === "in_pantry" && <HomeIcon className="h-3 w-3" />}
              {tab.id === "purchased" && <CheckIcon className="h-3 w-3" />}
              {tab.label}
              {tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  viewFilter === tab.id ? "bg-white/20" : "bg-gray-100"
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* In-pantry info banner */}
      {viewFilter === "all" && inPantryCount === 0 && totalCount > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-green-50 p-3">
          <HomeIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <p className="text-xs text-green-700">
            <span className="font-semibold">¿Ya tienes algo en casa?</span> Pulsa el icono 🏠 en cada producto para marcarlo como «en despensa» y no tenerlo que comprar.
          </p>
        </div>
      )}

      {/* Items grouped by category */}
      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="mb-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{cat}</h3>
          <div className="space-y-2">
            {catItems.map((item: any) => (
              <div
                key={item.id}
                className={`vively-card flex items-center gap-3 transition-all ${
                  item.inPantry
                    ? "border-l-4 border-l-green-400 bg-green-50/50"
                    : item.isPurchased
                    ? "opacity-50"
                    : ""
                }`}
              >
                {/* Purchased checkbox */}
                <button
                  onClick={() => toggleItem.mutate({ id: item.id })}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    item.isPurchased ? "border-[#F97316] bg-[#F97316]" : "border-gray-200"
                  }`}
                  title={item.isPurchased ? "Marcar como no comprado" : "Marcar como comprado"}
                >
                  {item.isPurchased && <CheckIcon className="h-4 w-4 text-white" />}
                </button>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-sm font-medium ${
                      item.isPurchased ? "line-through text-gray-400" :
                      item.inPantry ? "text-green-700" :
                      isInPantry(item) ? "text-emerald-700" : "text-gray-900"
                    }`}>
                      {item.ingredient?.name ?? item.customName ?? item.name ?? "Producto"}
                    </p>
                    {item.inPantry && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">despensa</span>
                    )}
                    {!item.inPantry && !item.isPurchased && isInPantry(item) && (() => {
                      const entry = getPantryEntry(item);
                      return (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 flex items-center gap-0.5">
                          ✓ Ya lo tienes{entry?.commercialLabel ? ` · ${entry.commercialLabel}` : ""}
                        </span>
                      );
                    })()}
                  </div>
                  {(item.amount || item.quantity) && (
                    <p className="text-xs text-gray-400">
                      {item.amount ?? item.quantity} {item.measure?.name ?? item.unit ?? ""}
                    </p>
                  )}
                </div>

                {/* Pantry toggle button */}
                <button
                  onClick={() => {
                    togglePantry.mutate({ id: item.id });
                    if (!item.inPantry) toast.success("Marcado como en despensa");
                  }}
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                    item.inPantry
                      ? "bg-green-500 text-white"
                      : "text-gray-300 hover:bg-green-50 hover:text-green-500"
                  }`}
                  title={item.inPantry ? "Quitar de despensa" : "Marcar como en despensa"}
                >
                  <HomeIcon className="h-4 w-4" />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => removeItem.mutate({ id: item.id })}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Empty state for filtered view */}
      {filteredItems.length === 0 && totalCount > 0 && (
        <div className="rounded-2xl bg-gray-50 py-8 text-center">
          <p className="text-sm text-gray-400">
            {viewFilter === "in_pantry" && "Ningún producto marcado como en despensa"}
            {viewFilter === "purchased" && "Ningún producto marcado como comprado"}
            {viewFilter === "to_buy" && "¡Todo listo! No quedan productos por comprar"}
          </p>
        </div>
      )}

      {allItems.length === 0 && (
        <div className="empty-state">
          <span className="mb-4 text-5xl">🛒</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">Lista vacía</h3>
          <p className="mb-6 text-sm text-gray-500">Añade productos a tu lista</p>
          <button onClick={() => setShowAdd(true)} className="btn-vively">{t("shoppingList.addProduct", "Add product")}</button>
        </div>
      )}

      {/* Add item modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Añadir producto</h3>
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem.mutate({ shoppingListId: listId, customName: newItem })}
              placeholder={t("shoppingList.productName", "Product name")}
              className="vively-input mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">
                Cancelar
              </button>
              <button
                onClick={() => addItem.mutate({ shoppingListId: listId, customName: newItem })}
                disabled={!newItem.trim() || addItem.isPending}
                className="flex-1 btn-vively"
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export to supermarket modal */}
      {showExport && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowExport(false); setSelectedSupermarket(null); } }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            {!selectedSupermarket ? (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{t("shoppingList.buyOnlineBtn", "Buy online")}</h3>
                  <button onClick={() => setShowExport(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>
                <p className="mb-5 text-sm text-gray-500">Elige tu supermercado y abriremos la búsqueda de cada producto en su tienda online.</p>
                <div className="grid grid-cols-2 gap-3">
                  {SUPERMARKET_OPTIONS.map((s) => (
                    <div key={s.id} className="relative">
                      <button
                        disabled={!s.available}
                        onClick={() => {
                          if (!s.available) return;
                          if (s.id === "mercadona") { setShowExport(false); setShowMercadonaCart(true); }
                          else if (s.id === "consum") { setSelectedSupermarket(s.id); }
                          else if (s.id === "lidl") { setShowExport(false); setShowLidlCart(true); }
                          else if (s.id === "carrefour") { setShowExport(false); setShowCarrefourCart(true); }
                          else if (s.id === "alcampo") { setShowExport(false); setShowAlcampoCart(true); }
                          else { setSelectedSupermarket(s.id); }
                        }}
                        className={`w-full flex flex-col items-center gap-2 rounded-2xl border-2 border-gray-100 p-4 transition-all ${s.available ? "hover:border-[#F97316] hover:bg-orange-50" : "opacity-50 cursor-not-allowed"}`}
                      >
                        <span className="text-2xl">{s.emoji}</span>
                        <span className="text-sm font-semibold text-gray-700">{s.name}</span>
                      </button>
                      {!s.available && (
                        <span className="absolute top-1 right-1 bg-gray-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none">Pronto</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <button onClick={() => setSelectedSupermarket(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">
                    {SUPERMARKET_OPTIONS.find(s => s.id === selectedSupermarket)?.emoji}{" "}
                    {SUPERMARKET_OPTIONS.find(s => s.id === selectedSupermarket)?.name}
                  </h3>
                  <button onClick={() => setShowExport(false)} className="ml-auto text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>
                <p className="mb-4 text-sm text-gray-500">Pulsa en cada producto para buscarlo, o usa el botón para abrir todos a la vez.</p>
                <button
                  onClick={() => {
                    const searchFn = SUPERMARKET_SEARCH_URLS[selectedSupermarket];
                    if (!searchFn) return;
                    const unpurchased = allItems.filter((i: any) => !i.isPurchased && !i.inPantry);
                    if (unpurchased.length === 0) { toast.error("No hay productos pendientes"); return; }
                    unpurchased.forEach((item: any, idx: number) => {
                      const name = item.ingredient?.name ?? item.customName ?? item.name ?? "";
                      if (name) setTimeout(() => window.open(searchFn(name), "_blank"), idx * 400);
                    });
                    toast.success(`Abriendo ${unpurchased.length} búsquedas en ${SUPERMARKET_OPTIONS.find(s => s.id === selectedSupermarket)?.name}`);
                  }}
                  className="mb-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] py-3 text-sm font-bold text-white"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  Buscar todos los productos ({allItems.filter((i: any) => !i.isPurchased && !i.inPantry).length})
                </button>
                <div className="space-y-2">
                  {allItems
                    .filter((i: any) => !i.isPurchased && !i.inPantry)
                    .map((item: any) => {
                      const name = item.ingredient?.name ?? item.customName ?? item.name ?? "";
                      const qty = item.amount ?? item.quantity ?? "";
                      const unit = item.measure?.name ?? item.unit ?? "";
                      const searchFn = SUPERMARKET_SEARCH_URLS[selectedSupermarket];
                      return (
                        <a
                          key={item.id}
                          href={searchFn ? searchFn(name) : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 hover:border-[#F97316] hover:bg-orange-50 transition-all"
                        >
                          <ShoppingCartIcon className="h-4 w-4 shrink-0 text-[#F97316]" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                            {(qty || unit) && <p className="text-xs text-gray-400">{qty} {unit}</p>}
                          </div>
                          <ArrowTopRightOnSquareIcon className="h-4 w-4 shrink-0 text-gray-300" />
                        </a>
                      );
                    })}
                  {(allItems.filter((i: any) => i.isPurchased).length + allItems.filter((i: any) => i.inPantry).length) > 0 && (
                    <p className="pt-2 text-center text-xs text-gray-400">{allItems.filter((i: any) => i.isPurchased || i.inPantry).length} producto(s) ya marcados (comprados o en despensa) no se muestran</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Mercadona integrated cart export */}
      {showMercadonaCart && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowMercadonaCart(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <MercadonaCartExport
              items={allItems.map((i: any) => ({ id: i.id, name: i.ingredient?.name ?? i.customName ?? i.name ?? "Producto", qty: String(i.amount ?? i.quantity ?? ""), unit: i.measure?.name ?? i.unit ?? "", isPurchased: i.isPurchased || i.inPantry }))}
              onBack={() => { setShowMercadonaCart(false); setShowExport(true); }}
              onClose={() => setShowMercadonaCart(false)}
            />
          </div>
        </div>
      )}
      {/* Lidl integrated cart export */}
      {showLidlCart && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLidlCart(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <LidlCartExport
              items={allItems.map((i: any) => ({ id: i.id, name: i.ingredient?.name ?? i.customName ?? i.name ?? "Producto", qty: String(i.amount ?? i.quantity ?? ""), unit: i.measure?.name ?? i.unit ?? "", isPurchased: i.isPurchased || i.inPantry }))}
              onBack={() => { setShowLidlCart(false); setShowExport(true); }}
              onClose={() => setShowLidlCart(false)}
            />
          </div>
        </div>
      )}
      {showCarrefourCart && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCarrefourCart(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <CarrefourCartExport
              items={allItems.map((i: any) => ({ id: i.id, name: i.ingredient?.name ?? i.customName ?? i.name ?? "Producto", qty: String(i.amount ?? i.quantity ?? ""), unit: i.measure?.name ?? i.unit ?? "", isPurchased: i.isPurchased || i.inPantry }))}
              onBack={() => { setShowCarrefourCart(false); setShowExport(true); }}
              onClose={() => setShowCarrefourCart(false)}
            />
          </div>
        </div>
      )}
      {showAlcampoCart && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAlcampoCart(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <AlcampoCartExport
              items={allItems.map((i: any) => ({ id: i.id, name: i.ingredient?.name ?? i.customName ?? i.name ?? "Producto", qty: String(i.amount ?? i.quantity ?? ""), unit: i.measure?.name ?? i.unit ?? "", isPurchased: i.isPurchased || i.inPantry }))}
              onBack={() => { setShowAlcampoCart(false); setShowExport(true); }}
              onClose={() => setShowAlcampoCart(false)}
            />
          </div>
        </div>
      )}
      {/* Basket Comparator Modal */}
      {showCompare && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCompare(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <BasketComparator
              items={allItems
                .filter((i: any) => !i.isPurchased && !i.inPantry)
                .map((i: any) => ({
                  name: i.ingredient?.name ?? i.customName ?? i.name ?? "",
                  qty: String(i.amount ?? i.quantity ?? ""),
                  unit: i.measure?.name ?? i.unit ?? "",
                }))}
              onClose={() => setShowCompare(false)}
            />
          </div>
        </div>
      )}
      {/* Share / Export Modal */}
      {showShare && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowShare(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-1 text-lg font-bold text-gray-900">{t("shoppingList.exportList", "Export list")}</h3>
            <p className="mb-5 text-sm text-gray-500">Elige cómo quieres compartir o guardar tu lista de la compra.</p>
            <div className="space-y-3">
              <button
                onClick={generatePDF}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-left hover:border-orange-200 hover:bg-orange-50 transition-colors"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-xl">📄</span>
                <div>
                  <p className="font-semibold text-gray-900">Descargar PDF</p>
                  <p className="text-xs text-gray-500">Archivo PDF listo para imprimir</p>
                </div>
              </button>
              <button
                onClick={shareWhatsApp}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-left hover:border-green-200 hover:bg-green-50 transition-colors"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl">💬</span>
                <div>
                  <p className="font-semibold text-gray-900">Compartir por WhatsApp</p>
                  <p className="text-xs text-gray-500">Envía la lista a familia o amigos</p>
                </div>
              </button>
              <button
                onClick={shareTelegram}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-left hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">✈️</span>
                <div>
                  <p className="font-semibold text-gray-900">Compartir por Telegram</p>
                  <p className="text-xs text-gray-500">Envía la lista por Telegram</p>
                </div>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3.5 text-left hover:border-violet-200 hover:bg-violet-50 transition-colors"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-xl">📋</span>
                <div>
                  <p className="font-semibold text-gray-900">Copiar al portapapeles</p>
                  <p className="text-xs text-gray-500">Pega la lista donde quieras</p>
                </div>
              </button>
            </div>
            <button onClick={() => setShowShare(false)} className="mt-4 w-full rounded-2xl border-2 border-gray-100 py-3 text-sm font-semibold text-gray-600">{t("common.cancel", "Cancel")}</button>
          </div>
        </div>
      )}
      {showSaveTemplate && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowSaveTemplate(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-2 text-lg font-bold text-gray-900">Guardar como plantilla</h3>
            <p className="mb-4 text-sm text-gray-500">Podrás reutilizar esta lista para crear nuevas listas de la compra rápidamente.</p>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Nombre de la plantilla</label>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={(listData as any)?.list?.name ?? "Mi plantilla"}
              className="mb-4 w-full rounded-2xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm focus:border-violet-400 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowSaveTemplate(false)} className="flex-1 rounded-2xl border-2 border-gray-100 py-3 text-sm font-semibold text-gray-600">Cancelar</button>
              <button
                onClick={() => {
                  const name = templateName.trim() || ((listData as any)?.list?.name ?? "Mi plantilla");
                  saveAsTemplate.mutate({ listId, name });
                }}
                disabled={saveAsTemplate.isPending}
                className="flex-1 rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {saveAsTemplate.isPending ? t("common.saving", "Saving...") : t("shoppingList.saveTemplate", "Save template")}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="vively-disclaimer">
        <p>BuddyMarket no constituye recomendaciones profesionales de nutrición.</p>
      </div>
    </div>
  );
}
export default function ShoppingLists() {
  const { t } = useTranslation();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showFromMenu, setShowFromMenu] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [persons, setPersons] = useState(2);
  const [supermarket, setSupermarket] = useState("general");
  // OCR state
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const [ocrItems, setOcrItems] = useState<{ name: string; amount: number; category: string; selected: boolean }[]>([]);
  const [ocrListName, setOcrListName] = useState("");
  const [ocrAdding, setOcrAdding] = useState(false);
  const ocrFileRef = useRef<HTMLInputElement>(null);

  const { data: lists, isLoading, refetch } = trpc.shoppingLists.list.useQuery();
  const { data: templates, refetch: refetchTemplates } = trpc.shoppingLists.listTemplates.useQuery();
  const createFromTemplate = trpc.shoppingLists.createFromTemplate.useMutation({
    onSuccess: (data: any) => {
      refetch();
      toast.success(`Lista "${data.name}" creada`);
    },
    onError: (err: any) => toast.error(err.message || t("shoppingList.errorCreate", "Error creating list")),
  });
  const deleteTemplate = trpc.shoppingLists.deleteTemplate.useMutation({
    onSuccess: () => { refetchTemplates(); toast.success("Plantilla eliminada"); },
  });
  const { data: myMenus } = trpc.menus.list.useQuery();

  const createList = trpc.shoppingLists.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
      setNewName("");
      toast.success(t("shoppingList.listCreated", "List created"));
    },
  });

  const generateFromMenu = trpc.shoppingLists.generateFromMenu.useMutation({
    onSuccess: (data: any) => {
      refetch();
      setShowFromMenu(false);
      setSelectedMenuId(null);
      toast.success(`Lista "${data.name}" creada con ${data.itemCount} productos`);
    },
    onError: (err: any) => {
      toast.error(err.message || t("shoppingList.errorGenerate", "Error generating list"));
    },
  });

  const deleteList = trpc.shoppingLists.delete.useMutation({
    onSuccess: () => { refetch(); toast.success(t("shoppingList.listDeleted", "List deleted")); },
  });

  const parseFromPhoto = trpc.shoppingLists.parseFromPhoto.useMutation({
    onSuccess: (data) => {
      setOcrItems(data.items.map(i => ({ ...i, selected: true })));
    },
    onError: (err: any) => {
      toast.error(err.message || "No se pudo analizar la imagen");
    },
  });

  const addItem = trpc.shoppingLists.addItem.useMutation();

  const handleOcrFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setOcrPreview(dataUrl);
      setOcrItems([]);
      parseFromPhoto.mutate({ imageBase64: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleOcrAddToList = async () => {
    const selected = ocrItems.filter(i => i.selected);
    if (!selected.length) { toast.error("Selecciona al menos un producto"); return; }
    setOcrAdding(true);
    try {
      // Create new list first
      const listName = ocrListName.trim() || `Lista ${new Date().toLocaleDateString("es-ES")}`;
      const newList = await createList.mutateAsync({ name: listName });
      // Add all items
      await Promise.all(selected.map(item =>
        addItem.mutateAsync({ shoppingListId: (newList as any).id, customName: item.name, amount: item.amount, category: item.category })
      ));
      toast.success(`Lista "${listName}" creada con ${selected.length} productos`);
      refetch();
      setShowOcrModal(false);
      setOcrPreview(null);
      setOcrItems([]);
      setOcrListName("");
    } catch {
      toast.error(t("shoppingList.errorCreate", "Error creating list"));
    } finally {
      setOcrAdding(false);
    }
  };

  const handleDeleteList = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la lista "${name}"? Esta acción no se puede deshacer.`)) return;
    deleteList.mutate({ id });
  };

  if (selectedListId !== null) {
    return <ShoppingListDetail listId={selectedListId} onBack={() => setSelectedListId(null)} />;
  }

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lista de compra</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFromMenu(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-orange-50 px-3 py-2 text-xs font-semibold text-[#F97316]"
          >
            <CalendarDaysIcon className="h-4 w-4" />
            Desde menú
          </button>
          <button
            onClick={() => setShowOcrModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 shadow-sm"
            title="Importar desde foto"
          >
            <CameraIcon className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] shadow-sm"
          >
            <PlusIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* How it works banner */}
      <div className="mb-5 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-400 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
            <ShoppingCartIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">Lista automática desde menú</p>
            <p className="text-xs text-white/80">Genera tu lista en segundos, ajustada al número de personas y supermercado</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="vively-card animate-pulse h-20" />)}
        </div>
      ) : lists && lists.length > 0 ? (
        <div className="space-y-3">
          {lists.map((list: any) => {
            const total = list.itemCount ?? 0;
            const done = list.purchasedCount ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const supermarketInfo = SUPERMARKETS.find(s => s.id === list.supermarket) ?? SUPERMARKETS[0];
            return (
              <div
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className="vively-card flex items-center gap-4 cursor-pointer hover:border-[#F97316]/30 transition-all"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                  <span className="text-2xl">{supermarketInfo.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{list.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="macro-bar flex-1">
                      <div className="macro-bar-fill" style={{ width: `${pct}%`, background: "#F97316" }} />
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{done}/{total}</span>
                  </div>
                  {list.persons && list.persons > 1 && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      <UserGroupIcon className="inline h-3 w-3 mr-0.5" />
                      {list.persons} personas
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list.id, list.name ?? "Lista");
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="mb-4 text-5xl">🛒</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">Sin listas de compra</h3>
          <p className="mb-6 text-sm text-gray-500">Crea tu primera lista o genera una desde un menú</p>
          <div className="flex gap-3">
            <button onClick={() => setShowFromMenu(true)} className="btn-vively-outline">Desde menú</button>
            <button onClick={() => setShowNew(true)} className="btn-vively">Crear lista</button>
          </div>
        </div>
      )}

      {/* Templates section */}
      {templates && templates.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-gray-700 uppercase tracking-wide">Plantillas guardadas</h2>
          <div className="space-y-2">
            {templates.map((tpl: any) => (
              <div key={tpl.id} className="vively-card flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50">
                  <BookmarkIcon className="h-5 w-5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{tpl.name}</p>
                  <p className="text-xs text-gray-400">{tpl.itemCount} productos · {tpl.supermarket ?? "General"}</p>
                </div>
                <button
                  onClick={() => createFromTemplate.mutate({ templateId: tpl.id })}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white hover:bg-violet-700"
                  title="Crear lista desde plantilla"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteTemplate.mutate({ id: tpl.id })}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400"
                  title="Eliminar plantilla"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* New list modal */}
      {showNew && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNew(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-gray-900">{t("shoppingList.newList", "New list")}</h3>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la lista (ej: Supermercado)"
              className="vively-input mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">
                Cancelar
              </button>
              <button
                onClick={() => createList.mutate({ name: newName || "Mi lista" })}
                disabled={createList.isPending}
                className="flex-1 btn-vively"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate from menu modal */}
      {showFromMenu && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowFromMenu(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <h3 className="mb-1 text-lg font-bold text-gray-900">Lista desde menú</h3>
            <p className="mb-5 text-sm text-gray-500">Genera automáticamente todos los ingredientes de tu menú</p>

            {/* Supermarket selector */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <BuildingStorefrontIcon className="h-3.5 w-3.5" />
                Supermercado
              </label>
              <div className="grid grid-cols-4 gap-2">
                {SUPERMARKETS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSupermarket(s.id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition-all ${
                      supermarket === s.id
                        ? "border-[#F97316] bg-orange-50"
                        : "border-gray-100 bg-white"
                    }`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <span className="text-[13px] font-medium text-gray-600 leading-tight">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Persons selector */}
            <div className="mb-4">
              <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <UserGroupIcon className="h-3.5 w-3.5" />
                Número de personas
              </label>
              <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-3">
                <button
                  onClick={() => setPersons(Math.max(1, persons - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-lg font-bold text-gray-600"
                >
                  −
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-gray-900">{persons}</span>
                  <p className="text-xs text-gray-400">{persons === 1 ? "persona" : "personas"}</p>
                </div>
                <button
                  onClick={() => setPersons(Math.min(12, persons + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] shadow-sm text-lg font-bold text-white"
                >
                  +
                </button>
              </div>
            </div>

            {/* Menu selector */}
            <div className="mb-5">
              <label className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                Selecciona un menú
              </label>
              {myMenus && myMenus.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {myMenus.map((menu: any) => {
                    const isSelected = selectedMenuId === menu.id;
                    const GOAL_COLORS: Record<string, string> = {
                      perdida_peso: "from-blue-500 to-cyan-400",
                      ganancia_muscular: "from-red-500 to-orange-400",
                      tonificacion: "from-purple-500 to-pink-400",
                      perdida_grasa: "from-orange-500 to-amber-400",
                      mantenimiento: "from-green-500 to-emerald-400",
                      bienestar: "from-teal-500 to-green-400",
                      vegano: "from-lime-500 to-green-400",
                      mediterraneo: "from-yellow-500 to-orange-400",
                    };
                    const gradient = GOAL_COLORS[(menu as any).goal] || "from-gray-400 to-gray-500";
                    return (
                      <button
                        key={menu.id}
                        onClick={() => setSelectedMenuId(menu.id)}
                        className={`w-full rounded-2xl border-2 overflow-hidden text-left transition-all ${
                          isSelected ? "border-[#F97316] shadow-md" : "border-gray-100"
                        }`}
                      >
                        <div className={`flex items-center gap-3 p-3 ${
                          isSelected ? "bg-orange-50" : "bg-white"
                        }`}>
                          <div className={`h-12 w-12 flex-shrink-0 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                            {(menu as any).coverImage ? (
                              <img src={(menu as any).coverImage} alt={menu.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xl">🥗</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{menu.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {(menu as any).dailyCalories && (
                                <span className="text-xs text-gray-400">🔥 {(menu as any).dailyCalories} kcal/día</span>
                              )}
                              {(menu as any).isSeeded && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">Biblioteca</span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-[#F97316] flex items-center justify-center">
                              <CheckIcon className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">No tienes menús guardados.</p>
                  <p className="text-xs text-gray-400 mt-1">Ve a Menús para crear uno o explora la biblioteca.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowFromMenu(false); setSelectedMenuId(null); }}
                className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!selectedMenuId) { toast.error("Selecciona un menú"); return; }
                  generateFromMenu.mutate({ menuId: selectedMenuId, persons, supermarket: supermarket as any });
                }}
                disabled={!selectedMenuId || generateFromMenu.isPending}
                className="flex-1 btn-vively"
              >
                {generateFromMenu.isPending ? "Generando..." : "Generar lista"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vively-disclaimer">
        <p>BuddyMarket no constituye recomendaciones profesionales de nutrición.</p>
      </div>

      {/* ─── OCR Photo Modal ────────────────────────────────────────────────────── */}
      {showOcrModal && (
        <div className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowOcrModal(false); setOcrPreview(null); setOcrItems([]); } }}>
          <div style={{ background: "white", borderRadius: "24px", width: "100%", maxWidth: 520, maxHeight: "calc(100dvh - 90px - 48px)", overflow: "auto", padding: "24px 24px 32px", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#1a1a1a" }}>Importar lista desde foto</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>Haz una foto a tu lista escrita o impresa</p>
              </div>
              <button onClick={() => { setShowOcrModal(false); setOcrPreview(null); setOcrItems([]); }}
                style={{ background: "#f3f4f6", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            {!ocrPreview && (
              <div style={{ border: "2px dashed #d1d5db", borderRadius: 16, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: "#fafafa", marginBottom: 16 }}
                onClick={() => ocrFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleOcrFile(file); }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#374151", fontSize: 15 }}>Sube una foto de tu lista</p>
                <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Arrastra aquí o pulsa para seleccionar</p>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#9ca3af" }}>JPG, PNG, HEIC • Máx. 10 MB</p>
              </div>
            )}
            <input ref={ocrFileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleOcrFile(file); }} />
            {ocrPreview && (
              <div style={{ marginBottom: 16 }}>
                <img src={ocrPreview} alt="Lista" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 12, border: "1px solid #e5e7eb" }} />
                {parseFromPhoto.isPending && (
                  <div style={{ textAlign: "center", padding: "16px 0", color: "#7c3aed", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ width: 18, height: 18, border: "2px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Analizando imagen con IA...
                  </div>
                )}
                {!parseFromPhoto.isPending && ocrItems.length === 0 && (
                  <button onClick={() => { setOcrPreview(null); }}
                    style={{ marginTop: 12, width: "100%", padding: "10px", background: "#f3f4f6", border: "none", borderRadius: 12, fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                    Cambiar foto
                  </button>
                )}
              </div>
            )}
            {ocrItems.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#374151" }}>{ocrItems.filter(i => i.selected).length} de {ocrItems.length} productos detectados</p>
                  <button onClick={() => setOcrItems(items => items.map(i => ({ ...i, selected: !items.every(x => x.selected) })))}
                    style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", background: "none", border: "none", cursor: "pointer" }}>
                    {ocrItems.every(i => i.selected) ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid #f3f4f6", borderRadius: 12 }}>
                  {ocrItems.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderBottom: idx < ocrItems.length - 1 ? "1px solid #f9fafb" : "none",
                      background: item.selected ? "#faf5ff" : "white", cursor: "pointer" }}
                      onClick={() => setOcrItems(items => items.map((x, i) => i === idx ? { ...x, selected: !x.selected } : x))}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.selected ? "#7c3aed" : "#d1d5db"}`,
                        background: item.selected ? "#7c3aed" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.selected && <CheckIcon style={{ width: 12, height: 12, color: "white" }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{item.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{item.category} • {item.amount} ud.</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Nombre de la lista (opcional)</label>
                  <input type="text" value={ocrListName} onChange={e => setOcrListName(e.target.value)}
                    placeholder={`Lista ${new Date().toLocaleDateString("es-ES")}`}
                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <button onClick={handleOcrAddToList} disabled={ocrAdding || ocrItems.filter(i => i.selected).length === 0}
                  style={{ width: "100%", padding: "14px", background: ocrItems.filter(i => i.selected).length > 0 ? "#7c3aed" : "#e5e7eb",
                    color: ocrItems.filter(i => i.selected).length > 0 ? "white" : "#9ca3af",
                    border: "none", borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: ocrAdding ? "wait" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {ocrAdding
                    ? <><div style={{ width: 16, height: 16, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Creando lista...</>
                    : <>➕ Crear lista con {ocrItems.filter(i => i.selected).length} productos</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
