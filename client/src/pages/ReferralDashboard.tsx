import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "wouter";
import {
  Copy, Share2, TrendingUp, Users, DollarSign, Gift,
  CheckCircle, Clock, XCircle, ChevronLeft,
  Instagram, Zap
} from "lucide-react";

type CreatorType = "buddyexpert" | "buddymaker";

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [creatorType] = useState<CreatorType>(
    (user?.role === "buddyexpert" || user?.accountType === "buddyexpert") ? "buddyexpert" : "buddymaker"
  );

  const { data: myCode, refetch: refetchCode } = trpc.referrals.getMyCode.useQuery(
    { creatorType },
    { enabled: !!user }
  );
  const { data: earningsData } = trpc.referrals.getMyEarnings.useQuery(
    undefined,
    { enabled: !!user && !!myCode }
  );

  const generateMut = trpc.referrals.generate.useMutation({
    onSuccess: () => {
      refetchCode();
      toast.success("¡Código generado!", { description: "Tu código de referido ya está activo en Stripe." });
    },
    onError: (e) => toast.error("Error", { description: e.message }),
  });

  const referralLink = myCode
    ? `${window.location.origin}/register?ref=${myCode.code}`
    : null;

  const copyCode = () => {
    if (!myCode) return;
    navigator.clipboard.writeText(myCode.code);
    toast.success("¡Copiado!", { description: "Código copiado al portapapeles." });
  };

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("¡Enlace copiado!", { description: "Enlace de referido copiado al portapapeles." });
  };

  const shareOnInstagram = () => {
    if (!myCode) return;
    const text = `🎯 ¡Únete a BuddyMarket con mi código ${myCode.code} y obtén un ${myCode.discountPercent}% de descuento en tu suscripción!\n\n🔗 ${referralLink}`;
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado", { description: "Pega el texto en tu historia de Instagram." });
  };

  const formatCurrency = (cents: number, currency = "eur") =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

  const statusBadge = (status: string) => {
    if (status === "transferred") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Transferido</Badge>;
    if (status === "pending") return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
  };

  const backPath = creatorType === "buddyexpert" ? "/app/buddy-expert-stats" : "/app/buddy-maker-stats";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #1a0a2e 100%)", padding: "20px 16px 80px" }}>
      {/* Header */}
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link href={backPath}>
            <button style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "white", display: "flex", alignItems: "center" }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "white" }}>Programa de Referidos</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Gana el 20% de cada suscripción activa</p>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Zap className="w-5 h-5" style={{ color: "#a78bfa" }} />
            <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>¿Cómo funciona?</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { step: "1", text: "Comparte tu código con tus seguidores" },
              { step: "2", text: `Ellos obtienen un ${myCode?.discountPercent ?? 15}% de descuento al suscribirse` },
              { step: "3", text: "Tú recibes el 20% de cada pago mensual mientras la suscripción esté activa" },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(99,102,241,0.4)", color: "white", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.step}</div>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, paddingTop: 4 }}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        {myCode && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
            {[
              { icon: <Users className="w-5 h-5" />, label: "Referidos activos", value: earningsData?.activeReferrals ?? 0, color: "#6366f1" },
              { icon: <TrendingUp className="w-5 h-5" />, label: "Usos totales", value: earningsData?.usageCount ?? 0, color: "#8b5cf6" },
              { icon: <DollarSign className="w-5 h-5" />, label: "Total ganado", value: formatCurrency(earningsData?.totalEarned ?? 0), color: "#10b981" },
            ].map((stat, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ color: stat.color, display: "flex", justifyContent: "center", marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{stat.value}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Code card */}
        {!myCode ? (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 18, padding: "32px 24px", textAlign: "center", marginBottom: 20 }}>
            <Gift className="w-12 h-12" style={{ color: "#6366f1", margin: "0 auto 12px" }} />
            <p style={{ color: "white", fontWeight: 700, fontSize: 17, margin: "0 0 6px" }}>Aún no tienes código de referido</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 20px" }}>Genera tu código único y empieza a ganar comisiones</p>
            <Button
              onClick={() => generateMut.mutate({ creatorType, discountPercent: 15 })}
              disabled={generateMut.isPending}
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", fontWeight: 700, borderRadius: 12, padding: "10px 28px" }}
            >
              {generateMut.isPending ? "Generando..." : "Generar mi código"}
            </Button>
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 18, padding: "20px", marginBottom: 20 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>Tu código de referido</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 12, padding: "12px 16px", fontFamily: "monospace", fontSize: 22, fontWeight: 900, color: "#a78bfa", letterSpacing: 3 }}>
                {myCode.code}
              </div>
              <button onClick={copyCode} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 10, padding: "12px", cursor: "pointer", color: "#a78bfa" }}>
                <Copy className="w-5 h-5" />
              </button>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{referralLink}</span>
              <button onClick={copyLink} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", flexShrink: 0 }}>
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyLink} style={{ flex: 1, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", color: "white", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Share2 className="w-4 h-4" /> Compartir enlace
              </button>
              <button onClick={shareOnInstagram} style={{ background: "linear-gradient(135deg, #e1306c, #833ab4)", border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", color: "white", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 13 }}>
                <Instagram className="w-4 h-4" /> Instagram
              </button>
            </div>

            {myCode.stripeCouponId && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle className="w-4 h-4" style={{ color: "#10b981" }} />
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Cupón Stripe activo · {myCode.discountPercent}% descuento para tus referidos</span>
              </div>
            )}
          </div>
        )}

        {/* Earnings history */}
        {earningsData && earningsData.earnings.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 15 }}>Historial de comisiones</h3>
            </div>
            <div>
              {earningsData.earnings.map((earning) => (
                <div key={earning.id} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {earning.referredImage
                      ? <img src={earning.referredImage} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                      : <DollarSign className="w-4 h-4" style={{ color: "#10b981" }} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, color: "white", fontWeight: 600, fontSize: 13 }}>{earning.referredName ?? "Usuario referido"}</p>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                      {new Date(earning.createdAt).toLocaleDateString("es-ES")} · Suscripción: {formatCurrency(earning.subscriptionAmount, earning.currency)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: "0 0 4px", color: "#10b981", fontWeight: 800, fontSize: 15 }}>+{formatCurrency(earning.commissionAmount, earning.currency)}</p>
                    {statusBadge(earning.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myCode && earningsData && earningsData.earnings.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <TrendingUp className="w-10 h-10" style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 10px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Aún no hay comisiones. ¡Comparte tu código para empezar!</p>
          </div>
        )}
      </div>
    </div>
  );
}
