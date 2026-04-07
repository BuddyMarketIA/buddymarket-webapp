/**
 * Open Graph dynamic meta tags for recipe sharing
 * Intercepts requests from social media bots and returns HTML with OG tags
 */
import { type Express } from "express";
import { getRecipeById } from "./db";

const BOT_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "WhatsApp",
  "TelegramBot",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  "Pinterest",
  "Googlebot",
  "bingbot",
  "Applebot",
  "ia_archiver",
  "rogerbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "vkShare",
  "W3C_Validator",
  "redditbot",
  "Snapchat",
];

function isBotRequest(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

const BUDDYMARKET_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-og-cover.jpg";

function buildOGHtml({
  title,
  description,
  imageUrl,
  url,
  siteName = "BuddyMarket",
}: {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
  siteName?: string;
}): string {
  const escapedTitle = title.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedDesc = description.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapedImage = imageUrl.replace(/"/g, "&quot;");
  const escapedUrl = url.replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedTitle} — ${siteName}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapedTitle}" />
  <meta property="og:description" content="${escapedDesc}" />
  <meta property="og:image" content="${escapedImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${escapedUrl}" />
  <meta property="og:site_name" content="${siteName}" />
  <meta property="og:locale" content="es_ES" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapedTitle}" />
  <meta name="twitter:description" content="${escapedDesc}" />
  <meta name="twitter:image" content="${escapedImage}" />
  <meta name="twitter:site" content="@buddymarket_es" />

  <!-- WhatsApp / general -->
  <meta name="description" content="${escapedDesc}" />

  <!-- Redirect to SPA -->
  <script>window.location.replace("${escapedUrl}");</script>
</head>
<body>
  <p>Redirigiendo a <a href="${escapedUrl}">${escapedTitle}</a>...</p>
</body>
</html>`;
}

export function registerOGRoutes(app: Express) {
  // ─── Recipe OG ─────────────────────────────────────────────────────────────
  app.get("/app/recipes/:id", async (req: any, res: any, next: any) => {
    const userAgent = req.headers["user-agent"] || "";
    if (!isBotRequest(userAgent)) return next();

    try {
      const recipeId = parseInt(req.params.id, 10);
      if (isNaN(recipeId)) return next();

      const recipe = await getRecipeById(recipeId);
      if (!recipe) return next();

      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
      const url = `${origin}/app/recipes/${recipeId}`;

      const title = recipe.name;
      const parts: string[] = [];
      if (recipe.caloriesPerServing) parts.push(`🔥 ${Math.round(recipe.caloriesPerServing)} kcal`);
      if (recipe.proteinsPerServing) parts.push(`💪 ${Math.round(recipe.proteinsPerServing)}g proteína`);
      if (recipe.preparationTime) parts.push(`⏱️ ${recipe.preparationTime} min`);
      const nutritionLine = parts.length > 0 ? ` | ${parts.join(" · ")}` : "";
      const description = `¡He compartido esta receta contigo desde BuddyMarket que te puede interesar! 🍽️${nutritionLine}${recipe.description ? " — " + recipe.description.slice(0, 120) : ""}`;

      const imageUrl = recipe.imageUrl || BUDDYMARKET_LOGO;

      const html = buildOGHtml({ title, description, imageUrl, url });
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      next(err);
    }
  });

  // ─── Menu OG ───────────────────────────────────────────────────────────────
  app.get("/app/menus/:id", async (req: any, res: any, next: any) => {
    const userAgent = req.headers["user-agent"] || "";
    if (!isBotRequest(userAgent)) return next();

    try {
      const menuId = parseInt(req.params.id, 10);
      if (isNaN(menuId)) return next();

      const origin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
      const url = `${origin}/app/menus/${menuId}`;

      const html = buildOGHtml({
        title: "Menú semanal personalizado",
        description: "¡He compartido este menú semanal contigo desde BuddyMarket! Menús con IA adaptados a tus objetivos nutricionales 🥗",
        imageUrl: BUDDYMARKET_LOGO,
        url,
      });
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      next(err);
    }
  });
}
