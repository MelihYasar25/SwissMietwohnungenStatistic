// Quiz functionality
let allApartments = [];
let currentQuestion = 0;
let answers = {};

const questions = [
  {
    id: 'canton',
    question: 'In welchem Kanton möchtest du wohnen?',
    type: 'select',
    options: [] // Will be populated from data
  },
  {
    id: 'location_type',
    question: 'Bevorzugst du Stadt oder Land?',
    type: 'radio',
    options: [
      { value: 'stadt', label: 'Stadt' },
      { value: 'land', label: 'Land' },
      { value: 'egal', label: 'Egal' }
    ]
  },
  {
    id: 'budget',
    question: 'Was ist dein monatliches Budget?',
    type: 'select',
    options: [
      { value: '800', label: 'Bis 800 CHF' },
      { value: '1200', label: 'Bis 1200 CHF' },
      { value: '1600', label: 'Bis 1600 CHF' },
      { value: '2000', label: 'Bis 2000 CHF' },
      { value: '2500', label: 'Über 2000 CHF' }
    ]
  },
  {
    id: 'rooms',
    question: 'Wie viele Zimmer brauchst du?',
    type: 'select',
    options: [
      { value: '1', label: '1 Zimmer' },
      { value: '2', label: '2 Zimmer' },
      { value: '3', label: '3 Zimmer' },
      { value: '4', label: '4 Zimmer' },
      { value: '5', label: '5+ Zimmer' }
    ]
  },
  {
    id: 'area',
    question: 'Wie groß soll die Wohnung sein?',
    type: 'select',
    options: [
      { value: '30', label: 'Bis 30 m²' },
      { value: '50', label: 'Bis 50 m²' },
      { value: '70', label: 'Bis 70 m²' },
      { value: '100', label: 'Bis 100 m²' },
      { value: '150', label: 'Über 100 m²' }
    ]
  },
  {
    id: 'balcony',
    question: 'Möchtest du einen Balkon?',
    type: 'radio',
    options: [
      { value: 'true', label: 'Ja' },
      { value: 'false', label: 'Nein' },
      { value: 'egal', label: 'Egal' }
    ]
  },
  {
    id: 'pets',
    question: 'Brauchst du Haustiere erlaubt?',
    type: 'radio',
    options: [
      { value: 'true', label: 'Ja' },
      { value: 'false', label: 'Nein' },
      { value: 'egal', label: 'Egal' }
    ]
  },
  {
    id: 'transport',
    question: 'Ist Nähe zu öffentlichen Verkehrsmitteln wichtig?',
    type: 'radio',
    options: [
      { value: 'true', label: 'Ja' },
      { value: 'false', label: 'Nein' },
      { value: 'egal', label: 'Egal' }
    ]
  },
  {
    id: 'furnished',
    question: 'Möchtest du möbliert oder unmöbliert?',
    type: 'radio',
    options: [
      { value: 'true', label: 'Möbliert' },
      { value: 'false', label: 'Unmöbliert' },
      { value: 'egal', label: 'Egal' }
    ]
  },
  {
    id: 'priority',
    question: 'Was ist dir am wichtigsten?',
    type: 'radio',
    options: [
      { value: 'price', label: 'Günstiger Preis' },
      { value: 'area', label: 'Große Fläche' },
      { value: 'location', label: 'Gute Lage' },
      { value: 'modern', label: 'Moderne Ausstattung' },
      { value: 'family', label: 'Familienfreundlich' }
    ]
  }
];

async function initQuiz() {
  showLoading();
  allApartments = await fetchApartments();
  hideLoading();
  if (allApartments.length === 0) {
    showError('Keine Daten verfügbar.');
    return;
  }
  populateCantonOptions();
  setupEventListeners();
}

function showLoading() {
  document.getElementById('quiz-intro').innerHTML += '<div class="mt-3"><div class="loading-spinner"></div> Lade Daten...</div>';
}

function hideLoading() {
  const loading = document.querySelector('.loading-spinner');
  if (loading) loading.parentElement.remove();
}

function showError(message) {
  document.getElementById('quiz-container').innerHTML = `<div class="alert alert-danger">${message}</div>`;
}

function populateCantonOptions() {
  const cantons = Utils.getUniqueValues(allApartments, CONFIG.COLUMNS.canton);
  questions[0].options = cantons.map(canton => ({ value: canton, label: canton }));
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
    optionsHtml = `<select class="form-select" id="question-answer">
      <option value="">Bitte wählen</option>
      ${question.options.map(option => `<option value="${option.value}">${option.label}</option>`).join('')}
    </select>`;
  } else if (question.type === 'radio') {
    optionsHtml = question.options.map(option => `
      <div class="form-check">
        <input class="form-check-input" type="radio" name="question-answer" id="${option.value}" value="${option.value}">
        <label class="form-check-label" for="${option.value}">${option.label}</label>
      </div>
    `).join('');
  }

  const html = `
    <h4>${question.question}</h4>
    <div class="mt-4">
      ${optionsHtml}
    </div>
  `;

  document.getElementById('question-container').innerHTML = html;

  // Set previous answer if exists
  const prevAnswer = answers[question.id];
  if (prevAnswer) {
    if (question.type === 'select') {
      document.getElementById('question-answer').value = prevAnswer;
    } else {
      document.querySelector(`input[value="${prevAnswer}"]`).checked = true;
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
  } else {
    const checked = document.querySelector('input[name="question-answer"]:checked');
    return checked ? checked.value : null;
  }
}

function showResults() {
  document.getElementById('quiz-questions').classList.add('d-none');
  document.getElementById('quiz-results').classList.remove('d-none');

  const recommendations = getRecommendations();
  renderRecommendations(recommendations);
}

function getRecommendations() {
  let filtered = allApartments;

  // Apply filters based on answers
  if (answers.canton) {
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.canton] === answers.canton);
  }

  if (answers.budget) {
    const maxBudget = parseInt(answers.budget);
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.price] <= maxBudget);
  }

  if (answers.rooms) {
    const rooms = answers.rooms === '5' ? 5 : parseInt(answers.rooms);
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.rooms] >= rooms);
  }

  if (answers.area) {
    const minArea = parseInt(answers.area);
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.area_sqm] >= minArea);
  }

  if (answers.balcony !== 'egal') {
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.balcony] === (answers.balcony === 'true'));
  }

  if (answers.pets !== 'egal') {
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.pets_allowed] === (answers.pets === 'true'));
  }

  if (answers.transport !== 'egal') {
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.public_transport_nearby] === (answers.transport === 'true'));
  }

  if (answers.furnished !== 'egal') {
    filtered = filtered.filter(apt => apt[CONFIG.COLUMNS.furnished] === (answers.furnished === 'true'));
  }

  // Sort by priority
  if (answers.priority) {
    switch (answers.priority) {
      case 'price':
        filtered.sort((a, b) => a[CONFIG.COLUMNS.price] - b[CONFIG.COLUMNS.price]);
        break;
      case 'area':
        filtered.sort((a, b) => b[CONFIG.COLUMNS.area_sqm] - a[CONFIG.COLUMNS.area_sqm]);
        break;
      // Other priorities can be added
    }
  }

  return filtered.slice(0, 5); // Top 5 recommendations
}

function renderRecommendations(recommendations) {
  if (recommendations.length === 0) {
    document.getElementById('recommendations').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-search"></i>
        <h4>Keine passenden Wohnungen gefunden</h4>
        <p>Versuche das Quiz mit anderen Antworten zu wiederholen.</p>
      </div>
    `;
    return;
  }

  const html = recommendations.map(apt => `
    <div class="card apartment-card mb-3">
      <div class="row g-0">
        <div class="col-md-4">
          <img src="${apt[CONFIG.COLUMNS.image_url] || 'https://via.placeholder.com/200x150?text=Kein+Bild'}" class="img-fluid rounded-start" alt="Wohnung">
        </div>
        <div class="col-md-8">
          <div class="card-body">
            <h5 class="card-title">${apt[CONFIG.COLUMNS.title] || 'Unbenannte Wohnung'}</h5>
            <p class="card-text">${Utils.formatCHF(apt[CONFIG.COLUMNS.price])} | ${apt[CONFIG.COLUMNS.area_sqm]} m² | ${apt[CONFIG.COLUMNS.rooms]} Zimmer</p>
            <p class="card-text small text-muted">${apt[CONFIG.COLUMNS.city]}, ${apt[CONFIG.COLUMNS.canton]}</p>
            <a href="search.html?id=${apt[CONFIG.COLUMNS.id]}" class="btn btn-primary btn-sm">Details ansehen</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  document.getElementById('recommendations').innerHTML = html;
}

function restartQuiz() {
  document.getElementById('quiz-results').classList.add('d-none');
  document.getElementById('quiz-intro').classList.remove('d-none');
}

function applyFilters() {
  // Store answers in sessionStorage to apply as filters on search page
  sessionStorage.setItem('quizFilters', JSON.stringify(answers));
  window.location.href = 'search.html?fromQuiz=true';
}

// Initialize
document.addEventListener('DOMContentLoaded', initQuiz);