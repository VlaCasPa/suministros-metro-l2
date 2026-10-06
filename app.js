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
            let idxId = headersAgua.indexOf("ID");
            let idxSum = headersAgua.indexOf("SUMINISTRO");
            let idxEmp = headersAgua.indexOf("EMPRESA");
            let idxEst = headersAgua.indexOf("ESTADO");
            let idxTramo = headersAgua.indexOf("TRAMO");
            let idxTipo = headersAgua.indexOf("TIPO");
            let idxDoc = headersAgua.indexOf("DOCUMENT") !== -1 ? headersAgua.indexOf("DOCUMENT") : (headersAgua.indexOf("COMENTARI") !== -1 ? headersAgua.indexOf("COMENTARI") : -1);
            let idxLat = headersAgua.indexOf("LATITUD");
            let idxLng = headersAgua.indexOf("LONGITUD");

            for (let i = 1; i < filasAgua.length; i++) {
                let cols = filasAgua[i];
                if (cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let tramo = idxTramo !== -1 && cols[idxTramo] ? cols[idxTramo].trim().toUpperCase() : "L2";
                let sumNum = idxSum !== -1 && cols[idxSum] ? cols[idxSum].trim() : "";
                let empresa = idxEmp !== -1 && cols[idxEmp] ? cols[idxEmp].trim() : "SEDAPAL";
                let tipoVal = idxTipo !== -1 && cols[idxTipo] ? cols[idxTipo].trim() : "-";
                let estado = idxEst !== -1 && cols[idxEst] ? cols[idxEst].trim() : "ACTIVO";
                let docVal = idxDoc !== -1 && cols[idxDoc] ? cols[idxDoc].trim() : "-";

                if (sumNum) {
                    datosBrutosAgua.push({ id, suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, tramo });
                }

                let lat = parsearNumeroLatLon(cols[idxLat]);
                let lng = parsearNumeroLatLon(cols[idxLng]);

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = { id, tramo, lat: lat !== null ? lat : -12.0464, lng: lng !== null ? lng : -77.0428, aguaList: [], luzList: [] };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                if (sumNum) {
                    // Formato compacto solicitado: 💧 7598195-1 / Tipo: DEFINITIVO / Estado: ACTIVO
                    mapaEstructuras[id].aguaList.push(`<span class="popup-item-line">💧 <b>${sumNum}</b> / Tipo: <b>${tipoVal}</b> / Estado: <b>${estado}</b></span>`);
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
            let idxTipo = headersLuz.indexOf("TIPO");
            let idxDoc = headersLuz.indexOf("DOCUMENT") !== -1 ? headersLuz.indexOf("DOCUMENT") : (headersLuz.indexOf("COMENTARI") !== -1 ? headersLuz.indexOf("COMENTARI") : -1);
            let idxLat = headersLuz.indexOf("LATITUD");
            let idxLng = headersLuz.indexOf("LONGITUD");

            for (let i = 1; i < filasLuz.length; i++) {
                let cols = filasLuz[i];
                if (cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let tramo = idxTramo !== -1 && cols[idxTramo] ? cols[idxTramo].trim().toUpperCase() : "L2";
                let sumNum = idxSum !== -1 && cols[idxSum] ? cols[idxSum].trim() : "";
                let empresa = idxEmp !== -1 && cols[idxEmp] ? cols[idxEmp].trim() : "PLUZ";
                let tipoVal = idxTipo !== -1 && cols[idxTipo] ? cols[idxTipo].trim() : "-";
                let estado = idxEst !== -1 && cols[idxEst] ? cols[idxEst].trim() : "ACTIVO";
                let docVal = idxDoc !== -1 && cols[idxDoc] ? cols[idxDoc].trim() : "-";

                if (sumNum) {
                    datosBrutosLuz.push({ id, suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, tramo });
                }

                let lat = parsearNumeroLatLon(cols[idxLat]);
                let lng = parsearNumeroLatLon(cols[idxLng]);

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = { id, tramo, lat: lat !== null ? lat : -12.0464, lng: lng !== null ? lng : -77.0428, aguaList: [], luzList: [] };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                if (sumNum) {
                    // Formato compacto solicitado: ⚡ 3201433 (PLUZ) / Tipo: DEFINITIVO / Estado: ACTIVO
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
    }
}

function ordenarListaTramo(a, b) {
    let tramA = (a.tramo || "L2").toUpperCase();
    let tramB = (b.tramo || "L2").toUpperCase();
    if (tramA === "L4" && tramB !== "L4") return -1;
    if (tramA !== "L4" && tramB === "L4") return 1;
    return a.id.localeCompare(b.id);
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

function parsearSuministrosATabla(idEstrucutra, textoSuministros) {
    let filasHtml = "";
    if (!textoSuministros || textoSuministros.includes("Sin registro")) {
        return `<tr class="fila-interactiva" onclick="centrarEnId('${idEstrucutra}')">
            <td><b>${idEstrucutra}</b></td>
            <td>-</td>
            <td>-</td>
            <td class="col-tipo">-</td>
            <td class="col-estado">SIN REGISTRO</td>
        </tr>`;
    }

    // Como ahora usamos etiquetas HTML compactas (<span class="popup-item-line">...), parseamos por partes
    let divisiones = textoSuministros.split('</span>');
    divisiones.forEach(div => {
        if (!div.trim()) return;
        let limpio = div.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        let empresa = "SEDAPAL";
        let upLimpio = limpio.toUpperCase();
        if (upLimpio.includes("PLUZ")) empresa = "PLUZ ENERGÍA";
        else if (upLimpio.includes("LDS")) empresa = "LDS";

        let estado = "ACTIVO";
        if (upLimpio.includes("EN PROCESO DE BAJA")) estado = "EN PROCESO DE BAJA";
        else if (upLimpio.includes("DE BAJA")) estado = "DE BAJA";

        let tipoVal = "-";
        if (limpio.includes("Tipo:")) {
            let partes = limpio.split("Tipo:");
            if (partes[1]) {
                tipoVal = partes[1].split("/")[0].trim();
            }
        }

        let numSuministro = limpio.split("/")[0].replace("💧", "").replace("⚡", "").trim();
        if (!numSuministro) numSuministro = limpio;

        filasHtml += `<tr class="fila-interactiva" onclick="centrarEnId('${idEstrucutra}')" onmouseenter="resaltarPin('${idEstrucutra}')">
            <td><b>${idEstrucutra}</b></td>
            <td>${numSuministro}</td>
            <td>${empresa}</td>
            <td class="col-tipo">${tipoVal}</td>
            <td class="col-estado">${estado}</td>
        </tr>`;
    });

    return filasHtml || `<tr class="fila-interactiva" onclick="centrarEnId('${idEstrucutra}')"><td><b>${idEstrucutra}</b></td><td>-</td><td>-</td><td class="col-tipo">-</td><td class="col-estado">SIN REGISTRO</td></tr>`;
}

function cargarTablas(registrosFiltrados) {
    let ordenados = [...registrosFiltrados].sort(ordenarListaTramo);
    let tbodyAgua = "";
    let tbodyLuz = "";

    ordenados.forEach(item => {
        tbodyAgua += parsearSuministrosATabla(item.id, item.agua);
        tbodyLuz += parsearSuministrosATabla(item.id, item.luz);
    });

    document.querySelector("#tabla-agua-content tbody").innerHTML = tbodyAgua;
    document.querySelector("#tabla-luz-content tbody").innerHTML = tbodyLuz;

    // Actualizar opciones de los desplegables de filtro en tabla dinámicamente
    poblarFiltrosTablas();
    aplicarFiltrosTablaInternos();
}

// Poblar los desplegables de filtros de las tablas con valores únicos existentes
function poblarFiltrosTablas() {
    ['agua', 'luz'].forEach(tipoTab => {
        let selectTipo = document.getElementById(`filtro-tabla-${tipoTab}-tipo`);
        let selectEstado = document.getElementById(`filtro-tabla-${tipoTab}-estado`);
        if (!selectTipo || !selectEstado) return;

        let valTipoActual = selectTipo.value;
        let valEstadoActual = selectEstado.value;

        let tiposSet = new Set();
        let estadosSet = new Set();

        let rows = document.querySelectorAll(`#tabla-${tipoTab}-content tbody tr`);
        rows.forEach(r => {
            let tCell = r.querySelector('.col-tipo');
            let eCell = r.querySelector('.col-estado');
            if (tCell && tCell.innerText.trim() !== '-') tiposSet.add(tCell.innerText.trim());
            if (eCell && eCell.innerText.trim() !== '') estadosSet.add(eCell.innerText.trim());
        });

        let htmlTipo = '<option value="TODOS">Todos</option>';
        Array.from(tiposSet).sort().forEach(t => {
            htmlTipo += `<option value="${t}" ${t === valTipoActual ? 'selected' : ''}>${t}</option>`;
        });
        selectTipo.innerHTML = htmlTipo;

        let htmlEstado = '<option value="TODOS">Todos</option>';
        Array.from(estadosSet).sort().forEach(e => {
            htmlEstado += `<option value="${e}" ${e === valEstadoActual ? 'selected' : ''}>${e}</option>`;
        });
        selectEstado.innerHTML = htmlEstado;
    });
}

// Filtrar las filas de las tablas directamente mediante los desplegables internos
function aplicarFiltrosTablas() {
    aplicarFiltrosTablaInternos();
}

function aplicarFiltrosTablaInternos() {
    ['agua', 'luz'].forEach(tipoTab => {
        let selectTipo = document.getElementById(`filtro-tabla-${tipoTab}-tipo`);
        let selectEstado = document.getElementById(`filtro-tabla-${tipoTab}-estado`);
        if (!selectTipo || !selectEstado) return;

        let filtroTipo = selectTipo.value;
        let filtroEstado = selectEstado.value;

        let rows = document.querySelectorAll(`#tabla-${tipoTab}-content tbody tr`);
        rows.forEach(r => {
            let tCell = r.querySelector('.col-tipo');
            let eCell = r.querySelector('.col-estado');
            if (!tCell || !eCell) return;

            let valTipo = tCell.innerText.trim();
            let valEstado = eCell.innerText.trim();

            let cumpleTipo = (filtroTipo === 'TODOS' || valTipo === filtroTipo);
            let cumpleEstado = (filtroEstado === 'TODOS' || valEstado === filtroEstado);

            if (cumpleTipo && cumpleEstado) {
                r.style.display = '';
            } else {
                r.style.display = 'none';
            }
        });
    });
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
        const contenidoTotal = `${item.id}${item.tramo} ${item.agua}${item.luz}`.toLowerCase();
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

        // Popup rediseñado y compacto solicitado (icono de gotita pequeña, filas ajustadas)
        const popupContent = `
            <div style="font-family: 'Inter', sans-serif; min-width: 250px; font-size: 11.5px; color: #1e293b;">
                <div style="font-weight: 700; font-size: 13px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">ESTRUCTURA ID: ${item.id} (${item.tramo})</div>
                
                <div style="background: #eaf2f8; padding: 5px 7px; border-radius: 4px; margin-bottom: 5px;">
                    <div style="font-weight: 700; font-size: 10px; color: #1e3a4c; margin-bottom: 3px; text-transform: uppercase;">AGUA (SEDAPAL)</div>
                    ${item.agua}
                </div>

                <div style="background: #fef9e7; padding: 5px 7px; border-radius: 4px;">
                    <div style="font-weight: 700; font-size: 10px; color: #78350f; margin-bottom: 3px; text-transform: uppercase;">ELECTRICIDAD (LUZ)</div>
                    ${item.luz}
