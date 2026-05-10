import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Star, Lock, Medal, Users, Sparkles } from "lucide-react";

const RARITY_CONFIG = {
  common: { label: "Común", color: "bg-muted/50 text-foreground/80 border-border", glow: "" },
  rare: { label: "Raro", color: "bg-blue-100 text-blue-700 border-blue-200", glow: "shadow-blue-100" },
  epic: { label: "Épico", color: "bg-purple-100 text-purple-700 border-purple-200", glow: "shadow-purple-100" },
  legendary: { label: "Legendario", color: "bg-amber-100 text-amber-700 border-amber-200", glow: "shadow-amber-200" },
};

const CATEGORY_CONFIG = {
  ai_adaptation: { label: "Adaptación IA", icon: "🤖", color: "text-violet-600" },
  community: { label: "Comunidad", icon: "🤝", color: "text-green-600" },
  consistency: { label: "Constancia", icon: "🔥", color: "text-orange-600" },
  nutrition: { label: "Nutrición", icon: "🥗", color: "text-emerald-600" },
  explorer: { label: "Explorador", icon: "🔍", color: "text-blue-600" },
};

function BadgeCard({ badge }: { badge: any }) {
  const rarity = RARITY_CONFIG[badge.rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.common;
  const category = CATEGORY_CONFIG[badge.category as keyof typeof CATEGORY_CONFIG];
  const earned = badge.earned;

  return (
    <div
      className={`relative rounded-2xl border-2 p-4 transition-all duration-200 ${
        earned
          ? `bg-background ${rarity.glow} shadow-md border-opacity-60 ${rarity.color.replace("bg-", "border-").replace(" text-foreground/80", "").replace(" text-blue-700", "").replace(" text-purple-700", "").replace(" text-amber-700", "")}`
          : "bg-muted/30 border-border/50 opacity-60 grayscale"
      }`}
    >
      {/* Rarity badge */}
      <div className="absolute top-2 right-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${rarity.color}`}>
          {rarity.label}
        </span>
      </div>

      {/* Icon */}
      <div className={`text-4xl mb-3 ${!earned ? "filter grayscale" : ""}`}>
        {earned ? badge.icon : "🔒"}
      </div>

      {/* Name */}
      <h3 className={`font-bold text-sm mb-1 ${earned ? "text-foreground" : "text-muted-foreground/70"}`}>
        {badge.nameEs}
      </h3>

      {/* Description */}
      <p className={`text-xs leading-relaxed mb-3 ${earned ? "text-muted-foreground" : "text-muted-foreground/70"}`}>
        {badge.descriptionEs}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`text-xs ${category?.color ?? "text-muted-foreground"}`}>
          {category?.icon} {category?.label}
        </span>
        <span className={`text-xs font-bold ${earned ? "text-amber-600" : "text-muted-foreground/70"}`}>
          +{badge.points} pts
        </span>
      </div>

      {/* Earned date */}
      {earned && badge.earnedAt && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground/70">
            Conseguida el {new Date(badge.earnedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      )}

      {/* Locked overlay */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
          <Lock className="w-6 h-6 text-gray-300" />
        </div>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const { t } = useTranslation();
  const { data: catalog, isLoading: loadingCatalog } = trpc.badges.getCatalog.useQuery();
  const { data: myBadges, isLoading: loadingMine } = trpc.badges.getMyBadges.useQuery();
  const { data: leaderboard, isLoading: loadingLeaderboard } = trpc.badges.getLeaderboard.useQuery();

  const earnedCount = catalog?.filter((b: any) => b.earned).length ?? 0;
  const totalCount = catalog?.length ?? 0;
  const progressPct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const categories = Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          <h1 className="text-3xl font-bold text-foreground">Mis Insignias</h1>
        </div>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Gana insignias completando acciones en Buddy One. Cada insignia refleja tu compromiso con una alimentación más inteligente y personalizada.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-amber-500">{myBadges?.totalBadges ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Insignias ganadas</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-violet-600">{myBadges?.totalPoints ?? 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Puntos totales</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold text-emerald-600">{progressPct}%</div>
            <div className="text-sm text-muted-foreground mt-1">Colección completada</div>
            <Progress value={progressPct} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog" className="flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> Catálogo
          </TabsTrigger>
          <TabsTrigger value="earned" className="flex items-center gap-1">
            <Medal className="w-4 h-4" /> Mis logros
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            <Users className="w-4 h-4" /> Ranking
          </TabsTrigger>
        </TabsList>

        {/* CATALOG TAB */}
        <TabsContent value="catalog" className="space-y-8 mt-6">
          {loadingCatalog ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            categories.map((cat) => {
              const catBadges = catalog?.filter((b: any) => b.category === cat) ?? [];
              const catConfig = CATEGORY_CONFIG[cat];
              const earnedInCat = catBadges.filter((b: any) => b.earned).length;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{catConfig.icon}</span>
                    <h2 className={`text-lg font-bold ${catConfig.color}`}>{catConfig.label}</h2>
                    <span className="text-sm text-muted-foreground/70 ml-auto">{earnedInCat}/{catBadges.length}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {catBadges.map((badge: any) => (
                      <BadgeCard key={badge.id} badge={badge} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        {/* EARNED TAB */}
        <TabsContent value="earned" className="mt-6">
          {loadingMine ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : myBadges?.badges.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground/70">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Aún no tienes insignias</p>
              <p className="text-sm mt-1">Adapta tu primera receta con IA para ganar tu primera insignia</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {myBadges?.badges.map((badge: any) => (
                <BadgeCard key={badge.id} badge={{ ...badge, earned: true }} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* LEADERBOARD TAB */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Top Buddy One — Ranking de insignias
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLeaderboard ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : leaderboard?.length === 0 ? (
                <p className="text-center text-muted-foreground/70 py-8">Aún no hay usuarios en el ranking</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard?.map((entry: any, index: number) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-4 p-3 rounded-xl ${
                        index === 0 ? "bg-amber-50 border border-amber-200" :
                        index === 1 ? "bg-muted/30 border border-border" :
                        index === 2 ? "bg-orange-50 border border-orange-200" :
                        "bg-background border border-border/50"
                      }`}
                    >
                      {/* Position */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-amber-400 text-white" :
                        index === 1 ? "bg-gray-400 text-white" :
                        index === 2 ? "bg-orange-400 text-white" :
                        "bg-muted/50 text-muted-foreground"
                      }`}>
                        {index + 1}
                      </div>

                      {/* Avatar */}
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={entry.userImage ?? undefined} />
                        <AvatarFallback>{(entry.userName ?? "?")[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{entry.userName ?? "Usuario"}</p>
                        <p className="text-xs text-muted-foreground">{entry.badgeCount} insignias</p>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <p className="font-bold text-amber-600">{entry.totalPoints}</p>
                        <p className="text-xs text-muted-foreground/70">puntos</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
