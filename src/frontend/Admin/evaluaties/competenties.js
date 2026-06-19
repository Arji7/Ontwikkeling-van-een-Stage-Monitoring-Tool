(function () {

  var token = sessionStorage.getItem('token');
  if (!token) { window.location.href = '../../inloggen/inloggen.html'; return; }

  var NIVEAUS = [
    { niveau: 1, label: 'Score 1', klasse: 'rub-1' },
    { niveau: 2, label: 'Score 2', klasse: 'rub-2' },
    { niveau: 3, label: 'Score 3', klasse: 'rub-3' },
    { niveau: 4, label: 'Score 4', klasse: 'rub-4' },
    { niveau: 5, label: 'Score 5', klasse: 'rub-5' },
  ];

  var opleidingen = [];
  var huidigOplId = null;
  var competenties = [];
  var openComp = {};
  var openSub = {};
  var modalCtx = {};

  var headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  document.addEventListener('DOMContentLoaded', async function () {
    await laadOpleidingen();
    document.getElementById('zoekInput').addEventListener('input', function () { renderLijst(); });
  });

  async function laadOpleidingen() {
    try {
      var res = await fetch(API_BASE + '/admin/competenties/opleidingen', { headers: headers });
      if (!res.ok) throw new Error();
      opleidingen = await res.json();
      renderOplLijst();
      if (opleidingen.length > 0) kiesOpl(opleidingen[0].id);
    } catch (err) {
      console.error('Opleidingen laden fout:', err);
    }
  }

  async function laadCompetenties(oplId) {
    try {
      var res = await fetch(API_BASE + '/admin/competenties/opleiding/' + oplId, { headers: headers });
      if (!res.ok) throw new Error();
      competenties = await res.json();
      updatePanelHeader();
      renderLijst();
    } catch (err) {
      console.error('Competenties laden fout:', err);
      competenties = [];
      renderLijst();
    }
  }

  function renderOplLijst() {
    document.getElementById('oplCount').textContent = opleidingen.length + ' opleidingen';
    document.getElementById('oplLijst').innerHTML = opleidingen.map(function (opl) {
      var actief = opl.id === huidigOplId;
      return '<div class="opl-item' + (actief ? ' actief' : '') + '" onclick="kiesOpl(' + opl.id + ')">' +
        '<span class="opl-dot" style="background:#2563eb"></span>' +
        '<div class="opl-info">' +
          '<div class="opl-naam">' + esc(opl.naam) + '</div>' +
          '<div class="opl-meta">' + (opl.aantal_competenties || 0) + ' competenties</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  window.kiesOpl = async function (id) {
    huidigOplId = id;
    openComp = {};
    openSub = {};
    renderOplLijst();
    document.getElementById('compLeeg').style.display = 'none';
    document.getElementById('compPanel').style.display = '';
    await laadCompetenties(id);
  };

  window.openOplModal = function () {
    document.getElementById('nieuwOplNaam').value = '';
    document.getElementById('oplModal').classList.add('open');
  };

  window.voegOplToe = async function () {
    var naam = document.getElementById('nieuwOplNaam').value.trim();
    if (!naam) return;
    try {
      var res = await fetch(API_BASE + '/admin/competenties/opleidingen', {
        method: 'POST', headers: headers, body: JSON.stringify({ naam: naam })
      });
      if (!res.ok) throw new Error();
      var data = await res.json();
      sluitModal('oplModal');
      await laadOpleidingen();
      kiesOpl(data.id);
    } catch (err) { console.error('Opleiding toevoegen fout:', err); }
  };

  function updatePanelHeader() {
    var opl = opleidingen.find(function (o) { return o.id === huidigOplId; });
    if (!opl) return;
    document.getElementById('compPanelNaam').textContent = opl.naam;
    document.getElementById('compPanelSub').textContent = competenties.length + ' competenties';
    document.getElementById('compStatAantal').textContent = competenties.length;
    var gwEl = document.getElementById('compStatGewicht');
    if (gwEl) gwEl.textContent = '—';
  }

  function renderLijst() {
    var zoek = (document.getElementById('zoekInput').value || '').toLowerCase();
    var gefilterd = competenties.filter(function (c) {
      return !zoek || (c.omschrijving || '').toLowerCase().includes(zoek);
    });

    var html = gefilterd.length === 0
      ? '<div class="comp-leeg-rij">Geen competenties gevonden.</div>'
      : gefilterd.map(renderCompItem).join('');

    document.getElementById('compLijst').innerHTML = html;
  }

  function renderCompItem(c) {
    var isOpen = !!openComp[c.id];
    var nSubs = (c.subcompetenties || []).length;

    var subsHtml = '';
    if (isOpen) {
      var subItems = (c.subcompetenties || []).map(function (s) {
        return renderSubItem(c.id, s);
      }).join('');
      subsHtml =
        '<div class="sub-blok">' +
          (subItems || '<div class="sub-leeg">Nog geen subcompetenties.</div>') +
          '<button class="btn-sub-toevoegen" onclick="openModalSub(null,' + c.id + ')">+ Subcompetentie toevoegen</button>' +
        '</div>';
    }

    return '<div class="comp-item">' +
      '<div class="comp-rij" onclick="toggleComp(' + c.id + ')">' +
        '<span class="comp-chevron' + (isOpen ? ' open' : '') + '">&#9654;</span>' +
        '<div class="comp-tekst">' +
          '<div class="comp-naam">' + esc(c.omschrijving) + '</div>' +
          '<div class="comp-meta">' + (nSubs === 0 ? 'Geen subcompetenties' : nSubs + ' subcompetentie' + (nSubs === 1 ? '' : 's')) + '</div>' +
        '</div>' +
        '<div class="comp-acties" onclick="event.stopPropagation()">' +
          '<button class="btn-actie" title="Bewerken" onclick="openModalComp(' + c.id + ')">&#9998;</button>' +
          '<button class="btn-actie danger" title="Verwijderen" onclick="verwijderComp(' + c.id + ')">&#128465;</button>' +
        '</div>' +
      '</div>' +
      subsHtml +
    '</div>';
  }

  function renderSubItem(compId, s) {
    var isOpen = !!openSub[s.id];
    var nRub = (s.rubriek || []).length;

    var rubHtml = '';
    if (isOpen) {
      rubHtml = '<div class="rubriek-blok">' + renderRubriek(compId, s) + '</div>';
    }

    return '<div class="sub-item">' +
      '<div class="sub-rij" onclick="toggleSub(' + s.id + ')">' +
        '<span class="sub-chevron' + (isOpen ? ' open' : '') + '">&#9654;</span>' +
        '<span class="sub-code-badge">' + esc(s.code || '') + '</span>' +
        '<div class="sub-tekst">' +
          '<div class="sub-naam">' + esc(s.omschrijving) + '</div>' +
          '<div class="sub-meta">' + (nRub === 0 ? 'Rubriek nog niet ingevuld' : 'Rubriek: ' + nRub + ' niveaus ingevuld') + '</div>' +
        '</div>' +
        '<div class="sub-acties" onclick="event.stopPropagation()">' +
          '<button class="btn-actie sm" title="Bewerken" onclick="openModalSub(' + s.id + ',' + compId + ')">&#9998;</button>' +
          '<button class="btn-actie sm danger" title="Verwijderen" onclick="verwijderSub(' + compId + ',' + s.id + ')">&#128465;</button>' +
        '</div>' +
      '</div>' +
      rubHtml +
    '</div>';
  }

  function renderRubriek(compId, s) {
    var rubMap = {};
    (s.rubriek || []).forEach(function (r) { rubMap[r.niveau] = r; });

    var cellen = NIVEAUS.map(function (n) {
      var r = rubMap[n.niveau];
      return '<td class="rub-cel">' +
        '<div class="rub-header ' + n.klasse + '">' + n.label + '</div>' +
        '<div class="rub-body">' + esc(r ? r.beschrijving : '') + '</div>' +
        '<button class="btn-rub-edit" onclick="openModalRubriek(' + compId + ',' + s.id + ',' + n.niveau + ')">&#9998; Bewerken</button>' +
      '</td>';
    }).join('');

    return '<table class="rubriek-tabel"><colgroup><col><col><col><col><col></colgroup><tbody><tr>' + cellen + '</tr></tbody></table>';
  }

  window.toggleComp = function (id) { openComp[id] = !openComp[id]; renderLijst(); };
  window.toggleSub = function (id) { openSub[id] = !openSub[id]; renderLijst(); };

  window.verwijderComp = async function (compId) {
    if (!confirm('Competentie verwijderen?')) return;
    try {
      await fetch(API_BASE + '/admin/competenties/' + compId, { method: 'DELETE', headers: headers });
      await laadCompetenties(huidigOplId);
      await laadOpleidingen();
    } catch (err) { console.error('Verwijderen fout:', err); }
  };

  window.verwijderSub = async function (compId, subId) {
    if (!confirm('Subcompetentie verwijderen?')) return;
    try {
      await fetch(API_BASE + '/admin/competenties/sub/' + subId, { method: 'DELETE', headers: headers });
      await laadCompetenties(huidigOplId);
    } catch (err) { console.error('Verwijderen fout:', err); }
  };

  window.sluitModal = function (id) { document.getElementById(id).classList.remove('open'); };

  window.openModalComp = function (compId) {
    var comp = compId !== null ? competenties.find(function (c) { return c.id === compId; }) : null;
    modalCtx = { type: 'comp', compId: compId };
    document.getElementById('modalTitel').textContent = comp ? 'Competentie bewerken' : 'Competentie toevoegen';
    document.getElementById('modalCode').value = '';
    document.getElementById('modalOmschrijving').value = comp ? comp.omschrijving : '';
    var gw = document.getElementById('modalGewicht');
    if (gw) gw.value = 10;
    var gwWrap = document.getElementById('modalGewichtWrap');
    if (gwWrap) gwWrap.style.display = 'none';
    document.getElementById('compModal').classList.add('open');
  };

  window.openModalSub = function (subId, compId) {
    var comp = competenties.find(function (c) { return c.id === compId; });
    if (!comp) return;
    var sub = subId !== null ? (comp.subcompetenties || []).find(function (s) { return s.id === subId; }) : null;
    modalCtx = { type: 'sub', compId: compId, subId: subId };
    document.getElementById('modalTitel').textContent = sub ? 'Subcompetentie bewerken' : 'Subcompetentie toevoegen';
    document.getElementById('modalCode').value = sub ? (sub.code || '') : '';
    document.getElementById('modalOmschrijving').value = sub ? sub.omschrijving : '';
    var gwWrap = document.getElementById('modalGewichtWrap');
    if (gwWrap) gwWrap.style.display = 'none';
    document.getElementById('compModal').classList.add('open');
  };

  window.openModalRubriek = function (compId, subId, niveau) {
    var comp = competenties.find(function (c) { return c.id === compId; }); if (!comp) return;
    var sub = (comp.subcompetenties || []).find(function (s) { return s.id === subId; }); if (!sub) return;
    var rub = (sub.rubriek || []).find(function (r) { return r.niveau === niveau; });
    var niv = NIVEAUS.find(function (n) { return n.niveau === niveau; });
    modalCtx = { type: 'rubriek', compId: compId, subId: subId, niveau: niveau };
    document.getElementById('rubModalTitel').textContent = 'Rubriek bewerken';
    document.getElementById('rubNiveauBadge').textContent = niv ? niv.label : '';
    document.getElementById('rubNiveauBadge').className = 'rub-niveau-badge ' + (niv ? niv.klasse : '');
    document.getElementById('rubModalBeschrijving').value = rub ? rub.beschrijving : '';
    document.getElementById('rubModal').classList.add('open');
  };

  window.slaanOp = async function () {
    var code = document.getElementById('modalCode').value.trim();
    var omschr = document.getElementById('modalOmschrijving').value.trim();
    if (!omschr) return;

    try {
      if (modalCtx.type === 'comp') {
        if (modalCtx.compId !== null) {
          await fetch(API_BASE + '/admin/competenties/' + modalCtx.compId, {
            method: 'PUT', headers: headers, body: JSON.stringify({ omschrijving: omschr })
          });
        } else {
          await fetch(API_BASE + '/admin/competenties', {
            method: 'POST', headers: headers,
            body: JSON.stringify({ opleiding_id: huidigOplId, omschrijving: omschr })
          });
        }
      } else if (modalCtx.type === 'sub') {
        if (modalCtx.subId !== null) {
          await fetch(API_BASE + '/admin/competenties/sub/' + modalCtx.subId, {
            method: 'PUT', headers: headers, body: JSON.stringify({ code: code, omschrijving: omschr })
          });
        } else {
          await fetch(API_BASE + '/admin/competenties/' + modalCtx.compId + '/subcompetenties', {
            method: 'POST', headers: headers, body: JSON.stringify({ code: code, omschrijving: omschr })
          });
        }
      }
      sluitModal('compModal');
      await laadCompetenties(huidigOplId);
      await laadOpleidingen();
    } catch (err) { console.error('Opslaan fout:', err); }
  };

  window.slaanRubOp = async function () {
    var beschrijving = document.getElementById('rubModalBeschrijving').value.trim();
    try {
      await fetch(API_BASE + '/admin/competenties/sub/' + modalCtx.subId + '/niveau/' + modalCtx.niveau, {
        method: 'PUT', headers: headers, body: JSON.stringify({ beschrijving: beschrijving })
      });
      sluitModal('rubModal');
      await laadCompetenties(huidigOplId);
    } catch (err) { console.error('Rubriek opslaan fout:', err); }
  };

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
