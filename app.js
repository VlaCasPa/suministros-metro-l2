// URLs de exportación CSV publicadas desde Google Sheets
const SHEET_AGUA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=0&single=true&output=csv';
const SHEET_LUZ_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=1407636453&single=true&output=csv';

// --- CONFIGURACIÓN DE FIREBASE Y CONTROL DE ACCESO ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js";

// Credenciales oficiales de su proyecto de Firebase (Cerramientos L2L4)
const firebaseConfig = {
    apiKey: "AIzaSyAalo8_88axc-5QAGT8Winp72A1utZwzZg",
    authDomain: "cerramientos-l2l4-b157e.firebaseapp.com",
    projectId: "cerramientos-l2l4-b157e",
    storageBucket: "cerramientos-l2l4-b157e.appspot.com",
    messagingSenderId: "21699345602",
    appId: "1:21699345602:web:f715c1203b7516f0cccf5b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Identificador exacto de este repositorio en la matriz de Firestore
const REPO_ACTUAL = "suministros-metro-l2";

let registrosSuministros = [];
let datosBrutosAgua = [];
let datosBrutosLuz = [];
let map, capaMarcadores, todosLosMarcadores = [], boundsGlobal = [], mapaRegistrosPorId = {};

// Validación de Seguridad y Permisos al Cargar la Aplicación
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const emailUser = user.email;
        try {
            const docRef = doc(db, "usuarios", emailUser);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const datosUsuario = docSnap.data();
                const reposPermitidos = datosUsuario.repositorios_permitidos || [];
                const esAdmin = datosUsuario.es_admin || false;
                const puedeEscribir = datosUsuario.permisos_escritura || false;

                // Validar acceso al repositorio actual
                if (esAdmin || reposPermitidos.includes(REPO_ACTUAL)) {
                    console.log(`Acceso autorizado para ${emailUser} en${REPO_ACTUAL}`);
                    
                    verificarDisclaimer();
                    inicializarMapaBase();
                    cargarDatosDesdeHojas();

                    if (!esAdmin && !puedeEscribir) {
                        aplicarModoSoloLectura();
                    }
                } else {
                    alert(`Acceso denegado: El correo \${emailUser} no cuenta con privilegios para este módulo.`);
                    await signOut(auth);
                    mostrarBotonLogin(`Acceso denegado para \${emailUser}. Inicie sesión con una cuenta autorizada.`);
                }
            } else {
                alert(`El correo \${emailUser} no está registrado en la base de datos de control de accesos.`);
                await signOut(auth);
                mostrarBotonLogin(`La cuenta \${emailUser} no está autorizada.`);
            }
        } catch (error) {
            console.error("Error al validar autorizaciones en Firestore:", error);
            mostrarBotonLogin("Error de conexión con la base de datos de permisos.");
        }
    } else {
        // FUERZA LA APARICIÓN DEL BOTÓN SI NO HAY SESIÓN ACTIVA
        mostrarBotonLogin("Debe iniciar sesión con una cuenta autorizada para acceder al sistema.");
    }
});

// Función auxiliar para mostrar un acceso directo de autenticación si no está logueado
function mostrarBotonLogin(mensaje) {
    document.querySelector("#tabla-agua-content tbody").innerHTML = `
        <tr><td colspan="5" style="text-align:center; padding: 20px;">
            <p style="color: #ef4444; font-weight: bold; margin-bottom: 10px;">\${mensaje}</p>
            <button id="btn-login-google" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                🔑 Iniciar Sesión con Google (Admin / Visor)
            </button>
        </td></tr>`;
    
    document.querySelector("#tabla-luz-content tbody").innerHTML = `<tr><td colspan="5" style="text-align:center;">Esperando autenticación de usuario...</td></tr>`;

    setTimeout(() => {
        const btnLogin = document.getElementById("btn-login-google");
        if (btnLogin) {
            btnLogin.onclick = async () => {
                try {
                    await signInWithPopup(auth, provider);
                } catch (err) {
                    console.error("Error en el inicio de sesión:", err);
                }
            };
        }
    }, 500);
}

function aplicarModoSoloLectura() {
    console.info("Modo de seguridad: Visualización de solo lectura aplicada.");
}

// Inicialización del mapa Leaflet
function inicializarMapaBase() {
    if (map) return;
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

function buscarIndice(headers, posiblesNombres) {
    for (let nombre of posiblesNombres) {
        let idx = headers.indexOf(nombre.toUpperCase());
        if (idx !== -1) return idx;
    }
    return -1;
}

// Carga y procesamiento de datos desde Google Sheets con manejo de errores aislado
async function cargarDatosDesdeHojas() {
    try {
        let csvAguaText = "";
        let csvLuzText = "";

        try {
            const respAgua = await fetch(SHEET_AGUA_URL);
            csvAguaText = await respAgua.text();
        } catch (e) {
            console.warn("No se pudo obtener la hoja de agua:", e);
        }

        try {
            const respLuz = await fetch(SHEET_LUZ_URL);
            csvLuzText = await respLuz.text();
        } catch (e) {
            console.warn("No se pudo obtener la hoja de luz:", e);
        }

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
                    mapaEstructuras[id].aguaList.push(`
                        <div class="popup-item-block">
                            <div class="popup-line-primary">💧 <b>\${sumNum}</b></div>
                            <div class="popup-line-secondary">Tipo: <b>${tipoVal}</b> - Estado: <b>${estado}</b></div>
                        </div>
                    `);
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
                    mapaEstructuras[id].luzList.push(`
                        <div class="popup-item-block">
                            <div class="popup-line-primary">⚡ <b>${sumNum} (${empresa})</b></div>
                            <div class="popup-line-secondary">Tipo: <b>${tipoVal}</b> - Estado: <b>${estado}</b></div>
                        </div>
                    `);
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
        console.error("Error crítico al procesar las hojas:", error);
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
        return `<tr class="fila-interactiva" onclick="centrarEnId('\${idEstrucutra}')">
            <td><b>\${idEstrucutra}</b></td>
            <td>-</td>
            <td>-</td>
            <td class="col-tipo">-</td>
            <td class="col-estado">SIN REGISTRO</td>
        </tr>`;
    }

    let divisiones = textoSuministros.split('</div>\n                        </div>');
    divisiones.forEach(div => {
        if (!div.trim()) return;
        let limpio = div.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (limpio.length < 3) return;

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
                tipoVal = partes[1].split("-")[0].trim();
            }
        }

        let numSuministro = limpio.split("Tipo:")[0].replace("💧", "").replace("⚡", "").trim();
        if (numSuministro.includes("(")) numSuministro = numSuministro.split("(")[0].trim();
        if (!numSuministro) numSuministro = limpio;

        filasHtml += `<tr class="fila-interactiva" onclick="centrarEnId('${idEstrucutra}')" onmouseenter="resaltarPin('${idEstrucutra}')">
            <td><b>\${idEstrucutra}</b></td>
            <td>\${numSuministro}</td>
            <td>\${empresa}</td>
            <td class="col-tipo">\${tipoVal}</td>
            <td class="col-estado">\${estado}</td>
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

    poblarFiltrosTablas();
    aplicarFiltrosTablaInternos();
}

function poblarFiltrosTablas() {
    ['agua', 'luz'].forEach(tipoTab => {
        let selectTipo = document.getElementById(`filtro-tabla-\${tipoTab}-tipo`);
        let selectEstado = document.getElementById(`filtro-tabla-\${tipoTab}-estado`);
        if (!selectTipo || !selectEstado) return;

        let valTipoActual = selectTipo.value;
        let valEstadoActual = selectEstado.value;

        let tiposSet = new Set();
        let estadosSet = new Set();

        let rows = document.querySelectorAll(`#tabla-\${tipoTab}-content tbody tr`);
        rows.forEach(r => {
            let tCell = r.querySelector('.col-tipo');
            let eCell = r.querySelector('.col-estado');
            if (tCell && tCell.innerText.trim() !== '-') tiposSet.add(tCell.innerText.trim());
            if (eCell && eCell.innerText.trim() !== '') estadosSet.add(eCell.innerText.trim());
        });

        let htmlTipo = '<option value="TODOS">Todos</option>';
        Array.from(tiposSet).sort().forEach(t => {
            htmlTipo += `<option value="\${t}" ${t === valTipoActual ? 'selected' : ''}>${t}</option>`;
        });
        selectTipo.innerHTML = htmlTipo;

        let htmlEstado = '<option value="TODOS">Todos</option>';
        Array.from(estadosSet).sort().forEach(e => {
            htmlEstado += `<option value="\${e}" ${e === valEstadoActual ? 'selected' : ''}>${e}</option>`;
        });
        selectEstado.innerHTML = htmlEstado;
    });
}

function aplicarFiltrosTablas() {
    aplicarFiltrosTablaInternos();
}

function aplicarFiltrosTablaInternos() {
    ['agua', 'luz'].forEach(tipoTab => {
        let selectTipo = document.getElementById(`filtro-tabla-\${tipoTab}-tipo`);
        let selectEstado = document.getElementById(`filtro-tabla-\${tipoTab}-estado`);
        if (!selectTipo || !selectEstado) return;

        let filtroTipo = selectTipo.value;
        let filtroEstado = selectEstado.value;

        let rows = document.querySelectorAll(`#tabla-\${tipoTab}-content tbody tr`);
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
    if (!map) inicializarMapaBase();
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
                <div style="width: 1
