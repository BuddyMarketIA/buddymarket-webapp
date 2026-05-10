# 🖼️ Guía de Uso: Generación de Imágenes de Recetas

## Inicio Rápido

### 1. Preparación
```bash
cd /home/ubuntu/buddymarket-webapp

# Hacer script ejecutable
chmod +x scripts/setup-image-generation.sh

# Ejecutar setup
./scripts/setup-image-generation.sh
```

### 2. Iniciar Generación
```bash
# Opción A: Generar todas las recetas (recomendado)
node scripts/generate-recipe-images.mjs

# Opción B: Generar solo un lote (para testing)
node scripts/generate-recipe-images.mjs --batch 10
```

### 3. Monitorear Progreso
En otra terminal:
```bash
# Ver progreso en tiempo real
watch -n 5 'cat /tmp/recipe-images-progress.json | jq .'

# O manualmente
cat /tmp/recipe-images-progress.json | jq .
```

## Detalles Técnicos

### Flujo de Generación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Leer receta de BD (nombre, ID)                           │
├─────────────────────────────────────────────────────────────┤
│ 2. Generar prompt ultrarealista                             │
│    "Professional food photography of [RECIPE]..."           │
├─────────────────────────────────────────────────────────────┤
│ 3. Llamar a IA generativa (imageGeneration helper)          │
│    → Genera imagen 1080x1080                                │
├─────────────────────────────────────────────────────────────┤
│ 4. Subir a S3 (storagePut helper)                           │
│    → Key: recipes/{id}-{name}-1080x1080.jpg                │
│    → URL: https://cdn.../recipes/{id}-{name}...            │
├─────────────────────────────────────────────────────────────┤
│ 5. Actualizar BD con nueva URL                              │
│    → recipes.imageUrl = s3_url                              │
├─────────────────────────────────────────────────────────────┤
│ 6. Guardar progreso y esperar 2 segundos                    │
│    → /tmp/recipe-images-progress.json                       │
└─────────────────────────────────────────────────────────────┘
```

### Prompts Utilizados

Cada receta genera un prompt único con:

```
Professional food photography of [NOMBRE_RECETA]. 
Square composition (1:1 ratio). 
Ultrarealistically detailed, studio lighting, appetizing presentation, 
fresh ingredients visible. 
High-quality, magazine-style food photography. 
Shot from above at 45 degrees angle. 
Beautiful plating, natural colors, professional culinary presentation.
```

**Variaciones según tipo de receta:**
- Ensaladas: "Fresh, vibrant colors, ingredients clearly visible"
- Carnes: "Juicy, perfectly cooked, golden brown exterior"
- Postres: "Delicate, elegant presentation, appetizing details"
- Bebidas: "Refreshing, condensation on glass, ice cubes visible"

### Almacenamiento S3

**Estructura de carpetas:**
```
s3://bucket/
├── recipes/
│   ├── 1-pasta-carbonara-1080x1080.jpg
│   ├── 2-ensalada-cesar-1080x1080.jpg
│   ├── 3-salmon-mantequilla-1080x1080.jpg
│   └── ...
```

**URLs públicas:**
```
https://cdn.../recipes/1-pasta-carbonara-1080x1080.jpg
https://cdn.../recipes/2-ensalada-cesar-1080x1080.jpg
```

## Monitoreo y Control

### Ver Progreso Detallado
```bash
# Formato JSON
cat /tmp/recipe-images-progress.json | jq .

# Salida esperada:
# {
#   "processed": 1250,
#   "generated": 1200,
#   "failed": 50,
#   "startTime": "2026-05-07T04:50:00.000Z"
# }
```

### Estadísticas en Tiempo Real
```bash
# Recetas por segundo
watch -n 10 'echo "Rate: $(jq .processed /tmp/recipe-images-progress.json) / $(jq .startTime /tmp/recipe-images-progress.json)"'

# Tasa de éxito
jq '.generated / .processed * 100' /tmp/recipe-images-progress.json
```

### Pausar y Reanudar
```bash
# Pausar (Ctrl+C en la terminal donde corre el script)
# El progreso se guarda automáticamente

# Reanudar (ejecutar el script nuevamente)
node scripts/generate-recipe-images.mjs
# Continuará desde donde se pausó
```

## Troubleshooting

### Problema: "Error: Cannot read properties of undefined"
**Solución:** Asegurar que los helpers de IA y S3 están disponibles
```bash
# Verificar que existen
ls -la server/_core/imageGeneration.ts
ls -la server/storage.ts
```

### Problema: "Rate limit exceeded"
**Solución:** Aumentar el delay entre generaciones
```bash
# En generate-recipe-images.mjs, cambiar:
const DELAY_MS = 5000; // De 2000 a 5000
```

### Problema: "S3 upload failed"
**Solución:** Verificar credenciales de S3
```bash
# Verificar variables de entorno
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
```

### Problema: "Algunas imágenes se ven mal"
**Solución:** Ajustar el prompt
```bash
# Editar el prompt en generate-recipe-images.mjs
const prompt = `...ajustar descripción...`;
```

## Validación de Resultados

### Verificar Imágenes Generadas
```bash
# Ver primeras 10 URLs generadas
head -10 /tmp/recipe-images-urls.txt

# Descargar una imagen para verificar
curl -o /tmp/test-image.jpg "https://cdn.../recipes/1-pasta-carbonara-1080x1080.jpg"
file /tmp/test-image.jpg
```

### Verificar BD Actualizada
```bash
# Conectar a BD y verificar
mysql -h $DB_HOST -u $DB_USER -p $DB_NAME

# Ejecutar query
SELECT id, name, imageUrl, imageQuality FROM recipes LIMIT 5;
```

## Optimizaciones

### Para Acelerar
1. Reducir DELAY_MS (pero cuidado con rate limits)
2. Ejecutar en máquina con mejor CPU/GPU
3. Usar batch processing en paralelo (con cuidado)

### Para Ahorrar Costos
1. Generar solo recetas sin imagen
2. Generar por categoría (recetas populares primero)
3. Reutilizar imágenes similares

### Para Mejorar Calidad
1. Usar prompts más específicos por tipo de receta
2. Generar múltiples versiones y seleccionar la mejor
3. Post-procesamiento con herramientas de edición

## Estadísticas Esperadas

| Métrica | Valor |
|---------|-------|
| Total recetas | 17,000 |
| Tiempo por imagen | 2 segundos |
| Tiempo total | ~9.4 horas |
| Tamaño promedio | 1 MB |
| Almacenamiento total | ~17 GB |
| Tasa de éxito esperada | 95-98% |
| Imágenes fallidas | 340-850 |

## Después de la Generación

### 1. Validar Resultados
```bash
# Verificar que todas las URLs están en la BD
SELECT COUNT(*) FROM recipes WHERE imageUrl LIKE 'https://cdn%';

# Comparar con total de recetas
SELECT COUNT(*) FROM recipes;
```

### 2. Limpiar Imágenes Antiguas
```bash
# Hacer backup de URLs antiguas
SELECT id, name, imageUrl FROM recipes WHERE imageQuality = 'original' > backup-urls.sql

# Eliminar imágenes antiguas de S3 (opcional)
aws s3 rm s3://bucket/recipes-old/ --recursive
```

### 3. Actualizar Frontend
```bash
# Las imágenes se cargarán automáticamente desde las nuevas URLs
# No requiere cambios en el código
```

### 4. Monitorear Rendimiento
```bash
# Verificar que las imágenes cargan correctamente
# Revisar logs de CDN
# Monitorear tiempo de carga de páginas
```

## Notas Importantes

⚠️ **Antes de iniciar:**
- Asegurar que hay espacio en S3 (~17GB)
- Verificar que la BD está respaldada
- Confirmar que las credenciales de IA están activas
- Tener conexión a internet estable

⚠️ **Durante la generación:**
- No interrumpir el script (usar Ctrl+C para pausar correctamente)
- Monitorear el uso de recursos
- Revisar logs periódicamente

⚠️ **Después de la generación:**
- Validar que todas las imágenes se generaron
- Verificar que las URLs funcionan
- Hacer pruebas en frontend
- Documentar cambios

## Soporte

Si encuentras problemas:
1. Revisar logs en `logs/image-generation-*.log`
2. Consultar `RECIPE_IMAGE_GENERATION_PROJECT.md` para detalles técnicos
3. Contactar al equipo de desarrollo
