import { useState } from 'react';
import { submitReview, analyzeReview } from '../services/api';

function SubmitReview({ location, onClose, onSubmitted }) {
    const [formData, setFormData] = useState({
        noiseLevel: 5,
        lightingLevel: 5,
        crowdLevel: 5,
        bodyText: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [aiParsing, setAiParsing] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Send review text to AI for sensory signal extraction
    const handleAnalyze = () => {
        if (!formData.bodyText.trim()) return;

        console.log('[SubmitReview] Sending for AI analysis:', formData.bodyText);
        setAiParsing(true);
        setAiResult(null);

        analyzeReview(formData.bodyText)
            .then((res) => {
                console.log('[SubmitReview] AI analysis result:', res.data);
                setAiResult(res.data);
                setAiParsing(false);
            })
            .catch((err) => {
                console.warn('[SubmitReview] AI analysis failed:', err.message);
                setAiResult({ error: 'AI analysis unavailable — backend may be offline.' });
                setAiParsing(false);
            });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            locationId: location?.id || 'unknown',
            bodyText: formData.bodyText,
            rating: 5,
            noiseLevel: formData.noiseLevel,
            lightingLevel: formData.lightingLevel,
            crowdLevel: formData.crowdLevel,
        };

        console.log('[SubmitReview] Submitting review:', payload);
        setSubmitting(true);
        setError(null);

        submitReview(payload)
            .then((res) => {
                console.log('[SubmitReview] Review submitted successfully:', res.data);
                setSuccess(true);
                setSubmitting(false);
                if (onSubmitted) onSubmitted();
            })
            .catch((err) => {
                console.error('[SubmitReview] Submit failed:', err.message);
                setError(err.response?.data?.error || err.message);
                setSubmitting(false);
            });
    };

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

            <h2>Submit Review</h2>
            {location && <p style={{ color: '#aaa' }}>For: {location.name}</p>}

            {success ? (
                <div>
                    <p style={{ color: '#4f4' }}>✅ Review submitted successfully!</p>
                    <button onClick={onClose}>Close</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Noise Score */}
                    <div style={{ marginBottom: 16 }}>
                        <label>Noise Level: <strong>{formData.noiseLevel}</strong>/10</label>
                        <br />
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={formData.noiseLevel}
                            onChange={(e) => handleChange('noiseLevel', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Lighting Score */}
                    <div style={{ marginBottom: 16 }}>
                        <label>Lighting Level: <strong>{formData.lightingLevel}</strong>/10</label>
                        <br />
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={formData.lightingLevel}
                            onChange={(e) => handleChange('lightingLevel', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Crowd Score */}
                    <div style={{ marginBottom: 16 }}>
                        <label>Crowd Level: <strong>{formData.crowdLevel}</strong>/10</label>
                        <br />
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={formData.crowdLevel}
                            onChange={(e) => handleChange('crowdLevel', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Review Text */}
                    <div style={{ marginBottom: 16 }}>
                        <label>Your Review:</label>
                        <br />
                        <textarea
                            value={formData.bodyText}
                            onChange={(e) => handleChange('bodyText', e.target.value)}
                            placeholder="Describe the sensory environment..."
                            rows={4}
                            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #444', background: '#222', color: '#fff', resize: 'vertical' }}
                        />
                    </div>

                    {/* AI Analyze Button */}
                    <button
                        type="button"
                        onClick={handleAnalyze}
                        disabled={aiParsing || !formData.bodyText.trim()}
                        style={{ marginBottom: 12, cursor: 'pointer', padding: '6px 12px' }}
                    >
                        {aiParsing ? '🔄 Analyzing...' : '🤖 Analyze with AI'}
                    </button>

                    {/* AI Result */}
                    {aiResult && (
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                            <strong>AI Analysis:</strong>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>
                                {aiResult.error || JSON.stringify(aiResult, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        style={{ width: '100%', padding: '10px', cursor: 'pointer', fontSize: 16 }}
                    >
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>

                    {error && <div style={{ color: 'red', marginTop: 8 }}>Error: {error}</div>}
                </form>
            )}
        </div>
    );
}

export default SubmitReview;
