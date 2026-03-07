import express from "express";
import { toGeoJSON } from "../lib/geojson.js";
import prisma from "../lib/prisma.js";

const router = express.Router()

// GET /locations
// Returns all locations in GeoJSON format
router.get("/", async (req, res) => {
    try {
        const locations = await prisma.location.findMany({
            include: {
                sensoryScores: true,
            }
        });
        res.json(toGeoJSON(locations));
    } catch (error) {
        console.error("Full error:", JSON.stringify(error, null, 2));
        res.status(500).json({ error: error.message });
    }
})


// GET /locations/heatmap — aggregated scores for deck.gl
router.get("/heatmap", async (req, res) => {
    try {
        const scores = await prisma.sensoryScore.findMany({
            include: {
                location: {
                    select: {
                        latitude: true,
                        longitude: true,
                        name: true
                    }
                }
            }
        })

        const heatMapData = scores.map((s) => ({
            longitude: s.location.longitude,
            latitude: s.location.latitude,
            name: s.location.name,
            noiseScore: s.noiseScore,
            lightingScore: s.lightingScore,
            crowdScore: s.crowdScore,
            comfortScore: s.comfortScore,
            reviewCount: s.reviewCount,
        }))
        res.json(heatMapData)
    } catch (error) {
        console.error("Full error:", JSON.stringify(error, null, 2));
        res.status(500).json({ error: error.message });
    }
})

export default router;