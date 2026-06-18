(function () {
  var user  = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  var token = sessionStorage.getItem('token');
  var el    = function (id) { return document.getElementById(id); };

  var voornaam = (user.name || '').split(' ')[0];
  el('userName').textContent  = user.name || '...';
  el('userAvatar').textContent = (user.name || '??').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  el('welcomeTitle').textContent = 'Welkom terug, ' + (voornaam || 'Mentor');

  function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
  }

  function renderEmpty() {
    el('takenContainer').innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">📋</div>' +
        '<div class="empty-title">Geen openstaande taken</div>' +
        '<div class="empty-text">Geen openstaande taken op dit moment. Nieuwe logboeken en evaluaties verschijnen hier automatisch.</div>' +
      '</div>';
  }

  function renderTaken(logboeken, stages) {
    el('statStagiaires').textContent = stages.length;
    el('statLogboeken').textContent  = logboeken.length;

    var actief = stages.find(function (s) { return s.status === 'actief'; });
    el('welcomeSub').textContent = 'Stagejaar 2025-2026' + (actief && actief.bedrijf_naam ? ' · ' + actief.bedrijf_naam : '');

    if (logboeken.length === 0) { renderEmpty(); return; }

    var html = '<div class="taken-list">';
    logboeken.forEach(function (lb) {
      html +=
        '<div class="taak-item">' +
          '<div class="taak-info">' +
            '<div class="taak-titel">📄 Logboek week ' + lb.week_nummer + ' — ' + lb.student_voornaam + ' ' + lb.student_achternaam + '</div>' +
            '<div class="taak-meta">Ingediend op ' + fmt(lb.ingediend_op) + (lb.totaal_uren ? ' · ' + lb.totaal_uren + ' werkuren' : '') + '</div>' +
          '</div>' +
          '<button class="taak-btn blauw" onclick="window.location.href=\'../stagiair-detail/stagiair-detail.html?stage_id=' + lb.stage_id + '\'">Aftekenen</button>' +
        '</div>';
    });
    html += '</div>';
    el('takenContainer').innerHTML = html;
  }

  async function laad() {
    try {
      var h = { 'Authorization': 'Bearer ' + token };
      var [sRes, lRes] = await Promise.all([
        fetch(API_BASE + '/stages/mentor/mijn',              { headers: h }),
        fetch(API_BASE + '/logboeken/mentor/te-beoordelen',  { headers: h }),
      ]);
      var stages    = sRes.ok ? await sRes.json() : [];
      var logboeken = lRes.ok ? await lRes.json() : [];
      if (!Array.isArray(stages))    stages    = [];
      if (!Array.isArray(logboeken)) logboeken = [];
      renderTaken(logboeken, stages);
    } catch (e) {
      el('statLogboeken').textContent  = '0';
      el('statStagiaires').textContent = '0';
      renderEmpty();
    }
  }

  laad();
})();
