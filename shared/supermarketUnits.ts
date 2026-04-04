/**
 * supermarketUnits.ts
 * -------------------
 * Maps ingredient names (or keywords) to the minimum commercial unit
 * sold in a supermarket. Uses a multi-pass matching strategy:
 *
 *  1. Exact / substring keyword match (after accent & case normalization)
 *  2. Synonym / alias resolution  → re-run step 1 with canonical name
 *  3. Category fallback           → assign the default unit for the food category
 *
 * This ensures every ingredient always gets a sensible commercial unit,
 * never an absurd quantity like "1 jamón entero" or "0.03 g de aceite".
 */

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export interface CommercialUnit {
  /** Human-readable label shown to the user, e.g. "1 sobre (100 g)" */
  label: string;
  /** Numeric size of the unit in grams, ml, or natural units */
  size: number;
  /** "g" | "ml" | "ud" */
  sizeUnit: "g" | "ml" | "ud";
  /** Optional alternative sizes the user can pick (selector feature) */
  variants?: Array<{ label: string; size: number; sizeUnit: "g" | "ml" | "ud" }>;
}

export interface SupermarketUnitRule {
  /** Lower-case keywords; if ANY of them appear in the ingredient name → rule matches */
  keywords: string[];
  commercial: CommercialUnit;
  /** Broad category used for fallback matching */
  category?: string;
}

// ---------------------------------------------------------------------------
// ACCENT / CASE NORMALIZER
// ---------------------------------------------------------------------------
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .trim();
}

// ---------------------------------------------------------------------------
// SYNONYM / ALIAS TABLE
// Maps common recipe ingredient names → canonical keyword that exists in RULES
// ---------------------------------------------------------------------------
export const INGREDIENT_ALIASES: Record<string, string> = {
  // Embutidos
  "jamon": "jamon serrano",
  "jamon de york": "jamon cocido",
  "jamon dulce": "jamon cocido",
  "fiambre de pavo": "pechuga de pavo",
  "fiambre de pollo": "pechuga de pollo",
  "panceta ahumada": "bacon",
  "beicon ahumado": "bacon",

  // Carnes
  "pollo": "pechuga de pollo",
  "filete de pollo": "pechuga de pollo",
  "muslo de pollo": "contramuslo de pollo",
  "carne picada": "carne picada de ternera",
  "ternera": "carne picada de ternera",
  "cerdo": "lomo de cerdo",
  "filete de cerdo": "lomo de cerdo",
  "costillas": "costillas de cerdo",
  "cordero": "chuletas de cordero",
  "pavo": "pechuga de pavo entera",

  // Pescados
  "salmon": "salmon fresco",
  "atun": "atun en lata",
  "atun fresco": "salmon fresco",
  "bacalao": "bacalao desalado",
  "merluza": "merluza fresca",
  "gambas": "gambas peladas",
  "langostinos": "gambas peladas",
  "mejillones": "mejillones frescos",
  "sardinas": "sardinas en lata",
  "anchoas": "anchoas en lata",

  // Lácteos
  "leche": "leche entera",
  "leche semi": "leche semidesnatada",
  "leche desnatada": "leche desnatada",
  "nata": "nata para cocinar",
  "crema de leche": "nata para cocinar",
  "queso": "queso tierno",
  "queso fresco": "queso fresco batido",
  "queso rallado": "queso rallado mezcla",
  "queso parmesano": "queso parmesano rallado",
  "mantequilla": "mantequilla sin sal",
  "margarina": "mantequilla sin sal",
  "yogur": "yogur natural",
  "yogurt": "yogur natural",

  // Huevos
  "huevo": "huevos",
  "clara de huevo": "huevos",
  "yema de huevo": "huevos",

  // Aceites y grasas
  "aceite": "aceite de oliva",
  "aove": "aceite de oliva virgen extra",
  "aceite de girasol": "aceite de girasol",
  "aceite vegetal": "aceite de girasol",

  // Harinas y cereales
  "harina": "harina de trigo",
  "harina integral": "harina integral de trigo",
  "pan rallado": "pan rallado",
  "pan de molde": "pan de molde blanco",
  "baguette": "barra de pan",
  "pan": "barra de pan",
  "pasta": "pasta espaguetis",
  "espaguetis": "pasta espaguetis",
  "macarrones": "pasta macarrones",
  "fideos": "pasta fideos",
  "arroz": "arroz redondo",
  "arroz largo": "arroz largo",
  "arroz integral": "arroz integral",
  "avena": "copos de avena",
  "copos de avena": "copos de avena",

  // Legumbres
  "lentejas": "lentejas pardinas",
  "garbanzos": "garbanzos cocidos",
  "alubias": "alubias blancas cocidas",
  "judias blancas": "alubias blancas cocidas",
  "judias pintas": "alubias pintas cocidas",
  "soja": "soja texturizada",

  // Verduras y hortalizas
  "tomate": "tomates",
  "tomate triturado": "tomate triturado lata",
  "tomate frito": "tomate frito bote",
  "cebolla": "cebollas",
  "ajo": "ajos",
  "diente de ajo": "ajos",
  "pimiento": "pimientos rojos",
  "pimiento rojo": "pimientos rojos",
  "pimiento verde": "pimientos verdes",
  "pimiento amarillo": "pimientos amarillos",
  "zanahoria": "zanahorias",
  "patata": "patatas",
  "papa": "patatas",
  "calabacin": "calabacines",
  "berenjena": "berenjenas",
  "brocoli": "brocoli",
  "coliflor": "coliflor",
  "espinacas": "espinacas frescas",
  "lechuga": "lechuga iceberg",
  "pepino": "pepinos",
  "champiñon": "champinones",
  "champinon": "champinones",
  "seta": "champinones",
  "cebolleta": "cebolletas",
  "puerro": "puerros",
  "apio": "apio",
  "aguacate": "aguacates",
  "limon": "limones",
  "naranja": "naranjas",
  "manzana": "manzanas",
  "platano": "platanos",
  "fresa": "fresas",
  "uva": "uvas",

  // Especias y condimentos
  "sal": "sal fina",
  "pimienta": "pimienta negra molida",
  "pimienta negra": "pimienta negra molida",
  "oregano": "oregano seco",
  "tomillo": "tomillo seco",
  "romero": "romero seco",
  "comino": "comino molido",
  "paprika": "pimenton dulce",
  "pimenton": "pimenton dulce",
  "pimenton picante": "pimenton picante",
  "canela": "canela molida",
  "nuez moscada": "nuez moscada molida",
  "curry": "curry en polvo",
  "curcuma": "curcuma molida",
  "jengibre": "jengibre molido",
  "azafran": "azafran hebras",
  "laurel": "hojas de laurel",
  "perejil": "perejil seco",
  "albahaca": "albahaca seca",
  "cilantro": "cilantro seco",

  // Salsas y condimentos líquidos
  "vinagre": "vinagre de vino blanco",
  "vinagre de manzana": "vinagre de manzana",
  "salsa de soja": "salsa de soja",
  "soja liquida": "salsa de soja",
  "ketchup": "ketchup",
  "mostaza": "mostaza",
  "mayonesa": "mayonesa",
  "salsa worcestershire": "salsa worcestershire",
  "tabasco": "salsa picante",

  // Dulces y repostería
  "azucar": "azucar blanco",
  "azucar moreno": "azucar moreno",
  "miel": "miel",
  "mermelada": "mermelada de fresa",
  "chocolate": "chocolate negro",
  "cacao": "cacao en polvo",
  "levadura": "levadura quimica",
  "levadura quimica": "levadura quimica",
  "bicarbonato": "bicarbonato sodico",
  "vainilla": "extracto de vainilla",

  // Frutos secos
  "almendras": "almendras crudas",
  "nueces": "nueces peladas",
  "avellanas": "avellanas crudas",
  "pistachos": "pistachos pelados",
  "cacahuetes": "cacahuetes tostados",
  "anacardos": "anacardos crudos",
  "pipas": "semillas de girasol",
  "semillas de chia": "semillas de chia",
  "semillas de lino": "semillas de lino",

  // Bebidas
  "agua": "agua mineral",
  "leche vegetal": "bebida de avena",
  "cafe": "cafe molido",
  "te": "te verde",
  "zumo": "zumo de naranja",
  "vino": "vino blanco",
  "cerveza": "cerveza",

  // Conservas
  "atun lata": "atun en lata",
  "sardinas lata": "sardinas en lata",
  "tomate lata": "tomate triturado lata",
  "maiz lata": "maiz dulce lata",
  "aceitunas": "aceitunas verdes",
  "pepinillos": "pepinillos en vinagre",
};

// ---------------------------------------------------------------------------
// CATEGORY FALLBACK TABLE
// When no keyword or alias matches, assign a default unit by food category
// ---------------------------------------------------------------------------
export const CATEGORY_FALLBACK: Record<string, CommercialUnit> = {
  "verdura":     { label: "1 unidad (~200 g)", size: 200, sizeUnit: "g" },
  "fruta":       { label: "1 unidad (~150 g)", size: 150, sizeUnit: "g" },
  "carne":       { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" },
  "pescado":     { label: "1 pieza (~300 g)", size: 300, sizeUnit: "g" },
  "lacteo":      { label: "1 unidad", size: 1, sizeUnit: "ud" },
  "cereal":      { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" },
  "legumbre":    { label: "1 bote (400 g)", size: 400, sizeUnit: "g" },
  "especia":     { label: "1 bote (50 g)", size: 50, sizeUnit: "g" },
  "condimento":  { label: "1 bote (200 ml)", size: 200, sizeUnit: "ml" },
  "aceite":      { label: "1 botella (750 ml)", size: 750, sizeUnit: "ml" },
  "conserva":    { label: "1 lata (400 g)", size: 400, sizeUnit: "g" },
  "dulce":       { label: "1 paquete (200 g)", size: 200, sizeUnit: "g" },
  "fruto_seco":  { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" },
  "bebida":      { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" },
  "otro":        { label: "1 unidad", size: 1, sizeUnit: "ud" },
};

// ---------------------------------------------------------------------------
// KEYWORD → CATEGORY mapping (for fallback)
// ---------------------------------------------------------------------------
const KEYWORD_CATEGORY: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["tomate", "cebolla", "zanahoria", "patata", "calabacin", "berenjena", "brocoli", "coliflor", "espinaca", "lechuga", "pepino", "champiñon", "champinon", "seta", "puerro", "apio", "pimiento", "ajo", "cebolleta", "alcachofa", "esparrago", "judias verdes", "guisantes"], category: "verdura" },
  { keywords: ["manzana", "naranja", "limon", "platano", "fresa", "uva", "pera", "melocoton", "cereza", "kiwi", "mango", "papaya", "aguacate", "arandano", "frambuesa", "mora"], category: "fruta" },
  { keywords: ["pollo", "ternera", "cerdo", "cordero", "pavo", "conejo", "pato", "carne", "filete", "chuleta", "costilla", "muslo", "contramuslo", "salchicha", "hamburguesa"], category: "carne" },
  { keywords: ["salmon", "merluza", "bacalao", "atun", "sardina", "anchoa", "gamba", "langostino", "mejillon", "calamar", "pulpo", "lubina", "dorada", "trucha", "rape"], category: "pescado" },
  { keywords: ["leche", "yogur", "queso", "mantequilla", "nata", "kefir", "crema"], category: "lacteo" },
  { keywords: ["arroz", "pasta", "harina", "pan", "avena", "quinoa", "cuscus", "bulgur", "maiz", "trigo", "centeno", "espelta"], category: "cereal" },
  { keywords: ["lenteja", "garbanzo", "alubia", "judias", "soja", "guisante seco", "frijol"], category: "legumbre" },
  { keywords: ["sal", "pimienta", "oregano", "tomillo", "romero", "comino", "paprika", "pimenton", "canela", "nuez moscada", "curry", "curcuma", "jengibre", "azafran", "laurel", "perejil", "albahaca", "cilantro", "eneldo", "estragón", "cardamomo", "clavo", "anís"], category: "especia" },
  { keywords: ["vinagre", "ketchup", "mostaza", "mayonesa", "salsa", "worcestershire", "tabasco", "miso", "tahini"], category: "condimento" },
  { keywords: ["aceite", "aove"], category: "aceite" },
  { keywords: ["lata", "conserva", "bote", "escabeche", "encurtido", "pepinillo", "aceituna"], category: "conserva" },
  { keywords: ["azucar", "miel", "mermelada", "chocolate", "cacao", "levadura", "bicarbonato", "vainilla", "gelatina", "agar"], category: "dulce" },
  { keywords: ["almendra", "nuez", "avellana", "pistacho", "cacahuete", "anacardo", "pipa", "semilla", "chia", "lino", "sesamo"], category: "fruto_seco" },
  { keywords: ["agua", "zumo", "leche vegetal", "bebida", "cafe", "te", "infusion", "vino", "cerveza", "refresco"], category: "bebida" },
];

// ---------------------------------------------------------------------------
// RULE TABLE  (order matters: first match wins)
// ---------------------------------------------------------------------------
export const SUPERMARKET_UNIT_RULES: SupermarketUnitRule[] = [
  // ── EMBUTIDOS / FIAMBRES ─────────────────────────────────────────────────
  { keywords: ["jamon serrano", "jamon curado"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g", variants: [{ label: "1 sobre (100 g)", size: 100, sizeUnit: "g" }, { label: "1 sobre (200 g)", size: 200, sizeUnit: "g" }] }, category: "carne" },
  { keywords: ["jamon cocido", "jamon york", "jamon dulce"], commercial: { label: "1 sobre (150 g)", size: 150, sizeUnit: "g", variants: [{ label: "1 sobre (150 g)", size: 150, sizeUnit: "g" }, { label: "1 sobre (300 g)", size: 300, sizeUnit: "g" }] }, category: "carne" },
  { keywords: ["jamon iberico", "jamon pata negra"], commercial: { label: "1 sobre (80 g)", size: 80, sizeUnit: "g" }, category: "carne" },
  { keywords: ["lomo embuchado", "lomo curado"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g" }, category: "carne" },
  { keywords: ["salchichon"], commercial: { label: "1 pieza (200 g)", size: 200, sizeUnit: "g" }, category: "carne" },
  { keywords: ["chorizo"], commercial: { label: "1 pieza (200 g)", size: 200, sizeUnit: "g", variants: [{ label: "1 pieza (200 g)", size: 200, sizeUnit: "g" }, { label: "1 ristra (400 g)", size: 400, sizeUnit: "g" }] }, category: "carne" },
  { keywords: ["fuet"], commercial: { label: "1 pieza (150 g)", size: 150, sizeUnit: "g" }, category: "carne" },
  { keywords: ["mortadela"], commercial: { label: "1 sobre (200 g)", size: 200, sizeUnit: "g" }, category: "carne" },
  { keywords: ["pechuga de pavo", "pavo fiambre", "pavo lonchas"], commercial: { label: "1 sobre (150 g)", size: 150, sizeUnit: "g" }, category: "carne" },
  { keywords: ["bacon", "beicon", "panceta"], commercial: { label: "1 sobre (150 g)", size: 150, sizeUnit: "g" }, category: "carne" },
  { keywords: ["salami"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g" }, category: "carne" },

  // ── QUESOS ───────────────────────────────────────────────────────────────
  { keywords: ["queso manchego"], commercial: { label: "1 cuña (250 g)", size: 250, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso parmesano rallado", "parmesano rallado"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso parmesano"], commercial: { label: "1 cuña (150 g)", size: 150, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso rallado mezcla", "queso rallado"], commercial: { label: "1 bolsa (150 g)", size: 150, sizeUnit: "g", variants: [{ label: "1 bolsa (150 g)", size: 150, sizeUnit: "g" }, { label: "1 bolsa (400 g)", size: 400, sizeUnit: "g" }] }, category: "lacteo" },
  { keywords: ["queso fresco batido", "queso fresco"], commercial: { label: "1 tarrina (250 g)", size: 250, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso mozzarella", "mozzarella"], commercial: { label: "1 bola (125 g)", size: 125, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso brie", "queso camembert"], commercial: { label: "1 pieza (250 g)", size: 250, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso tierno", "queso semicurado", "queso curado"], commercial: { label: "1 cuña (300 g)", size: 300, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso crema", "queso philadelphia"], commercial: { label: "1 tarrina (200 g)", size: 200, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["queso feta"], commercial: { label: "1 bloque (200 g)", size: 200, sizeUnit: "g" }, category: "lacteo" },

  // ── LÁCTEOS ──────────────────────────────────────────────────────────────
  { keywords: ["leche entera"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml", variants: [{ label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, { label: "1 brick (500 ml)", size: 500, sizeUnit: "ml" }] }, category: "lacteo" },
  { keywords: ["leche semidesnatada"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, category: "lacteo" },
  { keywords: ["leche desnatada"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, category: "lacteo" },
  { keywords: ["nata para cocinar", "nata liquida"], commercial: { label: "1 brick (200 ml)", size: 200, sizeUnit: "ml", variants: [{ label: "1 brick (200 ml)", size: 200, sizeUnit: "ml" }, { label: "1 brick (500 ml)", size: 500, sizeUnit: "ml" }] }, category: "lacteo" },
  { keywords: ["nata montada", "nata para montar"], commercial: { label: "1 brick (200 ml)", size: 200, sizeUnit: "ml" }, category: "lacteo" },
  { keywords: ["mantequilla sin sal", "mantequilla con sal", "mantequilla"], commercial: { label: "1 pastilla (250 g)", size: 250, sizeUnit: "g", variants: [{ label: "1 pastilla (125 g)", size: 125, sizeUnit: "g" }, { label: "1 pastilla (250 g)", size: 250, sizeUnit: "g" }] }, category: "lacteo" },
  { keywords: ["yogur natural", "yogur griego", "yogur"], commercial: { label: "1 pack 4 ud (500 g)", size: 500, sizeUnit: "g" }, category: "lacteo" },
  { keywords: ["kefir"], commercial: { label: "1 botella (500 ml)", size: 500, sizeUnit: "ml" }, category: "lacteo" },

  // ── HUEVOS ───────────────────────────────────────────────────────────────
  { keywords: ["huevos", "huevo"], commercial: { label: "1 docena (12 ud)", size: 12, sizeUnit: "ud", variants: [{ label: "1 docena (12 ud)", size: 12, sizeUnit: "ud" }, { label: "1 media docena (6 ud)", size: 6, sizeUnit: "ud" }] }, category: "lacteo" },

  // ── ACEITES Y GRASAS ─────────────────────────────────────────────────────
  { keywords: ["aceite de oliva virgen extra", "aove"], commercial: { label: "1 botella (750 ml)", size: 750, sizeUnit: "ml", variants: [{ label: "1 botella (750 ml)", size: 750, sizeUnit: "ml" }, { label: "1 botella (1 L)", size: 1000, sizeUnit: "ml" }, { label: "1 lata (5 L)", size: 5000, sizeUnit: "ml" }] }, category: "aceite" },
  { keywords: ["aceite de oliva"], commercial: { label: "1 botella (750 ml)", size: 750, sizeUnit: "ml", variants: [{ label: "1 botella (750 ml)", size: 750, sizeUnit: "ml" }, { label: "1 botella (1 L)", size: 1000, sizeUnit: "ml" }] }, category: "aceite" },
  { keywords: ["aceite de girasol", "aceite vegetal"], commercial: { label: "1 botella (1 L)", size: 1000, sizeUnit: "ml", variants: [{ label: "1 botella (1 L)", size: 1000, sizeUnit: "ml" }, { label: "1 botella (2 L)", size: 2000, sizeUnit: "ml" }] }, category: "aceite" },
  { keywords: ["aceite de coco"], commercial: { label: "1 tarro (400 ml)", size: 400, sizeUnit: "ml" }, category: "aceite" },
  { keywords: ["aceite de sesamo"], commercial: { label: "1 botella (250 ml)", size: 250, sizeUnit: "ml" }, category: "aceite" },

  // ── CARNES ───────────────────────────────────────────────────────────────
  { keywords: ["pechuga de pollo", "filete de pollo"], commercial: { label: "1 bandeja (500 g)", size: 500, sizeUnit: "g", variants: [{ label: "1 bandeja (500 g)", size: 500, sizeUnit: "g" }, { label: "1 bandeja (1 kg)", size: 1000, sizeUnit: "g" }] }, category: "carne" },
  { keywords: ["contramuslo de pollo", "muslo de pollo"], commercial: { label: "1 bandeja (600 g)", size: 600, sizeUnit: "g" }, category: "carne" },
  { keywords: ["pollo entero"], commercial: { label: "1 pollo (~1,5 kg)", size: 1500, sizeUnit: "g" }, category: "carne" },
  { keywords: ["carne picada de ternera", "carne picada mixta"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g", variants: [{ label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" }, { label: "1 bandeja (800 g)", size: 800, sizeUnit: "g" }] }, category: "carne" },
  { keywords: ["filete de ternera", "entrecot", "solomillo de ternera"], commercial: { label: "1 bandeja (300 g)", size: 300, sizeUnit: "g" }, category: "carne" },
  { keywords: ["lomo de cerdo", "filete de cerdo"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" }, category: "carne" },
  { keywords: ["costillas de cerdo"], commercial: { label: "1 bandeja (600 g)", size: 600, sizeUnit: "g" }, category: "carne" },
  { keywords: ["chuletas de cordero", "pierna de cordero"], commercial: { label: "1 bandeja (500 g)", size: 500, sizeUnit: "g" }, category: "carne" },
  { keywords: ["pechuga de pavo entera"], commercial: { label: "1 pieza (~800 g)", size: 800, sizeUnit: "g" }, category: "carne" },
  { keywords: ["salchicha de frankfurt", "salchicha"], commercial: { label: "1 paquete 8 ud (300 g)", size: 300, sizeUnit: "g" }, category: "carne" },

  // ── PESCADOS Y MARISCOS ──────────────────────────────────────────────────
  { keywords: ["salmon fresco", "filete de salmon"], commercial: { label: "1 bandeja (300 g)", size: 300, sizeUnit: "g", variants: [{ label: "1 bandeja (300 g)", size: 300, sizeUnit: "g" }, { label: "1 bandeja (600 g)", size: 600, sizeUnit: "g" }] }, category: "pescado" },
  { keywords: ["salmon ahumado"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g" }, category: "pescado" },
  { keywords: ["atun en lata", "atun al natural", "atun en aceite"], commercial: { label: "1 pack 3 latas (3×80 g)", size: 240, sizeUnit: "g", variants: [{ label: "1 lata (80 g)", size: 80, sizeUnit: "g" }, { label: "1 pack 3 latas (3×80 g)", size: 240, sizeUnit: "g" }] }, category: "pescado" },
  { keywords: ["sardinas en lata", "sardinas"], commercial: { label: "1 lata (120 g)", size: 120, sizeUnit: "g" }, category: "pescado" },
  { keywords: ["anchoas en lata", "anchoas"], commercial: { label: "1 lata (50 g)", size: 50, sizeUnit: "g" }, category: "pescado" },
  { keywords: ["bacalao desalado", "bacalao"], commercial: { label: "1 bandeja (300 g)", size: 300, sizeUnit: "g" }, category: "pescado" },
  { keywords: ["merluza fresca", "merluza"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" }, category: "pescado" },
  { keywords: ["gambas peladas", "gambas"], commercial: { label: "1 bolsa (300 g)", size: 300, sizeUnit: "g" }, category: "pescado" },
  { keywords: ["mejillones frescos", "mejillones"], commercial: { label: "1 malla (1 kg)", size: 1000, sizeUnit: "g" }, category: "pescado" },

  // ── HARINAS Y CEREALES ───────────────────────────────────────────────────
  { keywords: ["harina de trigo"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g", variants: [{ label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" }] }, category: "cereal" },
  { keywords: ["harina integral de trigo", "harina integral"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["harina de almendra", "harina de avena"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["pan rallado"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["pan de molde blanco", "pan de molde integral", "pan de molde"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["barra de pan", "pan baguette"], commercial: { label: "1 barra (~250 g)", size: 250, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["pasta espaguetis", "espaguetis"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["pasta macarrones", "macarrones"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["pasta fideos", "fideos"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["pasta penne", "pasta fusilli", "pasta farfalle", "pasta"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["arroz redondo", "arroz largo", "arroz integral", "arroz"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g", variants: [{ label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" }] }, category: "cereal" },
  { keywords: ["copos de avena", "avena"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["quinoa"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },
  { keywords: ["cuscus", "bulgur"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "cereal" },

  // ── LEGUMBRES ────────────────────────────────────────────────────────────
  { keywords: ["lentejas pardinas", "lentejas"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "legumbre" },
  { keywords: ["garbanzos cocidos", "garbanzos"], commercial: { label: "1 bote (400 g)", size: 400, sizeUnit: "g" }, category: "legumbre" },
  { keywords: ["alubias blancas cocidas", "alubias pintas cocidas", "alubias"], commercial: { label: "1 bote (400 g)", size: 400, sizeUnit: "g" }, category: "legumbre" },
  { keywords: ["soja texturizada"], commercial: { label: "1 bolsa (250 g)", size: 250, sizeUnit: "g" }, category: "legumbre" },
  { keywords: ["tofu"], commercial: { label: "1 bloque (250 g)", size: 250, sizeUnit: "g" }, category: "legumbre" },

  // ── VERDURAS Y HORTALIZAS ────────────────────────────────────────────────
  { keywords: ["tomates"], commercial: { label: "1 bandeja (~500 g)", size: 500, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["tomate triturado lata", "tomate triturado"], commercial: { label: "1 lata (400 g)", size: 400, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["tomate frito bote", "tomate frito"], commercial: { label: "1 bote (350 g)", size: 350, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["cebollas"], commercial: { label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g", variants: [{ label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" }, { label: "1 bolsa (2 kg)", size: 2000, sizeUnit: "g" }] }, category: "verdura" },
  { keywords: ["ajos"], commercial: { label: "1 cabeza de ajos (~50 g)", size: 50, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["pimientos rojos", "pimientos verdes", "pimientos amarillos"], commercial: { label: "1 bandeja 3 ud (~450 g)", size: 450, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["zanahorias"], commercial: { label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["patatas"], commercial: { label: "1 bolsa (2 kg)", size: 2000, sizeUnit: "g", variants: [{ label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" }, { label: "1 bolsa (2 kg)", size: 2000, sizeUnit: "g" }] }, category: "verdura" },
  { keywords: ["calabacines"], commercial: { label: "1 pieza (~300 g)", size: 300, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["berenjenas"], commercial: { label: "1 pieza (~350 g)", size: 350, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["brocoli"], commercial: { label: "1 pieza (~500 g)", size: 500, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["coliflor"], commercial: { label: "1 pieza (~700 g)", size: 700, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["espinacas frescas", "espinacas"], commercial: { label: "1 bolsa (300 g)", size: 300, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["lechuga iceberg", "lechuga"], commercial: { label: "1 pieza (~400 g)", size: 400, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["pepinos"], commercial: { label: "1 pieza (~300 g)", size: 300, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["champinones", "champiñones"], commercial: { label: "1 bandeja (250 g)", size: 250, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["cebolletas"], commercial: { label: "1 manojo (~200 g)", size: 200, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["puerros"], commercial: { label: "1 manojo 3 ud (~400 g)", size: 400, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["apio"], commercial: { label: "1 rama (~100 g)", size: 100, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["aguacates"], commercial: { label: "1 pieza (~200 g)", size: 200, sizeUnit: "g" }, category: "fruta" },

  // ── FRUTAS ───────────────────────────────────────────────────────────────
  { keywords: ["limones"], commercial: { label: "1 bolsa 4 ud (~400 g)", size: 400, sizeUnit: "g" }, category: "fruta" },
  { keywords: ["naranjas"], commercial: { label: "1 bolsa 6 ud (~1 kg)", size: 1000, sizeUnit: "g" }, category: "fruta" },
  { keywords: ["manzanas"], commercial: { label: "1 bolsa 6 ud (~1 kg)", size: 1000, sizeUnit: "g" }, category: "fruta" },
  { keywords: ["platanos"], commercial: { label: "1 manojo (~1 kg)", size: 1000, sizeUnit: "g" }, category: "fruta" },
  { keywords: ["fresas"], commercial: { label: "1 bandeja (500 g)", size: 500, sizeUnit: "g" }, category: "fruta" },
  { keywords: ["uvas"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" }, category: "fruta" },

  // ── ESPECIAS Y CONDIMENTOS ───────────────────────────────────────────────
  { keywords: ["sal fina", "sal gruesa", "sal"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g", variants: [{ label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" }] }, category: "especia" },
  { keywords: ["pimienta negra molida", "pimienta blanca molida", "pimienta"], commercial: { label: "1 bote (50 g)", size: 50, sizeUnit: "g" }, category: "especia" },
  { keywords: ["oregano seco", "oregano"], commercial: { label: "1 bote (20 g)", size: 20, sizeUnit: "g" }, category: "especia" },
  { keywords: ["tomillo seco", "tomillo"], commercial: { label: "1 bote (20 g)", size: 20, sizeUnit: "g" }, category: "especia" },
  { keywords: ["romero seco", "romero"], commercial: { label: "1 bote (20 g)", size: 20, sizeUnit: "g" }, category: "especia" },
  { keywords: ["comino molido", "comino"], commercial: { label: "1 bote (35 g)", size: 35, sizeUnit: "g" }, category: "especia" },
  { keywords: ["pimenton dulce", "pimenton picante", "pimenton"], commercial: { label: "1 lata (75 g)", size: 75, sizeUnit: "g" }, category: "especia" },
  { keywords: ["canela molida", "canela"], commercial: { label: "1 bote (35 g)", size: 35, sizeUnit: "g" }, category: "especia" },
  { keywords: ["nuez moscada molida", "nuez moscada"], commercial: { label: "1 bote (30 g)", size: 30, sizeUnit: "g" }, category: "especia" },
  { keywords: ["curry en polvo", "curry"], commercial: { label: "1 bote (40 g)", size: 40, sizeUnit: "g" }, category: "especia" },
  { keywords: ["curcuma molida", "curcuma"], commercial: { label: "1 bote (35 g)", size: 35, sizeUnit: "g" }, category: "especia" },
  { keywords: ["jengibre molido", "jengibre"], commercial: { label: "1 bote (35 g)", size: 35, sizeUnit: "g" }, category: "especia" },
  { keywords: ["azafran hebras", "azafran"], commercial: { label: "1 sobre (0,4 g)", size: 1, sizeUnit: "ud" }, category: "especia" },
  { keywords: ["hojas de laurel", "laurel"], commercial: { label: "1 bote (10 g)", size: 10, sizeUnit: "g" }, category: "especia" },
  { keywords: ["perejil seco", "perejil"], commercial: { label: "1 bote (15 g)", size: 15, sizeUnit: "g" }, category: "especia" },
  { keywords: ["albahaca seca", "albahaca"], commercial: { label: "1 bote (15 g)", size: 15, sizeUnit: "g" }, category: "especia" },
  { keywords: ["cilantro seco", "cilantro"], commercial: { label: "1 bote (15 g)", size: 15, sizeUnit: "g" }, category: "especia" },

  // ── SALSAS Y CONDIMENTOS LÍQUIDOS ────────────────────────────────────────
  { keywords: ["vinagre de vino blanco", "vinagre de vino tinto", "vinagre de manzana", "vinagre"], commercial: { label: "1 botella (500 ml)", size: 500, sizeUnit: "ml" }, category: "condimento" },
  { keywords: ["salsa de soja"], commercial: { label: "1 botella (250 ml)", size: 250, sizeUnit: "ml" }, category: "condimento" },
  { keywords: ["ketchup"], commercial: { label: "1 bote (300 g)", size: 300, sizeUnit: "g" }, category: "condimento" },
  { keywords: ["mostaza"], commercial: { label: "1 bote (200 g)", size: 200, sizeUnit: "g" }, category: "condimento" },
  { keywords: ["mayonesa"], commercial: { label: "1 bote (225 g)", size: 225, sizeUnit: "g" }, category: "condimento" },
  { keywords: ["salsa worcestershire"], commercial: { label: "1 botella (150 ml)", size: 150, sizeUnit: "ml" }, category: "condimento" },
  { keywords: ["salsa picante", "tabasco"], commercial: { label: "1 botella (60 ml)", size: 60, sizeUnit: "ml" }, category: "condimento" },
  { keywords: ["caldo de pollo", "caldo de verduras", "caldo de carne", "caldo"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, category: "condimento" },

  // ── DULCES Y REPOSTERÍA ──────────────────────────────────────────────────
  { keywords: ["azucar blanco", "azucar"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g", variants: [{ label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" }] }, category: "dulce" },
  { keywords: ["azucar moreno", "azucar integral"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }, category: "dulce" },
  { keywords: ["miel"], commercial: { label: "1 tarro (500 g)", size: 500, sizeUnit: "g", variants: [{ label: "1 tarro (250 g)", size: 250, sizeUnit: "g" }, { label: "1 tarro (500 g)", size: 500, sizeUnit: "g" }] }, category: "dulce" },
  { keywords: ["mermelada de fresa", "mermelada"], commercial: { label: "1 tarro (350 g)", size: 350, sizeUnit: "g" }, category: "dulce" },
  { keywords: ["chocolate negro", "chocolate con leche", "chocolate blanco", "chocolate"], commercial: { label: "1 tableta (100 g)", size: 100, sizeUnit: "g" }, category: "dulce" },
  { keywords: ["cacao en polvo", "cacao puro"], commercial: { label: "1 lata (250 g)", size: 250, sizeUnit: "g" }, category: "dulce" },
  { keywords: ["levadura quimica", "levadura royal"], commercial: { label: "1 sobre (16 g)", size: 16, sizeUnit: "g" }, category: "dulce" },
  { keywords: ["bicarbonato sodico", "bicarbonato"], commercial: { label: "1 bote (200 g)", size: 200, sizeUnit: "g" }, category: "dulce" },
  { keywords: ["extracto de vainilla", "vainilla"], commercial: { label: "1 botella (60 ml)", size: 60, sizeUnit: "ml" }, category: "dulce" },

  // ── FRUTOS SECOS Y SEMILLAS ──────────────────────────────────────────────
  { keywords: ["almendras crudas", "almendras"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["nueces peladas", "nueces"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["avellanas crudas", "avellanas"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["pistachos pelados", "pistachos"], commercial: { label: "1 bolsa (150 g)", size: 150, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["cacahuetes tostados", "cacahuetes"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["anacardos crudos", "anacardos"], commercial: { label: "1 bolsa (150 g)", size: 150, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["semillas de girasol", "pipas"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["semillas de chia", "chia"], commercial: { label: "1 bolsa (250 g)", size: 250, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["semillas de lino", "lino"], commercial: { label: "1 bolsa (250 g)", size: 250, sizeUnit: "g" }, category: "fruto_seco" },
  { keywords: ["sesamo", "semillas de sesamo"], commercial: { label: "1 bolsa (100 g)", size: 100, sizeUnit: "g" }, category: "fruto_seco" },

  // ── BEBIDAS ──────────────────────────────────────────────────────────────
  { keywords: ["agua mineral"], commercial: { label: "1 pack 6 botellas (1,5 L)", size: 9000, sizeUnit: "ml" }, category: "bebida" },
  { keywords: ["zumo de naranja", "zumo naranja"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, category: "bebida" },
  { keywords: ["zumo de manzana", "zumo manzana"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, category: "bebida" },
  { keywords: ["zumo"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, category: "bebida" },
  { keywords: ["bebida de avena", "bebida de almendra", "bebida de soja", "leche vegetal"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" }, category: "bebida" },
  { keywords: ["cafe molido", "cafe en grano"], commercial: { label: "1 paquete (250 g)", size: 250, sizeUnit: "g", variants: [{ label: "1 paquete (250 g)", size: 250, sizeUnit: "g" }, { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" }] }, category: "bebida" },
  { keywords: ["cafe soluble", "cafe instantaneo"], commercial: { label: "1 tarro (200 g)", size: 200, sizeUnit: "g" }, category: "bebida" },
  { keywords: ["te verde", "te negro", "te rojo", "te"], commercial: { label: "1 caja 20 bolsitas", size: 20, sizeUnit: "ud" }, category: "bebida" },
  { keywords: ["infusion", "manzanilla", "tila", "poleo"], commercial: { label: "1 caja 25 bolsitas", size: 25, sizeUnit: "ud" }, category: "bebida" },
  { keywords: ["vino blanco", "vino tinto", "vino rosado", "vino"], commercial: { label: "1 botella (750 ml)", size: 750, sizeUnit: "ml" }, category: "bebida" },
  { keywords: ["cerveza"], commercial: { label: "1 pack 6 latas (330 ml)", size: 1980, sizeUnit: "ml" }, category: "bebida" },

  // ── CHOCOLATE Y CACAO ────────────────────────────────────────────────────
  { keywords: ["chips de chocolate", "pepitas de chocolate"], commercial: { label: "1 bolsa (100 g)", size: 100, sizeUnit: "g" }, category: "dulce" },
  { keywords: ["nutella", "crema de cacao"], commercial: { label: "1 tarro (400 g)", size: 400, sizeUnit: "g" }, category: "dulce" },

  // ── CONSERVAS ────────────────────────────────────────────────────────────
  { keywords: ["maiz dulce lata", "maiz dulce"], commercial: { label: "1 lata (340 g)", size: 340, sizeUnit: "g" }, category: "conserva" },
  { keywords: ["aceitunas verdes", "aceitunas negras", "aceitunas"], commercial: { label: "1 tarro (350 g)", size: 350, sizeUnit: "g" }, category: "conserva" },
  { keywords: ["pepinillos en vinagre", "pepinillos"], commercial: { label: "1 tarro (350 g)", size: 350, sizeUnit: "g" }, category: "conserva" },
  { keywords: ["alcaparras"], commercial: { label: "1 tarro (100 g)", size: 100, sizeUnit: "g" }, category: "conserva" },

  // ── CONGELADOS ───────────────────────────────────────────────────────────
  { keywords: ["verduras congeladas", "menestra congelada", "menestra"], commercial: { label: "1 bolsa (750 g)", size: 750, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["espinacas congeladas"], commercial: { label: "1 bolsa (600 g)", size: 600, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["brocoli congelado"], commercial: { label: "1 bolsa (600 g)", size: 600, sizeUnit: "g" }, category: "verdura" },
  { keywords: ["pizza congelada"], commercial: { label: "1 pizza (350 g)", size: 350, sizeUnit: "g" }, category: "otro" },
];

// ---------------------------------------------------------------------------
// HELPER: detect food category from ingredient name
// ---------------------------------------------------------------------------
function detectCategory(ingredientNorm: string): string {
  for (const { keywords, category } of KEYWORD_CATEGORY) {
    if (keywords.some((kw) => ingredientNorm.includes(normalize(kw)))) {
      return category;
    }
  }
  return "otro";
}

// ---------------------------------------------------------------------------
// PASS 1: exact / substring keyword match
// ---------------------------------------------------------------------------
function matchByKeyword(ingredientNorm: string): SupermarketUnitRule | null {
  for (const rule of SUPERMARKET_UNIT_RULES) {
    if (rule.keywords.some((kw) => ingredientNorm.includes(normalize(kw)))) {
      return rule;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// PASS 2: alias resolution → retry keyword match
// ---------------------------------------------------------------------------
function matchByAlias(ingredientNorm: string): SupermarketUnitRule | null {
  for (const [alias, canonical] of Object.entries(INGREDIENT_ALIASES)) {
    if (ingredientNorm.includes(normalize(alias))) {
      const canonicalNorm = normalize(canonical);
      const rule = matchByKeyword(canonicalNorm);
      if (rule) return rule;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// PASS 3: category fallback
// ---------------------------------------------------------------------------
function matchByCategory(ingredientNorm: string): { commercial: CommercialUnit; isFallback: true } | null {
  const category = detectCategory(ingredientNorm);
  const fallback = CATEGORY_FALLBACK[category] ?? CATEGORY_FALLBACK["otro"];
  return { commercial: fallback, isFallback: true };
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

/**
 * Find the best commercial unit rule for an ingredient.
 * Returns the rule (or null if even fallback fails, which shouldn't happen).
 */
export function findCommercialUnit(ingredientName: string): SupermarketUnitRule | null {
  const norm = normalize(ingredientName);
  return matchByKeyword(norm) ?? matchByAlias(norm);
}

export interface NormalizedShoppingItem {
  /** Number of commercial units to buy */
  quantity: number;
  /** Human-readable label, e.g. "2× 1 sobre (100 g)" */
  label: string;
  /** Original recipe quantity */
  originalQty: number;
  /** Original recipe unit */
  originalUnit: string;
  /** true when a specific commercial unit was found (not a category fallback) */
  hasCommercialUnit: boolean;
  /** true when matched via category fallback (less precise) */
  isFallback?: boolean;
  /** Normalized product name shown to user (canonical name) */
  normalizedName?: string;
  /** Available size variants for this product */
  variants?: CommercialUnit["variants"];
}

/**
 * Main function: given an ingredient name + recipe quantity + unit,
 * returns a NormalizedShoppingItem with realistic commercial quantities.
 *
 * Strategy:
 *  1. Keyword match
 *  2. Alias match
 *  3. Category fallback (always returns something sensible)
 */
export function normalizeToCommercialUnit(
  ingredientName: string,
  recipeQty: number,
  recipeUnit: string
): NormalizedShoppingItem {
  const norm = normalize(ingredientName);

  // Pass 1: keyword match
  let rule = matchByKeyword(norm);
  let isFallback = false;
  let normalizedName: string | undefined;

  // Pass 2: alias match
  if (!rule) {
    for (const [alias, canonical] of Object.entries(INGREDIENT_ALIASES)) {
      if (norm.includes(normalize(alias))) {
        const canonicalNorm = normalize(canonical);
        rule = matchByKeyword(canonicalNorm);
        if (rule) {
          normalizedName = canonical; // show canonical name to user
          break;
        }
      }
    }
  }

  // Pass 3: category fallback
  let commercial: CommercialUnit;
  if (rule) {
    commercial = rule.commercial;
  } else {
    isFallback = true;
    const category = detectCategory(norm);
    commercial = CATEGORY_FALLBACK[category] ?? CATEGORY_FALLBACK["otro"];
  }

  // Calculate how many commercial units cover the recipe quantity
  const commercialUnits = Math.max(1, Math.ceil(recipeQty / commercial.size));

  const label = commercialUnits === 1
    ? commercial.label
    : `${commercialUnits}× ${commercial.label}`;

  return {
    quantity: commercialUnits,
    label,
    originalQty: recipeQty,
    originalUnit: recipeUnit,
    hasCommercialUnit: !isFallback,
    isFallback,
    normalizedName,
    variants: rule?.commercial.variants,
  };
}
