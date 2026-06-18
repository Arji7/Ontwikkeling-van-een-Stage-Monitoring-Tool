(function () {

  var nextId = 500;
  function uid() { return nextId++; }

  var NIVEAUS = [
    { niveau: 1, label: 'Score 1', klasse: 'rub-1' },
    { niveau: 2, label: 'Score 2', klasse: 'rub-2' },
    { niveau: 3, label: 'Score 3', klasse: 'rub-3' },
    { niveau: 4, label: 'Score 4', klasse: 'rub-4' },
    { niveau: 5, label: 'Score 5', klasse: 'rub-5' },
  ];

  var opleidingen = [
    {
      id: 1, naam: 'Toegepaste Informatica', kleur: '#2563eb',
      competenties: [
        {
          id: 1, code: 'D1', gewicht: 15,
          omschrijving: 'De lerende professional beheerst het volledige project- of operationeel planningsproces',
          subcompetenties: [
            {
              id: 101, code: 'D1.1',
              omschrijving: 'Projectplanning opstellen en bewaken',
              rubriek: [
                { niveau: 1, label: 'Score 1', beschrijving: 'Kan geen realistische planning opstellen.' },
                { niveau: 2, label: 'Score 2', beschrijving: 'Stelt een basisplanning op met begeleiding.' },
                { niveau: 3, label: 'Score 3', beschrijving: 'Stelt een planning op maar bewaakt de voortgang onvoldoende.' },
                { niveau: 4, label: 'Score 4', beschrijving: 'Stelt zelfstandig een gedetailleerde planning op en bewaakt de voortgang.' },
                { niveau: 5, label: 'Score 5', beschrijving: 'Anticipeert op risico\'s en past de planning proactief aan.' },
              ]
            },
            {
              id: 102, code: 'D1.2',
              omschrijving: 'Voortgang rapporteren aan stakeholders',
              rubriek: [
                { niveau: 1, label: 'Score 1', beschrijving: 'Rapporteert niet of nauwelijks.' },
                { niveau: 2, label: 'Score 2', beschrijving: 'Rapporteert enkel op vraag met basisinformatie.' },
                { niveau: 3, label: 'Score 3', beschrijving: 'Rapporteert occasioneel maar niet altijd helder.' },
                { niveau: 4, label: 'Score 4', beschrijving: 'Rapporteert regelmatig helder en gestructureerd.' },
                { niveau: 5, label: 'Score 5', beschrijving: 'Communiceert proactief met alle stakeholders op maat van het publiek.' },
              ]
            },
          ]
        },
        {
          id: 2, code: 'D2', gewicht: 12,
          omschrijving: 'De lerende professional ontwerpt IT-oplossingen volgens de industriestandaarden',
          subcompetenties: [
            {
              id: 201, code: 'D2.1',
              omschrijving: 'Technisch ontwerp documenteren conform standaarden',
              rubriek: [
                { niveau: 1, label: 'Score 1', beschrijving: 'Ontwerp is onvolledig of ontbreekt.' },
                { niveau: 2, label: 'Score 2', beschrijving: 'Basisontwerp aanwezig maar niet conform standaarden.' },
                { niveau: 3, label: 'Score 3', beschrijving: 'Ontwerp gedeeltelijk conform standaarden.' },
                { niveau: 4, label: 'Score 4', beschrijving: 'Ontwerp conform industriestandaarden en goed gedocumenteerd.' },
                { niveau: 5, label: 'Score 5', beschrijving: 'Ontwerp is innovatief, volledig conform standaarden en uitstekend gedocumenteerd.' },
              ]
            },
          ]
        },
        { id: 3, code: 'D3', gewicht: 12, omschrijving: 'De lerende professional implementeert digitale producten in een professionele omgeving', subcompetenties: [] },
        { id: 4, code: 'D4', gewicht: 10, omschrijving: 'De lerende professional integreert technologie en infrastructuur binnen een professionele omgeving', subcompetenties: [] },
        { id: 5, code: 'D5', gewicht: 8,  omschrijving: 'De lerende professional hanteert een onderzoekende houding om tot innovatieve oplossingen te komen', subcompetenties: [] },
        { id: 6, code: 'D6', gewicht: 8,  omschrijving: 'De lerende professional communiceert helder en transparant in een professionele omgeving en/of in teamverband', subcompetenties: [] },
        { id: 7, code: 'D7', gewicht: 8,  omschrijving: 'De lerende professional denkt kritisch na om problemen efficiënt en effectief op te lossen', subcompetenties: [] },
        { id: 8, code: 'D8', gewicht: 8,  omschrijving: 'De lerende professional ziet persoonlijke ontwikkeling als de basis voor professionele groei', subcompetenties: [] },
        { id: 9, code: 'D9', gewicht: 7,  omschrijving: 'De lerende professional ontwikkelt een professionele attitude en handelt kwaliteitsvol', subcompetenties: [] },
        { id: 10, code: 'D10', gewicht: 6, omschrijving: 'De lerende professional demonstreert ondernemend handelen in functie van waardecreatie', subcompetenties: [] },
        { id: 11, code: 'D11', gewicht: 6, omschrijving: 'De lerende professional werkt duurzaam en maatschappelijk verantwoord', subcompetenties: [] },
      ]
    },
    {
      id: 2, naam: 'Elektromechanica', kleur: '#15803d',
      competenties: [
        { id: 50, code: 'E1', gewicht: 20, omschrijving: 'De lerende professional past mechanische principes toe in een industriële omgeving', subcompetenties: [] },
        {
          id: 51, code: 'E2', gewicht: 18,
          omschrijving: 'De lerende professional werkt veilig en conform de geldende veiligheidsnormen',
          subcompetenties: [
            {
              id: 511, code: 'E2.1', omschrijving: 'ATEX-regelgeving kennen en toepassen',
              rubriek: [
                { niveau: 1, label: 'Score 1', beschrijving: 'Kent de ATEX-regelgeving niet.' },
                { niveau: 2, label: 'Score 2', beschrijving: 'Kent de basisregels maar past ze niet consequent toe.' },
                { niveau: 3, label: 'Score 3', beschrijving: 'Past de regelgeving toe met occasionele fouten.' },
                { niveau: 4, label: 'Score 4', beschrijving: 'Past ATEX-regelgeving correct en consistent toe.' },
                { niveau: 5, label: 'Score 5', beschrijving: 'Past toe en adviseert collega\'s proactief over ATEX-veiligheid.' },
              ]
            },
            {
              id: 512, code: 'E2.2', omschrijving: 'Persoonlijke beschermingsmiddelen correct gebruiken',
              rubriek: []
            },
          ]
        },
        { id: 52, code: 'E3', gewicht: 15, omschrijving: 'De lerende professional voert elektrotechnische installaties uit en controleert ze', subcompetenties: [] },
        { id: 53, code: 'E4', gewicht: 12, omschrijving: 'De lerende professional interpreteert technische tekeningen en schema\'s', subcompetenties: [] },
        { id: 54, code: 'E5', gewicht: 12, omschrijving: 'De lerende professional voert preventief en correctief onderhoud uit', subcompetenties: [] },
        { id: 55, code: 'E6', gewicht: 10, omschrijving: 'De lerende professional communiceert technisch correct met collega\'s en leidinggevenden', subcompetenties: [] },
        { id: 56, code: 'E7', gewicht: 8,  omschrijving: 'De lerende professional werkt nauwkeurig en kwaliteitsgericht', subcompetenties: [] },
        { id: 57, code: 'E8', gewicht: 5,  omschrijving: 'De lerende professional toont initiatief en leervermogen in een professionele context', subcompetenties: [] },
      ]
    },
    {
      id: 3, naam: 'Marketing', kleur: '#b45309',
      competenties: [
        { id: 80, code: 'M1', gewicht: 18, omschrijving: 'De lerende professional analyseert markten en doelgroepen op basis van data', subcompetenties: [] },
        { id: 81, code: 'M2', gewicht: 15, omschrijving: 'De lerende professional ontwikkelt en implementeert marketingcampagnes', subcompetenties: [] },
        { id: 82, code: 'M3', gewicht: 13, omschrijving: 'De lerende professional beheert sociale media en digitale kanalen professioneel', subcompetenties: [] },
        { id: 83, code: 'M4', gewicht: 12, omschrijving: 'De lerende professional communiceert overtuigend naar interne en externe stakeholders', subcompetenties: [] },
        { id: 84, code: 'M5', gewicht: 10, omschrijving: 'De lerende professional werkt samen in multidisciplinaire projectteams', subcompetenties: [] },
        { id: 85, code: 'M6', gewicht: 10, omschrijving: 'De lerende professional meet en rapporteert marketingresultaten via KPI\'s', subcompetenties: [] },
        { id: 86, code: 'M7', gewicht: 12, omschrijving: 'De lerende professional toont commercieel inzicht en ondernemerszin', subcompetenties: [] },
        { id: 87, code: 'M8', gewicht: 10, omschrijving: 'De lerende professional handelt ethisch en maatschappelijk verantwoord', subcompetenties: [] },
        { id: 88, code: 'M9', gewicht: 10, omschrijving: 'De lerende professional past creatief denken toe in het ontwerpen van merkidentiteit', subcompetenties: [] },
      ]
    },
  ];

  /* ── STATE ──────────────────────────────────────────────── */
  var huidigOplId = null;
  var openComp    = {};
  var openSub     = {};
  var modalCtx    = {};

  /* ── INIT ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    renderOplLijst();
    kiesOpl(1);

    document.getElementById('zoekInput').addEventListener('input', function () {
      renderLijst();
    });
  });

  /* ── HELPER: huidig opl object ──────────────────────────── */
  function huidigOpl() {
    return opleidingen.find(function (o) { return o.id === huidigOplId; });
  }

  /* ── OPLEIDINGEN ────────────────────────────────────────── */
  function renderOplLijst() {
    document.getElementById('oplCount').textContent = opleidingen.length + ' opleidingen';
    document.getElementById('oplLijst').innerHTML = opleidingen.map(function (opl) {
      var totW   = opl.competenties.reduce(function (s, c) { return s + c.gewicht; }, 0);
      var actief = opl.id === huidigOplId;
      return '<div class="opl-item' + (actief ? ' actief' : '') + '" onclick="kiesOpl(' + opl.id + ')">' +
        '<span class="opl-dot" style="background:' + opl.kleur + '"></span>' +
        '<div class="opl-info">' +
          '<div class="opl-naam">' + esc(opl.naam) + '</div>' +
          '<div class="opl-meta">' + opl.competenties.length + ' competenties · ' + totW + '%</div>' +
        '</div>' +
        '<span class="opl-check' + (totW !== 100 ? ' oranje' : '') + '">' + (totW === 100 ? '✓' : '○') + '</span>' +
      '</div>';
    }).join('');
  }

  window.kiesOpl = function (id) {
    huidigOplId = id;
    openComp    = {};
    openSub     = {};
    renderOplLijst();
    updatePanelHeader();
    renderLijst();
    document.getElementById('compLeeg').style.display  = 'none';
    document.getElementById('compPanel').style.display = '';
  };

  window.openOplModal = function () {
    document.getElementById('nieuwOplNaam').value = '';
    document.getElementById('oplModal').classList.add('open');
  };

  window.voegOplToe = function () {
    var naam = document.getElementById('nieuwOplNaam').value.trim();
    if (!naam) return;
    var newId = Math.max.apply(null, opleidingen.map(function (o) { return o.id; })) + 1;
    opleidingen.push({ id: newId, naam: naam, kleur: '#6d28d9', competenties: [] });
    sluitModal('oplModal');
    kiesOpl(newId);
  };

  /* ── PANEL HEADER (statisch updaten) ────────────────────── */
  function updatePanelHeader() {
    var opl = huidigOpl(); if (!opl) return;
    var totW = opl.competenties.reduce(function (s, c) { return s + c.gewicht; }, 0);
    document.getElementById('compPanelNaam').textContent = opl.naam;
    document.getElementById('compPanelSub').textContent  = 'Academiejaar 2025–26 · ' + opl.competenties.length + ' competenties';
    document.getElementById('compStatAantal').textContent = opl.competenties.length;
    var gwEl = document.getElementById('compStatGewicht');
    gwEl.textContent = totW + '%';
    gwEl.className   = 'comp-stat-val' + (totW === 100 ? ' groen' : '');
  }

  /* ── LIJST RENDEREN (enkel compLijst div) ───────────────── */
  function renderLijst() {
    var opl = huidigOpl(); if (!opl) return;
    var zoek = (document.getElementById('zoekInput').value || '').toLowerCase();

    var gefilterd = opl.competenties.filter(function (c) {
      return !zoek || c.omschrijving.toLowerCase().includes(zoek) || c.code.toLowerCase().includes(zoek);
    });

    var html = gefilterd.length === 0
      ? '<div class="comp-leeg-rij">Geen competenties gevonden.</div>'
      : gefilterd.map(renderCompItem).join('');

    document.getElementById('compLijst').innerHTML = html;
  }

  /* ── NIVEAU 1: COMPETENTIE ──────────────────────────────── */
  function renderCompItem(c) {
    var isOpen = !!openComp[c.id];
    var nSubs  = (c.subcompetenties || []).length;

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
        '<span class="comp-chevron' + (isOpen ? ' open' : '') + '">▶</span>' +
        '<span class="comp-code-badge">' + esc(c.code) + '</span>' +
        '<div class="comp-tekst">' +
          '<div class="comp-naam">' + esc(c.omschrijving) + '</div>' +
          '<div class="comp-meta">' + (nSubs === 0 ? 'Geen subcompetenties' : nSubs + ' subcompetentie' + (nSubs === 1 ? '' : 's')) + '</div>' +
        '</div>' +
        '<span class="gewicht-chip">' + c.gewicht + '%</span>' +
        '<div class="comp-acties" onclick="event.stopPropagation()">' +
          '<button class="btn-actie" title="Bewerken" onclick="openModalComp(' + c.id + ')">✏️</button>' +
          '<button class="btn-actie danger" title="Verwijderen" onclick="verwijderComp(' + c.id + ')">🗑</button>' +
        '</div>' +
      '</div>' +
      subsHtml +
    '</div>';
  }

  /* ── NIVEAU 2: SUBCOMPETENTIE ───────────────────────────── */
  function renderSubItem(compId, s) {
    var isOpen = !!openSub[s.id];
    var nRub   = (s.rubriek || []).length;

    var rubHtml = '';
    if (isOpen) {
      rubHtml = '<div class="rubriek-blok">' + renderRubriek(compId, s) + '</div>';
    }

    return '<div class="sub-item">' +
      '<div class="sub-rij" onclick="toggleSub(' + s.id + ')">' +
        '<span class="sub-chevron' + (isOpen ? ' open' : '') + '">▶</span>' +
        '<span class="sub-code-badge">' + esc(s.code) + '</span>' +
        '<div class="sub-tekst">' +
          '<div class="sub-naam">' + esc(s.omschrijving) + '</div>' +
          '<div class="sub-meta">' + (nRub === 0 ? 'Rubriek nog niet ingevuld' : 'Rubriek: ' + nRub + ' niveaus ingevuld') + '</div>' +
        '</div>' +
        '<div class="sub-acties" onclick="event.stopPropagation()">' +
          '<button class="btn-actie sm" title="Bewerken" onclick="openModalSub(' + s.id + ',' + compId + ')">✏️</button>' +
          '<button class="btn-actie sm danger" title="Verwijderen" onclick="verwijderSub(' + compId + ',' + s.id + ')">🗑</button>' +
        '</div>' +
      '</div>' +
      rubHtml +
    '</div>';
  }

  /* ── NIVEAU 3: RUBRIEK TABEL ────────────────────────────── */
  function renderRubriek(compId, s) {
    var rubMap = {};
    (s.rubriek || []).forEach(function (r) { rubMap[r.niveau] = r; });

    var cellen = NIVEAUS.map(function (n) {
      var r = rubMap[n.niveau];
      return '<td class="rub-cel">' +
        '<div class="rub-header ' + n.klasse + '">' + n.label + '</div>' +
        '<div class="rub-body">' + esc(r ? r.beschrijving : '') + '</div>' +
        '<button class="btn-rub-edit" onclick="openModalRubriek(' + compId + ',' + s.id + ',' + n.niveau + ')">✏️ Bewerken</button>' +
      '</td>';
    }).join('');

    return '<table class="rubriek-tabel">' +
      '<colgroup><col><col><col><col><col></colgroup>' +
      '<tbody><tr>' + cellen + '</tr></tbody>' +
    '</table>';
  }

  /* ── TOGGLES ────────────────────────────────────────────── */
  window.toggleComp = function (id) {
    openComp[id] = !openComp[id];
    renderLijst();
  };

  window.toggleSub = function (id) {
    openSub[id] = !openSub[id];
    renderLijst();
  };

  /* ── VERWIJDEREN ────────────────────────────────────────── */
  window.verwijderComp = function (compId) {
    var opl = huidigOpl(); if (!opl) return;
    if (!confirm('Competentie verwijderen?')) return;
    opl.competenties = opl.competenties.filter(function (c) { return c.id !== compId; });
    updatePanelHeader();
    renderOplLijst();
    renderLijst();
  };

  window.verwijderSub = function (compId, subId) {
    var opl  = huidigOpl(); if (!opl) return;
    var comp = opl.competenties.find(function (c) { return c.id === compId; }); if (!comp) return;
    if (!confirm('Subcompetentie verwijderen?')) return;
    comp.subcompetenties = comp.subcompetenties.filter(function (s) { return s.id !== subId; });
    renderLijst();
  };

  /* ── MODALS ─────────────────────────────────────────────── */

  window.sluitModal = function (id) {
    document.getElementById(id).classList.remove('open');
  };

  /* Competentie modal */
  window.openModalComp = function (compId) {
    var opl  = huidigOpl(); if (!opl) return;
    var comp = compId !== null ? opl.competenties.find(function (c) { return c.id === compId; }) : null;
    modalCtx = { type: 'comp', compId: compId };

    document.getElementById('modalTitel').textContent       = comp ? 'Competentie bewerken' : 'Competentie toevoegen';
    document.getElementById('modalCode').value              = comp ? comp.code : '';
    document.getElementById('modalOmschrijving').value      = comp ? comp.omschrijving : '';
    document.getElementById('modalGewicht').value           = comp ? comp.gewicht : 10;
    document.getElementById('modalGewichtWrap').style.display = '';
    document.getElementById('compModal').classList.add('open');
  };

  /* Subcompetentie modal */
  window.openModalSub = function (subId, compId) {
    var opl  = huidigOpl(); if (!opl) return;
    var comp = opl.competenties.find(function (c) { return c.id === compId; }); if (!comp) return;
    var sub  = subId !== null ? comp.subcompetenties.find(function (s) { return s.id === subId; }) : null;
    modalCtx = { type: 'sub', compId: compId, subId: subId };

    document.getElementById('modalTitel').textContent       = sub ? 'Subcompetentie bewerken' : 'Subcompetentie toevoegen';
    document.getElementById('modalCode').value              = sub ? sub.code : '';
    document.getElementById('modalOmschrijving').value      = sub ? sub.omschrijving : '';
    document.getElementById('modalGewichtWrap').style.display = 'none';
    document.getElementById('compModal').classList.add('open');
  };

  /* Rubriek modal */
  window.openModalRubriek = function (compId, subId, niveau) {
    var opl  = huidigOpl(); if (!opl) return;
    var comp = opl.competenties.find(function (c) { return c.id === compId; }); if (!comp) return;
    var sub  = comp.subcompetenties.find(function (s) { return s.id === subId; }); if (!sub) return;
    var rub  = (sub.rubriek || []).find(function (r) { return r.niveau === niveau; });
    var niv  = NIVEAUS.find(function (n) { return n.niveau === niveau; });
    modalCtx = { type: 'rubriek', compId: compId, subId: subId, niveau: niveau };

    document.getElementById('rubModalTitel').textContent      = 'Rubriek bewerken';
    document.getElementById('rubNiveauBadge').textContent     = niv ? niv.label : '';
    document.getElementById('rubNiveauBadge').className       = 'rub-niveau-badge ' + (niv ? niv.klasse : '');
    document.getElementById('rubModalBeschrijving').value     = rub ? rub.beschrijving : '';
    document.getElementById('rubModal').classList.add('open');
  };

  /* Opslaan comp/sub */
  window.slaanOp = function () {
    var code   = document.getElementById('modalCode').value.trim();
    var omschr = document.getElementById('modalOmschrijving').value.trim();
    var gewicht = parseInt(document.getElementById('modalGewicht').value, 10) || 10;
    if (!code || !omschr) return;

    var opl = huidigOpl(); if (!opl) return;

    if (modalCtx.type === 'comp') {
      if (modalCtx.compId !== null) {
        var comp = opl.competenties.find(function (c) { return c.id === modalCtx.compId; });
        if (comp) { comp.code = code; comp.omschrijving = omschr; comp.gewicht = gewicht; }
      } else {
        opl.competenties.push({ id: uid(), code: code, omschrijving: omschr, gewicht: gewicht, subcompetenties: [] });
      }
      updatePanelHeader();
      renderOplLijst();
    } else if (modalCtx.type === 'sub') {
      var comp2 = opl.competenties.find(function (c) { return c.id === modalCtx.compId; });
      if (!comp2) return;
      if (modalCtx.subId !== null) {
        var sub = comp2.subcompetenties.find(function (s) { return s.id === modalCtx.subId; });
        if (sub) { sub.code = code; sub.omschrijving = omschr; }
      } else {
        comp2.subcompetenties.push({ id: uid(), code: code, omschrijving: omschr, rubriek: [] });
        openComp[modalCtx.compId] = true;
      }
    }

    sluitModal('compModal');
    renderLijst();
  };

  /* Opslaan rubriek */
  window.slaanRubOp = function () {
    var beschrijving = document.getElementById('rubModalBeschrijving').value.trim();
    var opl  = huidigOpl(); if (!opl) return;
    var comp = opl.competenties.find(function (c) { return c.id === modalCtx.compId; }); if (!comp) return;
    var sub  = comp.subcompetenties.find(function (s) { return s.id === modalCtx.subId; }); if (!sub) return;
    var niv  = NIVEAUS.find(function (n) { return n.niveau === modalCtx.niveau; });

    if (!sub.rubriek) sub.rubriek = [];
    var bestaand = sub.rubriek.find(function (r) { return r.niveau === modalCtx.niveau; });
    if (bestaand) {
      bestaand.beschrijving = beschrijving;
    } else {
      sub.rubriek.push({ niveau: modalCtx.niveau, label: niv ? niv.label : '', beschrijving: beschrijving });
      sub.rubriek.sort(function (a, b) { return a.niveau - b.niveau; });
    }

    sluitModal('rubModal');
    renderLijst();
  };

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
