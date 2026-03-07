import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
    { position: [-80.52, 43.46], noise_score: 2, lighting_score: 5, crowd_score: 3, comfort_score: 8.5, name: 'Quiet Library Cafe', ai_summary: 'Calm environment, good lighting.' },
    { position: [-80.525, 43.465], noise_score: 8, lighting_score: 8, crowd_score: 7, comfort_score: 3.0, name: 'Downtown Food Court', ai_summary: 'Very loud, bright lights, crowded.' },
    { position: [-80.515, 43.455], noise_score: 1, lighting_score: 4, crowd_score: 2, comfort_score: 9.2, name: 'Riverside Park', ai_summary: 'Peaceful with natural lighting.' },
    { position: [-80.53, 43.47], noise_score: 9, lighting_score: 9, crowd_score: 8, comfort_score: 2.1, name: 'Nightclub District Cafe', ai_summary: 'Extremely loud with flashing lights.' },
    { position: [-80.51, 43.45], noise_score: 3, lighting_score: 6, crowd_score: 4, comfort_score: 7.8, name: 'Maple Study Lounge', ai_summary: 'Quiet study space, moderate lighting.' },
    { position: [-80.535, 43.458], noise_score: 7, lighting_score: 7, crowd_score: 9, comfort_score: 2.8, name: 'Mall Atrium', ai_summary: 'Echoy, large crowds, bright lights.' },
    { position: [-80.508, 43.462], noise_score: 1, lighting_score: 3, crowd_score: 1, comfort_score: 9.5, name: 'Botanical Garden', ai_summary: 'Very quiet, natural dim lighting.' },
    { position: [-80.527, 43.448], noise_score: 6, lighting_score: 5, crowd_score: 6, comfort_score: 5.1, name: 'Bus Terminal', ai_summary: 'Moderate noise from buses, average crowds.' },
    { position: [-80.518, 43.472], noise_score: 2, lighting_score: 4, crowd_score: 2, comfort_score: 8.9, name: 'Small Bookstore', ai_summary: 'Cozy and quiet, soft lighting.' },
    { position: [-80.505, 43.44], noise_score: 5, lighting_score: 6, crowd_score: 5, comfort_score: 6.2, name: 'Community Center', ai_summary: 'Varies by time, generally moderate.' },
];

// Convert GeoJSON features to flat array for deck.gl
// Backend returns camelCase keys; remap to snake_case used by frontend components
function parseGeoJSON(geojson) {
    if (!geojson?.features) return [];
    return geojson.features.map((f) => {
        const p = f.properties;
        return {
            position: f.geometry.coordinates,
            id: p.id,
            name: p.name,
            category: p.category,
            noise_score: p.noiseScore,
            lighting_score: p.lightingScore,
            crowd_score: p.crowdScore,
            comfort_score: p.comfortScore,
            review_count: p.reviewCount,
        };
    });
}

function MapView({ onLocationSelect, filter, searchQuery }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const deckRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [locationData, setLocationData] = useState([]);
    const [loading, setLoading] = useState(true);

    const filteredData = useMemo(() => {
        let data = locationData;
        if (filter) {
            const f = filter.toLowerCase();
            data = data.filter((d) => {
                const name = (d.name || '').toLowerCase();
                const cat = (d.category || '').toLowerCase();
                if (f === 'quiet' || f === 'library') return d.noise_score <= 3 || cat.includes('library');
                if (f === 'soft-lighting' || f === 'cafe') return d.lighting_score <= 4 || cat.includes('cafe');
                if (f === 'low-crowds' || f === 'retail') return d.crowd_score <= 3 || cat.includes('retail');
                if (f === 'outdoor' || f === 'park') return cat.includes('park') || cat.includes('outdoor') || name.includes('park');
                if (f === 'museum') return cat.includes('museum') || name.includes('museum');
                return true;
            });
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            data = data.filter((d) =>
                (d.name || '').toLowerCase().includes(q) ||
                (d.category || '').toLowerCase().includes(q)
            );
        }
        return data.length > 0 ? data : locationData;
    }, [locationData, filter, searchQuery]);

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
                    data: filteredData,
                    getPosition: (d) => d.position,
                    getWeight: (d) => d.comfort_score || 5,
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
                    data: filteredData,
                    getPosition: (d) => d.position,
                    getElevationWeight: (d) => d.crowd_score || 5,
                    getColorWeight: (d) => d.crowd_score || 5,
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
                    data: filteredData,
                    getPosition: (d) => d.position,
                    getRadius: (d) => (d.noise_score + d.lighting_score) * 15,
                    getFillColor: (d) => {
                        // Blend: noise = red channel, lighting = blue channel
                        const n = (d.noise_score || 5) / 10;
                        const l = (d.lighting_score || 5) / 10;
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
                    data: filteredData,
                    getPosition: (d) => d.position,
                    getRadius: 40,
                    getFillColor: (d) => {
                        const score = (d.comfort_score || 5) / 10;
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
    }, [filteredData, layers, onLocationSelect]);

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
                   Comfort: ${object.comfort_score ?? '–'}/10<br/>
                   Noise: ${object.noise_score ?? '–'}/10<br/>
                   Lighting: ${object.lighting_score ?? '–'}/10<br/>
                   Crowds: ${object.crowd_score ?? '–'}/10`,
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
                    {filteredData.length} of {locationData.length} locations
                    {filter && <span> ({filter})</span>}
                </div>
            </div>
        </>
    );
}

export default MapView;
