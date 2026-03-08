let allApartments = [];

async function initStats() {
  showLoading();

  try {
    allApartments = await fetchApartments();

    if (!allApartments || allApartments.length === 0) {
      showError('Keine Daten verfügbar.');
      return;
    }

    renderTotalStats();
    renderCantonStats();
    renderYearStats();
    renderRoomsDistribution();
    renderPriceRange();
  } catch (error) {
    console.error('Stats init error:', error);
    showError('Fehler beim Laden der Daten.');
  }
}

function showLoading() {
  document.getElementById('total-stats').innerHTML =
    '<div class="text-center"><div class="loading-spinner"></div></div>';
}

function showError(message) {
  document.getElementById('total-stats').innerHTML =
    `<div class="alert alert-danger">${message}</div>`;
}

function getTotalCount() {
  return allApartments.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
}

function renderTotalStats() {
  const totalRows = allApartments.length;
  const totalApartments = getTotalCount();
  const uniqueCantons = [...new Set(allApartments.map(item => item.canton))].length;
  const uniqueYears = [...new Set(allApartments.map(item => item.year))].length;

  const html = `
    <div class="h4 mb-2">${totalApartments.toLocaleString('de-CH')}</div>
    <small class="text-muted">Total gezählte Mietwohnungen</small>
    <hr>
    <div class="row text-center">
      <div class="col-6 mb-3">
        <div class="h5 mb-0">${totalRows.toLocaleString('de-CH')}</div>
        <small class="text-muted">Datensätze</small>
      </div>
      <div class="col-6 mb-3">
        <div class="h5 mb-0">${uniqueCantons}</div>
        <small class="text-muted">Kantone</small>
      </div>
      <div class="col-12">
        <div class="h5 mb-0">${uniqueYears}</div>
        <small class="text-muted">Jahre</small>
      </div>
    </div>
  `;

  document.getElementById('total-stats').innerHTML = html;
}

function renderCantonStats() {
  const cantonMap = {};

  allApartments.forEach(item => {
    if (!cantonMap[item.canton]) {
      cantonMap[item.canton] = 0;
    }
    cantonMap[item.canton] += Number(item.value) || 0;
  });

  const cantonStats = Object.entries(cantonMap)
    .map(([canton, count]) => ({ canton, count }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...cantonStats.map(item => item.count), 1);

  const html = cantonStats.map(stat => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${stat.canton}</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 160px;">
          <div class="stats-fill" style="width: ${(stat.count / maxCount) * 100}%"></div>
        </div>
        <span class="badge bg-primary">${stat.count.toLocaleString('de-CH')}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('canton-avg-rent').innerHTML = html || '<p>Keine Daten verfügbar</p>';
}

function renderYearStats() {
  const yearMap = {};

  allApartments.forEach(item => {
    if (!yearMap[item.year]) {
      yearMap[item.year] = 0;
    }
    yearMap[item.year] += Number(item.value) || 0;
  });

  const yearStats = Object.entries(yearMap)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  const maxCount = Math.max(...yearStats.map(item => item.count), 1);

  const html = yearStats.map(stat => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${stat.year}</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 140px;">
          <div class="stats-fill" style="width: ${(stat.count / maxCount) * 100}%"></div>
        </div>
        <span class="badge bg-primary">${stat.count.toLocaleString('de-CH')}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('city-avg-rent').innerHTML = html || '<p>Keine Daten verfügbar</p>';
}

function renderRoomsDistribution() {
  const roomsMap = {};

  allApartments.forEach(item => {
    if (!roomsMap[item.rooms]) {
      roomsMap[item.rooms] = 0;
    }
    roomsMap[item.rooms] += Number(item.value) || 0;
  });

  const total = getTotalCount();

  const roomStats = Object.entries(roomsMap)
    .map(([rooms, count]) => ({ rooms, count }))
    .sort((a, b) => a.rooms.localeCompare(b.rooms, 'de', { numeric: true }));

  const html = roomStats.map(stat => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${stat.rooms}</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 120px;">
          <div class="stats-fill" style="width: ${(stat.count / total) * 100}%"></div>
        </div>
        <span class="badge bg-primary">${stat.count.toLocaleString('de-CH')}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('rooms-distribution').innerHTML = html || '<p>Keine Daten verfügbar</p>';
}

function renderPriceRange() {
  const priceMap = {};

  allApartments.forEach(item => {
    if (!priceMap[item.price_range]) {
      priceMap[item.price_range] = 0;
    }
    priceMap[item.price_range] += Number(item.value) || 0;
  });

  const total = getTotalCount();

  const priceStats = Object.entries(priceMap)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => b.count - a.count);

  const html = priceStats.map(stat => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${stat.range}</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 160px;">
          <div class="stats-fill" style="width: ${(stat.count / total) * 100}%"></div>
        </div>
        <span class="badge bg-primary">${stat.count.toLocaleString('de-CH')}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('price-range').innerHTML = html || '<p>Keine Daten verfügbar</p>';
}

document.addEventListener('DOMContentLoaded', initStats);