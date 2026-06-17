(function () {
  var user    = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  var token   = sessionStorage.getItem('token');
  var el      = function (id) { return document.getElementById(id); };
  var headers = { 'Authorization': 'Bearer ' + token };

  el('userName').textContent   = user.name || '...';
  el('userAvatar').textContent = (user.name || '??').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

  var stageId = new URLSearchParams(window.location.search).get('stage_id');
  if (!stageId) { window.location.replace('../mijn-stagiaires/mijn-stagiaires.html'); return; }

  var KLEUREN = ['#2563eb','#7c3aed','#db2777','#ea580c','#16a34a','#0891b2','#9333ea','#dc2626'];
  function kleur(naam) {
    var c = 0; for (var i = 0; i < (naam||'').length; i++) c += naam.charCodeAt(i);
    return KLEUREN[c % KLEUREN.length];
  }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function fmt(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('nl-BE', {day:'numeric',month:'long',year:'numeric'}); }
  function fmtKort(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('nl-BE', {day:'numeric',month:'short'}); }
  function aantalWeken(s,e) { if (!s||!e) return '—'; return Math.round((new Date(e)-new Date(s))/(7*24*60*60*1000)); }

  // ── Tabs ──
  var logboekenGeladen  = false;
  var evaluatiesGeladen = false;
  document.querySelectorAll('.detail-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab.classList.contains('locked')) return;
      document.querySelectorAll('.detail-tab').forEach(function (t) { t.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
      tab.classList.add('active');
      el('panel-' + tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'logboeken'  && !logboekenGeladen)  laadLogboeken();
      if (tab.dataset.tab === 'evaluaties' && !evaluatiesGeladen) laadEvaluaties();
    });
  });

  function ontsluitTabs() {
    var lb = el('tabLogboeken'), ev = el('tabEvaluaties');
    lb.classList.remove('locked'); lb.textContent = 'Logboeken';
    ev.classList.remove('locked'); ev.textContent = 'Evaluaties';
  }

  // ── Stage render ──
  function renderStage(s) {
    var naam    = esc((s.student_voornaam||'') + ' ' + (s.student_achternaam||''));
    var init    = naam.trim().split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();
    var k       = kleur(naam);
    var huidig  = s.huidige_week || 0;
    var totaal  = s.totaal_weken || 14;
    var pct     = Math.min(100, Math.round((huidig/totaal)*100));
    var isAfgerond   = s.status === 'afgerond';
    var isOndertekend = s.overeenkomst_status === 'ondertekend' || s.overeenkomst_status === 'goedgekeurd';
    var tabsVrij     = isOndertekend || isAfgerond;
    var weken        = aantalWeken(s.startdatum, s.einddatum);
    var docentNaam   = s.docent_voornaam ? esc(s.docent_voornaam + ' ' + s.docent_achternaam) : '—';

    el('studentAvatar').textContent      = init;
    el('studentAvatar').style.background = k;
    el('studentNaam').textContent        = naam;
    el('studentMeta').textContent        = (s.opleiding_naam||'—') + (s.student_email ? ' · ' + s.student_email : '');

    var badgeEl = el('stageBadge');
    if (isAfgerond) {
      badgeEl.className   = 'badge';
      badgeEl.style.cssText = 'background:#14532d;color:#fff';
      badgeEl.textContent = 'Afgerond — week ' + huidig + '/' + totaal;
    } else if (isOndertekend) {
      badgeEl.className   = 'badge badge-actief';
      badgeEl.textContent = 'Actief — week ' + huidig + '/' + totaal;
    } else {
      badgeEl.className   = 'badge badge-ondertekening';
      badgeEl.textContent = 'Wacht op ondertekening';
    }

    if (tabsVrij) ontsluitTabs();

    el('stageContainer').innerHTML =
      '<div class="stage-card">' +
        '<div class="stage-card-header">' +
          '<span class="stage-huidig">HUIDIGE STAGE</span>' +
          '<div class="stage-card-title">🟢 ' + esc(s.bedrijf_naam||'—') + (s.omschrijving ? ' — ' + esc(s.omschrijving.slice(0,60)) + (s.omschrijving.length>60?'…':'') : '') + '</div>' +
          '<div style="text-align:right">' +
            '<div style="font-size:1.8em;font-weight:800;color:#2563eb;line-height:1">' + huidig + '<span style="font-size:16px;color:#6b7280">/' + totaal + '</span></div>' +
            '<div style="font-size:11px;color:#6b7280">' + pct + '% voltooid</div>' +
          '</div>' +
        '</div>' +
        '<div class="stage-card-body">' +
          '<div class="periode-row">📅 ' + fmt(s.startdatum) + ' <span class="periode-sep">→</span> ' + fmt(s.einddatum) +
            ' <span class="periode-sep">·</span> ' + (weken!=='—'?weken+' weken':'—') + ' <span class="periode-sep">·</span> 38u/week</div>' +
          '<div class="stage-info-grid">' +
            '<div class="stage-info-col"><label>Stagementor</label><div class="stage-info-val">' + esc(s.contact_naam||'—') + '</div>' +
              '<div class="stage-info-sub">' + (s.contact_email ? '<a href="mailto:'+esc(s.contact_email)+'" style="color:#2563eb;font-size:12px">'+esc(s.contact_email)+'</a>' : '—') + '</div></div>' +
            '<div class="stage-info-col"><label>Opdracht</label><div class="stage-info-val">' + esc(s.omschrijving||'—') + '</div></div>' +
            '<div class="stage-info-col"><label>Documenten</label><a class="doc-link" href="#">📎 Stagevoorstel</a><a class="doc-link" href="#">📎 Stageovereenkomst</a></div>' +
          '</div>' +
          '<div class="eval-grid">' +
            '<div class="eval-box"><div class="eval-score">—</div><div class="eval-label">Mentor — tussentijds</div><div class="eval-datum">Nog niet ingevuld</div></div>' +
            '<div class="eval-box"><div class="eval-score">—</div><div class="eval-label">Mentor — eind</div><div class="eval-datum">Nog niet ingediend</div></div>' +
            '<div class="eval-box jouw"><div class="eval-score">—</div><div class="eval-label">Jouw eindscore</div><div class="eval-datum">Te geven na stage</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="sectie-card">' +
        '<h3>Documenten</h3><div class="sectie-sub">Officiële documenten met de afspraken</div>' +
        '<div class="doc-item"><div class="doc-icoon">📄</div>' +
          '<div class="doc-info"><div class="doc-naam">Stagevoorstel.pdf</div><div class="doc-meta">Ingediend op ' + fmtKort(s.aangemaakt_op) + '</div></div>' +
          '<span class="badge badge-goedgekeurd">Goedgekeurd</span></div>' +
        '<div class="doc-item"><div class="doc-icoon">📄</div>' +
          '<div class="doc-info"><div class="doc-naam">Stageovereenkomst.pdf</div><div class="doc-meta">Stageovereenkomst</div></div>' +
          (isOndertekend ? '<span class="badge badge-actief">Ondertekend</span>' : '<span class="badge badge-ondertekening">Wacht op ondertekening</span>') +
        '</div>' +
      '</div>' +
      '<div class="sectie-card">' +
        '<h3>Contacten</h3><div class="sectie-sub">Personen betrokken bij deze stage</div>' +
        '<div class="contact-list">' +
          '<div class="contact-item">' +
            '<div class="contact-avatar" style="background:'+k+';color:#fff">'+init+'</div>' +
            '<div><div class="contact-naam">'+naam+'</div><div class="contact-rol">Stagiair</div>' +
            '<div class="contact-email"><a href="mailto:'+esc(s.student_email||'')+'">'+esc(s.student_email||'—')+'</a></div></div>' +
          '</div>' +
          '<div class="contact-item">' +
            '<div class="contact-avatar">' + (docentNaam!=='—' ? docentNaam.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase() : '?') + '</div>' +
            '<div><div class="contact-naam">'+docentNaam+'</div><div class="contact-rol">Begeleidende docent</div></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // ── Logboeken tab ──
  var alleLogboeken = [];
  var huidigFilter  = 'alle';

  function lbKlasse(status) {
    if (status === 'goedgekeurd') return 'groen';
    if (status === 'ingediend' || status === 'wacht_op_mentor') return 'oranje';
    return 'grijs';
  }

  function renderLogboeken() {
    var gefilterd = alleLogboeken.filter(function (lb) {
      if (huidigFilter === 'afgecheckt')    return lb.status === 'goedgekeurd';
      if (huidigFilter === 'nogafchecken')  return lb.status !== 'goedgekeurd';
      return true;
    });

    var totaalUren = alleLogboeken.reduce(function (s, lb) { return s + (lb.totaal_uren || lb.totaal_dag_uren || 0); }, 0);
    var afgecheckt = alleLogboeken.filter(function (lb) { return lb.status === 'goedgekeurd'; }).length;
    var nogAfcheck = alleLogboeken.length - afgecheckt;

    var html =
      '<div class="lb-stats">' +
        '<div class="lb-stat"><div class="lb-stat-label">Ingediend</div><div class="lb-stat-value">' + alleLogboeken.length + ' / ' + (window._stageTotaalWeken||14) + '</div></div>' +
        '<div class="lb-stat"><div class="lb-stat-label">Door jou afgecheckt</div><div class="lb-stat-value groen">' + afgecheckt + '</div></div>' +
        '<div class="lb-stat"><div class="lb-stat-label">Nog afchecken</div><div class="lb-stat-value' + (nogAfcheck>0?' oranje':'') + '">' + nogAfcheck + '</div></div>' +
        '<div class="lb-stat"><div class="lb-stat-label">Totaal uren</div><div class="lb-stat-value">' + totaalUren + '</div></div>' +
      '</div>' +
      '<div class="lb-filter">' +
        '<button class="lb-pill' + (huidigFilter==='alle'?' active':'') + '" data-f="alle">Alle (' + alleLogboeken.length + ')</button>' +
        '<button class="lb-pill' + (huidigFilter==='afgecheckt'?' active':'') + '" data-f="afgecheckt">afgecheckt (' + afgecheckt + ')</button>' +
        '<button class="lb-pill' + (huidigFilter==='nogafchecken'?' active':'') + '" data-f="nogafchecken">nog afchecken (' + nogAfcheck + ')</button>' +
      '</div>';

    if (gefilterd.length === 0) {
      html += '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">Geen logboeken</div><div class="empty-text">Geen logboeken gevonden.</div></div>';
    } else {
      html += '<div class="lb-lijst">';
      gefilterd.forEach(function (lb) {
        var klasse   = lbKlasse(lb.status);
        var badge    = lb.status === 'goedgekeurd'
          ? '<span class="badge badge-actief">✓ Afgecheckt</span>'
          : '<span class="badge badge-ondertekening">nog afchecken</span>';
        var preview  = esc(lb.uitgevoerde_taken || lb.titel || '');
        var url      = 'logboek-detail.html?logboek_id=' + lb.id + '&stage_id=' + stageId;
        html +=
          '<a class="lb-item" href="' + url + '">' +
            '<div class="lb-week-cirkel ' + klasse + '">' + lb.week_nummer + '<small>Week</small></div>' +
            '<div class="lb-midden">' +
              '<div class="lb-titel">Week ' + lb.week_nummer + (lb.datum_van ? ' · ' + fmtKort(lb.datum_van) + ' – ' + fmtKort(lb.datum_tot) : '') + '</div>' +
              '<div class="lb-preview">' + (preview.slice(0,100) + (preview.length>100?'…':'')) + '</div>' +
            '</div>' +
            '<div class="lb-rechts">' +
              '<div class="lb-uren">' + (lb.totaal_uren || lb.totaal_dag_uren || '—') + 'u</div>' +
              '<div class="lb-dagen">' + (lb.aantal_dagen||0) + ' dagen</div>' +
              badge +
            '</div>' +
          '</a>';
      });
      html += '</div>';
    }

    el('logboekenContent').innerHTML = html;

    el('logboekenContent').querySelectorAll('.lb-pill').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        huidigFilter = btn.dataset.f;
        renderLogboeken();
      });
    });
  }

  async function laadLogboeken() {
    el('logboekenContent').innerHTML = '<div class="loading-state"><div class="spinner"></div><div>Logboeken laden...</div></div>';
    try {
      var res = await fetch(API_BASE + '/logboeken/stage/' + stageId, { headers: headers });
      alleLogboeken = res.ok ? await res.json() : [];
      if (!Array.isArray(alleLogboeken)) alleLogboeken = [];
      logboekenGeladen = true;
      renderLogboeken();
    } catch (e) {
      el('logboekenContent').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Fout</div><div class="empty-text">Logboeken konden niet worden geladen.</div></div>';
    }
  }

  // ── Stage laden ──
  async function laad() {
    try {
      var res = await fetch(API_BASE + '/stages/' + stageId, { headers: headers });
      if (!res.ok) throw new Error();
      var stage = await res.json();

      try {
        var lbRes = await fetch(API_BASE + '/logboeken/stage/' + stageId, { headers: headers });
        if (lbRes.ok) {
          var lb = await lbRes.json();
          stage.huidige_week = Array.isArray(lb) && lb.length > 0
            ? Math.max.apply(null, lb.map(function (l) { return l.week_nummer||0; })) : 0;
        }
      } catch (e) { stage.huidige_week = 0; }

      stage.totaal_weken = stage.totaal_weken || 14;
      window._stageTotaalWeken = stage.totaal_weken;
      renderStage(stage);
    } catch (e) {
      el('stageContainer').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Stage niet gevonden</div><div class="empty-text">De opgevraagde stage kon niet worden geladen.</div></div>';
      el('studentNaam').textContent = 'Onbekende stagiair';
    }
  }

  laad();
})();
