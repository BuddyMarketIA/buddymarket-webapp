/**
 * Script de generación masiva de ingredientes con IA
 * Compatible con Gemini (sin json_schema strict)
 * 
 * Uso: node scripts/seed-ingredients-ai.mjs [batch_number]
 */

import pkg from '../node_modules/pg/lib/index.js';
const { Client } = pkg;

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const BATCH = parseInt(process.argv[2] || '1');
const CHUNK_SIZE = 8; // Lotes pequeños para respuestas completas

console.log(`🌱 BuddyMarket Ingredient Seeder — Batch ${BATCH}/4`);
if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('❌ Faltan variables de entorno'); process.exit(1);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const existing = await client.query('SELECT LOWER("nameEs") as name, "apiParam" FROM ingredients');
const existingNames = new Set(existing.rows.map(r => r.name));
const existingParams = new Set(existing.rows.map(r => r.apiParam));
console.log(`📋 Ingredientes existentes: ${existingNames.size}\n`);

// ─── Categorías por batch ─────────────────────────────────────────────────────
const BATCH_CATEGORIES = {
  1: [
    { category: 'verduras', count: 60, examples: 'pak choi, bok choy, romanesco, mizuna, rúcula, radicchio, endivias, achicoria, colinabo, chirivía, salsifí, yuca, malanga, taro, ñame, jícama, brotes de bambú, coles de Bruselas, coliflor morada, brócoli chino, canónigos, berros, escarola, hinojo, remolacha, nabo, alcachofa, espárrago, apio, puerro, cebolleta, chalota, ajo tierno, ajo negro, ajo morado, cebolla roja, pimiento verde, pimiento amarillo, pimiento naranja, pimiento de Padrón, pimiento del piquillo' },
    { category: 'frutas', count: 60, examples: 'carambola, rambután, mangostán, lichi, pitahaya roja, pitahaya amarilla, maracuyá, guayaba, tamarindo, chirimoya, guanábana, papaya, jackfruit, salak, longan, kumquat, yuzu, bergamota, naranja sanguina, limón Meyer, lima kaffir, clementina, mandarina, tangerina, pomelo rojo, uva moscatel, uva tempranillo, uva garnacha, uva albariño, uva verdejo, uva chardonnay, uva sauvignon blanc, uva riesling' },
    { category: 'carnes', count: 50, examples: 'entrecot de ternera, chuletón de buey, solomillo de cerdo, lomo de cordero, costilla de ternera, falda de ternera, pecho de ternera, morcillo de ternera, ossobuco de ternera, carrillera de cerdo, mejilla de ternera, papada de cerdo, oreja de cerdo, rabo de toro, lengua de ternera, corazón de ternera, riñones de cordero, hígado de ternera, mollejas de ternera, callos de ternera, patas de cerdo, manitas de cerdo, codillo de cerdo, muslo de pato, pechuga de pato, magret de pato, codorniz entera, perdiz entera, faisán entero, jabalí, venado, ciervo, conejo de monte, liebre, pichón' },
    { category: 'pescados', count: 60, examples: 'lubina salvaje, dorada salvaje, rodaballo, lenguado, rape, bacalao fresco, abadejo, eglefino, gallineta, cabracho, san pedro, pez espada, atún rojo, bonito del norte, caballa, sardina, boquerón, arenque, espadín, trucha arcoíris, salmón atlántico, halibut, barramundi, mahi-mahi, pez limón, corvina, besugo, breca, salmonete, gallo, platija, gamba blanca, gamba roja, langostino, cigala, nécora, buey de mar, centollo, bogavante, langosta, carabinero, quisquilla, pulpo, calamar, sepia, chipirón, navaja, almeja, mejillón, ostra, vieira, berberecho' },
    { category: 'lacteos', count: 50, examples: 'leche entera, leche semidesnatada, leche desnatada, leche UHT, leche de cabra, leche de oveja, kéfir, yogur natural, yogur griego, skyr, bifidus, queso fresco, requesón, ricotta, mascarpone, mozzarella fresca, burrata, brie, camembert, roquefort, gorgonzola, stilton, manchego curado, manchego semicurado, ibérico, zamorano, roncal, idiazábal, mahón, tetilla, arzúa, cabrales, gamonéu, parmesano, grana padano, pecorino, gruyère, emmental, comté, gouda, edam, cheddar, feta, halloumi, paneer, nata para montar, mantequilla, ghee, crema agria, crème fraîche, queso crema' },
    { category: 'cereales', count: 50, examples: 'trigo blando, trigo duro, espelta, kamut, einkorn, emmer, centeno, cebada perlada, cebada integral, avena en copos, avena instantánea, maíz dulce, mijo, sorgo, teff, fonio, quinoa blanca, quinoa roja, quinoa negra, amaranto, trigo sarraceno, arroz blanco, arroz integral, arroz basmati, arroz jazmín, arroz arborio, arroz carnaroli, arroz bomba, arroz calasparra, arroz negro, arroz rojo, arroz salvaje, pasta de trigo, pasta integral, pasta de legumbres, pasta de arroz, fideos de arroz, soba, udon, ramen, couscous, bulgur, freekeh, polenta, sémola de trigo, harina de trigo, harina integral, harina de fuerza' },
    { category: 'panaderia', count: 40, examples: 'pan blanco de molde, pan integral de molde, pan de centeno, pan de espelta, pan de maíz, pan sin gluten, baguette, ciabatta, focaccia, pita, naan, chapati, tortilla de maíz, tortilla de trigo, pan árabe, pan de masa madre, brioche, croissant, pain au chocolat, muffin inglés, bagel, pretzel, pan de hamburguesa, pan de hot dog, harina de arroz, harina de maíz, harina de garbanzos, harina de almendra, harina de coco, harina de avena, levadura fresca, levadura seca, levadura química, bicarbonato sódico, pan de semillas, pan de nueces, pan de pasas, pan de aceitunas, pan de tomate, pan de ajo' },
    { category: 'embutidos_y_fiambres', count: 40, examples: 'jamón ibérico de bellota, jamón ibérico de cebo, jamón serrano, jamón york, jamón cocido, salchichón ibérico, chorizo ibérico, fuet, longaniza, morcilla de Burgos, morcilla de arroz, butifarra blanca, butifarra negra, sobrasada, lomo embuchado, cecina de vaca, bresaola, prosciutto di Parma, mortadela, salami Milano, pepperoni, panceta curada, bacon ahumado, tocino, guanciale, coppa, nduja, andouille, kielbasa, bratwurst, weisswurst, liverwurst, pâté de campaña, rillettes de cerdo, rillettes de pato, foie gras en terrina, mousse de foie, paté de hígado de cerdo, paté de pato, paté de venado' },
    { category: 'huevos', count: 20, examples: 'huevo de gallina campero, huevo de gallina ecológico, huevo de gallina de corral, huevo de gallina en jaula enriquecida, huevo de gallina omega-3, huevo de codorniz, huevo de pato, huevo de oca, huevo de avestruz, clara de huevo pasteurizada, yema de huevo pasteurizada, huevo líquido pasteurizado, huevo en polvo entero, clara de huevo en polvo, yema de huevo en polvo, huevo de gallina blanca, huevo de gallina rubia, huevo de gallina negra, huevo de gallina roja, huevo de gallina azul' },
    { category: 'conservas', count: 40, examples: 'atún en aceite de oliva, atún al natural, sardinas en aceite, sardinas en tomate, anchoas en aceite, mejillones en escabeche, berberechos al natural, navajas al natural, almejas al natural, pulpo en aceite, calamar en su tinta, bonito del norte en aceite, melva en aceite, caballa en aceite, salmón ahumado, trucha ahumada, tomate triturado, tomate entero pelado, tomate frito, pimientos del piquillo, espárragos blancos, alcachofas en aceite, judías verdes al natural, maíz dulce, guisantes al natural, habas al natural, lentejas cocidas, garbanzos cocidos, alubias blancas cocidas, alubias negras cocidas, soja cocida, pepinillos en vinagre, cebollitas en vinagre, alcaparras, aceitunas verdes, aceitunas negras, aceitunas rellenas, aceitunas kalamata, aceitunas arbequinas, aceitunas manzanilla' },
  ],
  2: [
    { category: 'legumbres', count: 60, examples: 'lentejas pardinas, lentejas verdes, lentejas rojas, lentejas beluga, lentejas puy, lentejas amarillas, garbanzos castellanos, garbanzos pedrosillano, garbanzos kabuli, alubias blancas, alubias pintas, alubias negras, alubias rojas, alubias carillas, alubias azuki, alubias mungo, soja amarilla, soja negra, edamame, habas secas, guisantes secos, chícharos, lupinos, frijoles negros, frijoles rojos, frijoles blancos, porotos, judías de Lima, judías borlotti, judías cannellini, judías flageolet, judías ojo de perdiz, judías kidney, judías de careta, judías de Tolosa, judías del ganxet, judías de la Granja, judías de El Barco de Ávila, Faba asturiana, Faba gallega, Faba leonesa' },
    { category: 'frutos_secos', count: 60, examples: 'almendras crudas, almendras tostadas, almendras Marcona, almendras Largueta, nueces de Castilla, nueces de California, avellanas crudas, avellanas tostadas, pistachos crudos, pistachos tostados, anacardos crudos, anacardos tostados, macadamia cruda, macadamia tostada, pecanas crudas, nueces de Brasil, piñones, castañas frescas, castañas secas, nueces de tigre, bellotas, semillas de girasol crudas, semillas de girasol tostadas, semillas de calabaza crudas, semillas de calabaza tostadas, semillas de sésamo blanco, semillas de sésamo negro, semillas de lino dorado, semillas de lino marrón, semillas de chía blanca, semillas de chía negra, semillas de amapola, semillas de cáñamo, semillas de nigella, semillas de mostaza amarilla, semillas de mostaza negra, semillas de fenogreco, semillas de alcaravea, semillas de comino negro, semillas de hinojo, semillas de cilantro, semillas de eneldo, semillas de apio, semillas de psyllium, pasta de almendra, pasta de avellana, pasta de anacardo, pasta de macadamia, pasta de pistacho, pasta de nuez, pasta de pecana, pasta de nuez de Brasil, pasta de piñón, pasta de castaña, pasta de bellotas' },
    { category: 'aceites', count: 40, examples: 'aceite de oliva virgen extra Arbequina, aceite de oliva virgen extra Picual, aceite de oliva virgen extra Hojiblanca, aceite de oliva virgen extra Cornicabra, aceite de oliva virgen extra Empeltre, aceite de oliva refinado, aceite de girasol alto oleico, aceite de girasol convencional, aceite de maíz, aceite de soja, aceite de colza, aceite de coco virgen, aceite de coco refinado, aceite de palma, aceite de aguacate, aceite de sésamo tostado, aceite de lino, aceite de cáñamo, aceite de nuez, aceite de almendra, aceite de avellana, aceite de macadamia, aceite de argán alimentario, aceite de germen de trigo, aceite de arroz, aceite de pepitas de uva, aceite de pepitas de calabaza, aceite de mostaza, aceite de onagra, aceite de borraja, ghee de vaca, mantequilla clarificada, manteca de cerdo ibérico, sebo de vaca, grasa de pato, grasa de oca, grasa de pollo' },
    { category: 'especias', count: 80, examples: 'pimienta negra molida, pimienta negra en grano, pimienta blanca molida, pimienta verde en grano, pimienta rosa en grano, pimienta de Sichuan, pimienta de Jamaica, pimienta de Cayena, pimienta de Aleppo, pimienta de Urfa, pimentón dulce de La Vera, pimentón picante de La Vera, pimentón ahumado de La Vera, pimentón de Murcia, cúrcuma molida, jengibre molido, jengibre fresco, canela de Ceilán molida, canela de Cassia molida, cardamomo verde molido, cardamomo negro molido, clavo molido, nuez moscada molida, macis molido, anís estrellado, anís verde, hinojo en semillas, alcaravea en semillas, comino molido, comino en semillas, comino negro, cilantro molido, cilantro en semillas, fenogreco molido, mostaza en polvo, azafrán en hebras, vainilla en vaina, vainilla en polvo, extracto de vainilla, cacao en polvo sin azúcar, eneldo seco, estragón seco, laurel seco, romero seco, tomillo seco, orégano seco, mejorana seca, albahaca seca, perejil seco, cebollino seco, salvia seca, menta seca, hierbabuena seca, melisa seca, lavanda seca, sumac, za\'atar, ras el hanout, garam masala, curry en polvo, tandoori masala, harissa en polvo, berbere, dukkah, baharat, advieh, chermoula, vadouvan, shichimi togarashi, furikake, gomasio, mezcla cajún, mezcla creole, mezcla jerk, adobo seco, chile ancho, chile mulato, chile pasilla, chile guajillo, chile chipotle' },
    { category: 'condimentos', count: 60, examples: 'salsa de soja oscura, salsa de soja clara, tamari sin gluten, shoyu, miso blanco shiro, miso rojo aka, miso negro hatcho, pasta de miso, vinagre de manzana, vinagre de vino blanco, vinagre de vino tinto, vinagre de arroz, vinagre balsámico de Módena, vinagre de jerez, vinagre de umeboshi, tahini tostado, tahini crudo, pasta de sésamo negro, pasta de cacahuete crujiente, pasta de cacahuete suave, pasta de almendra, pasta de avellana, pasta de anacardo, harissa, sriracha, tabasco rojo, tabasco verde, salsa worcestershire, salsa de pescado tailandesa, salsa de ostras, salsa hoisin, salsa teriyaki, salsa ponzu, salsa de ciruela, pasta de curry rojo tailandés, pasta de curry verde tailandés, pasta de curry amarillo tailandés, pasta de curry massaman, pasta de curry panang, salsa de tomate casera, ketchup, mostaza de Dijon, mostaza antigua, mostaza inglesa, mayonesa, alioli, tzatziki, hummus, baba ganoush, muhammara, romesco, salsa verde italiana, chimichurri, mojo rojo canario, mojo verde canario, pesto genovés, pesto rojo, tapenade, anchoïade, brandade, rouille' },
    { category: 'bebidas', count: 40, examples: 'leche de almendra sin azúcar, leche de avena sin azúcar, leche de arroz, leche de coco, leche de soja sin azúcar, leche de cáñamo, leche de guisante, leche de macadamia, leche de anacardo, leche de avellana, leche de pistacho, agua de coco natural, zumo de naranja natural, zumo de manzana natural, zumo de uva natural, zumo de piña natural, zumo de mango natural, zumo de zanahoria natural, zumo de remolacha natural, zumo de apio natural, zumo de jengibre, zumo de cúrcuma, té verde matcha, té verde sencha, té negro Darjeeling, té negro Assam, té rojo pu-erh, té blanco, té oolong, rooibos, manzanilla, tila, valeriana, menta piperita, poleo menta, tomillo, romero, salvia, hibisco, rosa mosqueta, saúco, jengibre, cúrcuma, canela, anís estrellado, café espresso, café americano, café descafeinado, cacao puro, chocolate caliente, kombucha, kéfir de agua' },
    { category: 'lacteos_alternativos', count: 40, examples: 'yogur de soja natural, yogur de coco natural, yogur de almendra natural, yogur de avena natural, yogur de anacardo natural, queso vegano de anacardo, queso vegano de almendra, tofu firme natural, tofu sedoso natural, tofu firme ahumado, tofu firme marinado, tofu firme con hierbas, tempeh de soja natural, tempeh de garbanzos, tempeh de lentejas, tempeh de quinoa, natto de soja, queso de almendra curado, queso de anacardo con hierbas, queso de coco ahumado, crema de coco para cocinar, nata de coco para montar, mantequilla de coco, aceite de coco virgen extra, kéfir de coco, queso brie vegano, queso camembert vegano, queso cheddar vegano, queso mozzarella vegana, queso parmesano vegano, queso ricotta vegana, queso crema vegano, queso feta vegano, queso gouda vegano, queso azul vegano, queso de cabra vegano, crema de anacardo, crema de almendra, crema de avena' },
    { category: 'proteinas_vegetales', count: 60, examples: 'soja texturizada fina, soja texturizada gruesa, soja texturizada en trozos, soja texturizada en filetes, soja texturizada en medallones, soja texturizada en hamburguesas, seitán natural, seitán ahumado, seitán marinado, seitán con hierbas, seitán en filetes, seitán en tiras, seitán en dados, tempeh de soja natural, tempeh de soja ahumado, tempeh de soja marinado, tofu firme natural, tofu sedoso natural, tofu ahumado, tofu marinado, tofu en dados, tofu en láminas, proteína de guisante aislada, proteína de arroz, proteína de cáñamo, proteína de soja aislada, proteína de trigo, proteína de patata, proteína de girasol, proteína de calabaza, proteína de almendra, proteína de avena, proteína de lupino, espirulina en polvo, chlorella en polvo, klamath en polvo, astaxantina, alga nori tostada, alga wakame seca, alga kombu seca, alga dulse seca, alga hijiki seca, alga arame seca, alga espagueti de mar, alga lechuga de mar, alga codium, agar-agar en polvo, agar-agar en tiras, carragenina, alginato de sodio, levadura nutricional en copos, levadura nutricional en polvo' },
    { category: 'suplementos', count: 40, examples: 'proteína de suero de leche concentrada, proteína de suero de leche aislada, proteína de suero de leche hidrolizada, caseína micelar, proteína vegana de guisante y arroz, creatina monohidrato, BCAA en polvo, glutamina en polvo, colágeno hidrolizado bovino, colágeno marino, gelatina en polvo, levadura nutricional con B12, levadura de cerveza en copos, germen de trigo, salvado de trigo, salvado de avena, psyllium en polvo, inulina en polvo, FOS en polvo, GOS en polvo, omega-3 de algas, aceite de krill, aceite de hígado de bacalao, vitamina D3 en gotas, vitamina K2 MK-7, magnesio bisglicinato, zinc picolinato, hierro bisglicinato, calcio citrato, vitamina C en polvo, vitamina B12 metilcobalamina, ácido fólico metilfolato, biotina en polvo, coenzima Q10, resveratrol, curcumina con piperina, quercetina, berberina, ashwagandha KSM-66, rhodiola rosea, ginseng coreano, maca gelatinizada, moringa en polvo, baobab en polvo, açaí en polvo, goji en polvo, camu camu en polvo, aronia en polvo, saúco en polvo' },
    { category: 'hongos_setas', count: 40, examples: 'champiñón blanco fresco, champiñón portobello fresco, champiñón cremini fresco, shiitake fresco, shiitake seco, maitake fresco, enoki fresco, shimeji marrón, shimeji blanco, oyster gris, oyster rosa, oyster amarillo, king oyster fresco, nameko fresco, matsutake seco, porcini seco, boletus edulis fresco, boletus seco, rebozuelo fresco, cantarela seca, trompeta de la muerte seca, níscalo fresco, seta de cardo fresca, seta de chopo fresca, seta de olivo fresca, seta de pino fresca, seta de roble fresca, seta de castaño fresca, reishi seco, reishi en polvo, chaga en polvo, lion\'s mane fresco, lion\'s mane en polvo, cordyceps en polvo, turkey tail en polvo, maitake en polvo, shiitake en polvo, trufa negra fresca, trufa negra conservada, trufa de verano fresca, trufa de Borgoña fresca, trufa china conservada, aceite de trufa negra, aceite de trufa blanca, sal de trufa, mantequilla de trufa, queso de trufa, pasta de trufa' },
  ],
  3: [
    { category: 'dulces', count: 60, examples: 'chocolate negro 70% cacao, chocolate negro 85% cacao, chocolate negro 90% cacao, chocolate negro 99% cacao, chocolate con leche 35% cacao, chocolate blanco, chocolate rubio caramelizado, chocolate de algarroba, cacao en polvo sin azúcar, cacao desgrasado en polvo, nibs de cacao, pasta de cacao pura, manteca de cacao, confitura de fresa artesanal, confitura de frambuesa, confitura de arándanos, confitura de melocotón, confitura de albaricoque, confitura de ciruela, confitura de higo, confitura de naranja amarga, confitura de limón, confitura de manzana, confitura de pera, membrillo en pasta, miel de flores silvestres, miel de romero, miel de lavanda, miel de tomillo, miel de acacia, miel de azahar, miel de eucalipto, miel de brezo, miel de castaño, miel de pino, miel de montaña, miel de manuka, miel de tilo, miel de trigo sarraceno, sirope de arce puro, sirope de agave, sirope de dátil, sirope de coco, sirope de arroz integral, sirope de yacón, azúcar moreno integral, azúcar de coco, azúcar de dátil, panela, piloncillo, rapadura, melaza de caña, melaza negra, caramelo líquido, caramelo en polvo, toffee, fudge, nougat, turrones, mazapán' },
    { category: 'edulcorantes', count: 30, examples: 'azúcar blanco refinado, azúcar glass, azúcar lustre, azúcar turbinado, azúcar demerara, azúcar muscovado, azúcar moreno, azúcar integral de caña, azúcar de coco, azúcar de dátil, azúcar de abedul xilitol, eritritol en polvo, estevia en polvo, estevia líquida, estevia en hojas secas, monk fruit en polvo, alulosa en polvo, tagatosa en polvo, trehalosa en polvo, inulina en polvo, sacarina en tabletas, aspartamo en polvo, acesulfamo K, sucralosa en polvo, ciclamato sódico, neotamo, sirope de agave claro, sirope de agave oscuro, sirope de arce grado A, sirope de arce grado B, sirope de dátil, sirope de coco, sirope de arroz integral, sirope de sorgo, sirope de yacón, sirope de topinambur, sirope de achicoria, sirope de remolacha, miel de caña, miel de dátil, miel de higo, miel de algarroba' },
    { category: 'snacks', count: 50, examples: 'chips de patata clásicos, chips de patata ondulados, chips de boniato, chips de remolacha, chips de zanahoria, chips de kale, chips de algas nori, chips de quinoa, chips de lentejas, chips de garbanzos, chips de maíz, palomitas de maíz naturales, palomitas de microondas, nachos de maíz, tortillas chips, picos de pan, regañás, colines de sésamo, colines de amapola, colines de romero, colines de ajo, galletas saladas de trigo, crackers de arroz, crackers de maíz, crackers de quinoa, crackers de semillas, crackers de centeno, crackers de espelta, barritas de cereales con miel, barritas de proteínas de chocolate, barritas de frutos secos y frutas, barritas de avena y manzana, barritas de muesli, barritas de granola, almendras tostadas y saladas, mezcla de frutos secos tostados, trail mix de frutas y frutos secos, gominolas de frutas, caramelos de menta, regaliz negro, regaliz rojo, palomitas de caramelo, pretzels de sal, palitos de pan con sésamo, picos de aceite de oliva, tortas de aceite, rosquillas de anís, galletas de mantequilla, galletas de avena, galletas de chocolate' },
    { category: 'preparados', count: 60, examples: 'caldo de pollo casero, caldo de carne casero, caldo de pescado casero, caldo de verduras casero, caldo de setas casero, caldo de miso, consomé de pollo, consomé de carne, gazpacho andaluz, salmorejo cordobés, crema de calabaza, crema de zanahoria, crema de puerro, crema de espárragos, crema de brócoli, sopa de cebolla francesa, sopa de tomate, sopa de lentejas, sopa de guisantes, sopa de sobre de pollo, sopa instantánea de miso, ramen instantáneo de pollo, ramen instantáneo de cerdo, fideos instantáneos de soja, arroz instantáneo cocido, quinoa instantánea cocida, puré de patata instantáneo, copos de patata deshidratada, copos de boniato deshidratado, copos de zanahoria deshidratada, copos de remolacha deshidratada, copos de espinacas deshidratadas, copos de brócoli deshidratado, copos de coliflor deshidratada, copos de puerro deshidratado, copos de cebolla deshidratada, copos de ajo deshidratado, copos de tomate deshidratado, copos de pimiento deshidratado, tomate seco en aceite, tomate seco sin aceite, pimiento seco, cebolla seca en escamas, ajo en polvo, cebolla en polvo, zanahoria en polvo, remolacha en polvo, espinacas en polvo, brócoli en polvo, kale en polvo, espirulina en polvo, chlorella en polvo, moringa en polvo, baobab en polvo, açaí en polvo, goji en polvo, camu camu en polvo, aronia en polvo' },
    { category: 'algas_marinas', count: 40, examples: 'alga nori tostada en hojas, alga nori cruda en hojas, alga wakame seca, alga wakame fresca, alga kombu seca, alga kombu fresca, alga dulse seca, alga dulse fresca, alga hijiki seca, alga arame seca, alga espagueti de mar seca, alga lechuga de mar seca, alga codium fresca, alga musgo de Irlanda seca, agar-agar en polvo, agar-agar en tiras, carragenina en polvo, alginato de sodio, alga roja en polvo, alga verde en polvo, alga parda en polvo, espirulina en polvo, espirulina en tabletas, chlorella en polvo, chlorella en tabletas, klamath en polvo, astaxantina natural, fucoxantina, fucoidán en polvo, alga nori en polvo, alga wakame en polvo, alga kombu en polvo, alga dulse en polvo, alga hijiki en polvo, alga arame en polvo, alga espagueti de mar en polvo, alga lechuga de mar en polvo, alga codium en polvo, alga musgo de Irlanda en polvo' },
    { category: 'frutas_secas_y_deshidratadas', count: 50, examples: 'pasas sultanas, pasas de Corinto, pasas de Málaga, pasas de California, pasas de Chile, pasas de Turquía, pasas de Grecia, orejones de albaricoque, orejones de melocotón, orejones de manzana, orejones de pera, ciruelas pasas de Agen, ciruelas pasas de California, higos secos, dátiles Medjool, dátiles Deglet Nour, mango deshidratado, papaya deshidratada, piña deshidratada, coco deshidratado, plátano deshidratado, kiwi deshidratado, fresa deshidratada, frambuesa deshidratada, arándanos deshidratados, cerezas deshidratadas, arándanos rojos deshidratados, goji deshidratado, mulberry deshidratado, physalis deshidratado, camu camu deshidratado, açaí deshidratado, aronia deshidratada, saúco deshidratado, rosa mosqueta deshidratada, escaramujo deshidratado, hibisco deshidratado, tamarindo deshidratado, umeboshi, melocotón deshidratado, albaricoque deshidratado, manzana deshidratada, pera deshidratada, limón deshidratado, naranja deshidratada, pomelo deshidratado, mandarina deshidratada, clementina deshidratada, uva pasa de Málaga, uva pasa de Corinto' },
    { category: 'otros', count: 60, examples: 'gelatina en hojas, gelatina en polvo, agar-agar en polvo, carragenina en polvo, goma xantana, goma guar, goma arábiga, goma de algarroba, goma tara, goma konjac, almidón de maíz, almidón de patata, almidón de tapioca, almidón de arroz, almidón de trigo, almidón de mandioca, almidón de sagú, almidón de arrurruz, almidón de maranta, pectina de manzana, pectina de cítricos, pectina de remolacha, lecitina de soja, lecitina de girasol, lecitina de huevo, levadura nutricional en copos, levadura de cerveza en copos, levadura fresca de panadería, levadura seca de panadería, levadura química, bicarbonato sódico, impulsor químico, cremor tártaro, sal marina fina, sal marina gruesa, sal del Himalaya rosa, sal negra de Hawái, sal ahumada, sal de apio, sal de ajo, sal de cebolla, sal de hierbas, sal de trufa, sal de setas, sal de algas, sal de limón, sal de naranja, sal de lima, sal de pomelo, sal de mandarina, sal de clementina, sal de bergamota, sal de yuzu, sal de kumquat, sal de tamarindo, sal de umeboshi, sal de ciruela, sal de melocotón, sal de albaricoque, sal de manzana, sal de pera, sal de uva, sal de higo, sal de dátil, sal de coco' },
    { category: 'conservas', count: 50, examples: 'pepinillos en vinagre pequeños, pepinillos en vinagre grandes, cebollitas en vinagre, alcaparras en vinagre, alcaparrones en vinagre, aceitunas verdes sin hueso, aceitunas verdes con hueso, aceitunas negras sin hueso, aceitunas negras con hueso, aceitunas rellenas de anchoa, aceitunas rellenas de pimiento, aceitunas rellenas de almendra, aceitunas kalamata, aceitunas arbequinas, aceitunas hojiblanca, aceitunas manzanilla, aceitunas gordal, aceitunas picual, aceitunas cornicabra, aceitunas empeltre, aceitunas blanqueta, aceitunas sevillana, aceitunas verdial, aceitunas carrasqueña, aceitunas morisca, aceitunas aloreña, aceitunas cornezuelo, aceitunas cuquillo, aceitunas lechín, aceitunas picudo, aceitunas royal, aceitunas taggiasca, aceitunas niçoise, aceitunas castelvetrano, aceitunas cerignola, aceitunas gaeta, aceitunas lucques, aceitunas picholine, aceitunas salonenque, aceitunas tanche, aceitunas aglandau, aceitunas bouteillan, aceitunas cailletier, aceitunas grossane, aceitunas olivière, aceitunas rougette, aceitunas saurine, aceitunas verdale, aceitunas amellau' },
  ],
  4: [
    { category: 'verduras', count: 60, examples: 'rábano daikon blanco, rábano daikon negro, rábano negro redondo, rábano rojo redondo, rábano picante fresco, wasabi fresco, mostaza verde, mostaza roja, col china napa, col lombarda, col blanca, col verde, col rizada kale, col rizada lacinato, col de Saboya, col de Milán, col de Bruselas, romanesco, coliflor blanca, coliflor morada, coliflor naranja, coliflor verde, brócoli verde, brócoli morado, brócoli romanesco, brócoli chino, brócoli rabe, brócoli baby, colinabo verde, colinabo morado, chirivía, salsifí negro, salsifí blanco, yuca fresca, malanga, taro, ñame blanco, ñame morado, jícama, brotes de bambú frescos, brotes de soja, brotes de alfalfa, brotes de rábano, brotes de girasol, brotes de lentejas, brotes de garbanzos, brotes de trigo, brotes de cebada, brotes de avena, brotes de centeno, brotes de quinoa, brotes de amaranto, brotes de mostaza, brotes de brócoli, brotes de col, brotes de berro, brotes de fenogreco' },
    { category: 'frutas', count: 60, examples: 'mango Ataulfo, mango Tommy Atkins, mango Kent, mango Keitt, mango Haden, mango Alphonso, mango Kesar, mango Dasheri, mango Langra, mango Chaunsa, mango Totapuri, mango Neelam, manzana Golden Delicious, manzana Granny Smith, manzana Fuji, manzana Gala, manzana Braeburn, manzana Honeycrisp, manzana Pink Lady, manzana Red Delicious, pera Conference, pera Williams, pera Blanquilla, pera Limonera, pera Abate Fetel, pera Bosc, pera Anjou, pera Bartlett, pera Comice, cereza Picota, cereza Burlat, cereza Bing, cereza Rainier, cereza Lapins, cereza Sweetheart, cereza Stella, cereza Van, cereza Morello, melocotón amarillo, melocotón blanco, melocotón plano, nectarina amarilla, nectarina blanca, albaricoque Búlida, albaricoque Canino, albaricoque Moniquí, ciruela claudia verde, ciruela claudia dorada, ciruela roja, ciruela negra, ciruela amarilla' },
    { category: 'carnes', count: 50, examples: 'entrecot de ternera gallega, chuletón de buey madurado, solomillo de ternera, lomo alto de vaca, lomo bajo de ternera, costilla de ternera, falda de ternera, pecho de ternera, morcillo de ternera, ossobuco de ternera, carrillera de ternera, mejilla de ternera, papada de cerdo ibérico, oreja de cerdo, rabo de toro, lengua de ternera, corazón de ternera, riñones de ternera, hígado de ternera, mollejas de ternera, criadillas de toro, callos de ternera, patas de cerdo, manitas de cerdo, codillo de cerdo, lacón de cerdo, espinazo de cerdo, cuello de cordero, cabeza de cerdo, sesos de ternera, tuétano de ternera, muslo de pato confitado, pechuga de pato, magret de pato, confit de pato, foie gras de pato mi-cuit, foie gras de oca mi-cuit, hígado de pato, hígado de oca, codorniz entera, perdiz estofada, faisán entero, jabalí en ragú, venado en ragú, ciervo en ragú, conejo de monte, conejo de granja, liebre en ragú, pichón asado, paloma torcaz, becada asada' },
    { category: 'pescados', count: 60, examples: 'lubina salvaje del Mediterráneo, lubina de acuicultura, dorada salvaje del Mediterráneo, dorada de acuicultura, rodaballo salvaje del Atlántico, rodaballo de acuicultura, lenguado del Mediterráneo, rape del Atlántico, bacalao fresco del Atlántico, bacalao salado desalado, abadejo del Atlántico, eglefino del Atlántico, carbonero del Atlántico, gallineta del Atlántico, cabracho del Mediterráneo, san pedro del Mediterráneo, pez espada del Mediterráneo, atún rojo del Mediterráneo, bonito del norte del Atlántico, caballa del Atlántico, sardina del Mediterráneo, boquerón del Mediterráneo, arenque del Atlántico, espadín del Báltico, trucha arcoíris de acuicultura, trucha de río salvaje, salmón atlántico de acuicultura, salmón del Pacífico salvaje, salmón ártico de acuicultura, halibut del Atlántico, fletán del Pacífico, panga de acuicultura, tilapia de acuicultura, barramundi de acuicultura, mahi-mahi del Pacífico, pez limón del Mediterráneo, corvina del Mediterráneo, besugo del Mediterráneo, breca del Mediterráneo, salmonete del Mediterráneo, rubio del Mediterráneo, gallo del Atlántico, platija del Atlántico, acedía del Mediterráneo, chanquete del Mediterráneo, gamba blanca de Huelva, gamba roja de Denia, gamba de Palamós, langostino de Sanlúcar, cigala del Atlántico, nécora del Atlántico, buey de mar del Atlántico, centollo del Atlántico, bogavante del Atlántico, langosta del Mediterráneo, carabinero del Mediterráneo, quisquilla del Mediterráneo, camarón del Mediterráneo, pulpo del Mediterráneo, calamar del Mediterráneo, sepia del Mediterráneo' },
    { category: 'especias', count: 60, examples: 'pimienta negra Tellicherry, pimienta negra Malabar, pimienta blanca de Sarawak, pimienta verde de Madagascar, pimienta rosa de Brasil, pimienta de Sichuan roja, pimienta de Sichuan verde, pimienta de Jamaica entera, pimienta de Cayena molida, pimienta de Aleppo molida, pimienta de Urfa molida, pimentón dulce de La Vera DOP, pimentón picante de La Vera DOP, pimentón ahumado de La Vera DOP, pimentón de Murcia DOP, cúrcuma de Alleppey, cúrcuma de Madras, jengibre de Jamaica, jengibre de Nigeria, canela de Ceilán en rama, canela de Ceilán molida, canela de Cassia en rama, canela de Cassia molida, cardamomo verde de Guatemala, cardamomo negro de la India, clavo de Zanzíbar, nuez moscada de Granada, macis de Granada, anís estrellado de Vietnam, anís verde de España, hinojo de Sicilia, alcaravea de Holanda, comino de Irán, comino de la India, comino negro de Egipto, cilantro de Marruecos, cilantro de la India, fenogreco de la India, mostaza amarilla de Canadá, mostaza negra de la India, azafrán de La Mancha DOP, azafrán de Irán, vainilla de Madagascar, vainilla de Tahití, vainilla de México, extracto de vainilla puro, cacao criollo en polvo, cacao forastero en polvo, cacao trinitario en polvo, sumac sirio, za\'atar libanés, ras el hanout marroquí, garam masala indio, curry Madras, curry Korma, curry Vindaloo, tandoori masala, harissa tunecina, berbere etíope, dukkah egipcio, baharat árabe' },
    { category: 'condimentos', count: 50, examples: 'salsa de soja Kikkoman, salsa de soja Yamasa, tamari San-J, shoyu artesanal, miso blanco Hikari, miso rojo Marukome, miso negro Hatcho Miso, pasta de miso Genmai, vinagre de manzana Bragg, vinagre de vino blanco de Jerez, vinagre de vino tinto de Módena, vinagre de arroz Mizkan, vinagre balsámico de Módena IGP, vinagre de jerez DOP, tahini Al Wadi, tahini Achva, pasta de sésamo negro Kadoya, pasta de cacahuete Whole Earth, pasta de almendra Meridian, pasta de avellana Nocciolata, pasta de anacardo Biona, harissa Mina, sriracha Huy Fong, tabasco rojo McIlhenny, tabasco verde McIlhenny, salsa worcestershire Lea & Perrins, salsa de pescado Tiparos, salsa de ostras Lee Kum Kee, salsa hoisin Lee Kum Kee, salsa teriyaki Kikkoman, salsa ponzu Mizkan, pasta de curry rojo Mae Ploy, pasta de curry verde Mae Ploy, pasta de curry amarillo Mae Ploy, pasta de curry massaman Mae Ploy, ketchup Heinz, mostaza de Dijon Maille, mostaza antigua Maille, mayonesa Hellmann\'s, alioli casero, tzatziki casero, hummus casero, baba ganoush casero, muhammara casera, romesco casero, salsa verde italiana casera, chimichurri casero, mojo rojo canario casero, mojo verde canario casero' },
    { category: 'bebidas', count: 50, examples: 'café Blue Mountain de Jamaica, café Kona de Hawái, café Geisha de Panamá, café Yirgacheffe de Etiopía, café Sidamo de Etiopía, café Harrar de Etiopía, café Sumatra Mandheling, café Java, café Sulawesi Toraja, café Flores, café Timor, café Papua Nueva Guinea, café Kenia AA, café Tanzania Peaberry, café Rwanda, café Burundi, café Uganda, café Costa Rica Tarrazu, café Guatemala Antigua, café Honduras, café Nicaragua, café El Salvador, café Perú, café Colombia Huila, café Colombia Nariño, café Colombia Antioquia, café Bolivia, café Ecuador, café Brasil Santos, café Brasil Cerrado, café Brasil Sul de Minas, té verde Gyokuro, té verde Kabusecha, té verde Fukamushi, té verde Bancha, té verde Kukicha, té verde Genmaicha, té verde Hojicha, té verde Shincha, té negro Darjeeling primera cosecha, té negro Darjeeling segunda cosecha, té negro Assam TGFOP, té negro Nilgiri, té negro Dimbula, té negro Nuwara Eliya, té negro Uva, té negro Kandy, té blanco Bai Hao Yinzhen, té blanco Bai Mu Dan' },
    { category: 'hongos_setas', count: 50, examples: 'champiñón blanco fresco pequeño, champiñón blanco fresco grande, champiñón portobello fresco, champiñón cremini fresco, champiñón Paris fresco, champiñón de campo fresco, shiitake fresco, shiitake seco, shiitake en polvo, maitake fresco, maitake seco, maitake en polvo, enoki fresco, shimeji marrón fresco, shimeji blanco fresco, oyster gris fresco, oyster rosa fresco, oyster amarillo fresco, oyster azul fresco, king oyster fresco, nameko fresco, matsutake seco, porcini seco, porcini en polvo, boletus edulis fresco, boletus pinophilus fresco, boletus aereus fresco, boletus reticulatus fresco, rebozuelo fresco, rebozuelo seco, cantarela seca, trompeta de la muerte seca, trompeta de la muerte en polvo, níscalo fresco, seta de cardo fresca, seta de chopo fresca, seta de olivo fresca, seta de pino fresca, seta de roble fresca, seta de castaño fresca, reishi seco, reishi en polvo, reishi en extracto, chaga en polvo, chaga en extracto, lion\'s mane fresco, lion\'s mane en polvo, lion\'s mane en extracto, cordyceps militaris en polvo, cordyceps sinensis en polvo, turkey tail en polvo, turkey tail en extracto' },
    { category: 'suplementos', count: 20, examples: 'proteína de insecto de grillo en polvo, harina de grillo, proteína de langosta en polvo, proteína de saltamontes en polvo, proteína de gusano de la harina en polvo, proteína de larva de mosca soldado negra, colágeno de origen marino de bacalao, colágeno de origen marino de salmón, colágeno de origen marino de tilapia, colágeno de origen bovino pasto, colágeno de origen bovino ecológico, colágeno de origen porcino, colágeno de origen aviar, colágeno de origen equino, colágeno de tipo I, colágeno de tipo II, colágeno de tipo III, colágeno de tipo IV, colágeno de tipo V, colágeno de tipo X' },
  ],
};

const categories = BATCH_CATEGORIES[BATCH];
if (!categories) { console.error(`❌ Batch ${BATCH} no válido.`); process.exit(1); }

// ─── Función para llamar al LLM ───────────────────────────────────────────────
async function callLLM(systemPrompt, userPrompt) {
  const baseUrl = FORGE_API_URL.endsWith('/') ? FORGE_API_URL : `${FORGE_API_URL}/`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
  try {
    const response = await fetch(`${baseUrl}v1/chat/completions`, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FORGE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 6000,
      }),
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`LLM error ${response.status}: ${err.substring(0, 200)}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// ─── Parsear JSON de respuesta del LLM ───────────────────────────────────────
function parseIngredients(content) {
  // Extraer JSON del contenido (puede estar envuelto en ```json ... ```)
  let jsonStr = content;
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];
  
  // Intentar parsear directamente
  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (Array.isArray(parsed)) return parsed;
    if (parsed.ingredients) return parsed.ingredients;
    return [];
  } catch {
    // Intentar extraer array JSON
    const arrMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrMatch) {
      try { return JSON.parse(arrMatch[0]); } catch { return []; }
    }
    return [];
  }
}

// ─── Procesar cada categoría ──────────────────────────────────────────────────
let totalInserted = 0;
let totalSkipped = 0;

const SYSTEM_PROMPT = `Eres un experto en nutrición y base de datos de alimentos. Generas datos nutricionales precisos basados en tablas de composición de alimentos oficiales (USDA FoodData Central, BEDCA, CIQUAL).

SIEMPRE devuelves un array JSON válido y completo. Cada objeto tiene EXACTAMENTE estos campos:
- nameEs: string (nombre en español)
- nameEn: string (nombre en inglés)
- apiParam: string (identificador único snake_case en inglés, ej: "cherry_tomato_red")
- category: string (categoría asignada)
- purchaseUnitType: string ("weight", "volume", "unit" o "bunch")
- purchaseGramsPerUnit: number (gramos por unidad; usa 100 si es por peso)
- purchaseUnitSingular: string (unidad singular en español, ej: "gramo", "litro", "unidad")
- purchaseUnitPlural: string (unidad plural en español, ej: "gramos", "litros", "unidades")
- calories: number (kcal por 100g)
- proteins: number (g por 100g)
- carbohydrates: number (g por 100g)
- fats: number (g por 100g)
- saturatedFats: number (g por 100g)
- fiber: number (g por 100g)
- sugars: number (g por 100g)
- sodium: number (mg por 100g)
- potassium: number (mg por 100g)
- calcium: number (mg por 100g)
- iron: number (mg por 100g)
- vitaminC: number (mg por 100g)
- isVegan: boolean
- isVegetarian: boolean
- isGlutenFree: boolean
- isDairyFree: boolean

Devuelve SOLO el array JSON, sin texto adicional, sin markdown, sin explicaciones.`;

for (const { category, count, examples } of categories) {
  console.log(`\n📦 Categoría: ${category} (objetivo: ${count})`);
  
  const existingInCat = await client.query(
    'SELECT LOWER("nameEs") as name FROM ingredients WHERE category = $1',
    [category]
  );
  const existingInCatNames = new Set(existingInCat.rows.map(r => r.name));
  
  let inserted = 0;
  let attempts = 0;
  const maxAttempts = Math.ceil(count / CHUNK_SIZE) * 3;
  
  while (inserted < count && attempts < maxAttempts) {
    attempts++;
    const remaining = Math.min(CHUNK_SIZE, count - inserted);
    
    // Tomar muestra de ejemplos para el prompt
    const exampleList = examples.split(', ').slice(0, 15).join(', ');
    
    try {
      const userPrompt = `Genera exactamente ${remaining} ingredientes alimentarios únicos de la categoría "${category}".

Ejemplos del tipo de ingredientes: ${exampleList}

NO incluyas estos ingredientes ya existentes: ${[...existingInCatNames].slice(0, 20).join(', ')}

Genera ${remaining} ingredientes únicos, específicos y variados. Devuelve SOLO el array JSON.`;

      const content = await callLLM(SYSTEM_PROMPT, userPrompt);
      const newIngredients = parseIngredients(content);
      
      if (newIngredients.length === 0) {
        console.error(`\n  ⚠️  No se pudieron parsear ingredientes (intento ${attempts})`);
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      
      for (const ing of newIngredients) {
        if (!ing.nameEs) continue;
        const nameLower = ing.nameEs.toLowerCase().trim();
        if (existingNames.has(nameLower) || existingInCatNames.has(nameLower)) {
          totalSkipped++;
          continue;
        }
        
        let apiParam = (ing.apiParam || nameLower.replace(/[^a-z0-9]/g, '_')).toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 128);
        if (existingParams.has(apiParam)) {
          apiParam = `${apiParam}_${Date.now() % 100000}`;
        }
        
        try {
          await client.query(`
            INSERT INTO ingredients (
              "apiParam", "nameEs", "nameEn", category,
              "purchaseUnitType", "purchaseGramsPerUnit", "purchaseUnitSingular", "purchaseUnitPlural",
              calories, proteins, carbohydrates, fats, "saturatedFats", fiber, sugars, sodium,
              potassium, calcium, iron, "vitaminC",
              "isVegan", "isVegetarian", "isGlutenFree", "isDairyFree",
              "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12, $13, $14, $15, $16,
              $17, $18, $19, $20,
              $21, $22, $23, $24,
              NOW(), NOW()
            )
          `, [
            apiParam, ing.nameEs.trim(), (ing.nameEn || '').trim(), category,
            ing.purchaseUnitType || 'weight', ing.purchaseGramsPerUnit || 100,
            ing.purchaseUnitSingular || 'gramo', ing.purchaseUnitPlural || 'gramos',
            ing.calories || 0, ing.proteins || 0, ing.carbohydrates || 0, ing.fats || 0,
            ing.saturatedFats || 0, ing.fiber || 0, ing.sugars || 0, ing.sodium || 0,
            ing.potassium || 0, ing.calcium || 0, ing.iron || 0, ing.vitaminC || 0,
            ing.isVegan ?? false, ing.isVegetarian ?? false, ing.isGlutenFree ?? false, ing.isDairyFree ?? false,
          ]);
          
          existingNames.add(nameLower);
          existingInCatNames.add(nameLower);
          existingParams.add(apiParam);
          inserted++;
          totalInserted++;
          
          if (totalInserted % 20 === 0) {
            process.stdout.write(`\r  [${category}] ${inserted}/${count} | Total nuevos: ${totalInserted}   `);
          }
        } catch (dbErr) {
          if (dbErr.code !== '23505') {
            console.error(`\n  ⚠️  DB: ${dbErr.message.substring(0, 80)}`);
          }
          totalSkipped++;
        }
      }
      
      await new Promise(r => setTimeout(r, 600));
      
    } catch (err) {
      console.error(`\n  ❌ LLM error (intento ${attempts}): ${err.message.substring(0, 120)}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  console.log(`\n  ✅ ${category}: ${inserted}/${count} insertados`);
}

// ─── Resumen final ────────────────────────────────────────────────────────────
const finalCount = await client.query('SELECT COUNT(*) FROM ingredients');
const catSummary = await client.query('SELECT category, COUNT(*) as cnt FROM ingredients GROUP BY category ORDER BY cnt DESC LIMIT 20');
console.log(`\n🎉 BATCH ${BATCH} COMPLETADO`);
console.log(`   Nuevos insertados: ${totalInserted}`);
console.log(`   Omitidos (duplicados): ${totalSkipped}`);
console.log(`   Total en BD: ${finalCount.rows[0].count}`);
console.log('\nTop categorías:');
catSummary.rows.forEach(r => console.log(`  ${r.category}: ${r.cnt}`));

await client.end();
