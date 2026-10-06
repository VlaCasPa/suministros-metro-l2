// URLs de exportación CSV publicadas desde Google Sheets
const SHEET_AGUA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=0&single=true&output=csv';
const SHEET_LUZ_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=1407636453&single=true&output=csv';

let registrosSuministros = [];
let datosBrutosAgua = [];
let datosBrutosLuz = [];
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

function parsearNumeroLatLon(val) {
    if (!val) return null;
    let limpio = val.trim().replace(',', '.');
    let num = parseFloat(limpio);
    return isNaN(num) ? null : num;
}

// Función auxiliar segura para buscar índices de columnas
function buscarIndice(headers, posiblesNombres) {
    for (let nombre of posiblesNombres) {
        let idx = headers.indexOf(nombre.toUpperCase());
        if (idx !== -1) return idx;
    }
    return -1;
}

// Carga y procesamiento de datos desde Google Sheets
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

        datosBrutosAgua = [];
        datosBrutosLuz = [];
        let mapaEstructuras = {};

        // Procesar Hoja de Agua
        if (filasAgua.length > 1) {
            let headersAgua = filasAgua[0].map(h => h.trim().toUpperCase());
            let idxId = buscarIndice(headersAgua, ["ID", "ESTRUCTURA", "CODIGO"]);
            let idxSum = buscarIndice(headersAgua, ["SUMINISTRO", "NUM_SUMINISTRO", "NUMERO"]);
            let idxEmp = buscarIndice(headersAgua, ["EMPRESA", "CONCESIONARIA"]);
            let idxEst = buscarIndice(headersAgua, ["ESTADO", "SITUACION"]);
            let idxTramo = buscarIndice(headersAgua, ["TRAMO", "SECTOR"]);
            let idxTipo = buscarIndice(headersAgua, ["TIPO", "TIPO_SUMINISTRO"]);
            let idxDoc = buscarIndice(headersAgua, ["DOCUMENT", "COMENTARI", "OBSERVACION", "DOC"]);
            let idxLat = buscarIndice(headersAgua, ["LATITUD", "LAT"]);
            let idxLng = buscarIndice(headersAgua, ["LONGITUD", "LONG", "LNG"]);

            for (let i = 1; i < filasAgua.length; i++) {
                let cols = filasAgua[i];
                if (idxId === -1 || cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let tramo = (idxTramo !== -1 && cols[idxTramo]) ? cols[idxTramo].trim().toUpperCase() : "L2";
                let sumNum = (idxSum !== -1 && cols[idxSum]) ? cols[idxSum].trim() : "";
                let empresa = (idxEmp !== -1 && cols[idxEmp]) ? cols[idxEmp].trim() : "SEDAPAL";
                let tipoVal = (idxTipo !== -1 && cols[idxTipo]) ? cols[idxTipo].trim() : "-";
                let estado = (idxEst !== -1 && cols[idxEst]) ? cols[idxEst].trim() : "ACTIVO";
                let docVal = (idxDoc !== -1 && cols[idxDoc]) ? cols[idxDoc].trim() : "-";

                if (sumNum) {
                    datosBrutosAgua.push({ id, suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, tramo });
                }

                let lat = idxLat !== -1 ? parsearNumeroLatLon(cols[idxLat]) : null;
                let lng = idxLng !== -1 ? parsearNumeroLatLon(cols[idxLng]) : null;

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = { id, tramo, lat: lat !== null ? lat : -12.0464, lng: lng !== null ? lng : -77.0428, aguaList: [], luzList: [] };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                if (sumNum) {
                    mapaEstructuras[id].aguaList.push(`<span class="popup-item-line">💧 <b>${sumNum}</b> / Tipo: <b>${tipoVal}</b> / Estado: <b>${estado}</b></span>`);
                }
            }
        }

        // Procesar Hoja de Luz
        if (filasLuz.length > 1) {
            let headersLuz = filasLuz[0].map(h => h.trim().toUpperCase());
            let idxId = buscarIndice(headersLuz, ["ID", "ESTRUCTURA", "CODIGO"]);
            let idxSum = buscarIndice(headersLuz, ["SUMINISTRO", "NUM_SUMINISTRO", "NUMERO"]);
            let idxEmp = buscarIndice(headersLuz, ["EMPRESA", "CONCESIONARIA"]);
            let idxEst = buscarIndice(headersLuz, ["ESTADO", "SITUACION"]);
            let idxTramo = buscarIndice(headersLuz, ["TRAMO", "SECTOR"]);
            let idxTipo = buscarIndice(headersLuz, ["TIPO", "TIPO_SUMINISTRO"]);
            let idxDoc = buscarIndice(headersLuz, ["DOCUMENT", "COMENTARI", "OBSERVACION", "DOC"]);
            let idxLat = buscarIndice(headersLuz, ["LATITUD", "LAT"]);
            let idxLng = buscarIndice(headersLuz, ["LONGITUD", "LONG", "LNG"]);

            for (let i = 1; i < filasLuz.length; i++) {
                let cols = filasLuz[i];
                if (idxId === -1 || cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let tramo = (idxTramo !== -1 && cols[idxTramo]) ? cols[idxTramo].trim().toUpperCase() : "L2";
                let sumNum = (idxSum !== -1 && cols[idxSum]) ? cols[idxSum].trim() : "";
                let empresa = (idxEmp !== -1 && cols[idxEmp]) ? cols[idxEmp].trim() : "PLUZ";
                let tipoVal = (idxTipo !== -1 && cols[idxTipo]) ? cols[idxTipo].trim() : "-";
                let estado = (idxEst !== -1 && cols[idxEst]) ? cols[idxEst].trim() : "ACTIVO";
                let docVal = (idxDoc !== -1 && cols[idxDoc]) ? cols[idxDoc].trim() : "-";

                if (sumNum) {
                    datosBrutosLuz.push({ id, suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, tramo });
                }

                let lat = idxLat !== -1 ? parsearNumeroLatLon(cols[idxLat]) : null;
                let lng = idxLng !== -1 ? parsearNumeroLatLon(cols[idxLng]) : null;

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = { id, tramo, lat: lat !== null ? lat : -12.0464, lng: lng !== null ? lng : -77.0428, aguaList: [], luzList: [] };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                if (sumNum) {
                    mapaEstructuras[id].luzList.push(`<span class="popup-item-line">⚡ <b>${sumNum} (${empresa})</b> / Tipo: <b>${tipoVal}</b> / Estado: <b>${estado}</b></span>`);
                }
            }
        }

        registrosSuministros = Object.values(mapaEstructuras).map(item => ({
            id: item.id,
            tramo: item.tramo,
            lat: item.lat,
            lng: item.lng,
            agua: item.aguaList.length > 0 ? item.aguaList.join("") : "Sin registro de agua",
            luz: item.luzList.length > 0 ? item.luzList.join("") : "Sin registro de luz"
        }));

        cargarMapa("TODOS");

    } catch (error) {
        console.error("Error al cargar datos desde Google Sheets:", error);
        alert("Advertencia: No se pudieron sincronizar los datos en vivo con Google Sheets.");
