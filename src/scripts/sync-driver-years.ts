/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GRIDSTATS — Driver Career Year Sync
 * Fetches each season's driver list from Jolpica and populates
 * debutYear, lastRaceYear, and racingDecades for all drivers in the DB.
 *
 * racingDecades stores each distinct decade the driver actually raced in,
 * so a driver who raced in 2009 and 2020 (skipping the 2010s) will appear
 * in [2000, 2020] — not [2000, 2010, 2020].
 *
 * Usage:  npm run sync:driver-years
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
  console.log('\n🏎  GRIDSTATS — Driver career year sync');
  console.log('─'.repeat(50));

  // driverId → Set of all years they raced
  const driverYears = new Map<string, Set<number>>();

  const years = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i);

  // Fetch in batches of 10 years to avoid hammering the API
  for (let i = 0; i < years.length; i += 10) {
    const batch = years.slice(i, i + 10);
    const results = await Promise.allSettled(
      batch.map(async (year) => {
        const json = await fetchJson(`${JOLPICA_BASE}/${year}/drivers.json?limit=200`);
        const drivers: any[] = json?.MRData?.DriverTable?.Drivers ?? [];
        return { year, drivers };
      }),
    );

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      const { year, drivers } = result.value;
      for (const d of drivers) {
        const id: string = d.driverId;
        if (!driverYears.has(id)) driverYears.set(id, new Set());
        driverYears.get(id)!.add(year);
      }
    }

    const progress = Math.min(i + 10, years.length);
    process.stdout.write(`\r  Fetched years up to ${START_YEAR + progress - 1}...`);
  }

  console.log(`\n  API returned data for ${driverYears.size} drivers`);

  // Update DB drivers
  let updated = 0;
  let skipped = 0;

  for (const [driverId, yearSet] of Array.from(driverYears)) {
    const allYears = Array.from(yearSet).sort((a, b) => a - b);
    const debut = allYears[0];
    const last = allYears[allYears.length - 1];
    // Compute unique decades actually raced in (not filled between debut and last)
    const decadeSet = new Set<number>();
    for (const y of allYears) decadeSet.add(Math.floor(y / 10) * 10);
    const decades = Array.from(decadeSet).sort((a, b) => a - b);

    const result = await prisma.driver.updateMany({
      where: { driverId },
      data: { debutYear: debut, lastRaceYear: last, racingDecades: decades },
    });
    if (result.count > 0) updated++;
    else skipped++;
  }

  console.log(`  ✓ Updated ${updated} drivers`);
  if (skipped > 0) console.log(`  ⚠  ${skipped} IDs from API not found in DB`);

  const stillNull = await prisma.driver.count({ where: { debutYear: null } });
  console.log(`  ℹ  ${stillNull} drivers still have no career year data`);

  await prisma.syncLog.create({
    data: { dataType: 'driver_career_years', status: 'SUCCESS' },
  });

  console.log('\n✅ Done\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
