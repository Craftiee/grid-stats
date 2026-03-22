/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { rateLimit } from '@/lib/rate-limit';

// ── Prisma singleton (avoid exhausting connection pool in dev) ─
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const adapter = new PrismaPg({
    connectionString,
    max: 10, // connection pool limit
  });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var _prismaApi: PrismaClient | undefined;
}
const prisma = global._prismaApi ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global._prismaApi = prisma;

// ── Decimal helper ────────────────────────────────────────────

/**
 * Prisma 7 + @prisma/adapter-pg returns Decimal fields as plain objects
 * { '$type': 'Decimal', value: '51.00' } rather than decimal.js instances.
 * This helper extracts the numeric string safely in both cases.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmtDecimal(d: any): string {
  if (d && typeof d === 'object' && d['$type'] === 'Decimal') return String(Number(d.value));
  return String(d);
}

// ── Date / time helpers ───────────────────────────────────────

/** Format a DB Date/string to "YYYY-MM-DD" */
function fmtDate(d: unknown): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d.substring(0, 10);
  if (d instanceof Date) return d.toISOString().substring(0, 10);
  return null;
}

/** Format a DB Time/string to "HH:MM:SSZ" */
function fmtTime(t: unknown): string | null {
  if (!t) return null;
  if (typeof t === 'string') {
    const base = t.split('.')[0]; // strip milliseconds
    return base.endsWith('Z') ? base : base + 'Z';
  }
  if (t instanceof Date) {
    const h = t.getUTCHours().toString().padStart(2, '0');
    const m = t.getUTCMinutes().toString().padStart(2, '0');
    const s = t.getUTCSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}Z`;
  }
  return null;
}

/** Get nationality demonym string (e.g. "Dutch", "British") */
function getNationality(n: { demonym?: string | null; name: string } | null): string {
  if (!n) return '';
  return n.demonym ?? n.name;
}

/** COALESCE season_constructors override then fall back to constructor base values */
function coalesceConstructor(
  c: {
    constructorId: string;
    name: string;
    colorPrimary: string;
    nationality?: { demonym?: string | null; name: string } | null;
    seasonConstructors?: { displayName?: string | null; colorOverride?: string | null; seasonYear: number }[];
  },
  year: number,
) {
  const sc = c.seasonConstructors?.find((s) => s.seasonYear === year) ?? c.seasonConstructors?.[0];
  return {
    constructorId: c.constructorId,
    name: sc?.displayName ?? c.name,
    color: sc?.colorOverride ?? c.colorPrimary,
    nationality: getNationality(c.nationality ?? null),
  };
}

// ── Entry point ───────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { params: string[] } },
) {
  // Rate limit: 60 requests per IP per minute
  const forwarded = _request.headers.get('x-forwarded-for');
  const ip = (forwarded ? forwarded.split(',')[0].trim() : null)
    ?? _request.headers.get('x-real-ip')
    ?? 'unknown';
  if (!(await rateLimit(`api:${ip}`, 60, 60 * 1000))) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const segments = params.params;

  if (!segments?.length) {
    return NextResponse.json({ error: 'Invalid route' }, { status: 400 });
  }

  const year = parseInt(segments[0], 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
  }

  const endpoint = segments[1]; // undefined | 'driverStandings' | 'constructorStandings' | 'results'

  try {
    switch (endpoint) {
      case undefined:
        return await handleSchedule(year);
      case 'driverStandings':
        return await handleDriverStandings(year);
      case 'constructorStandings':
        return await handleConstructorStandings(year);
      case 'results':
        return await handleResults(year);
      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (err) {
    console.error(`[API /api/${segments.join('/')}]`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULE  /api/{year}
// ═══════════════════════════════════════════════════════════════

async function handleSchedule(year: number): Promise<NextResponse> {
  const races = await prisma.race.findMany({
    where: { seasonYear: year },
    orderBy: { round: 'asc' },
    include: {
      circuit: true,
    },
  });

  const Races = races.map((r) => {
    const base = {
      season: String(year),
      round: String(r.round),
      raceName: r.name,
      date: fmtDate(r.raceDate) ?? '',
      time: fmtTime(r.raceTime) ?? '00:00:00Z',
      Circuit: r.circuit
        ? {
            circuitId: r.circuit.circuitId,
            circuitName: r.circuit.name,
            timezoneOffset: r.circuit.timezoneOffset,
            timezoneAbbr: r.circuit.timezoneAbbr ?? null,
            mapImageUrl: r.circuit.mapImageUrl ?? null,
            lapRecord:
              r.circuit.lapRecordTime
                ? {
                    time: r.circuit.lapRecordTime,
                    driver: r.circuit.lapRecordHolder ?? null,
                    year: r.circuit.lapRecordYear ?? null,
                  }
                : null,
            Location: {
              locality: r.circuit.locality ?? '',
              country: r.circuit.country ?? '',
            },
          }
        : null,
    } as Record<string, unknown>;

    base.cancelled = r.cancelled ?? false;

    // Include Sprint block if sprint is scheduled
    if (r.sprintDate) {
      base.Sprint = {
        date: fmtDate(r.sprintDate),
        time: fmtTime(r.sprintTime) ?? '00:00:00Z',
      };
    }

    return base;
  });

  return NextResponse.json({
    MRData: {
      RaceTable: {
        season: String(year),
        Races,
      },
    },
  });
}

// ═══════════════════════════════════════════════════════════════
// DRIVER STANDINGS  /api/{year}/driverStandings
// ═══════════════════════════════════════════════════════════════

async function handleDriverStandings(year: number): Promise<NextResponse> {
  // Find the latest race that has driver standings for this season
  const latestRace = await prisma.race.findFirst({
    where: { seasonYear: year, driverStandings: { some: {} } },
    orderBy: { round: 'desc' },
    select: { id: true, round: true },
  });

  let DriverStandings: unknown[];

  if (latestRace) {
    // ── Real standings from DB ──────────────────────────────────
    const rows = await prisma.driverStanding.findMany({
      where: { seasonYear: year, raceId: latestRace.id },
      orderBy: { position: 'asc' },
      include: {
        driver: { include: { nationality: true } },
        constructor: {
          include: { seasonConstructors: { where: { seasonYear: year } } },
        },
      },
    });

    // ── Previous position map for chevron changes ───────────────
    const prevPositionMap = new Map<string, number>();
    if (latestRace.round > 1) {
      // First try: stored standings from the previous race
      const prevRaceWithStandings = await prisma.race.findFirst({
        where: { seasonYear: year, driverStandings: { some: {} }, round: { lt: latestRace.round } },
        orderBy: { round: 'desc' },
        select: { id: true },
      });
      if (prevRaceWithStandings) {
        const prevRows = await prisma.driverStanding.findMany({
          where: { seasonYear: year, raceId: prevRaceWithStandings.id },
          include: { driver: true } as any,
        }) as any[];
        for (const r of prevRows) prevPositionMap.set(r.driver.driverId, r.position);
      } else {
        // Fallback: compute standings from cumulative race_results up to round - 1
        const prevRaceIds = (await prisma.race.findMany({
          where: { seasonYear: year, round: { lt: latestRace.round } },
          select: { id: true },
        })).map((r) => r.id);
        if (prevRaceIds.length > 0) {
          const grouped = await prisma.raceResult.groupBy({
            by: ['driverId'],
            where: { raceId: { in: prevRaceIds } },
            _sum: { points: true },
          });
          grouped.sort((a, b) => parseFloat(String(b._sum.points ?? 0)) - parseFloat(String(a._sum.points ?? 0)));
          const intIdToPos = new Map<number, number>();
          grouped.forEach((r, i) => intIdToPos.set(r.driverId, i + 1));
          for (const row of rows) {
            const pos = intIdToPos.get(row.driverId);
            if (pos != null) prevPositionMap.set(row.driver.driverId, pos);
          }
        }
      }
    }

    DriverStandings = rows.map((row) => {
      const cc = coalesceConstructor(row.constructor, year);
      const prevPos = prevPositionMap.get(row.driver.driverId);
      return {
        position: String(row.position),
        positionChange: prevPos != null ? prevPos - row.position : 0,
        points: fmtDecimal(row.points),
        wins: String(row.wins),
        podiums: String(row.podiums),
        Driver: {
          driverId: row.driver.driverId,
          code: row.driver.code ?? null,
          permanentNumber: row.driver.permanentNumber?.toString() ?? null,
          givenName: row.driver.firstName,
          familyName: row.driver.lastName,
          nationality: getNationality(row.driver.nationality),
        },
        Constructors: [
          {
            constructorId: cc.constructorId,
            name: cc.name,
            color: cc.color,
          },
        ],
      };
    });
  } else {
    // ── Pre-season fallback: season_entries with 0 points ───────
    DriverStandings = await buildPreSeasonDriverStandings(year);
  }

  return NextResponse.json({
    MRData: {
      StandingsTable: {
        season: String(year),
        StandingsLists: [{ DriverStandings }],
      },
    },
  });
}

/** Pre-season: pull from season_entries, ordered by previous year's final position */
async function buildPreSeasonDriverStandings(year: number): Promise<unknown[]> {
  const entries = await prisma.seasonEntry.findMany({
    where: { seasonYear: year, active: true },
    include: {
      driver: { include: { nationality: true } },
      constructor: {
        include: { seasonConstructors: { where: { seasonYear: year } } },
      },
    },
  });

  if (entries.length === 0) return [];

  // Get previous year's final standings for ordering
  const prevLatestRace = await prisma.race.findFirst({
    where: { seasonYear: year - 1, driverStandings: { some: {} } },
    orderBy: { round: 'desc' },
    select: { id: true },
  });

  const prevPositionMap = new Map<string, number>();
  if (prevLatestRace) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevRows = await prisma.driverStanding.findMany({
      where: { seasonYear: year - 1, raceId: prevLatestRace.id },
      include: { driver: true } as any,
    }) as unknown as Array<{ driver: { driverId: string }; position: number }>;
    for (const row of prevRows) {
      prevPositionMap.set(row.driver.driverId, row.position);
    }
  }

  // Sort: drivers with a previous year position first (by that position),
  // then new drivers alphabetically by last name
  entries.sort((a, b) => {
    const posA = prevPositionMap.get(a.driver.driverId) ?? 9999;
    const posB = prevPositionMap.get(b.driver.driverId) ?? 9999;
    if (posA !== posB) return posA - posB;
    return a.driver.lastName.localeCompare(b.driver.lastName);
  });

  return entries.map((entry, idx) => {
    const cc = coalesceConstructor(entry.constructor, year);
    return {
      position: String(idx + 1),
      points: '0',
      wins: '0',
      podiums: '0',
      Driver: {
        driverId: entry.driver.driverId,
        code: entry.driver.code ?? null,
        permanentNumber: entry.driver.permanentNumber?.toString() ?? null,
        givenName: entry.driver.firstName,
        familyName: entry.driver.lastName,
        nationality: getNationality(entry.driver.nationality),
      },
      Constructors: [
        {
          constructorId: cc.constructorId,
          name: cc.name,
          color: cc.color,
        },
      ],
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// CONSTRUCTOR STANDINGS  /api/{year}/constructorStandings
// ═══════════════════════════════════════════════════════════════

async function handleConstructorStandings(year: number): Promise<NextResponse> {
  const latestRace = await prisma.race.findFirst({
    where: { seasonYear: year, constructorStandings: { some: {} } },
    orderBy: { round: 'desc' },
    select: { id: true, round: true },
  });

  let ConstructorStandings: unknown[];

  if (latestRace) {
    // ── Real standings ──────────────────────────────────────────
    const rows = await prisma.constructorStanding.findMany({
      where: { seasonYear: year, raceId: latestRace.id },
      orderBy: { position: 'asc' },
      include: {
        constructor: {
          include: {
            nationality: true,
            seasonConstructors: { where: { seasonYear: year } },
          },
        },
      },
    });

    // ── Previous position map for chevron changes ───────────────
    const prevPositionMap = new Map<string, number>();
    if (latestRace.round > 1) {
      // First try: stored standings from the previous race
      const prevRaceWithStandings = await prisma.race.findFirst({
        where: { seasonYear: year, constructorStandings: { some: {} }, round: { lt: latestRace.round } },
        orderBy: { round: 'desc' },
        select: { id: true },
      });
      if (prevRaceWithStandings) {
        const prevRows = await prisma.constructorStanding.findMany({
          where: { seasonYear: year, raceId: prevRaceWithStandings.id },
          include: { constructor: true },
        });
        for (const r of prevRows) prevPositionMap.set(r.constructor.constructorId, r.position);
      } else {
        // Fallback: compute standings from cumulative race_results up to round - 1
        const prevRaceIds = (await prisma.race.findMany({
          where: { seasonYear: year, round: { lt: latestRace.round } },
          select: { id: true },
        })).map((r) => r.id);
        if (prevRaceIds.length > 0) {
          const grouped = await prisma.raceResult.groupBy({
            by: ['constructorId'],
            where: { raceId: { in: prevRaceIds } },
            _sum: { points: true },
          });
          grouped.sort((a, b) => parseFloat(String(b._sum.points ?? 0)) - parseFloat(String(a._sum.points ?? 0)));
          const intIdToPos = new Map<number, number>();
          grouped.forEach((r, i) => intIdToPos.set(r.constructorId, i + 1));
          for (const row of rows) {
            const pos = intIdToPos.get(row.constructorId);
            if (pos != null) prevPositionMap.set(row.constructor.constructorId, pos);
          }
        }
      }
    }

    ConstructorStandings = rows.map((row) => {
      const cc = coalesceConstructor(row.constructor, year);
      const prevPos = prevPositionMap.get(row.constructor.constructorId);
      return {
        position: String(row.position),
        positionChange: prevPos != null ? prevPos - row.position : 0,
        points: fmtDecimal(row.points),
        wins: String(row.wins),
        Constructor: {
          constructorId: cc.constructorId,
          name: cc.name,
          color: cc.color,
          nationality: cc.nationality,
        },
      };
    });
  } else {
    // ── Pre-season fallback: season_constructors with 0 points ──
    ConstructorStandings = await buildPreSeasonConstructorStandings(year);
  }

  return NextResponse.json({
    MRData: {
      StandingsTable: {
        season: String(year),
        StandingsLists: [{ ConstructorStandings }],
      },
    },
  });
}

/** Pre-season: pull active season_constructors with 0 points */
async function buildPreSeasonConstructorStandings(year: number): Promise<unknown[]> {
  const seasonConstructors = await prisma.seasonConstructor.findMany({
    where: { seasonYear: year, active: true },
    include: {
      constructor: {
        include: {
          nationality: true,
          seasonConstructors: { where: { seasonYear: year } },
        },
      },
    },
  });

  if (seasonConstructors.length === 0) return [];

  // Get previous year's final constructor standings for ordering
  const prevLatestRace = await prisma.race.findFirst({
    where: { seasonYear: year - 1, constructorStandings: { some: {} } },
    orderBy: { round: 'desc' },
    select: { id: true },
  });

  const prevPositionMap = new Map<string, number>();
  if (prevLatestRace) {
    const prevRows = await prisma.constructorStanding.findMany({
      where: { seasonYear: year - 1, raceId: prevLatestRace.id },
      include: { constructor: true },
    });
    for (const row of prevRows) {
      prevPositionMap.set(row.constructor.constructorId, row.position);
    }
  }

  seasonConstructors.sort((a, b) => {
    const posA = prevPositionMap.get(a.constructorId) ?? 9999;
    const posB = prevPositionMap.get(b.constructorId) ?? 9999;
    if (posA !== posB) return posA - posB;
    return (a.displayName ?? a.constructor.name).localeCompare(b.displayName ?? b.constructor.name);
  });

  return seasonConstructors.map((sc, idx) => {
    const cc = coalesceConstructor(sc.constructor, year);
    return {
      position: String(idx + 1),
      points: '0',
      wins: '0',
      Constructor: {
        constructorId: cc.constructorId,
        name: cc.name,
        color: cc.color,
        nationality: cc.nationality,
      },
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// RESULTS  /api/{year}/results
// ═══════════════════════════════════════════════════════════════

async function handleResults(year: number): Promise<NextResponse> {
  const races = await prisma.race.findMany({
    where: {
      seasonYear: year,
      completed: true,
      raceResults: { some: {} },
    },
    orderBy: { round: 'asc' },
    include: {
      circuit: true,
      raceResults: {
        orderBy: { position: 'asc' },
        include: {
          driver: { include: { nationality: true } },
          constructor: {
            include: { seasonConstructors: { where: { seasonYear: year } } },
          },
        },
      },
      sprintResults: {
        take: 1, // just need to know if sprint exists
      },
    },
  });

  const Races = races.map((r) => {
    const Results = r.raceResults.map((res) => {
      const cc = coalesceConstructor(res.constructor, year);

      const result: Record<string, unknown> = {
        position: res.positionText ?? String(res.position ?? 'R'),
        grid: String(res.gridPosition ?? 0),
        laps: String(res.lapsCompleted),
        points: fmtDecimal(res.points),
        status: res.status ?? 'Finished',
        Driver: {
          driverId: res.driver.driverId,
          code: res.driver.code ?? null,
          permanentNumber: res.driver.permanentNumber?.toString() ?? null,
          givenName: res.driver.firstName,
          familyName: res.driver.lastName,
          nationality: getNationality(res.driver.nationality),
        },
        Constructor: {
          constructorId: cc.constructorId,
          name: cc.name,
          color: cc.color,
        },
      };

      // Include FastestLap block if this driver set the fastest lap
      if (res.fastestLap && res.fastestLapTime) {
        result.FastestLap = {
          rank: String(res.fastestLapRank ?? 1),
          Time: { time: res.fastestLapTime },
        };
      }

      return result;
    });

    const raceEntry: Record<string, unknown> = {
      season: String(year),
      round: String(r.round),
      raceName: r.name,
      date: fmtDate(r.raceDate) ?? '',
      time: fmtTime(r.raceTime) ?? '00:00:00Z',
      Circuit: r.circuit
        ? {
            circuitId: r.circuit.circuitId,
            circuitName: r.circuit.name,
            Location: {
              locality: r.circuit.locality ?? '',
              country: r.circuit.country ?? '',
            },
          }
        : null,
      Results,
    };

    // Mark races that had a sprint
    if (r.sprintResults.length > 0) {
      raceEntry.Sprint = true;
    }

    return raceEntry;
  });

  return NextResponse.json({
    MRData: {
      RaceTable: {
        season: String(year),
        Races,
      },
    },
  });
}
