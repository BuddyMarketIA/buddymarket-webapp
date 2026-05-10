# Health Hub - Plan de Integración de Dispositivos Wearables

**Versión:** 1.0  
**Fecha:** 10 de mayo de 2026  
**Estado:** En Diseño  
**Objetivo:** Integrar dispositivos wearables (Oura Ring, Whoop) para sincronizar datos de salud en BuddyOne

---

## 1. Visión General

**Health Hub** es un nuevo módulo en BuddyOne que permite a los usuarios conectar sus dispositivos wearables para obtener una visión holística de su salud y bienestar. Los datos sincronizados se utilizan para:

- Personalizar recomendaciones nutricionales basadas en recuperación y entrenamiento
- Optimizar planes de menús según nivel de actividad y estrés
- Proporcionar insights sobre la relación entre nutrición y métricas de salud
- Mejorar la precisión de las recomendaciones de BuddyExperts

### Dispositivos Soportados

| Dispositivo | Proveedor | Datos | Estado |
|------------|-----------|-------|--------|
| **Oura Ring** | Oura Health | Sueño, recuperación, actividad, HRV, SpO2 | 🔄 En desarrollo |
| **Whoop** | Whoop Inc. | Recuperación, entrenamiento, sueño, métricas fisiológicas | 🔄 En desarrollo |
| **Apple Health** | Apple | Pasos, calorías, frecuencia cardíaca, ejercicio | 📋 Futuro |
| **Google Fit** | Google | Pasos, calorías, distancia, actividad | 📋 Futuro |

---

## 2. Arquitectura de Datos

### 2.1 Datos de Oura Ring

**Categorías de datos disponibles:**

- **Sleep Data**: Duración total, fases (REM, light, deep), eficiencia, latencia, calidad
- **Activity Data**: Calorías quemadas, pasos, METs (equivalentes metabólicos), tiempo activo
- **Readiness**: Puntuación de preparación, contribuidores (sueño, HRV, temperatura)
- **Heart Rate Variability (HRV)**: Datos de variabilidad de frecuencia cardíaca
- **SpO2**: Saturación de oxígeno en sangre
- **Stress & Resilience**: Niveles de estrés, resiliencia cardiovascular
- **VO2 Max**: Capacidad aeróbica estimada
- **Cardiovascular Age**: Edad cardiovascular estimada

**Endpoints principales:**
```
GET /v2/usercollection/personal_info       # Información personal
GET /v2/usercollection/sleep               # Datos de sueño
GET /v2/usercollection/daily_activity      # Actividad diaria
GET /v2/usercollection/daily_readiness     # Puntuación de preparación
GET /v2/usercollection/daily_stress        # Niveles de estrés
GET /v2/usercollection/daily_resilience    # Resiliencia cardiovascular
GET /v2/usercollection/heart_rate          # Frecuencia cardíaca
GET /v2/usercollection/workout             # Entrenamientos
```

### 2.2 Datos de Whoop

**Categorías de datos disponibles:**

- **Cycles**: Ciclos fisiológicos diarios con strain y recuperación
- **Recovery**: Puntuación de recuperación, HRV, frecuencia cardíaca en reposo
- **Sleep**: Duración, calidad, etapas del sueño
- **Workouts**: Actividad, duración, strain, calorías quemadas
- **Body Measurements**: Altura, peso, frecuencia cardíaca máxima

**Scopes OAuth:**
```
read:recovery          # Datos de recuperación
read:cycles            # Ciclos fisiológicos
read:workout           # Entrenamientos
read:sleep             # Datos de sueño
read:profile           # Perfil de usuario
read:body_measurement  # Medidas corporales
```

**Endpoints principales:**
```
GET /v2/user/profile/basic                 # Perfil básico
GET /v2/user/measurement/body               # Medidas corporales
GET /v2/cycle                               # Ciclos fisiológicos
GET /v2/cycle/{cycleId}                     # Ciclo específico
GET /v2/recovery                            # Datos de recuperación
GET /v2/sleep                               # Datos de sueño
GET /v2/workout                             # Entrenamientos
```

---

## 3. Flujo de Autenticación

### 3.1 Flujo OAuth 2.0 - Oura Ring

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Conectar Oura Ring"                    │
├─────────────────────────────────────────────────────────────────┤
│ 2. BuddyOne redirige a Oura OAuth:                              │
│    https://cloud.ouraring.com/oauth/authorize?                  │
│    client_id={CLIENT_ID}&                                       │
│    redirect_uri={REDIRECT_URI}&                                 │
│    response_type=code&                                          │
│    scope=personal_info,sleep,activity,readiness                 │
├─────────────────────────────────────────────────────────────────┤
│ 3. Usuario autoriza en Oura                                     │
├─────────────────────────────────────────────────────────────────┤
│ 4. Oura redirige a BuddyOne con código:                         │
│    {REDIRECT_URI}?code={AUTH_CODE}&state={STATE}                │
├─────────────────────────────────────────────────────────────────┤
│ 5. BuddyOne intercambia código por token:                       │
│    POST https://api.ouraring.com/oauth/token                    │
│    - grant_type: authorization_code                             │
│    - code: {AUTH_CODE}                                          │
│    - client_id: {CLIENT_ID}                                     │
│    - client_secret: {CLIENT_SECRET}                             │
├─────────────────────────────────────────────────────────────────┤
│ 6. Oura retorna access_token                                    │
├─────────────────────────────────────────────────────────────────┤
│ 7. BuddyOne guarda token encriptado en BD                       │
├─────────────────────────────────────────────────────────────────┤
│ 8. Inicia sincronización de datos históricos                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo OAuth 2.0 - Whoop

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario hace clic en "Conectar Whoop"                        │
├─────────────────────────────────────────────────────────────────┤
│ 2. BuddyOne redirige a Whoop OAuth:                             │
│    https://app.prod.whoop.com/oauth/oauth2/auth?                │
│    client_id={CLIENT_ID}&                                       │
│    redirect_uri={REDIRECT_URI}&                                 │
│    response_type=code&                                          │
│    scope=read:recovery read:cycles read:workout read:sleep      │
├─────────────────────────────────────────────────────────────────┤
│ 3. Usuario autoriza en Whoop                                    │
├─────────────────────────────────────────────────────────────────┤
│ 4. Whoop redirige a BuddyOne con código:                        │
│    {REDIRECT_URI}?code={AUTH_CODE}&state={STATE}                │
├─────────────────────────────────────────────────────────────────┤
│ 5. BuddyOne intercambia código por token:                       │
│    POST https://api.prod.whoop.com/oauth/oauth2/token           │
│    - grant_type: authorization_code                             │
│    - code: {AUTH_CODE}                                          │
│    - client_id: {CLIENT_ID}                                     │
│    - client_secret: {CLIENT_SECRET}                             │
├─────────────────────────────────────────────────────────────────┤
│ 6. Whoop retorna access_token                                   │
├─────────────────────────────────────────────────────────────────┤
│ 7. BuddyOne guarda token encriptado en BD                       │
├─────────────────────────────────────────────────────────────────┤
│ 8. Inicia sincronización de datos históricos                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Modelo de Base de Datos

### 4.1 Nueva Tabla: `wearable_connections`

```sql
CREATE TABLE wearable_connections (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Oura Ring
  oura_connected BOOLEAN DEFAULT FALSE,
  oura_access_token TEXT,
  oura_refresh_token TEXT,
  oura_token_expires_at TIMESTAMP,
  oura_user_id VARCHAR(255),
  oura_last_sync TIMESTAMP,
  
  -- Whoop
  whoop_connected BOOLEAN DEFAULT FALSE,
  whoop_access_token TEXT,
  whoop_refresh_token TEXT,
  whoop_token_expires_at TIMESTAMP,
  whoop_user_id INTEGER,
  whoop_last_sync TIMESTAMP,
  
  -- Apple Health (futuro)
  apple_connected BOOLEAN DEFAULT FALSE,
  apple_health_kit_user_id VARCHAR(255),
  apple_last_sync TIMESTAMP,
  
  -- Google Fit (futuro)
  google_connected BOOLEAN DEFAULT FALSE,
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_token_expires_at TIMESTAMP,
  google_user_id VARCHAR(255),
  google_last_sync TIMESTAMP,
  
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.2 Nueva Tabla: `health_metrics`

```sql
CREATE TABLE health_metrics (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Identificación
  date DATE NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'oura', 'whoop', 'apple', 'google'
  
  -- Sueño
  sleep_duration_minutes INTEGER,
  sleep_quality_score INTEGER, -- 0-100
  deep_sleep_minutes INTEGER,
  light_sleep_minutes INTEGER,
  rem_sleep_minutes INTEGER,
  sleep_efficiency DECIMAL(5,2), -- 0-100
  
  -- Actividad
  total_calories_burned DECIMAL(8,2),
  active_calories_burned DECIMAL(8,2),
  steps INTEGER,
  distance_km DECIMAL(8,2),
  
  -- Recuperación
  recovery_score INTEGER, -- 0-100
  resting_heart_rate INTEGER,
  heart_rate_variability INTEGER, -- ms
  
  -- Entrenamiento
  strain_score DECIMAL(5,2), -- 0-21 (Whoop) o 0-100 (otros)
  workout_duration_minutes INTEGER,
  workout_type VARCHAR(100),
  
  -- Salud cardiovascular
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,
  spo2_percentage DECIMAL(5,2), -- Saturación de oxígeno
  
  -- Estrés
  stress_level INTEGER, -- 0-100
  stress_score DECIMAL(5,2),
  
  -- Metadata
  synced_at TIMESTAMP DEFAULT NOW(),
  createdAt TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(userId, date, source)
);
```

### 4.3 Nueva Tabla: `health_insights`

```sql
CREATE TABLE health_insights (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Insight
  type VARCHAR(100) NOT NULL, -- 'sleep_quality', 'recovery', 'training_load', etc
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  
  -- Datos
  metric_value DECIMAL(10,2),
  metric_unit VARCHAR(50),
  comparison_value DECIMAL(10,2), -- Comparación con promedio
  
  -- Relevancia
  importance_level VARCHAR(20), -- 'low', 'medium', 'high'
  action_required BOOLEAN DEFAULT FALSE,
  
  -- Timestamp
  date DATE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### 4.4 Índices

```sql
CREATE INDEX idx_wearable_connections_userId ON wearable_connections(userId);
CREATE INDEX idx_health_metrics_userId_date ON health_metrics(userId, date);
CREATE INDEX idx_health_metrics_source ON health_metrics(source);
CREATE INDEX idx_health_insights_userId_date ON health_insights(userId, date);
CREATE INDEX idx_health_insights_type ON health_insights(type);
```

---

## 5. Componentes Backend

### 5.1 Nuevas Utilidades

**`server/_core/wearables.ts`:**
```typescript
// Oura Ring
export async function getOuraAuthUrl(state: string): Promise<string>
export async function exchangeOuraCode(code: string): Promise<OuraTokens>
export async function refreshOuraToken(refreshToken: string): Promise<OuraTokens>
export async function getOuraData(accessToken: string, dataType: string, date: string): Promise<any>

// Whoop
export async function getWhoopAuthUrl(state: string): Promise<string>
export async function exchangeWhoopCode(code: string): Promise<WhoopTokens>
export async function refreshWhoopToken(refreshToken: string): Promise<WhoopTokens>
export async function getWhoopData(accessToken: string, endpoint: string): Promise<any>

// Sincronización
export async function syncWearableData(userId: number, source: 'oura' | 'whoop'): Promise<void>
export async function generateHealthInsights(userId: number): Promise<void>
```

### 5.2 Nuevos Endpoints tRPC

**`healthHub` router:**

```typescript
export const healthHub = router({
  // Conexiones
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    // Retorna estado de conexiones (Oura, Whoop, etc)
  }),
  
  connectOura: protectedProcedure.mutation(async ({ ctx, input }) => {
    // Inicia flujo OAuth con Oura
  }),
  
  connectWhoop: protectedProcedure.mutation(async ({ ctx, input }) => {
    // Inicia flujo OAuth con Whoop
  }),
  
  disconnectWearable: protectedProcedure.input(z.object({ 
    device: z.enum(['oura', 'whoop']) 
  })).mutation(async ({ ctx, input }) => {
    // Desconecta dispositivo
  }),
  
  // Datos
  getMetrics: protectedProcedure.input(z.object({
    startDate: z.date(),
    endDate: z.date(),
    source: z.enum(['oura', 'whoop', 'all']).optional()
  })).query(async ({ ctx, input }) => {
    // Retorna métricas de salud
  }),
  
  getInsights: protectedProcedure.query(async ({ ctx }) => {
    // Retorna insights generados
  }),
  
  // Sincronización
  syncNow: protectedProcedure.input(z.object({
    device: z.enum(['oura', 'whoop'])
  })).mutation(async ({ ctx, input }) => {
    // Sincroniza datos inmediatamente
  }),
  
  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    // Retorna estado de sincronización
  })
});
```

### 5.3 Sincronización Automática

**Estrategia de sincronización:**

- **Frecuencia**: Cada 6 horas para datos históricos, cada 1 hora para datos recientes
- **Ventana de datos**: Últimos 30 días
- **Retry logic**: Reintentos exponenciales (1, 2, 4, 8 minutos)
- **Caché**: Datos cacheados por 1 hora para reducir llamadas API

**Implementación:**
```typescript
// server/_core/periodic-tasks.ts
export async function syncWearablesScheduled() {
  const users = await db.query.wearableConnections
    .findMany({
      where: or(
        eq(wearableConnections.oura_connected, true),
        eq(wearableConnections.whoop_connected, true)
      )
    });
  
  for (const connection of users) {
    if (connection.oura_connected) {
      await syncWearableData(connection.userId, 'oura');
    }
    if (connection.whoop_connected) {
      await syncWearableData(connection.userId, 'whoop');
    }
  }
}
```

---

## 6. Componentes Frontend

### 6.1 Nuevas Páginas

**`client/src/pages/HealthHub.tsx`:**
- Vista principal de Health Hub
- Tarjetas de conexión de dispositivos
- Resumen de métricas
- Gráficos de tendencias

**`client/src/pages/HealthHubConnect.tsx`:**
- Página de conexión de dispositivos
- Flujo OAuth
- Confirmación de conexión exitosa

**`client/src/pages/HealthMetrics.tsx`:**
- Visualización detallada de métricas
- Gráficos por período
- Comparativas

### 6.2 Nuevos Componentes

**`client/src/components/WearableCard.tsx`:**
- Tarjeta de dispositivo wearable
- Estado de conexión
- Última sincronización
- Botones de acción

**`client/src/components/HealthMetricsChart.tsx`:**
- Gráfico de métricas de salud
- Múltiples series de datos
- Rangos de normalidad

**`client/src/components/HealthInsights.tsx`:**
- Tarjetas de insights
- Recomendaciones
- Indicadores de importancia

**`client/src/components/SyncStatus.tsx`:**
- Indicador de sincronización
- Última actualización
- Botón de sincronización manual

### 6.3 Nuevo Hook

**`client/src/hooks/useHealthHub.ts`:**
```typescript
export function useHealthHub() {
  return {
    // Conexiones
    connections: useQuery(),
    connectOura: useMutation(),
    connectWhoop: useMutation(),
    disconnect: useMutation(),
    
    // Datos
    metrics: useQuery(),
    insights: useQuery(),
    
    // Sincronización
    syncNow: useMutation(),
    syncStatus: useQuery()
  }
}
```

---

## 7. Integración en Dashboard

### 7.1 Widget de Health Hub

En `client/src/pages/Home.tsx`, agregar:

```tsx
<section className="health-hub-widget">
  <h3>Health Hub</h3>
  
  {/* Estado de conexiones */}
  <div className="wearable-status">
    <WearableCard device="oura" />
    <WearableCard device="whoop" />
  </div>
  
  {/* Métricas principales */}
  <div className="metrics-summary">
    <MetricCard label="Sueño" value={`${sleepHours}h`} />
    <MetricCard label="Recuperación" value={`${recoveryScore}%`} />
    <MetricCard label="Entrenamiento" value={`${strainScore}/21`} />
  </div>
  
  {/* Insights */}
  <HealthInsights insights={insights} />
</section>
```

---

## 8. Roadmap de Implementación

### Fase 1: Preparación (Semana 1)
- [ ] Registrar aplicaciones en Oura y Whoop
- [ ] Obtener Client ID y Client Secret
- [ ] Crear tablas en base de datos
- [ ] Documentar APIs

### Fase 2: Backend - Autenticación (Semana 2)
- [ ] Implementar OAuth con Oura
- [ ] Implementar OAuth con Whoop
- [ ] Crear endpoints de conexión/desconexión
- [ ] Encriptar tokens en BD

### Fase 3: Backend - Sincronización (Semana 3)
- [ ] Implementar sincronización de Oura
- [ ] Implementar sincronización de Whoop
- [ ] Crear tabla de métricas
- [ ] Implementar retry logic

### Fase 4: Backend - Insights (Semana 4)
- [ ] Crear algoritmo de generación de insights
- [ ] Implementar comparativas con promedios
- [ ] Crear recomendaciones personalizadas
- [ ] Tests unitarios

### Fase 5: Frontend - UI (Semana 5)
- [ ] Crear página HealthHub
- [ ] Crear componentes de conexión
- [ ] Crear gráficos de métricas
- [ ] Integrar en dashboard

### Fase 6: Integración (Semana 6)
- [ ] Conectar frontend con backend
- [ ] Pruebas E2E
- [ ] Optimización de performance
- [ ] Documentación

### Fase 7: Testing (Semana 7)
- [ ] Tests de sincronización
- [ ] Tests de seguridad (encriptación de tokens)
- [ ] Tests de performance
- [ ] Pruebas con datos reales

### Fase 8: Deployment (Semana 8)
- [ ] Deployment a staging
- [ ] Pruebas de usuario
- [ ] Deployment a producción
- [ ] Monitoreo

---

## 9. Consideraciones de Seguridad

### 9.1 Protección de Tokens

- Almacenar tokens encriptados en BD (AES-256)
- Usar variables de entorno para claves de encriptación
- Implementar rotación de tokens
- Nunca exponer tokens en logs o errores

### 9.2 Rate Limiting

- Oura: 100 requests/minuto
- Whoop: 120 requests/minuto
- Implementar queue de sincronización

### 9.3 Privacidad

- Cumplir con GDPR
- Permitir eliminación de datos
- Transparencia en recopilación de datos
- Opción de desconexión inmediata

---

## 10. Métricas y Monitoreo

### 10.1 KPIs

- Número de usuarios conectados por dispositivo
- Tasa de sincronización exitosa
- Tiempo promedio de sincronización
- Número de insights generados
- Engagement con Health Hub

### 10.2 Alertas

- Sincronización fallida 3 veces consecutivas
- Token expirado no renovable
- Tasa de error > 5%
- Tiempo de respuesta > 5 segundos

---

## 11. Roadmap Futuro

### Fase 2: Más Dispositivos
- Apple Health (iOS)
- Google Fit (Android)
- Fitbit
- Garmin

### Fase 3: Análisis Avanzado
- Machine Learning para predicciones
- Correlación nutrición-métricas
- Recomendaciones personalizadas basadas en IA
- Alertas proactivas

### Fase 4: Integración Ecosistema
- Compartir datos con BuddyCoach
- Sincronizar con BuddyCare
- Recomendaciones de BuddyExperts basadas en Health Hub

---

## 12. Referencias

- [Oura API Documentation](https://cloud.ouraring.com/v2/docs)
- [Whoop API Documentation](https://developer.whoop.com/api/)
- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**Documento preparado por:** Manus AI Agent  
**Fecha de creación:** 10 de mayo de 2026  
**Última actualización:** 10 de mayo de 2026  
**Versión:** 1.0
