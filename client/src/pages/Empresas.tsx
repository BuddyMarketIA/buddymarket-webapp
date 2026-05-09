import { useState } from "react"
import { useTranslation } from 'react-i18next';;
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
  Star, ChevronDown, ChevronUp, Mail, Phone
} from "lucide-react";

const INDUSTRIES = [
  "Tecnología", "Finanzas y Banca", "Salud y Farmacia", "Retail y Comercio",
  "Manufactura", "Educación", "Consultoría", "Medios y Comunicación",
  "Logística y Transporte", "Hostelería y Turismo", "Sector Público", "Otro",
];

const FAQS = [
  {
    q: "¿Cómo funciona el sistema de códigos de activación?",
    a: "Tras contratar el plan, recibirás un lote de códigos únicos (uno por empleado). Los distribuyes por email o Slack y cada empleado lo introduce en la app para activar su acceso Pro Max de forma inmediata, sin necesidad de que compartan datos personales contigo.",
  },
  {
    q: "¿Qué datos de mis empleados recibo como RRHH?",
    a: "Solo ves métricas agregadas y anónimas: tasa de activación, número de empleados activos y fecha de última actividad. Nunca accedes a datos de salud, menús ni información personal de los empleados.",
  },
  {
    q: "¿Puedo empezar con un piloto antes de contratar?",
    a: "Sí. Ofrecemos un piloto gratuito de 30 días para hasta 20 empleados. Escríbenos y lo configuramos en 24 horas.",
  },
  {
    q: "¿Qué pasa si un empleado deja la empresa?",
    a: "Puedes revocar su código desde el panel de RRHH. Su acceso Pro Max se desactivará en el siguiente ciclo de facturación.",
  },
  {
    q: "¿Es compatible con el plan de retribución flexible?",
    a: "Sí. Buddy One for Business puede integrarse en planes de retribución flexible como beneficio de salud. Consulta con tu gestor para los detalles fiscales.",
  },
  {
    q: "¿Cómo se factura? ¿Puedo pagar anualmente?",
    a: "Facturamos mensualmente por tarjeta o domiciliación bancaria. El pago anual tiene un 15% de descuento. Emitimos factura con IVA para empresas españolas.",
  },
];

const TESTIMONIALS = [
  {
    name: "Laura Martínez",
    role: "Directora de RRHH",
    company: "TechCorp España",
    text: "En 3 meses, el 78% de nuestros empleados activó su cuenta. El absentismo por estrés bajó un 12%. El ROI fue evidente desde el primer trimestre.",
    rating: 5,
  },
  {
    name: "Carlos Fernández",
    role: "Chief People Officer",
    company: "Grupo Financiero Norte",
    text: "Nuestros empleados viajan mucho y no tienen tiempo para cuidarse. Buddy One les da un menú adaptado a su agenda en 2 minutos. Es el beneficio más valorado de nuestra encuesta interna.",
    rating: 5,
  },
  {
    name: "Ana Ruiz",
    role: "Responsable de Bienestar",
    company: "Distribuidora Logística Sur",
    text: "El onboarding fue rapidísimo. En una semana teníamos a 150 empleados usando la app. El panel de RRHH es muy intuitivo.",
    rating: 5,
  },
];

export default function Empresas() {
  const [employees, setEmployees] = useState(50);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    employeeCount: "",
    industry: "",
    planInterest: "" as "" | "starter" | "business" | "enterprise" | "corporate",
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
    onError: (err) => toast.error(err.message || "Error al enviar la solicitud."),
  });

  const createCheckout = trpc.company.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.info("Redirigiendo al proceso de pago...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message || "Error al iniciar el pago."),
  });

  // Calcular precio según empleados
  const getPlanForEmployees = (n: number) => {
    if (n < 50) return { plan: "starter" as const, price: 8 };
    if (n < 200) return { plan: "business" as const, price: 6 };
    if (n < 500) return { plan: "enterprise" as const, price: 4.5 };
    return { plan: "corporate" as const, price: 0 };
  };

  const { plan: calcPlan, price: calcPrice } = getPlanForEmployees(employees);
  const monthlyTotal = calcPrice * employees;
  const annualTotal = monthlyTotal * 12 * 0.85; // 15% descuento anual

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
      planInterest: formData.planInterest || undefined,
      message: formData.message || undefined,
    });
  };

  const handleCheckout = (plan: "starter" | "business" | "enterprise") => {
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
                🏢 Buddy One for Business
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                El bienestar nutricional como{" "}
                <span className="text-primary">beneficio para tus empleados</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Cuando el trabajo no para, la alimentación es lo primero que se descuida.
                Buddy One ayuda a tus empleados a planificar menús saludables y hacer la compra
                en 2 minutos, sin esfuerzo.
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
                Piloto gratuito 30 días · Sin permanencia · Factura con IVA
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

      {/* ── PROBLEMA ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">El problema que nadie resuelve</h2>
          <p className="text-muted-foreground text-lg mb-12">
            El 67% de los empleados españoles dice que el exceso de trabajo le impide comer bien.
            Las consecuencias son visibles en productividad, bajas y rotación.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "😓", title: "Sin tiempo para planificar", desc: "El empleado llega a casa agotado y pide comida a domicilio o improvisa con lo que hay." },
              { emoji: "💸", title: "Gasto innecesario", desc: "Sin planificación, el gasto en alimentación sube un 40% y la calidad nutricional baja." },
              { emoji: "📉", title: "Impacto en productividad", desc: "La mala alimentación reduce la concentración y aumenta el absentismo hasta un 15%." },
            ].map((item) => (
              <div key={item.title} className="bg-background rounded-xl p-6 border border-border/50 text-left">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ───────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Cómo funciona para tu empresa</h2>
            <p className="text-muted-foreground">En 3 pasos, tus empleados tienen acceso completo</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Building2,
                title: "Contratas el plan",
                desc: "Eliges el plan según el número de empleados. Recibes un lote de códigos de activación únicos.",
              },
              {
                step: "02",
                icon: Mail,
                title: "Distribuyes los códigos",
                desc: "Envías los códigos por email, Slack o tu HRIS. Cada empleado activa su cuenta en 30 segundos.",
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Planes y precios</h2>
            <p className="text-muted-foreground">Sin permanencia. Factura mensual con IVA. Piloto gratuito 30 días.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: "starter" as const,
                name: "Starter",
                price: 8,
                employees: "10–49",
                badge: null,
                features: [
                  "App completa con menús IA",
                  "Lista de la compra automática",
                  "Seguimiento de macros",
                  "Soporte por email",
                  "Códigos de activación",
                ],
              },
              {
                id: "business" as const,
                name: "Business",
                price: 6,
                employees: "50–199",
                badge: "Más popular",
                features: [
                  "Todo lo de Starter",
                  "Panel RRHH con métricas",
                  "BuddyCoach grupal mensual",
                  "Onboarding dedicado",
                  "Alta masiva por CSV",
                ],
              },
              {
                id: "enterprise" as const,
                name: "Enterprise",
                price: 4.5,
                employees: "200–499",
                badge: null,
                features: [
                  "Todo lo de Business",
                  "SSO (Google / Microsoft)",
                  "Informes PDF mensuales",
                  "SLA 99,9%",
                  "Cuenta ejecutiva",
                ],
              },
              {
                id: "corporate" as const,
                name: "Corporate",
                price: null,
                employees: "500+",
                badge: "A medida",
                features: [
                  "Todo lo de Enterprise",
                  "Integración HRIS",
                  "API dedicada",
                  "Precio personalizado",
                  "Soporte 24/7",
                ],
              },
            ].map((plan) => (
              <Card
                key={plan.id}
                className={`relative border-border/50 ${plan.badge === "Más popular" ? "border-primary shadow-lg shadow-primary/10" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={plan.badge === "Más popular" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    {plan.price ? (
                      <>
                        <span className="text-3xl font-bold">{plan.price}€</span>
                        <span className="text-muted-foreground text-sm">/empleado/mes</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">Consultar</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.employees} empleados</p>
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
                    variant={plan.badge === "Más popular" ? "default" : "outline"}
                    onClick={() => {
                      if (plan.id === "corporate") {
                        document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
                      } else {
                        handleCheckout(plan.id as "starter" | "business" | "enterprise");
                      }
                    }}
                    disabled={createCheckout.isPending}
                  >
                    {plan.id === "corporate" ? "Contactar" : "Contratar ahora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALCULADORA ─────────────────────────────────────────────────── */}
      <section id="calculadora" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Calcula tu inversión y ROI</h2>
            <p className="text-muted-foreground">Ajusta el número de empleados para ver el coste y el retorno estimado</p>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-8">
              <div className="mb-8">
                <Label className="text-base font-medium mb-3 block">
                  Número de empleados: <span className="text-primary font-bold">{employees}</span>
                </Label>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={employees}
                  onChange={(e) => setEmployees(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Número de empleados"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10</span><span>250</span><span>500</span><span>750</span><span>1000</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Plan</div>
                  <div className="font-bold capitalize text-primary">{calcPlan}</div>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Precio/empleado</div>
                  <div className="font-bold">{calcPrice > 0 ? `${calcPrice}€/mes` : "A medida"}</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Coste mensual</div>
                  <div className="font-bold text-emerald-600">{calcPrice > 0 ? `${monthlyTotal.toFixed(0)}€` : "—"}</div>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Anual (−15%)</div>
                  <div className="font-bold text-emerald-600">{calcPrice > 0 ? `${annualTotal.toFixed(0)}€` : "—"}</div>
                </div>
              </div>

              {calcPrice > 0 && (
                <div className="border-t border-border/50 pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ROI estimado (primer año)
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Reducción absentismo (10%)</div>
                      <div className="font-semibold text-emerald-600">+{(employees * 0.1 * 1200).toFixed(0)}€</div>
                      <div className="text-xs text-muted-foreground">Estimado a 1.200€/baja/año</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Retención empleados (2%)</div>
                      <div className="font-semibold text-emerald-600">+{(employees * 0.02 * 8000).toFixed(0)}€</div>
                      <div className="text-xs text-muted-foreground">Estimado a 8.000€/sustitución</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Inversión anual</div>
                      <div className="font-semibold text-rose-500">−{annualTotal.toFixed(0)}€</div>
                      <div className="text-xs text-muted-foreground">Con descuento anual del 15%</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg">
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      ROI neto estimado: +{((employees * 0.1 * 1200 + employees * 0.02 * 8000) - annualTotal).toFixed(0)}€ en el primer año
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── TESTIMONIOS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-muted/30">
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
      <section className="py-20 px-4">
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
      <section id="contact-form" className="py-20 px-4 bg-muted/30">
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
                    onValueChange={(v) => setFormData({ ...formData, planInterest: v as typeof formData.planInterest })}
                  >
                    <SelectTrigger id="planInterest">
                      <SelectValue placeholder="¿Qué plan te interesa?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter (10–49 empleados · 8€/empleado)</SelectItem>
                      <SelectItem value="business">Business (50–199 empleados · 6€/empleado)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (200–499 empleados · 4,5€/empleado)</SelectItem>
                      <SelectItem value="corporate">Corporate (500+ empleados · A medida)</SelectItem>
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
                  {submitLead.isPending ? t("common.sending") : "Solicitar demo gratuita →"}
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
            © 2025 Buddy One · <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link> · <Link href="/terminos" className="hover:text-foreground">Términos</Link>
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
