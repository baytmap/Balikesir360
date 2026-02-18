const fetch = require('node-fetch');

async function exportPoints() {
    const arcgisUrl = "https://geolabmapps.com/glbserver/rest/services/Pv360/MapServer/0/query";
    const params = new URLSearchParams({
        where: "1=1",
        outFields: "*",
        f: "json"
    });

    try {
        const response = await fetch(`${arcgisUrl}?${params}`);
        const data = await response.json();
        
        const geojson = {
            type: "FeatureCollection",
            features: data.features.map(feature => ({
                type: "Feature",
                properties: {
                    id: feature.attributes.OBJECTID,
                    ...feature.attributes
                },
                geometry: {
                    type: "Point",
                    coordinates: [feature.geometry.x, feature.geometry.y]
                }
            }))
        };

        console.log(JSON.stringify(geojson, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

exportPoints(); 