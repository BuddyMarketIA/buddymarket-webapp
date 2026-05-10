import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const ORANGE = "#F97316";
const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_0a0f0e6b.png";

const FOOD_IMAGES = {
  mealprep: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/mealprep_eb5fda9a.jpg",
  vegetables: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/vegetables_0f947a56.jpg",
  ensalada: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  salmon: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  bowl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp",
  buddha: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
  pan: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp",
};

const CATEGORIES = ["Todos", "Nutrición", "Recetas", "Salud", "Bienestar", "Guías", "Ciencia", "Deporte"];

// Static fallback posts shown when no published posts exist yet
const STATIC_POSTS = [
  { id: "s1", title: "Cómo planificar tu menú semanal en menos de 10 minutos", excerpt: "La planificación semanal es la clave para comer bien sin estrés. Te enseñamos el método Buddy One.", category: "Guías", date: "28 Mar 2025", readTime: "5 min", img: FOOD_IMAGES.mealprep, featured: true, authorName: "Equipo Buddy One", authorAvatar: null },
  { id: "s2", title: "Los 14 alérgenos de declaración obligatoria en Europa", excerpt: "Conoce cuáles son los alérgenos que la normativa europea obliga a declarar en todos los alimentos.", category: "Salud", date: "22 Mar 2025", readTime: "7 min", img: FOOD_IMAGES.vegetables, featured: false, authorName: "Equipo Buddy One", authorAvatar: null },
  { id: "s3", title: "Dieta mediterránea: la ciencia detrás del patrón más saludable", excerpt: "Numerosos estudios avalan la dieta mediterránea como el patrón alimentario con mayor evidencia científica.", category: "Ciencia", date: "15 Mar 2025", readTime: "9 min", img: FOOD_IMAGES.ensalada, featured: false, authorName: "Equipo Buddy One", authorAvatar: null },
  { id: "s4", title: "Receta: Salmón con quinoa y verduras asadas", excerpt: "Una receta completa, rica en omega-3 y proteínas de alta calidad. Lista en 25 minutos.", category: "Recetas", date: "10 Mar 2025", readTime: "4 min", img: FOOD_IMAGES.salmon, featured: false, authorName: "Equipo Buddy One", authorAvatar: null },
  { id: "s5", title: "Proteínas vegetales: las mejores fuentes y cómo combinarlas", excerpt: "Si sigues una dieta vegana o vegetariana, conocer las fuentes de proteína vegetal es fundamental.", category: "Nutrición", date: "20 Feb 2025", readTime: "6 min", img: FOOD_IMAGES.buddha, featured: false, authorName: "Equipo Buddy One", authorAvatar: null },
  { id: "s6", title: "Intolerancia al gluten vs. celiaquía: diferencias clave", excerpt: "Aunque a menudo se confunden, la intolerancia al gluten y la celiaquía son condiciones distintas.", category: "Salud", date: "7 Feb 2025", readTime: "8 min", img: FOOD_IMAGES.pan, featured: false, authorName: "Equipo Buddy One", authorAvatar: null },
];

function AuthorBadge({ name, avatar, specialty, verified }: { name?: string | null; avatar?: string | null; specialty?: string | null; verified?: boolean | null }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {avatar ? (
        <img src={avatar} alt={name ?? "Autor"} style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "2px solid #fed7aa" }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${ORANGE}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</div>
      )}
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{name ?? "BuddyExpert"}</span>
        {verified && <span style={{ marginLeft: 4, fontSize: 10, color: ORANGE }}>✓</span>}
        {specialty && <span style={{ fontSize: 11, color: "#9ca3af", display: "block", lineHeight: 1.2 }}>{specialty}</span>}
      </div>
    </div>
  );
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: blogData, isLoading } = trpc.blog.list.useQuery({
    category: activeCategory === "Todos" ? undefined : activeCategory,
    limit: 50,
    offset: 0,
  });

  const realPosts = blogData?.posts ?? [];
  const hasRealPosts = realPosts.length > 0;

  // Normalize real posts to same shape as static
  const normalizedReal = realPosts.map((p) => ({
    id: `r${p.id}`,
    title: p.title,
    excerpt: p.excerpt ?? "",
    category: p.category ?? "Nutrición",
    date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }) : "",
    readTime: `${p.readTimeMinutes ?? 5} min`,
    img: p.coverImageUrl ?? FOOD_IMAGES.mealprep,
    featured: false,
    authorName: p.expertName ?? "BuddyExpert",
    authorAvatar: p.expertAvatar ?? null,
    authorSpecialty: p.expertSpecialty ?? null,
    authorVerified: p.expertVerified ?? false,
    slug: p.slug,
  }));

  // Use real posts if available, else static fallback
  const allPosts = hasRealPosts ? normalizedReal : STATIC_POSTS.map((p) => ({ ...p, authorSpecialty: null, authorVerified: false, slug: undefined }));

  // Filter by search (category already filtered server-side for real posts)
  const filtered = allPosts.filter((p) => {
    const matchCat = !hasRealPosts ? (activeCategory === "Todos" || p.category === activeCategory) : true;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || (p.excerpt ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

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
            <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>← Volver al inicio</Link>
            <Link href="/app/dashboard" style={{ padding: "8px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: ORANGE, textDecoration: "none" }}>Abrir app</Link>
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
              style={{ width: "100%", padding: "14px 20px 14px 48px", borderRadius: 12, fontSize: 15, border: "2px solid #e5e7eb", outline: "none", background: "white", boxSizing: "border-box" }}
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

        {/* Loading state */}
        {isLoading && (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${ORANGE}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#9ca3af" }}>Cargando artículos...</p>
          </div>
        )}

        {!isLoading && (
          <>
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
                  <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7, marginBottom: 20 }}>{featured.excerpt}</p>
                  {/* Author */}
                  <div style={{ marginBottom: 20 }}>
                    <AuthorBadge name={featured.authorName} avatar={featured.authorAvatar} specialty={(featured as any).authorSpecialty} verified={(featured as any).authorVerified} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>{featured.date}</span>
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>·</span>
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>{featured.readTime} lectura</span>
                  </div>
                  {(featured as any).slug ? (
                    <Link href={`/blog/${(featured as any).slug}`} style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: ORANGE, textDecoration: "none", width: "fit-content" }}>
                      Leer artículo →
                    </Link>
                  ) : (
                    <span style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white", background: ORANGE, width: "fit-content", opacity: 0.7 }}>
                      Próximamente →
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Grid of posts */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {rest.map(post => (
                <article key={post.id} style={{
                  background: "white", borderRadius: 20, overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: "all 0.2s", cursor: "pointer",
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
                    <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, marginBottom: 16 }}>{(post.excerpt ?? "").substring(0, 100)}{(post.excerpt ?? "").length > 100 ? "..." : ""}</p>
                    {/* Author row */}
                    <div style={{ marginBottom: 12 }}>
                      <AuthorBadge name={post.authorName} avatar={post.authorAvatar} specialty={(post as any).authorSpecialty} verified={(post as any).authorVerified} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>{post.date} · {post.readTime}</span>
                      {(post as any).slug ? (
                        <Link href={`/blog/${(post as any).slug}`} style={{ fontSize: 13, fontWeight: 600, color: ORANGE, textDecoration: "none" }}>Leer →</Link>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af" }}>Próximamente</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 24px", color: "#9ca3af" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <p style={{ fontSize: 18 }}>No se encontraron artículos{searchQuery ? ` para "${searchQuery}"` : ""}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer mini */}
      <footer style={{ background: "#0f172a", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#4b5563" }}>© 2026 Buddy One · <Link href="/terms" style={{ color: "#6b7280", textDecoration: "none" }}>Términos</Link> · <Link href="/privacy" style={{ color: "#6b7280", textDecoration: "none" }}>Privacidad</Link></p>
        <p style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>⚠️ El contenido de este blog es orientativo y no sustituye el consejo de un profesional de la salud.</p>
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { article { grid-column: span 1 !important; } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
