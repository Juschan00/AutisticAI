import axios from 'axios';

// ============================================================
// Axios instance — all requests go through here
// Backend runs at http://localhost:5000/api
// ============================================================
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Request Interceptor (logging) ───────────────────────────
api.interceptors.request.use(
    (config) => {
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
    // reviewData: { locationId, noise_score, lighting_score, crowd_score, review_text }
    return api.post('/reviews', reviewData);
};

export const getReviewsByLocation = (locationId) => {
    return api.get(`/reviews/${locationId}`);
};

// ─── Rankings ───────────────────────────────────────────────
export const getRankings = (sortBy = 'comfort_score') => {
    // sortBy: 'comfort_score' | 'noise_score' | 'crowd_score' | 'lighting_score'
    return api.get('/rankings', { params: { sort: sortBy } });
};

// ─── Sensory Profile ────────────────────────────────────────
export const getSensoryProfile = (userId) => {
    return api.get(`/profile/${userId}`);
};

export const updateSensoryProfile = (userId, profileData) => {
    // profileData: { noise_tolerance, lighting_tolerance, crowd_tolerance, triggers }
    return api.put(`/profile/${userId}`, profileData);
};

// ─── AI Insights (Gemini) ───────────────────────────────────
export const getAIInsights = (locationId) => {
    return api.get(`/insights/${locationId}`);
};

export const analyzeReview = (reviewText) => {
    // Sends review text to backend → Gemini API parses sensory signals
    return api.post('/insights/analyze', { text: reviewText });
};

export default api;
