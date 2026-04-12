import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

const CS_GREEN = "#00843D";
const CS_BG = "#FAF7F2"; // crema igual que la referencia

type SortBy = "relevance" | "price_asc" | "price_desc";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
];

// Emoji map for categories
const CAT_EMOJI: Record<string, string> = {
  "Aceitunas con hueso": "🫒",
  "Aceitunas sin hueso": "🫒",
  "Especias": "🌿",
  "Despensa": "🥫",
  "Galletas de chocolate": "🍪",
  "Cereales": "🥣",
  "Tostadas y minibiscotes": "🍞",
  "Snacks y otros aperitivos": "🍿",
  "Patatas fritas": "🥔",
  "Rosquilletas, picos y snacks": "🥨",
  "Caramelos": "🍬",
  "Gominolas": "🍭",
  "Chicles": "🫧",
  "Chocolatinas": "🍫",
  "Chocolate con Leche": "🍫",
  "Bombones": "🍫",
  "Mermeladas y confituras": "🍓",
  "Salsas frías": "🥫",
  "Tomate frito": "🍅",
  "Mayonesa": "🥚",
  "Caldo liquido": "🍲",
  "Atún y bonito": "🐟",
  "Surimis y salazones": "🦐",
  "Pescado congelado": "🐠",
  "Pescado en bandeja": "🐡",
  "Jamón": "🥩",
  "Chorizo": "🌭",
  "Cerdo": "🐷",
  "Aves": "🐔",
  "Picadas y hamburguesas": "🍔",
  "Paté de carne": "🥩",
  "Frescos y para ensaladas": "🥗",
  "Tarrinas": "🧀",
  "Bebidas vegetales": "🥛",
  "Batidos": "🥤",
  "Cola": "🥤",
  "Zumos y néctares no refrigerados": "🧃",
  "Zumos y néctares sin azúcar": "🍊",
  "Cavas y sidras": "🥂",
  "Blanco DO": "🍷",
  "Tinto otras DO": "🍷",
  "Licores y cremas": "🍸",
  "Cápsulas sistema Nespresso": "☕",
  "Té": "🍵",
  "Otras infusiones": "🫖",
  "Pizza congelada": "🍕",
  "Mexicano": "🌮",
  "Champú": "🧴",
  "Gel de baño": "🚿",
  "Dentífricos": "🦷",
  "Cepillos de dientes": "🪥",
  "Desayuno y maría": "🍪",
  "Compresas y protegeslips": "🌸",
  "Femeninas": "🌸",
  "Masculinas": "🪒",
  "Solares": "☀️",
  "Hidratación": "💧",
  "Body-lociones": "🧴",
  "Coloración": "💄",
  "Labiales": "💋",
  "Ojos": "👁️",
  "Rostro": "🧖",
  "Uñas": "💅",
  "Pienso": "🐾",
  "Comida Húmeda": "🐾",
  "Nutrición deportiva": "💪",
  "Fitoterapia": "🌱",
  "Limpieza hogar": "🧹",
  "Limpiacristales y multiusos": "🪣",
  "Suavizante": "🌸",
  "A máquina líquido": "🧺",
  "Limpieza calzado y accesorios": "👟",
  "Eléctricos y automáticos": "⚡",
  "Limpieza y desmaquilladores": "🧼",
  "Limpiadores": "🫧",
  "Spray": "💨",
  "Peines y accesorios": "💇",
  "Cuidado personal": "🪞",
};

function getCatEmoji(cat: string): string {
  return CAT_EMOJI[cat] ?? "🛒";
}

// ── Product image with fallback ────────────────────────────────────────────────
function ProductImage({ src, name, category }: { src: string | null; name: string; category?: string | null }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-4xl">{getCatEmoji(category ?? "")}</span>
      </div>
    );
  }
  return <img src={src} alt={name} className="w-full h-full object-contain p-2" onError={() => setErr(true)} />;
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

// ── Price range input ──────────────────────────────────────────────────────────
function PriceRangeInput({ min, max, value, onChange }: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void;
}) {
  const [localMin, setLocalMin] = useState(String(value[0]));
  const [localMax, setLocalMax] = useState(String(value[1]));
  useEffect(() => { setLocalMin(String(value[0])); setLocalMax(String(value[1])); }, [value[0], value[1]]);
  const commit = () => {
    const lo = Math.max(min, Math.min(Number(localMin) || min, max));
    const hi = Math.max(lo, Math.min(Number(localMax) || max, max));
    onChange([lo, hi]);
  };
  const pct = (v: number) => ((v - min) / (max - min || 1)) * 100;
  return (
    <div className="space-y-3">
      <div className="relative h-2 rounded-full bg-gray-200">
        <div className="absolute h-2 rounded-full" style={{ background: CS_GREEN, left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }} />
        <input type="range" min={min} max={max} step={0.5} value={value[0]} onChange={e => onChange([Math.min(Number(e.target.value), value[1]), value[1]])} className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" style={{ zIndex: 3 }} />
        <input type="range" min={min} max={max} step={0.5} value={value[1]} onChange={e => onChange([value[0], Math.max(Number(e.target.value), value[0])])} className="absolute inset-0 w-full opacity-0 cursor-pointer h-2" style={{ zIndex: 4 }} />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <span className="px-2 text-xs text-gray-400 bg-gray-50">€</span>
            <input type="number" min={min} max={max} step={0.5} value={localMin} onChange={e => setLocalMin(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()} className="w-full px-2 py-1.5 text-sm text-gray-800 outline-none bg-white" />
          </div>
        </div>
        <span className="text-gray-300">—</span>
        <div className="flex-1">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <span className="px-2 text-xs text-gray-400 bg-gray-50">€</span>
            <input type="number" min={min} max={max} step={0.5} value={localMax} onChange={e => setLocalMax(e.target.value)} onBlur={commit} onKeyDown={e => e.key === "Enter" && commit()} className="w-full px-2 py-1.5 text-sm text-gray-800 outline-none bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ConsumShop() {
  const [, navigate] = useLocation();
  const [view, setView] = useState<"home" | "category" | "search">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Price range
  const { data: priceRangeData } = trpc.consum.priceRange.useQuery(
    { category: selectedCategory ?? undefined },
    { staleTime: 60_000 }
  );
  useEffect(() => {
    if (priceRangeData) setPriceRange([priceRangeData.min, priceRangeData.max]);
  }, [priceRangeData?.min, priceRangeData?.max, selectedCategory]);
  const absMin = priceRangeData?.min ?? 0;
  const absMax = priceRangeData?.max ?? 50;
  const filtersActive = priceRange[0] > absMin || priceRange[1] < absMax || sortBy !== "relevance";
  const clearFilters = useCallback(() => {
    setSortBy("relevance");
    if (priceRangeData) setPriceRange([priceRangeData.min, priceRangeData.max]);
  }, [priceRangeData]);

  // Categories
  const { data: categories = [], isLoading: loadingCats } = trpc.consum.categories.useQuery();

  // Products by category
  const { data: catProducts = [], isLoading: loadingCat } = trpc.consum.byCategory.useQuery(
    { category: selectedCategory ?? "", priceMin: priceRange[0] > absMin ? priceRange[0] : undefined, priceMax: priceRange[1] < absMax ? priceRange[1] : undefined, sortBy },
    { enabled: view === "category" && !!selectedCategory }
  );

  // Search
  const { data: searchResults = [], isLoading: loadingSearch } = trpc.consum.searchProducts.useQuery(
    { q: searchQuery, priceMin: priceRange[0] > absMin ? priceRange[0] : undefined, priceMax: priceRange[1] < absMax ? priceRange[1] : undefined, sortBy, limit: 96 },
    { enabled: view === "search" && searchQuery.length >= 2 }
  );

  const displayProducts = view === "search" ? searchResults : catProducts;
  const isLoading = loadingCat || loadingSearch;

  // Handle search input
  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.length >= 2) setView("search");
    else if (q.length === 0 && view === "search") setView("home");
  };

  // Navigate to category
  const openCategory = (cat: string) => {
    setSelectedCategory(cat);
    setView("category");
    setSearchQuery("");
  };

  // Cart
  const addToCart = (product: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === String(product.id));
      if (ex) return prev.map(i => i.id === String(product.id) ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: String(product.id), name: product.name, brand: product.brand, image: product.image, price: product.price ? Number(product.price) : null, packaging: product.packaging, category: product.category, qty: 1 }];
    });
    toast.success(`${product.name} añadido`);
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);

  // Export cart to tienda.consum.es
  const exportCartMutation = trpc.consum.exportCart.useMutation({
    onSuccess: (data) => {
      if (!data.exportUrl) {
        toast.error("No se pudo generar el enlace de exportación");
        return;
      }
      if (data.truncated) {
        toast.warning(`Solo se exportarán los primeros 50 productos (tienes ${data.totalCount})`);
      }
      if (data.notExportable.length > 0) {
        toast.info(`${data.notExportable.length} producto(s) no disponibles en tienda online`);
      }
      toast.success(`Abriendo Consum.es con ${data.exportedCount} producto(s)...`);
      window.open(data.exportUrl, "_blank");
    },
    onError: () => toast.error("Error al exportar el carrito"),
  });

  const handleExportCart = () => {
    if (cart.length === 0) return;
    exportCartMutation.mutate({ productIds: cart.map(i => i.id) });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: CS_BG }}>
      {/* Header */}
      <div style={{ background: CS_GREEN }} className="sticky top-0 z-30 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (view !== "home") {
                  setView("home"); setSelectedCategory(null); setSearchQuery("");
                } else {
                  navigate("/app/supermercados");
                }
              }}
              className="text-white/80 hover:text-white text-xl font-bold leading-none px-1"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Consum</h1>
              {view === "category" && selectedCategory && (
                <p className="text-xs text-white/70 leading-tight">{selectedCategory}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-white text-sm font-semibold transition-colors"
          >
            🛒 {totalItems}
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
        {/* Search bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar en Consum..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-gray-800 bg-white placeholder-gray-400 text-sm outline-none shadow-sm"
            />
            {searchQuery.length > 0 && (
              <button onClick={() => { setSearchQuery(""); setView("home"); }} aria-label="Limpiar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg">×</button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* ── HOME: category grid ── */}
        {view === "home" && (
          <>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Categorías</p>
            {loadingCats ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat: any) => (
                  <button
                    key={cat.category}
                    onClick={() => openCategory(cat.category)}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.97] flex flex-col items-center justify-center gap-2 p-4 aspect-square"
                  >
                    <span className="text-4xl leading-none">{getCatEmoji(cat.category)}</span>
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight line-clamp-2">
                      {cat.category}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CATEGORY / SEARCH: products ── */}
        {(view === "category" || view === "search") && (
          <>
            {/* Filter bar */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFiltersOpen(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${filtersActive ? "border-green-600 text-green-700 bg-green-50" : "border-gray-200 text-gray-600 bg-white"}`}
              >
                ⚙️ Filtros
                {filtersActive && <span className="bg-green-600 text-white text-[9px] font-bold rounded-full px-1 py-0.5 leading-none">ON</span>}
              </button>
              {/* Sort quick pills */}
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setSortBy(o.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${sortBy === o.value ? "text-white border-transparent" : "border-gray-200 text-gray-500 bg-white"}`}
                  style={sortBy === o.value ? { background: CS_GREEN } : {}}
                >
                  {o.label}
                </button>
              ))}
              {filtersActive && (
                <button onClick={clearFilters} className="text-xs text-red-500 font-semibold px-2">Limpiar</button>
              )}
            </div>

            {/* Filter panel */}
            {filtersOpen && (
              <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Rango de precio</p>
                <PriceRangeInput min={absMin} max={absMax} value={priceRange} onChange={setPriceRange} />
                {(priceRange[0] > absMin || priceRange[1] < absMax) && (
                  <p className="text-xs text-green-700 font-semibold mt-2 text-center">
                    €{priceRange[0].toFixed(2)} — €{priceRange[1].toFixed(2)}
                  </p>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                {isLoading ? "Buscando..." : (
                  <><span className="font-bold" style={{ color: CS_GREEN }}>{displayProducts.length}</span> resultado{displayProducts.length !== 1 ? "s" : ""}</>
                )}
              </p>
            </div>

            {/* Products grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
                    <div className="w-full h-28 bg-gray-200 rounded-xl mb-2" />
                    <div className="h-3 bg-gray-200 rounded mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-gray-600 font-semibold mb-1">Sin resultados</p>
                {filtersActive && (
                  <button onClick={clearFilters} className="mt-2 text-sm font-semibold px-4 py-2 rounded-xl text-white" style={{ background: CS_GREEN }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayProducts.map((product: any) => {
                  const inCart = cart.find(i => i.id === String(product.id));
                  return (
                    <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                      <div className="w-full h-32 bg-gray-50 flex items-center justify-center">
                        <ProductImage src={product.image} name={product.name} category={product.category} />
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-[10px] text-gray-400 mb-0.5 truncate">{product.brand ?? product.category}</p>
                        <p className="text-xs font-semibold text-gray-800 leading-tight mb-1 flex-1 line-clamp-2">{product.name}</p>
                        {product.packaging && <p className="text-[10px] text-gray-400 mb-2">{product.packaging}</p>}
                        <div className="flex items-center justify-between mt-auto">
                          {product.price ? (
                            <div>
                              <span className="text-sm font-bold" style={{ color: CS_GREEN }}>{Number(product.price).toFixed(2)}€</span>
                              {product.pricePerUnit && <p className="text-[9px] text-gray-400 leading-none">{product.pricePerUnit}</p>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">S/P</span>
                          )}
                          <button
                            onClick={() => addToCart(product)}
                            className="w-7 h-7 rounded-full text-white text-sm flex items-center justify-center transition-transform hover:scale-110 shrink-0"
                            style={{ background: inCart ? "#16a34a" : CS_GREEN }}
                          >
                            {inCart ? "✓" : "+"}
                          </button>
                        </div>
                        {inCart && <p className="text-[10px] text-center mt-1 font-semibold" style={{ color: CS_GREEN }}>{inCart.qty} en carrito</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Cart panel ── */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={e => { if (e.target === e.currentTarget) setShowCart(false); }}>
          <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">🛒 Carrito ({totalItems})</h3>
              <button onClick={() => setShowCart(false)} aria-label="Cerrar carrito" className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">El carrito está vacío</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                      <ProductImage src={item.image} name={item.name} category={item.category} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.packaging}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <span className="font-bold" style={{ color: CS_GREEN }}>{((item.price ?? 0) * item.qty).toFixed(2)}€</span>
                      <span className="text-gray-400 text-xs">×{item.qty}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500">🗑</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t space-y-3">
                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total estimado</span>
                  <span className="text-xl font-bold" style={{ color: CS_GREEN }}>{totalPrice.toFixed(2)}€</span>
                </div>

                {/* Informative notice */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2.5">
                  <span className="text-amber-500 text-lg shrink-0 leading-tight">ℹ️</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-800 mb-1">Proceso en dos pasos</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Al pulsar el botón se abrirá <strong>tienda.consum.es</strong> con tu lista.
                      Deberás añadir cada producto al carrito de Consum manualmente, ya que
                      su tienda no permite integraciones automáticas con apps externas.
                    </p>
                  </div>
                </div>

                {/* Export button */}
                <button
                  onClick={handleExportCart}
                  disabled={exportCartMutation.isPending}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm text-center disabled:opacity-60 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                  style={{ background: CS_GREEN }}
                >
                  {exportCartMutation.isPending ? (
                    <><span className="animate-spin inline-block">⏳</span> Generando enlace...</>
                  ) : (
                    <>🛒 Ver productos en Consum.es →</>
                  )}
                </button>
                <p className="text-xs text-gray-400 text-center">
                  Abre una nueva pestaña con {cart.length} producto{cart.length !== 1 ? "s" : ""} de tu lista
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
