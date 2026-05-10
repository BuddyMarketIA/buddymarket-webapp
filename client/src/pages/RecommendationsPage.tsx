import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ExternalLink, Trash2 } from "lucide-react";

interface RecommendationItem {
  id: number;
  externalProductId: string;
  source: "buddyshop" | "buddycare" | "buddycoach";
  title: string;
  description?: string;
  reason: string;
  productImage?: string;
  productPrice?: string;
  productUrl: string;
  relevanceScore: number;
  trigger?: string;
  expiresAt?: string;
  createdAt: string;
}

export function RecommendationsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "buddyshop" | "buddycare" | "buddycoach">("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "relevance">("recent");
  const [page, setPage] = useState(0);
  const limit = 12;

  const { data: historyData, isLoading, refetch } = trpc.recommendations.getHistory.useQuery({
    limit,
    offset: page * limit,
    source: sourceFilter,
    sortBy,
  });

  const recommendations = historyData?.data || [];
  const total = historyData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const filteredRecommendations = recommendations.filter((rec: RecommendationItem) =>
    rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSourceColor = (source: string) => {
    switch (source) {
      case "buddyshop":
        return "bg-blue-100 text-blue-800";
      case "buddycare":
        return "bg-green-100 text-green-800";
      case "buddycoach":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "buddyshop":
        return "BuddyShop";
      case "buddycare":
        return "BuddyCare";
      case "buddycoach":
        return "BuddyCoach";
      default:
        return source;
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Mis Recomendaciones
          </h1>
          <p className="text-slate-600">
            Historial completo de productos sugeridos basados en tu perfil nutricional
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>

            {/* Source Filter */}
            <Select value={sourceFilter} onValueChange={(value: any) => {
              setSourceFilter(value);
              setPage(0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                <SelectItem value="buddyshop">BuddyShop</SelectItem>
                <SelectItem value="buddycare">BuddyCare</SelectItem>
                <SelectItem value="buddycoach">BuddyCoach</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: any) => {
              setSortBy(value);
              setPage(0);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguas</SelectItem>
                <SelectItem value="relevance">Más relevantes</SelectItem>
              </SelectContent>
            </Select>

            {/* Results count */}
            <div className="flex items-center justify-end text-sm text-slate-600">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>{filteredRecommendations.length} de {total} resultados</span>
              )}
            </div>
          </div>
        </div>

        {/* Grid de Recomendaciones */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">
              No hay recomendaciones que coincidan con tu búsqueda
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredRecommendations.map((rec: RecommendationItem) => (
                <Card
                  key={rec.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Product Image */}
                  {rec.productImage && (
                    <div className="h-40 bg-slate-100 overflow-hidden">
                      <img
                        src={rec.productImage}
                        alt={rec.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4">
                    {/* Source Badge */}
                    <div className="mb-3">
                      <Badge className={getSourceColor(rec.source)}>
                        {getSourceLabel(rec.source)}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                      {rec.title}
                    </h3>

                    {/* Reason */}
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {rec.reason}
                    </p>

                    {/* Relevance Score */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500">Relevancia</span>
                        <span className={`text-sm font-semibold ${getRelevanceColor(rec.relevanceScore)}`}>
                          {rec.relevanceScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            rec.relevanceScore >= 90
                              ? "bg-green-500"
                              : rec.relevanceScore >= 75
                              ? "bg-yellow-500"
                              : "bg-orange-500"
                          }`}
                          style={{ width: `${rec.relevanceScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Price */}
                    {rec.productPrice && (
                      <div className="text-lg font-bold text-slate-900 mb-3">
                        {rec.productPrice}
                      </div>
                    )}

                    {/* Trigger */}
                    {rec.trigger && (
                      <div className="mb-3">
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {rec.trigger}
                        </span>
                      </div>
                    )}

                    {/* Date */}
                    <div className="text-xs text-slate-500 mb-4">
                      {new Date(rec.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(rec.productUrl, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Producto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implementar dismiss
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={page === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(i)}
                      className="w-10"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page === totalPages - 1}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </>
        )}

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-2">Total de Recomendaciones</div>
            <div className="text-3xl font-bold text-slate-900">{total}</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-2">Fuente Más Frecuente</div>
            <div className="text-2xl font-bold text-slate-900">
              {sourceFilter === "all" ? "Todas" : getSourceLabel(sourceFilter)}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-2">Relevancia Promedio</div>
            <div className="text-3xl font-bold text-slate-900">
              {filteredRecommendations.length > 0
                ? Math.round(
                    filteredRecommendations.reduce((sum: number, rec: RecommendationItem) => sum + rec.relevanceScore, 0) /
                      filteredRecommendations.length
                  )
                : 0}
              %
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
