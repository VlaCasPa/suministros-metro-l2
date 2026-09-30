// Base de datos completa consolidada de Suministros (L2 & L4)
const registrosSuministros = [
    {
        id: "DANSEY",
        tramo: "L2",
        lat: -12.047209,
        lng: -77.06329,
        agua: "• Suministro: 5652759-1 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 2047271 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "DOVELAS",
        tramo: "L4",
        lat: -12.03071,
        lng: -77.102434,
        agua: "• Suministro: 7250007-7 (SEDAPAL) - Estado: ACTIVO",
        luz: "Sin registro de luz"
    },
    {
        id: "E01",
        tramo: "L2",
        lat: -12.05317,
        lng: -77.137623,
        agua: "• Suministro: 7355727-4 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7752475-9 (SEDAPAL) - Estado: EN PROCESO DE BAJA | Obs: En proceso de baja (octubre de 2026)",
        luz: "⚡ Suministro: 3007041 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "E02",
        tramo: "L2",
        lat: -12.058771,
        lng: -77.125859,
        agua: "• Suministro: 7364644-0 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7841390-3 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 3007043 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "E03",
        tramo: "L2",
        lat: -12.056998,
        lng: -77.115102,
        agua: "• Suministro: 7308469-1 (SEDAPAL) - Estado: EN PROCESO DE BAJA | Obs: En proceso de baja (setiembre de 2026)<br>• Suministro: 7688375 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 3036716 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "E04",
        tramo: "L2",
        lat: -12.054839,
        lng: -77.104798,
        agua: "• Suministro: 7173036-0 (SEDAPAL) - Estado: ACTIVO | Obs: TBM<br>• Suministro: 7819600 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 3239253 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "E05",
        tramo: "L2",
        lat: -12.053715,
        lng: -77.098749,
        agua: "• Suministro: 7688375-0 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7598239-7 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 3082040 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "E06",
        tramo: "L2",
        lat: -12.051975,
        lng: -77.088926,
        agua: "• Suministro: 7465247-0 (SEDAPAL) - Estado: EN PROCESO DE BAJA<br>• Suministro: 7876299-4 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 3073811 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "E11",
        tramo: "L2",
        lat: -12.057149,
        lng: -77.051716,
        agua: "• Suministro: 7422135-9 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7448336-3 (SEDAPAL) - Estado: ACTIVO",
        luz: "Sin registro de luz"
    },
    {
        id: "E12",
        tramo: "L2",
        lat: -12.059528,
        lng: -77.043823,
        agua: "• Suministro: 7493628-7 (SEDAPAL) - Estado: EN PROCESO DE BAJA<br>• Suministro: 7809845 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 7493636-0 (LDS) - Estado: ACTIVO<br>⚡ Suministro: 3012442 (PLUZ) - Estado: ACTIVO"
    },
    {
        id: "E13",
        tramo: "L2",
        lat: -12.059956,
        lng: -77.037686,
        agua: "• Suministro: 7721849-3 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 2208942 (LDS) - Estado: ACTIVO"
    },
    {
        id: "E14",
        tramo: "L2",
        lat: -12.063359,
        lng: -77.030104,
        agua: "• Suministro: 7272623-5 (SEDAPAL) - Estado: EN PROCESO DE BAJA",
        luz: "⚡ Suministro: 2021606 (LDS) - Estado: ACTIVO"
    },
    {
        id: "E15",
        tramo: "L2",
        lat: -12.062086,
        lng: -77.021036,
        agua: "• Suministro: 7272659-9 (SEDAPAL) - Estado: EN PROCESO DE BAJA",
        luz: "⚡ Suministro: 2021788 (LDS) - Estado: ACTIVO"
    },
    {
        id: "E16",
        tramo: "L2",
        lat: -12.060985,
        lng: -77.012342,
        agua: "• Suministro: 7488442-0 (SEDAPAL) - Estado: ACTIVO",
        luz: "⚡ Suministro: 2111218 (LDS) - Estado: ACTIVO"
    },
    {
        id: "TVPM",
        tramo: "L2",
        lat: -12.057804,
        lng: -77.049756,
        agua: "• Suministro: (SEDAPAL) - Estado: | Obs: SIN REGISTRO",
        luz: "⚡ Suministro: 3073917 (PLUZ) - Estado: ACTIVO<br>⚡ Suministro: 3203599 (PLUZ) - Estado: ACTIVO | Obs: E11/TV Parque Murillo – TBM S-972"
    }
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
    const textoBusqueda = document.getElementById('input-buscar').value.toLowerCase().trim();
    const tipoFiltro = document.getElementById('select-tipo').value;
    const empresaFiltro = document.getElementById('select-empresa').value;
    const estadoFiltro = document.getElementById('select-estado').value;

    capaMarcadores.clearLayers();
    let marcadoresVisibles = [];

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
            if (estadoFiltro === "PROCESO_BAJA") estadoBusqueda = "proceso de baja";
            if (estadoFiltro === "BAJA") estadoBusqueda = "de baja";

            if (!contenidoTotal.includes(estadoBusqueda)) cumpleFiltros = false;
        }

        if (cumpleTexto && cumpleFiltros) {
            capaMarcadores.addLayer(marker);
            marcadoresVisibles.push(marker);
        }
    });

    // Si el usuario busca un suministro específico o ID y hay resultado único, hacer zoom y abrir popup
    if (textoBusqueda.length > 0 && marcadoresVisibles.length === 1) {
        const unicoMarker = marcadoresVisibles[0];
        map.setView(unicoMarker.getLatLng(), 17, { animate: true });
        unicoMarker.openPopup();
    }
}

window.onload = function() {
    cargarMapa();
};
