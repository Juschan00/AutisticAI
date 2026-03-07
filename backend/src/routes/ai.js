import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "ai route live" });
});

export default router;