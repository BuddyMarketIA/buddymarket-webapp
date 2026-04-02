import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

type AchievementCategory = "racha" | "cantidad" | "variedad" | "nutricion" | "explorador";

const CATEGORY_LABELS: Record<AchievementCategory, { label: string; emoji: string; color: string }> = {
  racha:      { label: "Racha",      emoji: "🔥", color: "#f97316" },
  cantidad:   { label: "Cantidad",   emoji: "📊", color: "#3b82f6" },
  variedad:   { label: "Variedad",   emoji: "🌈", color: "#8b5cf6" },
  nutricion:  { label: "Nutrición",  emoji: "⚖️", color: "#22c55e" },
  explorador: { label: "Explorador", emoji: "🔍", color: "#f59e0b" },
};

const ALL_CATEGORIES: AchievementCategory[] = ["racha", "cantidad", "variedad", "nutricion", "explorador"];

export default function Achievements() {
  const { data, isLoading } = trpc.achievements.getAll.useQuery();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all");
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  // Show unlock animation for recently unlocked achievements (within last 5 minutes)
  useEffect(() => {
    if (!data) return;
    const recent = data.achievements.find((a) => {
      if (!a.unlocked || !a.unlockedAt) return false;
      const diff = Date.now() - new Date(a.unlockedAt).getTime();
      return diff < 5 * 60 * 1000;
    });
    if (recent) setJustUnlocked(recent.id);
  }, [data]);

  const filtered = data?.achievements.filter((a) =>
    activeCategory === "all" ? true : a.category === activeCategory
  ) ?? [];

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <p style={{ color: "#9ca3af" }}>Cargando logros...</p>
        </div>
      </div>
    );
  }

  const level = data?.level;
  const nextLevel = data?.nextLevel;
  const totalPoints = data?.totalPoints ?? 0;
  const progressToNext = nextLevel
    ? Math.round(((totalPoints - (level?.minPoints ?? 0)) / (nextLevel.minPoints - (level?.minPoints ?? 0))) * 100)
    : 100;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1f2937", margin: 0 }}>
          🏆 Mis Logros
        </h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>
          Consigue logros registrando tus comidas de forma constante
        </p>
      </div>

      {/* Level & Points Card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          borderRadius: 20,
          padding: "24px 28px",
          marginBottom: 24,
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <div style={{ position: "absolute", top: -30, right: -30, fontSize: 120, opacity: 0.08 }}>
          {level?.emoji ?? "🌱"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Level badge */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              flexShrink: 0,
              border: "3px solid rgba(255,255,255,0.3)",
            }}
          >
            {level?.emoji ?? "🌱"}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>Nivel {level?.level ?? 1}</span>
              <span style={{ fontSize: 16, opacity: 0.8 }}>{level?.title ?? "Principiante"}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>
              {totalPoints.toLocaleString()} pts
            </div>

            {/* Progress bar */}
            {nextLevel && (
              <>
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 8, marginBottom: 6 }}>
                  <div
                    style={{
                      background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                      width: `${progressToNext}%`,
                      height: "100%",
                      borderRadius: 99,
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
                <p style={{ fontSize: 12, opacity: 0.75, margin: 0 }}>
                  {nextLevel.minPoints - totalPoints} pts para Nivel {nextLevel.level} {nextLevel.emoji} {nextLevel.title}
                </p>
              </>
            )}
            {!nextLevel && (
              <p style={{ fontSize: 13, opacity: 0.8, margin: 0 }}>🎉 ¡Has alcanzado el nivel máximo!</p>
            )}
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{data?.unlockedCount ?? 0}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Desbloqueados</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{data?.totalCount ?? 0}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Total</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {data?.totalCount ? Math.round(((data.unlockedCount ?? 0) / data.totalCount) * 100) : 0}%
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Completado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          onClick={() => setActiveCategory("all")}
          style={{
            padding: "8px 16px",
            borderRadius: 99,
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
            background: activeCategory === "all" ? "#1e1b4b" : "#f3f4f6",
            color: activeCategory === "all" ? "white" : "#374151",
            transition: "all 0.2s",
          }}
        >
          Todos ({data?.achievements.length ?? 0})
        </button>
        {ALL_CATEGORIES.map((cat) => {
          const info = CATEGORY_LABELS[cat];
          const count = data?.achievements.filter((a) => a.category === cat).length ?? 0;
          const unlockedInCat = data?.achievements.filter((a) => a.category === cat && a.unlocked).length ?? 0;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                background: activeCategory === cat ? info.color : "#f3f4f6",
                color: activeCategory === cat ? "white" : "#374151",
                transition: "all 0.2s",
              }}
            >
              {info.emoji} {info.label} ({unlockedInCat}/{count})
            </button>
          );
        })}
      </div>

      {/* Achievement Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((achievement) => {
          const catInfo = CATEGORY_LABELS[achievement.category as AchievementCategory];
          const isNew = justUnlocked === achievement.id;
          return (
            <div
              key={achievement.id}
              style={{
                background: achievement.unlocked ? "white" : "#f9fafb",
                border: achievement.unlocked
                  ? `2px solid ${catInfo.color}30`
                  : "2px solid #e5e7eb",
                borderRadius: 16,
                padding: "20px",
                position: "relative",
                overflow: "hidden",
                opacity: achievement.unlocked ? 1 : 0.65,
                transition: "all 0.3s",
                boxShadow: achievement.unlocked ? "0 4px 12px rgba(0,0,0,0.06)" : "none",
                animation: isNew ? "pulse 0.6s ease-in-out 3" : "none",
              }}
            >
              {/* Unlocked glow */}
              {achievement.unlocked && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${catInfo.color}, ${catInfo.color}80)`,
                    borderRadius: "16px 16px 0 0",
                  }}
                />
              )}

              {/* NEW badge */}
              {isNew && (
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "#f97316",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 99,
                    letterSpacing: 1,
                  }}
                >
                  ¡NUEVO!
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Emoji badge */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: achievement.unlocked ? `${catInfo.color}20` : "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    flexShrink: 0,
                    filter: achievement.unlocked ? "none" : "grayscale(100%)",
                  }}
                >
                  {achievement.unlocked ? achievement.emoji : "🔒"}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: achievement.unlocked ? "#1f2937" : "#9ca3af", marginBottom: 4 }}>
                    {achievement.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4, marginBottom: 8 }}>
                    {achievement.description}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: achievement.unlocked ? catInfo.color : "#9ca3af",
                        background: achievement.unlocked ? `${catInfo.color}15` : "#f3f4f6",
                        padding: "2px 8px",
                        borderRadius: 99,
                      }}
                    >
                      +{achievement.points} pts
                    </span>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span style={{ fontSize: 10, color: "#9ca3af" }}>
                        {new Date(achievement.unlockedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p>No hay logros en esta categoría</p>
        </div>
      )}

      {/* CTA to log meals */}
      <div
        style={{
          marginTop: 32,
          background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
          border: "1.5px solid #fed7aa",
          borderRadius: 16,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <p style={{ fontWeight: 700, color: "#92400e", margin: "0 0 4px", fontSize: 15 }}>
            🍽️ ¡Registra tus comidas para desbloquear logros!
          </p>
          <p style={{ color: "#b45309", margin: 0, fontSize: 13 }}>
            Cada comida registrada te acerca a nuevos logros y puntos de experiencia.
          </p>
        </div>
        <Link href="/meal-log">
          <button
            style={{
              background: "#f97316",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14,
              whiteSpace: "nowrap",
            }}
          >
            Abrir Diario →
          </button>
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
          50% { transform: scale(1.02); box-shadow: 0 8px 24px rgba(249,115,22,0.3); }
        }
      `}</style>
    </div>
  );
}
