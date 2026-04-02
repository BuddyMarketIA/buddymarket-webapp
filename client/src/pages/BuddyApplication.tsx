import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CheckCircle, Clock, XCircle, Star, ChefHat, ArrowLeft } from "lucide-react";

type AppType = "expert" | "maker";

const EXPERT_CATEGORIES = [
  "Nutrición clínica", "Pérdida de peso", "Ganancia muscular", "Nutrición deportiva",
  "Nutrición vegana/vegetariana", "Diabetes y metabolismo", "Nutrición infantil",
  "Trastornos alimentarios", "Nutrición oncológica", "Dietas terapéuticas"
];

const SPECIALTIES_MAKER = [
  "Cocina mediterránea", "Repostería saludable", "Cocina vegana", "Meal prep",
  "Cocina asiática", "Cocina española", "Recetas fitness", "Cocina sin gluten",
  "Cocina rápida", "Cocina familiar"
];

function StatusBanner({ status, adminNote, type }: { status: string; adminNote?: string | null; type: AppType }) {
  if (status === "pending") return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
      <CardContent className="flex items-start gap-3 p-4">
        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-yellow-800 dark:text-yellow-400">Solicitud en revisión</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
            Tu solicitud ha sido enviada y está siendo revisada por el equipo de BuddyMarket. 
            Te notificaremos cuando sea aprobada.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (status === "approved") return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardContent className="flex items-start gap-3 p-4">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-green-800 dark:text-green-400">
            ¡Solicitud aprobada! 🎉
          </p>
          <p className="text-sm text-green-700 dark:text-green-500 mt-1">
            Ya tienes acceso completo a tu panel de {type === "expert" ? "BuddyExpert" : "BuddyMaker"}.
            {adminNote && ` Nota del equipo: "${adminNote}"`}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (status === "rejected") return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardContent className="flex items-start gap-3 p-4">
        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-800 dark:text-red-400">Solicitud rechazada</p>
          <p className="text-sm text-red-700 dark:text-red-500 mt-1">
            {adminNote || "Tu solicitud no fue aprobada en esta ocasión."}
            {" "}Puedes volver a enviar una solicitud con más información.
          </p>
        </div>
      </CardContent>
    </Card>
  );

  return null;
}

export default function BuddyApplication({ type }: { type?: AppType }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeType, setActiveType] = useState<AppType>(type ?? "expert");
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    specialty: "",
    instagramHandle: "",
    youtubeHandle: "",
    tiktokHandle: "",
    websiteUrl: "",
    motivation: "",
    experience: "",
    expertCategory: "",
    certifications: "",
  });

  const expertAppQuery = trpc.buddyApplications.getMyApplication.useQuery(
    { type: "expert" }, { enabled: !!user }
  );
  const makerAppQuery = trpc.buddyApplications.getMyApplication.useQuery(
    { type: "maker" }, { enabled: !!user }
  );

  const utils = trpc.useUtils();
  const submitMutation = trpc.buddyApplications.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! Te notificaremos cuando sea revisada.");
      utils.buddyApplications.getMyApplication.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const currentApp = activeType === "expert" ? expertAppQuery.data : makerAppQuery.data;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.displayName.trim()) return toast.error("El nombre es obligatorio");
    submitMutation.mutate({ type: activeType, ...form });
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground">Inicia sesión para enviar tu solicitud</p>
      <Button onClick={() => window.location.href = getLoginUrl()}>Iniciar sesión</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1 as any)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Únete como creador</h1>
          <p className="text-sm text-muted-foreground">Comparte tu conocimiento con la comunidad BuddyMarket</p>
        </div>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveType("expert")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${activeType === "expert" ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" : "border-border hover:border-border/80"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-violet-500" />
            <span className="font-semibold">BuddyExpert</span>
            {expertAppQuery.data && (
              <Badge variant={expertAppQuery.data.status === "approved" ? "default" : "outline"} className="text-xs ml-auto">
                {expertAppQuery.data.status === "approved" ? "✓ Aprobado" : expertAppQuery.data.status === "pending" ? "En revisión" : "Rechazado"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Nutricionistas, dietistas y expertos en salud</p>
        </button>
        <button
          onClick={() => setActiveType("maker")}
          className={`p-4 rounded-xl border-2 text-left transition-all ${activeType === "maker" ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30" : "border-border hover:border-border/80"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <span className="font-semibold">BuddyMaker</span>
            {makerAppQuery.data && (
              <Badge variant={makerAppQuery.data.status === "approved" ? "default" : "outline"} className="text-xs ml-auto">
                {makerAppQuery.data.status === "approved" ? "✓ Aprobado" : makerAppQuery.data.status === "pending" ? "En revisión" : "Rechazado"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Creadores de recetas y contenido culinario</p>
        </button>
      </div>

      {/* Status banner if application exists */}
      {currentApp && currentApp.status !== "rejected" && (
        <StatusBanner status={currentApp.status} adminNote={currentApp.adminNote} type={activeType} />
      )}

      {/* If approved, show go-to-panel button */}
      {currentApp?.status === "approved" && (
        <Button
          className="w-full"
          onClick={() => navigate(activeType === "expert" ? "/buddy-expert-dashboard" : "/buddy-maker-dashboard")}
        >
          Ir a mi panel de {activeType === "expert" ? "BuddyExpert" : "BuddyMaker"} →
        </Button>
      )}

      {/* Application form — show if no app or if rejected */}
      {(!currentApp || currentApp.status === "rejected") && (
        <Card className="border-0 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {currentApp?.status === "rejected" ? "Volver a solicitar" : `Solicitar acceso como ${activeType === "expert" ? "BuddyExpert" : "BuddyMaker"}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentApp?.status === "rejected" && (
              <StatusBanner status="rejected" adminNote={currentApp.adminNote} type={activeType} />
            )}
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Nombre público *</Label>
                <Input placeholder="Cómo quieres que te conozcan" value={form.displayName} onChange={f("displayName")} required />
              </div>

              {activeType === "expert" && (
                <div>
                  <Label>Categoría de especialización</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={form.expertCategory}
                    onChange={f("expertCategory")}
                  >
                    <option value="">Selecciona una categoría</option>
                    {EXPERT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div>
                <Label>Especialidad</Label>
                {activeType === "maker" ? (
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={form.specialty}
                    onChange={f("specialty")}
                  >
                    <option value="">Selecciona tu especialidad</option>
                    {SPECIALTIES_MAKER.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <Input placeholder="Ej: Nutrición deportiva y pérdida de peso" value={form.specialty} onChange={f("specialty")} />
                )}
              </div>

              <div>
                <Label>Sobre ti</Label>
                <Textarea
                  placeholder="Cuéntanos quién eres y qué te hace especial..."
                  value={form.bio}
                  onChange={f("bio")}
                  rows={3}
                />
              </div>

              <div>
                <Label>¿Por qué quieres ser {activeType === "expert" ? "BuddyExpert" : "BuddyMaker"}?</Label>
                <Textarea
                  placeholder="Cuéntanos tu motivación y qué aportarás a la comunidad..."
                  value={form.motivation}
                  onChange={f("motivation")}
                  rows={3}
                />
              </div>

              <div>
                <Label>Experiencia previa</Label>
                <Textarea
                  placeholder={activeType === "expert" ? "Formación, años de experiencia, casos de éxito..." : "Proyectos anteriores, seguidores, plataformas..."}
                  value={form.experience}
                  onChange={f("experience")}
                  rows={2}
                />
              </div>

              {activeType === "expert" && (
                <div>
                  <Label>Certificaciones y titulaciones</Label>
                  <Textarea
                    placeholder="Ej: Graduada en Nutrición Humana y Dietética, Máster en Nutrición Deportiva..."
                    value={form.certifications}
                    onChange={f("certifications")}
                    rows={2}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Instagram</Label>
                  <Input placeholder="@usuario" value={form.instagramHandle} onChange={f("instagramHandle")} />
                </div>
                {activeType === "maker" ? (
                  <div>
                    <Label>YouTube</Label>
                    <Input placeholder="@canal" value={form.youtubeHandle} onChange={f("youtubeHandle")} />
                  </div>
                ) : (
                  <div>
                    <Label>Web / LinkedIn</Label>
                    <Input placeholder="https://..." value={form.websiteUrl} onChange={f("websiteUrl")} />
                  </div>
                )}
              </div>

              {activeType === "maker" && (
                <div>
                  <Label>TikTok</Label>
                  <Input placeholder="@usuario" value={form.tiktokHandle} onChange={f("tiktokHandle")} />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Enviando solicitud..." : "Enviar solicitud"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                El equipo de BuddyMarket revisará tu solicitud en un plazo de 24-48h.
                Recibirás una notificación cuando sea aprobada.
              </p>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
