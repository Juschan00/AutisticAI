import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import MapView from './components/MapView';
import AuthButton from './components/AuthButton';
import LocationDetail from './components/LocationDetail';
import SubmitReview from './components/SubmitReview';
import Rankings from './components/Rankings';
import { setAuthToken } from './services/api';

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  // Wire Auth0 token into API calls
  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently()
        .then((token) => {
          console.log('[App] Auth token acquired');
          setAuthToken(token);
        })
        .catch((err) => {
          console.warn('[App] Failed to get access token:', err.message);
        });
    } else {
      setAuthToken(null);
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleLocationSelect = (location) => {
    console.log('[App] Location selected:', location.name);
    setSelectedLocation(location);
    setShowReviewForm(false);
  };

  const handleOpenReview = () => {
    setShowReviewForm(true);
  };

  const handleCloseDetail = () => {
    setSelectedLocation(null);
    setShowReviewForm(false);
  };

  return (
    <div id="app-root" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapView onLocationSelect={handleLocationSelect} />

      {/* Top-left: Auth + Nav buttons */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        background: 'rgba(0,0,0,0.75)',
        padding: '8px 16px',
        borderRadius: 8,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <AuthButton />
        <button
          onClick={() => setShowRankings(true)}
          style={{ cursor: 'pointer', padding: '4px 10px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4 }}
        >
          📊 Rankings
        </button>
      </div>

      {/* Location Detail Panel (right side) */}
      {selectedLocation && !showReviewForm && (
        <div>
          <LocationDetail
            location={selectedLocation}
            onClose={handleCloseDetail}
          />
          {/* Add Review button at bottom of detail panel */}
          <button
            onClick={handleOpenReview}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              zIndex: 25,
              padding: '10px 20px',
              cursor: 'pointer',
              background: '#4488ff',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
            }}
          >
            ✏️ Write Review
          </button>
        </div>
      )}

      {/* Submit Review Panel */}
      {showReviewForm && (
        <SubmitReview
          location={selectedLocation}
          onClose={() => setShowReviewForm(false)}
          onSubmitted={() => {
            console.log('[App] Review submitted, closing form.');
            setShowReviewForm(false);
          }}
        />
      )}

      {/* Rankings Overlay */}
      {showRankings && (
        <Rankings onClose={() => setShowRankings(false)} />
      )}
    </div>
  );
}

export default App;
