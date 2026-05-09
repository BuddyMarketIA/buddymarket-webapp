/**
 * Perfil Público Mejorado de BuddyMaker
 * Muestra: bio, recetas, seguidores, badges, estadísticas, botones de contacto
 */

import { useParams } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Share2, Download, MessageCircle, ExternalLink } from "lucide-react";

export default function MakerPublicProfile() {
  const { makerId } = useParams<{ makerId: string }>();
  const { t } = useTranslation();
  const [maker, setMaker] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener datos del Maker
  useEffect(() => {
    const fetchMaker = async () => {
      setLoading(true);
      try {
        // Aquí iría la llamada a tRPC para obtener el maker
        // const makerData = await trpc.buddyMakers.getById.query({ makerId: parseInt(makerId!) });
        // setMaker(makerData);
      } catch (error) {
        console.error("Error fetching maker:", error);
      } finally {
        setLoading(false);
      }
    };

    if (makerId) {
      fetchMaker();
    }
  }, [makerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full rounded-lg mb-8" />
          <Skeleton className="h-12 w-full rounded-lg mb-4" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!maker) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("common.notFound")}</h1>
          <p className="text-gray-600">{t("common.makerNotFound")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header con portada */}
      <div className="relative h-48 bg-gradient-to-r from-orange-400 to-orange-600 overflow-hidden">
        {maker.coverUrl && (
          <img
            src={maker.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover opacity-80"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10">
        {/* Tarjeta de perfil */}
        <Card className="bg-white shadow-lg mb-8">
          <div className="p-6">
            {/* Avatar y nombre */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-5xl font-bold overflow-hidden border-4 border-white shadow-lg">
                  {maker.avatarUrl ? (
                    <img src={maker.avatarUrl} alt={maker.displayName} className="w-full h-full object-cover" />
                  ) : (
                    maker.displayName.charAt(0).toUpperCase()
                  )}
                </div>

                {/* Info básica */}
                <div className="flex-1 pt-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{maker.displayName}</h1>
                    {maker.verified && (
                      <Badge className="bg-blue-500 text-white">✓ {t("common.verified")}</Badge>
                    )}
                  </div>
                  {maker.specialty && (
                    <p className="text-lg text-orange-600 font-semibold mb-3">{maker.specialty}</p>
                  )}
                  {maker.bio && (
                    <p className="text-gray-600 text-sm leading-relaxed max-w-md">{maker.bio}</p>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`${
                    isFollowing
                      ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {isFollowing ? t("common.following") : t("common.follow")}
                </Button>
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t("common.contact")}
                </Button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-4 gap-4 py-6 border-t border-b border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{maker.recipesCount || 0}</div>
                <div className="text-sm text-gray-600">{t("common.recipes")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{maker.followersCount || 0}</div>
                <div className="text-sm text-gray-600">{t("common.followers")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {maker.rating ? maker.rating.toFixed(1) : "0"}
                </div>
                <div className="text-sm text-gray-600">{t("common.rating")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{badges.length}</div>
                <div className="text-sm text-gray-600">{t("common.badges")}</div>
              </div>
            </div>

            {/* Redes sociales */}
            {(maker.instagramHandle || maker.youtubeHandle || maker.tiktokHandle) && (
              <div className="flex gap-4 mt-6">
                {maker.instagramHandle && (
                  <a
                    href={`https://instagram.com/${maker.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-orange-600 transition"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                {maker.youtubeHandle && (
                  <a
                    href={`https://youtube.com/@${maker.youtubeHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-orange-600 transition"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
                {maker.tiktokHandle && (
                  <a
                    href={`https://tiktok.com/@${maker.tiktokHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-orange-600 transition"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("common.badges")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <Card key={badge.id} className="p-4 text-center hover:shadow-lg transition">
                  <div className="text-4xl mb-2">{badge.icon || "🏆"}</div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{badge.title}</h3>
                  {badge.description && (
                    <p className="text-xs text-gray-600">{badge.description}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recetas destacadas */}
        {recipes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t("common.recipes")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.slice(0, 6).map((recipe) => (
                <Card
                  key={recipe.id}
                  className="overflow-hidden hover:shadow-lg transition cursor-pointer"
                >
                  {/* Imagen */}
                  <div className="relative h-40 bg-gray-200 overflow-hidden">
                    {recipe.imageUrl && (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-full h-full object-cover hover:scale-110 transition"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Badge className="bg-white/90 text-gray-900 text-xs">
                        {recipe.caloriesPerServing || 0} kcal
                      </Badge>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{recipe.name}</h3>
                    <div className="flex gap-2 text-xs text-gray-600 mb-4">
                      {recipe.preparationTime && (
                        <span>⏱️ {recipe.preparationTime}min</span>
                      )}
                      {recipe.difficulty && (
                        <span>📊 {recipe.difficulty}</span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 h-8 text-xs"
                      >
                        <Heart className="w-3 h-3" />
                        {t("common.save")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1 h-8 text-xs"
                      >
                        <Share2 className="w-3 h-3" />
                        {t("common.share")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
