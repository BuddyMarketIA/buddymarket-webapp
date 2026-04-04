import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronLeftIcon, ShoppingCartIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

interface MercadonaSession { accessToken: string; customerId: string; cartId: string; customerName?: string; }
interface ShoppingItem { id: number; name: string; qty?: string; unit?: string; isPurchased: boolean; }
interface MatchedProduct {
  itemId: number; itemName: string;
  product: { id: number; slug: string; name: string; thumbnail: string | null; price: number; priceStr: string; unit: string; packaging: string | null; } | null;
  qty: number; confirmed: boolean;
}
interface Props { items: ShoppingItem[]; onBack: () => void; onClose: () => void; }

/** Strip quantities, units and parenthetical notes from ingredient names for better Mercadona matching */
function normalizeSearchTerm(name: string): string {
  return name
    .replace(/\([^)]*\)/g, "") // remove (300 g), (ej. fresas...), etc.
    .replace(/\d+[.,]?\d*\s*(g|kg|ml|l|cl|oz|lb|unidad|unidades|cucharad[ai]ta?|taza|tazas|pizca)?/gi, "") // remove quantities
    .replace(/\s+/g, " ")
    .trim()
    .split(/[,;]/)[0] // take only first part if comma-separated
    .trim();
}

function ItemSearch({ itemName, onResult }: { itemName: string; onResult: (product: MatchedProduct["product"]) => void }) {
  const searchTerm = normalizeSearchTerm(itemName);
  const { data, isLoading } = trpc.mercadona.searchProducts.useQuery({ query: searchTerm || itemName, limit: 3 }, { enabled: true });
  const reported = useRef(false);
  useEffect(() => {
    if (!isLoading && !reported.current) {
      reported.current = true;
      const p = data?.[0];
      onResult(p ? { id: p.id, slug: p.slug, name: p.name, thumbnail: p.thumbnail, price: p.price, priceStr: p.priceStr, unit: p.unit, packaging: p.packaging } : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);
  return null;
}

export default function MercadonaCartExport({ items, onBack, onClose }: Props) {
  const [session, setSession] = useState<MercadonaSession | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPostal, setLoginPostal] = useState("28001");
  const [matched, setMatched] = useState<MatchedProduct[]>([]);
  const [resolved, setResolved] = useState(0);
  const [transferDone, setTransferDone] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const unpurchased = items.filter((i) => !i.isPurchased);

  useEffect(() => {
    const saved = sessionStorage.getItem("mercadona_session");
    if (saved) { try { setSession(JSON.parse(saved)); } catch {} }
    setMatched(unpurchased.map((item) => ({ itemId: item.id, itemName: item.name, product: null, qty: 1, confirmed: false })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProductResult = (itemId: number, product: MatchedProduct["product"]) => {
    setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, product, confirmed: product !== null } : m));
    setResolved((r) => r + 1);
  };

  const loginMutation = trpc.mercadona.login.useMutation({
    onSuccess: (data) => {
      if (!data.cartId) { toast.error("No se pudo obtener el carrito."); return; }
      const sess: MercadonaSession = { accessToken: data.accessToken, customerId: data.customerId, cartId: data.cartId, customerName: data.customerName ?? undefined };
      setSession(sess); sessionStorage.setItem("mercadona_session", JSON.stringify(sess)); setShowLogin(false); setLoginPassword("");
      toast.success(`Conectado como ${data.customerName ?? data.customerId}`);
    },
    onError: (err) => toast.error(err.message || "Error al conectar"),
  });

  const addToCartMutation = trpc.mercadona.addToCart.useMutation({
    onSuccess: (data) => { setTransferring(false); setTransferDone(true); toast.success(`${data.itemsAdded} producto${data.itemsAdded !== 1 ? "s" : ""} en el carrito`); },
    onError: (err) => { setTransferring(false); toast.error(`Error: ${err.message}`); },
  });

  const updateQty = (itemId: number, delta: number) => setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, qty: Math.max(1, m.qty + delta) } : m));
  const toggleConfirmed = (itemId: number) => setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, confirmed: !m.confirmed } : m));

  const confirmedItems = matched.filter((m) => m.confirmed && m.product);
  const totalPrice = confirmedItems.reduce((sum, m) => sum + m.product!.price * m.qty, 0);
  const isSearching = resolved < unpurchased.length;

  const handleTransfer = () => {
    if (!session) { setShowLogin(true); return; }
    if (confirmedItems.length === 0) { toast.error("No hay productos seleccionados"); return; }
    setTransferring(true);
    addToCartMutation.mutate({ accessToken: session.accessToken, customerId: session.customerId, cartId: session.cartId, items: confirmedItems.map((m) => ({ productId: m.product!.slug || String(m.product!.id), quantity: m.qty })) });
  };

  // ── Login screen ────────────────────────────────────────────────────────────
  if (showLogin) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setShowLogin(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h3 className="text-lg font-bold text-gray-900">Conectar Mercadona</h3>
        <button onClick={onClose} className="ml-auto text-gray-400 text-xl font-bold">×</button>
      </div>
      <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
        <p className="text-xs text-orange-700 font-medium">🔒 Tus credenciales se usan solo para añadir al carrito. No se almacenan en ningún servidor.</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Email de Mercadona</label>
          <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="tu@email.com" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Contraseña</label>
          <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Código postal</label>
          <input type="text" value={loginPostal} onChange={(e) => setLoginPostal(e.target.value)} placeholder="28001" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400" />
        </div>
      </div>
      <button
        onClick={() => loginMutation.mutate({ email: loginEmail, password: loginPassword, postalCode: loginPostal })}
        disabled={!loginEmail || !loginPassword || loginMutation.isPending}
        className="w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}
      >
        {loginMutation.isPending ? "Conectando..." : "Conectar con Mercadona"}
      </button>
    </div>
  );

  // ── Transfer done screen ────────────────────────────────────────────────────
  if (transferDone) return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-6xl">✅</div>
      <h3 className="text-xl font-black text-gray-900">¡Lista enviada!</h3>
      <p className="text-sm text-gray-500 text-center">{confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""} en tu carrito de Mercadona</p>
      <button
        onClick={() => window.open("https://tienda.mercadona.es", "_blank")}
        className="w-full rounded-2xl py-3.5 text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}
      >
        Ir a finalizar la compra →
      </button>
      <button onClick={onClose} className="w-full rounded-2xl py-3 text-sm font-bold text-gray-600 bg-gray-100">Cerrar</button>
    </div>
  );

  // ── Transferring screen ─────────────────────────────────────────────────────
  if (transferring) return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}>
        <ShoppingCartIcon className="w-10 h-10 text-white" />
      </div>
      <p className="text-gray-900 font-black text-lg">Enviando al carrito...</p>
      <p className="text-gray-500 text-sm text-center">Añadiendo {confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""}</p>
    </div>
  );

  // ── Main product list ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0">
      {/* Hidden search components */}
      {unpurchased.map((item) => (
        <ItemSearch key={item.id} itemName={item.name} onResult={(p) => handleProductResult(item.id, p)} />
      ))}

      {/* Header — Mercadona style */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900">
            Mi lista — <span style={{ color: "#00A650" }}>Mercadona</span>
          </h3>
          {!isSearching && (
            <p className="text-sm text-gray-500">
              {confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""}
              {matched.filter((m) => !m.product).length > 0 && ` · ${matched.filter((m) => !m.product).length} no encontrado${matched.filter((m) => !m.product).length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg font-bold">×</button>
      </div>

      {/* Account status */}
      {!session && (
        <div className="mb-3 rounded-2xl bg-amber-50 border border-amber-100 p-3">
          <p className="text-xs text-amber-700 font-semibold">Cuenta no conectada</p>
          <p className="text-xs text-amber-600 mb-1">Conecta tu cuenta para añadir al carrito directamente.</p>
          <button onClick={() => setShowLogin(true)} className="text-xs font-bold text-amber-700 underline">Conectar ahora</button>
        </div>
      )}
      {session && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-green-50 border border-green-100 px-3 py-2">
          <span className="text-green-600 text-sm">✓</span>
          <p className="text-xs text-green-700 font-semibold">{session.customerName ?? "Conectado"}</p>
          <button onClick={() => { setSession(null); sessionStorage.removeItem("mercadona_session"); }} className="ml-auto text-xs text-gray-400 underline">Desconectar</button>
        </div>
      )}

      {/* Loading state */}
      {isSearching && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full animate-bounce" style={{ background: "#00A650", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-sm text-gray-500">Buscando productos... ({resolved}/{unpurchased.length})</p>
        </div>
      )}

      {/* Product list — Mercadona app style */}
      {!isSearching && matched.length > 0 && (
        <>
          <div className="space-y-0 divide-y divide-gray-100">
            {matched.filter((m) => m.product).map((m) => (
              <div key={m.itemId} className="flex items-center gap-3 py-4">
                {/* Product image */}
                <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                  {m.product?.thumbnail ? (
                    <img src={m.product.thumbnail} alt={m.product.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="text-2xl">🛒</span>
                  )}
                </div>
                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{m.product!.name}</p>
                  <p className="text-sm font-bold mt-0.5" style={{ color: "#00A650" }}>
                    {m.product!.priceStr} × {m.qty} = {(m.product!.price * m.qty).toFixed(2)}€
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
                    style={{ background: "#00A650" }}
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
                  <p className="text-xs text-gray-400 italic">No encontrado en Mercadona</p>
                </div>
                <a
                  href={`https://tienda.mercadona.es/search-results?query=${encodeURIComponent(m.itemName)}`}
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
            {session ? (
              <button
                onClick={handleTransfer}
                disabled={confirmedItems.length === 0}
                className="w-full rounded-2xl py-4 text-base font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #00A650, #00C65A)", boxShadow: "0 4px 16px rgba(0,166,80,0.35)" }}
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Enviar al carrito de Mercadona
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="w-full rounded-2xl py-4 text-base font-bold text-white flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #00A650, #00C65A)", boxShadow: "0 4px 16px rgba(0,166,80,0.35)" }}
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Conectar y enviar al carrito
              </button>
            )}
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
                onClick={() => window.open("https://tienda.mercadona.es", "_blank")}
                className="flex-1 rounded-2xl py-3 text-sm font-bold border-2 border-gray-200 text-gray-700 flex items-center justify-center gap-1.5"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Ir a Mercadona
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
