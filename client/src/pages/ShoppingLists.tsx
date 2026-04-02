import { useState } from "react";
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
} from "@heroicons/react/24/outline";

const SUPERMARKETS = [
  { id: "general", name: "General", emoji: "🛒" },
  { id: "mercadona", name: "Mercadona", emoji: "🟠" },
  { id: "lidl", name: "Lidl", emoji: "🔵" },
  { id: "carrefour", name: "Carrefour", emoji: "🔴" },
  { id: "alcampo", name: "Alcampo", emoji: "🟢" },
  { id: "dia", name: "Dia", emoji: "🔴" },
  { id: "el_corte_ingles", name: "El Corte Inglés", emoji: "🟢" },
];

function ShoppingListDetail({ listId, onBack }: { listId: number; onBack: () => void }) {
  const { data: listData, isLoading } = trpc.shoppingLists.getById.useQuery({ id: listId });
  const utils = trpc.useUtils();
  const [newItem, setNewItem] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const toggleItem = trpc.shoppingLists.toggleItem.useMutation({
    onSuccess: () => utils.shoppingLists.getById.invalidate({ id: listId }),
  });
  const removeItem = trpc.shoppingLists.removeItem.useMutation({
    onSuccess: () => utils.shoppingLists.getById.invalidate({ id: listId }),
  });
  const addItem = trpc.shoppingLists.addItem.useMutation({
    onSuccess: () => {
      utils.shoppingLists.getById.invalidate({ id: listId });
      setNewItem("");
      setShowAdd(false);
      toast.success("Producto añadido");
    },
  });

  const items = listData?.items ?? [];
  const purchased = items.filter((i: any) => i.isPurchased).length;
  const pct = items.length > 0 ? Math.round((purchased / items.length) * 100) : 0;

  // Group by category
  const grouped: Record<string, any[]> = {};
  items.forEach((item: any) => {
    const cat = item.ingredient?.foodCategory?.name ?? "General";
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
          <p className="text-xs text-gray-500">{purchased}/{items.length} productos</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F97316] shadow-sm"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Progress */}
      {items.length > 0 && (
        <div className="vively-card mb-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="macro-bar">
              <div className="macro-bar-fill" style={{ width: `${pct}%`, background: "#F97316" }} />
            </div>
          </div>
          <span className="text-sm font-bold text-[#F97316]">{pct}%</span>
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
                className={`vively-card flex items-center gap-3 transition-all ${item.isPurchased ? "opacity-50" : ""}`}
              >
                <button
                  onClick={() => toggleItem.mutate({ id: item.id })}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    item.isPurchased ? "border-[#F97316] bg-[#F97316]" : "border-gray-200"
                  }`}
                >
                  {item.isPurchased && <CheckIcon className="h-4 w-4 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.isPurchased ? "line-through text-gray-400" : "text-gray-900"}`}>
                    {item.ingredient?.name ?? item.customName ?? item.name ?? "Producto"}
                  </p>
                  {(item.amount || item.quantity) && (
                    <p className="text-xs text-gray-400">
                      {item.amount ?? item.quantity} {item.measure?.name ?? item.unit ?? ""}
                    </p>
                  )}
                </div>
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

      {items.length === 0 && (
        <div className="empty-state">
          <span className="mb-4 text-5xl">🛒</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">Lista vacía</h3>
          <p className="mb-6 text-sm text-gray-500">Añade productos a tu lista</p>
          <button onClick={() => setShowAdd(true)} className="btn-vively">Añadir producto</button>
        </div>
      )}

      {/* Add item modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Añadir producto</h3>
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem.mutate({ shoppingListId: listId, customName: newItem })}
              placeholder="Nombre del producto"
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

      <div className="vively-disclaimer">
        <p>BuddyMarket no constituye recomendaciones profesionales de nutrición.</p>
      </div>
    </div>
  );
}

export default function ShoppingLists() {
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showFromMenu, setShowFromMenu] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);
  const [persons, setPersons] = useState(2);
  const [supermarket, setSupermarket] = useState("general");

  const { data: lists, isLoading, refetch } = trpc.shoppingLists.list.useQuery();
  const { data: myMenus } = trpc.menus.list.useQuery();

  const createList = trpc.shoppingLists.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
      setNewName("");
      toast.success("Lista creada");
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
      toast.error(err.message || "Error al generar la lista");
    },
  });

  const deleteList = trpc.shoppingLists.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Lista eliminada"); },
  });

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

      {/* New list modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Nueva lista</h3>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
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
                    <span className="text-[10px] font-medium text-gray-600 leading-tight">{s.name}</span>
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
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {myMenus.map((menu: any) => (
                    <button
                      key={menu.id}
                      onClick={() => setSelectedMenuId(menu.id)}
                      className={`w-full rounded-2xl border-2 p-3 text-left transition-all ${
                        selectedMenuId === menu.id
                          ? "border-[#F97316] bg-orange-50"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">{menu.name}</p>
                      <p className="text-xs text-gray-400">
                        {menu.startDate ? new Date(menu.startDate).toLocaleDateString("es-ES") : "Sin fecha"}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">No tienes menús guardados.</p>
                  <p className="text-xs text-gray-400 mt-1">Ve a Menús para crear uno o guarda un menú de la biblioteca.</p>
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
    </div>
  );
}
