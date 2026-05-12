import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Gift, Copy, Users, DollarSign, TrendingUp, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function ExpertReferrals() {
  const { user } = useAuth();
  const { data, isLoading } = trpc.expertEnhanced.getReferralStats.useQuery(undefined, { enabled: !!user });
  const generateMutation = trpc.expertEnhanced.generateReferralCode.useMutation({
    onSuccess: () => {
      toast.success("Código de referido generado");
      window.location.reload();
    },
    onError: (err) => toast.error(err.message),
  });

  const referralCode = data?.code || "";
  const referralUrl = referralCode ? `${window.location.origin}/register?ref=${referralCode}` : "";

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Código copiado");
  };
  const copyUrl = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success("Enlace copiado");
  };
  const shareUrl = () => {
    if (navigator.share) {
      navigator.share({ title: "BuddyOne", text: `Únete a BuddyOne con mi código: ${referralCode}`, url: referralUrl });
    } else {
      copyUrl();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 dark:from-slate-950 dark:to-violet-950/20">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Gift className="w-6 h-6 text-violet-500" /> Programa de Referidos</h1>
            <p className="text-sm text-muted-foreground">Gana el 20% de la suscripción de cada usuario que refieras</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Referidos", value: data?.totalReferred || 0, icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/50" },
            { label: "Convertidos", value: data?.converted || 0, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
            { label: "Activos", value: data?.activeSubscribers || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/50" },
            { label: "Ganado (€)", value: `${(data?.totalEarnings || 0).toFixed(2)}€`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/50" },
          ].map(s => (
            <Card key={s.label} className={s.bg}>
              <CardContent className="py-4 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Code */}
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
          <CardContent className="py-6">
            {referralCode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Tu código de referido</p>
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-background rounded-xl border-2 border-violet-300 dark:border-violet-700">
                    <span className="text-2xl font-mono font-bold tracking-wider text-violet-700 dark:text-violet-300">{referralCode}</span>
                    <Button variant="ghost" size="icon" onClick={copyCode}><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 max-w-lg mx-auto">
                  <Input value={referralUrl} readOnly className="text-xs bg-background" />
                  <Button variant="outline" size="sm" onClick={copyUrl}><Copy className="w-4 h-4" /></Button>
                  <Button size="sm" onClick={shareUrl} className="bg-violet-600 hover:bg-violet-700 text-white"><Share2 className="w-4 h-4" /></Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Comparte este enlace. Cuando alguien se registre y se suscriba, recibirás el 20% de su suscripción mensual.
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <Gift className="w-12 h-12 text-violet-300 mx-auto mb-3" />
                <p className="text-lg font-medium">Activa tu programa de referidos</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Genera tu código único y empieza a ganar con cada usuario que refieras</p>
                <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white">
                  {generateMutation.isPending ? "Generando..." : "Generar código de referido"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader><CardTitle className="text-base">¿Cómo funciona?</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Comparte tu código", desc: "Envía tu enlace de referido a potenciales usuarios" },
                { step: "2", title: "Se registran", desc: "El usuario se registra con tu código y obtiene un descuento" },
                { step: "3", title: "Ganas el 20%", desc: "Recibes el 20% de su suscripción mientras esté activo" },
              ].map(s => (
                <div key={s.step} className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 font-bold text-sm flex items-center justify-center mx-auto mb-2">{s.step}</div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Referrals */}
        {data?.recentReferrals?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Referidos recientes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentReferrals.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center text-xs font-bold text-violet-700">
                        {(r.name || "?")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{r.name || "Usuario"}</p>
                        <p className="text-[10px] text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString("es-ES") : ""}</p>
                      </div>
                    </div>
                    <Badge variant={r.subscribed ? "default" : "secondary"}>
                      {r.subscribed ? "Suscrito" : "Registrado"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
