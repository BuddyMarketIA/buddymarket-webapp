import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type MercadProduct = {
  id: string;
  name: string;
  brand: string;
  price: number;
  priceStr: string;
  unit: string;
  thumbnail: string;
  subcategory: string;
};

type CartItem = MercadProduct & { qty: number };

const SUPERMARKETS = [
  {
    id: "mercadona",
    name: "Mercadona",
    logo: "🟢",
    color: "#00A650",
    bg: "#E8F5E9",
    available: true,
    desc: "La cadena de supermercados más grande de España",
  },
  {
    id: "carrefour",
    name: "Carrefour",
    logo: "🔵",
    color: "#004A97",
    bg: "#E3F2FD",
    available: false,
    desc: "Próximamente disponible",
  },
  {
    id: "lidl",
    name: "Lidl",
    logo: "🟡",
    color: "#F5A623",
    bg: "#FFF8E1",
    available: false,
    desc: "Próximamente disponible",
  },
  {
    id: "alcampo",
    name: "Alcampo",
    logo: "🔴",
    color: "#E53935",
    bg: "#FFEBEE",
    available: false,
    desc: "Próximamente disponible",
  },
  {
    id: "dia",
    name: "Dia",
    logo: "🔴",
    color: "#C62828",
    bg: "#FFEBEE",
    available: false,
    desc: "Próximamente disponible",
  },
  {
    id: "elcorteingles",
    name: "El Corte Inglés",
    logo: "🟢",
    color: "#1B5E20",
    bg: "#E8F5E9",
    available: false,
    desc: "Próximamente disponible",
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  "Aceite, especias y salsas": "🫒",
  "Agua y refrescos": "💧",
  "Aperitivos": "🍿",
  "Arroz, legumbres y pasta": "🍝",
  "Azúcar, caramelos y chocolate": "🍫",
  "Bebé": "👶",
  "Bodega": "🍷",
  "Cacao, café e infusiones": "☕",
  "Carne": "🥩",
  "Cereales y galletas": "🥣",
  "Charcutería y quesos": "🧀",
  "Congelados": "🧊",
  "Conservas y platos preparados": "🥫",
  "Cuidado del cabello": "💆",
  "Cuidado facial y corporal": "🧴",
  "Droguería": "🧹",
  "Frutas y verduras": "🥦",
  "Higiene bucal": "🦷",
  "Huevos, leche y mantequilla": "🥛",
  "Limpieza y hogar": "🏠",
  "Marisco, pescado y sushi": "🐟",
  "Mascotas": "🐾",
  "Pan y bollería": "🍞",
  "Parafarmacia": "💊",
  "Postres y yogures": "🍦",
  "Zumos": "🍊",
};

export default function SupermercadoShop() {
  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const { data: categories, isLoading: loadingCats } = trpc.mercadona.categories.useQuery(
    undefined,
    { enabled: selectedSupermarket === "mercadona" }
  );

  const { data: products, isLoading: loadingProducts } = trpc.mercadona.productsByCategory.useQuery(
    { categoryId: selectedCatId! },
    { enabled: !!selectedCatId && !debouncedQuery && selectedSupermarket === "mercadona" }
  );

  const { data: searchResults, isLoading: loadingSearch } = trpc.mercadona.searchProducts.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 2 && selectedSupermarket === "mercadona" }
  );

  const displayedProducts: MercadProduct[] = debouncedQuery.length >= 2
    ? (searchResults ?? [])
    : (products ?? []);

  const isLoading = debouncedQuery.length >= 2 ? loadingSearch : loadingProducts;

  const addToCart = (product: MercadProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) return prev.map((c) => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} añadido`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter((c) => c.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const activeSupermarket = SUPERMARKETS.find((s) => s.id === selectedSupermarket);

  // ── Supermarket selector screen ──────────────────────────────────────────────
  if (!selectedSupermarket) {
    return (
      <div className="vively-page pb-32">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Supermercados</h1>
          <p className="text-sm text-gray-500">Elige tu supermercado favorito para hacer la compra</p>
        </div>

        <div className="flex flex-col gap-3">
          {SUPERMARKETS.map((sm) => (
            <button
              key={sm.id}
              onClick={() => {
                if (sm.available) {
                  setSelectedSupermarket(sm.id);
                } else {
                  toast.info(`${sm.name} estará disponible próximamente`);
                }
              }}
              className={`flex items-center gap-4 rounded-3xl p-4 text-left transition-all active:scale-[0.98] ${
                sm.available ? "bg-white shadow-sm border border-gray-100" : "bg-gray-50 border border-gray-100 opacity-70"
              }`}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 font-black"
                style={{ background: sm.bg, color: sm.color }}
              >
                {sm.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-900 text-gray-900">{sm.name}</p>
                  {sm.available ? (
                    <span className="text-xs font-700 px-2 py-0.5 rounded-full text-white" style={{ background: sm.color }}>
                      Disponible
                    </span>
                  ) : (
                    <span className="text-xs font-700 px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{sm.desc}</p>
              </div>
              {sm.available && (
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl p-4 bg-orange-50 border border-orange-100">
          <p className="text-xs text-orange-700 font-600 text-center">
            🚀 Estamos integrando más supermercados. ¡Pronto podrás comprar en todos desde BuddyMarket!
          </p>
        </div>
      </div>
    );
  }

  // ── Mercadona product browser ─────────────────────────────────────────────────
  return (
    <div className="vively-page pb-32">
      {/* Header with back + cart */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setSelectedSupermarket(null); setSelectedCatId(null); setSearchQuery(""); }}
            className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-900 text-white"
                style={{ background: activeSupermarket?.color }}
              >
                {activeSupermarket?.name.charAt(0)}
              </div>
              <h1 className="text-lg font-900 text-gray-900">{activeSupermarket?.name}</h1>
            </div>
            <p className="text-xs text-gray-400">Precios en tiempo real</p>
          </div>
        </div>
        {cartCount > 0 && (
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-800 text-white"
            style={{ background: "linear-gradient(135deg, #F97316, #FB923C)", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setSelectedCatId(null); }}
          placeholder="Buscar pollo, pasta, aceite..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(""); setDebouncedQuery(""); }} className="text-gray-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Categories */}
      {!debouncedQuery && (
        <div className="mb-5">
          <p className="text-xs font-700 text-gray-400 uppercase tracking-wider mb-3">Categorías</p>
          {loadingCats ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(categories ?? []).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.categories[0]?.id ?? null)}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                    selectedCatId && cat.categories.some((s) => s.id === selectedCatId)
                      ? "text-white shadow-md"
                      : "bg-white text-gray-700 shadow-sm border border-gray-100"
                  }`}
                  style={
                    selectedCatId && cat.categories.some((s) => s.id === selectedCatId)
                      ? { background: activeSupermarket?.color }
                      : {}
                  }
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat.name] ?? "🛍️"}</span>
                  <span className="text-xs font-700 text-center leading-tight line-clamp-2">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subcategory tabs */}
      {!debouncedQuery && selectedCatId && categories && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories
            .find((c) => c.categories.some((s) => s.id === selectedCatId))
            ?.categories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedCatId(sub.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-700 transition-all ${
                  selectedCatId === sub.id ? "text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
                style={selectedCatId === sub.id ? { background: activeSupermarket?.color } : {}}
              >
                {sub.name}
              </button>
            ))}
        </div>
      )}

      {/* Products */}
      {(selectedCatId || debouncedQuery.length >= 2) && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 shadow-sm animate-pulse">
                  <div className="w-full h-28 bg-gray-100 rounded-xl mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-base font-700 text-gray-700">No se encontraron productos</p>
              <p className="text-sm text-gray-400 mt-1">Prueba con otra búsqueda o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {displayedProducts.map((product) => {
                const inCart = cart.find((c) => c.id === product.id);
                return (
                  <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col">
                    <div className="w-full h-28 bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} className="w-full h-full object-contain p-2"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className="text-4xl">🛒</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-700 text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
                      {product.brand && <p className="text-xs text-gray-400 mb-1">{product.brand}</p>}
                      {product.unit && <p className="text-xs text-gray-400 mb-1">{product.unit}</p>}
                      <p className="text-base font-900 mb-3" style={{ color: activeSupermarket?.color }}>{product.priceStr}</p>
                    </div>
                    {inCart ? (
                      <div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: `${activeSupermarket?.bg}` }}>
                        <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-lg bg-white font-900 flex items-center justify-center shadow-sm" style={{ color: activeSupermarket?.color }}>−</button>
                        <span className="text-sm font-800" style={{ color: activeSupermarket?.color }}>{inCart.qty}</span>
                        <button onClick={() => updateQty(product.id, 1)} className="w-7 h-7 rounded-lg text-white font-900 flex items-center justify-center" style={{ background: activeSupermarket?.color }}>+</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full rounded-xl py-2 text-xs font-800 text-white transition-all active:scale-95"
                        style={{ background: activeSupermarket?.color }}
                      >
                        + Añadir
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!selectedCatId && !debouncedQuery && !loadingCats && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4">👆</div>
          <p className="text-base font-700 text-gray-700">Selecciona una categoría</p>
          <p className="text-sm text-gray-400 mt-1">o busca un producto directamente</p>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-900 text-gray-900">Mi lista — {activeSupermarket?.name}</h2>
                <p className="text-xs text-gray-500">{cartCount} producto{cartCount !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain p-1" /> : <span className="text-xl">🛒</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-700 text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs font-800" style={{ color: activeSupermarket?.color }}>{item.priceStr} × {item.qty} = {(item.price * item.qty).toFixed(2)}€</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-900 flex items-center justify-center text-sm">−</button>
                    <span className="text-sm font-800 w-5 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg text-white font-900 flex items-center justify-center text-sm" style={{ background: activeSupermarket?.color }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pt-4 pb-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-700 text-gray-700">Total estimado</span>
                <span className="text-xl font-900 text-gray-900">{cartTotal.toFixed(2)}€</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(cart.map((c) => `• ${c.name} x${c.qty} — ${(c.price * c.qty).toFixed(2)}€`).join("\n")); toast.success("Lista copiada"); }}
                  className="flex-1 rounded-2xl py-3 text-sm font-800 border-2"
                  style={{ color: activeSupermarket?.color, borderColor: activeSupermarket?.color }}
                >
                  Copiar lista
                </button>
                <button
                  onClick={() => { toast.success("Lista guardada en tu perfil"); setShowCart(false); }}
                  className="flex-1 rounded-2xl py-3 text-sm font-800 text-white"
                  style={{ background: activeSupermarket?.color, boxShadow: `0 4px 12px ${activeSupermarket?.color}55` }}
                >
                  Guardar lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
