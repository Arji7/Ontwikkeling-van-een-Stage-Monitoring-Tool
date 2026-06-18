(function () {
  var token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '../../inloggen/inloggen.html'; return; }

  var alleStages = [];

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function fmtDatum(d) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('nl-BE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function badge(status) {
    if (status === 'actief') return '<span class="badge badge-actief">Actief</span>';
    if (status === 'afgerond') return '<span class="badge badge-afgerond">Afgerond</span>';
    if (status === 'goedgekeurd') return '<span class="badge badge-goedgekeurd">Goedgekeurd</span>';
    return '<span class="badge">' + esc(status) + '</span>';
  }

  function render() {
    var zoek = (document.getElementById('searchInput').value || '').toLowerCase();

    var gefilterd = alleStages.filter(function (s) {
      if (s.status !== 'actief') return false;
      var naam = ((s.student_voornaam || '') + ' ' + (s.student_achternaam || '')).toLowerCase();
      var bedrijf = (s.bedrijf_naam || '').toLowerCase();
      var matchZ = !zoek || naam.includes(zoek) || bedrijf.includes(zoek);
      return matchZ;
    });

    var actief = alleStages.filter(function (s) { return s.status === 'actief'; }).length;
    var cntAlle = document.getElementById('cnt-alle');
    var cntActief = document.getElementById('cnt-actief');
    var cntAfgerond = document.getElementById('cnt-afgerond');
    if (cntAlle) cntAlle.textContent = '(' + actief + ')';
    if (cntActief) cntActief.textContent = '(' + actief + ')';
    if (cntAfgerond) cntAfgerond.textContent = '(0)';

    if (gefilterd.length === 0) {
      document.getElementById('tableContainer').innerHTML =
        '<div class="empty-state"><div class="empty-icon">📋</div>' +
        '<div class="empty-title">Geen lopende stages gevonden</div>' +
        '<div class="empty-text">Er zijn momenteel geen stages die overeenkomen met je filter.</div></div>';
      return;
    }

    var html = '<table class="data-table"><thead><tr>' +
      '<th>Student</th><th>Bedrijf</th><th>Docent</th><th>Stageperiode</th><th>Status</th><th>Laatst bijgewerkt</th>' +
      '</tr></thead><tbody>';

    gefilterd.forEach(function (s) {
      var naam = esc((s.student_voornaam || '') + ' ' + (s.student_achternaam || ''));
      var docent = s.docent_voornaam ? esc(s.docent_voornaam + ' ' + s.docent_achternaam) : '--';
      var periode = fmtDatum(s.startdatum) + ' – ' + fmtDatum(s.einddatum);
      var updated = fmtDatum(s.aangemaakt_op);

      html +=
        '<tr>' +
          '<td><span class="student-naam">' + naam + '</span></td>' +
          '<td>' + esc(s.bedrijf_naam || '--') + '</td>' +
          '<td>' + docent + '</td>' +
          '<td>' + periode + '</td>' +
          '<td>' + badge(s.status) + '</td>' +
          '<td>' + updated + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('tableContainer').innerHTML = html;
  }

  async function laad() {
    try {
      var res = await fetch(API_BASE + '/stages', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      alleStages = res.ok ? await res.json() : [];
      if (!Array.isArray(alleStages)) alleStages = [];
    } catch (e) {
      alleStages = [];
    }
    render();
  }

  document.getElementById('searchInput').addEventListener('input', render);

  laad();
})();
