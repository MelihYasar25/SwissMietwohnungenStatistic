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
  const total = allApartments.reduce((s, item) => s + (Number(item.value) || 0), 0);
  const uniqueCantons = [...new Set(allApartments.map(item => item.canton || item[window.CONFIG?.COLUMNS?.canton] || 'Unknown'))].length;
  let weightedRoomsSum = 0;
  let weightTotal = 0;

  allApartments.forEach(item => {
    const count = Number(item.value) || 0;
    if (count === 0) return;

    let roomsNum = null;
    if (item.rooms_code !== undefined) {
      const n = Number(item.rooms_code);
      if (!Number.isNaN(n)) roomsNum = n;
    }

    if (roomsNum === null && (item.rooms || item[window.CONFIG?.COLUMNS?.rooms])) {
      const label = (item.rooms || item[window.CONFIG?.COLUMNS?.rooms] || '').toString();
      const m = label.match(/[\d]+(?:[.,]\d+)?/); // captures "2", "2.5", "2,5"
      if (m) roomsNum = Number(m[0].replace(',', '.'));
    }

    if (roomsNum === null || Number.isNaN(roomsNum)) return;

    weightedRoomsSum += roomsNum * count;
    weightTotal += count;
  });

  const avgRooms = weightTotal > 0 ? (weightedRoomsSum / weightTotal) : 0;

  const cards = [
    { title: 'Entries', value: total.toLocaleString(), icon: '🏠' },
    { title: 'Cantons', value: uniqueCantons, icon: '🗺️' },
    { title: 'Ø Rooms', value: avgRooms ? avgRooms.toFixed(1) : '—', icon: '📐' }
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
    const canton = item.canton || item[window.CONFIG?.COLUMNS?.canton] || 'Unknown';
    const value = Number(item.value) || 0;
    if (!groups[canton]) groups[canton] = 0;
    groups[canton] += value;
  });

  const sortedCantons = Object.entries(groups)
    .sort(([, aVal], [, bVal]) => bVal - aVal)
    .slice(0, 5);

  const html = sortedCantons.map(([canton, sumValue]) => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${canton}</span>
      <span class="badge bg-primary">${Number(sumValue).toLocaleString()}</span>
    </div>
  `).join('');

  document.getElementById('popular-cantons').innerHTML = html || '<p>No data available</p>';
}

document.addEventListener('DOMContentLoaded', initApp);