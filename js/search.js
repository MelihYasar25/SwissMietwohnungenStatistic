// Search and filter functionality
let allApartments = [];
let filteredApartments = [];
let currentPage = 1;
const itemsPerPage = 12;
let viewMode = 'cards'; // 'cards' or 'table'

async function initSearch() {
  showLoading();
  allApartments = await fetchApartments();
  hideLoading();
  if (allApartments.length === 0) {
    showError('No data available.');
    return;
  }
  populateFilters();
  applyFilters();
  setupEventListeners();
}

function showLoading() {
  document.getElementById('results-container').innerHTML = '<div class="text-center"><div class="loading-spinner"></div> Loading data...</div>';
}

function hideLoading() {
  // Remove loading
}

function showError(message) {
  document.getElementById('results-container').innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function populateFilters() {
  // Populate canton select
  const cantons = Utils.getUniqueValues(allApartments, CONFIG.COLUMNS.canton);
  const cantonSelect = document.getElementById('canton-select');
  cantons.forEach(canton => {
    const option = document.createElement('option');
    option.value = canton;
    option.textContent = canton;
    cantonSelect.appendChild(option);
  });

  // Populate city select
  const cities = Utils.getUniqueValues(allApartments, CONFIG.COLUMNS.city);
  const citySelect = document.getElementById('city-select');
  cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });

  // Populate property type select
  const types = Utils.getUniqueValues(allApartments, CONFIG.COLUMNS.property_type);
  const typeSelect = document.getElementById('property-type-select');
  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    typeSelect.appendChild(option);
  });
}

function setupEventListeners() {
  document.getElementById('filter-form').addEventListener('input', applyFilters);
  document.getElementById('filter-form').addEventListener('change', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('view-toggle').addEventListener('click', toggleView);
}

function applyFilters() {
  const filters = getFilterValues();
  filteredApartments = Utils.filterApartments(allApartments, filters);
  const sortBy = document.getElementById('sort-select').value;
  if (sortBy) {
    filteredApartments = Utils.sortApartments(filteredApartments, sortBy);
  }
  currentPage = 1;
  renderResults();
  renderPagination();
}

function getFilterValues() {
  return {
    canton: document.getElementById('canton-select').value,
    city: document.getElementById('city-select').value,
    zip_code: document.getElementById('zip-input').value,
    minPrice: parseFloat(document.getElementById('min-price').value) || undefined,
    maxPrice: parseFloat(document.getElementById('max-price').value) || undefined,
    minArea: parseFloat(document.getElementById('min-area').value) || undefined,
    maxArea: parseFloat(document.getElementById('max-area').value) || undefined,
    rooms: document.getElementById('rooms-select').value,
    property_type: document.getElementById('property-type-select').value,
    furnished: document.getElementById('furnished-check').checked ? true : undefined,
    balcony: document.getElementById('balcony-check').checked ? true : undefined,
    pets_allowed: document.getElementById('pets-check').checked ? true : undefined,
    public_transport_nearby: document.getElementById('transport-check').checked ? true : undefined
  };
}

function resetFilters() {
  document.getElementById('filter-form').reset();
  applyFilters();
}

function toggleView() {
  viewMode = viewMode === 'cards' ? 'table' : 'cards';
  document.getElementById('view-toggle').textContent = viewMode === 'cards' ? 'Card View' : 'Table View';
  renderResults();
}

function renderResults() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageApartments = filteredApartments.slice(start, end);

  document.getElementById('result-count').textContent = `${filteredApartments.length} results`;

  if (filteredApartments.length === 0) {
    document.getElementById('results-container').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-search"></i>
        <h4>No results found</h4>
        <p>Try changing your filters.</p>
      </div>
    `;
    return;
  }

  if (viewMode === 'cards') {
    renderCards(pageApartments);
  } else {
    renderTable(pageApartments);
  }
}

function renderCards(apartments) {
  const html = apartments.map(apt => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card apartment-card h-100">
        <img src="${apt[CONFIG.COLUMNS.image_url] || 'https://via.placeholder.com/300x200?text=No+Image'}" class="card-img-top" alt="Apartment">
        <button class="favorite-btn" onclick="toggleFavorite(${apt[CONFIG.COLUMNS.id]})">
          <i class="bi ${Utils.isFavorite(apt[CONFIG.COLUMNS.id]) ? 'bi-heart-fill text-danger' : 'bi-heart'}"></i>
        </button>
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${apt[CONFIG.COLUMNS.title] || 'Unnamed Apartment'}</h6>
          <p class="card-text">${Utils.formatCHF(apt[CONFIG.COLUMNS.price])} | ${apt[CONFIG.COLUMNS.area_sqm]} m² | ${apt[CONFIG.COLUMNS.rooms]} rooms</p>
          <p class="card-text small text-muted">${apt[CONFIG.COLUMNS.city]}, ${apt[CONFIG.COLUMNS.canton]}</p>
          <div class="mt-auto">
            <button class="btn btn-primary btn-sm me-2" onclick="showApartmentDetails(${apt[CONFIG.COLUMNS.id]})">Details</button>
            <button class="btn btn-outline-secondary btn-sm" onclick="addToComparison(${apt[CONFIG.COLUMNS.id]})">Compare</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('results-container').innerHTML = `<div class="row">${html}</div>`;
}

function renderTable(apartments) {
  const html = `
    <div class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Area</th>
            <th>Rooms</th>
            <th>City</th>
            <th>Canton</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${apartments.map(apt => `
            <tr>
              <td>${apt[CONFIG.COLUMNS.title] || 'Unnamed'}</td>
              <td>${Utils.formatCHF(apt[CONFIG.COLUMNS.price])}</td>
              <td>${apt[CONFIG.COLUMNS.area_sqm]} m²</td>
              <td>${apt[CONFIG.COLUMNS.rooms]}</td>
              <td>${apt[CONFIG.COLUMNS.city]}</td>
              <td>${apt[CONFIG.COLUMNS.canton]}</td>
              <td>
                <button class="btn btn-sm btn-primary me-1" onclick="showApartmentDetails(${apt[CONFIG.COLUMNS.id]})">Details</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="addToComparison(${apt[CONFIG.COLUMNS.id]})">Compare</button>
              </td>
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
    html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="goToPage(${i})">${i}</a></li>`;
  }
  html += '</ul>';

  document.getElementById('pagination-nav').innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderResults();
  renderPagination();
}

function showApartmentDetails(id) {
  const apartment = allApartments.find(apt => apt[CONFIG.COLUMNS.id] === id);
  if (!apartment) return;

  const detailsHtml = `
    <div class="row">
      <div class="col-md-6">
        <img src="${apartment[CONFIG.COLUMNS.image_url] || 'https://via.placeholder.com/400x300?text=No+Image'}" class="img-fluid rounded" alt="Apartment">
      </div>
      <div class="col-md-6">
        <h4>${apartment[CONFIG.COLUMNS.title] || 'Unnamed Apartment'}</h4>
        <p><strong>Price:</strong> ${Utils.formatCHF(apartment[CONFIG.COLUMNS.price])}</p>
        ${apartment[CONFIG.COLUMNS.additional_costs] ? `<p><strong>Additional Costs:</strong> ${Utils.formatCHF(apartment[CONFIG.COLUMNS.additional_costs])}</p>` : ''}
        <p><strong>Size:</strong> ${apartment[CONFIG.COLUMNS.area_sqm]} m²</p>
        <p><strong>Rooms:</strong> ${apartment[CONFIG.COLUMNS.rooms]}</p>
        <p><strong>Address:</strong> ${apartment[CONFIG.COLUMNS.address] || 'Not available'}, ${apartment[CONFIG.COLUMNS.city]}, ${apartment[CONFIG.COLUMNS.canton]}</p>
        <p><strong>Price per m²:</strong> ${Utils.formatCHF(Utils.calculatePricePerSqm(apartment[CONFIG.COLUMNS.price], apartment[CONFIG.COLUMNS.area_sqm]))}</p>
        <p><strong>Available from:</strong> ${Utils.formatDate(apartment[CONFIG.COLUMNS.available_from])}</p>
        ${apartment[CONFIG.COLUMNS.description] ? `<p><strong>Description:</strong> ${apartment[CONFIG.COLUMNS.description]}</p>` : ''}
        <div class="mt-3">
          ${apartment[CONFIG.COLUMNS.features] ? apartment[CONFIG.COLUMNS.features].map(feature => `<span class="badge bg-secondary me-1">${feature}</span>`).join('') : ''}
        </div>
      </div>
    </div>
  `;

  document.getElementById('apartment-details').innerHTML = detailsHtml;
  new bootstrap.Modal(document.getElementById('apartmentModal')).show();
}

function toggleFavorite(id) {
  if (Utils.isFavorite(id)) {
    Utils.removeFromFavorites(id);
  } else {
    Utils.addToFavorites(id);
  }
  renderResults(); // Re-render to update favorite buttons
}

function addToComparison(id) {
  // This will be handled in compare.js, but for now just show a toast
  Utils.showToast('Apartment added to comparison list', 'info');
}

// Check for apartment ID in URL (for direct links)
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (id) {
    // Wait for data to load, then show details
    setTimeout(() => showApartmentDetails(parseInt(id)), 1000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initSearch();
  checkUrlParams();
});