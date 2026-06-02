import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { Resend } from 'resend';
import fs from 'fs';

const resend = new Resend('re_9StPqYkU_HaccQGGh9cvBGEppxKUmKzUU');
const html = fs.readFileSync(new URL('./email-vip-campaign.html', import.meta.url), 'utf8');

async function main() {
  // Connect to DB
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const { rows } = await pool.query('SELECT email FROM founder_emails');
  await pool.end();

  console.log(`Found ${rows.length} VIP contacts. Sending campaign...`);

  let success = 0;
  let failed = 0;
  const errors = [];

  // Send in batches of 10
  for (let i = 0; i < rows.length; i += 10) {
    const batch = rows.slice(i, i + 10);
    const promises = batch.map(async (row) => {
      try {
        const { data, error } = await resend.emails.send({
          from: 'Luis María - BuddyOne <luis@buddyone.io>',
          to: row.email,
          subject: '¡BuddyOne ya está activo! Tu regalo: 3 meses de Pro Max gratis',
          html: html,
        });
        if (error) {
          failed++;
          errors.push({ email: row.email, error: error.message });
          console.log(`  ✗ ${row.email}: ${error.message}`);
        } else {
          success++;
          console.log(`  ✓ ${row.email}`);
        }
      } catch (err) {
        failed++;
        errors.push({ email: row.email, error: err.message });
        console.log(`  ✗ ${row.email}: ${err.message}`);
      }
    });
    await Promise.all(promises);

    // Small delay between batches
    if (i + 10 < rows.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n========== RESULTADO ==========`);
  console.log(`Total: ${rows.length}`);
  console.log(`Enviados: ${success}`);
  console.log(`Fallidos: ${failed}`);
  if (errors.length > 0) {
    console.log(`\nErrores:`);
    errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
  }
}

main().catch(console.error);
