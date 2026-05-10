/**
 * Script to clean duplicate shopping lists in the database.
 * Keeps the most recent list for each (userId, menuOrganizerId, supermarket) combination.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log("🔍 Finding duplicate shopping lists...");

// Find duplicates: same userId + menuOrganizerId + supermarket, keep the latest
const [rows] = await connection.execute(`
  SELECT 
    userId, 
    menuOrganizerId, 
    supermarket,
    COUNT(*) as cnt,
    GROUP_CONCAT(id ORDER BY createdAt DESC) as ids
  FROM shopping_lists
  WHERE menuOrganizerId IS NOT NULL
  GROUP BY userId, menuOrganizerId, supermarket
  HAVING cnt > 1
`);

console.log(`Found ${rows.length} groups with duplicates`);

let totalDeleted = 0;
for (const row of rows) {
  const ids = row.ids.split(",").map(Number);
  // Keep the first (most recent), delete the rest
  const toDelete = ids.slice(1);
  console.log(`  Group (user=${row.userId}, menu=${row.menuOrganizerId}, supermarket=${row.supermarket}): keeping ${ids[0]}, deleting ${toDelete.join(", ")}`);
  
  for (const id of toDelete) {
    // Delete items first
    await connection.execute("DELETE FROM shopping_list_items WHERE shoppingListId = ?", [id]);
    // Delete the list
    await connection.execute("DELETE FROM shopping_lists WHERE id = ?", [id]);
    totalDeleted++;
  }
}

console.log(`\n✅ Deleted ${totalDeleted} duplicate shopping lists`);
await connection.end();
