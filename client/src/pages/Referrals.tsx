import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";
import {
  UserGroupIcon,
  GiftIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ShareIcon,
  TrophyIcon,
  SparklesIcon,
  ChevronRightIcon,
  FireIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending:    { label: "Pendiente",   className: "bg-yellow-100 text-yellow-700" },
    subscribed: { label: "Suscrito",    className: "bg-blue-100 text-blue-700" },
    rewarded:   { label: "Recompensado", className: "bg-green-100 text-green-700" },
    expired:    { label: "Expirado",    className: "bg-gray-100 text-gray-500" },
  };
  const { label, className } = map[status] ?? { label: status, className: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

// ─── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ name, imageUrl }: { name: string; imageUrl?: string | null }) {
  if (imageUrl) return <img src={imageUrl} alt={name} className="h-10 w-10 rounded-full object-cover" />;
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] text-white text-sm font-bold">
      {initials || "?"}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Referrals() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showApplyCode, setShowApplyCode] = useState(false);
  const [applyCodeInput, setApplyCodeInput] = useState("");

  const { data: stats, isLoading, refetch } = trpc.userReferrals.getStats.useQuery();
  const { data: myCode, isLoading: codeLoading } = trpc.userReferrals.getMyCode.useQuery();

  const applyCode = trpc.userReferrals.applyCode.useMutation({
    onSuccess: () => {
      toast.success("¡Código aplicado! Tu amigo recibirá la notificación cuando te suscribas.");
      setShowApplyCode(false);
      setApplyCodeInput("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const referralLink = myCode
    ? `${window.location.origin}/register?ref=${myCode.code}`
    : null;

  const handleCopyCode = () => {
    if (!myCode?.code) return;
    navigator.clipboard.writeText(myCode.code);
    setCopied(true);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast.success("Enlace copiado al portapapeles");
  };

  const handleShare = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "¡Únete a BuddyMarket!",
          text: `Usa mi código ${myCode?.code} y consigue 1 mes gratis al suscribirte a BuddyMarket 🥗`,
          url: referralLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsApp = () => {
    if (!referralLink || !myCode) return;
    const text = encodeURIComponent(
      `¡Hola! Te recomiendo BuddyMarket, la app de nutrición inteligente 🥗\n\nUsa mi código *${myCode.code}* al registrarte y consigue 1 mes gratis cuando te suscribas.\n\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (isLoading || codeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  const pendingCount = (stats?.referrals ?? []).filter(r => r.status === "pending").length;
  const rewardedCount = (stats?.referrals ?? []).filter(r => r.status === "rewarded").length;
  const subscribedCount = (stats?.referrals ?? []).filter(r => r.status === "subscribed").length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#F97316] to-[#ea6c0a] px-4 pt-6 pb-10 text-white">
        <h1 className="text-2xl font-bold">Invita a tus amigos</h1>
        <p className="mt-1 text-sm text-white/80">Gana 1 mes gratis por cada amigo que se suscriba</p>
      </div>

      <div className="mx-auto max-w-lg px-4 -mt-6 space-y-4">

        {/* Code card */}
        <div className="rounded-3xl bg-white shadow-lg overflow-hidden">
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <GiftIcon className="h-5 w-5 text-[#F97316]" />
              <span className="text-sm font-semibold text-gray-700">Tu código de referido</span>
            </div>

            {/* Code display */}
            <div className="flex items-center gap-3 rounded-2xl bg-[#FAF7F2] border-2 border-dashed border-[#F97316]/30 px-4 py-3">
              <span className="flex-1 text-center text-3xl font-black tracking-[0.2em] text-[#F97316]">
                {myCode?.code ?? "———"}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] text-white shadow-sm active:scale-95 transition-transform"
              >
                {copied
                  ? <CheckIcon className="h-5 w-5" />
                  : <ClipboardDocumentIcon className="h-5 w-5" />
                }
              </button>
            </div>

            {/* Share buttons */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={handleShare}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-200 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
              >
                <ShareIcon className="h-5 w-5 text-[#F97316]" />
                Compartir
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-200 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
              >
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-200 py-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
              >
                <ClipboardDocumentIcon className="h-5 w-5 text-blue-500" />
                Copiar link
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-[#F97316]">{(stats?.referrals ?? []).length}</p>
            <p className="mt-0.5 text-xs text-gray-500">Invitados</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-green-600">{rewardedCount + subscribedCount}</p>
            <p className="mt-0.5 text-xs text-gray-500">Suscritos</p>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-purple-600">{stats?.totalRewardDays ?? 0}</p>
            <p className="mt-0.5 text-xs text-gray-500">Días gratis</p>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-gray-900">¿Cómo funciona?</h3>
          <div className="space-y-3">
            {[
              { icon: "1", text: "Comparte tu código o enlace con amigos", color: "bg-[#F97316]" },
              { icon: "2", text: "Tu amigo se registra en BuddyMarket con tu código", color: "bg-blue-500" },
              { icon: "3", text: "Cuando se suscriba a cualquier plan, ¡tú ganas 1 mes gratis!", color: "bg-green-500" },
            ].map((step) => (
              <div key={step.icon} className="flex items-start gap-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${step.color} text-xs font-bold text-white`}>
                  {step.icon}
                </div>
                <p className="text-sm text-gray-600 leading-snug pt-0.5">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Apply a referral code */}
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">¿Tienes un código de amigo?</h3>
              <p className="text-xs text-gray-500 mt-0.5">Aplícalo para que tu amigo gane su recompensa</p>
            </div>
            <button
              onClick={() => setShowApplyCode(!showApplyCode)}
              className="flex h-9 items-center gap-1 rounded-full bg-[#F97316]/10 px-4 text-xs font-semibold text-[#F97316]"
            >
              Aplicar
              <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform ${showApplyCode ? "rotate-90" : ""}`} />
            </button>
          </div>
          {showApplyCode && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={applyCodeInput}
                onChange={e => setApplyCodeInput(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
                className="flex-1 rounded-2xl border border-gray-200 px-4 py-2.5 text-center text-lg font-bold tracking-widest uppercase outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]"
              />
              <button
                onClick={() => {
                  if (applyCodeInput.length < 4) { toast.error("El código debe tener al menos 4 caracteres"); return; }
                  applyCode.mutate({ code: applyCodeInput });
                }}
                disabled={applyCode.isPending}
                className="rounded-2xl bg-[#F97316] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50 active:scale-95 transition-transform"
              >
                {applyCode.isPending ? "..." : "OK"}
              </button>
            </div>
          )}
        </div>

        {/* Referrals list */}
        {(stats?.referrals ?? []).length > 0 && (
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-gray-900">Tus referidos</h3>
            <div className="space-y-3">
              {(stats?.referrals ?? []).map((referral) => (
                <div key={referral.id} className="flex items-center gap-3">
                  <Avatar name={referral.referredName} imageUrl={referral.referredImage} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{referral.referredName}</p>
                    <p className="text-xs text-gray-500">
                      {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={referral.status} />
                    {referral.status === "rewarded" && (
                      <span className="text-xs font-semibold text-green-600">+{referral.rewardDays ?? 30} días</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {(stats?.referrals ?? []).length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-200" />
            <p className="mt-3 text-sm font-semibold text-gray-700">Aún no has invitado a nadie</p>
            <p className="mt-1 text-xs text-gray-400">Comparte tu código y empieza a ganar meses gratis</p>
            <button
              onClick={handleShare}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F97316] px-6 py-2.5 text-sm font-bold text-white shadow-sm active:scale-95 transition-transform"
            >
              <ShareIcon className="h-4 w-4" />
              Compartir ahora
            </button>
          </div>
        )}

        {/* Reward banner */}
        {rewardedCount > 0 && (
          <div className="rounded-3xl bg-gradient-to-r from-green-500 to-emerald-600 p-5 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <StarIcon className="h-8 w-8 text-yellow-300" />
              <div>
                <p className="font-bold">¡Enhorabuena!</p>
                <p className="text-sm text-white/90">
                  Has ganado <strong>{stats?.totalRewardDays ?? 0} días gratis</strong> gracias a {rewardedCount} amigo{rewardedCount !== 1 ? "s" : ""} suscrito{rewardedCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Terms */}
        <p className="text-center text-xs text-gray-400 pb-4">
          La recompensa se aplica automáticamente cuando tu amigo activa una suscripción de pago.
          Válido para planes Basic, Premium y Pro Max. Sin límite de referidos.
        </p>
      </div>
    </div>
  );
}
