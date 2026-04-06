import { Link } from "wouter";

const ORANGE = "#F97316";
const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-horizontal-orange_0dcbe0a8.png";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #f3f4f6", letterSpacing: "-0.01em" }}>{title}</h2>
    <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function Terms() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>
      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/"><img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 60, objectFit: "contain", cursor: "pointer" }} /></Link>
          <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al inicio</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "64px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>LEGAL</span>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "#111827", marginTop: 8, marginBottom: 12, letterSpacing: "-0.02em" }}>Términos y Condiciones</h1>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Última actualización: 1 de abril de 2025</p>
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "16px 20px", marginTop: 24 }}>
            <p style={{ fontSize: 14, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
              <strong>Aviso importante:</strong> El contenido de BuddyMarket tiene carácter informativo y orientativo. No constituye consejo médico, nutricional ni dietético profesional. Consulta siempre con un médico o nutricionista colegiado antes de realizar cambios significativos en tu alimentación.
            </p>
          </div>
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: "48px 48px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

          <Section title="1. Aceptación de los Términos">
            <p>Al acceder y utilizar la plataforma BuddyMarket (en adelante, "la Plataforma"), accesible a través de la dirección web correspondiente, el usuario (en adelante, "el Usuario") acepta de forma expresa y sin reservas los presentes Términos y Condiciones de Uso (en adelante, "los Términos").</p>
            <p style={{ marginTop: 12 }}>Si el Usuario no está de acuerdo con alguno de los presentes Términos, deberá abstenerse de utilizar la Plataforma. BuddyMarket se reserva el derecho de modificar estos Términos en cualquier momento, siendo responsabilidad del Usuario revisarlos periódicamente.</p>
          </Section>

          <Section title="2. Descripción del Servicio">
            <p>BuddyMarket es una plataforma de gestión nutricional inteligente que ofrece, entre otros, los siguientes servicios:</p>
            <ul style={{ marginTop: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Generación de menús semanales personalizados mediante inteligencia artificial.</li>
              <li>Biblioteca de recetas saludables con información nutricional detallada.</li>
              <li>Seguimiento y registro del diario nutricional del Usuario.</li>
              <li>Gestión del inventario doméstico de alimentos.</li>
              <li>Generación de listas de la compra automatizadas.</li>
              <li>Menús especializados para condiciones médicas y etapas vitales específicas.</li>
              <li>Comunidad de creadores de contenido nutricional (BuddyMakers) y expertos (BuddyExperts).</li>
            </ul>
            <p style={{ marginTop: 12 }}>Los servicios ofrecidos tienen carácter exclusivamente informativo y de apoyo a la planificación alimentaria. BuddyMarket no ejerce actividad médica ni sanitaria regulada.</p>
          </Section>

          <Section title="3. Registro y Cuenta de Usuario">
            <p>Para acceder a las funcionalidades completas de la Plataforma, el Usuario deberá crear una cuenta mediante el sistema de autenticación habilitado. El Usuario se compromete a:</p>
            <ul style={{ marginTop: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Proporcionar información veraz, exacta y actualizada durante el registro.</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
              <li>Notificar de inmediato a BuddyMarket cualquier uso no autorizado de su cuenta.</li>
              <li>No ceder, transferir ni compartir su cuenta con terceros.</li>
            </ul>
            <p style={{ marginTop: 12 }}>BuddyMarket se reserva el derecho de suspender o cancelar cuentas que incumplan estos Términos o que realicen un uso fraudulento o abusivo de la Plataforma.</p>
          </Section>

          <Section title="4. Tipos de Cuenta y Proceso de Aprobación">
            <p>La Plataforma ofrece los siguientes tipos de cuenta:</p>
            <ul style={{ marginTop: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>Usuario estándar:</strong> Acceso a las funcionalidades básicas de la Plataforma.</li>
              <li><strong>BuddyMaker:</strong> Creadores de contenido nutricional. Requiere solicitud y aprobación previa por parte del equipo de BuddyMarket.</li>
              <li><strong>BuddyExpert:</strong> Profesionales de la nutrición y la salud. Requiere acreditación de titulación oficial y aprobación por parte del equipo de BuddyMarket.</li>
            </ul>
            <p style={{ marginTop: 12 }}>BuddyMarket se reserva el derecho de rechazar, suspender o revocar cualquier solicitud o cuenta de BuddyMaker o BuddyExpert sin necesidad de justificación expresa.</p>
          </Section>

          <Section title="5. Planes de Suscripción y Pagos">
            <p>BuddyMarket ofrece planes de acceso gratuito y de pago. Los planes de pago se facturan de forma mensual o anual según la opción elegida por el Usuario. Los precios vigentes se muestran en la sección de precios de la Plataforma.</p>
            <p style={{ marginTop: 12 }}>El Usuario puede cancelar su suscripción en cualquier momento desde su perfil. La cancelación será efectiva al final del período de facturación en curso, sin derecho a reembolso proporcional por el período no utilizado, salvo en los casos previstos por la normativa de consumidores aplicable.</p>
          </Section>

          <Section title="6. Limitación de Responsabilidad Médica y Nutricional">
            <p style={{ fontWeight: 600, color: "#92400e", background: "#fff7ed", padding: "16px", borderRadius: 8, border: "1px solid #fed7aa" }}>
              BuddyMarket no es un servicio médico ni sanitario. Los menús, recetas, recomendaciones nutricionales y cualquier otro contenido generado por la Plataforma, incluyendo los generados mediante inteligencia artificial, tienen carácter exclusivamente informativo y orientativo.
            </p>
            <p style={{ marginTop: 12 }}>BuddyMarket no se hace responsable de:</p>
            <ul style={{ marginTop: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <li>Daños a la salud derivados del seguimiento de los menús o recomendaciones de la Plataforma sin supervisión profesional.</li>
              <li>Reacciones alérgicas o intolerancias no declaradas en el perfil del Usuario.</li>
              <li>Interacciones entre la alimentación recomendada y medicamentos o tratamientos médicos.</li>
              <li>Resultados específicos en términos de pérdida de peso, rendimiento deportivo o mejora de condiciones médicas.</li>
            </ul>
          </Section>

          <Section title="7. Propiedad Intelectual">
            <p>Todos los contenidos de la Plataforma, incluyendo textos, imágenes, logotipos, diseños, código fuente, bases de datos y algoritmos, son propiedad de BuddyMarket o de sus licenciantes, y están protegidos por la legislación vigente en materia de propiedad intelectual e industrial.</p>
            <p style={{ marginTop: 12 }}>El Usuario tiene una licencia limitada, no exclusiva, intransferible y revocable para usar la Plataforma únicamente para sus fines personales y no comerciales. Queda expresamente prohibida la reproducción, distribución, modificación o explotación comercial de cualquier contenido de la Plataforma sin autorización expresa y por escrito de BuddyMarket.</p>
          </Section>

          <Section title="8. Contenido Generado por el Usuario">
            <p>El Usuario es el único responsable del contenido que publique en la Plataforma (recetas, comentarios, imágenes, etc.). Al publicar contenido, el Usuario otorga a BuddyMarket una licencia mundial, no exclusiva, libre de regalías para usar, reproducir, modificar y distribuir dicho contenido en el contexto de la Plataforma.</p>
            <p style={{ marginTop: 12 }}>BuddyMarket se reserva el derecho de eliminar cualquier contenido que considere inapropiado, ofensivo, engañoso o que infrinja derechos de terceros.</p>
          </Section>

          <Section title="9. Legislación Aplicable y Jurisdicción">
            <p>Los presentes Términos se rigen por la legislación española. Para la resolución de cualquier controversia derivada de la interpretación o aplicación de estos Términos, las partes se someten a los juzgados y tribunales competentes según la normativa vigente.</p>
            <p style={{ marginTop: 12 }}>Para usuarios consumidores en la Unión Europea, la plataforma de resolución de litigios en línea de la Comisión Europea está disponible en: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: ORANGE }}>https://ec.europa.eu/consumers/odr</a></p>
          </Section>

          <Section title="10. Contacto">
            <p>Para cualquier consulta relacionada con estos Términos, puede ponerse en contacto con nosotros a través de:</p>
            <ul style={{ marginTop: 12, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <li><strong>Email:</strong> legal@buddymarket.app</li>
              <li><strong>Dirección:</strong> BuddyMarket S.L., España</li>
            </ul>
          </Section>
        </div>

        <div style={{ marginTop: 32, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Privacidad →</Link>
          <Link href="/cookies" style={{ fontSize: 14, color: ORANGE, textDecoration: "none", fontWeight: 600 }}>Política de Cookies →</Link>
        </div>
      </div>
    </div>
  );
}
