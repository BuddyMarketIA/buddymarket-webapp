import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Stethoscope, Users,
  Globe, Instagram, Youtube, Star, Shield, BookOpen, Clock, Euro
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Tu perfil profesional", icon: Stethoscope },
  { id: 2, title: "Credenciales y experiencia", icon: Shield },
  { id: 3, title: "Servicios y tarifas", icon: Euro },
  { id: 4, title: "Presencia online", icon: Globe },
  { id: 5, title: "Motivación", icon: Star },
];

const EXPERT_CATEGORIES = [
  { value: "nutricionista", label: "Nutricionista Clínica" },
  { value: "dietista", label: "Dietista-Nutricionista" },
  { value: "deportivo", label: "Nutrición Deportiva" },
  { value: "pediatrico", label: "Nutrición Pediátrica" },
  { value: "oncologico", label: "Nutrición Oncológica" },
  { value: "digestivo", label: "Patología Digestiva" },
  { value: "endocrino", label: "Endocrinología y Diabetes" },
  { value: "psicologia", label: "Psiconutrición" },
  { value: "vegetariano", label: "Nutrición Vegetariana/Vegana" },
  { value: "otro", label: "Otra especialidad" },
];

const SERVICES = [
  { value: "consulta_online", label: "Consulta online" },
  { value: "consulta_presencial", label: "Consulta presencial" },
  { value: "seguimiento_mensual", label: "Seguimiento mensual" },
  { value: "plan_nutricional", label: "Plan nutricional personalizado" },
  { value: "menu_semanal", label: "Menú semanal" },
  { value: "analisis_dieta", label: "Análisis de dieta" },
  { value: "coaching_grupal", label: "Coaching grupal" },
  { value: "talleres", label: "Talleres y webinars" },
];

const TARGET_AUDIENCES = [
  { value: "adultos", label: "Adultos en general" },
  { value: "deportistas", label: "Deportistas" },
  { value: "ninos", label: "Niños y adolescentes" },
  { value: "mayores", label: "Personas mayores" },
  { value: "embarazadas", label: "Embarazadas y lactancia" },
  { value: "patologias", label: "Patologías crónicas" },
  { value: "perdida_peso", label: "Pérdida de peso" },
  { value: "ganancia_muscular", label: "Ganancia muscular" },
];

interface FormData {
  displayName: string;
  bio: string;
  specialty: string;
  expertCategory: string;
  certifications: string;
  collegiateNumber: string;
  yearsExperience: string;
  servicesOffered: string[];
  consultationPrice: string;
  targetAudience: string[];
  instagramHandle: string;
  youtubeHandle: string;
  tiktokHandle: string;
  websiteUrl: string;
  motivation: string;
  experience: string;
}

export default function RegisterBuddyExpert() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FormData>({
    displayName: user?.name || "",
    bio: "",
    specialty: "",
    expertCategory: "",
    certifications: "",
    collegiateNumber: "",
    yearsExperience: "",
    servicesOffered: [],
    consultationPrice: "",
    targetAudience: [],
    instagramHandle: "",
    youtubeHandle: "",
    tiktokHandle: "",
    websiteUrl: "",
    motivation: "",
    experience: "",
  });

  const submitMutation = trpc.buddyApplications.submitApplication.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message || "Error al enviar la solicitud");
    },
  });

  const update = (field: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: "servicesOffered" | "targetAudience", value: string) => {
    setForm((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleSubmit = () => {
    if (!form.displayName.trim()) {
      toast.error("El nombre profesional es obligatorio");
      return;
    }
    if (!form.expertCategory) {
      toast.error("Selecciona tu especialidad");
      return;
    }
    if (!form.motivation.trim()) {
      toast.error("Cuéntanos tu motivación");
      return;
    }
    submitMutation.mutate({
      type: "expert",
      displayName: form.displayName,
      bio: form.bio || undefined,
      specialty: form.specialty || undefined,
      expertCategory: form.expertCategory || undefined,
      certifications: form.certifications || undefined,
      collegiateNumber: form.collegiateNumber || undefined,
      yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
      servicesOffered: form.servicesOffered.length > 0 ? JSON.stringify(form.servicesOffered) : undefined,
      consultationPrice: form.consultationPrice ? parseFloat(form.consultationPrice) : undefined,
      targetAudience: form.targetAudience.length > 0 ? JSON.stringify(form.targetAudience) : undefined,
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
          <Stethoscope className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Inicia sesión primero</h2>
          <p className="text-muted-foreground mb-6">Necesitas una cuenta para solicitar ser BuddyExpert.</p>
          <Button onClick={() => navigate("/login")} className="bg-emerald-500 hover:bg-emerald-600 w-full">
            Iniciar sesión
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">¡Solicitud enviada!</h1>
          <p className="text-muted-foreground mb-2">
            Hemos recibido tu solicitud para convertirte en <strong>BuddyExpert</strong>.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Nuestro equipo revisará tu perfil en un plazo de 2-5 días hábiles. Te notificaremos por email cuando tengamos una respuesta.
          </p>
          <div className="bg-background rounded-2xl p-6 shadow-sm border border-emerald-100 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-3">¿Qué ocurre ahora?</h3>
            <div className="space-y-3">
              {[
                "Revisamos tus credenciales y experiencia",
                "Verificamos tu número de colegiado si lo has proporcionado",
                "Te enviamos un email de confirmación o solicitud de más info",
                "Una vez aprobado, accedes al panel BuddyExpert",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => navigate("/app")} className="bg-emerald-500 hover:bg-emerald-600 w-full">
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
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Registro BuddyExpert</span>
          </div>
          <span className="text-sm text-muted-foreground/70">{step} / {STEPS.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted/50">
          <div
            className="h-1 bg-emerald-500 transition-all duration-500"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive ? "bg-emerald-500 text-white" :
                  isDone ? "bg-emerald-100 text-emerald-700" :
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
            {/* STEP 1: Perfil profesional */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tu perfil profesional</h2>
                  <p className="text-muted-foreground mt-1">Esta información aparecerá en tu perfil público como BuddyExpert.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Nombre profesional *</Label>
                    <Input
                      id="displayName"
                      placeholder="Ej: Dra. María García, Nutricionista"
                      value={form.displayName}
                      onChange={(e) => update("displayName", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty">Título / Cargo</Label>
                    <Input
                      id="specialty"
                      placeholder="Ej: Dietista-Nutricionista Colegiada"
                      value={form.specialty}
                      onChange={(e) => update("specialty", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Especialidad principal *</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {EXPERT_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => update("expertCategory", cat.value)}
                          className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                            form.expertCategory === cat.value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                              : "border-border hover:border-emerald-200 hover:bg-emerald-50/50"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Descripción profesional</Label>
                    <Textarea
                      id="bio"
                      placeholder="Cuéntanos sobre tu enfoque, filosofía y cómo ayudas a tus pacientes..."
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

            {/* STEP 2: Credenciales */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Credenciales y experiencia</h2>
                  <p className="text-muted-foreground mt-1">Estos datos nos ayudan a verificar tu perfil profesional.</p>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="collegiateNumber">Número de colegiado</Label>
                      <Input
                        id="collegiateNumber"
                        placeholder="Ej: AND-1234"
                        value={form.collegiateNumber}
                        onChange={(e) => update("collegiateNumber", e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground/70 mt-1">Opcional pero recomendado para verificación</p>
                    </div>
                    <div>
                      <Label htmlFor="yearsExperience">Años de experiencia</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Ej: 5"
                        value={form.yearsExperience}
                        onChange={(e) => update("yearsExperience", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="certifications">Formación y certificaciones</Label>
                    <Textarea
                      id="certifications"
                      placeholder="Ej: Graduada en Nutrición Humana y Dietética (Universidad de Granada), Máster en Nutrición Deportiva (UCAM), Certificación en Psiconutrición..."
                      value={form.certifications}
                      onChange={(e) => update("certifications", e.target.value)}
                      className="mt-1 min-h-[120px]"
                    />
                  </div>
                  <div>
                    <Label>Público objetivo</Label>
                    <p className="text-xs text-muted-foreground mb-2">¿A quién va dirigida principalmente tu práctica?</p>
                    <div className="flex flex-wrap gap-2">
                      {TARGET_AUDIENCES.map((aud) => (
                        <button
                          key={aud.value}
                          type="button"
                          onClick={() => toggleArray("targetAudience", aud.value)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            form.targetAudience.includes(aud.value)
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border hover:border-emerald-300"
                          }`}
                        >
                          {aud.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Servicios y tarifas */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Servicios y tarifas</h2>
                  <p className="text-muted-foreground mt-1">Define qué servicios ofreces y tu precio orientativo.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Servicios que ofreces</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {SERVICES.map((svc) => (
                        <button
                          key={svc.value}
                          type="button"
                          onClick={() => toggleArray("servicesOffered", svc.value)}
                          className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                            form.servicesOffered.includes(svc.value)
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-border hover:border-emerald-200"
                          }`}
                        >
                          {form.servicesOffered.includes(svc.value) && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          )}
                          {svc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="consultationPrice">Precio orientativo por consulta (€)</Label>
                    <div className="relative mt-1">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        id="consultationPrice"
                        type="number"
                        min="0"
                        max="9999"
                        placeholder="Ej: 60"
                        value={form.consultationPrice}
                        onChange={(e) => update("consultationPrice", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-1">Este precio es orientativo y lo podrás ajustar en tu perfil</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Presencia online */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Presencia online</h2>
                  <p className="text-muted-foreground mt-1">Tus redes sociales y web profesional (opcional).</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="instagramHandle">Instagram</Label>
                    <div className="relative mt-1">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        id="instagramHandle"
                        placeholder="@tuusuario"
                        value={form.instagramHandle}
                        onChange={(e) => update("instagramHandle", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="youtubeHandle">YouTube</Label>
                    <div className="relative mt-1">
                      <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        id="youtubeHandle"
                        placeholder="@tucanal"
                        value={form.youtubeHandle}
                        onChange={(e) => update("youtubeHandle", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tiktokHandle">TikTok</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-sm font-bold">T</span>
                      <Input
                        id="tiktokHandle"
                        placeholder="@tuusuario"
                        value={form.tiktokHandle}
                        onChange={(e) => update("tiktokHandle", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="websiteUrl">Web profesional</Label>
                    <div className="relative mt-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                      <Input
                        id="websiteUrl"
                        placeholder="https://tuweb.com"
                        value={form.websiteUrl}
                        onChange={(e) => update("websiteUrl", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Motivación */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Tu motivación</h2>
                  <p className="text-muted-foreground mt-1">Cuéntanos por qué quieres ser BuddyExpert en Buddy One.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="motivation">¿Por qué quieres unirte como BuddyExpert? *</Label>
                    <Textarea
                      id="motivation"
                      placeholder="Cuéntanos qué te motiva a unirte a Buddy One, cómo crees que puedes ayudar a los usuarios y qué esperas de la plataforma..."
                      value={form.motivation}
                      onChange={(e) => update("motivation", e.target.value)}
                      className="mt-1 min-h-[120px]"
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground/70 mt-1">{form.motivation.length}/1000</p>
                  </div>
                  <div>
                    <Label htmlFor="experience">Experiencia con plataformas digitales</Label>
                    <Textarea
                      id="experience"
                      placeholder="¿Has trabajado antes con pacientes online? ¿Tienes experiencia con apps de nutrición o telemedicina?"
                      value={form.experience}
                      onChange={(e) => update("experience", e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                  </div>

                  {/* Resumen */}
                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                    <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Resumen de tu solicitud
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nombre</span>
                        <span className="font-medium">{form.displayName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Especialidad</span>
                        <span className="font-medium">{EXPERT_CATEGORIES.find(c => c.value === form.expertCategory)?.label || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Experiencia</span>
                        <span className="font-medium">{form.yearsExperience ? `${form.yearsExperience} años` : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Servicios</span>
                        <span className="font-medium">{form.servicesOffered.length} seleccionados</span>
                      </div>
                      {form.consultationPrice && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio consulta</span>
                          <span className="font-medium">{form.consultationPrice}€</span>
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
                      toast.error("El nombre profesional es obligatorio");
                      return;
                    }
                    if (step === 1 && !form.expertCategory) {
                      toast.error("Selecciona tu especialidad");
                      return;
                    }
                    setStep(s => s + 1);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 gap-2"
                >
                  {submitMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                  {!submitMutation.isPending && <CheckCircle2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits sidebar */}
        <div className="mt-6 bg-background rounded-2xl border border-border/50 p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" />
            Beneficios de ser BuddyExpert
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              "Panel de gestión de pacientes",
              "Subir planes y menús personalizados",
              "Mensajería directa con usuarios",
              "Badge verificado en tu perfil",
              "Monetización de planes premium",
              "Código de referido con comisión 20%",
              "Estadísticas y analíticas",
              "Soporte prioritario",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
