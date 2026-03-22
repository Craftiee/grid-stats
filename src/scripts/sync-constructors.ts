/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GRIDSTATS — Constructor First-Entry Sync
 * Fetches each season's constructor list from Jolpica and populates
 * the `firstEntry` field for all constructors in the DB.
 *
 * Usage:  npm run sync:constructors
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const START_YEAR = 1950;
const END_YEAR = new Date().getFullYear();

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

async function main() {
  console.log('\n🏎  GRIDSTATS — Constructor first-entry sync');
  console.log('─'.repeat(50));

  // Build map: constructorId → earliest year seen in API
  const firstSeen = new Map<string, number>();

  const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

  // Fetch in batches of 10 years to avoid hammering the API
  for (let i = 0; i < years.length; i += 10) {
    const batch = years.slice(i, i + 10);
    await Promise.all(
      batch.map(async (year) => {
        try {
          const json = await fetchJson(`${JOLPICA_BASE}/${year}/constructors.json?limit=100`);
          const constructors: any[] = json?.MRData?.ConstructorTable?.Constructors ?? [];
          for (const c of constructors) {
            const id: string = c.constructorId;
            if (!firstSeen.has(id) || firstSeen.get(id)! > year) {
              firstSeen.set(id, year);
            }
          }
        } catch {
          // Some early years may have no data — skip silently
        }
      }),
    );
    const progress = Math.min(i + 10, years.length);
    process.stdout.write(`\r  Fetched years up to ${START_YEAR + progress - 1}...`);
  }

  console.log(`\n  API returned data for ${firstSeen.size} constructors`);

  // Update DB constructors where we have a first-entry year
  let updated = 0;
  let skipped = 0;

  for (const [constructorId, year] of Array.from(firstSeen)) {
    const result = await (prisma.constructor as any).updateMany({
      where: { constructorId },
      data: { firstEntry: year },
    });
    if (result.count > 0) updated++;
    else skipped++;
  }

  console.log(`  ✓ Updated ${updated} constructors`);
  if (skipped > 0) console.log(`  ⚠  ${skipped} IDs from API not found in DB`);

  // Report how many still have null firstEntry
  const stillNull = await prisma.constructor.count({ where: { firstEntry: null } });
  console.log(`  ℹ  ${stillNull} constructors still have no firstEntry (historical/obscure)`);

  await prisma.syncLog.create({
    data: { dataType: 'constructor_first_entry', status: 'SUCCESS' },
  });

  console.log('\n✅ Done\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
