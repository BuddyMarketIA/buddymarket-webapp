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
- [ ] Onboarding guiado para nuevos usuarios
- [ ] Notificación por email en nuevos registros
- [ ] Exportación de datos del perfil
- [ ] Modo oscuro
- [ ] PWA / App móvil
- [ ] Recetas favoritas
- [ ] Recomendaciones personalizadas de recetas

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

## Sprint Menús Predefinidos + Lista de la Compra Inteligente
- [ ] Generar 50 menús semanales predefinidos por objetivo (pérdida de peso, ganancia muscular, tonificación, pérdida de grasa, mantenimiento, volumen, definición, salud cardiovascular, antiinflamatorio, vegano)
- [ ] Insertar 50 menús en BD con recetas asociadas por momento del día
- [ ] Schema DB: añadir campo `persons` (número de personas) a menus y shoppingLists
- [ ] Schema DB: añadir campo `supermarket` a shoppingLists
- [ ] tRPC: endpoint para guardar menú de biblioteca al perfil del usuario
- [ ] tRPC: endpoint para generar lista de la compra automática desde menú con personas y supermercado
- [ ] Página Biblioteca de Menús: 50 menús filtrables por objetivo, duración, calorías, con botón Guardar
- [ ] Lista de la Compra: selector de supermercado y número de personas al generar desde menú
- [ ] Ajuste automático de cantidades de ingredientes según número de personas

## Sprint Imágenes Reales para Recetas
- [ ] Buscar imágenes reales por nombre de receta (Unsplash API) y actualizar imageUrl en BD para las 427 recetas
- [ ] Actualizar Lista de la Compra: generador automático desde menú con selector de supermercado y número de personas
- [ ] Añadir enlace Biblioteca de Menús en sidebar y Dashboard

## Sprint BuddyIA Cuestionario + Guardar Menú
- [ ] tRPC router: procedimiento generateMenuWithQuestionnaire (fecha, estilo cocina, personas, comidas/día, objetivo, alergias)
- [ ] BuddyIA: flujo cuestionario paso a paso antes de generar menú (6 preguntas)
- [ ] BuddyIA: visualización del menú generado con cards por día y momento del día
- [ ] BuddyIA: botón "Guardar menú" que lo guarda en el planificador
- [ ] BuddyIA: botón "Crear lista de la compra" desde el menú generado
- [ ] Estilos de cocina: batch cooking, tuppers, comida rápida, trabajo, restaurante
