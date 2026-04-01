import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation, Link } from "wouter";

const FEATURES = [
  { emoji: "🥗", title: "Recetas inteligentes", desc: "Miles de recetas con información nutricional completa y filtros avanzados." },
  { emoji: "📅", title: "Planificador de menús", desc: "Organiza tus comidas semanales y genera menús automáticos con IA." },
  { emoji: "🛒", title: "Lista de compra", desc: "Genera tu lista de la compra automáticamente desde tu menú planificado." },
  { emoji: "📦", title: "Control de inventario", desc: "Gestiona tu despensa y recibe alertas de caducidades próximas." },
  { emoji: "📊", title: "Seguimiento nutricional", desc: "Registra tus comidas y controla tus macronutrientes diarios." },
  { emoji: "✨", title: "IA nutricional", desc: "Recomendaciones personalizadas basadas en tus objetivos y preferencias." },
];

const PLANS = [
  {
    name: "Básico",
    price: "Gratis",
    period: "",
    features: ["5 recetas guardadas", "Planificador semanal", "Lista de compra básica"],
    cta: "Empezar gratis",
    highlight: false,
  },
  {
    name: "Premium",
    price: "9,99€",
    period: "/mes",
    features: ["Recetas ilimitadas", "Menús con IA", "Inventario completo", "Seguimiento nutricional", "Soporte prioritario"],
    cta: "Probar Premium",
    highlight: true,
  },
  {
    name: "Pro Max",
    price: "19,99€",
    period: "/mes",
    features: ["Todo en Premium", "Perfil médico avanzado", "Consultas con expertos", "API de integración"],
    cta: "Contactar",
    highlight: false,
  },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F97316] border-t-transparent" />
          <span className="text-sm text-gray-500">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F97316]">
              <span className="text-base">🥦</span>
            </div>
            <span className="text-lg font-bold text-gray-900">VIVELY</span>
          </div>
          <div className="flex items-center gap-2">
            {!loading && isAuthenticated ? (
              <Link href="/dashboard" className="rounded-full bg-[#F97316] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#EA6C0A]">
                Ir al dashboard →
              </Link>
            ) : (
              <a href={getLoginUrl()} className="rounded-full bg-[#F97316] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#EA6C0A]">
                Entrar
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-white px-4 py-20 text-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#F97316]/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F97316]/10 px-4 py-1.5 text-sm font-semibold text-orange-600">
            <span>✨</span>
            <span>Tu asistente nutricional inteligente</span>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Come mejor,<br />
            <span className="text-[#F97316]">vive más sano</span>
          </h1>
          <p className="mb-8 text-base text-gray-500 sm:text-lg">
            VIVELY te ayuda a planificar tus comidas, controlar tu nutrición y organizar tu despensa de forma inteligente.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={getLoginUrl()}
              className="w-full rounded-2xl bg-[#F97316] px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-[#EA6C0A] hover:shadow-xl sm:w-auto"
            >
              Empezar gratis →
            </a>
            <a
              href="#features"
              className="w-full rounded-2xl border-2 border-gray-200 px-8 py-4 text-base font-semibold text-gray-700 transition-all hover:border-[#F97316] sm:w-auto"
            >
              Ver funciones
            </a>
          </div>
          <p className="mt-4 text-xs text-gray-400">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-6 px-4 text-center">
          {[
            { value: "10k+", label: "Usuarios activos" },
            { value: "50k+", label: "Recetas disponibles" },
            { value: "98%", label: "Satisfacción" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-extrabold text-[#F97316] sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Todo lo que necesitas
          </h2>
          <p className="mb-10 text-center text-sm text-gray-500">
            Una plataforma completa para gestionar tu alimentación
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-[#F97316]/30 hover:shadow-md"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl transition-transform group-hover:scale-110">
                  {f.emoji}
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-orange-50 px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-900">
            Cómo funciona
          </h2>
          <p className="mb-10 text-center text-sm text-gray-500">En 3 simples pasos</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { step: "1", emoji: "👤", title: "Crea tu perfil", desc: "Cuéntanos tus objetivos, alergias y preferencias dietéticas." },
              { step: "2", emoji: "📅", title: "Planifica tu menú", desc: "Elige recetas o deja que la IA genere un menú personalizado." },
              { step: "3", emoji: "🛒", title: "Compra y cocina", desc: "Tu lista de compra se genera automáticamente. ¡A cocinar!" },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#F97316] text-2xl shadow-md">
                  {item.emoji}
                </div>
                <div className="absolute -top-1 left-1/2 ml-6 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mb-1 text-sm font-bold text-gray-900">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-900">
            Planes y precios
          </h2>
          <p className="mb-10 text-center text-sm text-gray-500">Elige el plan que mejor se adapta a ti</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-6 ${
                  plan.highlight
                    ? "bg-[#F97316] text-white shadow-xl shadow-[#F97316]/25"
                    : "border border-gray-100 bg-white shadow-sm"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-[10px] font-bold text-white">
                    MÁS POPULAR
                  </div>
                )}
                <h3 className={`mb-1 text-base font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h3>
                <div className="mb-4 flex items-baseline gap-1">
                  <span className={`text-3xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? "text-white/70" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-xs ${plan.highlight ? "text-white/90" : "text-gray-600"}`}>
                      <span className={`text-base ${plan.highlight ? "text-white" : "text-[#F97316]"}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={getLoginUrl()}
                  className={`block w-full rounded-2xl py-3 text-center text-sm font-bold transition-all ${
                    plan.highlight
                      ? "bg-white text-[#F97316] hover:bg-gray-50"
                      : "border-2 border-[#F97316] text-[#F97316] hover:bg-[#F97316]/5"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F97316] px-4 py-16 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">
            Empieza hoy mismo
          </h2>
          <p className="mb-8 text-sm text-white/80">
            Únete a miles de personas que ya cuidan su alimentación con VIVELY.
          </p>
          <a
            href={getLoginUrl()}
            className="inline-block rounded-2xl bg-white px-8 py-4 text-base font-bold text-[#F97316] shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
          >
            Crear cuenta gratis →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F97316]">
            <span className="text-sm">🥦</span>
          </div>
          <span className="text-base font-bold text-gray-900">VIVELY</span>
        </div>
        <p className="text-xs text-gray-400">© 2026 VIVELY. Todos los derechos reservados.</p>
        <p className="mt-2 text-[10px] text-gray-300">
          VIVELY no constituye asesoramiento médico o nutricional profesional.
        </p>
      </footer>
    </div>
  );
}
