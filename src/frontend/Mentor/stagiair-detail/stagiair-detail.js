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

  // ── Evaluaties tab ──
  var evalState = { evaluaties: [], rubriek: [], actieveSub: 'tussentijds', actieveComp: 0, pendingScores: {}, toonRubriek: false };

  function scoreNaarTwintig(scores) {
    var gevuld = scores.filter(function (s) { return s.score_mentor; });
    if (!gevuld.length) return null;
    var gem = gevuld.reduce(function (t, s) { return t + s.score_mentor; }, 0) / gevuld.length;
    return Math.round((gem / 5) * 20 * 10) / 10;
  }

  function renderEvalScoreCard(label, score, klasse) {
    return '<div class="eval-score-card ' + (klasse||'') + '">' +
      '<div class="eval-score-label">' + label + '</div>' +
      '<div class="eval-score-val">' + (score !== null ? score + '/20' : '—') + '</div>' +
      '<div class="eval-score-sub">berekend uit competenties</div>' +
    '</div>';
  }

  function alleScoresVoorEval(evalId) {
    var comp = evalState.rubriek;
    var scores = [];
    comp.forEach(function (c) {
      c.subcompetenties.forEach(function (sc) {
        var ev = evalState.evaluaties.find(function (e) { return e.id === evalId; });
        var scoreObj = ev ? (ev.competenties || []).reduce(function (a, cc) {
          return a.concat(cc.scores || []);
        }, []).find(function (s) { return s.subcompetentie_id === sc.id; }) : null;
        scores.push(scoreObj || { subcompetentie_id: sc.id, score_mentor: null });
      });
    });
    return scores;
  }

  function buildEvalHeader(tussentijds, eind) {
    return '<div class="eval-header-rij">' +
      '<div class="eval-subtabs">' +
        '<button class="eval-subtab' + (evalState.actieveSub==='tussentijds'&&!evalState.toonRubriek?' active':'') + '" data-ev="tussentijds">' +
          (tussentijds ? '<span class="dot oranje"></span> ' : '') + 'Tussentijdse evaluatie' +
        '</button>' +
        '<button class="eval-subtab' + (evalState.actieveSub==='eind'&&!evalState.toonRubriek?' active':'') + '" data-ev="eind">' +
          (eind ? '<span class="dot oranje"></span> ' : '') + 'Eindbeoordeling' +
        '</button>' +
      '</div>' +
      '<button class="btn-rubriek' + (evalState.toonRubriek?' active':'') + '" id="btnBekijkRubriek">' +
        (evalState.toonRubriek ? '← Terug naar scores' : '📋 Bekijk rubriek') +
      '</button>' +
    '</div>';
  }

  var rubriekData = null;

  async function laadRubriekData() {
    if (rubriekData) return rubriekData;
    try {
      var res = await fetch(API_BASE + '/competenties/stage/' + stageId, { headers: headers });
      rubriekData = res.ok ? await res.json() : [];
    } catch (e) { rubriekData = []; }
    return rubriekData;
  }

  function labelNiveau(n) {
    return ['','Onvoldoende','Zwak','Voldoende','Goed','Uitmuntend'][n] || '';
  }

  function renderRubriekAccordion(competenties) {
    var html = '';
    competenties.forEach(function (comp, idx) {
      var subCount = (comp.subcompetenties || []).length;
      html +=
        '<div class="rubriek-comp">' +
          '<div class="rubriek-comp-header" onclick="(function(h){var b=h.nextElementSibling,t=h.querySelector(\'.rubriek-comp-toggle\');b.classList.toggle(\'open\');t.classList.toggle(\'open\');})(this)">' +
            '<div class="rubriek-comp-num">' + (idx+1) + '</div>' +
            '<div class="rubriek-comp-name">' + esc(comp.naam) + '</div>' +
            '<div class="rubriek-comp-count">' + subCount + ' subcompetentie' + (subCount!==1?'s':'') + '</div>' +
            '<span class="rubriek-comp-toggle">›</span>' +
          '</div>' +
          '<div class="rubriek-comp-body">';

      if (comp.subcompetenties && comp.subcompetenties.length) {
        comp.subcompetenties.forEach(function (sc) {
          var niveauMap = {};
          (sc.niveaus || []).forEach(function (n) { niveauMap[n.niveau] = n; });

          html +=
            '<div class="rubriek-subcomp">' +
              '<div class="rubriek-subcomp-header">' +
                (sc.code ? '<span class="rubriek-subcomp-code">' + esc(sc.code) + '</span>' : '') +
                '<span class="rubriek-subcomp-name">' + esc(sc.naam) + '</span>' +
              '</div>' +
              '<div class="niveau-grid">';

          for (var n = 1; n <= 5; n++) {
            var niv = niveauMap[n] || {};
            html +=
              '<div class="niveau-cell niveau-' + n + '">' +
                '<div class="niveau-cell-header">' +
                  '<div class="niveau-num">' + n + '</div>' +
                  '<div class="niveau-label">' + esc(niv.label || labelNiveau(n)) + '</div>' +
                  (niv.sublabel ? '<div class="niveau-sublabel">' + esc(niv.sublabel) + '</div>' : '') +
                '</div>' +
                (niv.beschrijving ? '<div class="niveau-desc">' + esc(niv.beschrijving) + '</div>' : '') +
              '</div>';
          }

          html += '</div></div>';
        });
      } else {
        html += '<div style="padding:20px;color:#9ca3af;font-size:14px;">Geen subcompetenties beschikbaar.</div>';
      }

      html += '</div></div>';
    });
    return html;
  }

  async function renderRubriekInhoud(tussentijds, eind) {
    var html = buildEvalHeader(tussentijds, eind);

    html +=
      '<div class="rubriek-inline">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">' +
          '<span class="score-chip score-1" style="padding:4px 14px;border-radius:20px;font-size:13px">1 · Onvoldoende</span>' +
          '<span class="score-chip score-2" style="padding:4px 14px;border-radius:20px;font-size:13px">2 · Zwak</span>' +
          '<span class="score-chip score-3" style="padding:4px 14px;border-radius:20px;font-size:13px">3 · Voldoende</span>' +
          '<span class="score-chip score-4" style="padding:4px 14px;border-radius:20px;font-size:13px">4 · Goed</span>' +
          '<span class="score-chip score-5" style="padding:4px 14px;border-radius:20px;font-size:13px">5 · Uitmuntend</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:20px;">' +
          '<button class="btn-alles-open" onclick="document.querySelectorAll(\'.rubriek-comp-body\').forEach(function(b){b.classList.add(\'open\')});document.querySelectorAll(\'.rubriek-comp-toggle\').forEach(function(t){t.classList.add(\'open\')})">Alles uitklappen</button>' +
          '<button class="btn-alles-open" onclick="document.querySelectorAll(\'.rubriek-comp-body\').forEach(function(b){b.classList.remove(\'open\')});document.querySelectorAll(\'.rubriek-comp-toggle\').forEach(function(t){t.classList.remove(\'open\')})">Alles inklappen</button>' +
        '</div>' +
        '<div id="rubriekAccordion"><div class="loading-state"><div class="spinner"></div><div>Rubriek laden…</div></div></div>' +
      '</div>';

    el('evaluatiesContent').innerHTML = html;
    bindEvalHeaderEvents(tussentijds, eind, null);

    var comp = await laadRubriekData();
    var accordionEl = document.getElementById('rubriekAccordion');
    if (accordionEl) accordionEl.innerHTML = renderRubriekAccordion(comp);
  }

  function renderEvaluatiesInhoud() {
    var tussentijds = evalState.evaluaties.find(function (e) { return e.type === 'tussentijds'; });
    var eind        = evalState.evaluaties.find(function (e) { return e.type === 'eind'; });

    if (evalState.toonRubriek) {
      renderRubriekInhoud(tussentijds, eind);
      return; // async, laat het zichzelf afhandelen
    }

    var actief = evalState.actieveSub === 'tussentijds' ? tussentijds : eind;

    var tScoreAlleScores = tussentijds ? alleScoresVoorEval(tussentijds.id) : [];
    var eScoreAlleScores = eind        ? alleScoresVoorEval(eind.id)        : [];
    var tScore = scoreNaarTwintig(tScoreAlleScores);
    var eScore = scoreNaarTwintig(eScoreAlleScores);

    var html = buildEvalHeader(tussentijds, eind);

    // Score cards
    if (evalState.actieveSub === 'tussentijds' && tussentijds) {
      html += '<div class="eval-score-cards">' + renderEvalScoreCard('Jouw tussentijdse score', tScore) + '</div>';
    } else if (evalState.actieveSub === 'eind' && eind) {
      html += '<div class="eval-score-cards">' +
        renderEvalScoreCard('Jouw tussentijdse score', tScore) +
        renderEvalScoreCard('Jouw eindscore', eScore) +
      '</div>';
    }

    if (!actief) {
      html += '<div class="empty-state"><div class="empty-icon">📋</div>' +
        '<div class="empty-title">Nog geen evaluatie aangemaakt</div>' +
        '<div class="empty-text">De begeleidende docent maakt de evaluatie aan. Daarna kan jij je scores invullen.</div></div>';
      el('evaluatiesContent').innerHTML = html;
      bindEvalHeaderEvents(tussentijds, eind, null);
      return;
    }

    // 2-kolom layout: sidebar competenties + rechter content
    html += '<div class="eval-layout">';
    html += '<div class="eval-comp-sidebar">';
    evalState.rubriek.forEach(function (c, idx) {
      html += '<div class="eval-comp-item' + (evalState.actieveComp === idx ? ' active' : '') + '" data-idx="' + idx + '">' +
        '<span class="eval-comp-num">' + (idx+1) + '.</span> ' + esc(c.naam) +
      '</div>';
    });
    html += '</div>';

    var comp = evalState.rubriek[evalState.actieveComp];
    html += '<div class="eval-comp-content">';
    if (comp) {
      var evalComp = (actief.competenties || []).find(function (cc) { return cc.competentie_naam === comp.naam; });
      comp.subcompetenties.forEach(function (sc) {
        var scoreObj = evalComp ? (evalComp.scores || []).find(function (s) { return s.subcompetentie_id === sc.id; }) : null;
        var sM = scoreObj ? scoreObj.score_mentor    : null;
        var fM = scoreObj ? scoreObj.feedback_mentor  : '';
        var sD = scoreObj ? scoreObj.score_docent    : null;
        var fD = scoreObj ? scoreObj.feedback_docent  : '';
        var ref = scoreObj ? scoreObj.student_reflectie : '';
        var key = actief.id + '_' + sc.id;
        var pend = evalState.pendingScores[key] || {};
        if (pend.score_mentor    !== undefined) sM = pend.score_mentor;
        if (pend.feedback_mentor !== undefined) fM = pend.feedback_mentor;

        html +=
          '<div class="eval-gi-blok">' +
            '<div class="eval-gi-code">' + esc(sc.code) + '</div>' +
            '<div class="eval-gi-naam">' + esc(sc.naam) + '</div>' +
            '<div class="eval-gi-rij">' +
              '<div class="eval-gi-col">' +
                '<label>Score (Mentor)</label>' +
                '<input class="eval-score-input" type="number" min="1" max="5" step="0.5" placeholder="1-5"' +
                  ' value="' + (sM !== null ? sM : '') + '" data-key="' + key + '" data-field="score_mentor" />' +
              '</div>' +
              '<div class="eval-gi-col wide">' +
                '<label>Feedback (Mentor)</label>' +
                '<textarea class="eval-feedback-input" rows="3" placeholder="Geef feedback…"' +
                  ' data-key="' + key + '" data-field="feedback_mentor">' + esc(fM || '') + '</textarea>' +
              '</div>' +
              '<div class="eval-gi-col">' +
                '<label>Score (Docent)</label>' +
                '<input class="eval-score-input readonly" type="number" min="1" max="5" readonly value="' + (sD !== null ? sD : '') + '" />' +
              '</div>' +
              '<div class="eval-gi-col wide">' +
                '<label>Feedback (Docent)</label>' +
                '<textarea class="eval-feedback-input readonly" rows="3" readonly>' + esc(fD || '') + '</textarea>' +
              '</div>' +
              (ref
                ? '<div class="eval-student-reflectie"><div class="eval-ref-label">Student reflectie</div><div class="eval-ref-tekst">' + esc(ref) + '</div></div>'
                : '<div class="eval-student-reflectie leeg"></div>') +
            '</div>' +
          '</div>';
      });
    }
    html += '</div></div>';
    html += '<div class="eval-save-bar"><button class="btn-eval-save" id="btnEvalSave">💾 Scores opslaan</button></div>';

    el('evaluatiesContent').innerHTML = html;
    bindEvalHeaderEvents(tussentijds, eind, actief);

    el('evaluatiesContent').querySelectorAll('.eval-comp-item').forEach(function (item) {
      item.addEventListener('click', function () {
        evalState.actieveComp = parseInt(item.dataset.idx, 10);
        renderEvaluatiesInhoud();
      });
    });

    el('evaluatiesContent').querySelectorAll('[data-key]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var key = inp.dataset.key, field = inp.dataset.field;
        if (!evalState.pendingScores[key]) evalState.pendingScores[key] = {};
        evalState.pendingScores[key][field] = inp.value;
      });
    });

    el('btnEvalSave').addEventListener('click', function () { slaEvalOp(actief.id); });
  }

  function bindEvalHeaderEvents(tussentijds, eind, actief) {
    el('evaluatiesContent').querySelectorAll('.eval-subtab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        evalState.actieveSub = btn.dataset.ev;
        evalState.toonRubriek = false;
        renderEvaluatiesInhoud();
      });
    });
    var rb = el('btnBekijkRubriek');
    if (rb) rb.addEventListener('click', function () {
      evalState.toonRubriek = !evalState.toonRubriek;
      renderEvaluatiesInhoud();
    });
  }

  async function slaEvalOp(evalId) {
    var btn = el('btnEvalSave');
    btn.disabled = true; btn.textContent = 'Bezig…';

    var scoreMap = {};
    el('evaluatiesContent').querySelectorAll('[data-key]').forEach(function (inp) {
      var parts = inp.dataset.key.split('_');
      var subId = parseInt(parts[1], 10);
      var field = inp.dataset.field;
      if (!scoreMap[subId]) scoreMap[subId] = { subcompetentie_id: subId };
      var val = inp.value.trim();
      if (field === 'score_mentor') scoreMap[subId][field] = val ? parseFloat(val) : null;
      else scoreMap[subId][field] = val || null;
    });

    try {
      var res = await fetch(API_BASE + '/evaluaties/' + evalId + '/mentor-scores', {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify({ scores: Object.values(scoreMap) }),
      });
      if (!res.ok) throw new Error();
      evalState.pendingScores = {};
      evaluatiesGeladen = false;
      await laadEvaluaties();
      btn.textContent = '✓ Opgeslagen';
      setTimeout(function () { var b = el('btnEvalSave'); if (b) { b.disabled = false; b.textContent = '💾 Scores opslaan'; } }, 2000);
    } catch (e) {
      btn.disabled = false; btn.textContent = '💾 Scores opslaan';
      alert('Opslaan mislukt. Probeer opnieuw.');
    }
  }

  async function laadEvaluaties() {
    el('evaluatiesContent').innerHTML = '<div class="loading-state"><div class="spinner"></div><div>Evaluaties laden...</div></div>';
    try {
      var [evRes, rubRes] = await Promise.all([
        fetch(API_BASE + '/evaluaties/stage/' + stageId, { headers: headers }),
        fetch(API_BASE + '/competenties/stage/' + stageId, { headers: headers }),
      ]);

      var evaluatiesRaw = evRes.ok ? await evRes.json() : [];
      var rubriek       = rubRes.ok ? await rubRes.json() : [];

      // Laad detail per evaluatie (met competenties + scores)
      var evaluaties = [];
      for (var i = 0; i < evaluatiesRaw.length; i++) {
        var dRes = await fetch(API_BASE + '/evaluaties/' + evaluatiesRaw[i].id, { headers: headers });
        evaluaties.push(dRes.ok ? await dRes.json() : evaluatiesRaw[i]);
      }

      evalState.evaluaties = Array.isArray(evaluaties) ? evaluaties : [];
      evalState.rubriek    = Array.isArray(rubriek) ? rubriek.filter(function (c) { return c.subcompetenties && c.subcompetenties.length; }) : [];
      evalState.actieveComp = 0;
      rubriekData = evalState.rubriek; // cache zodat rubriek-view niet opnieuw fetcht
      evaluatiesGeladen = true;
      renderEvaluatiesInhoud();
    } catch (e) {
      el('evaluatiesContent').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Fout</div><div class="empty-text">Evaluaties konden niet worden geladen.</div></div>';
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
      window._stageTotaalWeken  = stage.totaal_weken;
      window._stageHuidigeWeek  = stage.huidige_week || 0;
      renderStage(stage);
    } catch (e) {
      el('stageContainer').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Stage niet gevonden</div><div class="empty-text">De opgevraagde stage kon niet worden geladen.</div></div>';
      el('studentNaam').textContent = 'Onbekende stagiair';
    }
  }

  laad();
})();
