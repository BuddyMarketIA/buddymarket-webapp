import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";

const FOOD = {
  salmon:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  ensalada: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  bowl:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp",
  pasta:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pasta_pesto_tomates-ShvKafyUPxQbbjm5oqKBmm.webp",
  pollo:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp",
  menu:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu_semanal_banner-bJvcZL6L7JygtVy2QeuafW.webp",
  teriyaki: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_teriyaki_arroz-BxhouEXinEgLMtuwwTB4gh.webp",
  brownie:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp",
  tortilla: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/tortilla_espinacas-cEYtBTb5hV7xgFpTkVy3TG.webp",
  acai:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/acai_bowl_granola-mcBZCMgPadkRDbMhMseJwZ.webp",
  buddha:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
  pan:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp",
  recipes:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/recipes_afa44a0e.jpg",
  shopping: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/shopping_d2c9f4e5.jpg",
  pantry:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pantry_3fcf0a1f.jpg",
  mealprep: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
};

const FEATURES = [
  { icon: "🤖", tag: "IA Nutricional", title: "IA Nutricional Personalizada", img: FOOD.salmon,
    desc: "Nuestra inteligencia artificial analiza tu perfil, alergias, condiciones médicas y objetivos para generar planes de alimentación únicos para ti. Más de 24 perfiles especiales." },
  { icon: "📋", tag: "Menús", title: "Menús Semanales Automáticos", img: FOOD.menu,
    desc: "Genera tu menú semanal completo en segundos. Con 5 comidas diarias, macros detallados y lista de la compra integrada. Adaptado a tus restricciones dietéticas." },
  { icon: "🍳", tag: "Recetas", title: "Biblioteca de Recetas", img: FOOD.recipes,
    desc: "Miles de recetas saludables con información nutricional completa, instrucciones paso a paso, tiempos de preparación y filtros por alérgenos." },
  { icon: "🛒", tag: "Compras", title: "Lista de la Compra Inteligente", img: FOOD.shopping,
    desc: "Genera automáticamente tu lista de la compra a partir de tus menús semanales. Organizada por categorías, con control de inventario." },
  { icon: "📊", tag: "Seguimiento", title: "Seguimiento Nutricional", img: FOOD.mealprep,
    desc: "Registra tus comidas y monitoriza en tiempo real tus calorías, proteínas, carbohidratos y grasas. Estadísticas detalladas y sistema de logros." },
  { icon: "🏪", tag: "Inventario", title: "Inventario del Hogar", img: FOOD.pantry,
    desc: "Controla lo que tienes en tu despensa, nevera y congelador. BuddyMarket te avisa de lo que está por caducar y adapta tus recetas." },
];

const SPECIAL_MENUS = [
  { emoji: "🤰", label: "Embarazadas" }, { emoji: "🌱", label: "Veganos" },
  { emoji: "🌾", label: "Celíacos" },    { emoji: "💉", label: "Diabéticos" },
  { emoji: "❤️", label: "Hipertensión" },{ emoji: "💪", label: "Deportistas" },
  { emoji: "🤧", label: "Resfriado" },   { emoji: "🧓", label: "Mayores 65" },
  { emoji: "👶", label: "Niños" },       { emoji: "🔬", label: "Oncológico" },
  { emoji: "🧘", label: "Intestino irritable" }, { emoji: "🦴", label: "Osteoporosis" },
];

const TESTIMONIALS = [
  { text: "Desde que uso BuddyMarket he perdido 8 kg en 3 meses sin pasar hambre. Los menús son deliciosos y muy fáciles de seguir.", name: "María G.", role: "Usuaria desde 2024", img: FOOD.ensalada },
  { text: "Como celíaco, siempre fue difícil encontrar recetas variadas. BuddyMarket me genera menús sin gluten increíbles cada semana.", name: "Carlos M.", role: "Celíaco, usuario Pro", img: FOOD.pasta },
  { text: "Soy nutricionista y recomiendo BuddyMarket a mis pacientes. La precisión nutricional y la variedad de perfiles médicos es impresionante.", name: "Laura P.", role: "Nutricionista", img: FOOD.bowl },
];

const PLANS = [
  { name: "Free", price: "0€", period: "para siempre", color: "#6b7280", highlight: false, cta: "Empezar gratis",
    features: ["Perfil nutricional básico", "5 recetas al mes", "Diario nutricional", "Lista de la compra", "Acceso a la comunidad"] },
  { name: "Pro", price: "9,99€", period: "al mes", color: "#F97316", highlight: true, cta: "Empezar con Pro",
    features: ["Todo lo de Free", "Menús semanales ilimitados", "IA nutricional personalizada", "Menús especializados (24 perfiles)", "Inventario del hogar", "Seguimiento avanzado", "Sin anuncios"] },
  { name: "Pro Max", price: "19,99€", period: "al mes", color: "#7c3aed", highlight: false, cta: "Empezar con Pro Max",
    features: ["Todo lo de Pro", "BuddyMaker: publica recetas", "BuddyExpert: consultas", "Análisis nutricional IA avanzado", "Exportar informes PDF", "Soporte prioritario 24/7"] },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const loginUrl = getLoginUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMobileMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="landing-root">

      {/* ═══ NAVBAR ═══════════════════════════════════════════════════════ */}
      <nav className={`landing-nav ${scrolled || mobileMenuOpen ? "landing-nav--scrolled" : ""}`}>
        <div className="landing-nav__bar">
          <a href="/" className="landing-nav__logo">
            <img src={LOGO_COLOR} alt="BuddyMarket" className="landing-logo-img" />
          </a>

          {/* Desktop links */}
          <div className="landing-nav__links">
            {[
              { label: "Funcionalidades", href: "#features" },
              { label: "Menús Especiales", href: "#special" },
              { label: "Precios", href: "#pricing" },
              { label: "Blog", href: "/blog" },
              { label: "BuddyCoach ↗", href: "https://buddycoach.io" },
            ].map(item => (
              <a key={item.label} href={item.href} className="landing-nav__link">{item.label}</a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="landing-nav__ctas">
            <a href={loginUrl} className="landing-btn-outline-sm">Iniciar sesión</a>
            <a href={loginUrl} className="landing-btn-primary-sm">Empezar gratis</a>
          </div>

          {/* Hamburger */}
          <button
            className="landing-hamburger"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu">
            {[
              { label: "Funcionalidades", href: "#features", emoji: "✨" },
              { label: "Menús Especiales", href: "#special", emoji: "🥗" },
              { label: "Precios", href: "#pricing", emoji: "💎" },
              { label: "Blog", href: "/blog", emoji: "📝" },
              { label: "BuddyCoach ↗", href: "https://buddycoach.io", emoji: "💪", external: true },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className="landing-mobile-menu__item"
              >
                <span className="landing-mobile-menu__emoji">{item.emoji}</span>
                <span>{item.label}</span>
              </a>
            ))}
            <div className="landing-mobile-menu__divider" />
            <a href={loginUrl} className="landing-mobile-menu__login">Iniciar sesión</a>
            <a href={loginUrl} className="landing-mobile-menu__register">Empezar gratis →</a>
          </div>
        )}
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════════════════ */}
      <section className="landing-hero">
        <div className="landing-hero__inner">
          {/* Text */}
          <div className="landing-hero__text">
            <div className="landing-badge">🚀 Ahora con IA Nutricional</div>
            <h1 className="landing-h1">
              Tu nutrición,<br />
              <span className="landing-orange">inteligente</span><br />
              y personalizada
            </h1>
            <p className="landing-hero__desc">
              BuddyMarket es el gestor nutricional que se adapta a ti. Menús semanales automáticos, recetas personalizadas, control de inventario y seguimiento nutricional — todo en un solo lugar.
            </p>
            <div className="landing-hero__btns">
              <a href={loginUrl} className="landing-btn-primary">Empezar gratis →</a>
              <a href="#features" className="landing-btn-outline">Ver funcionalidades</a>
            </div>
            <div className="landing-trust">
              {["✅ Sin tarjeta de crédito", "✅ Gratis para siempre", "✅ Cancela cuando quieras"].map(t => (
                <span key={t} className="landing-trust__item">{t}</span>
              ))}
            </div>
          </div>

          {/* Food grid */}
          <div className="landing-hero__grid">
            <div className="landing-hero__grid-tall">
              <img src={FOOD.salmon} alt="Salmón con quinoa" className="landing-img-cover" />
            </div>
            <div className="landing-hero__grid-sm">
              <img src={FOOD.ensalada} alt="Ensalada mediterránea" className="landing-img-cover" />
            </div>
            <div className="landing-hero__grid-sm">
              <img src={FOOD.bowl} alt="Bowl de açaí" className="landing-img-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ════════════════════════════════════════════════════════ */}
      <section className="landing-stats">
        <div className="landing-stats__grid">
          {[
            { value: "50.000+", label: "Usuarios activos" },
            { value: "200.000+", label: "Menús generados" },
            { value: "15.000+", label: "Recetas disponibles" },
            { value: "24", label: "Perfiles especializados" },
          ].map(s => (
            <div key={s.label} className="landing-stats__item">
              <div className="landing-stats__value">{s.value}</div>
              <div className="landing-stats__label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═════════════════════════════════════════════════════ */}
      <section id="features" className="landing-section landing-section--white">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-eyebrow">FUNCIONALIDADES</span>
            <h2 className="landing-h2">Todo lo que necesitas para<br className="hidden sm:block" /> comer bien cada día</h2>
            <p className="landing-section__sub">Una plataforma completa que combina inteligencia artificial con nutrición real para ayudarte a alcanzar tus objetivos.</p>
          </div>

          {/* Feature tabs */}
          <div className="landing-tabs">
            {FEATURES.map((f, i) => (
              <button key={i} onClick={() => setActiveFeature(i)}
                className={`landing-tab ${activeFeature === i ? "landing-tab--active" : ""}`}>
                {f.icon} {f.tag}
              </button>
            ))}
          </div>

          {/* Active feature */}
          <div className="landing-feature">
            <div className="landing-feature__text">
              <div className="landing-feature__icon">{FEATURES[activeFeature].icon}</div>
              <h3 className="landing-h3">{FEATURES[activeFeature].title}</h3>
              <p className="landing-feature__desc">{FEATURES[activeFeature].desc}</p>
              <a href={loginUrl} className="landing-btn-primary landing-btn-primary--sm">Probar ahora →</a>
            </div>
            <div className="landing-feature__img-wrap">
              <img src={FEATURES[activeFeature].img} alt={FEATURES[activeFeature].title} className="landing-img-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SPECIAL MENUS ════════════════════════════════════════════════ */}
      <section id="special" className="landing-section landing-section--warm">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-eyebrow">MENÚS ESPECIALIZADOS</span>
            <h2 className="landing-h2">Un menú para cada persona,<br className="hidden sm:block" /> condición y momento vital</h2>
            <p className="landing-section__sub">Nuestra IA genera menús adaptados a más de 24 perfiles especiales, desde embarazadas hasta personas con condiciones médicas crónicas.</p>
          </div>

          <div className="landing-special-grid">
            {SPECIAL_MENUS.map(m => (
              <div key={m.label} className="landing-special-card">
                <div className="landing-special-card__emoji">{m.emoji}</div>
                <div className="landing-special-card__label">{m.label}</div>
              </div>
            ))}
          </div>

          {/* Food mosaic */}
          <div className="landing-mosaic">
            {[FOOD.pasta, FOOD.teriyaki, FOOD.brownie, FOOD.tortilla, FOOD.acai, FOOD.buddha, FOOD.pan, FOOD.pollo].map((img, i) => (
              <div key={i} className="landing-mosaic__cell">
                <img src={img} alt="" className="landing-img-cover landing-mosaic__img" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═════════════════════════════════════════════════ */}
      <section className="landing-section landing-section--white">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-eyebrow">TESTIMONIOS</span>
            <h2 className="landing-h2">Lo que dicen nuestros usuarios</h2>
          </div>
          <div className="landing-testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="landing-testimonial">
                <div className="landing-testimonial__stars">{"★★★★★"}</div>
                <p className="landing-testimonial__text">"{t.text}"</p>
                <div className="landing-testimonial__author">
                  <div className="landing-testimonial__avatar">
                    <img src={t.img} alt={t.name} className="landing-img-cover" />
                  </div>
                  <div>
                    <div className="landing-testimonial__name">{t.name}</div>
                    <div className="landing-testimonial__role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ══════════════════════════════════════════════════════ */}
      <section id="pricing" className="landing-section landing-section--gray">
        <div className="landing-container">
          <div className="landing-section__header">
            <span className="landing-eyebrow">PRECIOS</span>
            <h2 className="landing-h2">Elige tu plan</h2>
            <p className="landing-section__sub">Sin permanencia. Cancela cuando quieras.</p>
          </div>
          <div className="landing-pricing">
            {PLANS.map((plan, i) => (
              <div key={i} className={`landing-plan ${plan.highlight ? "landing-plan--highlight" : ""}`}>
                {plan.highlight && <div className="landing-plan__badge">MÁS POPULAR</div>}
                <div className="landing-plan__name" style={{ color: plan.color }}>{plan.name.toUpperCase()}</div>
                <div className="landing-plan__price">
                  <span className="landing-plan__amount" style={{ color: plan.highlight ? "white" : "#111827" }}>{plan.price}</span>
                  <span className="landing-plan__period">/{plan.period}</span>
                </div>
                <div className="landing-plan__divider" />
                <ul className="landing-plan__features">
                  {plan.features.map((f, j) => (
                    <li key={j} className="landing-plan__feature" style={{ color: plan.highlight ? "#d1d5db" : "#374151" }}>
                      <span style={{ color: plan.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href={loginUrl} className={`landing-plan__cta ${plan.highlight ? "landing-plan__cta--highlight" : ""}`}
                  style={plan.highlight ? {} : { color: plan.color, borderColor: plan.color }}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BUDDYCOACH ═══════════════════════════════════════════════════ */}
      <section className="landing-section landing-section--dark">
        <div className="landing-container">
          <div className="landing-buddycoach">
            {/* Left */}
            <div className="landing-buddycoach__text">
              <span className="landing-eyebrow landing-eyebrow--orange">ECOSISTEMA BUDDY</span>
              <h2 className="landing-h2 landing-h2--white">
                ¿Eres entrenador personal?<br />
                <span className="landing-orange">Conoce BuddyCoach</span>
              </h2>
              <p className="landing-buddycoach__desc">
                BuddyCoach.io es la plataforma hermana de BuddyMarket diseñada para entrenadores personales y coaches de fitness. Gestiona tus clientes, crea planes de entrenamiento personalizados y conecta la nutrición con el rendimiento deportivo.
              </p>
              <div className="landing-buddycoach__list">
                {[
                  { icon: "👥", text: "Gestión completa de clientes y seguimiento de progreso" },
                  { icon: "🏋️", text: "Planes de entrenamiento personalizados con IA" },
                  { icon: "🔗", text: "Integración directa con los menús nutricionales de BuddyMarket" },
                  { icon: "📈", text: "Métricas de rendimiento, fuerza y composición corporal" },
                  { icon: "💬", text: "Comunicación directa con tus clientes desde la plataforma" },
                ].map((item, i) => (
                  <div key={i} className="landing-buddycoach__list-item">
                    <span className="landing-buddycoach__list-icon">{item.icon}</span>
                    <span className="landing-buddycoach__list-text">{item.text}</span>
                  </div>
                ))}
              </div>
              <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
                Visitar BuddyCoach.io →
              </a>
            </div>

            {/* Right: cards */}
            <div className="landing-buddycoach__cards">
              {[
                { icon: "🎯", title: "Planes a medida", desc: "Crea rutinas de entrenamiento adaptadas a cada cliente con IA" },
                { icon: "📊", title: "Seguimiento real", desc: "Monitoriza fuerza, peso, medidas y rendimiento en tiempo real" },
                { icon: "🥗", title: "Nutrición integrada", desc: "Conecta con BuddyMarket para planes nutricionales completos" },
                { icon: "💰", title: "Gestión de negocio", desc: "Facturación, pagos y gestión de suscripciones de clientes" },
              ].map((card, i) => (
                <div key={i} className="landing-buddycoach__card">
                  <div className="landing-buddycoach__card-icon">{card.icon}</div>
                  <div className="landing-buddycoach__card-title">{card.title}</div>
                  <div className="landing-buddycoach__card-desc">{card.desc}</div>
                </div>
              ))}
              <div className="landing-buddycoach__banner">
                <div>
                  <div className="landing-buddycoach__banner-title">🤝 Ecosistema completo</div>
                  <div className="landing-buddycoach__banner-sub">BuddyMarket + BuddyCoach = nutrición y entrenamiento unidos</div>
                </div>
                <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" className="landing-buddycoach__banner-btn">Ver más →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA FINAL ════════════════════════════════════════════════════ */}
      <section className="landing-cta-final">
        <div className="landing-cta-final__inner">
          <img src={LOGO_COLOR} alt="BuddyMarket" className="landing-cta-final__logo" />
          <h2 className="landing-cta-final__title">Empieza hoy a comer<br />de forma inteligente</h2>
          <p className="landing-cta-final__sub">Únete a más de 50.000 personas que ya han transformado su alimentación con BuddyMarket. Gratis para siempre, sin tarjeta de crédito.</p>
          <a href={loginUrl} className="landing-cta-final__btn">Crear cuenta gratuita →</a>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer__grid">
            <div className="landing-footer__brand">
              <img src={LOGO_COLOR} alt="BuddyMarket" className="landing-footer__logo" />
              <p className="landing-footer__tagline">El gestor nutricional inteligente que se adapta a ti. Planifica, cocina y come bien cada día.</p>
              <p className="landing-footer__disclaimer">⚠️ El contenido de BuddyMarket es orientativo y no sustituye el consejo de un profesional de la salud. Consulta siempre con un nutricionista o médico.</p>
            </div>

            <div>
              <h4 className="landing-footer__col-title">Producto</h4>
              {["Funcionalidades", "Precios", "Menús Especiales", "BuddyMakers", "BuddyExperts"].map(l => (
                <div key={l} className="landing-footer__link-row"><a href="#" className="landing-footer__link">{l}</a></div>
              ))}
              <div className="landing-footer__link-row">
                <a href="https://buddycoach.io" target="_blank" rel="noopener noreferrer" className="landing-footer__link landing-footer__link--orange">BuddyCoach.io ↗</a>
              </div>
            </div>

            <div>
              <h4 className="landing-footer__col-title">Recursos</h4>
              {[{ label: "Blog", href: "/blog" }, { label: "Centro de ayuda", href: "#" }, { label: "Comunidad", href: "#" }].map(l => (
                <div key={l.label} className="landing-footer__link-row"><a href={l.href} className="landing-footer__link">{l.label}</a></div>
              ))}
            </div>

            <div>
              <h4 className="landing-footer__col-title">Legal</h4>
              {[
                { label: "Términos y Condiciones", href: "/terms" },
                { label: "Política de Privacidad", href: "/privacy" },
                { label: "Política de Cookies", href: "/cookies" },
              ].map(l => (
                <div key={l.label} className="landing-footer__link-row">
                  <Link href={l.href} className="landing-footer__link">{l.label}</Link>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-footer__bottom">
            <p className="landing-footer__copy">© 2025 BuddyMarket. Todos los derechos reservados.</p>
            <div className="landing-footer__socials">
              {["Twitter/X", "Instagram", "LinkedIn"].map(s => (
                <a key={s} href="#" className="landing-footer__social">{s}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
