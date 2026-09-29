// Inicialización del mapa base
const map = L.map('map').setView([-12.0464, -77.0428], 13);

// Capa de Google Maps con diseño limpio en escala de grises
L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t%3A33%7Cp.s%3A-100%2Cs.t%3A3%7Cp.s%3A-100', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps - Consorcio Constructor Metro 2 de Lima'
}).addTo(map);

const bounds = [];

// Recorrer la matriz de registros para pintar los pines circulares con etiquetas de ID
registrosSuministros.forEach(item => {
    const customIcon = L.divIcon({
        className: 'custom-pin-container',
        html: `
            <div style="display: flex; align-items: center;">
                <div style="
                    width: 14px; 
                    height: 14px; 
                    background-color: #FFC107; 
                    border: 2px solid #FFFFFF; 
                    border-radius: 50%; 
                    box-shadow: 0 2px 5px rgba(0,0,0,0.4);
                "></div>
                <div style="
                    background: #FFFFFF; 
                    padding: 2px 6px; 
                    margin-left: 4px; 
                    border-radius: 4px; 
                    font-family: 'Segoe UI', sans-serif; 
                    font-size: 11px; 
                    font-weight: bold; 
                    color: #1E293B; 
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                    white-space: nowrap;
                ">${item.id}</div>
            </div>
        `,
        iconSize: [60, 20],
        iconAnchor: [7, 10]
    });

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

    const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(popupContent);

    // Acumular coordenadas para el encuadre automático
    bounds.push([item.lat, item.lng]);
});

// Ejecutar Zoom Extent automático para abarcar todas las estructuras al cargar
if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
}
