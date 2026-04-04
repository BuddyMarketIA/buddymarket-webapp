import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronLeftIcon, ShoppingCartIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface ShoppingItem { id: number; name: string; qty?: string; unit?: string; isPurchased: boolean; }
interface MatchedProduct {
  itemId: number; itemName: string;
  product: { id: string; name: string; image: string | null; price: number | null; priceStr: string; brand: string | null; category: string | null; } | null;
  qty: number; confirmed: boolean;
}
interface Props { items: ShoppingItem[]; onBack: () => void; onClose: () => void; }

function normalizeSearchTerm(name: string): string {
  return name
    .replace(/\([^)]*\)/g, "")
    .replace(/\d+[.,]?\d*\s*(g|kg|ml|l|cl|oz|lb|unidad|unidades|cucharad[ai]ta?|taza|tazas|pizca)?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(/[,;]/)[0]
    .trim();
}

function ItemSearch({ itemName, onResult }: { itemName: string; onResult: (product: MatchedProduct["product"]) => void }) {
  const searchTerm = normalizeSearchTerm(itemName);
  const { data, isLoading } = trpc.carrefour.searchProducts.useQuery(
    { q: searchTerm || itemName, limit: 3 },
    { enabled: true }
  );
  const reported = useRef(false);
  useEffect(() => {
    if (!isLoading && !reported.current) {
      reported.current = true;
      const p = data?.[0];
      onResult(p ? {
        id: p.id,
        name: p.name,
        image: p.image ?? null,
        price: p.price ?? null,
        priceStr: p.price ? `${Number(p.price).toFixed(2)}€` : "—",
        brand: p.brand ?? null,
        category: p.category ?? null,
      } : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);
  return null;
}

export default function CarrefourCartExport({ items, onBack, onClose }: Props) {
  const [matched, setMatched] = useState<MatchedProduct[]>([]);
  const [resolved, setResolved] = useState(0);
  const unpurchased = items.filter((i) => !i.isPurchased);

  useEffect(() => {
    setMatched(unpurchased.map((item) => ({
      itemId: item.id,
      itemName: item.name,
      product: null,
      qty: 1,
      confirmed: false,
    })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProductResult = (itemId: number, product: MatchedProduct["product"]) => {
    setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, product, confirmed: product !== null } : m));
    setResolved((r) => r + 1);
  };

  const updateQty = (itemId: number, delta: number) => {
    setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, qty: Math.max(1, m.qty + delta) } : m));
  };

  const confirmedItems = matched.filter((m) => m.confirmed && m.product);
  const notFoundItems = matched.filter((m) => resolved > 0 && !m.product);
  const isSearching = resolved < unpurchased.length;
  const totalPrice = confirmedItems.reduce((sum, m) => sum + (m.product?.price ?? 0) * m.qty, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔵</span>
          <h3 className="text-lg font-bold text-gray-900">Carrefour</h3>
        </div>
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
      </div>

      {/* Hidden search components */}
      {unpurchased.map((item) => (
        <ItemSearch key={item.id} itemName={item.name} onResult={(p) => handleProductResult(item.id, p)} />
      ))}

      {/* Loading state */}
      {isSearching && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#004A97] border-t-transparent" />
          <p className="text-sm text-gray-500">Buscando productos en Carrefour… {resolved}/{unpurchased.length}</p>
        </div>
      )}

      {!isSearching && (
        <>
          {/* Summary */}
          <div className="rounded-2xl bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#004A97]">{confirmedItems.length} productos encontrados</p>
                {notFoundItems.length > 0 && (
                  <p className="text-xs text-gray-500">{notFoundItems.length} no encontrados en Carrefour</p>
                )}
              </div>
              {totalPrice > 0 && (
                <p className="text-lg font-black text-[#004A97]">~{totalPrice.toFixed(2)}€</p>
              )}
            </div>
          </div>

          {/* Product list */}
          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
            {confirmedItems.map((m) => (
              <div key={m.itemId} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 hover:border-blue-200 transition-all">
                {/* Product image */}
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                  {m.product?.image ? (
                    <img
                      src={m.product.image}
                      alt={m.product.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <span className="text-xl">🛒</span>
                  )}
                </div>
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{m.product!.name}</p>
                  {m.product?.brand && <p className="text-xs text-gray-400">{m.product.brand}</p>}
                  {m.product?.price && (
                    <p className="text-sm font-bold mt-0.5 text-[#004A97]">
                      {m.product.priceStr} × {m.qty} = {((m.product.price ?? 0) * m.qty).toFixed(2)}€
                    </p>
                  )}
                </div>
                {/* Qty controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => updateQty(m.itemId, -1)} className="w-7 h-7 rounded-full border-2 border-gray-200 text-gray-600 font-bold flex items-center justify-center hover:border-gray-400">−</button>
                  <span className="w-5 text-center text-sm font-bold text-gray-900">{m.qty}</span>
                  <button onClick={() => updateQty(m.itemId, 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#004A97" }}>+</button>
                </div>
              </div>
            ))}

            {/* Not found items */}
            {notFoundItems.map((m) => (
              <div key={m.itemId} className="flex items-center gap-3 py-2 opacity-40">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xl text-gray-300">?</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">{m.itemName}</p>
                  <p className="text-xs text-gray-400 italic">No encontrado en Carrefour</p>
                </div>
                <a
                  href={`https://www.carrefour.es/supermercado/buscar?query=${encodeURIComponent(m.itemName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 underline shrink-0"
                >
                  Buscar
                </a>
              </div>
            ))}
          </div>

          {/* Total */}
          {confirmedItems.length > 0 && totalPrice > 0 && (
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Total estimado</p>
              <p className="text-xl font-black text-gray-900">{totalPrice.toFixed(2)}€</p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                confirmedItems.forEach((m, idx) => {
                  const url = `https://www.carrefour.es/supermercado/buscar?query=${encodeURIComponent(m.product!.name)}`;
                  setTimeout(() => window.open(url, "_blank"), idx * 350);
                });
                toast.success(`Abriendo ${confirmedItems.length} productos en Carrefour`);
              }}
              disabled={confirmedItems.length === 0}
              className="w-full rounded-2xl py-4 text-base font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #004A97, #0066CC)", boxShadow: "0 4px 16px rgba(0,74,151,0.35)" }}
            >
              <ShoppingCartIcon className="h-5 w-5" />
              Buscar en Carrefour ({confirmedItems.length})
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const text = confirmedItems.map((m) => `• ${m.product!.name} ×${m.qty}`).join("\n");
                  navigator.clipboard.writeText(text).then(() => toast.success("Lista copiada"));
                }}
                className="flex-1 rounded-2xl py-3 text-sm font-bold border-2 border-gray-200 text-gray-700 flex items-center justify-center gap-1.5"
              >
                Copiar lista
              </button>
              <button
                onClick={() => window.open("https://www.carrefour.es/supermercado", "_blank")}
                className="flex-1 rounded-2xl py-3 text-sm font-bold border-2 border-gray-200 text-gray-700 flex items-center justify-center gap-1.5"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Ir a Carrefour
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
