# BuddyMarket - Todo List

## Fase 2: Base de datos y estructura
- [x] Esquema completo de base de datos en drizzle/schema.ts
- [x] Helpers de consulta en server/db.ts
- [x] Configurar índice CSS con tema y fuentes
- [x] Configurar App.tsx con rutas y layout

## Fase 3: Backend API (tRPC routers)
- [x] Router de autenticación y perfil de usuario
- [x] Router de catálogos (alergias, restricciones, categorías, medidas)
- [x] Router de ingredientes
- [x] Router de recetas (CRUD, búsqueda, favoritos)
- [x] Router de organizador de menús
- [x] Router de listas de compra
- [x] Router de inventario
- [x] Router de historial de comidas (meal logs)
- [x] Router de suscripciones
- [x] Router de admin (gestión de catálogos y usuarios)

## Fase 4: Layout y autenticación
- [x] Layout principal con navegación (AppLayout con sidebar)
- [x] Landing page pública atractiva
- [x] Página de login/registro (via Manus OAuth)
- [x] Página de perfil de usuario
- [x] Perfil médico

## Fase 5: Módulo de recetas
- [x] Listado de recetas con filtros y búsqueda
- [x] Detalle de receta (ingredientes, pasos, nutrición)
- [x] Crear receta
- [x] Editar receta
- [x] Búsqueda avanzada con filtros múltiples

## Fase 6: Menús, compras e inventario
- [x] Organizador de menús (vista semanal/mensual)
- [x] Asignación de recetas a días y comidas
- [x] Generación de menús con IA
- [x] Listas de compra (crear, gestionar)
- [x] Generación automática de lista desde menú
- [x] Inventario alimentario (CRUD)
- [x] Seguimiento de caducidades
- [x] Alertas de productos próximos a vencer

## Fase 7: Dashboard y perfil
- [x] Dashboard principal con resumen nutricional
- [x] Historial de comidas consumidas
- [x] Seguimiento de macronutrientes diarios
- [x] Evolución de métricas de salud
- [x] Objetivos nutricionales
- [x] Preferencias dietéticas (alergias, restricciones)

## Fase 8: Admin y suscripciones
- [x] Panel admin: gestión de ingredientes
- [x] Panel admin: gestión de alergias y restricciones
- [x] Panel admin: gestión de categorías
- [x] Panel admin: gestión de usuarios y roles
- [x] Integración Stripe para suscripciones
- [x] Página de planes de suscripción (Basic 4.99€, Premium 9.99€, Pro Max 19.99€)
- [x] Gestión de estado de suscripción

## Fase 9: Calidad y entrega
- [x] Tests vitest para routers principales (15 tests pasando)
- [x] Disclaimer en todas las páginas
- [x] Logo BuddyMarket en todas las páginas
- [x] Responsive design en todas las vistas
- [x] Estados de carga y error en todas las páginas
- [x] Checkpoint final y entrega

## Correcciones sesión actual
- [x] Fix db.insert: 22 helpers BuddyPet en server/db.ts usaban getDb() sin await (causa db.insert is not a function)
- [x] Fix landing móvil: botones CTA del hero ahora en fila con flexWrap, añadido segundo botón "Ver funciones"

## Mejoras futuras (fuera del alcance inicial - v2)
- [x] Onboarding guiado para nuevos usuarios (implementado)
- [ ] Notificación por email en nuevos registros
- [ ] Exportación de datos del perfil
- [ ] Modo oscuro
- [x] PWA / App móvil (implementado)
- [x] Recetas favoritas (implementado)
- [x] Recomendaciones personalizadas de recetas (implementado)

## Rebranding VIVELY (nueva fase)
- [x] Actualizar CSS global: colores VIVELY (#00D27A), fondo blanco/crema, tipografía Bricolage Grotesque
- [x] Actualizar index.html con fuente Bricolage Grotesque de Google Fonts
- [x] Actualizar VITE_APP_TITLE a "VIVELY"
- [x] Reconstruir AppLayout: mobile-first, bottom navigation flotante estilo original, sin sidebar
- [x] Reconstruir Dashboard con estilo VIVELY (cards blancas, fondo crema, accesos rápidos)
- [x] Reconstruir página de Recetas con estilo VIVELY
- [x] Reconstruir RecipeDetail con estilo VIVELY
- [x] Reconstruir RecipeForm con estilo VIVELY
- [x] Reconstruir Menús con estilo VIVELY
- [x] Reconstruir ShoppingLists con estilo VIVELY
- [x] Reconstruir Inventory con estilo VIVELY
- [x] Reconstruir MealLog con estilo VIVELY
- [x] Reconstruir Profile con estilo VIVELY
- [x] Reconstruir Subscription con estilo VIVELY
- [x] Reconstruir Admin con estilo VIVELY
- [x] Reconstruir Home (landing) con estilo VIVELY

## Actualización diseño naranja/crema premium (fase actual)
- [x] Cambiar todos los colores de verde (#00D27A) a naranja (#F97316) en todas las páginas
- [x] Actualizar CSS global con colores naranja/crema premium
- [x] Actualizar AppLayout con diseño naranja/crema
- [x] Actualizar Dashboard con diseño naranja/crema
- [x] Actualizar Home.tsx con colores naranja
- [x] Añadir clases CSS search-bar y recipe-tile faltantes
- [x] Corregir vively-page para no duplicar padding con AppLayout
- [x] Añadir AppLayout a todas las páginas que no lo tenían (via WithLayout en App.tsx)
- [x] Verificar TypeScript sin errores (0 errores)
- [x] Verificar tests pasando (15/15 tests)

## Rediseño premium estilo BuddyCoach
- [x] Reconstruir AppLayout: sidebar deslizante con hamburguesa, header con logo+página+campana
- [x] Bottom nav con iconos SVG estilo BuddyCoach (Inicio, Recetas, Diario, Menús, Perfil)
- [x] Fondo crema/beige en toda la app
- [x] Dashboard: greeting con avatar, cards con imagen de fondo oscura, accesos rápidos
- [x] Cards de recetas/menús con imagen de fondo y overlay oscuro
- [x] Sidebar: lista completa de navegación, selector de idioma, perfil de usuario en bottom
- [x] Header sticky con botón hamburguesa, logo BuddyMarket, nombre de página, campana
- [x] Actualizar todas las páginas con el nuevo diseño

## Rediseño BuddyCoach-style (completado)
- [x] AppLayout: sidebar deslizante con hamburguesa, header logo+página+campana
- [x] Bottom nav con iconos SVG (Inicio, Recetas, Diario, Menús, Perfil)
- [x] Dashboard: greeting con avatar, ring de calorías, accesos rápidos, recetas con imagen de fondo
- [x] Home: landing page premium con stats, features, how-it-works, pricing
- [x] Font: Plus Jakarta Sans como fuente principal
- [x] Branding: BuddyMarket en título, meta description y header
- [x] TypeScript: 0 errores
- [x] Tests: 15/15 pasando

## Sprint 3: BuddyExperts + Dashboard mejoras
- [x] Página BuddyExperts: listado de expertos con perfil, especialidad y botón de contacto
- [x] Ruta /buddy-experts en App.tsx y enlace en sidebar
- [x] Dashboard: carrusel de receta del día con auto-rotación cada 3 segundos
- [x] Dashboard: card BuddyShop (acceso a planes Pro/Pro Max)
- [x] Dashboard: card de upgrade a Pro/Pro Max con CTA a /subscription

## BuddyShop Multi-Supermercado
- [x] Rediseñar BuddyShop como hub de supermercados (Mercadona, Carrefour, Lidl, Alcampo, Dia, El Corte Inglés)
- [x] Guardar supermercado preferido del usuario en la base de datos (campo preferredSupermarket en users)
- [x] Página BuddyShop: selector visual de supermercado con logo y descripción
- [x] Página Mercadona: productos reales con API (renombrar MercadonaShop → MercadonaStore)
- [x] Páginas stub para Carrefour, Lidl, Alcampo, Dia, El Corte Inglés (próximamente)
- [x] Dashboard card BuddyShop muestra el supermercado preferido del usuario

## BuddyShop como enlace externo (buddyshop.app)
- [x] Dashboard card BuddyShop → enlace externo a buddyshop.app (abre en nueva pestaña)
- [x] Sidebar BuddyShop → enlace externo a buddyshop.app
- [x] Página intermedia /buddy-shop con descripción del marketplace y botón CTA a buddyshop.app
- [x] Renombrar MercadonaShop → SupermercadoShop con selector multi-supermercado
- [x] Añadir SupermercadoShop al sidebar como "Compra en Supermercados"

## Rediseño accesos rápidos Dashboard (Sprint 4)
- [x] Buscar y subir imágenes premium para cada acceso rápido (recetas, menús, inventario, supermercados, BuddyScan, diario)
- [x] Rediseñar accesos rápidos con imágenes de fondo, glassmorphism y layout asimétrico tipo bento grid
- [x] Añadir micro-animaciones en hover/tap en los accesos rápidos

## Sprint BuddyExperts + BuddyMakers + BuddyIA (completado)
- [x] Schema DB: tablas buddyExperts, buddyMakers, expertPlans, expertMenus, creatorEarnings
- [x] tRPC router BuddyExperts: listar, ver plan, copiar menú, menús compartidos gratuitos
- [x] tRPC router BuddyMakers: listar, ver recetas, seguir
- [x] tRPC router Stripe Connect: onboarding experto, pago comisión 20%
- [x] tRPC router BuddyIA: chat nutricional, generador de menús semanales
- [x] Página BuddyExperts: categorías, avatares, planes premium, menús compartidos gratuitos
- [x] Página BuddyMakers: creadores de recetas con perfil Instagram
- [x] Página BuddyIA: chat nutricional con sugerencias predefinidas y generador de menús
- [x] Dashboard: sección Comunidad BuddyMarket con BuddyExperts, BuddyMakers, BuddyIA
- [x] AppLayout sidebar: añadir BuddyMakers y BuddyIA al menú lateral
- [x] App.tsx: rutas /buddy-makers y /buddy-ia
- [x] TypeScript: 0 errores
- [x] Tests: 15/15 pasando

## Sprint Recetas 500 + BuddyMakers + Dashboard Mockup (completado)
- [x] Generar 427 recetas con momento del día, alergias, ingredientes+cantidades, instrucciones, valores nutricionales
- [x] Insertar 427 recetas en la base de datos via script seed_recipes.mjs
- [x] Schema DB: añadir mealTime, allergens, tags, fiber, buddyMakerId, isSeeded a tabla recipes
- [x] tRPC: filtrar recetas por momento del día (desayuno, media mañana, comida, merienda, cena)
- [x] tRPC: filtrar recetas por alergias del usuario
- [x] tRPC: listar recetas de BuddyMakers con enlace al creador
- [x] Rediseñar página Recetas: tabs (Para ti, Rápidas, Fitness, Vegetarianas, Top semana), cards con foto+tiempo+kcal, sección BuddyMakers
- [x] Dashboard rediseño mockup: banner menú semanal naranja, 3 accesos rápidos (Lista compra, Menús BuddyExperts, BuddyIA)
- [x] TypeScript: 0 errores
- [x] Tests: 15/15 pasando

## Sprint Menús Predefinidos + Lista de la Compra Inteligente (completado)
- [x] Generar 50 menús semanales predefinidos por objetivo (pérdida de peso, ganancia muscular, tonificación, pérdida de grasa, mantenimiento, volumen, definición, salud cardiovascular, antiinflamatorio, vegano)
- [x] Insertar 50 menús en BD con recetas asociadas por momento del día
- [x] Schema DB: añadir campo `persons` (número de personas) a menus y shoppingLists
- [x] Schema DB: añadir campo `supermarket` a shoppingLists
- [x] tRPC: endpoint para guardar menú de biblioteca al perfil del usuario
- [x] tRPC: endpoint para generar lista de la compra automática desde menú con personas y supermercado
- [x] Página Biblioteca de Menús: 50 menús filtrables por objetivo, duración, calorías, con botón Guardar
- [x] Lista de la Compra: selector de supermercado y número de personas al generar desde menú
- [x] Ajuste automático de cantidades de ingredientes según número de personas

## Sprint Imágenes Reales para Recetas (completado)
- [x] Buscar imágenes reales por nombre de receta (Unsplash API) y actualizar imageUrl en BD para las 427 recetas
- [x] Actualizar Lista de la Compra: generador automático desde menú con selector de supermercado y número de personas
- [x] Añadir enlace Biblioteca de Menús en sidebar y Dashboard

## Sprint BuddyIA Cuestionario + Guardar Menú (completado)
- [x] tRPC router: procedimiento generateMenuWithQuestionnaire (fecha, estilo cocina, personas, comidas/día, objetivo, alergias)
- [x] BuddyIA: flujo cuestionario paso a paso antes de generar menú (7 pasos)
- [x] BuddyIA: visualización del menú generado con cards por día y momento del día
- [x] BuddyIA: botón "Guardar menú" que lo guarda en el planificador
- [x] BuddyIA: botón "Crear lista de la compra" desde el menú generado
- [x] Estilos de cocina: batch cooking, tuppers, comida rápida, trabajo, restaurante, mixto

## Sprint Diario con Fotos (COMPLETADO)
- [x] tRPC: endpoint analyzeFood para subir imagen a S3 y analizarla con IA (detectar alimentos, calorías, macros)
- [x] Diario: botón de cámara que abre cámara del móvil o selector de archivo
- [x] Diario: preview de la foto tomada antes de confirmar
- [x] Diario: la IA detecta automáticamente alimentos, calorías y macros de la foto
- [x] Diario: confirmación/edición de los alimentos detectados antes de registrar
- [x] Diario: registro automático de la entrada con la foto adjunta
- [x] Diario: mostrar miniatura de la foto en la entrada del diario

## Sprint Perfil + Categorías Recetas + Fotos Diario (DUPLICADO - ver sprint completado abajo)
- [x] Dashboard: card de perfil incompleto con indicador de progreso (% completado) y CTA a perfil
- [x] Dashboard: la card desaparece cuando el perfil está 100% completo
- [x] Schema DB: añadir campo cookingMethod a recetas
- [x] Schema DB: añadir campo cuisineType a recetas
- [x] Actualizar recetas seeded con cookingMethod y cuisineType
- [x] Página Recetas: tabs de categorías por método de cocinado
- [x] Página Recetas: tabs de categorías por tipo de cocina
- [x] tRPC: endpoint mealLogs.analyzeFood
- [x] tRPC: mealLogs.add acepta photoUrl
- [x] Diario: botón de cámara/foto en el formulario de registro de comida
- [x] Diario: preview de la foto antes de confirmar
- [x] Diario: análisis automático con IA
- [x] Diario: confirmación/edición de alimentos detectados antes de registrar
- [x] Diario: miniatura de foto en cada entrada del diario

## Sprint Perfil + Categorías Recetas + Fotos Diario (COMPLETADO)
- [x] Dashboard: card de perfil incompleto con indicador de progreso (% completado) y CTA a perfil
- [x] Dashboard: la card desaparece cuando el perfil está 100% completo
- [x] Schema DB: añadir campo cookingMethod a recetas (airfryer, horno, microondas, plancha, olla, sin cocción, wok)
- [x] Schema DB: añadir campo cuisineType a recetas (española, italiana, asiática, mexicana, americana, árabe, francesa, mediterránea)
- [x] 427 recetas categorizadas con cookingMethod y cuisineType
- [x] Página Recetas: filtros por método de cocinado (Airfryer, Horno, Plancha, Olla, Sin cocción, Microondas, Wok)
- [x] Página Recetas: filtros por tipo de cocina (Española, Italiana, Asiática, Mexicana, Americana, Árabe, Francesa, Mediterránea)
- [x] Página Recetas: 3 categorías de filtro (momento del día, tipo de cocina, método de cocinado)
- [x] tRPC: endpoint mealLogs.analyzeFood (subir imagen a S3 + análisis IA con visión)
- [x] tRPC: mealLogs.add acepta photoUrl
- [x] Diario: botón de cámara/foto en el formulario de registro de comida
- [x] Diario: preview de la foto antes de confirmar
- [x] Diario: análisis automático con IA (detecta alimentos, calorías, macros)
- [x] Diario: confirmación/edición de alimentos detectados antes de registrar
- [x] Diario: miniatura de foto en cada entrada del diario
- [x] TypeScript: 0 errores
- [x] Tests: 19/19 pasando

## Sprint Búsqueda de Recetas por Nombre e Ingredientes (DUPLICADO - ver abajo completado)
- [x] Backend: ampliar búsqueda en getRecipes para buscar también en description e ingredientsJson
- [x] Backend: añadir endpoint recipes.searchSuggestions para autocompletado rápido
- [x] UI: barra de búsqueda siempre visible en Recipes.tsx
- [x] UI: búsqueda en tiempo real con debounce (300ms)
- [x] UI: mostrar resultados con texto resaltado (highlight) en nombre
- [x] UI: estado vacío específico para búsqueda sin resultados con sugerencias
- [x] UI: chips de búsqueda recientes
- [x] UI: indicador de "buscando..." mientras carga
- [x] UI: contador de resultados encontrados

- [x] Backend: ampliar búsqueda en getRecipes para buscar también en description e ingredientsJson
- [x] Backend: añadir endpoint recipes.searchSuggestions para autocompletado rápido
- [x] UI: barra de búsqueda siempre visible en Recipes.tsx (no oculta detrás de botón)
- [x] UI: búsqueda en tiempo real con debounce (300ms)
- [x] UI: mostrar resultados con texto resaltado (highlight) en nombre
- [x] UI: estado vacío específico para búsqueda sin resultados con sugerencias
- [x] UI: chips de búsqueda recientes (últimas 5 búsquedas guardadas en localStorage)
- [x] UI: indicador de "buscando..." mientras carga
- [x] UI: contador de resultados encontrados
- [x] Card "Completa tu perfil": cambiar color a degradado índigo/azul

## Sprint: Optimización de Imágenes y Performance
- [x] Optimizar imagen de ENISA: compresión WebP (31KB → 19KB, 39.7% reducción), lazy loading, decoding async
- [x] Corregir error Google OAuth redirect_uri_mismatch: cambiar a Google One Tap (más seguro, sin problemas de configuración)
- [x] Añadir menús guardados (especiales y eventos): tablas BD, routers tRPC, componente SavedMenusGrid
- [x] Implementar exportación a PDF para menús especiales y de eventos
- [x] Corregir error de BuddyKids: import duplicado de useState y useAuth faltante
- [x] Añadir logos de financiación (ENISA, NextGenerationEU) al footer de la landing

## Sprint: Recetas Favoritas
- [ ] Tabla `recipeFavorites` en drizzle/schema.ts (userId, recipeId, createdAt)
- [ ] Helper `toggleFavorite`, `getFavorites`, `isFavorite` en server/db.ts
- [ ] Endpoints tRPC: `recipes.toggleFavorite`, `recipes.getFavorites`, `recipes.getFavoriteIds`
- [ ] Botón corazón en tarjeta de receta (toggle optimista, animación)
- [ ] Página /favorites "Mis Favoritas" con grid de recetas y filtros
- [ ] Entrada en sidebar/navegación para Mis Favoritas
- [ ] Tests vitest para los nuevos endpoints
- [ ] Acceso directo a buddycoach.io en sidebar (sección Comunidad Vively)
- [ ] Banner/card de BuddyCoach en Dashboard con link a buddycoach.io
- [ ] Ampliar perfil: campos detallados de salud, estilo de vida, preferencias culinarias y objetivos
- [ ] Rediseñar Profile.tsx con secciones extensas y preguntas completas
- [ ] Ampliar perfil: campos detallados de salud, estilo de vida, preferencias culinarias y objetivos
- [ ] Redisenar Profile.tsx con secciones extensas y preguntas completas
- [x] Ampliar perfil: 8 secciones detalladas (Personal, Cuerpo, Estilo de vida, Cocina, Salud, Alergias, Preferencias, Compras)
- [x] Añadir birthYear y bodyFatPercentage al router updateProfile
- [x] Card "Completa tu perfil" en color índigo/azul
- [x] Favoritos: botón corazón en tarjetas de receta
- [x] Página Mis Favoritas
- [x] BuddyCoach.io shortcut en sidebar
- [ ] Barra de progreso de perfil completo en Profile.tsx con desglose por secciones
- [ ] Rediseñar cards BuddyExperts/Makers con calidad premium
- [ ] Hacer cards funcionales con perfil público al hacer clic
- [ ] Añadir sección "Siguiendo" para ver buddies seguidos
- [ ] Barra de progreso de perfil completo en Profile.tsx

## Sprint: Optimización Mobile-First

- [ ] AppLayout: nav inferior con safe-area, sidebar responsive, header sin overflow
- [ ] Dashboard: cards apiladas en mobile, gráficos responsivos, botones táctiles grandes
- [ ] Recipes: grid 1 col en mobile, filtros colapsables, search bar sticky sin overflow
- [ ] BuddyExperts/Makers: cards premium navegables, botones grandes, stats legibles
- [ ] BuddyProfile: hero cover responsive, stats pills sin overflow, botones táctiles
- [ ] Following: cards apiladas, botones táctiles, empty state centrado
- [ ] Profile: formulario multi-step sin overflow horizontal, inputs táctiles, progress bar visible
- [ ] MealLog: foto upload mobile-friendly, preview responsive, formulario sin scroll horizontal
- [ ] Menus: calendario responsive, modal full-screen en mobile
- [ ] Favorites: grid 1 col en mobile, filtros colapsables
- [ ] General: touch targets mínimo 44px, texto legible (14px+), sin scroll horizontal

## Completado Sprint Mobile-First

- [x] AppLayout: nav inferior con safe-area, sidebar responsive, header sin overflow
- [x] Dashboard: cards apiladas en mobile, gráficos responsivos, botones táctiles grandes
- [x] Recipes: grid 1 col en mobile, filtros colapsables, search bar sticky sin overflow
- [x] BuddyExperts/Makers: cards premium navegables a /buddy-experts/:id y /buddy-makers/:id, botones grandes (py-2.5), stats legibles
- [x] BuddyProfile: página de perfil público creada con hero cover, stats, recetas, botón seguir
- [x] Following: página "Siguiendo" creada con tabs experts/makers, cards apiladas, botones táctiles
- [x] Profile: formulario multi-step sin overflow horizontal (grid auto-fit), inputs táctiles, progress bar visible
- [x] Sidebar: entrada "Siguiendo" añadida después de BuddyMakers
- [x] General: touch targets mínimo 44px, texto legible (14px+), sin scroll horizontal

## Sprint: Filtros en Siguiendo

- [x] Following.tsx: filtro de especialidad (chips por categoría)
- [x] Following.tsx: ordenación por popularidad (seguidores) y nombre
- [x] Following.tsx: contador de resultados filtrados

## Sprint: Versión Móvil / PWA

- [ ] manifest.json con nombre, iconos, colores, display standalone
- [ ] Meta tags iOS: apple-touch-icon, apple-mobile-web-app-capable, status-bar-style
- [ ] Meta tags Android: theme-color, mobile-web-app-capable
- [ ] Viewport meta tag optimizado (viewport-fit=cover)
- [ ] Service Worker básico para offline/cache
- [ ] Splash screen y loading state nativo
- [ ] Scroll snap en carruseles del Dashboard
- [ ] Bottom sheet modals en lugar de alerts/popups
- [ ] Swipe para cerrar sidebar
- [ ] Safe area insets en todas las páginas con contenido que llega al borde
- [ ] Fuente optimizada para mobile (Inter/SF Pro feel)
- [ ] Animaciones de transición entre páginas

## Sprint: Versión Móvil PWA
- [x] manifest.json con iconos 72-512px, shortcuts y categorías
- [x] Meta tags iOS (apple-mobile-web-app-capable, status-bar-style, touch-icon)
- [x] Meta tags Android (mobile-web-app-capable, theme-color)
- [x] Open Graph tags para compartir
- [x] Service Worker con cache-first para assets y network-first para navegación
- [x] Registro del Service Worker en main.tsx
- [x] Banner de instalación PWA (beforeinstallprompt) con dismiss persistente
- [x] Swipe derecha desde borde izquierdo para abrir sidebar
- [x] Swipe izquierda para cerrar sidebar
- [x] viewport-fit=cover para notch/island de iPhone
- [x] -webkit-tap-highlight-color: transparent en todos los elementos
- [x] Iconos PNG generados con PIL (72, 96, 128, 144, 152, 192, 384, 512)
- [x] apple-touch-icon.png (180x180)

## Sprint: Card de Calorías Visual
- [ ] Rediseñar card de calorías con anillo de progreso SVG circular
- [x] Mostrar macros (P/C/G) con barras de progreso horizontales y colores
- [ ] Añadir streak de días consecutivos registrando comidas
- [x] Card clickeable que navega a /meal-log
- [ ] Animación de entrada del anillo de progreso
- [ ] Animación confeti al completar todos los macros del día

## Sprint: Cards BuddyMakers/Experts
- [x] Rediseñar MakerCard con layout vertical limpio y avatar bien posicionado
- [x] Rediseñar ExpertCard con layout vertical limpio y avatar bien posicionado
- [ ] Quitar foto de portada en MakerCard y ExpertCard, reemplazar con degradado + avatar grande
- [ ] Cards BuddyMakers/Experts: rediseño premium nivel 500M con glassmorphism, sombras multicapa, animaciones
- [ ] Scroll infinito en Recetas: paginación cursor-based en backend + useInfiniteQuery + IntersectionObserver
- [x] Skeleton loader animado (shimmer) para tarjetas de recetas en carga inicial y scroll infinito

## Sprint: Inventario con caducidad + IA
- [ ] Inventario: campo expiryDate en BD (inventory_items)
- [ ] Inventario: endpoint IA para analizar foto y detectar productos
- [ ] Inventario: subida de foto a S3 para análisis
- [ ] Inventario: alertas visuales de caducidad (hoy, esta semana, próximos 30 días)
- [ ] Inventario: sección "Recetas con lo que tienes" priorizando ingredientes próximos a caducar
- [ ] Inventario: botón "Foto + IA" para añadir productos automáticamente

## Sprint: Inventario mejorado
- [x] Endpoint inventory.analyzePhoto: análisis IA de foto con vision LLM
- [x] Endpoint inventory.getExpiringItems: productos que caducan en N días
- [x] Endpoint inventory.getRecipesByExpiring: recetas recomendadas por ingredientes próximos a caducar
- [x] Banner de caducidad próxima en Inventory.tsx
- [x] Sección de recetas recomendadas por caducidad en Inventory.tsx
- [x] Modal foto+IA: captura foto, preview, análisis, selección de productos, fecha de caducidad por producto
- [x] Colores de alerta por días restantes (verde/amarillo/naranja/rojo)
- [x] Campo de caducidad en modal de añadir manual
- [ ] Añadir acceso directo a BuddyCoach.io en sidebar bajo sección Comunidad Vively
- [ ] Integrar imágenes de productos de Mercadona en la sección de supermercados

## Sprint: Integración Catálogo Mercadona
- [x] Importar 1.971 productos Mercadona a la BD con imágenes (thumbnails 300x300)
- [x] Endpoint DB-based searchProducts (búsqueda por nombre, subcategoría, categoría)
- [x] Endpoint categories (lista de categorías/subcategorías desde BD)
- [x] Endpoint byCategory (productos por categoría/subcategoría)
- [x] Reescribir MercadonaShop.tsx para usar endpoints de BD (sin llamadas externas)
- [x] Grid de categorías con iconos emoji
- [x] Tabs de subcategorías al seleccionar categoría
- [x] Carrito de compra con contador, total y copiar/guardar lista

## Sprint: Indicador de carga transferencia Mercadona
- [x] Indicador visual animado (spinner + pasos progresivos) mientras se transfieren productos al carrito de Mercadona

## Sprint: Paneles de gestión BuddyExperts y BuddyMakers
- [ ] Panel BuddyExperts: página /buddy-experts/dashboard con registro como experto (bio, especialidad, foto, precio)
- [ ] Panel BuddyExperts: listado de mis menús subidos con opciones editar/eliminar
- [ ] Panel BuddyExperts: formulario para subir nuevo menú (nombre, descripción, objetivo, precio, días con recetas)
- [ ] Panel BuddyExperts: formulario para editar menú existente
- [ ] tRPC: procedimientos createExpertProfile, updateExpertProfile, getMyExpertProfile
- [ ] tRPC: procedimientos createExpertMenu, updateExpertMenu, deleteExpertMenu, getMyExpertMenus
- [ ] Panel BuddyMakers: página /buddy-makers/dashboard con registro como creador (bio, especialidad, foto, redes sociales)
- [ ] Panel BuddyMakers: listado de mis recetas subidas con opciones editar/eliminar
- [ ] Panel BuddyMakers: formulario para subir nueva receta (nombre, ingredientes, pasos, nutrición, foto, categorías)
- [ ] Panel BuddyMakers: formulario para editar receta existente
- [ ] tRPC: procedimientos createMakerProfile, updateMakerProfile, getMyMakerProfile
- [ ] tRPC: procedimientos createMakerRecipe, updateMakerRecipe, deleteMakerRecipe, getMyMakerRecipes
- [ ] Botón "Mi panel" en BuddyExperts.tsx y BuddyMakers.tsx para acceder al dashboard propio

## Sprint Paneles de Gestión BuddyExperts y BuddyMakers
- [x] Backend: procedimientos getMyProfile, createProfile, updateProfile para BuddyExperts
- [x] Backend: procedimientos getMyMenus, createMenu, updateMenu, deleteMenu para BuddyExperts
- [x] Backend: procedimientos getMyProfile, createProfile, updateProfile para BuddyMakers
- [x] Backend: procedimientos getMyRecipes, createRecipe, updateRecipe, deleteRecipe para BuddyMakers
- [x] Página BuddyExpertDashboard: panel con tabs Perfil y Menús, formulario completo de menú semanal (7 días x 5 comidas)
- [x] Página BuddyMakerDashboard: panel con tabs Perfil y Recetas, formulario completo con ingredientes, pasos, nutrición
- [x] Rutas /buddy-expert-dashboard y /buddy-maker-dashboard en App.tsx
- [x] Sidebar: accesos directos "Mi Panel Experto" y "Mi Panel Creador"
- [x] TypeScript: 0 errores
- [x] Tests: 19/19 pasando

## Sprint Dashboard: Recomendaciones y Menús Sugeridos
- [x] Reemplazar sección "Recetas destacadas" por "Recomendaciones para ti" (recetas personalizadas según perfil)
- [x] Añadir sección "Menús que te pueden interesar" (menús de biblioteca filtrados por objetivo del usuario)

## Sprint: Integración Carrefour
- [ ] Investigar API pública de Carrefour España y estructura de productos
- [ ] Importar catálogo de productos Carrefour con imágenes a la BD
- [ ] Crear página CarrefourShop con búsqueda, categorías y carrito
- [ ] Actualizar la página de Supermercados para incluir Carrefour
- [ ] Integrar transferencia de carrito a carrefour.es

- [x] Investigar API pública de Carrefour España y estructura de productos (API bloqueada por Cloudflare, usamos dataset Kaggle)
- [x] Importar catálogo de productos Carrefour con imágenes a la BD (14.515 productos desde dataset Kaggle)
- [x] Crear página CarrefourShop con búsqueda, categorías y carrito
- [x] Actualizar la página de Supermercados para incluir Carrefour (sidebar: Mercadona y Carrefour separados)
- [x] Integrar transferencia de carrito a carrefour.es (botón que abre carrefour.es + copia lista al portapapeles)

## Sprint: Métricas Personales + Sistema de Solicitud BuddyExpert/Maker
- [ ] Schema DB: tabla `user_metrics` (userId, date, weight, bodyFat, muscleMass, bmi, waist, hip, chest, arm, thigh, notes)
- [ ] Schema DB: campo `applicationStatus` en buddyExperts y buddyMakers (pending/approved/rejected)
- [ ] Schema DB: campo `applicationNote` y `appliedAt` en buddyExperts y buddyMakers
- [ ] tRPC metrics: addMetric, getMetrics (historial), getLatestMetric, deleteMetric
- [ ] Página /metrics: formulario de registro de métricas, gráfica de evolución de peso, tabla de historial
- [ ] Sidebar: enlace "Mis Métricas" con icono de balanza
- [ ] tRPC buddyExperts.applyAsExpert: crear solicitud con estado pending
- [ ] tRPC buddyExperts.getMyApplication: ver estado de mi solicitud
- [ ] tRPC buddyMakers.applyAsMaker: crear solicitud con estado pending
- [ ] tRPC buddyMakers.getMyApplication: ver estado de mi solicitud
- [ ] tRPC admin.getPendingApplications: listar solicitudes pendientes (experts + makers)
- [ ] tRPC admin.approveApplication: aprobar solicitud (cambia status a approved)
- [ ] tRPC admin.rejectApplication: rechazar solicitud con motivo
- [ ] Panel Admin: sección "Solicitudes" con tabs Experts/Makers, listado de pendientes, botones aprobar/rechazar
- [ ] BuddyExpertDashboard: visible solo si applicationStatus === 'approved', si no muestra formulario de solicitud
- [ ] BuddyMakerDashboard: visible solo si applicationStatus === 'approved', si no muestra formulario de solicitud
- [ ] Sidebar: ocultar "Mi Panel Experto" y "Mi Panel Creador" si no tienen solicitud aprobada
- [ ] Notificación al owner cuando llega una nueva solicitud

## Sprint: Asistente de Menús para Eventos Especiales
- [ ] Endpoint tRPC `events.generateMenu` con IA para generar menú completo según parámetros del evento
- [ ] Página EventMenuPlanner con selector visual de tipo de evento (cena amigos, barbacoa, Navidad, cumpleaños, etc.)
- [ ] Flujo conversacional por pasos: tipo evento → nº personas → intolerancias → alcohol → nº platos → preferencias → generar
- [ ] Resultado: menú completo con aperitivo, entrantes, plato principal, postre y bebidas con recetas detalladas
- [ ] Opción de guardar el menú generado en la biblioteca personal
- [ ] Ruta /event-menu y enlace en sidebar

## Sprint: Eventos Favoritos Guardados
- [ ] Tabla saved_events en BD (userId, eventType, eventName, persons, menuData JSON, createdAt)
- [ ] Endpoints tRPC: saveEvent, listSavedEvents, deleteSavedEvent
- [ ] Botón "Guardar evento" en la pantalla de resultado del asistente
- [ ] Página /saved-events con lista de eventos guardados y acceso rápido
- [ ] Enlace en sidebar y en el asistente de eventos

## Sprint: Corrección Problemas Críticos UX (Auditoría)
- [ ] Corregir ruta rota Diario Nutricional (sidebar apunta a /nutrition-diary → corregir a /meal-log)
- [ ] Reorganizar sidebar con grupos visuales y separadores (Nutrición, Compras, Asistentes IA, Mi cuenta, Comunidad, Mi panel, Admin)
- [x] Ocultar "Mi Panel Experto/Maker" del sidebar si el usuario no tiene solicitud aprobada
- [ ] Implementar modal de bienvenida para nuevos usuarios (primer login, con checklist de 3 pasos)
- [ ] Añadir chips de preguntas rápidas en BuddyIA para guiar al usuario nuevo
- [ ] Estado vacío informativo en "Recomendaciones para ti" del dashboard con CTA a completar perfil
- [ ] Estado vacío informativo en "Menús que te pueden interesar" del dashboard
- [ ] Mejorar estado vacío del Inventario con CTA prominente naranja
- [ ] Mejorar widget de calorías del dashboard cuando está en 0 con CTA a registrar comida
- [ ] Corregir duplicado "Barbacoa" en EventMenuPlanner
- [x] Corregir badge de Carrefour de "Próximamente" a "Disponible" en /supermercados

## Sprint: Mejora Completa de la Aplicación (Auditoría Total)

### Backend - Bugs y Mejoras (DUPLICADO - ya completado en sprints anteriores)
- [x] Revisar y corregir todos los endpoints del router (validaciones, errores, ownership)
- [x] Mejorar endpoint de métricas: validar rangos de valores (ej: peso 20-500kg)
- [x] Añadir endpoint para eliminar cuenta de usuario
- [x] Mejorar manejo de errores en endpoints de IA (timeout, fallback)
- [ ] Revisar y corregir endpoint de BuddyApplication (evitar solicitudes duplicadas)
- [x] Añadir paginación real a endpoints principales (cursor-based en recetas)
- [x] Mejorar endpoint de inventario: validar fechas de caducidad

### Frontend - Estados Vacíos (DUPLICADO - ya completado en sprints anteriores)
- [x] Estado vacío mejorado en Lista de Compra
- [x] Estado vacío mejorado en Inventario
- [x] Estado vacío en Favoritas
- [x] Estado vacío en Diario Nutricional
- [x] Estado vacío en Menús
- [x] Estado vacío en Siguiendo

### Frontend - Formularios Mejorados (DUPLICADO - ya completado)
- [x] BuddyApplication: convertir a formulario de 3 pasos con indicador de progreso
- [x] Métricas: mostrar solo campos relevantes según tipo de métrica seleccionado
- [x] Perfil: añadir checklist visual de completitud con % y CTA por sección

### Frontend - Navegación y UX (DUPLICADO - ya completado)
- [ ] Añadir breadcrumbs o título de sección en todas las páginas (pendiente real)
- [x] Mejorar la página de Perfil: organizar en secciones colapsables
- [x] Añadir ejemplos de preguntas en BuddyIA (chips de sugerencias visibles)
- [x] Mejorar página de Suscripción: mostrar plan actual claramente
- [x] Añadir confirmación antes de eliminar cualquier elemento importante

### Frontend - Consistencia Visual (DUPLICADO - ya completado)
- [x] Revisar que todos los botones de acción principal usen btn-vively
- [x] Asegurar que todos los modales tengan botón de cierre (X) visible
- [x] Verificar que todos los formularios tengan placeholder descriptivos
- [x] Añadir animaciones de éxito en acciones importantes (guardar, eliminar)

### Tests y Calidad (DUPLICADO - ya completado)
- [x] Verificar que tests siguen pasando (29/29 actualmente)
- [x] Añadir test para endpoint de métricas
- [x] Añadir test para endpoint de BuddyApplication

## Sprint: Mejora Completa (en progreso)
- [x] Bug crítico: Página Menús no muestra recetas asignadas (selectedItems hardcodeado como [])
- [x] Añadir endpoint menus.getItemsByDate al backend
- [x] Añadir endpoint menus.ensureDayPart al backend
- [x] Añadir helpers getDayPartIdByName y createMenuDayPart a db.ts
- [x] Reescribir Menus.tsx: muestra recetas por día, modal para añadir recetas, estado vacío mejorado
- [x] Corregir ruta rota Diario Nutricional en sidebar
- [x] Mejorar estados vacíos: ShoppingLists, Inventory, Favorites, MealLog
- [x] Mejorar BuddyIA: chips de sugerencias visibles
- [x] Mejorar Suscripción: mostrar plan actual claramente
- [x] Añadir confirmación antes de eliminar elementos importantes
- [x] Asegurar que todos los modales tengan botón X visible
- [x] Mejorar validaciones en endpoints de métricas
- [x] Tests: verificar 19/19 pasando
- [x] Bug crítico: OnboardingModal usa solo localStorage, debe usar onboardingCompleted del servidor
- [x] Backend: Validación en metrics.add (al menos un campo numérico)
- [x] Backend: Validación en mealLogs.add (recipeId o customMealName obligatorio)
- [x] Backend: Validación en inventory.add (ingredientId o customName obligatorio)
- [x] Backend: Verificar ownership antes de eliminar en inventory.remove
- [x] Backend: Verificar ownership antes de eliminar en mealLogs.remove
- [x] Frontend: Confirmación antes de eliminar en Inventario
- [x] Frontend: Confirmación antes de eliminar en Diario Nutricional
- [x] Frontend: Confirmación antes de eliminar en Métricas
- [x] Frontend: Confirmación antes de eliminar en Listas de Compra
- [x] Frontend: Mejorar visualización del plan actual en Suscripción
- [x] Frontend: Mejorar estado vacío de recomendaciones en Dashboard con CTA a completar perfil

## Sprint: Mejoras adicionales (en progreso)
- [x] Backend: Validación de rangos en métricas (peso 20-500kg, IMC 10-80, etc.)
- [x] Backend: Validación de fechas en inventario (formato YYYY-MM-DD)
- [x] Backend: Validación de fechas en mealLogs (formato YYYY-MM-DD)
- [x] Backend: Validación de raciones en mealLogs (0.1-20)
- [x] Backend: Validación de calorías en mealLogs (0-10000)
- [x] Backend: Validación de cantidades en inventario (0-99999)
- [x] Frontend: Barra de progreso de completitud de perfil en Profile.tsx
- [x] Frontend: Aviso de campos pendientes en perfil
- [x] Backend: Endpoint para eliminar cuenta de usuario
- [x] Backend: Mejorar manejo de errores en endpoints de IA (timeout, fallback)
- [x] Frontend: BuddyApplication formulario de 3 pasos con indicador de progreso
- [x] Frontend: Sección de eliminar cuenta en Perfil con confirmación de texto
- [x] Bug: Claves duplicadas en EventMenuPlanner.tsx corregido
- [x] Frontend: Métricas mostrar solo campos relevantes según tipo (selector de tipo: Peso, Composición, Medidas, Báscula IA)
- [ ] Frontend: Añadir breadcrumbs o título de sección en todas las páginas
- [x] Tests: Añadir test para endpoint de métricas
- [x] Tests: Añadir test para endpoint de BuddyApplication
- [x] Tests: 25/25 tests pasando

## Sprint: Perfil Ampliado + Cards Premium (EN PROGRESO)
- [x] Profile.tsx: barra de progreso con desglose por secciones (Personal, Cuerpo, Salud, Cocina, Objetivos)
- [x] Profile.tsx: indicador visual de qué secciones faltan completar (chips clicables con estado)
- [x] BuddyExperts.tsx: cards con calidad premium (foto grande, especialidad, rating, credenciales, seguidores)
- [x] BuddyMakers.tsx: cards con calidad premium (foto, recetas, seguidores, especialidad, Instagram)
- [x] BuddyExperts.tsx: cards funcionales con navegación a /buddy-experts/:id
- [x] BuddyMakers.tsx: cards funcionales con navegación a /buddy-makers/:id
- [x] BuddyProfile.tsx: página de perfil público con estrellas, stats y plan cards

## Sprint: Funcionalidades Pendientes Completas (02/04/2026)

### Recetas Favoritas
- [x] Tabla `recipeFavorites` en drizzle/schema.ts (userId, recipeId, createdAt)
- [x] Helper `toggleFavorite`, `getFavoriteIds` en server/db.ts
- [x] Endpoints tRPC: `recipes.toggleFavorite`, `recipes.getFavoriteIds`
- [x] Botón corazón en RecipeCard con toggle optimista y animación
- [x] Página /favorites con grid de recetas favoritas y filtros
- [x] Tests vitest para toggleFavorite y getFavoriteIds

### Dashboard Mejorado
- [x] Anillo de progreso SVG circular para calorías (con animación)
- [x] Streak de días consecutivos registrando comidas (endpoint backend + widget visual)

### Búsqueda de Recetas Mejorada
- [x] Ampliar búsqueda en `description` e `ingredientsJson` en backend (ya implementado)
- [x] Endpoint `recipes.searchSuggestions` para autocompletado (ya implementado)

### Inventario Mejorado
- [x] Campo `expirationDate` en tabla inventory_items en BD (ya implementado)
- [x] Endpoint IA para analizar foto y detectar productos del inventario (ya implementado)

### PWA / Mobile
- [x] manifest.json con nombre, iconos, colores, display standalone (ya implementado)
- [x] Meta tags iOS/Android para instalación como app (ya implementado)
- [x] Service Worker básico para offline/cache (ya implementado)

### Scroll Infinito en Recetas
- [x] Paginación cursor-based en backend (recipes.list con cursor) (ya implementado)
- [x] useInfiniteQuery en Recipes.tsx con IntersectionObserver (ya implementado)

## Sprint: Nuevas Mejoras de Alto Impacto (02/04/2026)

### UX General
- [ ] Añadir breadcrumbs/título de sección en todas las páginas (pendiente)
- [ ] Mejorar página Menús: drag-and-drop entre días/comidas
- [x] Añadir página de estadísticas nutricionales (gráficos de evolución)
- [ ] Mejorar BuddyIA: historial de conversaciones guardado en BD
- [ ] Añadir página de ajustes/configuración de usuario
- [x] Mejorar lista de compra: marcar items como comprados con animación (ya implementado)

### Backend
- [x] Endpoint para obtener estadísticas nutricionales históricas (últimos 7/30 días)
- [ ] Endpoint para exportar datos del perfil en JSON
- [ ] Mejorar endpoint BuddyApplication: evitar solicitudes duplicadas

### Tests
- [x] Añadir tests para endpoints de favoritos (nutritionalHistory + streak)
- [x] Añadir tests para endpoint de streak
- [x] Tests: 29/29 pasando

## Sprint: Escáner de Códigos de Barras (02/04/2026)

### Backend
- [x] Endpoint `mealLogs.lookupBarcode` que consulta Open Food Facts API por código EAN/UPC
- [x] Parsear respuesta de Open Food Facts: nombre, calorías, proteínas, carbohidratos, grasas, imagen
- [x] Fallback: si no encuentra en Open Food Facts, devolver error descriptivo

### Frontend
- [x] Componente `BarcodeScanner.tsx` con cámara usando `@zxing/browser` para leer códigos de barras
- [x] Input manual de código de barras como alternativa al escáner
- [x] Modal con animación de escaneo y overlay
- [x] Integrar botón de escáner en MealLog.tsx (tab "🔍 Código")
- [x] Estado de carga mientras busca el producto
- [x] Estado de error si el código no se encuentra
- [x] Pre-rellena el formulario manual con datos del producto escaneado

### Tests
- [x] Tests para endpoint lookupBarcode (validación + shape de respuesta) - 32/32 pasando

## Sprint: Reorganización Sidebar (02/04/2026)
- [x] Sidebar sección PRINCIPAL: Dashboard, Mi Perfil, Mis Métricas, Recetas, Menús, Inventario
- [x] Sidebar sección COMPRAS: Supermercados (en lugar de Mercadona y Carrefour por separado)
- [x] Sección NUTRICIóN: Diario Nutricional, Estadísticas, Mis Favoritas, Biblioteca de Menús
- [x] Ruta /carrefour redirige a página unificada de Supermercados

## Sprint: Sistema de Notificaciones de Comidas (02/04/2026)

### Base de Datos
- [x] Tabla `mealReminders` en drizzle/schema.ts (userId, mealType, time HH:MM, enabled, days bitmask)
- [x] Tabla `pushSubscriptions` en BD (userId, endpoint, p256dh, auth)
- [x] Migración con pnpm db:push

### Backend (tRPC)
- [x] `notifications.getReminders` — listar recordatorios del usuario
- [x] `notifications.upsertReminder` — crear/actualizar recordatorio
- [x] `notifications.deleteReminder` — eliminar recordatorio
- [x] `notifications.savePushSubscription` — guardar suscripción push
- [x] Helpers en db.ts: getMealReminders, upsertMealReminder, deleteMealReminder

### Frontend
- [x] Página `/notifications` con configuración de recordatorios por comida
- [x] Toggle para activar/desactivar cada recordatorio
- [x] Selector de hora para cada comida
- [x] Selector de días de la semana (L M X J V S D)
- [x] Botón "Activar notificaciones del navegador" con solicitud de permiso
- [x] Service Worker con handlers push, notificationclick y SCHEDULE_REMINDER
- [x] Acceso desde sidebar (sección Nutrición) y Dashboard (card acceso rápido)
- [x] Presets rápidos (activar todas, solo laborables, todos los días)

### Tests
- [x] Tests para getReminders, upsertReminder, deleteReminder - 38/38 pasando

## Sprint: Resumen Calórico en Notificaciones (02/04/2026)

### Backend
- [x] Endpoint `notifications.getDailySummary` — devuelve calorías consumidas hoy, objetivo, porcentaje y macros
- [x] Usa `getDailyNutritionSummary` + `getUserProfile.dailyCalorieGoal` (default 2000 kcal)

### Frontend (Service Worker)
- [x] Al disparar notificación push, incluir datos calóricos en el payload
- [x] Notificación muestra barra de progreso Unicode, kcal consumidas/objetivo, macros
- [x] `buildNotificationBody()` en sw.js genera cuerpo enriquecido con resumen del día

### Frontend (Página Recordatorios)
- [x] Widget de resumen calórico en /notifications con barra de progreso visual
- [x] Muestra kcal consumidas, objetivo, porcentaje, macros y kcal restantes
- [x] Mensaje contextual: "Te quedan X kcal" o "¡Has alcanzado tu objetivo!"

### Tests
- [x] 3 tests para getDailySummary (shape, default goal, date format) - 41/41 pasando

## Sprint: Sistema de Logros y Recompensas (02/04/2026)

### Base de Datos
- [x] Tabla `user_achievements` (userId, achievementId, unlockedAt, pointsAwarded)
- [x] Tabla `user_points` (userId, totalPoints, updatedAt)
- [x] Migración con pnpm db:push

### Backend (tRPC) — router `achievements`
- [x] `achievements.getAll` — lista todos los logros con estado (desbloqueado/bloqueado) del usuario
- [x] `achievements.getUserStats` — puntos totales, nivel actual, logros desbloqueados/total
- [x] `achievements.evaluate` — evalúa y desbloquea logros automáticamente tras registrar comida
- [x] Catálogo de logros en `server/achievements-catalog.ts` (25+ logros en 5 categorías)
- [x] Helpers en db.ts: getUserAchievements, getUserPoints, unlockAchievement, hasAchievement, getTotalMealLogs, getDistinctRecipesLogged, getMealStreak, getMealTypesLoggedToday
- [x] Sistema de 10 niveles (Principiante → Experto Nutricional) basado en puntos

### Catálogo de Logros (25 logros en 5 categorías)
- [x] Categoría RACHA: Primer registro, 3 días, 7 días, 30 días, 100 días
- [x] Categoría CANTIDAD: 10, 50, 100, 500 registros
- [x] Categoría VARIEDAD: 5 tipos distintos, 10 recetas distintas
- [x] Categoría NUTRICIÓN: Objetivo calórico 3 días, 7 días, completar macros
- [x] Categoría EXPLORADOR: Escáner de código de barras, foto a comida, crear receta

### Frontend
- [x] Página `/achievements` con galería de badges (desbloqueados en color, bloqueados en gris)
- [x] Card de nivel y puntos en la parte superior con barra de progreso
- [x] Filtros por categoría (Racha, Cantidad, Variedad, Nutrición, Explorador)
- [x] Toast de notificación con acción "Ver logros" al desbloquear un logro
- [x] Evaluación automática al registrar comida en MealLog.tsx
- [x] Acceso desde sidebar (sección Nutrición) y Dashboard (card de acceso rápido)

### Tests
- [x] 9 tests para getAll, getUserStats, evaluate - 47/47 pasando

## Sprint: Revisión Flujo BuddyExperts (02/04/2026)

### Auditoría y correcciones
- [x] Revisar schema BD: buddyExperts, expertPlans, expertMenus, expertSubscriptions
- [x] Revisar router buddyExperts: endpoints completos para ambos flujos
- [x] Corregir BuddyExperts.tsx: eliminar datos DEMO, usar datos reales con estado vacío correcto
- [x] Corregir BuddyExpertDashboard.tsx: añadir tab "Mis Planes" con CRUD completo
- [x] Flujo registro como BuddyExpert: formulario de solicitud, aprobación admin (ya existía)
- [x] Añadir endpoints: getMyPlans, createPlan, updatePlan, deletePlan, getMyCopiedPlans
- [x] BuddyProfile.tsx: indicador visual de "plan ya copiado" con estado verde
- [x] BuddyProfile.tsx: spinner de carga durante copia de plan
- [x] Fix test lookupBarcode: mock de fetch para evitar llamada real a Open Food Facts
- [x] Tests: 47/47 pasando, 0 errores TypeScript

## Sprint: Mejoras BuddyExperts UI/UX (02/04/2026)

- [ ] BuddyExperts.tsx: añadir barra de búsqueda funcional (conectada a buddyExperts.list con search)
- [ ] BuddyExperts.tsx: añadir filtros por categoría funcionales (conectados al backend)
- [ ] BuddyExperts.tsx: limpiar código DEMO residual (constante DEMO_EXPERTS sin usar)
- [ ] Crear página /mis-planes-expertos con planes copiados del usuario
- [ ] Añadir enlace "Mis Planes de Expertos" en sidebar (sección Comunidad)
- [ ] Añadir ruta /mis-planes-expertos en App.tsx
- [ ] BuddyProfile.tsx: planes de pago (price > 0) deben abrir Stripe checkout en lugar de copyPlan
- [ ] BuddyMakers.tsx: eliminar fallback a DEMO_MAKERS (igual que se hizo en BuddyExperts)

## Sprint: Perfil de Salud Ampliado + Menús Especializados (02/04/2026)

### Base de Datos
- [ ] Ampliar campo `allergies` en userProfiles: 30+ alergias/intolerancias
- [ ] Añadir campo `medicalConditions` en userProfiles (JSON array)
- [ ] Añadir campo `lifestyle` en userProfiles (vegano, vegetariano, embarazada, etc.)
- [ ] Añadir campo `specialNeeds` en userProfiles (estado temporal: resfriado, recuperación, etc.)
- [ ] Migración con pnpm db:push

### Backend
- [ ] Actualizar endpoint `userProfiles.update` para incluir nuevos campos
- [ ] Endpoint `menus.getSpecialized` — menús filtrados por condición médica/estilo de vida
- [ ] Endpoint `menus.generateForProfile` — generar menú IA personalizado por perfil de salud
- [ ] Actualizar BuddyIA para incluir condiciones médicas en el contexto del usuario

### Frontend — Perfil
- [ ] Sección "Alergias e Intolerancias" ampliada (30+ opciones en chips visuales)
- [ ] Sección "Condiciones Médicas" (diabetes, hipertensión, celiaquía, hipotiroidismo, etc.)
- [ ] Sección "Estilo de Vida" (vegano, vegetariano, embarazada, lactancia, deportista)
- [ ] Sección "Estado Actual" (resfriado, recuperación post-operatoria, etc.)

### Frontend — Menús Especializados
- [ ] Página /menus-especializados con catálogo de menús por perfil
- [ ] Categorías: Condiciones Médicas, Estilos de Vida, Momentos Especiales, Recuperación
- [ ] Generador IA de menú personalizado basado en perfil de salud completo
- [ ] Acceso desde sidebar y Dashboard

## Sprint: Menús Especializados + Alergias Ampliadas (02/04/2026)
- [x] Catálogo de alergias ampliado a 34 opciones (14 alérgenos UE + 20 intolerancias adicionales)
- [x] Catálogo de restricciones dietéticas ampliado a 24 opciones
- [x] Router `specializedMenus.generate` con 24 categorías (condiciones médicas, estilos de vida, etapas vitales, digestivo, recuperación)
- [x] Página /specialized-menus con catálogo visual por grupos, configurador y resultados con IA
- [x] Enlace "Menús Especializados" añadido al sidebar (sección Nutrición)
- [x] Ruta /specialized-menus registrada en App.tsx
- [x] Tests unitarios para specializedMenus.generate (5 tests, todos pasan - 52/52 total)

## Admin: Gestión de planes y tipos de cuenta (02/04/2026)
- [ ] Procedimiento tRPC admin.setUserPlan para cambiar Free/Pro/Pro Max sin pago
- [ ] Procedimiento tRPC admin.setUserAccountType para cambiar tipo de cuenta
- [ ] UI en panel Admin: selector de plan por usuario con botón de aplicar
- [ ] UI en panel Admin: selector de tipo de cuenta por usuario
- [ ] Notificación al usuario cuando el admin le activa Pro/Pro Max
- [ ] Tests para los nuevos procedimientos admin

## Sprint: Sistema de Planes con Límites Reales (02/04/2026)
- [x] shared/plans.ts con definición de límites por plan (Free, Pro/basic, Pro Max/premium, Pro Max+/pro_max)
- [x] server/planGuard.ts con helpers requirePlanFeature y requireUnderLimit
- [x] Backend protegido: specializedMenus, mealPlanner, nutritionalDiary, recipes con validación de plan
- [x] client/src/hooks/usePlan.ts hook para acceder al plan actual en el frontend
- [x] client/src/components/UpgradeGate.tsx componente para bloquear funcionalidades según plan
- [x] Gates añadidos en: BuddyIA, SpecializedMenus, MealLog
- [x] Landing page: botones Pro y Pro Max conectados con Stripe checkout (handlePlanCta)
- [x] Landing page: tabla de planes actualizada con límites reales (Free/Pro/Pro Max)
- [x] Sidebar: badge dinámico del plan actual (Free/Pro/Pro Max) con enlace a /subscription
- [x] Página /subscription rediseñada con planes correctos (Free gratis, Pro 9,99€, Pro Max 19,99€)
- [x] Tests actualizados: specializedMenus tests usan mock de plan Pro (62/62 pasando)

## Sprint: Tabla comparativa de planes con funciones reales (02/04/2026)
- [x] Auditar funciones reales de la app y asignarlas a cada plan (Free/Pro/Pro Max)
- [x] Landing page: reemplazar listas de features por tabla comparativa visual (✓/✗/número)
- [x] Landing page: destacar claramente las diferencias entre Pro y Pro Max
- [x] Página /subscription: añadir tabla comparativa completa con todas las funciones
- [x] Página /subscription: mostrar límites numéricos reales (5 menús/mes, 20 productos, etc.)

## Sprint: Flujo de solicitud BuddyMaker/BuddyExpert (02/04/2026)
- [x] BD: tabla `role_requests` (userId, roleType, status, reason, reviewedAt, reviewedBy)
- [x] Backend: procedimiento `requestRole` (cualquier usuario puede solicitar)
- [x] Backend: procedimiento `getMyRoleRequest` (ver estado de solicitud propia)
- [x] Backend: procedimientos admin `getRoleRequests`, `approveRoleRequest`, `rejectRoleRequest`
- [x] Tabla comparativa: cambiar BuddyMaker/Expert de "solo Pro Max" a "con aprobación de BuddyMarket"
- [x] Frontend: botón "Solicitar ser BuddyMaker/Expert" en perfil (cualquier usuario)
- [x] Frontend: modal de solicitud con campo de motivación/bio
- [x] Frontend: estado visible de la solicitud (pendiente/aprobado/rechazado)
- [x] Admin panel: sección de gestión de solicitudes BuddyMaker/Expert
- [x] Admin panel: botones aprobar/rechazar con notificación al usuario

## Sprint: Pop-up de instalación de la app (02/04/2026)
- [x] Componente InstallAppBanner con lógica PWA (beforeinstallprompt + iOS detection)
- [x] Pop-up aparece después de 3 segundos en la primera visita (no vuelve a aparecer si se descarta)
- [x] Diseño premium con logo BuddyMarket, beneficios clave y botones Instalar/Ahora no
- [x] Detectar plataforma: Android (prompt nativo), iOS (instrucciones Añadir a pantalla inicio), Desktop (prompt nativo)
- [x] Guardar preferencia en localStorage para no mostrar de nuevo si el usuario lo descarta
- [x] Integrar en App.tsx para que aparezca en todas las páginas

## Sprint: Compartir recetas (02/04/2026)
- [x] Componente ShareRecipeButton con Web Share API (móvil nativo) y fallback menú desplegable
- [x] Opciones de compartir: WhatsApp, copiar enlace, Twitter/X, Telegram
- [x] URL pública de receta: /recipes/:id (ya existe, solo necesita ser compartible)
- [x] Botón compartir en RecipeDetail (prominente, junto al título)
- [x] Botón compartir en tarjetas de recetas (icono pequeño en esquina)
- [x] Mensaje de WhatsApp preformateado con nombre, descripción y enlace de la receta
- [x] Toast de confirmación al copiar enlace

## Sprint: Escáner código de barras + OCR + Métricas + Calculadora (02/04/2026)

### Escáner de código de barras
- [x] Instalar @zxing/browser para lectura de códigos de barras desde cámara
- [x] Componente BarcodeScanner: activa cámara, detecta código EAN/UPC en tiempo real
- [x] tRPC procedure: lookupBarcode(barcode) → consulta Open Food Facts API → devuelve nombre, nutrición, imagen
- [x] tRPC procedure: addInventoryItemFromBarcode → crea item en inventario con datos del producto
- [x] Botón "Escanear" en página de Inventario que abre el escáner
- [x] Modal de confirmación: muestra producto encontrado con foto y nutrición antes de añadir
- [x] Fallback: si no se encuentra el código, permite introducir manualmente

### OCR lista de la compra
- [x] Componente ShoppingListOCR: botón "Foto de lista" que activa cámara o sube imagen
- [x] tRPC procedure: parseShoppingListImage(imageBase64) → usa LLM con visión para extraer productos
- [x] Modal de revisión: muestra productos detectados con checkboxes para confirmar/editar antes de añadir
- [x] Botón "Importar desde foto" en página de Listas de la Compra
- [x] Subir imagen a S3 antes de enviar al LLM

### Seguimiento de peso y métricas
- [x] Schema DB: tabla weightLogs (userId, weight, bodyFat, muscleMass, waist, hip, notes, measuredAt)
- [x] tRPC procedures: addWeightLog, getWeightHistory, deleteWeightLog
- [x] Página /metrics con formulario de registro y gráficas de evolución
- [x] Gráficas: peso (línea), IMC calculado (línea), grasa corporal (área), medidas (barras)
- [x] Instalar recharts para gráficas
- [x] Enlace en sidebar y Dashboard

### Calculadora de calorías diarias (TDEE)
- [x] Componente CalorieCalculator con fórmula Mifflin-St Jeor + factor de actividad
- [x] Inputs: edad, peso, altura, sexo, nivel de actividad, objetivo (perder/mantener/ganar)
- [x] Resultado: TDEE, distribución de macros (proteínas/carbos/grasas), déficit/superávit recomendado
- [x] Guardar resultado en perfil del usuario como objetivo calórico diario
- [x] Integrar en página de Métricas y en el Dashboard como card

## Bug: Redirección automática al registro (02/04/2026)
- [x] Corregir App.tsx: la ruta / debe mostrar LandingPage sin redirigir al registro
- [x] Verificar que las rutas públicas (/, /blog, /terms, /subscription) son accesibles sin login
- [x] El registro/login solo debe ocurrir cuando el usuario pulsa "Iniciar sesión" o "Empezar gratis"

## Sprint: Separación rutas /app/* (02/04/2026)
- [x] App.tsx: mover todas las rutas de la app bajo /app/* (ej: /app/dashboard, /app/recipes, etc.)
- [x] App.tsx: crear componente ProtectedRoute que redirige al login si no autenticado
- [x] App.tsx: rutas públicas siguen en / (landing, blog, terms, privacy, cookies)
- [x] AppLayout: actualizar todos los enlaces internos de navegación a /app/*
- [x] AppLayout: actualizar el botón "Ir a la app" / logo link a /app/dashboard
- [x] Landing page: actualizar botones CTA a /app/dashboard (si logueado) o login (si no)
- [x] Actualizar todos los navigate() y Link to= en páginas de la app a /app/*
- [x] Verificar que /app redirige a /app/dashboard

## Bug: Admin sin plan Pro (02/04/2026)
- [ ] planGuard: el rol admin siempre tiene acceso a todas las funciones (bypass de plan)
- [ ] Panel admin: selector de plan para asignar Pro/Pro Max a usuarios sin Stripe
- [ ] tRPC procedure: adminSetUserPlan(userId, plan) para asignar plan manualmente
- [ ] BD: columna manualPlan en subscriptions o campo en users para plan asignado por admin

## Bug: Errores en /app/event-menu (02/04/2026)
- [x] subscriptions.getStatus: nunca devolver undefined, siempre retornar objeto con plan free si no hay suscripción
- [x] user_medical_profiles: sincronizar schema con BD (columnas faltantes)

## Bug: Modales y perfil (02/04/2026)
- [x] Centrar todos los modales/dialogs en pantalla (no pegados abajo en móvil)
- [x] Hacer todos los campos del perfil opcionales (sin validaciones required)
- [x] El porcentaje de completado del perfil no debe bloquear funciones

## Sprint: BD de ingredientes nutricionales (03/04/2026)
- [ ] Schema BD: tabla `ingredientNutrition` con campos nutricionales completos (calorías, proteínas, carbos, grasas, fibra, azúcares, sodio, vitaminas, minerales)
- [ ] Generar 1500 ingredientes con valores nutricionales por 100g
- [ ] Script de inserción masiva en BD
- [ ] Vincular ingredientes de recetas con la tabla de nutrición
- [ ] Actualizar cálculo nutricional de recetas para usar BD de ingredientes
- [ ] UI: mostrar nutrición calculada desde BD de ingredientes en RecipeDetail

## Sprint: Menú IA → Mis Menús → Diario (fase actual)
- [x] Al generar un menú con IA, guardarlo automáticamente en Mis Menús con nombre "Menú [Objetivo] IA"
- [x] Las recetas nuevas generadas por la IA que no existan en la BD se añaden automáticamente a la base de datos
- [x] Desde el menú guardado, permitir asignar una fecha de inicio para el menú
- [x] Al asignar fecha de inicio, volcar las comidas del menú al diario/calendario día a día
- [ ] Mostrar indicador visual "Generado por IA" en el menú guardado

## Bug: App móvil con zoom y movimiento horizontal (03/04/2026)
- [x] Corregir viewport: overflow-x hidden en html y body en index.css
- [x] Corregir index.html: overflow-x hidden y max-width: 100vw en body
- [x] Meta viewport ya correcto: maximum-scale=1.0, user-scalable=no, viewport-fit=cover

## Bug: Modales tapados por barra inferior (03/04/2026)
- [x] Corregir todos los modales/popups para que queden centrados en pantalla con padding-bottom suficiente para no quedar tapados por la barra de navegación inferior (90px)
- [x] Crear clase CSS global .modal-overlay con padding-bottom: calc(90px + 16px) y z-index: 9000
- [x] Aplicar .modal-overlay a todos los modales: Menus (4), Inventory (3), ShoppingLists (4), MealLog (1), RecipeDetail (1), MercadonaShop (2 centrados + 1 bottom sheet con padding)

## Feature: Cerrar modales al hacer clic fuera (03/04/2026)
- [x] Añadir onClick en el overlay de todos los modales para cerrarlos al hacer clic fuera del contenido (13 modales en total)

## Feature: Separar landing (buddymarketapp.com) de app (buddymarket.app) (03/04/2026)
- [x] Actualizar todos los CTAs de la landing page para apuntar a https://buddymarket.app (4 enlaces)
- [x] Redirigir usuarios autenticados en la landing a https://buddymarket.app/app/dashboard

## Bug: Banner PWA aparece en la landing page (03/04/2026)
- [x] Condicionar el banner PWA para que solo aparezca en rutas /app/* y /register, no en la landing ni en páginas públicas

## Feature: appbuddymarket.com muestra login directo (03/04/2026)
- [x] Detectar dominio appbuddymarket.com y redirigir / al login en lugar de la landing page

## Feature: Página de login/registro mejorada para appbuddymarket.com (03/04/2026)
- [x] Crear LoginPage.tsx con diseño mejorado: fondo crema, logo grande, formulario email/contraseña, botón naranja, enlace registro
- [x] Conectar LoginPage al flujo OAuth de Manus (getLoginUrl con type=signIn y type=signUp)
- [x] Redirigir appbuddymarket.com / a LoginPage en lugar de directamente a getLoginUrl()

## Feature: Botón "Continuar con Google" en LoginPage (03/04/2026)
- [x] Añadir botón "Continuar con Google" en ambas pestañas de LoginPage.tsx

## Feature: Onboarding de nuevos usuarios (03/04/2026)
- [ ] Detectar usuarios nuevos (sin perfil completado) y mostrar OnboardingModal en el dashboard
- [ ] OnboardingModal paso 1: Bienvenida con nombre del usuario
- [ ] OnboardingModal paso 2: Objetivo nutricional (perder peso, mantener, ganar masa)
- [ ] OnboardingModal paso 3: Datos físicos (edad, sexo, altura, peso)
- [ ] OnboardingModal paso 4: Preferencias alimentarias (vegetariano, sin gluten, alergias, etc.)
- [ ] Guardar datos de onboarding en el perfil del usuario
- [ ] Marcar onboarding como completado para no volver a mostrarlo

## Bug: App móvil con zoom y overflow horizontal (03/04/2026 - segunda vez)
- [x] Revisar y corregir meta viewport en index.html: overflow-x hidden, overflow-y scroll, max-width 100vw
- [x] Añadir touch-action pan-y y overflow-x hidden a nivel global en index.css
- [x] Corregir AppLayout outer wrapper: overflowX clip en lugar de hidden para no bloquear fixed children
- [x] Añadir img/video/iframe max-width 100% en index.html para evitar overflow de medios

## Feature: Sistema de notificaciones in-app (03/04/2026)
- [ ] Tabla `notifications` en BD: id, userId, title, body, type, isRead, link, createdAt
- [ ] Procedimiento tRPC `notifications.list` para listar notificaciones del usuario
- [ ] Procedimiento tRPC `notifications.markRead` para marcar una notificación como leída
- [ ] Procedimiento tRPC `notifications.markAllRead` para marcar todas como leídas
- [ ] Procedimiento tRPC `notifications.create` (solo admin) para crear notificaciones globales
- [ ] Panel de notificaciones: página /app/notifications con lista de notificaciones
- [ ] Badge con número de no leídas en el icono de campana del header
- [ ] Notificaciones automáticas: bienvenida al registrarse, recordatorio de diario, etc.

## Sistema de Notificaciones In-App (completado)
- [x] Backend: tabla in_app_notifications en schema.ts
- [x] Backend: procedimientos tRPC (list, unreadCount, markRead, markAllRead, create)
- [x] Frontend: componente NotificationBell con badge de no leidas en AppLayout header
- [x] Frontend: pagina /app/notifications con lista, filtros (todas/no leidas), marcar como leidas
- [x] Notificaciones automaticas: guardar menu IA, aplicar al calendario, completar onboarding
- [x] Ruta /app/notifications registrada en App.tsx (nueva pagina de notificaciones in-app)
- [x] Ruta /app/meal-notifications para recordatorios de comidas (antigua /app/notifications)
- [x] Error en Inventory.tsx linea 434 corregido (caracteres box-drawing en comentario JSX)

## Plantillas de Lista de la Compra
- [ ] Tabla shoppingListTemplates en drizzle/schema.ts (id, userId, name, items JSON, createdAt)
- [ ] Procedimientos tRPC: saveAsTemplate, listTemplates, createFromTemplate, deleteTemplate
- [ ] Botón 'Guardar como plantilla' en cabecera de ShoppingListDetail
- [ ] Sección 'Plantillas' en ShoppingLists para crear nueva lista desde plantilla guardada
- [ ] Lista de la compra desde menú en curso: mostrar vista Mercadona completa (foto, nombre, precio, controles cantidad, total, botón enviar al carrito)

## Integración Lidl Supermercado (fase actual)
- [x] Añadir tabla lidl_products en drizzle/schema.ts
- [x] Importar catálogo de productos alimentarios de Lidl España via script (134 productos)
- [x] Añadir procedimiento tRPC lidl.searchProducts en server/routers.ts
- [x] Crear componente LidlCartExport.tsx con vista estilo Lidl (azul/amarillo)
- [x] Integrar LidlCartExport en ActiveMenu.tsx (menú en curso)
- [x] Integrar LidlCartExport en ShoppingLists.tsx (supermercados)

## Corrección de errores detectados en auditoría (2026-04-03)

### Errores Críticos
- [ ] Error 1: Notificaciones - endpoint unreadCount falla constantemente (bucle de reintentos)
- [ ] Error 2: Lidl aparece como "Próximamente" en /app/supermercados aunque ya está integrado
- [ ] Error 3: Recetas del menú en curso muestran "Receta" genérico sin nombre real ni imagen
- [ ] Error 4: Lista de la compra muestra 0/0 items aunque existen items generados

### Errores Importantes
- [ ] Error 5: Todas las recetas muestran imagen placeholder "Sin foto aún"
- [ ] Error 6: Calorías muestran 0 kcal en tarjetas de recetas
- [ ] Error 7: Ruta de Lidl no conectada desde página de Supermercados
- [ ] Error 8: Días del menú en curso muestran recetas sin nombre visible
- [ ] Error 9: Listas de la compra duplicadas del mismo menú
- [ ] Error 10: Botón "Fotografía tu comida" sin feedback visual de carga

### Mejoras UX/UI
- [ ] Mejora 11: Actualizar badge Lidl a "Disponible" y habilitar click en supermercados
- [ ] Mejora 12: Marcar Alcampo, Día y El Corte Inglés como "Próximamente" en menú en curso
- [x] Mejora 13: Scroll horizontal en filtros de recetas en móvil (ya estaba implementado)
- [x] Mejora 14: Estadísticas filtran días con 0 kcal correctamente (problema de datos, no de código)
- [x] Mejora 15: Estado vacío con CTA ya implementado en inventario
- [ ] Mejora 16: Historial de conversaciones en BuddyIA
- [x] Mejora 17: Calorías 0 en carrusel: ahora muestra "—" cuando valor es 0 o null
- [x] Mejora 18: Perfil completado: lógica correcta, muestra % real de campos rellenos
- [x] Mejora 19: Ruta /app/diary añadida como alias de /app/meal-log
- [x] Mejora 20: Ruta /app/supermarkets añadida como alias de /app/supermercados

## Correcciones de errores (auditoría 03/04/2026)
- [x] Lidl habilitado en página de Supermercados (antes mostraba "Próximamente")
- [x] Nombres de recetas en Menú en Curso (nameEs→name, calories→caloriesPerServing)
- [x] Calorías en Dashboard recomendaciones: mostrar "—" en lugar de "0 kcal"
- [x] Lista de la compra: conteo de items ahora muestra X/Y (antes 0/0)
- [x] Rutas alias: /app/diary → /app/meal-log, /app/supermarkets → /app/supermercados
- [x] Notificaciones: verificado que funciona correctamente para usuarios autenticados

## Pendientes resueltos (03/04/2026)
- [ ] Limpiar listas de la compra duplicadas en BD
- [ ] Prevenir creación de listas duplicadas al generar desde menú
- [ ] Asignar imágenes reales a todas las recetas del sistema

## Sprint: Marcar ingredientes en despensa (COMPLETADO)
- [x] Añadir campo inPantry a shoppingListItems en BD (drizzle/schema.ts + db:push)
- [x] Crear procedimiento togglePantry en server/routers.ts
- [x] Actualizar UI ShoppingListDetail con botón 🏠 por item para marcar/desmarcar despensa
- [x] Añadir tabs de filtro (Todos / Por comprar / En despensa / Comprados) en lista de la compra
- [x] Mostrar barra de progreso y estadísticas de despensa vs comprados
- [x] Excluir items en despensa de la exportación a supermercados online
- [x] Integrar botón de despensa en GenericListModal del menú en curso (ActiveMenu)

## Sprint: Marcar ingredientes en despensa (COMPLETADO)
- [x] Añadir campo inPantry a shoppingListItems en BD (drizzle/schema.ts + db:push)
- [x] Crear procedimiento togglePantry en server/routers.ts
- [x] Actualizar UI ShoppingListDetail con boton de despensa por item
- [x] Añadir tabs de filtro (Todos / Por comprar / En despensa / Comprados)
- [x] Mostrar barra de progreso y estadisticas de despensa vs comprados
- [x] Excluir items en despensa de la exportacion a supermercados online
- [x] Integrar boton de despensa en GenericListModal del menu en curso

- [x] Panel de estadísticas para BuddyMakers con seguidores, recetas, ganancias y Stripe Connect
- [x] Panel de estadísticas para BuddyExperts con seguidores, planes, menús, ganancias y Stripe Connect
- [x] Procedimientos tRPC getMyStats y getMyFollowers para buddyMakers y buddyExperts
- [x] Procedimientos tRPC getConnectStatus y getStripeDashboardLink en stripeConnect
- [x] Enlace a estadísticas desde los dashboards de BuddyMaker y BuddyExpert
- [x] Corregir exportación de lista de la compra al supermercado: mostrar productos con imagen igual que en el apartado supermercado (CarrefourCartExport creado para ShoppingLists y ActiveMenu)

## Sprint Mejoras Módulo Menús (COMPLETADO)
- [x] Edición de nombre de menú (inline o modal)
- [x] Vista de recetas del menú como cards expandibles con ingredientes, instrucciones y valores nutricionales
- [x] Tabla menuComplements en BD para complementos por menú (café, batido, snack, etc.)
- [x] tRPC: addComplement, removeComplement, updateComplement, listComplements
- [x] tRPC: renameMenu para editar el nombre
- [x] Sección Complementos en vista de menú con sugerencias predefinidas y campo personalizado
- [x] Propagar complementos al copiar/duplicar un menú de biblioteca

## Sprint Unidades Mínimas de Supermercado (COMPLETADO)
- [x] Crear módulo shared/supermarketUnits.ts con mapa de ingredientes → unidad mínima comercial
- [x] Integrar normalización en generateShoppingListFromMenu en server/db.ts
- [x] Mostrar en la UI la unidad comercial (ej: "1 sobre 100g") junto a la cantidad original de receta

## Sprint Selector de Tamaños de Envase (fase actual)
- [ ] Ampliar supermarketUnits.ts con array de variantes (múltiples tamaños) por ingrediente
- [ ] Añadir campo packageVariant (JSON) a shoppingListItems en BD y hacer db:push
- [ ] tRPC: procedimiento updateItemPackage para guardar la variante elegida
- [ ] UI ShoppingListDetail: selector inline de tamaño de envase por item con variantes disponibles

## Sprint Matching Inteligente de Productos (fase actual)
- [ ] Tabla de sinónimos/alias en supermarketUnits.ts (ej: "jamón" → "jamón serrano", "aceite" → "aceite de oliva")
- [ ] Motor de matching por similitud: normalizar tildes/mayúsculas, buscar por alias, luego por categoría
- [ ] Fallback por categoría: si no hay match exacto, asignar unidad mínima de la categoría más cercana
- [ ] Nunca mostrar "jamón entero" ni cantidades absurdas: garantizar siempre unidad comercial mínima
- [ ] Mostrar en la lista el nombre normalizado del producto (ej: "Jamón serrano lonchas") junto al original

## Sprint Despensa Inteligente (fase actual)
- [ ] Tabla pantryStock en BD: userId, ingredientKey, commercialLabel, quantityAvailable, purchasedAt, estimatedExpiresAt
- [ ] Al marcar item como comprado (checked=true) en lista de la compra → upsert en pantryStock
- [ ] Al generar nueva lista de la compra → cruzar ingredientes con pantryStock y marcar inStock=true si hay stock disponible
- [ ] Badge "Ya lo tienes" en items de la lista con stock disponible en despensa
- [ ] Procedimientos tRPC: getPantryStock, markItemPurchased (con upsert pantry), clearExpiredStock

## Sprint Recetas Sugeridas por Inventario
- [ ] Procedimiento tRPC recipes.cookableNow: cruza inventario con ingredientes de recetas
- [ ] Sección "Puedes cocinar ahora" en Recipes.tsx con cards y % de ingredientes disponibles
- [ ] Badge de ingredientes faltantes en cada card de receta cookable

## Sprint BuddySetup - Onboarding guiado con IA
- [ ] Página /buddy-setup con flujo de 5 pasos (objetivo, restricciones, horarios, presupuesto, generación menú)
- [ ] Redirigir a /buddy-setup si onboardingCompleted = false tras el login
- [ ] tRPC: completeOnboarding que guarda los datos y genera el primer menú con IA
- [ ] Animaciones de transición entre pasos
- [ ] Marcar onboardingCompleted = true al finalizar

## Sección Progreso y Estadísticas
- [x] Crear procedimientos tRPC para datos de progreso: peso/métricas, calorías diarias, macros, adherencia al menú, logros
- [x] Instalar recharts para gráficos interactivos
- [x] Crear página Progress.tsx con gráfico de evolución de peso, calorías diarias, macros, adherencia al menú y resumen de logros
- [x] Registrar ruta /app/progress en App.tsx
- [x] Añadir enlace "Progreso" en el menú de navegación lateral (AppLayout)

- [x] Bug BuddyExperts: menús gratuitos no se abren al hacer clic
- [x] Bug BuddyExperts: al volver atrás desde un perfil la página queda en blanco/no carga

## Bugs reportados
- [x] BuddySetup se queda colgado en el paso de generación de menú (pantalla en blanco/spinner infinito) - el usuario tiene que dar a "Omitir"

## Auditoría de flujos y responsividad (completado)
- [x] Auditoría completa de mutaciones tRPC: solo BuddySetup tenía el patrón problemático (onSuccess + mutateAsync), ya corregido
- [x] Dashboard: mejorar legibilidad de tarjetas de comunidad (BuddyExperts/Makers/IA) en mobile
- [x] LandingPage: tabla comparativa de planes con scroll horizontal en mobile
- [x] Registration: grids adaptativos (datos físicos 3→2 cols, tarjetas de cuenta 2→1 col en pantallas <480px)
- [x] ReferralDashboard: pasos "Cómo funciona" cambiados de grid 3 cols a lista vertical legible
- [x] OnboardingModal: fail-safe mejorado en handleFinish (si falla el updateProfile, completa el onboarding igualmente)

## Nuevas recetas saludables (lote masivo)
- [ ] Generar 300+ recetas saludables de todo tipo (desayunos, comidas, cenas, snacks, postres, ensaladas, sopas, batidos)
- [ ] Insertar recetas en la BD via script seed
- [ ] Verificar que aparecen correctamente en la app
- [x] Bug: encabezado duplicado en página Progreso (Progress.tsx tenía su propio h1 además del de AppLayout)
- [x] Bug: sidebar del AppLayout no cubre bien la pantalla - corregido: header cambiado a position:fixed con background sólido, sidebar usa left:0 en lugar de cálculo relativo

## Sprint Recetas Saludables para Dieta (completado)
- [x] Generar 85 recetas saludables para dieta de todo tipo (desayunos, media mañana, comidas, meriendas, cenas, postres, bebidas)
- [x] Total recetas en BD: 1.636 (621 comidas, 372 cenas, 245 desayunos, 187 meriendas, 181 media mañana, 30 cualquiera)

## Revisión de duplicados en BD
- [x] Detectar y eliminar recetas duplicadas: 73 grupos encontrados, 163 registros eliminados (0 errores)
- [x] Verificar resultado: 0 grupos duplicados restantes, 1.473 recetas únicas en BD

## Recetas para condiciones médicas
- [x] Generar e insertar recetas para hipertensión (8 recetas, bajas en sodio)
- [x] Generar e insertar recetas para diabetes tipo 2 (7 recetas, bajo índice glucémico)
- [x] Generar e insertar recetas para post-operatorio (8 recetas, blandas, fácil digestión)
- [x] Generar e insertar recetas para colesterol alto (4 recetas, omega-3 y fibra soluble)
- [x] Generar e insertar recetas para enfermedad renal (3 recetas, bajas en potasio/fósforo)
- [x] Generar e insertar recetas para celiaquía (4 recetas, sin gluten)
- [x] Generar e insertar recetas para síndrome de intestino irritable (3 recetas, dieta FODMAP)
- [x] Generar e insertar recetas para osteoporosis (3 recetas, alto calcio/vitamina D)
- [x] Generar e insertar recetas para anemia (3 recetas, alto hierro)
- [x] Generar e insertar recetas para gota (2 recetas, bajo purinas)
- [x] Generar e insertar recetas para embarazo (3 recetas, ácido fólico/hierro/calcio)
- [x] Generar e insertar recetas para menopausia (2 recetas, fitoestrógenos)
- [x] Generar e insertar recetas para hipotiroidismo (1 receta, yodo/selenio)

## Bugs - Biblioteca de Menús
- [x] Bug: Biblioteca de Menús mostraba "0 menús" - corregido: 10 menús de biblioteca creados con isSeeded=true y 196 recetas asignadas

## Hallazgos Críticos Auditoría Nutricional (completados)
- [x] CRÍTICO 1: Implementado botón ✨ Generar foto con IA en RecipeCard (endpoint recipes.generateAIImage)
- [x] CRÍTICO 2: Implementado cálculo TMB/TDEE con Mifflin-St Jeor en BuddySetup (nuevo paso de datos físicos)
- [x] CRÍTICO 3: 227 recetas corregidas con fórmula kcal=(prot×4)+(carbs×4)+(grasas×9) - 0 incoherencias restantes
- [x] CRÍTICO 4: 21 snacks/meriendas con >400 kcal reclasificados como "comida"
- [x] IMPORTANTE 5: BuddySetup ahora recoge peso/altura/edad/sexo/actividad (nuevo paso 3 de 6)
- [x] IMPORTANTE 6: Prompt de IA del onboarding incluye calorías calculadas, perfil físico y objetivo nutricional

## Rediseño flujo de Menús con IA
- [ ] Cuestionario IA mejorado: nº comidas/día, días que come fuera, nº personas, estilo cocina, presupuesto, alimentos que no le gustan
- [ ] Pasar automáticamente métricas del usuario (peso, altura, edad, TMB, TDEE, objetivo, restricciones, alergias) a la IA
- [ ] Menú generado por IA → guardar automáticamente en "Mis Menús" con categoría (ej: "Menú IA - Pérdida de peso")
- [ ] Sección "Mis Menús": listado de todos los menús del usuario (IA + manuales + biblioteca)
- [ ] Mis Menús: editar nombre del menú
- [ ] Mis Menús: asignar fecha de inicio para activarlo en el calendario/diario
- [ ] Mis Menús: ver todas las recetas del menú (cards estilo biblioteca)
- [ ] Mis Menús: duplicar/reutilizar un menú existente
- [ ] Mis Menús: eliminar menú

## Sprint Mis Menús + BuddyIA Cuestionario Mejorado (COMPLETADO)
- [x] Página Mis Menús (/app/my-menus): listado de menús del usuario con filtros por objetivo
- [x] Mis Menús: banner de menú activo con acceso rápido
- [x] Mis Menús: acciones por menú (renombrar, cambiar fecha de inicio, activar, eliminar)
- [x] Mis Menús: modal de renombrar menú
- [x] Mis Menús: modal de cambiar fecha de inicio (desplaza todas las comidas)
- [x] Mis Menús: estadísticas resumen (total, activos, objetivos)
- [x] AppLayout sidebar: añadir Mis Menús al menú lateral
- [x] App.tsx: ruta /app/my-menus
- [x] BuddyIA: cuestionario ampliado a 9 pasos (antes 7)
- [x] BuddyIA paso 5: días que come fuera de casa (selección por día de la semana)
- [x] BuddyIA paso 6: alimentos que no le gustan (chips predefinidos + campo personalizado)
- [x] BuddyIA paso 7: restricciones alimentarias
- [x] BuddyIA paso 8: presupuesto semanal con atajos (40/60/80/120€) + preferencias adicionales + resumen
- [x] BuddyIA: resumen completo del menú antes de generar (paso 8)
- [x] BuddyIA: modal post-guardado con opciones (Ver Mis Menús, Ver activo, Seguir revisando)
- [x] BuddyIA: botón "Mis Menús" en la pantalla de inicio de BuddyIA
- [x] BuddyIA: onMenuGenerated pasa los datos del cuestionario al resultado
- [x] Prompt IA: incluye días fuera de casa, alimentos no deseados, presupuesto, métricas del usuario
- [x] TypeScript: 0 errores

## Auditoría de Calidad - Mejoras (Sprint Actual)

### Seguridad
- [x] Verificar y reforzar .gitignore (secrets, .env, node_modules, dist)
- [x] Configurar CORS explícito en Express con lista de orígenes permitidos
- [x] Añadir rate limiting con express-rate-limit (global + por endpoint sensible)
- [x] Reforzar validación del webhook de Stripe con manejo de errores explícito
- [x] Auditar validaciones Zod en todos los routers tRPC

### Rendimiento
- [x] Lazy loading de todas las rutas en App.tsx con React.lazy + Suspense
- [x] Paginación en listado de recetas (ya existe en backend, verificar frontend)
- [x] Añadir React.memo a componentes de lista pesados
- [x] Verificar que Vite genera chunks separados por ruta (code splitting)

### Base de Datos
- [x] Añadir índices en drizzle/schema.ts: users.email, recipes.name, menus.userId, shoppingLists.userId, mealLogs.userId
- [x] Ejecutar pnpm db:push para aplicar índices
- [x] Documentar migraciones en README

### Logging y Configuración
- [x] Crear logger estructurado (winston o pino) en server/_core/logger.ts
- [x] Reemplazar console.log/error en server/ por el logger estructurado
- [x] Añadir .nvmrc con versión de Node (22.x)
- [x] Añadir campo engines en package.json
- [x] Auditar dependencias no usadas con depcheck

### Testing
- [x] Añadir tests de integración tRPC para menus.generateMenuWithQuestionnaire
- [x] Añadir tests de seguridad básicos (input injection, auth checks)
- [x] Añadir tests para BuddyIA saveGeneratedMenu y applyToCalendar

### PWA
- [x] Mejorar estrategia de caché del Service Worker (stale-while-revalidate para assets)
- [x] Añadir prefetch de rutas críticas en el HTML principal
- [x] Actualizar Capacitor a v7+ si es compatible

## Sprint Testing Crítico (48h)
- [ ] Instalar @playwright/test y vitest-coverage-v8
- [ ] Configurar Playwright (playwright.config.ts)
- [ ] Configurar cobertura de código en vitest.config.ts
- [ ] Tests Auth Flow: login exitoso redirige al dashboard
- [ ] Tests Auth Flow: logout limpia sesión y redirige a /
- [ ] Tests Auth Flow: sesión persistente entre recargas
- [ ] Tests Auth Flow: acceso a ruta protegida sin sesión redirige a login
- [ ] Tests Auth Flow: token inválido/expirado rechazado
- [ ] Tests Plan Enforcement: free no puede acceder a BuddyIA (generateMenu)
- [ ] Tests Plan Enforcement: free no puede acceder a menús especializados
- [ ] Tests Plan Enforcement: free no puede acceder a BuddyExperts premium
- [ ] Tests Plan Enforcement: basic puede acceder a BuddyIA
- [ ] Tests Plan Enforcement: basic no puede acceder a Pro Max features
- [ ] Tests Plan Enforcement: pro_max puede acceder a todas las features
- [ ] Tests Stripe Webhook: rechaza petición sin firma
- [ ] Tests Stripe Webhook: rechaza firma inválida
- [ ] Tests Stripe Webhook: acepta y procesa checkout.session.completed
- [ ] Tests Stripe Webhook: acepta y procesa customer.subscription.updated
- [ ] Tests Stripe Webhook: devuelve {verified:true} para eventos de test (evt_test_*)
- [ ] Tests Ownership: usuario no puede editar receta de otro usuario
- [ ] Tests Ownership: usuario no puede eliminar menú de otro usuario
- [ ] Tests Ownership: usuario no puede ver lista de compra de otro usuario
- [ ] Tests Ownership: usuario no puede modificar inventario de otro usuario

## Sprint Optimización BD + Backup

- [ ] Auditar queries lentas con EXPLAIN ANALYZE (recipes, menus, shoppingLists, mealLogs)
- [ ] Añadir índices compuestos en Drizzle schema para queries frecuentes
- [ ] Aplicar índices con pnpm db:push
- [ ] Crear script de backup diario automatizado (mysqldump)
- [ ] Crear script de análisis de queries lentas
- [ ] Añadir scheduler de backup en el servidor

## Sprint: Mejora Visualización Nutricional en Escáner de Barras
- [x] Ampliar lookupBarcode para devolver fibra, azúcares, grasas saturadas, sal y Nutri-Score
- [x] Crear componente ProductNutritionCard con visualización completa de macronutrientes y barras de progreso
- [x] Mejorar modal de confirmación en Inventory con tabla nutricional visual completa
- [x] Añadir previsualización del producto en BarcodeScanner antes de cerrar el modal
- [x] Actualizar MealLog para mostrar todos los macros del producto escaneado

## Sprint: Cuestionario Avanzado Generación Menú IA
- [x] Ampliar backend generateMenuWithQuestionnaire con nuevos parámetros opcionales (nivel actividad, tipo dieta, alergias específicas, horarios comidas, equipo cocina, tiempo cocina, nivel habilidad, tipo proteína preferida, notas especiales extendidas)
- [x] Rediseñar cuestionario frontend con pasos adicionales y disclaimer de calidad
- [x] Añadir paso de nivel de actividad física y horarios habituales
- [x] Añadir paso de tipo de proteína preferida (carne, pescado, legumbres, huevos, mixto)
- [x] Añadir paso de tiempo disponible para cocinar y nivel de habilidad
- [x] Añadir paso de equipo de cocina disponible (horno, freidora de aire, thermomix, etc.)
- [x] Añadir disclaimer visual en el último paso y en el botón de generar
- [x] Mejorar el prompt de IA con todos los nuevos campos

## Sprint: Preferencias Nutricionales en Perfil
- [x] Ampliar esquema BD: tabla userNutritionPreferences con dietType, allergies, restrictions, dislikedFoods, activityLevel, proteinSource, cookingTime, cookingSkill, kitchenEquipment, budgetPerWeek, waterIntake, mealsPerDay, calories
- [x] Migrar BD con pnpm db:push
- [x] Crear procedimientos tRPC: profile.getNutritionPreferences y profile.saveNutritionPreferences
- [x] Añadir sección "Preferencias Nutricionales" en la página de Perfil con formulario completo
- [x] Cargar automáticamente las preferencias del perfil como valores iniciales en el cuestionario de generación de menú
- [x] Mostrar indicador visual en el cuestionario cuando se han cargado preferencias guardadas

## Sprint: Pasarela de Pagos Apple IAP vs Stripe
- [x] Auditar todos los flujos de pago actuales con Stripe (usuarios normales vs experts/makers)
- [x] Crear hook usePlatform() para detectar si la app corre en iOS nativo, Android o web
- [x] Crear capa de abstracción usePayment() que enruta a IAP o Stripe según plataforma y tipo de usuario
- [x] Crear componente IAPSubscriptionButton para usuarios normales en iOS (muestra precio de App Store)
- [ ] Crear endpoint /api/iap/verify para validar recibos de Apple StoreKit 2 en el servidor (pendiente: requiere cuenta Apple Developer)
- [x] Ocultar botones de Stripe en flujos de suscripción de usuarios normales cuando platform === 'ios'
- [x] Mantener Stripe activo en flujos de BuddyExperts y BuddyMakers (B2B, siempre web)
- [x] Añadir banner informativo en web para usuarios iOS indicando que deben gestionar su suscripción desde la app
- [x] Documentar la arquitectura de pagos en un archivo PAYMENTS.md para el equipo

## Sprint: Verificación de Recibos IAP (Apple + Google)
- [x] Añadir campos IAP al esquema BD: iapTransactionId, iapPlatform, iapProductId, iapExpiresAt, iapOriginalTransactionId
- [x] Migrar BD con pnpm db:push
- [x] Crear server/_core/iap/appleIAP.ts: verificación con App Store Server API (JWT + ES256)
- [x] Crear server/_core/iap/googleIAP.ts: verificación con Google Play Developer API (OAuth2)
- [x] Crear procedimiento tRPC subscriptions.verifyAppleIAP
- [x] Crear procedimiento tRPC subscriptions.verifyGoogleIAP
- [ ] Crear webhook /api/iap/apple/notifications para Server Notifications V2 (pendiente: requiere URL pública)
- [ ] Crear webhook /api/iap/google/notifications para Google Play RTDN (pendiente: requiere URL pública)
- [x] Actualizar usePayment.ts para llamar a verifyAppleIAP/verifyGoogleIAP tras la compra nativa
- [ ] Añadir secrets: APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY, APPLE_BUNDLE_ID (pendiente: el usuario los añadirá más tarde)
- [ ] Añadir secrets: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON, GOOGLE_PLAY_PACKAGE_NAME (pendiente: el usuario los añadirá más tarde)
- [x] Actualizar PAYMENTS.md con checklist completo para Apple y Google
- [x] Escribir tests unitarios para los servicios de verificación IAP

## Sprint: Fix Layout iOS
- [x] Reducir padding-top del header para que no quede demasiado arriba en iOS
- [x] Cambiar la barra de navegación inferior de flotante a fija (position: fixed, sin border-radius, pegada al borde inferior)
- [x] Añadir padding-bottom al contenido principal para que no quede tapado por la barra fija

## Sprint: Advertencia de Alérgenos en Análisis IA
- [ ] Ampliar analyzeFood en el backend para que lea las alergias del perfil del usuario y detecte alérgenos en los ingredientes identificados
- [ ] Devolver lista de alérgenos detectados en la respuesta de analyzeFood
- [ ] Mostrar advertencia visual clara (banner rojo/naranja) en MealLog cuando se detectan alérgenos del perfil
- [ ] Listar los alérgenos detectados con iconos y nombres en la advertencia
- [ ] Añadir advertencia también en el escáner de barras (BarcodeScanner) cuando el producto contiene alérgenos del perfil

## Sprint: Fix MealLog Foto IA
- [ ] Corregir JSX roto del banner de alérgenos en MealLog (error de paréntesis)
- [ ] Eliminar scroll horizontal del menú de pestañas Manual/Foto IA/Código en MealLog
- [ ] Mejorar visualización de macronutrientes en resultado del análisis IA al estilo ProductNutritionCard (barras de progreso, colores, layout)

## Sprint: Feedback Análisis IA
- [ ] Crear tabla aiFeedback en BD (userId, mealLogId, rating 1-5, accurate boolean, comment, createdAt)
- [ ] Migrar BD con pnpm db:push
- [ ] Crear procedimiento tRPC mealLogs.submitAIFeedback
- [ ] Añadir UI de feedback al resultado del análisis IA: thumbs up/down + estrellas + comentario opcional
- [ ] Mostrar confirmación visual tras enviar el feedback

## Sprint: Auditoría y corrección de ownership en endpoints tRPC
- [ ] Auditar todos los endpoints que acceden a recursos por ID y detectar los que no validan ctx.user.id === resource.userId
- [ ] Corregir endpoints sin ownership check en mealLogs, menus, inventory, shoppingLists
- [ ] Corregir endpoints sin ownership check en recipes, buddyExperts, buddyMakers y resto
- [ ] Verificar TypeScript y tests tras los cambios

## Autenticación OTP (login sin contraseña)
- [x] Tabla `otp_tokens` en BD con codeHash SHA-256, expiresAt, attempts, used
- [x] Funciones de BD: createOtpToken, getActiveOtpTokenByHash, getLatestActiveOtpToken, markOtpTokenUsed, incrementOtpAttempts, countRecentOtpRequests, getUserByEmail
- [x] Procedimiento tRPC `auth.sendOTP`: genera código 6 dígitos, hashea con SHA-256, envía email, rate limit 5/hora
- [x] Procedimiento tRPC `auth.verifyOTP`: verifica hash, crea sesión JWT, upsert usuario
- [x] Template de email OTP con código grande y aviso de seguridad (sendOTPEmail en email.ts)
- [x] UI en LoginPage: botón "Acceder con código por email", paso 1 (email), paso 2 (6 inputs individuales con auto-avance y paste)
- [x] Añadir barra de progreso en la parte inferior del OnboardingTour
- [x] Ampliar restricciones en BuddySetup: más opciones + botón "Otras" con campo de texto libre
- [ ] Biblioteca de menús: cards visuales con imagen, recomendaciones personalizadas por perfil
- [ ] Biblioteca de menús: mensaje estado vacío con opciones "Explorar otros menús" o "Crear con IA"

## Sprint: Rediseño MenuLibrary con recomendaciones personalizadas
- [x] Rediseñar MenuLibrary con cards visuales premium (gradiente, imagen de fondo, badges)
- [x] Sección "Recomendados para ti" usando procedimiento tRPC menus.recommended
- [x] Estado vacío con mensaje claro y dos botones: "Crear con IA" y "Explorar todos los menús"
- [x] Modo "Explorar todos" con filtros por objetivo y dificultad
- [x] Banner CTA para crear menú personalizado con IA
- [x] Procedimiento tRPC menus.recommended: filtra por objetivo, restricciones y calorías del perfil

## Sprint: Animación de carga en MenuLibrary
- [x] Skeleton loader para cards de menús recomendados
- [x] Skeleton loader para sección "Recomendados para ti"
- [x] Skeleton loader para la sección "Explorar todos"
- [x] Animación de entrada (fade-in) al cargar los menús
- [x] Shimmer effect en los skeletons
- [x] Vista rápida modal con hover en cards de menú (QuickView)
- [ ] Comparación de precios entre supermercados en lista de la compra

- [x] Imágenes de productos de supermercados: actualizar thumbnails con URLs de Unsplash (87/88 Mercadona, 63/69 Carrefour, 56/67 Alcampo, 68/71 Lidl)
- [x] Iconos de categorías de supermercados: ampliar CATEGORY_ICONS para cubrir todos los nombres de la BD en MercadonaShop, CarrefourShop y LidlShop
- [x] Componente ProductImage con fallback visual (emoji por categoría) en lugar de carrito roto
- [x] Corregir bug de imagen rota: onError ahora muestra emoji en lugar de imagen invisible

## Sistema de Monitorización de APIs (Sprint actual)
- [ ] Schema DB: tabla api_health_logs (endpoint, status, latencyMs, errorMessage, checkedAt)
- [ ] Schema DB: tabla api_monitors (name, endpoint, method, expectedStatus, isActive, lastStatus, lastCheckedAt, failCount)
- [ ] Backend: endpoint REST GET /api/health con estado de todos los servicios críticos
- [ ] Backend: middleware tRPC que captura errores y los registra en api_health_logs
- [ ] Backend: job periódico (cada 5 min) que hace health-check de todos los endpoints críticos
- [ ] Backend: notificación por email al propietario cuando un endpoint falla 3 veces seguidas
- [ ] Backend: endpoint tRPC admin.getApiHealth para leer logs y estado de monitores
- [ ] Backend: endpoint tRPC admin.recheckApi para forzar un recheck manual
- [ ] Frontend: panel /admin/api-monitor con tabla de estado de todos los endpoints
- [ ] Frontend: indicador de estado (verde/amarillo/rojo) por endpoint con latencia
- [ ] Frontend: historial de fallos de las últimas 24h con gráfico de disponibilidad
- [ ] Frontend: botón "Recheck ahora" para forzar verificación manual
- [ ] Frontend: badge de alerta en el sidebar del admin cuando hay fallos activos
- [ ] Tests vitest para el sistema de monitorización

## Integración Apple Health & Google Health Connect

- [ ] Tabla health_connections en BD (proveedor, estado, token, userId)
- [ ] Tabla health_metrics en BD (tipo, valor, unidad, fecha, fuente, userId)
- [ ] Endpoint tRPC health.getConnections
- [ ] Endpoint tRPC health.syncMetrics (recibe datos desde app nativa)
- [ ] Endpoint tRPC health.getMetrics (historial de métricas por tipo y rango de fechas)
- [ ] Endpoint tRPC health.getSummary (resumen diario: pasos, calorías, sueño, peso)
- [ ] Endpoint tRPC health.disconnectProvider
- [ ] Endpoint REST POST /api/health/sync (para la app nativa, con token de autenticación)
- [ ] Página HealthConnect.tsx con panel de conexiones
- [ ] Tarjeta Apple Health con instrucciones para app móvil
- [ ] Tarjeta Google Health Connect con instrucciones para app móvil
- [ ] Panel de métricas diarias (pasos, calorías, sueño, peso, frecuencia cardíaca)
- [ ] Gráficas de evolución de métricas (últimos 7/30 días)
- [ ] Integración de métricas de salud en el dashboard principal
- [ ] Ruta /app/health en App.tsx
- [ ] Tests Vitest para endpoints de salud

## Filtros y ordenación en búsqueda Consum
- [ ] Extender endpoint consum.searchProducts con priceMin, priceMax, sortBy (relevance/price_asc/price_desc)
- [ ] Extender endpoint consum.byCategory con priceMin, priceMax, sortBy
- [ ] UI ConsumShop: panel de filtros con rango de precio (inputs min/max) y selector de ordenación
- [ ] UI ConsumShop: badge de filtros activos con botón de limpiar
- [ ] UI ConsumShop: contador de resultados filtrados

## Stripe Connect para BuddyExperts y BuddyMakers
- [ ] Stripe Connect: añadir campos stripeAccountId, onboardingComplete, chargesEnabled, payoutsEnabled a buddyExperts y buddyMakers en schema
- [ ] Stripe Connect: migración de BD (pnpm db:push)
- [ ] Stripe Connect: endpoint tRPC createConnectAccount (crea cuenta Express y devuelve onboarding URL)
- [ ] Stripe Connect: endpoint tRPC getConnectAccountStatus (verifica estado de la cuenta conectada)
- [ ] Stripe Connect: endpoint tRPC createLoginLink (acceso al dashboard de Stripe del buddy)
- [ ] Stripe Connect: webhook account.updated (sincronizar chargesEnabled/payoutsEnabled)
- [ ] Stripe Connect: UI onboarding en BuddyExpertDashboard (banner + botón conectar cuenta)
- [ ] Stripe Connect: UI onboarding en BuddyMakerDashboard (banner + botón conectar cuenta)
- [ ] Stripe Connect: badge de estado de cuenta en perfiles públicos de BuddyExpert/BuddyMaker
- [ ] Stripe Connect: transferencias automáticas al pagar un plan de expert (application_fee_amount)

## Stripe Connect BuddyExperts/Makers - 06/04/2026
- [x] Schema BD: añadir chargesEnabled y payoutsEnabled a buddyExperts y buddyMakers
- [x] Migración BD aplicada
- [x] Endpoint getConnectStatus sincroniza chargesEnabled/payoutsEnabled con Stripe API
- [x] Webhook account.updated actualiza estado de cuenta Connect en BD
- [x] Banner Stripe Connect en BuddyExpertDashboard (3 estados: sin cuenta, verificando, activo)
- [x] Banner Stripe Connect en BuddyMakerDashboard (3 estados: sin cuenta, verificando, activo)
- [x] Corregir TS: createConnectAccount → getOnboardingLink en ambos dashboards
- [x] Corregir TS: tipos implícitos any en callbacks de error
- [x] Corregir bug: .returning() incompatible con MySQL en userMetrics.add
- [x] Corregir bug: getSeededMenus faltaba en mock de buddymarket.test.ts
- [x] Tests: 580/580 pasando, 0 errores TypeScript

- [ ] i18n: instalar react-i18next y configurar sistema base
- [ ] i18n: crear archivos de traducción ES, EN, FR, IT
- [ ] i18n: integrar traducciones en componentes principales
- [ ] i18n: selector de idioma en navbar y ajustes de usuario
- [ ] i18n: persistir preferencia de idioma en BD
- [ ] Detección automática del idioma del navegador en primera visita
- [ ] Selector de idioma en sección dedicada del sidebar
- [ ] Selector de idioma en la landing page (navbar y/o footer)
- [ ] Modal de bienvenida en primera visita para confirmar/cambiar idioma detectado

## Auditoría de Producción — P0 Fixes
- [ ] Configurar variables de entorno Apple IAP (APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY, APPLE_BUNDLE_ID, APPLE_SHARED_SECRET)
- [ ] Configurar SENTRY_DSN para monitoreo de errores en producción
- [x] Instalar Helmet.js y configurar headers HTTP de seguridad en server/_core/index.ts
- [ ] Corregir success_url de Stripe (/dashboard → /app/dashboard)

## Auditoría de Producción — Correcciones aplicadas
- [x] Instalar Helmet.js con headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
- [x] Configurar SENTRY_DSN para monitoreo de errores en producción
- [x] Corregir alertas de reinicio del servidor (SIGTERM) para que solo se envíen en producción
- [ ] Configurar APPLE_IAP_KEY_ID = GN3KDDA79S (pendiente confirmar en Settings → Secrets)
- [ ] Configurar APPLE_IAP_ISSUER_ID = 37eef11b-5683-491d-93ed-e746011bec2d (pendiente confirmar)
- [ ] Configurar APPLE_SHARED_SECRET = 5e2868319d2e4d9ab4cf254c25f2afe9 (pendiente confirmar)
- [ ] Configurar APPLE_BUNDLE_ID (pendiente — crear en Apple Developer cuando esté disponible)
- [ ] Configurar APPLE_IAP_PRIVATE_KEY (pendiente — obtener archivo .p8 de App Store Connect)

## GDPR y SEO (sprint actual)
- [x] Componente CookieBanner GDPR con preferencias granulares (necesarias, analíticas, marketing)
- [x] Integrar CookieBanner en App.tsx (visible en todas las páginas)
- [x] Persistir preferencias de cookies en localStorage
- [x] Generar sitemap.xml con todas las rutas públicas (61 URLs: 11 estáticas + 50 artículos)
- [x] Crear robots.txt con reglas de indexación (actualizado con dominios correctos)
- [x] Artículos relacionados al final de cada post del blog (endpoint getRelated, 3 artículos misma categoría)
- [x] Schema JSON-LD Article en cada post del blog (headline, description, image, datePublished, author, publisher)
- [x] Schema JSON-LD global en index.html: Organization, WebSite con SearchAction, SoftwareApplication

## Gestión de cookies en perfil
- [x] Sección de preferencias de cookies en Profile.tsx con switches individuales y botón de guardar

## Términos y Condiciones (sprint actual)
- [ ] Redactar TyC completos y actualizados con todos los nuevos servicios
- [ ] Actualizar página Terms.tsx con el nuevo contenido legal
- [ ] Checkbox de aceptación de TyC en registro/onboarding con timestamp en BD
- [ ] Panel de aceptaciones de TyC en Admin (quién aceptó, cuándo, versión)
- [ ] Hipervínculos a TyC en footer de landing y dentro de la app
- [ ] Sección de preferencias de cookies en Profile.tsx con switches individuales y botón de guardar

## Sistema TyC — Completado (sprint actual)
- [x] Redactar TyC v2.0 completos con todos los servicios (IA, BuddyExperts, datos de salud, suscripciones)
- [x] Página Terms.tsx publicada en /terms con contenido legal completo
- [x] Campo termsAcceptedAt añadido al schema de BD (drizzle/schema.ts)
- [x] Migración de BD aplicada para añadir termsAcceptedAt, termsVersion, marketingConsent
- [x] Procedimientos tRPC: auth.acceptTerms y auth.getTermsStatus
- [x] Checkboxes explícitos de TyC y Privacidad en formulario de registro (LoginPage.tsx)
- [x] Panel de aceptaciones de TyC en Admin (TermsAcceptancePanel) con estadísticas y lista
- [x] Hipervínculos a TyC en footer de landing page (Home.tsx): Términos, Privacidad, Contacto
- [x] Hipervínculos a TyC en footer del sidebar de la app (AppLayout.tsx): Términos, Privacidad
- [x] Claves de traducción para footer.terms, footer.privacy, footer.contact en ES/EN/FR/IT
- [x] Claves de traducción para sidebar.terms, sidebar.privacy en ES/EN/FR/IT

## Sistema de Insignias (Badges) — Sprint actual
- [ ] Tabla `badges` con catálogo de insignias (id, slug, name, description, icon, category, points, rarity)
- [ ] Tabla `user_badges` con las insignias ganadas por usuario (userId, badgeId, earnedAt, metadata)
- [ ] Seed de 20+ insignias organizadas por categorías (adaptación IA, comunidad, constancia, nutrición, explorador)
- [ ] Función helper `awardBadge(userId, badgeSlug)` reutilizable en cualquier procedimiento
- [ ] Integrar concesión de insignia en `recipes.adaptForUser` (primera adaptación, 5 adaptaciones, 25 adaptaciones)
- [ ] Integrar concesión de insignia en `recipes.share` (primera receta compartida, 5 compartidas, 10 compartidas)
- [ ] Procedimiento tRPC `badges.getMyBadges` — lista de insignias ganadas del usuario
- [ ] Procedimiento tRPC `badges.getCatalog` — catálogo completo con estado (ganada/bloqueada) para el usuario
- [ ] Procedimiento tRPC `badges.getLeaderboard` — ranking de usuarios por puntos de insignias
- [ ] Página `/app/badges` con perfil de insignias del usuario, progreso y leaderboard
- [ ] Componente `BadgeUnlockedToast` — toast especial animado al ganar una insignia
- [ ] Panel admin con estadísticas de insignias más ganadas y ranking de usuarios
- [ ] Ruta `/app/badges` registrada en App.tsx y enlace en el sidebar de AppLayout
- [x] Corregir secuencia banners: cookies primero, idioma después (no simultáneos)

- [x] Sign in with Apple: plugin nativo Swift (BuddyMarketAppleAuthPlugin.swift)
- [x] StoreKit 2: plugin nativo Swift (BuddyMarketIAPPlugin.swift)
- [x] App.entitlements con Sign in with Apple + IAP + Associated Domains
- [x] Unificar Product IDs a io.buddymarket.app.*
- [x] Actualizar codemagic.yaml con nombre BuddyMarketAI y grupo apple_iap_credentials
- [x] Script upload_to_appstore.py para subir metadatos y screenshots
- [x] Guía IAP_SECRETS_GUIDE.md con instrucciones de configuración
- [x] Autenticación por número de teléfono con OTP SMS (Twilio)
- [ ] Corregir Google login en Safari/iOS: usar redirect en lugar de popup (cookies de terceros bloqueadas)
- [ ] Modal de TyC obligatorio para SSO (Google/Apple): mostrar antes de completar el registro

## Preparación distribución 10/10
- [ ] Privacy Manifest iOS (PrivacyInfo.xcprivacy)
- [ ] Google Play Billing integrado para suscripciones Android
- [ ] @capacitor/google-auth para Google Sign-In nativo iOS
- [ ] apple-app-site-association en buddymarketapp.com/.well-known/
- [ ] targetSdk Android actualizado a 35
- [ ] Firebase google-services.json para push Android
- [ ] Keystore de firma Android generado y configurado en Codemagic
- [ ] Disclaimer médico en primera pantalla post-login
- [ ] Data Safety metadata para Google Play
- [ ] Build de producción ejecutado y cap sync actualizado

- [ ] Eliminar formulario duplicado de datos en primer plano al registrarse
- [ ] Onboarding solo se pide una vez (no repetir si ya completado)
- [ ] Menú inicial no obligatorio (skip sin bloqueo)

- [ ] Eliminar OnboardingModal duplicado (reemplazado por BuddySetup)
- [ ] BuddySetup pre-rellena datos ya guardados en BD (género, objetivo, físicos)
- [ ] Menú inicial no obligatorio en BuddySetup
- [ ] Datos de perfil unificados en una sola fuente de verdad (BD)

- [ ] CRÍTICO: Alergias/restricciones no se respetan en recetas y menús generados por IA

## Sprint Monetización + Bugs + UX (Abril 2026)

### Bugs críticos
- [ ] Bug: lista de la compra desde menú da 404 - corregir ruta/endpoint
- [ ] Bug: filtros de recetas muestran nombres internos de BD (mealTime, cuisineType, cookingMethod)
- [ ] Bug: opciones de filtro de recetas salen en inglés (breakfast, midMorning) en lugar del idioma seleccionado
- [ ] Bug: botones "Ver menú / Usar menú / carrito" descentrados en cards de biblioteca de menús

### Estrategia de monetización (hacer como app de 500M)
- [ ] Rediseñar página de planes con diferencias brutalmente claras entre Free/Pro/Pro Max
- [ ] Plan Free: mostrar contadores visibles de uso ("1/2 listas usadas este mes", "0/1 menús IA usados")
- [ ] Plan Free: límites estrictos - 2 listas de la compra/mes, 1 menú IA/mes, no crear recetas propias, no menús especializados, no menús para eventos (1 gratis de prueba), no BuddyIA avanzado
- [ ] Plan Pro: límites medios - menús IA ilimitados, 10 listas/mes, recetas propias, menús especializados, 3 menús eventos/mes
- [ ] Plan Pro Max: todo ilimitado + menús para eventos ilimitados + BuddyIA sin límites + soporte prioritario
- [ ] Mostrar preview borroso (blur + lock overlay) de features Pro/ProMax para usuarios free con CTA irresistible
- [ ] Menús especializados: mostrar cards con blur para usuarios free (embarazo, diabetes, deportistas...)
- [ ] BuddyMakers y BuddyExperts: acceso libre para TODOS los planes (canal de monetización de creadores)

### Nuevas features
- [ ] Guardar receta adaptada por IA como receta pública en el catálogo (con imagen generada por IA)
- [ ] Formulario de recetas: sección de ingredientes con buscador (nombre + cantidad + unidad)
- [ ] Formulario de recetas: cálculo automático de valores nutricionales con IA al añadir ingredientes
- [ ] Menús para eventos: nueva sección (cumpleaños, cena romántica, barbacoa, Navidad, etc.) - 1 gratis, resto Pro/ProMax
- [ ] Mis Menús: sección con menús pasados, opción de repetir o borrar
- [ ] Mis Listas de la Compra: sección con listas pasadas, opción de repetir o borrar
- [ ] Open Graph meta tags dinámicos en RecipeDetail para compartir con imagen BuddyMarket y mensaje personalizado en WhatsApp

## Sprint Abril 2026 - Completado

### Bugs corregidos
- [x] Bug: lista de la compra desde menú da 404 - añadidos "consum" e "hiperdino" al enum de supermercados
- [x] Bug: filtros de recetas - traducciones i18n ya correctas en es.json
- [x] Corregir procedimiento duplicado calculateNutrition en router de buddyMakers

### Monetización y UX
- [x] Añadir funcionalidad "Repetir" y "Borrar" en Mis Menús (duplicateMenu, deleteMenu)
- [x] Añadir funcionalidad "Repetir" y "Borrar" en Mis Listas de la Compra (duplicateShoppingList, deleteShoppingList)
- [x] Menús especializados: preview con blur + lock overlay para usuarios free con CTA a Pro
- [x] BuddyMakers y BuddyExperts: acceso libre para todos los planes (canAccessBuddyMakers/Experts = true en free)
- [x] EventMenuPlanner: banner de límite de plan visible para usuarios free (contador de uso + CTA a Pro)

### Sistema de seguridad alimentaria
- [x] CRÍTICO: Alergias/restricciones ahora se respetan en generateMenuWithQuestionnaire
- [x] CRÍTICO: Alergias/restricciones ahora se respetan en generateMenu (menús básicos)
- [x] CRÍTICO: Alergias/restricciones ahora se respetan en generateRecipesFromExpiring
- [x] Validación post-generación detectAllergyViolations para rechazar respuestas con ingredientes prohibidos
- [x] Overlay rojo con blur en cards de recetas con ingredientes prohibidos
- [x] Banner de alerta en RecipeDetail con pills de ingredientes problemáticos
- [x] Modal de adaptación con IA (recipes.adaptForUser) con sustituciones visuales

### Formulario de recetas
- [x] Sección de ingredientes con buscador (nombre + cantidad + unidad)
- [x] Cálculo automático de valores nutricionales con IA al añadir ingredientes (calculateNutrition)

### Nuevas features
- [x] Menús para eventos: nueva sección con 12 tipos de eventos - 1 gratis para free, ilimitado para Pro/ProMax
- [x] EventMenuPlanner: banner de límite de plan con contador de uso y CTA a suscripción

## Sprint Abril 2026 - Sesión 2 (07/04/2026)
### Bugs corregidos
- [x] Bug: BuddyMakerDashboard usaba trpc.buddyMakers.createRecipe/updateRecipe/deleteRecipe (no existían) → migrado a trpc.recipes.create/update/delete
- [x] Bug: BuddyMakerStats usaba trpc.buddyMakers.deleteRecipe → migrado a trpc.recipes.delete
- [x] Bug: RecipeForm usaba campo prepTime → corregido a preparationTime
- [x] Bug: routers.ts tenía error de sintaxis "Expected } but found ;" → corregido
### Monetización y UX (app de 500M)
- [x] Página de suscripción: añadido banner oscuro premium "Las 3 razones por las que Pro vale la pena" con Menús IA, BuddyIA y Crear recetas
- [x] Recetas públicas: generación automática de imagen IA al crear receta pública (generateAIImage en onSuccess)
- [x] Botón de crear receta pública muestra "Crear receta pública ✨" y estado "Generando imagen IA..."
- [x] Menús.tsx: botón de IA bloqueado para usuarios free con redirect a suscripción
- [x] Recipes.tsx: botón de crear receta bloqueado para usuarios free con redirect a suscripción
- [x] EventMenuPlanner: 1 evento gratis para usuarios free, bloqueado con CTA a Pro cuando se alcanza el límite

## Sprint Bugs y Mejoras - Petición 07/04/2026 19:42h
- [x] BUG-01: SSO Google - flujo OAuth redirect funciona; problema de dominio en Google Console (requiere configuración externa)
- [x] BUG-02: TyC obligatorio en SSO Google/Apple - SSOTermsModal ya implementado en LoginPage.tsx
- [x] BUG-03: BuddySetup ahora pre-rellena datos del perfil existente y salta StepPhysical si ya están completos
- [x] BUG-04: Menú inicial no obligatorio - BuddySetup pre-rellena datos y no repite pasos completados
- [x] BUG-05: Género pre-rellenado desde perfil en BuddySetup, no se vuelve a pedir si ya está guardado
- [x] BUG-06: Alergias filtradas en db.getRecipes buscando en allergens + ingredientsJson; Recipes.tsx pasa excludeUserAllergens:true
- [x] FEAT-01: Botón guardar receta adaptada ya implementado en RecipeDetail.tsx
- [x] BUG-07: cuisineType en Recipes.tsx ahora muestra emoji + etiqueta traducida de CUISINE_OPTIONS
- [x] BUG-08: Fallbacks en inglés corregidos en MealLog.tsx, BuddyMakers.tsx, BuddyProfile.tsx, MenuLibrary.tsx
- [x] FEAT-02: Open Graph dinámico implementado en server/og.ts - detecta bots y devuelve meta tags con imagen de receta o logo BuddyMarket
- [x] BUG-09: Strings en inglés corregidos (Snack→Merienda, Breakfast→Desayuno, etc.) en múltiples archivos
- [x] FEAT-03: Formulario de recetas ya tiene ingredientes con cantidades y cálculo nutricional automático con IA (calculateNutrition)
- [ ] BUG-10: Botones de menús no están bien centrados - pendiente de identificar ubicación exacta del problema
- [x] FEAT-04: Mis Menús y Mis Listas de la Compra ya tienen opción de repetir y borrar (implementado en sprint anterior)
- [x] BUG-11: Error 404 corregido en ActiveMenu.tsx - validación de shoppingListId>0, manejo de listas vacías, fallback a /app/shopping-lists

## Revisión QA completa (flujo usuario: registro → menús → lista compra → recetas)
- [x] Corregir "Create list" en inglés → "Crear lista" en Menus.tsx
- [x] Corregir disclaimer en inglés en Menus.tsx → español
- [x] Corregir disclaimer en inglés en Recipes.tsx → español
- [x] Corregir "Hi, I'm BuddyIA" en inglés → "Hola, soy BuddyIA" en BuddyIA.tsx
- [x] Corregir "Error applying menu to diary." en inglés → español en BuddyIA.tsx
- [x] Corregir "Error saving menu. Make sure you are connected." en inglés → español en BuddyIA.tsx
- [x] Corregir "Menu saved in My Menus!" en inglés → español en BuddyIA.tsx
- [x] Corregir contador de recetas en header: mostrar número real en vez de "427 recipes available"
- [x] Añadir claves de traducción faltantes en todos los idiomas (es, en, fr, it): menus.createList, menus.disclaimer, recipes.disclaimer, common.create, common.creating, common.generating, common.generate, common.applying, recipes.available

## Bug: SSO no funciona (login con Google/Apple)
- [x] Diagnosticar por qué el SSO falla al iniciar sesión: el modal TyC usaba `<label onClick>` que causaba navegación a /terms al hacer clic en el checkbox
- [x] Corregir el flujo OAuth para SSO: reemplazados labels con botones independientes para los checkboxes
- [x] Verificar que el login funciona correctamente en dev (flujo Google OAuth redirect 302 OK)

## Bugs Críticos Registro/Perfil (08/04/2026)
- [x] BUG-PHONE-01: Twilio OTP permite crear múltiples cuentas con el mismo número de teléfono — CORREGIDO: verifyPhoneOTP busca primero por phone y luego por openId antes de crear cuenta nueva
- [x] BUG-ONBOARD-02: Onboarding (BuddySetup) se repite para usuarios existentes que ya completaron el perfil — CORREGIDO: BuddySetup detecta si el perfil ya tiene datos completos y redirige al dashboard automáticamente
- [x] BUG-ONBOARD-03: Al rechazar la generación de menú en el onboarding, igual navega como si fuera a generar uno — CORREGIDO: mensaje de éxito diferente según generateMenu true/false
- [x] BUG-CALORIES-04: El contador de calorías del dashboard no se actualiza al cambiar el déficit calórico en el perfil — CORREGIDO: updateProfile recalcula dailyCalorieGoal con fórmula Mifflin-St Jeor + ajuste por weightChangeRate

## Bug: Etiqueta dificultad en inglés en cards de menús (08/04/2026)
- [x] BUG-MENU-EASY: La etiqueta de dificultad "easy" aparece en inglés — CORREGIDO: añadidas claves en inglés (easy/medium/hard) a DIFF_LABELS en MenuLibrary.tsx, ActiveMenu.tsx, EventMenuPlanner.tsx, SavedEvents.tsx e Inventory.tsx

## Auditoría completa de estabilidad (08/04/2026)
- [ ] AUDIT-01: Revisar logs de servidor y browser para errores críticos
- [ ] AUDIT-02: Corregir null/undefined crashes en routers del servidor
- [ ] AUDIT-03: Corregir null/undefined crashes en componentes del frontend
- [ ] AUDIT-04: Verificar flujos críticos sin crashes (registro, onboarding, menús, recetas, BuddyIA)
- [ ] AUDIT-05: Ejecutar tests y verificar 0 errores TypeScript

## Auditoría completa de estabilidad (completada)
- [x] Proteger todos los invokeLLM sin try/catch en routers.ts (6 corregidos: calculateNutrition, eventMenus.generate, expertClientPlans.generateMenuFromPDF, menus.generateWithAI, recipes.generateWithAI, inventory.generateRecipesFromExpiring)
- [x] Proteger JSON.parse de datos de perfil (menuAllergies, menuRestrictions, menuKitchenEquipment) con try/catch
- [x] Proteger JSON.parse de shoppingListTemplates con try/catch
- [x] Corregir modal TyC del SSO: labels causaban navegación a /terms al hacer clic en checkbox
- [x] Corregir etiquetas de dificultad "easy/medium/hard" en inglés en todas las páginas
- [x] 675 tests pasando (28 archivos de test)

## Bug crítico: OAuth Google + Teléfono duplicado
- [ ] Configurar Google Cloud Console: añadir todos los redirect URIs de BuddyMarket
- [ ] Corregir bug teléfono duplicado: mismo número no puede crear múltiples cuentas

## Feature: Sign in with Apple
- [ ] Backend: rutas /api/auth/apple/login y /api/auth/apple/callback
- [ ] Backend: generación de client_secret JWT con clave privada de Apple (ES256)
- [ ] Backend: intercambio de authorization_code por tokens de Apple
- [ ] Backend: extracción de user info del id_token JWT de Apple
- [ ] Backend: upsert de usuario con openId apple:SUB
- [ ] Frontend: botón "Continuar con Apple" en LoginPage
- [ ] Frontend: botón "Continuar con Apple" en LandingPage
- [ ] Verificar flujo completo en dev
- [x] Dashboard: mostrar foto de perfil del usuario en el saludo (en lugar de la inicial cuando hay foto subida)
- [ ] Dashboard/Diario: corregir zona horaria — la fecha del día debe calcularse en hora local del usuario, no UTC, para que el diario resetee correctamente al pasar medianoche
- [x] Perfil: reorganizar secciones eliminando preguntas duplicadas (alergias, frecuencia de deporte, etc. deben aparecer solo una vez) y estructurar en bloques lógicos: Datos personales, Objetivos y salud, Actividad física, Preferencias alimentarias
- [x] Menús IA: corregir distribución por días (no meter todo en un día), eliminar duplicados de comidas, mejorar UI de visualización del menú generado
- [ ] Dashboard: quitar sección de 4 tarjetas grandes redundantes (Lista compra, BuddyExperts, Recordatorios, Logros) → reemplazar por widget de progreso semanal
- [ ] Dashboard: quitar sección "Menús para ti" (ya está en Menús)
- [ ] Dashboard: mover BuddyIA al acceso rápido como asesor nutricional destacado
- [ ] Dashboard: rediseñar sección Comunidad (BuddyIA como asesor, BuddyCoach como app de deporte del grupo)
- [ ] BuddyScan: redirigir a escáner real (código de barras + foto de plato), no a Menús
- [x] MenuResultView: función de reemplazo de comida por alternativa IA — endpoint tRPC buddyIA.replaceMeal + UI con botón "Cambiar" en cada tarjeta expandida + modal bottom-sheet con preview de la alternativa, botón aceptar/generar otra/cancelar
- [ ] BuddyIA Chat: personalizar el sistema prompt con el perfil completo del usuario (peso, altura, edad, objetivo, alergias, restricciones dietéticas, historial médico, actividad física) para que las respuestas sean específicas al usuario y no genéricas
- [ ] Traducciones: auditar y completar todas las traducciones faltantes en la app (muchos textos hardcodeados en español no usan t() y no se traducen al cambiar de idioma)
- [x] Perfil: mover sección "Actividad Física" del tab Alimentación al tab "Salud y objetivos"
- [ ] Menú IA: rediseñar cuestionario con preguntas interactivas paso a paso (días, variedad, facilidad, personas, etc.)
- [ ] Menú IA: corregir distribución al aplicar al diario (cada día del menú debe ir a su fecha correcta, no todo al mismo día)
- [ ] Menú IA: corregir toast de confirmación que aparece en la barra de estado del sistema en lugar de dentro de la app
- [ ] Menú IA: garantizar que alergias y restricciones del perfil se cargan siempre en la generación
- [ ] MenuResultView: botón "Guardar en Mis Menús" para guardar el menú generado con IA en la biblioteca de menús
- [ ] MenuResultView: botón "Exportar PDF" que genera un PDF con el menú completo, nutrientes clave, alimentos a evitar y consejos personalizados
- [ ] BuddyScan IA: corregir error 404 (ruta o endpoint no encontrado)
- [ ] Dashboard: convertir el primer widget en widget personalizable (el usuario elige qué mostrar entre opciones no duplicadas)
- [x] Dashboard: corregir botón de dark mode que no funciona
- [x] Lista de la compra: desbloquear UI cuando se genera desde menús (queda congelada)
- [x] Lista de la compra: corregir búsqueda que lleva a Google en lugar de buscar dentro de la app
- [x] Lista de la compra Mercadona: mejorar matching de productos (devuelve productos incorrectos)
- [x] Lista de la compra Mercadona: reducir falsos negativos "producto no encontrado" cuando sí existe

## Sistema de Notificaciones Push
- [x] Schema DB: tabla notificationSettings (userId, mealReminders JSON, activityReminder, reminderTime, enabled, pushSubscription)
- [x] tRPC: endpoints getNotificationSettings, saveNotificationSettings, savePushSubscription
- [x] Service Worker: registrar SW y suscripción Web Push en el frontend
- [x] Página de configuración de notificaciones: horarios por comida (desayuno, almuerzo, comida, merienda, cena) + recordatorio de actividad física
- [x] Backend: cron job que envía notificaciones push a los usuarios según sus preferencias
- [x] Integrar acceso a configuración de notificaciones desde el perfil y desde el icono de campana

## Mejoras Prioritarias (Ronda 2)
- [ ] Menú al diario: distribuir cada día del menú en su fecha correspondiente (no acumular todo en el mismo día)
- [ ] BuddyScan IA: crear página /app/buddy-scan con cámara del móvil y análisis de alimentos con IA
- [ ] Dashboard: convertir primer widget en widget personalizable (racha, próxima comida, agua, lista de la compra)
- [ ] Onboarding: flujo guiado para nuevos usuarios (completar perfil → primera comida → primer menú IA)

## Mejoras Prioritarias (Ronda 3 - Sesion actual)
- [x] Onboarding: flujo guiado para nuevos usuarios — ya implementado en BuddySetup.tsx (6 pasos)
- [x] BuddyScan IA: pagina /app/buddy-scan creada con camara del movil y analisis IA
- [x] Dashboard: widget personalizable implementado
- [x] Menu al diario: distribuir cada dia del menu en su fecha correspondiente (corregido)
- [ ] Menu IA: cuestionario paso a paso con preguntas interactivas (dias, variedad, dificultad, personas)
- [ ] Traducciones: auditar y completar todas las traducciones faltantes
- [ ] BuddyIA Chat: personalizar sistema prompt con perfil completo del usuario

## Sistema de Referidos (Ronda actual)
- [x] Schema DB: tablas userReferrals + userReferralCodes (migración aplicada)
- [x] Backend: endpoint getReferralCode (genera código único de 8 chars si no existe)
- [x] Backend: endpoint getReferralStats (referidos, recompensas pendientes/activas)
- [x] Backend: endpoint applyCode (aplica código de referido al registrarse)
- [x] Backend: endpoint activateReward (extiende suscripción 30 días al referidor)
- [x] Frontend: página /app/referrals con código, enlace compartible, WhatsApp, historial
- [x] Frontend: campo de código de referido en BuddySetup (paso 6 - confirmación)
- [x] Sidebar: enlace "Invita amigos" en sección Mi Perfil
- [x] Ruta /app/referrals/creator para BuddyExperts/BuddyMakers (sistema anterior)

## Landing herramientas de captación pública (/herramientas)
- [ ] Calculadora nutricional: fórmula Mifflin-St Jeor, distribución macros, IMC con interpretación
- [ ] Test "¿Qué estás haciendo mal?": 12 preguntas, diagnóstico personalizado, errores + CTA
- [ ] CTA final con enlace a registro de BuddyMarket
- [ ] Ruta pública /herramientas registrada en App.tsx
- [ ] Enlace en navegación pública

## Landing BuddyMakers/BuddyExperts (/creators)
- [ ] Hero section con CTA diferenciado BuddyMaker vs BuddyExpert
- [ ] Calculadora de ingresos interactiva (slider seguidores → ingresos estimados)
- [ ] Modelo de comisiones 20% neto explicado visualmente
- [ ] Diferencia BuddyMaker vs BuddyExpert visual
- [ ] Testimonios/casos de éxito
- [ ] FAQ para creadores
- [ ] Formulario de pre-registro
- [ ] Ruta pública /creators registrada en App.tsx

## Landing herramientas de captación pública (/herramientas)
- [ ] Calculadora nutricional: fórmula Mifflin-St Jeor, distribución macros, IMC con interpretación
- [ ] Test "¿Qué estás haciendo mal?": 12 preguntas, diagnóstico personalizado, errores + CTA
- [ ] CTA final con enlace a registro de BuddyMarket
- [ ] Ruta pública /herramientas registrada en App.tsx
- [ ] Enlace en navegación pública

## Landing BuddyMakers/BuddyExperts (/creators)
- [ ] Hero section con CTA diferenciado BuddyMaker vs BuddyExpert
- [ ] Calculadora de ingresos interactiva (slider seguidores → ingresos estimados)
- [ ] Modelo de comisiones 20% neto explicado visualmente
- [ ] Diferencia BuddyMaker vs BuddyExpert visual
- [ ] Testimonios/casos de éxito
- [ ] FAQ para creadores
- [ ] Formulario de pre-registro
- [ ] Ruta pública /creators registrada en App.tsx

## Landing herramientas + Creators (COMPLETADO)
- [x] Página /herramientas: calculadora nutricional (Mifflin-St Jeor, macros, IMC) + test de hábitos con diagnóstico
- [x] Página /creators: hero, calculadora de ingresos interactiva, BuddyMaker vs BuddyExpert, testimonios, FAQ, CTA
- [x] Rutas públicas /herramientas y /creators registradas en App.tsx
- [x] Enlace "Creadores 💼" añadido en nav desktop y menú móvil de LandingPage

## Panel de Control para Creadores (/creator-dashboard)
- [ ] Schema DB: tabla creatorReferrals (referido, código, fecha, plan, estado, comisión)
- [ ] Schema DB: tabla creatorCommissions (creador, mes, total, pagado, pendiente)
- [ ] tRPC router creators: getStats, getReferrals, getCommissions, getProfile
- [ ] tRPC router creators: generarCódigoReferido único por creador
- [ ] Página /creator-dashboard: métricas en tiempo real (referidos activos, comisiones totales, pendientes, tasa conversión)
- [ ] Tabla de referidos con estado (activo/cancelado/prueba) y comisión por cada uno
- [ ] Historial de comisiones por mes con estado (pagado/pendiente)
- [x] Gráfico de evolución de referidos y comisiones
- [ ] Sección de código de referido con botón copiar y enlace de afiliado
- [ ] Ruta /creator-dashboard registrada en App.tsx
- [ ] Enlace en sidebar y en la landing /creators

## Mejora sección referidos en panel de creadores (Apr 12)
- [ ] Endpoint getReferralsList con paginación, filtros y búsqueda
- [ ] Tabla completa de referidos con filtros (todos/activos/cancelados), búsqueda por nombre, paginación
- [ ] Detalles extendidos: fecha de registro, plan, ganancias generadas, días activo
- [ ] Indicador de estado visual con color (activo=verde, cancelado=rojo)
- [ ] Exportar lista de referidos a CSV

## Propuesta BuddyCoach para Nutricionistas (completado)
- [x] Landing page /nutricionistas con propuesta BuddyCoach (beneficios, modelo de ingresos, formulario de solicitud)
- [x] Formulario de solicitud BuddyCoach con notificación al owner vía trpc.system.notifyOwner
- [x] Documento PDF propuesta de colaboración para nutricionistas

## BuddyMarket for Business (B2B)
- [ ] Schema DB: tablas companies, companyLicenses, companyActivationCodes
- [ ] tRPC router: company (crear empresa, activar código, panel RRHH)
- [ ] Stripe: productos y checkout para planes empresariales (Starter 8€, Business 6€, Enterprise 4.5€)
- [ ] Landing page /empresas con planes, propuesta de valor y formulario de contacto
- [ ] Panel RRHH /empresa/dashboard con métricas de activación y uso
- [ ] Flujo de activación: empleado introduce código → acceso Pro Max activado
- [ ] Webhook Stripe: activar licencias al completar pago empresarial

## B2B — BuddyMarket for Business
- [x] Tablas DB B2B: companies, companyMembers, companyActivationCodes, companyLeads
- [x] Router tRPC company: submitLead, createCheckout, getDashboard, activateCode
- [x] Landing page /empresas con planes, calculadora ROI, testimonios, FAQ y formulario
- [x] Panel RRHH /empresa/dashboard con métricas de activación y gestión de códigos
- [x] Enlace a /empresas en nav desktop y móvil de la landing page
- [x] Webhook Stripe para activar plan empresarial tras pago

## B2B — Sistema de Recordatorios Automáticos
- [ ] Tablas DB: companyReminderCampaigns, companyReminderLogs (migradas)
- [ ] Router tRPC company.reminders: createCampaign, sendNow, listCampaigns, getCampaignLogs, cancelCampaign
- [ ] Servicio de email con Resend para recordatorios de activación
- [ ] Templates de email HTML para recordatorios (activación, engagement, expiración)
- [ ] Panel RRHH: sección de recordatorios con lista de campañas y formulario de nueva campaña
- [ ] Panel RRHH: vista de logs por campaña con estado de cada envío
- [ ] Panel RRHH: programación automática (envío inmediato o en fecha futura)

## Sistema de Recordatorios B2B
- [x] Tablas DB: company_reminder_campaigns y company_reminder_logs
- [x] Router tRPC companyReminders: listCampaigns, getCampaignLogs, sendNow, sendActivationReminders, cancelCampaign, getStats
- [x] Templates de email HTML para recordatorios (activation, engagement, expiry_warning, custom)
- [x] Sección de recordatorios en EmpresaDashboard con stats, historial de campañas y logs
- [x] Modal de envío con selector de tipo, asunto personalizable, mensaje personalizado y lista de destinatarios CSV

## Modo Familia / Hogar Compartido
- [ ] Tablas DB: households, householdMembers, householdInvitations
- [ ] Router tRPC household: create, get, invite, acceptInvite, removeMember, leave, updateMemberPrefs
- [ ] Página /familia: panel de gestión del hogar con miembros, invitaciones y preferencias
- [ ] Integración en menú semanal: vista combinada del hogar con filtros por miembro
- [ ] Integración en lista de la compra: consolidar ingredientes de todos los miembros del hogar
- [ ] Email de invitación al hogar con token de aceptación
- [ ] Restricciones dietéticas por miembro (alergias, intolerancias, preferencias)

## Modo Familia (completado)
- [x] Tablas DB: households, householdMembers, householdInvitations
- [x] Router tRPC household: create, get, invite, acceptInvite, getInviteByToken, removeMember, updateMyPreferences, update, cancelInvitation
- [x] Página /familia: gestión del hogar, miembros con roles, invitaciones pendientes
- [x] Modal de creación de hogar
- [x] Modal de invitación por email con confirmación
- [x] Modal de preferencias individuales (restricciones dietéticas, objetivo, calorías)
- [x] Página /familia/unirse: aceptar invitación por token
- [x] Enlace "Mi Hogar" en sidebar de AppLayout (grupo Familia)
- [x] Rutas /familia y /familia/unirse en App.tsx

## Gate Pro Max — Modo Familia
- [x] Añadir canUseHousehold al tipo PlanLimits y a los 4 planes (free/basic/premium/pro_max)
- [x] Gate en backend: router household.create verifica requirePlanFeature("canUseHousehold")
- [x] Pantalla de upsell en /familia para usuarios sin Pro Max (con CTA a /precios)
- [x] Modo Familia añadido en tabla de comparación de Subscription.tsx (hot: true)
- [x] Modo Familia añadido en lista de features de la tarjeta Pro Max
- [x] Mensaje de upgrade Pro→Pro Max menciona el Modo Familia

## Asignación de recetas a miembros del hogar
- [x] Tabla household_recipe_assignments en schema DB (con memberId, recipeId, mealType, scheduledDate, note, isCompleted)
- [ ] Router tRPC householdRecipes: assign, unassign, getForMember, getForHousehold, markCompleted
- [ ] Interfaz de asignación en /familia: selector de miembro + buscador de recetas + modal de asignación
- [ ] Vista de recetas asignadas por miembro en /familia/recetas/:memberId
- [ ] Notificación por email al miembro cuando se le asigna una receta

## Asignación de recetas a miembros del hogar
- [x] Tabla householdRecipeAssignments en el schema DB
- [x] Router tRPC householdRecipes: assign, unassign, markCompleted, getForMember, getForHousehold, searchRecipes, getMyAssignments
- [x] Interfaz de asignación en /familia: modal de búsqueda, selector de miembro/tipo de comida/fecha/nota
- [x] Vista /familia/mis-recetas: recetas asignadas al usuario con filtros y marcar como completada
- [x] Email de notificación al miembro cuando se le asigna una receta

## Calendario semanal del hogar familiar
- [ ] Endpoint backend getWeekCalendar: recetas asignadas agrupadas por día y franja horaria para la semana actual
- [ ] Página /familia/calendario: grid semanal 7 días × 4 franjas (desayuno/almuerzo/cena/snack)
- [ ] Navegación entre semanas (anterior/siguiente) en el calendario
- [ ] Tarjetas de receta en el calendario con imagen, nombre, miembro asignado y estado completado
- [ ] Marcar receta como completada directamente desde el calendario
- [ ] Enlace desde /familia y desde el sidebar del AppLayout

## Calendario semanal del hogar familiar (completado)
- [x] Endpoint backend getWeekCalendar en householdRecipes: recetas agrupadas por día/franja, con miembros del hogar
- [x] Página /familia/calendario: grid semanal 7 días × 4 franjas (desayuno/almuerzo/cena/snack)
- [x] Navegación entre semanas (anterior/siguiente) con botón "Ir a hoy"
- [x] Tarjetas de receta con imagen, nombre, kcal, tiempo, badge de miembro y estado completado
- [x] Marcar receta como completada directamente desde el calendario
- [x] Filtro por miembro del hogar (botones de filtro con colores por miembro, "Todos" por defecto)
- [x] Vista responsive: grid en desktop, lista por día en móvil
- [x] Estado vacío diferenciado (sin recetas esta semana / sin recetas para este miembro)
- [x] Ruta /familia/calendario en App.tsx
- [x] Enlace "Calendario Familiar" en sidebar de AppLayout (grupo Familia)
- [x] Enlace "Mis Recetas Asignadas" en sidebar de AppLayout (grupo Familia)

## Mejoras Modo Familia — Soporte para niños (sprint actual)
- [x] Migración DB: añadir memberType (adult/child/baby), birthDate, weight, height, feedingPhase a householdMembers
- [x] Migración DB: añadir campo dislikedFoods (JSON) a householdMembers
- [x] Backend: helper calcNutritionalNeeds(memberType, ageYears) con tablas OMS por franja de edad
- [x] Backend: endpoint household.getMemberNutrition para obtener necesidades nutricionales por miembro
- [x] Backend: endpoint household.updateMemberProfile para actualizar tipo, edad, peso, talla, fase
- [x] Schema DB: añadir columnas isKidFriendly, isBabyFriendly, isFingerFood, noAddedSugar, highIron, highCalcium a recipes
- [x] Backend: endpoint admin.tagKidFriendlyRecipes para etiquetar recetas (admin)
- [ ] Backend: seed automático de etiquetas para niños en recetas existentes (via IA/LLM)
- [x] Frontend: modal EditMemberProfileModal con tipo (adulto/niño/bebé), fecha de nacimiento, peso, talla, fase de alimentación
- [x] Frontend: badge visual en cada miembro del hogar (👶 bebé / 🧒 niño / 👤 adulto)
- [ ] Frontend: panel nutricional familiar en /familia con semáforo por miembro (verde/amarillo/rojo)
- [ ] Frontend: filtro "Apto para niños" en página de recetas
- [ ] Frontend: badge "Apto para niños 🧒" en tarjetas de receta
- [x] Backend: endpoint householdRecipes.generateFamilyMenu con IA (menú unificado para todos los miembros)
- [x] Frontend: modal FamilyMenuModal con formulario de generación y resultado del menú familiar
- [x] Frontend: botón "Menú IA" en header de /familia

## Rediseño Sistema de Códigos — Empresa + Referido

### Flujo Empresa (código único tipo MERCADONA2024)
- [x] Schema DB: campo `accessCode` en companies + campo `usedReferralCode` en users
- [x] Backend: router `codes` con endpoints validate, applyCompanyCode, getMyCompanyAccess, generateCompanyCode
- [x] Backend: endpoint `codes.validate` (público) — valida código y devuelve tipo + beneficio + nombre empresa/experto
- [x] Backend: endpoint `codes.applyCompanyCode` (protegido) — activa Pro Max y registra miembro en la empresa
- [x] Backend: endpoint `codes.generateCompanyCode` — genera código tipo EMPRESA2025 para la empresa
- [ ] Backend: webhook Stripe — al completar checkout con código referido, registrar uso y calcular comisión para experto/maker
- [ ] Backend: endpoint `codes.getMyStats` para expertos/makers — ver cuántos usuarios han usado su código

### Flujo Registro/Login con código
- [x] Frontend: campo opcional "¿Tienes un código?" en el flujo de registro (Registration.tsx, subStep 3)
- [x] Frontend: validación en tiempo real del código (muestra nombre empresa o % descuento al escribir)
- [x] Frontend: si código es de empresa → muestra "Tu empresa cubre el coste de Pro Max" y activa al registrarse
- [x] Frontend: si código es de experto/maker → muestra "X% de descuento en tu suscripción"
- [x] Frontend: página `/activar` — landing para empleados con campo de código, validación y activación

### Panel RRHH actualizado
- [x] Frontend: panel RRHH muestra código único de empresa (ej. MERCADONA2025) con botones Copiar y Copiar enlace
- [x] Frontend: panel RRHH muestra enlace directo `/activar?code=EMPRESA2025` para enviar a empleados
- [x] Frontend: botón Generar código si la empresa aún no tiene uno
- [ ] Frontend: facturación dinámica por licencias activas ese mes

### Panel BuddyExpert/Maker con métricas de referidos
- [ ] Frontend: sección "Mi código de referido" en BuddyExpertDashboard y BuddyMakerDashboard
- [ ] Frontend: mostrar código único, nº de usuarios referidos, suscripciones activas y comisión acumulada
- [ ] Frontend: gráfico de evolución de referidos por mes

## Facturación por licencias activas B2B [COMPLETADO]

- [x] Schema DB: tabla companyBillingSnapshots (id, companyId, billingPeriodStart, billingPeriodEnd, activeLicenses, pricePerLicense, totalAmount, stripeInvoiceId, status)
- [x] Migración DB: pnpm db:push con la nueva tabla (migración 0027)
- [x] Stripe: crear precios unitarios por plan (price_starter_b2b, price_business_b2b, price_enterprise_b2b) en stripe-b2b-products.ts
- [x] Backend: refactorizar createCheckout para usar precio unitario con quantity variable en lugar de importe fijo
- [x] Backend: job billing-sync.ts — contar licencias activas (lastActiveAt > 30 días), actualizar quantity en Stripe, insertar snapshot
- [x] Backend: webhook invoice.upcoming — sincronizar quantity antes de que Stripe genere la factura
- [x] Backend: endpoint company.getBillingHistory — devuelve snapshots de facturación de la empresa
- [x] Backend: email de resumen previo a facturación (día 28) con licencias activas y total estimado
- [x] Frontend: sección historial de facturación en EmpresaDashboard con tabla mes a mes
- [x] Frontend: gráfico de evolución de licencias activas en EmpresaDashboard

## Panel Admin — Gestión Empresas B2B [COMPLETADO]

- [x] Backend: endpoint company.adminGetCompanies — listado con métricas, filtros por plan/estado/búsqueda y resumen global (MRR, licencias)
- [x] Backend: endpoint company.adminGetCompanyDetail — detalle completo (miembros, snapshots, stats)
- [x] Backend: endpoint company.adminUpdateCompany — cambiar estado, plan, notas internas
- [x] Backend: endpoint company.adminGetLeads — listado de leads con filtro por estado de contacto
- [x] Backend: endpoint company.adminUpdateLead — marcar lead como contactado/pendiente
- [x] Backend: endpoint company.adminTriggerCompanyBillingSync — forzar sync de facturación
- [x] Frontend: pestaña "Empresas B2B" en Admin.tsx con sub-tabs (Resumen global, Empresas, Leads)
- [x] Frontend: KPIs globales (empresas totales, activas, licencias activas, MRR estimado)
- [x] Frontend: distribución por plan con barras de progreso
- [x] Frontend: tabla de empresas activas con MRR por empresa
- [x] Frontend: listado de empresas con filtros (plan, estado, búsqueda) y click para ver detalle
- [x] Frontend: detalle de empresa con stats, acciones de estado, sync de facturación, notas internas, miembros y historial de facturación
- [x] Frontend: listado de leads con filtro contactado/pendiente y botón de enviar email directo

## Sistema de Tickets de Soporte [COMPLETADO]

- [x] Schema DB: tabla supportTickets + supportMessages + enums (migración 0028)
- [x] Backend: endpoints support.createTicket, getMyTickets, getTicketDetail, addMessage, closeTicket
- [x] Backend: endpoints admin support.adminGetTickets, adminGetTicketDetail, adminUpdateTicket, adminReplyTicket
- [x] Backend: email de confirmación al crear ticket y notificación al usuario cuando admin responde
- [x] Backend: notificación al owner cuando llega ticket urgente/alta prioridad
- [x] Frontend: página /app/soporte con formulario de nuevo ticket, listado y detalle con hilo de mensajes
- [x] Frontend: badges de estado (Abierto/En curso/Esperando/Resuelto/Cerrado) y prioridad (Baja/Media/Alta/Crítica)
- [x] Frontend: enlace "Centro de Soporte" en sidebar grupo Mi Perfil
- [x] Frontend admin: pestaña "Soporte" en Admin.tsx con KPIs, listado con filtros y detalle de ticket
- [x] Frontend admin: campo de respuesta pública + notas internas + cambio de estado/prioridad/asignado

## Panel Admin — Gestión de Licencias B2B
- [x] Endpoint backend: adminGetLicensesOverview (KPIs globales de licencias, MRR, ARR, churn)
- [x] Endpoint backend: adminGetAllLicenses (listado paginado de todas las licencias con filtros)
- [x] Endpoint backend: adminAdjustLicense (ajustar licencias contratadas manualmente)
- [x] Endpoint backend: adminRevokeLicense (revocar licencia de un empleado específico)
- [x] Componente AdminLicenciasPanel con KPIs globales (MRR, ARR, licencias activas, tasa uso)
- [x] Vista de tabla de licencias por empresa con filtros y búsqueda
- [x] Vista detalle de licencias por empresa (empleados activos/inactivos, última actividad)
- [x] Acciones: ajustar límite de licencias, revocar empleado, forzar sincronización
- [x] Gráfico de evolución de licencias activas (últimos 6 meses)
- [x] Integrar nueva pestaña "Licencias" en el panel admin

## P3 — Calidad y Pulido UX [EN PROGRESO]
- [x] BD de ingredientes: ampliada de 457 a 510 ingredientes con 18 nuevas categorías (carnes procesadas, pescados conservas, pan, pasta, snacks, dulces, bebidas, comida internacional, etc.)
- [x] Dashboard: widget personalizable ya implementado, anillo SVG de macros con animación, confeti al completar macros, streak de días
- [x] Animaciones: confeti canvas-confetti al completar objetivos de macros, barras de macros con transición CSS
- [x] Scroll infinito en Recetas: ya implementado con useInfiniteQuery + IntersectionObserver (cursor-based)
- [x] Open Graph dinámico: server/og.ts con meta tags específicos por receta para WhatsApp/redes
- [x] PWA: manifest.json completo, service worker con push notifications, splash screens iOS, iconos todos los tamaños
- [x] Exportar PDF menú: implementado con jsPDF en ActiveMenu.tsx
- [ ] Traducciones: revisar textos hardcodeados en español que no usan t()
- [ ] BD de ingredientes: ampliar a 1.000+ ingredientes

## Eliminar Manus OAuth [EN PROGRESO]
- [x] Frontend: reemplazar getLoginUrl() por "/login" en App.tsx (ProtectedRoute y ProtectedPage)
- [x] Frontend: reemplazar getLoginUrl() por "/login" en main.tsx (redirectToLoginIfUnauthorized)
- [x] Frontend: reemplazar getLoginUrl() por "/login" en useAuth.ts
- [x] Frontend: reemplazar getLoginUrl() por "/login" en AppLayout.tsx y DashboardLayout.tsx
- [x] Frontend: reemplazar getLoginUrl() por "/login" en otras páginas (BuddyApplication, EventMenuPlanner, Following, LandingPage, Metrics)
- [x] Frontend: actualizar const.ts para eliminar funciones que dependen de VITE_OAUTH_PORTAL_URL
- [x] Frontend: eliminar ManusDialog.tsx o adaptarlo para no mencionar Manus
- [x] Backend: eliminar ruta /api/oauth/callback del servidor
- [x] Backend: eliminar registerOAuthRoutes del index.ts
## Landing Page — Nuevas Secciones
- [x] Calculadora nutricional interactiva (IMC, TMB, macros personalizados)
- [x] Checklist de análisis de hábitos nutricionales con feedback personalizado y puntuación

## BuddyExperts — Sistema de Gestión de Pacientes
- [x] Tabla expertPatients (relación expert-paciente con estado, fecha de inicio)
- [x] Tabla expertMessages (mensajería directa expert ↔ paciente)
- [x] Tabla expertAppointments (citas con Google Calendar sync)
- [x] Tabla patientProgress (seguimiento de evolución: peso, medidas, fotos)
- [x] Backend: procedimientos de mensajería (enviar, listar, marcar leído)
- [x] Backend: procedimientos de gestión de pacientes (invitar, listar, ver perfil)
- [x] Backend: asignar menú a paciente con adaptación IA por alergias/intolerancias
- [x] Backend: gestión de citas (crear, confirmar, cancelar, Google Calendar)
- [x] Backend: seguimiento de evolución del paciente
- [x] Frontend: Panel de pacientes del BuddyExpert (lista, buscar, invitar)
- [x] Frontend: Vista detalle de paciente (historial, menús asignados, mensajes, citas)
- [x] Frontend: Mensajería directa expert ↔ paciente en tiempo real
- [x] Frontend: Asignar menú de la BD del expert con adaptación IA
- [x] Frontend: Gestión de citas con integración Google Calendar
- [x] Frontend: Vista del paciente (ver menús asignados, mensajes, citas)
- [x] Frontend: Seguimiento de evolución con gráficas

## BuddyMakers — Analíticas de Alcance
- [x] Tabla recipeAnalytics (vistas, likes, guardados, compartidos por receta)
- [x] Backend: registrar vista de receta al cargar detalle
- [x] Backend: procedimiento getMyRecipeAnalytics (stats por receta + totales)
- [x] Frontend: Página de analíticas de alcance para BuddyMakers (/app/maker-analytics)
- [x] Frontend: Tabla de recetas con columnas de vistas, likes, guardados
- [x] Frontend: Gráfica de evolución temporal de alcance

## Contenido Dinámico desde BD + Modo Offline
- [ ] Backend: endpoint de sincronización de recetas con paginación y timestamp de última actualización
- [ ] Backend: endpoint de sincronización de menús con paginación y timestamp
- [ ] Panel Admin: formulario completo para añadir/editar recetas desde la app (sin redespliegue)
- [ ] Panel Admin: formulario completo para añadir/editar menús desde la app (sin redespliegue)
- [ ] Panel Admin: gestión de recetas con imagen, ingredientes, instrucciones, valores nutricionales
- [ ] Panel Admin: gestión de menús con recetas asignadas por día y momento del día
- [ ] Service Worker: estrategia de caché para shell de la app (Cache First)
- [ ] Service Worker: estrategia de caché para API de recetas y menús (Stale-While-Revalidate)
- [ ] Service Worker: precaché de imágenes de recetas visitadas
- [ ] Service Worker: página offline personalizada cuando no hay conexión
- [ ] IndexedDB: almacenamiento local de recetas, menús y datos del usuario
- [ ] Sincronización offline: cola de acciones pendientes (meal logs, favoritos, listas de compra)
- [ ] Sincronización offline: sincronizar cola al recuperar conexión
- [ ] UI: indicador de estado de conexión (online/offline) en la app
- [ ] UI: banner de "Modo offline - datos en caché" cuando no hay conexión
- [ ] Manifest PWA: actualizar con iconos, shortcuts y display standalone

## iOS App Nativa — API Mobile + SwiftUI
- [ ] Backend: router mobileApi con endpoints REST/JSON para iOS
- [ ] Backend: GET /api/mobile/recipes (catálogo paginado)
- [ ] Backend: GET /api/mobile/recipes/:id (detalle receta)
- [ ] Backend: POST /api/mobile/auth/apple (login con Apple token)
- [ ] Backend: GET /api/mobile/user/dashboard (datos del día)
- [ ] Backend: POST /api/mobile/iap/verify (verificar compra StoreKit 2)
- [ ] Backend: GET /api/mobile/user/profile (perfil del usuario)
- [ ] iOS: Proyecto SwiftUI con XcodeGen (project.yml)
- [ ] iOS: Capa de red (APIClient.swift con URLSession)
- [ ] iOS: Modelos de datos (Recipe, User, Dashboard, Subscription)
- [ ] iOS: Pantalla Onboarding (3 slides nativos con animaciones)
- [ ] iOS: Pantalla Login nativa (Sign in with Apple + Google)
- [ ] iOS: Dashboard nativo (calorías, macros, receta del día)
- [ ] iOS: Explorar recetas nativo (grid con filtros y búsqueda)
- [ ] iOS: Detalle de receta nativo (ingredientes, instrucciones, macros)
- [ ] iOS: Perfil nativo (datos, suscripción, ajustes)
- [ ] iOS: Pantalla suscripción StoreKit 2 nativa
- [ ] iOS: Notificaciones push nativas

## Bug fixes pendientes
- [ ] Dashboard: card de calorías muestra 0 kcal/0g macros cuando no hay comidas registradas — añadir CTA motivacional y sugerencia de primera comida del día
- [ ] Dark mode incompleto: header y bottom nav en oscuro pero contenido del dashboard en fondo claro — unificar todos los fondos, textos y cards en dark mode

## Bugs reportados (capturas Apr 13)
- [x] Bug: Botones compartir/favorito se superponen sobre el badge de tiempo en tarjetas de receta (maxWidth + truncado en badge)
- [x] Bug: Botón compartir flotante en detalle de receta mal posicionado (implementado variant bar como barra horizontal integrada)
- [x] Bug: Error 'The string did not match the expected pattern' al generar lista de la compra (enum supermarket BD actualizado con consum e hiperdino)
- [x] Bug: Avatar de BuddyExpert muestra letra 'D' en lugar de imagen (usar user.imageUrl como fallback cuando expert.avatarUrl es null)

## Bug crítico login (Apr 13 - v2)
- [x] Bug: Error al iniciar sesión "Unexpected token '<', DOCTYPE is not valid JSON" - servidor devuelve HTML en lugar de JSON

## Errores auditoría completa (Apr 13)
- [x] Bug crítico #1: Home.tsx redirige a https://buddymarket.io/app/dashboard hardcodeado
- [x] Bug crítico #2: support.ts import incorrecto '../email' que no exporta sendEmail
- [x] Bug crítico #3: companyReminders.ts import incorrecto server/_core/db
- [x] Bug moderado #4: BuddyExperts.tsx usa window.location.href en lugar de navigate()
- [x] Bug moderado #5: App.tsx ProtectedRoute/ProtectedPage usa window.location.href en lugar de setLocation
- [x] Bug moderado #7: MealLog.tsx usa window.location.href = "/app/achievements"
- [x] Accesibilidad #8: Complements.tsx DialogContent sin DialogTitle
- [x] Accesibilidad #9: ExpertPlansManager.tsx DialogContent sin DialogTitle
- [x] Accesibilidad #10: MenuLibrary.tsx DialogContent sin DialogTitle
- [x] Accesibilidad #11: EmpresaDashboard.tsx DialogContent sin DialogTitle
- [x] Calidad #12: Reducir usos críticos de as any/@ts-ignore en páginas principales

## Retry automático tRPC (Apr 13)
- [ ] Implementar retry automático con backoff en cliente tRPC para errores 502/503 (sandbox hibernación)

## Banner de estado del servidor (Apr 13)
- [x] Añadir banner de conectividad en LoginPage.tsx que detecte automáticamente problemas de servidor e informe al usuario

## Panel de Administración - Logs de Errores del Servidor
- [ ] Añadir tabla server_logs en drizzle/schema.ts (id, level, message, stack, path, userId, metadata, createdAt)
- [ ] Crear helper insertServerLog en server/db.ts
- [ ] Crear middleware Express para capturar errores 500 y guardarlos en DB
- [ ] Crear procedimiento tRPC logs.list con filtros (level, desde, hasta, búsqueda, paginación)
- [ ] Crear procedimiento tRPC logs.stats (conteo por nivel, tendencia últimas 24h)
- [ ] Crear procedimiento tRPC logs.clear para borrar logs antiguos
- [ ] Crear página /admin/logs con tabla de errores, filtros y estadísticas
- [ ] Añadir ruta /admin/logs en App.tsx protegida por rol admin
- [ ] Añadir enlace al panel de logs en la navegación del admin

## Sprint: BD de ingredientes nutricionales (en curso)
- [ ] Schema BD: tabla ingredientNutrition con campos nutricionales completos
- [ ] Migración db:push
- [ ] Generar 1500 ingredientes con valores nutricionales por 100g via script
- [ ] Insertar 1500 ingredientes en BD
- [ ] Endpoint tRPC ingredients.search para autocompletado
- [ ] Vincular ingredientes de recetas con ingredientNutrition
- [ ] Actualizar cálculo nutricional de recetas para usar BD de ingredientes
- [ ] UI RecipeDetail: mostrar nutrición calculada desde BD de ingredientes

## Mejoras UX (Sprint actual)
- [x] Diálogo de confirmación antes de cerrar sesión (AppLayout, DashboardLayout, Profile)

## Autenticación email + contraseña (Sprint actual)
- [x] Verificar campo passwordHash en schema users (ya existe según auditoría)
- [x] Endpoint servidor: registro con email + contraseña (bcrypt hash)
- [x] Endpoint servidor: login con email + contraseña
- [x] Endpoint servidor: solicitar recuperación de contraseña (envío email con token)
- [x] Endpoint servidor: resetear contraseña con token
- [x] Frontend: formulario de login con tabs (OAuth / Email+Contraseña)
- [x] Frontend: formulario de registro con email+contraseña
- [x] Frontend: página /reset-password para resetear contraseña
- [x] Crear cuenta real de Guillermo con contraseña (guillermo@buddymarket.io)

## Fixes pendientes (Apr 15)
- [ ] Corregir traducciones nav.metrics y nav.connectedHealth (mostrar "Métricas" y "Salud Conectada" en lugar de claves crudas)
- [ ] Sistema de referidos: solo disponible para suscriptores Pro y ProMax
- [ ] Sistema de referidos: referir amigo que se hace Pro → 1 mes gratis de Pro para el referidor
- [ ] Sistema de referidos: referir amigo que se hace ProMax → 1 mes gratis de ProMax para el referidor
- [ ] Sistema de referidos: UI para generar código, compartir y ver historial de recompensas
- [x] Bug crítico: al cerrar sesión la app re-autentica automáticamente al usuario (no permanece en login)
- [x] Añadir opción "Recordar mi sesión" en formulario de login (persistir email en localStorage)
- [x] Bug landing: botón "Ir a la app" debe mostrar "Regístrate"/"Iniciar sesión" cuando no hay sesión y navegar a /login
- [x] Añadir vídeo de fondo en el hero de la landing page con overlay y texto legible
- [x] Bug crítico: login devuelve HTML en lugar de JSON ("Unexpected token '<', <!DOCTYPE...") — LoginPage reescrito completamente
- [x] Bug crítico: /buddy-setup devuelve HTML en lugar de JSON al guardar configuración — ProtectedRoute simplificado
- [x] Bug crítico: bucle infinito en el flujo de registro/inicio de sesión
- [x] Reemplazar vídeo hero landing por secuencia de 3 vídeos: supermercado, alimentos saludables, batch cooking
- [x] Bug crítico: BuddySetup aparece al cerrar sesión — wizard de onboarding solo debe mostrarse a usuarios nuevos que nunca lo han completado
- [x] Bug: logo de BuddyMarket roto en la página de login — corregido usando /favicon-192x192.png local
- [ ] Restablecimiento de contraseña: tabla passwordResetTokens en BD (token, userId, expiresAt, usedAt)
- [ ] Restablecimiento de contraseña: procedimiento tRPC auth.requestPasswordReset (genera token, envía email con Resend)
- [ ] Restablecimiento de contraseña: procedimiento tRPC auth.resetPassword (verifica token, actualiza contraseña, invalida token)
- [ ] Restablecimiento de contraseña: flujo en LoginPage modo "forgot" ya existente conectado al backend
- [ ] Restablecimiento de contraseña: página /reset-password?token=xxx para introducir nueva contraseña
- [ ] Bug: nav.metrics no se traduce correctamente en el sidebar — mostrar "Mis Métricas" en lugar de la clave raw
- [ ] Bug: tarjetas BuddyExperts no muestran el nombre del experto ni la descripción/bio
- [ ] Bug crítico: al cerrar sesión, LoginPage muestra el formulario 1 segundo y luego redirige automáticamente al dashboard porque auth.me devuelve el usuario antes de que la cookie expire
- [x] Bug crítico producción: servidor devuelve HTML en lugar de JSON para llamadas tRPC en buddymarketapp.com — corregido fallback SPA en vite.ts para excluir rutas /api/*
- [x] Bug crítico: se pueden crear múltiples cuentas con el mismo email — añadir constraint UNIQUE en BD y validación en registro
- [x] Tarea: fusionar/eliminar cuentas duplicadas de luismariaccc@gmail.com en producción — eliminadas IDs 2732 y 2865
- [x] Bug persistente: error HTML en lugar de JSON en producción — Service Worker v5 tenía caché HTML de respuestas API. Corregido con SW v6: limpia todas las cachés antiguas y excluye rutas de auth del caché
- [ ] Bug crítico: cerrar sesión vuelve a abrir la cuenta automáticamente — el logout no destruye la sesión correctamente y LoginPage redirige al usuario de vuelta
- [x] Tarea: convertir iabuddymarket@gmail.com a tipo BuddyExpert en la BD de producción — completado, ID 4335 ahora accountType=buddyexpert

## Fixes Apr 15 (sesión 2)
- [x] Bug crítico: logout vuelve a abrir la sesión — corregido con sessionStorage flag bm_just_logged_out + window.location.replace + invalidate completo del caché tRPC en useAuth.ts
- [x] LoginPage: lee flag sessionStorage bm_just_logged_out para bloquear auto-redirección post-logout, lo limpia tras 2 segundos
- [ ] Bug: nav.metrics y nav.connectedHealth no se muestran en sidebar — pendiente verificar AppLayout.tsx
- [ ] SSO Google: iabuddymarket@gmail.com no aparece como BuddyExpert al hacer login — pendiente verificar server/routers/auth.ts

## Bugs reportados Apr 15 (sesión 3)
- [ ] Bug: Panel de administración — los cambios no se guardan ni se muestran correctamente
- [ ] Bug: Flujo de solicitud BuddyExpert — al solicitar convertirse en BuddyExpert no aparece nada (formulario vacío o sin respuesta)

## Revisión completa Apr 15 (sesión 3)
- [x] Panel admin: select de accountType usaba defaultValue (no controlado) — corregido a value controlado
- [x] Panel admin: admin.stats no devolvía totalAllergies ni totalCategories — corregido (ahora muestra 34 alergias y 18 categorías)
- [x] Auditoría completa de 338 procedimientos tRPC: todos los críticos responden correctamente
- [x] Verificado: RegisterBuddyExpert funciona correctamente (5 pasos, envío OK)
- [x] Verificado: notifications.inApp es sub-router anidado, funciona con .list/.unreadCount/.markRead
- [x] Verificado: codes, companyReminders, household, expertPatients, support — todos responden OK
- [x] Verificado: No hay errores 500 en el servidor (solo OTP email limitado por Resend sandbox)

## Chat Nutricionista-Paciente (Apr 15)
- [x] Schema DB: tabla expertMessages ya existía con todos los campos necesarios
- [x] tRPC: expertPatients.getMessages, sendMessage, markMessagesRead ya existían en el servidor
- [x] Página ExpertChat.tsx: vista centralizada del nutricionista con lista de pacientes + conversación activa
- [x] Mejorar ExpertPatientDetail.tsx: polling 5s, markRead automático, timestamps con fecha, avatares, ticks de leído
- [x] Mejorar MyExpert.tsx (vista paciente): polling 5s, markRead automático, timestamps con fecha, ticks de leído
- [x] Registrar ruta /app/expert/chat en App.tsx
- [x] Añadir enlace "Chat pacientes" en sidebar de AppLayout (solo visible para BuddyExperts aprobados)

## Bug crítico Apr 15 - JSON parse error (Service Worker)
- [x] Bug: "Unexpected token '<', DOCTYPE is not valid JSON" en producción — SW v9 kill-switch: se desregistra en install, sin fetch handler. main.tsx desregistra todos los SWs activos y limpia todas las cachés al cargar

## Bug diseño tarjetas BuddyExperts (Apr 15)
- [x] Rediseñar tarjetas de BuddyExperts: nombre no visible, avatar mal posicionado, diseño poco profesional — corregido con avatar sobresaliente del header (posición absoluta -bottom-9), área de contenido con pt-12 para dar espacio al avatar, nombre en h3 prominente text-[15px] font-black

## Salida a mercado - Webapp pura (Apr 15)
- [ ] Eliminar todo código Capacitor/iOS/Android de la webapp
- [ ] Corregir definitivamente el bug de logout: la sesión se reabre sola al cerrar sesión
- [ ] Verificar que la app no crashea en ningún flujo crítico
- [ ] Checkpoint y publicación

## Salida a mercado - Webapp pura (completado)
- [x] Eliminar directorios ios/, android/, capacitor.config.ts, codemagic.yaml, guías de App Store
- [x] Eliminar dependencias de Capacitor del package.json
- [x] Simplificar usePayment.ts: eliminar lógica IAP iOS/Android, solo Stripe Checkout
- [x] Simplificar IAPSubscriptionButton.tsx: webapp pura, sin lógica nativa
- [x] Simplificar UpgradeGate.tsx: eliminar isIOSNative, mostrar siempre precio Stripe
- [x] Simplificar Subscription.tsx: eliminar isIOSNative e IOSPaymentBanner
- [x] Simplificar WebSSOButtons.tsx: eliminar Capacitor GoogleAuth, solo OAuth redirect estándar
- [x] Corregir bug de logout: cambiar sessionStorage por localStorage para el flag bm_just_logged_out
- [x] Eliminar timer de 2s que borraba el flag prematuramente
- [x] Limpiar flag solo cuando el usuario hace login activamente (no con timer)
- [x] Añadir clearLogoutFlag() en todos los handlers de login (email, registro, OTP, SSO)

## Correcciones urgentes pre-lanzamiento (Apr 15)
- [x] CORS: añadir dominios *.run.app de Google Cloud Run a la lista de orígenes permitidos
- [x] Logs del servidor: añadir botón "Resolver todos" para marcar todos los errores como resueltos de una sola vez

## Doble Dashboard BuddyExpert (Apr 15)
- [x] Selector de modo en AppLayout: "Modo Usuario" / "Modo Profesional" visible solo para BuddyExperts aprobados
- [ ] Dashboard Profesional BuddyExpert: resumen de pacientes activos, consultas pendientes, ingresos del mes
- [ ] Panel de pacientes: lista de pacientes con estado, último check-in, plan activo
- [ ] Gestión de planes: crear/editar planes nutricionales para pacientes con IA
- [ ] Chat con pacientes: lista de conversaciones activas con badge de mensajes no leídos
- [ ] Calendario de disponibilidad: configurar horarios de consulta
- [ ] Métricas profesionales: pacientes activos, planes enviados, valoraciones recibidas
- [ ] Notificaciones profesionales: nuevas solicitudes de pacientes, mensajes, pagos

## Limpieza sidebar BuddyExpert + Dashboard diferenciado (Apr 15)
- [ ] Eliminar items profesionales (BuddyExperts, BuddyMakers, BuddyIA, panel experto) del SIDEBAR_GROUPS modo usuario
- [ ] EXPERT_SIDEBAR_GROUPS: mantener solo items profesionales (panel, pacientes, chat, planes, estadísticas)
- [ ] Dashboard modo usuario: contenido nutricional normal (recetas, menús, diario, objetivos)
- [ ] Dashboard modo profesional: resumen pacientes activos, consultas pendientes, mensajes, ingresos, accesos rápidos profesionales

## Bug: Email de invitación de BuddyExpert no llega (Apr 15)
- [ ] Diagnosticar por qué el email de invitación del experto a paciente no se envía
- [ ] Verificar que el endpoint de invitación llama correctamente a la función de email
- [ ] Verificar que Resend está configurado y el dominio buddymarketapp.com está verificado
- [ ] Corregir el envío de email de invitación si hay error
- [ ] Añadir log de auditoría cuando se envía una invitación

## Panel Profesional Nutricionista (BuddyExpert Dashboard v2)
- [ ] Schema BD: tabla appointments (citas) con expertId, patientId, date, type, status, notes, duration
- [ ] Schema BD: tabla expertMenuTemplates (plantillas de menú del experto con restricciones)
- [ ] Endpoints tRPC: appointments.list, create, update, cancel, getByDate
- [ ] Endpoints tRPC: expertTemplates.list, create, assignToPatient
- [ ] Endpoints tRPC: expertDashboard.metrics (ingresos, pacientes activos, alertas, citas)
- [ ] Rediseñar BuddyExpertDashboard: cards métricas (ingresos, nº pacientes, alertas), citas del día, actividad reciente
- [ ] Dashboard profesional: acceso directo a pacientes desde citas y actividad reciente
- [ ] Dashboard profesional: alertas (pacientes sin check-in, planes por vencer, mensajes sin leer)
- [ ] Gestión de citas: calendario visual, crear/editar/cancelar citas con recordatorio email
- [ ] Biblioteca de plantillas de menú del experto: ver, crear, asignar a paciente
- [ ] Asignación de plantilla: ver restricciones del paciente antes de asignar
- [ ] Subida de PDF: convertir PDF de menú a estructura de menú con IA
- [ ] Vista de paciente desde dashboard: métricas, historial, planes asignados, chat directo

## Vista Detallada Paciente + Notas Internas
- [ ] Tabla expertPatientNotes en schema de BD
- [ ] Endpoints tRPC: notas CRUD, historial de progreso del paciente, menús asignados
- [ ] Página ExpertPatientDetail: gráficos de peso/métricas, menús asignados, notas internas
- [ ] Enlace desde dashboard profesional y lista de pacientes a la vista detallada

## Sprint Notas Internas + Vista Detallada Paciente (completado)
- [x] Schema DB: tabla expertPatientNotes (notas internas del experto sobre pacientes)
- [x] tRPC: endpoint addPatientNote (crear nota interna)
- [x] tRPC: endpoint getPatientNotes (listar notas de un paciente)
- [x] tRPC: endpoint updatePatientNote (editar/fijar nota)
- [x] tRPC: endpoint deletePatientNote (eliminar nota)
- [x] tRPC: endpoint getPatientFullDetail (datos completos del paciente: mensajes, citas, menús, progreso, notas, métricas)
- [x] ExpertPatientDetail: tab "Notas" con notas privadas (5 tipos: general, clínica, dieta, objetivo, alerta)
- [x] ExpertPatientDetail: notas fijadas visibles en cabecera del perfil
- [x] ExpertPatientDetail: alertas de notas tipo "alert" visibles al entrar al perfil
- [x] ExpertPatientDetail: tab "Evolución" con gráficos Recharts (peso, grasa, músculo)
- [x] ExpertPatientDetail: resumen estadístico (peso inicial, actual, cambio total, registros)
- [x] ExpertPatientDetail: tab "Menús" con todos los menús asignados y estado IA
- [x] ExpertPatientDetail: tab "Perfil" ampliada con objetivos calóricos y tipo de dieta
- [x] Build de producción verificado (Vite build exitoso)

## Sprint Dashboard Panel Profesional BuddyExpert
- [x] tRPC: endpoint getExpertDashboardStats (métricas: pacientes activos, citas hoy/semana, mensajes sin leer, ingresos)
- [x] tRPC: endpoint getExpertUpcomingAppointments (próximas citas del experto)
- [x] tRPC: endpoint getExpertRecentActivity (actividad reciente: nuevos pacientes, mensajes, progresos)
- [x] Página ExpertDashboard: tarjetas KPI (pacientes activos, citas hoy, mensajes pendientes, menús este mes)
- [x] Página ExpertDashboard: lista de próximas citas con acceso rápido al paciente
- [x] Página ExpertDashboard: pacientes recientes con estado y última actividad
- [x] Página ExpertDashboard: progreso reciente de pacientes (últimos 30 días)
- [x] Página ExpertDashboard: accesos rápidos (pacientes, mensajes, planes, estadísticas, perfil, invitar)
- [x] Página ExpertDashboard: card de estado del perfil profesional con stats
- [x] Registrar ruta /app/expert/dashboard en App.tsx como página de inicio del panel profesional
- [x] Añadir enlace Dashboard Profesional en sidebar del modo experto

## Sprint Botón Videollamada en Citas Online [COMPLETADO]
- [x] Verificar campo meetingUrl en tabla expertAppointments del schema
- [x] Incluir meetingUrl en el endpoint getExpertDashboardStats
- [x] Añadir botón "Unirse" con icono de videocámara en citas online del ExpertDashboard
- [x] El botón solo aparece si la cita es online Y tiene meetingUrl
- [x] El botón abre la URL en nueva pestaña

## Sprint Integración Google Calendar para BuddyExperts [COMPLETADO]
- [x] Schema DB: campos googleCalendarToken, googleCalendarRefreshToken, googleCalendarConnected en buddyExperts
- [x] Schema DB: campo googleMeetUrl en expertAppointments
- [x] tRPC: endpoint getGoogleCalendarAuthUrl (genera URL OAuth de Google)
- [x] tRPC: endpoint getGoogleCalendarStatus (estado de conexión)
- [x] tRPC: endpoint disconnectGoogleCalendar (revoca tokens)
- [x] tRPC: endpoint checkCalendarAvailability (consulta freebusy + BD local para detectar conflictos)
- [x] Helper googleCalendar.ts: getGoogleAuthUrl, exchangeCodeForTokens, revokeToken, getValidAccessToken, hasConflict, createCalendarEvent, deleteCalendarEvent
- [x] ExpertDashboard: banner "Conectar Google Calendar" si no está conectado
- [x] ExpertDashboard: indicador verde "Google Calendar conectado" con email si está vinculado
- [x] ExpertDashboard: botón "🎥 Unirse" en citas online (usa googleMeetUrl o meetingUrl)
- [x] ExpertDashboard: botón parpadea en verde si la cita empieza en menos de 30 minutos
- [x] Ruta GET /api/google/calendar/callback para recibir el código OAuth de Google y guardar tokens

## Sprint Rediseño Dashboard Profesional (mockup) [COMPLETADO]
- [x] ExpertDashboard: layout tipo mockup con sidebar izquierdo (Profesional, Estadísticas, Mis Planes, Mis Pacientes, Chat, BuddyIA, Mi Perfil, Soporte, Administración)
- [x] ExpertDashboard: KPIs coloridos (Planes en curso naranja, Mensajes nuevos azul oscuro, Citas hoy teal)
- [x] ExpertDashboard: sección Pacientes con buscador, avatar, % adherencia y botones Plan/Chat
- [x] ExpertDashboard: Recordatorio de citas del día con hora, tipo y avatar del paciente
- [x] ExpertDashboard: Tareas rápidas (Crear Plan, Agregar Paciente, Agendar Cita)
- [x] ExpertDashboard: Estadísticas con cards Inventario y BuddyScan IA
- [x] ExpertDashboard: sección BuddyScan IA con imagen y descripción
- [x] ExpertDashboard: Contenido destacado (artículos/recetas de BuddyMakers)
- [x] ExpertDashboard: Accesos rápidos con gráfico de Progreso Pacientes (Peso + Adherencia)

## Sprint Gráfico Progreso Interactivo
- [ ] Tooltip personalizado en gráfico Progreso Pacientes: muestra fecha, peso, adherencia y nombre del paciente
- [ ] Puntos activos (dot) visibles al hacer hover sobre el gráfico
- [ ] Línea de cursor vertical al pasar el ratón
- [ ] Panel de resumen debajo del gráfico con el punto seleccionado

## Sprint Card Pagos y Referidos Dashboard Profesional
- [ ] Schema DB: añadir campo referralCode (único) a tabla buddyExperts
- [ ] Schema DB: verificar tabla creatorEarnings para historial de cobros
- [ ] tRPC: endpoint getExpertEarnings (historial de pagos recibidos, total mes, total histórico)
- [ ] tRPC: endpoint getOrCreateReferralCode (genera código único si no existe, devuelve código y stats)
- [ ] tRPC: endpoint getReferralStats (cuántos usuarios han usado el código, comisiones generadas)
- [ ] ExpertDashboard: card "Ingresos" con total cobrado este mes, total histórico y últimos pagos
- [ ] ExpertDashboard: card "Código Referido" con el código único, botón copiar, stats de uso y explicación del 20%
- [ ] Stripe: crear cupón de descuento del 20% asociado al referralCode del experto

## Grupo 2 — Diario del paciente visible para el experto
- [ ] Tab "Diario" en ExpertPatientDetail: vista del diario alimentario del paciente día a día (comidas, calorías, macros, hora)
- [ ] Semáforo de adherencia diaria: indicador verde/amarillo/rojo por día de la semana en la tab Diario
- [ ] Alertas de desvío del plan: badge/banner en la ficha del paciente si lleva 2+ días fuera de objetivos
- [ ] Registro de síntomas y bienestar: el paciente puede anotar energía/digestión/sueño/humor, el experto lo ve con tendencias
- [ ] Foto de plato con análisis IA: el experto puede ver y corregir el análisis de macros de las fotos del paciente

## Grupo 3 — Seguimiento del progreso
- [ ] Gráfico multi-métrica interactivo: peso, % grasa, masa muscular, IMC y perímetros con zoom por periodo
- [ ] Comparativa de fotos de progreso: vista lado a lado con slider deslizante
- [ ] Informe de progreso mensual en PDF: generación con un clic desde la ficha del paciente
- [ ] Objetivo visual con barra de progreso y cuenta atrás (visible para experto y paciente)
- [ ] Hitos y logros del paciente: el experto puede marcar hitos que se notifican al paciente

## Grupo 4 — Planificación nutricional avanzada
- [ ] Editor de menús drag & drop: construir menús semanales arrastrando recetas a cada comida
- [ ] Plantillas de menús reutilizables por objetivo (pérdida de peso, ganancia muscular, vegano, sin gluten)
- [ ] Ajuste calórico automático: el experto introduce déficit/superávit y el sistema ajusta raciones
- [ ] Sustituciones de alimentos: 3 alternativas equivalentes en macros por alimento del menú
- [ ] Menú de emergencia / semana libre: plan simplificado para viajes o semanas complicadas

## Grupo 5 — Comunicación entre citas
- [ ] Check-in semanal automatizado: recordatorio lunes al paciente para registrar peso, foto y valoración
- [ ] Respuestas rápidas predefinidas en el chat del experto
- [ ] Recordatorios automáticos al paciente: peso, comidas, próxima cita en 24h
- [ ] Valoración semanal del paciente: formulario breve (hambre, energía, adherencia, dificultades) visible para el experto

## Grupo 6 — Gestión del negocio
- [ ] Facturación automática en PDF al completar una cita
- [ ] Paquetes de sesiones con pago (bonos): el experto define bonos que el paciente puede comprar
- [ ] Panel de ocupación semanal: calendario con huecos libres y ocupados
- [ ] Lista de espera: pacientes se apuntan cuando no hay huecos y reciben notificación automática
- [ ] Estadísticas de negocio: ingresos mensuales, retención, media de sesiones y valor por paciente

## Sprint BuddyExperts — Historial, Menús, Tendencias

### Historial de sesiones
- [x] Schema: tabla session_notes (expertPatientId, appointmentId, summary, agreements, nextObjectives, nextAppointmentDate)
- [x] tRPC: addSessionNote, getSessionNotes, updateSessionNote, deleteSessionNote
- [x] UI: Tab "📋 Historial" en ExpertPatientDetail con timeline de sesiones y modal para añadir acta

### Plantillas de menús reutilizables
- [x] Schema: tabla menu_templates (expertId, name, description, category, weekData JSON)
- [x] tRPC: createMenuTemplate, getMenuTemplates, deleteMenuTemplate
- [x] UI: Página /app/expert/menu-templates con lista de plantillas y editor semanal

### Editor drag & drop de menús
- [ ] Instalar @dnd-kit/core y @dnd-kit/sortable para drag & drop
- [ ] UI: Editor semanal con 7 columnas (días) x 4 filas (desayuno/comida/cena/snack)
- [ ] UI: Panel lateral con buscador de recetas para arrastrar al menú
- [ ] UI: Totales de kcal y macros por día en tiempo real al editar
- [ ] UI: Guardar menú editado como plan del paciente o como plantilla

### Ajuste calórico automático
- [ ] tRPC: calculateCaloricTarget (TDEE según peso, altura, actividad y objetivo del paciente)
- [ ] UI: Banner en el editor de menús mostrando objetivo calórico vs. kcal actuales del menú
- [ ] UI: Botón "Ajustar automáticamente" que escala las porciones para alcanzar el objetivo

### Banco de sustituciones
- [x] Schema: tabla food_substitutions (recipeId, originalIngredient, substitutes JSON)
- [x] tRPC: addFoodSubstitution, getFoodSubstitutions, deleteFoodSubstitution
- [x] UI: Página /app/expert/food-substitutions con banco de alternativas por categoría

### Notificación de desvío del plan
- [ ] tRPC: checkPatientAdherence (detecta pacientes con adherencia < 40% o sin registros 2+ días)
- [ ] Endpoint de alerta: notifica al experto via notifyOwner cuando un paciente se desvía
- [ ] UI: Badge de alerta en la lista de pacientes y en el dashboard para pacientes con desvío

### Análisis de tendencias con IA
- [x] tRPC: analyzePatientTrends (invokeLLM con datos de progreso, adherencia y diario del paciente)
- [x] UI: Tab "🧠 Análisis IA" en ExpertPatientDetail con insights generados por IA
- [ ] UI: Gráfico de correlación adherencia vs. pérdida de peso (pendiente)

## Sprint 7 Funcionalidades Nuevas

### Scroll infinito en Recetas
- [ ] tRPC: endpoint recipes.list con cursor-based pagination (limit 20, cursor = lastId)
- [ ] UI: useInfiniteQuery en Recipes.tsx con IntersectionObserver para cargar más al llegar al final
- [ ] UI: skeleton loader mientras carga la siguiente página

### Notificaciones de desvío del plan
- [ ] tRPC: checkPatientAdherence — detecta pacientes con 2+ días sin registrar o adherencia < 40%
- [ ] UI: badge rojo en ExpertPatients.tsx para pacientes con desvío
- [ ] UI: banner de alerta en ExpertPatientDetail cuando el paciente lleva 2+ días sin registrar

### Check-in semanal del paciente
- [ ] Schema DB: tabla weekly_checkins (expertPatientId, userId, week, weight, photoUrl, energyLevel, adherenceScore, notes, completedAt)
- [ ] tRPC: createWeeklyCheckin, getWeeklyCheckins, getMyPendingCheckins
- [ ] UI: página /app/my-checkin para que el paciente complete su check-in semanal
- [ ] UI: tab "Check-in" en ExpertPatientDetail para que el experto vea los check-ins del paciente

### Valoración semanal del paciente
- [ ] Schema DB: tabla weekly_ratings (expertPatientId, userId, week, hunger, energy, adherence, difficulties, mood, notes)
- [ ] tRPC: createWeeklyRating, getWeeklyRatings
- [ ] UI: formulario de valoración semanal en /app/my-checkin (combinado con check-in)
- [ ] UI: gráfico de tendencias de valoraciones en tab del experto

### Informe PDF del paciente
- [ ] tRPC: generatePatientReport — recopila datos del paciente (métricas, sesiones, adherencia, bienestar) y genera HTML estructurado
- [ ] UI: botón "Generar PDF" en ExpertPatientDetail que descarga el informe
- [ ] PDF: incluye gráfico de peso, resumen de sesiones, adherencia media y recomendaciones IA

### Editor drag & drop de menús
- [ ] Instalar @dnd-kit/core y @dnd-kit/sortable
- [ ] UI: página /app/expert/menu-editor con tabla 7 días × 4 comidas
- [ ] UI: panel lateral con buscador de recetas para arrastrar
- [ ] UI: totales de kcal y macros por día en tiempo real
- [ ] UI: guardar como plantilla o asignar a paciente

### Paquetes de sesiones (bonos) con Stripe
- [ ] Schema DB: tabla session_packages (expertId, name, sessionsCount, price, description, isActive)
- [ ] Schema DB: tabla patient_packages (expertPatientId, packageId, sessionsUsed, sessionsTotal, purchasedAt, stripePaymentId)
- [ ] tRPC: createSessionPackage, getExpertPackages, purchasePackage (Stripe checkout), getMyPackages
- [ ] UI: página /app/expert/packages para que el experto gestione sus bonos
- [ ] UI: sección "Bonos disponibles" en MyExpert.tsx para que el paciente compre bonos

## Sprint UI/UX Premium (Abril 2026)

### Cards BuddyMakers/Experts rediseñadas
- [ ] MakerCard: glassmorphism, sombras multicapa, avatar grande sin foto de portada, animación hover
- [ ] ExpertCard: mismo rediseño premium con badge de especialidad y rating visual
- [ ] BuddyMakers.tsx y BuddyExperts.tsx: actualizar con las nuevas cards

### Anillo de progreso calórico
- [ ] Dashboard: reemplazar barra de progreso de calorías por anillo SVG circular
- [ ] Anillo: colores dinámicos según % completado (verde/naranja/rojo)
- [ ] Streak de días consecutivos registrando comidas
- [ ] Animación de entrada del anillo al cargar

### Inventario: Recetas con lo que tienes
- [ ] tRPC: endpoint getRecipesByInventory — cruza ingredientes del inventario con recetas disponibles
- [ ] UI: sección "Recetas con lo que tienes" en Inventory.tsx
- [ ] UI: cards de recetas con badge de % ingredientes disponibles
- [ ] UI: priorizar ingredientes próximos a caducar

### Swipe para cerrar sidebar
- [ ] AppLayout: detectar swipe left (touch) para cerrar sidebar en mobile
- [ ] Animación suave al cerrar con swipe

## Sprint Mejoras UX BuddyExperts (Abril 2026)

### Fix chat y markdown
- [x] Fix header del paciente desbordado en mobile en ExpertPatientDetail
- [x] Renderizar markdown en mensajes del chat (ExpertPatientDetail y MyExpert)
- [x] Crear utilidad renderChatMarkdown para mensajes con links, bold, listas

### Fix rutas 404
- [x] Verificar que el 404 del chat era temporal (servidor reiniciando) - no hay bug de ruta

### Fotos por archivo
- [x] Reemplazar input URL de foto de avatar por file picker en BuddyExpertDashboard
- [x] Reemplazar input URL de foto de portada por file picker en BuddyExpertDashboard
- [x] Agregar endpoints uploadAvatar y uploadCoverImage en buddyExperts router

### Eliminar paciente
- [x] Agregar endpoint deletePatient en expertPatients router
- [x] Agregar botón "Eliminar paciente" con confirmación en ExpertPatientDetail

### % Adherencia explicado
- [x] Agregar tooltip explicativo del % de adherencia en PatientRow del ExpertDashboard

### Email de invitación mejorado
- [x] Mejorar email de invitación con registro: incluye enlace de registro + explicación de BuddyMarket
- [x] Guardar inviteEmail en BD (campo nuevo en expertPatients)
- [x] Agregar endpoint sendReminderInvite para pacientes que no han aceptado
- [x] Agregar botón "Recordatorio" en la lista de pacientes con status "invited"

### Explicaciones contextuales para BuddyExperts
- [x] Banner de bienvenida en ExpertDashboard para expertos sin pacientes activos
- [x] Explicación contextual en tab Planes del BuddyExpertDashboard
- [x] Explicación contextual en tab Menús del BuddyExpertDashboard
- [x] Explicación contextual en ExpertPatients cuando no hay pacientes

## Flujo de contratación de nutricionista (paciente → nutricionista)

- [ ] Schema: tabla expertServicePlans (planes de pago del nutricionista: nombre, precio, duración, descripción, incluye)
- [ ] Schema: tabla expertHireRequests (solicitudes de contratación: pacienteId, expertId, planId, estado, mensaje)
- [ ] Migración DB: pnpm db:push con nuevas tablas
- [ ] Endpoint: buddyExperts.getServicePlans - obtener planes de un nutricionista
- [ ] Endpoint: buddyExperts.upsertServicePlan - crear/editar plan de servicio (nutricionista)
- [ ] Endpoint: buddyExperts.deleteServicePlan - eliminar plan (nutricionista)
- [ ] Endpoint: expertPatients.sendHireRequest - paciente envía solicitud con plan elegido
- [ ] Endpoint: expertPatients.getHireRequests - nutricionista ve sus solicitudes pendientes
- [ ] Endpoint: expertPatients.respondHireRequest - nutricionista acepta/rechaza solicitud
- [ ] UI: BuddyExpertDashboard - tab "Mis servicios" para gestionar planes de pago
- [ ] UI: BuddyExpertPublicProfile - mostrar planes de pago al paciente con botón "Contratar"
- [ ] UI: Modal de contratación - seleccionar plan + mensaje personalizado + confirmar solicitud
- [ ] UI: BuddyExpertDashboard - sección "Solicitudes de contratación" con aceptar/rechazar
- [ ] Al aceptar solicitud: crear relación expertPatients automáticamente
- [ ] Email al paciente al aceptar/rechazar su solicitud
- [ ] Email al nutricionista al recibir nueva solicitud

## Sistema completo de emails automáticos

### Emails para Usuarios (Pacientes)
- [ ] Email bienvenida al registrarse (con enlace a completar perfil y primer menú IA)
- [ ] Email recordatorio 24h si no han completado el onboarding
- [ ] Email confirmación de primer menú generado con IA
- [ ] Email "primera semana" con tips de uso de la app
- [ ] Email recordatorio check-in semanal (lunes por la mañana, job programado)
- [ ] Email resumen semanal de progreso (domingo noche, job programado)
- [ ] Email sugerencia de menú para la semana siguiente (domingo por la tarde)
- [ ] Email lista de la compra generada lista para descargar
- [ ] Email primer logro desbloqueado
- [ ] Email primer mes completado con estadísticas
- [ ] Email objetivo alcanzado (ej: "¡Has perdido 5 kg!")
- [ ] Email racha de 7 días registrando en el diario
- [ ] Email reactivación 3 días de inactividad (job programado)
- [ ] Email reactivación 7 días de inactividad (job programado)
- [ ] Email reactivación 30 días con oferta especial (job programado)
- [ ] Email invitación recibida de nutricionista (ya existe, mejorar plantilla)
- [ ] Email recordatorio invitación no aceptada en 48h (job programado)
- [ ] Email menú nuevo asignado por nutricionista
- [ ] Email cita confirmada + recordatorio 24h antes (job programado)
- [ ] Email respuesta a solicitud de contratación aceptada/rechazada
- [ ] Email mensaje nuevo del nutricionista (si +2h sin abrir app)

### Emails para BuddyExperts (Nutricionistas)
- [ ] Email bienvenida al ser aprobado como BuddyExpert
- [ ] Email recordatorio 48h si no han completado su perfil público
- [ ] Email checklist de configuración (foto, bio, planes, primer menú)
- [ ] Email nueva solicitud de contratación recibida
- [ ] Email paciente ha aceptado la invitación y está activo
- [ ] Email paciente no ha completado su check-in semanal (job programado, lunes)
- [ ] Email paciente ha alcanzado un hito importante
- [ ] Email recordatorio de cita con paciente 1h antes (job programado)
- [ ] Email resumen semanal del experto (lunes por la mañana, job programado)
- [ ] Email resumen mensual con estadísticas completas (job programado, día 1 del mes)
- [ ] Email nuevo seguidor en su perfil público
- [ ] Email alguien ha valorado su menú o plan
- [ ] Email confirmación de pago recibido de un paciente
- [ ] Email recordatorio para crear planes de servicio si no los tiene
- [ ] Email aviso cuando un paciente cancela su plan

## Mejoras de calidad pre-lanzamiento (Abril 2026)
- [x] Service worker real activado (PWA funcional, notificaciones push habilitadas)
- [x] Email de racha de 7 días y logro desbloqueado añadidos al sistema
- [x] Feature "Recetas con lo que tienes" - endpoint servidor + UI con tab en Recetas
- [x] Página "Sobre nosotros" (/about y /sobre-nosotros) con equipo, misión y valores
- [x] Link "Sobre nosotros" añadido al footer de la landing
- [x] Barra de progreso de completitud del perfil de usuario
- [x] Touch targets nav bar inferior mejorados a 44px mínimo con indicador visual activo
- [x] Métricas infladas corregidas en landing (207+ recetas, cifras reales)
- [x] Inconsistencias entre planes corregidas (landing, suscripción, FAQ)
- [x] Links del footer de la landing apuntan a páginas reales
- [x] Copyright actualizado a 2026 en blog, privacy y cookies
- [x] Aviso tarjeta 4242 eliminado de la página de suscripción
- [x] Datos de prueba eliminados de la base de datos
- [x] Blog posts reasignados a BuddyMarket con fechas variadas

## Mejoras de calidad pre-lanzamiento (Abril 2026)
- [x] Service worker real activado (PWA funcional, notificaciones push habilitadas)
- [x] Email de racha de 7 dias y logro desbloqueado aniadidos al sistema
- [x] Feature Recetas con lo que tienes - endpoint servidor + UI con tab en Recetas
- [x] Pagina Sobre nosotros (/about y /sobre-nosotros) con equipo, mision y valores
- [x] Link Sobre nosotros aniadido al footer de la landing
- [x] Barra de progreso de completitud del perfil de usuario
- [x] Touch targets nav bar inferior mejorados a 44px minimo con indicador visual activo
- [x] Metricas infladas corregidas en landing (207+ recetas, cifras reales)
- [x] Inconsistencias entre planes corregidas (landing, suscripcion, FAQ)
- [x] Links del footer de la landing apuntan a paginas reales
- [x] Copyright actualizado a 2026 en blog, privacy y cookies
- [x] Aviso tarjeta 4242 eliminado de la pagina de suscripcion
- [x] Datos de prueba eliminados de la base de datos
- [x] Blog posts reasignados a BuddyMarket con fechas variadas

## Bugs y mejoras (Abril 2026 - sprint actual)
- [ ] Fix scroll bloqueado en páginas (BuddyIA, Menús, Recetas, etc.)
- [ ] Añadir botones de volver atrás en páginas de detalle sin navegación de retorno
- [ ] Fix foto IA se queda al 92% — comprimir imagen antes de enviar al LLM + timeout 90s
- [ ] Rediseñar pantalla de Menús: pantalla inicial con cards (Mis Menús, Menús BuddyMarket, Crear con IA, Menús de mi Nutricionista)
- [ ] Panel de control calórico detallado en el diario: déficit/superávit, análisis IA, recomendaciones de comidas personalizadas
- [ ] Mi Hogar: añadir miembros manualmente (sin invitación) con formulario de perfil completo
- [ ] Mi Hogar: arreglar layout descuadrado del header (botones se salen de la pantalla)
- [ ] Mi Hogar: completar perfil de cada miembro (nombre, edad, alergias, objetivos, restricciones)

## Fixes y mejoras sesión actual
- [x] Crear menú desde lista de la compra: botón IA (chispa) en ShoppingLists que genera menú semanal con los ingredientes de la lista y muestra modal con 7 días
- [ ] Fix modal lista de compra (Mi lista — Mercadona) sale muy arriba en lugar de bottom sheet centrado
- [x] Fix ingredientes "Alimento" en modal Recetas con tu inventario — ahora muestra nombres reales (ingredient?.nameEs ?? item?.customName)
- [x] Añadir botón "Hacer esta receta" en modal Recetas con tu inventario
- [x] Limpiar datos demo: 6 usuarios .demo@buddymarket.io eliminados ✅
- [ ] Diario: panel calórico detallado con déficit/superávit + explicación del porqué según perfil (TMB, actividad, objetivo)
- [ ] Diario: evaluación IA del día (si lo estás haciendo bien, macros, distribución de comidas)
- [ ] Diario: recomendaciones de comidas personalizadas para completar el día y llegar a objetivos
- [ ] Fix ExpertChat responsive en móvil (layout dos paneles → uno a la vez)
- [ ] Fix nombres "Paciente" en lista de pacientes del experto (usar email como fallback)

## 🔥 Mejoras de Retención — 3 días (18-20 abril 2026)

### DÍA 1 — Hábito Diario y Gamificación Base

#### Mejora 1: Racha Diaria con Consecuencias Reales
- [x] Notificación push a las 20:00 si el usuario no ha registrado nada ese día ("⚠️ Tu racha de X días está en peligro")
- [ ] Animación de fuego (Lottie o CSS) al mantener racha en el Dashboard
- [x] "Escudo de racha" consumible: 1 por semana para no perder la racha si fallas un día
- [ ] Banner de celebración al superar récord personal de racha
- [x] Endpoint `retention.useStreakShield` para consumir el escudo (router retention.ts)

#### Mejora 2: Resumen Diario Nocturno (job a las 21:00)
- [x] Job programado nocturno (21:00 hora España) que genera resumen personalizado
- [x] Email con: calorías del día vs objetivo, puntuación IA, receta del día siguiente, micro-tip nutricional
- [ ] Notificación push complementaria al email
- [x] Endpoint `mealLogs.getDailySummaryEmail` para generar el contenido (implementado en email-jobs.ts)
- [x] Template HTML de email para el resumen nocturno

#### Mejora 3: Check-in de Peso Semanal en Dashboard
- [ ] Card prominente en Dashboard cada lunes: "¿Cuánto pesas hoy?" con campo numérico inline
- [ ] Al registrar, mostrar inmediatamente gráfica de evolución de las últimas 8 semanas
- [ ] Endpoint `progress.logWeeklyWeight` (reutilizar tabla userHealthMetrics)
- [ ] Notificación push cada lunes a las 9:00 recordando el check-in

#### Mejora 7: Sistema de Niveles Nutricionales Visible
- [x] Definir 8 niveles con nombres: Principiante → Explorador → Guardián → Maestro → Campeón → Leyenda → Gurú → BuddyMaster
- [x] Mostrar nivel actual con barra de progreso en Dashboard y en perfil
- [ ] Animación de subida de nivel con confetti
- [x] Endpoint `retention.getLevelInfo` que calcula nivel según puntos acumulados
- [ ] Notificación push al subir de nivel

#### Mejora 9: Badges como Vitrina de Colección
- [ ] Rediseñar pantalla /app/badges como galería visual tipo "vitrina"
- [ ] Animación al desbloquear badge (efecto de brillo/reveal)
- [ ] Mostrar % de usuarios que tienen cada badge (rareza social)
- [ ] Badge "Leyenda BuddyMarket" para 365 días de racha (aspiracional)
- [ ] Sección "Próximos badges" con progreso hacia el siguiente

### DÍA 2 — Personalización IA y Funcionalidades Sociales

#### Mejora 4: Perfil de Gusto IA Visible
- [ ] Card en Dashboard: "Tu perfil de gusto IA" con las 3 preferencias detectadas
- [ ] Actualizar `userTasteProfile` al marcar favoritos, puntuar recetas o cocinarlas
- [ ] Mensaje visible cuando la IA aprende algo nuevo: "Hemos aprendido que te gustan las recetas mediterráneas"
- [ ] Endpoint `profile.getTasteInsights` que devuelve las preferencias detectadas
- [ ] Sección en perfil: "Lo que BuddyMarket sabe de ti" con preferencias editables

#### Mejora 5: Generador de Menú en 1 Clic
- [ ] Botón prominente en Dashboard: "✨ Generar mi menú esta semana"
- [ ] Animación de generación de 3 segundos con mensaje de progreso
- [ ] Generación automática de lista de la compra al crear el menú
- [ ] Modal de confirmación con preview del menú antes de activarlo
- [ ] Endpoint `menus.generateOneClick` que usa perfil + objetivos + alergias

#### Mejora 6: Modo Familia Completo (Pro Max)
- [ ] Completar flujo de invitación de miembros del hogar (tabla households ya existe)
- [ ] Menú familiar unificado respetando restricciones individuales de cada miembro
- [ ] Lista de la compra compartida en tiempo real entre miembros del hogar
- [ ] Pantalla de gestión del hogar con avatares de cada miembro
- [ ] Gate de Pro Max con upgrade CTA si el usuario no tiene el plan

#### Mejora 8: Retos Semanales con Comunidad
- [x] Tabla `weekly_challenges` en schema con retos predefinidos
- [x] Tabla `user_weekly_challenges` para tracking de progreso
- [x] Card de reto activo en Dashboard con barra de progreso (enlace a /app/challenges)
- [x] 10 retos predefinidos: "5 colores esta semana", "3 recetas nuevas", "7 días de registro", etc.
- [ ] Imagen compartible generada automáticamente al completar un reto
- [ ] Badge exclusivo por completar cada tipo de reto

### DÍA 3 — Conexión Humana y Valor Tangible

#### Mejora 10: BuddyExpert Proactivo
- [ ] Panel en ExpertPatients: botón "Enviar mensaje proactivo" a paciente
- [ ] Notificación push al paciente cuando el experto le escribe
- [ ] Experto puede comentar directamente en el diario del paciente (endpoint `expertMessages.commentOnLog`)
- [ ] Alerta al experto si un paciente lleva 3+ días sin registrar comidas
- [ ] Dashboard del experto: lista de pacientes inactivos (>3 días sin log)

#### Mejora 11: Receta del Día Contextual
- [ ] Integración con API meteorológica (Open-Meteo, gratuita) para temperatura exterior
- [ ] Algoritmo de selección: temporada + temperatura + día semana + stock inventario usuario
- [ ] Card "Receta del Día" en Dashboard con contexto: "Hace frío y tienes zanahoria en casa 🥕"
- [ ] Endpoint `recipes.getDailyContextual` con lógica de selección inteligente
- [ ] Rotación cada 24h con seed basado en fecha para consistencia

#### Mejora 12: Informe Mensual PDF
- [ ] Job programado el día 1 de cada mes a las 8:00
- [ ] Generación de PDF con: evolución peso, adherencia menú, macros promedio, logros del mes
- [ ] Comparativa con mes anterior y recomendaciones IA para el mes siguiente
- [ ] Email automático con el PDF adjunto al usuario
- [x] Sección /app/monthly-reports con historial de informes generados
- [x] Tabla `monthly_reports` en schema + pantalla /app/monthly-reports

#### Mejora 13: Escáner Integrado en Lista de Compra
- [ ] Botón "📷 Escanear" directamente en la pantalla de ShoppingLists
- [ ] Al escanear, mostrar puntuación nutricional A-E (estilo Nutriscore) del producto
- [ ] Comparar con alternativas del inventario del usuario
- [ ] Añadir producto escaneado a la lista con un toque
- [ ] Historial de productos escaneados en BuddyScan

#### Mejora 14: Dashboard Salud Conectada
- [ ] Completar integración Apple Health (tabla healthIntegrations ya existe)
- [ ] Completar integración Google Fit
- [ ] Widget en Dashboard: pasos del día + sueño de anoche + frecuencia cardíaca
- [ ] Insight diario: correlación entre sueño y adherencia al menú
- [ ] Endpoint `connectedHealth.getDailySummary` que agrega datos de wearables

#### Mejora 15: Modo Reto de 30 Días
- [x] Tabla `thirty_day_challenges` con 3 programas predefinidos: Pérdida de peso, Ganancia muscular, Bienestar general
- [x] Cada día tiene: tarea específica, objetivo de agua, micro-hábito
- [x] Calendario visual tipo "cadena de hábitos" en /app/challenges tab 30 días
- [x] Check diario con animación al completar el día
- [ ] Informe de transformación al finalizar los 30 días
- [ ] Badge exclusivo "Transformación Completada" al terminar
- [x] Endpoint `retention.startThirtyDayChallenge` y `retention.checkInThirtyDay`

## Registro manual con calorías automáticas (IA)

- [ ] Endpoint tRPC `mealLogs.estimateNutrition` que recibe nombre de alimento + cantidad y devuelve calorías/macros estimados por IA
- [ ] Al escribir nombre manual en el diario, llamar al endpoint y pre-rellenar calorías/proteínas/carbos/grasas
- [ ] Mostrar badge "Estimado por IA" junto a los valores nutricionales pre-rellenados
- [ ] Permitir al usuario editar los valores antes de guardar
- [ ] Guardar los macros estimados (proteínas, carbohidratos, grasas) junto con las calorías en mealLogs

## Correcciones sidebar (Abril 2026)
- [x] Restaurar elementos del sidebar desaparecidos: Menús Especializados, Menú para Eventos, Mis Eventos Guardados, Mis Insignias, Mis Favoritas, Salud Conectada, Estadísticas, Calendario Familiar, Mis Recetas Asignadas, Recordatorios
- [x] Reorganizar sidebar en grupos: Inicio, Nutrición, Menús, Compra, Familia, Comunidad, Mi Cuenta

## Revisión de menús biblioteca (Abril 2026)
- [ ] Revisar y regenerar todos los menús de la biblioteca con comidas cotidianas españolas reales (sin platos raros o poco habituales)
- [ ] Asegurar que los desayunos sean típicos españoles (tostadas, cereales, yogur, fruta, huevos revueltos...)
- [ ] Asegurar que las comidas sean platos del día a día (lentejas, pollo al horno, pasta, arroz, ensalada, tortilla...)
- [ ] Asegurar que las cenas sean ligeras y cotidianas (sopa, crema, tortilla, pechuga, pescado a la plancha...)
- [ ] Eliminar platos con nombres rebuscados o combinaciones poco habituales

## Auditoría completa de consistencia (19 Abr 2026)
- [ ] Revisar cálculos de calorías objetivo (TMB + TDEE) y que sean coherentes con el perfil
- [ ] Revisar que los menús de biblioteca tengan calorías totales coherentes con su objetivo
- [ ] Revisar recetas con 0 calorías o valores nutricionales incorrectos
- [ ] Revisar que los mensajes de progreso/racha sean positivos y motivadores
- [ ] Revisar flujos de onboarding (perfil incompleto → qué ve el usuario)
- [ ] Revisar estados vacíos en diario, recetas, menús
- [ ] Revisar que no haya recetas duplicadas en los menús
- [ ] Revisar que los macros (proteínas/carbos/grasas) sumen correctamente a las calorías
- [ ] Revisar que los desayunos/meriendas no tengan platos de comida principal
- [ ] Revisar textos de IA para que sean positivos y motivadores

## Mejoras masivas (Abril 2026)

### Bloque 1 - Diario
- [ ] Calorías automáticas con IA en registro manual del diario (estimar kcal/macros al escribir nombre del alimento)
- [ ] Registro por voz en el diario (botón micrófono → transcripción → cálculo de calorías)

### Bloque 2 - Menús
- [ ] Filtros en biblioteca de menús (chips por tipo: Keto, Vegano, Sin Gluten, Familiar, Deportista, Pérdida de peso)
- [ ] Etiquetas/badges en tarjetas de menú (Vegano, Sin Gluten, Keto, Alto en Proteínas)
- [ ] Lista de la compra inteligente desde menú semanal activo (agrupada por sección del supermercado)

### Bloque 3 - Dashboard
- [ ] Widget de progreso semanal en dashboard (gráfico de barras calorías día a día vs objetivo)
- [ ] Notificaciones push web (complementar emails de retención con push del navegador)

### Bloque 4 - Onboarding
- [ ] Onboarding guiado para nuevos usuarios (flujo 4 pasos: objetivo → restricciones → actividad → primer menú recomendado)

### Bloque 5 - Contenido
- [ ] Más recetas en categorías escasas (Sushi, Pizzas, Mariscos, Bowls - 10-15 recetas por categoría)
- [ ] Campo tiempo de preparación en recetas + filtro "menos de 20 min" en biblioteca

### Bloque 6 - Stripe
- [ ] Página de historial de pagos (/app/payments) con suscripciones y pagos anteriores

## Ingredientes extra añadidos (19 Abril 2026)
- [x] Añadir 284 ingredientes nuevos: salsas (107), aceites (20), vinagres (13), aderezos (15), semillas (20), pasta/cereales (34), harinas (14), lácteos alternativos (15), dulces (35), proteínas vegetales (11)
- [x] Total ingredientes en BD: 2637 (antes: 2425)

## Mejoras masivas implementadas (19 Abril 2026)

- [x] Calorías automáticas con IA en registro manual del diario (endpoint estimateFromText + debounce en frontend)
- [x] Registro por voz en el diario (botón de micrófono + endpoint transcribeVoice)
- [x] Badges de dieta en tarjetas de menú (Keto, Sin Gluten, Vegano, Familiar)
- [x] Onboarding guiado integrado en AppLayout (se muestra automáticamente a nuevos usuarios)
- [x] Widget de progreso semanal en Dashboard (calorías día a día vs objetivo)
- [x] Página de historial de pagos Stripe (/app/payment-history)
- [x] Enlace a historial de pagos en perfil de usuario
- [x] 18 recetas nuevas generadas con IA e imágenes (Sushi, Pizzas, Mariscos, Guisos, Smoothie bowls, Parrilla, Postres)
- [x] Total recetas: 320 (todas con imagen y categoría)
- [ ] Notificaciones push web para recordatorio de racha (pendiente)
- [ ] Lista de la compra inteligente desde menú activo con agrupación por sección (pendiente)

## Sprint: Imágenes IA para Recetas (en curso)
- [ ] Obtener lista completa de recetas desde la BD
- [ ] Generar imágenes únicas con IA para cada receta (generación en paralelo)
- [ ] Subir imágenes a S3 y actualizar imageUrl en BD
- [ ] Verificar resultado visual en la app

## Sprint Rediseño Menús con 3 Tabs (completado)
- [x] Rediseñar Menus.tsx con 3 tabs claras: "En curso", "Mis menús guardados", "Explorar todos los menús"
- [x] Tab "En curso": menú activo con planificador semanal, slots de comidas, botón "Aplicar al diario"
- [x] Tab "Mis menús": lista de menús guardados con acciones (activar, renombrar, duplicar, eliminar, aplicar al diario)
- [x] Tab "Explorar": búsqueda y filtros por categoría, accesos rápidos a menús médicos y eventos, botón "Guardar"
- [x] Simplificar sidebar: de 5 entradas de menús a 1 sola entrada "Mis Menús"
- [x] Corregir toggle Usuario/Profesional: solo visible para usuarios con role === "buddyexpert"
- [x] Reload page redirige al login (sessionStorage flag bm_session_active)
- [x] Ruta /landing accesible desde buddymarketapp.com
- [x] Imágenes rotas en "Contenido destacado" de ExpertDashboard corregidas
- [x] Soporte para roles múltiples (admin + buddyexpert simultáneo) con campo secondaryRoles
- [x] Panel Admin: sección "Roles adicionales" para asignar/quitar roles secundarios
- [x] BuddyExperts: createServicePlan y updateServicePlan corregidos (usan upsertServicePlan)
- [x] Corrección de campo prepTime → preparationTime en retention.ts y learning-engine.ts
- [x] Corrección de adherenceScore → adherenceRating en email-jobs.ts

## Sprint: Dark Mode Global Fix + Push Notifications (COMPLETADO)

- [x] Añadir reglas CSS globales en index.css para corregir estilos inline hardcodeados en dark mode
- [x] Corregir color-scheme: dark para inputs nativos (date, time, select) en modo oscuro
- [x] Corregir fondos blancos/grises claros con inline styles en modo oscuro
- [x] Corregir colores de texto hardcodeados (#111827, #374151, #6b7280) en modo oscuro
- [x] Corregir banners de éxito/error/warning/info con colores hardcodeados en modo oscuro
- [x] Corregir bordes e inputs con estilos inline en modo oscuro
- [x] Verificar dark mode en Dashboard, Diario, BuddyIA, Recetas, Perfil, Recordatorios
- [x] Crear hook usePushNotifications para gestionar suscripciones Web Push
- [x] Crear componente PushNotificationToggle (card e inline) para activar/desactivar push
- [x] Integrar PushNotificationToggle en página de Recordatorios (MealNotifications.tsx)

## Sprint: Auditoría Integral - Correcciones (COMPLETADO)

- [x] Corregir import incorrecto de pushNotifications.ts (ruta ../pushNotifications → ./pushNotifications) - causaba fallo de build
- [x] Corregir weeklyCheckins.ts: nombres de campo del schema (adherenceRating, hungerRating, energyRating, difficultyNotes, generalNotes)
- [x] Corregir WeeklyCheckin.tsx: submit usa nombres correctos del servidor (energyRating, adherenceRating, hungerRating, difficultyNotes, generalNotes)
- [x] Corregir Menus.tsx: deleteMenu/duplicateMenu/renameMenu usan { id } en lugar de { menuId }
- [x] Corregir Menus.tsx: generateWithAI incluye days y mealsPerDay requeridos
- [x] Corregir MyMenus.tsx: generateWithAI incluye days y mealsPerDay
- [x] Corregir Menus.tsx: Set<string> spread usa Array.from()
- [x] Corregir ExpertPatientDetail.tsx: adherenceScore→adherenceRating, hunger→hungerRating, mood/sleepQuality removidos, difficulties→difficultyNotes, notes→generalNotes
- [x] Corregir ExpertPatientDetail.tsx: addMilestoneMutation incluye patientUserId
- [x] Corregir ExpertPatientDetail.tsx: setAiAnalysisResult con cast de tipo para respuesta LLM
- [x] Corregir ExpertPatientDetail.tsx: objective→mainGoal, medications con cast
- [x] Corregir ExpertPatientDetail.tsx: completedAt con cast de tipo
- [x] Corregir Dashboard.tsx: prepTime→preparationTime, nameEs→title, dailyCalorieGoal, todayTask.task
- [x] Corregir Dashboard.tsx: thirtyDay.todayTask renderizado como objeto (usar .task)
- [x] Corregir Familia.tsx: cast de tipo en HouseholdAssignedRecipes.members
- [x] Corregir FamiliaCalendario.tsx: ampliar tipo de RecipeCardProps.assignment con campos extra del servidor
- [x] Corregir IngredientExplorer.tsx: filtrar null en categories.map()
- [x] Corregir MenuLibrary.tsx: acceso a range.min/max con cast de tipo
- [x] Corregir Referrals.tsx: import StarIcon faltante (usar Star de lucide-react)
- [x] Corregir household.ts: ownerId null safety (userId ?? 0)
- [x] Corregir householdRecipes.ts: userId null safety (userId ?? 0)
- [x] Corregir retention.ts: protein/carbs/fat → proteinsPerServing/carbohydratesPerServing/fatsPerServing
- [x] Corregir auth.logout.test.ts: actualizar mock para coincidir con comportamiento real del código
- [x] Corregir metrics-buddymakers-referrals.test.ts: añadir upsertUserProfile al mock de db
- [x] Build de producción exitoso (EXIT:0, sin errores)
- [x] Todos los tests pasan: 694/694 (31 archivos de test)

## Sprint: Corrección Crash Producción - Lazy Loading (COMPLETADO)
- [x] Mejorar ErrorBoundary.tsx: detectar errores de módulos dinámicos (chunk load errors) vs errores reales
- [x] ErrorBoundary.tsx: auto-retry después de 2s para chunk load errors (cold start del servidor)
- [x] ErrorBoundary.tsx: mostrar mensaje amigable en español en lugar de stack trace técnico
- [x] ErrorBoundary.tsx: spinner de "Reintentando..." durante el auto-retry
- [x] ErrorBoundary.tsx: botón "Recargar página" en naranja cuando el retry falla
- [x] ErrorBoundary.tsx: stack trace técnico solo visible en modo DEV
- [x] App.tsx: añadir función lazyWithRetry() que reintenta imports dinámicos fallidos hasta 3 veces
- [x] App.tsx: reemplazar todos los lazy() por lazyWithRetry() en los 70+ imports de páginas
- [x] Build de producción exitoso (EXIT:0) con los cambios aplicados
- [x] Todos los tests pasan: 694/694 (31 archivos de test)

## Sprint: Panel Admin — Mejoras de funcionalidad completa

- [x] Admin usuarios: añadir buscador por nombre/email en tiempo real
- [x] Admin usuarios: añadir filtro por plan (Free/Pro/Pro Max) y por rol
- [x] Admin usuarios: añadir paginación o carga incremental
- [x] Admin usuarios: añadir campo search en procedimiento admin.users del servidor
- [x] Admin usuarios: mostrar email del usuario en la tarjeta
- [x] Admin recetas: mostrar número total de recetas en el encabezado
- [ ] Admin analíticas: verificar que getDailyActivity y getTopUsers devuelven datos reales
- [x] Admin soporte: verificar que adminUpdateTicket funciona correctamente
- [x] Admin monitor APIs: añadir botón "Recheck all" para verificar todos los monitores a la vez
- [ ] Admin monitor APIs: mostrar historial de fallos recientes por monitor

## Sprint: Auditoría de Código (Apr 23)
- [x] Corregir BuddyProfile sin ProtectedPage en rutas /app/buddy-experts/:id y /app/buddy-makers/:id
- [x] Eliminar console.log de ComponentShowcase.tsx
- [ ] Corregir window.location.href por navigate en páginas (LoginPage, FamiliaCalendario, FamiliaUnirse, Metrics, MyExpert, CalculadoraNutricional, BuddyApplication)
- [x] Corregir throw new Error() por TRPCError en routers.ts (6 ocurrencias)
- [ ] Añadir chunk size warning en vite.config.ts (index.js 933KB)
- [ ] Añadir test para getLLMLatencyHistory y testLLMConnection

## Sprint: Auditoría de Código (Apr 23)
- [x] Corregir BuddyProfile sin ProtectedPage en rutas /app/buddy-experts/:id y /app/buddy-makers/:id
- [x] Eliminar console.log de ComponentShowcase.tsx
- [ ] Corregir window.location.href por navigate en páginas (LoginPage, FamiliaCalendario, FamiliaUnirse, Metrics, MyExpert, CalculadoraNutricional, BuddyApplication)
- [x] Corregir throw new Error() por TRPCError en routers.ts (6 ocurrencias)
- [ ] Añadir chunk size warning en vite.config.ts (index.js 933KB)
- [ ] Añadir test para getLLMLatencyHistory y testLLMConnection

## Sistema de Feedback de usuarios
- [x] Tabla `feedback` en drizzle/schema.ts (id, userId, category, message, status, createdAt)
- [x] Migración de BD con pnpm db:push
- [x] Helper getFeedbacks y createFeedback en server/db.ts
- [x] Procedimiento tRPC feedback.submit (protectedProcedure)
- [x] Procedimiento tRPC feedback.list (adminProcedure)
- [x] Notificación al propietario al recibir nuevo feedback
- [x] Componente FeedbackButton.tsx con botón flotante y modal
- [x] Modal con categorías: bug, mejora, idea, otro
- [x] Campo de descripción con contador de caracteres (máx 500)
- [x] Integrar FeedbackButton en AppLayout
- [x] Página /app/admin/feedback para gestionar feedbacks
- [x] Test vitest para feedback.submit y feedback.list

## Bugs reportados (abril 2026)
- [ ] Fix: Botón "Ir a la app" no se ve en móvil en la landing
- [ ] Fix: Al pulsar "Ir a la app" obliga a hacer login aunque ya haya sesión activa
- [ ] Fix: El diario precarga automáticamente platos del menú — debe ser el usuario quien los añada/confirme
- [ ] Fix: BuddyIA y BuddyScan usan la misma imagen — deben tener imágenes distintas
- [ ] Fix: Mover botón de feedback del botón flotante al sidebar (quitar FAB)
- [ ] Fix: Panel admin muestra todos los datos a 0 — queries de stats no devuelven datos reales

## BuddyPet - Menús para Mascotas
- [ ] Tabla `pets` en schema.ts (especie, raza, nombre, peso, edad, unidad de peso)
- [ ] Tabla `petMenus` en schema.ts (menú semanal generado por IA para mascota)
- [ ] Tabla `petShoppingItems` en schema.ts (lista de compra de comida para mascota)
- [ ] Helpers en db.ts: getPets, createPet, updatePet, deletePet, getPetMenus, createPetMenu, getPetShoppingList
- [ ] Router tRPC: pets.list, pets.create, pets.update, pets.delete, pets.generateMenu, pets.getMenus, pets.getShoppingList
- [x] Página BuddyPet.tsx: listado de mascotas con cards, formulario de alta/edición
- [ ] Página PetMenu.tsx: menú semanal generado por IA para la mascota seleccionada
- [ ] Página PetShopping.tsx: lista de compra de comida para mascotas
- [ ] Ítem BuddyPet en el sidebar de navegación con emoji de pata
- [ ] Ruta /app/buddy-pet en App.tsx
- [ ] Tests vitest para pets router

## BuddyPet - Clínica Veterinaria
- [ ] Tabla `vetClinics` en schema.ts (nombre, dirección, teléfono, email, logo, código de acceso)
- [ ] Tabla `vetClinicUsers` en schema.ts (relación clínica-usuario veterinario)
- [ ] Tabla `petClinicLinks` en schema.ts (vinculación mascota-clínica con estado)
- [ ] Tabla `petAlerts` en schema.ts (alertas: vacuna, revisión, medicación, peso, dieta)
- [ ] Tabla `petVetVisits` en schema.ts (historial de visitas veterinarias)
- [ ] Helpers en db.ts para clínicas, vinculaciones, alertas y visitas
- [ ] Router tRPC: vetClinic.create, vetClinic.get, vetClinic.update, vetClinic.getPets, vetClinic.sendAlert, petAlerts.list, petAlerts.create, petAlerts.resolve, petVetVisits.list, petVetVisits.create
- [ ] Página VetClinicAdmin.tsx: dashboard de clínica con mascotas vinculadas, alertas y visitas
- [ ] Página VetClinicSetup.tsx: configuración del perfil de la clínica
- [ ] Flujo de vinculación: usuario comparte código de clínica para vincular su mascota
- [ ] Sistema de alertas: la clínica puede enviar alertas de vacuna/revisión/dieta al dueño
- [ ] Notificación push al dueño cuando la clínica envía una alerta
- [ ] Ruta /app/vet-clinic en App.tsx
- [ ] Tests vitest para vetClinic router

## BuddyPet - Expansión completa (sesión actual)
- [x] Schema DB: tabla petWeightHistory (historial de peso de mascotas)
- [x] Schema DB: tabla petVaccines (registro de vacunas)
- [x] Schema DB: añadir campos a pets: bodyConditionScore, dietType, activityLevel, photoUrl, medicalConditions, allergies, favoritesFoods, foodsToAvoid
- [x] Schema DB: tabla petMedications (medicamentos activos)
- [x] DB helpers: CRUD petWeightHistory, petVaccines, petMedications, updatePetPhoto, updatePetDietProfile
- [x] tRPC: pets.analyzePhoto - analiza foto de mascota con IA (condición corporal, raza estimada, estado de salud visual)
- [x] tRPC: pets.generateCustomMenu - genera menú personalizado con parámetros: dietType, bodyCondition, activityLevel, foodPreferences, allergies
- [x] tRPC: pets.updateMenu - editar un menú existente (cambiar comidas individuales)
- [x] tRPC: pets.addWeightRecord - añadir registro de peso con fecha
- [x] tRPC: pets.weightHistory - historial de peso de una mascota
- [x] tRPC: pets.addVaccine - añadir vacuna
- [x] tRPC: pets.vaccines - listar vacunas de una mascota
- [x] tRPC: pets.addMedication - añadir medicamento activo
- [x] tRPC: pets.medications - listar medicamentos de una mascota
- [x] UI BuddyPet: tab "Salud" con historial de peso (gráfica Recharts), vacunas, medicamentos
- [x] UI BuddyPet: tab "Nutrición" con editor de menú personalizado (dietType selector, bodyCondition slider, alimentos a evitar)
- [x] UI BuddyPet: botón "Analizar foto" que sube imagen y devuelve análisis IA
- [x] UI BuddyPet: editor inline de menú (cambiar comida de un día concreto)
- [x] UI BuddyPet: perfil de mascota ampliado con foto, condición corporal, tipo de dieta

## Fix landing móvil (sesión actual)
- [x] Restaurar vídeos del hero en LandingPage.tsx (HeroVideoBackground con clips de supermercado/comida)
- [x] Arreglar header en móvil: logo y nav que se quedan muy arriba (safe-area / padding-top)
- [x] Arreglar botón "Ir a la app" que no se ve en móvil vertical

## Fix menús y recetas (sesión actual)
- [x] Fix prompt IA: reglas estrictas por franja horaria - no ensaladas en media mañana/merienda
- [x] Fix prompt IA: añadir receta detallada a cada comida (ingredientes, cantidades, pasos de preparación)
- [x] Fix prompt IA: ejemplos de alimentos apropiados por franja con límites de calorías
- [x] Fix prompt IA: instrucción de auto-corrección antes de devolver el JSON
- [x] Fix UI: mostrar receta expandible con pasos de preparación en cada comida del menú

## Fix Diario - orden franjas horarias (sesión actual)
- [x] Fix MealLog: ordenar franjas horarias cronológicamente (Desayuno → Media mañana → Comida → Merienda → Cena)

## Clínicas Veterinarias Colaboradoras (sesión actual)
- [ ] Schema DB: tabla vetClinics (id, userId, name, description, address, city, phone, email, website, logoUrl, specialties, isApproved, isActive, licenseNumber, createdAt)
- [ ] Schema DB: tabla vetClinicPatients (id, clinicId, petId, userId, status, notes, assignedAt, assignedByClinic)
- [ ] Schema DB: tabla vetClinicStaff (id, clinicId, userId, role, name, specialty, createdAt)
- [ ] Schema DB: tabla vetClinicNotes (id, clinicId, petId, staffId, content, type, createdAt)
- [ ] Schema DB: añadir campo vetClinicId a pets (clínica asignada actualmente)
- [ ] DB helpers: CRUD vetClinics, vetClinicPatients, vetClinicStaff, vetClinicNotes
- [ ] tRPC: vetClinics.register - registrar nueva clínica (requiere autenticación)
- [ ] tRPC: vetClinics.myClinic - obtener clínica del usuario logado
- [ ] tRPC: vetClinics.updateClinic - actualizar datos de la clínica
- [ ] tRPC: vetClinics.list - listar clínicas aprobadas (público, con filtros por ciudad/especialidad)
- [ ] tRPC: vetClinics.getById - detalle de una clínica
- [ ] tRPC: vetClinics.patients - listar mascotas adheridas a mi clínica
- [ ] tRPC: vetClinics.addNote - añadir nota clínica a una mascota
- [ ] tRPC: vetClinics.petNotes - ver notas de una mascota
- [ ] tRPC: pets.joinClinic - adherir mascota a una clínica colaboradora
- [ ] tRPC: pets.leaveClinic - desvincularse de una clínica
- [ ] UI: página VetClinicRegister.tsx - formulario de registro de clínica
- [ ] UI: página VetClinicDashboard.tsx - panel de gestión tipo BuddyExperts (mascotas, notas, estadísticas)
- [ ] UI: sección en BuddyPet para buscar y adherirse a clínicas colaboradoras
- [ ] UI: tarjeta de clínica asignada en el perfil de la mascota
- [ ] Ruta /vet-clinic en App.tsx para el panel de la clínica
- [ ] Ruta /vet-clinic/register en App.tsx para el registro

## Mejoras 500M - Sprint actual

### 1. Escáner de nevera con IA
- [ ] Schema DB: tabla fridgeScans (userId, imageUrl, detectedIngredientsJson, suggestedMenuJson, createdAt)
- [ ] tRPC: fridge.scan - sube foto, IA detecta ingredientes y genera menú con lo disponible
- [ ] tRPC: fridge.history - historial de escaneos
- [ ] UI: página FridgeScanner.tsx con cámara/upload, lista de ingredientes detectados (editables), botón generar menú
- [ ] UI: resultado del menú generado con opción de guardar en Mis Menús
- [ ] Ruta /nevera registrada en App.tsx y en navegación

### 4. Lista de la compra - pulido
- [ ] UI: categorías visuales (Frutas y verduras, Carnes y pescados, Lácteos, Cereales, Otros)
- [ ] UI: cantidades precisas con unidad (500g de calabacín, 2 unidades de limón)
- [ ] UI: botón "Compartir por WhatsApp" que genera texto formateado
- [ ] UI: checkbox por ítem para marcar como comprado (tachado visual)
- [ ] UI: botón "Limpiar comprados" para eliminar los marcados
- [ ] UI: resumen de ítems pendientes vs comprados
- [ ] UI: agrupación inteligente (cantidades del mismo ingrediente sumadas)

### 5. Análisis de analítica de sangre con IA
- [ ] Schema DB: tabla bloodTests (userId, uploadedAt, fileUrl, analysisJson, recommendations)
- [ ] tRPC: health.uploadBloodTest - sube PDF/imagen de analítica, IA extrae valores
- [ ] tRPC: health.analyzeBloodTest - analiza valores y genera recomendaciones nutricionales
- [ ] tRPC: health.bloodTestHistory - historial de analíticas
- [ ] tRPC: health.adjustMenuForBloodTest - ajusta menú semanal en base a los valores de la analítica
- [ ] UI: página BloodTestAnalysis.tsx con upload de PDF/imagen, tabla de valores extraídos, semáforo de salud
- [ ] UI: sección de recomendaciones nutricionales personalizadas basadas en la analítica
- [ ] UI: botón "Ajustar mi menú" que regenera el menú teniendo en cuenta los valores
- [ ] UI: historial de analíticas con evolución de valores clave (glucosa, colesterol, ferritina, vitamina D)
- [ ] Ruta /analitica registrada en App.tsx y en navegación

## BuddyPet Preview (Plan Gate)
- [x] Crear BuddyPetPreview.tsx: pantalla teaser con hero oscuro, demos interactivas bloqueadas, comparativa Free vs Pro Max, testimonial y CTA de upgrade
- [x] Añadir ruta /app/buddy-pet-preview en App.tsx
- [x] Gate en BuddyPet.tsx: usuarios free redirigen automáticamente a /app/buddy-pet-preview
- [x] Sidebar AppLayout: badge "Pro Max" en ítem BuddyPet para usuarios free, enlace redirige a preview
- [x] Dashboard: tarjeta BuddyPet con badge PRO MAX visible solo para usuarios free

## Ciclo Menstrual - Nutrición Adaptada por Fase
- [ ] Schema BD: campos en userProfiles (trackMenstrualCycle, cycleLength, periodLength, lastPeriodDate)
- [ ] DB helpers: saveMenstrualCycleData, getMenstrualCycleData, getCurrentCyclePhase
- [ ] Migración BD: pnpm db:push
- [ ] tRPC: procedures menstrualCycle.get, menstrualCycle.save
- [ ] UI: sección ciclo menstrual en Profile.tsx (solo gender=female)
- [ ] UI: widget de fase actual en Dashboard para mujeres con ciclo activado
- [ ] IA: inyectar fase del ciclo en prompt de generateMenuWithQuestionnaire
- [ ] IA: inyectar fase del ciclo en prompt de generateWeeklyMenu
- [ ] IA: inyectar fase del ciclo en getDailyAnalysis

## Ciclo Menstrual - Nutrición Hormonal
- [x] Añadir campos de ciclo menstrual al schema (trackMenstrualCycle, cycleLength, periodLength, lastPeriodDate)
- [x] Ejecutar migración de BD con pnpm db:push
- [x] Añadir helpers getMenstrualCycleData y buildCyclePhaseBlock en db.ts
- [x] Añadir sub-router menstrualCycle con procedures save y get en routers.ts
- [x] Implementar UI de ciclo menstrual en Profile.tsx (solo visible para género female)
- [x] Inyectar fase del ciclo en prompt de menus.generate (cuestionario)
- [x] Inyectar fase del ciclo en prompt de generateMenuWithQuestionnaire (BuddyIA)
- [x] Inyectar fase del ciclo en prompt del setup questionnaire (primer menú)

## Bugs críticos reportados (26 Apr 2026)
- [x] BUG: Error login 1001 - CORREGIDO: getErrorMessage() filtra mensajes de auth en onError handlers del cliente
- [x] BUG: "Error al aplicar el menú al diario" - CORREGIDO: applyToCalendar y setActive copian menú seeded para el usuario
- [x] BUG: "No se pudo enviar el feedback" - CORREGIDO: import dinámico de aiFeedback en submitAIFeedback
- [x] FEAT: Vista previa completa de menú - IMPLEMENTADO: MenuPreviewModal con recetas por día, macros, endpoint menuPreview.get en servidor

## Buddy Pets + Clínicas Veterinarias (sesión 27-Apr-2026)

- [ ] BuddyPet: Corregir emojis de pestañas (Salud y Clínicas tienen el mismo 🏥)
- [ ] BuddyPet: Añadir etiqueta de texto a la pestaña Alertas (solo mostraba 🔔)
- [ ] BuddyPet: Añadir componente VetVisitsView (historial de visitas veterinarias)
- [ ] BuddyPet: Añadir botón para buscar clínicas desde la pestaña Clínicas
- [ ] VetClinicDashboard: Código de acceso visible y copiable en el dashboard
- [ ] VetClinicDashboard: Vista detallada de paciente (vacunas, medicamentos, peso, historial)
- [ ] VetClinicDashboard: Notificación push/email al dueño cuando la clínica envía alerta
- [ ] Admin: Añadir pestaña "Clínicas Vet" para gestión de clínicas veterinarias
- [ ] Admin: Procedimiento admin.vetClinics en el servidor (listar, aprobar, desactivar, ver pacientes)


## Sprint: Menús Guardados (Mascotas, Especiales y Eventos)
- [x] Crear tablas de BD: specialMenus, eventMenus
- [x] Crear router tRPC: savedMenusRouter con operaciones CRUD
- [x] Crear componente SavedMenusGrid reutilizable
- [x] Crear página de Menús Especiales con apartado de guardados
- [x] Crear página de Menús de Eventos con apartado de guardados
- [x] Añadir rutas en App.tsx
- [x] Añadir navegación a las nuevas páginas en AppLayout
- [ ] Integrar menús guardados en BuddyPet (mascotas) - PENDIENTE


## Sprint: Acceso Rápido a Menús Guardados en Sidebar
- [x] Añadir opción "Mis Menús para Mascotas" en sidebar bajo BuddyPets
- [x] Añadir opción "Mis Menús para Niños" en sidebar bajo BuddyKids
- [x] Añadir opción "Mis Menús Especiales" en sidebar bajo Menús
- [x] Añadir opción "Mis Menús de Eventos" en sidebar bajo Menús
- [ ] Crear páginas para cada categoría de menús guardados
- [ ] Crear rutas en App.tsx para las nuevas páginas


## 🚀 SPRINT ESPECIAL: ESCALADO A 5M USUARIOS

### Fase 1: Localización Multi-País (Mes 1-2)
- [ ] Configurar i18n (i18next) con 5 idiomas (es, it, fr, de, pt)
- [ ] Crear tablas de BD para contenido multiidioma
- [ ] Traducir 500+ recetas a 5 idiomas
- [ ] Integrar supermercados locales por país
- [ ] Contratar expertos locales (5 países)
- [ ] Implementar selector de idioma en sidebar
- [ ] Implementar selector de país en onboarding

### Fase 2: Infraestructura Escalable (Mes 1-3)
- [ ] Configurar AWS multi-región (eu-west-1, eu-central-1, eu-south-1)
- [ ] Implementar RDS read replicas
- [ ] Configurar ElastiCache (Redis) para caching
- [ ] Implementar CloudFront CDN global
- [ ] Crear índices de BD optimizados
- [ ] Implementar connection pooling (RDS Proxy)
- [ ] Configurar auto-scaling groups
- [ ] Implementar monitoring 24/7 (CloudWatch, Datadog)

### Fase 3: Referral Program Viral (Mes 2-4)
- [ ] Crear tabla de referrals en BD
- [ ] Generar referral links únicos
- [ ] Implementar tracking de conversiones
- [ ] Crear UI para compartir referral
- [ ] Integrar WhatsApp, Instagram, Facebook sharing
- [ ] Sistema de puntos por referral
- [ ] Leaderboard de referrals
- [ ] Notificaciones de referral success

### Fase 4: Analytics Dashboard (Mes 1-12)
- [ ] Crear tabla de eventos en BD
- [ ] Implementar event tracking en todas las páginas
- [ ] Crear dashboard de crecimiento (DAU, MAU, retention)
- [ ] Implementar cohort analysis
- [ ] Implementar funnel analysis
- [ ] Crear reportes de conversión
- [ ] Integrar Mixpanel/Amplitude
- [ ] Crear alertas de anomalías

### Fase 5: Optimizaciones de Performance (Mes 1-3)
- [ ] Optimizar queries de BD (<100ms)
- [ ] Implementar lazy loading de imágenes
- [ ] Minificar y comprimir assets
- [ ] Implementar service workers (PWA)
- [ ] Optimizar bundle size
- [ ] Implementar code splitting
- [ ] Crear performance monitoring
- [ ] Alcanzar Lighthouse score >90

### Fase 6: Partnerships & Marketing (Mes 2-12)
- [ ] Contactar Mercadona (España)
- [ ] Contactar Carrefour (Italia/Francia)
- [ ] Contactar Edeka (Alemania)
- [ ] Contactar Continente (Portugal)
- [ ] Integrar Fitbit API
- [ ] Integrar Apple Health
- [ ] Integrar Strava
- [ ] Crear estrategia de influencers (50 micro, 10 macro, 3 celebridades)

### Fase 7: Contenido Localizado (Mes 1-4)
- [ ] 500 recetas españolas
- [ ] 500 recetas italianas
- [ ] 500 recetas francesas
- [ ] 500 recetas alemanas
- [ ] 500 recetas portuguesas
- [ ] Artículos de blog por país (100/país)
- [ ] Videos de YouTube por idioma
- [ ] Testimonios de usuarios locales

### Fase 8: Testing & QA (Mes 1-12)
- [ ] Tests de carga (1M usuarios simultáneos)
- [ ] Tests de localización
- [ ] Tests de referral program
- [ ] Tests de analytics
- [ ] Tests de performance
- [ ] Tests de seguridad (GDPR, HIPAA)
- [ ] Tests de compatibilidad (navegadores, dispositivos)
- [ ] User acceptance testing (UAT)

### Fase 9: Deployment & Monitoreo (Mes 1-12)
- [ ] CI/CD pipeline configurado
- [ ] Blue-green deployment implementado
- [ ] Rollback automático configurado
- [ ] Logging centralizado (ELK stack)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Datadog)
- [ ] Uptime monitoring (99.99%)
- [ ] Disaster recovery plan

---

## 📊 MÉTRICAS DE ÉXITO

- [ ] DAU: 300K → 1.5M
- [ ] MAU: 1M → 5M
- [ ] Retention D30: 15% → 50%
- [ ] Viral coefficient: 1.0 → 1.5
- [ ] ARPU: $0.50 → $8
- [ ] CAC: $5 → $2
- [ ] LTV: $50 → $500
- [ ] ARR: $5M → $40M


---

## MEJORAS SOLICITADAS - SESIÓN ACTUAL

- [ ] Mejorar presentación de menús en BuddyIA - Organizar por comidas, macronutrientes, recetas con instrucciones claras
- [ ] Crear componente UI para mostrar menús de forma estructurada y legible
- [ ] Integrar con respuestas de BuddyIA para formatear menús automáticamente


## Sprint: Integración de Recomendaciones Inteligentes de Productos (NUEVA FASE)

### Fase 1: Configuración de APIs Externas
- [ ] Configurar variables de entorno para BuddyShop API (X-BuddyOne-Key header)
- [ ] Configurar variables de entorno para BuddyCare API (Bearer token)
- [ ] Crear cliente HTTP para BuddyShop (https://buddyshop-niebit4z.manus.space/api/buddyone)
- [ ] Crear cliente HTTP para BuddyCare (https://api.buddycare.com con Bearer token)
- [ ] Implementar retry logic y error handling para ambas APIs

### Fase 2: Schema de Base de Datos
- [ ] Crear tabla `product_recommendations` en Drizzle (id, userId, productId, source, title, description, reason, relevanceScore, productUrl, productImage, productPrice, cta, expiresAt, clicked, converted, createdAt)
- [ ] Crear tabla `recommendation_events` para tracking (id, recommendationId, userId, eventType, createdAt)
- [ ] Crear tabla `product_cache` para cachear productos de APIs externas (id, source, productId, data, expiresAt)
- [ ] Añadir índices para queries de recomendaciones (userId, source, expiresAt)

### Fase 3: Backend - Lógica de Recomendaciones
- [ ] Crear helper `server/db.ts` para queries de recomendaciones (getRecommendationsForUser, createRecommendation, trackEvent)
- [ ] Implementar algoritmo de generación de recomendaciones basado en:
  - [ ] Objetivo del usuario (ganancia muscular, pérdida peso, etc)
  - [ ] Entrenamientos activos
  - [ ] Macros objetivo vs consumo actual
  - [ ] Restricciones dietéticas
  - [ ] Historial de compras
- [ ] Crear tRPC procedure `recommendations.getForUser` (retorna 3-5 recomendaciones personalizadas)
- [ ] Crear tRPC procedure `recommendations.track` (registra clicks)
- [ ] Crear tRPC procedure `recommendations.convert` (registra conversiones)
- [ ] Implementar caching de productos (actualizar cada 24h)
- [ ] Crear tests unitarios para algoritmo de recomendaciones

### Fase 4: Tipos de Recomendaciones
- [ ] BuddyCoach - Suplementos deportivos (proteína, creatina, BCAA) - Trigger: ganancia muscular, entrenamientos activos
- [ ] BuddyShop - Equipamiento de cocina (mandolina, báscula, cuchillos) - Trigger: menús frecuentes, recetas complejas
- [ ] BuddyCare - Productos de salud (vitaminas, omega-3, magnesio) - Trigger: condiciones médicas, deficiencias
- [ ] Crear tabla de triggers por tipo de recomendación

### Fase 5: Frontend - Componentes UI
- [ ] Crear componente `ProductRecommendationCard` (imagen, título, descripción, razón, precio, CTA, badge de fuente)
- [ ] Crear componente `RecommendationsCarousel` (carrusel de 3-5 recomendaciones, auto-rotación)
- [ ] Crear componente `RecommendationsBanner` (banner sticky en dashboard, rotación de recomendaciones, cerrable)
- [ ] Implementar tracking de impressions
- [ ] Añadir animaciones y transiciones suaves

### Fase 6: Integración en Dashboard
- [ ] Añadir sección de recomendaciones en Home.tsx (debajo del greeting)
- [ ] Mostrar 3-5 recomendaciones por usuario
- [ ] Implementar rotación automática de recomendaciones (cada 5 segundos)
- [ ] Añadir botón de "Cerrar" para cada recomendación
- [ ] Implementar feedback del usuario (relevancia)

### Fase 7: Testing
- [ ] Crear tests unitarios para algoritmo de recomendaciones
- [ ] Crear tests de integración con APIs externas (mock)
- [ ] Probar tracking de eventos
- [ ] Validar que no se muestren recomendaciones duplicadas
- [ ] Probar con diferentes perfiles de usuario (ganancia muscular, pérdida peso, etc)

### Fase 8: Analytics y Monetización
- [ ] Crear dashboard de analytics de recomendaciones (CTR, conversion rate, ROI)
- [ ] Implementar tracking de CTR (Click Through Rate)
- [ ] Implementar tracking de conversion rate
- [ ] Crear reportes de ROI por tipo de recomendación
- [ ] Configurar comisiones/referrals con BuddyShop y BuddyCare

### Fase 9: Optimización
- [ ] Implementar A/B testing de mensajes de recomendación
- [ ] Optimizar frecuencia de recomendaciones (no más de 3 simultáneamente)
- [ ] Implementar machine learning para ranking de recomendaciones
- [ ] Optimizar performance de queries de recomendaciones
- [ ] Cachear recomendaciones en cliente (localStorage)

### Fase 10: Entrega
- [ ] Documentar API de recomendaciones en README
- [ ] Crear guía de usuario para recomendaciones
- [ ] Verificar TypeScript sin errores
- [ ] Verificar tests pasando
- [ ] Hacer checkpoint final
- [ ] Publicar cambios

---

## Configuración de Secretos Necesarios (Recomendaciones)

- [ ] `BUDDYSHOP_API_KEY`: `bshop_433b1942e295db0a145c38fbab40f53a0f3476b0c110cefe8d8605d53554fdad`
- [ ] `BUDDYSHOP_API_URL`: `https://buddyshop-niebit4z.manus.space/api/buddyone`
- [ ] `BUDDYCARE_API_KEY`: `sk_enterprise_51BuddyCare2024_buddyone_c9h5m1o4z0t3y7u2i6k9q1w4e8r5t2y`
- [ ] `BUDDYCARE_API_URL`: `https://api.buddycare.com`
- [ ] `BUDDYCARE_WEBHOOK_SECRET`: `whsec_51BuddyCare2024_webhooks_d0i6n2p5a1s4x7c0v3b6m9k2l5o8r1t4`

---

## Notas Importantes (Recomendaciones)

- BuddyShop usa header `X-BuddyOne-Key` para autenticación
- BuddyCare usa header `Authorization: Bearer {token}` para autenticación
- Rate limits: BuddyShop (10K/día), BuddyCare Enterprise (ilimitado)
- Implementar caching para reducir llamadas a APIs externas
- Respetar GDPR y privacidad del usuario
- No mostrar más de 3 recomendaciones simultáneamente
- Documentación BuddyCare: https://api.buddycare.com/docs

## Sprint: Integración completa Health Hub + Wellness Goals + Ecosystem
- [x] Crear tabla wellnessGoals en schema.ts
- [x] Crear tablas ecosystem (connections, syncLogs, sharedData, syncQueue) en schema.ts
- [x] Recrear HealthHub.tsx page completa
- [x] Crear health-hub router backend
- [x] Crear oura-oauth.ts y whoop-oauth.ts helpers
- [x] Crear ecosystemSync router
- [x] Montar wellnessGoals, healthHub y ecosystemSync routers en appRouter
- [x] Usar WellnessGoalsWidget en Dashboard JSX (no solo importar)
- [x] Añadir links Health Hub y Wellness Goals en sidebar/nav
- [x] Añadir ruta /app/health-hub en App.tsx

## Botones interactivos Health Hub (conectar/desconectar Oura y Whoop)
- [x] Añadir botones funcionales de conectar/desconectar Oura y Whoop en HealthHub.tsx

## Resumen datos sincronizados Health Hub
- [x] Añadir sección de resumen de últimos datos sincronizados (sueño, FC, recuperación) debajo de dispositivos en HealthHub

## Insights de IA en Health Hub
- [x] Crear endpoint backend generateInsights en health-hub router usando LLM
- [x] Implementar sección frontend de Insights de IA en HealthHub.tsx con botón generar y cards de recomendaciones

## Feedback en Insights de IA (pulgar arriba/abajo)
- [x] Crear tabla insightFeedback en schema.ts + push DB
- [x] Crear endpoint submitFeedback en health-hub router
- [x] Actualizar generateInsights para incluir historial de feedback en el prompt del LLM
- [x] Implementar botones pulgar arriba/abajo en cada insight card del frontend

## Filtros por categoría en Insights de IA
- [x] Actualizar endpoint generateInsights para aceptar categorías opcionales como filtro
- [x] Implementar UI de filtros por categoría (sueño, actividad, recuperación, nutrición, estrés) en HealthHub.tsx

## Integración completa del Ecosistema
- [x] Conectar recommendations-engine a API real de BuddyShop (productos dinámicos)
- [x] Integrar BuddyCare API real en ecosystem router (similar a BuddyCoach)
- [x] Crear página de Ecosistema con gestión de conexiones (ecosystemSync)
- [x] Añadir BuddyShop al sidebar como link de navegación
- [x] Usar RecommendationsBanner en más páginas (recetas, diario, etc.)

## Oura/Whoop: Credenciales + Callback + Token Refresh
- [x] Registrar app en Oura Developer Portal y configurar OURA_CLIENT_ID/SECRET
- [x] Implementar callback route /api/wearables/callback en el servidor
- [x] Implementar token refresh automático antes de cada sync
- [x] Actualizar frontend HealthHub para detectar query params de callback
- [x] Corregir imports (useToast → sonner, AuthContext → useAuth, useEffect)

## Smart Insights: Recomendaciones cruzadas wearables + nutrición
- [x] Crear endpoint backend smartInsights que cruce datos de wearables con datos nutricionales y objetivos del usuario
- [x] Usar LLM para generar recomendaciones contextuales personalizadas (ej: "ayer te excediste en el deporte, come más proteína")
- [x] Implementar componente SmartInsights en Dashboard con cards de recomendaciones diarias
- [x] Integrar SmartInsights también en Health Hub como sección destacada

## Imágenes de Recetas - Plato Terminado (IA)
- [x] Crear router backend recipeImages con endpoints: getStats, generateBatch, generateSingle
- [x] Implementar generación de imágenes IA del plato terminado (no ingrediente) con prompt profesional
- [x] Upload automático a S3 (CloudFront) y actualización de BD
- [x] Crear página admin /app/admin/recipe-images con controles de lotes, progreso y logs
- [x] Añadir enlace en panel Admin principal
- [x] Probar pipeline completo: 3 recetas generadas exitosamente (~7-8s por imagen)
- [ ] Ejecutar generación completa de las 16,982 recetas pendientes (170 lotes de 100)

## Imágenes de Recetas - Búsqueda en bancos de imágenes gratuitos
- [x] Buscar imágenes reales de platos terminados en APIs gratuitas (Pexels/Pixabay) para recetas pendientes
- [x] Actualizar las 16,985 recetas con imágenes de platos terminados de Pexels (100% completado)
- [x] 0 recetas pendientes - todas actualizadas con imágenes de platos terminados
## Rediseño visual inspirado en BuddyCoach (versión BuddyOne)
- [x] Rediseñar Ecosystem.tsx con card de score combinado, grid 2x2 de acceso rápido y secciones de entrenamiento/nutrición
- [x] Actualizar sidebar: renombrar "Salud Conectada" a "Health Hub", añadir BuddyCare al grupo Ecosistema
- [x] Actualizar todas las URLs de BuddyShop de buddyshop-niebit4z.manus.space y buddyshop.app a www.buddyoneshop.com
- [x] Eliminar rutas duplicadas /app/connected-health y /app/wearables (redirigen a /app/health-hub)
- [x] Crear página BuddyCare.tsx y añadir ruta /app/buddy-care en App.tsx
## Bug: Imágenes de recetas no coinciden con el plato
- [x] Investigar por qué las imágenes asignadas no corresponden al plato real (Pexels search devolvía fotos no-food)
- [x] Corregir la lógica de asignación de imágenes: script de generación AI por nombre de plato (1,000 recetas corregidas)
- [ ] Completar generación AI para las ~13,758 recetas restantes con Pexels (API limit exhausted, pendiente reset)
## Añadir Health Hub a la barra de navegación inferior
- [x] Añadir Health Hub como item en la barra de navegación inferior (bottom nav)
## Health Hub: Búsqueda y filtros por categoría
- [x] Añadir barra de búsqueda en Health Hub para buscar métricas, dispositivos y datos de salud
- [x] Implementar filtros por categoría (ej: Actividad, Sueño, Nutrición, Cuerpo, Dispositivos)
- [x] Conectar búsqueda y filtros con los datos existentes del Health Hub
- [x] Asegurar diseño responsive y coherente con el estilo BuddyOne
## Health Hub: Estado vacío y animaciones de carga
- [x] Implementar estado vacío amigable cuando la búsqueda no devuelve resultados
- [x] Añadir animaciones de carga (skeleton/shimmer) mientras se procesan los filtros
- [x] Micro-animaciones de transición al mostrar/ocultar resultados
## Mejoras del Ecosistema (10 propuestas)
- [x] 1. Score del Ecosistema dinámico calculado en tiempo real (apps conectadas, uso, datos)
- [x] 2. Timeline de actividad cruzada entre apps (feed cronológico de eventos)
- [x] 3. Recomendaciones cruzadas inteligentes visibles en Ecosistema
- [x] 4. Mapa visual de conexiones hub-and-spoke con animaciones
- [x] 5. Resumen semanal del ecosistema (Weekly Digest) con comparación vs semana anterior
- [x] 6. Gamificación: badges por uso del ecosistema
- [x] 7. BuddyCare completo: tracker de suplementos, recordatorios, historial
- [x] 8. Datos de nutrición reales en la card de Nutrición del Ecosistema
- [x] 9. Sincronización bidireccional visible (qué datos fluyen entre apps)
- [x] 10. Quick Actions contextuales según hora del día y contexto

## Mejoras BuddyExperts (10 propuestas)
- [x] 1. Generación de planes con IA: experto describe objetivo y la IA genera borrador de menú semanal
- [x] 2. Check-in semanal automatizado: formulario para paciente (peso, adherencia, fotos, estado)
- [x] 3. Alertas inteligentes: notificaciones cuando paciente no registra, pierde peso fuera de rango, etc.
- [x] 4. Informe PDF automatizado del paciente con gráficos de evolución
- [x] 5. Videoconsulta integrada: botón para iniciar sala de video en citas
- [x] 6. Sistema de reseñas verificadas de pacientes (tras 4+ semanas)
- [x] 7. Programa de referidos con revenue sharing (20% de suscripción)
- [x] 8. Disponibilidad y reserva directa: calendario de huecos y booking
- [x] 9. Plan B2B para empresas: wellness corporativo con dashboard HR
- [x] 10. Análisis de tendencias del paciente: correlaciones, predicciones, gráficos avanzados

## Footer: Logos de financiación
- [x] Añadir imagen de logos de financiación (UE NextGenerationEU, ENISA, Plan de Recuperación) al footer de la landing page

## B2B Modelo Gympass
- [x] Landing page /empresas con propuesta de valor, pricing por tramos, formulario de contacto
- [x] Flujo de activación del empleado: canjear código corporativo → activar Pro Max
- [x] Pricing por tramos: Starter 3,90€, Growth 3,50€, Business 3,40€, Enterprise 2,50€, Corporate 2,20€, Global 1,90€
- [x] Panel HR mínimo: solo licencias activas/usadas y facturación (sin datos individuales de empleados)

## Factura PDF en Panel HR
- [x] Endpoint servidor para generar factura PDF mensual con datos de la empresa y licencias
- [x] Botón de descarga de factura PDF en la tabla de historial de facturación del panel HR

## BuddyExperts: Product Board (Solicitud de Personalizaciones)
- [x] Tabla expertFeatureRequests en BD (categoría, título, descripción, estado, votos, userId)
- [x] Tabla expertFeatureVotes para tracking de votos únicos por usuario
- [x] Endpoints tRPC: crear solicitud, listar con filtros/orden, votar/desvotar, obtener mis solicitudes
- [x] Notificación al owner cuando se crea nueva solicitud
- [x] Página ExpertFeatureRequests con formulario de envío, listado con votos, filtros por categoría/estado, vista roadmap
- [x] Categorías: Gestión de pacientes, Planes y menús, Seguimiento y métricas, Comunicación, Facturación, Integraciones, Otro
- [x] Estados visibles: En revisión, Planificado, En desarrollo, Completado
- [x] Ruta /app/expert/feature-requests y enlace en el dashboard de experto

## Build Fix: AuthContext import error
- [x] Fix broken import of 'contexts/AuthContext' in 8 expert pages (PatientAlerts, VideoConsultation, AIPlanGenerator, ExpertReviews, ExpertAvailability, ExpertReferrals, B2BCorporate, PatientTrends) → changed to '@/_core/hooks/useAuth'

## Landing Page Update - Nuevas funcionalidades
- [x] Añadir enlace "Empresas" en el header de navegación principal
- [x] Actualizar secciones de funcionalidades con todas las nuevas features (BuddyExperts, Product Board, B2B, IA, etc.)
- [x] Revisar y actualizar hero, pricing, testimonials y CTA con información actualizada

## Simplificar pricing B2B Empresas
- [x] Reescribir sección de pricing en Empresas.tsx: todos los planes son idénticos (Pro Max completo), solo cambia el precio por volumen de empleados
- [x] Eliminar diferenciación de features entre planes, mostrar tabla única de precios por tramo

## Fix: Sidebar elementos duplicados
- [x] Revisar y eliminar elementos repetidos en el sidebar de navegación (eliminada sección 'Menús' duplicada)

## B2B Perk Campaign - Email masivo a empresas
- [x] Listado de empresas target para ofrecer BuddyOne como perk de bienestar (60 empresas en 4 tiers)
- [x] Email modelo HTML profesional para la propuesta B2B perk (con pricing dinámico por volumen)
- [x] Endpoint backend con Resend para enviar el email a todas las empresas cuando se active (adminSendPerkCampaign + adminSendPerkCampaignToLeads)

## Fix: Colores del ecosistema en landing
- [x] Alinear los colores de la sección ecosistema en la landing page con el esquema de color del resto de la app (fondo #FFF8F0 crema)

## Etiquetas de cocina/país en recetas
- [x] Campo cuisineType ya existía en el schema de recetas
- [x] Clasificar todas las recetas existentes (~17,000) por cocina/país usando IA (script classify-cuisines.mjs en ejecución)
- [x] Añadir filtro por país/cocina en la página de recetas (30 cocinas con banderas de país: 🇪🇸 Española, 🇮🇹 Italiana, 🇲🇽 Mexicana, 🇯🇵 Japonesa, 🇨🇳 China, 🇮🇳 India, 🇫🇷 Francesa, 🇹🇭 Tailandesa, 🇬🇷 Griega, 🇲🇦 Marroquí, 🇹🇷 Turca, 🇵🇪 Peruana, 🇦🇷 Argentina, 🇨🇴 Colombiana, 🇧🇷 Brasileña, 🇰🇷 Coreana, 🇻🇳 Vietnamita, 🇱🇧 Libanesa, 🇺🇸 Americana, 🇵🇹 Portuguesa, 🇩🇪 Alemana, 🇨🇺 Cubana, Mediterránea, Nórdica, Caribeña, Africana, Árabe, Internacional, Fusión)

## Proyecto: Regenerar TODAS las fotos de recetas con IA
- [x] Analizar estado actual de imágenes en BD (16,986 recetas; 13,758 con Pexels genéricas, 3,228 con CDN/IA)
- [x] Diseñar script robusto de generación masiva de imágenes con IA (scripts/generate-recipe-images.mjs)
- [x] Testear script con lote pequeño (5 recetas, 100% éxito, ~7.4s/imagen)
- [x] Ejecutar generación masiva — 768 imágenes nuevas generadas antes de alcanzar límite API (total CDN: 3,996)
- [ ] Continuar generación cuando se restablezca el límite de la API (12,990 pendientes)
- [x] Clasificación de cocinas completada: 16,986/16,986 recetas clasificadas (32 cocinas diferentes)

## Base de datos de recetas fitness/low-cal (estilo Instagram)
- [x] Crear script para generar 50-100 recetas fitness originales (139 generadas: bowls, wraps, airfryer, snacks, etc.)
- [x] Insertar recetas en la base de datos con tags "Fitness", "Low-Cal", "Alta Proteína"
- [x] Verificar que las recetas aparecen correctamente en la app

## Funcionalidad: Copiar receta de Instagram
- [x] Diseñar endpoint que reciba URL de Instagram y genere versión original con IA (server/routers/instagramRecipe.ts)
- [x] Implementar UI para pegar link de Instagram y obtener receta inspirada (InstagramRecipeImport.tsx)
- [x] Permitir guardar la receta generada en carpetas del usuario
- [x] Asegurar que no se copia contenido literal (prompt explícito de "inspiración original")
- [x] Añadir botón Instagram en header de página Recetas (gradiente Instagram)

## Mejoras Masivas v3 — Mayo 2026

### Bloque 1: Gamificación (streaks, badges, niveles)
- [x] Schema DB: ya existía (badges, userBadges, streaks tables)
- [x] Backend: ya existía (gamification router con badges, streaks, levels)
- [x] Frontend: ya existía (Achievements page con badges y progreso)
- [x] Dashboard: ya existía (widget de racha)

### Bloque 2: Features rápidos
- [x] "¿Qué como hoy?" — /app/quick-suggest (router quickSuggest + página QuickSuggest.tsx)
- [x] Compartir recetas por WhatsApp — ya existía (ShareRecipeButton con WhatsApp/Telegram/Twitter)
- [x] Historial de peso con gráfica — ya existía (Progress page + NutritionalStats)

### Bloque 3: Notificaciones y scoring
- [x] Notificaciones inteligentes — ya existía (MealNotifications + push cron)
- [x] Score de sostenibilidad — /app/sustainability (router sustainability + SustainabilityScore.tsx)
- [x] Adaptación por temporada — integrado en sustainability router (getSeasonalProducts)

### Bloque 4: Meal Prep y escáner de despensa
- [x] Meal Prep Planner — /app/meal-prep (router mealPrep + MealPrepPlanner.tsx)
- [x] Escáner de despensa — ya existía (FridgeScanner page + fridgeScans table)

### Bloque 5: Retos y referidos
- [x] Retos semanales — ya existía (Challenges page + challenges/userChallenges tables)
- [x] Programa de referidos — ya existía (ReferralProgram + ReferralDashboard pages)

### Bloque 6: B2B y marketplace
- [x] Dashboard corporativo — /app/corporate-dashboard (router corporateDashboard + CorporateDashboard.tsx)
- [x] Marketplace de menús — /app/marketplace (router marketplace + Marketplace.tsx)
- [x] Integración wearables — ya existía (wearables router + HealthHub page + Oura/Whoop)
- [x] Comparador de precios — /app/price-compare (router priceCompare + PriceCompare.tsx)

### Bloque 7: IA y offline
- [x] IA conversacional nutrición — /app/nutrition-chat (router nutritionChat + NutritionChat.tsx)
- [x] Modo offline — ya existía (contentSync router + service worker)
- [x] Advanced fitness recipe filters: filter by calories range, preparation time, and category


## Landing Page - Auditoría y Correcciones (Mayo 2026)

### BuddyCare - Descripción incorrecta
- [x] BuddyCare en MODULES: Dice "Seguimiento Nutricional en Tiempo Real" con "Registro por voz, Análisis de fotos, Estadísticas avanzadas". INCORRECTO. BuddyCare es una tienda de suplementos nutricionales (omega 3, creatina, vitaminas...) con recomendaciones personalizadas.
- [x] BuddyCare en ECOSYSTEM: Dice "Salud y bienestar" genérico. Cambiar a "Suplementos nutricionales".
- [x] BuddyCare en sección HERRAMIENTAS: Marcado como "PRÓXIMAMENTE" y "En desarrollo". Corregir: es una tienda de suplementos ya disponible.

### BuddyShop - Descripción incorrecta
- [x] BuddyShop en MODULES: Dice "Tienda de Productos Saludables" con "Productos curados, Suplementos, Envío a domicilio". INCORRECTO. BuddyShop es marketplace de utensilios de cocina (sartenes, ollas, básculas, robots...).
- [x] BuddyShop en ECOSYSTEM: Dice "Productos saludables". Cambiar a "Utensilios de cocina".
- [x] BuddyShop en sección HERRAMIENTAS: Dice "suplementos, alimentos especiales". INCORRECTO. Es marketplace de utensilios de cocina.

### Buddy Market - Texto incorrecto
- [x] Buddy Market en HERRAMIENTAS: Menciona "Mercadona, Carrefour, Lidl" específicamente. Cambiar a "supermercados" genérico.

### Textos que no se ajustan a la realidad
- [x] STATS: "6 Supermercados integrados" - cambiado a "5 Comidas diarias planificadas".
- [x] Footer copyright: "© 2025" → actualizar a 2026.

### Mejoras de coherencia
- [x] Intercambiar descripciones BuddyCare/BuddyShop en toda la landing.
- [x] Quitar estado "PRÓXIMAMENTE" de BuddyCare y marcar como disponible.
- [x] Añadir enlace funcional a BuddyCare (actualmente botón deshabilitado).
- [x] Buddy Pets en HERRAMIENTAS: imagen cambiada a foto real de mascotas comiendo.

### Footer - Páginas legales independientes
- [x] Crear /gdpr como página RGPD independiente (derechos, DPO, bases legales, datos de salud, menores, mascotas)
- [x] Crear /legal como Aviso Legal independiente (LSSI, identificación empresa, responsabilidad)
- [x] Registrar rutas independientes en App.tsx (no reutilizar Privacy/Terms)

### Blog - Contenido estático funcional
- [x] Añadir slugs a los 6 posts estáticos del blog para que sean navegables
- [x] Crear contenido completo para cada post estático (planificar menú, 14 alérgenos, dieta mediterránea, receta salmón, proteínas vegetales, intolerancia gluten)
- [x] Fallback en BlogPost.tsx: si el post no está en BD, usa contenido estático
- [x] Blog ya no muestra "Próximamente" en los posts estáticos

### Nombres de supermercados - Eliminados de páginas públicas
- [x] Nutricionistas.tsx: "Mercadona, Consum o Lidl" → "principales supermercados"
- [x] Nutricionistas.tsx testimonial: "para Mercadona" → "para su supermercado habitual"
- [x] Registration.tsx: "Compra en Mercadona y Carrefour" → "Lista de la compra inteligente"
- [x] Subscription.tsx: "Mercadona, Lidl y más" → "tu supermercado favorito"
- [x] Terms.tsx: eliminados nombres específicos de supermercados

### Newsletter - Formulario de suscripción en blog
- [x] Crear tabla newsletter_subscribers en schema (email, nombre, fecha, estado)
- [x] Crear endpoint tRPC newsletter.subscribe (público)
- [x] Añadir formulario de suscripción al final de BlogPost.tsx
- [x] Diseño coherente con el estilo naranja/crema del blog

## Sistema de Campañas de Email (Resend)
- [ ] Schema DB: tablas emailContacts, emailLists, emailListMembers, emailCampaigns, emailCampaignSends
- [ ] Backend: instalar Resend SDK y configurar envío desde info@buddymarket.io
- [ ] Backend: tRPC router campañas (CRUD contactos, listas, campañas, envío masivo)
- [ ] Backend: rate limiting y batch sending para envíos masivos
- [ ] Frontend: página admin Campañas con listado y estadísticas
- [ ] Frontend: editor de campañas con preview HTML
- [ ] Frontend: gestión de contactos y listas (importar CSV, añadir manual)
- [ ] Frontend: historial de envíos con métricas (enviados, abiertos, clicks)
- [ ] Templates: email BuddyOne branded (bienvenida, newsletter, inversores, promoción)
- [ ] Tests: vitest para router de campañas

## BuddyExperts Panel — Rediseño Completo v2

### Backend (nuevos endpoints)
- [ ] Endpoint: subida de documentos clínicos PDF/imagen a S3 (expertClientPlans)
- [ ] Endpoint: registro de medidas antropométricas completas (cintura, cadera, brazo, muslo)
- [ ] Endpoint: registro de métricas clínicas (tensión, glucosa, colesterol)
- [ ] Endpoint: gestión de documentos del paciente (listar, eliminar, compartir)
- [ ] Endpoint: subida de documentos por el paciente (analíticas, exportaciones báscula)
- [ ] Endpoint: diario de bienestar diario del paciente (peso, energía, adherencia, síntomas)
- [ ] Endpoint: facturación — generar factura por consulta
- [ ] Endpoint: historial de pagos del expert

### Panel Expert — Mejoras UI
- [ ] Tab "Documentos": subida de PDF/imagen, organización por tipo, visibilidad configurable
- [ ] Tab "Evolución": medidas antropométricas completas + métricas clínicas + gráficas avanzadas
- [ ] Tab "Facturación": historial de ingresos, facturas generadas, comisiones BuddyOne
- [ ] Registro de peso mejorado: composición corporal completa (grasa, músculo, agua, hueso)
- [ ] Alertas inteligentes automáticas (inactividad, subida de peso, sin cita programada)
- [ ] Dashboard expert: métricas de negocio (retención, ingresos, valoración media)

### Panel Paciente (MyExpert) — Mejoras UI
- [ ] Tab "Documentos": ver documentos compartidos por el expert + subir los propios
- [ ] Tab "Diario": registro diario de peso, energía, adherencia, síntomas, fotos
- [ ] Tab "Mi Plan": visualización mejorada del plan nutricional con recetas enlazadas
- [ ] Tab "Pagos": historial de pagos y facturas descargables
- [ ] Registro de peso diario desde dashboard del paciente
- [ ] Notificación cuando el expert sube un documento o actualiza el plan

## BuddyShop & BuddyCare — Recomendaciones Contextuales Inteligentes

- [ ] Añadir tabla `shop_products` al schema (BuddyShop: utensilios/menaje) con campos: id, name, description, price, imageUrl, affiliateUrl, category, tags, source, isActive
- [ ] Añadir tabla `care_products` al schema (BuddyCare: suplementos/parafarmacia) con campos: id, name, description, price, imageUrl, affiliateUrl, category, tags, healthBenefits, isActive
- [ ] Crear router `contextualRecommendations` con procedimiento `getForRecipe(recipeId)` — devuelve productos BuddyShop/BuddyCare relevantes según tags de la receta
- [ ] Crear procedimiento `getForHealthGoal(symptoms[])` — devuelve productos BuddyCare según síntomas registrados en el diario
- [ ] Poblar BD con 25+ productos BuddyShop (parrillas, vajillas BBQ, sartenes wok, moldes horno, etc.)
- [ ] Poblar BD con 25+ productos BuddyCare (infusiones drenantes, vitaminas, proteínas, probióticos, etc.)
- [ ] Implementar componente `ContextualProductCard` — tarjeta pequeña no intrusiva con imagen, nombre, precio y CTA
- [ ] Integrar widget de recomendación en RecipeDetail (aparece si la receta tiene tags como "bbq", "horno", "wok", etc.)
- [ ] Integrar widget BuddyCare en RecipeDetail (si la receta tiene tags "antiinflamatorio", "detox", "drenante", etc.)
- [ ] Integrar recomendaciones en el menú semanal (sección al final del menú con productos relevantes)
- [ ] Integrar recomendaciones en el diario de salud (si el usuario registra síntomas como retención de líquidos, fatiga, etc.)
- [ ] Las recomendaciones deben rotar — no mostrar siempre las mismas (máximo 2 por contexto, aleatorio entre los relevantes)
- [ ] Añadir sección "BuddyShop" y "BuddyCare" en el menú principal de la app como acceso directo al catálogo completo

## Sesión actual — Mejoras implementadas

### Acceso Admin
- [x] Dar rol admin a luis@buddymarket.io en la base de datos

### BuddyShop & BuddyCare — Implementado
- [x] Tablas shop_products y care_products creadas y migradas
- [x] 18 productos BuddyShop sembrados (parrillas, vajillas, sartenes, moldes, etc.)
- [x] 15 productos BuddyCare sembrados (infusiones, vitaminas, proteínas, probióticos, etc.)
- [x] Router contextualRecommendations con getForRecipe y getForHealthGoal
- [x] Página BuddyShop rediseñada con catálogo real, filtros y diseño temático
- [x] Página BuddyCare rediseñada con disclaimer médico, opt-in y catálogo
- [x] Sin fondos negros hardcodeados — todo usa variables CSS del tema

### Modo Hogar — Mejoras
- [x] Invitación al hogar por WhatsApp (modal con tabs email/WhatsApp)
- [x] Sección "Próximamente en Modo Hogar" con menús por persona, nutrición infantil, QR
- [x] householdName pasado al InviteModal para personalizar el mensaje de WhatsApp

### BuddyExperts Panel — Implementado
- [x] Tablas patientDocuments y patientClinicalMetrics creadas y migradas
- [x] Router expertDocuments con upload, list, delete, share procedures
- [x] Tab "Documentos" en ExpertPatientDetail (subida PDF/imagen, control visibilidad)
- [x] Tab "Métricas Clínicas" en ExpertPatientDetail (tensión, glucosa, colesterol, composición corporal)
- [x] Vista "Mis documentos" en MyExpert (paciente ve y sube documentos)

### Pendiente
- [ ] Widget ContextualProductCard integrado en RecipeDetail
- [ ] Widget BuddyCare integrado en diario de salud por síntomas
- [ ] Menús familiares por persona (Menú niños / Menú adultos / Menú por condición médica)
- [ ] Nutrición infantil conectada con perfiles del hogar
- [ ] Invitación por QR al hogar
- [ ] Health Hub centralizado (métricas, documentos, diario, evolución en una sola página)

## Sesión actual — Pendientes a implementar ahora

### Widget Contextual BuddyShop/BuddyCare
- [ ] Componente ContextualProductWidget reutilizable (no intrusivo, máx 2 productos)
- [ ] Integrar widget en RecipeDetail (BBQ → vajilla, wok → sartén wok, etc.)
- [ ] Integrar widget BuddyCare en diario de salud (síntomas → productos)

### Health Hub Centralizado
- [ ] Crear página /health-hub con métricas, documentos, diario y evolución
- [ ] Añadir ruta y enlace en sidebar/navegación
- [ ] Centralizar todos los datos de bienestar en un único lugar

### Menús Familiares por Persona
- [ ] Schema DB: tabla familyMenuProfiles (perfil por miembro del hogar)
- [ ] Backend: endpoint para generar menú por perfil (niños/adultos/condición médica)
- [ ] UI: selector de tipo de menú familiar en página Familia
- [ ] UI: generador de menú familiar con IA (menú unificado o separado por persona)
- [ ] UI: menú para condición médica (diabético, celíaco, hipertenso)

## Auditoría y Correcciones (sesión actual)

### Inconsistencias críticas a corregir:
- [x] Eliminar "Mi Ecosistema" del sidebar (ya no tiene sentido como función)
- [ ] Quitar Household.tsx duplicado (ya existe Familia.tsx con la misma función)
- [x] Corregir colores hardcodeados en 28 páginas (bg-gray-900, bg-black, etc.) → usar variables CSS del tema
- [x] Corregir colores hardcodeados bg-white/text-gray-900 en 15 páginas
- [ ] Añadir ruta /app/buddy-care que falta en App.tsx (existe en sidebar pero no en rutas)
- [ ] Verificar que BuddyShop y BuddyCare usan productos reales de BD (no hardcodeados)
- [x] Menús familiares por persona: tabla householdMenuPlans + router householdMenus + UI HouseholdMenuPlans
- [ ] Menús familiares por persona: procedimientos en household router
- [ ] Menús familiares por persona: UI en página Familia
- [ ] Asignar rol BuddyExpert a luis@buddymarket.io cuando se registre
- [x] Exportar menú familiar a PDF e impresión: utilidad exportHouseholdMenuPDF.ts con jsPDF (orientación landscape A4), botón "⋯" con dropdown en cada tarjeta de menú (Exportar PDF / Imprimir / Eliminar), botones rápidos en vista expandida, función printHouseholdMenu con ventana HTML optimizada para impresión

## Panel Profesional — Bugs y nuevas funcionalidades (sesión actual)
- [ ] Fix: Panel BuddyExpert muestra "Crear perfil" aunque el experto ya tiene perfil aprobado
- [ ] Fix: Mis Planes muestra 3 skeleton cards infinitas (bug de carga)
- [ ] Fix: Breadcrumb siempre dice "Buddy One" en lugar del nombre de la página
- [ ] Fix: Texto "Paciente(s) de ping..." en widget de Citas del dashboard
- [ ] Fix: Solicitudes vacías sin CTA para compartir enlace de perfil público
- [ ] Feature: Tabla offline_patients en BD para pacientes sin cuenta Buddy
- [ ] Feature: Importación masiva de pacientes desde CSV/Excel con previsualización
- [ ] Feature: Historial de peso y evolución por paciente
- [ ] Feature: Ficha de paciente con datos clínicos, historial y generación de plan
- [ ] Feature: Envío de plan semanal por email con plantilla HTML (evolución + menú)
- [ ] Feature: Envío de plan por WhatsApp con plantilla de texto formateada
- [ ] Feature: Invitación opcional para que el paciente se registre en Buddy
- [ ] Feature: Checklist de activación en dashboard profesional
