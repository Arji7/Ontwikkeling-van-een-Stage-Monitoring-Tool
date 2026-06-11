const token = localStorage.getItem('token');

// Studentnaam uit localStorage
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
const naam = currentUser.voornaam || currentUser.naam || currentUser.name || '';
if (naam) document.getElementById('studentNaam').textContent = naam;

fetch('http://localhost:3000/api/stages/mijn', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(function(res) { return res.json(); })
.then(function(stages) {
  if (!stages || stages.length === 0) return;
  const stage = stages[0];

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
