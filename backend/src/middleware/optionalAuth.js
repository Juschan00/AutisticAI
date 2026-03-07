import { auth } from "express-oauth2-jwt-bearer";

// Optional Auth0 middleware
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    auth({
        audience: process.env.AUTH0_AUDIENCE,
        issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    })(req, res, (err) => {
        if (err) return next();
        next();
    });
};