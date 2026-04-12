import type { Express } from "express";
import { getDb } from "./db";
import { blogPosts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

// Static public pages with their SEO priority and change frequency
const STATIC_PAGES = [
  { path: "/",              changefreq: "weekly",  priority: "1.0" },
  { path: "/login",         changefreq: "monthly", priority: "0.5" },
  { path: "/register",      changefreq: "monthly", priority: "0.6" },
  { path: "/precios",       changefreq: "monthly", priority: "0.9" },
  { path: "/blog",          changefreq: "daily",   priority: "0.9" },
  { path: "/herramientas",  changefreq: "monthly", priority: "0.8" },
  { path: "/creators",      changefreq: "monthly", priority: "0.8" },
  { path: "/faq",           changefreq: "monthly", priority: "0.7" },
  { path: "/privacidad",    changefreq: "yearly",  priority: "0.3" },
  { path: "/terminos",      changefreq: "yearly",  priority: "0.3" },
  { path: "/cookies",       changefreq: "yearly",  priority: "0.3" },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

export function registerSitemapRoutes(app: Express) {
  const baseUrl = (ENV.publicAppUrl || "https://buddymarket.io").replace(/\/$/, "");

  // ─── /sitemap.xml ─────────────────────────────────────────────────────────
  app.get("/sitemap.xml", async (_req: any, res: any) => {
    try {
      // Fetch all published blog posts
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      const articles = await db
        .select({
          slug: blogPosts.slug,
          updatedAt: blogPosts.updatedAt,
          publishedAt: blogPosts.publishedAt,
        })
        .from(blogPosts)
        .where(eq(blogPosts.status, "published"));

      const now = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
      xml += `        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n`;
      xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

      // Static pages
      for (const page of STATIC_PAGES) {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(baseUrl + page.path)}</loc>\n`;
        xml += `    <lastmod>${now}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
      }

      // Blog articles
      for (const article of articles) {
        const lastmod = formatDate(article.updatedAt ?? article.publishedAt);
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(`${baseUrl}/blog/${article.slug}`)}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      }

      xml += `</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // cache 1 hour
      res.send(xml);
    } catch (err) {
      console.error("[Sitemap] Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // ─── /sitemap-index.xml ───────────────────────────────────────────────────
  // Sitemap index for future scalability (multiple sitemaps)
  app.get("/sitemap-index.xml", (_req: any, res: any) => {
    const now = new Date().toISOString().split("T")[0];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(baseUrl + "/sitemap.xml")}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });
}
