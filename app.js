// Inicialización del mapa con estilo de escala de grises forzado por API de Google
const map = L.map('map').setView([-12.0464, -77.0428], 13);

L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&apistyle=s.t%3A33%7Cp.s%3A-100%2Cs.t%3A3%7Cp.s%3A-100', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps - Consorcio Constructor Metro 2 de Lima'
}).addTo(map);

let capaMarcadores = L.layerGroup().addTo(map);
let todosLosMarcadores = [];

function cargarMapa() {
    capaMarcadores.clearLayers();
    todosLosMarcadores = [];
    const bounds = [];

    if (typeof registrosSuministros === 'undefined') return;

    registrosSuministros.forEach(item => {
        // Icono personalizado con ID visible
        const customIcon = L.divIcon({
            className: 'custom-pin-container',
            html: `
                <div style="display: flex; align-items: center;">
                    <div style="width: 14px; height: 14px; background-color: #FFC107; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4);"></div>
                    <div style="background: #FFFFFF; padding: 2px 6px; margin-left: 4px; border-radius: 4px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: bold; color: #1E293B; box-shadow: 0 1px 3px rgba(0,0,0,0.3); white-space: nowrap;">${item.id}</div>
                </div>
            `,
            iconSize: [60, 20],
            iconAnchor: [7, 10]
        });

        const popupContent = `
            <div style="font-family: 'Inter', sans-serif; min-width: 240px;">
                <div class="popup-header">ESTRUCTURA ID: ${item.id} (${item.tramo || 'L2'})</div>
                <div class="popup-section">
                    <b>💧 AGUA (SEDAPAL):</b><br>
                    ${item.agua || 'Sin registros'}
                </div>
                <div class="popup-section" style="margin-top: 6px;">
                    <b>⚡ ELECTRICIDAD (LUZ):</b><br>
                    ${item.luz || 'Sin registros'}
                </div>
            </div>
        `;

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });
        marker.bindPopup(popupContent);
        
        // Guardar metadatos para filtrado
        marker.itemData = item;
        todosLosMarcadores.push(marker);

        capaMarcadores.addLayer(marker);
        bounds.push([item.lat, item.lng]);
    });

    if (bounds.length > 0 && map.getBounds().isValid() === false) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
}

// Función de Filtrado y Búsqueda Independiente
function filtrarMapa() {
    const textoBusqueda = document.getElementById('input-buscar').value.toLowerCase();
    const tipoFiltro = document.getElementById('select-tipo').value;
    const empresaFiltro = document.getElementById('select-empresa').value;
    const estadoFiltro = document.getElementById('select-estado').value;

    capaMarcadores.clearLayers();

    todosLosMarcadores.forEach(marker => {
        const item = marker.itemData;
        
        // Texto completo combinado para búsqueda general
        const contenidoTotal = `${item.id} ${item.agua} ${item.luz}`.toLowerCase();
        
        // Comprobar buscador general
        const cumpleTexto = textoBusqueda === "" || contenidoTotal.includes(textoBusqueda);

        // Comprobar tipo y empresa y estado
        let cumpleFiltros = true;

        if (tipoFiltro === "AGUA" && !item.agua) cumpleFiltros = false;
        if (tipoFiltro === "LUZ" && !item.luz) cumpleFiltros = false;

        if (empresaFiltro !== "TODAS") {
            const tieneEmpresa = contenidoTotal.includes(empresaFiltro.toLowerCase());
            if (!tieneEmpresa) cumpleFiltros = false;
        }

        if (estadoFiltro !== "TODOS") {
            const estadoBusqueda = estadoFiltro === "ACTIVO" ? "activo" : "proceso de baja";
            if (!contenidoTotal.includes(estadoBusqueda)) cumpleFiltros = false;
        }

        if (cumpleTexto && cumpleFiltros) {
            capaMarcadores.addLayer(marker);
        }
    });
}

// Inicializar al cargar la página
window.onload = function() {
    cargarMapa();
};
