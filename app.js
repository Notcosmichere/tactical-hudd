maptilersdk.config.apiKey = 'GpIzsuMQ3oVAhUxosO5E';
const GEMINI_KEY = 'AIzaSyBpyAl53zmlekHhPavi1n2LJulLO9jTuZs';

const map = new maptilersdk.Map({
    container: 'map',
    style: maptilersdk.MapStyle.SATELLITE,
    center: [-74.006, 40.7128], zoom: 14, pitch: 65, terrain: true
});

map.on('move', () => {
    const c = map.getCenter();
    document.getElementById('coords').innerText = `LAT: ${c.lat.toFixed(4)} | LNG: ${c.lng.toFixed(4)}`;
});

async function askAI() {
    const center = map.getCenter();
    const prompt = `Give a tactical 1-sentence analysis of coordinates ${center.lat}, ${center.lng}. Mention terrain.`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    document.getElementById('ai-text').innerText = data.candidates[0].content.parts[0].text;
}

async function scanFlights() {
    const b = map.getBounds();
    const url = `https://opensky-network.org/api/states/all?lamin=${b.getSouth()}&lomin=${b.getWest()}&lamax=${b.getNorth()}&lomax=${b.getEast()}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.states) {
        data.states.forEach(p => {
            const el = document.createElement('div'); el.style.color = '#0f0'; el.innerText = '✈';
            new maptilersdk.Marker(el).setLngLat([p[5], p[6]]).addTo(map);
        });
    }
}

