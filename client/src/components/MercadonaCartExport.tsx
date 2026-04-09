import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronLeftIcon, ShoppingCartIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface MercadonaSession { accessToken: string; customerId: string; cartId: string; customerName?: string; }
interface ShoppingItem { id: number; name: string; qty?: string; unit?: string; isPurchased: boolean; }
interface MatchedProduct {
  itemId: number; itemName: string;
  product: { id: number; slug: string; name: string; thumbnail: string | null; price: number; priceStr: string; unit: string; packaging: string | null; } | null;
  qty: number; confirmed: boolean;
  manualSearch?: string;
  alternatives?: { id: number; slug: string; name: string; thumbnail: string | null; price: number; priceStr: string; unit: string; packaging: string | null; }[];
  searchFailed?: boolean;
}
interface Props { items: ShoppingItem[]; onBack: () => void; onClose: () => void; }

/** Strip quantities, units and parenthetical notes from ingredient names for better Mercadona matching */
function normalizeSearchTerm(name: string): string {
  if (!name || name.trim().length === 0) return "";
  // Remove parenthetical notes like (300 g), (ej. fresas...)
  let result = name.replace(/\([^)]*\)/g, "");
  // Take only first part if comma/semicolon separated (e.g. "tomates, pelados" → "tomates")
  result = result.split(/[,;]/)[0];
  // Remove quantities and units at the start or after spaces
  result = result.replace(/\b\d+[.,]?\d*\s*(g|kg|ml|l|cl|oz|lb|unidad|unidades|cucharad[ai]ta?|taza|tazas|pizca|gramo|gramos|litro|litros)\b/gi, "");
  // Remove common cooking adjectives that hurt search — but keep important qualifiers like "de pollo", "de ternera"
  result = result.replace(/\b(fresco|fresca|frescos|frescas|cocido|cocida|cocidos|cocidas|crudo|cruda|crudos|crudas|picado|picada|troceado|troceada|rallado|rallada|enlatado|enlatada|congelado|congelada|al gusto|opcional|extra)\b/gi, "");
  // Normalize whitespace
  result = result.replace(/\s+/g, " ").trim();
  // If result is too short after cleaning, use original name (up to 3 words)
  if (result.length < 3) {
    result = name.split(/\s+/).slice(0, 3).join(" ").trim();
  }
  // Limit to 4 words max for better search results
  const words = result.split(/\s+/);
  if (words.length > 4) result = words.slice(0, 4).join(" ");
  return result;
}

/** Score how well a Mercadona product name matches the search term (higher = better) */
function scoreMatch(productName: string, searchTerm: string): number {
  const pLower = productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sLower = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sWords = sLower.split(/\s+/).filter(w => w.length > 2);
  let score = 0;
  // Exact match
  if (pLower === sLower) return 100;
  // Product name starts with search term
  if (pLower.startsWith(sLower)) score += 50;
  // All search words appear in product name
  const allWordsMatch = sWords.every(w => pLower.includes(w));
  if (allWordsMatch) score += 40;
  // Count matching words
  const matchingWords = sWords.filter(w => pLower.includes(w)).length;
  score += (matchingWords / Math.max(sWords.length, 1)) * 30;
  return score;
}

/** Pick the best product from search results using scoring */
function pickBestMatch(products: any[], searchTerm: string): { best: any | null; alternatives: any[] } {
  if (!products || products.length === 0) return { best: null, alternatives: [] };
  const normalized = normalizeSearchTerm(searchTerm);
  const scored = products.map(p => ({ p, score: scoreMatch(p.name, normalized) })).sort((a, b) => b.score - a.score);
  const best = scored[0].score > 5 ? scored[0].p : null;
  const alternatives = scored.slice(best ? 1 : 0).map(s => s.p);
  return { best, alternatives };
}

// Single item search component with error handling and timeout
function ItemSearch({ itemName, onResult }: { itemName: string; onResult: (product: MatchedProduct["product"], alternatives: MatchedProduct["alternatives"], failed: boolean) => void }) {
  const searchTerm = normalizeSearchTerm(itemName) || itemName.split(/\s+/).slice(0, 2).join(" ");
  const { data, isLoading, isError } = trpc.mercadona.searchProducts.useQuery(
    { query: searchTerm || itemName, limit: 8 },
    { enabled: !!searchTerm, retry: 1, retryDelay: 500 }
  );
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    if (isError) {
      reported.current = true;
      onResult(null, [], true);
      return;
    }
    if (!isLoading && data !== undefined) {
      reported.current = true;
      const products = (data ?? []).map((p: any) => ({ id: p.id, slug: p.slug, name: p.name, thumbnail: p.thumbnail, price: p.price, priceStr: p.priceStr, unit: p.unit, packaging: p.packaging }));
      const { best, alternatives } = pickBestMatch(products, searchTerm || itemName);
      onResult(best, alternatives, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isError, data]);

  // Safety timeout: if still loading after 8s, mark as failed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!reported.current) {
        reported.current = true;
        onResult(null, [], true);
      }
    }, 8000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// Manual search component for items not found automatically
function ManualSearchRow({ itemName, onSelect }: { itemName: string; onSelect: (product: any) => void }) {
  const [query, setQuery] = useState(normalizeSearchTerm(itemName) || itemName);
  const [searching, setSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = trpc.mercadona.searchProducts.useQuery(
    { query: debouncedQuery, limit: 6 },
    { enabled: searching && debouncedQuery.length > 2 }
  );

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearching(true); }}
            onFocus={() => setSearching(true)}
            placeholder="Buscar en Mercadona..."
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        {query !== (normalizeSearchTerm(itemName) || itemName) && (
          <button onClick={() => { setQuery(normalizeSearchTerm(itemName) || itemName); setSearching(true); }} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      {searching && isLoading && <p className="text-xs text-gray-400 pl-1">Buscando...</p>}
      {searching && !isLoading && data && data.length === 0 && (
        <p className="text-xs text-amber-600 pl-1">No encontrado en Mercadona. <a href={`https://tienda.mercadona.es/search-results?query=${encodeURIComponent(query)}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Ver en tienda web →</a></p>
      )}
      {searching && !isLoading && data && data.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {data.map((p: any) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="flex w-full items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-left hover:bg-orange-50 hover:border-orange-200 transition-colors"
            >
              {p.thumbnail && <img src={p.thumbnail} alt={p.name} className="w-8 h-8 object-contain rounded shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                <p className="text-xs font-bold" style={{ color: "#00A650" }}>{p.priceStr}</p>
              </div>
              <span className="text-xs text-orange-500 font-bold shrink-0">+ Añadir</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  const [expandedManual, setExpandedManual] = useState<Set<number>>(new Set());

  const unpurchased = items.filter((i) => !i.isPurchased);

  useEffect(() => {
    const saved = sessionStorage.getItem("mercadona_session");
    if (saved) { try { setSession(JSON.parse(saved)); } catch {} }
    setMatched(unpurchased.map((item) => ({ itemId: item.id, itemName: item.name, product: null, qty: 1, confirmed: false })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProductResult = (itemId: number, product: MatchedProduct["product"], alternatives: MatchedProduct["alternatives"], failed: boolean) => {
    setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, product, alternatives, confirmed: product !== null, searchFailed: failed } : m));
    setResolved((r) => r + 1);
  };

  const handleSelectProduct = (itemId: number, product: any) => {
    const p = { id: product.id, slug: product.slug, name: product.name, thumbnail: product.thumbnail, price: product.price, priceStr: product.priceStr, unit: product.unit, packaging: product.packaging };
    setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, product: p, confirmed: true } : m));
    setExpandedManual((prev) => { const s = new Set(prev); s.delete(itemId); return s; });
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
  const removeProduct = (itemId: number) => setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, product: null, confirmed: false } : m));

  const confirmedItems = matched.filter((m) => m.confirmed && m.product);
  const notFoundItems = matched.filter((m) => !m.product);
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
      <button onClick={() => window.open("https://tienda.mercadona.es", "_blank")} className="w-full rounded-2xl py-3.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}>
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
      {/* Hidden search components — one per unpurchased item */}
      {unpurchased.map((item) => (
        <ItemSearch key={item.id} itemName={item.name} onResult={(p, alts, failed) => handleProductResult(item.id, p, alts, failed)} />
      ))}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900">
            Mi lista — <span style={{ color: "#00A650" }}>Mercadona</span>
          </h3>
          {!isSearching && (
            <p className="text-sm text-gray-500">
              {confirmedItems.length} encontrado{confirmedItems.length !== 1 ? "s" : ""}
              {notFoundItems.length > 0 && ` · ${notFoundItems.length} sin coincidencia`}
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
          <p className="text-xs text-gray-400">Esto puede tardar unos segundos</p>
        </div>
      )}

      {/* Product list */}
      {!isSearching && matched.length > 0 && (
        <>
          {/* Found products */}
          {confirmedItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">✅ Encontrados ({confirmedItems.length})</p>
              <div className="space-y-0 divide-y divide-gray-100 rounded-2xl border border-gray-100 overflow-hidden">
                {matched.filter((m) => m.product).map((m) => (
                  <div key={m.itemId} className="flex items-center gap-3 px-3 py-3 bg-white">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                      {m.product?.thumbnail ? (
                        <img src={m.product.thumbnail} alt={m.product.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-xl">🛒</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 truncate">{m.itemName}</p>
                      <p className="text-sm font-semibold text-gray-900 leading-tight truncate">{m.product!.name}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: "#00A650" }}>
                        {m.product!.priceStr} × {m.qty} = {(m.product!.price * m.qty).toFixed(2)}€
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => updateQty(m.itemId, -1)} className="w-7 h-7 rounded-full border-2 border-gray-200 text-gray-600 text-base font-bold flex items-center justify-center">−</button>
                        <span className="w-5 text-center text-sm font-bold text-gray-900">{m.qty}</span>
                        <button onClick={() => updateQty(m.itemId, 1)} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-base font-bold" style={{ background: "#00A650" }}>+</button>
                      </div>
                      <button onClick={() => removeProduct(m.itemId)} className="text-[10px] text-gray-300 hover:text-red-400 transition-colors">quitar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Not found items — with inline manual search */}
          {notFoundItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-2">🔍 Sin coincidencia automática ({notFoundItems.length})</p>
              <p className="text-xs text-gray-400 mb-3">Busca manualmente el producto equivalente en Mercadona:</p>
              <div className="space-y-3">
                {notFoundItems.map((m) => (
                  <div key={m.itemId} className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-700">{m.itemName}</p>
                      <button
                        onClick={() => setExpandedManual(prev => { const s = new Set(prev); s.has(m.itemId) ? s.delete(m.itemId) : s.add(m.itemId); return s; })}
                        className="text-xs font-bold text-orange-500 flex items-center gap-1"
                      >
                        <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                        {expandedManual.has(m.itemId) ? "Cerrar" : "Buscar"}
                      </button>
                    </div>
                    {expandedManual.has(m.itemId) && (
                      <ManualSearchRow itemName={m.itemName} onSelect={(p) => handleSelectProduct(m.itemId, p)} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          {confirmedItems.length > 0 && (
            <div className="mt-2 pt-4 border-t border-gray-200 flex items-center justify-between">
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
                Enviar {confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""} al carrito
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
