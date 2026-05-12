import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/sonner-a11y-shim";
import {
  Building2, Users, TrendingUp, CheckCircle2, ArrowRight,
  Calculator, Shield, Zap, Heart, BarChart3, Headphones,
  Star, ChevronDown, ChevronUp, Mail, Phone, Lock,
  Sparkles, Clock, Globe, Award
} from "lucide-react";

// ─── Pricing tiers ──────────────────────────────────────────────────────────
const PRICING_TIERS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: 3.90,
    benefit: 2.50,
    employees: "10–49",
    minEmployees: 10,
    maxEmployees: 49,
    badge: null,
    features: [
      "App completa con menús IA",
      "Lista de la compra automática",
      "Seguimiento de macros",
      "Códigos de activación",
      "Soporte por email",
    ],
  },
  {
    id: "growth" as const,
    name: "Growth",
    price: 3.50,
    benefit: 2.10,
    employees: "50–199",
    minEmployees: 50,
    maxEmployees: 199,
    badge: null,
    features: [
      "Todo lo de Starter",
      "Panel RRHH con métricas",
      "Onboarding dedicado",
      "Alta masiva por CSV",
      "Soporte prioritario",
    ],
  },
  {
    id: "business" as const,
    name: "Business",
    price: 3.40,
    benefit: 2.00,
    employees: "200–499",
    minEmployees: 200,
    maxEmployees: 499,
    badge: "Más popular",
    features: [
      "Todo lo de Growth",
      "BuddyCoach grupal mensual",
      "Informes PDF mensuales",
      "Webinars de nutrición",
      "Cuenta ejecutiva",
    ],
  },
  {
    id: "enterprise" as const,
    name: "Enterprise",
    price: 2.50,
    benefit: 1.10,
    employees: "500–999",
    minEmployees: 500,
    maxEmployees: 999,
    badge: null,
    features: [
      "Todo lo de Business",
      "SSO (Google / Microsoft)",
      "SLA 99,9%",
      "API de integración HRIS",
      "Soporte 24/5",
    ],
  },
  {
    id: "corporate" as const,
    name: "Corporate",
    price: 2.20,
    benefit: 0.80,
    employees: "1.000–4.999",
    minEmployees: 1000,
    maxEmployees: 4999,
    badge: null,
    features: [
      "Todo lo de Enterprise",
      "Integración HRIS completa",
      "Bienestar personalizado",
      "Eventos presenciales",
      "Soporte 24/7",
    ],
  },
  {
    id: "global" as const,
    name: "Global",
    price: 1.90,
    benefit: 0.50,
    employees: "5.000+",
    minEmployees: 5000,
    maxEmployees: 99999,
    badge: "Mejor precio",
    features: [
      "Todo lo de Corporate",
      "Multi-país / multi-idioma",
      "API dedicada premium",
      "Consultoría estratégica",
      "Condiciones a medida",
    ],
  },
];

const INDUSTRIES = [
  "Tecnología", "Finanzas y Banca", "Salud y Farmacia", "Retail y Comercio",
  "Manufactura", "Educación", "Consultoría", "Medios y Comunicación",
  "Logística y Transporte", "Hostelería y Turismo", "Sector Público", "Otro",
];

const FAQS = [
  {
    q: "¿Cómo funciona el sistema de activación?",
    a: "Tras contratar el plan, recibirás un código único de empresa (ej: TUEMPRESA2025). Lo distribuyes por email o Slack y cada empleado lo introduce en la app para activar su acceso Pro Max de forma inmediata, sin necesidad de que compartan datos personales contigo.",
  },
  {
    q: "¿Qué datos de mis empleados recibo como RRHH?",
    a: "Solo ves métricas agregadas y anónimas: tasa de activación, número de empleados activos y facturación. Nunca accedes a datos de salud, menús ni información personal de los empleados. Cumplimos con RGPD y la normativa europea de protección de datos.",
  },
  {
    q: "¿Puedo empezar con un piloto antes de contratar?",
    a: "Sí. Ofrecemos un piloto gratuito de 30 días para hasta 20 empleados. Escríbenos y lo configuramos en 24 horas.",
  },
  {
    q: "¿Qué pasa si un empleado deja la empresa?",
    a: "Puedes revocar su acceso desde el panel de RRHH. Su acceso Pro Max se desactivará y dejará de contabilizar en tu facturación.",
  },
  {
    q: "¿Cómo funciona la facturación anual?",
    a: "Con facturación anual pagas 10 meses y recibes 12 (2 meses gratis). Facturamos con IVA para empresas españolas y europeas. También aceptamos domiciliación bancaria y transferencia.",
  },
  {
    q: "¿Es compatible con retribución flexible?",
    a: "Sí. Buddy One for Business puede integrarse en planes de retribución flexible como beneficio de salud y bienestar. Consulta con tu gestor para los detalles fiscales.",
  },
];

const TESTIMONIALS = [
  {
    name: "Laura M.",
    role: "Directora de RRHH",
    company: "Empresa tecnológica (120 empleados)",
    text: "En 3 meses, el 78% de nuestros empleados activó su cuenta. El feedback sobre el bienestar nutricional ha sido muy positivo.",
    rating: 5,
  },
  {
    name: "Carlos F.",
    role: "Chief People Officer",
    company: "Grupo financiero (450 empleados)",
    text: "Nuestros empleados viajan mucho y no tienen tiempo para cuidarse. Buddy One les da un menú adaptado a su agenda en 2 minutos. Es el beneficio más valorado.",
    rating: 5,
  },
  {
    name: "Ana R.",
    role: "Responsable de Bienestar",
    company: "Empresa logística (200 empleados)",
    text: "El onboarding fue rapidísimo. En una semana teníamos a 150 empleados usando la app. El panel de RRHH es muy intuitivo y respeta la privacidad.",
    rating: 5,
  },
];

type PlanId = "starter" | "growth" | "business" | "enterprise" | "corporate" | "global";

export default function Empresas() {
  const [employees, setEmployees] = useState(100);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    employeeCount: "",
    industry: "",
    planInterest: "" as "" | PlanId,
    message: "",
  });

  const submitLead = trpc.company.submitLead.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! Te contactaremos en menos de 24 horas.");
      setFormData({
        companyName: "", contactName: "", contactEmail: "", contactPhone: "",
        employeeCount: "", industry: "", planInterest: "", message: "",
      });
    },
    onError: (err: any) => toast.error(err.message || "Error al enviar la solicitud."),
  });

  const createCheckout = trpc.company.createCheckout.useMutation({
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        toast.info("Redirigiendo al proceso de pago...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err: any) => toast.error(err.message || "Error al iniciar el pago."),
  });

  // Calculator logic
  const calcResult = useMemo(() => {
    const tier = PRICING_TIERS.find(
      (t) => employees >= t.minEmployees && employees <= t.maxEmployees
    ) || PRICING_TIERS[PRICING_TIERS.length - 1];

    const monthlyTotal = tier.price * employees;
    const annualTotal = monthlyTotal * 10; // 2 months free
    const annualMonthlyEquiv = annualTotal / 12;
    const annualSavings = monthlyTotal * 12 - annualTotal;
    const proMaxPrice = 19.99; // individual Pro Max price
    const savingsVsIndividual = (proMaxPrice - tier.price) * employees;

    return {
      tier,
      monthlyTotal,
      annualTotal,
      annualMonthlyEquiv,
      annualSavings,
      savingsVsIndividual,
      effectiveMonthly: billingCycle === "annual" ? annualMonthlyEquiv : monthlyTotal,
    };
  }, [employees, billingCycle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactName || !formData.contactEmail) {
      toast.error("Por favor, completa los campos obligatorios.");
      return;
    }
    submitLead.mutate({
      companyName: formData.companyName,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone || undefined,
      employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
      industry: formData.industry || undefined,
      planInterest: (formData.planInterest || undefined) as PlanId | undefined,
      message: formData.message || undefined,
    });
  };

  const handleCheckout = (plan: PlanId) => {
    if (!formData.contactEmail || !formData.companyName || !formData.contactName) {
      toast.error("Completa el formulario de contacto primero para continuar con el pago.");
      const el = document.getElementById("contact-form");
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    createCheckout.mutate({
      plan,
      employeeCount: employees,
      companyName: formData.companyName,
      contactEmail: formData.contactEmail,
      contactName: formData.contactName,
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold text-primary">Buddy One</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href="#planes" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Planes</a>
            <a href="#calculadora" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Calculadora</a>
            <a href="#contact-form" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Contacto</a>
            <Button size="sm" asChild>
              <a href="#contact-form">Solicitar demo</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                Buddy One for Business
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                Bienestar nutricional como{" "}
                <span className="text-primary">beneficio para tus empleados</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                Como Gympass, pero para nutrición. Tu empresa paga una tarifa por empleado
                y cada uno recibe acceso completo a Buddy One Pro Max: menús IA, seguimiento
                nutricional, lista de la compra inteligente y mucho más.
              </p>
              <p className="text-base text-muted-foreground mb-8">
                <strong className="text-foreground">Desde 1,90 €/empleado/mes.</strong>{" "}
                Sin datos personales visibles para RRHH. Facturación por licencias activas.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <a href="#contact-form">
                    Solicitar demo gratuita <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#planes">Ver planes y precios</a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Piloto gratuito 30 días · Sin permanencia · 2 meses gratis en anual
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: "Empleados activos", value: "12.400+", color: "text-blue-500" },
                { icon: TrendingUp, label: "Reducción absentismo", value: "−12%", color: "text-emerald-500" },
                { icon: Heart, label: "Satisfacción empleados", value: "94%", color: "text-rose-500" },
                { icon: Building2, label: "Empresas clientes", value: "85+", color: "text-amber-500" },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/50">
                  <CardContent className="p-5">
                    <stat.icon className={`h-6 w-6 mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRIVACIDAD PRIMERO ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
              <Lock className="h-3 w-3 mr-1" /> Privacidad garantizada
            </Badge>
            <h2 className="text-3xl font-bold mb-4">Tu empresa NO ve datos de los empleados</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A diferencia de otros programas de bienestar, Buddy One for Business sigue un modelo
              de privacidad total. RRHH solo ve métricas agregadas y anónimas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "Sin datos personales",
                desc: "RRHH nunca ve nombres, emails ni datos de salud de los empleados. Solo métricas agregadas: tasa de activación y licencias activas.",
              },
              {
                icon: Lock,
                title: "Cumplimiento RGPD",
                desc: "Los datos de nutrición y salud del empleado son 100% privados. La empresa solo paga la licencia, no accede a la información.",
              },
              {
                icon: Award,
                title: "Mínimo 5 para estadísticas",
                desc: "Las estadísticas agregadas solo se muestran cuando hay al menos 5 empleados en un grupo, evitando cualquier identificación indirecta.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-border/50">
                <CardContent className="p-6">
                  <item.icon className="h-8 w-8 text-emerald-500 mb-3" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ───────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cómo funciona para tu empresa</h2>
            <p className="text-muted-foreground">En 3 pasos, tus empleados tienen acceso completo a Pro Max</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Contratas el plan",
                desc: "Eliges el plan según el número de empleados. Recibes un código de empresa único para distribuir.",
              },
              {
                step: "02",
                icon: Mail,
                title: "Distribuyes el código",
                desc: "Envías el código por email o Slack. Cada empleado lo introduce en la app y activa Pro Max en 30 segundos.",
              },
              {
                step: "03",
                icon: BarChart3,
                title: "Mides el impacto",
                desc: "Desde el panel de RRHH ves la tasa de activación y el engagement. Sin datos personales de los empleados.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-mono text-primary mb-1">PASO {item.step}</div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANES ──────────────────────────────────────────────────────── */}
      <section id="planes" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Planes y precios</h2>
            <p className="text-muted-foreground mb-6">
              Sin permanencia. Facturación por licencias activas. Anual: 2 meses gratis.
            </p>
            {/* Billing toggle */}
            <div className="inline-flex items-center gap-2 bg-muted rounded-full p-1">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                Mensual
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === "annual"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setBillingCycle("annual")}
              >
                Anual <span className="text-emerald-600 text-xs ml-1">−2 meses</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRICING_TIERS.map((plan) => {
              const effectivePrice = billingCycle === "annual"
                ? Math.round(plan.price * 10 / 12 * 100) / 100
                : plan.price;
              const isMostPopular = plan.badge === "Más popular";

              return (
                <Card
                  key={plan.id}
                  className={`relative border-border/50 transition-shadow hover:shadow-lg ${
                    isMostPopular ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className={
                        isMostPopular
                          ? "bg-primary text-primary-foreground"
                          : "bg-emerald-600 text-white"
                      }>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 pt-6">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{effectivePrice.toFixed(2).replace(".", ",")}€</span>
                      <span className="text-muted-foreground text-sm">/empleado/mes</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.employees} empleados</p>
                    {billingCycle === "annual" && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">
                        Ahorro: {((plan.price * 12 - plan.price * 10) * plan.minEmployees).toFixed(0)}€–{((plan.price * 12 - plan.price * 10) * plan.maxEmployees).toFixed(0)}€/año
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-4"
                      variant={isMostPopular ? "default" : "outline"}
                      onClick={() => {
                        if (plan.id === "global" || plan.id === "corporate") {
                          document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
                        } else {
                          handleCheckout(plan.id);
                        }
                      }}
                      disabled={createCheckout.isPending}
                    >
                      {plan.id === "global" || plan.id === "corporate" ? "Contactar" : "Contratar ahora"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Todos los precios sin IVA. Factura mensual o anual con IVA incluido para empresas de la UE.
          </p>
        </div>
      </section>

      {/* ── CALCULADORA ─────────────────────────────────────────────────── */}
      <section id="calculadora" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Calcula tu inversión</h2>
            <p className="text-muted-foreground">Ajusta el número de empleados para ver el coste y el ahorro</p>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-8">
              <div className="mb-8">
                <Label className="text-base font-medium mb-3 block">
                  Número de empleados: <span className="text-primary font-bold">{employees.toLocaleString("es-ES")}</span>
                </Label>
                <input
                  type="range"
                  min={10}
                  max={5000}
                  step={10}
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Número de empleados"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10</span><span>500</span><span>1.000</span><span>2.500</span><span>5.000</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Plan</div>
                  <div className="font-bold capitalize text-primary">{calcResult.tier.name}</div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Precio/empleado</div>
                  <div className="font-bold">{calcResult.tier.price.toFixed(2).replace(".", ",")}€/mes</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Coste mensual</div>
                  <div className="font-bold text-emerald-600">{calcResult.monthlyTotal.toFixed(0)}€</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Anual (−2 meses)</div>
                  <div className="font-bold text-emerald-600">{calcResult.annualTotal.toFixed(0)}€</div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Comparativa de ahorro
                </h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Ahorro vs Pro Max individual</div>
                    <div className="font-semibold text-emerald-600">
                      {calcResult.savingsVsIndividual.toFixed(0)}€/mes
                    </div>
                    <div className="text-xs text-muted-foreground">
                      vs 19,99€/usuario individual
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Ahorro facturación anual</div>
                    <div className="font-semibold text-emerald-600">
                      {calcResult.annualSavings.toFixed(0)}€/año
                    </div>
                    <div className="text-xs text-muted-foreground">2 meses gratis</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">ROI estimado (absentismo −10%)</div>
                    <div className="font-semibold text-emerald-600">
                      +{(employees * 0.1 * 1200).toFixed(0)}€/año
                    </div>
                    <div className="text-xs text-muted-foreground">A 1.200€/baja/año</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
                  <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Coste por empleado al día: {(calcResult.tier.price / 30).toFixed(2).replace(".", ",")}€ — menos que un café
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── QUÉ INCLUYE PRO MAX ─────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cada empleado recibe Pro Max</h2>
            <p className="text-muted-foreground">
              El plan más completo de Buddy One, valorado en 19,99€/mes, desde 1,90€ con tu empresa
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Sparkles, title: "Menús IA personalizados", desc: "Menús semanales adaptados a objetivos, alergias y preferencias de cada empleado" },
              { icon: Calculator, title: "Seguimiento nutricional", desc: "Control de calorías, macros y micronutrientes con diario de comidas" },
              { icon: Clock, title: "Lista de la compra IA", desc: "Lista automática por supermercado con cantidades exactas y precios estimados" },
              { icon: Heart, title: "Health Hub", desc: "Integración con wearables, seguimiento de sueño, actividad y bienestar general" },
              { icon: Globe, title: "BuddyExperts", desc: "Acceso a nutricionistas certificados para consultas y planes personalizados" },
              { icon: Zap, title: "BuddyCare", desc: "Seguimiento de suplementos y recomendaciones de bienestar personalizadas" },
              { icon: BarChart3, title: "Ecosistema conectado", desc: "Sincronización con BuddyCoach, BuddyShop y otras apps del ecosistema" },
              { icon: Headphones, title: "Soporte premium", desc: "Soporte prioritario por chat y email para todos los empleados" },
            ].map((item) => (
              <Card key={item.title} className="border-border/50">
                <CardContent className="p-5">
                  <item.icon className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Lo que dicen nuestros clientes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role} · {t.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULARIO DE CONTACTO ───────────────────────────────────────── */}
      <section id="contact-form" className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Solicita tu demo gratuita</h2>
            <p className="text-muted-foreground">
              Te contactamos en menos de 24 horas para configurar tu piloto de 30 días sin compromiso.
            </p>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Empresa *</Label>
                    <Input
                      id="companyName"
                      placeholder="Nombre de tu empresa"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactName">Tu nombre *</Label>
                    <Input
                      id="contactName"
                      placeholder="Nombre y apellidos"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contactEmail">Email corporativo *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="tu@empresa.com"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contactPhone">Teléfono</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+34 600 000 000"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="employeeCount">Número de empleados</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      placeholder="Ej: 150"
                      min={1}
                      value={formData.employeeCount}
                      onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="industry">Sector</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(v) => setFormData({ ...formData, industry: v })}
                    >
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Selecciona sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="planInterest">Plan de interés</Label>
                  <Select
                    value={formData.planInterest}
                    onValueChange={(v) => setFormData({ ...formData, planInterest: v as PlanId })}
                  >
                    <SelectTrigger id="planInterest">
                      <SelectValue placeholder="¿Qué plan te interesa?" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_TIERS.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} ({t.employees} empleados · {t.price.toFixed(2).replace(".", ",")}€/empleado)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Mensaje (opcional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Cuéntanos más sobre tu empresa y qué necesitas..."
                    rows={3}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitLead.isPending}>
                  {submitLead.isPending ? "Enviando..." : "Solicitar demo gratuita"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Al enviar este formulario aceptas nuestra{" "}
                  <Link href="/privacidad" className="underline">política de privacidad</Link>.
                  No compartimos tus datos con terceros.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Buddy One · <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link> · <Link href="/terminos" className="hover:text-foreground">Términos</Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="mailto:info@buddyoneapp.com" className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-3.5 w-3.5" /> info@buddyoneapp.com
            </a>
            <a href="tel:+34900000000" className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3.5 w-3.5" /> 900 000 000
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
