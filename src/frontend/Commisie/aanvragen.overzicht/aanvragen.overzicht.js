// ========== VARIABELEN ==========
let allStudents = [];
let currentFilter = 'alle';

// ========== DOM ELEMENTEN ==========
const studentsContainer = document.getElementById('studentsContainer');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');

// ========== INITIALISATIE ==========
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
    setupEventListeners();
});

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Zoekfunctie
    searchInput.addEventListener('input', (e) => {
        filterAndDisplayStudents();
    });

    // Filter knoppen
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            filterAndDisplayStudents();
        });
    });

}

// ========== FETCH STAGES VAN DATABASE ==========
async function loadStudents() {
    showLoading(true);
    hideError();

    const token = sessionStorage.getItem('token');
    if (!token) {
        showError('Niet ingelogd. Log opnieuw in.');
        showLoading(false);
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/stages', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const stages = await response.json();

        // Backend velden omzetten naar wat de UI verwacht
        allStudents = stages.map(s => ({
            id:         s.id,
            naam:       (s.student_voornaam || '') + ' ' + (s.student_achternaam || ''),
            email:      s.student_email || '',
            bedrijf:    s.bedrijf_naam   || '-',
            startdatum: s.startdatum,
            einddatum:  s.einddatum,
            status:     s.status,
        }));

        console.log('Stages geladen:', allStudents);

        filterAndDisplayStudents();
        showLoading(false);

    } catch (error) {
        console.error('Error:', error);
        showError('Kon stages niet laden. Zorg dat je server draait op http://localhost:3000');
        showLoading(false);
    }
}

// ========== FILTER & DISPLAY ==========
function filterAndDisplayStudents() {
    const searchValue = searchInput.value.toLowerCase();

    let filtered = allStudents.filter(student => {
        // Statusfilter
        const statusMatch = currentFilter === 'alle' || student.status === currentFilter;

        // Zoekfilter
        const searchMatch = 
            student.naam.toLowerCase().includes(searchValue) ||
            student.email.toLowerCase().includes(searchValue) ||
            student.bedrijf.toLowerCase().includes(searchValue);

        return statusMatch && searchMatch;
    });

    displayStudents(filtered);
}

// ========== DISPLAY STUDENTS ==========
function displayStudents(students) {
    studentsContainer.innerHTML = '';

    if (students.length === 0) {
        studentsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--text-light); font-size: 1.1em;">
                    ❌ Geen studenten gevonden
                </p>
            </div>
        `;
        return;
    }

    students.forEach(student => {
        const card = createStudentCard(student);
        studentsContainer.appendChild(card);
    });
}

// ========== CREATE STUDENT CARD ==========
function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = `student-card status-${student.status}`;

    const statusText = getStatusText(student.status);
    const statusBadgeClass = student.status;

    card.innerHTML = `
        <div class="student-header">
            <div class="student-name">${student.naam}</div>
            <div class="student-email">${student.email}</div>
        </div>

        <div class="student-details">
            <div class="detail-row">
                <span class="detail-label">Bedrijf:</span>
                <span class="detail-value">${student.bedrijf}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Periode:</span>
                <span class="detail-value">${formatDate(student.startdatum)} tot ${formatDate(student.einddatum)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge ${statusBadgeClass}">${statusText}</span>
            </div>
        </div>

        <div class="student-actions">
            <button class="btn-view" onclick="viewStudent(${student.id})">
                Bekijken →
            </button>
        </div>
    `;

    return card;
}

// ========== VIEW STUDENT DETAIL ==========
function viewStudent(stageId) {
    window.location.href = '../stage-beoordeling/commissie.aanvraag-beoordeling.html?id=' + stageId;
}

// ========== HELPER FUNCTIONS ==========
function getStatusText(status) {
    const statusMap = {
        'ingediend':            'In afwachting',
        'goedgekeurd':          'Goedgekeurd',
        'afgekeurd':            'Afgewezen',
        'aanpassingen_vereist': 'Aanpassingen vereist'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('nl-NL', options);
}

function showLoading(show) {
    if (show) {
        loadingSpinner.style.display = 'flex';
        studentsContainer.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
        studentsContainer.style.display = 'grid';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}
