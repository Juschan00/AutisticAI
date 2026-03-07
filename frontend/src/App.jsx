import { useState } from 'react';
import LaunchScreen from './components/LaunchScreen';
import MapView from './components/MapView';
import AuthButton from './components/AuthButton';
import LocationDetail from './components/LocationDetail';
import SubmitReview from './components/SubmitReview';
import Rankings from './components/Rankings';

function App() {
  const [showMap, setShowMap] = useState(false);
  const [mapContext, setMapContext] = useState({ filter: null, searchQuery: '' });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showRankings, setShowRankings] = useState(false);

  const handleExploreMap = ({ filter = null, searchQuery = '' } = {}) => {
    console.log('[App] Navigating to map:', { filter, searchQuery });
    setMapContext({ filter, searchQuery });
    setShowMap(true);
  };

  const handleBackToHome = () => {
    setShowMap(false);
    setMapContext({ filter: null, searchQuery: '' });
    setSelectedLocation(null);
    setShowReviewForm(false);
    setShowRankings(false);
  };

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

  if (!showMap) {
    return <LaunchScreen onExploreMap={handleExploreMap} />;
  }

  return (
    <div id="app-root" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapView onLocationSelect={handleLocationSelect} filter={mapContext.filter} searchQuery={mapContext.searchQuery} />

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
          Rankings
        </button>
        <button
          onClick={handleBackToHome}
          style={{ cursor: 'pointer', padding: '4px 10px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: 4 }}
        >
          Home
        </button>
      </div>

      {/* Location Detail Panel (right side) */}
      {selectedLocation && !showReviewForm && (
        <div>
          <LocationDetail
            location={selectedLocation}
            onClose={handleCloseDetail}
          />
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
            Write Review
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
