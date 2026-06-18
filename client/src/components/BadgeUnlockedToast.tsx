import { useEffect, useRef } from "react";
import { toast } from "@/components/sonner-a11y-shim";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// Rarity config for visual styling
const RARITY_GLOW: Record<string, string> = {
  common: "#6B7280",
  rare: "#3B82F6",
  epic: "#8B5CF6",
  legendary: "#F59E0B",
};

interface BadgeToastProps {
  badge: {
    icon: string;
    nameEs: string;
    descriptionEs: string;
    rarity: string;
    points: number;
  };
}

function BadgeToastContent({ badge }: BadgeToastProps) {
  const [, navigate] = useLocation();
  const glow = RARITY_GLOW[badge.rarity] ?? "#6B7280";
  const rarityLabel = { common: "Común", rare: "Raro", epic: "Épico", legendary: "Legendario" }[badge.rarity] ?? "Común";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "4px 0",
        cursor: "pointer",
      }}
      onClick={() => navigate("/app/badges")}
    >
      {/* Badge icon with glow */}
      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "14px",
          background: `linear-gradient(135deg, ${glow}22, ${glow}44)`,
          border: `2px solid ${glow}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "26px",
          flexShrink: 0,
          boxShadow: `0 0 16px ${glow}55`,
        }}
      >
        {badge.icon}
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: 900, color: "#1a1a1a" }}>
            🏆 ¡Insignia desbloqueada!
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "20px",
              background: `${glow}22`,
              color: glow,
              border: `1px solid ${glow}44`,
            }}
          >
            {rarityLabel}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1a1a", lineHeight: 1.2 }}>
          {badge.icon} {badge.nameEs}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#6B7280", lineHeight: 1.3 }}>
          {badge.descriptionEs}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "11px", fontWeight: 700, color: glow }}>
          +{badge.points} puntos · Toca para ver tus insignias
        </p>
      </div>
    </div>
  );
}

/**
 * Hook that polls for newly awarded badges and shows a toast notification.
 * Should be mounted once at app level (e.g., in AppLayout).
 */
export function useBadgeNotifications() {
  const lastCheckedRef = useRef<number>(Date.now());

  const { data: myBadges } = trpc.badges.getMyBadges.useQuery(undefined, {
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 25000,
  });

  useEffect(() => {
    if (!myBadges) return;
    const now = Date.now();
    // Find badges earned in the last 35 seconds (slightly more than refetch interval)
    const newBadges = myBadges.filter((ub: any) => {
      const earnedAt = new Date(ub.userBadge?.earnedAt ?? ub.earnedAt ?? 0).getTime();
      return earnedAt > lastCheckedRef.current - 35000 && earnedAt > Date.now() - 60000;
    });

    if (newBadges.length > 0) {
      newBadges.forEach((ub: any) => {
        const badge = ub.badge ?? ub;
        toast.custom(
          () => <BadgeToastContent badge={badge} />,
          {
            duration: 6000,
            id: `badge-${badge.slug ?? badge.id}`,
          }
        );
      });
    }
    lastCheckedRef.current = now;
  }, [myBadges]);
}

export default BadgeToastContent;
