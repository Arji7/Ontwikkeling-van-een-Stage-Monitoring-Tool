(function () {
  var token = sessionStorage.getItem('token');
  var alleRijen = [];

  document.addEventListener('DOMContentLoaded', async function () {
    await laadEvaluaties();
    tekenStats();
    render();

    document.getElementById('zoekInput').addEventListener('input', render);
    document.getElementById('filterType').addEventListener('change', render);
    document.getElementById('filterStatus').addEventListener('change', render);
  });

  async function laadEvaluaties() {
    try {
      var res = await fetch(API_BASE + '/admin/evaluaties', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      var data = res.ok ? await res.json() : [];
      alleRijen = data.map(function (e) {
        return {
          id: e.id,
          student: (e.student_voornaam || '') + ' ' + (e.student_achternaam || ''),
          opleiding: '',
          bedrijf: e.bedrijf_naam || '—',
          docent: e.docent_voornaam ? e.docent_voornaam + ' ' + e.docent_achternaam : '—',
          type: e.type === 'eind' ? 'eindevaluatie' : 'tussentijds',
          status: e.status || 'open',
          score: null
        };
      });
    } catch (e) {
      alleRijen = [];
    }
  }

  function tekenStats() {
    var actief      = new Set(alleRijen.map(function (r) { return r.student; })).size;
    var tussentijds = alleRijen.filter(function (r) { return r.type === 'tussentijds' && (r.status === 'ingediend' || r.status === 'afgerond'); }).length;
    var totaalT     = alleRijen.filter(function (r) { return r.type === 'tussentijds'; }).length;
    var einde       = alleRijen.filter(function (r) { return r.type === 'eindevaluatie' && r.status === 'afgerond'; }).length;

    document.getElementById('statActief').textContent        = actief;
    document.getElementById('statTussentijds').textContent   = tussentijds;
    document.getElementById('statTussentijdsDesc').textContent = 'van ' + totaalT + ' ingediend';
    document.getElementById('statEinde').textContent         = einde;
  }

  function render() {
    var zoek       = document.getElementById('zoekInput').value.toLowerCase();
    var filterType = document.getElementById('filterType').value;
    var filterSt   = document.getElementById('filterStatus').value;

    var gefilterd = alleRijen.filter(function (r) {
      var zoekMatch = !zoek ||
        r.student.toLowerCase().includes(zoek) ||
        r.bedrijf.toLowerCase().includes(zoek) ||
        r.docent.toLowerCase().includes(zoek);
      var typeMatch   = !filterType || r.type === filterType;
      var statusMatch = !filterSt   || r.status === filterSt;
      return zoekMatch && typeMatch && statusMatch;
    });

    if (gefilterd.length === 0) {
      document.getElementById('tabelBody').innerHTML =
        '<tr><td colspan="6" class="table-empty">Geen evaluaties gevonden.</td></tr>';
      document.getElementById('tabelFooter').textContent = '';
      return;
    }

    document.getElementById('tabelBody').innerHTML = gefilterd.map(function (r) {
      return '<tr>' +
        '<td><div class="stud-naam">' + esc(r.student) + '</div><div class="stud-opl">' + esc(r.opleiding) + '</div></td>' +
        '<td>' + esc(r.bedrijf) + '</td>' +
        '<td>' + esc(r.docent) + '</td>' +
        '<td>' + typeBadge(r.type) + '</td>' +
        '<td>' + statusBadge(r.status) + '</td>' +
        '<td>' + scoreBalk(r.score) + '</td>' +
        '</tr>';
    }).join('');

    document.getElementById('tabelFooter').textContent =
      'Toont ' + gefilterd.length + ' van ' + alleRijen.length + ' evaluaties';
  }

  function typeBadge(type) {
    if (type === 'tussentijds')   return '<span class="badge badge-tussentijds">Tussentijds</span>';
    if (type === 'eindevaluatie') return '<span class="badge badge-eindevaluatie">Eindevaluatie</span>';
    return '<span class="badge">' + esc(type) + '</span>';
  }

  function statusBadge(status) {
    var map = {
      ingediend:   ['badge-ingediend',   '✓ Ingediend'],
      afgerond:    ['badge-afgerond',    '✓ Afgerond'],
      behandeling: ['badge-behandeling', '⏳ In behandeling'],
      wacht:       ['badge-wacht',       '⏳ Wacht op docent'],
      open:        ['badge-wacht',       '⏳ Open'],
    };
    var info = map[status] || ['badge', status];
    return '<span class="badge ' + info[0] + '">' + info[1] + '</span>';
  }

  function scoreBalk(score) {
    if (score === null || score === undefined) {
      return '<span style="color:var(--text-muted);font-size:12px">—</span>';
    }
    var pct = Math.min(100, Math.round(score));
    return '<div class="score-wrap">' +
      '<div class="score-bar"><div class="score-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="score-num">' + score + '</span>' +
      '</div>';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
