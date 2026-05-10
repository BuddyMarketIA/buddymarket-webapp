# Architecture: Product Recommendations System

Documentación técnica de la arquitectura del sistema de recomendaciones inteligentes.

## Overview

El sistema de recomendaciones es una arquitectura de 3 capas:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ProductRecommendationCard | RecommendationsCarousel        │
└────────────────┬────────────────────────────────────────────┘
                 │ tRPC calls
┌────────────────▼────────────────────────────────────────────┐
│                    Backend (tRPC)                            │
│  recommendations.getForUser | trackEvent | getAnalytics     │
└────────────────┬────────────────────────────────────────────┘
                 │ SQL queries
┌────────────────▼────────────────────────────────────────────┐
│                   Database (MySQL)                           │
│  productRecommendations | recommendationEvents | productCache│
└─────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. Base de Datos (4 tablas)

#### productRecommendations
```sql
CREATE TABLE productRecommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  externalProductId VARCHAR(255) NOT NULL,
  source ENUM('buddyshop', 'buddycare', 'buddycoach'),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reason TEXT NOT NULL,
  productImage VARCHAR(500),
  productPrice VARCHAR(50),
  productUrl VARCHAR(500) NOT NULL,
  relevanceScore INT (50-100),
  trigger VARCHAR(100),
  expiresAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP
);
```

**Propósito:** Almacena recomendaciones generadas para cada usuario
**Índices:** userId, expiresAt, source
**Política de limpieza:** Eliminar después de 30 días

#### recommendationEvents
```sql
CREATE TABLE recommendationEvents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  recommendationId INT NOT NULL,
  eventType ENUM('impression', 'click', 'hover', 'convert', 'dismiss'),
  source VARCHAR(50),
  context VARCHAR(255),
  metadata JSON,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recommendationId) REFERENCES productRecommendations(id)
);
```

**Propósito:** Rastrear interacciones del usuario con recomendaciones
**Índices:** userId, eventType, createdAt
**Uso:** Analytics, mejora de algoritmo

#### productCache
```sql
CREATE TABLE productCache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  externalProductId VARCHAR(255) UNIQUE,
  source VARCHAR(50),
  data JSON,
  lastUpdated DATETIME,
  expiresAt DATETIME
);
```

**Propósito:** Cache de productos de APIs externas
**Índices:** source, expiresAt
**TTL:** 12 horas

#### userProductInteractions
```sql
CREATE TABLE userProductInteractions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  externalProductId VARCHAR(255),
  interactionType ENUM('view', 'click', 'purchase', 'dismiss'),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Propósito:** Historial de interacciones para machine learning
**Índices:** userId, timestamp

### 2. Backend (TypeScript/Express)

#### Motor de Recomendaciones (`server/recommendations-engine.ts`)

**Flujo:**

```
1. Obtener perfil del usuario
   ↓
2. Detectar triggers (8 tipos)
   ↓
3. Generar recomendaciones por fuente
   ├─ BuddyCoach (proteína, creatina, BCAA)
   ├─ BuddyShop (mandoline, báscula, cuchillos)
   └─ BuddyCare (vitaminas, minerales, suplementos)
   ↓
4. Calcular relevance score (50-100)
   ↓
5. Guardar en BD con expiration
```

**Triggers detectados:**

1. `muscle_gain` - Objetivo: ganancia muscular + entrenamientos activos
2. `weight_loss` - Objetivo: pérdida de peso
3. `active_training` - Entrenamientos 3+ veces por semana
4. `frequent_cooking` - Cocina 15-30+ horas por semana
5. `complex_recipes` - Preferencia por recetas complejas
6. `macro_deficit` - Proteína actual < meta diaria
7. `health_goal` - Objetivo: bienestar general
8. `medical_condition` - Tiene condiciones médicas reportadas

**Algoritmo de relevance score:**

```
base_score = 70
if (trigger_match) score += 15
if (macro_aligned) score += 10
if (recent_interaction) score += 5
if (high_engagement) score += 10
final_score = min(100, max(50, score))
```

#### Helpers de BD (`server/recommendations-db.ts`)

**Funciones principales:**

- `getRecommendationsForUser(userId, limit)` - Obtener recomendaciones activas
- `trackRecommendationEvent(event)` - Registrar interacción
- `getRecommendationAnalytics(userId)` - Analytics por usuario
- `refreshRecommendationsForUser(userId)` - Generar nuevas recomendaciones
- `cleanupExpiredRecommendations()` - Eliminar expiradas

#### tRPC Procedures (`server/routers/recommendations.ts`)

**Endpoints:**

```typescript
// Obtener recomendaciones para usuario actual
trpc.recommendations.getForUser.useQuery({ limit: 5 })

// Rastrear evento de usuario
trpc.recommendations.trackEvent.useMutation({
  recommendationId: 1,
  eventType: 'click',
  context: 'dashboard'
})

// Obtener analytics
trpc.recommendations.getAnalytics.useQuery()

// Refrescar recomendaciones (admin only)
trpc.recommendations.refresh.useMutation()
```

### 3. Frontend (React)

#### Componentes

**ProductRecommendationCard** (`client/src/components/ProductRecommendationCard.tsx`)

- Props: id, title, reason, source, productUrl, relevanceScore
- Features:
  - Badge de fuente (BuddyShop, BuddyCare, BuddyCoach)
  - Barra de relevancia visual
  - Tracking de clicks
  - Dismiss functionality
  - Responsive design

**RecommendationsCarousel** (`client/src/components/RecommendationsCarousel.tsx`)

- Props: autoRotate, rotationInterval, maxVisible
- Features:
  - Auto-rotación cada 5 segundos
  - Navegación con flechas
  - Puntos de paginación
  - Grid responsivo (1-3 columnas)
  - Carga de datos con tRPC

**RecommendationsBanner** (`client/src/components/RecommendationsBanner.tsx`)

- Props: rotationInterval, position
- Features:
  - Banner sticky en top/bottom
  - Auto-rotación
  - Barra de progreso
  - Cerrable por usuario
  - Diseño premium

#### Integración en Dashboard

```tsx
<div style={{ background: C.cardBg, borderRadius: "20px", padding: "18px" }}>
  <RecommendationsCarousel maxVisible={1} />
</div>
```

### 4. Scheduled Jobs

#### Handlers (`server/scheduled/generateRecommendations.ts`)

**3 endpoints HTTP:**

1. `POST /api/scheduled/generateRecommendations`
   - Cron: Cada 6 horas
   - Batch: 500 usuarios máximo
   - Timeout: 2 minutos

2. `POST /api/scheduled/cleanupRecommendations`
   - Cron: Diariamente a las 3 AM UTC
   - Elimina: Recomendaciones > 30 días

3. `POST /api/scheduled/refreshProductCache`
   - Cron: Cada 12 horas
   - Actualiza: Cache de productos

#### Job Functions (`server/jobs/generateRecommendations.ts`)

```typescript
generateRecommendationsJob(input)
  - Obtiene usuarios activos
  - Procesa en batches
  - Genera recomendaciones
  - Retorna: { usersProcessed, recommendationsGenerated, errors }

cleanupExpiredRecommendations()
  - Elimina recomendaciones expiradas
  - Limpia eventos antiguos

refreshProductCache()
  - Obtiene productos de APIs externas
  - Actualiza cache
  - Mantiene TTL
```

### 5. APIs Externas

#### BuddyShop

```
Endpoint: https://buddyshop-niebit4z.manus.space/api/buddyone
Auth: Header X-BuddyOne-Key
Productos: Equipamiento de cocina, herramientas
```

#### BuddyCare

```
Endpoint: http://localhost:8000/api/recommendations/user/{userId}
Auth: Bearer token (sk_test_*, sk_live_*, sk_enterprise_*)
Productos: Suplementos, vitaminas, salud
```

#### Google OAuth

```
Client ID: 993819168485-opm05knoafonv80cikfsc22vdpilcptg.apps.googleusercontent.com
Redirect: /api/oauth/callback
Scope: email, profile
```

## Flujo de Datos

### Generación de Recomendaciones

```
1. Cron trigger (cada 6 horas)
   ↓
2. Handler: generateRecommendationsHandler
   ↓
3. Job: generateRecommendationsJob
   ├─ Obtiene usuarios activos
   ├─ Para cada usuario:
   │  ├─ Obtiene perfil nutricional
   │  ├─ Detecta triggers
   │  ├─ Genera recomendaciones
   │  └─ Guarda en BD
   └─ Retorna estadísticas
   ↓
4. Cleanup: cleanupExpiredRecommendations
   ├─ Elimina recomendaciones > 30 días
   └─ Limpia eventos antiguos
   ↓
5. Cache: refreshProductCache
   ├─ Obtiene productos de APIs
   └─ Actualiza cache
```

### Visualización de Recomendaciones

```
1. Usuario abre dashboard
   ↓
2. Frontend: RecommendationsCarousel monta
   ↓
3. tRPC: recommendations.getForUser.useQuery()
   ↓
4. Backend: Obtiene recomendaciones activas
   ├─ Filtra por expiresAt > now
   ├─ Ordena por relevanceScore DESC
   └─ Limita a N resultados
   ↓
5. Frontend: Renderiza ProductRecommendationCard
   ├─ Muestra título, razón, precio
   ├─ Barra de relevancia
   └─ Botones (click, dismiss)
   ↓
6. Usuario interactúa
   ├─ Click: tRPC trackEvent('click')
   ├─ Dismiss: tRPC trackEvent('dismiss')
   └─ Evento se guarda en BD
```

## Performance

### Optimizaciones

1. **Caching**
   - Product cache: 12 horas TTL
   - Recomendaciones: 6 horas (regeneradas)
   - Query results: Redis (opcional)

2. **Batch Processing**
   - Máximo 500 usuarios por job
   - Máximo 20 usuarios por batch
   - Timeout: 2 minutos

3. **Índices de BD**
   - userId (búsquedas por usuario)
   - expiresAt (limpieza)
   - source (filtrado)
   - eventType (analytics)

4. **Frontend**
   - Lazy loading de componentes
   - Virtual scrolling (si hay muchas recomendaciones)
   - Debouncing de eventos

### Métricas Esperadas

- Tiempo de carga del dashboard: < 500ms
- Tiempo de generación por usuario: < 100ms
- Memoria por job: < 500MB
- Throughput: 500 usuarios/minuto

## Seguridad

### Autenticación

- OAuth2 (Manus)
- Session cookies (httpOnly, secure)
- tRPC protected procedures

### Autorización

- Solo usuarios pueden ver sus propias recomendaciones
- Admins pueden ver/refrescar cualquier usuario
- Crons autenticados via Heartbeat

### Validación

- Input validation en tRPC
- SQL prepared statements
- Rate limiting en endpoints

### Privacidad

- Datos de perfil no se comparten con terceros
- Recomendaciones generadas localmente
- Eventos de tracking se almacenan localmente
- Cumplimiento GDPR (derecho al olvido)

## Testing

### Unit Tests (32 tests)

- Trigger detection (5 tests)
- BuddyCoach recommendations (4 tests)
- BuddyShop recommendations (4 tests)
- BuddyCare recommendations (5 tests)
- Recommendation properties (3 tests)
- Credentials validation (9 tests)

### Integration Tests

- End-to-end flow (usuario → recomendación → click)
- API externas (BuddyShop, BuddyCare)
- Scheduled jobs
- Database operations

### Performance Tests

- Load testing (1000 usuarios)
- Memory profiling
- Query optimization

## Deployment

### Pre-deployment Checklist

- [ ] Tests pasan (32/32)
- [ ] No hay errores de TypeScript
- [ ] Credenciales configuradas
- [ ] BD migrada
- [ ] Checkpoint guardado

### Post-deployment

- [ ] Crear crons con manus-heartbeat
- [ ] Monitorear logs
- [ ] Verificar que recomendaciones se generan
- [ ] Monitorear performance

## Roadmap Futuro

1. **Machine Learning**
   - Modelo de predicción de relevancia
   - Personalización avanzada
   - A/B testing de recomendaciones

2. **Integración**
   - Más fuentes de productos
   - Recomendaciones en email
   - Notificaciones push

3. **Analytics**
   - Dashboard de analytics
   - Reportes de conversión
   - ROI tracking

4. **Experiencia**
   - Recomendaciones en tiempo real
   - Explicaciones más detalladas
   - Feedback del usuario

---

**Última actualización:** Mayo 2026
**Versión:** 1.0
**Autor:** Manus AI
