// Lista de vehículos
const vehicles = [
  { name: 'Bus Hyundai', plate: 'CLTX-84' },
  { name: 'Bus Volare', plate: 'KJTV-90' },
  { name: 'Bus Volare', plate: 'KJTV-89' },
  { name: 'Nissan avan', plate: 'RKYF-16' },
  { name: 'Jac refina', plate: 'KJYW-59' },
  { name: 'Dmax', plate: 'FPFX-73' },
  { name: 'Toyota', plate: 'KYZZ-35' },
  { name: 'Suzuki', plate: 'DKBK-12' },
  { name: 'Suzuki', plate: 'DKBK-10' }
];

const STORAGE_KEY = 'fuelRecords_v1';

// Elementos del DOM
const vehicleSelect = document.getElementById('vehicle');
const dateInput = document.getElementById('date');
const litersInput = document.getElementById('liters');
const recordsTable = document.querySelector('#recordsTable tbody');
const totalLitersEl = document.getElementById('totalLiters');
const filterType = document.getElementById('filterType');
const filterInputs = document.getElementById('filterInputs');

// Inicializar
populateVehicles();
dateInput.value = new Date().toISOString().slice(0,10);
render();

document.getElementById('entryForm').addEventListener('submit', addEntry);
document.getElementById('clearBtn').addEventListener('click', clearAll);
document.getElementById('applyFilter').addEventListener('click', render);
document.getElementById('resetFilter').addEventListener('click', resetFilter);
document.getElementById('exportCsv').addEventListener('click', exportCSV);
filterType.addEventListener('change', () => showFilterInputs(filterType.value));

function populateVehicles() {
  vehicleSelect.innerHTML = '';
  vehicles.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${v.name} — ${v.plate}`;
    vehicleSelect.appendChild(opt);
  });
}

function loadRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function addEntry(e) {
  e.preventDefault();
  const record = {
    id: Date.now(),
    vehicle: Number(vehicleSelect.value),
    date: dateInput.value,
    liters: Number(litersInput.value)
  };
  const records = loadRecords();
  records.push(record);
  saveRecords(records);
  litersInput.value = '';
  render();
}

function deleteRecord(id) {
  const records = loadRecords().filter(r => r.id !== id);
  saveRecords(records);
  render();
}

function clearAll() {
  if (confirm('¿Seguro que quieres borrar todos los registros?')) {
    localStorage.removeItem(STORAGE_KEY);
    render();
  }
}

function render() {
  const records = filterRecords(loadRecords());
  recordsTable.innerHTML = '';
  records.sort((a,b) => new Date(b.date) - new Date(a.date))
    .forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(r.date).toLocaleDateString()}</td>
        <td>${vehicles[r.vehicle].name}</td>
        <td>${vehicles[r.vehicle].plate}</td>
        <td>${r.liters.toFixed(2)}</td>
        <td><button onclick=\"deleteRecord(${r.id})\">Eliminar</button></td>`;
      recordsTable.appendChild(tr);
    });

  const total = records.reduce((sum, r) => sum + r.liters, 0);
  totalLitersEl.textContent = total.toFixed(2);
}

function showFilterInputs(type) {
  filterInputs.innerHTML = '';
  if (type === 'day') {
    filterInputs.innerHTML = '<input type=\"date\" id=\"filterDay\">';
  } else if (type === 'week') {
    filterInputs.innerHTML = '<input type=\"date\" id=\"filterWeek\">';
  } else if (type === 'month') {
    filterInputs.innerHTML = '<input type=\"month\" id=\"filterMonth\">';
  } else if (type === 'year') {
    filterInputs.innerHTML = '<input type=\"number\" id=\"filterYear\" placeholder=\"Año\">';
  }
}

function filterRecords(records) {
  const type = filterType.value;
  if (type === 'day') {
    const d = document.getElementById('filterDay')?.value;
    return records.filter(r => r.date === d);
  } else if (type === 'week') {
    const d = document.getElementById('filterWeek')?.value;
    if (!d) return [];
    const date = new Date(d);
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return records.filter(r => new Date(r.date) >= start && new Date(r.date) <= end);
  } else if (type === 'month') {
    const m = document.getElementById('filterMonth')?.value;
    if (!m) return [];
    const [year, month] = m.split('-').map(Number);
    return records.filter(r => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  } else if (type === 'year') {
    const y = Number(document.getElementById('filterYear')?.value);
    return records.filter(r => new Date(r.date).getFullYear() === y);
  }
  return records;
}

function resetFilter() {
  filterType.value = 'all';
  showFilterInputs('all');
  render();
}

function exportCSV() {
  const records = filterRecords(loadRecords());
  const header = ['Fecha','Vehículo','Placa','Litros'];
  const rows = records.map(r =>
    [r.date, vehicles[r.vehicle].name, vehicles[r.vehicle].plate, r.liters.toFixed(2)].join(',')
  );
  const csv = [header.join(','), ...rows].join('\\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'registro_combustible.csv';
  a.click();
  URL.revokeObjectURL(url);
}
