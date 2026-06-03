import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ShoppingBag, Leaf, X, ExternalLink, AlertCircle } from "lucide-react";

interface ContextualProductWidgetProps {
  recipeName?: string;
  recipeTags?: string[];
  recipeCategory?: string;
  symptoms?: string[];
  mode?: "shop" | "care" | "both";
  className?: string;
}

export default function ContextualProductWidget({
  recipeName = "",
  recipeTags = [],
  recipeCategory,
  symptoms = [],
  mode = "both",
  className = "",
}: ContextualProductWidgetProps) {
  const [dismissed, setDismissed] = useState(false);
  const [activeType, setActiveType] = useState<"shop" | "care">("shop");

  const { data: shopRecs } = trpc.contextualRecommendations.getForRecipe.useQuery(
    { recipeName, recipeTags, recipeCategory, limit: 2 },
    { enabled: (mode === "shop" || mode === "both") && (!!recipeName || recipeTags.length > 0) }
  );

  const { data: careRecs } = trpc.contextualRecommendations.getForHealthGoal.useQuery(
    { symptoms, goal: undefined },
    { enabled: (mode === "care" || mode === "both") && symptoms.length > 0 }
  );

  if (dismissed) return null;

  const shopProducts = shopRecs?.shopProducts?.slice(0, 2) ?? [];
  const careProducts = (shopRecs?.careProducts?.slice(0, 1) ?? (Array.isArray(careRecs) ? careRecs.slice(0, 2) : []));

  const hasShop = shopProducts.length > 0;
  const hasCare = careProducts.length > 0;

  if (!hasShop && !hasCare) return null;

  const currentProducts = activeType === "shop" ? shopProducts : careProducts;

  return (
    <div className={`rounded-2xl border border-border bg-card overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          {hasShop && hasCare ? (
            <div className="flex gap-1">
              <button
                onClick={() => setActiveType("shop")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-600 transition-colors ${
                  activeType === "shop"
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <ShoppingBag className="w-3 h-3" />
                BuddyShop
              </button>
              <button
                onClick={() => setActiveType("care")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-600 transition-colors ${
                  activeType === "care"
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Leaf className="w-3 h-3" />
                BuddyCare
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {hasShop ? (
                <>
                  <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-700 text-foreground">BuddyShop</span>
                </>
              ) : (
                <>
                  <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-700 text-foreground">BuddyCare</span>
                </>
              )}
              <span className="text-xs text-muted-foreground">— Te puede interesar</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
          aria-label="Cerrar sugerencias"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Products */}
      <div className="px-4 pb-3 flex gap-3 overflow-x-auto">
        {currentProducts.map((product: any) => (
          <a
            key={product.id}
            href={product.affiliateUrl || (activeType === "shop" ? "https://buddyshop.app" : "/app/buddy-care")}
            target={product.affiliateUrl ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-3 bg-muted/50 rounded-xl p-2.5 hover:bg-muted transition-colors min-w-[200px] max-w-[240px]"
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-contain flex-shrink-0 bg-background"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                {activeType === "shop" ? (
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                ) : (
                  <Leaf className="w-5 h-5 text-emerald-400" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-600 text-foreground leading-tight line-clamp-2">{product.name}</p>
              {product.price && (
                <p className="text-xs font-700 text-orange-500 mt-0.5">{product.price}€</p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Ver producto</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Disclaimer for BuddyCare */}
      {(activeType === "care" || (!hasShop && hasCare)) && (
        <div className="px-4 pb-3 flex items-start gap-1.5">
          <AlertCircle className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Consulta siempre con tu médico antes de tomar cualquier suplemento o producto.
          </p>
        </div>
      )}
    </div>
  );
}
