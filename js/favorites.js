let allApartments = [];
let favoriteApartments = [];

async function initFavorites() {
  showLoading();

  try {
    allApartments = await fetchApartments();

    if (!allApartments || allApartments.length === 0) {
      showError('No data available.');
      return;
    }

    loadFavorites();
    renderFavorites();
  } catch (error) {
    console.error('Favorites init error:', error);
    showError('Error loading favorites.');
  }
}

function showLoading() {
  const container = document.getElementById('favorites-container');
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state text-center">
      <div class="loading-spinner"></div>
      <p class="mt-3 mb-0">Loading favorites...</p>
    </div>
  `;
}

function showError(message) {
  const container = document.getElementById('favorites-container');
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-danger mb-0">
      ${escapeHtml(message)}
    </div>
  `;
}

function loadFavorites() {
  const favorites = Utils.getFavorites() || [];
  favoriteApartments = allApartments.filter(item => favorites.includes(item.id));
}

function renderFavorites() {
  const container = document.getElementById('favorites-container');
  if (!container) return;

  if (favoriteApartments.length === 0) {
    container.innerHTML = `
      <div class="empty-state favorite-empty-state">
        <div class="result-icon">⭐</div>
        <h4>No favorites yet</h4>
        <p>
          Save interesting apartment categories from the search page
          and they will appear here.
        </p>
        <a href="search.html" class="btn btn-primary mt-2">Go to Search</a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="favorites-grid">
      ${favoriteApartments.map(item => renderFavoriteCard(item)).join('')}
    </div>
  `;
}

function renderFavoriteCard(item) {
  const canton = escapeHtml(String(item.canton ?? ''));
  const rooms = escapeHtml(String(item.rooms ?? ''));
  const priceRange = escapeHtml(String(item.price_range ?? ''));
  const area = escapeHtml(String(item.area_m2_range ?? ''));
  const year = escapeHtml(String(item.year ?? ''));
  const value = Number(item.value || 0).toLocaleString('en-CH');

  return `
    <div class="favorite-card recommendation-card h-100">
      <div class="recommendation-top">
        <div>
          <div class="recommendation-canton">${canton}</div>
          <div class="recommendation-year">${year}</div>
        </div>
        <div class="recommendation-value">${value}</div>
      </div>

      <div class="recommendation-details">
        <div><strong>Rooms:</strong> ${rooms}</div>
        <div><strong>Rent range:</strong> ${priceRange}</div>
        <div><strong>Area:</strong> ${area}</div>
      </div>

      <div class="favorite-actions mt-4 d-flex flex-wrap gap-2">
        <button class="btn btn-primary btn-sm" onclick="showCategoryDetails(${item.id})">
          Details
        </button>
        <button class="btn btn-outline-danger btn-sm" onclick="removeFromFavorites(${item.id})">
          Remove
        </button>
        <button class="btn btn-outline-secondary btn-sm" onclick="addToComparison(${item.id})">
          Compare
        </button>
      </div>
    </div>
  `;
}

function showCategoryDetails(id) {
  const item = allApartments.find(entry => entry.id === id);
  if (!item) return;

  const details = [
    `Canton: ${item.canton ?? '-'}`,
    `Rooms: ${item.rooms ?? '-'}`,
    `Rent range: ${item.price_range ?? '-'}`,
    `Area: ${item.area_m2_range ?? '-'}`,
    `Year: ${item.year ?? '-'}`,
    `Apartment count: ${Number(item.value || 0).toLocaleString('en-CH')}`
  ].join('\n');

  alert(details);
}

function removeFromFavorites(id) {
  Utils.removeFromFavorites(id);
  loadFavorites();
  renderFavorites();

  if (window.Utils && typeof Utils.showToast === 'function') {
    Utils.showToast('Favorite removed.', 'info');
  }
}

function addToComparison(id) {
  let items = [];

  try {
    items = JSON.parse(localStorage.getItem('comparisonItems')) || [];
  } catch (error) {
    items = [];
  }

  if (items.includes(id)) {
    if (window.Utils && typeof Utils.showToast === 'function') {
      Utils.showToast('This category is already in the comparison list.', 'info');
    }
    return;
  }

  if (items.length >= 4) {
    if (window.Utils && typeof Utils.showToast === 'function') {
      Utils.showToast('You can compare a maximum of 4 categories.', 'warning');
    }
    return;
  }

  items.push(id);
  localStorage.setItem('comparisonItems', JSON.stringify(items));

  if (window.Utils && typeof Utils.showToast === 'function') {
    Utils.showToast('Category added to comparison list.', 'success');
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.addEventListener('DOMContentLoaded', initFavorites);