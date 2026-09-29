// 1. Inicialización del mapa centrado de forma genérica (el zoom extent ajustará la vista luego)
const map = L.map('map').setView([-12.0464, -77.0428], 13);

// Capa base de Google Maps con diseño limpio en escala de grises
L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t%3A33%7Cp.s%3A-100%2Cs.t%3A3%7Cp.s%3A-100', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps - Consorcio Constructor Metro 2 de Lima'
}).addTo(map);

// Array para almacenar las coordenadas y hacer el Zoom Extent posterior
const bounds = [];

// 2. Recorrer la matriz de registros cargados desde datos.js
registrosSuministros.forEach(item => {
    // Crear un marcador con etiqueta flotante integrada (estilo idéntico a su referencia)
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

    // Añadir marcador al mapa
    const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(popupContent);

    // Guardar coordenadas para el cálculo del Zoom Extent
    bounds.push([item.lat, item.lng]);
});

// 3. Ejecutar Zoom Extent automático para encuadrar todas las estructuras visibles
if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
}
