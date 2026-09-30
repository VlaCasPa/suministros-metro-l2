// Inicialización del mapa base
const map = L.map('map').setView([-12.0464, -77.0428], 13);

// Capa base limpia estándar (el color gris se fuerza mediante la clase CSS del mapa)
L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
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
        // Icono personalizado con contenedor visible para la ID
        const customIcon = L.divIcon({
            className: 'pin-etiqueta-contenedor',
            html: `
                <div class="punto-pin"></div>
                <div class="etiqueta-id">${item.id}</div>
            `,
            iconSize: [80, 24],
            iconAnchor: [7, 12]
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
        
        marker.itemData = item;
        todosLosMarcadores.push(marker);

        capaMarcadores.addLayer(marker);
        bounds.push([item.lat, item.lng]);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
}

// Función de Filtrado y Búsqueda Avanzada
function filtrarMapa() {
    const textoBusqueda = document.getElementById('input-buscar').value.toLowerCase();
    const tipoFiltro = document.getElementById('select-tipo').value;
    const empresaFiltro = document.getElementById('select-empresa').value;
    const estadoFiltro = document.getElementById('select-estado').value;

    capaMarcadores.clearLayers();

    todosLosMarcadores.forEach(marker => {
        const item = marker.itemData;
        const contenidoTotal = `${item.id} ${item.agua} ${item.luz}`.toLowerCase();
        
        const cumpleTexto = textoBusqueda === "" || contenidoTotal.includes(textoBusqueda);
        let cumpleFiltros = true;

        if (tipoFiltro === "AGUA" && !item.agua) cumpleFiltros = false;
        if (tipoFiltro === "LUZ" && !item.luz) cumpleFiltros = false;

        if (empresaFiltro !== "TODAS") {
            if (!contenidoTotal.includes(empresaFiltro.toLowerCase())) cumpleFiltros = false;
        }

        if (estadoFiltro !== "TODOS") {
            let estadoBusqueda = "";
            if (estadoFiltro === "ACTIVO") estadoBusqueda = "activo";
            if (estadoFiltro === "BAJA") estadoBusqueda = "baja"; // Detecta "en proceso de baja" o "baja"

            if (!contenidoTotal.includes(estadoBusqueda)) cumpleFiltros = false;
        }

        if (cumpleTexto && cumpleFiltros) {
            capaMarcadores.addLayer(marker);
        }
    });
}

window.onload = function() {
    cargarMapa();
};
