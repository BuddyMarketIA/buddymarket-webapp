/**
 * ProfileApplicationForm — Application form for BuddyExpert, BuddyMaker, Colaborador
 * Shown after user selects a role that requires admin approval.
 */
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

type ProfileType = "buddyexpert" | "buddymaker" | "colaborador";

const PROFILE_CONFIG: Record<ProfileType, {
  emoji: string;
  title: string;
  motivationLabel: string;
  motivationPlaceholder: string;
  experienceLabel: string;
  experiencePlaceholder: string;
  showSpecialties: boolean;
  showCertifications: boolean;
  showPortfolio: boolean;
  showReferral: boolean;
  specialtiesLabel?: string;
  specialtiesOptions?: string[];
}> = {
  buddyexpert: {
    emoji: "👨‍⚕️",
    title: "BuddyExpert",
    motivationLabel: "¿Por qué quieres ser BuddyExpert?",
    motivationPlaceholder: "Cuéntanos tu motivación para unirte como experto en nutrición...",
    experienceLabel: "Experiencia profesional",
    experiencePlaceholder: "Describe tu formación, años de experiencia, especialidades...",
    showSpecialties: true,
    showCertifications: true,
    showPortfolio: true,
    showReferral: false,
    specialtiesLabel: "Especialidades",
    specialtiesOptions: [
      "Nutrición deportiva", "Pérdida de peso", "Nutrición clínica", "Nutrición infantil",
      "Nutrición vegana/vegetariana", "Trastornos alimentarios", "Nutrición oncológica",
      "Diabetes y metabolismo", "Nutrición geriátrica", "Alergias e intolerancias",
    ],
  },
  buddymaker: {
    emoji: "👨‍🍳",
    title: "BuddyMaker",
    motivationLabel: "¿Por qué quieres ser BuddyMaker?",
    motivationPlaceholder: "Cuéntanos tu pasión por la cocina y el contenido gastronómico...",
    experienceLabel: "Experiencia creando contenido",
    experiencePlaceholder: "Describe tu experiencia en cocina, redes sociales, número de seguidores...",
    showSpecialties: true,
    showCertifications: false,
    showPortfolio: true,
    showReferral: false,
    specialtiesLabel: "Tipo de contenido",
    specialtiesOptions: [
      "Recetas saludables", "Cocina mediterránea", "Repostería", "Cocina vegana",
      "Cocina internacional", "Comida rápida saludable", "Nutrición deportiva",
      "Recetas para niños", "Cocina sin gluten", "Cocina de autor",
    ],
  },
  colaborador: {
    emoji: "🤝",
    title: "Colaborador",
    motivationLabel: "¿Por qué quieres colaborar con BuddyMarket?",
    motivationPlaceholder: "Cuéntanos cómo planeas ayudar a crecer la comunidad BuddyMarket...",
    experienceLabel: "Red de contactos y experiencia",
    experiencePlaceholder: "Describe tu red de contactos, sector en el que trabajas, cómo podrías aportar...",
    showSpecialties: false,
    showCertifications: false,
    showPortfolio: false,
    showReferral: true,
  },
};

export default function ProfileApplicationForm() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const profileType = (params.get("type") ?? "buddyexpert") as ProfileType;
  const config = PROFILE_CONFIG[profileType] ?? PROFILE_CONFIG.buddyexpert;

  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [certifications, setCertifications] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [referralNetwork, setReferralNetwork] = useState("");
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();
  const submitApplication = trpc.profileSetup.submitApplication.useMutation();

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    if (motivation.trim().length < 10) {
      toast.error("Por favor, escribe al menos 10 caracteres en la motivación.");
      return;
    }
    setLoading(true);
    try {
      await submitApplication.mutateAsync({
        profileType,
        motivation: motivation.trim(),
        experience: experience.trim() || undefined,
        socialLinks: { instagram: instagram || undefined, website: website || undefined },
        specialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
        certifications: certifications ? certifications.split("\n").map(s => s.trim()).filter(Boolean) : undefined,
        portfolioUrl: portfolioUrl || undefined,
        referralNetwork: referralNetwork || undefined,
      });
      await utils.auth.me.invalidate();
      setLocation("/profile-setup/pending");
    } catch {
      toast.error("Error al enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f3] to-[#fff5ec]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-12 pb-6">
        <button
          onClick={() => setLocation("/profile-setup")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm text-muted-foreground"
        >
          ←
        </button>
        <div>
          <p className="text-xs text-muted-foreground">Solicitud de perfil</p>
          <h1 className="text-xl font-extrabold text-foreground">
            {config.emoji} {config.title}
          </h1>
        </div>
      </div>

      <div className="px-6 pb-16 max-w-2xl mx-auto space-y-6">
        {/* Info banner */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <span className="text-xl shrink-0">📋</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">Revisaremos tu solicitud en 24-48h</p>
            <p className="text-xs text-amber-700 mt-1">
              Completa el formulario con la mayor información posible para agilizar la aprobación.
            </p>
          </div>
        </div>

        {/* Motivation */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            {config.motivationLabel} <span className="text-orange-500">*</span>
          </label>
          <textarea
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
            placeholder={config.motivationPlaceholder}
            rows={4}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{motivation.length}/2000 caracteres</p>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            {config.experienceLabel}
          </label>
          <textarea
            value={experience}
            onChange={e => setExperience(e.target.value)}
            placeholder={config.experiencePlaceholder}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
        </div>

        {/* Specialties */}
        {config.showSpecialties && config.specialtiesOptions && (
          <div>
            <label className="block text-sm font-bold text-foreground mb-3">
              {config.specialtiesLabel}
            </label>
            <div className="flex flex-wrap gap-2">
              {config.specialtiesOptions.map(s => (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedSpecialties.includes(s)
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {config.showCertifications && (
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Titulaciones y certificaciones
            </label>
            <textarea
              value={certifications}
              onChange={e => setCertifications(e.target.value)}
              placeholder={"Graduado en Nutrición Humana y Dietética - Universidad Complutense\nMáster en Nutrición Deportiva - UCAM\n..."}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Una por línea</p>
          </div>
        )}

        {/* Social links */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-foreground">Redes sociales / web</label>
          <div className="flex items-center gap-3">
            <span className="text-lg">📸</span>
            <input
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              placeholder="@tu_usuario_instagram"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">🌐</span>
            <input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://tu-web.com"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        {/* Portfolio */}
        {config.showPortfolio && (
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Portfolio o ejemplos de trabajo
            </label>
            <input
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://mi-portfolio.com"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        )}

        {/* Referral network */}
        {config.showReferral && (
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              ¿Cómo planeas generar suscripciones?
            </label>
            <textarea
              value={referralNetwork}
              onChange={e => setReferralNetwork(e.target.value)}
              placeholder="Describe tu red de contactos, canales de comunicación, estrategia de captación..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || motivation.trim().length < 10}
          className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 disabled:opacity-40 transition-all active:scale-95 hover:bg-orange-600"
        >
          {loading ? "Enviando solicitud…" : "Enviar solicitud →"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Recibirás una notificación cuando tu solicitud sea revisada.
        </p>
      </div>
    </div>
  );
}
