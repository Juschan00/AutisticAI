import prisma from "../lib/prisma.js";

export const syncUser = async (req, res, next) => {
    try {
        const auth0Id = req.auth?.payload?.sub;
        const email = req.auth?.payload?.email ?? `${auth0Id}@placeholder.com`;

        if (!auth0Id) return next();

        await prisma.user.upsert({
            where: { auth0Id },
            update: {},
            create: { auth0Id, email }
        });

        next();
    } catch (error) {
        console.error("Error syncing user:", error);
        next();
    }
};