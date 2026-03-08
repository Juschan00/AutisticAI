import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { getLocations } from '../services/api';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const INITIAL_VIEW = {
    longitude: -80.52,
    latitude: 43.46,
    zoom: 13,
    pitch: 40,
    bearing: -10,
};

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

function getComfortColor(score) {
    const s = Math.max(0, Math.min(5, score || 2.5));
    const t = s / 5;
    const r = Math.round(220 * (1 - t) + 34 * t);
    const g = Math.round(60 * (1 - t) + 197 * t);
    const b = Math.round(80 * (1 - t) + 94 * t);
    return [r, g, b, 220];
}

function MapView({ onLocationSelect, filter, searchResultsGeoJSON, heatmapEnabled, flyToLocation }) {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const overlayRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [locationData, setLocationData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [layers, setLayers] = useState({
        heatmap: true,
        pins: true,
    });

    useEffect(() => {
        if (heatmapEnabled !== undefined) {
            setLayers((prev) => ({ ...prev, heatmap: heatmapEnabled }));
        }
    }, [heatmapEnabled]);

    const baseData = useMemo(() => {
        if (searchResultsGeoJSON != null) {
            const parsed = parseGeoJSON(searchResultsGeoJSON);
            return parsed;
        }
        return locationData;
    }, [locationData, searchResultsGeoJSON]);

    const filteredData = useMemo(() => {
        let data = baseData;
        if (filter) {
            const f = filter.toLowerCase();
            data = data.filter((d) => {
                const cat = (d.category || '').toLowerCase();
                const name = (d.name || '').toLowerCase();
                if (f === 'quiet' || f === 'quiet-now') return d.noise_score < 2;
                if (f === 'before-noon') return d.noise_score < 2.5;
                if (f === 'low-crowds') return d.crowd_score < 2;
                if (f === 'soft-lighting' || f === 'cafe') return d.lighting_score < 3 || cat.includes('cafe');
                if (f === 'outdoor' || f === 'park') return cat.includes('park') || cat.includes('outdoor') || name.includes('park');
                if (f === 'library') return d.noise_score <= 3 || cat.includes('library');
                if (f === 'museum') return cat.includes('museum') || name.includes('museum');
                return true;
            });
        }
        return data;
    }, [baseData, filter]);

    useEffect(() => {
        setLoading(true);
        getLocations()
            .then((res) => {
                const parsed = parseGeoJSON(res.data);
                setLocationData(parsed);
                setLoading(false);
            })
            .catch(() => {
                setLocationData([]);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (mapRef.current) return;

        try {
            mapboxgl.accessToken = MAPBOX_TOKEN;

            const map = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/light-v11',
                center: [INITIAL_VIEW.longitude, INITIAL_VIEW.latitude],
                zoom: INITIAL_VIEW.zoom,
                pitch: INITIAL_VIEW.pitch,
                bearing: INITIAL_VIEW.bearing,
                antialias: true,
            });

            mapRef.current = map;

            map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            map.addControl(new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
            }));

            const overlay = new MapboxOverlay({
                interleaved: true,
                layers: [],
            });
            map.addControl(overlay);
            overlayRef.current = overlay;

            map.on('load', () => setMapLoaded(true));
            map.on('error', (e) => {
                console.error('[MapView] Mapbox error:', e);
                setError('Map failed to load. Check your Mapbox token.');
            });

        } catch (err) {
            setError(err.message);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!mapRef.current || !flyToLocation) return;
        const { longitude, latitude, zoom } = flyToLocation;
        if (longitude == null || latitude == null) return;
        mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: zoom ?? 16,
            pitch: 45,
            duration: 1800,
            essential: true,
        });
    }, [flyToLocation]);

    const buildLayers = useCallback(() => {
        const active = [];

        if (layers.heatmap) {
            active.push(
                new HeatmapLayer({
                    id: 'comfort-heatmap',
                    data: filteredData,
                    getPosition: (d) => d.position,
                    getWeight: (d) => d.comfort_score || 2.5,
                    radiusPixels: 80,
                    intensity: 1.2,
                    threshold: 0.03,
                    colorRange: [
                        [255, 77, 77, 120],
                        [255, 165, 0, 140],
                        [255, 230, 77, 140],
                        [144, 238, 144, 160],
                        [34, 197, 94, 180],
                        [16, 150, 72, 200],
                    ],
                    pickable: false,
                })
            );
        }

        if (layers.pins) {
            active.push(
                new ScatterplotLayer({
                    id: 'location-pins',
                    data: filteredData,
                    getPosition: (d) => d.position,
                    getRadius: 60,
                    getFillColor: (d) => getComfortColor(d.comfort_score),
                    radiusMinPixels: 8,
                    radiusMaxPixels: 22,
                    stroked: true,
                    getLineColor: [255, 255, 255, 255],
                    lineWidthMinPixels: 2,
                    pickable: true,
                    autoHighlight: true,
                    highlightColor: [75, 139, 255, 200],
                    onClick: (info) => {
                        if (info.object && onLocationSelect) {
                            onLocationSelect(info.object);
                        }
                    },
                })
            );
        }

        return active;
    }, [filteredData, layers, onLocationSelect]);

    useEffect(() => {
        if (!mapLoaded || !overlayRef.current) return;
        overlayRef.current.setProps({ layers: buildLayers() });
    }, [mapLoaded, buildLayers]);

    const toggleLayer = (key) => {
        setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#ef4444', padding: 40 }}>
                <div>
                    <h2 style={{ margin: 0 }}>Map Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                ref={mapContainer}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />

            <div style={{
                position: 'absolute',
                top: 16,
                right: 60,
                zIndex: 10,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 13,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
                pointerEvents: 'auto',
            }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: '#0f1720' }}>Layers</div>
                {loading && <div style={{ color: '#94a3b8', marginBottom: 4 }}>Loading...</div>}
                {[
                    { key: 'heatmap', label: 'Comfort Heatmap' },
                    { key: 'pins', label: 'Location Pins' },
                ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4, color: '#374151' }}>
                        <input
                            type="checkbox"
                            checked={layers[key]}
                            onChange={() => toggleLayer(key)}
                            style={{ accentColor: '#4b8bff' }}
                        />
                        {label}
                    </label>
                ))}
                <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 11 }}>
                    {filteredData.length} locations
                    {filter && <span> · {filter}</span>}
                </div>
            </div>
        </>
    );
}

export default MapView;
