import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import TeamsClient from './TeamsClient';

// ── Prisma singleton ──────────────────────────────────────────────────────────

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var _prismaTeams: PrismaClient | undefined;
}
const prisma = global._prismaTeams ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global._prismaTeams = prisma;

const CURRENT_YEAR = 2026;
const PREV_YEAR = 2025;

// ── Types ─────────────────────────────────────────────────────────────────────

export type CurrentTeam = {
  constructorId: string;
  name: string;
  fullName: string | null;
  color: string;
  base: string | null;
  teamPrincipal: string | null;
  chassis: string | null;
  powerUnit: string | null;
  firstEntry: number | null;
  worldChampionships: number;
  nationality: string | null;
  websiteUrl: string | null;
};

export type PastTeam = {
  constructorId: string;
  name: string;
  color: string;
  nationality: string | null;
  firstEntry: number | null;
  worldChampionships: number;
};

export type ChampionData = {
  year: number;
  constructorId: string;
  name: string;
  color: string;
  base: string | null;
  worldChampionships: number;
} | null;

// ── Page ──────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function TeamsPage() {
  // 1. Current season constructors with their details
  const scRows = await prisma.seasonConstructor.findMany({
    where: { seasonYear: CURRENT_YEAR, active: true },
    include: { constructor: { include: { nationality: true } } } as any,
  }) as any[];

  // 2. Previous year champion
  const season2025 = await prisma.season.findUnique({
    where: { year: PREV_YEAR },
    include: { championConstructor: true } as any,
  }) as any;

  // 3. Past teams — all constructors not in the current season
  const currentIds: string[] = scRows.map((sc: any) => sc.constructorId as string);
  const pastRows = await prisma.constructor.findMany({
    where: { constructorId: { notIn: currentIds } },
    include: { nationality: true } as any,
    orderBy: { name: 'asc' },
  }) as any[];

  // Transform current teams
  const currentTeams: CurrentTeam[] = scRows
    .map((sc: any) => {
      const c = sc.constructor;
      return {
        constructorId: c.constructorId as string,
        name: (sc.displayName ?? c.name) as string,
        fullName: (c.fullName ?? null) as string | null,
        color: (sc.colorOverride ?? c.colorPrimary) as string,
        base: (c.base ?? null) as string | null,
        teamPrincipal: (c.teamPrincipal ?? null) as string | null,
        chassis: (c.chassis ?? null) as string | null,
        powerUnit: (c.powerUnit ?? null) as string | null,
        firstEntry: (c.firstEntry ?? null) as number | null,
        worldChampionships: (c.worldChampionships ?? 0) as number,
        nationality: (c.nationality?.name ?? null) as string | null,
        websiteUrl: (c.websiteUrl ?? null) as string | null,
      };
    })
    .sort((a: CurrentTeam, b: CurrentTeam) => b.worldChampionships - a.worldChampionships);

  // Champion data
  let champion: ChampionData = null;
  if (season2025?.championConstructor) {
    const cc = season2025.championConstructor;
    const scChamp = scRows.find((sc: any) => sc.constructorId === cc.constructorId);
    champion = {
      year: PREV_YEAR,
      constructorId: cc.constructorId as string,
      name: (scChamp?.displayName ?? cc.name) as string,
      color: (scChamp?.colorOverride ?? cc.colorPrimary) as string,
      base: (cc.base ?? null) as string | null,
      worldChampionships: (cc.worldChampionships ?? 0) as number,
    };
  }

  // Past teams
  const pastTeams: PastTeam[] = pastRows.map((c: any) => ({
    constructorId: c.constructorId as string,
    name: c.name as string,
    color: (c.colorPrimary ?? '#ffffff') as string,
    nationality: (c.nationality?.name ?? null) as string | null,
    firstEntry: (c.firstEntry ?? null) as number | null,
    worldChampionships: (c.worldChampionships ?? 0) as number,
  }));

  return (
    <TeamsClient
      currentTeams={currentTeams}
      champion={champion}
      pastTeams={pastTeams}
    />
  );
}
