import express from "express";
import multer from "multer";
import cloudinary from "../lib/cloudinary.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /upload — upload image to Cloudinary (protected)
router.post("/", requireAuth, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No image provided" });

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: "sensorysafe" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(req.file.buffer);
        });

        res.json({ imageUrl: result.secure_url });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;