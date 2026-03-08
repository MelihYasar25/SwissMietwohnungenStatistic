let allApartments = [];

async function initApp() {
  showLoading();

  try {
    allApartments = await window.fetchApartments();
    console.log('Loaded data:', allApartments);

    if (!allApartments || allApartments.length === 0) {
      showError('No data available. Please check the database connection.');
      return;
    }

    renderSummaryCards();
    renderPopularCantons();
    renderLatestApartments();
  } catch (error) {
    console.error('Init error:', error);
    showError('Failed to load data.');
  }
}

function showLoading() {
  document.getElementById('summary-cards').innerHTML =
    '<div class="col-12 text-center"><div class="loading-spinner"></div> Loading data...</div>';
}

function hideLoading() {
}

function showError(message) {
  document.getElementById('summary-cards').innerHTML =
    `<div class="col-12"><div class="alert alert-danger">${message}</div></div>`;
}

function renderSummaryCards() {
  const total = allApartments.length;
  const uniqueCantons = [...new Set(allApartments.map(item => item[window.CONFIG.COLUMNS.canton]))].length;
  const avgRooms =
    allApartments.reduce((sum, item) => sum + (Number(item[window.CONFIG.COLUMNS.rooms]) || 0), 0) / total;

  const cards = [
    { title: 'Datensätze', value: total, icon: '🏠' },
    { title: 'Kantone', value: uniqueCantons, icon: '🗺️' },
    { title: 'Ø Zimmer', value: avgRooms.toFixed(1), icon: '📐' }
  ];

  const html = cards.map(card => `
    <div class="col-md-4 mb-4">
      <div class="card text-center">
        <div class="card-body">
          <div class="display-4">${card.icon}</div>
          <h5 class="card-title">${card.title}</h5>
          <p class="card-text h4">${card.value}</p>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('summary-cards').innerHTML = html;
}

function renderPopularCantons() {
  const groups = {};

  allApartments.forEach(item => {
    const canton = item[window.CONFIG.COLUMNS.canton] || 'Unknown';
    if (!groups[canton]) groups[canton] = [];
    groups[canton].push(item);
  });

  const sortedCantons = Object.entries(groups)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 5);

  const html = sortedCantons.map(([canton, entries]) => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${canton}</span>
      <span class="badge bg-primary">${entries.length}</span>
    </div>
  `).join('');

  document.getElementById('popular-cantons').innerHTML = html || '<p>No data available</p>';
}

function renderLatestApartments() {
  const latest = allApartments.slice(0, 3);

  const html = latest.map(item => `
    <div class="card mb-3">
      <div class="card-body">
        <h6 class="card-title">${item[window.CONFIG.COLUMNS.canton] || 'Unknown Canton'}</h6>
        <p class="card-text mb-1"><strong>Rooms:</strong> ${item[window.CONFIG.COLUMNS.rooms] ?? '-'}</p>
        <p class="card-text mb-1"><strong>Price Range:</strong> ${item[window.CONFIG.COLUMNS.price_range] ?? '-'}</p>
        <p class="card-text"><strong>Area Range:</strong> ${item[window.CONFIG.COLUMNS.area_m2_range] ?? '-'}</p>
      </div>
    </div>
  `).join('');

  document.getElementById('latest-apartments').innerHTML = html || '<p>No data available</p>';
}

document.addEventListener('DOMContentLoaded', initApp);