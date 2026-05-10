# Testing Guide: Product Recommendations System

Esta guía cubre cómo probar el sistema completo de recomendaciones de productos.

## Tabla de Contenidos

1. [Testing Manual](#testing-manual)
2. [Testing Automatizado](#testing-automatizado)
3. [Testing de APIs Externas](#testing-de-apis-externas)
4. [Testing de Scheduled Jobs](#testing-de-scheduled-jobs)
5. [Troubleshooting](#troubleshooting)

---

## Testing Manual

### 1. Verificar que el Dashboard muestra recomendaciones

**Pasos:**

1. Navega a `https://3000-i8c21fol0x9hgqtru1fiv-63af6fc0.us1.manus.computer`
2. Inicia sesión con tu cuenta
3. Ve al dashboard
4. Busca la sección "Recomendaciones para ti" en la columna izquierda
5. Verifica que se muestran 1-3 productos

**Resultado esperado:**
- Cards de productos con:
  - Título del producto
  - Razón de recomendación (ej: "Te vendría bien proteína para llegar a tu meta diaria")
  - Botón "Ver producto" funcional
  - Barra de relevancia (0-100%)
  - Botón para cerrar/descartar

### 2. Probar interacciones con recomendaciones

**Pasos:**

1. En una recomendación, haz clic en "Ver producto"
2. Verifica que se abre en una nueva pestaña
3. Vuelve al dashboard
4. Haz clic en el botón X para descartar una recomendación
5. Verifica que desaparece

**Resultado esperado:**
- Links funcionan correctamente
- Dismiss elimina la recomendación de la vista
- Tracking de eventos se registra en BD

### 3. Probar navegación del carrusel

**Pasos:**

1. Si hay múltiples recomendaciones, verifica las flechas de navegación
2. Haz clic en las flechas izquierda/derecha
3. Verifica que cambia la recomendación mostrada
4. Haz clic en los puntos de paginación

**Resultado esperado:**
- Navegación fluida entre recomendaciones
- Puntos de paginación se actualizan
- Auto-rotación cada 5 segundos (si está habilitada)

### 4. Verificar datos del usuario

**Pasos:**

1. Ve a tu perfil nutricional
2. Verifica que tus datos están correctos:
   - Objetivo principal
   - Nivel de actividad
   - Metas de macros
   - Restricciones/alergias
3. Vuelve al dashboard
4. Las recomendaciones deberían cambiar según tu perfil

**Resultado esperado:**
- Recomendaciones personalizadas según tu perfil
- Si cambias objetivo a "ganancia muscular", verás más proteína
- Si cambias a "pérdida de peso", verás suplementos de control

---

## Testing Automatizado

### Ejecutar Tests de Recomendaciones

```bash
cd /home/ubuntu/buddymarket-webapp

# Ejecutar todos los tests
pnpm test

# Ejecutar solo tests de recomendaciones
pnpm test recommendations-engine.test -- --run

# Ejecutar con cobertura
pnpm test -- --coverage
```

**Tests incluidos:**

1. **Trigger Detection** (5 tests)
   - Detecta muscle gain trigger
   - Detecta active training trigger
   - Detecta frequent cooking trigger
   - Detecta complex recipes trigger
   - Detecta macro deficit trigger

2. **BuddyCoach Recommendations** (4 tests)
   - Genera proteína para ganancia muscular
   - Genera creatina para ganancia muscular
   - Fuente correcta (buddycoach)
   - Expiración correcta (7 días)

3. **BuddyShop Recommendations** (4 tests)
   - Genera mandoline para cocina frecuente
   - Genera báscula para cocina frecuente
   - Fuente correcta (buddyshop)
   - Expiración correcta (14 días)

4. **BuddyCare Recommendations** (5 tests)
   - Genera vitamina D para objetivo bienestar
   - Genera chromium para diabetes
   - Genera magnesium para hypertension
   - Fuente correcta (buddycare)
   - Expiración correcta (30 días)

5. **Recommendation Properties** (3 tests)
   - Campos requeridos presentes
   - Relevance scores válidos (50-100)
   - Títulos y descripciones no vacíos

**Resultado esperado:**
```
✓ Recommendations Engine (23 tests)
✓ Credentials validation (9 tests)

Test Files  1 passed (1)
Tests  32 passed (32)
```

---

## Testing de APIs Externas

### 1. Verificar credenciales de BuddyShop

```bash
curl -H "X-BuddyOne-Key: bshop_433b1942e295db0a145c38fbab40f53a0f3476b0c110cefe8d8605d53554fdad" \
  https://buddyshop-niebit4z.manus.space/api/buddyone/products
```

**Resultado esperado:**
- Status 200
- JSON con lista de productos
- Cada producto tiene: id, name, price, category

### 2. Verificar credenciales de BuddyCare

```bash
curl -H "Authorization: Bearer sk_test_51BuddyCare2024_dev_a7f3k9m2x8q1w5e9r4t2y6u0i3o7p1l5" \
  http://localhost:8000/api/recommendations/user/buddy_user_12345
```

**Resultado esperado:**
- Status 200
- JSON con recomendaciones personalizadas
- Cada recomendación tiene: id, title, reason, relevanceScore

### 3. Verificar Google OAuth

```bash
# Verificar que VITE_GOOGLE_CLIENT_ID está configurado
echo $VITE_GOOGLE_CLIENT_ID

# Debería mostrar: 993819168485-opm05knoafonv80cikfsc22vdpilcptg.apps.googleusercontent.com
```

---

## Testing de Scheduled Jobs

### 1. Probar handler de generación de recomendaciones

```bash
# Simular un cron request
curl -X POST http://localhost:3000/api/scheduled/generateRecommendations \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session_id=<tu_session_token>" \
  -d '{}'
```

**Resultado esperado:**
- Status 200
- Response JSON con:
  - `ok: true`
  - `usersProcessed: <número>`
  - `recommendationsGenerated: <número>`

### 2. Verificar logs del job

```bash
tail -f .manus-logs/devserver.log | grep "\[Job\]"
```

**Resultado esperado:**
```
[Job] Starting recommendation generation job
[Job] Found 50 active users
[Job] Batch 1 complete: 25 recommendations generated
[Job] Recommendation generation complete: 150 success, 0 errors
```

### 3. Probar cleanup de recomendaciones expiradas

```bash
curl -X POST http://localhost:3000/api/scheduled/cleanupRecommendations \
  -H "Content-Type: application/json" \
  -H "Cookie: app_session_id=<tu_session_token>" \
  -d '{}'
```

**Resultado esperado:**
- Status 200
- Recomendaciones más antiguas que 30 días se eliminan

---

## Testing de Base de Datos

### 1. Verificar tablas creadas

```sql
-- Conectar a la BD
-- Ver todas las tablas de recomendaciones
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%recommendation%' OR table_name LIKE '%product%';
```

**Resultado esperado:**
```
productRecommendations
recommendationEvents
productCache
userProductInteractions
```

### 2. Verificar datos de recomendaciones

```sql
-- Ver recomendaciones para un usuario
SELECT id, title, reason, source, relevanceScore, expiresAt 
FROM productRecommendations 
WHERE userId = 1 
ORDER BY createdAt DESC 
LIMIT 10;
```

**Resultado esperado:**
- Múltiples recomendaciones
- Cada una con source (buddyshop, buddycare, buddycoach)
- Relevance scores entre 50-100
- Expiration dates en el futuro

### 3. Verificar eventos de tracking

```sql
-- Ver eventos de click
SELECT userId, eventType, source, createdAt 
FROM recommendationEvents 
WHERE eventType = 'click' 
ORDER BY createdAt DESC 
LIMIT 10;
```

**Resultado esperado:**
- Eventos registrados cuando usuario hace click
- Timestamp correcto
- Source correcto

---

## Testing de Performance

### 1. Medir tiempo de carga del dashboard

```bash
# Usar Chrome DevTools
# 1. Abre el dashboard
# 2. Abre DevTools (F12)
# 3. Ve a Network tab
# 4. Mira el tiempo de carga de /api/trpc/recommendations.getForUser

# Resultado esperado: < 500ms
```

### 2. Medir tiempo de generación de recomendaciones

```bash
# En los logs, busca:
# [Job] Starting recommendation generation job
# [Job] Recommendation generation complete

# Resultado esperado: < 60 segundos para 500 usuarios
```

### 3. Verificar uso de memoria

```bash
# Monitorear memoria durante job
watch -n 1 'ps aux | grep "node\|tsx" | grep -v grep'

# Resultado esperado: < 500MB
```

---

## Testing de Responsividad

### 1. Mobile (iPhone 12)

```bash
# En DevTools, selecciona iPhone 12
# Verifica:
# - Cards se muestran correctamente en 1 columna
# - Botones son clickeables
# - Texto es legible
```

### 2. Tablet (iPad)

```bash
# En DevTools, selecciona iPad
# Verifica:
# - Cards se muestran en 2 columnas
# - Layout es balanceado
```

### 3. Desktop (1920x1080)

```bash
# Verifica:
# - Cards se muestran en 3 columnas
# - Carrusel funciona correctamente
```

---

## Checklist de Testing

- [ ] Dashboard muestra recomendaciones
- [ ] Botones funcionan (click, dismiss)
- [ ] Navegación del carrusel funciona
- [ ] Tests automatizados pasan (32/32)
- [ ] APIs externas responden correctamente
- [ ] Datos se guardan en BD
- [ ] Tracking de eventos funciona
- [ ] Scheduled jobs se pueden ejecutar
- [ ] Performance es aceptable (< 500ms)
- [ ] Responsive en mobile/tablet/desktop
- [ ] No hay errores en console
- [ ] No hay errores en servidor

---

## Troubleshooting

### Las recomendaciones no aparecen

**Causa 1: Usuario no tiene perfil nutricional**
```sql
SELECT * FROM userProfile WHERE userId = 1;
```
Solución: Crear perfil en app

**Causa 2: No hay triggers detectados**
- Verificar que el perfil tiene datos válidos
- Verificar que mainGoal no es null

**Causa 3: APIs externas no responden**
```bash
curl -H "X-BuddyOne-Key: <key>" https://buddyshop-niebit4z.manus.space/api/buddyone/products
```
Solución: Verificar keys en .env

### El carrusel no auto-rotaciona

**Causa:** Auto-rotación se detiene cuando usuario interactúa
Solución: Esto es normal - se reanuda después de 5 segundos sin interacción

### Errores en console

**"Cannot read property 'data' of undefined"**
- Verificar que tRPC está respondiendo
- Verificar que el usuario está autenticado

**"Failed to fetch"**
- Verificar que el servidor está corriendo
- Verificar CORS settings

---

## Próximos Pasos

1. Ejecutar checklist de testing
2. Reportar cualquier issue
3. Desplegar a producción
4. Crear crons con manus-heartbeat
5. Monitorear en Manus Dashboard
