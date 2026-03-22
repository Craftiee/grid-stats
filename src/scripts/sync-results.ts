/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GRIDSTATS — Race Results Sync
 * Fetches results, standings, and qualifying from the Jolpica/Ergast API
 * and upserts them into the PostgreSQL database.
 *
 * Usage:
 *   npm run sync           # syncs current year
 *   npm run sync -- 2025   # syncs a specific year
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// ── Prisma setup ──────────────────────────────────────────────────────────────

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ── Config ────────────────────────────────────────────────────────────────────

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const year = parseInt(process.argv[2] || String(new Date().getFullYear()), 10);

/**
 * Some teams changed their Ergast/Jolpica constructorId between seasons.
 * Map the API ID → our DB constructorId when they differ.
 */
const CONSTRUCTOR_ALIASES: Record<string, string> = {
  sauber: 'audi', // 2026: Kick Sauber rebranded as Audi
};

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json();
}

// ── Lookup maps ───────────────────────────────────────────────────────────────

type IdMap = Map<string, number>;

async function buildLookups(year: number): Promise<{
  driverMap: IdMap;
  constructorMap: IdMap;
  raceMap: Map<number, number>;
}> {
  const [drivers, constructors, races] = await Promise.all([
    prisma.driver.findMany({ select: { id: true, driverId: true } }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.constructor.findMany({ select: { id: true, constructorId: true } as any }) as unknown as Array<{ id: number; constructorId: string }>,
    prisma.race.findMany({ where: { seasonYear: year }, select: { id: true, round: true } }),
  ]);

  const driverMap: IdMap = new Map(drivers.map((d) => [d.driverId, d.id]));
  const constructorMap: IdMap = new Map(constructors.map((c) => [c.constructorId, c.id]));
  const raceMap = new Map(races.map((r) => [r.round, r.id]));

  console.log(
    `  Loaded ${driverMap.size} drivers, ${constructorMap.size} constructors, ${raceMap.size} races for ${year}`,
  );
  return { driverMap, constructorMap, raceMap };
}

/** Resolve constructorId through aliases, return the DB int PK or undefined */
function resolveConstructor(apiId: string, constructorMap: IdMap): number | undefined {
  const resolved = CONSTRUCTOR_ALIASES[apiId] ?? apiId;
  return constructorMap.get(resolved);
}

// ── Race results ──────────────────────────────────────────────────────────────

async function syncRaceResults(
  year: number,
  driverMap: IdMap,
  constructorMap: IdMap,
  raceMap: Map<number, number>,
): Promise<void> {
  const json = await fetchJson(`${JOLPICA_BASE}/${year}/results.json?limit=1000`);
  const apiRaces: any[] = json?.MRData?.RaceTable?.Races ?? [];

  let upserted = 0;
  const missing = new Set<string>();

  for (const apiRace of apiRaces) {
    const round = parseInt(apiRace.round, 10);
    const raceId = raceMap.get(round);

    if (!raceId) {
      console.log(`  ⚠  Round ${round} (${apiRace.raceName}) not found in DB — skipping`);
      continue;
    }

    let raceUpserted = 0;
    for (const r of apiRace.Results ?? []) {
      const driverId = driverMap.get(r.Driver.driverId);
      const constructorId = resolveConstructor(r.Constructor.constructorId, constructorMap);

      if (!driverId) { missing.add(`driver:${r.Driver.driverId}`); continue; }
      if (!constructorId) { missing.add(`constructor:${r.Constructor.constructorId}`); continue; }

      const hasFastestLap = r.FastestLap?.rank === '1';
      const pos = parseInt(r.position, 10);

      await prisma.raceResult.upsert({
        where: { raceId_driverId: { raceId, driverId } },
        create: {
          raceId,
          driverId,
          constructorId,
          gridPosition: parseInt(r.grid, 10) || null,
          position: isNaN(pos) ? null : pos,
          positionText: r.positionText ?? null,
          points: parseFloat(r.points) || 0,
          lapsCompleted: parseInt(r.laps, 10) || 0,
          status: r.status ?? null,
          fastestLap: hasFastestLap,
          fastestLapTime: r.FastestLap?.Time?.time ?? null,
          fastestLapRank: parseInt(r.FastestLap?.rank, 10) || null,
        },
        update: {
          constructorId,
          gridPosition: parseInt(r.grid, 10) || null,
          position: isNaN(pos) ? null : pos,
          positionText: r.positionText ?? null,
          points: parseFloat(r.points) || 0,
          lapsCompleted: parseInt(r.laps, 10) || 0,
          status: r.status ?? null,
          fastestLap: hasFastestLap,
          fastestLapTime: r.FastestLap?.Time?.time ?? null,
          fastestLapRank: parseInt(r.FastestLap?.rank, 10) || null,
        },
      });
      raceUpserted++;
    }

    // Mark race completed
    await prisma.race.update({ where: { id: raceId }, data: { completed: true } });

    console.log(`  ✓  Round ${String(round).padStart(2)} — ${apiRace.raceName} (${raceUpserted} results)`);
    upserted += raceUpserted;
  }

  if (missing.size) console.log(`  ⚠  Missing: ${Array.from(missing).join(', ')}`);
  console.log(`  → ${upserted} race results upserted across ${apiRaces.length} races`);
}

// ── Driver standings ──────────────────────────────────────────────────────────

async function syncDriverStandings(
  year: number,
  driverMap: IdMap,
  constructorMap: IdMap,
  raceMap: Map<number, number>,
): Promise<void> {
  const json = await fetchJson(`${JOLPICA_BASE}/${year}/driverStandings.json`);
  const lists: any[] = json?.MRData?.StandingsTable?.StandingsLists ?? [];

  if (lists.length === 0) {
    console.log('  No driver standings available');
    return;
  }

  const list = lists[0];
  const round = parseInt(list.round, 10);
  const raceId = raceMap.get(round);

  if (!raceId) {
    console.log(`  ⚠  Round ${round} not found in DB — cannot link standings`);
    return;
  }

  // Build podium counts from synced race results (API doesn't provide this)
  const raceIds = Array.from(raceMap.values());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const podiumRows = await prisma.raceResult.findMany({
    where: { raceId: { in: raceIds }, position: { lte: 3 } },
    select: { driverId: true } as any,
  }) as unknown as Array<{ driverId: number }>;
  const podiumMap = new Map<number, number>();
  for (const r of podiumRows) {
    podiumMap.set(r.driverId, (podiumMap.get(r.driverId) ?? 0) + 1);
  }

  let upserted = 0;
  const missing = new Set<string>();

  for (const s of list.DriverStandings ?? []) {
    const driverId = driverMap.get(s.Driver.driverId);
    const constructorId = resolveConstructor(s.Constructors?.[0]?.constructorId, constructorMap);

    if (!driverId) { missing.add(`driver:${s.Driver.driverId}`); continue; }
    if (!constructorId) { missing.add(`constructor:${s.Constructors?.[0]?.constructorId}`); continue; }

    const podiums = podiumMap.get(driverId) ?? 0;

    await prisma.driverStanding.upsert({
      where: { seasonYear_raceId_driverId: { seasonYear: year, raceId, driverId } },
      create: {
        seasonYear: year,
        raceId,
        driverId,
        constructorId,
        position: parseInt(s.position, 10),
        points: parseFloat(s.points) || 0,
        wins: parseInt(s.wins, 10) || 0,
        podiums,
      },
      update: {
        constructorId,
        position: parseInt(s.position, 10),
        points: parseFloat(s.points) || 0,
        wins: parseInt(s.wins, 10) || 0,
        podiums,
      },
    });
    upserted++;
  }

  if (missing.size) console.log(`  ⚠  Missing: ${Array.from(missing).join(', ')}`);
  console.log(`  → ${upserted} driver standings upserted (after round ${round})`);
}

// ── Constructor standings ─────────────────────────────────────────────────────

async function syncConstructorStandings(
  year: number,
  constructorMap: IdMap,
  raceMap: Map<number, number>,
): Promise<void> {
  const json = await fetchJson(`${JOLPICA_BASE}/${year}/constructorStandings.json`);
  const lists: any[] = json?.MRData?.StandingsTable?.StandingsLists ?? [];

  if (lists.length === 0) {
    console.log('  No constructor standings available');
    return;
  }

  const list = lists[0];
  const round = parseInt(list.round, 10);
  const raceId = raceMap.get(round);

  if (!raceId) {
    console.log(`  ⚠  Round ${round} not found in DB — cannot link standings`);
    return;
  }

  let upserted = 0;
  const missing = new Set<string>();

  for (const s of list.ConstructorStandings ?? []) {
    const constructorId = resolveConstructor(s.Constructor.constructorId, constructorMap);

    if (!constructorId) { missing.add(`constructor:${s.Constructor.constructorId}`); continue; }

    await prisma.constructorStanding.upsert({
      where: { seasonYear_raceId_constructorId: { seasonYear: year, raceId, constructorId } },
      create: {
        seasonYear: year,
        raceId,
        constructorId,
        position: parseInt(s.position, 10),
        points: parseFloat(s.points) || 0,
        wins: parseInt(s.wins, 10) || 0,
      },
      update: {
        position: parseInt(s.position, 10),
        points: parseFloat(s.points) || 0,
        wins: parseInt(s.wins, 10) || 0,
      },
    });
    upserted++;
  }

  if (missing.size) console.log(`  ⚠  Missing: ${Array.from(missing).join(', ')}`);
  console.log(`  → ${upserted} constructor standings upserted (after round ${round})`);
}

// ── Qualifying ────────────────────────────────────────────────────────────────

async function syncQualifying(
  year: number,
  driverMap: IdMap,
  constructorMap: IdMap,
  raceMap: Map<number, number>,
): Promise<void> {
  const json = await fetchJson(`${JOLPICA_BASE}/${year}/qualifying.json?limit=1000`);
  const apiRaces: any[] = json?.MRData?.RaceTable?.Races ?? [];

  let upserted = 0;
  const missing = new Set<string>();

  for (const apiRace of apiRaces) {
    const round = parseInt(apiRace.round, 10);
    const raceId = raceMap.get(round);

    if (!raceId) {
      console.log(`  ⚠  Round ${round} (${apiRace.raceName}) not found in DB — skipping`);
      continue;
    }

    let raceUpserted = 0;
    for (const r of apiRace.QualifyingResults ?? []) {
      const driverId = driverMap.get(r.Driver.driverId);
      const constructorId = resolveConstructor(r.Constructor.constructorId, constructorMap);

      if (!driverId) { missing.add(`driver:${r.Driver.driverId}`); continue; }
      if (!constructorId) { missing.add(`constructor:${r.Constructor.constructorId}`); continue; }

      await prisma.qualifyingResult.upsert({
        where: { raceId_driverId: { raceId, driverId } },
        create: {
          raceId,
          driverId,
          constructorId,
          position: parseInt(r.position, 10) || null,
          q1Time: r.Q1 ?? null,
          q2Time: r.Q2 ?? null,
          q3Time: r.Q3 ?? null,
        },
        update: {
          constructorId,
          position: parseInt(r.position, 10) || null,
          q1Time: r.Q1 ?? null,
          q2Time: r.Q2 ?? null,
          q3Time: r.Q3 ?? null,
        },
      });
      raceUpserted++;
    }

    console.log(`  ✓  Round ${String(round).padStart(2)} — ${apiRace.raceName} (${raceUpserted} results)`);
    upserted += raceUpserted;
  }

  if (missing.size) console.log(`  ⚠  Missing: ${Array.from(missing).join(', ')}`);
  console.log(`  → ${upserted} qualifying results upserted across ${apiRaces.length} rounds`);
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏎  GRIDSTATS sync — season ${year}`);
  console.log('─'.repeat(50));

  const { driverMap, constructorMap, raceMap } = await buildLookups(year);

  console.log('\n📊 Race results');
  await syncRaceResults(year, driverMap, constructorMap, raceMap);

  console.log('\n🏆 Driver standings');
  await syncDriverStandings(year, driverMap, constructorMap, raceMap);

  console.log('\n🏗  Constructor standings');
  await syncConstructorStandings(year, constructorMap, raceMap);

  console.log('\n⏱  Qualifying');
  await syncQualifying(year, driverMap, constructorMap, raceMap);

  await prisma.syncLog.create({
    data: { dataType: 'full_sync', seasonYear: year, status: 'SUCCESS' },
  });

  console.log('\n✅ Sync complete\n');
}

main()
  .catch((err) => {
    console.error('\n❌ Sync failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
