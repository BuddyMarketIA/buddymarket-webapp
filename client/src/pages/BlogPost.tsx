import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

const ORANGE = "#F97316";
const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_0a0f0e6b.png";
const BASE_URL = "https://buddyone.io";

const STATIC_BLOG_CONTENT: Record<string, { title: string; excerpt: string; content: string; category: string; coverImageUrl: string; readTimeMinutes: number; publishedAt: string; authorName: string }> = {
  "planificar-menu-semanal": {
    title: "Cómo planificar tu menú semanal en menos de 10 minutos",
    excerpt: "La planificación semanal es la clave para comer bien sin estrés. Te enseñamos el método Buddy One.",
    category: "Guías",
    coverImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
    readTimeMinutes: 5,
    publishedAt: "2025-03-28",
    authorName: "Equipo Buddy One",
    content: `## ¿Por qué planificar tu menú semanal?\n\nPlanificar lo que vas a comer durante la semana no es solo una cuestión de organización: es una de las estrategias más efectivas para mejorar tu alimentación, ahorrar dinero y reducir el desperdicio de alimentos.\n\nSegún estudios publicados en el *International Journal of Behavioral Nutrition and Physical Activity*, las personas que planifican sus comidas tienen una dieta significativamente más variada y saludable.\n\n## El método Buddy One en 4 pasos\n\n### 1. Define tu objetivo nutricional\n\nAntes de elegir recetas, establece qué quieres lograr: perder peso, ganar masa muscular, mantener tu peso actual o simplemente comer más equilibrado. Buddy One calcula automáticamente tus necesidades calóricas y de macronutrientes.\n\n### 2. Elige tus preferencias\n\nIndica tus alergias, intolerancias, alimentos que no te gustan y tu presupuesto semanal. La IA de Buddy One tiene en cuenta más de 50 parámetros para generar un menú personalizado.\n\n### 3. Genera tu menú con IA\n\nCon un solo toque, Buddy One genera un menú semanal completo con desayuno, comida, merienda y cena para los 7 días. Cada comida incluye información nutricional detallada.\n\n### 4. Obtén tu lista de la compra\n\nAutomáticamente se genera una lista de la compra optimizada con las cantidades exactas que necesitas, organizada por categorías de supermercado.\n\n## Consejos para mantener el hábito\n\n- Dedica 10 minutos cada domingo a revisar y ajustar tu menú\n- Prepara los ingredientes básicos con antelación (batch cooking)\n- Permite flexibilidad: intercambia comidas entre días si lo necesitas\n- Guarda tus menús favoritos para reutilizarlos\n\n## Conclusión\n\nPlanificar tu menú semanal no tiene por qué ser complicado. Con las herramientas adecuadas, puedes hacerlo en menos de 10 minutos y notarás la diferencia en tu salud, tu bolsillo y tu tiempo libre.`
  },
  "14-alergenos-europa": {
    title: "Los 14 alérgenos de declaración obligatoria en Europa",
    excerpt: "Conoce cuáles son los alérgenos que la normativa europea obliga a declarar en todos los alimentos.",
    category: "Salud",
    coverImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg",
    readTimeMinutes: 7,
    publishedAt: "2025-03-22",
    authorName: "Equipo Buddy One",
    content: `## Normativa europea sobre alérgenos\n\nEl Reglamento (UE) nº 1169/2011 establece que todos los alimentos comercializados en la Unión Europea deben declarar obligatoriamente la presencia de 14 alérgenos. Esta normativa aplica tanto a productos envasados como a alimentos servidos en restaurantes y cafeterías.\n\n## Los 14 alérgenos obligatorios\n\n### 1. Gluten\nPresente en trigo, centeno, cebada, avena, espelta y sus variedades híbridas. Afecta a celíacos y personas con sensibilidad al gluten no celíaca.\n\n### 2. Crustáceos\nCangrejos, langostinos, gambas, bogavante y similares. Pueden causar reacciones graves incluso en pequeñas cantidades.\n\n### 3. Huevos\nUno de los alérgenos más comunes en niños. Presente en muchos productos procesados como salsas, rebozados y repostería.\n\n### 4. Pescado\nTodas las especies de pescado y productos derivados, excepto la gelatina de pescado utilizada como soporte de vitaminas.\n\n### 5. Cacahuetes\nLeguminosa con alto potencial alergénico. Puede provocar anafilaxia en personas sensibilizadas.\n\n### 6. Soja\nPresente en numerosos productos procesados como emulsionante (lecitina de soja), proteína texturizada y aceites.\n\n### 7. Leche\nIncluye lactósea y proteínas lácteas (caseína, lactoalbúmina). Presente en mantequilla, queso, yogur y muchos procesados.\n\n### 8. Frutos de cáscara\nAlmendras, avellanas, nueces, anacardos, pacanas, nueces de Brasil, pistachos y nueces de macadamia.\n\n### 9. Apio\nTanto el tallo como las hojas y semillas. Común en caldos, sopas y mezclas de especias.\n\n### 10. Mostaza\nSemillas y preparados de mostaza. Presente en salsas, aderezos y marinados.\n\n### 11. Sésamo\nSemillas de sésamo y aceite de sésamo. Cada vez más común en panadería y cocina asiática.\n\n### 12. Dióxido de azufre y sulfitos\nConservantes presentes en vinos, frutos secos, vinagre y algunos embutidos. Declaración obligatoria por encima de 10 mg/kg.\n\n### 13. Altramuces\nLeguminosa utilizada en panadería y como sustituto de la soja. Puede haber reactividad cruzada con cacahuetes.\n\n### 14. Moluscos\nMejillones, almejas, ostras, calamares, pulpo y caracoles. Incluye productos derivados.\n\n## Cómo te ayuda Buddy One\n\nEn Buddy One puedes configurar tus alergias e intolerancias en tu perfil. La IA excluirá automáticamente cualquier receta o ingrediente que contenga tus alérgenos, garantizando que tu menú semanal sea 100% seguro para ti.`
  },
  "dieta-mediterranea-ciencia": {
    title: "Dieta mediterránea: la ciencia detrás del patrón más saludable",
    excerpt: "Numerosos estudios avalan la dieta mediterránea como el patrón alimentario con mayor evidencia científica.",
    category: "Ciencia",
    coverImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
    readTimeMinutes: 9,
    publishedAt: "2025-03-15",
    authorName: "Equipo Buddy One",
    content: `## ¿Qué es la dieta mediterránea?\n\nLa dieta mediterránea no es una "dieta" en el sentido restrictivo, sino un patrón alimentario tradicional de los países que bordean el mar Mediterráneo. Fue reconocida por la UNESCO como Patrimonio Cultural Inmaterial de la Humanidad en 2010.\n\n## Evidencia científica\n\n### Estudio PREDIMED\n\nEl estudio PREDIMED (Prevención con Dieta Mediterránea), publicado en el *New England Journal of Medicine*, demostró que la dieta mediterránea suplementada con aceite de oliva virgen extra o frutos secos reduce un 30% el riesgo de eventos cardiovasculares mayores.\n\n### Beneficios demostrados\n\n- **Salud cardiovascular:** Reducción del colesterol LDL y la presión arterial\n- **Diabetes tipo 2:** Mejora la sensibilidad a la insulina y reduce el riesgo de desarrollo\n- **Salud cerebral:** Asociada a menor riesgo de deterioro cognitivo y Alzheimer\n- **Longevidad:** Los países mediterráneos tienen de las mayores esperanzas de vida del mundo\n- **Control de peso:** Patrón sostenible que no requiere restricciones extremas\n\n## Pilares de la dieta mediterránea\n\n### Alimentos base (consumo diario)\n- Aceite de oliva virgen extra como grasa principal\n- Cereales integrales (pan, pasta, arroz)\n- Frutas y verduras de temporada (mínimo 5 raciones)\n- Legumbres (3-4 veces por semana)\n- Frutos secos (un puñado diario)\n\n### Consumo moderado (semanal)\n- Pescado y marisco (2-3 veces)\n- Huevos (3-4 unidades)\n- Lácteos fermentados (yogur, queso)\n- Aves de corral\n\n### Consumo ocasional\n- Carnes rojas (máximo 1-2 veces al mes)\n- Dulces y procesados\n\n## Cómo aplicarla con Buddy One\n\nBuddy One incluye el patrón mediterráneo como una de las opciones de menú semanal. La IA genera menús que respetan las proporciones y frecuencias recomendadas por la evidencia científica, adaptados a tus gustos y necesidades calóricas.`
  },
  "receta-salmon-quinoa": {
    title: "Receta: Salmón con quinoa y verduras asadas",
    excerpt: "Una receta completa, rica en omega-3 y proteínas de alta calidad. Lista en 25 minutos.",
    category: "Recetas",
    coverImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
    readTimeMinutes: 4,
    publishedAt: "2025-03-10",
    authorName: "Equipo Buddy One",
    content: `## Salmón con quinoa y verduras asadas\n\nEsta receta combina proteína de alta calidad, ácidos grasos omega-3 y carbohidratos complejos en un solo plato equilibrado. Perfecta para una comida o cena nutritiva.\n\n## Información nutricional (por ración)\n\n- **Calorías:** 485 kcal\n- **Proteínas:** 38g\n- **Grasas:** 22g (de las cuales 4g omega-3)\n- **Carbohidratos:** 35g\n- **Fibra:** 6g\n\n## Ingredientes (2 raciones)\n\n- 2 filetes de salmón fresco (150g cada uno)\n- 150g de quinoa\n- 1 calabacín mediano\n- 1 pimiento rojo\n- 1 cebolla morada\n- 2 cucharadas de aceite de oliva virgen extra\n- Zumo de medio limón\n- Sal, pimienta y hierbas provenzales\n- Semillas de sésamo (opcional)\n\n## Preparación\n\n### Paso 1: Preparar la quinoa (15 min)\nLava la quinoa bajo el grifo con un colador fino. Cuece en una olla con el doble de agua durante 12-15 minutos hasta que absorba todo el líquido. Reserva tapada.\n\n### Paso 2: Asar las verduras (20 min)\nCorta el calabacín, el pimiento y la cebolla en trozos medianos. Coloca en una bandeja de horno con una cucharada de aceite, sal y hierbas provenzales. Hornea a 200°C durante 20 minutos.\n\n### Paso 3: Cocinar el salmón (8 min)\nSazona los filetes con sal y pimienta. En una sartén caliente con una cucharada de aceite, cocina el salmón 4 minutos por cada lado hasta que esté dorado por fuera y jugoso por dentro.\n\n### Paso 4: Emplatar\nSirve la quinoa como base, coloca las verduras asadas alrededor y el salmón encima. Aliña con zumo de limón y espolvorea semillas de sésamo.\n\n## Consejos\n\n- Puedes sustituir el salmón por trucha o caballa para variar\n- La quinoa sobrante se conserva 3 días en la nevera\n- Añade aguacate en lonchas para más grasas saludables`
  },
  "proteinas-vegetales-fuentes": {
    title: "Proteínas vegetales: las mejores fuentes y cómo combinarlas",
    excerpt: "Si sigues una dieta vegana o vegetariana, conocer las fuentes de proteína vegetal es fundamental.",
    category: "Nutrición",
    coverImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
    readTimeMinutes: 6,
    publishedAt: "2025-02-20",
    authorName: "Equipo Buddy One",
    content: `## ¿Son suficientes las proteínas vegetales?\n\nUna de las preguntas más frecuentes sobre dietas vegetarianas y veganas es si es posible obtener suficiente proteína sin consumir productos animales. La respuesta es sí, siempre que se planifique adecuadamente.\n\n## Las mejores fuentes de proteína vegetal\n\n### Legumbres (20-25g proteína/100g en seco)\n- **Lentejas:** 24g/100g. Versátiles y rápidas de cocinar\n- **Garbanzos:** 21g/100g. Base del hummus y falafel\n- **Judías negras:** 21g/100g. Ideales para bowls y burritos\n- **Edamame:** 11g/100g (cocido). Snack perfecto\n\n### Derivados de soja\n- **Tofu firme:** 17g/100g. Absorbe cualquier sabor\n- **Tempeh:** 20g/100g. Fermentado, más digestible\n- **Soja texturizada:** 50g/100g (seca). Sustituye a la carne picada\n\n### Cereales y pseudocereales\n- **Quinoa:** 14g/100g. Proteína completa (todos los aminoácidos esenciales)\n- **Avena:** 13g/100g. Perfecta para desayunos\n- **Trigo sarraceno:** 13g/100g. Sin gluten\n\n### Frutos secos y semillas\n- **Semillas de cáñamo:** 32g/100g. Proteína completa\n- **Semillas de calabaza:** 30g/100g. Ricas en zinc\n- **Almendras:** 21g/100g. También ricas en calcio\n- **Mantequilla de cacahuete:** 25g/100g. Calorícamente densa\n\n## La complementación proteica\n\nLas proteínas vegetales (excepto soja, quinoa y cáñamo) suelen ser deficientes en uno o más aminoácidos esenciales. La solución es combinar diferentes fuentes a lo largo del día:\n\n- **Legumbres + cereales:** Lentejas con arroz, hummus con pan\n- **Legumbres + frutos secos:** Ensalada de garbanzos con nueces\n- **Cereales + semillas:** Avena con semillas de chía\n\n## ¿Cuánta proteína necesitas?\n\n- Adulto sedentario: 0,8g/kg de peso corporal\n- Deportista recreativo: 1,2-1,4g/kg\n- Deportista de fuerza: 1,6-2,2g/kg\n\n## Cómo te ayuda Buddy One\n\nSi configuras tu perfil como vegetariano o vegano, Buddy One genera menús que aseguran la complementación proteica automáticamente, garantizando que cubres todos los aminoácidos esenciales cada día.`
  },
  "intolerancia-gluten-celiaquia": {
    title: "Intolerancia al gluten vs. celiaquía: diferencias clave",
    excerpt: "Aunque a menudo se confunden, la intolerancia al gluten y la celiaquía son condiciones distintas.",
    category: "Salud",
    coverImageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp",
    readTimeMinutes: 8,
    publishedAt: "2025-02-07",
    authorName: "Equipo Buddy One",
    content: `## Celiaquía y sensibilidad al gluten: no es lo mismo\n\nMuchas personas utilizan indistintamente los términos "celiaquía" e "intolerancia al gluten", pero son condiciones médicas diferentes con mecanismos, diagnósticos y tratamientos distintos.\n\n## Enfermedad celíaca\n\n### ¿Qué es?\nLa celiaquía es una enfermedad autoinmune crónica en la que la ingesta de gluten provoca daño en la mucosa del intestino delgado. Afecta aproximadamente al 1% de la población, aunque se estima que el 75% de los celíacos están sin diagnosticar.\n\n### Síntomas\n- Diarrea crónica o estreñimiento\n- Hinchazón y dolor abdominal\n- Pérdida de peso involuntaria\n- Anemia ferropénica\n- Fatiga crónica\n- Dermatitis herpetiforme\n- En niños: retraso del crecimiento\n\n### Diagnóstico\n- Analítica de sangre: anticuerpos anti-transglutaminasa (anti-tTG IgA)\n- Biopsia intestinal: atrofia de vellosidades\n- Estudio genético: HLA-DQ2/DQ8 (necesario pero no suficiente)\n\n### Tratamiento\nDieta estricta sin gluten de por vida. Incluso trazas pueden causar daño intestinal.\n\n## Sensibilidad al gluten no celíaca (SGNC)\n\n### ¿Qué es?\nCondición en la que se experimentan síntomas similares a la celiaquía tras consumir gluten, pero sin daño intestinal ni marcadores autoinmunes. Afecta al 6-10% de la población.\n\n### Síntomas\n- Hinchazón abdominal\n- Dolor de cabeza\n- Fatiga\n- Dolor articular\n- Niebla mental\n- Síntomas digestivos variables\n\n### Diagnóstico\nPor exclusión: se descarta celiaquía y alergia al trigo. No existe un biomarcador específico.\n\n### Tratamiento\nReducción o eliminación del gluten según tolerancia individual. No requiere ser tan estricto como en celiaquía.\n\n## Diferencias clave\n\n- **Mecanismo:** Celiaquía es autoinmune; SGNC no lo es\n- **Daño intestinal:** Solo en celiaquía\n- **Diagnóstico:** Celiaquía tiene marcadores; SGNC es por exclusión\n- **Estrictez de la dieta:** Celiaquía requiere 0 gluten; SGNC permite cierta tolerancia\n- **Complicaciones a largo plazo:** Celiaquía puede causar osteoporosis, linfoma; SGNC no tiene complicaciones graves conocidas\n\n## Cómo te ayuda Buddy One\n\nEn tu perfil puedes indicar si eres celíaco o si tienes sensibilidad al gluten. Buddy One adapta tus menús eliminando completamente el gluten (celiaquía) o reduciéndolo según tu nivel de tolerancia (SGNC), asegurando siempre alternativas nutritivas y sabrosas.`
  }
};

function renderMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:700;color:#111827;margin:24px 0 10px;letter-spacing:-0.01em">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:22px;font-weight:800;color:#111827;margin:32px 0 12px;letter-spacing:-0.02em">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:28px;font-weight:900;color:#111827;margin:40px 0 16px;letter-spacing:-0.02em">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li style="margin:6px 0;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, (m) => `<ul style="padding-left:24px;margin:16px 0;list-style:disc">${m}</ul>`)
    // Paragraphs (lines not starting with HTML tags)
    .replace(/^(?!<[h|u|l])(.+)$/gm, '<p style="margin:0 0 16px;line-height:1.8;color:#374151;font-size:17px">$1</p>')
    // Clean up empty paragraphs
    .replace(/<p[^>]*>\s*<\/p>/g, '');
}

// ── Newsletter Form Component ────────────────────────────────────────────────
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => setStatus("success"),
    onError: () => setStatus("error"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    subscribeMutation.mutate({ email, name: name || undefined, source: "blog" });
  }

  if (status === "success") {
    return (
      <div style={{ marginTop: 56, padding: "40px 32px", background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)", borderRadius: 16, border: "1px solid #FDBA74", textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 8 }}>¡Suscripción confirmada!</h3>
        <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 400, margin: "0 auto" }}>Recibirás nuestros mejores artículos sobre nutrición, recetas y bienestar directamente en tu bandeja de entrada.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 56, padding: "40px 32px", background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)", borderRadius: 16, border: "1px solid #FED7AA" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
          📨 Recibe más contenido como este
        </h3>
        <p style={{ fontSize: 15, color: "#6b7280", maxWidth: 480, margin: "0 auto" }}>
          Suscríbete a nuestra newsletter y recibe cada semana recetas, consejos nutricionales y guías exclusivas.
        </p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Tu nombre (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: "1 1 140px", padding: "12px 16px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "white" }}
          />
          <input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ flex: "2 1 200px", padding: "12px 16px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", background: "white" }}
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading" || !email}
          style={{ padding: "14px 24px", borderRadius: 10, background: ORANGE, color: "white", fontWeight: 700, fontSize: 15, border: "none", cursor: status === "loading" ? "wait" : "pointer", opacity: status === "loading" ? 0.7 : 1, transition: "opacity 0.2s" }}
        >
          {status === "loading" ? "Suscribiendo..." : "Suscribirme gratis"}
        </button>
        {status === "error" && (
          <p style={{ fontSize: 13, color: "#ef4444", textAlign: "center" }}>Error al suscribirte. Inténtalo de nuevo.</p>
        )}
        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 4 }}>
          Sin spam. Puedes darte de baja en cualquier momento. Consulta nuestra{" "}
          <Link href="/privacy" style={{ color: ORANGE, textDecoration: "underline" }}>política de privacidad</Link>.
        </p>
      </form>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  // Fallback to static content if not found in DB
  const staticPost = slug ? STATIC_BLOG_CONTENT[slug] : undefined;
  const displayPost = post ?? (staticPost ? {
    ...staticPost,
    id: 0,
    slug: slug!,
    tags: null,
    viewsCount: 0,
    likesCount: 0,
    updatedAt: staticPost.publishedAt,
    expertId: null,
    expertName: staticPost.authorName,
    expertAvatar: null,
    expertSpecialty: null,
    expertVerified: false,
    expertBio: null,
  } : null);

  // Fetch related articles once we know the category
  const { data: related } = trpc.blog.getRelated.useQuery(
    { slug: slug ?? "", category: displayPost?.category ?? "", limit: 3 },
    { enabled: !!displayPost?.category && !!slug }
  );

  // Inject JSON-LD schema markup for Google rich snippets
  useEffect(() => {
    if (!displayPost) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": displayPost.title,
      "description": displayPost.excerpt ?? "",
      "image": displayPost.coverImageUrl ? [displayPost.coverImageUrl] : [],
      "datePublished": displayPost.publishedAt ? new Date(displayPost.publishedAt).toISOString() : undefined,
      "dateModified": displayPost.updatedAt ? new Date(displayPost.updatedAt).toISOString() : (displayPost.publishedAt ? new Date(displayPost.publishedAt).toISOString() : undefined),
      "author": displayPost.expertName ? {
        "@type": "Person",
        "name": displayPost.expertName,
        "jobTitle": displayPost.expertSpecialty ?? "Nutricionista",
      } : {
        "@type": "Organization",
        "name": "Buddy One",
        "url": BASE_URL,
      },
      "publisher": {
        "@type": "Organization",
        "name": "Buddy One",
        "url": BASE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": LOGO_ICON,
        },
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${BASE_URL}/blog/${displayPost.slug}`,
      },
      "articleSection": displayPost.category,
      "keywords": displayPost.tags ?? "",
    };

    // Remove existing schema tag if any
    const existing = document.getElementById("article-jsonld");
    if (existing) existing.remove();

    const script = document.createElement("script");
    script.id = "article-jsonld";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // Update meta tags for SEO
    document.title = `${displayPost.title} | Buddy One Blog`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", displayPost.excerpt ?? displayPost.title);

    return () => {
      const el = document.getElementById("article-jsonld");
      if (el) el.remove();
    };
  }, [displayPost]);

  if (isLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${ORANGE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#9ca3af", fontFamily: "Inter, sans-serif" }}>Cargando artículo...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !displayPost) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif", minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📄</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Artículo no encontrado</h2>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>Este artículo no existe o ha sido eliminado.</p>
          <Link href="/blog" style={{ padding: "10px 24px", borderRadius: 10, background: ORANGE, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>
            ← Volver al blog
          </Link>
        </div>
      </div>
    );
  }

  const publishedDate = displayPost.publishedAt
    ? new Date(displayPost.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>

      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <img src={LOGO_ICON} alt="Buddy One" style={{ height: 40, width: 40, objectFit: "contain" }} />
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                Buddy<span style={{ color: ORANGE }}>Market</span>
              </span>
            </div>
          </Link>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/blog" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al blog</Link>
            <Link href="/app/dashboard" style={{ padding: "8px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: ORANGE, textDecoration: "none" }}>Abrir app</Link>
          </div>
        </div>
      </nav>

      {/* Cover image */}
      {displayPost.coverImageUrl && (
        <div style={{ width: "100%", maxHeight: 480, overflow: "hidden" }}>
          <img src={displayPost.coverImageUrl} alt={displayPost.title} style={{ width: "100%", height: 480, objectFit: "cover" }} />
        </div>
      )}

      {/* Article */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Category + read time */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
          <span style={{ background: `${ORANGE}20`, color: ORANGE, fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 100 }}>
            {displayPost.category}
          </span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>{displayPost.readTimeMinutes} min de lectura</span>
          {publishedDate && <span style={{ fontSize: 13, color: "#9ca3af" }}>· {publishedDate}</span>}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 24 }}>
          {displayPost.title}
        </h1>

        {/* Author card */}
        {(displayPost.expertName || displayPost.expertAvatar) && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", background: "white", borderRadius: 16, border: "1px solid #f3f4f6", marginBottom: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            {displayPost.expertAvatar ? (
              <img src={displayPost.expertAvatar} alt={displayPost.expertName ?? "Autor"} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "3px solid #fed7aa", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${ORANGE}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👤</div>
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{displayPost.expertName ?? "BuddyExpert"}</span>
                {displayPost.expertVerified && (
                  <span style={{ fontSize: 11, background: `${ORANGE}20`, color: ORANGE, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>✓ Verificado</span>
                )}
              </div>
              {displayPost.expertSpecialty && (
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{displayPost.expertSpecialty}</p>
              )}
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>BuddyExpert en Buddy One</p>
            </div>
          </div>
        )}

        {/* Excerpt */}
        {displayPost.excerpt && (
          <p style={{ fontSize: 19, color: "#6b7280", lineHeight: 1.7, marginBottom: 40, fontStyle: "italic", borderLeft: `4px solid ${ORANGE}`, paddingLeft: 20 }}>
            {displayPost.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          style={{ fontSize: 17, lineHeight: 1.8, color: "#374151" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(displayPost.content ?? "") }}
        />

        {/* Tags */}
        {displayPost.tags && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Etiquetas</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {displayPost.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                <span key={tag} style={{ padding: "6px 14px", borderRadius: 100, background: "#f3f4f6", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA Banner */}
        <div style={{ marginTop: 56, padding: "32px 28px", background: `linear-gradient(135deg, ${ORANGE}15 0%, #fef3c7 100%)`, borderRadius: 20, border: `1px solid ${ORANGE}30`, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🥗</div>
          <h3 style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>¿Quieres mejorar tu alimentación?</h3>
          <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
            Buddy One crea menús personalizados, listas de compra inteligentes y te acompaña en tu objetivo de salud.
          </p>
          <Link href="/register" style={{ display: "inline-block", padding: "12px 28px", borderRadius: 12, background: ORANGE, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            Empieza gratis — sin tarjeta
          </Link>
        </div>

        {/* Related articles */}
        {related && related.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 8, letterSpacing: "-0.02em" }}>
              Artículos relacionados
            </h2>
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 28 }}>Más sobre {displayPost.category}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
              {related.map((article) => (
                <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", transition: "transform 0.15s, box-shadow 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}
                  >
                    {article.coverImageUrl && (
                      <img src={article.coverImageUrl} alt={article.title} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                    )}
                    <div style={{ padding: "16px 18px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: ORANGE, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {article.category}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#111827", margin: "6px 0 8px", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {article.title}
                      </h3>
                      <p style={{ fontSize: 12, color: "#9ca3af" }}>
                        {article.readTimeMinutes} min · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Newsletter Subscription */}
        <NewsletterForm />

        {/* Back to blog */}
        <div style={{ marginTop: 56, textAlign: "center" }}>
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, background: ORANGE, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            ← Ver más artículos
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#0f172a", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#4b5563" }}>© 2025 Buddy One · <Link href="/terminos" style={{ color: "#6b7280", textDecoration: "none" }}>Términos</Link> · <Link href="/privacidad" style={{ color: "#6b7280", textDecoration: "none" }}>Privacidad</Link></p>
        <p style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>⚠️ El contenido de este blog es orientativo y no sustituye el consejo de un profesional de la salud.</p>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
