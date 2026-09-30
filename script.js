const map = L.map('map').setView([-12.055, -77.050], 13);

// Capa Base Google Maps en escala de grises forzada por CSS
L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0','mt1','mt2','mt3'],
    attribution: '&copy; Google',
    opacity: 0.85,
    className: 'mapa-google-gris'
}).addTo(map);

// Enlace CSV del repositorio de suministros y cerramientos
const urlCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSz_DsP2CT07FaYNRe4MIX7cO25I01gUb9e_aboGNrIHyBzHiVCX-Ea800l6R76rQ/pub?gid=814807134&single=true&output=csv";

// Grupos de capas
let grupoMarcadores = L.featureGroup().addTo(map);
let grupoPoligonos = L.featureGroup().addTo(map);

let mapaDatosSheets = {};

function normalizarID(texto) {
    if (!texto) return "";
    return texto.toString().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

function estiloPoligono(feature) {
    let tipo = feature.properties.tipo ? feature.properties.tipo.toLowerCase() : "";
    
    if (tipo === "residual") {
        return {
            color: "#ec4899",
            fillColor: "#f472b6",
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.40
        };
    } else if (tipo === "liberado") {
        return {
            color: "#06b6d4",
            fillColor: "#67e8f9",
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.45
        };
    } else {
        return {
            color: "#475569",
            fillColor: "#64748b",
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.35
        };
    }
}

// Carga simultánea: GeoJSON y Google Sheets (CSV)
Promise.all([
    fetch('cerramientos.geojson').then(res => res.json()).catch(() => ({ type: "FeatureCollection", features: [] })),
    new Promise(resolve => {
        Papa.parse(urlCSV, {
            download: true,
            header: true,
            complete: results => resolve(results.data),
            error: () => resolve([])
        });
    })
]).then(([geojsonData, csvData]) => {
    let countInicial = 0;
    let countResidual = 0;
    let countLiberado = 0;

    // Procesar datos del CSV (Suministros y Puntos)
    csvData.forEach(item => {
        if (item.ID) {
            let idNorm = normalizarID(item.ID);
            mapaDatosSheets[idNorm] = item;

            let tipoC = item.Tipo_Cerramiento ? item.Tipo_Cerramiento.trim().toLowerCase() : "";
            let tieneLib = item.Tiene_Liberacion ? item.Tiene_Liberacion.trim().toUpperCase() : "";

            if (tieneLib === "SI") countLiberado++;
            if (tipoC === "residual") countResidual++;
            else if (tipoC === "inicial") countInicial++;

            // Coordenadas del suministro
            let lat = parseFloat(item.Latitud ? item.Latitud.toString().replace(',', '.') : "");
            let lon = parseFloat(item.Longitud ? item.Longitud.toString().replace(',', '.') : "");

            if (!isNaN(lat) && !isNaN(lon)) {
                let marker = L.circleMarker([lat, lon], {
                    radius: 7,
                    fillColor: tieneLib === "SI" ? "#ec4899" : "#64748b",
                    color: "#ffffff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.9
                });

                // Mostrar etiqueta fija de la ID en cada suministro
                marker.bindTooltip(item.ID, { 
                    permanent: true, 
                    direction: 'right', 
                    className: 'id-tooltip', 
                    offset: [6, 0] 
                });

                let popupHtml = `
                    <div class="popup-container">
                        <h3 class="popup-title">ID: ${item.ID} - ${item.Nombre || 'Suministro L2'}</h3>
                        <div class="popup-dato">📍 <b>Tipo:</b> ${item.Tipo_Cerramiento || 'Estándar'}</div>
                        <div class="popup-dato">📅 <b>Fecha Constatación:</b> ${item.Fecha_Constatacion || '-'}</div>
                        <div class="popup-dato">🚧 <b>Fecha Liberación:</b> ${item.Fecha_Liberacion || '-'}</div>
                        <div class="popup-dato">📖 <b>Asiento de Obra:</b> ${item.Asiento_Obra || '-'}</div>
                        <div class="popup-dato">📐 <b>Código de Plano:</b> ${item.Codigo_Plano || '-'}</div>
                    </div>
                `;
                marker.bindPopup(popupHtml);
                marker.addTo(grupoMarcadores);
            }
        }
    });

    // Inyectar KPIs actualizados
    if (document.getElementById('kpi-inicial')) document.getElementById('kpi-inicial নিরাপs').innerText = countInicial; // corregido
    if (document.getElementById('kpi-inicial')) document.getElementById('kpi-inicial').innerText = countInicial;
    if (document.getElementById('kpi-residual')) document.getElementById('kpi-residual').innerText = countResidual;
    if (document.getElementById('kpi-liberado')) document.getElementById('kpi-liberado').innerText = countLiberado;

    // Cargar capa GeoJSON de polígonos
    L.geoJSON(geojsonData, {
        style: estiloPoligono,
        onEachFeature: function(feature, layer) {
            let idGeo = normalizarID(feature.properties.id || feature.properties.ID);
            let datos = mapaDatosSheets[idGeo] || {};

            let popupHtml = `
                <div class="popup-container">
                    <h3 class="popup-title">Zona: ${feature.properties.id || 'N/A'}</h3>
                    <div class="popup-dato">📝 <b>Nombre:</b> ${datos.Nombre || 'Estructura L2'}</div>
                    <div class="popup-dato">📖 <b>Asiento de Obra:</b> ${datos.Asiento_Obra || '-'}</div>
                </div>
            `;
            layer.bindPopup(popupHtml);
        }
    }).addTo(grupoPoligonos);

    // Ajuste de encuadre inicial automático si existen elementos cargados
    if (grupoMarcadores.getLayers().length > 0) {
        map.fitBounds(grupoMarcadores.getBounds(), { padding: [50, 50] });
    }
});
