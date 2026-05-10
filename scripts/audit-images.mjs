import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [total] = await conn.execute('SELECT COUNT(*) as n FROM recipes');
console.log('Total recetas:', total[0].n);

const [noImg] = await conn.execute("SELECT COUNT(*) as n FROM recipes WHERE image_url IS NULL OR image_url = ''");
console.log('Sin imagen:', noImg[0].n);

const [placeholder] = await conn.execute("SELECT COUNT(*) as n FROM recipes WHERE image_url LIKE '%placeholder%' OR image_url LIKE '%unsplash%' OR image_url LIKE '%picsum%'");
console.log('Con placeholder:', placeholder[0].n);

const [s3] = await conn.execute("SELECT COUNT(*) as n FROM recipes WHERE image_url LIKE '%storage%' OR image_url LIKE '%amazonaws%' OR image_url LIKE '%forge%' OR image_url LIKE '%manus%'");
console.log('Con imagen S3/real:', s3[0].n);

// Ver ejemplos de URLs de imagen para entender el patrón
const [examples] = await conn.execute('SELECT id, name, image_url FROM recipes ORDER BY id LIMIT 15');
console.log('\nEjemplos de URLs:');
examples.forEach(r => console.log(`  ID ${r.id}: ${r.name?.substring(0,30)} -> ${r.image_url?.substring(0,80) || 'NULL'}`));

// Ver cuántas tienen imagen generada por el script diario (con forge/manus)
const [generated] = await conn.execute("SELECT COUNT(*) as n FROM recipes WHERE image_url LIKE '%forge%'");
console.log('\nGeneradas por script IA (forge):', generated[0].n);

// Recetas que necesitan imagen (sin imagen o con placeholder)
const [needImg] = await conn.execute("SELECT COUNT(*) as n FROM recipes WHERE image_url IS NULL OR image_url = '' OR image_url LIKE '%placeholder%' OR image_url LIKE '%unsplash%' OR image_url LIKE '%picsum%'");
console.log('Recetas que NECESITAN imagen:', needImg[0].n);

await conn.end();
