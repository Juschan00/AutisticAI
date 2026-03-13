import { useState, useMemo } from 'react';
import Map from 'react-map-gl/mapbox';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const INITIAL_VIEW_STATE = {
    longitude: -79.3832,
    latitude: 43.6532,
    zoom: 12,
    pitch: 40,
    bearing: -10,
};

function getComfortColor(score) {
    const s = Math.max(0, Math.min(5, score || 2.5));
    const t = s / 5;
    const r = Math.round(220 * (1 - t) + 34 * t);
    const g = Math.round(60 * (1 - t) + 197 * t);
    const b = Math.round(80 * (1 - t) + 94 * t);
    return [r, g, b, 220];
}

export default function MapView({ onLocationSelect, filter, searchResultsGeoJSON, heatmapEnabled, heatmapData, flyToLocation }) {
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

    const normalizedHeatmap = useMemo(() => {
        if (!heatmapData?.length) return [];
        return heatmapData.map((d) => ({
            position: [d.longitude, d.latitude],
            id: d.locationId,
            name: d.name,
            category: d.category,
            comfort_score: d.comfortScore,
            noise_score: d.noiseScore,
            lighting_score: d.lightingScore,
            crowd_score: d.crowdScore,
            review_count: d.reviewCount,
        }));
    }, [heatmapData]);

    const baseData = useMemo(() => {
        if (searchResultsGeoJSON && searchResultsGeoJSON.features) {
            return searchResultsGeoJSON.features.map(f => ({
                position: f.geometry.coordinates,
                ...f.properties
            }));
        }
        return normalizedHeatmap;
    }, [searchResultsGeoJSON, normalizedHeatmap]);

    const filteredData = useMemo(() => {
        let data = baseData;
        if (filter) {
            const f = filter.toLowerCase();
            data = data.filter((d) => {
                const cat = (d.category || '').toLowerCase();
                if (f === 'quiet-now') return d.noise_score < 2;
                if (f === 'before-noon') return d.noise_score < 2.5;
                if (f === 'low-crowds') return d.crowd_score < 2;
                return true;
            });
        }
        return data;
    }, [baseData, filter]);

    const layers = [
        heatmapEnabled && new HeatmapLayer({
            id: 'comfort-heatmap',
            data: filteredData,
            getPosition: d => d.position,
            getWeight: d => Math.pow((d.comfort_score || 2.5), 2), // Exponential weight for calm places
            intensity: 8,
            radiusPixels: 120,
            threshold: 0.02,
            colorRange: [
                [255, 230, 230], // Very faint red
                [255, 204, 153], // Light orange
                [255, 240, 153], // Light yellow
                [204, 255, 204], // Pale green
                [153, 255, 153], // Soft green
                [102, 255, 178], // Bright mint (very calm)
            ]
        }),
        new ScatterplotLayer({
            id: 'location-pins',
            data: filteredData,
            getPosition: d => d.position,
            getFillColor: d => getComfortColor(d.comfort_score),
            getRadius: 60,
            radiusMinPixels: 8,
            radiusMaxPixels: 22,
            stroked: true,
            getLineColor: [255, 255, 255, 255],
            lineWidthMinPixels: 2,
            pickable: true,
            onClick: info => info.object && onLocationSelect?.(info.object)
        })
    ].filter(Boolean);

    return (
        <DeckGL
            initialViewState={flyToLocation ? { ...viewState, longitude: flyToLocation.longitude, latitude: flyToLocation.latitude, zoom: flyToLocation.zoom || 16 } : viewState}
            onViewStateChange={({ viewState }) => setViewState(viewState)}
            controller={true}
            layers={layers}
            getTooltip={({ object }) => object && object.name}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
            <Map
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
            />
        </DeckGL>
    );
}
