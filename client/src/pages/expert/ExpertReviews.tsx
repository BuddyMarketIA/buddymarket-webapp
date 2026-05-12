import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, ArrowLeft, MessageSquare, CheckCircle, Shield } from "lucide-react";
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
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const { data: reviews, isLoading, refetch } = trpc.expertEnhanced.getExpertReviews.useQuery(undefined, { enabled: !!user });
  const submitMutation = trpc.expertEnhanced.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Reseña enviada con éxito");
      setShowWriteReview(false);
      setReviewRating(0);
      setReviewText("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const avgRating = reviews?.length ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews?.filter((r: any) => r.rating === star).length || 0,
    pct: reviews?.length ? Math.round(((reviews.filter((r: any) => r.rating === star).length || 0) / reviews.length) * 100) : 0,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 dark:from-slate-950 dark:to-amber-950/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="w-6 h-6 text-amber-500" /> Reseñas Verificadas</h1>
            <p className="text-sm text-muted-foreground">Opiniones de pacientes que han completado al menos 4 semanas</p>
          </div>
        </div>

        {/* Summary */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
          <CardContent className="py-5">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-amber-600">{avgRating}</p>
                <StarRating rating={Math.round(parseFloat(avgRating as string))} />
                <p className="text-xs text-muted-foreground mt-1">{reviews?.length || 0} reseñas</p>
              </div>
              <div className="flex-1 space-y-1">
                {ratingDist.map(d => (
                  <div key={d.star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right">{d.star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Write Review (for patients) */}
        {user && !showWriteReview && (
          <Button variant="outline" className="w-full" onClick={() => setShowWriteReview(true)}>
            <MessageSquare className="w-4 h-4 mr-2" /> Escribir reseña
          </Button>
        )}
        {showWriteReview && (
          <Card>
            <CardHeader><CardTitle className="text-base">Escribe tu reseña</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm mb-2">Tu valoración</p>
                <StarRating rating={reviewRating} onRate={setReviewRating} interactive />
              </div>
              <Textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Comparte tu experiencia con este profesional..."
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => submitMutation.mutate({ rating: reviewRating, comment: reviewText })}
                  disabled={!reviewRating || !reviewText.trim() || submitMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {submitMutation.isPending ? "Enviando..." : "Enviar reseña"}
                </Button>
                <Button variant="ghost" onClick={() => setShowWriteReview(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted/50 animate-pulse" />)}</div>
        ) : !reviews?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Star className="w-12 h-12 text-amber-200 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Sin reseñas todavía</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Las reseñas aparecerán cuando los pacientes completen al menos 4 semanas</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
                      {(review.reviewerName || "?")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{review.reviewerName || "Paciente"}</span>
                        <Badge variant="outline" className="text-[10px] gap-1"><Shield className="w-2.5 h-2.5" /> Verificado</Badge>
                      </div>
                      <StarRating rating={review.rating} />
                      <p className="text-sm mt-2 text-foreground/80">{review.comment}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
