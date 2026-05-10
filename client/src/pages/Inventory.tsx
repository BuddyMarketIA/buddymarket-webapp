import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import { useLocation } from "wouter";
import BarcodeScanner from "@/components/BarcodeScanner";
import ProductNutritionCard from "@/components/ProductNutritionCard";
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  CameraIcon,
  SparklesIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
// ─── helpers ─────────────────────────────────────────────────────────────────

function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function expiryColor(days: number | null) {
  if (days === null) return "border-border/50 bg-background";
  if (days < 0)  return "border-l-4 border-l-red-600   border-t border-r border-b border-red-200   bg-red-50";
  if (days <= 2) return "border-l-4 border-l-red-500   border-t border-r border-b border-red-200   bg-red-50";
  if (days <= 5) return "border-l-4 border-l-orange-400 border-t border-r border-b border-orange-200 bg-orange-50";
  if (days <= 7) return "border-l-4 border-l-yellow-400 border-t border-r border-b border-yellow-200 bg-yellow-50";
  return "border border-border/50 bg-background";
}

function expiryBadge(days: number | null) {
  if (days === null) return null;
  if (days < 0)  return <span className="shrink-0 rounded-full bg-red-600   px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">⚠ Vencido</span>;
  if (days === 0) return <span className="shrink-0 rounded-full bg-red-500   px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">⚠ Caduca hoy</span>;
  if (days <= 2) return <span className="shrink-0 rounded-full bg-red-500   px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">⚠ {days}d</span>;
  if (days <= 5) return <span className="shrink-0 rounded-full bg-orange-400 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">⏰ {days}d</span>;
  if (days <= 7) return <span className="shrink-0 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-bold text-foreground shadow-sm">⏳ {days}d</span>;
  return null;
}

const LOC_EMOJIS: Record<string, string> = {
  nevera: "🧊", fridge: "🧊", refrigerator: "🧊",
  congelador: "❄️", freezer: "❄️",
  despensa: "🏠", pantry: "🏠",
};

function locEmoji(loc: any) {
  if (!loc) return "📦";
  const key = (loc.key ?? loc.nameEs ?? "").toLowerCase();
  return LOC_EMOJIS[key] ?? "📦";
}

// ─── detected product from AI ─────────────────────────────────────────────────

type DetectedProduct = {
  name: string;
  amount: number;
  unit: string;
  category: string;
  expirationDate?: string;
  selected: boolean;
};

// ─── main component ───────────────────────────────────────────────────────────

export default function Inventory() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState("all");
  const [sortBy, setSortBy] = useState<"expiry" | "name" | "added">("expiry");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [measureId, setMeasureId] = useState("5"); // default: unidad
  const [storageLocation, setStorageLocation] = useState("1");
  const [expirationDate, setExpirationDate] = useState("");
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [expirySource, setExpirySource] = useState<"lookup" | "ai" | "fallback" | null>(null);
  // Anti-waste recipe generation state
  const [showAntiWaste, setShowAntiWaste] = useState(false);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);
  const [generatedRecipes, setGeneratedRecipes] = useState<Array<{
    name: string; description: string; prepTime: number; difficulty: string;
    usedIngredients: string[]; emoji: string;
  }>>([]);

  // Photo AI state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<{
    name: string;
    brand: string | null;
    imageUrl: string | null;
    quantity: string | null;
    nutriScore: string | null;
    novaGroup: number | null;
    per100g: { calories: number; proteins: number; carbohydrates: number; fats: number; fiber?: number; sugars?: number; saturatedFat?: number; salt?: number };
  } | null>(null);
  const [barcodeAmount, setBarcodeAmount] = useState("1");
  const [barcodeExpiry, setBarcodeExpiry] = useState("");
  const [barcodeLocation, setBarcodeLocation] = useState("1");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState<DetectedProduct[]>([]);
  const [addingDetected, setAddingDetected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import from shopping list state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [importOnlyChecked, setImportOnlyChecked] = useState(true);

  const { data: items, isLoading, refetch } = trpc.inventory.list.useQuery();
  const { data: storageLocations } = trpc.catalogs.storageLocations.useQuery();
  const { data: measures } = trpc.catalogs.measures.useQuery();
  const { data: expiringItems } = trpc.inventory.getExpiringItems.useQuery({ days: 7 });
  const { data: recipeRecs } = trpc.inventory.getRecipesByExpiring.useQuery();
  const { data: shoppingLists } = trpc.shoppingLists.list.useQuery();
  const utils = trpc.useUtils();

  const analyzePhoto = trpc.inventory.analyzePhoto.useMutation();

  const addItem = trpc.inventory.add.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      utils.inventory.getExpiringItems.invalidate();
      setShowAdd(false);
      setCustomName("");
      setAmount("");
      setMeasureId("5");
      setExpirationDate("");
      setExpirySource(null);
      toast.success("Producto añadido al inventario");
    },
    onError: (err) => toast.error(err.message),
  });

  const addItemSilent = trpc.inventory.add.useMutation({
    onError: (err) => toast.error(err.message),
  });
  const suggestExpiry = trpc.inventory.suggestExpirationDate.useMutation();
  const generateAntiWaste = trpc.inventory.generateRecipesFromExpiring.useMutation();
  const generateFromInventory = trpc.inventory.generateRecipesFromInventory.useMutation();
  const [showInventoryRecipes, setShowInventoryRecipes] = useState(false);
  const [generatingInventoryRecipes, setGeneratingInventoryRecipes] = useState(false);
  const [inventoryRecipes, setInventoryRecipes] = useState<Array<{
    name: string; description: string; prepTime: number; difficulty: string;
    calories: number; usedIngredients: string[]; emoji: string; mealType: string;
  }>>([]);

  const removeItem = trpc.inventory.remove.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      utils.inventory.getExpiringItems.invalidate();
      toast.success("Producto eliminado");
    },
  });

  const handleRemoveItem = (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar "${name}" del inventario?`)) return;
    removeItem.mutate({ id });
  };

  const importFromShoppingList = trpc.inventory.importFromShoppingList.useMutation({
    onSuccess: (data) => {
      utils.inventory.list.invalidate();
      utils.inventory.getExpiringItems.invalidate();
      setShowImportModal(false);
      setSelectedListId(null);
      if (data.imported > 0) {
        toast.success(`${data.imported} producto${data.imported !== 1 ? 's' : ''} importado${data.imported !== 1 ? 's' : ''} al inventario`, {
          description: data.skipped > 0 ? `${data.skipped} producto${data.skipped !== 1 ? 's' : ''} omitido${data.skipped !== 1 ? 's' : ''}` : undefined,
        });
      } else {
        toast.info("No hay productos para importar", { description: importOnlyChecked ? "Marca productos como comprados en la lista primero" : "La lista está vacía" });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  // ── filter items ──────────────────────────────────────────────────────────
  const filtered = (items ?? []).filter((item) => {
    const name = item.item.customName || item.ingredient?.nameEs || "";
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (activeLocation === "all") return true;
    const locKey = ((item.storageLocation as any)?.key ?? "").toLowerCase();
    const locName = ((item.storageLocation as any)?.nameEs ?? "").toLowerCase();
    return locKey === activeLocation || locName === activeLocation;
  });

  // ── sort items ───────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "expiry") {
      const da = a.item.expirationDate ? new Date(a.item.expirationDate).getTime() : Infinity;
      const db = b.item.expirationDate ? new Date(b.item.expirationDate).getTime() : Infinity;
      cmp = da - db;
    } else if (sortBy === "name") {
      const na = (a.item.customName || a.ingredient?.nameEs || "").toLowerCase();
      const nb = (b.item.customName || b.ingredient?.nameEs || "").toLowerCase();
      cmp = na.localeCompare(nb, "es");
    } else {
      // added: sort by item id (higher id = more recently added)
      cmp = a.item.id - b.item.id;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const expiringCount = (items ?? []).filter((item) => {
    const days = daysUntil(item.item.expirationDate);
    return days !== null && days <= 3 && days >= 0;
  }).length;

  // ── photo analysis ────────────────────────────────────────────────────────
  const handlePhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setDetectedProducts([]);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!photoFile || !photoPreview) return;
    setAnalyzing(true);
    try {
      // Upload to S3 via fetch to /api/upload-inventory-photo
      const formData = new FormData();
      formData.append("file", photoFile);
      const uploadRes = await fetch("/api/upload-inventory-photo", {
        method: "POST",
        body: formData,
      });
      let imageUrl = photoPreview;
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url ?? photoPreview;
      }
      // Analyze with AI
      const result = await analyzePhoto.mutateAsync({ imageUrl });
      if (result.products.length === 0) {
        toast.error("No se detectaron productos. Intenta con una foto más clara.");
      } else {
        setDetectedProducts(result.products.map((p) => ({ ...p, selected: true })));
        toast.success(`${result.products.length} productos detectados`);
      }
    } catch (err) {
      toast.error("Error al analizar la foto. Inténtalo de nuevo.");
    } finally {
      setAnalyzing(false);
    }
  }, [photoFile, photoPreview, analyzePhoto]);

  // Auto-suggest expiration date when product name changes
  const handleNameBlur = useCallback(async (name: string) => {
    if (!name.trim() || expirationDate) return; // don't overwrite if user already set a date
    setExpiryLoading(true);
    try {
      const result = await suggestExpiry.mutateAsync({ productName: name.trim() });
      setExpirationDate(result.expirationDate);
      setExpirySource(result.source);
    } catch {
      // silently fail
    } finally {
      setExpiryLoading(false);
    }
  }, [expirationDate, suggestExpiry]);

  const handleAddDetected = useCallback(async () => {
    const selected = detectedProducts.filter((p) => p.selected);
    if (selected.length === 0) { toast.error("Selecciona al menos un producto"); return; }
    setAddingDetected(true);
    try {
      await Promise.all(
        selected.map((p) =>
          addItemSilent.mutateAsync({
            customName: p.name,
            amount: p.amount || 1,
            storageLocationId: 1,
            expirationDate: p.expirationDate || undefined,
          })
        )
      );
      utils.inventory.list.invalidate();
      utils.inventory.getExpiringItems.invalidate();
      toast.success(`${selected.length} productos añadidos al inventario`);
      setShowPhotoModal(false);
      setPhotoPreview(null);
      setPhotoFile(null);
      setDetectedProducts([]);
    } catch {
      toast.error("Error al añadir productos");
    } finally {
      setAddingDetected(false);
    }
  }, [detectedProducts, addItemSilent, utils]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("inventory.title", "Inventory")}</h1>
          {expiringCount > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
              <span>{expiringCount} producto{expiringCount !== 1 ? "s" : ""} próximo{expiringCount !== 1 ? "s" : ""} a vencer</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 shadow-sm"
            title="Importar lista de la compra"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowPhotoModal(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 shadow-sm"
            title="Analizar con foto"
          >
            <CameraIcon className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={() => setShowBarcodeScanner(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 shadow-sm"
            title="Escanear código de barras"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-4v3a1 1 0 01-1 1h-3m4-11V6a1 1 0 00-1-1h-3" />
              <line x1="7" y1="8" x2="7" y2="16" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="8" x2="10" y2="16" stroke="currentColor" strokeWidth="1.5" />
              <line x1="13" y1="8" x2="13" y2="16" stroke="currentColor" strokeWidth="2" />
              <line x1="16" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] shadow-sm"
            title="Añadir manualmente"
          >
            <PlusIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Expiring soon banner */}
      {(expiringItems ?? []).length > 0 && (
        <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="font-bold">¡Caducan pronto!</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(expiringItems ?? []).slice(0, 4).map((item: any) => {
              const days = daysUntil(item.item?.expirationDate ?? item.expirationDate);
              const name = item.ingredient?.nameEs ?? item.item?.customName ?? item.customName ?? "Alimento";
              return (
                <span key={item.id} className="rounded-full bg-background/20 px-3 py-1 text-xs font-semibold">
                  {name} · {days === 0 ? "hoy" : days !== null && days < 0 ? "vencido" : `${days}d`}
                </span>
              );
            })}
            {(expiringItems ?? []).length > 4 && (
              <span className="rounded-full bg-background/20 px-3 py-1 text-xs font-semibold">
                +{(expiringItems ?? []).length - 4} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Anti-waste section: generate AI recipes for expiring products */}
      {(expiringItems ?? []).length > 0 && (
        <div className="mb-5 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">♻️</span>
              <div>
                <p className="text-sm font-bold text-green-800">{t("inventory.antiWaste", "Anti-waste")}</p>
                <p className="text-xs text-green-600">{(expiringItems ?? []).length} producto{(expiringItems ?? []).length !== 1 ? "s" : ""} próximo{(expiringItems ?? []).length !== 1 ? "s" : ""} a caducar</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (generatedRecipes.length > 0) { setShowAntiWaste(true); return; }
                setGeneratingRecipes(true);
                try {
                  const result = await generateAntiWaste.mutateAsync();
                  if (result.recipes && result.recipes.length > 0) {
                    setGeneratedRecipes(result.recipes);
                    setShowAntiWaste(true);
                  } else {
                    toast.info("No hay suficientes productos próximos a caducar para generar recetas.");
                  }
                } catch {
                  toast.error("Error al generar recetas. Inténtalo de nuevo.");
                } finally {
                  setGeneratingRecipes(false);
                }
              }}
              disabled={generatingRecipes}
              className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-60"
            >
              {generatingRecipes ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generando...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-3.5 w-3.5" />
                  {generatedRecipes.length > 0 ? "Ver recetas" : "Generar recetas IA"}
                </>
              )}
            </button>
          </div>
          {/* Expiring items chips */}
          <div className="flex flex-wrap gap-1.5">
            {(expiringItems ?? []).slice(0, 6).map((item: any) => {
              const days = daysUntil(item.item?.expirationDate ?? item.expirationDate);
              const name = item.ingredient?.nameEs ?? item.item?.customName ?? item.customName ?? "Alimento";
              return (
                <span key={item.id} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  days !== null && days <= 2 ? "bg-red-100 text-red-700" :
                  days !== null && days <= 5 ? "bg-orange-100 text-orange-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {name} · {days === 0 ? "hoy" : days !== null && days < 0 ? "vencido" : `${days}d`}
                </span>
              );
            })}
            {(expiringItems ?? []).length > 6 && (
              <span className="rounded-full bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                +{(expiringItems ?? []).length - 6} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Old recipe recs from DB (existing recipes that match expiring items) */}
      {recipeRecs && recipeRecs.expiringIngredients.length > 0 && recipeRecs.recipes.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-foreground">Recetas del catálogo</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recipeRecs.recipes.slice(0, 5).map((recipe: any) => (
              <button
                key={recipe.id}
                onClick={() => navigate(`/app/recipes/${recipe.id}`)}
                className="shrink-0 w-36 rounded-2xl bg-background border border-border/50 shadow-sm overflow-hidden text-left active:scale-95 transition-transform"
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="h-24 w-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-3xl">🍽️</div>
                )}
                <div className="p-2">
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{recipe.name}</p>
                  {recipe.calories && (
                    <p className="mt-1 text-xs text-muted-foreground/70">{recipe.calories} kcal</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recetas con lo que tienes — AI section */}
      {(items ?? []).length > 0 && (
        <div className="mb-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍳</span>
              <div>
                <p className="text-sm font-bold text-indigo-900">Recetas con lo que tienes</p>
                <p className="text-xs text-indigo-600">{(items ?? []).length} producto{(items ?? []).length !== 1 ? "s" : ""} en tu inventario</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (inventoryRecipes.length > 0) { setShowInventoryRecipes(true); return; }
                setGeneratingInventoryRecipes(true);
                try {
                  const result = await generateFromInventory.mutateAsync();
                  if (result.recipes && result.recipes.length > 0) {
                    setInventoryRecipes(result.recipes as any);
                    setShowInventoryRecipes(true);
                  } else {
                    toast.info(result.message ?? "No se pudieron generar recetas.");
                  }
                } catch {
                  toast.error("Error al generar recetas. Inténtalo de nuevo.");
                } finally {
                  setGeneratingInventoryRecipes(false);
                }
              }}
              disabled={generatingInventoryRecipes}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-60"
            >
              {generatingInventoryRecipes ? (
                <><span className="animate-spin">⏳</span> Generando...</>
              ) : (
                <><SparklesIcon className="h-3.5 w-3.5" />{inventoryRecipes.length > 0 ? "Ver recetas" : "Generar con IA"}</>
              )}
            </button>
          </div>
          {/* Ingredient chips preview */}
          <div className="flex flex-wrap gap-1.5">
            {(items ?? []).slice(0, 8).map((item: any) => (
              <span key={item.item?.id ?? item.id} className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {item.ingredient?.nameEs ?? item.item?.customName ?? item.customName ?? "Alimento"}
              </span>
            ))}
            {(items ?? []).length > 8 && (
              <span className="rounded-full bg-muted/50 px-2.5 py-1 text-xs font-semibold text-muted-foreground">+{(items ?? []).length - 8} más</span>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-muted-foreground/70" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("inventory.searchPlaceholder", "Search inventory...")}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      {/* Location tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "all", label: "Todo", emoji: "🗂️" },
          { key: "nevera", label: "Nevera", emoji: "🧊" },
          { key: "congelador", label: "Congelador", emoji: "❄️" },
          { key: "despensa", label: "Despensa", emoji: "🏠" },
        ].map((loc) => (
          <button
            key={loc.key}
            onClick={() => setActiveLocation(loc.key)}
            className={`selectable-badge shrink-0 ${activeLocation === loc.key ? "selectable-badge-active" : "selectable-badge-inactive"}`}
          >
            {loc.emoji} {loc.label}
          </button>
        ))}
      </div>

      {/* Sort controls */}
      {(items ?? []).length > 1 && (
        <div className="mb-4 flex items-center gap-2">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground/70">Ordenar:</span>
          <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5">
            {([
              { key: "expiry", label: "Caducidad", icon: "📅" },
              { key: "name", label: "Nombre", icon: "🔤" },
              { key: "added", label: "Añadido", icon: "🕐" },
            ] as const).map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  if (sortBy === opt.key) {
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                  } else {
                    setSortBy(opt.key);
                    setSortDir("asc");
                  }
                }}
                className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                  sortBy === opt.key
                    ? "bg-[#F97316] text-white shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.icon} {opt.label}
                {sortBy === opt.key && (
                  <span className="ml-0.5 opacity-80">{sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Items */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="vively-card animate-pulse h-16" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          {search ? (
            <>
              <span className="mb-4 text-5xl">🔍</span>
              <h3 className="mb-2 text-base font-bold text-foreground">{t("inventory.noResults", "No results")}</h3>
              <p className="mb-6 text-sm text-muted-foreground">No encontramos "{search}" en tu inventario</p>
              <button onClick={() => setSearch("")} className="btn-vively-outline">Limpiar búsqueda</button>
            </>
          ) : (
            <>
              <span className="mb-3 text-6xl">📦</span>
              <h3 className="mb-1 text-lg font-bold text-foreground">{t("inventory.empty", "Your inventory is empty")}</h3>
              <p className="mb-2 text-sm text-muted-foreground max-w-xs text-center">Añade los alimentos que tienes en casa para recibir alertas de caducidad y sugerencias de recetas</p>
              <div className="mb-6 flex flex-col gap-2 text-xs text-muted-foreground/70">
                <span>💡 Tip: Usa la cámara para añadir varios productos a la vez con IA</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPhotoModal(true)} className="flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md">
                  <CameraIcon className="h-4 w-4" /> 📸 Foto con IA
                </button>
                <button onClick={() => setShowAdd(true)} className="btn-vively">+ Añadir manual</button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => {
            const days = daysUntil(item.item.expirationDate);
            const name = item.ingredient?.nameEs ?? item.item.customName ?? "Alimento";
            const emoji = locEmoji(item.storageLocation);
            const locLabel = (item.storageLocation as any)?.nameEs ?? "Despensa";

            return (
              <div
                key={item.item.id}
                className={`flex items-center gap-3 rounded-2xl p-3 border shadow-sm ${expiryColor(days)}`}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ${
                  days !== null && days < 0  ? "bg-red-100" :
                  days !== null && days <= 2 ? "bg-red-100" :
                  days !== null && days <= 5 ? "bg-orange-100" :
                  days !== null && days <= 7 ? "bg-yellow-100" :
                  "bg-background/80"
                }`}>
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold truncate ${days !== null && days <= 7 ? "text-foreground" : "text-foreground"}`}>{name}</span>
                    {expiryBadge(days)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs flex-wrap">
                    {item.item.amount && <span className="text-muted-foreground/70">{item.item.amount} {item.measure?.nameEs ?? ""}</span>}
                    {item.item.expirationDate && (
                      <span className={`flex items-center gap-1 font-medium ${
                        days !== null && days < 0  ? "text-red-600" :
                        days !== null && days <= 2 ? "text-red-500" :
                        days !== null && days <= 5 ? "text-orange-500" :
                        days !== null && days <= 7 ? "text-yellow-600" :
                        "text-muted-foreground/70"
                      }`}>
                        📅 {new Date(item.item.expirationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                    )}
                    <span className="rounded-full bg-muted/50 px-2 py-0.5 text-muted-foreground/70">{locLabel}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.item.id, name)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add manually modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Añadir al inventario</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-full p-1 hover:bg-muted/50">
                <XMarkIcon className="h-5 w-5 text-muted-foreground/70" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={customName}
                onChange={(e) => { setCustomName(e.target.value); setExpirySource(null); }}
                onBlur={(e) => handleNameBlur(e.target.value)}
                placeholder="Nombre del alimento *"
                className="vively-input"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Cantidad"
                  min="0"
                  step="0.1"
                  className="vively-input"
                />
                <select
                  value={measureId}
                  onChange={(e) => setMeasureId(e.target.value)}
                  className="vively-input"
                >
                  {measures?.map((m) => (
                    <option key={m.id} value={String(m.id)}>{m.nameEs}</option>
                  )) ?? (
                    <>
                      <option value="1">gramos</option>
                      <option value="2">kilogramos</option>
                      <option value="3">mililitros</option>
                      <option value="4">litros</option>
                      <option value="5">unidad</option>
                      <option value="6">cucharada</option>
                      <option value="8">taza</option>
                    </>
                  )}
                </select>
              </div>
              <select
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="vively-input"
              >
                {storageLocations?.map((loc) => (
                  <option key={loc.id} value={String(loc.id)}>{loc.nameEs}</option>
                )) ?? (
                  <>
                    <option value="1">{t("inventory.title", "Inventory")}</option>
                    <option value="2">{t("inventory.fridge", "Fridge")}</option>
                    <option value="3">{t("inventory.freezer", "Freezer")}</option>
                  </>
                )}
              </select>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground">📅 Fecha de caducidad</label>
                  {expiryLoading && (
                    <span className="text-xs text-orange-500 animate-pulse">✨ Estimando...</span>
                  )}
                  {!expiryLoading && expirySource && expirationDate && (
                    <span className="text-xs text-green-600">
                      {expirySource === "lookup" ? "✓ Estimada" : expirySource === "ai" ? "✨ IA" : "✓ Estimada"} · editable
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => { setExpirationDate(e.target.value); setExpirySource(null); }}
                  className="vively-input"
                  min={new Date().toISOString().split("T")[0]}
                />
                {!expirationDate && !expiryLoading && customName.trim() && (
                  <p className="mt-1 text-xs text-muted-foreground/70">Escribe el nombre y pulsa fuera para estimar la fecha</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!customName.trim()) { toast.error("El nombre es obligatorio"); return; }
                  addItem.mutate({
                    customName: customName.trim(),
                    amount: amount ? Number(amount) : 1,
                    measureId: Number(measureId),
                    storageLocationId: Number(storageLocation),
                    expirationDate: expirationDate || undefined,
                  });
                }}
                disabled={addItem.isPending}
                className="flex-1 btn-vively"
              >
                {addItem.isPending ? "Añadiendo..." : t("common.add")}
              </button>
            </div>
          </div>
        </div>
      )}

 {/* Photo AI modal */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowPhotoModal(false); setPhotoPreview(null); setPhotoFile(null); setDetectedProducts([]); } }}>
          <div className="w-full max-w-sm rounded-3xl bg-background shadow-2xl animate-slide-up overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center gap-2 text-white">
                <SparklesIcon className="h-5 w-5" />
                <span className="font-bold">Analizar con IA</span>
              </div>
              <button
                onClick={() => { setShowPhotoModal(false); setPhotoPreview(null); setPhotoFile(null); setDetectedProducts([]); }}
                className="rounded-full p-1 text-white/80 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Photo area */}
              {!photoPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 py-10 cursor-pointer hover:bg-indigo-100 transition-colors"
                >
                  <CameraIcon className="h-12 w-12 text-indigo-400" />
                  <div className="text-center">
                    <p className="font-semibold text-indigo-700">Haz una foto</p>
                    <p className="text-xs text-indigo-400">de tu nevera o despensa</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img src={photoPreview} alt="Preview" className="w-full rounded-2xl object-cover max-h-48" />
                  <button
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); setDetectedProducts([]); }}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Analyze button */}
              {photoPreview && detectedProducts.length === 0 && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white shadow-lg disabled:opacity-60"
                >
                  {analyzing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-4 w-4" />
                      Detectar productos
                    </>
                  )}
                </button>
              )}

              {/* Detected products */}
              {detectedProducts.length > 0 && (
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{detectedProducts.length} productos detectados</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">Edita nombre, cantidad o caducidad antes de guardar</p>
                    </div>
                    <button
                      onClick={() => setDetectedProducts((prev) => prev.map((p) => ({ ...p, selected: !prev.every((x) => x.selected) })))}
                      className="text-xs text-indigo-600 font-semibold"
                    >
                      {detectedProducts.every((p) => p.selected) ? "Deseleccionar" : "Seleccionar todo"}
                    </button>
                  </div>
                  <div className="max-h-[52vh] overflow-y-auto space-y-3 pr-1">
                    {detectedProducts.map((product, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 transition-colors ${
                          product.selected ? "border-indigo-300 bg-indigo-50" : "border-border bg-muted/30 opacity-60"
                        }`}
                      >
                        {/* Row 1: checkbox + name editable */}
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => setDetectedProducts((prev) => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p))}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              product.selected ? "border-indigo-500 bg-indigo-500" : "border-border bg-background"
                            }`}
                          >
                            {product.selected && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                          </button>
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => setDetectedProducts((prev) => prev.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                            className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-indigo-400"
                            placeholder="Nombre del producto"
                          />
                          {/* Delete product */}
                          <button
                            onClick={() => setDetectedProducts((prev) => prev.filter((_, i) => i !== idx))}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title=t("common.delete")
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {/* Row 2: amount + unit + expiry */}
                        <div className="flex items-center gap-2 pl-8">
                          <input
                            type="number"
                            value={product.amount}
                            min="0.1"
                            step="0.1"
                            onChange={(e) => setDetectedProducts((prev) => prev.map((p, i) => i === idx ? { ...p, amount: parseFloat(e.target.value) || 1 } : p))}
                            className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground/80 outline-none focus:border-indigo-400 text-center"
                          />
                          <input
                            type="text"
                            value={product.unit}
                            onChange={(e) => setDetectedProducts((prev) => prev.map((p, i) => i === idx ? { ...p, unit: e.target.value } : p))}
                            className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground/80 outline-none focus:border-indigo-400"
                            placeholder="unidad"
                          />
                          <span className="text-xs text-muted-foreground/70">·</span>
                          <input
                            type="date"
                            value={product.expirationDate ?? ""}
                            onChange={(e) => setDetectedProducts((prev) => prev.map((p, i) => i === idx ? { ...p, expirationDate: e.target.value } : p))}
                            className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-muted-foreground outline-none focus:border-indigo-400"
                            min={new Date().toISOString().split("T")[0]}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddDetected}
                    disabled={addingDetected || !detectedProducts.some((p) => p.selected)}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] py-3 font-semibold text-white shadow-lg disabled:opacity-60"
                  >
                    {addingDetected ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Añadiendo...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4" />
                        Añadir {detectedProducts.filter((p) => p.selected).length} al inventario
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tip */}
              {!photoPreview && (
                <p className="mt-4 text-center text-xs text-muted-foreground/70">
                  La IA detecta automáticamente los alimentos y te permite añadir la fecha de caducidad de cada uno
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="vively-disclaimer">
        <p>VIVELY no constituye recomendaciones profesionales de nutrición.</p>
      </div>

 {/* Barcode Scanner */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onProductFound={(product) => {
            setShowBarcodeScanner(false);
            setBarcodeProduct(product);
            setBarcodeAmount("1");
            setBarcodeExpiry("");
            setBarcodeLocation("1");
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

 {/* Barcode Product Confirmation Modal */}
      {barcodeProduct && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setBarcodeProduct(null); }}
          style={{ overflowY: "auto" }}
        >
          <div style={{ background: "white", borderRadius: "24px", width: "100%", maxWidth: 500, padding: "0", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", overflowY: "auto" }}>
            {/* Modal header */}
            <div style={{ background: "linear-gradient(135deg, #F97316, #FB923C)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 1 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "white" }}>🥗 Información Nutricional</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Confirma y añade al inventario</p>
              </div>
              <button onClick={() => setBarcodeProduct(null)}
                style={{ background: "rgba(255,255,255,0.25)", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "white", fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ×
              </button>
            </div>

            {/* Nutrition card */}
            <div style={{ padding: "20px 20px 0" }}>
              <ProductNutritionCard
                name={barcodeProduct.name}
                brand={barcodeProduct.brand}
                quantity={barcodeProduct.quantity}
                imageUrl={barcodeProduct.imageUrl}
                nutriScore={barcodeProduct.nutriScore}
                novaGroup={barcodeProduct.novaGroup}
                per100g={barcodeProduct.per100g}
                compact
              />
            </div>

            {/* Inventory fields */}
            <div style={{ padding: "16px 20px 24px" }}>
              <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16, marginBottom: 14 }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Añadir al inventario</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Cantidad</label>
                    <input type="number" value={barcodeAmount} onChange={e => setBarcodeAmount(e.target.value)} min="0.1" step="0.1"
                      style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 15, fontWeight: 600, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Ubicación</label>
                    <select value={barcodeLocation} onChange={e => setBarcodeLocation(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontWeight: 600, boxSizing: "border-box" }}>
                      <option value="1">🧊 Nevera</option>
                      <option value="2">❄️ Congelador</option>
                      <option value="3">🏠 Despensa</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Fecha de caducidad (opcional)</label>
                  <input type="date" value={barcodeExpiry} onChange={e => setBarcodeExpiry(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setBarcodeProduct(null)}
                  style={{ flex: 1, padding: "13px", background: "#f3f4f6", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await addItem.mutateAsync({
                        customName: barcodeProduct.name,
                        amount: parseFloat(barcodeAmount) || 1,
                        storageLocationId: parseInt(barcodeLocation),
                        expirationDate: barcodeExpiry || undefined,
                      });
                      toast.success(`"${barcodeProduct.name}" añadido al inventario`);
                      setBarcodeProduct(null);
                    } catch {
                      toast.error("Error al añadir el producto");
                    }
                  }}
                  style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg, #F97316, #FB923C)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}>
                  <CheckIcon className="h-4 w-4" />
                  Añadir al inventario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anti-waste AI recipes modal */}
      {showAntiWaste && generatedRecipes.length > 0 && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowAntiWaste(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">♻️</span>
                <div>
                  <p className="font-bold">Recetas anti-desperdicio</p>
                  <p className="text-xs text-green-100">Generadas con IA para tus productos</p>
                </div>
              </div>
              <button onClick={() => setShowAntiWaste(false)} className="rounded-full p-1 hover:bg-background/20">
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
            {/* Recipes list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {generatedRecipes.map((recipe, idx) => (
                <div key={idx} className="rounded-2xl border border-border/50 bg-background shadow-sm overflow-hidden">
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 text-2xl">
                      {recipe.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground leading-tight">{recipe.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{recipe.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                          ⏱ {recipe.prepTime} min
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          (recipe.difficulty === "Fácil" || recipe.difficulty === "easy" || recipe.difficulty === "facil") ? "bg-green-100 text-green-700" :
                          (recipe.difficulty === "Media" || recipe.difficulty === "medium" || recipe.difficulty === "medio") ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {{ easy: "Fácil", facil: "Fácil", medium: "Media", medio: "Media", hard: "Difícil", dificil: "Difícil" }[recipe.difficulty] ?? recipe.difficulty}
                        </span>
                      </div>
                      {recipe.usedIngredients.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {recipe.usedIngredients.map((ing, i) => (
                            <span key={i} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700 border border-orange-100">
                              {ing}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="shrink-0 border-t border-border/50 p-4">
              <button
                onClick={async () => {
                  setGeneratedRecipes([]);
                  setGeneratingRecipes(true);
                  setShowAntiWaste(false);
                  try {
                    const result = await generateAntiWaste.mutateAsync();
                    if (result.recipes && result.recipes.length > 0) {
                      setGeneratedRecipes(result.recipes);
                      setShowAntiWaste(true);
                    }
                  } catch {
                    toast.error("Error al regenerar recetas.");
                  } finally {
                    setGeneratingRecipes(false);
                  }
                }}
                className="w-full rounded-2xl border border-green-200 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 active:scale-95 transition-transform"
              >
                ✨ Regenerar recetas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Recipes Modal */}
      {showInventoryRecipes && inventoryRecipes.length > 0 && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowInventoryRecipes(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-background shadow-2xl animate-slide-up overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <span className="text-xl">🍳</span>
                <div>
                  <p className="font-bold">Recetas con tu inventario</p>
                  <p className="text-xs text-indigo-100">Generadas con IA para ti</p>
                </div>
              </div>
              <button onClick={() => setShowInventoryRecipes(false)} className="rounded-full p-1 hover:bg-background/20">
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {inventoryRecipes.map((recipe, idx) => (
                <div key={idx} className="rounded-2xl border border-border/50 bg-background shadow-sm overflow-hidden">
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-2xl">
                      {recipe.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-foreground leading-tight">{recipe.name}</p>
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 capitalize">{recipe.mealType}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{recipe.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">⏱ {recipe.prepTime} min</span>
                        {recipe.calories > 0 && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-700">🔥 {recipe.calories} kcal</span>}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          (recipe.difficulty === "Fácil" || recipe.difficulty === "easy") ? "bg-green-100 text-green-700" :
                          (recipe.difficulty === "Media" || recipe.difficulty === "medium") ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>{recipe.difficulty}</span>
                      </div>
                      {recipe.usedIngredients.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {recipe.usedIngredients.map((ing, i) => (
                            <span key={i} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 border border-indigo-100">{ing}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* CTA: Hacer esta receta */}
                  <div className="border-t border-gray-50 px-4 pb-3">
                    <button
                      onClick={() => {
                        toast.success(`"${recipe.name}" añadida al diario ✓`, {
                          description: `${recipe.calories > 0 ? recipe.calories + " kcal · " : ""}${recipe.prepTime} min`,
                        });
                      }}
                      className="w-full rounded-xl py-2.5 text-xs font-bold text-white flex items-center justify-center gap-1.5"
                      style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      Hacer esta receta
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 border-t border-border/50 p-4">
              <button
                onClick={async () => {
                  setInventoryRecipes([]);
                  setGeneratingInventoryRecipes(true);
                  setShowInventoryRecipes(false);
                  try {
                    const result = await generateFromInventory.mutateAsync();
                    if (result.recipes && result.recipes.length > 0) {
                      setInventoryRecipes(result.recipes as any);
                      setShowInventoryRecipes(true);
                    }
                  } catch {
                    toast.error("Error al regenerar recetas.");
                  } finally {
                    setGeneratingInventoryRecipes(false);
                  }
                }}
                className="w-full rounded-2xl border border-indigo-200 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 active:scale-95 transition-transform"
              >
                ✨ Regenerar recetas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import from Shopping List Modal ─────────────────────────────────────────────────────────── */}
      {showImportModal && (        <div className="fixed inset-0 z-[500] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">Importar lista de la compra</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Añade los productos comprados directamente al inventario</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="rounded-full p-1.5 hover:bg-muted/50">
                <XMarkIcon className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Shopping list selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Selecciona una lista de la compra</label>
              {!shoppingLists || shoppingLists.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">No tienes listas de la compra</p>
                  <button onClick={() => { setShowImportModal(false); navigate("/app/shopping"); }}
                    className="mt-2 text-sm font-medium text-violet-600 hover:underline">
                    Crear una lista →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {shoppingLists.map((list: any) => (
                    <button
                      key={list.id}
                      onClick={() => setSelectedListId(list.id)}
                      className={`w-full flex items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                        selectedListId === list.id
                          ? "border-violet-500 bg-violet-50 ring-1 ring-violet-300"
                          : "border-border bg-background hover:border-border"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm text-foreground">{list.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {list.purchased ?? 0} de {list.total ?? 0} productos comprados
                        </p>
                      </div>
                      {selectedListId === list.id && (
                        <CheckIcon className="h-5 w-5 text-violet-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="mb-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setImportOnlyChecked(!importOnlyChecked)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    importOnlyChecked ? "bg-violet-600" : "bg-muted"
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${
                    importOnlyChecked ? "translate-x-5" : "translate-x-0"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Solo productos marcados como comprados</p>
                  <p className="text-xs text-muted-foreground">Si está desactivado, importará todos los productos de la lista</p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 rounded-2xl border border-border py-3 text-sm font-semibold text-foreground/80 hover:bg-muted/30"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!selectedListId) { toast.error("Selecciona una lista primero"); return; }
                  importFromShoppingList.mutate({ shoppingListId: selectedListId, onlyChecked: importOnlyChecked });
                }}
                disabled={!selectedListId || importFromShoppingList.isPending}
                className="flex-1 rounded-2xl bg-violet-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50 active:scale-95 transition-transform"
              >
                {importFromShoppingList.isPending ? "Importando..." : "Importar al inventario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
