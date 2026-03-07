import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Deck } from '@deck.gl/core';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { getLocations } from '../services/api';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Default viewport: Waterloo, Ontario, Canada
const INITIAL_VIEW = {
    longitude: -80.52,
    latitude: 43.46,
    zoom: 13,
    pitch: 45,
    bearing: 0,
};

// Fallback dummy data (used when backend is not running)
const FALLBACK_DATA = [
    { position: [-80.52, 43.46], noiseScore: 2, lightingScore: 5, crowdScore: 3, comfortScore: 8.5, name: 'Quiet Library Cafe' },
    { position: [-80.525, 43.465], noiseScore: 8, lightingScore: 8, crowdScore: 7, comfortScore: 3.0, name: 'Downtown Food Court' },
    { position: [-80.515, 43.455], noiseScore: 1, lightingScore: 4, crowdScore: 2, comfortScore: 9.2, name: 'Riverside Park' },
    { position: [-80.53, 43.47], noiseScore: 9, lightingScore: 9, crowdScore: 8, comfortScore: 2.1, name: 'Nightclub District Cafe' },
    { position: [-80.51, 43.45], noiseScore: 3, lightingScore: 6, crowdScore: 4, comfortScore: 7.8, name: 'Maple Study Lounge' },
    { position: [-80.535, 43.458], noiseScore: 7, lightingScore: 7, crowdScore: 9, comfortScore: 2.8, name: 'Mall Atrium' },
    { position: [-80.508, 43.462], noiseScore: 1, lightingScore: 3, crowdScore: 1, comfortScore: 9.5, name: 'Botanical Garden' },
    { position: [-80.527, 43.448], noiseScore: 6, lightingScore: 5, crowdScore: 6, comfortScore: 5.1, name: 'Bus Terminal' },
    { position: [-80.518, 43.472], noiseScore: 2, lightingScore: 4, crowdScore: 2, comfortScore: 8.9, name: 'Small Bookstore' },
    { position: [-80.505, 43.44], noiseScore: 5, lightingScore: 6, crowdScore: 5, comfortScore: 6.2, name: 'Community Center' },
];

// Convert GeoJSON features to flat array for deck.gl
function parseGeoJSON(geojson) {
    if (!geojson?.features) return [];
    return geojson.features.map((f) => ({
        position: f.geometry.coordinates,
        ...f.properties,
    }));
}

function MapView({ onLocationSelect }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const deckRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [locationData, setLocationData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Layer visibility toggles
    const [layers, setLayers] = useState({
        heatmap: true,
        hexagon: false,
        scatterplot: true,
        icons: true,
    });

    // Fetch location data from API (falls back to dummy data)
    useEffect(() => {
        console.log('[MapView] Fetching location data...');
        setLoading(true);

        getLocations()
            .then((res) => {
                const parsed = parseGeoJSON(res.data);
                console.log('[MapView] API data loaded:', parsed.length, 'locations');
                setLocationData(parsed);
                setLoading(false);
            })
            .catch((err) => {
                console.warn('[MapView] API unavailable, using fallback data:', err.message);
                setLocationData(FALLBACK_DATA);
                setLoading(false);
            });
    }, []);

    // Initialize Mapbox
    useEffect(() => {
        if (mapRef.current) return;

        console.log('[MapView] Initializing Mapbox...');

        try {
            mapboxgl.accessToken = MAPBOX_TOKEN;

            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/dark-v11',
                center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
                zoom: INITIAL_VIEW.zoom,
                pitch: INITIAL_VIEW.pitch,
                bearing: INITIAL_VIEW.bearing,
                antialias: true,
            });

            mapRef.current = map;

            map.on('load', () => {
                console.log('[MapView] Mapbox loaded successfully.');
                setMapLoaded(true);
            });

            map.on('error', (e) => {
                console.error('[MapView] Mapbox error:', e);
                setError('Mapbox failed to load. Check your token.');
            });

            map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        } catch (err) {
            console.error('[MapView] Init error:', err);
            setError(err.message);
        }

        return () => {
            if (deckRef.current) {
                deckRef.current.finalize();
                deckRef.current = null;
            }
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Build deck.gl layers based on toggle state
    const buildLayers = useCallback(() => {
        const activeLayers = [];

        // Layer 1: Sensory Comfort Heatmap
        if (layers.heatmap) {
            activeLayers.push(
                new HeatmapLayer({
                    id: 'comfort-heatmap',
                    data: locationData,
                    getPosition: (d) => d.position,
                    getWeight: (d) => d.comfortScore || 5,
                    radiusPixels: 60,
                    intensity: 1,
                    threshold: 0.05,
                    colorRange: [
                        [255, 0, 0],      // low comfort = red
                        [255, 128, 0],
                        [255, 255, 0],
                        [128, 255, 0],
                        [0, 255, 0],      // high comfort = green
                        [0, 255, 128],
                    ],
                    pickable: false,
                })
            );
        }

        // Layer 2: Crowd Density Hexagons
        if (layers.hexagon) {
            activeLayers.push(
                new HexagonLayer({
                    id: 'crowd-hexagon',
                    data: locationData,
                    getPosition: (d) => d.position,
                    getElevationWeight: (d) => d.crowdScore || 5,
                    getColorWeight: (d) => d.crowdScore || 5,
                    elevationScale: 50,
                    radius: 200,
                    extruded: true,
                    elevationRange: [0, 300],
                    colorRange: [
                        [1, 152, 189],
                        [73, 227, 206],
                        [216, 254, 181],
                        [254, 237, 177],
                        [254, 173, 84],
                        [209, 55, 78],
                    ],
                    pickable: true,
                })
            );
        }

        // Layer 3: Noise/Lighting Scatterplot
        if (layers.scatterplot) {
            activeLayers.push(
                new ScatterplotLayer({
                    id: 'noise-lighting-scatter',
                    data: locationData,
                    getPosition: (d) => d.position,
                    getRadius: (d) => (d.noiseScore + d.lightingScore) * 15,
                    getFillColor: (d) => {
                        // Blend: noise = red channel, lighting = blue channel
                        const n = (d.noiseScore || 5) / 10;
                        const l = (d.lightingScore || 5) / 10;
                        return [255 * n, 100, 255 * l, 160];
                    },
                    radiusMinPixels: 6,
                    radiusMaxPixels: 35,
                    pickable: true,
                    onClick: (info) => {
                        if (info.object) {
                            console.log('[MapView] Scatterplot click:', info.object);
                            if (onLocationSelect) onLocationSelect(info.object);
                        }
                    },
                })
            );
        }

        // Layer 4: Location Pins (Icons)
        if (layers.icons) {
            activeLayers.push(
                new ScatterplotLayer({
                    id: 'location-pins',
                    data: locationData,
                    getPosition: (d) => d.position,
                    getRadius: 40,
                    getFillColor: (d) => {
                        const score = (d.comfortScore || 5) / 10;
                        return [255 * (1 - score), 255 * score, 80, 220];
                    },
                    radiusMinPixels: 10,
                    radiusMaxPixels: 18,
                    stroked: true,
                    getLineColor: [255, 255, 255],
                    lineWidthMinPixels: 2,
                    pickable: true,
                    onClick: (info) => {
                        if (info.object) {
                            console.log('[MapView] Pin click:', info.object);
                            if (onLocationSelect) onLocationSelect(info.object);
                        }
                    },
                })
            );
        }

        return activeLayers;
    }, [locationData, layers, onLocationSelect]);

    // Initialize / update deck.gl
    useEffect(() => {
        if (!mapLoaded || !mapRef.current) return;

        const deckLayers = buildLayers();

        if (!deckRef.current) {
            console.log('[MapView] Initializing deck.gl with', deckLayers.length, 'layers');
            const deck = new Deck({
                parent: mapContainer.current,
                style: { position: 'absolute', top: 0, left: 0 },
                initialViewState: INITIAL_VIEW,
                controller: true,
                onViewStateChange: ({ viewState }) => {
                    mapRef.current.jumpTo({
                        center: [viewState.longitude, viewState.latitude],
                        zoom: viewState.zoom,
                        bearing: viewState.bearing,
                        pitch: viewState.pitch,
                    });
                },
                layers: deckLayers,
                getTooltip: ({ object }) =>
                    object && {
                        html: `<b>${object.name || 'Zone'}</b><br/>
                   Comfort: ${object.comfortScore ?? '–'}/10<br/>
                   Noise: ${object.noiseScore ?? '–'}/10<br/>
                   Lighting: ${object.lightingScore ?? '–'}/10<br/>
                   Crowds: ${object.crowdScore ?? '–'}/10`,
                        style: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            color: '#fff',
                            fontSize: '12px',
                            padding: '8px',
                            borderRadius: '4px',
                        },
                    },
            });
            deckRef.current = deck;
        } else {
            console.log('[MapView] Updating deck.gl layers:', deckLayers.length);
            deckRef.current.setProps({ layers: deckLayers });
        }
    }, [mapLoaded, buildLayers]);

    const toggleLayer = (layerName) => {
        setLayers((prev) => {
            const next = { ...prev, [layerName]: !prev[layerName] };
            console.log('[MapView] Layer toggled:', layerName, '→', next[layerName]);
            return next;
        });
    };

    if (error) {
        return (
            <div style={{ padding: 40, color: 'red' }}>
                <h2>Map Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <>
            <div
                ref={mapContainer}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />

            {/* Layer toggle panel */}
            <div style={{
                position: 'absolute',
                top: 16,
                right: 60,
                zIndex: 10,
                background: 'rgba(0,0,0,0.75)',
                padding: '12px 16px',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Layers</div>
                {loading && <div style={{ color: '#aaa', marginBottom: 4 }}>Loading data...</div>}
                {[
                    { key: 'heatmap', label: 'Comfort Heatmap' },
                    { key: 'hexagon', label: 'Crowd Density' },
                    { key: 'scatterplot', label: 'Noise / Lighting' },
                    { key: 'icons', label: 'Location Pins' },
                ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'block', cursor: 'pointer', marginBottom: 4 }}>
                        <input
                            type="checkbox"
                            checked={layers[key]}
                            onChange={() => toggleLayer(key)}
                            style={{ marginRight: 6 }}
                        />
                        {label}
                    </label>
                ))}
                <div style={{ marginTop: 8, color: '#888', fontSize: 11 }}>
                    {locationData.length} locations loaded
                </div>
            </div>
        </>
    );
}

export default MapView;
