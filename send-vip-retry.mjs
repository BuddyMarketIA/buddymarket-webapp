import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
import { Resend } from 'resend';
import fs from 'fs';

const resend = new Resend('re_9StPqYkU_HaccQGGh9cvBGEppxKUmKzUU');
const html = fs.readFileSync(new URL('./email-vip-campaign.html', import.meta.url), 'utf8');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const { rows } = await pool.query('SELECT email FROM founder_emails');
  await pool.end();

  // Get list of already sent emails from first run (68 sent successfully)
  // We'll just retry all - Resend handles dedup, or we send sequentially
  console.log(`Retrying ${rows.length} VIP contacts with rate limiting (2/sec)...`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const { data, error } = await resend.emails.send({
        from: 'Luis María - BuddyOne <luis@buddyone.io>',
        to: row.email,
        subject: '¡BuddyOne ya está activo! Tu regalo: 3 meses de Pro Max gratis',
        html: html,
      });
      if (error) {
        if (error.message && error.message.includes('Too many requests')) {
          // Wait longer and retry
          console.log(`  ⏳ Rate limited on ${row.email}, waiting 2s...`);
          await sleep(2000);
          const retry = await resend.emails.send({
            from: 'Luis María - BuddyOne <luis@buddyone.io>',
            to: row.email,
            subject: '¡BuddyOne ya está activo! Tu regalo: 3 meses de Pro Max gratis',
            html: html,
          });
          if (retry.error) {
            failed++;
            errors.push({ email: row.email, error: retry.error.message });
            console.log(`  ✗ ${row.email}: ${retry.error.message}`);
          } else {
            success++;
            console.log(`  ✓ ${row.email} (retry)`);
          }
        } else {
          failed++;
          errors.push({ email: row.email, error: error.message });
          console.log(`  ✗ ${row.email}: ${error.message}`);
        }
      } else {
        success++;
        console.log(`  ✓ ${row.email}`);
      }
    } catch (err) {
      failed++;
      errors.push({ email: row.email, error: err.message });
      console.log(`  ✗ ${row.email}: ${err.message}`);
    }
    // Wait 600ms between each email (under 2/sec to be safe)
    await sleep(600);
  }

  console.log(`\n========== RESULTADO FINAL ==========`);
  console.log(`Total: ${rows.length}`);
  console.log(`Enviados: ${success}`);
  console.log(`Fallidos: ${failed}`);
  if (errors.length > 0) {
    console.log(`\nErrores:`);
    errors.forEach(e => console.log(`  - ${e.email}: ${e.error}`));
  }
}

main().catch(console.error);
