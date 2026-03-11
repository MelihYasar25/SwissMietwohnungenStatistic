let allApartments = [];
let filteredApartments = [];
let currentPage = 1;
const itemsPerPage = 30;
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
    applyQuizFilters();
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
  return [...new Set(data.map(item => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }));
}

function setupEventListeners() {
  document.getElementById('filter-form').addEventListener('change', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('view-toggle').addEventListener('click', toggleView);
}
function toggleFavorite(id) {
  if (Utils.isFavorite(id)) {
    Utils.removeFromFavorites(id);
  } else {
    Utils.addToFavorites(id);
  }

  renderResults();
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
    if ((Number(item.value) || 0) <= 0) return false;
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
    <div class="col-md-6 col-xl-4 mb-4">
      <div class="card result-card h-100 border-0 shadow-sm">
        <div class="card-body p-4 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 class="card-title mb-1 fw-bold">${item.canton}</h5>
              <span class="badge bg-primary-subtle text-primary border">${item.year}</span>
            </div>
            <div class="text-end">
              <div class="small text-muted">Anzahl</div>
              <div class="fs-5 fw-bold text-primary">${Number(item.value).toLocaleString('de-CH')}</div>
            </div>
          </div>

          <div class="mb-3">
            <div class="mb-2"><strong>Zimmer:</strong> ${item.rooms}</div>
            <div class="mb-2"><strong>Mietpreisklasse:</strong> ${item.price_range}</div>
            <div class="mb-2"><strong>Wohnungsfläche:</strong> ${item.area_m2_range}</div>
          </div>

          <div class="mt-auto d-flex gap-2 flex-wrap">
            <button class="btn btn-outline-primary btn-sm" onclick="toggleFavorite(${item.id})">
              ${Utils.isFavorite(item.id) ? '★ Favorit' : '☆ Favorit'}
            </button>
            <button class="btn btn-outline-secondary btn-sm" onclick="addToComparison(${item.id})">
              Vergleichen
            </button>
          </div>
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
  const paginationNav = document.getElementById('pagination-nav');

  if (totalPages <= 1) {
    paginationNav.innerHTML = '';
    return;
  }

  let html = '<ul class="pagination justify-content-center flex-wrap gap-2">';

  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link rounded-pill px-3" href="#" onclick="goToPage(${currentPage - 1}); return false;">
        ← Zurück
      </a>
    </li>
  `;

  const pages = getVisiblePages(currentPage, totalPages);

  pages.forEach(page => {
    if (page === '...') {
      html += `
        <li class="page-item disabled">
          <span class="page-link rounded-pill px-3">...</span>
        </li>
      `;
    } else {
      html += `
        <li class="page-item ${page === currentPage ? 'active' : ''}">
          <a class="page-link rounded-pill px-3" href="#" onclick="goToPage(${page}); return false;">
            ${page}
          </a>
        </li>
      `;
    }
  });

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link rounded-pill px-3" href="#" onclick="goToPage(${currentPage + 1}); return false;">
        Weiter →
      </a>
    </li>
  `;

  html += '</ul>';

  paginationNav.innerHTML = `
    <div class="d-flex flex-column align-items-center mt-4">
      <div class="text-muted small mb-2">
        Seite ${currentPage} von ${totalPages}
      </div>
      ${html}
    </div>
  `;
}

function getVisiblePages(current, total) {
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1);

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredApartments.length / itemsPerPage);

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderResults();
  renderPagination();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
function applyQuizFilters() {
  const params = new URLSearchParams(window.location.search);

  if (!params.get("fromQuiz")) return;

  const stored = sessionStorage.getItem("quizFilters");
  if (!stored) return;

  try {
    const filters = JSON.parse(stored);

    if (filters.canton) document.getElementById("canton-select").value = filters.canton;
    if (filters.rooms) document.getElementById("rooms-select").value = filters.rooms;
    if (filters.price_range) document.getElementById("price-select").value = filters.price_range;
    if (filters.area_m2_range) document.getElementById("area-select").value = filters.area_m2_range;
    if (filters.year) document.getElementById("year-select").value = filters.year;

  } catch (e) {
    console.warn("Invalid quiz filters");
  }
}

document.addEventListener('DOMContentLoaded', initSearch);