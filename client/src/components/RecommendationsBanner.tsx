import React, { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface RecommendationsBannerProps {
  rotationInterval?: number;
  position?: "top" | "bottom";
}

const sourceConfig = {
  buddyshop: {
    label: "BuddyShop",
    color: "bg-blue-500",
    icon: "🛒",
  },
  buddycare: {
    label: "BuddyCare",
    color: "bg-green-500",
    icon: "💊",
  },
  buddycoach: {
    label: "BuddyCoach",
    color: "bg-orange-500",
    icon: "💪",
  },
};

export function RecommendationsBanner({
  rotationInterval = 8000,
  position = "top",
}: RecommendationsBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const trackEventMutation = trpc.recommendations.trackEvent.useMutation();

  // Fetch recommendations
  const { data: recsData, isLoading } = trpc.recommendations.getForUser.useQuery(
    { limit: 5 }
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

  // Auto-rotate banner
  useEffect(() => {
    if (!isVisible || recommendations.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recommendations.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [isVisible, recommendations.length, rotationInterval]);

  const handleVisit = () => {
    if (recommendations.length === 0) return;

    const current = recommendations[currentIndex];

    // Track click event
    trackEventMutation.mutate({
      recommendationId: current.id,
      eventType: "click",
      context: "banner",
    });

    // Open product URL
    window.open(current.productUrl, "_blank");
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || recommendations.length === 0 || isLoading) {
    return null;
  }

  const current = recommendations[currentIndex];
  const config = sourceConfig[current.source];

  return (
    <div
      className={`fixed left-0 right-0 z-40 ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500" />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Badge and Content */}
            <div className="flex flex-1 items-center gap-3 min-w-0">
              <Badge className={`${config.color} text-white flex-shrink-0`}>
                {config.icon} {config.label}
              </Badge>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {current.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {current.reason}
                </p>
              </div>
            </div>

            {/* Right: Price and CTA */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {current.productPrice && (
                <span className="text-sm font-bold text-orange-600">
                  ${current.productPrice}
                </span>
              )}

              <Button
                onClick={handleVisit}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
              >
                {current.cta || "Ver"}
                <ChevronRight className="h-4 w-4" />
              </Button>

              <button
                onClick={handleClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-orange-100 hover:text-foreground transition-colors"
                aria-label="Close banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-0.5 w-full bg-orange-200">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{
                width: `${((currentIndex + 1) / recommendations.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
