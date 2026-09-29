// Inicialización del mapa centrado en el eje de la Línea 2 del Metro de Lima
const map = L.map('map').setView([-12.0464, -77.0428], 13);

// Capa base de mapas de alta legibilidad (CartoDB Positron)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://ccmetrolima.com">Consorcio Constructor Metro 2 de Lima</a>'
}).addTo(map);

// Recorrer la matriz importada desde datos.js para pintar los marcadores
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
