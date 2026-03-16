let allApartments = [];
let comparisonApartments = [];

async function initCompare() {
  showLoading();

  try {
    allApartments = await fetchApartments();

    if (!allApartments || allApartments.length === 0) {
      showError('No data available.');
      return;
    }

    loadComparison();
    renderComparison();
  } catch (error) {
    console.error('Compare init error:', error);
    showError('Error loading comparison data.');
  }
}

function showLoading() {
  document.getElementById('comparison-container').innerHTML =
    '<div class="text-center"><div class="loading-spinner"></div> Loading comparison...</div>';
}

function showError(message) {
  document.getElementById('comparison-container').innerHTML =
    `<div class="alert alert-danger">${message}</div>`;
}

function loadComparison() {
  const saved = localStorage.getItem('comparisonItems');

  if (saved) {
    try {
      const ids = JSON.parse(saved);
      comparisonApartments = allApartments.filter(item => ids.includes(item.id));
    } catch (error) {
      console.error('Failed to load comparison items:', error);
      comparisonApartments = [];
    }
  } else {
    comparisonApartments = [];
  }
}

function renderComparison() {
  if (comparisonApartments.length === 0) {
    document.getElementById('comparison-container').innerHTML = `
      <div class="empty-state text-center">
        <h4>No categories to compare</h4>
        <p>Select categories from the search page to compare them.</p>
        <a href="search.html" class="btn btn-primary">Go to search</a>
      </div>
    `;
    return;
  }

  const html = `
    <div class="table-responsive">
      <table class="table table-striped comparison-table align-middle">
        <thead>
          <tr>
            <th>Property</th>
            ${comparisonApartments.map((item, index) => `<th>Category ${index + 1}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Canton</strong></td>
            ${comparisonApartments.map(item => `<td>${item.canton}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Rooms</strong></td>
            ${comparisonApartments.map(item => `<td>${item.rooms}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Rent range</strong></td>
            ${comparisonApartments.map(item => `<td>${item.price_range}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Living area</strong></td>
            ${comparisonApartments.map(item => `<td>${item.area_m2_range}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Year</strong></td>
            ${comparisonApartments.map(item => `<td>${item.year}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Apartment count</strong></td>
            ${comparisonApartments.map(item => `<td>${Number(item.value).toLocaleString('en-CH')}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Rating</strong></td>
            ${comparisonApartments.map(item => `<td>${getCategorySummary(item)}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Actions</strong></td>
            ${comparisonApartments.map(item => `
              <td>
                <button class="btn btn-outline-danger btn-sm" onclick="removeFromComparison(${item.id})">
                  Remove
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-3 d-flex gap-2">
      <a href="search.html" class="btn btn-primary">Search more categories</a>
      <button class="btn btn-outline-secondary" onclick="clearComparison()">Clear comparison</button>
    </div>
  `;

  document.getElementById('comparison-container').innerHTML = html;
}

function getCategorySummary(item) {
  const count = Number(item.value) || 0;

  if (count > 5000) return 'Very common';
  if (count > 1000) return 'Common';
  if (count > 200) return 'Medium';
  return 'Rare';
}

function removeFromComparison(id) {
  comparisonApartments = comparisonApartments.filter(item => item.id !== id);

  const ids = comparisonApartments.map(item => item.id);
  localStorage.setItem('comparisonItems', JSON.stringify(ids));

  renderComparison();
}

function clearComparison() {
  comparisonApartments = [];
  localStorage.removeItem('comparisonItems');
  renderComparison();
}

document.addEventListener('DOMContentLoaded', initCompare);