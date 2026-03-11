function getOrderedLabels(dimensionName, dimension) {
  const indexMap = dimension.category.index;
  const labelMap = dimension.category.label;

  return Object.entries(indexMap)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => ({
      key,
      label: labelMap[key] ?? key
    }));
}

function parseRentalDataset(json) {
  const dataset = json.dataset;
  const dimensions = dataset.dimension;
  const values = dataset.value;

  const cantonList = getOrderedLabels('Kanton', dimensions['Kanton']);
  const roomsList = getOrderedLabels('Anzahl Zimmer', dimensions['Anzahl Zimmer']);
  const priceList = getOrderedLabels('Mietpreisklasse', dimensions['Mietpreisklasse']);
  const areaList = getOrderedLabels('Wohnungsfläche', dimensions['Wohnungsfläche']);
  const yearList = getOrderedLabels('Jahr', dimensions['Jahr']);

  const size = dimensions.size;
  const [
    cantonSize,
    roomsSize,
    priceSize,
    areaSize,
    yearSize
  ] = size;

  const rows = [];

  for (let c = 0; c < cantonSize; c++) {
    for (let r = 0; r < roomsSize; r++) {
      for (let p = 0; p < priceSize; p++) {
        for (let a = 0; a < areaSize; a++) {
          for (let y = 0; y < yearSize; y++) {
            const flatIndex =
              (((c * roomsSize + r) * priceSize + p) * areaSize + a) * yearSize + y;

            const value = values[flatIndex];

            if (value === undefined || value === null) continue;

            if (cantonList[c].key === "CH") continue;
            rows.push({
              id: flatIndex,
              canton_code: cantonList[c].key,
              canton: cantonList[c].label,
              rooms_code: roomsList[r].key,
              rooms: roomsList[r].label,
              price_code: priceList[p].key,
              price_range: priceList[p].label,
              area_code: areaList[a].key,
              area_m2_range: areaList[a].label,
              year: yearList[y].label,
              value: value
            });
          }
        }
      }
    }
  }

  return rows;
}

let cachedApartments = null;

async function fetchApartments() {

  if (cachedApartments) return cachedApartments;

  try {
    const response = await fetch('./data/rental_data.json');

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const json = await response.json();
    const rows = parseRentalDataset(json);

    console.log('Parsed rows:', rows);
    cachedApartments = rows;
    return rows;
  } catch (error) {
    console.error('Error fetching rental data:', error);
    return [];
  }
}

window.fetchApartments = fetchApartments;