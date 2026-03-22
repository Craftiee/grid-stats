import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { parse as csvParse } from 'csv-parse/sync'
import * as fs from 'fs'
import * as path from 'path'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
type Row = Record<string, string | null | undefined>

const CSV_PATH = path.join(__dirname, '../data/f1stats.csv')
const BATCH = 500

// ─── Section boundaries (1-indexed line numbers, inclusive) ──────────────────
const SECTIONS = {
  circuits:              { start: 1,     end: 79    },
  constructors:          { start: 80,    end: 294   },
  constructor_standings: { start: 295,   end: 1716  },
  drivers:               { start: 1717,  end: 2648  },
  driver_standings:      { start: 2649,  end: 5647  },
  nationalities:         { start: 5648,  end: 5690  },
  qualifying_results:    { start: 5691,  end: 6511  },
  races:                 { start: 6512,  end: 6769  },
  race_results:          { start: 6770,  end: 11567 },
  season_constructors:   { start: 11568, end: 11639 },
  season_entries:        { start: 11640, end: 11794 },
  sprint_results:        { start: 11795, end: 11795 }, // header only, no data
} as const

// ─── Type converters ──────────────────────────────────────────────────────────
const toInt = (v: string | null | undefined): number | null => {
  if (v == null || v === '' || v === 'NULL') return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

const toDec = (v: string | null | undefined): number | null => {
  if (v == null || v === '' || v === 'NULL') return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

const toBool = (v: string | null | undefined): boolean => v === '1'

const toDate = (v: string | null | undefined): Date | null => {
  if (!v || v === 'NULL' || v === '' || v.startsWith('0000')) return null
  const d = new Date(v + 'T00:00:00.000Z')
  return isNaN(d.getTime()) ? null : d
}

const toTime = (v: string | null | undefined): Date | null => {
  if (!v || v === 'NULL' || v === '') return null
  const parts = v.split(':')
  if (parts.length < 2) return null
  const [h, m, s] = parts.map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const d = new Date(0)
  d.setUTCHours(h, m, isNaN(s) ? 0 : Math.floor(s), 0)
  return d
}

// Coerce to string | null with optional max length truncation
const toStr = (v: string | null | undefined, maxLen?: number): string | null => {
  if (v == null || v === '' || v === 'NULL') return null
  const s = v.trim()
  if (s === '') return null
  return maxLen !== undefined ? s.slice(0, maxLen) : s
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readSection(lines: string[], start: number, end: number): Row[] {
  const section = lines.slice(start - 1, end)
  if (section.length <= 1) return []
  return csvParse(section.join('\n'), {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    cast: (value: string) => (value === 'NULL' ? null : value),
  }) as Row[]
}

async function insertMany<T>(
  label: string,
  data: T[],
  fn: (batch: T[]) => Promise<{ count: number }>,
) {
  process.stdout.write(`  ${label}: `)
  let total = 0
  for (let i = 0; i < data.length; i += BATCH) {
    const result = await fn(data.slice(i, i + BATCH))
    total += result.count
    process.stdout.write('.')
  }
  console.log(` ${total} rows`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // ── 0. Clear all tables in reverse dependency order ─────────────────────────
  console.log('Clearing tables...')
  await prisma.$executeRaw`TRUNCATE TABLE "constructor_standings"  RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "driver_standings"       RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "qualifying_results"     RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "sprint_results"         RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "race_results"           RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "driver_career_stats"    RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "season_entries"         RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "season_constructors"    RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "races"                  RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "seasons"                RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "drivers"                RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "constructors"           RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "circuits"               RESTART IDENTITY CASCADE`
  await prisma.$executeRaw`TRUNCATE TABLE "nationalities"          RESTART IDENTITY CASCADE`
  console.log('Done.')

  console.log('\nReading CSV...')
  const lines = fs.readFileSync(CSV_PATH, 'utf-8').split('\n')

  console.log('Parsing sections...')
  const nationalitiesRaw        = readSection(lines, SECTIONS.nationalities.start,         SECTIONS.nationalities.end)
  const circuitsRaw             = readSection(lines, SECTIONS.circuits.start,              SECTIONS.circuits.end)
  const constructorsRaw         = readSection(lines, SECTIONS.constructors.start,          SECTIONS.constructors.end)
  const driversRaw              = readSection(lines, SECTIONS.drivers.start,               SECTIONS.drivers.end)
  const racesRaw                = readSection(lines, SECTIONS.races.start,                 SECTIONS.races.end)
  const raceResultsRaw          = readSection(lines, SECTIONS.race_results.start,          SECTIONS.race_results.end)
  const qualifyingRaw           = readSection(lines, SECTIONS.qualifying_results.start,    SECTIONS.qualifying_results.end)
  const driverStandingsRaw      = readSection(lines, SECTIONS.driver_standings.start,      SECTIONS.driver_standings.end)
  const constructorStandingsRaw = readSection(lines, SECTIONS.constructor_standings.start, SECTIONS.constructor_standings.end)
  const seasonConstructorsRaw   = readSection(lines, SECTIONS.season_constructors.start,   SECTIONS.season_constructors.end)
  const seasonEntriesRaw        = readSection(lines, SECTIONS.season_entries.start,        SECTIONS.season_entries.end)

  // ── 1. Nationalities ────────────────────────────────────────────────────────
  console.log('\n[1/13] Nationalities')
  const natData: { name: string; countryCode: string; demonym: string | null }[] = []
  for (const r of nationalitiesRaw) {
    try {
      const name        = toStr(r.name, 50)
      const countryCode = toStr(r.country_code, 2)
      if (!name || !countryCode) { console.warn(`  WARN nat skipped: name=${r.name}`); continue }
      natData.push({ name, countryCode, demonym: toStr(r.demonym, 50) })
    } catch (e) { console.warn(`  WARN nat row error: ${e}`) }
  }
  await insertMany('nationalities', natData, (batch) =>
    prisma.nationality.createMany({ data: batch, skipDuplicates: true }),
  )
  const dbNats = await prisma.nationality.findMany({ select: { id: true, name: true } })
  const natNameToDbId = new Map(dbNats.map((n) => [n.name, n.id]))
  // CSV id → DB id
  const natCsvIdToDbId = new Map<number, number>()
  for (const r of nationalitiesRaw) {
    const csvId = toInt(r.id)
    const name  = toStr(r.name, 50)
    if (csvId === null || !name) continue
    const dbId = natNameToDbId.get(name)
    if (dbId !== undefined) natCsvIdToDbId.set(csvId, dbId)
  }

  // ── 2. Circuits ─────────────────────────────────────────────────────────────
  console.log('\n[2/13] Circuits')
  const circuitData: object[] = []
  for (const r of circuitsRaw) {
    try {
      const circuitId = toStr(r.circuit_id, 50)
      const name      = toStr(r.name, 100)
      if (!circuitId || !name) { console.warn(`  WARN circuit skipped: id=${r.circuit_id}`); continue }
      circuitData.push({
        circuitId,
        name,
        locality:        toStr(r.locality, 100),
        country:         toStr(r.country, 100),
        latitude:        toDec(r.latitude),
        longitude:       toDec(r.longitude),
        altitude:        toInt(r.elevation_m),
        lengthKm:        toDec(r.length_km),
        turns:           toInt(r.turns),
        lapRecordTime:   toStr(r.lap_record_time, 20),
        lapRecordHolder: toStr(r.lap_record_holder, 100),
        lapRecordYear:   toInt(r.lap_record_year),
        timezoneOffset:  toInt(r.timezone_offset) ?? 0,
        timezoneAbbr:    toStr(r.timezone_abbr, 10),
        mapImageUrl:     toStr(r.map_image_url, 500),
        wikipediaUrl:    toStr(r.wikipedia_url, 500),
      })
    } catch (e) { console.warn(`  WARN circuit row error: ${e}`) }
  }
  await insertMany('circuits', circuitData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.circuit.createMany({ data: batch as any, skipDuplicates: true }),
  )
  const dbCircuits = await prisma.circuit.findMany({ select: { id: true, circuitId: true } })
  const circuitSlugToDbId = new Map(dbCircuits.map((c) => [c.circuitId, c.id]))
  const circuitCsvIdToDbId = new Map<number, number>()
  for (const r of circuitsRaw) {
    const csvId = toInt(r.id)
    const slug  = toStr(r.circuit_id, 50)
    if (csvId === null || !slug) continue
    const dbId = circuitSlugToDbId.get(slug)
    if (dbId !== undefined) circuitCsvIdToDbId.set(csvId, dbId)
  }

  // ── 3. Constructors ─────────────────────────────────────────────────────────
  console.log('\n[3/13] Constructors')
  const constructorData: object[] = []
  for (const r of constructorsRaw) {
    try {
      const constructorId = toStr(r.constructor_id, 50)
      const name          = toStr(r.name, 100)
      if (!constructorId || !name) { console.warn(`  WARN constructor skipped: id=${r.constructor_id}`); continue }
      const natIdRaw = toInt(r.nationality_id)
      const natDbId  = natIdRaw !== null ? (natCsvIdToDbId.get(natIdRaw) ?? null) : null
      constructorData.push({
        constructorId,
        name,
        fullName:       toStr(r.full_name, 200),
        nationalityId:  natDbId,
        colorPrimary:   toStr(r.color_primary, 7) ?? '#FFFFFF',
        colorSecondary: toStr(r.color_secondary, 7),
        logoUrl:        toStr(r.logo_url, 500),
        wikipediaUrl:   toStr(r.wikipedia_url, 500),
        active:         toBool(r.active),
      })
    } catch (e) { console.warn(`  WARN constructor row error: ${e}`) }
  }
  await insertMany('constructors', constructorData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.constructor.createMany({ data: batch as any, skipDuplicates: true }),
  )
  // Note: no `select` — Prisma's Constructor type conflicts with JS built-in Constructor
  const dbConstructors = await prisma.constructor.findMany()
  const constructorMap = new Map(dbConstructors.map((c) => [c.constructorId, c.id]))

  // ── 4. Seasons (derived from races — champions backfilled last) ──────────────
  console.log('\n[4/13] Seasons (derived)')
  const seasonMaxRound = new Map<number, number>()
  for (const r of racesRaw) {
    const year  = toInt(r.season_year)
    const round = toInt(r.round)
    if (year === null || round === null) continue
    if ((seasonMaxRound.get(year) ?? 0) < round) seasonMaxRound.set(year, round)
  }
  const seasons = Array.from(seasonMaxRound.entries())
    .map(([year, totalRounds]) => ({ year, totalRounds }))
    .sort((a, b) => a.year - b.year)
  console.log(`  seasons: ${seasons.length} rows`)
  await prisma.season.createMany({ data: seasons, skipDuplicates: true })

  // ── 5. Drivers ──────────────────────────────────────────────────────────────
  console.log('\n[5/13] Drivers')
  const driverData: object[] = []
  for (const r of driversRaw) {
    try {
      const driverId  = toStr(r.driver_id, 50)
      const firstName = toStr(r.first_name, 50)
      const lastName  = toStr(r.last_name, 50)
      if (!driverId || !firstName || !lastName) {
        console.warn(`  WARN driver skipped: id=${r.driver_id}`)
        continue
      }
      const natIdRaw = toInt(r.nationality_id)
      const natDbId  = natIdRaw !== null ? (natCsvIdToDbId.get(natIdRaw) ?? null) : null
      driverData.push({
        driverId,
        code:            toStr(r.code, 3),
        permanentNumber: toInt(r.permanent_number),
        firstName,
        lastName,
        dateOfBirth:     toDate(r.date_of_birth),
        nationalityId:   natDbId,
        photoUrl:        toStr(r.photo_url, 500),
        wikipediaUrl:    toStr(r.wikipedia_url, 500),
        active:          toBool(r.active),
      })
    } catch (e) { console.warn(`  WARN driver row error: ${e}`) }
  }
  await insertMany('drivers', driverData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.driver.createMany({ data: batch as any, skipDuplicates: true }),
  )
  const dbDrivers = await prisma.driver.findMany({ select: { id: true, driverId: true } })
  const driverMap = new Map(dbDrivers.map((d) => [d.driverId, d.id]))
  console.log(`  Lookup maps: ${driverMap.size} drivers, ${constructorMap.size} constructors`)

  // ── 6. Races ────────────────────────────────────────────────────────────────
  console.log('\n[6/13] Races')
  const raceData: object[] = []
  for (const r of racesRaw) {
    try {
      const seasonYear = toInt(r.season_year)
      const round      = toInt(r.round)
      const name       = toStr(r.name, 100)
      if (seasonYear === null || round === null || !name) {
        console.warn(`  WARN race skipped: year=${r.season_year} round=${r.round}`)
        continue
      }
      const csvCircuitId = toInt(r.circuit_id)
      const circuitDbId  = csvCircuitId !== null ? (circuitCsvIdToDbId.get(csvCircuitId) ?? null) : null
      raceData.push({
        seasonYear,
        round,
        name,
        circuitId:      circuitDbId,
        raceDate:       toDate(r.race_date),
        raceTime:       toTime(r.race_time),
        sprintDate:     toDate(r.sprint_date),
        sprintTime:     toTime(r.sprint_time),
        qualifyingDate: toDate(r.qualifying_date),
        qualifyingTime: toTime(r.qualifying_time),
        fp1Date:        toDate(r.fp1_date),
        fp1Time:        toTime(r.fp1_time),
        fp2Date:        toDate(r.fp2_date),
        fp2Time:        toTime(r.fp2_time),
        fp3Date:        toDate(r.fp3_date),
        fp3Time:        toTime(r.fp3_time),
        completed:      toBool(r.completed),
        wikipediaUrl:   toStr(r.wikipedia_url, 500),
      })
    } catch (e) { console.warn(`  WARN race row error: ${e}`) }
  }
  await insertMany('races', raceData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.race.createMany({ data: batch as any, skipDuplicates: true }),
  )
  const dbRaces = await prisma.race.findMany({ select: { id: true, seasonYear: true, round: true } })
  const raceKeyToDbId = new Map(dbRaces.map((r) => [`${r.seasonYear}-${r.round}`, r.id]))
  const raceCsvIdToDbId = new Map<number, number>()
  for (const r of racesRaw) {
    const csvId = toInt(r.id)
    const year  = toInt(r.season_year)
    const round = toInt(r.round)
    if (csvId === null || year === null || round === null) continue
    const dbId = raceKeyToDbId.get(`${year}-${round}`)
    if (dbId !== undefined) raceCsvIdToDbId.set(csvId, dbId)
  }

  // ── 7. SeasonConstructors ───────────────────────────────────────────────────
  console.log('\n[7/13] SeasonConstructors')
  const scData: object[] = []
  for (const r of seasonConstructorsRaw) {
    try {
      const seasonYear    = toInt(r.season_year)
      const constructorId = toStr(r.constructor_id, 50)
      if (seasonYear === null || !constructorId) { console.warn(`  WARN season_constructor skipped: year=${r.season_year} ctor=${r.constructor_id}`); continue }
      if (!constructorMap.has(constructorId)) { console.warn(`  WARN season_constructor skipped: unknown constructor ${constructorId}`); continue }
      scData.push({
        seasonYear,
        constructorId,
        displayName:   toStr(r.display_name, 200),
        colorOverride: toStr(r.color_override, 7),
        active:        toBool(r.active),
      })
    } catch (e) { console.warn(`  WARN season_constructor row error: ${e}`) }
  }
  await insertMany('season_constructors', scData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.seasonConstructor.createMany({ data: batch as any, skipDuplicates: true }),
  )

  // ── 8. SeasonEntries ────────────────────────────────────────────────────────
  console.log('\n[8/13] SeasonEntries')
  const seData: object[] = []
  for (const r of seasonEntriesRaw) {
    try {
      const seasonYear    = toInt(r.season_year)
      const driverId      = toStr(r.driver_id, 50)
      const constructorId = toStr(r.constructor_id, 50)
      if (seasonYear === null || !driverId || !constructorId) { console.warn(`  WARN season_entry skipped`); continue }
      if (!driverMap.has(driverId))           { console.warn(`  WARN season_entry skipped: unknown driver ${driverId}`); continue }
      if (!constructorMap.has(constructorId)) { console.warn(`  WARN season_entry skipped: unknown constructor ${constructorId}`); continue }
      seData.push({ seasonYear, driverId, constructorId, active: toBool(r.active) })
    } catch (e) { console.warn(`  WARN season_entry row error: ${e}`) }
  }
  await insertMany('season_entries', seData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.seasonEntry.createMany({ data: batch as any, skipDuplicates: true }),
  )

  // ── 9. RaceResults ──────────────────────────────────────────────────────────
  console.log('\n[9/13] RaceResults')
  const rrData: object[] = []
  for (const r of raceResultsRaw) {
    try {
      const csvRaceId       = toInt(r.race_id)
      const driverSlug      = toStr(r.driver_id, 50)
      const constructorSlug = toStr(r.constructor_id, 50)
      if (csvRaceId === null || !driverSlug || !constructorSlug) continue
      const raceDbId        = raceCsvIdToDbId.get(csvRaceId)
      const driverDbId      = driverMap.get(driverSlug)
      const constructorDbId = constructorMap.get(constructorSlug)
      if (raceDbId === undefined || driverDbId === undefined || constructorDbId === undefined) {
        console.warn(`  WARN race_result skipped: race=${r.race_id} driver=${driverSlug} ctor=${constructorSlug}`)
        continue
      }
      rrData.push({
        raceId:         raceDbId,
        driverId:       driverDbId,
        constructorId:  constructorDbId,
        gridPosition:   toInt(r.grid_position),
        position:       toInt(r.finish_position),
        positionText:   toStr(r.position_text, 10),
        points:         toDec(r.points) ?? 0,
        lapsCompleted:  toInt(r.laps) ?? 0,
        status:         toStr(r.status, 100),
        fastestLap:     toBool(r.fastest_lap),
        fastestLapTime: toStr(r.fastest_lap_time, 20),
        fastestLapRank: toInt(r.fastest_lap_rank),
      })
    } catch (e) { console.warn(`  WARN race_result row error: ${e}`) }
  }
  await insertMany('race_results', rrData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.raceResult.createMany({ data: batch as any, skipDuplicates: true }),
  )

  // ── 10. QualifyingResults ───────────────────────────────────────────────────
  console.log('\n[10/13] QualifyingResults')
  const qrData: object[] = []
  for (const r of qualifyingRaw) {
    try {
      const csvRaceId       = toInt(r.race_id)
      const driverSlug      = toStr(r.driver_id, 50)
      const constructorSlug = toStr(r.constructor_id, 50)
      if (csvRaceId === null || !driverSlug || !constructorSlug) continue
      const raceDbId        = raceCsvIdToDbId.get(csvRaceId)
      const driverDbId      = driverMap.get(driverSlug)
      const constructorDbId = constructorMap.get(constructorSlug)
      if (raceDbId === undefined || driverDbId === undefined || constructorDbId === undefined) {
        console.warn(`  WARN qualifying_result skipped: race=${r.race_id} driver=${driverSlug} ctor=${constructorSlug}`)
        continue
      }
      qrData.push({
        raceId:        raceDbId,
        driverId:      driverDbId,
        constructorId: constructorDbId,
        position:      toInt(r.position),
        q1Time:        toStr(r.q1_time, 20),
        q2Time:        toStr(r.q2_time, 20),
        q3Time:        toStr(r.q3_time, 20),
      })
    } catch (e) { console.warn(`  WARN qualifying_result row error: ${e}`) }
  }
  await insertMany('qualifying_results', qrData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.qualifyingResult.createMany({ data: batch as any, skipDuplicates: true }),
  )

  // ── 11. SprintResults (header only, no data) ────────────────────────────────
  console.log('\n[11/13] SprintResults — no data rows, skipping')

  // ── 12a. DriverStandings ─────────────────────────────────────────────────────
  console.log('\n[12a/13] DriverStandings')
  const dsData: object[] = []
  for (const r of driverStandingsRaw) {
    try {
      const seasonYear      = toInt(r.season_year)
      const driverSlug      = toStr(r.driver_id, 50)
      const constructorSlug = toStr(r.constructor_id, 50)
      const position        = toInt(r.position)
      if (seasonYear === null || !driverSlug || !constructorSlug || position === null) continue
      const driverDbId      = driverMap.get(driverSlug)
      const constructorDbId = constructorMap.get(constructorSlug)
      if (driverDbId === undefined || constructorDbId === undefined) {
        console.warn(`  WARN driver_standing skipped: driver=${driverSlug} ctor=${constructorSlug}`)
        continue
      }
      const csvRaceId = r.race_id != null ? toInt(r.race_id) : null
      const raceDbId  = csvRaceId !== null ? (raceCsvIdToDbId.get(csvRaceId) ?? null) : null
      dsData.push({
        seasonYear,
        raceId:        raceDbId,
        driverId:      driverDbId,
        constructorId: constructorDbId,
        position,
        points:        toDec(r.points) ?? 0,
        wins:          toInt(r.wins) ?? 0,
        podiums:       toInt(r.podiums) ?? 0,
        poles:         toInt(r.poles) ?? 0,
        fastestLaps:   toInt(r.fastest_laps) ?? 0,
        dnfs:          toInt(r.dnfs) ?? 0,
        racesEntered:  toInt(r.races_entered) ?? 0,
      })
    } catch (e) { console.warn(`  WARN driver_standing row error: ${e}`) }
  }
  await insertMany('driver_standings', dsData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.driverStanding.createMany({ data: batch as any, skipDuplicates: true }),
  )

  // ── 12b. ConstructorStandings ───────────────────────────────────────────────
  console.log('\n[12b/13] ConstructorStandings')
  const csData: object[] = []
  for (const r of constructorStandingsRaw) {
    try {
      const seasonYear      = toInt(r.season_year)
      const constructorSlug = toStr(r.constructor_id, 50)
      const position        = toInt(r.position)
      if (seasonYear === null || !constructorSlug || position === null) continue
      const constructorDbId = constructorMap.get(constructorSlug)
      if (constructorDbId === undefined) {
        console.warn(`  WARN constructor_standing skipped: ctor=${constructorSlug}`)
        continue
      }
      const csvRaceId = r.race_id != null ? toInt(r.race_id) : null
      const raceDbId  = csvRaceId !== null ? (raceCsvIdToDbId.get(csvRaceId) ?? null) : null
      csData.push({
        seasonYear,
        raceId:        raceDbId,
        constructorId: constructorDbId,
        position,
        points:        toDec(r.points) ?? 0,
        wins:          toInt(r.wins) ?? 0,
        podiums:       toInt(r.podiums) ?? 0,
        poles:         toInt(r.poles) ?? 0,
        fastestLaps:   toInt(r.fastest_laps) ?? 0,
      })
    } catch (e) { console.warn(`  WARN constructor_standing row error: ${e}`) }
  }
  await insertMany('constructor_standings', csData, (batch) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma.constructorStanding.createMany({ data: batch as any, skipDuplicates: true }),
  )

  // ── 13. Backfill season champions ───────────────────────────────────────────
  console.log('\n[13/13] Backfilling season champions...')
  const champDriverMap      = new Map<number, number>() // year → Driver DB id
  const champConstructorMap = new Map<number, number>() // year → Constructor DB id
  for (const r of driverStandingsRaw) {
    if (r.race_id == null && r.position === '1') {
      const year     = toInt(r.season_year)
      const slug     = toStr(r.driver_id, 50)
      const driverId = slug ? driverMap.get(slug) : undefined
      if (year !== null && driverId !== undefined) champDriverMap.set(year, driverId)
    }
  }
  for (const r of constructorStandingsRaw) {
    if (r.race_id == null && r.position === '1') {
      const year            = toInt(r.season_year)
      const slug            = toStr(r.constructor_id, 50)
      const constructorDbId = slug ? constructorMap.get(slug) : undefined
      if (year !== null && constructorDbId !== undefined) champConstructorMap.set(year, constructorDbId)
    }
  }

  let champUpdates = 0
  const champEntries = Array.from(champDriverMap.entries())
  for (let i = 0; i < champEntries.length; i++) {
    const year     = champEntries[i][0]
    const driverId = champEntries[i][1]
    try {
      await prisma.season.update({
        where: { year },
        data: {
          championDriverId:      driverId,
          championConstructorId: champConstructorMap.get(year) ?? null,
        },
      })
      champUpdates++
    } catch (e) { console.warn(`  WARN champion update failed for year=${year}: ${e}`) }
  }
  console.log(`  Updated ${champUpdates} seasons with champions.`)

  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
