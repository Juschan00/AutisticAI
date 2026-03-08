import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import MapView from './MapView';
import { getRankings, getLocationHeatmap, getLocationById, searchLocations } from '../services/api';
import './NonLoginMapView.css';

const QUICK_FILTERS = [
  { label: 'Quiet now', filter: 'quiet-now' },
  { label: 'Low crowds', filter: 'low-crowds' },
  { label: 'Soft lighting', filter: 'soft-lighting' },
  { label: 'Outdoor spaces', filter: 'outdoor' },
  { label: 'Before noon', filter: 'before-noon' },
  { label: 'Nearby', filter: 'nearby' },
];

const CATEGORY_CHIPS = [
  { emoji: '📚', title: 'Quiet libraries', desc: 'Low noise spaces', filter: 'library' },
  { emoji: '☕', title: 'Soft-light cafes', desc: 'Gentler lighting', filter: 'cafe' },
  { emoji: '🌳', title: 'Outdoor calm', desc: 'Open spaces', filter: 'outdoor' },
  { emoji: '🔍', title: 'Explore all', desc: 'All places', filter: null },
];

const scoreToLabel = (s) => s < 2 ? 'Low' : s < 3.5 ? 'Medium' : 'High';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km < 1 ? `${(km * 1000).toFixed(0)}m away` : `${km.toFixed(1)}km away`;
};

function NonLoginMapView({ onExploreMap, initialSearchQuery, initialFilter }) {
  const { loginWithRedirect } = useAuth0();
  const [activeFilter, setActiveFilter] = useState(initialFilter ?? null);
  const [heatmapOn, setHeatmapOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? '');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [locationDetail, setLocationDetail] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [searchNoResults, setSearchNoResults] = useState(false);

  // --- Mount: fetch heatmap, rankings, geolocation ---
  useEffect(() => {
    getLocationHeatmap()
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setHeatmapData(data);
          const calmCount = data.filter((l) => (l.comfortScore ?? 0) > 3.5).length;
          const avgNoise = data.length > 0 ? data.reduce((a, b) => a + (b.noiseScore ?? 0), 0) / data.length : 0;
          const avgComfort = data.length > 0 ? data.reduce((a, b) => a + (b.comfortScore ?? 0), 0) / data.length : 0;
          const hour = new Date().getHours();
          const bestWindow = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
          setSnapshot({ calmCount, noiseTrend: scoreToLabel(avgNoise), avgComfort, bestWindow });
        }
      })
      .catch(() => {});

    getRankings()
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setRankings(
            data.slice(0, 5).map((loc) => ({
              id: loc.locationId,
              name: loc.name,
              category: loc.category,
              address: loc.address,
              latitude: loc.latitude,
              longitude: loc.longitude,
              tags: (() => {
                const t = [];
                if ((loc.noiseScore ?? 5) < 2) t.push('Very quiet');
                if ((loc.lightingScore ?? 5) < 3.5) t.push('Soft lighting');
                if ((loc.crowdScore ?? 5) < 2) t.push('Low crowds');
                if ((loc.comfortScore ?? 0) > 3.5) t.push('Highly comfortable');
                return t.length > 0 ? t.join(' • ') : (loc.category || 'Sensory-friendly');
              })(),
              score: loc.comfortScore ?? 0,
              tier: (loc.comfortScore ?? 0) >= 4 ? 'high' : (loc.comfortScore ?? 0) >= 2.5 ? 'medium' : 'low',
              noise_score: loc.noiseScore,
              lighting_score: loc.lightingScore,
              crowd_score: loc.crowdScore,
              comfort_score: loc.comfortScore,
            }))
          );
        }
      })
      .catch(() => {});

    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null)
    );
  }, []);

  // --- On mount: run search if opened from launch with a query ---
  useEffect(() => {
    if (!initialSearchQuery?.trim()) return;
    setSearchLoading(true);
    searchLocations(initialSearchQuery.trim())
      .then((res) => {
        setSearchResults(res.data);
        if (!res.data?.features?.length) {
          setSearchNoResults(true);
          setTimeout(() => setSearchNoResults(false), 3000);
        }
      })
      .catch(() => {
        setSearchResults({ features: [] });
        setSearchNoResults(true);
        setTimeout(() => setSearchNoResults(false), 3000);
      })
      .finally(() => setSearchLoading(false));
  }, [initialSearchQuery]);

  // --- When selected location changes: fetch detail ---
  useEffect(() => {
    if (!selectedLocation) return;
    setLocationDetail(null);
    setAvgRating(null);

    const locId = selectedLocation.id;
    if (!locId) return;

    getLocationById(locId)
      .then((res) => {
        const detail = res.data;
        setLocationDetail(detail);
        if (detail?.reviews?.length > 0) {
          const avg = detail.reviews.reduce((a, b) => a + (b.rating || 0), 0) / detail.reviews.length;
          setAvgRating(avg);
        }
      })
      .catch(() => {});
  }, [selectedLocation]);

  const handleFilterClick = (filter) => {
    setActiveFilter((prev) => (prev === filter ? null : filter));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchNoResults(false);
      return;
    }
    setSearchLoading(true);
    setSearchNoResults(false);
    try {
      const res = await searchLocations(searchQuery.trim());
      setSearchResults(res.data);
      if (!res.data?.features?.length) {
        setSearchNoResults(true);
        setTimeout(() => setSearchNoResults(false), 3000);
      }
    } catch {
      setSearchResults({ features: [] });
      setSearchNoResults(true);
      setTimeout(() => setSearchNoResults(false), 3000);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCategoryClick = (f) => {
    setActiveFilter((prev) => (prev === f ? null : f));
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleSignIn = () => {
    loginWithRedirect();
  };

  // --- Derived values from real API data ---
  const sensory = locationDetail?.sensoryScores || selectedLocation || {};
  const locationName = selectedLocation?.name || 'Select a location';
  const reviewCount = locationDetail?.sensoryScores?.reviewCount ?? locationDetail?.reviews?.length ?? 0;

  const noiseScore = sensory.noiseScore ?? sensory.noise_score ?? 2.5;
  const lightingScore = sensory.lightingScore ?? sensory.lighting_score ?? 2.5;
  const crowdScore = sensory.crowdScore ?? sensory.crowd_score ?? 2.5;
  const comfortScore = sensory.comfortScore ?? sensory.comfort_score ?? 2.5;
  const overallScore = comfortScore.toFixed(1);

  const starCount = avgRating !== null ? Math.round(avgRating) : 0;

  // Rating tags
  const ratingTags = (() => {
    const tags = [];
    const revisit = Math.round(comfortScore / 5 * 100);
    tags.push(`${revisit}% would revisit`);
    if (noiseScore < 2) tags.push('Low-noise favorite');
    if (crowdScore < 2) tags.push('Low-crowd spot');
    return tags;
  })();

  const getDistance = useCallback((loc) => {
    if (!userCoords || !loc.latitude || !loc.longitude) return '— km away';
    return haversineDistance(userCoords.lat, userCoords.lng, loc.latitude, loc.longitude);
  }, [userCoords]);

  // Map filter conversion for MapView
  const mapFilter = (() => {
    if (!activeFilter) return null;
    if (activeFilter === 'quiet-now') return 'quiet';
    if (activeFilter === 'before-noon') return 'quiet';
    if (activeFilter === 'nearby') return null;
    return activeFilter;
  })();

  return (
    <div className="nlm">
      {/* Background map */}
      <div className="nlm-map-container">
        <MapView
          onLocationSelect={handleLocationSelect}
          filter={mapFilter}
          searchResultsGeoJSON={searchResults}
          heatmapEnabled={heatmapOn}
          heatmapData={heatmapData}
        />
      </div>

      {/* Left Sidebar */}
      <aside className="nlm-sidebar-left">
        {/* Logo */}
        <div className="nlm-logo-row">
          <div className="nlm-logo-group">
            <div className="nlm-logo-icon">
              <span style={{ fontSize: 20, lineHeight: 1 }}>🧠</span>
            </div>
            <div className="nlm-logo-text">
              <h1>SensorySafe Map</h1>
              <p>Explore safely and simply</p>
            </div>
          </div>
          <button className="nlm-settings-btn" aria-label="Settings" onClick={() => loginWithRedirect()}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.55 11.25C14.4374 11.5028 14.4041 11.7832 14.4541 12.0546C14.5041 12.326 14.6349 12.576 14.8275 12.7725L14.8725 12.8175C15.0287 12.9735 15.1523 13.1589 15.2363 13.3631C15.3204 13.5673 15.3634 13.786 15.3634 14.0069C15.3634 14.2278 15.3204 14.4464 15.2363 14.6506C15.1523 14.8548 15.0287 15.0402 14.8725 15.1963C14.7164 15.3524 14.531 15.476 14.3268 15.5601C14.1226 15.6441 13.904 15.6871 13.6831 15.6871C13.4622 15.6871 13.2436 15.6441 13.0394 15.5601C12.8352 15.476 12.6498 15.3524 12.4937 15.1963L12.4487 15.1513C12.2523 14.9586 12.0023 14.8278 11.7309 14.7778C11.4595 14.7278 11.179 14.7612 10.9263 14.8738C10.6786 14.9812 10.4678 15.1576 10.3189 15.3824C10.17 15.6072 10.0894 15.8707 10.0875 16.1405V16.3125C10.0875 16.7599 9.90971 17.1891 9.59309 17.5057C9.27647 17.8223 8.84723 18 8.39984 18C7.95246 18 7.52321 17.8223 7.20659 17.5057C6.88997 17.1891 6.71234 16.7599 6.71234 16.3125V16.2225C6.70466 15.9438 6.61419 15.6739 6.45271 15.4479C6.29123 15.222 6.06617 15.0505 5.80484 14.9550C5.55214 14.8424 5.27168 14.809 5.00028 14.859C4.72887 14.909 4.47888 15.0399 4.28234 15.2325L4.23734 15.2775C4.08127 15.4337 3.89585 15.5572 3.69166 15.6413C3.48748 15.7254 3.26886 15.7683 3.04796 15.7683C2.82706 15.7683 2.60845 15.7254 2.40426 15.6413C2.20007 15.5572 2.01466 15.4337 1.85859 15.2775C1.70244 15.1214 1.57887 14.936 1.49482 14.7318C1.41077 14.5276 1.36781 14.309 1.36781 14.0881C1.36781 13.8672 1.41077 13.6486 1.49482 13.4444C1.57887 13.2402 1.70244 13.0548 1.85859 12.8987L1.90359 12.8537C2.09622 12.6572 2.22705 12.4073 2.27706 12.1359C2.32706 11.8645 2.29362 11.584 2.18109 11.3313C2.07371 11.0835 1.89729 10.8727 1.67251 10.7238C1.44773 10.5749 1.18425 10.4943 0.914467 10.4925H0.742462C0.295074 10.4925 -0.13417 10.3149 -0.450789 9.99825C-0.767408 9.68163 -0.945038 9.25239 -0.945038 8.805C-0.945038 8.35761 -0.767408 7.92837 -0.450789 7.61175C-0.13417 7.29513 0.295074 7.1175 0.742462 7.1175H0.832463C1.11116 7.10982 1.38109 7.01935 1.60703 6.85787C1.83297 6.69639 2.00446 6.47133 2.09997 6.21L2.09997 6.21C2.21249 5.9573 2.24593 5.67684 2.19593 5.40543C2.14593 5.13402 2.01509 4.88403 1.82247 4.68749L1.77747 4.64249C1.62131 4.48643 1.49775 4.30101 1.41369 4.09682C1.32964 3.89263 1.28668 3.67402 1.28668 3.45312C1.28668 3.23222 1.32964 3.01361 1.41369 2.80942C1.49775 2.60523 1.62131 2.41981 1.77747 2.26375C1.93353 2.10759 2.11895 1.98403 2.32314 1.89997C2.52733 1.81592 2.74594 1.77296 2.96684 1.77296C3.18774 1.77296 3.40636 1.81592 3.61054 1.89997C3.81473 1.98403 4.00015 2.10759 4.15622 2.26375L4.20122 2.30875C4.39776 2.50137 4.64775 2.63221 4.91916 2.68221C5.19057 2.73222 5.47103 2.69878 5.72372 2.58625H5.80484C6.05263 2.47887 6.26341 2.30245 6.41233 2.07767C6.56124 1.85289 6.64186 1.58941 6.64372 1.31963V1.125C6.64372 0.677613 6.82135 0.248369 7.13797 -0.0682498C7.45459 -0.384869 7.88383 -0.5625 8.33122 -0.5625C8.77861 -0.5625 9.20785 -0.384869 9.52447 -0.0682498C9.84109 0.248369 10.0187 0.677613 10.0187 1.125V1.215C10.0206 1.48478 10.1012 1.74826 10.2501 1.97305C10.399 2.19783 10.6098 2.37424 10.8576 2.48162C11.1103 2.59415 11.3907 2.62759 11.6621 2.57759C11.9336 2.52758 12.1835 2.39675 12.38 2.20412L12.425 2.15912C12.5811 2.00297 12.7665 1.87941 12.9707 1.79535C13.1749 1.7113 13.3935 1.66834 13.6144 1.66834C13.8353 1.66834 14.0539 1.7113 14.2581 1.79535C14.4623 1.87941 14.6477 2.00297 14.8038 2.15912C14.9599 2.31519 15.0835 2.50061 15.1675 2.70479C15.2516 2.90898 15.2945 3.12759 15.2945 3.3485C15.2945 3.5694 15.2516 3.78801 15.1675 3.9922C15.0835 4.19639 14.9599 4.38181 14.8038 4.53787L14.7588 4.58287C14.5661 4.77941 14.4353 5.0294 14.3853 5.30081C14.3353 5.57222 14.3687 5.85268 14.4812 6.10537V6.18649C14.5886 6.43429 14.765 6.64507 14.9898 6.79398C15.2146 6.9429 15.4781 7.02352 15.7479 7.02537H15.9424C16.3898 7.02537 16.819 7.203 17.1357 7.51962C17.4523 7.83624 17.6299 8.26549 17.6299 8.71287C17.6299 9.16026 17.4523 9.5895 17.1357 9.90612C16.819 10.2227 16.3898 10.4004 15.9424 10.4004H15.8524C15.5826 10.4022 15.3192 10.4828 15.0944 10.6318C14.8696 10.7807 14.6932 10.9915 14.5858 11.2393L14.55 11.25Z" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Hero card */}
        <div className="nlm-hero-card">
          <div className="nlm-calm-badge">
            ✨ Calm mode on
          </div>
          <h2>Find a place that feels better right now.</h2>
          <p className="nlm-hero-desc">
            {snapshot
              ? `${snapshot.calmCount} calm places nearby • Noise trend: ${snapshot.noiseTrend} • Best: ${snapshot.bestWindow}`
              : 'Only the most important details are shown: comfort, likely triggers, and best times to go.'}
          </p>
        </div>

        {/* Quick Filters */}
        <div className="nlm-filters">
          <h3>Quick filters</h3>
          <div className="nlm-filter-chips">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f.filter}
                className={`nlm-filter-chip${activeFilter === f.filter ? ' active' : ''}`}
                onClick={() => handleFilterClick(f.filter)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Ranked */}
        <div className="nlm-ranked">
          <div className="nlm-ranked-header">
            <h3>Top ranked sensory-friendly places</h3>
            <p>Best options nearby with simple summaries.</p>
          </div>
          <div className="nlm-ranked-list">
            {rankings.length > 0 ? rankings.map((place) => (
              <div
                key={place.id ?? place.name}
                className="nlm-ranked-item"
                role="button"
                tabIndex={0}
                onClick={() => handleLocationSelect(place)}
                onKeyDown={(e) => e.key === 'Enter' && handleLocationSelect(place)}
              >
                <div className="nlm-ranked-info">
                  <h4>{place.name}</h4>
                  <p>{place.tags}</p>
                </div>
                <div className={`nlm-ranked-score ${place.tier}`}>
                  {(place.score || 0).toFixed(1)}
                </div>
              </div>
            )) : (
              <div style={{ padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                <div className="animate-pulse" style={{ height: 48, background: '#e5e7eb', borderRadius: 6, marginBottom: 8 }} />
                <div className="animate-pulse" style={{ height: 48, background: '#e5e7eb', borderRadius: 6, marginBottom: 8 }} />
                <div className="animate-pulse" style={{ height: 48, background: '#e5e7eb', borderRadius: 6 }} />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Right Sidebar */}
      <aside className="nlm-sidebar-right">
        {/* Ratings Card */}
        <div className="nlm-ratings-card">
          <div className="nlm-ratings-header">
            <div className="nlm-ratings-title">
              <h2>Ratings</h2>
              <p>{locationName}</p>
            </div>
            <div className="nlm-score-badge">
              <span className="score-value">{overallScore}</span>
              <span className="score-label">{reviewCount} reviews</span>
            </div>
          </div>

          {/* Stars */}
          <div className="nlm-stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`nlm-star ${i <= starCount ? 'filled' : 'empty'}`}>
                {i <= starCount && <div className="star-overlay" />}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1.33L10.06 5.51L14.67 6.18L11.33 9.43L12.12 14.01L8 11.85L3.88 14.01L4.67 9.43L1.33 6.18L5.94 5.51L8 1.33Z"
                    fill={i <= starCount ? '#F5A623' : 'none'}
                    stroke={i <= starCount ? '#F5A623' : '#CBD5E1'}
                    strokeWidth={i <= starCount ? '0.5' : '1'}
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>

          {/* Rating Tags */}
          <div className="nlm-rating-tags">
            {ratingTags.map((tag) => (
              <span key={tag} className="nlm-rating-tag">{tag}</span>
            ))}
          </div>

          {/* Score Bars */}
          <div className="nlm-score-bars">
            <div className="nlm-score-row">
              <span className="nlm-score-label">Noise</span>
              <div className="nlm-score-bar">
                <div className="nlm-score-bar-fill" style={{ width: `${(noiseScore / 5) * 100}%` }} />
              </div>
              <span className="nlm-score-value">{noiseScore.toFixed(1)}</span>
            </div>
            <div className="nlm-score-row">
              <span className="nlm-score-label">Lighting</span>
              <div className="nlm-score-bar">
                <div className="nlm-score-bar-fill" style={{ width: `${(lightingScore / 5) * 100}%` }} />
              </div>
              <span className="nlm-score-value">{lightingScore.toFixed(1)}</span>
            </div>
            <div className="nlm-score-row">
              <span className="nlm-score-label">Crowds</span>
              <div className="nlm-score-bar">
                <div className="nlm-score-bar-fill" style={{ width: `${(crowdScore / 5) * 100}%` }} />
              </div>
              <span className="nlm-score-value">{crowdScore.toFixed(1)}</span>
            </div>
            <div className="nlm-score-row">
              <span className="nlm-score-label">Comfort</span>
              <div className="nlm-score-bar">
                <div className="nlm-score-bar-fill" style={{ width: `${(comfortScore / 5) * 100}%` }} />
              </div>
              <span className="nlm-score-value">{comfortScore.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Sign In Card */}
        <div className="nlm-signin-card">
          <div className="nlm-signin-header">
            <div className="nlm-signin-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5 12.5C17.5 13.163 17.2366 13.7989 16.7678 14.2678C16.2989 14.7366 15.663 15 15 15H6.66667L2.5 17.5V5C2.5 4.33696 2.76339 3.70107 3.23223 3.23223C3.70107 2.76339 4.33696 2.5 5 2.5H15C15.663 2.5 16.2989 2.76339 16.7678 3.23223C17.2366 3.70107 17.5 4.33696 17.5 5V12.5Z" stroke="#4b8bff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="nlm-signin-text">
              <h3>Sign in to view comments</h3>
              <p>Read community notes, sensory tips, and recent experiences for this place.</p>
            </div>
          </div>

          <div className="nlm-signin-benefits">
            <div className="nlm-benefit-item">
              <span className="nlm-benefit-dot" />
              See detailed sensory comments
            </div>
            <div className="nlm-benefit-item">
              <span className="nlm-benefit-dot" />
              Save trusted places and routines
            </div>
            <div className="nlm-benefit-item">
              <span className="nlm-benefit-dot" />
              Compare your profile to each location
            </div>
          </div>

          <button className="nlm-signin-btn" onClick={handleSignIn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.25 2.25H14.25C14.6478 2.25 15.0294 2.40804 15.3107 2.68934C15.592 2.97064 15.75 3.35218 15.75 3.75V14.25C15.75 14.6478 15.592 15.0294 15.3107 15.3107C15.0294 15.592 14.6478 15.75 14.25 15.75H11.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.5 12.75L11.25 9L7.5 5.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.25 9H2.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign in
          </button>

          <p className="nlm-signin-note">
            Comments stay organized and easy to scan so you can decide quickly without overload.
          </p>
        </div>
      </aside>

      {/* Top Center: Heatmap Toggle */}
      <div className="nlm-heatmap-toggle">
        <div className="nlm-heatmap-info">
          <h4>Sensory heatmap</h4>
          <p>Show calm, moderate, and overwhel…</p>
        </div>
        <div className="nlm-toggle-group">
          <button
            className={`nlm-toggle-switch ${heatmapOn ? 'on' : 'off'}`}
            onClick={() => setHeatmapOn(!heatmapOn)}
            aria-label="Toggle heatmap"
          >
            <div className="nlm-toggle-knob" />
          </button>
          <span className={`nlm-toggle-label ${heatmapOn ? '' : 'off'}`}>
            {heatmapOn ? 'On' : 'Off'}
          </span>
        </div>
      </div>

      {/* Bottom: Search Bar */}
      <div className="nlm-bottom-search">
        <form className="nlm-search-row" onSubmit={handleSearch}>
          <div className="nlm-search-input">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="Search places or sensory needs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={searchLoading}
            />
          </div>
          <button type="submit" className="nlm-search-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8H14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.66667 3.33L14 8L8.66667 12.67" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Explore nearby
          </button>
        </form>

        {searchNoResults && (
          <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', margin: '4px 0 0' }}>
            No results found for "{searchQuery}"
          </p>
        )}

        <div className="nlm-category-chips">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.title}
              className="nlm-cat-chip"
              onClick={() => handleCategoryClick(chip.filter)}
            >
              <div className="nlm-cat-chip-icon">
                <span style={{ fontSize: 16 }}>{chip.emoji}</span>
              </div>
              <div className="nlm-cat-chip-text">
                <h5>{chip.title}</h5>
                <p>{chip.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NonLoginMapView;
