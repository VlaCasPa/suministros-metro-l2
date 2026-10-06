// URLs de exportación CSV publicadas desde Google Sheets
const SHEET_AGUA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=0&single=true&output=csv';
const SHEET_LUZ_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=1407636453&single=true&output=csv';

let registrosSuministros = [];
let map, capaMarcadores, todosLosMarcadores = [], boundsGlobal = [], mapaRegistrosPorId = {};

// Inicialización del mapa Leaflet
function inicializarMapaBase() {
    map = L.map('map', { zoomControl: false }).setView([-12.0464, -77.0428], 13);
    L.control.zoom({ position: 'topleft' }).addTo(map);

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Maps'
    }).addTo(map);

    capaMarcadores = L.layerGroup().addTo(map);
}

// Parseador CSV robusto
function parseCSV(text) {
    let lines = [];
    let row = [""];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        let c = text[i], next = text[i+1];
        if (c === '"') {
            if (inQuotes && next === '"') { row[row.length - 1] += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (c === ',' && !inQuotes) {
            row.push("");
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && next === '\n') { i++; }
            lines.push(row);
            row = [""];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== "") lines.push(row);
    return lines;
}

// Conversión segura de números con coma decimal (ej. "-12,04721" -> -12.04721)
function parsearNumeroLatLon(val) {
    if (!val) return null;
    let limpio = val.trim().replace(',', '.');
    let num = parseFloat(limpio);
    return isNaN(num) ? null : num;
}

// Función principal para descargar y procesar las hojas en tiempo real por nombre de columna
async function cargarDatosDesdeHojas() {
    try {
        const [respAgua, respLuz] = await Promise.all([
            fetch(SHEET_AGUA_URL),
            fetch(SHEET_LUZ_URL)
        ]);

        const csvAguaText = await respAgua.text();
        const csvLuzText = await respLuz.text();

        const filasAgua = parseCSV(csvAguaText);
        const filasLuz = parseCSV(csvLuzText);

        let mapaEstructuras = {};

        // Procesar Hoja de Agua
        if (filasAgua.length > 1) {
            let headersAgua = filasAgua[0].map(h => h.trim().toUpperCase());
            let idxId = headersAgua.indexOf("ID");
            let idxSum = headersAgua.indexOf("SUMINISTRO");
            let idxEmp = headersAgua.indexOf("EMPRESA");
            let idxEst = headersAgua.indexOf("ESTADO");
            let idxTramo = headersAgua.indexOf("TRAMO");
            let idxObs = headersAgua.indexOf("COMENTARI") !== -1 ? headersAgua.indexOf("COMENTARI") : headersAgua.indexOf("DOCUMENT");
            let idxLat = headersAgua.indexOf("LATITUD");
            let idxLng = headersAgua.indexOf("LONGITUD");

            for (let i = 1; i < filasAgua.length; i++) {
                let cols = filasAgua[i];
                if (cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let lat = parsearNumeroLatLon(cols[idxLat]);
                let lng = parsearNumeroLatLon(cols[idxLng]);

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = {
                        id: id,
                        tramo: idxTramo !== -1 && cols[idxTramo] ? cols[idxTramo].trim() : "L2",
                        lat: lat !== null ? lat : -12.0464,
                        lng: lng !== null ? lng : -77.0428,
                        aguaList: [],
                        luzList: []
                    };
                } else {
                    // Actualizar coordenadas válidas si la fila principal no las tenía
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                let sumNum = idxSum !== -1 && cols[idxSum] ? cols[idxSum].trim() : "";
                let empresa = idxEmp !== -1 && cols[idxEmp] ? cols[idxEmp].trim() : "SEDAPAL";
                let estado = idxEst !== -1 && cols[idxEst] ? cols[idxEst].trim() : "ACTIVO";
                let obs = idxObs !== -1 && cols[idxObs] ? cols[idxObs].trim() : "";

                if (sumNum) {
                    mapaEstructuras[id].aguaList.push(`• Suministro: ${sumNum} (${empresa}) - Estado: ${estado}${obs ? ' | Obs: ' + obs : ''}`);
                }
            }
        }

        // Procesar Hoja de Luz
        if (filasLuz.length > 1) {
            let headersLuz = filasLuz[0].map(h => h.trim().toUpperCase());
            let idxId = headersLuz.indexOf("ID");
            let idxSum = headersLuz.indexOf("SUMINISTRO");
            let idxEmp = headersLuz.indexOf("EMPRESA");
            let idxEst = headersLuz.indexOf("ESTADO");
            let idxTramo = headersLuz.indexOf("TRAMO");
            let idxLat = headersLuz.indexOf("LATITUD");
            let idxLng = headersLuz.indexOf("LONGITUD");

            for (let i = 1; i < filasLuz.length; i++) {
                let cols = filasLuz[i];
                if (cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let lat = parsearNumeroLatLon(cols[idxLat]);
                let lng = parsearNumeroLatLon(cols[idxLng]);

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = {
                        id: id,
                        tramo: idxTramo !== -1 && cols[idxTramo] ? cols[idxTramo].trim() : "L2",
                        lat: lat !== null ? lat : -12.0464,
                        lng: lng !== null ? lng : -77.0428,
                        aguaList: [],
                        luzList: []
                    };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                let sumNum = idxSum !== -1 && cols[idxSum] ? cols[idxSum].trim() : "";
                let empresa = idxEmp !== -1 && cols[idxEmp] ? cols[idxEmp].trim() : "PLUZ";
                let estado = idxEst !== -1 && cols[idxEst] ? cols[idxEst].trim() : "ACTIVO";

                if (sumNum) {
                    mapaEstructuras[id].luzList.push(`⚡ Suministro: ${sumNum} (${empresa}) - Estado: ${estado}`);
                }
            }
        }

        // Consolidar registros globales
        registrosSuministros = Object.values(mapaEstructuras).map(item => ({
            id: item.id,
            tramo: item.tramo,
            lat: item.lat,
            lng: item.lng,
            agua: item.aguaList.length > 0 ? item.aguaList.join("<br>") : "Sin registro de agua",
            luz: item.luzList.length > 0 ? item.luzList.join("<br>") : "Sin registro de luz"
        }));

        cargarMapa("TODOS");

    } catch (error) {
        console.error("Error al cargar datos desde Google Sheets:", error);
        alert("Advertencia: No se pudieron sincronizar los datos en vivo con Google Sheets. Verifique su conexión a internet.");
    }
}

function obtenerColorPin(textoTotal, estadoFiltroSelect) {
    if (estadoFiltroSelect === "ACTIVO") return "#043B0F";
    if (estadoFiltroSelect === "EN PROCESO DE BAJA") return "#913A14";
    if (estadoFiltroSelect === "DE BAJA") return "#BF1D4B";
    if (estadoFiltroSelect === "SIN REGISTRO") return "#2D2836";

    if (textoTotal.includes("en proceso de baja")) return "#913A14";
    if (textoTotal.includes("de baja")) return "#BF1D4B";
    if (textoTotal.includes("activo")) return "#043B0F";
    if (textoTotal.includes("sin registro")) return "#2D2836";

    return "#211433";
}

function parsearSuministrosATabla(idEstrucutra, textoSuministros, servicioNombre) {
    let filasHtml = "";
    if (!textoSuministros || textoSuministros.includes("Sin registro")) {
        return `<tr class="fila-interactiva" onclick="centrarEnId('${idEstrucutra}')">
            <td><b>${idEstrucutra}</b></td>
            <td>-</td>
            <td>-</td>
            <td>${servicioNombre}</td>
            <td>SIN REGISTRO</td>
        </tr>`;
    }

    let lineas = textoSuministros.split(/<br>|\n|•|⚡/);
    lineas.forEach(linea => {
        let limpio = linea.trim();
        if (limpiadoValido(limpio)) {
            let empresa = "SEDAPAL";
            let upLimpio = limpio.toUpperCase();
            if (upLimpio.includes("PLUZ")) empresa = "PLUZ ENERGÍA";
            else if (upLimpio.includes("LDS")) empresa = "LDS";

            let estado = "ACTIVO";
            if (upLimpio.includes("EN PROCESO DE BAJA")) estado = "EN PROCESO DE BAJA";
            else if (upLimpio.includes("DE BAJA")) estado = "DE BAJA";

            let numSuministro = limpio.split("(")[0].replace("Suministro:", "").trim();
            if (!numSuministro) numSuministro = limpio;

            filasHtml += `<tr class="fila-interactiva" onclick="centrarEnId('${idEstrucutra}')" onmouseenter="resaltarPin('${idEstrucutra}')">
                <td><b>${idEstrucutra}</b></td>
                <td>${numSuministro}</td>
                <td>${empresa}</td>
                <td>${servicioNombre}</td>
                <td>${estado}</td>
            </tr>`;
        }
    });

    return filasHtml || `<tr class="fila-interactiva" onclick="centrarEnId('${idEstrucutra}')"><td><b>${idEstrucutra}</b></td><td>-</td><td>-</td><td>${servicioNombre}</td><td>SIN REGISTRO</td></tr>`;
}

function limpiadoValido(str) {
    return str.length > 3 && (str.includes("Suministro") || str.includes("-") || /\d/.test(str));
}

function cargarTablas(registrosFiltrados) {
    let ordenados = [...registrosFiltrados].sort((a, b) => a.id.localeCompare(b.id));

    let tbodyAgua = "";
    let tbodyLuz = "";

    ordenados.forEach(item => {
        tbodyAgua += parsearSuministrosATabla(item.id, item.agua, "AGUA");
        tbodyLuz += parsearSuministrosATabla(item.id, item.luz, "LUZ");
    });

    document.querySelector("#tabla-agua-content tbody").innerHTML = tbodyAgua;
    document.querySelector("#tabla-luz-content tbody").innerHTML = tbodyLuz;
}

function centrarEnId(idBuscado) {
    let markerObj = mapaRegistrosPorId[idBuscado];
    if (markerObj) {
        map.flyTo(markerObj.getLatLng(), 17, { animate: true, duration: 0.8 });
        markerObj.openPopup();
    }
}

function resaltarPin(idBuscado) {
    let markerObj = mapaRegistrosPorId[idBuscado];
    if (markerObj) {
        markerObj.openPopup();
    }
}

function cargarMapa(estadoFiltroSelect = "TODOS") {
    capaMarcadores.clearLayers();
    todosLosMarcadores = [];
    boundsGlobal = [];
    mapaRegistrosPorId = {};

    registrosSuministros.forEach(item => {
        const contenidoTotal = `${item.id} ${item.tramo} ${item.agua} ${item.luz}`.toLowerCase();
        const colorPin = obtenerColorPin(contenidoTotal, estadoFiltroSelect);

        const customIcon = L.divIcon({
            className: 'pin-etiqueta-contenedor',
            html: `
                <div style="width: 14px; height: 14px; background-color: ${colorPin}; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: inline-block;"></div>
                <div style="background: #FFFFFF; padding: 2px 6px; margin-left: 5px; border-radius: 4px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: bold; color: #1E293B; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: inline-block; white-space: nowrap;">${item.id}</div>
            `,
            iconSize: [80, 24],
            iconAnchor: [7, 12]
        });

        const popupContent = `
            <div style="font-family: 'Inter', sans-serif; min-width: 240px;">
                <div style="font-weight: 700; font-size: 14px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">ESTRUCTURA ID: ${item.id} (${item.tramo})</div>
                <div style="font-size: 12px; color: #1e293b; background: rgba(255,255,255,0.6); padding: 6px 8px; border-radius: 4px; margin-top: 4px;">
                    <b>💧 AGUA (SEDAPAL):</b><br>${item.agua}
                </div>
                <div style="font-size: 12px; color: #1e293b; background: rgba(255,255,255,0.6); padding: 6px 8px; border-radius: 4px; margin-top: 6px;">
                    <b>⚡ ELECTRICIDAD (LUZ):</b><br>${item.luz}
                </div>
            </div>
        `;

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });
        marker.bindPopup(popupContent);
        
        marker.itemData = {
            id: item.id,
            tramo: item.tramo,
            agua: item.agua,
            luz: item.luz,
            textoBusqueda: contenidoTotal
        };

        todosLosMarcadores.push(marker);
        mapaRegistrosPorId[item.id] = marker;
        capaMarcadores.addLayer(marker);
        boundsGlobal.push([item.lat, item.lng]);
    });

    cargarTablas(registrosSuministros);

    if (boundsGlobal.length > 0 && map.getBounds().isValid() === false) {
        map.fitBounds(boundsGlobal, { padding: [50, 50], maxZoom: 15 });
    }
}

function filtrarMapa() {
    const textoBusqueda = document.getElementById('input-buscar').value.toLowerCase().trim();
    const tipoFiltro = document.getElementById('select-tipo').value;
    const empresaFiltro = document.getElementById('select-empresa').value;
    const estadoFiltro = document.getElementById('select-estado').value;

    capaMarcadores.clearLayers();
    let marcadoresVisibles = [];
    let registrosFiltradosTablas = [];

    todosLosMarcadores.forEach(marker => {
        const data = marker.itemData;
        
        const cumpleTexto = textoBusqueda === "" || data.textoBusqueda.includes(textoBusqueda);
        let cumpleFiltros = true;

        if (tipoFiltro === "AGUA" && !data.agua.toLowerCase().includes("suministro")) cumpleFiltros = false;
        if (tipoFiltro === "LUZ" && !data.luz.toLowerCase().includes("suministro")) cumpleFiltros = false;

        if (empresaFiltro !== "TODAS") {
            if (!data.textoBusqueda.includes(empresaFiltro.toLowerCase())) cumpleFiltros = false;
        }

        if (estadoFiltro !== "TODOS") {
            if (!data.textoBusqueda.includes(estadoFiltro.toLowerCase())) cumpleFiltros = false;
        }

        if (cumpleTexto && cumpleFiltros) {
            const colorPin = obtenerColorPin(data.textoBusqueda, estadoFiltro);
            const customIcon = L.divIcon({
                className: 'pin-etiqueta-contenedor',
                html: `
                    <div style="width: 14px; height: 14px; background-color: ${colorPin}; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: inline-block;"></div>
                    <div style="background: #FFFFFF; padding: 2px 6px; margin-left: 5px; border-radius: 4px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: bold; color: #1E293B; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: inline-block; white-space: nowrap;">${data.id}</div>
                `,
                iconSize: [80, 24],
                iconAnchor: [7, 12]
            });
            marker.setIcon(customIcon);

            capaMarcadores.addLayer(marker);
            marcadoresVisibles.push(marker);
            registrosFiltradosTablas.push({
                id: data.id,
                tramo: data.tramo,
                agua: data.agua,
                luz: data.luz
            });
        }
    });

    cargarTablas(registrosFiltradosTablas);

    if (textoBusqueda.length > 0 && marcadoresVisibles.length > 0) {
        if (marcadoresVisibles.length === 1) {
            const unicoMarker = marcadoresVisibles[0];
            map.flyTo(unicoMarker.getLatLng(), 17, { animate: true, duration: 0.8 });
            unicoMarker.openPopup();
        } else {
            const grupoBounds = L.featureGroup(marcadoresVisibles).getBounds();
            if (grupoBounds.isValid()) {
                map.fitBounds(grupoBounds, { padding: [50, 50], maxZoom: 16, animate: true });
            }
        }
    }
}

function limpiarFiltros() {
    document.getElementById('input-buscar').value = "";
    document.getElementById('select-tipo').value = "TODOS";
    document.getElementById('select-empresa').value = "TODAS";
    document.getElementById('select-estado').value = "TODOS";

    cargarMapa("TODOS");
    if (boundsGlobal.length > 0) {
        map.fitBounds(boundsGlobal, { padding: [50, 50], maxZoom: 15, animate: true });
    }
}

// ==========================================
// CONTROL DE VENTANA DE ADVERTENCIA Y LEGAL
// ==========================================
const STORAGE_KEY_DISCLAIMER = "ccm2l_suministros_disclaimer_accepted_v1";

function verificarDisclaimer() {
    const modal = document.getElementById('disclaimer-modal');
    if (!localStorage.getItem(STORAGE_KEY_DISCLAIMER)) {
        if (modal) modal.style.display = 'flex';
    } else {
        if (modal) modal.style.display = 'none';
    }
}

function aceptarDisclaimer() {
    localStorage.setItem(STORAGE_KEY_DISCLAIMER, "true");
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Inicialización general al cargar la ventana
window.onload = function() {
    verificarDisclaimer();
    inicializarMapaBase();
    cargarDatosDesdeHojas();
};
