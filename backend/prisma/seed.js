import prisma from "../src/lib/prisma.js";

// Clean slate
await prisma.sensoryScore.deleteMany({});
await prisma.location.deleteMany({});

// Seed locations
await prisma.location.createMany({
    data: [
        {
            name: "Toronto Reference Library",
            category: "library",
            address: "789 Yonge St, Toronto",
            longitude: -79.3864,
            latitude: 43.6722,
        },
        {
            name: "High Park",
            category: "park",
            address: "1873 Bloor St W, Toronto",
            longitude: -79.4633,
            latitude: 43.6465,
        },
        {
            name: "Distillery District",
            category: "outdoor",
            address: "55 Mill St, Toronto",
            longitude: -79.3592,
            latitude: 43.6503,
        },
    ],
});

// Seed sensory scores
const locations = await prisma.location.findMany();

for (const loc of locations) {
    await prisma.sensoryScore.create({
        data: {
            locationId: loc.id,
            noiseScore: Math.random() * 5,
            lightingScore: Math.random() * 5,
            crowdScore: Math.random() * 5,
            comfortScore: Math.random() * 5,
            reviewCount: Math.floor(Math.random() * 20),
        }
    });
}


// Seed a test user
const user = await prisma.user.upsert({
    where: { auth0Id: "test|123" },
    update: {},
    create: {
        auth0Id: "test|123",
        email: "test@sensorysafe.com",
        username: "testuser",
    }
});

// Seed a test review
const firstLocation = await prisma.location.findFirst();
await prisma.review.upsert({
    where: { id: "test-review-id-001" },
    update: {},
    create: {
        id: "test-review-id-001",
        userId: user.id,
        locationId: firstLocation.id,
        bodyText: "Very quiet and calm. Soft lighting throughout. Not many people around. Great place to focus and relax.",
        rating: 5,
        noiseLevel: 1,
        lightingLevel: 4,
        crowdLevel: 1,
    }
});


console.log("Seeded clean locations + sensory scores");
await prisma.$disconnect();