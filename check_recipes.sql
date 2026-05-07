-- Contar total de recetas
SELECT COUNT(*) as total_recipes FROM recipes;

-- Contar recetas con imagen
SELECT COUNT(*) as recipes_with_image FROM recipes WHERE image IS NOT NULL AND image != '';

-- Contar recetas sin imagen
SELECT COUNT(*) as recipes_without_image FROM recipes WHERE image IS NULL OR image = '';

-- Porcentaje de cobertura
SELECT 
  ROUND(100.0 * COUNT(CASE WHEN image IS NOT NULL AND image != '' THEN 1 END) / COUNT(*), 2) as coverage_percentage
FROM recipes;

-- Primeras 5 recetas sin imagen
SELECT id, name FROM recipes WHERE image IS NULL OR image = '' LIMIT 5;

-- Primeras 5 recetas con imagen
SELECT id, name, SUBSTRING(image, 1, 80) as image_url FROM recipes WHERE image IS NOT NULL AND image != '' LIMIT 5;
