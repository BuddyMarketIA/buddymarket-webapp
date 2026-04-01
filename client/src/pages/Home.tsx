import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Apple,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Package,
  ShoppingCart,
  Sparkles,
  Star,
  Utensils,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: BookOpen,
    title: "Recetas Inteligentes",
    description: "Crea y descubre recetas con información nutricional completa, filtros por alergias y restricciones dietéticas.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Calendar,
    title: "Planificador de Menús",
    description: "Organiza tus menús semanales o mensuales. Genera planes automáticos con IA basados en tus preferencias.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: ShoppingCart,
    title: "Lista de Compra",
    description: "Genera listas de compra automáticamente desde tus menús planificados, agrupadas por categorías.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: Package,
    title: "Inventario Alimentario",
    description: "Controla tu despensa, nevera y congelador. Recibe alertas de productos próximos a vencer.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: BarChart3,
    title: "Seguimiento Nutricional",
    description: "Registra tus comidas y monitoriza el consumo diario de calorías, proteínas, carbohidratos y grasas.",
    color: "bg-pink-100 text-pink-700",
  },
  {
    icon: Sparkles,
    title: "IA Personalizada",
    description: "Recibe recomendaciones y genera menús con inteligencia artificial adaptados a tu perfil y objetivos.",
    color: "bg-yellow-100 text-yellow-700",
  },
];

const benefits = [
  "Perfil médico y nutricional personalizado",
  "Gestión de alergias y restricciones dietéticas",
  "Objetivos de salud y seguimiento de métricas",
  "Más de 14 alergias y 11 restricciones dietéticas",
  "Historial completo de comidas",
  "Panel administrativo completo",
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Apple className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              BuddyMarket
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              isAuthenticated ? (
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    Ir al dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={getLoginUrl()}>Iniciar sesión</a>
                  </Button>
                  <Button size="sm" asChild>
                    <a href={getLoginUrl()}>
                      Comenzar gratis <ArrowRight className="w-4 h-4 ml-1.5" />
                    </a>
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        </div>

        <div className="container py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Gestión nutricional con IA
            </Badge>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Tu compañero inteligente para{" "}
              <span className="text-primary">comer mejor</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              BuddyMarket te ayuda a organizar tu alimentación de forma inteligente. Planifica menús, gestiona recetas,
              controla tu inventario y alcanza tus objetivos nutricionales con la ayuda de la IA.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base px-8 h-12" asChild>
                <a href={getLoginUrl()}>
                  Empezar ahora — es gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12 bg-background" asChild>
                <Link href="/recipes">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Ver recetas
                </Link>
              </Button>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  {["E", "M", "A", "J"].map((l, i) => (
                    <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                      {l}
                    </div>
                  ))}
                </div>
                <span>+1,200 usuarios activos</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Todo lo que necesitas para comer bien
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Una plataforma completa para gestionar tu alimentación de principio a fin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-md transition-shadow duration-200"
              >
                <div className={`w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-5.5 h-5.5" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Personalización total
              </Badge>
              <h2
                className="text-3xl sm:text-4xl font-bold text-foreground mb-6"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Adaptado a ti y tus necesidades
              </h2>
              <p className="text-muted-foreground text-base mb-8 leading-relaxed">
                BuddyMarket aprende de tus preferencias, alergias, restricciones dietéticas y objetivos de salud para
                ofrecerte recomendaciones completamente personalizadas.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild>
                  <a href={getLoginUrl()}>
                    Crear mi perfil nutricional
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Visual card */}
            <div className="relative">
              <div className="bg-card rounded-3xl border border-border p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <Utensils className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Menú de hoy</p>
                    <p className="text-xs text-muted-foreground">Martes, 1 de Abril</p>
                  </div>
                </div>

                {[
                  { meal: "Desayuno", recipe: "Avena con frutas y semillas", cal: 380 },
                  { meal: "Comida", recipe: "Pollo al horno con verduras", cal: 520 },
                  { meal: "Merienda", recipe: "Yogur con nueces", cal: 180 },
                  { meal: "Cena", recipe: "Ensalada mediterránea", cal: 320 },
                ].map((item) => (
                  <div key={item.meal} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs text-muted-foreground">{item.meal}</p>
                      <p className="text-sm font-medium text-foreground">{item.recipe}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{item.cal} kcal</Badge>
                  </div>
                ))}

                <div className="mt-4 p-3 bg-primary/10 rounded-xl">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-muted-foreground">Total calorías</span>
                    <span className="font-semibold text-primary">1,400 / 2,000 kcal</span>
                  </div>
                  <div className="w-full bg-primary/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "70%" }} />
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-primary text-primary-foreground rounded-2xl px-4 py-2 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-semibold">Generado con IA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Empieza a comer mejor hoy
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Únete a miles de personas que ya están mejorando su alimentación con BuddyMarket.
          </p>
          <Button size="lg" variant="secondary" className="text-base px-8 h-12" asChild>
            <a href={getLoginUrl()}>
              Crear cuenta gratuita
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Apple className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm text-foreground">BuddyMarket</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              El contenido de BuddyMarket no constituye recomendaciones profesionales de salud o nutrición.
              Consulta siempre con un profesional cualificado.
            </p>
            <p className="text-xs text-muted-foreground">© 2024 BuddyMarket</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
