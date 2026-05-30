import { useState } from "react";

import { useTheme } from "../contexts/ThemeContext";

const FOOD = {
  salmon:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  ensalada: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  bowl:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp",
  pasta:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pasta_pesto_tomates-ShvKafyUPxQbbjm5oqKBmm.webp",
  pollo:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp",
  menu:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/menu_semanal_banner-bJvcZL6L7JygtVy2QeuafW.webp",
  teriyaki: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_teriyaki_arroz-BxhouEXinEgLMtuwwTB4gh.webp",
  brownie:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp",
  tortilla: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/tortilla_espinacas-cEYtBTb5hV7xgFpTkVy3TG.webp",
  acai:     "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/acai_bowl_granola-mcBZCMgPadkRDbMhMseJwZ.webp",
  buddha:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp",
  pan:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp",
};

type Meal = { name: string; kcal: number; p: number; c: number; f: number; img: string; time: string };
type DayMenu = { day: string; meals: Meal[] };

interface Profile {
  id: string;
  emoji: string;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  description: string;
  days: DayMenu[];
}

const PROFILES: Profile[] = [
  {
    id: "deportista",
    emoji: "💪",
    label: "Deportista",
    sublabel: "Ganancia muscular",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    kcal: 2800,
    protein: 200,
    carbs: 320,
    fat: 85,
    tags: ["Alto en proteína", "Pre-entreno", "Post-entreno", "Sin gluten opcional"],
    description: "Plan diseñado para maximizar la ganancia muscular con alta proteína, carbohidratos de calidad y grasas saludables distribuidos en 5 comidas.",
    days: [
      {
        day: "Lunes",
        meals: [
          { name: "Avena con proteína y frutos rojos", kcal: 480, p: 35, c: 62, f: 10, img: FOOD.acai, time: "08:00" },
          { name: "Tortilla de espinacas con tostadas", kcal: 320, p: 28, c: 24, f: 12, img: FOOD.tortilla, time: "11:00" },
          { name: "Pollo al horno con arroz y verduras", kcal: 650, p: 55, c: 72, f: 14, img: FOOD.pollo, time: "14:00" },
          { name: "Batido de proteína con plátano", kcal: 280, p: 32, c: 30, f: 4, img: FOOD.bowl, time: "17:30" },
          { name: "Salmón con quinoa y ensalada", kcal: 520, p: 48, c: 42, f: 18, img: FOOD.salmon, time: "20:30" },
        ],
      },
      {
        day: "Martes",
        meals: [
          { name: "Huevos revueltos con aguacate", kcal: 420, p: 28, c: 18, f: 24, img: FOOD.tortilla, time: "08:00" },
          { name: "Yogur griego con granola y miel", kcal: 310, p: 22, c: 38, f: 8, img: FOOD.acai, time: "11:00" },
          { name: "Pasta integral con atún y tomate", kcal: 580, p: 42, c: 78, f: 10, img: FOOD.pasta, time: "14:00" },
          { name: "Pan de masa madre con pavo", kcal: 290, p: 26, c: 32, f: 6, img: FOOD.pan, time: "17:30" },
          { name: "Pollo teriyaki con arroz integral", kcal: 620, p: 52, c: 68, f: 12, img: FOOD.teriyaki, time: "20:30" },
        ],
      },
      {
        day: "Miércoles",
        meals: [
          { name: "Bowl de açaí con granola y frutas", kcal: 450, p: 18, c: 72, f: 12, img: FOOD.acai, time: "08:00" },
          { name: "Tortilla de claras con verduras", kcal: 280, p: 32, c: 12, f: 8, img: FOOD.tortilla, time: "11:00" },
          { name: "Ensalada mediterránea con pollo", kcal: 520, p: 46, c: 28, f: 22, img: FOOD.ensalada, time: "14:00" },
          { name: "Brownie de boniato proteico", kcal: 260, p: 18, c: 34, f: 8, img: FOOD.brownie, time: "17:30" },
          { name: "Salmón con patata y brócoli", kcal: 580, p: 52, c: 48, f: 20, img: FOOD.salmon, time: "20:30" },
        ],
      },
    ],
  },
  {
    id: "perdida-peso",
    emoji: "⚖️",
    label: "Pérdida de peso",
    sublabel: "Déficit calórico saludable",
    color: "#10b981",
    bg: "#f0fdf4",
    border: "#86efac",
    kcal: 1600,
    protein: 130,
    carbs: 160,
    fat: 55,
    tags: ["Bajo en calorías", "Alto en fibra", "Saciante", "Sin azúcar añadido"],
    description: "Plan hipocalórico equilibrado que mantiene la masa muscular mientras crea un déficit calórico sostenible. Comidas saciantes y nutritivas.",
    days: [
      {
        day: "Lunes",
        meals: [
          { name: "Yogur griego 0% con frutos rojos", kcal: 180, p: 18, c: 22, f: 2, img: FOOD.bowl, time: "08:00" },
          { name: "Manzana con almendras (15g)", kcal: 160, p: 4, c: 24, f: 8, img: FOOD.acai, time: "11:00" },
          { name: "Ensalada mediterránea con atún", kcal: 380, p: 38, c: 22, f: 16, img: FOOD.ensalada, time: "14:00" },
          { name: "Tortilla de espinacas (2 huevos)", kcal: 220, p: 18, c: 8, f: 12, img: FOOD.tortilla, time: "17:00" },
          { name: "Salmón al vapor con verduras", kcal: 380, p: 42, c: 18, f: 16, img: FOOD.salmon, time: "20:00" },
        ],
      },
      {
        day: "Martes",
        meals: [
          { name: "Avena con canela y manzana", kcal: 290, p: 10, c: 52, f: 5, img: FOOD.acai, time: "08:00" },
          { name: "Infusión + 2 nueces + 1 naranja", kcal: 140, p: 3, c: 20, f: 6, img: FOOD.bowl, time: "11:00" },
          { name: "Pollo a la plancha con quinoa", kcal: 420, p: 46, c: 38, f: 10, img: FOOD.pollo, time: "14:00" },
          { name: "Queso fresco con tomate cherry", kcal: 180, p: 14, c: 10, f: 8, img: FOOD.ensalada, time: "17:00" },
          { name: "Buddha bowl vegano ligero", kcal: 360, p: 18, c: 48, f: 12, img: FOOD.buddha, time: "20:00" },
        ],
      },
      {
        day: "Miércoles",
        meals: [
          { name: "Tortilla de claras con tomate", kcal: 200, p: 22, c: 10, f: 6, img: FOOD.tortilla, time: "08:00" },
          { name: "Pieza de fruta + té verde", kcal: 90, p: 1, c: 22, f: 0, img: FOOD.bowl, time: "11:00" },
          { name: "Pasta integral con verduras al wok", kcal: 420, p: 16, c: 68, f: 8, img: FOOD.pasta, time: "14:00" },
          { name: "Yogur griego con pepino y menta", kcal: 150, p: 14, c: 12, f: 4, img: FOOD.acai, time: "17:00" },
          { name: "Ensalada de pollo con aguacate", kcal: 380, p: 36, c: 14, f: 20, img: FOOD.ensalada, time: "20:00" },
        ],
      },
    ],
  },
  {
    id: "vegano",
    emoji: "🌱",
    label: "Vegano",
    sublabel: "100% origen vegetal",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#4ade80",
    kcal: 2000,
    protein: 95,
    carbs: 280,
    fat: 70,
    tags: ["100% vegetal", "Rico en hierro", "Vitamina B12", "Omega-3 vegetal"],
    description: "Plan vegano completo y equilibrado que cubre todas las necesidades nutricionales con fuentes vegetales variadas y suplementación estratégica.",
    days: [
      {
        day: "Lunes",
        meals: [
          { name: "Bowl de açaí con granola y semillas", kcal: 420, p: 14, c: 68, f: 14, img: FOOD.acai, time: "08:00" },
          { name: "Hummus con crudités y pan integral", kcal: 280, p: 12, c: 36, f: 10, img: FOOD.pan, time: "11:00" },
          { name: "Buddha bowl con tofu y tahini", kcal: 520, p: 28, c: 58, f: 22, img: FOOD.buddha, time: "14:00" },
          { name: "Fruta de temporada + nueces", kcal: 200, p: 4, c: 28, f: 10, img: FOOD.bowl, time: "17:00" },
          { name: "Pasta pesto con tomates cherry", kcal: 480, p: 18, c: 72, f: 16, img: FOOD.pasta, time: "20:30" },
        ],
      },
      {
        day: "Martes",
        meals: [
          { name: "Tostadas de aguacate con semillas", kcal: 380, p: 10, c: 42, f: 20, img: FOOD.pan, time: "08:00" },
          { name: "Yogur de coco con frutos rojos", kcal: 220, p: 4, c: 32, f: 10, img: FOOD.acai, time: "11:00" },
          { name: "Ensalada mediterránea con garbanzos", kcal: 460, p: 20, c: 54, f: 18, img: FOOD.ensalada, time: "14:00" },
          { name: "Brownie de boniato vegano", kcal: 240, p: 6, c: 42, f: 8, img: FOOD.brownie, time: "17:00" },
          { name: "Sopa de lentejas con pan integral", kcal: 420, p: 22, c: 64, f: 8, img: FOOD.pan, time: "20:30" },
        ],
      },
      {
        day: "Miércoles",
        meals: [
          { name: "Porridge de avena con plátano", kcal: 360, p: 12, c: 64, f: 8, img: FOOD.acai, time: "08:00" },
          { name: "Edamame con sal marina", kcal: 180, p: 14, c: 14, f: 6, img: FOOD.bowl, time: "11:00" },
          { name: "Buddha bowl con quinoa y verduras", kcal: 500, p: 22, c: 68, f: 16, img: FOOD.buddha, time: "14:00" },
          { name: "Dátiles con mantequilla de almendra", kcal: 220, p: 4, c: 36, f: 8, img: FOOD.bowl, time: "17:00" },
          { name: "Curry de garbanzos con arroz basmati", kcal: 480, p: 18, c: 72, f: 14, img: FOOD.teriyaki, time: "20:30" },
        ],
      },
    ],
  },
  {
    id: "diabetico",
    emoji: "💉",
    label: "Diabético tipo 2",
    sublabel: "Control glucémico",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#93c5fd",
    kcal: 1800,
    protein: 110,
    carbs: 190,
    fat: 70,
    tags: ["Bajo IG", "Sin azúcar añadido", "Alto en fibra", "Carbohidratos controlados"],
    description: "Plan diseñado para mantener la glucemia estable con carbohidratos de bajo índice glucémico, alta fibra y distribución equilibrada de macros.",
    days: [
      {
        day: "Lunes",
        meals: [
          { name: "Tortilla de espinacas con pan integral", kcal: 320, p: 22, c: 28, f: 12, img: FOOD.tortilla, time: "08:00" },
          { name: "Yogur griego con canela y nueces", kcal: 220, p: 16, c: 14, f: 12, img: FOOD.bowl, time: "11:00" },
          { name: "Salmón con verduras al vapor y quinoa", kcal: 480, p: 44, c: 38, f: 18, img: FOOD.salmon, time: "14:00" },
          { name: "Manzana verde con almendras", kcal: 180, p: 4, c: 22, f: 10, img: FOOD.acai, time: "17:00" },
          { name: "Ensalada mediterránea con pollo", kcal: 380, p: 38, c: 18, f: 18, img: FOOD.ensalada, time: "20:00" },
        ],
      },
      {
        day: "Martes",
        meals: [
          { name: "Avena integral con semillas de chía", kcal: 340, p: 14, c: 48, f: 10, img: FOOD.acai, time: "08:00" },
          { name: "Queso fresco con tomate y orégano", kcal: 160, p: 12, c: 8, f: 8, img: FOOD.ensalada, time: "11:00" },
          { name: "Pollo al horno con legumbres", kcal: 460, p: 46, c: 36, f: 14, img: FOOD.pollo, time: "14:00" },
          { name: "Pera con 2 nueces", kcal: 150, p: 2, c: 24, f: 6, img: FOOD.bowl, time: "17:00" },
          { name: "Merluza con espinacas y patata", kcal: 380, p: 36, c: 32, f: 10, img: FOOD.salmon, time: "20:00" },
        ],
      },
      {
        day: "Miércoles",
        meals: [
          { name: "Pan de centeno con aguacate y huevo", kcal: 360, p: 18, c: 32, f: 18, img: FOOD.pan, time: "08:00" },
          { name: "Infusión de canela + 1 kiwi", kcal: 80, p: 1, c: 18, f: 0, img: FOOD.bowl, time: "11:00" },
          { name: "Pasta integral con verduras y atún", kcal: 440, p: 36, c: 52, f: 10, img: FOOD.pasta, time: "14:00" },
          { name: "Yogur griego 0% con pepino", kcal: 140, p: 14, c: 10, f: 2, img: FOOD.acai, time: "17:00" },
          { name: "Tortilla de verduras con ensalada", kcal: 320, p: 24, c: 20, f: 16, img: FOOD.tortilla, time: "20:00" },
        ],
      },
    ],
  },
  {
    id: "embarazada",
    emoji: "🤰",
    label: "Embarazada",
    sublabel: "2º trimestre",
    color: "#db2777",
    bg: "#fdf2f8",
    border: "#f9a8d4",
    kcal: 2200,
    protein: 100,
    carbs: 280,
    fat: 80,
    tags: ["Rico en folatos", "Hierro y calcio", "Omega-3", "Sin mercurio"],
    description: "Plan nutricional para el segundo trimestre del embarazo, rico en folatos, hierro, calcio y ácidos grasos omega-3 esenciales para el desarrollo fetal.",
    days: [
      {
        day: "Lunes",
        meals: [
          { name: "Avena con frutos rojos y semillas", kcal: 420, p: 16, c: 68, f: 12, img: FOOD.acai, time: "08:00" },
          { name: "Yogur con nueces y miel", kcal: 280, p: 14, c: 32, f: 12, img: FOOD.bowl, time: "11:00" },
          { name: "Salmón al horno con quinoa y brócoli", kcal: 520, p: 46, c: 42, f: 20, img: FOOD.salmon, time: "14:00" },
          { name: "Pan integral con queso fresco y tomate", kcal: 240, p: 12, c: 28, f: 8, img: FOOD.pan, time: "17:00" },
          { name: "Pollo con espinacas y pasta integral", kcal: 560, p: 44, c: 62, f: 16, img: FOOD.pollo, time: "20:30" },
        ],
      },
      {
        day: "Martes",
        meals: [
          { name: "Tostadas con aguacate y huevo pochado", kcal: 400, p: 18, c: 36, f: 22, img: FOOD.pan, time: "08:00" },
          { name: "Fruta de temporada + almendras", kcal: 200, p: 6, c: 28, f: 10, img: FOOD.acai, time: "11:00" },
          { name: "Ensalada mediterránea con legumbres", kcal: 480, p: 22, c: 56, f: 18, img: FOOD.ensalada, time: "14:00" },
          { name: "Brownie de boniato con nueces", kcal: 280, p: 8, c: 42, f: 10, img: FOOD.brownie, time: "17:00" },
          { name: "Tortilla de espinacas con arroz", kcal: 460, p: 28, c: 52, f: 16, img: FOOD.tortilla, time: "20:30" },
        ],
      },
      {
        day: "Miércoles",
        meals: [
          { name: "Bowl de açaí con granola y kiwi", kcal: 380, p: 12, c: 62, f: 12, img: FOOD.acai, time: "08:00" },
          { name: "Queso fresco con higos y miel", kcal: 240, p: 10, c: 34, f: 8, img: FOOD.bowl, time: "11:00" },
          { name: "Pasta pesto con pollo y tomates", kcal: 540, p: 38, c: 64, f: 18, img: FOOD.pasta, time: "14:00" },
          { name: "Yogur griego con plátano", kcal: 220, p: 14, c: 30, f: 6, img: FOOD.acai, time: "17:00" },
          { name: "Salmón con patata y judías verdes", kcal: 500, p: 44, c: 40, f: 18, img: FOOD.salmon, time: "20:30" },
        ],
      },
    ],
  },
];

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles"];

function MacroBar({ label, value, max, color, isDark }: { label: string; value: number; max: number; color: string; isDark?: boolean }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? "#94a3b8" : "#6b7280" }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#cbd5e1" : "#374151" }}>{value}g</span>
      </div>
      <div style={{ height: 6, background: isDark ? "#1e293b" : "#f3f4f6", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 100, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function MealCard({ meal, color, isDark }: { meal: Meal; color: string; isDark?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px", background: isDark ? "#1e293b" : "white", borderRadius: 14, border: `1px solid ${isDark ? "#334155" : "#f3f4f6"}`, transition: "all 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateX(4px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateX(0)"; }}>
      <div style={{ width: 52, height: 52, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
        <img src={meal.img} alt={meal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDark ? "#f1f5f9" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meal.name}</p>
          <span style={{ fontSize: 11, color: isDark ? "#64748b" : "#9ca3af", flexShrink: 0 }}>{meal.time}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: "2px 8px", borderRadius: 100 }}>{meal.kcal} kcal</span>
          <span style={{ fontSize: 11, color: isDark ? "#64748b" : "#9ca3af" }}>P:{meal.p}g</span>
          <span style={{ fontSize: 11, color: isDark ? "#64748b" : "#9ca3af" }}>C:{meal.c}g</span>
          <span style={{ fontSize: 11, color: isDark ? "#64748b" : "#9ca3af" }}>G:{meal.f}g</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  appUrl?: string;
}

export default function AIMenuExamplesSection({ appUrl = "" }: Props) {
  const [activeProfile, setActiveProfile] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const C = {
    sectionBg: isDark ? "#0f172a" : "#f8fafc",
    cardBg: isDark ? "#1e293b" : "white",
    textPrimary: isDark ? "#f1f5f9" : "#111827",
    textSecondary: isDark ? "#cbd5e1" : "#374151",
    textMuted: isDark ? "#94a3b8" : "#6b7280",
    textLight: isDark ? "#64748b" : "#9ca3af",
    border: isDark ? "#334155" : "#e5e7eb",
    borderLight: isDark ? "#1e293b" : "#f3f4f6",
    dayBg: isDark ? "#1a1a2e" : "#fafafa",
  };

  const profile = PROFILES[activeProfile];
  const dayMenu = profile.days[activeDay];
  const ctaHref = appUrl ? `${appUrl}/login` : "/login";

  return (
    <section style={{ padding: "100px 24px", background: C.sectionBg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#F97316", letterSpacing: "0.12em", textTransform: "uppercase" }}>EJEMPLOS REALES</span>
          <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 900, color: C.textPrimary, margin: "12px 0 16px", lineHeight: 1.2 }}>
            Menús generados por IA<br />para cada perfil
          </h2>
          <p style={{ fontSize: 18, color: C.textMuted, maxWidth: 560, margin: "0 auto" }}>
            Cada menú es único y se adapta al perfil, objetivos y restricciones de cada persona. Estos son ejemplos reales generados por BuddyIA.
          </p>
        </div>

        {/* Profile selector */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 40 }}>
          {PROFILES.map((p, i) => (
            <button key={p.id} onClick={() => { setActiveProfile(i); setActiveDay(0); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", border: "2px solid", transition: "all 0.2s",
                borderColor: activeProfile === i ? p.color : "#e5e7eb",
                background: activeProfile === i ? p.bg : C.cardBg,
                color: activeProfile === i ? p.color : C.textMuted,
                boxShadow: activeProfile === i ? `0 4px 16px ${p.color}30` : "none",
              }}>
              <span style={{ fontSize: 18 }}>{p.emoji}</span>
              <div style={{ textAlign: "left" }}>
                <div>{p.label}</div>
                <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>{p.sublabel}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Main card */}
        <div style={{ background: C.cardBg, borderRadius: 28, boxShadow: "0 8px 48px rgba(0,0,0,0.08)", border: `1.5px solid ${profile.border}`, overflow: "hidden", transition: "all 0.4s" }}>

          {/* Profile header */}
          <div style={{ background: profile.bg, padding: "28px 32px", borderBottom: `1px solid ${profile.border}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: profile.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                  {profile.emoji}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.textPrimary }}>Plan {profile.label}</h3>
                    <span style={{ fontSize: 11, fontWeight: 700, color: profile.color, background: `${profile.color}15`, padding: "3px 10px", borderRadius: 100 }}>IA Generado</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: C.textMuted, maxWidth: 480 }}>{profile.description}</p>
                </div>
              </div>

              {/* Daily totals */}
              <div style={{ display: "flex", gap: 16, flexShrink: 0, flexWrap: "wrap" }}>
                {[
                  { label: "Calorías", value: `${profile.kcal}`, unit: "kcal", color: profile.color },
                  { label: "Proteína", value: `${profile.protein}g`, unit: "/día", color: "#10b981" },
                  { label: "Carbos", value: `${profile.carbs}g`, unit: "/día", color: "#f59e0b" },
                  { label: "Grasas", value: `${profile.fat}g`, unit: "/día", color: "#ec4899" },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: "center", background: C.cardBg, borderRadius: 14, padding: "12px 16px", minWidth: 72, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{stat.unit}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginTop: 1 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {profile.tags.map(tag => (
                <span key={tag} style={{ fontSize: 12, fontWeight: 600, color: profile.color, background: C.cardBg, border: `1px solid ${profile.border}`, padding: "4px 12px", borderRadius: 100 }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Day selector */}
          <div style={{ display: "flex", gap: 4, padding: "16px 32px", borderBottom: `1px solid ${C.borderLight}`, background: C.dayBg }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#9ca3af", marginRight: 8, alignSelf: "center" }}>Día:</span>
            {DAYS_OF_WEEK.map((day, i) => (
              <button key={day} onClick={() => setActiveDay(i)}
                style={{ padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1.5px solid", transition: "all 0.2s",
                  borderColor: activeDay === i ? profile.color : "#e5e7eb",
                  background: activeDay === i ? profile.color : C.cardBg,
                  color: activeDay === i ? "white" : C.textMuted,
                }}>
                {day}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 12, color: C.textMuted }}>Generado por BuddyIA</span>
            </div>
          </div>

          {/* Meals grid */}
          <div style={{ padding: "28px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ai-menu-meals-grid">
              {dayMenu.meals.map((meal, i) => (
                <MealCard key={i} meal={meal} color={profile.color} isDark={isDark} />
              ))}
            </div>

            {/* Daily macro bars */}
            <div style={{ marginTop: 24, padding: "20px 24px", background: profile.bg, borderRadius: 16, border: `1px solid ${profile.border}` }}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: C.textSecondary }}>Distribución de macros del día</p>
              <div style={{ display: "flex", gap: 16 }} className="ai-menu-macro-bars">
                <MacroBar label="Proteína" value={dayMenu.meals.reduce((s, m) => s + m.p, 0)} max={profile.protein} color={profile.color} isDark={isDark} />
                <MacroBar label="Carbohidratos" value={dayMenu.meals.reduce((s, m) => s + m.c, 0)} max={profile.carbs} color="#f59e0b" isDark={isDark} />
                <MacroBar label="Grasas" value={dayMenu.meals.reduce((s, m) => s + m.f, 0)} max={profile.fat} color="#ec4899" isDark={isDark} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 13, color: C.textMuted }}>
                  Total del día: <strong style={{ color: profile.color }}>{dayMenu.meals.reduce((s, m) => s + m.kcal, 0)} kcal</strong>
                  {" "}de {profile.kcal} kcal objetivo
                </span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{dayMenu.meals.length} comidas · Adaptado a tu perfil</span>
              </div>
            </div>
          </div>

          {/* CTA footer */}
          <div style={{ padding: "20px 32px 28px", borderTop: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.textPrimary }}>¿Quieres tu propio menú personalizado?</p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: C.textMuted }}>BuddyIA genera tu plan en menos de 30 segundos, adaptado a tu perfil único.</p>
            </div>
            <a href={ctaHref} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "white", background: profile.color, textDecoration: "none", boxShadow: `0 6px 20px ${profile.color}40`, whiteSpace: "nowrap", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 28px ${profile.color}50`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${profile.color}40`; }}>
              Generar mi menú gratis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>

        {/* Bottom note */}
        <p style={{ textAlign: "center", fontSize: 13, color: C.textLight, marginTop: 24 }}>
          Los menús mostrados son ejemplos ilustrativos. Tu menú real será único y adaptado a tu perfil, objetivos y restricciones específicas.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ai-menu-meals-grid { grid-template-columns: 1fr !important; }
          .ai-menu-macro-bars { flex-direction: column !important; }
        }
      `}</style>
    </section>
  );
}
