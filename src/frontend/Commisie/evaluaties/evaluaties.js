(function () {
  var token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '../../inloggen/inloggen.html'; return; }

  var alleEvaluaties = [];
  var huidigFilter = 'alle';

  function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function fmtDatum(d) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('nl-BE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function typeBadge(type) {
    if (type === 'tussentijds') return '<span class="badge badge-tussentijds">Tussentijds</span>';
    return '<span class="badge badge-eind">Eind</span>';
  }

  function statusBadge(status) {
    if (status === 'afgerond') return '<span class="badge badge-afgerond">Afgerond</span>';
    if (status === 'ingediend') return '<span class="badge badge-ingediend">Ingediend</span>';
    return '<span class="badge badge-concept">Concept</span>';
  }

  function scoreBadge(score) {
    if (!score && score !== 0) return '<span class="score-badge score-geen">--</span>';
    var cls = score < 10 ? 'score-laag' : (score < 14 ? 'score-midden' : 'score-hoog');
    return '<span class="score-badge ' + cls + '">' + score + '</span>';
  }

  function render() {
    var zoek = (document.getElementById('searchInput').value || '').toLowerCase();

    var gefilterd = alleEvaluaties.filter(function (e) {
      var naam = ((e.student_voornaam || '') + ' ' + (e.student_achternaam || '')).toLowerCase();
      var bedrijf = (e.bedrijf_naam || '').toLowerCase();
      var matchZ = !zoek || naam.includes(zoek) || bedrijf.includes(zoek);
      var matchF = huidigFilter === 'alle' || e.type === huidigFilter;
      return matchZ && matchF;
    });

    var tussentijds = alleEvaluaties.filter(function (e) { return e.type === 'tussentijds'; }).length;
    var eind = alleEvaluaties.filter(function (e) { return e.type === 'eind'; }).length;

    document.getElementById('cnt-alle').textContent = '(' + alleEvaluaties.length + ')';
    document.getElementById('cnt-tussentijds').textContent = '(' + tussentijds + ')';
    document.getElementById('cnt-eind').textContent = '(' + eind + ')';

    if (gefilterd.length === 0) {
      document.getElementById('tableContainer').innerHTML =
        '<div class="empty-state"><div class="empty-icon">📊</div>' +
        '<div class="empty-title">Geen evaluaties gevonden</div>' +
        '<div class="empty-text">Er zijn momenteel geen evaluaties die overeenkomen met je filter.</div></div>';
      return;
    }

    var html = '<table class="data-table"><thead><tr>' +
      '<th>Student</th><th>Bedrijf</th><th>Docent</th><th>Type</th><th>Score</th><th>Status</th><th>Datum</th>' +
      '</tr></thead><tbody>';

    gefilterd.forEach(function (e) {
      var naam = esc((e.student_voornaam || '') + ' ' + (e.student_achternaam || ''));
      var docent = e.docent_voornaam ? esc(e.docent_voornaam + ' ' + e.docent_achternaam) : '--';
      var datum = fmtDatum(e.ingediend_op || e.aangemaakt_op);

      html +=
        '<tr>' +
          '<td><span class="student-naam">' + naam + '</span></td>' +
          '<td>' + esc(e.bedrijf_naam || '--') + '</td>' +
          '<td>' + docent + '</td>' +
          '<td>' + typeBadge(e.type) + '</td>' +
          '<td>' + scoreBadge(e.eindscore) + '</td>' +
          '<td>' + statusBadge(e.status) + '</td>' +
          '<td>' + datum + '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    document.getElementById('tableContainer').innerHTML = html;
  }

  async function laad() {
    try {
      var res = await fetch(API_BASE + '/evaluaties/alle', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      alleEvaluaties = res.ok ? await res.json() : [];
      if (!Array.isArray(alleEvaluaties)) alleEvaluaties = [];
    } catch (e) {
      alleEvaluaties = [];
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
