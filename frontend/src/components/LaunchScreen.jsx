import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './LaunchScreen.css';

const CATEGORIES = [
    {
        icon: '/assets/icons/cat-library.svg',
        title: 'Quiet Libraries',
        desc: 'Spaces with strictly enforced noise levels, comfortable seating, and calm environments.',
        tags: ['Low Noise', 'Focused'],
        filter: 'library',
    },
    {
        icon: '/assets/icons/cat-cafe.svg',
        title: 'Soft-Light Cafés',
        desc: 'Coffee shops prioritizing natural or warm lighting over harsh fluorescents.',
        tags: ['Warm Light', 'Cozy'],
        filter: 'cafe',
    },
    {
        icon: '/assets/icons/cat-park.svg',
        title: 'Calm Parks',
        desc: 'Open outdoor areas away from heavy traffic with plenty of personal space.',
        tags: ['Open Space', 'Nature'],
        filter: 'park',
    },
    {
        icon: '/assets/icons/cat-museum.svg',
        title: 'Sensory Museums',
        desc: 'Museums offering dedicated quiet hours, low-stimulation zones, and relaxed rules.',
        tags: ['Quiet Hours', 'Spacious'],
        filter: 'museum',
    },
    {
        icon: '/assets/icons/cat-retail.svg',
        title: 'Accessible Retail',
        desc: 'Stores offering sensory-friendly shopping times with reduced music and dimmed lights.',
        tags: ['No Music', 'Low Crowds'],
        filter: 'retail',
    },
    {
        icon: '/assets/icons/cat-explore.svg',
        title: 'Explore All Nearby',
        desc: 'View the sensory map to see real-time data and AI insights for places around you.',
        tags: ['Highly Recommended'],
        highlight: true,
        filter: null,
    },
];

const POPULAR_TAGS = [
    { icon: '/assets/icons/tag-quiet.svg', label: 'Quiet spaces', filter: 'quiet' },
    { icon: '/assets/icons/tag-light.svg', label: 'Soft lighting', filter: 'soft-lighting' },
    { icon: '/assets/icons/tag-crowd.svg', label: 'Low crowds', filter: 'low-crowds' },
    { icon: '/assets/icons/tag-outdoor.svg', label: 'Outdoor areas', filter: 'outdoor' },
];

function LaunchScreen({ onExploreMap }) {
    const { loginWithRedirect, isAuthenticated, user, logout } = useAuth0();
    const [searchQuery, setSearchQuery] = useState('');

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
                        <img src="/assets/icons/logo.svg" alt="SensorySafe" />
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
                            <button className="btn-login" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="launch-bg">
                <section className="launch-hero">
                    <div className="launch-badge">
                        <img src="/assets/icons/sparkle.svg" alt="" />
                        A calmer way to explore
                    </div>

                    <h2 className="launch-heading">
                        Find places that feel right for you.
                    </h2>

                    <p className="launch-subheading">
                        Discover public spaces with sensory comfort insights before you go.
                    </p>

                    <div className="launch-map-card" onClick={() => handleNavigate()} role="button" tabIndex={0}>
                        <div className="launch-map-preview">
                            <img className="map-bg" src="/assets/images/map-preview.jpg" alt="Map preview" />
                            <div className="map-overlay" />

                            <div className="map-nearby-badge">
                                <img src="/assets/icons/map-icon.svg" alt="" />
                                Nearby map
                            </div>

                            <div className="map-pin green pin-1">
                                <img src="/assets/icons/pin-green1.svg" alt="" />
                            </div>
                            <div className="map-pin green pin-2">
                                <img src="/assets/icons/pin-green2.svg" alt="" />
                            </div>
                            <div className="map-pin yellow pin-3">
                                <img src="/assets/icons/pin-yellow.svg" alt="" />
                            </div>
                            <div className="map-pin red pin-4">
                                <img src="/assets/icons/pin-red.svg" alt="" />
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
                                    <img src="/assets/icons/search.svg" alt="" />
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
                                <img src={tag.icon} alt="" />
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
                                    <img src={cat.icon} alt="" />
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
        </div>
    );
}

export default LaunchScreen;
