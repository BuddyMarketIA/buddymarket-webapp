import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Lidl brand colors ─────────────────────────────────────────────────────────
const LIDL_BLUE = "#0050AA";
const LIDL_YELLOW = "#FFD700";
const LIDL_RED = "#E3000B";
const LIDL_BG = "#EEF4FB";

const CATEGORY_ICONS: Record<string, string> = {
  "Frutas y verduras": "🥦", "Lácteos y huevos": "🥛", "Carnes y aves": "🥩",
  "Pescados y mariscos": "🐟", "Pan y panadería": "🍞", "Pasta, arroz y legumbres": "🍝",
  "Aceites y condimentos": "🫒", "Cereales y desayuno": "🥣", "Congelados": "🧊",
  "Bebidas": "💧", "Snacks y frutos secos": "🥜", "Higiene y limpieza": "🧴",
  "Food": "🥬",
  // Nombres adicionales de la BD
  "Carne y pescado": "🥩", "Carnes": "🥩",
  "Cereales y pan": "🍞", "Cereales y legumbres": "🍝", "Conservas y legumbres": "🥫",
  "Endulzantes": "🍯", "Frutos secos": "🥜", "Lácteos": "🥛",
  "Huevos": "🥚", "Nutrición deportiva": "💪", "Panadería": "🍞",
  "Suplementos": "💊", "Panadería y bollería": "🍞",
  "Conservas": "🥫", "Condimentos y salsas": "🧂",
  "Sopas y caldos": "🍲", "Dulces y snacks": "🍫",
  "Mermeladas y untables": "🍯", "Zumos y batidos": "🍊",
  "Café e infusiones": "☕", "Cervezas": "🍺", "Vinos y licores": "🍷",
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
  price: number;
  image: string | null;
  brand: string | null;
  packaging: string | null;
  shareUrl: string;
  quantity: number;
}

interface LidlProduct {
  id: string;
  name: string;
  brand: string;
  image: string | null;
  price: number | null;
  packaging: string;
  category: string;
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

export default function LidlShop() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 400);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data: rawCategories, isLoading: loadingCats } = trpc.lidl.categories.useQuery();

  const categories = rawCategories ?? [];

  const { data: searchResults, isLoading: loadingSearch } = trpc.lidl.searchProducts.useQuery(
    { q: debouncedQuery, limit: 40 },
    { enabled: debouncedQuery.length >= 2 }
  );

  const { data: categoryProducts, isLoading: loadingCatProducts } = trpc.lidl.byCategory.useQuery(
    { category: selectedCategory ?? "", limit: 60 },
    { enabled: !!selectedCategory && !debouncedQuery }
  );

  const displayedProducts: LidlProduct[] = debouncedQuery.length >= 2
    ? (searchResults ?? [])
    : (categoryProducts ?? []);
  const isLoading = debouncedQuery.length >= 2 ? loadingSearch : loadingCatProducts;

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const addToCart = (product: LidlProduct) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) return prev.map((c) => c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price ?? 0,
        image: product.image || null,
        brand: product.brand || null,
        packaging: product.packaging || null,
        shareUrl: product.productUrl ?? `https://www.lidl.es/q/search?q=${encodeURIComponent(product.name)}`,
        quantity: 1,
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
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  // ── Go to Lidl ───────────────────────────────────────────────────────────────
  const handleGoToLidl = () => {
    if (cart.length === 0) {
      window.open("https://www.lidl.es", "_blank");
      return;
    }
    // Open each product in a new tab with a small delay
    cart.forEach((item, idx) => {
      setTimeout(() => {
        const url = item.shareUrl.startsWith("http")
          ? item.shareUrl
          : `https://www.lidl.es/q/search?q=${encodeURIComponent(item.name)}`;
        window.open(url, "_blank");
      }, idx * 400);
    });
    toast.success(`Abriendo ${cart.length} producto${cart.length !== 1 ? "s" : ""} en Lidl`);
  };

  const handleCopyList = () => {
    const text = cart.map((c) => `• ${c.name}${c.packaging ? ` (${c.packaging})` : ""} ×${c.quantity} — ${(c.price * c.quantity).toFixed(2)}€`).join("\n")
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
            className="w-9 h-9 rounded-2xl bg-background shadow-sm border border-border/50 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              {/* Lidl logo colors */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white" style={{ background: LIDL_BLUE }}>L</div>
              <h1 className="text-lg font-black text-foreground">Lidl</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: LIDL_RED }}>
                Precios bajos
              </span>
            </div>
            <p className="text-xs text-muted-foreground/70">{categories.reduce((s: number, c: any) => s + (c.count ?? 0), 0)} productos disponibles</p>
          </div>
        </div>
        {/* Cart button */}
        <button
          onClick={() => setShowCart(true)}
          className="relative w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border border-border/50 bg-background"
        >
          <svg className="w-5 h-5 text-foreground/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-black flex items-center justify-center" style={{ background: LIDL_RED }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="relative mb-5">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar en Lidl..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-background border border-border/50 shadow-sm text-sm font-medium text-foreground placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": LIDL_BLUE } as React.CSSProperties}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-muted flex items-center justify-center"
          >
            <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Categories ──────────────────────────────────────────────────────── */}
      {!debouncedQuery && (
        <div className="mb-5">
          {loadingCats ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-background rounded-2xl p-3 h-20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {categories.map((cat: any) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                  className={`rounded-2xl p-3 flex flex-col items-center gap-1.5 transition-all active:scale-95 ${
                    selectedCategory === cat.category
                      ? "text-white shadow-md"
                      : "bg-background text-foreground/80 shadow-sm border border-border/50"
                  }`}
                  style={selectedCategory === cat.category ? { background: LIDL_BLUE } : {}}
                >
                  <span className="text-2xl">{CATEGORY_ICONS[cat.category] ?? "🛍️"}</span>
                  <span className="text-xs font-bold text-center leading-tight line-clamp-2">{cat.category}</span>
                  <span className="text-xs opacity-60">{cat.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Products grid ───────────────────────────────────────────────────── */}
      {(selectedCategory || debouncedQuery.length >= 2) && (
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-background rounded-2xl p-3 shadow-sm animate-pulse">
                  <div className="w-full h-28 bg-muted/50 rounded-xl mb-3" />
                  <div className="h-3 bg-muted/50 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-base font-bold text-foreground/80">No se encontraron productos</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Prueba con otra búsqueda o categoría</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground/70 mb-3">{displayedProducts.length} productos</p>
              <div className="grid grid-cols-2 gap-3">
                {displayedProducts.map((product) => {
                  const inCart = cart.find((c) => c.id === product.id);
                  return (
                    <div key={product.id} className="bg-background rounded-2xl p-3 shadow-sm border border-border/50 flex flex-col">
                      {/* Product image */}
                      <div className="w-full h-28 bg-muted/30 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
                        <ProductImage src={product.image} name={product.name} category={product.category} />
                      </div>
                      {/* Product info */}
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground leading-tight line-clamp-2 mb-1">{product.name}</p>
                        {product.brand && <p className="text-xs text-muted-foreground/70 mb-0.5">{product.brand}</p>}
                        {product.packaging && <p className="text-xs text-muted-foreground/70 mb-1">{product.packaging}</p>}
                        <p className="text-base font-black mb-3" style={{ color: LIDL_BLUE }}>
                          {product.price != null && product.price > 0 ? `${product.price.toFixed(2)}€` : "—"}
                        </p>
                      </div>
                      {/* Add to cart */}
                      {inCart ? (
                        <div className="flex items-center justify-between rounded-xl px-2 py-1.5" style={{ background: LIDL_BG }}>
                          <button
                            onClick={() => updateQty(product.id, -1)}
                            className="w-7 h-7 rounded-lg bg-background font-black flex items-center justify-center shadow-sm"
                            style={{ color: LIDL_BLUE }}
                          >−</button>
                          <span className="text-sm font-bold" style={{ color: LIDL_BLUE }}>{inCart.quantity}</span>
                          <button
                            onClick={() => updateQty(product.id, 1)}
                            className="w-7 h-7 rounded-lg text-white font-black flex items-center justify-center"
                            style={{ background: LIDL_BLUE }}
                          >+</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="w-full rounded-xl py-2 text-xs font-bold text-white transition-all active:scale-95"
                          style={{ background: LIDL_BLUE }}
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
      {!selectedCategory && debouncedQuery.length < 2 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-lg" style={{ background: `linear-gradient(135deg, ${LIDL_BLUE}, #0066CC)` }}>
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-lg font-black text-foreground mb-2">Compra en Lidl</h2>
          <p className="text-sm text-muted-foreground max-w-xs">Selecciona una categoría o busca un producto para empezar a añadir al carrito</p>
        </div>
      )}

      {/* ── Floating cart bar ───────────────────────────────────────────────── */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={() => setShowCart(true)}
            className="w-full rounded-2xl py-4 text-base font-bold text-white flex items-center justify-between px-5 shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${LIDL_BLUE}, #0066CC)` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: LIDL_YELLOW, color: "#1a1a1a" }}>
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
          <div className="relative bg-background rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
            {/* Cart header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div>
                <h2 className="text-lg font-black text-foreground">Mi carrito Lidl</h2>
                <p className="text-xs text-muted-foreground/70">{cartCount} artículo{cartCount !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-gray-50">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="w-12 h-12 bg-muted/30 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-1" />
                      : <span className="text-xl">🛒</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground line-clamp-1">{item.name}</p>
                    {item.brand && <p className="text-xs text-muted-foreground/70">{item.brand}</p>}
                    <p className="text-xs font-bold" style={{ color: LIDL_BLUE }}>
                      {item.price.toFixed(2)}€ × {item.quantity} = {(item.price * item.quantity).toFixed(2)}€
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-muted/50 text-foreground/80 font-black flex items-center justify-center text-sm">−</button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg text-white font-black flex items-center justify-center text-sm" style={{ background: LIDL_BLUE }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            {/* Cart footer */}
            <div className="px-5 pt-4 pb-8 border-t border-border/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-foreground/80">Total estimado</span>
                <span className="text-xl font-black text-foreground">{cartTotal.toFixed(2)}€</span>
              </div>
              <button
                onClick={handleGoToLidl}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white mb-3 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${LIDL_BLUE}, #0066CC)`, boxShadow: `0 4px 16px rgba(0,80,170,0.4)` }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Buscar en Lidl ({cartCount})
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyList}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold border-2"
                  style={{ color: LIDL_BLUE, borderColor: LIDL_BLUE }}
                >
                  Copiar lista
                </button>
                <button
                  onClick={() => window.open("https://www.lidl.es", "_blank")}
                  className="flex-1 rounded-2xl py-3 text-sm font-bold bg-muted/50 text-foreground/80"
                >
                  Ir a Lidl
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
