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

// URL de exportación CSV de la hoja "Consolidado_General" del Google Sheet
// Nota: Asegúrese de que el Google Sheet esté publicado en la web (Archivo > Compartir > Publicar en la web > CSV)
const urlCSV = "https://docs.google.com/spreadsheets/d/12aZE1jl_iV7YKDJJQCPtBB4FP0PSkd41uvx8gQF_i9s/export?format=csv&gid=1003936069";

function cargarDatosDesdeSheet() {
    Papa.parse(urlCSV, {
        download: true,
        header: true,
        complete: function(results) {
            procesarDatosSuministros(results.data);
        },
        error: function(err) {
            console.error("Error al leer el Google Sheet:", err);
        }
    });
}

function procesarDatosSuministros(dataRows) {
    capaMarcadores.clearLayers();
    todosLosMarcadores = [];
    const bounds = [];

    // Agrupar filas por ID de estructura (por si hay múltiples suministros de agua/luz en un mismo ID)
    let estructurasAgrupadas = {};

    dataRows.forEach(row => {
        // Ajuste los nombres de las columnas según estén escritas exactamente en su Google Sheet
        let id = row.ID || row.id || row.Estruc_ID;
        if (!id) return;

        id = id.trim();

        if (!estructurasAgrupadas[id]) {
            estructurasAgrupadas[id] = {
                id: id,
                tramo: row.Tramo || row.tramo || "L2",
                lat: parseFloat((row.Latitud || row.lat || "0").replace(',', '.')),
                lng: parseFloat((row.Longitud || row.lng || "0").replace(',', '.')),
                suministros: []
            };
        }

        estructurasAgrupadas[id].suministros.push({
            tipo: (row.Tipo || row.tipo || "").toUpperCase(),          // Ej: AGUA / LUZ
            empresa: (row.Empresa || row.empresa || "").toUpperCase(),  // Ej: SEDAPAL / PLUZ
            numero: row.Numero || row.numero || row.Suministro || "",   // Número de suministro
            estado: (row.Estado || row.estado || "").toUpperCase()      // Ej: ACTIVO / BAJA
        });
    });

    // Crear marcadores en el mapa para cada ID agrupado
    Object.values(estructurasAgrupadas).forEach(item => {
        if (isNaN(item.lat) || isNaN(item.lng) || item.lat === 0) return;

        // Construir detalle HTML para el popup agrupado
        let htmlAgua = "";
        let htmlLuz = "";
        let contenidoCompletoBusqueda = item.id;

        item.suministros.forEach(s => {
            contenidoCompletoBusqueda += ` ${s.tipo} ${s.empresa} ${s.numero} ${s.estado}`;
            let linea = `• ${s.numero} (${s.empresa}) - ${s.estado}<br>`;
            if (s.tipo.includes("AGUA") || s.empresa.includes("SEDAPAL")) {
                htmlAgua += linea;
            } else {
                htmlLuz += linea;
            }
        });

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
                <div class="popup-header">ESTRUCTURA ID: ${item.id} (${item.tramo})</div>
                <div class="popup-section">
                    <b>💧 AGUA (SEDAPAL):</b><br>
                    ${htmlAgua || 'Sin registros'}
                </div>
                <div class="popup-section" style="margin-top: 6px;">
                    <b>⚡ ELECTRICIDAD (LUZ):</b><br>
                    ${htmlLuz || 'Sin registros'}
                </div>
            </div>
        `;

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });
        marker.bindPopup(popupContent);
        
        marker.itemData = {
            id: item.id,
            textoBusqueda: contenidoCompletoBusqueda.toLowerCase(),
            suministros: item.suministros
        };

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
        const data = marker.itemData;
        const cumpleTexto = textoBusqueda === "" || data.textoBusqueda.includes(textoBusqueda);
        
        let cumpleFiltros = true;

        // Validar filtros individuales sobre los suministros agrupados
        if (tipoFiltro !== "TODOS") {
            const tieneTipo = data.suministros.some(s => s.tipo.includes(tipoFiltro) || (tipoFiltro === "AGUA" && s.empresa.includes("SEDAPAL")) || (tipoFiltro === "LUZ" && !s.empresa.includes("SEDAPAL")));
            if (!tieneTipo) cumpleFiltros = false;
        }

        if (empresaFiltro !== "TODAS") {
            const tieneEmpresa = data.suministros.some(s => s.empresa.includes(empresaFiltro));
            if (!tieneEmpresa) cumpleFiltros = false;
        }

        if (estadoFiltro !== "TODOS") {
            const tieneEstado = data.suministros.some(s => s.estado.includes(estadoFiltro));
            if (!tieneEstado) cumpleFiltros = false;
        }

        if (cumpleTexto && cumpleFiltros) {
            capaMarcadores.addLayer(marker);
        }
    });
}

window.onload = function() {
    // Cargar librería PapaParse si no está presente e iniciar lectura de Google Sheets
    cargarDatosDesdeSheet();
};
