let allApartments = [];
let favoriteApartments = [];

async function initFavorites() {
  showLoading();

  try {
    allApartments = await fetchApartments();

    if (!allApartments || allApartments.length === 0) {
      showError('Keine Daten verfügbar.');
      return;
    }

    loadFavorites();
    renderFavorites();
  } catch (error) {
    console.error('Favorites init error:', error);
    showError('Fehler beim Laden der Favoriten.');
  }
}

function showLoading() {
  document.getElementById('favorites-container').innerHTML =
    '<div class="text-center"><div class="loading-spinner"></div> Lade Favoriten...</div>';
}

function showError(message) {
  document.getElementById('favorites-container').innerHTML =
    `<div class="alert alert-danger">${message}</div>`;
}

function loadFavorites() {
  const favorites = Utils.getFavorites();
  favoriteApartments = allApartments.filter(item => favorites.includes(item.id));
}

function renderFavorites() {
  if (favoriteApartments.length === 0) {
    document.getElementById('favorites-container').innerHTML = `
      <div class="empty-state text-center">
        <h4>Noch keine Favoriten</h4>
        <p>Speichere interessante Wohnungskategorien aus der Suche in deinen Favoriten.</p>
        <a href="search.html" class="btn btn-primary">Zur Suche</a>
      </div>
    `;
    return;
  }

  const html = `
    <div class="row">
      ${favoriteApartments.map(item => `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${item.canton}</h5>
              <p class="card-text mb-1"><strong>Zimmer:</strong> ${item.rooms}</p>
              <p class="card-text mb-1"><strong>Mietpreisklasse:</strong> ${item.price_range}</p>
              <p class="card-text mb-1"><strong>Wohnungsfläche:</strong> ${item.area_m2_range}</p>
              <p class="card-text mb-1"><strong>Jahr:</strong> ${item.year}</p>
              <p class="card-text mb-3"><strong>Anzahl Wohnungen:</strong> ${Number(item.value).toLocaleString('de-CH')}</p>

              <div class="mt-auto d-flex flex-wrap gap-2">
                <button class="btn btn-primary btn-sm" onclick="showCategoryDetails(${item.id})">
                  Details
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="removeFromFavorites(${item.id})">
                  Entfernen
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="addToComparison(${item.id})">
                  Vergleichen
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('favorites-container').innerHTML = html;
}

function showCategoryDetails(id) {
  const item = allApartments.find(entry => entry.id === id);
  if (!item) return;

  alert(
    `Kanton: ${item.canton}\n` +
    `Zimmer: ${item.rooms}\n` +
    `Mietpreisklasse: ${item.price_range}\n` +
    `Wohnungsfläche: ${item.area_m2_range}\n` +
    `Jahr: ${item.year}\n` +
    `Anzahl Wohnungen: ${Number(item.value).toLocaleString('de-CH')}`
  );
}

function removeFromFavorites(id) {
  Utils.removeFromFavorites(id);
  loadFavorites();
  renderFavorites();
  Utils.showToast('Favorit entfernt.', 'info');
}

function addToComparison(id) {
  let items = [];

  try {
    items = JSON.parse(sessionStorage.getItem('comparisonItems')) || [];
  } catch (error) {
    items = [];
  }

  if (items.includes(id)) {
    Utils.showToast('Diese Kategorie ist bereits im Vergleich.', 'info');
    return;
  }

  if (items.length >= 4) {
    Utils.showToast('Du kannst maximal 4 Kategorien vergleichen.', 'warning');
    return;
  }

  items.push(id);
  sessionStorage.setItem('comparisonItems', JSON.stringify(items));
  Utils.showToast('Kategorie zur Vergleichsliste hinzugefügt.', 'success');
}

document.addEventListener('DOMContentLoaded', initFavorites);