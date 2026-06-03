import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { id: "all", label: "Todo", emoji: "🛍️" },
  { id: "bbq", label: "BBQ", emoji: "🔥" },
  { id: "sartenes", label: "Sartenes", emoji: "🍳" },
  { id: "ollas", label: "Ollas", emoji: "🫕" },
  { id: "horno", label: "Horno", emoji: "🥧" },
  { id: "electrodomesticos", label: "Electro", emoji: "⚡" },
  { id: "utensilios", label: "Utensilios", emoji: "🔪" },
  { id: "almacenaje", label: "Almacenaje", emoji: "🫙" },
  { id: "vapor", label: "Vapor", emoji: "♨️" },
  { id: "wok", label: "Wok", emoji: "🥢" },
  { id: "vajilla", label: "Vajilla", emoji: "🍽️" },
  { id: "cuchillos", label: "Cuchillos", emoji: "🗡️" },
  { id: "plancha", label: "Plancha", emoji: "🥩" },
];

export default function BuddyShop() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = trpc.contextualRecommendations.getShopCatalog.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    limit: 50,
  });

  const filtered = (products || []).filter(p =>
    search === "" ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="vively-page pb-32">
      {/* Hero */}
      <div className="rounded-3xl p-6 mb-6 relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-background border border-orange-500/20">
        <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full bg-orange-500/10" />
        <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-orange-500/5" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-orange-500/15">
              🛍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground tracking-tight">BuddyShop</h1>
                <Badge className="bg-orange-500 text-white text-xs">Exclusivo</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">Utensilios y menaje seleccionados por chefs</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Todo lo que necesitas para cocinar mejor. Productos seleccionados por nutricionistas y chefs profesionales, con precios exclusivos para la comunidad BuddyOne.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-orange-500/10 rounded-2xl px-4 py-2.5 border border-orange-500/20">
            <span className="text-base">🎁</span>
            <span>Usa el código <span className="font-black text-orange-500">BUDDY10</span> para un 10% de descuento en tu primera compra</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-2xl bg-card border-border"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-700 whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === cat.id
                ? "bg-orange-500 text-white shadow-sm"
                : "bg-card text-muted-foreground border border-border hover:border-orange-500/50"
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="font-600">No se encontraron productos</p>
          <p className="text-sm mt-1">Prueba con otra búsqueda o categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Features */}
      <div className="mt-6 bg-card rounded-3xl p-5 border border-border/50">
        <h2 className="text-sm font-900 text-foreground mb-3">¿Por qué BuddyShop?</h2>
        <div className="flex flex-col gap-2.5">
          {[
            { emoji: "✅", text: "Seleccionados por nutricionistas y chefs" },
            { emoji: "🚚", text: "Envío rápido a toda España" },
            { emoji: "💰", text: "Precios exclusivos para usuarios BuddyOne" },
            { emoji: "⭐", text: "Valoraciones verificadas de la comunidad" },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg">{f.emoji}</span>
              <p className="text-xs font-600 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: { id: number; name: string; description?: string | null; price?: number | null; imageUrl?: string | null; affiliateUrl?: string | null; category?: string | null } }) {
  const handleBuy = () => {
    if (product.affiliateUrl) {
      window.open(product.affiliateUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border/50 flex flex-col">
      {/* Product image */}
      <div className="relative h-32 bg-muted overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
        )}
        {product.price && (
          <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs font-900 px-2 py-1 rounded-xl shadow-sm">
            {product.price.toFixed(2)}€
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs font-800 text-foreground leading-tight mb-1 line-clamp-2">{product.name}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground leading-tight line-clamp-2 mb-2 flex-1">{product.description}</p>
        )}
        <Button
          onClick={handleBuy}
          size="sm"
          className="w-full rounded-xl text-xs font-700 bg-orange-500 hover:bg-orange-600 text-white mt-auto"
        >
          Ver producto →
        </Button>
      </div>
    </div>
  );
}
