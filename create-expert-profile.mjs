import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

// Check valid enum values for category
const enumRes = await client.query(`
  SELECT enumlabel FROM pg_enum 
  JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
  WHERE pg_type.typname ILIKE '%category%' OR pg_type.typname ILIKE '%expert%'
`);
console.log('CATEGORY ENUM VALUES:', enumRes.rows.map(r => r.enumlabel));

// Check all enum types
const allEnumsRes = await client.query(`
  SELECT pg_type.typname, enumlabel FROM pg_enum 
  JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
  ORDER BY pg_type.typname, enumsortorder
`);
const enumMap: Record<string, string[]> = {};
for (const row of allEnumsRes.rows) {
  if (!enumMap[row.typname]) enumMap[row.typname] = [];
  enumMap[row.typname].push(row.enumlabel);
}
console.log('ALL ENUMS:', JSON.stringify(enumMap, null, 2));

await client.end();
