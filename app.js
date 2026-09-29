// Inicialización del mapa centrado en Lima (Línea 2)
const map = L.map('map').setView([-12.0464, -77.0428], 13);

// Capa base de Google Maps con diseño limpio en escala de grises (Estilo corporativo)
L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t%3A33%7Cp.s%3A-100%2Cs.t%3A3%7Cp.s%3A-100', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps - Consorcio Constructor Metro 2 de Lima'
}).addTo(map);

// Renderizar todos los registros cargados desde datos.js
registrosSuministros.forEach(item => {
    const popupContent = `
        <div style="font-family: 'Segoe UI', sans-serif; min-width: 220px;">
            <div class="popup-header">ESTRUCTURA: ${item.id} (${item.tramo})</div>
            <div class="popup-section">
                <b>💧 AGUA (SEDAPAL):</b><br>
                ${item.agua}
            </div>
            <div class="popup-section" style="margin-top: 8px;">
                <b>⚡ ELECTRICIDAD (LUZ):</b><br>
                ${item.luz}
            </div>
        </div>
    `;

    L.marker([item.lat, item.lng]).addTo(map)
      .bindPopup(popupContent);
});
