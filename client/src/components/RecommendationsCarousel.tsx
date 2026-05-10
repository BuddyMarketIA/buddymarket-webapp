import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductRecommendationCard } from "./ProductRecommendationCard";
import { trpc } from "@/lib/trpc";

interface Recommendation {
  id: number;
  title: string;
  description?: string;
  reason: string;
  source: "buddyshop" | "buddycare" | "buddycoach";
  productImage?: string;
  productPrice?: string;
  productUrl: string;
  relevanceScore: number;
  cta?: string;
}

interface RecommendationsCarouselProps {
  autoRotate?: boolean;
  rotationInterval?: number;
  maxVisible?: number;
}

export function RecommendationsCarousel({
  autoRotate = true,
  rotationInterval = 5000,
  maxVisible = 3,
}: RecommendationsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isAutoRotating, setIsAutoRotating] = useState(autoRotate);

  // Fetch recommendations
  const { data: recsData, isLoading } = trpc.recommendations.getForUser.useQuery(
    { limit: 10 }
  );

  // Update recommendations when data arrives
  useEffect(() => {
    if (recsData?.data) {
      setRecommendations(
        recsData.data.map((rec: any) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          reason: rec.reason,
          source: rec.source,
          productImage: rec.productImage,
          productPrice: rec.productPrice,
          productUrl: rec.productUrl,
          relevanceScore: rec.relevanceScore,
          cta: rec.cta,
        }))
      );
    }
  }, [recsData]);

  // Auto-rotate carousel
  useEffect(() => {
    if (!isAutoRotating || recommendations.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [isAutoRotating, recommendations.length, rotationInterval]);

  const handlePrevious = useCallback(() => {
    setIsAutoRotating(false);
    setCurrentIndex((prev) =>
      prev === 0 ? recommendations.length - 1 : prev - 1
    );
  }, [recommendations.length]);

  const handleNext = useCallback(() => {
    setIsAutoRotating(false);
    setCurrentIndex((prev) => (prev + 1) % recommendations.length);
  }, [recommendations.length]);

  const handleDismiss = useCallback(() => {
    // Remove current recommendation
    const newRecs = recommendations.filter((_, i) => i !== currentIndex);
    setRecommendations(newRecs);

    // Adjust index if needed
    if (currentIndex >= newRecs.length && newRecs.length > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex, recommendations]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  // Get visible recommendations
  const visibleRecs = [];
  for (let i = 0; i < Math.min(maxVisible, recommendations.length); i++) {
    const index = (currentIndex + i) % recommendations.length;
    visibleRecs.push(recommendations[index]);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recomendaciones para ti</h3>
          <p className="text-sm text-muted-foreground">
            Productos personalizados según tu perfil
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={recommendations.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={recommendations.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {visibleRecs.map((rec) => (
          <ProductRecommendationCard
            key={rec.id}
            {...rec}
            onDismiss={handleDismiss}
          />
        ))}
      </div>

      {/* Pagination Dots */}
      {recommendations.length > 1 && (
        <div className="flex justify-center gap-2">
          {recommendations.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoRotating(false);
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-orange-500 w-6"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to recommendation ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-center text-muted-foreground">
        {currentIndex + 1} de {recommendations.length} recomendaciones
        {isAutoRotating && " • Auto-rotando"}
      </p>
    </div>
  );
}
