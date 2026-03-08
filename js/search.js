let allApartments = [];
let filteredApartments = [];
let currentPage = 1;
const itemsPerPage = 12;
let viewMode = 'cards';

async function initSearch() {
  showLoading();

  try {
    allApartments = await fetchApartments();
    console.log('Search data:', allApartments);

    if (!allApartments || allApartments.length === 0) {
      showError('Keine Daten verfügbar.');
      return;
    }

    populateFilters();
    setupEventListeners();
    applyFilters();
  } catch (error) {
    console.error('Search init error:', error);
    showError('Fehler beim Laden der Daten.');
  }
}

function showLoading() {
  document.getElementById('results-container').innerHTML =
    '<div class="text-center"><div class="loading-spinner"></div> Daten werden geladen...</div>';
}

function hideLoading() {
}

function showError(message) {
  document.getElementById('results-container').innerHTML =
    `<div class="alert alert-danger">${message}</div>`;
}

function populateFilters() {
  populateSelect('canton-select', getUniqueSorted(allApartments, 'canton'), 'Alle');
  populateSelect('rooms-select', getUniqueSorted(allApartments, 'rooms'), 'Alle');
  populateSelect('price-select', getUniqueSorted(allApartments, 'price_range'), 'Alle');
  populateSelect('area-select', getUniqueSorted(allApartments, 'area_m2_range'), 'Alle');
  populateSelect('year-select', getUniqueSorted(allApartments, 'year'), 'Alle');
}

function populateSelect(id, values, defaultLabel) {
  const select = document.getElementById(id);
  if (!select) return;

  select.innerHTML = `<option value="">${defaultLabel}</option>`;

  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function getUniqueSorted(data, key) {
  return [...new Set(data.map(item => item[key]).filter(Boolean))];
}

function setupEventListeners() {
  document.getElementById('filter-form').addEventListener('change', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('view-toggle').addEventListener('click', toggleView);
}

function getFilterValues() {
  return {
    canton: document.getElementById('canton-select')?.value || '',
    rooms: document.getElementById('rooms-select')?.value || '',
    price_range: document.getElementById('price-select')?.value || '',
    area_m2_range: document.getElementById('area-select')?.value || '',
    year: document.getElementById('year-select')?.value || '',
    sortBy: document.getElementById('sort-select')?.value || ''
  };
}

function applyFilters() {
  const filters = getFilterValues();

  filteredApartments = allApartments.filter(item => {
    if (filters.canton && item.canton !== filters.canton) return false;
    if (filters.rooms && item.rooms !== filters.rooms) return false;
    if (filters.price_range && item.price_range !== filters.price_range) return false;
    if (filters.area_m2_range && item.area_m2_range !== filters.area_m2_range) return false;
    if (filters.year && item.year !== filters.year) return false;
    return true;
  });

  sortResults(filters.sortBy);

  currentPage = 1;
  renderResults();
  renderPagination();
}

function sortResults(sortBy) {
  switch (sortBy) {
    case 'value_desc':
      filteredApartments.sort((a, b) => b.value - a.value);
      break;
    case 'value_asc':
      filteredApartments.sort((a, b) => a.value - b.value);
      break;
    case 'canton_asc':
      filteredApartments.sort((a, b) => a.canton.localeCompare(b.canton));
      break;
    default:
      break;
  }
}

function resetFilters() {
  document.getElementById('filter-form').reset();
  applyFilters();
}

function toggleView() {
  viewMode = viewMode === 'cards' ? 'table' : 'cards';
  document.getElementById('view-toggle').textContent =
    viewMode === 'cards' ? 'Tabellenansicht' : 'Kartenansicht';
  renderResults();
}

function renderResults() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredApartments.slice(start, end);

  document.getElementById('result-count').textContent =
    `${filteredApartments.length} Ergebnisse`;

  if (filteredApartments.length === 0) {
    document.getElementById('results-container').innerHTML = `
      <div class="empty-state">
        <h4>Keine Ergebnisse gefunden</h4>
        <p>Versuche andere Filter.</p>
      </div>
    `;
    return;
  }

  if (viewMode === 'cards') {
    renderCards(pageItems);
  } else {
    renderTable(pageItems);
  }
}

function renderCards(items) {
  const html = items.map(item => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card h-100">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${item.canton}</h5>
          <p class="card-text mb-1"><strong>Zimmer:</strong> ${item.rooms}</p>
          <p class="card-text mb-1"><strong>Mietpreisklasse:</strong> ${item.price_range}</p>
          <p class="card-text mb-1"><strong>Wohnungsfläche:</strong> ${item.area_m2_range}</p>
          <p class="card-text mb-1"><strong>Jahr:</strong> ${item.year}</p>
          <p class="card-text mt-2"><strong>Anzahl Wohnungen:</strong> ${item.value}</p>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('results-container').innerHTML = `<div class="row">${html}</div>`;
}

function renderTable(items) {
  const html = `
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Kanton</th>
            <th>Zimmer</th>
            <th>Mietpreisklasse</th>
            <th>Wohnungsfläche</th>
            <th>Jahr</th>
            <th>Anzahl Wohnungen</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.canton}</td>
              <td>${item.rooms}</td>
              <td>${item.price_range}</td>
              <td>${item.area_m2_range}</td>
              <td>${item.year}</td>
              <td>${item.value}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('results-container').innerHTML = html;
}

function renderPagination() {
  const totalPages = Math.ceil(filteredApartments.length / itemsPerPage);

  if (totalPages <= 1) {
    document.getElementById('pagination-nav').innerHTML = '';
    return;
  }

  let html = '<ul class="pagination justify-content-center">';

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  html += '</ul>';
  document.getElementById('pagination-nav').innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderResults();
  renderPagination();
}

document.addEventListener('DOMContentLoaded', initSearch);