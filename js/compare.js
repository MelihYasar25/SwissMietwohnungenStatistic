// Comparison functionality
let allApartments = [];
let comparisonApartments = [];

async function initCompare() {
  showLoading();
  allApartments = await fetchApartments();
  hideLoading();
  if (allApartments.length === 0) {
    showError('Keine Daten verfügbar.');
    return;
  }
  loadComparison();
  renderComparison();
}

function showLoading() {
  document.getElementById('comparison-container').innerHTML = '<div class="text-center"><div class="loading-spinner"></div> Lade Vergleich...</div>';
}

function hideLoading() {
  // Remove loading
}

function showError(message) {
  document.getElementById('comparison-container').innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function loadComparison() {
  // For demo, load some apartments. In real app, this would be from sessionStorage or similar
  comparisonApartments = allApartments.slice(0, 3); // Demo: first 3 apartments
}

function renderComparison() {
  if (comparisonApartments.length === 0) {
    document.getElementById('comparison-container').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-bar-chart"></i>
        <h4>Keine Wohnungen zum Vergleichen</h4>
        <p>Suche nach Wohnungen und füge sie zum Vergleich hinzu.</p>
        <a href="search.html" class="btn btn-primary">Wohnungen suchen</a>
      </div>
    `;
    return;
  }

  const html = `
    <div class="table-responsive">
      <table class="table table-striped comparison-table">
        <thead>
          <tr>
            <th>Eigenschaft</th>
            ${comparisonApartments.map(apt => `<th>${apt[CONFIG.COLUMNS.title] || 'Wohnung'}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Bild</strong></td>
            ${comparisonApartments.map(apt => `<td><img src="${apt[CONFIG.COLUMNS.image_url] || 'https://via.placeholder.com/100x75?text=Kein+Bild'}" class="img-fluid" alt="Wohnung"></td>`).join('')}
          </tr>
          <tr>
            <td><strong>Preis</strong></td>
            ${comparisonApartments.map(apt => `<td>${Utils.formatCHF(apt[CONFIG.COLUMNS.price])}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Fläche</strong></td>
            ${comparisonApartments.map(apt => `<td>${apt[CONFIG.COLUMNS.area_sqm]} m²</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Zimmer</strong></td>
            ${comparisonApartments.map(apt => `<td>${apt[CONFIG.COLUMNS.rooms]}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Stadt</strong></td>
            ${comparisonApartments.map(apt => `<td>${apt[CONFIG.COLUMNS.city]}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Kanton</strong></td>
            ${comparisonApartments.map(apt => `<td>${apt[CONFIG.COLUMNS.canton]}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Preis pro m²</strong></td>
            ${comparisonApartments.map(apt => `<td>${Utils.formatCHF(Utils.calculatePricePerSqm(apt[CONFIG.COLUMNS.price], apt[CONFIG.COLUMNS.area_sqm]))}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Ausstattung</strong></td>
            ${comparisonApartments.map(apt => `<td>${apt[CONFIG.COLUMNS.features] ? apt[CONFIG.COLUMNS.features].join(', ') : 'Keine Angaben'}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Aktionen</strong></td>
            ${comparisonApartments.map(apt => `<td><a href="search.html?id=${apt[CONFIG.COLUMNS.id]}" class="btn btn-primary btn-sm">Details</a></td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('comparison-container').innerHTML = html;
}

// Initialize
document.addEventListener('DOMContentLoaded', initCompare);