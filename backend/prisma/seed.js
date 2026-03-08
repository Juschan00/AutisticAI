import "dotenv/config";
import prisma from "../src/lib/prisma.js";
import {
    searchGooglePlaces,
    getGooglePlaceDetails,
    uploadPlacePhoto,
    classifyCategory,
    analyzeWithGemini,
} from "../src/lib/placesService.js";

const SEARCH_QUERIES = [
    "libraries in Waterloo Ontario",
    "parks in Waterloo Ontario",
    "cafes in Waterloo Ontario",
    "museums in Kitchener Waterloo Ontario",
    "restaurants in Waterloo Ontario",
    "community centres in Kitchener Ontario",
    "bookstores in Waterloo Ontario",
    "shopping in Kitchener Waterloo Ontario",
    "quiet places in Waterloo Ontario",
    "nature trails in Kitchener Waterloo Ontario",
];

// ─── Main Seed Flow ──────────────────────────────────────────

console.log("🌱 Starting enhanced seed with Google Places + Gemini...\n");

// Step 0: Clean database
console.log("🗑️  Cleaning database...");
await prisma.review.deleteMany({});
await prisma.savedPlace.deleteMany({});
await prisma.sensoryScore.deleteMany({});
await prisma.sensoryProfile.deleteMany({});
await prisma.location.deleteMany({});

// Step 1: Fetch places from Google
console.log("📍 Fetching places from Google Places API...\n");
const seenPlaceIds = new Set();
const allPlaces = [];

for (const query of SEARCH_QUERIES) {
    console.log(`  Searching: "${query}"`);
    const results = await searchGooglePlaces(query);

    for (const place of results) {
        if (seenPlaceIds.has(place.place_id)) continue;
        seenPlaceIds.add(place.place_id);
        allPlaces.push(place);
    }

    await new Promise((r) => setTimeout(r, 300));
}

console.log(`\n  Found ${allPlaces.length} unique places. Taking top 30...\n`);
const selectedPlaces = allPlaces.slice(0, 30);

// Step 2: Get details + reviews for each place
console.log("📝 Fetching details and reviews for each place...\n");
const placesWithDetails = [];

for (const place of selectedPlaces) {
    try {
        const details = await getGooglePlaceDetails(place.place_id);
        if (!details) continue;

        const reviews = details.reviews || [];
        if (reviews.length === 0) {
            console.log(`  ⚠️  ${details.name} — no reviews, skipping`);
            continue;
        }

        placesWithDetails.push({
            googlePlaceId: place.place_id,
            name: details.name,
            address: details.formatted_address,
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            category: classifyCategory(details.types),
            description: details.editorial_summary?.overview || null,
            googleRating: details.rating,
            reviews: reviews.slice(0, 5),
            photoReference: details.photos?.[0]?.photo_reference || null,
        });

        console.log(`  ✅ ${details.name} (${reviews.length} reviews)`);
        await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
        console.log(`  ❌ Failed for ${place.name}: ${err.message}`);
    }
}

console.log(`\n  Got details for ${placesWithDetails.length} places.\n`);

// Step 3: Analyze with Gemini + insert into DB
console.log("🤖 Analyzing with Gemini and inserting into database...\n");

const testUser = await prisma.user.upsert({
    where: { auth0Id: "system|sensorysafe-bot" },
    update: {},
    create: {
        auth0Id: "system|sensorysafe-bot",
        email: "bot@sensorysafe.com",
        username: "SensorySafe Bot",
    },
});

let successCount = 0;

for (const place of placesWithDetails) {
    try {
        console.log(`  🔄 Analyzing: ${place.name}...`);

        const analysis = await analyzeWithGemini(place.name, place.category, place.reviews);

        let imageUrl = null;
        if (place.photoReference) {
            console.log(`  📸 Uploading photo for ${place.name}...`);
            imageUrl = await uploadPlacePhoto(place.photoReference);
            await new Promise((r) => setTimeout(r, 500));
        }

        const location = await prisma.location.create({
            data: {
                googlePlaceId: place.googlePlaceId,
                name: place.name,
                description: place.description,
                category: place.category,
                address: place.address,
                latitude: place.latitude,
                longitude: place.longitude,
                imageUrl,
            },
        });

        await prisma.sensoryScore.create({
            data: {
                locationId: location.id,
                noiseScore: analysis.noiseScore,
                lightingScore: analysis.lightingScore,
                crowdScore: analysis.crowdScore,
                comfortScore: analysis.comfortScore,
                reviewCount: analysis.reviews.length,
            },
        });

        for (const review of analysis.reviews) {
            await prisma.review.create({
                data: {
                    userId: testUser.id,
                    locationId: location.id,
                    bodyText: review.bodyText,
                    rating: review.rating,
                    noiseLevel: review.noiseLevel,
                    lightingLevel: review.lightingLevel,
                    crowdLevel: review.crowdLevel,
                },
            });
        }

        successCount++;
        console.log(`  ✅ ${place.name} — scores: noise=${analysis.noiseScore}, light=${analysis.lightingScore}, crowd=${analysis.crowdScore}, comfort=${analysis.comfortScore}${imageUrl ? ' 📷' : ' (no photo)'}`);

        await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
        console.log(`  ❌ Failed for ${place.name}: ${err.message}`);
    }
}

console.log(`\n✨ Done! Seeded ${successCount} locations with sensory scores and reviews.`);
await prisma.$disconnect();
