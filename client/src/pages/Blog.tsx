import { useState } from "react";
import { Link } from "wouter";

const ORANGE = "#F97316";
const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";

const FOOD_IMAGES = {
  ensalada: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  salmon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  bowl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp",
  buddha: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
  pasta: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pasta_pesto_tomates-ShvKafyUPxQbbjm5oqKBmm.webp",
  pollo: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp",
  teriyaki: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_teriyaki_arroz-BxhouEXinEgLMtuwwTB4gh.webp",
  brownie: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp",
  mealprep: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
  vegetables: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg",
  pan: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp",
  tortilla: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/tortilla_espinacas-cEYtBTb5hV7xgFpTkVy3TG.webp",
};

const CATEGORIES = ["Todos", "Nutrición", "Recetas", "Salud", "Bienestar", "Guías", "Ciencia"];

const POSTS = [
  {
    id: 1,
    title: "Cómo planificar tu menú semanal en menos de 10 minutos",
    excerpt: "La planificación semanal es la clave para comer bien sin estrés. Te enseñamos el método BuddyMarket para tener tu semana organizada en un tiempo récord.",
    category: "Guías",
    date: "28 Mar 2025",
    readTime: "5 min",
    img: FOOD_IMAGES.mealprep,
    featured: true,
  },
  {
    id: 2,
    title: "Los 14 alérgenos de declaración obligatoria en Europa",
    excerpt: "Conoce cuáles son los alérgenos que la normativa europea obliga a declarar en todos los alimentos y cómo BuddyMarket te ayuda a evitarlos en tu dieta.",
    category: "Salud",
    date: "22 Mar 2025",
    readTime: "7 min",
    img: FOOD_IMAGES.vegetables,
    featured: false,
  },
  {
    id: 3,
    title: "Dieta mediterránea: la ciencia detrás del patrón más saludable del mundo",
    excerpt: "Numerosos estudios avalan la dieta mediterránea como el patrón alimentario con mayor evidencia científica para la prevención de enfermedades crónicas.",
    category: "Ciencia",
    date: "15 Mar 2025",
    readTime: "9 min",
    img: FOOD_IMAGES.ensalada,
    featured: false,
  },
  {
    id: 4,
    title: "Receta: Salmón con quinoa y verduras asadas",
    excerpt: "Una receta completa, rica en omega-3 y proteínas de alta calidad. Lista en 25 minutos y con todos los macronutrientes que tu cuerpo necesita.",
    category: "Recetas",
    date: "10 Mar 2025",
    readTime: "4 min",
    img: FOOD_IMAGES.salmon,
    featured: false,
  },
  {
    id: 5,
    title: "Alimentación durante el embarazo: qué comer en cada trimestre",
    excerpt: "Las necesidades nutricionales cambian significativamente durante el embarazo. Descubre qué nutrientes son esenciales y cómo cubrirlos con una dieta equilibrada.",
    category: "Salud",
    date: "5 Mar 2025",
    readTime: "11 min",
    img: FOOD_IMAGES.bowl,
    featured: false,
  },
  {
    id: 6,
    title: "Meal prep dominical: prepara 5 días de comida en 2 horas",
    excerpt: "El meal prep es la estrategia más eficiente para mantener una alimentación saludable durante la semana. Te contamos cómo organizarlo paso a paso.",
    category: "Guías",
    date: "28 Feb 2025",
    readTime: "8 min",
    img: FOOD_IMAGES.mealprep,
    featured: false,
  },
  {
    id: 7,
    title: "Proteínas vegetales: las mejores fuentes y cómo combinarlas",
    excerpt: "Si sigues una dieta vegana o vegetariana, conocer las fuentes de proteína vegetal y cómo combinarlas es fundamental para cubrir todos los aminoácidos esenciales.",
    category: "Nutrición",
    date: "20 Feb 2025",
    readTime: "6 min",
    img: FOOD_IMAGES.buddha,
    featured: false,
  },
  {
    id: 8,
    title: "Receta: Buddha bowl vegano con tahini y garbanzos crujientes",
    excerpt: "Un plato completo, colorido y lleno de nutrientes. Esta receta es perfecta para el almuerzo y se puede preparar con antelación.",
    category: "Recetas",
    date: "14 Feb 2025",
    readTime: "5 min",
    img: FOOD_IMAGES.buddha,
    featured: false,
  },
  {
    id: 9,
    title: "Intolerancia al gluten vs. celiaquía: diferencias clave",
    excerpt: "Aunque a menudo se confunden, la intolerancia al gluten y la enfermedad celíaca son condiciones distintas con implicaciones nutricionales diferentes.",
    category: "Salud",
    date: "7 Feb 2025",
    readTime: "8 min",
    img: FOOD_IMAGES.pan,
    featured: false,
  },
];

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = POSTS.filter(p => {
    const matchCat = activeCategory === "Todos" || p.category === activeCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered.find(p => p.featured) || filtered[0];
  const rest = filtered.filter(p => p.id !== featured?.id);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>

      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/">
            <img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 60, objectFit: "contain", cursor: "pointer" }} />
          </Link>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al inicio</Link>
            <Link href="/dashboard" style={{
              padding: "8px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
              color: "white", background: ORANGE, textDecoration: "none",
            }}>Abrir app</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)", padding: "64px 24px 48px", textAlign: "center" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: ORANGE, letterSpacing: "0.1em", textTransform: "uppercase" }}>BLOG DE NUTRICIÓN</span>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "#111827", marginTop: 12, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Aprende a comer bien
          </h1>
          <p style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.7 }}>
            Artículos, recetas y guías escritas por nutricionistas y expertos en alimentación saludable.
          </p>

          {/* Search */}
          <div style={{ marginTop: 32, position: "relative", maxWidth: 480, margin: "32px auto 0" }}>
            <input
              type="text"
              placeholder="Buscar artículos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "14px 20px 14px 48px", borderRadius: 12, fontSize: 15,
                border: "2px solid #e5e7eb", outline: "none", background: "white",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = ORANGE)}
              onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
            />
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 4, overflowX: "auto", padding: "16px 0" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: "8px 20px", borderRadius: 100, fontSize: 14, fontWeight: 600,
              cursor: "pointer", border: "none", whiteSpace: "nowrap", transition: "all 0.2s",
              background: activeCategory === cat ? ORANGE : "#f3f4f6",
              color: activeCategory === cat ? "white" : "#374151",
            }}>{cat}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>

        {/* Featured post */}
        {featured && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48,
            background: "white", borderRadius: 24, overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)", marginBottom: 48,
          }}>
            <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
              <img src={featured.img} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: "40px 40px 40px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <span style={{ background: `${ORANGE}20`, color: ORANGE, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 100 }}>{featured.category}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>Artículo destacado</span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 16, lineHeight: 1.3, letterSpacing: "-0.02em" }}>{featured.title}</h2>
              <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>{featured.excerpt}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{featured.date}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>·</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{featured.readTime} lectura</span>
              </div>
              <a href="#" style={{
                marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8,
                padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                color: "white", background: ORANGE, textDecoration: "none", width: "fit-content",
              }}>Leer artículo →</a>
            </div>
          </div>
        )}

        {/* Grid of posts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {rest.map(post => (
            <article key={post.id} style={{
              background: "white", borderRadius: 20, overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: "all 0.2s",
              cursor: "pointer",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
            >
              <div style={{ aspectRatio: "16/9", overflow: "hidden" }}>
                <img src={post.img} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")} />
              </div>
              <div style={{ padding: 24 }}>
                <span style={{ background: `${ORANGE}15`, color: ORANGE, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100 }}>{post.category}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginTop: 12, marginBottom: 10, lineHeight: 1.4, letterSpacing: "-0.01em" }}>{post.title}</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 16 }}>{post.excerpt.substring(0, 100)}...</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>{post.date} · {post.readTime}</span>
                  <a href="#" style={{ fontSize: 13, fontWeight: 600, color: ORANGE, textDecoration: "none" }}>Leer →</a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ fontSize: 18 }}>No se encontraron artículos para "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Footer mini */}
      <footer style={{ background: "#0f172a", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#4b5563" }}>© 2025 BuddyMarket · <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Términos</Link> · <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>Privacidad</Link></p>
        <p style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>⚠️ El contenido de este blog es orientativo y no sustituye el consejo de un profesional de la salud.</p>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          article { grid-column: span 1 !important; }
        }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
