import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronLeftIcon, ShoppingCartIcon, CheckIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface MercadonaSession { accessToken: string; customerId: string; cartId: string; customerName?: string; }
interface ShoppingItem { id: number; name: string; qty?: string; unit?: string; isPurchased: boolean; }
interface MatchedProduct {
  itemId: number; itemName: string;
  product: { id: number; name: string; thumbnail: string | null; price: number; priceStr: string; unit: string; packaging: string | null; } | null;
  qty: number; confirmed: boolean;
}
interface Props { items: ShoppingItem[]; onBack: () => void; onClose: () => void; }

function ItemSearch({ itemName, onResult }: { itemName: string; onResult: (product: MatchedProduct["product"]) => void }) {
  const { data, isLoading } = trpc.mercadona.searchProducts.useQuery({ query: itemName, limit: 3 }, { enabled: true });
  const reported = useRef(false);
  useEffect(() => {
    if (!isLoading && !reported.current) {
      reported.current = true;
      const p = data?.[0];
      onResult(p ? { id: p.id, name: p.name, thumbnail: p.thumbnail, price: p.price, priceStr: p.priceStr, unit: p.unit, packaging: p.packaging } : null);
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

  const toggleConfirmed = (itemId: number) => setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, confirmed: !m.confirmed } : m));
  const updateQty = (itemId: number, delta: number) => setMatched((prev) => prev.map((m) => m.itemId === itemId ? { ...m, qty: Math.max(1, m.qty + delta) } : m));

  const confirmedItems = matched.filter((m) => m.confirmed && m.product);
  const totalPrice = confirmedItems.reduce((sum, m) => sum + m.product!.price * m.qty, 0);
  const isSearching = resolved < unpurchased.length;

  const handleTransfer = () => {
    if (!session) { setShowLogin(true); return; }
    if (confirmedItems.length === 0) { toast.error("No hay productos seleccionados"); return; }
    setTransferring(true);
    addToCartMutation.mutate({ accessToken: session.accessToken, customerId: session.customerId, cartId: session.cartId, items: confirmedItems.map((m) => ({ productId: String(m.product!.id), quantity: m.qty })) });
  };

  if (showLogin) return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setShowLogin(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600"><ChevronLeftIcon className="h-4 w-4" /></button>
        <h3 className="text-lg font-bold text-gray-900">Conectar Mercadona</h3>
        <button onClick={onClose} className="ml-auto text-gray-400 text-xl font-bold">×</button>
      </div>
      <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
        <p className="text-xs text-orange-700 font-medium">🔒 Tus credenciales se usan solo para añadir al carrito. No se almacenan en ningún servidor.</p>
      </div>
      <div className="space-y-3">
        <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Email de Mercadona</label><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="tu@email.com" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400" /></div>
        <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Contraseña</label><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400" /></div>
        <div><label className="text-xs font-semibold text-gray-500 mb-1 block">Código postal</label><input type="text" value={loginPostal} onChange={(e) => setLoginPostal(e.target.value)} placeholder="28001" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-orange-400" /></div>
      </div>
      <button onClick={() => loginMutation.mutate({ email: loginEmail, password: loginPassword, postalCode: loginPostal })} disabled={!loginEmail || !loginPassword || loginMutation.isPending} className="w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}>
        {loginMutation.isPending ? "Conectando..." : "Conectar con Mercadona"}
      </button>
    </div>
  );

  if (transferDone) return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-6xl">✅</div>
      <h3 className="text-xl font-black text-gray-900">¡Lista enviada!</h3>
      <p className="text-sm text-gray-500 text-center">{confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""} en tu carrito de Mercadona</p>
      <button onClick={() => window.open("https://tienda.mercadona.es", "_blank")} className="w-full rounded-2xl py-3.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}>Ir a finalizar la compra →</button>
      <button onClick={onClose} className="w-full rounded-2xl py-3 text-sm font-bold text-gray-600 bg-gray-100">Cerrar</button>
    </div>
  );

  if (transferring) return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}><ShoppingCartIcon className="w-10 h-10 text-white" /></div>
      <p className="text-gray-900 font-black text-lg">Enviando al carrito...</p>
      <p className="text-gray-500 text-sm text-center">Añadiendo {confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {unpurchased.map((item) => (<ItemSearch key={item.id} itemName={item.name} onResult={(p) => handleProductResult(item.id, p)} />))}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600"><ChevronLeftIcon className="h-4 w-4" /></button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">🟠</span>
          <h3 className="text-lg font-bold text-gray-900">Mercadona</h3>
          {session && <span className="ml-auto text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">✓ {session.customerName ?? "Conectado"}</span>}
        </div>
        <button onClick={onClose} className="text-gray-400 text-xl font-bold">×</button>
      </div>

      {!session && (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3">
          <p className="text-xs text-amber-700 font-semibold">Cuenta no conectada</p>
          <p className="text-xs text-amber-600">Conecta tu cuenta para añadir al carrito directamente.</p>
          <button onClick={() => setShowLogin(true)} className="mt-1.5 text-xs font-bold text-amber-700 underline">Conectar ahora</button>
        </div>
      )}

      {isSearching && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex gap-1">{[0,1,2].map((i) => <div key={i} className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
          <p className="text-sm text-gray-500">Buscando en Mercadona... ({resolved}/{unpurchased.length})</p>
        </div>
      )}

      {!isSearching && matched.length > 0 && (
        <>
          <p className="text-xs text-gray-500">Revisa los productos encontrados. Desmarca los que no quieras añadir.</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {matched.map((m) => (
              <div key={m.itemId} className={`rounded-2xl border-2 p-3 transition-all ${m.confirmed && m.product ? "border-orange-400 bg-orange-50" : "border-gray-100 bg-white opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => m.product && toggleConfirmed(m.itemId)} disabled={!m.product} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${m.confirmed && m.product ? "border-orange-400 bg-orange-400" : "border-gray-200"}`}>
                    {m.confirmed && m.product && <CheckIcon className="h-3 w-3 text-white" />}
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                    {m.product?.thumbnail ? <img src={m.product.thumbnail} alt={m.product.name} className="w-full h-full object-contain" /> : <MagnifyingGlassIcon className="w-5 h-5 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 truncate"><span className="font-semibold text-gray-600">{m.itemName}</span></p>
                    {m.product ? (<><p className="text-sm font-semibold text-gray-900 truncate">{m.product.name}</p><p className="text-xs text-orange-500 font-bold">{m.product.priceStr}</p></>) : (<p className="text-xs text-gray-400 italic">No encontrado en Mercadona</p>)}
                  </div>
                  {m.product && m.confirmed && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updateQty(m.itemId, -1)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center">−</button>
                      <span className="w-5 text-center text-sm font-bold text-gray-900">{m.qty}</span>
                      <button onClick={() => updateQty(m.itemId, 1)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center">+</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {confirmedItems.length > 0 && (
            <div className="rounded-2xl bg-gray-50 p-3 flex items-center justify-between">
              <div><p className="text-sm font-bold text-gray-900">{confirmedItems.length} productos seleccionados</p><p className="text-xs text-gray-500">Total estimado: {totalPrice.toFixed(2)}€</p></div>
              <span className="text-xs text-gray-400">{matched.filter((m) => !m.product).length} no encontrados</span>
            </div>
          )}
          {session ? (
            <button onClick={handleTransfer} disabled={confirmedItems.length === 0} className="w-full rounded-2xl py-3.5 text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}>
              <ShoppingCartIcon className="h-4 w-4" />
              Añadir {confirmedItems.length} producto{confirmedItems.length !== 1 ? "s" : ""} al carrito
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} className="w-full rounded-2xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}>
              Conectar Mercadona y añadir al carrito
            </button>
          )}
          <button
            onClick={() => { unpurchased.forEach((item, idx) => { setTimeout(() => { window.open(`https://tienda.mercadona.es/search-results?query=${encodeURIComponent(item.name)}`, "_blank"); }, idx * 400); }); toast.success(`Abriendo ${unpurchased.length} búsquedas en Mercadona`); }}
            className="w-full rounded-2xl py-2.5 text-xs font-semibold text-gray-500 bg-gray-50 flex items-center justify-center gap-1.5"
          >
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
            O buscar en la web de Mercadona
          </button>
        </>
      )}
      {!isSearching && matched.length === 0 && <div className="text-center py-8"><p className="text-gray-400 text-sm">No hay productos pendientes en la lista</p></div>}
    </div>
  );
}
