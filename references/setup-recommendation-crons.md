# Setup Recommendation Crons

Este documento explica cómo configurar los crons automáticos para generar recomendaciones de productos.

## Requisitos

1. **Proyecto desplegado** - Los crons solo funcionan con el sitio en producción
2. **Handlers registrados** - Los 3 handlers están registrados en `server/_core/index.ts`:
   - `POST /api/scheduled/generateRecommendations`
   - `POST /api/scheduled/cleanupRecommendations`
   - `POST /api/scheduled/refreshProductCache`

## Crear los Crons

Después de desplegar, ejecuta estos comandos en el sandbox:

### 1. Generar Recomendaciones (cada 6 horas)

```bash
manus-heartbeat create \
  --name recommendation-generation \
  --cron "0 0 */6 * * *" \
  --path /api/scheduled/generateRecommendations \
  --description "Generate product recommendations for all active users every 6 hours"
```

**Explicación del cron:**
- `0` - Segundos (siempre 0)
- `0` - Minutos (en la hora exacta)
- `*/6` - Cada 6 horas (0, 6, 12, 18)
- `* * *` - Todos los días del mes, mes, día de la semana

### 2. Limpiar Recomendaciones Expiradas (diariamente a las 3 AM UTC)

```bash
manus-heartbeat create \
  --name recommendation-cleanup \
  --cron "0 0 3 * * *" \
  --path /api/scheduled/cleanupRecommendations \
  --description "Cleanup expired recommendations daily at 3 AM UTC"
```

### 3. Refrescar Cache de Productos (cada 12 horas)

```bash
manus-heartbeat create \
  --name product-cache-refresh \
  --cron "0 0 */12 * * *" \
  --path /api/scheduled/refreshProductCache \
  --description "Refresh product cache from external APIs every 12 hours"
```

## Verificar Crons

Para listar todos los crons creados:

```bash
manus-heartbeat list
```

Para ver detalles de un cron específico:

```bash
manus-heartbeat list --name recommendation-generation
```

## Gestionar Crons

### Pausar un cron

```bash
manus-heartbeat update <task_uid> --enable false
```

### Reanudar un cron

```bash
manus-heartbeat update <task_uid> --enable true
```

### Eliminar un cron

```bash
manus-heartbeat delete <task_uid>
```

### Ver logs de ejecución

```bash
manus-heartbeat logs <task_uid>
```

## Monitoreo

Los crons se pueden monitorear desde:

1. **Manus Dashboard** (manus.im)
   - Ir a Settings → Scheduled Tasks
   - Ver historial de ejecuciones
   - Pausar/reanudar crons
   - Ver logs de errores

2. **Sandbox CLI**
   ```bash
   manus-heartbeat list --verbose
   ```

3. **Logs del servidor**
   ```bash
   tail -f .manus-logs/devserver.log | grep "Job"
   ```

## Troubleshooting

### El cron no se ejecuta

1. Verifica que el sitio está desplegado
2. Verifica que el handler está registrado en `server/_core/index.ts`
3. Verifica que el cron está habilitado: `manus-heartbeat list`
4. Revisa los logs: `manus-heartbeat logs <task_uid>`

### Error: "cron-only"

El handler rechaza la solicitud porque no es un cron. Esto significa:
- El handler no está siendo llamado por el sistema de crons de Manus
- Verifica que el `task_uid` es correcto en la BD

### Error: "Handler timeout"

El handler tardó más de 2 minutos. Esto puede ocurrir si:
- Hay muchos usuarios (>1000)
- Las APIs externas están lentas
- La BD está sobrecargada

Solución: Reduce `maxUsersPerRun` en `generateRecommendationsJob`

## Próximos Pasos

1. Desplegar el proyecto
2. Ejecutar los comandos de `manus-heartbeat create` arriba
3. Verificar que los crons se ejecutan correctamente
4. Monitorear los logs en el dashboard de Manus

## Notas

- Los crons se ejecutan en UTC
- El timeout máximo es 2 minutos por ejecución
- Los errores 5xx se reintentan automáticamente (hasta 3 veces)
- Los errores 4xx se consideran fallos de negocio y no se reintentan
