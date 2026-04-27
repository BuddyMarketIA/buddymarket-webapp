import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  id: string;
  icon: string;
  title: string;
  color: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    id: "menus",
    icon: "🥗",
    title: "Menús semanales",
    color: "#F97316",
    items: [
      {
        q: "¿Cómo funciona la generación automática de menús?",
        a: "Buddy One utiliza inteligencia artificial para crear menús semanales personalizados basándose en tu perfil nutricional: objetivos (pérdida de peso, ganancia muscular, mantenimiento), restricciones alimentarias, alergias, número de comensales y preferencias de cocina. El sistema genera un plan completo con desayuno, media mañana, comida, merienda y cena para cada día de la semana.",
      },
      {
        q: "¿Puedo editar el menú generado?",
        a: "Sí. Una vez generado el menú, puedes modificar cualquier comida pulsando sobre ella. Puedes sustituir recetas, cambiar ingredientes o añadir tus propias recetas guardadas. Los cambios se guardan automáticamente en tu biblioteca de menús.",
      },
      {
        q: "¿Qué diferencia hay entre un menú estándar y un menú de BuddyExpert?",
        a: "Los menús estándar los genera la IA de Buddy One en base a tu perfil. Los menús de BuddyExpert son planes nutricionales creados y supervisados por un dietista o nutricionista certificado, que sube un PDF con el plan personalizado para ti. La IA de Buddy One lee ese PDF y lo adapta a tus preferencias para generar el menú final y la lista de la compra.",
      },
      {
        q: "¿Puedo guardar varios menús y alternarlos?",
        a: "Sí. En la sección 'Mis Menús' puedes guardar tantos menús como quieras y activar el que más te convenga cada semana. También puedes asignar una fecha de inicio a cualquier menú para que aparezca automáticamente en tu diario alimentario.",
      },
      {
        q: "¿Los menús incluyen información nutricional?",
        a: "Sí. Cada menú muestra las calorías totales diarias y el desglose de macronutrientes (proteínas, carbohidratos y grasas) por comida y por día. Puedes ver el resumen semanal en tu panel de métricas.",
      },
      {
        q: "¿Puedo exportar o imprimir el menú semanal?",
        a: "La exportación a PDF está disponible en el plan Pro Max. Desde la vista del menú semanal encontrarás el botón de exportar, que genera un PDF listo para imprimir o compartir con todas las recetas, ingredientes y resumen nutricional.",
      },
    ],
  },
  {
    id: "plans",
    icon: "📄",
    title: "Planes de BuddyExperts",
    color: "#10B981",
    items: [
      {
        q: "¿Qué es un plan de BuddyExpert?",
        a: "Es un plan nutricional personalizado creado por un profesional (dietista, nutricionista o entrenador certificado) registrado en Buddy One como BuddyExpert. El experto sube un PDF con tu plan específico, y la IA de Buddy One lo procesa para generar tu menú semanal y lista de la compra adaptados a tus preferencias.",
      },
      {
        q: "¿Cómo accedo al plan que me ha asignado mi BuddyExpert?",
        a: "Una vez que tu BuddyExpert te asigne un plan, recibirás una notificación. Puedes acceder a él desde tu dashboard en la sección 'Mi Plan' o directamente desde el perfil de tu experto. Allí verás el PDF del plan y podrás generar el menú semanal con IA con un solo clic.",
      },
      {
        q: "¿Necesito tener un BuddyExpert para usar Buddy One?",
        a: "No. Buddy One funciona de forma completamente autónoma. Puedes generar menús, recetas y listas de la compra con la IA integrada sin necesidad de contratar a un experto. Los BuddyExperts son un servicio adicional para quienes quieran supervisión profesional personalizada.",
      },
      {
        q: "¿Cómo encuentro un BuddyExpert adecuado para mí?",
        a: "En la sección 'BuddyExperts' puedes explorar los perfiles de todos los expertos disponibles, filtrar por especialidad (nutrición deportiva, pérdida de peso, vegetariano, etc.) y ver sus valoraciones. Puedes seguir a un experto para acceder a sus menús públicos o contratarle para un plan personalizado.",
      },
      {
        q: "¿Qué pasa si el PDF de mi plan no se lee correctamente?",
        a: "La IA está optimizada para leer PDFs de planes nutricionales en formato estándar. Si el resultado no es el esperado, puedes regenerar el menú con diferentes preferencias o contactar con tu BuddyExpert para que actualice el PDF. También puedes editar manualmente el menú generado.",
      },
    ],
  },
  {
    id: "shopping",
    icon: "🛒",
    title: "Lista de la compra",
    color: "#3B82F6",
    items: [
      {
        q: "¿Cómo se genera la lista de la compra?",
        a: "La lista de la compra se genera automáticamente a partir de los ingredientes de todas las recetas del menú semanal activo. El sistema agrupa los ingredientes por categorías (frutas y verduras, proteínas, lácteos, cereales, etc.) y calcula las cantidades exactas para el número de personas configurado en tu perfil.",
      },
      {
        q: "¿Puedo comparar precios entre supermercados?",
        a: "Sí. Buddy One incluye un comparador de precios con productos de Mercadona, Lidl, Carrefour y Alcampo. Puedes ver qué supermercado tiene el precio más bajo para cada ingrediente de tu lista y optimizar tu compra semanal.",
      },
      {
        q: "¿Puedo añadir o eliminar productos de la lista?",
        a: "Sí. La lista de la compra es completamente editable. Puedes añadir productos que no estén en el menú (como artículos del hogar), marcar los que ya tienes en casa, eliminar los que no necesitas y reorganizar las categorías según tu preferencia.",
      },
      {
        q: "¿La lista tiene en cuenta mi inventario actual?",
        a: "Sí, si tienes activada la sección de Inventario. Buddy One cruza los ingredientes del menú con tu inventario y solo incluye en la lista los productos que necesitas comprar. Los artículos próximos a caducar se priorizan en las recetas sugeridas.",
      },
      {
        q: "¿Puedo compartir la lista de la compra?",
        a: "Sí. Puedes compartir la lista en formato texto o PDF con cualquier persona. También puedes exportarla directamente a aplicaciones de notas o mensajería desde el botón de compartir.",
      },
    ],
  },
  {
    id: "ai",
    icon: "🤖",
    title: "Inteligencia Artificial",
    color: "#8B5CF6",
    items: [
      {
        q: "¿Qué IA utiliza Buddy One?",
        a: "Buddy One utiliza modelos de lenguaje avanzados (LLM) para generar menús, recetas y listas de la compra personalizadas. La IA tiene en cuenta tu perfil nutricional completo, historial de menús anteriores y preferencias para mejorar sus recomendaciones con el tiempo.",
      },
      {
        q: "¿Cuántas veces puedo generar menús con IA?",
        a: "En el plan gratuito puedes generar 1 menú con IA al mes como prueba (más 2 menús manuales). Los planes Pro y Pro Max ofrecen generaciones ilimitadas. Los menús generados a partir de un plan de BuddyExpert siempre son gratuitos independientemente de tu plan.",
      },
      {
        q: "¿La IA aprende de mis preferencias?",
        a: "Sí. Cuanto más uses Buddy One, mejor se adaptan las recomendaciones. La IA tiene en cuenta las recetas que has marcado como favoritas, los menús que has guardado, los ingredientes que has excluido y tus valoraciones para personalizar cada vez más los resultados.",
      },
      {
        q: "¿Puedo pedirle a la IA un tipo de menú específico?",
        a: "Sí. En el generador de menús puedes especificar el tipo de dieta (mediterránea, keto, vegana, sin gluten, alta en proteínas, etc.), el número de días, las comidas por día y el número de personas. También puedes añadir instrucciones adicionales en texto libre, como 'sin pescado' o 'recetas rápidas de menos de 30 minutos'.",
      },
      {
        q: "¿Las recomendaciones de la IA son supervisadas por profesionales?",
        a: "Los menús generados por la IA de Buddy One son orientativos y no sustituyen el consejo de un profesional de la salud o la nutrición. Para planes personalizados con supervisión profesional, te recomendamos contratar a uno de nuestros BuddyExperts certificados.",
      },
    ],
  },
  {
    id: "account",
    icon: "👤",
    title: "Cuenta y suscripción",
    color: "#EC4899",
    items: [
      {
        q: "¿Qué incluye el plan gratuito?",
        a: "El plan gratuito incluye: acceso a 207+ recetas de la comunidad, diario nutricional y seguimiento de métricas de salud (90 días de historial), 2 menús manuales al mes + 1 menú IA de prueba, hasta 3 listas de la compra al mes, inventario de hasta 25 productos, hasta 15 recetas guardadas y 5 mensajes con BuddyIA al día. Es suficiente para empezar a organizar tu alimentación.",
      },
      {
        q: "¿Qué ventajas tiene el plan Pro?",
        a: "El plan Pro (9,99€/mes) incluye: generación ilimitada de menús con IA, 24 menús especializados (diabetes, embarazo, celiaquía, deporte...), BuddyIA con 50 mensajes al día, diario nutricional con historial de 6 meses, inventario ilimitado con alertas de caducidad, listas de la compra ilimitadas y conexión con supermercados online. La exportación a PDF está disponible en el plan Pro Max.",
      },
      {
        q: "¿Cómo cancelo mi suscripción?",
        a: "Puedes cancelar tu suscripción en cualquier momento desde tu perfil en la sección 'Suscripción'. La cancelación es inmediata y no se realizarán más cargos. Mantendrás el acceso Pro hasta el final del período ya pagado.",
      },
      {
        q: "¿Puedo cambiar de plan en cualquier momento?",
        a: "Sí. Puedes subir o bajar de plan cuando quieras. Al subir de plan, el cambio es inmediato y se aplica un prorrateo del período restante. Al bajar de plan, el cambio se aplica al inicio del siguiente período de facturación.",
      },
      {
        q: "¿Mis datos están seguros?",
        a: "Sí. Buddy One cumple con el Reglamento General de Protección de Datos (RGPD). Tus datos de salud y perfil nutricional se almacenan de forma cifrada y nunca se comparten con terceros sin tu consentimiento explícito. Puedes solicitar la exportación o eliminación de tus datos en cualquier momento desde tu perfil.",
      },
    ],
  },
];

function AccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      style={{
        borderBottom: "1px solid #f3f4f6",
        overflow: "hidden",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "20px 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.5, flex: 1 }}>{item.q}</span>
        <span style={{ flexShrink: 0, marginTop: 2, color: "#F97316" }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: 20 }}>
          <p style={{ fontSize: 14, color: "#4B5563", lineHeight: 1.75, margin: 0 }}>{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filtered = FAQ_DATA.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        (!search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())) &&
        (!activeCategory || cat.id === activeCategory)
    ),
  })).filter((cat) => cat.items.length > 0);

  const totalQuestions = FAQ_DATA.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", padding: "60px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Link href="/">
            <a style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 14, marginBottom: 32, transition: "color 0.2s" }}>
              <ArrowLeft size={16} />
              Volver al inicio
            </a>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <img
              src="https://cdn-bm.manus.space/buddymarket-logo-b-orange.png"
              alt="Buddy One"
              style={{ width: 36, height: 36, objectFit: "contain" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>Buddy One</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 800, color: "white", margin: "0 0 16px", lineHeight: 1.2 }}>
            Preguntas <span style={{ color: "#F97316" }}>frecuentes</span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: "0 0 32px", lineHeight: 1.6 }}>
            Encuentra respuesta a las {totalQuestions} preguntas más habituales sobre el uso de Buddy One.
          </p>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              type="text"
              placeholder="Buscar en las preguntas frecuentes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 16px 14px 46px",
                borderRadius: 12,
                border: "none",
                fontSize: 15,
                background: "white",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      <div style={{ background: "white", borderBottom: "1px solid #f3f4f6", padding: "0 24px", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto", padding: "12px 0" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              flexShrink: 0,
              padding: "8px 16px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              background: activeCategory === null ? "#F97316" : "#f3f4f6",
              color: activeCategory === null ? "white" : "#374151",
              transition: "all 0.2s",
            }}
          >
            Todas
          </button>
          {FAQ_DATA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              style={{
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: 20,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: activeCategory === cat.id ? cat.color : "#f3f4f6",
                color: activeCategory === cat.id ? "white" : "#374151",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{cat.icon}</span>
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 16, color: "#6B7280" }}>No encontramos resultados para "<strong>{search}</strong>"</p>
            <button onClick={() => { setSearch(""); setActiveCategory(null); }} style={{ marginTop: 16, padding: "10px 24px", borderRadius: 8, border: "none", background: "#F97316", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              Ver todas las preguntas
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {filtered.map((cat) => (
              <div key={cat.id}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${cat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{cat.title}</h2>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{cat.items.length} pregunta{cat.items.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Accordion */}
                <div style={{ background: "white", borderRadius: 16, padding: "0 24px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
                  {cat.items.map((item, idx) => {
                    const key = `${cat.id}-${idx}`;
                    return (
                      <AccordionItem
                        key={key}
                        item={item}
                        isOpen={!!openItems[key]}
                        onToggle={() => toggle(key)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 56, background: "linear-gradient(135deg, #1a1a2e, #0f3460)", borderRadius: 20, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: "white", margin: "0 0 8px" }}>¿No encuentras lo que buscas?</h3>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 24px", lineHeight: 1.6 }}>
            Nuestro equipo de soporte está disponible para ayudarte con cualquier duda sobre tu plan nutricional o el uso de la plataforma.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="mailto:soporte@buddymarket.io"
              style={{ padding: "12px 24px", borderRadius: 10, background: "#F97316", color: "white", textDecoration: "none", fontWeight: 600, fontSize: 14 }}
            >
              Contactar soporte
            </a>
            <Link href="/blog">
              <a style={{ padding: "12px 24px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontWeight: 600, fontSize: 14, border: "1px solid rgba(255,255,255,0.2)" }}>
                Ver el blog
              </a>
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ marginTop: 32, fontSize: 12, color: "#9CA3AF", textAlign: "center", lineHeight: 1.6 }}>
          El contenido de esta plataforma es orientativo y no constituye recomendación médica ni nutricional profesional. Consulta siempre con un profesional de la salud antes de realizar cambios significativos en tu dieta.
        </p>
      </div>
    </div>
  );
}
