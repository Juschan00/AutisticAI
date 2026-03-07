import prisma from "../src/lib/prisma.js";

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

console.log("Seeded locations");
await prisma.$disconnect();