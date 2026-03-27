import express from "express";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { syncUser } from "../middleware/syncUser.js";

const router = express.Router();

// POST /checkins/:locationId
// Creates a silent check-in for the authenticated user
router.post("/:locationId", requireAuth, syncUser, async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;
        const { locationId } = req.params;

        const user = await prisma.user.findUnique({
            where: { auth0Id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const checkIn = await prisma.checkIn.create({
            data: {
                userId: user.id,
                locationId: locationId
            }
        });

        res.status(201).json(checkIn);
    } catch (error) {
        console.error("Error creating check-in:", error);
        res.status(500).json({ error: error.message });
    }
});

// GET /checkins/recent
// Returns recent check-ins for the authenticated user
router.get("/recent", requireAuth, syncUser, async (req, res) => {
    try {
        const auth0Id = req.auth.payload.sub;

        const user = await prisma.user.findUnique({
            where: { auth0Id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const checkIns = await prisma.checkIn.findMany({
            where: { userId: user.id },
            include: { location: true },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        res.json(checkIns);
    } catch (error) {
        console.error("Error fetching check-ins:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
