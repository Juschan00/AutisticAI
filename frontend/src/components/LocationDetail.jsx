import { useState, useEffect } from 'react';
import { getLocationById, getReviewsByLocation, getAIInsights } from '../services/api';

function LocationDetail({ location, onClose }) {
    const [reviews, setReviews] = useState([]);
    const [aiInsight, setAiInsight] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!location) return;

        console.log('[LocationDetail] Opened for:', location.name);
        setLoading(true);
        setError(null);

        // Fetch reviews + AI insights in parallel
        const locationId = location.id || location.name; // fallback to name if no id

        Promise.allSettled([
            getReviewsByLocation(locationId),
            getAIInsights(locationId),
        ])
            .then(([reviewsResult, insightsResult]) => {
                if (reviewsResult.status === 'fulfilled') {
                    console.log('[LocationDetail] Reviews loaded:', reviewsResult.value.data);
                    setReviews(reviewsResult.value.data?.reviews || []);
                } else {
                    console.warn('[LocationDetail] Reviews fetch failed:', reviewsResult.reason?.message);
                }

                if (insightsResult.status === 'fulfilled') {
                    console.log('[LocationDetail] AI Insights loaded:', insightsResult.value.data);
                    setAiInsight(insightsResult.value.data);
                } else {
                    console.warn('[LocationDetail] AI Insights fetch failed:', insightsResult.reason?.message);
                }

                setLoading(false);
            })
            .catch((err) => {
                console.error('[LocationDetail] Unexpected error:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [location]);

    if (!location) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 360,
            height: '100%',
            zIndex: 20,
            background: 'rgba(20,20,30,0.95)',
            color: '#fff',
            padding: 20,
            overflowY: 'auto',
        }}>
            <button onClick={onClose} style={{ float: 'right', cursor: 'pointer', background: 'none', border: 'none', color: '#fff', fontSize: 20 }}>✕</button>

            <h2>{location.name}</h2>

            {/* Sensory Rating Breakdown */}
            <div style={{ margin: '16px 0' }}>
                <h3>Sensory Ratings</h3>
                <div>Comfort: <strong>{location.comfortScore ?? '–'}</strong>/10</div>
                <div>Noise: <strong>{location.noiseScore ?? '–'}</strong>/10</div>
                <div>Lighting: <strong>{location.lightingScore ?? '–'}</strong>/10</div>
                <div>Crowds: <strong>{location.crowdScore ?? '–'}</strong>/10</div>
            </div>

            {/* AI Summary */}
            <div style={{ margin: '16px 0' }}>
                <h3>🤖 AI Insights</h3>
                {loading && <div>Loading insights...</div>}
                {aiInsight && (
                    <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 6, marginTop: 8 }}>
                        {aiInsight.summary || JSON.stringify(aiInsight)}
                    </div>
                )}
                {!loading && !aiInsight && (
                    <div style={{ color: '#888' }}>No AI insights available yet.</div>
                )}
            </div>

            {/* Community Reviews */}
            <div style={{ margin: '16px 0' }}>
                <h3>Community Reviews</h3>
                {loading && <div>Loading reviews...</div>}
                {reviews.length > 0 ? (
                    reviews.map((review, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 6, marginBottom: 8 }}>
                            <div style={{ fontSize: 12, color: '#888' }}>{review.user || 'Anonymous'}</div>
                            <div>{review.bodyText || review.text}</div>
                            {review.noiseLevel != null && (
                                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                                    Noise: {review.noiseLevel} | Light: {review.lightingLevel} | Crowd: {review.crowdLevel}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    !loading && <div style={{ color: '#888' }}>No reviews yet. Be the first!</div>
                )}
            </div>

            {error && <div style={{ color: 'red', marginTop: 12 }}>Error: {error}</div>}
        </div>
    );
}

export default LocationDetail;
