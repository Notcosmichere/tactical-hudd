// --- PASTE YOUR KEYS HERE EXACTLY AS THEY APPEAR ---
const MAPTILER_KEY = 'GpIzsuMQ3oVAhUxosO5E';
const GEMINI_KEY = 'AIzaSyBpyAl53zmlekHhPavi1n2LJulLO9jTuZs';

// --- OPTIMIZED MAP INITIALIZATION ---
maptilersdk.config.apiKey = MAPTILER_KEY;
const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.SATELLITE,
    center: [76.35, 9.6], // Set near Kerala based on your location
    zoom: 11,
    pitch: 45, // Lower pitch and NO terrain = zero lag on mobile
    terrain: false 
});

// Update Coordinates on HUD
map.on('move', () => {
    const c = map.getCenter();
    document.getElementById('coords').innerText = `LAT: ${c.lat.toFixed(4)} | LNG: ${c.lng.toFixed(4)}`;
});

// Smooth 3D Transition (Optimized)
map.on('zoom', () => {
    if (map.getZoom() > 14) {
        map.setPitch(60); 
    } else {
        map.setPitch(0);  
    }
});


// --- AI ANALYST (GEMINI) WITH DEBUGGER ---
async function askAI() {
    const aiBox = document.getElementById('ai-text');
    aiBox.innerText = "ESTABLISHING SECURE CONNECTION...";
    
    // Safety check: Did you replace the key?
    if (GEMINI_KEY === 'YOUR_GEMINI_KEY' || GEMINI_KEY === '') {
        aiBox.innerText = "CRITICAL ERROR: GEMINI API KEY MISSING IN APP.JS.";
        return;
    }

    const center = map.getCenter();
    const prompt = `You are a CIA tactical analyst. Look at the coordinates LAT: ${center.lat}, LNG: ${center.lng}. In 2 short sentences, describe the geographic features, urban density, or tactical significance of this general location.`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        
        if (data.candidates && data.candidates[0].content) {
            aiBox.innerText = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
            // This will tell you exactly why Gemini rejected it
            aiBox.innerText = `API ERROR: ${data.error.message}`;
        } else {
            aiBox.innerText = "UNKNOWN ERROR: INTEL SERVER REJECTED REQUEST.";
        }
    } catch (e) {
        aiBox.innerText = "CONNECTION INTERRUPTED. CHECK INTERNET.";
    }
}


// --- HIGH-PERFORMANCE FLIGHT TRACKING ---
let flightMarkers = {}; 
let scanningInterval;

async function scanFlights() {
    const aiBox = document.getElementById('ai-text');
    aiBox.innerText = "SCANNING AIRSPACE...";
    
    const fetchPlanes = async () => {
        const b = map.getBounds();
        const url = `https://opensky-network.org/api/states/all?lamin=${b.getSouth()}&lomin=${b.getWest()}&lamax=${b.getNorth()}&lomax=${b.getEast()}`;
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.states) {
                // CAP AT 40 PLANES TO STOP MOBILE LAG
                const planes = data.states.slice(0, 40); 
                aiBox.innerText = `TRACKING ${planes.length} AIRCRAFT IN SECTOR.`;
                
                planes.forEach(p => {
                    const callsign = p[1] ? p[1].trim() : "UNKNOWN";
                    const lng = p[5];
                    const lat = p[6];
                    const true_track = p[10] || 0; // Flight angle
                    
                    if (!lng || !lat) return; 

                    if (flightMarkers[callsign]) {
                        // Smoothly move existing plane
                        flightMarkers[callsign].setLngLat([lng, lat]);
                        flightMarkers[callsign].getElement().style.transform = `rotate(${true_track}deg)`;
                    } else {
                        // Create new directional plane marker
                        const el = document.createElement('div');
                        el.className = 'plane-icon';
                        // Using a clear directional airplane symbol
                        el.innerHTML = '✈'; 
                        el.style.transform = `rotate(${true_track}deg)`;
                        el.style.transition = "transform 0.5s linear"; // Smooth turning
                        
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

    fetchPlanes();
    clearInterval(scanningInterval);
    scanningInterval = setInterval(fetchPlanes, 15000); // Increased to 15s to save battery/reduce lag
}

// --- WEATHER RADAR ---
let radarOn = false;
function toggleRadar() {
    const aiBox = document.getElementById('ai-text');
    if (radarOn) {
        map.removeLayer('radar-layer');
        map.removeSource('radar');
        aiBox.innerText = "RADAR DEACTIVATED.";
    } else {
        map.addSource('radar', {
            type: 'raster',
            tiles: ['https://tilecache.rainviewer.com/v2/radar/nowcast_1/256/{z}/{x}/{y}/2/1_1.png'],
            tileSize: 256
        });
        map.addLayer({ id: 'radar-layer', type: 'raster', source: 'radar', paint: { 'raster-opacity': 0.6 } });
        aiBox.innerText = "RADAR ACTIVATED. SCANNING...";
    }
    radarOn = !radarOn;
}
