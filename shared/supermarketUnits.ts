/**
 * supermarketUnits.ts
 * -------------------
 * Maps ingredient names (or keywords) to the minimum commercial unit
 * sold in a supermarket.  Used when generating shopping lists so that
 * the user sees realistic, purchasable quantities instead of exact
 * recipe amounts.
 *
 * Structure of each entry:
 *   keywords  – lower-case substrings that identify the ingredient
 *   unit      – the commercial unit label shown to the user
 *   quantity  – the size/amount of that unit (in grams, ml, or natural units)
 *   unitType  – "weight" | "volume" | "piece" | "pack"
 *   minGrams  – minimum threshold (g or ml) above which we add one more unit
 */

export interface CommercialUnit {
  /** Human-readable label, e.g. "1 sobre (100 g)" */
  label: string;
  /** Numeric size of the unit in grams or ml */
  size: number;
  /** "g" | "ml" | "ud" */
  sizeUnit: "g" | "ml" | "ud";
}

export interface SupermarketUnitRule {
  /** Lower-case keywords; if ANY of them appear in the ingredient name → rule matches */
  keywords: string[];
  commercial: CommercialUnit;
}

// ---------------------------------------------------------------------------
// RULE TABLE  (order matters: first match wins)
// ---------------------------------------------------------------------------
export const SUPERMARKET_UNIT_RULES: SupermarketUnitRule[] = [
  // ── EMBUTIDOS / FIAMBRES ─────────────────────────────────────────────────
  { keywords: ["jamón serrano", "jamon serrano"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["jamón cocido", "jamon cocido", "jamón york", "jamon york"], commercial: { label: "1 sobre (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["jamón ibérico", "jamon iberico", "jamón pata negra"], commercial: { label: "1 sobre (80 g)", size: 80, sizeUnit: "g" } },
  { keywords: ["lomo embuchado", "lomo curado"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["salchichón", "salchichon"], commercial: { label: "1 pieza (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["chorizo"], commercial: { label: "1 pieza (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["fuet"], commercial: { label: "1 pieza (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["mortadela"], commercial: { label: "1 sobre (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["pavo lonchas", "pechuga pavo lonchas"], commercial: { label: "1 sobre (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["pechuga de pavo", "pavo fiambre"], commercial: { label: "1 sobre (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["bacon", "beicon", "panceta"], commercial: { label: "1 sobre (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["salami"], commercial: { label: "1 sobre (100 g)", size: 100, sizeUnit: "g" } },

  // ── QUESOS ───────────────────────────────────────────────────────────────
  { keywords: ["queso parmesano", "parmesano rallado"], commercial: { label: "1 bolsa rallado (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["queso rallado", "mozzarella rallada"], commercial: { label: "1 bolsa rallado (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["queso mozzarella", "mozzarella fresca"], commercial: { label: "1 bola (125 g)", size: 125, sizeUnit: "g" } },
  { keywords: ["queso feta", "feta"], commercial: { label: "1 bloque (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["queso crema", "queso philadelphia", "philadelphia"], commercial: { label: "1 tarrina (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["queso manchego"], commercial: { label: "1 cuña (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["queso fresco"], commercial: { label: "1 pieza (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["queso brie", "brie"], commercial: { label: "1 porción (125 g)", size: 125, sizeUnit: "g" } },
  { keywords: ["queso gouda", "gouda"], commercial: { label: "1 sobre lonchas (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["queso cheddar", "cheddar"], commercial: { label: "1 sobre lonchas (150 g)", size: 150, sizeUnit: "g" } },
  { keywords: ["queso ricotta", "ricotta"], commercial: { label: "1 tarrina (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["queso cottage", "cottage"], commercial: { label: "1 tarrina (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["queso"], commercial: { label: "1 pieza (200 g)", size: 200, sizeUnit: "g" } },

  // ── LÁCTEOS ──────────────────────────────────────────────────────────────
  { keywords: ["leche entera", "leche semidesnatada", "leche desnatada", "leche"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" } },
  { keywords: ["nata para cocinar", "nata líquida", "nata montada", "nata"], commercial: { label: "1 brick (200 ml)", size: 200, sizeUnit: "ml" } },
  { keywords: ["yogur griego", "yogur natural", "yogur"], commercial: { label: "1 pack 4 uds (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["mantequilla"], commercial: { label: "1 pastilla (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["margarina"], commercial: { label: "1 tarrina (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["crema agria", "sour cream"], commercial: { label: "1 tarrina (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["kéfir", "kefir"], commercial: { label: "1 botella (500 ml)", size: 500, sizeUnit: "ml" } },
  { keywords: ["leche condensada"], commercial: { label: "1 bote (370 g)", size: 370, sizeUnit: "g" } },
  { keywords: ["leche evaporada"], commercial: { label: "1 bote (400 ml)", size: 400, sizeUnit: "ml" } },

  // ── HUEVOS ───────────────────────────────────────────────────────────────
  { keywords: ["huevo", "huevos"], commercial: { label: "1 docena (12 ud)", size: 12, sizeUnit: "ud" } },
  { keywords: ["clara de huevo", "claras de huevo"], commercial: { label: "1 brik claras (500 ml)", size: 500, sizeUnit: "ml" } },

  // ── ACEITES Y GRASAS ─────────────────────────────────────────────────────
  { keywords: ["aceite de oliva virgen extra", "aceite de oliva", "aceite oliva"], commercial: { label: "1 botella (750 ml)", size: 750, sizeUnit: "ml" } },
  { keywords: ["aceite de girasol", "aceite girasol"], commercial: { label: "1 botella (1 L)", size: 1000, sizeUnit: "ml" } },
  { keywords: ["aceite de coco", "aceite coco"], commercial: { label: "1 tarro (400 ml)", size: 400, sizeUnit: "ml" } },
  { keywords: ["aceite de sésamo", "aceite sesamo"], commercial: { label: "1 botella (250 ml)", size: 250, sizeUnit: "ml" } },
  { keywords: ["aceite"], commercial: { label: "1 botella (750 ml)", size: 750, sizeUnit: "ml" } },

  // ── VINAGRES Y SALSAS ────────────────────────────────────────────────────
  { keywords: ["vinagre de módena", "vinagre balsámico", "vinagre balsamico"], commercial: { label: "1 botella (250 ml)", size: 250, sizeUnit: "ml" } },
  { keywords: ["vinagre de manzana", "vinagre manzana"], commercial: { label: "1 botella (500 ml)", size: 500, sizeUnit: "ml" } },
  { keywords: ["vinagre"], commercial: { label: "1 botella (500 ml)", size: 500, sizeUnit: "ml" } },
  { keywords: ["salsa de soja", "soja salsa"], commercial: { label: "1 botella (150 ml)", size: 150, sizeUnit: "ml" } },
  { keywords: ["salsa worcestershire", "worcestershire"], commercial: { label: "1 botella (150 ml)", size: 150, sizeUnit: "ml" } },
  { keywords: ["salsa tabasco", "tabasco"], commercial: { label: "1 botella (60 ml)", size: 60, sizeUnit: "ml" } },
  { keywords: ["ketchup"], commercial: { label: "1 bote (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["mayonesa", "mahonesa"], commercial: { label: "1 bote (225 g)", size: 225, sizeUnit: "g" } },
  { keywords: ["mostaza"], commercial: { label: "1 bote (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["salsa de tomate", "tomate frito", "tomate triturado"], commercial: { label: "1 bote (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["pesto"], commercial: { label: "1 tarro (190 g)", size: 190, sizeUnit: "g" } },
  { keywords: ["tahini", "pasta de sésamo"], commercial: { label: "1 tarro (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["miso"], commercial: { label: "1 tarro (200 g)", size: 200, sizeUnit: "g" } },

  // ── ESPECIAS Y CONDIMENTOS ───────────────────────────────────────────────
  { keywords: ["sal"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["pimienta negra", "pimienta blanca", "pimienta"], commercial: { label: "1 bote especias (50 g)", size: 50, sizeUnit: "g" } },
  { keywords: ["pimentón dulce", "pimentón picante", "pimentón ahumado", "pimentón"], commercial: { label: "1 lata (75 g)", size: 75, sizeUnit: "g" } },
  { keywords: ["comino"], commercial: { label: "1 bote especias (50 g)", size: 50, sizeUnit: "g" } },
  { keywords: ["cúrcuma", "curcuma"], commercial: { label: "1 bote especias (50 g)", size: 50, sizeUnit: "g" } },
  { keywords: ["canela"], commercial: { label: "1 bote especias (50 g)", size: 50, sizeUnit: "g" } },
  { keywords: ["orégano"], commercial: { label: "1 bote especias (15 g)", size: 15, sizeUnit: "g" } },
  { keywords: ["tomillo"], commercial: { label: "1 bote especias (15 g)", size: 15, sizeUnit: "g" } },
  { keywords: ["romero"], commercial: { label: "1 bote especias (15 g)", size: 15, sizeUnit: "g" } },
  { keywords: ["albahaca seca", "albahaca"], commercial: { label: "1 bote especias (15 g)", size: 15, sizeUnit: "g" } },
  { keywords: ["laurel"], commercial: { label: "1 bote especias (10 g)", size: 10, sizeUnit: "g" } },
  { keywords: ["curry"], commercial: { label: "1 bote especias (50 g)", size: 50, sizeUnit: "g" } },
  { keywords: ["jengibre molido", "jengibre en polvo"], commercial: { label: "1 bote especias (50 g)", size: 50, sizeUnit: "g" } },
  { keywords: ["nuez moscada"], commercial: { label: "1 bote especias (25 g)", size: 25, sizeUnit: "g" } },
  { keywords: ["azafrán"], commercial: { label: "1 sobre (0,1 g)", size: 1, sizeUnit: "g" } },
  { keywords: ["levadura química", "levadura en polvo", "impulsor"], commercial: { label: "1 sobre (16 g)", size: 16, sizeUnit: "g" } },
  { keywords: ["levadura fresca"], commercial: { label: "1 cubo (25 g)", size: 25, sizeUnit: "g" } },
  { keywords: ["levadura seca"], commercial: { label: "1 sobre (7 g)", size: 7, sizeUnit: "g" } },

  // ── AZÚCARES Y ENDULZANTES ───────────────────────────────────────────────
  { keywords: ["azúcar moreno", "azucar moreno"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["azúcar glass", "azucar glass", "azúcar glas"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["azúcar", "azucar"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["miel"], commercial: { label: "1 tarro (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["sirope de agave", "agave"], commercial: { label: "1 botella (350 ml)", size: 350, sizeUnit: "ml" } },
  { keywords: ["sirope de arce", "maple"], commercial: { label: "1 botella (250 ml)", size: 250, sizeUnit: "ml" } },
  { keywords: ["stevia"], commercial: { label: "1 bote (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["eritritol"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["mermelada"], commercial: { label: "1 tarro (350 g)", size: 350, sizeUnit: "g" } },

  // ── HARINAS Y CEREALES ───────────────────────────────────────────────────
  { keywords: ["harina de trigo", "harina"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["harina de avena", "avena molida"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["harina de almendra", "almendra molida"], commercial: { label: "1 paquete (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["maicena", "almidón de maíz", "fécula de maíz"], commercial: { label: "1 caja (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["pan rallado", "pan rayado"], commercial: { label: "1 paquete (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["avena en copos", "copos de avena", "avena"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["arroz integral", "arroz basmati", "arroz largo", "arroz"], commercial: { label: "1 paquete (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["pasta", "espaguetis", "macarrones", "penne", "fusilli", "tallarines", "fettuccine"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["quinoa"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["cuscús", "cous cous", "couscous"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["bulgur"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["mijo"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["pan de molde", "pan de sandwich"], commercial: { label: "1 bolsa (450 g)", size: 450, sizeUnit: "g" } },
  { keywords: ["pan"], commercial: { label: "1 barra (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["tortilla de trigo", "tortilla de maíz", "tortilla wrap"], commercial: { label: "1 pack 8 ud", size: 8, sizeUnit: "ud" } },
  { keywords: ["galletas"], commercial: { label: "1 paquete (200 g)", size: 200, sizeUnit: "g" } },

  // ── LEGUMBRES ────────────────────────────────────────────────────────────
  { keywords: ["garbanzos cocidos", "garbanzos en bote"], commercial: { label: "1 bote (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["lentejas cocidas", "lentejas en bote"], commercial: { label: "1 bote (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["alubias cocidas", "judías blancas cocidas", "alubias en bote"], commercial: { label: "1 bote (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["garbanzos secos", "garbanzos"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["lentejas secas", "lentejas"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["alubias secas", "judías blancas", "alubias"], commercial: { label: "1 paquete (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["edamame"], commercial: { label: "1 bolsa congelada (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["tofu"], commercial: { label: "1 bloque (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["tempeh"], commercial: { label: "1 bloque (200 g)", size: 200, sizeUnit: "g" } },

  // ── CONSERVAS ────────────────────────────────────────────────────────────
  { keywords: ["atún en lata", "atún al natural", "atún en aceite"], commercial: { label: "1 pack 3 latas (3×80 g)", size: 240, sizeUnit: "g" } },
  { keywords: ["sardinas en lata", "sardinas"], commercial: { label: "1 lata (120 g)", size: 120, sizeUnit: "g" } },
  { keywords: ["caballa en lata", "caballa"], commercial: { label: "1 lata (120 g)", size: 120, sizeUnit: "g" } },
  { keywords: ["mejillones en lata", "mejillones"], commercial: { label: "1 lata (115 g)", size: 115, sizeUnit: "g" } },
  { keywords: ["tomate pelado", "tomate entero lata"], commercial: { label: "1 lata (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["maíz en lata", "maíz dulce"], commercial: { label: "1 lata (285 g)", size: 285, sizeUnit: "g" } },
  { keywords: ["aceitunas"], commercial: { label: "1 tarro (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["pepinillos"], commercial: { label: "1 tarro (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["alcaparras"], commercial: { label: "1 tarro (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["caldo de pollo", "caldo de verduras", "caldo de carne", "caldo"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" } },

  // ── CARNES ───────────────────────────────────────────────────────────────
  { keywords: ["pechuga de pollo", "filete de pollo"], commercial: { label: "1 bandeja (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["muslo de pollo", "contramuslo de pollo"], commercial: { label: "1 bandeja (600 g)", size: 600, sizeUnit: "g" } },
  { keywords: ["pollo entero"], commercial: { label: "1 pollo (1,2 kg)", size: 1200, sizeUnit: "g" } },
  { keywords: ["pollo"], commercial: { label: "1 bandeja (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["carne picada de ternera", "carne picada mixta", "carne picada"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["filete de ternera", "entrecot", "solomillo de ternera"], commercial: { label: "1 bandeja (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["ternera"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["lomo de cerdo", "solomillo de cerdo"], commercial: { label: "1 pieza (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["costillas de cerdo"], commercial: { label: "1 bandeja (600 g)", size: 600, sizeUnit: "g" } },
  { keywords: ["cerdo"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["pavo entero", "pechuga de pavo"], commercial: { label: "1 bandeja (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["cordero"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["salchicha fresca", "salchicha"], commercial: { label: "1 pack (400 g)", size: 400, sizeUnit: "g" } },

  // ── PESCADOS Y MARISCOS ──────────────────────────────────────────────────
  { keywords: ["salmón fresco", "filete de salmón", "salmon"], commercial: { label: "1 filete (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["merluza", "filete de merluza"], commercial: { label: "1 bandeja (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["bacalao desalado", "bacalao"], commercial: { label: "1 bandeja (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["dorada", "lubina", "rodaballo"], commercial: { label: "1 pieza (350 g)", size: 350, sizeUnit: "g" } },
  { keywords: ["gambas peladas", "gambas", "langostinos"], commercial: { label: "1 bolsa (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["calamar", "sepia"], commercial: { label: "1 bandeja (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["pulpo"], commercial: { label: "1 pata (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["berberechos", "almejas"], commercial: { label: "1 malla (500 g)", size: 500, sizeUnit: "g" } },

  // ── FRUTAS ───────────────────────────────────────────────────────────────
  { keywords: ["plátano", "banana"], commercial: { label: "1 mano (6 ud)", size: 6, sizeUnit: "ud" } },
  { keywords: ["manzana"], commercial: { label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["naranja"], commercial: { label: "1 malla (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["limón"], commercial: { label: "1 malla (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["lima"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["fresa", "fresón"], commercial: { label: "1 bandeja (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["arándano", "arandano"], commercial: { label: "1 tarrina (125 g)", size: 125, sizeUnit: "g" } },
  { keywords: ["frambuesa"], commercial: { label: "1 tarrina (125 g)", size: 125, sizeUnit: "g" } },
  { keywords: ["mora"], commercial: { label: "1 tarrina (125 g)", size: 125, sizeUnit: "g" } },
  { keywords: ["uva"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["kiwi"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["mango"], commercial: { label: "1 pieza (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["piña"], commercial: { label: "1 pieza (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["papaya"], commercial: { label: "1 pieza (600 g)", size: 600, sizeUnit: "g" } },
  { keywords: ["melón"], commercial: { label: "1 pieza (1,5 kg)", size: 1500, sizeUnit: "g" } },
  { keywords: ["sandía"], commercial: { label: "1 pieza (3 kg)", size: 3000, sizeUnit: "g" } },
  { keywords: ["pera"], commercial: { label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["melocotón", "nectarina"], commercial: { label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["cereza"], commercial: { label: "1 bolsa (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["dátil"], commercial: { label: "1 paquete (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["higo seco", "higo"], commercial: { label: "1 paquete (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["pasas"], commercial: { label: "1 paquete (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["aguacate"], commercial: { label: "1 pieza (200 g)", size: 200, sizeUnit: "g" } },

  // ── VERDURAS Y HORTALIZAS ────────────────────────────────────────────────
  { keywords: ["tomate cherry"], commercial: { label: "1 bandeja (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["tomate pera", "tomate rama", "tomate"], commercial: { label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["cebolla"], commercial: { label: "1 malla (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["cebolla roja", "cebolla morada"], commercial: { label: "1 malla (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["ajo"], commercial: { label: "1 cabeza (50 g)", size: 50, sizeUnit: "g" } },
  { keywords: ["pimiento rojo", "pimiento verde", "pimiento amarillo", "pimiento"], commercial: { label: "1 bolsa (3 ud)", size: 3, sizeUnit: "ud" } },
  { keywords: ["zanahoria"], commercial: { label: "1 bolsa (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["patata"], commercial: { label: "1 malla (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["boniato", "batata"], commercial: { label: "1 pieza (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["berenjena"], commercial: { label: "1 pieza (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["calabacín", "zucchini"], commercial: { label: "1 pieza (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["pepino"], commercial: { label: "1 pieza (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["lechuga"], commercial: { label: "1 pieza (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["espinacas baby", "espinacas frescas", "espinacas"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["rúcula"], commercial: { label: "1 bolsa (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["col rizada", "kale"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["brócoli"], commercial: { label: "1 pieza (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["coliflor"], commercial: { label: "1 pieza (800 g)", size: 800, sizeUnit: "g" } },
  { keywords: ["col blanca", "repollo"], commercial: { label: "1 pieza (800 g)", size: 800, sizeUnit: "g" } },
  { keywords: ["coles de bruselas"], commercial: { label: "1 bolsa (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["apio"], commercial: { label: "1 rama (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["puerro"], commercial: { label: "1 manojo (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["champiñón", "champiñones"], commercial: { label: "1 bandeja (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["setas", "boletus", "shiitake"], commercial: { label: "1 bandeja (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["espárrago verde", "esparragos verdes", "espárrago"], commercial: { label: "1 manojo (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["alcachofa"], commercial: { label: "1 bolsa (4 ud)", size: 4, sizeUnit: "ud" } },
  { keywords: ["judía verde", "judias verdes", "vainita"], commercial: { label: "1 bolsa (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["guisante fresco", "guisante congelado", "guisante"], commercial: { label: "1 bolsa (400 g)", size: 400, sizeUnit: "g" } },
  { keywords: ["maíz dulce fresco"], commercial: { label: "1 mazorca (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["remolacha"], commercial: { label: "1 pack (500 g)", size: 500, sizeUnit: "g" } },
  { keywords: ["nabo"], commercial: { label: "1 pieza (300 g)", size: 300, sizeUnit: "g" } },
  { keywords: ["jengibre fresco", "jengibre"], commercial: { label: "1 trozo (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["perejil fresco", "perejil"], commercial: { label: "1 manojo (30 g)", size: 30, sizeUnit: "g" } },
  { keywords: ["cilantro fresco", "cilantro"], commercial: { label: "1 manojo (30 g)", size: 30, sizeUnit: "g" } },
  { keywords: ["albahaca fresca", "albahaca"], commercial: { label: "1 maceta (30 g)", size: 30, sizeUnit: "g" } },
  { keywords: ["menta fresca", "menta"], commercial: { label: "1 manojo (30 g)", size: 30, sizeUnit: "g" } },
  { keywords: ["cebollino"], commercial: { label: "1 manojo (30 g)", size: 30, sizeUnit: "g" } },

  // ── FRUTOS SECOS Y SEMILLAS ──────────────────────────────────────────────
  { keywords: ["almendra"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["nuez"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["anacardo"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["pistacho"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["avellana"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["cacahuete", "maní"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["semillas de chía", "chia"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["semillas de lino", "lino molido"], commercial: { label: "1 bolsa (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["semillas de girasol", "pipas de girasol"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["semillas de calabaza", "pipas de calabaza"], commercial: { label: "1 bolsa (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["semillas de sésamo", "sésamo"], commercial: { label: "1 bolsa (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["mantequilla de cacahuete", "crema de cacahuete"], commercial: { label: "1 tarro (340 g)", size: 340, sizeUnit: "g" } },
  { keywords: ["mantequilla de almendra", "crema de almendra"], commercial: { label: "1 tarro (250 g)", size: 250, sizeUnit: "g" } },

  // ── PROTEÍNAS EN POLVO Y SUPLEMENTOS ────────────────────────────────────
  { keywords: ["proteína en polvo", "whey protein", "proteína whey", "proteína de suero"], commercial: { label: "1 bote (1 kg)", size: 1000, sizeUnit: "g" } },
  { keywords: ["proteína vegana", "proteína de guisante", "proteína de arroz"], commercial: { label: "1 bote (500 g)", size: 500, sizeUnit: "g" } },

  // ── BEBIDAS ──────────────────────────────────────────────────────────────
  { keywords: ["agua mineral"], commercial: { label: "1 pack 6 botellas (1,5 L)", size: 9000, sizeUnit: "ml" } },
  { keywords: ["zumo de naranja", "zumo naranja"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" } },
  { keywords: ["zumo de manzana", "zumo manzana"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" } },
  { keywords: ["zumo"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" } },
  { keywords: ["leche vegetal", "bebida de avena", "bebida de almendra", "bebida de soja"], commercial: { label: "1 brick (1 L)", size: 1000, sizeUnit: "ml" } },
  { keywords: ["café molido", "café en grano"], commercial: { label: "1 paquete (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["café soluble", "café instantáneo"], commercial: { label: "1 tarro (200 g)", size: 200, sizeUnit: "g" } },
  { keywords: ["té verde", "té negro", "té rojo", "té"], commercial: { label: "1 caja 20 bolsitas", size: 20, sizeUnit: "ud" } },
  { keywords: ["infusión", "manzanilla", "tila", "poleo"], commercial: { label: "1 caja 25 bolsitas", size: 25, sizeUnit: "ud" } },
  { keywords: ["vino blanco", "vino tinto", "vino rosado", "vino"], commercial: { label: "1 botella (750 ml)", size: 750, sizeUnit: "ml" } },
  { keywords: ["cerveza"], commercial: { label: "1 pack 6 latas (330 ml)", size: 1980, sizeUnit: "ml" } },

  // ── CHOCOLATE Y CACAO ────────────────────────────────────────────────────
  { keywords: ["chocolate negro", "chocolate con leche", "chocolate blanco", "chocolate"], commercial: { label: "1 tableta (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["cacao en polvo", "cacao puro"], commercial: { label: "1 lata (250 g)", size: 250, sizeUnit: "g" } },
  { keywords: ["chips de chocolate", "pepitas de chocolate"], commercial: { label: "1 bolsa (100 g)", size: 100, sizeUnit: "g" } },
  { keywords: ["nutella", "crema de cacao"], commercial: { label: "1 tarro (400 g)", size: 400, sizeUnit: "g" } },

  // ── CONGELADOS ───────────────────────────────────────────────────────────
  { keywords: ["verduras congeladas", "menestra congelada", "menestra"], commercial: { label: "1 bolsa (750 g)", size: 750, sizeUnit: "g" } },
  { keywords: ["espinacas congeladas"], commercial: { label: "1 bolsa (600 g)", size: 600, sizeUnit: "g" } },
  { keywords: ["brócoli congelado"], commercial: { label: "1 bolsa (600 g)", size: 600, sizeUnit: "g" } },
  { keywords: ["pizza congelada"], commercial: { label: "1 pizza (350 g)", size: 350, sizeUnit: "g" } },
];

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Given an ingredient name, returns the matching commercial unit rule (or null).
 */
export function findCommercialUnit(ingredientName: string): SupermarketUnitRule | null {
  const lower = ingredientName.toLowerCase().trim();
  for (const rule of SUPERMARKET_UNIT_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule;
    }
  }
  return null;
}

/**
 * Given an ingredient name, a recipe quantity (in grams/ml/units) and its unit,
 * returns how many commercial units to buy and the label to show.
 *
 * Examples:
 *   normalizeToCommercialUnit("jamón serrano", 30, "g")
 *   → { quantity: 1, label: "1 sobre (100 g)", originalQty: 30, originalUnit: "g" }
 *
 *   normalizeToCommercialUnit("aceite de oliva", 15, "ml")
 *   → { quantity: 1, label: "1 botella (750 ml)", originalQty: 15, originalUnit: "ml" }
 */
export interface NormalizedShoppingItem {
  quantity: number;
  label: string;
  originalQty: number;
  originalUnit: string;
  /** true when a commercial unit was found */
  hasCommercialUnit: boolean;
}

export function normalizeToCommercialUnit(
  ingredientName: string,
  recipeQty: number,
  recipeUnit: string
): NormalizedShoppingItem {
  const rule = findCommercialUnit(ingredientName);

  if (!rule) {
    return {
      quantity: recipeQty,
      label: `${recipeQty} ${recipeUnit}`,
      originalQty: recipeQty,
      originalUnit: recipeUnit,
      hasCommercialUnit: false,
    };
  }

  // Calculate how many commercial units cover the recipe quantity
  const commercialUnits = Math.max(1, Math.ceil(recipeQty / rule.commercial.size));

  return {
    quantity: commercialUnits,
    label: commercialUnits === 1
      ? rule.commercial.label
      : `${commercialUnits}× ${rule.commercial.label}`,
    originalQty: recipeQty,
    originalUnit: recipeUnit,
    hasCommercialUnit: true,
  };
}
