// Base de datos completa e íntegra de Suministros (L2 & L4)
const registrosSuministros = [
    { id: "DANSEY", tramo: "L2", lat: -12.047209, lng: -77.06329, agua: "• Suministro: 5652759-1 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 2047271 (PLUZ) - Estado: ACTIVO" },
    { id: "DOVELAS", tramo: "L4", lat: -12.03071, lng: -77.102434, agua: "• Suministro: 7250007-7 (SEDAPAL) - Estado: ACTIVO", luz: "Sin registro de luz" },
    { id: "E01", tramo: "L2", lat: -12.05317, lng: -77.137623, agua: "• Suministro: 7355727-4 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7752475-9 (SEDAPAL) - Estado: EN PROCESO DE BAJA | Obs: En proceso de baja (octubre de 2026)", luz: "⚡ Suministro: 3007041 (PLUZ) - Estado: ACTIVO" },
    { id: "E02", tramo: "L2", lat: -12.058771, lng: -77.125859, agua: "• Suministro: 7364644-0 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7841390-3 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3007043 (PLUZ) - Estado: ACTIVO" },
    { 
        id: "E03", 
        tramo: "L2", 
        lat: -12.056998, 
        lng: -77.115102, 
        agua: "• Suministro: 7308469-1 (SEDAPAL) - Estado: EN PROCESO DE BAJA | Obs: En proceso de baja (setiembre de 2026)<br>" +
              "• Suministro: 7688375 (SEDAPAL) - Estado: ACTIVO<br>" +
              "• Suministro: 7340529-2 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 1)<br>" +
              "• Suministro: 7340545-8 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 2)<br>" +
              "• Suministro: 7340549-0 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 3)<br>" +
              "• Suministro: 7340553-2 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 4)<br>" +
              "• Suministro: 7340565-6 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 5)<br>" +
              "• Suministro: 7340568-0 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 6)<br>" +
              "• Suministro: 7340569-8 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 7)<br>" +
              "• Suministro: 7340578-9 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 8)<br>" +
              "• Suministro: 7340579-7 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 9)<br>" +
              "• Suministro: 7340580-5 (SEDAPAL) - Estado: DE BAJA | Obs: E03(POZO 10)", 
        luz: "⚡ Suministro: 3036716 (PLUZ) - Estado: ACTIVO" 
    },
    { id: "E04", tramo: "L2", lat: -12.054839, lng: -77.104798, agua: "• Suministro: 7173036-0 (SEDAPAL) - Estado: ACTIVO | Obs: TBM<br>• Suministro: 7451587-5 (SEDAPAL) - Estado: DE BAJA<br>• Suministro: 7819600 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3239253 (PLUZ) - Estado: ACTIVO" },
    { id: "E05", tramo: "L2", lat: -12.053715, lng: -77.098749, agua: "• Suministro: 7688375-0 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7598239-7 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7998992 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3082040 (PLUZ) - Estado: ACTIVO" },
    { id: "E06", tramo: "L2", lat: -12.051975, lng: -77.088926, agua: "• Suministro: 7465247-0 (SEDAPAL) - Estado: EN PROCESO DE BAJA<br>• Suministro: 7876299-4 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3073811 (PLUZ) - Estado: ACTIVO" },
    { id: "E07", tramo: "L2", lat: -12.055653, lng: -77.081683, agua: "• Suministro: 7734738-3 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3245476 (PLUZ) - Estado: ACTIVO | Obs: EN TRÁMITE" },
    { id: "E08", tramo: "L2", lat: -12.059411, lng: -77.075806, agua: "• Suministro: 7554853-7 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3082020 (PLUZ) - Estado: ACTIVO" },
    { id: "E09", tramo: "L2", lat: -12.057899, lng: -77.068359, agua: "• Suministro: 7554875-0 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7555018-6 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3082036 (PLUZ) - Estado: ACTIVO" },
    { id: "E10", tramo: "L2", lat: -12.056323, lng: -77.060617, agua: "• Suministro: 7463219-1 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7485272-4 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3073881 (PLUZ) - Estado: ACTIVO" },
    { id: "E11", tramo: "L2", lat: -12.057149, lng: -77.051716, agua: "• Suministro: 7422135-9 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7448336-3 (SEDAPAL) - Estado: ACTIVO", luz: "Sin registro de luz" },
    { id: "E12", tramo: "L2", lat: -12.059528, lng: -77.043823, agua: "• Suministro: 7493628-7 (SEDAPAL) - Estado: EN PROCESO DE BAJA<br>• Suministro: 7809845 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 7493636-0 (LDS) - Estado: ACTIVO<br>⚡ Suministro: 3012442 (PLUZ) - Estado: ACTIVO" },
    { id: "E13", tramo: "L2", lat: -12.059956, lng: -77.037686, agua: "• Suministro: 7721849-3 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 2208942 (LDS) - Estado: ACTIVO" },
    { id: "E14", tramo: "L2", lat: -12.063359, lng: -77.030104, agua: "• Suministro: 7272623-5 (SEDAPAL) - Estado: EN PROCESO DE BAJA", luz: "⚡ Suministro: 2021606 (LDS) - Estado: ACTIVO" },
    { id: "E15", tramo: "L2", lat: -12.062086, lng: -77.021036, agua: "• Suministro: 7272659-9 (SEDAPAL) - Estado: EN PROCESO DE BAJA", luz: "⚡ Suministro: 2021788 (LDS) - Estado: ACTIVO" },
    { id: "E16", tramo: "L2", lat: -12.060985, lng: -77.012342, agua: "• Suministro: 7488442-0 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 2111218 (LDS) - Estado: ACTIVO" },
    { id: "E17", tramo: "L2", lat: -12.061157, lng: -77.005765, agua: "• Suministro: 6798173-8 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 7538922-1 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1952393 (LDS) - Estado: ACTIVO" },
    { id: "E18", tramo: "L2", lat: -12.063552, lng: -76.998785, agua: "• Suministro: 7175039-2 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 6804834 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1937692 (LDS) - Estado: ACTIVO" },
    { id: "E19", tramo: "L2", lat: -12.064306, lng: -76.990045, agua: "• Suministro: 7172296-1 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 1933292 (LDS) - Estado: DE BAJA" },
    { id: "E20", tramo: "L2", lat: -12.058934, lng: -76.974416, agua: "• Suministro: 6779636-7 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799035 (LDS) - Estado: DE BAJA" },
    { id: "E21", tramo: "L2", lat: -12.054392, lng: -76.96393, agua: "• Suministro: 6687086-6 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799042 (LDS) - Estado: DE BAJA" },
    { id: "E22", tramo: "L2", lat: -12.051145, lng: -76.956416, agua: "• Suministro: 6763499-8 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 1799048 (LDS) - Estado: ACTIVO" },
    { id: "E23", tramo: "L2", lat: -12.047288, lng: -76.946672, agua: "• Suministro: 7272709-2 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799050 (LDS) - Estado: ACTIVO" },
    { id: "E24", tramo: "L2", lat: -12.044375, lng: -76.939326, agua: "• Suministro: 6687010-6 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799069 (LDS) - Estado: DE BAJA" },
    { id: "E25", tramo: "L2", lat: -12.038579, lng: -76.932239, agua: "• Suministro: 7595513-8 (SEDAPAL) - Estado: ACTIVO<br>• Suministro: 6972664-4 (SEDAPAL) - Estado: EN PROCESO DE BAJA", luz: "⚡ Suministro: 1989468 (LDS) - Estado: ACTIVO" },
    { id: "E26", tramo: "L2", lat: -12.03194, lng: -76.926552, agua: "• Suministro: 7600628-7 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 1967385 (LDS) - Estado: DE BAJA" },
    { id: "E27", tramo: "L2", lat: -12.025576, lng: -76.91868, agua: "• Suministro: 7204169-2 (SEDAPAL) - Estado: ACTIVO", luz: "Sin registro de luz" },
    { id: "E4-01", tramo: "L4", lat: -11.99855, lng: -77.12233, agua: "• Suministro: 7598195-1 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3201433 (PLUZ) - Estado: ACTIVO" },
    { id: "E4-02", tramo: "L4", lat: -12.00319, lng: -77.11523, agua: "• Suministro: 7639261-2 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3268265 (PLUZ) - Estado: ACTIVO" },
    { id: "OIP", tramo: "L2", lat: -12.051294, lng: -76.956325, agua: "• Suministro: 4042155-4 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 393475 (LDS) - Estado: DE BAJA" },
    { id: "PTSA", tramo: "L2", lat: -12.044084, lng: -76.943164, agua: "• Suministro: 2400749-4 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799074 (PLUZ) - Estado: ACTIVO" },
    { id: "PV01", tramo: "L2", lat: -12.056268, lng: -77.13269, agua: "• Suministro: 7357448-5 (SEDAPAL) - Estado: EN PROCESO DE BAJA", luz: "⚡ Suministro: 3094650 (PLUZ) - Estado: ACTIVO" },
    { id: "PV01BIS", tramo: "L2", lat: -12.05143, lng: -77.140434, agua: "• Suministro: 7387254-1 (SEDAPAL) - Estado: EN PROCESO DE BAJA", luz: "Sin registro de luz" },
    { id: "PV02", tramo: "L2", lat: -12.058524, lng: -77.121864, agua: "• Suministro: 7368942-4 (SEDAPAL) - Estado: EN PROCESO DE BAJA", luz: "⚡ Suministro: 3094631 (PLUZ) - Estado: ACTIVO" },
    { id: "PV03", tramo: "L2", lat: -12.05585, lng: -77.110534, agua: "• Suministro: 7340583-9 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 3094636 (PLUZ) - Estado: ACTIVO" },
    { id: "PV19", tramo: "L2", lat: -12.063312, lng: -76.983797, agua: "• Suministro: 6687308-4 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1918271 (LDS) - Estado: DE BAJA" },
    { id: "PV20", tramo: "L2", lat: -12.056814, lng: -76.969038, agua: "• Suministro: 6687222-7 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799039 (LDS) - Estado: DE BAJA" },
    { id: "PV22", tramo: "L2", lat: -12.048972, lng: -76.951528, agua: "• Suministro: 6687107-0 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799049 (LDS) - Estado: DE BAJA" },
    { id: "PV23", tramo: "L2", lat: -12.046101, lng: -76.944065, agua: "• Suministro: S/N (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799067 (LDS) - Estado: DE BAJA" },
    { id: "PV24", tramo: "L2", lat: -12.041833, lng: -76.935185, agua: "• Suministro: 6687094-0 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799071 (LDS) - Estado: DE BAJA" },
    { id: "PV25", tramo: "L2", lat: -12.035039, lng: -76.928916, agua: "• Suministro: 7031829-0 (SEDAPAL) - Estado: DE BAJA", luz: "Sin registro de luz" },
    { id: "PV26", tramo: "L2", lat: -12.028923, lng: -76.923709, agua: "• Suministro: 7031829-0 (SEDAPAL) - Estado: DE BAJA", luz: "Sin registro de luz" },
    { id: "PV4-01BIS", tramo: "L4", lat: -11.997484, lng: -77.124984, agua: "• Suministro: 7561536-9 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3201434 (PLUZ) - Estado: EN PROCESO DE BAJA" },
    { id: "TR PTBN", tramo: "L4", lat: -12.011599, lng: -77.109765, agua: "• Suministro: 7590786-5 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3247344 (PLUZ) - Estado: ACTIVO" },
    { id: "PV21", tramo: "L2", lat: -12.053195, lng: -76.96043, agua: "• Suministro: 6687214-4 (SEDAPAL) - Estado: DE BAJA", luz: "⚡ Suministro: 1799045 (LDS) - Estado: DE BAJA" },
    { id: "PV19BIS", tramo: "L2", lat: -12.060771, lng: -76.978867, agua: "Sin registro de agua", luz: "⚡ Suministro: 1799022 (LDS) - Estado: DE BAJA" },
    { id: "PV18", tramo: "L2", lat: -12.064303, lng: -76.993225, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV17", tramo: "L2", lat: -12.062815, lng: -77.002195, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV16", tramo: "L2", lat: -12.060772, lng: -77.009558, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV15", tramo: "L2", lat: -12.06189, lng: -77.018183, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV14", tramo: "L2", lat: -12.062752, lng: -77.024779, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV13", tramo: "L2", lat: -12.06231, lng: -77.03484, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV12", tramo: "L2", lat: -12.060063, lng: -77.041339, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV11", tramo: "L2", lat: -12.058098, lng: -77.048067, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "TVPM", tramo: "L2", lat: -12.057804, lng: -77.049756, agua: "Sin registro de agua", luz: "⚡ Suministro: 3073917 (PLUZ) - Estado: ACTIVO" },
    { id: "PV10", tramo: "L2", lat: -12.056365, lng: -77.05527, agua: "Sin registro de agua", luz: "⚡ Suministro: 3322903 (PLUZ) - Estado: ACTIVO" },
    { id: "PV09", tramo: "L2", lat: -12.056814, lng: -77.064208, agua: "Sin registro de agua", luz: "⚡ Suministro: 3271039 (PLUZ) - Estado: ACTIVO" },
    { id: "PV08", tramo: "L2", lat: -12.058801, lng: -77.071563, agua: "Sin registro de agua", luz: "⚡ Suministro: 3273077 (PLUZ) - Estado: ACTIVO" },
    { id: "PV07", tramo: "L2", lat: -12.057601, lng: -77.079962, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV06", tramo: "L2", lat: -12.053683, lng: -77.084797, agua: "Sin registro de agua", luz: "⚡ Suministro: 3327868 (PLUZ) - Estado: ACTIVO" },
    { id: "TVOB", tramo: "L2", lat: -12.052532, lng: -77.092342, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV05", tramo: "L2", lat: -12.05311, lng: -77.094556, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV04", tramo: "L2", lat: -12.054469, lng: -77.101645, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-01", tramo: "L4", lat: -11.99973, lng: -77.118856, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-02", tramo: "L4", lat: -12.007026, lng: -77.113297, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-03", tramo: "L4", lat: -12.015618, lng: -77.10913, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-04", tramo: "L4", lat: -12.024552, lng: -77.104604, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-05", tramo: "L4", lat: -12.030546, lng: -77.101726, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-06", tramo: "L4", lat: -12.038539, lng: -77.099752, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-07", tramo: "L4", lat: -12.048131, lng: -77.098171, agua: "Sin registro de agua", luz: "Sin registro de luz" },
    { id: "PV4-07BIS", tramo: "L4", lat: -12.055363, lng: -77.097829, agua: "• Suministro: 7946749-4 (SEDAPAL) - Estado: ACTIVO", luz: "Sin registro de luz" },
    { id: "E4-03", tramo: "L4", lat: -12.0122, lng: -77.11075, agua: "• Suministro: 7967302 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3267224 (PLUZ) - Estado: EN PROCESO DE BAJA" },
    { id: "E4-04", tramo: "L4", lat: -12.02084, lng: -77.10647, agua: "• Suministro: 7840736-8 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3316245 (PLUZ) - Estado: ACTIVO" },
    { id: "E4-05", tramo: "L4", lat: -12.02666, lng: -77.10349, agua: "• Suministro: 8014035 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3255910 (PLUZ) - Estado: ACTIVO" },
    { id: "E4-06", tramo: "L4", lat: -12.035094, lng: -77.099838, agua: "• Suministro: 8014078 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3292468 (PLUZ) - Estado: ACTIVO" },
    { id: "E4-07", tramo: "L4", lat: -12.044236, lng: -77.098772, agua: "Sin registro de agua", luz: "⚡ Suministro: 3255922 (PLUZ) - Estado: ACTIVO" },
    { id: "E4-08", tramo: "L4", lat: -12.052404, lng: -77.098087, agua: "• Suministro: 7925870-3 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3328906 (PLUZ) - Estado: ACTIVO" },
    { id: "PTBN", tramo: "L4", lat: -12.009484, lng: -77.106813, agua: "• Suministro: 7590786-5 (SEDAPAL) - Estado: ACTIVO", luz: "⚡ Suministro: 3256883 (PLUZ) - Estado: ACTIVO" }
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
let boundsGlobal = [];

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

function cargarMapa(estadoFiltroSelect = "TODOS") {
    capaMarcadores.clearLayers();
    todosLosMarcadores = [];
    boundsGlobal = [];

    registrosSuministros.forEach(item => {
        // Concatenación robusta de todo el contenido del objeto para garantizar lectura en la búsqueda
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
        capaMarcadores.addLayer(marker);
        boundsGlobal.push([item.lat, item.lng]);
    });

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

    todosLosMarcadores.forEach(marker => {
        const data = marker.itemData;
        
        // Verificación directa sobre la cadena completa unificada en minúsculas
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
        }
    });

    // Ajuste de zoom automático para cualquier ID o número de suministro buscado
    if (textoBusqueda.length > 0 && marcadoresVisibles.length > 0) {
        if (marcadoresVisibles.length === 1) {
            const unicoMarker = marcadoresVisibles[0];
            map.setView(unicoMarker.getLatLng(), 17, { animate: true });
            unicoMarker.openPopup();
        } else {
            const grupoBounds = L.featureGroup(marcadoresVisibles).getBounds();
            if (grupoBounds.isValid()) {
                map.fitBounds(grupoBounds, { padding: [50, 50], maxZoom: 16 });
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
}

window.onload = function() {
    cargarMapa("TODOS");
};
