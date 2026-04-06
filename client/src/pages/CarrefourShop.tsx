import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Carrefour brand colors ────────────────────────────────────────────────────
const CARR_BLUE = "#004A97";
const CARR_RED = "#E63329";
const CARR_BG = "#E3F2FD";

const CATEGORY_ICONS: Record<string, string> = {
  "Lácteos y huevos": "🥛", "Carnes y aves": "🥩", "Pescados y mariscos": "🐟",
  "Frutas y verduras": "🥦", "Panadería y bollería": "🍞", "Pasta, arroz y legumbres": "🍝",
  "Conservas": "🥫", "Aceites y condimentos": "🫒", "Condimentos y salsas": "🧂",
  "Sopas y caldos": "🍲", "Dulces y snacks": "🍫", "Frutos secos y snacks": "🥜",
  "Cereales y desayuno": "🥣", "Mermeladas y untables": "🍯", "Agua y refrescos": "💧",
  "Zumos y batidos": "🍊", "Café e infusiones": "☕", "Cervezas": "🍺",
  "Vinos y licores": "🍷", "Congelados": "🧊", "Platos preparados": "🍱",
  "Charcutería": "🥓", "Higiene personal": "🧴", "Droguería": "🧹",
  "Bebé": "👶", "Mascotas": "🐾", "Parafarmacia": "💊",
  // Nombres adicionales de la BD
  "Bebidas": "💧", "Carne y pescado": "🥩",
  "Carnes": "🥩", "Cereales y pan": "🍞", "Cereales y legumbres": "🍝",
  "Conservas y legumbres": "🥫", "Endulzantes": "🍯", "Frutos secos": "🥜",
  "Lácteos": "🥛", "Huevos": "🥚", "Nutrición deportiva": "💪",
  "Panadería": "🍞", "Suplementos": "💊", "Pan y panadería": "🍞",
  "Snacks y frutos secos": "🥜", "Higiene y limpieza": "🧴",
  "Quesos y charcutería": "🧀", "Embutidos": "🧀",
};

// Componente de imagen de producto con fallback visual
function ProductImage({ src, name, category }: { src: string | null; name: string; category?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const emoji = CATEGORY_ICONS[category ?? ""] ?? "🥬";
  if (!src || imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-4xl">{emoji}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className="w-full h-full object-contain p-2"
      onError={() => setImgError(true)}
    />
  );
}

interface CartItem {
  id: string;
  name: string;
  price: number | null;
  image: string | null;
  quantity: number;
  productUrl: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, delay]);
  return debounced;
}

export default function CarrefourShop() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 400);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: categoriesRaw = [], isLoading: loadingCats } = trpc.carrefour.categories.useQuery();

  const categoryMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const row of categoriesRaw as Array<{ category: string; subcategory: string; count: number }>) {
      if (!row.category) continue;
      if (!map[row.category]) map[row.category] = [];
      if (row.subcategory && !map[row.category].includes(row.subcategory)) {
        map[row.category].push(row.subcategory);
      }
    }
    return map;
  }, [categoriesRaw]);

  const topCategories = useMemo(() => Object.keys(categoryMap).sort(), [categoryMap]);
  const subcategories = useMemo(() => selectedCategory ? (categoryMap[selectedCategory] ?? []) : [], [categoryMap, selectedCategory]);

  const isSearching = debouncedQuery.trim().length >= 2;

  const { data: searchResults = [], isLoading: loadingSearch } = trpc.carrefour.searchProducts.useQuery(
    { q: debouncedQuery, limit: 48 },
    { enabled: isSearching }
  );

  const { data: categoryProducts = [], isLoading: loadingCatProducts } = trpc.carrefour.byCategory.useQuery(
    { category: selectedCategory!, subcategory: selectedSubcategory ?? undefined, limit: 48 },
    { enabled: !!selectedCategory && !isSearching }
  );

  const displayedProducts = isSearching ? searchResults : (selectedCategory ? categoryProducts : []);
  const isLoading = isSearching ? loadingSearch : loadingCatProducts;

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) return prev.map((c) => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        productUrl: product.productUrl,
      }];
    });
    toast.success(`${product.name.slice(0, 30)}... añadido`, { duration: 1500 });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => prev
      .map((c) => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
      .filter((c) => c.quantity > 0)
    );
  };

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => sum + (c.price ?? 0) * c.quantity, 0);

  const handleGoToCarrefour = () => {
    if (cart.length === 0) {
      window.open("https://www.carrefour.es/supermercado", "_blank");
      return;
    }
    cart.forEach((item, idx) => {
      setTimeout(() => {
        const url = item.productUrl
          ? `https://www.carrefour.es${item.productUrl}`
          : `https://www.carrefour.es/supermercado/buscar?query=${encodeURIComponent(item.name)}`;
        window.open(url, "_blank");
      }, idx * 400);
    });
    toast.success(`Abriendo ${cart.length} producto${cart.length !== 1 ? "s" : ""} en Carrefour`);
  };

  const handleCopyList = () => {
    const text = cart.map((c) => `• ${c.name} ×${c.quantity} — ${((c.price ?? 0) * c.quantity).toFixed(2)}€`).join("\n")
      + `\n\nTotal estimado: ${cartTotal.toFixed(2)}€`;
    navigator.clipboard.writeText(text).then(() => toast.success("Lista copiada al portapapeles"));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="vively-page pb-32">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/supermercados")}
            className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: CARR_BLUE }}>C</div>
              <h1 className="text-lg font-black text-gray-900">Carrefour</h1>
            </div>
            <p className="text-xs text-gray-400">14.500+ productos disponibles</p>
          </div>
        </div>
        {/* Cart button */}
        <button
          onClick={() => setShowCart(true)}
          className="relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 bg-white"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-black flex items-center justify-center" style={{ background: CARR_RED }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="relative mb-5">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar en Carrefour..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center"
          >
            <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Categories ──────────────────────────────────────────────────────── */}
      {!isSearching && (
        <div className="mb-5">
          {loadingCats ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-2xl p-3 h-20 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {topCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(selectedCategory === cat ? null : cat); setSelectedSubcategory(null); }}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                    selectedCategory === cat ? "text-white shadow-md" : "bg-white text-gray-700 shadow-sm border border-gray-100"
                  }`}
                  style={selectedCategory === cat ? { background: CARR_BLUE } : {}}
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat] ?? "🛍️"}</span>
                  <span className="text-xs font-bold text-center leading-tight line-clamp-2">{cat}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Subcategory tabs ─────────────────────────────────────────────────── */}
      {!isSearching && selectedCategory && subcategories.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedSubcategory(null)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${!selectedSubcategory ? "text-white" : "bg-white text-gray-600 border border-gray-200"}`}
            style={!selectedSubcategory ? { background: CARR_BLUE } : {}}
          >Todos</button>
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-all ${selectedSubcategory === sub ? "text-white" : "bg-white text-gray-600 border border-gray-200"}`}
              style={selectedSubcategory === sub ? { background: CARR_BLUE } : {}}
            >{sub}</button>
          ))}
        </div>
      )}

      {/* ── Products grid ───────────────────────────────────────────────────── */}
      {(selectedCategory || isSearching) && (
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
              <p className="text-base font-bold text-gray-700">No se encontraron productos</p>
              <p className="text-sm text-gray-400 mt-1">Prueba con otra búsqueda o categoría</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">{displayedProducts.length} productos</p>
              <div className="grid grid-cols-2 gap-3">
                {(displayedProducts as any[]).map((product) => {
                  const inCart = cart.find((c) => c.id === product.id);
                  return (
                    <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col">
                      <div className="w-full h-28 bg-gray-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                        <ProductImage src={product.image} name={product.name} category={product.category} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 mb-1">{product.name}</p>
                        {product.brand && <p className="text-xs text-gray-400 mb-0.5">{product.brand}</p>}
                        {product.packaging && <p className="text-xs text-gray-400 mb-1">{product.packaging}</p>}
                        <p className="text-base font-black mb-3" style={{ color: CARR_BLUE }}>
                          {product.price != null ? `${product.price.toFixed(2)}€` : "—"}
                          {product.pricePerUnit && <span className="text-xs font-normal text-gray-400 ml-1">({product.pricePerUnit})</span>}
                        </p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: CARR_BG }}>
                          <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-lg bg-white font-black flex items-center justify-center shadow-sm" style={{ color: CARR_BLUE }}>−</button>
                          <span className="text-sm font-bold" style={{ color: CARR_BLUE }}>{inCart.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="w-7 h-7 rounded-lg text-white font-black flex items-center justify-center" style={{ background: CARR_BLUE }}>+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full rounded-xl py-2 text-xs font-bold text-white transition-all active:scale-95"
                          style={{ background: CARR_BLUE }}
                        >+ Añadir</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!selectedCategory && !isSearching && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${CARR_BLUE}, #0066CC)` }}>
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-lg font-black text-gray-900 mb-2">Compra en Carrefour</h2>
          <p className="text-sm text-gray-500 max-w-xs">Selecciona una categoría o busca un producto para empezar a añadir al carrito</p>
        </div>
      )}

      {/* ── Floating cart bar ───────────────────────────────────────────────── */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full rounded-2xl py-4 text-base font-bold text-white flex items-center justify-between px-5 shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${CARR_BLUE}, #0066CC)` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center font-black text-sm" style={{ color: CARR_BLUE }}>
                {cartCount}
              </div>
              <span>Ver carrito</span>
            </div>
            <span className="font-black">{cartTotal.toFixed(2)}€</span>
          </button>
        </div>
      )}

      {/* ── Cart slide-up ───────────────────────────────────────────────────── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-black text-gray-900">Mi carrito Carrefour</h2>
                <p className="text-xs text-gray-400">{cartCount} artículo{cartCount !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                      : <span className="text-xl">🛒</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                    <p className="text-xs font-bold" style={{ color: CARR_BLUE }}>
                      {(item.price ?? 0).toFixed(2)}€ × {item.quantity} = {((item.price ?? 0) * item.quantity).toFixed(2)}€
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-black flex items-center justify-center text-sm">−</button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg text-white font-black flex items-center justify-center text-sm" style={{ background: CARR_BLUE }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pt-4 pb-8 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-gray-700">Total estimado</span>
                <span className="text-xl font-black text-gray-900">{cartTotal.toFixed(2)}€</span>
              </div>
              <button
                onClick={handleGoToCarrefour}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white mb-3 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${CARR_BLUE}, #0066CC)`, boxShadow: "0 4px 16px rgba(0,74,151,0.4)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Buscar en Carrefour ({cartCount})
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyList}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold border-2"
                  style={{ color: CARR_BLUE, borderColor: CARR_BLUE }}
                >
                  Copiar lista
                </button>
                <button
                  onClick={() => window.open("https://www.carrefour.es/supermercado", "_blank")}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold bg-gray-100 text-gray-700"
                >
                  Ir a Carrefour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
