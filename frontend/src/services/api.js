import axios from 'axios';

// ============================================================
// Axios instance — all requests go through here
// Backend runs at http://localhost:5001/api
// ============================================================
const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Auth token management ───────────────────────────────────
let authToken = null;

export const setAuthToken = (token) => {
    authToken = token;
};

// ─── Request Interceptor (auth + logging) ────────────────────
api.interceptors.request.use(
    (config) => {
        // Attach auth token if available
        if (authToken) {
            config.headers.Authorization = `Bearer ${authToken}`;
        }
        console.log(`[API] ${config.method.toUpperCase()} ${config.url}`, config.params || '');
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// ─── Response Interceptor (logging) ──────────────────────────
api.interceptors.response.use(
    (response) => {
        console.log(`[API] Response ${response.status}:`, response.data);
        return response;
    },
    (error) => {
        console.error('[API] Response error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ═════════════════════════════════════════════════════════════
// ENDPOINT FUNCTIONS
// Each returns Axios promise — components handle .then/.catch
// ═════════════════════════════════════════════════════════════

// ─── Locations (GeoJSON for map layers) ─────────────────────
export const getLocations = () => {
    return api.get('/locations');
};

export const getLocationById = (id) => {
    return api.get(`/locations/${id}`);
};

// ─── Reviews ────────────────────────────────────────────────
export const submitReview = (reviewData) => {
    // reviewData: { locationId, bodyText, rating, noiseLevel, lightingLevel, crowdLevel }
    return api.post('/reviews', reviewData);
};

export const getReviewsByLocation = (locationId) => {
    return api.get(`/reviews/${locationId}`);
};

// ─── Rankings ───────────────────────────────────────────────
export const getRankings = (sortBy = 'comfortScore') => {
    // sortBy: 'comfortScore' | 'noiseScore' | 'crowdScore' | 'lightingScore'
    return api.get('/rankings', { params: { sort: sortBy } });
};

// ─── Sensory Profile ────────────────────────────────────────
export const getSensoryProfile = () => {
    return api.get('/profiles/me');
};

export const updateSensoryProfile = (profileData) => {
    // profileData: { noiseTolerance, lightingTolerance, crowdTolerance, notes }
    return api.put('/profiles/me', profileData);
};

// ─── AI Insights (Gemini) ───────────────────────────────────
export const getAIInsights = (locationId) => {
    return api.get(`/ai/${locationId}`);
};

export const analyzeReview = (reviewText) => {
    // Sends review text to backend → AI parses sensory signals
    return api.post('/ai/analyze', { text: reviewText });
};

export default api;
