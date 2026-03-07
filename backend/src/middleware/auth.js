import { auth } from "express-oauth2-jwt-bearer";


// Auth0 middleware
export const requireAuth = auth({
    // audience is the API identifier
    audience: process.env.AUTH0_AUDIENCE,
    // issuerBaseURL is the Auth0 domain
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
});
