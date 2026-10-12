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

// Control de flujo al cargar la página
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

// Validación de Permisos y Verificación de Disclaimer en Firestore con resguardo para admins
async function validarPermisosYDisclaimer(user) {
    const emailUser = user.email.toLowerCase().trim();

    // Resguardo absoluto para superadministradores
    if (emailUser === "zebaxx@gmail.com" || emailUser === "vcasasp@ccmetrolima.com") {
        console.info(`Acceso de superadministrador concedido para: ${emailUser}`);
        verificarDisclaimerUsuario(emailUser);
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
                verificarDisclaimerUsuario(emailUser);
            } else {
                restringirAccesoNoAutorizado();
            }
        } else {
            console.warn(`El usuario ${emailUser} no se encontró en la colección 'usuarios'.`);
            restringirAccesoNoAutorizado();
        }
    } catch (error) {
        console.error("Error al validar contra Firestore:", error);
        restringirAccesoNoAutorizado();
    }
}

function verificarDisclaimerUsuario(emailUser) {
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

                datosBrutosAgua.push({ id, suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal, tramo });

                let lat = idxLat !== -1 ? parsearNumeroLatLon(cols[idxLat]) : null;
                let lng = idxLng !== -1 ? parsearNumeroLatLon(cols[idxLng]) : null;

                if (!mapaEstructuras[id]) {
                    mapaEstructuras[id] = { id, tramo, lat: lat !== null ? lat : -12.0464, lng: lng !== null ? lng : -77.0428, aguaList: [], luzList: [] };
                } else {
                    if (lat !== null && (mapaEstructuras[id].lat === -12.0464 || mapaEstructuras[id].lat === 0)) mapaEstructuras[id].lat = lat;
                    if (lng !== null && (mapaEstructuras[id].lng === -77.0428 || mapaEstructuras[id].lng === 0)) mapaEstructuras[id].lng = lng;
                }

                if (sumNum && sumNum !== "-") {
                    mapaEstructuras[id].aguaList.push({ suministro: sumNum, empresa, estado, tipo: tipoVal, documento: docVal });
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

            for (let i = 1; i < filasLuz.length; i++) {
                let cols = filasLuz[i];
                if (
