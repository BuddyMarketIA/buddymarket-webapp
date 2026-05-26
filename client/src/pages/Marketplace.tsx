import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Store, Star, ShoppingBag, Filter, Crown, ChefHat, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/sonner-a11y-shim";

const CATEGORIES = [
  { id: "all", label: "Todos", icon: "🍽️" },
  { id: "weight_loss", label: "Pérdida de peso", icon: "⚖️" },
  { id: "muscle_gain", label: "Ganar músculo", icon: "💪" },
  { id: "vegan", label: "Vegano", icon: "🌱" },
  { id: "family", label: "Familiar", icon: "👨‍👩‍👧" },
  { id: "sports", label: "Deportistas", icon: "🏃" },
  { id: "medical", label: "Patologías", icon: "🏥" },
];

export default function Marketplace() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: listings, isLoading } = trpc.marketplace.getListings.useQuery(
    { category: selectedCategory === "all" ? undefined : selectedCategory },
    { enabled: !!user }
  );

  const purchaseMutation = trpc.marketplace.purchase.useMutation({
    onSuccess: () => {
      toast.success("¡Menú adquirido! Lo encontrarás en tus menús guardados.");
    },
    onError: (err) => {
      toast.error(err.message || "Error al adquirir el menú");
    },
  });

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 text-center">
        <Store className="w-12 h-12 mx-auto text-purple-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Marketplace</h1>
        <p className="text-muted-foreground">Inicia sesión para explorar menús de expertos</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Marketplace de Menús</h1>
        <p className="text-muted-foreground mt-1">Menús diseñados por nutricionistas certificados</p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? "bg-purple-500 text-white"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-32" />
            </Card>
          ))}
        </div>
      ) : listings && listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((listing: any) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                    <ChefHat className="w-8 h-8 text-purple-500" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          por {listing.expertName}
                          {listing.verified && <Crown className="w-3 h-3 inline ml-1 text-yellow-500" />}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {listing.price === 0 ? "Gratis" : `${listing.price}€`}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{listing.description}</p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {listing.rating || "4.8"}
                        </span>
                        <span>•</span>
                        <span>{listing.days || 7} días</span>
                        <span>•</span>
                        <span>{listing.purchases || 0} compras</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-purple-300 text-purple-600 hover:bg-purple-50"
                        onClick={() => purchaseMutation.mutate({ listingId: listing.id })}
                        disabled={purchaseMutation.isPending}
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        {listing.price === 0 ? "Obtener" : "Comprar"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-3 pt-3 border-t">
                    {listing.tags.slice(0, 4).map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Store className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay menús disponibles en esta categoría</p>
          <p className="text-xs text-muted-foreground mt-1">Los expertos están preparando nuevos menús</p>
        </div>
      )}
    </div>
  );
}
