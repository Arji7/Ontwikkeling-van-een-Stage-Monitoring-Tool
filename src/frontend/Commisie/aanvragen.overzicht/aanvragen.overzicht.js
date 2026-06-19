(function () {
  var token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '../../inloggen/inloggen.html'; return; }

  var alleStages = [];
  var huidigFilter = 'alle';

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function fmtDatum(d) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('nl-BE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function badge(status, commissieGetekend) {
    if (status === 'ingediend')            return '<span class="badge badge-ingediend">In afwachting</span>';
    if (status === 'goedgekeurd') {
      var extra = !commissieGetekend
        ? ' <span class="badge badge-tekenen" title="Commissie moet nog ondertekenen">Te tekenen</span>'
        : '';
      return '<span class="badge badge-goedgekeurd">Goedgekeurd</span>' + extra;
    }
    if (status === 'afgekeurd')            return '<span class="badge badge-afgekeurd">Afgewezen</span>';
    if (status === 'aanpassingen_vereist') return '<span class="badge badge-aanpassingen">Aanpassingen vereist</span>';
    return '<span class="badge">' + esc(status) + '</span>';
  }

  function render() {
    var zoek = (document.getElementById('searchInput').value || '').toLowerCase();

    var relevant = alleStages.filter(function (s) {
      return ['ingediend', 'goedgekeurd', 'wacht_op_overeenkomst', 'aanpassingen_vereist'].includes(s.status);
    });

    var gefilterd = relevant.filter(function (s) {
      var naam = ((s.student_voornaam || '') + ' ' + (s.student_achternaam || '')).toLowerCase();
      var bedrijf = (s.bedrijf_naam || '').toLowerCase();
      var email = (s.student_email || '').toLowerCase();
      var matchZ = !zoek || naam.includes(zoek) || bedrijf.includes(zoek) || email.includes(zoek);
      var matchF = huidigFilter === 'alle' || s.status === huidigFilter;
      return matchZ && matchF;
    });

    var c = { ingediend: 0, goedgekeurd: 0, aanpassingen_vereist: 0 };
    relevant.forEach(function (s) { if (c[s.status] !== undefined) c[s.status]++; });

    var elAlle = document.getElementById('cnt-alle');
    var elIng  = document.getElementById('cnt-ingediend');
    var elAanp = document.getElementById('cnt-aanpassing');
    var elGk   = document.getElementById('cnt-goedgekeurd');
    if (elAlle) elAlle.textContent = '(' + relevant.length + ')';
    if (elIng)  elIng.textContent  = '(' + c.ingediend + ')';
    if (elAanp) elAanp.textContent = '(' + c.aanpassingen_vereist + ')';
    if (elGk)   elGk.textContent   = '(' + c.goedgekeurd + ')';

    if (gefilterd.length === 0) {
      document.getElementById('tableContainer').innerHTML =
        '<div class="empty-state"><div class="empty-icon">📋</div>' +
        '<div class="empty-title">Geen aanvragen gevonden</div>' +
        '<div class="empty-text">Er zijn geen aanvragen die overeenkomen met je filter.</div></div>';
      return;
    }

    var html = '<table class="data-table"><thead><tr>' +
      '<th>Student</th><th>Bedrijf</th><th>Stageperiode</th><th>Status</th><th>Ingediend op</th>' +
      '</tr></thead><tbody>';

    gefilterd.forEach(function (s) {
      var naam = esc((s.student_voornaam || '') + ' ' + (s.student_achternaam || ''));
      var periode = fmtDatum(s.startdatum) + ' – ' + fmtDatum(s.einddatum);
      var ingediend = fmtDatum(s.aangemaakt_op);

      html +=
        '<tr class="row-clickable" data-id="' + s.id + '">' +
          '<td><span class="student-naam">' + naam + '</span></td>' +
          '<td>' + esc(s.bedrijf_naam || '--') + '</td>' +
          '<td>' + periode + '</td>' +
          '<td>' + badge(s.status, !!s.commissie_getekend) + '</td>' +
          '<td>' + ingediend + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('tableContainer').innerHTML = html;

    document.querySelectorAll('.row-clickable').forEach(function (row) {
      row.addEventListener('click', function () {
        window.location.href = '../stage-beoordeling/commissie.aanvraag-beoordeling.html?id=' + row.dataset.id;
      });
    });
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
      document.getElementById('errorMessage').textContent = 'Kon stages niet laden. Staat de server aan?';
      document.getElementById('errorMessage').classList.add('show');
    }
    render();
  }

  document.getElementById('searchInput').addEventListener('input', render);

  document.querySelector('.filter-buttons').addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    huidigFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    render();
  });

  laad();
})();
