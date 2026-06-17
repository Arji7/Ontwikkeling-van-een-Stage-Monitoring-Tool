let allStages = [];

const stagesContainer = document.getElementById('stagesContainer');
const loadingSpinner  = document.getElementById('loadingSpinner');
const errorMessage    = document.getElementById('errorMessage');
const searchInput     = document.getElementById('searchInput');
const statsRow        = document.getElementById('statsRow');

document.addEventListener('DOMContentLoaded', () => {
  laadStages();
  searchInput.addEventListener('input', filterEnToon);
});

async function laadStages() {
  toonLoading(true);

  const token = sessionStorage.getItem('token');
  if (!token) {
    toonFout('Niet ingelogd. Log opnieuw in.');
    toonLoading(false);
    return;
  }

  try {
    const res = await fetch(API_BASE + '/stages', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) throw new Error(res.status);

    const stages = await res.json();

    allStages = stages
      .filter(s => s.status === 'actief')
      .map(s => ({
        id:        s.id,
        student:   ((s.student_voornaam || '') + ' ' + (s.student_achternaam || '')).trim(),
        email:     s.student_email || '',
        bedrijf:   s.bedrijf_naam  || '—',
        docent:    (s.docent_voornaam || s.docent_achternaam)
                     ? ((s.docent_voornaam || '') + ' ' + (s.docent_achternaam || '')).trim()
                     : 'Nog niet toegekend',
        startdatum: s.startdatum,
        einddatum:  s.einddatum,
        totaalWeken: s.totaal_weken || 14,
      }));

    toonStats();
    filterEnToon();
    toonLoading(false);
  } catch (err) {
    console.error(err);
    toonFout('Kon stages niet laden. Staat de backend aan?');
    toonLoading(false);
  }
}

function toonStats() {
  const totaal = allStages.length;
  statsRow.innerHTML = `
    <div class="stat-chip">
      <span class="stat-num">${totaal}</span>
      <span class="stat-label">actieve stage${totaal !== 1 ? 's' : ''}</span>
    </div>
  `;
}

function filterEnToon() {
  const q = searchInput.value.toLowerCase();
  const gefilterd = allStages.filter(s =>
    s.student.toLowerCase().includes(q) ||
    s.bedrijf.toLowerCase().includes(q) ||
    s.docent.toLowerCase().includes(q)
  );
  toonStages(gefilterd);
}

function toonStages(stages) {
  stagesContainer.innerHTML = '';

  if (stages.length === 0) {
    stagesContainer.innerHTML = `
      <div class="leeg">
        <p>Geen lopende stages gevonden.</p>
      </div>`;
    return;
  }

  stages.forEach(s => stagesContainer.appendChild(maakKaart(s)));
}

function maakKaart(s) {
  const voortgang = berekenVoortgang(s.startdatum, s.einddatum, s.totaalWeken);

  const card = document.createElement('div');
  card.className = 'stage-card';
  card.innerHTML = `
    <div class="card-top">
      <div class="student-avatar">${initialen(s.student)}</div>
      <div class="card-info">
        <div class="student-name">${s.student}</div>
        <div class="student-email">${s.email}</div>
      </div>
    </div>

    <div class="card-details">
      <div class="detail-row">
        <span class="detail-label">Bedrijf</span>
        <span class="detail-value">${s.bedrijf}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Docent</span>
        <span class="detail-value">${s.docent}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Periode</span>
        <span class="detail-value">${formatDate(s.startdatum)} → ${formatDate(s.einddatum)}</span>
      </div>
    </div>

    <div class="voortgang-wrap">
      <div class="voortgang-label">
        <span>Voortgang</span>
        <span>Week ${voortgang.huidig} / ${voortgang.totaal}</span>
      </div>
      <div class="voortgang-balk">
        <div class="voortgang-fill" style="width: ${voortgang.procent}%"></div>
      </div>
    </div>

    <button class="btn-view" onclick="bekijk(${s.id})">Bekijk stage →</button>
  `;
  return card;
}

function bekijk(stageId) {
  window.location.href = '../stage-beoordeling/commissie.aanvraag-beoordeling.html?id=' + stageId;
}

function berekenVoortgang(start, eind, totaalWeken) {
  if (!start) return { huidig: 0, totaal: totaalWeken, procent: 0 };
  const nu       = new Date();
  const startD   = new Date(start);
  const msPerWeek = 1000 * 60 * 60 * 24 * 7;
  const huidig   = Math.max(0, Math.min(totaalWeken, Math.floor((nu - startD) / msPerWeek) + 1));
  const procent  = Math.round((huidig / totaalWeken) * 100);
  return { huidig, totaal: totaalWeken, procent };
}

function initialen(naam) {
  if (!naam) return '??';
  return naam.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toonLoading(show) {
  loadingSpinner.style.display  = show ? 'flex' : 'none';
  stagesContainer.style.display = show ? 'none' : 'grid';
}

function toonFout(msg) {
  errorMessage.textContent = msg;
  errorMessage.classList.add('show');
}
