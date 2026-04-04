import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import LidlCartExport from "@/components/LidlCartExport";

type MercadProduct = {
  id: number;
  slug: string;
  name: string;
  packaging: string | null;
  thumbnail: string | null;
  price: number;
  priceStr: string;
  unit: string;
  category: string | null;
  subcategory: string | null;
  shareUrl: string | null;
};

type CartItem = MercadProduct & { qty: number };

type MercadonaSession = {
  accessToken: string;
  customerId: string;
  cartId: string;
  customerName: string | null;
};

const SUPERMARKETS = [
  { id: "mercadona", name: "Mercadona", color: "#00A650", bg: "#E8F5E9", available: true, desc: "La cadena de supermercados más grande de España" },
  { id: "/app/carrefour", name: "Carrefour", color: "#004A97", bg: "#E3F2FD", available: true, desc: "Más de 14.000 productos disponibles" },
  { id: "/app/lidl", name: "Lidl", color: "#0050AA", bg: "#E8F0FB", available: true, desc: "150 productos en todas las categorías" },
  { id: "alcampo", name: "Alcampo", color: "#E53935", bg: "#FFEBEE", available: false, desc: "Próximamente disponible" },
  { id: "dia", name: "Dia", color: "#C62828", bg: "#FFEBEE", available: false, desc: "Próximamente disponible" },
  { id: "elcorteingles", name: "El Corte Inglés", color: "#1B5E20", bg: "#E8F5E9", available: false, desc: "Próximamente disponible" },
];

const CATEGORY_ICONS: Record<string, string> = {
  "Aceite, especias y salsas": "🫒", "Agua y refrescos": "💧", "Aperitivos": "🍿",
  "Arroz, legumbres y pasta": "🍝", "Azúcar, caramelos y chocolate": "🍫", "Bebé": "👶",
  "Bodega": "🍷", "Cacao, café e infusiones": "☕", "Carne": "🥩", "Cereales y galletas": "🥣",
  "Charcutería y quesos": "🧀", "Congelados": "🧊", "Conservas, caldos y cremas": "🥫",
  "Cuidado del cabello": "💆", "Cuidado facial y corporal": "🧴", "Droguería": "🧹",
  "Frutas y verduras": "🥦", "Higiene bucal": "🦷", "Huevos, leche y mantequilla": "🥛",
  "Limpieza y hogar": "🏠", "Marisco, pescado y sushi": "🐟", "Mascotas": "🐾",
  "Pan y bollería": "🍞", "Parafarmacia": "💊", "Postres y yogures": "🍦", "Zumos": "🍊",
};

export default function SupermercadoShop() {
  const [, navigate] = useLocation();
  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(null);
  const [showLidlModal, setShowLidlModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  // Mercadona account session
  const [session, setSession] = useState<MercadonaSession | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginPostal, setLoginPostal] = useState("28001");
  const [transferDone, setTransferDone] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Restore session from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("mercadona_session");
    if (saved) { try { setSession(JSON.parse(saved)); } catch {} }
  }, []);

  const { data: rawCategories, isLoading: loadingCats } = trpc.mercadona.categories.useQuery(
    undefined, { enabled: selectedSupermarket === "mercadona" }
  );

  const topCategories = rawCategories
    ? Array.from(new Set(rawCategories.map(r => r.categoryName))).map(catName => ({
        name: catName,
        subcategories: rawCategories.filter(r => r.categoryName === catName).map(r => r.subcategoryName),
      }))
    : [];

  const { data: categoryProducts, isLoading: loadingCatProducts } = trpc.mercadona.byCategory.useQuery(
    { categoryName: selectedCategory!, subcategoryName: selectedSubcategory ?? undefined, limit: 60 },
    { enabled: !!selectedCategory && !debouncedQuery && selectedSupermarket === "mercadona" }
  );

  const { data: searchResults, isLoading: loadingSearch } = trpc.mercadona.searchProducts.useQuery(
    { query: debouncedQuery, limit: 40 },
    { enabled: debouncedQuery.length >= 2 && selectedSupermarket === "mercadona" }
  );

  const displayedProducts: MercadProduct[] = debouncedQuery.length >= 2 ? (searchResults ?? []) : (categoryProducts ?? []);
  const isLoading = debouncedQuery.length >= 2 ? loadingSearch : loadingCatProducts;

  const loginMutation = trpc.mercadona.login.useMutation({
    onSuccess: (data) => {
      if (!data.cartId) {
        toast.error("No se pudo obtener el carrito de Mercadona. Asegúrate de tener una cuenta activa.");
        return;
      }
      const sess: MercadonaSession = {
        accessToken: data.accessToken,
        customerId: data.customerId,
        cartId: data.cartId,
        customerName: data.customerName,
      };
      setSession(sess);
      sessionStorage.setItem("mercadona_session", JSON.stringify(sess));
      setShowLoginModal(false);
      setLoginPassword("");
      toast.success(`¡Conectado como ${data.customerName ?? data.customerId}!`);
    },
    onError: (err) => {
      toast.error(err.message || "Error al conectar con Mercadona");
    },
  });

  const addToCartMutation = trpc.mercadona.addToCart.useMutation({
    onSuccess: (data) => {
      setTransferDone(true);
      toast.success(`✅ ${data.itemsAdded} producto${data.itemsAdded !== 1 ? "s" : ""} añadido${data.itemsAdded !== 1 ? "s" : ""} al carrito de Mercadona`);
    },
    onError: (err) => {
      toast.error(`Error al transferir: ${err.message}`);
    },
  });

  const addToCart = (product: MercadProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) return prev.map((c) => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} añadido`);
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter((c) => c.qty > 0)
    );
  };

  const handleTransferToMercadona = () => {
    if (!session) { setShowLoginModal(true); return; }
    setTransferDone(false);
    setShowTransferModal(true);
  };

  const confirmTransfer = () => {
    if (!session) return;
    addToCartMutation.mutate({
      accessToken: session.accessToken,
      customerId: session.customerId,
      cartId: session.cartId,
      items: cart.map(c => ({ productId: c.slug || String(c.id), quantity: c.qty })),
    });
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const activeSupermarket = SUPERMARKETS.find((s) => s.id === selectedSupermarket);

  // ── Supermarket selector ──────────────────────────────────────────────────────
  if (!selectedSupermarket) {
    return (
      <>
      <div className="vively-page pb-32">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Supermercados</h1>
          <p className="text-sm text-gray-500">Elige tu supermercado y compra directamente desde BuddyMarket</p>
        </div>
        <div className="flex flex-col gap-3">
          {SUPERMARKETS.map((sm) => (
            <button
              key={sm.id}
              onClick={() => {
              if (!sm.available) { toast.info(`${sm.name} estará disponible próximamente`); return; }
              if (sm.id === "/app/carrefour") { navigate("/app/carrefour"); return; }
              if (sm.id === "/app/lidl") { navigate("/app/lidl"); return; }
              setSelectedSupermarket(sm.id);
            }}
              className={`flex items-center gap-4 rounded-3xl p-4 text-left transition-all active:scale-[0.98] ${sm.available ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 border border-gray-100 opacity-70"}`}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-black" style={{ background: sm.bg, color: sm.color }}>
                {sm.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-gray-900">{sm.name}</p>
                  {sm.available
                    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: sm.color }}>Disponible</span>
                    : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">Próximamente</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{sm.desc}</p>
              </div>
              {sm.available && <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" /></svg>}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-2xl p-4 bg-green-50 border border-green-100">
          <p className="text-xs text-green-800 font-semibold text-center">
            🛒 Conecta tu cuenta de Mercadona para transferir tu lista de la compra directamente
          </p>
        </div>
      </div>
      {/* Lidl Modal */}
      {showLidlModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLidlModal(false); }}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <LidlCartExport
              items={[]}
              onBack={() => setShowLidlModal(false)}
              onClose={() => setShowLidlModal(false)}
            />
          </div>
        </div>
      )}
      </>
    );
  }

  // ── Mercadona browser ─────────────────────────────────────────────────────────
  return (
    <div className="vively-page pb-32">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedSupermarket(null); setSelectedCategory(null); setSelectedSubcategory(null); setSearchQuery(""); }} className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: activeSupermarket?.color }}>{activeSupermarket?.name.charAt(0)}</div>
              <h1 className="text-lg font-black text-gray-900">{activeSupermarket?.name}</h1>
            </div>
            <p className="text-xs text-gray-400">1.971 productos · {session ? <span className="text-green-600 font-semibold">✓ Cuenta conectada</span> : <span>Sin cuenta conectada</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Account button */}
          <button
            onClick={() => session ? (setSession(null), sessionStorage.removeItem("mercadona_session"), toast.info("Sesión cerrada")) : setShowLoginModal(true)}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${session ? "bg-green-50 border-green-200" : "bg-white border-gray-100"} shadow-sm`}
            title={session ? "Cerrar sesión de Mercadona" : "Conectar cuenta Mercadona"}
          >
            <svg className={`w-5 h-5 ${session ? "text-green-600" : "text-gray-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          {cartCount > 0 && (
            <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount}
            </button>
          )}
        </div>
      </div>

      {/* Account connection banner */}
      {!session && (
        <button onClick={() => setShowLoginModal(true)} className="w-full mb-4 flex items-center gap-3 rounded-2xl p-3.5 border-2 border-dashed border-green-300 bg-green-50 text-left">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">Conecta tu cuenta de Mercadona</p>
            <p className="text-xs text-green-600">Transfiere tu lista directamente a tu carrito de Mercadona</p>
          </div>
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" /></svg>
        </button>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSelectedCategory(null); setSelectedSubcategory(null); }} placeholder="Buscar pollo, pasta, aceite..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400" />
        {searchQuery && <button onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }} className="text-gray-400"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
      </div>

      {/* Categories */}
      {!debouncedQuery && (
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categorías</p>
          {loadingCats ? (
            <div className="grid grid-cols-3 gap-2">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {topCategories.map((cat) => (
                <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setSelectedSubcategory(null); }}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${selectedCategory === cat.name ? "text-white shadow-md" : "bg-white text-gray-700 shadow-sm border border-gray-100"}`}
                  style={selectedCategory === cat.name ? { background: activeSupermarket?.color } : {}}>
                  <span className="text-2xl">{CATEGORY_ICONS[cat.name] ?? "🛍️"}</span>
                  <span className="text-xs font-bold text-center leading-tight line-clamp-2">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subcategory tabs */}
      {!debouncedQuery && selectedCategory && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setSelectedSubcategory(null)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${!selectedSubcategory ? "text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            style={!selectedSubcategory ? { background: activeSupermarket?.color } : {}}>Todos</button>
          {topCategories.find(c => c.name === selectedCategory)?.subcategories.map((sub) => (
            <button key={sub} onClick={() => setSelectedSubcategory(sub)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${selectedSubcategory === sub ? "text-white" : "bg-white text-gray-600 border border-gray-200"}`}
              style={selectedSubcategory === sub ? { background: activeSupermarket?.color } : {}}>{sub}</button>
          ))}
        </div>
      )}

      {/* Products */}
      {(selectedCategory || debouncedQuery.length >= 2) && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl p-3 shadow-sm animate-pulse"><div className="w-full h-28 bg-gray-100 rounded-xl mb-3" /><div className="h-3 bg-gray-100 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>)}</div>
          ) : displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><div className="text-5xl mb-4">🔍</div><p className="text-base font-bold text-gray-700">No se encontraron productos</p><p className="text-sm text-gray-400 mt-1">Prueba con otra búsqueda o categoría</p></div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">{displayedProducts.length} productos</p>
              <div className="grid grid-cols-2 gap-3">
                {displayedProducts.map((product) => {
                  const inCart = cart.find((c) => c.id === product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col">
                      <div className="w-full h-28 bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                        {product.thumbnail
                          ? <img src={product.thumbnail} alt={product.name} className="w-full h-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <span className="text-4xl">🛒</span>}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
                        {product.packaging && <p className="text-xs text-gray-400 mb-1">{product.packaging}</p>}
                        <p className="text-base font-black mb-3" style={{ color: activeSupermarket?.color }}>{product.priceStr}</p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: activeSupermarket?.bg }}>
                          <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-lg bg-white font-black flex items-center justify-center shadow-sm" style={{ color: activeSupermarket?.color }}>−</button>
                          <span className="text-sm font-bold" style={{ color: activeSupermarket?.color }}>{inCart.qty}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="w-7 h-7 rounded-lg text-white font-black flex items-center justify-center" style={{ background: activeSupermarket?.color }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} className="w-full rounded-xl py-2 text-xs font-bold text-white transition-all active:scale-95" style={{ background: activeSupermarket?.color }}>+ Añadir</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {!selectedCategory && !debouncedQuery && !loadingCats && (
        <div className="flex flex-col items-center justify-center py-12 text-center"><div className="text-5xl mb-4">👆</div><p className="text-base font-bold text-gray-700">Selecciona una categoría</p><p className="text-sm text-gray-400 mt-1">o busca un producto directamente</p></div>
      )}

      {/* ── Cart drawer ─────────────────────────────────────────────────────────── */}
      {showCart && (
        <div className="fixed inset-0 z-[9000] flex flex-col justify-end" style={{ paddingBottom: "90px" }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-gray-900">Mi lista — {activeSupermarket?.name}</h2>
                <p className="text-xs text-gray-500">{cartCount} producto{cartCount !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain p-1" /> : <span className="text-xl">🛒</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs font-bold" style={{ color: activeSupermarket?.color }}>{item.priceStr} × {item.qty} = {(item.price * item.qty).toFixed(2)}€</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-black flex items-center justify-center text-sm">−</button>
                    <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg text-white font-black flex items-center justify-center text-sm" style={{ background: activeSupermarket?.color }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pt-4 pb-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-gray-700">Total estimado</span>
                <span className="text-xl font-black text-gray-900">{cartTotal.toFixed(2)}€</span>
              </div>
              {/* Transfer to Mercadona — main CTA */}
              <button
                onClick={handleTransferToMercadona}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white mb-3 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #00A650, #00C65A)", boxShadow: "0 4px 16px rgba(0,166,80,0.4)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {session ? "Enviar al carrito de Mercadona" : "Conectar y enviar a Mercadona"}
              </button>
              <div className="flex gap-3">
                <button onClick={() => { navigator.clipboard.writeText(cart.map((c) => `• ${c.name} x${c.qty} — ${(c.price * c.qty).toFixed(2)}€`).join("\n")); toast.success("Lista copiada"); }}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold border-2" style={{ color: activeSupermarket?.color, borderColor: activeSupermarket?.color }}>
                  Copiar lista
                </button>
                <button onClick={() => window.open("https://tienda.mercadona.es", "_blank")} className="flex-1 rounded-2xl py-3 text-sm font-bold bg-gray-100 text-gray-700">
                  Ir a Mercadona
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Login modal ─────────────────────────────────────────────────────────── */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLoginModal(false); }}>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-gray-900">Conectar cuenta Mercadona</h2>
                <p className="text-xs text-gray-500 mt-0.5">Tus credenciales se usan solo para esta sesión y no se guardan</p>
              </div>
              <button onClick={() => setShowLoginModal(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Security notice */}
            <div className="mb-4 rounded-xl p-3 bg-blue-50 border border-blue-100 flex gap-2">
              <svg className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <p className="text-xs text-blue-700">La conexión se realiza directamente con Mercadona. BuddyMarket no almacena tu contraseña.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Email de Mercadona</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="tu@email.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Contraseña</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Código postal (para seleccionar tienda)</label>
                <input type="text" value={loginPostal} onChange={e => setLoginPostal(e.target.value)} placeholder="28001" maxLength={5} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-400" />
              </div>
              <button
                onClick={() => loginMutation.mutate({ email: loginEmail, password: loginPassword, postalCode: loginPostal })}
                disabled={!loginEmail || !loginPassword || loginMutation.isPending}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white mt-1 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}
              >
                {loginMutation.isPending ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Conectando...</>
                ) : "Conectar con Mercadona"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transfer confirmation modal ──────────────────────────────────────────── */}
      {showTransferModal && session && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !addToCartMutation.isPending) setShowTransferModal(false); }}>
          <div className="relative bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl overflow-hidden">
            {/* Animated loading overlay */}
            {addToCartMutation.isPending && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl" style={{ background: "linear-gradient(135deg, #00A650ee, #00C65Aee)" }}>
                {/* Pulsing cart icon */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  {/* Orbiting spinner ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-24 h-24 animate-spin" style={{ animationDuration: "1.2s" }} viewBox="0 0 96 96" fill="none">
                      <circle cx="48" cy="48" r="44" stroke="white" strokeWidth="4" strokeOpacity="0.3" />
                      <path d="M48 4a44 44 0 0 1 44 44" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <p className="text-white font-black text-lg mb-2">Enviando al carrito...</p>
                <p className="text-white/80 text-sm mb-6 text-center px-4">
                  Añadiendo {cartCount} producto{cartCount !== 1 ? "s" : ""} a tu cuenta de Mercadona
                </p>
                {/* Progress steps */}
                <div className="w-full max-w-xs flex flex-col gap-2 px-2">
                  {[
                    { label: "Conectando con Mercadona", done: true },
                    { label: "Preparando productos", done: true },
                    { label: "Añadiendo al carrito", done: false },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        step.done ? "bg-white" : "bg-white/30 border-2 border-white/60"
                      }`}>
                        {step.done
                          ? <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          : <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                      </div>
                      <span className={`text-sm ${step.done ? "text-white font-semibold" : "text-white/70"}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {transferDone ? (
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-xl font-black text-gray-900 mb-2">¡Lista enviada!</h2>
                <p className="text-sm text-gray-500 mb-6">{cart.length} producto{cart.length !== 1 ? "s" : ""} añadido{cart.length !== 1 ? "s" : ""} a tu carrito de Mercadona</p>
                <button
                  onClick={() => { window.open("https://tienda.mercadona.es", "_blank"); setShowTransferModal(false); setShowCart(false); }}
                  className="w-full rounded-2xl py-3.5 text-sm font-bold text-white mb-3"
                  style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}
                >
                  Ir a finalizar la compra →
                </button>
                <button onClick={() => setShowTransferModal(false)} className="w-full rounded-2xl py-3 text-sm font-bold text-gray-600 bg-gray-100">Seguir comprando</button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-black text-gray-900 mb-1">Enviar a Mercadona</h2>
                <p className="text-sm text-gray-500 mb-4">Se añadirán {cartCount} artículo{cartCount !== 1 ? "s" : ""} a tu carrito de <strong>{session.customerName ?? "tu cuenta"}</strong></p>
                <div className="max-h-48 overflow-y-auto mb-4 rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-2 px-3 py-2">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {item.thumbnail ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain" /> : <span className="text-sm">🛒</span>}
                      </div>
                      <p className="flex-1 text-xs font-semibold text-gray-800 line-clamp-1">{item.name}</p>
                      <span className="text-xs font-bold text-gray-500">×{item.qty}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={confirmTransfer}
                  disabled={addToCartMutation.isPending}
                  className="w-full rounded-2xl py-3.5 text-sm font-bold text-white mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #00A650, #00C65A)" }}
                >
                  {addToCartMutation.isPending
                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enviando...</>
                    : "✓ Confirmar y enviar"}
                </button>
                <button onClick={() => setShowTransferModal(false)} className="w-full rounded-2xl py-3 text-sm font-bold text-gray-600 bg-gray-100">Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
