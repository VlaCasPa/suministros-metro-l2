// Base de datos integrada directamente para evitar errores de carga
const registrosSuministros = [
    { id: "E01", tramo: "L2", lat: -12.05317, lng: -77.13762, agua: "• 7355727-4 (SEDAPAL) - ACTIVO<br>• 7752475-9 (SEDAPAL) - EN PROCESO DE BAJA", luz: "• 3007041 (PLUZ ENERGIA) - ACTIVO" },
    { id: "E02", tramo: "L2", lat: -12.05877, lng: -77.12586, agua: "• 7364644-0 (SEDAPAL) - ACTIVO<br>• 7841390-3 (SEDAPAL) - ACTIVO", luz: "• 3007043 (PLUZ ENERGIA) - ACTIVO" },
    { id: "E03", tramo: "L2", lat: -12.05700, lng: -77.11510, agua: "• 7308469-1 (SEDAPAL) - EN PROCESO DE BAJA<br>• 7688375 (SEDAPAL) - ACTIVO", luz: "• 3036716 (PLUZ ENERGIA) - ACTIVO" },
    { id: "E04", tramo: "L2", lat: -12.05484, lng: -77.10480, agua: "• 7173036-0 (SEDAPAL) - ACTIVO (TBM)<br>• 7819600 (SEDAPAL) - ACTIVO", luz: "• 3239253 (PLUZ ENERGIA) - ACTIVO" },
    { id: "E05", tramo: "L2", lat: -12.05372, lng: -77.09875, agua: "• 7688375-0 (SEDAPAL) - ACTIVO<br>• 7598239-7 (SEDAPAL) - ACTIVO", luz: "• 3082040 (PLUZ ENERGIA) - ACTIVO" },
    { id: "E06", tramo: "L2", lat: -12.05198, lng: -77.08893, agua: "• 7465247-0 (SEDAPAL) - EN PROCESO DE BAJA", luz: "• 3073811 (PLUZ ENERGIA) - ACTIVO" },
    { id: "DANSEY", tramo: "L2", lat: -12.04721, lng: -77.06329, agua: "• 5652759-1 (SEDAPAL) - ACTIVO", luz: "• 2047271 (PLUZ ENERGIA) - ACTIVO" }
];

// Inicialización del mapa
const map = L.map('map').setView([-12.0464, -77.0428], 13);

L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps'
}).addTo(map);

let capaMarcadores = L.layerGroup().addTo(map);
let todosLosMarcadores = [];

function cargarMapa() {
    capaMarcadores.clearLayers();
    todosLosMarcadores = [];
    const bounds = [];

    registrosSuministros.forEach(item => {
        // Icono visible con la ID de la estructura
        const customIcon = L.divIcon({
            className: 'pin-etiqueta-contenedor',
            html: `
                <div style="width: 14px; height: 14px; background-color: #FFC107; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: inline-block;"></div>
                <div style="background: #FFFFFF; padding: 2px 6px; margin-left: 5px; border-radius: 4px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: bold; color: #1E293B; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: inline-block; white-space: nowrap;">${item.id}</div>
            `,
            iconSize: [80, 24],
            iconAnchor: [7, 12]
        });

        const popupContent = `
            <div style="font-family: 'Inter', sans-serif; min-width: 240px;">
                <div style="font-weight: 700; font-size: 14px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">ESTRUCTURA ID: ${item.id} (${item.tramo})</div>
                <div style="font-size: 12px; color: #334155; background: #f8fafc; padding: 6px 8px; border-radius: 4px; margin-top: 4px;">
                    <b>💧 AGUA (SEDAPAL):</b><br>${item.agua}
                </div>
                <div style="font-size: 12px; color: #334155; background: #f8fafc; padding: 6px 8px; border-radius: 4px; margin-top: 6px;">
                    <b>⚡ ELECTRICIDAD (LUZ):</b><br>${item.luz}
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
            let estadoBusqueda = estadoFiltro === "ACTIVO" ? "activo" : "baja";
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
