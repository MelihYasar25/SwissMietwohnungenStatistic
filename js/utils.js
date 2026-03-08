// Utility functions

// Format currency in CHF
function formatCHF(amount) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF'
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
}

// Calculate price per square meter
function calculatePricePerSqm(price, area) {
  if (!price || !area || area === 0) return 0;
  return price / area;
}

// Show toast message
function showToast(message, type = 'info') {
  // Simple toast implementation using Bootstrap
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// Get favorites from localStorage
function getFavorites() {
  const favorites = localStorage.getItem('favorites');
  return favorites ? JSON.parse(favorites) : [];
}

// Save favorites to localStorage
function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Add to favorites
function addToFavorites(apartmentId) {
  const favorites = getFavorites();
  if (!favorites.includes(apartmentId)) {
    favorites.push(apartmentId);
    saveFavorites(favorites);
    showToast('Apartment added to favorites', 'success');
  }
}

// Remove from favorites
function removeFromFavorites(apartmentId) {
  const favorites = getFavorites();
  const index = favorites.indexOf(apartmentId);
  if (index > -1) {
    favorites.splice(index, 1);
    saveFavorites(favorites);
    showToast('Apartment removed from favorites', 'info');
  }
}

// Check if apartment is favorite
function isFavorite(apartmentId) {
  const favorites = getFavorites();
  return favorites.includes(apartmentId);
}

// Get unique values for filters
function getUniqueValues(data, key) {
  return [...new Set(data.map(item => item[key]).filter(val => val))];
}

// Filter apartments based on criteria
function filterApartments(apartments, filters) {
  return apartments.filter(apt => {
    if (filters.canton && apt[CONFIG.COLUMNS.canton] !== filters.canton) return false;
    if (filters.city && apt[CONFIG.COLUMNS.city] !== filters.city) return false;
    if (filters.zip_code && apt[CONFIG.COLUMNS.zip_code] !== filters.zip_code) return false;
    if (filters.minPrice && apt[CONFIG.COLUMNS.price] < filters.minPrice) return false;
    if (filters.maxPrice && apt[CONFIG.COLUMNS.price] > filters.maxPrice) return false;
    if (filters.minArea && apt[CONFIG.COLUMNS.area_sqm] < filters.minArea) return false;
    if (filters.maxArea && apt[CONFIG.COLUMNS.area_sqm] > filters.maxArea) return false;
    if (filters.rooms && apt[CONFIG.COLUMNS.rooms] != filters.rooms) return false;
    if (filters.property_type && apt[CONFIG.COLUMNS.property_type] !== filters.property_type) return false;
    if (filters.furnished !== undefined && apt[CONFIG.COLUMNS.furnished] !== filters.furnished) return false;
    if (filters.balcony !== undefined && apt[CONFIG.COLUMNS.balcony] !== filters.balcony) return false;
    if (filters.pets_allowed !== undefined && apt[CONFIG.COLUMNS.pets_allowed] !== filters.pets_allowed) return false;
    if (filters.public_transport_nearby !== undefined && apt[CONFIG.COLUMNS.public_transport_nearby] !== filters.public_transport_nearby) return false;
    return true;
  });
}

// Sort apartments
function sortApartments(apartments, sortBy) {
  return apartments.sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a[CONFIG.COLUMNS.price] - b[CONFIG.COLUMNS.price];
      case 'price_desc':
        return b[CONFIG.COLUMNS.price] - a[CONFIG.COLUMNS.price];
      case 'area_asc':
        return a[CONFIG.COLUMNS.area_sqm] - b[CONFIG.COLUMNS.area_sqm];
      case 'area_desc':
        return b[CONFIG.COLUMNS.area_sqm] - a[CONFIG.COLUMNS.area_sqm];
      case 'rooms':
        return a[CONFIG.COLUMNS.rooms] - b[CONFIG.COLUMNS.rooms];
      case 'newest':
        return new Date(b[CONFIG.COLUMNS.created_at]) - new Date(a[CONFIG.COLUMNS.created_at]);
      default:
        return 0;
    }
  });
}

// Calculate statistics
function calculateStats(apartments) {
  if (!apartments.length) return {};

  const prices = apartments.map(a => a[CONFIG.COLUMNS.price]).filter(p => p);
  const areas = apartments.map(a => a[CONFIG.COLUMNS.area_sqm]).filter(a => a);
  const rooms = apartments.map(a => a[CONFIG.COLUMNS.rooms]).filter(r => r);

  return {
    totalApartments: apartments.length,
    avgPrice: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
    avgArea: areas.length ? areas.reduce((a, b) => a + b, 0) / areas.length : 0,
    avgPricePerSqm: areas.length && prices.length ? prices.reduce((a, b) => a + b, 0) / areas.reduce((a, b) => a + b, 0) : 0,
    avgRooms: rooms.length ? rooms.reduce((a, b) => a + b, 0) / rooms.length : 0,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0
  };
}

// Group by canton
function groupByCanton(apartments) {
  const groups = {};
  apartments.forEach(apt => {
    const canton = apt[CONFIG.COLUMNS.canton] || 'Unknown';
    if (!groups[canton]) groups[canton] = [];
    groups[canton].push(apt);
  });
  return groups;
}

// Group by city
function groupByCity(apartments) {
  const groups = {};
  apartments.forEach(apt => {
    const city = apt[CONFIG.COLUMNS.city] || 'Unknown';
    if (!groups[city]) groups[city] = [];
    groups[city].push(apt);
  });
  return groups;
}

// Export utilities
window.Utils = {
  formatCHF,
  formatDate,
  calculatePricePerSqm,
  showToast,
  getFavorites,
  saveFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  getUniqueValues,
  filterApartments,
  sortApartments,
  calculateStats,
  groupByCanton,
  groupByCity
};