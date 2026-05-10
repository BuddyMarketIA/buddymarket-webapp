#!/usr/bin/env python3
"""
Script de generación masiva de ingredientes para BuddyMarket.
Usa datos nutricionales predefinidos por categoría y LLM solo para nombres.
Uso: python3 scripts/seed_ingredients_v2.py [batch_number 1-4]
"""

import os, sys, json, time, re, requests, psycopg2, psycopg2.extras
from datetime import datetime

BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 1
FORGE_API_URL = os.environ.get('BUILT_IN_FORGE_API_URL', '').rstrip('/')
FORGE_API_KEY = os.environ.get('BUILT_IN_FORGE_API_KEY', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')

print(f"🌱 BuddyMarket Ingredient Seeder v2 — Batch {BATCH}/4", flush=True)
if not FORGE_API_URL or not FORGE_API_KEY:
    print("❌ Faltan variables de entorno"); sys.exit(1)
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
        ("verduras", 60, "pak choi, bok choy, romanesco, mizuna, rúcula, radicchio, endivias, achicoria, colinabo, chirivía, salsifí, yuca, malanga, taro, ñame, jícama, brotes de bambú, coles de Bruselas, coliflor morada, brócoli chino, canónigos, berros, escarola, hinojo, remolacha, nabo, alcachofa, espárrago, apio, puerro, cebolleta, chalota, ajo tierno, ajo negro, ajo morado, daikon, wasabi fresco, mostaza verde, col china napa, col lombarda"),
        ("frutas", 60, "carambola, rambután, mangostán, lichi, pitahaya roja, pitahaya amarilla, maracuyá, guayaba, tamarindo, chirimoya, guanábana, papaya, jackfruit, salak, longan, kumquat, yuzu, bergamota, naranja sanguina, limón Meyer, lima kaffir, clementina, mandarina, tangerina, pomelo rojo, uva moscatel, uva tempranillo, mango Ataulfo, mango Alphonso, manzana Fuji, manzana Gala, pera Conference, cereza Picota, melocotón plano, nectarina blanca"),
        ("carnes", 50, "entrecot de ternera, chuletón de buey, solomillo de cerdo, lomo de cordero, costilla de ternera, falda de ternera, pecho de ternera, morcillo de ternera, ossobuco de ternera, carrillera de cerdo, mejilla de ternera, papada de cerdo, oreja de cerdo, rabo de toro, lengua de ternera, corazón de ternera, riñones de cordero, hígado de ternera, mollejas de ternera, callos de ternera, muslo de pato confitado, magret de pato, codorniz entera, perdiz estofada, faisán entero, jabalí, venado, conejo de monte, liebre, pichón"),
        ("pescados", 60, "lubina salvaje, dorada salvaje, rodaballo, lenguado, rape, bacalao fresco, abadejo, eglefino, gallineta, cabracho, san pedro, pez espada, atún rojo, bonito del norte, caballa, sardina, boquerón, arenque, espadín, trucha arcoíris, salmón atlántico, halibut, barramundi, mahi-mahi, pez limón, corvina, besugo, breca, salmonete, gamba blanca, gamba roja, langostino, cigala, nécora, buey de mar, centollo, bogavante, langosta, pulpo, calamar, sepia"),
        ("lacteos", 50, "leche entera, leche semidesnatada, leche desnatada, leche UHT, leche de cabra, leche de oveja, kéfir, yogur natural, yogur griego, skyr, bifidus, queso fresco, requesón, ricotta, mascarpone, mozzarella fresca, burrata, brie, camembert, roquefort, gorgonzola, stilton, manchego curado, manchego semicurado, ibérico, zamorano, roncal, idiazábal, queso de cabra, queso de oveja, queso azul, queso parmesano, queso gouda, queso edam, queso cheddar"),
        ("cereales", 50, "trigo blando, trigo duro, espelta, kamut, einkorn, emmer, centeno, cebada perlada, cebada integral, avena en copos, avena instantánea, maíz dulce, mijo, sorgo, teff, fonio, quinoa blanca, quinoa roja, quinoa negra, amaranto, trigo sarraceno, arroz blanco, arroz integral, arroz basmati, arroz jazmín, arroz arborio, arroz carnaroli, arroz bomba, arroz negro, arroz rojo, arroz salvaje"),
        ("panaderia", 40, "pan blanco de molde, pan integral de molde, pan de centeno, pan de espelta, pan de maíz, pan sin gluten, baguette, ciabatta, focaccia, pita, naan, chapati, tortilla de maíz, tortilla de trigo, pan árabe, pan de masa madre, brioche, croissant, pain au chocolat, muffin inglés, bagel, pretzel, pan de hamburguesa, pan de pita, pan de molde brioche, pan de molde multicereales"),
        ("embutidos_y_fiambres", 40, "jamón ibérico de bellota, jamón ibérico de cebo, jamón serrano, jamón york, jamón cocido, salchichón ibérico, chorizo ibérico, fuet, longaniza, morcilla de Burgos, morcilla de arroz, butifarra blanca, butifarra negra, sobrasada, lomo embuchado, cecina de vaca, bresaola, prosciutto di Parma, mortadela, salami Milano, salami Napoli, pepperoni, chorizo fresco, salchicha Frankfurt"),
        ("huevos", 20, "huevo de gallina campero, huevo de gallina ecológico, huevo de gallina de corral, huevo de codorniz, huevo de pato, huevo de oca, clara de huevo pasteurizada, yema de huevo pasteurizada, huevo líquido pasteurizado, huevo en polvo entero, huevo de perdiz, huevo de gallina de granja"),
        ("conservas", 40, "atún en aceite de oliva, atún al natural, sardinas en aceite, sardinas en tomate, anchoas en aceite, mejillones en escabeche, berberechos al natural, navajas al natural, almejas al natural, pulpo en aceite, calamar en su tinta, bonito del norte en aceite, tomate triturado, tomate entero pelado, pimientos del piquillo, espárragos blancos, alcachofas en aceite, judías verdes en conserva, guisantes en conserva, maíz dulce en conserva"),
    ],
    2: [
        ("legumbres", 60, "lentejas pardinas, lentejas verdes, lentejas rojas, lentejas beluga, lentejas puy, garbanzos castellanos, garbanzos pedrosillano, alubias blancas, alubias pintas, alubias negras, alubias rojas, alubias carillas, alubias azuki, alubias mungo, soja amarilla, soja negra, edamame, habas secas, guisantes secos, lupinos, frijoles negros, frijoles blancos, judías de Lima, judías borlotti, judías cannellini, Faba asturiana, lenteja coral, lenteja de Puy francesa"),
        ("frutos_secos", 60, "almendras crudas, almendras tostadas, almendras Marcona, nueces de Castilla, avellanas crudas, pistachos crudos, anacardos crudos, macadamia cruda, pecanas crudas, nueces de Brasil, piñones, castañas frescas, semillas de girasol, semillas de calabaza, semillas de sésamo blanco, semillas de sésamo negro, semillas de lino, semillas de chía, semillas de amapola, semillas de cáñamo, pasta de almendra, pasta de avellana, pasta de anacardo, nueces de macadamia tostadas, almendras garrapiñadas"),
        ("aceites", 40, "aceite de oliva virgen extra Arbequina, aceite de oliva virgen extra Picual, aceite de oliva virgen extra Hojiblanca, aceite de girasol alto oleico, aceite de maíz, aceite de soja, aceite de colza, aceite de coco virgen, aceite de aguacate, aceite de sésamo tostado, aceite de lino, aceite de cáñamo, aceite de nuez, aceite de almendra, aceite de argán alimentario, aceite de germen de trigo, aceite de arroz, aceite de pepitas de uva, aceite de trufa, aceite de mostaza"),
        ("especias", 80, "pimienta negra molida, pimienta blanca molida, pimienta verde en grano, pimienta rosa en grano, pimienta de Sichuan, pimienta de Jamaica, pimienta de Cayena, pimienta de Aleppo, pimentón dulce de La Vera, pimentón picante de La Vera, pimentón ahumado, cúrcuma molida, jengibre molido, canela de Ceilán, cardamomo verde, cardamomo negro, clavo molido, nuez moscada, macis, anís estrellado, comino molido, cilantro molido, fenogreco, mostaza en polvo, azafrán, vainilla en vaina, cacao en polvo, eneldo seco, estragón, laurel, romero, tomillo, orégano, albahaca, perejil, salvia, menta, sumac, za'atar, ras el hanout, garam masala, curry en polvo, harissa, berbere, dukkah, mezcla de especias cajún, mezcla de especias tex-mex, mezcla de especias marroquí, mezcla de especias griega, mezcla de especias italiana"),
        ("condimentos", 60, "salsa de soja oscura, salsa de soja clara, tamari sin gluten, miso blanco, miso rojo, miso negro, vinagre de manzana, vinagre de vino blanco, vinagre de vino tinto, vinagre de arroz, vinagre balsámico, vinagre de jerez, tahini tostado, pasta de cacahuete, pasta de almendra, harissa, sriracha, tabasco, salsa worcestershire, salsa de pescado, salsa de ostras, salsa hoisin, salsa teriyaki, pasta de curry rojo, pasta de curry verde, ketchup, mostaza de Dijon, mayonesa, alioli, tzatziki, hummus, baba ganoush, romesco, chimichurri, mojo rojo, mojo verde, pesto genovés, tapenade, salsa de mango, salsa de tamarindo"),
        ("bebidas", 40, "leche de almendra, leche de avena, leche de arroz, leche de coco, leche de soja, leche de cáñamo, leche de guisante, agua de coco natural, zumo de naranja natural, zumo de manzana natural, zumo de uva, zumo de piña, zumo de mango, zumo de zanahoria, zumo de remolacha, té verde matcha, té verde sencha, té negro Darjeeling, té negro Assam, té rojo pu-erh, té blanco, rooibos, manzanilla, tila, menta piperita, hibisco, café espresso, cacao puro, kombucha, kéfir de agua"),
        ("lacteos_alternativos", 40, "yogur de soja natural, yogur de coco natural, yogur de almendra natural, yogur de avena natural, queso vegano de anacardo, tofu firme natural, tofu sedoso natural, tofu firme ahumado, tofu firme marinado, tempeh de soja natural, tempeh de garbanzos, tempeh de lentejas, natto de soja, queso de almendra curado, crema de coco, nata de coco, mantequilla de coco, kéfir de coco, queso brie vegano, queso mozzarella vegana, queso parmesano vegano, queso crema vegano"),
        ("proteinas_vegetales", 60, "soja texturizada fina, soja texturizada gruesa, soja texturizada en trozos, soja texturizada en filetes, seitán natural, seitán ahumado, seitán marinado, seitán en filetes, seitán en tiras, tempeh de soja natural, tofu firme natural, tofu sedoso natural, tofu ahumado, proteína de guisante aislada, proteína de arroz, proteína de cáñamo, proteína de soja aislada, proteína de trigo, espirulina en polvo, chlorella en polvo, alga nori, alga wakame, alga kombu, alga dulse, alga hijiki, agar-agar, levadura nutricional"),
        ("suplementos", 40, "proteína de suero de leche concentrada, proteína de suero de leche aislada, caseína micelar, proteína vegana de guisante y arroz, creatina monohidrato, BCAA en polvo, glutamina en polvo, colágeno hidrolizado bovino, colágeno marino, gelatina en polvo, levadura nutricional con B12, germen de trigo, salvado de trigo, salvado de avena, psyllium en polvo, inulina en polvo, omega-3 de algas, vitamina D3, magnesio bisglicinato, zinc picolinato, hierro bisglicinato, calcio citrato, vitamina C en polvo, ashwagandha, rhodiola, maca, moringa en polvo, baobab en polvo, açaí en polvo, spirulina en tabletas"),
        ("hongos_setas", 40, "champiñón blanco fresco, champiñón portobello fresco, champiñón cremini fresco, shiitake fresco, shiitake seco, maitake fresco, enoki fresco, shimeji marrón, shimeji blanco, oyster gris, oyster rosa, king oyster fresco, nameko fresco, matsutake seco, porcini seco, boletus edulis fresco, rebozuelo fresco, cantarela seca, trompeta de la muerte seca, níscalo fresco, seta de cardo fresca, reishi seco, reishi en polvo, chaga en polvo, lion's mane fresco, cordyceps en polvo, turkey tail en polvo, trufa negra fresca"),
    ],
    3: [
        ("dulces", 60, "chocolate negro 70%, chocolate negro 85%, chocolate negro 90%, chocolate con leche 35%, chocolate blanco, cacao en polvo sin azúcar, nibs de cacao, pasta de cacao pura, confitura de fresa, confitura de frambuesa, confitura de arándanos, confitura de melocotón, confitura de albaricoque, confitura de naranja amarga, membrillo en pasta, miel de flores, miel de romero, miel de lavanda, miel de tomillo, miel de acacia, miel de azahar, miel de manuka, sirope de arce, sirope de agave, sirope de dátil, sirope de coco, azúcar moreno integral, azúcar de coco, panela, melaza de caña, caramelo líquido, toffee, nougat, turrones, mazapán"),
        ("edulcorantes", 30, "azúcar blanco refinado, azúcar glass, azúcar turbinado, azúcar demerara, azúcar muscovado, azúcar moreno, azúcar integral de caña, azúcar de coco, azúcar de dátil, xilitol, eritritol en polvo, estevia en polvo, estevia líquida, monk fruit en polvo, alulosa en polvo, tagatosa en polvo, trehalosa en polvo, inulina en polvo, sirope de agave claro, sirope de arce grado A, sirope de dátil, sirope de coco, sirope de arroz integral, sirope de yacón, miel de caña, miel de dátil"),
        ("snacks", 50, "chips de patata clásicos, chips de patata ondulados, chips de boniato, chips de remolacha, chips de zanahoria, chips de kale, chips de algas nori, chips de quinoa, chips de lentejas, chips de garbanzos, chips de maíz, palomitas de maíz naturales, nachos de maíz, tortillas chips, picos de pan, regañás, colines de sésamo, galletas saladas de trigo, crackers de arroz, crackers de quinoa, crackers de semillas, crackers de centeno, barritas de cereales, barritas de proteínas, barritas de frutos secos, almendras tostadas y saladas, mezcla de frutos secos, trail mix, gominolas de frutas, pretzels de sal"),
        ("preparados", 60, "caldo de pollo casero, caldo de carne casero, caldo de pescado casero, caldo de verduras casero, caldo de setas casero, caldo de miso, consomé de pollo, gazpacho andaluz, salmorejo cordobés, crema de calabaza, crema de zanahoria, crema de puerro, crema de espárragos, sopa de cebolla francesa, sopa de tomate, sopa de lentejas, sopa de guisantes, sopa instantánea de miso, ramen instantáneo, fideos instantáneos, arroz instantáneo cocido, quinoa instantánea, puré de patata instantáneo, copos de patata deshidratada, tomate seco en aceite, tomate seco sin aceite, pimiento seco, cebolla seca en escamas, ajo en polvo, zanahoria en polvo, remolacha en polvo, espinacas en polvo, brócoli en polvo, kale en polvo"),
        ("algas_marinas", 40, "alga nori tostada en hojas, alga nori cruda en hojas, alga wakame seca, alga wakame fresca, alga kombu seca, alga kombu fresca, alga dulse seca, alga dulse fresca, alga hijiki seca, alga arame seca, alga espagueti de mar seca, alga lechuga de mar seca, alga codium fresca, alga musgo de Irlanda seca, agar-agar en polvo, agar-agar en tiras, carragenina en polvo, alginato de sodio, espirulina en polvo, espirulina en tabletas, chlorella en polvo, chlorella en tabletas, klamath en polvo, fucoidán en polvo, alga nori en polvo, alga wakame en polvo"),
        ("frutas_secas_y_deshidratadas", 50, "pasas sultanas, pasas de Corinto, pasas de Málaga, orejones de albaricoque, orejones de melocotón, orejones de manzana, orejones de pera, ciruelas pasas de Agen, higos secos, dátiles Medjool, dátiles Deglet Nour, mango deshidratado, papaya deshidratada, piña deshidratada, coco deshidratado, plátano deshidratado, kiwi deshidratado, fresa deshidratada, frambuesa deshidratada, arándanos deshidratados, cerezas deshidratadas, arándanos rojos deshidratados, goji deshidratado, physalis deshidratado, camu camu deshidratado, açaí deshidratado, aronia deshidratada, hibisco deshidratado, tamarindo deshidratado, umeboshi"),
        ("otros", 60, "gelatina en hojas, gelatina en polvo, agar-agar en polvo, goma xantana, goma guar, goma arábiga, goma konjac, almidón de maíz, almidón de patata, almidón de tapioca, almidón de arroz, almidón de trigo, almidón de mandioca, almidón de arrurruz, pectina de manzana, pectina de cítricos, lecitina de soja, lecitina de girasol, levadura nutricional en copos, levadura de cerveza en copos, levadura fresca de panadería, levadura seca de panadería, levadura química, bicarbonato sódico, cremor tártaro, sal marina fina, sal marina gruesa, sal del Himalaya rosa, sal negra de Hawái, sal ahumada, sal de apio, sal de ajo, sal de cebolla, sal de hierbas, sal de trufa, sal de algas, sal de limón"),
        ("conservas", 50, "pepinillos en vinagre pequeños, pepinillos en vinagre grandes, cebollitas en vinagre, alcaparras en vinagre, alcaparrones en vinagre, aceitunas verdes sin hueso, aceitunas verdes con hueso, aceitunas negras sin hueso, aceitunas negras con hueso, aceitunas rellenas de anchoa, aceitunas rellenas de pimiento, aceitunas rellenas de almendra, aceitunas kalamata, aceitunas arbequinas, aceitunas hojiblanca, aceitunas manzanilla, aceitunas gordal, aceitunas picual, aceitunas cornicabra, aceitunas empeltre, aceitunas taggiasca, aceitunas niçoise, aceitunas castelvetrano, aceitunas cerignola, aceitunas gaeta, aceitunas lucques, aceitunas picholine"),
    ],
    4: [
        ("verduras", 50, "rábano daikon blanco, rábano daikon negro, rábano negro redondo, rábano rojo redondo, rábano picante fresco, wasabi fresco, mostaza verde, mostaza roja, col china napa, col lombarda, col blanca, col verde, col rizada kale, col rizada lacinato, col de Saboya, col de Milán, romanesco, coliflor blanca, coliflor morada, coliflor naranja, coliflor verde, brócoli verde, brócoli morado, brócoli chino, brócoli rabe, brotes de bambú frescos, brotes de soja, brotes de alfalfa, brotes de rábano, brotes de girasol, brotes de lentejas, brotes de garbanzos, brotes de trigo, brotes de brócoli"),
        ("frutas", 50, "mango Ataulfo, mango Tommy Atkins, mango Kent, mango Alphonso, manzana Golden Delicious, manzana Granny Smith, manzana Fuji, manzana Gala, manzana Braeburn, manzana Honeycrisp, manzana Pink Lady, pera Conference, pera Williams, pera Blanquilla, pera Limonera, pera Abate Fetel, cereza Picota, cereza Burlat, cereza Bing, cereza Rainier, melocotón amarillo, melocotón blanco, melocotón plano, nectarina amarilla, nectarina blanca, albaricoque Búlida, albaricoque Canino, ciruela claudia verde, ciruela claudia dorada, ciruela roja, ciruela negra"),
        ("carnes", 40, "entrecot de ternera gallega, chuletón de buey madurado, solomillo de ternera, lomo alto de vaca, costilla de ternera, falda de ternera, pecho de ternera, morcillo de ternera, ossobuco de ternera, carrillera de ternera, mejilla de ternera, papada de cerdo ibérico, oreja de cerdo, rabo de toro, lengua de ternera, corazón de ternera, riñones de ternera, hígado de ternera, mollejas de ternera, callos de ternera, patas de cerdo, codillo de cerdo, lacón de cerdo"),
        ("pescados", 50, "lubina salvaje del Mediterráneo, lubina de acuicultura, dorada salvaje del Mediterráneo, rodaballo salvaje del Atlántico, lenguado del Mediterráneo, rape del Atlántico, bacalao fresco del Atlántico, bacalao salado desalado, abadejo del Atlántico, gallineta del Atlántico, cabracho del Mediterráneo, pez espada del Mediterráneo, atún rojo del Mediterráneo, bonito del norte del Atlántico, caballa del Atlántico, sardina del Mediterráneo, boquerón del Mediterráneo, trucha arcoíris de acuicultura, salmón atlántico de acuicultura, salmón del Pacífico salvaje, halibut del Atlántico, corvina del Mediterráneo, besugo del Mediterráneo"),
        ("especias", 60, "pimienta negra Tellicherry, pimienta negra Malabar, pimienta blanca de Sarawak, pimienta verde de Madagascar, pimienta rosa de Brasil, pimienta de Sichuan roja, pimienta de Sichuan verde, pimienta de Jamaica entera, pimienta de Cayena molida, pimienta de Aleppo molida, pimentón dulce de La Vera DOP, pimentón picante de La Vera DOP, pimentón ahumado de La Vera DOP, cúrcuma de Alleppey, cúrcuma de Madras, jengibre de Jamaica, canela de Ceilán en rama, canela de Cassia en rama, cardamomo verde de Guatemala, cardamomo negro de la India, clavo de Zanzíbar, nuez moscada de Granada, anís estrellado de Vietnam, comino de Irán, comino negro de Egipto, cilantro de Marruecos, fenogreco de la India, mostaza amarilla de Canadá, azafrán de La Mancha DOP, vainilla de Madagascar, vainilla de Tahití, vainilla de México"),
        ("condimentos", 50, "salsa de soja Kikkoman, salsa de soja Yamasa, tamari San-J, miso blanco Hikari, miso rojo Marukome, miso negro Hatcho, vinagre de manzana Bragg, vinagre de vino blanco de Jerez, vinagre de vino tinto de Módena, vinagre de arroz Mizkan, vinagre balsámico de Módena IGP, tahini Al Wadi, pasta de cacahuete Whole Earth, pasta de almendra Meridian, harissa Mina, sriracha Huy Fong, tabasco rojo McIlhenny, salsa worcestershire Lea & Perrins, salsa de pescado Tiparos, salsa de ostras Lee Kum Kee, salsa hoisin Lee Kum Kee, salsa teriyaki Kikkoman, pasta de curry rojo Mae Ploy, pasta de curry verde Mae Ploy, ketchup Heinz, mostaza de Dijon Maille"),
        ("bebidas", 50, "café Blue Mountain de Jamaica, café Kona de Hawái, café Geisha de Panamá, café Yirgacheffe de Etiopía, café Sidamo de Etiopía, café Harrar de Etiopía, café Sumatra Mandheling, café Kenia AA, café Tanzania Peaberry, café Colombia Huila, té verde Gyokuro, té verde Kabusecha, té verde Fukamushi, té verde Bancha, té verde Kukicha, té verde Genmaicha, té verde Hojicha, té negro Darjeeling primera cosecha, té negro Assam TGFOP, té negro Nilgiri, té blanco Bai Hao Yinzhen, té blanco Bai Mu Dan, té oolong Tie Guan Yin, té pu-erh envejecido, rooibos verde, rooibos rojo, rooibos honeybush"),
        ("hongos_setas", 50, "champiñón blanco fresco pequeño, champiñón blanco fresco grande, champiñón portobello fresco, champiñón cremini fresco, shiitake fresco, shiitake seco, shiitake en polvo, maitake fresco, maitake seco, maitake en polvo, enoki fresco, shimeji marrón fresco, shimeji blanco fresco, oyster gris fresco, oyster rosa fresco, oyster amarillo fresco, king oyster fresco, nameko fresco, matsutake seco, porcini seco, porcini en polvo, boletus edulis fresco, boletus pinophilus fresco, rebozuelo fresco, rebozuelo seco, cantarela seca, trompeta de la muerte seca, níscalo fresco, seta de cardo fresca, reishi seco, reishi en polvo, chaga en polvo, lion's mane fresco, lion's mane en polvo, cordyceps militaris en polvo, turkey tail en polvo, trufa negra fresca"),
        ("suplementos", 20, "proteína de insecto de grillo en polvo, harina de grillo, colágeno de origen marino de bacalao, colágeno de origen marino de salmón, colágeno de origen bovino pasto, colágeno de origen bovino ecológico, colágeno de origen porcino, colágeno de origen aviar, colágeno de tipo I, colágeno de tipo II, colágeno de tipo III, gelatina de origen bovino, gelatina de origen porcino, gelatina de origen marino"),
        ("otros", 30, "gelatina en hojas sin sabor, gelatina en polvo sin sabor, agar-agar en polvo puro, goma xantana ecológica, goma guar ecológica, almidón de maíz ecológico, almidón de patata ecológico, almidón de tapioca ecológico, almidón de arrurruz ecológico, pectina de manzana ecológica, lecitina de soja ecológica, lecitina de girasol ecológica, levadura nutricional ecológica, levadura de cerveza ecológica, bicarbonato sódico alimentario, cremor tártaro ecológico, sal marina fina sin refinar, sal marina gruesa sin refinar, sal del Himalaya rosa fina, sal del Himalaya rosa gruesa"),
    ],
}

# ─── Función para llamar al LLM (solo nombres) ────────────────────────────────
def get_ingredient_names(category, count, examples, exclude_list):
    """Pide al LLM solo los nombres de ingredientes (nameEs, nameEn, apiParam)."""
    url = f"{FORGE_API_URL}/v1/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {FORGE_API_KEY}"}
    
    user_prompt = f"""Lista {count} ingredientes únicos de la categoría "{category}".
Ejemplos: {examples[:200]}
NO incluyas: {', '.join(list(exclude_list)[:15])}
Devuelve SOLO un array JSON con objetos que tengan: nameEs (nombre en español), nameEn (nombre en inglés), apiParam (identificador único en snake_case).
Ejemplo: [{{"nameEs":"Pak Choi","nameEn":"Pak Choi","apiParam":"pak_choi"}}]"""
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "Eres experto en alimentos. Devuelves SOLO arrays JSON válidos. Sin texto adicional."},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 1500,
    }
    
    for attempt in range(3):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()
            # Extraer JSON
            match = re.search(r'```(?:json)?\s*([\s\S]*?)```', content)
            if match:
                content = match.group(1)
            arr_match = re.search(r'\[[\s\S]*\]', content)
            if arr_match:
                return json.loads(arr_match.group(0))
            return json.loads(content)
        except Exception as e:
            print(f"  ⚠️  LLM error (intento {attempt+1}): {str(e)[:60]}", flush=True)
            time.sleep(2)
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
    max_attempts = (count // 10 + 1) * 4
    
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
                    print(f"  [{category}] {inserted}/{count} | Total: {total_inserted}", flush=True)
                    
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                total_skipped += 1
            except Exception as e:
                conn.rollback()
                print(f"  ⚠️  DB error: {str(e)[:60]}", flush=True)
                total_skipped += 1
        
        time.sleep(0.3)
    
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
