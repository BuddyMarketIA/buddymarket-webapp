import React, { useState } from "react";
import { X, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

interface ProductRecommendationCardProps {
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
  onDismiss?: () => void;
  onVisit?: () => void;
}

const sourceConfig = {
  buddyshop: {
    label: "BuddyShop",
    color: "bg-blue-100 text-blue-800",
    icon: "🛒",
  },
  buddycare: {
    label: "BuddyCare",
    color: "bg-green-100 text-green-800",
    icon: "💊",
  },
  buddycoach: {
    label: "BuddyCoach",
    color: "bg-orange-100 text-orange-800",
    icon: "💪",
  },
};

export function ProductRecommendationCard({
  id,
  title,
  description,
  reason,
  source,
  productImage,
  productPrice,
  productUrl,
  relevanceScore,
  cta = "Ver producto",
  onDismiss,
  onVisit,
}: ProductRecommendationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const trackEventMutation = trpc.recommendations.trackEvent.useMutation();

  const handleVisit = () => {
    // Track click event
    trackEventMutation.mutate({
      recommendationId: id,
      eventType: "click",
      context: "recommendation_card",
    });

    // Open product URL
    window.open(productUrl, "_blank");
    onVisit?.();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  const config = sourceConfig[source];
  const relevancePercentage = Math.round(relevanceScore);

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      {productImage && (
        <div className="absolute inset-0 opacity-10">
          <img
            src={productImage}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <Badge className={`${config.color} mb-2 text-xs font-semibold`}>
              {config.icon} {config.label}
            </Badge>
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
              {title}
            </h3>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground/60 transition-colors hover:bg-background hover:text-foreground"
            aria-label="Dismiss recommendation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        {description && (
          <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {/* Reason */}
        <div className="mb-3 flex items-start gap-2">
          <Zap className="mt-0.5 h-3 w-3 flex-shrink-0 text-yellow-500" />
          <p className="line-clamp-2 text-xs text-muted-foreground">{reason}</p>
        </div>

        {/* Price and Score */}
        <div className="mb-3 flex items-center justify-between gap-2">
          {productPrice && (
            <span className="text-sm font-semibold text-foreground">
              ${productPrice}
            </span>
          )}
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
                style={{ width: `${relevancePercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {relevancePercentage}%
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={handleVisit}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
          size="sm"
          disabled={trackEventMutation.isPending}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {cta}
        </Button>
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/5 transition-opacity" />
      )}
    </div>
  );
}
