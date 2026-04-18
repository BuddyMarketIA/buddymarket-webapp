import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, ChevronLeft, ChefHat, Users,
  Globe, Instagram, Youtube, Star, Clock, BarChart3, Utensils
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Tu perfil creador", icon: ChefHat },
  { id: 2, title: "Tu contenido", icon: Utensils },
  { id: 3, title: "Tus redes", icon: Instagram },
  { id: 4, title: "Motivación", icon: Star },
];

const CONTENT_NICHES = [
  { value: "recetas_saludables", label: "Recetas saludables" },
  { value: "recetas_veganas", label: "Recetas veganas/vegetarianas" },
  { value: "fitness_nutricion", label: "Fitness y nutrición" },
  { value: "perdida_peso", label: "Pérdida de peso" },
  { value: "meal_prep", label: "Meal prep y batch cooking" },
  { value: "reposteria_saludable", label: "Repostería saludable" },
  { value: "cocina_internacional", label: "Cocina internacional" },
  { value: "recetas_rapidas", label: "Recetas rápidas (< 30 min)" },
  { value: "presupuesto", label: "Cocinar con presupuesto" },
  { value: "sin_gluten", label: "Sin gluten / Sin lactosa" },
  { value: "keto_paleo", label: "Keto / Paleo" },
  { value: "otro", label: "Otro nicho" },
];

const CONTENT_FREQUENCIES = [
  { value: "diario", label: "Diario" },
  { value: "varios_semana", label: "Varios días a la semana" },
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Quincenal" },
  { value: "mensual", label: "Mensual" },
];

const FOLLOWERS_RANGES = [
  { value: "0", label: "Empezando (0-1K)" },
  { value: "1000", label: "Micro (1K-10K)" },
  { value: "10000", label: "Pequeño (10K-50K)" },
  { value: "50000", label: "Mediano (50K-100K)" },
  { value: "100000", label: "Grande (100K-500K)" },
  { value: "500000", label: "Macro (500K+)" },
];

interface FormData {
  displayName: string;
  bio: string;
  contentNiche: string;
  contentFrequency: string;
  followersRange: string;
  instagramFollowers: string;
  youtubeFollowers: string;
  tiktokFollowers: string;
  blogFollowers: string;
  instagramHandle: string;
  youtubeHandle: string;
  tiktokHandle: string;
  websiteUrl: string;
  motivation: string;
  experience: string;
}

export default function RegisterBuddyMaker() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    displayName: user?.name || "",
    bio: "",
    contentNiche: "",
    contentFrequency: "",
    followersRange: "",
    instagramFollowers: "",
    youtubeFollowers: "",
    tiktokFollowers: "",
    blogFollowers: "",
    instagramHandle: "",
    youtubeHandle: "",
    tiktokHandle: "",
    websiteUrl: "",
    motivation: "",
    experience: "",
  });

  const submitMutation = trpc.buddyApplications.submitApplication.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message || "Error al enviar la solicitud"),
  });

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const totalFollowers = () => {
    const sum = [form.instagramFollowers, form.youtubeFollowers, form.tiktokFollowers, form.blogFollowers]
      .map(v => parseInt(v) || 0)
      .reduce((a, b) => a + b, 0);
    if (sum === 0) return parseInt(form.followersRange) || 0;
    return sum;
  };

  const handleSubmit = () => {
    if (!form.displayName.trim()) {
      toast.error("El nombre de creador es obligatorio");
      return;
    }
    if (!form.contentNiche) {
      toast.error("Selecciona tu nicho de contenido");
      return;
    }
    if (!form.motivation.trim()) {
      toast.error("Cuéntanos tu motivación");
      return;
    }

    const platforms = JSON.stringify({
      instagram: { handle: form.instagramHandle, followers: parseInt(form.instagramFollowers) || 0 },
      youtube: { handle: form.youtubeHandle, followers: parseInt(form.youtubeFollowers) || 0 },
      tiktok: { handle: form.tiktokHandle, followers: parseInt(form.tiktokFollowers) || 0 },
      blog: { url: form.websiteUrl, followers: parseInt(form.blogFollowers) || 0 },
    });

    submitMutation.mutate({
      type: "maker",
      displayName: form.displayName,
      bio: form.bio || undefined,
      contentNiche: form.contentNiche || undefined,
      contentFrequency: form.contentFrequency || undefined,
      followersCount: totalFollowers() || undefined,
      platforms,
      instagramHandle: form.instagramHandle || undefined,
      youtubeHandle: form.youtubeHandle || undefined,
      tiktokHandle: form.tiktokHandle || undefined,
      websiteUrl: form.websiteUrl || undefined,
      motivation: form.motivation || undefined,
      experience: form.experience || undefined,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ChefHat className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Inicia sesión primero</h2>
          <p className="text-muted-foreground mb-6">Necesitas una cuenta para solicitar ser BuddyMaker.</p>
          <Button onClick={() => navigate("/login")} className="bg-orange-500 hover:bg-orange-600 w-full">
            Iniciar sesión
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">¡Solicitud enviada!</h1>
          <p className="text-muted-foreground mb-2">
            Hemos recibido tu solicitud para convertirte en <strong>BuddyMaker</strong>.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Nuestro equipo revisará tu perfil en un plazo de 2-5 días hábiles. Te notificaremos por email cuando tengamos una respuesta.
          </p>
          <div className="bg-background rounded-2xl p-6 shadow-sm border border-orange-100 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-3">¿Qué puedes hacer como BuddyMaker?</h3>
            <div className="space-y-3">
              {[
                "Publicar recetas con tus propias fotos e instrucciones",
                "Construir tu comunidad de seguidores en BuddyMarket",
                "Monetizar tus recetas premium",
                "Obtener estadísticas de alcance e impacto",
                "Generar ingresos con tu código de referido (20% comisión)",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => navigate("/app")} className="bg-orange-500 hover:bg-orange-600 w-full">
            Ir a la app
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Registro BuddyMaker</span>
          </div>
          <span className="text-sm text-muted-foreground/70">{step} / {STEPS.length}</span>
        </div>
        <div className="h-1 bg-muted/50">
          <div
            className="h-1 bg-orange-500 transition-all duration-500"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive ? "bg-orange-500 text-white" :
                  isDone ? "bg-orange-100 text-orange-700" :
                  "bg-muted/50 text-muted-foreground/70"
                }`}>
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
                {s.id < STEPS.length && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {/* STEP 1: Perfil creador */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tu perfil de creador</h2>
                  <p className="text-muted-foreground mt-1">Esta información aparecerá en tu perfil público como BuddyMaker.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Nombre de creador *</Label>
                    <Input
                      id="displayName"
                      placeholder="Ej: Recetas con María, El Chef Saludable..."
                      value={form.displayName}
                      onChange={(e) => update("displayName", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Descripción de tu contenido</Label>
                    <Textarea
                      id="bio"
                      placeholder="Cuéntanos sobre tu estilo de cocina, qué tipo de recetas creas y qué te diferencia..."
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      className="mt-1 min-h-[100px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground/70 mt-1">{form.bio.length}/500</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Contenido */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tu contenido</h2>
                  <p className="text-muted-foreground mt-1">Cuéntanos sobre el tipo de recetas que creas.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Nicho de contenido *</Label>
                    <p className="text-xs text-muted-foreground mb-2">¿En qué tipo de recetas te especializas?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CONTENT_NICHES.map((niche) => (
                        <button
                          key={niche.value}
                          type="button"
                          onClick={() => update("contentNiche", niche.value)}
                          className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                            form.contentNiche === niche.value
                              ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                              : "border-border hover:border-orange-200 hover:bg-orange-50/50"
                          }`}
                        >
                          {niche.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Frecuencia de publicación</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CONTENT_FREQUENCIES.map((freq) => (
                        <button
                          key={freq.value}
                          type="button"
                          onClick={() => update("contentFrequency", freq.value)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            form.contentFrequency === freq.value
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-border hover:border-orange-300"
                          }`}
                        >
                          {freq.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Tamaño aproximado de tu comunidad</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {FOLLOWERS_RANGES.map((range) => (
                        <button
                          key={range.value}
                          type="button"
                          onClick={() => update("followersRange", range.value)}
                          className={`text-left px-3 py-2 rounded-xl border text-sm transition-all ${
                            form.followersRange === range.value
                              ? "border-orange-500 bg-orange-50 text-orange-700 font-medium"
                              : "border-border hover:border-orange-200"
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Redes sociales */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tus redes sociales</h2>
                  <p className="text-muted-foreground mt-1">Comparte tus perfiles y el número de seguidores en cada plataforma.</p>
                </div>
                <div className="space-y-5">
                  {/* Instagram */}
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <span className="font-medium text-foreground">Instagram</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Usuario</Label>
                        <Input
                          placeholder="@tuusuario"
                          value={form.instagramHandle}
                          onChange={(e) => update("instagramHandle", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Seguidores</Label>
                        <Input
                          type="number"
                          placeholder="Ej: 15000"
                          value={form.instagramFollowers}
                          onChange={(e) => update("instagramFollowers", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* YouTube */}
                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Youtube className="w-5 h-5 text-red-500" />
                      <span className="font-medium text-foreground">YouTube</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Canal</Label>
                        <Input
                          placeholder="@tucanal"
                          value={form.youtubeHandle}
                          onChange={(e) => update("youtubeHandle", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Suscriptores</Label>
                        <Input
                          type="number"
                          placeholder="Ej: 5000"
                          value={form.youtubeFollowers}
                          onChange={(e) => update("youtubeFollowers", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="bg-muted/30 rounded-xl p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-black text-foreground">T</span>
                      <span className="font-medium text-foreground">TikTok</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Usuario</Label>
                        <Input
                          placeholder="@tuusuario"
                          value={form.tiktokHandle}
                          onChange={(e) => update("tiktokHandle", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Seguidores</Label>
                        <Input
                          type="number"
                          placeholder="Ej: 8000"
                          value={form.tiktokFollowers}
                          onChange={(e) => update("tiktokFollowers", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Blog / Web */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-foreground">Blog / Web</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">URL</Label>
                        <Input
                          placeholder="https://tublog.com"
                          value={form.websiteUrl}
                          onChange={(e) => update("websiteUrl", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Visitas/mes</Label>
                        <Input
                          type="number"
                          placeholder="Ej: 2000"
                          value={form.blogFollowers}
                          onChange={(e) => update("blogFollowers", e.target.value)}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {totalFollowers() > 0 && (
                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          Comunidad total: {totalFollowers().toLocaleString("es-ES")} personas
                        </p>
                        <p className="text-xs text-orange-600">Suma de todas tus plataformas</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Motivación */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tu motivación</h2>
                  <p className="text-muted-foreground mt-1">Cuéntanos por qué quieres ser BuddyMaker en BuddyMarket.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="motivation">¿Por qué quieres unirte como BuddyMaker? *</Label>
                    <Textarea
                      id="motivation"
                      placeholder="Cuéntanos qué te motiva a compartir tus recetas en BuddyMarket, qué tipo de contenido crearías y qué esperas de la plataforma..."
                      value={form.motivation}
                      onChange={(e) => update("motivation", e.target.value)}
                      className="mt-1 min-h-[120px]"
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground/70 mt-1">{form.motivation.length}/1000</p>
                  </div>
                  <div>
                    <Label htmlFor="experience">Experiencia creando contenido</Label>
                    <Textarea
                      id="experience"
                      placeholder="¿Cuánto tiempo llevas creando contenido? ¿Has colaborado con otras marcas o plataformas?"
                      value={form.experience}
                      onChange={(e) => update("experience", e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>

                  {/* Resumen */}
                  <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                    <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <ChefHat className="w-4 h-4" />
                      Resumen de tu solicitud
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nombre</span>
                        <span className="font-medium">{form.displayName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nicho</span>
                        <span className="font-medium">{CONTENT_NICHES.find(n => n.value === form.contentNiche)?.label || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Frecuencia</span>
                        <span className="font-medium">{CONTENT_FREQUENCIES.find(f => f.value === form.contentFrequency)?.label || "—"}</span>
                      </div>
                      {totalFollowers() > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Comunidad total</span>
                          <span className="font-medium">{totalFollowers().toLocaleString("es-ES")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Tiempo de revisión: 2-5 días hábiles</p>
                      <p className="text-xs text-amber-700 mt-0.5">Nuestro equipo revisará tu solicitud y te notificará por email.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/")}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {step > 1 ? "Anterior" : "Cancelar"}
              </Button>
              {step < STEPS.length ? (
                <Button
                  onClick={() => {
                    if (step === 1 && !form.displayName.trim()) {
                      toast.error("El nombre de creador es obligatorio");
                      return;
                    }
                    if (step === 2 && !form.contentNiche) {
                      toast.error("Selecciona tu nicho de contenido");
                      return;
                    }
                    setStep(s => s + 1);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 gap-2"
                >
                  {submitMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                  {!submitMutation.isPending && <CheckCircle2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-6 bg-background rounded-2xl border border-border/50 p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" />
            Beneficios de ser BuddyMaker
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Publicar recetas con tu marca",
              "Comunidad de seguidores propia",
              "Monetización de recetas premium",
              "Badge BuddyMaker verificado",
              "Estadísticas de alcance",
              "Código de referido (20% comisión)",
              "Herramientas de creación",
              "Soporte prioritario",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
