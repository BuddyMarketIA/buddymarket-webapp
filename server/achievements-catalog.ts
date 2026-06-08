// BuddyOne — Achievements Catalog
// 25 achievements across 5 categories to incentivize consistent meal logging

export type AchievementCategory = "racha" | "cantidad" | "variedad" | "nutricion" | "explorador";

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  emoji: string;
  points: number;
  /** Condition type used by the evaluator */
  condition: AchievementCondition;
}

export type AchievementCondition =
  | { type: "streak_days"; days: number }
  | { type: "total_logs"; count: number }
  | { type: "distinct_meal_types"; count: number }
  | { type: "distinct_recipes"; count: number }
  | { type: "calorie_goal_days"; days: number }
  | { type: "used_barcode_scanner" }
  | { type: "added_meal_photo" }
  | { type: "created_recipe" }
  | { type: "completed_profile" }
  | { type: "first_log" };

export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  // ─── RACHA (Streak) ──────────────────────────────────────────────────────────
  {
    id: "first_log",
    category: "racha",
    title: "¡Primer Paso!",
    description: "Registra tu primera comida en el diario",
    emoji: "🌱",
    points: 10,
    condition: { type: "first_log" },
  },
  {
    id: "streak_3",
    category: "racha",
    title: "Tres en Raya",
    description: "Registra comidas 3 días consecutivos",
    emoji: "🔥",
    points: 25,
    condition: { type: "streak_days", days: 3 },
  },
  {
    id: "streak_7",
    category: "racha",
    title: "Semana Perfecta",
    description: "Registra comidas 7 días consecutivos",
    emoji: "⭐",
    points: 75,
    condition: { type: "streak_days", days: 7 },
  },
  {
    id: "streak_14",
    category: "racha",
    title: "Dos Semanas de Oro",
    description: "Registra comidas 14 días consecutivos",
    emoji: "🏅",
    points: 150,
    condition: { type: "streak_days", days: 14 },
  },
  {
    id: "streak_30",
    category: "racha",
    title: "Mes Imparable",
    description: "Registra comidas 30 días consecutivos",
    emoji: "🏆",
    points: 400,
    condition: { type: "streak_days", days: 30 },
  },
  {
    id: "streak_100",
    category: "racha",
    title: "Centurión Nutricional",
    description: "Registra comidas 100 días consecutivos",
    emoji: "💎",
    points: 1500,
    condition: { type: "streak_days", days: 100 },
  },

  // ─── CANTIDAD (Volume) ────────────────────────────────────────────────────────
  {
    id: "logs_10",
    category: "cantidad",
    title: "Empezando Fuerte",
    description: "Registra un total de 10 comidas",
    emoji: "📝",
    points: 20,
    condition: { type: "total_logs", count: 10 },
  },
  {
    id: "logs_50",
    category: "cantidad",
    title: "Medio Centenar",
    description: "Registra un total de 50 comidas",
    emoji: "📊",
    points: 80,
    condition: { type: "total_logs", count: 50 },
  },
  {
    id: "logs_100",
    category: "cantidad",
    title: "Centenario",
    description: "Registra un total de 100 comidas",
    emoji: "💯",
    points: 200,
    condition: { type: "total_logs", count: 100 },
  },
  {
    id: "logs_500",
    category: "cantidad",
    title: "Maestro del Registro",
    description: "Registra un total de 500 comidas",
    emoji: "👑",
    points: 1000,
    condition: { type: "total_logs", count: 500 },
  },

  // ─── VARIEDAD (Variety) ───────────────────────────────────────────────────────
  {
    id: "variety_meal_types_3",
    category: "variedad",
    title: "Tres Tiempos",
    description: "Registra desayuno, almuerzo y cena en el mismo día",
    emoji: "🍽️",
    points: 30,
    condition: { type: "distinct_meal_types", count: 3 },
  },
  {
    id: "variety_meal_types_5",
    category: "variedad",
    title: "Cinco Comidas",
    description: "Registra los 5 tipos de comida en el mismo día",
    emoji: "🌈",
    points: 60,
    condition: { type: "distinct_meal_types", count: 5 },
  },
  {
    id: "variety_recipes_5",
    category: "variedad",
    title: "Paladar Curioso",
    description: "Registra 5 recetas distintas",
    emoji: "🔍",
    points: 40,
    condition: { type: "distinct_recipes", count: 5 },
  },
  {
    id: "variety_recipes_20",
    category: "variedad",
    title: "Gourmet Amateur",
    description: "Registra 20 recetas distintas",
    emoji: "👨‍🍳",
    points: 120,
    condition: { type: "distinct_recipes", count: 20 },
  },
  {
    id: "variety_recipes_50",
    category: "variedad",
    title: "Chef Explorador",
    description: "Registra 50 recetas distintas",
    emoji: "🍴",
    points: 300,
    condition: { type: "distinct_recipes", count: 50 },
  },

  // ─── NUTRICIÓN (Nutrition Goals) ─────────────────────────────────────────────
  {
    id: "calorie_goal_1",
    category: "nutricion",
    title: "En el Blanco",
    description: "Alcanza tu objetivo calórico diario por primera vez",
    emoji: "🎯",
    points: 25,
    condition: { type: "calorie_goal_days", days: 1 },
  },
  {
    id: "calorie_goal_3",
    category: "nutricion",
    title: "Triple Acierto",
    description: "Alcanza tu objetivo calórico 3 días seguidos",
    emoji: "🎪",
    points: 75,
    condition: { type: "calorie_goal_days", days: 3 },
  },
  {
    id: "calorie_goal_7",
    category: "nutricion",
    title: "Semana Equilibrada",
    description: "Alcanza tu objetivo calórico 7 días seguidos",
    emoji: "⚖️",
    points: 200,
    condition: { type: "calorie_goal_days", days: 7 },
  },
  {
    id: "completed_profile",
    category: "nutricion",
    title: "Perfil Completo",
    description: "Completa tu perfil nutricional al 100%",
    emoji: "✅",
    points: 50,
    condition: { type: "completed_profile" },
  },

  // ─── EXPLORADOR (Explorer) ────────────────────────────────────────────────────
  {
    id: "used_barcode",
    category: "explorador",
    title: "Escáner Pro",
    description: "Añade un alimento usando el escáner de código de barras",
    emoji: "📱",
    points: 20,
    condition: { type: "used_barcode_scanner" },
  },
  {
    id: "added_photo",
    category: "explorador",
    title: "Foodie Fotógrafo",
    description: "Añade una foto a un registro de comida",
    emoji: "📸",
    points: 20,
    condition: { type: "added_meal_photo" },
  },
  {
    id: "created_recipe",
    category: "explorador",
    title: "Chef Creativo",
    description: "Crea tu propia receta personalizada",
    emoji: "📖",
    points: 40,
    condition: { type: "created_recipe" },
  },
];

// ─── Level System ─────────────────────────────────────────────────────────────
export interface Level {
  level: number;
  title: string;
  minPoints: number;
  emoji: string;
}

export const LEVELS: Level[] = [
  { level: 1, title: "Principiante",   minPoints: 0,    emoji: "🌱" },
  { level: 2, title: "Aprendiz",       minPoints: 50,   emoji: "🌿" },
  { level: 3, title: "Constante",      minPoints: 150,  emoji: "🌳" },
  { level: 4, title: "Dedicado",       minPoints: 350,  emoji: "⭐" },
  { level: 5, title: "Experto",        minPoints: 700,  emoji: "🌟" },
  { level: 6, title: "Maestro",        minPoints: 1200, emoji: "🏅" },
  { level: 7, title: "Campeón",        minPoints: 2000, emoji: "🏆" },
  { level: 8, title: "Leyenda",        minPoints: 3500, emoji: "💎" },
  { level: 9, title: "Inmortal",       minPoints: 5000, emoji: "👑" },
];

export function getLevelForPoints(points: number): Level {
  let current = LEVELS[0]!;
  for (const lvl of LEVELS) {
    if (points >= lvl.minPoints) current = lvl;
    else break;
  }
  return current;
}

export function getNextLevel(points: number): Level | null {
  const current = getLevelForPoints(points);
  return LEVELS.find((l) => l.level === current.level + 1) ?? null;
}
