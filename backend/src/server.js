import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

import prisma from "./lib/prisma.js";

app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await prisma.$connect();
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
});