import prisma from './src/lib/prisma.js';

async function main() {
    console.log("Checking for water locations...");
    const waterLocs = await prisma.location.findMany({
        where: {
            // Toronto islands bounding box roughly 43.60 to 43.63, -79.40 to -79.35
            latitude: { gt: 43.60, lt: 43.63 },
            longitude: { gt: -79.40, lt: -79.35 }
        },
        select: { name: true, latitude: true, longitude: true, category: true }
    });
    
    // Sort by latitude, lowest first
    waterLocs.sort((a, b) => a.latitude - b.latitude);
    
    console.log(`Found ${waterLocs.length} locations south of 43.62:`);
    console.log(JSON.stringify(waterLocs.slice(0, 20), null, 2)); // Print top 20 southernmost
    await prisma.$disconnect();
}
main();
