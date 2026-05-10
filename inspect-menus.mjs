import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const r = await pool.query(`
  SELECT eam.id, eam."originalMenuTitle", eam."originalMenuId", eam."adaptedMenuData", eam.status, eam."expertNotes",
         em."menuData" as orig_menu_data, em.title as orig_title
  FROM expert_assigned_menus eam
  LEFT JOIN expert_menus em ON em.id = eam."originalMenuId"
  LIMIT 3
`);

for (const row of r.rows) {
  console.log('\n=== Menu ID:', row.id, '===');
  console.log('Title:', row.originalMenuTitle);
  console.log('Status:', row.status);
  console.log('HasAdaptedMenuData:', !!row.adaptedMenuData);
  console.log('OrigMenuId:', row.originalMenuId, '| OrigTitle:', row.orig_title);
  
  if (row.adaptedMenuData) {
    try {
      const d = JSON.parse(row.adaptedMenuData);
      console.log('AdaptedMenuData keys:', Object.keys(d));
      if (d.days) console.log('Days[0]:', JSON.stringify(d.days[0]).substring(0, 400));
    } catch(e) {
      console.log('AdaptedMenuData (raw):', String(row.adaptedMenuData).substring(0, 200));
    }
  }
  
  if (row.orig_menu_data) {
    try {
      const d = JSON.parse(row.orig_menu_data);
      console.log('OrigMenuData keys:', Object.keys(d));
      const sample = d.days?.[0] || d.weeks?.[0] || d[Object.keys(d)[0]];
      console.log('Sample:', JSON.stringify(sample).substring(0, 500));
    } catch(e) {
      console.log('OrigMenuData (raw):', String(row.orig_menu_data).substring(0, 200));
    }
  }
}

await pool.end();
