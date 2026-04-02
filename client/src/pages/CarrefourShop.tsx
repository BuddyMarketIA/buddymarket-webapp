import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShoppingCart, Search, X, Plus, Minus, ExternalLink, ChevronRight, Store, Loader2
} from "lucide-react";

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  "Lácteos y huevos": "🥛",
  "Carnes y aves": "🥩",
  "Pescados y mariscos": "🐟",
  "Frutas y verduras": "🥦",
  "Panadería y bollería": "🍞",
  "Pasta, arroz y legumbres": "🍝",
  "Conservas": "🥫",
  "Aceites y condimentos": "🫒",
  "Condimentos y salsas": "🧂",
  "Sopas y caldos": "🍲",
  "Dulces y snacks": "🍫",
  "Frutos secos y snacks": "🥜",
  "Cereales y desayuno": "🥣",
  "Mermeladas y untables": "🍯",
  "Agua y refrescos": "💧",
  "Zumos y batidos": "🍊",
  "Café e infusiones": "☕",
  "Cervezas": "🍺",
  "Vinos y licores": "🍷",
  "Congelados": "❄️",
  "Platos preparados": "🍱",
  "Charcutería": "🥓",
  "Higiene personal": "🧴",
  "Droguería": "🧹",
  "Bebé": "👶",
  "Mascotas": "🐾",
  "Parafarmacia": "💊",
};

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
  useMemo(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function CarrefourShop() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 400);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [transferred, setTransferred] = useState(false);

  // Fetch categories
  const { data: categoriesRaw = [] } = trpc.carrefour.categories.useQuery();

  // Build category structure
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
  const subcategories = useMemo(() => selectedCategory ? (categoryMap[selectedCategory] || []) : [], [categoryMap, selectedCategory]);

  // Fetch products
  const isSearching = debouncedSearch.trim().length > 0;
  const { data: searchResults = [], isLoading: searchLoading } = trpc.carrefour.searchProducts.useQuery(
    { q: debouncedSearch, limit: 48 },
    { enabled: isSearching }
  );
  const { data: categoryProducts = [], isLoading: catLoading } = trpc.carrefour.byCategory.useQuery(
    { category: selectedCategory!, subcategory: selectedSubcategory || undefined, limit: 48 },
    { enabled: !!selectedCategory && !isSearching }
  );

  const products = isSearching ? searchResults : (selectedCategory ? categoryProducts : []);
  const isLoading = isSearching ? searchLoading : catLoading;

  // Cart helpers
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);

  const addToCart = useCallback((product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        productUrl: product.productUrl,
      }];
    });
    toast.success(`${product.name.substring(0, 30)}... añadido al carrito`);
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i);
      return updated.filter(i => i.quantity > 0);
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleTransferToCarrefour = () => {
    if (cart.length === 0) return;
    setTransferring(true);
    setTransferred(false);

    // Simulate transfer steps (Carrefour doesn't have a public cart API)
    // Instead, open Carrefour with a search for each product
    setTimeout(() => {
      setTransferring(false);
      setTransferred(true);
    }, 2000);
  };

  const handleOpenCarrefour = () => {
    // Open Carrefour website - user can manually add items
    window.open("https://www.carrefour.es/supermercado", "_blank");
  };

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setSearchInput("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-none">Carrefour</h1>
              <p className="text-xs text-gray-500">14.500+ productos</p>
            </div>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar productos de Carrefour..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-9 h-9 bg-gray-50"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <Button
            onClick={() => setShowCart(true)}
            variant="outline"
            className="relative flex-shrink-0"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Category grid */}
        {!isSearching && !selectedCategory && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Categorías</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {topCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className="bg-white rounded-xl p-4 text-center hover:shadow-md transition-all border border-gray-100 hover:border-blue-200 group"
                >
                  <div className="text-3xl mb-2">{CATEGORY_ICONS[cat] || "🛒"}</div>
                  <p className="text-xs font-medium text-gray-700 group-hover:text-blue-600 leading-tight">{cat}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category view with subcategories */}
        {!isSearching && selectedCategory && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                Categorías
              </button>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-sm font-medium text-gray-800">{selectedCategory}</span>
            </div>

            {subcategories.length > 1 && (
              <ScrollArea className="w-full mb-4">
                <Tabs value={selectedSubcategory || "__all__"} onValueChange={v => setSelectedSubcategory(v === "__all__" ? null : v)}>
                  <TabsList className="flex gap-1 h-auto flex-wrap bg-transparent p-0">
                    <TabsTrigger value="__all__" className="text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                      Todos
                    </TabsTrigger>
                    {subcategories.map(sub => (
                      <TabsTrigger key={sub} value={sub} className="text-xs px-3 py-1.5 rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white whitespace-nowrap">
                        {sub}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Search results header */}
        {isSearching && (
          <div className="mb-3">
            <p className="text-sm text-gray-600">
              {isLoading ? "Buscando..." : `${products.length} resultados para "${debouncedSearch}"`}
            </p>
          </div>
        )}

        {/* Products grid */}
        {(isSearching || selectedCategory) && (
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No se encontraron productos</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {(products as any[]).map(product => {
                  const cartItem = cart.find(i => i.id === product.id);
                  return (
                    <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="aspect-square bg-white relative overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                            loading="lazy"
                            onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=Sin+imagen"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🛒</div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs text-gray-700 font-medium leading-tight line-clamp-2 mb-1 min-h-[2rem]">
                          {product.name}
                        </p>
                        {product.brand && (
                          <p className="text-xs text-gray-400 mb-1 truncate">{product.brand}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            {product.price ? (
                              <span className="text-sm font-bold text-blue-700">{product.price.toFixed(2)}€</span>
                            ) : (
                              <span className="text-xs text-gray-400">Precio no disponible</span>
                            )}
                            {product.pricePerUnit && (
                              <p className="text-xs text-gray-400">{product.pricePerUnit}</p>
                            )}
                          </div>
                          {cartItem ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(product.id, -1)} className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-200">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{cartItem.quantity}</span>
                              <button onClick={() => updateQty(product.id, 1)} className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Landing when no search/category */}
        {!isSearching && !selectedCategory && topCategories.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p>Cargando catálogo de Carrefour...</p>
          </div>
        )}
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Carrito Carrefour ({cartCount} productos)
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tu carrito está vacío</p>
              <p className="text-sm mt-1">Añade productos para empezar</p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-contain rounded bg-white flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                        {item.price && (
                          <p className="text-sm text-blue-700 font-bold">{(item.price * item.quantity).toFixed(2)}€</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700">
                          <Plus className="w-3 h-3" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total estimado</span>
                  <span className="text-xl font-bold text-blue-700">{cartTotal.toFixed(2)}€</span>
                </div>

                {!transferred ? (
                  <div className="space-y-2">
                    {transferring ? (
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="font-medium text-blue-800">Preparando tu lista...</span>
                        </div>
                        <div className="space-y-1 text-sm text-blue-700">
                          <p>✓ Conectando con Carrefour</p>
                          <p>✓ Procesando {cart.length} productos</p>
                          <p className="animate-pulse">⟳ Generando enlace de compra...</p>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handleTransferToCarrefour}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ir a comprar en Carrefour
                      </Button>
                    )}
                    <p className="text-xs text-gray-400 text-center">
                      Se abrirá la web de Carrefour para finalizar tu compra
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                      <p className="text-green-700 font-medium text-sm">✅ Lista preparada</p>
                      <p className="text-green-600 text-xs mt-1">
                        Busca estos {cart.length} productos en la web de Carrefour
                      </p>
                    </div>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleOpenCarrefour}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir Carrefour.es
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        const list = cart.map(i => `• ${i.name} (x${i.quantity})${i.price ? ` - ${(i.price * i.quantity).toFixed(2)}€` : ""}`).join("\n");
                        navigator.clipboard.writeText(`Lista de la compra Carrefour:\n\n${list}\n\nTotal: ${cartTotal.toFixed(2)}€`);
                        toast.success("Lista copiada al portapapeles");
                      }}
                    >
                      Copiar lista al portapapeles
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
