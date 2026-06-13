// Laatste ingediende stage van de student ophalen en tonen
const token = sessionStorage.getItem('token');

fetch('http://localhost:3000/api/stages/mijn', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(function(res) { return res.json(); })
.then(function(stages) {
  if (!stages || stages.length === 0) return;

  // Eerste stage = meest recente (route sorteert al op aangemaakt_op DESC)
  const stage = stages[0];

  document.getElementById('bedrijfNaam').textContent     = stage.bedrijf_naam || '-';
  document.getElementById('bedrijfNaamTekst').textContent = stage.bedrijf_naam || '-';
  document.getElementById('ingediendOp').textContent     = formatDatum(stage.aangemaakt_op);
  document.getElementById('periode').textContent         = formatPeriode(stage.startdatum, stage.einddatum);
})
.catch(function(err) {
  console.error('Kon stage niet ophalen:', err);
});

function formatDatum(datumString) {
  if (!datumString) return '-';
  const d = new Date(datumString);
  const maanden = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                   'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  return d.getDate() + ' ' + maanden[d.getMonth()] + ' ' + d.getFullYear();
}

function formatPeriode(start, eind) {
  if (!start || !eind) return '-';
  const s = new Date(start);
  const e = new Date(eind);
  const pad = function(n) { return n < 10 ? '0' + n : n; };
  return pad(s.getDate()) + '/' + pad(s.getMonth() + 1) + ' — ' +
         pad(e.getDate()) + '/' + pad(e.getMonth() + 1) + '/' + e.getFullYear();
}
