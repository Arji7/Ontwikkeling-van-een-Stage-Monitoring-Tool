const token = localStorage.getItem('token');

if (!token) {
  window.location.href = '../../inloggen/inloggen.html';
}

fetch(window.API_BASE + '/stages/mijn', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(function(res) { return res.json(); })
.then(function(stages) {
  if (!stages || stages.length === 0) {
    window.location.href = '../empty-stage/empty-stage.html';
    return;
  }

  const stage = stages[0];

  // Velden invullen
  document.getElementById('bedrijfNaam').textContent  = stage.bedrijf_naam    || '—';
  document.getElementById('sector').textContent       = stage.sector          || '—';
  document.getElementById('mentor').textContent       = stage.contact_naam    || '—';
  document.getElementById('mentorEmail').textContent  = stage.contact_email   || '—';
  document.getElementById('startdatum').textContent   = formatDatum(stage.startdatum);
  document.getElementById('einddatum').textContent    = formatDatum(stage.einddatum);
  document.getElementById('ingediendOp').textContent  = formatDatum(stage.aangemaakt_op);
  document.getElementById('omschrijving').textContent = stage.omschrijving    || '—';

  // Status badge
  const badge = document.getElementById('statusBadge');
  badge.textContent  = statusLabel(stage.status);
  badge.className    = 'status-badge ' + (stage.status || '');

  // Status tekst in tabel
  document.getElementById('statusTekst').textContent = statusLabel(stage.status);

  // Feedback banner tonen bij aanpassingen_vereist
  if (stage.status === 'aanpassingen_vereist' && stage.laatste_opmerking) {
    document.getElementById('feedbackBanner').style.display = 'block';
    document.getElementById('feedbackTekst').textContent = '"' + stage.laatste_opmerking + '"';

    if (stage.beoordeeld_door) {
      document.getElementById('feedbackAuteur').textContent = ' · ' + stage.beoordeeld_door;
    }
    if (stage.beoordeeld_op || stage.bijgewerkt_op) {
      document.getElementById('feedbackDatum').textContent =
        ' · ' + formatDatum(stage.beoordeeld_op || stage.bijgewerkt_op);
    }

    // Knop "Voorstel aanpassen" tonen
    const btn = document.getElementById('aanpassenBtn');
    btn.href = '../stage-aanpassingen/stage-aanpassingen.html';
    btn.style.display = 'inline-flex';
  }
})
.catch(function(err) {
  console.error('Fout bij ophalen stage:', err);
});

function formatDatum(datumString) {
  if (!datumString) return '—';
  const d = new Date(datumString);
  const maanden = ['januari','februari','maart','april','mei','juni',
                   'juli','augustus','september','oktober','november','december'];
  return d.getDate() + ' ' + maanden[d.getMonth()] + ' ' + d.getFullYear();
}

function statusLabel(status) {
  const map = {
    'concept':               'Concept',
    'ingediend':             'Ingediend',
    'in_beoordeling':        'In beoordeling',
    'aanpassingen_vereist':  'Aanpassingen vereist',
    'goedgekeurd':           'Goedgekeurd',
    'afgekeurd':             'Afgekeurd',
    'wacht_op_overeenkomst': 'Wacht op overeenkomst',
    'actief':                'Stage loopt',
    'afgerond':              'Afgerond',
  };
  return map[status] || status || '—';
}
