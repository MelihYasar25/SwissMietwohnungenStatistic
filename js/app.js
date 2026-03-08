// Dashboard / App initialization
let allApartments = [];

async function initApp() {
  showLoading();
  allApartments = await fetchApartments();
  hideLoading();
  if (allApartments.length === 0) {
    showError('No data available. Please check the database connection.');
    return;
  }
  renderSummaryCards();
  renderPopularCantons();
  renderLatestApartments();
}

function showLoading() {
  document.getElementById('summary-cards').innerHTML = '<div class="col-12 text-center"><div class="loading-spinner"></div> Loading data...</div>';
}

function hideLoading() {
  // Remove loading indicator
}

function showError(message) {
  document.getElementById('summary-cards').innerHTML = `<div class="col-12"><div class="alert alert-danger">${message}</div></div>`;
}

function renderSummaryCards() {
  const stats = Utils.calculateStats(allApartments);
  const cantonGroups = Utils.groupByCanton(allApartments);

  const cards = [
    { title: 'Number of Apartments', value: stats.totalApartments, icon: '🏠' },
    { title: 'Average Rent', value: Utils.formatCHF(stats.avgPrice), icon: '💰' },
    { title: 'Average Living Space', value: `${stats.avgArea.toFixed(1)} m²`, icon: '📐' },
    { title: 'Average Price per m²', value: Utils.formatCHF(stats.avgPricePerSqm), icon: '📊' },
    { title: 'Apartments per Canton', value: Object.keys(cantonGroups).length, icon: '🗺️' }
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
  const cantonGroups = Utils.groupByCanton(allApartments);
  const sortedCantons = Object.entries(cantonGroups)
    .sort(([,a], [,b]) => b.length - a.length)
    .slice(0, 5);

  const html = sortedCantons.map(([canton, apartments]) => `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span>${canton}</span>
      <div class="d-flex align-items-center">
        <div class="stats-bar flex-grow-1 me-2" style="width: 100px;">
          <div class="stats-fill" style="width: ${(apartments.length / allApartments.length * 100)}%"></div>
        </div>
        <span class="badge bg-primary">${apartments.length}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('popular-cantons').innerHTML = html || '<p>No data available</p>';
}

function renderLatestApartments() {
  const latest = allApartments
    .sort((a, b) => new Date(b[CONFIG.COLUMNS.created_at]) - new Date(a[CONFIG.COLUMNS.created_at]))
    .slice(0, 3);

  const html = latest.map(apt => `
    <div class="card apartment-card mb-3">
      <img src="${apt[CONFIG.COLUMNS.image_url] || 'https://via.placeholder.com/300x200?text=No+Image'}" class="card-img-top" alt="Apartment">
      <div class="card-body">
        <h6 class="card-title">${apt[CONFIG.COLUMNS.title] || 'Unnamed Apartment'}</h6>
        <p class="card-text">${Utils.formatCHF(apt[CONFIG.COLUMNS.price])} - ${apt[CONFIG.COLUMNS.city]}, ${apt[CONFIG.COLUMNS.canton]}</p>
        <a href="search.html?id=${apt[CONFIG.COLUMNS.id]}" class="btn btn-primary btn-sm">Details</a>
      </div>
    </div>
  `).join('');

  document.getElementById('latest-apartments').innerHTML = html || '<p>No apartments available</p>';
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);