let allApartments = [];
let currentQuestion = 0;
let answers = {};

const questions = [
  {
    id: 'canton',
    question: 'Which canton would you like to live in?',
    type: 'select',
    options: []
  },
  {
    id: 'budget',
    question: 'Which rent price range fits your budget best?',
    type: 'select',
    options: [
      { value: 'unter 400 Fr.', label: 'Under 400 CHF' },
      { value: '400 - 599 Fr.', label: '400 - 599 CHF' },
      { value: '600 - 799 Fr.', label: '600 - 799 CHF' },
      { value: '800 - 999 Fr.', label: '800 - 999 CHF' },
      { value: '1000 - 1199 Fr.', label: '1000 - 1199 CHF' },
      { value: '1200 - 1399 Fr.', label: '1200 - 1399 CHF' },
      { value: '1400 - 1599 Fr.', label: '1400 - 1599 CHF' },
      { value: '1600 - 1799 Fr.', label: '1600 - 1799 CHF' },
      { value: '1800 - 1999 Fr.', label: '1800 - 1999 CHF' },
      { value: '2000 - 2399 Fr.', label: '2000 - 2399 CHF' },
      { value: '2400 Fr. und +', label: '2400 CHF and more' }
    ]
  },
  {
    id: 'rooms',
    question: 'How many rooms do you need?',
    type: 'select',
    options: []
  },
  {
    id: 'area',
    question: 'What apartment size are you looking for?',
    type: 'select',
    options: []
  },
  {
    id: 'year',
    question: 'Which year do you want to view statistics for?',
    type: 'select',
    options: []
  },
  {
    id: 'priority',
    question: 'What matters most to you?',
    type: 'radio',
    options: [
      { value: 'common', label: 'More available apartments' },
      { value: 'cheap', label: 'As affordable as possible' },
      { value: 'large', label: 'Larger living area' }
    ]
  }
];

async function initQuiz() {
  showLoading();

  try {
    allApartments = await fetchApartments();
    hideLoading();

    if (!allApartments || allApartments.length === 0) {
      showError('No data available.');
      return;
    }

    populateDynamicOptions();
    setupEventListeners();
  } catch (error) {
    console.error('Quiz init error:', error);
    hideLoading();
    showError('Error while loading apartment data.');
  }
}

function showLoading() {
  const intro = document.getElementById('quiz-intro');
  if (!intro || document.getElementById('quiz-loading')) return;

  const loadingHtml = `
    <div id="quiz-loading" class="mt-3 text-muted">
      <div class="loading-spinner me-2"></div>
      Loading apartment data...
    </div>
  `;

  intro.insertAdjacentHTML('beforeend', loadingHtml);
}

function hideLoading() {
  const loading = document.getElementById('quiz-loading');
  if (loading) loading.remove();
}

function showError(message) {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-danger">
      ${message}
    </div>
  `;
}

function populateDynamicOptions() {
  const cantonKey = CONFIG.COLUMNS.canton;
  const roomsKey = CONFIG.COLUMNS.rooms;
  const areaKey = CONFIG.COLUMNS.area_m2_range;
  const yearKey = CONFIG.COLUMNS.year;

  const cantons = [...new Set(allApartments.map(item => item[cantonKey]))]
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), 'en'));

  const rooms = [...new Set(allApartments.map(item => item[roomsKey]))]
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }));

  const areas = [...new Set(allApartments.map(item => item[areaKey]))]
    .filter(Boolean)
    .sort(compareAreaRanges);

  const years = [...new Set(allApartments.map(item => item[yearKey]))]
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b));

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
    value: String(year),
    label: String(year)
  }));
}

function setupEventListeners() {
  document.getElementById('start-quiz')?.addEventListener('click', startQuiz);
  document.getElementById('next-btn')?.addEventListener('click', nextQuestion);
  document.getElementById('prev-btn')?.addEventListener('click', prevQuestion);
  document.getElementById('restart-quiz')?.addEventListener('click', restartQuiz);
  document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
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

  const stepCurrent = document.getElementById('step-current');
  const stepTotal = document.getElementById('step-total');

  if (stepCurrent) stepCurrent.textContent = currentQuestion + 1;
  if (stepTotal) stepTotal.textContent = questions.length;

  let optionsHtml = '';

  if (question.type === 'select') {
    optionsHtml = `
      <select class="form-select" id="question-answer">
        <option value="">Please select</option>
        ${question.options.map(option => `
          <option value="${escapeHtml(String(option.value))}">
            ${escapeHtml(String(option.label))}
          </option>
        `).join('')}
      </select>
    `;
  } else if (question.type === 'radio') {
    optionsHtml = question.options.map((option, index) => {
      const safeId = `option-${currentQuestion}-${index}`;
      return `
        <div class="form-check mb-3">
          <input
            class="form-check-input"
            type="radio"
            name="question-answer"
            id="${safeId}"
            value="${escapeHtml(String(option.value))}"
          >
          <label class="form-check-label" for="${safeId}">
            ${escapeHtml(String(option.label))}
          </label>
        </div>
      `;
    }).join('');
  }

  document.getElementById('question-container').innerHTML = `
    <div class="question-card">
      <div class="question-number">Question ${currentQuestion + 1}</div>
      <h3 class="question-title">${escapeHtml(question.question)}</h3>
      <div class="question-options mt-4">
        ${optionsHtml}
      </div>
    </div>
  `;

  const previousAnswer = answers[question.id];
  if (previousAnswer) {
    if (question.type === 'select') {
      const select = document.getElementById('question-answer');
      if (select) select.value = previousAnswer;
    } else {
      const input = document.querySelector(`input[name="question-answer"][value="${cssEscape(previousAnswer)}"]`);
      if (input) input.checked = true;
    }
  }

  updateButtons();
}

function updateButtons() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (prevBtn) {
    prevBtn.disabled = currentQuestion === 0;
  }

  if (nextBtn) {
    nextBtn.textContent =
      currentQuestion === questions.length - 1 ? 'Show results' : 'Next';
  }
}

function nextQuestion() {
  const answer = getCurrentAnswer();

  if (!answer) {
    if (window.Utils && typeof Utils.showToast === 'function') {
      Utils.showToast('Please answer the question.', 'warning');
    } else {
      alert('Please answer the question.');
    }
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
  const currentAnswer = getCurrentAnswer();
  if (currentAnswer) {
    answers[questions[currentQuestion].id] = currentAnswer;
  }

  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
}

function getCurrentAnswer() {
  const question = questions[currentQuestion];

  if (question.type === 'select') {
    const select = document.getElementById('question-answer');
    return select ? select.value : '';
  }

  const checked = document.querySelector('input[name="question-answer"]:checked');
  return checked ? checked.value : '';
}

function showResults() {
  document.getElementById('quiz-questions').classList.add('d-none');
  document.getElementById('quiz-results').classList.remove('d-none');

  const results = getRecommendations();
  renderResults(results);
}

function getRecommendations() {
  const cantonKey = CONFIG.COLUMNS.canton;
  const roomsKey = CONFIG.COLUMNS.rooms;
  const priceKey = CONFIG.COLUMNS.price_range;
  const areaKey = CONFIG.COLUMNS.area_m2_range;
  const yearKey = CONFIG.COLUMNS.year;
  const valueKey = CONFIG.COLUMNS.value;

  let filtered = allApartments.filter(item => (Number(item[valueKey]) || 0) > 0);

  if (answers.canton) {
    filtered = filtered.filter(item => item[cantonKey] === answers.canton);
  }

  if (answers.rooms) {
    filtered = filtered.filter(item => String(item[roomsKey]) === String(answers.rooms));
  }

  if (answers.budget) {
    filtered = filtered.filter(item => item[priceKey] === answers.budget);
  }

  if (answers.area) {
    filtered = filtered.filter(item => item[areaKey] === answers.area);
  }

  if (answers.year) {
    filtered = filtered.filter(item => String(item[yearKey]) === String(answers.year));
  }

  if (answers.priority === 'cheap') {
    filtered.sort((a, b) => comparePriceRanges(a[priceKey], b[priceKey]));
  } else if (answers.priority === 'large') {
    filtered.sort((a, b) => compareAreaRanges(b[areaKey], a[areaKey]));
  } else {
    filtered.sort((a, b) => (Number(b[valueKey]) || 0) - (Number(a[valueKey]) || 0));
  }

  return filtered;
}

function comparePriceRanges(a, b) {
  return getPriceOrder(a) - getPriceOrder(b);
}

function getPriceOrder(priceRange) {
  const order = [
    'under 400 Fr.',
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
    'No occupied rental apartment',
    'No data'
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
  const recommendationsEl = document.getElementById('recommendations');
  const cantonKey = CONFIG.COLUMNS.canton;
  const roomsKey = CONFIG.COLUMNS.rooms;
  const priceKey = CONFIG.COLUMNS.price_range;
  const areaKey = CONFIG.COLUMNS.area_m2_range;
  const yearKey = CONFIG.COLUMNS.year;
  const valueKey = CONFIG.COLUMNS.value;

  if (!results.length) {
    recommendationsEl.innerHTML = `
      <div class="result-card empty-result">
        <div class="result-icon">😕</div>
        <h4>No apartments found</h4>
        <p class="text-muted mb-0">
          There are no matching statistical apartment entries for this combination.
        </p>
        <button class="btn btn-primary mt-3" onclick="restartQuiz()">
          Restart quiz
        </button>
      </div>
    `;
    return;
  }

  const total = results.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0);
  const topResults = results.slice(0, Math.min(results.length, 6));

  recommendationsEl.innerHTML = `
    <div class="result-summary-card">
      <div class="summary-badge">Your result</div>
      <h2>${total.toLocaleString('en-CH')}</h2>
      <p><p>Total apartments in matching categories</p></p>
    </div>

    <div class="recommendation-grid">
      ${topResults.map(item => `
        <div class="recommendation-card">
          <div class="recommendation-top">
            <div>
              <div class="recommendation-canton">${escapeHtml(String(item[cantonKey] ?? ''))}</div>
              <div class="recommendation-year">${escapeHtml(String(item[yearKey] ?? ''))}</div>
            </div>
            <div class="recommendation-value">
              ${(Number(item[valueKey]) || 0).toLocaleString('en-CH')}
            </div>
          </div>

          <div class="recommendation-details">
            <div><strong>Rooms:</strong> ${escapeHtml(String(item[roomsKey] ?? ''))}</div>
            <div><strong>Rent range:</strong> ${escapeHtml(String(item[priceKey] ?? ''))}</div>
            <div><strong>Area:</strong> ${escapeHtml(String(item[areaKey] ?? ''))}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="quiz-footnote">
      Results are based on statistical categories, not individual listings.
    </div>
  `;
}

function restartQuiz() {
  document.getElementById('quiz-results').classList.add('d-none');
  document.getElementById('quiz-questions').classList.add('d-none');
  document.getElementById('quiz-intro').classList.remove('d-none');

  answers = {};
  currentQuestion = 0;

  const progressFill = document.getElementById('progress-fill');
  if (progressFill) progressFill.style.width = '0%';
}

function applyFilters() {
  const searchFilters = {
    canton: answers.canton || '',
    rooms: answers.rooms || '',
    price_range: answers.budget || '',
    area_m2_range: answers.area || '',
    year: answers.year || ''
  };

  localStorage.setItem('quizFilters', JSON.stringify(searchFilters));
  window.location.href = 'search.html?fromQuiz=true';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === 'function') {
    return window.CSS.escape(value);
  }

  return String(value).replace(/["\\]/g, '\\$&');
}

document.addEventListener('DOMContentLoaded', initQuiz);