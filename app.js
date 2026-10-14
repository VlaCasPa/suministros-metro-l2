// URLs de exportación CSV de suministros (Agua y Luz)
const SHEET_AGUA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=0&single=true&output=csv';
const SHEET_LUZ_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1R6Blx3UV0B_szCUCf2CBG0raycUkue7pBVYl3WRqkHYJ7R1UF_M2_wLR57JhzH9uvfMqFRQlqN6P/pub?gid=1407636453&single=true&output=csv';

// --- CONFIGURACIÓN DE FIREBASE (PROYECTO CENTRAL: MetroL2-IAM-Central) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC1XakVAZLUDq3-240Q_KoYYPU5JKCTjzs",
    authDomain: "metrol2-iam-central.firebaseapp.com",
    projectId: "metrol2-iam-central",
    storageBucket: "metrol2-iam-central.firebasestorage.app",
    messagingSenderId: "78845391762",
    appId: "1:78845391762:web:d64611cd7c4ef65a24074b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const REPO_ACTUAL = "suministros-metro-l2";
const STORAGE_KEY_DISCLAIMER = "ccm2l_suministros_disclaimer_accepted_v1";

let registrosSuministros = [];
let datosBrutosAgua = [];
let datosBrutosLuz = [];
let map, capaMarcadores, todosLosMarcadores = [], boundsGlobal = [], mapaRegistrosPorId = {};
let usuarioActualGlobal = null;

// Control de flujo inicial al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    inicializarMapaBase();
    cargarDatosDesdeHojas();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            usuarioActualGlobal = user;
            ocultarModalLogin();
            await validarPermisosYDisclaimer(user);
        } else {
            mostrarModalLogin();
        }
    });
});

// Funciones de Autenticación
window.loginConGoogle = async function() {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        console.error("Error en Google Auth:", err);
        alert("No se pudo completar el inicio de sesión con Google.");
    }
};

window.loginConCorreoPassword = async function() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        alert("Por favor ingrese su correo corporativo y contraseña.");
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        console.error("Error en Login corporativo:", err);
        alert("Credenciales incorrectas o usuario no registrado.");
    }
};

function mostrarModalLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'flex';
}

function ocultarModalLogin() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.style.display = 'none';
}

async function validarPermisosYDisclaimer(user) {
    const emailUser = user.email.toLowerCase().trim();

    if (emailUser === "zebaxx@gmail.com" || emailUser === "vcasasp@ccmetrolima.com") {
        verificarDisclaimerUsuario();
        return;
    }

    try {
        const docRef = doc(db, "usuarios", emailUser);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const datosUsuario = docSnap.data();
            const esAdmin = datosUsuario.es_admin || false;
            const reposPermitidos = datosUsuario.repositorios_permitidos || datosUsuario.permisos_escritura || [];

            let usuarioAutorizado = (esAdmin || reposPermitidos.includes("todos") || reposPermitidos.includes(REPO_ACTUAL));

            if (usuarioAutorizado) {
                verificarDisclaimerUsuario();
            } else {
                restringirAccesoNoAutorizado();
            }
        } else {
            restringirAccesoNoAutorizado();
        }
    } catch (error) {
        console.error("Error al validar contra Firestore:", error);
        if (emailUser === "zebaxx@gmail.com" || emailUser === "vcasasp@ccmetrolima.com") {
            verificarDisclaimerUsuario();
        } else {
            restringirAccesoNoAutorizado();
        }
    }
}

function verificarDisclaimerUsuario() {
    if (!localStorage.getItem(STORAGE_KEY_DISCLAIMER)) {
        mostrarDisclaimer();
    } else {
        ocultarDisclaimer();
    }
}

async function restringirAccesoNoAutorizado() {
    alert("No puede ingresar consultar con el administrador y diseñador de la micro app");
    await signOut(auth);
    window.location.href = "https://github.com";
}

function mostrarDisclaimer() {
    const modal = document.getElementById('disclaimer-modal');
    if (modal) modal.style.display = 'flex';
}

function ocultarDisclaimer() {
    const modal = document.getElementById('disclaimer-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.3s ease';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
}

window.aceptarDisclaimer = async function() {
    if (!usuarioActualGlobal) return;
    const emailUser = usuarioActualGlobal.email.toLowerCase().trim();
    localStorage.setItem(STORAGE_KEY_DISCLAIMER, "true");

    try {
        const discRef = doc(db, "aceptaciones_disclaimer", emailUser);
        await setDoc(discRef, {
            email: emailUser,
            aceptado: true,
            repositorio: REPO_ACTUAL,
            fecha_aceptacion: serverTimestamp(),
            dispositivo: navigator.userAgent
        }, { merge: true });

        ocultarDisclaimer();
    } catch (err) {
        console.error("Error al registrar aceptación en Firestore:", err);
        ocultarDisclaimer();
    }
};

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

    map.on('click', () => {
        limpiarSeleccionTablas();
    });
}

function limpiarSeleccionTablas() {
    document.querySelectorAll('tr.fila-interactiva').forEach(tr => {
        tr.classList.remove('fila-resaltada');
    });
}

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

async function cargarDatosDesdeHojas() {
    try {
        let csvAguaText = "";
        let csvLuzText = "";

        try {
            const respAgua = await fetch(SHEET_AGUA_URL);
            csvAguaText = await respAgua.text();
        } catch (e) {}

        try {
            const respLuz = await fetch(SHEET_LUZ_URL);
            csvLuzText = await respLuz.text();
        } catch (e) {}

        const filasAgua = parseCSV(csvAguaText);
        const filasLuz = parseCSV(csvLuzText);

        datosBrutosAgua = [];
        datosBrutosLuz = [];
        let mapaEstructuras = {};

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
            
            let idxObra = buscarIndice(headersAgua, ["OBRA", "NOMBRE_OBRA"]);
            if (idxObra === -1 && headersAgua.length > 11) idxObra = 11;

            for (let i = 1; i < filasAgua.length; i++) {
                let cols = filasAgua[i];
                if (idxId === -1 || cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let tramo = (idxTramo !== -1 && cols[idxTramo]) ? cols[idxTramo].trim().toUpperCase() : "L2";
                let sumNum = (idxSum !== -1 && cols[idxSum]) ? cols[idxSum].trim() : "-";
                let empresa = (idxEmp !== -1 && cols[idxEmp]) ? cols[idxEmp].trim().toUpperCase() : "SEDAPAL";
                let tipoVal = (idxTipo !== -1 && cols[idxTipo]) ? cols[idxTipo].trim().toUpperCase() : "-";
                let estado = (idxEst !== -1 && cols[idxEst]) ? cols[idxEst].trim().toUpperCase() : "ACTIVO";
                let docVal = (idxDoc !== -1 && cols[idxDoc]) ? cols[idxDoc].trim() : "-";
                let obraVal = (idxObra !== -1 && cols[idxObra]) ? cols[idxObra].trim() : ((cols[11]) ? cols[11].trim() : "-");

                datosBrutosAgua.push({ id, suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, tramo, obra: obraVal });

                let lat = idxLat !== -1 ? parsearNumeroLatLon(cols[idxLat]) : null;
                let lng = idxLng !== -1 ? parsearNumeroLatLon(cols[idxLng]) : null;

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = { id, tramo, lat: lat !== null ? lat : -12.0464, lng: lng !== null ? lng : -77.0428, aguaList: [], luzList: [] };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                if (sumNum && sumNum !== "-") {
                    mapaEstructuras[id].aguaList.push({ suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, obra: obraVal });
                }
            }
        }

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

            let idxObra = buscarIndice(headersLuz, ["OBRA", "NOMBRE_OBRA"]);
            if (idxObra === -1 && headersLuz.length > 11) idxObra = 11;

            for (let i = 1; i < filasLuz.length; i++) {
                let cols = filasLuz[i];
                if (idxId === -1 || cols.length <= idxId) continue;
                let id = cols[idxId] ? cols[idxId].trim().toUpperCase() : "";
                if (!id) continue;

                let tramo = (idxTramo !== -1 && cols[idxTramo]) ? cols[idxTramo].trim().toUpperCase() : "L2";
                let sumNum = (idxSum !== -1 && cols[idxSum]) ? cols[idxSum].trim() : "-";
                let empresa = (idxEmp !== -1 && cols[idxEmp]) ? cols[idxEmp].trim().toUpperCase() : "PLUZ";
                let tipoVal = (idxTipo !== -1 && cols[idxTipo]) ? cols[idxTipo].trim().toUpperCase() : "-";
                let estado = (idxEst !== -1 && cols[idxEst]) ? cols[idxEst].trim().toUpperCase() : "ACTIVO";
                let docVal = (idxDoc !== -1 && cols[idxDoc]) ? cols[idxDoc].trim() : "-";
                let obraVal = (idxObra !== -1 && cols[idxObra]) ? cols[idxObra].trim() : ((cols[11]) ? cols[11].trim() : "-");

                datosBrutosLuz.push({ id, suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, tramo, obra: obraVal });

                let lat = idxLat !== -1 ? parsearNumeroLatLon(cols[idxLat]) : null;
                let lng = idxLng !== -1 ? parsearNumeroLatLon(cols[idxLng]) : null;

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = { id, tramo, lat: lat !== null ? lat : -12.0464, lng: lng !== null ? lng : -77.0428, aguaList: [], luzList: [] };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                if (sumNum && sumNum !== "-") {
                    mapaEstructuras[id].luzList.push({ suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, obra: obraVal });
                }
            }
        }

        registrosSuministros = Object.values(mapaEstructuras).map(item => ({
            id: item.id,
            tramo: item.tramo,
            lat: item.lat,
            lng: item.lng,
            aguaList: item.aguaList,
            luzList: item.luzList
        }));

        actualizarFiltroObras();
        cargarMapaYSuministros(registrosSuministros);

    } catch (error) {
        console.error("Error crítico al procesar las hojas:", error);
    }
}

function actualizarFiltroObras() {
    const selectObra = document.getElementById('select-obra');
    if (!selectObra) return;

    let obrasSet = new Set();
    registrosSuministros.forEach(item => {
        item.aguaList.forEach(a => { if (a.obra && a.obra !== "-") obrasSet.add(a.obra); });
        item.luzList.forEach(l => { if (l.obra && l.obra !== "-") obrasSet.add(l.obra); });
    });

    let valorActual = selectObra.value;
    let html = '<option value="TODAS">Todas</option>';
    Array.from(obrasSet).sort().forEach(obra => {
        html += `<option value="${obra}">${obra}</option>`;
    });
    selectObra.innerHTML = html;
    selectObra.value = obrasSet.has(valorActual) ? valorActual : "TODAS";
}

function ordenarListaTramo(a, b) {
    let tramA = (a.tramo || "L2").toUpperCase();
    let tramB = (b.tramo || "L2").toUpperCase();
    if (tramA === "L4" && tramB !== "L4") return -1;
    if (tramA !== "L4" && tramB === "L4") return 1;
    return a.id.localeCompare(b.id);
}

function obtenerColorPin(aguaList, luzList) {
    let todos = [...aguaList, ...luzList];
    if (todos.length === 0) return "#2D2836";

    let hayActivo = todos.some(x => x.estado.includes("ACTIVO"));
    let hayEnProceso = todos.some(x => x.estado.includes("EN PROCESO"));
    let hayDeBaja = todos.some(x => x.estado.includes("DE BAJA"));

    if (hayActivo) return "#043B0F";
    if (hayEnProceso) return "#913A14";
    if (hayDeBaja) return "#BF1D4B";
    return "#211433";
}

function renderizarTablas(listaEstructuras) {
    let ordenados = [...listaEstructuras].sort(ordenarListaTramo);
    let tbodyAgua = "";
    let tbodyLuz = "";

    ordenados.forEach(item => {
        if (item.aguaList.length === 0) {
            tbodyAgua += `<tr class="fila-interactiva" data-id="${item.id}" onclick="centrarEnId('${item.id}')">
                <td><b>${item.id}</b></td><td>-</td><td>-</td><td>-</td><td>SIN REGISTRO</td><td>-</td>
            </tr>`;
        } else {
            item.aguaList.forEach(a => {
                tbodyAgua += `<tr class="fila-interactiva" data-id="${item.id}" onclick="centrarEnId('${item.id}')">
                    <td><b>${item.id}</b></td><td>${a.suministro}</td><td>${a.empresa}</td><td>${a.tipo}</td><td>${a.estado}</td><td>${a.obra || '-'}</td>
                </tr>`;
            });
        }

        if (item.luzList.length === 0) {
            tbodyLuz += `<tr class="fila-interactiva" data-id="${item.id}" onclick="centrarEnId('${item.id}')">
                <td><b>${item.id}</b></td><td>-</td><td>-</td><td>-</td><td>SIN REGISTRO</td><td>-</td>
            </tr>`;
        } else {
            item.luzList.forEach(l => {
                tbodyLuz += `<tr class="fila-interactiva" data-id="${item.id}" onclick="centrarEnId('${item.id}')">
                    <td><b>${item.id}</b></td><td>${l.suministro}</td><td>${l.empresa}</td><td>${l.tipo}</td><td>${l.estado}</td><td>${l.obra || '-'}</td>
                </tr>`;
            });
        }
    });

    document.querySelector("#tabla-agua-content tbody").innerHTML = tbodyAgua || `<tr><td colspan="6" style="text-align:center;">Sin registros</td></tr>`;
    document.querySelector("#tabla-luz-content tbody").innerHTML = tbodyLuz || `<tr><td colspan="6" style="text-align:center;">Sin registros</td></tr>`;
}

function centrarEnId(idBuscado) {
    let markerObj = mapaRegistrosPorId[idBuscado];
    if (markerObj) {
        map.flyTo(markerObj.getLatLng(), 17, { animate: true, duration: 0.8 });
        markerObj.openPopup();
        resaltarFilaEnTablas(idBuscado);
    }
}

function resaltarFilaEnTablas(idBuscado) {
    limpiarSeleccionTablas();
    const filasCoincidentes = document.querySelectorAll(`tr.fila-interactiva[data-id="${idBuscado}"]`);
    filasCoincidentes.forEach(tr => {
        tr.classList.add('fila-resaltada');
        tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
}

function cargarMapaYSuministros(listaEstructuras) {
    if (!map) inicializarMapaBase();
    capaMarcadores.clearLayers();
    todosLosMarcadores = [];
    boundsGlobal = [];
    mapaRegistrosPorId = {};

    listaEstructuras.forEach(item => {
        const colorPin = obtenerColorPin(item.aguaList, item.luzList);

        const customIcon = L.divIcon({
            className: 'pin-etiqueta-contenedor',
            html: `
                <div style="width: 14px; height: 14px; background-color: ${colorPin}; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.4); display: inline-block;"></div>
                <div style="background: #FFFFFF; padding: 2px 6px; margin-left: 5px; border-radius: 4px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: bold; color: #1E293B; box-shadow: 0 1px 3px rgba(0,0,0,0.3); display: inline-block; white-space: nowrap;">${item.id}</div>
            `,
            iconSize: [80, 24],
            iconAnchor: [7, 12]
        });

        let aguaHtml = item.aguaList.length > 0 ? item.aguaList.map(a => `
            <div class="popup-item-block">
                <div class="popup-line-primary">💧 <b>${a.suministro} (${a.empresa})</b></div>
                <div class="popup-line-secondary">Tipo: <b>${a.tipo}</b> - Est: <b>${a.estado}</b></div>
                <div class="popup-line-secondary">Obra: <b>${a.obra || '-'}</b></div>
            </div>
        `).join("") : "Sin registro de agua";

        let luzHtml = item.luzList.length > 0 ? item.luzList.map(l => `
            <div class="popup-item-block">
                <div class="popup-line-primary">⚡ <b>${l.suministro} (${l.empresa})</b></div>
                <div class="popup-line-secondary">Tipo: <b>${l.tipo}</b> - Est: <b>${l.estado}</b></div>
                <div class="popup-line-secondary">Obra: <b>${l.obra || '-'}</b></div>
            </div>
        `).join("") : "Sin registro de luz";

        const popupContent = `
            <div style="font-family: 'Inter', sans-serif; width: 250px; max-width: 100%; font-size: 11px; color: #1e293b; box-sizing: border-box;">
                <div style="font-weight: 700; font-size: 12px; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 3px; margin-bottom: 5px;">ESTRUCTURA ID: ${item.id} (${item.tramo})</div>
                <div style="background: #eaf2f8; padding: 5px 6px; border-radius: 4px; margin-bottom: 4px;">
                    <div style="font-weight: 700; font-size: 9px; color: #1e3a4c; margin-bottom: 2px; text-transform: uppercase;">AGUA (SEDAPAL)</div>
                    ${aguaHtml}
                </div>
                <div style="background: #fef9e7; padding: 5px 6px; border-radius: 4px;">
                    <div style="font-weight: 700; font-size: 9px; color: #78350f; margin-bottom: 2px; text-transform: uppercase;">ELECTRICIDAD (LUZ)</div>
                    ${luzHtml}
                </div>
            </div>
        `;

        const marker = L.marker([item.lat, item.lng], { icon: customIcon });
        marker.bindPopup(popupContent);
        
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            resaltarFilaEnTablas(item.id);
        });

        marker.itemData = item;

        todosLosMarcadores.push(marker);
        mapaRegistrosPorId[item.id] = marker;
        capaMarcadores.addLayer(marker);
        boundsGlobal.push([item.lat, item.lng]);
    });

    renderizarTablas(listaEstructuras);

    if (boundsGlobal.length > 0) {
        map.fitBounds(boundsGlobal, { padding: [40, 40], maxZoom: 14, animate: false });
    }
}

window.filtrarMapa = function() {
    const textoBusqueda = document.getElementById('input-buscar').value.toLowerCase().trim();
    const tipoFiltro = document.getElementById('select-tipo').value;
    const empresaFiltro = document.getElementById('select-empresa').value;
    const estadoFiltro = document.getElementById('select-estado').value;
    const obraFiltro = document.getElementById('select-obra').value;

    let filtrados = registrosSuministros.filter(item => {
        let matchTexto = (textoBusqueda === "" || item.id.toLowerCase().includes(textoBusqueda) || 
            item.aguaList.some(a => a.suministro.toLowerCase().includes(textoBusqueda)) || 
            item.luzList.some(l => l.suministro.toLowerCase().includes(textoBusqueda)));

        let todosServicios = [...item.aguaList, ...item.luzList];

        let matchTipo = (tipoFiltro === "TODOS" || todosServicios.some(s => s.tipo.includes(tipoFiltro)));
        let matchEmpresa = (empresaFiltro === "TODAS" || todosServicios.some(s => s.empresa.includes(empresaFiltro)));
        let matchEstado = (estadoFiltro === "TODOS" || todosServicios.some(s => s.estado.includes(estadoFiltro)));
        let matchObra = (obraFiltro === "TODAS" || todosServicios.some(s => s.obra === obraFiltro));

        return matchTexto && matchTipo && matchEmpresa && matchEstado && matchObra;
    });

    capaMarcadores.clearLayers();
    let marcadoresVisibles = [];

    todosLosMarcadores.forEach(marker => {
        if (filtrados.some(f => f.id === marker.itemData.id)) {
            capaMarcadores.addLayer(marker);
            marcadoresVisibles.push(marker);
        }
    });

    renderizarTablas(filtrados);

    if (marcadoresVisibles.length > 0) {
        if (marcadoresVisibles.length === 1) {
            map.flyTo(marcadoresVisibles[0].getLatLng(), 17, { animate: true, duration: 0.8 });
            marcadoresVisibles[0].openPopup();
            resaltarFilaEnTablas(marcadoresVisibles[0].itemData.id);
        } else {
            let grupoBounds = L.featureGroup(marcadoresVisibles).getBounds();
            if (grupoBounds.isValid()) {
                map.fitBounds(grupoBounds, { padding: [50, 50], maxZoom: 16, animate: true });
            }
        }
    }
}

window.limpiarFiltros = function() {
    document.getElementById('input-buscar').value = "";
    document.getElementById('select-tipo').value = "TODOS";
    document.getElementById('select-empresa').value = "TODAS";
    document.getElementById('select-estado').value = "TODOS";
    document.getElementById('select-obra').value = "TODAS";

    cargarMapaYSuministros(registrosSuministros);
    limpiarSeleccionTablas();
    if (boundsGlobal.length > 0) {
        map.fitBounds(boundsGlobal, { padding: [40, 40], maxZoom: 14, animate: true });
    }
}

window.exportarExcel = function(tipoServicio) {
    let datosOriginales = tipoServicio === 'AGUA' ? datosBrutosAgua : datosBrutosLuz;
    let tituloReporte = tipoServicio === 'AGUA' ? 'REPORTE DE SUMINISTROS DE AGUA - CCM2L' : 'REPORTE DE SUMINISTROS DE ELECTRICIDAD - CCM2L';
    let datosOrdenados = [...datosOriginales].sort((a,b) => a.id.localeCompare(b.id));

    let ahora = new Date();
    let fechaStr = ahora.toLocaleDateString('es-PE');
    let horaStr = ahora.toLocaleTimeString('es-PE');
    let timestampStr = `Fecha y Hora del Reporte: ${fechaStr} - ${horaStr}`;

    let wsData = [
        [tituloReporte],
        [timestampStr],
        [],
        ["ID", "SUMINISTRO", "EMPRESA", "ESTADO", "TIPO", "DOCUMENTO", "OBRA"]
    ];

    datosOrdenados.forEach(item => {
        wsData.push([item.id, item.suministro, item.empresa, item.estado, item.tipo, item.documento, item.obra]);
    });

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{wch: 12}, {wch: 18}, {wch: 15}, {wch: 22}, {wch: 15}, {wch: 25}, {wch: 20}];

    XLSX.utils.book_append_sheet(wb, ws, tipoServicio === 'AGUA' ? "Suministros Agua" : "Suministros Luz");
    XLSX.writeFile(wb, tipoServicio === 'AGUA' ? "Reporte_Suministros_Agua_CCM2L.xlsx" : "Reporte_Suministros_Electricidad_CCM2L.xlsx");
}

window.centrarEnId = centrarEnId;
