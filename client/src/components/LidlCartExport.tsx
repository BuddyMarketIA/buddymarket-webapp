import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShoppingCartIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface ShoppingItem { id: number; name: string; qty?: string; unit?: string; isPurchased: boolean; }
interface MatchedProduct {
  itemId: number; itemName: string;
  product: { id: string; name: string; image: string | null; price: number | null; packaging: string; brand: string; productUrl: string | null; } | null;
  qty: number; confirmed: boolean;
}
interface Props { items: ShoppingItem[]; onBack: () => void; onClose: () => void; }

/** Strip quantities, units and parenthetical notes from ingredient names for better Lidl matching */
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
  const { data, isLoading } = trpc.lidl.searchProducts.useQuery({ query: searchTerm || itemName, limit: 3 }, { enabled: true });
  const reported = useRef(false);
  useEffect(() => {
    if (!isLoading && !reported.current) {
      reported.current = true;
      const p = data?.[0];
      onResult(p ? { id: p.id, name: p.name, image: p.image ?? null, price: p.price ?? null, packaging: p.packaging, brand: p.brand, productUrl: p.productUrl ?? null } : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);
  return null;
}

// Lidl brand colors
const LIDL_YELLOW = "#FFD700";
const LIDL_BLUE = "#0050AA";
const LIDL_RED = "#E3000B";

export default function LidlCartExport({ items, onBack, onClose }: Props) {
  const [matched, setMatched] = useState<MatchedProduct[]>([]);
  const [resolved, setResolved] = useState(0);

  const unpurchased = items.filter((i) => !i.isPurchased);

  useEffect(() => {
    setMatched(unpurchased.map((item) => ({ itemId: item.id, itemName: item.name, product: null, qty: 1, confirmed: false })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProductResult = (itemId: number, product: MatchedProduct["product"]) => {
    setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, product, confirmed: product !== null } : m));
    setResolved((r) => r + 1);
  };

  const updateQty = (itemId: number, delta: number) => setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, qty: Math.max(1, m.qty + delta) } : m));

  const confirmedItems = matched.filter((m) => m.confirmed && m.product);
  const totalPrice = confirmedItems.reduce((sum, m) => sum + (m.product!.price ?? 0) * m.qty, 0);
  const isSearching = resolved < unpurchased.length;

  const handleGoToLidl = () => {
    // Build a Lidl search URL with the first item
    const firstItem = confirmedItems[0];
    if (firstItem) {
      window.open(`https://www.lidl.es/q/search?q=${encodeURIComponent(firstItem.product!.name)}`, "_blank");
    } else {
      window.open("https://www.lidl.es", "_blank");
    }
  };

  const handleCopyList = () => {
    const text = confirmedItems.map((m) => `• ${m.product!.name}${m.product!.packaging ? ` (${m.product!.packaging})` : ""} ×${m.qty} — ${m.product!.price != null ? `${(m.product!.price * m.qty).toFixed(2)}€` : "precio no disponible"}`).join("\n");
    navigator.clipboard.writeText(text).then(() => toast.success("Lista copiada al portapapeles"));
  };

  // ── Main product list ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0">
      {/* Hidden search components */}
      {unpurchased.map((item) => (
        <ItemSearch key={item.id} itemName={item.name} onResult={(p) => handleProductResult(item.id, p)} />
      ))}

      {/* Header — Lidl style */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900">
            Mi lista —{" "}
            <span style={{ color: LIDL_BLUE }}>
              <span style={{ color: LIDL_RED }}>L</span>
              <span style={{ color: LIDL_BLUE }}>idl</span>
            </span>
          </h3>
          {!isSearching && (
            <p className="text-sm text-gray-500">
              {confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""}
              {matched.filter((m) => !m.product).length > 0 && ` · ${matched.filter((m) => !m.product).length} no encontrado${matched.filter((m) => !m.product).length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg font-bold" aria-label="Cerrar">×</button>
      </div>

      {/* Lidl info banner */}
      <div className="mb-3 rounded-2xl p-3 flex items-start gap-2" style={{ background: "#FFF9E6", border: "1px solid #FFE066" }}>
        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ background: LIDL_YELLOW, color: LIDL_BLUE }}>L</div>
        <div>
          <p className="text-xs font-bold" style={{ color: LIDL_BLUE }}>Lidl España</p>
          <p className="text-xs text-gray-500">Los productos encontrados se muestran con precio de referencia. Haz clic en "Ir a Lidl" para añadir al carrito online.</p>
        </div>
      </div>

      {/* Loading state */}
      {isSearching && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: LIDL_BLUE, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-sm text-gray-500">Buscando productos... ({resolved}/{unpurchased.length})</p>
        </div>
      )}

      {/* Product list — Lidl app style */}
      {!isSearching && matched.length > 0 && (
        <>
          <div className="space-y-0 divide-y divide-gray-100">
            {/* Found products */}
            {confirmedItems.map((m) => (
              <div key={m.itemId} className="flex items-center gap-3 py-4">
                {/* Product image */}
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                  {m.product?.image ? (
                    <img src={m.product.image} alt={m.product.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl">🛒</span>
                  )}
                </div>
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{m.product!.name}</p>
                  {m.product!.packaging && <p className="text-xs text-gray-400">{m.product!.packaging}</p>}
                  <p className="text-sm font-bold mt-0.5" style={{ color: LIDL_BLUE }}>
                    {m.product!.price != null ? `${m.product!.price.toFixed(2)}€ × ${m.qty} = ${(m.product!.price * m.qty).toFixed(2)}€` : "Precio no disponible"}
                  </p>
                </div>
                {/* Quantity controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQty(m.itemId, -1)}
                    className="w-8 h-8 rounded-full border-2 border-gray-200 text-gray-600 text-lg font-bold flex items-center justify-center hover:border-gray-400 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-base font-bold text-gray-900">{m.qty}</span>
                  <button
                    onClick={() => updateQty(m.itemId, 1)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg font-bold transition-colors"
                    style={{ background: LIDL_BLUE }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            {/* Not found items */}
            {matched.filter((m) => !m.product).map((m) => (
              <div key={m.itemId} className="flex items-center gap-3 py-3 opacity-40">
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xl text-gray-300">?</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 truncate">{m.itemName}</p>
                  <p className="text-xs text-gray-400 italic">No encontrado en Lidl</p>
                </div>
                <a
                  href={`https://www.lidl.es/q/search?q=${encodeURIComponent(m.itemName)}`}
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
          {confirmedItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Total estimado</p>
              <p className="text-xl font-black text-gray-900">{totalPrice.toFixed(2)}€</p>
            </div>
          )}

          {/* CTA buttons */}
          <div className="mt-4 space-y-3">
            <button
              onClick={handleGoToLidl}
              disabled={confirmedItems.length === 0}
              className="w-full rounded-2xl py-4 text-base font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${LIDL_BLUE}, #0066CC)`, boxShadow: `0 4px 16px rgba(0,80,170,0.35)` }}
            >
              <ShoppingCartIcon className="h-5 w-5" />
              Ir a comprar en Lidl
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleCopyList}
                className="flex-1 rounded-2xl py-3 text-sm font-bold border-2 border-gray-200 text-gray-700 flex items-center justify-center gap-1.5"
              >
                Copiar lista
              </button>
              <button
                onClick={() => window.open("https://www.lidl.es", "_blank")}
                className="flex-1 rounded-2xl py-3 text-sm font-bold border-2 border-gray-200 text-gray-700 flex items-center justify-center gap-1.5"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Ir a Lidl
              </button>
            </div>
          </div>
        </>
      )}

      {!isSearching && matched.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No hay productos pendientes en la lista</p>
        </div>
      )}
    </div>
  );
}
