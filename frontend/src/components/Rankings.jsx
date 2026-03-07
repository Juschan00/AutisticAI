import { useState, useEffect } from 'react';
import { getRankings } from '../services/api';

// Fallback rankings when backend is offline
const FALLBACK_RANKINGS = [
    { name: 'Botanical Garden', comfortScore: 9.5, noiseScore: 1, crowdScore: 1 },
    { name: 'Riverside Park', comfortScore: 9.2, noiseScore: 1, crowdScore: 2 },
    { name: 'Small Bookstore', comfortScore: 8.9, noiseScore: 2, crowdScore: 2 },
    { name: 'Quiet Library Cafe', comfortScore: 8.5, noiseScore: 2, crowdScore: 3 },
    { name: 'Maple Study Lounge', comfortScore: 7.8, noiseScore: 3, crowdScore: 4 },
    { name: 'Community Center', comfortScore: 6.2, noiseScore: 5, crowdScore: 5 },
    { name: 'Bus Terminal', comfortScore: 5.1, noiseScore: 6, crowdScore: 6 },
    { name: 'Downtown Food Court', comfortScore: 3.0, noiseScore: 8, crowdScore: 7 },
    { name: 'Mall Atrium', comfortScore: 2.8, noiseScore: 7, crowdScore: 9 },
    { name: 'Nightclub District Cafe', comfortScore: 2.1, noiseScore: 9, crowdScore: 8 },
];

function Rankings({ onClose }) {
    const [rankings, setRankings] = useState([]);
    const [sortBy, setSortBy] = useState('comfortScore');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('[Rankings] Fetching rankings, sortBy:', sortBy);
        setLoading(true);

        getRankings(sortBy)
            .then((res) => {
                console.log('[Rankings] Data loaded:', res.data);
                setRankings(res.data?.rankings || res.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.warn('[Rankings] API unavailable, using fallback:', err.message);
                // Sort fallback data locally
                const sorted = [...FALLBACK_RANKINGS].sort((a, b) => {
                    if (sortBy === 'comfortScore') return b.comfortScore - a.comfortScore;
                    if (sortBy === 'noiseScore') return a.noiseScore - b.noiseScore; // lower = better
                    if (sortBy === 'crowdScore') return a.crowdScore - b.crowdScore; // lower = better
                    return b.comfortScore - a.comfortScore;
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
                    { key: 'comfortScore', label: 'Most Comfortable' },
                    { key: 'noiseScore', label: 'Quietest' },
                    { key: 'crowdScore', label: 'Least Crowded' },
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
                                    <td style={{ padding: 8, color: getScoreColor(loc.comfortScore) }}>{loc.comfortScore}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.noiseScore, true) }}>{loc.noiseScore}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.crowdScore, true) }}>{loc.crowdScore}/10</td>
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
                                    <td style={{ padding: 8, color: getScoreColor(loc.comfortScore) }}>{loc.comfortScore}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.noiseScore, true) }}>{loc.noiseScore}/10</td>
                                    <td style={{ padding: 8, color: getScoreColor(loc.crowdScore, true) }}>{loc.crowdScore}/10</td>
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
