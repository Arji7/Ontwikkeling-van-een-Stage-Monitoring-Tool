const token = sessionStorage.getItem('token');

// Studentnaam uit localStorage
const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
const naam = currentUser.voornaam || currentUser.naam || currentUser.name || '';
if (naam) document.getElementById('studentNaam').textContent = naam;

fetch(API_BASE + '/stages/mijn', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(function(res) { return res.json(); })
.then(function(stages) {
  const stage = (stages || []).find(function(s) { return s.status === 'afgekeurd'; });
  if (!stage) {
    window.location.href = '../../empty-stage/empty-stage.html';
    return;
  }

  localStorage.setItem("afgekeurd_gezien_" + stage.id, "1");

  document.getElementById('bedrijfNaam').textContent  = stage.bedrijf_naam || '-';
  document.getElementById('tabelBedrijf').textContent = stage.bedrijf_naam || '-';
  document.getElementById('ingediendOp').textContent  = formatDatum(stage.aangemaakt_op);
  document.getElementById('afgekeurdOp').textContent  = formatDatum(stage.beoordeeld_op || stage.bijgewerkt_op);

  if (stage.feedback) {
    document.getElementById('feedbackTekst').textContent = '"' + stage.feedback + '"';
  }
  if (stage.beoordeeld_door) {
    document.getElementById('feedbackAuteur').textContent = '· ' + stage.beoordeeld_door;
  }
  if (stage.beoordeeld_op || stage.bijgewerkt_op) {
    document.getElementById('feedbackDatum').textContent = '· ' + formatDatum(stage.beoordeeld_op || stage.bijgewerkt_op);
  }
})
.catch(function(err) { console.error('Kon stage niet ophalen:', err); });

function formatDatum(datumString) {
  if (!datumString) return '-';
  const d = new Date(datumString);
  const maanden = ['januari','februari','maart','april','mei','juni',
                   'juli','augustus','september','oktober','november','december'];
  return d.getDate() + ' ' + maanden[d.getMonth()] + ' ' + d.getFullYear();
}
