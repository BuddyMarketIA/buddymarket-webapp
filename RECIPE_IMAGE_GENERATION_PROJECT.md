# 🖼️ Proyecto: Regeneración de Imágenes de Recetas

## Objetivo
Regenerar todas las imágenes de recetas (17,000+) con calidad ultrarealista en formato cuadrado (1080x1080), usando IA generativa y almacenamiento en S3.

## Especificaciones
- **Formato:** 1080x1080 px (cuadrado)
- **Estilo:** Mixto (profesional + lifestyle)
- **Total de recetas:** ~17,000
- **Generación:** Una por una con delays para evitar rate limits
- **Almacenamiento:** S3 (CDN)
- **Actualización BD:** Automática tras cada generación

## Arquitectura

### 1. Script de Generación (`scripts/generate-recipe-images.mjs`)
```
- Lee recetas de la BD
- Genera prompt ultrarealista para cada receta
- Llama a IA generativa (imageGeneration helper)
- Sube imagen a S3 con key: recipes/{id}-{name}-1080x1080.jpg
- Actualiza BD con nueva URL
- Guarda progreso en archivo JSON
```

### 2. Configuración de Prompts
Cada receta genera un prompt único con:
- Nombre de la receta
- Estilo fotográfico profesional
- Composición cuadrada (1:1)
- Iluminación de estudio
- Presentación apetitosa
- Ángulo de 45 grados

Ejemplo:
```
Professional food photography of Pasta Carbonara. Square composition (1:1 ratio). 
Ultrarealistically detailed, studio lighting, appetizing presentation, fresh ingredients visible. 
High-quality, magazine-style food photography. Shot from above at 45 degrees angle. 
Beautiful plating, natural colors, professional culinary presentation.
```

### 3. Almacenamiento S3
- **Bucket:** Público (CDN)
- **Path:** `recipes/{recipeId}-{recipeName}-1080x1080.jpg`
- **Formato:** JPEG optimizado
- **URLs:** Directas sin firma (públicas)

### 4. Monitoreo de Progreso
Archivo: `/tmp/recipe-images-progress.json`
```json
{
  "processed": 1250,
  "generated": 1200,
  "failed": 50,
  "startTime": "2026-05-07T04:50:00.000Z"
}
```

## Ejecución

### Opción 1: Generación Completa (Recomendado para producción)
```bash
# Genera todas las 17,000 recetas
node scripts/generate-recipe-images.mjs
```

### Opción 2: Generación por Lotes
```bash
# Genera 100 recetas por sesión
# Puede pausarse y reanudarse
node scripts/generate-recipe-images.mjs --batch 100
```

### Opción 3: Generación Bajo Demanda
```bash
# Genera imagen cuando se visualiza la receta
# Implementar en tRPC recipes.getDetail
```

## Integración con BD

### Schema Update (si es necesario)
```sql
ALTER TABLE recipes ADD COLUMN imageUrl_new VARCHAR(2048);
ALTER TABLE recipes ADD COLUMN imageGeneratedAt TIMESTAMP;
ALTER TABLE recipes ADD COLUMN imageQuality ENUM('original', 'ai_generated');
```

### Actualización de Recetas
```typescript
// En script de generación
await db.update(recipes)
  .set({ 
    imageUrl: s3Url,
    imageGeneratedAt: new Date(),
    imageQuality: 'ai_generated'
  })
  .where(eq(recipes.id, recipeId));
```

## Timing y Costos

### Estimación de Tiempo
- **17,000 recetas × 2 segundos delay = ~9.4 horas**
- Puede ejecutarse en background
- Recomendado: Ejecutar en horario nocturno

### Costos Estimados
- Generación de imágenes: Depende del proveedor IA
- Almacenamiento S3: ~17GB (17,000 × 1MB promedio)
- Transferencia: Incluida en CDN

## Ventajas

✅ **Calidad consistente** - Todas las imágenes con mismo estándar profesional
✅ **Escalable** - Puede procesarse en lotes o completo
✅ **Recuperable** - Guarda progreso, puede reanudarse
✅ **Automático** - Actualiza BD sin intervención manual
✅ **Rápido** - Una imagen cada 2 segundos
✅ **Económico** - Reutiliza helpers existentes de IA

## Próximos Pasos

1. ✅ Crear script de generación
2. ⏳ Ejecutar generación en lotes (primeras 1,000)
3. ⏳ Validar calidad de imágenes
4. ⏳ Ajustar prompts si es necesario
5. ⏳ Ejecutar generación completa (17,000)
6. ⏳ Actualizar BD con todas las URLs
7. ⏳ Verificar en frontend

## Monitoreo

### Ver Progreso
```bash
cat /tmp/recipe-images-progress.json | jq .
```

### Pausar/Reanudar
- Presionar Ctrl+C para pausar
- Ejecutar script nuevamente para reanudar desde donde se pausó

### Troubleshooting
- Si falla una receta, se registra en `failed` y continúa
- Revisar logs para recetas con error
- Regenerar solo las fallidas después

## Archivos Relacionados

- `scripts/generate-recipe-images.mjs` - Script principal
- `server/_core/imageGeneration.ts` - Helper de generación IA
- `server/storage.ts` - Helper de S3
- `server/db.ts` - Helpers de BD
- `drizzle/schema.ts` - Schema de recetas

## Notas

- Las imágenes generadas son ultrarealistas pero pueden variar ligeramente
- Cada ejecución genera imágenes diferentes (no determinístico)
- Recomendado ejecutar una sola vez y mantener las URLs
- Las URLs de S3 son permanentes y no expiran
