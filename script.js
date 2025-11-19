/* ======================
   CARGAR DATOS AL INICIAR
====================== */
document.addEventListener("DOMContentLoaded", () => {
    cargarModoOscuro();
    cargarDesdeLocalStorage();
    actualizarTotales();
});

/* ======================
   PREVISUALIZAR TOTAL EN TIEMPO REAL
====================== */
setInterval(() => {
    const exportCantidad = Number(document.getElementById("cantidadExport").value || 0);

    let descarte1 = Number(document.querySelector("#filaDescarte1 .cantidadDescarte")?.value || 0);
    let descarte2 = Number(document.querySelector("#filaDescarte2 .cantidadDescarte")?.value || 0);

    document.getElementById("totalPreview").value =
        exportCantidad + descarte1 + descarte2 || "";
}, 300);

/* ======================
   MOSTRAR/OCULTAR DESCARTES
====================== */
document.getElementById("tipoDescarte").addEventListener("change", function () {
    const tipo = this.value;
    const fila1 = document.getElementById("filaDescarte1");
    const fila2 = document.getElementById("filaDescarte2");

    fila1.classList.add("oculto");
    fila2.classList.add("oculto");

    if (tipo === "Hass") fila1.classList.remove("oculto");
    if (tipo === "Edranol") fila2.classList.remove("oculto");
    if (tipo === "Surtida") {
        fila1.classList.remove("oculto");
        fila2.classList.remove("oculto");
    }
});

/* ======================
   GUARDAR FORMULARIO
====================== */
document.getElementById("cosechaForm").addEventListener("submit", e => {
    e.preventDefault();
    guardarDatos();
});

function guardarDatos() {
    const fecha = document.getElementById("fecha").value;
    const sector = document.getElementById("sector").value;
    const variedad = document.getElementById("variedadExport").value;
    const cantExport = Number(document.getElementById("cantidadExport").value);

    const notas = document.getElementById("notas").value;

    const tipoDesc = document.getElementById("tipoDescarte").value;
    let descarte = [];

    if (tipoDesc === "Hass" || tipoDesc === "Surtida") {
        const c = Number(document.querySelector("#filaDescarte1 .cantidadDescarte").value);
        descarte.push({ variedad: "Hass", cantidad: c });
    }
    if (tipoDesc === "Edranol" || tipoDesc === "Surtida") {
        const c = Number(document.querySelector("#filaDescarte2 .cantidadDescarte").value);
        descarte.push({ variedad: "Edranol", cantidad: c });
    }

    const totalBins = cantExport + descarte.reduce((a, b) => a + b.cantidad, 0);

    añadirFilaATabla({ fecha, sector, variedad, cantExport, descarte, totalBins, notas });
    guardarEnLocalStorage();
    actualizarTotales();

    document.getElementById("mensajeExito").classList.remove("oculto");
    setTimeout(() => document.getElementById("mensajeExito").classList.add("oculto"), 1500);

    document.getElementById("cosechaForm").reset();
    document.getElementById("filaDescarte1").classList.add("oculto");
    document.getElementById("filaDescarte2").classList.add("oculto");
}

/* ======================
   AÑADIR FILA
====================== */
function añadirFilaATabla(data) {
    const tbody = document.querySelector("#tablaCosecha tbody");
    const fila = document.createElement("tr");

    let detalle = "";
    data.descarte.forEach(d => detalle += `${d.variedad}: ${d.cantidad} bins<br>`);

    fila.innerHTML = `
        <td>${data.fecha}</td>
        <td>${data.sector}</td>
        <td>${data.variedad}</td>
        <td>${data.cantExport}</td>
        <td>${detalle}</td>
        <td>${data.totalBins}</td>
        <td>${data.notas || ""}</td>
        <td><button onclick="eliminarFila(this)" class="btn-borrar">X</button></td>
    `;

    tbody.appendChild(fila);
}

/* ======================
   ELIMINAR FILA
====================== */
function eliminarFila(btn) {
    btn.parentElement.parentElement.remove();
    guardarEnLocalStorage();
    actualizarTotales();
}

/* ======================
   LOCAL STORAGE
====================== */
function guardarEnLocalStorage() {
    const filas = [];
    document.querySelectorAll("#tablaCosecha tbody tr").forEach(fila => {
        filas.push({
            fecha: fila.children[0].textContent,
            sector: fila.children[1].textContent,
            variedad: fila.children[2].textContent,
            cantExport: Number(fila.children[3].textContent),
            descarte: fila.children[4].innerHTML,
            totalBins: Number(fila.children[5].textContent),
            notas: fila.children[6].textContent
        });
    });

    localStorage.setItem("cosechaRegistros", JSON.stringify(filas));
    localStorage.setItem("modoOscuro", document.body.classList.contains("dark"));
}

function cargarDesdeLocalStorage() {
    const datos = JSON.parse(localStorage.getItem("cosechaRegistros") || "[]");

    datos.forEach(d => {
        const nueva = {
            fecha: d.fecha,
            sector: d.sector,
            variedad: d.variedad,
            cantExport: d.cantExport,
            descarte: [],
            totalBins: d.totalBins,
            notas: d.notas
        };

        const regex = /(\w+): (\d+)/g;
        let match;
        while ((match = regex.exec(d.descarte)) !== null) {
            nueva.descarte.push({
                variedad: match[1],
                cantidad: Number(match[2])
            });
        }

        añadirFilaATabla(nueva);
    });
}

/* ======================
   BORRAR TODO
====================== */
document.getElementById("borrarTodo").addEventListener("click", () => {
    if (!confirm("⚠️ ¿Seguro que deseas BORRAR TODO el historial?")) return;

    document.querySelector("#tablaCosecha tbody").innerHTML = "";
    localStorage.removeItem("cosechaRegistros");
    actualizarTotales();
});

/* ======================
   CALCULAR TOTALES Y PORCENTAJES
====================== */
function actualizarGrafico(dataFiltrada) {
    const fechas = {};
    
    dataFiltrada.forEach(item => {
        const dia = item.fecha;
        const total = item.agua;  

        if (!fechas[dia]) {
            fechas[dia] = 0;
        }
        fechas[dia] += total;
    });

    const labels = Object.keys(fechas);
    const valores = Object.values(fechas);

    if (chart) chart.destroy();

    const ctx = document.getElementById('grafico').getContext('2d');

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consumo acumulado de agua por día',
                data: valores,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

    const total = totalExport + totalDescarte;

    document.getElementById("totalExportacion").textContent = totalExport;
    document.getElementById("totalDescarte").textContent = totalDescarte;
    document.getElementById("totalGeneral").textContent = total;

    document.getElementById("porcExportacion").textContent = total ? ((totalExport / total) * 100).toFixed(1) + "%" : "0%";
    document.getElementById("porcDescarte").textContent = total ? ((totalDescarte / total) * 100).toFixed(1) + "%" : "0%";
    document.getElementById("porcHass").textContent = totalDescarte ? ((hassDesc / totalDescarte) * 100).toFixed(1) + "%" : "0%";
    document.getElementById("porcEdranol").textContent = totalDescarte ? ((edranolDesc / totalDescarte) * 100).toFixed(1) + "%" : "0%";

    actualizarGrafico(totalExport, totalDescarte);
}

/* ======================
   GRÁFICO
====================== */
function actualizarGrafico(exportacion, descarte) {
    const ctx = document.getElementById("graficoTorta");

    if (graficoTorta) graficoTorta.destroy();

    graficoTorta = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Exportación", "Descarte"],
            datasets: [{
                data: [exportacion, descarte],
                backgroundColor: ["#2d89ef", "#e94f64"]
            }]
        },
        options: { responsive: true }
    });
}

/* ======================
   MODO OSCURO
====================== */
document.getElementById("btnDark").addEventListener("click", () => {
    document.body.classList.toggle("dark");

    document.getElementById("btnDark").textContent =
        document.body.classList.contains("dark")
            ? "Modo Claro"
            : "Modo Oscuro";

    localStorage.setItem("modoOscuro", document.body.classList.contains("dark"));
});

function cargarModoOscuro() {
    if (localStorage.getItem("modoOscuro") === "true") {
        document.body.classList.add("dark");
        document.getElementById("btnDark").textContent = "Modo Claro";
    }
}

/* ======================
   BUSCADOR
====================== */
document.getElementById("buscar").addEventListener("keyup", function () {
    const filtro = this.value.toLowerCase();

    document.querySelectorAll("#tablaCosecha tbody tr").forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        fila.style.display = texto.includes(filtro) ? "" : "none";
    });
});

/* ======================
   FILTRO POR FECHAS
====================== */
document.getElementById("btnFiltrarFecha").addEventListener("click", () => {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;

    document.querySelectorAll("#tablaCosecha tbody tr").forEach(f => {
        const fecha = f.children[0].textContent;

        const okInicio = !inicio || fecha >= inicio;
        const okFin = !fin || fecha <= fin;

        f.style.display = okInicio && okFin ? "" : "none";
    });
});

document.getElementById("btnLimpiarFiltro").addEventListener("click", () => {
    document.getElementById("fechaInicio").value = "";
    document.getElementById("fechaFin").value = "";

    document.querySelectorAll("#tablaCosecha tbody tr").forEach(f => {
        f.style.display = "";
    });
});
