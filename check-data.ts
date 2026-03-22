import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const p = new PrismaClient({ adapter });

async function main() {
  console.log('Nationalities:', await p.nationality.count());
  console.log('Circuits:', await p.circuit.count());
  console.log('Constructors:', await p.constructor.count());
  console.log('Drivers:', await p.driver.count());
  console.log('Seasons:', await p.season.count());
  console.log('Races:', await p.race.count());
  console.log('Race Results:', await p.raceResult.count());
  console.log('Driver Standings:', await p.driverStanding.count());
  console.log('Constructor Standings:', await p.constructorStanding.count());
  console.log('Season Constructors:', await p.seasonConstructor.count());
  console.log('Season Entries:', await p.seasonEntry.count());
  await p.$disconnect();
}

main();