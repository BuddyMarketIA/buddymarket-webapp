import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ── Hiperdino brand colors ────────────────────────────────────────────────────
const HD_RED = "#E30613";
const HD_DARK = "#1A1A1A";
const HD_BG = "#FFF5F5";

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
  "Productos canarios": "🌴",
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
  brand: string;
  image: string | null;
  price: number | null;
  packaging: string;
  category: string;
  qty: number;
}

export default function HiperdinoShop() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const { data: categories = [], isLoading: loadingCats } = trpc.hiperdino.categories.useQuery();
  const { data: products = [], isLoading: loadingProducts } = trpc.hiperdino.byCategory.useQuery(
    { category: selectedCategory ?? "" },
    { enabled: !!selectedCategory }
  );
  const { data: searchResults = [], isLoading: loadingSearch } = trpc.hiperdino.searchProducts.useQuery(
    { q: searchQuery },
    { enabled: searchQuery.length >= 2 }
  );

  const displayProducts = searchQuery.length >= 2 ? searchResults : (selectedCategory ? products : []);
  const isLoading = loadingProducts || loadingSearch;

  const addToCart = (product: typeof displayProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} añadido al carrito`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);

  return (
    <div className="min-h-screen" style={{ background: HD_BG }}>
      {/* Header */}
      <div style={{ background: HD_RED }} className="text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/app/supermercados")}
              className="text-white/80 hover:text-white transition-colors"
            >
              ← Volver
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Hiperdino</h1>
              <p className="text-xs text-white/70">Tu supermercado canario</p>
            </div>
          </div>
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-full text-sm text-gray-800 bg-white/95 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          {/* Cart button */}
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full text-sm font-medium"
          >
            🛒 Carrito
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Category selector */}
        {!searchQuery && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Categorías</h2>
            {loadingCats ? (
              <div className="text-gray-400 text-sm">Cargando categorías...</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2">
                {categories.map((cat) => {
                  const icon = CATEGORY_ICONS[cat.category] ?? "🛒";
                  const isSelected = selectedCategory === cat.category;
                  return (
                    <button
                      key={cat.category}
                      onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
                      className="flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-center"
                      style={{
                        borderColor: isSelected ? HD_RED : "#e5e7eb",
                        background: isSelected ? "#FFF0F0" : "white",
                        color: isSelected ? HD_RED : HD_DARK,
                      }}
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs font-medium leading-tight line-clamp-2">{cat.category}</span>
                      <span className="text-xs text-gray-400">{cat.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Products grid */}
        {(selectedCategory || searchQuery.length >= 2) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">
                {searchQuery.length >= 2
                  ? `Resultados para "${searchQuery}"`
                  : selectedCategory}
              </h2>
              <span className="text-sm text-gray-400">{displayProducts.length} productos</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                    <div className="w-full h-32 bg-gray-200 rounded-xl mb-3" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-2">🔍</span>
                No se encontraron productos
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {displayProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="w-full h-36 bg-gray-50 flex items-center justify-center">
                      <ProductImage
                        src={product.image}
                        name={product.name}
                        category={product.category}
                      />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="text-xs text-gray-400 mb-1">{product.brand}</p>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1 mb-2">{product.name}</p>
                      <p className="text-xs text-gray-400 mb-2">{product.packaging}</p>
                      {product.price != null && (
                        <p className="text-base font-bold mb-2" style={{ color: HD_RED }}>
                          {product.price.toFixed(2)}€
                        </p>
                      )}
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: HD_RED }}
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!selectedCategory && searchQuery.length < 2 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌴</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Bienvenido a Hiperdino</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Selecciona una categoría o busca un producto para empezar a comprar
            </p>
          </div>
        )}
      </div>

      {/* Cart modal */}
      {showCart && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowCart(false); }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">🛒 Carrito Hiperdino</h3>
              <button onClick={() => setShowCart(false)} aria-label="Cerrar carrito" className="text-gray-400 hover:text-gray-600">✕</button>
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
                      <span className="font-bold" style={{ color: HD_RED }}>
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
                  <span className="text-xl font-bold" style={{ color: HD_RED }}>{totalPrice.toFixed(2)}€</span>
                </div>
                <button
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ background: HD_RED }}
                  onClick={() => {
                    toast.success("Lista guardada. Puedes comprar en hiperdino.es");
                    setShowCart(false);
                  }}
                >
                  Ir a Hiperdino.es →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
