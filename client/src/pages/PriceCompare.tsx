import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart, TrendingDown, Store, Plus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/sonner-a11y-shim";

const COMMON_INGREDIENTS = [
  "Pollo", "Salmón", "Arroz", "Pasta", "Leche", "Huevos",
  "Tomate", "Cebolla", "Patata", "Aceite de oliva", "Yogur griego",
  "Pan integral", "Brócoli", "Espinacas", "Queso", "Atún",
  "Garbanzos", "Lentejas", "Plátano", "Manzana",
];

export default function PriceCompare() {
  const { user } = useAuth();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");

  const stableIngredients = useMemo(() => ingredients, [ingredients.join(",")]);

  const { data: comparison, isLoading } = trpc.priceCompare.compare.useQuery(
    { ingredients: stableIngredients },
    { enabled: stableIngredients.length > 0 }
  );

  const { data: supermarkets } = trpc.priceCompare.getSupermarkets.useQuery();

  const addIngredient = (name: string) => {
    if (!ingredients.includes(name)) {
      setIngredients(prev => [...prev, name]);
    }
    setSearchText("");
  };

  const removeIngredient = (name: string) => {
    setIngredients(prev => prev.filter(i => i !== name));
  };

  const filteredSuggestions = COMMON_INGREDIENTS.filter(
    i => i.toLowerCase().includes(searchText.toLowerCase()) && !ingredients.includes(i)
  );

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 text-center">
        <ShoppingCart className="w-12 h-12 mx-auto text-purple-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Comparador de Precios</h1>
        <p className="text-muted-foreground">Inicia sesión para comparar precios entre supermercados</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Comparador de Precios</h1>
        <p className="text-muted-foreground mt-1">Encuentra el supermercado más barato para tu lista</p>
      </div>

      {/* Ingredient input */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchText.trim()) {
                  addIngredient(searchText.trim());
                }
              }}
              placeholder="Añadir ingrediente..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Quick add suggestions */}
          {searchText && filteredSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {filteredSuggestions.slice(0, 8).map(item => (
                <button
                  key={item}
                  onClick={() => addIngredient(item)}
                  className="text-xs px-2.5 py-1 rounded-full border border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  <Plus className="w-3 h-3 inline mr-0.5" />
                  {item}
                </button>
              ))}
            </div>
          )}

          {!searchText && ingredients.length === 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Ingredientes populares:</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_INGREDIENTS.slice(0, 12).map(item => (
                  <button
                    key={item}
                    onClick={() => addIngredient(item)}
                    className="text-xs px-2.5 py-1 rounded-full border hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected ingredients */}
          {ingredients.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
              {ingredients.map(item => (
                <span
                  key={item}
                  className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  {item}
                  <button onClick={() => removeIngredient(item)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {comparison && (
        <div className="space-y-4">
          {/* Winner */}
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Más barato para tu lista:</p>
                  <p className="text-xl font-bold capitalize">{comparison.cheapest.supermarket}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold text-green-600">{comparison.cheapest.total}€</p>
                  {comparison.potentialSavings > 0 && (
                    <p className="text-xs text-green-600">Ahorras {comparison.potentialSavings}€</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supermarket totals */}
          <div className="grid grid-cols-2 gap-3">
            {supermarkets?.map(s => (
              <Card key={s.id} className={comparison.cheapest.supermarket === s.id ? "border-green-300" : ""}>
                <CardContent className="p-3 text-center">
                  <span className="text-2xl">{s.logo}</span>
                  <p className="font-medium text-sm mt-1">{s.name}</p>
                  <p className="text-lg font-bold mt-1">
                    {comparison.totals[s.id] ? `${comparison.totals[s.id]}€` : "—"}
                  </p>
                  {comparison.cheapest.supermarket === s.id && (
                    <span className="text-xs text-green-600 font-medium">✓ Más barato</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Detalle por producto</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {Object.entries(comparison.comparison).map(([ingredient, data]: [string, any]) => {
                  const prices = Object.entries(data.prices)
                    .filter(([_, p]) => p !== null)
                    .map(([store, p]: [string, any]) => ({ store, price: p.price }))
                    .sort((a, b) => a.price - b.price);

                  if (prices.length === 0) return null;

                  return (
                    <div key={ingredient} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm font-medium">{ingredient}</span>
                      <div className="flex gap-2">
                        {prices.slice(0, 3).map((p, idx) => (
                          <span
                            key={p.store}
                            className={`text-xs px-2 py-0.5 rounded ${
                              idx === 0 ? "bg-green-100 text-green-700 font-medium" : "text-muted-foreground"
                            }`}
                          >
                            {p.price}€
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {comparison.matchedIngredients}/{comparison.totalIngredients} ingredientes encontrados en la base de precios
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
