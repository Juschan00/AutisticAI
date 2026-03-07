import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import MapView from './MapView';
import Dashboard from './Dashboard';
import LogoutConfirmation from './LogoutConfirmation';
import { getRankings } from '../services/api';
import './LoggedInMapView.css';

const NAV_ITEMS = [
  { id: 'explore', label: 'Explore map', icon: 'map' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'saved', label: 'Saved places', icon: 'bookmark' },
  { id: 'profile', label: 'Sensory profile', icon: 'sliders' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const FALLBACK_NEARBY = [
  { name: 'Lumina Library', score: 8.4, distance: '2 min away', tags: 'Quiet now • before 11am', desc: 'Soft daylight, open seating, and lower foot traffic this morning.', tier: 'high', featured: true },
  { name: 'Fern Courtyard Café', score: 8.1, distance: '4 min away', tags: 'Soft daylight • low crowds', desc: 'Gentle background sound and a calmer corner near the windows.', tier: 'high', featured: false },
  { name: 'Moss Hall Workspace', score: 7.0, distance: '6 min away', tags: 'Steadier foot traffic', desc: 'Moderate activity, with quieter booths usually available near the…', tier: 'medium', featured: false },
];

function NavIcon({ type, active }) {
  const color = active ? '#0849d6' : '#0b1720';
  const icons = {
    map: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 4.5L6.5 1.5L11.5 4.5L16.5 1.5V13.5L11.5 16.5L6.5 13.5L1.5 16.5V4.5Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6.5 1.5V13.5" stroke={color} strokeWidth="1.5"/><path d="M11.5 4.5V16.5" stroke={color} strokeWidth="1.5"/></svg>,
    grid: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2.25" y="2.25" width="5.25" height="5.25" rx="1" stroke={color} strokeWidth="1.5"/><rect x="10.5" y="2.25" width="5.25" height="5.25" rx="1" stroke={color} strokeWidth="1.5"/><rect x="2.25" y="10.5" width="5.25" height="5.25" rx="1" stroke={color} strokeWidth="1.5"/><rect x="10.5" y="10.5" width="5.25" height="5.25" rx="1" stroke={color} strokeWidth="1.5"/></svg>,
    bookmark: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14.25 15.75L9 12L3.75 15.75V3.75C3.75 3.35218 3.90804 2.97064 4.18934 2.68934C4.47064 2.40804 4.85218 2.25 5.25 2.25H12.75C13.1478 2.25 13.5294 2.40804 13.8107 2.68934C14.092 2.97064 14.25 3.35218 14.25 3.75V15.75Z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    sliders: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="3" y1="6" x2="15" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="12" x2="15" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><circle cx="6.75" cy="6" r="1.5" fill="white" stroke={color} strokeWidth="1.5"/><circle cx="11.25" cy="12" r="1.5" fill="white" stroke={color} strokeWidth="1.5"/></svg>,
    settings: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="2.25" stroke={color} strokeWidth="1.5"/><path d="M14.55 11.25a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-1.42 3.42 2 2 0 01-1.41-.59l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V16.5a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-3.42-1.42 2 2 0 01.59-1.41l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H1.5a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82L2.71 2.71a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H7.5a1.65 1.65 0 001-1.51V1.5a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.08a1.65 1.65 0 001.51 1h.17a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  };
  return icons[type] || null;
}

function LoggedInMapView({ onBackToHome }) {
  const { user } = useAuth0();
  const [activeNav, setActiveNav] = useState('explore');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nearbyPlaces, setNearbyPlaces] = useState(FALLBACK_NEARBY);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    getRankings()
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setNearbyPlaces(
            data.slice(0, 3).map((loc, i) => ({
              name: loc.name,
              score: loc.comfortScore ?? loc.comfort_score ?? 0,
              distance: `${(i + 1) * 2} min away`,
              tags: loc.category || 'Sensory-friendly',
              desc: loc.aiSummary || 'A sensory-friendly place nearby.',
              tier: (loc.comfortScore ?? loc.comfort_score ?? 0) >= 8 ? 'high' : 'medium',
              featured: i === 0,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const locName = selectedLocation?.name || 'Lumina Library';
  const comfortScore = selectedLocation?.comfort_score?.toFixed(1) || '8.4';
  const noiseLevel = selectedLocation ? (selectedLocation.noise_score <= 3 ? 'Low' : selectedLocation.noise_score <= 6 ? 'Med' : 'High') : 'Low';

  return (
    <div className="lmv">
      {/* ── Left Nav ── */}
      <nav className="lmv-nav">
        <div className="lmv-nav-logo">
          <div className="lmv-nav-logo-icon">
            <img src="/assets/icons/logo.svg" alt="SensorySafe" />
          </div>
          <div className="lmv-nav-logo-text">
            <h1>SensorySafe Map</h1>
            <p>Personal comfort dashboa…</p>
          </div>
        </div>

        <div className="lmv-nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`lmv-nav-link${activeNav === item.id ? ' active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              <NavIcon type={item.icon} active={activeNav === item.id} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="lmv-nav-spacer" />

        <div className="lmv-nav-user" onClick={() => setShowLogoutModal(true)} style={{ cursor: 'pointer' }}>
          <div className="lmv-nav-avatar">
            {user?.picture ? (
              <img src={user.picture} alt="" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4b8bff, #6ad6c8)' }} />
            )}
          </div>
          <div className="lmv-nav-user-info">
            <h4>{user?.name?.substring(0, 14) || 'User'}…</h4>
            <p>Noise-sensitiv…</p>
          </div>
          <div className="lmv-nav-user-chevron">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </nav>

      {activeNav === 'dashboard' ? (
        <Dashboard />
      ) : (
        <>
          {/* ── Center Main ── */}
          <main className="lmv-main">
            {/* Comfort Snapshot */}
            <div className="lmv-snapshot">
              <div className="lmv-snapshot-header">
                <div className="lmv-snapshot-title">
                  <span>Today</span>
                  <h2>Comfort snapshot</h2>
                </div>
                <span className="lmv-calm-badge">Calm now</span>
              </div>

              <div className="lmv-snapshot-stats">
                <div className="lmv-snapshot-big">
                  <span className="big-number">12</span>
                  <span className="big-label">calm places nearby</span>
                </div>
                <div className="lmv-snapshot-divider" />
                <div className="lmv-snapshot-cards">
                  <div className="lmv-stat-card">
                    <div className="stat-label">Best window</div>
                    <div className="stat-value">Now</div>
                  </div>
                  <div className="lmv-stat-card">
                    <div className="stat-label">Noise trend</div>
                    <div className="stat-value">Low</div>
                  </div>
                </div>
              </div>

              <div className="lmv-snapshot-tags">
                <span className="lmv-tag green">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.25 7A5.25 5.25 0 111.75 7a5.25 5.25 0 0110.5 0z" stroke="#05360d" strokeWidth="1.2"/><path d="M4.5 7l2 2 3.5-3.5" stroke="#05360d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Low noise nearby
                </span>
                <span className="lmv-tag gray">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.25" stroke="#0f1720" strokeWidth="1.2"/><path d="M7 3.5V7L9.25 8.25" stroke="#0f1720" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Best time right now
                </span>
              </div>
            </div>

            {/* Map */}
            <div className="lmv-map-section">
              <div className="lmv-map-inner">
                <MapView onLocationSelect={handleLocationSelect} filter={null} searchQuery={searchQuery} />
              </div>

              <div className="lmv-map-legend">
                <span className="lmv-legend-chip calm">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.25 7A5.25 5.25 0 111.75 7a5.25 5.25 0 0110.5 0z" stroke="#05360d" strokeWidth="1.2"/><path d="M4.5 7l2 2 3.5-3.5" stroke="#05360d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Calm
                </span>
                <span className="lmv-legend-chip moderate">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.25" stroke="#4a2a00" strokeWidth="1.2"/><circle cx="7" cy="7" r="1.5" fill="#4a2a00"/></svg>
                  Moderate
                </span>
                <span className="lmv-legend-chip overwhelming">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.25" stroke="#4a0f00" strokeWidth="1.2"/><path d="M5 5l4 4M9 5l-4 4" stroke="#4a0f00" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  Overwhelming
                </span>
              </div>

              <div className="lmv-map-time-filter">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#0f1720" strokeWidth="1.3"/><path d="M8 4V8L10.5 9.5" stroke="#0f1720" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Before 11am
              </div>

              <div className="lmv-nearby-overlay">
                <span className="lmv-nearby-label">Top nearby places</span>
                <div className="lmv-nearby-cards">
                  {nearbyPlaces.map((place) => (
                    <div
                      key={place.name}
                      className={`lmv-nearby-card ${place.featured ? 'featured' : 'regular'}`}
                      onClick={() => handleLocationSelect({ name: place.name, comfort_score: place.score, noise_score: 3, lighting_score: 4, crowd_score: 3 })}
                    >
                      <div className="lmv-nearby-card-header">
                        <span className={`lmv-nearby-score ${place.tier}`}>{place.score.toFixed(1)}</span>
                        <span className="lmv-nearby-distance">{place.distance}</span>
                      </div>
                      <div className="lmv-nearby-card-info">
                        <h4>{place.name}</h4>
                        <p className="card-tags">{place.tags}</p>
                        <p className="card-desc">{place.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Search Bar */}
            <div className="lmv-bottom-bar">
              <div className="lmv-search-pill">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="8.25" cy="8.25" r="4.5" stroke="#6b7280" strokeWidth="1.5"/><path d="M15.75 15.75L11.5 11.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input
                  type="text"
                  placeholder="Search places or sensory tags"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="lmv-bottom-actions">
                <button className="lmv-btn-outline">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M8.67 3.33L14 8l-5.33 4.67" stroke="#0f1720" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Calm route
                </button>
                <button className="lmv-btn-primary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M4 6l4-4 4 4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Personalize
                </button>
              </div>
            </div>
          </main>

          {/* ── Right Detail Panel ── */}
          <aside className="lmv-detail">
            {/* Location Card */}
            <div className="lmv-detail-card">
              <div className="lmv-loc-photo">
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e8f0fe, #d4e8e6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 13 }}>
                  {locName}
                </div>
              </div>

              <div className="lmv-loc-header">
                <div className="lmv-loc-title">
                  <h2>{locName}</h2>
                  <p>A calm match with clear reasons.</p>
                </div>
                <span className="lmv-match-badge">92% match</span>
              </div>

              <div className="lmv-stat-boxes">
                <div className="lmv-stat-box">
                  <div className="box-label">Comfort</div>
                  <div className="box-value">{comfortScore}</div>
                </div>
                <div className="lmv-stat-box">
                  <div className="box-label">Noise</div>
                  <div className="box-value small">{noiseLevel}</div>
                </div>
                <div className="lmv-stat-box">
                  <div className="box-label">Best time</div>
                  <div className="box-value small">AM</div>
                </div>
              </div>

              <div className="lmv-loc-tags">
                <span className="lmv-loc-tag">Soft daylight</span>
                <span className="lmv-loc-tag">Low crowds</span>
                <span className="lmv-loc-tag">Easy seating</span>
              </div>
            </div>

            {/* Noise through the day */}
            <div className="lmv-detail-card">
              <div>
                <h3 className="lmv-section-title">Noise through the day</h3>
                <p className="lmv-section-desc">Quietest in the morning.</p>
              </div>
              <div className="lmv-noise-chart">
                <svg viewBox="0 0 302 86" fill="none" preserveAspectRatio="none">
                  <path d="M0 60 C40 55, 80 40, 120 35 C160 30, 180 25, 200 30 C220 35, 250 50, 280 55 L302 58" stroke="#6ad6c8" strokeWidth="2" fill="none"/>
                  <path d="M0 60 C40 55, 80 40, 120 35 C160 30, 180 25, 200 30 C220 35, 250 50, 280 55 L302 58 L302 86 L0 86 Z" fill="url(#noiseGrad)" opacity="0.15"/>
                  <path d="M180 20 C210 35, 240 55, 270 62 L302 68" stroke="#ffb3a3" strokeWidth="2" fill="none" strokeDasharray="4 4"/>
                  <defs>
                    <linearGradient id="noiseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6ad6c8" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#6ad6c8" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="lmv-chart-labels">
                <span>Morning</span>
                <span>Afternoon</span>
                <span>Evening</span>
              </div>
            </div>

            {/* AI Insight */}
            <div className="lmv-detail-card">
              <div>
                <h3 className="lmv-section-title">AI insight</h3>
                <p className="lmv-section-desc">Only the most important signals are shown.</p>
              </div>

              <div className="lmv-ai-header">
                <span className="lmv-ai-badge">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.25" stroke="#0f1720" strokeWidth="1.2"/><path d="M5.25 7h3.5M7 5.25v3.5" stroke="#0f1720" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  AI confidence
                </span>
                <span className="lmv-ai-percent">87%</span>
              </div>

              <div className="lmv-ai-bar">
                <div className="lmv-ai-bar-fill" style={{ width: '87%' }} />
              </div>

              <div className="lmv-ai-insights">
                <div className="lmv-ai-item">
                  <div className="lmv-ai-item-icon">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2.5 7.5a5 5 0 0110 0" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/><path d="M5 10.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="#f59e0b" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </div>
                  <div className="lmv-ai-item-text">
                    <h5>Noise</h5>
                    <p>Espresso machines nearby and light traffic outside.</p>
                  </div>
                </div>
                <div className="lmv-ai-item">
                  <div className="lmv-ai-item-icon">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="4" r="2" stroke="#8b5cf6" strokeWidth="1.3"/><path d="M7.5 6v5M5.5 8.5l2 2.5 2-2.5" stroke="#8b5cf6" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="lmv-ai-item-text">
                    <h5>Lighting</h5>
                    <p>Brighter at the back, softer daylight near the front.</p>
                  </div>
                </div>
                <div className="lmv-ai-item">
                  <div className="lmv-ai-item-icon">
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="5" stroke="#6b7280" strokeWidth="1.3"/><path d="M7.5 4v3.5l2.5 1.5" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="lmv-ai-item-text">
                    <h5>Best time</h5>
                    <p>Before 11am is usually the calmest.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sensory Profile */}
            <div className="lmv-detail-card">
              <div>
                <h3 className="lmv-section-title">Sensory profile</h3>
                <p className="lmv-section-desc">A simplified radar view for this location.</p>
              </div>

              <div className="lmv-radar-container">
                <div className="lmv-radar-chart">
                  <svg viewBox="0 0 250 210" fill="none">
                    <polygon points="125,30 195,75 195,155 125,195 55,155 55,75" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                    <polygon points="125,55 175,85 175,140 125,175 75,140 75,85" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                    <polygon points="125,80 155,100 155,130 125,155 95,130 95,100" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
                    <polygon points="125,45 180,85 170,150 125,170 70,145 80,80" fill="rgba(106,214,200,0.2)" stroke="#6ad6c8" strokeWidth="2"/>
                    <text x="125" y="22" textAnchor="middle" fontSize="11" fill="#6b7280">Noise</text>
                    <text x="205" y="78" textAnchor="start" fontSize="11" fill="#6b7280">Lighting</text>
                    <text x="205" y="162" textAnchor="start" fontSize="11" fill="#6b7280">Crowds</text>
                    <text x="125" y="208" textAnchor="middle" fontSize="11" fill="#6b7280">Smells</text>
                    <text x="40" y="162" textAnchor="end" fontSize="11" fill="#6b7280">Space</text>
                    <text x="40" y="78" textAnchor="end" fontSize="11" fill="#6b7280">Comfort</text>
                    <circle cx="125" cy="45" r="3" fill="#6ad6c8"/>
                    <circle cx="180" cy="85" r="3" fill="#6ad6c8"/>
                    <circle cx="170" cy="150" r="3" fill="#6ad6c8"/>
                    <circle cx="125" cy="170" r="3" fill="#6ad6c8"/>
                    <circle cx="70" cy="145" r="3" fill="#6ad6c8"/>
                    <circle cx="80" cy="80" r="3" fill="#6ad6c8"/>
                  </svg>
                </div>

                <div className="lmv-profile-grid">
                  <div className="lmv-profile-stat"><span className="pstat-label">Noise</span><span className="pstat-value">7</span></div>
                  <div className="lmv-profile-stat"><span className="pstat-label">Lighting</span><span className="pstat-value">6</span></div>
                  <div className="lmv-profile-stat"><span className="pstat-label">Crowds</span><span className="pstat-value">5</span></div>
                  <div className="lmv-profile-stat"><span className="pstat-label">Smells</span><span className="pstat-value">4</span></div>
                </div>
                <div className="lmv-profile-grid full-width">
                  <div className="lmv-profile-stat"><span className="pstat-label">Spatial openness</span><span className="pstat-value">3</span></div>
                </div>
              </div>
            </div>

            {/* Comfort Score */}
            <div className="lmv-detail-card">
              <div>
                <h3 className="lmv-section-title">Comfort score</h3>
                <p className="lmv-section-desc">How the score is calculated.</p>
              </div>

              <div className="lmv-comfort-header">
                <div className="lmv-comfort-score">
                  <div className="cscore-label">Sensory Comfort Score</div>
                  <div className="cscore-value">{comfortScore} / 10</div>
                </div>
                <span className="lmv-tag green">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12.25 7A5.25 5.25 0 111.75 7a5.25 5.25 0 0110.5 0z" stroke="#05360d" strokeWidth="1.2"/><path d="M4.5 7l2 2 3.5-3.5" stroke="#05360d" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Noise matters most
                </span>
              </div>

              <div className="lmv-score-bars">
                <div className="lmv-score-row">
                  <span className="sr-label">Noise</span>
                  <div className="sr-bar"><div className="sr-fill blue" style={{ width: '40%' }} /></div>
                  <span className="sr-percent">40%</span>
                </div>
                <div className="lmv-score-row">
                  <span className="sr-label">Lighting</span>
                  <div className="sr-bar"><div className="sr-fill teal" style={{ width: '25%' }} /></div>
                  <span className="sr-percent">25%</span>
                </div>
                <div className="lmv-score-row">
                  <span className="sr-label">Crowds</span>
                  <div className="sr-bar"><div className="sr-fill yellow" style={{ width: '25%' }} /></div>
                  <span className="sr-percent">25%</span>
                </div>
                <div className="lmv-score-row">
                  <span className="sr-label">Triggers</span>
                  <div className="sr-bar"><div className="sr-fill purple" style={{ width: '10%' }} /></div>
                  <span className="sr-percent">10%</span>
                </div>
              </div>
            </div>

            {/* Why it fits you */}
            <div className="lmv-detail-card">
              <div>
                <h3 className="lmv-section-title">Why it fits you</h3>
                <p className="lmv-section-desc">A short recommendation and a soft alert.</p>
              </div>

              <div className="lmv-match-card">
                <div className="lmv-match-card-header">
                  <h4>Match score</h4>
                  <span className="lmv-match-badge">92%</span>
                </div>
                <div className="lmv-match-bar">
                  <div className="lmv-match-bar-fill" style={{ width: '92%' }} />
                </div>
                <div className="lmv-match-checks">
                  <div className="lmv-match-check">
                    <span className="lmv-check-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7l2.5 2.5L10.5 5" stroke="#05360d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    Low noise
                  </div>
                  <div className="lmv-match-check">
                    <span className="lmv-check-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7l2.5 2.5L10.5 5" stroke="#05360d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    Moderate lighting
                  </div>
                  <div className="lmv-match-check">
                    <span className="lmv-check-icon">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 7l2.5 2.5L10.5 5" stroke="#05360d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    Low crowd density
                  </div>
                </div>
              </div>

              <div className="lmv-trigger-card">
                <h4>Possible triggers later today</h4>
                <div className="lmv-trigger-chips">
                  <span className="lmv-trigger-chip">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.75v3.5L9.33 7" stroke="#0f1720" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="7" cy="7" r="5.25" stroke="#0f1720" strokeWidth="1.2"/></svg>
                    Dense crowds
                  </span>
                  <span className="lmv-trigger-chip">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4" r="2" stroke="#0f1720" strokeWidth="1.2"/><path d="M7 6v4" stroke="#0f1720" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Bright lighting
                  </span>
                  <span className="lmv-trigger-chip">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5a5 5 0 0110 0" stroke="#0f1720" strokeWidth="1.2" strokeLinecap="round"/><path d="M5 10c0-1.1.9-2 2-2s2 .9 2 2" stroke="#0f1720" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Loud music nearby
                  </span>
                </div>
                <p className="lmv-trigger-tip">Tip: visit before 10am for the calmest experience.</p>
              </div>
            </div>
          </aside>
        </>
      )}

      {showLogoutModal && (
        <LogoutConfirmation onCancel={() => setShowLogoutModal(false)} />
      )}
    </div>
  );
}

export default LoggedInMapView;
