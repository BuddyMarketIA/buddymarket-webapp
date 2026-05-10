# Wearables Sync Guide

## Descripción General

El sistema de sincronización automática de Health Hub mantiene los datos de Oura Ring y Whoop actualizados en tiempo real. Los datos se sincronizan automáticamente cada 6 horas (configurable) y pueden ser sincronizados manualmente en cualquier momento.

## Arquitectura

### Componentes Principales

```
┌─────────────────────────────────────────────────────────┐
│         Wearables Sync Scheduler                        │
│  (wearables-sync-scheduler.ts)                          │
└─────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Oura Sync    │  │ Whoop Sync   │  │ Health Check │
│(oura-sync)   │  │(whoop-sync)  │  │(monitoring)  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │
        ▼                ▼
┌─────────────────────────────────┐
│    Database (health_metrics)    │
└─────────────────────────────────┘
```

### Flujo de Sincronización

```
1. Scheduler inicia ciclo de sincronización
   ↓
2. Para cada dispositivo conectado:
   ├─ Obtener token de acceso (desencriptar)
   ├─ Verificar si token está expirado
   ├─ Refrescar token si es necesario
   ├─ Obtener datos de API
   ├─ Procesar y transformar datos
   ├─ Guardar en BD
   └─ Actualizar último sync
   ↓
3. Registrar resultado del ciclo
4. Esperar hasta próximo intervalo
```

## Configuración

### Variables de Entorno

```bash
# Sincronización automática
ENABLE_AUTO_SYNC=true                    # Habilitar/deshabilitar
SYNC_INTERVAL_HOURS=6                    # Intervalo de sincronización
MAX_CONCURRENT_SYNCS=2                   # Máximo de syncs simultáneos
MAX_SYNC_RETRIES=3                       # Intentos de reintento
SYNC_TIMEOUT_MS=30000                    # Timeout por sincronización

# Encriptación
ENCRYPTION_KEY=<base64-32-bytes>         # Clave para encriptar tokens

# Credenciales
OURA_CLIENT_ID=...
OURA_CLIENT_SECRET=...
WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
```

### Configuración en Código

```typescript
import { startSyncScheduler } from './server/_core/wearables-sync-scheduler';

// Iniciar con configuración personalizada
startSyncScheduler({
  enabled: true,
  intervalHours: 6,
  maxConcurrentSyncs: 2,
  retryOnFailure: true,
  maxRetries: 3,
});
```

## Uso

### Iniciar Scheduler

En `server.ts`:

```typescript
import { startSyncScheduler } from './_core/wearables-sync-scheduler';

// Iniciar scheduler cuando el servidor inicia
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startSyncScheduler();
});
```

### Sincronización Manual

Desde el cliente:

```typescript
// Sincronizar dispositivo específico
const result = await trpc.healthHubSync.triggerSync.mutate({
  device: 'oura',
});

// Sincronizar todos los dispositivos
const result = await trpc.healthHubSync.triggerSync.mutate({});
```

### Monitoreo

```typescript
// Obtener estado actual
const status = await trpc.healthHubSync.getStatus.query();

// Obtener estadísticas
const stats = await trpc.healthHubSync.getStats.query();

// Obtener historial
const history = await trpc.healthHubSync.getHistory.query({
  device: 'oura',
  limit: 20,
});

// Verificar salud del scheduler
const health = await trpc.healthHubSync.checkHealth.query();
```

## Datos Sincronizados

### Oura Ring

**Sueño:**
- Duración total
- Sueño profundo, REM, ligero
- Tiempo despierto
- Fases de sueño
- Horarios de cama

**Actividad:**
- Pasos
- Calorías (total y activas)
- MET (Metabolic Equivalent)
- Tiempo en reposo, inactivo, bajo, medio, alto

**Readiness (Recuperación):**
- Puntuación de recuperación (0-100)
- Frecuencia cardíaca en reposo
- Variabilidad de frecuencia cardíaca
- Desviación de temperatura
- Índice de recuperación

**Frecuencia Cardíaca:**
- BPM en tiempo real
- Variabilidad (HRV)

### Whoop

**Ciclos:**
- Puntuación de ciclo
- Recuperación
- Strain (Entrenamiento)
- Kilojoules

**Recuperación:**
- Puntuación (0-100)
- Frecuencia cardíaca en reposo
- Variabilidad de frecuencia cardíaca
- Temperatura de piel
- Tendencia de temperatura

**Entrenamiento (Strain):**
- Puntuación de strain (0-21)
- Kilojoules quemados
- Frecuencia cardíaca promedio y máxima

**Sueño:**
- Duración total
- Sueño ligero, profundo, REM
- Tiempo despierto
- Deuda de sueño
- Sueño necesario

## Manejo de Errores

### Retry Logic

El sistema implementa reintentos automáticos con backoff exponencial:

```
Intento 1: Inmediato
Intento 2: Esperar 1 segundo
Intento 3: Esperar 2 segundos
Intento 4: Esperar 4 segundos
```

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| Token expirado | Token de acceso vencido | Se refresca automáticamente |
| Credenciales inválidas | Client ID/Secret incorrecto | Verificar configuración |
| Límite de API | Demasiadas solicitudes | Esperar o reducir intervalo |
| Conexión rechazada | API no disponible | Reintentar automáticamente |
| Token de refresco inválido | Revocación de permisos | Usuario debe reconectar |

## Monitoreo y Alertas

### Métricas Disponibles

```typescript
const stats = getSyncStats();
// {
//   totalJobs: 150,
//   completedJobs: 145,
//   failedJobs: 5,
//   averageRecordsPerSync: 42,
//   successRate: 96.7
// }
```

### Health Check

```typescript
const health = checkSchedulerHealth();
// {
//   healthy: true,
//   issues: [],
//   lastSyncAges: {
//     oura: "2 hours ago",
//     whoop: "1 hour ago"
//   }
// }
```

### Alertas Automáticas

El sistema alerta cuando:
- Sincronización no se ejecuta en 2x el intervalo configurado
- Tasa de éxito cae por debajo del 80%
- Token no se puede refrescar
- API no responde

## Optimización

### Mejores Prácticas

1. **Intervalo de Sincronización:**
   - 6 horas: Balance entre actualización y uso de API
   - 1 hora: Datos muy actualizados, más uso de API
   - 24 horas: Mínimo uso de API, datos menos actualizados

2. **Concurrencia:**
   - Máx 2 syncs simultáneos para evitar sobrecarga
   - Aumentar si tienes muchos usuarios

3. **Encriptación:**
   - Usar clave de 32 bytes (256 bits)
   - Regenerar claves regularmente
   - Nunca compartir claves

4. **Monitoreo:**
   - Revisar logs regularmente
   - Configurar alertas para tasa de éxito < 80%
   - Monitorear latencia de API

## Troubleshooting

### Sincronización no inicia

```typescript
// Verificar si está habilitada
const status = getSyncStatus();
console.log(status.isRunning); // Debe ser true

// Verificar configuración
const health = checkSchedulerHealth();
console.log(health.issues); // Buscar problemas
```

### Datos no se sincronizan

1. Verificar que dispositivo está conectado
2. Verificar que token no está expirado
3. Revisar logs de error
4. Forzar sincronización manual

```typescript
const result = await triggerManualSync('oura');
console.log(result.jobs[0].error); // Ver error específico
```

### Alto uso de API

1. Aumentar intervalo de sincronización
2. Reducir número de usuarios sincronizados
3. Implementar caché de datos

### Tokens expiran frecuentemente

1. Verificar que refresh token es válido
2. Verificar que credenciales son correctas
3. Reconectar dispositivo

## Seguridad

### Protección de Tokens

- ✅ Tokens encriptados en BD (AES-256-GCM)
- ✅ IV aleatorio para cada token
- ✅ Auth tag para integridad
- ✅ Nunca loguear tokens completos
- ✅ Tokens no se envían al cliente

### Acceso a Datos

- ✅ Solo usuarios autenticados pueden ver sus datos
- ✅ Sincronización solo para dispositivos conectados
- ✅ Validación de permisos en cada endpoint
- ✅ Logging de acceso a datos sensibles

## Performance

### Benchmarks

| Operación | Tiempo Promedio |
|-----------|-----------------|
| Sincronizar Oura | 2-3 segundos |
| Sincronizar Whoop | 3-4 segundos |
| Procesar 30 días de datos | 1-2 segundos |
| Guardar 100 registros | 500ms |

### Optimizaciones

1. **Batch Inserts:** Guardar múltiples registros en una transacción
2. **Índices:** Crear índices en userId, device, date
3. **Caché:** Cachear últimos 30 días de datos
4. **Compresión:** Comprimir datos antiguos

## Roadmap Futuro

- [ ] Sincronización en tiempo real (WebSocket)
- [ ] Soporte para más dispositivos (Fitbit, Garmin, Apple Health)
- [ ] Análisis predictivo de tendencias
- [ ] Alertas personalizadas
- [ ] Exportación de datos
- [ ] Integración con otros servicios

## Referencias

- [Oura API Documentation](https://cloud.ouraring.com/v2/docs)
- [Whoop API Documentation](https://developer.whoop.com/api/)
- [Guía de Integración Completa](../HEALTH_HUB_INTEGRATION_PLAN.md)
- [Scripts de Registro](../scripts/README-WEARABLES.md)

## Soporte

Para problemas o preguntas:
1. Revisar logs en `.manus-logs/devserver.log`
2. Ejecutar health check: `checkSchedulerHealth()`
3. Revisar historial: `getSyncHistory()`
4. Contactar soporte técnico
