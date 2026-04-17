#!/usr/bin/env python3
"""
Script de generación masiva de ingredientes para BuddyMarket.
Usa el endpoint interno del servidor Express para llamar al LLM.
Uso: python3 scripts/seed_ingredients_v3.py [batch_number 1-4]
"""

import os, sys, json, time, re, requests, psycopg2, psycopg2.extras

BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 1
DATABASE_URL = os.environ.get('DATABASE_URL', '')
SERVER_URL = "http://localhost:3000"
SEED_SECRET = "buddymarket-seed-2024"

print(f"🌱 BuddyMarket Ingredient Seeder v3 — Batch {BATCH}/4", flush=True)
if not DATABASE_URL:
    print("❌ Falta DATABASE_URL"); sys.exit(1)

# ─── Conexión a BD ────────────────────────────────────────────────────────────
conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

cur.execute('SELECT LOWER("nameEs") as name, "apiParam" FROM ingredients')
rows = cur.fetchall()
existing_names = set(r['name'] for r in rows)
existing_params = set(r['apiParam'] for r in rows)
print(f"📋 Ingredientes existentes: {len(existing_names)}", flush=True)

# ─── Datos nutricionales típicos por categoría ────────────────────────────────
NUTRITION_DEFAULTS = {
    "verduras": {"calories": 35, "proteins": 2.5, "carbohydrates": 6.0, "fats": 0.3, "saturatedFats": 0.05, "fiber": 2.5, "sugars": 3.0, "sodium": 30, "potassium": 350, "calcium": 50, "iron": 1.5, "vitaminC": 25, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "frutas": {"calories": 55, "proteins": 0.8, "carbohydrates": 13.5, "fats": 0.2, "saturatedFats": 0.03, "fiber": 2.0, "sugars": 10.0, "sodium": 5, "potassium": 200, "calcium": 15, "iron": 0.4, "vitaminC": 20, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "carnes": {"calories": 180, "proteins": 22.0, "carbohydrates": 0.0, "fats": 10.0, "saturatedFats": 3.5, "fiber": 0.0, "sugars": 0.0, "sodium": 70, "potassium": 320, "calcium": 12, "iron": 2.5, "vitaminC": 0, "isVegan": False, "isVegetarian": False, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "pescados": {"calories": 120, "proteins": 20.0, "carbohydrates": 0.0, "fats": 4.5, "saturatedFats": 1.0, "fiber": 0.0, "sugars": 0.0, "sodium": 80, "potassium": 380, "calcium": 30, "iron": 0.8, "vitaminC": 0, "isVegan": False, "isVegetarian": False, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "lacteos": {"calories": 100, "proteins": 6.0, "carbohydrates": 8.0, "fats": 5.0, "saturatedFats": 3.0, "fiber": 0.0, "sugars": 7.0, "sodium": 90, "potassium": 180, "calcium": 200, "iron": 0.1, "vitaminC": 1, "isVegan": False, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": False, "purchaseUnitType": "volume", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "mililitro", "purchaseUnitPlural": "mililitros"},
    "cereales": {"calories": 350, "proteins": 10.0, "carbohydrates": 70.0, "fats": 2.5, "saturatedFats": 0.5, "fiber": 5.0, "sugars": 2.0, "sodium": 5, "potassium": 250, "calcium": 30, "iron": 3.0, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": False, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "legumbres": {"calories": 330, "proteins": 22.0, "carbohydrates": 55.0, "fats": 1.5, "saturatedFats": 0.2, "fiber": 15.0, "sugars": 3.0, "sodium": 10, "potassium": 900, "calcium": 80, "iron": 7.0, "vitaminC": 2, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "frutos_secos": {"calories": 580, "proteins": 18.0, "carbohydrates": 20.0, "fats": 50.0, "saturatedFats": 5.0, "fiber": 8.0, "sugars": 5.0, "sodium": 5, "potassium": 650, "calcium": 100, "iron": 3.0, "vitaminC": 1, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "aceites": {"calories": 884, "proteins": 0.0, "carbohydrates": 0.0, "fats": 100.0, "saturatedFats": 14.0, "fiber": 0.0, "sugars": 0.0, "sodium": 0, "potassium": 0, "calcium": 0, "iron": 0.1, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "volume", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "mililitro", "purchaseUnitPlural": "mililitros"},
    "especias": {"calories": 250, "proteins": 8.0, "carbohydrates": 45.0, "fats": 5.0, "saturatedFats": 1.0, "fiber": 20.0, "sugars": 5.0, "sodium": 50, "potassium": 1200, "calcium": 200, "iron": 15.0, "vitaminC": 10, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 5, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "condimentos": {"calories": 80, "proteins": 2.0, "carbohydrates": 15.0, "fats": 1.5, "saturatedFats": 0.2, "fiber": 1.0, "sugars": 8.0, "sodium": 800, "potassium": 150, "calcium": 20, "iron": 0.5, "vitaminC": 3, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 15, "purchaseUnitSingular": "cucharada", "purchaseUnitPlural": "cucharadas"},
    "bebidas": {"calories": 40, "proteins": 1.0, "carbohydrates": 8.0, "fats": 0.5, "saturatedFats": 0.1, "fiber": 0.5, "sugars": 6.0, "sodium": 20, "potassium": 150, "calcium": 30, "iron": 0.2, "vitaminC": 5, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "volume", "purchaseGramsPerUnit": 250, "purchaseUnitSingular": "vaso", "purchaseUnitPlural": "vasos"},
    "lacteos_alternativos": {"calories": 50, "proteins": 2.0, "carbohydrates": 5.0, "fats": 2.5, "saturatedFats": 0.5, "fiber": 0.5, "sugars": 3.0, "sodium": 60, "potassium": 120, "calcium": 120, "iron": 0.3, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "volume", "purchaseGramsPerUnit": 250, "purchaseUnitSingular": "vaso", "purchaseUnitPlural": "vasos"},
    "proteinas_vegetales": {"calories": 150, "proteins": 18.0, "carbohydrates": 8.0, "fats": 5.0, "saturatedFats": 0.8, "fiber": 3.0, "sugars": 1.0, "sodium": 200, "potassium": 300, "calcium": 80, "iron": 3.0, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "suplementos": {"calories": 100, "proteins": 20.0, "carbohydrates": 5.0, "fats": 2.0, "saturatedFats": 0.5, "fiber": 1.0, "sugars": 2.0, "sodium": 100, "potassium": 200, "calcium": 100, "iron": 2.0, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 30, "purchaseUnitSingular": "porción", "purchaseUnitPlural": "porciones"},
    "hongos_setas": {"calories": 30, "proteins": 3.0, "carbohydrates": 4.0, "fats": 0.4, "saturatedFats": 0.05, "fiber": 2.0, "sugars": 2.0, "sodium": 5, "potassium": 400, "calcium": 5, "iron": 0.8, "vitaminC": 3, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "dulces": {"calories": 400, "proteins": 4.0, "carbohydrates": 65.0, "fats": 15.0, "saturatedFats": 8.0, "fiber": 2.0, "sugars": 50.0, "sodium": 100, "potassium": 200, "calcium": 50, "iron": 2.0, "vitaminC": 0, "isVegan": False, "isVegetarian": True, "isGlutenFree": False, "isDairyFree": False, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "edulcorantes": {"calories": 200, "proteins": 0.0, "carbohydrates": 50.0, "fats": 0.0, "saturatedFats": 0.0, "fiber": 0.0, "sugars": 48.0, "sodium": 5, "potassium": 20, "calcium": 5, "iron": 0.1, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 5, "purchaseUnitSingular": "cucharadita", "purchaseUnitPlural": "cucharaditas"},
    "snacks": {"calories": 450, "proteins": 8.0, "carbohydrates": 60.0, "fats": 20.0, "saturatedFats": 3.0, "fiber": 3.0, "sugars": 5.0, "sodium": 400, "potassium": 300, "calcium": 30, "iron": 2.0, "vitaminC": 2, "isVegan": False, "isVegetarian": False, "isGlutenFree": False, "isDairyFree": False, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 30, "purchaseUnitSingular": "porción", "purchaseUnitPlural": "porciones"},
    "preparados": {"calories": 80, "proteins": 4.0, "carbohydrates": 10.0, "fats": 2.0, "saturatedFats": 0.5, "fiber": 1.5, "sugars": 3.0, "sodium": 500, "potassium": 200, "calcium": 30, "iron": 0.8, "vitaminC": 5, "isVegan": False, "isVegetarian": False, "isGlutenFree": False, "isDairyFree": False, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 250, "purchaseUnitSingular": "porción", "purchaseUnitPlural": "porciones"},
    "algas_marinas": {"calories": 45, "proteins": 5.0, "carbohydrates": 8.0, "fats": 0.5, "saturatedFats": 0.1, "fiber": 5.0, "sugars": 1.0, "sodium": 800, "potassium": 600, "calcium": 150, "iron": 5.0, "vitaminC": 5, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 10, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "frutas_secas_y_deshidratadas": {"calories": 280, "proteins": 3.0, "carbohydrates": 70.0, "fats": 0.5, "saturatedFats": 0.1, "fiber": 5.0, "sugars": 60.0, "sodium": 10, "potassium": 700, "calcium": 50, "iron": 2.0, "vitaminC": 2, "isVegan": True, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "conservas": {"calories": 120, "proteins": 12.0, "carbohydrates": 5.0, "fats": 6.0, "saturatedFats": 1.5, "fiber": 1.0, "sugars": 2.0, "sodium": 600, "potassium": 250, "calcium": 40, "iron": 1.5, "vitaminC": 3, "isVegan": False, "isVegetarian": False, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "panaderia": {"calories": 270, "proteins": 8.0, "carbohydrates": 50.0, "fats": 3.0, "saturatedFats": 0.5, "fiber": 3.0, "sugars": 4.0, "sodium": 450, "potassium": 120, "calcium": 30, "iron": 2.5, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": False, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "embutidos_y_fiambres": {"calories": 280, "proteins": 18.0, "carbohydrates": 2.0, "fats": 22.0, "saturatedFats": 8.0, "fiber": 0.0, "sugars": 1.0, "sodium": 1200, "potassium": 250, "calcium": 15, "iron": 1.5, "vitaminC": 0, "isVegan": False, "isVegetarian": False, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
    "huevos": {"calories": 155, "proteins": 13.0, "carbohydrates": 1.1, "fats": 11.0, "saturatedFats": 3.3, "fiber": 0.0, "sugars": 0.5, "sodium": 140, "potassium": 140, "calcium": 56, "iron": 1.8, "vitaminC": 0, "isVegan": False, "isVegetarian": True, "isGlutenFree": True, "isDairyFree": True, "purchaseUnitType": "unit", "purchaseGramsPerUnit": 60, "purchaseUnitSingular": "huevo", "purchaseUnitPlural": "huevos"},
    "otros": {"calories": 200, "proteins": 5.0, "carbohydrates": 40.0, "fats": 2.0, "saturatedFats": 0.3, "fiber": 5.0, "sugars": 5.0, "sodium": 200, "potassium": 200, "calcium": 50, "iron": 1.0, "vitaminC": 0, "isVegan": True, "isVegetarian": True, "isGlutenFree": False, "isDairyFree": True, "purchaseUnitType": "weight", "purchaseGramsPerUnit": 100, "purchaseUnitSingular": "gramo", "purchaseUnitPlural": "gramos"},
}

# ─── Categorías por batch ─────────────────────────────────────────────────────
BATCH_CATEGORIES = {
    1: [
        ("verduras", 60, "pak choi, bok choy, romanesco, mizuna, rúcula, radicchio, endivias, achicoria, colinabo, chirivía, salsifí, yuca, malanga, taro, ñame, jícama, brotes de bambú, coles de Bruselas, coliflor morada, brócoli chino"),
        ("frutas", 60, "carambola, rambután, mangostán, lichi, pitahaya roja, pitahaya amarilla, maracuyá, guayaba, tamarindo, chirimoya, guanábana, papaya, jackfruit, salak, longan, kumquat, yuzu, bergamota"),
        ("carnes", 50, "entrecot de ternera, chuletón de buey, solomillo de cerdo, lomo de cordero, costilla de ternera, falda de ternera, pecho de ternera, morcillo de ternera, ossobuco de ternera, carrillera de cerdo"),
        ("pescados", 60, "lubina salvaje, dorada salvaje, rodaballo, lenguado, rape, bacalao fresco, abadejo, eglefino, gallineta, cabracho, san pedro, pez espada, atún rojo, bonito del norte, caballa, sardina"),
        ("lacteos", 50, "leche entera, leche semidesnatada, leche desnatada, leche UHT, leche de cabra, leche de oveja, kéfir, yogur natural, yogur griego, skyr, bifidus, queso fresco, requesón, ricotta, mascarpone"),
        ("cereales", 50, "trigo blando, trigo duro, espelta, kamut, einkorn, emmer, centeno, cebada perlada, cebada integral, avena en copos, avena instantánea, maíz dulce, mijo, sorgo, teff, fonio, quinoa blanca"),
        ("panaderia", 40, "pan blanco de molde, pan integral de molde, pan de centeno, pan de espelta, pan de maíz, pan sin gluten, baguette, ciabatta, focaccia, pita, naan, chapati, tortilla de maíz, tortilla de trigo"),
        ("embutidos_y_fiambres", 40, "jamón ibérico de bellota, jamón ibérico de cebo, jamón serrano, jamón york, jamón cocido, salchichón ibérico, chorizo ibérico, fuet, longaniza, morcilla de Burgos"),
        ("huevos", 20, "huevo de gallina campero, huevo de gallina ecológico, huevo de gallina de corral, huevo de codorniz, huevo de pato, huevo de oca, clara de huevo pasteurizada, yema de huevo pasteurizada"),
        ("conservas", 40, "atún en aceite de oliva, atún al natural, sardinas en aceite, sardinas en tomate, anchoas en aceite, mejillones en escabeche, berberechos al natural, navajas al natural, almejas al natural"),
    ],
    2: [
        ("legumbres", 60, "lentejas pardinas, lentejas verdes, lentejas rojas, lentejas beluga, lentejas puy, garbanzos castellanos, garbanzos pedrosillano, alubias blancas, alubias pintas, alubias negras"),
        ("frutos_secos", 60, "almendras crudas, almendras tostadas, almendras Marcona, nueces de Castilla, avellanas crudas, pistachos crudos, anacardos crudos, macadamia cruda, pecanas crudas, nueces de Brasil"),
        ("aceites", 40, "aceite de oliva virgen extra Arbequina, aceite de oliva virgen extra Picual, aceite de girasol alto oleico, aceite de maíz, aceite de soja, aceite de colza, aceite de coco virgen, aceite de aguacate"),
        ("especias", 80, "pimienta negra molida, pimienta blanca molida, pimienta verde en grano, pimienta rosa en grano, pimienta de Sichuan, pimentón dulce de La Vera, pimentón picante, cúrcuma molida, jengibre molido"),
        ("condimentos", 60, "salsa de soja oscura, salsa de soja clara, tamari sin gluten, miso blanco, miso rojo, vinagre de manzana, vinagre de vino blanco, vinagre de vino tinto, vinagre de arroz, vinagre balsámico"),
        ("bebidas", 40, "leche de almendra, leche de avena, leche de arroz, leche de coco, leche de soja, leche de cáñamo, agua de coco natural, zumo de naranja natural, zumo de manzana natural, té verde matcha"),
        ("lacteos_alternativos", 40, "yogur de soja natural, yogur de coco natural, yogur de almendra natural, queso vegano de anacardo, tofu firme natural, tofu sedoso natural, tofu firme ahumado, tempeh de soja natural"),
        ("proteinas_vegetales", 60, "soja texturizada fina, soja texturizada gruesa, soja texturizada en trozos, seitán natural, seitán ahumado, seitán marinado, tempeh de soja natural, tofu firme natural, tofu sedoso natural"),
        ("suplementos", 40, "proteína de suero de leche concentrada, proteína de suero de leche aislada, caseína micelar, proteína vegana de guisante y arroz, creatina monohidrato, BCAA en polvo, glutamina en polvo"),
        ("hongos_setas", 40, "champiñón blanco fresco, champiñón portobello fresco, champiñón cremini fresco, shiitake fresco, shiitake seco, maitake fresco, enoki fresco, shimeji marrón, shimeji blanco, oyster gris"),
    ],
    3: [
        ("dulces", 60, "chocolate negro 70%, chocolate negro 85%, chocolate con leche 35%, chocolate blanco, cacao en polvo sin azúcar, nibs de cacao, confitura de fresa, confitura de frambuesa, miel de flores, miel de romero"),
        ("edulcorantes", 30, "azúcar blanco refinado, azúcar glass, azúcar turbinado, azúcar demerara, azúcar muscovado, azúcar moreno, azúcar integral de caña, azúcar de coco, xilitol, eritritol en polvo, estevia en polvo"),
        ("snacks", 50, "chips de patata clásicos, chips de patata ondulados, chips de boniato, chips de remolacha, chips de zanahoria, chips de kale, chips de algas nori, chips de quinoa, chips de lentejas, palomitas de maíz"),
        ("preparados", 60, "caldo de pollo casero, caldo de carne casero, caldo de pescado casero, caldo de verduras casero, caldo de setas casero, gazpacho andaluz, salmorejo cordobés, crema de calabaza, crema de zanahoria"),
        ("algas_marinas", 40, "alga nori tostada en hojas, alga nori cruda en hojas, alga wakame seca, alga wakame fresca, alga kombu seca, alga dulse seca, alga hijiki seca, alga arame seca, agar-agar en polvo, espirulina en polvo"),
        ("frutas_secas_y_deshidratadas", 50, "pasas sultanas, pasas de Corinto, orejones de albaricoque, orejones de melocotón, ciruelas pasas de Agen, higos secos, dátiles Medjool, dátiles Deglet Nour, mango deshidratado"),
        ("otros", 60, "gelatina en hojas, gelatina en polvo, agar-agar en polvo, goma xantana, goma guar, almidón de maíz, almidón de patata, almidón de tapioca, pectina de manzana, lecitina de soja, levadura nutricional"),
        ("conservas", 50, "pepinillos en vinagre pequeños, pepinillos en vinagre grandes, cebollitas en vinagre, alcaparras en vinagre, aceitunas verdes sin hueso, aceitunas negras sin hueso, aceitunas kalamata, aceitunas arbequinas"),
    ],
    4: [
        ("verduras", 50, "rábano daikon blanco, rábano negro redondo, rábano rojo redondo, col china napa, col lombarda, col blanca, col verde, col rizada kale, col rizada lacinato, romanesco, coliflor morada, coliflor naranja"),
        ("frutas", 50, "mango Ataulfo, mango Tommy Atkins, manzana Golden Delicious, manzana Granny Smith, manzana Fuji, manzana Gala, pera Conference, pera Williams, cereza Picota, cereza Burlat, melocotón amarillo, melocotón blanco"),
        ("carnes", 40, "entrecot de ternera gallega, chuletón de buey madurado, solomillo de ternera, lomo alto de vaca, costilla de ternera, falda de ternera, ossobuco de ternera, carrillera de ternera, lengua de ternera"),
        ("pescados", 50, "lubina salvaje del Mediterráneo, dorada salvaje del Mediterráneo, rodaballo salvaje del Atlántico, lenguado del Mediterráneo, rape del Atlántico, bacalao fresco del Atlántico, abadejo del Atlántico"),
        ("especias", 60, "pimienta negra Tellicherry, pimienta negra Malabar, pimienta blanca de Sarawak, pimienta de Sichuan roja, pimentón dulce de La Vera DOP, cúrcuma de Alleppey, jengibre de Jamaica, canela de Ceilán en rama"),
        ("condimentos", 50, "salsa de soja Kikkoman, salsa de soja Yamasa, tamari San-J, miso blanco Hikari, miso rojo Marukome, vinagre de manzana Bragg, vinagre balsámico de Módena IGP, tahini Al Wadi, harissa Mina, sriracha Huy Fong"),
        ("bebidas", 50, "café Blue Mountain de Jamaica, café Kona de Hawái, café Geisha de Panamá, café Yirgacheffe de Etiopía, té verde Gyokuro, té verde Kabusecha, té verde Bancha, té negro Darjeeling primera cosecha"),
        ("hongos_setas", 50, "champiñón blanco fresco pequeño, champiñón portobello fresco, shiitake fresco, shiitake seco, maitake fresco, enoki fresco, shimeji marrón fresco, oyster gris fresco, king oyster fresco, reishi seco"),
        ("suplementos", 20, "proteína de insecto de grillo en polvo, colágeno de origen marino de bacalao, colágeno de origen bovino pasto, colágeno de tipo I, colágeno de tipo II, gelatina de origen bovino, gelatina de origen marino"),
        ("otros", 30, "gelatina en hojas sin sabor, agar-agar en polvo puro, goma xantana ecológica, almidón de maíz ecológico, almidón de patata ecológico, pectina de manzana ecológica, lecitina de soja ecológica, sal marina fina sin refinar"),
    ],
}

# ─── Función para llamar al LLM via servidor Express ─────────────────────────
def get_ingredient_names(category, count, examples, exclude_list):
    """Pide al servidor Express los nombres de ingredientes."""
    try:
        resp = requests.post(
            f"{SERVER_URL}/api/internal/seed-ingredients",
            headers={"Content-Type": "application/json", "x-seed-secret": SEED_SECRET},
            json={
                "category": category,
                "count": count,
                "examples": examples,
                "excludeNames": list(exclude_list)[:20],
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        if not data.get("ok"):
            print(f"  ⚠️  Error del servidor: {data.get('error', 'unknown')}", flush=True)
            return []
        content = data.get("content", "").strip()
        # Extraer JSON del contenido
        match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
        if match:
            content = match.group(1)
        arr_match = re.search(r'\[[\s\S]*\]', content)
        if arr_match:
            return json.loads(arr_match.group(0))
        return json.loads(content)
    except Exception as e:
        print(f"  ⚠️  Error: {str(e)[:80]}", flush=True)
        return []

def make_api_param(name, existing_params):
    param = re.sub(r'[^a-z0-9]', '_', name.lower().strip())
    param = re.sub(r'_+', '_', param).strip('_')[:128]
    base = param
    i = 1
    while param in existing_params:
        param = f"{base}_{i}"
        i += 1
    return param

# ─── Procesar cada categoría ──────────────────────────────────────────────────
categories = BATCH_CATEGORIES.get(BATCH, [])
if not categories:
    print(f"❌ Batch {BATCH} no válido."); sys.exit(1)

total_inserted = 0
total_skipped = 0

for cat_info in categories:
    category, count, examples = cat_info
    
    print(f"\n📦 Categoría: {category} (objetivo: {count})", flush=True)
    
    # Obtener ingredientes existentes en esta categoría
    cur.execute('SELECT LOWER("nameEs") as name FROM ingredients WHERE category = %s', (category,))
    cat_rows = cur.fetchall()
    existing_in_cat = set(r['name'] for r in cat_rows)
    
    inserted = 0
    attempts = 0
    max_attempts = (count // 10 + 1) * 5
    
    while inserted < count and attempts < max_attempts:
        attempts += 1
        remaining = min(15, count - inserted)
        
        names = get_ingredient_names(category, remaining, examples, existing_in_cat)
        
        if not names:
            print(f"  ⚠️  Sin nombres (intento {attempts})", flush=True)
            time.sleep(1)
            continue
        
        nutrition = NUTRITION_DEFAULTS.get(category, NUTRITION_DEFAULTS["otros"])
        
        for item in names:
            if not item.get('nameEs'):
                continue
            name_lower = item['nameEs'].lower().strip()
            if name_lower in existing_names or name_lower in existing_in_cat:
                total_skipped += 1
                continue
            
            api_param = make_api_param(item.get('apiParam') or name_lower, existing_params)
            
            try:
                cur.execute("""
                    INSERT INTO ingredients (
                        "apiParam", "nameEs", "nameEn", category,
                        "purchaseUnitType", "purchaseGramsPerUnit", "purchaseUnitSingular", "purchaseUnitPlural",
                        calories, proteins, carbohydrates, fats, "saturatedFats", fiber, sugars, sodium,
                        potassium, calcium, iron, "vitaminC",
                        "isVegan", "isVegetarian", "isGlutenFree", "isDairyFree",
                        "createdAt", "updatedAt"
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        %s, %s, %s, %s,
                        NOW(), NOW()
                    )
                """, (
                    api_param, item['nameEs'].strip(), (item.get('nameEn') or '').strip(), category,
                    nutrition['purchaseUnitType'], nutrition['purchaseGramsPerUnit'],
                    nutrition['purchaseUnitSingular'], nutrition['purchaseUnitPlural'],
                    nutrition['calories'], nutrition['proteins'], nutrition['carbohydrates'],
                    nutrition['fats'], nutrition['saturatedFats'], nutrition['fiber'],
                    nutrition['sugars'], nutrition['sodium'], nutrition['potassium'],
                    nutrition['calcium'], nutrition['iron'], nutrition['vitaminC'],
                    nutrition['isVegan'], nutrition['isVegetarian'],
                    nutrition['isGlutenFree'], nutrition['isDairyFree'],
                ))
                
                existing_names.add(name_lower)
                existing_in_cat.add(name_lower)
                existing_params.add(api_param)
                inserted += 1
                total_inserted += 1
                
                if total_inserted % 10 == 0:
                    print(f"  [{category}] {inserted}/{count} | Total nuevos: {total_inserted}", flush=True)
                    
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                total_skipped += 1
            except Exception as e:
                conn.rollback()
                print(f"  ⚠️  DB error: {str(e)[:60]}", flush=True)
                total_skipped += 1
        
        time.sleep(0.2)
    
    print(f"  ✅ {category}: {inserted}/{count} insertados", flush=True)

# ─── Resumen final ────────────────────────────────────────────────────────────
cur.execute('SELECT COUNT(*) as cnt FROM ingredients')
final_count = cur.fetchone()['cnt']
cur.execute('SELECT category, COUNT(*) as cnt FROM ingredients GROUP BY category ORDER BY cnt DESC LIMIT 20')
cat_summary = cur.fetchall()

print(f"\n🎉 BATCH {BATCH} COMPLETADO", flush=True)
print(f"   Nuevos insertados: {total_inserted}", flush=True)
print(f"   Omitidos (duplicados): {total_skipped}", flush=True)
print(f"   Total en BD: {final_count}", flush=True)
print("\nTop categorías:", flush=True)
for r in cat_summary:
    print(f"  {r['category']}: {r['cnt']}", flush=True)

cur.close()
conn.close()
