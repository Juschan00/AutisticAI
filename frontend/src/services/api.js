import axios from 'axios';

const api = axios.create({
    baseURL: '',
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
    return api.post('/reviews', reviewData);
};

export const getReviewsByLocation = (locationId) => {
    return api.get('/reviews', { params: { locationId } });
};

// ─── Rankings ───────────────────────────────────────────────
export const getRankings = (sortBy = 'comfort_score') => {
    return api.get('/rankings', { params: { sort: sortBy } });
};

// ─── Sensory Profile ────────────────────────────────────────
export const getSensoryProfile = () => {
    return api.get('/profiles/me');
};

export const updateSensoryProfile = (profileData) => {
    return api.put('/profiles/me', profileData);
};

// ─── AI Insights (Gemini) ───────────────────────────────────
export const getAIInsights = (locationId) => {
    return api.get('/ai', { params: { locationId } });
};

export const analyzeReview = (reviewText) => {
    return api.post('/ai/analyze', { text: reviewText });
};

export default api;
