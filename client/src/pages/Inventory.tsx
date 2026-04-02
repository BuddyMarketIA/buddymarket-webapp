import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import BarcodeScanner from "@/components/BarcodeScanner";
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
  if (days === null) return "";
  if (days < 0) return "border-red-300 bg-red-50";
  if (days <= 2) return "border-red-200 bg-red-50";
  if (days <= 5) return "border-orange-200 bg-orange-50";
  if (days <= 7) return "border-yellow-200 bg-yellow-50";
  return "border-gray-100 bg-white";
}

function expiryBadge(days: number | null) {
  if (days === null) return null;
  if (days < 0) return <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">Vencido</span>;
  if (days === 0) return <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">Hoy</span>;
  if (days <= 2) return <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">{days}d ⚠️</span>;
  if (days <= 5) return <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">{days}d</span>;
  if (days <= 7) return <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-600">{days}d</span>;
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
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState("all");

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [storageLocation, setStorageLocation] = useState("1");
  const [expirationDate, setExpirationDate] = useState("");

  // Photo AI state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<{
    name: string;
    brand: string | null;
    imageUrl: string | null;
    quantity: string | null;
    per100g: { calories: number; proteins: number; carbohydrates: number; fats: number };
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

  const { data: items, isLoading, refetch } = trpc.inventory.list.useQuery();
  const { data: storageLocations } = trpc.catalogs.storageLocations.useQuery();
  const { data: expiringItems } = trpc.inventory.getExpiringItems.useQuery({ days: 7 });
  const { data: recipeRecs } = trpc.inventory.getRecipesByExpiring.useQuery();
  const utils = trpc.useUtils();

  const analyzePhoto = trpc.inventory.analyzePhoto.useMutation();

  const addItem = trpc.inventory.add.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      utils.inventory.getExpiringItems.invalidate();
      setShowAdd(false);
      setCustomName("");
      setAmount("");
      setExpirationDate("");
      toast.success("Producto añadido al inventario");
    },
    onError: (err) => toast.error(err.message),
  });

  const addItemSilent = trpc.inventory.add.useMutation({
    onError: (err) => toast.error(err.message),
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          {expiringCount > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
              <span>{expiringCount} producto{expiringCount !== 1 ? "s" : ""} próximo{expiringCount !== 1 ? "s" : ""} a vencer</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
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
              const days = daysUntil(item.expirationDate);
              const name = item.customName || item.ingredientId || "Alimento";
              return (
                <span key={item.id} className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                  {name} · {days === 0 ? "hoy" : days !== null && days < 0 ? "vencido" : `${days}d`}
                </span>
              );
            })}
            {(expiringItems ?? []).length > 4 && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                +{(expiringItems ?? []).length - 4} más
              </span>
            )}
          </div>
        </div>
      )}

      {/* Recipe recommendations from expiring items */}
      {recipeRecs && recipeRecs.expiringIngredients.length > 0 && recipeRecs.recipes.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-bold text-gray-800">Recetas para lo que caduca</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recipeRecs.recipes.slice(0, 5).map((recipe: any) => (
              <button
                key={recipe.id}
                onClick={() => navigate(`/app/recipes/${recipe.id}`)}
                className="shrink-0 w-36 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden text-left active:scale-95 transition-transform"
              >
                {recipe.imageUrl ? (
                  <img src={recipe.imageUrl} alt={recipe.name} className="h-24 w-full object-cover" />
                ) : (
                  <div className="h-24 w-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-3xl">🍽️</div>
                )}
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{recipe.name}</p>
                  {recipe.calories && (
                    <p className="mt-1 text-xs text-gray-400">{recipe.calories} kcal</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gray-100 px-4 py-3">
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en inventario..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
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

      {/* Items */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="vively-card animate-pulse h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {search ? (
            <>
              <span className="mb-4 text-5xl">🔍</span>
              <h3 className="mb-2 text-base font-bold text-gray-900">Sin resultados</h3>
              <p className="mb-6 text-sm text-gray-500">No encontramos "{search}" en tu inventario</p>
              <button onClick={() => setSearch("")} className="btn-vively-outline">Limpiar búsqueda</button>
            </>
          ) : (
            <>
              <span className="mb-3 text-6xl">📦</span>
              <h3 className="mb-1 text-lg font-bold text-gray-900">Tu inventario está vacío</h3>
              <p className="mb-2 text-sm text-gray-500 max-w-xs text-center">Añade los alimentos que tienes en casa para recibir alertas de caducidad y sugerencias de recetas</p>
              <div className="mb-6 flex flex-col gap-2 text-xs text-gray-400">
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
          {filtered.map((item) => {
            const days = daysUntil(item.item.expirationDate);
            const name = item.ingredient?.nameEs ?? item.item.customName ?? "Alimento";
            const emoji = locEmoji(item.storageLocation);
            const locLabel = (item.storageLocation as any)?.nameEs ?? "Despensa";

            return (
              <div
                key={item.item.id}
                className={`flex items-center gap-3 rounded-2xl p-3 border shadow-sm ${expiryColor(days)}`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-xl shadow-sm">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 truncate">{name}</span>
                    {expiryBadge(days)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400 flex-wrap">
                    {item.item.amount && <span>{item.item.amount} {item.measure?.nameEs ?? ""}</span>}
                    {item.item.expirationDate && (
                      <span className="flex items-center gap-1">
                        📅 {new Date(item.item.expirationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })}
                      </span>
                    )}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">{locLabel}</span>
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

      {/* ── Add manually modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Añadir al inventario</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-full p-1 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Nombre del alimento *"
                className="vively-input"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Cantidad"
                  className="vively-input"
                />
                <select
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  className="vively-input"
                >
                  {storageLocations?.map((loc) => (
                    <option key={loc.id} value={String(loc.id)}>{loc.nameEs}</option>
                  )) ?? (
                    <>
                      <option value="1">Despensa</option>
                      <option value="2">Nevera</option>
                      <option value="3">Congelador</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">📅 Fecha de caducidad</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="vively-input"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!customName.trim()) { toast.error("El nombre es obligatorio"); return; }
                  addItem.mutate({
                    customName: customName.trim(),
                    amount: amount ? Number(amount) : 1,
                    storageLocationId: Number(storageLocation),
                    expirationDate: expirationDate || undefined,
                  });
                }}
                disabled={addItem.isPending}
                className="flex-1 btn-vively"
              >
                {addItem.isPending ? "Añadiendo..." : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo AI modal ─────────────────────────────────────────────────── */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl animate-slide-up overflow-hidden">
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
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">{detectedProducts.length} productos detectados</p>
                    <button
                      onClick={() => setDetectedProducts((prev) => prev.map((p) => ({ ...p, selected: !prev.every((x) => x.selected) })))}
                      className="text-xs text-indigo-600 font-semibold"
                    >
                      {detectedProducts.every((p) => p.selected) ? "Deseleccionar todo" : "Seleccionar todo"}
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {detectedProducts.map((product, idx) => (
                      <div
                        key={idx}
                        onClick={() => setDetectedProducts((prev) => prev.map((p, i) => i === idx ? { ...p, selected: !p.selected } : p))}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                          product.selected ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                          product.selected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                        }`}>
                          {product.selected && <CheckIcon className="h-3.5 w-3.5 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.amount} {product.unit} · {product.category}</p>
                        </div>
                        {/* Expiry date input per product */}
                        <input
                          type="date"
                          value={product.expirationDate ?? ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setDetectedProducts((prev) => prev.map((p, i) => i === idx ? { ...p, expirationDate: e.target.value } : p))}
                          className="w-28 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 outline-none"
                          placeholder="Caducidad"
                          min={new Date().toISOString().split("T")[0]}
                        />
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
                <p className="mt-4 text-center text-xs text-gray-400">
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

      {/* ─── Barcode Scanner ─────────────────────────────────────────────── */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onProductFound={(product) => {
            setShowBarcodeScanner(false);
            setBarcodeProduct({ ...product, quantity: null });
            setBarcodeAmount("1");
            setBarcodeExpiry("");
            setBarcodeLocation("1");
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* ─── Barcode Product Confirmation Modal ──────────────────────────── */}
      {barcodeProduct && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9998, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0 0" }}
          onClick={(e) => { if (e.target === e.currentTarget) setBarcodeProduct(null); }}
        >
          <div style={{ background: "white", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, padding: "24px 24px 32px", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)", animation: "slideUp 0.25s ease" }}>
            <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
              {barcodeProduct.imageUrl && (
                <img src={barcodeProduct.imageUrl} alt={barcodeProduct.name} style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.3 }}>{barcodeProduct.name}</h3>
                {barcodeProduct.brand && <p style={{ margin: "0 0 6px", fontSize: 13, color: "#6b7280", fontWeight: 600 }}>{barcodeProduct.brand}</p>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, background: "#fff7ed", color: "#ea580c", padding: "3px 8px", borderRadius: 8 }}>🔥 {barcodeProduct.per100g.calories} kcal/100g</span>
                  <span style={{ fontSize: 12, fontWeight: 700, background: "#f0fdf4", color: "#16a34a", padding: "3px 8px", borderRadius: 8 }}>💪 {barcodeProduct.per100g.proteins}g prot</span>
                  <span style={{ fontSize: 12, fontWeight: 700, background: "#eff6ff", color: "#2563eb", padding: "3px 8px", borderRadius: 8 }}>🌾 {barcodeProduct.per100g.carbohydrates}g carb</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
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

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Fecha de caducidad (opcional)</label>
              <input type="date" value={barcodeExpiry} onChange={e => setBarcodeExpiry(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
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
                style={{ flex: 2, padding: "13px", background: "#16a34a", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <CheckIcon className="h-4 w-4" />
                Añadir al inventario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
