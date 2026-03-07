import express from "express";
import { model } from "../lib/gemini.js";
import prisma from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { syncUser } from "../middleware/syncUser.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "ai route live" });
});


// POST /ai/insights/:locationId — full AI insight card for a location
router.post("/insights/:locationId", requireAuth, syncUser, async (req, res) => {
  try {
    const { locationId } = req.params;

    // get locations + all reviews
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: { reviews: true }
    })

    if (!location) return res.status(404).json({ error: "Location not found" });
    if (location.reviews.length === 0) return res.status(400).json({ error: "Location has no reviews" });

    const reviewTexts = location.reviews.map((r) => r.bodyText).join("\n");

    const prompt = `
You are an AI assistant helping sensory-sensitive and autistic people find comfortable public spaces.

Analyze these reviews for "${location.name}" and return ONLY a JSON object with this exact structure:
{
  "confidence": <number 0-100>,
  "noise": {
    "score": <number 1-5>,
    "summary": "<one sentence description of noise>"
  },
  "lighting": {
    "score": <number 1-5>,
    "summary": "<one sentence description of lighting>"
  },
  "crowd": {
    "score": <number 1-5>,
    "summary": "<one sentence description of crowd levels>"
  },
  "bestTime": "<one sentence about best time to visit>",
  "sentiment": "<positive|neutral|negative>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"],
  "preparationGuide": ["<tip1>", "<tip2>", "<tip3>"]
}

Reviews:
${reviewTexts}

Return ONLY the JSON. No explanation, no markdown, no backticks.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);

    res.json(parsed);
  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;