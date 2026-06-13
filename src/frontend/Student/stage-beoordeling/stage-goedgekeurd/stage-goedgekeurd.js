const token = sessionStorage.getItem('token');

const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
const naam = currentUser.voornaam || currentUser.naam || currentUser.name || '';
if (naam) document.getElementById('studentNaam').textContent = naam;

fetch('http://localhost:3000/api/stages/mijn', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(function(res) { return res.json(); })
.then(function(stages) {
  if (!stages || stages.length === 0) return;
  const stage = stages[0];

  document.getElementById('bedrijfNaam').textContent   = stage.bedrijf_naam || '-';
  document.getElementById('tabelBedrijf').textContent  = stage.bedrijf_naam || '-';
  document.getElementById('goedgekeurdOp').textContent = formatDatum(stage.beoordeeld_op || stage.bijgewerkt_op);

  if (stage.beoordeeld_door) {
    document.getElementById('goedgekeurdDoor').textContent = stage.beoordeeld_door;
  }

  if (stage.feedback) {
    const wrap = document.getElementById('remarkWrap');
    document.getElementById('remarkTekst').textContent = '"' + stage.feedback + '"';
    wrap.style.display = 'block';
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
