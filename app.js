// --- PASTE YOUR KEYS HERE ---
const MAPTILER_KEY = 'GpIzsuMQ3oVAhUxosO5E';
const GEMINI_KEY = 'AIzaSyBpyAl53zmlekHhPavi1n2LJulLO9jTuZs';

// --- MAP INITIALIZATION ---
maptilersdk.config.apiKey = MAPTILER_KEY;
const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.SATELLITE,
    center: [-74.006, 40.7128], // Starts at NYC
    zoom: 11,
    pitch: 0,
    terrain: true // Enables 3D terrain
});

// Update Coordinates on HUD
map.on('move', () => {
    const c = map.getCenter();
    document.getElementById('coords').innerText = `LAT: ${c.lat.toFixed(4)} | LNG: ${c.lng.toFixed(4)}`;
});

// Google Earth Style 3D Zoom Effect
map.on('zoom', () => {
    if (map.getZoom() > 14) {
        map.setPitch(65); // Tilts the camera for 3D buildings
    } else {
        map.setPitch(0);  // Flat top-down view for world map
    }
});


// --- AI ANALYST (GEMINI) ---
async function askAI() {
    const aiBox = document.getElementById('ai-text');
    aiBox.innerText = "ESTABLISHING SECURE CONNECTION... \nANALYZING TERRAIN...";
    
    const center = map.getCenter();
    const prompt = `You are a CIA tactical analyst. Look at the coordinates LAT: ${center.lat}, LNG: ${center.lng}. In 2 short sentences, describe the geographic features, urban density, or tactical significance of this general location. Keep it brief, gritty, and professional.`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates[0].content) {
            aiBox.innerText = data.candidates[0].content.parts[0].text;
        } else {
            aiBox.innerText = "ERROR: INTEL SERVER REJECTED REQUEST. CHECK API KEY.";
        }
    } catch (e) {
        aiBox.innerText = "CONNECTION INTERRUPTED. RETRYING OVER ENCRYPTED CHANNEL...";
        console.error(e);
    }
}


// --- LIVE FLIGHT TRACKING (OPENSKY) ---
let flightMarkers = {}; // Stores planes to animate them
let scanningInterval;

async function scanFlights() {
    const aiBox = document.getElementById('ai-text');
    aiBox.innerText = "SCANNING AIRSPACE... DOWNLOADING TRANSPONDER DATA...";
    
    const fetchPlanes = async () => {
        const b = map.getBounds();
        // OpenSky API uses boundaries: lamin, lomin, lamax, lomax
        const url = `https://opensky-network.org/api/states/all?lamin=${b.getSouth()}&lomin=${b.getWest()}&lamax=${b.getNorth()}&lomax=${b.getEast()}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.states) {
                aiBox.innerText = `AIRSPACE SECURE. \nTRACKING ${data.states.length} AIRCRAFT IN SECTOR.`;
                data.states.forEach(p => {
                    const callsign = p[1] ? p[1].trim() : "UNKNOWN";
                    const lng = p[5];
                    const lat = p[6];
                    const true_track = p[10] || 0; // Direction plane is facing

                    if (!lng || !lat) return; // Skip if no location

                    if (flightMarkers[callsign]) {
                        // Plane exists, animate to new location
                        flightMarkers[callsign].setLngLat([lng, lat]);
                        flightMarkers[callsign].getElement().style.transform = `rotate(${true_track}deg)`;
                    } else {
                        // New plane detected, create marker
                        const el = document.createElement('div');
                        el.className = 'plane-icon';
                        el.innerHTML = '✈';
                        el.style.transform = `rotate(${true_track}deg)`;
                        
                        flightMarkers[callsign] = new maptilersdk.Marker({element: el})
                            .setLngLat([lng, lat])
                            .addTo(map);
                    }
                });
            } else {
                aiBox.innerText = "NO AIRCRAFT DETECTED IN IMMEDIATE SECTOR.";
            }
        } catch (e) { 
            console.log("Radar Sweep Failed/Rate Limited"); 
        }
    };

    // Run once immediately, then loop every 10 seconds to animate
    fetchPlanes();
    clearInterval(scanningInterval);
    scanningInterval = setInterval(fetchPlanes, 10000); 
}


// --- WEATHER RADAR (RAINVIEWER) ---
let radarOn = false;
function toggleRadar() {
    const aiBox = document.getElementById('ai-text');
    if (radarOn) {
        map.removeLayer('radar-layer');
        map.removeSource('radar');
        aiBox.innerText = "METEOROLOGICAL RADAR DEACTIVATED.";
    } else {
        map.addSource('radar', {
            type: 'raster',
            tiles: ['https://tilecache.rainviewer.com/v2/radar/nowcast_1/256/{z}/{x}/{y}/2/1_1.png'],
            tileSize: 256
        });
        map.addLayer({ 
            id: 'radar-layer', 
            type: 'raster', 
            source: 'radar', 
            paint: { 'raster-opacity': 0.6 } 
        });
        aiBox.innerText = "METEOROLOGICAL RADAR ACTIVATED. SCANNING FOR PRECIPITATION.";
    }
    radarOn = !radarOn;
}
