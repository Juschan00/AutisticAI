import "dotenv/config";
import prisma from "./src/lib/prisma.js";

async function main() {
  try {
    const locationCount = await prisma.location.count();
    const locations = await prisma.location.findMany({
      take: 5,
      include: {
        sensoryScores: true
      }
    });
    
    console.log(`Total locations in DB: ${locationCount}`);
    console.log("Sample locations:", JSON.stringify(locations, null, 2));
  } catch (e) {
    console.error("DB check failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
