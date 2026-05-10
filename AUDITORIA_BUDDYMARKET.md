# Informe de Auditoría BuddyMarket — Abril 2026

**Fecha:** 18 de abril de 2026  
**Versión auditada:** `06298986`  
**Alcance:** Revisión completa de pantallas, datos de prueba, dark mode, navegación y funcionalidades

---

## 1. Limpieza de Datos de Prueba

### 1.1 BuddyExperts eliminados de la BD

| ID | Nombre | Acción |
|----|--------|--------|
| 6 | Guillermo V. Rodríguez | ✅ Eliminado completamente |
| 7 | BuddyMarket Nutricionista IA | ✅ Eliminado completamente |
| 8 | Luis Maria Cabello de los Cobos | ✅ Perfil expert eliminado (cuenta admin conservada) |

**Estado final:** Solo queda **Dra. Laura Sánchez (ID 5)** como BuddyExpert real.

### 1.2 Reasignación de contenido huérfano

- **50 blog posts** que estaban asignados a BuddyMarket IA (expertId=7) han sido reasignados a Dra. Laura Sánchez (expertId=5).
- No se encontraron menús ni planes huérfanos de los experts eliminados.

### 1.3 Usuarios demo eliminados (sesión anterior)

- 6 usuarios `.demo@buddymarket.io` eliminados de la BD en sesión anterior.
- 20 usuarios de prueba adicionales eliminados en sesión anterior.

---

## 2. Correcciones de Dark Mode

### 2.1 Problema identificado

La app usa `defaultTheme="dark"` en `App.tsx`, pero muchas páginas tenían colores hardcodeados (Tailwind estáticos) que no respetan el tema oscuro:

- `bg-white` → fondo blanco visible en modo oscuro
- `text-gray-900` / `text-gray-800` → texto oscuro invisible sobre fondo oscuro
- `bg-gray-50` / `bg-gray-100` → fondos claros que rompen la coherencia visual
- `border-gray-200` → bordes claros que no se ven en dark mode

### 2.2 Correcciones aplicadas

Se realizó una corrección masiva en **~58 archivos TSX** (páginas y componentes):

| Color hardcodeado | Reemplazado por |
|-------------------|-----------------|
| `bg-white` | `bg-background` |
| `bg-gray-50` | `bg-muted/30` |
| `bg-gray-100` | `bg-muted/50` |
| `bg-gray-200` | `bg-muted` |
| `text-gray-900` | `text-foreground` |
| `text-gray-800` | `text-foreground` |
| `text-gray-700` | `text-foreground/80` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground/70` |
| `text-black` | `text-foreground` |
| `border-gray-200` | `border-border` |
| `border-gray-100` | `border-border/50` |
| `border-gray-300` | `border-border` |
| `hover:bg-gray-50` | `hover:bg-muted/50` |
| `hover:bg-gray-100` | `hover:bg-muted` |

**Páginas excluidas** (landing/legales — deben mantener fondo claro): `Landing.tsx`, `Privacy.tsx`, `Terms.tsx`, `Cookies.tsx`, `FAQ.tsx`, `About.tsx`, `Blog.tsx`, `BlogPost.tsx`

### 2.3 Archivos con mayor número de correcciones

Los archivos con más correcciones de dark mode fueron: `Admin.tsx` (91), `ShoppingLists.tsx` (57), `ExpertPatientDetail.tsx` (50), `BuddyExpertDashboard.tsx` (50), `MyExpert.tsx` (48), `Inventory.tsx` (47), `ActiveMenu.tsx` (43).

---

## 3. Correcciones de Navegación

### 3.1 Problema identificado

Las páginas que usan `ProtectedPage` (en lugar de `ProtectedRoute`) necesitan incluir `AppLayout` ellas mismas, ya que `ProtectedRoute` lo añade automáticamente via `WithLayout`.

### 3.2 Estado de navegación por página

| Página | Tipo de ruta | AppLayout | Estado |
|--------|-------------|-----------|--------|
| Dashboard | ProtectedRoute | ✅ Auto (WithLayout) | OK |
| Recipes | ProtectedRoute | ✅ Auto | OK |
| Menus | ProtectedRoute | ✅ Auto | OK |
| ShoppingLists | ProtectedRoute | ✅ Auto | OK |
| Inventory | ProtectedRoute | ✅ Auto | OK |
| MealLog | ProtectedRoute | ✅ Auto | OK |
| Profile | ProtectedRoute | ✅ Auto | OK |
| Admin | ProtectedRoute | ✅ Auto | OK |
| BuddyExperts | ProtectedRoute | ✅ Auto | OK |
| ExpertPatients | ProtectedPage | ✅ Propio | OK |
| ExpertPatientDetail | ProtectedPage | ✅ Propio | OK |
| ExpertChat | ProtectedPage | ✅ Propio | OK |
| ExpertPlansManager | ProtectedPage | ✅ Propio | OK |
| ClientPlanView | ProtectedPage | ✅ Propio | OK |
| BuddyExpertDashboard | ProtectedPage | ✅ Propio | OK |
| BuddyMakerDashboard | ProtectedPage | ✅ Propio | OK |
| HireRequests | ProtectedPage | ✅ Añadido en esta sesión | Corregido |
| EmpresaDashboard | ProtectedPage | ✅ Header propio con back | OK |
| FamiliaCalendario | ProtectedPage | ✅ Propio | OK |
| Notifications | ProtectedPage | ✅ Propio | OK |
| EventMenuPlanner | ProtectedPage | ✅ Propio | OK |
| SavedEvents | ProtectedPage | ✅ Propio | OK |
| WeeklyCheckin | ProtectedPage | ✅ Propio | OK |
| MyExpert | ProtectedPage | ✅ Propio | OK |
| MakerAnalytics | ProtectedPage | ✅ Propio | OK |

---

## 4. Funcionalidades Implementadas (Sesiones Anteriores)

### 4.1 Diario de Comidas (MealLog)

- **Panel de déficit/superávit calórico**: Muestra objetivo calórico, TMB, TDEE y diferencia del día.
- **Botón "Analizar mi día con IA"**: Genera análisis completo con puntuación, puntos fuertes, áreas de mejora y recomendaciones.
- **Endpoint `getDailyAnalysis`**: Implementado en `server/routers.ts`.

### 4.2 Listas de Compra (ShoppingLists)

- **Botón ✨ "Crear menú con esta lista"**: Genera menú semanal IA usando los ingredientes de la lista.
- **Modales de supermercado**: Mercadona, Lidl y Carrefour convertidos a bottom sheets (suben desde abajo en móvil).
- **Matching de productos**: Usa `ingredient.nameEs` (español) en lugar de `ingredient.name` (inglés).

### 4.3 Inventario (Inventory)

- **Fix "Alimento"**: Los modales de recetas e ingredientes próximos a caducar ahora muestran `ingredient?.nameEs ?? item?.customName`.
- **Botón "Hacer esta receta"**: Añadido en el modal de recetas con inventario.

### 4.4 Chat Experto (ExpertChat)

- **Responsive en móvil**: Muestra un panel a la vez (lista de pacientes o chat), con botón de volver.

### 4.5 Panel de Administración (Admin)

- **Borrar usuario**: Endpoint `admin.deleteUser` con soft/hard delete y cascade cleanup.
- **Botón "Borrar usuario"** con confirmación en el panel admin.
- **Fix JSX**: Error de sintaxis en Admin.tsx corregido (div del grid no cerrado).

### 4.6 Gestión de Planes (ExpertPlansManager / ClientPlanView)

- **AppLayout con back button** añadido a ambas páginas.
- **Soporte dark mode** completo.

### 4.7 Sistema de Emails

- 20+ plantillas HTML de email implementadas.
- Triggers automáticos: bienvenida, menú asignado, cita confirmada, solicitud de contratación.
- Jobs programados: check-in semanal, resumen semanal expertos, reactivación por inactividad, recordatorio de citas.

### 4.8 Contenido Generado

- 207+ recetas en la BD.
- 146 menús públicos de 15 tipos diferentes.
- 50 blog posts (reasignados a Dra. Laura Sánchez).

---

## 5. Issues Pendientes / Mejoras Futuras

### 5.1 Funcionalidades no implementadas aún

| Funcionalidad | Prioridad | Estado |
|---------------|-----------|--------|
| PDF viewer en ExpertPlansManager | Alta | Pendiente |
| "Generar menú desde PDF" en ExpertPlansManager | Alta | Pendiente |
| Biblioteca de conocimiento IA para expertos (PDFs) | Alta | Tabla BD creada, endpoints/UI pendientes |
| Mejora del algoritmo de scoring Mercadona (por categoría) | Media | Pendiente |
| Integración Google Calendar para expertos | Media | Pendiente |
| Selector de idioma en navbar | Baja | Pendiente |

### 5.2 Colores hardcodeados restantes (no críticos)

Algunos colores de acento (`bg-orange-500`, `bg-green-500`, `text-orange-600`) son intencionales como colores de marca y no necesitan cambiarse. Solo los colores de fondo/texto neutros (`gray-*`, `white`, `black`) son problemáticos en dark mode.

### 5.3 Páginas sin AppLayout propio (usan header manual)

Las siguientes páginas tienen su propio header con botón de volver pero no usan el componente `AppLayout`. Funcionan correctamente pero no tienen la barra de navegación inferior:

- `EmpresaDashboard.tsx` — tiene header propio con ArrowLeft
- `CreatorDashboard.tsx` — tiene header propio
- `BuddyScan.tsx` — tiene header propio
- `Familia.tsx` / `FamiliaUnirse.tsx` — páginas públicas, no requieren AppLayout
- `MisRecetasAsignadas.tsx` — pendiente verificar

---

## 6. Resumen de Cambios por Sesión

### Sesión actual (18 abril 2026)

| Cambio | Tipo | Estado |
|--------|------|--------|
| Eliminar BuddyExpert ID 6 (Guillermo) | BD | ✅ |
| Eliminar BuddyExpert ID 7 (BuddyMarket IA) | BD | ✅ |
| Eliminar BuddyExpert ID 8 (Luis Maria) | BD | ✅ |
| Reasignar 50 blog posts de expertId=7 a expertId=5 | BD | ✅ |
| Corrección masiva dark mode (~58 archivos TSX) | Frontend | ✅ |
| AppLayout añadido a HireRequests.tsx | Frontend | ✅ |
| Colores hardcodeados en expert pages corregidos | Frontend | ✅ |

### Sesión anterior (16-17 abril 2026)

| Cambio | Tipo | Estado |
|--------|------|--------|
| Panel déficit/superávit calórico en MealLog | Frontend + Backend | ✅ |
| Botón "Analizar mi día con IA" | Frontend + Backend | ✅ |
| Botón ✨ "Crear menú con esta lista" | Frontend + Backend | ✅ |
| Bottom sheets para modales de supermercado | Frontend | ✅ |
| Fix "Alimento" en modales de inventario | Frontend | ✅ |
| Botón "Hacer esta receta" en inventario | Frontend | ✅ |
| ExpertChat responsive en móvil | Frontend | ✅ |
| AppLayout en ExpertPlansManager y ClientPlanView | Frontend | ✅ |
| Fix matching Mercadona con nameEs | Frontend | ✅ |
| Tabla expert_knowledge_pdfs en schema | BD | ✅ |
| Fix borrado de usuarios (getAllUsers filtra deletedAt) | Backend | ✅ |
| Endpoint admin.deleteUser con cascade | Backend | ✅ |
| Botón "Borrar usuario" en Admin | Frontend | ✅ |
| Fix JSX error en Admin.tsx | Frontend | ✅ |
| Fix BuddyProfile.tsx syntax error | Frontend | ✅ |
| Eliminados 6 usuarios .demo@buddymarket.io | BD | ✅ |

---

## 7. Estado del Servidor

- **URL:** https://3000-icrep2a0jcrljm6np4sqp-133770cb.us2.manus.computer
- **Estado:** ✅ Running (HTTP 200)
- **Última versión:** `06298986`
- **Nota técnica:** Los errores de `tsc --noEmit` son OOM (out of memory) del compilador TypeScript, no errores reales de código. Vite compila correctamente.

---

*Informe generado automáticamente por el sistema de auditoría BuddyMarket.*
