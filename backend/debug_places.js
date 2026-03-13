import "dotenv/config";
import { searchGooglePlaces } from "./src/lib/placesService.js";

async function main() {
    const query = "libraries in Toronto Ontario";
    console.log(`Testing searchGooglePlaces with query: "${query}"`);
    try {
        const results = await searchGooglePlaces(query);
        console.log("Results count:", results.length);
        if (results.length === 0) {
            const key = process.env.GOOGLE_PLACES_KEY;
            console.log("Using API Key (first 5):", key ? key.substring(0, 5) : "MISSING");
            // Manual fetch to see error
            const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
            const res = await fetch(url);
            const data = await res.json();
            console.log("Google API Full Response:", JSON.stringify(data, null, 2));
        } else {
            console.log("First result:", results[0].name);
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}

main();
