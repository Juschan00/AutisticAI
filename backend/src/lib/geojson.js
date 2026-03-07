export const toGeoJSON = (locations) => {
    return {
        type: "FeatureCollection",
        features: locations.map((loc) => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [loc.longitude, loc.latitude],
            },
            properties: {
                id: loc.id,
                name: loc.name,
                category: loc.category,
                noiseScore: loc.sensoryScores?.noiseScore ?? null,
                lightingScore: loc.sensoryScores?.lightingScore ?? null,
                crowdScore: loc.sensoryScores?.crowdScore ?? null,
                comfortScore: loc.sensoryScores?.comfortScore ?? null,
                reviewCount: loc.sensoryScores?.reviewCount ?? 0,
            },
        })),
    };
};