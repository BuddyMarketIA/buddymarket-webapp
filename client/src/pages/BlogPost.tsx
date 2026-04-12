import { useParams, Link } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

const ORANGE = "#F97316";
const LOGO_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/logo-icon-orange_0a0f0e6b.png";
const BASE_URL = "https://buddymarket.io";

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

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  // Fetch related articles once we know the category
  const { data: related } = trpc.blog.getRelated.useQuery(
    { slug: slug ?? "", category: post?.category ?? "", limit: 3 },
    { enabled: !!post?.category && !!slug }
  );

  // Inject JSON-LD schema markup for Google rich snippets
  useEffect(() => {
    if (!post) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.excerpt ?? "",
      "image": post.coverImageUrl ? [post.coverImageUrl] : [],
      "datePublished": post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      "dateModified": post.updatedAt ? new Date(post.updatedAt).toISOString() : (post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined),
      "author": post.expertName ? {
        "@type": "Person",
        "name": post.expertName,
        "jobTitle": post.expertSpecialty ?? "Nutricionista",
      } : {
        "@type": "Organization",
        "name": "BuddyMarket",
        "url": BASE_URL,
      },
      "publisher": {
        "@type": "Organization",
        "name": "BuddyMarket",
        "url": BASE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": LOGO_ICON,
        },
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `${BASE_URL}/blog/${post.slug}`,
      },
      "articleSection": post.category,
      "keywords": post.tags ?? "",
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
    document.title = `${post.title} | BuddyMarket Blog`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", post.excerpt ?? post.title);

    return () => {
      const el = document.getElementById("article-jsonld");
      if (el) el.remove();
    };
  }, [post]);

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

  if (error || !post) {
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

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#111827", minHeight: "100vh", background: "#f9fafb" }}>

      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <img src={LOGO_ICON} alt="BuddyMarket" style={{ height: 40, width: 40, objectFit: "contain" }} />
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
      {post.coverImageUrl && (
        <div style={{ width: "100%", maxHeight: 480, overflow: "hidden" }}>
          <img src={post.coverImageUrl} alt={post.title} style={{ width: "100%", height: 480, objectFit: "cover" }} />
        </div>
      )}

      {/* Article */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Category + read time */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
          <span style={{ background: `${ORANGE}20`, color: ORANGE, fontSize: 12, fontWeight: 700, padding: "4px 14px", borderRadius: 100 }}>
            {post.category}
          </span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>{post.readTimeMinutes} min de lectura</span>
          {publishedDate && <span style={{ fontSize: 13, color: "#9ca3af" }}>· {publishedDate}</span>}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#111827", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: 24 }}>
          {post.title}
        </h1>

        {/* Author card */}
        {(post.expertName || post.expertAvatar) && (
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", background: "white", borderRadius: 16, border: "1px solid #f3f4f6", marginBottom: 40, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            {post.expertAvatar ? (
              <img src={post.expertAvatar} alt={post.expertName ?? "Autor"} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "3px solid #fed7aa", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${ORANGE}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>👤</div>
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{post.expertName ?? "BuddyExpert"}</span>
                {post.expertVerified && (
                  <span style={{ fontSize: 11, background: `${ORANGE}20`, color: ORANGE, padding: "2px 8px", borderRadius: 100, fontWeight: 700 }}>✓ Verificado</span>
                )}
              </div>
              {post.expertSpecialty && (
                <p style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{post.expertSpecialty}</p>
              )}
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>BuddyExpert en BuddyMarket</p>
            </div>
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p style={{ fontSize: 19, color: "#6b7280", lineHeight: 1.7, marginBottom: 40, fontStyle: "italic", borderLeft: `4px solid ${ORANGE}`, paddingLeft: 20 }}>
            {post.excerpt}
          </p>
        )}

        {/* Content */}
        <div
          style={{ fontSize: 17, lineHeight: 1.8, color: "#374151" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content ?? "") }}
        />

        {/* Tags */}
        {post.tags && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Etiquetas</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {post.tags.split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => (
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
            BuddyMarket crea menús personalizados, listas de compra inteligentes y te acompaña en tu objetivo de salud.
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
            <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 28 }}>Más sobre {post.category}</p>
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

        {/* Back to blog */}
        <div style={{ marginTop: 56, textAlign: "center" }}>
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", borderRadius: 12, background: ORANGE, color: "white", textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
            ← Ver más artículos
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: "#0f172a", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#4b5563" }}>© 2025 BuddyMarket · <Link href="/terminos" style={{ color: "#6b7280", textDecoration: "none" }}>Términos</Link> · <Link href="/privacidad" style={{ color: "#6b7280", textDecoration: "none" }}>Privacidad</Link></p>
        <p style={{ fontSize: 11, color: "#374151", marginTop: 8 }}>⚠️ El contenido de este blog es orientativo y no sustituye el consejo de un profesional de la salud.</p>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
