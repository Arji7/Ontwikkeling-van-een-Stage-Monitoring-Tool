(function () {
  var user  = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  var token = sessionStorage.getItem('token');
  var el    = function (id) { return document.getElementById(id); };

  el('userName').textContent   = user.name || '...';
  el('userAvatar').textContent = (user.name || '??').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

  var alleStages   = [];
  var huidigFilter = 'alle';

  var KLEUREN = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#9333ea','#dc2626'];
  function kleur(naam) {
    var c = 0;
    for (var i = 0; i < naam.length; i++) c += naam.charCodeAt(i);
    return KLEUREN[c % KLEUREN.length];
  }

  function stageCategorie(s) {
    if (s.status === 'afgerond') return 'afgerond';
    var ov = s.overeenkomst_status;
    if (ov === 'ondertekend' || ov === 'goedgekeurd') return 'actief';
    return 'ondertekening';
  }

  function filterCategorie(s) { return stageCategorie(s); }

  function badge(s) {
    var cat = stageCategorie(s);
    if (cat === 'afgerond')     return '<span class="badge" style="background:#14532d;color:#fff">Afgerond</span>';
    if (cat === 'actief')       return '<span class="badge badge-actief">Actief</span>';
    return '<span class="badge badge-ondertekening">Wacht op ondertekening</span>';
  }

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function render() {
    var zoek = (el('zoekInput').value || '').toLowerCase();

    var gefilterd = alleStages.filter(function (s) {
      var naam    = ((s.student_voornaam || '') + ' ' + (s.student_achternaam || '')).toLowerCase();
      var bedrijf = (s.bedrijf_naam || '').toLowerCase();
      var matchZ  = !zoek || naam.includes(zoek) || bedrijf.includes(zoek);
      var matchF  = huidigFilter === 'alle' || filterCategorie(s) === huidigFilter;
      return matchZ && matchF;
    });

    el('cnt-alle').textContent         = '(' + alleStages.length + ')';
    el('cnt-actief').textContent        = '(' + alleStages.filter(function (s) { return s.status === 'actief'; }).length + ')';
    el('cnt-ondertekening').textContent = '(' + alleStages.filter(function (s) { return s.status === 'goedgekeurd'; }).length + ')';
    el('cnt-afgerond').textContent      = '(' + alleStages.filter(function (s) { return s.status === 'afgerond'; }).length + ')';

    if (gefilterd.length === 0) {
      el('tabelContainer').innerHTML =
        '<div class="empty-state"><div class="empty-icon">👤</div>' +
        '<div class="empty-title">Geen stagiaires gevonden</div>' +
        '<div class="empty-text">Er zijn geen stagiaires die overeenkomen met je zoekopdracht of filter.</div></div>';
      return;
    }

    var html = '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      '<th>Student</th><th>Bedrijf</th><th>Voortgang</th><th>Status</th><th></th>' +
      '</tr></thead><tbody>';

    gefilterd.forEach(function (s) {
      var naam     = esc((s.student_voornaam || '') + ' ' + (s.student_achternaam || ''));
      var init     = naam.trim().split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
      var k        = kleur(naam);
      var totaal   = s.startdatum && s.einddatum
        ? Math.max(1, Math.round((new Date(s.einddatum) - new Date(s.startdatum)) / (7*24*60*60*1000)))
        : (s.totaal_weken || 14);
      var huidig   = s.startdatum
        ? Math.max(0, Math.min(totaal, Math.round((new Date() - new Date(s.startdatum)) / (7*24*60*60*1000))))
        : (s.huidige_week || 0);
      var pct      = Math.min(100, Math.round((huidig / totaal) * 100));
      var cat      = stageCategorie(s);
      var pgKlasse = cat === 'actief' ? 'actief' : cat === 'afgerond' ? 'afgerond' : 'inactief';

      html +=
        '<tr>' +
          '<td><div class="student-cel">' +
            '<div class="avatar-circle" style="background:' + k + '">' + init + '</div>' +
            '<div><div class="student-naam">' + naam + '</div>' +
            '<div class="student-opleiding">' + esc(s.opleiding_naam || '—') + '</div></div>' +
          '</div></td>' +
          '<td>' + esc(s.bedrijf_naam || '—') + '</td>' +
          '<td><div class="progress-wrap">' +
            '<div class="progress-label">Week ' + huidig + ' / ' + totaal + '</div>' +
            '<div class="progress-bar"><div class="progress-fill ' + pgKlasse + '" style="width:' + pct + '%"></div></div>' +
          '</div></td>' +
          '<td>' + badge(s) + '</td>' +
          '<td><a class="btn-bekijk" href="../stagiair-detail/stagiair-detail.html?stage_id=' + s.id + '">Bekijk</a></td>' +
        '</tr>';
    });

    html += '</tbody></table></div>';
    el('tabelContainer').innerHTML = html;
  }

  async function laad() {
    try {
      var res = await fetch(API_BASE + '/stages/mentor/mijn', { headers: { 'Authorization': 'Bearer ' + token } });
      alleStages = res.ok ? await res.json() : [];
      if (!Array.isArray(alleStages)) alleStages = [];
    } catch (e) { alleStages = []; }
    render();
  }

  el('zoekInput').addEventListener('input', render);
  el('filterTabs').addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-tab');
    if (!btn) return;
    huidigFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-tab').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    render();
  });

  laad();
})();
