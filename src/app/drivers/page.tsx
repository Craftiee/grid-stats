/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import DriversClient from './DriversClient';

// ── Prisma singleton ──────────────────────────────────────────────────────────

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var _prismaDrivers: PrismaClient | undefined;
}
const prisma = global._prismaDrivers ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global._prismaDrivers = prisma;

const CURRENT_YEAR = 2026;
const PREV_YEAR = 2025;

// ── Types ─────────────────────────────────────────────────────────────────────

export type CurrentDriver = {
  driverId: string;
  firstName: string;
  lastName: string;
  code: string | null;
  number: number | null;
  nationality: string | null;
  teamId: string;
  teamName: string;
  teamColor: string;
  championships: number;
};

export type PastDriver = {
  driverId: string;
  firstName: string;
  lastName: string;
  code: string | null;
  nationality: string | null;
  birthYear: number | null;
  championships: number;
  racingDecades: number[];
};

export type DriverChampionData = {
  year: number;
  driverId: string;
  firstName: string;
  lastName: string;
  nationality: string | null;
  teamName: string;
  teamColor: string;
  championships: number;
} | null;

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DriversPage() {
  // 1. Current season entries with driver + constructor details
  const seRows = await prisma.seasonEntry.findMany({
    where: { seasonYear: CURRENT_YEAR, active: true },
    include: {
      driver: { include: { nationality: true } },
      constructor: {
        include: { seasonConstructors: { where: { seasonYear: CURRENT_YEAR } } },
      },
    } as any,
  }) as any[];

  // 2. Previous year champion driver
  const season2025 = await prisma.season.findUnique({
    where: { year: PREV_YEAR },
    include: { championDriver: { include: { nationality: true } } },
  }) as any;

  // 3. Champion's 2025 team (for color)
  let champTeamName = '';
  let champTeamColor = '#dc2626';
  if (season2025?.championDriver) {
    const champEntry = await prisma.seasonEntry.findFirst({
      where: { seasonYear: PREV_YEAR, driverId: season2025.championDriver.driverId },
      include: {
        constructor: {
          include: { seasonConstructors: { where: { seasonYear: PREV_YEAR } } },
        },
      } as any,
    }) as any;
    if (champEntry) {
      const sc = champEntry.constructor?.seasonConstructors?.[0];
      champTeamName = (sc?.displayName ?? champEntry.constructor?.name ?? '') as string;
      champTeamColor = (sc?.colorOverride ?? champEntry.constructor?.colorPrimary ?? '#dc2626') as string;
    }
  }

  // 4. Championship counts per driver (from seasons table)
  const champSeasons = await prisma.season.findMany({
    where: { championDriverId: { not: null } },
    select: { championDriverId: true },
  });
  const champWins = new Map<number, number>();
  for (const s of champSeasons) {
    if (s.championDriverId) {
      champWins.set(s.championDriverId, (champWins.get(s.championDriverId) ?? 0) + 1);
    }
  }

  // 5. Past drivers — not in the current season
  const currentDriverIds: string[] = seRows.map((se: any) => se.driverId as string);
  const pastRows = await prisma.driver.findMany({
    where: { driverId: { notIn: currentDriverIds } },
    include: { nationality: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  }) as any[];

  // Transform current drivers (sorted by team name then last name)
  const currentDrivers: CurrentDriver[] = seRows
    .map((se: any) => {
      const d = se.driver;
      const c = se.constructor;
      const sc = c?.seasonConstructors?.[0];
      return {
        driverId: d.driverId as string,
        firstName: d.firstName as string,
        lastName: d.lastName as string,
        code: (d.code ?? null) as string | null,
        number: (d.permanentNumber ?? null) as number | null,
        nationality: (d.nationality?.name ?? null) as string | null,
        teamId: c.constructorId as string,
        teamName: (sc?.displayName ?? c.name) as string,
        teamColor: (sc?.colorOverride ?? c.colorPrimary) as string,
        championships: champWins.get(d.id as number) ?? 0,
      };
    })
    .sort((a: CurrentDriver, b: CurrentDriver) =>
      a.teamName.localeCompare(b.teamName) || a.lastName.localeCompare(b.lastName),
    );

  // Champion data
  let champion: DriverChampionData = null;
  if (season2025?.championDriver) {
    const d = season2025.championDriver;
    const wins = champWins.get(d.id as number) ?? 0;
    champion = {
      year: PREV_YEAR,
      driverId: d.driverId as string,
      firstName: d.firstName as string,
      lastName: d.lastName as string,
      nationality: (d.nationality?.name ?? null) as string | null,
      teamName: champTeamName,
      teamColor: champTeamColor,
      championships: wins,
    };
  }

  // Past drivers
  const pastDrivers: PastDriver[] = pastRows.map((d: any) => ({
    driverId: d.driverId as string,
    firstName: d.firstName as string,
    lastName: d.lastName as string,
    code: (d.code ?? null) as string | null,
    nationality: (d.nationality?.name ?? null) as string | null,
    birthYear: d.dateOfBirth ? (new Date(d.dateOfBirth).getFullYear() as number) : null,
    championships: champWins.get(d.id as number) ?? 0,
    racingDecades: (d.racingDecades as number[]) ?? [],
  }));

  return (
    <DriversClient
      currentDrivers={currentDrivers}
      champion={champion}
      pastDrivers={pastDrivers}
    />
  );
}
