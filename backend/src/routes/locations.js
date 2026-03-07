import express from "express";
import { toGeoJSON } from "../lib/geojson.js";
import prisma from "../lib/prisma.js";

const router = express.Router()



// router.get("/", (req, res) => {
//     res.json({ message: "locations route live" });
// });


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

export default router;