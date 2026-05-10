#!/usr/bin/env python3
"""
Script de generación masiva de ingredientes con IA para BuddyMarket.
Uso: python3 scripts/seed_ingredients.py [batch_number 1-4]
"""

import os
import sys
import json
import time
import re
import requests
import psycopg2
import psycopg2.extras
from datetime import datetime

BATCH = int(sys.argv[1]) if len(sys.argv) > 1 else 1
FORGE_API_URL = os.environ.get('BUILT_IN_FORGE_API_URL', '').rstrip('/')
FORGE_API_KEY = os.environ.get('BUILT_IN_FORGE_API_KEY', '')
DATABASE_URL = os.environ.get('DATABASE_URL', '')
CHUNK_SIZE = 5

print(f"🌱 BuddyMarket Ingredient Seeder — Batch {BATCH}/4")
if not FORGE_API_URL or not FORGE_API_KEY:
    print("❌ Faltan BUILT_IN_FORGE_API_URL o BUILT_IN_FORGE_API_KEY"); sys.exit(1)
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
print(f"📋 Ingredientes existentes: {len(existing_names)}\n")

# ─── Categorías por batch ─────────────────────────────────────────────────────
BATCH_CATEGORIES = {
    1: [
        {"category": "verduras", "count": 60, "examples": "pak choi, bok choy, romanesco, mizuna, rúcula, radicchio, endivias, achicoria, colinabo, chirivía, salsifí, yuca, malanga, taro, ñame, jícama, brotes de bambú, coles de Bruselas, coliflor morada, brócoli chino, canónigos, berros, escarola, hinojo, remolacha, nabo, alcachofa, espárrago, apio, puerro, cebolleta, chalota, ajo tierno, ajo negro, ajo morado"},
        {"category": "frutas", "count": 60, "examples": "carambola, rambután, mangostán, lichi, pitahaya roja, pitahaya amarilla, maracuyá, guayaba, tamarindo, chirimoya, guanábana, papaya, jackfruit, salak, longan, kumquat, yuzu, bergamota, naranja sanguina, limón Meyer, lima kaffir, clementina, mandarina, tangerina, pomelo rojo, uva moscatel, uva tempranillo, uva garnacha"},
        {"category": "carnes", "count": 50, "examples": "entrecot de ternera, chuletón de buey, solomillo de cerdo, lomo de cordero, costilla de ternera, falda de ternera, pecho de ternera, morcillo de ternera, ossobuco de ternera, carrillera de cerdo, mejilla de ternera, papada de cerdo, oreja de cerdo, rabo de toro, lengua de ternera, corazón de ternera, riñones de cordero, hígado de ternera, mollejas de ternera, callos de ternera"},
        {"category": "pescados", "count": 60, "examples": "lubina salvaje, dorada salvaje, rodaballo, lenguado, rape, bacalao fresco, abadejo, eglefino, gallineta, cabracho, san pedro, pez espada, atún rojo, bonito del norte, caballa, sardina, boquerón, arenque, espadín, trucha arcoíris, salmón atlántico, halibut, barramundi, mahi-mahi, pez limón, corvina, besugo"},
        {"category": "lacteos", "count": 50, "examples": "leche entera, leche semidesnatada, leche desnatada, leche UHT, leche de cabra, leche de oveja, kéfir, yogur natural, yogur griego, skyr, bifidus, queso fresco, requesón, ricotta, mascarpone, mozzarella fresca, burrata, brie, camembert, roquefort, gorgonzola, stilton, manchego curado, manchego semicurado, ibérico, zamorano, roncal, idiazábal"},
        {"category": "cereales", "count": 50, "examples": "trigo blando, trigo duro, espelta, kamut, einkorn, emmer, centeno, cebada perlada, cebada integral, avena en copos, avena instantánea, maíz dulce, mijo, sorgo, teff, fonio, quinoa blanca, quinoa roja, quinoa negra, amaranto, trigo sarraceno, arroz blanco, arroz integral, arroz basmati, arroz jazmín, arroz arborio, arroz carnaroli, arroz bomba"},
        {"category": "panaderia", "count": 40, "examples": "pan blanco de molde, pan integral de molde, pan de centeno, pan de espelta, pan de maíz, pan sin gluten, baguette, ciabatta, focaccia, pita, naan, chapati, tortilla de maíz, tortilla de trigo, pan árabe, pan de masa madre, brioche, croissant, pain au chocolat, muffin inglés, bagel, pretzel, pan de hamburguesa"},
        {"category": "embutidos_y_fiambres", "count": 40, "examples": "jamón ibérico de bellota, jamón ibérico de cebo, jamón serrano, jamón york, jamón cocido, salchichón ibérico, chorizo ibérico, fuet, longaniza, morcilla de Burgos, morcilla de arroz, butifarra blanca, butifarra negra, sobrasada, lomo embuchado, cecina de vaca, bresaola, prosciutto di Parma, mortadela, salami Milano"},
        {"category": "huevos", "count": 20, "examples": "huevo de gallina campero, huevo de gallina ecológico, huevo de gallina de corral, huevo de codorniz, huevo de pato, huevo de oca, clara de huevo pasteurizada, yema de huevo pasteurizada, huevo líquido pasteurizado, huevo en polvo entero"},
        {"category": "conservas", "count": 40, "examples": "atún en aceite de oliva, atún al natural, sardinas en aceite, sardinas en tomate, anchoas en aceite, mejillones en escabeche, berberechos al natural, navajas al natural, almejas al natural, pulpo en aceite, calamar en su tinta, bonito del norte en aceite, tomate triturado, tomate entero pelado, pimientos del piquillo, espárragos blancos"},
    ],
    2: [
        {"category": "legumbres", "count": 60, "examples": "lentejas pardinas, lentejas verdes, lentejas rojas, lentejas beluga, lentejas puy, garbanzos castellanos, garbanzos pedrosillano, alubias blancas, alubias pintas, alubias negras, alubias rojas, alubias carillas, alubias azuki, alubias mungo, soja amarilla, soja negra, edamame, habas secas, guisantes secos, lupinos, frijoles negros, frijoles blancos, judías de Lima, judías borlotti, judías cannellini, Faba asturiana"},
        {"category": "frutos_secos", "count": 60, "examples": "almendras crudas, almendras tostadas, almendras Marcona, nueces de Castilla, avellanas crudas, pistachos crudos, anacardos crudos, macadamia cruda, pecanas crudas, nueces de Brasil, piñones, castañas frescas, semillas de girasol, semillas de calabaza, semillas de sésamo blanco, semillas de sésamo negro, semillas de lino, semillas de chía, semillas de amapola, semillas de cáñamo, pasta de almendra, pasta de avellana, pasta de anacardo"},
        {"category": "aceites", "count": 40, "examples": "aceite de oliva virgen extra Arbequina, aceite de oliva virgen extra Picual, aceite de oliva virgen extra Hojiblanca, aceite de girasol alto oleico, aceite de maíz, aceite de soja, aceite de colza, aceite de coco virgen, aceite de aguacate, aceite de sésamo tostado, aceite de lino, aceite de cáñamo, aceite de nuez, aceite de almendra, aceite de argán alimentario, aceite de germen de trigo, aceite de arroz, aceite de pepitas de uva"},
        {"category": "especias", "count": 80, "examples": "pimienta negra molida, pimienta blanca molida, pimienta verde en grano, pimienta rosa en grano, pimienta de Sichuan, pimienta de Jamaica, pimienta de Cayena, pimienta de Aleppo, pimentón dulce de La Vera, pimentón picante de La Vera, pimentón ahumado, cúrcuma molida, jengibre molido, canela de Ceilán, cardamomo verde, cardamomo negro, clavo molido, nuez moscada, macis, anís estrellado, comino molido, cilantro molido, fenogreco, mostaza en polvo, azafrán, vainilla en vaina, cacao en polvo, eneldo seco, estragón, laurel, romero, tomillo, orégano, albahaca, perejil, salvia, menta, sumac, za'atar, ras el hanout, garam masala, curry en polvo, harissa, berbere, dukkah"},
        {"category": "condimentos", "count": 60, "examples": "salsa de soja oscura, salsa de soja clara, tamari sin gluten, miso blanco, miso rojo, miso negro, vinagre de manzana, vinagre de vino blanco, vinagre de vino tinto, vinagre de arroz, vinagre balsámico, vinagre de jerez, tahini tostado, pasta de cacahuete, pasta de almendra, harissa, sriracha, tabasco, salsa worcestershire, salsa de pescado, salsa de ostras, salsa hoisin, salsa teriyaki, pasta de curry rojo, pasta de curry verde, ketchup, mostaza de Dijon, mayonesa, alioli, tzatziki, hummus, baba ganoush, romesco, chimichurri, mojo rojo, mojo verde, pesto genovés, tapenade"},
        {"category": "bebidas", "count": 40, "examples": "leche de almendra, leche de avena, leche de arroz, leche de coco, leche de soja, leche de cáñamo, leche de guisante, agua de coco natural, zumo de naranja natural, zumo de manzana natural, zumo de uva, zumo de piña, zumo de mango, zumo de zanahoria, zumo de remolacha, té verde matcha, té verde sencha, té negro Darjeeling, té negro Assam, té rojo pu-erh, té blanco, rooibos, manzanilla, tila, menta piperita, hibisco, café espresso, café americano, cacao puro, kombucha"},
        {"category": "lacteos_alternativos", "count": 40, "examples": "yogur de soja natural, yogur de coco natural, yogur de almendra natural, yogur de avena natural, queso vegano de anacardo, tofu firme natural, tofu sedoso natural, tofu firme ahumado, tofu firme marinado, tempeh de soja natural, tempeh de garbanzos, tempeh de lentejas, natto de soja, queso de almendra curado, crema de coco, nata de coco, mantequilla de coco, kéfir de coco, queso brie vegano, queso mozzarella vegana, queso parmesano vegano, queso crema vegano"},
        {"category": "proteinas_vegetales", "count": 60, "examples": "soja texturizada fina, soja texturizada gruesa, soja texturizada en trozos, soja texturizada en filetes, seitán natural, seitán ahumado, seitán marinado, seitán en filetes, seitán en tiras, tempeh de soja natural, tofu firme natural, tofu sedoso natural, tofu ahumado, proteína de guisante aislada, proteína de arroz, proteína de cáñamo, proteína de soja aislada, proteína de trigo, espirulina en polvo, chlorella en polvo, alga nori, alga wakame, alga kombu, alga dulse, alga hijiki, agar-agar, levadura nutricional"},
        {"category": "suplementos", "count": 40, "examples": "proteína de suero de leche concentrada, proteína de suero de leche aislada, caseína micelar, proteína vegana de guisante y arroz, creatina monohidrato, BCAA en polvo, glutamina en polvo, colágeno hidrolizado bovino, colágeno marino, gelatina en polvo, levadura nutricional con B12, germen de trigo, salvado de trigo, salvado de avena, psyllium en polvo, inulina en polvo, omega-3 de algas, vitamina D3, magnesio bisglicinato, zinc picolinato, hierro bisglicinato, calcio citrato, vitamina C en polvo, vitamina B12, ashwagandha, rhodiola, maca, moringa en polvo, baobab en polvo, açaí en polvo"},
        {"category": "hongos_setas", "count": 40, "examples": "champiñón blanco fresco, champiñón portobello fresco, champiñón cremini fresco, shiitake fresco, shiitake seco, maitake fresco, enoki fresco, shimeji marrón, shimeji blanco, oyster gris, oyster rosa, king oyster fresco, nameko fresco, matsutake seco, porcini seco, boletus edulis fresco, rebozuelo fresco, cantarela seca, trompeta de la muerte seca, níscalo fresco, seta de cardo fresca, reishi seco, reishi en polvo, chaga en polvo, lion's mane fresco, cordyceps en polvo, turkey tail en polvo, trufa negra fresca"},
    ],
    3: [
        {"category": "dulces", "count": 60, "examples": "chocolate negro 70%, chocolate negro 85%, chocolate negro 90%, chocolate con leche 35%, chocolate blanco, chocolate rubio caramelizado, cacao en polvo sin azúcar, nibs de cacao, pasta de cacao pura, manteca de cacao, confitura de fresa, confitura de frambuesa, confitura de arándanos, confitura de melocotón, confitura de albaricoque, confitura de naranja amarga, membrillo en pasta, miel de flores, miel de romero, miel de lavanda, miel de tomillo, miel de acacia, miel de azahar, miel de manuka, sirope de arce, sirope de agave, sirope de dátil, sirope de coco, azúcar moreno integral, azúcar de coco, panela, melaza de caña, caramelo líquido, toffee, nougat, turrones, mazapán"},
        {"category": "edulcorantes", "count": 30, "examples": "azúcar blanco refinado, azúcar glass, azúcar turbinado, azúcar demerara, azúcar muscovado, azúcar moreno, azúcar integral de caña, azúcar de coco, azúcar de dátil, xilitol, eritritol en polvo, estevia en polvo, estevia líquida, monk fruit en polvo, alulosa en polvo, tagatosa en polvo, trehalosa en polvo, inulina en polvo, sacarina, aspartamo, acesulfamo K, sucralosa, sirope de agave claro, sirope de arce grado A, sirope de dátil, sirope de coco, sirope de arroz integral, sirope de yacón, miel de caña, miel de dátil"},
        {"category": "snacks", "count": 50, "examples": "chips de patata clásicos, chips de patata ondulados, chips de boniato, chips de remolacha, chips de zanahoria, chips de kale, chips de algas nori, chips de quinoa, chips de lentejas, chips de garbanzos, chips de maíz, palomitas de maíz naturales, nachos de maíz, tortillas chips, picos de pan, regañás, colines de sésamo, galletas saladas de trigo, crackers de arroz, crackers de quinoa, crackers de semillas, crackers de centeno, barritas de cereales, barritas de proteínas, barritas de frutos secos, almendras tostadas y saladas, mezcla de frutos secos, trail mix, gominolas de frutas, pretzels de sal"},
        {"category": "preparados", "count": 60, "examples": "caldo de pollo casero, caldo de carne casero, caldo de pescado casero, caldo de verduras casero, caldo de setas casero, caldo de miso, consomé de pollo, gazpacho andaluz, salmorejo cordobés, crema de calabaza, crema de zanahoria, crema de puerro, crema de espárragos, sopa de cebolla francesa, sopa de tomate, sopa de lentejas, sopa de guisantes, sopa instantánea de miso, ramen instantáneo, fideos instantáneos, arroz instantáneo cocido, quinoa instantánea, puré de patata instantáneo, copos de patata deshidratada, tomate seco en aceite, tomate seco sin aceite, pimiento seco, cebolla seca en escamas, ajo en polvo, zanahoria en polvo, remolacha en polvo, espinacas en polvo, brócoli en polvo, kale en polvo, moringa en polvo, baobab en polvo"},
        {"category": "algas_marinas", "count": 40, "examples": "alga nori tostada en hojas, alga nori cruda en hojas, alga wakame seca, alga wakame fresca, alga kombu seca, alga kombu fresca, alga dulse seca, alga dulse fresca, alga hijiki seca, alga arame seca, alga espagueti de mar seca, alga lechuga de mar seca, alga codium fresca, alga musgo de Irlanda seca, agar-agar en polvo, agar-agar en tiras, carragenina en polvo, alginato de sodio, espirulina en polvo, espirulina en tabletas, chlorella en polvo, chlorella en tabletas, klamath en polvo, fucoidán en polvo, alga nori en polvo, alga wakame en polvo, alga kombu en polvo"},
        {"category": "frutas_secas_y_deshidratadas", "count": 50, "examples": "pasas sultanas, pasas de Corinto, pasas de Málaga, orejones de albaricoque, orejones de melocotón, orejones de manzana, orejones de pera, ciruelas pasas de Agen, higos secos, dátiles Medjool, dátiles Deglet Nour, mango deshidratado, papaya deshidratada, piña deshidratada, coco deshidratado, plátano deshidratado, kiwi deshidratado, fresa deshidratada, frambuesa deshidratada, arándanos deshidratados, cerezas deshidratadas, arándanos rojos deshidratados, goji deshidratado, physalis deshidratado, camu camu deshidratado, açaí deshidratado, aronia deshidratada, hibisco deshidratado, tamarindo deshidratado, umeboshi"},
        {"category": "otros", "count": 60, "examples": "gelatina en hojas, gelatina en polvo, agar-agar en polvo, goma xantana, goma guar, goma arábiga, goma konjac, almidón de maíz, almidón de patata, almidón de tapioca, almidón de arroz, almidón de trigo, almidón de mandioca, almidón de arrurruz, pectina de manzana, pectina de cítricos, lecitina de soja, lecitina de girasol, levadura nutricional en copos, levadura de cerveza en copos, levadura fresca de panadería, levadura seca de panadería, levadura química, bicarbonato sódico, cremor tártaro, sal marina fina, sal marina gruesa, sal del Himalaya rosa, sal negra de Hawái, sal ahumada, sal de apio, sal de ajo, sal de cebolla, sal de hierbas, sal de trufa, sal de algas, sal de limón"},
        {"category": "conservas", "count": 50, "examples": "pepinillos en vinagre pequeños, pepinillos en vinagre grandes, cebollitas en vinagre, alcaparras en vinagre, alcaparrones en vinagre, aceitunas verdes sin hueso, aceitunas verdes con hueso, aceitunas negras sin hueso, aceitunas negras con hueso, aceitunas rellenas de anchoa, aceitunas rellenas de pimiento, aceitunas rellenas de almendra, aceitunas kalamata, aceitunas arbequinas, aceitunas hojiblanca, aceitunas manzanilla, aceitunas gordal, aceitunas picual, aceitunas cornicabra, aceitunas empeltre, aceitunas taggiasca, aceitunas niçoise, aceitunas castelvetrano, aceitunas cerignola, aceitunas gaeta, aceitunas lucques, aceitunas picholine"},
    ],
    4: [
        {"category": "verduras", "count": 60, "examples": "rábano daikon blanco, rábano daikon negro, rábano negro redondo, rábano rojo redondo, rábano picante fresco, wasabi fresco, mostaza verde, mostaza roja, col china napa, col lombarda, col blanca, col verde, col rizada kale, col rizada lacinato, col de Saboya, col de Milán, romanesco, coliflor blanca, coliflor morada, coliflor naranja, coliflor verde, brócoli verde, brócoli morado, brócoli chino, brócoli rabe, brotes de bambú frescos, brotes de soja, brotes de alfalfa, brotes de rábano, brotes de girasol, brotes de lentejas, brotes de garbanzos, brotes de trigo, brotes de brócoli"},
        {"category": "frutas", "count": 60, "examples": "mango Ataulfo, mango Tommy Atkins, mango Kent, mango Alphonso, manzana Golden Delicious, manzana Granny Smith, manzana Fuji, manzana Gala, manzana Braeburn, manzana Honeycrisp, manzana Pink Lady, pera Conference, pera Williams, pera Blanquilla, pera Limonera, pera Abate Fetel, pera Bosc, cereza Picota, cereza Burlat, cereza Bing, cereza Rainier, cereza Lapins, melocotón amarillo, melocotón blanco, melocotón plano, nectarina amarilla, nectarina blanca, albaricoque Búlida, albaricoque Canino, ciruela claudia verde, ciruela claudia dorada, ciruela roja, ciruela negra"},
        {"category": "carnes", "count": 50, "examples": "entrecot de ternera gallega, chuletón de buey madurado, solomillo de ternera, lomo alto de vaca, costilla de ternera, falda de ternera, pecho de ternera, morcillo de ternera, ossobuco de ternera, carrillera de ternera, mejilla de ternera, papada de cerdo ibérico, oreja de cerdo, rabo de toro, lengua de ternera, corazón de ternera, riñones de ternera, hígado de ternera, mollejas de ternera, callos de ternera, patas de cerdo, codillo de cerdo, lacón de cerdo, muslo de pato confitado, magret de pato, confit de pato, foie gras de pato, codorniz entera, perdiz estofada, faisán entero, jabalí en ragú, venado en ragú, conejo de monte, liebre en ragú, pichón asado"},
        {"category": "pescados", "count": 60, "examples": "lubina salvaje del Mediterráneo, lubina de acuicultura, dorada salvaje del Mediterráneo, rodaballo salvaje del Atlántico, lenguado del Mediterráneo, rape del Atlántico, bacalao fresco del Atlántico, bacalao salado desalado, abadejo del Atlántico, gallineta del Atlántico, cabracho del Mediterráneo, pez espada del Mediterráneo, atún rojo del Mediterráneo, bonito del norte del Atlántico, caballa del Atlántico, sardina del Mediterráneo, boquerón del Mediterráneo, trucha arcoíris de acuicultura, salmón atlántico de acuicultura, salmón del Pacífico salvaje, halibut del Atlántico, barramundi de acuicultura, mahi-mahi del Pacífico, corvina del Mediterráneo, besugo del Mediterráneo, breca del Mediterráneo, salmonete del Mediterráneo, gamba blanca de Huelva, gamba roja de Denia, langostino de Sanlúcar, cigala del Atlántico, nécora del Atlántico, buey de mar del Atlántico, centollo del Atlántico, bogavante del Atlántico, langosta del Mediterráneo, pulpo del Mediterráneo, calamar del Mediterráneo, sepia del Mediterráneo"},
        {"category": "especias", "count": 60, "examples": "pimienta negra Tellicherry, pimienta negra Malabar, pimienta blanca de Sarawak, pimienta verde de Madagascar, pimienta rosa de Brasil, pimienta de Sichuan roja, pimienta de Sichuan verde, pimienta de Jamaica entera, pimienta de Cayena molida, pimienta de Aleppo molida, pimentón dulce de La Vera DOP, pimentón picante de La Vera DOP, pimentón ahumado de La Vera DOP, cúrcuma de Alleppey, cúrcuma de Madras, jengibre de Jamaica, canela de Ceilán en rama, canela de Cassia en rama, cardamomo verde de Guatemala, cardamomo negro de la India, clavo de Zanzíbar, nuez moscada de Granada, macis de Granada, anís estrellado de Vietnam, anís verde de España, comino de Irán, comino negro de Egipto, cilantro de Marruecos, fenogreco de la India, mostaza amarilla de Canadá, azafrán de La Mancha DOP, azafrán de Irán, vainilla de Madagascar, vainilla de Tahití, vainilla de México, sumac sirio, za'atar libanés, ras el hanout marroquí, garam masala indio, curry Madras, curry Korma, harissa tunecina, berbere etíope, dukkah egipcio"},
        {"category": "condimentos", "count": 50, "examples": "salsa de soja Kikkoman, salsa de soja Yamasa, tamari San-J, miso blanco Hikari, miso rojo Marukome, miso negro Hatcho, vinagre de manzana Bragg, vinagre de vino blanco de Jerez, vinagre de vino tinto de Módena, vinagre de arroz Mizkan, vinagre balsámico de Módena IGP, tahini Al Wadi, pasta de cacahuete Whole Earth, pasta de almendra Meridian, harissa Mina, sriracha Huy Fong, tabasco rojo McIlhenny, salsa worcestershire Lea & Perrins, salsa de pescado Tiparos, salsa de ostras Lee Kum Kee, salsa hoisin Lee Kum Kee, salsa teriyaki Kikkoman, pasta de curry rojo Mae Ploy, pasta de curry verde Mae Ploy, ketchup Heinz, mostaza de Dijon Maille, mayonesa Hellmann's, alioli casero, tzatziki casero, hummus casero, baba ganoush casero, romesco casero, chimichurri casero, mojo rojo canario casero, mojo verde canario casero"},
        {"category": "bebidas", "count": 50, "examples": "café Blue Mountain de Jamaica, café Kona de Hawái, café Geisha de Panamá, café Yirgacheffe de Etiopía, café Sidamo de Etiopía, café Harrar de Etiopía, café Sumatra Mandheling, café Kenia AA, café Tanzania Peaberry, café Colombia Huila, café Colombia Nariño, café Brasil Santos, té verde Gyokuro, té verde Kabusecha, té verde Fukamushi, té verde Bancha, té verde Kukicha, té verde Genmaicha, té verde Hojicha, té negro Darjeeling primera cosecha, té negro Assam TGFOP, té negro Nilgiri, té negro Dimbula, té blanco Bai Hao Yinzhen, té blanco Bai Mu Dan, té oolong Tie Guan Yin, té pu-erh envejecido, rooibos verde, rooibos rojo, rooibos honeybush"},
        {"category": "hongos_setas", "count": 50, "examples": "champiñón blanco fresco pequeño, champiñón blanco fresco grande, champiñón portobello fresco, champiñón cremini fresco, shiitake fresco, shiitake seco, shiitake en polvo, maitake fresco, maitake seco, maitake en polvo, enoki fresco, shimeji marrón fresco, shimeji blanco fresco, oyster gris fresco, oyster rosa fresco, oyster amarillo fresco, king oyster fresco, nameko fresco, matsutake seco, porcini seco, porcini en polvo, boletus edulis fresco, boletus pinophilus fresco, rebozuelo fresco, rebozuelo seco, cantarela seca, trompeta de la muerte seca, níscalo fresco, seta de cardo fresca, reishi seco, reishi en polvo, reishi en extracto, chaga en polvo, chaga en extracto, lion's mane fresco, lion's mane en polvo, cordyceps militaris en polvo, turkey tail en polvo, trufa negra fresca, trufa negra conservada, trufa de verano fresca"},
        {"category": "suplementos", "count": 20, "examples": "proteína de insecto de grillo en polvo, harina de grillo, proteína de langosta en polvo, proteína de saltamontes en polvo, proteína de gusano de la harina en polvo, colágeno de origen marino de bacalao, colágeno de origen marino de salmón, colágeno de origen bovino pasto, colágeno de origen bovino ecológico, colágeno de origen porcino, colágeno de origen aviar, colágeno de tipo I, colágeno de tipo II, colágeno de tipo III, colágeno de tipo IV, colágeno de tipo V, colágeno de tipo X, gelatina de origen bovino, gelatina de origen porcino, gelatina de origen marino"},
    ],
}

categories = BATCH_CATEGORIES.get(BATCH)
if not categories:
    print(f"❌ Batch {BATCH} no válido."); sys.exit(1)

# ─── Función para llamar al LLM ───────────────────────────────────────────────
SYSTEM_PROMPT = """Eres un experto en nutrición y base de datos de alimentos. Generas datos nutricionales precisos basados en USDA FoodData Central, BEDCA, CIQUAL.
SIEMPRE devuelves un array JSON válido y completo. Cada objeto tiene EXACTAMENTE estos campos:
nameEs, nameEn, apiParam, category, purchaseUnitType, purchaseGramsPerUnit, purchaseUnitSingular, purchaseUnitPlural, calories, proteins, carbohydrates, fats, saturatedFats, fiber, sugars, sodium, potassium, calcium, iron, vitaminC, isVegan, isVegetarian, isGlutenFree, isDairyFree.
Devuelve SOLO el array JSON, sin texto adicional, sin markdown, sin explicaciones."""

def call_llm(user_prompt, retries=3):
    url = f"{FORGE_API_URL}/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {FORGE_API_KEY}",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 2000,
    }
    for attempt in range(retries):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=120)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        except requests.exceptions.Timeout:
            print(f"\n  ⏱️  Timeout en intento {attempt+1}/{retries}")
            time.sleep(3)
        except Exception as e:
            print(f"\n  ❌ LLM error (intento {attempt+1}/{retries}): {str(e)[:100]}")
            time.sleep(3)
    return None

def parse_ingredients(content):
    if not content:
        return []
    # Extraer JSON del contenido
    json_str = content.strip()
    # Eliminar markdown code blocks
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', json_str)
    if match:
        json_str = match.group(1)
    # Intentar parsear directamente
    try:
        parsed = json.loads(json_str.strip())
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict) and 'ingredients' in parsed:
            return parsed['ingredients']
        return []
    except json.JSONDecodeError:
        # Intentar extraer array JSON
        arr_match = re.search(r'\[\s*\{[\s\S]*\}\s*\]', json_str)
        if arr_match:
            try:
                return json.loads(arr_match.group(0))
            except:
                return []
        return []

def make_api_param(name, existing_params):
    """Genera un apiParam único a partir del nombre."""
    param = re.sub(r'[^a-z0-9]', '_', name.lower().strip())
    param = re.sub(r'_+', '_', param).strip('_')[:128]
    if param in existing_params:
        param = f"{param}_{int(time.time()) % 100000}"
    return param

# ─── Procesar cada categoría ──────────────────────────────────────────────────
total_inserted = 0
total_skipped = 0

for cat_info in categories:
    category = cat_info['category']
    count = cat_info['count']
    examples = cat_info['examples']
    
    print(f"\n📦 Categoría: {category} (objetivo: {count})")
    
    # Obtener ingredientes existentes en esta categoría
    cur.execute('SELECT LOWER("nameEs") as name FROM ingredients WHERE category = %s', (category,))
    cat_rows = cur.fetchall()
    existing_in_cat = set(r['name'] for r in cat_rows)
    
    inserted = 0
    attempts = 0
    max_attempts = (count // CHUNK_SIZE + 1) * 3
    
    while inserted < count and attempts < max_attempts:
        attempts += 1
        remaining = min(CHUNK_SIZE, count - inserted)
        
        # Tomar muestra de ejemplos
        example_list = ', '.join(examples.split(', ')[:15])
        
        # Lista de ingredientes a excluir (muestra de los existentes)
        exclude_list = ', '.join(list(existing_in_cat)[:20])
        
        user_prompt = f"""Genera exactamente {remaining} ingredientes alimentarios únicos de la categoría "{category}".

Ejemplos del tipo de ingredientes: {example_list}

NO incluyas estos ingredientes ya existentes: {exclude_list}

Genera {remaining} ingredientes únicos, específicos y variados. Devuelve SOLO el array JSON."""
        
        content = call_llm(user_prompt)
        if not content:
            print(f"\n  ⚠️  No se obtuvo respuesta del LLM (intento {attempts})")
            time.sleep(2)
            continue
        
        new_ingredients = parse_ingredients(content)
        
        if not new_ingredients:
            print(f"\n  ⚠️  No se pudieron parsear ingredientes (intento {attempts})")
            time.sleep(1)
            continue
        
        for ing in new_ingredients:
            if not ing.get('nameEs'):
                continue
            name_lower = ing['nameEs'].lower().strip()
            if name_lower in existing_names or name_lower in existing_in_cat:
                total_skipped += 1
                continue
            
            api_param = make_api_param(ing.get('apiParam', name_lower), existing_params)
            
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
                    api_param, ing['nameEs'].strip(), (ing.get('nameEn') or '').strip(), category,
                    ing.get('purchaseUnitType') or 'weight', ing.get('purchaseGramsPerUnit') or 100,
                    ing.get('purchaseUnitSingular') or 'gramo', ing.get('purchaseUnitPlural') or 'gramos',
                    float(ing.get('calories') or 0), float(ing.get('proteins') or 0),
                    float(ing.get('carbohydrates') or 0), float(ing.get('fats') or 0),
                    float(ing.get('saturatedFats') or 0), float(ing.get('fiber') or 0),
                    float(ing.get('sugars') or 0), float(ing.get('sodium') or 0),
                    float(ing.get('potassium') or 0), float(ing.get('calcium') or 0),
                    float(ing.get('iron') or 0), float(ing.get('vitaminC') or 0),
                    bool(ing.get('isVegan', False)), bool(ing.get('isVegetarian', False)),
                    bool(ing.get('isGlutenFree', False)), bool(ing.get('isDairyFree', False)),
                ))
                
                existing_names.add(name_lower)
                existing_in_cat.add(name_lower)
                existing_params.add(api_param)
                inserted += 1
                total_inserted += 1
                
                if total_inserted % 10 == 0:
                    print(f"\r  [{category}] {inserted}/{count} | Total nuevos: {total_inserted}   ", end='', flush=True)
                    
            except psycopg2.errors.UniqueViolation:
                conn.rollback()
                total_skipped += 1
            except Exception as e:
                conn.rollback()
                print(f"\n  ⚠️  DB error: {str(e)[:80]}")
                total_skipped += 1
        
        time.sleep(0.5)
    
    print(f"\n  ✅ {category}: {inserted}/{count} insertados")

# ─── Resumen final ────────────────────────────────────────────────────────────
cur.execute('SELECT COUNT(*) as cnt FROM ingredients')
final_count = cur.fetchone()['cnt']
cur.execute('SELECT category, COUNT(*) as cnt FROM ingredients GROUP BY category ORDER BY cnt DESC LIMIT 20')
cat_summary = cur.fetchall()

print(f"\n🎉 BATCH {BATCH} COMPLETADO")
print(f"   Nuevos insertados: {total_inserted}")
print(f"   Omitidos (duplicados): {total_skipped}")
print(f"   Total en BD: {final_count}")
print("\nTop categorías:")
for r in cat_summary:
    print(f"  {r['category']}: {r['cnt']}")

cur.close()
conn.close()
