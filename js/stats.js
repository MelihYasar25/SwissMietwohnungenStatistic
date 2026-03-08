// Statistics functionality
let allApartments = [];

async function initStats() {
  showLoading();
  allApartments = await fetchApartments();
  hideLoading();
  if (allApartments.length === 0) {
    showError('Keine Daten verfügbar.');
    return;
  }
  renderTotalStats();
  renderCantonAvgRent();
  renderCityAvgRent();
  renderRoomsDistribution();
  renderPriceRange();
}

function showLoading() {
  document.getElementById('total-stats').innerHTML = '<div class="text-center"><div class="loading-spinner"></div></div>';
}

function hideLoading() {
  // Remove loading
}

function showError(message) {
  document.getElementById('total-stats').innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function renderTotalStats() {
  const stats = Utils.calculateStats(allApartments);
  const html = `
    <div class="h2 mb-0">${stats.totalApartments}</div>
    <small class="text-muted">Wohnungen</small>
    <hr>
    <div class="row text-center">
      <div class="col-6">
        <div class="h5 mb-0">${Utils.formatCHF(stats.avgPrice)}</div>
        <small class="text-muted">Ø Miete</small>
      </div>
      <div class="col-6">
        <div class="h5 mb-0">${stats.avgArea.toFixed(1)} m²</div>
        <small class="text-muted">Ø Fläche</small>
      </div>
    </div>
  `;
  document.getElementById('total-stats').innerHTML = html;
}

function renderCantonAvgRent() {
  const cantonGroups = Utils.groupByCanton(allApartments);
  const cantonStats = Object.entries(cantonGroups).map(([canton, apartments]) => {
    const avgPrice = apartments.reduce((sum, apt) => sum + apt[CONFIG.COLUMNS.price], 0) / apartments.length;
    return { canton, avgPrice, count: apartments.length };
  }).sort((a, b) => b.avgPrice - a.avgPrice);

  const maxPrice = Math.max(...cantonStats.map(s => s.avgPrice));

  const html = cantonStats.map(stat => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${stat.canton} (${stat.count})</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 150px;">
          <div class="stats-fill" style="width: ${(stat.avgPrice / maxPrice * 100)}%"></div>
        </div>
        <span class="badge bg-primary">${Utils.formatCHF(stat.avgPrice)}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('canton-avg-rent').innerHTML = html || '<p>Keine Daten verfügbar</p>';
}

function renderCityAvgRent() {
  const cityGroups = Utils.groupByCity(allApartments);
  const cityStats = Object.entries(cityGroups)
    .filter(([, apartments]) => apartments.length >= 3) // Only cities with at least 3 apartments
    .map(([city, apartments]) => {
      const avgPrice = apartments.reduce((sum, apt) => sum + apt[CONFIG.COLUMNS.price], 0) / apartments.length;
      return { city, avgPrice, count: apartments.length };
    })
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 10); // Top 10

  const maxPrice = Math.max(...cityStats.map(s => s.avgPrice));

  const html = cityStats.map(stat => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${stat.city} (${stat.count})</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 120px;">
          <div class="stats-fill" style="width: ${(stat.avgPrice / maxPrice * 100)}%"></div>
        </div>
        <span class="badge bg-primary">${Utils.formatCHF(stat.avgPrice)}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('city-avg-rent').innerHTML = html || '<p>Keine Daten verfügbar</p>';
}

function renderRoomsDistribution() {
  const roomsCount = {};
  allApartments.forEach(apt => {
    const rooms = apt[CONFIG.COLUMNS.rooms];
    roomsCount[rooms] = (roomsCount[rooms] || 0) + 1;
  });

  const total = allApartments.length;
  const sortedRooms = Object.entries(roomsCount).sort(([a], [b]) => parseInt(a) - parseInt(b));

  const html = sortedRooms.map(([rooms, count]) => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${rooms} Zimmer</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 100px;">
          <div class="stats-fill" style="width: ${(count / total * 100)}%"></div>
        </div>
        <span class="badge bg-primary">${count}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('rooms-distribution').innerHTML = html || '<p>Keine Daten verfügbar</p>';
}

function renderPriceRange() {
  const prices = allApartments.map(a => a[CONFIG.COLUMNS.price]).filter(p => p).sort((a, b) => a - b);
  if (prices.length === 0) {
    document.getElementById('price-range').innerHTML = '<p>Keine Preisdaten verfügbar</p>';
    return;
  }

  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];
  const medianPrice = prices[Math.floor(prices.length / 2)];
  const q1 = prices[Math.floor(prices.length / 4)];
  const q3 = prices[Math.floor(3 * prices.length / 4)];

  const html = `
    <div class="row text-center">
      <div class="col-md-2">
        <div class="h4 mb-0">${Utils.formatCHF(minPrice)}</div>
        <small class="text-muted">Minimum</small>
      </div>
      <div class="col-md-2">
        <div class="h4 mb-0">${Utils.formatCHF(q1)}</div>
        <small class="text-muted">1. Quartil</small>
      </div>
      <div class="col-md-4">
        <div class="h4 mb-0">${Utils.formatCHF(medianPrice)}</div>
        <small class="text-muted">Median</small>
      </div>
      <div class="col-md-2">
        <div class="h4 mb-0">${Utils.formatCHF(q3)}</div>
        <small class="text-muted">3. Quartil</small>
      </div>
      <div class="col-md-2">
        <div class="h4 mb-0">${Utils.formatCHF(maxPrice)}</div>
        <small class="text-muted">Maximum</small>
      </div>
    </div>
  `;

  document.getElementById('price-range').innerHTML = html;
}

// Initialize
document.addEventListener('DOMContentLoaded', initStats);