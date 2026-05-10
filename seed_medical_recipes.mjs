import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

const RECIPES = [
  // ===== HIPERTENSIÓN (bajas en sodio) =====
  {
    name: "Ensalada de Remolacha con Nueces y Rúcula",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","antioxidante"],
    mealTime: "comida",
    description: "La remolacha es rica en nitratos naturales que ayudan a reducir la presión arterial. Combinada con nueces y rúcula, esta ensalada es un aliado perfecto para el corazón.",
    preparationTime: 15, cookTime: 0, servings: 2, difficulty: "easy",
    calories: 210, proteins: 6, carbs: 22, fats: 12, fiber: 5,
    allergens: ["frutos_secos"],
    ingredientsJson: [
      { name: "Remolacha cocida", quantity: "300g" },
      { name: "Rúcula fresca", quantity: "80g" },
      { name: "Nueces", quantity: "30g" },
      { name: "Queso de cabra fresco", quantity: "50g" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Vinagre de módena", quantity: "1 cucharada" },
      { name: "Pimienta negra", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cortar la remolacha cocida en rodajas o dados.",
      "Distribuir la rúcula en una fuente y añadir la remolacha.",
      "Desmigar el queso de cabra por encima.",
      "Añadir las nueces troceadas.",
      "Aliñar con aceite de oliva, vinagre y pimienta negra. Sin sal."
    ]
  },
  {
    name: "Salmón al Vapor con Espárragos y Limón",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","omega3","cardiosaludable"],
    mealTime: "cena",
    description: "El salmón aporta omega-3 que protege el sistema cardiovascular. Preparado al vapor sin sal, con espárragos y limón para potenciar el sabor de forma natural.",
    preparationTime: 10, cookTime: 15, servings: 2, difficulty: "easy",
    calories: 280, proteins: 32, carbs: 8, fats: 14, fiber: 3,
    allergens: ["pescado"],
    ingredientsJson: [
      { name: "Filete de salmón", quantity: "300g" },
      { name: "Espárragos verdes", quantity: "200g" },
      { name: "Limón", quantity: "1 unidad" },
      { name: "Eneldo fresco", quantity: "1 cucharada" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Pimienta negra", quantity: "al gusto" },
      { name: "Ajo en polvo", quantity: "1/2 cucharadita" }
    ],
    instructionsJson: [
      "Colocar el salmón en la vaporera y añadir rodajas de limón por encima.",
      "Espolvorear con eneldo, ajo en polvo y pimienta negra. Sin sal.",
      "Cocinar al vapor 12-15 minutos.",
      "Mientras tanto, cocinar los espárragos al vapor 5-7 minutos.",
      "Servir el salmón sobre los espárragos con un chorrito de aceite de oliva y zumo de limón."
    ]
  },
  {
    name: "Crema de Calabaza sin Sal",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","potasio","vegano"],
    mealTime: "cena",
    description: "Crema suave y reconfortante de calabaza, rica en potasio que ayuda a regular la presión arterial. Preparada sin sal añadida, con especias aromáticas.",
    preparationTime: 15, cookTime: 25, servings: 4, difficulty: "easy",
    calories: 145, proteins: 4, carbs: 28, fats: 4, fiber: 6,
    allergens: [],
    ingredientsJson: [
      { name: "Calabaza", quantity: "800g" },
      { name: "Cebolla", quantity: "1 unidad" },
      { name: "Zanahoria", quantity: "2 unidades" },
      { name: "Caldo de verduras sin sal", quantity: "600ml" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Cúrcuma", quantity: "1 cucharadita" },
      { name: "Jengibre fresco rallado", quantity: "1 cucharadita" },
      { name: "Pimienta negra", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Pelar y trocear la calabaza, zanahoria y cebolla.",
      "Sofreír la cebolla en aceite de oliva a fuego medio 5 minutos.",
      "Añadir la calabaza y zanahoria, rehogar 3 minutos.",
      "Agregar el caldo sin sal, cúrcuma y jengibre.",
      "Cocinar 20 minutos hasta que las verduras estén tiernas.",
      "Triturar hasta obtener una crema suave. Sazonar solo con pimienta."
    ]
  },
  {
    name: "Pollo al Limón con Hierbas Aromáticas",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","proteina","cardiosaludable"],
    mealTime: "comida",
    description: "Pechuga de pollo marinada en limón y hierbas frescas, sin sal. El limón y las hierbas aportan sabor intenso sin necesidad de sodio.",
    preparationTime: 20, cookTime: 20, servings: 2, difficulty: "easy",
    calories: 245, proteins: 38, carbs: 4, fats: 8, fiber: 1,
    allergens: [],
    ingredientsJson: [
      { name: "Pechuga de pollo", quantity: "400g" },
      { name: "Limón", quantity: "2 unidades" },
      { name: "Ajo", quantity: "3 dientes" },
      { name: "Romero fresco", quantity: "2 ramas" },
      { name: "Tomillo fresco", quantity: "2 ramas" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Pimienta negra", quantity: "al gusto" },
      { name: "Perejil fresco", quantity: "1 manojo" }
    ],
    instructionsJson: [
      "Marinar el pollo con zumo de limón, ajo picado, romero, tomillo y aceite de oliva durante 30 minutos.",
      "Calentar una sartén antiadherente a fuego medio-alto.",
      "Cocinar el pollo 8-10 minutos por cada lado.",
      "Servir con perejil fresco picado y rodajas de limón.",
      "No añadir sal en ningún momento del proceso."
    ]
  },
  {
    name: "Avena con Plátano y Semillas de Lino",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","fibra","omega3"],
    mealTime: "desayuno",
    description: "Desayuno cardiosaludable rico en fibra soluble y omega-3. La avena y el plátano ayudan a reducir la presión arterial de forma natural.",
    preparationTime: 5, cookTime: 10, servings: 1, difficulty: "easy",
    calories: 320, proteins: 10, carbs: 55, fats: 8, fiber: 8,
    allergens: ["gluten","lacteos"],
    ingredientsJson: [
      { name: "Copos de avena", quantity: "60g" },
      { name: "Leche desnatada o vegetal sin sal", quantity: "200ml" },
      { name: "Plátano maduro", quantity: "1 unidad" },
      { name: "Semillas de lino molidas", quantity: "1 cucharada" },
      { name: "Canela en polvo", quantity: "1/2 cucharadita" },
      { name: "Nueces", quantity: "10g" }
    ],
    instructionsJson: [
      "Calentar la leche en un cazo a fuego medio.",
      "Añadir los copos de avena y cocinar 5-7 minutos removiendo.",
      "Agregar la canela y mezclar bien.",
      "Servir en un bol y añadir el plátano en rodajas.",
      "Espolvorear con semillas de lino molidas y nueces troceadas."
    ]
  },
  {
    name: "Ensalada de Aguacate con Tomate y Pepino",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","potasio","vegano"],
    mealTime: "comida",
    description: "El aguacate es rico en potasio y grasas saludables que ayudan a regular la presión arterial. Esta ensalada fresca es perfecta para el control de la hipertensión.",
    preparationTime: 10, cookTime: 0, servings: 2, difficulty: "easy",
    calories: 195, proteins: 3, carbs: 14, fats: 15, fiber: 7,
    allergens: [],
    ingredientsJson: [
      { name: "Aguacate maduro", quantity: "2 unidades" },
      { name: "Tomate", quantity: "2 unidades" },
      { name: "Pepino", quantity: "1 unidad" },
      { name: "Cebolla morada", quantity: "1/4 unidad" },
      { name: "Cilantro fresco", quantity: "1 manojo" },
      { name: "Zumo de lima", quantity: "2 cucharadas" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Pimienta negra", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cortar el aguacate, tomate y pepino en dados.",
      "Picar finamente la cebolla morada y el cilantro.",
      "Mezclar todos los ingredientes en un bol.",
      "Aliñar con zumo de lima, aceite de oliva y pimienta negra.",
      "Servir inmediatamente. Sin sal añadida."
    ]
  },
  {
    name: "Lentejas Estofadas sin Sal con Verduras",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","fibra","proteina_vegetal"],
    mealTime: "comida",
    description: "Las lentejas son ricas en potasio y fibra, ideales para la hipertensión. Este estofado sin sal se sazona con especias aromáticas para un sabor intenso.",
    preparationTime: 15, cookTime: 35, servings: 4, difficulty: "medium",
    calories: 285, proteins: 18, carbs: 45, fats: 4, fiber: 14,
    allergens: [],
    ingredientsJson: [
      { name: "Lentejas pardinas", quantity: "300g" },
      { name: "Zanahoria", quantity: "2 unidades" },
      { name: "Puerro", quantity: "1 unidad" },
      { name: "Tomate triturado sin sal", quantity: "200g" },
      { name: "Caldo de verduras sin sal", quantity: "1 litro" },
      { name: "Ajo", quantity: "3 dientes" },
      { name: "Pimentón dulce", quantity: "1 cucharadita" },
      { name: "Comino", quantity: "1/2 cucharadita" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Laurel", quantity: "1 hoja" }
    ],
    instructionsJson: [
      "Sofreír el ajo y puerro picados en aceite de oliva 5 minutos.",
      "Añadir la zanahoria en rodajas y el tomate triturado.",
      "Incorporar las lentejas lavadas, el caldo sin sal y las especias.",
      "Cocinar a fuego medio 30-35 minutos hasta que las lentejas estén tiernas.",
      "Rectificar con más especias si es necesario. Sin sal añadida."
    ]
  },
  {
    name: "Batido Verde Antihipertensivo",
    category: "hipertension",
    tags: ["hipertension","bajo_sodio","potasio","magnesio"],
    mealTime: "desayuno",
    description: "Batido rico en potasio y magnesio, minerales clave para reducir la presión arterial. Espinacas, plátano y semillas de chía en un batido nutritivo.",
    preparationTime: 5, cookTime: 0, servings: 1, difficulty: "easy",
    calories: 245, proteins: 8, carbs: 42, fats: 6, fiber: 9,
    allergens: ["lacteos"],
    ingredientsJson: [
      { name: "Espinacas frescas", quantity: "80g" },
      { name: "Plátano congelado", quantity: "1 unidad" },
      { name: "Leche de almendras sin sal", quantity: "250ml" },
      { name: "Semillas de chía", quantity: "1 cucharada" },
      { name: "Jengibre fresco", quantity: "1 cm" },
      { name: "Zumo de limón", quantity: "1 cucharada" }
    ],
    instructionsJson: [
      "Poner todos los ingredientes en la batidora.",
      "Triturar a máxima potencia durante 1 minuto.",
      "Servir inmediatamente en un vaso alto.",
      "Opcional: añadir hielo para una textura más fría."
    ]
  },

  // ===== DIABETES TIPO 2 (bajo índice glucémico) =====
  {
    name: "Tortilla de Espinacas y Queso Fresco",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","proteina","sin_azucar"],
    mealTime: "desayuno",
    description: "Tortilla rica en proteínas y baja en carbohidratos, ideal para mantener estable el azúcar en sangre. Las espinacas aportan fibra y micronutrientes esenciales.",
    preparationTime: 10, cookTime: 10, servings: 2, difficulty: "easy",
    calories: 220, proteins: 18, carbs: 4, fats: 15, fiber: 2,
    allergens: ["huevos","lacteos"],
    ingredientsJson: [
      { name: "Huevos", quantity: "4 unidades" },
      { name: "Espinacas frescas", quantity: "100g" },
      { name: "Queso fresco desnatado", quantity: "60g" },
      { name: "Cebolla", quantity: "1/2 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Pimienta negra", quantity: "al gusto" },
      { name: "Sal", quantity: "pizca" }
    ],
    instructionsJson: [
      "Saltear la cebolla picada en aceite de oliva hasta que esté transparente.",
      "Añadir las espinacas y cocinar 2 minutos hasta que se reduzcan.",
      "Batir los huevos con sal y pimienta.",
      "Verter los huevos sobre las espinacas y cebolla.",
      "Añadir el queso fresco desmenuzado por encima.",
      "Cuajar la tortilla a fuego medio, dando la vuelta a mitad de cocción."
    ]
  },
  {
    name: "Ensalada de Garbanzos con Pepino y Tomate",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","fibra","proteina_vegetal"],
    mealTime: "comida",
    description: "Los garbanzos tienen un índice glucémico bajo gracias a su alto contenido en fibra y proteínas. Esta ensalada mediterránea es saciante y equilibrada para diabéticos.",
    preparationTime: 15, cookTime: 0, servings: 2, difficulty: "easy",
    calories: 310, proteins: 14, carbs: 38, fats: 10, fiber: 12,
    allergens: [],
    ingredientsJson: [
      { name: "Garbanzos cocidos", quantity: "400g" },
      { name: "Pepino", quantity: "1 unidad" },
      { name: "Tomate", quantity: "2 unidades" },
      { name: "Pimiento rojo", quantity: "1/2 unidad" },
      { name: "Cebolla morada", quantity: "1/4 unidad" },
      { name: "Perejil fresco", quantity: "1 manojo" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Zumo de limón", quantity: "2 cucharadas" },
      { name: "Sal", quantity: "pizca" },
      { name: "Comino", quantity: "1/2 cucharadita" }
    ],
    instructionsJson: [
      "Escurrir y lavar los garbanzos cocidos.",
      "Cortar el pepino, tomate y pimiento en dados pequeños.",
      "Picar la cebolla morada y el perejil.",
      "Mezclar todos los ingredientes en un bol grande.",
      "Aliñar con aceite de oliva, zumo de limón, comino y sal.",
      "Dejar reposar 10 minutos antes de servir."
    ]
  },
  {
    name: "Salmón con Quinoa y Verduras Asadas",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","omega3","proteina"],
    mealTime: "comida",
    description: "La quinoa es un pseudocereal con bajo índice glucémico y proteína completa. Combinada con salmón y verduras asadas, forma un plato completo y equilibrado para diabéticos.",
    preparationTime: 15, cookTime: 25, servings: 2, difficulty: "medium",
    calories: 420, proteins: 35, carbs: 35, fats: 16, fiber: 6,
    allergens: ["pescado"],
    ingredientsJson: [
      { name: "Filete de salmón", quantity: "300g" },
      { name: "Quinoa", quantity: "120g" },
      { name: "Brócoli", quantity: "200g" },
      { name: "Pimiento rojo", quantity: "1 unidad" },
      { name: "Calabacín", quantity: "1 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Ajo en polvo", quantity: "1 cucharadita" },
      { name: "Pimentón ahumado", quantity: "1 cucharadita" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer la quinoa en agua (doble cantidad) durante 15 minutos.",
      "Precalentar el horno a 200°C.",
      "Cortar las verduras en trozos y aliñar con aceite, ajo en polvo y pimentón.",
      "Asar las verduras 20 minutos en el horno.",
      "Cocinar el salmón a la plancha 4 minutos por cada lado.",
      "Servir la quinoa como base, con las verduras asadas y el salmón encima."
    ]
  },
  {
    name: "Yogur Griego con Frutos Rojos y Semillas",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","proteina","antioxidante"],
    mealTime: "merienda",
    description: "Merienda perfecta para diabéticos: el yogur griego tiene bajo índice glucémico y alto contenido proteico. Los frutos rojos son ricos en antioxidantes y bajos en azúcar.",
    preparationTime: 5, cookTime: 0, servings: 1, difficulty: "easy",
    calories: 185, proteins: 15, carbs: 18, fats: 6, fiber: 4,
    allergens: ["lacteos"],
    ingredientsJson: [
      { name: "Yogur griego natural sin azúcar", quantity: "150g" },
      { name: "Frutos rojos mixtos (fresas, arándanos, frambuesas)", quantity: "100g" },
      { name: "Semillas de chía", quantity: "1 cucharadita" },
      { name: "Semillas de lino molidas", quantity: "1 cucharadita" },
      { name: "Canela en polvo", quantity: "1/4 cucharadita" }
    ],
    instructionsJson: [
      "Poner el yogur griego en un bol.",
      "Añadir los frutos rojos por encima.",
      "Espolvorear con semillas de chía, lino y canela.",
      "Servir inmediatamente. No añadir azúcar ni miel."
    ]
  },
  {
    name: "Pollo al Horno con Verduras de Temporada",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","proteina","sin_azucar"],
    mealTime: "comida",
    description: "Plato completo y equilibrado para diabéticos. El pollo aporta proteína de alta calidad sin carbohidratos, y las verduras de temporada tienen bajo índice glucémico.",
    preparationTime: 20, cookTime: 40, servings: 4, difficulty: "medium",
    calories: 310, proteins: 42, carbs: 12, fats: 10, fiber: 4,
    allergens: [],
    ingredientsJson: [
      { name: "Muslos de pollo sin piel", quantity: "800g" },
      { name: "Pimiento rojo y verde", quantity: "2 unidades" },
      { name: "Cebolla", quantity: "2 unidades" },
      { name: "Tomate", quantity: "3 unidades" },
      { name: "Ajo", quantity: "4 dientes" },
      { name: "Aceite de oliva virgen extra", quantity: "3 cucharadas" },
      { name: "Romero y tomillo", quantity: "al gusto" },
      { name: "Pimentón dulce", quantity: "1 cucharadita" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Precalentar el horno a 190°C.",
      "Cortar todas las verduras en trozos medianos.",
      "Colocar el pollo y las verduras en una bandeja de horno.",
      "Aliñar con aceite, ajo picado, romero, tomillo y pimentón.",
      "Hornear 35-40 minutos hasta que el pollo esté dorado.",
      "Servir directamente de la bandeja."
    ]
  },
  {
    name: "Crema de Brócoli con Almendras Tostadas",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","fibra","antioxidante"],
    mealTime: "cena",
    description: "El brócoli tiene un índice glucémico muy bajo y es rico en fibra y vitamina C. Esta crema suave con almendras tostadas es perfecta para la cena de un diabético.",
    preparationTime: 15, cookTime: 20, servings: 4, difficulty: "easy",
    calories: 175, proteins: 8, carbs: 14, fats: 10, fiber: 7,
    allergens: ["frutos_secos","lacteos"],
    ingredientsJson: [
      { name: "Brócoli", quantity: "600g" },
      { name: "Cebolla", quantity: "1 unidad" },
      { name: "Caldo de verduras sin sal", quantity: "500ml" },
      { name: "Leche desnatada", quantity: "100ml" },
      { name: "Almendras tostadas sin sal", quantity: "30g" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Nuez moscada", quantity: "pizca" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Sofreír la cebolla picada en aceite de oliva 5 minutos.",
      "Añadir el brócoli troceado y el caldo.",
      "Cocinar 15 minutos hasta que el brócoli esté tierno.",
      "Agregar la leche desnatada y triturar hasta obtener una crema suave.",
      "Sazonar con sal, pimienta y nuez moscada.",
      "Servir con almendras tostadas troceadas por encima."
    ]
  },
  {
    name: "Tostada de Pan Integral con Aguacate y Huevo",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","proteina","fibra"],
    mealTime: "desayuno",
    description: "El pan integral tiene menor índice glucémico que el pan blanco. El aguacate y el huevo aportan grasas saludables y proteínas que ralentizan la absorción de glucosa.",
    preparationTime: 10, cookTime: 5, servings: 1, difficulty: "easy",
    calories: 340, proteins: 16, carbs: 28, fats: 18, fiber: 8,
    allergens: ["gluten","huevos"],
    ingredientsJson: [
      { name: "Pan integral de centeno", quantity: "2 rebanadas" },
      { name: "Aguacate maduro", quantity: "1/2 unidad" },
      { name: "Huevo", quantity: "1 unidad" },
      { name: "Tomate cherry", quantity: "5 unidades" },
      { name: "Zumo de limón", quantity: "1 cucharadita" },
      { name: "Sal y pimienta", quantity: "al gusto" },
      { name: "Semillas de sésamo", quantity: "1 cucharadita" }
    ],
    instructionsJson: [
      "Tostar el pan integral.",
      "Machacar el aguacate con zumo de limón, sal y pimienta.",
      "Cocinar el huevo al gusto (poché, revuelto o a la plancha).",
      "Untar el aguacate sobre las tostadas.",
      "Colocar el huevo encima y los tomates cherry cortados.",
      "Espolvorear con semillas de sésamo."
    ]
  },
  {
    name: "Bacalao al Horno con Pisto de Verduras",
    category: "diabetes",
    tags: ["diabetes","bajo_ig","proteina","bajo_grasa"],
    mealTime: "comida",
    description: "El bacalao es una proteína magra ideal para diabéticos. El pisto de verduras aporta fibra y antioxidantes con muy bajo índice glucémico.",
    preparationTime: 20, cookTime: 30, servings: 2, difficulty: "medium",
    calories: 290, proteins: 38, carbs: 16, fats: 8, fiber: 5,
    allergens: ["pescado"],
    ingredientsJson: [
      { name: "Lomo de bacalao fresco", quantity: "400g" },
      { name: "Calabacín", quantity: "1 unidad" },
      { name: "Pimiento rojo", quantity: "1 unidad" },
      { name: "Tomate", quantity: "2 unidades" },
      { name: "Cebolla", quantity: "1 unidad" },
      { name: "Ajo", quantity: "2 dientes" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Tomillo y orégano", quantity: "al gusto" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Preparar el pisto: sofreír la cebolla y el ajo en aceite de oliva.",
      "Añadir el pimiento, calabacín y tomate troceados.",
      "Cocinar el pisto a fuego medio 20 minutos con tomillo y orégano.",
      "Precalentar el horno a 180°C.",
      "Colocar el bacalao en una fuente, cubrir con el pisto.",
      "Hornear 12-15 minutos hasta que el bacalao esté en su punto."
    ]
  },

  // ===== POST-OPERATORIO (blandas, fácil digestión) =====
  {
    name: "Puré de Patata y Zanahoria Suave",
    category: "postoperatorio",
    tags: ["postoperatorio","blando","facil_digestion","reconfortante"],
    mealTime: "comida",
    description: "Puré suave y fácil de digerir, ideal para la recuperación post-operatoria. La patata y la zanahoria aportan energía y vitaminas sin irritar el sistema digestivo.",
    preparationTime: 15, cookTime: 25, servings: 2, difficulty: "easy",
    calories: 195, proteins: 5, carbs: 38, fats: 4, fiber: 4,
    allergens: ["lacteos"],
    ingredientsJson: [
      { name: "Patata", quantity: "400g" },
      { name: "Zanahoria", quantity: "200g" },
      { name: "Leche desnatada caliente", quantity: "100ml" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Sal", quantity: "pizca" }
    ],
    instructionsJson: [
      "Pelar y trocear la patata y la zanahoria.",
      "Cocer en agua con sal durante 20-25 minutos hasta que estén muy tiernas.",
      "Escurrir bien y pasar por el pasapurés (no usar batidora para evitar que quede gomoso).",
      "Añadir la leche caliente poco a poco y el aceite de oliva.",
      "Mezclar hasta obtener un puré suave y sin grumos.",
      "Servir templado."
    ]
  },
  {
    name: "Sopa de Arroz con Pollo Desmenuzado",
    category: "postoperatorio",
    tags: ["postoperatorio","blando","facil_digestion","proteina"],
    mealTime: "comida",
    description: "Sopa nutritiva y de fácil digestión, perfecta para la recuperación post-operatoria. El arroz y el pollo aportan energía y proteínas sin sobrecargar el sistema digestivo.",
    preparationTime: 15, cookTime: 30, servings: 4, difficulty: "easy",
    calories: 220, proteins: 18, carbs: 28, fats: 4, fiber: 1,
    allergens: [],
    ingredientsJson: [
      { name: "Pechuga de pollo", quantity: "300g" },
      { name: "Arroz blanco", quantity: "100g" },
      { name: "Zanahoria", quantity: "2 unidades" },
      { name: "Caldo de pollo casero sin grasa", quantity: "1,5 litros" },
      { name: "Sal", quantity: "pizca" },
      { name: "Perejil fresco", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer la pechuga de pollo en el caldo durante 20 minutos.",
      "Retirar el pollo, dejar enfriar y desmenuzar con dos tenedores.",
      "Colar el caldo y llevarlo a ebullición.",
      "Añadir la zanahoria en rodajas finas y el arroz.",
      "Cocinar 18 minutos a fuego medio.",
      "Incorporar el pollo desmenuzado, rectificar de sal y servir con perejil."
    ]
  },
  {
    name: "Crema de Calabacín Suave",
    category: "postoperatorio",
    tags: ["postoperatorio","blando","facil_digestion","vegano"],
    mealTime: "cena",
    description: "Crema muy suave y de fácil digestión. El calabacín es uno de los vegetales más tolerados tras una intervención quirúrgica por su bajo contenido en fibra insoluble.",
    preparationTime: 10, cookTime: 20, servings: 4, difficulty: "easy",
    calories: 110, proteins: 4, carbs: 14, fats: 5, fiber: 2,
    allergens: ["lacteos"],
    ingredientsJson: [
      { name: "Calabacín", quantity: "600g" },
      { name: "Patata", quantity: "200g" },
      { name: "Caldo de verduras suave", quantity: "600ml" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Sal", quantity: "pizca" },
      { name: "Quesito cremoso desnatado", quantity: "2 porciones" }
    ],
    instructionsJson: [
      "Pelar y trocear el calabacín y la patata.",
      "Cocer en el caldo durante 15-18 minutos hasta que estén muy tiernos.",
      "Añadir los quesitos cremosos.",
      "Triturar con batidora hasta obtener una crema muy fina.",
      "Pasar por el colador si se desea una textura más suave.",
      "Servir templada con un chorrito de aceite de oliva."
    ]
  },
  {
    name: "Merluza al Vapor con Patata Cocida",
    category: "postoperatorio",
    tags: ["postoperatorio","blando","facil_digestion","proteina"],
    mealTime: "comida",
    description: "La merluza al vapor es una de las proteínas más fáciles de digerir. Con patata cocida forma un plato completo, suave y nutritivo para la recuperación.",
    preparationTime: 10, cookTime: 20, servings: 2, difficulty: "easy",
    calories: 260, proteins: 30, carbs: 25, fats: 5, fiber: 2,
    allergens: ["pescado"],
    ingredientsJson: [
      { name: "Filete de merluza fresca", quantity: "400g" },
      { name: "Patata", quantity: "300g" },
      { name: "Zanahoria", quantity: "1 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Zumo de limón", quantity: "1 cucharada" },
      { name: "Sal", quantity: "pizca" },
      { name: "Perejil", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Pelar y cocer la patata y zanahoria en agua con sal durante 20 minutos.",
      "Colocar la merluza en la vaporera y cocinar 10-12 minutos.",
      "Escurrir las verduras y chafar ligeramente con un tenedor.",
      "Servir la merluza con la patata y zanahoria.",
      "Aliñar con aceite de oliva, zumo de limón y perejil picado."
    ]
  },
  {
    name: "Arroz Blanco con Zanahoria y Pollo",
    category: "postoperatorio",
    tags: ["postoperatorio","blando","facil_digestion","reconfortante"],
    mealTime: "comida",
    description: "Plato clásico de dieta blanda post-operatoria. El arroz blanco y el pollo cocido son fácilmente tolerados por el sistema digestivo durante la recuperación.",
    preparationTime: 10, cookTime: 25, servings: 2, difficulty: "easy",
    calories: 310, proteins: 28, carbs: 40, fats: 4, fiber: 1,
    allergens: [],
    ingredientsJson: [
      { name: "Arroz blanco", quantity: "150g" },
      { name: "Pechuga de pollo", quantity: "250g" },
      { name: "Zanahoria", quantity: "2 unidades" },
      { name: "Caldo de pollo sin grasa", quantity: "400ml" },
      { name: "Sal", quantity: "pizca" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharadita" }
    ],
    instructionsJson: [
      "Cocer el pollo en agua con sal durante 20 minutos. Desmenuzar.",
      "Cocer el arroz en el caldo de pollo durante 18 minutos.",
      "Cocer la zanahoria en rodajas hasta que esté muy tierna.",
      "Mezclar el arroz con el pollo desmenuzado y la zanahoria.",
      "Añadir un chorrito de aceite de oliva y servir templado."
    ]
  },
  {
    name: "Natillas de Vainilla Caseras",
    category: "postoperatorio",
    tags: ["postoperatorio","blando","facil_digestion","postre"],
    mealTime: "merienda",
    description: "Postre suave y nutritivo, ideal para la recuperación post-operatoria. Las natillas aportan proteínas y calcio de forma fácilmente digerible.",
    preparationTime: 10, cookTime: 15, servings: 4, difficulty: "medium",
    calories: 165, proteins: 6, carbs: 24, fats: 5, fiber: 0,
    allergens: ["lacteos","huevos"],
    ingredientsJson: [
      { name: "Leche entera", quantity: "500ml" },
      { name: "Yemas de huevo", quantity: "4 unidades" },
      { name: "Azúcar", quantity: "60g" },
      { name: "Maicena", quantity: "2 cucharadas" },
      { name: "Esencia de vainilla", quantity: "1 cucharadita" },
      { name: "Canela en polvo", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Calentar la leche con la vainilla sin que llegue a hervir.",
      "Batir las yemas con el azúcar y la maicena hasta que blanqueen.",
      "Añadir la leche caliente poco a poco a las yemas, removiendo constantemente.",
      "Volver al fuego a temperatura baja, remover hasta que espese.",
      "Verter en moldes individuales y dejar enfriar.",
      "Espolvorear con canela antes de servir."
    ]
  },
  {
    name: "Caldo de Pollo Casero Reconfortante",
    category: "postoperatorio",
    tags: ["postoperatorio","liquido","facil_digestion","reconfortante"],
    mealTime: "cualquiera",
    description: "El caldo de pollo casero es el alimento más reconfortante y fácil de tolerar tras una operación. Rico en colágeno y minerales para la recuperación.",
    preparationTime: 15, cookTime: 90, servings: 6, difficulty: "easy",
    calories: 45, proteins: 5, carbs: 2, fats: 2, fiber: 0,
    allergens: [],
    ingredientsJson: [
      { name: "Carcasa de pollo", quantity: "1 unidad" },
      { name: "Zanahoria", quantity: "3 unidades" },
      { name: "Puerro", quantity: "1 unidad" },
      { name: "Apio", quantity: "2 ramas" },
      { name: "Cebolla", quantity: "1 unidad" },
      { name: "Ajo", quantity: "2 dientes" },
      { name: "Perejil", quantity: "1 manojo" },
      { name: "Sal", quantity: "pizca" },
      { name: "Agua", quantity: "2 litros" }
    ],
    instructionsJson: [
      "Poner todos los ingredientes en una olla grande con el agua fría.",
      "Llevar a ebullición y retirar la espuma que se forme.",
      "Reducir el fuego y cocinar a fuego lento 1,5 horas.",
      "Colar el caldo con un colador fino.",
      "Dejar enfriar y retirar la grasa que sube a la superficie.",
      "Servir caliente. Se puede congelar en porciones."
    ]
  },
  {
    name: "Compota de Manzana Casera",
    category: "postoperatorio",
    tags: ["postoperatorio","blando","facil_digestion","postre","vegano"],
    mealTime: "merienda",
    description: "La compota de manzana es uno de los primeros alimentos recomendados en la recuperación post-operatoria. Suave, digestiva y nutritiva.",
    preparationTime: 10, cookTime: 20, servings: 4, difficulty: "easy",
    calories: 85, proteins: 0, carbs: 22, fats: 0, fiber: 3,
    allergens: [],
    ingredientsJson: [
      { name: "Manzana golden", quantity: "4 unidades" },
      { name: "Agua", quantity: "50ml" },
      { name: "Canela en rama", quantity: "1 unidad" },
      { name: "Zumo de limón", quantity: "1 cucharada" }
    ],
    instructionsJson: [
      "Pelar, descorazonar y trocear las manzanas.",
      "Poner en un cazo con el agua, la canela y el zumo de limón.",
      "Cocinar a fuego medio 15-20 minutos removiendo ocasionalmente.",
      "Cuando las manzanas estén muy tiernas, retirar la canela.",
      "Triturar con tenedor o batidora según la textura deseada.",
      "Servir templada o fría."
    ]
  },

  // ===== COLESTEROL ALTO =====
  {
    name: "Avena con Manzana y Canela Anti-Colesterol",
    category: "colesterol",
    tags: ["colesterol","fibra_soluble","cardiosaludable","vegano"],
    mealTime: "desayuno",
    description: "La avena es el alimento estrella para reducir el colesterol LDL gracias a su beta-glucano. Con manzana y canela forma un desayuno potentemente cardiosaludable.",
    preparationTime: 5, cookTime: 10, servings: 1, difficulty: "easy",
    calories: 295, proteins: 8, carbs: 52, fats: 5, fiber: 9,
    allergens: ["gluten"],
    ingredientsJson: [
      { name: "Copos de avena", quantity: "60g" },
      { name: "Leche vegetal sin azúcar", quantity: "200ml" },
      { name: "Manzana", quantity: "1 unidad" },
      { name: "Canela en polvo", quantity: "1 cucharadita" },
      { name: "Semillas de lino molidas", quantity: "1 cucharada" },
      { name: "Nueces", quantity: "15g" }
    ],
    instructionsJson: [
      "Calentar la leche vegetal y añadir los copos de avena.",
      "Cocinar 5-7 minutos a fuego medio removiendo.",
      "Añadir la canela y mezclar.",
      "Servir con la manzana rallada o en dados por encima.",
      "Espolvorear con semillas de lino y nueces troceadas."
    ]
  },
  {
    name: "Ensalada de Salmón con Aguacate y Espinacas",
    category: "colesterol",
    tags: ["colesterol","omega3","cardiosaludable","proteina"],
    mealTime: "comida",
    description: "Combinación perfecta de omega-3 (salmón), grasas monoinsaturadas (aguacate) y antioxidantes (espinacas) para reducir el colesterol LDL y aumentar el HDL.",
    preparationTime: 15, cookTime: 10, servings: 2, difficulty: "easy",
    calories: 380, proteins: 28, carbs: 10, fats: 26, fiber: 6,
    allergens: ["pescado"],
    ingredientsJson: [
      { name: "Salmón ahumado", quantity: "150g" },
      { name: "Aguacate", quantity: "1 unidad" },
      { name: "Espinacas baby", quantity: "100g" },
      { name: "Tomate cherry", quantity: "100g" },
      { name: "Cebolla morada", quantity: "1/4 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Zumo de limón", quantity: "2 cucharadas" },
      { name: "Alcaparras", quantity: "1 cucharada" }
    ],
    instructionsJson: [
      "Distribuir las espinacas baby en una fuente.",
      "Añadir el aguacate en láminas y los tomates cherry cortados.",
      "Colocar el salmón ahumado por encima.",
      "Añadir la cebolla morada en aros finos y las alcaparras.",
      "Aliñar con aceite de oliva y zumo de limón."
    ]
  },
  {
    name: "Legumbres con Verduras Anti-Colesterol",
    category: "colesterol",
    tags: ["colesterol","fibra_soluble","proteina_vegetal","cardiosaludable"],
    mealTime: "comida",
    description: "Las legumbres son ricas en fibra soluble que atrapa el colesterol en el intestino. Este guiso de alubias con verduras es un plato completo y cardiosaludable.",
    preparationTime: 15, cookTime: 40, servings: 4, difficulty: "medium",
    calories: 290, proteins: 16, carbs: 42, fats: 6, fiber: 15,
    allergens: [],
    ingredientsJson: [
      { name: "Alubias blancas cocidas", quantity: "400g" },
      { name: "Espinacas", quantity: "200g" },
      { name: "Tomate triturado", quantity: "200g" },
      { name: "Cebolla", quantity: "1 unidad" },
      { name: "Zanahoria", quantity: "2 unidades" },
      { name: "Ajo", quantity: "3 dientes" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Pimentón dulce", quantity: "1 cucharadita" },
      { name: "Comino", quantity: "1/2 cucharadita" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Sofreír la cebolla y el ajo en aceite de oliva 5 minutos.",
      "Añadir la zanahoria en rodajas y el tomate triturado.",
      "Incorporar las alubias y las especias.",
      "Cocinar 15 minutos a fuego medio.",
      "Añadir las espinacas y cocinar 5 minutos más.",
      "Rectificar de sal y servir."
    ]
  },
  {
    name: "Nueces con Fruta Fresca (Snack Cardiosaludable)",
    category: "colesterol",
    tags: ["colesterol","omega3","cardiosaludable","snack"],
    mealTime: "merienda",
    description: "Las nueces son el fruto seco más rico en omega-3 vegetal, ideal para reducir el colesterol. Con fruta fresca forman un snack completo y cardiosaludable.",
    preparationTime: 5, cookTime: 0, servings: 1, difficulty: "easy",
    calories: 220, proteins: 5, carbs: 20, fats: 14, fiber: 4,
    allergens: ["frutos_secos"],
    ingredientsJson: [
      { name: "Nueces", quantity: "30g" },
      { name: "Manzana o pera", quantity: "1 unidad" },
      { name: "Uvas", quantity: "100g" }
    ],
    instructionsJson: [
      "Lavar y cortar la fruta en trozos.",
      "Servir junto con las nueces en un bol.",
      "Consumir como snack entre comidas."
    ]
  },

  // ===== ENFERMEDAD RENAL (bajas en potasio/fósforo) =====
  {
    name: "Arroz con Pollo a la Plancha (Renal)",
    category: "renal",
    tags: ["renal","bajo_potasio","bajo_fosforo","proteina_controlada"],
    mealTime: "comida",
    description: "Plato adaptado para pacientes renales: arroz blanco (bajo en potasio) con pollo a la plancha en cantidad controlada. Sin sal para reducir la carga renal.",
    preparationTime: 10, cookTime: 20, servings: 2, difficulty: "easy",
    calories: 380, proteins: 28, carbs: 50, fats: 6, fiber: 1,
    allergens: [],
    ingredientsJson: [
      { name: "Arroz blanco", quantity: "160g" },
      { name: "Pechuga de pollo", quantity: "200g" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Ajo en polvo", quantity: "1/2 cucharadita" },
      { name: "Perejil seco", quantity: "al gusto" },
      { name: "Pimienta negra", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer el arroz blanco en abundante agua sin sal durante 18 minutos.",
      "Escurrir bien el arroz (esto elimina parte del almidón y potasio).",
      "Cocinar la pechuga de pollo a la plancha con aceite, ajo en polvo y pimienta.",
      "Servir el arroz con el pollo en láminas.",
      "Espolvorear con perejil seco. Sin sal añadida."
    ]
  },
  {
    name: "Pasta con Aceite de Oliva y Ajo (Renal)",
    category: "renal",
    tags: ["renal","bajo_potasio","bajo_fosforo","vegano"],
    mealTime: "comida",
    description: "La pasta es un alimento con bajo contenido en potasio y fósforo, ideal para la dieta renal. Con aceite de oliva y ajo es un plato sencillo y bien tolerado.",
    preparationTime: 5, cookTime: 15, servings: 2, difficulty: "easy",
    calories: 340, proteins: 10, carbs: 58, fats: 8, fiber: 2,
    allergens: ["gluten"],
    ingredientsJson: [
      { name: "Pasta blanca (espaguetis o macarrones)", quantity: "200g" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Ajo", quantity: "2 dientes" },
      { name: "Perejil fresco", quantity: "al gusto" },
      { name: "Pimienta negra", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer la pasta en abundante agua sin sal según instrucciones del paquete.",
      "Mientras tanto, calentar el aceite y dorar el ajo laminado a fuego bajo.",
      "Escurrir la pasta y saltear con el aceite y ajo.",
      "Añadir perejil picado y pimienta negra.",
      "Servir inmediatamente. Sin sal añadida."
    ]
  },
  {
    name: "Tortilla Francesa con Hierbas (Renal)",
    category: "renal",
    tags: ["renal","bajo_potasio","proteina_controlada","facil_digestion"],
    mealTime: "cena",
    description: "La tortilla francesa es una opción sencilla para la dieta renal, con proteína de buena calidad en cantidad controlada. Con hierbas aromáticas para dar sabor sin sal.",
    preparationTime: 5, cookTime: 5, servings: 1, difficulty: "easy",
    calories: 185, proteins: 12, carbs: 1, fats: 14, fiber: 0,
    allergens: ["huevos"],
    ingredientsJson: [
      { name: "Huevos", quantity: "2 unidades" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharadita" },
      { name: "Cebollino fresco", quantity: "al gusto" },
      { name: "Perejil fresco", quantity: "al gusto" },
      { name: "Pimienta negra", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Batir los huevos con las hierbas picadas y pimienta negra. Sin sal.",
      "Calentar el aceite en una sartén antiadherente.",
      "Verter los huevos batidos y cuajar a fuego medio.",
      "Doblar la tortilla por la mitad y servir inmediatamente."
    ]
  },

  // ===== CELIAQUÍA (sin gluten) =====
  {
    name: "Pancakes de Avena sin Gluten con Frutas",
    category: "celiaquía",
    tags: ["celiaquía","sin_gluten","desayuno","proteina"],
    mealTime: "desayuno",
    description: "Pancakes esponjosos elaborados con avena certificada sin gluten y plátano. Un desayuno nutritivo y sabroso para personas con celiaquía.",
    preparationTime: 10, cookTime: 15, servings: 2, difficulty: "easy",
    calories: 310, proteins: 12, carbs: 48, fats: 8, fiber: 5,
    allergens: ["huevos","lacteos"],
    ingredientsJson: [
      { name: "Copos de avena sin gluten", quantity: "100g" },
      { name: "Plátano maduro", quantity: "1 unidad" },
      { name: "Huevo", quantity: "2 unidades" },
      { name: "Leche sin lactosa", quantity: "100ml" },
      { name: "Levadura sin gluten", quantity: "1 cucharadita" },
      { name: "Canela", quantity: "1/2 cucharadita" },
      { name: "Fresas frescas", quantity: "100g" },
      { name: "Miel", quantity: "1 cucharada" }
    ],
    instructionsJson: [
      "Triturar los copos de avena hasta obtener harina.",
      "Machacar el plátano y mezclar con los huevos y la leche.",
      "Añadir la harina de avena, levadura y canela. Mezclar bien.",
      "Calentar una sartén antiadherente y cocinar los pancakes 2-3 minutos por lado.",
      "Servir con fresas laminadas y miel."
    ]
  },
  {
    name: "Ensalada de Quinoa con Verduras y Pollo",
    category: "celiaquía",
    tags: ["celiaquía","sin_gluten","proteina","completo"],
    mealTime: "comida",
    description: "La quinoa es naturalmente sin gluten y aporta proteína completa. Esta ensalada es nutritiva, colorida y perfecta para personas con celiaquía.",
    preparationTime: 20, cookTime: 15, servings: 2, difficulty: "easy",
    calories: 420, proteins: 32, carbs: 40, fats: 12, fiber: 6,
    allergens: [],
    ingredientsJson: [
      { name: "Quinoa", quantity: "150g" },
      { name: "Pechuga de pollo a la plancha", quantity: "200g" },
      { name: "Pepino", quantity: "1 unidad" },
      { name: "Tomate cherry", quantity: "150g" },
      { name: "Maíz dulce", quantity: "80g" },
      { name: "Aguacate", quantity: "1/2 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Zumo de limón", quantity: "2 cucharadas" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer la quinoa en agua (doble cantidad) 15 minutos. Dejar enfriar.",
      "Cortar el pollo en tiras, el pepino en dados y los tomates por la mitad.",
      "Mezclar la quinoa fría con todas las verduras.",
      "Añadir el aguacate en dados y el maíz.",
      "Aliñar con aceite de oliva, zumo de limón, sal y pimienta."
    ]
  },
  {
    name: "Arroz con Leche Sin Gluten",
    category: "celiaquía",
    tags: ["celiaquía","sin_gluten","postre","reconfortante"],
    mealTime: "merienda",
    description: "Postre tradicional naturalmente sin gluten. El arroz con leche es cremoso, reconfortante y perfectamente apto para personas con celiaquía.",
    preparationTime: 5, cookTime: 40, servings: 4, difficulty: "medium",
    calories: 220, proteins: 6, carbs: 38, fats: 6, fiber: 0,
    allergens: ["lacteos"],
    ingredientsJson: [
      { name: "Arroz de grano redondo", quantity: "150g" },
      { name: "Leche entera", quantity: "1 litro" },
      { name: "Azúcar", quantity: "80g" },
      { name: "Canela en rama", quantity: "1 unidad" },
      { name: "Piel de limón", quantity: "1 tira" },
      { name: "Canela en polvo", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Calentar la leche con la canela en rama y la piel de limón.",
      "Cuando hierva, añadir el arroz y reducir el fuego al mínimo.",
      "Cocinar 35-40 minutos removiendo frecuentemente.",
      "Añadir el azúcar en los últimos 10 minutos.",
      "Retirar la canela y la piel de limón.",
      "Servir en cuencos y espolvorear con canela en polvo."
    ]
  },
  {
    name: "Tortitas de Patata Sin Gluten",
    category: "celiaquía",
    tags: ["celiaquía","sin_gluten","desayuno","vegano"],
    mealTime: "desayuno",
    description: "Tortitas crujientes de patata, naturalmente sin gluten. Perfectas para el desayuno o la merienda de personas con celiaquía.",
    preparationTime: 15, cookTime: 20, servings: 2, difficulty: "medium",
    calories: 195, proteins: 5, carbs: 35, fats: 5, fiber: 3,
    allergens: ["huevos"],
    ingredientsJson: [
      { name: "Patata", quantity: "400g" },
      { name: "Huevo", quantity: "1 unidad" },
      { name: "Cebolla", quantity: "1/2 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Sal y pimienta", quantity: "al gusto" },
      { name: "Perejil seco", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Rallar las patatas y la cebolla. Escurrir bien con un paño.",
      "Mezclar con el huevo batido, sal, pimienta y perejil.",
      "Formar pequeñas tortitas y aplanar.",
      "Freír en aceite de oliva 4-5 minutos por cada lado hasta que estén doradas.",
      "Escurrir en papel absorbente y servir calientes."
    ]
  },

  // ===== INTESTINO IRRITABLE / FODMAP =====
  {
    name: "Pollo a la Plancha con Arroz y Zanahoria (FODMAP)",
    category: "intestino_irritable",
    tags: ["intestino_irritable","fodmap","bajo_fodmap","facil_digestion"],
    mealTime: "comida",
    description: "Plato bajo en FODMAPs, ideal para el síndrome de intestino irritable. El pollo, el arroz y la zanahoria son alimentos bien tolerados que no provocan síntomas.",
    preparationTime: 10, cookTime: 25, servings: 2, difficulty: "easy",
    calories: 350, proteins: 35, carbs: 40, fats: 6, fiber: 2,
    allergens: [],
    ingredientsJson: [
      { name: "Pechuga de pollo", quantity: "300g" },
      { name: "Arroz blanco", quantity: "150g" },
      { name: "Zanahoria", quantity: "2 unidades" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Sal", quantity: "pizca" },
      { name: "Tomillo seco", quantity: "al gusto" },
      { name: "Pimienta negra", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer el arroz en agua con sal 18 minutos.",
      "Cocer la zanahoria en rodajas hasta que esté tierna.",
      "Cocinar el pollo a la plancha con aceite, sal, tomillo y pimienta.",
      "Servir el pollo con el arroz y la zanahoria.",
      "Evitar añadir ajo, cebolla o especias que puedan irritar."
    ]
  },
  {
    name: "Tortilla de Patatas Sin Cebolla (FODMAP)",
    category: "intestino_irritable",
    tags: ["intestino_irritable","fodmap","bajo_fodmap","proteina"],
    mealTime: "cena",
    description: "La tortilla de patatas sin cebolla es perfecta para la dieta FODMAP. La patata y el huevo son alimentos bien tolerados por personas con intestino irritable.",
    preparationTime: 15, cookTime: 25, servings: 4, difficulty: "medium",
    calories: 265, proteins: 12, carbs: 22, fats: 15, fiber: 2,
    allergens: ["huevos"],
    ingredientsJson: [
      { name: "Patata", quantity: "500g" },
      { name: "Huevos", quantity: "5 unidades" },
      { name: "Aceite de oliva virgen extra", quantity: "4 cucharadas" },
      { name: "Sal", quantity: "pizca" },
      { name: "Perejil fresco", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Pelar y cortar las patatas en láminas finas.",
      "Freír las patatas en aceite de oliva a fuego medio-bajo 15 minutos.",
      "Escurrir el aceite sobrante.",
      "Batir los huevos con sal y mezclar con las patatas.",
      "Cuajar la tortilla en una sartén antiadherente a fuego medio.",
      "Dar la vuelta con un plato y terminar de cuajar."
    ]
  },
  {
    name: "Salmón al Horno con Patata y Pimiento (FODMAP)",
    category: "intestino_irritable",
    tags: ["intestino_irritable","fodmap","bajo_fodmap","omega3"],
    mealTime: "comida",
    description: "El salmón, la patata y el pimiento rojo son alimentos bajos en FODMAPs. Este plato al horno es nutritivo y bien tolerado por personas con intestino irritable.",
    preparationTime: 15, cookTime: 30, servings: 2, difficulty: "easy",
    calories: 410, proteins: 32, carbs: 30, fats: 18, fiber: 3,
    allergens: ["pescado"],
    ingredientsJson: [
      { name: "Filete de salmón", quantity: "300g" },
      { name: "Patata", quantity: "300g" },
      { name: "Pimiento rojo", quantity: "1 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Sal", quantity: "pizca" },
      { name: "Orégano seco", quantity: "al gusto" },
      { name: "Zumo de limón", quantity: "1 cucharada" }
    ],
    instructionsJson: [
      "Precalentar el horno a 200°C.",
      "Cortar las patatas en rodajas y el pimiento en tiras.",
      "Colocar las verduras en una bandeja, aliñar con aceite y sal.",
      "Hornear 15 minutos, añadir el salmón encima.",
      "Continuar horneando 12-15 minutos más.",
      "Servir con zumo de limón y orégano."
    ]
  },

  // ===== OSTEOPOROSIS (alto en calcio y vitamina D) =====
  {
    name: "Revuelto de Sardinas con Espinacas",
    category: "osteoporosis",
    tags: ["osteoporosis","calcio","vitamina_d","omega3"],
    mealTime: "cena",
    description: "Las sardinas son ricas en calcio (se comen con espinas) y vitamina D. Con espinacas que aportan calcio vegetal, este revuelto es un aliado para los huesos.",
    preparationTime: 10, cookTime: 10, servings: 2, difficulty: "easy",
    calories: 285, proteins: 22, carbs: 4, fats: 20, fiber: 2,
    allergens: ["pescado","huevos"],
    ingredientsJson: [
      { name: "Sardinas en aceite de oliva (lata)", quantity: "2 latas (200g)" },
      { name: "Espinacas frescas", quantity: "150g" },
      { name: "Huevos", quantity: "3 unidades" },
      { name: "Ajo", quantity: "2 dientes" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Saltear el ajo picado en aceite de oliva.",
      "Añadir las espinacas y cocinar hasta que se reduzcan.",
      "Incorporar las sardinas escurridas y desmenuzadas.",
      "Añadir los huevos batidos y revolver a fuego bajo.",
      "Sazonar con sal y pimienta. Servir inmediatamente."
    ]
  },
  {
    name: "Yogur con Almendras y Semillas de Sésamo",
    category: "osteoporosis",
    tags: ["osteoporosis","calcio","proteina","snack"],
    mealTime: "merienda",
    description: "El yogur, las almendras y el sésamo son tres fuentes excelentes de calcio. Este snack sencillo aporta una dosis significativa de calcio biodisponible.",
    preparationTime: 5, cookTime: 0, servings: 1, difficulty: "easy",
    calories: 240, proteins: 14, carbs: 16, fats: 14, fiber: 3,
    allergens: ["lacteos","frutos_secos"],
    ingredientsJson: [
      { name: "Yogur griego natural", quantity: "150g" },
      { name: "Almendras", quantity: "20g" },
      { name: "Semillas de sésamo", quantity: "1 cucharada" },
      { name: "Higos secos", quantity: "2 unidades" },
      { name: "Miel", quantity: "1 cucharadita" }
    ],
    instructionsJson: [
      "Poner el yogur griego en un bol.",
      "Añadir las almendras y los higos secos troceados.",
      "Espolvorear con semillas de sésamo.",
      "Añadir un chorrito de miel por encima.",
      "Servir inmediatamente."
    ]
  },
  {
    name: "Crema de Brócoli con Queso (Alta en Calcio)",
    category: "osteoporosis",
    tags: ["osteoporosis","calcio","vitamina_k","cardiosaludable"],
    mealTime: "cena",
    description: "El brócoli y el queso son dos de las mejores fuentes de calcio. Esta crema combina ambos para un plato delicioso y muy rico en calcio para la salud ósea.",
    preparationTime: 15, cookTime: 20, servings: 4, difficulty: "easy",
    calories: 195, proteins: 12, carbs: 14, fats: 10, fiber: 5,
    allergens: ["lacteos"],
    ingredientsJson: [
      { name: "Brócoli", quantity: "600g" },
      { name: "Queso parmesano rallado", quantity: "50g" },
      { name: "Caldo de verduras", quantity: "500ml" },
      { name: "Leche entera", quantity: "100ml" },
      { name: "Cebolla", quantity: "1 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "1 cucharada" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Sofreír la cebolla en aceite de oliva 5 minutos.",
      "Añadir el brócoli troceado y el caldo.",
      "Cocinar 15 minutos hasta que el brócoli esté tierno.",
      "Añadir la leche y triturar hasta obtener una crema suave.",
      "Incorporar el queso parmesano rallado y mezclar.",
      "Sazonar y servir caliente."
    ]
  },

  // ===== ANEMIA (alto en hierro) =====
  {
    name: "Lentejas con Espinacas y Limón",
    category: "anemia",
    tags: ["anemia","hierro","vitamina_c","proteina_vegetal"],
    mealTime: "comida",
    description: "Las lentejas son la legumbre más rica en hierro no hemo. La vitamina C del limón multiplica la absorción del hierro. Con espinacas para un aporte extra de hierro.",
    preparationTime: 15, cookTime: 30, servings: 4, difficulty: "easy",
    calories: 310, proteins: 20, carbs: 46, fats: 5, fiber: 16,
    allergens: [],
    ingredientsJson: [
      { name: "Lentejas rojas", quantity: "300g" },
      { name: "Espinacas frescas", quantity: "200g" },
      { name: "Cebolla", quantity: "1 unidad" },
      { name: "Ajo", quantity: "3 dientes" },
      { name: "Tomate triturado", quantity: "200g" },
      { name: "Caldo de verduras", quantity: "800ml" },
      { name: "Comino", quantity: "1 cucharadita" },
      { name: "Cúrcuma", quantity: "1/2 cucharadita" },
      { name: "Zumo de limón", quantity: "2 cucharadas" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" }
    ],
    instructionsJson: [
      "Sofreír la cebolla y el ajo en aceite de oliva.",
      "Añadir el tomate y las especias, cocinar 5 minutos.",
      "Incorporar las lentejas lavadas y el caldo.",
      "Cocinar 20-25 minutos hasta que las lentejas estén tiernas.",
      "Añadir las espinacas en los últimos 5 minutos.",
      "Servir con zumo de limón por encima para potenciar la absorción del hierro."
    ]
  },
  {
    name: "Hígado Encebollado con Pimientos",
    category: "anemia",
    tags: ["anemia","hierro","vitamina_b12","proteina"],
    mealTime: "comida",
    description: "El hígado es el alimento más rico en hierro hemo (de alta biodisponibilidad) y vitamina B12, esenciales para combatir la anemia. Receta clásica y nutritiva.",
    preparationTime: 15, cookTime: 20, servings: 2, difficulty: "medium",
    calories: 290, proteins: 28, carbs: 14, fats: 12, fiber: 2,
    allergens: [],
    ingredientsJson: [
      { name: "Hígado de ternera", quantity: "300g" },
      { name: "Cebolla", quantity: "2 unidades" },
      { name: "Pimiento rojo", quantity: "1 unidad" },
      { name: "Ajo", quantity: "2 dientes" },
      { name: "Vino blanco", quantity: "50ml" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Sal y pimienta", quantity: "al gusto" },
      { name: "Perejil fresco", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cortar la cebolla en juliana y el pimiento en tiras.",
      "Sofreír la cebolla y el pimiento a fuego lento 15 minutos hasta que caramelicen.",
      "Añadir el ajo picado y cocinar 2 minutos más.",
      "Retirar las verduras. En la misma sartén, sellar el hígado 2 minutos por lado.",
      "Añadir el vino blanco y dejar reducir.",
      "Incorporar las verduras, mezclar y servir con perejil."
    ]
  },
  {
    name: "Batido de Espinacas con Naranja y Semillas de Cáñamo",
    category: "anemia",
    tags: ["anemia","hierro","vitamina_c","vegano"],
    mealTime: "desayuno",
    description: "Batido rico en hierro vegetal (espinacas, semillas de cáñamo) y vitamina C (naranja) para maximizar la absorción del hierro. Ideal para combatir la anemia.",
    preparationTime: 5, cookTime: 0, servings: 1, difficulty: "easy",
    calories: 220, proteins: 10, carbs: 28, fats: 8, fiber: 5,
    allergens: [],
    ingredientsJson: [
      { name: "Espinacas frescas", quantity: "80g" },
      { name: "Naranja", quantity: "2 unidades (zumo)" },
      { name: "Plátano", quantity: "1/2 unidad" },
      { name: "Semillas de cáñamo", quantity: "2 cucharadas" },
      { name: "Agua", quantity: "100ml" }
    ],
    instructionsJson: [
      "Exprimir las naranjas y poner el zumo en la batidora.",
      "Añadir las espinacas, el plátano y las semillas de cáñamo.",
      "Agregar el agua y triturar a máxima potencia 1 minuto.",
      "Servir inmediatamente para aprovechar la vitamina C.",
      "No añadir lácteos ya que el calcio interfiere con la absorción del hierro."
    ]
  },

  // ===== HIPOTIROIDISMO =====
  {
    name: "Ensalada de Atún con Algas y Sésamo",
    category: "hipotiroidismo",
    tags: ["hipotiroidismo","yodo","selenio","omega3"],
    mealTime: "comida",
    description: "El atún y las algas son fuentes excelentes de yodo, mineral esencial para la función tiroidea. Con sésamo rico en selenio, otro nutriente clave para la tiroides.",
    preparationTime: 15, cookTime: 0, servings: 2, difficulty: "easy",
    calories: 295, proteins: 28, carbs: 12, fats: 14, fiber: 4,
    allergens: ["pescado","sesamo"],
    ingredientsJson: [
      { name: "Atún en aceite de oliva (lata)", quantity: "2 latas (200g)" },
      { name: "Algas wakame rehidratadas", quantity: "50g" },
      { name: "Pepino", quantity: "1 unidad" },
      { name: "Tomate cherry", quantity: "100g" },
      { name: "Semillas de sésamo tostadas", quantity: "2 cucharadas" },
      { name: "Aceite de sésamo", quantity: "1 cucharadita" },
      { name: "Salsa de soja baja en sodio", quantity: "1 cucharada" },
      { name: "Zumo de limón", quantity: "1 cucharada" }
    ],
    instructionsJson: [
      "Rehidratar las algas wakame en agua fría 5 minutos y escurrir.",
      "Cortar el pepino en medias lunas y los tomates por la mitad.",
      "Mezclar el atún escurrido con las algas y las verduras.",
      "Aliñar con aceite de sésamo, salsa de soja y zumo de limón.",
      "Espolvorear con semillas de sésamo tostadas."
    ]
  },

  // ===== GOTA (bajo en purinas) =====
  {
    name: "Pasta con Verduras y Aceite de Oliva (Anti-Gota)",
    category: "gota",
    tags: ["gota","bajo_purinas","vegano","reconfortante"],
    mealTime: "comida",
    description: "Plato bajo en purinas, ideal para personas con gota. La pasta y las verduras tienen un contenido muy bajo en purinas, a diferencia de las carnes y mariscos.",
    preparationTime: 15, cookTime: 15, servings: 2, difficulty: "easy",
    calories: 380, proteins: 12, carbs: 62, fats: 10, fiber: 5,
    allergens: ["gluten"],
    ingredientsJson: [
      { name: "Pasta integral", quantity: "200g" },
      { name: "Calabacín", quantity: "1 unidad" },
      { name: "Tomate cherry", quantity: "150g" },
      { name: "Pimiento rojo", quantity: "1 unidad" },
      { name: "Ajo", quantity: "2 dientes" },
      { name: "Aceite de oliva virgen extra", quantity: "3 cucharadas" },
      { name: "Albahaca fresca", quantity: "al gusto" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer la pasta según instrucciones del paquete.",
      "Saltear el ajo en aceite de oliva.",
      "Añadir el calabacín y pimiento en dados, cocinar 8 minutos.",
      "Incorporar los tomates cherry y cocinar 3 minutos más.",
      "Mezclar con la pasta escurrida.",
      "Servir con albahaca fresca y un chorrito de aceite de oliva."
    ]
  },
  {
    name: "Tortilla de Verduras Sin Carnes (Anti-Gota)",
    category: "gota",
    tags: ["gota","bajo_purinas","proteina","vegetariano"],
    mealTime: "cena",
    description: "Los huevos tienen un contenido moderado en purinas y son una buena fuente de proteína para personas con gota. Con verduras bajas en purinas.",
    preparationTime: 15, cookTime: 15, servings: 2, difficulty: "easy",
    calories: 220, proteins: 14, carbs: 12, fats: 14, fiber: 3,
    allergens: ["huevos"],
    ingredientsJson: [
      { name: "Huevos", quantity: "4 unidades" },
      { name: "Pimiento rojo", quantity: "1/2 unidad" },
      { name: "Calabacín", quantity: "1/2 unidad" },
      { name: "Tomate", quantity: "1 unidad" },
      { name: "Cebolla", quantity: "1/2 unidad" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Saltear la cebolla, pimiento y calabacín en aceite de oliva 8 minutos.",
      "Añadir el tomate en dados y cocinar 3 minutos más.",
      "Batir los huevos con sal y pimienta.",
      "Verter los huevos sobre las verduras y cuajar a fuego medio.",
      "Dar la vuelta y terminar de cuajar."
    ]
  },

  // ===== EMBARAZO (alto en ácido fólico, hierro, calcio) =====
  {
    name: "Ensalada de Espinacas con Fresas y Nueces (Embarazo)",
    category: "embarazo",
    tags: ["embarazo","acido_folico","hierro","vitamina_c"],
    mealTime: "comida",
    description: "Las espinacas son ricas en ácido fólico, esencial en el embarazo. Las fresas aportan vitamina C que potencia la absorción del hierro. Las nueces aportan omega-3 para el desarrollo cerebral del bebé.",
    preparationTime: 10, cookTime: 0, servings: 2, difficulty: "easy",
    calories: 245, proteins: 8, carbs: 18, fats: 16, fiber: 6,
    allergens: ["frutos_secos"],
    ingredientsJson: [
      { name: "Espinacas baby", quantity: "150g" },
      { name: "Fresas", quantity: "150g" },
      { name: "Nueces", quantity: "30g" },
      { name: "Queso fresco", quantity: "60g" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Vinagre balsámico", quantity: "1 cucharada" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Lavar y secar las espinacas baby.",
      "Lavar y laminar las fresas.",
      "Desmigar el queso fresco.",
      "Mezclar todos los ingredientes en una ensaladera.",
      "Aliñar con aceite de oliva, vinagre balsámico, sal y pimienta.",
      "Servir inmediatamente."
    ]
  },
  {
    name: "Salmón con Brócoli y Arroz (Embarazo)",
    category: "embarazo",
    tags: ["embarazo","omega3","acido_folico","calcio"],
    mealTime: "comida",
    description: "Plato completo para el embarazo: el salmón aporta omega-3 para el desarrollo cerebral del bebé, el brócoli es rico en ácido fólico y calcio, y el arroz aporta energía.",
    preparationTime: 15, cookTime: 25, servings: 2, difficulty: "easy",
    calories: 445, proteins: 36, carbs: 42, fats: 14, fiber: 5,
    allergens: ["pescado"],
    ingredientsJson: [
      { name: "Filete de salmón fresco", quantity: "300g" },
      { name: "Brócoli", quantity: "300g" },
      { name: "Arroz integral", quantity: "120g" },
      { name: "Aceite de oliva virgen extra", quantity: "2 cucharadas" },
      { name: "Ajo", quantity: "1 diente" },
      { name: "Zumo de limón", quantity: "1 cucharada" },
      { name: "Sal y pimienta", quantity: "al gusto" }
    ],
    instructionsJson: [
      "Cocer el arroz integral según instrucciones (20-25 minutos).",
      "Cocer el brócoli al vapor 8 minutos.",
      "Cocinar el salmón a la plancha 4 minutos por lado.",
      "Saltear el brócoli con ajo y aceite de oliva 2 minutos.",
      "Servir el salmón sobre el arroz con el brócoli.",
      "Aliñar con zumo de limón."
    ]
  },
  {
    name: "Batido de Leche con Plátano y Almendras (Embarazo)",
    category: "embarazo",
    tags: ["embarazo","calcio","magnesio","energia"],
    mealTime: "merienda",
    description: "Batido nutritivo para el embarazo: la leche aporta calcio para el desarrollo óseo del bebé, el plátano aporta potasio y las almendras aportan magnesio y vitamina E.",
    preparationTime: 5, cookTime: 0, servings: 1, difficulty: "easy",
    calories: 310, proteins: 12, carbs: 42, fats: 12, fiber: 4,
    allergens: ["lacteos","frutos_secos"],
    ingredientsJson: [
      { name: "Leche entera", quantity: "250ml" },
      { name: "Plátano maduro", quantity: "1 unidad" },
      { name: "Almendras", quantity: "20g" },
      { name: "Miel", quantity: "1 cucharadita" },
      { name: "Canela en polvo", quantity: "1/4 cucharadita" }
    ],
    instructionsJson: [
      "Poner todos los ingredientes en la batidora.",
      "Triturar hasta obtener una textura cremosa y homogénea.",
      "Servir frío o a temperatura ambiente.",
      "Consumir inmediatamente para aprovechar todos los nutrientes."
    ]
  },

  // ===== MENOPAUSIA =====
  {
    name: "Tofu con Soja y Verduras (Menopausia)",
    category: "menopausia",
    tags: ["menopausia","fitoestrógenos","calcio","proteina"],
    mealTime: "comida",
    description: "El tofu y la soja son ricos en fitoestrógenos que ayudan a aliviar los síntomas de la menopausia. Este salteado es nutritivo y equilibrado.",
    preparationTime: 15, cookTime: 15, servings: 2, difficulty: "easy",
    calories: 295, proteins: 22, carbs: 18, fats: 16, fiber: 5,
    allergens: ["soja"],
    ingredientsJson: [
      { name: "Tofu firme", quantity: "300g" },
      { name: "Edamame (soja verde)", quantity: "100g" },
      { name: "Pimiento rojo", quantity: "1 unidad" },
      { name: "Calabacín", quantity: "1 unidad" },
      { name: "Ajo", quantity: "2 dientes" },
      { name: "Jengibre fresco", quantity: "1 cm" },
      { name: "Salsa de soja baja en sodio", quantity: "2 cucharadas" },
      { name: "Aceite de sésamo", quantity: "1 cucharada" },
      { name: "Semillas de sésamo", quantity: "1 cucharada" }
    ],
    instructionsJson: [
      "Cortar el tofu en dados y dorar en aceite de sésamo 5 minutos.",
      "Añadir el ajo y jengibre picados, saltear 1 minuto.",
      "Incorporar el pimiento y calabacín en tiras, cocinar 5 minutos.",
      "Añadir el edamame y la salsa de soja.",
      "Cocinar 3 minutos más y servir con semillas de sésamo."
    ]
  },
  {
    name: "Smoothie de Soja con Frutos Rojos (Menopausia)",
    category: "menopausia",
    tags: ["menopausia","fitoestrógenos","antioxidante","calcio"],
    mealTime: "desayuno",
    description: "Batido rico en fitoestrógenos (leche de soja) y antioxidantes (frutos rojos) para aliviar los síntomas de la menopausia y proteger contra el envejecimiento celular.",
    preparationTime: 5, cookTime: 0, servings: 1, difficulty: "easy",
    calories: 195, proteins: 8, carbs: 28, fats: 5, fiber: 5,
    allergens: ["soja"],
    ingredientsJson: [
      { name: "Leche de soja sin azúcar", quantity: "250ml" },
      { name: "Frutos rojos mixtos", quantity: "150g" },
      { name: "Plátano", quantity: "1/2 unidad" },
      { name: "Semillas de lino molidas", quantity: "1 cucharada" },
      { name: "Canela en polvo", quantity: "1/4 cucharadita" }
    ],
    instructionsJson: [
      "Poner todos los ingredientes en la batidora.",
      "Triturar a máxima potencia 1 minuto.",
      "Servir inmediatamente en un vaso alto.",
      "Consumir como desayuno o merienda."
    ]
  }
];

async function main() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const conn = await mysql.createConnection(DATABASE_URL);
  console.log('Connected to database');

  // Obtener userId del seed
  const [userRows] = await conn.query('SELECT userId FROM recipes WHERE isSeeded = 1 LIMIT 1');
  const userId = userRows[0]?.userId || 1;
  console.log('Using userId:', userId);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const recipe of RECIPES) {
    try {
      // Verificar si ya existe
      const [existing] = await conn.query(
        'SELECT id FROM recipes WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
        [recipe.name]
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      await conn.query(
        `INSERT INTO recipes (
          userId, name, description, preparationTime, cookTime, servings, difficulty,
          isPublic, active, caloriesPerServing, proteinsPerServing, carbsPerServing,
          fatsPerServing, fiberPerServing, mealTime, category, allergens, tags,
          ingredientsJson, instructionsJson, isSeeded, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          userId,
          recipe.name,
          recipe.description,
          recipe.preparationTime,
          recipe.cookTime,
          recipe.servings,
          recipe.difficulty,
          recipe.calories,
          recipe.proteins,
          recipe.carbs,
          recipe.fats,
          recipe.fiber || 0,
          recipe.mealTime,
          recipe.category,
          JSON.stringify(recipe.allergens || []),
          JSON.stringify(recipe.tags || []),
          JSON.stringify(recipe.ingredientsJson || []),
          JSON.stringify(recipe.instructionsJson || [])
        ]
      );
      inserted++;
      if (inserted % 10 === 0) console.log(`Inserted ${inserted}/${RECIPES.length}...`);
    } catch (e) {
      errors++;
      console.error(`✗ Error inserting "${recipe.name}": ${e.message}`);
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`Insertadas: ${inserted}`);
  console.log(`Omitidas (ya existían): ${skipped}`);
  console.log(`Errores: ${errors}`);

  const [total] = await conn.query('SELECT COUNT(*) as cnt FROM recipes');
  console.log(`Total recetas en BD: ${total[0].cnt}`);

  // Breakdown por categoría médica
  const [cats] = await conn.query(
    `SELECT category, COUNT(*) as count FROM recipes 
     WHERE category IN ('hipertension','diabetes','postoperatorio','colesterol','renal','celiaquía','intestino_irritable','osteoporosis','anemia','hipotiroidismo','gota','embarazo','menopausia')
     GROUP BY category ORDER BY count DESC`
  );
  console.log('\nRecetas por condición médica:');
  for (const c of cats) console.log(`  ${c.category}: ${c.count}`);

  await conn.end();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
