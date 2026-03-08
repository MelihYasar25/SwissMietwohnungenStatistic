let allApartments = [];
let comparisonApartments = [];

async function initCompare() {
  showLoading();

  try {
    allApartments = await fetchApartments();

    if (!allApartments || allApartments.length === 0) {
      showError('Keine Daten verfügbar.');
      return;
    }

    loadComparison();
    renderComparison();
  } catch (error) {
    console.error('Compare init error:', error);
    showError('Fehler beim Laden der Vergleichsdaten.');
  }
}

function showLoading() {
  document.getElementById('comparison-container').innerHTML =
    '<div class="text-center"><div class="loading-spinner"></div> Lade Vergleich...</div>';
}

function showError(message) {
  document.getElementById('comparison-container').innerHTML =
    `<div class="alert alert-danger">${message}</div>`;
}

function loadComparison() {
  const saved = sessionStorage.getItem('comparisonItems');

  if (saved) {
    try {
      const ids = JSON.parse(saved);
      comparisonApartments = allApartments.filter(item => ids.includes(item.id)).slice(0, 4);
    } catch (error) {
      console.error('Failed to load comparison items:', error);
      comparisonApartments = [];
    }
  }

  if (!comparisonApartments.length) {
    comparisonApartments = [...allApartments]
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 3);
  }
}

function renderComparison() {
  if (comparisonApartments.length === 0) {
    document.getElementById('comparison-container').innerHTML = `
      <div class="empty-state text-center">
        <h4>Keine Kategorien zum Vergleichen</h4>
        <p>Wähle auf der Suchseite Vergleichseinträge aus oder starte mit den beliebtesten Kategorien.</p>
        <a href="search.html" class="btn btn-primary">Zur Suche</a>
      </div>
    `;
    return;
  }

  const html = `
    <div class="table-responsive">
      <table class="table table-striped comparison-table align-middle">
        <thead>
          <tr>
            <th>Eigenschaft</th>
            ${comparisonApartments.map((item, index) => `<th>Kategorie ${index + 1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Kanton</strong></td>
            ${comparisonApartments.map(item => `<td>${item.canton}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Zimmer</strong></td>
            ${comparisonApartments.map(item => `<td>${item.rooms}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Mietpreisklasse</strong></td>
            ${comparisonApartments.map(item => `<td>${item.price_range}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Wohnungsfläche</strong></td>
            ${comparisonApartments.map(item => `<td>${item.area_m2_range}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Jahr</strong></td>
            ${comparisonApartments.map(item => `<td>${item.year}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Anzahl Wohnungen</strong></td>
            ${comparisonApartments.map(item => `<td>${Number(item.value).toLocaleString('de-CH')}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Bewertung</strong></td>
            ${comparisonApartments.map(item => `<td>${getCategorySummary(item)}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Aktionen</strong></td>
            ${comparisonApartments.map(item => `
              <td>
                <button class="btn btn-outline-danger btn-sm" onclick="removeFromComparison(${item.id})">
                  Entfernen
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 d-flex gap-2">
      <a href="search.html" class="btn btn-primary">Weitere Kategorien suchen</a>
      <button class="btn btn-outline-secondary" onclick="clearComparison()">Vergleich leeren</button>
    </div>
  `;

  document.getElementById('comparison-container').innerHTML = html;
}

function getCategorySummary(item) {
  const count = Number(item.value) || 0;

  if (count > 5000) return 'Sehr häufig';
  if (count > 1000) return 'Häufig';
  if (count > 200) return 'Mittel';
  return 'Eher selten';
}

function removeFromComparison(id) {
  comparisonApartments = comparisonApartments.filter(item => item.id !== id);

  const ids = comparisonApartments.map(item => item.id);
  sessionStorage.setItem('comparisonItems', JSON.stringify(ids));

  renderComparison();
}

function clearComparison() {
  comparisonApartments = [];
  sessionStorage.removeItem('comparisonItems');
  renderComparison();
}

document.addEventListener('DOMContentLoaded', initCompare);