let allApartments = [];
let currentQuestion = 0;
let answers = {};

const questions = [
  {
    id: 'canton',
    question: 'In welchem Kanton möchtest du wohnen?',
    type: 'select',
    options: []
  },
  {
    id: 'budget',
    question: 'Welche Mietpreisklasse passt am besten zu deinem Budget?',
    type: 'select',
    options: [
      { value: 'unter 400 Fr.', label: 'Unter 400 Fr.' },
      { value: '400 - 599 Fr.', label: '400 - 599 Fr.' },
      { value: '600 - 799 Fr.', label: '600 - 799 Fr.' },
      { value: '800 - 999 Fr.', label: '800 - 999 Fr.' },
      { value: '1000 - 1199 Fr.', label: '1000 - 1199 Fr.' },
      { value: '1200 - 1399 Fr.', label: '1200 - 1399 Fr.' },
      { value: '1400 - 1599 Fr.', label: '1400 - 1599 Fr.' },
      { value: '1600 - 1799 Fr.', label: '1600 - 1799 Fr.' },
      { value: '1800 - 1999 Fr.', label: '1800 - 1999 Fr.' },
      { value: '2000 - 2399 Fr.', label: '2000 - 2399 Fr.' },
      { value: '2400 Fr. und +', label: '2400 Fr. und +' }
    ]
  },
  {
    id: 'rooms',
    question: 'Wie viele Zimmer brauchst du?',
    type: 'select',
    options: []
  },
  {
    id: 'area',
    question: 'Welche Wohnungsfläche suchst du ungefähr?',
    type: 'select',
    options: []
  },
  {
    id: 'year',
    question: 'Für welches Jahr möchtest du die Statistik sehen?',
    type: 'select',
    options: []
  },
  {
    id: 'priority',
    question: 'Was ist dir am wichtigsten?',
    type: 'radio',
    options: [
      { value: 'common', label: 'Viele verfügbare Wohnungen' },
      { value: 'cheap', label: 'Möglichst günstige Mietpreisklasse' },
      { value: 'large', label: 'Grössere Wohnungsfläche' }
    ]
  }
];

async function initQuiz() {
  showLoading();

  try {
    allApartments = await fetchApartments();
    hideLoading();

    if (!allApartments || allApartments.length === 0) {
      showError('Keine Daten verfügbar.');
      return;
    }

    populateDynamicOptions();
    setupEventListeners();
  } catch (error) {
    console.error('Quiz init error:', error);
    showError('Fehler beim Laden der Daten.');
  }
}

function showLoading() {
  document.getElementById('quiz-intro').innerHTML +=
    '<div class="mt-3"><div class="loading-spinner"></div> Daten werden geladen...</div>';
}

function hideLoading() {
  const loading = document.querySelector('.loading-spinner');
  if (loading && loading.parentElement) {
    loading.parentElement.remove();
  }
}

function showError(message) {
  document.getElementById('quiz-container').innerHTML =
    `<div class="alert alert-danger">${message}</div>`;
}

function populateDynamicOptions() {
  const cantons = [...new Set(allApartments.map(item => item.canton))].sort();
  const rooms = [...new Set(allApartments.map(item => item.rooms))].sort((a, b) =>
    a.localeCompare(b, 'de', { numeric: true })
  );
  const areas = [...new Set(allApartments.map(item => item.area_m2_range))];
  const years = [...new Set(allApartments.map(item => item.year))].sort();

  questions.find(q => q.id === 'canton').options = cantons.map(canton => ({
    value: canton,
    label: canton
  }));

  questions.find(q => q.id === 'rooms').options = rooms.map(room => ({
    value: room,
    label: room
  }));

  questions.find(q => q.id === 'area').options = areas.map(area => ({
    value: area,
    label: area
  }));

  questions.find(q => q.id === 'year').options = years.map(year => ({
    value: year,
    label: year
  }));
}

function setupEventListeners() {
  document.getElementById('start-quiz').addEventListener('click', startQuiz);
  document.getElementById('next-btn').addEventListener('click', nextQuestion);
  document.getElementById('prev-btn').addEventListener('click', prevQuestion);
  document.getElementById('restart-quiz').addEventListener('click', restartQuiz);
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
}

function startQuiz() {
  document.getElementById('quiz-intro').classList.add('d-none');
  document.getElementById('quiz-questions').classList.remove('d-none');
  document.getElementById('quiz-results').classList.add('d-none');

  currentQuestion = 0;
  answers = {};
  renderQuestion();
}

function renderQuestion() {
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  document.getElementById('progress-fill').style.width = `${progress}%`;

  let optionsHtml = '';

  if (question.type === 'select') {
    optionsHtml = `
      <select class="form-select" id="question-answer">
        <option value="">Bitte auswählen</option>
        ${question.options.map(option => `
          <option value="${option.value}">${option.label}</option>
        `).join('')}
      </select>
    `;
  } else if (question.type === 'radio') {
    optionsHtml = question.options.map(option => `
      <div class="form-check mb-2">
        <input class="form-check-input" type="radio" name="question-answer" id="${option.value}" value="${option.value}">
        <label class="form-check-label" for="${option.value}">${option.label}</label>
      </div>
    `).join('');
  }

  document.getElementById('question-container').innerHTML = `
    <h4>${question.question}</h4>
    <div class="mt-4">
      ${optionsHtml}
    </div>
  `;

  const prevAnswer = answers[question.id];
  if (prevAnswer) {
    if (question.type === 'select') {
      document.getElementById('question-answer').value = prevAnswer;
    } else {
      const input = document.querySelector(`input[value="${prevAnswer}"]`);
      if (input) input.checked = true;
    }
  }

  updateButtons();
}

function updateButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  prevBtn.disabled = currentQuestion === 0;
  nextBtn.textContent = currentQuestion === questions.length - 1 ? 'Ergebnisse anzeigen' : 'Weiter';
}

function nextQuestion() {
  const answer = getCurrentAnswer();

  if (!answer) {
    Utils.showToast('Bitte beantworte die Frage.', 'warning');
    return;
  }

  answers[questions[currentQuestion].id] = answer;

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    showResults();
  }
}

function prevQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
}

function getCurrentAnswer() {
  const question = questions[currentQuestion];

  if (question.type === 'select') {
    return document.getElementById('question-answer').value;
  }

  const checked = document.querySelector('input[name="question-answer"]:checked');
  return checked ? checked.value : null;
}

function showResults() {
  document.getElementById('quiz-questions').classList.add('d-none');
  document.getElementById('quiz-results').classList.remove('d-none');

  const results = getResultCount();

  renderResults(results);
}

function getRecommendations() {
  let filtered = allApartments;

  if (answers.canton) {
    filtered = filtered.filter(
      a => a[CONFIG.COLUMNS.canton] === answers.canton
    );
  }

  if (answers.rooms) {
    filtered = filtered.filter(
      a => a[CONFIG.COLUMNS.rooms] == answers.rooms
    );
  }

  if (answers.budget) {
    filtered = filtered.filter(
      a => parseInt(a[CONFIG.COLUMNS.price_range]) <= parseInt(answers.budget)
    );
  }

  if (answers.area) {
    filtered = filtered.filter(
      a => parseInt(a[CONFIG.COLUMNS.area_m2_range]) <= parseInt(answers.area)
    );
  }

  return filtered;
}

function comparePriceRanges(a, b) {
  return getPriceOrder(a) - getPriceOrder(b);
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

function compareAreaRanges(a, b) {
  return getAreaOrder(a) - getAreaOrder(b);
}

function getAreaOrder(areaRange) {
  const order = [
    'unter 30 m2',
    '30-39 m2',
    '40-49 m2',
    '50-59 m2',
    '60-69 m2',
    '70-79 m2',
    '80-89 m2',
    '90-99 m2',
    '100-119 m2',
    '120-139 m2',
    '140-159 m2',
    '160-179 m2',
    '180+ m2',
    'Angabe fehlt'
  ];

  const index = order.indexOf(areaRange);
  return index === -1 ? 999 : index;
}

function renderResults(results) {

  if (results.length === 0) {

    document.getElementById('recommendations').innerHTML = `
      <div class="card p-4 text-center">
        <h4 class="text-danger">Keine Wohnungen gefunden</h4>
        <p class="text-muted">
          Für diese Kombination gibt es laut Statistik keine Mietwohnungen.
        </p>

        <button class="btn btn-primary mt-3" onclick="restartQuiz()">
          Quiz erneut starten
        </button>
      </div>
    `;

    return;
  }

  const total = results.reduce((sum, r) => sum + (r.value || 0), 0);

  document.getElementById('recommendations').innerHTML = `
    <div class="card p-4 text-center mb-4">

      <h2 class="text-primary">${total.toLocaleString("de-CH")}</h2>

      <p class="mb-0">
        Mietwohnungen entsprechen deiner Auswahl
      </p>

    </div>

    <div class="small text-muted text-center">
      Ergebnisse basieren auf statistischen Kategorien.
    </div>
  `;
}

function restartQuiz() {
  document.getElementById('quiz-results').classList.add('d-none');
  document.getElementById('quiz-intro').classList.remove('d-none');
  answers = {};
  currentQuestion = 0;
}

function applyFilters() {
  const searchFilters = {
    canton: answers.canton || '',
    rooms: answers.rooms || '',
    price_range: answers.budget || '',
    area_m2_range: answers.area || '',
    year: answers.year || ''
  };

  sessionStorage.setItem('quizFilters', JSON.stringify(searchFilters));
  window.location.href = 'search.html?fromQuiz=true';
}

document.addEventListener('DOMContentLoaded', initQuiz);