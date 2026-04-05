import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  ScaleIcon,
  ShoppingCartIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { TrophyIcon as TrophySolid, StarIcon } from "@heroicons/react/24/solid";

interface BasketItem {
  name: string;
  qty?: string;
  unit?: string;
}

interface BasketComparatorProps {
  items: BasketItem[];
  onClose: () => void;
}

const SUPERMARKET_URLS: Record<string, string> = {
  Mercadona: "https://tienda.mercadona.es",
  Carrefour: "https://www.carrefour.es/supermercado",
  Alcampo: "https://www.alcampo.es/compra-online",
  Lidl: "https://www.lidl.es",
};

const SUPERMARKET_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; podium: string }> = {
  Mercadona: { bg: "bg-green-50", border: "border-green-400", text: "text-green-700", badge: "bg-green-100 text-green-700", podium: "#00A650" },
  Carrefour: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700", badge: "bg-blue-100 text-blue-700", podium: "#004A96" },
  Alcampo: { bg: "bg-red-50", border: "border-red-400", text: "text-red-700", badge: "bg-red-100 text-red-700", podium: "#E30613" },
  Lidl: { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700", podium: "#0050AA" },
};

const SUPERMARKET_EMOJIS: Record<string, string> = {
  Mercadona: "🟠", Carrefour: "🔵", Alcampo: "🟡", Lidl: "🔴",
};

export default function BasketComparator({ items, onClose }: BasketComparatorProps) {
  const [expandedSupermarket, setExpandedSupermarket] = useState<string | null>(null);

  const filteredItems = items.filter((i) => i.name.trim().length > 1);

  const { data: results, isLoading, error } = trpc.basketComparator.compare.useQuery(
    { items: filteredItems },
    { enabled: filteredItems.length > 0, staleTime: 5 * 60 * 1000 }
  );

  const cheapest = results?.[0];
  const mostExpensive = results?.[results.length - 1];
  const savings = cheapest && mostExpensive ? mostExpensive.total - cheapest.total : 0;
  const savingsPercent = mostExpensive && mostExpensive.total > 0
    ? Math.round((savings / mostExpensive.total) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
            <ScaleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Comparador de precios</h2>
            <p className="text-xs text-gray-500">{filteredItems.length} productos · 4 supermercados</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-500 text-sm font-bold"
        >
          ✕
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingCartIcon className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Buscando los mejores precios...</p>
            <p className="text-xs text-gray-400 mt-1">Consultando Mercadona, Carrefour, Lidl y Alcampo</p>
          </div>
          {/* Skeleton bars */}
          <div className="w-full flex flex-col gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
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
          {savings > 0.5 ? (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-4 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrophySolid className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm leading-tight">
                      Ahorra <span className="text-yellow-200 text-base">{savings.toFixed(2)}€</span>
                      <span className="text-green-200 text-xs ml-1">({savingsPercent}%)</span>
                    </p>
                    <p className="text-xs text-green-100 mt-0.5">
                      Comprando en <strong>{cheapest?.supermarket}</strong> vs <strong>{mostExpensive?.supermarket}</strong>
                    </p>
                  </div>
                </div>
                {cheapest && (
                  <a
                    href={SUPERMARKET_URLS[cheapest.supermarket] ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-xl px-3 py-2 text-xs font-semibold text-white flex-shrink-0"
                  >
                    Ir a comprar
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-blue-700">Los precios son similares en todos los supermercados.</p>
            </div>
          )}

          {/* Podium — top 3 visual */}
          {results.length >= 3 && (
            <div className="flex items-end justify-center gap-2 px-2 pt-2">
              {/* 2nd place */}
              <div className="flex flex-col items-center flex-1">
                <div className="text-xs font-bold text-gray-500 mb-1">2°</div>
                <div
                  className="w-full rounded-t-xl flex flex-col items-center justify-end pb-2 pt-3"
                  style={{ height: 64, backgroundColor: `${SUPERMARKET_COLORS[results[1].supermarket]?.podium ?? "#888"}22`, border: `2px solid ${SUPERMARKET_COLORS[results[1].supermarket]?.podium ?? "#888"}44` }}
                >
                  <span className="text-lg">{SUPERMARKET_EMOJIS[results[1].supermarket] ?? "🏪"}</span>
                  <span className="text-xs font-bold text-gray-700 truncate max-w-full px-1">{results[1].supermarket}</span>
                  <span className="text-xs font-black" style={{ color: SUPERMARKET_COLORS[results[1].supermarket]?.podium ?? "#888" }}>
                    {results[1].total.toFixed(2)}€
                  </span>
                </div>
              </div>
              {/* 1st place */}
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <TrophySolid className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-bold text-yellow-600">1°</span>
                </div>
                <div
                  className="w-full rounded-t-xl flex flex-col items-center justify-end pb-2 pt-4 shadow-md"
                  style={{ height: 80, backgroundColor: `${SUPERMARKET_COLORS[results[0].supermarket]?.podium ?? "#888"}22`, border: `2px solid ${SUPERMARKET_COLORS[results[0].supermarket]?.podium ?? "#888"}` }}
                >
                  <span className="text-xl">{SUPERMARKET_EMOJIS[results[0].supermarket] ?? "🏪"}</span>
                  <span className="text-xs font-bold text-gray-800 truncate max-w-full px-1">{results[0].supermarket}</span>
                  <span className="text-sm font-black" style={{ color: SUPERMARKET_COLORS[results[0].supermarket]?.podium ?? "#888" }}>
                    {results[0].total.toFixed(2)}€
                  </span>
                </div>
              </div>
              {/* 3rd place */}
              <div className="flex flex-col items-center flex-1">
                <div className="text-xs font-bold text-gray-400 mb-1">3°</div>
                <div
                  className="w-full rounded-t-xl flex flex-col items-center justify-end pb-2 pt-2"
                  style={{ height: 52, backgroundColor: `${SUPERMARKET_COLORS[results[2].supermarket]?.podium ?? "#888"}18`, border: `2px solid ${SUPERMARKET_COLORS[results[2].supermarket]?.podium ?? "#888"}33` }}
                >
                  <span className="text-base">{SUPERMARKET_EMOJIS[results[2].supermarket] ?? "🏪"}</span>
                  <span className="text-xs font-bold text-gray-600 truncate max-w-full px-1">{results[2].supermarket}</span>
                  <span className="text-xs font-black" style={{ color: SUPERMARKET_COLORS[results[2].supermarket]?.podium ?? "#888" }}>
                    {results[2].total.toFixed(2)}€
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Supermarket detail cards */}
          <div className="flex flex-col gap-2">
            {results.map((sm, idx) => {
              const colors = SUPERMARKET_COLORS[sm.supermarket] ?? { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700", badge: "bg-gray-100 text-gray-700", podium: "#888" };
              const isWinner = idx === 0;
              const isExpanded = expandedSupermarket === sm.supermarket;
              const coveragePercent = filteredItems.length > 0 ? Math.round((sm.found / filteredItems.length) * 100) : 0;

              return (
                <div
                  key={sm.supermarket}
                  className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${isWinner ? `${colors.border} ${colors.bg}` : "border-gray-200 bg-white"}`}
                >
                  <div className="p-3.5">
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${isWinner ? "bg-yellow-400 text-yellow-900" : "bg-gray-100 text-gray-500"}`}>
                        {isWinner ? <TrophySolid className="w-4 h-4" /> : idx + 1}
                      </div>

                      {/* Name + coverage */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">{sm.supermarket}</span>
                          {isWinner && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                              ✓ Más barato
                            </span>
                          )}
                          {idx === results.length - 1 && results.length > 1 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                              Más caro
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${coveragePercent}%`, backgroundColor: colors.podium }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {sm.found}/{filteredItems.length} productos
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xl font-black ${isWinner ? colors.text : "text-gray-800"}`}>
                          {sm.total.toFixed(2)}€
                        </div>
                        {idx > 0 && cheapest && (
                          <div className="text-xs text-red-400 font-medium">
                            +{(sm.total - cheapest.total).toFixed(2)}€
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedSupermarket(isExpanded ? null : sm.supermarket)}
                    className="w-full px-4 pb-2.5 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? (
                      <>Ocultar productos <ChevronUpIcon className="w-3 h-3" /></>
                    ) : (
                      <>Ver productos <ChevronDownIcon className="w-3 h-3" /></>
                    )}
                  </button>

                  {/* Expanded product list */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {sm.items.map((item) => (
                        <div key={item.ingredient} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <ShoppingCartIcon className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate capitalize">{item.ingredient}</p>
                            {item.found && item.productName && (
                              <p className="text-xs text-gray-400 truncate">{item.productName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.found ? (
                              <>
                                <span className="text-sm font-bold text-gray-900">{item.price.toFixed(2)}€</span>
                                {item.url && (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer"
                                    className="text-gray-300 hover:text-orange-500 transition-colors">
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
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                        <div className="flex items-center gap-1.5">
                          <StarIcon className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-sm font-bold text-gray-700">Total estimado</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-base font-black ${isWinner ? colors.text : "text-gray-900"}`}>
                            {sm.total.toFixed(2)}€
                          </span>
                          <a
                            href={SUPERMARKET_URLS[sm.supermarket] ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                          >
                            Ir a comprar
                            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
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
