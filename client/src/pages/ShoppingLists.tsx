import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  PlusIcon,
  ChevronLeftIcon,
  TrashIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

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
    const cat = item.ingredient?.foodCategory?.name ?? "Sin categoría";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{(listData as any)?.list?.name ?? (listData as any)?.name ?? "Lista de compra"}</h1>
          <p className="text-xs text-gray-500">{purchased}/{items.length} comprados</p>
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
        <div className="vively-card mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Progreso</span>
            <span className="text-sm font-bold text-[#F97316]">{pct}%</span>
          </div>
          <div className="macro-bar">
            <div className="macro-bar-fill" style={{ width: `${pct}%`, background: "#F97316" }} />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vively-card animate-pulse h-14" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <span className="mb-4 text-5xl">🛒</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">Lista vacía</h3>
          <p className="mb-6 text-sm text-gray-500">Añade productos a tu lista de compra</p>
          <button onClick={() => setShowAdd(true)} className="btn-vively">Añadir producto</button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{category}</h3>
              <div className="space-y-2">
                {catItems.map((item: any) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-2xl bg-white p-3 border transition-all ${
                      item.isPurchased ? "border-[#F97316]/30 bg-orange-50" : "border-gray-100 shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() => toggleItem.mutate({ id: item.id })}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        item.isPurchased
                          ? "border-[#F97316] bg-[#F97316]"
                          : "border-gray-300 hover:border-[#F97316]"
                      }`}
                    >
                      {item.isPurchased && <CheckIcon className="h-4 w-4 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${item.isPurchased ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {item.ingredient?.name ?? item.customName ?? "Producto"}
                      </span>
                      {item.amount && (
                        <span className="ml-2 text-xs text-gray-400">
                          {item.amount} {item.measure?.name ?? ""}
                        </span>
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
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600">
                Cancelar
              </button>
              <button
                onClick={() => addItem.mutate({ shoppingListId: listId, customName: newItem })}
                disabled={!newItem || addItem.isPending}
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

export default function ShoppingLists() {
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: lists, isLoading, refetch } = trpc.shoppingLists.list.useQuery();
  const utils = trpc.useUtils();

  const createList = trpc.shoppingLists.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
      setNewName("");
      toast.success("Lista creada");
    },
  });
  const deleteList = trpc.shoppingLists.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Lista eliminada"); },
  });

  if (selectedListId !== null) {
    return <ShoppingListDetail listId={selectedListId} onBack={() => setSelectedListId(null)} />;
  }

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lista de compra</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] shadow-sm"
        >
          <PlusIcon className="h-5 w-5 text-white" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="vively-card animate-pulse h-20" />)}
        </div>
      ) : lists && lists.length > 0 ? (
        <div className="space-y-3">
          {lists.map((list) => {
            const total = (list as any).itemCount ?? 0;
            const done = (list as any).purchasedCount ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className="vively-card flex items-center gap-4 cursor-pointer hover:border-[#F97316]/30 transition-all"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                  <span className="text-2xl">🛒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{list.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="macro-bar flex-1">
                      <div className="macro-bar-fill" style={{ width: `${pct}%`, background: "#F97316" }} />
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{done}/{total}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("¿Eliminar esta lista?")) deleteList.mutate({ id: list.id });
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
          <p className="mb-6 text-sm text-gray-500">Crea tu primera lista de compra</p>
          <button onClick={() => setShowNew(true)} className="btn-vively">Crear lista</button>
        </div>
      )}

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

      <div className="vively-disclaimer">
        <p>VIVELY no constituye recomendaciones profesionales de nutrición.</p>
      </div>
    </div>
  );
}
