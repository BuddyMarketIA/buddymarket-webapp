import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, Users, TrendingUp, Share2 } from "lucide-react";
import { toast } from "sonner";

export function ReferralProgram() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Fetch referral data
  const { data: referralCode } = trpc.referral.getOrCreateReferralCode.useQuery();
  const { data: stats } = trpc.referral.getReferralStats.useQuery();
  const { data: referredUsers } = trpc.referral.getReferredUsers.useQuery();
  const { data: tiers } = trpc.referral.getRewardsTiers.useQuery();

  const referralUrl = referralCode ? `${window.location.origin}?ref=${referralCode.code}` : "";

  const copyToClipboard = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success(t("referral.copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnSocial = (platform: string) => {
    const message = t("referral.share_message", {
      defaultValue: "¡Únete a BuddyOne y obtén beneficios exclusivos! Usa mi código de referencia:",
    });
    const text = `${message} ${referralCode?.code}`;

    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank");
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("referral.title", { defaultValue: "Programa de Referidos" })}</h1>
        <p className="text-muted-foreground">
          {t("referral.description", {
            defaultValue: "Invita amigos y gana puntos, descuentos y premios exclusivos",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("referral.total_referrals", { defaultValue: "Referidos" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("referral.friends_invited", { defaultValue: "amigos invitados" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4" />
              {t("referral.total_points", { defaultValue: "Puntos" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPoints || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("referral.points_earned", { defaultValue: "puntos ganados" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t("referral.total_earnings", { defaultValue: "Ganancias" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.totalEarnings || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("referral.total_saved", { defaultValue: "ahorrado" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle>{t("referral.your_code", { defaultValue: "Tu Código de Referencia" })}</CardTitle>
          <CardDescription>
            {t("referral.code_description", {
              defaultValue: "Comparte este código con amigos para ganar recompensas",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralCode?.code || ""}
              readOnly
              className="font-mono text-lg font-bold"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => shareOnSocial("whatsapp")}
              variant="outline"
              className="flex-1"
            >
              WhatsApp
            </Button>
            <Button
              onClick={() => shareOnSocial("twitter")}
              variant="outline"
              className="flex-1"
            >
              Twitter
            </Button>
            <Button
              onClick={() => shareOnSocial("facebook")}
              variant="outline"
              className="flex-1"
            >
              Facebook
            </Button>
          </div>

          <div className="p-3 bg-background rounded-lg border">
            <p className="text-sm text-muted-foreground break-all">{referralUrl}</p>
          </div>
        </CardContent>
      </Card>

      {/* Rewards Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>{t("referral.rewards_tiers", { defaultValue: "Niveles de Recompensas" })}</CardTitle>
          <CardDescription>
            {t("referral.tiers_description", {
              defaultValue: "Desbloquea recompensas exclusivas a medida que invites más amigos",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers?.map((tier) => (
              <div
                key={tier.tier}
                className={`p-4 rounded-lg border-2 transition-all ${
                  (stats?.totalReferrals || 0) >= tier.referrals
                    ? "border-primary bg-primary/5"
                    : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{tier.description}</p>
                    <p className="text-sm text-muted-foreground">{tier.points} puntos</p>
                  </div>
                  {(stats?.totalReferrals || 0) >= tier.referrals && (
                    <Badge className="bg-green-500">✓ Desbloqueado</Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-primary">{tier.reward}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referred Users Table */}
      {referredUsers && referredUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("referral.referred_users", { defaultValue: "Amigos Invitados" })}</CardTitle>
            <CardDescription>
              {t("referral.referred_users_desc", {
                defaultValue: "Lista de usuarios que se registraron con tu código",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("referral.name", { defaultValue: "Nombre" })}</TableHead>
                  <TableHead>{t("referral.email", { defaultValue: "Email" })}</TableHead>
                  <TableHead>{t("referral.joined", { defaultValue: "Se unió" })}</TableHead>
                  <TableHead className="text-right">
                    {t("referral.reward", { defaultValue: "Recompensa" })}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "Usuario"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-sm">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${user.amount || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>{t("referral.how_it_works", { defaultValue: "¿Cómo Funciona?" })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-semibold">
                {t("referral.step1_title", { defaultValue: "Comparte tu código" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("referral.step1_desc", {
                  defaultValue: "Envía tu código de referencia a amigos por WhatsApp, email o redes sociales",
                })}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-semibold">
                {t("referral.step2_title", { defaultValue: "Amigos se registran" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("referral.step2_desc", {
                  defaultValue: "Tus amigos usan tu código al registrarse en BuddyOne",
                })}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-semibold">
                {t("referral.step3_title", { defaultValue: "Gana recompensas" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("referral.step3_desc", {
                  defaultValue: "Recibe puntos, descuentos y acceso a planes premium",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
