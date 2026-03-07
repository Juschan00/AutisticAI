import { useState, useEffect } from 'react';
import { getRankings } from '../services/api';

// Fallback rankings when backend is offline
const FALLBACK_RANKINGS = [
    { name: 'Botanical Garden', comfort_score: 9.5, noise_score: 1, crowd_score: 1 },
    { name: 'Riverside Park', comfort_score: 9.2, noise_score: 1, crowd_score: 2 },
    { name: 'Small Bookstore', comfort_score: 8.9, noise_score: 2, crowd_score: 2 },
    { name: 'Quiet Library Cafe', comfort_score: 8.5, noise_score: 2, crowd_score: 3 },
    { name: 'Maple Study Lounge', comfort_score: 7.8, noise_score: 3, crowd_score: 4 },
    { name: 'Community Center', comfort_score: 6.2, noise_score: 5, crowd_score: 5 },
    { name: 'Bus Terminal', comfort_score: 5.1, noise_score: 6, crowd_score: 6 },
    { name: 'Downtown Food Court', comfort_score: 3.0, noise_score: 8, crowd_score: 7 },
    { name: 'Mall Atrium', comfort_score: 2.8, noise_score: 7, crowd_score: 9 },
    { name: 'Nightclub District Cafe', comfort_score: 2.1, noise_score: 9, crowd_score: 8 },
];

function Rankings({ onClose }) {
    const [rankings, setRankings] = useState([]);
    const [sortBy, setSortBy] = useState('comfort_score');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('[Rankings] Fetching rankings, sortBy:', sortBy);
        setLoading(true);

        getRankings(sortBy)
            .then((res) => {
                console.log('[Rankings] Data loaded:', res.data);
                const raw = res.data?.rankings || res.data || [];
                const mapped = raw.map((r) => ({
                    ...r,
                    comfort_score: r.comfortScore ?? r.comfort_score,
                    noise_score: r.noiseScore ?? r.noise_score,
                    crowd_score: r.crowdScore ?? r.crowd_score,
                    lighting_score: r.lightingScore ?? r.lighting_score,
                }));
                setRankings(mapped);
                setLoading(false);
            })
            .catch((err) => {
                console.warn('[Rankings] API unavailable, using fallback:', err.message);
                // Sort fallback data locally
                const sorted = [...FALLBACK_RANKINGS].sort((a, b) => {
                    if (sortBy === 'comfort_score') return b.comfort_score - a.comfort_score;
                    if (sortBy === 'noise_score') return a.noise_score - b.noise_score; // lower = better
                    if (sortBy === 'crowd_score') return a.crowd_score - b.crowd_score; // lower = better
                    return b.comfort_score - a.comfort_score;
                });
                setRankings(sorted);
                setLoading(false);
            });
    }, [sortBy]);

    const getScoreColor = (score, invert = false) => {
        const normalized = invert ? (10 - score) / 10 : score / 10;
        const r = Math.round(255 * (1 - normalized));
        const g = Math.round(255 * normalized);
        return `rgb(${r}, ${g}, 80)`;
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 30,
            background: 'rgba(10,10,20,0.97)',
            color: '#fff',
            padding: 30,
            overflowY: 'auto',
        }}>
            <button onClick={onClose} style={{ float: 'right', cursor: 'pointer', background: 'none', border: 'none', color: '#fff', fontSize: 20 }}>✕ Back to Map</button>

            <h1>📊 Sensory Rankings</h1>

            {/* Sort Controls */}
            <div style={{ margin: '16px 0' }}>
                <span>Sort by: </span>
                {[
                    { key: 'comfort_score', label: 'Most Comfortable' },
                    { key: 'noise_score', label: 'Quietest' },
                    { key: 'crowd_score', label: 'Least Crowded' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setSortBy(key)}
                        style={{
                            marginRight: 8,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            background: sortBy === key ? '#4488ff' : '#333',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {loading && <div>Loading rankings...</div>}
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}

            {/* Best Places */}
            {!loading && (
                <>
                    <h2 style={{ color: '#4f4', marginTop: 20 }}>🟢 Best Sensory-Friendly</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 30 }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                <th style={{ padding: 8 }}>#</th>
                                <th style={{ padding: 8 }}>Location</th>
                                <th style={{ padding: 8 }}>Comfort</th>
                                <th style={{ padding: 8 }}>Noise</th>
                                <th style={{ padding: 8 }}>Crowds</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.slice(0, 5).map((loc, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: 8 }}>{i + 1}</td>
                                    <td style={{ padding: 8 }}>{loc.name}</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.comfort_score) }}>{loc.comfort_score}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.noise_score, true) }}>{loc.noise_score}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.crowd_score, true) }}>{loc.crowd_score}/10</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h2 style={{ color: '#f44', marginTop: 20 }}>🔴 Most Overwhelming</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                <th style={{ padding: 8 }}>#</th>
                                <th style={{ padding: 8 }}>Location</th>
                                <th style={{ padding: 8 }}>Comfort</th>
                                <th style={{ padding: 8 }}>Noise</th>
                                <th style={{ padding: 8 }}>Crowds</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...rankings].reverse().slice(0, 5).map((loc, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: 8 }}>{i + 1}</td>
                                    <td style={{ padding: 8 }}>{loc.name}</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.comfort_score) }}>{loc.comfort_score}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.noise_score, true) }}>{loc.noise_score}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.crowd_score, true) }}>{loc.crowd_score}/10</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}

export default Rankings;
