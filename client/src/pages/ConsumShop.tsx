import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Consum brand colors ────────────────────────────────────────────────────────
const CS_GREEN = "#00843D";
const CS_DARK = "#1A1A1A";
const CS_BG = "#F0FAF4";

const CATEGORY_ICONS: Record<string, string> = {
  "Frutas y verduras": "🥦",
  "Lácteos y huevos": "🥛",
  "Carne y pescado": "🥩",
  "Panadería": "🍞",
  "Bebidas": "💧",
  "Aceites y condimentos": "🫒",
  "Cereales y legumbres": "🍝",
  "Congelados": "🧊",
  "Charcutería": "🧀",
  "Conservas": "🥫",
  "Snacks y dulces": "🍫",
  "Higiene y droguería": "🧴",
  "Limpieza del hogar": "🧹",
  "Mascotas": "🐾",
  "Bebés": "👶",
  "Platos preparados": "🍱",
  "Aperitivos": "🥨",
  "Zumos y refrescos": "🧃",
  "Vinos y cervezas": "🍷",
  "Café e infusiones": "☕",
};

function ProductImage({ src, name, category }: { src: string | null; name: string; category?: string | null }) {
  const [imgError, setImgError] = useState(false);
  const emoji = CATEGORY_ICONS[category ?? ""] ?? "🛒";
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
  brand: string | null;
  image: string | null;
  price: number | null;
  packaging: string | null;
  category: string | null;
  qty: number;
}

export default function ConsumShop() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const { data: categories = [], isLoading: loadingCats } = trpc.consum.categories.useQuery();
  const { data: products = [], isLoading: loadingProducts } = trpc.consum.byCategory.useQuery(
    { category: selectedCategory ?? "" },
    { enabled: !!selectedCategory }
  );
  const { data: searchResults = [], isLoading: loadingSearch } = trpc.consum.searchProducts.useQuery(
    { q: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const displayProducts = searchQuery.length >= 2 ? searchResults : (selectedCategory ? products : []);
  const isLoading = loadingProducts || loadingSearch;

  const addToCart = (product: typeof displayProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === String(product.id));
      if (existing) {
        return prev.map(i => i.id === String(product.id) ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        id: String(product.id),
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price ? Number(product.price) : null,
        packaging: product.packaging,
        category: product.category,
        qty: 1,
      }];
    });
    toast.success(`${product.name} añadido al carrito`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);

  return (
    <div className="min-h-screen" style={{ background: CS_BG }}>
      {/* Header */}
      <div style={{ background: CS_GREEN }} className="text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app/shopping-lists")}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← Volver
            </button>
            <div>
              <h1 className="text-xl font-bold">Consum</h1>
              <p className="text-xs text-white/70">Supermercado online</p>
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl transition-colors"
          >
            <span>🛒</span>
            <span className="font-semibold text-sm">{totalItems} items</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
        {/* Search bar */}
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar productos Consum..."
            className="w-full px-4 py-3 rounded-xl text-gray-800 bg-white placeholder-gray-400 text-sm outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar categories */}
        <aside className="w-48 flex-shrink-0 hidden md:block">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Categorías</h2>
          {loadingCats ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((cat: any) => (
                <button
                  key={cat.category}
                  onClick={() => { setSelectedCategory(cat.category); setSearchQuery(""); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.category
                      ? "text-white font-semibold"
                      : "text-gray-700 hover:bg-green-50"
                  }`}
                  style={selectedCategory === cat.category ? { background: CS_GREEN } : {}}
                >
                  <span className="mr-1.5">{CATEGORY_ICONS[cat.category] ?? "🛒"}</span>
                  {cat.category}
                  <span className="ml-1 text-xs opacity-60">({cat.count})</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Mobile categories */}
        <div className="md:hidden w-full mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat: any) => (
              <button
                key={cat.category}
                onClick={() => { setSelectedCategory(cat.category); setSearchQuery(""); }}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                  selectedCategory === cat.category ? "text-white border-transparent" : "text-gray-600 bg-white border-gray-200"
                }`}
                style={selectedCategory === cat.category ? { background: CS_GREEN } : {}}
              >
                {CATEGORY_ICONS[cat.category] ?? "🛒"} {cat.category}
              </button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        <main className="flex-1 min-w-0">
          {!selectedCategory && searchQuery.length < 2 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🛒</p>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Explora el catálogo Consum</h2>
              <p className="text-gray-500 text-sm">Selecciona una categoría o busca un producto</p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
                  <div className="w-full h-32 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayProducts.map((product: any) => {
                const inCart = cart.find(i => i.id === String(product.id));
                return (
                  <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="w-full h-36 bg-gray-50 flex items-center justify-center">
                      <ProductImage src={product.image} name={product.name} category={product.category} />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-xs text-gray-400 mb-0.5">{product.brand ?? product.category}</p>
                      <p className="text-sm font-semibold text-gray-800 leading-tight mb-1 flex-1 line-clamp-2">{product.name}</p>
                      {product.packaging && (
                        <p className="text-xs text-gray-400 mb-2">{product.packaging}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        {product.price ? (
                          <span className="text-base font-bold" style={{ color: CS_GREEN }}>
                            {Number(product.price).toFixed(2)}€
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Precio no disponible</span>
                        )}
                        <button
                          onClick={() => addToCart(product)}
                          className="flex items-center justify-center w-8 h-8 rounded-full text-white text-lg transition-transform hover:scale-110"
                          style={{ background: inCart ? "#16a34a" : CS_GREEN }}
                        >
                          {inCart ? "✓" : "+"}
                        </button>
                      </div>
                      {inCart && (
                        <p className="text-xs text-center mt-1" style={{ color: CS_GREEN }}>
                          {inCart.qty} en carrito
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Cart panel */}
      {showCart && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end bg-black/40"
          onClick={e => { if (e.target === e.currentTarget) setShowCart(false); }}
        >
          <div className="w-full max-w-sm bg-white rounded-t-3xl md:rounded-3xl md:m-4 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">🛒 Tu carrito</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">El carrito está vacío</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <ProductImage src={item.image} name={item.name} category={item.category} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.packaging}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-bold" style={{ color: CS_GREEN }}>
                        {((item.price ?? 0) * item.qty).toFixed(2)}€
                      </span>
                      <span className="text-gray-400">x{item.qty}</span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-gray-700">Total estimado</span>
                  <span className="text-xl font-bold" style={{ color: CS_GREEN }}>{totalPrice.toFixed(2)}€</span>
                </div>
                <a
                  href={`https://www.consum.es/buscar?q=${encodeURIComponent(cart[0]?.name ?? "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 rounded-xl text-white font-semibold text-sm text-center"
                  style={{ background: CS_GREEN }}
                  onClick={() => toast.success("Abriendo Consum.es para finalizar la compra")}
                >
                  Ir a Consum.es →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
