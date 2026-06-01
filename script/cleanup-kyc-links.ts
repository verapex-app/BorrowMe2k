/**
 * One-time cleanup: strip KYC links from users who have not submitted KYC
 * and are not in the protected email list, and release those pool entries
 * back to available.
 *
 * Protected emails (already used their links — do not touch):
 *   cngtworld2+5@gmail.com, cngtworld2+9@gmail.com, cngtworld2+8@gmail.com,
 *   cngtworld2+15@gmail.com, cngtworld2+53@gmail.com, cngtworld2+52@gmail.com,
 *   cngtworld2+64@gmail.com, cngtworld2+46@gmail.com
 *
 * Run once with: npx tsx script/cleanup-kyc-links.ts
 */

import { pool } from "../server/db";

const PROTECTED_EMAILS = [
  "cngtworld2+5@gmail.com",
  "cngtworld2+9@gmail.com",
  "cngtworld2+8@gmail.com",
  "cngtworld2+15@gmail.com",
  "cngtworld2+53@gmail.com",
  "cngtworld2+52@gmail.com",
  "cngtworld2+64@gmail.com",
  "cngtworld2+46@gmail.com",
];

async function main() {
  const client = await pool.connect();
  try {
    // Find users who have a kyc_link assigned but have NOT submitted KYC
    // and are not in the protected list.
    const placeholders = PROTECTED_EMAILS.map((_, i) => `$${i + 1}`).join(", ");
    const { rows: targets } = await client.query(
      `SELECT id, email, kyc_status, kyc_link
       FROM users
       WHERE kyc_link IS NOT NULL
         AND kyc_status = 'not_submitted'
         AND (email IS NULL OR email NOT IN (${placeholders}))`,
      PROTECTED_EMAILS,
    );

    if (targets.length === 0) {
      console.log("No users to clean up — all done.");
      return;
    }

    console.log(`Found ${targets.length} user(s) to strip KYC links from:`);
    for (const u of targets) {
      console.log(`  id=${u.id}  email=${u.email ?? "(none)"}  status=${u.kyc_status}`);
    }

    await client.query("BEGIN");

    const userIds = targets.map((u: any) => u.id);

    // Release pool entries back to available
    const releasePlaceholders = userIds.map((_: any, i: number) => `$${i + 1}`).join(", ");
    const releaseResult = await client.query(
      `UPDATE kyc_link_pool
       SET assigned_user_id = NULL, assigned_at = NULL
       WHERE assigned_user_id IN (${releasePlaceholders})`,
      userIds,
    );
    console.log(`Released ${releaseResult.rowCount} pool link(s) back to available.`);

    // Clear the kyc_link column on those users
    const clearResult = await client.query(
      `UPDATE users
       SET kyc_link = NULL
       WHERE id IN (${releasePlaceholders})`,
      userIds,
    );
    console.log(`Cleared kyc_link for ${clearResult.rowCount} user(s).`);

    await client.query("COMMIT");
    console.log("Cleanup complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Cleanup failed, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
