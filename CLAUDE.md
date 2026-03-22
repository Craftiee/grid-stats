# GRIDSTATS — Project Guide

## Project Overview

GRIDSTATS is a Formula 1 statistics website providing driver standings, constructor standings, race schedules, results, team profiles, and driver profiles across multiple seasons. It features a dark-themed UI with team color accents, accordion-style data cards, race countdown timers, and comprehensive data visualizations.

**Live dev URL:** `http://localhost:3000`
**Database GUI:** `http://localhost:8080` (Adminer) or `npx prisma studio`

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Database:** PostgreSQL 16 (Docker container)
- **ORM:** Prisma 7
- **Styling:** Tailwind CSS (compiled) + custom CSS
- **Font:** Titillium Web (Google Fonts)
- **Auth:** NextAuth.js (credentials provider)
- **Dev Environment:** Docker Compose (PostgreSQL + Adminer)
- **Package Manager:** npm

## Architecture

### Request Flow
1. Browser hits `localhost:3000` → Next.js serves the page
2. Pages use React Server Components for initial data loading via Prisma
3. Client-side interactivity (accordions, countdowns, season selectors) uses React hooks
4. API routes at `/api/*` handle dynamic data requests from client components

### Data Flow
- **All data comes from PostgreSQL** — no external API dependencies
- Prisma Client queries the database directly from Server Components and API routes
- `season_constructors` table provides per-season team name/color overrides
- `season_entries` table links drivers to constructors per season

### Key Architectural Decisions
- No Ergast API dependency — everything is database-driven
- Prisma schema is the single source of truth for database structure
- Static team details (base, principal, chassis, etc.) stored in `constructors` table, not hardcoded
- Circuit timezone data stored in `circuits` table, not in frontend JS

## Project Structure

```
gridstats/
├── prisma/
│   ├── schema.prisma           # Database schema (all models)
│   ├── migrations/             # Auto-generated migration SQL
│   └── seed.ts                 # Data seeding script
├── prisma.config.ts            # Prisma connection config (ROOT level, not in prisma/)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (navbar, fonts, theme)
│   │   ├── page.tsx            # Dashboard (standings, schedule, results)
│   │   ├── drivers/
│   │   │   ├── page.tsx        # All drivers (current grid + past drivers)
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Individual driver profile
│   │   ├── teams/
│   │   │   ├── page.tsx        # All teams (current + former)
│   │   │   └── [id]/
│   │   │       └── page.tsx    # Individual team profile
│   │   ├── admin/
│   │   │   └── page.tsx        # Admin dashboard
│   │   └── api/                # API Route Handlers
│   │       ├── standings/
│   │       │   ├── drivers/route.ts
│   │       │   └── constructors/route.ts
│   │       ├── schedule/route.ts
│   │       ├── results/route.ts
│   │       └── teams/route.ts
│   ├── components/             # Reusable React components
│   │   ├── Navbar.tsx
│   │   ├── DriverCard.tsx
│   │   ├── ConstructorCard.tsx
│   │   ├── RaceSchedule.tsx
│   │   ├── StandingsTable.tsx
│   │   └── SeasonSelector.tsx
│   ├── lib/
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── constants.ts        # Team color fallbacks, timezone data
│   │   └── utils.ts            # Helper functions
│   ├── generated/
│   │   └── prisma/             # Auto-generated Prisma client (gitignored)
│   └── styles/
│       └── globals.css         # Tailwind + custom theme styles
├── data/
│   └── f1stats.csv             # MySQL data export for seeding
├── docker-compose.yml          # PostgreSQL + Adminer containers
├── .env                        # DATABASE_URL and secrets (gitignored)
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `nationalities` | Country info with ISO codes and demonyms |
| `constructors` | Teams with colors, details (base, principal, chassis, etc.) |
| `drivers` | All F1 drivers with personal info |
| `circuits` | Tracks with timezone offsets, lap records, coordinates |

### Season & Junction Tables
| Table | Purpose |
|-------|---------|
| `seasons` | Season metadata, champion references |
| `season_constructors` | Per-season team overrides (display_name, color_override) |
| `season_entries` | Links drivers ↔ constructors per season |

### Race & Results Tables
| Table | Purpose |
|-------|---------|
| `races` | Race schedule with all session dates/times, completed flag |
| `race_results` | Finishing positions, points, status per driver per race |
| `qualifying_results` | Q1/Q2/Q3 times per driver |
| `sprint_results` | Sprint race results |

### Standings & Stats Tables
| Table | Purpose |
|-------|---------|
| `driver_standings` | Championship standings (per-race and season totals) |
| `constructor_standings` | Constructor championship standings |
| `driver_career_stats` | Lifetime aggregated statistics |

### User & Community Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles (USER, MODERATOR, ADMIN) |
| `forum_categories` | Forum sections |
| `forum_threads` | Discussion threads |
| `forum_replies` | Thread replies |

### Metadata
| Table | Purpose |
|-------|---------|
| `sync_log` | Data sync activity tracking |

**Critical:** Always JOIN through `season_constructors` when displaying team info for a specific season. Use `COALESCE(sc.displayName, c.name)` pattern for team names and `COALESCE(sc.colorOverride, c.colorPrimary)` for colors.

## Key Conventions

### Prisma Queries
- Always use the Prisma client singleton from `src/lib/prisma.ts`
- Use `include` for related data, not separate queries
- Season-specific team data requires joining `seasonConstructors`:
  ```typescript
  const standings = await prisma.driverStanding.findMany({
    where: { seasonYear: 2026 },
    include: {
      driver: { include: { nationality: true } },
      constructor: {
        include: {
          seasonConstructors: {
            where: { seasonYear: 2026 }
          }
        }
      }
    },
    orderBy: { position: 'asc' }
  });
  ```

### Frontend
- Tailwind utility classes for layout
- Team colors from DB (`colorPrimary`) for card accents, borders, gradients
- Dark theme is primary: `#050505` background, `#18181b` panels, `#27272a` borders
- Red accent color: `#dc2626` / `#ef4444`
- Titillium Web font everywhere
- Glass-panel pattern: `bg-[#18181b] border border-[#27272a]`
- Stat-card pattern: subtle gradient background with border

### IDs and Slugs
- `driverId` and `constructorId` are string slugs (e.g., `max_verstappen`, `red_bull`)
- These are used for URL routing: `/drivers/max_verstappen`, `/teams/red_bull`
- Internal `id` (auto-increment int) used for foreign key relationships
- Season entries and standings reference string slugs for driver/constructor lookups

### API Routes
- All API routes return JSON
- Use query params for filtering: `?year=2025`, `?active=true`
- Error responses include status code and message
- No Ergast API format wrapping — return clean typed data

## Docker Commands

```bash
# Start database (run from server directly if SSH credential issues)
docker compose up -d

# Stop database
docker compose stop

# View logs
docker compose logs db

# Reset database completely
docker compose down -v
npx prisma migrate dev

# Check running containers
docker ps
```

## Prisma Commands

```bash
# Apply schema changes
npx prisma migrate dev --name description-of-change

# Reset database and re-seed
npx prisma migrate reset

# Open database GUI
npx prisma studio

# Regenerate Prisma client after schema changes
npx prisma generate

# Seed database
npx prisma db seed
```

## Development Workflow

1. **Schema changes** → Edit `prisma/schema.prisma` → Run `npx prisma migrate dev --name change-name`
2. **Data changes** → Edit `prisma/seed.ts` or use Prisma Studio
3. **New page** → Create route in `src/app/` following App Router conventions
4. **New component** → Add to `src/components/` with TypeScript props
5. **New API endpoint** → Add `route.ts` in `src/app/api/`
6. **Start dev server** → `npm run dev` (runs on port 3000)

## Common Gotchas

1. **prisma.config.ts location:** Must be in project ROOT, not inside `prisma/` folder. Prisma 7 reads config from root.
2. **Prisma 7 datasource:** The `url` property goes in `prisma.config.ts`, NOT in `schema.prisma`. The schema only has `provider`.
3. **Prisma 7 adapter pattern:** Import the client from `../src/generated/prisma/client` (not just `../src/generated/prisma`). `PrismaClient` requires a driver adapter: `const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL }); const prisma = new PrismaClient({ adapter })`. Requires `@prisma/adapter-pg` as a dependency.
4. **Windows / PowerShell:** The server runs Windows 10 with PowerShell. Use PowerShell syntax in terminal commands (e.g., `Get-Content` not `cat`, `Get-ChildItem` not `ls`, `Test-Path` not `test -f`).
5. **Node.js 24 / ESM:** Node.js version is 24.14.0. The generated Prisma client uses ESM — use `npx tsx` to run TypeScript files directly. Do not use `node` to run `.ts` files.
6. **Docker over SSH:** Pulling images and `docker compose up` must be run from a local session on the server (not SSH) due to Windows credential store issues. Once containers are running, all other Docker commands work over SSH.
7. **Season constructor overrides:** Never display constructor name/color directly from `constructors` table without checking `season_constructors` for that season's overrides.
8. **UTF-8:** PostgreSQL handles encoding correctly by default. No double-encoding issues like the old MySQL setup.
9. **2026 Season:** Audi replaces Sauber, Cadillac is the new 11th team. Both require entries in `constructors`, `season_constructors`, and `season_entries`.

## Current Data

Seeded from `data/f1stats.csv` covering seasons 2015–2026:

| Table | Rows |
|-------|------|
| `nationalities` | 42 |
| `circuits` | 78 |
| `constructors` | 214 |
| `drivers` | 923 |
| `seasons` | 12 (2015–2026) |
| `races` | 257 |
| `race_results` | 4,744 |
| `qualifying_results` | 820 |
| `driver_standings` | 2,998 |
| `constructor_standings` | 1,421 |
| `season_constructors` | 71 |
| `season_entries` | 154 |

## Style Guidelines

- Use Tailwind utility classes; custom CSS only for F1-specific theming
- Team colors from DB used for card accents, borders, gradients
- Dark mode is the only theme (no light mode toggle currently)
- Keep components modular and typed with TypeScript interfaces
- Server Components by default; add `'use client'` only when needed for interactivity
