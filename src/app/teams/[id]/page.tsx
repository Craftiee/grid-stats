/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// ── Prisma singleton ─────────────────────────────────────────────────────────

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}
// eslint-disable-next-line no-var
declare global { var _prismaTeamDetail: PrismaClient | undefined; }
const prisma = global._prismaTeamDetail ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') global._prismaTeamDetail = prisma;

const CURRENT_YEAR = 2026;

function fmtPts(d: any): number {
  if (d && typeof d === 'object' && d['$type'] === 'Decimal') return Number(d.value);
  return Number(d) || 0;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function TeamPage({ params }: { params: { id: string } }) {
  const constructorId = params.id;

  // 1. Constructor with current-season overrides + nationality
  const constructor = await (prisma.constructor as any).findUnique({
    where: { constructorId },
    include: {
      nationality: true,
      seasonConstructors: { where: { seasonYear: CURRENT_YEAR } },
    },
  }) as any;

  if (!constructor) notFound();

  const sc = constructor.seasonConstructors?.[0];
  const displayName: string = sc?.displayName ?? constructor.name;
  const color: string = sc?.colorOverride ?? constructor.colorPrimary ?? '#dc2626';
  const fullName: string = constructor.fullName ?? displayName;

  // 2. Current drivers
  const driverEntries = await prisma.seasonEntry.findMany({
    where: { seasonYear: CURRENT_YEAR, constructorId, active: true },
    include: { driver: { include: { nationality: true } } },
    orderBy: { driver: { lastName: 'asc' } },
  } as any) as any[];

  // 3. Season history — final standings per season
  const allStandings = await prisma.constructorStanding.findMany({
    where: { constructorId: constructor.id, raceId: { not: null } },
    include: { race: { select: { round: true } } },
    orderBy: { seasonYear: 'desc' },
  } as any) as any[];

  // Keep only the last race entry per season
  const seasonFinalMap = new Map<number, any>();
  for (const s of allStandings) {
    if (!s.race) continue;
    const existing = seasonFinalMap.get(s.seasonYear);
    if (!existing || s.race.round > existing.race.round) {
      seasonFinalMap.set(s.seasonYear, s);
    }
  }
  const seasonHistory = Array.from(seasonFinalMap.values()).sort(
    (a, b) => b.seasonYear - a.seasonYear,
  );

  // 4. Constructor championship count + last title year
  const constructorTitles = await prisma.season.count({
    where: { championConstructorId: constructor.id },
  });
  const lastChampionship = await prisma.season.findFirst({
    where: { championConstructorId: constructor.id },
    orderBy: { year: 'desc' },
    select: { year: true },
  });

  // 5. Best season stats for the header
  const totalWins = seasonHistory.reduce((sum, s) => sum + (s.wins ?? 0), 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#050505' }}>
      <div className="container mx-auto px-4 py-8 max-w-5xl">

        {/* ── HERO ────────────────────────────────────────────────── */}
        <div
          className="rounded-xl overflow-hidden mb-6"
          style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
        >
          {/* Color bar */}
          <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

          {/* Hero body */}
          <div
            className="relative p-8 pb-10 overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${color}22 0%, transparent 60%)` }}
          >
            <div className="relative z-10 flex items-start justify-between gap-4">

            {/* Left content */}
            <div className="flex flex-col gap-2">
              {constructor.nationality?.countryCode && (
                <div className="flex flex-col items-start">
                  <img
                    src={`/img/flags/${constructor.nationality.countryCode.toLowerCase()}.png`}
                    alt={constructor.nationality.name}
                    className="w-16 h-11 object-cover rounded shadow-lg"
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mt-1.5"
                    style={{ color: '#71717a' }}
                  >
                    {constructor.nationality.name}
                  </span>
                </div>
              )}
              <h1
                className="text-5xl font-black uppercase tracking-tight leading-none mt-2"
                style={{ color: '#ffffff' }}
              >
                {displayName.toUpperCase()}
              </h1>
              {fullName !== displayName && (
                <p className="text-base mt-1" style={{ color: '#71717a' }}>
                  {fullName}
                </p>
              )}

              {/* Quick stats row */}
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="block text-2xl font-black" style={{ color: '#e2e8f0' }}>
                    {constructor.firstEntry ?? '—'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#71717a' }}>
                    First Entry
                  </span>
                </div>
                {totalWins > 0 && (
                  <>
                    <div className="w-px" style={{ backgroundColor: '#27272a' }} />
                    <div>
                      <span className="block text-2xl font-black" style={{ color: '#e2e8f0' }}>
                        {totalWins}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#71717a' }}>
                        Race Wins
                      </span>
                    </div>
                  </>
                )}
                {lastChampionship && (
                  <>
                    <div className="w-px" style={{ backgroundColor: '#27272a' }} />
                    <div>
                      <span className="block text-2xl font-black" style={{ color }}>
                        {lastChampionship.year}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#71717a' }}>
                        Last Championship
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Constructor Titles — top-padded to align label with country text */}
            <div className="flex flex-col items-center flex-shrink-0 pt-[50px] select-none pointer-events-none">
              <span
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: '#52525b' }}
              >
                Constructor Titles
              </span>
              <span
                className="text-[100px] font-black leading-none"
                style={{ color, opacity: 0.2 }}
              >
                {constructorTitles}
              </span>
            </div>

            </div>{/* end flex row */}
          </div>

          {/* ── DETAIL CARDS ──────────────────────────────────────── */}
          <div className="px-8 pb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Base', value: constructor.base },
              { label: 'Team Principal', value: constructor.teamPrincipal },
              { label: 'Chassis', value: constructor.chassis },
              { label: 'Power Unit', value: constructor.powerUnit },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-4"
                style={{ backgroundColor: '#111113', border: '1px solid #27272a' }}
              >
                <span
                  className="block text-[10px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: '#52525b' }}
                >
                  {label}
                </span>
                <span className="text-sm font-bold" style={{ color: value ? '#e2e8f0' : '#52525b' }}>
                  {value ?? '—'}
                </span>
              </div>
            ))}
          </div>

          {/* Website link */}
          {constructor.websiteUrl && /^https?:\/\//i.test(constructor.websiteUrl) && (
            <div className="px-8 pb-8 -mt-2">
              <a
                href={constructor.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
                style={{ color }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.opacity = '0.7')}
                onMouseOut={(e) => ((e.target as HTMLElement).style.opacity = '1')}
              >
                Official Website
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* ── CURRENT DRIVERS ────────────────────────────────────── */}
        {driverEntries.length > 0 && (
          <div className="mb-6">
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: '#52525b' }}
            >
              {CURRENT_YEAR} Drivers
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {driverEntries.map((entry: any) => {
                const d = entry.driver;
                return (
                  <Link
                    key={d.driverId}
                    href={`/drivers/${d.driverId}`}
                    className="block no-underline group"
                  >
                    <div
                      className="rounded-lg overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5"
                      style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                    >
                      <div className="flex items-stretch">
                        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex items-center gap-4 px-5 py-4 flex-1">
                          {/* Code / number badge */}
                          <div className="flex-shrink-0 text-center" style={{ width: '44px' }}>
                            {d.code && (
                              <div
                                className="text-xs font-black uppercase tracking-widest"
                                style={{ color }}
                              >
                                {d.code}
                              </div>
                            )}
                            {d.permanentNumber && (
                              <div
                                className="text-lg font-black leading-tight"
                                style={{ color: '#e2e8f0' }}
                              >
                                {d.permanentNumber}
                              </div>
                            )}
                          </div>
                          {/* Name + nationality */}
                          <div className="flex-1 min-w-0">
                            <div
                              className="font-black uppercase tracking-wide text-base leading-tight"
                              style={{ color: '#e2e8f0' }}
                            >
                              {d.firstName} {d.lastName}
                            </div>
                            {d.nationality?.name && (
                              <div className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                                {d.nationality.name}
                              </div>
                            )}
                          </div>
                          {/* Arrow */}
                          <svg
                            className="w-4 h-4 flex-shrink-0 opacity-30 group-hover:opacity-70 transition-opacity"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: '#e2e8f0' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SEASON HISTORY ─────────────────────────────────────── */}
        {seasonHistory.length > 0 && (
          <div>
            {/* Divider */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px" style={{ backgroundColor: '#27272a' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#52525b' }}
              >
                Season History
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: '#27272a' }} />
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
            >
              {/* Table header */}
              <div
                className="grid grid-cols-4 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: '#52525b', borderBottom: '1px solid #27272a' }}
              >
                <span>Season</span>
                <span className="text-center">Position</span>
                <span className="text-center">Points</span>
                <span className="text-center">Wins</span>
              </div>

              {/* Rows */}
              {seasonHistory.map((s: any, i: number) => {
                const pos = s.position;
                let posColor = '#a1a1aa';
                if (pos === 1) posColor = '#facc15';
                else if (pos === 2) posColor = '#d1d5db';
                else if (pos === 3) posColor = '#d97706';

                return (
                  <div
                    key={s.seasonYear}
                    className="grid grid-cols-4 px-5 py-3 items-center transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderBottom: i < seasonHistory.length - 1 ? '1px solid #1f1f23' : 'none',
                    }}
                  >
                    <span className="text-sm font-bold" style={{ color: '#e2e8f0' }}>
                      {s.seasonYear}
                    </span>
                    <span className="text-center">
                      <span
                        className="inline-block text-sm font-black"
                        style={{ color: posColor }}
                      >
                        P{pos}
                      </span>
                      {pos === 1 && s.seasonYear < CURRENT_YEAR && (
                        <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ backgroundColor: '#facc1520', color: '#facc15' }}>
                          Champion
                        </span>
                      )}
                    </span>
                    <span
                      className="text-center text-sm font-mono font-bold"
                      style={{ color: '#e2e8f0' }}
                    >
                      {fmtPts(s.points).toFixed(0)}
                    </span>
                    <span
                      className="text-center text-sm font-bold"
                      style={{ color: s.wins > 0 ? '#e2e8f0' : '#52525b' }}
                    >
                      {s.wins ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-8">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ color: '#52525b' }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Teams
          </Link>
        </div>

      </div>
    </div>
  );
}
