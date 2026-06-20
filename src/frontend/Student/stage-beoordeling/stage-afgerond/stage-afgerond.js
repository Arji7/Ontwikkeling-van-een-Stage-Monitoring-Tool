const token = sessionStorage.getItem('token');

const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
const naam = currentUser.voornaam || currentUser.naam || currentUser.name || '';
if (naam) document.getElementById('studentNaam').textContent = naam;

Promise.all([
  fetch(API_BASE + '/stages/mijn', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json()),
  fetch(API_BASE + '/evaluaties/student/mijn', { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.json())
])
.then(function(results) {
  const stages = results[0] || [];
  const evaluaties = results[1] || [];

  const stage = stages.find(function(s) { return s.status === 'afgerond'; });
  if (!stage) {
    window.location.href = '../../empty-stage/empty-stage.html';
    return;
  }

  const eindEval = evaluaties.find(function(e) {
    return e.stage_id === stage.id && e.type === 'eind';
  });

  document.getElementById('bedrijfNaam').textContent  = stage.bedrijf_naam || '—';
  document.getElementById('tabelBedrijf').textContent = stage.bedrijf_naam || '—';
  document.getElementById('tabelPeriode').textContent =
    formatDatum(stage.startdatum) + ' — ' + formatDatum(stage.einddatum);

  if (eindEval) {
    const cijfer = eindEval.officieel_eindcijfer;
    if (cijfer !== null && cijfer !== undefined) {
      document.getElementById('eindcijfer').textContent = Number(cijfer).toFixed(1);
    }
    document.getElementById('tabelAfgerondOp').textContent =
      formatDatum(eindEval.datum_bespreking || eindEval.aangemaakt_op);

    if (eindEval.globale_feedback) {
      document.getElementById('remarkTekst').textContent = '"' + eindEval.globale_feedback + '"';
      document.getElementById('remarkWrap').style.display = 'block';
    } else if (eindEval.algemene_appreciatie) {
      document.getElementById('remarkTekst').textContent = '"' + eindEval.algemene_appreciatie + '"';
      document.getElementById('remarkWrap').style.display = 'block';
    }
  }

  fetch(API_BASE + '/logboeken/stage/' + stage.id, {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(function(res) { return res.ok ? res.json() : []; })
  .then(function(logboeken) {
    const aantal = Array.isArray(logboeken) ? logboeken.length : 0;
    document.getElementById('tabelLogboeken').textContent = aantal + (aantal === 1 ? ' logboek' : ' logboeken');
  })
  .catch(function() {
    document.getElementById('tabelLogboeken').textContent = '—';
  });
})
.catch(function(err) {
  console.error('Kon afgeronde stage niet ophalen:', err);
});

function formatDatum(datumString) {
  if (!datumString) return '—';
  const d = new Date(datumString);
  const maanden = ['januari','februari','maart','april','mei','juni',
                   'juli','augustus','september','oktober','november','december'];
  return d.getDate() + ' ' + maanden[d.getMonth()] + ' ' + d.getFullYear();
}
