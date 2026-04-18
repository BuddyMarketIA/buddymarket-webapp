import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

// ─── Datos ────────────────────────────────────────────────────────────────────

const BENEFICIOS = [
  {
    icon: "👥",
    titulo: "Clientes ya motivados",
    desc: "Accede a usuarios que ya planifican menús y hacen seguimiento nutricional. Están a un paso de necesitar orientación profesional.",
  },
  {
    icon: "💶",
    titulo: "Ingresos recurrentes",
    desc: "Cobra suscripciones mensuales o planes únicos directamente a través de Stripe. El 80–85% de cada pago es para ti.",
  },
  {
    icon: "🤖",
    titulo: "IA que trabaja para ti",
    desc: "La plataforma genera propuestas de menú, listas de la compra y informes de progreso. Tú revisas y apruebas con un clic.",
  },
  {
    icon: "🛒",
    titulo: "Lista de la compra integrada",
    desc: "Tus planes nutricionales se convierten automáticamente en listas de la compra para Mercadona, Consum o Lidl con precios reales.",
  },
  {
    icon: "📊",
    titulo: "Seguimiento sin fricción",
    desc: "El cliente registra sus comidas desde la app. Tú ves el resumen en tu panel sin hojas de cálculo ni formularios manuales.",
  },
  {
    icon: "🔗",
    titulo: "Código de referido",
    desc: "Comparte tu código con tu audiencia. Cada usuario que se registre con él te genera una comisión mensual del 20% mientras esté activo.",
  },
];

const INGRESOS = [
  { modalidad: "Suscripción mensual", desc: "El cliente paga cuota mensual por tu plan y seguimiento", reparto: "80% para ti" },
  { modalidad: "Plan único", desc: "Venta de un plan nutricional como producto digital", reparto: "85% para ti" },
  { modalidad: "Referidos", desc: "Comisión por cada usuario que se registre con tu código", reparto: "20% mensual vitalicio" },
];

const PASOS = [
  {
    num: "01",
    titulo: "Solicita el acceso",
    desc: "Completa el formulario con tu titulación y número de colegiado. Verificamos tus credenciales en 24–48h.",
  },
  {
    num: "02",
    titulo: "Configura tu perfil",
    desc: "Define tu especialidad, tarifas y disponibilidad. Recibes onboarding personalizado con el equipo.",
  },
  {
    num: "03",
    titulo: "Empieza a cobrar",
    desc: "Tu perfil aparece en el directorio. Comparte tu código de referido y empieza a recibir clientes.",
  },
];

const FAQS = [
  {
    q: "¿Puedo seguir con mi consulta presencial?",
    a: "Sí. BuddyMarket es un canal adicional, no un sustituto. Muchos BuddyCoaches lo usan para el seguimiento entre sesiones presenciales.",
  },
  {
    q: "¿Tengo control sobre lo que genera la IA?",
    a: "Siempre. La IA genera propuestas que tú revisas y apruebas antes de que lleguen al cliente. Nada se envía sin tu validación.",
  },
  {
    q: "¿Cómo se gestionan los datos de salud de mis clientes?",
    a: "BuddyMarket cumple con el RGPD. Los datos de salud se tratan como categoría especial, con cifrado en tránsito y en reposo.",
  },
  {
    q: "¿Puedo invitar a mis clientes actuales?",
    a: "Sí. Usa tu código de referido para invitarlos. Ellos obtienen descuento y tú empiezas a cobrar comisión por su actividad.",
  },
  {
    q: "¿Cuánto cuesta el acceso a la plataforma?",
    a: "Gratuito durante los primeros 6 meses para los primeros 50 BuddyCoaches. A partir del mes 7, 29€/mes sin límite de clientes ni permanencia.",
  },
  {
    q: "¿Cuándo y cómo recibo los pagos?",
    a: "Los pagos se procesan a través de Stripe y se transfieren directamente a tu cuenta bancaria cada 15 días.",
  },
];

// ─── Componente FAQ ───────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-foreground hover:bg-muted/30 transition-colors focus-visible:outline-2 focus-visible:outline-[#F97316]"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span className="ml-4 text-[#F97316] text-xl flex-shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-border/50 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Formulario de solicitud ──────────────────────────────────────────────────

function FormularioSolicitud() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    colegiado: "",
    especialidad: "",
    clientes: "",
    mensaje: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  const notifyMutation = trpc.system.notifyOwner.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.email) {
      toast.error("Por favor, completa los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      await notifyMutation.mutateAsync({
        title: `Nueva solicitud BuddyCoach: ${form.nombre}`,
        content: `**Nombre:** ${form.nombre}\n**Email:** ${form.email}\n**Nº Colegiado:** ${form.colegiado || "No indicado"}\n**Especialidad:** ${form.especialidad || "No indicada"}\n**Clientes actuales:** ${form.clientes || "No indicado"}\n**Mensaje:** ${form.mensaje || "Sin mensaje"}`,
      });
      setEnviado(true);
      toast.success("¡Solicitud enviada! Te contactaremos en menos de 24h.");
    } catch {
      toast.error("Error al enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (enviado) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-foreground mb-2">¡Solicitud recibida!</h3>
        <p className="text-muted-foreground">Te contactaremos en menos de 24 horas laborables para completar el proceso de verificación.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nc-nombre" className="block text-sm font-semibold text-foreground/80 mb-1.5">
            Nombre completo <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="nc-nombre"
            type="text"
            required
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none transition-all text-foreground placeholder:text-muted-foreground/70"
            placeholder="Ej: María García López"
          />
        </div>
        <div>
          <label htmlFor="nc-email" className="block text-sm font-semibold text-foreground/80 mb-1.5">
            Email profesional <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="nc-email"
            type="email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none transition-all text-foreground placeholder:text-muted-foreground/70"
            placeholder="tu@email.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="nc-colegiado" className="block text-sm font-semibold text-foreground/80 mb-1.5">
            Número de colegiado
          </label>
          <input
            id="nc-colegiado"
            type="text"
            value={form.colegiado}
            onChange={e => setForm(f => ({ ...f, colegiado: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none transition-all text-foreground placeholder:text-muted-foreground/70"
            placeholder="Ej: AND-1234"
          />
        </div>
        <div>
          <label htmlFor="nc-especialidad" className="block text-sm font-semibold text-foreground/80 mb-1.5">
            Especialidad
          </label>
          <select
            id="nc-especialidad"
            value={form.especialidad}
            onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none transition-all text-foreground bg-background"
          >
            <option value="">Selecciona una especialidad</option>
            <option value="clinica">Nutrición clínica</option>
            <option value="deportiva">Nutrición deportiva</option>
            <option value="infantil">Nutrición infantil y pediátrica</option>
            <option value="oncologica">Nutrición oncológica</option>
            <option value="vegetariana">Nutrición vegetariana/vegana</option>
            <option value="tca">Trastornos de la conducta alimentaria</option>
            <option value="general">Nutrición general</option>
            <option value="otra">Otra</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="nc-clientes" className="block text-sm font-semibold text-foreground/80 mb-1.5">
          Número aproximado de clientes activos
        </label>
        <select
          id="nc-clientes"
          value={form.clientes}
          onChange={e => setForm(f => ({ ...f, clientes: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none transition-all text-foreground bg-background"
        >
          <option value="">Selecciona un rango</option>
          <option value="1-10">1–10 clientes</option>
          <option value="11-30">11–30 clientes</option>
          <option value="31-50">31–50 clientes</option>
          <option value="50+">Más de 50 clientes</option>
        </select>
      </div>
      <div>
        <label htmlFor="nc-mensaje" className="block text-sm font-semibold text-foreground/80 mb-1.5">
          Cuéntanos sobre tu práctica profesional (opcional)
        </label>
        <textarea
          id="nc-mensaje"
          rows={4}
          value={form.mensaje}
          onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-border focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 outline-none transition-all text-foreground placeholder:text-muted-foreground/70 resize-none"
          placeholder="Describe brevemente tu enfoque, tipo de pacientes, etc."
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-[#F97316] hover:bg-[#EA6C0A] text-white font-bold text-lg transition-all shadow-lg shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
      >
        {loading ? "Enviando solicitud..." : "Solicitar acceso gratuito →"}
      </button>
      <p className="text-center text-xs text-muted-foreground/70">
        Gratuito los primeros 6 meses · Sin permanencia · Respuesta en 24h
      </p>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Nutricionistas() {
  return (
    <div className="min-h-screen bg-background font-sans">

      {/* ── Navegación ── */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50" aria-label="Navegación principal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-foreground focus-visible:outline-2 focus-visible:outline-[#F97316] rounded">
            <span className="text-[#F97316]">BuddyMarket</span>
            <span className="text-xs font-semibold text-white bg-[#8B5CF6] px-2 py-0.5 rounded-full">Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="#solicitar"
              className="hidden sm:inline-flex items-center px-5 py-2.5 rounded-xl bg-[#F97316] text-white font-semibold text-sm hover:bg-[#EA6C0A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
            >
              Solicitar acceso
            </a>
          </div>
        </div>
      </nav>

      <main id="main-content">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF7ED] via-white to-[#F5F3FF] pt-20 pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-[#F97316]/10 text-[#F97316] font-semibold text-sm px-4 py-2 rounded-full mb-6">
                <span>🎓</span>
                <span>Programa BuddyCoach — Plazas limitadas</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-tight mb-6">
                Convierte tu consulta en un{" "}
                <span className="text-[#F97316]">ecosistema digital</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                BuddyMarket conecta a dietistas y nutricionistas con miles de usuarios que ya planifican sus menús y quieren orientación profesional. Tú aportas el criterio clínico. Nosotros ponemos la tecnología, la audiencia y la infraestructura.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#solicitar"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#F97316] text-white font-bold text-lg hover:bg-[#EA6C0A] transition-all shadow-lg shadow-orange-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
                >
                  Solicitar acceso gratuito →
                </a>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-border text-foreground/80 font-semibold text-lg hover:border-[#F97316] hover:text-[#F97316] transition-all focus-visible:outline-2 focus-visible:outline-[#F97316]"
                >
                  Ver cómo funciona
                </a>
              </div>
              <div className="flex flex-wrap gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Gratuito 6 meses</div>
                <div className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Sin permanencia</div>
                <div className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Verificación en 24h</div>
                <div className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Primeros 50 BuddyCoaches</div>
              </div>
            </div>
          </div>
          {/* Decoración */}
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none" aria-hidden="true">
            <div className="w-full h-full bg-gradient-to-l from-[#F97316] to-transparent" />
          </div>
        </section>

        {/* ── Métricas ── */}
        <section className="bg-gray-900 py-12" aria-label="Métricas de la plataforma">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
              {[
                { num: "50K+", label: "Usuarios activos" },
                { num: "1.2M", label: "Menús planificados" },
                { num: "4.8★", label: "Valoración media" },
                { num: "€120", label: "Ingreso medio mensual BuddyCoach" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <div className="text-3xl sm:text-4xl font-black text-[#F97316] mb-1">{num}</div>
                  <div className="text-sm text-muted-foreground/70">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Beneficios ── */}
        <section className="py-20 bg-background" aria-labelledby="beneficios-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 id="beneficios-heading" className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                Todo lo que obtienes como BuddyCoach
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Herramientas diseñadas para que el trabajo técnico lo haga la plataforma y tú te centres en lo que realmente aporta valor.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFICIOS.map(({ icon, titulo, desc }) => (
                <div key={titulo} className="p-6 rounded-2xl border border-border/50 hover:border-[#F97316]/30 hover:shadow-md transition-all">
                  <div className="text-3xl mb-4">{icon}</div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{titulo}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Modelo de ingresos ── */}
        <section className="py-20 bg-[#FFF7ED]" aria-labelledby="ingresos-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 id="ingresos-heading" className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                Modelo de ingresos transparente
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Sin sorpresas. Sabes exactamente cuánto cobras y cuándo.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {INGRESOS.map(({ modalidad, desc, reparto }) => (
                <div key={modalidad} className="bg-background rounded-2xl p-8 shadow-sm border border-orange-100">
                  <h3 className="font-black text-foreground text-xl mb-2">{modalidad}</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{desc}</p>
                  <div className="text-3xl font-black text-[#F97316]">{reparto}</div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground/70 mt-8">
              Pagos procesados vía Stripe · Transferencia a tu cuenta cada 15 días · Sin retenciones adicionales
            </p>
          </div>
        </section>

        {/* ── Cómo funciona ── */}
        <section id="como-funciona" className="py-20 bg-background" aria-labelledby="como-funciona-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 id="como-funciona-heading" className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                Tres pasos para empezar
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PASOS.map(({ num, titulo, desc }) => (
                <div key={num} className="relative">
                  <div className="text-6xl font-black text-[#F97316]/15 mb-4 leading-none">{num}</div>
                  <h3 className="font-bold text-foreground text-xl mb-3">{titulo}</h3>
                  <p className="text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonios ── */}
        <section className="py-20 bg-muted/30" aria-labelledby="testimonios-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 id="testimonios-heading" className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                Lo que dicen nuestros BuddyCoaches
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <blockquote className="bg-background rounded-2xl p-8 shadow-sm border border-border/50">
                <p className="text-foreground/80 leading-relaxed mb-6 italic">
                  "Llevo 3 meses en la plataforma y ya tengo 12 clientes activos con suscripción mensual. Lo que más valoro es que el seguimiento entre sesiones es automático — el cliente registra sus comidas y yo veo el resumen sin que nadie tenga que hacer nada extra."
                </p>
                <footer className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F97316]/10 flex items-center justify-center text-xl">👩‍⚕️</div>
                  <div>
                    <div className="font-semibold text-foreground">Dietista-nutricionista</div>
                    <div className="text-sm text-muted-foreground/70">Madrid · BuddyCoach verificada</div>
                  </div>
                </footer>
              </blockquote>
              <blockquote className="bg-background rounded-2xl p-8 shadow-sm border border-border/50">
                <p className="text-foreground/80 leading-relaxed mb-6 italic">
                  "Mis clientes me dicen que por fin pueden seguir el plan porque la lista de la compra les sale directamente para Mercadona. Eso marca la diferencia entre un plan que se cumple y uno que se olvida en el cajón."
                </p>
                <footer className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-xl">👨‍⚕️</div>
                  <div>
                    <div className="font-semibold text-foreground">Nutricionista clínico</div>
                    <div className="text-sm text-muted-foreground/70">Barcelona · BuddyCoach verificado</div>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 bg-background" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 id="faq-heading" className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                Preguntas frecuentes
              </h2>
            </div>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <FaqItem key={q} q={q} a={a} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Formulario de solicitud ── */}
        <section id="solicitar" className="py-20 bg-gradient-to-br from-[#FFF7ED] to-white" aria-labelledby="solicitar-heading">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 id="solicitar-heading" className="text-3xl sm:text-4xl font-black text-foreground mb-4">
                Solicita tu acceso gratuito
              </h2>
              <p className="text-lg text-muted-foreground">
                Plazas limitadas a los primeros 50 BuddyCoaches. Sin compromiso, sin permanencia.
              </p>
            </div>
            <div className="bg-background rounded-3xl shadow-xl border border-border/50 p-8 sm:p-10">
              <FormularioSolicitud />
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 py-10" role="contentinfo">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white font-black text-xl">
            <span className="text-[#F97316]">BuddyMarket</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground/70">
            <Link href="/privacy" className="hover:text-white transition-colors focus-visible:outline-1 focus-visible:outline-white rounded">Privacidad</Link>
            <Link href="/terms" className="hover:text-white transition-colors focus-visible:outline-1 focus-visible:outline-white rounded">Términos</Link>
            <Link href="/faq" className="hover:text-white transition-colors focus-visible:outline-1 focus-visible:outline-white rounded">FAQ</Link>
          </div>
          <p className="text-muted-foreground text-sm">© 2026 BuddyMarket. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
