let allStages = [];

const grid        = document.getElementById('stagesGrid');
const spinner     = document.getElementById('loadingSpinner');
const errorMsg    = document.getElementById('errorMessage');
const searchInput = document.getElementById('searchInput');
const statTotaal  = document.getElementById('statTotaal');

document.addEventListener('DOMContentLoaded', () => {
    loadStages();
    searchInput.addEventListener('input', renderFiltered);
});

async function loadStages() {
    const token = sessionStorage.getItem('token');
    if (!token) {
        showError('Niet ingelogd. Log opnieuw in.');
        spinner.style.display = 'none';
        return;
    }

    try {
        const res = await fetch(API_BASE + '/stages', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const stages = await res.json();
        allStages = stages
            .filter(s => s.status === 'actief')
            .map(s => ({
                id:       s.id,
                naam:     (s.student_voornaam || '') + ' ' + (s.student_achternaam || ''),
                email:    s.student_email || '',
                bedrijf:  s.bedrijf_naam || '-',
                mentor:   s.mentor_naam || '-',
                docent:   s.docent_voornaam ? (s.docent_voornaam + ' ' + s.docent_achternaam) : '-',
                start:    s.startdatum,
                eind:     s.einddatum,
            }));

        statTotaal.textContent = allStages.length;
        spinner.style.display = 'none';
        grid.style.display = 'grid';
        renderFiltered();
    } catch (err) {
        console.error(err);
        showError('Kon stages niet laden. Zorg dat de server draait.');
        spinner.style.display = 'none';
    }
}

function renderFiltered() {
    const q = searchInput.value.toLowerCase();
    const filtered = allStages.filter(s =>
        s.naam.toLowerCase().includes(q) ||
        s.bedrijf.toLowerCase().includes(q) ||
        s.mentor.toLowerCase().includes(q)
    );
    renderGrid(filtered);
}

function renderGrid(stages) {
    if (stages.length === 0) {
        grid.innerHTML = `<p class="empty-msg">Geen lopende stages gevonden.</p>`;
        return;
    }
    grid.innerHTML = stages.map(s => `
        <div class="stage-card">
            <div class="card-top">
                <div class="avatar">${initialen(s.naam)}</div>
                <div>
                    <div class="card-naam">${s.naam}</div>
                    <div class="card-email">${s.email}</div>
                </div>
                <span class="badge badge-active">Actief</span>
            </div>
            <div class="card-rows">
                <div class="card-row"><span class="lbl">Bedrijf</span><span>${s.bedrijf}</span></div>
                <div class="card-row"><span class="lbl">Mentor</span><span>${s.mentor}</span></div>
                <div class="card-row"><span class="lbl">Docent</span><span>${s.docent}</span></div>
                <div class="card-row"><span class="lbl">Periode</span><span>${fmtDate(s.start)} → ${fmtDate(s.eind)}</span></div>
            </div>
        </div>
    `).join('');
}

function initialen(naam) {
    if (!naam || !naam.trim()) return '??';
    return naam.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('show');
}
