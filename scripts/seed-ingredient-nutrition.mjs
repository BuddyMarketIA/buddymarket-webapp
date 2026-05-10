/**
 * seed-ingredient-nutrition.mjs
 * Inserta ~250 ingredientes base con valores nutricionales por 100g en la BD.
 * Ejecutar: node scripts/seed-ingredient-nutrition.mjs
 */
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Formato: [name, nameEn, category, aliases, cal, prot, carbs, fat, fiber, sugar, sodium, satFat, vitC, vitA, vitD, vitB12, calcium, iron, potassium, magnesium, gi, isProcessed]
const ingredients = [
  // VERDURAS
  ["Acelgas","Swiss chard","verdura","['acelga','betas']",19,1.8,2.1,0.2,1.6,1.1,213,0.03,30,306,0,0,58,1.8,379,81,null,false],
  ["Ajo","Garlic","verdura","['ajos','ajo fresco']",149,6.4,33.1,0.5,2.1,1.0,17,0.09,31,0,0,0,181,1.7,401,25,30,false],
  ["Alcachofa","Artichoke","verdura","['alcachofas','alcaucil']",47,3.3,10.5,0.2,5.4,0.9,94,0.04,12,14,0,0,44,1.3,370,60,null,false],
  ["Apio","Celery","verdura","['apio nabo','céleri']",16,0.7,3.0,0.2,1.6,1.3,80,0.04,3,22,0,0,40,0.2,260,11,null,false],
  ["Berenjena","Eggplant","verdura","['berenjenas','aubergine']",25,1.0,5.9,0.2,3.0,3.5,2,0.03,2,1,0,0,9,0.2,229,14,null,false],
  ["Brócoli","Broccoli","verdura","['brécol','brócoli']",34,2.8,6.6,0.4,2.6,1.7,33,0.06,89,31,0,0,47,0.7,316,21,null,false],
  ["Calabacín","Zucchini","verdura","['zucchini','calabacines']",17,1.2,3.1,0.3,1.0,2.5,8,0.04,17,10,0,0,16,0.4,261,18,null,false],
  ["Calabaza","Pumpkin","verdura","['calabaza común','zapallo']",26,1.0,6.5,0.1,0.5,2.8,1,0.06,9,426,0,0,21,0.8,340,12,null,false],
  ["Cebolla","Onion","verdura","['cebollas','cebolla blanca','cebolla morada']",40,1.1,9.3,0.1,1.7,4.2,4,0.04,7,0,0,0,23,0.2,146,10,null,false],
  ["Cebolla morada","Red onion","verdura","['cebolla roja','cebolla violeta']",40,1.1,9.3,0.1,1.7,4.2,4,0.04,7,0,0,0,23,0.2,146,10,null,false],
  ["Cebolleta","Spring onion","verdura","['cebollino','cebolla tierna']",32,1.8,7.3,0.2,2.6,2.3,16,0.04,19,50,0,0,72,1.5,276,20,null,false],
  ["Col","Cabbage","verdura","['repollo','col blanca']",25,1.3,5.8,0.1,2.5,3.2,18,0.02,36,5,0,0,40,0.5,170,12,null,false],
  ["Col lombarda","Red cabbage","verdura","['lombarda','repollo morado']",31,1.4,7.4,0.2,2.1,3.8,27,0.02,57,56,0,0,45,0.8,243,16,null,false],
  ["Coliflor","Cauliflower","verdura","['coliflores','brócoli blanco']",25,1.9,5.0,0.3,2.0,1.9,30,0.04,48,0,0,0,22,0.4,299,15,null,false],
  ["Espárrago","Asparagus","verdura","['espárragos','espárragos verdes']",20,2.2,3.9,0.1,2.1,1.9,2,0.04,5,38,0,0,24,2.1,202,14,null,false],
  ["Espinacas","Spinach","verdura","['espinaca','espinacas frescas']",23,2.9,3.6,0.4,2.2,0.4,79,0.06,28,469,0,0,99,2.7,558,79,null,false],
  ["Guisantes","Peas","verdura","['arvejas','chícharos']",81,5.4,14.5,0.4,5.1,5.7,5,0.07,40,38,0,0,25,1.5,244,33,null,false],
  ["Judías verdes","Green beans","verdura","['vainas','ejotes']",31,1.8,7.1,0.1,3.4,3.3,6,0.02,12,35,0,0,37,1.0,209,25,null,false],
  ["Lechuga","Lettuce","verdura","['lechugas','lechuga romana']",15,1.4,2.9,0.2,1.3,1.2,28,0.03,9,166,0,0,36,0.9,238,14,null,false],
  ["Maíz","Corn","verdura","['elote','choclo','maíz dulce']",86,3.2,19.0,1.2,2.7,3.2,15,0.18,7,11,0,0,2,0.5,270,37,55,false],
  ["Pepino","Cucumber","verdura","['pepinos','pepinillo']",16,0.7,3.6,0.1,0.5,1.7,2,0.02,2,5,0,0,16,0.3,147,13,null,false],
  ["Pimiento rojo","Red bell pepper","verdura","['pimiento colorado']",31,1.0,6.0,0.3,2.1,4.2,4,0.04,128,157,0,0,10,0.4,211,12,null,false],
  ["Pimiento verde","Green bell pepper","verdura","['pimiento verde fresco']",20,0.9,4.6,0.2,1.7,2.4,3,0.03,80,18,0,0,10,0.4,175,10,null,false],
  ["Pimiento amarillo","Yellow bell pepper","verdura","['pimiento amarillo fresco']",27,1.0,6.3,0.2,0.9,5.0,2,0.03,184,18,0,0,11,0.5,212,12,null,false],
  ["Puerro","Leek","verdura","['puerros','ajo puerro']",61,1.5,14.2,0.3,1.8,3.9,20,0.04,12,83,0,0,59,2.1,180,28,null,false],
  ["Remolacha","Beetroot","verdura","['betabel','remolacha roja']",43,1.6,9.6,0.2,2.8,6.8,78,0.03,5,2,0,0,16,0.8,325,23,64,false],
  ["Tomate","Tomato","verdura","['tomates','tomate cherry','tomate pera']",18,0.9,3.9,0.2,1.2,2.6,5,0.03,14,42,0,0,10,0.3,237,11,null,false],
  ["Tomate cherry","Cherry tomato","verdura","['tomates cherry','tomatitos']",18,0.9,3.9,0.2,1.2,2.6,5,0.03,19,42,0,0,10,0.3,237,11,null,false],
  ["Zanahoria","Carrot","verdura","['zanahorias','zanahoria baby']",41,0.9,9.6,0.2,2.8,4.7,69,0.02,6,835,0,0,33,0.3,320,12,39,false],
  ["Champiñón","Button mushroom","verdura","['champiñones','setas de cultivo']",22,3.1,3.3,0.3,1.0,2.0,5,0.04,2,0,0.2,0,3,0.5,318,9,null,false],
  ["Seta","Mushroom","verdura","['setas','hongos silvestres']",22,3.1,3.3,0.3,1.0,2.0,5,0.04,2,0,0.2,0,3,0.5,318,9,null,false],
  ["Boniato","Sweet potato","verdura","['batata','camote','patata dulce']",86,1.6,20.1,0.1,3.0,4.2,55,0.02,2,961,0,0,30,0.6,337,25,63,false],
  ["Patata","Potato","verdura","['papas','patatas','papa']",77,2.0,17.5,0.1,2.2,0.8,6,0.03,20,2,0,0,12,0.8,425,23,78,false],
  ["Rúcula","Arugula","verdura","['rúgula','oruga','rocket']",25,2.6,3.7,0.7,1.6,2.1,27,0.09,15,119,0,0,160,1.5,369,47,null,false],
  ["Canónigos","Lamb's lettuce","verdura","['valerianella','maché']",21,2.0,3.6,0.4,1.8,0.5,38,0.05,38,355,0,0,38,2.2,459,13,null,false],
  ["Berros","Watercress","verdura","['berro','mastuerzo de agua']",11,2.3,1.3,0.1,0.5,0.2,41,0.01,43,160,0,0,120,0.2,330,21,null,false],
  ["Hinojo","Fennel","verdura","['hinojo fresco','bulbo de hinojo']",31,1.2,7.3,0.2,3.1,3.9,52,0.02,12,48,0,0,49,0.7,414,17,null,false],
  ["Nabo","Turnip","verdura","['nabos','nabo blanco']",28,0.9,6.4,0.1,1.8,3.8,67,0.01,21,0,0,0,30,0.3,191,11,null,false],
  ["Aguacate","Avocado","fruta","['aguacates','palta']",160,2.0,8.5,14.7,6.7,0.7,7,2.13,10,7,0,0,12,0.6,485,29,null,false],
  // FRUTAS
  ["Manzana","Apple","fruta","['manzanas','manzana verde','manzana roja']",52,0.3,13.8,0.2,2.4,10.4,1,0.03,5,3,0,0,6,0.1,107,5,38,false],
  ["Pera","Pear","fruta","['peras','pera conferencia']",57,0.4,15.2,0.1,3.1,9.8,1,0.01,4,1,0,0,9,0.2,119,7,38,false],
  ["Plátano","Banana","fruta","['banano','banana','plátanos']",89,1.1,22.8,0.3,2.6,12.2,1,0.11,9,3,0,0,5,0.3,358,27,51,false],
  ["Naranja","Orange","fruta","['naranjas','naranja navel']",47,0.9,11.8,0.1,2.4,9.4,0,0.02,53,11,0,0,40,0.1,181,10,40,false],
  ["Mandarina","Tangerine","fruta","['mandarinas','clementina']",53,0.8,13.3,0.3,1.8,10.6,2,0.04,27,34,0,0,37,0.2,166,12,null,false],
  ["Limón","Lemon","fruta","['limones','limón amarillo']",29,1.1,9.3,0.3,2.8,2.5,2,0.04,53,3,0,0,26,0.6,138,8,null,false],
  ["Lima","Lime","fruta","['limas','lima ácida']",30,0.7,10.5,0.2,2.8,1.7,2,0.03,29,2,0,0,33,0.6,102,6,null,false],
  ["Fresa","Strawberry","fruta","['fresas','fresones','frutilla']",32,0.7,7.7,0.3,2.0,4.9,1,0.02,59,1,0,0,16,0.4,153,13,40,false],
  ["Frambuesa","Raspberry","fruta","['frambuesas']",52,1.2,11.9,0.7,6.5,4.4,1,0.10,26,2,0,0,25,0.7,151,22,null,false],
  ["Arándano","Blueberry","fruta","['arándanos','blueberry']",57,0.7,14.5,0.3,2.4,10.0,1,0.05,10,3,0,0,6,0.3,77,6,53,false],
  ["Mora","Blackberry","fruta","['moras','zarzamora']",43,1.4,9.6,0.5,5.3,4.9,1,0.07,21,11,0,0,29,0.6,162,20,null,false],
  ["Cereza","Cherry","fruta","['cerezas','guinda','picota']",63,1.1,16.0,0.2,2.1,12.8,0,0.04,7,3,0,0,13,0.4,222,11,63,false],
  ["Melocotón","Peach","fruta","['duraznos','nectarina']",39,0.9,9.5,0.3,1.5,8.4,0,0.05,7,16,0,0,6,0.3,190,9,42,false],
  ["Albaricoque","Apricot","fruta","['albaricoques','chabacano']",48,1.4,11.1,0.4,2.0,9.2,1,0.03,10,96,0,0,13,0.4,259,10,57,false],
  ["Ciruela","Plum","fruta","['ciruelas','ciruela roja']",46,0.7,11.4,0.3,1.4,9.9,0,0.06,10,17,0,0,6,0.2,157,7,40,false],
  ["Mango","Mango","fruta","['mangos','mango ataulfo']",60,0.8,15.0,0.4,1.6,13.7,1,0.06,36,54,0,0,11,0.2,168,10,51,false],
  ["Piña","Pineapple","fruta","['ananás','piñas']",50,0.5,13.1,0.1,1.4,9.9,1,0.02,48,3,0,0,13,0.3,109,12,59,false],
  ["Papaya","Papaya","fruta","['papayas','lechosa']",43,0.5,10.8,0.3,1.7,7.8,8,0.06,62,47,0,0,20,0.3,182,21,60,false],
  ["Kiwi","Kiwi","fruta","['kiwis','kiwifruit']",61,1.1,14.7,0.5,3.0,9.0,3,0.03,93,4,0,0,34,0.3,312,17,52,false],
  ["Sandía","Watermelon","fruta","['sandías','patilla']",30,0.6,7.6,0.2,0.4,6.2,1,0.03,8,28,0,0,7,0.2,112,10,72,false],
  ["Melón","Melon","fruta","['melones','melón cantalupo']",34,0.8,8.2,0.2,0.9,7.9,16,0.04,18,169,0,0,9,0.2,267,12,65,false],
  ["Uva","Grape","fruta","['uvas','uva blanca','uva negra']",69,0.7,18.1,0.2,0.9,15.5,2,0.05,4,3,0,0,10,0.4,191,7,59,false],
  ["Granada","Pomegranate","fruta","['granadas']",83,1.7,18.7,1.2,4.0,13.7,3,0.16,10,0,0,0,10,0.3,236,12,35,false],
  ["Coco","Coconut","fruta","['cocos','coco fresco']",354,3.3,15.2,33.5,9.0,6.2,20,29.7,4,0,0,0,14,2.4,356,32,null,false],
  ["Dátil","Date","fruta","['dátiles','dátil seco']",282,2.5,75.0,0.4,8.0,63.4,2,0.14,0,7,0,0,39,1.0,656,43,42,false],
  ["Pasa","Raisin","fruta","['pasas','uvas pasas']",299,3.1,79.2,0.5,3.7,59.2,11,0.17,3,0,0,0,50,1.9,749,32,64,false],
  // CARNES
  ["Pollo (pechuga)","Chicken breast","carne","['pechuga de pollo','pollo sin piel']",165,31.0,0,3.6,0,0,74,1.01,0,6,0.1,0.3,15,1.0,256,29,null,false],
  ["Pollo (muslo)","Chicken thigh","carne","['muslo de pollo','contramuslo']",209,26.0,0,11.0,0,0,88,3.03,0,18,0.1,0.3,12,1.3,220,23,null,false],
  ["Ternera (filete)","Beef steak","carne","['filete de ternera','solomillo de ternera']",250,26.1,0,15.4,0,0,72,5.9,0,0,0.1,2.6,18,2.7,318,21,null,false],
  ["Ternera (picada)","Ground beef","carne","['carne picada de ternera','carne molida']",254,17.2,0,20.0,0,0,75,7.7,0,0,0.1,2.4,18,2.1,270,17,null,false],
  ["Cerdo (lomo)","Pork loin","carne","['lomo de cerdo']",242,27.3,0,14.0,0,0,62,5.2,0,2,0.7,0.7,19,1.0,423,28,null,false],
  ["Cerdo (costilla)","Pork ribs","carne","['costillas de cerdo']",292,19.9,0,23.0,0,0,80,8.5,0,3,0.5,0.5,23,1.4,321,22,null,false],
  ["Cordero (pierna)","Lamb leg","carne","['pierna de cordero']",282,24.5,0,19.5,0,0,77,8.8,0,0,0.2,2.4,17,2.1,310,24,null,false],
  ["Pavo (pechuga)","Turkey breast","carne","['pechuga de pavo']",157,29.9,0,3.6,0,0,70,1.1,0,0,0.1,0.3,15,1.4,298,32,null,false],
  ["Conejo","Rabbit","carne","['conejo entero','conejo de granja']",197,29.1,0,8.1,0,0,47,2.4,0,0,0.4,7.2,20,2.3,330,25,null,false],
  ["Jamón serrano","Serrano ham","carne","['jamón curado','jamón ibérico']",241,30.5,0.5,13.0,0,0.5,2483,4.5,0,0,0,0.4,11,1.8,377,24,null,true],
  ["Jamón cocido","Cooked ham","carne","['jamón york','jamón dulce']",107,17.0,1.5,3.9,0,1.5,1200,1.3,0,0,0,0.3,6,1.0,287,17,null,true],
  ["Chorizo","Chorizo","carne","['chorizo fresco','chorizo curado']",455,24.1,1.9,39.0,0,1.9,1235,14.5,0,0,0,0.4,8,1.4,356,17,null,true],
  ["Salchicha","Sausage","carne","['salchichas','frankfurt']",290,12.0,3.0,26.0,0,2.0,950,9.5,0,0,0,0.3,8,1.0,180,12,null,true],
  ["Bacon","Bacon","carne","['tocino ahumado','beicon']",541,37.0,0.7,43.0,0,0.7,1717,14.6,0,0,0.1,0.5,6,1.1,565,24,null,true],
  ["Panceta","Pancetta","carne","['panceta fresca','tocino']",518,9.3,0,53.0,0,0,1100,19.0,0,0,0,0.2,5,0.5,200,12,null,false],
  // PESCADOS
  ["Salmón","Salmon","pescado","['salmón atlántico','salmón fresco']",208,20.4,0,13.4,0,0,59,3.05,0,12,11.1,3.2,12,0.3,363,27,null,false],
  ["Atún","Tuna","pescado","['atún fresco','atún rojo']",144,23.3,0,5.0,0,0,47,1.3,0,18,4.0,2.5,8,1.0,323,31,null,false],
  ["Atún en lata","Canned tuna","pescado","['atún en aceite','atún al natural']",116,25.5,0,1.0,0,0,396,0.3,0,18,4.0,2.5,8,1.0,323,31,null,true],
  ["Bacalao","Cod","pescado","['bacalao fresco','bacalao salado']",82,17.8,0,0.7,0,0,54,0.14,0,10,1.0,0.9,16,0.4,413,32,null,false],
  ["Merluza","Hake","pescado","['merluza fresca','pescadilla']",86,17.2,0,1.9,0,0,72,0.37,0,15,0.5,1.0,57,0.9,302,27,null,false],
  ["Lubina","Sea bass","pescado","['lubina fresca','robalo']",97,18.4,0,2.5,0,0,68,0.5,0,15,5.0,1.0,10,0.3,256,25,null,false],
  ["Dorada","Sea bream","pescado","['dorada fresca','pargo']",96,18.0,0,2.7,0,0,65,0.5,0,15,5.0,1.0,10,0.3,250,25,null,false],
  ["Sardina","Sardine","pescado","['sardinas frescas']",208,24.6,0,11.5,0,0,307,1.5,0,24,4.8,8.9,382,2.9,397,39,null,false],
  ["Caballa","Mackerel","pescado","['caballa fresca','verdel']",205,18.6,0,13.9,0,0,90,3.3,0,50,16.1,8.7,12,1.6,314,76,null,false],
  ["Boquerón","Anchovy","pescado","['boquerones','anchoas']",131,20.4,0,5.1,0,0,104,1.2,0,15,0.5,0.6,147,3.2,383,41,null,false],
  ["Trucha","Trout","pescado","['trucha arcoíris']",119,20.8,0,3.5,0,0,52,0.7,0,15,7.3,3.5,67,0.4,481,26,null,false],
  ["Gambas","Shrimp","pescado","['gambas frescas','langostinos','camarones']",106,20.1,0.9,1.7,0,0,111,0.3,0,54,0,1.1,70,2.4,259,37,null,false],
  ["Langostino","King prawn","pescado","['langostinos frescos','gambón']",106,20.1,0.9,1.7,0,0,111,0.3,0,54,0,1.1,70,2.4,259,37,null,false],
  ["Mejillón","Mussel","pescado","['mejillones frescos']",86,11.9,3.7,2.2,0,0,286,0.4,0,48,0,12.0,26,3.9,268,34,null,false],
  ["Calamar","Squid","pescado","['calamares frescos']",92,15.6,3.1,1.4,0,0,44,0.4,0,0,0,1.3,32,0.7,246,33,null,false],
  ["Pulpo","Octopus","pescado","['pulpo fresco','pulpo cocido']",82,14.9,2.2,1.0,0,0,230,0.3,0,0,0,20.0,53,5.3,350,30,null,false],
  ["Salmón ahumado","Smoked salmon","pescado","['salmón ahumado frío']",117,18.3,0,4.3,0,0,784,0.9,0,12,11.1,3.2,12,0.3,363,27,null,true],
  ["Anchoa en lata","Canned anchovy","pescado","['anchoas en aceite']",210,28.9,0,10.0,0,0,3668,2.2,0,0,0,0.6,232,4.6,544,69,null,true],
  // LÁCTEOS Y HUEVOS
  ["Huevo","Egg","lácteo","['huevos','huevo de gallina']",155,12.6,1.1,10.6,0,1.1,124,3.27,0,149,2.0,1.1,56,1.8,138,12,null,false],
  ["Clara de huevo","Egg white","lácteo","['claras de huevo','albúmina']",52,10.9,0.7,0.2,0,0.7,166,0.05,0,0,0,0,7,0.1,163,11,null,false],
  ["Yema de huevo","Egg yolk","lácteo","['yemas de huevo']",322,15.9,3.6,26.5,0,0.6,48,7.32,0,381,5.4,2.5,129,2.7,109,5,null,false],
  ["Leche entera","Whole milk","lácteo","['leche de vaca entera']",61,3.2,4.8,3.3,0,5.1,43,2.1,1,28,0.1,0.4,113,0.1,150,10,null,false],
  ["Leche semidesnatada","Semi-skimmed milk","lácteo","['leche semi']",46,3.4,4.9,1.6,0,5.1,44,1.0,1,20,0.1,0.4,120,0.1,150,10,null,false],
  ["Leche desnatada","Skimmed milk","lácteo","['leche 0%']",35,3.4,5.0,0.1,0,5.0,44,0.07,1,5,0.1,0.4,122,0.1,150,10,null,false],
  ["Leche de almendras","Almond milk","lácteo","['bebida de almendras']",17,0.6,0.7,1.1,0.2,0.4,72,0.08,0,0,0,0,184,0.4,67,6,null,false],
  ["Leche de avena","Oat milk","lácteo","['bebida de avena']",45,1.0,6.6,1.5,0.8,4.0,52,0.2,0,0,0,0,120,0.2,58,3,null,false],
  ["Leche de soja","Soy milk","lácteo","['bebida de soja']",54,3.3,6.3,1.8,0.6,3.8,51,0.26,0,0,0,0,25,0.5,118,18,null,false],
  ["Yogur natural","Plain yogurt","lácteo","['yogur entero','yogur natural sin azúcar']",59,3.5,4.7,3.3,0,4.7,36,2.1,1,27,0.1,0.4,121,0.1,155,11,null,false],
  ["Yogur griego","Greek yogurt","lácteo","['yogur griego natural','yogur griego 0%']",97,9.0,3.6,5.0,0,3.6,47,3.3,0,0,0.1,0.4,110,0.1,141,11,null,false],
  ["Queso fresco","Fresh cheese","lácteo","['queso fresco batido','queso tipo burgos']",98,12.4,3.3,4.3,0,3.3,290,2.8,0,52,0.1,0.4,150,0.1,104,8,null,false],
  ["Queso mozzarella","Mozzarella","lácteo","['mozzarella fresca','mozzarella de búfala']",280,28.1,2.2,17.1,0,1.0,627,10.9,0,149,0.4,2.3,505,0.5,76,20,null,false],
  ["Queso parmesano","Parmesan","lácteo","['parmesano','queso rallado']",431,38.5,3.2,29.0,0,0.8,1529,18.6,0,74,0.5,2.3,1184,0.8,92,44,null,false],
  ["Queso manchego","Manchego cheese","lácteo","['queso manchego curado']",392,26.3,0.5,31.5,0,0.5,1200,20.2,0,285,0.5,2.0,760,0.5,95,35,null,false],
  ["Queso cheddar","Cheddar","lácteo","['cheddar']",403,24.9,1.3,33.1,0,0.5,621,21.1,0,265,0.6,1.1,721,0.7,98,28,null,false],
  ["Queso ricotta","Ricotta","lácteo","['ricotta','requesón italiano']",174,11.3,3.0,13.0,0,0.3,84,8.3,0,117,0.2,0.3,207,0.4,105,11,null,false],
  ["Requesón","Cottage cheese","lácteo","['queso cottage']",98,11.1,3.4,4.3,0,2.7,364,1.7,0,37,0.1,0.4,83,0.1,104,8,null,false],
  ["Nata líquida","Heavy cream","lácteo","['nata para cocinar','crema de leche']",337,2.1,2.8,35.1,0,2.8,38,21.9,0,305,0.5,0.2,65,0.1,97,7,null,false],
  ["Mantequilla","Butter","lácteo","['mantequilla sin sal']",717,0.9,0.1,81.1,0,0.1,11,51.4,0,684,1.5,0.2,24,0.0,24,2,null,false],
  ["Kéfir","Kefir","lácteo","['kéfir de leche']",61,3.3,4.5,3.5,0,4.5,40,2.2,0,28,0.1,0.4,120,0.1,150,10,null,false],
  ["Queso crema","Cream cheese","lácteo","['queso philadelphia']",342,6.2,4.1,33.2,0,3.2,321,18.8,0,308,0.3,0.2,98,0.1,138,9,null,true],
  // CEREALES
  ["Arroz blanco","White rice","cereal","['arroz','arroz largo']",365,7.1,80.0,0.7,1.3,0,5,0.2,0,0,0,0,9,0.8,115,25,64,false],
  ["Arroz integral","Brown rice","cereal","['arroz integral']",370,7.9,77.2,2.9,3.5,0,7,0.6,0,0,0,0,33,1.8,268,143,55,false],
  ["Arroz basmati","Basmati rice","cereal","['arroz basmati blanco']",365,7.1,80.0,0.7,1.3,0,5,0.2,0,0,0,0,9,0.8,115,25,58,false],
  ["Pasta (espagueti)","Spaghetti","cereal","['espaguetis','pasta italiana']",371,13.0,74.7,1.5,2.7,2.7,6,0.3,0,0,0,0,21,3.3,215,53,49,false],
  ["Pasta integral","Whole wheat pasta","cereal","['pasta integral seca']",348,13.4,68.8,2.5,8.0,2.7,8,0.5,0,0,0,0,42,3.9,277,143,42,false],
  ["Pan blanco","White bread","cereal","['pan de molde','pan baguette']",265,9.0,49.0,3.2,2.7,5.0,491,0.7,0,0,0,0,100,2.7,115,26,75,true],
  ["Pan integral","Whole wheat bread","cereal","['pan integral de molde']",247,13.0,41.0,4.2,7.0,5.0,472,0.9,0,0,0,0,107,3.5,248,77,51,false],
  ["Pan de centeno","Rye bread","cereal","['pumpernickel']",259,8.5,48.3,3.3,5.8,3.9,603,0.7,0,0,0,0,73,2.8,166,40,58,false],
  ["Harina de trigo","Wheat flour","cereal","['harina blanca','harina de fuerza']",364,10.3,76.3,1.0,2.7,0.3,2,0.2,0,0,0,0,15,1.2,107,22,85,false],
  ["Harina integral","Whole wheat flour","cereal","['harina integral de trigo']",340,13.7,72.0,1.9,10.7,0.4,5,0.3,0,0,0,0,34,3.9,405,138,69,false],
  ["Avena","Oats","cereal","['copos de avena','avena en hojuelas']",389,16.9,66.3,6.9,10.6,0,2,1.22,0,0,0,0,54,4.7,429,177,55,false],
  ["Quinoa","Quinoa","cereal","['quinua']",368,14.1,64.2,6.1,7.0,0,5,0.7,0,1,0,0,47,4.6,563,197,53,false],
  ["Cuscús","Couscous","cereal","['cous cous','sémola de trigo']",376,12.8,77.4,0.6,5.0,0.5,10,0.1,0,0,0,0,24,1.1,166,44,65,false],
  ["Bulgur","Bulgur wheat","cereal","['trigo bulgur']",342,12.3,75.9,1.3,18.3,0.4,17,0.2,0,0,0,0,35,2.5,410,164,48,false],
  ["Espelta","Spelt","cereal","['harina de espelta']",338,14.6,70.2,2.4,10.7,0,8,0.4,0,0,0,0,27,4.4,388,136,54,false],
  ["Trigo sarraceno","Buckwheat","cereal","['alforfón']",343,13.3,71.5,3.4,10.0,0,1,0.7,0,0,0,0,18,2.2,460,231,54,false],
  ["Almidón de maíz","Cornstarch","cereal","['maicena','fécula de maíz']",381,0.3,91.3,0.1,0.9,0,9,0.02,0,0,0,0,2,0.5,3,3,85,false],
  // LEGUMBRES
  ["Lentejas","Lentils","legumbre","['lentejas pardinas','lentejas rojas']",353,25.8,60.1,1.1,30.5,2.0,6,0.2,4,39,0,0,56,7.5,955,122,32,false],
  ["Garbanzos","Chickpeas","legumbre","['garbanzo','garbanzos cocidos']",364,19.3,60.7,6.0,17.4,10.7,24,0.6,4,67,0,0,105,6.2,875,115,28,false],
  ["Alubias blancas","White beans","legumbre","['judías blancas','frijoles blancos']",333,23.4,60.3,0.8,15.2,2.1,16,0.2,0,0,0,0,240,10.4,1795,190,31,false],
  ["Alubias negras","Black beans","legumbre","['frijoles negros','judías negras']",341,21.6,62.4,1.4,15.5,2.1,5,0.4,0,0,0,0,123,5.0,1483,171,30,false],
  ["Alubias rojas","Kidney beans","legumbre","['judías rojas','frijoles rojos']",337,22.5,61.3,0.8,15.2,2.1,24,0.2,0,0,0,0,143,8.2,1406,140,29,false],
  ["Soja","Soybeans","legumbre","['soja amarilla','habas de soja']",446,36.5,30.2,19.9,9.3,7.3,2,2.9,6,1,0,0,277,15.7,1797,280,15,false],
  ["Edamame","Edamame","legumbre","['soja verde']",121,11.9,8.9,5.2,5.2,2.2,6,0.8,6,18,0,0,63,2.3,436,64,null,false],
  ["Habas","Fava beans","legumbre","['habas frescas','habas secas']",341,26.1,58.3,1.5,25.0,5.7,13,0.3,1,3,0,0,103,6.7,1062,192,null,false],
  ["Tofu","Tofu","legumbre","['tofu firme','tofu blando']",76,8.1,1.9,4.8,0.3,0.7,7,0.7,0,0,0,0,350,5.4,121,30,null,false],
  ["Tempeh","Tempeh","legumbre","['tempeh de soja']",193,18.5,9.4,10.8,0,0,9,2.2,0,0,0,0.1,111,2.7,412,81,null,false],
  ["Cacahuete","Peanut","legumbre","['maní','cacahuetes']",567,25.8,16.1,49.2,8.5,4.7,18,6.8,0,0,0,0,92,4.6,705,168,14,false],
  ["Mantequilla de cacahuete","Peanut butter","legumbre","['crema de cacahuete']",588,25.1,20.1,50.4,6.0,9.2,441,10.0,0,0,0,0,49,1.7,558,154,null,true],
  // FRUTOS SECOS Y SEMILLAS
  ["Almendra","Almond","fruto_seco","['almendras','almendras crudas']",579,21.2,21.6,49.9,12.5,4.4,1,3.8,0,1,0,0,264,3.7,733,270,null,false],
  ["Nuez","Walnut","fruto_seco","['nueces','nuez de Castilla']",654,15.2,13.7,65.2,6.7,2.6,2,6.1,1,1,0,0,98,2.9,441,158,null,false],
  ["Avellana","Hazelnut","fruto_seco","['avellanas']",628,15.0,16.7,60.8,9.7,4.3,0,4.5,6,1,0,0,114,4.7,680,163,null,false],
  ["Pistacho","Pistachio","fruto_seco","['pistachos']",562,20.2,27.5,45.3,10.3,7.7,1,5.6,5,26,0,0,105,3.9,1025,121,null,false],
  ["Anacardo","Cashew","fruto_seco","['anacardos','nuez de cajú']",553,18.2,30.2,43.9,3.3,5.9,12,7.8,1,0,0,0,37,6.7,660,292,null,false],
  ["Piñón","Pine nut","fruto_seco","['piñones']",673,13.7,13.1,68.4,3.7,3.6,2,4.9,0,1,0,0,16,5.5,597,251,null,false],
  ["Castaña","Chestnut","fruto_seco","['castañas frescas']",245,3.2,53.0,2.2,5.1,10.6,3,0.4,43,1,0,0,29,1.0,592,32,60,false],
  ["Semilla de chía","Chia seed","semilla","['chía']",486,16.5,42.1,30.7,34.4,0,16,3.3,1,54,0,0,631,7.7,407,335,null,false],
  ["Semilla de lino","Flaxseed","semilla","['linaza','lino dorado']",534,18.3,28.9,42.2,27.3,1.6,30,3.7,1,0,0,0,255,5.7,813,392,null,false],
  ["Semilla de girasol","Sunflower seed","semilla","['pipas de girasol']",584,20.8,20.0,51.5,8.6,2.6,9,4.5,1,3,0,0,78,5.3,645,325,null,false],
  ["Semilla de calabaza","Pumpkin seed","semilla","['pipas de calabaza','pepitas']",559,30.2,10.7,49.1,6.0,1.4,7,8.7,2,16,0,0,46,8.8,809,592,null,false],
  ["Semilla de sésamo","Sesame seed","semilla","['sésamo','ajonjolí']",573,17.7,23.5,49.7,11.8,0.3,11,7.0,0,0,0,0,975,14.6,468,351,null,false],
  // ACEITES
  ["Aceite de oliva","Olive oil","aceite","['aceite de oliva virgen extra','AOVE']",884,0,0,100.0,0,0,2,13.8,0,0,0,0,1,0.1,1,0,null,false],
  ["Aceite de girasol","Sunflower oil","aceite","['aceite de girasol refinado']",884,0,0,100.0,0,0,0,10.1,0,0,0,0,0,0.1,0,0,null,false],
  ["Aceite de coco","Coconut oil","aceite","['aceite de coco virgen']",862,0,0,100.0,0,0,0,86.5,0,0,0,0,1,0.1,0,0,null,false],
  ["Aceite de sésamo","Sesame oil","aceite","['aceite de ajonjolí']",884,0,0,100.0,0,0,0,14.2,0,0,0,0,0,0.1,0,0,null,false],
  // CONDIMENTOS Y ESPECIAS
  ["Sal","Salt","condimento","['sal común','sal marina']",0,0,0,0,0,0,38758,0,0,0,0,0,24,0.3,8,1,null,false],
  ["Pimienta negra","Black pepper","condimento","['pimienta','pimienta molida']",251,10.4,63.9,3.3,25.3,0.6,20,1.4,0,27,0,0,443,9.7,1329,171,null,false],
  ["Pimentón","Paprika","condimento","['pimentón dulce','pimentón picante','pimentón ahumado']",282,14.1,53.9,12.9,34.9,10.3,68,1.9,0,3142,0,0,229,21.1,2344,178,null,false],
  ["Comino","Cumin","condimento","['comino molido']",375,17.8,44.2,22.3,10.5,2.3,168,1.5,8,64,0,0,931,66.4,1788,366,null,false],
  ["Cúrcuma","Turmeric","condimento","['cúrcuma molida']",354,7.8,64.9,9.9,21.1,3.2,38,3.1,26,0,0,0,183,41.4,2080,193,null,false],
  ["Canela","Cinnamon","condimento","['canela molida','canela en rama']",247,3.9,80.6,1.2,53.1,2.2,10,0.3,3,15,0,0,1002,8.3,431,60,null,false],
  ["Orégano","Oregano","condimento","['orégano seco']",265,9.0,68.9,4.3,42.5,4.1,25,1.6,2,85,0,0,1597,36.8,1260,270,null,false],
  ["Albahaca","Basil","condimento","['albahaca fresca','albahaca seca']",23,3.2,2.7,0.6,1.6,0.3,4,0.3,18,264,0,0,177,3.2,295,64,null,false],
  ["Romero","Rosemary","condimento","['romero fresco','romero seco']",131,3.3,20.7,5.9,14.1,0,26,2.8,22,146,0,0,317,6.7,668,91,null,false],
  ["Tomillo","Thyme","condimento","['tomillo fresco','tomillo seco']",101,5.6,24.5,1.7,14.0,0,9,0.5,50,238,0,0,405,17.5,609,160,null,false],
  ["Perejil","Parsley","condimento","['perejil fresco','perejil seco']",36,3.0,6.3,0.8,3.3,0.9,56,0.1,133,421,0,0,138,6.2,554,50,null,false],
  ["Cilantro","Coriander","condimento","['cilantro fresco']",23,2.1,3.7,0.5,2.8,0.9,46,0.1,27,337,0,0,67,1.8,521,26,null,false],
  ["Jengibre","Ginger","condimento","['jengibre fresco','raíz de jengibre']",80,1.8,17.8,0.8,2.0,1.7,13,0.2,5,0,0,0,16,0.6,415,43,null,false],
  ["Mostaza","Mustard","condimento","['mostaza de Dijon','mostaza amarilla']",66,4.4,5.8,3.6,3.2,2.9,1104,0.2,1,0,0,0,58,1.6,152,48,null,true],
  ["Vinagre","Vinegar","condimento","['vinagre de vino','vinagre de manzana']",18,0,0.9,0,0,0.9,8,0,0,0,0,0,6,0.5,100,5,null,false],
  ["Salsa de soja","Soy sauce","condimento","['tamari']",53,8.1,4.9,0.1,0.8,0.4,5493,0,0,0,0,0,18,2.4,435,40,null,true],
  ["Ketchup","Ketchup","condimento","['catsup','salsa de tomate ketchup']",112,1.5,26.0,0.1,0.3,22.0,907,0.02,0,42,0,0,14,0.9,281,15,null,true],
  ["Mayonesa","Mayonnaise","condimento","['mahonesa','mayo']",680,1.0,0.6,75.0,0,0.6,635,11.5,0,49,0,0,10,0.4,34,1,null,true],
  ["Salsa de tomate","Tomato sauce","condimento","['tomate frito','sofrito']",60,1.5,9.0,2.5,1.5,7.0,400,0.4,10,40,0,0,15,0.8,300,15,null,true],
  ["Miso","Miso","condimento","['pasta de miso','miso blanco']",199,11.7,26.5,6.0,5.4,6.2,3728,0.9,0,85,0,0.1,57,2.5,210,48,null,true],
  ["Curry en polvo","Curry powder","condimento","['curry molido']",325,14.3,55.8,14.0,33.2,2.8,52,1.6,0,0,0,0,478,29.6,1543,254,null,false],
  // AZÚCARES
  ["Azúcar blanco","White sugar","azucar","['azúcar refinado']",387,0,99.8,0,0,99.8,1,0,0,0,0,0,1,0.1,3,0,65,true],
  ["Azúcar moreno","Brown sugar","azucar","['azúcar moreno']",377,0,97.3,0,0,96.2,28,0,0,0,0,0,83,1.9,346,29,64,false],
  ["Miel","Honey","azucar","['miel de abeja','miel de flores']",304,0.3,82.4,0,0.2,82.1,4,0,0.5,0,0,0,6,0.4,52,2,61,false],
  ["Sirope de agave","Agave syrup","azucar","['néctar de agave']",310,0.1,76.0,0.5,0,68.0,4,0.1,0,0,0,0,1,0.4,4,1,15,false],
  ["Sirope de arce","Maple syrup","azucar","['jarabe de arce']",260,0,67.0,0.1,0,60.5,12,0,0,0,0,0,102,0.7,212,14,54,false],
  ["Stevia","Stevia","azucar","['estevia']",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,false],
  // CONSERVAS
  ["Tomate triturado","Crushed tomato","conserva","['tomate natural triturado','tomate en lata']",24,1.2,4.5,0.3,1.5,3.5,200,0.04,12,40,0,0,11,1.1,237,14,null,true],
  ["Tomate concentrado","Tomato paste","conserva","['concentrado de tomate']",82,4.3,18.9,0.5,4.1,12.2,59,0.07,22,156,0,0,36,3.9,1014,52,null,true],
  ["Leche de coco (lata)","Coconut milk (canned)","conserva","['leche de coco enlatada']",230,2.3,5.5,23.8,2.2,3.3,15,21.1,1,0,0,0,16,3.3,263,37,null,true],
  ["Garbanzos cocidos (lata)","Canned chickpeas","conserva","['garbanzos en lata']",139,7.3,22.5,2.6,6.2,3.9,240,0.3,1,26,0,0,48,2.9,291,48,null,true],
  ["Maíz en lata","Canned corn","conserva","['maíz dulce en lata']",86,2.9,18.7,1.2,1.8,6.3,270,0.2,6,11,0,0,2,0.5,270,37,null,true],
  // CALDOS
  ["Caldo de pollo","Chicken broth","caldo","['caldo de pollo casero']",15,1.5,0.8,0.5,0,0.5,350,0.1,0,0,0,0.1,5,0.3,100,5,null,false],
  ["Caldo de verduras","Vegetable broth","caldo","['caldo vegetal']",12,0.5,2.5,0.2,0.3,1.5,400,0.03,5,10,0,0,8,0.2,150,8,null,false],
  ["Caldo de carne","Beef broth","caldo","['caldo de ternera']",17,2.0,0.8,0.5,0,0.5,450,0.2,0,0,0,0.3,8,0.5,120,8,null,false],
  // OTROS
  ["Cacao en polvo","Cocoa powder","otro","['cacao puro en polvo']",228,19.6,57.9,13.7,37.0,1.8,21,8.1,0,0,0,0,128,13.9,1524,499,null,false],
  ["Chocolate negro","Dark chocolate","otro","['chocolate 70%','chocolate amargo']",598,7.8,45.9,42.6,10.9,24.0,20,24.5,0,2,0,0,73,11.9,715,228,23,false],
  ["Vainilla","Vanilla","condimento","['extracto de vainilla','vaina de vainilla']",288,0.1,12.7,0.1,0,12.7,9,0.01,0,0,0,0,11,0.1,148,12,null,false],
  ["Levadura de panadería","Baker's yeast","condimento","['levadura fresca','levadura seca']",325,40.4,41.2,7.6,26.9,0,51,1.0,0,0,0,0,80,3.9,955,54,null,false],
  ["Bicarbonato sódico","Baking soda","condimento","['bicarbonato de sodio']",0,0,0,0,0,0,27360,0,0,0,0,0,0,0,0,0,null,false],
  ["Gelatina","Gelatin","condimento","['gelatina en polvo']",335,85.6,0,0.1,0,0,196,0.05,0,0,0,0,11,0.5,1,4,null,true],
  ["Espirulina","Spirulina","suplemento","['espirulina en polvo']",290,57.5,23.9,7.7,3.6,3.1,1048,2.7,10,29,0,0,120,28.5,1363,195,null,false],
  ["Levadura nutricional","Nutritional yeast","suplemento","['levadura de cerveza nutricional']",325,50.0,37.5,5.0,25.0,0,50,0.7,0,0,0,0,30,5.0,2000,231,null,false],
  ["Proteína de suero","Whey protein","proteína","['proteína whey']",400,80.0,8.0,5.0,0,5.0,200,3.0,0,0,0,1.0,200,1.0,500,50,null,true],
  ["Seitán","Seitan","proteína","['gluten de trigo']",370,75.0,14.0,1.9,0.6,0,400,0.3,0,0,0,0,142,5.0,50,20,null,false],
  ["Vino blanco","White wine","bebida","['vino blanco seco']",82,0.1,2.6,0,0,0.6,9,0,0,0,0,0,9,0.4,71,10,null,false],
  ["Vino tinto","Red wine","bebida","['vino tinto seco']",85,0.1,2.6,0,0,0.6,4,0,0,0,0,0,8,0.5,127,12,null,false],
  ["Agua","Water","bebida","['agua mineral','agua del grifo']",0,0,0,0,0,0,10,0,0,0,0,0,15,0,1,1,null,false],
  ["Café","Coffee","bebida","['café solo','café espresso']",2,0.3,0,0,0,0,2,0,0,0,0,0,2,0.1,49,3,null,false],
  ["Té verde","Green tea","bebida","['té verde infusión']",1,0.2,0.2,0,0,0,1,0,0,0,0,0,0,0.1,8,0,null,false],
  ["Zumo de naranja","Orange juice","bebida","['zumo de naranja natural']",45,0.7,10.4,0.2,0.2,8.4,1,0.04,50,11,0,0,11,0.2,200,11,50,false],
  ["Masa de pizza","Pizza dough","cereal","['masa para pizza']",270,8.0,52.0,3.5,2.0,1.5,400,0.5,0,0,0,0,20,2.5,100,20,null,false],
  ["Hojaldre","Puff pastry","cereal","['masa de hojaldre']",558,7.0,46.0,40.0,1.5,1.5,430,25.0,0,0,0,0,15,2.0,80,10,null,true],
  ["Tortilla de trigo","Wheat tortilla","cereal","['tortilla de harina','wrap']",306,8.0,52.0,7.0,3.0,2.5,600,2.0,0,0,0,0,100,3.0,150,25,null,true],
  ["Tortilla de maíz","Corn tortilla","cereal","['tortilla mexicana']",218,5.7,46.0,2.7,6.3,0.9,11,0.4,0,0,0,0,46,2.4,157,58,null,false],
  ["Tahini","Tahini","semilla","['pasta de sésamo','crema de sésamo']",595,17.0,21.2,53.8,9.3,0.5,115,7.5,0,0,0,0,426,8.9,414,95,null,false],
  ["Alcaparra","Caper","condimento","['alcaparras','alcaparrones']",23,2.4,4.9,0.9,3.2,0.4,2964,0.12,4,13,0,0,40,1.7,40,33,null,false],
  ["Eneldo","Dill","condimento","['eneldo fresco','eneldo seco']",43,3.5,7.0,1.1,2.1,0,61,0.1,85,386,0,0,208,6.6,738,55,null,false],
  ["Menta","Mint","condimento","['menta fresca','hierbabuena']",70,3.8,14.9,0.9,8.0,0,31,0.2,31,212,0,0,243,5.1,569,80,null,false],
  ["Laurel","Bay leaf","condimento","['hojas de laurel']",313,7.6,74.9,8.4,26.3,0,23,2.3,47,309,0,0,834,43.0,529,120,null,false],
  ["Azafrán","Saffron","condimento","['azafrán en hebras']",310,11.4,65.4,5.9,3.9,0,148,1.6,81,27,0,0,111,11.1,1724,264,null,false],
  ["Nuez moscada","Nutmeg","condimento","['nuez moscada molida']",525,5.8,49.3,36.3,20.8,2.9,16,25.9,3,5,0,0,184,3.0,350,183,null,false],
  ["Clavo","Clove","condimento","['clavo de olor','clavo molido']",274,6.0,65.5,13.0,33.9,2.4,277,3.4,11,13,0,0,632,8.7,1102,264,null,false],
  ["Cardamomo","Cardamom","condimento","['cardamomo molido']",311,10.8,68.5,6.7,28.0,0,18,0.7,21,0,0,0,383,13.9,1119,229,null,false],
  ["Pimentón de la Vera","Smoked paprika","condimento","['pimentón ahumado de la Vera']",282,14.1,53.9,12.9,34.9,10.3,68,1.9,0,3142,0,0,229,21.1,2344,178,null,false],
  ["Hierbas provenzales","Herbes de Provence","condimento","['mezcla de hierbas provenzales']",259,12.0,64.0,7.0,40.0,0,50,1.5,0,100,0,0,500,20.0,900,150,null,false],
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log(`Insertando ${ingredients.length} ingredientes...`);
    await client.query("DELETE FROM ingredient_nutrition");
    
    let inserted = 0;
    const batchSize = 50;
    
    for (let i = 0; i < ingredients.length; i += batchSize) {
      const batch = ingredients.slice(i, i + batchSize);
      const values = batch.map((_, idx) => {
        const o = idx * 22;
        return `($${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6},$${o+7},$${o+8},$${o+9},$${o+10},$${o+11},$${o+12},$${o+13},$${o+14},$${o+15},$${o+16},$${o+17},$${o+18},$${o+19},$${o+20},$${o+21},$${o+22})`;
      }).join(",");
      
      const params = batch.flatMap(ing => [
        ing[0],ing[1],ing[2],ing[3],ing[4],ing[5],ing[6],ing[7],ing[8],ing[9],
        ing[10],ing[11],ing[12],ing[13],ing[14],ing[15],ing[16],ing[17],ing[18],ing[19],
        ing[20],ing[21]
      ]);
      
      await client.query(`
        INSERT INTO ingredient_nutrition 
          (name, "nameEn", category, aliases, calories, protein, carbs, fat, fiber, sugar, sodium, "saturatedFat", "vitaminC", "vitaminA", "vitaminD", "vitaminB12", calcium, iron, potassium, magnesium, "glycemicIndex", "isProcessed")
        VALUES ${values}
        ON CONFLICT DO NOTHING
      `, params);
      
      inserted += batch.length;
      console.log(`  ${inserted}/${ingredients.length} insertados`);
    }
    
    const { rows } = await client.query("SELECT COUNT(*) FROM ingredient_nutrition");
    console.log(`\n✅ Total en BD: ${rows[0].count} ingredientes`);
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
