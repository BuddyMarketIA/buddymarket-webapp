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
