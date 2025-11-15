document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("fuel-form");
    const tableBody = document.querySelector("#records-table tbody");
    const filterType = document.getElementById("filter-type");
    const vehicleFilter = document.getElementById("vehicle-filter");
    const filterButton = document.getElementById("filter-button");
    const exportButton = document.getElementById("export-button");
    const totalAmount = document.getElementById("total-amount");

    let records = JSON.parse(localStorage.getItem("fuelRecords")) || [];

    function saveRecords() {
        localStorage.setItem("fuelRecords", JSON.stringify(records));
    }

    function renderTable(filtered = records) {
        tableBody.innerHTML = "";
        let total = 0;

        filtered.forEach(record => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.vehicle}</td>
                <td>${record.liters}</td>
                <td>$${Number(record.amount).toLocaleString("es-CL")}</td>
            `;
            tableBody.appendChild(row);
            total += Number(record.amount);
        });

        totalAmount.textContent = `$${total.toLocaleString("es-CL")}`;
    }

    function filterRecords() {
        const type = filterType.value;
        const selectedVehicle = vehicleFilter.value;
        const now = new Date();

        let filtered = records.filter(record => {
            const recordDate = new Date(record.date);
            let match = true;

            if (type === "day") match = recordDate.toDateString() === now.toDateString();
            if (type === "week") {
                const diff = (now - recordDate) / (1000 * 60 * 60 * 24);
                match = diff <= 7 && diff >= 0;
            }
            if (type === "month") match = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
            if (type === "year") match = recordDate.getFullYear() === now.getFullYear();

            if (selectedVehicle !== "all") match = match && record.vehicle === selectedVehicle;

            return match;
        });

        renderTable(filtered);
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const newRecord = {
            date: document.getElementById("date").value,
            vehicle: document.getElementById("vehicle").value,
            liters: document.getElementById("liters").value,
            amount: document.getElementById("amount").value
        };
        records.push(newRecord);
        saveRecords();
        renderTable();
        form.reset();
    });

    filterButton.addEventListener("click", filterRecords);

    exportButton.addEventListener("click", () => {
        let csv = "Fecha,Vehículo,Litros,Monto\n";
        records.forEach(r => {
            csv += `${r.date},${r.vehicle},${r.liters},${r.amount}\n`;
        });

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "registros_combustible.csv";
        link.click();
    });

    renderTable();
});
