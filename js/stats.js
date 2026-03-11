let allApartments = [];
let statsCharts = [];

async function initStats() {
  showLoading();

  try {
    allApartments = await fetchApartments();

    if (!allApartments || allApartments.length === 0) {
      showError('No data available.');
      return;
    }

    clearLoading();
    renderSummaryStats();
    renderInsights();
    renderYearTrendChart();
    renderCantonChart();
    renderRoomsChart();
    renderPriceChart();
  } catch (error) {
    console.error('Stats init error:', error);
    showError('Error loading statistics data.');
  }
}

function showLoading() {
  const ids = [
    'stat-total-entries',
    'stat-total-apartments',
    'stat-cantons',
    'stat-years',
    'stats-insights'
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '<div class="text-center"><div class="loading-spinner"></div></div>';
    }
  });
}

function clearLoading() {
  const insightEl = document.getElementById('stats-insights');
  if (insightEl) insightEl.innerHTML = '';
}

function showError(message) {
  const container = document.querySelector('.dashboard-main .container');
  if (!container) return;

  container.innerHTML = `
    <div class="dashboard-card">
      <div class="alert alert-danger mb-0">${message}</div>
    </div>
  `;
}

function getColumns() {
  if (typeof CONFIG !== 'undefined' && CONFIG.COLUMNS) {
    return {
      canton: CONFIG.COLUMNS.canton || 'canton',
      rooms: CONFIG.COLUMNS.rooms || 'rooms',
      priceRange: CONFIG.COLUMNS.price_range || 'price_range',
      area: CONFIG.COLUMNS.area_m2_range || 'area_m2_range',
      year: CONFIG.COLUMNS.year || 'year',
      value: CONFIG.COLUMNS.value || 'value'
    };
  }

  return {
    canton: 'canton',
    rooms: 'rooms',
    priceRange: 'price_range',
    area: 'area_m2_range',
    year: 'year',
    value: 'value'
  };
}

function getValue(item, key) {
  return item?.[key];
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-CH');
}

function getTotalCount() {
  const cols = getColumns();
  return allApartments.reduce((sum, item) => sum + toNumber(getValue(item, cols.value)), 0);
}

function aggregateBy(key) {
  const cols = getColumns();
  const result = {};

  allApartments.forEach(item => {
    const group = getValue(item, key);
    const value = toNumber(getValue(item, cols.value));

    if (group === null || group === undefined || group === '') return;

    if (!result[group]) result[group] = 0;
    result[group] += value;
  });

  return result;
}

function renderSummaryStats() {
  const cols = getColumns();

  const totalEntries = allApartments.length;
  const totalApartments = getTotalCount();

  const uniqueCantons = new Set(
    allApartments.map(item => getValue(item, cols.canton)).filter(Boolean)
  ).size;

  const years = allApartments
    .map(item => Number(getValue(item, cols.year)))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  const minYear = years.length ? years[0] : '-';
  const maxYear = years.length ? years[years.length - 1] : '-';

  const totalEntriesEl = document.getElementById('stat-total-entries');
  const totalApartmentsEl = document.getElementById('stat-total-apartments');
  const cantonsEl = document.getElementById('stat-cantons');
  const yearsEl = document.getElementById('stat-years');

  if (totalEntriesEl) totalEntriesEl.textContent = formatNumber(totalEntries);
  if (totalApartmentsEl) totalApartmentsEl.textContent = formatNumber(totalApartments);
  if (cantonsEl) cantonsEl.textContent = formatNumber(uniqueCantons);
  if (yearsEl) yearsEl.textContent = years.length ? `${minYear}–${maxYear}` : '-';
}

function renderInsights() {
  const cols = getColumns();

  const cantonTotals = aggregateBy(cols.canton);
  const roomTotals = aggregateBy(cols.rooms);
  const priceTotals = aggregateBy(cols.priceRange);
  const yearTotals = aggregateBy(cols.year);

  const topCanton = getTopEntry(cantonTotals);
  const topRoom = getTopEntry(roomTotals);
  const topPrice = getTopEntry(priceTotals);
  const latestYear = getLatestNumericKey(yearTotals);

  const insights = [
    {
      title: 'Top canton',
      text: topCanton
        ? `${topCanton.label} has the highest apartment count with ${formatNumber(topCanton.value)} apartments.`
        : 'No canton data available.'
    },
    {
      title: 'Most common room category',
      text: topRoom
        ? `${topRoom.label} is the most represented room category with ${formatNumber(topRoom.value)} apartments.`
        : 'No room data available.'
    },
    {
      title: 'Most common rent range',
      text: topPrice
        ? `${topPrice.label} appears most often with ${formatNumber(topPrice.value)} apartments.`
        : 'No rent range data available.'
    },
    {
      title: 'Latest year in dataset',
      text: latestYear
        ? `The newest year available in the dataset is ${latestYear}.`
        : 'No year data available.'
    }
  ];

  const container = document.getElementById('stats-insights');
  if (!container) return;

  container.innerHTML = insights.map(item => `
    <div class="insight-card">
      <h6>${escapeHtml(item.title)}</h6>
      <p>${escapeHtml(item.text)}</p>
    </div>
  `).join('');
}

function renderYearTrendChart() {
  const cols = getColumns();
  const yearTotals = aggregateBy(cols.year);

  const entries = Object.entries(yearTotals)
    .map(([year, count]) => ({
      label: Number(year),
      value: count
    }))
    .filter(item => Number.isFinite(item.label))
    .sort((a, b) => a.label - b.label);

  createChart(
    'yearTrendChart',
    'line',
    {
      labels: entries.map(item => item.label),
      datasets: [
        {
          label: 'Apartment count',
          data: entries.map(item => item.value),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatNumber(value)
          }
        }
      }
    }
  );
}

function renderCantonChart() {
  const cols = getColumns();
  const cantonTotals = aggregateBy(cols.canton);

  const topCantons = Object.entries(cantonTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  createChart(
    'cantonChart',
    'bar',
    {
      labels: topCantons.map(item => item[0]),
      datasets: [
        {
          label: 'Apartment count',
          data: topCantons.map(item => item[1]),
          backgroundColor: '#3b82f6',
          borderRadius: 10,
          borderSkipped: false
        }
      ]
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatNumber(value)
          }
        }
      }
    }
  );
}

function renderRoomsChart() {
  const cols = getColumns();
  const roomTotals = aggregateBy(cols.rooms);

  const entries = Object.entries(roomTotals)
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'en', { numeric: true }));

  createChart(
    'roomsChart',
    'doughnut',
    {
      labels: entries.map(item => item[0]),
      datasets: [
        {
          data: entries.map(item => item[1]),
          backgroundColor: [
            '#2563eb',
            '#60a5fa',
            '#818cf8',
            '#38bdf8',
            '#22c55e',
            '#f59e0b',
            '#ef4444',
            '#a855f7',
            '#14b8a6'
          ],
          borderWidth: 0
        }
      ]
    },
    {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  );
}

function renderPriceChart() {
  const cols = getColumns();
  const priceTotals = aggregateBy(cols.priceRange);

  const entries = Object.entries(priceTotals)
    .sort((a, b) => getPriceOrder(a[0]) - getPriceOrder(b[0]));

  createChart(
    'priceChart',
    'bar',
    {
      labels: entries.map(item => item[0]),
      datasets: [
        {
          label: 'Apartment count',
          data: entries.map(item => item[1]),
          backgroundColor: '#6366f1',
          borderRadius: 10,
          borderSkipped: false
        }
      ]
    },
    {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: value => formatNumber(value)
          }
        }
      }
    }
  );
}

function createChart(canvasId, type, data, options) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;

  const existing = statsCharts.find(chart => chart.canvas.id === canvasId);
  if (existing) {
    existing.destroy();
    statsCharts = statsCharts.filter(chart => chart.canvas.id !== canvasId);
  }

  const chart = new Chart(canvas, {
    type,
    data,
    options
  });

  statsCharts.push(chart);
}

function getTopEntry(objectMap) {
  const entries = Object.entries(objectMap);
  if (!entries.length) return null;

  const [label, value] = entries.sort((a, b) => b[1] - a[1])[0];
  return { label, value };
}

function getLatestNumericKey(objectMap) {
  const keys = Object.keys(objectMap)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  return keys.length ? keys[0] : null;
}

function getPriceOrder(priceRange) {
  const order = [
    'unter 400 Fr.',
    '400 - 599 Fr.',
    '600 - 799 Fr.',
    '800 - 999 Fr.',
    '1000 - 1199 Fr.',
    '1200 - 1399 Fr.',
    '1400 - 1599 Fr.',
    '1600 - 1799 Fr.',
    '1800 - 1999 Fr.',
    '2000 - 2399 Fr.',
    '2400 Fr. und +',
    'Keine bewohnte Mietwohnung',
    'Angabe fehlt'
  ];

  const index = order.indexOf(priceRange);
  return index === -1 ? 999 : index;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.addEventListener('DOMContentLoaded', initStats);