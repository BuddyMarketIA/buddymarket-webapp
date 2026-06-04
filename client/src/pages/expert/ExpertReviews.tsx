import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, MessageSquare, Shield, TrendingUp, Award, Reply } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

function StarRating({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-5 h-5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"} ${interactive ? "cursor-pointer hover:text-amber-400" : ""}`}
          onClick={() => interactive && onRate?.(i)}
        />
      ))}
    </div>
  );
}

export default function ExpertReviews() {
  const { user } = useAuth();
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  // Obtener el expertId del usuario actual
  const { data: expertData } = trpc.buddyExperts.getMyProfile.useQuery(undefined, { enabled: !!user });
  const expertId = expertData?.id;

  const { data: reviews, isLoading, refetch } = trpc.expertEnhanced.getExpertReviews.useQuery(
    { expertId: expertId ?? 0, limit: 50 },
    { enabled: !!expertId }
  );

  const respondMutation = trpc.expertEnhanced.respondToReview.useMutation({
    onSuccess: () => {
      toast.success("Respuesta publicada");
      setReplyingTo(null);
      setReplyText("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const avgRating = reviews?.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews?.filter((r: any) => r.review.rating === star).length || 0,
    pct: reviews?.length
      ? Math.round(((reviews.filter((r: any) => r.review.rating === star).length || 0) / reviews.length) * 100)
      : 0,
  }));

  const verifiedCount = reviews?.filter((r: any) => r.review.isVerified).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-950 dark:to-amber-950/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" /> Reseñas de mis pacientes
            </h1>
            <p className="text-sm text-muted-foreground">
              Las reseñas las dejan tus pacientes tras contratar tus servicios — no puedes añadirte reseñas a ti mismo
            </p>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Reseñas verificadas automáticamente</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Solo los usuarios que han contratado uno de tus planes o llevan al menos 4 semanas como pacientes pueden dejar una reseña.
              Esto garantiza la autenticidad de todas las valoraciones.
            </p>
          </div>
        </div>

        {/* Summary */}
        {reviews && reviews.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="py-5">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-black text-amber-600">{avgRating}</p>
                  <StarRating rating={Math.round(parseFloat(avgRating as string))} />
                  <p className="text-xs text-muted-foreground mt-1">{reviews.length} reseñas</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {ratingDist.map(d => (
                    <div key={d.star} className="flex items-center gap-2 text-xs">
                      <span className="w-3 text-right font-medium">{d.star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{d.count}</span>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:flex flex-col gap-3">
                  <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm">
                    <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">{verifiedCount}</p>
                    <p className="text-xs text-muted-foreground">verificadas</p>
                  </div>
                  <div className="text-center bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm">
                    <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <p className="text-lg font-bold text-foreground">
                      {reviews.filter((r: any) => r.review.rating >= 4).length}
                    </p>
                    <p className="text-xs text-muted-foreground">positivas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : !reviews?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Star className="w-12 h-12 text-amber-200 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Aún no tienes reseñas</p>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                Las reseñas aparecerán aquí cuando tus pacientes las escriban desde su perfil, tras contratar tus servicios.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((item: any) => {
              const review = item.review;
              const patientName = item.patientName || "Paciente";
              return (
                <Card key={review.id} className={review.rating >= 4 ? "border-green-100" : review.rating <= 2 ? "border-red-100" : ""}>
                  <CardContent className="py-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                        {patientName[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">{patientName}</span>
                          {review.isVerified && (
                            <Badge variant="outline" className="text-[10px] gap-1 text-green-700 border-green-300">
                              <Shield className="w-2.5 h-2.5" /> Verificado
                            </Badge>
                          )}
                          {review.weeksWithExpert > 0 && (
                            <span className="text-[10px] text-muted-foreground/60">
                              {review.weeksWithExpert} semanas contigo
                            </span>
                          )}
                        </div>
                        <StarRating rating={review.rating} />
                        {review.title && <p className="text-sm font-semibold mt-1.5">{review.title}</p>}
                        {review.content && <p className="text-sm mt-1 text-foreground/80">{review.content}</p>}
                        <p className="text-[10px] text-muted-foreground/60 mt-2">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : ""}
                        </p>

                        {/* Respuesta del nutricionista */}
                        {review.expertResponse ? (
                          <div className="mt-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
                            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">Tu respuesta:</p>
                            <p className="text-sm text-foreground/80">{review.expertResponse}</p>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {replyingTo === review.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  placeholder="Escribe tu respuesta pública a esta reseña..."
                                  className="min-h-[80px] text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => respondMutation.mutate({ reviewId: review.id, response: replyText })}
                                    disabled={!replyText.trim() || respondMutation.isPending}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                                  >
                                    {respondMutation.isPending ? "Publicando..." : "Publicar respuesta"}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-muted-foreground gap-1 h-7 px-2"
                                onClick={() => { setReplyingTo(review.id); setReplyText(""); }}
                              >
                                <Reply className="w-3 h-3" /> Responder
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
