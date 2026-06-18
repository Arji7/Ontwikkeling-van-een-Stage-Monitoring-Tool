(function () {
  var user    = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  var token   = sessionStorage.getItem('token');
  var el      = function (id) { return document.getElementById(id); };
  var headers = { 'Authorization': 'Bearer ' + token };

  el('userName').textContent   = user.name || '...';
  el('userAvatar').textContent = (user.name || '??').split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

  var params    = new URLSearchParams(window.location.search);
  var logboekId = params.get('logboek_id');
  var stageId   = params.get('stage_id');

  if (!logboekId || !stageId) { history.back(); return; }

  var detailUrl = 'stagiair-detail.html?stage_id=' + stageId;
  el('bcLogboeken').href = detailUrl + '#logboeken';
  el('bcStudent').href   = detailUrl;

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function fmt(d, opts) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('nl-BE', opts || {day:'numeric', month:'long', year:'numeric'});
  }

  function dagNaam(datum) {
    if (!datum) return '—';
    return new Date(datum).toLocaleDateString('nl-BE', {weekday:'long'});
  }

  function dagNaamKort(datum) {
    if (!datum) return '—';
    return new Date(datum).toLocaleDateString('nl-BE', {day:'numeric', month:'long'});
  }

  function locatieIcoon(loc) {
    if (!loc) return '';
    if (loc.toLowerCase().includes('thuis')) return '🏠 Thuiswerk';
    return '📍 Op kantoor';
  }

  function renderLogboek(lb, studentNaam) {
    el('bcStudent').textContent = studentNaam;
    el('bcWeek').textContent    = 'Week ' + lb.week_nummer;

    var isAfgecheckt = lb.status === 'goedgekeurd';
    var totaalUren   = lb.totaal_uren || (lb.dagen || []).reduce(function (s, d) { return s + (d.uren_gewerkt || 0); }, 0);
    var aantalDagen  = (lb.dagen || []).length;

    var html =
      '<h1 class="lb-detail-title">Logboek week ' + lb.week_nummer + '</h1>' +
      '<div class="lb-detail-sub">' +
        (lb.datum_van ? fmt(lb.datum_van, {day:'numeric',month:'long'}) + ' – ' + fmt(lb.datum_tot, {day:'numeric',month:'long',year:'numeric'}) : '') +
        (lb.ingediend_op ? ' · ingediend op ' + fmt(lb.ingediend_op, {day:'numeric',month:'short'}) + ' ' + new Date(lb.ingediend_op).toLocaleTimeString('nl-BE', {hour:'2-digit',minute:'2-digit'}) : '') +
      '</div>' +

      '<div class="lb-summary-bar">' +
        '<div class="lb-summary-item"><label>Periode</label><span>' + (lb.datum_van ? fmt(lb.datum_van,{day:'numeric',month:'short'}) + '–' + fmt(lb.datum_tot,{day:'numeric',month:'short'}) : '—') + '</span></div>' +
        '<div class="lb-summary-item"><label>Totaal uren</label><span>' + totaalUren + '</span></div>' +
        '<div class="lb-summary-item"><label>Dagen aanwezig</label><span>' + aantalDagen + '/5</span></div>' +
      '</div>';

    // Dagrapporten
    if (lb.dagen && lb.dagen.length > 0) {
      html += '<div class="sectie-card"><div class="dag-sectie-titel">📅 Dagrapporten van deze week</div>';
      lb.dagen.forEach(function (dag) {
        var competenties = [];
        if (dag.competentie_ids) {
          try { competenties = JSON.parse(dag.competentie_ids); } catch(e) {}
        }
        // competenties van het logboek zelf tonen per dag als er geen dag-competenties zijn
        var tagsHtml = '';
        if (lb.competenties && lb.competenties.length > 0) {
          lb.competenties.forEach(function (c) {
            tagsHtml += '<span class="dag-tag">' + esc(c.naam) + '</span>';
          });
        }

        html +=
          '<div class="dag-kaart">' +
            '<div class="dag-naam-blok">' +
              '<div class="dag-naam">' + esc(dagNaam(dag.datum)) + '</div>' +
              '<div class="dag-datum">' + esc(dagNaamKort(dag.datum)) + '</div>' +
            '</div>' +
            '<div class="dag-uren-cirkel">' + (dag.uren_gewerkt||0) + 'u</div>' +
            '<div class="dag-inhoud">' +
              '<div class="dag-beschrijving">' + esc(dag.activiteiten || dag.beschrijving || dag.uitgevoerde_taken || '—') + '</div>' +
              (tagsHtml ? '<div class="dag-tags">' + tagsHtml + '</div>' : '') +
            '</div>' +
            '<div class="dag-locatie">' + locatieIcoon(dag.locatie) + '</div>' +
          '</div>';
      });
      html += '</div>';
    }

    // Wekelijkse reflectie
    if (lb.uitgevoerde_taken || lb.leerpunten) {
      html +=
        '<div class="reflectie-sectie">' +
          '<h3>📝 Wekelijkse reflectie van ' + esc((lb.student_voornaam || studentNaam.split(' ')[0] || 'Student')) + '</h3>' +
          (lb.uitgevoerde_taken ? '<div class="reflectie-blok"><div class="reflectie-label">Reflectie</div><div class="reflectie-tekst">' + esc(lb.uitgevoerde_taken) + '</div></div>' : '') +
          (lb.leerpunten ? '<div class="reflectie-blok"><div class="reflectie-label">Problemen en leerpunten</div><div class="reflectie-tekst">' + esc(lb.leerpunten) + '</div></div>' : '') +
        '</div>';
    }

    // Bestaande reacties tonen
    var reactiesHtml = '';
    if (lb.reacties && lb.reacties.length > 0) {
      lb.reacties.forEach(function (r) {
        reactiesHtml += '<div class="opmerking-bestaand"><strong>' + esc((r.voornaam||'') + ' ' + (r.achternaam||'')) + '</strong><br>' + esc(r.reactie) + '</div>';
      });
    }

    // Opmerking & aftekenen sectie
    html +=
      '<div class="opmerking-sectie">' +
        '<h3>💬 Opmerking (stagementor)</h3>' +
        reactiesHtml +
        (isAfgecheckt
          ? '<div class="al-afgecheckt">✓ Dit logboek is door jou afgecheckt</div>'
          : '<textarea class="opmerking-textarea" id="opmerkingText" placeholder="Schrijf hier een opmerking voor de student (optioneel)…"></textarea>' +
            '<div class="opmerking-actions">' +
              '<button class="btn-opmerking" id="btnOpmerking">Opmerking plaatsen</button>' +
              '<button class="btn-aftekenen" id="btnAftekenen">✓ Aftekenen</button>' +
            '</div>'
        ) +
      '</div>';

    el('mainContent').innerHTML = html;

    if (!isAfgecheckt) {
      el('btnAftekenen').addEventListener('click', function () { aftekenen(); });
      el('btnOpmerking').addEventListener('click', function () { plaatsOpmerking(); });
    }
  }

  async function aftekenen() {
    var btn     = el('btnAftekenen');
    var tekst   = el('opmerkingText') ? el('opmerkingText').value.trim() : '';
    btn.disabled    = true;
    btn.textContent = 'Bezig…';
    try {
      var res = await fetch(API_BASE + '/logboeken/' + logboekId + '/goedkeuren', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify({ mentor_feedback: tekst || null }),
      });
      if (!res.ok) throw new Error();
      // Herlaad de pagina om de nieuwe status te tonen
      window.location.reload();
    } catch (e) {
      btn.disabled    = false;
      btn.textContent = '✓ Aftekenen';
      alert('Er ging iets mis bij het aftekenen. Probeer opnieuw.');
    }
  }

  async function plaatsOpmerking() {
    var tekst = el('opmerkingText') ? el('opmerkingText').value.trim() : '';
    if (!tekst) { el('opmerkingText').focus(); return; }
    var btn = el('btnOpmerking');
    btn.disabled    = true;
    btn.textContent = 'Bezig…';
    try {
      var res = await fetch(API_BASE + '/logboeken/' + logboekId + '/reactie', {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify({ reactie: tekst }),
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch (e) {
      btn.disabled    = false;
      btn.textContent = 'Opmerking plaatsen';
      alert('Opmerking plaatsen mislukt. Probeer opnieuw.');
    }
  }

  async function laad() {
    try {
      var [lbRes, stageRes] = await Promise.all([
        fetch(API_BASE + '/logboeken/' + logboekId, { headers: headers }),
        fetch(API_BASE + '/stages/' + stageId,      { headers: headers }),
      ]);

      if (!lbRes.ok) throw new Error('Logboek niet gevonden');
      var lb    = await lbRes.json();
      var stage = stageRes.ok ? await stageRes.json() : {};

      var studentNaam = ((stage.student_voornaam||'') + ' ' + (stage.student_achternaam||'')).trim() || 'Student';
      el('bcStudent').textContent = studentNaam;

      renderLogboek(lb, studentNaam);
    } catch (e) {
      el('mainContent').innerHTML =
        '<div class="empty-state"><div class="empty-icon">⚠️</div>' +
        '<div class="empty-title">Logboek niet gevonden</div>' +
        '<div class="empty-text">Het logboek kon niet worden geladen.</div></div>';
    }
  }

  laad();
})();
