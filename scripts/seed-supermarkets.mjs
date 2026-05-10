import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const now = new Date();

const merc = [
  [1001,'platanos-canarias','Plátanos de Canarias','1 kg',null,null,1,'Frutas y verduras',11,'Frutas','1.99','1.99',1.0,'kg','1.99 €/kg','kg'],
  [1002,'manzanas-golden','Manzanas Golden','1.5 kg',null,null,1,'Frutas y verduras',11,'Frutas','2.49','2.49',1.5,'kg','1.66 €/kg','kg'],
  [1003,'naranjas-zumo','Naranjas de zumo','2 kg',null,null,1,'Frutas y verduras',11,'Frutas','2.29','2.29',2.0,'kg','1.15 €/kg','kg'],
  [1004,'fresas','Fresas','500 g',null,null,1,'Frutas y verduras',11,'Frutas','1.99','1.99',0.5,'kg','3.98 €/kg','kg'],
  [1005,'arandanos','Arándanos','125 g',null,null,1,'Frutas y verduras',11,'Frutas','1.99','1.99',0.125,'kg','15.92 €/kg','kg'],
  [1006,'tomates-rama','Tomates en rama','1 kg',null,null,1,'Frutas y verduras',12,'Verduras','1.89','1.89',1.0,'kg','1.89 €/kg','kg'],
  [1007,'espinacas-bolsa','Espinacas baby','200 g',null,null,1,'Frutas y verduras',12,'Verduras','1.49','1.49',0.2,'kg','7.45 €/kg','kg'],
  [1008,'brocoli','Brócoli','500 g',null,null,1,'Frutas y verduras',12,'Verduras','1.29','1.29',0.5,'kg','2.58 €/kg','kg'],
  [1009,'zanahorias','Zanahorias','1 kg',null,null,1,'Frutas y verduras',12,'Verduras','0.99','0.99',1.0,'kg','0.99 €/kg','kg'],
  [1010,'pimiento-rojo','Pimientos rojos','1 kg',null,null,1,'Frutas y verduras',12,'Verduras','1.79','1.79',1.0,'kg','1.79 €/kg','kg'],
  [1011,'aguacate','Aguacate Hass','2 unidades',null,null,1,'Frutas y verduras',11,'Frutas','1.99','1.99',2.0,'ud','1.00 €/ud','ud'],
  [1012,'lechuga-iceberg','Lechuga iceberg','1 unidad',null,null,1,'Frutas y verduras',12,'Verduras','0.89','0.89',1.0,'ud','0.89 €/ud','ud'],
  [1013,'cebolla','Cebolla','1 kg',null,null,1,'Frutas y verduras',12,'Verduras','0.79','0.79',1.0,'kg','0.79 €/kg','kg'],
  [1014,'ajo','Ajo','250 g',null,null,1,'Frutas y verduras',12,'Verduras','0.69','0.69',0.25,'kg','2.76 €/kg','kg'],
  [1015,'pepino','Pepino','1 unidad',null,null,1,'Frutas y verduras',12,'Verduras','0.59','0.59',1.0,'ud','0.59 €/ud','ud'],
  [1016,'kale','Kale','150 g',null,null,1,'Frutas y verduras',12,'Verduras','1.89','1.89',0.15,'kg','12.60 €/kg','kg'],
  [1017,'pak-choi','Pak choi','200 g',null,null,1,'Frutas y verduras',12,'Verduras','1.69','1.69',0.2,'kg','8.45 €/kg','kg'],
  [1018,'boniato','Boniato','1 kg',null,null,1,'Frutas y verduras',12,'Verduras','1.49','1.49',1.0,'kg','1.49 €/kg','kg'],
  [2001,'pechuga-pollo','Pechuga de pollo fileteada','500 g',null,null,2,'Carne y pescado',21,'Pollo y pavo','4.99','4.99',0.5,'kg','9.98 €/kg','kg'],
  [2002,'contramuslos-pollo','Contramuslos de pollo','1 kg',null,null,2,'Carne y pescado',21,'Pollo y pavo','3.99','3.99',1.0,'kg','3.99 €/kg','kg'],
  [2003,'carne-picada-ternera','Carne picada de ternera','400 g',null,null,2,'Carne y pescado',22,'Ternera','3.99','3.99',0.4,'kg','9.98 €/kg','kg'],
  [2004,'lomo-cerdo','Lomo de cerdo','500 g',null,null,2,'Carne y pescado',23,'Cerdo','3.49','3.49',0.5,'kg','6.98 €/kg','kg'],
  [2005,'salmon-fresco','Salmón fresco en lomos','400 g',null,null,2,'Carne y pescado',24,'Pescado fresco','5.99','5.99',0.4,'kg','14.98 €/kg','kg'],
  [2006,'merluza-filetes','Filetes de merluza','400 g',null,null,2,'Carne y pescado',24,'Pescado fresco','4.99','4.99',0.4,'kg','12.48 €/kg','kg'],
  [2007,'atun-lata','Atún en aceite de oliva','3x80 g',null,null,2,'Carne y pescado',25,'Conservas de pescado','2.29','2.29',0.24,'kg','9.54 €/kg','kg'],
  [2008,'gambas-peladas','Gambas peladas congeladas','500 g',null,null,2,'Carne y pescado',26,'Marisco','4.99','4.99',0.5,'kg','9.98 €/kg','kg'],
  [3001,'leche-entera','Leche entera','1 L',null,null,3,'Lácteos y huevos',31,'Leche','0.99','0.99',1.0,'L','0.99 €/L','L'],
  [3002,'yogur-natural','Yogur natural sin azúcar','4x125 g',null,null,3,'Lácteos y huevos',32,'Yogures','0.89','0.89',0.5,'kg','1.78 €/kg','kg'],
  [3003,'queso-fresco','Queso fresco batido 0%','500 g',null,null,3,'Lácteos y huevos',33,'Quesos','1.49','1.49',0.5,'kg','2.98 €/kg','kg'],
  [3004,'huevos-camperos','Huevos camperos L','12 unidades',null,null,3,'Lácteos y huevos',34,'Huevos','2.49','2.49',12.0,'ud','0.21 €/ud','ud'],
  [3005,'mantequilla','Mantequilla sin sal','250 g',null,null,3,'Lácteos y huevos',35,'Mantequilla','1.79','1.79',0.25,'kg','7.16 €/kg','kg'],
  [3006,'queso-manchego','Queso manchego curado','200 g',null,null,3,'Lácteos y huevos',33,'Quesos','2.99','2.99',0.2,'kg','14.95 €/kg','kg'],
  [3007,'yogur-griego','Yogur griego natural','4x125 g',null,null,3,'Lácteos y huevos',32,'Yogures','1.29','1.29',0.5,'kg','2.58 €/kg','kg'],
  [4001,'arroz-largo','Arroz largo','1 kg',null,null,4,'Cereales y pan',41,'Arroz','1.09','1.09',1.0,'kg','1.09 €/kg','kg'],
  [4002,'arroz-integral','Arroz integral','1 kg',null,null,4,'Cereales y pan',41,'Arroz','1.39','1.39',1.0,'kg','1.39 €/kg','kg'],
  [4003,'pasta-espagueti','Espaguetis','500 g',null,null,4,'Cereales y pan',42,'Pasta','0.79','0.79',0.5,'kg','1.58 €/kg','kg'],
  [4004,'pan-integral','Pan de molde integral','500 g',null,null,4,'Cereales y pan',43,'Pan','1.39','1.39',0.5,'kg','2.78 €/kg','kg'],
  [4005,'avena','Copos de avena','500 g',null,null,4,'Cereales y pan',44,'Cereales','0.99','0.99',0.5,'kg','1.98 €/kg','kg'],
  [4006,'quinoa','Quinoa','500 g',null,null,4,'Cereales y pan',44,'Cereales','2.99','2.99',0.5,'kg','5.98 €/kg','kg'],
  [4007,'pan-centeno','Pan de centeno','400 g',null,null,4,'Cereales y pan',43,'Pan','1.89','1.89',0.4,'kg','4.73 €/kg','kg'],
  [5001,'garbanzos-cocidos','Garbanzos cocidos','400 g',null,null,5,'Conservas y legumbres',51,'Legumbres','0.89','0.89',0.4,'kg','2.23 €/kg','kg'],
  [5002,'lentejas-cocidas','Lentejas cocidas','400 g',null,null,5,'Conservas y legumbres',51,'Legumbres','0.79','0.79',0.4,'kg','1.98 €/kg','kg'],
  [5003,'alubias-blancas','Alubias blancas cocidas','400 g',null,null,5,'Conservas y legumbres',51,'Legumbres','0.79','0.79',0.4,'kg','1.98 €/kg','kg'],
  [5004,'tomate-triturado','Tomate triturado','500 g',null,null,5,'Conservas y legumbres',52,'Tomate','0.79','0.79',0.5,'kg','1.58 €/kg','kg'],
  [6001,'aceite-oliva-virgen','Aceite de oliva virgen extra','1 L',null,null,6,'Aceites y condimentos',61,'Aceites','5.99','5.99',1.0,'L','5.99 €/L','L'],
  [6002,'sal-marina','Sal marina fina','1 kg',null,null,6,'Aceites y condimentos',62,'Sal y especias','0.49','0.49',1.0,'kg','0.49 €/kg','kg'],
  [6003,'pimienta-negra','Pimienta negra molida','50 g',null,null,6,'Aceites y condimentos',62,'Sal y especias','0.99','0.99',0.05,'kg','19.80 €/kg','kg'],
  [6004,'tomate-frito','Tomate frito casero','350 g',null,null,6,'Aceites y condimentos',63,'Salsas','0.99','0.99',0.35,'kg','2.83 €/kg','kg'],
  [6005,'salsa-soja','Salsa de soja','200 mL',null,null,6,'Aceites y condimentos',63,'Salsas','1.49','1.49',0.2,'L','7.45 €/L','L'],
  [7001,'almendras','Almendras crudas','200 g',null,null,7,'Frutos secos y snacks',71,'Frutos secos','2.49','2.49',0.2,'kg','12.45 €/kg','kg'],
  [7002,'nueces','Nueces peladas','200 g',null,null,7,'Frutos secos y snacks',71,'Frutos secos','2.99','2.99',0.2,'kg','14.95 €/kg','kg'],
  [7003,'proteina-whey','Proteína whey chocolate','750 g',null,null,7,'Nutrición deportiva',72,'Proteínas','14.99','14.99',0.75,'kg','19.99 €/kg','kg'],
  [7004,'semillas-chia','Semillas de chía','200 g',null,null,7,'Frutos secos y snacks',73,'Semillas','2.49','2.49',0.2,'kg','12.45 €/kg','kg'],
  [8001,'agua-mineral','Agua mineral natural','8x1.5 L',null,null,8,'Bebidas',81,'Agua','2.99','2.99',12.0,'L','0.25 €/L','L'],
  [8002,'zumo-naranja','Zumo de naranja exprimido','1 L',null,null,8,'Bebidas',82,'Zumos','2.29','2.29',1.0,'L','2.29 €/L','L'],
  [9001,'salmon-congelado','Salmón noruego congelado','600 g',null,null,9,'Congelados',91,'Pescado congelado','6.99','6.99',0.6,'kg','11.65 €/kg','kg'],
  [9002,'verduras-salteadas','Verduras para saltear','750 g',null,null,9,'Congelados',92,'Verduras congeladas','2.49','2.49',0.75,'kg','3.32 €/kg','kg'],
  [9003,'edamame','Edamame congelado','400 g',null,null,9,'Congelados',92,'Verduras congeladas','2.29','2.29',0.4,'kg','5.73 €/kg','kg'],
];

const carr = [
  ['CF-001','Plátanos de Canarias','Carrefour',1.95,'1.95 €/kg',null,'Frutas y verduras','Frutas','1 kg',null],
  ['CF-002','Manzanas Fuji','Carrefour',2.39,'1.59 €/kg',null,'Frutas y verduras','Frutas','1.5 kg',null],
  ['CF-003','Tomates cherry','Carrefour',1.79,'3.58 €/kg',null,'Frutas y verduras','Verduras','500 g',null],
  ['CF-004','Espinacas frescas','Carrefour',1.59,'7.95 €/kg',null,'Frutas y verduras','Verduras','200 g',null],
  ['CF-005','Brócoli fresco','Carrefour',1.19,'2.38 €/kg',null,'Frutas y verduras','Verduras','500 g',null],
  ['CF-006','Aguacate Hass','Carrefour',2.29,'1.15 €/ud',null,'Frutas y verduras','Frutas','2 unidades',null],
  ['CF-007','Pimientos variados','Carrefour',1.99,'1.99 €/kg',null,'Frutas y verduras','Verduras','1 kg',null],
  ['CF-008','Zanahorias baby','Carrefour',1.29,'2.58 €/kg',null,'Frutas y verduras','Verduras','500 g',null],
  ['CF-009','Cebolla blanca','Carrefour',0.85,'0.85 €/kg',null,'Frutas y verduras','Verduras','1 kg',null],
  ['CF-010','Pechuga de pollo fileteada','Carrefour',5.49,'10.98 €/kg',null,'Carne y pescado','Pollo','500 g',null],
  ['CF-011','Salmón noruego fresco','Carrefour',6.99,'17.48 €/kg',null,'Carne y pescado','Pescado','400 g',null],
  ['CF-012','Carne picada mixta','Carrefour',3.79,'9.48 €/kg',null,'Carne y pescado','Ternera','400 g',null],
  ['CF-013','Atún claro en aceite','Carrefour',2.19,'9.13 €/kg',null,'Carne y pescado','Conservas','3x80 g',null],
  ['CF-014','Gambas peladas congeladas','Carrefour',4.99,'9.98 €/kg',null,'Carne y pescado','Marisco','500 g',null],
  ['CF-015','Lomo de cerdo','Carrefour',3.69,'7.38 €/kg',null,'Carne y pescado','Cerdo','500 g',null],
  ['CF-016','Merluza en filetes','Carrefour',5.29,'13.23 €/kg',null,'Carne y pescado','Pescado','400 g',null],
  ['CF-020','Leche semidesnatada','Carrefour',0.95,'0.95 €/L',null,'Lácteos y huevos','Leche','1 L',null],
  ['CF-021','Yogur griego natural','Carrefour',1.49,'2.98 €/kg',null,'Lácteos y huevos','Yogures','4x125 g',null],
  ['CF-022','Queso mozzarella','Carrefour',1.79,'7.16 €/kg',null,'Lácteos y huevos','Quesos','250 g',null],
  ['CF-023','Huevos ecológicos M','Carrefour Bio',3.29,'0.27 €/ud',null,'Lácteos y huevos','Huevos','12 unidades',null],
  ['CF-024','Queso feta griego','Carrefour',2.49,'9.96 €/kg',null,'Lácteos y huevos','Quesos','250 g',null],
  ['CF-025','Queso fresco batido 0%','Carrefour',1.45,'2.90 €/kg',null,'Lácteos y huevos','Quesos','500 g',null],
  ['CF-030','Arroz basmati','Carrefour',1.99,'1.99 €/kg',null,'Cereales y pan','Arroz','1 kg',null],
  ['CF-031','Pasta penne rigate','Carrefour',0.89,'1.78 €/kg',null,'Cereales y pan','Pasta','500 g',null],
  ['CF-032','Pan de molde sin corteza','Carrefour',1.29,'2.58 €/kg',null,'Cereales y pan','Pan','500 g',null],
  ['CF-033','Copos de avena integrales','Carrefour',1.09,'2.18 €/kg',null,'Cereales y pan','Cereales','500 g',null],
  ['CF-034','Quinoa blanca','Carrefour Bio',3.49,'6.98 €/kg',null,'Cereales y pan','Cereales','500 g',null],
  ['CF-035','Arroz integral','Carrefour',1.49,'1.49 €/kg',null,'Cereales y pan','Arroz','1 kg',null],
  ['CF-040','Garbanzos cocidos','Carrefour',0.85,'2.13 €/kg',null,'Conservas','Legumbres','400 g',null],
  ['CF-041','Lentejas pardinas cocidas','Carrefour',0.85,'2.13 €/kg',null,'Conservas','Legumbres','400 g',null],
  ['CF-042','Tomate triturado','Carrefour',0.69,'1.38 €/kg',null,'Conservas','Tomate','500 g',null],
  ['CF-043','Alubias blancas cocidas','Carrefour',0.85,'2.13 €/kg',null,'Conservas','Legumbres','400 g',null],
  ['CF-050','Aceite de oliva virgen extra','Carrefour',6.49,'6.49 €/L',null,'Aceites y condimentos','Aceites','1 L',null],
  ['CF-051','Vinagre de manzana','Carrefour',1.29,'2.58 €/L',null,'Aceites y condimentos','Vinagres','500 mL',null],
  ['CF-052','Salsa de soja','Carrefour',1.49,'4.97 €/L',null,'Aceites y condimentos','Salsas','300 mL',null],
  ['CF-060','Almendras tostadas sin sal','Carrefour',3.49,'17.45 €/kg',null,'Frutos secos','Frutos secos','200 g',null],
  ['CF-061','Mix de frutos secos','Carrefour',2.99,'14.95 €/kg',null,'Frutos secos','Frutos secos','200 g',null],
  ['CF-062','Semillas de chía','Carrefour Bio',2.49,'12.45 €/kg',null,'Frutos secos','Semillas','200 g',null],
  ['CF-063','Semillas de lino','Carrefour Bio',1.99,'9.95 €/kg',null,'Frutos secos','Semillas','200 g',null],
];

const lidl = [
  ['LD-001','Plátanos','Plátanos de Canarias 1 kg','Lidl',null,1.79,'1 kg','Frutas y verduras','/frutas-verduras/platanos',true],
  ['LD-002','Manzanas Gala','Manzanas Gala 1.5 kg','Lidl',null,2.19,'1.5 kg','Frutas y verduras','/frutas-verduras/manzanas',true],
  ['LD-003','Tomates rama','Tomates en rama 1 kg','Lidl',null,1.69,'1 kg','Frutas y verduras','/frutas-verduras/tomates',true],
  ['LD-004','Espinacas baby','Espinacas baby 200 g','Lidl',null,1.39,'200 g','Frutas y verduras','/frutas-verduras/espinacas',true],
  ['LD-005','Brócoli','Brócoli fresco 500 g','Lidl',null,1.09,'500 g','Frutas y verduras','/frutas-verduras/brocoli',true],
  ['LD-006','Aguacate','Aguacate Hass 2 unidades','Lidl',null,1.89,'2 unidades','Frutas y verduras','/frutas-verduras/aguacate',true],
  ['LD-007','Pimientos mixtos','Pimientos mixtos 750 g','Lidl',null,1.49,'750 g','Frutas y verduras','/frutas-verduras/pimientos',true],
  ['LD-008','Zanahorias','Zanahorias 1 kg','Lidl',null,0.89,'1 kg','Frutas y verduras','/frutas-verduras/zanahorias',true],
  ['LD-009','Cebolla','Cebolla 1 kg','Lidl',null,0.75,'1 kg','Frutas y verduras','/frutas-verduras/cebolla',true],
  ['LD-010','Pechuga de pollo','Pechuga de pollo fileteada 500 g','Lidl',null,4.79,'500 g','Carne y pescado','/carne/pechuga-pollo',true],
  ['LD-011','Salmón ahumado','Salmón ahumado noruego 100 g','Nixe',null,2.49,'100 g','Carne y pescado','/pescado/salmon-ahumado',true],
  ['LD-012','Atún en aceite','Atún en aceite de oliva 3x80 g','Nixe',null,2.09,'3x80 g','Carne y pescado','/pescado/atun',true],
  ['LD-013','Carne picada ternera','Carne picada de ternera 400 g','Lidl',null,3.69,'400 g','Carne y pescado','/carne/carne-picada',true],
  ['LD-014','Salmón fresco','Salmón noruego fresco 400 g','Nixe',null,5.99,'400 g','Carne y pescado','/pescado/salmon-fresco',true],
  ['LD-015','Gambas congeladas','Gambas peladas congeladas 500 g','Nixe',null,4.49,'500 g','Carne y pescado','/pescado/gambas',true],
  ['LD-020','Leche entera','Leche entera 1 L','Milbona',null,0.89,'1 L','Lácteos y huevos','/lacteos/leche',true],
  ['LD-021','Yogur natural','Yogur natural 4x125 g','Milbona',null,0.79,'4x125 g','Lácteos y huevos','/lacteos/yogur',true],
  ['LD-022','Queso fresco','Queso fresco batido 0% 500 g','Milbona',null,1.39,'500 g','Lácteos y huevos','/lacteos/queso-fresco',true],
  ['LD-023','Huevos camperos','Huevos camperos L 12 unidades','Lidl',null,2.29,'12 unidades','Lácteos y huevos','/lacteos/huevos',true],
  ['LD-024','Queso mozzarella','Queso mozzarella 125 g','Milbona',null,0.99,'125 g','Lácteos y huevos','/lacteos/mozzarella',true],
  ['LD-025','Queso manchego','Queso manchego curado 200 g','Milbona',null,2.79,'200 g','Lácteos y huevos','/lacteos/manchego',true],
  ['LD-030','Arroz largo','Arroz largo 1 kg','Lidl',null,0.99,'1 kg','Cereales y pan','/cereales/arroz',true],
  ['LD-031','Pasta espaguetis','Espaguetis 500 g','Combino',null,0.69,'500 g','Cereales y pan','/cereales/pasta',true],
  ['LD-032','Copos de avena','Copos de avena 500 g','Harvest Basket',null,0.89,'500 g','Cereales y pan','/cereales/avena',true],
  ['LD-033','Pan integral','Pan de molde integral 500 g','Lidl',null,1.19,'500 g','Cereales y pan','/pan/pan-integral',true],
  ['LD-034','Arroz integral','Arroz integral 1 kg','Lidl',null,1.29,'1 kg','Cereales y pan','/cereales/arroz-integral',true],
  ['LD-035','Quinoa','Quinoa 500 g','Harvest Basket',null,2.79,'500 g','Cereales y pan','/cereales/quinoa',true],
  ['LD-040','Garbanzos cocidos','Garbanzos cocidos 400 g','Lidl',null,0.79,'400 g','Conservas','/conservas/garbanzos',true],
  ['LD-041','Lentejas cocidas','Lentejas cocidas 400 g','Lidl',null,0.75,'400 g','Conservas','/conservas/lentejas',true],
  ['LD-042','Tomate triturado','Tomate triturado 500 g','Lidl',null,0.65,'500 g','Conservas','/conservas/tomate',true],
  ['LD-043','Alubias cocidas','Alubias blancas cocidas 400 g','Lidl',null,0.75,'400 g','Conservas','/conservas/alubias',true],
  ['LD-050','Aceite oliva virgen extra','Aceite de oliva virgen extra 750 mL','Primadonna',null,4.99,'750 mL','Aceites','/aceites/oliva',true],
  ['LD-051','Aceite de coco','Aceite de coco virgen 400 mL','Harvest Basket',null,3.49,'400 mL','Aceites','/aceites/coco',true],
  ['LD-052','Salsa de soja','Salsa de soja 250 mL','Lidl',null,1.29,'250 mL','Aceites','/aceites/soja',true],
  ['LD-060','Almendras naturales','Almendras naturales 200 g','Harvest Basket',null,2.29,'200 g','Frutos secos','/frutos-secos/almendras',true],
  ['LD-061','Mix frutos secos','Mix de frutos secos 200 g','Harvest Basket',null,2.49,'200 g','Frutos secos','/frutos-secos/mix',true],
  ['LD-062','Semillas de lino','Semillas de lino 250 g','Harvest Basket',null,1.49,'250 g','Frutos secos','/frutos-secos/semillas-lino',true],
  ['LD-063','Semillas de chía','Semillas de chía 200 g','Harvest Basket',null,1.99,'200 g','Frutos secos','/frutos-secos/chia',true],
  ['LD-070','Salmón congelado','Salmón noruego congelado 600 g','Nixe',null,5.99,'600 g','Congelados','/congelados/salmon',true],
  ['LD-071','Verduras salteadas','Verduras para saltear 750 g','Lidl',null,2.19,'750 g','Congelados','/congelados/verduras',true],
  ['LD-072','Edamame congelado','Edamame congelado 400 g','Lidl',null,2.09,'400 g','Congelados','/congelados/edamame',true],
];

const alca = [
  ['AC-001','Plátanos de Canarias','Auchan',1.89,'1.89 €/kg',null,'Frutas y verduras','Frutas','1 kg',null],
  ['AC-002','Manzanas Granny Smith','Auchan',2.29,'1.53 €/kg',null,'Frutas y verduras','Frutas','1.5 kg',null],
  ['AC-003','Tomates pera','Auchan',1.59,'1.59 €/kg',null,'Frutas y verduras','Verduras','1 kg',null],
  ['AC-004','Espinacas frescas','Auchan',1.45,'7.25 €/kg',null,'Frutas y verduras','Verduras','200 g',null],
  ['AC-005','Brócoli fresco','Auchan',1.15,'2.30 €/kg',null,'Frutas y verduras','Verduras','500 g',null],
  ['AC-006','Aguacate Hass','Auchan',2.09,'1.05 €/ud',null,'Frutas y verduras','Frutas','2 unidades',null],
  ['AC-007','Pimientos rojos','Auchan',1.69,'1.69 €/kg',null,'Frutas y verduras','Verduras','1 kg',null],
  ['AC-008','Zanahorias','Auchan',0.85,'0.85 €/kg',null,'Frutas y verduras','Verduras','1 kg',null],
  ['AC-009','Cebolla','Auchan',0.79,'0.79 €/kg',null,'Frutas y verduras','Verduras','1 kg',null],
  ['AC-010','Pechuga de pollo fileteada','Auchan',4.89,'9.78 €/kg',null,'Carne y pescado','Pollo','500 g',null],
  ['AC-011','Salmón fresco en lomos','Auchan',6.49,'16.23 €/kg',null,'Carne y pescado','Pescado','400 g',null],
  ['AC-012','Carne picada de ternera','Auchan',3.89,'9.73 €/kg',null,'Carne y pescado','Ternera','400 g',null],
  ['AC-013','Atún en aceite de oliva','Auchan',2.09,'8.71 €/kg',null,'Carne y pescado','Conservas','3x80 g',null],
  ['AC-014','Merluza en filetes','Auchan',4.79,'11.98 €/kg',null,'Carne y pescado','Pescado','400 g',null],
  ['AC-015','Gambas peladas','Auchan',4.69,'9.38 €/kg',null,'Carne y pescado','Marisco','500 g',null],
  ['AC-020','Leche entera','Auchan',0.92,'0.92 €/L',null,'Lácteos y huevos','Leche','1 L',null],
  ['AC-021','Yogur natural sin azúcar','Auchan',0.85,'1.70 €/kg',null,'Lácteos y huevos','Yogures','4x125 g',null],
  ['AC-022','Queso fresco 0%','Auchan',1.39,'2.78 €/kg',null,'Lácteos y huevos','Quesos','500 g',null],
  ['AC-023','Huevos camperos L','Auchan',2.39,'0.20 €/ud',null,'Lácteos y huevos','Huevos','12 unidades',null],
  ['AC-024','Queso mozzarella','Auchan',1.59,'6.36 €/kg',null,'Lácteos y huevos','Quesos','250 g',null],
  ['AC-025','Yogur griego','Auchan',1.39,'2.78 €/kg',null,'Lácteos y huevos','Yogures','4x125 g',null],
  ['AC-030','Arroz largo','Auchan',1.05,'1.05 €/kg',null,'Cereales y pan','Arroz','1 kg',null],
  ['AC-031','Espaguetis','Auchan',0.75,'1.50 €/kg',null,'Cereales y pan','Pasta','500 g',null],
  ['AC-032','Copos de avena','Auchan',0.95,'1.90 €/kg',null,'Cereales y pan','Cereales','500 g',null],
  ['AC-033','Pan de molde integral','Auchan',1.25,'2.50 €/kg',null,'Cereales y pan','Pan','500 g',null],
  ['AC-034','Quinoa','Auchan Bio',3.29,'6.58 €/kg',null,'Cereales y pan','Cereales','500 g',null],
  ['AC-035','Arroz integral','Auchan',1.35,'1.35 €/kg',null,'Cereales y pan','Arroz','1 kg',null],
  ['AC-040','Garbanzos cocidos','Auchan',0.82,'2.05 €/kg',null,'Conservas','Legumbres','400 g',null],
  ['AC-041','Lentejas cocidas','Auchan',0.79,'1.98 €/kg',null,'Conservas','Legumbres','400 g',null],
  ['AC-042','Tomate triturado','Auchan',0.65,'1.30 €/kg',null,'Conservas','Tomate','500 g',null],
  ['AC-043','Alubias blancas','Auchan',0.79,'1.98 €/kg',null,'Conservas','Legumbres','400 g',null],
  ['AC-050','Aceite de oliva virgen extra','Auchan',5.99,'5.99 €/L',null,'Aceites','Aceites','1 L',null],
  ['AC-051','Salsa de soja','Auchan',1.39,'4.63 €/L',null,'Aceites','Salsas','300 mL',null],
  ['AC-060','Almendras crudas','Auchan',2.79,'13.95 €/kg',null,'Frutos secos','Frutos secos','200 g',null],
  ['AC-061','Nueces peladas','Auchan',3.19,'15.95 €/kg',null,'Frutos secos','Frutos secos','200 g',null],
  ['AC-062','Semillas de chía','Auchan Bio',2.29,'11.45 €/kg',null,'Frutos secos','Semillas','200 g',null],
  ['AC-063','Semillas de lino','Auchan Bio',1.89,'9.45 €/kg',null,'Frutos secos','Semillas','200 g',null],
];

async function run() {
  console.log('Seeding Mercadona...');
  for (const p of merc) {
    await pool.query(
      `INSERT INTO mercadona_products (id,slug,name,packaging,thumbnail,share_url,category_id,category_name,subcategory_id,subcategory_name,bulk_price,unit_price,unit_size,size_format,reference_price,reference_format,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,bulk_price=EXCLUDED.bulk_price,"updatedAt"=EXCLUDED."updatedAt"`,
      [...p, now, now]
    );
  }
  console.log(`  ${merc.length} Mercadona products OK`);

  console.log('Seeding Carrefour...');
  for (const p of carr) {
    await pool.query(
      `INSERT INTO carrefour_products (id,name,brand,price,price_per_unit,image,category,subcategory,packaging,product_url,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,price=EXCLUDED.price,"updatedAt"=EXCLUDED."updatedAt"`,
      [...p, now, now]
    );
  }
  console.log(`  ${carr.length} Carrefour products OK`);

  console.log('Seeding Lidl...');
  for (const p of lidl) {
    await pool.query(
      `INSERT INTO lidl_products (id,name,full_title,brand,image,price,packaging,category,canonical_path,online_available,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,price=EXCLUDED.price,"updatedAt"=EXCLUDED."updatedAt"`,
      [...p, now, now]
    );
  }
  console.log(`  ${lidl.length} Lidl products OK`);

  console.log('Seeding Alcampo...');
  for (const p of alca) {
    await pool.query(
      `INSERT INTO alcampo_products (id,name,brand,price,price_per_unit,image,category,subcategory,packaging,product_url,"createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,price=EXCLUDED.price,"updatedAt"=EXCLUDED."updatedAt"`,
      [...p, now, now]
    );
  }
  console.log(`  ${alca.length} Alcampo products OK`);

  const total = merc.length + carr.length + lidl.length + alca.length;
  console.log(`\nDone! ${total} total products across 4 supermarkets`);
  await pool.end();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
