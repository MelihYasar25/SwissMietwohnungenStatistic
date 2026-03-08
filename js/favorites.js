// Favorites functionality
let allApartments = [];
let favoriteApartments = [];

async function initFavorites() {
  showLoading();
  allApartments = await fetchApartments();
  hideLoading();
  if (allApartments.length === 0) {
    showError('Keine Daten verfügbar.');
    return;
  }
  loadFavorites();
  renderFavorites();
}

function showLoading() {
  document.getElementById('favorites-container').innerHTML = '<div class="text-center"><div class="loading-spinner"></div> Lade Favoriten...</div>';
}

function hideLoading() {
  // Remove loading
}

function showError(message) {
  document.getElementById('favorites-container').innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function loadFavorites() {
  const favorites = Utils.getFavorites();
  favoriteApartments = allApartments.filter(apt => favorites.includes(apt[CONFIG.COLUMNS.id]));
}

function renderFavorites() {
  if (favoriteApartments.length === 0) {
    document.getElementById('favorites-container').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-heart"></i>
        <h4>Noch keine Favoriten</h4>
        <p>Durchsuche Wohnungen und füge sie zu deinen Favoriten hinzu.</p>
        <a href="search.html" class="btn btn-primary">Wohnungen suchen</a>
      </div>
    `;
    return;
  }

  const html = `
    <div class="row">
      ${favoriteApartments.map(apt => `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card apartment-card h-100">
            <img src="${apt[CONFIG.COLUMNS.image_url] || 'https://via.placeholder.com/300x200?text=Kein+Bild'}" class="card-img-top" alt="Wohnung">
            <div class="card-body d-flex flex-column">
              <h6 class="card-title">${apt[CONFIG.COLUMNS.title] || 'Unbenannte Wohnung'}</h6>
              <p class="card-text">${Utils.formatCHF(apt[CONFIG.COLUMNS.price])} | ${apt[CONFIG.COLUMNS.area_sqm]} m² | ${apt[CONFIG.COLUMNS.rooms]} Zimmer</p>
              <p class="card-text small text-muted">${apt[CONFIG.COLUMNS.city]}, ${apt[CONFIG.COLUMNS.canton]}</p>
              <div class="mt-auto">
                <button class="btn btn-primary btn-sm me-2" onclick="showApartmentDetails(${apt[CONFIG.COLUMNS.id]})">Details</button>
                <button class="btn btn-outline-danger btn-sm me-2" onclick="removeFromFavorites(${apt[CONFIG.COLUMNS.id]})">Entfernen</button>
                <button class="btn btn-outline-secondary btn-sm" onclick="addToComparison(${apt[CONFIG.COLUMNS.id]})">Vergleichen</button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('favorites-container').innerHTML = html;
}

function showApartmentDetails(id) {
  const apartment = allApartments.find(apt => apt[CONFIG.COLUMNS.id] === id);
  if (!apartment) return;

  // Simple alert for now, could be expanded to modal
  alert(`${apartment[CONFIG.COLUMNS.title] || 'Wohnung'}\nPreis: ${Utils.formatCHF(apartment[CONFIG.COLUMNS.price])}\nFläche: ${apartment[CONFIG.COLUMNS.area_sqm]} m²\nZimmer: ${apartment[CONFIG.COLUMNS.rooms]}\nOrt: ${apartment[CONFIG.COLUMNS.city]}, ${apartment[CONFIG.COLUMNS.canton]}`);
}

function removeFromFavorites(id) {
  Utils.removeFromFavorites(id);
  loadFavorites();
  renderFavorites();
}

function addToComparison(id) {
  Utils.showToast('Wohnung zur Vergleichsliste hinzugefügt', 'info');
}

// Initialize
document.addEventListener('DOMContentLoaded', initFavorites);