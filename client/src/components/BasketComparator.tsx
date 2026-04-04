import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ScaleIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { TrophyIcon as TrophySolid } from "@heroicons/react/24/solid";

interface BasketItem {
  name: string;
  qty?: string;
  unit?: string;
}

interface BasketComparatorProps {
  items: BasketItem[];
  onClose: () => void;
}

export default function BasketComparator({ items, onClose }: BasketComparatorProps) {
  const [expandedSupermarket, setExpandedSupermarket] = useState<string | null>(null);

  const filteredItems = items.filter((i) => !i.name.match(/^\s*$/) && i.name.length > 1);

  const { data: results, isLoading, error } = trpc.basketComparator.compare.useQuery(
    { items: filteredItems },
    { enabled: filteredItems.length > 0, staleTime: 5 * 60 * 1000 }
  );

  const cheapest = results?.[0];
  const mostExpensive = results?.[results.length - 1];
  const savings = cheapest && mostExpensive ? mostExpensive.total - cheapest.total : 0;

  const supermarketLogos: Record<string, string> = {
    Mercadona: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Mercadona_logo.svg/200px-Mercadona_logo.svg.png",
    Carrefour: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/200px-Carrefour_logo.svg.png",
    Alcampo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Alcampo_logo.svg/200px-Alcampo_logo.svg.png",
    Lidl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/200px-Lidl-Logo.svg.png",
  };

  const supermarketColors: Record<string, { bg: string; border: string; text: string }> = {
    Mercadona: { bg: "bg-green-50", border: "border-green-400", text: "text-green-700" },
    Carrefour: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700" },
    Alcampo: { bg: "bg-red-50", border: "border-red-400", text: "text-red-700" },
    Lidl: { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-700" },
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
            <ScaleIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Comparador de precios</h2>
            <p className="text-xs text-gray-500">{filteredItems.length} productos · 4 supermercados</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500 font-bold text-sm"
        >
          ✕
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 border-3 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Buscando precios en los 4 supermercados...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
          <p className="text-sm text-red-600">No se pudo obtener la comparación. Inténtalo de nuevo.</p>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <>
          {/* Savings banner */}
          {savings > 0.5 && (
            <div className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <TrophySolid className="w-5 h-5 text-yellow-300" />
                <span className="font-bold text-sm">¡Puedes ahorrar {savings.toFixed(2)}€!</span>
              </div>
              <p className="text-xs text-green-100">
                Comprando en <strong>{cheapest?.supermarket}</strong> en lugar de <strong>{mostExpensive?.supermarket}</strong>
              </p>
            </div>
          )}

          {/* Supermarket cards */}
          <div className="flex flex-col gap-3">
            {results.map((sm, idx) => {
              const colors = supermarketColors[sm.supermarket] ?? { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" };
              const isWinner = idx === 0;
              const isExpanded = expandedSupermarket === sm.supermarket;
              const coveragePercent = filteredItems.length > 0 ? Math.round((sm.found / filteredItems.length) * 100) : 0;

              return (
                <div
                  key={sm.supermarket}
                  className={`rounded-2xl border-2 overflow-hidden transition-all ${isWinner ? `${colors.border} ${colors.bg}` : "border-gray-200 bg-white"}`}
                >
                  {/* Card header */}
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Rank badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isWinner ? "bg-yellow-400 text-yellow-900" : "bg-gray-100 text-gray-500"}`}>
                        {isWinner ? <TrophySolid className="w-4 h-4" /> : idx + 1}
                      </div>

                      {/* Logo / name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{sm.emoji}</span>
                          <span className="font-bold text-gray-900 text-sm">{sm.supermarket}</span>
                          {isWinner && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                              Más barato
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">
                            <span className="text-green-600 font-semibold">{sm.found}</span>/{filteredItems.length} encontrados
                          </span>
                          {sm.notFound > 0 && (
                            <span className="text-xs text-orange-500">{sm.notFound} no disponibles</span>
                          )}
                        </div>
                        {/* Coverage bar */}
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-400 rounded-full transition-all"
                            style={{ width: `${coveragePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Total price */}
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xl font-black ${isWinner ? colors.text : "text-gray-900"}`}>
                          {sm.total.toFixed(2)}€
                        </div>
                        {idx > 0 && cheapest && (
                          <div className="text-xs text-red-500 font-medium">
                            +{(sm.total - cheapest.total).toFixed(2)}€
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedSupermarket(isExpanded ? null : sm.supermarket)}
                    className="w-full px-4 pb-3 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? (
                      <>Ocultar detalle <ChevronUpIcon className="w-3 h-3" /></>
                    ) : (
                      <>Ver detalle por producto <ChevronDownIcon className="w-3 h-3" /></>
                    )}
                  </button>

                  {/* Expanded product list */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {sm.items.map((item) => (
                        <div key={item.ingredient} className="flex items-center gap-3 px-4 py-2.5">
                          {/* Product thumbnail */}
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <ShoppingCartIcon className="w-4 h-4 text-gray-400 m-auto mt-2.5" />
                            )}
                          </div>

                          {/* Ingredient name & product match */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate capitalize">{item.ingredient}</p>
                            {item.found && item.productName && (
                              <p className="text-xs text-gray-400 truncate">{item.productName}</p>
                            )}
                          </div>

                          {/* Status / price */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.found ? (
                              <>
                                <span className="text-sm font-bold text-gray-900">{item.price.toFixed(2)}€</span>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-orange-500 transition-colors"
                                  >
                                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No disponible</span>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Total row */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <span className="text-sm font-bold text-gray-700">Total estimado</span>
                        <span className={`text-base font-black ${isWinner ? colors.text : "text-gray-900"}`}>
                          {sm.total.toFixed(2)}€
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            * Precios orientativos basados en nuestro catálogo. Pueden variar según zona y fecha.
            Los productos no encontrados no se incluyen en el total.
          </p>
        </>
      )}

      {/* Empty items */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ShoppingCartIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay productos en la lista para comparar.</p>
        </div>
      )}
    </div>
  );
}
