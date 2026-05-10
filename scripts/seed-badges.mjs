/**
 * Seed script: inserta el catálogo completo de insignias en la BD
 * Uso: node scripts/seed-badges.mjs
 */
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const BADGES = [
  // ── AI ADAPTATION ──────────────────────────────────────────────────────────
  {
    slug: "first_adaptation",
    name_es: "Primera Adaptación",
    name_en: "First Adaptation",
    description_es: "Adaptaste tu primera receta con IA para ajustarla a tus restricciones alimentarias.",
    description_en: "You adapted your first recipe with AI to fit your dietary restrictions.",
    icon: "🤖",
    category: "ai_adaptation",
    rarity: "common",
    points: 15,
    trigger_count: 1,
  },
  {
    slug: "adaptation_apprentice",
    name_es: "Aprendiz de Adaptaciones",
    name_en: "Adaptation Apprentice",
    description_es: "Has adaptado 5 recetas con IA. ¡Tu cocina personalizada está tomando forma!",
    description_en: "You've adapted 5 recipes with AI. Your personalized kitchen is taking shape!",
    icon: "🧑‍🍳",
    category: "ai_adaptation",
    rarity: "rare",
    points: 40,
    trigger_count: 5,
  },
  {
    slug: "adaptation_master",
    name_es: "Maestro de Adaptaciones",
    name_en: "Adaptation Master",
    description_es: "25 recetas adaptadas con IA. Eres un experto en cocina personalizada.",
    description_en: "25 recipes adapted with AI. You're an expert in personalized cooking.",
    icon: "🏆",
    category: "ai_adaptation",
    rarity: "epic",
    points: 100,
    trigger_count: 25,
  },
  {
    slug: "adaptation_legend",
    name_es: "Leyenda de la Adaptación",
    name_en: "Adaptation Legend",
    description_es: "100 recetas adaptadas. BuddyMarket IA es tu chef personal.",
    description_en: "100 recipes adapted. BuddyMarket AI is your personal chef.",
    icon: "⭐",
    category: "ai_adaptation",
    rarity: "legendary",
    points: 300,
    trigger_count: 100,
  },
  {
    slug: "allergy_guardian",
    name_es: "Guardián de Alergias",
    name_en: "Allergy Guardian",
    description_es: "Configuraste tus alergias y adaptaste tu primera receta. Tu salud es lo primero.",
    description_en: "You set up your allergies and adapted your first recipe. Your health comes first.",
    icon: "🛡️",
    category: "ai_adaptation",
    rarity: "common",
    points: 20,
    trigger_count: 1,
  },

  // ── COMMUNITY ──────────────────────────────────────────────────────────────
  {
    slug: "first_share",
    name_es: "Primer Compartir",
    name_en: "First Share",
    description_es: "Compartiste tu primera receta con la comunidad BuddyMarket. ¡Gracias por inspirar!",
    description_en: "You shared your first recipe with the BuddyMarket community. Thanks for inspiring!",
    icon: "🌟",
    category: "community",
    rarity: "common",
    points: 15,
    trigger_count: 1,
  },
  {
    slug: "community_contributor",
    name_es: "Colaborador de la Comunidad",
    name_en: "Community Contributor",
    description_es: "Has compartido 5 recetas. La comunidad te lo agradece.",
    description_en: "You've shared 5 recipes. The community thanks you.",
    icon: "🤝",
    category: "community",
    rarity: "rare",
    points: 50,
    trigger_count: 5,
  },
  {
    slug: "community_star",
    name_es: "Estrella de la Comunidad",
    name_en: "Community Star",
    description_es: "10 recetas compartidas. Eres una referencia en la comunidad BuddyMarket.",
    description_en: "10 recipes shared. You're a reference in the BuddyMarket community.",
    icon: "💫",
    category: "community",
    rarity: "epic",
    points: 120,
    trigger_count: 10,
  },
  {
    slug: "recipe_influencer",
    name_es: "Influencer de Recetas",
    name_en: "Recipe Influencer",
    description_es: "50 recetas compartidas. Tu cocina inspira a cientos de personas.",
    description_en: "50 recipes shared. Your cooking inspires hundreds of people.",
    icon: "📣",
    category: "community",
    rarity: "legendary",
    points: 400,
    trigger_count: 50,
  },
  {
    slug: "adapted_and_shared",
    name_es: "Adapté y Compartí",
    name_en: "Adapted and Shared",
    description_es: "Adaptaste una receta con IA y la compartiste con la comunidad. ¡Lo mejor de los dos mundos!",
    description_en: "You adapted a recipe with AI and shared it with the community. The best of both worlds!",
    icon: "🔄",
    category: "community",
    rarity: "rare",
    points: 60,
    trigger_count: 1,
  },

  // ── CONSISTENCY ────────────────────────────────────────────────────────────
  {
    slug: "first_meal_log",
    name_es: "Primer Registro",
    name_en: "First Log",
    description_es: "Registraste tu primera comida en el diario. ¡El seguimiento es la clave!",
    description_en: "You logged your first meal in the diary. Tracking is the key!",
    icon: "📓",
    category: "consistency",
    rarity: "common",
    points: 10,
    trigger_count: 1,
  },
  {
    slug: "week_streak",
    name_es: "Semana Completa",
    name_en: "Full Week",
    description_es: "Registraste comidas 7 días seguidos. ¡La constancia es tu superpoder!",
    description_en: "You logged meals 7 days in a row. Consistency is your superpower!",
    icon: "🔥",
    category: "consistency",
    rarity: "rare",
    points: 50,
    trigger_count: 7,
  },
  {
    slug: "month_streak",
    name_es: "Mes Constante",
    name_en: "Consistent Month",
    description_es: "30 días registrando tu alimentación. Eres un ejemplo de disciplina.",
    description_en: "30 days tracking your nutrition. You're an example of discipline.",
    icon: "📅",
    category: "consistency",
    rarity: "epic",
    points: 150,
    trigger_count: 30,
  },
  {
    slug: "menu_planner",
    name_es: "Planificador de Menús",
    name_en: "Menu Planner",
    description_es: "Creaste tu primer menú semanal. La planificación es el primer paso hacia una alimentación saludable.",
    description_en: "You created your first weekly menu. Planning is the first step to healthy eating.",
    icon: "🗓️",
    category: "consistency",
    rarity: "common",
    points: 20,
    trigger_count: 1,
  },
  {
    slug: "inventory_keeper",
    name_es: "Guardián del Inventario",
    name_en: "Inventory Keeper",
    description_es: "Llevas tu inventario al día. Cero desperdicio, máxima eficiencia.",
    description_en: "You keep your inventory up to date. Zero waste, maximum efficiency.",
    icon: "📦",
    category: "consistency",
    rarity: "rare",
    points: 40,
    trigger_count: 1,
  },

  // ── NUTRITION ──────────────────────────────────────────────────────────────
  {
    slug: "profile_complete",
    name_es: "Perfil Completo",
    name_en: "Complete Profile",
    description_es: "Completaste tu perfil nutricional. BuddyMarket ahora puede cuidarte mejor.",
    description_en: "You completed your nutritional profile. BuddyMarket can now take better care of you.",
    icon: "✅",
    category: "nutrition",
    rarity: "common",
    points: 25,
    trigger_count: 1,
  },
  {
    slug: "calorie_goal",
    name_es: "Objetivo Calórico",
    name_en: "Calorie Goal",
    description_es: "Alcanzaste tu objetivo calórico diario. ¡Perfecto equilibrio!",
    description_en: "You hit your daily calorie goal. Perfect balance!",
    icon: "🎯",
    category: "nutrition",
    rarity: "common",
    points: 15,
    trigger_count: 1,
  },
  {
    slug: "macro_master",
    name_es: "Maestro de Macros",
    name_en: "Macro Master",
    description_es: "Cumpliste tus objetivos de macronutrientes durante 7 días. ¡Eres un nutricionista nato!",
    description_en: "You hit your macronutrient goals for 7 days. You're a born nutritionist!",
    icon: "⚖️",
    category: "nutrition",
    rarity: "epic",
    points: 100,
    trigger_count: 7,
  },
  {
    slug: "allergy_aware",
    name_es: "Consciente de Alergias",
    name_en: "Allergy Aware",
    description_es: "Configuraste tus alergias e intolerancias. Tu seguridad alimentaria es nuestra prioridad.",
    description_en: "You set up your allergies and intolerances. Your food safety is our priority.",
    icon: "🏥",
    category: "nutrition",
    rarity: "common",
    points: 20,
    trigger_count: 1,
  },
  {
    slug: "healthy_variety",
    name_es: "Variedad Saludable",
    name_en: "Healthy Variety",
    description_es: "Probaste 20 recetas diferentes. La variedad es la base de una dieta equilibrada.",
    description_en: "You tried 20 different recipes. Variety is the foundation of a balanced diet.",
    icon: "🥗",
    category: "nutrition",
    rarity: "rare",
    points: 60,
    trigger_count: 20,
  },

  // ── EXPLORER ───────────────────────────────────────────────────────────────
  {
    slug: "welcome_buddy",
    name_es: "Bienvenido, Buddy",
    name_en: "Welcome, Buddy",
    description_es: "Te uniste a BuddyMarket. ¡Empieza tu viaje hacia una alimentación más inteligente!",
    description_en: "You joined BuddyMarket. Start your journey towards smarter eating!",
    icon: "👋",
    category: "explorer",
    rarity: "common",
    points: 10,
    trigger_count: 1,
  },
  {
    slug: "recipe_explorer",
    name_es: "Explorador de Recetas",
    name_en: "Recipe Explorer",
    description_es: "Exploraste la biblioteca de recetas. ¡Hay más de 500 recetas esperándote!",
    description_en: "You explored the recipe library. There are 500+ recipes waiting for you!",
    icon: "🔍",
    category: "explorer",
    rarity: "common",
    points: 10,
    trigger_count: 1,
  },
  {
    slug: "buddy_ia_user",
    name_es: "Usuario de BuddyIA",
    name_en: "BuddyIA User",
    description_es: "Usaste BuddyIA por primera vez. La inteligencia artificial está a tu servicio.",
    description_en: "You used BuddyIA for the first time. Artificial intelligence is at your service.",
    icon: "🧠",
    category: "explorer",
    rarity: "rare",
    points: 30,
    trigger_count: 1,
  },
  {
    slug: "shopping_smart",
    name_es: "Compra Inteligente",
    name_en: "Smart Shopping",
    description_es: "Generaste tu primera lista de la compra desde un menú. Ahorrar tiempo y dinero es posible.",
    description_en: "You generated your first shopping list from a menu. Saving time and money is possible.",
    icon: "🛒",
    category: "explorer",
    rarity: "common",
    points: 15,
    trigger_count: 1,
  },
  {
    slug: "founder_badge",
    name_es: "Usuario Fundador",
    name_en: "Founder User",
    description_es: "Eres uno de los usuarios originales de BuddyMarket. Sin ti, esto no sería posible. ¡Gracias!",
    description_en: "You're one of the original BuddyMarket users. Without you, this wouldn't be possible. Thank you!",
    icon: "🌱",
    category: "explorer",
    rarity: "legendary",
    points: 500,
    trigger_count: 1,
  },
];

async function seedBadges() {
  const client = await pool.connect();
  try {
    console.log(`Insertando ${BADGES.length} insignias...`);
    let inserted = 0;
    let skipped = 0;
    for (const badge of BADGES) {
      const existing = await client.query("SELECT id FROM badges WHERE slug = $1", [badge.slug]);
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO badges (slug, name_es, name_en, description_es, description_en, icon, category, rarity, points, trigger_count, is_active, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW())`,
        [badge.slug, badge.name_es, badge.name_en, badge.description_es, badge.description_en,
         badge.icon, badge.category, badge.rarity, badge.points, badge.trigger_count]
      );
      inserted++;
    }
    console.log(`✅ ${inserted} insignias insertadas, ${skipped} ya existían.`);
  } finally {
    client.release();
    await pool.end();
  }
}

seedBadges().catch(console.error);
