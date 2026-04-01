import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const LOCATIONS = [
  { key: "fridge", label: "Nevera", emoji: "🧊" },
  { key: "freezer", label: "Congelador", emoji: "❄️" },
  { key: "pantry", label: "Despensa", emoji: "🏠" },
  { key: "other", label: "Otro", emoji: "📦" },
];

function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [storageLocation, setStorageLocation] = useState("1");
  const [expirationDate, setExpirationDate] = useState("");

  const { data: items, isLoading, refetch } = trpc.inventory.list.useQuery();
  const { data: storageLocations } = trpc.catalogs.storageLocations.useQuery();
  const utils = trpc.useUtils();

  const addItem = trpc.inventory.add.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      setShowAdd(false);
      setCustomName("");
      setAmount("");
      setExpirationDate("");
      toast.success("Producto añadido al inventario");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeItem = trpc.inventory.remove.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Producto eliminado"); },
  });

  const filtered = (items ?? []).filter((item) => {
    const name = item.item.customName || item.ingredient?.nameEs || "";
    const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase());
    const loc = (item.storageLocation as any)?.key ?? (item.storageLocation as any)?.nameEs ?? "";
    const matchLoc = activeLocation === "all" || loc === activeLocation || String((item.storageLocation as any)?.id) === storageLocation;
    return matchSearch;
  });

  const expiringCount = (items ?? []).filter((item) => {
    const days = daysUntil(item.item.expirationDate);
    return days !== null && days <= 3 && days >= 0;
  }).length;

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          {expiringCount > 0 && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-orange-500">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" />
              <span>{expiringCount} próximo{expiringCount !== 1 ? "s" : ""} a vencer</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] shadow-sm"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      </div>

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
        <button
          onClick={() => setActiveLocation("all")}
          className={`selectable-badge shrink-0 ${activeLocation === "all" ? "selectable-badge-active" : "selectable-badge-inactive"}`}
        >
          Todo
        </button>
        {LOCATIONS.map((loc) => (
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
          <span className="mb-4 text-5xl">📦</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">
            {search ? "Sin resultados" : "Inventario vacío"}
          </h3>
          <p className="mb-6 text-sm text-gray-500">
            {search ? "Prueba con otro término" : "Añade los alimentos que tienes en casa"}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="btn-vively">Añadir alimento</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const days = daysUntil(item.item.expirationDate);
            const isExpired = days !== null && days < 0;
            const isExpiring = days !== null && days <= 3 && days >= 0;
            const locId = String((item.storageLocation as any)?.id ?? "");
            const locInfo = LOCATIONS.find((l) => l.key === (item.storageLocation as any)?.key) ??
              { emoji: "📦", label: item.storageLocation?.nameEs ?? "Despensa" };

            return (
              <div
                key={item.item.id}
                className={`flex items-center gap-3 rounded-2xl bg-white p-3 border shadow-sm ${
                  isExpired ? "border-red-200 bg-red-50" : isExpiring ? "border-orange-200 bg-orange-50" : "border-gray-100"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-xl">
                  {locInfo.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {item.ingredient?.nameEs ?? item.item.customName ?? "Alimento"}
                    </span>
                    {isExpired && <span className="badge-red shrink-0">Vencido</span>}
                    {isExpiring && !isExpired && <span className="badge-orange shrink-0">{days}d</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                    {item.item.amount && <span>{item.item.amount} {item.measure?.nameEs ?? ""}</span>}
                    {item.item.expirationDate && (
                      <span>
                        Vence: {new Date(item.item.expirationDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    <span className="badge-gray">{locInfo.label}</span>
                  </div>
                </div>
                <button
                  onClick={() => removeItem.mutate({ id: item.item.id })}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Añadir al inventario</h3>
            <div className="space-y-3">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Nombre del alimento"
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
                <label className="mb-1 block text-xs font-semibold text-gray-500">Fecha de caducidad (opcional)</label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  className="vively-input"
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
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vively-disclaimer">
        <p>VIVELY no constituye recomendaciones profesionales de nutrición.</p>
      </div>
    </div>
  );
}
