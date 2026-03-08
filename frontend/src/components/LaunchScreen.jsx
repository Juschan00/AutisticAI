import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LogoutConfirmation from './LogoutConfirmation';
import './LaunchScreen.css';

const CATEGORIES = [
    {
        emoji: '📚',
        title: 'Quiet Libraries',
        desc: 'Spaces with strictly enforced noise levels, comfortable seating, and calm environments.',
        tags: ['Low Noise', 'Focused'],
        filter: 'library',
    },
    {
        emoji: '☕',
        title: 'Soft-Light Cafés',
        desc: 'Coffee shops prioritizing natural or warm lighting over harsh fluorescents.',
        tags: ['Warm Light', 'Cozy'],
        filter: 'cafe',
    },
    {
        emoji: '🌳',
        title: 'Calm Parks',
        desc: 'Open outdoor areas away from heavy traffic with plenty of personal space.',
        tags: ['Open Space', 'Nature'],
        filter: 'park',
    },
    {
        emoji: '🏛️',
        title: 'Sensory Museums',
        desc: 'Museums offering dedicated quiet hours, low-stimulation zones, and relaxed rules.',
        tags: ['Quiet Hours', 'Spacious'],
        filter: 'museum',
    },
    {
        emoji: '🛍️',
        title: 'Accessible Retail',
        desc: 'Stores offering sensory-friendly shopping times with reduced music and dimmed lights.',
        tags: ['No Music', 'Low Crowds'],
        filter: 'retail',
    },
    {
        emoji: '🔍',
        title: 'Explore All Nearby',
        desc: 'View the sensory map to see real-time data and AI insights for places around you.',
        tags: ['Highly Recommended'],
        highlight: true,
        filter: null,
    },
];

const POPULAR_TAGS = [
    { emoji: '🤫', label: 'Quiet spaces', filter: 'quiet' },
    { emoji: '💡', label: 'Soft lighting', filter: 'soft-lighting' },
    { emoji: '👥', label: 'Low crowds', filter: 'low-crowds' },
    { emoji: '🌿', label: 'Outdoor areas', filter: 'outdoor' },
];

function LaunchScreen({ onExploreMap }) {
    const { loginWithRedirect, isAuthenticated, user } = useAuth0();
    const [searchQuery, setSearchQuery] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleNavigate = (filter = null, query = '') => {
        if (onExploreMap) {
            onExploreMap({ filter, searchQuery: query || searchQuery });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        handleNavigate(null, searchQuery);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch(e);
    };

    return (
        <div className="launch">
            <header className="launch-header">
                <div className="launch-logo">
                    <div className="launch-logo-icon">
                        <span style={{ fontSize: 22, lineHeight: 1 }}>🧠</span>
                    </div>
                    <div className="launch-logo-text">
                        <h1>SensorySafe Map</h1>
                        <p>Explore safely and simply</p>
                    </div>
                </div>
                <div className="launch-auth">
                    {!isAuthenticated ? (
                        <>
                            <button className="btn-login" onClick={() => loginWithRedirect()}>
                                Log in
                            </button>
                            <button className="btn-signup" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })}>
                                Sign up
                            </button>
                        </>
                    ) : (
                        <div className="launch-user">
                            <span className="launch-user-name">{user?.name || user?.email}</span>
                            <button className="btn-signup" onClick={() => handleNavigate()}>
                                Open Map
                            </button>
                            <button className="btn-login" onClick={() => setShowLogoutModal(true)}>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="launch-bg">
                <section className="launch-hero">
                    <div className="launch-badge">
                        ✨ A calmer way to explore
                    </div>

                    <h2 className="launch-heading">
                        Find places that feel right for you.
                    </h2>

                    <p className="launch-subheading">
                        Discover public spaces with sensory comfort insights before you go.
                    </p>

                    <div className="launch-map-card" onClick={() => handleNavigate()} role="button" tabIndex={0}>
                        <div className="launch-map-preview">
                            <img className="map-bg" src="/assets/images/map-preview.jpg" alt="Sensory map preview" />
                            <div className="map-overlay" />

                            <div className="map-nearby-badge">
                                🗺️ Nearby map
                            </div>

                            <div className="map-legend">
                                <div className="map-legend-item">
                                    <span className="legend-dot green" />
                                    Comfortable
                                </div>
                                <div className="map-legend-item">
                                    <span className="legend-dot yellow" />
                                    Moderate
                                </div>
                                <div className="map-legend-item">
                                    <span className="legend-dot red" />
                                    Overwhelming
                                </div>
                            </div>

                            <form className="map-search" onSubmit={handleSearch} onClick={(e) => e.stopPropagation()}>
                                <div className="map-search-input">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                                    <input
                                        type="text"
                                        placeholder="Search places, needs, or triggers"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                </div>
                                <button type="submit" className="map-search-btn">
                                    Search
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="launch-popular">
                        <span className="popular-label">Popular:</span>
                        {POPULAR_TAGS.map((tag) => (
                            <button
                                key={tag.filter}
                                className="popular-tag"
                                onClick={() => handleNavigate(tag.filter)}
                            >
                                <span>{tag.emoji}</span>
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="launch-categories">
                    <h2>Top Sensory-Friendly Categories</h2>
                    <p className="cat-subtitle">Explore highly-rated spaces tailored for comfort.</p>

                    <div className="cat-grid">
                        {CATEGORIES.map((cat) => (
                            <div
                                key={cat.title}
                                className="cat-card"
                                onClick={() => handleNavigate(cat.filter)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleNavigate(cat.filter)}
                            >
                                <div className="cat-icon">
                                    <span style={{ fontSize: 24 }}>{cat.emoji}</span>
                                </div>
                                <div>
                                    <h3>{cat.title}</h3>
                                    <p>{cat.desc}</p>
                                    <div className="cat-tags">
                                        {cat.tags.map((tag) => (
                                            <span key={tag} className={`cat-tag${cat.highlight ? ' highlight' : ''}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {showLogoutModal && (
                <LogoutConfirmation onCancel={() => setShowLogoutModal(false)} />
            )}
        </div>
    );
}

export default LaunchScreen;
