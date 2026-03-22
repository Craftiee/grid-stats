-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED');

-- CreateTable
CREATE TABLE "nationalities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "demonym" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constructors" (
    "id" SERIAL NOT NULL,
    "constructorId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "fullName" VARCHAR(200),
    "nationalityId" INTEGER,
    "colorPrimary" VARCHAR(7) NOT NULL DEFAULT '#FFFFFF',
    "colorSecondary" VARCHAR(7),
    "logoUrl" VARCHAR(500),
    "wikipediaUrl" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "base" VARCHAR(200),
    "teamPrincipal" VARCHAR(100),
    "chassis" VARCHAR(50),
    "powerUnit" VARCHAR(100),
    "firstEntry" INTEGER,
    "worldChampionships" INTEGER NOT NULL DEFAULT 0,
    "websiteUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" SERIAL NOT NULL,
    "driverId" VARCHAR(50) NOT NULL,
    "code" CHAR(3),
    "permanentNumber" INTEGER,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "dateOfBirth" DATE,
    "nationalityId" INTEGER,
    "photoUrl" VARCHAR(500),
    "wikipediaUrl" VARCHAR(500),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circuits" (
    "id" SERIAL NOT NULL,
    "circuitId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "locality" VARCHAR(100),
    "country" VARCHAR(100),
    "latitude" DECIMAL(10,6),
    "longitude" DECIMAL(10,6),
    "altitude" INTEGER,
    "lengthKm" DECIMAL(5,3),
    "turns" INTEGER,
    "lapRecordTime" VARCHAR(20),
    "lapRecordHolder" VARCHAR(100),
    "lapRecordYear" INTEGER,
    "timezoneOffset" INTEGER NOT NULL DEFAULT 0,
    "timezoneAbbr" VARCHAR(10),
    "mapImageUrl" VARCHAR(500),
    "wikipediaUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "circuits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "year" INTEGER NOT NULL,
    "totalRounds" INTEGER,
    "championDriverId" INTEGER,
    "championConstructorId" INTEGER,
    "wikipediaUrl" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "season_constructors" (
    "id" SERIAL NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "constructorId" VARCHAR(50) NOT NULL,
    "displayName" VARCHAR(200),
    "colorOverride" VARCHAR(7),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_constructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_entries" (
    "id" SERIAL NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "driverId" VARCHAR(50) NOT NULL,
    "constructorId" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" SERIAL NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "circuitId" INTEGER,
    "raceDate" DATE,
    "raceTime" TIME,
    "sprintDate" DATE,
    "sprintTime" TIME,
    "qualifyingDate" DATE,
    "qualifyingTime" TIME,
    "fp1Date" DATE,
    "fp1Time" TIME,
    "fp2Date" DATE,
    "fp2Time" TIME,
    "fp3Date" DATE,
    "fp3Time" TIME,
    "wikipediaUrl" VARCHAR(500),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "race_results" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "constructorId" INTEGER NOT NULL,
    "gridPosition" INTEGER,
    "position" INTEGER,
    "positionText" VARCHAR(10),
    "points" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lapsCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(100),
    "fastestLap" BOOLEAN NOT NULL DEFAULT false,
    "fastestLapTime" VARCHAR(20),
    "fastestLapRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "race_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualifying_results" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "constructorId" INTEGER NOT NULL,
    "position" INTEGER,
    "q1Time" VARCHAR(20),
    "q2Time" VARCHAR(20),
    "q3Time" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qualifying_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_results" (
    "id" SERIAL NOT NULL,
    "raceId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "constructorId" INTEGER NOT NULL,
    "gridPosition" INTEGER,
    "position" INTEGER,
    "positionText" VARCHAR(10),
    "points" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "lapsCompleted" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprint_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_standings" (
    "id" SERIAL NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "raceId" INTEGER,
    "driverId" INTEGER NOT NULL,
    "constructorId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "podiums" INTEGER NOT NULL DEFAULT 0,
    "poles" INTEGER NOT NULL DEFAULT 0,
    "fastestLaps" INTEGER NOT NULL DEFAULT 0,
    "dnfs" INTEGER NOT NULL DEFAULT 0,
    "racesEntered" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constructor_standings" (
    "id" SERIAL NOT NULL,
    "seasonYear" INTEGER NOT NULL,
    "raceId" INTEGER,
    "constructorId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "podiums" INTEGER NOT NULL DEFAULT 0,
    "poles" INTEGER NOT NULL DEFAULT 0,
    "fastestLaps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constructor_standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_career_stats" (
    "driverId" INTEGER NOT NULL,
    "seasonsActive" INTEGER NOT NULL DEFAULT 0,
    "racesEntered" INTEGER NOT NULL DEFAULT 0,
    "raceStarts" INTEGER NOT NULL DEFAULT 0,
    "championships" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "podiums" INTEGER NOT NULL DEFAULT 0,
    "poles" INTEGER NOT NULL DEFAULT 0,
    "fastestLaps" INTEGER NOT NULL DEFAULT 0,
    "pointsTotal" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "firstRaceId" INTEGER,
    "lastRaceId" INTEGER,
    "firstWinRaceId" INTEGER,
    "dnfs" INTEGER NOT NULL DEFAULT 0,
    "bestFinish" INTEGER,
    "bestGrid" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_career_stats_pkey" PRIMARY KEY ("driverId")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(100),
    "avatarUrl" VARCHAR(500),
    "favoriteDriverId" INTEGER,
    "favoriteConstructorId" INTEGER,
    "nationalityId" INTEGER,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forum_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_threads" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "repliesCount" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "lastReplyAt" TIMESTAMP(3),
    "lastReplyUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forum_replies" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" SERIAL NOT NULL,
    "dataType" VARCHAR(50) NOT NULL,
    "seasonYear" INTEGER,
    "lastSynced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "status" "SyncStatus" NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "nationalities_name_key" ON "nationalities"("name");

-- CreateIndex
CREATE INDEX "nationalities_countryCode_idx" ON "nationalities"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "constructors_constructorId_key" ON "constructors"("constructorId");

-- CreateIndex
CREATE INDEX "constructors_constructorId_idx" ON "constructors"("constructorId");

-- CreateIndex
CREATE INDEX "constructors_active_idx" ON "constructors"("active");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_driverId_key" ON "drivers"("driverId");

-- CreateIndex
CREATE INDEX "drivers_driverId_idx" ON "drivers"("driverId");

-- CreateIndex
CREATE INDEX "drivers_code_idx" ON "drivers"("code");

-- CreateIndex
CREATE INDEX "drivers_active_idx" ON "drivers"("active");

-- CreateIndex
CREATE INDEX "drivers_lastName_idx" ON "drivers"("lastName");

-- CreateIndex
CREATE UNIQUE INDEX "circuits_circuitId_key" ON "circuits"("circuitId");

-- CreateIndex
CREATE INDEX "circuits_circuitId_idx" ON "circuits"("circuitId");

-- CreateIndex
CREATE INDEX "circuits_country_idx" ON "circuits"("country");

-- CreateIndex
CREATE INDEX "season_constructors_seasonYear_idx" ON "season_constructors"("seasonYear");

-- CreateIndex
CREATE UNIQUE INDEX "season_constructors_seasonYear_constructorId_key" ON "season_constructors"("seasonYear", "constructorId");

-- CreateIndex
CREATE INDEX "season_entries_seasonYear_idx" ON "season_entries"("seasonYear");

-- CreateIndex
CREATE INDEX "season_entries_driverId_idx" ON "season_entries"("driverId");

-- CreateIndex
CREATE INDEX "season_entries_constructorId_idx" ON "season_entries"("constructorId");

-- CreateIndex
CREATE UNIQUE INDEX "season_entries_seasonYear_driverId_key" ON "season_entries"("seasonYear", "driverId");

-- CreateIndex
CREATE INDEX "races_raceDate_idx" ON "races"("raceDate");

-- CreateIndex
CREATE INDEX "races_completed_idx" ON "races"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "races_seasonYear_round_key" ON "races"("seasonYear", "round");

-- CreateIndex
CREATE INDEX "race_results_position_idx" ON "race_results"("position");

-- CreateIndex
CREATE INDEX "race_results_points_idx" ON "race_results"("points");

-- CreateIndex
CREATE UNIQUE INDEX "race_results_raceId_driverId_key" ON "race_results"("raceId", "driverId");

-- CreateIndex
CREATE INDEX "qualifying_results_position_idx" ON "qualifying_results"("position");

-- CreateIndex
CREATE UNIQUE INDEX "qualifying_results_raceId_driverId_key" ON "qualifying_results"("raceId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_results_raceId_driverId_key" ON "sprint_results"("raceId", "driverId");

-- CreateIndex
CREATE INDEX "driver_standings_seasonYear_position_idx" ON "driver_standings"("seasonYear", "position");

-- CreateIndex
CREATE INDEX "driver_standings_points_idx" ON "driver_standings"("points" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "driver_standings_seasonYear_raceId_driverId_key" ON "driver_standings"("seasonYear", "raceId", "driverId");

-- CreateIndex
CREATE INDEX "constructor_standings_seasonYear_position_idx" ON "constructor_standings"("seasonYear", "position");

-- CreateIndex
CREATE UNIQUE INDEX "constructor_standings_seasonYear_raceId_constructorId_key" ON "constructor_standings"("seasonYear", "raceId", "constructorId");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "forum_categories_slug_key" ON "forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_categories_slug_idx" ON "forum_categories"("slug");

-- CreateIndex
CREATE INDEX "forum_categories_displayOrder_idx" ON "forum_categories"("displayOrder");

-- CreateIndex
CREATE INDEX "forum_threads_categoryId_idx" ON "forum_threads"("categoryId");

-- CreateIndex
CREATE INDEX "forum_threads_pinned_idx" ON "forum_threads"("pinned");

-- CreateIndex
CREATE INDEX "forum_threads_lastReplyAt_idx" ON "forum_threads"("lastReplyAt");

-- CreateIndex
CREATE INDEX "forum_replies_threadId_idx" ON "forum_replies"("threadId");

-- CreateIndex
CREATE INDEX "forum_replies_createdAt_idx" ON "forum_replies"("createdAt");

-- CreateIndex
CREATE INDEX "sync_log_dataType_idx" ON "sync_log"("dataType");

-- CreateIndex
CREATE INDEX "sync_log_seasonYear_idx" ON "sync_log"("seasonYear");

-- CreateIndex
CREATE INDEX "sync_log_lastSynced_idx" ON "sync_log"("lastSynced");

-- AddForeignKey
ALTER TABLE "constructors" ADD CONSTRAINT "constructors_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_championDriverId_fkey" FOREIGN KEY ("championDriverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_championConstructorId_fkey" FOREIGN KEY ("championConstructorId") REFERENCES "constructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_constructors" ADD CONSTRAINT "season_constructors_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_constructors" ADD CONSTRAINT "season_constructors_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "constructors"("constructorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_entries" ADD CONSTRAINT "season_entries_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_entries" ADD CONSTRAINT "season_entries_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("driverId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_entries" ADD CONSTRAINT "season_entries_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "constructors"("constructorId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "circuits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "race_results" ADD CONSTRAINT "race_results_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "constructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifying_results" ADD CONSTRAINT "qualifying_results_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifying_results" ADD CONSTRAINT "qualifying_results_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualifying_results" ADD CONSTRAINT "qualifying_results_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "constructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_results" ADD CONSTRAINT "sprint_results_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_results" ADD CONSTRAINT "sprint_results_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sprint_results" ADD CONSTRAINT "sprint_results_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "constructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_standings" ADD CONSTRAINT "driver_standings_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_standings" ADD CONSTRAINT "driver_standings_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_standings" ADD CONSTRAINT "driver_standings_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_standings" ADD CONSTRAINT "driver_standings_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "constructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constructor_standings" ADD CONSTRAINT "constructor_standings_seasonYear_fkey" FOREIGN KEY ("seasonYear") REFERENCES "seasons"("year") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constructor_standings" ADD CONSTRAINT "constructor_standings_raceId_fkey" FOREIGN KEY ("raceId") REFERENCES "races"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "constructor_standings" ADD CONSTRAINT "constructor_standings_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "constructors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_career_stats" ADD CONSTRAINT "driver_career_stats_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_career_stats" ADD CONSTRAINT "driver_career_stats_firstRaceId_fkey" FOREIGN KEY ("firstRaceId") REFERENCES "races"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_career_stats" ADD CONSTRAINT "driver_career_stats_lastRaceId_fkey" FOREIGN KEY ("lastRaceId") REFERENCES "races"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_career_stats" ADD CONSTRAINT "driver_career_stats_firstWinRaceId_fkey" FOREIGN KEY ("firstWinRaceId") REFERENCES "races"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_favoriteDriverId_fkey" FOREIGN KEY ("favoriteDriverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_favoriteConstructorId_fkey" FOREIGN KEY ("favoriteConstructorId") REFERENCES "constructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_nationalityId_fkey" FOREIGN KEY ("nationalityId") REFERENCES "nationalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "forum_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_lastReplyUserId_fkey" FOREIGN KEY ("lastReplyUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forum_replies" ADD CONSTRAINT "forum_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
